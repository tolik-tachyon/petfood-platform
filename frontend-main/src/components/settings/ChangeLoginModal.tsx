import { useState } from 'react';
import { MdCheckCircle, MdCancel } from 'react-icons/md';
import styles from '../../styles/SettingsModals.module.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

type Step = 'input' | 'code' | 'success' | 'error';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ChangeLoginModal = ({ isOpen, onClose }: Props) => {
  const [step, setStep] = useState<Step>('input');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep('input');
    setNewEmail('');
    setCode('');
    setEmailError('');
    setCodeError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSaveEmail = async () => {
    if (!newEmail.trim()) {
      setEmailError('Введите новый логин');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError('Неверный формат электронной почты');
      return;
    }

    setLoading(true);
    setEmailError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setEmailError(data.message || 'Не удалось отправить код');
        return;
      }

      setStep('code');
    } catch {
      setEmailError('Произошла ошибка. Попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async () => {
    if (!code.trim() || code.length < 6) {
      setCodeError('Введите 6-значный код');
      return;
    }

    setLoading(true);
    setCodeError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account/email/confirm-change`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, code }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setCodeError(data.message || 'Неверный код');
        setStep('error');
        return;
      }

      setStep('success');
    } catch {
      setCodeError('Произошла ошибка. Попробуйте ещё раз');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCodeError('');
    setLoading(true);
    try {
      await fetch(`${apiBaseUrl}/api/v1/account`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (step === 'success') {
    return (
      <div className={styles.overlay} onClick={handleClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.title}>Логин успешно изменен</h2>
          <div className={styles.resultIcon}>
            <div className={styles.iconSuccess}>
              <MdCheckCircle size={32} />
            </div>
          </div>
          <button className={styles.btnFullWidth} onClick={handleClose}>
            Ok
          </button>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className={styles.overlay} onClick={handleClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.title}>Логин не изменен</h2>
          <div className={styles.resultIcon}>
            <div className={styles.iconError}>
              <MdCancel size={32} />
            </div>
          </div>
          <button className={styles.btnFullWidth} onClick={handleClose}>
            Ok
          </button>
        </div>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <div className={styles.overlay} onClick={handleClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.title}>Подтвердите email</h2>
          <p className={styles.codeSubtitle}>
            Мы отправили 6-значный код на <strong>{newEmail}</strong>
          </p>

          <input
            className={`${styles.input} ${codeError ? styles.inputError : ''}`}
            placeholder="Введите код (6 цифр)"
            value={code}
            maxLength={6}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''));
              setCodeError('');
            }}
          />
          {codeError && <p className={styles.errorText}>{codeError}</p>}

          <button className={styles.btnFullWidth} onClick={handleConfirmCode} disabled={loading}>
            {loading ? 'Проверка...' : 'Подтвердить'}
          </button>

          <p className={styles.resendLabel}>Не получили код?</p>
          <button className={styles.btnFullWidth} onClick={handleResend} disabled={loading}>
            Отправить снова
          </button>

          <button className={styles.btnGhost} onClick={() => setStep('input')}>
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Изменить логин</h2>
        <p className={styles.inputLabel}>Введите новый логин</p>
        <input
          className={`${styles.input} ${emailError ? styles.inputError : ''}`}
          placeholder="Введите новый логин"
          type="email"
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value);
            setEmailError('');
          }}
        />
        {emailError && <p className={styles.errorText}>{emailError}</p>}

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} onClick={handleSaveEmail} disabled={loading}>
            {loading ? 'Отправка...' : 'Сохранить'}
          </button>
          <button className={styles.btnSecondary} onClick={handleClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeLoginModal;
