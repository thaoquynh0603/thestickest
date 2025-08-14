'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/database';

interface CarouselItem {
  id: string;
  image_url: string;
  is_active: boolean | null;
  message_h1: string;
  message_text: string | null;
  position: string | null;
  product_id: string | null;
  sort_order: number | null;
}

interface CarouselSectionProps {
  product: Product & {
    carousel_items?: CarouselItem[];
  };
}

interface CarouselData {
  image: string;
  title: string;
  subtitle: string;
  position: string;
  positionClass: string;
}

export function CarouselSection({ product }: CarouselSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set());
  const [carouselData, setCarouselData] = useState<CarouselData[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Load server-side processed data
  useEffect(() => {
    const dataScript = document.getElementById('carousel-data');
    if (dataScript) {
      try {
        const data = JSON.parse(dataScript.textContent || '[]');
        setCarouselData(data);
      } catch (error) {
        console.error('Error parsing carousel data:', error);
        // Fallback to client-side processing with null check
        const fallbackData = (product.carousel_items || [])
          .filter((item): item is CarouselItem & { 
            is_active: true; 
            sort_order: number;
            image_url: string;
            message_h1: string;
          } => (
            item.is_active === true && 
            item.sort_order !== null && 
            !!item.image_url && 
            !!item.message_h1
          ))
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map(item => ({
            image: item.image_url,
            title: item.message_h1,
            subtitle: item.message_text || '',
            position: item.position || 'center',
            positionClass: getPositionClass(item.position || 'center')
          }));
        setCarouselData(fallbackData);
      }
    }
  }, [product]);

  // Load theme data from server
  useEffect(() => {
    const themeScript = document.getElementById('theme-data');
    if (themeScript) {
      try {
        const themeData = JSON.parse(themeScript.textContent || '{}');
        // Apply theme variables to document root
        Object.entries(themeData).forEach(([key, value]) => {
          document.documentElement.style.setProperty(key, value as string);
        });
      } catch (error) {
        console.error('Error parsing theme data:', error);
      }
    }
  }, []);

  // Memoized gap calculation
  const getGap = useCallback((): number => {
    const root = document.documentElement;
    const val = getComputedStyle(root).getPropertyValue('--overlay-gap').trim();
    const match = val.match(/([\d.]+)px/);
    return match ? parseFloat(match[1]) : 80;
  }, []);

  // Optimized positioning function
  const updatePosition = useCallback(() => {
    const container = containerRef.current;
    const overlayEl = overlayRef.current;
    if (!container || !overlayEl || carouselData.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const overlayRect = overlayEl.getBoundingClientRect();
    const gap = getGap();
    const pos = carouselData[currentSlide]?.position ?? 'center';
    
    const { x, y } = calculatePosition(pos, containerRect, overlayRect, gap);
    
    overlayEl.style.setProperty('--overlay-x', `${x}px`);
    overlayEl.style.setProperty('--overlay-y', `${y}px`);
  }, [currentSlide, carouselData, getGap]);

  // Handle image loading
  const handleImageLoad = useCallback((index: number) => {
    setImagesLoaded(prev => new Set(prev).add(index));
  }, []);

  // Preload next image
  useEffect(() => {
    if (carouselData.length > 0) {
      const nextIndex = (currentSlide + 1) % carouselData.length;
      const img = new window.Image();
      img.src = carouselData[nextIndex]?.image || '';
    }
  }, [currentSlide, carouselData]);

  // Auto-advance carousel with optimized interval management
  useEffect(() => {
    if (carouselData.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselData.length);
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [carouselData.length]);

  // Update position when slide changes or on resize
  useEffect(() => {
    updatePosition();
    
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updatePosition]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    // Reset timer when manually changing slides
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length);
    }, 5000);
  }, [carouselData.length]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % carouselData.length);
  }, [currentSlide, carouselData.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + carouselData.length) % carouselData.length);
  }, [currentSlide, carouselData.length, goToSlide]);

  // Don't render until data is loaded
  if (carouselData.length === 0) {
    return null;
  }

  return (
    <section className="hero-carousel-section">
      <div className="hero-carousel-container" ref={containerRef}>
        {carouselData.map((slide, index) => (
          <div
            key={index}
            className={`hero-carousel-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              sizes="100vw"
              priority={index === 0}
              quality={85}
              onLoad={() => handleImageLoad(index)}
              className="object-cover"
              style={{ 
                opacity: imagesLoaded.has(index) ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out'
              }}
            />
          </div>
        ))}
        
        {/* Floating Message Container */}
        <div ref={overlayRef} className="hero-carousel-message-container floating">
          <div className="hero-carousel-message">
            <h1 className="hero-carousel-title">{carouselData[currentSlide].title}</h1>
            <p className="hero-carousel-subtitle">{carouselData[currentSlide].subtitle}</p>
            <Link href={`/store/${product.slug}/design`} className="cta-button-primary hero-carousel-cta" aria-label="Start design from this category">
              Start Design
            </Link>
          </div>
        </div>
        
        {/* Carousel Navigation */}
        <button 
          className="carousel-nav-btn carousel-nav-prev" 
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button 
          className="carousel-nav-btn carousel-nav-next" 
          onClick={nextSlide}
          aria-label="Next slide"
        >
          ›
        </button>

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {carouselData.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Optimized positioning calculation with memoization
function calculatePosition(position: string, containerRect: DOMRect, overlayRect: DOMRect, gap: number = 80) {
  const verticalOffset = 60;
  let x = gap;
  let y = gap;

  switch (position) {
    case 'center':
      x = containerRect.width / 2 - overlayRect.width / 2;
      y = containerRect.height / 2 - overlayRect.height / 2 + verticalOffset;
      break;
    case 'top-left':
      x = gap;
      y = gap + verticalOffset;
      break;
    case 'top-center':
      x = containerRect.width / 2 - overlayRect.width / 2;
      y = gap + verticalOffset;
      break;
    case 'top-right':
      x = containerRect.width - overlayRect.width - gap;
      y = gap + verticalOffset;
      break;
    case 'center-left':
      x = gap;
      y = containerRect.height / 2 - overlayRect.height / 2 + verticalOffset;
      break;
    case 'center-right':
      x = containerRect.width - overlayRect.width - gap;
      y = containerRect.height / 2 - overlayRect.height / 2 + verticalOffset;
      break;
    case 'bottom-left':
      x = gap;
      y = containerRect.height - overlayRect.height - gap;
      break;
    case 'bottom-center':
      x = containerRect.width / 2 - overlayRect.width / 2;
      y = containerRect.height - overlayRect.height - gap;
      break;
    case 'bottom-right':
      x = containerRect.width - overlayRect.width - gap;
      y = containerRect.height - overlayRect.height - gap;
      break;
  }

  // Ensure the message stays within the carousel bounds
  const maxY = containerRect.height - overlayRect.height - gap;
  y = Math.min(y, maxY);

  return { x: Math.max(0, x), y: Math.max(0, y) };
}

// Helper function to get CSS position classes
function getPositionClass(position: string): string {
  const positionMap: Record<string, string> = {
    'center': 'position-center',
    'top-left': 'position-top-left',
    'top-center': 'position-top-center',
    'top-right': 'position-top-right',
    'center-left': 'position-center-left',
    'center-right': 'position-center-right',
    'bottom-left': 'position-bottom-left',
    'bottom-center': 'position-bottom-center',
    'bottom-right': 'position-bottom-right'
  };
  
  return positionMap[position] || 'position-center';
}
