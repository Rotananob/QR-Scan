import React from 'react';
import { NavLink } from 'react-router-dom';
import { ScanLine, QrCode, History, Star, Settings, Info, Crown, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLifetime } = useAuth();

  const navItems = [
    { to: '/', icon: ScanLine, label: t('nav.scan') || 'ស្កេន', end: true },
    { to: '/generate', icon: QrCode, label: 'បង្កើត QR Code', end: false, isVipBadge: true },
    { to: '/history', icon: History, label: t('nav.history') || 'ប្រវត្តិ', end: false },
    { to: '/favorites', icon: Star, label: t('nav.favorites') || 'ចំណូលចិត្ត', end: false },
    { to: '/upgrade', icon: Crown, label: 'Lifetime VIP', end: false, isGold: true },
    { to: '/settings', icon: Settings, label: t('nav.settings') || 'ការកំណត់', end: false },
    { to: '/about', icon: Info, label: t('about.title') || 'អំពីយើង', end: false },
  ];

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-white/10 flex flex-col hidden lg:flex z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-200/60 dark:border-white/10 gap-3">
        <img src="/logo.png" alt="QR Scan Logo" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
        <div className="flex flex-col">
          <span className="font-bold text-base text-slate-900 dark:text-white leading-none">QR Scan</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Pay-Helper Enabled</span>
        </div>
      </div>
      
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end, isGold, isVipBadge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs font-semibold',
                isActive
                  ? isGold
                    ? 'bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-500 border border-amber-500/30 shadow-sm'
                    : 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 border border-slate-100 dark:border-white/5'
                  : isGold
                  ? 'text-amber-500/90 hover:bg-amber-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isActive && 'scale-110',
                      isGold && 'text-amber-500'
                    )}
                  />
                  <span>{label}</span>
                </div>
                {isVipBadge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-500 dark:text-indigo-300">
                    NEW
                  </span>
                )}
                {isGold && !isLifetime && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500">
                    $3
                  </span>
                )}
                {isGold && isLifetime && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500">
                    ACTIVE
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      {/* User Auth Profile Mini Card */}
      <div className="p-3 border-t border-slate-200/60 dark:border-white/10">
        <NavLink
          to="/auth"
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all text-left"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-xl object-cover border border-indigo-500/40" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user ? (user.displayName || user.email || 'U').charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-white/80" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
              {user ? (user.displayName || user.email?.split('@')[0]) : 'ចូលប្រើប្រាស់'}
              {isLifetime && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {user ? (isLifetime ? 'Lifetime VIP' : 'Free Account') : 'Login / Register'}
            </div>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};
