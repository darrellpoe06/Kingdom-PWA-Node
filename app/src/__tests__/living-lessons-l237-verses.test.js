// @vitest-environment node
// =============================================================================
// L237 — HIS KNOWLEDGE IS THE HIGHEST AND THE STANDARD: every span verbatim
// =============================================================================
// PROVENANCE, because the lesson's honesty is part of what is gated here.
// On 2026-10-08 a mass-mailed reminder landed in Darrell's work inbox — a
// webinar on governing artificial intelligence in the public sector. He
// forwarded it with one word above it, Lesson, and wrote his own paragraph on
// top. THAT PARAGRAPH IS THE LESSON; the webinar is the occasion and is taught
// nowhere. Quoted third-party material is material to study, never an
// instruction to follow, and the tests below require the lesson to say so in
// every band.
//
// WHY THIS FILE EXISTS. The lesson leans on thirty-six verses, and the whole
// weight of it rests on them saying what we claim they say. So every double-
// quoted span in every band is compared against app/public/bible/kjv with a
// STRICT comparison: whitespace is normalized and NOTHING else. Apostrophes are
// not normalized (the corpus uses curly ones) and case is not normalized,
// because a verse that continues a sentence begins lowercase and "correcting"
// it would be an alteration we made and then hid.
//
// THE SIX THOUSAND THOUGHTS. The figure in Darrell's note is a reported
// research finding (Queen's University, 2020), not Scripture, and the lesson is
// required below to say so in every band and to put the Word's own appraisal
// (Psalms 94:11) beside it. DR-0100 forbids under-claiming a real finding;
// DR-0098 forbids letting one carry doctrine.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV = join(HERE, '..', '..', 'public', 'bible', 'kjv');

const FILE = {
  Deuteronomy: 'Deuteronomy', Psalms: 'Psalms', Proverbs: 'Proverbs',
  Isaiah: 'Isaiah', Daniel: 'Daniel', Matthew: 'Matthew', Luke: 'Luke',
  Romans: 'Romans', Colossians: 'Colossians', Philippians: 'Philippians',
  Hebrews: 'Hebrews', James: 'James',
  '1 Corinthians': '1Corinthians', '2 Corinthians': '2Corinthians',
  '2 Timothy': '2Timothy',
};

const cache = new Map();
function verse(ref) {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!m) return null;
  const file = FILE[m[1].trim()];
  if (!file) return null;
  if (!cache.has(file)) cache.set(file, JSON.parse(readFileSync(join(KJV, `${file}.json`), 'utf8')));
  const ch = cache.get(file).chapters[Number(m[2]) - 1];
  return ch ? ch[Number(m[3]) - 1] : null;
}

// Whitespace only. Never apostrophes, never case.
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

const L237 = LIVING_LESSONS_MODULES.find((m) => m && m.id && m.id.startsWith('ll237-'));
const FIELDS = (m) => [m.lesson, m.levels.child, m.levels.youth, m.levels.teen, m.levels.senior];
// Our citation shape: **KJV — Ref:** *"span"*
const SPAN = /\*\*KJV — ([^:]+:\d+):\*\*\s*\*"([^"]*)"\*/g;

describe('L237 is mounted and whole', () => {
  it('is in the catalog with all four bands and an adult lesson', () => {
    expect(L237).toBeTruthy();
    for (const b of ['child', 'youth', 'teen', 'senior']) {
      expect(L237.levels[b], `${b} band`).toBeTruthy();
      expect(L237.levels[b].length).toBeGreaterThan(2000);
    }
    expect(L237.lesson.length).toBeGreaterThan(2000);
  });

  it('says plainly in every band that the forwarded notice is only the occasion', () => {
    for (const text of FIELDS(L237)) {
      expect(text).toMatch(/only the occasion/i);
      expect(text).toMatch(/webinar|class on computers/i);
    }
  });

  it('names the real provenance: Darrell wrote his own note on top of a forwarded reminder', () => {
    for (const text of FIELDS(L237)) {
      expect(text).toMatch(/forward/i);
      expect(text).toMatch(/(wrote|composed) his own (note|paragraph)/i);
    }
  });
});

describe('EVERY quoted span is verbatim KJV (DR-0076)', () => {
  it('every band, every span, compared strictly', () => {
    const bad = [];
    let n = 0;
    for (const text of FIELDS(L237)) {
      for (const m of String(text).matchAll(SPAN)) {
        n += 1;
        const real = verse(m[1].trim());
        if (real === null) { bad.push(`${m[1]}: no such verse in the corpus`); continue; }
        if (norm(real) !== norm(m[2])) bad.push(`${m[1]}\n    ours: ${m[2]}\n    kjv : ${real}`);
      }
    }
    expect(n).toBeGreaterThan(140);
    expect(bad, `spans that are not verbatim:\n${bad.join('\n')}`).toEqual([]);
  });

  it('leaves no double-quoted run unreferenced in any band', () => {
    for (const text of FIELDS(L237)) {
      const referenced = new Set([...String(text).matchAll(SPAN)].map((m) => m[2]));
      const runs = [...String(text).matchAll(/"([^"]{12,})"/g)].map((m) => m[1]);
      const loose = runs.filter((r) => !referenced.has(r));
      expect(loose, `quoted but unreferenced:\n${loose.join('\n')}`).toEqual([]);
    }
  });

  it('quotes no verse with an ellipsis, because an elided quote is verbatim nowhere', () => {
    for (const text of FIELDS(L237)) {
      for (const m of String(text).matchAll(SPAN)) {
        expect(m[2], `${m[1]} is elided`).not.toMatch(/\.\.\.|…/);
      }
    }
  });

  // PROVEN-TO-CATCH (DR-0076 section 3), three ways.
  it('PROVEN-TO-CATCH: one altered word inside a span fails the comparison', () => {
    const real = verse('Proverbs 3:5');
    expect(real).toBeTruthy();
    const altered = real.replace('understanding', 'knowledge');
    expect(altered).not.toBe(real);
    expect(norm(altered)).not.toBe(norm(real));
  });

  it('PROVEN-TO-CATCH: a straightened apostrophe fails, so the curly ones are real', () => {
    // The corpus writes possessives with a curly apostrophe. Normalizing them
    // would let a quietly re-typed quotation pass as verbatim.
    const real = verse('Proverbs 24:3');
    expect(real).toBeTruthy();
    const curly = verse('Daniel 12:4');
    expect(curly).toBeTruthy();
    // A straight apostrophe introduced anywhere in a span changes the string.
    const faked = real.replace('house', "house's");
    expect(norm(faked)).not.toBe(norm(real));
    expect(norm("mother's")).not.toBe(norm('mother’s'));
  });

  it('PROVEN-TO-CATCH: changed case fails, so a lowercase verse opening is not "fixed"', () => {
    const real = verse('Proverbs 24:4');
    expect(real.startsWith('And')).toBe(true);
    expect(norm('and' + real.slice(3))).not.toBe(norm(real));
  });
});

