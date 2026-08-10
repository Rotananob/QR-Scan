import React, { useContext, useState } from 'react';
import { Star } from 'lucide-react';
import { HistoryList } from '../components/history/HistoryList';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { ScanResult } from '../components/results/ScanResult';
import { parseQRContent } from '../services/qrParser';
import { AppContext } from '../context/AppContext';
import type { ScanHistoryItem, QRResult } from '../types/qr';
import { useNavigate } from 'react-router-dom';

export const FavoritesPage: React.FC = () => {
  const { history, deleteHistoryItem, toggleFavorite, showToast } = useContext(AppContext);
  const [selectedItem, setSelectedItem] = useState<QRResult | null>(null);
  const navigate = useNavigate();

  const favorites = history.filter((item) => item.favorite);

  const handleSelect = (item: ScanHistoryItem) => {
    setSelectedItem(parseQRContent(item.content));
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Favorites</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {favorites.length} saved item{favorites.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 px-4 pb-4">
        {favorites.length === 0 ? (
          <EmptyState
            icon={<Star className="w-8 h-8" />}
            title="No favorites yet"
            description="Tap the heart icon on any scan result to save it here."
            action={{ label: 'Start Scanning', onClick: () => navigate('/') }}
          />
        ) : (
          <HistoryList
            items={favorites}
            onDelete={async (id) => {
              await deleteHistoryItem(id);
              showToast('Removed from history', 'success');
            }}
            onToggleFavorite={async (id) => {
              await toggleFavorite(id);
              showToast('Removed from favorites', 'success');
            }}
            onCopy={() => showToast('Copied to clipboard', 'success')}
            onSelect={handleSelect}
          />
        )}
      </div>

      {selectedItem && (
        <Modal open={!!selectedItem} onClose={() => setSelectedItem(null)} title="Scan Details">
          <ScanResult
            result={selectedItem}
            onScanAgain={() => { setSelectedItem(null); navigate('/'); }}
            onSave={() => showToast('Already in history', 'info')}
            onCopy={() => showToast('Copied to clipboard', 'success')}
            onShare={() => {}}
          />
        </Modal>
      )}
    </div>
  );
};
