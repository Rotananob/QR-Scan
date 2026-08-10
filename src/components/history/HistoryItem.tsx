import React from 'react';
import { Heart, Trash2, Copy } from 'lucide-react';
import { ContentTypeBadge, getTypeIcon } from '../results/ContentTypeBadge';
import { Button } from '../common/Button';
import { copyToClipboard } from '../../services/share';
import { formatRelativeTime } from '../../utils/formatDate';
import type { ScanHistoryItem } from '../../types/qr';
import { cn } from '../../utils/cn';

interface HistoryItemProps {
  item: ScanHistoryItem;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (content: string) => void;
  onSelect: (item: ScanHistoryItem) => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({
  item,
  onDelete,
  onToggleFavorite,
  onCopy,
  onSelect,
}) => {
  const Icon = getTypeIcon(item.type);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyToClipboard(item.content);
    onCopy(item.content);
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5',
        'transition-colors cursor-pointer border-b border-gray-100 dark:border-white/5 last:border-0'
      )}
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(item)}
      aria-label={`View ${item.title}`}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {item.title}
          </p>
          <ContentTypeBadge type={item.type} className="shrink-0 hidden sm:inline-flex" />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {formatRelativeTime(item.createdAt)}
        </p>
      </div>

      {/* Actions (visible on hover/focus) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          aria-label="Copy content"
          className="w-8 h-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
          aria-label={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
          className="w-8 h-8"
        >
          <Heart
            className={cn(
              'w-3.5 h-3.5',
              item.favorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-gray-700'
            )}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          aria-label="Delete item"
          className="w-8 h-8 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
