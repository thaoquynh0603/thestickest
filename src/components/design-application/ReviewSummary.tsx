import React from 'react';
import { ApplicationQuestion } from './types';

interface ReviewSummaryProps {
  questions: ApplicationQuestion[];
  getValue: (id: string) => string | File | string[] | undefined;
  selectedStyleName?: string;
  customStyleDescription?: string;
  getPreviewUrls?: (questionId: string) => string[] | undefined;
  requestId?: string;
}

export function ReviewSummary({ questions, getValue, selectedStyleName, customStyleDescription, getPreviewUrls, requestId }: ReviewSummaryProps) {
  const [dbAnswerFiles, setDbAnswerFiles] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let cancelled = false;
    async function fetchAnswers() {
      if (!requestId) return;
      try {
        const res = await fetch(`/api/design-requests/answers?requestId=${encodeURIComponent(requestId)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const rows: Array<{ question_id: string; answer_file_url?: string | null }> = await res.json();
        if (cancelled) return;
        const map: Record<string, string> = {};
        rows.forEach((r) => { if (r.answer_file_url) map[String(r.question_id)] = r.answer_file_url; });
        setDbAnswerFiles(map);
      } catch {}
    }
    fetchAnswers();
    return () => { cancelled = true; };
  }, [requestId]);
  const isUrl = (s: string) => /^https?:\/\//i.test(s);
  const dedupe = (arr: string[]) => Array.from(new Set(arr));
  const lastOf = (arr: string[]) => (arr.length > 0 ? arr[arr.length - 1] : undefined);

  // Helper to prettify a parsed custom object into labeled lines
  const summarizeCustomObject = (obj: Record<string, unknown>) => {
    const lines: string[] = [];
    Object.entries(obj).forEach(([key, val]) => {
      if (typeof val === 'string' && val.trim() && val.toLowerCase() !== 'uploaded' && !isUrl(val)) {
        const label = key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        lines.push(`${label}: ${val}`);
      }
    });
    return lines;
  };

  const renderValue = (value: string | File | string[] | undefined) => {
    if (typeof value === 'string') {
      // If JSON string from a custom flow, show a friendlier summary
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') {
          const vals = Object.values(parsed as Record<string, unknown>)
            .filter((v) => typeof v === 'string' && (v as string).trim() && (v as string).toLowerCase() !== 'uploaded') as string[];
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
          const value = getValue(question.id);
          const customUpload = getValue(`${question.id}CustomUpload`);
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
          // If this is a custom-flow JSON, expand with labeled fields and attach previews for any inner file-answers
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const lines = summarizeCustomObject(parsed as Record<string, unknown>);
                if (lines.length > 0) {
                  text = undefined as unknown as string; // we will render a list below
                }
                // Collect previews from inner sub-question ids belonging to this custom flow
                const innerIds = Object.keys(parsed as Record<string, unknown>);
                const candidates: string[] = [];
                innerIds.forEach((subId) => {
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
                  if (dbAnswerFiles[subId]) {
                    candidates.push(dbAnswerFiles[subId]);
                  }
                });
                const lastCandidate = lastOf(candidates);
                if (!urls.length && lastCandidate) urls = [lastCandidate];
              }
            } catch {}
          }
          // Map stored ids to human-readable names when the question supplies rich option items
          if (typeof value === 'string' && Array.isArray(question.option_items) && question.option_items.length > 0) {
            const match = question.option_items.find((it) => it.id === value || it.name === value);
            if (match?.name) {
              text = match.name;
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
      </div>
    </div>
  );
}


