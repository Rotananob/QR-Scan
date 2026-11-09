import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';
import type { AppSettings } from '../types/qr';

export function useTheme() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const s = storage.getSettings();
    return s.theme === 'system' ? { ...s, theme: 'light' } : s;
  });

  const isDark = settings.theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      storage.saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings, isDark };
}
