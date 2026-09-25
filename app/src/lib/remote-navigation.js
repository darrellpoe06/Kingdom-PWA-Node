// =============================================================================
// remote-navigation — drive the app from a TV remote's D-pad
// =============================================================================
// Darrell 2026-09-20: "How can I download the PoeTech or Love Corner App on the
// Firestick or other streaming devices since it's an android app?"
//
// The honest answer to the PACKAGING half is that our .apk is the wrong shape
// for a TV (portrait-locked, no leanback entry, touch-built — see the `tv` path
// in app-store.js). But the answer he actually wants is the app ON THE TV, and
// the route that works today is the browser. That route is only as good as the
// app's ability to be driven by a remote — which, before this module, it was
// not. So this is the half of the ask that is buildable now, and it also
// pre-pays for any future TV package, since a leanback APK would render these
// same pages.
//
// WHAT A REMOTE ACTUALLY SENDS. A Fire TV / Android TV D-pad arrives in the
// browser as ordinary ArrowUp/Down/Left/Right keydowns, and OK/Select as Enter.
// So "remote support" is keyboard support with one hard difference: a keyboard
// user has Tab and a mouse, and a remote user has NEITHER. Tab order is a
// single line through the document; a D-pad is two-dimensional. Following DOM
// order on a grid sends "right" to the next row. That is why the core of this
// module is SPATIAL, not sequential.
//
// WHY THE GEOMETRY IS A PURE FUNCTION. jsdom performs no layout, so every
// getBoundingClientRect() is zeros and a DOM-coupled implementation cannot be
// tested at all — it would pass on nothing and prove nothing (DR-0076 §3). The
// scoring core therefore takes plain rects and returns an index, so the real
// behaviour is exercised with real geometry in the suite, and the DOM shell
// around it stays thin enough to read.

/** Keys a D-pad produces, mapped to the axis they move on. */
export const DIRECTIONS = Object.freeze({
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
});

// Typing must keep its arrows. A remote user editing a text field still needs
// left/right to move the caret, and stealing that would strand them mid-word
// with no other way to move the cursor.
const TEXT_ENTRY = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
export function editsText(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = String(el.tagName || '').toUpperCase();
  if (!TEXT_ENTRY.has(tag)) return false;
  // A checkbox/radio/button-typed input does not consume arrows for a caret.
  if (tag !== 'INPUT') return true;
  const type = String(el.getAttribute('type') || 'text').toLowerCase();
  return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range'].includes(type);
}

/**
 * The centre of a rect, and its near edge along an axis. Both are needed: the
 * near edge decides whether a candidate is genuinely in the direction of
 * travel, while the centre is what distance is measured between.
 */
export function centreOf(r) {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Is `cand` in `dir` from `from`? Judged on the CENTRE, with a tolerance equal
 * to nothing — a candidate whose centre is level with or behind the origin's
 * centre is not "further down", however tall it is. Using edges instead lets a
 * tall neighbour qualify in every direction at once.
 */
export function inDirection(from, cand, dir) {
  const a = centreOf(from);
  const b = centreOf(cand);
  if (dir === 'up') return b.y < a.y;
  if (dir === 'down') return b.y > a.y;
  if (dir === 'left') return b.x < a.x;
  if (dir === 'right') return b.x > a.x;
  return false;
}

const DIRECTION_NAMES = new Set(['up', 'down', 'left', 'right']);

// How heavily drift across the axis of travel is punished. Pressing Right on a
// grid should reach the neighbour in the SAME ROW even when a tile one row down
// is a few pixels closer in a straight line; weighting the cross-axis is what
// makes the movement feel like a grid rather than a scatter. 3 was chosen so a
// full row's drift always outweighs a column's gap at our tile sizes.
export const CROSS_AXIS_WEIGHT = 3;

/** Lower is better. Primary axis distance, plus weighted cross-axis drift. */
export function score(from, cand, dir) {
  const a = centreOf(from);
  const b = centreOf(cand);
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const along = dir === 'up' || dir === 'down' ? dy : dx;
  const across = dir === 'up' || dir === 'down' ? dx : dy;
  return along + across * CROSS_AXIS_WEIGHT;
}

/**
 * Index of the best rect to move to, or -1 when there is nothing that way.
 * -1 is a real answer and the caller must respect it: at the edge of a screen
 * the focus STAYS PUT. Wrapping to the far side is disorienting on a TV, where
 * the user cannot see a cursor jump and has no pointer to recover with.
 */
export function nextInDirection(rects, fromIndex, dir) {
  const from = rects[fromIndex];
  if (!from || !DIRECTION_NAMES.has(dir)) return -1;
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < rects.length; i += 1) {
    if (i === fromIndex) continue;
    const cand = rects[i];
    if (!inDirection(from, cand, dir)) continue;
    const s = score(from, cand, dir);
    if (s < bestScore) { bestScore = s; best = i; }
  }
  return best;
}

