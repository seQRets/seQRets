'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const PING_INTERVAL = 5_000; // 5 seconds
const PING_TIMEOUT = 4_000; // 4 second fetch timeout

export function ConnectionStatus() {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const checkConnectivity = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT);

    try {
      await fetch('/ping', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    // Fast-path hints from browser events
    const handleOnline = () => { setIsOnline(true); checkConnectivity(); };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic ping as source of truth
    checkConnectivity();
    const interval = setInterval(checkConnectivity, PING_INTERVAL);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [checkConnectivity]);

  // Render consistent structure for SSR, update colors/text after mount
  const online = mounted ? isOnline : true;

  return (
    <span className="inline-flex items-center gap-1.5" suppressHydrationWarning>
      <span
        suppressHydrationWarning
        className={`inline-block h-2 w-2 rounded-full ${
          online ? 'bg-red-500' : 'bg-green-500'
        }`}
      />
      <span suppressHydrationWarning className={online ? 'text-red-500' : 'text-green-500'}>
        {online ? 'Online' : 'Offline'}
      </span>
    </span>
  );
}
