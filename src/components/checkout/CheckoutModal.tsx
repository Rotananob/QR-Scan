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
  Sparkles,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateClientKhqr } from '../../services/khqrBuilder';
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
    if (isOpen && !user) {
      onClose();
      navigate('/auth?redirect=/upgrade');
    }
  }, [isOpen, user, navigate, onClose]);

  // Generate live registered invoice via API
  const handleGenerateInvoice = useCallback(async () => {
    if (!user) {
      onClose();
      navigate('/auth?redirect=/upgrade');
      return;
    }

    // 1. Strict rate limit check: Max 20 times per day
    if (!canGenerateCheckoutQR()) {
      setError('អ្នកបានប្រើប្រាស់អស់កូតា ២០ដងក្នុងថ្ងៃនេះហើយ (Daily limit of 20 QR generations reached). សូមព្យាយាមម្ដងទៀតនៅថ្ងៃស្អែក!');
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
        await refreshProfile();
        return;
      }

      // Record generation and update quota
      const updatedQuota = recordCheckoutQRGeneration();
      setQuota(updatedQuota);

      // Render crisp KHQR code with full ISO/IEC Quiet Zone for 100% instant banking scan
      const qrUrl = await QRCode.toDataURL(data.qrString, {
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
      console.warn('[CheckoutModal] Server API failed, activating instant client-side KHQR failover engine:', err);
      try {
        const fallbackTranId = `VIP-${Date.now()}`;
        const fallbackKhqr = generateClientKhqr({
          abaAccount: '126100713043212',
          merchantName: 'NOB ROTANA',
          merchantCity: 'Phnom Penh',
          amount: fixedAmount,
          currency: currency,
          billNumber: fallbackTranId,
        });

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
          deeplinks: {
            aba: {
              ios: `abamobilebank://ababank.com?type=payway&qrcode=${encodeURIComponent(fallbackKhqr)}`,
              android: `intent://ababank.com?type=payway&qrcode=${encodeURIComponent(fallbackKhqr)}#Intent;scheme=abamobilebank;package=com.aba.mobile.android;end`,
            },
            bakong: {
              ios: `bakong://open?qr=${encodeURIComponent(fallbackKhqr)}`,
              android: `intent://open?qr=${encodeURIComponent(fallbackKhqr)}#Intent;scheme=bakong;package=kh.gov.nbc.bakong;end`,
            },
          },
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
      await refreshProfile();
      const paid = await checkStatusOnce(invoice.tranId);
      if (!paid) {
        if (isLifetime) {
          setStatus('PAID');
          setShowConfetti(true);
          return;
        }
        setManualNotice('មិនទាន់ទទួលបានការបញ្ជាក់ពីប្រព័ន្ធនៅឡើយទេ។ ប្រសិនបើអ្នកបានផ្ទេររួចហើយ សូមរង់ចាំប្រហែល ៣ វិនាទី ប្រព័ន្ធនឹងពិនិត្យស្វ័យប្រវត្តិ!');
      }
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
          if (remaining > 5 && session.invoice?.tranId && session.qrDataUrl) {
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
      e.returnValue = 'អ្នកកំពុងមានប្រតិបត្តិការស្កេនទូទាត់ដែលមិនទាន់ចប់ (នៅសល់សុពលភាព)។ តើអ្នកពិតជាចង់ចាកចេញមែនទេ?';
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

  // Handle Deeplink
  const handleOpenBankApp = (bank: 'aba' | 'bakong') => {
    isDeeplinkClickedRef.current = true;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const links = invoice?.deeplinks?.[bank];

    if (!links) return;
    const targetUrl = isIOS ? links.ios : links.android || links.ios;
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  };

  if (!isOpen) return null;

  const isExceeded = quota.remaining <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                Lifetime VIP Access
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  មួយជីវិត
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ទូទាត់តែម្តង ប្រើប្រាស់មុខងារពិសេសរហូត
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Daily Quota Indicator */}
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>កូតាបង្កើត QR ថ្ងៃនេះ:</span>
            <span className={`font-bold ${isExceeded ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
              សល់ {quota.remaining}/{quota.max} ដង
            </span>
          </div>
          {isExceeded && (
            <span className="text-[10px] text-rose-500 font-semibold">
              អស់កូតាថ្ងៃនេះ
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Success State */}
          {status === 'PAID' ? (
            <div className="text-center py-6 space-y-4 animate-scale-up">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  ការទូទាត់ជោគជ័យ!
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  សូមអបអរសាទរ! គណនីរបស់អ្នកឥឡូវនេះជា **Lifetime VIP Member** ហើយ។
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                <div>លេខវិក្កយបត្រ: <span className="font-mono font-bold">{invoice?.tranId}</span></div>
                <div>ទឹកប្រាក់: <span className="font-bold">${fixedAmount.toFixed(2)} USD</span></div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all"
              >
                ចាប់ផ្តើមប្រើប្រាស់ VIP ឥឡូវនេះ
              </button>
            </div>
          ) : (
            <>
              {/* Official Production Lifetime VIP Plan Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-500/25 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                    <Crown className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      Lifetime VIP Access
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                        Production Live
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ទូទាត់តែម្តង ប្រើប្រាស់មួយជីវិត (គ្មានថ្លៃបន្ត)
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-black text-slate-900 dark:text-white">$3.00</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">USD</div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* QR Code Container */}
              <div className="relative flex flex-col items-center justify-center p-5 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl shadow-inner">
                {loading ? (
                  <div className="w-64 h-64 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-xs font-medium text-slate-500">
                      កំពុងភ្ជាប់ប្រព័ន្ធធនាគារ ABA...
                    </p>
                  </div>
                ) : qrDataUrl && status === 'PENDING' ? (
                  <>
                    <div className="relative p-2 bg-white rounded-xl shadow-md border border-slate-100">
                      <img
                        src={qrDataUrl}
                        alt="Scan KHQR to Pay"
                        className="w-56 h-56 object-contain rounded-lg"
                      />
                      {/* Bakong / ABA Watermark pill */}
                      <div className="absolute inset-x-0 bottom-3 flex justify-center">
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-red-600 text-white shadow-sm flex items-center gap-1">
                          KHQR · ABA
                        </span>
                      </div>
                    </div>

                    {/* Timer & Pulsing Live status */}
                    <div className="mt-4 flex items-center justify-between w-full px-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          កំពុងរង់ចាំស្កេន...
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                      </div>
                    </div>

                    {/* 3-Second Active Status Polling Badge via pay-helper */}
                    <div className="mt-2.5 flex items-center justify-center gap-2 w-full py-1.5 px-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                      <RotateCw className="w-3 h-3 text-indigo-500 animate-spin" />
                      <span>កំពុងពិនិត្យស្ថានភាពរៀងរាល់ ៣ វិនាទី (pay-helper)</span>
                    </div>
                  </>
                ) : status === 'ERROR' ? (
                  <div className="w-64 h-64 flex flex-col items-center justify-center gap-3 text-center p-4">
                    <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
                    <h5 className="font-bold text-slate-800 dark:text-white text-sm">
                      មិនអាចភ្ជាប់ទៅកាន់ប្រព័ន្ធ ABA បានទេ
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {error || 'សូមពិនិត្យមើលការតភ្ជាប់អ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។'}
                    </p>
                    <button
                      type="button"
                      disabled={isExceeded}
                      onClick={() => handleGenerateInvoice()}
                      className="mt-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      ព្យាយាមម្តងទៀត (Retry)
                    </button>
                  </div>
                ) : status === 'EXPIRED' ? (
                  <div className="w-64 h-64 flex flex-col items-center justify-center gap-3 text-center p-4">
                    <Clock className="w-12 h-12 text-slate-400" />
                    <h5 className="font-bold text-slate-800 dark:text-white text-sm">
                      QR Code បានផុតកំណត់ហើយ
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ដើម្បីសុវត្ថិភាព KHQR ដំណើរការត្រឹម ៣ នាទីប៉ុណ្ណោះ។
                    </p>
                    <button
                      type="button"
                      disabled={isExceeded}
                      onClick={() => handleGenerateInvoice()}
                      className="mt-2 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center gap-2"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      បង្កើត QR ថ្មី
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Direct Banking App Deep Link Buttons (Mobile) */}
              {status === 'PENDING' && invoice?.deeplinks && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                    ឬចុចបើកកម្មវិធីធនាគារផ្ទាល់លើទូរស័ព្ទ (Deep Link)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenBankApp('aba')}
                      className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#004777] hover:bg-[#00385e] text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <Smartphone className="w-4 h-4" />
                      ABA Mobile
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenBankApp('bakong')}
                      className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      <Smartphone className="w-4 h-4" />
                      Bakong App
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                  </div>
                </div>
              )}

              {/* Instant Manual Verify Payment Button */}
              {status === 'PENDING' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={checkingManual}
                    onClick={handleManualVerify}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-75"
                  >
                    <CheckCircle2 className={checkingManual ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
                    {checkingManual ? 'កំពុងផ្ទៀងផ្ទាត់ការទូទាត់ជាមួយ ABA...' : 'ខ្ញុំបានទូទាត់រួចហើយ (ផ្ទៀងផ្ទាត់ភ្លាមៗ)'}
                  </button>

                  {manualNotice && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 text-center leading-relaxed">
                      {manualNotice}
                    </div>
                  )}
                </div>
              )}

              {/* VIP Benefits Overview */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-2">
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  អត្ថប្រយោជន៍ Lifetime VIP របស់អ្នក៖
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>ប្រវត្តិស្កេនគ្មានដែនកំណត់ (Unlimited Scan History)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>បង្កើត QR Code ពិសេស (Custom Colors & Styles)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Export ទិន្នន័យជា CSV / JSON យ៉ាងងាយស្រួល</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>ភ្ជាប់ Real-time Cloud Sync & Backup លើគណនី Professional របស់អ្នកជារៀងរហូត</span>
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