// Elements a remote can land on. `tabindex="-1"` is deliberately excluded:
// it marks something reachable by script but not by sequential navigation, and
// a D-pad is sequential navigation by another name.
export const FOCUSABLE_SELECTOR = [
  'a[href]', 'button', 'input', 'select', 'textarea',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Is this element LAID OUT? Only a question about geometry — a real browser
 * gives a zero-area box to something collapsed or detached. jsdom performs no
 * layout and returns zeros for everything, so this is injectable and the suite
 * supplies its own rather than asserting against an engine that is not running.
 */
export function laidOut(el) {
  const r = el && typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect() : null;
  return !r || r.width > 0 || r.height > 0;
}

/**
 * Is this element SEMANTICALLY reachable? Separate from layout on purpose, and
 * the separation is a bug this module already had: with these checks living
 * inside the visibility predicate, injecting a predicate silently dropped them,
 * so a test double made `hidden` and `aria-hidden` elements focusable again.
 * They are exclusions the markup states outright, so they hold whatever the
 * geometry says and whatever a caller injects.
 */
export function reachable(el) {
  if (!el || el.disabled) return false;
  if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return false;
  return el.getAttribute('tabindex') !== '-1';
}

/** Visible, enabled, genuinely reachable elements under `root`. */
export function focusableIn(root, { isVisible } = {}) {
  if (!root || typeof root.querySelectorAll !== 'function') return [];
  const visible = isVisible || laidOut;
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => reachable(el) && visible(el),
  );
}

// Elements that OWN the arrow keys for their own behaviour. Text entry is the
// obvious one and was handled from the start; these two were not, and both were
// found by checking rather than by reasoning about the design:
//
//   · <video> / <audio>. On a television this is the whole point — The Love
//     Corner's reason to be on a big screen is watching the service, and
//     ChurchLearn renders `<video controls>`. Left/Right seek and Up/Down set
//     volume. Stealing those would break the one thing the viewer came for, on
//     the one surface built for it.
//   · <input type="range">. A slider IS its arrow keys; without them it cannot
//     be moved by a remote at all. editsText() deliberately answers false for
//     range because no caret is involved, which is correct for its own question
//     and exactly why a second, wider question is needed here.
//
// Native controls may or may not call preventDefault before this listener sees
// the event — Chromium's media controls live in shadow DOM and the behaviour
// differs by element and by focus target. Relying on that would be assuming
// (DR-0076); declaring the ownership outright does not depend on it.
const OWNS_ARROWS = new Set(['VIDEO', 'AUDIO']);
export function consumesArrows(el) {
  if (!el) return false;
  if (editsText(el)) return true;
  const tag = String(el.tagName || '').toUpperCase();
  if (OWNS_ARROWS.has(tag)) return true;
  return tag === 'INPUT' && String(el.getAttribute('type') || '').toLowerCase() === 'range';
}

// FOCUS IS NOT ENOUGH ON ITS OWN — THE TARGET HAS TO BE ON SCREEN.
//
// Darrell 2026-09-20, on the Fire TV: "I can't pick lessons outside of what the
// screen shows.... the scrolling isn't working for the lessons lists." A
// television browser drives a POINTER with the D-pad, and a pointer cannot
// reach a list item below the fold — there is no wheel, no thumb, and no Tab
// key on a remote. Walking focus down the list is the mechanism that reaches
// them, and it only works if each step brings its target into view.
//
// .focus() does scroll by default, but its behaviour is the browser's choice
// and an old engine may jump the page or do nothing. scrollIntoView with
// block:'nearest' is explicit: it moves the minimum needed, so walking a long
// list creeps rather than lurching a screen at a time. `preventScroll` on the
// focus call keeps the two from fighting over the same movement.
export function focusAndReveal(el) {
  if (!el || typeof el.focus !== 'function') return;
  try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); }
  if (typeof el.scrollIntoView === 'function') {
    try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (_) { el.scrollIntoView(); }
  }
}

// ON A TELEVISION, A FIELD IS NOT A DEAD END (DR-0655). Measured in Chromium
// on a Fire-TV-shaped page (Silk user agent, 960x540): on the Notes tab the
// D-pad walked down into the one-voice text box and every later press stayed
// there, 25 of 25, while "Record a conversation" sat 200px below. A keyboard
// has Tab; a remote does not, so a field that keeps every arrow is a trap.
// On a TV an arrow leaves a text field when the caret can go no further that
// way: at the start for Left and Up, at the end for Right and Down (a
// single-line field has no lines, so Up and Down always leave it). A caret
// with room to move still moves. Off a TV nothing changes: a keyboard user
// typing at the end of a field keeps Right to themselves.
export function caretAtEdge(el, dir) {
  try {
    if (!el || el.isContentEditable) return false;
    const tag = String(el.tagName || '').toUpperCase();
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start == null || end == null || start !== end) return false;
    const len = String(el.value == null ? '' : el.value).length;
    if (tag === 'INPUT' && (dir === 'up' || dir === 'down')) return true;
    if (dir === 'left' || dir === 'up') return start === 0;
    if (dir === 'right' || dir === 'down') return end === len;
    return false;
  } catch (_) { return false; }
}

