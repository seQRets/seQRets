import { useState, useEffect, useRef, useCallback } from 'react';

const PING_URL = 'https://api.coinbase.com/v2/prices/BTC-USD/buy';
const PING_INTERVAL = 5_000;
const PING_TIMEOUT = 4_000;

// Reusable hook — polls connectivity and returns { isOnline }.
// Used by both the pulsing dot on the menu button and the
// dropdown menu item that shows the human-readable status.
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const checkConnectivity = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT);

    try {
      await fetch(PING_URL, {
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
    const handleOnline = () => { setIsOnline(true); checkConnectivity(); };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkConnectivity();
    const interval = setInterval(checkConnectivity, PING_INTERVAL);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [checkConnectivity]);

  return { isOnline };
}

// Small pulsing dot — red when online (warning), green when offline (safe).
// Designed to sit on top of the menu button as an absolute badge. Hovering
// the dot reveals a small CSS-only tooltip explaining what the colour
// means, so new users don't have to guess.
export function ConnectionDot({ className = '' }: { className?: string }) {
  const { isOnline } = useConnectionStatus();
  const status = isOnline ? 'Online' : 'Offline';
  const guidance = isOnline ? 'Disconnect for safety' : 'Safe to proceed';
  return (
    <span
      className={`group relative inline-flex h-2 w-2 ${className}`}
      role="img"
      aria-label={`Connection status: ${status} — ${guidance}`}
    >
      {isOnline && (
        <span className="absolute -inset-[2px] rounded-full bg-red-500 opacity-75 animate-ping [animation-duration:2.4s]" />
      )}
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${
          isOnline ? 'bg-red-500' : 'bg-green-500'
        }`}
      />
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full mt-2 z-50 hidden whitespace-nowrap rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md group-hover:block"
      >
        <span className="block font-semibold">Connection status: {status}</span>
        <span className="mt-0.5 block text-muted-foreground">{guidance}</span>
      </span>
    </span>
  );
}

// Text-only status indicator for use inside dropdown menu items.
// Red "Online" = warning, Green "Offline" = safe.
export function ConnectionStatusText() {
  const { isOnline } = useConnectionStatus();
  return (
    <span className={isOnline ? 'text-red-500 font-medium' : 'text-green-600 dark:text-green-500 font-medium'}>
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}

// Full rounded-rectangle pill with dot + descriptive text.
// Used in the footer as a secondary, always-present status reference.
export function ConnectionPill() {
  const { isOnline } = useConnectionStatus();
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-medium transition-colors ${
        isOnline
          ? 'bg-red-500/10 border-red-500/30 text-red-500'
          : 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-500'
      }`}
    >
      <span className="relative inline-flex h-2 w-2">
        {isOnline && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping [animation-duration:1.8s]" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            isOnline ? 'bg-red-500' : 'bg-green-500'
          }`}
        />
      </span>
      <span>
        {isOnline ? 'Online — disconnect for safety' : 'Offline — safe to proceed'}
      </span>
    </span>
  );
}
