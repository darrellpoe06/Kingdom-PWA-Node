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

export const REVIEWER_MODE_KEY = 'poe-reviewer-mode';

// Fail-soft accessors — no window / blocked storage means OFF (the normal app).
const defaultStorage = () => {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch (e) { return null; }
};
const defaultReload = () => {
  try { window.location.reload(); } catch (e) { /* no-op outside a browser */ }
};

// Raw per-device flag read. Deliberately does NOT require an admin email:
// honoring the flag is strictly privilege-narrowing (see THE ONE LAW above),
// and requiring auth here would leave a pre-hydration window where the boot
// data path and the derived flags disagree.
export function isReviewerModeOn(storage = defaultStorage()) {
  try { return !!storage && storage.getItem(REVIEWER_MODE_KEY) === '1'; }
  catch (e) { return false; }
}

// Both transitions reload so the whole boot path (initial state + run-once
// effects) re-runs under the new lens — a live toggle would leave the already-
// hydrated steward state on screen, which is exactly the leak this mode exists
// to rule out.
export function enterReviewerMode(storage = defaultStorage(), reload = defaultReload) {
  try { if (storage) storage.setItem(REVIEWER_MODE_KEY, '1'); } catch (e) { /* fail-soft */ }
  reload();
}

export function exitReviewerMode(storage = defaultStorage(), reload = defaultReload) {
  try { if (storage) storage.removeItem(REVIEWER_MODE_KEY); } catch (e) { /* fail-soft */ }
  reload();
}

// The always-on strip while reviewing. It ignores the header-hideaway collapse
// on purpose: in this mode the Admin tab is hidden (a user never sees it), so
// this Exit button is the ONLY way back to the steward view — an exit
// affordance must never be hidable. sticky + z-[60] keeps it painted (and
// clickable) above the app's full-screen z-50 overlays — the profile-picker
// dialog otherwise covers Exit for a signed-out reviewer (caught live in the
// Playwright drive, 2026-07-05). Ink palette (not the demo strip's clay) so
// "sample data" and "reviewer lens" read as different states at a glance.
export function ReviewerModeBanner({ onExit = () => exitReviewerMode() }) {
  return (
    <div className="sticky top-0 z-[60] bg-[#1A1815] text-white text-xs px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="uppercase tracking-[0.2em] font-semibold">Reviewer mode</span>
        <span className="opacity-90 hidden sm:inline" style={{ fontFamily: '"Fraunces", serif' }}>
          You are seeing this build exactly as a signed-in user sees it. Your family books, profile, and cloud snapshot are untouched.
        </span>
      </div>
      <button
        type="button"
        onClick={onExit}
        className="text-[10px] uppercase tracking-wider px-2 py-1 bg-white text-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-white font-semibold"
      >
        Exit reviewer mode →
      </button>
    </div>
  );
}