/** Does the document say it is a TV (lib/tv-device.js)? */
function onTv(doc) {
  try { return !!(doc && doc.documentElement && doc.documentElement.getAttribute('data-device') === 'tv'); } catch (_) { return false; }
}

/**
 * Handle one keydown. Returns the element focused, or null when the event was
 * left alone — which is the common case and must stay cheap and predictable.
 */
// THE PAGE BEFORE THE FLOATERS (DR-0655). Feedback, Give, the reader's
// speaker, a connection badge and a sticky tab row sit over the page at fixed
// places. Measured on a Fire-TV-shaped Chromium (960x540), every Down on a
// long page went content -> "Church" (sticky) -> "4G" (fixed) -> "Open
// feedback" (fixed) -> the next content, so walking a lesson list took four
// presses a step. From a control IN the page, the move now stays in the page
// when the page has anything that way; the floaters are reached when it does
// not (at the end of the page) or from each other, or sideways.
export function isPinned(el) {
  try {
    const view = el && el.ownerDocument && el.ownerDocument.defaultView;
    if (!view || typeof view.getComputedStyle !== 'function') return false;
    for (let p = el; p && p.nodeType === 1; p = p.offsetParent || null) {
      const pos = view.getComputedStyle(p).position;
      if (pos === 'fixed' || pos === 'sticky') return true;
      if (!p.offsetParent) {
        // A fixed element has no offsetParent; neither does <body>. Ask once more of the parent chain.
        for (let q = p.parentElement; q; q = q.parentElement) {
          const qp = view.getComputedStyle(q).position;
          if (qp === 'fixed' || qp === 'sticky') return true;
        }
        return false;
      }
    }
    return false;
  } catch (_) { return false; }
}

export function handleRemoteKey(event, root, { rectOf, isVisible, tv, pinned } = {}) {
  if (!event || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;
  const doc = root && root.ownerDocument ? root.ownerDocument : (root || null);
  const active = doc && doc.activeElement ? doc.activeElement : null;
  const isTv = tv != null ? !!tv : onTv(doc);
  const isSelect = !!active && String(active.tagName || '').toUpperCase() === 'SELECT';

  // OK on a list, on a TV, opens the list (DR-0655). With the arrows no longer
  // changing it, the picker is how a remote chooses.
  if (isTv && isSelect && event.key === 'Enter' && typeof active.showPicker === 'function') {
    try { active.showPicker(); if (typeof event.preventDefault === 'function') event.preventDefault(); return active; } catch (_) { return null; }
  }

  const dir = DIRECTIONS[event.key];
  if (!dir) return null;

  // A LIST DOES NOT CHANGE ITSELF UNDER A PASSING D-PAD, ON A TV (DR-0655).
  // Measured: one Down on the reader's "Start at" list chose paragraph 1 and
  // started reading, and the arrows could never leave the list. On a TV the
  // arrows move on past it and OK opens it.
  if (isTv && isSelect) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
  } else if (consumesArrows(active) && !(isTv && editsText(active) && caretAtEdge(active, dir))) {
    return null;
  }

  const items = focusableIn(root, { isVisible });
  if (!items.length) return null;

  const measure = rectOf || ((el) => el.getBoundingClientRect());
  const fromIndex = items.indexOf(active);

  // Nothing focused yet — the first D-pad press should adopt the first item
  // rather than do nothing, or the remote appears dead on a fresh page.
  if (fromIndex === -1) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    focusAndReveal(items[0]);
    return items[0];
  }

  const rects = items.map(measure);
  const pinnedOf = pinned || isPinned;
  let next = -1;
  if (!pinnedOf(active)) {
    // The page first: the same search over the in-page controls only.
    const inPage = [];
    items.forEach((el, i) => { if (i === fromIndex || !pinnedOf(el)) inPage.push(i); });
    const k = nextInDirection(inPage.map((i) => rects[i]), inPage.indexOf(fromIndex), dir);
    if (k !== -1) next = inPage[k];
  }
  if (next === -1) next = nextInDirection(rects, fromIndex, dir);
  if (next === -1) return null; // At the edge: stay put, and let the page scroll.
  if (typeof event.preventDefault === 'function') event.preventDefault();
  focusAndReveal(items[next]);
  return items[next];
}

// =============================================================================
// Wiring — one document-level listener, installed at boot.
// =============================================================================
// Document-level rather than per-component because a remote must work on every
// surface, including the ones nobody thought about while writing this. A
// capture-phase listener would steal keys from components that handle their
// own arrows (the lightbox, the presenter, the section tabs all do); bubbling
// means anything that calls stopPropagation keeps its keys, and this only sees
// what nothing else wanted. That ordering is the whole reason it is safe to
// install globally.
export function wireRemoteNavigation(doc = typeof document === 'undefined' ? null : document) {
  if (!doc || !doc.addEventListener) return () => {};
  const onKeyDown = (event) => {
    if (event.defaultPrevented) return; // Someone nearer the element already handled it.
    handleRemoteKey(event, doc.body);
  };
  doc.addEventListener('keydown', onKeyDown);
  return () => doc.removeEventListener('keydown', onKeyDown);
}
