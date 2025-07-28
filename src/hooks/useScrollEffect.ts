import { useState, useEffect } from 'react';
import { LANDING_CONSTANTS } from '../constants/landing';

export const useScrollEffect = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > LANDING_CONSTANTS.SCROLL_THRESHOLD);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrolled;
}; 