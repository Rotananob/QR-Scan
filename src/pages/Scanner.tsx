import React, { useState, useRef, useCallback, useContext } from 'react';
import { Upload, Keyboard } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRScanner } from '../components/scanner/QRScanner';
import { ScanResult } from '../components/results/ScanResult';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { parseQRContent } from '../services/qrParser';
import { vibrate } from '../services/share';
import { AppContext } from '../context/AppContext';
import type { QRResult } from '../types/qr';

export const ScannerPage: React.FC = () => {
  const { settings, addToHistory, showToast } = useContext(AppContext);
  const [result, setResult] = useState<QRResult | null>(null);
  const [scannerActive, setScannerActive] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [favorited, setFavorited] = useState(false);
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
  };

  const handleSave = () => {
    if (!result) return;
    if (savedItemIdRef.current) {
      showToast('Already saved to history', 'info');
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
    showToast('Saved to history', 'success');
  };

  const handleFavorite = () => {
    setFavorited(!favorited);
    showToast(favorited ? 'Removed from favorites' : 'Added to favorites', 'success');
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
      const result = await scanner.scanFile(file, false);
      scanner.clear();
      handleDetected(result);
    } catch {
      showToast('No QR code found in this image', 'error');
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
          Scan QR Code
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Point your camera at a QR code
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
                Upload Image
              </Button>
              <Button
                variant="outline"
                onClick={() => setManualOpen(true)}
                className="gap-2"
                id="manual-input-btn"
              >
                <Keyboard className="w-4 h-4" />
                Manual Input
              </Button>
            </div>
          </>
        ) : (
          <ScanResult
            result={result}
            isFavorite={favorited}
            onScanAgain={handleScanAgain}
            onSave={handleSave}
            onFavorite={handleFavorite}
            onCopy={() => showToast('Copied to clipboard', 'success')}
            onShare={() => showToast('Shared successfully', 'success')}
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
        title="Enter QR Content"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Paste or type QR code content to process it without scanning.
          </p>
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="https://example.com or any QR content…"
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
              Cancel
            </Button>
            <Button onClick={handleManualSubmit} className="flex-1" disabled={!manualInput.trim()}>
              Process
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
