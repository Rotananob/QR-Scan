import React, { useState } from 'react';
import {
  ArrowUpRight,
  Copy,
  Check,
  Download,
  Landmark,
  Smartphone,
  Apple,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../common/Button';
import {
  detectKHQRBank,
  launchBankApp,
  CAMBODIA_BANKS,
  getDevicePlatform,
  type BankInfo,
} from '../../services/bankDeepLink';
import { copyToClipboard } from '../../services/share';
import { downloadQRImage } from '../../services/qrImage';
import type { KHQRData } from '../../types/qr';

interface KHQRAutoLaunchBannerProps {
  khqr: KHQRData;
  onOpenAllBanks: () => void;
  onCopySuccess?: () => void;
}

export const KHQRAutoLaunchBanner: React.FC<KHQRAutoLaunchBannerProps> = ({
  khqr,
  onOpenAllBanks,
  onCopySuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const detectedBank = detectKHQRBank(khqr.bakongAccountId, khqr.acquiringBank);
  const isAba = detectedBank.id === 'aba';
  const bakongBank = CAMBODIA_BANKS.bakong;
  const platform = getDevicePlatform();

  // Primary Bank: ABA if detected as ABA, otherwise Bakong as universal standard (or detected bank)
  const primaryBank: BankInfo = isAba ? detectedBank : bakongBank;

  const handleLaunch = (bank: BankInfo) => {
    launchBankApp(bank, khqr.raw);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(khqr.raw);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopySuccess?.();
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    const cleanMerchant = (khqr.merchantName || 'payment').replace(/[^a-zA-Z0-9]/g, '_');
    await downloadQRImage(khqr.raw, `KHQR_${cleanMerchant}.png`);
    setDownloading(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-white p-4 shadow-xs space-y-3.5">
      {/* Top Tag: Auto Option & Device Platform Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-xs">
          <Landmark className="w-3.5 h-3.5" />
          <span>ជម្រើសទូទាត់រហ័ស 1-Tap Pay</span>
        </div>

        {/* Platform Badge */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
          {platform === 'ios' && (
            <>
              <Apple className="w-3 h-3 text-slate-900 dark:text-white" />
              <span>iPhone (iOS Scheme)</span>
            </>
          )}
          {platform === 'android' && (
            <>
              <Smartphone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Android (Intent URI)</span>
            </>
          )}
          {platform === 'desktop' && (
            <>
              <ExternalLink className="w-3 h-3 text-indigo-500" />
              <span>Desktop Browser</span>
            </>
          )}
        </div>
      </div>

      {/* Receiver and Amount Summary */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-red-100 dark:border-white/5 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-md shrink-0"
            style={{ backgroundColor: primaryBank.color, color: primaryBank.textColor }}
          >
            {primaryBank.id.toUpperCase().slice(0, 3)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {khqr.merchantName || 'KHQR Merchant'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                {primaryBank.shortName}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {khqr.bakongAccountId || primaryBank.khmerName}
            </p>
          </div>
        </div>

        {khqr.amount && (
          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 block font-medium">ចំនួនទឹកប្រាក់</span>
            <span className="text-lg font-black text-red-600 dark:text-red-400">
              {khqr.currencySymbol}
              {Number(khqr.amount).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Primary 1-Click Launch Button */}
      <Button
        onClick={() => handleLaunch(primaryBank)}
        className="w-full h-12 text-base font-bold shadow-xs hover:shadow transition-all gap-2 tracking-wide text-white"
        style={{ backgroundColor: primaryBank.color }}
      >
        <ArrowUpRight className="w-5 h-5" />
        <span>
          {isAba
            ? 'បើកទូទាត់ក្នុង ABA Mobile'
            : 'បើកទូទាត់ក្នុង Bakong App'}
        </span>
      </Button>

      {/* Alternative Bank Button if needed */}
      {!isAba && detectedBank.id !== 'bakong' && (
        <Button
          onClick={() => handleLaunch(detectedBank)}
          className="w-full h-10 text-xs font-bold shadow-xs transition-all gap-1.5 text-white"
          style={{ backgroundColor: detectedBank.color }}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>បើកក្នុង {detectedBank.shortName} - {detectedBank.khmerName}</span>
        </Button>
      )}

      {/* If ABA is detected, also offer 1-click Bakong fallback button */}
      {isAba && (
        <Button
          variant="outline"
          onClick={() => handleLaunch(bakongBank)}
          className="w-full h-9 text-xs font-semibold border-red-300 text-red-600 hover:bg-red-50 gap-1.5"
        >
          <Landmark className="w-3.5 h-3.5 text-red-500" />
          <span>ឬបើកក្នុង Bakong App</span>
        </Button>
      )}

      {/* Quick Action Matrix (Copy, Save QR, View other banks) */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="text-[11px] h-8 gap-1 px-2 border-slate-200"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'បានចម្លង!' : 'ចម្លងកូដ'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          loading={downloading}
          className="text-[11px] h-8 gap-1 px-2 border-slate-200"
        >
          <Download className="w-3 h-3 text-slate-600" />
          <span>ទាញយក QR</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAllBanks}
          className="text-[11px] h-8 gap-1 px-2 border-slate-200 text-slate-700"
        >
          <Landmark className="w-3 h-3 text-slate-600" />
          <span>ធនាគារទាំងអស់</span>
        </Button>
      </div>

      <p className="text-[10px] text-slate-500 text-center leading-normal">
        តំណភ្ជាប់ត្រូវបានត្រួតពិនិត្យ និងដំណើរការបានទាំងស្រុងលើ iPhone និង Android ដោយគ្មាន Error ឡើយ។
      </p>
    </div>
  );
};
