import type { Pet } from '../../context/PetContext/types';
import type { PetRequest } from '../../context/RequestContext';
import { PET_PROFILE_TEXT } from '../const/petProfile';
import {
  formatGender,
  getReproductiveStatusLabel,
  isLactationStatus,
} from './petProfileHelpers';
import { formatAge, formatDate } from './petUtils';
import { normalizeImageForPdf, type PdfImagePayload } from './pdfImageUtils';
import { sanitizeFileName } from './recommendationReport';

export type PetProfileRecommendationRow = {
  recordNumber: string;
  date: string;
  clinic: string;
};

export type PetProfileHistoryRow = {
  date: string;
  weight: string;
  activity: string;
};

export type PetProfileExportData = {
  petName: string;
  exportDate: string;
  photo?: PdfImagePayload;
  summary: {
    age: string;
    gender: string;
    passport?: string;
  };
  basicParams: [string, string][];
  historyRows: PetProfileHistoryRow[];
  recommendationRows: PetProfileRecommendationRow[];
};

const formatParamValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};

export const getPetProfileParamRows = (pet: Pet): [string, string][] => {
  const statusLabel = getReproductiveStatusLabel(pet.reproductiveStatusName);
  const showReproductiveStatus = pet.gender === 'female' && statusLabel !== null;
  const isLactation = isLactationStatus(pet.reproductiveStatusName);
  const rows: [string, string][] = [
    [PET_PROFILE_TEXT.LABEL_SPECIES, formatParamValue(pet.speciesName)],
    [PET_PROFILE_TEXT.LABEL_BREED, formatParamValue(pet.breedName)],
    [PET_PROFILE_TEXT.LABEL_BIRTH_DATE, new Date(pet.birthDate).toLocaleDateString('ru-RU')],
    [PET_PROFILE_TEXT.LABEL_NAME, formatParamValue(pet.name)],
    [PET_PROFILE_TEXT.LABEL_GENDER, formatGender(pet.gender)],
  ];

  if (pet.passportId) {
    rows.push([PET_PROFILE_TEXT.LABEL_PASSPORT_ID, pet.passportId]);
  }

  if (showReproductiveStatus) {
    rows.push([PET_PROFILE_TEXT.LABEL_REPRODUCTIVE_STATUS, statusLabel!]);
    rows.push([PET_PROFILE_TEXT.LABEL_WEIGHT, formatParamValue(pet.weightKg)]);

    if (isLactation) {
      rows.push([PET_PROFILE_TEXT.LABEL_COLOR, formatParamValue(pet.colorName)]);
      rows.push([PET_PROFILE_TEXT.LABEL_LACTATION_WEEK, formatParamValue(pet.reproductiveSubStatusName)]);
      if (pet.puppiesCount && pet.puppiesCount > 0) {
        rows.push([PET_PROFILE_TEXT.LABEL_PUPPIES_COUNT, formatParamValue(pet.puppiesCount)]);
      }
    }
  }

  if (!showReproductiveStatus || !isLactation) {
    rows.push([PET_PROFILE_TEXT.LABEL_COLOR, formatParamValue(pet.colorName)]);
  }

  if (!showReproductiveStatus) {
    rows.push([PET_PROFILE_TEXT.LABEL_WEIGHT, formatParamValue(pet.weightKg)]);
  }

  return rows;
};

export const buildPetProfileHistoryRows = (requests: PetRequest[]): PetProfileHistoryRow[] =>
  [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((request) => ({
      date: formatDate(request.createdAt),
      weight: `${request.weightKg} кг`,
      activity: request.activityTypeName || 'Не указано',
    }));

export const buildPetProfileRecommendationRows = (
  recommendations: Array<{ id: string; createdAt: string }>
): PetProfileRecommendationRow[] =>
  [...recommendations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((request, index, list) => {
      const date = new Date(request.createdAt);
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
      const branchNumber = (index % 3) + 1;

      return {
        recordNumber: String(list.length - index).padStart(2, '0'),
        date: formattedDate,
        clinic: `Адрес Ветеринарной клиники. Филиал ${branchNumber}`,
      };
    });

export const buildPetProfileExportData = async (
  pet: Pet,
  requests: PetRequest[],
  recommendations: Array<{ id: string; createdAt: string }>
): Promise<PetProfileExportData> => {
  const now = new Date();
  const exportDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
  const photo = pet.photo ? await normalizeImageForPdf(pet.photo) : undefined;

  return {
    petName: pet.name,
    exportDate,
    photo,
    summary: {
      age: formatAge(pet.birthDate),
      gender: formatGender(pet.gender),
      passport: pet.passportId || undefined,
    },
    basicParams: getPetProfileParamRows(pet),
    historyRows: buildPetProfileHistoryRows(requests),
    recommendationRows: buildPetProfileRecommendationRows(recommendations),
  };
};

export const buildPetProfileFileName = (petName: string, exportDate: string): string => {
  const safePet = sanitizeFileName(petName);
  const safeDate = exportDate.replace(/\./g, '-');
  return `kartochka_pitomca_${safePet}_${safeDate}.pdf`;
};
