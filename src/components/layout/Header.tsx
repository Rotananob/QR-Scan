import React from 'react';
import { QrCode } from 'lucide-react';
import { cn } from '../../utils/cn';

interface HeaderProps {
  title?: string;
  right?: React.ReactNode;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, right, className }) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between px-4 h-14',
        'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl',
        'border-b border-gray-200/60 dark:border-white/10',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-500/30">
          <QrCode className="w-4 h-4 text-white" />
        </div>
        <h1 className="font-bold text-gray-900 dark:text-white text-base">
          {title ?? 'QR Scan'}
        </h1>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
};
