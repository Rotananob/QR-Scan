import React from 'react';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

interface ScannerOverlayProps {
  isScanning: boolean;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ isScanning }) => {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Dark overlay with transparent center */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Scan frame */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-64 h-64">
          {/* Corner brackets */}
          <span className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-indigo-400 rounded-tl-lg" />
          <span className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-indigo-400 rounded-tr-lg" />
          <span className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-indigo-400 rounded-bl-lg" />
          <span className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-indigo-400 rounded-br-lg" />

          {/* Cutout - clear area */}
          <div className="absolute inset-0 border-2 border-white/10 rounded-lg" />

          {/* Scanning line */}
          {isScanning && (
            <div
              className={`absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent ${
                reducedMotion ? 'opacity-50' : 'animate-scan-line'
              }`}
            />
          )}

          {/* Corner glow dots */}
          <span className="absolute top-0 left-0 w-2 h-2 bg-indigo-400 rounded-full -translate-x-0.5 -translate-y-0.5 shadow-glow-indigo" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-indigo-400 rounded-full translate-x-0.5 -translate-y-0.5 shadow-glow-indigo" />
          <span className="absolute bottom-0 left-0 w-2 h-2 bg-indigo-400 rounded-full -translate-x-0.5 translate-y-0.5 shadow-glow-indigo" />
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-indigo-400 rounded-full translate-x-0.5 translate-y-0.5 shadow-glow-indigo" />
        </div>
      </div>

      {/* Instruction text */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center">
        <div className="bg-black/50 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full">
          Point camera at a QR code
        </div>
      </div>
    </div>
  );
};
