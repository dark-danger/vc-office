import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Printer, 
  Edit3, 
  Trash2, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  X,
  AlertCircle,
  Building2,
  Trophy,
  ShieldCheck,
  Send,
  MessageSquare,
  Award,
  ChevronRight,
  ListFilter,
  LayoutGrid,
  Table as TableIcon,
  HelpCircle,
  ArrowUpRight
} from 'lucide-react';

interface EventReportItem {
  id: number;
  event_id?: number;
  event_title?: string;
  status: string;
  report_type?: string;
  department_id?: number;
  department_name?: string;
  category?: string;
  sub_category?: string;
  sdg_mapping?: string;
  event_name: string;
  organized_by?: string;
  coordinator_name?: string;
  from_date?: string;
  to_date?: string;
  total_days?: number;
  venue?: string;
  total_budget_amount?: number;
  total_expenses?: number;
  participants_total?: number;
  submitted_at?: string;
  reviewed_by?: number;
  reviewer_name?: string;
  reviewed_at?: string;
  review_status?: string;
  review_remarks?: string;
  points_awarded?: number;
  creator_name?: string;
  creator_email?: string;
  creator_employee_id?: string;
  created_at: string;
}

interface DepartmentItem {
  id: number;
  name: string;
  code: string;
}

export const EventReportsListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isHeadPortal = location.pathname.startsWith('/head') || user?.role === 'department_head';
  const basePath = isHeadPortal ? '/head/events/reports' : '/admin/events/reports';

  const [reports, setReports] = useState<EventReportItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusTab, setStatusTab] = useState<string>('all');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Review Modal State (Admin)
  const [reviewModalReport, setReviewModalReport] = useState<EventReportItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'needs_revision' | 'reject'>('approve');
  const [reviewRemarks, setReviewRemarks] = useState<string>('');
  const [pointsAwarded, setPointsAwarded] = useState<number>(25);
  const [dswVerifiedBy, setDswVerifiedBy] = useState<string>(user?.name ? `VC Office / DSW (${user.name})` : 'VC Office Official Reviewer');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<EventReportItem[]>('/event-reports', 'GET', undefined, false, true);
      setReports(data || []);
    } catch (err) {
      console.error('Failed to fetch event reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await apiRequest<DepartmentItem[]>('/departments');
      setDepartments(data || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchDepartments();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the official report for "${name}"?`)) return;
    try {
      await apiRequest(`/event-reports/${id}`, 'DELETE');
      setReports(reports.filter(r => r.id !== id));
    } catch (err: any) {
      alert(`Failed to delete report: ${err.message || err}`);
    }
  };

  const handlePrint = async (id: number) => {
    try {
      const html = await apiRequest<string>(`/event-reports/${id}/print-html`);
      setPreviewHtml(html);
    } catch (err: any) {
      alert(`Failed to generate printable report: ${err.message || err}`);
    }
  };

  const openReviewModal = (report: EventReportItem) => {
    setReviewModalReport(report);
    setReviewAction('approve');
    setReviewRemarks(report.review_remarks || '');
    setPointsAwarded(report.points_awarded || 25);
    setDswVerifiedBy(user?.name ? `VC Office Verified (${user.name})` : 'VC Office Official Reviewer');
  };

  const handleExecuteReview = async () => {
    if (!reviewModalReport) return;
    if ((reviewAction === 'needs_revision' || reviewAction === 'reject') && !reviewRemarks.trim()) {
      alert('Please enter review remarks/feedback explaining the decision.');
      return;
    }

    setSubmittingReview(true);
    try {
      const payload = {
        action: reviewAction,
        review_remarks: reviewRemarks,
        points_awarded: reviewAction === 'approve' ? Number(pointsAwarded) || 0 : 0,
        dsw_verified_by: dswVerifiedBy
      };

      const updated = await apiRequest<EventReportItem>(`/event-reports/${reviewModalReport.id}/review`, 'POST', payload);
      setReports(reports.map(r => r.id === updated.id ? updated : r));
      setReviewModalReport(null);
      alert(
        reviewAction === 'approve' 
          ? `Report Approved Successfully! ${pointsAwarded > 0 ? `(+${pointsAwarded} points credited to department)` : ''}`
          : reviewAction === 'needs_revision'
          ? 'Revision Request sent to department head.'
          : 'Report rejected.'
      );
    } catch (err: any) {
      alert(`Failed to review report: ${err.message || err}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Metrics Calculation
  const totalCount = reports.length;
  const pendingCount = reports.filter(r => r.status === 'submitted' || r.review_status === 'pending_review').length;
  const approvedCount = reports.filter(r => r.status === 'approved' || r.review_status === 'approved').length;
  const revisionCount = reports.filter(r => r.status === 'needs_revision' || r.review_status === 'needs_revision').length;
  const totalPoints = reports.reduce((sum, r) => sum + (r.points_awarded || 0), 0);

  // Filter Reports
  const filteredReports = reports.filter((r) => {
    // Search matching
    const searchLow = searchQuery.toLowerCase();
    const matchesSearch = (r.event_name || '').toLowerCase().includes(searchLow) ||
      (r.coordinator_name || '').toLowerCase().includes(searchLow) ||
      (r.organized_by || '').toLowerCase().includes(searchLow) ||
      (r.department_name || '').toLowerCase().includes(searchLow) ||
      (r.creator_name || '').toLowerCase().includes(searchLow);

    // Status Tab matching
    let matchesTab = true;
    if (statusTab === 'pending') {
      matchesTab = r.status === 'submitted' || r.review_status === 'pending_review';
    } else if (statusTab === 'approved') {
      matchesTab = r.status === 'approved' || r.review_status === 'approved';
    } else if (statusTab === 'needs_revision') {
      matchesTab = r.status === 'needs_revision' || r.review_status === 'needs_revision';
    } else if (statusTab === 'draft') {
      matchesTab = r.status === 'draft';
    }

    // Department matching
    let matchesDept = true;
    if (selectedDeptId !== 'all') {
      matchesDept = String(r.department_id) === selectedDeptId || Boolean(r.department_name && r.department_name.toLowerCase().includes(selectedDeptId.toLowerCase()));
    }

    // In HOD portal, optionally prioritize their own department's submissions if needed
    return matchesSearch && matchesTab && matchesDept;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--panel-border)] bg-gradient-to-br from-amber-950/30 via-[var(--panel-bg)] to-emerald-950/20 p-6 md:p-8 backdrop-blur-xl shadow-xl">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <img 
              src="/geeta-logo.png" 
              alt="Geeta University Logo" 
              className="h-14 md:h-16 w-auto object-contain bg-white rounded-2xl p-1.5 shadow-md border border-slate-200 hidden sm:block" 
            />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5" /> Institutional Documentation & Submissions Hub
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                {isHeadPortal ? 'Department Report Submissions' : 'Official Reports & Reviews'}
              </h1>
              <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl">
                {isHeadPortal 
                  ? 'Submit Geeta University 7-page institutional event reports, track VC Office verification status, review remarks, and earn department performance points.'
                  : 'Review submitted institutional reports from department heads, verify compliance with UN SDGs & budgets, grant official approval seals, and award leaderboard points.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate(`${basePath}/new`)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 
              {isHeadPortal ? 'Submit New Report' : 'Create Official Report'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div 
          onClick={() => setStatusTab('all')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusTab === 'all' 
              ? 'border-blue-500/60 bg-blue-500/10 shadow-md' 
              : 'border-[var(--panel-border)] bg-[var(--panel-bg)] hover:border-blue-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[var(--text-muted)] mb-1">
            <span>Total Reports</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">{totalCount}</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-1">Archived Records</div>
        </div>

        <div 
          onClick={() => setStatusTab('pending')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusTab === 'pending' 
              ? 'border-amber-500/60 bg-amber-500/10 shadow-md' 
              : 'border-[var(--panel-border)] bg-[var(--panel-bg)] hover:border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-400 mb-1">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 flex items-center gap-2">
            {pendingCount}
            {pendingCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">Awaiting VC Review</div>
        </div>

        <div 
          onClick={() => setStatusTab('approved')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusTab === 'approved' 
              ? 'border-emerald-500/60 bg-emerald-500/10 shadow-md' 
              : 'border-[var(--panel-border)] bg-[var(--panel-bg)] hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase text-emerald-400 mb-1">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">{approvedCount}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Officially Verified</div>
        </div>

        <div 
          onClick={() => setStatusTab('needs_revision')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            statusTab === 'needs_revision' 
              ? 'border-rose-500/60 bg-rose-500/10 shadow-md' 
              : 'border-[var(--panel-border)] bg-[var(--panel-bg)] hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase text-rose-400 mb-1">
            <span>Needs Revision</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">{revisionCount}</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Feedback Provided</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-400 mb-1">
            <span>Points Earned</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">+{totalPoints} <span className="text-xs font-semibold text-[var(--text-muted)]">pts</span></div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-1">Leaderboard Reward</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-[var(--panel-border)] rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports by event name, coordinator, department, submitter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-[var(--panel-border)] text-[var(--text-primary)] text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Department Filter Dropdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-[var(--panel-border)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-[var(--panel-border)]">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === 'cards' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Submissions Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-[var(--panel-border)]">
          {[
            { id: 'all', label: 'All Reports', count: totalCount },
            { id: 'pending', label: 'Pending Review Submissions', count: pendingCount, highlight: 'amber' },
            { id: 'approved', label: 'Approved Official Reports', count: approvedCount, highlight: 'emerald' },
            { id: 'needs_revision', label: 'Needs Revision', count: revisionCount, highlight: 'rose' },
            { id: 'draft', label: 'Drafts' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
                statusTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  statusTab === tab.id
                    ? 'bg-black/20 text-slate-950'
                    : tab.highlight === 'amber' && tab.count > 0
                    ? 'bg-amber-500/20 text-amber-400'
                    : tab.highlight === 'rose' && tab.count > 0
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">Loading official reports and submissions...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-[var(--panel-border)] p-8 space-y-4">
          <FileText className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">No Reports Found</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1">
              {searchQuery || statusTab !== 'all' || selectedDeptId !== 'all'
                ? 'No reports matched your selected filter criteria. Try clearing search filters.'
                : 'Get started by creating your first official 7-page institutional event report.'}
            </p>
          </div>
          <button
            onClick={() => navigate(`${basePath}/new`)}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md hover:bg-emerald-400 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create New Report
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 border border-[var(--panel-border)] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider border-b border-[var(--panel-border)]">
                <tr>
                  <th className="py-3.5 px-4">Event Report</th>
                  <th className="py-3.5 px-4">Submitting Department / HOD</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Budget & Attendees</th>
                  <th className="py-3.5 px-4">Review Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--panel-border)]">
                {filteredReports.map((r) => {
                  const isSubmitted = r.status === 'submitted' || r.review_status === 'pending_review';
                  const isApproved = r.status === 'approved' || r.review_status === 'approved';
                  const isRevision = r.status === 'needs_revision' || r.review_status === 'needs_revision';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-sm text-[var(--text-primary)] hover:text-emerald-500 cursor-pointer line-clamp-1" onClick={() => navigate(`${basePath}/${r.id}`)}>
                          {r.event_name}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                          {r.category || 'Institutional Event'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {r.department_name || r.organized_by || 'Department'}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                          <span>By: {r.creator_name || r.coordinator_name || 'HOD'}</span>
                          {r.creator_employee_id && <span className="font-mono">({r.creator_employee_id})</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-[var(--text-secondary)] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : r.from_date || 'Draft'}</span>
                        </div>
                        {r.total_days && (
                          <span className="text-[10px] text-[var(--text-muted)]">{r.total_days} {r.total_days === 1 ? 'day' : 'days'}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[var(--text-primary)]">
                          ₹{(r.total_budget_amount || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          {r.participants_total || 0} participants
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isApproved ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          isSubmitted ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse' :
                          isRevision ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                          'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                        }`}>
                          {isApproved ? '✓ Approved' : isSubmitted ? '⏳ Pending VC Review' : isRevision ? '⚠️ Revision Req.' : 'Draft'}
                        </span>
                        {r.points_awarded ? (
                          <div className="text-[10px] text-amber-400 font-bold mt-1">+{r.points_awarded} pts</div>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {!isHeadPortal && (
                            <button
                              onClick={() => openReviewModal(r)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all"
                              title="Review Submission"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Review
                            </button>
                          )}
                          <button
                            onClick={() => handlePrint(r.id)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                            title="Official Printable View"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`${basePath}/${r.id}`)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Edit / View Form"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.event_name)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((r) => {
            const isSubmitted = r.status === 'submitted' || r.review_status === 'pending_review';
            const isApproved = r.status === 'approved' || r.review_status === 'approved';
            const isRevision = r.status === 'needs_revision' || r.review_status === 'needs_revision';

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-900 border border-[var(--panel-border)] rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3.5">
                  {/* Status & ID Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isApproved ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      isSubmitted ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs' :
                      isRevision ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                      'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                    }`}>
                      {isSubmitted && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                      {isApproved ? '✓ Approved & Verified' : isSubmitted ? 'Pending VC Review' : isRevision ? '⚠️ Revision Req.' : 'Draft'}
                    </span>

                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      #{r.id}
                    </span>
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h3 
                      onClick={() => navigate(`${basePath}/${r.id}`)}
                      className="text-base font-bold text-[var(--text-primary)] line-clamp-2 group-hover:text-emerald-400 cursor-pointer transition-colors"
                    >
                      {r.event_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        {r.department_name || r.organized_by || 'Department'}
                      </span>
                      {r.points_awarded ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 text-[10px] font-black border border-amber-500/30 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> +{r.points_awarded} pts
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Submission & Submitter Information Card */}
                  <div className="space-y-2 text-xs text-[var(--text-secondary)] bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-[var(--panel-border)]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Submitted by:</span>
                      <strong className="text-[var(--text-primary)] truncate max-w-[150px]">{r.creator_name || r.coordinator_name || 'HOD'}</strong>
                    </div>

                    {r.submitted_at && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-muted)]">Submitted On:</span>
                        <span className="text-[var(--text-secondary)] font-medium">
                          {new Date(r.submitted_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--panel-border)] text-[11px]">
                      <span>Budget: <strong className="text-[var(--text-primary)]">₹{(r.total_budget_amount || 0).toLocaleString('en-IN')}</strong></span>
                      <span>Attendance: <strong className="text-[var(--text-primary)]">{r.participants_total || 0}</strong></span>
                    </div>

                    {/* Reviewer Feedback Snippet if available */}
                    {r.review_remarks && (
                      <div className="mt-2 pt-2 border-t border-[var(--panel-border)] text-[11px]">
                        <div className="flex items-center gap-1 text-[var(--text-muted)] font-bold text-[10px] uppercase">
                          <MessageSquare className="w-3 h-3 text-purple-400" /> VC Review Remarks:
                        </div>
                        <p className="text-[var(--text-secondary)] italic line-clamp-2 mt-0.5 bg-black/10 p-1.5 rounded-lg">
                          "{r.review_remarks}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handlePrint(r.id)}
                    className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                    title="Official Printable / PDF View"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {!isHeadPortal && (
                    <button
                      onClick={() => openReviewModal(r)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" /> Review
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`${basePath}/${r.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> View Form
                  </button>

                  <button
                    onClick={() => handleDelete(r.id, r.event_name)}
                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VC Review Modal (for Admins) */}
      {reviewModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-[var(--panel-border)] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[var(--text-primary)]">VC Office Official Report Review</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Review submission from {reviewModalReport.department_name || reviewModalReport.creator_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setReviewModalReport(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-[var(--panel-border)] space-y-2 text-xs">
              <div className="font-bold text-sm text-[var(--text-primary)]">{reviewModalReport.event_name}</div>
              <div className="flex items-center gap-4 text-[var(--text-secondary)] text-[11px]">
                <span>Dept: <strong>{reviewModalReport.department_name || 'N/A'}</strong></span>
                <span>Submitted: <strong>{reviewModalReport.submitted_at ? new Date(reviewModalReport.submitted_at).toLocaleString() : 'Recent'}</strong></span>
                <span>Budget: <strong>₹{(reviewModalReport.total_budget_amount || 0).toLocaleString('en-IN')}</strong></span>
              </div>
            </div>

            {/* Review Decision Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Review Decision / Action
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction('approve')}
                  className={`p-3.5 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 border transition-all ${
                    reviewAction === 'approve'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-emerald-500/40'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Approve & Verify</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction('needs_revision')}
                  className={`p-3.5 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 border transition-all ${
                    reviewAction === 'needs_revision'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-amber-500/40'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span>Request Revision</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction('reject')}
                  className={`p-3.5 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 border transition-all ${
                    reviewAction === 'reject'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-rose-500/40'
                  }`}
                >
                  <X className="w-5 h-5 text-rose-400" />
                  <span>Decline / Reject</span>
                </button>
              </div>
            </div>

            {/* If Approve: Points Award & Signer */}
            {reviewAction === 'approve' && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Trophy className="w-4 h-4" /> Award Department Performance Points
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[10, 25, 50, 100].map(pts => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setPointsAwarded(pts)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                          pointsAwarded === pts
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        +{pts}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-500/20">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Custom Points Award</label>
                    <input
                      type="number"
                      value={pointsAwarded}
                      onChange={(e) => setPointsAwarded(Number(e.target.value) || 0)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 font-bold text-xs"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Verification Seal / Signer</label>
                    <input
                      type="text"
                      value={dswVerifiedBy}
                      onChange={(e) => setDswVerifiedBy(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-[var(--text-primary)] text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Review Remarks Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center justify-between">
                <span>Official Feedback & Review Remarks</span>
                {reviewAction === 'needs_revision' && <span className="text-rose-400 font-normal lowercase">(required for revision)</span>}
              </label>
              <textarea
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                placeholder={
                  reviewAction === 'approve'
                    ? 'e.g., Excellent documentation and high attendee engagement. Verified with UN SDG compliance.'
                    : reviewAction === 'needs_revision'
                    ? 'e.g., Please upload the verified expenditure receipts in Page 3 and re-submit for approval.'
                    : 'e.g., Report did not meet institutional format guidelines.'
                }
                rows={3}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--panel-border)]">
              <button
                type="button"
                onClick={() => setReviewModalReport(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-[var(--text-secondary)] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReview}
                disabled={submittingReview}
                className={`px-6 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg flex items-center gap-2 active:scale-95 transition-all ${
                  reviewAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                    : reviewAction === 'needs_revision'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                }`}
              >
                {submittingReview ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {reviewAction === 'approve' ? 'Confirm Approval & Award Points' : reviewAction === 'needs_revision' ? 'Send Revision Request' : 'Decline Report'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official HTML Printable Modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-5xl h-[90vh] bg-white rounded-3xl shadow-2xl relative flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Official Geeta University Event Report (Print / PDF View)</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const iframe = document.getElementById('print-list-iframe') as HTMLIFrameElement;
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.print();
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white transition-all shadow-md"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button onClick={() => setPreviewHtml(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe
              id="print-list-iframe"
              srcDoc={previewHtml}
              title="Official Event Report"
              className="w-full flex-1 border-none bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventReportsListPage;
