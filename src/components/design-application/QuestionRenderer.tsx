"use client";
import React, { useEffect, useState } from 'react';
import { ApplicationQuestion, ApplicationData } from './types';
import DemoChoiceGrid from './DemoChoiceGrid';
import OptionGrid from './OptionGrid';

interface QuestionRendererProps {
  question: ApplicationQuestion;
  value: string | File | string[] | undefined;
  updateApplicationData: (field: string, value: string | File | string[]) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, questionId: string) => Promise<string | undefined>;
  onFileRemove?: (questionId: string, fileIndex: number) => void;
  onKeyPress: (event: React.KeyboardEvent) => void;
  onTextareaKeyPress: (event: React.KeyboardEvent) => void;
  applicationId?: string;
  getPreviewUrls?: (questionId: string) => string[] | undefined;
  isUploading?: (questionId: string) => boolean;
}

function CustomQuestionFlow({ templateId, parentQuestionId, onUpdate, onFileUpload, onFileRemove, onKeyPress, onTextareaKeyPress, applicationId, getPreviewUrls, isUploading, initialAnswers }: {
  templateId: string;
  parentQuestionId?: string;
  onUpdate: (data: ApplicationData) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, questionId: string) => Promise<string | undefined>;
  onFileRemove?: (questionId: string, fileIndex: number) => void;
  onKeyPress: (event: React.KeyboardEvent) => void;
  onTextareaKeyPress: (event: React.KeyboardEvent) => void;
  applicationId?: string;
  getPreviewUrls?: (questionId: string) => string[] | undefined;
  isUploading?: (questionId: string) => boolean;
  initialAnswers?: ApplicationData;
}) {
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  // start with empty answers or seed from initialAnswers when available
  // cast to ApplicationData so we don't need to include unrelated defaults like email
  const [answers, setAnswers] = useState<ApplicationData>(initialAnswers ?? ({} as ApplicationData));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // if parent provides initialAnswers later, seed local state
    if (initialAnswers) setAnswers(initialAnswers);
  }, [initialAnswers]);

  useEffect(() => {
    let cancelled = false;
    async function fetchCustomQuestions() {
      try {
        const res = await fetch(`/api/custom-questions?templateId=${templateId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (!cancelled) setQuestions(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCustomQuestions();
    return () => { cancelled = true; };
  }, [templateId]);

  const updateCustomApplicationData = (field: string, value: string | File | string[]) => {
    const q = questions.find((qq) => String(qq.id) === String(field));
    const key = q && q.question_text ? q.question_text : field;
    // include an explicit flag so persisted custom payloads show the user selected a custom option
    const next = { ...answers, [key]: value, option: 'custom' } as ApplicationData;
    setAnswers(next);
    onUpdate(next);
    return next;
  };

  const handleFileUploadLocal = async (e: React.ChangeEvent<HTMLInputElement>, qid: string) => {
    if (!(e.target.files && e.target.files.length > 0)) return undefined;
    const namespaced = `${templateId}:${qid}`;
    const url = await onFileUpload(e, namespaced);
    if (url) {
      // update local state and get the next answers object (so we can persist using question_text keys)
      const next = updateCustomApplicationData(qid, url);
      try {
        if (applicationId && parentQuestionId) {
          const payload: any = {};
          // Persist the whole custom answers object under the parent question id.
          // This ensures keys are the human-readable question_text values, not numeric ids.
          payload[parentQuestionId] = JSON.stringify(next ?? { ...answers, [qid]: url });
          await fetch('/api/design-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: applicationId, answers: payload }) });
        }
      } catch (e) {
        console.warn('persist parent failed', e);
      }
    }
    return url;
  };

  if (loading) return <div>Loading custom questions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="custom-questions-container">
      {questions.map((q) => (
        <div key={q.id} className="form-group">
          <label className="form-label">{q.question_text}</label>
          {q.subtext && <p className="form-subtext">{q.subtext}</p>}
          <QuestionRenderer
            question={q}
            value={(answers[q.question_text as keyof typeof answers] as string) ?? (answers[q.id as unknown as keyof typeof answers] as string)}
            updateApplicationData={(f, v) => updateCustomApplicationData(f, v)}
            onFileUpload={(ev, id) => handleFileUploadLocal(ev, id)}
            onFileRemove={onFileRemove}
            onKeyPress={onKeyPress}
            onTextareaKeyPress={onTextareaKeyPress}
            applicationId={applicationId}
            getPreviewUrls={(sub) => getPreviewUrls?.(`${templateId}:${sub}`)}
            isUploading={(sub) => !!isUploading?.(`${templateId}:${sub}`)}
          />
        </div>
      ))}
    </div>
  );
}

export function QuestionRenderer(props: QuestionRendererProps) {
  const { question, value, updateApplicationData, onFileUpload, onFileRemove, onKeyPress, onTextareaKeyPress, applicationId, getPreviewUrls, isUploading } = props;
  const [isCustomizing, setCustomizing] = useState(() => {
    if (typeof value === 'string') {
      if (value === 'custom') return true;
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object';
      } catch (_) {
        return false;
      }
    }
    return false;
  });
  const PAGE_SIZE = 6;
  const [choicePageIdx, setChoicePageIdx] = useState(0);

  useEffect(() => { setChoicePageIdx(0); }, [question.option_items && question.option_items.length]);

  // Keep isCustomizing in sync when parent value changes (e.g., navigating back with saved custom answers)
  useEffect(() => {
    if (typeof value === 'string') {
      if (value === 'custom') {
        setCustomizing(true);
        return;
      }
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') {
          setCustomizing(true);
          return;
        }
      } catch (_) {
        // not JSON
      }
    }
    // If value is cleared or not custom, collapse the custom flow
    setCustomizing(false);
  }, [value]);

  if (!question) return null;

  switch (question.question_type) {
    case 'email':
      return <input type="email" value={typeof value === 'string' ? value : ''} onChange={(e) => updateApplicationData(question.id, e.target.value)} className="form-input" placeholder="your.email@example.com" required={question.is_required} onKeyPress={onKeyPress} />;
    case 'text':
      return <input type="text" value={typeof value === 'string' ? value : ''} onChange={(e) => updateApplicationData(question.id, e.target.value)} className="form-input" placeholder="Enter your answer..." required={question.is_required} onKeyPress={onKeyPress} />;
    case 'textarea':
      return <textarea value={typeof value === 'string' ? value : ''} onChange={(e) => updateApplicationData(question.id, e.target.value)} className="form-textarea" placeholder="Enter your answer..." rows={4} required={question.is_required} onKeyPress={onTextareaKeyPress} />;
    case 'multiple_choice': {
      const options = Array.isArray(question.options) ? question.options : [];
      const items = Array.isArray(question.option_items) ? question.option_items : [];
      if (items.length > 0) {
        const pageItems = items.slice(choicePageIdx * PAGE_SIZE, choicePageIdx * PAGE_SIZE + PAGE_SIZE);
        return (
          <>
            <div className="choice-grid three-cols mb-4">
              {pageItems.map((it) => {
                const itemVal = (it.id as string | undefined) ?? it.name;
                const isSelected = typeof value === 'string' && value === itemVal;
                return (
                  <button
                    key={(it.id ?? it.name) + it.name}
                    type="button"
                    className={`choice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => updateApplicationData(question.id, itemVal)}
                    aria-pressed={isSelected}
                  >
                    {it.image_url ? <img src={it.image_url} alt={it.name} className="choice-card-image" /> : null}
                    <div className="choice-card-name">{it.name}</div>
                  </button>
                );
              })}
              {question.is_customisable && (
                <button
                  type="button"
                  className={`choice-card ${(() => {
                    if (typeof value !== 'string') return '';
                    if (value === 'custom') return 'selected';
                    try { const p = JSON.parse(value); return p && typeof p === 'object' ? 'selected' : ''; } catch { return ''; }
                  })()}`}
                  onClick={() => { setCustomizing(true); updateApplicationData(question.id, 'custom'); }}
                  aria-pressed={(() => {
                    if (typeof value !== 'string') return false;
                    if (value === 'custom') return true;
                    try { const p = JSON.parse(value); return !!(p && typeof p === 'object'); } catch { return false; }
                  })()}
                >I have a different idea!</button>
              )}
            </div>
    {question.is_customisable && isCustomizing && question.custom_template_id && (
              <div className="mt-4">
                <CustomQuestionFlow
                    key={`${question.id}:${question.custom_template_id}`}
                  templateId={question.custom_template_id}
                  parentQuestionId={question.id}
      initialAnswers={typeof value === 'string' ? (() => { try { return JSON.parse(value); } catch (_) { return undefined; } })() : undefined}
                  // Persist the custom answers under the parent question id. The internal keys
                  // will use the human-readable question_text values (see updateCustomApplicationData)
                  onUpdate={(d) => updateApplicationData(question.id, JSON.stringify(d))}
                  onFileUpload={onFileUpload}
                  onFileRemove={onFileRemove}
                  onKeyPress={onKeyPress}
                  onTextareaKeyPress={onTextareaKeyPress}
                  applicationId={applicationId}
                  getPreviewUrls={getPreviewUrls}
                  isUploading={isUploading}
                />
              </div>
            )}
          </>
        );
      }
      if (options.length === 0) {
        return <DemoChoiceGrid slug={question.id} selectedValue={typeof value === 'string' ? value : undefined} onSelect={(val) => updateApplicationData(question.id, val)} />;
      }
      return <OptionGrid slug={question.id} options={options} selectedValue={typeof value === 'string' ? value : undefined} onSelect={(val) => updateApplicationData(question.id, val)} question={question} setCustomizing={setCustomizing} isCustomizing={isCustomizing} />;
    }
    case 'checkboxes': {
      const options = Array.isArray(question.options) ? question.options : [];
      const selected = Array.isArray(value) ? value as string[] : [];
      const toggle = (v: string) => { const next = selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]; updateApplicationData(question.id, next); };
      return (
        <div className="checkbox-group">
          {options.map((opt) => (
            <label key={opt} className="checkbox-option"><input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />{opt}</label>
          ))}
        </div>
      );
    }
    case 'file_upload': {
      const previews = getPreviewUrls?.(question.id) || [];
      const uploading = isUploading?.(question.id) || false;
      return (
        <>
          <div className="upload-control">
            <label className={`upload-box ${uploading ? 'uploading' : ''}`}>
              <input type="file" onChange={(e) => onFileUpload(e, question.id)} accept="image/*" hidden disabled={uploading} />
              <div className="upload-box-inner">{uploading ? 'Uploading...' : 'Choose file'}</div>
            </label>
          </div>
          {previews.length > 0 && (
            <div className="preview-grid">{previews.map((p, i) => <img key={i} src={p} alt={`preview-${i}`} className="preview-image" />)}</div>
          )}
        </>
      );
    }
    default:
      return <input type="text" value={typeof value === 'string' ? value : ''} onChange={(e) => updateApplicationData(question.id, e.target.value)} className="form-input" placeholder="Enter your answer..." required={question.is_required} onKeyPress={onKeyPress} />;
  }
}
  // end of QuestionRenderer


