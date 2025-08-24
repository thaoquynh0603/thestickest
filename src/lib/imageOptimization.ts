/**
 * Image optimization utilities for better performance
 */

export interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
}

/**
 * Generate responsive image sizes for different viewport widths
 */
export function generateResponsiveSizes(
  baseWidth: number,
  baseHeight: number,
  breakpoints: number[] = [640, 768, 1024, 1280, 1536]
): string {
  const sizes = breakpoints.map(bp => {
    if (bp <= 640) return `${bp}px`;
    if (bp <= 1024) return `${Math.min(bp * 0.8, baseWidth)}px`;
    return `${Math.min(bp * 0.6, baseWidth)}px`;
  });

  return `(max-width: 640px) 100vw, (max-width: 1024px) 80vw, ${Math.min(baseWidth, 1200)}px`;
}

/**
 * Calculate optimal image dimensions based on container and aspect ratio
 */
export function calculateOptimalDimensions(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): { width: number; height: number } {
  let width = containerWidth;
  let height = containerHeight;

  // Maintain aspect ratio
  if (width / height > aspectRatio) {
    width = height * aspectRatio;
  } else {
    height = width / aspectRatio;
  }

  // Apply maximum constraints
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Generate a blur data URL for image placeholders
 */
export function generateBlurDataURL(width: number, height: number, color: string = '#f0f0f0'): string {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    // Return a simple data URL for SSR
    return `data:image/svg+xml;base64,${btoa(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/></svg>`)}`;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle pattern
    ctx.fillStyle = '#e0e0e0';
    for (let i = 0; i < width; i += 20) {
      for (let j = 0; j < height; j += 20) {
        if ((i + j) % 40 === 0) {
          ctx.fillRect(i, j, 10, 10);
        }
      }
    }
  }
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Preload critical images
 */
export function preloadCriticalImages(urls: string[]): Promise<void[]> {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      img.src = url;
    });
  });
  
  return Promise.all(promises);
}

/**
 * Lazy load images using Intersection Observer
 */
export function createLazyLoader(
  selector: string,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  // Check if we're in a browser environment
  if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return null;
  }

  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  }, defaultOptions);

  // Observe all images with data-src attribute
  const images = document.querySelectorAll(selector);
  images.forEach(img => observer.observe(img));

  return observer;
}

/**
 * Get image format support for the current browser
 */
export function getImageFormatSupport(): Promise<{
  webp: boolean;
  avif: boolean;
  jpeg: boolean;
  png: boolean;
}> {
  return new Promise((resolve) => {
    // Check if we're in a browser environment
    if (typeof document === 'undefined') {
      // Return default values for SSR
      resolve({
        webp: false,
        avif: false,
        jpeg: true,
        png: true
      });
      return;
    }

    const formats = ['webp', 'avif', 'jpeg', 'png'];
    const results = {
      webp: false,
      avif: false,
      jpeg: false,
      png: false
    };
    
    formats.forEach(format => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      try {
        const dataURL = canvas.toDataURL(`image/${format}`);
        if (format === 'webp') results.webp = dataURL.indexOf('data:image/webp') === 0;
        if (format === 'avif') results.avif = dataURL.indexOf('data:image/avif') === 0;
        if (format === 'jpeg') results.jpeg = dataURL.indexOf('data:image/jpeg') === 0;
        if (format === 'png') results.png = dataURL.indexOf('data:image/png') === 0;
      } catch {
        // Format not supported, keep default false value
      }
    });
    
    resolve(results);
  });
}

/**
 * Optimize image quality based on device capabilities
 */
export function getOptimalQuality(
  devicePixelRatio: number = 1,
  connectionType?: string
): number {
  // Lower quality for high DPI displays to save bandwidth
  if (devicePixelRatio > 2) {
    return 70;
  }
  
  // Lower quality for slow connections
  if (connectionType === 'slow-2g' || connectionType === '2g') {
    return 60;
  }
  
  if (connectionType === '3g') {
    return 75;
  }
  
  // Default quality for fast connections
  return 85;
}

/**
 * Create a responsive image srcset
 */
export function createResponsiveSrcset(
  baseUrl: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1920],
  format: string = 'webp'
): string {
  return widths
    .map(width => `${baseUrl}?w=${width}&f=${format} ${width}w`)
    .join(', ');
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
