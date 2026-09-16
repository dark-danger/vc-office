import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  Users, UserPlus, Upload, FileSpreadsheet, Search, RefreshCw,
  CheckCircle2, AlertCircle, Copy, Download, X, ShieldCheck,
  Mail, Phone, Award, Sparkles, Filter
} from 'lucide-react';

interface FacultyUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  employee_id?: string;
  designation?: string;
  department?: string;
  is_active: boolean;
  score?: number;
}

export const HeadFacultyPage: React.FC = () => {
  const { user } = useAuth();
  const [facultyList, setFacultyList] = useState<FacultyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptId, setDeptId] = useState<number | null>(null);

  // Modal states
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState<any | null>(null);

  // Manual Add state
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    employee_id: '',
    designation: 'Assistant Professor',
    phone: '',
    password: '',
  });
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    fetchDepartmentFaculty();
  }, [user]);

  const fetchDepartmentFaculty = async () => {
    setLoading(true);
    try {
      // Find department
      const depts = await apiRequest<any[]>('/departments');
      const myDept = depts.find((d) => d.id === user?.department_id || d.name === user?.department);
      if (myDept) {
        setDeptName(myDept.name);
        setDeptId(myDept.id);
        const facs = await apiRequest<FacultyUser[]>(`/departments/${myDept.id}/faculty`);
        setFacultyList(facs);
      } else {
        // Fallback to general users list
        const allUsers = await apiRequest<FacultyUser[]>('/users?role=faculty');
        setFacultyList(allUsers);
      }
    } catch (err) {
      console.error('Failed to load faculty list:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = 'name,employee_id,designation,phone,email\nDr. Amit Sharma,GU3001,Associate Professor,+91 9876543210,\nDr. Priya Verma,GU3002,Assistant Professor,+91 9812345678,\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${deptName ? deptName.toLowerCase().replace(/\s+/g, '_') : 'department'}_faculty_sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = async () => {
    if (!deptId || !csvFile) return;
    setUploadingCsv(true);
    setCsvResult(null);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await apiRequest(`/departments/${deptId}/upload-csv`, 'POST', formData, true);
      setCsvResult(res);
      await fetchDepartmentFaculty();
    } catch (err: any) {
      alert(`Bulk CSV Import Failed: ${err.message}`);
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUser(true);
    try {
      const email = addForm.email.trim() || `${addForm.employee_id.trim().toLowerCase()}@geeta.edu.in`;
      const password = addForm.password.trim() || addForm.employee_id.trim();
      const payload = {
        name: addForm.name.trim(),
        email,
        employee_id: addForm.employee_id.trim(),
        designation: addForm.designation.trim(),
        phone: addForm.phone.trim(),
        password,
        role: 'faculty',
        department_id: deptId,
        department: deptName,
      };

      if (deptId) {
        await apiRequest(`/departments/${deptId}/bulk-faculty`, 'POST', {
          faculty_list: [{
            name: payload.name,
            employee_id: payload.employee_id,
            designation: payload.designation,
            phone: payload.phone,
            email: payload.email,
          }]
        });
      } else {
        await apiRequest('/users', 'POST', payload);
      }

      setShowAddModal(false);
      setAddForm({
        name: '',
        email: '',
        employee_id: '',
        designation: 'Assistant Professor',
        phone: '',
        password: '',
      });
      await fetchDepartmentFaculty();
    } catch (err: any) {
      alert(`Error adding faculty member: ${err.message}`);
    } finally {
      setAddingUser(false);
    }
  };

  const copyCredentialsText = () => {
    if (!csvResult || !csvResult.credentials) return;
    const lines = csvResult.credentials.map(
      (c: any) => `Name: ${c.name} | Emp ID: ${c.employee_id} | Email: ${c.email} | Password: ${c.temp_password}`
    );
    navigator.clipboard.writeText(lines.join('\n'));
    alert('Credentials copied to clipboard!');
  };

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.employee_id && f.employee_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.designation && f.designation.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Department Faculty Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {deptName || 'Department'} Faculty Directory
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Manage your department's teaching staff, onboard new faculty individually or in bulk via CSV upload.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[var(--panel-border)] hover:bg-emerald-500/20 text-xs font-bold text-[var(--text-primary)] border border-[var(--panel-border)] transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" /> Add Single Faculty
          </button>
          <button
            onClick={() => {
              setCsvFile(null);
              setCsvResult(null);
              setShowCsvModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Bulk CSV Onboarding
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--panel-bg)] p-3 rounded-2xl border border-[var(--panel-border)] backdrop-blur-md">
        <div className="text-xs font-bold text-[var(--text-primary)] px-2">
          Total Faculty Registered: <span className="text-emerald-400">{facultyList.length}</span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, employee ID, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Faculty Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
          <p className="text-xs text-[var(--text-secondary)]">Fetching department faculty members...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--panel-border)] bg-black/20 text-[var(--text-muted)] uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Faculty Member</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--panel-border)]/50">
                {filteredFaculty.map((fac) => (
                  <tr key={fac.id} className="hover:bg-emerald-500/5 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                          {fac.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                            {fac.name}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">{fac.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {fac.employee_id || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[var(--text-secondary)] font-medium">
                      {fac.designation || 'Faculty Member'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {fac.phone || 'Not provided'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                          fac.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {fac.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredFaculty.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                      No faculty members found. Click <b>"Bulk CSV Onboarding"</b> to import staff.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL 1: BULK CSV ONBOARDING --- */}
      {showCsvModal && (
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
                <p className="text-xs text-[var(--text-muted)]">Onboard dozens or hundreds of faculty members simultaneously</p>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 mb-5 space-y-2">
              <div className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Auto-Generated Credentials Standard:
              </div>
              <ul className="text-[11px] text-[var(--text-secondary)] list-disc list-inside space-y-1">
                <li>If <b>email</b> column is blank, the system automatically assigns: <code className="text-emerald-400 font-mono">&lt;employee_id&gt;@geeta.edu.in</code></li>
                <li>Initial login <b>password</b> will be set directly to their <code className="text-emerald-400 font-mono">&lt;employee_id&gt;</code> (e.g., <code className="text-emerald-400 font-mono">GU3216</code>).</li>
                <li>CSV Headers: <code className="text-emerald-300 font-mono">name,employee_id,designation,phone,email</code></li>
              </ul>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[var(--text-primary)]">Select CSV File</span>
              <button
                onClick={downloadSampleCsv}
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Download Template CSV
              </button>
            </div>

            <div className="border-2 border-dashed border-[var(--panel-border)] hover:border-emerald-500/50 rounded-2xl p-6 text-center bg-black/20 transition-all">
              <input
                type="file"
                accept=".csv"
                id="headCsvFileInput"
                onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                className="hidden"
              />
              <label htmlFor="headCsvFileInput" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-8 h-8 text-emerald-400 mb-2" />
                <div className="font-extrabold text-xs text-[var(--text-primary)]">
                  {csvFile ? csvFile.name : 'Click to Browse or Drag & Drop Faculty CSV'}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Accepts standard .csv format</p>
              </label>
            </div>

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
                  <span>Success: {csvResult.created_count} Faculty Created ({csvResult.updated_count} Updated)</span>
                  {csvResult.credentials && csvResult.credentials.length > 0 && (
                    <button
                      onClick={copyCredentialsText}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy All Credentials
                    </button>
                  )}
                </div>

                {csvResult.credentials && csvResult.credentials.length > 0 && (
                  <div>
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] mb-2">
                      New Faculty Login Credentials ({csvResult.credentials.length})
                    </h4>
                    <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--panel-border)] bg-black/30">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-[var(--panel-border)] text-[var(--text-muted)] uppercase text-[9px] font-bold">
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Emp ID</th>
                            <th className="py-2 px-3">Login Email</th>
                            <th className="py-2 px-3">Initial Password</th>
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

      {/* --- MODAL 2: ADD SINGLE FACULTY --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[var(--text-primary)]">
                  Add Faculty Member
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Department: {deptName || 'Assigned Department'}</p>
              </div>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Gupta"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GU3250"
                    value={addForm.employee_id}
                    onChange={(e) => setAddForm({ ...addForm, employee_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="Assistant Professor"
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[var(--text-muted)] mb-1">
                  Email (Optional - Auto: &lt;emp_id&gt;@geeta.edu.in)
                </label>
                <input
                  type="email"
                  placeholder="Leave empty for auto-generation"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
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
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--panel-border)] text-xs font-bold text-[var(--text-secondary)] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
                >
                  {addingUser ? 'Creating...' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
