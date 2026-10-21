import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import type { ScanMode } from '../../hooks/useQRScanner';

interface ScannerOverlayProps {
  isScanning: boolean;
  isDetected?: boolean;
  scanMode?: ScanMode;
  isHD?: boolean;
  focusPoint?: { x: number; y: number } | null;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  isScanning,
  isDetected = false,
  scanMode = 'all',
  isHD = true,
  focusPoint,
}) => {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();

  const isBarcodeMode = scanMode === 'barcode';
  const isKhqrMode = scanMode === 'khqr';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
      {/* Semi-transparent dark vignette mask */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Top HUD Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isHD ? 'HD 1080p' : 'LIVE'}</span>
          <span className="text-white/40">•</span>
          <span className="text-white/80">25 FPS</span>
        </div>

        {isKhqrMode && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600/80 backdrop-blur-md text-[11px] font-semibold text-white shadow-lg border border-red-400/30">
            <span>KHQR Bakong</span>
          </div>
        )}

        {isBarcodeMode && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-600/80 backdrop-blur-md text-[11px] font-semibold text-white shadow-lg border border-indigo-400/30">
            <span>1D Barcode</span>
          </div>
        )}
      </div>

      {/* Main Viewfinder Frame */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`relative transition-all duration-300 ${
            isBarcodeMode ? 'w-[86%] h-36 max-w-[340px]' : 'w-64 h-64 sm:w-72 sm:h-72'
          }`}
        >
          {/* Target Corner Brackets with Cyber Glow */}
          <span
            className={`absolute -top-1 -left-1 w-8 h-8 border-t-3 border-l-3 rounded-tl-xl transition-colors duration-200 ${
              isDetected
                ? 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                : 'border-indigo-400 shadow-glow-indigo'
            }`}
          />
          <span
            className={`absolute -top-1 -right-1 w-8 h-8 border-t-3 border-r-3 rounded-tr-xl transition-colors duration-200 ${
              isDetected
                ? 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                : 'border-indigo-400 shadow-glow-indigo'
            }`}
          />
          <span
            className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-3 border-l-3 rounded-bl-xl transition-colors duration-200 ${
              isDetected
                ? 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                : 'border-indigo-400 shadow-glow-indigo'
            }`}
          />
          <span
            className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-3 border-r-3 rounded-br-xl transition-colors duration-200 ${
              isDetected
                ? 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]'
                : 'border-indigo-400 shadow-glow-indigo'
            }`}
          />

          {/* Transparent cutout border */}
          <div
            className={`absolute inset-0 rounded-xl transition-colors duration-200 ${
              isDetected
                ? 'border-2 border-emerald-400/80 bg-emerald-400/10'
                : 'border border-white/20 bg-transparent'
            }`}
          />

          {/* Center Target Reticle Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-4 h-4 border border-dashed border-white/70 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
          </div>

          {/* High-tech Laser Scanning Line */}
          {isScanning && !isDetected && (
            <div
              className={`absolute left-2 right-2 ${
                isBarcodeMode
                  ? 'h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_rgba(239,68,68,0.9)]'
                  : 'h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_rgba(99,102,241,0.9)]'
              } ${reducedMotion ? 'opacity-50' : 'animate-scan-line'}`}
            />
          )}

          {/* Detection Flash pulse */}
          {isDetected && (
            <div className="absolute inset-0 bg-emerald-400/25 animate-pulse rounded-xl" />
          )}
        </div>
      </div>

      {/* Tap to Focus Animated Reticle */}
      {focusPoint && (
        <div
          className="absolute w-14 h-14 -translate-x-1/2 -translate-y-1/2 border-2 border-amber-400 rounded-full animate-ping pointer-events-none z-30"
          style={{ left: focusPoint.x, top: focusPoint.y }}
        />
      )}

      {/* Instruction Banner at Bottom */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 z-20 px-4">
        <div className="bg-black/70 backdrop-blur-md text-white text-xs px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg text-center flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          {isKhqrMode
            ? t('scanner.pointAtKhqr', 'តម្រង់ចំកណ្តាលកូដ KHQR / Bakong')
            : isBarcodeMode
            ? t('scanner.pointAtBarcode', 'តម្រង់បន្ទាត់ក្រហមចំកណ្តាលបាកូដ')
            : t('scanner.pointAtCode', 'តម្រង់កាមេរ៉ាទៅកាន់កូដ QR ឬ បាកូដ')}
        </div>
        <p className="text-[10px] text-white/60">
          {t('scanner.tapToFocus', 'ចុចលើអេក្រង់ដើម្បីផ្ដោតច្បាស់ (Tap to Focus)')}
        </p>
      </div>
    </div>
  );
};
