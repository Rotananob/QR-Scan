export type QRContentType =
  | 'URL'
  | 'TEXT'
  | 'EMAIL'
  | 'PHONE'
  | 'SMS'
  | 'WIFI'
  | 'VCARD'
  | 'GEO'
  | 'CALENDAR'
  | 'CRYPTO'
  | 'UNKNOWN';

export interface QRResult {
  raw: string;
  type: QRContentType;
  title: string;
  domain?: string;
  isSecure?: boolean;
  parsed?: ParsedQRData;
}

export type ParsedQRData =
  | URLData
  | EmailData
  | PhoneData
  | SMSData
  | WifiData
  | VCardData
  | GeoData
  | TextData;

export interface URLData {
  kind: 'url';
  href: string;
  protocol: string;
  hostname: string;
  isSecure: boolean;
  isDangerous: boolean;
}

export interface EmailData {
  kind: 'email';
  address: string;
  subject?: string;
  body?: string;
}

export interface PhoneData {
  kind: 'phone';
  number: string;
}

export interface SMSData {
  kind: 'sms';
  number: string;
  body?: string;
}

export interface WifiData {
  kind: 'wifi';
  ssid: string;
  password?: string;
  encryption: string;
  hidden?: boolean;
}

export interface VCardData {
  kind: 'vcard';
  name?: string;
  phone?: string;
  email?: string;
  organization?: string;
}

export interface GeoData {
  kind: 'geo';
  lat: number;
  lng: number;
  query?: string;
}

export interface TextData {
  kind: 'text';
  text: string;
}

export interface ScanHistoryItem {
  id: string;
  content: string;
  type: QRContentType;
  title: string;
  domain?: string;
  createdAt: number;
  favorite: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  vibrate: boolean;
  sound: boolean;
  preventDuplicates: boolean;
  autoStartScanner: boolean;
}

export type ScannerStatus =
  | 'idle'
  | 'requesting-permission'
  | 'permission-denied'
  | 'camera-unavailable'
  | 'starting'
  | 'scanning'
  | 'paused'
  | 'detected'
  | 'error';

export interface CameraDevice {
  deviceId: string;
  label: string;
}
