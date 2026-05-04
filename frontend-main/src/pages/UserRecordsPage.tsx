import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { apiClient } from '../../src/utils/apiClient';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import Calendar from '../components/Calendar';
import styles from '../styles/VetDashboard.module.css';

const getPhotoDownloadUrl = async (objectKey: string): Promise<string> => {
  try {
    const data = await apiClient.get<{ url: string; objectKey: string }>(
      `/api/v1/pets/photos/download-url?objectKey=${encodeURIComponent(objectKey)}`
    );
    return data.url;
  } catch (error) {
    console.error('Failed to get photo download URL:', error);
    return '';
  }
};

export type VetPetRequest = {
  id: string;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petPhoto?: string;
  photoObjectKey?: string;
  ownerId: string;
  ownerName: string;
  activityTypeName: string;
  symptoms: string[];
  comments: string;
  weightKg: number;
  createdAt: string;
  hasRecommendation: boolean;
  recommendation?: any;
};

type StatusFilter = 'all' | 'completed' | 'in-progress';

export const VetDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [requests, setRequests] = useState<VetPetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      fetchAllRequests();
    }
  }, [user?.id]);

  useEffect(() => {
    const shouldRefresh = location.state?.refresh;
    const timestamp = location.state?.timestamp;

    if (shouldRefresh && user?.id) {
      fetchAllRequests();

      navigate(location.pathname, {
        replace: true,
        state: {}
      });
    }
  }, [location.state?.timestamp, user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllRequests = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get<VetPetRequest[]>('/api/v1/pets/health-records/my');

      const enrichedData = await Promise.all(
        data.map(async (record) => {
          try {
            await apiClient.get(`/api/v1/pets/health-records/${record.id}/recommendation`);
            return { ...record, hasRecommendation: true };
          } catch {
            return { ...record, hasRecommendation: false };
          }
        })
      );

      const requestsWithPhotos = await Promise.all(
        enrichedData.map(async (record) => {
          if (record.photoObjectKey) {
            const photoUrl = await getPhotoDownloadUrl(record.photoObjectKey);
            return { ...record, petPhoto: photoUrl };
          }
          return record;
        })
      );

      setRequests(requestsWithPhotos);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Не удалось загрузить запросы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendationClick = (request: VetPetRequest) => {
    if (request.hasRecommendation) {
      navigate(`/vet/recommendation/${request.id}/detail`, {
        state: { request }
      });
    } else {
      navigate(`/vet/recommendation/${request.id}`, {
        state: { request }
      });
    }
  };

  const handleDateRangeChange = (range: { start: string; end: string }) => {
    setDateRange(range);
  };

  const handleClearDate = () => {
    setDateRange(null);
  };

  const handleFilterSelect = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setIsFilterDropdownOpen(false);
  };

  let filteredRequests = requests;

  if (statusFilter === 'completed') {
    filteredRequests = filteredRequests.filter(req => req.hasRecommendation);
  } else if (statusFilter === 'in-progress') {
    filteredRequests = filteredRequests.filter(req => !req.hasRecommendation);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredRequests = filteredRequests.filter(req => {
      const petName = req.petName?.toLowerCase() || '';
      const ownerName = req.ownerName?.toLowerCase() || '';
      const symptoms = req.symptoms.join(' ').toLowerCase();

      return petName.includes(query) ||
             ownerName.includes(query) ||
             symptoms.includes(query);
    });
  }

  if (dateRange) {
    filteredRequests = filteredRequests.filter(req => {
      const recDate = new Date(req.createdAt);
      const startDate = new Date(dateRange.start + 'T00:00:00');
      const endDate = new Date(dateRange.end + 'T23:59:59');
      return recDate >= startDate && recDate <= endDate;
    });
  }

  const pendingCount = requests.filter(r => !r.hasRecommendation).length;
  const completedCount = requests.filter(r => r.hasRecommendation).length;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#d32f2f' }}>
            {error}
            <button onClick={fetchAllRequests} style={{ display: 'block', margin: '1rem auto' }}>
              Попробовать снова
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.searchWrapper}>
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                placeholder="Поиск по питомцу"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button className={styles.searchIconBtn}>
                <Search size={20} />
              </button>
            </div>

            <div className={styles.calendarWrapper}>
              <Calendar
                value=""
                onChange={() => {}}
                placeholder=""
                variant="orange"
                mode="range"
                rangeValue={dateRange || undefined}
                onRangeChange={handleDateRangeChange}
              />

              {dateRange && (
                <button
                  className={styles.clearDateBtn}
                  onClick={handleClearDate}
                  title="Очистить дату"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className={styles.filterDropdownWrapper} ref={dropdownRef}>
              <button
                className={`${styles.filterBtn} ${statusFilter !== 'all' ? styles.filterActive : ''}`}
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                title="Фильтр по статусу"
              >
                <SlidersHorizontal size={20} />
              </button>

              {isFilterDropdownOpen && (
                <div className={styles.filterDropdown}>
                  <button
                    className={`${styles.filterOption} ${statusFilter === 'all' ? styles.active : ''}`}
                    onClick={() => handleFilterSelect('all')}
                  >
                    <span>Все</span>
                    <span className={styles.filterCount}>{requests.length}</span>
                  </button>
                  <button
                    className={`${styles.filterOption} ${statusFilter === 'in-progress' ? styles.active : ''}`}
                    onClick={() => handleFilterSelect('in-progress')}
                  >
                    <span>В процессе</span>
                    <span className={styles.filterCount}>{pendingCount}</span>
                  </button>
                  <button
                    className={`${styles.filterOption} ${statusFilter === 'completed' ? styles.active : ''}`}
                    onClick={() => handleFilterSelect('completed')}
                  >
                    <span>Завершенные</span>
                    <span className={styles.filterCount}>{completedCount}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <h1 className={styles.title}>Все записи</h1>
        </header>

        <section className={styles.cardsSection}>
          {filteredRequests.length === 0 ? (
            <p className={styles.emptyText}>
              {dateRange ? 'Нет записей за выбранный период' :
               searchQuery ? 'Не найдено записей по запросу' :
               statusFilter === 'completed' ? 'Нет завершенных записей' :
               statusFilter === 'in-progress' ? 'Нет записей в процессе' :
               'Нет записей'}
            </p>
          ) : (
            <div className={styles.cardsGrid}>
              {filteredRequests.map((req) => {
                const date = new Date(req.createdAt);
                const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getFullYear()).slice(2)}`;

                return (
                  <div key={req.id} className={styles.card}>
                    {req.hasRecommendation && (
                      <div className={`${styles.statusBadge} ${styles.completed}`}>
                        Завершено
                      </div>
                    )}

                    <img
                      src={req.petPhoto || '/placeholder-pet.png'}
                      alt={req.petName}
                      className={styles.petImage}
                    />
                    <div className={styles.cardContent}>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.petName}>{req.petName}</h3>
                        <span className={styles.date}>{formattedDate}</span>
                      </div>

                      <div className={styles.ownerInfo}>
                        <span className={styles.ownerName}>{req.ownerName}</span>
                      </div>

                      <button
                        className={styles.recommendationBtn}
                        onClick={() => handleRecommendationClick(req)}
                      >
                        {req.hasRecommendation ? 'Посмотреть рекомендацию' : 'Создать рекомендацию'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};