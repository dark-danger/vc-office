import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import {
  CheckSquare, Plus, FileText, CheckCircle2, XCircle, AlertCircle, Clock,
  Send, X, Sparkles, FolderGit2, Calendar, Award, Filter, RefreshCw,
  CornerDownRight, ListTree, PlusCircle, Lock
} from 'lucide-react';
import { TaskProofSubmitter } from '../../components/tasks/TaskProofSubmitter';
import { ProofViewer } from '../../components/tasks/ProofViewer';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import { useAuth } from '../../context/AuthContext';

interface TaskSubmission {
  id: number;
  description: string;
  file_url?: string;
  file_name?: string;
  submitted_at: string;
  review_status: string;
  review_remarks?: string;
}

interface TaskItem {
  id: number;
  title: string;
  description: string;
  task_type: string;
  event_id?: number;
  event_title?: string;
  parent_task_id?: number;
  assigned_to: number;
  assigned_by: number;
  start_date?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'declined';
  created_at: string;
  submissions: TaskSubmission[];
  subtasks?: TaskItem[];
}

interface EventItem {
  id: number;
  title: string;
  venue?: string;
}

interface SelfCreateLimitInfo {
  can_create: boolean;
  seconds_remaining: number;
  next_allowed_at: string | null;
  time_remaining_str: string | null;
  last_task_id?: number;
  last_task_title?: string;
  message: string;
}

