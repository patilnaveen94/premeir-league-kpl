import { useState, useEffect, useCallback } from 'react';
import { debounce, throttle, isMobile } from '../utils/performance';

// Custom hook for mobile optimization
export const useMobileOptimization = () => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobileDevice(isMobile());
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    const debouncedResize = debounce(checkMobile, 250);
    window.addEventListener('resize', debouncedResize);

    // Network status monitoring
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection type detection
    if ('connection' in navigator) {
      const connection = navigator.connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Optimize data loading based on connection
  const shouldLoadHighQuality = useCallback(() => {
    if (!isOnline) return false;
    if (connectionType === 'slow-2g' || connectionType === '2g') return false;
    return true;
  }, [isOnline, connectionType]);

  // Get optimal image quality
  const getImageQuality = useCallback(() => {
    if (!shouldLoadHighQuality()) return 'low';
    if (connectionType === '3g') return 'medium';
    return 'high';
  }, [shouldLoadHighQuality, connectionType]);

  // Get optimal pagination size
  const getOptimalPageSize = useCallback(() => {
    if (!isOnline) return 5;
    if (isMobileDevice) {
      if (connectionType === 'slow-2g' || connectionType === '2g') return 5;
      if (connectionType === '3g') return 10;
      return 15;
    }
    return 20;
  }, [isMobileDevice, isOnline, connectionType]);

  return {
    isMobileDevice,
    isOnline,
    connectionType,
    shouldLoadHighQuality: shouldLoadHighQuality(),
    imageQuality: getImageQuality(),
    optimalPageSize: getOptimalPageSize()
  };
};

// Hook for scroll optimization
export const useScrollOptimization = (callback, deps = []) => {
  useEffect(() => {
    const throttledCallback = throttle(callback, 100);
    window.addEventListener('scroll', throttledCallback, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledCallback);
    };
  }, deps);
};

// Hook for intersection observer (lazy loading)
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [targetRef, setTargetRef] = useState(null);

  useEffect(() => {
    if (!targetRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(targetRef);

    return () => {
      observer.disconnect();
    };
  }, [targetRef, options]);

  return [setTargetRef, isIntersecting];
};