import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditIcon from '../assets/icons/edit.svg?react';
import { Layout } from '../../layout/Layout';
import { useAuth } from '../../context/AuthContext';
import ProfileIcon from '../assets/icons/profile.svg?react';
import styles from '../styles/Profile.module.css';

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

  // Мок-данные для полей, которых пока нет в AuthContext
  const phone = '+7 777 777 7777';
  const birthDate = '1 января 2000';
  const country = 'Казахстан';
  const city = 'Астана';

  const fullName = `${user?.firstName ?? 'Александр'} ${user?.lastName ?? 'Соколов'}`;
  const email = user?.email ?? 'user26@gmail.com';

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
              <span className={styles.infoValue}>{phone}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дата рождения</span>
              <span className={styles.infoValue}>{birthDate}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Страна</span>
              <span className={styles.infoValue}>{country}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Город</span>
              <span className={styles.infoValue}>{city}</span>
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
