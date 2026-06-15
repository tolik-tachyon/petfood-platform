import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { OptimizationResult } from '../../context/RequestContext';
import type { RecommendationChartImages, RecommendationChartKey } from './generateRecommendationChartImages';
import {
  reportExportProgress,
  type PdfExportProgressCallback,
} from './pdfExportProgress';
import {
  getTargetKcal,
  groupNutrientsByCategory,
  sanitizeFileName,
  type RecommendationExportMeta,
} from './recommendationReport';

const BRAND = '#F28C4C';
const BRAND_DARK = '#E07A3A';
const TEXT = '#374151';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

// pdfmake 0.2: vfs_fonts exports the font map directly (not pdfFonts.pdfMake.vfs)
const resolveVfs = (): Record<string, string> | null => {
  const raw = pdfFonts as Record<string, string> & {
    pdfMake?: { vfs: Record<string, string> };
    default?: Record<string, string>;
  };
  const candidates = [raw.pdfMake?.vfs, raw.default, raw];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && 'Roboto-Regular.ttf' in candidate) {
      return candidate;
    }
  }
  return null;
};

const vfs = resolveVfs();
if (vfs) {
  pdfMake.vfs = vfs;
  if (typeof pdfMake.addVirtualFileSystem === 'function') {
    pdfMake.addVirtualFileSystem(vfs);
  }
}

pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};

const formatGender = (gender?: string): string => {
  if (!gender) return 'Не указано';
  if (gender === 'male') return 'Мужской';
  if (gender === 'female') return 'Женский';
  return gender;
};

const sectionTitle = (text: string): Content => ({
  text,
  style: 'sectionTitle',
  margin: [0, 14, 0, 8] as [number, number, number, number],
});

const keyValueTable = (rows: [string, string][]): Content => ({
  table: {
    widths: ['35%', '*'],
    body: rows.map(([label, value]) => [
      { text: label, style: 'kvLabel' },
      { text: value || '—', style: 'kvValue' },
    ]),
  },
  layout: {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0,
    hLineColor: () => BORDER,
    paddingLeft: () => 8,
    paddingRight: () => 8,
    paddingTop: () => 6,
    paddingBottom: () => 6,
  },
  margin: [0, 0, 0, 4] as [number, number, number, number],
});

const dataTable = (headers: string[], rows: TableCell[][]): Content => ({
  table: {
    headerRows: 1,
    widths: headers.map((_, i) => (i === 0 ? '*' : 'auto')),
    body: [
      headers.map((h) => ({ text: h, style: 'tableHeader' })),
      ...rows.map((row) =>
        row.map((cell, i) =>
          typeof cell === 'object'
            ? cell
            : { text: String(cell), style: i === 0 ? 'tableCell' : 'tableCellRight' }
        )
      ),
    ],
  },
  layout: {
    fillColor: (rowIndex: number) => (rowIndex === 0 ? BRAND : rowIndex % 2 === 0 ? '#FAFAFA' : null),
    hLineWidth: () => 0.5,
    vLineWidth: () => 0,
    hLineColor: () => BORDER,
    paddingLeft: () => 8,
    paddingRight: () => 8,
    paddingTop: () => 5,
    paddingBottom: () => 5,
  },
});

const chartImage = (dataUrl: string): Content => ({
  image: dataUrl,
  width: 480,
  alignment: 'center',
  margin: [0, 6, 0, 10] as [number, number, number, number],
});

const chartBlock = (
  charts: RecommendationChartImages | undefined,
  key: RecommendationChartKey
): Content[] => {
  const src = charts?.[key];
  return src ? [chartImage(src)] : [];
};

const balanceSection = (
  title: string,
  rows: ReturnType<typeof groupNutrientsByCategory>['macrominerals'],
  charts: RecommendationChartImages | undefined,
  chartKey: RecommendationChartKey
): Content[] => {
  if (rows.length === 0) return [];
  return [
    sectionTitle(title),
    ...chartBlock(charts, chartKey),
    dataTable(
      ['Показатель', 'Текущее', 'Норма', 'Покрытие', 'Статус'],
      rows.map((r) => [
        r.name,
        `${r.current.toFixed(2)} ${r.unit}`,
        `${r.normal.toFixed(2)} ${r.unit}`,
        `${r.coveragePercent}%`,
        r.status,
      ])
    ),
  ];
};

