import { useState, useCallback, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import type { ScannerStatus, CameraDevice } from '../types/qr';

interface UseQRScannerOptions {
  onDetected: (text: string) => void;
  preventDuplicates?: boolean;
  cooldownMs?: number;
}

export function useQRScanner({
  onDetected,
  preventDuplicates = true,
  cooldownMs = 2000,
}: UseQRScannerOptions) {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [hasZoom, setHasZoom] = useState(false);
  const [zoom, setZoom] = useState(1);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScanningRef = useRef(false);
  const containerIdRef = useRef('qr-scanner-container');

  const clearCooldown = useCallback(() => {
    if (cooldownRef.current) {
      clearTimeout(cooldownRef.current);
      cooldownRef.current = null;
    }
  }, []);

  const stopScanner = useCallback(async () => {
    clearCooldown();
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // Already stopped
      }
      isScanningRef.current = false;
    }
    scannerRef.current = null;
    setStatus('idle');
    setFlashOn(false);
    setHasFlash(false);
    setHasZoom(false);
  }, [clearCooldown]);

  const startScanner = useCallback(
    async (cameraId?: string) => {
      if (isScanningRef.current) await stopScanner();

      setError(null);
      setStatus('requesting-permission');

      // Enumerate cameras
      let availableCameras: CameraDevice[] = [];
      try {
        const devices = await Html5Qrcode.getCameras();
        availableCameras = devices.map((d) => ({ deviceId: d.id, label: d.label }));
        setCameras(availableCameras);
      } catch (err: unknown) {
        const msg = (err as Error)?.message ?? String(err);
        if (msg.includes('Permission') || msg.includes('denied')) {
          setStatus('permission-denied');
          setError('Camera permission was denied. Please allow camera access in your browser settings.');
        } else {
          setStatus('camera-unavailable');
          setError('No camera found or camera is unavailable.');
        }
        return;
      }

      if (availableCameras.length === 0) {
        setStatus('camera-unavailable');
        setError('No camera found on this device.');
        return;
      }

      // Prefer rear camera on mobile
      const targetId =
        cameraId ??
        availableCameras.find((c) =>
          /(back|rear|environment)/i.test(c.label)
        )?.deviceId ??
        availableCameras[0].deviceId;

      setCurrentCameraId(targetId);
      setStatus('starting');

      try {
        const scanner = new Html5Qrcode(containerIdRef.current, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { deviceId: { exact: targetId } },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (preventDuplicates && decodedText === lastScannedRef.current) return;
            lastScannedRef.current = decodedText;
            clearCooldown();
            cooldownRef.current = setTimeout(() => {
              lastScannedRef.current = null;
            }, cooldownMs);
            setStatus('detected');
            onDetected(decodedText);
          },
          () => {
            // QR not found in frame — normal
          }
        );

        isScanningRef.current = true;
        setStatus('scanning');

        // Check flash/zoom capabilities
        try {
          const track = (scanner as unknown as { 
            mediaStream?: MediaStream 
          }).mediaStream?.getVideoTracks()[0];
          if (track) {
            const caps = track.getCapabilities?.() as Record<string, unknown> | undefined;
            if (caps) {
              setHasFlash(!!(caps.torch));
              setHasZoom(!!(caps.zoom));
            }
          }
        } catch {
          // Capability check not supported
        }
      } catch (err: unknown) {
        const msg = (err as Error)?.message ?? String(err);
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          setStatus('permission-denied');
          setError('Camera permission denied. Please allow camera access.');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setStatus('camera-unavailable');
          setError('Camera not found.');
        } else if (msg.includes('NotReadable') || msg.includes('TrackStart')) {
          setStatus('error');
          setError('Camera is in use by another application.');
        } else {
          setStatus('error');
          setError(`Camera error: ${msg}`);
        }
        scannerRef.current = null;
        isScanningRef.current = false;
      }
    },
    [stopScanner, onDetected, preventDuplicates, cooldownMs, clearCooldown]
  );

  const switchCamera = useCallback(async () => {
    if (cameras.length < 2) return;
    const currentIdx = cameras.findIndex((c) => c.deviceId === currentCameraId);
    const nextIdx = (currentIdx + 1) % cameras.length;
    await stopScanner();
    await startScanner(cameras[nextIdx].deviceId);
  }, [cameras, currentCameraId, stopScanner, startScanner]);

  const toggleFlash = useCallback(async () => {
    if (!scannerRef.current || !hasFlash) return;
    try {
      const track = (scannerRef.current as unknown as {
        mediaStream?: MediaStream;
      }).mediaStream?.getVideoTracks()[0];
      if (track) {
        const newFlash = !flashOn;
        await track.applyConstraints({ advanced: [{ torch: newFlash } as MediaTrackConstraintSet] });
        setFlashOn(newFlash);
      }
    } catch {
      setHasFlash(false);
    }
  }, [hasFlash, flashOn]);

  const applyZoom = useCallback(async (value: number) => {
    if (!scannerRef.current || !hasZoom) return;
    try {
      const track = (scannerRef.current as unknown as {
        mediaStream?: MediaStream;
      }).mediaStream?.getVideoTracks()[0];
      if (track) {
        await track.applyConstraints({ advanced: [{ zoom: value } as MediaTrackConstraintSet] });
        setZoom(value);
      }
    } catch {
      setHasZoom(false);
    }
  }, [hasZoom]);

  const resumeScanning = useCallback(() => {
    lastScannedRef.current = null;
    clearCooldown();
    setStatus('scanning');
  }, [clearCooldown]);

  useEffect(() => {
    return () => {
      clearCooldown();
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current.stop().catch(() => {});
        isScanningRef.current = false;
      }
    };
  }, [clearCooldown]);

  return {
    status,
    error,
    cameras,
    currentCameraId,
    hasFlash,
    flashOn,
    hasZoom,
    zoom,
    containerId: containerIdRef.current,
    startScanner,
    stopScanner,
    switchCamera,
    toggleFlash,
    applyZoom,
    resumeScanning,
  };
}
