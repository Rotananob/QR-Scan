import React, { useState, useRef, useCallback, useContext } from 'react';
import { Upload, Keyboard, Sparkles, Layers, Download, Trash2, Copy } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import { QRScanner } from '../components/scanner/QRScanner';
import { ScanResult } from '../components/results/ScanResult';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { parseQRContent } from '../services/qrParser';
import { vibrate } from '../services/share';
import { sound } from '../services/sound';
import { voiceAssistant } from '../services/voiceAssistant';
import { createProcessedCanvas, canvasToFile } from '../services/imageEnhancer';
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
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchItems, setBatchItems] = useState<Array<{
    id: string;
    raw: string;
    type: string;
    title: string;
    count: number;
    time: string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedItemIdRef = useRef<string | null>(null);

  const handleDetected = useCallback(
    (raw: string, formatName?: string) => {
      const parsed = parseQRContent(raw, formatName);

      if (isBatchMode) {
        if (settings.sound) {
          sound.playScanSuccess();
          voiceAssistant.speak(`បានស្កេន ${parsed.title}`);
        }
        if (settings.vibrate) vibrate(40);

        setBatchItems((prev) => {
          const existingIdx = prev.findIndex((item) => item.raw === parsed.raw);
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              count: updated[existingIdx].count + 1,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };
            return updated;
          } else {
            return [
              {
                id: crypto.randomUUID(),
                raw: parsed.raw,
                type: parsed.type,
                title: parsed.title,
                count: 1,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              },
              ...prev,
            ];
          }
        });

        showToast(`បានស្កេន: ${parsed.title}`, 'success');

        if (settings.autoSave) {
          addToHistory({
            id: crypto.randomUUID(),
            content: parsed.raw,
            type: parsed.type,
            title: parsed.title,
            domain: parsed.domain,
            formatName: parsed.formatName,
            createdAt: Date.now(),
            favorite: false,
          });
        }
        return;
      }

      setResult(parsed);
      setScannerActive(false);

      if (settings.sound) {
        sound.playScanSuccess();
        voiceAssistant.announceScanResult(parsed.type, {
          amount: parsed.type === 'KHQR' ? (parsed.parsed as any)?.amount : undefined,
          currency: parsed.type === 'KHQR' ? (parsed.parsed as any)?.currency : undefined,
          title: parsed.title,
        });
      }
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
    [isBatchMode, settings, addToHistory, showToast]
  );

  const downloadBatchCSV = () => {
    if (batchItems.length === 0) return;
    const header = ['ID', 'Type', 'Title', 'Content', 'Quantity', 'ScannedAt'];
    const rows = batchItems.map((item, idx) => [
      idx + 1,
      `"${item.type}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.raw.replace(/"/g, '""')}"`,
      item.count,
      `"${item.time}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Batch_Scan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('បានទាញយកឯកសារ CSV រួចរាល់', 'success');
  };

  const copyAllBatchCodes = async () => {
    if (batchItems.length === 0) return;
    const text = batchItems.map((item) => `${item.raw} (x${item.count})`).join('\n');
    await navigator.clipboard.writeText(text);
    showToast('បានចម្លងបញ្ជីកូដទាំងអស់', 'success');
  };

  const removeBatchItem = (id: string) => {
    setBatchItems((prev) => prev.filter((it) => it.id !== id));
  };

  const clearBatchItems = () => {
    setBatchItems([]);
    showToast('បានសម្អាតបញ្ជីស្កេន', 'info');
  };

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

      try {
        const scanRes = await allScanner.scanFileV2(file, true);
        allScanner.clear();
        setPreviewImage(previewUrl);
        handleDetected(scanRes.decodedText, scanRes.result?.format?.formatName || 'QR_CODE');
        return;
      } catch (multiErr) {
        console.warn('[Multi-Format Decoder] Fallback to AI enhancements:', multiErr);
      }

      // 4. AI Inversion Recovery for dark-mode / white-on-black QR codes
      try {
        const invertedCanvas = await createProcessedCanvas(file, 'inverted');
        const invertedFile = await canvasToFile(invertedCanvas, 'inverted.png');
        const invScanner = new Html5Qrcode(tempId, {
          verbose: false,
          formatsToSupport: ALL_FORMATS,
        });
        const invRes = await invScanner.scanFileV2(invertedFile, true);
        invScanner.clear();
        setPreviewImage(previewUrl);
        handleDetected(invRes.decodedText, invRes.result?.format?.formatName || 'QR_CODE');
        showToast('ស្កេនជោគជ័យដោយ AI Invert Color (White-on-Black QR)', 'success');
        return;
      } catch (invErr) {
        console.warn('[AI Inverter] Not decoded:', invErr);
      }

      // 5. AI High-Contrast Recovery for faint / damaged QR codes
      try {
        const hcCanvas = await createProcessedCanvas(file, 'high_contrast');
        const hcFile = await canvasToFile(hcCanvas, 'contrast.png');
        const hcScanner = new Html5Qrcode(tempId, {
          verbose: false,
          formatsToSupport: ALL_FORMATS,
        });
        const hcRes = await hcScanner.scanFileV2(hcFile, true);
        hcScanner.clear();
        setPreviewImage(previewUrl);
        handleDetected(hcRes.decodedText, hcRes.result?.format?.formatName || 'QR_CODE');
        showToast('ស្កេនជោគជ័យដោយ AI High Contrast Enhancement', 'success');
        return;
      } catch (hcErr) {
        console.warn('[AI High-Contrast] Not decoded:', hcErr);
      }

      throw new Error('No QR found across all AI algorithms');
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
            {/* Single vs Continuous Batch Mode Switcher */}
            <div className="flex items-center justify-between p-1 bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl max-w-sm mx-auto w-full border border-slate-300/40 dark:border-white/5 shadow-inner">
              <button
                type="button"
                onClick={() => setIsBatchMode(false)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  !isBatchMode
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ⚡ {t('scanner.singleMode', 'ស្កេនទោល (Single)')}
              </button>
              <button
                type="button"
                onClick={() => setIsBatchMode(true)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isBatchMode
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t('scanner.batchMode', 'ស្កេនបន្តបន្ទាប់ (Batch)')}</span>
                {batchItems.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold">
                    {batchItems.reduce((acc, it) => acc + it.count, 0)}
                  </span>
                )}
              </button>
            </div>

            <QRScanner
              onDetected={handleDetected}
              autoStart={settings.autoStartScanner}
              preventDuplicates={!isBatchMode && settings.preventDuplicates}
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

            {/* Continuous Batch Scan Inventory Tray */}
            {isBatchMode && (
              <div className="p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg space-y-3 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                      <Layers className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        បញ្ជីស្កេនបន្តបន្ទាប់ ({batchItems.length} មុខ)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        សរុប {batchItems.reduce((acc, it) => acc + it.count, 0)} បំណែក
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={batchItems.length === 0}
                      onClick={copyAllBatchCodes}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-xs flex items-center gap-1"
                      title="Copy All"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={batchItems.length === 0}
                      onClick={downloadBatchCSV}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                    <button
                      type="button"
                      disabled={batchItems.length === 0}
                      onClick={clearBatchItems}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
                      title="Clear All"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {batchItems.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                    <p>មិនទាន់មានទិន្នន័យស្កេននៅឡើយទេ</p>
                    <p className="text-[10px] mt-0.5">ដាក់កាមេរ៉ាលើ QR Code ឬ Barcode ដើម្បីស្កេនជាបន្តបន្ទាប់</p>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-white/5">
                    {batchItems.map((item) => (
                      <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                            {item.raw}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                            x{item.count}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeBatchItem(item.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
