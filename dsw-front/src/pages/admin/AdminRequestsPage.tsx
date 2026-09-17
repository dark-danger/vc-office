import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { ProofViewer } from '../../components/tasks/ProofViewer';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  ClipboardCheck, CheckCircle2, XCircle, Clock, AlertCircle,
  FileText, User as UserIcon, Calendar, Search, Filter, Sparkles,
  RefreshCw, Check, X, ShieldAlert, Award, FileCheck, ArrowUpRight,
  ChevronDown, ListTree, Building2, Users
} from 'lucide-react';

interface Submission {
  id: number;
  submitted_by: number;
  submitter?: User;
  description: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  submitted_at: string;
  review_status: string;
  review_remarks?: string;
  reviewed_at?: string;
}

interface LinedUpFaculty {
  faculty_id: number;
  faculty_name: string;
  employee_id?: string;
  role?: string;
  designation?: string;
  email?: string;
}

interface CompletionReport {
  summary?: string;
  achievements?: string;
  faculty_contributions?: string;
  file_url?: string;
  file_name?: string;
  submitted_at?: string;
  submitted_by_name?: string;
}

interface TaskItem {
  id: number;
  title: string;
  description: string;
  task_type: string;
  event_id?: number;
  event_title?: string;
  parent_task_id?: number;
  department_id?: number;
  department_name?: string;
  points_reward?: number;
  assigned_to: number;
  assignee?: User;
  assigned_by: number;
  start_date?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'declined';
  created_at: string;
  lined_up_faculty?: LinedUpFaculty[];
  completion_report?: CompletionReport;
  submissions: Submission[];
}