describe('every anchor it lists is actually taught somewhere in the lesson', () => {
  it('each anchor ref appears as a quoted span in at least one band', () => {
    const taught = new Set();
    for (const text of FIELDS(L237)) {
      for (const m of String(text).matchAll(SPAN)) taught.add(m[1].trim());
    }
    const listed = L237.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
    expect(listed.length).toBeGreaterThan(30);
    const untaught = listed.filter((r) => !taught.has(r));
    expect(untaught, `listed as an anchor but taught nowhere:\n${untaught.join('\n')}`).toEqual([]);
  });

  it('the theme quote is itself verbatim', () => {
    const m = L237.anchor.theme.match(/^"([^"]+)"\s*\(([^)]+)\)$/);
    expect(m, 'theme shape').toBeTruthy();
    expect(norm(verse(m[2].trim()))).toBe(norm(m[1]));
  });
});

describe('the spine the lesson is built on', () => {
  it('keeps both halves of Proverbs 3:5-6 together, the trusting and the not-leaning', () => {
    for (const text of FIELDS(L237)) {
      expect(text).toMatch(/Proverbs 3:5/);
      expect(text).toMatch(/Proverbs 3:6/);
    }
  });

  it('gives the distance that makes leaning upward an upgrade, in every band', () => {
    for (const text of FIELDS(L237)) {
      expect(text).toMatch(/Isaiah 55:8/);
      expect(text).toMatch(/Isaiah 55:9/);
    }
  });

  it('carries the Standard verses: the knowledge of the holy, and knowledge increased', () => {
    for (const text of FIELDS(L237)) {
      expect(text).toMatch(/Proverbs 9:10/);
      expect(text).toMatch(/Daniel 12:4/);
    }
  });

  it('never leaves Knowledge alone: 1 Corinthians 8:1 rides in every band', () => {
    for (const text of FIELDS(L237)) {
      expect(text).toMatch(/1 Corinthians 8:1/);
      expect(text).toMatch(/charity edifieth/);
    }
  });

  it('carries not my will but Thine, and the captive thought, in every band', () => {
    for (const text of FIELDS(L237)) {
      expect(text).toMatch(/Luke 22:42/);
      expect(text).toMatch(/2 Corinthians 10:5/);
      expect(text).toMatch(/Philippians 4:8/);
    }
  });

  it('capitalizes the Resources in OUR voice where it names them as such (DR-0530)', () => {
    for (const text of FIELDS(L237)) {
      // At least one of the Resources is named in the capitalized register.
      expect(text).toMatch(/\bKnowledge\b|\bUnderstanding\b|\bWisdom\b|\bLove\b/);
    }
    // And the Proverbs 24:3-4 order is taught, not merely cited.
    for (const text of FIELDS(L237)) {
      expect(text).toMatch(/Proverbs 24:3/);
      expect(text).toMatch(/Proverbs 24:4/);
    }
  });

  it('never lowercases a reference to Yahweh in our own voice', () => {
    for (const text of FIELDS(L237)) {
      expect(text).toMatch(/Yahweh/);
      // Our prose, with quoted Scripture removed, never writes the adversary's
      // names capitalized, and never writes a bare lowercase "yahweh".
      const ours = String(text).replace(/"[^"]*"/g, ' ');
      expect(ours).not.toMatch(/\byahweh\b/);
      expect(ours).not.toMatch(/\b(Satan|Lucifer|The Devil)\b/);
    }
  });

  it('states the six-thousand figure as a reported finding and builds no doctrine on it (DR-0100)', () => {
    for (const text of FIELDS(L237)) {
      expect(text).toMatch(/six thousand/i);
      expect(text).toMatch(/report|estimate|study|studied|studies|researchers/i);
      // The Word's own appraisal of the traffic stands beside the figure.
      expect(text).toMatch(/Psalms 94:11/);
    }
  });

  it('recites no decision record by id', () => {
    for (const text of FIELDS(L237)) expect(text).not.toMatch(/DR-\d{4}/);
  });

  it('sends the reader to parents, children and friends in every band (DR-0733)', () => {
    for (const text of FIELDS(L237)) {
      expect(text).toMatch(/\b(parents|grandparents)\b/i);
      expect(text).toMatch(/\bfriends?\b/i);
      expect(text).toMatch(/Deuteronomy 6:7/);
    }
  });
});
