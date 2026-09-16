import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth, User } from '../../context/AuthContext';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  FileCheck, Plus, Trash2, Calendar, User as UserIcon, MapPin,
  Clock, Printer, Download, Eye, X, CheckCircle2, Shield, Sparkles, Building2
} from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  start_date?: string;
  venue?: string;
}

interface DutyRow {
  duty_name: string;
  assigned_to_id: number | '';
  venue: string;
  time_slot: string;
  role_description: string;
}

interface DutyChartItem {
  duty_name: string;
  assigned_to_id: number;
  assigned_to_name: string;
  department?: string;
  phone?: string;
  role_description?: string;
  venue?: string;
  time_slot?: string;
}

interface DutyChartData {
  id: number;
  title: string;
  event_id: number;
  event_title: string;
  notes?: string;
  duty_items: DutyChartItem[];
  created_by: number;
  creator_name: string;
  created_at: string;
}

export const DutyChartsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin';

  const [charts, setCharts] = useState<DutyChartData[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [chartTitle, setChartTitle] = useState('');
  const [chartNotes, setChartNotes] = useState('');
  const [dutyRows, setDutyRows] = useState<DutyRow[]>([
    { duty_name: 'Stage & Anchoring Coordinator', assigned_to_id: '', venue: 'Main Auditorium', time_slot: '09:00 AM - 01:00 PM', role_description: 'Oversee stage flow, anchor schedule & micro-phones.' },
    { duty_name: 'Chief Guest Hospitality & Reception', assigned_to_id: '', venue: 'VIP Lounge & Gate 1', time_slot: '08:30 AM - 11:30 AM', role_description: 'Welcome dignitaries and escort to executive lounge.' },
    { duty_name: 'Seating & Hall Discipline', assigned_to_id: '', venue: 'Main Auditorium', time_slot: '09:00 AM - 02:00 PM', role_description: 'Ensure orderly student seating and discipline.' }
  ]);

  // View / Print Modal State
  const [selectedChartForPrint, setSelectedChartForPrint] = useState<DutyChartData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cData, evData, facData] = await Promise.all([
        apiRequest<DutyChartData[]>('/duty-charts'),
        apiRequest<EventItem[]>('/events'),
        apiRequest<User[]>('/users/faculty')
      ]);
      setCharts(cData);
      setEventsList(evData);
      setFacultyList(facData);
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
      setChartTitle(`Official Duty Chart - ${ev.title}`);
    }
  };

  const handleAddDutyRow = () => {
    setDutyRows([
      ...dutyRows,
      { duty_name: '', assigned_to_id: '', venue: '', time_slot: '', role_description: '' }
    ]);
  };

  const handleRemoveDutyRow = (index: number) => {
    setDutyRows(dutyRows.filter((_, idx) => idx !== index));
  };

  const handleDutyRowChange = (index: number, field: keyof DutyRow, value: any) => {
    const updated = [...dutyRows];
    updated[index] = { ...updated[index], [field]: value };
    setDutyRows(updated);
  };

  const handleCreateChart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return alert('Please select an event!');
    if (!chartTitle.trim()) return alert('Please provide a Duty Chart title!');

    const validItems = dutyRows.filter(r => r.duty_name.trim() && r.assigned_to_id);
    if (validItems.length === 0) {
      return alert('Please add at least one duty row with assigned faculty!');
    }

    try {
      await apiRequest('/duty-charts', 'POST', {
        title: chartTitle,
        event_id: Number(selectedEventId),
        notes: chartNotes,
        duty_items: validItems.map(r => ({
          duty_name: r.duty_name,
          assigned_to_id: Number(r.assigned_to_id),
          venue: r.venue,
          time_slot: r.time_slot,
          role_description: r.role_description
        }))
      });

      setIsCreateModalOpen(false);
      setChartTitle('');
      setChartNotes('');
      setSelectedEventId('');
      fetchData();
      alert('Duty Chart created successfully! Assigned faculty members have been notified.');
    } catch (err: any) {
      alert(err.message || 'Failed to create Duty Chart');
    }
  };

  const handleDeleteChart = async (chartId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await apiRequest(`/duty-charts/${chartId}`, 'DELETE');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete Duty Chart');
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-emerald-400" /> Event Duty Charts & Staff Deployments
          </h2>
          <p className="text-xs text-slate-300 mt-1">Generate official event duty rosters, assign faculty responsibilities, and export printable PDF duty charts.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" /> Create New Duty Chart
          </button>
        )}
      </div>

      {/* Duty Charts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)] glass-panel">Loading duty charts...</div>
        ) : charts.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] glass-panel">
            No duty charts published yet. {isAdmin && "Click 'Create New Duty Chart' to assign event duties."}
          </div>
        ) : (
          charts.map(chart => (
            <div key={chart.id} className="glass-panel p-6 space-y-4 hover:border-emerald-500/50 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--panel-border)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                      {chart.event_title}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">Issued: {new Date(chart.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1">{chart.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedChartForPrint(chart)}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View & Download Chart
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteChart(chart.id, chart.title)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors"
                      title="Delete Chart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Stats & Quick Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[var(--card-bg-to)] p-3 rounded-xl border border-[var(--panel-border)]">
                  <div className="text-xs text-[var(--text-muted)] font-medium">Assigned Staff Count</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{chart.duty_items.length} Faculty Members</div>
                </div>
                <div className="bg-[var(--card-bg-to)] p-3 rounded-xl border border-[var(--panel-border)]">
                  <div className="text-xs text-[var(--text-muted)] font-medium">Issuing Authority</div>
                  <div className="text-sm font-semibold text-[var(--text-primary)] mt-1">{chart.creator_name || 'VC Office Admin'}</div>
                </div>
                <div className="bg-[var(--card-bg-to)] p-3 rounded-xl border border-[var(--panel-border)]">
                  <div className="text-xs text-[var(--text-muted)] font-medium">Directives / Guidelines</div>
                  <div className="text-xs text-[var(--text-secondary)] truncate mt-1">{chart.notes || 'Standard VC Office event protocol applies.'}</div>
                </div>
              </div>

              {/* Duty Table Preview */}
              <div className="overflow-x-auto rounded-xl border border-[var(--panel-border)]">
                <table className="w-full min-w-[600px] text-left text-xs text-[var(--text-secondary)]">
                  <thead className="bg-[var(--card-bg-to)] font-bold text-[var(--text-primary)] uppercase border-b border-[var(--panel-border)]">
                    <tr>
                      <th className="p-3">Duty Role</th>
                      <th className="p-3">Assigned Faculty</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Venue & Timing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--panel-border)]">
                    {chart.duty_items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-emerald-500/5">
                        <td className="p-3 font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {item.duty_name}
                        </td>
                        <td className="p-3 font-medium text-emerald-600 dark:text-emerald-300">{item.assigned_to_name}</td>
                        <td className="p-3 text-[var(--text-muted)]">{item.department || 'VC Office'}</td>
                        <td className="p-3 text-[var(--text-secondary)] font-mono">
                          {item.venue || 'Campus'} • {item.time_slot || 'Event Hours'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Duty Chart Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel p-6 shadow-2xl relative space-y-4 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" /> Create Official Event Duty Chart
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChart} className="space-y-5">
              {/* Event Selection & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Event</label>
                  <select
                    required
                    value={selectedEventId}
                    onChange={e => handleEventSelect(Number(e.target.value))}
                    className="glass-input"
                  >
                    <option value="">-- Select Event --</option>
                    {eventsList.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duty Chart Title</label>
                  <input
                    required
                    type="text"
                    value={chartTitle}
                    onChange={e => setChartTitle(e.target.value)}
                    placeholder="Official Duty Chart - Convocation 2026"
                    className="glass-input"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">General Notes & Directives for Staff</label>
                  <ImproveEnglishButton text={chartNotes} onImproved={setChartNotes} context="Duty chart general instructions and directives for faculty and staff" />
                </div>
                <textarea
                  rows={2}
                  value={chartNotes}
                  onChange={e => setChartNotes(e.target.value)}
                  placeholder="e.g. All duty staff members are requested to report in formal attire 30 mins before event start..."
                  className="glass-input text-xs"
                />
              </div>

              {/* Dynamic Duty Rows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-400" /> Duty Assignments ({dutyRows.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddDutyRow}
                    className="btn-secondary text-xs py-1 px-3 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Duty Row
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {dutyRows.map((row, idx) => (
                    <div key={idx} className="p-4 bg-black/60 border border-white/10 rounded-xl space-y-3 relative">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span className="text-emerald-400">Duty Row #{idx + 1}</span>
                        {dutyRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDutyRow(idx)}
                            className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove Row
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">Duty Role / Title</label>
                          <input
                            required
                            type="text"
                            value={row.duty_name}
                            onChange={e => handleDutyRowChange(idx, 'duty_name', e.target.value)}
                            placeholder="e.g. Stage Coordinator, Seating In-charge"
                            className="glass-input text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">Assigned Person (Faculty)</label>
                          <select
                            required
                            value={row.assigned_to_id}
                            onChange={e => handleDutyRowChange(idx, 'assigned_to_id', e.target.value ? Number(e.target.value) : '')}
                            className="glass-input text-xs"
                          >
                            <option value="">-- Select Person --</option>
                            {facultyList.map(f => (
                              <option key={f.id} value={f.id}>{f.name} ({f.department || 'Faculty'})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">Venue / Location</label>
                          <input
                            type="text"
                            value={row.venue}
                            onChange={e => handleDutyRowChange(idx, 'venue', e.target.value)}
                            placeholder="Main Auditorium"
                            className="glass-input text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">Time Slot / Shift</label>
                          <input
                            type="text"
                            value={row.time_slot}
                            onChange={e => handleDutyRowChange(idx, 'time_slot', e.target.value)}
                            placeholder="09:00 AM - 01:00 PM"
                            className="glass-input text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">Instructions / Notes</label>
                          <input
                            type="text"
                            value={row.role_description}
                            onChange={e => handleDutyRowChange(idx, 'role_description', e.target.value)}
                            placeholder="Manage microphones & sequence"
                            className="glass-input text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create & Publish Duty Chart</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Duty Chart PDF / Printable View Modal */}
      {selectedChartForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl relative space-y-6 my-8 border border-[var(--panel-border)] print:m-0 print:p-0 print:border-none print:bg-white print:text-black">
            
            {/* Modal Control Bar (Hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] print:hidden">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-500" /> Printable Duty Chart Preview
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Print / Save as PDF
                </button>
                <button onClick={() => setSelectedChartForPrint(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Official Duty Document Layout */}
            <div className="p-6 bg-white text-slate-900 rounded-xl space-y-6 shadow-inner font-sans border border-slate-300">
              
              {/* Document Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <img src="/geeta-logo.png" alt="Geeta University" className="h-14 mx-auto object-contain mb-1" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">OFFICE OF THE VICE CHANCELLOR (VC OFFICE)</h1>
                <div className="text-sm font-extrabold text-[#0e8a6e] uppercase tracking-wide mt-1">{selectedChartForPrint.title}</div>
                <div className="text-xs font-semibold text-slate-500">Event: {selectedChartForPrint.event_title} • Date of Issue: {new Date(selectedChartForPrint.created_at).toLocaleDateString()}</div>
              </div>

              {/* Directives Notice */}
              {selectedChartForPrint.notes && (
                <div className="p-3 bg-emerald-50 border-l-4 border-l-[#0e8a6e] text-xs text-slate-800 rounded">
                  <strong>General Directives for Duty Staff:</strong> {selectedChartForPrint.notes}
                </div>
              )}

              {/* Duty Table */}
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="bg-slate-200 font-bold text-slate-900 border-b border-slate-300 uppercase">
                    <tr>
                      <th className="p-2.5 border-r border-slate-300 text-center w-12">S.No</th>
                      <th className="p-2.5 border-r border-slate-300">Duty Role / Title</th>
                      <th className="p-2.5 border-r border-slate-300">Assigned Faculty / Staff</th>
                      <th className="p-2.5 border-r border-slate-300">Department</th>
                      <th className="p-2.5 border-r border-slate-300">Venue & Timing</th>
                      <th className="p-2.5">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-900 font-medium">
                    {selectedChartForPrint.duty_items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-700">{idx + 1}</td>
                        <td className="p-2.5 border-r border-slate-300 font-bold text-slate-900">{item.duty_name}</td>
                        <td className="p-2.5 border-r border-slate-300 font-bold text-[#0e8a6e]">{item.assigned_to_name}</td>
                        <td className="p-2.5 border-r border-slate-300 text-slate-600">{item.department || 'VC Office'}</td>
                        <td className="p-2.5 border-r border-slate-300 font-mono text-[11px]">
                          <strong>{item.venue || 'Campus'}</strong><br/>
                          <span className="text-slate-600">{item.time_slot || 'Event Hours'}</span>
                        </td>
                        <td className="p-2.5 text-slate-700 text-[11px]">{item.role_description || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature Section */}
              <div className="pt-8 flex justify-between items-end text-xs text-slate-700 font-bold border-t border-slate-200 mt-6">
                <div>
                  <p>Copy to:</p>
                  <ul className="list-disc list-inside text-[11px] font-normal text-slate-500 mt-1">
                    <li>Office of the Vice Chancellor</li>
                    <li>Registrar Office</li>
                    <li>All Concerned Faculty Members</li>
                  </ul>
                </div>
                <div className="text-right space-y-1">
                  <div className="w-36 h-10 border-b border-dashed border-slate-400 ml-auto" />
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
