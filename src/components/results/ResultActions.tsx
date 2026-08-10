import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Share2,
  Heart,
  RotateCcw,
  Mail,
  Phone,
  MessageSquare,
  Wifi,
  MapPin,
  Check,
} from 'lucide-react';
import { Button } from '../common/Button';
import { SafeLinkModal } from '../common/SafeLinkModal';
import { copyToClipboard, shareContent, canShare } from '../../services/share';
import type { QRResult } from '../../types/qr';
import type { URLData } from '../../types/qr';

interface ResultActionsProps {
  result: QRResult;
  isFavorite?: boolean;
  onScanAgain: () => void;
  onSave: () => void;
  onFavorite?: () => void;
  onCopy: () => void;
  onShare: () => void;
}

export const ResultActions: React.FC<ResultActionsProps> = ({
  result,
  isFavorite,
  onScanAgain,
  onSave: _onSave,
  onFavorite,
  onCopy,
  onShare,
}) => {
  const [safeLinkOpen, setSafeLinkOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(result.raw);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy();
    }
  };

  const handleShare = async () => {
    await shareContent(result.raw, result.title);
    onShare();
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
            Open Link
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
            Send Email
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
            Call
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
            Send SMS
          </Button>
        );
      case 'WIFI':
        return (
          <Button onClick={handleCopy} className="w-full gap-2" size="lg">
            <Wifi className="w-4 h-4" />
            Copy Network Info
          </Button>
        );
      case 'GEO':
        return (
          <Button
            onClick={() => {
              const geo = result.parsed;
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
            Open in Maps
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
            {copied ? 'Copied!' : 'Copy'}
          </Button>

          {canShare() ? (
            <Button
              variant="secondary"
              onClick={handleShare}
              className="gap-2"
              aria-label="Share content"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {onFavorite && (
            <Button
              variant="outline"
              onClick={onFavorite}
              className="gap-2"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
              />
              {isFavorite ? 'Saved' : 'Favorite'}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onScanAgain}
            className="gap-2"
            aria-label="Scan again"
          >
            <RotateCcw className="w-4 h-4" />
            Scan Again
          </Button>
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
