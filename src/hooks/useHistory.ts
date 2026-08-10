import { useState, useCallback, useEffect } from 'react';
import { storage } from '../services/storage';
import type { ScanHistoryItem, QRContentType } from '../types/qr';

export function useHistory() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const items = await storage.getHistory();
    setHistory(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addItem = useCallback(async (item: ScanHistoryItem) => {
    await storage.addHistoryItem(item);
    setHistory((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      return [item, ...filtered];
    });
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await storage.deleteHistoryItem(id);
    setHistory((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const item = history.find((i) => i.id === id);
    if (!item) return;
    const updates = { favorite: !item.favorite };
    await storage.updateHistoryItem(id, updates);
    setHistory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  }, [history]);

  const clearAll = useCallback(async () => {
    await storage.clearHistory();
    setHistory([]);
  }, []);

  const searchHistory = useCallback(
    (query: string, filterType?: QRContentType | 'ALL', favoritesOnly?: boolean) => {
      return history.filter((item) => {
        const matchesQuery =
          !query ||
          item.content.toLowerCase().includes(query.toLowerCase()) ||
          item.title.toLowerCase().includes(query.toLowerCase());
        const matchesType = !filterType || filterType === 'ALL' || item.type === filterType;
        const matchesFav = !favoritesOnly || item.favorite;
        return matchesQuery && matchesType && matchesFav;
      });
    },
    [history]
  );

  return {
    history,
    loading,
    addItem,
    deleteItem,
    toggleFavorite,
    clearAll,
    searchHistory,
    reload: loadHistory,
  };
}
