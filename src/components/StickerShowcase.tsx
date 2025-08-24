"use client";

import { useEffect, useRef, useState } from 'react';
import { OptimizedImage } from './OptimizedImage';

type PositionClass = 'top-left' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-right';
type UniqueOverlay = { title: string; bullets: string[]; position: PositionClass };

// Type for raw data from JSON that might have string position
type RawUniqueOverlay = { title: string; bullets: string[]; position: string };
type RawCarouselItem = { image: string; caption: string; features: string[]; unique?: RawUniqueOverlay };
type RawCarousel = { title: string; subtitle?: string; items: RawCarouselItem[] };

// Validated types for component usage
type CarouselItem = { image: string; caption: string; features: string[]; unique?: UniqueOverlay };
type Carousel = { title: string; items: CarouselItem[] };
type FeatureLabels = Record<string, string>;

type Props = {
  title: string;
  subtitle: string;
  carousels: RawCarousel[];
  featureLabels: FeatureLabels;
  overlay?: { title: string; bullets: string[] };
};

// Validation function to ensure position is a valid PositionClass
const validatePosition = (position: string | undefined): PositionClass => {
  const validPositions: PositionClass[] = ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'];
  
  // Strengthen null check and add logging
  if (!position || typeof position !== 'string' || position.trim() === '') {
    console.warn('StickerShowcase: Invalid position value:', position, 'Defaulting to bottom-left');
    return 'bottom-left';
  }
  
  // Ensure validPositions is an array before calling includes
  if (!Array.isArray(validPositions)) {
    console.error('StickerShowcase: validPositions is not an array:', validPositions);
    return 'bottom-left';
  }
  
  const result = validPositions.includes(position as PositionClass) ? position as PositionClass : 'bottom-left';
  if (result !== position) {
    console.warn('StickerShowcase: Position not in valid positions:', position, 'Defaulting to bottom-left');
  }
  return result;
};

// Convert raw carousel data to validated carousel data
const validateCarousels = (rawCarousels: RawCarousel[] | null | undefined): Carousel[] => {
  // Add defensive check for null/undefined
  if (!rawCarousels || !Array.isArray(rawCarousels)) {
    console.warn('StickerShowcase: Invalid carousels data:', rawCarousels);
    return [];
  }
  
  return rawCarousels.map(carousel => {
    if (!carousel || !Array.isArray(carousel.items)) {
      console.warn('StickerShowcase: Invalid carousel item:', carousel);
      return { title: '', items: [] };
    }
    
    return {
      title: carousel.title || '',
      items: carousel.items.map(item => {
        if (!item) {
          console.warn('StickerShowcase: Invalid item:', item);
          return { image: '', caption: '', features: [] };
        }
        
        return {
          image: item.image || '',
          caption: item.caption || '',
          features: Array.isArray(item.features) ? item.features : [],
          unique: item.unique ? {
            title: item.unique.title || '',
            bullets: Array.isArray(item.unique.bullets) ? item.unique.bullets : [],
            position: validatePosition(item.unique.position)
          } : undefined
        };
      })
    };
  });
};

export default function StickerShowcase({ title, subtitle, carousels, featureLabels, overlay }: Props) {
  // Add defensive checks for all props
  const safeTitle = title || 'Sticker Showcase';
  const safeSubtitle = subtitle || 'See our amazing stickers in action.';
  const safeCarousels = carousels || [];
  const safeFeatureLabels = featureLabels || {};
  const safeOverlay = overlay || { title: '', bullets: [] };
  
  const validatedCarousels = validateCarousels(safeCarousels);
  const items = validatedCarousels.flatMap((c) => c.items || []);
  const [index, setIndex] = useState(0);

  // Ensure index is within bounds
  useEffect(() => {
    if (items && items.length > 0 && index >= items.length) {
      setIndex(0);
    }
  }, [items, index]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slide every 3 seconds
  useEffect(() => {
    if (!items || items.length <= 1) return;
    
    intervalRef.current = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [items.length]);

  // Function to reset the auto-slide timer
  const resetAutoSlide = () => {
    if (!items || items.length <= 1) return;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 2000);
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

    const pos: PositionClass = (items && items[index] && items[index].unique && items[index].unique.position) ? items[index].unique.position : 'bottom-left';
    place(pos);

    const onResize = () => place(pos);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [index, items]);

  // Early return if no items
  if (!items || items.length === 0) {
    return (
      <section id="sticker-showcase" aria-labelledby="showcase-heading" style={{ width: '100vw', marginLeft: '50%', transform: 'translateX(-50%)' }}>
        <div className="showcase-fullbleed">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 id="showcase-heading">{safeTitle}</h2>
            <p>{safeSubtitle}</p>
            <p>No showcase items available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="sticker-showcase" aria-labelledby="showcase-heading" style={{ width: '100vw', marginLeft: '50%', transform: 'translateX(-50%)' }}>
      <div className="showcase-fullbleed">
        <FullBleedCarousel items={items} index={index} onChange={setIndex} containerRef={containerRef} onManualNavigate={resetAutoSlide} />

        <div ref={overlayRef} className={`showcase-overlay floating`}>
          <div className="card" style={{ padding: 14 }}>
            <h2 id="showcase-heading" style={{ marginTop: 0, marginBottom: 4, fontWeight: 900, fontSize: '18px' }}>
              {(items && items[index] && items[index].unique && items[index].unique.title) ? items[index].unique.title : safeTitle}
            </h2>
            <p style={{ color: 'var(--muted-ink)', fontWeight: 600, marginTop: 0, fontSize: '14px' }}>
              {safeSubtitle}
            </p>
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18 }}>
              {((items && items[index] && items[index].unique && items[index].unique.bullets) ? items[index].unique.bullets : (safeOverlay && safeOverlay.bullets ? safeOverlay.bullets : [])).map((b) => (
                <li key={b} style={{ fontWeight: 700, fontSize: '14px' }}>{b}</li>
          ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FullBleedCarousel({ items, index, onChange, containerRef, onManualNavigate }: { 
  items: CarouselItem[]; 
  index: number; 
  onChange: (next: number) => void; 
  containerRef: React.RefObject<HTMLDivElement>;
  onManualNavigate: () => void;
}) {
  const go = (delta: number) => {
    // Reset the auto-slide timer when manually navigating
    onManualNavigate();
    if (items && items.length > 0) {
      onChange((index + delta + items.length) % items.length);
    }
  };

  if (!items || items.length === 0) {
    return <div className="fullbleed-carousel" ref={containerRef}><div className="slide active">No items available</div></div>;
  }

  return (
    <div className="fullbleed-carousel" ref={containerRef}>
      {items.map((item, i) => {
        if (!item) return null;
        return (
          <div key={i} className={`slide ${i === index ? 'active' : ''}`}>
            <OptimizedImage
              src={item.image || ''}
              alt={item.caption || ''}
              fill
              quality={80}
              lazy={i > 0}
              className="object-cover"
              maxWidth={1920}
              maxHeight={1080}
            />
          </div>
        );
      })}

      <button className="pill carousel-btn prev" aria-label="Previous" onClick={() => go(-1)}>◀</button>
      <button className="pill carousel-btn next" aria-label="Next" onClick={() => go(1)}>▶</button>
    </div>
  );
}


