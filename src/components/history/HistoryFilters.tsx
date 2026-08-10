import React from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { QRContentType } from '../../types/qr';
import { cn } from '../../utils/cn';

interface HistoryFiltersProps {
  query: string;
  filterType: QRContentType | 'ALL';
  onQueryChange: (q: string) => void;
  onFilterChange: (f: QRContentType | 'ALL') => void;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  query,
  filterType,
  onQueryChange,
  onFilterChange,
}) => {
  const { t } = useTranslation();

  const FILTER_OPTIONS: { label: string; value: QRContentType | 'ALL' }[] = [
    { label: t('history.filters.all'), value: 'ALL' },
    { label: t('history.filters.url'), value: 'URL' },
    { label: t('history.filters.text'), value: 'TEXT' },
    { label: t('history.filters.email'), value: 'EMAIL' },
    { label: t('history.filters.phone'), value: 'PHONE' },
    { label: t('history.filters.wifi'), value: 'WIFI' },
    { label: t('history.filters.geo'), value: 'GEO' },
  ];

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search scans…"
          className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-100 dark:bg-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-white/5 focus:outline-none transition"
          aria-label="Search history"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Type filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Filter by type">
        {FILTER_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={cn(
              'shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all',
              filterType === value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
            )}
            aria-pressed={filterType === value}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
