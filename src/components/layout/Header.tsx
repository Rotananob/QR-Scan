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
        'bg-white/95 backdrop-blur-md',
        'border-b border-slate-200 shadow-xs',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="QR Scan Logo" className="w-8 h-8 object-contain rounded-lg" />
        <h1 className="font-bold text-slate-900 text-base">
          {title ?? 'QR Scan'}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {right}

        {/* Lifetime VIP Badge or Upgrade Link */}
        {isLifetime ? (
          <NavLink
            to="/upgrade"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold uppercase tracking-wider"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            VIP
          </NavLink>
        ) : (
          <NavLink
            to="/upgrade"
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            VIP $3
          </NavLink>
        )}

        {/* User Account / Profile link */}
        <NavLink
          to="/auth"
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors overflow-hidden"
          title={user ? (user.displayName || user.email || 'Profile') : 'Login'}
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
          ) : user ? (
            <span className="font-bold text-xs text-slate-800">
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
