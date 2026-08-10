// =============================================================================
// read-reveal — open what is collapsed BEFORE reading it
// =============================================================================
// Darrell 2026-08-10, two reports in one sitting: "deeper doesn't get read at
// all" and "dropdown information need to be understood.... too."
//
// THE REAL MECHANISM (traced, not assumed). This app's disclosures are
// CONDITIONALLY RENDERED — `{aboutOpen && (<div>…</div>)}` (e.g. the "About this
// — what it is, where it comes from, how it works" panel on Eternal Algorithms,
// EternalAlgorithmsStudy.jsx:638). While collapsed there is no text node in the
// document at all, so the reader could not have read it: it was never there to
// read. Nothing was broken in the reader — the words did not exist yet. The
// mirror-image case is `<details>`: its children DO stay in the DOM when closed,
// so the reader spoke them while the screen showed nothing, and the follow-along
// highlight landed on text no one could see.
//
// Both are the same defect from the listener's chair: what is heard and what is
// shown disagree. This module fixes it at the source — before a read is mapped,
// the collapsed parts of the reading are OPENED, so the words exist, are spoken,
// are highlighted, and are visible, all at once.
//
// WHAT IT WILL AND WILL NOT TOUCH (blast radius, on purpose):
//   • `<details>` inside the reading root — opened directly (no click).
//   • Buttons that ARE disclosures — `[aria-expanded="false"]` inside the root —
//     clicked once, because that is the only way a conditionally-rendered panel
//     can come into existence.
//   • NEVER: the reader's own controls (.tts-controls), menus/dialogs
//     (`[aria-haspopup]`), tabs (`role="tab"` — a tab SWITCHES content, it does
//     not reveal more of it), or anything marked `[data-read-no-expand]`.
//   • Bounded by `max` so a pathological page cannot spin.
//
// Left OPEN afterward on purpose (surface-says-truth): the screen then shows
// exactly what was read. Collapsing it back would recreate the mismatch this
// exists to remove — the listener would be told about words the page denies.
//
// Pure DOM, injectable, no framework — unit-testable in jsdom.
// =============================================================================

const NO_EXPAND = '.tts-controls, [data-read-no-expand], [aria-haspopup], [role="tab"], [role="dialog"]';

/**
 * Open every collapsed disclosure inside `root`.
 * @param {Element} root the reading container (a <main>, or one piece's element)
 * @param {{max?:number}} [opts]
 * @returns {{details:number, buttons:number}} what was opened — the caller
 *   re-maps only when something actually changed.
 */
export function revealForReading(root, { max = 40 } = {}) {
  const opened = { details: 0, buttons: 0 };
  if (!root || typeof root.querySelectorAll !== 'function') return opened;

  const blocked = (el) => {
    try { return !!(el.closest && el.closest(NO_EXPAND)); } catch (_) { return false; }
  };

  let budget = max;
  try {
    for (const d of root.querySelectorAll('details')) {
      if (budget <= 0) break;
      if (d.open || blocked(d)) continue;
      try { d.open = true; opened.details += 1; budget -= 1; } catch (_) { /* one stubborn node never stops the rest */ }
    }
  } catch (_) { /* querySelectorAll is the only risk; nothing to undo */ }

  try {
    for (const b of root.querySelectorAll('[aria-expanded="false"]')) {
      if (budget <= 0) break;
      if (blocked(b)) continue;
      try { b.click(); opened.buttons += 1; budget -= 1; } catch (_) { /* ignore */ }
    }
  } catch (_) { /* ignore */ }

  return opened;
}

/**
 * Wait until an element STOPS growing — the honest way to know a reveal (or a
 * surface's own "show every part") has finished rendering. Waiting a fixed
 * frame or two is a guess: React schedules its own work, and a revealed panel
 * can reveal another. Bounded so a live-updating surface can never hang a read.
 */
export async function settled(el, { tries = 10, requireChange = false, win } = {}) {
  const measure = () => (el && typeof el.textContent === 'string' ? el.textContent.length : 0);
  const start = measure();
  let last = -1;
  let changed = false;
  for (let i = 0; i < tries; i++) {
    await afterRender(win);
    const len = measure();
    if (len !== start) changed = true;
    // `requireChange` is for the case where we just ASKED for more content: two
    // equal measurements taken before the surface has re-rendered would look
    // "settled" while nothing had happened yet — the exact race that made a
    // prepared lesson read only its first stage.
    if (len === last && (changed || !requireChange)) return len;
    last = len;
  }
  return last;
}

/** Wait for the browser to paint what reveal just mounted. Never throws. */
export function afterRender(win = (typeof window !== 'undefined' ? window : null)) {
  return new Promise((resolve) => {
    const raf = win && typeof win.requestAnimationFrame === 'function' ? win.requestAnimationFrame.bind(win) : null;
    if (raf) { raf(() => raf(() => resolve())); return; }
    if (typeof setTimeout === 'function') { setTimeout(resolve, 0); return; }
    resolve();
  });
}
