
'use client';

import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const WELCOME_GUIDE_KEY = 'seQRets_welcomeGuideShown_v2';

interface WelcomeGuideProps {
  activeTab: 'create' | 'restore';
}

export function WelcomeGuide({ activeTab }: WelcomeGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const hasSeenGuide = localStorage.getItem(WELCOME_GUIDE_KEY);
      if (!hasSeenGuide) {
        setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    try {
      localStorage.setItem(WELCOME_GUIDE_KEY, 'true');
    } catch { /* ignore */ }
    setIsOpen(false);
    setStep(0);
  };

  const steps = [
    // ── Card 1: Welcome ──────────────────────────────────────────
    {
      icon: null,
      title: '',
      body: (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <img src="/icons/logo-dark.webp" alt="seQRets logo" className="h-16 w-16" />
            <div>
              <div className="text-3xl font-bold text-stone-100">seQRets</div>
              <div className="text-sm tracking-wide text-stone-400">Secure. Split. Share.</div>
            </div>
          </div>
          <p className="text-base text-center leading-relaxed text-stone-300">
            Protect your secrets today — ensure the right people
            can access them tomorrow.
          </p>
          <div className="rounded-md border border-amber-600/40 bg-amber-900/20 px-3 py-2.5 text-sm text-amber-200">
            Upgrade to the{' '}
            <a href="https://seqrets.app" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-amber-300 hover:text-amber-100">
              seQRets desktop app
            </a>{' '}
            (paid) for EAL6+ smart card storage, digital inheritance planning,
            and fully secure offline operation.
          </div>
        </div>
      ),
      button: 'Next',
    },
    // ── Card 2: Features ─────────────────────────────────────────
    {
      icon: <Sparkles className="h-10 w-10 text-amber-400" />,
      title: 'What Can You Do?',
      body: (
        <ul className="space-y-2.5 text-base text-stone-300">
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&bull;</span>Encrypt and split secrets into QR &ldquo;Qards&rdquo;</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&bull;</span>Restore by scanning, uploading, or pasting</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&bull;</span>View restored secrets as Data QR or SeedQR</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&bull;</span>Create encrypted inheritance plans</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&bull;</span>Generate secure passwords and BIP-39 seed phrases</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">&bull;</span>Ask Bob, your AI assistant, for guidance</li>
        </ul>
      ),
      button: 'Next',
    },
    // ── Card 3: Security Warning ─────────────────────────────────
    {
      icon: <AlertTriangle className="h-10 w-10 text-amber-400" />,
      title: 'Before You Begin',
      body: (
        <>
          <div className="rounded-md border border-amber-600/40 bg-amber-900/20 p-3">
            <p className="text-base text-center text-amber-200">
              This is a web app. All encryption runs locally, but browsers
              carry risks from extensions, shared environments, and CDN delivery.
            </p>
          </div>
          <div className="mt-3 rounded-md border border-green-600/40 bg-green-900/20 p-3 space-y-2">
            <p className="text-base text-center text-green-200">
              Go offline before handling secrets. The app works fully offline once loaded.
            </p>
            <p className="text-base text-center text-green-200">
              For maximum security, use the{' '}
              <a href="https://seqrets.app" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-green-300 hover:text-green-100">
                seQRets desktop app
              </a>{' '}
              (paid).
            </p>
          </div>
        </>
      ),
      button: 'I Understand & Accept',
    },
  ];

  const current = steps[step];

  return (
    <DialogPrimitive.Root open={isOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border border-stone-600 bg-stone-800 text-stone-100 p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        >
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  i <= step ? 'bg-amber-400' : 'bg-stone-600'
                )}
              />
            ))}
          </div>

          {/* Header */}
          {current.title ? (
            <div className="flex items-center justify-center gap-3 mb-3">
              {current.icon}
              <DialogPrimitive.Title className="text-2xl font-bold text-stone-100">{current.title}</DialogPrimitive.Title>
            </div>
          ) : (
            <DialogPrimitive.Title className="sr-only">Welcome to seQRets</DialogPrimitive.Title>
          )}

          {/* Body – fixed height so all slides share the same dimensions */}
          <div className="mb-6 flex flex-col justify-center" style={{ height: current.title ? 228 : 280 }}>{current.body}</div>

          {/* Action */}
          <Button
            onClick={step < steps.length - 1 ? () => setStep(step + 1) : handleClose}
            className="w-full bg-stone-700 text-stone-100 border-0 ring-1 ring-stone-500 hover:bg-stone-600 font-semibold"
          >
            {current.button}
            {step < steps.length - 1 && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
