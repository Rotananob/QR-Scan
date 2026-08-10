import React from 'react';
import { FlipHorizontal2, Flashlight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';

interface CameraControlsProps {
  hasMultipleCameras: boolean;
  hasFlash: boolean;
  flashOn: boolean;
  hasZoom: boolean;
  zoom: number;
  onSwitchCamera: () => void;
  onToggleFlash: () => void;
  onZoomChange: (value: number) => void;
  className?: string;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  hasMultipleCameras,
  hasFlash,
  flashOn,
  hasZoom,
  zoom,
  onSwitchCamera,
  onToggleFlash,
  onZoomChange,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      {hasMultipleCameras && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onSwitchCamera}
          aria-label="Switch camera"
          className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 rounded-full w-11 h-11"
        >
          <FlipHorizontal2 className="w-5 h-5" />
        </Button>
      )}

      {hasFlash && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFlash}
          aria-label={flashOn ? 'Turn flash off' : 'Turn flash on'}
          aria-pressed={flashOn}
          className={cn(
            'backdrop-blur-sm rounded-full w-11 h-11',
            flashOn
              ? 'bg-amber-400 text-gray-900 hover:bg-amber-300'
              : 'bg-black/30 text-white hover:bg-black/50'
          )}
        >
          <Flashlight className="w-5 h-5" />
        </Button>
      )}

      {hasZoom && (
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
          <button
            onClick={() => onZoomChange(Math.max(1, zoom - 0.5))}
            aria-label="Zoom out"
            className="text-white opacity-80 hover:opacity-100 transition-opacity"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={1}
            max={5}
            step={0.1}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            aria-label="Zoom level"
            className="w-20 accent-indigo-400"
          />
          <button
            onClick={() => onZoomChange(Math.min(5, zoom + 0.5))}
            aria-label="Zoom in"
            className="text-white opacity-80 hover:opacity-100 transition-opacity"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
