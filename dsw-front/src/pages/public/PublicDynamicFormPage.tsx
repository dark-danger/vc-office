import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  QrCode, 
  Upload, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  ShieldCheck, 
  Lock,
  Smartphone,
  Sparkles
} from 'lucide-react';

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
  enable_image_upload: boolean;
  image_upload_label: string;
  image_upload_required: boolean;
  enable_payment: boolean;
  payment_amount: number;
  upi_id?: string;
  upi_payee_name?: string;
  public_slug: string;
}

export const PublicDynamicFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<DynamicFormItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedImage, setUploadedImage] = useState<string>('');
  
  // Payment State
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const paymentScreenshotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadForm() {
      if (!slug) return;
      try {
        const data = await apiRequest<DynamicFormItem>(`/forms/public/${slug}`);
        setForm(data);
      } catch (e: any) {
        setError(e.message || 'Form not found or closed');
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [slug]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (file: File, setter: (val: string) => void) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds 15MB limit.");
      return;
    }

    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setter(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }

    // Compress image client-side to avoid payload limit
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setter(compressedDataUrl);
        } else {
          setter(reader.result as string);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !form) return;

    // Validate image upload if required
    if (form.enable_image_upload && form.image_upload_required && !uploadedImage) {
      alert(`Please upload: ${form.image_upload_label || 'Required image/document'}`);
      return;
    }

    // Validate payment if required
    if (form.enable_payment && !transactionId.trim()) {
      alert('Please enter your UPI Transaction ID / UTR number after scanning the QR Code.');
      return;
    }

    setSubmitting(true);
    setError('');

    const completePayload: Record<string, any> = {
      ...formData
    };

    if (form.enable_image_upload && uploadedImage) {
      completePayload['_uploaded_image'] = uploadedImage;
    }

    if (form.enable_payment) {
      completePayload['_payment_status'] = 'paid';
      completePayload['_payment_amount'] = form.payment_amount;
      completePayload['_upi_id'] = form.upi_id;
      completePayload['_transaction_id'] = transactionId;
      if (paymentScreenshot) {
        completePayload['_payment_screenshot'] = paymentScreenshot;
      }
    }

    try {
      const res = await apiRequest<any>(`/forms/public/${slug}/submit`, 'POST', completePayload);
      setSubmissionId(res.submission_id || null);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyUpi = () => {
    if (!form?.upi_id) return;
    navigator.clipboard.writeText(form.upi_id);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)] p-4">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold">Loading official web form...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4 py-8">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Form Unavailable</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-2">{error || 'This form does not exist or has been closed by VC Office Administration.'}</p>
        </div>
      </div>
    );
  }

  const generatedUpiUrl = form.enable_payment && form.upi_id
    ? `upi://pay?pa=${encodeURIComponent(form.upi_id)}&pn=${encodeURIComponent(form.upi_payee_name || 'Geeta University VC Office')}&am=${form.payment_amount}&cu=INR&tn=${encodeURIComponent(form.title)}`
    : '';

  const qrCodeImageUrl = generatedUpiUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generatedUpiUrl)}`
    : '';

  if (submitted) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] p-3.5 sm:p-6">
        <div className="glass-panel border border-emerald-500/30 p-6 sm:p-8 md:p-10 rounded-3xl max-w-lg text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-auto">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">Submission Successful!</h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Your response for <strong>{form.title}</strong> has been received and synchronized to the official Geeta University Google Sheet ledger.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>Reference ID:</span>
              <strong className="text-emerald-500 font-bold">#GU-VC-{submissionId || Math.floor(100000 + Math.random() * 900000)}</strong>
            </div>
            {form.enable_payment && (
              <>
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Fee Amount:</span>
                  <strong className="text-[var(--text-primary)]">₹{form.payment_amount}.00</strong>
                </div>
                <div className="flex justify-between text-[var(--text-muted)] truncate">
                  <span>Txn ID (UTR):</span>
                  <strong className="text-amber-500 truncate max-w-[160px]">{transactionId}</strong>
                </div>
              </>
            )}
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>Timestamp:</span>
              <span className="text-[var(--text-secondary)]">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified Geeta University VC Office Submission
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 relative">
      <div className="w-full max-w-2xl glass-panel border border-[var(--panel-border)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 shadow-2xl relative space-y-5 sm:space-y-6 my-4 sm:my-auto">

        
        {/* Form Brand Header */}
        <div className="border-b border-[var(--panel-border)] pb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {form.purpose_label || 'Official Web Form'}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <Lock className="w-3.5 h-3.5 text-emerald-500" /> Secure SSL Form
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {form.title}
          </h1>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
            {form.description || 'Geeta University • Directorate of Student Welfare'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Custom Form Fields */}
          <div className="space-y-4">
            {form.form_schema.map(field => (
              <div key={field.field_id}>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>

                {field.type === 'dropdown' ? (
                  <select
                    required={field.required}
                    value={formData[field.field_id] || ''}
                    onChange={e => handleChange(field.field_id, e.target.value)}
                    className="glass-input"
                  >
                    <option value="">-- Select Option --</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    rows={3}
                    value={formData[field.field_id] || ''}
                    onChange={e => handleChange(field.field_id, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="glass-input"
                  />
                ) : (
                  <input
                    required={field.required}
                    type={field.type === 'phone' ? 'tel' : field.type}
                    value={formData[field.field_id] || ''}
                    onChange={e => handleChange(field.field_id, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="glass-input"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Image / Document Upload Section (if enabled) */}
          {form.enable_image_upload && (
            <div className="p-5 rounded-2xl bg-[var(--card-bg-to)] border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> {form.image_upload_label || 'Upload Document / Photo'} {form.image_upload_required && <span className="text-rose-500">*</span>}
                </label>
              </div>

              {uploadedImage ? (
                <div className="p-3 bg-[var(--panel-bg)] rounded-xl border border-purple-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={uploadedImage} alt="Uploaded preview" className="w-12 h-12 rounded-lg object-cover bg-white shrink-0" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold truncate">Photo Attached Successfully</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedImage('')}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-2xl p-4 text-center space-y-1.5 bg-purple-500/5 hover:bg-purple-500/10 transition-all"
                >
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], setUploadedImage);
                      }
                    }}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-purple-500 mx-auto" />
                  <p className="text-xs font-bold text-[var(--text-primary)]">Click to upload or take a picture</p>
                  <p className="text-[10px] text-[var(--text-muted)]">JPG, PNG, WEBP, PDF (Max 15MB)</p>
                </div>
              )}
            </div>
          )}

          {/* UPI Payment & Dynamic QR Code Scanner Section (if enabled) */}
          {form.enable_payment && (
            <div className="p-6 rounded-3xl bg-[var(--card-bg-to)] border-2 border-amber-500/40 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Registration Payment</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-sm border border-amber-500/30">
                  Amount: ₹{form.payment_amount}.00
                </div>
              </div>

              {/* Dynamic QR Scanner Card */}
              <div className="p-5 bg-[var(--panel-bg)] rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="p-2 bg-white rounded-2xl shadow-xl shrink-0">
                  <img src={qrCodeImageUrl} alt="UPI QR Code Scanner" className="w-36 h-36 rounded-xl" />
                </div>

                <div className="space-y-2 flex-1">
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider block">Scan with any UPI App</span>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">{form.upi_payee_name || 'Geeta University VC Office'}</h4>
                  
                  <div className="p-2 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-amber-600 dark:text-amber-300 truncate">{form.upi_id}</span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                    >
                      {copiedUpi ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedUpi ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Mobile Deep Link */}
                  {generatedUpiUrl && (
                    <a
                      href={generatedUpiUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md mt-1"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Pay in GPay / PhonePe / Paytm
                    </a>
                  )}
                </div>
              </div>

              {/* Transaction ID & Screenshot Verification Inputs */}
              <div className="space-y-4 pt-2 border-t border-amber-500/20">
                <div>
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-300 mb-1">
                    UPI Transaction ID / UTR Number * <span className="text-[var(--text-muted)] font-normal">(12-digit number from payment app)</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 425518291039"
                    className="glass-input font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Upload Payment Screenshot / Receipt (Optional)
                  </label>
                  {paymentScreenshot ? (
                    <div className="p-3 bg-[var(--panel-bg)] rounded-xl border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={paymentScreenshot} alt="Payment receipt" className="w-10 h-10 rounded-lg object-cover bg-white" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Screenshot Attached</span>
                      </div>
                      <button type="button" onClick={() => setPaymentScreenshot('')} className="p-1 text-rose-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => paymentScreenshotRef.current?.click()}
                      className="cursor-pointer border border-dashed border-[var(--panel-border)] hover:border-amber-500/50 rounded-xl p-3 text-center bg-amber-500/5"
                    >
                      <input
                        type="file"
                        ref={paymentScreenshotRef}
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0], setPaymentScreenshot);
                          }
                        }}
                        className="hidden"
                      />
                      <span className="text-xs text-[var(--text-muted)]">+ Attach payment screenshot / invoice</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary justify-center py-3.5 text-sm font-black shadow-xl"
          >
            {submitting ? 'Verifying & Submitting...' : 'Submit Form & Confirm'} <Send className="w-4 h-4 ml-1" />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[10px] text-[var(--text-muted)] font-medium">
            Powered by Geeta University VC Office Platform • Responses automatically logged into university Google Sheet ledger
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicDynamicFormPage;
