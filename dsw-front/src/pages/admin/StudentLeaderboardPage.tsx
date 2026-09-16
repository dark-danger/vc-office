import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth, User } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import { ProofViewer } from '../../components/tasks/ProofViewer';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  Trophy, Plus, Award, CheckCircle2, XCircle, FileText,
  User as UserIcon, Medal, Sparkles, X, PlusCircle, MinusCircle, Clock
} from 'lucide-react';

interface LeaderboardTask {
  id: number;
  title: string;
  description: string;
  points_value: number;
  submission_mode: 'single' | 'multiple';
  start_date?: string;
  due_date?: string;
  is_active: boolean;
  created_at: string;
}

interface StudentSubmission {
  id: number;
  leaderboard_task_id: number;
  task_title?: string;
  student_id: number;
  student?: User;
  submission_text: string;
  file_url?: string;
  submitted_at: string;
  status: string;
}

interface StudentRanking {
  student_id: number;
  name: string;
  roll_number?: string;
  course_branch?: string;
  year?: string;
  total_points: number;
  task_points: number;
  manual_points: number;
  rank: number;
}

export const StudentLeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin';
  const [rankings, setRankings] = useState<StudentRanking[]>([]);
  const [tasks, setTasks] = useState<LeaderboardTask[]>([]);
  const [pendingSubs, setPendingSubs] = useState<StudentSubmission[]>([]);
  const [studentsList, setStudentsList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Task Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsValue, setPointsValue] = useState(20);
  const [submissionMode, setSubmissionMode] = useState<'single' | 'multiple'>('single');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Manual Points Form
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [manualPoints, setManualPoints] = useState(15);
  const [reasonNote, setReasonNote] = useState('');

  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [rankData, taskData, subData, stuData] = await Promise.all([
          apiRequest<StudentRanking[]>('/leaderboard/students/rankings'),
          apiRequest<LeaderboardTask[]>('/leaderboard/students/tasks'),
          apiRequest<StudentSubmission[]>('/leaderboard/students/submissions/pending'),
          apiRequest<User[]>('/users/students')
        ]);
        setRankings(rankData);
        setTasks(taskData);
        setPendingSubs(subData);
        setStudentsList(stuData);
      } else {
        const rankData = await apiRequest<StudentRanking[]>('/leaderboard/students/rankings');
        setRankings(rankData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, [user]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/leaderboard/students/tasks', 'POST', {
        title,
        description,
        points_value: Number(pointsValue),
        submission_mode: submissionMode,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
      setIsTaskModalOpen(false);
      setTitle('');
      setDescription('');
      setStartDate('');
      setDueDate('');
      fetchLeaderboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleManualPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return alert('Select a student');
    try {
      await apiRequest('/leaderboard/students/points/manual-award', 'POST', {
        student_id: Number(selectedStudentId),
        points: Number(manualPoints),
        reason_note: reasonNote
      });
      setIsManualModalOpen(false);
      setReasonNote('');
      triggerConfetti();
      fetchLeaderboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update student points');
    }
  };

  const handleApproveSub = async (subId: number) => {
    try {
      await apiRequest(`/leaderboard/students/submissions/${subId}/approve`, 'POST');
      triggerConfetti();
      fetchLeaderboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve proof');
    }
  };

  const handleRejectSub = async (subId: number) => {
    try {
      await apiRequest(`/leaderboard/students/submissions/${subId}/reject`, 'POST');
      fetchLeaderboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject proof');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Student Leaderboard & Rankings
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isAdmin ? 'Create single/multiple submission challenges, review proof queues, and issue manual bonus/penalty points.' : 'Live student rankings calculated strictly from challenge task points and welfare achievements.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setIsManualModalOpen(true)} className="btn-secondary text-xs">
              <Sparkles className="w-4 h-4 text-amber-500" /> Manual Point Adjuster Tool
            </button>
            <button onClick={() => setIsTaskModalOpen(true)} className="btn-primary text-xs">
              <Plus className="w-4 h-4" /> Create Challenge Task
            </button>
          </div>
        )}
      </div>

      {/* Pending Proof Submissions Queue (Admin Only) */}
      {isAdmin && pendingSubs.length > 0 && (
        <div className="glass-panel p-6 border-l-4 border-l-amber-500 space-y-4">
          <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Pending Student Proof Submissions ({pendingSubs.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingSubs.map(sub => (
              <div key={sub.id} className="p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-2.5">
                <div className="flex justify-between items-start text-xs">
                  <span className="font-bold text-[var(--text-primary)]">{sub.task_title || 'Leaderboard Task'}</span>
                  <span className="text-[var(--text-muted)]">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] font-medium">
                  Student: <strong className="text-[var(--text-primary)]">{sub.student?.name}</strong> ({sub.student?.roll_number || 'N/A'})
                </div>
                <p className="text-xs text-[var(--text-muted)] italic">"{sub.submission_text}"</p>
                
                {/* Proof Viewer Component */}
                {sub.file_url && (
                  <div className="pt-1">
                    <ProofViewer url={sub.file_url} />
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-[var(--panel-border)]">
                  <button onClick={() => handleRejectSub(sub.id)} className="btn-crimson text-xs py-1 px-3">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button onClick={() => handleApproveSub(sub.id)} className="btn-primary text-xs py-1 px-3">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Award Points
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 bg-[var(--card-bg-to)] border-b border-[var(--panel-border)] flex items-center justify-between">
          <h3 className="font-bold text-[var(--text-primary)] text-sm">Official Student Rankings Ledger</h3>
          <span className="text-xs text-[var(--text-muted)]">Calculated strictly as SUM of points</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm text-[var(--text-secondary)]">
            <thead className="bg-[var(--card-bg-to)] text-xs uppercase font-bold text-[var(--text-primary)] border-b border-[var(--panel-border)]">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Roll Number</th>
                <th className="p-4">Course / Branch</th>
                <th className="p-4 text-center">Task Points</th>
                <th className="p-4 text-center">Manual Points</th>
                <th className="p-4 text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--panel-border)]">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">Loading student rankings...</td></tr>
              ) : rankings.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">No points recorded on leaderboard.</td></tr>
              ) : (
                rankings.map(r => (
                  <tr key={r.student_id} className="hover:bg-emerald-500/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {r.rank === 1 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-lg shadow-amber-400/30">1</span>
                        ) : r.rank === 2 ? (
                          <span className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-950 dark:text-white font-black flex items-center justify-center text-xs">2</span>
                        ) : r.rank === 3 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-xs">3</span>
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-[var(--text-secondary)] font-bold flex items-center justify-center text-xs">#{r.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-[var(--text-primary)]">{r.name}</td>
                    <td className="p-4 font-mono text-xs text-amber-600 dark:text-amber-400 font-bold">{r.roll_number || 'N/A'}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{r.course_branch || 'N/A'}</td>
                    <td className="p-4 text-center font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">{r.task_points}</td>
                    <td className="p-4 text-center font-mono text-xs text-purple-600 dark:text-purple-400 font-semibold">{r.manual_points}</td>
                    <td className="p-4 text-right font-black text-amber-600 dark:text-amber-400 text-base">{r.total_points} pts</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Create Student Leaderboard Task
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Challenge Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Blood Drive Volunteer" className="glass-input" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Challenge Instructions</label>
                  <ImproveEnglishButton text={description} onImproved={setDescription} context="Student leaderboard challenge guidelines and instructions" />
                </div>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Participation requirements..." className="glass-input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Points Reward</label>
                  <input required type="number" value={pointsValue} onChange={e => setPointsValue(Number(e.target.value))} className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Submission Mode</label>
                  <select value={submissionMode} onChange={e => setSubmissionMode(e.target.value as any)} className="glass-input">
                    <option value="single">Single Submission Only</option>
                    <option value="multiple">Multiple / Recurring Allowed</option>
                  </select>
                </div>
              </div>

              {/* Challenge Time Limit / Window */}
              <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Challenge Time Window (Kab Se Kab Tak)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Start Time (Kab Se)
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Deadline / Due Time (Kab Tak)
                    </label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="glass-input text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Publish Challenge</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Point Adjuster Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Manual Student Point Adjuster
              </h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualPoints} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Select Student</label>
                <select required value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')} className="glass-input">
                  <option value="">-- Select Student --</option>
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Points Delta (+ or -)</label>
                <input required type="number" value={manualPoints} onChange={e => setManualPoints(Number(e.target.value))} className="glass-input" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Reason Note</label>
                  <ImproveEnglishButton text={reasonNote} onImproved={setReasonNote} context="Reason and citation for manual student points award" />
                </div>
                <input required type="text" value={reasonNote} onChange={e => setReasonNote(e.target.value)} placeholder="e.g. Winner of Campus Hackathon" className="glass-input" />
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setIsManualModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Update Points</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
