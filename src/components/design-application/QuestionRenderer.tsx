"use client";
import React, { useEffect, useState } from 'react';
import { ApplicationQuestion, ApplicationData } from './types';
import DemoChoiceGrid from './DemoChoiceGrid';
import OptionGrid from './OptionGrid';
import AIInspiration from './AIInspiration';

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
  // Safety check to prevent hydration issues
  if (!templateId) {
    return <div>Loading...</div>;
  }
  
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
      {questions.map((q) => {
        if (!q) return null; // Safety check
        return (
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
        );
      })}
    </div>
  );
}

export function QuestionRenderer({ question, value, updateApplicationData, onFileUpload, onFileRemove, onKeyPress, onTextareaKeyPress, applicationId, getPreviewUrls, isUploading }: QuestionRendererProps) {
  // Safety check to ensure value is never null/undefined for checkbox questions
  if (question.question_type === 'checkboxes' && !Array.isArray(value)) {
    console.warn('QuestionRenderer: Checkbox question received non-array value, fixing:', { questionId: question.id, value });
    // Return early with a safe fallback
    return (
      <div className="form-error">
        <p>Error loading question options. Please refresh the page.</p>
      </div>
    );
  }

  // Safety check for other question types
  if (value === null || value === undefined) {
    console.warn('QuestionRenderer: Question received null/undefined value, fixing:', { questionId: question.id, value });
    // For non-checkbox questions, we can continue with empty string
  }

  const [choicePageIdx, setChoicePageIdx] = useState(0);
  const [isCustomizing, setCustomizing] = useState(() => {
    // Initialize isCustomizing based on the current value
    if (typeof value === 'string') {
      if (value === 'custom') return true;
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object';
      } catch (_) {
        // not JSON
      }
    }
    return false;
  });
  const PAGE_SIZE = 6;

  // Reset paging when the available option sets change (either option_items or options)
  useEffect(() => { 
    setChoicePageIdx(0); 
  }, [question.option_items?.length ?? 0, question.options?.length ?? 0]);

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

  const handleAIInspiration = (text: string) => {
    updateApplicationData(question.id, text);
  };

  switch (question.question_type) {
    case 'email':
      return <input type="email" value={typeof value === 'string' ? value : ''} onChange={(e) => updateApplicationData(question.id, e.target.value)} className="form-input" placeholder="your.email@example.com" required={question.is_required} onKeyPress={onKeyPress} />;
    case 'text':
      return <input type="text" value={typeof value === 'string' ? value : ''} onChange={(e) => updateApplicationData(question.id, e.target.value)} className="form-input" placeholder="Enter your answer..." required={question.is_required} onKeyPress={onKeyPress} />;
    case 'textarea': {
      // Show AI inspiration for textarea fields that support it
      console.log('🔍 Question AI generation check:', {
        questionId: question.id,
        questionText: question.question_text,
        is_ai_generated: question.is_ai_generated,
        applicationId: applicationId
      });
      
      if (question.is_ai_generated) {
        console.log('✅ Rendering AI Inspiration component for question:', question.id);
        return (
          <div className="textarea-with-ai">
            <div className="textarea-container" style={{ position: 'relative' }}>
              <textarea 
                value={typeof value === 'string' ? value : ''} 
                onChange={(e) => updateApplicationData(question.id, e.target.value)} 
                className={`form-textarea ${typeof value === 'string' && value.trim() ? 'ai-content-loaded' : ''}`}
                placeholder={typeof value === 'string' && value.trim() ? "AI-generated content loaded! Click ✨ for new inspiration or edit below..." : "Enter your answer..."}
                rows={4} 
                required={question.is_required} 
                onKeyPress={onTextareaKeyPress} 
              />
              <div className="ai-inspiration-inline">
                <AIInspiration
                  questionId={question.id}
                  requestId={applicationId}
                  onInspirationGenerated={handleAIInspiration}
                  isInline={true}
                />
              </div>
            </div>
          </div>
        );
      }

      // Regular textarea without AI
      return (
        <textarea 
          value={typeof value === 'string' ? value : ''} 
          onChange={(e) => updateApplicationData(question.id, e.target.value)} 
          className="form-textarea" 
          placeholder="Enter your answer..." 
          rows={4} 
          required={question.is_required} 
          onKeyPress={onTextareaKeyPress} 
        />
      );
    }
    case 'multiple_choice': {
      const options = Array.isArray(question.options) ? question.options : [];
      const items = Array.isArray(question.option_items) ? question.option_items : [];
      if (items && items.length > 0) {
        const pageItems = items.slice(choicePageIdx * PAGE_SIZE, choicePageIdx * PAGE_SIZE + PAGE_SIZE);
        return (
          <>
            <div className="choice-grid three-cols mb-4">
              {pageItems.map((it) => {
                if (!it) return null; // Safety check
                const itemVal = (it.id as string | undefined) ?? it.name;
                const isSelected = typeof value === 'string' && value === itemVal;
                return (
                  <button
                    key={(it.id ?? it.name) + it.name}
                    type="button"
                    className={`choice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => updateApplicationData(question.id, itemVal)}
                    aria-pressed={isSelected ? "true" : "false"}
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
                    if (typeof value !== 'string') return "false";
                    if (value === 'custom') return "true";
                    try { const p = JSON.parse(value); return p && typeof p === 'object' ? "true" : "false"; } catch { return "false"; }
                  })()}
                >I have a different idea!</button>
              )}
            </div>
            {/* simple pagination for option_items */}
              {items && items.length > PAGE_SIZE && (
                <div className="pagination-controls mt-3">
                  <button type="button" className="btn-page" onClick={() => setChoicePageIdx(Math.max(0, choicePageIdx - 1))} disabled={choicePageIdx === 0}>Prev</button>
                  <span className="page-indicator">{choicePageIdx + 1} / {Math.ceil(items.length / PAGE_SIZE)}</span>
                  <button type="button" className="btn-page" onClick={() => setChoicePageIdx(Math.min(Math.ceil(items.length / PAGE_SIZE) - 1, choicePageIdx + 1))} disabled={choicePageIdx >= Math.ceil(items.length / PAGE_SIZE) - 1}>Next</button>
                </div>
              )}
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
      if (options && options.length === 0) {
        return <DemoChoiceGrid slug={question.id} selectedValue={typeof value === 'string' ? value : undefined} onSelect={(val) => updateApplicationData(question.id, val)} />;
      }
      return <OptionGrid slug={question.id} options={options || []} selectedValue={typeof value === 'string' ? value : undefined} onSelect={(val) => updateApplicationData(question.id, val)} question={question} setCustomizing={setCustomizing} isCustomizing={isCustomizing} />;
    }
    case 'checkboxes': {
      const options = Array.isArray(question.options) ? question.options : [];
      // Ensure selected is always an array, even if value is null/undefined
      const selected = Array.isArray(value) ? value as string[] : [];
      
      // Add logging for debugging
      if (!Array.isArray(value)) {
        console.warn('QuestionRenderer: Checkbox value is not an array:', value, 'Fixing to empty array');
      }
      
      const toggle = (v: string) => { 
        // Safety check to ensure selected is an array
        if (!Array.isArray(selected)) {
          console.error('QuestionRenderer: selected is not an array in toggle function:', selected);
          return; 
        }
        
        // Safety check for the value parameter
        if (!v || typeof v !== 'string') {
          console.error('QuestionRenderer: Invalid value in toggle function:', v);
          return;
        }
        
        const next = selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]; 
        updateApplicationData(question.id, next); 
      };
      // paginate checkbox options when there are many
      const pageOptions = (options || []).slice(choicePageIdx * PAGE_SIZE, choicePageIdx * PAGE_SIZE + PAGE_SIZE);
      return (
        <>
          <div className="checkbox-group">
            {pageOptions.map((opt) => {
              if (!opt) return null; // Safety check
              return (
                <label key={opt} className="checkbox-option">
                  <input type="checkbox" checked={Array.isArray(selected) && selected.includes(opt)} onChange={() => toggle(opt)} />
                  {opt}
                </label>
              );
            })}
          </div>
          {options && options.length > PAGE_SIZE && (
            <div className="pagination-controls mt-3">
              <button type="button" className="btn-page" onClick={() => setChoicePageIdx(Math.max(0, choicePageIdx - 1))} disabled={choicePageIdx === 0}>Prev</button>
              <span className="page-indicator">{choicePageIdx + 1} / {Math.ceil(options.length / PAGE_SIZE)}</span>
              <button type="button" className="btn-page" onClick={() => setChoicePageIdx(Math.min(Math.ceil(options.length / PAGE_SIZE) - 1, choicePageIdx + 1))} disabled={choicePageIdx >= Math.ceil(options.length / PAGE_SIZE) - 1}>Next</button>
            </div>
          )}
        </>
      );
    }
    case 'file_upload': {
      const previews = getPreviewUrls?.(question.id) || [];
      const uploading = isUploading?.(question.id) || false;
      
      // Handle soft delete for photos
      const handleRemovePhoto = (index: number) => {
        if (onFileRemove && typeof value === 'string') {
          // For single file uploads, clear the value
          if (typeof value === 'string') {
            updateApplicationData(question.id, '');
          }
          // Call the onFileRemove callback for cleanup
          onFileRemove(question.id, index);
        }
      };

      return (
        <>
          <div className="upload-control">
            <label className={`upload-box ${uploading ? 'uploading' : ''}`}>
              <input type="file" onChange={(e) => onFileUpload(e, question.id)} accept="image/*" hidden disabled={uploading} />
              <div className="upload-box-inner">{uploading ? 'Uploading...' : 'Choose file'}</div>
            </label>
          </div>
          {previews.length > 0 && (
            <div className="preview-grid">
              {previews.map((p, i) => (
                <div key={i} className="preview-container">
                  <img src={p} alt={`preview-${i}`} className="preview-image" />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={() => handleRemovePhoto(i)}
                    title="Remove photo"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      );
    }
    default:
      return <input type="text" value={typeof value === 'string' ? value : ''} onChange={(e) => updateApplicationData(question.id, e.target.value)} className="form-input" placeholder="Enter your answer..." required={question.is_required} onKeyPress={onKeyPress} />;
  }

  return null;
}
// end of QuestionRenderer


