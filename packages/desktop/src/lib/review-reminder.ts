// ── Inheritance Plan Review Reminder ───────────────────────────────
// Local, opt-in reminder that nudges the user to revisit their
// inheritance plan on a user-chosen cadence. State lives in a plaintext
// JSON sidecar in the Tauri app data dir (see src-tauri/src/review_reminder.rs).
//
// Design contract:
// - All scheduling policy lives here. Rust is a dumb storage layer.
// - `nextReviewAt` is checkable without decrypting the plan, so the
//   banner / badge / OS notification can fire on app launch without
//   prompting for the user's password.
// - The authoritative "last reviewed" timestamp also lives inside the
//   encrypted plan (`planInfo.lastReviewedAt`) so if the sidecar is
//   deleted or the user moves to a new machine, `reconcileWithPlan`
//   can rebuild from the cold-storage copy.
// - If the sidecar and the plan disagree, the newer date wins. If they
//   disagree by more than SIDECAR_DISAGREEMENT_WARN_DAYS, the caller
//   is told so it can surface a warning to the user. This is the only
//   tamper-detection we can do without breaking the "checkable without
//   decrypt" property, and it catches the realistic case where an
//   attacker has faked a recent review in the sidecar.
//
// Security: see review_reminder.rs and docs/THREAT_MODEL.md.

import { invoke } from '@tauri-apps/api/core';

// ── Constants ──────────────────────────────────────────────────────

export const DEFAULT_INTERVAL_MONTHS = 12;
export const INTERVAL_OPTIONS: number[] = [6, 12, 24];
/** Only warn on sidecar-vs-plan drift that exceeds this many days. */
export const SIDECAR_DISAGREEMENT_WARN_DAYS = 30;

// ── Types ──────────────────────────────────────────────────────────

/**
 * Mirrors the serde struct in review_reminder.rs. All dates are ISO
 * `YYYY-MM-DD` strings. `null` is used for "unset" — the declined
 * marker, for example, stores `enabled: false` with the rest null.
 */
export interface ReminderSidecar {
  enabled: boolean;
  intervalMonths: number | null;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  snoozedUntil: string | null;
  osNotifications: boolean;
}

export type ReminderState =
  | { kind: 'missing' }
  | { kind: 'declined' }
  | {
      kind: 'active';
      sidecar: ReminderSidecar;
      due: boolean;
      /** Positive if overdue, negative if not yet due, 0 if due today. */
      daysUntilDue: number;
    }
  | { kind: 'corrupt'; error: string };

// ── Date helpers ───────────────────────────────────────────────────
// ISO date strings sort lexicographically, so we can compare with <, >,
// === without parsing. That dodges the usual timezone/DST foot-guns.
// Everything here operates on local-calendar dates with no time component.

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Add `months` calendar months to an ISO date string. Clamps the day
 * to the last valid day of the target month (so Jan 31 + 1mo → Feb 28/29).
 */
export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const base = new Date(y, m - 1, 1);
  base.setMonth(base.getMonth() + months);
  const lastDayOfTarget = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(d, lastDayOfTarget));
  return todayIso(base);
}

/** Days from `from` to `to`. Positive if `to` is later. */
export function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86_400_000);
}

// ── Thin Tauri invoke wrappers ─────────────────────────────────────

async function readSidecarRaw(): Promise<ReminderSidecar | null> {
  return (await invoke('reminder_read')) as ReminderSidecar | null;
}

async function writeSidecarRaw(sidecar: ReminderSidecar): Promise<void> {
  await invoke('reminder_write', { sidecar });
}

async function deleteSidecarRaw(): Promise<void> {
  await invoke('reminder_delete');
}

// ── Shape validation (defense-in-depth after JSON.parse) ───────────

