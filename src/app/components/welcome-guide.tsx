'use client';

import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ChevronRight } from 'lucide-react';

const WELCOME_GUIDE_KEY = 'seQRets_welcomeGuideShown_v3';

interface WelcomeGuideProps {
  onSecurityAccepted?: () => void;
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Security Warning Modal (web-specific)
 *  Step 2 (wireframe tour) has been replaced by WelcomeCards on the home page.
 * ────────────────────────────────────────────────────────────────────────── */
export function WelcomeGuide({ onSecurityAccepted }: WelcomeGuideProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const hasSeenGuide = localStorage.getItem(WELCOME_GUIDE_KEY);
      if (!hasSeenGuide) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(WELCOME_GUIDE_KEY, 'true');
    } catch { /* ignore */ }
    setOpen(false);
    onSecurityAccepted?.();
  };

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
          className="fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-xl border border-stone-600 bg-stone-800 text-stone-100 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        >
          <div className="px-6 pt-5 pb-0">
            <span className="text-xs font-medium tracking-widest uppercase text-stone-500">
              Important
            </span>
          </div>

          <div className="px-6 pt-3 pb-6">
            <DialogPrimitive.Title className="sr-only">
              Security Warning
            </DialogPrimitive.Title>

            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <ShieldAlert className="h-9 w-9 text-amber-400 shrink-0" />
              <h2 className="text-2xl font-bold text-stone-100">Before You Begin</h2>
            </div>

            {/* Browser warning */}
            <div className="rounded-lg border border-amber-600/40 bg-amber-900/20 p-4 mb-4">
              <p className="text-[15px] leading-relaxed text-amber-200">
                <strong className="text-amber-300">This is a web app.</strong> All
                encryption runs locally in your browser, but web environments carry
                inherent risks — browser extensions, shared devices, and CDN delivery
                can potentially expose data.
              </p>
            </div>

            {/* Go offline callout */}
            <div className="rounded-lg border border-green-600/40 bg-green-900/20 p-4 mb-4">
              <p className="text-[15px] leading-relaxed text-green-200">
                <strong className="text-green-300">Go offline before handling
                secrets.</strong> Once loaded, the app works fully offline. Disconnect
                Wi-Fi or enable airplane mode for maximum security.
              </p>
            </div>

            {/* Responsibility warning */}
            <div className="rounded-lg border border-stone-600 bg-stone-700/40 p-4 mb-6">
              <p className="text-[15px] leading-relaxed text-stone-300">
                <strong className="text-stone-200">Your security is your
                responsibility.</strong> If you lose your password or the minimum
                required Qards, your data is permanently unrecoverable. There are no
                backdoors.
              </p>
            </div>

            {/* Desktop upsell */}
            <p className="text-sm text-center text-stone-400 mb-6">
              For maximum security, consider the{' '}
              <a
                href="https://seqrets.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-400 hover:text-amber-300"
              >
                seQRets desktop app
              </a>{' '}
              — native Rust crypto, fully offline, no browser attack surface.
            </p>

            <Button
              onClick={handleAccept}
              className="w-full bg-stone-700 text-stone-100 border-0 ring-1 ring-stone-500 hover:bg-stone-600 font-semibold text-base py-5"
            >
              I Understand
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
