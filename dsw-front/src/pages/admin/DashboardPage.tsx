import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import {
  Users, Calendar, CheckSquare, Megaphone, HelpCircle, FileText,
  MessageSquareHeart, Trophy, Activity, TrendingUp, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardSummary {
  total_faculty: number;
  total_students: number;
  total_events: number;
  events_breakdown: Record<string, number>;
  total_tasks: number;
  tasks_breakdown: Record<string, number>;
  total_queries: number;
  queries_breakdown: Record<string, number>;
  total_announcements: number;
  total_dynamic_forms: number;
  total_form_responses: number;
  total_feedback_forms: number;
  total_feedback_responses: number;
  total_student_points_awarded: number;
}

interface AuditLogItem {
  id: number;
  actor_name: string;
  action: string;
  entity_type: string;
  created_at: string;
}

const COLORS = ['#0e8a6e', '#10b981', '#2dd4bf', '#f59e0b'];

export const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, actData] = await Promise.all([
        apiRequest<DashboardSummary>('/dashboard/summary').catch(err => {
          console.error("Summary load error:", err);
          return null;
        }),
        apiRequest<AuditLogItem[]>('/dashboard/activity').catch(err => {
          console.error("Activity load error:", err);
          return [];
        })
      ]);
      if (sumData) setSummary(sumData);
      if (actData) setActivity(actData);
    } catch (err) {
      console.error("Dashboard data load failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-[var(--text-muted)]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading administrative telemetry...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="glass-panel p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Unable to load telemetry summary</h3>
        <p className="text-xs text-[var(--text-muted)]">Check your network connection or server status.</p>
        <button onClick={loadData} className="btn-primary mx-auto">Retry Loading</button>
      </div>
    );
  }

  const taskChartData = [
    { name: 'Pending Review', value: summary.tasks_breakdown.pending || 0 },
    { name: 'In Progress', value: summary.tasks_breakdown.in_progress || 0 },
    { name: 'Approved', value: summary.tasks_breakdown.approved || 0 },
    { name: 'Rejected', value: summary.tasks_breakdown.declined || summary.tasks_breakdown.rejected || 0 },
  ].filter(i => i.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 border-l-4 border-l-emerald-500">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">University Oversight Center</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Live administration status, active tasks, student engagement metrics and grievance feeds.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
          </span>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-[#0e8a6e]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)]">Total Staff / Faculty</p>
              <h3 className="text-2xl font-black text-[var(--text-primary)] mt-1">{summary.total_faculty}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-3">Total registered staff members</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)]">Active Tasks</p>
              <h3 className="text-2xl font-black text-[var(--text-primary)] mt-1">{summary.total_tasks}</h3>
            </div>
            <div className="p-3 bg-teal-500/10 rounded-xl text-teal-500">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
          <div className="flex gap-2 text-[11px] text-[var(--text-muted)] mt-3">
            <span className="text-emerald-500 font-semibold">{summary.tasks_breakdown.approved || 0} approved</span>
            <span>•</span>
            <span className="text-amber-500 font-semibold">{summary.tasks_breakdown.pending || 0} pending</span>
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)]">Grievances / Queries</p>
              <h3 className="text-2xl font-black text-[var(--text-primary)] mt-1">{summary.total_queries}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
              <HelpCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="flex gap-2 text-[11px] text-[var(--text-muted)] mt-3">
            <span className="text-rose-500 font-semibold">{summary.queries_breakdown.open || 0} open</span>
            <span>•</span>
            <span className="text-[var(--text-muted)]">{summary.queries_breakdown.closed || 0} closed</span>
          </div>
        </div>
      </div>

      {/* Second KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold">
              <Calendar className="w-4 h-4 text-purple-500" /> Total Events
            </div>
            <h4 className="text-xl font-bold text-[var(--text-primary)] mt-2">{summary.total_events}</h4>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-500/15 text-purple-600 dark:text-purple-300 rounded-lg">
            {summary.events_breakdown.planned || 0} Planned
          </span>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold">
              <MessageSquareHeart className="w-4 h-4 text-pink-500" /> Feedback Submissions
            </div>
            <h4 className="text-xl font-bold text-[var(--text-primary)] mt-2">{summary.total_feedback_responses}</h4>
          </div>
          <span className="text-xs text-[var(--text-muted)]">Across active feedback forms</span>
        </div>
      </div>

      {/* Main Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Distribution Donut Chart */}
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-500" /> Task Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-[var(--panel-border)] text-xs text-[var(--text-muted)]">
            {taskChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span>{item.name}: <strong className="text-[var(--text-primary)]">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Recent Activity Feed */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
          <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Recent System Activity Feed
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[300px]">
            {activity.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No activity recorded yet.</p>
            ) : (
              activity.map(act => (
                <div key={act.id} className="p-3 bg-[var(--card-bg-to)] rounded-xl border border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] break-words">
                        {act.actor_name} <span className="font-normal text-[var(--text-secondary)]">performed</span> {act.action.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-0.5">Entity: {act.entity_type}</div>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] font-medium shrink-0 self-end sm:self-auto">{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
