import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { Toast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-indigo-600 text-white',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg shadow-black/20',
              'pointer-events-auto animate-toast-in',
              'text-sm font-medium max-w-xs',
              styles[toast.type]
            )}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
