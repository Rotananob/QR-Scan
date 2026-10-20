import type {
  QRContentType,
  QRResult,
  URLData,
  EmailData,
  PhoneData,
  SMSData,
  WifiData,
  VCardData,
  GeoData,
  TextData,
  KHQRData,
  BarcodeData,
  SocialData,
} from '../types/qr';
import { detectKHQRBank } from './bankDeepLink';

const DANGEROUS_PROTOCOLS = new Set([
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
]);

function parseURL(raw: string): URLData | null {
  try {
    const url = new URL(raw);
    const protocol = url.protocol;
    const isDangerous = DANGEROUS_PROTOCOLS.has(protocol);
    return {
      kind: 'url',
      href: url.href,
      protocol,
      hostname: url.hostname,
      isSecure: protocol === 'https:',
      isDangerous,
    };
  } catch {
    return null;
  }
}

function parseEmail(raw: string): EmailData | null {
  const normalized = raw.toLowerCase().startsWith('mailto:') ? raw : null;
  if (!normalized) return null;
  try {
    const url = new URL(raw);
    const address = url.pathname;
    const params = url.searchParams;
    return {
      kind: 'email',
      address,
      subject: params.get('subject') ?? undefined,
      body: params.get('body') ?? undefined,
    };
  } catch {
    const address = raw.slice(7).split('?')[0];
    return { kind: 'email', address };
  }
}

function parsePhone(raw: string): PhoneData | null {
  if (!raw.toLowerCase().startsWith('tel:')) return null;
  return { kind: 'phone', number: raw.slice(4) };
}

function parseSMS(raw: string): SMSData | null {
  const lower = raw.toLowerCase();
  if (!lower.startsWith('sms:') && !lower.startsWith('smsto:')) return null;
  const prefix = lower.startsWith('smsto:') ? 6 : 4;
  const rest = raw.slice(prefix);
  const [number, ...bodyParts] = rest.split(':');
  return { kind: 'sms', number, body: bodyParts.join(':') || undefined };
}

function parseWifi(raw: string): WifiData | null {
  if (!raw.toUpperCase().startsWith('WIFI:')) return null;
  const content = raw.slice(5);
  const extract = (key: string): string | undefined => {
    const regex = new RegExp(`${key}:([^;]*);`);
    const m = content.match(regex);
    return m ? m[1] : undefined;
  };
  const ssid = extract('S') ?? '';
  const password = extract('P');
  const encryption = extract('T') ?? 'nopass';
  const hidden = extract('H') === 'true';
  return { kind: 'wifi', ssid, password, encryption, hidden };
}

function parseVCard(raw: string): VCardData | null {
  if (!raw.toUpperCase().includes('BEGIN:VCARD')) return null;
  const get = (field: string): string | undefined => {
    const regex = new RegExp(`^${field}[^:]*:(.*)$`, 'mi');
    const m = raw.match(regex);
    return m ? m[1].trim() : undefined;
  };
  return {
    kind: 'vcard',
    name: get('FN') ?? get('N')?.replace(/;/g, ' ').trim(),
    phone: get('TEL'),
    email: get('EMAIL'),
    organization: get('ORG'),
    title: get('TITLE'),
    website: get('URL'),
    address: get('ADR')?.replace(/;/g, ' ').trim(),
  };
}

function parseMeCard(raw: string): VCardData | null {
  if (!raw.toUpperCase().startsWith('MECARD:')) return null;
  const content = raw.slice(7);
  const extract = (prefix: string): string | undefined => {
    const regex = new RegExp(`${prefix}:([^;]*);`, 'i');
    const m = content.match(regex);
    return m ? m[1].trim() : undefined;
  };
  const name = extract('N')?.replace(/,/g, ' ');
  return {
    kind: 'vcard',
    name: name || undefined,
    phone: extract('TEL'),
    email: extract('EMAIL'),
    organization: extract('ORG'),
    address: extract('ADR'),
    website: extract('URL'),
  };
}

function parseGeo(raw: string): GeoData | null {
  if (!raw.toLowerCase().startsWith('geo:')) return null;
  const rest = raw.slice(4);
  const [coords, query] = rest.split('?');
  const [lat, lng] = coords.split(',').map(Number);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { kind: 'geo', lat, lng, query };
}

// EMVCo Tag-Length-Value parser for KHQR (Bakong / National Standard of Cambodia)
function parseEMVCo(raw: string): Map<string, string> {
  const tags = new Map<string, string>();
  let i = 0;
  while (i + 4 <= raw.length) {
    const tag = raw.substring(i, i + 2);
    const len = parseInt(raw.substring(i + 2, i + 4), 10);
    if (isNaN(len) || i + 4 + len > raw.length) break;
    const val = raw.substring(i + 4, i + 4 + len);
    tags.set(tag, val);
    i += 4 + len;
  }
  return tags;
}

