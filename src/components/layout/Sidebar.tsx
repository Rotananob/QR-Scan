import React from 'react';
import { NavLink } from 'react-router-dom';
import { ScanLine, History, Star, Settings, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', icon: ScanLine, label: t('nav.scan'), end: true },
    { to: '/history', icon: History, label: t('nav.history'), end: false },
    { to: '/favorites', icon: Star, label: t('nav.favorites'), end: false },
    { to: '/settings', icon: Settings, label: t('nav.settings'), end: false },
    { to: '/about', icon: Info, label: t('about.title'), end: false },
  ];

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-white/10 flex flex-col hidden lg:flex z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-200/60 dark:border-white/10 gap-3">
        <img src="/logo.png" alt="QR Scan Logo" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
        <span className="font-bold text-lg text-slate-900 dark:text-white">QR Scan</span>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-white dark:bg-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none text-indigo-600 dark:text-indigo-400 font-medium scale-[1.02] border border-slate-100 dark:border-white/5'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-white/10 text-xs text-gray-400 dark:text-gray-500 text-center">
        {t('settings.localPrivacy')}
      </div>
    </aside>
  );
};
