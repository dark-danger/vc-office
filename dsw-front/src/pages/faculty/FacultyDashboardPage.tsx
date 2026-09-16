import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { CheckSquare, Medal, Clock, CheckCircle2, Megaphone, HelpCircle, FileText, ArrowRight, FileCheck, Award } from 'lucide-react';

interface FacultyStats {
  faculty_id: number;
  faculty_name: string;
  total_assigned: number;
  completed_approved: number;
  pending_count: number;
  declined_count: number;
  completion_rate_percentage: number;
  performance_score: number;
}

export const FacultyDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      try {
        const data = await apiRequest<FacultyStats>(`/users/faculty/${user.id}/stats`);
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  if (loading || !stats) {
    return <div className="p-8 text-center text-slate-400">Loading faculty dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back, {user?.name}!</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Department: {user?.department || 'VC Office'} • Designation: {user?.designation || 'Faculty'}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-[#0e8a6e]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Total Duties Assigned</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.total_assigned}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Approved Duties</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed_approved}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Pending Duties</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending_count}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">My Performance Score</p>
              <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-300 mt-1">{stats.performance_score} pts</h3>
            </div>
            <div className="p-3 bg-teal-500/10 rounded-xl text-teal-600 dark:text-teal-400">
              <Medal className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div className="glass-panel p-6 space-y-2">
        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
          <span>Overall Duty Completion Percentage</span>
          <span className="font-semibold text-[var(--text-primary)]">{stats.completion_rate_percentage}%</span>
        </div>
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 border border-[var(--panel-border)] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0e8a6e] to-emerald-400 rounded-full" style={{ width: `${stats.completion_rate_percentage}%` }} />
        </div>
      </div>

      {/* Faculty Action Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/faculty/tasks" className="glass-card p-5 space-y-2 group hover:border-emerald-500/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Manage Assigned Tasks
            </span>
            <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Submit completion reports and upload proof documents for VC Office review.</p>
        </Link>

        <Link to="/faculty/duty-charts" className="glass-card p-5 space-y-2 group hover:border-teal-500/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Event Duty Charts
            </span>
            <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-teal-500 transition-colors" />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">View official campus event duty rosters and download printable PDF charts.</p>
        </Link>

        <Link to="/faculty/committees" className="glass-card p-5 space-y-2 group hover:border-emerald-500/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Core Committees
            </span>
            <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Oversee student convenors and event core organizing teams.</p>
        </Link>
      </div>
    </div>
  );
};
