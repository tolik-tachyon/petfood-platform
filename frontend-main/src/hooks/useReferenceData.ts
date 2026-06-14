import { usePets } from '../../context/PetContext';

export type ActivityType = {
  id: number;
  name: string;
  description?: string;
};

export type Symptom = {
  id: number;
  name: string;
};

/** @deprecated Prefer usePets() directly — kept for backward compatibility */
export const useReferenceData = () => {
  const { activityTypes, symptoms, isLoadingReference } = usePets();

  return {
    activityTypes,
    symptoms,
    isLoading: isLoadingReference,
    error: null,
  };
};
