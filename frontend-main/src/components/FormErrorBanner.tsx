import styles from '../styles/FormErrorBanner.module.css';

type Props = {
  message: string;
  title?: string;
  onDismiss?: () => void;
};

export const FormErrorBanner = ({
  message,
  title = 'Не удалось выполнить расчёт',
  onDismiss,
}: Props) => (
  <div className={styles.banner} role="alert" aria-live="polite">
    <div className={styles.header}>
      <p className={styles.title}>{title}</p>
      {onDismiss && (
        <button type="button" className={styles.dismissBtn} onClick={onDismiss} aria-label="Закрыть">
          ×
        </button>
      )}
    </div>
    <p className={styles.message}>{message}</p>
  </div>
);
