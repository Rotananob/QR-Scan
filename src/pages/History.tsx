import React, { useState, useContext } from 'react';
import { History, Trash2 } from 'lucide-react';
import { HistoryList } from '../components/history/HistoryList';
import { HistoryFilters } from '../components/history/HistoryFilters';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { ScanResult } from '../components/results/ScanResult';
import { parseQRContent } from '../services/qrParser';
import { AppContext } from '../context/AppContext';
import type { QRContentType, ScanHistoryItem, QRResult } from '../types/qr';
import { useNavigate } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const { history, deleteHistoryItem, toggleFavorite, showToast } = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<QRContentType | 'ALL'>('ALL');
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QRResult | null>(null);
  const { clearAll } = useContext(AppContext);
  const navigate = useNavigate();

  const filtered = history.filter((item) => {
    const matchesQuery =
      !query ||
      item.content.toLowerCase().includes(query.toLowerCase()) ||
      item.title.toLowerCase().includes(query.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesQuery && matchesType;
  });

  const handleSelect = (item: ScanHistoryItem) => {
    setSelectedItem(parseQRContent(item.content));
  };

  const handleClearAll = async () => {
    await clearAll();
    setClearConfirmOpen(false);
    showToast('History cleared', 'success');
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Filters */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">History</h2>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClearConfirmOpen(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5"
              aria-label="Clear all history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </Button>
          )}
        </div>
        <HistoryFilters
          query={query}
          filterType={filterType}
          onQueryChange={setQuery}
          onFilterChange={setFilterType}
        />
      </div>

      {/* List */}
      <div className="flex-1 px-4 pb-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<History className="w-8 h-8" />}
            title={history.length === 0 ? 'No scans yet' : 'No results'}
            description={
              history.length === 0
                ? 'Your scanned QR codes will appear here.'
                : 'Try adjusting your search or filter.'
            }
            action={
              history.length === 0
                ? { label: 'Scan QR Code', onClick: () => navigate('/') }
                : undefined
            }
          />
        ) : (
          <HistoryList
            items={filtered}
            onDelete={async (id) => {
              await deleteHistoryItem(id);
              showToast('Removed from history', 'success');
            }}
            onToggleFavorite={toggleFavorite}
            onCopy={() => showToast('Copied to clipboard', 'success')}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* Selected item detail modal */}
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

      {/* Clear confirmation modal */}
      <Modal
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title="Clear History"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete all {history.length} scan{history.length !== 1 ? 's' : ''}? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setClearConfirmOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearAll} className="flex-1">
              Clear All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
