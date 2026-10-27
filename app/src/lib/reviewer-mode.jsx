// =============================================================================
// reviewer-mode — the steward's "see it as a user" review lens
// =============================================================================
// Darrell 2026-07-05: "we need to be reviewers also... give us a users view that
// mimics the users identically so we can test like a review after pushing to
// production."
//
// WHAT IT IS. A per-device flag the steward flips from Admin → Actions. While it
// is ON, the shell derives every family / Governor / church-staff / study-circle
// privilege as FALSE and boots the exact data path a signed-in NON-family user
// gets on the public site (demo sample pre-auth → EMPTY_WORLD after sign-in,
// self-serve profile, foundation tier). The review pass is the REAL production
// surface — real code, real gates, real empty world — never a painted mock
// (reality-trace P15; DR-0061/0076).
//
// THE ONE LAW — STRICTLY NARROWING. The flag can only ever HIDE privilege; it can
// never grant any. Someone who sets the key by hand gets a strictly smaller view
// than they already had, so honoring the raw flag before auth resolves is safe by
// construction. Supabase RLS stays the actual gate on every remote read/write
// (DR-0060) — this lens changes what the shell derives, not what the database
// allows.
//
// WHY ENTER/EXIT RELOAD. Identity, data selection, and hydration are boot-time
// decisions in the shell (initial useState + run-once effects). A reload makes
// the app boot exactly the way a user's boot runs. While the flag is on, the
// shell suppresses the local data-blob write, the cloud-snapshot pull/push, the
// saved-profile write, and the family tier grant — so a review session can never
// overwrite the steward's real books with a reviewer's empty world (that clobber
// hazard is closed by construction; the reviewer-mode wiring test pins each
// suppression point in the shell source).
//
// WHAT STAYS REAL (stated honestly, DR-0076): the reviewer remains signed in as
// themselves. Anything they deliberately SUBMIT through a module (feedback, a
// module entry) still lands in their own account — exactly as it would for any
// signed-in user. Reviewing is looking; submissions are real.
// =============================================================================
import React from 'react';
import ReviewsPeek from '../components/ReviewsPeek.jsx';

// THE KEY, THE MODES AND THE READS LIVE IN lib/reviewer-lens.js (DR-1240) —
// one source, light enough for a feature module to import at its own cloud
// boundary (Properties, Vault, Messages, Research ask it before reading the
// signed-in person's own rows). Re-exported here so this file stays the lens's
// front door. TWO MODES, ONE VALUE: 'self' (as myself, privileges hidden — his
// own rows still show) and 'stranger' (as a new user — nothing of his shows);
// the legacy '1' reads as 'self'. Darrell 2026-10-27: "I want both... as
// myself and as a new user... a toggle or choices."
import { REVIEWER_MODE_KEY, REVIEWER_LENS_MODES, reviewerLensMode } from './reviewer-lens.js';
export {
  REVIEWER_MODE_KEY, REVIEWER_LENS_MODES, reviewerLensMode,
  isReviewerModeOn, isReviewerSelf, isReviewerStranger, reviewerLensLine,
} from './reviewer-lens.js';

const defaultStorage = () => {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch (e) { return null; }
};
const defaultReload = () => {
  try { window.location.reload(); } catch (e) { /* no-op outside a browser */ }
};

// Every transition reloads so the whole boot path (initial state + run-once
// effects) re-runs under the new lens — a live toggle would leave the already-
// hydrated steward state on screen, which is exactly the leak this mode exists
// to rule out. Switching between the two modes is a transition too: the
// modules read their rows at boot, so 'self' → 'stranger' must boot again.
const asMode = (mode) => (REVIEWER_LENS_MODES.includes(mode) ? mode : 'self');

export function enterReviewerModeAs(mode, storage = defaultStorage(), reload = defaultReload) {
  try { if (storage) storage.setItem(REVIEWER_MODE_KEY, asMode(mode)); } catch (e) { /* fail-soft */ }
  reload();
}

