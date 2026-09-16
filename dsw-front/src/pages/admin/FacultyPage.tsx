import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { ProofViewer } from '../../components/tasks/ProofViewer';
import {
  UserPlus, Search, Shield, Award, CheckCircle2, Clock, X, BarChart3,
  Trash2, Calendar, RotateCcw, Filter, CheckSquare, Sparkles, FileCheck,
  XCircle, ChevronDown, User as UserIcon, RefreshCw, ArrowRight, CornerDownRight
} from 'lucide-react';

interface PeriodStats {
  total_assigned: number;
  completed_approved: number;
  pending_count: number;
  declined_count: number;
  completion_rate_percentage: number;
  performance_score: number;
  period_label: string;
  reset_date?: string;
}

interface FacultyStats {
  faculty_id: number;
  faculty_name: string;
  total_assigned: number;
  completed_approved: number;
  pending_count: number;
  declined_count: number;
  completion_rate_percentage: number;
  performance_score: number;
  weekly?: PeriodStats;
  monthly?: PeriodStats;
  all_time?: PeriodStats;
}

interface TaskSubmission {
  id: number;
  submitted_by: number;
  submitter?: User;
  description: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
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
  assignee?: User;
  assigned_by: number;
  start_date?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'declined';
  created_at: string;
  submissions: TaskSubmission[];
}

interface EventItem {
  id: number;
  title: string;
}