export const MyTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [selfCreateLimit, setSelfCreateLimit] = useState<SelfCreateLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState<'all' | 'assigned' | 'self_created' | 'pending' | 'approved'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Submit Duty Modal
  const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<TaskItem | null>(null);
  const [submitDescription, setSubmitDescription] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofName, setProofName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Create Subtask Modal
  const [selectedParentTaskForSubtask, setSelectedParentTaskForSubtask] = useState<TaskItem | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDescription, setSubtaskDescription] = useState('');
  const [subtaskDueDate, setSubtaskDueDate] = useState('');
  const [subtaskPriority, setSubtaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [subtaskCreating, setSubtaskCreating] = useState(false);

  // Create Self-Task Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newEventId, setNewEventId] = useState<number | ''>('');
  const [newProofUrl, setNewProofUrl] = useState('');
  const [newProofName, setNewProofName] = useState('');
  const [creating, setCreating] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchMyTasksData = async () => {
    setLoading(true);
    try {
      const [tasksData, eventsData, limitData] = await Promise.all([
        apiRequest<TaskItem[]>('/tasks/mine'),
        apiRequest<EventItem[]>('/events').catch(() => []),
        apiRequest<SelfCreateLimitInfo>('/tasks/self-create-limit').catch(() => null)
      ]);
      setTasks(tasksData);
      setEventsList(eventsData);
      if (limitData) setSelfCreateLimit(limitData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasksData();
  }, []);

  // Handle Faculty creating their own task
  const handleCreateSelfTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return alert('Please enter a task title');
    if (selfCreateLimit && !selfCreateLimit.can_create) {
      return alert(`Daily Limit Policy: You can only propose 1 self-created task every 24 hours. Next proposal available in ${selfCreateLimit.time_remaining_str || 'a few hours'}.`);
    }
    setCreating(true);

    try {
      const created = await apiRequest<TaskItem>('/tasks', 'POST', {
        title: newTitle.trim(),
        description: newDescription.trim(),
        task_type: newEventId ? 'event_linked' : 'self_created',
        event_id: newEventId ? Number(newEventId) : null,
        priority: newPriority,
        start_date: newStartDate ? new Date(newStartDate).toISOString() : null,
        due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
        file_url: newProofUrl || undefined,
        file_name: newProofName || undefined,
      });

      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewStartDate('');
      setNewDueDate('');
      setNewEventId('');
      setNewProofUrl('');
      setNewProofName('');
      setNewPriority('medium');

      setTasks(prev => [created, ...prev]);
      fetchMyTasksData();
      showToast('🎉 Your task has been submitted to VC Office Admin for approval! (+10 pts upon approval)');
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
      fetchMyTasksData();
    } finally {
      setCreating(false);
    }
  };

  // Handle Faculty creating subtask under their task
  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentTaskForSubtask) return;
    if (!subtaskTitle.trim()) return alert('Please enter a subtask title');
    setSubtaskCreating(true);

    try {
      await apiRequest('/tasks', 'POST', {
        title: subtaskTitle.trim(),
        description: subtaskDescription.trim(),
        parent_task_id: selectedParentTaskForSubtask.id,
        task_type: 'subtask',
        priority: subtaskPriority,
        due_date: subtaskDueDate ? new Date(subtaskDueDate).toISOString() : null,
      });

      setSelectedParentTaskForSubtask(null);
      setSubtaskTitle('');
      setSubtaskDescription('');
      setSubtaskDueDate('');
      setSubtaskPriority('medium');

      fetchMyTasksData();
      showToast('Subtask added successfully! (+0 pts upon approval, -3 pts if declined)');
    } catch (err: any) {
      alert(err.message || 'Failed to create subtask');
    } finally {
      setSubtaskCreating(false);
    }
  };

  // Handle Duty Submission / Resubmission
  const handleSubmitDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForSubmit) return;
    setSubmitting(true);

    try {
      await apiRequest(`/tasks/${selectedTaskForSubmit.id}/submit`, 'POST', {
        description: submitDescription.trim(),
        file_url: proofUrl || undefined,
        file_name: proofName || undefined,
      });

      setSelectedTaskForSubmit(null);
      setSubmitDescription('');
      setProofUrl('');
      setProofName('');
      fetchMyTasksData();
      showToast('Duty completion report submitted to VC Office Admin for review.');
    } catch (err: any) {
      alert(err.message || 'Task submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Tasks
  const filteredTasks = tasks.filter(t => {
    const isSelfCreated = t.assigned_by === t.assigned_to || t.task_type === 'self_created';

    if (tabFilter === 'assigned') {
      return !isSelfCreated;
    }
    if (tabFilter === 'self_created') {
      return isSelfCreated;
    }
    if (tabFilter === 'pending') {
      return t.status === 'submitted' || t.status === 'pending' || t.status === 'in_progress';
    }
    if (tabFilter === 'approved') {
      return t.status === 'approved';
    }
    return true;
  });

  const selfCreatedCount = tasks.filter(t => t.assigned_by === t.assigned_to || t.task_type === 'self_created').length;
  const assignedCount = tasks.filter(t => t.assigned_by !== t.assigned_to && t.task_type !== 'self_created').length;
  const approvedCount = tasks.filter(t => t.status === 'approved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              Faculty Duty & Task Workspace
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              My Duties & Self-Created Tasks
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              Track assigned administrative duties and create your own tasks with proof attachments. Each approved task grants <strong className="text-emerald-600 dark:text-emerald-400">+10 points</strong> on the Staff Performance Leaderboard.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchMyTasksData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[var(--card-bg-to)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-500 border border-[var(--panel-border)] transition-all active:scale-95"
              title="Refresh duties"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {selfCreateLimit && !selfCreateLimit.can_create ? (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="p-2.5 sm:py-2.5 sm:px-4 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-2 text-xs font-bold transition-all shadow-sm hover:bg-amber-500/20 active:scale-95"
                title={`Daily Limit: 1 task proposal per 24 hours. Next available in ${selfCreateLimit.time_remaining_str}`}
              >
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>1 Task/24h Limit ({selfCreateLimit.time_remaining_str})</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 font-bold shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create My Task / Propose Duty</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-[var(--panel-border)]">
          <div className="p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-xl">
            <span className="text-[11px] font-bold text-[var(--text-muted)]">Total Tasks</span>
            <div className="text-xl font-black text-[var(--text-primary)] font-mono">{tasks.length}</div>
          </div>
          <div className="p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-xl">
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Self-Created
            </span>
            <div className="text-xl font-black text-[var(--text-primary)] font-mono">{selfCreatedCount}</div>
          </div>
          <div className="p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-xl">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Assigned by Admin</span>
            <div className="text-xl font-black text-[var(--text-primary)] font-mono">{assignedCount}</div>
          </div>
          <div className="p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-xl">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Approved (+Pts)</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{approvedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-2xl overflow-x-auto">
        <button
          onClick={() => setTabFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            tabFilter === 'all'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          All Duties ({tasks.length})
        </button>
        <button
          onClick={() => setTabFilter('self_created')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
            tabFilter === 'self_created'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-3 h-3" /> My Self-Created ({selfCreatedCount})
        </button>
        <button
          onClick={() => setTabFilter('assigned')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            tabFilter === 'assigned'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Assigned by Admin ({assignedCount})
        </button>
        <button
          onClick={() => setTabFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            tabFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Awaiting Approval / In Progress
        </button>
        <button
          onClick={() => setTabFilter('approved')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            tabFilter === 'approved'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Approved ({approvedCount})
        </button>
      </div>

      {/* Task Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center glass-panel space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">Loading your duties...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center glass-panel space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">No tasks found</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              {tabFilter === 'self_created'
                ? "You haven't created any self-proposed tasks yet. Click '+ Create My Task' above to add one."
                : "You have no tasks matching this filter at the moment."}
            </p>
            {tabFilter === 'self_created' && (
              selfCreateLimit && !selfCreateLimit.can_create ? (
                <div className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-xl font-medium mt-2">
                  <Clock className="w-3.5 h-3.5" /> Next self-created duty proposal available in {selfCreateLimit.time_remaining_str}
                </div>
              ) : (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mt-2"
                >
                  <Plus className="w-4 h-4" /> Create First Task
                </button>
              )
            )}
          </div>
        ) : (
          filteredTasks.map(t => {
            const isSelfCreated = t.assigned_by === t.assigned_to || t.task_type === 'self_created';
            const latestSub = t.submissions && t.submissions.length > 0 ? t.submissions[t.submissions.length - 1] : null;

            return (
              <div
                key={t.id}
                className={`glass-panel p-5 sm:p-6 space-y-3.5 relative transition-all duration-200 border-l-4 ${
                  t.status === 'declined'
                    ? 'border-l-rose-500 bg-rose-500/[0.02]'
                    : t.status === 'approved'
                    ? 'border-l-emerald-500 bg-emerald-500/[0.02]'
                    : isSelfCreated
                    ? 'border-l-purple-500 bg-purple-500/[0.02]'
                    : 'border-l-blue-500 bg-blue-500/[0.02]'
                }`}
              >
                {/* Header Chips */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isSelfCreated ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        <Sparkles className="w-3 h-3" /> Self-Created Task
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                        Assigned by VC Office Admin
                      </span>
                    )}

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      t.priority === 'high'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        : t.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                    }`}>
                      {t.priority}
                    </span>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                    t.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                      : t.status === 'submitted'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                      : t.status === 'declined'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40'
                      : 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30'
                  }`}>
                    {t.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {t.status === 'declined' && <XCircle className="w-3.5 h-3.5" />}
                    {t.status === 'submitted' && <Clock className="w-3.5 h-3.5" />}
                    {t.status === 'approved'
                      ? 'Approved (+10 pts)'
                      : t.status === 'submitted'
                      ? 'Awaiting Admin Approval'
                      : t.status === 'declined'
                      ? 'Declined (Needs Correction)'
                      : 'In Progress'}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{t.title}</h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed whitespace-pre-line">
                    {t.description || 'No description provided.'}
                  </p>
                </div>

                {/* Time Window & Event Metadata */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(t.start_date || t.due_date) && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-400/20 text-xs font-medium text-blue-700 dark:text-blue-300">
                      <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>
                        <strong>Duty Window:</strong> {t.start_date ? new Date(t.start_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Immediate'} → <strong className="text-amber-600 dark:text-amber-400">{t.due_date ? new Date(t.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Open Deadline'}</strong>
                      </span>
                    </div>
                  )}

                  {t.event_title && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-400/20 text-xs font-semibold text-purple-700 dark:text-purple-300">
                      <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      Event: {t.event_title}
                    </div>
                  )}
                </div>

                {/* Proof File Attachment Viewer */}
                {latestSub?.file_url && (
                  <div className="p-3.5 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        Uploaded Task Proof / Proposal
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {latestSub.file_name || 'Proof Attached'}
                      </span>
                    </div>
                    <ProofViewer url={latestSub.file_url} fileName={latestSub.file_name} />
                  </div>
                )}

                {/* Decline Remarks Alert */}
                {t.status === 'declined' && latestSub?.review_remarks && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs space-y-1">
                    <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Decline Remarks from VC Office Admin:
                    </div>
                    <p className="text-[var(--text-primary)] leading-relaxed">{latestSub.review_remarks}</p>
                  </div>
                )}

                {/* Subtasks Section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <ListTree className="w-4 h-4 text-emerald-500" />
                      Subtasks {t.subtasks && t.subtasks.length > 0 ? `(${t.subtasks.length})` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParentTaskForSubtask(t);
                        setSubtaskTitle('');
                        setSubtaskDescription('');
                        setSubtaskDueDate(t.due_date ? t.due_date.slice(0, 16) : '');
                        setSubtaskPriority(t.priority || 'medium');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Subtask
                    </button>
                  </div>

                  {t.subtasks && t.subtasks.length > 0 && (
                    <div className="space-y-2.5 pl-2 sm:pl-4 border-l-2 border-emerald-500/30 mt-2">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200">
                        ⚡ <strong>Subtask Rule:</strong> Strictly assigned to you under this task. Earns <strong>+0 extra points</strong> on approval, but <strong>-3 points</strong> will be deducted if declined.
                      </div>

                      {t.subtasks.map(st => {
                        const stLatestSub = st.submissions && st.submissions.length > 0 ? st.submissions[st.submissions.length - 1] : null;
                        return (
                          <div
                            key={st.id}
                            className={`p-3.5 rounded-2xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] space-y-2 transition-all ${
                              st.status === 'declined'
                                ? 'border-rose-500/40 bg-rose-500/[0.03]'
                                : st.status === 'approved'
                                ? 'border-emerald-500/40 bg-emerald-500/[0.03]'
                                : ''
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <CornerDownRight className="w-4 h-4 text-emerald-500 shrink-0" />
                                <h5 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">{st.title}</h5>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-500/20 text-slate-700 dark:text-slate-300">
                                  {st.priority}
                                </span>
                              </div>

                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                                st.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                  : st.status === 'submitted'
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                  : st.status === 'declined'
                                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                  : 'bg-slate-500/20 text-slate-700 dark:text-slate-300'
                              }`}>
                                {st.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                                {st.status === 'declined' && <XCircle className="w-3 h-3" />}
                                {st.status === 'submitted' && <Clock className="w-3 h-3" />}
                                {st.status === 'approved'
                                  ? 'Approved (+0 pts)'
                                  : st.status === 'submitted'
                                  ? 'Awaiting Review'
                                  : st.status === 'declined'
                                  ? 'Declined (-3 pts)'
                                  : 'In Progress'}
                              </span>
                            </div>

                            {st.description && (
                              <p className="text-xs text-[var(--text-secondary)] pl-6 whitespace-pre-line leading-relaxed">
                                {st.description}
                              </p>
                            )}

                            {/* Subtask Due Date */}
                            {st.due_date && (
                              <div className="text-[11px] text-[var(--text-muted)] pl-6 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Due: {new Date(st.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </div>
                            )}

                            {/* Subtask Proof Viewer */}
                            {stLatestSub?.file_url && (
                              <div className="ml-6 p-2.5 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-xl space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                    Subtask Proof
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                    {stLatestSub.file_name || 'Proof Attached'}
                                  </span>
                                </div>
                                <ProofViewer url={stLatestSub.file_url} fileName={stLatestSub.file_name} />
                              </div>
                            )}

                            {/* Decline Remarks */}
                            {st.status === 'declined' && stLatestSub?.review_remarks && (
                              <div className="ml-6 p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs space-y-0.5">
                                <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> Decline Remarks (-3 pts deducted):
                                </div>
                                <p className="text-[var(--text-primary)]">{stLatestSub.review_remarks}</p>
                              </div>
                            )}

                            {/* Subtask Action Button */}
                            {st.status !== 'approved' && (
                              <div className="pl-6 pt-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTaskForSubmit(st);
                                    setSubmitDescription(stLatestSub?.description || '');
                                    setProofUrl(stLatestSub?.file_url || '');
                                    setProofName(stLatestSub?.file_name || '');
                                  }}
                                  className="btn-primary text-[11px] py-1 px-3 flex items-center gap-1 font-bold shadow-xs active:scale-95"
                                >
                                  <Send className="w-3 h-3" />
                                  {st.status === 'declined'
                                    ? 'Resubmit Subtask'
                                    : st.status === 'submitted'
                                    ? 'Update Subtask Proof'
                                    : 'Submit Subtask Completion'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-[var(--panel-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Main Task Reward: <strong>+10 Leaderboard Points</strong> upon approval</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParentTaskForSubtask(t);
                        setSubtaskTitle('');
                        setSubtaskDescription('');
                        setSubtaskDueDate(t.due_date ? t.due_date.slice(0, 16) : '');
                        setSubtaskPriority(t.priority || 'medium');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Add Subtask
                    </button>

                    {t.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTaskForSubmit(t);
                          setSubmitDescription(latestSub?.description || '');
                          setProofUrl(latestSub?.file_url || '');
                          setProofName(latestSub?.file_name || '');
                        }}
                        className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold shadow-md active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {t.status === 'declined'
                          ? 'Resubmit Corrected Duty / Proof'
                          : t.status === 'submitted'
                          ? 'Update Duty Proof / Notes'
                          : 'Submit Duty Completion'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Create Self-Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl glass-panel p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)] mb-4">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-extrabold text-base sm:text-lg">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span>Create & Propose New Task</span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selfCreateLimit && !selfCreateLimit.can_create ? (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 mb-4 flex items-start gap-2.5 animate-in fade-in">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <div className="font-bold mb-0.5 flex items-center gap-1.5">
                    <span>Daily Limit Active (1 Self-Created Task / 24 Hours)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    You have already proposed a task in the last 24 hours ({selfCreateLimit.last_task_title ? `"${selfCreateLimit.last_task_title}"` : 'Recent Task'}). Next proposal will be available in <strong>{selfCreateLimit.time_remaining_str}</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-700 dark:text-purple-300 mb-4 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span>
                    Self-created tasks are submitted to VC Office Admin for review. Once approved, you earn <strong>+10 points</strong> on the staff leaderboard. <em>(Policy: Maximum 1 self-created task proposal per 24 hours)</em>.
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSelfTask} className="space-y-4">
              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">
                    Task / Duty Title *
                  </label>
                  <ImproveEnglishButton
                    text={newTitle}
                    onImproved={improved => setNewTitle(improved)}
                    context="Faculty Task Title"
                  />
                </div>
                <input
                  required
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Conducted Technical Workshop on AI & Web Development"
                  className="glass-input text-xs w-full font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">
                    Task Description & Objectives *
                  </label>
                  <ImproveEnglishButton
                    text={newDescription}
                    onImproved={improved => setNewDescription(improved)}
                    context="Faculty Task Description"
                  />
                </div>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Describe duty scope, venue, student attendance, or completed milestone..."
                  className="glass-input text-xs w-full leading-relaxed"
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="glass-input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Due / Completion Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="glass-input text-xs w-full"
                  />
                </div>
              </div>

              {/* Priority & Event Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="glass-input text-xs w-full"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Linked Event (Optional)
                  </label>
                  <select
                    value={newEventId}
                    onChange={e => setNewEventId(e.target.value ? Number(e.target.value) : '')}
                    className="glass-input text-xs w-full"
                  >
                    <option value="">General Duty (No Event)</option>
                    {eventsList.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Upload with TaskProofSubmitter */}
              <div className="pt-2 border-t border-[var(--panel-border)]">
                <TaskProofSubmitter
                  valueUrl={newProofUrl}
                  valueName={newProofName}
                  onChange={(url, name) => {
                    setNewProofUrl(url);
                    setNewProofName(name || '');
                  }}
                  facultyName={user?.name || 'Faculty Member'}
                  taskName={newTitle || 'Self-Created Duty'}
                  disabled={creating}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || (selfCreateLimit ? !selfCreateLimit.can_create : false)}
                  className={`text-xs py-2 px-4 flex items-center gap-1.5 font-bold shadow-md transition-all ${
                    selfCreateLimit && !selfCreateLimit.can_create
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                      : 'btn-primary shadow-emerald-600/20 active:scale-95'
                  }`}
                >
                  {creating ? (
                    'Submitting Task...'
                  ) : selfCreateLimit && !selfCreateLimit.can_create ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>24h Limit Active ({selfCreateLimit.time_remaining_str})</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit for Admin Approval</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Submit Duty Completion Modal */}
      {selectedTaskForSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-5 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 truncate">
                <Send className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="truncate">Submit Duty: {selectedTaskForSubmit.title}</span>
              </h3>
              <button
                onClick={() => setSelectedTaskForSubmit(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDuty} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">
                    Duty Completion Summary / Notes *
                  </label>
                  <ImproveEnglishButton
                    text={submitDescription}
                    onImproved={improved => setSubmitDescription(improved)}
                    context="Faculty Task Duty Completion Notes"
                  />
                </div>
                <textarea
                  required
                  rows={3}
                  value={submitDescription}
                  onChange={e => setSubmitDescription(e.target.value)}
                  placeholder="Describe duty actions taken, venue status, logistics..."
                  className="glass-input text-xs w-full leading-relaxed"
                />
              </div>

              <TaskProofSubmitter
                valueUrl={proofUrl}
                valueName={proofName}
                onChange={(url, name) => {
                  setProofUrl(url);
                  setProofName(name || '');
                }}
                facultyName={user?.name || 'Faculty Member'}
                taskName={selectedTaskForSubmit?.title || 'Assigned Duty'}
                disabled={submitting}
              />

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForSubmit(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting Duty...' : 'Submit to VC Office Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Subtask Modal */}
      {selectedParentTaskForSubtask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-5 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)] mb-4">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-extrabold text-base sm:text-lg">
                <ListTree className="w-5 h-5 text-emerald-500" />
                <span>Add Subtask</span>
              </div>
              <button
                onClick={() => setSelectedParentTaskForSubtask(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 mb-4 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CornerDownRight className="w-4 h-4 text-emerald-500" />
                Parent Task: {selectedParentTaskForSubtask.title}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                This subtask is locked to you. <strong>+0 points</strong> are awarded upon approval, and <strong>-3 points</strong> are penalized if declined.
              </p>
            </div>

            <form onSubmit={handleCreateSubtask} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">
                    Subtask Title *
                  </label>
                  <ImproveEnglishButton
                    text={subtaskTitle}
                    onImproved={improved => setSubtaskTitle(improved)}
                    context="Faculty Subtask Title"
                  />
                </div>
                <input
                  required
                  type="text"
                  value={subtaskTitle}
                  onChange={e => setSubtaskTitle(e.target.value)}
                  placeholder="e.g. Prepared venue sound system & tested microphones"
                  className="glass-input text-xs w-full font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">
                    Subtask Details / Action Items *
                  </label>
                  <ImproveEnglishButton
                    text={subtaskDescription}
                    onImproved={improved => setSubtaskDescription(improved)}
                    context="Faculty Subtask Description"
                  />
                </div>
                <textarea
                  required
                  rows={3}
                  value={subtaskDescription}
                  onChange={e => setSubtaskDescription(e.target.value)}
                  placeholder="Describe specific actionable items for this subtask..."
                  className="glass-input text-xs w-full leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Priority Level
                  </label>
                  <select
                    value={subtaskPriority}
                    onChange={e => setSubtaskPriority(e.target.value as any)}
                    className="glass-input text-xs w-full"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Target Completion Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={subtaskDueDate}
                    onChange={e => setSubtaskDueDate(e.target.value)}
                    className="glass-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedParentTaskForSubtask(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subtaskCreating}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {subtaskCreating ? 'Creating Subtask...' : 'Add Subtask'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
