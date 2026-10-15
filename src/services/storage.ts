import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ScanHistoryItem, AppSettings } from '../types/qr';

interface QRScanDB extends DBSchema {
  history: {
    key: string;
    value: ScanHistoryItem;
    indexes: { 'by-date': number; 'by-type': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'qr-scan-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<QRScanDB>> | null = null;

function getDB(): Promise<IDBPDatabase<QRScanDB>> {
  if (!dbPromise) {
    dbPromise = openDB<QRScanDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('history')) {
          const store = db.createObjectStore('history', { keyPath: 'id' });
          store.createIndex('by-date', 'createdAt');
          store.createIndex('by-type', 'type');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

export const storage = {
  async addHistoryItem(item: ScanHistoryItem): Promise<void> {
    try {
      const db = await getDB();
      await db.put('history', item);
    } catch (err) {
      console.error('Storage error:', err);
      // Fallback to localStorage
      const items = this.getHistoryFromLS();
      const existing = items.findIndex((i) => i.id === item.id);
      if (existing >= 0) items[existing] = item;
      else items.unshift(item);
      localStorage.setItem('qr-scan-history', JSON.stringify(items.slice(0, 500)));
    }
  },

  async getHistory(): Promise<ScanHistoryItem[]> {
    try {
      const db = await getDB();
      const all = await db.getAllFromIndex('history', 'by-date');
      return all.reverse();
    } catch {
      return this.getHistoryFromLS();
    }
  },

  async deleteHistoryItem(id: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete('history', id);
    } catch {
      const items = this.getHistoryFromLS().filter((i) => i.id !== id);
      localStorage.setItem('qr-scan-history', JSON.stringify(items));
    }
  },

  async clearHistory(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear('history');
    } catch {
      localStorage.removeItem('qr-scan-history');
    }
  },

  async updateHistoryItem(id: string, updates: Partial<ScanHistoryItem>): Promise<void> {
    try {
      const db = await getDB();
      const item = await db.get('history', id);
      if (item) {
        await db.put('history', { ...item, ...updates });
      }
    } catch {
      const items = this.getHistoryFromLS();
      const idx = items.findIndex((i) => i.id === id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...updates };
        localStorage.setItem('qr-scan-history', JSON.stringify(items));
      }
    }
  },

  getHistoryFromLS(): ScanHistoryItem[] {
    try {
      return JSON.parse(localStorage.getItem('qr-scan-history') ?? '[]');
    } catch {
      return [];
    }
  },

  getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem('qr-scan-settings');
      if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
    } catch {}
    return defaultSettings;
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem('qr-scan-settings', JSON.stringify(settings));
  },
};

export const defaultSettings: AppSettings = {
  theme: 'system',
  autoSave: true,
  vibrate: true,
  sound: true,
  preventDuplicates: true,
  autoStartScanner: true,
  highResolution: true,
  scanMode: 'all',
};