export const exportRecommendationPdf = (
  optimizationResult: OptimizationResult,
  meta: RecommendationExportMeta,
  charts?: RecommendationChartImages,
  onProgress?: PdfExportProgressCallback,
  progressContext?: { completedSteps: number; totalSteps: number }
): Promise<void> => {
  const targetKcal = getTargetKcal(optimizationResult, meta.targetKcal);
  const groups = groupNutrientsByCategory(optimizationResult);

  const compositionRows = optimizationResult.composition
    .filter((item) => item.grams_per_100g > 0)
    .map((item) => {
      const grams = parseFloat(
        ((item.grams_per_100g / 100) * optimizationResult.total_feed_grams).toFixed(2)
      );
      return [item.ingredient, `${item.grams_per_100g.toFixed(2)}%`, `${grams} г`];
    });

  const nutritionRows = optimizationResult.nutritional_value_per_100g.map((item) => [
    item.nutrient,
    `${item.value_per_100g.toFixed(2)} ${item.unit}`,
  ]);

  const content: Content[] = [
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: 'PetFood Platform', style: 'brand' },
            { text: 'Рекомендация по питанию', style: 'docSubtitle' },
          ],
        },
        {
          width: 'auto',
          alignment: 'right',
          stack: [
            { text: meta.formattedDate, style: 'dateBadge' },
            { text: `Питомец: ${meta.petName}`, style: 'petBadge', margin: [0, 4, 0, 0] },
          ],
        },
      ],
      margin: [0, 0, 0, 16],
    },
    {
      canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 3, color: BRAND }],
      margin: [0, 0, 0, 12],
    },
    {
      text: 'Документ сформирован на основе индивидуальной оценки рациона. Ниже — ключевые показатели, состав корма и баланс нутриентов.',
      style: 'intro',
    },
  ];

  if (meta.disease && meta.disease !== 'Unknown') {
    content.push({
      text: `Заболевание / состояние: ${meta.disease}`,
      style: 'highlight',
      margin: [0, 8, 0, 0],
    });
  }

  if (meta.request) {
    const r = meta.request;
    content.push(
      sectionTitle('Основные параметры питомца'),
      keyValueTable([
        ['Вид животного', r.petSpecies || 'Собака'],
        ['Кличка', meta.petName],
        ['Порода', r.petBreed || 'Не указано'],
        ['Пол', formatGender(r.gender)],
        ['Дата рождения', r.birthDate || 'Не указано'],
        ['ID паспорта', r.passportId || 'Не указано'],
      ])
    );
    content.push(
      sectionTitle('Данные запроса'),
      keyValueTable([
        ['Активность', r.activityTypeName || '—'],
        ['Симптомы', r.symptoms?.length ? r.symptoms.join(', ') : 'Не указано'],
        ['Вес, кг', r.weightKg != null ? String(r.weightKg) : '—'],
        ['Комментарий', r.comments || '—'],
        ['Владелец', r.ownerName || '—'],
      ])
    );
  }

  content.push(
    sectionTitle('Сводные показатели рациона'),
    {
      columns: [
        {
          width: '33%',
          stack: [
            { text: `${targetKcal.toFixed(1)}`, style: 'metricValue' },
            { text: 'Целевая энергия (МЭ), ккал', style: 'metricLabel' },
          ],
          margin: [0, 0, 8, 0],
        },
        {
          width: '33%',
          stack: [
            { text: `${optimizationResult.total_feed_grams.toFixed(2)}`, style: 'metricValue' },
            { text: 'Общая масса корма, г', style: 'metricLabel' },
          ],
          margin: [0, 0, 8, 0],
        },
        {
          width: '34%',
          stack: [
            { text: `${optimizationResult.energy_per_100g.toFixed(2)}`, style: 'metricValue' },
            { text: 'Энерг. плотность / 100 г, ккал', style: 'metricLabel' },
          ],
        },
      ],
      columnGap: 8,
    }
  );

  if (compositionRows.length > 0) {
    content.push(
      sectionTitle('Состав рациона'),
      ...chartBlock(charts, 'composition'),
      dataTable(['Ингредиент', 'Доля', 'Масса'], compositionRows)
    );
  }

  if (nutritionRows.length > 0) {
    content.push(
      sectionTitle('Питательная ценность на 100 г'),
      ...chartBlock(charts, 'nutrition'),
      dataTable(['Нутриент', 'Значение'], nutritionRows),
      {
        text: `Энергетическая ценность: ${optimizationResult.energy_per_100g.toFixed(2)} ккал / 100 г`,
        style: 'footnote',
        margin: [0, 6, 0, 0],
      }
    );
  }

  content.push(
    ...balanceSection('Баланс макроэлементов', groups.macrominerals, charts, 'macro-minerals'),
    ...balanceSection('Баланс микроэлементов', groups.traceMinerals, charts, 'trace-minerals'),
    ...balanceSection('Баланс витаминов', groups.vitamins, charts, 'vitamins'),
    ...balanceSection('Баланс жирных кислот', groups.fattyAcids, charts, 'fatty-acids'),
    ...(groups.other.length > 0
      ? [
          sectionTitle('Прочие показатели'),
          dataTable(
            ['Показатель', 'Текущее', 'Норма', 'Покрытие', 'Статус'],
            groups.other.map((r) => [
              r.name,
              `${r.current.toFixed(2)} ${r.unit}`,
              `${r.normal.toFixed(2)} ${r.unit}`,
              `${r.coveragePercent}%`,
              r.status,
            ])
          ),
        ]
      : [])
  );

  if (optimizationResult.method) {
    content.push({
      text: `Метод расчёта: ${optimizationResult.method}`,
      style: 'footnote',
      margin: [0, 12, 0, 0],
    });
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 48, 40, 48],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: TEXT,
      lineHeight: 1.35,
    },
    styles: {
      brand: { fontSize: 18, bold: true, color: BRAND },
      docSubtitle: { fontSize: 11, color: MUTED, margin: [0, 2, 0, 0] },
      dateBadge: { fontSize: 10, bold: true, color: BRAND_DARK },
      petBadge: { fontSize: 10, color: TEXT },
      intro: { fontSize: 10, color: MUTED, alignment: 'justify' },
      highlight: { fontSize: 10, bold: true, color: BRAND_DARK },
      sectionTitle: { fontSize: 12, bold: true, color: BRAND },
      kvLabel: { fontSize: 9, color: MUTED },
      kvValue: { fontSize: 9, color: TEXT },
      metricValue: { fontSize: 16, bold: true, color: BRAND, alignment: 'center' },
      metricLabel: { fontSize: 8, color: MUTED, alignment: 'center', margin: [0, 4, 0, 0] },
      tableHeader: { fontSize: 9, bold: true, color: '#FFFFFF' },
      tableCell: { fontSize: 9, color: TEXT },
      tableCellRight: { fontSize: 9, color: TEXT, alignment: 'right' },
      footnote: { fontSize: 8, color: MUTED, italics: true },
    },
    content,
  };

  const safePet = sanitizeFileName(meta.petName);
  const safeDate = meta.formattedDate.replace(/\./g, '-');
  const fileName = `rekomendaciya_${safePet}_${safeDate}.pdf`;

  let step = progressContext?.completedSteps ?? 0;
  const totalSteps = progressContext?.totalSteps ?? step + 2;

  reportExportProgress(onProgress, step, totalSteps);

  return new Promise((resolve, reject) => {
    try {
      step += 1;
      reportExportProgress(onProgress, step, totalSteps);

      pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
        try {
          step += 1;
          reportExportProgress(onProgress, step, totalSteps);

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);

          reportExportProgress(onProgress, totalSteps, totalSteps);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};