function isReminderSidecar(v: unknown): v is ReminderSidecar {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.enabled === 'boolean' &&
    typeof r.osNotifications === 'boolean' &&
    (r.intervalMonths === null || typeof r.intervalMonths === 'number') &&
    (r.lastReviewedAt === null || typeof r.lastReviewedAt === 'string') &&
    (r.nextReviewAt === null || typeof r.nextReviewAt === 'string') &&
    (r.snoozedUntil === null || typeof r.snoozedUntil === 'string')
  );
}

// ── Factories ──────────────────────────────────────────────────────

function buildActiveSidecar(args: {
  intervalMonths: number;
  lastReviewedAt: string;
  osNotifications: boolean;
}): ReminderSidecar {
  return {
    enabled: true,
    intervalMonths: args.intervalMonths,
    lastReviewedAt: args.lastReviewedAt,
    nextReviewAt: addMonths(args.lastReviewedAt, args.intervalMonths),
    snoozedUntil: null,
    osNotifications: args.osNotifications,
  };
}

function buildDeclinedSidecar(): ReminderSidecar {
  return {
    enabled: false,
    intervalMonths: null,
    lastReviewedAt: null,
    nextReviewAt: null,
    snoozedUntil: null,
    osNotifications: false,
  };
}

// ── Public: state read ─────────────────────────────────────────────

/**
 * Read and classify the sidecar. The UI consumes this single entry
 * point and renders based on the discriminated union.
 *
 * Note on the `corrupt` state: the Rust side refuses to silently delete
 * a malformed sidecar (that would let an attacker reset reminder state
 * by writing garbage). If the sidecar is corrupt we surface it and let
 * the user recover via the settings panel's "Disable and delete" button.
 */
export async function getReminderState(now: Date = new Date()): Promise<ReminderState> {
  let raw: ReminderSidecar | null;
  try {
    raw = await readSidecarRaw();
  } catch (e: unknown) {
    return { kind: 'corrupt', error: e instanceof Error ? e.message : String(e) };
  }

  if (raw === null) return { kind: 'missing' };

  if (!isReminderSidecar(raw)) {
    return { kind: 'corrupt', error: 'Sidecar has unexpected shape' };
  }

  if (!raw.enabled) return { kind: 'declined' };

  const today = todayIso(now);
  const next = raw.nextReviewAt;
  if (!next) {
    // Enabled but no next date — treat as corrupt rather than silently
    // papering over. The settings panel can fix it.
    return { kind: 'corrupt', error: 'Enabled sidecar is missing nextReviewAt' };
  }

  const snoozeBlocks = raw.snoozedUntil !== null && raw.snoozedUntil > today;
  const dateDue = next <= today;
  const due = dateDue && !snoozeBlocks;
  const daysUntilDue = daysBetween(today, next) * -1; // positive = overdue

  return { kind: 'active', sidecar: raw, due, daysUntilDue };
}

// ── Public: actions ────────────────────────────────────────────────

/**
 * First-save prompt "Yes, remind me". Creates an active sidecar anchored
 * to `lastReviewedAt` (typically today on first creation).
 */
export async function enableReminder(opts: {
  intervalMonths: number;
  osNotifications: boolean;
  lastReviewedAt: string;
}): Promise<void> {
  await writeSidecarRaw(
    buildActiveSidecar({
      intervalMonths: opts.intervalMonths,
      lastReviewedAt: opts.lastReviewedAt,
      osNotifications: opts.osNotifications,
    }),
  );
}

/**
 * First-save prompt "No thanks". Writes the declined marker so we don't
 * re-prompt on every launch on this machine. The user can flip back via
 * the settings panel.
 */
export async function declineReminder(): Promise<void> {
  await writeSidecarRaw(buildDeclinedSidecar());
}

/**
 * User clicked "Mark as reviewed" after a successful decrypt. No plan
 * re-encrypt is required — the sidecar is the hot copy; the plan's
 * `lastReviewedAt` will catch up the next time the user saves for
 * another reason.
 *
 * If the sidecar was somehow declined or missing when this is called,
 * we conservatively promote it to an active sidecar with the default
 * interval so the user's explicit "I reviewed this" action is respected.
 */
