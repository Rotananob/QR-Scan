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

const STORAGE_KEY_CAMERA_ALLOWED = 'qr_camera_permission_granted';

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
  const isStartingRef = useRef(false);
  const containerIdRef = useRef('qr-scanner-container');
  const activeScanModeRef = useRef<ScanMode>(initialScanMode);

  const clearCooldown = useCallback(() => {
    if (cooldownRef.current) {
      clearTimeout(cooldownRef.current);
      cooldownRef.current = null;
    }
  }, []);

  const cleanContainerDOM = useCallback(() => {
    const el = document.getElementById(containerIdRef.current);
    if (el) {
      el.innerHTML = '';
    }
  }, []);

  const stopScanner = useCallback(async () => {
    clearCooldown();
    if (scannerRef.current) {
      try {
        if (isScanningRef.current) {
          await scannerRef.current.stop();
        }
      } catch {
        // Safe ignore
      }
      try {
        scannerRef.current.clear();
      } catch {
        // Safe ignore
      }
      scannerRef.current = null;
    }
    isScanningRef.current = false;
    isStartingRef.current = false;
    cleanContainerDOM();
    setStatus('idle');
    setFlashOn(false);
    setHasFlash(false);
    setHasZoom(false);
  }, [clearCooldown, cleanContainerDOM]);

  // Check browser-level permission status safely
  const queryPermissionState = useCallback(async (): Promise<PermissionState | 'unknown'> => {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const res = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return res.state;
      } catch {
        // Fallback for browsers that do not support { name: 'camera' }
      }
    }
    return 'unknown';
  }, []);

  const startScanner = useCallback(
    async (cameraId?: string, mode?: ScanMode) => {
      // Prevent concurrent race calls
      if (isStartingRef.current) return;
      isStartingRef.current = true;

      const targetMode = mode ?? activeScanModeRef.current;
      activeScanModeRef.current = targetMode;

      // Ensure any previous instance or stray DOM nodes are fully purged
      if (scannerRef.current) {
        try {
          if (isScanningRef.current) await scannerRef.current.stop();
        } catch {}
        try {
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }
      isScanningRef.current = false;
      cleanContainerDOM();

      setError(null);
      setStatus('requesting-permission');

      try {
        // Choose formats based on active mode for optimal performance
        let formats = ALL_SUPPORTED_FORMATS;
        if (targetMode === 'qr' || targetMode === 'khqr') {
          formats = QR_ONLY_FORMATS;
        } else if (targetMode === 'barcode') {
          formats = BARCODE_ONLY_FORMATS;
        }

        // Fresh instance on clean DOM container
        const scanner = new Html5Qrcode(containerIdRef.current, {
          verbose: false,
          formatsToSupport: formats,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
        scannerRef.current = scanner;

        // Dynamic responsive QR Box tailored to scanning mode
        const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number): { width: number; height: number } => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          if (targetMode === 'barcode') {
            const width = Math.min(Math.floor(viewfinderWidth * 0.88), 340);
            const height = Math.min(Math.floor(width * 0.5), 180);
            return { width, height };
          }
          const size = Math.min(Math.floor(minEdge * 0.74), 300);
          return { width: size, height: size };
        };

        // Prefer environment camera directly without pre-calling getCameras (prevents double prompt)
        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: 'environment' };

        // Ultra-HD camera constraints for instant focus and high-speed recognition
        const videoConstraints: MediaTrackConstraints = cameraId
          ? {
              deviceId: { exact: cameraId },
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

        setStatus('starting');

        await scanner.start(
          cameraConfig,
          {
            fps: 25,
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
            // Frame processed without match
          }
        );

        isScanningRef.current = true;
        setStatus('scanning');
        setCurrentCameraId(cameraId ?? null);

        // Remember permission was granted so PWA never gets confused
        try {
          localStorage.setItem(STORAGE_KEY_CAMERA_ALLOWED, 'true');
        } catch {}

        // Enumerate camera devices silently in background now that permission is active
        if (navigator?.mediaDevices?.enumerateDevices) {
          navigator.mediaDevices.enumerateDevices().then((devices) => {
            const videoDevices = devices
              .filter((d) => d.kind === 'videoinput')
              .map((d, index) => ({
                deviceId: d.deviceId,
                label: d.label || `Camera ${index + 1}`,
              }));
            setCameras(videoDevices);
          }).catch(() => {});
        }

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

            try {
              await track.applyConstraints({
                advanced: [
                  { focusMode: 'continuous' } as unknown as MediaTrackConstraintSet,
                  { exposureMode: 'continuous' } as unknown as MediaTrackConstraintSet,
                ],
              });
            } catch {}

            const settings = track.getSettings?.();
            if (settings && settings.width && settings.width >= 1280) {
              setIsHD(true);
            }
          }
        } catch {}
      } catch (err: unknown) {
        const msg = (err as Error)?.message ?? String(err);
        console.warn('[useQRScanner] Camera start failed:', msg);

        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch {}
          scannerRef.current = null;
        }
        cleanContainerDOM();
        isScanningRef.current = false;

        if (
          msg.includes('Permission') ||
          msg.includes('NotAllowed') ||
          msg.includes('Permission denied') ||
          msg.includes('dismissed')
        ) {
          setStatus('permission-denied');
          setError('Camera permission was denied. Please allow camera access in your browser settings.');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setStatus('camera-unavailable');
          setError('No camera was detected on this device.');
        } else if (msg.includes('NotReadable') || msg.includes('TrackStart')) {
          setStatus('error');
          setError('Camera is in use by another application. Please close other camera apps and retry.');
        } else {
          setStatus('error');
          setError(`Camera error: ${msg}`);
        }
      } finally {
        isStartingRef.current = false;
      }
    },
    [cleanContainerDOM, onDetected, preventDuplicates, cooldownMs, clearCooldown]
  );

  // Dynamic Permission State Observer & Auto-Reconnect
  useEffect(() => {
    let permStatus: PermissionStatus | null = null;
    let isSubscribed = true;

    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((statusObj) => {
          if (!isSubscribed) return;
          permStatus = statusObj;

          statusObj.onchange = () => {
            console.log('[useQRScanner] Permission changed in browser settings to:', statusObj.state);
            if (statusObj.state === 'granted') {
              // User toggled camera to "Allow" in site settings! Auto-start immediately!
              startScanner();
            } else if (statusObj.state === 'denied') {
              stopScanner();
              setStatus('permission-denied');
              setError('Camera permission denied in browser settings.');
            }
          };
        })
        .catch(() => {});
    }

    // Auto-resume camera when switching back to app after granting permissions in Settings
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'visible') {
        const state = await queryPermissionState();
        if (state === 'granted' && !isScanningRef.current && !isStartingRef.current) {
          console.log('[useQRScanner] App focused with granted permission: auto-starting camera');
          startScanner();
        }
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      isSubscribed = false;
      if (permStatus) permStatus.onchange = null;
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [queryPermissionState, startScanner, stopScanner]);

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
      } catch {}
    },
    [hasZoom, minZoom, maxZoom]
  );

  const triggerFocus = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const track = (scannerRef.current as unknown as { mediaStream?: MediaStream }).mediaStream?.getVideoTracks()[0];
      if (track) {
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' } as unknown as MediaTrackConstraintSet],
        });
      }
    } catch {}
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
