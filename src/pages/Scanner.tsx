import React, { useState, useRef, useCallback, useContext } from 'react';
import { Upload, Keyboard } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import { QRScanner } from '../components/scanner/QRScanner';
import { ScanResult } from '../components/results/ScanResult';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { parseQRContent } from '../services/qrParser';
import { vibrate } from '../services/share';
import { AppContext } from '../context/AppContext';
import type { QRResult } from '../types/qr';

export const ScannerPage: React.FC = () => {
  const { t } = useTranslation();
  const { settings, addToHistory, showToast } = useContext(AppContext);
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
    (raw: string) => {
      const parsed = parseQRContent(raw);
      setResult(parsed);
      setScannerActive(false);
      if (settings.vibrate) vibrate(50);
      if (settings.autoSave) {
        const id = crypto.randomUUID();
        savedItemIdRef.current = id;
        addToHistory({
          id,
          content: parsed.raw,
          type: parsed.type,
          title: parsed.title,
          domain: parsed.domain,
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
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    const tempId = 'qr-image-decoder';
    let div = document.getElementById(tempId);
    if (!div) {
      div = document.createElement('div');
      div.id = tempId;
      div.style.display = 'none';
      document.body.appendChild(div);
    }
    try {
      const scanner = new Html5Qrcode(tempId, { verbose: false });
      const resultText = await scanner.scanFile(file, false);
      scanner.clear();
      setPreviewImage(previewUrl);
      handleDetected(resultText);
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
      {/* Hero */}
      <div className="px-4 pt-4 pb-2 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
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
            />

            {/* Secondary actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                loading={imageLoading}
                className="gap-2"
                id="upload-image-btn"
              >
                <Upload className="w-4 h-4" />
                {t('scanner.uploadImage')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setManualOpen(true)}
                className="gap-2"
                id="manual-input-btn"
              >
                <Keyboard className="w-4 h-4" />
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleImageUpload}
        aria-label="Upload QR code image"
        id="qr-image-upload"
      />

      {/* Manual input modal */}
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
            placeholder="https://example.com…"
            rows={4}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
