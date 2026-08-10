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
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 items-center pointer-events-none w-full px-4"
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
              'flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
              'pointer-events-auto animate-toast-in backdrop-blur-md border border-white/20',
              'text-sm font-medium max-w-sm w-full sm:w-auto',
              styles[toast.type]
            )}
          >
            <Icon className="w-5 h-5 shrink-0 opacity-90" aria-hidden="true" />
            <span className="flex-1 text-left">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="ml-2 p-1 rounded-full hover:bg-black/10 opacity-70 hover:opacity-100 transition-all"
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
