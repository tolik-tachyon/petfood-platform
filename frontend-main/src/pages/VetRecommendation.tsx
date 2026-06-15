import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRequests } from '../../context/RequestContext';
import { vetService } from '../../services/vetService';
import { usePets } from '../../context/PetContext';
import { calculatePetAge } from '../utils/petAgeHelper';
import { resolveBreedNameToEnglish } from '../utils/breedNameHelper';
import { INGREDIENT_CATEGORIES } from '../../data/mockData';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { PetInfoCard } from '../components/PetInfoCard';
import { DiseaseSelector } from '../components/DiseaseSelector';
import { CalorieCalculator } from '../components/CalorieCalculator';
import { IngredientSelector } from '../components/IngredientSelector';
import { NutrientRanges } from '../components/NutrientRanges';
import { MaximizationOptions } from '../components/MaximizationOptions';
import { FormErrorBanner } from '../components/FormErrorBanner';
import styles from '../styles/VetRecommendation.module.css';

import type {
  DisorderRecommendation,
  NutrientRangesType,
  IngredientRangesType
} from '../types/vetRecommendation';

const DEFAULT_NUTRIENT_RANGES: NutrientRangesType = {
  moisture: { min: 65, max: 90 },
  protein: { min: 10, max: 65 },
  carbs: { min: 10, max: 20 },
  fats: { min: 5, max: 10 }
};

const NUTRIENT_RANGE_MARGIN = 5;

