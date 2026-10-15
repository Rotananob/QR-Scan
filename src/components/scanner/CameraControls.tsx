import React from 'react';
import { FlipHorizontal2, Flashlight, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';

interface CameraControlsProps {
  hasMultipleCameras: boolean;
  hasFlash: boolean;
  flashOn: boolean;
  hasZoom: boolean;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  soundEnabled: boolean;
  onSwitchCamera: () => void;
  onToggleFlash: () => void;
  onToggleSound: () => void;
  onZoomChange: (value: number) => void;
  className?: string;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  hasMultipleCameras,
  hasFlash,
  flashOn,
  hasZoom,
  zoom,
  minZoom = 1,
  maxZoom = 5,
  soundEnabled,
  onSwitchCamera,
  onToggleFlash,
  onToggleSound,
  onZoomChange,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center gap-2.5 w-full', className)}>
      {/* Quick Zoom Pills (1x, 2x, 3x) */}
      {hasZoom && (
        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
          {[1, 2, 3].map((lvl) => {
            if (lvl < minZoom || lvl > maxZoom) return null;
            const isActive = Math.abs(zoom - lvl) < 0.25;
            return (
              <button
                key={lvl}
                onClick={() => onZoomChange(lvl)}
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                {lvl}x
              </button>
            );
          })}
        </div>
      )}

      {/* Main Toolbar Buttons */}
      <div className="flex items-center justify-center gap-2.5">
        {/* Switch Camera */}
        {hasMultipleCameras && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSwitchCamera}
            aria-label="Switch camera"
            title="ប្តូរកាមេរ៉ា (Switch Camera)"
            className="bg-black/40 backdrop-blur-md text-white hover:bg-black/60 rounded-full w-10 h-10 border border-white/10 transition-transform active:rotate-180"
          >
            <FlipHorizontal2 className="w-4 h-4" />
          </Button>
        )}

        {/* Flashlight (Torch) */}
        {hasFlash && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFlash}
            aria-label={flashOn ? 'Turn flash off' : 'Turn flash on'}
            aria-pressed={flashOn}
            title={flashOn ? 'បិទភ្លើង Flash' : 'បើកភ្លើង Flash'}
            className={cn(
              'backdrop-blur-md rounded-full w-10 h-10 border transition-all',
              flashOn
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                : 'bg-black/40 text-white border-white/10 hover:bg-black/60'
            )}
          >
            <Flashlight className="w-4 h-4" />
          </Button>
        )}

        {/* Audio Beep Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute scan beep' : 'Enable scan beep'}
          title={soundEnabled ? 'បិទសំឡេងស្កេន' : 'បើកសំឡេងស្កេន'}
          className={cn(
            'backdrop-blur-md rounded-full w-10 h-10 border border-white/10 transition-colors',
            soundEnabled
              ? 'bg-black/40 text-emerald-400 hover:bg-black/60'
              : 'bg-black/40 text-slate-400 hover:bg-black/60'
          )}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>

        {/* Continuous Zoom Slider if supported */}
        {hasZoom && (
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1.5 border border-white/10">
            <button
              onClick={() => onZoomChange(Math.max(minZoom, zoom - 0.5))}
              aria-label="Zoom out"
              className="text-white/80 hover:text-white transition-opacity"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.1}
              value={zoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              aria-label="Zoom level"
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
            <button
              onClick={() => onZoomChange(Math.min(maxZoom, zoom + 0.5))}
              aria-label="Zoom in"
              className="text-white/80 hover:text-white transition-opacity"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
