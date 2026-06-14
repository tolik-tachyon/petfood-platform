import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRequests, PetRequest } from '../../context/RequestContext';
import { usePets } from '../../context/PetContext';
import { Layout } from '../../layout/Layout';
import { formatAge, formatGender, formatDate } from '../utils/petUtils';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import styles from '../styles/RequestDetail.module.css';

export const RequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requests, fetchRequestById } = useRequests();
  const { pets, isLoading: isLoadingPets } = usePets();
  const [isLoading, setIsLoading] = useState(true);
  const [request, setRequest] = useState<PetRequest | null>(null);

  const pet = pets.find(p => p.id === request?.petId);

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    setIsLoading(true);
    try {
      const existingRequest = requests.find(r => r.id === id);

      if (existingRequest) {
        setRequest(existingRequest);
      } else {
        const fetchedRequest = await fetchRequestById(id!);
        setRequest(fetchedRequest);
      }
    } catch (error) {
      console.error('Failed to load request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/requests');
  };

  const handleEdit = () => {
    navigate('/create-request', {
      state: {
        editMode: true,
        requestData: request
      }
    });
  };

  if (isLoading || isLoadingPets) {
    return (
      <Layout showSidebar={true}>
        <div style={{ padding: '2rem' }}>Загрузка...</div>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout showSidebar={true}>
        <div style={{ padding: '2rem' }}>
          <p>Запрос не найден</p>
          <button onClick={handleBack}>Назад к списку</button>
        </div>
      </Layout>
    );
  }

  if (!pet) {
    return (
      <Layout showSidebar={true}>
        <div style={{ padding: '2rem' }}>
          <p>Питомец не найден</p>
          <button onClick={handleBack}>Назад к списку</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className={styles.container}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={handleBack}>
            <MdKeyboardArrowLeft className={styles.backIcon} />
            Назад
          </button>
          <h1 className={styles.title}>Детали запроса</h1>
        </header>

        <main className={styles.main}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Информация о питомце</h2>
            <div className={styles.petInfoSection}>
              <img
                src={pet.photo}
                alt={pet.name}
                className={styles.petImage}
              />
              <div className={styles.petDetails}>
                <h3 className={styles.petName}>{pet.name}</h3>
                <p className={styles.petDetail}>
                  <strong>Возраст:</strong> {formatAge(pet.birthDate)}
                </p>
                <p className={styles.petDetail}>
                  <strong>Пол:</strong> {formatGender(pet.gender)}
                </p>
                <p className={styles.petDetail}>
                  <strong>Вес:</strong> {request.weightKg} кг
                </p>
                <p className={styles.petDetail}>
                  <strong>ID паспорта:</strong> {pet.passportId || 'Не указан'}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.sectionTitle}>Данные запроса</h2>
              <span className={styles.requestDate}>
                {formatDate(request.createdAt)}
              </span>
            </div>

            <div className={styles.requestContent}>
              <div className={styles.infoRow}>
                <strong>Активность:</strong>
                <span>{request.activityTypeName}</span>
              </div>

              <div className={styles.infoRow}>
                <strong>Симптомы:</strong>
                <div className={styles.symptomsList}>
                  {request.symptoms.map((symptom: string, index: number) => (
                    <span key={index} className={styles.symptomTag}>
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>

              {request.comments && (
                <div className={styles.infoRow}>
                  <strong>Комментарий:</strong>
                  <p className={styles.comments}>{request.comments}</p>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button className={styles.editBtn} onClick={handleEdit}>
                Редактировать запрос
              </button>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};