"use client";

import { useEffect, useRef, useState } from 'react';
import { OptimizedImage } from './OptimizedImage';

type PositionClass = 'top-left' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-right';
type UniqueOverlay = { title: string; bullets: string[]; position: PositionClass };

// Type for raw data from JSON that might have string position
type RawUniqueOverlay = { title: string; bullets: string[]; position: string };
type RawCarouselItem = { image: string; caption: string; features: string[]; unique?: RawUniqueOverlay };
type RawCarousel = { title: string; items: RawCarouselItem[] };

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
const validatePosition = (position: string | null | undefined): PositionClass => {
  const validPositions: PositionClass[] = ['top-left', 'top-right', 'center-left', 'center-right', 'bottom-left', 'bottom-right'];
  if (!position || typeof position !== 'string') {
    return 'bottom-left';
  }
  return validPositions.includes(position as PositionClass) ? position as PositionClass : 'bottom-left';
};

// Convert raw carousel data to validated carousel data
const validateCarousels = (rawCarousels: RawCarousel[]): Carousel[] => {
  if (!Array.isArray(rawCarousels)) return [];
  return rawCarousels.map(carousel => {
    if (!carousel || !Array.isArray(carousel.items)) return { title: '', items: [] };
    return {
      title: carousel.title || '',
      items: carousel.items.map(item => {
        if (!item) return { image: '', caption: '', features: [] };
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
  const validatedCarousels = validateCarousels(carousels || []);
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

  return (
    <section id="sticker-showcase" aria-labelledby="showcase-heading" style={{ width: '100vw', marginLeft: '50%', transform: 'translateX(-50%)' }}>
      <div className="showcase-fullbleed">
        <FullBleedCarousel items={items} index={index} onChange={setIndex} containerRef={containerRef} onManualNavigate={resetAutoSlide} />

        <div ref={overlayRef} className={`showcase-overlay floating`}>
          <div className="card" style={{ padding: 14 }}>
            <h2 id="showcase-heading" style={{ marginTop: 0, marginBottom: 4, fontWeight: 900, fontSize: '18px' }}>
              {(items && items[index] && items[index].unique && items[index].unique.title) ? items[index].unique.title : title}
            </h2>
            <p style={{ color: 'var(--muted-ink)', fontWeight: 600, marginTop: 0, fontSize: '14px' }}>
              {subtitle}
            </p>
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18 }}>
              {((items && items[index] && items[index].unique && items[index].unique.bullets) ? items[index].unique.bullets : (overlay && overlay.bullets ? overlay.bullets : [])).map((b) => (
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


