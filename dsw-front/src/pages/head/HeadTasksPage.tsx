import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  CheckSquare, Plus, CheckCircle2, XCircle, Clock, AlertCircle,
  FileText, Calendar, Search, Filter, Send, ArrowRight,
  ShieldCheck, Sparkles, Building2, Upload, Eye, RefreshCw,
  Users, Check, X, Award, Link as LinkIcon
} from 'lucide-react';
import { ProofViewer } from '../../components/tasks/ProofViewer';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';

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
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'declined';
  created_at: string;
  lined_up_faculty?: LinedUpFaculty[];
  completion_report?: CompletionReport;
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

interface FacultyUser {
  id: number;
  name: string;
  email: string;
  employee_id?: string;
  designation?: string;
  department?: string;
  department_id?: number;
}

export const HeadTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'submitted' | 'approved'>('all');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Department Faculty Roster
  const [departmentFaculty, setDepartmentFaculty] = useState<FacultyUser[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  // Propose / Create Task Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    points_reward: 15,
  });
  const [creatingTask, setCreatingTask] = useState(false);

  // Line Up Faculty Modal state
  const [selectedTaskForLineup, setSelectedTaskForLineup] = useState<TaskItem | null>(null);
  const [currentLineup, setCurrentLineup] = useState<LinedUpFaculty[]>([]);
  const [lineupSearch, setLineupSearch] = useState('');
  const [savingLineup, setSavingLineup] = useState(false);

  // Submit Completion Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedTaskToSubmit, setSelectedTaskToSubmit] = useState<TaskItem | null>(null);
  const [reportSummary, setReportSummary] = useState('');
  const [reportAchievements, setReportAchievements] = useState('');
  const [reportFacultyNotes, setReportFacultyNotes] = useState('');
  const [reportFileUrl, setReportFileUrl] = useState('');
  const [reportFileName, setReportFileName] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // View Details Modal state
  const [viewingTask, setViewingTask] = useState<TaskItem | null>(null);

  useEffect(() => {
    fetchDepartmentTasks();
    fetchDepartmentFacultyRoster();
  }, [user]);

  const fetchDepartmentTasks = async () => {
    setLoading(true);
    try {
      const allTasks = await apiRequest<TaskItem[]>('/tasks');
      setTasks(allTasks);
    } catch (err) {
      console.error('Failed to load department directives:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentFacultyRoster = async () => {
    setLoadingFaculty(true);
    try {
      let roster: FacultyUser[] = [];
      if (user?.department_id) {
        roster = await apiRequest<FacultyUser[]>(`/departments/${user.department_id}/faculty`);
      } else {
        roster = await apiRequest<FacultyUser[]>('/users/faculty');
      }
      setDepartmentFaculty(roster);
    } catch (err) {
      console.error('Failed to load faculty roster:', err);
    } finally {
      setLoadingFaculty(false);
    }
  };

  // Open Line Up Modal
  const openLineupModal = (task: TaskItem) => {
    setSelectedTaskForLineup(task);
    setCurrentLineup(task.lined_up_faculty || []);
    setLineupSearch('');
  };

  // Toggle faculty in Lineup
  const toggleFacultyInLineup = (fac: FacultyUser) => {
    setCurrentLineup(prev => {
      const exists = prev.some(f => f.faculty_id === fac.id);
      if (exists) {
        return prev.filter(f => f.faculty_id !== fac.id);
      } else {
        return [
          ...prev,
          {
            faculty_id: fac.id,
            faculty_name: fac.name,
            employee_id: fac.employee_id || '',
            designation: fac.designation || 'Faculty Member',
            email: fac.email,
            role: 'Faculty Coordinator',
            duty_status: 'assigned'
          }
        ];
      }
    });
  };

  const updateLineupRole = (facultyId: number, role: string) => {
    setCurrentLineup(prev =>
      prev.map(f => (f.faculty_id === facultyId ? { ...f, role } : f))
    );
  };

  // Save Line Up to Backend
  const handleSaveLineup = async () => {
    if (!selectedTaskForLineup) return;
    setSavingLineup(true);
    try {
      const updated = await apiRequest<TaskItem>(`/tasks/${selectedTaskForLineup.id}/lineup`, 'PUT', {
        lined_up_faculty: currentLineup
      });
      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      setSelectedTaskForLineup(null);
      alert(`🎉 Successfully updated faculty lineup for "${selectedTaskForLineup.title}"! Lined-up faculty members have been notified.`);
    } catch (err: any) {
      alert(`Failed to save lineup: ${err.message}`);
    } finally {
      setSavingLineup(false);
    }
  };

  // Open Submit Report Modal
  const openReportModal = (task: TaskItem) => {
    setSelectedTaskToSubmit(task);
    const existingRep = task.completion_report;
    const latestSub = task.submissions && task.submissions.length > 0 ? task.submissions[task.submissions.length - 1] : null;

    setReportSummary(existingRep?.summary || latestSub?.description || '');
    setReportAchievements(existingRep?.achievements || '');
    setReportFacultyNotes(existingRep?.faculty_contributions || '');
    setReportFileUrl(existingRep?.file_url || latestSub?.file_url || '');
    setReportFileName(existingRep?.file_name || latestSub?.file_name || '');
    setShowReportModal(true);
  };

  // Submit Completion Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskToSubmit) return;
    if (!reportSummary.trim()) {
      alert('Please provide a summary of the executed task outcomes.');
      return;
    }

    setSubmittingReport(true);
    try {
      const updated = await apiRequest<TaskItem>(`/tasks/${selectedTaskToSubmit.id}/submit-report`, 'POST', {
        description: reportSummary.trim(),
        achievements: reportAchievements.trim(),
        faculty_contributions: reportFacultyNotes.trim(),
        file_url: reportFileUrl.trim() || undefined,
        file_name: reportFileName.trim() || undefined,
        lined_up_faculty: selectedTaskToSubmit.lined_up_faculty || []
      });

      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      setShowReportModal(false);
      alert(`🎉 Official Completion Report for "${selectedTaskToSubmit.title}" has been submitted to the VC Office for approval!`);
    } catch (err: any) {
      alert(`Error submitting report: ${err.message}`);
    } finally {
      setSubmittingReport(false);
    }
  };

  // Create / Propose Deliverable
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTask(true);
    try {
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        due_date: taskForm.due_date ? new Date(taskForm.due_date).toISOString() : undefined,
        points_reward: Number(taskForm.points_reward) || 15,
        assigned_to: user?.id,
        task_type: 'department_deliverable',
      };

      await apiRequest('/tasks', 'POST', payload);
      setShowCreateModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        points_reward: 15,
      });
      await fetchDepartmentTasks();
      alert('Proposal submitted to VC Office!');
    } catch (err: any) {
      alert(`Error proposing task: ${err.message}`);
    } finally {
      setCreatingTask(false);
    }
  };

  // Filter Tasks by active tab
  const filteredByTab = tasks.filter((t) => {
    if (activeTab === 'pending') return t.status === 'pending' || t.status === 'in_progress';
    if (activeTab === 'submitted') return t.status === 'submitted';
    if (activeTab === 'approved') return t.status === 'approved';
    return true;
  });

  const filteredList = filteredByTab.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingCount = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const submittedCount = tasks.filter((t) => t.status === 'submitted').length;
  const approvedCount = tasks.filter((t) => t.status === 'approved').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" /> Department Head Executive Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            VC Directives & Faculty Lineup Hub
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Execute mandates assigned by the VC Office, line up department faculty members, and submit verified completion reports with proof.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Propose Deliverable to VC
          </button>
          <button
            onClick={fetchDepartmentTasks}
            className="p-2.5 rounded-xl bg-[var(--panel-bg)] hover:bg-emerald-500/10 border border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-emerald-400 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--panel-bg)] p-3 rounded-2xl border border-[var(--panel-border)] backdrop-blur-md">
        <div className="flex items-center p-1 rounded-xl bg-black/20 border border-[var(--panel-border)] w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Directives ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'pending'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Action Required ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'submitted'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Report Submitted ({submittedCount})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              activeTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Approved ({approvedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search directives & deliverables..."
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
          <p className="text-xs text-[var(--text-secondary)]">Fetching VC directives & department tasks...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)] glass-panel">
          No directives found matching current view.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((t) => {
            const latestSub = t.submissions && t.submissions.length > 0 ? t.submissions[t.submissions.length - 1] : null;
            const hasReport = Boolean(t.completion_report && Object.keys(t.completion_report).length > 0);
            const lineup = t.lined_up_faculty || [];

            return (
              <div
                key={t.id}
                className="p-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] hover:border-emerald-500/30 backdrop-blur-xl shadow-md transition-all flex flex-col space-y-4 group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
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
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold capitalize ${
                          t.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : t.status === 'submitted'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : t.status === 'declined'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {t.status === 'submitted' ? 'Report Submitted' : t.status}
                      </span>

                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        +{t.points_reward || 10} Department Points
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                      {t.title}
                    </h3>

                    {t.description && (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {t.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--text-muted)] pt-1">
                      {t.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          Deadline: <b className="text-[var(--text-primary)]">{new Date(t.due_date).toLocaleDateString()}</b>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Assigned by VC Office: {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Header */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap self-start md:self-center">
                    <button
                      onClick={() => openLineupModal(t)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      {lineup.length > 0 ? `Faculty Team (${lineup.length})` : 'Line Up Faculty'}
                    </button>

                    {t.status !== 'approved' && (
                      <button
                        onClick={() => openReportModal(t)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {t.status === 'submitted' ? 'Update Report' : 'Submit Task Report'}
                      </button>
                    )}

                    {(hasReport || latestSub?.file_url) && (
                      <button
                        onClick={() => setViewingTask(t)}
                        className="px-3 py-2 rounded-xl bg-[var(--panel-border)] hover:bg-emerald-500/15 text-xs font-bold text-[var(--text-primary)] transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" /> View Report
                      </button>
                    )}
                  </div>
                </div>

                {/* Lined-Up Faculty Roster preview */}
                {lineup.length > 0 && (
                  <div className="p-3 bg-black/20 rounded-xl border border-[var(--panel-border)] space-y-1.5">
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Lined-Up Department Faculty Team:
                      </span>
                      <button onClick={() => openLineupModal(t)} className="text-[10px] text-[var(--text-muted)] hover:text-emerald-400 underline">
                        Edit Team
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {lineup.map((f, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--panel-bg)] border border-emerald-500/30 text-xs text-[var(--text-primary)]"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">
                            {f.faculty_name.charAt(0)}
                          </div>
                          <span className="font-semibold">{f.faculty_name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono">
                            {f.role || 'Coordinator'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VC Remarks Banner if any */}
                {latestSub?.review_remarks && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                    <span className="font-bold">VC Office Review Remarks: </span>
                    {latestSub.review_remarks}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Line Up Faculty Modal */}
      {selectedTaskForLineup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl glass-panel p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  Line Up Faculty Team
                </h3>
                <p className="text-xs text-[var(--text-muted)]">{selectedTaskForLineup.title}</p>
              </div>
              <button onClick={() => setSelectedTaskForLineup(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Assign faculty members from your department to execute this directive. Lined-up faculty will receive points credited upon VC approval.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search department faculty..."
                value={lineupSearch}
                onChange={e => setLineupSearch(e.target.value)}
                className="glass-input text-xs py-2"
              />

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {departmentFaculty
                  .filter(f => f.name.toLowerCase().includes(lineupSearch.toLowerCase()))
                  .map(fac => {
                    const isSelected = currentLineup.some(lf => lf.faculty_id === fac.id);
                    const currentItem = currentLineup.find(lf => lf.faculty_id === fac.id);

                    return (
                      <div
                        key={fac.id}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-[var(--text-primary)]'
                            : 'bg-[var(--card-bg-to)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-emerald-500/30'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFacultyInLineup(fac)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="truncate">
                            <div className="font-bold text-[var(--text-primary)]">{fac.name}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{fac.designation || 'Faculty'} • {fac.employee_id || fac.email}</div>
                          </div>
                        </label>

                        {isSelected && (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-[var(--text-muted)]">Role:</span>
                            <input
                              type="text"
                              value={currentItem?.role || 'Coordinator'}
                              onChange={e => updateLineupRole(fac.id, e.target.value)}
                              placeholder="e.g. Lead Incharge"
                              className="glass-input text-xs py-1 px-2.5 w-36 font-semibold"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--panel-border)] flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-bold">
                {currentLineup.length} Faculty Selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForLineup(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLineup}
                  disabled={savingLineup}
                  className="btn-primary"
                >
                  {savingLineup ? 'Saving Lineup...' : 'Save & Line Up Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Completion Report Modal */}
      {showReportModal && selectedTaskToSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  Submit Task Completion Report to VC Office
                </h3>
                <p className="text-xs text-[var(--text-muted)]">{selectedTaskToSubmit.title}</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Work Outcomes & Executive Summary <span className="text-emerald-500">*</span>
                  </label>
                  <ImproveEnglishButton text={reportSummary} onImproved={setReportSummary} context="Task execution outcome and executive summary for Vice Chancellor review" />
                </div>
                <textarea
                  required
                  rows={3}
                  value={reportSummary}
                  onChange={e => setReportSummary(e.target.value)}
                  placeholder="Describe in detail how the directive was executed, milestones achieved, and final results..."
                  className="glass-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                      Key Metrics & Impact (Optional)
                    </label>
                    <ImproveEnglishButton text={reportAchievements} onImproved={setReportAchievements} context="Achievements and numbers achieved during task" />
                  </div>
                  <textarea
                    rows={2}
                    value={reportAchievements}
                    onChange={e => setReportAchievements(e.target.value)}
                    placeholder="e.g. 150 attendees, 12 projects presented..."
                    className="glass-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                      Faculty Duty Fulfillment
                    </label>
                    <ImproveEnglishButton text={reportFacultyNotes} onImproved={setReportFacultyNotes} context="Notes on faculty team contributions" />
                  </div>
                  <textarea
                    rows={2}
                    value={reportFacultyNotes}
                    onChange={e => setReportFacultyNotes(e.target.value)}
                    placeholder="Notes on duties fulfilled by lined-up faculty members..."
                    className="glass-input"
                  />
                </div>
              </div>

              {/* Lined-up faculty summary */}
              {selectedTaskToSubmit.lined_up_faculty && selectedTaskToSubmit.lined_up_faculty.length > 0 && (
                <div className="p-3 bg-emerald-50/10 rounded-xl border border-emerald-500/20 text-xs">
                  <div className="font-bold text-emerald-400 mb-1">Lined-Up Faculty Team ({selectedTaskToSubmit.lined_up_faculty.length}):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTaskToSubmit.lined_up_faculty.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[var(--panel-bg)] text-[var(--text-primary)] border border-emerald-500/30">
                        {f.faculty_name} ({f.role || 'Coordinator'})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Proof Document / Drive URL */}
              <div className="p-3.5 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-400" /> Supporting Proof Document / Drive Link / Photo
                </label>
                <input
                  type="url"
                  value={reportFileUrl}
                  onChange={e => setReportFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/... or image URL"
                  className="glass-input text-xs"
                />
                <input
                  type="text"
                  value={reportFileName}
                  onChange={e => setReportFileName(e.target.value)}
                  placeholder="Document Title (e.g. Final Event Report & Attendance Sheets.pdf)"
                  className="glass-input text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submittingReport ? 'Submitting to VC...' : 'Submit Report to VC Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Propose Deliverable Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  Propose Department Deliverable to VC
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Vice Chancellor Review & Approval</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Title</label>
                <input
                  required
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Industry Workshop on AI & Cloud Computing"
                  className="glass-input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Description & Objectives</label>
                  <ImproveEnglishButton text={taskForm.description} onImproved={txt => setTaskForm({ ...taskForm, description: txt })} context="Proposal for Vice Chancellor" />
                </div>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Explain the proposal, expected outcomes, and target audience..."
                  className="glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="glass-input"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="btn-primary"
                >
                  {creatingTask ? 'Submitting...' : 'Submit Proposal to VC Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Task / Report Details Modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl glass-panel p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Directive & Report Details</h3>
                <p className="text-xs text-[var(--text-muted)]">{viewingTask.title}</p>
              </div>
              <button onClick={() => setViewingTask(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-[var(--text-secondary)]">Instructions:</span>
                <p className="text-[var(--text-primary)] mt-1 leading-relaxed">{viewingTask.description || 'None'}</p>
              </div>

              {viewingTask.lined_up_faculty && viewingTask.lined_up_faculty.length > 0 && (
                <div className="p-3 bg-emerald-50/10 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="font-bold text-emerald-400">Lined-Up Faculty Team:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {viewingTask.lined_up_faculty.map((fac, idx) => (
                      <div key={idx} className="p-2 rounded bg-[var(--panel-bg)] border border-emerald-500/20">
                        <div className="font-semibold text-[var(--text-primary)]">{fac.faculty_name}</div>
                        <div className="text-[10px] text-emerald-400 font-mono">{fac.role || 'Coordinator'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingTask.completion_report && (
                <div className="p-3.5 bg-blue-50/10 rounded-xl border border-blue-500/30 space-y-2.5">
                  <div className="font-bold text-blue-300">Submitted Report:</div>
                  {viewingTask.completion_report.summary && (
                    <p className="text-[var(--text-primary)] leading-relaxed italic">
                      "{viewingTask.completion_report.summary}"
                    </p>
                  )}
                  {viewingTask.completion_report.file_url && (
                    <ProofViewer
                      url={viewingTask.completion_report.file_url}
                      fileName={viewingTask.completion_report.file_name}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end">
              <button onClick={() => setViewingTask(null)} className="btn-primary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
