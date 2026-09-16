import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, Shield, GraduationCap, Briefcase, Menu } from 'lucide-react';
import { NotificationModal } from '../notifications/NotificationModal';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  title: string;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const roleBadge = () => {
    if (user?.role === 'super_admin') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shadow-xs whitespace-nowrap">
          <Shield className="w-3 h-3" /> VC Admin
        </span>
      );
    }
    if (user?.role === 'faculty') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1 shadow-xs whitespace-nowrap">
          <Briefcase className="w-3 h-3" /> Faculty
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-xs whitespace-nowrap">
        <GraduationCap className="w-3 h-3" /> Student
      </span>
    );
  };

  return (
    <>
      <header className="h-16 border-b border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-2xl sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between shadow-xs transition-colors gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-1 rounded-xl text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10 border border-[var(--panel-border)] lg:hidden transition-colors shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="hidden xs:block w-1.5 sm:w-2 h-6 bg-gradient-to-b from-[#0e8a6e] to-emerald-400 rounded-full shrink-0" />
          <h1 className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-[var(--text-primary)] font-display truncate max-w-[130px] xs:max-w-[200px] sm:max-w-md md:max-w-lg">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <ThemeToggle />

          <button
            onClick={() => setIsNotifOpen(true)}
            className="p-2 sm:p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10 border border-[var(--panel-border)] transition-all relative shrink-0"
            title="Broadcast Notifications"
          >
            <Bell className="w-4 h-4 text-emerald-500" />
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-emerald-500 badge-pulse" />
          </button>

          <div className="hidden xs:block h-6 w-px bg-[var(--panel-border)]" />

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#0e8a6e] to-emerald-500 border border-white/20 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md shrink-0">
              {user?.name.charAt(0) || 'U'}
            </div>

            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[120px]">{user?.name}</div>
              <div className="mt-0.5">{roleBadge()}</div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all ml-0.5"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};

