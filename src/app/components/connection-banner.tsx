'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

// Active probe: matches ConnectionStatus's detection path (HEAD /ping every 5s
// with a 4s timeout). Having a dedicated hook here keeps this component
// standalone so adding/removing it doesn't perturb the existing footer indicator.

const PING_INTERVAL = 5_000;
const PING_TIMEOUT = 4_000;

export function ConnectionBanner() {
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

  // Preserve project convention: red = online (bad for handling secrets),
  // green = offline (good). See CLAUDE.md.
  const online = mounted ? isOnline : true;

  return (
    <motion.div
      suppressHydrationWarning
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="status"
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
        online
          ? 'border-red-500/40 bg-red-500/10'
          : 'border-green-500/40 bg-green-500/10'
      }`}
    >
      <div className="relative flex items-center justify-center w-5 h-5 shrink-0 mt-0.5">
        {online && (
          <span
            suppressHydrationWarning
            className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60 animate-ping"
          />
        )}
        <span
          suppressHydrationWarning
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            online ? 'bg-red-500' : 'bg-green-500'
          }`}
        />
      </div>
      <div className="flex-1 text-sm leading-snug">
        {online ? (
          <>
            <p className="font-semibold text-red-500">You are online</p>
            <p className="text-muted-foreground mt-0.5">
              For the strongest safety margin, turn off Wi-Fi or unplug Ethernet before handling your secrets.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-green-500">You are offline</p>
            <p className="text-muted-foreground mt-0.5">
              Safe to proceed — nothing can leave this device.
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
