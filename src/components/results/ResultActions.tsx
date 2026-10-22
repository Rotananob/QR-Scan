import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  MapPin,
  Check,
  Share2,
  Star,
  PlusSquare,
  ScanLine,
  Search,
  BookOpen,
  UserPlus,
  Landmark,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { SafeLinkModal } from '../common/SafeLinkModal';
import { KHQRBankModal } from './KHQRBankModal';
import { detectKHQRBank, launchBankApp, CAMBODIA_BANKS } from '../../services/bankDeepLink';
import { downloadQRImage } from '../../services/qrImage';
import { copyToClipboard, shareContent, canShare } from '../../services/share';
import type {
  QRResult,
  URLData,
  GeoData,
  BarcodeData,
  SocialData,
  KHQRData,
  VCardData,
} from '../../types/qr';

interface ResultActionsProps {
  result: QRResult;
  isFavorite?: boolean;
  onScanAgain?: () => void;
  onSave?: () => void;
  onFavorite?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
}

export const ResultActions: React.FC<ResultActionsProps> = ({
  result,
  isFavorite = false,
  onScanAgain,
  onSave,
  onFavorite,
  onCopy,
  onShare,
}) => {
  const { t } = useTranslation();
  const [safeLinkOpen, setSafeLinkOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(result.raw);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    }
  };

  const handleDownloadQR = async () => {
    setDownloadingQR(true);
    const khqr = result.parsed as KHQRData | undefined;
    const cleanMerchant = (khqr?.merchantName || 'payment').replace(/[^a-zA-Z0-9]/g, '_');
    await downloadQRImage(result.raw, `KHQR_${cleanMerchant}.png`);
    setDownloadingQR(false);
  };

  const handleShare = async () => {
    await shareContent(result.raw, result.title);
    onShare?.();
  };

  const handleOpenLink = () => {
    if (result.type === 'URL') {
      setSafeLinkOpen(true);
    }
  };

  const confirmOpenLink = () => {
    setSafeLinkOpen(false);
    if (result.parsed?.kind === 'url') {
      window.open(result.raw, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadVCard = () => {
    const blob = new Blob([result.raw], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title || 'contact'}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const primaryActions = () => {
    switch (result.type) {
      case 'KHQR': {
        const khqr = result.parsed as KHQRData;
        const targetBank = detectKHQRBank(khqr?.bakongAccountId, khqr?.acquiringBank);
        const isAba = targetBank.id === 'aba';
        const primaryBank = isAba ? targetBank : CAMBODIA_BANKS.bakong;

        return (
          <div className="flex flex-col gap-2.5">
            {/* Primary Action Button: Verified ABA Mobile or Verified Bakong App */}
            <Button
              onClick={() => launchBankApp(primaryBank, result.raw)}
              className="w-full gap-2 text-white shadow-md font-bold tracking-wide transition-all h-12"
              style={{ backgroundColor: primaryBank.color }}
              size="lg"
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>
                {isAba
                  ? '🚀 បើកទូទាត់ក្នុង ABA Mobile'
                  : '🚀 បើកទូទាត់ក្នុង Bakong App'}
              </span>
            </Button>

            {/* If target bank was ACLEDA/Wing etc., also offer that bank button */}
            {!isAba && targetBank.id !== 'bakong' && (
              <Button
                onClick={() => launchBankApp(targetBank, result.raw)}
                className="w-full gap-1.5 text-white shadow-sm font-semibold h-10 text-xs"
                style={{ backgroundColor: targetBank.color }}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>បើកក្នុង {targetBank.shortName}</span>
              </Button>
            )}

            {/* Quick Bank Selector & QR Download */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setBankModalOpen(true)}
                className="gap-1.5 text-xs font-semibold h-10 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>ធនាគារទាំងអស់...</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadQR}
                loading={downloadingQR}
                className="gap-1.5 text-xs font-semibold h-10 text-slate-700 dark:text-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>ទាញយក QR ទុកស្កេន</span>
              </Button>
            </div>

            {khqr?.bakongAccountId && (
              <Button
                variant="ghost"
                onClick={async () => {
                  await copyToClipboard(khqr.bakongAccountId!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 h-8"
              >
                <Copy className="w-3 h-3" />
                <span>ចម្លងលេខគណនី: {khqr.bakongAccountId}</span>
              </Button>
            )}
          </div>
        );
      }

      case 'BARCODE': {
        const barcode = result.parsed as BarcodeData;
        return (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => window.open(barcode.searchUrl, '_blank', 'noopener,noreferrer')}
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
              size="lg"
            >
              <Search className="w-4 h-4" />
              {t('results.searchGoogle', 'ស្វែងរកទំនិញលើ Google')}
            </Button>
            {barcode.isIsbn && barcode.bookSearchUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(barcode.bookSearchUrl!, '_blank', 'noopener,noreferrer')}
                className="w-full gap-2"
              >
                <BookOpen className="w-4 h-4 text-amber-500" />
                {t('results.searchBooks', 'ស្វែងរកសៀវភៅ (Google Books)')}
              </Button>
            )}
          </div>
        );
      }

      case 'SOCIAL': {
        const social = result.parsed as SocialData;
        return (
          <Button
            onClick={() => {
              if (social.appDeepLink) {
                window.location.href = social.appDeepLink;
                setTimeout(() => {
                  window.open(social.url, '_blank', 'noopener,noreferrer');
                }, 500);
              } else {
                window.open(social.url, '_blank', 'noopener,noreferrer');
              }
            }}
            className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/20"
            size="lg"
          >
            <ExternalLink className="w-4 h-4" />
            {t('results.openSocial', 'បើកកម្មវិធី {{platform}}', {
              platform: social.platform.toUpperCase(),
            })}
          </Button>
        );
      }

      case 'VCARD': {
        const vcard = result.parsed as VCardData;
        return (
          <div className="flex flex-col gap-2">
            <Button onClick={handleDownloadVCard} className="w-full gap-2" size="lg">
              <UserPlus className="w-4 h-4" />
              {t('results.saveContact', 'រក្សាទុកក្នុងសៀវភៅទូរស័ព្ទ (.VCF)')}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {vcard?.phone && (
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = `tel:${vcard.phone}`)}
                  className="gap-2"
                >
                  <Phone className="w-4 h-4 text-emerald-500" />
                  {t('results.call', 'ហៅទូរស័ព្ទ')}
                </Button>
              )}
              {vcard?.email && (
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = `mailto:${vcard.email}`)}
                  className="gap-2"
                >
                  <Mail className="w-4 h-4 text-violet-500" />
                  {t('results.sendEmail', 'ផ្ញើអ៊ីមែល')}
                </Button>
              )}
            </div>
          </div>
        );
      }

      case 'URL':
        return (
          <Button onClick={handleOpenLink} className="w-full gap-2" size="lg">
            <ExternalLink className="w-4 h-4" />
            {t('results.openLink')}
          </Button>
        );

      case 'EMAIL':
        return (
          <Button
            onClick={() => (window.location.href = result.raw)}
            className="w-full gap-2"
            size="lg"
          >
            <Mail className="w-4 h-4" />
            {t('results.sendEmail')}
          </Button>
        );

      case 'PHONE':
        return (
          <Button
            onClick={() => (window.location.href = result.raw)}
            className="w-full gap-2"
            size="lg"
          >
            <Phone className="w-4 h-4" />
            {t('results.call')}
          </Button>
        );

      case 'SMS':
        return (
          <Button
            onClick={() => (window.location.href = result.raw)}
            className="w-full gap-2"
            size="lg"
          >
            <MessageSquare className="w-4 h-4" />
            {t('results.sendSms')}
          </Button>
        );

      case 'WIFI':
        return (
          <Button onClick={handleCopy} className="w-full gap-2" size="lg">
            <Wifi className="w-4 h-4" />
            {t('results.copyNetwork')}
          </Button>
        );

      case 'GEO':
        return (
          <Button
            onClick={() => {
              const geo = result.parsed as GeoData;
              if (geo?.kind === 'geo') {
                window.open(
                  `https://maps.google.com/?q=${geo.lat},${geo.lng}`,
                  '_blank',
                  'noopener,noreferrer'
                );
              }
            }}
            className="w-full gap-2"
            size="lg"
          >
            <MapPin className="w-4 h-4" />
            {t('results.openMaps')}
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {primaryActions()}

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={handleCopy}
            className="gap-2 shadow-sm"
            aria-label="Copy content"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? t('results.copied') : t('results.copy')}
          </Button>

          {canShare() ? (
            <Button
              variant="secondary"
              onClick={handleShare}
              className="gap-2 shadow-sm"
              aria-label="Share content"
            >
              <Share2 className="w-4 h-4" />
              {t('results.share')}
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {onFavorite ? (
            <Button
              variant="outline"
              onClick={onFavorite}
              className={`gap-2 ${
                isFavorite
                  ? 'text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30'
                  : ''
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? t('results.saved') : t('results.favorite')}
            </Button>
          ) : (
            <Button variant="outline" onClick={onSave} className="gap-2">
              <PlusSquare className="w-4 h-4" />
              {t('results.favorite')}
            </Button>
          )}

          {onScanAgain && (
            <Button
              variant="outline"
              onClick={onScanAgain}
              className="gap-2 shadow-sm"
              aria-label="Scan again"
            >
              <ScanLine className="w-4 h-4" />
              {t('results.scanAgain')}
            </Button>
          )}
        </div>
      </div>

      <SafeLinkModal
        open={safeLinkOpen}
        urlData={result.parsed?.kind === 'url' ? (result.parsed as URLData) : null}
        onConfirm={confirmOpenLink}
        onCancel={() => setSafeLinkOpen(false)}
      />

      {result.type === 'KHQR' && result.parsed?.kind === 'khqr' && (
        <KHQRBankModal
          open={bankModalOpen}
          onClose={() => setBankModalOpen(false)}
          khqr={result.parsed as KHQRData}
          onCopySuccess={() => onCopy?.()}
        />
      )}
    </>
  );
};
