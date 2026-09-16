import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  Download, 
  Table, 
  Trash2, 
  X, 
  Copy, 
  Check, 
  QrCode, 
  Image as ImageIcon, 
  DollarSign, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  ShieldCheck,
  Zap,
  Share2
} from 'lucide-react';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';

interface FormField {
  field_id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'dropdown' | 'textarea' | 'date';
  required: boolean;
  options?: string[];
}

interface DynamicFormItem {
  id: number;
  title: string;
  purpose_label: string;
  description: string;
  form_schema: FormField[];
  google_sheet_id: string;
  google_sheet_url?: string;
  google_webhook_url?: string;
  google_sheet_tab_name: string;
  enable_image_upload: boolean;
  image_upload_label: string;
  image_upload_required: boolean;
  enable_payment: boolean;
  payment_amount: number;
  upi_id?: string;
  upi_payee_name?: string;
  is_active: boolean;
  public_slug: string;
  created_at: string;
  response_count: number;
}

interface FormResponseItem {
  id: number;
  response_data: Record<string, any>;
  sync_status: string;
  submitted_at: string;
}

export const FormsPage: React.FC = () => {
  const [forms, setForms] = useState<DynamicFormItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [showGSheetGuideModal, setShowGSheetGuideModal] = useState(false);
  const [selectedFormForResponses, setSelectedFormForResponses] = useState<DynamicFormItem | null>(null);
  const [responsesList, setResponsesList] = useState<FormResponseItem[]>([]);
  const [imagePreviewModal, setImagePreviewModal] = useState<string | null>(null);

  // Wizard Form State
  const [title, setTitle] = useState('');
  const [purposeLabel, setPurposeLabel] = useState('Registration Form');
  const [description, setDescription] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [googleSheetTabName, setGoogleSheetTabName] = useState('Sheet1');

  // Image Upload Toggle
  const [enableImageUpload, setEnableImageUpload] = useState(false);
  const [imageUploadLabel, setImageUploadLabel] = useState('Upload Document / ID Card / Photo');
  const [imageUploadRequired, setImageUploadRequired] = useState(false);

  // UPI Payment Integration
  const [enablePayment, setEnablePayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(100);
  const [upiId, setUpiId] = useState('vc.office@geeta.edu.in');
  const [upiPayeeName, setUpiPayeeName] = useState('Geeta University VC Office');

  const [fields, setFields] = useState<FormField[]>([
    { field_id: 'full_name', label: 'Full Name', type: 'text', required: true },
    { field_id: 'roll_number', label: 'Roll Number', type: 'text', required: true },
    { field_id: 'email', label: 'Email Address', type: 'email', required: true },
    { field_id: 'phone', label: 'Contact Number', type: 'phone', required: true }
  ]);

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<DynamicFormItem[]>('/forms', 'GET', undefined, false, true);
      setForms(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleApplyTemplate = (purpose: string) => {
    setPurposeLabel(purpose);
    if (purpose === 'Event Registration with Fee') {
      setTitle('Annual Techfest 2026 Registration');
      setEnablePayment(true);
      setPaymentAmount(150);
      setUpiId('vc.office@geeta.edu.in');
      setUpiPayeeName('Geeta University VC Office');
      setEnableImageUpload(true);
      setImageUploadLabel('Upload College ID Card');
      setFields([
        { field_id: 'full_name', label: 'Full Name', type: 'text', required: true },
        { field_id: 'roll_number', label: 'Roll Number', type: 'text', required: true },
        { field_id: 'branch', label: 'Department / Branch', type: 'text', required: true },
        { field_id: 'email', label: 'Email Address', type: 'email', required: true },
        { field_id: 'phone', label: 'WhatsApp Number', type: 'phone', required: true }
      ]);
    } else if (purpose === 'Detailed Student Form') {
      setTitle('Student Background Profile');
      setEnablePayment(false);
      setEnableImageUpload(true);
      setImageUploadLabel('Upload Passport Size Photograph');
      setFields([
        { field_id: 'name', label: 'Full Name', type: 'text', required: true },
        { field_id: 'father_name', label: "Father's Name", type: 'text', required: true },
        { field_id: 'address', label: 'Permanent Address', type: 'text', required: true },
        { field_id: 'gpa', label: 'Current CGPA', type: 'number', required: false }
      ]);
    } else if (purpose === 'Club Audition Form') {
      setTitle('Cultural Club Auditions 2026');
      setEnablePayment(false);
      setEnableImageUpload(true);
      setImageUploadLabel('Upload Past Performance Certificate / Video Link');
      setFields([
        { field_id: 'name', label: 'Full Name', type: 'text', required: true },
        { field_id: 'category', label: 'Category of Talent', type: 'dropdown', required: true, options: ['Singing', 'Dance', 'Drama', 'Anchoring', 'Photography', 'Music Band'] },
        { field_id: 'experience', label: 'Brief Description of Experience', type: 'textarea', required: false }
      ]);
    }
  };

  const handleAddField = () => {
    const idx = fields.length + 1;
    setFields([...fields, { field_id: `field_${idx}`, label: `Custom Field ${idx}`, type: 'text', required: true }]);
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/forms', 'POST', {
        title,
        purpose_label: purposeLabel,
        description,
        fields,
        google_sheet_url: googleSheetUrl || undefined,
        google_sheet_tab_name: googleSheetTabName || 'Sheet1',
        enable_image_upload: enableImageUpload,
        image_upload_label: imageUploadLabel,
        image_upload_required: imageUploadRequired,
        enable_payment: enablePayment,
        payment_amount: Number(paymentAmount) || 0,
        upi_id: upiId || undefined,
        upi_payee_name: upiPayeeName || undefined
      });
      setIsWizardOpen(false);
      setTitle('');
      setDescription('');
      fetchForms();
      alert('Custom Web Form with Google Sheet & UPI Scanner Created Successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create dynamic form');
    }
  };

  const handleViewResponses = async (f: DynamicFormItem) => {
    setSelectedFormForResponses(f);
    try {
      const res = await apiRequest<FormResponseItem[]>(`/forms/${f.id}/responses`);
      setResponsesList(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/forms/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const googleAppsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    var data = payload.data || {};
    
    // Auto-create headers on row 1 if empty
    if (sheet.getLastRow() === 0) {
      var headers = ["Timestamp"];
      for (var key in data) { headers.push(key); }
      sheet.appendRow(headers);
    }
    
    // Read header row to map columns accurately
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = [new Date().toLocaleString()];
    
    for (var i = 1; i < headers.length; i++) {
      var colName = headers[i];
      row.push(data[colName] !== undefined ? data[colName] : "");
    }
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const generatedUpiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiPayeeName)}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(title || 'Form Payment')}`;
  const qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generatedUpiUrl)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-[var(--panel-border)] p-6 rounded-3xl shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Dynamic Web Form Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mt-2">
            Website Web Forms & Google Sheet Sync
          </h1>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            Create custom web registration forms with direct Google Sheet link sync, image uploads toggle, and dynamic UPI QR Code payment scanner.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowGSheetGuideModal(true)}
            className="btn-secondary text-xs py-2.5 px-4 flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4 text-emerald-500" /> Google Sheet Setup Guide
          </button>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Create Custom Web Form
          </button>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-[var(--text-secondary)] bg-white dark:bg-slate-900 rounded-3xl border border-[var(--panel-border)]">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading dynamic web forms...
          </div>
        ) : forms.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-[var(--text-secondary)] bg-white dark:bg-slate-900 rounded-3xl border border-[var(--panel-border)] space-y-3">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">No Web Forms Created Yet</h3>
            <p className="text-xs text-[var(--text-secondary)]">Click 'Create Custom Web Form' to build your first registration form with Google Sheet and UPI payment scanner.</p>
            <button onClick={() => setIsWizardOpen(true)} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Form Now
            </button>
          </div>
        ) : (
          forms.map(f => (
            <div key={f.id} className="bg-white dark:bg-slate-900 border border-[var(--panel-border)] p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                    {f.purpose_label}
                  </span>
                  <div className="flex items-center gap-2">
                    {f.enable_payment && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <QrCode className="w-3 h-3" /> ₹{f.payment_amount} UPI
                      </span>
                    )}
                    {f.enable_image_upload && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Image Upload ON
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)]">{f.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{f.description || 'No description provided.'}</p>

                {/* Google Sheet & Features Info */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-[var(--panel-border)] text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-secondary)]">Google Sheet Target:</span>
                    {f.google_sheet_url ? (
                      <a href={f.google_sheet_url} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Open G-Sheet
                      </a>
                    ) : (
                      <span className="font-mono text-slate-500">Auto-Linked Database</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--panel-border)]">
                    <span className="text-[var(--text-secondary)]">Total Fields: <strong>{f.form_schema?.length || 0}</strong></span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">Responses: {f.response_count}</span>
                  </div>
                </div>

                {/* Public Link Box */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-[var(--panel-border)] flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--text-primary)] truncate max-w-[220px]">
                    /forms/{f.public_slug}
                  </span>
                  <button
                    onClick={() => handleCopyLink(f.public_slug)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    {copiedSlug === f.public_slug ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSlug === f.public_slug ? 'Copied!' : 'Copy Public URL'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex items-center justify-between gap-2">
                <a
                  href={`/forms/${f.public_slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-2 px-3 flex-1 justify-center flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-500" /> Public View
                </a>
                <button
                  onClick={() => handleViewResponses(f)}
                  className="btn-primary text-xs py-2 px-3 flex-1 justify-center flex items-center gap-1.5"
                >
                  <Table className="w-3.5 h-3.5" /> Responses ({f.response_count})
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Builder Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-[var(--panel-border)] rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div>
                <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" /> Web Form Creator (G-Sheet & UPI Payments)
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">Design your form, connect Google Sheet, toggle image uploads, and configure instant UPI QR scanner.</p>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateForm} className="space-y-6">
              {/* Quick Template Choice */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                  Quick Starter Templates
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {['Event Registration with Fee', 'Detailed Student Form', 'Club Audition Form'].map(purpose => (
                    <button
                      key={purpose}
                      type="button"
                      onClick={() => handleApplyTemplate(purpose)}
                      className={`p-3 rounded-2xl border text-xs text-left transition-all ${
                        purposeLabel === purpose
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-[var(--panel-border)] text-[var(--text-secondary)] hover:bg-slate-100'
                      }`}
                    >
                      {purpose}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Form Title *</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Hackathon 2026 Registration Form" className="glass-input text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Category / Purpose Label</label>
                  <input required type="text" value={purposeLabel} onChange={e => setPurposeLabel(e.target.value)} className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Google Sheet Link / Webhook URL</label>
                  <input
                    type="text"
                    value={googleSheetUrl}
                    onChange={e => setGoogleSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/... or script.google.com"
                    className="glass-input font-mono text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[var(--text-primary)]">Form Description</label>
                    <ImproveEnglishButton text={description} onImproved={setDescription} context="Public form guidelines and description" />
                  </div>
                  <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide instructions to respondents..." className="glass-input text-xs" />
                </div>
              </div>

              {/* Feature Toggles: Image Upload & UPI Payments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Image Upload Toggle */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  enableImageUpload ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-800/40 border-[var(--panel-border)]'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">Image / File Upload</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableImageUpload}
                        onChange={(e) => setEnableImageUpload(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {enableImageUpload && (
                    <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-900/40">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Upload Field Label</label>
                        <input
                          type="text"
                          value={imageUploadLabel}
                          onChange={(e) => setImageUploadLabel(e.target.value)}
                          placeholder="e.g. Upload College ID / Passport Photo"
                          className="glass-input text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="img-req"
                          checked={imageUploadRequired}
                          onChange={(e) => setImageUploadRequired(e.target.checked)}
                          className="w-4 h-4 accent-purple-600 rounded"
                        />
                        <label htmlFor="img-req" className="text-xs text-[var(--text-secondary)]">Mandatory Upload</label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. UPI Payment Integration */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  enablePayment ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/40 border-[var(--panel-border)]'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">UPI Payment & Scanner</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enablePayment}
                        onChange={(e) => setEnablePayment(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {enablePayment && (
                    <div className="space-y-3 pt-2 border-t border-amber-200 dark:border-amber-900/40">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Fee Amount (₹)</label>
                          <input
                            type="number"
                            min="1"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                            className="glass-input text-xs font-bold text-amber-700 dark:text-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">UPI ID (e.g. VPA)</label>
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="vc.office@sbi"
                            className="glass-input text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Payee Name</label>
                        <input
                          type="text"
                          value={upiPayeeName}
                          onChange={(e) => setUpiPayeeName(e.target.value)}
                          placeholder="Geeta University VC Office"
                          className="glass-input text-xs"
                        />
                      </div>

                      {/* Live UPI QR Preview in Builder */}
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-center gap-3">
                        <img src={qrPreviewUrl} alt="UPI QR Preview" className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Live QR Scanner Preview</span>
                          <span className="text-xs font-bold text-[var(--text-primary)]">₹{paymentAmount} to {upiId}</span>
                          <span className="text-[10px] text-[var(--text-secondary)] block">Users can scan via GPay / PhonePe / Paytm</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Form Fields */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[var(--panel-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Custom Form Fields ({fields.length})
                  </label>
                  <button type="button" onClick={handleAddField} className="btn-secondary text-xs py-1 px-3 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {fields.map((field, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-[var(--panel-border)] grid grid-cols-12 gap-2 items-center shadow-xs">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={field.label}
                          onChange={e => {
                            const updated = [...fields];
                            updated[idx].label = e.target.value;
                            updated[idx].field_id = e.target.value.toLowerCase().replace(/\s+/g, '_');
                            setFields(updated);
                          }}
                          placeholder="Field Label"
                          className="glass-input text-xs"
                        />
                      </div>
                      <div className="col-span-4">
                        <select
                          value={field.type}
                          onChange={e => {
                            const updated = [...fields];
                            updated[idx].type = e.target.value as any;
                            setFields(updated);
                          }}
                          className="glass-input text-xs"
                        >
                          <option value="text">Single Line Text</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone / WhatsApp</option>
                          <option value="dropdown">Dropdown Select</option>
                          <option value="textarea">Multi-line Text</option>
                          <option value="date">Date Picker</option>
                        </select>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={e => {
                            const updated = [...fields];
                            updated[idx].required = e.target.checked;
                            setFields(updated);
                          }}
                          className="w-4 h-4 accent-blue-600 rounded"
                        />
                        <span className="text-[11px] text-[var(--text-secondary)]">Required</span>
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => setFields(fields.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsWizardOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Web Form</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sheet Setup Guide Modal */}
      {showGSheetGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-[var(--panel-border)] rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)]">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" /> How to Connect Any Google Sheet (10-Second Setup)
              </h3>
              <button onClick={() => setShowGSheetGuideModal(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[var(--text-secondary)] space-y-3 leading-relaxed">
              <p><strong>Step 1:</strong> Create or open your Google Sheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-500 underline font-bold">sheets.new</a>.</p>
              <p><strong>Step 2:</strong> Click <strong>Extensions → Apps Script</strong> in Google Sheets top menu.</p>
              <p><strong>Step 3:</strong> Paste the script below into the code editor, click <strong>Deploy → New deployment → Web app</strong> (Set 'Who has access' to <em>Anyone</em>), and copy the Web App URL.</p>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-52 border border-slate-800">
                {googleAppsScriptCode}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(googleAppsScriptCode);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="absolute top-2.5 right-2.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedScript ? 'Copied Code!' : 'Copy Script'}
              </button>
            </div>

            <div className="pt-3 border-t border-[var(--panel-border)] flex justify-end">
              <button onClick={() => setShowGSheetGuideModal(false)} className="btn-primary text-xs py-2 px-4">
                Got it, close guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Table Viewer Modal */}
      {selectedFormForResponses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-[var(--panel-border)] rounded-3xl p-4 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--panel-border)] gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">{selectedFormForResponses.title} — Submissions Ledger</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-[var(--text-secondary)]">
                  <span>Total: <strong>{responsesList.length} Responses</strong></span>
                  {selectedFormForResponses.google_sheet_url && (
                    <a href={selectedFormForResponses.google_sheet_url} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Open Google Sheet
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <a
                  href={`/api/forms/${selectedFormForResponses.id}/responses/export`}
                  className="btn-primary text-xs py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </a>
                <button onClick={() => setSelectedFormForResponses(null)} className="p-1.5 text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl border border-[var(--panel-border)]">
              <table className="w-full min-w-[750px] text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[var(--text-secondary)] uppercase font-bold border-b border-[var(--panel-border)]">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Timestamp</th>
                    {selectedFormForResponses.form_schema.map(field => (
                      <th key={field.field_id} className="p-3">{field.label}</th>
                    ))}
                    {selectedFormForResponses.enable_image_upload && (
                      <th className="p-3">Attached Image</th>
                    )}
                    {selectedFormForResponses.enable_payment && (
                      <>
                        <th className="p-3">Payment</th>
                        <th className="p-3">UTR / Txn ID</th>
                        <th className="p-3">Payment Proof</th>
                      </>
                    )}
                    <th className="p-3 text-center">G-Sheet Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--panel-border)]">
                  {responsesList.length === 0 ? (
                    <tr><td colSpan={15} className="p-12 text-center text-[var(--text-secondary)] font-medium">No submission records logged yet.</td></tr>
                  ) : (
                    responsesList.map((r, idx) => {
                      const uploadedImg = r.response_data['_uploaded_image'];
                      const paymentProof = r.response_data['_payment_screenshot'];
                      const txnId = r.response_data['_transaction_id'];

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 text-center font-bold text-[var(--text-secondary)]">{idx + 1}</td>
                          <td className="p-3 text-[var(--text-secondary)] whitespace-nowrap">{new Date(r.submitted_at).toLocaleString()}</td>
                          {selectedFormForResponses.form_schema.map(field => (
                            <td key={field.field_id} className="p-3 text-[var(--text-primary)] font-medium">
                              {r.response_data[field.field_id] || '-'}
                            </td>
                          ))}
                          {selectedFormForResponses.enable_image_upload && (
                            <td className="p-3">
                              {uploadedImg ? (
                                <button
                                  onClick={() => setImagePreviewModal(uploadedImg)}
                                  className="p-1 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:underline"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View Photo
                                </button>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          )}
                          {selectedFormForResponses.enable_payment && (
                            <>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                                  ₹{selectedFormForResponses.payment_amount} PAID
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {txnId || '-'}
                              </td>
                              <td className="p-3">
                                {paymentProof ? (
                                  <button
                                    onClick={() => setImagePreviewModal(paymentProof)}
                                    className="p-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:underline"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Receipt
                                  </button>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            </>
                          )}
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-500/30">
                              {r.sync_status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-2xl max-h-[85vh] bg-slate-900 p-4 rounded-3xl relative flex flex-col items-center">
            <button onClick={() => setImagePreviewModal(null)} className="absolute top-3 right-3 p-1.5 text-white/70 hover:text-white bg-black/50 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <img src={imagePreviewModal} alt="Preview Document" className="max-w-full max-h-[75vh] rounded-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FormsPage;