function parseKHQR(raw: string): KHQRData | null {
  const trimmed = raw.trim();
  
  // Bakong deep links or web payment links
  if (trimmed.includes('bakong.nbc.gov.kh') || trimmed.startsWith('bakong://')) {
    return {
      kind: 'khqr',
      merchantName: 'Bakong Merchant',
      currency: 'USD',
      currencySymbol: '$',
      isDynamic: false,
      raw: trimmed,
    };
  }

  // EMVCo payload format (starts with 000201 or 00020101)
  if (!trimmed.startsWith('000201')) return null;

  const tags = parseEMVCo(trimmed);
  // Check if it's Cambodian KHQR (tag 58 is 'KH' or merchant tags contain bakong/nbc)
  const country = tags.get('58')?.toUpperCase();
  const merchantTag29 = tags.get('29');
  const merchantTag30 = tags.get('30');
  const isKhqr = country === 'KH' || 
                 (merchantTag29 && /bakong|nbc|abaa|aclb|wing/i.test(merchantTag29)) ||
                 (merchantTag30 && /bakong|nbc|abaa|aclb|wing/i.test(merchantTag30)) ||
                 trimmed.toLowerCase().includes('bakong');

  if (!isKhqr) return null;

  const isDynamic = tags.get('01') === '12';
  const currencyCode = tags.get('53') ?? '840'; // 840 is USD, 116 is KHR
  const isKhr = currencyCode === '116';
  const currency = isKhr ? 'KHR' : 'USD';
  const currencySymbol = isKhr ? '៛' : '$';
  const amount = tags.get('54');
  const merchantName = tags.get('59') || 'KHQR Merchant';
  const merchantCity = tags.get('60');

  // Extract Bakong account ID from Tag 29 or 30
  let bakongAccountId: string | undefined;
  let acquiringBank: string | undefined;
  const merchantTag = merchantTag29 || merchantTag30;
  if (merchantTag) {
    const subTags = parseEMVCo(merchantTag);
    bakongAccountId = subTags.get('00') || subTags.get('01');
    acquiringBank = subTags.get('02');
  }

  const detectedBank = detectKHQRBank(bakongAccountId, acquiringBank);

  // Extract Additional Info from Tag 62
  let billNumber: string | undefined;
  let storeLabel: string | undefined;
  let terminalLabel: string | undefined;
  const tag62 = tags.get('62');
  if (tag62) {
    const sub = parseEMVCo(tag62);
    billNumber = sub.get('01');
    storeLabel = sub.get('03');
    terminalLabel = sub.get('07');
  }

  return {
    kind: 'khqr',
    merchantName,
    bakongAccountId,
    acquiringBank,
    bankId: detectedBank.id,
    bankName: detectedBank.name,
    amount,
    currency,
    currencySymbol,
    merchantCity,
    billNumber,
    storeLabel,
    terminalLabel,
    isDynamic,
    raw: trimmed,
  };
}

