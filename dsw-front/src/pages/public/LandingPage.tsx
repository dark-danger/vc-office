import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { 
  Trophy, Flame, Sparkles, Calendar, ArrowRight, Shield, 
  Briefcase, GraduationCap, Star, Award, CheckCircle2, Music, Activity
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

interface StudentRank {
  student_id: number;
  name: string;
  course_branch: string;
  total_points: number;
  rank: number;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [topStudents, setTopStudents] = useState<StudentRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLandingData() {
      try {
        const [eventsData, rankingsData] = await Promise.all([
          apiRequest<EventItem[]>('/events'),
          apiRequest<StudentRank[]>('/leaderboard/students/rankings')
        ]);
        setEvents(eventsData.slice(0, 3));
        setTopStudents(rankingsData.slice(0, 3));
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
            Empowering Campus Life, <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 dark:from-emerald-400 dark:via-teal-300 dark:to-white bg-clip-text text-transparent">
              Academic Leadership & Excellence
            </span>
          </h1>

          <p className="text-xs sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto font-medium leading-relaxed">
            Centralized hub for Geeta University executive governance, faculty coordination, and student initiatives. Track task duties, manage institutional events, oversee duty charts, and monitor campus progress.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 w-full sm:w-auto">
            <button onClick={() => navigate('/login')} className="btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 w-full sm:w-auto justify-center">
              Explore User Portal
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <a href="#events" className="btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 w-full sm:w-auto justify-center text-center">
              Upcoming Events & Initiatives
            </a>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid (Star Nights, Sports, Events) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-[var(--text-primary)] font-display">Institutional Vibrancy & Highlights</h2>
          <p className="text-xs text-[var(--text-secondary)]">Discover the pulse of student & faculty activities at Geeta University</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Star Nights */}
          <div className="glass-card p-6 relative overflow-hidden group border-emerald-500/30">
            <div className="p-3 w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-500 mb-4 flex items-center justify-center border border-emerald-500/30">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Celebrity Star Nights</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Unforgettable cultural symposiums, musical concerts, and DJ nights featuring renowned artists and guest keynotes.
            </p>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              Annual Technophilia Fest <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 2: Sports Tournaments */}
          <div className="glass-card p-6 relative overflow-hidden group border-teal-500/30">
            <div className="p-3 w-12 h-12 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 mb-4 flex items-center justify-center border border-teal-500/30">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Sports Meet & Leagues</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Inter-departmental cricket, football, athletics, and indoor games championships with live leaderboard scoring.
            </p>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-300 flex items-center gap-1">
              Geeta Sports Cup 2026 <Trophy className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 3: Leaderboard Challenges */}
          <div className="glass-card p-6 relative overflow-hidden group border-emerald-500/30">
            <div className="p-3 w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-500 mb-4 flex items-center justify-center border border-emerald-500/30">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Gamified Leaderboards</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
              Participate in social welfare initiatives, blood donation drives, and academic publishing to earn university reward points.
            </p>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              Real-time Student Ranks <Star className="w-3.5 h-3.5" />
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

      {/* Student Hall of Fame Leaderboard Preview */}
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-[var(--panel-border)] space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] font-display flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Student Hall of Fame
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">Top ranking student coordinators on the Geeta University Leaderboard</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {topStudents.map((stu) => (
            <div key={stu.student_id} className="glass-panel p-6 text-center space-y-3 relative overflow-hidden border border-emerald-500/30">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0e8a6e] to-emerald-400 mx-auto flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/20">
                #{stu.rank}
              </div>
              <h4 className="font-bold text-base text-[var(--text-primary)]">{stu.name}</h4>
              <p className="text-xs text-[var(--text-secondary)]">{stu.course_branch}</p>
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                ⭐ {stu.total_points} Reward Points
              </div>
            </div>
          ))}
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
