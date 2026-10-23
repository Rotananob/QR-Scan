import React from 'react';
import { Camera, CameraOff, ShieldAlert, Loader2, RefreshCw, Lock, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import type { ScannerStatus } from '../../types/qr';

interface ScanStatusProps {
  status: ScannerStatus;
  error: string | null;
  onRetry: () => void;
  onRequestPermission: () => void;
  onUploadImage?: () => void;
}

export const ScanStatus: React.FC<ScanStatusProps> = ({
  status,
  error,
  onRetry,
  onRequestPermission,
  onUploadImage,
}) => {
  if (status === 'scanning' || status === 'detected') return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-center p-6 gap-4 z-20 animate-fade-in">
      {status === 'idle' && (
        <>
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-white font-black text-base sm:text-lg">
              បើកដំណើរការកាមេរ៉ាស្កេន
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xs leading-relaxed">
              អនុញ្ញាតសិទ្ធិកាមេរ៉ាដើម្បីស្កេន QR Code និង Barcode យ៉ាងរហ័ស។ ទិន្នន័យត្រូវបានដំណើរការលើឧបករណ៍របស់អ្នកផ្ទាល់។
            </p>
          </div>
          <Button onClick={onRequestPermission} className="gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-600/30">
            <Camera className="w-4 h-4" />
            បើកកាមេរ៉ា (Enable Camera)
          </Button>
        </>
      )}

      {(status === 'requesting-permission' || status === 'starting') && (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
            <Sparkles className="w-4 h-4 text-amber-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-white font-bold text-sm">
              {status === 'requesting-permission'
                ? 'កំពុងស្នើសុំសិទ្ធិកាមេរ៉ា...'
                : 'កំពុងបើកដំណើរការកាមេរ៉ា HD...'}
            </p>
            <p className="text-slate-400 text-xs">
              សូមរង់ចាំមួយភ្លែត ប្រព័ន្ធកំពុងរៀបចំ Focus...
            </p>
          </div>
        </div>
      )}

      {status === 'permission-denied' && (
        <div className="flex flex-col items-center gap-3.5 max-w-xs animate-scale-up">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-white font-black text-sm sm:text-base">
              កាមេរ៉ាត្រូវបានបិទសិទ្ធិ (Access Denied)
            </h3>
            <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-[11px] text-slate-300 text-left space-y-1.5">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                វិធីបើកកាមេរ៉ាឡើងវិញ៖
              </div>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
                <li>ចុចលើរូប <span className="text-white font-semibold">សោរ 🔒 ឬ Settings</span> លើរបារ Address</li>
                <li>ចុចលើ <span className="text-white font-semibold">Permissions &gt; Camera</span></li>
                <li>ជ្រើសរើសយក <span className="text-emerald-400 font-semibold">Allow</span></li>
              </ol>
            </div>
            <p className="text-[11px] text-slate-400">
              {error ?? 'បន្ទាប់ពីបើកសិទ្ធិរួច ប្រព័ន្ធនឹងដំណើរការកាមេរ៉ាឡើងវិញស្វ័យប្រវត្តិ!'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
            <Button
              onClick={onRetry}
              variant="primary"
              className="flex-1 gap-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              ព្យាយាមម្តងទៀត (Try Again)
            </Button>
            {onUploadImage && (
              <Button
                onClick={onUploadImage}
                variant="outline"
                className="gap-2 rounded-xl text-xs font-bold border-white/15 text-slate-200"
              >
                ស្កេនរូបភាពជំនួសវិញ
              </Button>
            )}
          </div>
        </div>
      )}

      {status === 'camera-unavailable' && (
        <div className="space-y-3 max-w-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CameraOff className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-white font-black text-sm sm:text-base">រកមិនឃើញកាមេរ៉ាលើឧបករណ៍</h3>
            <p className="text-slate-400 text-xs mt-1">
              {error ?? 'មិនមានឧបករណ៍កាមេរ៉ានៅលើម៉ាស៊ីននេះទេ។ អ្នកអាចប្រើមុខងារ Upload រូបភាពស្កេនបានយ៉ាងងាយស្រួល។'}
            </p>
          </div>
          {onUploadImage && (
            <Button onClick={onUploadImage} variant="outline" className="gap-2 text-xs rounded-xl border-white/20 text-white mx-auto">
              ស្កេនរូបភាពជំនួសវិញ
            </Button>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-3 max-w-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <CameraOff className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-white font-black text-sm sm:text-base">មានបញ្ហាក្នុងការបើកកាមេរ៉ា</h3>
            <p className="text-slate-400 text-xs mt-1">
              {error ?? 'អាចមកពីកម្មវិធីផ្សេងកំពុងប្រើកាមេរ៉ានេះ។ សូមបិទ App ផ្សេងរួចសាកល្បងម្តងទៀត។'}
            </p>
          </div>
          <Button onClick={onRetry} variant="outline" className="gap-2 text-xs rounded-xl text-white border-white/20 mx-auto">
            <RefreshCw className="w-3.5 h-3.5" />
            ព្យាយាមម្តងទៀត
          </Button>
        </div>
      )}
    </div>
  );
};
