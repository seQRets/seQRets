'use client';

import { useState, useEffect } from 'react';

export function ConnectionStatus() {
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setMounted(true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
