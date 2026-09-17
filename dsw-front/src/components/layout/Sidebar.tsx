import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, CheckSquare, Megaphone,
  HelpCircle, FileText, MessageSquareHeart, Medal,
  X, ClipboardCheck, Building2, Trophy, Upload, ShieldCheck
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();

  // 1. VC Office (Super Admin) Navigation (Strict 10-Item Order)
  const adminNav: SidebarItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4 text-emerald-500" /> },
    { label: 'Tasks', path: '/admin/tasks', icon: <CheckSquare className="w-4 h-4 text-teal-400" /> },
    { label: 'Events & Committees', path: '/admin/events', icon: <Calendar className="w-4 h-4 text-purple-400" /> },
    { label: 'Departments', path: '/admin/departments', icon: <Building2 className="w-4 h-4 text-blue-400" /> },
    { label: 'HODs', path: '/admin/hods', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
    { label: 'Faculties', path: '/admin/faculty', icon: <Users className="w-4 h-4 text-cyan-400" /> },
    { label: 'Official Reports', path: '/admin/events/reports', icon: <FileText className="w-4 h-4 text-amber-400" /> },
    { label: 'Department Leaderboard', path: '/admin/department-leaderboard', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    { label: 'Staff Leaderboard', path: '/admin/leaderboard/staff', icon: <Medal className="w-4 h-4 text-emerald-400" /> },
    { label: 'Announcements', path: '/admin/announcements', icon: <Megaphone className="w-4 h-4 text-purple-400" /> },
    { label: 'Queries', path: '/admin/queries', icon: <HelpCircle className="w-4 h-4 text-rose-400" /> },
  ];

  // 2. Department Head Navigation
  const headNav: SidebarItem[] = [
    { label: 'Dashboard', path: '/head/dashboard', icon: <LayoutDashboard className="w-4 h-4 text-emerald-500" /> },
    { label: 'Tasks & Directives', path: '/head/tasks', icon: <CheckSquare className="w-4 h-4 text-teal-400" /> },
    { label: 'Department Leaderboard', path: '/head/department-leaderboard', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    { label: 'Staff Leaderboard', path: '/head/leaderboard', icon: <Medal className="w-4 h-4 text-emerald-400" /> },
    { label: 'Official Reports', path: '/head/events/reports', icon: <FileText className="w-4 h-4 text-amber-400" /> },
    { label: 'Announcements', path: '/head/announcements', icon: <Megaphone className="w-4 h-4 text-purple-400" /> },
    { label: 'Queries', path: '/head/queries', icon: <HelpCircle className="w-4 h-4 text-rose-400" /> },
  ];

  const navItems = user?.role === 'super_admin' ? adminNav : headNav;

  const roleLabel = user?.role === 'super_admin' ? 'VC Office Admin' : 'Department Head';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-2xl h-screen flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:w-64 shadow-2xl lg:shadow-xs ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 sm:px-5 border-b border-[var(--panel-border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0e8a6e] via-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-base shadow-lg shadow-emerald-500/30 border border-white/20">
            GU
          </div>
          <div>
            <div className="font-extrabold text-sm text-[var(--text-primary)] tracking-tight flex items-center gap-1.5">
              GEETA UNIVERSITY
            </div>
            <div className="text-[10px] text-emerald-500 font-bold tracking-wider uppercase">VC OFFICE PORTAL</div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-emerald-500/10 lg:hidden transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => onClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-500 font-bold border border-emerald-500/40 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10 hover:border hover:border-emerald-500/20 hover:translate-x-0.5'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[var(--panel-border)] bg-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{roleLabel}</span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">v1.0 Live</span>
      </div>
    </aside>
  );
};
