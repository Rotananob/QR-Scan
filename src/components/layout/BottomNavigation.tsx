import React from 'react';
import { NavLink } from 'react-router-dom';
import { ScanLine, History, Star, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { to: '/', icon: ScanLine, label: 'Scan', end: true },
  { to: '/history', icon: History, label: 'History', end: false },
  { to: '/favorites', icon: Star, label: 'Favorites', end: false },
  { to: '/settings', icon: Settings, label: 'Settings', end: false },
];

export const BottomNavigation: React.FC = () => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 pb-safe"
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
                'flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )
            }
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 h-0.5 w-8 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
