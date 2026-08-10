import React from 'react';
import { AlertTriangle, ExternalLink, ShieldAlert } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import type { URLData } from '../../types/qr';

interface SafeLinkModalProps {
  open: boolean;
  urlData: URLData | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SafeLinkModal: React.FC<SafeLinkModalProps> = ({
  open,
  urlData,
  onConfirm,
  onCancel,
}) => {
  if (!urlData) return null;

  const isDangerous = urlData.isDangerous;

  return (
    <Modal open={open} onClose={onCancel} title={isDangerous ? 'Dangerous Link Blocked' : 'Open External Link?'}>
      <div className="space-y-4">
        {isDangerous ? (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Dangerous protocol blocked
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                This QR code contains a dangerous protocol ({urlData.protocol}) that has been blocked for your safety.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This QR code points to an external website. Make sure you trust this source before proceeding.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Domain
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${urlData.isSecure ? 'bg-emerald-500' : 'bg-amber-500'}`}
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  {urlData.hostname}
                </span>
                {!urlData.isSecure && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    HTTP (Not Secure)
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Full URL
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 break-all bg-gray-50 dark:bg-white/5 rounded-lg p-3 font-mono">
                {urlData.href}
              </p>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          {!isDangerous && (
            <Button onClick={onConfirm} className="flex-1 gap-2">
              <ExternalLink className="w-4 h-4" />
              Open Link
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
