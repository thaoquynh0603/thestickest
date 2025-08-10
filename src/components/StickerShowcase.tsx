"use client";

import { useEffect, useRef, useState } from 'react';

type PositionClass = 'top-left' | 'top-right' | 'center-left' | 'center-right' | 'bottom-left' | 'bottom-right';
type UniqueOverlay = { title: string; bullets: string[]; position: PositionClass };

type CarouselItem = { image: string; caption: string; features: string[]; unique?: UniqueOverlay };
type Carousel = { title: string; items: CarouselItem[] };
type FeatureLabels = Record<string, string>;

type Props = {
  title: string;
  subtitle: string;
  carousels: Carousel[];
  featureLabels: FeatureLabels;
  overlay?: { title: string; bullets: string[] };
};

export default function StickerShowcase({ title, subtitle, carousels, featureLabels, overlay }: Props) {
  const items = carousels.flatMap((c) => c.items);
  const [index, setIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slide every 3 seconds
  useEffect(() => {
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

    const pos: PositionClass = items[index]?.unique?.position ?? 'bottom-left';
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
              {items[index]?.unique?.title ?? title}
            </h2>
            <p style={{ color: 'var(--muted-ink)', fontWeight: 600, marginTop: 0, fontSize: '14px' }}>
              {subtitle}
            </p>
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18 }}>
              {(items[index]?.unique?.bullets ?? overlay?.bullets ?? []).map((b) => (
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
    onChange((index + delta + items.length) % items.length);
  };

  return (
    <div className="fullbleed-carousel" ref={containerRef}>
      {items.map((item, i) => (
        <div key={i} className={`slide ${i === index ? 'active' : ''}`}>
          <img src={item.image} alt={item.caption} />
        </div>
      ))}

      <button className="pill carousel-btn prev" aria-label="Previous" onClick={() => go(-1)}>◀</button>
      <button className="pill carousel-btn next" aria-label="Next" onClick={() => go(1)}>▶</button>
    </div>
  );
}


