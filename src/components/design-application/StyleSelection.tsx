import React, { useMemo, useState } from 'react';
import { OptimizedImage } from '../OptimizedImage';
import { DesignStyle } from './types';

interface StyleSelectionProps {
  styles: DesignStyle[];
  selectedStyleId: string;
  onSelect: (styleId: string) => void;
  customStyleDescription: string;
  onCustomStyleChange: (value: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, questionId: string) => void;
}

export function StyleSelection({
  styles,
  selectedStyleId,
  onSelect,
  customStyleDescription,
  onCustomStyleChange,
  onFileUpload,
}: StyleSelectionProps) {
  const items = useMemo(() => {
    return [
      {
        id: 'custom',
        name: 'Custom Style',
        description: 'Tell us your vibe and upload references in the next step',
        image_url: '',
      },
      ...styles,
    ];
  }, [styles]);

  const perPage = 3;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const maxIndex = Math.max(0, items.length - perPage);
  const canPrev = index > 0;
  const canNext = index < maxIndex;
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const visible = items.slice(index, index + perPage);
  // Current page should reflect partial last pages as well. Using ceil avoids
  // the case where index=4, perPage=3 incorrectly maps to page 1 instead of 2.
  const currentPage = Math.ceil(index / perPage);

  const renderCard = (style: { id: string; name: string; description?: string | null; image_url?: string | null }) => (
    <div
      key={style.id}
      className={`style-option ${selectedStyleId === style.id ? 'selected' : ''}`}
      onClick={() => onSelect(style.id)}
    >
      {style.image_url ? (
        <OptimizedImage
          src={style.image_url}
          alt={style.name}
          width={400}
          height={300}
          quality={80}
          lazy={true}
          className="style-image"
          maxWidth={400}
          maxHeight={300}
        />
      ) : (
        <div className="style-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span role="img" aria-label="sparkles">✨</span>
        </div>
      )}
      <div className="style-info">
        <h4 className="style-name">{style.name}</h4>
        {style.description && <p className="style-description">{style.description}</p>}
      </div>
    </div>
  );

  return (
    <div className="step-container">
      <h2 className="step-title">🎨 Choose Your Design Style</h2>
      <p className="step-description">
        Select a design style that best matches your vision, or describe your own style preferences.
      </p>

      <div className="style-selection">

        <div className="styles-carousel">
          <button
            type="button"
            className="styles-arrow prev"
            onClick={() => {
              setDirection('prev');
              setIndex((i) => Math.max(0, i - perPage));
            }}
            disabled={!canPrev}
            aria-label="Previous styles"
          >
            ‹
          </button>
          <button
            type="button"
            className="styles-arrow next"
            onClick={() => {
              setDirection('next');
              setIndex((i) => Math.min(maxIndex, i + perPage));
            }}
            disabled={!canNext}
            aria-label="Next styles"
          >
            ›
          </button>

          <div className="styles-viewport mb-5">
            <div
              key={index}
              className={`styles-grid ${direction === 'next' ? 'slide-next' : 'slide-prev'}`}
            >
              {visible.map(renderCard)}
            </div>
          </div>
          <div className="styles-dots" aria-label={`Page ${currentPage + 1} of ${pageCount}`}>
            {Array.from({ length: pageCount }).map((_, p) => (
              <button
                key={p}
                type="button"
                className={`styles-dot ${p === currentPage ? 'active' : ''}`}
                aria-label={`Go to page ${p + 1}`}
                onClick={() => {
                  const targetIndex = Math.min(maxIndex, p * perPage);
                  setDirection(targetIndex > index ? 'next' : 'prev');
                  setIndex(targetIndex);
                }}
              />
            ))}
          </div>
        </div>

        {items.length <= 1 && (
          <p className="no-styles">No predefined styles available for this product.</p>
        )}
      </div>
    </div>
  );
}


