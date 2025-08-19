'use client';

import { useEffect, useRef, useState } from 'react';
import { ProductWithCarousel } from '@/types/database';

interface EnhancedImagePreloaderProps {
  product: ProductWithCarousel;
  preloadStrategy?: 'aggressive' | 'conservative' | 'smart';
  maxPreloadImages?: number;
  preloadThreshold?: number; // Distance from viewport to start preloading
}

export function EnhancedImagePreloader({ 
  product, 
  preloadStrategy = 'smart',
  maxPreloadImages = 5,
  preloadThreshold = 1000
}: EnhancedImagePreloaderProps) {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all carousel images
  const carouselImages = (product.carousel_items || [])
    .filter(item => item?.is_active && item.image_url)
    .map(item => item.image_url) as string[];

  // Preload image function with error handling
  const preloadImage = async (src: string): Promise<void> => {
    return new Promise((resolve) => {
      if (preloadedImages.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        setPreloadedImages(prev => new Set(prev).add(src));
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to preload image: ${src}`);
        resolve(); // Resolve anyway to prevent blocking
      };
      img.src = src;
    });
  };

  // Preload critical images immediately
  useEffect(() => {
    const criticalImages = carouselImages.slice(0, 2);
    
    const preloadCritical = async () => {
      await Promise.all(criticalImages.map(preloadImage));
    };
    
    preloadCritical();
  }, [carouselImages]);

  // Intersection Observer for smart preloading
  useEffect(() => {
    if (preloadStrategy !== 'smart' || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const remainingImages = carouselImages
              .slice(2, maxPreloadImages)
              .filter(img => !preloadedImages.has(img));
            
            // Preload remaining images when container comes into view
            remainingImages.forEach(preloadImage);
          }
        });
      },
      {
        rootMargin: `${preloadThreshold}px`,
        threshold: 0.1
      }
    );

    observer.observe(containerRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [carouselImages, preloadStrategy, maxPreloadImages, preloadThreshold, preloadedImages]);

  // Conservative preloading - only preload next 2-3 images
  useEffect(() => {
    if (preloadStrategy !== 'conservative') return;

    const conservativeImages = carouselImages.slice(2, 4);
    conservativeImages.forEach(preloadImage);
  }, [carouselImages, preloadStrategy]);

  // Aggressive preloading - preload all images
  useEffect(() => {
    if (preloadStrategy !== 'aggressive') return;

    const aggressiveImages = carouselImages.slice(2);
    aggressiveImages.forEach(preloadImage);
  }, [carouselImages, preloadStrategy]);

  return (
    <>
      {/* Preload critical images */}
      {carouselImages.slice(0, 2).map((imageUrl, index) => (
        <link
          key={`critical-${index}`}
          rel="preload"
          as="image"
          href={imageUrl}
          type="image/webp"
        />
      ))}
      
      {/* Prefetch remaining images based on strategy */}
      {preloadStrategy === 'aggressive' && carouselImages.slice(2).map((imageUrl, index) => (
        <link
          key={`prefetch-${index + 2}`}
          rel="prefetch"
          as="image"
          href={imageUrl}
          type="image/webp"
        />
      ))}
      
      {/* Hidden container for intersection observer */}
      <div 
        ref={containerRef}
        style={{ 
          position: 'absolute', 
          top: '100vh', 
          left: 0, 
          width: '1px', 
          height: '1px',
          opacity: 0,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />
      
      {/* Performance monitoring */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ display: 'none' }}>
          Preloaded: {preloadedImages.size}/{carouselImages.length} images
          Strategy: {preloadStrategy}
        </div>
      )}
    </>
  );
}


