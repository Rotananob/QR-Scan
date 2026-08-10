import React from 'react';
import { NavLink } from 'react-router-dom';
import { ScanLine, History, Star, Settings, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

export const BottomNavigation: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', icon: ScanLine, label: t('nav.scan'), end: true },
    { to: '/history', icon: History, label: t('nav.history'), end: false },
    { to: '/favorites', icon: Star, label: t('nav.favorites'), end: false },
    { to: '/settings', icon: Settings, label: t('nav.settings'), end: false },
    { to: '/about', icon: Info, label: t('about.title'), end: false },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-t border-slate-200/50 dark:border-white/5 pb-safe shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.05)] dark:shadow-none"
      aria-label="Main navigation"
    >
      <div className="flex">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-all duration-300',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )
            }
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn('w-5 h-5 transition-all duration-300', isActive && 'scale-110 mb-0.5')}
                  aria-hidden="true"
                />
                <span className={cn("text-[10px] font-medium transition-all duration-300", isActive ? "opacity-100" : "opacity-70")}>{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 h-0.5 w-8 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-slide-up" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
