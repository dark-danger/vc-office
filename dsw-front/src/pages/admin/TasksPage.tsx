import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { ProofViewer } from '../../components/tasks/ProofViewer';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  CheckSquare, Plus, CornerDownRight, CheckCircle2, XCircle, Clock,
  AlertCircle, FileText, User as UserIcon, Calendar, X, Eye, Pencil, Trash2,
  ClipboardCheck, Filter, RotateCcw, Search, Users, Building2, Sparkles,
  Award, Send, Check
} from 'lucide-react';

interface LinedUpFaculty {
  faculty_id: number;
  faculty_name: string;
  employee_id?: string;
  role?: string;
  designation?: string;
  email?: string;
  duty_status?: string;
}

interface CompletionReport {
  summary?: string;
  achievements?: string;
  faculty_contributions?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  submitted_at?: string;
  submitted_by_name?: string;
  submitted_by_email?: string;
  lined_up_faculty?: LinedUpFaculty[];
}

interface Submission {
  id: number;
  submitted_by: number;
  submitter?: User;
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
  department_id?: number;
  department_name?: string;
  assigned_to: number;
  assignee?: User;
  points_reward?: number;
  start_date?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'declined';
  created_at: string;
  lined_up_faculty?: LinedUpFaculty[];
  completion_report?: CompletionReport;
  submissions: Submission[];
  subtasks: TaskItem[];
}

interface EventItem {
  id: number;
  title: string;
}

