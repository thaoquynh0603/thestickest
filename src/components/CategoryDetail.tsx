'use client';

import { useEffect, useRef, useState } from 'react';
import { Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import { Product } from '@/types/database';

// Font loaders must be called in module scope
const playfair = Playfair_Display({ subsets: ['latin'] });

interface CategoryDetailProps {
  product: Product;
}

// Helper function to get carousel data from product
const getCarouselData = (product: Product) => {
  return product.carousel_items.map(item => ({
    image: item.image_url,
    title: item.message_h1,
    subtitle: item.message_text,
    position: item.position
  }));
};

// Helper function to get theme from product palette
const getProductTheme = (product: Product) => {
  return {
    overlayBg: product.palette.overlayBg,
    overlayInk: product.palette.overlayInk,
    overlayMuted: product.palette.overlayMuted,
    accent: product.palette.accent,
  };
};

export default function CategoryDetail({ product }: CategoryDetailProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselData = getCarouselData(product);
  const theme = getProductTheme(product);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Auto-advance carousel every 5 seconds
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [carouselData.length]);

  useEffect(() => {
    const container = containerRef.current;
    const overlayEl = overlayRef.current;
    if (!container || !overlayEl) return;

    const computeGap = (): number => {
      const root = document.documentElement;
      const val = getComputedStyle(root).getPropertyValue('--overlay-gap').trim();
      const match = val.match(/([\d.]+)px/);
      return match ? parseFloat(match[1]) : 80;
    };

    const place = (position: string) => {
      const gap = computeGap();
      const containerRect = container.getBoundingClientRect();
      const overlayRect = overlayEl.getBoundingClientRect();
      
      // Add smaller vertical offset to move messages down slightly
      const verticalOffset = 60; // Move messages down by 60px

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

      overlayEl.style.setProperty('--overlay-x', `${Math.max(0, x)}px`);
      overlayEl.style.setProperty('--overlay-y', `${Math.max(0, y)}px`);
    };

    const pos = carouselData[currentSlide]?.position ?? 'center';
    place(pos);

    const onResize = () => place(pos);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [currentSlide, carouselData]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    // Reset timer when manually changing slides
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length);
    }, 5000);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % carouselData.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + carouselData.length) % carouselData.length);
  };

  const themeVars = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ['--hero-overlay-bg' as any]: theme.overlayBg,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ['--hero-overlay-ink' as any]: theme.overlayInk,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ['--hero-overlay-muted' as any]: theme.overlayMuted,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ['--hero-accent' as any]: theme.accent,
    // Page-level theming (backgrounds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ['--category-page-bg' as any]: product.palette.pageBg,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ['--category-breadcrumb-bg' as any]: product.palette.breadcrumbBg,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ['--category-cta-section-bg' as any]: product.palette.ctaSectionBg,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ['--category-process-bg' as any]: product.palette.processBg,
  } as React.CSSProperties;

  const isWedding = product.slug === 'wedding';
  const themeClassName = isWedding ? `wedding-theme ${playfair.className}` : '';

  return (
    <div className={`category-detail-visual ${themeClassName}`} style={themeVars}>
      {/* Breadcrumb */}
      <nav className="breadcrumb-visual">
        <div className="container">
          <Link href="/store" className="breadcrumb-link">Store</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.title}</span>
        </div>
      </nav>

      {/* Full-width Image Carousel */}
      <section className="hero-carousel-section">
        <div className="hero-carousel-container" ref={containerRef}>
          {carouselData.map((slide, index) => (
            <div
              key={index}
              className={`hero-carousel-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
          
          {/* Floating Message Container */}
          <div ref={overlayRef} className="hero-carousel-message-container floating">
            <div className="hero-carousel-message">
              <h1 className="hero-carousel-title">{carouselData[currentSlide].title}</h1>
              <p className="hero-carousel-subtitle">{carouselData[currentSlide].subtitle}</p>
              <button className="cta-button-primary hero-carousel-cta" aria-label="Start design from this category">
                Start Design
              </button>
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

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Create Your {product.title}?</h2>
            <p className="cta-description">
              Start your custom design today and bring your vision to life
            </p>
            <button className="cta-button-primary">
              Start Design Now
            </button>
          </div>
        </div>
      </section>

      {/* Design Process Section */}
      <section className="design-process-section">
        <div className="container">
          <h2 className="process-title">Our Design Process</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="process-step-number">1</div>
              <div className="process-step-content">
                <h3 className="process-step-title">Share Your Vision</h3>
                <p className="process-step-description">
                  Tell us about your idea, share inspiration, or upload existing artwork. 
                  Our team is here to bring your vision to life.
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-step-number">2</div>
              <div className="process-step-content">
                <h3 className="process-step-title">Design Creation</h3>
                <p className="process-step-description">
                  Our expert designers create your custom stickers within {product.design_time}. 
                  We focus on quality and attention to detail.
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-step-number">3</div>
              <div className="process-step-content">
                <h3 className="process-step-title">Review & Revise</h3>
                <p className="process-step-description">
                  Review your design and request unlimited revisions until it's perfect. 
                  Your satisfaction is our priority.
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-step-number">4</div>
              <div className="process-step-content">
                <h3 className="process-step-title">Print & Ship</h3>
                <p className="process-step-description">
                  Once approved, we print your stickers with premium materials and ship 
                  them directly to your door.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
