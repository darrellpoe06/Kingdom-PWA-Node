// =============================================================================
// read-target — what the reader should read on THIS screen, start to finish
// =============================================================================
// Darrell 2026-07-30, from the live app with Read Aloud open mid-lesson: "The
// reader reads different lessons not one full one... Just the pages showing on
// the full list view.... not good." The floating Read Aloud control reads the
// whole <main> innerText — on Learn that is EVERY lesson card in DOM order,
// and only the currently-visible paced step of the open one. So the listener
// got fragments of different lessons, never one whole lesson.
//
// This registry is the fix's spine: a surface that knows its ONE primary
// reading (the open Learn lesson; later a Bible chapter, a study page)
// registers it here — a label + the FULL text, start to finish. The floating
// reader subscribes and offers "Read this lesson" as the primary action,
// falling back to page reading when nothing is registered.
//
// Owner-keyed so an unmount can only clear ITS OWN registration (an unmount
// racing a sibling's mount never wipes the new target). Plain module state +
// subscribers — no context plumbing across the app shell. Fail-soft and pure
// (no window use), so it unit-tests without a browser (DR-0076).
// =============================================================================

let current = null; // { owner, label, text } | null
const subs = new Set();

function notify() {
  for (const fn of subs) {
    try { fn(current); } catch { /* a bad subscriber never breaks the rest */ }
  }
}

/**
 * Register the primary reading for the current screen.
 * @param {string} owner - opaque key (e.g. the lesson/module id)
 * @param {{label?:string, text:string}} target - label like "this lesson" + the FULL text
 */
export function setReadTarget(owner, target) {
  const text = target && typeof target.text === 'string' ? target.text.trim() : '';
  if (!owner || !text) return;
  current = { owner: String(owner), label: (target.label || 'this').trim() || 'this', text };
  notify();
}

/** Clear the registration — only when it is still owned by `owner`. */
export function clearReadTarget(owner) {
  if (!current || current.owner !== String(owner)) return;
  current = null;
  notify();
}

/** The current primary reading, or null. */
export function getReadTarget() { return current; }

/** Subscribe to target changes. Returns the unsubscribe function. */
export function subscribeReadTarget(fn) {
  if (typeof fn !== 'function') return () => {};
  subs.add(fn);
  return () => subs.delete(fn);
}
