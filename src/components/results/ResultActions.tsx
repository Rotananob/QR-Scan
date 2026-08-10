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
  ScanLine
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { SafeLinkModal } from '../common/SafeLinkModal';
import { copyToClipboard, shareContent, canShare } from '../../services/share';
import type { QRResult, URLData, GeoData } from '../../types/qr';

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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(result.raw);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    }
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

  const primaryActions = () => {
    switch (result.type) {
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
            onClick={() => window.location.href = result.raw}
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
            onClick={() => window.location.href = result.raw}
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
            onClick={() => window.location.href = result.raw}
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
            className="gap-2"
            aria-label="Copy content"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? t('results.copied') : t('results.copy')}
          </Button>

          {canShare() ? (
            <Button
              variant="secondary"
              onClick={handleShare}
              className="gap-2"
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
              className={`gap-2 ${isFavorite ? 'text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
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
              className="gap-2"
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
    </>
  );
};
