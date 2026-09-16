import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth, User } from '../../context/AuthContext';
import { ProofViewer } from '../../components/tasks/ProofViewer';
import { TaskProofSubmitter } from '../../components/tasks/TaskProofSubmitter';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  Users, Plus, Trash2, CheckCircle2, Clock, XCircle, Search,
  Award, Eye, FileText, Download, Printer, Shield, ChevronRight,
  Send, UserPlus, Sparkles, FolderPlus, Tag, Phone, Mail, GraduationCap
} from 'lucide-react';

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
  created_by: number;
  created_at: string;
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

const DEFAULT_ROLES = [
  "President",
  "Vice President",
  "General Secretary",
  "Technical Lead",
  "Events Lead",
  "PR & Outreach Head"
];

const CATEGORIES = ["All", "Technical", "Cultural", "Literary", "Sports", "Social", "Coding", "Media"];

export const ClubsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin';
  const isFaculty = user?.role === 'faculty';

  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClubForMembers, setSelectedClubForMembers] = useState<ClubItem | null>(null);
  const [selectedClubForPrint, setSelectedClubForPrint] = useState<ClubItem | null>(null);
  const [selectedClubForTasks, setSelectedClubForTasks] = useState<ClubItem | null>(null);
  const [clubTasks, setClubTasks] = useState<ClubTaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Create Club Form State
  const [clubName, setClubName] = useState("");
  const [clubCategory, setClubCategory] = useState("Technical");
  const [facultyId, setFacultyId] = useState<number | "">("");
  const [clubDescription, setClubDescription] = useState("");
  const [clubKras, setClubKras] = useState("");
  const [customRoles, setCustomRoles] = useState<string[]>(DEFAULT_ROLES);
  const [newRoleInput, setNewRoleInput] = useState("");

  // Add Member Form State
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRoll, setMemberRoll] = useState("");
  const [memberBranch, setMemberBranch] = useState("Computer Science & Engineering");
  const [memberSemester, setMemberSemester] = useState("5th Sem");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberRole, setMemberRole] = useState("President");
  const [memberPassword, setMemberPassword] = useState("President@123");

  // Create Task Form State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPoints, setTaskPoints] = useState(30);
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  // Submit Proof Modal State
  const [submittingTask, setSubmittingTask] = useState<ClubTaskItem | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  // Review Task Modal State
  const [reviewingTask, setReviewingTask] = useState<ClubTaskItem | null>(null);
  const [declineRemarks, setDeclineRemarks] = useState("");

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ClubItem[]>(`/clubs${selectedCategory !== 'All' ? `?category=${selectedCategory}` : ''}`);
      setClubs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyList = async () => {
    try {
      const data = await apiRequest<User[]>('/users/faculty');
      setFacultyList(data);
      if (data.length > 0 && !facultyId) {
        setFacultyId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [selectedCategory]);

  useEffect(() => {
    if (isAdmin) {
      fetchFacultyList();
    }
  }, [isAdmin]);

  const handleAddCustomRole = () => {
    const trimmed = newRoleInput.trim();
    if (trimmed && !customRoles.includes(trimmed)) {
      setCustomRoles(prev => [...prev, trimmed]);
      setNewRoleInput("");
    }
  };

  const handleRemoveCustomRole = (roleToRemove: string) => {
    setCustomRoles(prev => prev.filter(r => r !== roleToRemove));
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) return alert("Club name is required");
    if (!facultyId) return alert("Please assign a Faculty Coordinator");

    try {
      await apiRequest('/clubs', 'POST', {
        name: clubName,
        category: clubCategory,
        faculty_id: Number(facultyId),
        description: clubDescription,
        kras: clubKras,
        roles_schema: customRoles
      });
      setIsCreateModalOpen(false);
      setClubName("");
      setClubDescription("");
      setClubKras("");
      setCustomRoles(DEFAULT_ROLES);
      fetchClubs();
    } catch (err: any) {
      alert(err.message || "Failed to create club");
    }
  };

  const handleDeleteClub = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      await apiRequest(`/clubs/${id}`, 'DELETE');
      setClubs(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete club");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubForMembers) return;

    try {
      const updated = await apiRequest<ClubItem>(`/clubs/${selectedClubForMembers.id}/members`, 'POST', {
        name: memberName,
        email: memberEmail,
        roll_number: memberRoll,
        branch: memberBranch,
        semester: memberSemester,
        phone: memberPhone,
        role: memberRole,
        is_core: memberRole !== "General Member",
        password: memberPassword || "President@123"
      });

      setSelectedClubForMembers(updated);
      setClubs(prev => prev.map(c => c.id === updated.id ? updated : c));
      setMemberName("");
      setMemberEmail("");
      setMemberRoll("");
      setMemberPhone("");
      setMemberPassword("President@123");
      alert(`Student "${memberName}" added to club! Login credentials created: Email: ${memberEmail} / Password: ${memberPassword || "President@123"}`);
    } catch (err: any) {
      alert(err.message || "Failed to add student member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedClubForMembers) return;
    if (!window.confirm("Remove this student member from the club roster?")) return;

    try {
      const updated = await apiRequest<ClubItem>(`/clubs/${selectedClubForMembers.id}/members/${memberId}`, 'DELETE');
      setSelectedClubForMembers(updated);
      setClubs(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    }
  };

  const loadClubTasks = async (club: ClubItem) => {
    setSelectedClubForTasks(club);
    setLoadingTasks(true);
    try {
      const data = await apiRequest<ClubTaskItem[]>(`/clubs/${club.id}/tasks`);
      setClubTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubForTasks) return;

    try {
      await apiRequest<ClubTaskItem>(`/clubs/${selectedClubForTasks.id}/tasks`, 'POST', {
        club_id: selectedClubForTasks.id,
        title: taskTitle,
        description: taskDesc,
        points_reward: Number(taskPoints),
        start_date: taskStartDate ? new Date(taskStartDate).toISOString() : null,
        due_date: taskDueDate ? new Date(taskDueDate).toISOString() : null
      });
      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskStartDate("");
      setTaskDueDate("");
      loadClubTasks(selectedClubForTasks);
      fetchClubs();
    } catch (err: any) {
      alert(err.message || "Failed to assign club task");
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask) return;

    try {
      await apiRequest(`/clubs/tasks/${submittingTask.id}/submit`, 'POST', {
        submission_text: proofText,
        file_url: proofUrl
      });
      setSubmittingTask(null);
      setProofText("");
      setProofUrl("");
      if (selectedClubForTasks) {
        loadClubTasks(selectedClubForTasks);
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit proof");
    }
  };

  const handleApproveTask = async (taskId: number) => {
    try {
      await apiRequest(`/clubs/tasks/${taskId}/approve`, 'POST');
      if (selectedClubForTasks) {
        loadClubTasks(selectedClubForTasks);
      }
      fetchClubs();
      setReviewingTask(null);
    } catch (err: any) {
      alert(err.message || "Failed to approve task");
    }
  };

  const handleDeclineTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingTask) return;

    try {
      await apiRequest(`/clubs/tasks/${reviewingTask.id}/decline`, 'POST', {
        review_remarks: declineRemarks
      });
      if (selectedClubForTasks) {
        loadClubTasks(selectedClubForTasks);
      }
      setReviewingTask(null);
      setDeclineRemarks("");
    } catch (err: any) {
      alert(err.message || "Failed to decline task");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredClubs = clubs.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.faculty_coordinator?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" /> Student Clubs & Societies Hub
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isAdmin
              ? "Create clubs, configure student roles, assign tasks, award leaderboard points, and manage rosters."
              : isFaculty
              ? "Manage your assigned student club roster, assign roles, submit activity reports, and download official PDF charters."
              : "Explore university clubs, view committee leaders, and participate in club challenges."}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setCustomRoles(DEFAULT_ROLES);
              setIsCreateModalOpen(true);
            }}
            className="btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" /> Create New Club
          </button>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 max-w-full">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'bg-[var(--card-bg-to)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--panel-border)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clubs or coordinators..."
            className="glass-input pl-9"
          />
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-[var(--text-muted)] glass-panel">Loading university clubs...</div>
        ) : filteredClubs.length === 0 ? (
          <div className="col-span-full p-12 text-center text-[var(--text-muted)] glass-panel space-y-2">
            <Users className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <p className="font-semibold text-[var(--text-primary)]">No student clubs found.</p>
            <p className="text-xs text-[var(--text-secondary)]">Try selecting another category or create a new club.</p>
          </div>
        ) : (
          filteredClubs.map(club => {
            const isAssignedFaculty = isFaculty && club.faculty_id === user?.id;
            const canManage = isAdmin || isAssignedFaculty;

            return (
              <div key={club.id} className="glass-panel p-6 space-y-4 flex flex-col justify-between hover:border-emerald-500/50 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {club.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> {club.total_points} pts
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{club.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{club.description || 'University student activity club and society.'}</p>
                  </div>

                  <div className="p-3 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Coordinator: <strong className="text-[var(--text-primary)]">{club.faculty_coordinator?.name || 'Unassigned'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Active Roster: <strong className="text-[var(--text-primary)]">{club.student_members?.length || 0} Students</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--panel-border)] flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedClubForMembers(club);
                      setMemberRole(club.roles_schema && club.roles_schema.length > 0 ? club.roles_schema[0] : "Member");
                    }}
                    className="btn-primary text-xs py-1.5 px-3 flex-1 flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> {canManage ? "Roster & Roles" : "View Team"}
                  </button>

                  <button
                    onClick={() => setSelectedClubForPrint(club)}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                    title="Download Official PDF Charter"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-500" /> PDF
                  </button>

                  <button
                    onClick={() => loadClubTasks(club)}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                    title="Club Tasks & Points"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Tasks
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteClub(club.id, club.name)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors"
                      title="Delete Club"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 1. CREATE CLUB MODAL (Admin only) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl glass-panel p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-500" /> Register New Student Club
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClub} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Club Title *</label>
                  <input
                    required
                    type="text"
                    value={clubName}
                    onChange={e => setClubName(e.target.value)}
                    placeholder="e.g. Google Developer Student Club"
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category *</label>
                  <select
                    value={clubCategory}
                    onChange={e => setClubCategory(e.target.value)}
                    className="glass-input"
                  >
                    {CATEGORIES.filter(c => c !== "All").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Faculty Coordinator *</label>
                <select
                  required
                  value={facultyId}
                  onChange={e => setFacultyId(e.target.value ? Number(e.target.value) : "")}
                  className="glass-input"
                >
                  <option value="">-- Select Faculty Coordinator --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.department || 'VC Office'})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Club Description</label>
                  <ImproveEnglishButton text={clubDescription} onImproved={setClubDescription} context="Student club description, mandate, and objectives" />
                </div>
                <textarea
                  rows={3}
                  value={clubDescription}
                  onChange={e => setClubDescription(e.target.value)}
                  placeholder="Mandate, charter, and core student focus areas..."
                  className="glass-input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Key Result Areas (KRAs) & Annual Directives</label>
                  <ImproveEnglishButton text={clubKras} onImproved={setClubKras} context="Club Key Result Areas, targets, and annual milestones" />
                </div>
                <textarea
                  rows={2}
                  value={clubKras}
                  onChange={e => setClubKras(e.target.value)}
                  placeholder="e.g. Conduct min 4 workshops, host university hackathon, organize student tech fest..."
                  className="glass-input"
                />
              </div>

              {/* Dynamic Student Roles Builder */}
              <div className="p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-primary)]">
                    Configurable Student Roles Schema ({customRoles.length} Roles)
                  </label>
                  <span className="text-[11px] text-[var(--text-muted)]">Add or remove roles dynamically (e.g. 6, 7, 8 roles)</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {customRoles.map(role => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    >
                      {role}
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomRole(role)}
                        className="hover:text-rose-500 transition-colors"
                        title="Remove Role"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newRoleInput}
                    onChange={e => setNewRoleInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomRole(); } }}
                    placeholder="Add new role (e.g. Treasurer, Documentation Lead)..."
                    className="glass-input text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomRole}
                    className="btn-secondary text-xs px-3"
                  >
                    + Add Role
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Register Club</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MANAGE MEMBERS & ROSTER MODAL */}
      {selectedClubForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel p-6 shadow-2xl relative my-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" /> {selectedClubForMembers.name} — Student Roster
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Coordinator: <strong className="text-[var(--text-primary)]">{selectedClubForMembers.faculty_coordinator?.name || 'Unassigned'}</strong>
                </p>
              </div>
              <button onClick={() => setSelectedClubForMembers(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Add Student Member Form (Faculty or Admin) */}
            {(isAdmin || (isFaculty && selectedClubForMembers.faculty_id === user?.id)) && (
              <form onSubmit={handleAddMember} className="p-4 bg-[var(--card-bg-to)] rounded-2xl border border-[var(--panel-border)] space-y-3">
                <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-500" /> Add Student to Club
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Student Name *</label>
                    <input
                      required
                      type="text"
                      value={memberName}
                      onChange={e => setMemberName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Roll Number *</label>
                    <input
                      required
                      type="text"
                      value={memberRoll}
                      onChange={e => setMemberRoll(e.target.value)}
                      placeholder="GU2026102"
                      className="glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Email Address *</label>
                    <input
                      required
                      type="email"
                      value={memberEmail}
                      onChange={e => setMemberEmail(e.target.value)}
                      placeholder="rahul@geeta.edu.in"
                      className="glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Department / Branch</label>
                    <input
                      type="text"
                      value={memberBranch}
                      onChange={e => setMemberBranch(e.target.value)}
                      placeholder="B.Tech CSE"
                      className="glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Semester</label>
                    <input
                      type="text"
                      value={memberSemester}
                      onChange={e => setMemberSemester(e.target.value)}
                      placeholder="5th Sem"
                      className="glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={memberPhone}
                      onChange={e => setMemberPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Assigned Role *</label>
                    <select
                      value={memberRole}
                      onChange={e => setMemberRole(e.target.value)}
                      className="glass-input text-xs"
                    >
                      {selectedClubForMembers.roles_schema && selectedClubForMembers.roles_schema.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      <option value="General Member">General Member</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                      Portal Login Password (Auto-Provisioned)
                    </label>
                    <input
                      type="text"
                      value={memberPassword}
                      onChange={e => setMemberPassword(e.target.value)}
                      placeholder="President@123"
                      className="glass-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-[11px] text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>A Student Portal account will be automatically created with this email and password.</span>
                  </div>
                  <button type="submit" className="btn-primary text-xs py-1.5 px-4 shrink-0 font-bold">
                    <UserPlus className="w-3.5 h-3.5" /> Save Student & Provision Login
                  </button>
                </div>
              </form>
            )}

            {/* Current Members Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--panel-border)]">
              <table className="w-full min-w-[650px] text-left text-xs text-[var(--text-secondary)]">
                <thead className="bg-[var(--card-bg-to)] font-bold text-[var(--text-primary)] uppercase border-b border-[var(--panel-border)]">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Roll No & Branch</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Assigned Role</th>
                    {(isAdmin || (isFaculty && selectedClubForMembers.faculty_id === user?.id)) && (
                      <th className="p-3 text-right">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--panel-border)]">
                  {(!selectedClubForMembers.student_members || selectedClubForMembers.student_members.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[var(--text-muted)]">
                        No students enrolled yet. Add students using the form above.
                      </td>
                    </tr>
                  ) : (
                    selectedClubForMembers.student_members.map((mem, idx) => (
                      <tr key={mem.id || idx} className="hover:bg-emerald-500/5 transition-colors">
                        <td className="p-3 font-semibold text-[var(--text-primary)]">
                          {mem.name}
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{mem.roll_number || 'N/A'}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{mem.branch || 'VC Office'} • {mem.semester || 'Current'}</div>
                        </td>
                        <td className="p-3">
                          <div>{mem.email}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">{mem.phone || 'N/A'}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                            mem.role === 'President' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30' :
                            mem.role === 'Vice President' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/30' :
                            mem.role === 'General Secretary' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30' :
                            'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {mem.role}
                          </span>
                        </td>
                        {(isAdmin || (isFaculty && selectedClubForMembers.faculty_id === user?.id)) && (
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRemoveMember(mem.id || String(idx))}
                              className="p-1 rounded text-rose-500 hover:bg-rose-500/10"
                              title="Remove Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setSelectedClubForPrint(selectedClubForMembers);
                }}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" /> Preview & Print Official PDF
              </button>
              <button
                onClick={() => setSelectedClubForMembers(null)}
                className="btn-primary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. OFFICIAL PRINTABLE / PDF MODAL */}
      {selectedClubForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-white text-slate-900 p-8 rounded-2xl shadow-2xl relative space-y-6 my-8 font-sans print:m-0 print:p-0 print:shadow-none print:border-none">
            {/* Modal Topbar (Hidden in print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" /> Official Club Charter PDF Document
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" /> Print / Save as PDF
                </button>
                <button
                  onClick={() => setSelectedClubForPrint(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Document Header */}
            <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
              <img src="/geeta-logo.png" alt="Geeta University" className="h-14 mx-auto object-contain mb-1" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">OFFICE OF THE VICE CHANCELLOR (VC OFFICE)</h1>
              <div className="text-base font-extrabold text-[#0e8a6e] uppercase tracking-wide mt-1">{selectedClubForPrint.name} ({selectedClubForPrint.category} Club)</div>
              <div className="text-xs font-semibold text-slate-500">
                Faculty Coordinator: {selectedClubForPrint.faculty_coordinator?.name || 'VC Office Faculty'} ({selectedClubForPrint.faculty_coordinator?.department || 'Department'}) • Date of Issue: {new Date().toLocaleDateString('en-GB')}
              </div>
            </div>

            {/* Description & KRAs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-800">
                <strong className="text-slate-900 uppercase font-bold text-[11px] block">Club Mission & Mandate:</strong>
                <p className="leading-relaxed">{selectedClubForPrint.description || 'Dedicated to student activities, skill-building, workshops, and university event participation.'}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1 text-xs text-slate-800">
                <strong className="text-[#0e8a6e] uppercase font-bold text-[11px] block">Key Result Areas (KRAs) & Annual Directives:</strong>
                <p className="leading-relaxed">{selectedClubForPrint.kras || 'Conduct continuous skill sessions, coordinate with VC Office event teams, and submit periodic activity proof.'}</p>
              </div>
            </div>

            {/* Core Committee & Student Leadership Roster */}
            <div className="space-y-2">
              <div className="font-bold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1">
                Official Student Core Committee & Executive Roles
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300 uppercase">
                  <tr>
                    <th className="p-2.5 border-r border-slate-300 w-12 text-center">S.No</th>
                    <th className="p-2.5 border-r border-slate-300">Designated Role</th>
                    <th className="p-2.5 border-r border-slate-300">Student Officer Name</th>
                    <th className="p-2.5 border-r border-slate-300">Roll Number</th>
                    <th className="p-2.5 border-r border-slate-300">Branch & Sem</th>
                    <th className="p-2.5">Official Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {(!selectedClubForPrint.student_members || selectedClubForPrint.student_members.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500 italic">No student officers registered in this charter.</td>
                    </tr>
                  ) : (
                    selectedClubForPrint.student_members.map((m, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                        <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-700">{idx + 1}</td>
                        <td className="p-2.5 border-r border-slate-300 font-bold text-[#0e8a6e]">{m.role}</td>
                        <td className="p-2.5 border-r border-slate-300 font-semibold text-slate-900">{m.name}</td>
                        <td className="p-2.5 border-r border-slate-300 font-mono">{m.roll_number || 'N/A'}</td>
                        <td className="p-2.5 border-r border-slate-300">{m.branch || 'VC Office'} ({m.semester || 'Sem'})</td>
                        <td className="p-2.5 font-mono text-[11px]">{m.email} {m.phone ? `• ${m.phone}` : ''}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            </div>

            {/* Document Verification & Signatures */}
            <div className="pt-8 grid grid-cols-3 gap-8 text-center text-xs font-semibold text-slate-800 border-t border-slate-300">
              <div>
                <div className="h-12 border-b border-slate-400 mb-2"></div>
                <span>Faculty Coordinator Sign</span>
              </div>
              <div>
                <div className="h-12 border-b border-slate-400 mb-2"></div>
                <span>Vice Chancellor Office (VC Office)</span>
              </div>
              <div>
                <div className="h-12 border-b border-slate-400 mb-2"></div>
                <span>Registrar Office</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CLUB TASKS & SUBMISSIONS MODAL */}
      {selectedClubForTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel p-6 shadow-2xl relative my-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {selectedClubForTasks.name} — Assigned Club Tasks
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Complete tasks and submit proof to earn leaderboard points ({selectedClubForTasks.total_points} pts total).
                </p>
              </div>
              <button onClick={() => setSelectedClubForTasks(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {(isAdmin || (isFaculty && selectedClubForTasks.faculty_id === user?.id)) && (
              <div className="flex justify-end">
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign Task to {selectedClubForTasks.name}
                </button>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-3">
              {loadingTasks ? (
                <div className="p-8 text-center text-[var(--text-muted)]">Loading club tasks...</div>
              ) : clubTasks.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)] border border-dashed border-[var(--panel-border)] rounded-xl">
                  No tasks assigned to this club yet.
                </div>
              ) : (
                clubTasks.map(t => {
                  const canReview = isAdmin || (isFaculty && selectedClubForTasks.faculty_id === user?.id);

                  return (
                    <div key={t.id} className="p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-[var(--text-primary)]">{t.title}</h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            +{t.points_reward} pts
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            t.status === 'approved' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                            t.status === 'submitted' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' :
                            t.status === 'declined' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30' : 'bg-slate-200 dark:bg-slate-800 text-[var(--text-secondary)]'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>

                      {(t.start_date || t.due_date) && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg w-fit">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-medium">
                            Time Limit: {t.start_date ? new Date(t.start_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Immediate'}
                            {' → '}
                            {t.due_date ? new Date(t.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'No Deadline'}
                          </span>
                        </div>
                      )}

                      {t.submission_text && (
                        <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/15 space-y-2 text-xs">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Submission Details:</span>
                          <p className="text-[var(--text-secondary)]">{t.submission_text}</p>
                          
                          {/* Proof Viewer */}
                          {t.file_url && (
                            <div className="pt-1">
                              <ProofViewer url={t.file_url} />
                            </div>
                          )}

                          {t.review_remarks && (
                            <div className="text-rose-600 dark:text-rose-400 pt-1 text-[11px]">
                              Remarks: {t.review_remarks}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--panel-border)] text-xs">
                        <span className="text-[var(--text-muted)]">Assigned: {new Date(t.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          {t.status !== 'approved' && (
                            <button
                              onClick={() => {
                                setSubmittingTask(t);
                                setProofText(t.submission_text || "");
                                setProofUrl(t.file_url || "");
                              }}
                              className="btn-secondary text-xs py-1 px-3"
                            >
                              {t.status === 'submitted' ? 'Update Proof' : 'Submit Proof'}
                            </button>
                          )}

                          {canReview && t.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => {
                                  setReviewingTask(t);
                                  setDeclineRemarks("");
                                }}
                                className="btn-crimson text-xs py-1 px-2.5"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleApproveTask(t.id)}
                                className="btn-primary text-xs py-1 px-3 bg-emerald-600 hover:bg-emerald-500"
                              >
                                Approve (+{t.points_reward} pts)
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE CLUB TASK MODAL (Admin only) */}
      {isTaskModalOpen && selectedClubForTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Assign Task to {selectedClubForTasks.name}
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Task Title *</label>
                <input
                  required
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Conduct Orientation Webinar for 1st Year Students"
                  className="glass-input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Task Instructions</label>
                  <ImproveEnglishButton text={taskDesc} onImproved={setTaskDesc} context="Club task instructions, steps, and expected deliverables" />
                </div>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  placeholder="Deliverables, participant turnout, and proof requirements..."
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Points Reward</label>
                <input
                  required
                  type="number"
                  value={taskPoints}
                  onChange={e => setTaskPoints(Number(e.target.value))}
                  className="glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={taskStartDate}
                    onChange={e => setTaskStartDate(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Deadline / Due Date</label>
                  <input
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SUBMIT PROOF MODAL */}
      {submittingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Submit Task Proof: {submittingTask.title}
              </h3>
              <button onClick={() => setSubmittingTask(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Work Description / Report Summary *</label>
                  <ImproveEnglishButton text={proofText} onImproved={setProofText} context="Club task completion report and outcome summary" />
                </div>
                <textarea
                  required
                  rows={3}
                  value={proofText}
                  onChange={e => setProofText(e.target.value)}
                  placeholder="Summarize activities conducted, outcomes achieved..."
                  className="glass-input"
                />
              </div>

              <TaskProofSubmitter
                valueUrl={proofUrl}
                onChange={(url) => setProofUrl(url)}
                facultyName={selectedClubForTasks?.name || user?.name || 'Club Society'}
                taskName={submittingTask?.title || 'Club Task'}
              />

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setSubmittingTask(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit for Approval</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. DECLINE TASK MODAL */}
      {reviewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Decline Task Submission: {reviewingTask.title}
              </h3>
              <button onClick={() => setReviewingTask(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeclineTask} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Reason for Decline / Revision Remarks *</label>
                  <ImproveEnglishButton text={declineRemarks} onImproved={setDeclineRemarks} context="Feedback and reasons for declining club task submission" />
                </div>
                <textarea
                  required
                  rows={4}
                  value={declineRemarks}
                  onChange={e => setDeclineRemarks(e.target.value)}
                  placeholder="Explain what is missing in the proof..."
                  className="glass-input"
                />
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setReviewingTask(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-crimson">Decline Submission</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
