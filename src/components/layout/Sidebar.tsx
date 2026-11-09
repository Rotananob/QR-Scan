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
    <aside className="w-60 h-screen fixed left-0 top-0 bg-white border-r border-slate-200 flex flex-col hidden lg:flex z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-3">
        <img src="/logo.png" alt="QR Scan Logo" className="w-8 h-8 object-contain rounded-lg shadow-xs" />
        <div className="flex flex-col">
          <span className="font-bold text-base text-slate-900 leading-none">QR Scan</span>
          <span className="text-[10px] text-slate-500 mt-0.5">Professional Studio</span>
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
                  ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isActive && 'scale-105',
                      isGold ? 'text-amber-600' : 'text-slate-700'
                    )}
                  />
                  <span>{label}</span>
                </div>
                {isVipBadge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    NEW
                  </span>
                )}
                {isGold && !isLifetime && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-900 text-white">
                    $3
                  </span>
                )}
                {isGold && isLifetime && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                    ACTIVE
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      {/* User Auth Profile Mini Card */}
      <div className="p-3 border-t border-slate-200">
        <NavLink
          to="/auth"
          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all text-left"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-lg object-cover border border-slate-300" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user ? (user.displayName || user.email || 'U').charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-white/80" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
              {user ? (user.displayName || user.email?.split('@')[0]) : 'ចូលប្រើប្រាស់'}
              {isLifetime && <Crown className="w-3 h-3 text-amber-600 shrink-0" />}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {user ? (isLifetime ? 'Lifetime VIP' : 'Free Account') : 'ចូលប្រើប្រាស់'}
            </div>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};
