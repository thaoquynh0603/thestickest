"use client";

import { useEffect, useRef, useState } from 'react';
import { CarouselItem } from '@/types/database';

type PositionClass = 'top-left' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-right';

interface ProductCarouselProps {
  carouselItems: CarouselItem[];
  productTitle: string;
  productSlug: string;
}

// Validation function to ensure position is a valid PositionClass
const validatePosition = (position: string | null | undefined): PositionClass => {
  const validPositions: PositionClass[] = ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'];
  if (!position || typeof position !== 'string') {
    return 'bottom-left';
  }
  return validPositions.includes(position as PositionClass) ? position as PositionClass : 'bottom-left';
};

export default function ProductCarousel({ carouselItems, productTitle, productSlug }: ProductCarouselProps) {
  // Ensure we have valid carousel items
  const validCarouselItems = carouselItems?.filter(item => 
    item && item.id && item.image_url && item.message_h1
  ) || [];
  
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slide every 3 seconds
  useEffect(() => {
    if (validCarouselItems.length <= 1) return;
    
    intervalRef.current = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % validCarouselItems.length);
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [validCarouselItems.length]);

  // Function to reset the auto-slide timer
  const resetAutoSlide = () => {
    if (validCarouselItems.length <= 1) return;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % validCarouselItems.length);
    }, 3000);
  };

  useEffect(() => {
    const container = containerRef.current;
    const overlayEl = overlayRef.current;
    if (!container || !overlayEl) return;

    const computeGap = (): number => {
      const root = document.documentElement;
      const val = getComputedStyle(root).getPropertyValue('--overlay-gap').trim();
      const match = val.match(/([\d.]+)px/);
      return match ? parseFloat(match[1]) : 48;
    };

    const place = (position: PositionClass) => {
      const gap = computeGap();
      const containerRect = container.getBoundingClientRect();
      const overlayRect = overlayEl.getBoundingClientRect();

      let x = gap;
      let y = gap;

      switch (position) {
        case 'top-left':
          x = gap;
          y = gap;
          break;
        case 'top-right':
          x = containerRect.width - overlayRect.width - gap;
          y = gap;
          break;
        case 'center-left':
          x = gap;
          y = containerRect.height / 2 - overlayRect.height / 2;
          break;
        case 'center-right':
          x = containerRect.width - overlayRect.width - gap;
          y = containerRect.height / 2 - overlayRect.height / 2;
          break;
        case 'bottom-left':
          x = gap;
          y = containerRect.height - overlayRect.height - gap;
          break;
        case 'bottom-right':
          x = containerRect.width - overlayRect.width - gap;
          y = containerRect.height - overlayRect.height - gap;
          break;
      }

      overlayEl.style.setProperty('--overlay-x', `${Math.max(0, x)}px`);
      overlayEl.style.setProperty('--overlay-y', `${Math.max(0, y)}px`);
    };

    // Ensure index is within bounds and get the current item
    const currentItem = validCarouselItems[index] || validCarouselItems[0];
    const pos: PositionClass = validatePosition(currentItem?.position || 'bottom-left');
    place(pos);

    const onResize = () => place(pos);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [index, validCarouselItems]);

  if (validCarouselItems.length === 0) {
    return null;
  }

  return (
    <section className="product-carousel-section">
      <div className="product-carousel-container">
        <ProductCarouselSlides 
          items={validCarouselItems} 
          index={index} 
          onChange={setIndex} 
          containerRef={containerRef} 
          onManualNavigate={resetAutoSlide} 
        />

        <div ref={overlayRef} className="product-carousel-overlay floating">
          <div className="overlay-card">
            <h2 className="overlay-title">
              {validCarouselItems[index]?.message_h1 || productTitle}
            </h2>
            <p className="overlay-text">
              {validCarouselItems[index]?.message_text || ''}
            </p>
            <button 
              className="overlay-cta-button"
              onClick={() => window.location.href = `/store/${productSlug}/design`}
            >
              Start Design Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCarouselSlides({ 
  items, 
  index, 
  onChange, 
  containerRef, 
  onManualNavigate 
}: { 
  items: CarouselItem[]; 
  index: number; 
  onChange: (next: number) => void; 
  containerRef: React.RefObject<HTMLDivElement>;
  onManualNavigate: () => void;
}) {
  const go = (delta: number) => {
    onManualNavigate();
    onChange((index + delta + items.length) % items.length);
  };

  return (
    <div className="product-carousel-slides" ref={containerRef}>
      {items.map((item, i) => (
        <div key={item.id} className={`product-slide ${i === index ? 'active' : ''}`}>
          <img src={item.image_url} alt={item.message_h1} />
        </div>
      ))}

      {items.length > 1 && (
        <>
          <button className="carousel-btn prev" aria-label="Previous" onClick={() => go(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="carousel-btn next" aria-label="Next" onClick={() => go(1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </>
      )}

      {/* Carousel Indicators */}
      {items.length > 1 && (
        <div className="carousel-indicators">
          {items.map((_, i) => (
            <button
              key={i}
              className={`carousel-indicator ${i === index ? 'active' : ''}`}
              onClick={() => {
                onManualNavigate();
                onChange(i);
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
