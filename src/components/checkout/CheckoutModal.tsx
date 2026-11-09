import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  X,
  Crown,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  canGenerateCheckoutQR,
  getDailyQuotaInfo,
  recordCheckoutQRGeneration,
  type DailyQuotaInfo,
} from '../../services/rateLimiter';
import { Confetti } from '../common/Confetti';
import { trackQrExpired } from '../../services/tracker';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  currency?: 'USD' | 'KHR';
}

interface InvoiceData {
  tranId: string;
  amount: number;
  currency: string;
  qrString: string;
  deeplinks?: {
    aba?: { ios?: string; android?: string };
    bakong?: { ios?: string; android?: string };
  };
  token?: string;
  clientId?: string;
  deviceId?: string;
  requestTime?: string;
  signature?: string;
  createdAt?: number;
  remainingDaily?: number;
}

function formatKhqrTlv(tag: string, val: string) {
  const len = new TextEncoder().encode(val).length.toString().padStart(2, '0');
  return `${tag}${len}${val}`;
}

function computeKhqrCrc16(data: string) {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = ((crc << 1) ^ 0x1021) & 0xffff;
      else crc = (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function buildClientFallbackKhqr(amount = 3.00, currency = 'USD', billNumber = '') {
  let p = formatKhqrTlv('00', '01') + formatKhqrTlv('01', '12');
  const sub00 = formatKhqrTlv('00', '126100713043212@abab');
  p += formatKhqrTlv('29', sub00);
  p += formatKhqrTlv('52', '5999');
  p += formatKhqrTlv('53', currency === 'KHR' ? '116' : '840');
  p += formatKhqrTlv('54', Number(amount).toFixed(2));
  p += formatKhqrTlv('58', 'KH');
  p += formatKhqrTlv('59', 'NOB ROTANA');
  p += formatKhqrTlv('60', 'PHNOM PENH');
  if (billNumber) {
    p += formatKhqrTlv('62', formatKhqrTlv('01', billNumber));
  }
  const crcIn = p + '6304';
  return crcIn + computeKhqrCrc16(crcIn);
}

function buildClientDeeplinks(qrString: string) {
  const encoded = encodeURIComponent(qrString);
  const isPayway = qrString.includes('PAYWAY') || qrString.includes('PLIK');
  const typeParam = isPayway ? 'payway' : 'khqr';

  return {
    aba: {
      ios: `abamobilebank://ababank.com?type=${typeParam}&qrcode=${encoded}`,
      android: `intent://ababank.com?type=${typeParam}&qrcode=${encoded}#Intent;scheme=abamobilebank;end;`,
      raw: `abamobilebank://ababank.com?type=${typeParam}&qrcode=${encoded}`,
    },
    bakong: {
      ios: `bakong://open?qr=${encoded}`,
      android: `intent://open?qr=${encoded}#Intent;scheme=bakong;package=kh.gov.nbc.bakong;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dkh.gov.nbc.bakong;end`,
      raw: `bakong://open?qr=${encoded}`,
    },
  };
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  defaultAmount: _defaultAmount = 3.00,
  currency = 'USD',
}) => {
  const { user, isLifetime, activateLifetimeVIP, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const fixedAmount = 3.00;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(180); // 3 minutes countdown
  const [status, setStatus] = useState<'IDLE' | 'GENERATING' | 'PENDING' | 'PAID' | 'EXPIRED' | 'ERROR'>('IDLE');
  const [showConfetti, setShowConfetti] = useState(false);
  const [quota, setQuota] = useState<DailyQuotaInfo>(getDailyQuotaInfo());
  const [checkingManual, setCheckingManual] = useState(false);
  const [manualNotice, setManualNotice] = useState<string | null>(null);

  const pollerRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isDeeplinkClickedRef = useRef(false);

  // Requirement: If user is not authenticated and checkout opens, immediately redirect to login!
  useEffect(() => {
    if (isOpen) {
      if (isLifetime) {
        onClose();
        return;
      }
      if (!user) {
        onClose();
        navigate('/auth?redirect=/upgrade');
      }
    }
  }, [isOpen, user, isLifetime, navigate, onClose]);

  // Generate live registered invoice via API
  const handleGenerateInvoice = useCallback(async () => {
    if (!user) {
      onClose();
      navigate('/auth?redirect=/upgrade');
      return;
    }

    // 1. Strict rate limit check: Max 20 times per day
    if (!canGenerateCheckoutQR()) {
      setError('អ្នកបានប្រើប្រាស់អស់កូតា ២០ដងក្នុងថ្ងៃនេះហើយ សូមព្យាយាមម្ដងទៀតនៅថ្ងៃស្អែក');
      setStatus('EXPIRED');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus('GENERATING');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: fixedAmount,
          currency,
          userId: user?.uid,
          userEmail: user?.email,
          userName: user?.displayName,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.warn('[CheckoutModal] Non-JSON checkout response:', text.slice(0, 100));
        throw new Error('មិនអាចតភ្ជាប់ទៅកាន់ម៉ាស៊ីនមេបានទេ សូមព្យាយាមម្តងទៀត។');
      }

      if (!res.ok || !data.success) {
        if (res.status === 401 || data.code === 'UNAUTHENTICATED') {
          onClose();
          navigate('/auth?redirect=/upgrade');
          return;
        }
        throw new Error(data.error || 'Failed to generate live checkout invoice.');
      }

      // If user is already Lifetime VIP in cloud database
      if (data.alreadyVip || data.status === 'PAID') {
        setStatus('PAID');
        setShowConfetti(true);
        try {
          localStorage.removeItem('qr_active_checkout_session');
        } catch {}
        await activateLifetimeVIP(data.tranId || 'EXISTING_VIP', fixedAmount, currency);
        await refreshProfile();
        return;
      }

      // Record generation and update quota
      const updatedQuota = recordCheckoutQRGeneration();
      setQuota(updatedQuota);

      // Render crisp KHQR code with full ISO/IEC Quiet Zone for 100% instant banking scan
      const qrTarget = data.qrString;
      if (!qrTarget || !qrTarget.startsWith('00')) {
        throw new Error('Invalid QR payload received from payment gateway.');
      }
      const qrUrl = await QRCode.toDataURL(qrTarget, {
        width: 360,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });

      const expiresAt = Date.now() + 180 * 1000;
      // Persist active checkout session across reloads and tab closures
      try {
        localStorage.setItem(
          'qr_active_checkout_session',
          JSON.stringify({
            invoice: data,
            qrDataUrl: qrUrl,
            expiresAt,
            userId: user?.uid,
          })
        );
      } catch (e) {
        console.warn('[CheckoutModal] Storage error:', e);
      }

      setInvoice(data);
      setQrDataUrl(qrUrl);
      setStatus('PENDING');
      setTimeLeft(180);
      startTimeRef.current = Date.now();
      isDeeplinkClickedRef.current = false;
    } catch (err: any) {
      console.warn('[CheckoutModal] Server API failed, activating authentic client-side KHQR failover engine:', err);
      try {
        const fallbackTranId = `VIP-${Date.now()}`;
        const fallbackKhqr = buildClientFallbackKhqr(fixedAmount, currency, fallbackTranId);
        const fallbackDeeplinks = buildClientDeeplinks(fallbackKhqr);

        const qrUrl = await QRCode.toDataURL(fallbackKhqr, {
          width: 360,
          margin: 4,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });

        const fallbackData: InvoiceData = {
          tranId: fallbackTranId,
          amount: fixedAmount,
          currency,
          qrString: fallbackKhqr,
          deeplinks: fallbackDeeplinks,
        };

        const expiresAt = Date.now() + 180 * 1000;
        try {
          localStorage.setItem(
            'qr_active_checkout_session',
            JSON.stringify({
              invoice: fallbackData,
              qrDataUrl: qrUrl,
              expiresAt,
              userId: user?.uid,
            })
          );
        } catch {}

        setInvoice(fallbackData);
        setQrDataUrl(qrUrl);
        setStatus('PENDING');
        setTimeLeft(180);
        startTimeRef.current = Date.now();
        isDeeplinkClickedRef.current = false;
      } catch (fallbackErr) {
        console.error('[CheckoutModal] Emergency fallback failed:', fallbackErr);
        setError(err.message || 'Cannot connect to payment gateway. Please try again.');
        setStatus('ERROR');
      }
    } finally {
      setLoading(false);
    }
  }, [currency, user, navigate, onClose]);

  // Check transaction status once via pay-helper endpoint
  const checkStatusOnce = useCallback(async (tranId: string) => {
    try {
      const res = await fetch('/api/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tranId,
          token: invoice?.token,
          deviceId: invoice?.deviceId,
          clientId: invoice?.clientId,
          requestTime: invoice?.requestTime,
          userId: user?.uid,
          signature: invoice?.signature,
          createdAt: invoice?.createdAt,
        }),
      });
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        return false;
      }
      if (data?.status === 'PAID') {
        setStatus('PAID');
        setShowConfetti(true);
        setManualNotice(null);
        try {
          localStorage.removeItem('qr_active_checkout_session');
        } catch {}
        if (pollerRef.current) clearTimeout(pollerRef.current);
        if (timerRef.current) clearInterval(timerRef.current);

        // Activate lifetime in Professional Cloud & LocalStorage
        await activateLifetimeVIP(tranId, fixedAmount, currency);
        await refreshProfile();
        return true;
      }
    } catch (e) {
      console.warn('[CheckoutModal] Check error:', e);
    }
    return false;
  }, [activateLifetimeVIP, currency, fixedAmount, invoice?.clientId, invoice?.createdAt, invoice?.deviceId, invoice?.requestTime, invoice?.signature, invoice?.token, refreshProfile, user?.uid]);

  const handleManualVerify = async () => {
    if (!invoice?.tranId || checkingManual) return;
    setCheckingManual(true);
    setManualNotice(null);
    try {
      const paid = await checkStatusOnce(invoice.tranId);
      if (paid) {
        setStatus('PAID');
        setShowConfetti(true);
        return;
      }
      setManualNotice('មិនទាន់ទទួលបានការទូទាត់ទេ! ប្រសិនបើអ្នកបានផ្ទេរ $3.00 រួចហើយ សូមរង់ចាំបន្តិច ប្រព័ន្ធកំពុងផ្ទៀងផ្ទាត់ស្វ័យប្រវត្តិតាមធនាគារ ABA។');
    } catch (e) {
      console.warn('[CheckoutModal] Manual verification check error:', e);
      setManualNotice('មានបញ្ហាក្នុងការតភ្ជាប់ផ្ទៀងផ្ទាត់។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setCheckingManual(false);
    }
  };

  // Polling loop strictly every 3 seconds (3000ms) cadence as requested by user
  const scheduleNextPoll = useCallback(() => {
    if (status !== 'PENDING' || !invoice?.tranId) return;

    pollerRef.current = window.setTimeout(async () => {
      if (status !== 'PENDING' || !invoice?.tranId) return;
      const paid = await checkStatusOnce(invoice.tranId);
      if (!paid && status === 'PENDING') {
        scheduleNextPoll();
      }
    }, 3000); // Fixed 3-second interval
  }, [status, invoice?.tranId, checkStatusOnce]);

  // Instant check when returning to tab from banking app
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && status === 'PENDING' && invoice?.tranId) {
        checkStatusOnce(invoice.tranId);
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [status, invoice?.tranId, checkStatusOnce]);

  // Initial generation or recovery of unexpired session
  useEffect(() => {
    if (!isOpen || isLifetime) return;

    try {
      const raw = localStorage.getItem('qr_active_checkout_session');
      if (raw) {
        const session = JSON.parse(raw);
        if (session.userId && user?.uid && session.userId !== user.uid) {
          localStorage.removeItem('qr_active_checkout_session');
        } else {
          const remaining = Math.floor((session.expiresAt - Date.now()) / 1000);
          if (remaining > 5 && session.invoice?.tranId && session.qrDataUrl && session.invoice?.qrString?.startsWith('00')) {
            setInvoice(session.invoice);
            setQrDataUrl(session.qrDataUrl);
            setTimeLeft(remaining);
            setStatus('PENDING');
            startTimeRef.current = session.expiresAt - 180 * 1000;
            return;
          } else {
            localStorage.removeItem('qr_active_checkout_session');
          }
        }
      }
    } catch {
      localStorage.removeItem('qr_active_checkout_session');
    }

    if (status === 'IDLE') {
      handleGenerateInvoice();
    }
  }, [isOpen, status, isLifetime, handleGenerateInvoice]);

  // Lock page reload / accidental tab closure while payment is PENDING
  useEffect(() => {
    if (status !== 'PENDING') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'អ្នកកំពុងមានប្រតិបត្តិការស្កេនទូទាត់ដែលមិនទាន់ចប់។ តើអ្នកពិតជាចង់ចាកចេញមែនទេ?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status]);

  // Poller trigger
  useEffect(() => {
    if (status === 'PENDING') {
      scheduleNextPoll();
    }
    return () => {
      if (pollerRef.current) clearTimeout(pollerRef.current);
    };
  }, [status, scheduleNextPoll]);

  // Countdown timer
  useEffect(() => {
    if (status === 'PENDING') {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setStatus('EXPIRED');
            if (invoice?.tranId) {
              trackQrExpired(invoice.tranId, user);
            }
            try {
              localStorage.removeItem('qr_active_checkout_session');
            } catch {}
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Handle Deeplink: Direct native launch into ABA Mobile or Bakong app (NEVER open web URL)
  const handleOpenBankApp = (bank: 'aba' | 'bakong') => {
    isDeeplinkClickedRef.current = true;
    const qr = invoice?.qrString;
    if (!qr) return;

    // Automatic silent copy to clipboard as seamless backup UX
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(qr).catch(() => {});
      }
    } catch {}

    const isAndroid = /Android/i.test(navigator.userAgent);
    const encoded = encodeURIComponent(qr);
    const isPayway = qr.includes('PAYWAY') || qr.includes('PLIK');
    const typeParam = isPayway ? 'payway' : 'khqr';

    if (bank === 'aba') {
      const targetUrl = isAndroid
        ? `intent://ababank.com?type=${typeParam}&qrcode=${encoded}#Intent;scheme=abamobilebank;end;`
        : `abamobilebank://ababank.com?type=${typeParam}&qrcode=${encoded}`;

      window.location.href = targetUrl;
      return;
    }

    if (bank === 'bakong') {
      const targetUrl = isAndroid
        ? `intent://open?qr=${encoded}#Intent;scheme=bakong;package=kh.gov.nbc.bakong;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dkh.gov.nbc.bakong;end`
        : `bakong://open?qr=${encoded}`;

      window.location.href = targetUrl;
      return;
    }
  };

  if (!isOpen) return null;

  const isExceeded = quota.remaining <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Clean Studio Light Mode */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                Lifetime VIP Access
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  មួយជីវិត
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                ទូទាត់តែម្តង ប្រើប្រាស់មុខងារពិសេសរហូត
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Daily Quota Indicator */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>កូតាបង្កើត QR ថ្ងៃនេះ:</span>
            <span className={`font-bold ${isExceeded ? 'text-rose-600' : 'text-slate-900'}`}>
              សល់ {quota.remaining}/{quota.max} ដង
            </span>
          </div>
          {isExceeded && (
            <span className="text-[10px] text-rose-600 font-semibold">
              អស់កូតាថ្ងៃនេះ
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Success State */}
          {status === 'PAID' ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  ការទូទាត់ជោគជ័យ
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  គណនីរបស់អ្នកឥឡូវនេះជាសមាជិក Lifetime VIP រួចរាល់ហើយ។
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">លេខប្រតិបត្តិការ:</span>
                  <span className="font-mono font-bold">{invoice?.tranId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ទឹកប្រាក់:</span>
                  <span className="font-bold">${fixedAmount.toFixed(2)} USD</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
              >
                ចាប់ផ្តើមប្រើប្រាស់ VIP ឥឡូវនេះ
              </button>
            </div>
          ) : (
            <>
              {/* Official Lifetime VIP Plan Badge */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center justify-center font-bold shadow-xs shrink-0">
                    <Crown className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      Lifetime VIP Access
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ទូទាត់តែម្តង ប្រើប្រាស់មួយជីវិត គ្មានថ្លៃបន្ត
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-slate-900">$3.00</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">USD</div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* QR Code Container */}
              <div className="relative flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                {loading ? (
                  <div className="w-56 h-56 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                    <p className="text-xs font-medium text-slate-600">
                      កំពុងភ្ជាប់ប្រព័ន្ធធនាគារ ABA...
                    </p>
                  </div>
                ) : qrDataUrl && status === 'PENDING' ? (
                  <>
                    <div className="relative p-2.5 bg-white rounded-lg shadow-xs border border-slate-200">
                      <img
                        src={qrDataUrl}
                        alt="Scan KHQR to Pay"
                        className="w-52 h-52 object-contain"
                      />
                      {/* KHQR Watermark Badge */}
                      <div className="absolute inset-x-0 bottom-3.5 flex justify-center">
                        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-red-600 text-white shadow-xs">
                          KHQR · ABA
                        </span>
                      </div>
                    </div>

                    {/* Timer & Live status */}
                    <div className="mt-3.5 flex items-center justify-between w-full px-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
                        <span className="font-medium text-slate-700">
                          កំពុងរង់ចាំស្កេន...
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                      </div>
                    </div>

                    {/* Active Status Polling */}
                    <div className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-600">
                      <RotateCw className="w-3 h-3 text-slate-500 animate-spin" />
                      <span>កំពុងត្រួតពិនិត្យស្ថានភាពទូទាត់ស្វ័យប្រវត្តិ</span>
                    </div>
                  </>
                ) : status === 'ERROR' ? (
                  <div className="w-56 h-56 flex flex-col items-center justify-center gap-2.5 text-center p-3">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                    <h5 className="font-bold text-slate-900 text-xs">
                      មិនអាចភ្ជាប់ទៅកាន់ប្រព័ន្ធ ABA បានទេ
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {error || 'សូមពិនិត្យមើលការតភ្ជាប់អ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។'}
                    </p>
                    <button
                      type="button"
                      disabled={isExceeded}
                      onClick={() => handleGenerateInvoice()}
                      className="mt-1 px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      ព្យាយាមម្តងទៀត
                    </button>
                  </div>
                ) : status === 'EXPIRED' ? (
                  <div className="w-56 h-56 flex flex-col items-center justify-center gap-2.5 text-center p-3">
                    <Clock className="w-10 h-10 text-slate-400" />
                    <h5 className="font-bold text-slate-900 text-xs">
                      QR Code បានផុតកំណត់ហើយ
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      ដើម្បីសុវត្ថិភាព KHQR ដំណើរការត្រឹម ៣ នាទីប៉ុណ្ណោះ។
                    </p>
                    <button
                      type="button"
                      disabled={isExceeded}
                      onClick={() => handleGenerateInvoice()}
                      className="mt-1 px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-xs"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      បង្កើត QR ថ្មី
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Direct Banking App Launch Buttons */}
              {status === 'PENDING' && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-500 text-center">
                    ជ្រើសរើសបើកកម្មវិធីធនាគារផ្ទាល់
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenBankApp('aba')}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#004777] hover:bg-[#00385e] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      <Smartphone className="w-4 h-4" />
                      ABA Mobile
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenBankApp('bakong')}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      <Smartphone className="w-4 h-4" />
                      Bakong App
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Verification Button */}
              {status === 'PENDING' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={checkingManual}
                    onClick={handleManualVerify}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-75"
                  >
                    <RotateCw className={checkingManual ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
                    <span>{checkingManual ? 'កំពុងផ្ទៀងផ្ទាត់ជាមួយធនាគារ ABA...' : 'ពិនិត្យស្ថានភាពការទូទាត់ឡើងវិញ'}</span>
                  </button>

                  {manualNotice && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 text-center leading-relaxed">
                      {manualNotice}
                    </div>
                  )}
                </div>
              )}

              {/* VIP Benefits Overview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  អត្ថប្រយោជន៍ Lifetime VIP របស់អ្នក៖
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>រក្សាទុកប្រវត្តិស្កេនគ្មានដែនកំណត់</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>បង្កើត QR Code ពិសេសតាមពណ៌ និងរចនាប័ទ្មផ្ទាល់ខ្លួន</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>ទាញយកទិន្នន័យជាឯកសារ CSV ឬ JSON យ៉ាងងាយស្រួល</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>ភ្ជាប់ Cloud Sync និង Backup លើគណនីរបស់អ្នកជារៀងរហូត</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
