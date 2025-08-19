'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  // Custom props for performance
  lazy?: boolean;
  aspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality = 75,
  sizes = '100vw',
  className = '',
  style = {},
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  lazy = true,
  aspectRatio,
  maxWidth,
  maxHeight,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // Handle image loading states
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Fallback to a placeholder if image fails to load
  useEffect(() => {
    if (hasError) {
      setImageSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzIyNS4yMjkgMTUwIDI0NSAxMzAuMjI5IDI0NSAxMDVDMjQ1IDc5Ljc3MSAyMjUuMjI5IDYwIDIwMCA2MEMxNzQuNzcxIDYwIDE1NSA3OS43NzEgMTU1IDEwNUwxNTUgMTUwSDIwMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDIwQzIwIDguOTU0IDI4Ljk1NCAwIDQwIDBDMzEuMDQ2IDAgMjAgOC45NTQgMjAgMjBaIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo8L3N2Zz4K');
    }
  }, [hasError]);

  // Calculate responsive dimensions
  const getResponsiveDimensions = () => {
    if (fill) return { fill: true };
    
    let finalWidth = width;
    let finalHeight = height;

    if (aspectRatio && finalWidth) {
      finalHeight = Math.round(finalWidth / aspectRatio);
    } else if (aspectRatio && finalHeight) {
      finalWidth = Math.round(finalHeight * aspectRatio);
    }

    if (maxWidth && finalWidth && finalWidth > maxWidth) {
      finalWidth = maxWidth;
      if (finalHeight) {
        finalHeight = Math.round((finalHeight * maxWidth) / width!);
      }
    }

    if (maxHeight && finalHeight && finalHeight > maxHeight) {
      finalHeight = maxHeight;
      if (finalWidth) {
        finalWidth = Math.round((finalWidth * maxHeight) / height!);
      }
    }

    return {
      width: finalWidth,
      height: finalHeight,
    };
  };

  // Generate responsive sizes for better performance
  const getResponsiveSizes = () => {
    if (sizes !== '100vw') return sizes;
    
    if (fill) {
      return '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw';
    }
    
    if (width && width <= 640) {
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    }
    
    return '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw';
  };

  const dimensions = getResponsiveDimensions();
  const responsiveSizes = getResponsiveSizes();

  return (
    <div 
      className={`optimized-image-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <Image
        {...dimensions}
        src={imageSrc}
        alt={alt}
        priority={priority || !lazy}
        quality={quality}
        sizes={responsiveSizes}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={`optimized-image ${isLoaded ? 'loaded' : 'loading'}`}
        style={{
          transition: 'opacity 0.3s ease-in-out',
          opacity: isLoaded ? 1 : 0.7,
        }}
        {...props}
      />
      
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div 
          className="image-skeleton"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'loading 1.5s infinite',
            borderRadius: 'inherit',
          }}
        />
      )}
      
      {/* Error state */}
      {hasError && (
        <div 
          className="image-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f9fa',
            color: '#6c757d',
            fontSize: '14px',
            textAlign: 'center',
            padding: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
            <div>Image failed to load</div>
          </div>
        </div>
      )}
    </div>
  );
}

// CSS for loading animation
const loadingStyles = `
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  .optimized-image-container {
    position: relative;
    overflow: hidden;
  }
  
  .optimized-image.loading {
    opacity: 0.7;
  }
  
  .optimized-image.loaded {
    opacity: 1;
  }
  
  .image-skeleton {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: inherit;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'optimized-image-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = loadingStyles;
    document.head.appendChild(style);
  }
}
