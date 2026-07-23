// =============================================================================
// trial-status — the DURABLE 90-day counter, anchored to the real account
// =============================================================================
// Darrell chose "make it durable + visible everywhere." The existing trial
// (entitlements.js) anchors on a localStorage `trialStartIso`, so it resets when
// you clear storage or switch devices, and it only shows in the Bookstore.
//
// This computes the same 90-day window from the account's SERVER-SIDE creation
// timestamp (Supabase auth.users.created_at) instead — durable by construction:
// it survives device changes and storage clears, needs NO migration and NO new
// write path, and is identical on every screen because it reads one immutable
// server fact. Reuses TRIAL_DAYS + daysBetween so the math matches the existing
// countdown exactly.
//
// The promise is unchanged (DATA-AS-EMPOWERMENT): at day 90 it becomes 'expired'
// but access falls back to the free tier — NEVER a lockout, nothing deleted.
import { TRIAL_DAYS, daysBetween } from './entitlements.js';

// The day-83 heads-up (Darrell 2026-07-23): from day 83 (8 days left) the
// meter shifts to an honest ENDING-SOON posture — a calm heads-up on the
// surface the user already sees, never a modal, never repeated nagging
// (DATA-AS-EMPOWERMENT: no dark patterns; the accent is house rust, not red —
// DR-0099). Machine-readable so a future email/push lane can key on the phase
// without recomputing.
export const NUDGE_DAYS = 8;

function addDaysIso(iso, days) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t + days * 86400000).toISOString();
}

// Compute the durable trial state from the account creation date.
//   createdAtIso — auth.users.created_at (the durable anchor)
//   nowIso       — current time (injected for testability)
//   paid         — true if the account holds an active paid subscription
// Returns a stable shape the UI renders without further math.
export function trialFromCreatedAt(createdAtIso, nowIso, paid = false) {
  if (paid) {
    return { phase: 'paid', dayNumber: 0, daysLeft: 0, totalDays: TRIAL_DAYS, percentElapsed: 0, endsAtIso: null };
  }
  if (!createdAtIso || Number.isNaN(Date.parse(createdAtIso))) {
    return { phase: 'unknown', dayNumber: 0, daysLeft: TRIAL_DAYS, totalDays: TRIAL_DAYS, percentElapsed: 0, endsAtIso: null };
  }
  // Clamp negatives (clock skew / future-dated createdAt) to day 0.
  const elapsed = Math.max(0, daysBetween(createdAtIso, nowIso));
  const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - elapsed));
  // Human "Day X of 90": day 1 on creation day, capped at 90.
  const dayNumber = Math.min(TRIAL_DAYS, Math.floor(elapsed) + 1);
  const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsed / TRIAL_DAYS) * 100)));
  const endsAtIso = addDaysIso(createdAtIso, TRIAL_DAYS);
  const phase = elapsed >= TRIAL_DAYS ? 'expired' : (daysLeft <= NUDGE_DAYS ? 'ending-soon' : 'trial');
  return { phase, dayNumber, daysLeft, totalDays: TRIAL_DAYS, percentElapsed, endsAtIso };
}

// A short, honest human line for the current state.
export function trialHeadline(state) {
  if (!state) return '';
  switch (state.phase) {
    case 'paid':
      return 'Your subscription is active — full features, no countdown.';
    case 'expired':
      return 'Your free 90 days are complete. You are on the free Foundation tier — nothing was deleted, and you can upgrade any time.';
    case 'ending-soon': {
      const d = state.daysLeft === 1 ? 'day' : 'days';
      return `Heads-up: ${state.daysLeft} ${d} of full access left. After that you move to the free Foundation tier — nothing gets deleted and you are never locked out; upgrade any time to keep the full features.`;
    }
    case 'trial': {
      const d = state.daysLeft === 1 ? 'day' : 'days';
      return `Day ${state.dayNumber} of ${state.totalDays} — ${state.daysLeft} ${d} of full access left, then it stays free forever. You are never locked out.`;
    }
    default:
      return '';
  }
}

// A friendly end date ("July 6, 2026") for the "full access through …" line.
export function formatEndDate(endsAtIso) {
  if (!endsAtIso) return '';
  try {
    return new Date(endsAtIso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return '';
  }
}
