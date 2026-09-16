import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import { Megaphone, Pin, Plus, Trash2, Heart, ThumbsUp, PartyPopper, Flame, X } from 'lucide-react';

interface AnnouncementItem {
  id: number;
  title: string;
  body: string;
  audience: 'faculty' | 'students' | 'both';
  pinned: boolean;
  author?: { name: string };
  created_at: string;
  reaction_counts: Record<string, number>;
  user_reaction?: string;
}

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin';
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'faculty' | 'students' | 'both'>('both');
  const [pinned, setPinned] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AnnouncementItem[]>('/announcements');
      setAnnouncements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/announcements', 'POST', {
        title,
        body,
        audience,
        pinned
      });
      setIsComposerOpen(false);
      setTitle('');
      setBody('');
      setPinned(false);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await apiRequest(`/announcements/${id}`, 'DELETE');
      fetchAnnouncements();
    } catch (e) {
      alert('Failed to delete announcement');
    }
  };

  const handleReact = async (id: number, type: string) => {
    try {
      await apiRequest(`/announcements/${id}/react`, 'POST', { reaction_type: type });
      fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Broadcast Announcements</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isAdmin ? 'Publish campus updates targeted to Faculty, Students, or both with pinning and emoji reactions.' : 'View official university circulars and react to campus updates.'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsComposerOpen(true)} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> Compose Announcement
          </button>
        )}
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)] glass-panel">Loading announcement feed...</div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] glass-panel">No announcements published yet.</div>
        ) : (
          announcements.map(ann => (
            <div
              key={ann.id}
              className={`glass-panel p-6 space-y-3 relative ${
                ann.pinned ? 'border-l-4 border-l-amber-500 bg-[var(--card-bg-to)]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {ann.pinned && <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                    Audience: {ann.audience}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">{new Date(ann.created_at).toLocaleString()}</span>
                  {isAdmin && (
                    <button onClick={() => handleDelete(ann.id)} className="p-1 text-[var(--text-muted)] hover:text-rose-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>


              <h3 className="text-lg font-bold text-[var(--text-primary)]">{ann.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{ann.body}</p>

              {/* Reaction Row */}
              <div className="pt-3 border-t border-[var(--panel-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-[var(--text-muted)]">
                  Posted by: <strong className="text-[var(--text-primary)]">{ann.author?.name || 'VC Office'}</strong>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {['like', 'fire', 'heart', 'party'].map(type => {
                    const iconMap: any = {
                      like: <ThumbsUp className="w-3.5 h-3.5" />,
                      fire: <Flame className="w-3.5 h-3.5 text-amber-500" />,
                      heart: <Heart className="w-3.5 h-3.5 text-rose-500" />,
                      party: <PartyPopper className="w-3.5 h-3.5 text-purple-500" />
                    };
                    const count = ann.reaction_counts[type] || 0;
                    const isSelected = ann.user_reaction === type;

                    return (
                      <button
                        key={type}
                        onClick={() => handleReact(ann.id, type)}
                        className={`px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-[var(--card-bg-to)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-emerald-500/40'
                        }`}
                      >
                        {iconMap[type]} <span>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-4 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-500 shrink-0" /> Compose Broadcast Announcement
              </h3>
              <button onClick={() => setIsComposerOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Upcoming Campus Event Notice" className="glass-input text-xs" />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Announcement Body</label>
                  <ImproveEnglishButton text={body} onImproved={setBody} context="Campus announcement message for faculty and students" />
                </div>
                <textarea required rows={5} value={body} onChange={e => setBody(e.target.value)} placeholder="Type announcement details..." className="glass-input text-xs" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Target Audience</label>
                  <select value={audience} onChange={e => setAudience(e.target.value as any)} className="glass-input text-xs">
                    <option value="both">All (Faculty & Students)</option>
                    <option value="faculty">Faculty Only</option>
                    <option value="students">Students Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-0 sm:pt-6">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={pinned}
                    onChange={e => setPinned(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <label htmlFor="pinned" className="text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                    Pin Announcement to Top
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button type="button" onClick={() => setIsComposerOpen(false)} className="btn-secondary text-xs w-full sm:w-auto">Cancel</button>
                <button type="submit" className="btn-primary text-xs w-full sm:w-auto">Publish Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
