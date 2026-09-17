import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { ProofViewer } from '../../components/tasks/ProofViewer';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  CheckSquare, Plus, CornerDownRight, CheckCircle2, XCircle, Clock,
  AlertCircle, FileText, User as UserIcon, Calendar, X, Eye, Pencil, Trash2,
  ClipboardCheck, Filter, RotateCcw, Search, Users, Building2, Sparkles,
  Award, Send, Check, ShieldCheck, CheckCheck, AlertTriangle, Zap
} from 'lucide-react';

const COMMON_DUTY_ROLES = [
  'Faculty Coordinator',
  'Technical Lead',
  'Stage & Venue Incharge',
  'Discipline & Seating',
  'Media & Documentation',
  'Student Liaison',
  'Hospitality & Protocol',
  'Logistics Incharge'
];

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

export interface CommitteeMember {
  role_name: string;
  faculty_id: number | '';
  faculty_name?: string;
  faculty_email?: string;
  faculty_department?: string;
  faculty_designation?: string;
  employee_id?: string;
  work_description?: string;
}

export interface EventItem {
  id: number;
  title: string;
  event_type?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  venue?: string;
  status?: string;
  core_committee?: CommitteeMember[];
}

interface DepartmentItem {
  id: number;
  name: string;
  code: string;
  category?: string;
  head_id?: number | null;
  head?: User | null;
  faculty_count?: number;
  completed_tasks_count?: number;
  pending_tasks_count?: number;
}

