import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePetForm } from '../hooks/usePetForm';
import { usePets } from '../../context/PetContext';
import { getReproductiveStatusFormValue, getLactationWeekValue } from '../const/petMappings';
import PhotoUpload from '../components/PhotoUpload';
import PetFormLeftColumn from '../components/PetFormLeftColumn';
import PetFormRightColumn from '../components/PetFormRightColumn';
import SuccessModal from '../components/SuccessModal';
import styles from '../styles/PetRegistration.module.css';

const PetRegistration = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getPetById, isLoadingReference } = usePets();
  const isEditMode = !!id;

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });

  const {
    formData,
    photoPreview,
    errors,
    loading,
    handlePhotoChange,
    handlePhotoDelete,
    handleInputChange,
    submitForm,
    setInitialData,
  } = usePetForm(id);

  useEffect(() => {
    if (isEditMode && id) {
      const pet = getPetById(id);
      if (pet) {
        const reproductiveStatus = getReproductiveStatusFormValue(pet.reproductiveStatusId);
        const lactationWeek = pet.reproductiveSubStatusId
          ? getLactationWeekValue(pet.reproductiveSubStatusId)
          : '';

        setInitialData({
          photo: null,
          name: pet.name,
          breed: pet.breedName,
          gender: pet.gender,
          reproductiveStatus,
          lactationWeek,
          puppyCount: pet.puppiesCount || 0,
          color: pet.colorName,
          dateOfBirth: pet.birthDate,
          passportId: pet.passportId,
          weight: pet.weightKg,
        }, pet.photo);
      }
    }
  }, [isEditMode, id, getPetById, setInitialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitForm();

    if (success) {
      setSuccessMessage({
        title: isEditMode ? 'Успешно обновлено!' : 'Питомец добавлен!',
        message: isEditMode
          ? `Профиль питомца ${formData.name} был успешно обновлен.`
          : `${formData.name} успешно зарегистрирован в системе. Запись о его здоровье создана и появится в разделе "Записи".`
      });
      setShowSuccessModal(true);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    if (isEditMode && id) {
      navigate(`/pet-profile/${id}`);
    } else {
      // After new pet registration, trigger refresh in dashboard and records
      navigate('/dashboard', { state: { refresh: true, timestamp: Date.now() } });
    }
  };

  const handleBackClick = () => {
    if (isEditMode && id) {
      navigate(`/pet-profile/${id}`);
    } else {
      navigate('/dashboard');
    }
  };

  if (isLoadingReference) {
    return (
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.loadingContainer}>
            <h2>Загрузка данных...</h2>
            <p>Пожалуйста, подождите</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.headerCard}>
          <button onClick={handleBackClick} className={styles.backBtn}>
            <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Назад
          </button>

          <h1 className={styles.title}>
            {isEditMode ? 'Редактировать профиль' : 'Регистрация питомца'}
          </h1>
        </div>

        <div className={styles.formWrapper}>
          <form onSubmit={handleSubmit} noValidate>
            <h2 className={styles.sectionTitle}>Основные параметры</h2>

            <PhotoUpload
              photoPreview={photoPreview}
              onPhotoChange={handlePhotoChange}
              onPhotoDelete={handlePhotoDelete}
              error={errors.photo}
            />

            <div className={styles.formGrid}>
              <PetFormLeftColumn
                breed={formData.breed}
                dateOfBirth={formData.dateOfBirth}
                passportId={formData.passportId}
                onInputChange={handleInputChange}
                errors={errors}
              />

              <PetFormRightColumn
                name={formData.name}
                gender={formData.gender}
                reproductiveStatus={formData.reproductiveStatus || ''}
                color={formData.color}
                weight={formData.weight}
                formData={formData}
                onInputChange={handleInputChange}
                errors={errors}
              />
            </div>

            {errors.general && (
              <p className={styles.errorGeneral}>{errors.general}</p>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading || isLoadingReference}>
              {loading
                ? (isEditMode ? 'Обновление...' : 'Сохранение...')
                : isLoadingReference
                  ? 'Загрузка...'
                  : (isEditMode ? 'Обновить' : 'Сохранить')}
            </button>
          </form>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        title={successMessage.title}
        message={successMessage.message}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default PetRegistration;