interface DepartmentItem {
  id: number;
  name: string;
  code: string;
  head_id?: number;
}

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterFacultyId, setFilterFacultyId] = useState<string>('all');
  const [filterEventId, setFilterEventId] = useState<string>('all');
  const [filterDateType, setFilterDateType] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [filterCustomFrom, setFilterCustomFrom] = useState('');
  const [filterCustomTo, setFilterCustomTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<TaskItem | null>(null);
  const [declineRemarks, setDeclineRemarks] = useState('');
  const [parentTaskIdForSubtask, setParentTaskIdForSubtask] = useState<number | null>(null);

  // Edit Modal State
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState<number | ''>('');
  const [editEventId, setEditEventId] = useState<number | ''>('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPointsReward, setEditPointsReward] = useState<number>(10);
  const [editLinedUpFaculty, setEditLinedUpFaculty] = useState<LinedUpFaculty[]>([]);

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');
  const [eventId, setEventId] = useState<number | ''>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [pointsReward, setPointsReward] = useState<number>(10);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | ''>('');
  
  // Faculty Lineup State
  const [deptFacultyRoster, setDeptFacultyRoster] = useState<User[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [linedUpFaculty, setLinedUpFaculty] = useState<LinedUpFaculty[]>([]);
  const [facultySearch, setFacultySearch] = useState('');

  const fetchTasksData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterFacultyId !== 'all') params.append('assigned_to', filterFacultyId);
      if (filterEventId !== 'all') params.append('event_id', filterEventId);
      if (filterStatus !== 'all') params.append('status_filter', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (filterSearch.trim()) params.append('search', filterSearch.trim());

      const now = new Date();
      if (filterDateType === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
        params.append('from_date', startOfDay);
        params.append('to_date', endOfDay);
      } else if (filterDateType === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        params.append('from_date', weekAgo);
      } else if (filterDateType === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        params.append('from_date', monthAgo);
      } else if (filterDateType === 'custom') {
        if (filterCustomFrom) params.append('from_date', new Date(filterCustomFrom).toISOString());
        if (filterCustomTo) params.append('to_date', new Date(filterCustomTo + 'T23:59:59').toISOString());
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const [tData, facData, evData, deptsData] = await Promise.all([
        apiRequest<TaskItem[]>(`/tasks${queryString}`),
        facultyList.length > 0 ? Promise.resolve(facultyList) : apiRequest<User[]>('/users/heads').catch(() => apiRequest<User[]>('/users')),
        eventsList.length > 0 ? Promise.resolve(eventsList) : apiRequest<EventItem[]>('/events').catch(() => []),
        departmentsList.length > 0 ? Promise.resolve(departmentsList) : apiRequest<DepartmentItem[]>('/departments').catch(() => [])
      ]);
      setTasks(tData);
      if (facultyList.length === 0) setFacultyList(facData);
      if (eventsList.length === 0) setEventsList(evData);
      if (departmentsList.length === 0) setDepartmentsList(deptsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, [filterFacultyId, filterEventId, filterDateType, filterCustomFrom, filterCustomTo, filterStatus, filterPriority, filterSearch]);

  // When assigned HOD changes in Create Modal, load department faculty roster
  const handleAssigneeChange = async (selectedUserId: number | '') => {
    setAssignedTo(selectedUserId);
    if (!selectedUserId) {
      setDeptFacultyRoster([]);
      setLinedUpFaculty([]);
      return;
    }

    const selectedHead = facultyList.find(f => f.id === Number(selectedUserId));
    if (selectedHead && selectedHead.department_id) {
      setSelectedDepartmentId(selectedHead.department_id);
      loadDepartmentFaculty(selectedHead.department_id);
    } else {
      // Find matching department by name
      const matchingDept = departmentsList.find(d => d.head_id === Number(selectedUserId) || (selectedHead && d.name.toLowerCase() === selectedHead.department?.toLowerCase()));
      if (matchingDept) {
        setSelectedDepartmentId(matchingDept.id);
        loadDepartmentFaculty(matchingDept.id);
      } else {
        // Fallback: fetch all faculty
        try {
          const allFac = await apiRequest<User[]>('/users/faculty');
          setDeptFacultyRoster(allFac);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const loadDepartmentFaculty = async (deptId: number) => {
    setLoadingRoster(true);
    try {
      const roster = await apiRequest<User[]>(`/departments/${deptId}/faculty`);
      setDeptFacultyRoster(roster);
    } catch (err) {
      console.error('Failed to load department faculty:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  // Toggle faculty member in lined up list
  const toggleFacultyLineup = (faculty: User, defaultRole = 'Faculty Coordinator') => {
    setLinedUpFaculty(prev => {
      const exists = prev.some(f => f.faculty_id === faculty.id);
      if (exists) {
        return prev.filter(f => f.faculty_id !== faculty.id);
      } else {
        return [
          ...prev,
          {
            faculty_id: faculty.id,
            faculty_name: faculty.name,
            employee_id: faculty.employee_id || '',
            designation: faculty.designation || 'Faculty Member',
            email: faculty.email,
            role: defaultRole,
            duty_status: 'assigned'
          }
        ];
      }
    });
  };

  const updateFacultyRole = (facultyId: number, newRole: string) => {
    setLinedUpFaculty(prev =>
      prev.map(f => (f.faculty_id === facultyId ? { ...f, role: newRole } : f))
    );
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedTo) return alert('Select a department head assignee');

    try {
      const created = await apiRequest<TaskItem>('/tasks', 'POST', {
        title,
        description,
        task_type: eventId ? 'event_linked' : 'general',
        event_id: eventId ? Number(eventId) : null,
        parent_task_id: parentTaskIdForSubtask,
        department_id: selectedDepartmentId ? Number(selectedDepartmentId) : null,
        assigned_to: Number(assignedTo),
        priority,
        points_reward: Number(pointsReward) || 10,
        lined_up_faculty: linedUpFaculty,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });

      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setStartDate('');
      setDueDate('');
      setPointsReward(10);
      setLinedUpFaculty([]);
      setParentTaskIdForSubtask(null);
      setTasks(prev => [created, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Failed to assign task');
    }
  };

  const handleOpenEditModal = (t: TaskItem) => {
    setEditingTask(t);
    setEditTitle(t.title);
    setEditDescription(t.description || '');
    setEditAssignedTo(t.assigned_to);
    setEditEventId(t.event_id || '');
    setEditPriority(t.priority);
    setEditPointsReward(t.points_reward || 10);
    setEditLinedUpFaculty(t.lined_up_faculty || []);
    setEditStartDate(t.start_date ? t.start_date.slice(0, 16) : '');
    setEditDueDate(t.due_date ? t.due_date.slice(0, 16) : '');

    if (t.department_id) {
      loadDepartmentFaculty(t.department_id);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editAssignedTo) return alert('Select a department head assignee');

    try {
      const updated = await apiRequest<TaskItem>(`/tasks/${editingTask.id}`, 'PATCH', {
        title: editTitle,
        description: editDescription,
        assigned_to: Number(editAssignedTo),
        event_id: editEventId ? Number(editEventId) : null,
        priority: editPriority,
        points_reward: Number(editPointsReward) || 10,
        lined_up_faculty: editLinedUpFaculty,
        start_date: editStartDate ? new Date(editStartDate).toISOString() : null,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
      });

      setEditingTask(null);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: number, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete directive "${taskTitle}"?`)) return;
    try {
      await apiRequest(`/tasks/${taskId}`, 'DELETE');
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleApprove = async (taskId: number) => {
    try {
      const approved = await apiRequest<TaskItem>(`/tasks/${taskId}/approve`, 'POST');
      setSelectedTaskForReview(null);
      setTasks(prev => prev.map(t => t.id === taskId ? approved : t));
      alert(`🎉 Task approved successfully! Department and lined-up faculty have been credited with points.`);
    } catch (err: any) {
      alert(err.message || 'Approve failed');
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForReview) return;
    if (!declineRemarks.trim()) return alert('Mandatory decline remarks must be provided!');

    try {
      const declined = await apiRequest<TaskItem>(`/tasks/${selectedTaskForReview.id}/decline`, 'POST', {
        review_remarks: declineRemarks
      });
      setSelectedTaskForReview(null);
      setDeclineRemarks('');
      setTasks(prev => prev.map(t => t.id === selectedTaskForReview.id ? declined : t));
      alert('Task report returned to Department Head with revision remarks.');
    } catch (err: any) {
      alert(err.message || 'Decline failed');
    }
  };

  const renderTaskCard = (t: TaskItem, isSubtask = false) => {
    const hasReport = Boolean(t.completion_report && Object.keys(t.completion_report).length > 0);
    const facultyLineup = t.lined_up_faculty || [];

    return (
      <div
        key={t.id}
        className={`glass-card p-4 sm:p-5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
          isSubtask ? 'ml-3 sm:ml-6 border-l-2 border-l-emerald-500 bg-[var(--card-bg-to)]' : ''
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isSubtask && <CornerDownRight className="w-4 h-4 text-emerald-500 shrink-0" />}
            <div>
              <h4 className="font-bold text-[var(--text-primary)] text-sm sm:text-base">{t.title}</h4>
              {t.department_name && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3" /> {t.department_name}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
              t.priority === 'high' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30' :
              t.priority === 'medium' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'
            }`}>
              {t.priority}
            </span>

            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              +{t.points_reward || 10} pts
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              t.status === 'approved' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
              t.status === 'submitted' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 animate-pulse' :
              t.status === 'declined' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30' : 'bg-[var(--card-bg-to)] text-[var(--text-secondary)] border border-[var(--panel-border)]'
            }`}>
              {t.status === 'submitted' ? 'REPORT SUBMITTED' : t.status.toUpperCase()}
            </span>

            <button
              onClick={() => handleOpenEditModal(t)}
              className="p-1.5 rounded-lg bg-[var(--card-bg-to)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--panel-border)] transition-colors"
              title="Edit Directive / Lineup"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleDeleteTask(t.id, t.title)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors"
              title="Delete Directive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{t.description || 'No instructions provided.'}</p>

        {/* Lined-Up Faculty Section */}
        {facultyLineup.length > 0 && (
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Users className="w-3.5 h-3.5" />
              <span>Lined-Up Department Faculty Team ({facultyLineup.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {facultyLineup.map((f, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--panel-bg)] border border-emerald-500/30 text-xs text-[var(--text-primary)] shadow-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">
                    {f.faculty_name.charAt(0)}
                  </div>
                  <span className="font-semibold">{f.faculty_name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono">
                    {f.role || 'Coordinator'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Report Highlight Box */}
        {hasReport && (
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-300 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Official Task Completion Report Submitted by HOD</span>
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-300">
                {t.completion_report?.submitted_at ? new Date(t.completion_report.submitted_at).toLocaleString() : ''}
              </span>
            </div>
            {t.completion_report?.summary && (
              <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--panel-bg)]/60 p-2.5 rounded-lg border border-blue-500/20">
                "{t.completion_report.summary}"
              </p>
            )}
            {t.completion_report?.file_url && (
              <div className="pt-1">
                <ProofViewer url={t.completion_report.file_url} fileName={t.completion_report.file_name} />
              </div>
            )}
          </div>
        )}

        {/* Task Time Limit Badge */}
        {(t.start_date || t.due_date) && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-400/20 text-xs font-medium text-blue-700 dark:text-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              <strong>Timeline:</strong> {t.start_date ? new Date(t.start_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Immediate'} → <strong className="text-amber-600 dark:text-amber-400">{t.due_date ? new Date(t.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Open Deadline'}</strong>
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--panel-border)] gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[var(--text-secondary)]">
              <UserIcon className="w-3.5 h-3.5 text-blue-500" /> Department Head: <strong className="text-[var(--text-primary)]">{t.assignee?.name || 'Unassigned'}</strong>
            </span>
            {t.event_title && (
              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                <Calendar className="w-3.5 h-3.5" /> {t.event_title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isSubtask && (
              <button
                onClick={() => {
                  setParentTaskIdForSubtask(t.id);
                  setAssignedTo(t.assigned_to);
                  setEventId(t.event_id || '');
                  setIsCreateModalOpen(true);
                }}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold flex items-center gap-1"
              >
                + Add Subtask
              </button>
            )}

            {(hasReport || (t.submissions && t.submissions.length > 0)) ? (
              <button
                onClick={() => setSelectedTaskForReview(t)}
                className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" /> Review Report & Lineup
              </button>
            ) : t.status !== 'approved' ? (
              <button
                onClick={() => handleApprove(t.id)}
                className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve (+{t.points_reward || 10} pts)
              </button>
            ) : null}
          </div>
        </div>

        {/* Nested Subtasks Render */}
        {t.subtasks && t.subtasks.length > 0 && (
          <div className="space-y-2 pt-2">
            {t.subtasks.map(st => renderTaskCard(st, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" /> VC Office Directives & Task Delegation
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">VC Task Allocation & Lineup Engine</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Assign directives to Department Heads, line up departmental faculty teams, track task milestones, and review completed official reports.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            to="/admin/requests"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <ClipboardCheck className="w-4 h-4 text-amber-500" />
            Review Queue & Reports
          </Link>

          <button
            onClick={() => {
              setParentTaskIdForSubtask(null);
              setLinedUpFaculty([]);
              setIsCreateModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Assign New Directive / Task
          </button>
        </div>
      </div>

      {/* Advanced Task Filters Bar */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-500" />
            <h3 className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)]">Filter Directives by HOD, Event & Priority</h3>
          </div>
          <button
            onClick={() => {
              setFilterFacultyId('all');
              setFilterEventId('all');
              setFilterDateType('all');
              setFilterCustomFrom('');
              setFilterCustomTo('');
              setFilterStatus('all');
              setFilterPriority('all');
              setFilterSearch('');
            }}
            className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Search Directives</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="glass-input pl-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Department Head</label>
            <select
              value={filterFacultyId}
              onChange={e => setFilterFacultyId(e.target.value)}
              className="glass-input text-xs"
            >
              <option value="all">All Department Heads</option>
              {facultyList.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.department || 'HOD'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="glass-input text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="submitted">Report Submitted</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="glass-input text-xs"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)] glass-panel">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading VC directives...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)] glass-panel">
            No directives found matching current filters.
          </div>
        ) : (
          tasks.map(t => renderTaskCard(t))
        )}
      </div>

      {/* Create Task Modal with Faculty Lineup */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-500" />
                  {parentTaskIdForSubtask ? 'Create Nested Subtask' : 'Assign New Directive & Line Up Faculty'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Vice Chancellor's Office Directive Allocation</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Directive / Task Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Conduct Annual Technical Symposium & Industry Conclave" className="glass-input" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Scope & Detailed Instructions</label>
                  <ImproveEnglishButton text={description} onImproved={setDescription} context="Directive instructions from Vice Chancellor for Department Head and faculty" />
                </div>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide detailed objectives, deliverables, and guidelines..." className="glass-input" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Department Head (Assignee)
                  </label>
                  <select required value={assignedTo} onChange={e => handleAssigneeChange(e.target.value ? Number(e.target.value) : '')} className="glass-input">
                    <option value="">-- Select HOD --</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.department || 'HOD'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as any)} className="glass-input">
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Points Reward</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={pointsReward}
                    onChange={e => setPointsReward(Number(e.target.value))}
                    className="glass-input"
                  />
                </div>
              </div>

              {/* Department Faculty Lineup Interactive Section */}
              <div className="p-4 bg-[var(--card-bg-to)] rounded-2xl border border-[var(--panel-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Line Up Department Faculty in this Task
                    </label>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {linedUpFaculty.length} Faculty Selected
                  </span>
                </div>

                <p className="text-[11px] text-[var(--text-muted)]">
                  Select faculty members from the department roster to participate in this task. Lined-up faculty will receive points upon task approval.
                </p>

                {loadingRoster ? (
                  <div className="py-4 text-center text-xs text-[var(--text-muted)]">Loading department faculty roster...</div>
                ) : deptFacultyRoster.length > 0 ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Filter department faculty by name..."
                      value={facultySearch}
                      onChange={e => setFacultySearch(e.target.value)}
                      className="glass-input text-xs py-1.5"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {deptFacultyRoster
                        .filter(f => f.name.toLowerCase().includes(facultySearch.toLowerCase()))
                        .map(fac => {
                          const isSelected = linedUpFaculty.some(lf => lf.faculty_id === fac.id);
                          const currentLineupItem = linedUpFaculty.find(lf => lf.faculty_id === fac.id);

                          return (
                            <div
                              key={fac.id}
                              className={`p-2 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                                isSelected
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-[var(--text-primary)]'
                                  : 'bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-emerald-500/30'
                              }`}
                            >
                              <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleFacultyLineup(fac)}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="truncate">
                                  <div className="font-semibold text-[var(--text-primary)] truncate">{fac.name}</div>
                                  <div className="text-[10px] text-[var(--text-muted)]">{fac.designation || 'Faculty'} • {fac.employee_id || fac.email}</div>
                                </div>
                              </label>

                              {isSelected && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <input
                                    type="text"
                                    value={currentLineupItem?.role || 'Coordinator'}
                                    onChange={e => updateFacultyRole(fac.id, e.target.value)}
                                    placeholder="Duty Role"
                                    className="glass-input text-[11px] py-1 px-2 w-32 font-medium"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 text-xs text-[var(--text-muted)]">
                    {assignedTo ? 'No faculty found in this department.' : 'Select a Department Head above to load their faculty roster.'}
                  </div>
                )}
              </div>

              {/* Task Time Limit / Window */}
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/50 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Directive Timeline & Deadlines
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Start Time
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
                      Deadline / Due Date
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
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Assign Directive & Notify Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Submission / Completion Report Modal */}
      {selectedTaskForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel p-6 shadow-2xl relative space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Review Task Completion Report</h3>
                <p className="text-xs text-[var(--text-muted)]">{selectedTaskForReview.title}</p>
              </div>
              <button onClick={() => setSelectedTaskForReview(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[var(--text-muted)]">Assigned HOD:</span>{' '}
                  <strong className="text-[var(--text-primary)]">{selectedTaskForReview.assignee?.name}</strong>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Department:</span>{' '}
                  <strong className="text-emerald-500">{selectedTaskForReview.department_name || selectedTaskForReview.assignee?.department || 'Department'}</strong>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Reward:</span>{' '}
                  <strong className="text-amber-500">+{selectedTaskForReview.points_reward || 10} pts</strong>
                </div>
              </div>

              {/* Lined-up faculty roster on this task */}
              {selectedTaskForReview.lined_up_faculty && selectedTaskForReview.lined_up_faculty.length > 0 && (
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-500/20 space-y-2">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Lined-Up Faculty Team ({selectedTaskForReview.lined_up_faculty.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedTaskForReview.lined_up_faculty.map((fac, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-[var(--panel-bg)] border border-emerald-500/30 text-xs flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-primary)]">{fac.faculty_name}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">{fac.role || 'Coordinator'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Completion Report Details */}
              {selectedTaskForReview.completion_report && (
                <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-300 dark:border-blue-900/50 space-y-3">
                  <h4 className="font-bold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500" /> Executive Completion Report Summary
                  </h4>
                  {selectedTaskForReview.completion_report.summary && (
                    <div>
                      <div className="text-[11px] font-bold text-[var(--text-secondary)]">Work Outcomes & Summary:</div>
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed mt-1">
                        {selectedTaskForReview.completion_report.summary}
                      </p>
                    </div>
                  )}

                  {selectedTaskForReview.completion_report.achievements && (
                    <div>
                      <div className="text-[11px] font-bold text-[var(--text-secondary)]">Key Achievements & Impact:</div>
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed mt-1">
                        {selectedTaskForReview.completion_report.achievements}
                      </p>
                    </div>
                  )}

                  {selectedTaskForReview.completion_report.faculty_contributions && (
                    <div>
                      <div className="text-[11px] font-bold text-[var(--text-secondary)]">Faculty Duty Fulfillment:</div>
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed mt-1">
                        {selectedTaskForReview.completion_report.faculty_contributions}
                      </p>
                    </div>
                  )}

                  {selectedTaskForReview.completion_report.file_url && (
                    <div className="pt-2 border-t border-blue-500/20">
                      <div className="text-[11px] font-bold text-[var(--text-secondary)] mb-1">Attached Evidence & Documentation:</div>
                      <ProofViewer
                        url={selectedTaskForReview.completion_report.file_url}
                        fileName={selectedTaskForReview.completion_report.file_name}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submissions list */}
              {selectedTaskForReview.submissions.map((sub, idx) => (
                <div key={sub.id} className="p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Submission Document #{idx + 1}</span>
                    <span>{new Date(sub.submitted_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{sub.description}</p>
                  
                  {sub.file_url && (
                    <div className="pt-1">
                      <ProofViewer url={sub.file_url} fileName={sub.file_name} />
                    </div>
                  )}
                </div>
              ))}

              <form onSubmit={handleDecline} className="pt-3 space-y-3 border-t border-[var(--panel-border)]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Decline Remarks <span className="text-rose-500">(Mandatory if requesting revision)</span>
                  </label>
                  <ImproveEnglishButton text={declineRemarks} onImproved={setDeclineRemarks} context="Feedback remarks explaining why task report needs revision" />
                </div>
                <textarea
                  rows={2}
                  value={declineRemarks}
                  onChange={e => setDeclineRemarks(e.target.value)}
                  placeholder="Explain required changes or missing documentation..."
                  className="glass-input"
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="btn-crimson text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Return with Remarks (-3 pts)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedTaskForReview.id)}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Report (+{selectedTaskForReview.points_reward || 10} pts)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
