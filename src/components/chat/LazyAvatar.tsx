/**
 * LazyAvatar Component
 * Avatar component with lazy loading using Intersection Observer
 * Requirements: 17.4
 * 
 * Features:
 * - Lazy loading: Images only load when entering viewport (50px margin)
 * - Placeholder support: Shows fallback while loading
 * - Error handling: Gracefully falls back to initials on load failure
 * - Performance: Uses Intersection Observer API for efficient viewport detection
 * 
 * Image Optimization Best Practices:
 * - Use appropriately sized images (e.g., 96x96px for avatars)
 * - Serve images in modern formats (WebP, AVIF) with fallbacks
 * - Use CDN with automatic image optimization when possible
 * - Consider using srcset for responsive images in the future
 */

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface LazyAvatarProps {
  src?: string;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
  /**
   * Root margin for Intersection Observer
   * Default: '50px' - starts loading 50px before entering viewport
   */
  rootMargin?: string;
  /**
   * Placeholder to show while image is loading
   * If not provided, shows fallback
   */
  placeholder?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * LazyAvatar Component
 * Implements lazy loading for avatar images using Intersection Observer
 * Requirements: 17.4
 */
export function LazyAvatar({
  src,
  alt,
  fallback,
  className,
  rootMargin = '50px',
  placeholder,
}: LazyAvatarProps) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  /**
   * Set up Intersection Observer for lazy loading
   * Requirements: 17.4
   */
  useEffect(() => {
    // Skip if no src or already in view
    if (!src || isInView) {
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

    if (avatarRef.current) {
      observer.observe(avatarRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, isInView, rootMargin]);

  /**
   * Handle image load success
   */
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  /**
   * Handle image load error
   */
  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  // If no src, just show fallback
  if (!src) {
    return (
      <Avatar className={className} ref={avatarRef}>
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
    );
  }

  // If error loading image, show fallback
  if (hasError) {
    return (
      <Avatar className={className} ref={avatarRef}>
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={className} ref={avatarRef}>
      {/* Only render AvatarImage when in view */}
      {isInView && (
        <AvatarImage
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(!isLoaded && 'opacity-0')}
        />
      )}
      
      {/* Show placeholder or fallback while loading */}
      <AvatarFallback className={cn(isLoaded && 'opacity-0')}>
        {!isInView || !isLoaded ? (placeholder || fallback) : fallback}
      </AvatarFallback>
    </Avatar>
  );
}