export const AdminRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<TaskItem[]>([]);
  const [headsList, setHeadsList] = useState<User[]>([]);
  const [eventsList, setEventsList] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filters
  const [statusTab, setStatusTab] = useState<'pending' | 'self_created' | 'all' | 'approved' | 'declined'>('pending');
  const [selectedHead, setSelectedHead] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [dateFilterType, setDateFilterType] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Decline Modal
  const [selectedTaskForDecline, setSelectedTaskForDecline] = useState<TaskItem | null>(null);
  const [declineRemarks, setDeclineRemarks] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [reqData, headData, evData] = await Promise.all([
        apiRequest<TaskItem[]>('/tasks/requests?status_filter=all'),
        headsList.length > 0 ? Promise.resolve(headsList) : apiRequest<User[]>('/users/heads').catch(() => []),
        eventsList.length > 0 ? Promise.resolve(eventsList) : apiRequest<{ id: number; title: string }[]>('/events').catch(() => [])
      ]);
      setRequests(reqData);
      if (headsList.length === 0) setHeadsList(headData);
      if (eventsList.length === 0) setEventsList(evData);
    } catch (e) {
      console.error('Failed to fetch requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (task: TaskItem) => {
    const isSubtask = Boolean(task.parent_task_id || task.task_type === 'subtask');
    const promptMsg = isSubtask
      ? `Approve subtask "${task.title}" for ${task.assignee?.name || 'Department Head'}? (Subtasks award +0 extra points)`
      : `Approve deliverable "${task.title}" and award departmental points to ${task.assignee?.name || 'Department Head'}?`;

    if (!window.confirm(promptMsg)) {
      return;
    }

    setActionLoading(task.id);
    try {
      const updated = await apiRequest<TaskItem>(`/tasks/${task.id}/approve`, 'POST');
      setRequests(prev => prev.map(t => t.id === task.id ? updated : t));
      if (isSubtask) {
        showToast(`🎉 Subtask "${task.title}" approved for ${task.assignee?.name || 'Department'}.`);
      } else {
        showToast(`🎉 Directive "${task.title}" approved! +10 points awarded to ${task.assignee?.department || task.assignee?.name || 'Department'}.`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve task');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForDecline) return;
    if (!declineRemarks.trim()) return alert('Please enter mandatory decline feedback remarks.');

    setActionLoading(selectedTaskForDecline.id);
    try {
      const updated = await apiRequest<TaskItem>(`/tasks/${selectedTaskForDecline.id}/decline`, 'POST', {
        review_remarks: declineRemarks.trim()
      });
      setRequests(prev => prev.map(t => t.id === selectedTaskForDecline.id ? updated : t));
      showToast(`Directive returned with remarks to ${selectedTaskForDecline.assignee?.name || 'Department Head'}.`);
      setSelectedTaskForDecline(null);
      setDeclineRemarks('');
    } catch (err: any) {
      alert(err.message || 'Failed to decline task');
    } finally {
      setActionLoading(null);
    }
  };

  // Metrics Calculation
  const pendingCount = requests.filter(r => r.status === 'submitted' || r.status === 'pending').length;
  const selfCreatedCount = requests.filter(r => r.assigned_by === r.assigned_to || r.task_type === 'self_created').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const declinedCount = requests.filter(r => r.status === 'declined').length;

  // Filtered List
  const filteredRequests = requests.filter(t => {
    // Tab Filter
    if (statusTab === 'pending') {
      if (t.status !== 'submitted' && t.status !== 'pending') return false;
    } else if (statusTab === 'self_created') {
      if (t.assigned_by !== t.assigned_to && t.task_type !== 'self_created') return false;
    } else if (statusTab === 'approved') {
      if (t.status !== 'approved') return false;
    } else if (statusTab === 'declined') {
      if (t.status !== 'declined') return false;
    }

    // Head Filter
    if (selectedHead !== 'all' && String(t.assigned_to) !== selectedHead) {
      return false;
    }

    // Event Filter
    if (selectedEvent !== 'all' && String(t.event_id) !== selectedEvent) {
      return false;
    }

    // Priority Filter
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
      return false;
    }

    // Date Filter
    if (dateFilterType !== 'all') {
      const taskDate = t.due_date ? new Date(t.due_date) : t.start_date ? new Date(t.start_date) : new Date(t.created_at);
      const now = new Date();
      if (dateFilterType === 'today') {
        const isToday = taskDate.toDateString() === now.toDateString();
        if (!isToday) return false;
      } else if (dateFilterType === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (taskDate < weekAgo) return false;
      } else if (dateFilterType === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (taskDate < monthStart) return false;
      } else if (dateFilterType === 'custom') {
        if (customFromDate && taskDate < new Date(customFromDate)) return false;
        if (customToDate && taskDate > new Date(customToDate + 'T23:59:59')) return false;
      }
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchHead = (t.assignee?.name || '').toLowerCase().includes(q);
      const matchDept = (t.assignee?.department || '').toLowerCase().includes(q);
      const matchEvent = (t.event_title || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchHead && !matchDept && !matchEvent) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-amber-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ClipboardCheck className="w-3.5 h-3.5 text-amber-500" />
              VC Office Directive & Deliverable Approval Center
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Department Deliverables & Directives Review
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              Review and verify deliverables, event compliance, and reports submitted by Department Heads. Approved deliverables immediately award departmental points to the institutional leaderboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRequests}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--card-bg-to)] hover:bg-emerald-500/10 text-xs font-bold text-[var(--text-secondary)] hover:text-emerald-500 border border-[var(--panel-border)] transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div
            onClick={() => setStatusTab('pending')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
              statusTab === 'pending'
                ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                : 'bg-[var(--card-bg-to)] border-[var(--panel-border)] hover:border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Pending Review</span>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-1.5 font-mono">
              {pendingCount}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Awaiting VC Office approval</p>
          </div>

          <div
            onClick={() => setStatusTab('self_created')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
              statusTab === 'self_created'
                ? 'bg-purple-500/15 border-purple-500/50 shadow-md shadow-purple-500/10'
                : 'bg-[var(--card-bg-to)] border-[var(--panel-border)] hover:border-purple-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Department Initiatives
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">
                HOD
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-1.5 font-mono">
              {selfCreatedCount}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Initiated by Department Heads</p>
          </div>

          <div
            onClick={() => setStatusTab('approved')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
              statusTab === 'approved'
                ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-[var(--card-bg-to)] border-[var(--panel-border)] hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-1.5 font-mono">
              {approvedCount}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Points credited</p>
          </div>

          <div
            onClick={() => setStatusTab('declined')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
              statusTab === 'declined'
                ? 'bg-rose-500/15 border-rose-500/50 shadow-md shadow-rose-500/10'
                : 'bg-[var(--card-bg-to)] border-[var(--panel-border)] hover:border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Returned</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-1.5 font-mono">
              {declinedCount}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Returned with remarks</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-2xl overflow-x-auto">
          <button
            onClick={() => setStatusTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusTab === 'pending'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setStatusTab('self_created')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusTab === 'self_created'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Department Initiatives ({selfCreatedCount})
          </button>
          <button
            onClick={() => setStatusTab('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusTab('declined')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusTab === 'declined'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Returned ({declinedCount})
          </button>
          <button
            onClick={() => setStatusTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusTab === 'all'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Submissions ({requests.length})
          </button>
        </div>

        {/* Search & Priority Selector */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search department, title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="glass-input pl-9 text-xs py-2 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            className="glass-input text-xs py-2 px-3 shrink-0"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Advanced Secondary Filters: Department Head, Event, Date */}
      <div className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Department Head Filter */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-blue-500" /> Filter by Department / Head
          </label>
          <select
            value={selectedHead}
            onChange={e => setSelectedHead(e.target.value)}
            className="glass-input text-xs w-full"
          >
            <option value="all">-- All Departments ({headsList.length}) --</option>
            {headsList.map(h => (
              <option key={h.id} value={String(h.id)}>
                {h.department || h.name} ({h.name})
              </option>
            ))}
          </select>
        </div>

        {/* Event Filter */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-purple-500" /> Filter by Event
          </label>
          <select
            value={selectedEvent}
            onChange={e => setSelectedEvent(e.target.value)}
            className="glass-input text-xs w-full"
          >
            <option value="all">-- All Events ({eventsList.length}) --</option>
            {eventsList.map(ev => (
              <option key={ev.id} value={String(ev.id)}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" /> Filter by Date
          </label>
          <select
            value={dateFilterType}
            onChange={e => setDateFilterType(e.target.value as any)}
            className="glass-input text-xs w-full"
          >
            <option value="all">All Dates / Any Time</option>
            <option value="today">Today's Submissions</option>
            <option value="week">This Week (Last 7 Days)</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date Range...</option>
          </select>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {dateFilterType === 'custom' && (
        <div className="p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
              From Date
            </label>
            <input
              type="date"
              value={customFromDate}
              onChange={e => setCustomFromDate(e.target.value)}
              className="glass-input text-xs w-full"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
              To Date
            </label>
            <input
              type="date"
              value={customToDate}
              onChange={e => setCustomToDate(e.target.value)}
              className="glass-input text-xs w-full"
            />
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center glass-panel space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">Loading submissions...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center glass-panel space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">No submissions found</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              {searchQuery
                ? `No submissions matched "${searchQuery}". Try modifying your search or filters.`
                : 'There are currently no departmental submissions or directive proofs in this tab.'}
            </p>
          </div>
        ) : (
          filteredRequests.map(t => {
            const isSubtask = Boolean(t.parent_task_id || t.task_type === 'subtask');
            const isSelfCreated = !isSubtask && ((t.assigned_by === t.assigned_to) || (t.task_type === 'self_created'));
            const latestSub = t.submissions && t.submissions.length > 0 ? t.submissions[t.submissions.length - 1] : null;
            const isPending = t.status === 'submitted' || t.status === 'pending';

            return (
              <div
                key={t.id}
                className={`glass-panel p-5 sm:p-6 space-y-4 transition-all duration-200 border-l-4 ${
                  t.status === 'approved'
                    ? 'border-l-emerald-500 bg-emerald-500/[0.02]'
                    : t.status === 'declined'
                    ? 'border-l-rose-500 bg-rose-500/[0.02]'
                    : isSubtask
                    ? 'border-l-teal-500 bg-teal-500/[0.02]'
                    : isSelfCreated
                    ? 'border-l-purple-500 bg-purple-500/[0.02]'
                    : 'border-l-amber-500 bg-amber-500/[0.02]'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--panel-border)]">
                  {/* Department Head Identity */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-500/20 shrink-0">
                      {t.assignee?.department?.slice(0, 2).toUpperCase() || t.assignee?.name?.slice(0, 2).toUpperCase() || 'DH'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)]">
                          {t.assignee?.name || 'Department Head'}
                        </h4>
                        {isSubtask ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                            <ListTree className="w-3 h-3" /> Subtask Deliverable
                          </span>
                        ) : isSelfCreated ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            <Sparkles className="w-3 h-3" /> Department Initiative
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                            <FileCheck className="w-3 h-3" /> VC Directive Deliverable
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {t.assignee?.department || 'Department Head'} • {t.assignee?.email}
                      </p>
                    </div>
                  </div>

                  {/* Status & Priority Badges */}
                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      t.priority === 'high'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        : t.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                    }`}>
                      {t.priority} Priority
                    </span>

                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                      t.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                        : t.status === 'declined'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                    }`}>
                      {t.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {t.status === 'declined' && <XCircle className="w-3.5 h-3.5" />}
                      {isPending && <Clock className="w-3.5 h-3.5 animate-spin" />}
                      {t.status === 'approved'
                        ? isSubtask ? 'Approved (+0 Pts)' : 'Approved (+10 Pts)'
                        : t.status === 'declined'
                        ? 'Returned with Remarks'
                        : 'Awaiting VC Office Approval'}
                    </span>
                  </div>
                </div>

                {/* Task Details */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    {t.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                    {t.description || 'No description provided.'}
                  </p>
                </div>

                {/* Date / Time & Event Metadata */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {(t.start_date || t.due_date) && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-400/20 text-xs font-medium text-blue-700 dark:text-blue-300">
                      <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>
                        <strong>Timeline:</strong> {t.start_date ? new Date(t.start_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Immediate'} → <strong className="text-amber-600 dark:text-amber-400">{t.due_date ? new Date(t.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Open Deadline'}</strong>
                      </span>
                    </div>
                  )}

                  {t.event_title && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-400/20 text-xs font-semibold text-purple-700 dark:text-purple-300">
                      <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      Event: {t.event_title}
                    </div>
                  )}

                  <div className="text-[11px] text-[var(--text-muted)] ml-auto">
                    Submitted: {new Date(t.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>

                {/* Lined-Up Department Faculty Team */}
                {t.lined_up_faculty && t.lined_up_faculty.length > 0 && (
                  <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-500" />
                        Participating Department Faculty Team ({t.lined_up_faculty.length})
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        +{t.points_reward || 10} pts to each on approval
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {t.lined_up_faculty.map((fac, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--panel-bg)] border border-emerald-500/30 text-xs text-[var(--text-primary)] shadow-xs"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">
                            {fac.faculty_name.charAt(0)}
                          </div>
                          <span className="font-semibold">{fac.faculty_name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono">
                            {fac.role || 'Coordinator'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Official Completion Report Display */}
                {t.completion_report && Object.keys(t.completion_report).length > 0 && (
                  <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-900/50 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Executive Completion Report & Verification
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-300">
                        {t.completion_report.submitted_at ? new Date(t.completion_report.submitted_at).toLocaleString() : ''}
                      </span>
                    </div>

                    {t.completion_report.summary && (
                      <div className="bg-[var(--panel-bg)]/80 p-3 rounded-xl border border-blue-500/20">
                        <div className="text-[11px] font-bold text-[var(--text-secondary)] mb-0.5">Execution Summary:</div>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed">{t.completion_report.summary}</p>
                      </div>
                    )}

                    {t.completion_report.achievements && (
                      <div className="bg-[var(--panel-bg)]/80 p-3 rounded-xl border border-blue-500/20">
                        <div className="text-[11px] font-bold text-[var(--text-secondary)] mb-0.5">Key Highlights & Metrics:</div>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed">{t.completion_report.achievements}</p>
                      </div>
                    )}

                    {t.completion_report.faculty_contributions && (
                      <div className="bg-[var(--panel-bg)]/80 p-3 rounded-xl border border-blue-500/20">
                        <div className="text-[11px] font-bold text-[var(--text-secondary)] mb-0.5">Faculty Contributions:</div>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed">{t.completion_report.faculty_contributions}</p>
                      </div>
                    )}

                    {t.completion_report.file_url && (
                      <div className="pt-1">
                        <ProofViewer url={t.completion_report.file_url} fileName={t.completion_report.file_name} />
                      </div>
                    )}
                  </div>
                )}

                {/* Proof & File Submission Display */}
                {latestSub?.file_url && !t.completion_report?.file_url && (
                  <div className="p-4 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        Uploaded Directive Proof / Deliverable File
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {latestSub.file_name || 'Attached Proof'}
                      </span>
                    </div>
                    <ProofViewer url={latestSub.file_url} fileName={latestSub.file_name} />
                  </div>
                )}

                {/* Submission Description / Notes if different */}
                {latestSub?.description && latestSub.description !== t.description && (
                  <div className="p-3 bg-slate-500/10 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-[var(--text-primary)]">HOD Deliverable Notes:</span>
                    <p className="text-[var(--text-secondary)]">{latestSub.description}</p>
                  </div>
                )}

                {/* Previous Decline Remarks */}
                {t.status === 'declined' && latestSub?.review_remarks && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> VC Office Return Remarks:
                    </div>
                    <p className="text-[var(--text-primary)]">{latestSub.review_remarks}</p>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-[var(--panel-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>
                      {isSubtask ? (
                        <>Subtask Reward: <strong>+0 Extra Points</strong> upon approval</>
                      ) : (
                        <>Direct Reward: <strong>+10 Departmental Points</strong> upon approval</>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {t.status !== 'declined' && (
                      <button
                        onClick={() => {
                          setSelectedTaskForDecline(t);
                          setDeclineRemarks(latestSub?.review_remarks || '');
                        }}
                        disabled={actionLoading === t.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs font-bold transition-all active:scale-95"
                      >
                        <XCircle className="w-4 h-4" />
                        Return with Remarks
                      </button>
                    )}

                    {t.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(t)}
                        disabled={actionLoading === t.id}
                        className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 font-bold shadow-md shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {actionLoading === t.id
                          ? 'Approving...'
                          : isSubtask
                          ? 'Approve Subtask (+0 pts)'
                          : 'Approve & Award Points (+10)'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decline Remarks Modal */}
      {selectedTaskForDecline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-5 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)] mb-4">
              <div className="flex items-center gap-2 text-rose-500 font-extrabold text-base sm:text-lg">
                <XCircle className="w-5 h-5" />
                <span>Return Directive Submission to Department</span>
              </div>
              <button
                onClick={() => setSelectedTaskForDecline(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeclineSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-xs space-y-1">
                <p className="font-bold text-[var(--text-primary)]">
                  {selectedTaskForDecline.parent_task_id ? 'Subtask: ' : 'Directive: '}
                  {selectedTaskForDecline.title}
                </p>
                <p className="text-[var(--text-muted)]">Department: {selectedTaskForDecline.assignee?.department || selectedTaskForDecline.assignee?.name} ({selectedTaskForDecline.assignee?.name})</p>
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span><strong>Revision Notice:</strong> Returning this directive will prompt the Department Head to revise deliverables and upload corrected proofs.</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">
                    Feedback / Reason for Return *
                  </label>
                  <ImproveEnglishButton
                    text={declineRemarks}
                    onImproved={improved => setDeclineRemarks(improved)}
                    context="VC Office rejection feedback for department deliverable submission"
                  />
                </div>
                <textarea
                  required
                  rows={4}
                  value={declineRemarks}
                  onChange={e => setDeclineRemarks(e.target.value)}
                  placeholder="Explain why this deliverable needs revision (e.g., missing proof document, incomplete compliance report, needs date revision)..."
                  className="glass-input text-xs w-full leading-relaxed"
                />
              </div>

              {/* Quick Reason Suggestions */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[var(--text-muted)]">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Please attach valid compliance proof document / photos.',
                    'Deliverable details are insufficient. Please elaborate on outcomes.',
                    'Please update event budget and attendee report.',
                    'Duplicate deliverable submission.'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDeclineRemarks(preset)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-[var(--card-bg-to)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--panel-border)] transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForDecline(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === selectedTaskForDecline.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all active:scale-95"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {actionLoading === selectedTaskForDecline.id ? 'Submitting...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
