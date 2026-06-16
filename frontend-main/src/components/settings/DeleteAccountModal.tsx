import { useState } from 'react';
import { MdCheckCircle } from 'react-icons/md';
import styles from '../../styles/SettingsModals.module.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

type Props = {
  isOpen: boolean;
  userEmail: string;
  onClose: () => void;
  onDeleted: () => void;
};

const DeleteAccountModal = ({ isOpen, userEmail, onClose, onDeleted }: Props) => {
  const [loginInput, setLoginInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isConfirmed = loginInput.trim() === userEmail;

  const handleDelete = async () => {
    if (!isConfirmed) {
      setError('Логин не совпадает');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Не удалось удалить аккаунт');
      }

      onDeleted();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка. Попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLoginInput('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Удаление аккаунта</h2>
        <p className={styles.subtitle}>
          Вы уверены, что хотите удалить аккаунт?
          <br />
          Это действие нельзя отменить.
        </p>

        <p className={styles.inputLabel}>
          Введите свой логин <strong>{userEmail}</strong>, чтобы удалить аккаунт
        </p>
        <input
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          placeholder="Введите логин"
          value={loginInput}
          onChange={(e) => {
            setLoginInput(e.target.value);
            setError('');
          }}
        />
        {isConfirmed && !error && (
          <div className={styles.validRow}>
            <MdCheckCircle size={16} />
            Подтверждено
          </div>
        )}
        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.btnRow}>
          <button
            className={styles.btnPrimary}
            onClick={handleDelete}
            disabled={loading || !isConfirmed}
          >
            {loading ? 'Удаление...' : 'Удалить'}
          </button>
          <button className={styles.btnSecondary} onClick={handleClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
