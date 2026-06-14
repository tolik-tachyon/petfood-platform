import html2canvas from 'html2canvas';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RecommendationPdfCharts } from '../components/RecommendationPdfCharts';
import type { OptimizationResult } from '../../context/RequestContext';
import { reportExportProgress, type PdfExportProgressCallback } from './pdfExportProgress';

export type RecommendationChartKey =
  | 'composition'
  | 'nutrition'
  | 'macro-minerals'
  | 'trace-minerals'
  | 'vitamins'
  | 'fatty-acids';

export type RecommendationChartImages = Partial<Record<RecommendationChartKey, string>>;

const HOST_ID = 'pdf-chart-capture-host';
const RENDER_WAIT_MS = 280;

const waitForPaint = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

const captureElement = async (element: HTMLElement): Promise<string> => {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: true,
  });
  return canvas.toDataURL('image/png');
};

const captureFromHost = async (
  host: HTMLElement,
  onProgress: PdfExportProgressCallback | undefined,
  completedSteps: number,
  totalSteps: number
): Promise<{ images: RecommendationChartImages; completedSteps: number }> => {
  const nodes = [...host.querySelectorAll<HTMLElement>('[data-pdf-chart]')];
  const images: RecommendationChartImages = {};
  let step = completedSteps;

  for (const node of nodes) {
    const key = node.dataset.pdfChart as RecommendationChartKey | undefined;
    if (!key) continue;

    try {
      await waitForPaint();
      images[key] = await captureElement(node);
    } catch (err) {
      console.warn(`PDF chart capture failed for "${key}":`, err);
    }

    step += 1;
    reportExportProgress(onProgress, step, totalSteps);
  }

  return { images, completedSteps: step };
};

export type ChartGenerationResult = {
  images: RecommendationChartImages;
  completedSteps: number;
  totalSteps: number;
};

/** Renders Recharts off-screen and captures chart blocks — no main page scroll */
export const generateRecommendationChartImages = async (
  optimizationResult: OptimizationResult,
  onProgress?: PdfExportProgressCallback
): Promise<ChartGenerationResult> => {
  const existing = document.getElementById(HOST_ID);
  existing?.remove();

  let step = 0;
  reportExportProgress(onProgress, step, 10);
  step += 1;

  const host = document.createElement('div');
  host.id = HOST_ID;
  Object.assign(host.style, {
    position: 'fixed',
    left: '-12000px',
    top: '0',
    width: '920px',
    zIndex: '-1',
    pointerEvents: 'none',
    background: '#ffffff',
  });
  document.body.appendChild(host);

  let root: Root | null = null;

  try {
    root = createRoot(host);
    root.render(createElement(RecommendationPdfCharts, { optimizationResult }));

    reportExportProgress(onProgress, step, 10);
    step += 1;

    await waitForPaint();
    await new Promise((resolve) => setTimeout(resolve, RENDER_WAIT_MS));

    const chartCount = host.querySelectorAll('[data-pdf-chart]').length;
    const totalSteps = 2 + chartCount + 2;

    reportExportProgress(onProgress, step, totalSteps);
    const { images, completedSteps } = await captureFromHost(host, onProgress, step, totalSteps);
    return {
      images,
      completedSteps,
      totalSteps,
    };
  } finally {
    root?.unmount();
    host.remove();
  }
};
