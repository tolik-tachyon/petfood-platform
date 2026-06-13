import { apiClient } from '../src/utils/apiClient';
import { resolveApiUrl } from '../src/utils/resolveApiUrl';
import type { Pet } from '../context/PetContext/types';

const getPhotoDownloadUrl = async (objectKey: string): Promise<string> => {
  try {
    const data = await apiClient.get<{ url: string; objectKey: string }>(
      `/api/v1/pets/photos/download-url?objectKey=${encodeURIComponent(objectKey)}`
    );
    return resolveApiUrl(data.url);
  } catch (error) {
    console.error('Failed to get photo download URL:', error);
    return '';
  }
};

export const petService = {
  async fetchPets(): Promise<Pet[]> {
    try {
      const data = await apiClient.get<any>('/api/v1/pets/me');

      let petsList: Pet[] = [];

      if (data.content && Array.isArray(data.content)) {
        petsList = data.content;
      } else if (Array.isArray(data)) {
        petsList = data;
      } else if (data && typeof data === 'object' && data.id) {
        petsList = [data];
      }

      const petsWithPhotos = await Promise.all(
        petsList.map(async (pet) => {
          if (pet.photoObjectKey) {
            const photoUrl = await getPhotoDownloadUrl(pet.photoObjectKey);
            return { ...pet, photo: photoUrl };
          }
          return pet;
        })
      );

      return petsWithPhotos;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return [];
      }
      if (error instanceof Error && error.message.includes('401')) {
        return [];
      }
      throw error;
    }
  },

  async createPet(petData: any): Promise<Pet> {
    const newPet = await apiClient.post<Pet>('/api/v1/pets', petData);

    if (newPet.photoObjectKey) {
      const photoUrl = await getPhotoDownloadUrl(newPet.photoObjectKey);
      newPet.photo = photoUrl;
    }

    return newPet;
  },

  async updatePet(id: string, petData: any): Promise<Pet> {
    const updatedPet = await apiClient.patch<Pet>(`/api/v1/pets/${id}`, petData);

    if (updatedPet.photoObjectKey) {
      const photoUrl = await getPhotoDownloadUrl(updatedPet.photoObjectKey);
      updatedPet.photo = photoUrl;
    }

    return updatedPet;
  },

  async deletePet(id: string): Promise<void> {
    return apiClient.delete(`/api/v1/pets/${id}`);
  },

  async getPhotoUploadUrl(fileName: string, contentType: string): Promise<{ url: string; objectKey: string }> {
    return apiClient.post<{ url: string; objectKey: string }>(
      '/api/v1/pets/photos/upload-url',
      { fileName, contentType }
    );
  },

  async uploadPhotoToStorage(url: string, file: File, contentType: string): Promise<void> {
    const response = await fetch(resolveApiUrl(url), {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file
    });

    if (!response.ok) {
      throw new Error('Failed to upload photo to storage');
    }
  },

  async getPhotoDownloadUrl(objectKey: string): Promise<string> {
    return getPhotoDownloadUrl(objectKey);
  }
};