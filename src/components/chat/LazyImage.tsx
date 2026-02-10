/**
 * LazyImage Component
 * Image component with lazy loading using Intersection Observer
 * Requirements: 17.4
 * 
 * Features:
 * - Lazy loading: Images only load when entering viewport (configurable margin)
 * - Placeholder support: Shows low-quality placeholder or loading component
 * - Error handling: Displays error component or fallback message
 * - Smooth transitions: Fade-in effect when image loads
 * - Performance: Uses Intersection Observer API for efficient viewport detection
 * 
 * Image Optimization Best Practices:
 * - Use appropriately sized images for the display context
 * - Serve images in modern formats (WebP, AVIF) with fallbacks
 * - Use CDN with automatic image optimization when possible
 * - Provide low-quality image placeholders (LQIP) for better UX
 * - Consider using srcset and sizes attributes for responsive images
 */

import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  /**
   * Placeholder image to show while loading
   * Can be a low-quality image data URL or placeholder URL
   */
  placeholder?: string;
  /**
   * Root margin for Intersection Observer
   * Default: '50px' - starts loading 50px before entering viewport
   */
  rootMargin?: string;
  /**
   * Callback when image loads successfully
   */
  onLoad?: () => void;
  /**
   * Callback when image fails to load
   */
  onError?: () => void;
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
  /**
   * Custom error component
   */
  errorComponent?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * LazyImage Component
 * Implements lazy loading for images using Intersection Observer
 * Requirements: 17.4
 */
export function LazyImage({
  src,
  alt,
  placeholder,
  rootMargin = '50px',
  className,
  onLoad,
  onError,
  loadingComponent,
  errorComponent,
  ...props
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Set up Intersection Observer for lazy loading
   * Requirements: 17.4
   */
  useEffect(() => {
    // Skip if already in view
    if (isInView) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Disconnect observer once image is in view
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold: 0.01, // Trigger when even 1% is visible
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isInView, rootMargin]);

  /**
   * Handle image load success
   */
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  /**
   * Handle image load error
   */
  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    onError?.();
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      data-testid="lazy-image-container"
    >
      {/* Show error component if image failed to load */}
      {hasError && errorComponent ? (
        errorComponent
      ) : (
        <>
          {/* Show placeholder or loading component while loading */}
          {!isLoaded && (loadingComponent || placeholder) && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center bg-muted',
                isLoaded && 'opacity-0'
              )}
              data-testid="lazy-image-placeholder"
            >
              {loadingComponent || (
                placeholder && (
                  <img
                    src={placeholder}
                    alt=""
                    className="w-full h-full object-cover blur-sm"
                    aria-hidden="true"
                  />
                )
              )}
            </div>
          )}

          {/* Actual image - only load when in view */}
          {isInView && (
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                !isLoaded && 'opacity-0'
              )}
              data-testid="lazy-image"
              {...props}
            />
          )}

          {/* Show error fallback if no custom error component */}
          {hasError && !errorComponent && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm"
              data-testid="lazy-image-error"
            >
              Failed to load image
            </div>
          )}
        </>
      )}
    </div>
  );
}
