import React from 'react';
import { ApplicationQuestion } from './types';

interface ReviewSummaryProps {
  questions: ApplicationQuestion[];
  getValue: (id: string) => string | File | string[] | undefined;
  selectedStyleName?: string;
  customStyleDescription?: string;
  getPreviewUrls?: (questionId: string) => string[] | undefined;
  requestId?: string;
  howDidYouHear?: string[];
}

export function ReviewSummary({ questions, getValue, selectedStyleName, customStyleDescription, getPreviewUrls, requestId, howDidYouHear }: ReviewSummaryProps) {
  const [dbAnswerFiles, setDbAnswerFiles] = React.useState<Record<string, string>>({});
  const [dbAnswers, setDbAnswers] = React.useState<Record<string, { answer_text?: string | null; answer_file_url?: string | null; answer_options?: any }>>({});
  const [customLabels, setCustomLabels] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let cancelled = false;
    async function fetchAnswers() {
      if (!requestId) return;
      try {
        const res = await fetch(`/api/design-requests/answers?requestId=${encodeURIComponent(requestId)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const rows: Array<{ question_id: string; answer_text?: string | null; answer_file_url?: string | null; answer_options?: any }> = await res.json();
        if (cancelled) return;
        const map: Record<string, string> = {};
        const full: Record<string, { answer_text?: string | null; answer_file_url?: string | null; answer_options?: any }> = {};
        rows.forEach((r) => {
          if (r.answer_file_url) map[String(r.question_id)] = r.answer_file_url;
          full[String(r.question_id)] = { answer_text: r.answer_text ?? undefined, answer_file_url: r.answer_file_url ?? undefined, answer_options: r.answer_options };
        });
        setDbAnswerFiles(map);
        setDbAnswers(full);
      } catch {}
    }
    fetchAnswers();
    return () => { cancelled = true; };
  }, [requestId]);
  const isUrl = (s: string) => /^https?:\/\//i.test(s);
  const dedupe = (arr: string[]) => Array.from(new Set(arr));
  const lastOf = (arr: string[]) => (arr.length > 0 ? arr[arr.length - 1] : undefined);

  // Helper to prettify a parsed custom object into labeled lines
  const summarizeCustomObject = (obj: Record<string, unknown>, templateId?: string | number | null) => {
    const lines: string[] = [];
    Object.entries(obj).forEach(([key, val]) => {
  // Skip internal option markers and uploaded/url values here (we'll show URLs as previews)
  if (key === 'option') return;
  if (typeof val === 'string' && val.trim() && val.toLowerCase() !== 'uploaded' && val.toLowerCase() !== 'custom' && !isUrl(val)) {
        // Prefer mapped custom question label when available (numeric sub-ids), namespaced by template id
        let labelFromMap: string | undefined;
        if (templateId !== undefined && templateId !== null) {
          labelFromMap = customLabels[`${templateId}:${key}`];
        }
        labelFromMap = labelFromMap ?? customLabels[key];
        const label = labelFromMap || key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        lines.push(`${label}: ${val}`);
      }
    });
    return lines;
  };

  // Fetch labels for any custom templates used by questions so we can render friendly names
  React.useEffect(() => {
    let cancelled = false;
    async function fetchCustomLabels() {
      try {
        const templateIds = Array.from(new Set(questions.filter(q => (q as any).custom_template_id).map(q => String((q as any).custom_template_id))));
        if (templateIds.length === 0) return;
        const map: Record<string, string> = {};
        await Promise.all(templateIds.map(async (tid) => {
          try {
            const res = await fetch(`/api/custom-questions?templateId=${encodeURIComponent(tid)}`, { cache: 'no-store' });
            if (!res.ok) return;
            const data: Array<{ id: number | string; question_text: string }> = await res.json();
            if (cancelled) return;
            // data may not be ordered; use provided order or sort by sort_order if present
            data.forEach((d, idx) => {
              // namespaced by template:id
              map[`${tid}:${String(d.id)}`] = d.question_text;
              // positional mapping: template:position (1-based)
              map[`${tid}:${String(idx + 1)}`] = d.question_text;
              // also store a non-namespaced id fallback (useful if stored JSON omitted template)
              map[String(d.id)] = d.question_text;
            });
          } catch {}
        }));
        if (!cancelled && Object.keys(map).length > 0) {
          setCustomLabels(prev => ({ ...prev, ...map }));
        }
      } catch {}
    }
    fetchCustomLabels();
    return () => { cancelled = true; };
  }, [questions]);

  const renderValue = (value: string | File | string[] | undefined) => {
    if (typeof value === 'string') {
      // If JSON string from a custom flow, show a friendlier summary
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') {
          const vals = Object.values(parsed as Record<string, unknown>)
            .filter((v) => typeof v === 'string' && (v as string).trim() && (v as string).toLowerCase() !== 'uploaded' && !isUrl(v as string) && (v as string).toLowerCase() !== 'custom') as string[];
          if (vals.length > 0) return vals.join(' \n');
          return 'Custom details provided';
        }
      } catch {}
      // Hide raw URLs from customers
      if (isUrl(value)) return 'Image uploaded';
      return value || 'Not provided';
    }
    if (Array.isArray(value)) {
      const allUrls = value.every((v) => typeof v === 'string' && isUrl(v));
      if (allUrls) return `${value.length} image${value.length > 1 ? 's' : ''} uploaded`;
      return value.join(', ');
    }
    if (value instanceof File) return value.name;
    return 'Not provided';
  };

  return (
    <div className="step-container">
      <h2 className="step-title">Review Your Request</h2>
      <p className="step-description">Please review your information before proceeding to payment.</p>
      <div className="review-summary">
        {questions.map((question) => {
          // Prefer in-memory value first, fallback to persisted answer_text/options when available
          const memValue = getValue(question.id);
          let value = memValue;
          const persisted = dbAnswers?.[question.id];
          if ((value === undefined || value === null || (typeof value === 'string' && value === '')) && persisted) {
            if (persisted.answer_text) value = persisted.answer_text as string;
            else if (persisted.answer_options) value = Array.isArray(persisted.answer_options.values) ? persisted.answer_options.values : persisted.answer_options;
            else if (persisted.answer_file_url) value = persisted.answer_file_url as string;
          }
          const customUpload = getValue(`${question.id}CustomUpload`) || dbAnswers?.[`${question.id}CustomUpload`]?.answer_file_url;
          const isFileLike = question.question_type === 'file_upload';
          let urls: string[] = [];

          if (isFileLike) {
            // Prefer local previews (show only the last one)
            const local = getPreviewUrls?.(question.id) || [];
            if (local.length > 0) {
              const lastLocal = lastOf(local);
              urls = lastLocal ? [lastLocal] : [];
            } else if (Array.isArray(value)) {
              // Value contains an array of URLs, show only the last
              const onlyUrls = value.filter((v): v is string => typeof v === 'string' && isUrl(v));
              const last = lastOf(onlyUrls);
              urls = last ? [last] : [];
            } else if (typeof value === 'string' && isUrl(value)) {
              urls = [value];
            }
          }

          // If custom flow: ONLY show preview from the auxiliary custom upload field for this question
          if (!isFileLike) {
            const local = getPreviewUrls?.(`${question.id}CustomUpload`) || [];
            if (local.length > 0) {
              const lastLocal = lastOf(local);
              urls = lastLocal ? [lastLocal] : [];
            } else if (typeof customUpload === 'string' && isUrl(customUpload)) {
              urls = [customUpload];
            } else if (dbAnswerFiles[`${question.id}CustomUpload`]) {
              urls = [dbAnswerFiles[`${question.id}CustomUpload`]];
            }
          }

          let text = renderValue(value);
          // Replace any raw URLs in the rendered text with a friendly label so long links aren't shown
          try {
            if (typeof text === 'string') {
              const urlRegex = /(https?:\/\/[^\s"']+)/g;
              text = text.replace(urlRegex, 'Image uploaded');
            }
          } catch {}
          // If this is a custom-flow JSON, expand with labeled fields and attach previews for any inner file-answers
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                      const lines = summarizeCustomObject(parsed as Record<string, unknown>, (question as any).custom_template_id);
                if (lines.length > 0) {
                  text = undefined as unknown as string; // we will render a list below
                }
                // Collect previews from inner sub-question ids belonging to this custom flow
                const innerIds = Object.keys(parsed as Record<string, unknown>);
                const candidates: string[] = [];
                innerIds.forEach((subId) => {
                  // Skip 'option' marker keys
                  if (subId === 'option') return;
                  const local = getPreviewUrls?.(subId) || [];
                  if (local.length > 0) {
                    const lastLocal = lastOf(local);
                    if (lastLocal) candidates.push(lastLocal);
                    return;
                  }
                  const stored = getValue(subId);
                  if (typeof stored === 'string' && isUrl(stored)) {
                    candidates.push(stored);
                    return;
                  }
                  // If parsed custom JSON directly contains URLs as values, capture them too
                  const val = (parsed as Record<string, unknown>)[subId];
                  if (typeof val === 'string' && isUrl(val)) {
                    candidates.push(val);
                    return;
                  }
                  if (dbAnswerFiles[subId]) {
                    candidates.push(dbAnswerFiles[subId]);
                  }
                });
                const lastCandidate = lastOf(candidates);
                if (!urls.length && lastCandidate) urls = [lastCandidate];
              }
            } catch {}
          }
          // Map stored ids (string or array of strings) to human-readable names when the question supplies rich option items
          if (Array.isArray(question.option_items) && question.option_items.length > 0) {
            if (typeof value === 'string') {
              const match = (question.option_items ?? []).find((it) => it.id === value || it.name === value);
              if (match?.name) {
                text = match.name;
              }
            } else if (Array.isArray(value)) {
              // Map each element to a display name when possible (handles checkbox/multi-select answers)
              const mapped = value
                .map((v) => {
                  try {
                    const vs = String(v);
                    const match = (question.option_items ?? []).find((it) => it.id === vs || it.name === vs);
                    return match?.name ?? vs;
                  } catch {
                    return String(v);
                  }
                })
                .filter(Boolean);
              if (mapped.length > 0) {
                text = mapped.join(', ');
              }
            }
          }
          return (
            <div key={question.id} className="review-item">
              <strong>{question.question_text}:</strong>
              {text ? <div>{text}</div> : null}
              {/* If custom JSON, render key/value list for clarity */}
              {typeof value === 'string' && (() => {
                try {
                  const parsed = JSON.parse(value);
                  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const lines = summarizeCustomObject(parsed as Record<string, unknown>);
                    return lines.length > 0 ? (
                      <ul style={{ margin: '8px 0 0 16px' }}>
                        {lines.map((ln, i) => (<li key={i}>{ln}</li>))}
                      </ul>
                    ) : null;
                  }
                } catch {}
                return null;
              })()}
              {urls.length > 0 && (
                <div className={urls.length > 1 ? 'preview-grid' : 'preview-single'}>
                  {urls.map((u, i) => (
                    <img key={i} src={u} alt={`Preview ${i + 1}`} className="preview-image" />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {customStyleDescription && (
          <div className="review-item">
            <strong>Custom Style Description:</strong> {customStyleDescription}
          </div>
        )}
        {howDidYouHear && howDidYouHear.length > 0 && (
          <div className="review-item">
            <strong>How did you hear about us?</strong>
            <div>{howDidYouHear.join(', ')}</div>
          </div>
        )}
      </div>
    </div>
  );
}


