import React from 'react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6 gap-4',
        'bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none mx-4',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 mb-2 shadow-inner">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} className="mt-4 shadow-md shadow-indigo-500/20">
          {action.label}
        </Button>
      )}
    </div>
  );
};
