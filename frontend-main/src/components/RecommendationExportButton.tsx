import { useState, type CSSProperties } from 'react';
import { FiDownload } from 'react-icons/fi';
import type { OptimizationResult } from '../../context/RequestContext';
import { generateRecommendationChartImages } from '../utils/generateRecommendationChartImages';
import { exportRecommendationPdf } from '../utils/exportRecommendationPdf';
import type { RecommendationExportMeta } from '../utils/recommendationReport';
import styles from '../styles/RecommendationExportButton.module.css';

type Props = {
  optimizationResult: OptimizationResult;
  meta: RecommendationExportMeta;
  className?: string;
};

export const RecommendationExportButton = ({
  optimizationResult,
  meta,
  className,
}: Props) => {
  const [isExporting, setIsExporting] = useState(false);
  const [percent, setPercent] = useState(0);

  const handleExport = async () => {
    setIsExporting(true);
    setPercent(0);

    try {
      const { images, completedSteps, totalSteps } = await generateRecommendationChartImages(
        optimizationResult,
        setPercent
      );

      await exportRecommendationPdf(optimizationResult, meta, images, setPercent, {
        completedSteps,
        totalSteps,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
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
      title="Скачать рекомендацию в PDF"
      aria-label={isExporting ? `Формирование PDF: ${percent}%` : 'Скачать рекомендацию в PDF'}
      aria-valuenow={isExporting ? percent : undefined}
      aria-valuemin={isExporting ? 0 : undefined}
      aria-valuemax={isExporting ? 100 : undefined}
      role={isExporting ? 'progressbar' : undefined}
    >
      <FiDownload className={styles.exportIcon} aria-hidden />
      <span className={styles.exportLabel}>
        {isExporting ? `${percent}%` : 'Скачать PDF'}
      </span>
    </button>
  );
};
