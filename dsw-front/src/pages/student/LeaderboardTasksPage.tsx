import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Trophy, Sparkles, Send, CheckCircle2, FileText, X, Clock } from 'lucide-react';
import { TaskProofSubmitter } from '../../components/tasks/TaskProofSubmitter';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import { useAuth } from '../../context/AuthContext';

interface LeaderboardTask {
  id: number;
  title: string;
  description: string;
  points_value: number;
  submission_mode: 'single' | 'multiple';
  start_date?: string;
  due_date?: string;
  my_submission_count: number;
  my_has_submitted: boolean;
}

export const LeaderboardTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<LeaderboardTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [selectedTask, setSelectedTask] = useState<LeaderboardTask | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofName, setProofName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<LeaderboardTask[]>('/leaderboard/students/tasks');
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSubmitting(true);

    try {
      await apiRequest(`/leaderboard/students/tasks/${selectedTask.id}/submit`, 'POST', {
        submission_text: submissionText,
        file_url: proofUrl || undefined
      });

      alert('Proof submitted successfully! Sent to VC Office Admin for point verification.');
      setSelectedTask(null);
      setSubmissionText('');
      setProofUrl('');
      setProofName('');
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Proof submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 border-l-4 border-l-amber-400">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> Student Points Challenges
        </h2>
        <p className="text-xs text-slate-400 mt-1">Complete volunteer duties and student competitions to earn leaderboard points.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-8 text-center text-slate-500 glass-panel">Loading leaderboard challenges...</div>
        ) : tasks.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-slate-500 glass-panel">No active challenges available right now.</div>
        ) : (
          tasks.map(t => {
            const isDisabled = t.submission_mode === 'single' && t.my_has_submitted;

            return (
              <div key={t.id} className="glass-panel p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      +{t.points_value} Points
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Mode: {t.submission_mode === 'single' ? 'Single Submission' : 'Multiple Allowed'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 mt-3">{t.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">{t.description}</p>

                  {/* Challenge Time Limit */}
                  {(t.start_date || t.due_date) && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        <strong>Window:</strong> {t.start_date ? new Date(t.start_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Open'} → <strong className="text-amber-400">{t.due_date ? new Date(t.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No Expiry'}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    Your Submissions: {t.my_submission_count}
                  </span>

                  <button
                    disabled={isDisabled}
                    onClick={() => setSelectedTask(t)}
                    className={`btn-primary text-xs py-1.5 px-3 self-start sm:self-auto ${
                      isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border-none' : ''
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isDisabled ? 'Already Submitted' : 'Submit Challenge Proof'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submission Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-4 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 truncate">
                <Send className="w-5 h-5 text-amber-400 shrink-0" /> <span className="truncate">Submit: {selectedTask.title}</span>
              </h3>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-200 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">Proof Details / Contribution Note</label>
                  <ImproveEnglishButton text={submissionText} onImproved={setSubmissionText} context="Student challenge proof description and contribution details" />
                </div>
                <textarea
                  required
                  rows={3}
                  value={submissionText}
                  onChange={e => setSubmissionText(e.target.value)}
                  placeholder="Explain how you completed this challenge..."
                  className="glass-input"
                />
              </div>

              <TaskProofSubmitter
                valueUrl={proofUrl}
                valueName={proofName}
                onChange={(url, name) => {
                  setProofUrl(url);
                  setProofName(name || '');
                }}
                facultyName={user?.name || 'Student Submission'}
                taskName={selectedTask?.title || 'Challenge Task'}
                disabled={submitting}
              />

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedTask(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Submitting Proof...' : 'Submit to VC Office for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
