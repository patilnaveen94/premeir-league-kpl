// Performance optimization utilities

// Debounce function for search inputs and scroll events
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// Image lazy loading observer
export const createImageObserver = (callback) => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
  }
  return null;
};

// Optimize Firebase queries for mobile
export const optimizeFirebaseQuery = (query, limit = 10) => {
  // Add limit to prevent large data loads on mobile
  return query.limit(limit);
};

// Check if device is mobile
export const isMobile = () => {
  return window.innerWidth <= 768;
};

// Optimize images for mobile
export const getOptimizedImageUrl = (url, isMobile = false) => {
  if (!url) return url;
  
  // If it's a Firebase Storage URL, we can add size parameters
  if (url.includes('firebasestorage.googleapis.com')) {
    const size = isMobile ? '400x400' : '800x800';
    return `${url}?alt=media&size=${size}`;
  }
  
  return url;
};

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);
};

// Memory cleanup for components
export const cleanupResources = (observers = [], timeouts = [], intervals = []) => {
  observers.forEach(observer => observer?.disconnect());
  timeouts.forEach(timeout => clearTimeout(timeout));
  intervals.forEach(interval => clearInterval(interval));
};