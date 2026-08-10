import React, { createContext, useCallback } from 'react';
import { useHistory } from '../hooks/useHistory';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import type { ScanHistoryItem, AppSettings } from '../types/qr';
import type { Toast } from '../hooks/useToast';

interface AppContextValue {
  // History
  history: ScanHistoryItem[];
  historyLoading: boolean;
  addToHistory: (item: ScanHistoryItem) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;

  // Settings & Theme
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  isDark: boolean;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => string;
  dismissToast: (id: string) => void;
}

export const AppContext = createContext<AppContextValue>({} as AppContextValue);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    history,
    loading: historyLoading,
    addItem,
    deleteItem,
    toggleFavorite: _toggleFavorite,
    clearAll: _clearAll,
  } = useHistory();

  const { settings, updateSettings, isDark } = useTheme();
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();

  const addToHistory = useCallback(
    async (item: ScanHistoryItem) => {
      await addItem(item);
    },
    [addItem]
  );

  const deleteHistoryItem = useCallback(
    async (id: string) => {
      await deleteItem(id);
    },
    [deleteItem]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      await _toggleFavorite(id);
    },
    [_toggleFavorite]
  );

  const clearAll = useCallback(async () => {
    await _clearAll();
  }, [_clearAll]);

  return (
    <AppContext.Provider
      value={{
        history,
        historyLoading,
        addToHistory,
        deleteHistoryItem,
        toggleFavorite,
        clearAll,
        settings,
        updateSettings,
        isDark,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
