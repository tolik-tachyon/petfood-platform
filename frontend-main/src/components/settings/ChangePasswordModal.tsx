import { useState } from 'react';
import { MdCheckCircle, MdCancel } from 'react-icons/md';
import { Eye, EyeOff } from 'lucide-react';
import styles from '../../styles/SettingsModals.module.css';
import inputStyles from '../../styles/InputField.module.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

type Step = 'input' | 'code' | 'success' | 'error';

type Props = {
  isOpen: boolean;
  userEmail: string;
  onClose: () => void;
};

const ChangePasswordModal = ({ isOpen, userEmail, onClose }: Props) => {
  const [step, setStep] = useState<Step>('input');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep('input');
    setNewPassword('');
    setCode('');
    setPasswordError('');
    setCodeError('');
    setShowPassword(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSavePassword = async () => {
    if (!newPassword.trim()) {
      setPasswordError('Введите новый пароль');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    setPasswordError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account/password/reset/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setPasswordError(data.message || 'Не удалось отправить код');
        return;
      }

      setStep('code');
    } catch {
      setPasswordError('Произошла ошибка. Попробуйте ещё раз');
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
      const response = await fetch(`${apiBaseUrl}/api/v1/account/password/reset/confirm`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code, newPassword }),
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
      await fetch(`${apiBaseUrl}/api/v1/account/password/reset/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
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
          <h2 className={styles.title}>Пароль успешно изменен</h2>
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
          <h2 className={styles.title}>Пароль не изменен</h2>
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
          <h2 className={styles.title}>Подтвердите</h2>
          <p className={styles.codeSubtitle}>
            Мы отправили 6-значный код на <strong>{userEmail}</strong>
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
        <h2 className={styles.title}>Изменить пароль</h2>
        <p className={styles.inputLabel}>Введите новый пароль</p>
        <div style={{ position: 'relative' }}>
          <input
            className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
            placeholder="Введите новый пароль"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            style={{ paddingRight: '40px' }}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError('');
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={inputStyles.toggleButton}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {passwordError && <p className={styles.errorText}>{passwordError}</p>}

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} onClick={handleSavePassword} disabled={loading}>
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

export default ChangePasswordModal;
