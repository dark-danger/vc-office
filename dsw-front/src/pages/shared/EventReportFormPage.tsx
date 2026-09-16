import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { FileUploadField } from '../../components/events/FileUploadField';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import { 
  ANNEXURE_1_DATA, 
  STANDARD_BUDGET_PARTICULARS, 
  STANDARD_PHOTO_CATEGORIES 
} from '../../data/eventReportAnnexure';
import {
  FileText,
  Save,
  Send,
  Printer,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Calendar,
  DollarSign,
  Users,
  Image as ImageIcon,
  Award,
  BookOpen,
  ArrowLeft,
  X,
  Eye,
  Info
} from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  description: string;
  venue: string;
  coordinator?: { id: number; name: string };
  start_date?: string;
  end_date?: string;
}

export const EventReportFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Report ID if editing
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [showAnnexureModal, setShowAnnexureModal] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Form State
  const [eventId, setEventId] = useState<number | null>(eventIdParam ? Number(eventIdParam) : null);
  const [reportStatus, setReportStatus] = useState<string>('draft');

  // Page 1: Identification & SDGs
  const [category, setCategory] = useState<string>('1. Academic & Learning Enhancement');
  const [subCategory, setSubCategory] = useState<string>('Guest Lectures / Expert Sessions');
  const [sdgMapping, setSdgMapping] = useState<string>('SDG 4: Quality Education');
  const [eventName, setEventName] = useState<string>('');
  const [organizedBy, setOrganizedBy] = useState<string>('Department of Student Welfare');
  const [sponsorshipOrgs, setSponsorshipOrgs] = useState<string>('');
  const [coordinatorName, setCoordinatorName] = useState<string>(user?.name || '');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [totalDays, setTotalDays] = useState<number>(1);
  const [venue, setVenue] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [objectivesSdg, setObjectivesSdg] = useState<string>('');
  const [expectedOutcome, setExpectedOutcome] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('UG & PG Students, Faculty Members');

  // Page 2: Approvals, Notices & Guests
  const [proposalApprovalDoc, setProposalApprovalDoc] = useState<string>('');
  const [circularNoticeDoc, setCircularNoticeDoc] = useState<string>('');
  const [circularRefNo, setCircularRefNo] = useState<string>('');
  const [eventPosterDoc, setEventPosterDoc] = useState<string>('');
  const [registrationLink, setRegistrationLink] = useState<string>('');
  const [registrationQrDoc, setRegistrationQrDoc] = useState<string>('');
  const [resourcePersonDetails, setResourcePersonDetails] = useState<string>('');
  const [invitationLetterDoc, setInvitationLetterDoc] = useState<string>('');
  const [guestDetails, setGuestDetails] = useState<string>('');

  // Page 3: Budget, Expenses, Schedule & Attendance
  const [approvedBudgetDoc, setApprovedBudgetDoc] = useState<string>('');
  const [budgetParticulars, setBudgetParticulars] = useState<{ particular: string; amount: number }[]>(
    STANDARD_BUDGET_PARTICULARS.map(p => ({ particular: p, amount: 0 }))
  );
  const [expenseBillsDoc, setExpenseBillsDoc] = useState<string>('');
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [totalBudgetWords, setTotalBudgetWords] = useState<string>('');
  const [totalExpenseWords, setTotalExpenseWords] = useState<string>('');
  const [minuteToMinute, setMinuteToMinute] = useState<{ sr_no: number; timings: string; sequence: string }[]>([
    { sr_no: 1, timings: '10:00 AM - 10:15 AM', sequence: 'Inauguration, Lamp Lighting & Welcome Speech' },
    { sr_no: 2, timings: '10:15 AM - 12:30 PM', sequence: 'Keynote Address & Technical Sessions' },
    { sr_no: 3, timings: '12:30 PM - 01:30 PM', sequence: 'Felicitation & Vote of Thanks' }
  ]);
  const [participantsGuStudents, setParticipantsGuStudents] = useState<number>(0);
  const [participantsGuFaculty, setParticipantsGuFaculty] = useState<number>(0);
  const [participantsExternal, setParticipantsExternal] = useState<number>(0);

  // Page 4: Attendees, Photo Highlights, Winners & Handover
  const [attendeesListDoc, setAttendeesListDoc] = useState<string>('');
  const [eventPhotos, setEventPhotos] = useState<{ category: string; url: string; caption: string }[]>([]);
  const [prizeWinners, setPrizeWinners] = useState<{ sr_no: number; student_name: string; semester: string; program_name: string; university_name: string; position: string; prize: string }[]>([
    { sr_no: 1, student_name: '', semester: '4th', program_name: 'B.Tech CSE', university_name: 'Geeta University', position: 'First', prize: 'Trophy & Certificate' }
  ]);
  const [utilizationItems, setUtilizationItems] = useState<{ sr_no: number; particulars: string; issued_qty: string; consumption_qty: string; balance: string; handover_to: string; signature: string }[]>([
    { sr_no: 1, particulars: 'Mementoes & Certificates', issued_qty: '10', consumption_qty: '8', balance: '2', handover_to: 'VC Office Store', signature: 'Verified' }
  ]);
  const [learningOutcome, setLearningOutcome] = useState<string>('');

  // Page 5: Press Release, Feedbacks & Signatures
  const [newspaperName, setNewspaperName] = useState<string>('');
  const [pressReleaseDoc, setPressReleaseDoc] = useState<string>('');
  const [feedbackGuest, setFeedbackGuest] = useState<string>('');
  const [feedbackParticipants, setFeedbackParticipants] = useState<string>('');
  const [coordinatorSignature, setCoordinatorSignature] = useState<string>(user?.name || '');
  const [headOfSchoolSignature, setHeadOfSchoolSignature] = useState<string>('');
  const [dswVerifiedBy, setDswVerifiedBy] = useState<string>('');

  // Load existing report or event details
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        if (id && id !== 'new') {
          // Load existing report
          const rep = await apiRequest<any>(`/event-reports/${id}`);
          if (rep) {
            setEventId(rep.event_id || null);
            setReportStatus(rep.status || 'draft');
            setCategory(rep.category || '1. Academic & Learning Enhancement');
            setSubCategory(rep.sub_category || '');
            setSdgMapping(rep.sdg_mapping || '');
            setEventName(rep.event_name || '');
            setOrganizedBy(rep.organized_by || '');
            setSponsorshipOrgs(rep.sponsorship_orgs || '');
            setCoordinatorName(rep.coordinator_name || '');
            setFromDate(rep.from_date || '');
            setToDate(rep.to_date || '');
            setTotalDays(rep.total_days || 1);
            setVenue(rep.venue || '');
            setDescription(rep.description || '');
            setObjectivesSdg(rep.objectives_sdg || '');
            setExpectedOutcome(rep.expected_outcome || '');
            setTargetAudience(rep.target_audience || '');

            setProposalApprovalDoc(rep.proposal_approval_doc || '');
            setCircularNoticeDoc(rep.circular_notice_doc || '');
            setCircularRefNo(rep.circular_ref_no || '');
            setEventPosterDoc(rep.event_poster_doc || '');
            setRegistrationLink(rep.registration_link || '');
            setRegistrationQrDoc(rep.registration_qr_doc || '');
            setResourcePersonDetails(rep.resource_person_details || '');
            setInvitationLetterDoc(rep.invitation_letter_doc || '');
            setGuestDetails(rep.guest_details || '');

            setApprovedBudgetDoc(rep.approved_budget_doc || '');
            if (rep.budget_particulars && rep.budget_particulars.length > 0) {
              setBudgetParticulars(rep.budget_particulars);
            }
            setExpenseBillsDoc(rep.expense_bills_doc || '');
            setTotalBudget(rep.total_budget || 0);
            setTotalExpenses(rep.total_expenses || 0);
            setTotalBudgetWords(rep.total_budget_words || '');
            setTotalExpenseWords(rep.total_expense_words || '');
            if (rep.minute_to_minute && rep.minute_to_minute.length > 0) {
              setMinuteToMinute(rep.minute_to_minute);
            }
            setParticipantsGuStudents(rep.participants_gu_students || 0);
            setParticipantsGuFaculty(rep.participants_gu_faculty || 0);
            setParticipantsExternal(rep.participants_external || 0);

            setAttendeesListDoc(rep.attendees_list_doc || '');
            setEventPhotos(rep.event_photos || []);
            if (rep.prize_winners && rep.prize_winners.length > 0) {
              setPrizeWinners(rep.prize_winners);
            }
            if (rep.utilization_items && rep.utilization_items.length > 0) {
              setUtilizationItems(rep.utilization_items);
            }
            setLearningOutcome(rep.learning_outcome || '');

            setNewspaperName(rep.newspaper_name || '');
            setPressReleaseDoc(rep.press_release_doc || '');
            setFeedbackGuest(rep.feedback_guest || '');
            setFeedbackParticipants(rep.feedback_participants || '');
            setCoordinatorSignature(rep.coordinator_signature || '');
            setHeadOfSchoolSignature(rep.head_of_school_signature || '');
            setDswVerifiedBy(rep.dsw_verified_by || '');
          }
        } else if (eventIdParam) {
          // Pre-populate from Event model
          const ev = await apiRequest<EventItem>(`/events/${eventIdParam}`);
          if (ev) {
            setEventName(ev.title || '');
            setDescription(ev.description || '');
            setVenue(ev.venue || '');
            if (ev.coordinator?.name) {
              setCoordinatorName(ev.coordinator.name);
            }
            if (ev.start_date) {
              setFromDate(ev.start_date.split('T')[0]);
            }
            if (ev.end_date) {
              setToDate(ev.end_date.split('T')[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial event report data:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, eventIdParam]);

  // Auto-calculate total budget amount from particulars
  const calculatedBudgetTotal = budgetParticulars.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalParticipantsCount = participantsGuStudents + participantsGuFaculty + participantsExternal;

  // Calculate days if fromDate and toDate are given
  useEffect(() => {
    if (fromDate && toDate) {
      const d1 = new Date(fromDate);
      const d2 = new Date(toDate);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (!isNaN(diffDays) && diffDays > 0) {
        setTotalDays(diffDays);
      }
    }
  }, [fromDate, toDate]);

  // Apply Annexure Selection
  const applyAnnexureItem = (item: typeof ANNEXURE_1_DATA[0], subCat?: string) => {
    setCategory(item.category);
    setSubCategory(subCat || item.subCategories[0]);
    setSdgMapping(item.primarySdg);
    setShowAnnexureModal(false);
  };

  const handleSave = async (statusOverride?: string) => {
    if (!eventName.trim()) {
      alert('Please enter the Event Name on Page 1.');
      setActiveTab(1);
      return;
    }

    setSaving(true);
    const payload = {
      event_id: eventId,
      status: statusOverride || reportStatus,
      category,
      sub_category: subCategory,
      sdg_mapping: sdgMapping,
      event_name: eventName,
      organized_by: organizedBy,
      sponsorship_orgs: sponsorshipOrgs,
      coordinator_name: coordinatorName,
      from_date: fromDate,
      to_date: toDate,
      total_days: Number(totalDays) || 1,
      venue,
      description,
      objectives_sdg: objectivesSdg,
      expected_outcome: expectedOutcome,
      target_audience: targetAudience,

      proposal_approval_doc: proposalApprovalDoc,
      circular_notice_doc: circularNoticeDoc,
      circular_ref_no: circularRefNo,
      event_poster_doc: eventPosterDoc,
      registration_link: registrationLink,
      registration_qr_doc: registrationQrDoc,
      resource_person_details: resourcePersonDetails,
      invitation_letter_doc: invitationLetterDoc,
      guest_details: guestDetails,

      approved_budget_doc: approvedBudgetDoc,
      budget_particulars: budgetParticulars,
      total_budget_amount: calculatedBudgetTotal,
      expense_bills_doc: expenseBillsDoc,
      total_budget: Number(totalBudget) || calculatedBudgetTotal,
      total_expenses: Number(totalExpenses) || 0,
      total_budget_words: totalBudgetWords,
      total_expense_words: totalExpenseWords,
      minute_to_minute: minuteToMinute,
      participants_gu_students: Number(participantsGuStudents) || 0,
      participants_gu_faculty: Number(participantsGuFaculty) || 0,
      participants_external: Number(participantsExternal) || 0,
      participants_total: totalParticipantsCount,

      attendees_list_doc: attendeesListDoc,
      event_photos: eventPhotos,
      prize_winners: prizeWinners.filter(w => w.student_name.trim() !== ''),
      utilization_items: utilizationItems.filter(u => u.particulars.trim() !== ''),
      learning_outcome: learningOutcome,

      newspaper_name: newspaperName,
      press_release_doc: pressReleaseDoc,
      feedback_guest: feedbackGuest,
      feedback_participants: feedbackParticipants,
      coordinator_signature: coordinatorSignature,
      head_of_school_signature: headOfSchoolSignature,
      dsw_verified_by: dswVerifiedBy
    };

    try {
      if (id && id !== 'new') {
        await apiRequest(`/event-reports/${id}`, 'PATCH', payload);
        alert(statusOverride === 'submitted' ? 'Official Event Report Submitted Successfully!' : 'Report Saved as Draft!');
      } else {
        const created = await apiRequest<any>('/event-reports', 'POST', payload);
        alert(statusOverride === 'submitted' ? 'Official Event Report Submitted Successfully!' : 'Report Created Successfully!');
        navigate(`/admin/events/reports/${created.id}`);
      }
    } catch (err: any) {
      alert(`Error saving report: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPrintPreview = async () => {
    // Generate live printable HTML directly
    if (id && id !== 'new') {
      try {
        const html = await apiRequest<string>(`/event-reports/${id}/print-html`);
        setPreviewHtml(html);
      } catch {
        alert('Please save the report first to preview official printable PDF.');
      }
    } else {
      alert('Please save the report first before generating official printable PDF.');
    }
  };

  const currentCategoryData = ANNEXURE_1_DATA.find(a => a.category === category) || ANNEXURE_1_DATA[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-[var(--panel-border)] p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img 
            src="/geeta-logo.png" 
            alt="Geeta University Logo" 
            className="h-10 md:h-12 w-auto object-contain bg-white rounded-xl p-1 shadow-sm border border-slate-200" 
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-xs">
                Official Geeta University Format
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                reportStatus === 'submitted' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {reportStatus}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mt-1">
              {eventName ? `Event Report: ${eventName}` : 'New Official Event Report'}
            </h1>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowAnnexureModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-all shadow-xs"
          >
            <BookOpen className="w-4 h-4" /> Annexure-1 Guide
          </button>
          {id && id !== 'new' && (
            <button
              onClick={handleOpenPrintPreview}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
            >
              <Printer className="w-4 h-4" /> Official Printable PDF
            </button>
          )}
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text-primary)] text-xs font-bold border border-[var(--panel-border)] transition-all shadow-xs"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave('submitted')}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
          >
            <Send className="w-4 h-4" /> Submit Report
          </button>
        </div>
      </div>

      {/* Progress Tabs matching the 5-page official document */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-[var(--panel-border)] shadow-xs">
        {[
          { num: 1, title: 'Page 1', sub: 'Identification & SDGs', icon: Info },
          { num: 2, title: 'Page 2', sub: 'Approvals & Guests', icon: Users },
          { num: 3, title: 'Page 3', sub: 'Budget & Schedule', icon: DollarSign },
          { num: 4, title: 'Page 4', sub: 'Photos & Winners', icon: ImageIcon },
          { num: 5, title: 'Page 5', sub: 'Press & Signatures', icon: Award }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.num;
          return (
            <button
              key={tab.num}
              onClick={() => setActiveTab(tab.num)}
              className={`p-2.5 sm:p-3 rounded-xl text-left transition-all duration-200 flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-[140px] md:min-w-0 md:flex-1 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-secondary)]'
              }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.num}
              </div>
              <div className="overflow-hidden">
                <div className={`text-xs uppercase tracking-wider font-bold ${isActive ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                  {tab.title}
                </div>
                <div className={`text-[10px] sm:text-[11px] truncate ${isActive ? 'text-blue-100' : 'text-[var(--text-secondary)]'}`}>
                  {tab.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-slate-900 border border-[var(--panel-border)] rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
        
        {/* ================= PAGE 1: IDENTIFICATION & SDG MAPPING ================= */}
        {activeTab === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[var(--panel-border)] pb-4">
              <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black">1</span>
                Event Identification & Academic SDG Mapping (Page 1)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Standard institutional parameters mapped with UN Sustainable Development Goals according to Annexure-1.
              </p>
            </div>

            {/* Type of Event: Category, Sub-Category & SDGs Grid */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Type of Event (Follow Annexure-1)
                </label>
                <button
                  type="button"
                  onClick={() => setShowAnnexureModal(true)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> View Annexure-1 Details
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">1. Category *</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      const catData = ANNEXURE_1_DATA.find(a => a.category === e.target.value);
                      if (catData) {
                        setSubCategory(catData.subCategories[0]);
                        setSdgMapping(catData.primarySdg);
                      }
                    }}
                    className="glass-input"
                  >
                    {ANNEXURE_1_DATA.map(a => (
                      <option key={a.id} value={a.category}>{a.category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">2. Sub-Category *</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="glass-input"
                  >
                    {currentCategoryData.subCategories.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">3. SDG Number & Name *</label>
                  <input
                    type="text"
                    value={sdgMapping}
                    onChange={(e) => setSdgMapping(e.target.value)}
                    placeholder="e.g. SDG 4: Quality Education"
                    className="glass-input font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
                <div>
                  <strong>Rationale:</strong> {currentCategoryData.rationale}
                  {currentCategoryData.additionalSdgs && (
                    <div className="mt-0.5 text-blue-600 dark:text-blue-400 font-medium">{currentCategoryData.additionalSdgs}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Core Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Event Name *</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. National Conclave on AI Innovations & Digital Governance 2026"
                  className="glass-input text-base font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Organized By (School/Department Name) *</label>
                <input
                  type="text"
                  value={organizedBy}
                  onChange={(e) => setOrganizedBy(e.target.value)}
                  placeholder="e.g. School of Engineering & Technology / VC Office"
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Sponsorship Organization(s) (If Any)</label>
                <input
                  type="text"
                  value={sponsorshipOrgs}
                  onChange={(e) => setSponsorshipOrgs(e.target.value)}
                  placeholder="e.g. AICTE, IEEE, Tech Mahindra, Red Hat (or N/A)"
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Name of Event Coordinator with Designation *</label>
                <input
                  type="text"
                  value={coordinatorName}
                  onChange={(e) => setCoordinatorName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma, Associate Professor, CSE"
                  className="glass-input font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Venue / Platform of the Event *</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Geeta University Main Auditorium / Microsoft Teams"
                  className="glass-input"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)]">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">From Date (DD/MM/YYYY) *</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">To Date (DD/MM/YYYY) *</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Total No. of Days</label>
                  <input
                    type="number"
                    min="1"
                    value={totalDays}
                    onChange={(e) => setTotalDays(Number(e.target.value))}
                    className="glass-input font-bold"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">Event Description *</label>
                  <ImproveEnglishButton text={description} onImproved={setDescription} context="University event comprehensive description, activities, and narrative" />
                </div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive description of the event, flow, keynote speeches, discussions, and outcomes..."
                  className="glass-input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">Event Objective(s) Mapped with SDGs *</label>
                  <ImproveEnglishButton text={objectivesSdg} onImproved={setObjectivesSdg} context="Event educational objectives aligned with UN Sustainable Development Goals" />
                </div>
                <textarea
                  rows={3}
                  value={objectivesSdg}
                  onChange={(e) => setObjectivesSdg(e.target.value)}
                  placeholder="1. Provide industry mentorship on cloud architectures... 2. Enhance practical competency..."
                  className="glass-input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">Expected Outcome *</label>
                  <ImproveEnglishButton text={expectedOutcome} onImproved={setExpectedOutcome} context="Event expected outcomes, key performance indicators, and deliverables" />
                </div>
                <textarea
                  rows={3}
                  value={expectedOutcome}
                  onChange={(e) => setExpectedOutcome(e.target.value)}
                  placeholder="Enhanced placement readiness, 250+ certified participants, 3 MoU proposals initiated..."
                  className="glass-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Target Audience *</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. B.Tech CSE/AI students, MCA Scholars, Faculty Coordinators"
                  className="glass-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGE 2: APPROVALS, NOTICES & GUESTS ================= */}
        {activeTab === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[var(--panel-border)] pb-4">
              <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black">2</span>
                Approvals, Notices, Posters & Resource Persons (Page 2)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Attach official sanction orders, institutional circulars, creative banners, and guest profiles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Proposal With Approval */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-3">
                <FileUploadField
                  label="Proposal With Approval"
                  subLabel="(Scanned Copy / Picture)"
                  value={proposalApprovalDoc}
                  onChange={setProposalApprovalDoc}
                  accept="image/*,application/pdf"
                  isImage={true}
                />
              </div>

              {/* Event Circular/Notice */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-3">
                <label className="block text-xs font-bold text-[var(--text-primary)]">
                  Event Circular/Notice by Registrar Office/VC Office/School Head
                </label>
                <input
                  type="text"
                  value={circularRefNo}
                  onChange={(e) => setCircularRefNo(e.target.value)}
                  placeholder="Date & Reference No. (e.g. GU/VC/2026/CIR-104 dated 12/09/2026)"
                  className="glass-input text-xs"
                />
                <FileUploadField
                  label="Circular Scanned Copy / PDF"
                  value={circularNoticeDoc}
                  onChange={setCircularNoticeDoc}
                  accept="image/*,application/pdf"
                />
              </div>

              {/* Event Poster */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-3">
                <FileUploadField
                  label="Event Poster"
                  subLabel="(Official creative banner / graphics)"
                  value={eventPosterDoc}
                  onChange={setEventPosterDoc}
                  accept="image/*"
                  isImage={true}
                />
              </div>

              {/* Registration Link / QR Code */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-3">
                <label className="block text-xs font-bold text-[var(--text-primary)]">
                  Registration Link & QR Code
                </label>
                <input
                  type="text"
                  value={registrationLink}
                  onChange={(e) => setRegistrationLink(e.target.value)}
                  placeholder="https://forms.gle/... or university portal URL"
                  className="glass-input text-xs"
                />
                <FileUploadField
                  label="Registration QR Code / Graphic"
                  value={registrationQrDoc}
                  onChange={setRegistrationQrDoc}
                  accept="image/*"
                  isImage={true}
                />
              </div>

              {/* Resource Person Details */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[var(--text-primary)]">
                        Details of Resource Person (If any) with Designation & Name of Institution/Organization
                      </label>
                      <ImproveEnglishButton text={resourcePersonDetails} onImproved={setResourcePersonDetails} context="Resource person / speaker profile, designations, and background" />
                    </div>
                    <textarea
                      rows={4}
                      value={resourcePersonDetails}
                      onChange={(e) => setResourcePersonDetails(e.target.value)}
                      placeholder="e.g. Dr. Ananya Verma, Principal Scientist, CSIR Delhi • Topic: Quantum Computing Frontiers"
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <FileUploadField
                      label="Invitation to Resource Person"
                      subLabel="(Scanned Copy / Formal Email Acceptance Picture)"
                      value={invitationLetterDoc}
                      onChange={setInvitationLetterDoc}
                      accept="image/*,application/pdf"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[var(--text-primary)]">
                      Guest Detail (Acceptance along with Details and LinkedIn Profile Link)
                    </label>
                    <ImproveEnglishButton text={guestDetails} onImproved={setGuestDetails} context="Distinguished guest profile and acceptance details" />
                  </div>
                  <textarea
                    rows={2}
                    value={guestDetails}
                    onChange={(e) => setGuestDetails(e.target.value)}
                    placeholder="e.g. Mr. Vikas Khanna, VP Engineering @ Microsoft (https://linkedin.com/in/...) • Accepted via official email"
                    className="glass-input text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGE 3: BUDGET, EXPENSES, SCHEDULE & PARTICIPANTS ================= */}
        {activeTab === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[var(--panel-border)] pb-4">
              <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black">3</span>
                Approved Budget, Expenses, Minute-to-Minute & Attendance (Page 3)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Itemized financial breakdown, minute-to-minute schedule, and student/faculty attendance summary.
              </p>
            </div>

            {/* Approved Budget Table */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Approved Budget (10 Standard Particulars)</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Enter sanctioned amount against each standard particular.</p>
                </div>
                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Total Budget: ₹ {calculatedBudgetTotal.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] uppercase">
                    <tr>
                      <th className="p-2.5 w-14 text-center">Sr. No.</th>
                      <th className="p-2.5">Particular</th>
                      <th className="p-2.5 w-48 text-right">Budget Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--panel-border)]">
                    {budgetParticulars.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
                        <td className="p-2 text-center font-bold text-[var(--text-secondary)]">{idx + 1}</td>
                        <td className="p-2 font-medium text-[var(--text-primary)]">{item.particular}</td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.amount}
                            onChange={(e) => {
                              const newArr = [...budgetParticulars];
                              newArr[idx].amount = Number(e.target.value) || 0;
                              setBudgetParticulars(newArr);
                            }}
                            className="glass-input text-right py-1 px-2.5 text-xs font-bold w-full"
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                      <td colSpan={2} className="p-2.5 text-right uppercase tracking-wider text-[var(--text-primary)]">Total Approved Budget:</td>
                      <td className="p-2.5 text-right text-sm text-emerald-600 dark:text-emerald-400 font-black">
                        ₹ {calculatedBudgetTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <FileUploadField
                label="Approved Budget Sanction Letter / Sheet"
                subLabel="(Please attach if any) (Scanned Copy/Picture)"
                value={approvedBudgetDoc}
                onChange={setApprovedBudgetDoc}
              />
            </div>

            {/* Expense Report Summary */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Expense Report & Bills</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Total Budget (if any) (₹)</label>
                  <input
                    type="number"
                    value={totalBudget || calculatedBudgetTotal}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    className="glass-input font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Total Expenses (if any) (₹)</label>
                  <input
                    type="number"
                    value={totalExpenses}
                    onChange={(e) => setTotalExpenses(Number(e.target.value))}
                    className="glass-input font-bold text-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Total Budget in Words</label>
                  <input
                    type="text"
                    value={totalBudgetWords}
                    onChange={(e) => setTotalBudgetWords(e.target.value)}
                    placeholder="e.g. Fifty Thousand Rupees Only"
                    className="glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Total Expense in Words</label>
                  <input
                    type="text"
                    value={totalExpenseWords}
                    onChange={(e) => setTotalExpenseWords(e.target.value)}
                    placeholder="e.g. Forty-Eight Thousand Five Hundred Rupees Only"
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <FileUploadField
                label="Expense Bills & Invoices (Scanned Copy / PDF)"
                value={expenseBillsDoc}
                onChange={setExpenseBillsDoc}
              />
            </div>

            {/* Minute to Minute Schedule Table */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Minute to Minute Event Schedule</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Event: {eventName || 'Event Name'} | Venue: {venue || 'Venue'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMinuteToMinute([...minuteToMinute, { sr_no: minuteToMinute.length + 1, timings: '', sequence: '' }])}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Schedule Row
                </button>
              </div>

              <div className="space-y-2">
                {minuteToMinute.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-8 text-center text-xs font-bold text-[var(--text-secondary)]">#{idx + 1}</span>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM - 10:30 AM"
                      value={item.timings}
                      onChange={(e) => {
                        const arr = [...minuteToMinute];
                        arr[idx].timings = e.target.value;
                        setMinuteToMinute(arr);
                      }}
                      className="glass-input text-xs w-48 font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Sequence of events description..."
                      value={item.sequence}
                      onChange={(e) => {
                        const arr = [...minuteToMinute];
                        arr[idx].sequence = e.target.value;
                        setMinuteToMinute(arr);
                      }}
                      className="glass-input text-xs flex-1"
                    />
                    {minuteToMinute.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMinuteToMinute(minuteToMinute.filter((_, i) => i !== idx))}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Number of Participants */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Number of Participant(s)</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">GU Students</label>
                  <input
                    type="number"
                    min="0"
                    value={participantsGuStudents}
                    onChange={(e) => setParticipantsGuStudents(Number(e.target.value) || 0)}
                    className="glass-input font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">GU Faculty & Staff Members</label>
                  <input
                    type="number"
                    min="0"
                    value={participantsGuFaculty}
                    onChange={(e) => setParticipantsGuFaculty(Number(e.target.value) || 0)}
                    className="glass-input font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">External Participants</label>
                  <input
                    type="number"
                    min="0"
                    value={participantsExternal}
                    onChange={(e) => setParticipantsExternal(Number(e.target.value) || 0)}
                    className="glass-input font-bold"
                  />
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-2xl flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Participants</span>
                  <span className="text-2xl font-black text-blue-700 dark:text-blue-300">{totalParticipantsCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGE 4: ATTENDEES, PHOTOS, WINNERS & HANDOVER ================= */}
        {activeTab === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[var(--panel-border)] pb-4">
              <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black">4</span>
                Attendees, Geo-tagged Photographs, Winners & Handover (Page 4)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Upload attendee rosters, geo-tagged photograph gallery, student winners list, and asset handover certificates.
              </p>
            </div>

            {/* Attendees List Upload */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)]">
              <FileUploadField
                label="Attendees List"
                subLabel="(Please attach Scanned Copy / PDF / Picture including School & Invitee List)"
                value={attendeesListDoc}
                onChange={setAttendeesListDoc}
              />
            </div>

            {/* Event Highlights & Glimpse of the Event (Geo-tagged Photographs) */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-500" />
                    Event Highlights & Glimpse of the Event (Geo-tagged Photographs)
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Upload speaker photos, Q&A sessions, group photos, and felicitation moments.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEventPhotos([...eventPhotos, { category: STANDARD_PHOTO_CATEGORIES[0], url: '', caption: '' }])}
                  className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Photo Box
                </button>
              </div>

              {eventPhotos.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[var(--panel-border)] rounded-2xl space-y-2">
                  <ImageIcon className="w-8 h-8 text-[var(--text-secondary)] mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">No photos added yet.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEventPhotos([
                        { category: "Speaker Picture with Banner (If Applicable)", url: '', caption: 'Keynote Speaker Addressing Session' },
                        { category: "Question-Answering Session Photograph (If Applicable)", url: '', caption: 'Interactive Student Q&A' },
                        { category: "Group Photograph", url: '', caption: 'Core Committee & Participants Group Picture' },
                        { category: "Felicitation Photograph (If Applicable)", url: '', caption: 'Prize & Memento Distribution' }
                      ]);
                    }}
                    className="text-xs text-blue-500 font-bold hover:underline"
                  >
                    + Auto-populate 4 Standard Photo Slots
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eventPhotos.map((photo, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--panel-border)] space-y-3 relative shadow-xs">
                      <div className="flex items-center justify-between">
                        <select
                          value={photo.category}
                          onChange={(e) => {
                            const arr = [...eventPhotos];
                            arr[idx].category = e.target.value;
                            setEventPhotos(arr);
                          }}
                          className="glass-input text-xs font-bold py-1 px-2.5 max-w-xs"
                        >
                          {STANDARD_PHOTO_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setEventPhotos(eventPhotos.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                          title="Remove Photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <FileUploadField
                        label="Photograph (Geo-tagged)"
                        value={photo.url}
                        onChange={(url) => {
                          const arr = [...eventPhotos];
                          arr[idx].url = url;
                          setEventPhotos(arr);
                        }}
                        accept="image/*"
                        isImage={true}
                      />

                      <input
                        type="text"
                        placeholder="Caption / Description (e.g. Chief Guest addressing delegates)"
                        value={photo.caption}
                        onChange={(e) => {
                          const arr = [...eventPhotos];
                          arr[idx].caption = e.target.value;
                          setEventPhotos(arr);
                        }}
                        className="glass-input text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prize Details with List of Winners */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Prize Details with List of Winners (If Any)</h3>
                  <p className="text-xs text-[var(--text-secondary)]">First, Second, Third, and Consolation awardees.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrizeWinners([...prizeWinners, { sr_no: prizeWinners.length + 1, student_name: '', semester: '', program_name: '', university_name: 'Geeta University', position: 'Consolation', prize: '' }])}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Winner Row
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] uppercase">
                    <tr>
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2">Student Name</th>
                      <th className="p-2 w-20">Semester</th>
                      <th className="p-2">Program</th>
                      <th className="p-2">University</th>
                      <th className="p-2 w-28">Position</th>
                      <th className="p-2">Prize</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--panel-border)]">
                    {prizeWinners.map((w, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5 text-center font-bold text-[var(--text-secondary)]">{idx + 1}</td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="Student Name"
                            value={w.student_name}
                            onChange={(e) => {
                              const arr = [...prizeWinners];
                              arr[idx].student_name = e.target.value;
                              setPrizeWinners(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="4th"
                            value={w.semester}
                            onChange={(e) => {
                              const arr = [...prizeWinners];
                              arr[idx].semester = e.target.value;
                              setPrizeWinners(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="B.Tech CSE"
                            value={w.program_name}
                            onChange={(e) => {
                              const arr = [...prizeWinners];
                              arr[idx].program_name = e.target.value;
                              setPrizeWinners(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="University"
                            value={w.university_name}
                            onChange={(e) => {
                              const arr = [...prizeWinners];
                              arr[idx].university_name = e.target.value;
                              setPrizeWinners(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={w.position}
                            onChange={(e) => {
                              const arr = [...prizeWinners];
                              arr[idx].position = e.target.value;
                              setPrizeWinners(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs font-bold"
                          >
                            <option value="First">First</option>
                            <option value="Second">Second</option>
                            <option value="Third">Third</option>
                            <option value="Consolation">Consolation</option>
                          </select>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="₹5000 / Trophy"
                            value={w.prize}
                            onChange={(e) => {
                              const arr = [...prizeWinners];
                              arr[idx].prize = e.target.value;
                              setPrizeWinners(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs font-medium"
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          {prizeWinners.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setPrizeWinners(prizeWinners.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Utilization Certificate and Handover of Items */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Utilization Certificate and Handover of Items</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Asset tracking, consumption, and balance handover.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUtilizationItems([...utilizationItems, { sr_no: utilizationItems.length + 1, particulars: '', issued_qty: '', consumption_qty: '', balance: '', handover_to: '', signature: '' }])}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item Row
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] uppercase">
                    <tr>
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2">Particulars</th>
                      <th className="p-2 w-24">Issued</th>
                      <th className="p-2 w-24">Consumed</th>
                      <th className="p-2 w-24">Balance</th>
                      <th className="p-2">Handover To</th>
                      <th className="p-2 w-24">Signature</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--panel-border)]">
                    {utilizationItems.map((u, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5 text-center font-bold text-[var(--text-secondary)]">{idx + 1}</td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="e.g. Badges & Mementoes"
                            value={u.particulars}
                            onChange={(e) => {
                              const arr = [...utilizationItems];
                              arr[idx].particulars = e.target.value;
                              setUtilizationItems(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="20"
                            value={u.issued_qty}
                            onChange={(e) => {
                              const arr = [...utilizationItems];
                              arr[idx].issued_qty = e.target.value;
                              setUtilizationItems(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="18"
                            value={u.consumption_qty}
                            onChange={(e) => {
                              const arr = [...utilizationItems];
                              arr[idx].consumption_qty = e.target.value;
                              setUtilizationItems(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="2"
                            value={u.balance}
                            onChange={(e) => {
                              const arr = [...utilizationItems];
                              arr[idx].balance = e.target.value;
                              setUtilizationItems(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="VC Office Store / Dept"
                            value={u.handover_to}
                            onChange={(e) => {
                              const arr = [...utilizationItems];
                              arr[idx].handover_to = e.target.value;
                              setUtilizationItems(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="Verified"
                            value={u.signature}
                            onChange={(e) => {
                              const arr = [...utilizationItems];
                              arr[idx].signature = e.target.value;
                              setUtilizationItems(arr);
                            }}
                            className="glass-input py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          {utilizationItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setUtilizationItems(utilizationItems.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Learning Outcome */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[var(--text-primary)]">Learning Outcome *</label>
                <ImproveEnglishButton text={learningOutcome} onImproved={setLearningOutcome} context="Student and participant technical learning outcomes from event" />
              </div>
              <textarea
                rows={3}
                value={learningOutcome}
                onChange={(e) => setLearningOutcome(e.target.value)}
                placeholder="Comprehensive technical learning outcomes, skills acquired, and feedback evaluation from participants..."
                className="glass-input"
              />
            </div>
          </div>
        )}

        {/* ================= PAGE 5: PRESS RELEASE, FEEDBACKS & SIGNATURES ================= */}
        {activeTab === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[var(--panel-border)] pb-4">
              <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black">5</span>
                Media Press Release, Feedback & 3-Tier Signatures (Page 5)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Attach newspaper clippings, feedback logs, and coordinator/HOS/VC Office authorization details.
              </p>
            </div>

            {/* News Brief with Press Release */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">News Brief with Press Release</h3>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Name of Newspaper / Publication</label>
                <input
                  type="text"
                  value={newspaperName}
                  onChange={(e) => setNewspaperName(e.target.value)}
                  placeholder="e.g. Dainik Jagran, Amar Ujala, The Tribune, Times of India"
                  className="glass-input"
                />
              </div>
              <FileUploadField
                label="Press Release Photographs & Newspaper Clippings"
                value={pressReleaseDoc}
                onChange={setPressReleaseDoc}
                accept="image/*,application/pdf"
                isImage={true}
              />
            </div>

            {/* Feedbacks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">Feedback of Guest / Resource Person</label>
                  <ImproveEnglishButton text={feedbackGuest} onImproved={setFeedbackGuest} context="Guest and speaker feedback regarding the university event" />
                </div>
                <textarea
                  rows={4}
                  value={feedbackGuest}
                  onChange={(e) => setFeedbackGuest(e.target.value)}
                  placeholder="Appreciative remarks, feedback on arrangements and student queries..."
                  className="glass-input"
                />
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">Feedback of Participants</label>
                  <ImproveEnglishButton text={feedbackParticipants} onImproved={setFeedbackParticipants} context="Participant feedback and student survey summaries" />
                </div>
                <textarea
                  rows={4}
                  value={feedbackParticipants}
                  onChange={(e) => setFeedbackParticipants(e.target.value)}
                  placeholder="Student ratings (e.g. 96% rated session highly useful, requested advanced series)..."
                  className="glass-input"
                />
              </div>
            </div>

            {/* Signatures & Authorizations */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/40 dark:to-slate-800/20 border border-[var(--panel-border)] space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Official Multi-Tier Verification Signatures
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-[var(--panel-border)] space-y-2 text-center">
                  <input
                    type="text"
                    value={coordinatorSignature}
                    onChange={(e) => setCoordinatorSignature(e.target.value)}
                    placeholder="Event Coordinator Name"
                    className="glass-input text-center text-xs font-bold"
                  />
                  <div className="pt-2 border-t border-[var(--panel-border)]">
                    <span className="text-xs font-bold text-[var(--text-primary)] block">Event Coordinator</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">Name & Signature</span>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-[var(--panel-border)] space-y-2 text-center">
                  <input
                    type="text"
                    value={headOfSchoolSignature}
                    onChange={(e) => setHeadOfSchoolSignature(e.target.value)}
                    placeholder="Head of School / Dean"
                    className="glass-input text-center text-xs font-bold"
                  />
                  <div className="pt-2 border-t border-[var(--panel-border)]">
                    <span className="text-xs font-bold text-[var(--text-primary)] block">Head of School</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">Name & Signature</span>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-[var(--panel-border)] space-y-2 text-center">
                  <input
                    type="text"
                    value={dswVerifiedBy}
                    onChange={(e) => setDswVerifiedBy(e.target.value)}
                    placeholder="VC Office Verification Officer"
                    className="glass-input text-center text-xs font-bold"
                  />
                  <div className="pt-2 border-t border-[var(--panel-border)]">
                    <span className="text-xs font-bold text-[var(--text-primary)] block">Verified By</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">VC Office Signature</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="pt-6 border-t border-[var(--panel-border)] flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveTab(prev => Math.max(1, prev - 1))}
            disabled={activeTab === 1}
            className="btn-secondary text-xs flex items-center gap-2 py-2 px-4 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Page
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              Page {activeTab} of 5
            </span>
          </div>

          {activeTab < 5 ? (
            <button
              type="button"
              onClick={() => setActiveTab(prev => Math.min(5, prev + 1))}
              className="btn-primary text-xs flex items-center gap-2 py-2 px-4"
            >
              Next Page <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSave('submitted')}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Complete & Submit Report
            </button>
          )}
        </div>
      </div>

      {/* Annexure-1 Modal Drawer */}
      {showAnnexureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 border border-[var(--panel-border)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[var(--panel-border)] flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--text-primary)]">Annexure: 1 Reference Guide</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Click any category to auto-populate Category, Sub-Category & SDGs</p>
                </div>
              </div>
              <button onClick={() => setShowAnnexureModal(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 divide-y divide-[var(--panel-border)]">
              {ANNEXURE_1_DATA.map((item) => (
                <div key={item.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{item.category}</h4>
                    <button
                      onClick={() => applyAnnexureItem(item)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Select Category
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-[var(--panel-border)] space-y-1">
                      <span className="font-bold text-[var(--text-secondary)] uppercase text-[10px]">Sub-Categories & Examples:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[var(--text-primary)]">
                        {item.subCategories.map((sub, i) => (
                          <li key={i} className="cursor-pointer hover:text-blue-500" onClick={() => applyAnnexureItem(item, sub)}>
                            {sub}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-1">
                      <span className="font-bold text-blue-700 dark:text-blue-300 uppercase text-[10px]">Primary SDG Mapping & Rationale:</span>
                      <p className="font-bold text-blue-900 dark:text-blue-100">{item.primarySdg}</p>
                      <p className="text-[11px] text-blue-800 dark:text-blue-300/80 leading-relaxed">{item.rationale}</p>
                      {item.additionalSdgs && (
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">{item.additionalSdgs}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                    const iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
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
              id="print-iframe"
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

export default EventReportFormPage;
