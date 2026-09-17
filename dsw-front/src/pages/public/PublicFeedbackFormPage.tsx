import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { MessageSquareHeart, CheckCircle2, AlertCircle, Send } from 'lucide-react';

interface Question {
  id: number;
  question_text: string;
  question_type: 'single_choice' | 'multi_choice';
  options: string[];
  required: boolean;
}

interface FeedbackFormItem {
  id: number;
  title: string;
  description: string;
  require_identification: boolean;
  questions: Question[];
}

export const PublicFeedbackFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FeedbackFormItem | null>(null);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadForm() {
      if (!id) return;
      try {
        const data = await apiRequest<FeedbackFormItem>(`/feedback/public/${id}`);
        setForm(data);
      } catch (e: any) {
        setError(e.message || 'Feedback form not found or inactive');
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [id]);

  const handleSingleChoice = (qId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: [option] }));
  };

  const handleMultiChoice = (qId: number, option: string) => {
    const current = answers[qId] || [];
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    setAnswers(prev => ({ ...prev, [qId]: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);

    try {
      await apiRequest(`/feedback/public/${id}/submit`, 'POST', {
        respondent_type: 'anonymous',
        answers
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)] p-4">Loading survey...</div>;
  }

  if (error || !form) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4 py-8">
        <div className="glass-panel p-6 sm:p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Survey Unavailable</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-2">{error || 'Feedback form inactive.'}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4 py-8">
        <div className="glass-panel p-6 sm:p-8 max-w-md text-center space-y-4 my-auto">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Thank You for Your Feedback!</h2>
          <p className="text-xs text-[var(--text-secondary)]">Your valuable insights have been recorded for Vice Chancellor's Office quality improvements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] p-3.5 sm:p-6 md:p-8 relative overflow-x-hidden">
      <div className="w-full max-w-xl glass-panel p-5 sm:p-8 relative shadow-2xl space-y-5 sm:space-y-6 my-4 sm:my-auto">
        <div className="border-b border-[var(--panel-border)] pb-4">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
            Institutional Feedback Survey
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-2">{form.title}</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{form.description || 'Geeta University Vice Chancellor\'s Office'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {form.questions.map((q, idx) => (
            <div key={q.id} className="p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-3">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                {idx + 1}. {q.question_text} {q.required && <span className="text-rose-500">*</span>}
              </label>

              <div className="space-y-2 pl-1">
                {q.options.map(opt => {
                  const isChecked = (answers[q.id] || []).includes(opt);

                  return (
                    <label key={opt} className="flex items-center gap-3 text-xs text-[var(--text-secondary)] cursor-pointer p-2 rounded-lg hover:bg-emerald-500/5 transition-colors">
                      <input
                        type={q.question_type === 'single_choice' ? 'radio' : 'checkbox'}
                        name={`q_${q.id}`}
                        checked={isChecked}
                        onChange={() => q.question_type === 'single_choice' ? handleSingleChoice(q.id, opt) : handleMultiChoice(q.id, opt)}
                        className="w-4 h-4 accent-emerald-500 rounded"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary justify-center py-2.5"
          >
            {submitting ? 'Submitting Feedback...' : 'Submit Feedback'} <Send className="w-4 h-4 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};
