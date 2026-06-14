import { usePets } from '../../context/PetContext';
import PetRegistrationDropdown from './PetRegistrationDropdown';
import styles from '../styles/PetRequestForm.module.css';

type SymptomsSelectorProps = {
  selectedSymptoms: string[];
  onSymptomsChange: (symptoms: string[]) => void;
  error?: string;
};

export const SymptomsSelector = ({ selectedSymptoms, onSymptomsChange, error }: SymptomsSelectorProps) => {
  const { symptoms, isLoadingReference, fetchReferenceData } = usePets();

  const handleSelect = (value: string) => {
    if (value && !selectedSymptoms.includes(value)) {
      onSymptomsChange([...selectedSymptoms, value]);
    }
  };

  const handleRemove = (symptom: string) => {
    onSymptomsChange(selectedSymptoms.filter(s => s !== symptom));
  };

  if (isLoadingReference) {
    return (
      <div>
        <label className={styles.label}>
          Симптомы: <span className={styles.required}>*</span>
        </label>
        <div style={{ padding: '1rem', color: '#666' }}>
          Загрузка симптомов...
        </div>
      </div>
    );
  }

  if (symptoms.length === 0) {
    return (
      <div>
        <label className={styles.label}>
          Симптомы: <span className={styles.required}>*</span>
        </label>
        <div style={{ padding: '1rem', color: '#d32f2f', backgroundColor: '#ffebee', borderRadius: '8px' }}>
          Не удалось загрузить справочник симптомов.{' '}
          <button type="button" onClick={() => fetchReferenceData()} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  const availableOptions = symptoms
    .filter(symptom => !selectedSymptoms.includes(symptom.name))
    .map(symptom => ({
      value: symptom.name,
      label: symptom.name
    }));

  return (
    <>
      <label className={styles.label}>
        Симптомы: <span className={styles.required}>*</span>
      </label>

      {error && <p className={styles.error}>{error}</p>}

      {selectedSymptoms.length > 0 && (
        <div className={styles.selectedSymptoms}>
          {selectedSymptoms.map((symptom, index) => (
            <div key={index} className={styles.symptomTag}>
              <span>{symptom}</span>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(symptom)}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <PetRegistrationDropdown
        options={availableOptions}
        value=""
        onChange={handleSelect}
        placeholder="Выберите из списка"
      />
    </>
  );
};
