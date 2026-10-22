import React, { useState, useContext } from 'react';
import { History, Trash2, Download, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HistoryList } from '../components/history/HistoryList';
import { HistoryFilters } from '../components/history/HistoryFilters';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { ScanResult } from '../components/results/ScanResult';
import { parseQRContent } from '../services/qrParser';
import { AppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import type { QRContentType, ScanHistoryItem, QRResult } from '../types/qr';
import { useNavigate } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { history, deleteHistoryItem, toggleFavorite, showToast, clearAll } = useContext(AppContext);
  const { isLifetime } = useAuth();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<QRContentType | 'ALL'>('ALL');
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QRResult | null>(null);
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
    setSelectedItem(parseQRContent(item.content, item.formatName));
  };

  const handleClearAll = async () => {
    await clearAll();
    setClearConfirmOpen(false);
    showToast(t('settings.clearAllData'), 'success');
  };

  const handleExportCSV = () => {
    if (!isLifetime) {
      showToast('មុខងារ Export គឺសម្រាប់សមាជិក Lifetime VIP ប៉ុណ្ណោះ', 'info');
      navigate('/upgrade');
      return;
    }

    if (history.length === 0) {
      showToast('មិនមានទិន្នន័យសម្រាប់ Export ទេ', 'info');
      return;
    }

    const headers = ['ID', 'Type', 'Title', 'Content', 'CreatedAt', 'IsFavorite'];
    const rows = history.map((item) => [
      `"${item.id}"`,
      `"${item.type}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${item.content.replace(/"/g, '""')}"`,
      `"${new Date(item.createdAt).toISOString()}"`,
      item.favorite ? 'true' : 'false',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr_scan_history_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('បានទាញយកទិន្នន័យ CSV ជោគជ័យ', 'success');
  };

  const handleExportJSON = () => {
    if (!isLifetime) {
      showToast('មុខងារ Export គឺសម្រាប់សមាជិក Lifetime VIP ប៉ុណ្ណោះ', 'info');
      navigate('/upgrade');
      return;
    }

    if (history.length === 0) {
      showToast('មិនមានទិន្នន័យសម្រាប់ Export ទេ', 'info');
      return;
    }

    const jsonString = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr_scan_backup_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('បានទាញយកទិន្នន័យ JSON ជោគជ័យ', 'success');
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Filters & Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('history.title')}</h2>
            {isLifetime ? (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Crown className="w-3 h-3 text-amber-500" />
                VIP UNLIMITED
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                Free ({history.length}/20)
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shadow-sm"
                  title={isLifetime ? 'Export CSV' : 'Export (VIP Required)'}
                >
                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                  <span>CSV</span>
                  {!isLifetime && <Crown className="w-3 h-3 text-amber-500 ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shadow-sm"
                  title={isLifetime ? 'Export JSON' : 'Export (VIP Required)'}
                >
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                  <span>JSON</span>
                  {!isLifetime && <Crown className="w-3 h-3 text-amber-500 ml-0.5" />}
                </button>
              </>
            )}

            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setClearConfirmOpen(true)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5"
                aria-label={t('history.clearAll')}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('history.clearAll')}
              </Button>
            )}
          </div>
        </div>

        {!isLifetime && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border border-amber-500/25 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">កូតា Free:</span> រក្សាទុកបានត្រឹម ២០ កូដ ({history.length}/20)។ Upgrade VIP ដើម្បីរក្សាទុកគ្មានដែនកំណត់ & Export!
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/upgrade')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm shrink-0 ml-2"
            >
              Upgrade VIP
            </button>
          </div>
        )}

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
            title={history.length === 0 ? t('history.noScans') : t('history.noResults')}
            description={
              history.length === 0
                ? t('history.noScansDesc')
                : t('history.noResultsDesc')
            }
            action={
              history.length === 0
                ? { label: t('nav.scan'), onClick: () => navigate('/') }
                : undefined
            }
          />
        ) : (
          <HistoryList
            items={filtered}
            onSelect={handleSelect}
            onDelete={async (id) => {
              await deleteHistoryItem(id);
              showToast(t('results.removedHistory'), 'success');
            }}
            onToggleFavorite={toggleFavorite}
            onCopy={() => showToast(t('results.copiedToClipboard'), 'success')}
          />
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <Modal
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={t('results.scanDetails') || selectedItem.title}
        >
          <ScanResult
            result={selectedItem}
            onScanAgain={() => { setSelectedItem(null); navigate('/'); }}
            onSave={() => showToast(t('results.alreadySaved'), 'info')}
            onCopy={() => showToast(t('results.copiedToClipboard'), 'success')}
            onShare={() => {}}
          />
        </Modal>
      )}

      {/* Clear All Confirmation Modal */}
      <Modal
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title={t('history.clearHistory') || t('settings.clearAllData')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('history.clearConfirmDesc', { count: history.length })}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setClearConfirmOpen(false)}
              className="flex-1"
            >
              {t('scanner.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleClearAll}
              className="flex-1"
            >
              {t('history.clearAll')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
