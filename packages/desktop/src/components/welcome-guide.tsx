import { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ChevronRight } from 'lucide-react';

const WELCOME_GUIDE_KEY = 'seQRets_welcomeGuideShown_v3';

interface WelcomeGuideProps {
  onSecurityAccepted?: () => void;
}

/* ──────────────────────────────────────────────────────────────────────────
 *  Security Warning Modal (desktop-specific)
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
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
          className="fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-xl border border-[hsl(340,4%,20%)] bg-[hsl(0,5%,8%)] text-[hsl(37,10%,89%)] shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        >
          <div className="px-6 pt-5 pb-0">
            <span className="text-xs font-medium tracking-widest uppercase text-[hsl(37,10%,40%)]">
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
              <h2 className="text-2xl font-bold">Before You Begin</h2>
            </div>

            {/* Native security callout */}
            <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-4 mb-4">
              <p className="text-[15px] leading-relaxed text-green-300">
                <strong className="text-green-200">Native Rust crypto, fully
                offline.</strong> No browser, no extensions, no CDN — your secrets
                never leave this machine. Zero knowledge. No accounts. Nothing stored
                online.
              </p>
            </div>

            {/* Responsibility warning */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 mb-4">
              <p className="text-[15px] leading-relaxed text-amber-300">
                <strong className="text-amber-200">Your security is your
                responsibility.</strong> If you lose your password or the minimum
                required Qards, your data is permanently unrecoverable. There are no
                backdoors.
              </p>
            </div>

            {/* Go offline callout */}
            <div className="rounded-lg border border-[hsl(340,4%,25%)] bg-[hsl(340,4%,12%)] p-4 mb-6">
              <p className="text-[15px] leading-relaxed text-[hsl(37,10%,75%)]">
                <strong className="text-[hsl(37,10%,85%)]">Go offline before
                handling secrets.</strong> Disconnect Wi-Fi or unplug Ethernet for
                maximum security. The app works fully offline.
              </p>
            </div>

            <Button
              onClick={handleAccept}
              className="w-full bg-[hsl(340,4%,23%)] text-[hsl(37,10%,89%)] border-0 ring-1 ring-[hsl(340,4%,30%)] hover:bg-black font-semibold text-base py-5 outline-none focus-visible:ring-1 focus-visible:ring-[hsl(340,4%,30%)] focus-visible:ring-offset-0"
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