export async function markReviewed(now: Date = new Date()): Promise<void> {
  const today = todayIso(now);
  const state = await getReminderState(now);

  if (state.kind === 'active') {
    const interval = state.sidecar.intervalMonths ?? DEFAULT_INTERVAL_MONTHS;
    await writeSidecarRaw({
      ...state.sidecar,
      lastReviewedAt: today,
      nextReviewAt: addMonths(today, interval),
      snoozedUntil: null,
    });
    return;
  }

  await writeSidecarRaw(
    buildActiveSidecar({
      intervalMonths: DEFAULT_INTERVAL_MONTHS,
      lastReviewedAt: today,
      osNotifications: false,
    }),
  );
}

/** Snooze a due reminder for N days without resetting lastReviewedAt. */
export async function snoozeReminder(days: number, now: Date = new Date()): Promise<void> {
  const state = await getReminderState(now);
  if (state.kind !== 'active') return;
  const snoozedUntil = addDays(todayIso(now), days);
  await writeSidecarRaw({ ...state.sidecar, snoozedUntil });
}

/** Change interval; recomputes nextReviewAt from the existing lastReviewedAt. */
export async function setReminderInterval(intervalMonths: number): Promise<void> {
  const state = await getReminderState();
  if (state.kind !== 'active') return;
  const anchor = state.sidecar.lastReviewedAt ?? todayIso();
  await writeSidecarRaw({
    ...state.sidecar,
    intervalMonths,
    nextReviewAt: addMonths(anchor, intervalMonths),
  });
}

/** Toggle OS notifications on an already-active sidecar. */
export async function setOsNotifications(enabled: boolean): Promise<void> {
  const state = await getReminderState();
  if (state.kind !== 'active') return;
  await writeSidecarRaw({ ...state.sidecar, osNotifications: enabled });
}

/** Settings "Disable and delete". Removes the sidecar entirely. */
export async function disableAndDelete(): Promise<void> {
  await deleteSidecarRaw();
}

// ── Reconciliation with the encrypted plan ─────────────────────────

export interface ReconcileResult {
  /** What the sidecar looks like after reconciliation. */
  state: ReminderState;
  /**
   * True iff the sidecar and plan disagreed by more than the warning
   * threshold at reconcile time. The UI should surface this so the user
   * knows one of the two sources was behind (possibly tampered with).
   */
  disagreementWarning: boolean;
  /** The larger of `|sidecar.lastReviewedAt - plan.lastReviewedAt|` in days. */
  disagreementDays: number;
}

/**
 * Called on every successful plan decrypt. Implements the "newer wins"
 * rule:
 *
 *   planReviewedAt : from the encrypted plan (may be ahead if the user
 *                    reviewed on another machine where the sidecar is
 *                    missing, or if the local sidecar was tampered).
 *   sidecarReviewedAt : from the sidecar (may be ahead if the user
 *                    clicked "Mark as reviewed" on this machine without
 *                    re-saving the plan).
 *
 * Cases:
 * - No sidecar, v5+ plan present → rebuild a new sidecar from the plan's
 *   timestamp, conservative defaults (12mo interval, OS notifs off).
 *   Used on machine switches and reinstalls.
 * - Sidecar present, plan has an older lastReviewedAt → leave sidecar
 *   alone, return a warning if the gap exceeds the threshold.
 * - Sidecar present, plan has a newer lastReviewedAt → roll sidecar
 *   forward to match (another machine is ahead; trust the plan).
 * - Declined sidecar → don't touch; declined is a valid user choice.
 * - Corrupt sidecar → don't touch; caller surfaces the error.
 */
