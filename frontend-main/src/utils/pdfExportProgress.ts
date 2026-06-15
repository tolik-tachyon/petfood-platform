export type PdfExportProgressCallback = (percent: number) => void;

export const reportExportProgress = (
  onProgress: PdfExportProgressCallback | undefined,
  completedSteps: number,
  totalSteps: number
): void => {
  if (!onProgress || totalSteps <= 0) return;
  onProgress(Math.min(100, Math.round((completedSteps / totalSteps) * 100)));
};
