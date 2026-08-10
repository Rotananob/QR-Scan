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
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-900/30',
    secondary:
      'bg-surface-2 dark:bg-surface-2 hover:bg-surface-3 dark:hover:bg-surface-3 text-gray-800 dark:text-gray-100',
    ghost:
      'hover:bg-white/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400',
    danger:
      'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-900/30',
    outline:
      'border border-gray-200 dark:border-white/10 hover:bg-white/5 text-gray-700 dark:text-gray-300',
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
