import React, { useEffect } from 'react';
import { ScannerOverlay } from './ScannerOverlay';
import { ScanStatus } from './ScanStatus';
import { CameraControls } from './CameraControls';
import { useQRScanner } from '../../hooks/useQRScanner';

interface QRScannerProps {
  onDetected: (text: string) => void;
  autoStart?: boolean;
  preventDuplicates?: boolean;
  active?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onDetected,
  autoStart = true,
  preventDuplicates = true,
  active = true,
}) => {
  const {
    status,
    error,
    cameras,
    hasFlash,
    flashOn,
    hasZoom,
    zoom,
    containerId,
    startScanner,
    stopScanner,
    switchCamera,
    toggleFlash,
    applyZoom,
  } = useQRScanner({ onDetected, preventDuplicates });

  // Start/stop based on active prop
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
  const showOverlay = isScanning || status === 'detected';

  return (
    <div className="flex flex-col gap-0 w-full">
      {/* Camera viewport */}
      <div className="relative bg-gray-950 rounded-2xl overflow-hidden aspect-square max-w-sm mx-auto w-full">
        {/* html5-qrcode mounts here */}
        <div
          id={containerId}
          className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&_img]:hidden"
          style={{ minHeight: 280 }}
        />

        {/* Scanning overlay (frame, line, text) */}
        {showOverlay && <ScannerOverlay isScanning={isScanning} />}

        {/* Status overlay (idle, permission-denied, error, etc.) */}
        <ScanStatus
          status={status}
          error={error}
          onRetry={startScanner}
          onRequestPermission={startScanner}
        />
      </div>

      {/* Camera Controls row */}
      {isScanning && (
        <div className="flex justify-center mt-3">
          <CameraControls
            hasMultipleCameras={cameras.length > 1}
            hasFlash={hasFlash}
            flashOn={flashOn}
            hasZoom={hasZoom}
            zoom={zoom}
            onSwitchCamera={switchCamera}
            onToggleFlash={toggleFlash}
            onZoomChange={applyZoom}
          />
        </div>
      )}
    </div>
  );
};
