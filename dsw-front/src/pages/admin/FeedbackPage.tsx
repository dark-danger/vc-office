import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import { MessageSquareHeart, Plus, ExternalLink, BarChart2, Trash2, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Question {
  id?: number;
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
  is_active: boolean;
  questions: Question[];
  response_count: number;
}

interface AnalyticsData {
  form_id: number;
  title: string;
  total_responses: number;
  analytics: Array<{
    question_id: number;
    question_text: string;
    question_type: string;
    total_answers: number;
    chart_data: Array<{ option: string; count: number; percentage: number }>;
  }>;
}

export const FeedbackPage: React.FC = () => {
  const [forms, setForms] = useState<FeedbackFormItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [analyticsModalData, setAnalyticsModalData] = useState<AnalyticsData | null>(null);

  // Form Creation State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requireId, setRequireId] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      question_text: 'How satisfied were you with the event logistics?',
      question_type: 'single_choice',
      options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'],
      required: true
    }
  ]);

  const fetchFeedbackForms = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<FeedbackFormItem[]>('/feedback');
      setForms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackForms();
  }, []);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: `New Survey Question #${questions.length + 1}`,
        question_type: 'single_choice',
        options: ['Option 1', 'Option 2', 'Option 3'],
        required: true
      }
    ]);
  };

  const handleCreateFeedbackForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/feedback', 'POST', {
        title,
        description,
        require_identification: requireId,
        questions
      });
      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      fetchFeedbackForms();
    } catch (err: any) {
      alert(err.message || 'Failed to create feedback form');
    }
  };

  const handleViewResults = async (formId: number) => {
    try {
      const data = await apiRequest<AnalyticsData>(`/feedback/${formId}/results`);
      setAnalyticsModalData(data);
    } catch (e) {
      alert('Failed to load feedback analytics');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Feedback Form Builder & Visual Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">Design single/multi-choice feedback surveys and visualize real-time chart breakdowns.</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Create Feedback Form
        </button>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-8 text-center text-[var(--text-muted)] glass-panel">Loading feedback forms...</div>
        ) : forms.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-[var(--text-muted)] glass-panel">No feedback forms built yet.</div>
        ) : (
          forms.map(f => (
            <div key={f.id} className="glass-panel p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-500/30">
                    {f.questions.length} Questions
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {f.response_count} Responses Collected
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-3">{f.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{f.description || 'No description provided.'}</p>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <a
                  href={`/feedback/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-2 px-3 flex-1 justify-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-500" /> Public Survey Link
                </a>
                <button
                  onClick={() => handleViewResults(f.id)}
                  className="btn-primary text-xs py-2 px-3 flex-1 justify-center"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-pink-400" /> Visual Results & Charts
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel p-4 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <MessageSquareHeart className="w-5 h-5 text-pink-500 shrink-0" /> Build Survey Feedback Form
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFeedbackForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Survey Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event Experience Feedback" className="glass-input text-xs" />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Instructions / Description</label>
                  <ImproveEnglishButton text={description} onImproved={setDescription} context="Feedback survey instructions and purpose" />
                </div>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide short survey instructions..." className="glass-input text-xs" />
              </div>

              {/* Questions Builder */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Survey Questions ({questions.length})</label>
                  <button type="button" onClick={handleAddQuestion} className="text-xs text-blue-500 hover:underline font-bold">
                    + Add Question
                  </button>
                </div>

                <div className="space-y-3">
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="p-3.5 sm:p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <input
                          type="text"
                          value={q.question_text}
                          onChange={e => {
                            const updated = [...questions];
                            updated[qIdx].question_text = e.target.value;
                            setQuestions(updated);
                          }}
                          placeholder="Question Title..."
                          className="glass-input text-xs flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={q.question_type}
                            onChange={e => {
                              const updated = [...questions];
                              updated[qIdx].question_type = e.target.value as any;
                              setQuestions(updated);
                            }}
                            className="glass-input text-xs flex-1 sm:w-44"
                          >
                            <option value="single_choice">Single Choice (Radio)</option>
                            <option value="multi_choice">Multi Choice (Checkbox)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setQuestions(questions.filter((_, idx) => idx !== qIdx))}
                            className="text-[var(--text-muted)] hover:text-rose-500 p-1 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="pl-3 border-l-2 border-[var(--panel-border)] space-y-1.5">
                        <label className="block text-[11px] font-medium text-[var(--text-muted)]">Options (Comma-separated)</label>
                        <input
                          type="text"
                          value={q.options.join(', ')}
                          onChange={e => {
                            const updated = [...questions];
                            updated[qIdx].options = e.target.value.split(',').map(s => s.trim());
                            setQuestions(updated);
                          }}
                          placeholder="Option A, Option B, Option C"
                          className="glass-input text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary text-xs w-full sm:w-auto">Cancel</button>
                <button type="submit" className="btn-primary text-xs w-full sm:w-auto">Publish Feedback Form</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visual Analytics Modal */}
      {analyticsModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl glass-panel p-4 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{analyticsModalData.title} — Analytics</h3>
                <p className="text-xs text-[var(--text-secondary)]">Total Submissions Received: <strong className="text-emerald-500">{analyticsModalData.total_responses}</strong></p>
              </div>
              <button onClick={() => setAnalyticsModalData(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {analyticsModalData.analytics.map((q, idx) => (
                <div key={q.question_id} className="p-4 sm:p-5 bg-[var(--card-bg-to)] rounded-2xl border border-[var(--panel-border)] space-y-4">
                  <h4 className="font-bold text-[var(--text-primary)] text-sm">
                    Q{idx + 1}. {q.question_text} <span className="text-xs text-[var(--text-muted)] font-normal">({q.question_type})</span>
                  </h4>

                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={q.chart_data} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                        <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis dataKey="option" type="category" stroke="var(--text-primary)" fontSize={11} width={100} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                        <Bar dataKey="count" fill="#ec4899" radius={[0, 8, 8, 0]}>
                          {q.chart_data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][index % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
