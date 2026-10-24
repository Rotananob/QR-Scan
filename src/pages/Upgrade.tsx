import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Check,
  Sparkles,
  Zap,
  Shield,
  Download,
  Infinity,
  ArrowRight,
  UserCheck,
  Clock,
  QrCode,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CheckoutModal } from '../components/checkout/CheckoutModal';
import { getDailyQuotaInfo } from '../services/rateLimiter';

export const UpgradePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLifetime } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const quota = getDailyQuotaInfo();

  // Auto-restore checkout modal if unexpired pending session exists
  useEffect(() => {
    try {
      const raw = localStorage.getItem('qr_active_checkout_session');
      if (raw && !isLifetime && user) {
        const session = JSON.parse(raw);
        if (session.userId && session.userId !== user.uid) {
          localStorage.removeItem('qr_active_checkout_session');
          return;
        }
        if (session.expiresAt && session.expiresAt > Date.now()) {
          setCheckoutOpen(true);
        }
      }
    } catch {}
  }, [isLifetime, user]);

  const handleCtaClick = () => {
    if (!user) {
      // User is not authenticated -> redirect to login/register first!
      navigate('/auth?redirect=/upgrade');
      return;
    }
    setCheckoutOpen(true);
  };

  const perks = [
    {
      icon: Infinity,
      title: 'ប្រវត្តិស្កេនគ្មានដែនកំណត់',
      desc: 'រក្សាទុក QR code ដែលបានស្កេនទាំងអស់ដោយគ្មានការលុបស្វ័យប្រវត្ត',
    },
    {
      icon: QrCode,
      title: 'បង្កើត QR Code ពិសេស (Pro Generator)',
      desc: 'បង្កើត QR សម្រាប់ Wi-Fi, ទំនាក់ទំនង, Link ជាមួយពណ៌ និង Logo ផ្ទាល់ខ្លួន',
    },
    {
      icon: Download,
      title: 'Export ទិន្នន័យជា CSV & JSON',
      desc: 'ទាញយកទិន្នន័យស្កេនទាំងអស់សម្រាប់ប្រើប្រាស់ក្នុង Excel ឬប្រព័ន្ធផ្សេងៗ',
    },
    {
      icon: Shield,
      title: 'ប្រព័ន្ធការពារសុវត្ថិភាពកម្រិតខ្ពស់',
      desc: 'វិភាគ Link គួរឱ្យសង្ស័យ និងការពារពី Phishing មុនពេលបើក',
    },
    {
      icon: Zap,
      title: 'Professional Cloud Sync & Backup',
      desc: 'រក្សាទុកទិន្នន័យស្កេនដោយស្វ័យប្រវត្តិកម្រិត Bank-Grade ឆ្លងកាត់គ្រប់ទូរស័ព្ទ និងកុំព្យូទ័រ',
    },
    {
      icon: Crown,
      title: 'Badge ពិសេស Lifetime VIP',
      desc: 'ទទួលបានផ្លាកសញ្ញា VIP លើគណនី និងការគាំទ្រអាទិភាព',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-indigo-600/10 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest shadow-inner">
            <Crown className="w-4 h-4 text-amber-400" />
            LIFETIME VIP ACCESS
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            ក្លាយជាសមាជិក <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-indigo-400">
              VIP មួយជីវិត (Lifetime)
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300">
            {isLifetime
              ? 'សូមអបអរសាទរ! គណនីរបស់អ្នកបាន Upgrade ជាសមាជិក VIP រួចរាល់ហើយ។'
              : 'ទូទាត់តែម្តង ប្រើប្រាស់មុខងារកម្រិតខ្ពស់ទាំងអស់ជារៀងរហូត គ្មានថ្លៃបន្តប្រចាំខែឡើយ។'}
          </p>

          {isLifetime ? (
            <div className="pt-2 pb-2 space-y-4">
              <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-3 shadow-xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs uppercase tracking-widest border border-emerald-500/40">
                  <Crown className="w-4 h-4 text-amber-400" />
                  គម្រោងបច្ចុប្បន្ន: LIFETIME VIP (ACTIVE)
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  អ្នកជាម្ចាស់កម្មសិទ្ធិ Lifetime VIP ពេញមួយជីវិត
                </h2>
                <p className="text-xs sm:text-sm text-emerald-200/80 max-w-md mx-auto">
                  គណនីរបស់អ្នកមានសិទ្ធិចូលប្រើប្រាស់មុខងារពិសេសៗទាំងអស់ជារៀងរហូត គ្មានការផុតកំណត់ និងមិនបាច់បង់ប្រាក់បន្ថែមឡើយ!
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/generate')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95"
                  >
                    <QrCode className="w-4 h-4" />
                    ប្រើប្រាស់ Pro Generator ឥឡូវនេះ
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/history')}
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs border border-white/20 flex items-center gap-2 transition-all"
                  >
                    <Infinity className="w-4 h-4 text-emerald-400" />
                    មើលប្រវត្តិស្កេនគ្មានដែនកំណត់
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Price Box */}
              <div className="pt-4 flex flex-col items-center">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                    $3.00
                  </span>
                  <span className="text-slate-400 text-sm font-semibold uppercase">
                    USD / មួយជីវិត
                  </span>
                </div>
                <p className="text-xs text-amber-400 font-medium mt-1">
                  (ប្រហែល ~12,000 រៀល តាមរយៈ ABA PayWay / KHQR)
                </p>
              </div>

              {/* Call to action */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-700 hover:from-amber-400 hover:via-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 mx-auto active:scale-98 transition-all"
                >
                  {!user ? (
                    <>
                      <UserCheck className="w-5 h-5" />
                      ចូលប្រើប្រាស់ដើម្បីជាវ Lifetime VIP
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      ជាវ Lifetime VIP ឥឡូវនេះ ($3.00)
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                {!user && (
                  <p className="text-[11px] text-slate-400 mt-2.5">
                    * អ្នកប្រើប្រាស់ធម្មតាមិនចាំបាច់បង្កើតគណនីទេ ប៉ុន្តែពេលជាវ VIP ត្រូវការ Login ដើម្បីរក្សាសិទ្ធិរបស់អ្នកជាអចិន្ត្រៃយ៍។
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Daily Quota Notice (Only shown to non-VIP) */}
      {!isLifetime && (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              សុវត្ថិភាពប្រព័ន្ធ QR: កម្រិតកំណត់បង្កើត QR Checkout អតិបរមា <strong className="text-slate-900 dark:text-white">{quota.max} ដងក្នុង១ថ្ងៃ</strong>។
            </span>
          </div>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">
            សល់ {quota.remaining}/{quota.max} ដង
          </span>
        </div>
      )}

      {/* Perks Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center">
          មុខងារពិសេសដែលអ្នកនឹងទទួលបាន
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {perks.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow space-y-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {p.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Free vs VIP Comparison Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            ប្រៀបធៀបគណនី Free និង Lifetime VIP
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
          <div className="grid grid-cols-3 p-4 bg-slate-50 dark:bg-slate-950/60 font-bold text-slate-500 uppercase tracking-wider">
            <div>មុខងារ (Features)</div>
            <div className="text-center">Free Standard</div>
            <div className="text-center text-amber-500">Lifetime VIP</div>
          </div>

          <div className="grid grid-cols-3 p-4 items-center">
            <div className="text-slate-800 dark:text-slate-200 font-medium">ស្កេន QR កាមេរ៉ា & រូបភាព</div>
            <div className="text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></div>
            <div className="text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></div>
          </div>

          <div className="grid grid-cols-3 p-4 items-center">
            <div className="text-slate-800 dark:text-slate-200 font-medium">មិនបាច់បង្កើតគណនី (Anonymous)</div>
            <div className="text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></div>
            <div className="text-center text-emerald-500"><Check className="w-4 h-4 mx-auto" /></div>
          </div>

          <div className="grid grid-cols-3 p-4 items-center">
            <div className="text-slate-800 dark:text-slate-200 font-medium">ប្រវត្តិស្កេន (Scan History)</div>
            <div className="text-center text-slate-400">ត្រឹម ១០០ លើក</div>
            <div className="text-center font-bold text-emerald-500">គ្មានដែនកំណត់ (Unlimited)</div>
          </div>

          <div className="grid grid-cols-3 p-4 items-center">
            <div className="text-slate-800 dark:text-slate-200 font-medium">បង្កើត QR Code ពិសេស (Generator)</div>
            <div className="text-center text-slate-400">—</div>
            <div className="text-center font-bold text-emerald-500"><Check className="w-4 h-4 mx-auto" /></div>
          </div>

          <div className="grid grid-cols-3 p-4 items-center">
            <div className="text-slate-800 dark:text-slate-200 font-medium">Export ទិន្នន័យ (CSV / JSON)</div>
            <div className="text-center text-slate-400">—</div>
            <div className="text-center font-bold text-emerald-500"><Check className="w-4 h-4 mx-auto" /></div>
          </div>

          <div className="grid grid-cols-3 p-4 items-center">
            <div className="text-slate-800 dark:text-slate-200 font-medium">Professional Cloud Sync & Backup</div>
            <div className="text-center text-slate-400">—</div>
            <div className="text-center font-bold text-emerald-500"><Check className="w-4 h-4 mx-auto" /></div>
          </div>

          <div className="grid grid-cols-3 p-4 items-center">
            <div className="text-slate-800 dark:text-slate-200 font-medium">Badge ពិសេស VIP</div>
            <div className="text-center text-slate-400">—</div>
            <div className="text-center font-bold text-amber-500">ពេញមួយជីវិត</div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        defaultAmount={3.00}
        currency="USD"
      />
    </div>
  );
};
