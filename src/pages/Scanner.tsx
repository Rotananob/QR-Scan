import React, { useState, useRef, useCallback, useContext } from 'react';
import { Upload, Keyboard, Sparkles } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import { QRScanner } from '../components/scanner/QRScanner';
import { ScanResult } from '../components/results/ScanResult';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { parseQRContent } from '../services/qrParser';
import { vibrate } from '../services/share';
import { sound } from '../services/sound';
import { AppContext } from '../context/AppContext';
import type { QRResult } from '../types/qr';

const ALL_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.AZTEC,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.MAXICODE,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.RSS_14,
  Html5QrcodeSupportedFormats.RSS_EXPANDED,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
];

export const ScannerPage: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings, addToHistory, showToast } = useContext(AppContext);
  const [result, setResult] = useState<QRResult | null>(null);
  const [scannerActive, setScannerActive] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedItemIdRef = useRef<string | null>(null);

  const handleDetected = useCallback(
    (raw: string, formatName?: string) => {
      const parsed = parseQRContent(raw, formatName);
      setResult(parsed);
      setScannerActive(false);

      if (settings.sound) sound.playScanSuccess();
      if (settings.vibrate) vibrate(60);

      if (settings.autoSave) {
        const id = crypto.randomUUID();
        savedItemIdRef.current = id;
        addToHistory({
          id,
          content: parsed.raw,
          type: parsed.type,
          title: parsed.title,
          domain: parsed.domain,
          formatName: parsed.formatName,
          createdAt: Date.now(),
          favorite: false,
        });
      }
    },
    [settings, addToHistory]
  );

  const handleScanAgain = () => {
    setResult(null);
    setFavorited(false);
    savedItemIdRef.current = null;
    setScannerActive(true);
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
  };

  const handleSave = () => {
    if (!result) return;
    if (savedItemIdRef.current) {
      showToast(t('results.alreadySaved'), 'info');
      return;
    }
    const id = crypto.randomUUID();
    savedItemIdRef.current = id;
    addToHistory({
      id,
      content: result.raw,
      type: result.type,
      title: result.title,
      domain: result.domain,
      formatName: result.formatName,
      createdAt: Date.now(),
      favorite: false,
    });
    showToast(t('results.alreadySaved'), 'success');
  };

  const handleFavorite = () => {
    setFavorited(!favorited);
    showToast(favorited ? t('results.removedFavorites') : t('results.addedFavorites'), 'success');
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    setManualOpen(false);
    handleDetected(manualInput.trim());
    setManualInput('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageLoading(true);

    const previewUrl = URL.createObjectURL(file);
    const tempId = 'qr-image-decoder-container';
    let div = document.getElementById(tempId);
    if (!div) {
      div = document.createElement('div');
      div.id = tempId;
      div.style.display = 'none';
      document.body.appendChild(div);
    }

    try {
      // 1. Try Native Hardware BarcodeDetector acceleration first (ultra-fast & robust)
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'aztec', 'data_matrix', 'code_128', 'ean_13', 'upc_a'],
          });
          const bitmap = await createImageBitmap(file);
          const detected = await detector.detect(bitmap);
          if (detected && detected.length > 0) {
            setPreviewImage(previewUrl);
            handleDetected(detected[0].rawValue, detected[0].format || 'QR_CODE');
            return;
          }
        } catch (bdErr) {
          console.warn('[BarcodeDetector] Image scan fallback:', bdErr);
        }
      }

      // 2. Try Dedicated QR Code engine (with renderImage: true for optimal canvas rendering)
      try {
        const qrScanner = new Html5Qrcode(tempId, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });
        const scanRes = await qrScanner.scanFile(file, true);
        qrScanner.clear();
        setPreviewImage(previewUrl);
        handleDetected(scanRes, 'QR_CODE');
        return;
      } catch (qrErr) {
        console.warn('[QR-Only Decoder] Fallback to multi-format:', qrErr);
      }

      // 3. Fallback to Multi-format decoder
      const allScanner = new Html5Qrcode(tempId, {
        verbose: false,
        formatsToSupport: ALL_FORMATS,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });

      const scanRes = await allScanner.scanFileV2(file, true);
      allScanner.clear();
      setPreviewImage(previewUrl);
      handleDetected(scanRes.decodedText, scanRes.result?.format?.formatName || 'QR_CODE');
    } catch {
      URL.revokeObjectURL(previewUrl);
      showToast(t('scanner.noQrFound'), 'error');
    } finally {
      setImageLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Title Header with Pro Badge */}
      <div className="px-4 pt-4 pb-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t('scanner.proBadge', 'Ultra HD AI Scanner • Scan All Formats')}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          {t('scanner.title')}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {t('scanner.subtitle')}
        </p>
      </div>

      <div className="flex-1 px-4 pb-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {/* Scanner or Result */}
        {!result ? (
          <>
            <QRScanner
              onDetected={handleDetected}
              autoStart={settings.autoStartScanner}
              preventDuplicates={settings.preventDuplicates}
              active={scannerActive}
              soundEnabled={settings.sound}
              onToggleSound={() => updateSettings({ sound: !settings.sound })}
              onUploadImage={() => fileInputRef.current?.click()}
            />

            {/* Quick Actions (Upload Image / Manual Input) */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                loading={imageLoading}
                className="gap-2 shadow-sm hover:shadow transition-all"
                id="upload-image-btn"
              >
                <Upload className="w-4 h-4 text-indigo-500" />
                {t('scanner.uploadImage')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setManualOpen(true)}
                className="gap-2 shadow-sm hover:shadow transition-all"
                id="manual-input-btn"
              >
                <Keyboard className="w-4 h-4 text-slate-500" />
                {t('scanner.manualInput')}
              </Button>
            </div>
          </>
        ) : (
          <ScanResult
            result={result}
            isFavorite={favorited}
            imagePreview={previewImage}
            onScanAgain={handleScanAgain}
            onSave={handleSave}
            onFavorite={handleFavorite}
            onCopy={() => showToast(t('results.copiedToClipboard'), 'success')}
            onShare={() => showToast(t('results.sharedSuccess'), 'success')}
          />
        )}
      </div>

      {/* Hidden file input for gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleImageUpload}
        aria-label="Upload QR code or Barcode image"
        id="qr-image-upload"
      />

      {/* Manual Input Modal */}
      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title={t('scanner.enterContent')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('scanner.manualInstruction')}
          </p>
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="https://example.com, WIFI:..., 000201..., barcode..."
            rows={4}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
            autoFocus
            aria-label="QR code content input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleManualSubmit();
            }}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setManualOpen(false)} className="flex-1">
              {t('scanner.cancel')}
            </Button>
            <Button onClick={handleManualSubmit} className="flex-1" disabled={!manualInput.trim()}>
              {t('scanner.process')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
