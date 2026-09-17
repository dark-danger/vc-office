import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { 
  Trophy, Sparkles, Calendar, ArrowRight, Shield, 
  Award, Music, Activity, CheckSquare, Users
} from 'lucide-react';
import { ThemeToggle } from '../../components/common/ThemeToggle';

interface EventItem {
  id: number;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  venue: string;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLandingData() {
      try {
        const eventsData = await apiRequest<EventItem[]>('/events');
        setEvents(eventsData.slice(0, 3));
      } catch (e) {
        console.error("Error loading public landing data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadLandingData();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      {/* Top Floating Glass Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[var(--panel-bg)] border-b border-[var(--panel-border)] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#0e8a6e] via-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-base sm:text-xl shadow-lg shadow-emerald-500/30 border border-white/20 shrink-0">
            GU
          </div>
          <div>
            <h1 className="text-sm sm:text-lg font-extrabold tracking-tight font-display text-[var(--text-primary)]">GEETA UNIVERSITY</h1>
            <p className="text-[9px] sm:text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Office of the Vice Chancellor</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <button
            onClick={() => navigate('/login')}
            className="btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4"
          >
            <span className="hidden xs:inline">Sign In to Portal</span>
            <span className="xs:hidden">Sign In</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[90vw] h-[500px] bg-gradient-to-tr from-[#0e8a6e]/25 via-emerald-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[11px] sm:text-xs font-semibold max-w-full truncate">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Official Vice Chancellor Office Digital Governance Portal</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-[var(--text-primary)] font-display">
            Executive Governance, <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 dark:from-emerald-400 dark:via-teal-300 dark:to-white bg-clip-text text-transparent">
              Academic Leadership & Institutional Excellence
            </span>
          </h1>

          <p className="text-xs sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto font-medium leading-relaxed">
            Centralized platform for Geeta University executive governance and Department Head coordination. Track assigned departmental directives, manage institutional events, review compliance reports, and monitor university excellence.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 w-full sm:w-auto">
            <button onClick={() => navigate('/vc/login')} className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 w-full sm:w-auto justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
              VC Office Portal Sign In
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
            </button>
            <button onClick={() => navigate('/head/login')} className="btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 w-full sm:w-auto justify-center">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-emerald-400" />
              Department Head Portal
            </button>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-[var(--text-primary)] font-display">Institutional Governance Pillars</h2>
          <p className="text-xs text-[var(--text-secondary)]">Driving executive mandates, academic excellence, and departmental leadership</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: VC Office Governance */}
          <div className="glass-card p-6 relative overflow-hidden group border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer" onClick={() => navigate('/vc/login')}>
            <div className="p-3 w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-500 mb-4 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">VC Office Executive Portal</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Institutional command center: issue university-wide directives, approve HOD deliverables, monitor university rankings, and manage staff rosters.
            </p>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              Enter VC Portal <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 2: Department Head Directives */}
          <div className="glass-card p-6 relative overflow-hidden group border-teal-500/30 hover:border-teal-500/60 transition-all cursor-pointer" onClick={() => navigate('/head/login')}>
            <div className="p-3 w-12 h-12 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 mb-4 flex items-center justify-center border border-teal-500/30">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Department Head Portal</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Receive official VC mandates, execute departmental tasks, upload proof documentation, and track department leaderboard points.
            </p>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-300 flex items-center gap-1">
              Enter HOD Portal <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 3: Compliance & Reporting */}
          <div className="glass-card p-6 relative overflow-hidden group border-emerald-500/30">
            <div className="p-3 w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-500 mb-4 flex items-center justify-center border border-emerald-500/30">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Compliance & Reporting</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Standardized 7-page institutional event reports with automated budget reconciliations and verified university outcomes.
            </p>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              Geeta University Standard <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>

      {/* Events Grid Section */}
      <section id="events" className="max-w-6xl mx-auto px-6 py-12 border-t border-[var(--panel-border)] space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)] font-display">Featured VC Office Events</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Official university events managed via VC Office Portal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.length > 0 ? (
            events.map((ev) => (
              <div key={ev.id} className="glass-card p-6 space-y-3 border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-center text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-semibold border border-emerald-500/30">
                    {ev.event_type}
                  </span>
                  <span className="text-[var(--text-muted)] flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" /> {ev.start_date ? new Date(ev.start_date).toLocaleDateString() : 'Upcoming'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] leading-snug">{ev.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{ev.description}</p>
                <div className="pt-2 text-xs text-[var(--text-secondary)] font-medium">📍 {ev.venue}</div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-[var(--text-muted)] text-sm">No upcoming public events loaded.</div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--panel-border)] bg-[var(--panel-bg)] py-8 px-6 text-center text-xs text-[var(--text-muted)] space-y-2">
        <p className="font-semibold text-[var(--text-secondary)]">Geeta University — Office of the Vice Chancellor (VC Office)</p>
        <p className="text-[var(--text-muted)]">Built for seamless campus administration, executive task governance, event coordination, and university reporting.</p>
      </footer>
    </div>
  );
};
