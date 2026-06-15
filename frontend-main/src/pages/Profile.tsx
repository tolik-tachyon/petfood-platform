import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditIcon from '../assets/icons/edit.svg?react';
import { Layout } from '../../layout/Layout';
import { useAuth } from '../../context/AuthContext';
import ProfileIcon from '../assets/icons/profile.svg?react';
import styles from '../styles/Profile.module.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type ActivityItem = {
  id: string;
  date: string;
  title: string;
  description: string;
};

const ACTIVITY_HISTORY: ActivityItem[] = [
  {
    id: '1',
    date: '24.01.2026',
    title: 'Добавление питомца',
    description:
      'Лаки / 12 лет / Немецкая овчарка / Активный / Служебная собака, работает в региональной полиции Казахстана и ...',
  },
  {
    id: '2',
    date: '13.01.2026',
    title: 'Редактирование корма',
    description:
      'Пауч Royal Canine для щенков с курицей / коммерческий / влажный / для щенков / корм подходит при симптомах ...',
  },
  {
    id: '3',
    date: '09.01.2026',
    title: 'Редактирование профиля питомца',
    description: 'Алекс / 1 год / Золотой ретривер / Пасивный / живет на территории частного дома',
  },
  {
    id: '4',
    date: '02.01.2026',
    title: 'Добавление питомца',
    description: 'Алекс / 1 год / Золотой ретривер / Активный / живет на территории частного дома',
  },
  {
    id: '5',
    date: '28.12.2025',
    title: 'Создание рекомендации',
    description:
      'Рекомендация по корму для Лаки / на основе анализа состояния здоровья и возраста питомца ...',
  },
];

const PAGE_SIZE = 3;

export const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/account/profile/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) return;

        const data = await response.json();

        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setPhone(data.phone ?? '');
        setBirthDate(data.birthDate ?? '');
        setCountry(data.country ?? '');
        setCity(data.city ?? '');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const fullName = `${firstName || user?.firstName || ''} ${lastName || user?.lastName || ''}`.trim();
  const email = user?.email ?? 'user26@gmail.com';

  const formatBirthDate = (value: string) => {
    if (!value) return 'Не указано';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const display = (value: string) => value || 'Не указано';

  const visibleActivity = ACTIVITY_HISTORY.slice(0, visibleCount);
  const hasMore = visibleCount < ACTIVITY_HISTORY.length;

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, ACTIVITY_HISTORY.length));
  };

  return (
    <Layout showSidebar={true}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerSpacer} />
          <h1 className={styles.headerTitle}>Мой профиль</h1>
          <button className={styles.editBtn} onClick={() => navigate('/settings/edit-profile')}>
            <EditIcon size={16} />
            Изменить
          </button>
        </header>

        {loading && <p style={{ color: '#888', fontSize: 13, margin: '0 0 12px' }}>Загрузка...</p>}

        <div className={styles.card}>
          <div className={styles.avatarFrame}>
            <ProfileIcon className={styles.avatarIcon} width={96} height={96} />
          </div>

          <div className={styles.infoBlock}>
            <h2 className={styles.fullName}>{fullName}</h2>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>e-mail</span>
              <span className={styles.infoValue}>{email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Телефон</span>
              <span className={styles.infoValue}>{display(phone)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дата рождения</span>
              <span className={styles.infoValue}>{formatBirthDate(birthDate)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Страна</span>
              <span className={styles.infoValue}>{display(country)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Город</span>
              <span className={styles.infoValue}>{display(city)}</span>
            </div>
          </div>
        </div>

        <div className={styles.activityCard}>
          <h3 className={styles.activityTitle}>История активности</h3>

          {visibleActivity.map((item) => (
            <div key={item.id} className={styles.activityItem}>
              <span className={styles.activityDate}>{item.date}</span>
              <div className={styles.activityContent}>
                <p className={styles.activityName}>{item.title}</p>
                <p className={styles.activityDesc}>{item.description}</p>
              </div>
            </div>
          ))}

          {hasMore && (
            <button className={styles.showMoreBtn} onClick={handleShowMore}>
              Показать больше
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};
