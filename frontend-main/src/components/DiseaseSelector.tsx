import { Dropdown } from './Dropdown';
import styles from '../styles/DiseaseSelector.module.css';

type DiseaseSelectorProps = {
  englishBreedName: string;
  isLoadingBreed?: boolean;
  diseases: string[];
  isLoadingDiseases: boolean;
  selectedDisease: string;
  onDiseaseSelect: (disease: string) => void;
  onGetRecommendations: () => void;
  isLoadingRecommendation: boolean;
  showIngredientForm: boolean;
};

export const DiseaseSelector = ({
  englishBreedName,
  isLoadingBreed = false,
  diseases,
  isLoadingDiseases,
  selectedDisease,
  onDiseaseSelect,
  onGetRecommendations,
  isLoadingRecommendation,
  showIngredientForm
}: DiseaseSelectorProps) => {
  const diseaseOptions = diseases.map(disease => ({
    value: disease,
    label: disease
  }));

  const handleChange = (value: string | string[]) => {
    onDiseaseSelect(value as string);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>Заболевание</h2>

      {!englishBreedName ? (
        isLoadingBreed ? (
          <div className={styles.loadingText}>Определение породы...</div>
        ) : (
          <div className={styles.errorText}>Не удалось определить породу</div>
        )
      ) : isLoadingDiseases ? (
        <div className={styles.loadingText}>Загрузка заболеваний...</div>
      ) : diseases.length === 0 ? (
        <div className={styles.errorText}>Не удалось загрузить список заболеваний</div>
      ) : (
        <>
          <Dropdown
            options={diseaseOptions}
            value={selectedDisease}
            onChange={handleChange}
            placeholder="Выберите заболевание"
          />

          {selectedDisease && !showIngredientForm && (
            <button
              onClick={onGetRecommendations}
              className={styles.createRecommendationBtn}
              disabled={isLoadingRecommendation}
            >
              {isLoadingRecommendation ? 'Загрузка...' : 'Составить рекомендации'}
            </button>
          )}
        </>
      )}
    </div>
  );
};