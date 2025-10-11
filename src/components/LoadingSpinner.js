import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8 sm:h-12 sm:w-12',
    lg: 'h-12 w-12 sm:h-16 sm:w-16'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-cricket-navy mx-auto ${sizeClasses[size]} ${className}`}></div>
  );
};

export default LoadingSpinner;