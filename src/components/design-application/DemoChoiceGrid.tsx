"use client";
import React, { useEffect, useState } from 'react';

interface DemoChoiceGridProps {
  slug: string;
  selectedValue?: string;
  onSelect: (value: string) => void;
}

export default function DemoChoiceGrid({ slug, selectedValue, onSelect }: DemoChoiceGridProps) {
  const [items, setItems] = useState<Array<{ id: string; name: string; image_url?: string | null; description?: string | null }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 6;
  const [pageIdx, setPageIdx] = useState(0);

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

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice(pageIdx * PAGE_SIZE, pageIdx * PAGE_SIZE + PAGE_SIZE);
  const goPrev = () => setPageIdx((p) => Math.max(0, p - 1));
  const goNext = () => setPageIdx((p) => Math.min(totalPages - 1, p + 1));

  return (
    <>
      <div className="choice-grid three-cols">
        {pageItems.map((it) => (
          <button
            key={it.id + it.name}
            type="button"
            className={`choice-card ${selectedValue === it.id ? 'selected' : ''}`}
            onClick={() => onSelect(it.id)}
          >
            {it.image_url ? (
              <img src={it.image_url} alt={it.name} className="choice-card-image" />
            ) : null}
            <div className="choice-card-name">{it.name}</div>
            {it.description ? <div className="choice-card-desc">{it.description}</div> : null}
          </button>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="choice-pagination flex items-center justify-center gap-4 mt-4">
          <button type="button" className="btn-pagination" onClick={goPrev} disabled={pageIdx === 0}>Previous</button>
          <div className="pagination-indicator">Page {pageIdx + 1} of {totalPages}</div>
          <button type="button" className="btn-pagination" onClick={goNext} disabled={pageIdx === totalPages - 1}>Next</button>
        </div>
      )}
    </>
  );
}
