"use client";

import { useEffect } from 'react';

export function DynamicTitle() {
  useEffect(() => {
    const updateTitle = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const cleanHostname = hostname.startsWith('www.') ? hostname.substring(4) : hostname;
        document.title = cleanHostname;
      }
    };

    // Set title immediately
    setTimeout(updateTitle, 0);
    
    // Also set on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateTitle);
    } else {
      updateTitle();
    }
    
    return () => {
      document.removeEventListener('DOMContentLoaded', updateTitle);
    };
  }, []);

  return null;
}