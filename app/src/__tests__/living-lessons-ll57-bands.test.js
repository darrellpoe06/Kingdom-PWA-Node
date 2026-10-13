// @vitest-environment node
// =============================================================================
// L57 Power to Tread — the worst child band in the corpus, re-authored whole
// =============================================================================
// MEASURED, not assumed. Before this change ll57's CHILD band read at Flesch-
// Kincaid grade 10.1 — the highest child register anywhere in 188 lessons, and
// nearly four grades ABOVE the teen band beneath it (6.3). A child opening this
// lesson was handed tenth-grade prose. It sat on three separate shrink-only
// ledgers at once: `inverted` (child read harder than teen), `childOverCeiling`
// (10.1 against a ceiling of 7.0), and full-levels `short` on ALL FOUR bands
// (child 0.16, youth absent, teen 0.19, senior 0.36).
//
// WHAT THE REGISTER PROBLEM ACTUALLY WAS, because the obvious diagnosis is
// wrong. The vocabulary was already child-appropriate — "bad spirits", "a dad
// handing you his keys". The SENTENCES were enormous. Flesch-Kincaid is driven
// by sentence length and syllables per word, so simple words in 40-word
// sentences still score as tenth grade. The rewrite keeps the same teaching and
// the same keys image and breaks it into short sentences.
//
// AND A SECOND DEFECT NOBODY WAS LOOKING FOR. The old child band carried two
// PARAPHRASES INSIDE QUOTATION MARKS — "Even the bad spirits have to listen
// when we use Your name!" and "Don't be happiest about the spirits obeying
// you." Neither is in Luke. Neither carried a reference, which is exactly why
// no gate ever saw them: the quotation gate walks spans that name a verse, and
// an unreferenced paraphrase in quote marks is invisible to it while looking,
// to a reader, precisely like His words. Both are now the verse itself.
//
// THREE MORE ELLIPSES INSIDE QUOTATIONS were found in the same module while
// fixing it — bigIdea, a quiz explanation, and a facilitator TALKING POINT,
// which is read aloud to a room. All three are now quoted whole (DR-0459,
// DR-0545).
//
// This file pins the outcome so the lesson cannot quietly slide back.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, BAND_ORDER, CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';

