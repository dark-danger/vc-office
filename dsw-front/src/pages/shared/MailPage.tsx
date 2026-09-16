import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth, User } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { MailSetupScreen } from '../../components/mail/MailSetupScreen';
import { MailComposeModal, ComposeInitialData } from '../../components/mail/MailComposeModal';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  Mail, Inbox, Star, Send, FileText, Trash2, AlertOctagon,
  Plus, Search, RefreshCw, ChevronLeft, ChevronRight, CheckSquare,
  Square, Star as StarFilled, Paperclip, Reply, ReplyAll, Forward,
  MoreVertical, ShieldCheck, Lock, ArrowLeft, Loader2, Download,
  CheckCircle2, XCircle, Clock, Tag, ExternalLink, CornerDownLeft
} from 'lucide-react';

interface EmailSummary {
  id: string;
  thread_id: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  internal_date: number;
  is_unread: boolean;
  is_starred: boolean;
  labels: string[];
}

interface EmailDetail extends EmailSummary {
  cc?: string;
  bcc?: string;
  message_id_header?: string;
  in_reply_to?: string;
  references?: string;
  body_text?: string;
  body_html: string;
  attachments?: Array<{
    attachment_id: string;
    filename: string;
    mime_type: string;
    size: number;
  }>;
  is_trash?: boolean;
  is_spam?: boolean;
}

