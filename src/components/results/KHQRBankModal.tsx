import React, { useState } from 'react';
import {
  ExternalLink,
  Download,
  Copy,
  Check,
  Smartphone,
  ArrowUpRight,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  CAMBODIA_BANKS,
  launchBankApp,
  detectKHQRBank,
  type BankInfo,
} from '../../services/bankDeepLink';
import { downloadQRImage } from '../../services/qrImage';
import { copyToClipboard } from '../../services/share';
import type { KHQRData } from '../../types/qr';

interface KHQRBankModalProps {
  open: boolean;
  onClose: () => void;
  khqr: KHQRData;
  onCopySuccess?: () => void;
}

export const KHQRBankModal: React.FC<KHQRBankModalProps> = ({
  open,
  onClose,
  khqr,
  onCopySuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const detectedBank = detectKHQRBank(khqr.bakongAccountId, khqr.acquiringBank);
  const allBanks: BankInfo[] = Object.values(CAMBODIA_BANKS);

  const handleLaunch = (bank: BankInfo) => {
    launchBankApp(bank, khqr.raw);
  };

  const handleCopyPayload = async () => {
    const ok = await copyToClipboard(khqr.raw);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopySuccess?.();
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    const cleanMerchant = (khqr.merchantName || 'khqr').replace(/[^a-zA-Z0-9]/g, '_');
    await downloadQRImage(khqr.raw, `KHQR_${cleanMerchant}.png`);
    setDownloading(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ជ្រើសរើសធនាគារដើម្បីទូទាត់ (Pay with Bank)"
    >
      <div className="space-y-4">
        {/* Merchant & Detected Bank Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">គណនីទទួលប្រាក់ (Beneficiary)</span>
            <span className="px-2 py-0.5 rounded-full font-semibold text-[11px] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              {detectedBank.shortName}
            </span>
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white truncate">
            {khqr.merchantName}
          </p>
          {khqr.amount && (
            <p className="text-lg font-extrabold text-red-600 dark:text-red-400">
              {khqr.currencySymbol}
              {Number(khqr.amount).toLocaleString()} {khqr.currency}
            </p>
          )}
        </div>

        {/* Bank List */}
        <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            ធនាគារក្នុងស្រុក (Cambodian Mobile Banking)
          </p>

          <div className="space-y-2">
            {allBanks.map((bank) => {
              const isTarget = bank.id === detectedBank.id;
              return (
                <div
                  key={bank.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isTarget
                      ? 'border-red-400/60 dark:border-red-500/50 bg-red-50/40 dark:bg-red-950/20 shadow-xs'
                      : 'border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm shrink-0"
                      style={{ backgroundColor: bank.color, color: bank.textColor }}
                    >
                      {bank.id.toUpperCase().slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {bank.shortName}
                        </p>
                        {isTarget && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-600 text-white font-medium">
                            Receiver
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {bank.khmerName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleLaunch(bank)}
                      className="gap-1 text-xs px-3 h-8 shadow-sm"
                      style={{ backgroundColor: bank.color, color: bank.textColor }}
                    >
                      <span>បើក App</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                    <a
                      href={bank.playStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Install app from store"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Universal Fallback Options */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPayload}
              className="gap-1.5 text-xs h-9"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'បានចម្លង!' : 'ចម្លងកូដ KHQR'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              loading={downloading}
              className="gap-1.5 text-xs h-9 text-slate-800 dark:text-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>ទាញយករូបភាព QR</span>
            </Button>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2">
            <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p>
              <strong>វិធីទូទាត់ងាយស្រួលបំផុត៖</strong> ចុច <strong>"ទាញយករូបភាព QR"</strong> ទុកក្នុងទូរស័ព្ទ រួចបើក App ធនាគារណាមួយ (ABA, ACLEDA, Wing...) ហើយចុចលើប៊ូតុង <strong>"Scan ពីរូបភាព (Scan from Photo)"</strong> ដើម្បីទូទាត់ប្រាក់ភ្លាមៗ!
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
