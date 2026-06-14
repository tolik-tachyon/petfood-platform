import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePets } from '../../context/PetContext';
import { useRequests } from '../../context/RequestContext';
import { PET_PROFILE_TEXT } from '../const/petProfile';
import { getReproductiveStatusLabel, isLactationStatus, formatGender } from '../utils/petProfileHelpers';
import { formatAge, formatDate, getActivityColor } from '../utils/petUtils';
import ConfirmationModal from '../components/ConfirmationModal';
import { PetProfilePhoto } from '../components/PetProfilePhoto';
import { PetProfileParamItem } from '../components/PetProfileParamItem';
import { apiClient } from '../utils/apiClient';
import styles from '../styles/PetProfile.module.css';

type SavedRecommendation = {
  id: string;
  healthRecordId: string;
  vetId: string;
  createdAt: string;
};

type RequestWithRecommendation = {
  id: string;
  createdAt: string;
  hasRecommendation: boolean;
  recommendation?: SavedRecommendation;
};

const PetProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getPetById, deletePet, isLoading } = usePets();
  const { getRequestsByPetId, fetchRequestsByPetId } = useRequests();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestsWithRecommendations, setRequestsWithRecommendations] = useState<RequestWithRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);

  const pet = id ? getPetById(id) : undefined;
  const petRequests = id ? getRequestsByPetId(id) : [];

  useEffect(() => {
    if (id) {
      fetchRequestsByPetId(id);
    }
  }, [id]);

  useEffect(() => {
    if (petRequests.length > 0) {
      fetchRecommendations();
    } else {
      setIsLoadingRecommendations(false);
    }
  }, [petRequests.length]);

  const fetchRecommendations = async () => {
    setIsLoadingRecommendations(true);

    try {
      const enrichedRequests = await Promise.all(
        petRequests.map(async (request) => {
          try {
            const recommendation = await apiClient.get<SavedRecommendation>(
              `/api/v1/pets/health-records/${request.id}/recommendation`
            );
            return {
              id: request.id,
              createdAt: request.createdAt,
              hasRecommendation: true,
              recommendation
            };
          } catch (error) {
            return {
              id: request.id,
              createdAt: request.createdAt,
              hasRecommendation: false
            };
          }
        })
      );

      const withRecommendations = enrichedRequests.filter(req => req.hasRecommendation);
      setRequestsWithRecommendations(withRecommendations);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleDelete = () => {
    deletePet(pet!.id);
    setIsModalOpen(false);
  };

  const handleEdit = () => {
    navigate(`/register-pet/${pet!.id}`);
  };

  const handleViewRecommendation = (healthRecordId: string) => {
    navigate(`/recommendation/${healthRecordId}`);
  };

  const handleViewAnalytics = (healthRecordId: string) => {
    navigate(`/analytics/${healthRecordId}`);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Загрузка...</h2>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>{PET_PROFILE_TEXT.NOT_FOUND_TITLE}</h2>
          <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
            {PET_PROFILE_TEXT.NOT_FOUND_BUTTON}
          </button>
        </div>
      </div>
    );
  }

  const statusLabel = getReproductiveStatusLabel(pet.reproductiveStatusName);
  const showReproductiveStatus = pet.gender === 'female' && statusLabel !== null;
  const isLactation = isLactationStatus(pet.reproductiveStatusName);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.headerCard}>
          <div className={styles.header}>
            <button onClick={() => navigate('/dashboard')} className={styles.backBtn}>
              <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              {PET_PROFILE_TEXT.BACK_BUTTON}
            </button>
            <h1 className={styles.title}>{PET_PROFILE_TEXT.PAGE_TITLE}</h1>
            <button onClick={() => setIsModalOpen(true)} className={styles.deleteBtn}>
              {PET_PROFILE_TEXT.DELETE_BUTTON}
            </button>
          </div>
        </div>

        <div className={styles.petCard}>
          <div className={styles.petInfo}>
            <PetProfilePhoto photo={pet.photo} name={pet.name} />

            <div className={styles.petDetails}>
              <h2 className={styles.petName}>{pet.name}</h2>
              <p className={styles.petMeta}>
                Возраст: {formatAge(pet.birthDate)}
              </p>
              <p className={styles.petMeta}>
                Пол: {formatGender(pet.gender)}
              </p>
             {pet.passportId && (
                <p className={styles.petPassport}>
                  {PET_PROFILE_TEXT.LABEL_PASSPORT_ID}: {pet.passportId}
                </p>
              )}

              <button onClick={handleEdit} className={styles.editBtn}>
                <svg className={styles.editIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                {PET_PROFILE_TEXT.EDIT_BUTTON}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{PET_PROFILE_TEXT.SECTION_BASIC_PARAMS}</h2>
          <div className={styles.parametersGrid}>
            <div className={styles.paramColumn}>
              <PetProfileParamItem
                label={PET_PROFILE_TEXT.LABEL_SPECIES}
                value={pet.speciesName}
              />
              <PetProfileParamItem
                label={PET_PROFILE_TEXT.LABEL_BREED}
                value={pet.breedName}
              />
              <PetProfileParamItem
                label={PET_PROFILE_TEXT.LABEL_BIRTH_DATE}
                value={new Date(pet.birthDate).toLocaleDateString('ru-RU')}
              />
              {pet.passportId && (
                <PetProfileParamItem
                  label={PET_PROFILE_TEXT.LABEL_PASSPORT_ID}
                  value={pet.passportId}
                />
              )}

              {showReproductiveStatus && (
                <PetProfileParamItem
                  label={PET_PROFILE_TEXT.LABEL_WEIGHT}
                  value={pet.weightKg}
                />
              )}

              {isLactation && (
                <PetProfileParamItem
                  label={PET_PROFILE_TEXT.LABEL_COLOR}
                  value={pet.colorName}
                />
              )}
            </div>

            <div className={styles.paramColumn}>
              <PetProfileParamItem
                label={PET_PROFILE_TEXT.LABEL_NAME}
                value={pet.name}
              />
              <PetProfileParamItem
                label={PET_PROFILE_TEXT.LABEL_GENDER}
                value={formatGender(pet.gender)}
              />

              {showReproductiveStatus && (
                <>
                  <PetProfileParamItem
                    label={PET_PROFILE_TEXT.LABEL_REPRODUCTIVE_STATUS}
                    value={statusLabel}
                  />

                  {isLactation && (
                    <>
                      <PetProfileParamItem
                        label={PET_PROFILE_TEXT.LABEL_LACTATION_WEEK}
                        value={pet.reproductiveSubStatusName}
                      />
                      {pet.puppiesCount && pet.puppiesCount > 0 && (
                        <PetProfileParamItem
                          label={PET_PROFILE_TEXT.LABEL_PUPPIES_COUNT}
                          value={pet.puppiesCount}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              {(!showReproductiveStatus || !isLactation) && (
                <PetProfileParamItem
                  label={PET_PROFILE_TEXT.LABEL_COLOR}
                  value={pet.colorName}
                />
              )}

              {!showReproductiveStatus && (
                <PetProfileParamItem
                  label={PET_PROFILE_TEXT.LABEL_WEIGHT}
                  value={pet.weightKg}
                />
              )}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{PET_PROFILE_TEXT.SECTION_HISTORY}</h2>
          {petRequests.length === 0 ? (
            <p className={styles.noData}>{PET_PROFILE_TEXT.NO_DATA}</p>
          ) : (
            <div className={styles.historyContainer}>
              <div className={styles.historyHeader}>
                <div className={styles.headerCell}>{PET_PROFILE_TEXT.HISTORY_DATE}</div>
                <div className={styles.headerCell}>{PET_PROFILE_TEXT.HISTORY_WEIGHT}</div>
                <div className={styles.headerCell}>{PET_PROFILE_TEXT.HISTORY_ACTIVITY}</div>
              </div>
              <div className={styles.historyList}>
                {petRequests.map((request) => {
                  const activityName = request.activityTypeName || 'Не указано';

                  return (
                    <div key={request.id} className={styles.historyItem}>
                      <div className={styles.historyDate}>{formatDate(request.createdAt)}</div>
                      <div className={styles.historyWeight}>{request.weightKg} кг</div>
                      <div
                        className={styles.historyActivity}
                        style={{ color: getActivityColor(activityName) }}
                      >
                        {activityName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{PET_PROFILE_TEXT.SECTION_RECOMMENDATIONS}</h2>
          {isLoadingRecommendations ? (
            <p className={styles.noData}>Загрузка рекомендаций...</p>
          ) : requestsWithRecommendations.length === 0 ? (
            <p className={styles.noData}>{PET_PROFILE_TEXT.NO_DATA}</p>
          ) : (
            <div className={styles.recommendationsContainer}>
              <div className={styles.recommendationsHeader}>
                <div className={styles.recHeaderCell}>Номер записи</div>
                <div className={styles.recHeaderCell}>Дата записи</div>
                <div className={styles.recHeaderCell}>Ветеринарная клиника</div>
                <div className={styles.recHeaderCell}>Рецептура</div>
                <div className={styles.recHeaderCell}>Аналитика</div>
              </div>
              <div className={styles.recommendationsList}>
                {requestsWithRecommendations.map((request, index) => {
                  const recordNumber = String(requestsWithRecommendations.length - index).padStart(2, '0');
                  const date = new Date(request.createdAt);
                  const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

                  const branchNumber = (index % 3) + 1;
                  const clinicAddress = `Адрес Ветеринарной клиники. Филиал ${branchNumber}`;

                  return (
                    <div key={request.id} className={styles.recommendationItem}>
                      <div className={styles.recCell}>{recordNumber}</div>
                      <div className={styles.recCell}>{formattedDate}</div>
                      <div className={styles.recCell}>{clinicAddress}</div>
                      <div className={styles.recCell}>
                        <button
                          onClick={() => handleViewRecommendation(request.id)}
                          className={styles.viewBtn}
                        >
                          Просмотр
                        </button>
                      </div>
                      <div className={styles.recCell}>
                        <button
                          onClick={() => handleViewAnalytics(request.id)}
                          className={styles.viewBtn}
                        >
                          Просмотр
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{PET_PROFILE_TEXT.SECTION_CHANGE_LOGS}</h2>
          <p className={styles.noData}>{PET_PROFILE_TEXT.NO_DATA}</p>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        title={PET_PROFILE_TEXT.MODAL_DELETE_TITLE}
        message={PET_PROFILE_TEXT.MODAL_DELETE_MESSAGE(pet.name)}
        confirmText={PET_PROFILE_TEXT.MODAL_DELETE_CONFIRM}
        cancelText={PET_PROFILE_TEXT.MODAL_DELETE_CANCEL}
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default PetProfile;