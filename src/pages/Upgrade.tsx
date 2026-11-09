import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Check,
  ShieldCheck,
  Download,
  Database,
  ArrowRight,
  UserCheck,
  Clock,
  QrCode,
  Layers,
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
    if (isLifetime) {
      setCheckoutOpen(false);
      try { localStorage.removeItem('qr_active_checkout_session'); } catch {}
      return;
    }
    try {
      const raw = localStorage.getItem('qr_active_checkout_session');
      if (raw && !isLifetime && user) {
        const session = JSON.parse(raw);
        if (session.userId && session.userId !== user.uid) {
          localStorage.removeItem('qr_active_checkout_session');
          return;
        }
        if (session.expiresAt && session.expiresAt > Date.now() && session.invoice?.qrString?.startsWith('00')) {
          setCheckoutOpen(true);
        }
      }
    } catch {}
  }, [isLifetime, user]);

  const handleCtaClick = () => {
    if (isLifetime) return;
    if (!user) {
      navigate('/auth?redirect=/upgrade');
      return;
    }
    setCheckoutOpen(true);
  };

  const perks = [
    {
      icon: Database,
      title: 'ប្រវត្តិស្កេនគ្មានដែនកំណត់',
      desc: 'រក្សាទុក QR code ដែលបានស្កេនទាំងអស់ដោយគ្មានការលុបស្វ័យប្រវត្តិ',
    },
    {
      icon: QrCode,
      title: 'បង្កើត QR Code ពិសេស',
      desc: 'បង្កើត QR សម្រាប់ Wi-Fi ទំនាក់ទំនង តំណភ្ជាប់ ជាមួយពណ៌ និង Logo ផ្ទាល់ខ្លួន',
    },
    {
      icon: Download,
      title: 'Export ទិន្នន័យជា CSV ឬ JSON',
      desc: 'ទាញយកទិន្នន័យស្កេនទាំងអស់សម្រាប់ប្រើប្រាស់ក្នុង Excel ឬប្រព័ន្ធផ្សេងៗ',
    },
    {
      icon: ShieldCheck,
      title: 'ប្រព័ន្ធការពារសុវត្ថិភាពកម្រិតខ្ពស់',
      desc: 'វិភាគតំណភ្ជាប់គួរឱ្យសង្ស័យ និងការពារពី Phishing មុនពេលបើក',
    },
    {
      icon: Layers,
      title: 'Cloud Sync និង Backup',
      desc: 'រក្សាទុកទិន្នន័យស្កេនដោយស្វ័យប្រវត្តិតាមគណនីរបស់អ្នក ឆ្លងកាត់គ្រប់ឧបករណ៍',
    },
    {
      icon: Crown,
      title: 'Badge សម្គាល់ Lifetime VIP',
      desc: 'ទទួលបានផ្លាកសញ្ញា VIP លើគណនី និងការគាំទ្រអាទិភាព',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Hero Header - Clean Light/Grey Studio Card */}
      <div className="rounded-2xl p-6 sm:p-10 text-center bg-white border border-slate-200 shadow-sm">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            LIFETIME VIP ACCESS
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            ក្លាយជាសមាជិក VIP មួយជីវិត
          </h1>

          <p className="text-xs sm:text-sm text-slate-600">
            {isLifetime
              ? 'គណនីរបស់អ្នកបាន Upgrade ជាសមាជិក VIP រួចរាល់ហើយ។'
              : 'ទូទាត់តែម្តង ប្រើប្រាស់មុខងារកម្រិតខ្ពស់ទាំងអស់ជារៀងរហូត គ្មានថ្លៃបន្តប្រចាំខែឡើយ។'}
          </p>

          {isLifetime ? (
            <div className="pt-2 pb-2 space-y-4">
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider border border-emerald-200">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  គម្រោងបច្ចុប្បន្ន: LIFETIME VIP
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  អ្នកជាម្ចាស់កម្មសិទ្ធិ Lifetime VIP ពេញមួយជីវិត
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  គណនីរបស់អ្នកមានសិទ្ធិចូលប្រើប្រាស់មុខងារពិសេសៗទាំងអស់ជារៀងរហូត គ្មានការផុតកំណត់ និងមិនបាច់បង់ប្រាក់បន្ថែមឡើយ។
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/generate')}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95"
                  >
                    <QrCode className="w-4 h-4" />
                    ប្រើប្រាស់មុខងារបង្កើត QR ឥឡូវនេះ
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/history')}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-2 transition-all"
                  >
                    <Database className="w-4 h-4 text-slate-600" />
                    មើលប្រវត្តិស្កេនគ្មានដែនកំណត់
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Price Box */}
              <div className="pt-2 flex flex-col items-center">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    $3.00
                  </span>
                  <span className="text-slate-500 text-xs sm:text-sm font-semibold uppercase">
                    USD មួយជីវិត
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  ស្មើនឹងប្រហែល ១២,០០០ រៀល តាមរយៈ ABA PayWay KHQR
                </p>
              </div>

              {/* Call to action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCtaClick}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 mx-auto active:scale-98 transition-all"
                >
                  {!user ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      ចូលប្រើប្រាស់ដើម្បីជាវ Lifetime VIP
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 text-amber-400" />
                      ជាវ Lifetime VIP $3.00
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                {!user && (
                  <p className="text-[11px] text-slate-500 mt-2">
                    អ្នកប្រើប្រាស់ធម្មតាមិនចាំបាច់បង្កើតគណនីទេ ប៉ុន្តែពេលជាវ VIP ត្រូវការ Login ដើម្បីរក្សាសិទ្ធិរបស់អ្នកជាអចិន្ត្រៃយ៍។
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Daily Quota Notice */}
      {!isLifetime && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              កម្រិតកំណត់បង្កើត QR Checkout អតិបរមា <strong className="text-slate-900">{quota.max} ដងក្នុង១ថ្ងៃ</strong>។
            </span>
          </div>
          <span className="font-bold text-slate-900 shrink-0 ml-2">
            សល់ {quota.remaining}/{quota.max} ដង
          </span>
        </div>
      )}

      {/* Perks Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 text-center">
          មុខងារពិសេសដែលអ្នកនឹងទទួលបាន
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {perks.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors space-y-2"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  {p.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Free vs VIP Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            ប្រៀបធៀបគណនី Free និង Lifetime VIP
          </h3>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="grid grid-cols-3 p-3 bg-slate-50 font-bold text-slate-600 uppercase tracking-wider">
            <div>មុខងារ</div>
            <div className="text-center">Free Standard</div>
            <div className="text-center text-slate-900">Lifetime VIP</div>
          </div>

          <div className="grid grid-cols-3 p-3 items-center">
            <div className="text-slate-800 font-medium">ស្កេន QR កាមេរ៉ា និងរូបភាព</div>
            <div className="text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></div>
            <div className="text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></div>
          </div>

          <div className="grid grid-cols-3 p-3 items-center">
            <div className="text-slate-800 font-medium">មិនបាច់បង្កើតគណនី</div>
            <div className="text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></div>
            <div className="text-center text-emerald-600"><Check className="w-4 h-4 mx-auto" /></div>
          </div>

          <div className="grid grid-cols-3 p-3 items-center">
            <div className="text-slate-800 font-medium">ប្រវត្តិស្កេន</div>
            <div className="text-center text-slate-400">ត្រឹម ២០ លើក</div>
            <div className="text-center font-bold text-emerald-600">គ្មានដែនកំណត់</div>
          </div>

          <div className="grid grid-cols-3 p-3 items-center">
            <div className="text-slate-800 font-medium">បង្កើត QR Code ពិសេស</div>
            <div className="text-center text-slate-400">—</div>
            <div className="text-center font-bold text-emerald-600"><Check className="w-4 h-4 mx-auto" /></div>
          </div>

          <div className="grid grid-cols-3 p-3 items-center">
            <div className="text-slate-800 font-medium">Export ទិន្នន័យជា CSV ឬ JSON</div>
            <div className="text-center text-slate-400">—</div>
            <div className="text-center font-bold text-emerald-600"><Check className="w-4 h-4 mx-auto" /></div>
          </div>

          <div className="grid grid-cols-3 p-3 items-center">
            <div className="text-slate-800 font-medium">Cloud Sync និង Backup</div>
            <div className="text-center text-slate-400">—</div>
            <div className="text-center font-bold text-emerald-600"><Check className="w-4 h-4 mx-auto" /></div>
          </div>

          <div className="grid grid-cols-3 p-3 items-center">
            <div className="text-slate-800 font-medium">Badge សម្គាល់ VIP</div>
            <div className="text-center text-slate-400">—</div>
            <div className="text-center font-bold text-amber-600">ពេញមួយជីវិត</div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen && !isLifetime}
        onClose={() => setCheckoutOpen(false)}
        defaultAmount={3.00}
        currency="USD"
      />
    </div>
  );
};
