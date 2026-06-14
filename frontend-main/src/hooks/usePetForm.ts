import { useState, useCallback, useEffect } from 'react';
import { PetFormData, FormErrors } from '../types/petForm';
import { INITIAL_FORM_DATA } from '../const/petForm';
import {
  validatePhotoFile,
  validatePhotoResolution,
  validatePetForm
} from '../utils/petFormValidator';
import { usePets } from '../../context/PetContext';
import type { Species } from '../../context/PetContext/types';
import { getReproductiveStatusId, getLactationWeekId } from '../const/petMappings';
import { petService } from '../../services/petService';
import { useFormPersistence } from './useFormPersistence';

type ReferenceItem = {
  id: number;
  name?: string;
  nameRu?: string;
  nameEn?: string;
};

const resolveDogSpeciesId = (species: Species[]): number => {
  if (!species?.length) return 0;
  const dog =
    species.find(
      (s) =>
        s.code === 'dog' ||
        (s.name && s.name.toLowerCase().includes('соба'))
    ) ?? species[0];
  return dog?.id ?? 0;
};

const STORAGE_KEY = 'pet_registration_draft';

export const usePetForm = (editPetId?: string) => {
  const { species, breeds, colors, addPet, updatePet, isLoadingReference } = usePets();
  const isEditMode = !!editPetId;

  const [formData, setFormData] = useState<PetFormData>(INITIAL_FORM_DATA);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const { loadPersistedData, clearPersistedData } = useFormPersistence(
    STORAGE_KEY,
    formData,
    !isEditMode
  );

  useEffect(() => {
    if (!isEditMode) {
      const persistedData = loadPersistedData();
      if (persistedData) {
        setFormData(prev => ({
          ...prev,
          ...persistedData
        }));
      }
    }
  }, [isEditMode, loadPersistedData]);

  const setInitialData = useCallback((data: PetFormData, existingPhotoUrl?: string) => {
    setFormData(data);
    if (existingPhotoUrl) {
      setPhotoPreview(existingPhotoUrl);
    }
  }, []);

  const handlePhotoChange = async (file: File) => {
    const basicError = validatePhotoFile(file);
    if (basicError) {
      setErrors(prev => ({ ...prev, photo: basicError }));
      return;
    }

    const resolutionError = await validatePhotoResolution(file);
    if (resolutionError) {
      setErrors(prev => ({ ...prev, photo: resolutionError }));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, photo: file }));
    setPhotoPreview(objectUrl);
    setErrors(prev => ({ ...prev, photo: undefined }));
  };

  const handlePhotoDelete = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
    setErrors(prev => ({ ...prev, photo: undefined }));
  };

  const handleInputChange = useCallback((field: keyof PetFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors = validatePetForm(formData);

    if (photoPreview && !formData.photo) {
      delete newErrors.photo;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      console.log('Starting photo upload for file:', file.name, 'size:', file.size, 'type:', file.type);

      const fileName = `pet-${Date.now()}.${file.type.split('/')[1]}`;
      const contentType = file.type;

      console.log('Getting upload URL for:', fileName, contentType);
      const { url, objectKey } = await petService.getPhotoUploadUrl(fileName, contentType);
      console.log('Upload URL received:', url, 'objectKey:', objectKey);

      console.log('Uploading file to storage...');
      await petService.uploadPhotoToStorage(url, file, contentType);
      console.log('File uploaded successfully');

      console.log('Returning objectKey:', objectKey);
      return objectKey;
    } catch (error) {
      console.error('Photo upload error:', error);
      throw new Error('Не удалось загрузить фото');
    }
  };

  const findIdByName = (list: ReferenceItem[], searchName: string): number => {
    const searchLower = searchName.toLowerCase().trim();

    let item = list.find(item => {
      const nameMatch = item.name?.toLowerCase() === searchLower;
      const nameRuMatch = item.nameRu?.toLowerCase() === searchLower;
      const nameEnMatch = item.nameEn?.toLowerCase() === searchLower;
      return nameMatch || nameRuMatch || nameEnMatch;
    });

    if (!item) {
      item = list.find(item => {
        const nameMatch = item.name?.toLowerCase().includes(searchLower);
        const nameRuMatch = item.nameRu?.toLowerCase().includes(searchLower);
        const nameEnMatch = item.nameEn?.toLowerCase().includes(searchLower);
        return nameMatch || nameRuMatch || nameEnMatch;
      });
    }

    if (!item) {
      item = list.find(item => {
        const name = item.name?.toLowerCase() || '';
        const nameRu = item.nameRu?.toLowerCase() || '';
        const nameEn = item.nameEn?.toLowerCase() || '';

        return name.includes(searchLower) || searchLower.includes(name) ||
               nameRu.includes(searchLower) || searchLower.includes(nameRu) ||
               nameEn.includes(searchLower) || searchLower.includes(nameEn);
      });
    }

    return item?.id || 0;
  };

  const getReproductiveData = () => {
    if (formData.gender !== 'female' || !formData.reproductiveStatus) {
      return {
        reproductiveStatusId: 1,
        reproductiveSubStatusId: null,
        puppiesCount: 0
      };
    }

    const reproductiveStatusId = getReproductiveStatusId(formData.reproductiveStatus);
    let reproductiveSubStatusId: number | null = null;
    let puppiesCount = 0;

    if (formData.reproductiveStatus === 'lactation') {
      reproductiveSubStatusId = getLactationWeekId(formData.lactationWeek || '');
      puppiesCount = formData.puppyCount || 0;
    }

    return { reproductiveStatusId, reproductiveSubStatusId, puppiesCount };
  };

  const validateReferenceIds = (speciesId: number, breedId: number, colorId: number) => {
    const missingFields = [];

    if (speciesId === 0) missingFields.push('Вид «собака» в справочнике');
    if (breedId === 0) missingFields.push(`Порода (${formData.breed})`);
    if (colorId === 0) missingFields.push(`Окрас (${formData.color})`);

    if (missingFields.length > 0) {
      throw new Error(`Не удалось определить: ${missingFields.join(', ')}`);
    }
  };

  const buildApiPayload = async (
    speciesId: number,
    breedId: number,
    colorId: number
  ) => {
    const { reproductiveStatusId, reproductiveSubStatusId, puppiesCount } = getReproductiveData();

    const payload: any = {
      speciesId,
      breedId,
      name: formData.name.trim(),
      gender: formData.gender,
      colorId,
      birthDate: formData.dateOfBirth,
      passportId: formData.passportId.trim() || '',
      weightKg: formData.weight,
      reproductiveStatusId,
      puppiesCount
    };

    if (formData.photo) {
      const photoObjectKey = await uploadPhoto(formData.photo);
      if (photoObjectKey) {
        payload.photoObjectKey = photoObjectKey;
      }
    }

    if (reproductiveSubStatusId !== null && reproductiveSubStatusId > 0) {
      payload.reproductiveSubStatusId = reproductiveSubStatusId;
    }

    return payload;
  };

  const submitForm = async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    if (isLoadingReference) {
      setErrors({
        general: 'Справочные данные ещё загружаются. Подождите и попробуйте снова.',
      });
      return false;
    }

    setLoading(true);

    try {
      const speciesId = resolveDogSpeciesId(species);
      const breedId = findIdByName(breeds, formData.breed);
      const colorId = findIdByName(colors, formData.color);

      validateReferenceIds(speciesId, breedId, colorId);

      const apiPayload = await buildApiPayload(speciesId, breedId, colorId);

      if (editPetId) {
        await updatePet(editPetId, apiPayload);
      } else {
        await addPet(apiPayload);
      }

      if (!isEditMode) {
        clearPersistedData();
      }

      return true;
    } catch (error: any) {
      setErrors({
        general: error.message || '*Ошибка при сохранении данных. Попробуйте еще раз'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    photoPreview,
    errors,
    loading,
    handlePhotoChange,
    handlePhotoDelete,
    handleInputChange,
    submitForm,
    setInitialData,
    clearPersistedData,
  };
};