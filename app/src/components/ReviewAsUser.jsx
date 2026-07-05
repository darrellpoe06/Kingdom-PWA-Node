// =============================================================================
// ReviewAsUser — the admin's "see it exactly as a user" review lens
// =============================================================================
// Darrell 2026-07-05: "We admins need the ability to see the updated apps from
// the admin's side… give us a users view that mimics the users identically so we
// can test like a review after pushing to production."
//
// HOW IT WORKS (a lens, not a login): the shell computes the real family/governor
// flag from the signed-in email, then passes it through useReviewGate(). While
// review mode is ON, the EFFECTIVE flag is false — so every governor-gated tab,
// nav entry, persona label, and surface renders exactly as a plain user gets it.
// Auth is untouched (you stay signed in as you; RLS on the server is unchanged —
// this reviews the UI/flows, it does not fabricate a different account's data).
//
// SAFETY: the exit control (ReviewAsUserBanner) mounts OUTSIDE every gate, always
// visible while the lens is on — review mode can never strand an admin with the
// Admin tab hidden and no way back. The flag survives reload on purpose (so a
// PWA reload / install flow can be reviewed too); the banner survives with it.
//
// Shell splice is deliberately tiny (the monolith is budget-frozen): one import,
// the gate call, one banner mount. Everything else lives here.
import React, { useEffect, useState } from 'react';
import UiIcon from './UiIcon.jsx';

const KEY = 'poe-review-as-user';
const EVT = 'poe-review-as-user-change';

export function isReviewingAsUser() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function setReviewAsUser(on) {
  try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch { /* device-local */ }
  try { window.dispatchEvent(new CustomEvent(EVT, { detail: { on: !!on } })); } catch { /* SSR/test */ }
}

// Subscribe to the lens. Returns [effectiveFlag, reviewing]: the effective
// family/governor flag the shell should gate on, and whether the lens is on.
export function useReviewGate(realFlag) {
  const [reviewing, setReviewing] = useState(isReviewingAsUser);
  useEffect(() => {
    const sync = () => setReviewing(isReviewingAsUser());
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync); // second tab flips it → this tab follows
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener('storage', sync); };
  }, []);
  return [!!realFlag && !reviewing, reviewing && !!realFlag];
}

// The always-visible exit rail while the lens is on. Mounts outside every gate.
export function ReviewAsUserBanner({ active }) {
  if (!active) return null;
  return (
    <div className="sticky top-0 z-50 bg-[#B85838] text-white px-3 py-2 flex items-center justify-between gap-2 print:hidden" role="status">
      <span className="text-[0.6875rem] uppercase tracking-wider font-semibold inline-flex items-center gap-1.5">
        <UiIcon name="monitor" /> Review mode — you are seeing the app exactly as a user sees it
      </span>
      <button
        type="button"
        onClick={() => setReviewAsUser(false)}
        className="text-[0.6875rem] uppercase tracking-wider px-2.5 py-1 border border-white bg-transparent hover:bg-white hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-white min-h-[32px]"
      >
        Exit review
      </button>
    </div>
  );
}

// The entry card for the Admin → Actions section: what it does, then one tap in.
export function ReviewAsUserAction() {
  return (
    <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
      <div className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Review as a user</div>
      <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
        Flip the whole app to exactly what a signed-in user sees — governor tabs, admin surfaces, and
        family-only controls disappear until you exit. Your sign-in is untouched; a banner with the
        exit stays pinned on top so you can always come back. Use it to review a build like a user
        right after it ships.
      </p>
      <button
        type="button"
        onClick={() => setReviewAsUser(true)}
        className="mt-2 inline-flex items-center text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        Enter review mode <span aria-hidden="true" className="ml-1">→</span>
      </button>
    </div>
  );
}
