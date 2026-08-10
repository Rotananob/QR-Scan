import React from 'react';
import { NavLink } from 'react-router-dom';
import { ScanLine, History, Star, Settings, QrCode } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { to: '/', icon: ScanLine, label: 'Scanner', end: true },
  { to: '/history', icon: History, label: 'History', end: false },
  { to: '/favorites', icon: Star, label: 'Favorites', end: false },
  { to: '/settings', icon: Settings, label: 'Settings', end: false },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-100 dark:border-white/10">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <QrCode className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white leading-none">QR Scan</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fast & Private</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3" aria-label="Main navigation">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn('w-5 h-5', isActive && 'text-indigo-600 dark:text-indigo-400')}
                      aria-hidden="true"
                    />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          🔒 All data stored locally
        </p>
      </div>
    </aside>
  );
};
