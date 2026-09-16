import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth, User } from '../../context/AuthContext';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  Users, Plus, Trash2, Calendar, User as UserIcon, MapPin,
  Clock, Printer, Download, Eye, X, CheckCircle2, Shield, Sparkles, Award, Star
} from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  start_date?: string;
  venue?: string;
}

interface StudentItem {
  id: number;
  name: string;
  roll_number?: string;
  department?: string;
  phone?: string;
}

interface RoleRow {
  role_name: string;
  student_id: number | '';
  responsibilities: string;
}

interface StudentRoleData {
  role_name: string;
  student_id: number;
  student_name: string;
  student_roll_no?: string;
  department?: string;
  phone?: string;
  responsibilities?: string;
}

interface CoreCommitteeData {
  id: number;
  title: string;
  event_id: number;
  event_title: string;
  event_date?: string;
  faculty_id: number;
  faculty_name: string;
  description?: string;
  student_roles: StudentRoleData[];
  created_by: number;
  creator_name: string;
  created_at: string;
}

export const CoreCommitteesPage: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const canCreate = user?.role === 'super_admin' || user?.role === 'faculty';

  const [committees, setCommittees] = useState<CoreCommitteeData[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [studentsList, setStudentsList] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [eventDate, setEventDate] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>('');
  const [committeeTitle, setCommitteeTitle] = useState('');
  const [committeeDescription, setCommitteeDescription] = useState('');
  const [roleRows, setRoleRows] = useState<RoleRow[]>([
    { role_name: 'Student Convenor / Lead', student_id: '', responsibilities: 'Overall event coordination & execution lead.' },
    { role_name: 'Co-Convenor & Operations', student_id: '', responsibilities: 'Assist convenor in stage management & schedules.' },
    { role_name: 'Media & Public Relations Head', student_id: '', responsibilities: 'Oversee social media coverage & photography.' },
    { role_name: 'Logistics & Hospitality Lead', student_id: '', responsibilities: 'Manage guest reception, seating & refreshments.' }
  ]);

  // View / Print Modal State
  const [selectedCommitteeForPrint, setSelectedCommitteeForPrint] = useState<CoreCommitteeData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cData, evData, facData, stuData] = await Promise.all([
        apiRequest<CoreCommitteeData[]>('/committees'),
        apiRequest<EventItem[]>('/events'),
        apiRequest<User[]>('/users/faculty'),
        apiRequest<StudentItem[]>('/users/students')
      ]);
      setCommittees(cData);
      setEventsList(evData);
      setFacultyList(facData);
      setStudentsList(stuData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEventSelect = (eId: number) => {
    setSelectedEventId(eId);
    const ev = eventsList.find(e => e.id === eId);
    if (ev) {
      setCommitteeTitle(`Student Core Committee - ${ev.title}`);
      if (ev.start_date) {
        setEventDate(ev.start_date.split('T')[0]);
      }
    }
  };

  const handleAddRoleRow = () => {
    setRoleRows([
      ...roleRows,
      { role_name: '', student_id: '', responsibilities: '' }
    ]);
  };

  const handleRemoveRoleRow = (index: number) => {
    setRoleRows(roleRows.filter((_, idx) => idx !== index));
  };

  const handleRoleRowChange = (index: number, field: keyof RoleRow, value: any) => {
    const updated = [...roleRows];
    updated[index] = { ...updated[index], [field]: value };
    setRoleRows(updated);
  };

  const handleCreateCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return alert('Please select an event!');
    if (!selectedFacultyId) return alert('Please select a Faculty Coordinator / Mentor!');
    if (!committeeTitle.trim()) return alert('Please enter a Committee Title!');

    const validRoles = roleRows.filter(r => r.role_name.trim() && r.student_id);
    if (validRoles.length === 0) {
      return alert('Please assign at least one student role!');
    }

    try {
      await apiRequest('/committees', 'POST', {
        title: committeeTitle,
        event_id: Number(selectedEventId),
        event_date: eventDate,
        faculty_id: Number(selectedFacultyId),
        description: committeeDescription,
        student_roles: validRoles.map(r => ({
          role_name: r.role_name,
          student_id: Number(r.student_id),
          responsibilities: r.responsibilities
        }))
      });

      setIsCreateModalOpen(false);
      setCommitteeTitle('');
      setCommitteeDescription('');
      setSelectedEventId('');
      setSelectedFacultyId('');
      setEventDate('');
      fetchData();
      alert('Student Core Committee created successfully! Appointed students have been notified.');
    } catch (err: any) {
      alert(err.message || 'Failed to create Core Committee');
    }
  };

  const handleDeleteCommittee = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await apiRequest(`/committees/${id}`, 'DELETE');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete Core Committee');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" /> Student Core Committees & Event Leadership
          </h2>
          <p className="text-xs text-slate-400 mt-1">Form official student organizing committees, appoint student leaders & convenors, and generate formal VC Office appointment letters.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary bg-emerald-600 hover:bg-emerald-500 shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Form Core Committee
          </button>
        )}
      </div>

      {/* Core Committees List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 glass-panel">Loading core committees...</div>
        ) : committees.length === 0 ? (
          <div className="p-8 text-center text-slate-500 glass-panel">
            No student core committees formed yet. {canCreate && "Click 'Form Core Committee' to appoint student leaders."}
          </div>
        ) : (
          committees.map(comm => (
            <div key={comm.id} className="glass-panel p-6 space-y-4 hover:border-emerald-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {comm.event_title}
                    </span>
                    {comm.event_date && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" /> Date: {comm.event_date}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" /> {comm.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedCommitteeForPrint(comm)}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Appointment Letter
                  </button>
                  {canCreate && (
                    <button
                      onClick={() => handleDeleteCommittee(comm.id, comm.title)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                      title="Delete Committee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Faculty Mentor / In-Charge</div>
                  <div className="text-sm font-semibold text-emerald-300 mt-1 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-emerald-400" /> {comm.faculty_name}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Student Committee Size</div>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">{comm.student_roles.length} Appointed Leaders</div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Scope & Mandate</div>
                  <div className="text-xs text-slate-300 truncate mt-1">{comm.description || 'Full event planning, execution & coordination.'}</div>
                </div>
              </div>

              {/* Student Appointed Leaders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {comm.student_roles.map((st, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1">
                    <div className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" /> {st.role_name}
                    </div>
                    <div className="text-sm font-bold text-slate-100">{st.student_name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Roll: {st.student_roll_no || 'N/A'}</span>
                      <span className="text-emerald-400">{st.department || 'Student'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Core Committee Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel p-6 shadow-2xl relative space-y-4 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Form Student Core Committee
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommittee} className="space-y-5">
              {/* Event, Date, Faculty Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Event</label>
                  <select
                    required
                    value={selectedEventId}
                    onChange={e => handleEventSelect(Number(e.target.value))}
                    className="glass-input text-xs"
                  >
                    <option value="">-- Select Event --</option>
                    {eventsList.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Faculty In-Charge / Mentor</label>
                  <select
                    required
                    value={selectedFacultyId}
                    onChange={e => setSelectedFacultyId(e.target.value ? Number(e.target.value) : '')}
                    className="glass-input text-xs"
                  >
                    <option value="">-- Select Faculty --</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.department || 'Faculty'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Committee Title</label>
                <input
                  required
                  type="text"
                  value={committeeTitle}
                  onChange={e => setCommitteeTitle(e.target.value)}
                  placeholder="Student Organizing Core Committee - TechFest 2026"
                  className="glass-input text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">Scope & Mandate / Directives</label>
                  <ImproveEnglishButton text={committeeDescription} onImproved={setCommitteeDescription} context="Core committee charter, scope, and objectives" />
                </div>
                <textarea
                  rows={2}
                  value={committeeDescription}
                  onChange={e => setCommitteeDescription(e.target.value)}
                  placeholder="Describe committee objective and responsibilities..."
                  className="glass-input text-xs"
                />
              </div>

              {/* Dynamic Student Roles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" /> Student Leadership Roles ({roleRows.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddRoleRow}
                    className="btn-secondary text-xs py-1 px-3 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Role
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {roleRows.map((row, idx) => (
                    <div key={idx} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3 relative">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span className="text-emerald-400">Student Role #{idx + 1}</span>
                        {roleRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRoleRow(idx)}
                            className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove Role
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">Role Title / Designation</label>
                          <input
                            required
                            type="text"
                            value={row.role_name}
                            onChange={e => handleRoleRowChange(idx, 'role_name', e.target.value)}
                            placeholder="e.g. Student Convenor, Stage Lead"
                            className="glass-input text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">Select Student</label>
                          <select
                            required
                            value={row.student_id}
                            onChange={e => handleRoleRowChange(idx, 'student_id', e.target.value ? Number(e.target.value) : '')}
                            className="glass-input text-xs"
                          >
                            <option value="">-- Select Student --</option>
                            {studentsList.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.roll_number || 'N/A'} - {s.department || 'Student'})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">Key Responsibilities (Optional)</label>
                        <input
                          type="text"
                          value={row.responsibilities}
                          onChange={e => handleRoleRowChange(idx, 'responsibilities', e.target.value)}
                          placeholder="e.g. Lead overall stage setup and mic testing"
                          className="glass-input text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary bg-emerald-600 hover:bg-emerald-500">Form & Publish Core Committee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Appointment Letter Printable View Modal */}
      {selectedCommitteeForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-950 text-slate-100 p-8 rounded-2xl shadow-2xl relative space-y-6 my-8 border border-slate-800 print:m-0 print:p-0 print:border-none print:bg-white print:text-black">
            
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" /> Official Appointment Order Preview
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-xs py-2 px-4 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Print / Save as PDF
                </button>
                <button onClick={() => setSelectedCommitteeForPrint(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Official Appointment Order Document */}
            <div className="p-6 bg-white text-slate-900 rounded-xl space-y-6 shadow-inner font-sans border border-slate-300">
              
              {/* Document Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <img src="/geeta-logo.png" alt="Geeta University" className="h-14 mx-auto object-contain mb-1" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">OFFICE OF THE VICE CHANCELLOR (VC OFFICE)</h1>
                <div className="text-sm font-extrabold text-emerald-900 uppercase tracking-wide mt-1">OFFICIAL STUDENT CORE COMMITTEE APPOINTMENT ORDER</div>
                <div className="text-xs font-semibold text-slate-500">Ref: VC/GU/CC/{selectedCommitteeForPrint.id}/2026 • Date: {new Date(selectedCommitteeForPrint.created_at).toLocaleDateString()}</div>
              </div>

              {/* Event & Faculty Details */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-100 rounded border border-slate-300 text-xs">
                <div>
                  <p><strong>Event Name:</strong> {selectedCommitteeForPrint.event_title}</p>
                  <p><strong>Event Date:</strong> {selectedCommitteeForPrint.event_date || 'TBA'}</p>
                  <p><strong>Committee Title:</strong> {selectedCommitteeForPrint.title}</p>
                </div>
                <div>
                  <p><strong>Faculty Mentor In-Charge:</strong> {selectedCommitteeForPrint.faculty_name}</p>
                  <p><strong>Issuing Authority:</strong> {selectedCommitteeForPrint.creator_name}</p>
                  <p><strong>Status:</strong> Approved & Published</p>
                </div>
              </div>

              {/* Order Preamble */}
              <p className="text-xs text-slate-800 leading-relaxed">
                As per the approval of the Vice Chancellor Office (VC Office), the following students are hereby appointed as office bearers and core committee members for the upcoming university event <strong>"{selectedCommitteeForPrint.event_title}"</strong>. The committee shall work under the direct supervision of Faculty Mentor <strong>{selectedCommitteeForPrint.faculty_name}</strong>.
              </p>

              {/* Appointed Students Table */}
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="bg-slate-200 font-bold text-slate-900 border-b border-slate-300 uppercase">
                    <tr>
                      <th className="p-2.5 border-r border-slate-300 text-center w-12">S.No</th>
                      <th className="p-2.5 border-r border-slate-300">Designation / Role</th>
                      <th className="p-2.5 border-r border-slate-300">Student Name</th>
                      <th className="p-2.5 border-r border-slate-300">Roll Number</th>
                      <th className="p-2.5 border-r border-slate-300">Department</th>
                      <th className="p-2.5">Responsibilities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-900 font-medium">
                    {selectedCommitteeForPrint.student_roles.map((st, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-700">{idx + 1}</td>
                        <td className="p-2.5 border-r border-slate-300 font-bold text-emerald-900">{st.role_name}</td>
                        <td className="p-2.5 border-r border-slate-300 font-bold text-slate-900">{st.student_name}</td>
                        <td className="p-2.5 border-r border-slate-300 font-mono text-slate-700">{st.student_roll_no || 'N/A'}</td>
                        <td className="p-2.5 border-r border-slate-300 text-slate-600">{st.department || 'General'}</td>
                        <td className="p-2.5 text-slate-700 text-[11px]">{st.responsibilities || 'General Committee Duties'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-10 flex justify-between items-end text-xs text-slate-700 font-bold border-t border-slate-200 mt-6">
                <div>
                  <div className="w-36 h-10 border-b border-dashed border-slate-400 mb-1" />
                  <p className="font-bold text-slate-900">{selectedCommitteeForPrint.faculty_name}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Faculty Mentor In-Charge</p>
                </div>
                <div className="text-right">
                  <div className="w-36 h-10 border-b border-dashed border-slate-400 ml-auto mb-1" />
                  <p className="font-bold text-slate-900 text-sm">Vice Chancellor Office</p>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Geeta University, Panipat</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
