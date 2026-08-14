// =============================================================================
// read-follow — highlight-as-it-reads + keep-the-words-in-sight (DR-0264)
// =============================================================================
// Darrell 2026-08-03: "the words that are being read to the users could be 6 or
// 60 years old... they should be able highlighted as it reads so users can see
// their place and the screen should move with the location of the words."
//
// The engine (lib/tts.js) already speaks SENTENCE-SIZED segments and reports
// segmentIndex on each one. This module supplies the other half: a map from
// those exact segments back to LIVE DOM ranges, so the control can highlight
// the sentence being spoken (word-level where the device fires boundaries) and
// scroll it into view.
//
// ALIGNMENT IS BY CONSTRUCTION, never by guess: buildFollowMap normalizes the
// container's visible text with the SAME whitespace collapse segmentText
// applies, keeps a char→(node,offset) map, and segments the normalized text
// with segmentText ITSELF. Feeding that same normalized text to read() means
// the engine's segment N and our range N are the same sentence, always.
//
// HIGHLIGHTING uses the CSS Custom Highlight API (no DOM mutation, no reflow,
// theme-safe styling via ::highlight() in index.css). Where the API is absent
// the highlight is a silent no-op and the auto-scroll still follows — the
// place-keeping floor works everywhere speech works.
import { segmentText } from './tts.js';
import { motionBehavior } from './gentle-motion.js';

// WHAT IS SKIPPED — and the bug that was hiding in this one line.
//
// `.print\:hidden` used to be here as a proxy for "floating chrome". It is not
// one. `print:hidden` means "not on the printed sheet", which is exactly how
// this app marks the whole SCREEN half of a screen-vs-print split — ChurchLearn
// wraps its ENTIRE view in `<div className="print:hidden">`
// (ChurchLearn.jsx:1619, :1864). So on Learn the map skipped every word on the
// page, buildFollowMap returned null, the reader fell back to unmapped speech,
// and the highlight had nothing to paint on — while Eternal Algorithms, which
// has no such wrapper, highlighted perfectly. That is the whole of "the
// highlighted Words work inside Eternal Algorithms not the Learn space"
// (Darrell 2026-08-10), measured in reader-learn-follow.test.jsx.
//
// The replacement is explicit rather than inferred: `[data-read-skip]` is a
// surface's own statement that something is chrome, not reading — a stage
// counter, a Next button, the tutor chat, facilitator-only notes — and
// `.ts-chrome-region` / `[role="dialog"]` are the app's existing names for
// floating chrome. A visibility rule for PAPER never again decides what a
// person is allowed to hear.
const SKIP_SELECTOR = '.tts-controls, [data-read-skip], [aria-hidden="true"], script, style, noscript, .install-prompt, .update-confirm, .ts-chrome-region, [role="dialog"]';

const isWs = (ch) => /\s/.test(ch);

/**
 * Walk the container's visible text nodes and build the normalized text plus a
 * per-character map back to (node, offset). Normalization mirrors segmentText:
 * every whitespace run collapses to one space. Pure DOM-read; no mutation.
 */
export function buildFollowMap(root, doc = typeof document !== 'undefined' ? document : null) {
  if (!root || !doc) return null;
  const chars = [];   // normalized characters
  const map = [];     // map[i] = { node, offset } for chars[i]
  let lastWasSpace = true; // leading whitespace never lands
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */, null);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || (parent.closest && parent.closest(SKIP_SELECTOR))) continue;
    const text = node.textContent || '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (isWs(ch)) {
        if (lastWasSpace) continue;
        chars.push(' ');
        map.push({ node, offset: i });
        lastWasSpace = true;
      } else {
        chars.push(ch);
        map.push({ node, offset: i });
        lastWasSpace = false;
      }
    }
  }
  // Trailing collapsed space never reaches segmentText (it trims); drop it so
  // positions match exactly.
  while (chars.length && chars[chars.length - 1] === ' ') { chars.pop(); map.pop(); }
  if (!chars.length) return null;

  const text = chars.join('');
  const segments = segmentText(text);
  // Locate each segment sequentially — segmentText emits them in order, so a
  // moving cursor pins every one even when sentences repeat.
  const located = [];
  let cursor = 0;
  for (const seg of segments) {
    const at = text.indexOf(seg, cursor);
    if (at === -1) { located.push(null); continue; } // never expected; stay honest
    located.push({ text: seg, start: at, end: at + seg.length });
    cursor = at + seg.length;
  }
  return { text, map, segments: located };
}

