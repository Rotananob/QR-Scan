import React from 'react';
import { NavLink } from 'react-router-dom';
import { Crown, User as UserIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title?: string;
  right?: React.ReactNode;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, right, className }) => {
  const { user, isLifetime } = useAuth();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between px-4 h-14',
        'bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl',
        'border-b border-slate-200/50 dark:border-white/5 shadow-sm shadow-slate-200/20 dark:shadow-none',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="QR Scan Logo" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
        <h1 className="font-bold text-slate-900 dark:text-white text-base">
          {title ?? 'QR Scan'}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {right}

        {/* Lifetime VIP Badge or Upgrade Link */}
        {isLifetime ? (
          <NavLink
            to="/upgrade"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase tracking-wider shadow-sm"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            VIP
          </NavLink>
        ) : (
          <NavLink
            to="/upgrade"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-[11px] font-bold shadow-sm shadow-indigo-500/25 active:scale-95 transition-all"
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            VIP $3
          </NavLink>
        )}

        {/* User Account / Profile link */}
        <NavLink
          to="/auth"
          className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors overflow-hidden"
          title={user ? (user.displayName || user.email || 'Profile') : 'Login / Register'}
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
          ) : user ? (
            <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </span>
          ) : (
            <UserIcon className="w-4 h-4 text-slate-400" />
          )}
        </NavLink>
      </div>
    </header>
  );
};
