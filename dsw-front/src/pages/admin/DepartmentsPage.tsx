import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import {
  Building2, Users, UserPlus, Upload, ShieldCheck, CheckCircle2,
  FileSpreadsheet, Award, Search, Plus, RefreshCw, X, ArrowRight,
  TrendingUp, CheckSquare, Sparkles
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

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'academic' | 'non_teaching'>('all');

  // Assign HOD Modal state
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

  // Bulk CSV Modal state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState<any | null>(null);

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
      }, 1500);
    } catch (err: any) {
      alert(`Error assigning HOD: ${err.message}`);
    } finally {
      setAssigningHod(false);
    }
  };

  const handleOpenCsvModal = (dept: DepartmentItem) => {
    setSelectedDept(dept);
    setCsvFile(null);
    setCsvResult(null);
    setShowCsvModal(true);
  };

  const handleCsvUpload = async () => {
    if (!selectedDept || !csvFile) return;
    setUploadingCsv(true);
    setCsvResult(null);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await apiRequest(`/departments/${selectedDept.id}/upload-csv`, 'POST', formData, true);
      setCsvResult(res);
      await fetchDepartments();
    } catch (err: any) {
      alert(`CSV Upload Failed: ${err.message}`);
    } finally {
      setUploadingCsv(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = 'name,employee_id,designation,phone,email\nDr. Amit Sharma,GU3001,Associate Professor,+91 9876543210,\nDr. Priya Verma,GU3002,Assistant Professor,+91 9812345678,\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `faculty_sample_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDepts = departments
    .filter((d) => {
      if (categoryFilter === 'academic') return d.category === 'academic';
      if (categoryFilter === 'non_teaching') return d.category === 'non_teaching';
      return true;
    })
    .filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.head_name && d.head_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" /> 3-Way Governance Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            University Department Management
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Configure Heads of Department (HOD), monitor faculty headcount, and onboard 500+ faculty members via bulk CSV.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDepartments}
            className="p-2.5 rounded-xl bg-[var(--panel-bg)] hover:bg-emerald-500/10 border border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-emerald-400 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--panel-bg)] p-3 rounded-2xl border border-[var(--panel-border)] backdrop-blur-md">
        <div className="flex items-center p-1 rounded-xl bg-black/20 border border-[var(--panel-border)] w-full sm:w-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              categoryFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All ({departments.length})
          </button>
          <button
            onClick={() => setCategoryFilter('academic')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              categoryFilter === 'academic'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Academic (10)
          </button>
          <button
            onClick={() => setCategoryFilter('non_teaching')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              categoryFilter === 'non_teaching'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Non-Teaching (5)
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search departments, codes, HOD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of 15 Departments */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
          <p className="text-xs text-[var(--text-secondary)]">Loading departments hierarchy...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepts.map((dept) => (
            <div
              key={dept.id}
              className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] hover:border-emerald-500/40 backdrop-blur-xl p-5 shadow-lg flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider mb-2 ${
                        dept.category === 'academic'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      }`}
                    >
                      {dept.category === 'academic' ? 'Academic Department' : 'Non-Teaching Dept'}
                    </span>
                    <h3 className="font-extrabold text-base text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors leading-snug">
                      {dept.name}
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-black px-2 py-1 rounded-lg bg-black/40 border border-[var(--panel-border)] text-emerald-400">
                    {dept.code}
                  </span>
                </div>

                {/* HOD Status */}
                <div className="my-4 p-3.5 rounded-xl bg-black/25 border border-[var(--panel-border)]">
                  <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-1 flex items-center justify-between">
                    <span>Head of Department (HOD)</span>
                    {dept.head_name && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  {dept.head_name ? (
                    <div>
                      <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                        {dept.head_name}
                        {dept.head_employee_id && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                            {dept.head_employee_id}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--text-secondary)] truncate mt-0.5">
                        {dept.head_email}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-amber-400/90 font-medium italic">No HOD assigned yet</span>
                      <button
                        onClick={() => handleOpenHodModal(dept)}
                        className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" /> Assign HOD
                      </button>
                    </div>
                  )}
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-[var(--panel-border)]/60">
                  <div className="p-2 rounded-lg bg-black/15">
                    <div className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Faculty</div>
                    <div className="text-sm font-black text-[var(--text-primary)] flex items-center justify-center gap-1 mt-0.5">
                      <Users className="w-3 h-3 text-slate-400" />
                      {dept.faculty_count}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-black/15">
                    <div className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Tasks Done</div>
                    <div className="text-sm font-black text-emerald-400 mt-0.5">
                      {dept.tasks_completed} <span className="text-[10px] text-[var(--text-muted)]">/ {dept.tasks_assigned}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-black/15">
                    <div className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Points</div>
                    <div className="text-sm font-black text-amber-400 mt-0.5">
                      {dept.points} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[var(--panel-border)] flex items-center gap-2">
                <button
                  onClick={() => handleOpenHodModal(dept)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[var(--panel-border)] hover:bg-emerald-500/15 hover:border-emerald-500/30 text-[11px] font-bold text-[var(--text-primary)] border border-transparent transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  {dept.head_name ? 'Edit HOD' : 'Assign HOD'}
                </button>

                <button
                  onClick={() => handleOpenCsvModal(dept)}
                  className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 transition-all flex items-center justify-center gap-1.5"
                  title="Bulk CSV Faculty Onboard"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL 1: ASSIGN / EDIT HOD --- */}
      {showHodModal && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 shadow-2xl relative">
            <button
              onClick={() => setShowHodModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
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
                <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={hodForm.name}
                  onChange={(e) => setHodForm({ ...hodForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. head.cse@geeta.edu.in"
                  value={hodForm.email}
                  onChange={(e) => setHodForm({ ...hodForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GU1001"
                    value={hodForm.employee_id}
                    onChange={(e) => setHodForm({ ...hodForm, employee_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={hodForm.phone}
                    onChange={(e) => setHodForm({ ...hodForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                  Password (Optional / Auto-set to Emp ID or Default)
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to use default / Employee ID"
                  value={hodForm.password}
                  onChange={(e) => setHodForm({ ...hodForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowHodModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--panel-border)] text-xs font-bold text-[var(--text-secondary)] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningHod}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
                >
                  {assigningHod ? 'Assigning...' : 'Save HOD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: BULK FACULTY CSV ONBOARDING --- */}
      {showCsvModal && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCsvModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[var(--text-primary)]">
                  Bulk Faculty CSV Onboarding
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Target Department: <span className="text-emerald-400 font-bold">{selectedDept.name}</span></p>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 mb-5 space-y-2">
              <div className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Automatic Credential Generation:
              </div>
              <ul className="text-[11px] text-[var(--text-secondary)] list-disc list-inside space-y-1">
                <li>If <b>email</b> is omitted in CSV, it will be auto-generated as: <code className="text-emerald-400 font-mono">&lt;employee_id&gt;@geeta.edu.in</code> (e.g., <code className="text-emerald-400 font-mono">gu3216@geeta.edu.in</code>).</li>
                <li>Initial <b>password</b> will be set directly to their <code className="text-emerald-400 font-mono">&lt;employee_id&gt;</code> (e.g., <code className="text-emerald-400 font-mono">GU3216</code>).</li>
                <li>Capable of provisioning hundreds of faculty records seamlessly in a single batch.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[var(--text-primary)]">Upload Faculty CSV File</span>
              <button
                onClick={downloadSampleCsv}
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Download Template CSV
              </button>
            </div>

            {/* Drag and drop / file picker */}
            <div className="border-2 border-dashed border-[var(--panel-border)] hover:border-emerald-500/50 rounded-2xl p-6 text-center bg-black/20 transition-all">
              <input
                type="file"
                accept=".csv"
                id="csvFileInput"
                onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
              />
              <label htmlFor="csvFileInput" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-emerald-400 mb-2" />
                <div className="font-extrabold text-xs text-[var(--text-primary)]">
                  {csvFile ? csvFile.name : 'Click or Drag & Drop Faculty CSV file here'}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Accepts standard .csv format</p>
              </label>
            </div>

            {/* Upload Action */}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2.5 rounded-xl bg-[var(--panel-border)] text-xs font-bold text-[var(--text-secondary)] hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCsvUpload}
                disabled={!csvFile || uploadingCsv}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
              >
                {uploadingCsv ? 'Processing Bulk CSV...' : 'Start Bulk Import'}
              </button>
            </div>

            {/* Results Table */}
            {csvResult && (
              <div className="mt-6 pt-5 border-t border-[var(--panel-border)] space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between">
                  <span>Import Completed: {csvResult.created_count} New Faculty Created ({csvResult.updated_count} Updated)</span>
                </div>

                {csvResult.credentials && csvResult.credentials.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] mb-2">
                      Generated Faculty Credentials ({csvResult.credentials.length})
                    </h4>
                    <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--panel-border)] bg-black/30">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-[var(--panel-border)] text-[var(--text-muted)] uppercase text-[9px] font-bold">
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Employee ID</th>
                            <th className="py-2 px-3">Generated Email</th>
                            <th className="py-2 px-3">Generated Password</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--panel-border)]/50">
                          {csvResult.credentials.map((cred: any, i: number) => (
                            <tr key={i} className="hover:bg-white/5">
                              <td className="py-2 px-3 font-semibold text-[var(--text-primary)]">{cred.name}</td>
                              <td className="py-2 px-3 font-mono text-emerald-400">{cred.employee_id}</td>
                              <td className="py-2 px-3 font-mono text-[var(--text-secondary)]">{cred.email}</td>
                              <td className="py-2 px-3 font-mono text-amber-400 font-bold">{cred.temp_password}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