/** The live DOM Range covering normalized positions [start, end). */
export function rangeFor(follow, start, end, doc = typeof document !== 'undefined' ? document : null) {
  if (!follow || !doc || !(end > start)) return null;
  const a = follow.map[start];
  const b = follow.map[end - 1];
  if (!a || !b) return null;
  try {
    const r = doc.createRange();
    r.setStart(a.node, a.offset);
    r.setEnd(b.node, b.offset + 1);
    return r;
  } catch (_) { return null; }
}

/** The Range of segment N, or null. */
export function segmentRange(follow, index, doc) {
  const seg = follow && follow.segments ? follow.segments[index] : null;
  return seg ? rangeFor(follow, seg.start, seg.end, doc) : null;
}

/**
 * The Range of the word at charIndex within segment N (from the engine's
 * boundary event). Expands to the next whitespace in normalized space.
 */
export function wordRange(follow, index, charIndex, doc) {
  const seg = follow && follow.segments ? follow.segments[index] : null;
  if (!seg) return null;
  let start = seg.start + Math.max(0, charIndex | 0);
  if (start >= seg.end) return null;
  // If the boundary landed on a space, step to the word it introduces.
  while (start < seg.end && follow.text[start] === ' ') start++;
  let end = start;
  while (end < seg.end && follow.text[end] !== ' ') end++;
  return end > start ? rangeFor(follow, start, end, doc) : null;
}

/**
 * The segment index containing a DOM point (node + character offset) — the
 * "start where I tap" bridge (DR-0265): the tapped position resolves to its
 * normalized-text position via the char map, then to the sentence holding it.
 * Returns -1 when the point isn't part of the readable text.
 */
export function segmentIndexAtDomPoint(follow, node, offset) {
  if (!follow || !node) return -1;
  let pos = -1;
  for (let i = 0; i < follow.map.length; i++) {
    const m = follow.map[i];
    if (m.node === node && m.offset >= (offset | 0)) { pos = i; break; }
    if (m.node === node) pos = i; // last char of this node before the offset
  }
  if (pos === -1) return -1;
  for (let s = 0; s < follow.segments.length; s++) {
    const seg = follow.segments[s];
    if (seg && pos >= seg.start && pos < seg.end) return s;
    if (seg && pos < seg.start) return s; // point fell in inter-segment space
  }
  return follow.segments.length ? follow.segments.length - 1 : -1;
}

/**
 * Align independently-spoken segments to this container's text by moving-cursor
 * search — the "read this lesson start-to-finish" bridge (DR-0265). The spoken
 * text (the registered FULL lesson) can contain passages that are not rendered
 * (paced tutor steps); those return null and simply carry no highlight, while
 * every sentence that IS on screen highlights and scrolls. Never guesses.
 */
export function alignSegments(follow, spokenSegments, doc) {
  if (!follow || !Array.isArray(spokenSegments)) return [];
  let cursor = 0;
  return spokenSegments.map((seg) => {
    const s = String(seg || '');
    if (!s) return null;
    const at = follow.text.indexOf(s, cursor);
    if (at === -1) return null; // spoken but not rendered — honest gap, no highlight
    cursor = at + s.length;
    return rangeFor(follow, at, at + s.length, doc);
  });
}

/**
 * Which spoken segment a playback fraction (0..1) falls in, weighted by each
 * segment's character length — the CLOUD-audio sentence-follow bridge
 * (DR-0265): a cloned-voice clip has no word timings, but uniform-rate speech
 * maps fraction→characters well enough for sentence-level follow.
 */
export function segmentIndexAtFraction(lens, fraction) {
  const list = Array.isArray(lens) ? lens : [];
  const total = list.reduce((t, n) => t + (n > 0 ? n : 0), 0);
  if (!total) return -1;
  const f = Math.min(1, Math.max(0, Number(fraction) || 0));
  const pos = f * total;
  let acc = 0;
  for (let i = 0; i < list.length; i++) {
    acc += list[i] > 0 ? list[i] : 0;
    if (pos < acc) return i;
  }
  return list.length - 1;
}