const L = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll57-'));
const BANDS = ['child', 'youth', 'teen', 'senior'];
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const norm = (s) => String(s).replace(/’/g, "'").replace(/\s+/g, ' ').trim();
const verse = (book, ch, v) => {
  const k = String(book).replace(/\s+/g, '');
  // Psalm/Psalms: the corpus cites "Psalm 91:13" and the file is Psalms.json.
  // The plural fallback is deliberate — without it this checker reports a
  // correct span as unresolved, which is a checker that lies about content.
  const p = join(KJV, `${k}.json`); const alt = join(KJV, `${k}s.json`);
  const f = existsSync(p) ? p : (existsSync(alt) ? alt : null);
  if (!f) return null;
  const c = JSON.parse(readFileSync(f, 'utf8')).chapters[Number(ch) - 1];
  return c && c[Number(v) - 1] != null ? c[Number(v) - 1] : null;
};
const walk = (node, path, fn) => {
  if (typeof node === 'string') fn(node, path);
  else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`, fn));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k, fn);
};

describe('the lesson carries all four bands, and they are real', () => {
  it('exists and has every band', () => {
    expect(L, 'll57 is not in the series').toBeTruthy();
    for (const b of BANDS) expect(L.levels[b], `${b} band missing`).toBeTruthy();
  });

  it('every band clears its fullness floor — it was short on ALL FOUR', () => {
    expect(shortBands(measureFullness(L))).toEqual([]);
  });

  it('the grades ASCEND, which is what leaving the inverted list means', () => {
    const g = measureLesson(L);
    const seq = BAND_ORDER.filter((b) => g.bands[b]).map((b) => g.bands[b].authored);
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i], `band ${i} reads easier than the one below it: ${seq.join(' < ')}`).toBeGreaterThanOrEqual(seq[i - 1]);
    }
    expect(isInverted(g)).toBe(false);
  });

  it('the CHILD band is under the child ceiling — it was 10.1', () => {
    const g = measureLesson(L);
    expect(g.bands.child.authored).toBeLessThan(CHILD_CEILING);
    // and not merely under it: the defect was a child reading four grades
    // above the teen band, so the margin is pinned rather than the bare pass.
    expect(g.bands.child.authored).toBeLessThan(g.bands.teen.authored);
  });

  it('the four bands are genuinely different, not one text relabelled', () => {
    for (const [pair, score] of Object.entries(measureDifferentiation(L).pairs)) {
      expect(score, `${pair} are near-duplicates (${score})`).toBeLessThan(DIFF_CEILING);
    }
  });
});

describe('HIS WORDS, in a lesson that had been paraphrasing them', () => {
  it('every referenced span is verbatim KJV', () => {
    const SPAN = /"([^"]{6,}?)"\s*\(?([1-3]?\s?[A-Z][a-zA-Z]+)\s+(\d+):(\d+)/g;
    const faults = []; let checked = 0;
    walk(L, '', (text, path) => {
      for (const m of text.matchAll(SPAN)) {
        checked += 1;
        const real = verse(m[2], m[3], m[4]);
        if (real == null) faults.push(`${path}: ${m[2]} ${m[3]}:${m[4]} does not resolve`);
        else if (!norm(real).includes(norm(m[1]))) faults.push(`${path}: NOT VERBATIM ${m[2]} ${m[3]}:${m[4]} — ${m[1].slice(0, 70)}`);
      }
    });
    expect(checked, 'the walk found nothing — the check would be vacuous').toBeGreaterThan(40);
    expect(faults).toEqual([]);
  });

  it('carries no ellipsis inside any quotation, anywhere in the module (DR-0459)', () => {
    // Three were found here: bigIdea, a quiz explanation, and a facilitator
    // talking point. The talking point is READ ALOUD to a room.
    const elided = [];
    walk(L, '', (text, path) => {
      for (const m of String(text).matchAll(/"([^"]{6,}?)"/g)) {
        if (/\.\.\.|…/.test(m[1])) elided.push(`${path}: ${m[1].slice(0, 60)}`);
      }
    });
    expect(elided).toEqual([]);
  });

  it('PROVEN-TO-CATCH: the two old paraphrases would be reported today', () => {
    // Neither sentence is in Luke. Both sat in quotation marks in the child
    // band. They were invisible to the quotation gate because they named no
    // verse — so this asserts the CONTENT is gone rather than trusting a gate
    // that structurally could not see it.
    const all = JSON.stringify(L);
    expect(all).not.toContain('Even the bad spirits have to listen when we use Your name');
    expect(all).not.toContain('Be happiest that your NAME is written in heaven');
    // and the real verse is present instead
    expect(L.levels.child).toContain('but rather rejoice, because your names are written in heaven');
  });

  it('quotes Luke 10:3 with its own opening clause intact', () => {
    // Caught in pre-flight: the draft youth band read "Behold, I send you
    // forth..." with a capital B. The verse is "Go your ways: behold, I send
    // you forth as lambs among wolves." Raising a case is an alteration.
    expect(verse('Luke', 10, 3)).toBe('Go your ways: behold, I send you forth as lambs among wolves.');
    expect(L.levels.youth).toContain('Go your ways: behold, I send you forth as lambs among wolves');
  });
});

describe('the teaching survived the rewrite', () => {
  const ALL = BANDS.map((b) => L.levels[b]).join(' ');

  it('keeps the delegated-authority image in every band that had it', () => {
    expect(/keys/i.test(L.levels.child)).toBe(true);
    expect(/keys/i.test(L.levels.youth)).toBe(true);
    expect(/I GIVE|I give unto you/.test(ALL)).toBe(true);
  });

  it('keeps both guardrails — not a dare, and not a talisman', () => {
    expect(/picture words|picture-words|own picture/i.test(ALL)).toBe(true);
    expect(/show off|stunt|dare/i.test(ALL)).toBe(true);
    expect(/lambs among wolves/.test(ALL)).toBe(true);
  });

  it('lands the pivot: the better joy is the name, not the power', () => {
    expect(/names are written in heaven/.test(ALL)).toBe(true);
    expect(/quiet (day|week)/i.test(ALL)).toBe(true);
  });

  it('names the lesson inside every band, so a reader knows where they are', () => {
    for (const b of BANDS) {
      expect(L.levels[b].slice(0, 200), `${b} does not name the lesson`).toMatch(/Power to Tread/);
    }
  });
});
