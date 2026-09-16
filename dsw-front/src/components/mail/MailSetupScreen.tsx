import React, { useState } from 'react';
import { Mail, ShieldCheck, Sparkles, AlertCircle, ArrowRight, Lock, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';

interface MailSetupScreenProps {
  user: User | null;
  errorMessage?: string | null;
  onRefreshStatus?: () => void;
}

export const MailSetupScreen: React.FC<MailSetupScreenProps> = ({
  user,
  errorMessage,
  onRefreshStatus
}) => {
  const [connecting, setConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(errorMessage || null);

  const handleConnect = async () => {
    setConnecting(true);
    setAuthError(null);
    try {
      const res = await apiRequest<{ auth_url: string }>('/email/connect');
      if (res && res.auth_url) {
        window.location.href = res.auth_url;
      } else {
        throw new Error('Failed to retrieve authorization URL from server.');
      }
    } catch (err: any) {
      console.error('OAuth Connect Error:', err);
      setAuthError(err.message || 'Could not initiate Google authorization. Please verify server settings.');
      setConnecting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="max-w-xl w-full glass-panel p-5 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden border border-emerald-500/20">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 text-center">
          {/* Main Icon */}
          <div className="w-16 h-16 sm:w-18 sm:h-18 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25 border border-white/20">
            <Mail className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Official University Email Hub
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Connect University Mailbox
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
              Connect your official <strong className="text-[var(--text-primary)]">@geetauniversity.edu.in</strong> Google Workspace account to read emails, compose replies, and send official notices directly from the portal.
            </p>
          </div>

          {/* User Account Pill */}
          <div className="p-3 sm:p-3.5 bg-[var(--card-bg-to)] rounded-2xl border border-[var(--panel-border)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">{user?.name}</div>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                  <Lock className="w-3 h-3 text-emerald-500 shrink-0" /> <span className="truncate">{user?.email}</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          {/* Features Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-[var(--panel-border)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Full Gmail Inbox & Folders</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-[var(--panel-border)]">
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
              <span>End-to-end Encrypted OAuth 2.0</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-[var(--panel-border)]">
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
              <span>AI English Improvement Engine</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-[var(--panel-border)]">
              <Mail className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Verified Official University Sender</span>
            </div>
          </div>

          {/* Error Message */}
          {authError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-left flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <strong>Authorization Note:</strong> {authError}
              </div>
            </div>
          )}

          {/* Connect Action Button */}
          <div className="pt-2 space-y-3">
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full btn-primary py-3 px-6 text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redirecting to Google Sign-In...</span>
                </>
              ) : (
                <>
                  <span>Connect University Google Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onRefreshStatus && (
              <button
                type="button"
                onClick={onRefreshStatus}
                className="text-xs text-[var(--text-muted)] hover:text-emerald-500 flex items-center justify-center gap-1.5 mx-auto font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Check Connection Status
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
