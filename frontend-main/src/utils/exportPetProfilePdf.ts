import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { PET_PROFILE_TEXT } from '../const/petProfile';
import {
  buildPetProfileFileName,
  type PetProfileExportData,
} from './buildPetProfileExportData';
import { isPdfReadyImageDataUrl, fitImageToBox } from './pdfImageUtils';
import { reportExportProgress, type PdfExportProgressCallback } from './pdfExportProgress';

const BRAND = '#F28C4C';
const BRAND_DARK = '#E07A3A';
const TEXT = '#374151';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

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

const emptySection = (text: string): Content => ({
  text,
  style: 'empty',
  margin: [0, 0, 0, 4] as [number, number, number, number],
});

const PHOTO_MAX_SIZE = 110;

const buildPhotoBlock = (data: PetProfileExportData): Content => {
  if (data.photo && isPdfReadyImageDataUrl(data.photo.dataUrl)) {
    const fit = fitImageToBox(data.photo.width, data.photo.height, PHOTO_MAX_SIZE, PHOTO_MAX_SIZE);
    const imageBlock: Content = {
      image: data.photo.dataUrl,
      margin: [0, 0, 16, 0],
    };

    if (fit.width >= fit.height) {
      return { ...imageBlock, width: fit.width };
    }

    return { ...imageBlock, height: fit.height };
  }

  return {
    table: {
      widths: [PHOTO_MAX_SIZE],
      heights: [PHOTO_MAX_SIZE],
      body: [[{ text: PET_PROFILE_TEXT.NO_PHOTO, style: 'noPhoto', alignment: 'center' }]],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => BORDER,
      vLineColor: () => BORDER,
    },
    margin: [0, 0, 16, 0],
  };
};

const buildProfileHeader = (data: PetProfileExportData): Content[] => {
  const summaryStack: Content[] = [
    { text: data.petName, style: 'petName' },
    { text: `Возраст: ${data.summary.age}`, style: 'summaryLine' },
    { text: `Пол: ${data.summary.gender}`, style: 'summaryLine' },
  ];

  if (data.summary.passport) {
    summaryStack.push({
      text: `${PET_PROFILE_TEXT.LABEL_PASSPORT_ID}: ${data.summary.passport}`,
      style: 'summaryLine',
    });
  }

  const photoBlock = buildPhotoBlock(data);

  return [
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: 'PetFood Platform', style: 'brand' },
            { text: 'Карточка питомца', style: 'docSubtitle' },
          ],
        },
        {
          width: 'auto',
          alignment: 'right',
          stack: [
            { text: data.exportDate, style: 'dateBadge' },
            { text: `Питомец: ${data.petName}`, style: 'petBadge', margin: [0, 4, 0, 0] },
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
      text: 'Документ содержит основные данные профиля питомца, историю веса и активности, а также список рекомендаций.',
      style: 'intro',
    },
    {
      columns: [
        { width: 'auto', stack: [photoBlock] },
        { width: '*', stack: summaryStack },
      ],
      columnGap: 12,
      margin: [0, 14, 0, 0],
    },
  ];
};

export const exportPetProfilePdf = (
  data: PetProfileExportData,
  onProgress?: PdfExportProgressCallback
): Promise<void> => {
  const totalSteps = 3;
  let step = 0;

  reportExportProgress(onProgress, step, totalSteps);

  const content: Content[] = [
    ...buildProfileHeader(data),
    sectionTitle(PET_PROFILE_TEXT.SECTION_BASIC_PARAMS),
    keyValueTable(data.basicParams),
    sectionTitle(PET_PROFILE_TEXT.SECTION_HISTORY),
    ...(data.historyRows.length > 0
      ? [
          dataTable(
            [PET_PROFILE_TEXT.HISTORY_DATE, PET_PROFILE_TEXT.HISTORY_WEIGHT, PET_PROFILE_TEXT.HISTORY_ACTIVITY],
            data.historyRows.map((row) => [row.date, row.weight, row.activity])
          ),
        ]
      : [emptySection(PET_PROFILE_TEXT.NO_DATA)]),
    sectionTitle(PET_PROFILE_TEXT.SECTION_RECOMMENDATIONS),
    ...(data.recommendationRows.length > 0
      ? [
          dataTable(
            ['Номер записи', 'Дата записи', 'Ветеринарная клиника'],
            data.recommendationRows.map((row) => [row.recordNumber, row.date, row.clinic])
          ),
        ]
      : [emptySection(PET_PROFILE_TEXT.NO_DATA)]),
    sectionTitle(PET_PROFILE_TEXT.SECTION_CHANGE_LOGS),
    emptySection(PET_PROFILE_TEXT.NO_DATA),
  ];

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
      petName: { fontSize: 20, bold: true, color: TEXT, margin: [0, 0, 0, 6] },
      summaryLine: { fontSize: 10, color: TEXT, margin: [0, 0, 0, 4] },
      noPhoto: { fontSize: 9, color: MUTED },
      sectionTitle: { fontSize: 12, bold: true, color: BRAND },
      kvLabel: { fontSize: 9, color: MUTED },
      kvValue: { fontSize: 9, color: TEXT },
      tableHeader: { fontSize: 9, bold: true, color: '#FFFFFF' },
      tableCell: { fontSize: 9, color: TEXT },
      tableCellRight: { fontSize: 9, color: TEXT, alignment: 'right' },
      empty: { fontSize: 9, color: MUTED, italics: true },
    },
    content,
  };

  const fileName = buildPetProfileFileName(data.petName, data.exportDate);

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
