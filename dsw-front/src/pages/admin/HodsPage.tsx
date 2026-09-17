import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import {
  ShieldCheck, UserPlus, Search, RefreshCw, Mail, Phone,
  Building2, Trophy, Award, CheckCircle2, X, Sparkles, Filter,
  CheckSquare, ArrowRight, UserCheck, AlertCircle
} from 'lucide-react';

interface DepartmentItem {
  id: number;
  name: string;
  code: string;
  category: string;
  description: string | null;
  points: number;
  head_id: number | null;
  head_name: string | null;
  head_email: string | null;
  head_employee_id: string | null;
  faculty_count: number;
  tasks_assigned: number;
  tasks_completed: number;
  completion_rate: number;
}

export const HodsPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'academic' | 'non_teaching' | 'unassigned'>('all');

  // Assign / Edit HOD Modal state
  const [selectedDept, setSelectedDept] = useState<DepartmentItem | null>(null);
  const [showHodModal, setShowHodModal] = useState(false);
  const [hodForm, setHodForm] = useState({
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    password: '',
  });
  const [assigningHod, setAssigningHod] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<DepartmentItem[]>('/departments');
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHodModal = (dept: DepartmentItem) => {
    setSelectedDept(dept);
    setHodForm({
      name: dept.head_name || '',
      email: dept.head_email || '',
      phone: '',
      employee_id: dept.head_employee_id || '',
      password: '',
    });
    setAssignSuccess(null);
    setShowHodModal(true);
  };

  const handleAssignHod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    setAssigningHod(true);
    try {
      await apiRequest(`/departments/${selectedDept.id}/head`, 'PUT', hodForm);
      setAssignSuccess(`Department Head for ${selectedDept.name} updated successfully!`);
      await fetchDepartments();
      setTimeout(() => {
        setShowHodModal(false);
        setAssignSuccess(null);
      }, 1200);
    } catch (err: any) {
      alert(`Error assigning HOD: ${err.message}`);
    } finally {
      setAssigningHod(false);
    }
  };

  // Metrics
  const totalDepts = departments.length;
  const assignedHods = departments.filter(d => Boolean(d.head_name)).length;
  const unassignedDepts = totalDepts - assignedHods;
  const totalPoints = departments.reduce((sum, d) => sum + (d.points || 0), 0);

  const filteredDepts = departments
    .filter(d => {
      if (categoryFilter === 'academic') return d.category === 'academic';
      if (categoryFilter === 'non_teaching') return d.category === 'non_teaching';
      if (categoryFilter === 'unassigned') return !d.head_name;
      return true;
    })
    .filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.head_name && d.head_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.head_email && d.head_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.head_employee_id && d.head_employee_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header Section */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              VC Office Leadership Roster
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              Heads of Department (HOD) Administration
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              Manage executive leadership across all university departments. Assign HODs, generate official credentials, and monitor department-level directive execution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDepartments}
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
          <div className="p-4 rounded-2xl bg-[var(--card-bg-to)] border border-[var(--panel-border)]">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
              <span>Total Departments</span>
              <Building2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mt-1 font-mono">
              {totalDepts}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Academic & Administrative</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span>HODs Assigned</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {assignedHods}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Active Department Heads</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
              <span>Unassigned</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {unassignedDepts}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Pending HOD Designation</p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--card-bg-to)] border border-[var(--panel-border)]">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
              <span>Total Points</span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-1 font-mono">
              {totalPoints} pts
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Combined Institutional Score</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[var(--panel-bg)] p-3 rounded-2xl border border-[var(--panel-border)]">
        <div className="flex items-center p-1 rounded-xl bg-black/20 border border-[var(--panel-border)] w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Departments ({departments.length})
          </button>
          <button
            onClick={() => setCategoryFilter('academic')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              categoryFilter === 'academic'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Academic (10)
          </button>
          <button
            onClick={() => setCategoryFilter('non_teaching')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              categoryFilter === 'non_teaching'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Non-Teaching (5)
          </button>
          <button
            onClick={() => setCategoryFilter('unassigned')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              categoryFilter === 'unassigned'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Unassigned ({unassignedDepts})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search HOD name, code, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-9 text-xs py-2 w-full"
          />
        </div>
      </div>

      {/* Grid of HOD Cards */}
      {loading ? (
        <div className="p-16 text-center glass-panel space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-[var(--text-secondary)]">Loading HOD Leadership Roster...</p>
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="p-12 text-center glass-panel space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">No Department Heads found</h3>
          <p className="text-xs text-[var(--text-secondary)]">Try adjusting your search query or filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepts.map((dept) => (
            <div
              key={dept.id}
              className="glass-panel p-5 space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <div>
                {/* Department Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--panel-border)]">
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${
                      dept.category === 'academic'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                    }`}>
                      {dept.category === 'academic' ? 'Academic Department' : 'Non-Teaching Dept'}
                    </span>
                    <h3 className="font-extrabold text-base text-[var(--text-primary)] group-hover:text-emerald-500 transition-colors leading-snug">
                      {dept.name}
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-black/30 border border-[var(--panel-border)] text-emerald-500">
                    {dept.code}
                  </span>
                </div>

                {/* HOD Details Box */}
                <div className="my-3.5 p-3.5 rounded-2xl bg-black/20 border border-[var(--panel-border)] space-y-2">
                  <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider flex items-center justify-between">
                    <span>Head of Department</span>
                    {dept.head_name ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
                        <AlertCircle className="w-3 h-3" /> Vacant
                      </span>
                    )}
                  </div>

                  {dept.head_name ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                          {dept.head_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                            {dept.head_name}
                            {dept.head_employee_id && (
                              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-bold">
                                {dept.head_employee_id}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-[var(--text-muted)] truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            {dept.head_email}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center space-y-1">
                      <p className="text-xs text-amber-500 font-medium italic">No HOD assigned yet</p>
                      <button
                        onClick={() => handleOpenHodModal(dept)}
                        className="text-[11px] font-bold text-emerald-500 hover:underline inline-flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Assign Leadership Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Department Stats */}
                <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-[var(--panel-border)]/60 text-xs">
                  <div className="p-2 rounded-xl bg-black/15">
                    <div className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Faculty Staff</div>
                    <div className="font-black text-sm text-[var(--text-primary)] mt-0.5 font-mono">
                      {dept.faculty_count}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/15">
                    <div className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Directives Done</div>
                    <div className="font-black text-sm text-emerald-500 mt-0.5 font-mono">
                      {dept.tasks_completed} <span className="text-[10px] text-[var(--text-muted)]">/ {dept.tasks_assigned}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/15">
                    <div className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Dept Score</div>
                    <div className="font-black text-sm text-amber-500 mt-0.5 font-mono">
                      {dept.points} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={() => handleOpenHodModal(dept)}
                  className="btn-secondary w-full text-xs py-2 justify-center gap-1.5 font-bold hover:border-emerald-500/40"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                  {dept.head_name ? 'Edit HOD Assignment' : 'Assign Department Head'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ASSIGN / EDIT HOD MODAL --- */}
      {showHodModal && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 shadow-2xl relative my-auto animate-in zoom-in-95">
            <button
              onClick={() => setShowHodModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[var(--text-primary)]">
                  Assign Head of Department
                </h3>
                <p className="text-xs text-[var(--text-muted)]">{selectedDept.name} ({selectedDept.code})</p>
              </div>
            </div>

            {assignSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {assignSuccess}
              </div>
            )}

            <form onSubmit={handleAssignHod} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={hodForm.name}
                  onChange={(e) => setHodForm({ ...hodForm, name: e.target.value })}
                  className="glass-input text-xs w-full py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. head.cse@geeta.edu.in"
                  value={hodForm.email}
                  onChange={(e) => setHodForm({ ...hodForm, email: e.target.value })}
                  className="glass-input text-xs w-full py-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GU1001"
                    value={hodForm.employee_id}
                    onChange={(e) => setHodForm({ ...hodForm, employee_id: e.target.value })}
                    className="glass-input text-xs w-full py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={hodForm.phone}
                    onChange={(e) => setHodForm({ ...hodForm, phone: e.target.value })}
                    className="glass-input text-xs w-full py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Password (Optional / Auto-sets to Emp ID)
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to use Employee ID"
                  value={hodForm.password}
                  onChange={(e) => setHodForm({ ...hodForm, password: e.target.value })}
                  className="glass-input text-xs w-full py-2.5"
                />
              </div>

              <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowHodModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningHod}
                  className="btn-primary text-xs py-2 px-5 font-bold shadow-md shadow-emerald-600/20"
                >
                  {assigningHod ? 'Saving...' : 'Save HOD Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
