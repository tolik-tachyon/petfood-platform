import { usePets } from '../../context/PetContext';
import PetRegistrationDropdown from './PetRegistrationDropdown';
import styles from '../styles/PetRequestForm.module.css';

type ActivityDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export const ActivityDropdown = ({ value, onChange, error }: ActivityDropdownProps) => {
  const { activityTypes, isLoadingReference, fetchReferenceData } = usePets();

  if (isLoadingReference) {
    return (
      <div className={styles.section}>
        <label className={styles.label}>
          Активность: <span className={styles.required}>*</span>
        </label>
        <div style={{ padding: '1rem', color: '#666' }}>
          Загрузка...
        </div>
      </div>
    );
  }

  if (activityTypes.length === 0) {
    return (
      <div className={styles.section}>
        <label className={styles.label}>
          Активность: <span className={styles.required}>*</span>
        </label>
        <div style={{ padding: '1rem', color: '#d32f2f', backgroundColor: '#ffebee', borderRadius: '8px' }}>
          Не удалось загрузить справочник активности.{' '}
          <button type="button" onClick={() => fetchReferenceData()} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  const activityOptions = [
    { value: '', label: 'Выберите из списка' },
    ...activityTypes.map(type => ({
      value: type.name,
      label: type.name
    }))
  ];

  return (
    <div className={styles.section}>
      <label className={styles.label}>
        Активность: <span className={styles.required}>*</span>
      </label>
      <PetRegistrationDropdown
        options={activityOptions}
        value={value}
        onChange={onChange}
        placeholder="Выберите из списка"
        error={error}
      />
    </div>
  );
};
