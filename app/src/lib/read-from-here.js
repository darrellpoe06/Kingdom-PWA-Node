// =============================================================================
// read-from-here — start the reading voice at the WORD the reader taps (DR-0144)
// =============================================================================
// "If Ari could start right at wherever users want it to start... whatever word
// on the page then it would be a intuitive experience." (Darrell, 2026-07-10.)
// The floating read-aloud control always read the whole page from the top —
// fine for "read me this page," wrong for "pick up where my eyes are." This
// module turns a TAP into a starting point: it maps the tapped screen position
// to a character in the SAME normalized text the page reader speaks, snaps back
// to the start of the tapped word, and hands back the tail of the page from
// that word on.
//
// How the mapping works (and why it is exact, not a guess): the reader speaks a
// whitespace-normalized version of the page (`\s+` collapsed to single spaces).
// We rebuild that exact string ourselves with a TreeWalker over the same root,
// skipping the same floating chrome the reader strips — and while building it we
// note the normalized index where the tapped DOM position (text node + offset)
// lands. One pass, no stored maps, deterministic (unit-tested in jsdom).
//
// Browser seam: the tap -> (text node, offset) step uses caretRangeFromPoint
// (Blink/WebKit) or caretPositionFromPoint (Firefox). Neither exists in jsdom,
// so `caretFromPoint` is a thin, injectable seam and everything else is pure.
// A device with neither API simply returns null — the caller falls back to
// reading from the top (never a crash, never a silent wrong start).
// =============================================================================

// The same floating chrome the page reader strips before speaking; a tap landing
// in these (or in anything aria-hidden) is not a reading position.
const STRIP_SELECTOR = '.tts-controls, .feedback-modal, [aria-hidden="true"], script, style, noscript';

function isStripped(node) {
  let el = node && (node.nodeType === 1 ? node : node.parentElement);
  while (el) {
    if (el.matches && el.matches(STRIP_SELECTOR)) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Build the normalized readable text of `root` (whitespace collapsed, block
 * boundaries reading as a single space) and, when `mark` names a DOM position
 * ({node, offset} inside a text node), the normalized index where it lands.
 * Pure DOM walking — no layout, no browser-only APIs.
 * @returns {{ text: string, index: number|null }}
 */
export function readableTextWithMark(root, mark = null) {
  const doc = root && (root.ownerDocument || root.document);
  if (!root || !doc) return { text: '', index: null };
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */, null);
  let out = '';
  let pendingSpace = false;
  let index = null;
  let node = walker.nextNode();
  while (node) {
    if (!isStripped(node)) {
      const t = node.nodeValue || '';
      for (let i = 0; i < t.length; i++) {
        if (mark && node === mark.node && i === mark.offset && index === null) {
          index = out.length + (pendingSpace && out ? 1 : 0);
        }
        const c = t[i];
        if (/\s/.test(c)) {
          pendingSpace = true;
        } else {
          if (pendingSpace && out) out += ' ';
          pendingSpace = false;
          out += c;
        }
      }
      if (mark && node === mark.node && index === null && mark.offset >= t.length) {
        index = out.length + (pendingSpace && out ? 1 : 0);
      }
      // A text-node boundary can be a block boundary; innerText reads it as
      // separation, so the normalized text does too.
      pendingSpace = true;
    }
    node = walker.nextNode();
  }
  if (index !== null && index > out.length) index = out.length;
  return { text: out, index };
}

/** Snap a normalized index back to the START of the word it lands in. */
export function snapToWordStart(text, index) {
  const t = String(text || '');
  let i = Math.max(0, Math.min(typeof index === 'number' ? index : 0, t.length));
  if (i >= t.length) return t.length;
  if (t[i] === ' ') i += 1; // tapped the gap — start at the next word
  return t.lastIndexOf(' ', i - 1) + 1; // -1 (no space before) yields 0 — the first word
}

/**
 * The browser seam: screen point -> {node, offset} caret position, cross-engine.
 * Returns null where neither API exists (jsdom, very old engines).
 */
export function caretFromPoint(doc, x, y) {
  if (!doc) return null;
  try {
    if (typeof doc.caretRangeFromPoint === 'function') {
      const r = doc.caretRangeFromPoint(x, y);
      return r ? { node: r.startContainer, offset: r.startOffset } : null;
    }
    if (typeof doc.caretPositionFromPoint === 'function') {
      const p = doc.caretPositionFromPoint(x, y);
      return p ? { node: p.offsetNode, offset: p.offset } : null;
    }
  } catch (_) { /* fall through — top-of-page fallback */ }
  return null;
}

/**
 * The whole move: tap at (x, y) inside `root` -> the page text FROM that word on.
 * Returns { text, startedAt } or null when the tap gives no usable position
 * (chrome, outside root, unsupported engine) — the caller falls back to the top.
 * `maxChars` matches the page reader's own cap so behavior stays identical.
 */
export function readFromPoint(root, x, y, { doc, maxChars = 32000 } = {}) {
  const d = doc || (root && root.ownerDocument);
  const caret = caretFromPoint(d, x, y);
  if (!caret || !caret.node) return null;
  const el = caret.node.nodeType === 1 ? caret.node : caret.node.parentElement;
  if (!el || !root.contains(el) || isStripped(caret.node)) return null;
  if (caret.node.nodeType !== 3) return null; // only a text position is a word
  const { text, index } = readableTextWithMark(root, caret);
  if (index === null || !text) return null;
  const start = snapToWordStart(text, index);
  const tail = text.slice(start, start + maxChars).trim();
  return tail ? { text: tail, startedAt: start } : null;
}
