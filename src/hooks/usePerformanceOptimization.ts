import { useEffect, useCallback } from 'react';

export const usePerformanceOptimization = () => {
  // Preload critical resources
  useEffect(() => {
    // Preload fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'prefetch';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
    document.head.appendChild(fontLink);

    // Enable hardware acceleration for smooth animations
    document.documentElement.style.setProperty('transform', 'translateZ(0)');

    return () => {
      document.head.removeChild(fontLink);
    };
  }, []);

  // Optimize scroll performance
  const optimizeScrolling = useCallback(() => {
    let ticking = false;

    const update = () => {
      // Update scroll-related optimizations
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });

    return () => {
      window.removeEventListener('scroll', requestTick);
    };
  }, []);

  // Image lazy loading optimization
  const observeImages = useCallback(() => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });

      return () => imageObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    const cleanupScroll = optimizeScrolling();
    const cleanupImages = observeImages();

    return () => {
      cleanupScroll?.();
      cleanupImages?.();
    };
  }, [optimizeScrolling, observeImages]);

  return {
    optimizeScrolling,
    observeImages
  };
};