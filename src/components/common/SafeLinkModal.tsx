import React from 'react';
import { AlertTriangle, ExternalLink, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  if (!urlData) return null;

  const isDangerous = urlData.isDangerous;

  return (
    <Modal open={open} onClose={onCancel} title={isDangerous ? t('safeLink.dangerousTitle') : t('safeLink.openTitle')}>
      <div className="space-y-4">
        {isDangerous ? (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {t('safeLink.dangerousProtocol')}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {t('safeLink.dangerousDesc', { protocol: urlData.protocol })}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {t('safeLink.warningDesc')}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t('safeLink.domain')}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${urlData.isSecure ? 'bg-emerald-500' : 'bg-amber-500'}`}
                />
                <span className="font-medium text-slate-900 dark:text-white">
                  {urlData.hostname}
                </span>
                {!urlData.isSecure && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    {t('safeLink.httpWarning')}
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                {t('safeLink.fullUrl')}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 break-all bg-slate-50 dark:bg-white/5 rounded-lg p-3 font-mono">
                {urlData.href}
              </p>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {t('safeLink.cancel')}
          </Button>
          {!isDangerous && (
            <Button onClick={onConfirm} className="flex-1 gap-2">
              <ExternalLink className="w-4 h-4" />
              {t('safeLink.openLink')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
