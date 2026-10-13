// =============================================================================
// OUR EMPHASIS NEVER GOES INSIDE A QUOTATION OF THE WORD — a shrink-only ratchet
// =============================================================================
// Added 2026-09-17 during the DR-0418 pass, after L96's audit surfaced a class
// none of the previous fifteen lessons had shown:
//
//     "meditate therein day and night, that thou mayest observe to DO"
//
// Joshua 1:8 reads `to do`. Someone capitalised a word INSIDE the quotation
// marks to stress it. Sweeping the catalog found 26 distinct spans of the same
// kind across 17 lessons -- "Jesus WEPT", "let the peace of God RULE in your
// hearts", "whatsoever things are TRUE", "shout for JOY", "seek ye FIRST the
// kingdom".
//
// WHY THIS IS TREATED AS A DEFECT RATHER THAN A CONVENTION, which is a
// distinction this pass has had to draw carefully and once got wrong by
// over-claiming. Emphasis inside a quotation is ordinary teaching practice --
// WHEN IT IS MARKED. "Emphasis added", "emphasis mine": the note is what makes
// it honest, and not one of these 26 carries it. Two further things make it
// worse here than in a generic text:
//
//   1. Unlike a trailing comma at a quotation's edge, capitals make a CLAIM
//      ABOUT MEANING -- they assert what the verse stresses. A reader has no
//      way to tell our stress from the text's own.
//   2. In THIS corpus, ALL-CAPS inside Scripture already signifies something
//      specific: the divine name (`LORD`, `GOD`). Borrowing the same device
//      for our emphasis overloads a convention the text is already using.
//
// SO WHY A RATCHET INSTEAD OF A SWEEP. The apostrophe class was fixed catalog-
// wide in one commit because the repair was mechanical -- swap a character,
// nothing else moves. This one is not: removing the capitals deletes an
// emphasis the author intended, so an honest fix rewrites the surrounding prose
// to carry that stress OUTSIDE the quotation. That is an editorial change to 17
// lessons of Scripture teaching, and it is not mine to make unilaterally. The
// ratchet is the honest middle: NOTHING NEW CAN LAND, the debt is measured and
// named per lesson, and the count can only go down. It is the same shape as
// full-levels-baseline.json, which is how this repo already records measured
// debt it intends to pay.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import baseline from '../lib/quoted-emphasis-baseline.json';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');

const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join(' ')}\n`;
  }
  return all;
})();

const spansOf = (text) => {
  const at = [...text.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(text.slice(at[i] + 1, at[i + 1]));
  return out;
};

const strings = (value, out = []) => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
};

// A span is this defect when it is NOT corpus text, but becomes verbatim once
// its ALL-CAPS words are lowercased. That test is deliberately narrow: `LORD`
// and `GOD` are genuinely capitalised in the KJV, so lowercasing them would
// NOT produce a match and they are never flagged.
const findEmphasisInQuotes = () => {
  const found = {};
  for (const module of LIVING_LESSONS_MODULES) {
    const hits = new Set();
    for (const text of strings(module)) {
      for (const span of spansOf(text)) {
        for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
          if (KJV_FLOW.includes(part)) continue;
          if (!/\b[A-Z]{2,}\b/.test(part)) continue;
          const lowered = part.replace(/\b[A-Z]{2,}\b/g, (w) => w.toLowerCase());
          if (lowered !== part && KJV_FLOW.includes(lowered)) hits.add(part);
        }
      }
    }
    if (hits.size) found[module.id] = [...hits].sort();
  }
  return found;
};

describe('our emphasis never goes inside a quotation of the Word (ratchet)', () => {
  const found = findEmphasisInQuotes();

  it('NOTHING NEW lands — every instance is one the baseline already records', () => {
    const unrecorded = [];
    for (const [id, spans] of Object.entries(found)) {
      const known = baseline.byLesson[id] || [];
      for (const span of spans) if (!known.includes(span)) unrecorded.push({ id, span });
    }
    const report = unrecorded.map((u) => ` - ${u.id}\n     ${JSON.stringify(u.span.slice(0, 90))}`).join('\n');
    expect(
      unrecorded,
      `NEW emphasis added inside a quotation of the Word. Put the stress in our own prose outside the quotation instead:\n${report}`,
    ).toEqual([]);
  });

  it('the count only shrinks — a paid-off instance must be removed from the baseline', () => {
    const total = Object.values(found).reduce((a, b) => a + b.length, 0);
    expect(total, 'more instances than the baseline records').toBeLessThanOrEqual(baseline.distinctSpans);
    // And the baseline may not silently grow: if a lesson is fixed, its entry
    // comes out, and this number goes down with it.
    expect(baseline.distinctSpans).toBeLessThanOrEqual(26);
  });

  it('is PROVEN-TO-CATCH — the detector fires on the real form it was built from', () => {
    // L96's instance, the one that surfaced the class. Both directions pinned.
    expect(KJV_FLOW.includes('that thou mayest observe to do')).toBe(true);
    expect(KJV_FLOW.includes('that thou mayest observe to DO')).toBe(false);
    // And a second, from a different lesson:
    expect(KJV_FLOW.includes('let the peace of God rule in your hearts')).toBe(true);
    expect(KJV_FLOW.includes('let the peace of God RULE in your hearts')).toBe(false);
  });

  it('never flags the caps the KJV itself carries', () => {
    // The guard on the guard: lowercasing the divine name does NOT produce a
    // corpus match, so these can never be mistaken for our emphasis.
    for (const real of ['the LORD thy God', 'I am the LORD', 'KING OF KINGS, AND LORD OF LORDS']) {
      expect(KJV_FLOW.includes(real), `corpus carries: ${real}`).toBe(true);
      const lowered = real.replace(/\b[A-Z]{2,}\b/g, (w) => w.toLowerCase());
      expect(KJV_FLOW.includes(lowered), `and NOT the lowercased form: ${lowered}`).toBe(false);
    }
  });
});
