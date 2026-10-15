import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type Html5QrcodeResult,
} from 'html5-qrcode';
import type { ScannerStatus, CameraDevice } from '../types/qr';

export type ScanMode = 'all' | 'qr' | 'barcode' | 'khqr';

interface UseQRScannerOptions {
  onDetected: (text: string, formatName?: string) => void;
  preventDuplicates?: boolean;
  cooldownMs?: number;
  initialScanMode?: ScanMode;
}

// All major 1D and 2D barcode formats supported by html5-qrcode
const ALL_SUPPORTED_FORMATS = [
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

const QR_ONLY_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.AZTEC,
];

const BARCODE_ONLY_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.RSS_14,
  Html5QrcodeSupportedFormats.RSS_EXPANDED,
];

export function useQRScanner({
  onDetected,
  preventDuplicates = true,
  cooldownMs = 1800,
  initialScanMode = 'all',
}: UseQRScannerOptions) {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [hasZoom, setHasZoom] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(5);
  const [scanMode, setScanModeState] = useState<ScanMode>(initialScanMode);
  const [isHD, setIsHD] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScanningRef = useRef(false);
  const containerIdRef = useRef('qr-scanner-container');
  const activeScanModeRef = useRef<ScanMode>(initialScanMode);

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
      } catch {
        // Already stopped or cleaning up
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
    async (cameraId?: string, mode?: ScanMode) => {
      const targetMode = mode ?? activeScanModeRef.current;
      activeScanModeRef.current = targetMode;

      if (isScanningRef.current) {
        await stopScanner();
      }

      setError(null);
      setStatus('requesting-permission');

      // Enumerate available cameras
      let availableCameras: CameraDevice[] = [];
      try {
        const devices = await Html5Qrcode.getCameras();
        availableCameras = devices.map((d) => ({ deviceId: d.id, label: d.label }));
        setCameras(availableCameras);
      } catch (err: unknown) {
        console.warn('Failed to enumerate cameras, will use default constraints.', err);
      }

      // Pick rear/environment camera by default on mobile
      const targetId =
        cameraId ??
        (availableCameras.length > 0
          ? availableCameras.find((c) => /(back|rear|environment|triple|ultra)/i.test(c.label))?.deviceId ??
            availableCameras[0].deviceId
          : undefined);

      setCurrentCameraId(targetId ?? null);
      setStatus('starting');

      try {
        // Choose formats based on active mode for optimal performance
        let formats = ALL_SUPPORTED_FORMATS;
        if (targetMode === 'qr' || targetMode === 'khqr') {
          formats = QR_ONLY_FORMATS;
        } else if (targetMode === 'barcode') {
          formats = BARCODE_ONLY_FORMATS;
        }

        // Initialize scanner with native hardware BarcodeDetector acceleration
        const scanner = new Html5Qrcode(containerIdRef.current, {
          verbose: false,
          formatsToSupport: formats,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
        scannerRef.current = scanner;

        // Ultra-HD camera constraints for maximum clarity & rapid focus
        const videoConstraints: MediaTrackConstraints = targetId
          ? {
              deviceId: { exact: targetId },
              width: { min: 640, ideal: 1920, max: 3840 },
              height: { min: 480, ideal: 1080, max: 2160 },
              frameRate: { ideal: 30, min: 24 },
            }
          : {
              facingMode: { ideal: 'environment' },
              width: { min: 640, ideal: 1920, max: 3840 },
              height: { min: 480, ideal: 1080, max: 2160 },
              frameRate: { ideal: 30, min: 24 },
            };

        // Responsive dynamic QR Box tailored to scanning mode
        const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number): { width: number; height: number } => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          if (targetMode === 'barcode') {
            // Wider horizontal box for 1D product / book barcodes
            const width = Math.min(Math.floor(viewfinderWidth * 0.88), 340);
            const height = Math.min(Math.floor(width * 0.5), 180);
            return { width, height };
          }
          // Square box for QR & KHQR
          const size = Math.min(Math.floor(minEdge * 0.74), 300);
          return { width: size, height: size };
        };

        const cameraConfig = targetId ? { deviceId: { exact: targetId } } : { facingMode: 'environment' };

        await scanner.start(
          cameraConfig,
          {
            fps: 25, // 25 FPS for ultra-responsive scan rate
            qrbox: qrboxFunction,
            aspectRatio: 1.0,
            videoConstraints,
          },
          (decodedText: string, result: Html5QrcodeResult) => {
            if (preventDuplicates && decodedText === lastScannedRef.current) return;
            lastScannedRef.current = decodedText;
            clearCooldown();
            cooldownRef.current = setTimeout(() => {
              lastScannedRef.current = null;
            }, cooldownMs);

            setStatus('detected');
            const formatName = result?.result?.format?.formatName;
            onDetected(decodedText, formatName);
          },
          () => {
            // Frame processed without match (standard during continuous scan)
          }
        );

        isScanningRef.current = true;
        setStatus('scanning');

        // Inspect and activate hardware capabilities (continuous autofocus, torch, zoom)
        try {
          const track = (scanner as unknown as { mediaStream?: MediaStream }).mediaStream?.getVideoTracks()[0];
          if (track) {
            const caps = track.getCapabilities?.() as (MediaTrackCapabilities & {
              torch?: boolean;
              zoom?: { min: number; max: number; step: number };
            }) | undefined;

            if (caps) {
              setHasFlash(!!caps.torch);
              if (caps.zoom) {
                setHasZoom(true);
                setMinZoom(caps.zoom.min || 1);
                setMaxZoom(caps.zoom.max || 5);
              }
            }

            // Apply continuous auto-focus & exposure if supported by device
            try {
              await track.applyConstraints({
                advanced: [
                  { focusMode: 'continuous' } as unknown as MediaTrackConstraintSet,
                  { exposureMode: 'continuous' } as unknown as MediaTrackConstraintSet,
                ],
              });
            } catch {
              // Advanced focus constraints ignored by browser if unsupported
            }

            // Check actual running resolution to confirm HD status
            const settings = track.getSettings?.();
            if (settings && settings.width && settings.width >= 1280) {
              setIsHD(true);
            }
          }
        } catch {
          // Capability check ignored
        }
      } catch (err: unknown) {
        const msg = (err as Error)?.message ?? String(err);
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          setStatus('permission-denied');
          setError('Camera permission denied. Please allow camera access in your browser.');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setStatus('camera-unavailable');
          setError('Camera not found on this device.');
        } else if (msg.includes('NotReadable') || msg.includes('TrackStart')) {
          setStatus('error');
          setError('Camera is currently in use by another application.');
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
    const nextDeviceId = cameras[nextIdx].deviceId;
    await stopScanner();
    await startScanner(nextDeviceId, activeScanModeRef.current);
  }, [cameras, currentCameraId, stopScanner, startScanner]);

  const toggleFlash = useCallback(async () => {
    if (!scannerRef.current || !hasFlash) return;
    try {
      const track = (scannerRef.current as unknown as { mediaStream?: MediaStream }).mediaStream?.getVideoTracks()[0];
      if (track) {
        const newFlash = !flashOn;
        await track.applyConstraints({
          advanced: [{ torch: newFlash } as unknown as MediaTrackConstraintSet],
        });
        setFlashOn(newFlash);
      }
    } catch {
      setHasFlash(false);
    }
  }, [hasFlash, flashOn]);

  const applyZoom = useCallback(
    async (value: number) => {
      if (!scannerRef.current || !hasZoom) return;
      const clamped = Math.max(minZoom, Math.min(maxZoom, value));
      try {
        const track = (scannerRef.current as unknown as { mediaStream?: MediaStream }).mediaStream?.getVideoTracks()[0];
        if (track) {
          await track.applyConstraints({
            advanced: [{ zoom: clamped } as unknown as MediaTrackConstraintSet],
          });
          setZoom(clamped);
        }
      } catch {
        // Zoom adjustment failed
      }
    },
    [hasZoom, minZoom, maxZoom]
  );

  const triggerFocus = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const track = (scannerRef.current as unknown as { mediaStream?: MediaStream }).mediaStream?.getVideoTracks()[0];
      if (track) {
        // Re-trigger continuous autofocus to sharpen blurry subject
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' } as unknown as MediaTrackConstraintSet],
        });
      }
    } catch {
      // Focus not supported
    }
  }, []);

  const changeScanMode = useCallback(
    async (newMode: ScanMode) => {
      setScanModeState(newMode);
      activeScanModeRef.current = newMode;
      if (isScanningRef.current) {
        await stopScanner();
        await startScanner(currentCameraId || undefined, newMode);
      }
    },
    [currentCameraId, stopScanner, startScanner]
  );

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
    minZoom,
    maxZoom,
    scanMode,
    isHD,
    containerId: containerIdRef.current,
    startScanner,
    stopScanner,
    switchCamera,
    toggleFlash,
    applyZoom,
    triggerFocus,
    changeScanMode,
    resumeScanning,
  };
}