// Social Media Link Detection
function parseSocial(urlStr: string): SocialData | null {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = url.pathname;

    // Telegram
    if (host === 't.me' || host === 'telegram.me') {
      const username = pathname.replace(/^\//, '').split('/')[0];
      return {
        kind: 'social',
        platform: 'telegram',
        username: username ? `@${username}` : undefined,
        url: urlStr,
        appDeepLink: username ? `tg://resolve?domain=${username}` : undefined,
      };
    }

    // WhatsApp
    if (host === 'wa.me' || (host === 'api.whatsapp.com' && pathname.includes('send'))) {
      const phone = host === 'wa.me' ? pathname.replace(/^\//, '') : url.searchParams.get('phone') ?? '';
      return {
        kind: 'social',
        platform: 'whatsapp',
        username: phone ? `+${phone}` : undefined,
        url: urlStr,
        appDeepLink: phone ? `whatsapp://send?phone=${phone}` : undefined,
      };
    }

    // Facebook
    if (host === 'facebook.com' || host === 'fb.com' || host === 'fb.me' || host === 'm.facebook.com') {
      return {
        kind: 'social',
        platform: 'facebook',
        url: urlStr,
        appDeepLink: `fb://facewebmodal/f?href=${encodeURIComponent(urlStr)}`,
      };
    }

    // TikTok
    if (host === 'tiktok.com' || host === 'vm.tiktok.com') {
      const username = pathname.startsWith('/@') ? pathname.slice(2).split('/')[0] : undefined;
      return {
        kind: 'social',
        platform: 'tiktok',
        username: username ? `@${username}` : undefined,
        url: urlStr,
      };
    }

    // YouTube
    if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
      return {
        kind: 'social',
        platform: 'youtube',
        url: urlStr,
      };
    }

    // Instagram
    if (host === 'instagram.com') {
      const username = pathname.replace(/^\//, '').split('/')[0];
      return {
        kind: 'social',
        platform: 'instagram',
        username: username && !['p', 'reel', 'stories', 'explore'].includes(username) ? `@${username}` : undefined,
        url: urlStr,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Barcode detection (UPC, EAN, ISBN, Code 128, etc.)
function parseBarcode(raw: string, formatName?: string): BarcodeData | null {
  const trimmed = raw.trim();

  // Explicit barcode format from scanner
  const isExplicitBarcode =
    formatName &&
    ['EAN_13', 'UPC_A', 'UPC_E', 'CODE_128', 'CODE_39', 'CODE_93', 'CODABAR', 'ITF', 'EAN_8', 'PDF_417'].includes(
      formatName
    );

  // Or numeric pattern matching standard barcode lengths (8, 12, 13, 14 digits)
  const isNumericBarcode = /^\d{8}$|^\d{12,14}$/.test(trimmed);

  if (!isExplicitBarcode && !isNumericBarcode) return null;

  const normalizedFormat = formatName || (trimmed.length === 13 ? 'EAN_13' : trimmed.length === 12 ? 'UPC_A' : 'BARCODE');
  
  // Check if ISBN book barcode
  const isIsbn = (trimmed.length === 13 && (trimmed.startsWith('978') || trimmed.startsWith('979'))) || (trimmed.length === 10 && /^\d{9}[\dX]$/i.test(trimmed));

  return {
    kind: 'barcode',
    formatName: normalizedFormat.replace(/_/g, '-'),
    code: trimmed,
    isIsbn,
    searchUrl: `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`,
    bookSearchUrl: isIsbn ? `https://www.google.com/search?tbm=bks&q=isbn:${encodeURIComponent(trimmed)}` : undefined,
  };
}

export function parseQRContent(raw: string, formatName?: string): QRResult {
  const trimmed = raw.trim();

  // 1. Cambodian Bakong KHQR
  const khqrData = parseKHQR(trimmed);
  if (khqrData) {
    const formattedAmount = khqrData.amount
      ? `${khqrData.currencySymbol}${Number(khqrData.amount).toLocaleString()} ${khqrData.currency}`
      : undefined;
    const bankSuffix = khqrData.bankName ? ` • ${khqrData.bankName}` : '';
    return {
      raw: trimmed,
      type: 'KHQR',
      title: `${khqrData.merchantName}${formattedAmount ? ` (${formattedAmount})` : ''}${bankSuffix}`,
      formatName: formatName || `KHQR (${khqrData.bankName || 'Bakong'})`,
      parsed: khqrData,
    };
  }

  // 2. Barcode (EAN, UPC, ISBN, Code 128)
  const barcodeData = parseBarcode(trimmed, formatName);
  if (barcodeData) {
    return {
      raw: trimmed,
      type: 'BARCODE',
      title: barcodeData.isIsbn ? `ISBN ${barcodeData.code}` : `${barcodeData.formatName} ${barcodeData.code}`,
      formatName: barcodeData.formatName,
      parsed: barcodeData,
    };
  }

  // 3. Email
  if (trimmed.toLowerCase().startsWith('mailto:')) {
    const parsed = parseEmail(trimmed) as EmailData;
    return {
      raw: trimmed,
      type: 'EMAIL',
      title: parsed?.address ?? trimmed,
      formatName: formatName || 'QR_CODE',
      parsed,
    };
  }

  // 4. Phone
  if (trimmed.toLowerCase().startsWith('tel:')) {
    const parsed = parsePhone(trimmed) as PhoneData;
    return {
      raw: trimmed,
      type: 'PHONE',
      title: parsed?.number ?? trimmed,
      formatName: formatName || 'QR_CODE',
      parsed,
    };
  }

  // 5. SMS
  if (
    trimmed.toLowerCase().startsWith('sms:') ||
    trimmed.toLowerCase().startsWith('smsto:')
  ) {
    const parsed = parseSMS(trimmed) as SMSData;
    return {
      raw: trimmed,
      type: 'SMS',
      title: parsed?.number ?? trimmed,
      formatName: formatName || 'QR_CODE',
      parsed,
    };
  }

  // 6. WiFi
  if (trimmed.toUpperCase().startsWith('WIFI:')) {
    const parsed = parseWifi(trimmed) as WifiData;
    return {
      raw: trimmed,
      type: 'WIFI',
      title: parsed?.ssid ? `Wi-Fi: ${parsed.ssid}` : 'Wi-Fi Network',
      formatName: formatName || 'QR_CODE',
      parsed,
    };
  }

  // 7. vCard / MeCard
  if (trimmed.toUpperCase().includes('BEGIN:VCARD')) {
    const parsed = parseVCard(trimmed) as VCardData;
    return {
      raw: trimmed,
      type: 'VCARD',
      title: parsed?.name ?? 'Contact Card',
      formatName: formatName || 'QR_CODE',
      parsed,
    };
  }

  if (trimmed.toUpperCase().startsWith('MECARD:')) {
    const parsed = parseMeCard(trimmed) as VCardData;
    return {
      raw: trimmed,
      type: 'VCARD',
      title: parsed?.name ?? 'Contact Card',
      formatName: formatName || 'QR_CODE',
      parsed,
    };
  }

  // 8. Geo
  if (trimmed.toLowerCase().startsWith('geo:')) {
    const parsed = parseGeo(trimmed) as GeoData;
    return {
      raw: trimmed,
      type: 'GEO',
      title: parsed ? `${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)}` : trimmed,
      formatName: formatName || 'QR_CODE',
      parsed,
    };
  }

  // 9. Calendar
  if (trimmed.toUpperCase().includes('BEGIN:VCALENDAR') || trimmed.toUpperCase().includes('BEGIN:VEVENT')) {
    return {
      raw: trimmed,
      type: 'CALENDAR',
      title: 'Calendar Event',
      formatName: formatName || 'QR_CODE',
      parsed: { kind: 'text', text: trimmed } as TextData,
    };
  }

  // 10. Crypto (Bitcoin, Ethereum, etc.)
  if (/^(bitcoin|ethereum|litecoin|solana|binance):/i.test(trimmed)) {
    return {
      raw: trimmed,
      type: 'CRYPTO',
      title: 'Crypto Address',
      formatName: formatName || 'QR_CODE',
      parsed: { kind: 'text', text: trimmed } as TextData,
    };
  }

  // 11. Social Media Links
  const socialData = parseSocial(trimmed);
  if (socialData) {
    const platformNames: Record<string, string> = {
      telegram: 'Telegram',
      whatsapp: 'WhatsApp',
      facebook: 'Facebook',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      instagram: 'Instagram',
    };
    const platform = platformNames[socialData.platform] || 'Social Media';
    return {
      raw: trimmed,
      type: 'SOCIAL',
      title: socialData.username ? `${platform}: ${socialData.username}` : `${platform} Link`,
      formatName: formatName || 'QR_CODE',
      parsed: socialData,
    };
  }

  // 12. Standard URL
  const urlData = parseURL(trimmed);
  if (urlData) {
    return {
      raw: trimmed,
      type: 'URL',
      title: urlData.hostname,
      domain: urlData.hostname,
      isSecure: urlData.isSecure,
      formatName: formatName || 'QR_CODE',
      parsed: urlData,
    };
  }

  // 13. Plain text
  const textData: TextData = { kind: 'text', text: trimmed };
  return {
    raw: trimmed,
    type: 'TEXT',
    title: trimmed.length > 50 ? trimmed.slice(0, 50) + '...' : trimmed,
    formatName: formatName || 'QR_CODE',
    parsed: textData,
  };
}

export function getContentTypeLabel(type: QRContentType): string {
  const labels: Record<QRContentType, string> = {
    KHQR: 'Bakong KHQR',
    BARCODE: 'Barcode',
    SOCIAL: 'Social Media',
    URL: 'Website',
    TEXT: 'Text',
    EMAIL: 'Email',
    PHONE: 'Phone',
    SMS: 'SMS',
    WIFI: 'Wi-Fi',
    VCARD: 'Contact',
    GEO: 'Location',
    CALENDAR: 'Calendar',
    CRYPTO: 'Crypto',
    UNKNOWN: 'Unknown',
  };
  return labels[type] ?? 'Unknown';
}

export function getContentTypeIcon(type: QRContentType): string {
  const icons: Record<QRContentType, string> = {
    KHQR: '🇰🇭',
    BARCODE: '🏷️',
    SOCIAL: '💬',
    URL: '🌐',
    TEXT: '📝',
    EMAIL: '✉️',
    PHONE: '📞',
    SMS: '💬',
    WIFI: '📶',
    VCARD: '👤',
    GEO: '📍',
    CALENDAR: '📅',
    CRYPTO: '₿',
    UNKNOWN: '❓',
  };
  return icons[type] ?? '❓';
}
