import React from 'react';
import { CheckCircle, Shield, ShieldOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContentTypeBadge } from './ContentTypeBadge';
import { ResultActions } from './ResultActions';
import type { QRResult } from '../../types/qr';
import type { URLData, WifiData } from '../../types/qr';

interface ScanResultProps {
  result: QRResult;
  isFavorite?: boolean;
  onScanAgain: () => void;
  onSave: () => void;
  onFavorite?: () => void;
  onCopy: () => void;
  onShare: () => void;
}

export const ScanResult: React.FC<ScanResultProps> = ({
  result,
  isFavorite,
  onScanAgain,
  onSave,
  onFavorite,
  onCopy,
  onShare,
}) => {
  const { t } = useTranslation();
  const urlData = result.parsed?.kind === 'url' ? (result.parsed as URLData) : null;
  const wifiData = result.parsed?.kind === 'wifi' ? (result.parsed as WifiData) : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-black/10 border border-gray-100 dark:border-white/10 overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-white/10">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('results.qrDetected')}</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[220px]">
            {result.title}
          </p>
        </div>
        <ContentTypeBadge type={result.type} />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* URL specific info */}
        {urlData && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
            {urlData.isSecure ? (
              <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <ShieldOff className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {urlData.isSecure ? t('results.secure') : t('results.notSecure')}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {urlData.hostname}
              </p>
            </div>
          </div>
        )}

        {/* WiFi specific */}
        {wifiData && (
          <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('results.network')}</span>
              <span className="font-medium text-gray-900 dark:text-white">{wifiData.ssid}</span>
            </div>
            {wifiData.password && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('results.password')}</span>
                <span className="font-medium text-gray-900 dark:text-white font-mono">
                  {wifiData.password}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('results.security')}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {wifiData.encryption || 'None'}
              </span>
            </div>
          </div>
        )}

        {/* Raw content */}
        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1 font-medium">{t('results.content')}</p>
          <p className="text-sm text-gray-800 dark:text-gray-200 break-all leading-relaxed font-mono max-h-24 overflow-y-auto">
            {result.raw}
          </p>
        </div>

        {/* Actions */}
        <ResultActions
          result={result}
          isFavorite={isFavorite}
          onScanAgain={onScanAgain}
          onSave={onSave}
          onFavorite={onFavorite}
          onCopy={onCopy}
          onShare={onShare}
        />
      </div>
    </div>
  );
};
