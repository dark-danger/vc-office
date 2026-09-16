import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  CheckSquare, Plus, CheckCircle2, XCircle, Clock, AlertCircle,
  FileText, Calendar, User, Search, Filter, Send, ArrowRight,
  ShieldCheck, Sparkles, Building2, Upload
} from 'lucide-react';

interface TaskItem {
  id: number;
  title: string;
  description: string | null;
  task_type: string;
  department_id?: number;
  department_name?: string;
  target_scope?: string;
  assigned_by_role?: string;
  points_reward: number;
  assigned_to: number;
  assignee?: {
    id: number;
    name: string;
    email: string;
    employee_id?: string;
  };
  assigned_by: number;
  start_date?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'submitted' | 'approved' | 'declined';
  created_at: string;
  submissions?: Array<{
    id: number;
    description: string;
    file_url?: string;
    file_name?: string;
    review_status: string;
    review_remarks?: string;
    submitted_at: string;
  }>;
}

export const HeadTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'directives' | 'internal' | 'reviews'>('directives');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [reviewRequests, setReviewRequests] = useState<TaskItem[]>([]);
  const [deptFaculty, setDeptFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Task Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    target_type: 'faculty', // 'faculty' or 'vc_deliverable'
    assigned_to: '',
    priority: 'medium',
    due_date: '',
    points_reward: 10,
  });
  const [creatingTask, setCreatingTask] = useState(false);

  // Submit Deliverable Modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTaskToSubmit, setSelectedTaskToSubmit] = useState<TaskItem | null>(null);
  const [submitDescription, setSubmitDescription] = useState('');
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTaskToReview, setSelectedTaskToReview] = useState<TaskItem | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchTasksAndFaculty();
  }, [user]);

  const fetchTasksAndFaculty = async () => {
    setLoading(true);
    try {
      // 1. Fetch department tasks
      const allTasks = await apiRequest<TaskItem[]>('/tasks');
      setTasks(allTasks);

      // 2. Fetch submissions for review
      const requests = await apiRequest<TaskItem[]>('/tasks/requests');
      setReviewRequests(requests);

      // 3. Fetch department faculty for delegation
      const depts = await apiRequest<any[]>('/departments');
      const myDept = depts.find((d) => d.id === user?.department_id || d.name === user?.department);
      if (myDept) {
        const facs = await apiRequest<any[]>(`/departments/${myDept.id}/faculty`);
        setDeptFaculty(facs);
      }
    } catch (err) {
      console.error('Failed to load department tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTask(true);
    try {
      const payload: any = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        due_date: taskForm.due_date ? new Date(taskForm.due_date).toISOString() : undefined,
        points_reward: Number(taskForm.points_reward) || 10,
      };

      if (taskForm.target_type === 'faculty') {
        if (!taskForm.assigned_to) {
          alert('Please select a faculty member to assign');
          setCreatingTask(false);
          return;
        }
        payload.assigned_to = Number(taskForm.assigned_to);
        payload.task_type = 'department_delegation';
      } else {
        // VC Deliverable
        payload.assigned_to = user?.id;
        payload.task_type = 'department_deliverable';
      }

      await apiRequest('/tasks', 'POST', payload);
      setShowCreateModal(false);
      setTaskForm({
        title: '',
        description: '',
        target_type: 'faculty',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
        points_reward: 10,
      });
      await fetchTasksAndFaculty();
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskToSubmit) return;
    setSubmitting(true);
    try {
      await apiRequest(`/tasks/${selectedTaskToSubmit.id}/submit`, 'POST', {
        description: submitDescription.trim(),
        file_url: submitFileUrl.trim() || undefined,
      });
      setShowSubmitModal(false);
      setSubmitDescription('');
      setSubmitFileUrl('');
      await fetchTasksAndFaculty();
    } catch (err: any) {
      alert(`Error submitting proof: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedTaskToReview) return;
    setReviewing(true);
    try {
      await apiRequest(`/tasks/${selectedTaskToReview.id}/approve`, 'POST', {
        review_remarks: reviewRemarks.trim() || 'Approved by Department Head',
      });
      setShowReviewModal(false);
      setReviewRemarks('');
      await fetchTasksAndFaculty();
    } catch (err: any) {
      alert(`Error approving task: ${err.message}`);
    } finally {
      setReviewing(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedTaskToReview) return;
    if (!reviewRemarks.trim()) {
      alert('Mandatory remarks must be provided when declining a task.');
      return;
    }
    setReviewing(true);
    try {
      await apiRequest(`/tasks/${selectedTaskToReview.id}/decline`, 'POST', {
        review_remarks: reviewRemarks.trim(),
      });
      setShowReviewModal(false);
      setReviewRemarks('');
      await fetchTasksAndFaculty();
    } catch (err: any) {
      alert(`Error declining task: ${err.message}`);
    } finally {
      setReviewing(false);
    }
  };

  // Filter Tasks by active tab
  const vcDirectives = tasks.filter(
    (t) => t.assigned_by_role === 'super_admin' || t.assigned_to === user?.id
  );
  const internalTasks = tasks.filter(
    (t) => t.assigned_by === user?.id && t.assigned_to !== user?.id
  );
  const pendingFacultyReviews = reviewRequests.filter(
    (r) => r.assigned_to !== user?.id && r.status === 'submitted'
  );

  const displayedList =
    activeTab === 'directives'
      ? vcDirectives
      : activeTab === 'internal'
      ? internalTasks
      : pendingFacultyReviews;

  const filteredList = displayedList.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.assignee?.name && t.assignee.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckSquare className="w-3.5 h-3.5" /> Department Workflow Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Directives & Task Delegation
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Execute VC Office mandates, delegate duties to department faculties, and review submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create / Delegate Task
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--panel-bg)] p-3 rounded-2xl border border-[var(--panel-border)] backdrop-blur-md">
        <div className="flex items-center p-1 rounded-xl bg-black/20 border border-[var(--panel-border)] w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('directives')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'directives'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            VC Directives ({vcDirectives.length})
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'internal'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Delegated to Faculty ({internalTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'reviews'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Faculty Reviews ({pendingFacultyReviews.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks or assignees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
          <p className="text-xs text-[var(--text-secondary)]">Loading department workflow...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] hover:border-emerald-500/30 backdrop-blur-xl shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                      t.priority === 'urgent'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : t.priority === 'high'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {t.priority}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold capitalize ${
                      t.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : t.status === 'submitted'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : t.status === 'declined'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {t.status}
                  </span>

                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    +{t.points_reward} pts
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                  {t.title}
                </h3>

                {t.description && (
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--text-muted)] pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Assignee: <b className="text-[var(--text-primary)]">{t.assignee?.name || 'Unassigned'}</b> ({t.assignee?.employee_id || 'Staff'})
                  </span>
                  {t.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      Due: <b className="text-[var(--text-primary)]">{new Date(t.due_date).toLocaleDateString()}</b>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* If VC Directive and assigned to HOD */}
                {activeTab === 'directives' && t.status !== 'approved' && (
                  <button
                    onClick={() => {
                      setSelectedTaskToSubmit(t);
                      setSubmitDescription('');
                      setSubmitFileUrl('');
                      setShowSubmitModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Submit Deliverable
                  </button>
                )}

                {/* If reviewing faculty submission */}
                {activeTab === 'reviews' && (
                  <button
                    onClick={() => {
                      setSelectedTaskToReview(t);
                      setReviewRemarks('');
                      setShowReviewModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Review Submission
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredList.length === 0 && (
            <div className="py-16 text-center rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] text-[var(--text-muted)] text-xs">
              No tasks found in this section. Click <b>"Create / Delegate Task"</b> to add assignments.
            </div>
          )}
        </div>
      )}

      {/* --- MODAL 1: CREATE / DELEGATE TASK --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[var(--text-primary)]">
                  Create / Delegate Task
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Assign duty to faculty or submit proposal to VC Office</p>
              </div>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                  Task Type / Recipient Scope
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTaskForm({ ...taskForm, target_type: 'faculty' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      taskForm.target_type === 'faculty'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                        : 'bg-black/20 border-[var(--panel-border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    Delegate to Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskForm({ ...taskForm, target_type: 'vc_deliverable' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      taskForm.target_type === 'vc_deliverable'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                        : 'bg-black/20 border-[var(--panel-border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    Submit to VC Office
                  </button>
                </div>
              </div>

              {taskForm.target_type === 'faculty' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                    Select Department Faculty Member *
                  </label>
                  <select
                    required
                    value={taskForm.assigned_to}
                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose faculty member --</option>
                    {deptFaculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.employee_id || 'ID'} - {f.designation || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare Syllabus & Accreditation Report"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                  Detailed Instructions / Deliverables
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide scope, required documents, or instructions..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                    Points Reward
                  </label>
                  <input
                    type="number"
                    value={taskForm.points_reward}
                    onChange={(e) => setTaskForm({ ...taskForm, points_reward: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--panel-border)] text-xs font-bold text-[var(--text-secondary)] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
                >
                  {creatingTask ? 'Saving Task...' : 'Assign / Propose Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: SUBMIT PROOF TO VC --- */}
      {showSubmitModal && selectedTaskToSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 shadow-2xl relative">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>

            <h3 className="font-extrabold text-lg text-[var(--text-primary)] mb-1">
              Submit Task Deliverable
            </h3>
            <p className="text-xs text-emerald-400 font-bold mb-4">{selectedTaskToSubmit.title}</p>

            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                  Submission Summary / Remarks *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Summarize the work done or attach report links..."
                  value={submitDescription}
                  onChange={(e) => setSubmitDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                  Document / Proof Link (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or uploaded document URL"
                  value={submitFileUrl}
                  onChange={(e) => setSubmitFileUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--panel-border)] text-xs font-bold text-[var(--text-secondary)] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit to VC Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: REVIEW FACULTY SUBMISSION --- */}
      {showReviewModal && selectedTaskToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 shadow-2xl relative">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>

            <h3 className="font-extrabold text-lg text-[var(--text-primary)] mb-1">
              Review Faculty Submission
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Submitted by <b className="text-emerald-400">{selectedTaskToReview.assignee?.name}</b> for task: <b>{selectedTaskToReview.title}</b>
            </p>

            {selectedTaskToReview.submissions && selectedTaskToReview.submissions.length > 0 && (
              <div className="p-3.5 rounded-xl bg-black/30 border border-[var(--panel-border)] mb-4 text-xs space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Latest Submission Text:</div>
                <div className="text-[var(--text-primary)] font-medium">
                  {selectedTaskToReview.submissions[selectedTaskToReview.submissions.length - 1].description}
                </div>
                {selectedTaskToReview.submissions[selectedTaskToReview.submissions.length - 1].file_url && (
                  <a
                    href={selectedTaskToReview.submissions[selectedTaskToReview.submissions.length - 1].file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 underline inline-block text-[11px]"
                  >
                    View Attached Document / Proof ↗
                  </a>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                  Review Remarks / Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder="Remarks for approval or mandatory rejection reason..."
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={reviewing}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-black text-xs transition-all flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Decline (-3 pts)
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={reviewing}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve (+{selectedTaskToReview.points_reward} pts)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
