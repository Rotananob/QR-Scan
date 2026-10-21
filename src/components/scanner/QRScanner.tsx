import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, QrCode, Barcode, Landmark } from 'lucide-react';
import { ScannerOverlay } from './ScannerOverlay';
import { ScanStatus } from './ScanStatus';
import { CameraControls } from './CameraControls';
import { useQRScanner, type ScanMode } from '../../hooks/useQRScanner';
import { sound } from '../../services/sound';
import { cn } from '../../utils/cn';

interface QRScannerProps {
  onDetected: (text: string, formatName?: string) => void;
  autoStart?: boolean;
  preventDuplicates?: boolean;
  active?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onDetected,
  autoStart = true,
  preventDuplicates = true,
  active = true,
  soundEnabled = true,
  onToggleSound,
}) => {
  const { t } = useTranslation();
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    status,
    error,
    cameras,
    hasFlash,
    flashOn,
    hasZoom,
    zoom,
    minZoom,
    maxZoom,
    scanMode,
    isHD,
    containerId,
    startScanner,
    stopScanner,
    switchCamera,
    toggleFlash,
    applyZoom,
    triggerFocus,
    changeScanMode,
  } = useQRScanner({
    onDetected,
    preventDuplicates,
  });

  // Start / stop camera on active status change
  useEffect(() => {
    if (active && autoStart) {
      startScanner();
    } else if (!active) {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const isScanning = status === 'scanning';
  const isDetected = status === 'detected';
  const showOverlay = isScanning || isDetected;

  // Handle tap-to-focus on camera viewfinder
  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isScanning) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setFocusPoint({ x, y });
    triggerFocus();
    if (soundEnabled) sound.playFocusClick();

    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    focusTimeoutRef.current = setTimeout(() => {
      setFocusPoint(null);
    }, 1200);
  };

  const modes: { id: ScanMode; labelKey: string; defaultLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', labelKey: 'scanner.modes.all', defaultLabel: 'All-in-One', icon: Sparkles },
    { id: 'qr', labelKey: 'scanner.modes.qr', defaultLabel: 'QR Code', icon: QrCode },
    { id: 'barcode', labelKey: 'scanner.modes.barcode', defaultLabel: 'Barcode', icon: Barcode },
    { id: 'khqr', labelKey: 'scanner.modes.khqr', defaultLabel: 'KHQR', icon: Landmark },
  ];

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Scan Mode Segmented Switcher */}
      <div className="flex items-center justify-center p-1 bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl max-w-sm mx-auto w-full border border-slate-300/40 dark:border-white/5 shadow-inner">
        {modes.map((m) => {
          const isSelected = scanMode === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => changeScanMode(m.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200',
                isSelected
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t(m.labelKey, m.defaultLabel)}</span>
            </button>
          );
        })}
      </div>

      {/* Main Camera Viewport */}
      <div
        ref={containerRef}
        onClick={handleViewportClick}
        className={cn(
          'relative bg-slate-950 rounded-2xl overflow-hidden aspect-square max-w-sm mx-auto w-full shadow-2xl border-2 transition-colors duration-300 cursor-crosshair',
          isDetected
            ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
            : 'border-slate-800 dark:border-white/10'
        )}
      >
        {/* html5-qrcode video element mounts inside this container */}
        <div
          id={containerId}
          className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&_img]:hidden"
          style={{ minHeight: 280 }}
        />

        {/* HUD Scanner Overlay (Cyber reticle, laser beam, badges) */}
        {showOverlay && (
          <ScannerOverlay
            isScanning={isScanning}
            isDetected={isDetected}
            scanMode={scanMode}
            isHD={isHD}
            focusPoint={focusPoint}
          />
        )}

        {/* Status overlay for permission requests, errors, retry */}
        <ScanStatus
          status={status}
          error={error}
          onRetry={startScanner}
          onRequestPermission={startScanner}
        />
      </div>

      {/* Camera Toolbar Controls */}
      {isScanning && (
        <div className="flex justify-center mt-1">
          <CameraControls
            hasMultipleCameras={cameras.length > 1}
            hasFlash={hasFlash}
            flashOn={flashOn}
            hasZoom={hasZoom}
            zoom={zoom}
            minZoom={minZoom}
            maxZoom={maxZoom}
            soundEnabled={soundEnabled}
            onSwitchCamera={switchCamera}
            onToggleFlash={toggleFlash}
            onToggleSound={onToggleSound ?? (() => {})}
            onZoomChange={applyZoom}
          />
        </div>
      )}
    </div>
  );
};
