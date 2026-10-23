/**
 * Realtime Client-Side Visitor & Action Tracking Service
 * Sends structured events to Telegram alert backend
 */

interface ClientTrackData {
  screenWidth: number;
  screenHeight: number;
  language: string;
  isPWA: boolean;
  displayMode: string;
}

function getClientData(): ClientTrackData {
  const isPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  return {
    screenWidth: window.screen?.width || window.innerWidth,
    screenHeight: window.screen?.height || window.innerHeight,
    language: navigator.language || 'km-KH',
    isPWA,
    displayMode: isPWA ? 'standalone' : 'browser',
  };
}

const SESSION_TRACK_KEY = 'qr_scan_visit_tracked';
const LAST_GEN_ALERT_TIME = 'qr_last_gen_alert_time';

export async function trackVisitor(user: { uid?: string; email?: string | null; displayName?: string | null } | null) {
  try {
    // Only track once per browser session to avoid spamming the Telegram bot
    const alreadyTracked = sessionStorage.getItem(SESSION_TRACK_KEY);
    if (alreadyTracked) return;

    sessionStorage.setItem(SESSION_TRACK_KEY, String(Date.now()));

    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'page_visit',
        clientData: getClientData(),
        user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
        details: {
          path: window.location.pathname,
          referrer: document.referrer || 'Direct Visit',
        },
      }),
    });
  } catch (err) {
    // Non-blocking telemetry
    console.debug('[Tracker] Visit track error:', err);
  }
}

export async function trackQrGenerated(
  type: string,
  contentSnippet: string,
  user: { uid?: string; email?: string | null; displayName?: string | null } | null
) {
  try {
    // Debounce to at most 1 alert every 5 seconds per client
    const now = Date.now();
    const lastAlert = Number(sessionStorage.getItem(LAST_GEN_ALERT_TIME) || 0);
    if (now - lastAlert < 5000) return;
    sessionStorage.setItem(LAST_GEN_ALERT_TIME, String(now));

    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'qr_generated',
        clientData: getClientData(),
        user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
        details: {
          type,
          title: contentSnippet.slice(0, 150),
        },
      }),
    });
  } catch (err) {
    console.debug('[Tracker] QR generated track error:', err);
  }
}

export async function trackQrExpired(
  tranId: string,
  user: { uid?: string; email?: string | null; displayName?: string | null } | null
) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'qr_expired',
        clientData: getClientData(),
        user: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
        details: {
          tranId,
        },
      }),
    });
  } catch (err) {
    console.debug('[Tracker] QR expired track error:', err);
  }
}
