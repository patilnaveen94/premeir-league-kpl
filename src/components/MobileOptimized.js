import React from 'react';

// Mobile-optimized card component
export const MobileCard = ({ children, className = '', onClick }) => (
  <div 
    className={`bg-white rounded-lg shadow-sm hover:shadow-md p-3 sm:p-4 border border-gray-100 transition-shadow duration-200 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

// Mobile-optimized button
export const MobileButton = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 touch-manipulation active:scale-95';
  
  const variants = {
    primary: 'bg-cricket-navy hover:bg-cricket-navy/90 active:bg-cricket-navy/95 text-white',
    secondary: 'bg-cricket-orange hover:bg-cricket-orange/90 active:bg-cricket-orange/95 text-white',
    outline: 'border-2 border-cricket-navy text-cricket-navy hover:bg-cricket-navy hover:text-white'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Mobile-optimized input
export const MobileInput = ({ className = '', ...props }) => (
  <input 
    className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cricket-navy focus:border-transparent text-base ${className}`}
    {...props}
  />
);

// Mobile-optimized select
export const MobileSelect = ({ children, className = '', ...props }) => (
  <select 
    className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cricket-navy focus:border-transparent text-base bg-white ${className}`}
    {...props}
  >
    {children}
  </select>
);

// Mobile-optimized modal
export const MobileModal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-lg max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 touch-btn"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized grid
export const MobileGrid = ({ children, cols = 1, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };
  
  return (
    <div className={`grid ${gridCols[cols]} gap-4 sm:gap-6 ${className}`}>
      {children}
    </div>
  );
};

// Mobile-optimized section
export const MobileSection = ({ children, className = '', padding = true }) => (
  <section className={`${padding ? 'py-8 sm:py-12 px-4 sm:px-6 lg:px-8' : ''} ${className}`}>
    <div className="max-w-7xl mx-auto">
      {children}
    </div>
  </section>
);