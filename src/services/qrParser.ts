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
} from '../types/qr';

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
    name: get('FN') ?? get('N'),
    phone: get('TEL'),
    email: get('EMAIL'),
    organization: get('ORG'),
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

export function parseQRContent(raw: string): QRResult {
  const trimmed = raw.trim();

  // Email
  if (trimmed.toLowerCase().startsWith('mailto:')) {
    const parsed = parseEmail(trimmed) as EmailData;
    return {
      raw: trimmed,
      type: 'EMAIL',
      title: parsed?.address ?? trimmed,
      parsed,
    };
  }

  // Phone
  if (trimmed.toLowerCase().startsWith('tel:')) {
    const parsed = parsePhone(trimmed) as PhoneData;
    return {
      raw: trimmed,
      type: 'PHONE',
      title: parsed?.number ?? trimmed,
      parsed,
    };
  }

  // SMS
  if (
    trimmed.toLowerCase().startsWith('sms:') ||
    trimmed.toLowerCase().startsWith('smsto:')
  ) {
    const parsed = parseSMS(trimmed) as SMSData;
    return {
      raw: trimmed,
      type: 'SMS',
      title: parsed?.number ?? trimmed,
      parsed,
    };
  }

  // WiFi
  if (trimmed.toUpperCase().startsWith('WIFI:')) {
    const parsed = parseWifi(trimmed) as WifiData;
    return {
      raw: trimmed,
      type: 'WIFI',
      title: parsed?.ssid ?? 'Wi-Fi Network',
      parsed,
    };
  }

  // vCard
  if (trimmed.toUpperCase().includes('BEGIN:VCARD')) {
    const parsed = parseVCard(trimmed) as VCardData;
    return {
      raw: trimmed,
      type: 'VCARD',
      title: parsed?.name ?? 'Contact',
      parsed,
    };
  }

  // Geo
  if (trimmed.toLowerCase().startsWith('geo:')) {
    const parsed = parseGeo(trimmed) as GeoData;
    return {
      raw: trimmed,
      type: 'GEO',
      title: parsed ? `${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)}` : trimmed,
      parsed,
    };
  }

  // Calendar
  if (trimmed.toUpperCase().includes('BEGIN:VCALENDAR') || trimmed.toUpperCase().includes('BEGIN:VEVENT')) {
    return {
      raw: trimmed,
      type: 'CALENDAR',
      title: 'Calendar Event',
      parsed: { kind: 'text', text: trimmed } as TextData,
    };
  }

  // Crypto (Bitcoin, Ethereum, etc.)
  if (/^(bitcoin|ethereum|litecoin):/i.test(trimmed)) {
    return {
      raw: trimmed,
      type: 'CRYPTO',
      title: 'Cryptocurrency Address',
      parsed: { kind: 'text', text: trimmed } as TextData,
    };
  }

  // URL
  const urlData = parseURL(trimmed);
  if (urlData) {
    return {
      raw: trimmed,
      type: 'URL',
      title: urlData.hostname,
      domain: urlData.hostname,
      isSecure: urlData.isSecure,
      parsed: urlData,
    };
  }

  // Plain text
  const textData: TextData = { kind: 'text', text: trimmed };
  return {
    raw: trimmed,
    type: 'TEXT',
    title: trimmed.length > 50 ? trimmed.slice(0, 50) + '...' : trimmed,
    parsed: textData,
  };
}

export function getContentTypeLabel(type: QRContentType): string {
  const labels: Record<QRContentType, string> = {
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
