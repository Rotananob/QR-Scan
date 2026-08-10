import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants: Record<string, string> = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500/10',
    secondary:
      'bg-surface-2 dark:bg-surface-2 hover:bg-surface-3 dark:hover:bg-surface-3 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-white/5',
    ghost:
      'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400',
    danger:
      'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/25 border border-red-500/10',
    outline:
      'border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 shadow-sm',
  };

  const sizes: Record<string, string> = {
    sm: 'text-sm px-3 py-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 min-h-[40px]',
    lg: 'text-base px-6 py-3 min-h-[48px]',
    icon: 'w-10 h-10',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
};
