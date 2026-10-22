import QRCode from 'qrcode';

/**
 * Generate a high-resolution base64 data URL for a QR code
 */
export async function generateQRDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 512,
      margin: 4, // ISO/IEC 18004 Quiet Zone compliant (minimum 4 modules)
      color: {
        dark: '#000000', // 100% pure black for optimal contrast and instant scanning
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR data URL:', err);
    return '';
  }
}

/**
 * Download a QR code directly as a PNG image to the user's gallery / downloads
 */
export async function downloadQRImage(text: string, filename = 'khqr-code.png'): Promise<boolean> {
  try {
    const dataUrl = await generateQRDataUrl(text);
    if (!dataUrl) return false;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('Failed to download QR code image:', err);
    return false;
  }
}
