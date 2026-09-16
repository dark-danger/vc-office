import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { Medal, CheckCircle2, Clock, XCircle, ShieldCheck } from 'lucide-react';

interface StaffRanking {
  faculty_id: number;
  name: string;
  department: string;
  designation: string;
  total_score: number;
  tasks_approved: number;
  tasks_pending: number;
  tasks_declined: number;
  rank: number;
}

export const StaffLeaderboardPage: React.FC = () => {
  const [rankings, setRankings] = useState<StaffRanking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaffRankings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<StaffRanking[]>('/leaderboard/staff/rankings');
      setRankings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffRankings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Medal className="w-6 h-6 text-emerald-500" /> Automatic Staff Performance Leaderboard
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Calculated strictly as SUM of task performance ledger score deltas (+10 On-time Approval, +5 Late Approval, -3 Decline Penalty, +0 Subtask Bonus).
          </p>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 border-l-4 border-l-emerald-500">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> On-Time Task Approval
          </div>
          <p className="text-sm font-bold text-[var(--text-primary)] mt-1">+10 Points</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Approved before deadline</p>
        </div>

        <div className="glass-card p-4 border-l-4 border-l-amber-500">
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Late Task Approval
          </div>
          <p className="text-sm font-bold text-[var(--text-primary)] mt-1">+5 Points</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Approved after deadline</p>
        </div>

        <div className="glass-card p-4 border-l-4 border-l-rose-500">
          <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <XCircle className="w-4 h-4" /> Declined Task / Subtask
          </div>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">-3 Points Penalty</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Deducted from total points</p>
        </div>

        <div className="glass-card p-4 border-l-4 border-l-teal-500">
          <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Subtask Scopes
          </div>
          <p className="text-sm font-bold text-[var(--text-primary)] mt-1">+0 Extra Points</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Locked to assignee; -3 if declined</p>
        </div>
      </div>

      {/* Staff Rankings Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm text-[var(--text-secondary)]">
            <thead className="bg-[var(--card-bg-to)] text-xs uppercase font-bold text-[var(--text-primary)] border-b border-[var(--panel-border)]">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">Faculty Member</th>
                <th className="p-4">Department & Designation</th>
                <th className="p-4 text-center">Approved Duties</th>
                <th className="p-4 text-center">Pending Duties</th>
                <th className="p-4 text-center">Declined Duties</th>
                <th className="p-4 text-right">Performance Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--panel-border)]">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">Loading staff performance ledger...</td></tr>
              ) : rankings.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">No staff members found.</td></tr>
              ) : (
                rankings.map(r => (
                  <tr key={r.faculty_id} className="hover:bg-emerald-500/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {r.rank === 1 ? (
                          <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-lg shadow-emerald-500/30">1</span>
                        ) : r.rank === 2 ? (
                          <span className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-950 dark:text-white font-black flex items-center justify-center text-xs">2</span>
                        ) : r.rank === 3 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-black flex items-center justify-center text-xs">3</span>
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-[var(--text-secondary)] font-bold flex items-center justify-center text-xs">#{r.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-[var(--text-primary)]">{r.name}</td>
                    <td className="p-4 text-xs">
                      <div className="text-[var(--text-primary)] font-medium">{r.department}</div>
                      <div className="text-[var(--text-muted)]">{r.designation}</div>
                    </td>
                    <td className="p-4 text-center font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{r.tasks_approved}</td>
                    <td className="p-4 text-center font-mono text-xs text-amber-600 dark:text-amber-400 font-semibold">{r.tasks_pending}</td>
                    <td className="p-4 text-center font-mono text-xs text-rose-600 dark:text-rose-400 font-semibold">{r.tasks_declined}</td>
                    <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">{r.total_score} pts</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
