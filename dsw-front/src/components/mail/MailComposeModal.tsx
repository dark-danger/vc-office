import React, { useState, useEffect, useRef } from 'react';
import {
  X, Minus, Maximize2, Minimize2, Send, Paperclip, Trash2,
  Lock, Sparkles, Loader2, Save, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { ImproveEnglishButton } from '../common/ImproveEnglishButton';

export interface ComposeInitialData {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body_html?: string;
  in_reply_to?: string;
  references?: string;
  thread_id?: string;
  draft_id?: string;
}

interface MailComposeModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;
  initialData?: ComposeInitialData | null;
}

interface FileAttachment {
  filename: string;
  mime_type: string;
  size: number;
  content_base64: string;
}

export const MailComposeModal: React.FC<MailComposeModalProps> = ({
  user,
  isOpen,
  onClose,
  onSent,
  initialData
}) => {
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);

  // Form Fields
  const [toInput, setToInput] = useState('');
  const [toList, setToList] = useState<string[]>([]);
  
  const [showCc, setShowCc] = useState(false);
  const [ccInput, setCcInput] = useState('');
  const [ccList, setCcList] = useState<string[]>([]);

  const [showBcc, setShowBcc] = useState(false);
  const [bccInput, setBccInput] = useState('');
  const [bccList, setBccList] = useState<string[]>([]);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setToList(initialData.to || []);
        setCcList(initialData.cc || []);
        setShowCc(!!(initialData.cc && initialData.cc.length > 0));
        setBccList(initialData.bcc || []);
        setShowBcc(!!(initialData.bcc && initialData.bcc.length > 0));
        setSubject(initialData.subject || '');
        setBody(initialData.body_html || '');
      } else {
        setToList([]);
        setCcList([]);
        setShowCc(false);
        setBccList([]);
        setShowBcc(false);
        setSubject('');
        setBody('');
        setAttachments([]);
      }
      setMinimized(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleAddEmail = (
    input: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const emails = input
      .split(/[,;\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    if (emails.length > 0) {
      const updated = Array.from(new Set([...list, ...emails]));
      setList(updated);
      setInput('');
    }
  };

  const handleRemoveEmail = (
    emailToRemove: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.filter(e => e !== emailToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ${file.name} exceeds maximum Gmail attachment limit (15MB).`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        setAttachments(prev => [
          ...prev,
          {
            filename: file.name,
            mime_type: file.type || 'application/octet-stream',
            size: file.size,
            content_base64: base64
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Flush any pending text in To input
    let finalTo = [...toList];
    if (toInput.trim()) {
      const extra = toInput.split(/[,;\s]+/).map(x => x.trim().toLowerCase()).filter(Boolean);
      finalTo = Array.from(new Set([...finalTo, ...extra]));
    }

    if (finalTo.length === 0) {
      alert('Please specify at least one recipient in the "To" field.');
      return;
    }

    setSending(true);
    try {
      await apiRequest('/email/send', 'POST', {
        to: finalTo,
        cc: ccList,
        bcc: bccList,
        subject: subject.trim() || '(No Subject)',
        body_html: body,
        in_reply_to: initialData?.in_reply_to || undefined,
        references: initialData?.references || undefined,
        thread_id: initialData?.thread_id || undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      if (onSent) onSent();
      onClose();
    } catch (err: any) {
      console.error('Send Email Error:', err);
      alert(err.message || 'Failed to send email. Please verify connection and recipient addresses.');
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await apiRequest('/email/drafts', 'POST', {
        to: toList,
        cc: ccList,
        bcc: bccList,
        subject: subject,
        body_html: body,
        draft_id: initialData?.draft_id || undefined
      });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } catch (err: any) {
      console.error('Draft Error:', err);
      alert(err.message || 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-200 shadow-2xl ${
        minimized
          ? 'bottom-0 right-3 sm:right-6 w-72 h-12 bg-slate-900 border border-slate-700 rounded-t-xl overflow-hidden'
          : maximized
          ? 'inset-0 sm:inset-4 md:inset-8 bg-[var(--panel-bg)] backdrop-blur-2xl border border-[var(--panel-border)] sm:rounded-2xl flex flex-col'
          : 'inset-x-0 bottom-0 sm:inset-x-auto sm:right-4 md:right-8 sm:w-full sm:max-w-2xl h-[90vh] sm:h-[560px] bg-[var(--panel-bg)] backdrop-blur-2xl border border-[var(--panel-border)] rounded-t-2xl flex flex-col'
      }`}
    >
      {/* Header Bar */}
      <div className="h-12 px-4 bg-slate-900/90 border-b border-[var(--panel-border)] rounded-t-xl flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold text-slate-200 truncate">
            {subject.trim() || 'New Message'}
          </h3>
          {draftSaved && (
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Draft Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={() => setMinimized(!minimized)}
            className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={minimized ? 'Expand' : 'Minimize'}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          {!minimized && (
            <button
              type="button"
              onClick={() => setMaximized(!maximized)}
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={maximized ? 'Restore' : 'Maximize'}
            >
              {maximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body / Editor */}
      {!minimized && (
        <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-hidden">
          {/* Header Fields */}
          <div className="px-4 py-2 border-b border-[var(--panel-border)] space-y-2 text-xs">
            {/* From Locked */}
            <div className="flex items-center gap-2 text-[var(--text-muted)] py-0.5">
              <span className="w-12 font-semibold">From:</span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                <Lock className="w-3 h-3" /> {user?.email}
              </div>
            </div>

            {/* To Input */}
            <div className="flex items-start gap-2 py-1">
              <span className="w-12 pt-1 font-semibold text-[var(--text-secondary)]">To:</span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5">
                {toList.map(email => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 font-mono text-[11px]"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email, toList, setToList)}
                      className="hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={toInput}
                  onChange={e => setToInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                      e.preventDefault();
                      handleAddEmail(toInput, toList, setToList, setToInput);
                    }
                  }}
                  onBlur={() => handleAddEmail(toInput, toList, setToList, setToInput)}
                  placeholder={toList.length === 0 ? "Recipients (e.g. colleague@geetauniversity.edu.in)..." : ""}
                  className="flex-1 min-w-[150px] bg-transparent outline-none text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="hover:text-emerald-500"
                  >
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className="hover:text-emerald-500"
                  >
                    Bcc
                  </button>
                )}
              </div>
            </div>

            {/* CC Input */}
            {showCc && (
              <div className="flex items-start gap-2 py-1">
                <span className="w-12 pt-1 font-semibold text-[var(--text-secondary)]">Cc:</span>
                <div className="flex-1 flex flex-wrap items-center gap-1.5">
                  {ccList.map(email => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 font-mono text-[11px]"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email, ccList, setCcList)}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={ccInput}
                    onChange={e => setCcInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                        e.preventDefault();
                        handleAddEmail(ccInput, ccList, setCcList, setCcInput);
                      }
                    }}
                    onBlur={() => handleAddEmail(ccInput, ccList, setCcList, setCcInput)}
                    placeholder="Cc recipients..."
                    className="flex-1 min-w-[150px] bg-transparent outline-none text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>
            )}

            {/* BCC Input */}
            {showBcc && (
              <div className="flex items-start gap-2 py-1">
                <span className="w-12 pt-1 font-semibold text-[var(--text-secondary)]">Bcc:</span>
                <div className="flex-1 flex flex-wrap items-center gap-1.5">
                  {bccList.map(email => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-300 font-mono text-[11px]"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email, bccList, setBccList)}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={bccInput}
                    onChange={e => setBccInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                        e.preventDefault();
                        handleAddEmail(bccInput, bccList, setBccList, setBccInput);
                      }
                    }}
                    onBlur={() => handleAddEmail(bccInput, bccList, setBccList, setBccInput)}
                    placeholder="Bcc recipients..."
                    className="flex-1 min-w-[150px] bg-transparent outline-none text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-2 py-1 border-t border-[var(--panel-border)] pt-2">
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full bg-transparent outline-none text-xs font-semibold text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Attachments Chips */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 border-b border-[var(--panel-border)] flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-xs text-[var(--text-primary)]"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-medium truncate max-w-[180px]">{att.filename}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    ({Math.round(att.size / 1024)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="text-[var(--text-muted)] hover:text-rose-500 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Message Textarea */}
          <div className="flex-1 p-4 flex flex-col relative overflow-y-auto">
            <textarea
              required
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Type your official email message here..."
              className="w-full flex-1 bg-transparent resize-none outline-none text-xs text-[var(--text-primary)] leading-relaxed font-sans placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Bottom Toolbar & Actions */}
          <div className="p-2 sm:px-4 sm:py-0 sm:h-14 border-t border-[var(--panel-border)] bg-[var(--card-bg-to)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Send Button */}
              <button
                type="submit"
                disabled={sending}
                className="btn-primary py-1.5 sm:py-2 px-3.5 sm:px-5 text-xs font-bold flex items-center gap-1.5 sm:gap-2 shadow-md cursor-pointer"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>

              {/* Attach File Trigger */}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                title="Attach files"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* ✨ Improve Button */}
              <ImproveEnglishButton
                text={body}
                onImproved={improved => setBody(improved)}
                context="Official University Email Message"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || (!body && !subject)}
                className="btn-secondary py-1.5 px-3 text-xs font-medium flex items-center gap-1.5"
                title="Save Draft in Gmail"
              >
                {savingDraft ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Discard message"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
