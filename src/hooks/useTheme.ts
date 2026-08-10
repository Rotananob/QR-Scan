import { useState, useEffect, useCallback } from 'react';
import { storage } from '../services/storage';
import type { AppSettings } from '../types/qr';

export function useTheme() {
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark =
    settings.theme === 'dark' || (settings.theme === 'system' && systemDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (settings.theme === 'system') {
        const root = document.documentElement;
        if (mq.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      storage.saveSettings(next);
      return next;
    });
  }, []);

  return { settings, updateSettings, isDark };
}