export function supportsHighlight(win = typeof window !== 'undefined' ? window : null) {
  return !!(win && win.CSS && win.CSS.highlights && typeof win.Highlight === 'function');
}

// One named highlight per role; setting replaces the previous range so the
// "current sentence" and "current word" each exist at most once.
//
// `win` carries the SAME default as supportsHighlight. Without it, a caller that
// omits the argument (every call in TTSControl) passed `win === undefined` past a
// support check that had quietly defaulted to the real window and returned true —
// so `win.CSS` threw a TypeError into the bare catch below and every highlight
// was a silent no-op on every device. The support probe and the paint must read
// the same window or the check is answering about a different one.
function setNamed(name, range, win = typeof window !== 'undefined' ? window : null) {
  if (!supportsHighlight(win)) return false;
  try {
    if (!range) { win.CSS.highlights.delete(name); return true; }
    win.CSS.highlights.set(name, new win.Highlight(range));
    return true;
  } catch (_) { return false; }
}

export const SEGMENT_HIGHLIGHT = 'poe-read-seg';
export const WORD_HIGHLIGHT = 'poe-read-word';

export function highlightSegment(range, win) { return setNamed(SEGMENT_HIGHLIGHT, range, win); }
export function highlightWord(range, win) { return setNamed(WORD_HIGHLIGHT, range, win); }
export function clearReadingHighlights(win = typeof window !== 'undefined' ? window : null) {
  if (!supportsHighlight(win)) return;
  try { win.CSS.highlights.delete(SEGMENT_HIGHLIGHT); win.CSS.highlights.delete(WORD_HIGHLIGHT); } catch (_) { /* no-op */ }
}

/** Keep the spoken words in sight: center the range's nearest element. */
// THE SENTENCE BEING READ MUST BE VISIBLE, NOT UNDER THE HEADER.
//
// Darrell 2026-08-13, reading a lesson with the app's sticky chrome on screen:
// "the words are blocked at the top of the highlighted text while reading
// possibly because of the banner or whatever."
//
// Two things were wrong with `el.scrollIntoView({ block: 'center' })`:
//
//   1. It scrolled the ELEMENT, not the RANGE. The element is the whole
//      paragraph; the range is the sentence actually being spoken. Centring a
//      tall paragraph puts its opening lines above the viewport top — so on
//      exactly the long teaching paragraphs this app is made of, the words
//      being read were off-screen while the paragraph looked "centred".
//   2. It knew nothing about the fixed/sticky chrome. This app stacks a session
//      bar, the church banner and the sub-tab strip at the top, so "the top of
//      the viewport" is not where content becomes visible.
//
// The inset is MEASURED from the live document rather than typed as a constant:
// the chrome's height changes with the large-print setting, with which banners
// are dismissed, and between the church door and the PoeTech shell. A hardcoded
// number would be wrong for most readers on most screens.

/**
 * How far down the viewport the first genuinely visible pixel is — the combined
 * height of whatever fixed/sticky chrome is pinned to the top.
 *
 * Probed at three x positions so a narrow floating control cannot be mistaken
 * for a full-width bar, and clamped: a chrome claiming more than 45% of the
 * screen is an overlay or a mis-measure, and honouring it would scroll the
 * reading out of view instead of into it.
 */
export function stickyTopInset(win = (typeof window !== 'undefined' ? window : null),
  doc = (typeof document !== 'undefined' ? document : null)) {
  if (!win || !doc || typeof doc.elementsFromPoint !== 'function') return 0;
  try {
    const vh = win.innerHeight || 0;
    const vw = win.innerWidth || 0;
    if (!vh || !vw) return 0;
    let inset = 0;
    for (const x of [vw * 0.25, vw * 0.5, vw * 0.75]) {
      for (const el of doc.elementsFromPoint(Math.round(x), 2) || []) {
        if (!el || !el.getBoundingClientRect) continue;
        let pos = '';
        try { pos = (win.getComputedStyle(el) || {}).position || ''; } catch (_) { /* ignore */ }
        if (pos !== 'fixed' && pos !== 'sticky') continue;
        const r = el.getBoundingClientRect();
        // Only bars actually pinned at the top count; a fixed footer or a
        // floating button elsewhere must never push the reading down.
        if (r.top <= 2 && r.bottom > inset) inset = r.bottom;
      }
    }
    return Math.max(0, Math.min(inset, vh * 0.45));
  } catch (_) {
    return 0;
  }
}

