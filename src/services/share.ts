export async function shareContent(text: string, title?: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title: title ?? 'QR Scan Result', text });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        return copyToClipboard(text);
      }
      return false;
    }
  }
  return copyToClipboard(text);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function canShare(): boolean {
  return !!navigator.share;
}

export function vibrate(pattern: number | number[] = 50): void {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