export const MailPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const mailStatusParam = searchParams.get('mail_status');
  const mailErrorParam = searchParams.get('mail_error');

  // Connection & Auth State
  const [connected, setConnected] = useState<boolean | null>(null);
  const [connectedEmail, setConnectedEmail] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(mailErrorParam || null);

  // Mailbox Navigation State
  const [activeFolder, setActiveFolder] = useState<string>('inbox');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  
  // Messages & Pagination
  const [messages, setMessages] = useState<EmailSummary[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [pageTokenStack, setPageTokenStack] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Selection & Active Detail
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [activeMessageDetail, setActiveMessageDetail] = useState<EmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeInitialData, setComposeInitialData] = useState<ComposeInitialData | null>(null);

  // Quick Inline Reply in Detail View
  const [quickReplyBody, setQuickReplyBody] = useState<string>('');
  const [sendingQuickReply, setSendingQuickReply] = useState<boolean>(false);

  // 1. Fetch OAuth & Connection Status
  const fetchStatus = async () => {
    try {
      const data = await apiRequest<{
        connected: boolean;
        email?: string;
        status: string;
        unread_count: number;
        message?: string;
      }>('/email/status', 'GET', undefined, false, true);

      setConnected(data.connected);
      if (data.connected && data.email) {
        setConnectedEmail(data.email);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (e: any) {
      console.error('Failed to fetch mail status:', e);
      setConnected(false);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // 2. Fetch Messages for Current Folder / Search / Page
  const fetchMessages = async (folder: string, q: string, token?: string | null) => {
    setLoadingMessages(true);
    try {
      let url = `/email/messages?folder=${folder}&max_results=20`;
      if (q.trim()) url += `&q=${encodeURIComponent(q.trim())}`;
      if (token) url += `&page_token=${encodeURIComponent(token)}`;

      const res = await apiRequest<{
        messages: EmailSummary[];
        next_page_token: string | null;
        result_size_estimate: number;
        folder: string;
      }>(url, 'GET', undefined, false, true);

      setMessages(res.messages || []);
      setNextPageToken(res.next_page_token || null);
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error('Fetch Messages Error:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (connected) {
      fetchMessages(activeFolder, searchQuery, null);
      setPageTokenStack([]);
      setCurrentPageIndex(0);
      setActiveMessageId(null);
      setActiveMessageDetail(null);
    }
  }, [connected, activeFolder, searchQuery]);

  // 3. Open & Fetch Message Detail
  const handleOpenMessage = async (msgId: string) => {
    setActiveMessageId(msgId);
    setLoadingDetail(true);
    setQuickReplyBody('');
    try {
      const detail = await apiRequest<EmailDetail>(`/email/messages/${msgId}`, 'GET', undefined, false, true);
      setActiveMessageDetail(detail);

      // Update local unread state
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, is_unread: false } : m))
      );
      if (unreadCount > 0) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error fetching email detail:', err);
      alert('Failed to load email message content.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // 4. Folder Change
  const handleFolderSelect = (folderKey: string) => {
    setActiveFolder(folderKey);
    setSearchQuery('');
    setSearchInput('');
  };

  // 5. Search Trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  // 6. Pagination Handlers
  const handleNextPage = () => {
    if (!nextPageToken) return;
    const newStack = [...pageTokenStack, nextPageToken];
    setPageTokenStack(newStack);
    setCurrentPageIndex(prev => prev + 1);
    fetchMessages(activeFolder, searchQuery, nextPageToken);
  };

  const handlePrevPage = () => {
    if (currentPageIndex === 0) return;
    const newIndex = currentPageIndex - 1;
    const prevToken = newIndex === 0 ? null : pageTokenStack[newIndex - 1];
    setPageTokenStack(prev => prev.slice(0, newIndex));
    setCurrentPageIndex(newIndex);
    fetchMessages(activeFolder, searchQuery, prevToken);
  };

  // 7. Star Toggle
  const handleToggleStar = async (e: React.MouseEvent, msgId: string, currentStarred: boolean) => {
    e.stopPropagation();
    const newStarred = !currentStarred;

    // Optimistic update
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, is_starred: newStarred } : m))
    );
    if (activeMessageDetail && activeMessageDetail.id === msgId) {
      setActiveMessageDetail({ ...activeMessageDetail, is_starred: newStarred });
    }

    try {
      await apiRequest(`/email/messages/${msgId}/star`, 'POST', { is_starred: newStarred });
    } catch (err) {
      console.error('Toggle Star Error:', err);
    }
  };

  // 8. Delete / Trash Message
  const handleTrashMessage = async (msgId: string) => {
    try {
      await apiRequest(`/email/messages/${msgId}/trash`, 'POST', { trash: true });
      setMessages(prev => prev.filter(m => m.id !== msgId));
      if (activeMessageId === msgId) {
        setActiveMessageId(null);
        setActiveMessageDetail(null);
      }
    } catch (err: any) {
      alert('Failed to move message to Trash.');
    }
  };

  // 9. Mark Read / Unread
  const handleToggleRead = async (msgId: string, markRead: boolean) => {
    try {
      await apiRequest(`/email/messages/${msgId}/read`, 'POST', { mark_as_read: markRead });
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, is_unread: !markRead } : m))
      );
      if (activeMessageDetail && activeMessageDetail.id === msgId) {
        setActiveMessageDetail({ ...activeMessageDetail, is_unread: !markRead });
      }
      setUnreadCount(prev => (markRead ? Math.max(0, prev - 1) : prev + 1));
    } catch (err) {
      console.error(err);
    }
  };

  // 10. Disconnect Account
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your university Google mailbox?')) return;
    try {
      await apiRequest('/email/disconnect', 'POST');
      setConnected(false);
      setConnectedEmail('');
      setMessages([]);
      setActiveMessageDetail(null);
    } catch (e: any) {
      alert(e.message || 'Failed to disconnect account.');
    }
  };

  // 11. Compose Trigger with Actions (New, Reply, Reply All, Forward)
  const handleNewCompose = () => {
    setComposeInitialData(null);
    setIsComposeOpen(true);
  };

  const handleReply = (detail: EmailDetail, isReplyAll: boolean = false) => {
    const fromEmail = parseSenderEmail(detail.from);
    const toRecipients = [fromEmail].filter(Boolean);
    let ccRecipients: string[] = [];

    if (isReplyAll && detail.cc) {
      const extra = detail.cc
        .split(/[,;\s]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e && e !== user?.email?.toLowerCase() && e !== fromEmail);
      ccRecipients = Array.from(new Set(extra));
    }

    const subjectPrefix = detail.subject.toLowerCase().startsWith('re:') ? '' : 'Re: ';
    const quotedBody = `\n\n----------------------------------------\nOn ${detail.date}, ${detail.from} wrote:\n\n${detail.body_text || ''}`;

    setComposeInitialData({
      to: toRecipients,
      cc: ccRecipients,
      subject: `${subjectPrefix}${detail.subject}`,
      body_html: quotedBody,
      in_reply_to: detail.message_id_header || undefined,
      references: detail.message_id_header || detail.references || undefined,
      thread_id: detail.thread_id
    });
    setIsComposeOpen(true);
  };

  const handleForward = (detail: EmailDetail) => {
    const subjectPrefix = detail.subject.toLowerCase().startsWith('fwd:') ? '' : 'Fwd: ';
    const fwdBody = `\n\n---------- Forwarded message ---------\nFrom: ${detail.from}\nDate: ${detail.date}\nSubject: ${detail.subject}\nTo: ${detail.to}\n\n${detail.body_text || ''}`;

    setComposeInitialData({
      to: [],
      subject: `${subjectPrefix}${detail.subject}`,
      body_html: fwdBody
    });
    setIsComposeOpen(true);
  };

  // Quick Inline Reply Send
  const handleSendQuickReply = async () => {
    if (!activeMessageDetail || !quickReplyBody.trim()) return;
    setSendingQuickReply(true);

    const fromEmail = parseSenderEmail(activeMessageDetail.from);
    try {
      await apiRequest('/email/send', 'POST', {
        to: [fromEmail],
        subject: activeMessageDetail.subject.toLowerCase().startsWith('re:')
          ? activeMessageDetail.subject
          : `Re: ${activeMessageDetail.subject}`,
        body_html: quickReplyBody,
        in_reply_to: activeMessageDetail.message_id_header || undefined,
        references: activeMessageDetail.message_id_header || activeMessageDetail.references || undefined,
        thread_id: activeMessageDetail.thread_id
      });
      setQuickReplyBody('');
      alert('Reply sent successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to send quick reply.');
    } finally {
      setSendingQuickReply(false);
    }
  };

  // Helper parser
  const parseSenderName = (fromHeader: string) => {
    if (!fromHeader) return 'Unknown';
    const match = fromHeader.match(/^(.*?)\s*<.*?>$/);
    return match ? match[1].replace(/["']/g, '').trim() : fromHeader.split('@')[0];
  };

  const parseSenderEmail = (fromHeader: string) => {
    if (!fromHeader) return '';
    const match = fromHeader.match(/<([^>]+)>/);
    return match ? match[1].trim().toLowerCase() : fromHeader.trim().toLowerCase();
  };

  const formatEmailDate = (dateStr: string, internalDate: number) => {
    if (!dateStr && !internalDate) return '';
    const d = internalDate ? new Date(internalDate) : new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // 12. Download Attachment
  const handleDownloadAttachment = (msgId: string, attId: string, filename: string) => {
    const token = localStorage.getItem('dsw_token');
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://dsw-07gj.onrender.com/api';
    const url = `${apiBase}/email/messages/${msgId}/attachments/${attId}?filename=${encodeURIComponent(filename)}`;
    
    // Trigger download with auth header via fetch
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(err => alert('Failed to download attachment.'));
  };

  if (initialLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-semibold text-[var(--text-secondary)]">Connecting to University Mailbox...</p>
      </div>
    );
  }

  // If Not Connected, show OAuth Setup Card
  if (!connected) {
    return (
      <MailSetupScreen
        user={user}
        errorMessage={errorMessage}
        onRefreshStatus={fetchStatus}
      />
    );
  }

  const foldersList = [
    { key: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4 text-emerald-500" />, badge: unreadCount },
    { key: 'starred', label: 'Starred', icon: <Star className="w-4 h-4 text-amber-400" /> },
    { key: 'sent', label: 'Sent', icon: <Send className="w-4 h-4 text-blue-400" /> },
    { key: 'drafts', label: 'Drafts', icon: <FileText className="w-4 h-4 text-purple-400" /> },
    { key: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4 text-rose-400" /> },
    { key: 'spam', label: 'Spam', icon: <AlertOctagon className="w-4 h-4 text-orange-400" /> },
  ];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col glass-panel border border-[var(--panel-border)] rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-150">
      {/* ================= 1. TOP HEADER & SEARCH BAR ================= */}
      <div className="h-16 px-4 md:px-6 border-b border-[var(--panel-border)] bg-[var(--card-bg-to)] flex items-center justify-between gap-4">
        {/* Logo & Section Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              University Mail <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">Live</span>
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">{connectedEmail}</p>
          </div>
        </div>

        {/* Global Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={`Search ${activeFolder} mail or query...`}
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--panel-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchMessages(activeFolder, searchQuery, null)}
            className="p-2 text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors"
            title="Refresh Mailbox"
          >
            <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
          <button
            onClick={handleNewCompose}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-primary text-xs font-bold shadow-xs"
            title="Compose Email"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Compose</span>
          </button>
          <button
            onClick={handleDisconnect}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
            title="Disconnect Google Account"
          >
            <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* ================= 2. MAIN 3-PANE WORKSPACE ================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANE A: FOLDERS & NAVIGATION (LEFT) - Hidden on mobile in favor of horizontal pills */}
        <div className="hidden md:flex w-52 md:w-60 border-r border-[var(--panel-border)] bg-[var(--panel-bg)] flex-col shrink-0">
          {/* Compose Button */}
          <div className="p-4">
            <button
              onClick={handleNewCompose}
              className="w-full btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Compose</span>
            </button>
          </div>

          {/* Folder Navigation Items */}
          <div className="flex-1 px-3 space-y-1 overflow-y-auto">
            {foldersList.map(folder => {
              const isActive = activeFolder === folder.key;
              return (
                <button
                  key={folder.key}
                  onClick={() => handleFolderSelect(folder.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {folder.icon}
                    <span>{folder.label}</span>
                  </div>
                  {folder.badge && folder.badge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                      {folder.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* User Account Info Bar at bottom of folder list */}
          <div className="p-3.5 border-t border-[var(--panel-border)] bg-[var(--card-bg-to)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-mono text-[var(--text-muted)] truncate">{connectedEmail}</span>
            </div>
          </div>
        </div>

        {/* PANE B: MESSAGES LIST (CENTER) */}
        <div
          className={`flex-1 flex flex-col border-r border-[var(--panel-border)] bg-[var(--panel-bg)] min-w-0 transition-all ${
            activeMessageId ? 'hidden lg:flex lg:max-w-md xl:max-w-lg' : 'flex'
          }`}
        >
          {/* Mobile Folder Selector Pills (Visible only on < md) */}
          <div className="md:hidden flex items-center gap-1.5 p-2.5 border-b border-[var(--panel-border)] bg-[var(--card-bg-to)] overflow-x-auto no-scrollbar shrink-0">
            {foldersList.map(folder => {
              const isActive = activeFolder === folder.key;
              return (
                <button
                  key={folder.key}
                  onClick={() => handleFolderSelect(folder.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold shadow-xs'
                      : 'bg-[var(--panel-bg)] text-[var(--text-secondary)] border border-[var(--panel-border)] hover:text-emerald-500'
                  }`}
                >
                  {folder.icon}
                  <span>{folder.label}</span>
                  {folder.badge && folder.badge > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500 text-white">
                      {folder.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* List Toolbar */}
          <div className="h-12 px-3 sm:px-4 border-b border-[var(--panel-border)] bg-[var(--card-bg-to)] flex items-center justify-between text-xs text-[var(--text-secondary)] gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => {
                  if (selectedIds.size === messages.length && messages.length > 0) {
                    setSelectedIds(new Set());
                  } else {
                    setSelectedIds(new Set(messages.map(m => m.id)));
                  }
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
                title="Select all"
              >
                {selectedIds.size === messages.length && messages.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>

              <span className="font-bold capitalize text-[var(--text-primary)] truncate text-xs">
                {activeFolder} {searchQuery ? `("${searchQuery}")` : ''}
              </span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-[var(--text-muted)]">
                Page {currentPageIndex + 1}
              </span>
              <button
                disabled={currentPageIndex === 0}
                onClick={handlePrevPage}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={!nextPageToken}
                onClick={handleNextPage}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--panel-border)]">
            {loadingMessages ? (
              <div className="p-12 text-center text-xs text-[var(--text-muted)] space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                <p>Loading {activeFolder} emails from Gmail...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center text-xs text-[var(--text-muted)] space-y-2">
                <Inbox className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-40" />
                <p className="font-semibold text-[var(--text-secondary)]">No messages in {activeFolder}</p>
                <p className="text-[11px]">Your mailbox is up to date.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isSelected = selectedIds.has(msg.id);
                const isActive = activeMessageId === msg.id;
                const senderName = parseSenderName(msg.from);

                return (
                  <div
                    key={msg.id}
                    onClick={() => handleOpenMessage(msg.id)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors relative ${
                      isActive
                        ? 'bg-emerald-500/10 border-l-3 border-l-emerald-500'
                        : msg.is_unread
                        ? 'bg-slate-100/70 dark:bg-slate-800/40 font-bold'
                        : 'hover:bg-[var(--card-bg-to)] font-normal text-[var(--text-secondary)]'
                    }`}
                  >
                    {/* Star Toggle */}
                    <button
                      type="button"
                      onClick={e => handleToggleStar(e, msg.id, msg.is_starred)}
                      className="text-[var(--text-muted)] hover:text-amber-400 shrink-0"
                    >
                      {msg.is_starred ? (
                        <StarFilled className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                    </button>

                    {/* Sender, Subject, Snippet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs truncate ${
                            msg.is_unread ? 'font-black text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'
                          }`}
                        >
                          {senderName}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                          {formatEmailDate(msg.date, msg.internal_date)}
                        </span>
                      </div>

                      <div className="text-xs truncate text-[var(--text-primary)] mt-0.5">
                        {msg.subject}
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                        {msg.snippet}
                      </p>
                    </div>

                    {/* Unread indicator dot */}
                    {msg.is_unread && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-xs shadow-emerald-500" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANE C: DETAIL VIEW (RIGHT) */}
        <div className={`flex-1 flex flex-col bg-[var(--panel-bg)] min-w-0 ${!activeMessageId ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
          {!activeMessageId ? (
            <div className="text-center p-8 text-[var(--text-muted)] space-y-3">
              <Mail className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-30" />
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Select an email to read</p>
              <p className="text-[11px] max-w-xs mx-auto">
                Click any message from your {activeFolder} on the left to view the complete body and attachments.
              </p>
            </div>
          ) : loadingDetail ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-xs text-[var(--text-muted)] space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
              <p>Loading email content securely from Gmail...</p>
            </div>
          ) : activeMessageDetail ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Detail Header & Action Toolbar */}
              <div className="p-4 border-b border-[var(--panel-border)] bg-[var(--card-bg-to)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveMessageId(null)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--panel-bg)] rounded-lg lg:hidden"
                    title="Back to list"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-sm font-bold text-[var(--text-primary)] truncate max-w-md">
                    {activeMessageDetail.subject}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <button
                    type="button"
                    onClick={() => handleReply(activeMessageDetail, false)}
                    className="p-1.5 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    title="Reply"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReply(activeMessageDetail, true)}
                    className="p-1.5 hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-colors"
                    title="Reply All"
                  >
                    <ReplyAll className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleForward(activeMessageDetail)}
                    className="p-1.5 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Forward"
                  >
                    <Forward className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTrashMessage(activeMessageDetail.id)}
                    className="p-1.5 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete to Trash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Header Metadata Box */}
              <div className="px-6 py-4 border-b border-[var(--panel-border)] bg-[var(--panel-bg)] space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-md">
                      {parseSenderName(activeMessageDetail.from)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <span>{parseSenderName(activeMessageDetail.from)}</span>
                        <span className="text-[11px] font-mono font-normal text-[var(--text-muted)]">
                          &lt;{parseSenderEmail(activeMessageDetail.from)}&gt;
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        to <span className="font-semibold text-[var(--text-secondary)]">{activeMessageDetail.to}</span>
                        {activeMessageDetail.cc && (
                          <span> • cc: <strong className="text-[var(--text-secondary)]">{activeMessageDetail.cc}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-[var(--text-muted)] font-mono shrink-0">
                    {activeMessageDetail.date}
                  </span>
                </div>
              </div>

              {/* Message HTML / Text Body Container */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div
                  className="prose dark:prose-invert max-w-none text-xs text-[var(--text-primary)] leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: activeMessageDetail.body_html }}
                />

                {/* Attachments Section */}
                {activeMessageDetail.attachments && activeMessageDetail.attachments.length > 0 && (
                  <div className="pt-6 border-t border-[var(--panel-border)] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                      <Paperclip className="w-4 h-4 text-emerald-500" />
                      <span>Attachments ({activeMessageDetail.attachments.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeMessageDetail.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] flex items-center justify-between gap-2 shadow-xs hover:border-emerald-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[var(--text-primary)] truncate">{att.filename}</div>
                              <div className="text-[10px] text-[var(--text-muted)] font-mono">
                                {Math.round(att.size / 1024)} KB
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(activeMessageDetail.id, att.attachment_id, att.filename)}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Download Attachment"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Reply Box */}
                <div className="pt-6 border-t border-[var(--panel-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Reply className="w-3.5 h-3.5 text-emerald-500" /> Quick Reply
                    </span>
                    <ImproveEnglishButton
                      text={quickReplyBody}
                      onImproved={improved => setQuickReplyBody(improved)}
                      context="Official Email Quick Reply"
                    />
                  </div>

                  <textarea
                    rows={3}
                    value={quickReplyBody}
                    onChange={e => setQuickReplyBody(e.target.value)}
                    placeholder={`Reply to ${parseSenderName(activeMessageDetail.from)}...`}
                    className="glass-input text-xs"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleReply(activeMessageDetail, false)}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      Open Full Editor
                    </button>
                    <button
                      type="button"
                      disabled={sendingQuickReply || !quickReplyBody.trim()}
                      onClick={handleSendQuickReply}
                      className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
                    >
                      {sendingQuickReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ================= 3. FLOATING COMPOSE MODAL ================= */}
      <MailComposeModal
        user={user}
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSent={() => {
          fetchMessages(activeFolder, searchQuery, null);
          alert('Email sent successfully via university Gmail account!');
        }}
        initialData={composeInitialData}
      />
    </div>
  );
};
