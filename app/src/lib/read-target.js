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
    // What a floating reader and the lock screen name (DR-0641): the piece's
    // own title. Optional; '' when not given.
    title: target && typeof target.title === 'string' ? target.title.trim() : '',
    text,
    elementId: target && typeof target.elementId === 'string' && target.elementId ? target.elementId : null,
    prepare: target && typeof target.prepare === 'function' ? target.prepare : null,
    next: target && typeof target.next === 'function' ? target.next : null,
    // THE READER CAN SWITCH THE LEVEL TOO (Darrell 2026-09-15, DR-0426): a
    // lesson registers who it is pitched for and how to change that, so the
    // reading panel can offer the same "Who is learning?" row the lesson does
    // and re-read the new level's words from the same place.
    level: target && typeof target.level === 'string' ? target.level : null,
    levels: target && Array.isArray(target.levels) ? target.levels : null,
    setLevel: target && typeof target.setLevel === 'function' ? target.setLevel : null,
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

// =============================================================================
// PLAY MEANS READ IT (Darrell 2026-09-14, for the third time and in capitals:
// "Play Button reads the lesson!!!!! Does not open the PowerPoint!!! Reads the
// lesson front to back")
// =============================================================================
// The Play button opened the presenter deck. Twice it was "fixed" and twice it
// still opened a deck -- first it landed on the presenter CONSOLE, then it
// landed on the deck already presenting. Neither is what he asked for. Play
// means the reader reads the lesson, start to finish.
//
// The reader is page-level and the lesson's reading is registered by the lesson
// component, so Play cannot simply call a function on it. It records a WANT
// here instead: the owner whose reading should begin as soon as it exists. The
// reader subscribes, and when the matching target registers it reads it and
// clears the want.
//
// The want is keyed by OWNER rather than being a bare boolean, so pressing Play
// on lesson A and then lesson B before A has mounted cannot make the reader
// read A. A want is also dropped after one use and expires, because a stale
// want that fires minutes later would start speech nobody asked for.
let wanted = null; // { owner, at } | null
const wantSubs = new Set();
const WANT_TTL_MS = 15000;

function notifyWant() {
  for (const fn of wantSubs) {
    try { fn(wanted); } catch { /* a bad subscriber never breaks the rest */ }
  }
}

/** Ask for `owner`'s reading to begin as soon as that target is registered. */
export function requestRead(owner) {
  if (!owner) return;
  wanted = { owner, at: Date.now() };
  notifyWant();
}

/** The pending want, or null when there is none or it has gone stale. */
export function pendingRead(now = Date.now()) {
  if (!wanted) return null;
  if (now - wanted.at > WANT_TTL_MS) { wanted = null; return null; }
  return wanted;
}

/** Consume the want for `owner`. Returns true when it was indeed theirs. */
export function takeRead(owner, now = Date.now()) {
  const w = pendingRead(now);
  if (!w || w.owner !== owner) return false;
  wanted = null;
  notifyWant();
  return true;
}

export function clearRead() { wanted = null; notifyWant(); }

export function subscribeRead(fn) {
  wantSubs.add(fn);
  return () => wantSubs.delete(fn);
}

/** Subscribe to target changes. Returns the unsubscribe function. */
export function subscribeReadTarget(fn) {
  if (typeof fn !== 'function') return () => {};
  subs.add(fn);
  return () => subs.delete(fn);
}