/**
 * How far to scroll so the spoken sentence sits in comfortable reading space.
 * Pure arithmetic, so the rule is unit-testable without layout (jsdom has none).
 *
 * Returns the delta to scroll BY: positive scrolls down. 0 means it is already
 * well placed — a sentence that is merely low in the viewport is not moved,
 * because re-centring on every sentence makes the page twitch under the reader.
 */
export function readingScrollDelta({
  rangeTop = 0, rangeBottom = 0, topInset = 0, viewportHeight = 0, margin = 24,
} = {}) {
  const vh = Number(viewportHeight) || 0;
  if (!vh) return 0;
  const safeTop = Number(topInset) || 0;
  const top = Number(rangeTop) || 0;
  const bottom = Number(rangeBottom) || top;
  const restTop = safeTop + margin;          // first line that is genuinely readable
  const restBottom = vh - margin;

  // Hidden behind the chrome, or above the viewport entirely: bring it down to
  // just under the chrome. This is the case Darrell hit.
  if (top < restTop) return top - restTop;

  // Below the fold: lift it so the sentence STARTS in the reading band rather
  // than centring a tall one, which would push its opening back under the top.
  if (bottom > restBottom) {
    const height = Math.max(0, bottom - top);
    const room = Math.max(0, restBottom - restTop);
    return height >= room ? top - restTop : bottom - restBottom;
  }
  return 0;
}

/**
 * The breathing room to leave around the spoken sentence, in px.
 *
 * Darrell 2026-08-13: "Account for different font sizes as well." This app ships
 * five reading sizes (A through A44, lib/text-size), and a fixed 24px gap that
 * looks generous at A is thinner than a single line at A44 — the sentence would
 * sit jammed against the chrome for exactly the readers who most need space.
 *
 * So the margin is ONE LINE of whatever the reader has chosen, measured from
 * the text being read, with the old 24px kept only as a floor for when line
 * height cannot be resolved.
 */
export function readingMargin(el, win = (typeof window !== 'undefined' ? window : null)) {
  const FLOOR = 24;
  if (!el || !win || typeof win.getComputedStyle !== 'function') return FLOOR;
  try {
    const cs = win.getComputedStyle(el) || {};
    const lh = parseFloat(cs.lineHeight);
    if (Number.isFinite(lh) && lh > 0) return Math.max(FLOOR, Math.round(lh));
    // `line-height: normal` does not resolve to px — approximate from font size,
    // which is what the browser does anyway (~1.2x).
    const fs = parseFloat(cs.fontSize);
    if (Number.isFinite(fs) && fs > 0) return Math.max(FLOOR, Math.round(fs * 1.4));
    return FLOOR;
  } catch (_) {
    return FLOOR;
  }
}

export function followRange(range) {
  if (!range) return;
  try {
    const win = typeof window !== 'undefined' ? window : null;
    const doc = typeof document !== 'undefined' ? document : null;
    if (!win) return;
    // The RANGE's own box — the sentence — not the paragraph that contains it.
    const rect = typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null;
    const usable = rect && (rect.height > 0 || rect.width > 0);
    if (!usable) {
      // No layout for the range (a collapsed range, or a non-layout environment)
      // — fall back to the old element scroll rather than doing nothing.
      const el = range.startContainer && (range.startContainer.nodeType === 1
        ? range.startContainer
        : range.startContainer.parentElement);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: motionBehavior() });
      return;
    }
    const textEl = range.startContainer && (range.startContainer.nodeType === 1
      ? range.startContainer
      : range.startContainer.parentElement);
    const delta = readingScrollDelta({
      rangeTop: rect.top,
      rangeBottom: rect.bottom,
      topInset: stickyTopInset(win, doc),
      viewportHeight: win.innerHeight || 0,
      margin: readingMargin(textEl, win),
    });
    if (!delta) return;
    if (typeof win.scrollBy === 'function') win.scrollBy({ top: delta, behavior: motionBehavior() });
  } catch (_) { /* scrolling is best-effort */ }
}