export async function reconcileWithPlan(
  planReviewedAt: string | null,
  now: Date = new Date(),
): Promise<ReconcileResult> {
  const state = await getReminderState(now);

  // Nothing to reconcile against.
  if (!planReviewedAt) {
    return { state, disagreementWarning: false, disagreementDays: 0 };
  }

  // Declined → respect user's choice; the plan copy is informational only.
  if (state.kind === 'declined') {
    return { state, disagreementWarning: false, disagreementDays: 0 };
  }

  // Corrupt → surface, don't auto-heal.
  if (state.kind === 'corrupt') {
    return { state, disagreementWarning: false, disagreementDays: 0 };
  }

  // No sidecar → rebuild from plan with conservative defaults.
  if (state.kind === 'missing') {
    const rebuilt = buildActiveSidecar({
      intervalMonths: DEFAULT_INTERVAL_MONTHS,
      lastReviewedAt: planReviewedAt,
      osNotifications: false,
    });
    await writeSidecarRaw(rebuilt);
    return {
      state: await getReminderState(now),
      disagreementWarning: false,
      disagreementDays: 0,
    };
  }

  // Active sidecar + plan both have opinions. Newer wins.
  const sidecarReviewedAt = state.sidecar.lastReviewedAt ?? planReviewedAt;
  const drift = Math.abs(daysBetween(sidecarReviewedAt, planReviewedAt));
  const disagreementWarning = drift > SIDECAR_DISAGREEMENT_WARN_DAYS;

  if (planReviewedAt > sidecarReviewedAt) {
    // Plan is ahead of sidecar — another machine reviewed more recently.
    const interval = state.sidecar.intervalMonths ?? DEFAULT_INTERVAL_MONTHS;
    await writeSidecarRaw({
      ...state.sidecar,
      lastReviewedAt: planReviewedAt,
      nextReviewAt: addMonths(planReviewedAt, interval),
      // Don't clear snooze here — user's active snooze should persist.
    });
    return {
      state: await getReminderState(now),
      disagreementWarning,
      disagreementDays: drift,
    };
  }

  // Sidecar is ahead or equal — nothing to rewrite.
  return { state, disagreementWarning, disagreementDays: drift };
}

// ── OS notification (best-effort, HTML5 Notification API) ─────────
// We use the HTML5 Notification API rather than adding a Rust plugin
// dependency. Tauri WebViews (WKWebView / WebView2 / webkit2gtk) all
// support it and route to the OS notification center. If reliability
// on code-signed builds becomes an issue, this is the single place to
// swap in @tauri-apps/plugin-notification.
//
// Notification text is deliberately generic — no mention of the
// inheritance plan by name, so a lock-screen preview leaks nothing
// more than "seQRets has a reminder."

const NOTIFICATION_SESSION_FLAG = '__seqretsReviewReminderNotifiedThisSession';

/**
 * Fire the OS notification for an overdue reminder, at most once per
 * session. No-op unless the sidecar is active, due, and has
 * osNotifications enabled. Safe to call on every app launch.
 */
export async function maybeFireLaunchNotification(): Promise<void> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

  // Session-scoped guard so HMR / StrictMode double-mount doesn't double-fire.
  const w = window as unknown as Record<string, unknown>;
  if (w[NOTIFICATION_SESSION_FLAG]) return;

  let state: ReminderState;
  try {
    state = await getReminderState();
  } catch {
    return;
  }
  if (state.kind !== 'active' || !state.due || !state.sidecar.osNotifications) return;

  try {
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') return;
    } else if (Notification.permission !== 'granted') {
      return;
    }

    // Intentionally generic — never mention "inheritance plan" in the
    // title or body so lock-screen previews leak nothing.
    new Notification('seQRets', {
      body: 'You have a scheduled review reminder. Open seQRets to continue.',
      silent: false,
    });
    w[NOTIFICATION_SESSION_FLAG] = true;
  } catch {
    // Notification API can throw in some WebView configurations. Ignore.
  }
}

// ── Small local helper ────────────────────────────────────────────

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return todayIso(dt);
}
