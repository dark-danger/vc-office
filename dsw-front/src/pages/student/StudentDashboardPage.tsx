import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, User } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { TaskProofSubmitter } from '../../components/tasks/TaskProofSubmitter';
import { ProofViewer } from '../../components/tasks/ProofViewer';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  Trophy, Award, Sparkles, GraduationCap, HelpCircle, Users,
  CheckCircle2, Clock, Megaphone, Shield, Mail, Phone, ChevronRight,
  PlusCircle, Send, Building2, UserPlus, Flame, Heart, ThumbsUp, PartyPopper, XCircle, X
} from 'lucide-react';

interface StudentRanking {
  student_id: number;
  name: string;
  roll_number?: string;
  total_points: number;
  rank: number;
}

interface ClubMember {
  id?: string;
  student_id?: number;
  name: string;
  email: string;
  roll_number?: string;
  branch?: string;
  semester?: string;
  phone?: string;
  role: string;
  is_core?: boolean;
}

interface ClubItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  faculty_id?: number;
  faculty_coordinator?: User;
  kras?: string;
  roles_schema: string[];
  student_members: ClubMember[];
  total_points: number;
  is_active: boolean;
  tasks_count: number;
  completed_tasks_count: number;
}

interface ClubTaskItem {
  id: number;
  club_id: number;
  club_name?: string;
  title: string;
  description?: string;
  points_reward: number;
  start_date?: string;
  due_date?: string;
  status: 'pending' | 'submitted' | 'approved' | 'declined';
  submission_text?: string;
  file_url?: string;
  submitted_at?: string;
  submitted_by?: number;
  submitter_name?: string;
  reviewed_by?: number;
  review_remarks?: string;
  reviewed_at?: string;
  created_at: string;
}

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
  const [myRank, setMyRank] = useState<StudentRanking | null>(null);
  const [myClub, setMyClub] = useState<ClubItem | null>(null);
  const [myClubTasks, setMyClubTasks] = useState<ClubTaskItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Proof Modal
  const [submittingTask, setSubmittingTask] = useState<ClubTaskItem | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);

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
      // 1. Load Student Rankings
      const rankings = await apiRequest<StudentRanking[]>('/leaderboard/students/rankings');
      const foundRank = rankings.find(r => r.student_id === user.id);
      if (foundRank) setMyRank(foundRank);

      // 2. Load Clubs to find student's enrolled club
      const allClubs = await apiRequest<ClubItem[]>('/clubs');
      const userEmail = (user.email || '').toLowerCase().trim();
      const userRoll = (user.roll_number || '').toLowerCase().trim();

      const enrolledClub = allClubs.find(c =>
        c.student_members && Array.isArray(c.student_members) &&
        c.student_members.some(m =>
          (m.student_id && m.student_id === user.id) ||
          (m.email && m.email.toLowerCase().trim() === userEmail) ||
          (m.roll_number && userRoll && m.roll_number.toLowerCase().trim() === userRoll)
        )
      );

      if (enrolledClub) {
        setMyClub(enrolledClub);
        // Load tasks for this club
        const tasks = await apiRequest<ClubTaskItem[]>(`/clubs/${enrolledClub.id}/tasks`);
        setMyClubTasks(tasks);
      }

      // 3. Load Announcements
      const annData = await apiRequest<AnnouncementItem[]>('/announcements');
      setAnnouncements(annData.slice(0, 3));

      // 4. Load Faculty List for queries
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

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask) return;
    setSubmittingProof(true);
    try {
      await apiRequest(`/clubs/tasks/${submittingTask.id}/submit`, 'POST', {
        submission_text: proofText,
        file_url: proofUrl
      });
      setSubmittingTask(null);
      setProofText("");
      setProofUrl("");
      if (myClub) {
        const tasks = await apiRequest<ClubTaskItem[]>(`/clubs/${myClub.id}/tasks`);
        setMyClubTasks(tasks);
      }
      alert("Proof submitted successfully! Awaiting review from your reporting Faculty Coordinator.");
    } catch (err: any) {
      alert(err.message || "Failed to submit proof");
    } finally {
      setSubmittingProof(false);
    }
  };

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
      setAnnouncements(annData.slice(0, 3));
    } catch (e) {
      console.error(e);
    }
  };

  const myRoleInClub = myClub?.student_members?.find(m =>
    (m.student_id && m.student_id === user?.id) ||
    (m.email && m.email.toLowerCase().trim() === (user?.email || '').toLowerCase().trim())
  )?.role;

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Leaderboard Badge Header */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-[var(--text-primary)]">Welcome, {user?.name}!</h2>
            {myRoleInClub && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                {myClub?.name} ({myRoleInClub})
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Roll No: <strong className="text-[var(--text-primary)] font-mono">{user?.roll_number || 'GU2026'}</strong> • Course: <strong>{user?.course_branch || 'Engineering & Technology'}</strong> ({user?.year || 'Current Year'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {myRank && (
            <div className="flex items-center gap-3 bg-[var(--card-bg-to)] p-2.5 rounded-2xl border border-[var(--panel-border)] shadow-xs">
              <div className="text-center px-2">
                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">My Rank</div>
                <div className="text-xl font-black text-amber-500">#{myRank.rank}</div>
              </div>
              <div className="h-7 w-px bg-[var(--panel-border)]" />
              <div className="text-center px-2">
                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">My Points</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{myRank.total_points} pts</div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowQueryModal(true)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Raise Query
          </button>
        </div>
      </div>

      {/* 2. MY CLUB SECTION */}
      {myClub ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" /> My Club: {myClub.name}
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Club Score: {myClub.total_points} pts
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Reporting Faculty Coordinator Card */}
            <div className="glass-panel p-5 space-y-3 lg:col-span-1 border-t-2 border-t-emerald-500 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Reporting Faculty
                  </span>
                  <Shield className="w-4 h-4 text-emerald-500" />
                </div>

                <div>
                  <h4 className="font-bold text-base text-[var(--text-primary)]">
                    {myClub.faculty_coordinator?.name || 'Assigned Faculty Coordinator'}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {myClub.faculty_coordinator?.designation || 'Faculty In-Charge'} • {myClub.faculty_coordinator?.department || 'VC Office'}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[var(--panel-border)] text-xs text-[var(--text-secondary)]">
                  {myClub.faculty_coordinator?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{myClub.faculty_coordinator.email}</span>
                    </div>
                  )}
                  {myClub.faculty_coordinator?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{myClub.faculty_coordinator.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--panel-border)] text-[11px] text-[var(--text-muted)]">
                Assigned by VC Office to oversee club governance, assign periodic tasks, and approve activities.
              </div>
            </div>

            {/* My Team (Executive & Core Committee) */}
            <div className="glass-panel p-5 space-y-3 lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[var(--panel-border)]">
                  <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-teal-500" /> My Team & Student Executive Roster ({myClub.student_members?.length || 0} Members)
                  </h4>
                  <Link to="/student/clubs" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
                    View Full Hub <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                  {myClub.student_members && myClub.student_members.length > 0 ? (
                    myClub.student_members.slice(0, 6).map((mem, idx) => (
                      <div key={idx} className="p-2.5 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-1">
                          <strong className="text-[var(--text-primary)] font-semibold truncate">{mem.name}</strong>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            mem.role === 'President' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30' :
                            mem.role === 'Vice President' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' :
                            'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {mem.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                          <span>{mem.roll_number || 'GU Student'}</span>
                          <span>{mem.branch || 'Student'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-4 text-xs text-[var(--text-muted)]">
                      No members registered in team yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 text-right">
                <Link to="/student/club-leaderboard" className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline">
                  🏆 View Club Leaderboard Standings →
                </Link>
              </div>
            </div>
          </div>

          {/* My Club Tasks (Assigned by Reporting Faculty) */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)]">
              <div>
                <h4 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> My Tasks (Assigned by Reporting Faculty)
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Complete these club deliverables and submit proof for review and points approval by {myClub.faculty_coordinator?.name || 'Faculty'}.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                {myClubTasks.filter(t => t.status === 'approved').length} / {myClubTasks.length} Completed
              </span>
            </div>

            <div className="space-y-3">
              {myClubTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--panel-border)] rounded-xl">
                  No active tasks assigned by your reporting faculty coordinator at the moment.
                </div>
              ) : (
                myClubTasks.map(task => (
                  <div key={task.id} className="p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-sm text-[var(--text-primary)]">{task.title}</h5>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{task.description || 'No additional instructions.'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          +{task.points_reward} pts
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          task.status === 'approved' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                          task.status === 'submitted' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' :
                          task.status === 'declined' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30' : 'bg-slate-200 dark:bg-slate-800 text-[var(--text-secondary)]'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>

                    {(task.start_date || task.due_date) && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg w-fit">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Time Limit: {task.start_date ? new Date(task.start_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Immediate'}
                          {' → '}
                          {task.due_date ? new Date(task.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'No Deadline'}
                        </span>
                      </div>
                    )}

                    {task.submission_text && (
                      <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/15 space-y-1.5 text-xs">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">My Club's Submission:</span>
                        <p className="text-[var(--text-secondary)]">{task.submission_text}</p>
                        {task.file_url && <ProofViewer url={task.file_url} />}
                        {task.review_remarks && (
                          <div className="text-rose-600 dark:text-rose-400 pt-1 text-[11px]">
                            Faculty Remarks: {task.review_remarks}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--panel-border)] text-xs">
                      <span className="text-[var(--text-muted)]">Assigned: {new Date(task.created_at).toLocaleDateString()}</span>
                      {task.status !== 'approved' && (
                        <button
                          onClick={() => {
                            setSubmittingTask(task);
                            setProofText(task.submission_text || '');
                            setProofUrl(task.file_url || '');
                          }}
                          className="btn-primary text-xs py-1 px-3.5"
                        >
                          {task.status === 'submitted' ? 'Update Proof' : 'Submit Proof'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Prompt to join or create club */
        <div className="glass-panel p-6 border-l-4 border-l-blue-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> University Student Clubs & Societies
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              You are not currently enrolled in a club committee. Explore active technical, cultural, and sports clubs to participate in events.
            </p>
          </div>
          <Link to="/student/clubs" className="btn-primary text-xs py-2 px-4 shrink-0">
            Explore Clubs
          </Link>
        </div>
      )}

      {/* 3. Quick Action & Leaderboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/student/leaderboard-tasks" className="glass-card p-5 flex flex-col justify-between group hover:border-emerald-500/50">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" /> Student Challenges
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Earn individual leaderboard points by completing campus tasks & duties.</p>
          </div>
          <div className="pt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            Open Tasks <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link to="/student/club-leaderboard" className="glass-card p-5 flex flex-col justify-between group hover:border-purple-500/50">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
              <Trophy className="w-4 h-4" /> Club Leaderboard
            </div>
            <p className="text-xs text-[var(--text-secondary)]">View club rankings and points earned across university events.</p>
          </div>
          <div className="pt-3 text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
            View Rankings <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <div
          onClick={() => setShowQueryModal(true)}
          className="glass-card p-5 flex flex-col justify-between group hover:border-teal-500/50 cursor-pointer"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm">
              <HelpCircle className="w-4 h-4" /> Raise Query
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Submit questions or issues to DSW Admin or your Faculty Coordinator.</p>
          </div>
          <div className="pt-3 text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
            Submit Query <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 4. Campus Announcements Preview */}
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
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">{ann.body}</p>
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

      {/* 5. Submit Task Proof Modal */}
      {submittingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md glass-panel p-4 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Submit Task Proof: {submittingTask.title}
              </h3>
              <button onClick={() => setSubmittingTask(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Work Description / Report Summary *</label>
                  <ImproveEnglishButton text={proofText} onImproved={setProofText} context="Club task completion summary and proof description for faculty coordinator" />
                </div>
                <textarea
                  required
                  rows={3}
                  value={proofText}
                  onChange={e => setProofText(e.target.value)}
                  placeholder="Summarize activities conducted, attendance turnout, outcomes..."
                  className="glass-input text-xs"
                />
              </div>

              <TaskProofSubmitter
                valueUrl={proofUrl}
                onChange={(url) => setProofUrl(url)}
                facultyName={myClub?.name || user?.name || 'Club Society'}
                taskName={submittingTask?.title || 'Club Task'}
              />

              <div className="pt-4 border-t border-[var(--panel-border)] flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button type="button" onClick={() => setSubmittingTask(null)} className="btn-secondary text-xs w-full sm:w-auto">Cancel</button>
                <button type="submit" disabled={submittingProof} className="btn-primary text-xs w-full sm:w-auto">
                  {submittingProof ? 'Submitting...' : 'Submit to Faculty Coordinator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Raise Query Modal */}
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
                    <span className="text-xs">Faculty Head / Coordinator</span>
                  </div>
                </div>
              </div>

              {targetType === 'faculty_head' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Select Faculty Head / Coordinator *
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
                  placeholder="e.g. Request for club workshop room allocation"
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
                  <option value="Club & Society">Student Club & Society</option>
                  <option value="Academic">Academic & Exams</option>
                  <option value="Hostel">Hostel & Campus Facilities</option>
                  <option value="Sports & Events">Sports & Extra-Curricular Events</option>
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
