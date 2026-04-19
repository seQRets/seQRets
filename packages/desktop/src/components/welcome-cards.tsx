import { useState } from "react";
import { Lock, FileText, Combine, ShieldCheck, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";

const SKIP_WELCOME_KEY = 'seQRets_skipWelcome';

type ActivePage = "create" | "plan" | "restore";

interface WelcomeCardsProps {
  onSelect: (tab: ActivePage) => void;
}

type CardPalette = {
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBorderColor: string;
};

type CardDef = {
  value: ActivePage;
  label: string;
  description: string;
  icon: typeof Lock;
  dark: CardPalette;
  light: CardPalette;
};

// Light theme uses a single warm-gold palette so the intro reads as uniform.
// Dark theme keeps the distinct amber/emerald/sky palette for visual rhythm.
const LIGHT_PALETTE: CardPalette = {
  color: "hsl(45 90% 65%)",               // bright gold icon on espresso badge
  bgColor: "hsl(var(--primary))",         // full warm espresso
  borderColor: "hsl(var(--border))",
  hoverBorderColor: "hsl(var(--primary) / 0.5)",
};

const cards: CardDef[] = [
  {
    value: "create",
    label: "Secure a Secret",
    description: "Encrypt a seed phrase or private key and split it into QR Qards",
    icon: Lock,
    dark: {
      color: "#fbbf24",
      bgColor: "rgba(251,191,36,0.15)",
      borderColor: "rgba(251,191,36,0.3)",
      hoverBorderColor: "rgba(251,191,36,0.6)",
    },
    light: LIGHT_PALETTE,
  },
  {
    value: "plan",
    label: "Inheritance Plan",
    description: "Encrypt instructions so your heirs can access what matters",
    icon: FileText,
    dark: {
      color: "#34d399",
      bgColor: "rgba(52,211,153,0.15)",
      borderColor: "rgba(52,211,153,0.3)",
      hoverBorderColor: "rgba(52,211,153,0.6)",
    },
    light: LIGHT_PALETTE,
  },
  {
    value: "restore",
    label: "Restore a Secret",
    description: "Scan your QR Qards to reassemble and decrypt a secret",
    icon: Combine,
    dark: {
      color: "#38bdf8",
      bgColor: "rgba(56,189,248,0.15)",
      borderColor: "rgba(56,189,248,0.3)",
      hoverBorderColor: "rgba(56,189,248,0.6)",
    },
    light: LIGHT_PALETTE,
  },
];

export function WelcomeCards({ onSelect }: WelcomeCardsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [skipNext, setSkipNext] = useState(() => {
    try { return localStorage.getItem(SKIP_WELCOME_KEY) === 'true'; } catch { return false; }
  });

  const handleSkipChange = (checked: boolean) => {
    setSkipNext(checked);
    try { localStorage.setItem(SKIP_WELCOME_KEY, checked ? 'true' : ''); } catch { /* ignore */ }
  };

  return (
    <motion.div
      className="space-y-8 w-full"
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeIn" }}
    >
      {/* ── Action cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          const palette = isDark ? card.dark : card.light;
          return (
            <motion.button
              key={card.value}
              onClick={() => onSelect(card.value)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35, ease: "easeOut" }}
              style={{ borderColor: palette.borderColor, ['--hover-border' as string]: palette.hoverBorderColor }}
              whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
              className="flex flex-col items-center gap-4 rounded-xl border-2 dark:border bg-card p-6 sm:p-8 text-center cursor-pointer hover:shadow-lg hover:bg-accent dark:hover:bg-card transition-[background-color,box-shadow] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&:hover]:!border-[var(--hover-border)]"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: palette.bgColor, color: palette.color }}
              >
                <Icon className="h-7 w-7" />
              </div>
              <span className="text-xl font-bold text-card-foreground">{card.label}</span>
              <span className="text-sm text-muted-foreground leading-relaxed">{card.description}</span>
            </motion.button>
          );
        })}
      </div>

      {/* ── Inline security note ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-xl border border-border bg-[#cbc5ba] dark:bg-card/50 p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm">
          <div className="flex items-start gap-2.5 flex-1">
            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-primary dark:text-[#fbbf24]" />
            <p className="text-muted-foreground">
              <strong className="text-card-foreground">Native Rust crypto.</strong>{' '}
              Your secrets never leave this machine. Zero knowledge, no accounts.
            </p>
          </div>
          <div className="flex items-start gap-2.5 flex-1">
            <WifiOff className="h-5 w-5 shrink-0 mt-0.5 text-primary dark:text-[#34d399]" />
            <p className="text-muted-foreground">
              <strong className="text-card-foreground">Go offline first.</strong>{' '}
              Disconnect Wi-Fi before handling secrets. The app works fully offline.
            </p>
          </div>
          <div className="flex items-start gap-2.5 flex-1">
            <Lock className="h-5 w-5 shrink-0 mt-0.5 text-primary dark:text-[#38bdf8]" />
            <p className="text-muted-foreground">
              <strong className="text-card-foreground">Zero knowledge.</strong>{' '}
              No accounts, no servers, no data collection. Lose your password or Qards, and it's gone forever.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Skip preference ── */}
      <motion.label
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="flex items-center justify-center gap-2 cursor-pointer select-none"
      >
        <input
          type="checkbox"
          checked={skipNext}
          onChange={(e) => handleSkipChange(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <span className="text-sm text-muted-foreground">
          Don&rsquo;t show this screen on startup
        </span>
      </motion.label>
    </motion.div>
  );
}
