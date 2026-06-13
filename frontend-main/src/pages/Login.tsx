import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InputField from '../components/InputField';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import styles from '../styles/Auth.module.css';

const Login = () => {
  const { loginAction } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email.trim() || !password.trim()) {
      setLoginError('*Пожалуйста, заполните все поля');
      return;
    }

    setIsLoading(true);

    try {
      await loginAction({ email, password });
    } catch (err: any) {
      const errorMessage = ['Invalid credentials', 'Validation failed'].includes(err.message)
      ? '*Неверный адрес электронной почты или пароль'
      : (err.message || '*Неверный адрес электронной почты или пароль');

      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authFormContainer}>
          <h2>Вход</h2>

          <form onSubmit={handleSubmit} noValidate>
            <InputField
              label="Email"
              type="email"
              placeholder="Введите"
              value={email}
              onChange={(value) => {
                setEmail(value);
                if (loginError) setLoginError('');
              }}
            />

            <InputField
              label="Пароль"
              type="password"
              placeholder="Введите"
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (loginError) setLoginError('');
              }}
              error={loginError}
            />

            <div className={styles.forgotPassword}>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className={styles.forgotPasswordLink}
              >
                Забыли пароль?
              </button>
            </div>

            <button
              type="submit"
              className={styles.btn}
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>

            <div className={styles.links}>
              <span>Еще нет аккаунта?</span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className={styles.link}
              >
                Зарегистрироваться
              </button>
            </div>
          </form>

          <ForgotPasswordModal
            isOpen={isForgotPasswordOpen}
            onClose={() => setIsForgotPasswordOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
