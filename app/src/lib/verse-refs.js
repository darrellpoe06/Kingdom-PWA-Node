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

// A LIST AT THE TOP OF A LESSON IS NOT CONTEXT — IT IS AN INDEX.
//
// Darrell 2026-09-14, looking at lesson 151's Open block printing forty-one
// references before a word of teaching: "not any lists inside at the beginning
// of the lessons without context anyways doesn't help us humans anyway... one
// or two with points and the full scripture they are discussing in context".
//
// A lesson's `anchor.ref` carries every reference the WHOLE lesson stands on,
// so printing it verbatim at the opener is a bibliography wearing a teaching
// slot. One or two IS a citation doing work in a line — that stays. Three or
// more back to back is a run, and the run is dropped in favour of the theme it
// was supposed to introduce; nothing is lost, because every one of those
// references is named again inside the prose that discusses it, where
// WordInline opens it in place.
//
// Same threshold and same matcher as speech-shape collapseReferenceRuns, so the
// reader and the page agree on what counts as a list (DR-0391 decision 1).
export const ANCHOR_RUN_MIN = 3;

export function anchorIsRun(refText, min = ANCHOR_RUN_MIN) {
  return referencesIn(typeof refText === 'string' ? refText : '').length >= min;
}
