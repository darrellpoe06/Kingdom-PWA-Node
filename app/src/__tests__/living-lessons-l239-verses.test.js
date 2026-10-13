// @vitest-environment node
// =============================================================================
// L239 — THE KING SITS DOWN FIRST: every span verbatim
// =============================================================================
// Darrell forwarded a business newsletter into the app on 2026-10-07 with one
// word on top, Lesson. The newsletter's lead item reported that a privately
// held defence-technology firm had announced a shipyard in Maryland on the same
// day the Navy awarded it a submarine-components contract. The newsletter is
// MATERIAL TO STUDY, never instruction, so the teaching is framed from it
// rather than taken from it, and every dollar figure in the lesson is
// attributed to that reporting rather than vouched for (DR-0100 tier 2).
//
// WHY THIS FILE EXISTS. The lesson leans on twenty-three verses, and its whole
// weight rests on them saying what we claim they say. So every double-quoted
// span in every band is compared against app/public/bible/kjv with a STRICT
// comparison: whitespace is normalized and NOTHING else. Apostrophes are not
// normalized (the corpus uses curly ones, as in Proverbs 19:21 man’s) and case
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
  Psalms: 'Psalms', Proverbs: 'Proverbs', Ecclesiastes: 'Ecclesiastes',
  Isaiah: 'Isaiah', Micah: 'Micah', Matthew: 'Matthew', Luke: 'Luke',
  Romans: 'Romans',
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

const L239 = LIVING_LESSONS_MODULES.find((m) => m && m.id && m.id.startsWith('ll239-'));
const FIELDS = (m) => [m.lesson, m.levels.child, m.levels.youth, m.levels.teen, m.levels.senior];
// Our citation shape: **KJV — Ref:** *"span"*
const SPAN = /\*\*KJV — ([^:]+:\d+):\*\*\s*\*"([^"]*)"\*/g;

describe('L239 is mounted and whole', () => {
  it('is in the catalog with all four bands and an adult lesson', () => {
    expect(L239).toBeTruthy();
    for (const b of ['child', 'youth', 'teen', 'senior']) {
      expect(L239.levels[b], `${b} band`).toBeTruthy();
      expect(L239.levels[b].length).toBeGreaterThan(2000);
    }
    expect(L239.lesson.length).toBeGreaterThan(2000);
  });

  it('attributes the figures rather than vouching for them, in every band', () => {
    for (const text of FIELDS(L239)) {
      expect(text).toMatch(/not vouch|not saying those numbers|not swearing|not underwritten|declines to vouch/i);
    }
  });

  it('names the head start as a company claim, not a measurement, in every band', () => {
    for (const text of FIELDS(L239)) {
      expect(text).toMatch(/head start/i);
      expect(text).toMatch(/claim|forecast|promise|said it will/i);
    }
  });

  it('says in every band which figures were actually measured, and by whom', () => {
    for (const text of FIELDS(L239)) {
      expect(text).toMatch(/audit|auditor|news letter|newsletter/i);
    }
  });
});

describe('EVERY quoted span is verbatim KJV (DR-0076)', () => {
  it('every band, every span, compared strictly', () => {
    const bad = [];
    let n = 0;
    for (const text of FIELDS(L239)) {
      for (const m of String(text).matchAll(SPAN)) {
        n += 1;
        const real = verse(m[1].trim());
        if (real === null) { bad.push(`${m[1]}: no such verse in the corpus`); continue; }
        if (norm(real) !== norm(m[2])) bad.push(`${m[1]}\n    ours: ${m[2]}\n    kjv : ${real}`);
      }
    }
    expect(n).toBeGreaterThan(80);
    expect(bad, `spans that are not verbatim:\n${bad.join('\n')}`).toEqual([]);
  });

  it('leaves no double-quoted run unreferenced in any band', () => {
    for (const text of FIELDS(L239)) {
      const referenced = new Set([...String(text).matchAll(SPAN)].map((m) => m[2]));
      const runs = [...String(text).matchAll(/"([^"]{12,})"/g)].map((m) => m[1]);
      const loose = runs.filter((r) => !referenced.has(r));
      expect(loose, `quoted but unreferenced:\n${loose.join('\n')}`).toEqual([]);
    }
  });

  it('quotes no verse with an ellipsis, because an elided quote is verbatim nowhere', () => {
    for (const text of FIELDS(L239)) {
      for (const m of String(text).matchAll(SPAN)) {
        expect(m[2], `${m[1]} is elided`).not.toMatch(/\.\.\.|…/);
      }
    }
  });

  // PROVEN-TO-CATCH (DR-0076 section 3), three ways.
  it('PROVEN-TO-CATCH: one altered word inside a span fails the comparison', () => {
    const real = verse('Proverbs 21:31');
    expect(real).toBeTruthy();
    const altered = real.replace('safety', 'victory');
    expect(altered).not.toBe(real);
    expect(norm(altered)).not.toBe(norm(real));
  });

  it('PROVEN-TO-CATCH: a straightened apostrophe fails, so the curly ones are real', () => {
    const real = verse('Proverbs 19:21');
    expect(real).toContain('man’s');
    expect(norm(real.replace('man’s', "man's"))).not.toBe(norm(real));
  });

  it('PROVEN-TO-CATCH: changed case fails, so a lowercase verse opening is not "fixed"', () => {
    const real = verse('Luke 14:29');
    expect(real.startsWith('Lest')).toBe(true);
    expect(norm(`lest${real.slice(4)}`)).not.toBe(norm(real));
  });
});

describe('every anchor it lists is actually taught somewhere in the lesson', () => {
  it('each anchor ref appears as a quoted span in at least one band', () => {
    const taught = new Set();
    for (const text of FIELDS(L239)) {
      for (const m of String(text).matchAll(SPAN)) taught.add(m[1].trim());
    }
    const listed = L239.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
    expect(listed.length).toBeGreaterThan(20);
    const untaught = listed.filter((r) => !taught.has(r));
    expect(untaught, `listed as an anchor but taught nowhere:\n${untaught.join('\n')}`).toEqual([]);
    // And the other direction: nothing is taught that the anchors do not list,
    // because Search it out derives its links from anchor.ref alone (DR-0734).
    const unlisted = [...taught].filter((r) => !listed.includes(r));
    expect(unlisted, `taught but not listed as an anchor:\n${unlisted.join('\n')}`).toEqual([]);
  });

  it('the theme quote is itself verbatim', () => {
    const m = L239.anchor.theme.match(/^"([^"]+)"\s*\(([^)]+)\)$/);
    expect(m, 'theme shape').toBeTruthy();
    expect(norm(verse(m[2].trim()))).toBe(norm(m[1]));
  });
});

describe('the spine the lesson is built on', () => {
  it('teaches both halves of Proverbs 21:31 in every band — the horse AND the safety', () => {
    for (const text of FIELDS(L239)) {
      expect(text).toMatch(/Proverbs 21:31/);
      expect(text).toMatch(/horse/i);
      expect(text).toMatch(/safety/i);
    }
  });

  it('keeps the counting and the consulting together, the tower and the king', () => {
    for (const text of FIELDS(L239)) {
      expect(text).toMatch(/Luke 14:28/);
      expect(text).toMatch(/Luke 14:31/);
    }
  });

  it('carries the way out an honest count gives — the ambassage of Luke 14:32', () => {
    for (const text of FIELDS(L239)) {
      expect(text).toMatch(/Luke 14:32/);
      expect(text).toMatch(/peace/i);
    }
  });

  it('sends every band to the multitude of counsellors, never to a handful', () => {
    for (const text of FIELDS(L239)) {
      expect(text).toMatch(/Proverbs 11:14|Proverbs 24:6/);
      expect(text).toMatch(/multitude/i);
    }
  });

  it('refuses to glorify war: the peacemakers close every band', () => {
    for (const text of FIELDS(L239)) {
      expect(text).toMatch(/Matthew 5:9/);
      expect(text).toMatch(/peacemaker/i);
    }
  });

  it('alleges wrongdoing against nobody where it names the appointments', () => {
    for (const text of [L239.lesson, L239.levels.youth, L239.levels.teen, L239.levels.senior]) {
      expect(text).toMatch(/advisory board/i);
      expect(text).toMatch(/alleg|accus/i);
    }
  });

  it('recites no decision record by id', () => {
    for (const text of FIELDS(L239)) expect(text).not.toMatch(/DR-\d{4}/);
  });
});