export const TasksPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>('all');
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

  // Create Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | ''>('');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');
  const [assignedHodUser, setAssignedHodUser] = useState<User | null>(null);
  const [showCustomAssigneeDropdown, setShowCustomAssigneeDropdown] = useState(false);
  const [eventId, setEventId] = useState<number | ''>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [pointsReward, setPointsReward] = useState<number>(10);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Faculty Lineup State for Create Form
  const [deptFacultyRoster, setDeptFacultyRoster] = useState<User[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [linedUpFaculty, setLinedUpFaculty] = useState<LinedUpFaculty[]>([]);
  const [facultySearch, setFacultySearch] = useState('');

  // Edit Modal State
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState<number | ''>('');
  const [editAssignedTo, setEditAssignedTo] = useState<number | ''>('');
  const [editAssignedHodUser, setEditAssignedHodUser] = useState<User | null>(null);
  const [editShowCustomAssigneeDropdown, setEditShowCustomAssigneeDropdown] = useState(false);
  const [editEventId, setEditEventId] = useState<number | ''>('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPointsReward, setEditPointsReward] = useState<number>(10);
  const [editLinedUpFaculty, setEditLinedUpFaculty] = useState<LinedUpFaculty[]>([]);
  const [editDeptFacultyRoster, setEditDeptFacultyRoster] = useState<User[]>([]);
  const [editLoadingRoster, setEditLoadingRoster] = useState(false);
  const [editFacultySearch, setEditFacultySearch] = useState('');

  // Check URL query parameters on mount (e.g. ?event_id=...)
  useEffect(() => {
    const qEventId = searchParams.get('event_id');
    if (qEventId) {
      setFilterEventId(qEventId);
      setEventId(Number(qEventId));
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Import Event Core Committee into Create Form Lineup
  const handleImportEventCommittee = (selectedEvId?: number | '') => {
    const evId = selectedEvId || eventId;
    if (!evId) return;
    const ev = eventsList.find(e => e.id === Number(evId));
    if (!ev || !ev.core_committee || ev.core_committee.length === 0) {
      alert('No core committee members found appointed for this event.');
      return;
    }

    const validMembers = ev.core_committee.filter(m => m.faculty_id);
    if (validMembers.length === 0) {
      alert('The committee members in this event have not been assigned to faculty profiles yet.');
      return;
    }

    setLinedUpFaculty(prev => {
      const imported: LinedUpFaculty[] = [];
      for (const m of validMembers) {
        const existing = prev.find(f => f.faculty_id === Number(m.faculty_id));
        const dutyRole = m.role_name + (m.work_description ? ` (${m.work_description})` : '');
        if (existing) {
          imported.push({
            ...existing,
            role: dutyRole
          });
        } else {
          imported.push({
            faculty_id: Number(m.faculty_id),
            faculty_name: m.faculty_name || `Faculty #${m.faculty_id}`,
            employee_id: m.employee_id || '',
            designation: m.faculty_designation || 'Faculty Member',
            email: m.faculty_email || '',
            role: dutyRole,
            duty_status: 'assigned'
          });
        }
      }
      const nonCommitteeExisting = prev.filter(p => !validMembers.some(m => Number(m.faculty_id) === p.faculty_id));
      return [...nonCommitteeExisting, ...imported];
    });
  };

  // Import Event Core Committee into Edit Form Lineup
  const handleImportEditEventCommittee = (selectedEvId?: number | '') => {
    const evId = selectedEvId || editEventId;
    if (!evId) return;
    const ev = eventsList.find(e => e.id === Number(evId));
    if (!ev || !ev.core_committee || ev.core_committee.length === 0) {
      alert('No core committee members found appointed for this event.');
      return;
    }

    const validMembers = ev.core_committee.filter(m => m.faculty_id);
    if (validMembers.length === 0) {
      alert('The committee members in this event have not been assigned to faculty profiles yet.');
      return;
    }

    setEditLinedUpFaculty(prev => {
      const imported: LinedUpFaculty[] = [];
      for (const m of validMembers) {
        const existing = prev.find(f => f.faculty_id === Number(m.faculty_id));
        const dutyRole = m.role_name + (m.work_description ? ` (${m.work_description})` : '');
        if (existing) {
          imported.push({
            ...existing,
            role: dutyRole
          });
        } else {
          imported.push({
            faculty_id: Number(m.faculty_id),
            faculty_name: m.faculty_name || `Faculty #${m.faculty_id}`,
            employee_id: m.employee_id || '',
            designation: m.faculty_designation || 'Faculty Member',
            email: m.faculty_email || '',
            role: dutyRole,
            duty_status: 'assigned'
          });
        }
      }
      const nonCommitteeExisting = prev.filter(p => !validMembers.some(m => Number(m.faculty_id) === p.faculty_id));
      return [...nonCommitteeExisting, ...imported];
    });
  };

  const fetchTasksData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDepartmentId !== 'all') params.append('department_id', filterDepartmentId);
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
  }, [filterDepartmentId, filterFacultyId, filterEventId, filterDateType, filterCustomFrom, filterCustomTo, filterStatus, filterPriority, filterSearch]);

  // Load department faculty for Create Form
  const loadDepartmentFaculty = async (deptId: number) => {
    setLoadingRoster(true);
    try {
      const roster = await apiRequest<User[]>(`/departments/${deptId}/faculty`);
      setDeptFacultyRoster(roster);
    } catch (err) {
      console.error('Failed to load department faculty:', err);
      setDeptFacultyRoster([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  // Load department faculty for Edit Form
  const loadEditDepartmentFaculty = async (deptId: number) => {
    setEditLoadingRoster(true);
    try {
      const roster = await apiRequest<User[]>(`/departments/${deptId}/faculty`);
      setEditDeptFacultyRoster(roster);
    } catch (err) {
      console.error('Failed to load edit department faculty:', err);
      setEditDeptFacultyRoster([]);
    } finally {
      setEditLoadingRoster(false);
    }
  };

  // When Department is changed in Create Modal
  const handleDepartmentChange = async (deptId: number | '') => {
    setSelectedDepartmentId(deptId);
    setShowCustomAssigneeDropdown(false);
    setFacultySearch('');
    
    if (!deptId) {
      setAssignedTo('');
      setAssignedHodUser(null);
      setDeptFacultyRoster([]);
      setLinedUpFaculty([]);
      return;
    }

    const dept = departmentsList.find(d => d.id === Number(deptId));
    let headUser: User | null = null;

    if (dept) {
      if (dept.head) {
        headUser = dept.head;
        setAssignedTo(dept.head.id);
      } else if (dept.head_id) {
        setAssignedTo(dept.head_id);
        const match = facultyList.find(f => f.id === dept.head_id);
        if (match) headUser = match;
      } else {
        setAssignedTo('');
      }
    }
    setAssignedHodUser(headUser);

    // Load department faculty roster for Lineup
    await loadDepartmentFaculty(Number(deptId));
  };

  // When Department is changed in Edit Modal
  const handleEditDepartmentChange = async (deptId: number | '') => {
    setEditDepartmentId(deptId);
    setEditShowCustomAssigneeDropdown(false);
    setEditFacultySearch('');

    if (!deptId) {
      setEditAssignedTo('');
      setEditAssignedHodUser(null);
      setEditDeptFacultyRoster([]);
      return;
    }

    const dept = departmentsList.find(d => d.id === Number(deptId));
    let headUser: User | null = null;

    if (dept) {
      if (dept.head) {
        headUser = dept.head;
        setEditAssignedTo(dept.head.id);
      } else if (dept.head_id) {
        setEditAssignedTo(dept.head_id);
        const match = facultyList.find(f => f.id === dept.head_id);
        if (match) headUser = match;
      } else {
        setEditAssignedTo('');
      }
    }
    setEditAssignedHodUser(headUser);

    await loadEditDepartmentFaculty(Number(deptId));
  };

  // Toggle faculty member in Create Form lineup
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

  // Toggle faculty member in Edit Form lineup
  const toggleEditFacultyLineup = (faculty: User, defaultRole = 'Faculty Coordinator') => {
    setEditLinedUpFaculty(prev => {
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

  const updateEditFacultyRole = (facultyId: number, newRole: string) => {
    setEditLinedUpFaculty(prev =>
      prev.map(f => (f.faculty_id === facultyId ? { ...f, role: newRole } : f))
    );
  };

  // Select all faculty in department
  const selectAllFaculty = () => {
    const newItems: LinedUpFaculty[] = deptFacultyRoster.map(fac => {
      const existing = linedUpFaculty.find(f => f.faculty_id === fac.id);
      return existing || {
        faculty_id: fac.id,
        faculty_name: fac.name,
        employee_id: fac.employee_id || '',
        designation: fac.designation || 'Faculty Member',
        email: fac.email,
        role: 'Faculty Coordinator',
        duty_status: 'assigned'
      };
    });
    setLinedUpFaculty(newItems);
  };

  const clearAllFacultyLineup = () => {
    setLinedUpFaculty([]);
  };

  const selectAllEditFaculty = () => {
    const newItems: LinedUpFaculty[] = editDeptFacultyRoster.map(fac => {
      const existing = editLinedUpFaculty.find(f => f.faculty_id === fac.id);
      return existing || {
        faculty_id: fac.id,
        faculty_name: fac.name,
        employee_id: fac.employee_id || '',
        designation: fac.designation || 'Faculty Member',
        email: fac.email,
        role: 'Faculty Coordinator',
        duty_status: 'assigned'
      };
    });
    setEditLinedUpFaculty(newItems);
  };

  const clearAllEditFacultyLineup = () => {
    setEditLinedUpFaculty([]);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartmentId) return alert('Please select a target Department');
    if (!assignedTo) return alert('Please select an HOD or Lead Assignee for this department');

    try {
      const created = await apiRequest<TaskItem>('/tasks', 'POST', {
        title: title.trim(),
        description: description.trim(),
        task_type: eventId ? 'event_linked' : 'general',
        event_id: eventId ? Number(eventId) : null,
        parent_task_id: parentTaskIdForSubtask,
        department_id: Number(selectedDepartmentId),
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
      setSelectedDepartmentId('');
      setAssignedTo('');
      setAssignedHodUser(null);
      setDeptFacultyRoster([]);
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

  const handleOpenEditModal = async (t: TaskItem) => {
    setEditingTask(t);
    setEditTitle(t.title);
    setEditDescription(t.description || '');
    setEditDepartmentId(t.department_id || '');
    setEditAssignedTo(t.assigned_to);
    setEditEventId(t.event_id || '');
    setEditPriority(t.priority);
    setEditPointsReward(t.points_reward || 10);
    setEditLinedUpFaculty(t.lined_up_faculty || []);
    setEditStartDate(t.start_date ? t.start_date.slice(0, 16) : '');
    setEditDueDate(t.due_date ? t.due_date.slice(0, 16) : '');
    setEditFacultySearch('');
    setEditShowCustomAssigneeDropdown(false);

    if (t.department_id) {
      const dept = departmentsList.find(d => d.id === t.department_id);
      if (dept?.head) {
        setEditAssignedHodUser(dept.head);
      } else {
        const match = facultyList.find(f => f.id === t.assigned_to);
        setEditAssignedHodUser(match || t.assignee || null);
      }
      await loadEditDepartmentFaculty(t.department_id);
    } else {
      setEditAssignedHodUser(t.assignee || null);
      setEditDeptFacultyRoster([]);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editDepartmentId) return alert('Please select a target Department');
    if (!editAssignedTo) return alert('Please select an HOD or Lead Assignee');

    try {
      const updated = await apiRequest<TaskItem>(`/tasks/${editingTask.id}`, 'PATCH', {
        title: editTitle.trim(),
        description: editDescription.trim(),
        department_id: Number(editDepartmentId),
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
              title="Edit Directive & Lineup"
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
                  if (t.department_id) {
                    handleDepartmentChange(t.department_id);
                  } else {
                    setAssignedTo(t.assigned_to);
                  }
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
            Assign directives to Departments & HODs, line up departmental faculty teams, track task milestones, and review completed official reports.
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
              setSelectedDepartmentId('');
              setAssignedTo('');
              setAssignedHodUser(null);
              setDeptFacultyRoster([]);
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
            <h3 className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)]">Filter Directives by Department, HOD & Priority</h3>
          </div>
          <button
            onClick={() => {
              setFilterDepartmentId('all');
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Search Directives</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search directives..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="glass-input pl-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Department</label>
            <select
              value={filterDepartmentId}
              onChange={e => setFilterDepartmentId(e.target.value)}
              className="glass-input text-xs"
            >
              <option value="all">All Departments</option>
              {departmentsList.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
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
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Associated Event</label>
            <select
              value={filterEventId}
              onChange={e => setFilterEventId(e.target.value)}
              className="glass-input text-xs"
            >
              <option value="all">All Events</option>
              {eventsList.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
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

      {/* Create Task Modal with Department Selection & Faculty Lineup */}
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
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Directive / Task Title <span className="text-rose-500">*</span></label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Conduct Annual Technical Symposium & Industry Conclave" className="glass-input" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Scope & Detailed Instructions</label>
                  <ImproveEnglishButton text={description} onImproved={setDescription} context="Directive instructions from Vice Chancellor for Department Head and faculty" />
                </div>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide detailed objectives, deliverables, and guidelines..." className="glass-input" />
              </div>

              {/* Department Selection & Auto-Assigned HOD Card */}
              <div className="p-4 bg-[var(--card-bg-to)] rounded-2xl border border-[var(--panel-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Target Department <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  {selectedDepartmentId && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      {departmentsList.find(d => d.id === Number(selectedDepartmentId))?.code}
                    </span>
                  )}
                </div>

                <select
                  required
                  value={selectedDepartmentId}
                  onChange={e => handleDepartmentChange(e.target.value ? Number(e.target.value) : '')}
                  className="glass-input text-xs"
                >
                  <option value="">-- Select Department --</option>
                  {departmentsList.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code}){d.head ? ` — HOD: ${d.head.name}` : ''}
                    </option>
                  ))}
                </select>

                {/* Auto-Assigned HOD Card */}
                {selectedDepartmentId && (
                  <div className="pt-1">
                    {assignedHodUser ? (
                      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                            {assignedHodUser.name?.charAt(0) || 'H'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                                {assignedHodUser.name}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                                <CheckCheck className="w-3 h-3" /> Auto-Assigned HOD
                              </span>
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-2 mt-0.5">
                              <span>{assignedHodUser.designation || 'Head of Department'}</span>
                              <span>•</span>
                              <span>{assignedHodUser.employee_id || assignedHodUser.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowCustomAssigneeDropdown(!showCustomAssigneeDropdown)}
                            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
                          >
                            {showCustomAssigneeDropdown ? 'Keep HOD' : 'Change Lead'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-300">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>No HOD currently assigned to this department. Please select a lead faculty member below:</span>
                        </div>
                      </div>
                    )}

                    {/* Fallback / Override Lead Assignee Dropdown */}
                    {(showCustomAssigneeDropdown || !assignedHodUser) && (
                      <div className="mt-2 p-3 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-1.5 animate-in fade-in duration-150">
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                          Designate Primary Lead Assignee:
                        </label>
                        <select
                          value={assignedTo}
                          onChange={e => {
                            const uId = e.target.value ? Number(e.target.value) : '';
                            setAssignedTo(uId);
                            const found = deptFacultyRoster.find(f => f.id === uId) || facultyList.find(f => f.id === uId);
                            if (found) setAssignedHodUser(found);
                          }}
                          className="glass-input text-xs"
                        >
                          <option value="">-- Select Faculty as Lead Assignee --</option>
                          {deptFacultyRoster.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.designation || 'Faculty'}) - {f.employee_id || f.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Event Linkage & Core Committee Import */}
              <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Link to University Event & Core Committee (Optional)
                    </label>
                  </div>
                  {eventId && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      Event-Linked Directive
                    </span>
                  )}
                </div>

                <select
                  value={eventId}
                  onChange={e => {
                    const selectedId = e.target.value ? Number(e.target.value) : '';
                    setEventId(selectedId);
                    if (selectedId) {
                      const foundEv = eventsList.find(ev => ev.id === selectedId);
                      if (foundEv && !title) {
                        setTitle(`Directive: ${foundEv.title}`);
                      }
                    }
                  }}
                  className="glass-input text-xs"
                >
                  <option value="">-- No Linked Event (General Department Task) --</option>
                  {eventsList.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.event_type || 'Event'}) {ev.core_committee?.length ? `• ${ev.core_committee.length} Committee Appointees` : ''}
                    </option>
                  ))}
                </select>

                {/* If Event Selected, Show Committee Quick Sync Banner */}
                {eventId && (() => {
                  const selectedEv = eventsList.find(e => e.id === Number(eventId));
                  const committeeCount = selectedEv?.core_committee?.length || 0;
                  const assignedCount = selectedEv?.core_committee?.filter(m => m.faculty_id)?.length || 0;

                  return (
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-[var(--text-primary)]">
                              {selectedEv?.title}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              {selectedEv?.venue} • {selectedEv?.start_date ? new Date(selectedEv.start_date).toLocaleDateString() : ''}
                            </div>
                          </div>
                        </div>

                        {assignedCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleImportEventCommittee(Number(eventId))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Import Core Committee ({assignedCount} Faculty) into Lineup
                          </button>
                        ) : (
                          <span className="text-[10px] text-purple-600 dark:text-purple-300 italic">
                            No faculty assigned in event committee yet.
                          </span>
                        )}
                      </div>

                      {/* Committee preview roster */}
                      {selectedEv?.core_committee && selectedEv.core_committee.length > 0 && (
                        <div className="pt-2 border-t border-purple-500/20">
                          <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 mb-1.5 flex items-center justify-between">
                            <span>Appointed Committee Roster & Scope:</span>
                            <span className="text-[9px] text-[var(--text-muted)]">Cross-department faculty lineup</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                            {selectedEv.core_committee.map((m, idx) => (
                              <div key={idx} className="p-1.5 rounded-lg bg-[var(--panel-bg)] border border-purple-500/20 text-[10px] flex items-center justify-between gap-1">
                                <div className="truncate min-w-0">
                                  <span className="font-bold text-purple-600 dark:text-purple-400">{m.role_name}:</span>{' '}
                                  <span className="text-[var(--text-primary)]">{m.faculty_name || 'Unassigned'}</span>
                                </div>
                                {m.faculty_department && (
                                  <span className="text-[9px] text-[var(--text-muted)] shrink-0 font-mono">
                                    ({m.faculty_department})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Line Up Department Faculty in this Directive
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    {deptFacultyRoster.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={selectAllFaculty}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          Select All ({deptFacultyRoster.length})
                        </button>
                        {linedUpFaculty.length > 0 && (
                          <button
                            type="button"
                            onClick={clearAllFacultyLineup}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                      {linedUpFaculty.length} Lined Up
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)]">
                  Select faculty members from the department roster to participate in this task. Lined-up faculty will receive points upon task approval.
                </p>

                {/* Active Lineup Summary Chips */}
                {linedUpFaculty.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--panel-bg)]/80 rounded-xl border border-emerald-500/20">
                    {linedUpFaculty.map(lf => (
                      <div
                        key={lf.faculty_id}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-[var(--text-primary)] animate-in zoom-in-95 duration-100"
                      >
                        <span className="font-semibold">{lf.faculty_name}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          ({lf.role || 'Coordinator'})
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleFacultyLineup(deptFacultyRoster.find(f => f.id === lf.faculty_id) || { id: lf.faculty_id, name: lf.faculty_name } as User)}
                          className="text-[var(--text-muted)] hover:text-rose-500 ml-0.5"
                          title="Remove from lineup"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {loadingRoster ? (
                  <div className="py-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    Loading department faculty roster...
                  </div>
                ) : !selectedDepartmentId ? (
                  <div className="text-center py-6 px-4 rounded-xl bg-[var(--panel-bg)]/50 border border-dashed border-[var(--panel-border)] text-xs text-[var(--text-muted)]">
                    <Building2 className="w-6 h-6 mx-auto mb-1 text-[var(--text-muted)] opacity-50" />
                    Select a Department above to view its faculty roster and add them to the lineup.
                  </div>
                ) : deptFacultyRoster.length > 0 ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Filter department faculty by name, employee ID, or designation..."
                        value={facultySearch}
                        onChange={e => setFacultySearch(e.target.value)}
                        className="glass-input pl-8 text-xs py-1.5"
                      />
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {deptFacultyRoster
                        .filter(f =>
                          f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
                          (f.employee_id && f.employee_id.toLowerCase().includes(facultySearch.toLowerCase())) ||
                          (f.designation && f.designation.toLowerCase().includes(facultySearch.toLowerCase()))
                        )
                        .map(fac => {
                          const isSelected = linedUpFaculty.some(lf => lf.faculty_id === fac.id);
                          const currentLineupItem = linedUpFaculty.find(lf => lf.faculty_id === fac.id);

                          return (
                            <div
                              key={fac.id}
                              className={`p-2.5 rounded-xl border transition-all ${
                                isSelected
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-[var(--text-primary)] shadow-xs'
                                  : 'bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-emerald-500/30'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleFacultyLineup(fac)}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <div className="truncate">
                                    <div className="font-semibold text-[var(--text-primary)] text-xs truncate flex items-center gap-1.5">
                                      {fac.name}
                                      {fac.id === assignedTo && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                                          HOD / Lead
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-[var(--text-muted)]">
                                      {fac.designation || 'Faculty Member'} • {fac.employee_id || fac.email}
                                    </div>
                                  </div>
                                </label>

                                {isSelected && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <input
                                      type="text"
                                      value={currentLineupItem?.role || 'Faculty Coordinator'}
                                      onChange={e => updateFacultyRole(fac.id, e.target.value)}
                                      placeholder="Duty Role"
                                      className="glass-input text-[11px] py-1 px-2.5 w-36 font-medium"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Quick Role Suggestions */}
                              {isSelected && (
                                <div className="mt-2 pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-1 pl-6">
                                  <span className="text-[10px] text-[var(--text-muted)] mr-1">Role Presets:</span>
                                  {COMMON_DUTY_ROLES.map(role => (
                                    <button
                                      key={role}
                                      type="button"
                                      onClick={() => updateFacultyRole(fac.id, role)}
                                      className={`text-[9px] px-2 py-0.5 rounded-md font-medium transition-all ${
                                        currentLineupItem?.role === role
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-[var(--card-bg-to)] text-[var(--text-secondary)] hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 border border-[var(--panel-border)]'
                                      }`}
                                    >
                                      {role}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-[var(--text-muted)]">
                    No faculty members found registered under this department.
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

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-emerald-500" />
                  Edit Directive & Lineup
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{editingTask.title}</p>
              </div>
              <button onClick={() => setEditingTask(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Directive / Task Title <span className="text-rose-500">*</span></label>
                <input required type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="glass-input" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Scope & Detailed Instructions</label>
                  <ImproveEnglishButton text={editDescription} onImproved={setEditDescription} context="Directive instructions from Vice Chancellor for Department Head and faculty" />
                </div>
                <textarea rows={3} value={editDescription} onChange={e => setEditDescription(e.target.value)} className="glass-input" />
              </div>

              {/* Edit Department Selection & Auto-HOD Card */}
              <div className="p-4 bg-[var(--card-bg-to)] rounded-2xl border border-[var(--panel-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Target Department <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  {editDepartmentId && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      {departmentsList.find(d => d.id === Number(editDepartmentId))?.code}
                    </span>
                  )}
                </div>

                <select
                  required
                  value={editDepartmentId}
                  onChange={e => handleEditDepartmentChange(e.target.value ? Number(e.target.value) : '')}
                  className="glass-input text-xs"
                >
                  <option value="">-- Select Department --</option>
                  {departmentsList.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code}){d.head ? ` — HOD: ${d.head.name}` : ''}
                    </option>
                  ))}
                </select>

                {/* Edit Auto-Assigned HOD Card */}
                {editDepartmentId && (
                  <div className="pt-1">
                    {editAssignedHodUser ? (
                      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                            {editAssignedHodUser.name?.charAt(0) || 'H'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                                {editAssignedHodUser.name}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                                <CheckCheck className="w-3 h-3" /> Auto-Assigned HOD
                              </span>
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-2 mt-0.5">
                              <span>{editAssignedHodUser.designation || 'Head of Department'}</span>
                              <span>•</span>
                              <span>{editAssignedHodUser.employee_id || editAssignedHodUser.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditShowCustomAssigneeDropdown(!editShowCustomAssigneeDropdown)}
                            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
                          >
                            {editShowCustomAssigneeDropdown ? 'Keep HOD' : 'Change Lead'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-300">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>No HOD currently assigned to this department. Please select a lead faculty member:</span>
                        </div>
                      </div>
                    )}

                    {/* Edit Fallback / Override Lead Assignee Dropdown */}
                    {(editShowCustomAssigneeDropdown || !editAssignedHodUser) && (
                      <div className="mt-2 p-3 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-1.5 animate-in fade-in duration-150">
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                          Designate Primary Lead Assignee:
                        </label>
                        <select
                          value={editAssignedTo}
                          onChange={e => {
                            const uId = e.target.value ? Number(e.target.value) : '';
                            setEditAssignedTo(uId);
                            const found = editDeptFacultyRoster.find(f => f.id === uId) || facultyList.find(f => f.id === uId);
                            if (found) setEditAssignedHodUser(found);
                          }}
                          className="glass-input text-xs"
                        >
                          <option value="">-- Select Faculty as Lead Assignee --</option>
                          {editDeptFacultyRoster.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.designation || 'Faculty'}) - {f.employee_id || f.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Edit Event Linkage & Core Committee Import */}
              <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Associated University Event & Committee (Optional)
                    </label>
                  </div>
                  {editEventId && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      Event-Linked Directive
                    </span>
                  )}
                </div>

                <select
                  value={editEventId}
                  onChange={e => {
                    const selectedId = e.target.value ? Number(e.target.value) : '';
                    setEditEventId(selectedId);
                  }}
                  className="glass-input text-xs"
                >
                  <option value="">-- No Linked Event (General Department Task) --</option>
                  {eventsList.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.event_type || 'Event'}) {ev.core_committee?.length ? `• ${ev.core_committee.length} Committee Appointees` : ''}
                    </option>
                  ))}
                </select>

                {/* If Event Selected in Edit, Show Committee Quick Sync Banner */}
                {editEventId && (() => {
                  const selectedEv = eventsList.find(e => e.id === Number(editEventId));
                  const assignedCount = selectedEv?.core_committee?.filter(m => m.faculty_id)?.length || 0;

                  return (
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-[var(--text-primary)]">
                              {selectedEv?.title}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              {selectedEv?.venue} • {selectedEv?.start_date ? new Date(selectedEv.start_date).toLocaleDateString() : ''}
                            </div>
                          </div>
                        </div>

                        {assignedCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleImportEditEventCommittee(Number(editEventId))}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Import / Sync Core Committee ({assignedCount} Faculty) into Lineup
                          </button>
                        ) : (
                          <span className="text-[10px] text-purple-600 dark:text-purple-300 italic">
                            No faculty assigned in event committee yet.
                          </span>
                        )}
                      </div>

                      {/* Committee preview roster */}
                      {selectedEv?.core_committee && selectedEv.core_committee.length > 0 && (
                        <div className="pt-2 border-t border-purple-500/20">
                          <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 mb-1.5 flex items-center justify-between">
                            <span>Appointed Committee Roster:</span>
                            <span className="text-[9px] text-[var(--text-muted)]">Cross-department faculty lineup</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                            {selectedEv.core_committee.map((m, idx) => (
                              <div key={idx} className="p-1.5 rounded-lg bg-[var(--panel-bg)] border border-purple-500/20 text-[10px] flex items-center justify-between gap-1">
                                <div className="truncate min-w-0">
                                  <span className="font-bold text-purple-600 dark:text-purple-400">{m.role_name}:</span>{' '}
                                  <span className="text-[var(--text-primary)]">{m.faculty_name || 'Unassigned'}</span>
                                </div>
                                {m.faculty_department && (
                                  <span className="text-[9px] text-[var(--text-muted)] shrink-0 font-mono">
                                    ({m.faculty_department})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Priority</label>
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value as any)} className="glass-input">
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
                    value={editPointsReward}
                    onChange={e => setEditPointsReward(Number(e.target.value))}
                    className="glass-input"
                  />
                </div>
              </div>

              {/* Edit Department Faculty Lineup Interactive Section */}
              <div className="p-4 bg-[var(--card-bg-to)] rounded-2xl border border-[var(--panel-border)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Line Up Department Faculty in this Directive
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    {editDeptFacultyRoster.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={selectAllEditFaculty}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          Select All ({editDeptFacultyRoster.length})
                        </button>
                        {editLinedUpFaculty.length > 0 && (
                          <button
                            type="button"
                            onClick={clearAllEditFacultyLineup}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    )}
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                      {editLinedUpFaculty.length} Lined Up
                    </span>
                  </div>
                </div>

                {/* Edit Active Lineup Summary Chips */}
                {editLinedUpFaculty.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-[var(--panel-bg)]/80 rounded-xl border border-emerald-500/20">
                    {editLinedUpFaculty.map(lf => (
                      <div
                        key={lf.faculty_id}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-[var(--text-primary)] animate-in zoom-in-95 duration-100"
                      >
                        <span className="font-semibold">{lf.faculty_name}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          ({lf.role || 'Coordinator'})
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleEditFacultyLineup(editDeptFacultyRoster.find(f => f.id === lf.faculty_id) || { id: lf.faculty_id, name: lf.faculty_name } as User)}
                          className="text-[var(--text-muted)] hover:text-rose-500 ml-0.5"
                          title="Remove from lineup"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {editLoadingRoster ? (
                  <div className="py-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    Loading department faculty roster...
                  </div>
                ) : !editDepartmentId ? (
                  <div className="text-center py-6 px-4 rounded-xl bg-[var(--panel-bg)]/50 border border-dashed border-[var(--panel-border)] text-xs text-[var(--text-muted)]">
                    <Building2 className="w-6 h-6 mx-auto mb-1 text-[var(--text-muted)] opacity-50" />
                    Select a Department above to view its faculty roster and manage the lineup.
                  </div>
                ) : editDeptFacultyRoster.length > 0 ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Filter department faculty by name, employee ID, or designation..."
                        value={editFacultySearch}
                        onChange={e => setEditFacultySearch(e.target.value)}
                        className="glass-input pl-8 text-xs py-1.5"
                      />
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {editDeptFacultyRoster
                        .filter(f =>
                          f.name.toLowerCase().includes(editFacultySearch.toLowerCase()) ||
                          (f.employee_id && f.employee_id.toLowerCase().includes(editFacultySearch.toLowerCase())) ||
                          (f.designation && f.designation.toLowerCase().includes(editFacultySearch.toLowerCase()))
                        )
                        .map(fac => {
                          const isSelected = editLinedUpFaculty.some(lf => lf.faculty_id === fac.id);
                          const currentLineupItem = editLinedUpFaculty.find(lf => lf.faculty_id === fac.id);

                          return (
                            <div
                              key={fac.id}
                              className={`p-2.5 rounded-xl border transition-all ${
                                isSelected
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-[var(--text-primary)] shadow-xs'
                                  : 'bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-emerald-500/30'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleEditFacultyLineup(fac)}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <div className="truncate">
                                    <div className="font-semibold text-[var(--text-primary)] text-xs truncate flex items-center gap-1.5">
                                      {fac.name}
                                      {fac.id === editAssignedTo && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                                          HOD / Lead
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-[var(--text-muted)]">
                                      {fac.designation || 'Faculty Member'} • {fac.employee_id || fac.email}
                                    </div>
                                  </div>
                                </label>

                                {isSelected && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <input
                                      type="text"
                                      value={currentLineupItem?.role || 'Faculty Coordinator'}
                                      onChange={e => updateEditFacultyRole(fac.id, e.target.value)}
                                      placeholder="Duty Role"
                                      className="glass-input text-[11px] py-1 px-2.5 w-36 font-medium"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Quick Role Suggestions */}
                              {isSelected && (
                                <div className="mt-2 pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-1 pl-6">
                                  <span className="text-[10px] text-[var(--text-muted)] mr-1">Role Presets:</span>
                                  {COMMON_DUTY_ROLES.map(role => (
                                    <button
                                      key={role}
                                      type="button"
                                      onClick={() => updateEditFacultyRole(fac.id, role)}
                                      className={`text-[9px] px-2 py-0.5 rounded-md font-medium transition-all ${
                                        currentLineupItem?.role === role
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-[var(--card-bg-to)] text-[var(--text-secondary)] hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 border border-[var(--panel-border)]'
                                      }`}
                                    >
                                      {role}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-[var(--text-muted)]">
                    No faculty members found registered under this department.
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
                      value={editStartDate}
                      onChange={e => setEditStartDate(e.target.value)}
                      className="glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Deadline / Due Date
                    </label>
                    <input
                      type="datetime-local"
                      value={editDueDate}
                      onChange={e => setEditDueDate(e.target.value)}
                      className="glass-input text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setEditingTask(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
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
