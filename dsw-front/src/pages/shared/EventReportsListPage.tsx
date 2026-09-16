import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
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
  X
} from 'lucide-react';

interface EventReportItem {
  id: number;
  event_id?: number;
  event_title?: string;
  status: string;
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
  creator_name?: string;
  created_at: string;
}

export const EventReportsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<EventReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

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

  useEffect(() => {
    fetchReports();
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

  const filteredReports = reports.filter((r) => {
    const matchesSearch = (r.event_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.coordinator_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.organized_by || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-[var(--panel-border)] p-6 rounded-3xl shadow-sm">
        <div className="flex items-start gap-4">
          <img 
            src="/geeta-logo.png" 
            alt="Geeta University Logo" 
            className="h-12 md:h-14 w-auto object-contain bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 hidden sm:block" 
          />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> Institutional Documentation Archive
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mt-2">
              Official Event Reports
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
              Complete 7-page institutional event reports mapped with UN SDGs, budgets, item utilization, geo-tagged photographs, and multi-tier verification signatures.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/events/reports/new')}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 active:scale-95 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Official Report
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-[var(--panel-border)] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports by event name, coordinator, dept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-[var(--panel-border)] text-[var(--text-primary)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1">
          {['all', 'draft', 'submitted', 'approved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'all' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading official event reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-[var(--panel-border)] p-8 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Event Reports Found</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Get started by creating your first official 7-page event report matching the Geeta University format.
          </p>
          <button
            onClick={() => navigate('/admin/events/reports/new')}
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 mt-2"
          >
            <Plus className="w-4 h-4" /> Create New Report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-slate-900 border border-[var(--panel-border)] rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    r.status === 'submitted' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' :
                    r.status === 'approved' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {r.status}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                    ID: #{r.id}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {r.event_name}
                  </h3>
                  {r.category && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                      {r.category}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-[var(--text-secondary)] bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-[var(--panel-border)]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Coord: <strong>{r.coordinator_name || 'N/A'}</strong></span>
                  </div>
                  {r.venue && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{r.venue}</span>
                    </div>
                  )}
                  {r.from_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{r.from_date} ({r.total_days || 1} {r.total_days === 1 ? 'day' : 'days'})</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-[var(--panel-border)] text-[11px]">
                    <span>Participants: <strong>{r.participants_total || 0}</strong></span>
                    <span>Budget: <strong>₹{(r.total_budget_amount || 0).toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-between gap-2">
                <button
                  onClick={() => handlePrint(r.id)}
                  className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                  title="Official Printable / PDF View"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/admin/events/reports/${r.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Form
                </button>
                <button
                  onClick={() => handleDelete(r.id, r.event_name)}
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                  title="Delete Report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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
