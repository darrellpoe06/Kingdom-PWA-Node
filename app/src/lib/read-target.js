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
 *
 * `elementId` + `prepare` are the FOLLOW-ALONG contract (2026-08-10). Composed
 * text alone can only be highlighted by SEARCHING for each spoken sentence in
 * the DOM — and a lesson's spoken text is composed ("Anchor scripture — …",
 * "Questions to think about:") and paced (only one step is rendered), so that
 * search found almost nothing and the Learn read highlighted NOTHING while the
 * Eternal Algorithms read (which maps the page itself) highlighted fine. The
 * fix is structural: a surface that owns a reading also names the ELEMENT that
 * renders it and, through `prepare`, guarantees the WHOLE piece is on screen
 * before reading starts. The reader then maps that element — alignment by
 * construction, the same law the page read has always used — so every spoken
 * sentence has a range and nothing "deeper" is skipped.
 *
 * `next` is the HANDS-FREE contract (2026-08-10). A paged surface — 36
 * patterns, 72 lessons — read ONE piece and then went silent until a human
 * tapped Next, which is exactly what a listener cannot do while driving,
 * cooking, or resting their eyes. A surface that has a next piece supplies
 * `next()`: it advances to that piece (registering ITS target) and returns
 * true. The reader then keeps reading, piece after piece, until the surface
 * says there is no next — or until Stop.
 *
 * @param {string} owner - opaque key (e.g. the lesson/module id)
 * @param {{label?:string, text:string, elementId?:string, prepare?:Function, next?:Function}} target
 *   label like "this lesson", the FULL text (the fallback reading), the DOM id
 *   of the element that renders it, prepare(on) → show/restore every part, and
 *   next() → advance to the following piece (true when it advanced).
 */
export function setReadTarget(owner, target) {
  const text = target && typeof target.text === 'string' ? target.text.trim() : '';
  if (!owner || !text) return;
  current = {
    owner: String(owner),
    label: (target.label || 'this').trim() || 'this',
    text,
    elementId: target && typeof target.elementId === 'string' && target.elementId ? target.elementId : null,
    prepare: target && typeof target.prepare === 'function' ? target.prepare : null,
    next: target && typeof target.next === 'function' ? target.next : null,
  };
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