// The original entry: 'self' — what every caller before DR-1240 got.
export function enterReviewerMode(storage = defaultStorage(), reload = defaultReload) {
  enterReviewerModeAs('self', storage, reload);
}

// Switch WITHOUT leaving the lens: the other mode, then the reload.
export function switchReviewerMode(mode, storage = defaultStorage(), reload = defaultReload) {
  enterReviewerModeAs(mode, storage, reload);
}

export function exitReviewerMode(storage = defaultStorage(), reload = defaultReload) {
  try { if (storage) storage.removeItem(REVIEWER_MODE_KEY); } catch (e) { /* fail-soft */ }
  reload();
}

// What each mode SAYS, plainly (DR-0076): a steward must never read "exactly
// as a user sees it" over his own doors again. 'self' admits his rows show.
export const REVIEWER_LENS_COPY = Object.freeze({
  self: {
    name: 'As yourself, privileges hidden',
    line: 'Your own doors, vault, contacts and research still show; only family, Governor and staff privileges are hidden. Your family books, profile, and cloud snapshot are untouched.',
    switchTo: 'stranger',
    switchLabel: 'See as a new user →',
  },
  stranger: {
    name: 'As a new user',
    line: 'A person with no invite sees this: your own doors, vault, contacts and research are hidden. Your family books, profile, and cloud snapshot are untouched.',
    switchTo: 'self',
    switchLabel: 'See as yourself →',
  },
});

// The always-on strip while reviewing. It ignores the header-hideaway collapse
// on purpose: in this mode the Admin tab is hidden (a user never sees it), so
// this Exit button is the ONLY way back to the steward view — an exit
// affordance must never be hidable. sticky + z-[60] keeps it painted (and
// clickable) above the app's full-screen z-50 overlays — the profile-picker
// dialog otherwise covers Exit for a signed-out reviewer (caught live in the
// Playwright drive, 2026-07-05). Ink palette (not the demo strip's clay) so
// "sample data" and "reviewer lens" read as different states at a glance.
export function ReviewerModeBanner({ onExit = () => exitReviewerMode(), mode = null, onSwitch = (m) => switchReviewerMode(m) }) {
  // A steward-only overlay (a user never sees it). It carries the "seeing this as
  // a user" bar AND the recent review records (ReviewsPeek) -- so the written
  // review for the change being looked at is one tap away while reviewing the
  // live production push (DR-0104), instead of buried in the repo.
  // The bar NAMES the mode and says what it hides (DR-1240), and the switch to
  // the other mode sits beside Exit so the steward never leaves the lens to
  // change what he is looking through.
  const which = mode === 'stranger' || mode === 'self' ? mode : (reviewerLensMode() || 'self');
  const copy = REVIEWER_LENS_COPY[which];
  const btn = 'text-[0.625rem] uppercase tracking-wider px-2 py-1 focus:outline focus:outline-2 focus:outline-white font-semibold';
  return (
    <div className="sticky top-0 z-[60]">
      <div className="bg-[#1A1815] text-white text-xs px-3 py-2 flex items-center justify-between gap-3 flex-wrap" data-reviewer-lens={which}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="uppercase tracking-[0.2em] font-semibold">Reviewer mode · {copy.name}</span>
          <span className="opacity-90 hidden sm:inline" style={{ fontFamily: '"Fraunces", serif' }}>{copy.line}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitch(copy.switchTo)}
            className={`${btn} border border-white text-white hover:bg-white hover:text-[#1A1815]`}
            data-testid="reviewer-switch"
          >
            {copy.switchLabel}
          </button>
          <button
            type="button"
            onClick={onExit}
            className={`${btn} bg-white text-[#1A1815] hover:bg-[#FAF8F4]`}
          >
            Exit reviewer mode →
          </button>
        </div>
      </div>
      <ReviewsPeek />
    </div>
  );
}
