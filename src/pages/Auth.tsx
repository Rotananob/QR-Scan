import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  const { user, isLifetime, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('សូមបំពេញអ៊ីមែល និងពាក្យសម្ងាត់');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'REGISTER') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      navigate(redirectTarget);
    } catch (err: any) {
      console.error('[Auth Error]:', err);
      let msg = err.message || 'បរាជ័យក្នុងការចូលប្រើ';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'អ៊ីមែលនេះត្រូវបានប្រើប្រាស់រួចហើយ។ សូមជ្រើសរើស "ចូលប្រើ (Login)"។';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។';
      } else if (err.code === 'auth/weak-password') {
        msg = 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ។';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate(redirectTarget);
    } catch (err: any) {
      console.error('[Google Auth Error]:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'ការចូលប្រើតាម Google មិនបានសម្រេច។');
      }
    } finally {
      setLoading(false);
    }
  };

  // If user is already logged in, show Account management overview
  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
          <div className="relative inline-block">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-20 h-20 rounded-full mx-auto border-2 border-indigo-500 shadow-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-lg">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {isLifetime && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                <Crown className="w-4 h-4" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              {user.displayName || 'សមាជិក'}
              {isLifetime && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Lifetime VIP
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-white/5 text-left text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
              <span className="text-slate-500">ស្ថានភាពគណនី:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {isLifetime ? 'Lifetime VIP Member' : 'Free Standard User'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Account ID:</span>
              <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                {user.uid}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {!isLifetime ? (
              <button
                type="button"
                onClick={() => navigate('/upgrade')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <Crown className="w-4 h-4" />
                ជាវ Lifetime VIP ឥឡូវនេះ
              </button>
            ) : (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                អ្នកមានសិទ្ធិប្រើប្រាស់មុខងារ VIP ពេញលេញជារៀងរហូត
              </div>
            )}

            <button
              type="button"
              onClick={signOut}
              className="w-full py-3 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              ចាកចេញពីគណនី (Sign Out)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

        {/* Heading */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/40 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            {redirectTarget.includes('upgrade') ? 'ដំណាក់កាលជាវ Lifetime VIP' : 'គណនី QR Scan'}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {mode === 'LOGIN' ? 'ចូលប្រើប្រាស់គណនី' : 'បង្កើតគណនីថ្មី'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {redirectTarget.includes('upgrade')
              ? 'សូមចូលប្រើប្រាស់ ឬបង្កើតគណនី ដើម្បីចងភ្ជាប់សិទ្ធិ Lifetime VIP របស់អ្នកជាអចិន្ត្រៃយ៍'
              : 'ចូលប្រើដើម្បី Sync ទិន្នន័យ និងគ្រប់គ្រងសិទ្ធិ VIP របស់អ្នក'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setMode('LOGIN')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'LOGIN'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ចូលប្រើ (Login)
          </button>
          <button
            type="button"
            onClick={() => setMode('REGISTER')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'REGISTER'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ចុះឈ្មោះ (Register)
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm mb-5 active:scale-[0.99]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          បន្តជាមួយ Google
        </button>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-200 dark:border-white/10 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            ឬប្រើអ៊ីមែល
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ឈ្មោះរបស់អ្នក (Display Name)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ឈ្មោះពេញ ឬ Nickname"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              អាសយដ្ឋានអ៊ីមែល (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ពាក្យសម្ងាត់ (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="យ៉ាងហោច ៦ តួអក្សរ"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'LOGIN' ? 'ចូលប្រើប្រាស់' : 'បង្កើតគណនី'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>ទិន្នន័យរបស់អ្នកត្រូវបានការពារសុវត្ថិភាពដោយប្រព័ន្ធ Professional Cloud Security</span>
        </div>
      </div>
    </div>
  );
};
