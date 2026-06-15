import { useState, type CSSProperties } from 'react';
import { FiDownload } from 'react-icons/fi';
import type { Pet } from '../../context/PetContext/types';
import type { PetRequest } from '../../context/RequestContext';
import { PET_PROFILE_TEXT } from '../const/petProfile';
import { buildPetProfileExportData } from '../utils/buildPetProfileExportData';
import { exportPetProfilePdf } from '../utils/exportPetProfilePdf';
import { reportExportProgress } from '../utils/pdfExportProgress';
import styles from '../styles/RecommendationExportButton.module.css';

type RecommendationRef = {
  id: string;
  createdAt: string;
};

type Props = {
  pet: Pet;
  requests: PetRequest[];
  recommendations: RecommendationRef[];
  className?: string;
};

export const PetProfileExportButton = ({ pet, requests, recommendations, className }: Props) => {
  const [isExporting, setIsExporting] = useState(false);
  const [percent, setPercent] = useState(0);

  const handleExport = async () => {
    setIsExporting(true);
    setPercent(0);

    const totalSteps = 4;

    try {
      reportExportProgress(setPercent, 0, totalSteps);
      const data = await buildPetProfileExportData(pet, requests, recommendations);
      reportExportProgress(setPercent, 1, totalSteps);

      await exportPetProfilePdf(data, (pdfPercent) => {
        const step = 1 + Math.max(1, Math.ceil((pdfPercent / 100) * 3));
        reportExportProgress(setPercent, Math.min(step, totalSteps), totalSteps);
      });
    } catch (err) {
      console.error('Pet profile PDF export failed:', err);
      window.alert('Не удалось сформировать PDF. Попробуйте ещё раз.');
    } finally {
      setIsExporting(false);
      setPercent(0);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.exportBtn} ${isExporting ? styles.exporting : ''} ${className ?? ''}`}
      onClick={handleExport}
      disabled={isExporting}
      style={isExporting ? ({ '--progress': `${percent}%` } as CSSProperties) : undefined}
      title={PET_PROFILE_TEXT.EXPORT_BUTTON}
      aria-label={isExporting ? `Формирование PDF: ${percent}%` : PET_PROFILE_TEXT.EXPORT_BUTTON}
      aria-valuenow={isExporting ? percent : undefined}
      aria-valuemin={isExporting ? 0 : undefined}
      aria-valuemax={isExporting ? 100 : undefined}
      role={isExporting ? 'progressbar' : undefined}
    >
      <FiDownload className={styles.exportIcon} aria-hidden />
      <span className={styles.exportLabel}>
        {isExporting ? `${percent}%` : PET_PROFILE_TEXT.EXPORT_BUTTON}
      </span>
    </button>
  );
};
