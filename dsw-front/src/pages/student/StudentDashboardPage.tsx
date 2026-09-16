import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, User } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  Award, GraduationCap, HelpCircle, Megaphone, Shield,
  ChevronRight, PlusCircle, Send, Building2, Heart, ThumbsUp, PartyPopper, X
} from 'lucide-react';

interface AnnouncementItem {
  id: number;
  title: string;
  body: string;
  audience: string;
  pinned: boolean;
  author?: { name: string };
  created_at: string;
  reaction_counts: Record<string, number>;
  user_reaction?: string;
}

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Raise Query Modal
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [targetType, setTargetType] = useState<'admin' | 'faculty_head'>('admin');
  const [targetFacultyId, setTargetFacultyId] = useState<number | ''>('');
  const [querySubject, setQuerySubject] = useState('');
  const [queryCategory, setQueryCategory] = useState('General');
  const [queryDescription, setQueryDescription] = useState('');
  const [submittingQuery, setSubmittingQuery] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Load Announcements
      const annData = await apiRequest<AnnouncementItem[]>('/announcements');
      setAnnouncements(annData.slice(0, 6));

      // 2. Load Faculty List for queries
      const facData = await apiRequest<User[]>('/users/faculty');
      setFacultyList(facData);
      if (facData.length > 0 && !targetFacultyId) {
        setTargetFacultyId(facData[0].id);
      }
    } catch (e) {
      console.error('Error loading student dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRaiseQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!querySubject.trim() || !queryDescription.trim()) return;

    let facName = undefined;
    if (targetType === 'faculty_head' && targetFacultyId) {
      const facObj = facultyList.find(f => f.id === Number(targetFacultyId));
      facName = facObj?.name;
    }

    setSubmittingQuery(true);
    try {
      await apiRequest('/queries', 'POST', {
        subject: querySubject,
        category: queryCategory,
        description: queryDescription,
        target_type: targetType,
        target_faculty_id: targetType === 'faculty_head' && targetFacultyId ? Number(targetFacultyId) : null,
        target_faculty_name: facName
      });
      setShowQueryModal(false);
      setQuerySubject('');
      setQueryCategory('General');
      setQueryDescription('');
      setTargetType('admin');
      alert("Your query has been dispatched successfully! You can track resolution under 'Raise Query'.");
    } catch (err: any) {
      alert(err.message || 'Failed to submit query');
    } finally {
      setSubmittingQuery(false);
    }
  };

  const handleReact = async (id: number, type: string) => {
    try {
      await apiRequest(`/announcements/${id}/react`, 'POST', { reaction_type: type });
      const annData = await apiRequest<AnnouncementItem[]>('/announcements');
      setAnnouncements(annData.slice(0, 6));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading student workstation...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 1. Welcome Header */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-[var(--text-primary)]">Welcome, {user?.name}!</h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Roll No: <strong className="text-[var(--text-primary)] font-mono">{user?.roll_number || 'GU2026'}</strong> • Course: <strong>{user?.course_branch || 'Engineering & Technology'}</strong> ({user?.year || 'Current Year'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowQueryModal(true)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Raise Query / Grievance
          </button>
        </div>
      </div>

      {/* 2. Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/student/committees" className="glass-card p-5 flex flex-col justify-between group hover:border-emerald-500/50">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Award className="w-4 h-4" /> Student Core Committees
            </div>
            <p className="text-xs text-[var(--text-secondary)]">View official organizing committees, appointments, and institutional event leadership.</p>
          </div>
          <div className="pt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            View Committees <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <div
          onClick={() => setShowQueryModal(true)}
          className="glass-card p-5 flex flex-col justify-between group hover:border-teal-500/50 cursor-pointer"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm">
              <HelpCircle className="w-4 h-4" /> Query & Grievance Cell
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Submit questions or administrative requests directly to the VC Office or Faculty Head.</p>
          </div>
          <div className="pt-3 text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
            Submit Query <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 3. Campus Announcements Preview */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)]">
          <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-500" /> Campus Announcements & Circulars
          </h3>
          <Link to="/student/announcements" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">No announcements published yet.</div>
          ) : (
            announcements.map(ann => (
              <div key={ann.id} className="p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">{ann.title}</h4>
                  <span className="text-xs text-[var(--text-muted)]">{new Date(ann.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{ann.body}</p>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--panel-border)] text-xs">
                  <span className="text-[var(--text-muted)]">By: {ann.author?.name || 'VC Office'}</span>
                  <div className="flex items-center gap-1.5">
                    {['like', 'heart', 'party'].map(type => {
                      const iconMap: any = {
                        like: <ThumbsUp className="w-3 h-3" />,
                        heart: <Heart className="w-3 h-3 text-rose-500" />,
                        party: <PartyPopper className="w-3 h-3 text-purple-500" />
                      };
                      return (
                        <button
                          key={type}
                          onClick={() => handleReact(ann.id, type)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 ${
                            ann.user_reaction === type
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-[var(--card-bg-to)] border-[var(--panel-border)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {iconMap[type]} <span>{ann.reaction_counts[type] || 0}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Raise Query Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-4 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-500 shrink-0" /> Raise Query / Grievance
              </h3>
              <button onClick={() => setShowQueryModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseQuery} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--text-primary)]">Select Query Recipient *</label>
                <div className="grid grid-cols-2 gap-3">
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
                    <span className="text-xs">Faculty Head</span>
                  </div>
                </div>
              </div>

              {targetType === 'faculty_head' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Select Faculty Head *
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
                  value={querySubject}
                  onChange={e => setQuerySubject(e.target.value)}
                  placeholder="e.g. Request for academic certificate verification"
                  className="glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category *</label>
                <select
                  value={queryCategory}
                  onChange={e => setQueryCategory(e.target.value)}
                  className="glass-input text-xs"
                >
                  <option value="General">General Inquiry</option>
                  <option value="Academic">Academic & Exams</option>
                  <option value="Hostel">Hostel & Campus Facilities</option>
                  <option value="Events">Campus Events</option>
                  <option value="Grievance">Grievance / Complaint</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Detailed Description *</label>
                  <ImproveEnglishButton text={queryDescription} onImproved={setQueryDescription} context="Student grievance or official inquiry to university administration" />
                </div>
                <textarea
                  required
                  rows={4}
                  value={queryDescription}
                  onChange={e => setQueryDescription(e.target.value)}
                  placeholder="Please describe your query or grievance in detail..."
                  className="glass-input text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setShowQueryModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" disabled={submittingQuery} className="btn-primary text-xs flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  {submittingQuery ? 'Submitting...' : 'Submit Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
