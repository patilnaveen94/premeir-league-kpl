import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ end, duration = 2000, className = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };
    
    requestAnimationFrame(updateCount);
  }, [end, duration]);

  return <span className={className}>{count}</span>;
};

export default AnimatedCounter;