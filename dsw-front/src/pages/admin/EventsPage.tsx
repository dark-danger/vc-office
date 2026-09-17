import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  Calendar, Plus, FileText, CheckCircle2, Clock, MapPin, User as UserIcon,
  X, Eye, Pencil, Trash2, FileCheck, Users, Sparkles, Building2,
  ShieldCheck, ArrowRight, Search, Filter, RotateCcw, Award, CheckCheck,
  ChevronDown, ChevronUp, Briefcase, Zap
} from 'lucide-react';

const COMMON_COMMITTEE_ROLES = [
  'Chief Convener',
  'Co-Convener',
  'Organizing Secretary',
  'Technical Head',
  'Stage & Venue Incharge',
  'Hospitality & Protocol',
  'Registration & Helpdesk',
  'Discipline & Seating',
  'Media & Press Coordinator',
  'Student Liaison',
  'Sponsorship Lead',
  'Logistics & Transport',
  'Evaluation & Jury Coordinator'
];

const EVENT_TYPE_OPTIONS = [
  'Technical Symposium',
  'Hackathon & Coding Sprint',
  'National Conference',
  'Workshop & Training',
  'Seminar & Guest Lecture',
  'Cultural Fest',
  'Sports Meet & Athletics',
  'Industry Conclave',
  'Annual Day & Convocation',
  'Orientation & Induction',
  'Faculty Development Program'
];

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
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  venue: string;
  coordinator_id?: number;
  coordinator?: User;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  core_committee?: CommitteeMember[];
  tasks_count: number;
  completed_tasks_count: number;
  completion_percentage: number;
}

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [reportHtmlModal, setReportHtmlModal] = useState<string | null>(null);
  const [viewCommitteeEvent, setViewCommitteeEvent] = useState<EventItem | null>(null);
  const [expandedCommitteeEventId, setExpandedCommitteeEventId] = useState<number | null>(null);

  // Form State for Create Event
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('Technical Symposium');
  const [venue, setVenue] = useState('Main University Auditorium');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coordinatorId, setCoordinatorId] = useState<number | ''>('');
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([
    { role_name: 'Chief Convener', faculty_id: '', work_description: 'Overall event steering, institutional approvals & executive guidance.' },
    { role_name: 'Organizing Secretary', faculty_id: '', work_description: 'Administrative logistics, scheduling, agenda, and team alignment.' },
    { role_name: 'Technical Head', faculty_id: '', work_description: 'Manage audio-visual, live broadcast, digital presentations & platform setup.' }
  ]);

  // Form State for Edit Event
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEventType, setEditEventType] = useState('Technical Symposium');
  const [editVenue, setEditVenue] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editCoordinatorId, setEditCoordinatorId] = useState<number | ''>('');
  const [editStatus, setEditStatus] = useState<'planned' | 'ongoing' | 'completed' | 'cancelled'>('planned');
  const [editCommitteeMembers, setEditCommitteeMembers] = useState<CommitteeMember[]>([]);

  const fetchEventsData = async () => {
    setLoading(true);
    try {
      const [evData, facData] = await Promise.all([
        apiRequest<EventItem[]>('/events'),
        apiRequest<User[]>('/users/faculty').catch(() => apiRequest<User[]>('/users'))
      ]);
      setEvents(evData);
      setFacultyList(facData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsData();
  }, []);

  // Committee row handlers for Create Modal
  const handleAddCommitteeRow = (presetRole = '') => {
    setCommitteeMembers(prev => [
      ...prev,
      {
        role_name: presetRole || 'Committee Incharge',
        faculty_id: '',
        work_description: ''
      }
    ]);
  };

  const handleRemoveCommitteeRow = (index: number) => {
    setCommitteeMembers(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateCommitteeRow = (index: number, field: keyof CommitteeMember, value: any) => {
    setCommitteeMembers(prev =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'faculty_id' && value) {
          const matchedFac = facultyList.find(f => f.id === Number(value));
          if (matchedFac) {
            updated.faculty_name = matchedFac.name;
            updated.faculty_email = matchedFac.email;
            updated.faculty_department = matchedFac.department || (matchedFac as any).dept?.name || '';
            updated.faculty_designation = matchedFac.designation || 'Faculty';
            updated.employee_id = matchedFac.employee_id || '';
          }
        }
        return updated;
      })
    );
  };

  const handleApplyStandardPresets = () => {
    setCommitteeMembers([
      { role_name: 'Chief Convener', faculty_id: '', work_description: 'Overall event steering, executive governance & institutional coordination.' },
      { role_name: 'Organizing Secretary', faculty_id: '', work_description: 'Roster planning, minutes of meetings, and faculty role alignment.' },
      { role_name: 'Technical Head', faculty_id: '', work_description: 'Audio-visual setup, stage screens, sound systems, and digital support.' },
      { role_name: 'Stage & Venue Incharge', faculty_id: '', work_description: 'Stage decoration, VIP podium, seating charts & stage protocol.' },
      { role_name: 'Hospitality & Protocol', faculty_id: '', work_description: 'Guest reception, executive lounge hospitality, and refresh logistics.' },
      { role_name: 'Registration & Helpdesk', faculty_id: '', work_description: 'Participant registration, certificate verification & attendee kits.' },
      { role_name: 'Media & Documentation', faculty_id: '', work_description: 'Photography, video coverage, press releases & event report draft.' }
    ]);
  };

  // Committee row handlers for Edit Modal
  const handleAddEditCommitteeRow = (presetRole = '') => {
    setEditCommitteeMembers(prev => [
      ...prev,
      {
        role_name: presetRole || 'Committee Incharge',
        faculty_id: '',
        work_description: ''
      }
    ]);
  };

  const handleRemoveEditCommitteeRow = (index: number) => {
    setEditCommitteeMembers(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateEditCommitteeRow = (index: number, field: keyof CommitteeMember, value: any) => {
    setEditCommitteeMembers(prev =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'faculty_id' && value) {
          const matchedFac = facultyList.find(f => f.id === Number(value));
          if (matchedFac) {
            updated.faculty_name = matchedFac.name;
            updated.faculty_email = matchedFac.email;
            updated.faculty_department = matchedFac.department || (matchedFac as any).dept?.name || '';
            updated.faculty_designation = matchedFac.designation || 'Faculty';
            updated.employee_id = matchedFac.employee_id || '';
          }
        }
        return updated;
      })
    );
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validCommittee = committeeMembers.filter(c => c.role_name.trim() && c.faculty_id);

      await apiRequest('/events', 'POST', {
        title: title.trim(),
        description: description.trim(),
        event_type: eventType,
        venue: venue.trim(),
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        coordinator_id: coordinatorId ? Number(coordinatorId) : (validCommittee[0]?.faculty_id ? Number(validCommittee[0].faculty_id) : null),
        core_committee: validCommittee
      });

      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
      setVenue('Main University Auditorium');
      setStartDate('');
      setEndDate('');
      setCommitteeMembers([
        { role_name: 'Chief Convener', faculty_id: '', work_description: 'Overall event steering, institutional approvals & executive guidance.' },
        { role_name: 'Organizing Secretary', faculty_id: '', work_description: 'Administrative logistics, scheduling, agenda, and team alignment.' }
      ]);
      await fetchEventsData();
      alert('🎉 University Event and Core Committee created successfully! Appointed faculty have been notified.');
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
    }
  };

  const handleOpenEditModal = (ev: EventItem) => {
    setEditingEvent(ev);
    setEditTitle(ev.title);
    setEditDescription(ev.description || '');
    setEditEventType(ev.event_type || 'Technical Symposium');
    setEditVenue(ev.venue || '');
    setEditStartDate(ev.start_date ? ev.start_date.slice(0, 16) : '');
    setEditEndDate(ev.end_date ? ev.end_date.slice(0, 16) : '');
    setEditCoordinatorId(ev.coordinator_id || '');
    setEditStatus(ev.status);
    setEditCommitteeMembers(ev.core_committee || []);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const validCommittee = editCommitteeMembers.filter(c => c.role_name.trim() && c.faculty_id);

      const updated = await apiRequest<EventItem>(`/events/${editingEvent.id}`, 'PATCH', {
        title: editTitle.trim(),
        description: editDescription.trim(),
        event_type: editEventType,
        venue: editVenue.trim(),
        start_date: editStartDate ? new Date(editStartDate).toISOString() : null,
        end_date: editEndDate ? new Date(editEndDate).toISOString() : null,
        coordinator_id: editCoordinatorId ? Number(editCoordinatorId) : (validCommittee[0]?.faculty_id ? Number(validCommittee[0].faculty_id) : null),
        status: editStatus,
        core_committee: validCommittee
      });

      setEditingEvent(null);
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      alert('Event and Core Committee updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update event');
    }
  };

  const handlePreviewMergedReport = async (eventId: number) => {
    try {
      const html = await apiRequest<string>(`/events/${eventId}/reports/merged`);
      setReportHtmlModal(html);
    } catch (err: any) {
      alert(err.message || 'Failed to generate merged report preview');
    }
  };

  const handleDeleteEvent = async (eventId: number, eventTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete event "${eventTitle}" and all its committee allocations?`)) {
      return;
    }
    try {
      await apiRequest(`/events/${eventId}`, 'DELETE');
      setEvents(events.filter(e => e.id !== eventId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  // Filtered Events List
  const filteredEvents = events.filter(ev => {
    const matchSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.venue && ev.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.core_committee && ev.core_committee.some(m => (m.faculty_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || m.role_name.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchStatus = statusFilter === 'all' || ev.status === statusFilter;
    const matchType = typeFilter === 'all' || ev.event_type === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  // Calculate Metrics
  const totalEventsCount = events.length;
  const activeEventsCount = events.filter(e => e.status === 'planned' || e.status === 'ongoing').length;
  const completedEventsCount = events.filter(e => e.status === 'completed').length;
  const totalCommitteeAppointments = events.reduce((acc, ev) => acc + (ev.core_committee?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5" /> University Events & Core Committees
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Institutional Event & Committee Engine</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Create campus events, appoint cross-department faculty Core Committees with defined roles & work scopes, and link them to university directive tasks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/admin/events/reports')}
            className="btn-secondary text-xs py-2.5 px-4 flex items-center justify-center gap-2 shadow-sm"
          >
            <FileText className="w-4 h-4 text-amber-500" /> Official Reports Archive
          </button>
          <button
            onClick={() => navigate('/admin/events/reports/new')}
            className="btn-secondary text-xs py-2.5 px-4 flex items-center justify-center gap-2 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-sm"
          >
            <FileCheck className="w-4 h-4 text-blue-500" /> New 7-Page Report
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary text-xs py-2.5 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Create Event & Appoint Committee
          </button>
        </div>
      </div>

      {/* Overview Metric Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold">
            <span>Total Events</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">{totalEventsCount}</div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Recorded in VC Portal</div>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold">
            <span>Active / Planned</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{activeEventsCount}</div>
          <div className="text-[11px] text-[var(--text-muted)]">Upcoming institutional events</div>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold">
            <span>Completed Events</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedEventsCount}</div>
          <div className="text-[11px] text-emerald-600/80 font-medium">Executed & reported</div>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-semibold">
            <span>Committee Appointees</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalCommitteeAppointments}</div>
          <div className="text-[11px] text-[var(--text-muted)]">Faculty roles assigned</div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Filter Events & Committees</h3>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setTypeFilter('all');
            }}
            className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Search Events & Committee Members</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search by event title, venue, faculty name or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="glass-input pl-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="glass-input text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Event Type Filter</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="glass-input text-xs"
            >
              <option value="all">All Event Types</option>
              {EVENT_TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events List Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)] glass-panel">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading university events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)] glass-panel">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)] opacity-50" />
            No university events found matching your search or filters.
          </div>
        ) : (
          filteredEvents.map(ev => {
            const committeeList = ev.core_committee || [];
            const isExpanded = expandedCommitteeEventId === ev.id;

            return (
              <div key={ev.id} className="glass-card p-5 space-y-4 relative overflow-hidden transition-all duration-200 hover:shadow-lg">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        {ev.event_type || 'Event'}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        ev.status === 'completed' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                        ev.status === 'ongoing' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 animate-pulse' :
                        ev.status === 'cancelled' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      }`}>
                        {ev.status}
                      </span>

                      <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ev.tasks_count} Linked Directives
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{ev.title}</h3>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {ev.description || 'No event overview description provided.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
                      {ev.venue && (
                        <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <strong>Venue:</strong> {ev.venue}
                        </span>
                      )}

                      {(ev.start_date || ev.end_date) && (
                        <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <strong>Dates:</strong>{' '}
                          {ev.start_date ? new Date(ev.start_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                          {ev.end_date && ` → ${new Date(ev.end_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </span>
                      )}

                      {ev.coordinator && (
                        <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                          <UserIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <strong>Lead Coordinator:</strong> {ev.coordinator.name} ({ev.coordinator.department || 'Faculty'})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      onClick={() => navigate(`/admin/tasks?event_id=${ev.id}`)}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600"
                      title="Assign tasks linked to this event"
                    >
                      <Zap className="w-3.5 h-3.5" /> Assign Directive / Lineup
                    </button>

                    <button
                      onClick={() => handlePreviewMergedReport(ev.id)}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      title="Preview Merged PDF Report"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-500" /> Merged Summary
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(ev)}
                      className="p-1.5 rounded-lg bg-[var(--card-bg-to)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--panel-border)] transition-colors"
                      title="Edit Event & Committee"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteEvent(ev.id, ev.title)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Core Committee Section */}
                <div className="p-3.5 bg-gradient-to-r from-purple-500/5 via-emerald-500/5 to-transparent rounded-2xl border border-purple-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        Event Core Committee ({committeeList.length} Appointed Faculty Roles)
                      </span>
                    </div>

                    {committeeList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedCommitteeEventId(isExpanded ? null : ev.id)}
                        className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <><span>Collapse</span> <ChevronUp className="w-3 h-3" /></>
                        ) : (
                          <><span>View Work Scopes ({committeeList.length})</span> <ChevronDown className="w-3 h-3" /></>
                        )}
                      </button>
                    )}
                  </div>

                  {committeeList.length === 0 ? (
                    <div className="text-xs text-[var(--text-muted)] italic py-1">
                      No core committee members appointed yet.{' '}
                      <button onClick={() => handleOpenEditModal(ev)} className="text-purple-600 dark:text-purple-400 font-semibold underline">
                        Appoint faculty committee
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Compact Badges Row */}
                      <div className="flex flex-wrap gap-2">
                        {committeeList.map((mem, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--panel-bg)] border border-purple-500/30 text-xs text-[var(--text-primary)] shadow-xs"
                          >
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold text-[10px] uppercase tracking-wider">
                              {mem.role_name}
                            </span>
                            <span className="font-semibold">{mem.faculty_name || 'Assigned Faculty'}</span>
                            {mem.faculty_department && (
                              <span className="text-[10px] text-[var(--text-muted)]">
                                ({mem.faculty_department})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Expanded Work Scopes Grid */}
                      {isExpanded && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-purple-500/20 animate-in fade-in duration-200">
                          {committeeList.map((mem, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-[var(--panel-bg)]/90 border border-purple-500/20 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-purple-600 dark:text-purple-400 text-[11px] truncate">
                                  {mem.role_name}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                                  {mem.faculty_department || 'University'}
                                </span>
                              </div>
                              <div className="font-semibold text-[var(--text-primary)] truncate">
                                {mem.faculty_name}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] truncate">
                                {mem.faculty_designation || 'Faculty'} • {mem.faculty_email}
                              </div>
                              {mem.work_description && (
                                <div className="text-[11px] text-[var(--text-secondary)] bg-[var(--card-bg-to)] p-1.5 rounded-lg border border-[var(--panel-border)] italic mt-1 leading-snug">
                                  "{mem.work_description}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Event & Core Committee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  Create University Event & Appoint Core Committee
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Configure event logistics and assign faculty roles across all university departments.
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Event Title <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Geeta University Annual Technical Symposium & Hackathon 2026"
                  className="glass-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Event Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value)}
                    className="glass-input text-xs"
                  >
                    {EVENT_TYPE_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Venue / Campus Location <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    placeholder="e.g. Main Auditorium, Seminar Hall 1, Sports Arena"
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                    Event Scope, Objectives & Key Highlights
                  </label>
                  <ImproveEnglishButton
                    text={description}
                    onImproved={setDescription}
                    context="Official university event description and key objectives"
                  />
                </div>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide background, expected footfall, guest details, and key event objectives..."
                  className="glass-input"
                />
              </div>

              {/* Core Committee Builder Section (Universal Faculty) */}
              <div className="p-4 bg-[var(--card-bg-to)] rounded-2xl border border-purple-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">
                        Event Core Committee (University-Wide Faculty)
                      </h4>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Assign faculty from all departments with specific designated roles and work scopes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleApplyStandardPresets}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Apply Standard Roles
                    </button>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/30">
                      {committeeMembers.length} Appointed
                    </span>
                  </div>
                </div>

                {/* Dynamic Member Rows */}
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {committeeMembers.map((member, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[var(--panel-bg)] rounded-xl border border-[var(--panel-border)] hover:border-purple-500/30 space-y-2 transition-all"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                        {/* Role Name Input */}
                        <div className="sm:col-span-4 space-y-1">
                          <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">
                            Role Name #{idx + 1}
                          </label>
                          <input
                            required
                            type="text"
                            value={member.role_name}
                            onChange={e => handleUpdateCommitteeRow(idx, 'role_name', e.target.value)}
                            placeholder="e.g. Chief Convener"
                            className="glass-input text-xs py-1.5 font-bold text-purple-600 dark:text-purple-300"
                          />
                        </div>

                        {/* Faculty Selector (All Faculty across all departments) */}
                        <div className="sm:col-span-5 space-y-1">
                          <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">
                            Select Faculty (All Departments)
                          </label>
                          <select
                            required
                            value={member.faculty_id}
                            onChange={e => handleUpdateCommitteeRow(idx, 'faculty_id', e.target.value ? Number(e.target.value) : '')}
                            className="glass-input text-xs py-1.5"
                          >
                            <option value="">-- Choose Faculty Member --</option>
                            {facultyList.map(f => (
                              <option key={f.id} value={f.id}>
                                {f.name} ({f.department || 'Faculty'}) - {f.designation || 'Faculty'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Remove Action */}
                        <div className="sm:col-span-3 flex justify-end pt-5">
                          <button
                            type="button"
                            onClick={() => handleRemoveCommitteeRow(idx)}
                            className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1 p-1 rounded hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>

                      {/* Work Scope / Specific Duty Description */}
                      <div>
                        <input
                          type="text"
                          value={member.work_description || ''}
                          onChange={e => handleUpdateCommitteeRow(idx, 'work_description', e.target.value)}
                          placeholder="Assigned Work / Scope (e.g. Stage lighting, microphone setups, sound checks)"
                          className="glass-input text-[11px] py-1 text-[var(--text-secondary)]"
                        />
                      </div>

                      {/* Role Preset Chips */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[9px] text-[var(--text-muted)] mr-1">Presets:</span>
                        {COMMON_COMMITTEE_ROLES.slice(0, 6).map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => handleUpdateCommitteeRow(idx, 'role_name', r)}
                            className={`text-[9px] px-1.5 py-0.2 rounded font-medium transition-all ${
                              member.role_name === r
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-[var(--card-bg-to)] text-[var(--text-muted)] hover:text-purple-600 border border-[var(--panel-border)]'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddCommitteeRow('')}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Appoint Another Faculty Role
                  </button>

                  <span className="text-[11px] text-[var(--text-muted)]">
                    Appointed faculty will receive notifications upon event creation.
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Event & Appoint Committee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event & Core Committee Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-emerald-500" />
                  Edit University Event & Core Committee
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{editingEvent.title}</p>
              </div>
              <button onClick={() => setEditingEvent(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Event Title <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Event Type</label>
                  <select
                    value={editEventType}
                    onChange={e => setEditEventType(e.target.value)}
                    className="glass-input text-xs"
                  >
                    {EVENT_TYPE_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Venue</label>
                  <input
                    required
                    type="text"
                    value={editVenue}
                    onChange={e => setEditVenue(e.target.value)}
                    className="glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="glass-input text-xs"
                  >
                    <option value="planned">Planned</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editEndDate}
                    onChange={e => setEditEndDate(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Event Scope & Objectives</label>
                  <ImproveEnglishButton
                    text={editDescription}
                    onImproved={setEditDescription}
                    context="Official university event description and key objectives"
                  />
                </div>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="glass-input"
                />
              </div>

              {/* Edit Core Committee Builder */}
              <div className="p-4 bg-[var(--card-bg-to)] rounded-2xl border border-purple-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">
                        Event Core Committee (University Faculty)
                      </h4>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Update roles, faculty appointees, and duty descriptions.
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/30">
                    {editCommitteeMembers.length} Appointed
                  </span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {editCommitteeMembers.map((member, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[var(--panel-bg)] rounded-xl border border-[var(--panel-border)] hover:border-purple-500/30 space-y-2 transition-all"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                        <div className="sm:col-span-4 space-y-1">
                          <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">
                            Role Name #{idx + 1}
                          </label>
                          <input
                            required
                            type="text"
                            value={member.role_name}
                            onChange={e => handleUpdateEditCommitteeRow(idx, 'role_name', e.target.value)}
                            placeholder="e.g. Chief Convener"
                            className="glass-input text-xs py-1.5 font-bold text-purple-600 dark:text-purple-300"
                          />
                        </div>

                        <div className="sm:col-span-5 space-y-1">
                          <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase">
                            Select Faculty
                          </label>
                          <select
                            required
                            value={member.faculty_id}
                            onChange={e => handleUpdateEditCommitteeRow(idx, 'faculty_id', e.target.value ? Number(e.target.value) : '')}
                            className="glass-input text-xs py-1.5"
                          >
                            <option value="">-- Choose Faculty Member --</option>
                            {facultyList.map(f => (
                              <option key={f.id} value={f.id}>
                                {f.name} ({f.department || 'Faculty'}) - {f.designation || 'Faculty'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3 flex justify-end pt-5">
                          <button
                            type="button"
                            onClick={() => handleRemoveEditCommitteeRow(idx)}
                            className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1 p-1 rounded hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={member.work_description || ''}
                          onChange={e => handleUpdateEditCommitteeRow(idx, 'work_description', e.target.value)}
                          placeholder="Assigned Work / Scope of Responsibilities"
                          className="glass-input text-[11px] py-1 text-[var(--text-secondary)]"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[9px] text-[var(--text-muted)] mr-1">Presets:</span>
                        {COMMON_COMMITTEE_ROLES.slice(0, 6).map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => handleUpdateEditCommitteeRow(idx, 'role_name', r)}
                            className={`text-[9px] px-1.5 py-0.2 rounded font-medium transition-all ${
                              member.role_name === r
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-[var(--card-bg-to)] text-[var(--text-muted)] hover:text-purple-600 border border-[var(--panel-border)]'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddEditCommitteeRow('')}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-500 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Appoint Another Faculty Role
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merged Report HTML Viewer Modal */}
      {reportHtmlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl glass-panel p-6 shadow-2xl relative my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)]">
              <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" /> Merged Official Event & Tasks Report
              </h3>
              <button onClick={() => setReportHtmlModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white text-black p-4 rounded-xl max-h-[70vh] overflow-y-auto border">
              <div dangerouslySetInnerHTML={{ __html: reportHtmlModal }} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReportHtmlModal(null)} className="btn-secondary text-xs">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
