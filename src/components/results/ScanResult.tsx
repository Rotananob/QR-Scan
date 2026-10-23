import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  Copy,
  Eye,
  EyeOff,
  Barcode as BarcodeIcon,
  User,
  Building,
  AtSign,
  Phone,
  MapPin,
  FileText,
  Printer,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContentTypeBadge } from './ContentTypeBadge';
import { ResultActions } from './ResultActions';
import { KHQRAutoLaunchBanner } from './KHQRAutoLaunchBanner';
import { KHQRBankModal } from './KHQRBankModal';
import { KhqrStandeeModal } from '../standee/KhqrStandeeModal';
import { detectKHQRBank } from '../../services/bankDeepLink';
import { generateQRDataUrl } from '../../services/qrImage';
import { copyToClipboard } from '../../services/share';
import { analyzeUrlSafety, type SecurityAnalysisResult } from '../../services/securityShield';
import type {
  QRResult,
  URLData,
  WifiData,
  KHQRData,
  BarcodeData,
  VCardData,
  SocialData,
} from '../../types/qr';

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
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [standeeModalOpen, setStandeeModalOpen] = useState(false);
  const [showPhishingOverride, setShowPhishingOverride] = useState(false);

  const urlData = result.parsed?.kind === 'url' ? (result.parsed as URLData) : null;
  const wifiData = result.parsed?.kind === 'wifi' ? (result.parsed as WifiData) : null;
  const khqrData = result.parsed?.kind === 'khqr' ? (result.parsed as KHQRData) : null;
  const barcodeData = result.parsed?.kind === 'barcode' ? (result.parsed as BarcodeData) : null;
  const vcardData = result.parsed?.kind === 'vcard' ? (result.parsed as VCardData) : null;
  const socialData = result.parsed?.kind === 'social' ? (result.parsed as SocialData) : null;

  const isUrlContent = Boolean(urlData || result.type === 'URL' || /^https?:\/\//i.test(result.raw));
  const securityReport: SecurityAnalysisResult | null = isUrlContent ? analyzeUrlSafety(result.raw) : null;

  const copyField = async (text: string, fieldName: string) => {
    await copyToClipboard(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    onCopy();
  };

  const detectedBank = khqrData ? detectKHQRBank(khqrData.bakongAccountId, khqrData.acquiringBank) : null;

  useEffect(() => {
    if (result.type === 'KHQR') {
      generateQRDataUrl(result.raw).then(setQrCodeDataUrl).catch(() => {});
    }
  }, [result.raw, result.type]);

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-slate-200/70 dark:border-white/10 overflow-hidden animate-slide-up">
      {/* Optional Uploaded Image Preview */}
      {imagePreview && (
        <div className="w-full h-36 bg-slate-100 dark:bg-slate-800 border-b border-slate-200/50 dark:border-white/5 relative overflow-hidden">
          <img src={imagePreview} alt="Scanned Content" className="w-full h-full object-contain p-2" />
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shadow-inner shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {result.formatName || t('results.qrDetected', 'បានរកឃើញកូដ')}
            </p>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {result.title}
          </p>
        </div>
        <ContentTypeBadge type={result.type} />
      </div>

      <div className="p-4 space-y-3.5">
        {/* Top Priority: Instant Bank Auto-Launch Option Banner */}
        {khqrData && (
          <>
            <KHQRAutoLaunchBanner
              khqr={khqrData}
              onOpenAllBanks={() => setBankModalOpen(true)}
              onCopySuccess={onCopy}
            />
            <KHQRBankModal
              open={bankModalOpen}
              onClose={() => setBankModalOpen(false)}
              khqr={khqrData}
              onCopySuccess={onCopy}
            />
            <KhqrStandeeModal
              open={standeeModalOpen}
              onClose={() => setStandeeModalOpen(false)}
              qrData={{
                qrRaw: result.raw,
                merchantName: khqrData.merchantName,
                bankAccount: khqrData.bakongAccountId,
                amount: khqrData.amount ? String(khqrData.amount) : undefined,
                currency: khqrData.currency,
              }}
            />
          </>
        )}

        {/* 1. Cambodian Bakong KHQR Display Card */}
        {khqrData && (
          <div className="rounded-xl overflow-hidden border border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-500/5 via-rose-500/5 to-amber-500/5 p-4 space-y-3.5">
            {/* Header with Beneficiary Bank */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {detectedBank ? (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm shrink-0"
                    style={{ backgroundColor: detectedBank.color, color: detectedBank.textColor }}
                  >
                    {detectedBank.id.toUpperCase().slice(0, 3)}
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                    KH
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {khqrData.merchantName}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {detectedBank ? detectedBank.name : 'Bakong KHQR Payment'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                {khqrData.isDynamic ? 'Dynamic QR' : 'Static QR'}
              </span>
            </div>

            {/* Optional QR Code Preview for scanning/saving */}
            {qrCodeDataUrl && (
              <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-950/80 rounded-xl border border-red-100 dark:border-red-900/30">
                <img
                  src={qrCodeDataUrl}
                  alt="KHQR Code Preview"
                  className="w-40 h-40 object-contain rounded-lg shadow-xs"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
                  កូដ KHQR ផ្លូវការ • អាចស្កេន ឬរក្សាទុកបាន
                </p>
              </div>
            )}

            {/* Amount Banner */}
            {khqrData.amount && (
              <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-3 border border-red-100 dark:border-red-900/30 text-center shadow-xs">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">ចំនួនទឹកប្រាក់ (Amount)</p>
                <p className="text-2xl font-extrabold text-red-600 dark:text-red-400 tracking-tight">
                  {khqrData.currencySymbol}
                  {Number(khqrData.amount).toLocaleString()}{' '}
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {khqrData.currency}
                  </span>
                </p>
              </div>
            )}

            {/* Account / City info */}
            <div className="space-y-1.5 text-xs">
              {khqrData.bakongAccountId && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/40 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Bakong Account ID</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {khqrData.bakongAccountId}
                  </span>
                </div>
              )}
              {khqrData.merchantCity && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/40 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">ទីតាំង (City)</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {khqrData.merchantCity}
                  </span>
                </div>
              )}
              {khqrData.billNumber && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/40 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">លេខវិក្កយបត្រ (Bill No.)</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {khqrData.billNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Merchant Standee Table Tent Action */}
            <button
              type="button"
              onClick={() => setStandeeModalOpen(true)}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('standee.createButton', '🪧 បោះពុម្ពស្លាក Standee តុ (Print Merchant Standee)')}</span>
            </button>
          </div>
        )}

        {/* 2. Barcode / Product Card */}
        {barcodeData && (
          <div className="rounded-xl overflow-hidden border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarcodeIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {barcodeData.isIsbn ? 'ISBN Book Barcode' : `${barcodeData.formatName} Barcode`}
                  </h4>
                  <p className="text-lg font-mono font-bold text-slate-900 dark:text-white tracking-widest">
                    {barcodeData.code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => copyField(barcodeData.code, 'barcode')}
                className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 text-xs flex items-center gap-1 border border-slate-200 dark:border-white/10"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedField === 'barcode' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Social Media Link Card */}
        {socialData && (
          <div className="p-3.5 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {socialData.platform}
              </p>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                {socialData.username || socialData.url}
              </p>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
              {socialData.platform}
            </span>
          </div>
        )}

        {/* 4. vCard / MeCard Contact Card */}
        {vcardData && (
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 p-3.5 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {vcardData.name || 'Contact'}
                </p>
                {vcardData.organization && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {vcardData.organization}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-xs pt-1 border-t border-slate-200/50 dark:border-white/5">
              {vcardData.phone && (
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    {vcardData.phone}
                  </span>
                  <button
                    onClick={() => copyField(vcardData.phone!, 'phone')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {copiedField === 'phone' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
              {vcardData.email && (
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <AtSign className="w-3.5 h-3.5 text-violet-500" />
                    {vcardData.email}
                  </span>
                  <button
                    onClick={() => copyField(vcardData.email!, 'email')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {copiedField === 'email' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
              {vcardData.address && (
                <p className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {vcardData.address}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 5. URL Specific Card with AI Security Shield */}
        {isUrlContent && securityReport && (
          <div
            className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
              securityReport.level === 'danger'
                ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
                : securityReport.level === 'warning'
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/60'
                : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {securityReport.level === 'danger' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
                ) : securityReport.level === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {securityReport.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {securityReport.description}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                  securityReport.level === 'danger'
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                    : securityReport.level === 'warning'
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {securityReport.score}/100
              </span>
            </div>

            {/* Security Badges */}
            <div className="flex flex-wrap gap-1.5">
              {securityReport.badges.map((b, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    b.type === 'danger'
                      ? 'bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200'
                      : b.type === 'warning'
                      ? 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  {b.label}
                </span>
              ))}
            </div>

            {/* Phishing Warning Guard or Direct Open Link */}
            {securityReport.level === 'danger' && !showPhishingOverride ? (
              <div className="p-2.5 rounded-lg bg-rose-100/90 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 space-y-1.5">
                <p className="font-semibold text-[11px] leading-snug">
                  ⛔ ប្រព័ន្ធសុវត្ថិភាពបានទប់ស្កាត់ការបើកស្វ័យប្រវត្តិ ដើម្បីការពារគណនី និងលេខសម្ងាត់របស់អ្នក!
                </p>
                <button
                  type="button"
                  onClick={() => setShowPhishingOverride(true)}
                  className="text-[11px] underline font-bold text-rose-700 dark:text-rose-300 hover:text-rose-950 block text-left"
                >
                  ខ្ញុំយល់ពីហានិភ័យ ហើយចង់បើកតំណភ្ជាប់នេះ (Open Anyway)
                </button>
              </div>
            ) : (
              <a
                href={result.raw.startsWith('http') ? result.raw : `https://${result.raw}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-[11px] text-slate-400 font-medium">{t('results.openLink', 'ចុចដើម្បីបើកតំណភ្ជាប់')}</p>
                  <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 truncate group-hover:underline">
                    {result.raw}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0" />
              </a>
            )}
          </div>
        )}

        {/* 6. WiFi Specific Card */}
        {wifiData && (
          <div className="p-3.5 bg-sky-50/70 dark:bg-sky-900/20 rounded-xl space-y-2 border border-sky-100 dark:border-sky-800/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t('results.network')}</span>
              <span className="font-bold text-slate-900 dark:text-white">{wifiData.ssid}</span>
            </div>
            {wifiData.password && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('results.password')}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {showWifiPassword ? wifiData.password : '••••••••'}
                  </span>
                  <button
                    onClick={() => setShowWifiPassword(!showWifiPassword)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showWifiPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => copyField(wifiData.password!, 'wifi')}
                    className="text-sky-600 dark:text-sky-400 text-xs hover:underline ml-1"
                  >
                    {copiedField === 'wifi' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t('results.security')}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 uppercase text-xs">
                {wifiData.encryption || 'None'}
              </span>
            </div>
          </div>
        )}

        {/* Raw content viewer (always available for verification) */}
        {!khqrData && (
          <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-200/60 dark:border-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {t('results.content')}
              </p>
              <button
                onClick={() => copyField(result.raw, 'raw')}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedField === 'raw' ? 'Copied!' : 'Copy Raw'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 break-all leading-relaxed font-mono max-h-24 overflow-y-auto">
              {result.raw}
            </p>
          </div>
        )}

        {/* Action Buttons */}
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
