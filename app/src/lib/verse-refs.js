// =============================================================================
// verse-refs — cut a paragraph around every Scripture reference it names
// =============================================================================
// Darrell, 2026-09-08: "really anywhere should have this ability... so the
// scriptures can always be read... anywhere at anytime... simple functions
// just to show the Word."
//
// A reference inside prose ("...our likeness in Genesis 1:26 is FAMILY
// language...") is a place the Word can open. This module does the pure part:
// it splits text into segments — plain runs and references — so a renderer
// can draw the runs as text and each reference as a tap-to-open chip, in
// order, without changing a character of the prose. The matcher is the one
// shared scanner (video-harvest.js findScriptureRefs), so what counts as a
// reference is decided in exactly one place.
//
// Pure: no DOM, no fetch. A renderer decides what a segment looks like.
// =============================================================================
import { findScriptureRefs } from './video-harvest.js';

/**
 * [{ type: 'text', value }, { type: 'ref', value, raw }] in reading order.
 * `value` on a ref is the canonical reference ("1 John 4:8", "Genesis 6:2-4");
 * `raw` is exactly what the prose said, so the chip shows the author's words.
 * Empty or non-string input yields []. Text with no reference yields one
 * text segment, so a caller never has to special-case it.
 */
export function segmentByReferences(text) {
  const s = (typeof text === 'string') ? text : '';
  if (!s) return [];
  const hits = findScriptureRefs(s);
  if (!hits.length) return [{ type: 'text', value: s }];
  const out = [];
  let at = 0;
  for (const h of hits) {
    if (h.start > at) out.push({ type: 'text', value: s.slice(at, h.start) });
    out.push({ type: 'ref', value: h.ref, raw: h.raw });
    at = h.end;
  }
  if (at < s.length) out.push({ type: 'text', value: s.slice(at) });
  return out;
}

/** The distinct references a text names, in first-appearance order. */
export function referencesIn(text) {
  const seen = new Set();
  const out = [];
  for (const seg of segmentByReferences(text)) {
    if (seg.type !== 'ref') continue;
    const k = seg.value.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(seg.value); }
  }
  return out;
}
