/**
 * Canvas Image Preprocessing & Inversion Engine for Damaged / Inverted QR Codes
 */

export async function createProcessedCanvas(
  file: File,
  type: 'original' | 'inverted' | 'high_contrast' = 'original'
): Promise<HTMLCanvasElement> {
  const img = await createImageFromBlob(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get 2d context');

  ctx.drawImage(img, 0, 0);

  if (type === 'inverted') {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];         // R
      d[i + 1] = 255 - d[i + 1]; // G
      d[i + 2] = 255 - d[i + 2]; // B
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (type === 'high_contrast') {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    // Simple Otsu-like or high-contrast thresholding
    for (let i = 0; i < d.length; i += 4) {
      const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
      const val = avg > 128 ? 255 : 0;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas;
}

function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
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

export function canvasToFile(canvas: HTMLCanvasElement, filename = 'processed.png'): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas to blob failed'));
      resolve(new File([blob], filename, { type: 'image/png' }));
    }, 'image/png');
  });
}
