import { useState, useCallback, useEffect } from 'react';
import { storage } from '../services/storage';
import {
  auth,
  onAuthStateChanged,
  saveHistoryItemToFirestore,
  deleteHistoryItemFromFirestore,
  updateHistoryItemInFirestore,
  fetchUserHistoryFromFirestore,
  clearUserHistoryFromFirestore,
} from '../services/firebase';
import type { ScanHistoryItem, QRContentType } from '../types/qr';

export function useHistory() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from local storage first (instant UI)
  const loadHistory = useCallback(async () => {
    setLoading(true);
    const localItems = await storage.getHistory();
    setHistory(localItems);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Sync with Firestore whenever user signs in or auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const remoteItems = await fetchUserHistoryFromFirestore(currentUser.uid);
          if (remoteItems && remoteItems.length > 0) {
            // Merge remote items with local storage
            const localItems = await storage.getHistory();
            const localMap = new Map(localItems.map((i) => [i.id, i]));

            // Add any remote items not in local
            for (const rItem of remoteItems) {
              if (!localMap.has(rItem.id)) {
                await storage.addHistoryItem(rItem);
                localMap.set(rItem.id, rItem);
              }
            }

            // Sync any local-only items up to Firestore
            for (const lItem of localItems) {
              if (!remoteItems.some((r) => r.id === lItem.id)) {
                saveHistoryItemToFirestore(currentUser.uid, lItem).catch(() => {});
              }
            }

            const merged = Array.from(localMap.values()).sort((a, b) => b.createdAt - a.createdAt);
            setHistory(merged);
          }
        } catch (err) {
          console.warn('[useHistory] Firestore sync error:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const addItem = useCallback(async (item: ScanHistoryItem) => {
    // 1. Store in local IndexedDB
    await storage.addHistoryItem(item);
    setHistory((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const updated = [item, ...filtered];
      const isVip = Boolean(
        auth.currentUser &&
        localStorage.getItem(`qr_scan_lifetime_vip_cached_${auth.currentUser.uid}`) === 'true'
      );

      // Free user history cap: strictly 20 items max
      if (!isVip && updated.length > 20) {
        const kept = updated.slice(0, 20);
        const overflow = updated.slice(20);
        for (const rem of overflow) {
          storage.deleteHistoryItem(rem.id).catch(() => {});
        }
        return kept;
      }
      return updated;
    });

    // 2. Also store in Firestore if user is authenticated
    const currentUser = auth.currentUser;
    if (currentUser) {
      saveHistoryItemToFirestore(currentUser.uid, item).catch((err) => {
        console.warn('[useHistory] Could not save to Firestore:', err);
      });
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    // 1. Delete from local IndexedDB
    await storage.deleteHistoryItem(id);
    setHistory((prev) => prev.filter((i) => i.id !== id));

    // 2. Also delete from Firestore if user is authenticated
    const currentUser = auth.currentUser;
    if (currentUser) {
      deleteHistoryItemFromFirestore(currentUser.uid, id).catch((err) => {
        console.warn('[useHistory] Could not delete from Firestore:', err);
      });
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const item = history.find((i) => i.id === id);
    if (!item) return;
    const updates = { favorite: !item.favorite };

    // 1. Update in local IndexedDB
    await storage.updateHistoryItem(id, updates);
    setHistory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );

    // 2. Also update in Firestore if user is authenticated
    const currentUser = auth.currentUser;
    if (currentUser) {
      updateHistoryItemInFirestore(currentUser.uid, id, updates).catch((err) => {
        console.warn('[useHistory] Could not update favorite in Firestore:', err);
      });
    }
  }, [history]);

  const clearAll = useCallback(async () => {
    // 1. Clear local IndexedDB
    await storage.clearHistory();
    setHistory([]);

    // 2. Also clear from Firestore if user is authenticated
    const currentUser = auth.currentUser;
    if (currentUser) {
      clearUserHistoryFromFirestore(currentUser.uid).catch((err) => {
        console.warn('[useHistory] Could not clear Firestore history:', err);
      });
    }
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
