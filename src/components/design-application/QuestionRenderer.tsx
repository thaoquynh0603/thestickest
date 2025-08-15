import React, { useEffect, useState } from 'react';
import { ApplicationQuestion, ApplicationData } from './types';

interface QuestionRendererProps {
  question: ApplicationQuestion;
  value: string | File | string[] | undefined;
  updateApplicationData: (field: string, value: string | File | string[]) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, questionId: string) => void;
  onFileRemove?: (questionId: string, fileIndex: number) => void;
  onKeyPress: (event: React.KeyboardEvent) => void;
  onTextareaKeyPress: (event: React.KeyboardEvent) => void;
  applicationId?: string;
  getPreviewUrls?: (questionId: string) => string[] | undefined;
  isUploading?: (questionId: string) => boolean;
}

function CustomQuestionFlow({ templateId, onUpdate, onFileUpload, onFileRemove, onKeyPress, onTextareaKeyPress, applicationId, getPreviewUrls, isUploading }: {
  templateId: string;
  onUpdate: (data: ApplicationData) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, questionId: string) => void;
  onFileRemove?: (questionId: string, fileIndex: number) => void;
  onKeyPress: (event: React.KeyboardEvent) => void;
  onTextareaKeyPress: (event: React.KeyboardEvent) => void;
  applicationId?: string;
  getPreviewUrls?: (questionId: string) => string[] | undefined;
  isUploading?: (questionId: string) => boolean;
}) {
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  const [answers, setAnswers] = useState<ApplicationData>({ email: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomQuestions() {
      try {
        const response = await fetch(`/api/custom-questions?templateId=${templateId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch custom questions');
        }
        const data = await response.json();
        setQuestions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomQuestions();
  }, [templateId]);

  const updateCustomApplicationData = (field: string, value: string | File | string[]) => {
    const newAnswers = { ...answers, [field]: value };
    setAnswers(newAnswers);
    onUpdate(newAnswers);
  };

  const handleFileUploadLocal = (event: React.ChangeEvent<HTMLInputElement>, qid: string) => {
    // Mark this custom field as filled immediately so the parent considers this step answered
    if (event.target.files && event.target.files.length > 0) {
      const newAnswers = { ...answers, [qid]: 'uploaded' } as ApplicationData;
      setAnswers(newAnswers);
      onUpdate(newAnswers);
    }
    onFileUpload(event, qid);
  };

  if (loading) return <div>Loading custom questions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="custom-questions-container">
      {questions.map(q => (
        <div key={q.id} className="form-group">
          <label className="form-label">{q.question_text}</label>
          {q.subtext && <p className="form-subtext">{q.subtext}</p>}
          <QuestionRenderer
            question={q}
            value={answers[q.id]}
            updateApplicationData={updateCustomApplicationData}
            onFileUpload={(e, qid) => handleFileUploadLocal(e, qid)}
            onFileRemove={onFileRemove}
            onKeyPress={onKeyPress}
            onTextareaKeyPress={onTextareaKeyPress}
            applicationId={applicationId}
            getPreviewUrls={getPreviewUrls}
            isUploading={isUploading}
          />
        </div>
      ))}
    </div>
  );
}

export function QuestionRenderer({
  question,
  value,
  updateApplicationData,
  onFileUpload,
  onFileRemove,
  onKeyPress,
  onTextareaKeyPress,
  applicationId,
  getPreviewUrls,
  isUploading,
}: QuestionRendererProps) {
  const [isCustomizing, setCustomizing] = useState(false);
  
  // Safety check for required props
  if (!question || !updateApplicationData || !onFileUpload) {
    return <div>Error: Missing required props</div>;
  }
  switch (question.question_type) {
    case 'email':
      return (
        <input
          type="email"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => updateApplicationData(question.id, e.target.value)}
          className="form-input"
          placeholder="your.email@example.com"
          required={question.is_required}
          onKeyPress={onKeyPress}
        />
      );

    case 'text':
      return (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => updateApplicationData(question.id, e.target.value)}
          className="form-input"
          placeholder="Enter your answer..."
          required={question.is_required}
          onKeyPress={onKeyPress}
        />
      );

    case 'textarea':
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

    case 'multiple_choice': {
      const options = Array.isArray(question.options) ? question.options : [];
      const items = Array.isArray(question.option_items) ? question.option_items : [];
      // Prefer server-provided rich items if available, otherwise fall back to simple options.

      // Helper function to check if an option is selected
      const isOptionSelected = (optionId: string | undefined, optionName: string) => {
        if (typeof value === 'string') {
          return value === optionName || value === optionId;
        }
        return false;
      };

      // Helper function to check if custom is selected
      const isCustomSelected = () => {
        if (isCustomizing) return true;
        if (typeof value === 'string') {
          if (value === 'custom') return true;
          if (value.trim() !== '') {
            try {
              const parsed = JSON.parse(value);
              return parsed && typeof parsed === 'object';
            } catch {
              return false;
            }
          }
        }
        return false;
      };

      if (items.length > 0) {
        return (
          <>
            <div className="choice-grid three-cols mb-4">
              {items.map((it) => (
                <button
                  key={(it.id ?? it.name) + it.name}
                  type="button"
                  className={`choice-card ${isOptionSelected(it.id, it.name) ? 'selected' : ''}`}
                  onClick={() => { 
                    setCustomizing(false); 
                    if (typeof updateApplicationData === 'function') {
                      updateApplicationData(question.id, (it.id as string | undefined) ?? it.name); 
                    }
                  }}
                >
                  {it.image_url ? (
                    <img src={it.image_url} alt={it.name} className="choice-card-image" />
                  ) : null}
                  <div className="choice-card-name">{it.name}</div>
                  {it.description ? <div className="choice-card-desc">{it.description}</div> : null}
                </button>
              ))}
              {question.is_customisable && (
                <button
                  type="button"
                  className={`choice-card ${isCustomSelected() ? 'selected' : ''}`}
                  onClick={() => { 
                    setCustomizing(true); 
                    if (typeof updateApplicationData === 'function') {
                      updateApplicationData(question.id, 'custom'); 
                    }
                  }}
                >
                  <div className="choice-card-name">I have a different idea!</div>
                </button>
              )}
            </div>
            {question.is_customisable && isCustomizing && question.custom_template_id ? (
              <div className="mt-10">
                <CustomQuestionFlow
                  templateId={question.custom_template_id}
                  onUpdate={(customData) => updateApplicationData(question.id, JSON.stringify(customData))}
                  onFileUpload={(e, qid) => onFileUpload(e, qid)}
                  onFileRemove={onFileRemove}
                  onKeyPress={onKeyPress}
                  onTextareaKeyPress={onTextareaKeyPress}
                  applicationId={applicationId}
                  getPreviewUrls={getPreviewUrls}
                  isUploading={isUploading}
                />
              </div>
            ) : null}
          </>
        );
      }
      if (options.length === 0) {
        return (
          <>
            <DemoChoiceGrid
              slug={question.id}
              selectedValue={typeof value === 'string' ? value : undefined}
              onSelect={(val) => { 
              setCustomizing(false); 
              if (typeof updateApplicationData === 'function') {
                updateApplicationData(question.id, val); 
              }
            }}
            />
            {question.is_customisable && isCustomizing && question.custom_template_id ? (
              <div className="mt-4">
                <CustomQuestionFlow
                  templateId={question.custom_template_id}
                  onUpdate={(customData) => updateApplicationData(question.id, JSON.stringify(customData))}
                  onFileUpload={(e, qid) => onFileUpload(e, qid)}
                  onFileRemove={onFileRemove}
                  onKeyPress={onKeyPress}
                  onTextareaKeyPress={onTextareaKeyPress}
                  applicationId={applicationId}
                  getPreviewUrls={getPreviewUrls}
                  isUploading={isUploading}
                />
              </div>
            ) : null}
          </>
        );
      }
      return (
        <>
          <OptionGrid
            slug={question.id}
            options={options}
            selectedValue={typeof value === 'string' ? value : undefined}
            onSelect={(val) => updateApplicationData(question.id, val)}
            question={question}
            setCustomizing={setCustomizing}
            isCustomizing={isCustomizing}
          />
          {question.is_customisable && isCustomizing && question.custom_template_id ? (
            <div className="mt-4">
              <CustomQuestionFlow
                templateId={question.custom_template_id}
                  onUpdate={(customData) => updateApplicationData(question.id, JSON.stringify(customData))}
                onFileUpload={(e, qid) => onFileUpload(e, qid)}
                onFileRemove={onFileRemove}
                onKeyPress={onKeyPress}
                onTextareaKeyPress={onTextareaKeyPress}
                applicationId={applicationId}
                getPreviewUrls={getPreviewUrls}
                isUploading={isUploading}
              />
            </div>
          ) : null}
          {typeof value === 'string' && value.toLowerCase().includes('custom') && (
            <div className="upload-control mt-4">
              <label className={`upload-box ${isUploading?.(`${question.id}CustomUpload`) ? 'uploading' : ''}`} aria-label="Upload custom shape">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={isUploading?.(`${question.id}CustomUpload`) || false}
                  onChange={(e) => onFileUpload(e, `${question.id}CustomUpload`)}
                />
                <div className="upload-box-inner">
                  {isUploading?.(`${question.id}CustomUpload`) ? (
                    <>
                      <div className="upload-icon uploading" aria-hidden>
                        <div className="spinner"></div>
                      </div>
                      <div className="upload-texts">
                        <span className="upload-cta">Uploading...</span>
                        <span className="upload-sub">Please wait</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="upload-icon" aria-hidden>📎</div>
                      <div className="upload-texts">
                        <span className="upload-cta">Add Custom Shape Image</span>
                        <span className="upload-sub">JPG, PNG, GIF up to 5MB</span>
                      </div>
                    </>
                  )}
                </div>
              </label>
              {(() => {
                const previews = getPreviewUrls?.(`${question.id}CustomUpload`) || [];
                return previews.length > 0 ? (
                  <div className="preview-grid">
                    {previews.map((src, idx) => (
                      <div key={idx} className="preview-container">
                        <img src={src} alt={`Preview ${idx + 1}`} className="preview-image" />
                        {onFileRemove && (
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => onFileRemove(`${question.id}CustomUpload`, idx)}
                            aria-label={`Remove file ${idx + 1}`}
                            title="Remove file"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </>
      );
    }

    case 'file_upload': {
      const previews = getPreviewUrls?.(question.id) || [];
      const uploading = isUploading?.(question.id) || false;
      return (
        <>
          <div className="upload-control">
            <label className={`upload-box ${uploading ? 'uploading' : ''}`} aria-label="Upload image">
              <input
                type="file"
                onChange={(e) => onFileUpload(e, question.id)}
                accept="image/*"
                required={question.is_required}
                disabled={uploading}
                hidden
              />
              <div className="upload-box-inner">
                {uploading ? (
                  <>
                    <div className="upload-icon uploading" aria-hidden>
                      <div className="spinner"></div>
                    </div>
                    <div className="upload-texts">
                      <span className="upload-cta">Uploading...</span>
                      <span className="upload-sub">Please wait</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="upload-icon" aria-hidden>📷</div>
                    <div className="upload-texts">
                      <span className="upload-cta">Choose File</span>
                      <span className="upload-sub">JPG, PNG, GIF up to 5MB</span>
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>
          {previews.length > 0 ? (
            <div className="preview-grid">
              {previews.map((src, idx) => (
                <div key={idx} className="preview-container">
                  <img src={src} alt={`Preview ${idx + 1}`} className="preview-image" />
                  {onFileRemove && (
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => onFileRemove(question.id, idx)}
                      aria-label={`Remove file ${idx + 1}`}
                      title="Remove file"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </>
      );
    }

    default:
      return (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => updateApplicationData(question.id, e.target.value)}
          className="form-input"
          placeholder="Enter your answer..."
          required={question.is_required}
          onKeyPress={onKeyPress}
        />
      );
  }
}

interface DemoChoiceGridProps {
  slug: string;
  selectedValue?: string;
  onSelect: (value: string) => void;
}

function DemoChoiceGrid({ slug, selectedValue, onSelect }: DemoChoiceGridProps) {
  const [items, setItems] = useState<Array<{ id: string; name: string; image_url?: string | null; description?: string | null }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchItems() {
      setLoading(true);
      try {
        const res = await fetch(`/api/question-demo-items?question=${encodeURIComponent(slug)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch options');
        const data = await res.json();
        if (!cancelled) setItems(data || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <div className="choice-grid loading">Loading...</div>;
  if (error) return <div className="choice-grid error">{error}</div>;

  return (
    <div className="choice-grid three-cols">
      {items.map((it) => (
        <button
          key={it.id + it.name}
          type="button"
          className={`choice-card ${selectedValue === it.name ? 'selected' : ''}`}
          onClick={() => onSelect(it.name)}
        >
          {it.image_url ? (
            <img src={it.image_url} alt={it.name} className="choice-card-image" />
          ) : null}
          <div className="choice-card-name">{it.name}</div>
          {it.description ? <div className="choice-card-desc">{it.description}</div> : null}
        </button>
      ))}
    </div>
  );
}

interface OptionGridProps {
  slug: string;
  options: string[];
  selectedValue?: string;
  onSelect: (value: string) => void;
}

function OptionGrid({ slug, options, selectedValue, onSelect, question, setCustomizing, isCustomizing }: OptionGridProps & { question: ApplicationQuestion, setCustomizing: (isCustomizing: boolean) => void, isCustomizing: boolean }) {
  const [items, setItems] = useState<Record<string, { image_url?: string | null; description?: string | null }>>({});

  useEffect(() => {
    let cancelled = false;
    async function fetchItems() {
      try {
        const res = await fetch(`/api/question-demo-items?question=${encodeURIComponent(slug)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data: Array<{ name: string; image_url?: string | null; description?: string | null }> = await res.json();
        const map: Record<string, { image_url?: string | null; description?: string | null }> = {};
        data.forEach((d) => {
          map[d.name] = { image_url: d.image_url, description: d.description };
        });
        if (!cancelled) setItems(map);
      } catch {}
    }
    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="choice-grid three-cols">
      {options.map((opt) => {
        const meta = items[opt] || {};
        return (
          <button
            key={opt}
            type="button"
            className={`choice-card ${selectedValue === opt ? 'selected' : ''}`}
            onClick={() => { onSelect(opt); setCustomizing(false); }}
          >
            {meta.image_url ? (
              <img src={meta.image_url} alt={opt} className="choice-card-image" />
            ) : null}
            <div className="choice-card-name">{opt}</div>
            {meta.description ? <div className="choice-card-desc">{meta.description}</div> : null}
          </button>
        );
      })}
      {question.is_customisable && (
        <button
          type="button"
          className={`choice-card ${isCustomizing || (typeof selectedValue === 'string' && selectedValue.trim() !== '' && (() => {
            try {
              const parsed = JSON.parse(selectedValue);
              return parsed && typeof parsed === 'object';
            } catch {
              return false;
            }
          })()) ? 'selected' : ''}`}
          onClick={() => { onSelect(''); setCustomizing(true); }}
        >
          <div className="choice-card-name">I have a different idea!</div>
        </button>
      )}
    </div>
  );
}


