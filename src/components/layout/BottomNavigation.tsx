import React from 'react';
import { NavLink } from 'react-router-dom';
import { ScanLine, QrCode, Crown, History, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

export const BottomNavigation: React.FC = () => {
  const { t } = useTranslation();
  const { isLifetime } = useAuth();

  const navItems = [
    { to: '/', icon: ScanLine, label: t('nav.scan') || 'ស្កេន', end: true },
    { to: '/generate', icon: QrCode, label: 'បង្កើត QR', end: false },
    { to: '/upgrade', icon: Crown, label: isLifetime ? 'VIP' : 'ជាវ VIP', end: false, isGold: true },
    { to: '/history', icon: History, label: t('nav.history') || 'ប្រវត្តិ', end: false },
    { to: '/settings', icon: Settings, label: t('nav.settings') || 'កំណត់', end: false },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-xs"
      aria-label="Main navigation"
    >
      <div className="flex">
        {navItems.map(({ to, icon: Icon, label, end, isGold }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-all duration-200 relative',
                isActive
                  ? isGold
                    ? 'text-amber-600'
                    : 'text-slate-900 font-bold'
                  : isGold
                  ? 'text-amber-600/80 hover:text-amber-600'
                  : 'text-slate-500 hover:text-slate-800'
              )
            }
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isActive && 'scale-105 mb-0.5',
                    isGold ? 'text-amber-600' : isActive ? 'text-slate-900' : 'text-slate-500'
                  )}
                  aria-hidden="true"
                />
                <span className={cn('text-[10px] transition-all duration-200', isActive ? 'opacity-100 font-bold text-slate-900' : 'opacity-80 text-slate-500')}>
                  {label}
                </span>
                {isActive && (
                  <span
                    className={cn(
                      'absolute bottom-0 h-0.5 w-8 rounded-full',
                      isGold ? 'bg-amber-600' : 'bg-slate-900'
                    )}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
