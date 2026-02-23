import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Shield, Sparkles, AlertTriangle, ChevronRight } from 'lucide-react';
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
      icon: <Shield className="h-8 w-8 text-amber-400" />,
      title: 'Welcome to seQRets',
      body: (
        <p className="text-sm leading-relaxed text-[hsl(37,10%,75%)]">
          seQRets helps you protect your most sensitive information today — and
          make sure the right people can access it tomorrow. Encrypt, split, and
          store your secrets using military-grade encryption and Shamir&apos;s
          Secret Sharing. Nothing stored online. No accounts. No KYC. Nothing
          shared with anyone you don&apos;t choose.
        </p>
      ),
      button: 'Next',
    },
    // ── Card 2: Features ─────────────────────────────────────────
    {
      icon: <Sparkles className="h-8 w-8 text-amber-400" />,
      title: 'What Can You Do?',
      body: (
        <ul className="space-y-1.5 text-sm text-[hsl(37,10%,75%)]">
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Encrypt secrets with native Rust crypto (XChaCha20-Poly1305 + Argon2id)</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Split into Shamir shares as scannable QR &ldquo;Qards&rdquo; — print them, store digitally, or distribute to trusted people</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Restore by scanning, uploading, or pasting Qards</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>View restored secrets as Data QR or SeedQR (BIP-39)</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Store shares, vaults, keyfiles, and inheritance plans on EAL6+ JavaCard smart cards</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Build structured inheritance plans in-app</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Clone smart cards for redundant physical backups</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Generate secure passwords and BIP-39 seed phrases</li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span>Ask Bob, your AI assistant, for guidance</li>
        </ul>
      ),
      button: 'Next',
    },
    // ── Card 3: Security ─────────────────────────────────────────
    {
      icon: <AlertTriangle className="h-8 w-8 text-amber-400" />,
      title: 'Before You Begin',
      body: (
        <>
          <div className="rounded-md border border-green-500/30 bg-green-950/20 p-3 space-y-2">
            <p className="text-sm font-semibold text-green-300">
              You&apos;re using the desktop app — the most secure way to run seQRets:
            </p>
            <ul className="space-y-1 text-sm text-[hsl(37,10%,75%)]">
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span>Native Rust cryptography with guaranteed key zeroization</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span>No browser extensions, no CDN, no shared JavaScript environment</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span>Runs fully offline — no network required after installation</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span>EAL6+ smart card support for tamper-resistant physical backups</li>
            </ul>
          </div>
          <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-950/20 p-3 space-y-2">
            <p className="text-sm text-amber-300">
              <strong>Your security is your responsibility.</strong> If you lose
              your password or the required number of Qards, your secret is gone
              forever. The developers cannot recover your data.
            </p>
            <p className="text-sm text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <span>For maximum security, disconnect from the internet before handling
              secrets.</span>
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
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border border-[hsl(340,4%,20%)] bg-[hsl(0,5%,8%)] text-[hsl(37,10%,89%)] p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        >
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  i <= step ? 'bg-amber-400' : 'bg-[hsl(340,4%,30%)]'
                )}
              />
            ))}
          </div>

          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {current.icon}
            <DialogPrimitive.Title className="text-2xl font-bold">{current.title}</DialogPrimitive.Title>
          </div>

          {/* Body */}
          <div className="mb-6">{current.body}</div>

          {/* Action */}
          <Button
            onClick={step < steps.length - 1 ? () => setStep(step + 1) : handleClose}
            className="w-full bg-[hsl(340,4%,23%)] text-[hsl(37,10%,89%)] border-0 ring-1 ring-[hsl(340,4%,30%)] hover:bg-black font-semibold outline-none focus-visible:ring-1 focus-visible:ring-[hsl(340,4%,30%)] focus-visible:ring-offset-0"
          >
            {current.button}
            {step < steps.length - 1 && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
