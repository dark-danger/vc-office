import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface ImproveEnglishButtonProps {
  text: string;
  onImproved: (improvedText: string) => void;
  context?: string;
  size?: 'sm' | 'xs';
  disabled?: boolean;
  className?: string;
}

// Client-side cache to instantly return previously improved text variations
const clientImprovementCache = new Map<string, string>();

export const ImproveEnglishButton: React.FC<ImproveEnglishButtonProps> = ({
  text,
  onImproved,
  context,
  size = 'xs',
  disabled = false,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastClickRef = useRef<number>(0);

  const handleImprove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmed = (text || '').trim();
    if (!trimmed) {
      return;
    }

    // Debounce / Cooldown: prevent multiple rapid clicks within 1200ms
    const now = Date.now();
    if (now - lastClickRef.current < 1200 || loading) {
      return;
    }
    lastClickRef.current = now;

    const cacheKey = `${context || ''}:::${trimmed}`;

    // Check client-side instant cache
    if (clientImprovementCache.has(cacheKey)) {
      const cached = clientImprovementCache.get(cacheKey)!;
      onImproved(cached);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      return;
    }

    setLoading(true);
    setSuccess(false);
    setErrorMessage(null);

    try {
      const res = await apiRequest<{ original_text: string; improved_text: string }>(
        '/ai/improve-english',
        'POST',
        {
          text: trimmed,
          context: context || undefined,
        }
      );

      if (res && res.improved_text) {
        clientImprovementCache.set(cacheKey, res.improved_text);
        onImproved(res.improved_text);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err: any) {
      console.warn('AI improvement fallback triggered:', err);
      // Inline gentle status instead of disruptive alert modal
      setErrorMessage(err.message || 'Retry');
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const isTextEmpty = !text || text.trim().length === 0;

  return (
    <button
      type="button"
      onClick={handleImprove}
      disabled={disabled || loading || isTextEmpty}
      title={
        isTextEmpty
          ? 'Enter text to enable AI improvement'
          : errorMessage
          ? `Status: ${errorMessage}`
          : 'Refine grammar, spelling, and polish phrasing using Gemini AI'
      }
      className={`inline-flex items-center gap-1.5 font-semibold transition-all rounded-lg shadow-2xs select-none ${
        size === 'xs' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
      } ${
        loading
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-wait'
          : success
          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
          : errorMessage
          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
          : isTextEmpty || disabled
          ? 'opacity-40 cursor-not-allowed bg-[var(--card-bg-to)] text-[var(--text-muted)] border border-[var(--panel-border)]'
          : 'bg-gradient-to-r from-purple-500/15 to-indigo-500/15 hover:from-purple-500/25 hover:to-indigo-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 hover:border-purple-500/50 hover:scale-[1.02] active:scale-[0.98]'
      } ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
          <span>Polishing...</span>
        </>
      ) : success ? (
        <>
          <Check className="w-3 h-3 text-emerald-500" />
          <span>Polished!</span>
        </>
      ) : errorMessage ? (
        <>
          <AlertCircle className="w-3 h-3 text-amber-500" />
          <span>{errorMessage.length > 12 ? 'Retry' : errorMessage}</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" />
          <span>Improve</span>
        </>
      )}
    </button>
  );
};
