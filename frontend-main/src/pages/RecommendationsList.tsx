import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../utils/apiClient';
import { Sidebar } from '../components/Sidebar';
import layoutStyles from '../styles/VetDashboard.module.css';
import styles from '../styles/RecommendationsList.module.css';

type SavedRecommendation = {
  id: string;
  healthRecordId: string;
  vetId?: string;
  createdAt: string;
};

type HealthRecord = {
  id: string;
  petId: string;
  petName?: string;
};

type RecommendationWithPet = {
  id: string;
  healthRecordId: string;
  petId: string;
  petName: string;
  createdAt: string;
};

const API_TIMEOUT_MS = 45000;

const toText = (value: unknown): string => {
  if (value == null) return '';
  return String(value);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
};

export const RecommendationsList = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationWithPet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const records = await apiClient.get<HealthRecord[]>(
        '/api/v1/pets/health-records/my',
        API_TIMEOUT_MS
      );

      if (!Array.isArray(records)) {
        throw new Error('Сервер вернул некорректный список заявок');
      }

      const results = await Promise.all(
        records.map(async (record) => {
          const recordId = toText(record.id);
          if (!recordId) return null;

          try {
            const recommendation = await apiClient.get<SavedRecommendation>(
              `/api/v1/pets/health-records/${recordId}/recommendation`,
              API_TIMEOUT_MS
            );

            const itemId = toText(recommendation.id);
            const healthRecordId = toText(recommendation.healthRecordId) || recordId;
            const createdAt = toText(recommendation.createdAt);

            if (!itemId || !createdAt) return null;

            return {
              id: itemId,
              healthRecordId,
              petId: toText(record.petId),
              petName: record.petName || 'Неизвестный питомец',
              createdAt,
            } satisfies RecommendationWithPet;
          } catch {
            return null;
          }
        })
      );

      const allRecommendations = results
        .filter((item): item is RecommendationWithPet => item !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setRecommendations(allRecommendations);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить рекомендации';
      if (message.includes('SID cookie is required')) {
        setError('Сессия истекла. Войдите в аккаунт снова.');
      } else {
        setError(message);
      }
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setIsLoading(false);
      setError('Сессия истекла. Войдите в аккаунт снова.');
      return;
    }

    loadRecommendations();
  }, [authLoading, isAuthenticated, loadRecommendations]);

  const handleViewRecommendation = (healthRecordId: string) => {
    navigate(`/recommendation/${healthRecordId}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className={styles.loading}>Загрузка...</div>;
    }

    if (error) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Не удалось загрузить данные</p>
          <p className={styles.emptySubtext}>{error}</p>
          <button
            className={styles.createButton}
            onClick={() => {
              if (error.includes('Сессия истекла')) {
                navigate('/login');
              } else {
                loadRecommendations();
              }
            }}
          >
            {error.includes('Сессия истекла') ? 'Войти' : 'Повторить'}
          </button>
        </div>
      );
    }

    if (recommendations.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Пока нет рекомендаций</p>
          <p className={styles.emptySubtext}>
            Создайте заявку на консультацию, и ветеринар подготовит индивидуальные рекомендации
          </p>
          <button
            className={styles.createButton}
            onClick={() => navigate('/create-request')}
          >
            Создать заявку
          </button>
        </div>
      );
    }

    return (
      <>
        <div className={styles.header}>
          <h1 className={styles.title}>Рекомендации</h1>
          <p className={styles.subtitle}>
            Все рекомендации ветеринара по питанию
          </p>
        </div>

        <div className={styles.grid}>
          {recommendations.map((rec) => (
            <div key={rec.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.petName}>{rec.petName}</h3>
                <span className={styles.date}>{formatDate(rec.createdAt)}</span>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.description}>
                  Индивидуальная рекомендация по питанию с детальным анализом
                </p>
              </div>

              <div className={styles.cardFooter}>
                <button
                  className={styles.viewButton}
                  onClick={() => handleViewRecommendation(rec.healthRecordId)}
                >
                  Посмотреть рекомендацию
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className={layoutStyles.container}>
      <Sidebar />
      <main className={layoutStyles.main}>
        <div className={styles.pageContent}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};
