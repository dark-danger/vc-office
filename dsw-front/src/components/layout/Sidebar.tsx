import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, CheckSquare, Megaphone,
  HelpCircle, FileText, MessageSquareHeart, Medal,
  X, ClipboardCheck
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

  const adminNav: SidebarItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Requests', path: '/admin/requests', icon: <ClipboardCheck className="w-4 h-4 text-amber-400" /> },
    { label: 'Faculty Management', path: '/admin/faculty', icon: <Users className="w-4 h-4" /> },
    { label: 'Events & Calendar', path: '/admin/events', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Official Event Reports', path: '/admin/events/reports', icon: <FileText className="w-4 h-4 text-amber-400" /> },
    { label: 'Task Assignment', path: '/admin/tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'Announcements', path: '/admin/announcements', icon: <Megaphone className="w-4 h-4" /> },
    { label: 'Query Inbox', path: '/admin/queries', icon: <HelpCircle className="w-4 h-4" /> },
    { label: 'Feedback Forms', path: '/admin/feedback', icon: <MessageSquareHeart className="w-4 h-4" /> },
    { label: 'Staff Leaderboard', path: '/admin/leaderboard/staff', icon: <Medal className="w-4 h-4 text-emerald-400" /> },
  ];

  const facultyNav: SidebarItem[] = [
    { label: 'My Dashboard', path: '/faculty/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Official Event Reports', path: '/faculty/events/reports', icon: <FileText className="w-4 h-4 text-amber-400" /> },
    { label: 'My Assigned Tasks', path: '/faculty/tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'Announcements', path: '/faculty/announcements', icon: <Megaphone className="w-4 h-4" /> },
    { label: 'Raise Query', path: '/faculty/queries', icon: <HelpCircle className="w-4 h-4" /> },
    { label: 'Staff Leaderboard', path: '/faculty/leaderboard', icon: <Medal className="w-4 h-4 text-emerald-400" /> },
  ];

  const navItems = user?.role === 'super_admin' ? adminNav : facultyNav;

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
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] capitalize">{user?.role?.replace('_', ' ')}</span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">v1.0 Live</span>
      </div>
    </aside>
  );
};
