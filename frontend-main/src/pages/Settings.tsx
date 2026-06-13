import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdChevronRight,
  MdDeleteOutline,
  MdHelp,
  MdLanguage,
  MdLockOutline,
  MdLogout,
  MdPerson,
  MdSettingsBrightness,
} from 'react-icons/md';
import { Layout } from '../../layout/Layout';
import { useAuth } from '../../context/AuthContext';
import styles from '../styles/Settings.module.css';

type SettingsItemProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick?: () => void;
  trailing?: ReactNode;
  danger?: boolean;
};

const SettingsItem = ({
  icon: Icon,
  title,
  description,
  onClick,
  trailing,
  danger = false,
}: SettingsItemProps) => (
  <button className={styles.item} type="button" onClick={onClick}>
    <span className={`${styles.itemIcon} ${danger ? styles.dangerIcon : ''}`}>
      <Icon className={styles.icon} />
    </span>
    <span className={styles.itemText}>
      <span className={styles.itemTitle}>{title}</span>
      <span className={styles.itemDescription}>{description}</span>
    </span>
    {trailing ?? <MdChevronRight className={styles.chevron} />}
  </button>
);

export const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [language, setLanguage] = useState('Русский');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const storedTheme = localStorage.getItem('settings.theme');
    const storedLanguage = localStorage.getItem('settings.language');

    if (storedTheme) {
      setIsDarkTheme(storedTheme === 'dark');
    }

    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, []);

  const showTemporaryNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const handleThemeChange = () => {
    const nextTheme = !isDarkTheme;
    setIsDarkTheme(nextTheme);
    localStorage.setItem('settings.theme', nextTheme ? 'dark' : 'standard');
  };

  const handleLanguageClick = () => {
    const nextLanguage = language === 'Русский' ? 'English' : 'Русский';
    setLanguage(nextLanguage);
    localStorage.setItem('settings.language', nextLanguage);
    showTemporaryNotice(`Язык: ${nextLanguage}`);
  };

  return (
    <Layout showSidebar={true}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Настройки</h1>
        </header>

        <section className={styles.card} aria-labelledby="account-settings-title">
          <h2 id="account-settings-title">Аккаунт</h2>
          <div className={styles.list}>
            <SettingsItem
              icon={MdPerson}
              title="Редактировать профиль"
              description="Имя пользователя, дата рождения, номер телефона, страна, город"
              onClick={() => showTemporaryNotice('Редактирование профиля будет подключено позже')}
            />
            <SettingsItem
              icon={MdLockOutline}
              title="Изменить логин и пароль"
              description="Почта и пароль пользователя"
              onClick={() => navigate('/reset-password')}
            />
            <SettingsItem
              icon={MdDeleteOutline}
              title="Удалить аккаунт"
              description="После удаления аккаунта пути назад нет. Пожалуйста, будьте уверены."
              danger
              onClick={() => showTemporaryNotice('Удаление аккаунта будет подключено после backend')}
            />
          </div>
        </section>

        <section className={styles.card} aria-labelledby="general-settings-title">
          <h2 id="general-settings-title">Общее</h2>
          <div className={styles.list}>
            <SettingsItem
              icon={MdSettingsBrightness}
              title="Тема"
              description={isDarkTheme ? 'Темная' : 'Стандартная'}
              trailing={
                <span
                  className={`${styles.switch} ${isDarkTheme ? styles.switchOn : ''}`}
                  aria-hidden="true"
                >
                  <span className={styles.switchThumb} />
                </span>
              }
              onClick={handleThemeChange}
            />
            <SettingsItem
              icon={MdLanguage}
              title="Язык"
              description={language}
              onClick={handleLanguageClick}
            />
            <SettingsItem
              icon={MdHelp}
              title="Помощь"
              description="Сведения и вопросы о платформе"
              onClick={() => showTemporaryNotice('Раздел помощи будет добавлен позже')}
            />
          </div>
        </section>

        <div className={styles.footer}>
          <button className={styles.logoutButton} type="button" onClick={logout}>
            <MdLogout className={styles.logoutIcon} />
            Выйти из аккаунта
          </button>
          {notice && <p className={styles.notice}>{notice}</p>}
        </div>
      </div>
    </Layout>
  );
};
