import { useContext, createContext, useState, ReactNode } from "react";
import { apiClient } from "../src/utils/apiClient";
import { usePets } from "./PetContext";
import { getActivityTypeId, getSymptomIdsFromNames } from "../src/const/petMappings";

export type OptimizationResult = {
  success: boolean;
  composition: Array<{
    ingredient: string;
    grams_per_100g: number;
  }>;
  nutritional_value_per_100g: Array<{
    nutrient: string;
    value_per_100g: number;
    unit: string;
  }>;
  energy_per_100g: number;
  total_feed_grams: number;
  ingredients_required: { [key: string]: number };
  nutritional_value_total: Array<{
    nutrient: string;
    value_per_100g: number;
    unit: string;
  }>;
  nutrient_deficiencies: { [key: string]: string };
  method: string;
};

export type Recommendation = {
  disease: string;
  targetKcal: number;
  ingredients: string[];
  ingredientRanges: Array<{
    ingredient: string;
    min_percent: number;
    max_percent: number;
  }>;
  nutrientRanges: Array<{
    nutrient: string;
    min_value: number;
    max_value: number;
  }>;
  maximizeNutrients: string[];
  optimizationResult: OptimizationResult;
  createdAt: string;
};

export type PetRequest = {
  id: string;
  petId: string;
  petName: string,
  ownerId: string;
  ownerName: string;
  activityTypeName: string;
  symptoms: string[];
  comments: string;
  weightKg: number;
  createdAt: string;
  recommendation?: Recommendation;
};

type CreateRequestPayload = Pick<PetRequest, 'petId' | 'activityTypeName' | 'symptoms' | 'comments' | 'weightKg'>;

type RequestContextType = {
  requests: PetRequest[];
  addRequest: (request: CreateRequestPayload) => Promise<string>;
  updateRequest: (requestId: string, petId: string, data: Pick<PetRequest, 'activityTypeName' | 'symptoms'>) => Promise<void>;
  getRequestsByPetId: (petId: string) => PetRequest[];
  fetchRequestsByPetId: (petId: string) => Promise<void>;
  fetchRequestById: (requestId: string) => Promise<PetRequest>;
  addRecommendationToRequest: (requestId: string, recommendation: Omit<Recommendation, 'createdAt'>) => Promise<void>;
  isLoading: boolean;
};

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const RequestProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<PetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { activityTypes, symptoms, isLoadingReference } = usePets();

  const fetchRequestsByPetId = async (petId: string): Promise<void> => {
    if (!petId) return;

    setIsLoading(true);
    try {
      const data = await apiClient.get<PetRequest[]>(`/api/v1/pets/${petId}/health-records`);

      setRequests(prev => {
        const filtered = prev.filter(req => req.petId !== petId);
        return [...filtered, ...data];
      });
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequestById = async (requestId: string): Promise<PetRequest> => {
    setIsLoading(true);
    try {
      const existingRequest = requests.find(r => r.id === requestId);
      if (existingRequest) {
        setIsLoading(false);
        return existingRequest;
      }

      const data = await apiClient.get<PetRequest>(`/api/v1/health-records/${requestId}`);

      setRequests(prev => {
        const exists = prev.some(r => r.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });

      return data;
    } catch (error) {
      console.error('Failed to fetch request:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addRequest = async (requestData: CreateRequestPayload): Promise<string> => {
    try {
      if (isLoadingReference) {
        throw new Error('Справочные данные ещё загружаются. Подождите и попробуйте снова.');
      }

      const activityTypeId = getActivityTypeId(requestData.activityTypeName, activityTypes);
      const symptomIds = getSymptomIdsFromNames(requestData.symptoms, symptoms);

      if (!activityTypeId) {
        throw new Error('Недопустимый уровень активности');
      }

      if (symptomIds.length === 0) {
        throw new Error('Необходимо выбрать хотя бы один симптом');
      }

      const payload = {
        activityTypeId: activityTypeId,
        symptomIds: symptomIds,
        comments: requestData.comments || '',
        weightKg: requestData.weightKg,
      };

      const response = await apiClient.post<PetRequest>(
        `/api/v1/pets/${requestData.petId}/health-records`,
        payload
      );

      setRequests((prev) => [...prev, response]);

      return response.id;
    } catch (error) {
      console.error('Failed to create request:', error);
      throw error;
    }
  };

  const updateRequest = async (
    requestId: string,
    petId: string,
    data: Pick<PetRequest, 'activityTypeName' | 'symptoms'>
  ): Promise<void> => {
    try {
      if (isLoadingReference) {
        throw new Error('Справочные данные ещё загружаются. Подождите и попробуйте снова.');
      }

      const activityTypeId = getActivityTypeId(data.activityTypeName, activityTypes);
      const symptomIds = getSymptomIdsFromNames(data.symptoms, symptoms);

      if (!activityTypeId) throw new Error('Недопустимый уровень активности');
      if (symptomIds.length === 0) throw new Error('Необходимо выбрать хотя бы один симптом');

      const payload = { activityTypeId, symptomIds };

      const response = await apiClient.patch<PetRequest>(
        `/api/v1/pets/${petId}/health-records/${requestId}`,
        payload
      );

      setRequests(prev =>
        prev.map(req => req.id === requestId ? { ...req, ...response } : req)
      );
    } catch (error) {
      console.error('Failed to update request:', error);
      throw error;
    }
  };

  const addRecommendationToRequest = async (
    requestId: string,
    recommendation: Omit<Recommendation, 'createdAt'>
  ): Promise<void> => {
    try {
      const updatedRecommendation: Recommendation = {
        ...recommendation,
        createdAt: new Date().toISOString()
      };

      setRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, recommendation: updatedRecommendation }
            : req
        )
      );

      await apiClient.post(`/api/v1/pets/health-records/${requestId}/recommendation`, {
        payload: recommendation.optimizationResult
      });

      console.log('Recommendation added to request:', requestId, updatedRecommendation);
    } catch (error) {
      console.error('Failed to add recommendation:', error);
      throw error;
    }
  };

  const getRequestsByPetId = (petId: string): PetRequest[] => {
    return requests
      .filter(req => req.petId === petId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  return (
    <RequestContext.Provider value={{
      requests,
      addRequest,
      updateRequest,
      getRequestsByPetId,
      fetchRequestsByPetId,
      fetchRequestById,
      addRecommendationToRequest,
      isLoading
    }}>
      {children}
    </RequestContext.Provider>
  );
};

export const useRequests = (): RequestContextType => {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error("useRequests must be used within a RequestProvider");
  }
  return context;
};