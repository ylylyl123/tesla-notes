const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_TARGET_BYTES = 700 * 1024;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Canvas export failed"));
      },
      type,
      quality
    );
  });
}

export async function fileToDataUrl(file: Blob): Promise<string> {
  return blobToDataUrl(file);
}

export async function compressImageToDataUrl(
  file: Blob,
  options?: {
    maxDimension?: number;
    targetBytes?: number;
  }
): Promise<string> {
  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const targetBytes = options?.targetBytes ?? DEFAULT_TARGET_BYTES;

  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }

  let width = image.width;
  let height = image.height;

  const initialScale = Math.min(1, maxDimension / Math.max(width, height));
  width = Math.max(1, Math.round(width * initialScale));
  height = Math.max(1, Math.round(height * initialScale));

  // Prefer webp for screenshots to reduce payload size significantly.
  const preferredType = file.type === "image/png" ? "image/webp" : "image/jpeg";
  let quality = 0.84;
  let exported: Blob | null = null;

  for (let attempt = 0; attempt < 7; attempt += 1) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    exported = await canvasToBlob(canvas, preferredType, quality);

    if (exported.size <= targetBytes) {
      break;
    }

    if (quality > 0.62) {
      quality -= 0.08;
      continue;
    }

    // If quality is already low, shrink dimensions further.
    width = Math.max(1, Math.round(width * 0.85));
    height = Math.max(1, Math.round(height * 0.85));
    quality = 0.8;
  }

  if (!exported) {
    throw new Error("Image compression failed");
  }

  return blobToDataUrl(exported);
}
