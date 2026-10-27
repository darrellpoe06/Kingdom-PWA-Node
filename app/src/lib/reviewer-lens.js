// =============================================================================
// reviewer-lens — the one flag read, light enough for every module bundle
// =============================================================================
// THE ONE LAW (lib/reviewer-mode.jsx): the steward's review lens can only HIDE
// privilege; it can never grant any. This file holds the flag's KEY, its two
// MODES and their READS, and nothing else, so a feature module can ask "which
// lens is on?" at its own cloud boundary without pulling the banner,
// ReviewsPeek and the build manifests into its chunk (the Poe Properties App
// mounts PropertiesApp too). reviewer-mode.jsx re-exports every name here;
// there is ONE key and ONE read.
//
// TWO MODES, ONE VALUE (DR-1240). Darrell, 2026-10-27, after catching the lens
// showing him his own 37 pictures under "exactly as a signed-in user sees it":
// "How is the new person or users able to see our assets and not just their
// own or what we allow?!" — and then: "I want both... as myself and as a new
// user... a toggle or choices." So the key carries which:
//   'self'      As myself, privileges hidden. Signed in as the steward; the
//               family / Governor / staff flags are false; his OWN rows
//               (doors, seat, grants, vault, contacts, research) still read
//               through RLS as him — and the banner says so plainly.
//   'stranger'  As a new user. The person with no invite: no seat, no doors,
//               no grants, no household, no vault, no contacts, no research —
//               each module's own nothing-here face, with a line saying why.
//   '1'         The value every device that entered the lens before this
//               date already holds. Read as 'self' — exactly what it did.
// Both modes narrow and neither can grant: a stranger is a strictly smaller
// view than self, and self is strictly smaller than the steward.
// =============================================================================
export const REVIEWER_MODE_KEY = 'poe-reviewer-mode';
export const REVIEWER_LENS_MODES = Object.freeze(['self', 'stranger']);

// Fail-soft accessor — no window / blocked storage means OFF (the normal app).
const defaultStorage = () => {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch (e) { return null; }
};

// The raw per-device value, normalized to a mode or '' (off). Deliberately
// does NOT require an admin email: honoring the flag is strictly privilege-
// narrowing (THE ONE LAW), and requiring auth here would leave a pre-hydration
// window where the boot data path and the derived flags disagree.
export function reviewerLensMode(storage = defaultStorage()) {
  try {
    if (!storage) return '';
    const raw = storage.getItem(REVIEWER_MODE_KEY);
    if (raw === '1' || raw === 'self') return 'self';
    if (raw === 'stranger') return 'stranger';
    return '';
  } catch (e) { return ''; }
}

// Is ANY lens on — what the shell's every narrowing point asks.
export function isReviewerModeOn(storage = defaultStorage()) {
  return reviewerLensMode(storage) !== '';
}

// One predicate per mode.
export function isReviewerSelf(storage = defaultStorage()) {
  return reviewerLensMode(storage) === 'self';
}
export function isReviewerStranger(storage = defaultStorage()) {
  return reviewerLensMode(storage) === 'stranger';
}

// A module's honest line in STRANGER mode: the steward is never left thinking a
// stranger sees his rows. `what` names the rows that module hides.
export function reviewerLensLine(what) {
  return `Reviewer lens: your own ${what} are hidden here; a person with no invite sees this.`;
}
