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
export function followRange(range) {
  if (!range) return;
  try {
    const el = range.startContainer && (range.startContainer.nodeType === 1
      ? range.startContainer
      : range.startContainer.parentElement);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: motionBehavior() });
  } catch (_) { /* scrolling is best-effort */ }
}