export const VetRecommendation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addRecommendationToRequest } = useRequests();
  const { breeds, isLoadingReference, pets } = usePets();

  const request = location.state?.request || null;
  const [error, setError] = useState<string | null>(null);
  const [englishBreedName, setEnglishBreedName] = useState<string>('');

  const [diseases, setDiseases] = useState<string[]>([]);
  const [isLoadingDiseases, setIsLoadingDiseases] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState('');

  const [dailyKcal, setDailyKcal] = useState<number | null>(null);
  const [targetKcal, setTargetKcal] = useState<number>(0);
  const [initialKcal, setInitialKcal] = useState<number>(0);
  const [isCalculatingKcal, setIsCalculatingKcal] = useState(false);

  const [disorderRecommendation, setDisorderRecommendation] = useState<DisorderRecommendation | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);
  const [showIngredientForm, setShowIngredientForm] = useState(false);

  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientRanges, setIngredientRanges] = useState<IngredientRangesType>({});
  const [nutrientRanges, setNutrientRanges] = useState<NutrientRangesType>(DEFAULT_NUTRIENT_RANGES);
  const [maximizeNutrients, setMaximizeNutrients] = useState<string[]>([]);

  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [diseasesLoadError, setDiseasesLoadError] = useState<string | null>(null);
  const [kcalError, setKcalError] = useState<string | null>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const kcalChanged = targetKcal !== initialKcal;

  const showActionError = (message: string) => {
    setCalculationError(message);
    requestAnimationFrame(() => {
      errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  useEffect(() => {
    if (!request) {
      setError('Запрос не найден');
      return;
    }

    if (isLoadingReference) {
      return;
    }

    const breedName =
      request.petBreed ||
      request.breedName ||
      pets.find(p => p.id === request.petId)?.breedName;

    if (!breedName) {
      setEnglishBreedName('');
      return;
    }

    const englishName = resolveBreedNameToEnglish(breedName, breeds);
    setEnglishBreedName(englishName || '');
  }, [request, breeds, pets, isLoadingReference]);

  useEffect(() => {
    if (!englishBreedName) {
      setDiseases([]);
      setIsLoadingDiseases(false);
      return;
    }

    const loadDiseases = async () => {
      setIsLoadingDiseases(true);
      setDiseases([]);
      setDiseasesLoadError(null);

      try {
        const diseaseList = await vetService.getBreedDiseases(englishBreedName);
        setDiseases(diseaseList);
      } catch (err) {
        setDiseases([]);
        setDiseasesLoadError(
          err instanceof Error ? err.message : 'Не удалось загрузить список заболеваний для породы'
        );
      } finally {
        setIsLoadingDiseases(false);
      }
    };

    loadDiseases();
  }, [englishBreedName]);

  useEffect(() => {
    if (!englishBreedName || !request) {
      return;
    }

    const calculateDailyKcal = async () => {
      setIsCalculatingKcal(true);
      setKcalError(null);

      try {
        const petAge = request.birthDate ? calculatePetAge(request.birthDate) : 2;
        const activityLevel = getActivityLevel(request.activityTypeName);

        const result = await vetService.calculateCalories({
          weight: request.weightKg,
          age: petAge,
          age_metric: 'years',
          gender: request.gender || 'male',
          breed: englishBreedName,
          activity_level: activityLevel
        });

        const calculatedKcal = Math.round(result.daily_kcal);
        setDailyKcal(calculatedKcal);
        setTargetKcal(calculatedKcal);
        setInitialKcal(calculatedKcal);
      } catch (err) {
        setDailyKcal(null);
        setKcalError(err instanceof Error ? err.message : 'Не удалось рассчитать калории');
      } finally {
        setIsCalculatingKcal(false);
      }
    };

    calculateDailyKcal();
  }, [englishBreedName, request]);

  const getActivityLevel = (activityTypeName: string): 'passive' | 'moderate' | 'active' => {
    const name = activityTypeName.toLowerCase();
    if (name.includes('низк')) return 'passive';
    if (name.includes('средн')) return 'moderate';
    return 'active';
  };

  const handleRecalculateNutrients = async () => {
    if (!request || !targetKcal || !englishBreedName) return;

    setKcalError(null);

    try {
      const petAge = request.birthDate ? calculatePetAge(request.birthDate) : 2;
      const activityLevel = getActivityLevel(request.activityTypeName);

      await vetService.calculateNutrients({
        weight: request.weightKg,
        age: petAge,
        age_metric: 'years',
        gender: request.gender || 'male',
        breed: englishBreedName,
        activity_level: activityLevel,
        target_kcal: targetKcal
      });

      setInitialKcal(targetKcal);
    } catch (err) {
      setKcalError(err instanceof Error ? err.message : 'Не удалось пересчитать нутриенты');
    }
  };

  const handleDiseaseSelect = (disease: string) => {
    setSelectedDisease(disease);
    setCalculationError(null);
    if (!disease) {
      setShowIngredientForm(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!selectedDisease || !request || !englishBreedName) return;

    setIsLoadingRecommendation(true);
    setCalculationError(null);

    try {
      const recommendation = await vetService.getDisorderRecommendations({
        breed: englishBreedName,
        disorder: selectedDisease
      });

      setDisorderRecommendation(recommendation);
      populateRecommendedIngredients(recommendation);
      setNutrientRangesFromPredicted(recommendation.predicted_nutrients);
      setShowIngredientForm(true);
    } catch (err) {
      showActionError(
        err instanceof Error ? err.message : 'Не удалось получить рекомендации'
      );
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  const populateRecommendedIngredients = (recommendation: DisorderRecommendation) => {
    const newIngredients = recommendation.recommended_ingredients;
    setSelectedIngredients(newIngredients);

    const newRanges: IngredientRangesType = {};
    newIngredients.forEach(ingredient => {
      newRanges[ingredient] = { min: 0, max: 100 };
    });
    setIngredientRanges(newRanges);
  };

  const setNutrientRangesFromPredicted = (predicted: DisorderRecommendation['predicted_nutrients']) => {
    setNutrientRanges({
      moisture: {
        min: Math.max(0, (predicted.moisture || 10) - NUTRIENT_RANGE_MARGIN),
        max: Math.min(100, (predicted.moisture || 35) + NUTRIENT_RANGE_MARGIN)
      },
      protein: {
        min: Math.max(0, predicted.protein - NUTRIENT_RANGE_MARGIN),
        max: Math.min(100, predicted.protein + NUTRIENT_RANGE_MARGIN)
      },
      carbs: {
        min: Math.max(0, predicted['carbohydrate (nfe)'] - NUTRIENT_RANGE_MARGIN),
        max: Math.min(100, predicted['carbohydrate (nfe)'] + NUTRIENT_RANGE_MARGIN)
      },
      fats: {
        min: Math.max(0, predicted.fat - NUTRIENT_RANGE_MARGIN),
        max: Math.min(100, predicted.fat + NUTRIENT_RANGE_MARGIN)
      }
    });
  };

  const toggleIngredient = (ingredient: string) => {
    if (selectedIngredients.includes(ingredient)) {
      setSelectedIngredients(prev => prev.filter(i => i !== ingredient));
      setIngredientRanges(prev => {
        const newRanges = { ...prev };
        delete newRanges[ingredient];
        return newRanges;
      });
    } else {
      setSelectedIngredients(prev => [...prev, ingredient]);
      setIngredientRanges(prev => ({
        ...prev,
        [ingredient]: { min: 0, max: 100 }
      }));
    }
  };

  const updateIngredientRange = (ingredient: string, type: 'min' | 'max', value: number) => {
    setIngredientRanges(prev => ({
      ...prev,
      [ingredient]: {
        ...prev[ingredient],
        [type]: value
      }
    }));
  };

  const updateNutrientRange = (nutrient: keyof NutrientRangesType, type: 'min' | 'max', value: number) => {
    setNutrientRanges(prev => ({
      ...prev,
      [nutrient]: {
        ...prev[nutrient],
        [type]: value
      }
    }));
  };

  const toggleMaximizeNutrient = (nutrient: string) => {
    setMaximizeNutrients(prev =>
      prev.includes(nutrient)
        ? prev.filter(n => n !== nutrient)
        : [...prev, nutrient]
    );
  };

  const handleCalculate = async () => {
    if (!request || selectedIngredients.length === 0 || !englishBreedName) {
      showActionError('Выберите хотя бы один ингредиент');
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      const petAge = request.birthDate ? calculatePetAge(request.birthDate) : 2;

      const ingredient_ranges = Object.entries(ingredientRanges).map(([ingredient, range]) => ({
        ingredient,
        min_percent: range.min,
        max_percent: range.max
      }));

      const nutrient_ranges = [
        { nutrient: 'Влага', min_value: nutrientRanges.moisture.min, max_value: nutrientRanges.moisture.max },
        { nutrient: 'Белки', min_value: nutrientRanges.protein.min, max_value: nutrientRanges.protein.max },
        { nutrient: 'Углеводы', min_value: nutrientRanges.carbs.min, max_value: nutrientRanges.carbs.max },
        { nutrient: 'Жиры', min_value: nutrientRanges.fats.min, max_value: nutrientRanges.fats.max }
      ];

      const optimizationResult = await vetService.optimizeRecipe({
        weight: request.weightKg,
        age: petAge,
        breed: englishBreedName,
        ingredients: selectedIngredients,
        ingredient_ranges,
        nutrient_ranges,
        maximize_nutrients: maximizeNutrients,
        target_kcal: targetKcal
      });

      const recommendation = {
        disease: selectedDisease,
        targetKcal,
        ingredients: selectedIngredients,
        ingredientRanges: ingredient_ranges,
        nutrientRanges: nutrient_ranges,
        maximizeNutrients,
        optimizationResult
      };

      await addRecommendationToRequest(request.id, recommendation);

      navigate(`/vet/recommendation/${request.id}/view`, {
        state: {
          request,
          recommendation,
          shouldRefreshDashboard: true
        }
      });
    } catch (err) {
      showActionError(
        err instanceof Error ? err.message : 'Не удалось рассчитать оптимальный состав'
      );
    } finally {
      setIsCalculating(false);
    }
  };

  if (error || !request) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.errorContainer}>
            {error || 'Запрос не найден'}
            <button
              onClick={() => navigate('/vet/dashboard')}
              className={styles.backToListBtn}
            >
              Назад к списку
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.headerCard}>
          <button className={styles.backBtn} onClick={() => navigate('/vet/dashboard')}>
            <MdKeyboardArrowLeft className={styles.backIcon} />
            Назад
          </button>
          <h1 className={styles.title}>Запись</h1>
        </div>

        <PetInfoCard request={request} />

        {calculationError && (
          <div ref={errorBannerRef}>
            <FormErrorBanner
              message={calculationError}
              onDismiss={() => setCalculationError(null)}
            />
          </div>
        )}

        <DiseaseSelector
          englishBreedName={englishBreedName}
          isLoadingBreed={isLoadingReference}
          diseases={diseases}
          isLoadingDiseases={isLoadingDiseases}
          selectedDisease={selectedDisease}
          onDiseaseSelect={handleDiseaseSelect}
          onGetRecommendations={handleGetRecommendations}
          isLoadingRecommendation={isLoadingRecommendation}
          showIngredientForm={showIngredientForm}
          loadError={diseasesLoadError}
        />

        {showIngredientForm && disorderRecommendation && (
          <div className={styles.card}>
            <CalorieCalculator
              targetKcal={targetKcal}
              onTargetKcalChange={setTargetKcal}
              dailyKcal={dailyKcal}
              kcalChanged={kcalChanged}
              isCalculatingKcal={isCalculatingKcal}
              onRecalculate={handleRecalculateNutrients}
              errorMessage={kcalError}
            />

            <IngredientSelector
              categories={INGREDIENT_CATEGORIES}
              selectedIngredients={selectedIngredients}
              recommendedIngredients={disorderRecommendation.recommended_ingredients}
              ingredientRanges={ingredientRanges}
              onToggleIngredient={toggleIngredient}
              onUpdateRange={updateIngredientRange}
              onClearAll={() => setSelectedIngredients([])}
            />

            {selectedIngredients.length > 0 && (
              <>
                <NutrientRanges
                  nutrientRanges={nutrientRanges}
                  onUpdateRange={updateNutrientRange}
                />

                <MaximizationOptions
                  maximizeNutrients={maximizeNutrients}
                  onToggle={toggleMaximizeNutrient}
                />

                <button
                  onClick={handleCalculate}
                  className={styles.calculateBtn}
                  disabled={isCalculating || selectedIngredients.length === 0}
                >
                  {isCalculating ? 'Расчет...' : 'Рассчитать оптимальный состав'}
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};