export const FacultyPage: React.FC = () => {
  // Active Main View Tab: 'directory' | 'tasks'
  const [activeMainTab, setActiveMainTab] = useState<'directory' | 'tasks'>('directory');

  // Directory State
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [searchDirectory, setSearchDirectory] = useState('');
  const [loadingDirectory, setLoadingDirectory] = useState(true);

  // Tasks Filter State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Filters for Faculty Tasks: Faculty, Event, Date, Status, Priority, Search
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('all');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [dateFilterType, setDateFilterType] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'submitted' | 'approved' | 'declined'>('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statsModalData, setStatsModalData] = useState<FacultyStats | null>(null);
  const [activePeriodTab, setActivePeriodTab] = useState<'monthly' | 'weekly' | 'all_time'>('monthly');

  // Add Faculty Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('Faculty@123');

  // Fetch Faculty List
  const fetchFaculty = async () => {
    setLoadingDirectory(true);
    try {
      const data = await apiRequest<User[]>(`/users/faculty${searchDirectory ? `?search=${searchDirectory}` : ''}`);
      setFacultyList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDirectory(false);
    }
  };

  // Fetch Tasks with Current Filters
  const fetchFacultyTasks = async () => {
    setLoadingTasks(true);
    try {
      const params = new URLSearchParams();

      if (selectedFacultyId !== 'all') {
        params.append('assigned_to', selectedFacultyId);
      }
      if (selectedEventId !== 'all') {
        params.append('event_id', selectedEventId);
      }
      if (taskStatusFilter !== 'all') {
        params.append('status_filter', taskStatusFilter);
      }
      if (taskPriorityFilter !== 'all') {
        params.append('priority', taskPriorityFilter);
      }
      if (taskSearchQuery.trim()) {
        params.append('search', taskSearchQuery.trim());
      }

      // Compute date parameters
      const now = new Date();
      if (dateFilterType === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
        params.append('from_date', startOfDay);
        params.append('to_date', endOfDay);
      } else if (dateFilterType === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        params.append('from_date', weekAgo);
      } else if (dateFilterType === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        params.append('from_date', monthAgo);
      } else if (dateFilterType === 'custom') {
        if (customFromDate) params.append('from_date', new Date(customFromDate).toISOString());
        if (customToDate) params.append('to_date', new Date(customToDate + 'T23:59:59').toISOString());
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const [tasksData, eventsData] = await Promise.all([
        apiRequest<TaskItem[]>(`/tasks${queryString}`),
        eventsList.length > 0 ? Promise.resolve(eventsList) : apiRequest<EventItem[]>('/events').catch(() => [])
      ]);

      setTasks(tasksData);
      if (eventsList.length === 0) setEventsList(eventsData);
    } catch (e) {
      console.error('Failed to fetch faculty tasks:', e);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [searchDirectory]);

  useEffect(() => {
    if (activeMainTab === 'tasks') {
      fetchFacultyTasks();
    }
  }, [
    activeMainTab,
    selectedFacultyId,
    selectedEventId,
    dateFilterType,
    customFromDate,
    customToDate,
    taskStatusFilter,
    taskPriorityFilter,
    taskSearchQuery
  ]);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newFac = await apiRequest<User>('/users/faculty', 'POST', {
        name,
        email,
        phone,
        department,
        designation,
        employee_id: employeeId || `GU-${Date.now().toString().slice(-4)}`,
        password
      });
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setFacultyList(prev => [...prev, newFac].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      alert(err.message || 'Failed to add faculty member');
    }
  };

  const handleViewStats = async (facId: number) => {
    try {
      const stats = await apiRequest<FacultyStats>(`/users/faculty/${facId}/stats`);
      setStatsModalData(stats);
      setActivePeriodTab('monthly');
    } catch (e: any) {
      alert('Failed to fetch faculty stats');
    }
  };

  const handleDeleteFaculty = async (facultyId: number) => {
    if (!window.confirm("Are you sure you want to deactivate and remove this faculty member?")) return;
    try {
      await apiRequest(`/users/faculty/${facultyId}`, 'DELETE');
      setFacultyList(prev => prev.filter(f => f.id !== facultyId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete faculty member.');
    }
  };

  const handleFilterTasksForFaculty = (facultyId: number) => {
    setSelectedFacultyId(String(facultyId));
    setActiveMainTab('tasks');
  };

  const handleResetFilters = () => {
    setSelectedFacultyId('all');
    setSelectedEventId('all');
    setDateFilterType('all');
    setCustomFromDate('');
    setCustomToDate('');
    setTaskStatusFilter('all');
    setTaskPriorityFilter('all');
    setTaskSearchQuery('');
  };

  const getActiveStats = (stats: FacultyStats): PeriodStats => {
    if (activePeriodTab === 'weekly' && stats.weekly) return stats.weekly;
    if (activePeriodTab === 'monthly' && stats.monthly) return stats.monthly;
    if (activePeriodTab === 'all_time' && stats.all_time) return stats.all_time;
    return {
      total_assigned: stats.total_assigned,
      completed_approved: stats.completed_approved,
      pending_count: stats.pending_count,
      declined_count: stats.declined_count,
      completion_rate_percentage: stats.completion_rate_percentage,
      performance_score: stats.performance_score,
      period_label: activePeriodTab === 'weekly' ? 'Weekly Window' : activePeriodTab === 'monthly' ? 'Monthly Cycle (Resets 9th)' : 'All-Time Record',
      reset_date: stats.monthly?.reset_date
    };
  };

  const activeStats = statsModalData ? getActiveStats(statsModalData) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Main Tabs */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Faculty Governance & Duty Tracking
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Faculty Management & Task Filters
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              Manage faculty credentials, track duty completion metrics, and filter faculty tasks by Date, Faculty Name, and Event.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 font-bold shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Faculty Member</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[var(--panel-border)]">
          <button
            onClick={() => setActiveMainTab('directory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMainTab === 'directory'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-[var(--card-bg-to)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--panel-border)]'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Faculty Directory ({facultyList.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMainTab === 'tasks'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-[var(--card-bg-to)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--panel-border)]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filter Tasks (By Date, Faculty, Event)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FACULTY DIRECTORY VIEW */}
      {/* ========================================================================= */}
      {activeMainTab === 'directory' && (
        <div className="space-y-4">
          {/* Search Filter */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchDirectory}
              onChange={e => setSearchDirectory(e.target.value)}
              placeholder="Search faculty by name, email, or department..."
              className="glass-input pl-9 text-xs py-2.5 w-full"
            />
            {searchDirectory && (
              <button
                onClick={() => setSearchDirectory('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Faculty Table */}
          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm text-[var(--text-secondary)]">
                <thead className="bg-[var(--card-bg-to)] text-xs uppercase font-bold text-[var(--text-primary)] border-b border-[var(--panel-border)]">
                  <tr>
                    <th className="p-4">Faculty Member</th>
                    <th className="p-4">Department & Designation</th>
                    <th className="p-4">Employee ID</th>
                    <th className="p-4">Email / Contact</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--panel-border)]">
                  {loadingDirectory ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[var(--text-muted)]">
                        <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                        Loading faculty members...
                      </td>
                    </tr>
                  ) : facultyList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[var(--text-muted)]">
                        No faculty members found.
                      </td>
                    </tr>
                  ) : (
                    facultyList.map((f) => (
                      <tr key={f.id} className="hover:bg-emerald-500/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                              {f.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">{f.name}</div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Faculty Coordinator</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-[var(--text-primary)] font-medium text-xs">{f.department || 'General'}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{f.designation || 'Staff'}</div>
                        </td>
                        <td className="p-4 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          {f.employee_id || 'N/A'}
                        </td>
                        <td className="p-4 text-xs">
                          <div className="text-[var(--text-primary)] font-medium">{f.email}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{f.phone || 'No phone recorded'}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Filter Tasks for this Faculty */}
                            <button
                              onClick={() => handleFilterTasksForFaculty(f.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold transition-all flex items-center gap-1"
                              title="Filter tasks assigned to this faculty"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>View Tasks</span>
                            </button>

                            {/* View Duty Analytics */}
                            <button
                              onClick={() => handleViewStats(f.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors"
                              title="View Duty Analytics"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>

                            {/* Delete Faculty */}
                            <button
                              onClick={() => handleDeleteFaculty(f.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors"
                              title="Delete Faculty Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ADVANCED FACULTY TASK FILTERS (BY DATE, FACULTY NAME, EVENT) */}
      {/* ========================================================================= */}
      {activeMainTab === 'tasks' && (
        <div className="space-y-6">
          {/* Filter Bar Controls */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--panel-border)]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-500" />
                <h3 className="font-extrabold text-sm text-[var(--text-primary)]">Filter Faculty Tasks</h3>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-emerald-500 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset All Filters
              </button>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* 1. Filter by Faculty Name */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                  Filter by Faculty Name
                </label>
                <select
                  value={selectedFacultyId}
                  onChange={e => setSelectedFacultyId(e.target.value)}
                  className="glass-input text-xs w-full font-medium"
                >
                  <option value="all">-- All Faculty Members ({facultyList.length}) --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Filter by Event */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  Filter by Event
                </label>
                <select
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                  className="glass-input text-xs w-full font-medium"
                >
                  <option value="all">-- All Events ({eventsList.length}) --</option>
                  {eventsList.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Filter by Date */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Filter by Date
                </label>
                <select
                  value={dateFilterType}
                  onChange={e => setDateFilterType(e.target.value as any)}
                  className="glass-input text-xs w-full font-medium"
                >
                  <option value="all">All Dates / Any Time</option>
                  <option value="today">Today's Tasks</option>
                  <option value="week">This Week (Last 7 Days)</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Date Range...</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range Pickers (if custom selected) */}
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

            {/* Additional Secondary Filters: Status & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--panel-border)]">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                  Status Filter
                </label>
                <select
                  value={taskStatusFilter}
                  onChange={e => setTaskStatusFilter(e.target.value as any)}
                  className="glass-input text-xs w-full"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted (Needs Review)</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                  Priority Filter
                </label>
                <select
                  value={taskPriorityFilter}
                  onChange={e => setTaskPriorityFilter(e.target.value as any)}
                  className="glass-input text-xs w-full"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                  Search Keywords
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={taskSearchQuery}
                    onChange={e => setTaskSearchQuery(e.target.value)}
                    placeholder="Search title, description..."
                    className="glass-input pl-8 text-xs py-2 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] px-1">
            <span>
              Showing <strong>{tasks.length}</strong> tasks matching filters
              {selectedFacultyId !== 'all' && (
                <span className="ml-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                  Faculty: {facultyList.find(f => String(f.id) === selectedFacultyId)?.name}
                </span>
              )}
              {selectedEventId !== 'all' && (
                <span className="ml-1.5 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                  Event: {eventsList.find(ev => String(ev.id) === selectedEventId)?.title}
                </span>
              )}
            </span>

            <button
              onClick={fetchFacultyTasks}
              disabled={loadingTasks}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <RefreshCw className={`w-3 h-3 ${loadingTasks ? 'animate-spin' : ''}`} /> Refresh Results
            </button>
          </div>

          {/* Filtered Tasks Cards List */}
          <div className="space-y-4">
            {loadingTasks ? (
              <div className="p-12 text-center glass-panel space-y-3">
                <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-medium text-[var(--text-secondary)]">Filtering faculty tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-12 text-center glass-panel space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">No matching tasks found</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  No tasks matched the selected criteria (Date, Faculty, Event). Try resetting your filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 mt-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                </button>
              </div>
            ) : (
              tasks.map(t => {
                const isSelfCreated = t.assigned_by === t.assigned_to || t.task_type === 'self_created';
                const latestSub = t.submissions && t.submissions.length > 0 ? t.submissions[t.submissions.length - 1] : null;

                return (
                  <div
                    key={t.id}
                    className={`glass-panel p-5 space-y-3.5 border-l-4 transition-all ${
                      t.status === 'approved'
                        ? 'border-l-emerald-500'
                        : t.status === 'declined'
                        ? 'border-l-rose-500'
                        : isSelfCreated
                        ? 'border-l-purple-500'
                        : 'border-l-blue-500'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[var(--panel-border)]">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {t.assignee?.name?.charAt(0) || 'F'}
                        </div>
                        <div>
                          <span className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)]">
                            {t.assignee?.name || 'Faculty Member'}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] ml-2">
                            ({t.assignee?.department || 'Department'})
                          </span>
                        </div>

                        {isSelfCreated ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            Self-Created Task
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                            Assigned Duty
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                            : t.priority === 'medium'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                        }`}>
                          {t.priority}
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          t.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : t.status === 'declined'
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Task Title & Description */}
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">{t.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed whitespace-pre-line">
                        {t.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Metadata: Window & Event */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {(t.start_date || t.due_date) && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-700 dark:text-blue-300 text-[11px] font-medium">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span>
                            {t.start_date ? new Date(t.start_date).toLocaleDateString() : 'Immediate'} → <strong className="text-amber-600 dark:text-amber-400">{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'Open'}</strong>
                          </span>
                        </div>
                      )}

                      {t.event_title && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-400/20 text-purple-700 dark:text-purple-300 text-[11px] font-semibold">
                          <Calendar className="w-3 h-3 text-purple-500" />
                          Event: {t.event_title}
                        </div>
                      )}
                    </div>

                    {/* Proof Attachment if exists */}
                    {latestSub?.file_url && (
                      <div className="pt-1">
                        <ProofViewer url={latestSub.file_url} fileName={latestSub.file_name} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD FACULTY MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-5 sm:p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Register New Faculty Member</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Rajesh Sharma" className="glass-input" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email Address *</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rajesh.cse@geeta.edu.in" className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Phone Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className="glass-input" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Department</label>
                  <input required type="text" value={department} onChange={e => setDepartment(e.target.value)} className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Designation</label>
                  <input required type="text" value={designation} onChange={e => setDesignation(e.target.value)} className="glass-input" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Employee ID</label>
                  <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="GU-CSE-099" className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Initial Password</label>
                  <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="glass-input" />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Register Faculty</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DUTY ANALYTICS STATS MODAL */}
      {/* ========================================================================= */}
      {statsModalData && activeStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{statsModalData.faculty_name}</h3>
                <p className="text-xs text-[var(--text-muted)]">Duty Performance & Completion Analytics</p>
              </div>
              <button onClick={() => setStatsModalData(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Period Selector Tabs */}
            <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--panel-border)] gap-1 mb-4">
              <button
                onClick={() => setActivePeriodTab('monthly')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activePeriodTab === 'monthly'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Monthly (9th Reset)
              </button>
              <button
                onClick={() => setActivePeriodTab('weekly')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activePeriodTab === 'weekly'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Weekly
              </button>
              <button
                onClick={() => setActivePeriodTab('all_time')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activePeriodTab === 'all_time'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> All-Time
              </button>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-xl">
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">Completed & Approved</span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  {activeStats.completed_approved}
                </div>
              </div>
              <div className="p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-xl">
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">Completion Rate</span>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
                  {activeStats.completion_rate_percentage}%
                </div>
              </div>
              <div className="p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-xl">
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">Pending Duties</span>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
                  {activeStats.pending_count}
                </div>
              </div>
              <div className="p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-xl">
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">Performance Score</span>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 font-mono">
                  {activeStats.performance_score} pts
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--panel-border)] flex justify-between items-center">
              <button
                onClick={() => {
                  setStatsModalData(null);
                  handleFilterTasksForFaculty(statsModalData.faculty_id);
                }}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" /> View All Tasks for this Faculty
              </button>
              <button onClick={() => setStatsModalData(null)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
