import React from 'react';
import { HistoryItem } from './HistoryItem';
import { formatDate } from '../../utils/formatDate';
import type { ScanHistoryItem } from '../../types/qr';

interface HistoryListProps {
  items: ScanHistoryItem[];
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (content: string) => void;
  onSelect: (item: ScanHistoryItem) => void;
}

function groupByDate(items: ScanHistoryItem[]): Record<string, ScanHistoryItem[]> {
  return items.reduce<Record<string, ScanHistoryItem[]>>((acc, item) => {
    const label = formatDate(item.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  onDelete,
  onToggleFavorite,
  onCopy,
  onSelect,
}) => {
  const groups = groupByDate(items);

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([date, groupItems]) => (
        <section key={date}>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 mb-1">
            {date}
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
            {groupItems.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
                onCopy={onCopy}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
