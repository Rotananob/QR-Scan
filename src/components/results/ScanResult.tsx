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
  imagePreview?: string | null;
  onScanAgain: () => void;
  onSave: () => void;
  onFavorite?: () => void;
  onCopy: () => void;
  onShare: () => void;
}

export const ScanResult: React.FC<ScanResultProps> = ({
  result,
  isFavorite,
  imagePreview,
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
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/50 dark:border-white/10 overflow-hidden animate-slide-up">
      {/* Image Preview */}
      {imagePreview && (
        <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 border-b border-slate-200/50 dark:border-white/5 relative overflow-hidden">
          <img src={imagePreview} alt="Scanned QR Code" className="w-full h-full object-contain p-2" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shadow-inner">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('results.qrDetected')}</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[220px]">
            {result.title}
          </p>
        </div>
        <ContentTypeBadge type={result.type} />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* URL specific info */}
        {urlData && (
          <a
            href={result.raw}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800/50 rounded-xl transition-colors cursor-pointer group"
          >
            {urlData.isSecure ? (
              <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <ShieldOff className="w-5 h-5 text-amber-500 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {urlData.isSecure ? t('results.secure') : t('results.notSecure')}
              </p>
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 truncate group-hover:underline">
                {result.raw}
              </p>
            </div>
          </a>
        )}

        {/* WiFi specific */}
        {wifiData && (
          <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl space-y-1.5 border border-sky-100 dark:border-sky-800/50">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t('results.network')}</span>
              <span className="font-medium text-slate-900 dark:text-white">{wifiData.ssid}</span>
            </div>
            {wifiData.password && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('results.password')}</span>
                <span className="font-medium text-slate-900 dark:text-white font-mono">
                  {wifiData.password}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t('results.security')}</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {wifiData.encryption || 'None'}
              </span>
            </div>
          </div>
        )}

        {/* Raw content */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-200/50 dark:border-white/5 shadow-inner">
          <p className="text-xs text-slate-400 mb-1 font-medium">{t('results.content')}</p>
          <p className="text-sm text-slate-800 dark:text-slate-200 break-all leading-relaxed font-mono max-h-24 overflow-y-auto">
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
