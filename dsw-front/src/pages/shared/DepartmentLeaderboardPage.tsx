import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import {
  Trophy, Medal, Award, Building2, TrendingUp, CheckCircle2,
  Users, Layers, ArrowUpRight, Search, ShieldCheck
} from 'lucide-react';

interface DepartmentLeaderboardItem {
  id: number;
  name: string;
  code: string;
  category: string;
  points: number;
  head_name: string | null;
  head_email: string | null;
  faculty_count: number;
  tasks_assigned: number;
  tasks_completed: number;
  completion_rate: number;
  rank: number;
}

export const DepartmentLeaderboardPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'academic' | 'non_teaching'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<DepartmentLeaderboardItem[]>('/departments/leaderboard');
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load department leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepts = departments
    .filter((d) => {
      if (filterCategory === 'academic') return d.category === 'academic';
      if (filterCategory === 'non_teaching') return d.category === 'non_teaching';
      return true;
    })
    .filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.head_name && d.head_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const topThree = filteredDepts.slice(0, 3);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/30 text-base border border-amber-200">
            🥇
          </div>
        );
      case 2:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-slate-400/30 text-base border border-slate-200">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black flex items-center justify-center shadow-lg shadow-amber-800/30 text-base border border-amber-600">
            🥉
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-[var(--panel-border)] text-[var(--text-secondary)] font-bold flex items-center justify-center text-xs">
            #{rank}
          </div>
        );
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
              <Trophy className="w-3.5 h-3.5" /> University Performance Index
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              Department Governance & Point Leaderboard
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl">
              Real-time rankings across all 15 university academic and non-teaching departments based on task fulfillment, faculty output, and VC Office approvals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLeaderboard}
              className="px-4 py-2.5 rounded-xl bg-[var(--panel-border)] hover:bg-emerald-500/20 text-xs font-bold text-[var(--text-primary)] border border-[var(--panel-border)] transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Refresh Ranks
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="mt-8 pt-6 border-t border-[var(--panel-border)]/60 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center p-1 rounded-xl bg-black/20 border border-[var(--panel-border)] w-full sm:w-auto">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterCategory === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Departments ({departments.length})
            </button>
            <button
              onClick={() => setFilterCategory('academic')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterCategory === 'academic'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Academic (10)
            </button>
            <button
              onClick={() => setFilterCategory('non_teaching')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterCategory === 'non_teaching'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Non-Teaching (5)
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search department or HOD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
          <p className="text-xs text-[var(--text-secondary)]">Aggregating department analytics & scores...</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards (when viewing all or first 3) */}
          {topThree.length >= 3 && !searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {topThree.map((dept, idx) => {
                const rankOrder = idx === 0 ? 1 : idx === 1 ? 2 : 3;
                const borderGlow =
                  rankOrder === 1
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : rankOrder === 2
                    ? 'border-slate-400/40 bg-slate-400/5'
                    : 'border-amber-700/40 bg-amber-700/5';

                return (
                  <div
                    key={dept.id}
                    className={`rounded-2xl border ${borderGlow} p-5 backdrop-blur-md relative overflow-hidden transition-transform hover:-translate-y-1`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      {getRankBadge(rankOrder)}
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/30 border border-[var(--panel-border)] text-[var(--text-secondary)]">
                        {dept.category === 'academic' ? 'Academic' : 'Non-Teaching'}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-[var(--text-primary)] tracking-tight">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      HOD: {dept.head_name || <span className="italic">Not Assigned</span>}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[var(--panel-border)] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Total Points</div>
                        <div className="text-xl font-black text-emerald-400">{dept.points} pts</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Completion</div>
                        <div className="text-sm font-extrabold text-[var(--text-primary)]">
                          {dept.completion_rate.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--panel-border)] bg-black/20 text-[var(--text-muted)] uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-4 text-center w-16">Rank</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Head of Department</th>
                    <th className="py-3.5 px-4 text-center">Faculty</th>
                    <th className="py-3.5 px-4 text-center">Tasks Done / Total</th>
                    <th className="py-3.5 px-4 text-center">Rate</th>
                    <th className="py-3.5 px-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--panel-border)]/50">
                  {filteredDepts.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-emerald-500/5 transition-colors group"
                    >
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {getRankBadge(d.rank)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                          {d.name}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)]">{d.code}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            d.category === 'academic'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {d.category === 'academic' ? 'Academic' : 'Non-Teaching'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {d.head_name ? (
                          <div>
                            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              {d.head_name}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">{d.head_email}</div>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] italic text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1 text-[var(--text-secondary)] font-semibold">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> {d.faculty_count}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-emerald-400">{d.tasks_completed}</span>
                        <span className="text-[var(--text-muted)]"> / {d.tasks_assigned}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-black/40 h-1.5 rounded-full overflow-hidden border border-[var(--panel-border)]">
                            <div
                              className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, d.completion_rate)}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-[var(--text-primary)]">
                            {d.completion_rate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-black text-sm text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                          {d.points} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredDepts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">
                        No departments found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
