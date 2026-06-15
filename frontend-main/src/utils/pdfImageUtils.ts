const PDF_IMAGE_PATTERN = /^data:image\/(jpeg|jpg|png);base64,/i;

export type PdfImagePayload = {
  dataUrl: string;
  width: number;
  height: number;
};

export const isPdfReadyImageDataUrl = (dataUrl?: string): dataUrl is string =>
  Boolean(dataUrl && PDF_IMAGE_PATTERN.test(dataUrl));

export const fitImageToBox = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  if (width < 1 || height < 1) {
    return { width: maxWidth, height: maxHeight };
  }

  const scale = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

const readImageDimensions = (src: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });

/** Converts any fetchable/browser image into JPEG data URL for pdfmake */
export const normalizeImageForPdf = async (url: string): Promise<PdfImagePayload | undefined> => {
  if (!url) return undefined;

  if (isPdfReadyImageDataUrl(url)) {
    try {
      const dimensions = await readImageDimensions(url);
      return { dataUrl: url, ...dimensions };
    } catch {
      return undefined;
    }
  }

  try {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) return undefined;

    const blob = await response.blob();
    if (!blob.size) return undefined;

    return await blobToJpegPayload(blob);
  } catch {
    return loadImageViaElement(url);
  }
};

const blobToJpegPayload = async (blob: Blob): Promise<PdfImagePayload | undefined> => {
  try {
    const bitmap = await createImageBitmap(blob);
    const payload = drawToJpegPayload(bitmap);
    bitmap.close?.();
    return payload;
  } catch {
    return undefined;
  }
};

const drawToJpegPayload = (
  source: CanvasImageSource & { width?: number; height?: number }
): PdfImagePayload | undefined => {
  const width = 'width' in source && source.width ? source.width : 1;
  const height = 'height' in source && source.height ? source.height : 1;
  if (width < 1 || height < 1) return undefined;

  const maxSize = 320;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  if (!isPdfReadyImageDataUrl(dataUrl)) return undefined;

  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
};

const loadImageViaElement = (url: string): Promise<PdfImagePayload | undefined> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      resolve(drawToJpegPayload(img));
    };

    img.onerror = () => resolve(undefined);
    img.src = url;
  });
