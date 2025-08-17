"use client";
import React, { useEffect, useState } from 'react';
import { ApplicationQuestion } from './types';

interface OptionGridProps {
  slug: string;
  options: string[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  question: ApplicationQuestion;
  setCustomizing: (isCustomizing: boolean) => void;
  isCustomizing: boolean;
}

export default function OptionGrid({ slug, options, selectedValue, onSelect, question, setCustomizing, isCustomizing }: OptionGridProps) {
  // Safety check to prevent hydration issues
  if (!slug || !options) {
    return <div>Loading...</div>;
  }
  
  const [items, setItems] = useState<Record<string, { id?: string; image_url?: string | null; description?: string | null }>>({});
  const PAGE_SIZE = 6;
  const [pageIdx, setPageIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchItems() {
      try {
        const res = await fetch(`/api/question-demo-items?question=${encodeURIComponent(slug)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data: Array<{ id?: string; name: string; image_url?: string | null; description?: string | null }> = await res.json();
        const map: Record<string, { id?: string; image_url?: string | null; description?: string | null }> = {};
        data.forEach((d) => {
          map[d.name] = { id: d.id, image_url: d.image_url, description: d.description };
          // also map by id for components that store ids
          if (d.id) map[d.id] = { id: d.id, image_url: d.image_url, description: d.description };
        });
        if (!cancelled) setItems(map);
      } catch {}
    }
    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const pageOptions = options.slice(pageIdx * PAGE_SIZE, pageIdx * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <div className="choice-grid three-cols">
        {pageOptions.map((opt) => {
          if (!opt) return null; // Safety check
          const item = items[opt];
          if (!item) return null; // Safety check for item lookup
          // `items` map may contain metadata keyed by name or id; prefer id when available
          const idForOpt = item.id;
          const isSelected = selectedValue === opt || (idForOpt && selectedValue === idForOpt);
          return (
            <button
              key={opt}
              type="button"
              className={`choice-card ${isSelected ? 'selected' : ''}`}
              onClick={() => { onSelect(idForOpt || opt); setCustomizing(false); }}
              aria-pressed={isSelected ? "true" : "false"}
            >
              {item.image_url ? <img src={item.image_url} alt={opt} className="choice-card-image" /> : null}
              <div className="choice-card-name">{opt}</div>
              {item.description && <div className="choice-card-description">{item.description}</div>}
            </button>
          );
        })}
      </div>
      {options.length > PAGE_SIZE && (
        <div className="choice-pagination flex items-center justify-center gap-4 mt-4">
          <button type="button" className="btn-pagination" onClick={() => setPageIdx((p) => Math.max(0, p - 1))} disabled={pageIdx === 0}>Previous</button>
          <div className="pagination-indicator">Page {pageIdx + 1} of {Math.max(1, Math.ceil(options.length / PAGE_SIZE))}</div>
          <button type="button" className="btn-pagination" onClick={() => setPageIdx((p) => Math.min(Math.max(1, Math.ceil(options.length / PAGE_SIZE)) - 1, p + 1))} disabled={pageIdx >= Math.ceil(options.length / PAGE_SIZE) - 1}>Next</button>
        </div>
      )}
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
    </>
  );
}
