import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const MobileModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'default',
  showCloseButton = true,
  className = ""
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'sm:max-w-md',
    default: 'sm:max-w-lg lg:max-w-2xl',
    large: 'sm:max-w-2xl lg:max-w-4xl',
    full: 'sm:max-w-full'
  };

  return (
    <div className="mobile-modal">
      <div className="flex items-center justify-center min-h-screen p-0 sm:p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 mobile-transition"
          onClick={onClose}
        />
        
        <div className={`mobile-modal-content ${sizeClasses[size]} ${className}`}>
          <div className="mobile-modal-body">
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="responsive-flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                {title && (
                  <h2 className="responsive-subheading font-bold text-gray-900 truncate">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="touch-target text-gray-400 hover:text-gray-600 mobile-transition ml-auto"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="mobile-spacing">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileModal;