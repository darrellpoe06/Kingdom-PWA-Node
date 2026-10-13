// @vitest-environment node
// =============================================================================
// L235 — TEN CHRISTMASES LEFT, AND EVERY KNEE SHALL BOW: every span verbatim
// =============================================================================
// Spoken into the PoeTech app on 2026-10-09 and transcribed by Whisper on the
// NAS CPU rung. The recording is a street interview: a camera wants one number
// out of a man, the age he became a millionaire, and nearly every answer he
// gives refuses the question. Our own machine marked three voices and named
// none, so the lesson names none and does not vouch for the figures he gave.
// What it studies is what the Word says about a counted life.
//
// WHY THIS FILE EXISTS. The lesson leans on twenty-seven verses, and the whole
// weight of it rests on them saying what we claim they say. So every double-
// quoted span in every band is compared against app/public/bible/kjv with a
// STRICT comparison: whitespace is normalized and NOTHING else. Apostrophes are
// not normalized (the corpus uses curly ones, as in Job 1:21 mother’s) and case
// is not normalized, because a verse that continues a sentence begins lowercase
// and "correcting" it would be an alteration we made and then hid.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV = join(HERE, '..', '..', 'public', 'bible', 'kjv');

const FILE = {
  Genesis: 'Genesis', Deuteronomy: 'Deuteronomy', Job: 'Job', Psalms: 'Psalms',
  Proverbs: 'Proverbs', Ecclesiastes: 'Ecclesiastes', Isaiah: 'Isaiah',
  Matthew: 'Matthew', Mark: 'Mark', Luke: 'Luke', Romans: 'Romans',
  Philippians: 'Philippians', Hebrews: 'Hebrews', James: 'James',
  '1 Timothy': '1Timothy', '1 Chronicles': '1Chronicles',
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

const L235 = LIVING_LESSONS_MODULES.find((m) => m && m.id && m.id.startsWith('ll235-'));
const FIELDS = (m) => [m.lesson, m.levels.child, m.levels.youth, m.levels.teen, m.levels.senior];
// Our citation shape: **KJV — Ref:** *"span"*
const SPAN = /\*\*KJV — ([^:]+:\d+):\*\*\s*\*"([^"]*)"\*/g;

describe('L235 is mounted and whole', () => {
  it('is in the catalog with all four bands and an adult lesson', () => {
    expect(L235).toBeTruthy();
    for (const b of ['child', 'youth', 'teen', 'senior']) {
      expect(L235.levels[b], `${b} band`).toBeTruthy();
      expect(L235.levels[b].length).toBeGreaterThan(2000);
    }
    expect(L235.lesson.length).toBeGreaterThan(2000);
  });

  it('says plainly that the speakers are not identified', () => {
    for (const text of FIELDS(L235)) {
      expect(text).toMatch(/not identified|named none/i);
    }
  });

  it('does not name a speaker, and does not vouch for the figures', () => {
    for (const text of FIELDS(L235)) {
      expect(text).toMatch(/not vouching|not saying those numbers/i);
    }
  });
});

describe('EVERY quoted span is verbatim KJV (DR-0076)', () => {
  it('every band, every span, compared strictly', () => {
    const bad = [];
    let n = 0;
    for (const text of FIELDS(L235)) {
      for (const m of String(text).matchAll(SPAN)) {
        n += 1;
        const real = verse(m[1].trim());
        if (real === null) { bad.push(`${m[1]}: no such verse in the corpus`); continue; }
        if (norm(real) !== norm(m[2])) bad.push(`${m[1]}\n    ours: ${m[2]}\n    kjv : ${real}`);
      }
    }
    expect(n).toBeGreaterThan(100);
    expect(bad, `spans that are not verbatim:\n${bad.join('\n')}`).toEqual([]);
  });

  it('leaves no double-quoted run unreferenced in any band', () => {
    for (const text of FIELDS(L235)) {
      const referenced = new Set([...String(text).matchAll(SPAN)].map((m) => m[2]));
      const runs = [...String(text).matchAll(/"([^"]{12,})"/g)].map((m) => m[1]);
      const loose = runs.filter((r) => !referenced.has(r));
      expect(loose, `quoted but unreferenced:\n${loose.join('\n')}`).toEqual([]);
    }
  });

  it('quotes no verse with an ellipsis, because an elided quote is verbatim nowhere', () => {
    for (const text of FIELDS(L235)) {
      for (const m of String(text).matchAll(SPAN)) {
        expect(m[2], `${m[1]} is elided`).not.toMatch(/\.\.\.|…/);
      }
    }
  });

  // PROVEN-TO-CATCH (DR-0076 section 3), both directions.
  it('PROVEN-TO-CATCH: one altered word inside a span fails the comparison', () => {
    const real = verse('Psalms 90:12');
    expect(real).toBeTruthy();
    const altered = real.replace('wisdom', 'knowledge');
    expect(altered).not.toBe(real);
    expect(norm(altered)).not.toBe(norm(real));
  });

  it('PROVEN-TO-CATCH: a straightened apostrophe fails, so the curly ones are real', () => {
    const real = verse('Job 1:21');
    expect(real).toContain('mother’s');
    expect(norm(real.replace('mother’s', "mother's"))).not.toBe(norm(real));
  });

  it('PROVEN-TO-CATCH: changed case fails, so a lowercase verse opening is not "fixed"', () => {
    const real = verse('1 Timothy 6:18');
    expect(real.startsWith('That')).toBe(true);
    expect(norm('that' + real.slice(4))).not.toBe(norm(real));
  });
});

describe('every anchor it lists is actually taught somewhere in the lesson', () => {
  it('each anchor ref appears as a quoted span in at least one band', () => {
    const taught = new Set();
    for (const text of FIELDS(L235)) {
      for (const m of String(text).matchAll(SPAN)) taught.add(m[1].trim());
    }
    const listed = L235.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
    expect(listed.length).toBeGreaterThan(20);
    const untaught = listed.filter((r) => !taught.has(r));
    expect(untaught, `listed as an anchor but taught nowhere:\n${untaught.join('\n')}`).toEqual([]);
  });

  it('the theme quote is itself verbatim', () => {
    const m = L235.anchor.theme.match(/^"([^"]+)"\s*\(([^)]+)\)$/);
    expect(m, 'theme shape').toBeTruthy();
    expect(norm(verse(m[2].trim()))).toBe(norm(m[1]));
  });
});

describe('the spine the lesson is built on', () => {
  it('teaches the counted life from Psalms and James in every band', () => {
    for (const text of FIELDS(L235)) {
      expect(text).toMatch(/Psalms 90:12/);
      expect(text).toMatch(/James 4:14/);
    }
  });

  it('keeps Deuteronomy 8:17 and 8:18 together, the sin and the correction', () => {
    for (const text of FIELDS(L235)) {
      expect(text).toMatch(/Deuteronomy 8:17/);
      expect(text).toMatch(/Deuteronomy 8:18/);
    }
  });

  it('carries the confession in every band', () => {
    for (const text of FIELDS(L235)) {
      expect(text).toMatch(/Philippians 2:10/);
      expect(text).toMatch(/Philippians 2:11/);
    }
  });

  it('names the barns passage as a parable, never as a record (DR-0811)', () => {
    for (const text of FIELDS(L235)) {
      expect(text).toMatch(/parable/i);
      expect(text).toMatch(/not a (news )?report|not a journalistic report/i);
    }
  });

  it('recites no decision record by id', () => {
    for (const text of FIELDS(L235)) expect(text).not.toMatch(/DR-\d{4}/);
  });
});
