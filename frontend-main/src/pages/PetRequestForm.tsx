import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePets } from '../../context/PetContext';
import { useRequests, PetRequest } from '../../context/RequestContext';
import { useLocation } from 'react-router-dom';
import { usePetRequestForm } from '../hooks/usePetRequestForm';
import { useFormPersistence } from '../hooks/useFormPersistence';

import {
  PET_REQUEST_STORAGE_KEY,
  MODAL_MESSAGES,
  FORM_LABELS
} from '../const/petRequest';
import ConfirmationModal from '../components/ConfirmationModal';
import { PetSelector } from '../components/PetSelector';
import { ActivityDropdown } from '../components/ActivityDropdown';
import { SymptomsSelector } from '../components/SymptomsSelector';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import styles from '../styles/PetRequestForm.module.css';

export const PetRequestForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pets, getPetById } = usePets();
  const { addRequest, updateRequest } = useRequests();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const editState = location.state as {
    editMode?: boolean;
    requestData?: PetRequest;
  } | null;
  const isEditMode = editState?.editMode ?? false;

  const {
    formData,
    errors,
    selectedPetId,
    activityLevel,
    symptoms,
    comments,
    updatePetId,
    updateActivityLevel,
    updateSymptoms,
    updateComments,
    validateForm,
    hasFilledFields,
    loadFormData,
  } = usePetRequestForm();

  const { loadPersistedData, clearPersistedData } = useFormPersistence(
    PET_REQUEST_STORAGE_KEY,
    formData,
    true
  );

  useEffect(() => {
      if (isEditMode && editState?.requestData) {
        const r = editState.requestData;
        loadFormData({
          selectedPetId: r.petId,
          activityLevel: r.activityTypeName,
          symptoms: r.symptoms ?? [],
          comments: r.comments ?? '',
        });
      } else {
        const persistedData = loadPersistedData();
        if (persistedData) {
          loadFormData(persistedData);
        }
      }
    }, []);

  const handleSave = async () => {
    if (!validateForm()) return;

    const selectedPet = getPetById(selectedPetId);
    if (!selectedPet) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (isEditMode && editState?.requestData) {
      await updateRequest(
        editState.requestData.id,
        editState.requestData.petId,
        { activityTypeName: activityLevel, symptoms }
      )} else {
        await addRequest({
          petId: selectedPetId,
          activityTypeName: activityLevel,
          symptoms,
          comments,
          weightKg: selectedPet.weightKg,
        });
        clearPersistedData();
      }

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Failed to save request:', error);
      setSubmitError(error.message || 'Не удалось сохранить запрос. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    navigate('/requests');
  };

  const handleCancel = () => {
    if (hasFilledFields()) {
      setShowCancelModal(true);
    } else {
      navigate('/requests');
    }
  };

  const confirmCancel = () => {
    clearPersistedData();
    setShowCancelModal(false);
    navigate('/requests');
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={handleCancel}>
            <MdKeyboardArrowLeft className={styles.backIcon} />
            {FORM_LABELS.BACK_BUTTON}
          </button>
          <h1 className={styles.title}>{FORM_LABELS.PAGE_TITLE}</h1>
        </header>

        <main className={styles.main}>
          <div className={styles.card}>
            <PetSelector
              pets={pets}
              selectedPetId={selectedPetId}
              onSelect={updatePetId}
              error={errors.pet}
            />

            {selectedPetId && (
              <>
                <ActivityDropdown
                  value={activityLevel}
                  onChange={updateActivityLevel}
                  error={errors.activity}
                />

                <div className={styles.twoColumns}>
                  <div className={styles.column}>
                    <label className={styles.label}>{FORM_LABELS.COMMENT_LABEL}</label>
                    <textarea
                      className={styles.textarea}
                      placeholder={FORM_LABELS.COMMENT_PLACEHOLDER}
                      value={comments}
                      onChange={(e) => updateComments(e.target.value)}
                      rows={8}
                    />
                  </div>

                  <div className={styles.column}>
                    <SymptomsSelector
                      selectedSymptoms={symptoms}
                      onSymptomsChange={updateSymptoms}
                      error={errors.symptoms}
                    />
                  </div>
                </div>

                {submitError && (
                  <div style={{
                    color: '#d32f2f',
                    padding: '12px',
                    backgroundColor: '#ffebee',
                    borderRadius: '8px',
                    marginTop: '1rem'
                  }}>
                    {submitError}
                  </div>
                )}

                <div className={styles.actions}>
                  <button
                    className={styles.cancelActionBtn}
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    {FORM_LABELS.CANCEL_BUTTON}
                  </button>
                  <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Сохранение...' : FORM_LABELS.SAVE_BUTTON}
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <ConfirmationModal
        isOpen={showCancelModal}
        title={MODAL_MESSAGES.CANCEL_TITLE}
        message={MODAL_MESSAGES.CANCEL_MESSAGE}
        confirmText={MODAL_MESSAGES.CANCEL_CONFIRM}
        cancelText={MODAL_MESSAGES.CANCEL_DECLINE}
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />

      <ConfirmationModal
        isOpen={showSuccessModal}
        title={MODAL_MESSAGES.SUCCESS_TITLE}
        message={MODAL_MESSAGES.SUCCESS_MESSAGE}
        confirmText={MODAL_MESSAGES.SUCCESS_CONFIRM}
        cancelText=""
        onConfirm={handleSuccessConfirm}
        onCancel={handleSuccessConfirm}
      />
    </div>
  );
};