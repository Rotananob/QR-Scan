import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';

interface KhqrStandeeModalProps {
  open: boolean;
  onClose: () => void;
  qrData: {
    qrRaw: string;
    merchantName: string;
    bankAccount?: string;
    amount?: string;
    currency?: string;
  };
}

export const KhqrStandeeModal: React.FC<KhqrStandeeModalProps> = ({
  open,
  onClose,
  qrData,
}) => {
  const [theme, setTheme] = useState<'bakong_red' | 'luxury_gold'>('bakong_red');
  const [shopName, setShopName] = useState(qrData.merchantName || 'MERCHANT STORE');
  const [tableNote, setTableNote] = useState('តុលេខ ០១ • Table 01');
  const [customQrUrl, setCustomQrUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const standeeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShopName(qrData.merchantName || 'MERCHANT STORE');
  }, [qrData.merchantName]);

  useEffect(() => {
    if (!qrData.qrRaw) return;
    QRCode.toDataURL(qrData.qrRaw, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 480,
      color: {
        dark: theme === 'luxury_gold' ? '#1a1a1a' : '#000000',
        light: '#ffffff',
      },
    })
      .then(setCustomQrUrl)
      .catch((err) => console.error('Error generating standee QR:', err));
  }, [qrData.qrRaw, theme]);

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!customQrUrl) return;
    setDownloading(true);
    // Draw the standee onto a canvas and trigger high-res download
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1700;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setDownloading(false);
      return;
    }

    const isGold = theme === 'luxury_gold';

    // Background
    if (isGold) {
      const grad = ctx.createLinearGradient(0, 0, 0, 1700);
      grad.addColorStop(0, '#111827');
      grad.addColorStop(1, '#030712');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 1700);

      // Gold border
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 14;
      ctx.strokeRect(30, 30, 1140, 1640);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1200, 1700);

      // Red Top Header Banner
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, 1200, 320);
    }

    // Header Text
    ctx.fillStyle = isGold ? '#fef08a' : '#ffffff';
    ctx.font = 'bold 58px "Kantumruy Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KHQR ស្កេនទូទាត់ប្រាក់', 600, isGold ? 160 : 130);

    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('PAY WITH ANY BANKING APP', 600, isGold ? 220 : 190);

    // Merchant Shop Name
    ctx.fillStyle = isGold ? '#ffffff' : '#1e293b';
    ctx.font = 'bold 54px "Kantumruy Pro", sans-serif';
    ctx.fillText(shopName.toUpperCase(), 600, 420);

    // Table Note
    if (tableNote) {
      ctx.fillStyle = isGold ? '#9ca3af' : '#64748b';
      ctx.font = 'normal 34px "Kantumruy Pro", sans-serif';
      ctx.fillText(tableNote, 600, 480);
    }

    // Load and draw QR code
    const qrImg = new Image();
    qrImg.onload = () => {
      // White box for QR
      ctx.fillStyle = '#ffffff';
      ctx.roundRect(250, 540, 700, 700, [30]);
      ctx.fill();
      if (!isGold) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      ctx.drawImage(qrImg, 290, 580, 620, 620);

      // Optional Amount display
      if (qrData.amount) {
        ctx.fillStyle = isGold ? '#fef08a' : '#dc2626';
        ctx.font = 'bold 56px sans-serif';
        const curr = qrData.currency || 'USD';
        ctx.fillText(`${curr === 'KHR' ? '៛' : '$'}${Number(qrData.amount).toLocaleString()} ${curr}`, 600, 1340);
      } else {
        ctx.fillStyle = isGold ? '#d1d5db' : '#334155';
        ctx.font = 'bold 36px "Kantumruy Pro", sans-serif';
        ctx.fillText('គាំទ្រគ្រប់ធនាគារក្នុងប្រទេសកម្ពុជា', 600, 1340);
      }

      // Footer Supported Banks
      ctx.fillStyle = isGold ? '#9ca3af' : '#64748b';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Bakong • ABA • ACLEDA • Wing • Canadia • Sathapana', 600, 1480);

      ctx.font = 'normal 24px sans-serif';
      ctx.fillText('POWERED BY BAKONG NATIONAL PAYMENT SYSTEM', 600, 1540);

      // Download
      const link = document.createElement('a');
      link.download = `KHQR-Standee-${shopName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloading(false);
    };
    qrImg.src = customQrUrl;
  };

  const isGold = theme === 'luxury_gold';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white">
      {/* Hide controls when printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-standee, #printable-standee * {
            visibility: visible !important;
          }
          #printable-standee {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden my-auto print:border-none print:shadow-none">
        {/* Header Controls */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
              <Printer className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                ស្លាក Standee តុ KHQR (Print & Table Tent)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                រៀបចំស្លាកបញ្ជរ ឬលើតុសម្រាប់អតិថិជនស្កេនទូទាត់ប្រាក់
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customization Options Bar */}
        <div className="p-4 space-y-3 bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-200/60 dark:border-white/5 print:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTheme('bakong_red')}
              className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                theme === 'bakong_red'
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 ring-2 ring-red-500/20'
                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-red-600" />
              <span>Bakong Red Official</span>
            </button>
            <button
              onClick={() => setTheme('luxury_gold')}
              className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                theme === 'luxury_gold'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20'
                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
              <span>Luxury Noir & Gold</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                ឈ្មោះអាជីវកម្ម / ហាង
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="ឈ្មោះហាង"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                ចំណាំ / លេខតុ (Table Note)
              </label>
              <input
                type="text"
                value={tableNote}
                onChange={(e) => setTableNote(e.target.value)}
                placeholder="ឧ. តុលេខ ០១"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Printable Standee Card Viewport */}
        <div className="p-4 flex items-center justify-center bg-slate-200/50 dark:bg-slate-950/50 max-h-[50vh] overflow-y-auto">
          <div
            id="printable-standee"
            ref={standeeRef}
            className={`w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 text-center flex flex-col items-center ${
              isGold
                ? 'bg-gradient-to-b from-slate-900 via-gray-950 to-black text-white border-4 border-amber-500/80 p-5'
                : 'bg-white text-slate-900 border border-slate-200 shadow-xl'
            }`}
          >
            {/* Red Standard Header */}
            {!isGold && (
              <div className="w-full bg-red-600 text-white pt-5 pb-4 px-4 flex flex-col items-center shadow-md">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase mb-1">
                  <span>Bakong KHQR</span>
                </div>
                <h4 className="text-lg font-black tracking-tight leading-none">
                  KHQR ស្កេនទូទាត់ប្រាក់
                </h4>
                <p className="text-[10px] font-semibold text-white/90 mt-1 uppercase tracking-wider">
                  Pay with any banking app
                </p>
              </div>
            )}

            {/* Gold Theme Header */}
            {isGold && (
              <div className="w-full pt-2 pb-3 px-2 flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold tracking-widest uppercase mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>PREMIUM KHQR</span>
                </div>
                <h4 className="text-lg font-black text-amber-300 tracking-tight leading-none">
                  KHQR ស្កេនទូទាត់ប្រាក់
                </h4>
                <p className="text-[10px] font-semibold text-amber-200/70 mt-1 uppercase tracking-wider">
                  SCAN WITH ANY BANK APP
                </p>
              </div>
            )}

            {/* Merchant Details */}
            <div className={`p-4 flex flex-col items-center ${isGold ? 'pt-1' : ''}`}>
              <h3
                className={`text-base font-extrabold tracking-wide uppercase line-clamp-1 ${
                  isGold ? 'text-white' : 'text-slate-900'
                }`}
              >
                {shopName}
              </h3>
              {tableNote && (
                <span
                  className={`text-[11px] font-medium mt-0.5 ${
                    isGold ? 'text-amber-400/90' : 'text-slate-500'
                  }`}
                >
                  {tableNote}
                </span>
              )}

              {/* QR Code Canvas Box */}
              <div className="mt-3 p-3 bg-white rounded-2xl shadow-inner border border-slate-200/80 flex items-center justify-center">
                {customQrUrl ? (
                  <img
                    src={customQrUrl}
                    alt="Standee KHQR Code"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg" />
                )}
              </div>

              {/* Amount if present */}
              {qrData.amount && (
                <div className="mt-3">
                  <p
                    className={`text-xl font-extrabold ${
                      isGold ? 'text-amber-400' : 'text-red-600'
                    }`}
                  >
                    {qrData.currency === 'KHR' ? '៛' : '$'}
                    {Number(qrData.amount).toLocaleString()} {qrData.currency}
                  </p>
                </div>
              )}

              {/* Supported Banks Mini Strip */}
              <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-white/10 w-full">
                <p
                  className={`text-[9px] font-bold tracking-wider uppercase mb-1.5 ${
                    isGold ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  គាំទ្រគ្រប់ធនាគារក្នុងប្រទេសកម្ពុជា
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white">ABA</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white">Bakong</span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-700 text-white">ACLEDA</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white">Wing</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white">Canadia</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            បិទ (Close)
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={downloading || !customQrUrl}
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'កំពុងទាញ...' : 'ទាញយក Standee PNG'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ព (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
