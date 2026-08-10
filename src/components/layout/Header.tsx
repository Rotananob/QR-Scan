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
        'bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl',
        'border-b border-slate-200/50 dark:border-white/5 shadow-sm shadow-slate-200/20 dark:shadow-none',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="QR Scan Logo" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
        <h1 className="font-bold text-slate-900 dark:text-white text-base">
          {title ?? 'QR Scan'}
        </h1>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
};
