/**
 * Production Telegram Notification & Realtime Tracking Helper
 * Bot Token: 8652045486:AAESDUgU15iP8CbYdLZwGdQBS22sWGo6UxQ
 * Target Chat ID: 5969566967
 */

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8652045486:AAESDUgU15iP8CbYdLZwGdQBS22sWGo6UxQ';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5969566967';

/**
 * Sends an HTML-formatted message to the Telegram Bot Chat
 */
export async function sendTelegramAlert(messageHtml, disableWebPagePreview = true) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[TelegramAlert] Missing BOT_TOKEN or CHAT_ID');
    return false;
  }

  const endpoint = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: messageHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: disableWebPagePreview,
      }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json();
    if (!data.ok) {
      console.warn('[TelegramAlert] Send failed:', data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[TelegramAlert] Network error:', err.message);
    return false;
  }
}

/**
 * Extracts Client IP address from request headers
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
}

/**
 * Resolves Geolocation (Country, City, ISP) from IP & Request Headers
 */
export async function getClientLocation(ip, req = null) {
  let country = req?.headers?.['x-vercel-ip-country'] || req?.headers?.['cf-ipcountry'] || null;
  let city = req?.headers?.['x-vercel-ip-city'] || null;
  let countryCode = country;
  let isp = 'Internet Service Provider';

  // If local / private IP or Vercel headers not present, query ip-api
  const isPrivateIp =
    !ip ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.');

  if (!country || isPrivateIp) {
    try {
      const targetQuery = isPrivateIp ? '' : ip;
      const res = await fetch(`http://ip-api.com/json/${targetQuery}?fields=status,country,countryCode,city,isp,query`, {
        signal: AbortSignal.timeout(2500),
      });
      const data = await res.json();
      if (data.status === 'success') {
        country = data.country || country;
        city = data.city || city;
        countryCode = data.countryCode || countryCode;
        isp = data.isp || isp;
        if (isPrivateIp && data.query) {
          ip = data.query;
        }
      }
    } catch {}
  }

  // Country Flag Emoji helper
  const flagEmoji = countryCode
    ? countryCode
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    : '🌐';

  return {
    ip: ip || 'Unknown IP',
    country: country || 'Cambodia',
    city: city || 'Phnom Penh',
    countryCode: countryCode || 'KH',
    flag: flagEmoji,
    isp: isp || 'Broadband ISP',
  };
}

/**
 * Formats user-agent & client information into readable device description
 */
export function parseDeviceDetails(uaString = '', clientData = {}) {
  const ua = uaString || '';
  let os = 'Unknown OS';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS (Apple)';
  else if (/windows/i.test(ua)) os = 'Windows PC';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS (MacBook/iMac)';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown Browser';
  if (/crios/i.test(ua)) browser = 'Chrome iOS';
  else if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome/i.test(ua)) browser = 'Google Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Internet';

  const isPWA = Boolean(
    clientData.isPWA ||
    clientData.displayMode === 'standalone' ||
    /standalone/i.test(ua)
  );

  const display = isPWA ? '📱 PWA Standalone (Installed App)' : '🌐 Web Browser';
  const screen = clientData.screenWidth && clientData.screenHeight
    ? `${clientData.screenWidth}x${clientData.screenHeight}`
    : 'Desktop / Mobile';

  return {
    os,
    browser,
    display,
    screen,
    language: clientData.language || 'km-KH',
    platform: `${os} • ${browser}`,
  };
}

/**
 * Returns formatted Cambodia Time (UTC+7)
 */
export function getCambodiaTimeString() {
  const d = new Date();
  return d.toLocaleString('en-US', {
    timeZone: 'Asia/Phnom_Penh',
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
