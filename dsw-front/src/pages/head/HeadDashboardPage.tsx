import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  Building2, CheckSquare, Trophy, Plus, FileText,
  ArrowUpRight, AlertCircle, Clock, CheckCircle2, ShieldCheck,
  TrendingUp, Sparkles, Upload, Calendar, ChevronRight
} from 'lucide-react';

interface DeptStats {
  id: number;
  name: string;
  code: string;
  category: string;
  points: number;
  faculty_count: number;
  tasks_assigned: number;
  tasks_completed: number;
  completion_rate: number;
}

interface ReportItem {
  id: number;
  event_name: string;
  category?: string;
  status: string;
  review_status?: string;
  review_remarks?: string;
  points_awarded?: number;
  submitted_at?: string;
  created_at: string;
}

export const HeadDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [deptStats, setDeptStats] = useState<DeptStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<ReportItem[]>([]);
  const [reportsCount, setReportsCount] = useState<number>(0);
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);
  const [approvedReportsCount, setApprovedReportsCount] = useState<number>(0);
  const [revisionReportsCount, setRevisionReportsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch departments to find current user's department
      const allDepts = await apiRequest<DeptStats[]>('/departments');
      const myDept = allDepts.find((d) => d.id === user?.department_id || d.name === user?.department);
      if (myDept) {
        setDeptStats(myDept);
      }

      // 2. Fetch tasks for department
      const tasks = await apiRequest<any[]>('/tasks');
      setRecentTasks(tasks.slice(0, 6));

      // 3. Fetch event reports
      try {
        const reports = await apiRequest<ReportItem[]>('/event-reports');
        setRecentReports(reports.slice(0, 5));
        setReportsCount(reports.length);
        setPendingReportsCount(reports.filter(r => r.status === 'submitted' || r.review_status === 'pending_review').length);
        setApprovedReportsCount(reports.filter(r => r.status === 'approved' || r.review_status === 'approved').length);
        setRevisionReportsCount(reports.filter(r => r.status === 'needs_revision' || r.review_status === 'needs_revision').length);
      } catch {
        setRecentReports([]);
        setReportsCount(0);
      }
    } catch (err) {
      console.error('Failed to load head dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--panel-border)] bg-gradient-to-br from-emerald-950/40 via-[var(--panel-bg)] to-teal-950/30 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Department Head Executive Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl">
              Head of <span className="text-emerald-400 font-bold">{deptStats?.name || user?.department || 'Department'}</span> •
              Employee ID: <span className="font-mono text-[var(--text-primary)] font-bold">{user?.employee_id || 'N/A'}</span>
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <Link
              to="/head/events/reports/new"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Submit Official Report
            </Link>
            <Link
              to="/head/tasks"
              className="px-4 py-2.5 rounded-xl bg-[var(--panel-border)] hover:bg-emerald-500/20 text-xs font-bold text-[var(--text-primary)] border border-[var(--panel-border)] transition-all flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4 text-emerald-400" /> View Directives
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold uppercase mb-2">
            <span>Department Points</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {deptStats?.points ?? 0} <span className="text-xs font-semibold text-[var(--text-muted)]">pts</span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Ranked in University Index
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold uppercase mb-2">
            <span>VC Directives</span>
            <CheckSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {deptStats?.tasks_assigned ?? recentTasks.length}
          </div>
          <Link
            to="/head/tasks"
            className="text-[11px] text-emerald-400 hover:underline mt-2 inline-flex items-center gap-1 font-bold"
          >
            Directives Hub <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold uppercase mb-2">
            <span>Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {deptStats?.tasks_completed ?? 0} <span className="text-xs font-semibold text-[var(--text-muted)]">/ {deptStats?.tasks_assigned ?? recentTasks.length}</span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-2">
            Completion Rate: {deptStats?.completion_rate ? deptStats.completion_rate.toFixed(0) : 0}%
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-xl shadow-md">
          <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold uppercase mb-2">
            <span>Official Reports & Reviews</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 flex items-center gap-2">
            {reportsCount}
            {pendingReportsCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                {pendingReportsCount} pending
              </span>
            )}
          </div>
          <Link
            to="/head/events/reports"
            className="text-[11px] text-purple-400 hover:underline mt-2 inline-flex items-center gap-1 font-bold"
          >
            Submissions Hub <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Grid: 1. Official Report Submissions Hub & 2. VC Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Official Report Submissions Hub */}
        <div className="p-6 rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-xl shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
            <div>
              <h3 className="font-extrabold text-base text-[var(--text-primary)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Official Report Submissions & Reviews
              </h3>
              <p className="text-xs text-[var(--text-muted)]">7-page event documentation & VC verification status</p>
            </div>
            <Link
              to="/head/events/reports"
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentReports.map((r) => {
              const isSubmitted = r.status === 'submitted' || r.review_status === 'pending_review';
              const isApproved = r.status === 'approved' || r.review_status === 'approved';
              const isRevision = r.status === 'needs_revision' || r.review_status === 'needs_revision';

              return (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-black/20 border border-[var(--panel-border)] hover:border-emerald-500/30 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text-primary)] line-clamp-1">{r.event_name}</h4>
                      <p className="text-[11px] text-[var(--text-muted)]">{r.category || 'Institutional Event'}</p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      isApproved ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      isSubmitted ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse' :
                      isRevision ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                      'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                    }`}>
                      {isApproved ? '✓ Approved' : isSubmitted ? '⏳ Under VC Review' : isRevision ? '⚠️ Needs Revision' : 'Draft'}
                    </span>
                  </div>

                  {r.review_remarks && (
                    <div className="text-[11px] text-[var(--text-secondary)] italic bg-black/30 p-2 rounded-xl border border-[var(--panel-border)]">
                      VC Feedback: "{r.review_remarks}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--text-muted)]">
                    <span>{r.submitted_at ? `Submitted: ${new Date(r.submitted_at).toLocaleDateString()}` : 'Draft'}</span>
                    <Link
                      to={`/head/events/reports/${r.id}`}
                      className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      {isRevision ? 'Edit & Re-Submit' : 'View Report'} <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {recentReports.length === 0 && (
              <div className="py-10 text-center text-xs text-[var(--text-muted)] space-y-2">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                <p>No reports submitted yet.</p>
                <Link
                  to="/head/events/reports/new"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Submit First Report
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Department VC Directives */}
        <div className="p-6 rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-xl shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
            <div>
              <h3 className="font-extrabold text-base text-[var(--text-primary)] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-400" /> VC Office Task Directives
              </h3>
              <p className="text-xs text-[var(--text-muted)]">Executive deliverables & compliance targets</p>
            </div>
            <Link
              to="/head/tasks"
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-black/20 border border-[var(--panel-border)] hover:border-emerald-500/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.priority === 'urgent' || t.priority === 'high'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {t.priority}
                    </span>
                    <h4 className="font-extrabold text-sm text-[var(--text-primary)] line-clamp-1">{t.title}</h4>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-3">
                    {t.due_date && <span>Due: <b>{new Date(t.due_date).toLocaleDateString()}</b></span>}
                    <span>Reward: <b className="text-emerald-400">+{t.points_reward || 10} pts</b></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                      t.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : t.status === 'submitted'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                    }`}
                  >
                    {t.status}
                  </span>

                  <Link
                    to="/head/tasks"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Deliverable
                  </Link>
                </div>
              </div>
            ))}
            {recentTasks.length === 0 && (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                No active VC directives at the moment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
