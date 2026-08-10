import React from 'react';
import { Camera, CameraOff, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import type { ScannerStatus } from '../../types/qr';

interface ScanStatusProps {
  status: ScannerStatus;
  error: string | null;
  onRetry: () => void;
  onRequestPermission: () => void;
}

export const ScanStatus: React.FC<ScanStatusProps> = ({
  status,
  error,
  onRetry,
  onRequestPermission,
}) => {
  if (status === 'scanning' || status === 'detected') return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 text-center p-6 gap-4">
      {status === 'idle' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <Camera className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Camera Access Required</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">
              QR Scan needs your camera to scan QR codes. Your camera feed is processed locally.
            </p>
          </div>
          <Button onClick={onRequestPermission} className="gap-2">
            <Camera className="w-4 h-4" />
            Enable Camera
          </Button>
        </>
      )}

      {(status === 'requesting-permission' || status === 'starting') && (
        <>
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="text-gray-300 text-sm">
            {status === 'requesting-permission'
              ? 'Requesting camera access…'
              : 'Starting camera…'}
          </p>
        </>
      )}

      {status === 'permission-denied' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Camera Access Denied</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">
              {error ?? 'Please allow camera access in your browser settings, then try again.'}
            </p>
          </div>
          <Button onClick={onRetry} variant="outline" className="gap-2 text-white border-white/20">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </>
      )}

      {status === 'camera-unavailable' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <CameraOff className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">No Camera Found</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">
              {error ?? 'No camera was detected. Try uploading a QR code image instead.'}
            </p>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <CameraOff className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Camera Error</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">
              {error ?? 'An error occurred. Please try again.'}
            </p>
          </div>
          <Button onClick={onRetry} variant="outline" className="gap-2 text-white border-white/20">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </>
      )}
    </div>
  );
};
