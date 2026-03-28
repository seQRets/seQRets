import { useState, useEffect, useRef, useCallback } from 'react';

const PING_URL = 'https://app.seqrets.app/ping';
const PING_INTERVAL = 5_000; // 5 seconds
const PING_TIMEOUT = 4_000; // 4 second fetch timeout

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const checkConnectivity = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT);

    try {
      await fetch(PING_URL, {
        mode: 'no-cors',
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

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          isOnline ? 'bg-red-500' : 'bg-green-500'
        }`}
      />
      <span className={isOnline ? 'text-red-500' : 'text-green-500'}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </span>
  );
}
