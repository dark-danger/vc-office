import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth, User } from '../../context/AuthContext';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  HelpCircle, CheckCircle2, RotateCcw, Clock, User as UserIcon,
  MessageSquare, X, PlusCircle, Send, Building2, GraduationCap, Shield
} from 'lucide-react';

interface QueryItem {
  id: number;
  raised_by: number;
  raiser?: User;
  raiser_role: string;
  subject: string;
  category: string;
  description: string;
  status: 'open' | 'closed';
  target_type?: string;
  target_faculty_id?: number;
  target_faculty_name?: string;
  target_faculty?: User;
  admin_remarks?: string;
  closer?: User;
  closed_at?: string;
  created_at: string;
}

export const QueriesPage: React.FC = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | ''>('');
  const [roleFilter, setRoleFilter] = useState<'faculty' | 'student' | ''>('');
  const [loading, setLoading] = useState(true);

  // Create Query Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetType, setTargetType] = useState<'admin' | 'faculty_head'>('admin');
  const [targetFacultyId, setTargetFacultyId] = useState<number | ''>('');
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Close Query Modal
  const [selectedQuery, setSelectedQuery] = useState<QueryItem | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');

  const fetchQueries = async () => {
    setLoading(true);
    try {
      let url = '/queries?';
      if (statusFilter) url += `status_filter=${statusFilter}&`;
      if (roleFilter && user?.role === 'super_admin') url += `role_filter=${roleFilter}&`;
      const data = await apiRequest<QueryItem[]>(url);
      setQueries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const data = await apiRequest<User[]>('/users/faculty');
      setFacultyList(data);
      if (data.length > 0 && !targetFacultyId) {
        setTargetFacultyId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQueries();
    fetchFaculty();
  }, [statusFilter, roleFilter]);

  const handleCreateQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    let facName = undefined;
    if (targetType === 'faculty_head' && targetFacultyId) {
      const facObj = facultyList.find(f => f.id === Number(targetFacultyId));
      facName = facObj?.name;
    }

    setSubmitting(true);
    try {
      await apiRequest('/queries', 'POST', {
        subject: newSubject,
        category: newCategory,
        description: newDescription,
        target_type: targetType,
        target_faculty_id: targetType === 'faculty_head' && targetFacultyId ? Number(targetFacultyId) : null,
        target_faculty_name: facName
      });
      setShowCreateModal(false);
      setNewSubject('');
      setNewCategory('General');
      setNewDescription('');
      setTargetType('admin');
      fetchQueries();
    } catch (err: any) {
      alert(err.message || 'Failed to submit query');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery) return;
    try {
      await apiRequest(`/queries/${selectedQuery.id}/close`, 'POST', {
        admin_remarks: adminRemarks
      });
      setSelectedQuery(null);
      setAdminRemarks('');
      fetchQueries();
    } catch (err: any) {
      alert(err.message || 'Failed to close query');
    }
  };

  const handleReopen = async (id: number) => {
    try {
      await apiRequest(`/queries/${id}/reopen`, 'POST');
      fetchQueries();
    } catch (e) {
      alert('Failed to reopen query');
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-500" /> Grievance & Query Resolution Portal
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isSuperAdmin
              ? 'Review faculty tickets, issue official resolution responses, and resolve grievances.'
              : 'Submit inquiries or administrative requests directly to the VC Office.'}
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="glass-input text-xs w-full sm:w-36">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          {isSuperAdmin && (
            <button
              onClick={() => {
                setTargetType('admin');
                setShowCreateModal(true);
              }}
              className="btn-primary text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 shrink-0"
            >
              <PlusCircle className="w-4 h-4" /> Raise Query
            </button>
          )}
          {!isSuperAdmin && (
            <button
              onClick={() => {
                setTargetType('admin');
                setShowCreateModal(true);
              }}
              className="btn-primary text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 shrink-0"
            >
              <PlusCircle className="w-4 h-4" /> Raise Query
            </button>
          )}
        </div>
      </div>

      {/* Query Ticket List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">Loading queries...</div>
        ) : queries.length === 0 ? (
          <div className="glass-panel p-8 text-center text-[var(--text-muted)] text-sm space-y-2">
            <HelpCircle className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
            <p>No queries found matching the selected filter.</p>
          </div>
        ) : (
          queries.map(q => {
            const isTargetFaculty = q.target_type === 'faculty_head';
            const canResolve = isSuperAdmin || (user?.role === 'faculty' && q.target_faculty_id === user.id);

            return (
              <div
                key={q.id}
                className="glass-card p-5 space-y-3 transition-all hover:border-emerald-500/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-[var(--text-muted)]">#{q.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        q.status === 'open'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {q.status}
                    </span>

                    {/* Target Recipient Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                        isTargetFaculty
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      {isTargetFaculty ? (
                        <>
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>To: Faculty Head ({q.target_faculty_name || q.target_faculty?.name || 'Coordinator'})</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3.5 h-3.5" />
                          <span>To: Admin (VC Office)</span>
                        </>
                      )}
                    </span>
                  </div>

                  <span className="text-xs text-[var(--text-muted)]">{new Date(q.created_at).toLocaleString()}</span>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)]">{q.subject}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{q.description}</p>

                <div className="pt-3 border-t border-[var(--panel-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-[var(--text-muted)] flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      Raised by: <strong className="text-[var(--text-primary)]">{q.raiser?.name || 'User'}</strong> ({q.raiser_role.toUpperCase()})
                    </span>
                  </div>

                  <div>
                    {canResolve && q.status === 'open' && (
                      <button
                        onClick={() => {
                          setSelectedQuery(q);
                          setAdminRemarks('');
                        }}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve & Close Ticket
                      </button>
                    )}

                    {isSuperAdmin && q.status === 'closed' && (
                      <button
                        onClick={() => handleReopen(q.id)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Reopen Ticket
                      </button>
                    )}
                  </div>
                </div>

                {/* Resolution Remarks Box */}
                {q.status === 'closed' && q.admin_remarks && (
                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Official Resolution Remarks:
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{q.admin_remarks}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create New Query Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-4 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-500 shrink-0" /> Raise Query / Grievance
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuery} className="space-y-4">
              {/* Recipient Selection: 2 Options */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--text-primary)]">
                  Select Query Recipient *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setTargetType('admin')}
                    className={`cursor-pointer p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      targetType === 'admin'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                        : 'bg-[var(--card-bg-to)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-emerald-500/30'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs">Admin (VC Office)</span>
                  </div>

                  <div
                    onClick={() => setTargetType('faculty_head')}
                    className={`cursor-pointer p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      targetType === 'faculty_head'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                        : 'bg-[var(--card-bg-to)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-purple-500/30'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 text-purple-500" />
                    <span className="text-xs">Faculty Head / Coordinator</span>
                  </div>
                </div>
              </div>

              {/* Conditional Faculty Coordinator Dropdown */}
              {targetType === 'faculty_head' && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Select Faculty Head / Coordinator *
                  </label>
                  <select
                    required
                    value={targetFacultyId}
                    onChange={e => setTargetFacultyId(e.target.value ? Number(e.target.value) : '')}
                    className="glass-input text-xs"
                  >
                    <option value="">-- Choose Faculty Head --</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.department || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subject / Query Title *</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="e.g. Issue regarding club activity budget / event permission"
                  className="glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category *</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="glass-input text-xs"
                >
                  <option value="General">General Inquiry</option>
                  <option value="Academic">Academic & Departmental</option>
                  <option value="Administrative">Administrative Support</option>
                  <option value="Facilities">Campus & Lab Facilities</option>
                  <option value="Financial">Financial & Approvals</option>
                  <option value="Events">Institutional Events</option>
                  <option value="Grievance">Grievance / Feedback</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Detailed Description *</label>
                  <ImproveEnglishButton text={newDescription} onImproved={setNewDescription} context="Official grievance, query, or campus assistance request" />
                </div>
                <textarea
                  required
                  rows={4}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Please describe your query or grievance in detail..."
                  className="glass-input text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Modal (Admin or Targeted Faculty) */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-4 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Resolve Ticket: {selectedQuery.subject}
              </h3>
              <button onClick={() => setSelectedQuery(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseQuery} className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Official Resolution Remarks *</label>
                  <ImproveEnglishButton text={adminRemarks} onImproved={setAdminRemarks} context="Official administrative resolution remarks and solution to faculty query" />
                </div>
                <textarea
                  required
                  rows={4}
                  value={adminRemarks}
                  onChange={e => setAdminRemarks(e.target.value)}
                  placeholder="Provide resolution details for the ticket raiser..."
                  className="glass-input text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button type="button" onClick={() => setSelectedQuery(null)} className="btn-secondary text-xs w-full sm:w-auto">Cancel</button>
                <button type="submit" className="btn-primary text-xs w-full sm:w-auto">Close Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


