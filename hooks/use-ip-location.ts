import { useState, useCallback, useEffect } from 'react';

interface LocationData {
  city?: string;
  region?: string;
  country_name?: string;
  ip: string;
}

interface LocationCache {
  [ip: string]: LocationData | null | 'error';
}

const locationCache: LocationCache = {};
const requestQueue: string[] = [];
const processingQueue = new Set<string>();
let isProcessing = false;
let cacheUpdateListeners: (() => void)[] = [];
let requestDelay = 2000; // Start with 2 seconds
let consecutiveErrors = 0;

const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  const ip = requestQueue.shift();
  
  if (ip && !processingQueue.has(ip)) {
    processingQueue.add(ip);
    
    try {
      if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || 
          ip.startsWith('10.') || ip.startsWith('172.')) {
        locationCache[ip] = { ip, city: 'Local', region: 'Network', country_name: 'Local' };
        consecutiveErrors = 0;
      } else {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        
        if (response.status === 429) {
          // Rate limited - increase delay and re-queue
          requestDelay = Math.min(requestDelay * 2, 30000); // Max 30 seconds
          consecutiveErrors++;
          requestQueue.unshift(ip); // Put back at front
          console.warn(`Rate limited. Increasing delay to ${requestDelay}ms`);
        } else if (response.ok) {
          const data = await response.json();
          if (!data.error) {
            locationCache[ip] = {
              ip,
              city: data.city || 'Unknown',
              region: data.region || 'Unknown',
              country_name: data.country_name || 'Unknown'
            };
            consecutiveErrors = 0;
            requestDelay = Math.max(requestDelay * 0.9, 2000); // Gradually reduce delay
          } else {
            locationCache[ip] = { ip, city: 'Unknown', region: 'Unknown', country_name: 'Unknown' };
          }
        } else {
          locationCache[ip] = 'error';
        }
      }
    } catch (error) {
      locationCache[ip] = 'error';
      consecutiveErrors++;
    }
    
    processingQueue.delete(ip);
    cacheUpdateListeners.forEach(listener => listener());
  }
  
  isProcessing = false;
  
  if (requestQueue.length > 0) {
    const delay = consecutiveErrors > 3 ? requestDelay * 2 : requestDelay;
    setTimeout(processQueue, delay);
  }
};

export const preloadLocation = (ip: string) => {
  if (!ip || locationCache[ip] !== undefined || requestQueue.includes(ip) || processingQueue.has(ip)) {
    return;
  }
  requestQueue.push(ip);
  processQueue();
};

export function useIpLocation() {
  const [, forceUpdate] = useState({});

  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  useEffect(() => {
    cacheUpdateListeners.push(triggerUpdate);
    return () => {
      cacheUpdateListeners = cacheUpdateListeners.filter(l => l !== triggerUpdate);
    };
  }, [triggerUpdate]);

  const getLocation = useCallback((ip: string): LocationData | null => {
    if (!ip) return null;
    const cached = locationCache[ip];
    return (cached && cached !== 'error') ? cached : null;
  }, []);

  return { getLocation };
}