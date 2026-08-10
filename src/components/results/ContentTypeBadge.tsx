import React from 'react';
import {
  Globe,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  User,
  MapPin,
  Calendar,
  Bitcoin,
  FileText,
  HelpCircle,
} from 'lucide-react';
import type { QRContentType } from '../../types/qr';
import { getContentTypeLabel } from '../../services/qrParser';
import { cn } from '../../utils/cn';

interface ContentTypeBadgeProps {
  type: QRContentType;
  className?: string;
}

const typeConfig: Record<
  QRContentType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  URL: { icon: Globe, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  TEXT: { icon: FileText, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
  EMAIL: { icon: Mail, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
  PHONE: { icon: Phone, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  SMS: { icon: MessageSquare, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/30' },
  WIFI: { icon: Wifi, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/30' },
  VCARD: { icon: User, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  GEO: { icon: MapPin, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
  CALENDAR: { icon: Calendar, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  CRYPTO: { icon: Bitcoin, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  UNKNOWN: { icon: HelpCircle, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
};

export const ContentTypeBadge: React.FC<ContentTypeBadgeProps> = ({ type, className }) => {
  const config = typeConfig[type] ?? typeConfig.UNKNOWN;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.color,
        config.bg,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {getContentTypeLabel(type)}
    </span>
  );
};

export function getTypeIcon(type: QRContentType): React.ElementType {
  return typeConfig[type]?.icon ?? HelpCircle;
}
