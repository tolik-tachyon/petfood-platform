import styles from '../styles/CalorieCalculator.module.css';

type CalorieCalculatorProps = {
  targetKcal: number;
  onTargetKcalChange: (value: number) => void;
  dailyKcal: number | null;
  kcalChanged: boolean;
  isCalculatingKcal: boolean;
  onRecalculate: () => void;
  errorMessage?: string | null;
};

export const CalorieCalculator = ({
  targetKcal,
  onTargetKcalChange,
  dailyKcal,
  kcalChanged,
  isCalculatingKcal,
  onRecalculate,
  errorMessage = null,
}: CalorieCalculatorProps) => {
  return (
    <>
      <h2 className={styles.sectionTitle}>Целевая энергия (ккал)</h2>
      {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
      <div className={styles.calorieContainer}>
        <input
          type="number"
          value={targetKcal}
          onChange={(e) => onTargetKcalChange(Number(e.target.value))}
          className={styles.kcalInput}
          min="0"
          step="100"
          disabled={isCalculatingKcal}
        />
        {dailyKcal && (
          <span className={styles.recommendedText}>
            Рекомендуемая: {dailyKcal} ккал
          </span>
        )}
        {kcalChanged && (
          <button
            onClick={onRecalculate}
            className={styles.recalculateBtn}
          >
            Пересчитать
          </button>
        )}
      </div>
    </>
  );
};