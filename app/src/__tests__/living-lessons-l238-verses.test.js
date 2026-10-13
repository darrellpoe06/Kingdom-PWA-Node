// @vitest-environment node
// =============================================================================
// L238 — WHO HOLDS THE WIND: every span verbatim, and one case nobody teaches
// =============================================================================
// Darrell forwarded an NPR morning news digest into the app on 2026-10-08 with
// one word written on top of it: Lesson. Its lead item was a Gulf storm — a
// named tropical storm had strengthened into a hurricane overnight, officials
// along the Alabama Gulf Coast and the Florida Panhandle had declared states of
// emergency, and households in the path were boarding windows and filling
// sandbags. The digest itself said landfall was more than a day out and the
// forecast could still change, so the lesson states what is established, says
// plainly that a forecast is a forecast, and predicts nothing.
//
// THE SAME DIGEST CARRIED A SECOND, UNRELATED ITEM: a court order about
// preserving evidence in a capital case involving a named, living person. That
// is not study material for a family lesson and a child band must never carry
// it, so the lesson teaches the storm and leaves the court item untaught,
// mentioning it in exactly one neutral sentence of the adult provenance and
// naming nobody. The last block of this file is the machine check for that
// editorial decision: no field may contain the surname.
//
// WHY THE REST OF THIS FILE EXISTS. The lesson leans on fifty-four verses and
// its whole weight rests on them saying what we claim they say. So every
// double-quoted span in all five prose fields is compared against
// app/public/bible/kjv under a STRICT comparison: whitespace is normalised and
// NOTHING else. Apostrophes are not normalised (the corpus uses curly ones, as
// in Galatians 6:2 another’s) and case is not normalised, because a verse that
// continues a sentence begins lowercase and "correcting" it would be an
// alteration we made and then hid. DR-0076.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { proseWords, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { hasAllThreeEverywhere } from '../lib/talk-together.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV = join(HERE, '..', '..', 'public', 'bible', 'kjv');

const FILE = {
  Genesis: 'Genesis', Exodus: 'Exodus', Job: 'Job', Psalms: 'Psalms',
  Proverbs: 'Proverbs', Isaiah: 'Isaiah', Jeremiah: 'Jeremiah', Amos: 'Amos',
  Nahum: 'Nahum', Matthew: 'Matthew', Mark: 'Mark', Luke: 'Luke',
  Acts: 'Acts', Galatians: 'Galatians', Hebrews: 'Hebrews', James: 'James',
  '1 John': '1John', '2 Timothy': '2Timothy',
};

const cache = new Map();
function verse(ref) {
  const m = String(ref).match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!m) return null;
  const file = FILE[m[1].trim()];
  if (!file) return null;
  if (!cache.has(file)) cache.set(file, JSON.parse(readFileSync(join(KJV, `${file}.json`), 'utf8')));
  const ch = cache.get(file).chapters[Number(m[2]) - 1];
  return ch ? ch[Number(m[3]) - 1] : null;
}

// Whitespace only. Never apostrophes, never case.
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

const L238 = LIVING_LESSONS_MODULES.find((m) => m && m.id && m.id.startsWith('ll238-'));
const BANDS = ['child', 'youth', 'teen', 'senior'];
const FIELDS = (m) => [m.lesson, m.levels.child, m.levels.youth, m.levels.teen, m.levels.senior];
// Our citation shape: **KJV — Ref:** *"span"*
const SPAN = /\*\*KJV — ([^:]+:\d+):\*\*\s*\*"([^"]*)"\*/g;

// The spine every band carries, verbatim-gated below: who holds the wind, the
// warning two men heard, the foundation under both houses, the refuge, and the
// neighbour in the same weather.
const EVERY_BAND = [
  'Psalms 148:8', 'Psalms 107:25', 'Psalms 107:28', 'Psalms 107:29',
  'Mark 4:39', 'Mark 4:41', 'Exodus 9:20', 'Exodus 9:21', 'Proverbs 22:3',
  'Hebrews 11:7', 'Genesis 6:22', 'Proverbs 27:1',
  'Matthew 7:24', 'Matthew 7:25', 'Matthew 7:26', 'Matthew 7:27',
  'Psalms 46:1', 'Psalms 56:3', 'Mark 12:31',
];

describe('L238 is mounted and whole', () => {
  it('is in the catalog with its own title and all four bands', () => {
    expect(L238).toBeTruthy();
    expect(L238.title).toBe("Who Holds the Wind — The Warning, the Foundation, and the Neighbour in the Storm's Path");
    for (const b of BANDS) {
      expect(typeof L238.levels[b], `${b} band`).toBe('string');
      expect(L238.levels[b].length, `${b} band`).toBeGreaterThan(2000);
    }
    expect(L238.lesson.length).toBeGreaterThan(2000);
  });

  it('carries a quiz, benefits, facilitator notes and two stories', () => {
    expect(L238.quiz.questions.length).toBeGreaterThanOrEqual(9);
    expect(L238.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L238.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    for (const q of L238.quiz.questions) {
      expect(q.options.length).toBe(3);
      expect(q.options[q.answer]).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
    const st = (L238.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(st.length).toBeGreaterThanOrEqual(2);
    expect(new Set(st.map((s) => s.tone))).toEqual(new Set(['light', 'solemn']));
    // A parable must never read as a record of real neighbours (DR-0811).
    for (const s of st) expect(s.body).toMatch(/This is a parable and not a report/);
  });

  it('every band carries the FULL message, measured against the adult prose', () => {
    const adult = proseWords(L238.lesson);
    expect(adult).toBeGreaterThan(1000);
    for (const b of BANDS) {
      const ratio = proseWords(L238.levels[b]) / adult;
      expect(ratio, `${b} ratio ${ratio.toFixed(3)}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });

  it('the reading ladder rises and the child band clears the NEW-lesson ceiling', () => {
    const fk = {};
    for (const b of BANDS) fk[b] = fleschKincaidGrade(ourProseOnly(L238.levels[b]));
    expect(fk.child, `child ${fk.child.toFixed(2)}`).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(fk.child, `child ${fk.child.toFixed(2)} youth ${fk.youth.toFixed(2)}`).toBeLessThanOrEqual(fk.youth);
    expect(fk.youth, `youth ${fk.youth.toFixed(2)} teen ${fk.teen.toFixed(2)}`).toBeLessThanOrEqual(fk.teen);
    expect(fk.teen, `teen ${fk.teen.toFixed(2)} senior ${fk.senior.toFixed(2)}`).toBeLessThanOrEqual(fk.senior);
  });

  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L238)).toEqual([]);
  });

  it('every band and the lesson send the reader to someone: parents to children, children to parents, friend to friend', () => {
    expect(hasAllThreeEverywhere(L238)).toBe(true);
  });

  it('says plainly where it came from and refuses to vouch for the reporting', () => {
    for (const text of FIELDS(L238)) {
      expect(text).toMatch(/not vouching|do not vouch|no warranty/i);
      expect(text).toMatch(/a forecast is a forecast/i);
    }
  });

  it('predicts nothing about the storm', () => {
    for (const text of FIELDS(L238)) {
      expect(text).toMatch(/does not predict|no prediction|advances no prediction|predicts nothing|do not know what that storm did/i);
    }
  });
});

describe('EVERY quoted span is verbatim KJV (DR-0076)', () => {
  it('every field, every span, compared strictly', () => {
    const bad = [];
    let n = 0;
    for (const text of FIELDS(L238)) {
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

  it('leaves no double-quoted run unreferenced in any field', () => {
    for (const text of FIELDS(L238)) {
      const referenced = new Set([...String(text).matchAll(SPAN)].map((m) => m[2]));
      const runs = [...String(text).matchAll(/"([^"]{12,})"/g)].map((m) => m[1]);
      const loose = runs.filter((r) => !referenced.has(r));
      expect(loose, `quoted but unreferenced:\n${loose.join('\n')}`).toEqual([]);
    }
  });

  it('quotes no verse with an ellipsis, because an elided quote is verbatim nowhere', () => {
    for (const text of FIELDS(L238)) {
      for (const m of String(text).matchAll(SPAN)) {
        expect(m[2], `${m[1]} is elided`).not.toMatch(/\.\.\.|…/);
      }
    }
  });

  // PROVEN-TO-CATCH (DR-0076 section 3), three ways.
  it('PROVEN-TO-CATCH: one altered word inside a span fails the comparison', () => {
    const real = verse('Psalms 107:29');
    expect(real).toBeTruthy();
    const altered = real.replace('calm', 'quiet');
    expect(altered).not.toBe(real);
    expect(norm(altered)).not.toBe(norm(real));
  });

  it('PROVEN-TO-CATCH: a straightened apostrophe fails, so the curly ones are real', () => {
    const real = verse('Galatians 6:2');
    expect(real).toContain('another’s');
    expect(norm(real.replace('another’s', "another's"))).not.toBe(norm(real));
  });

  it('PROVEN-TO-CATCH: changed case fails, so a verse opening is never quietly "fixed"', () => {
    const real = verse('Matthew 7:24');
    expect(real.startsWith('Therefore')).toBe(true);
    expect(norm(`therefore${real.slice(9)}`)).not.toBe(norm(real));
  });
});

describe('every anchor it lists is actually taught somewhere in the lesson', () => {
  it('each anchor ref appears as a quoted span in at least one field', () => {
    const taught = new Set();
    for (const text of FIELDS(L238)) {
      for (const m of String(text).matchAll(SPAN)) taught.add(m[1].trim());
    }
    const listed = L238.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
    expect(listed.length).toBeGreaterThan(40);
    const untaught = listed.filter((r) => !taught.has(r));
    expect(untaught, `listed as an anchor but taught nowhere:\n${untaught.join('\n')}`).toEqual([]);
  });

  it('the theme quote is itself verbatim', () => {
    const m = L238.anchor.theme.match(/^"([^"]+)"\s*\(([^)]+)\)$/);
    expect(m, 'theme shape').toBeTruthy();
    expect(norm(verse(m[2].trim()))).toBe(norm(m[1]));
  });
});

describe('the spine the lesson is built on, in every band', () => {
  it('every band carries every reference of the spine', () => {
    const missing = [];
    for (const b of BANDS) for (const r of EVERY_BAND) if (!String(L238.levels[b]).includes(`**KJV — ${r}:**`)) missing.push(`${b}: ${r}`);
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('the adult lesson carries the spine too', () => {
    const missing = EVERY_BAND.filter((r) => !L238.lesson.includes(`**KJV — ${r}:**`));
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('keeps Exodus 9:20 and 9:21 together — the same warning, two different afternoons', () => {
    for (const text of FIELDS(L238)) {
      expect(text).toMatch(/\*\*KJV — Exodus 9:20:\*\*/);
      expect(text).toMatch(/\*\*KJV — Exodus 9:21:\*\*/);
      expect(text).toMatch(/[Ss]ame warning|warning was identical|warning was indistinguishable|the same words/);
    }
  });

  it('keeps all four verses of the two houses, so the weather is visibly identical', () => {
    for (const text of FIELDS(L238)) {
      for (const v of ['Matthew 7:24', 'Matthew 7:25', 'Matthew 7:26', 'Matthew 7:27']) {
        expect(text, v).toMatch(new RegExp(`\\*\\*KJV — ${v}:\\*\\*`));
      }
    }
  });

  it('says in every band that preparing is wisdom rather than weak faith', () => {
    for (const text of FIELDS(L238)) {
      expect(text).toMatch(/not a failure of faith|not a small faith|smart, not scared|deficient confidence|betrays weak faith|rather than weak faith|brave thing to do/i);
    }
  });

  it('sends every band to the neighbour in the same weather', () => {
    for (const text of FIELDS(L238)) {
      expect(text).toMatch(/\*\*KJV — Mark 12:31:\*\*/);
      expect(text).toMatch(/neighbour/i);
    }
  });

  it('recites no decision record by id', () => {
    for (const text of FIELDS(L238)) expect(text).not.toMatch(/DR-\d{4}/);
  });
});

// =============================================================================
// THE EDITORIAL DECISION, MADE MACHINE-CHECKABLE
// =============================================================================
// The forwarded digest carried a second item about a capital case involving a
// named, living person. The lesson deliberately does not teach it and names
// nobody from it, in any band. These two cases are the gate on that decision,
// and the second one proves the first can fail.
describe('the second news item is named by nobody and taught in no band', () => {
  const SURNAME = 'Pike';
  const ALL = (m) => [
    ...FIELDS(m), m.bigIdea, m.inApp, m.title, m.anchor.ref, m.anchor.theme,
    ...(m.benefits || []),
    ...((m.stories || []).flatMap((s) => [s.title, s.body])),
    ...((m.quiz.questions || []).flatMap((q) => [q.q, q.explain, ...q.options])),
    ...((m.facilitator.talkingPoints) || []),
  ].map(String);

  it('no field anywhere in the lesson carries the surname from the court item', () => {
    const hits = ALL(L238).filter((t) => new RegExp(`\\b${SURNAME}\\b`).test(t));
    expect(hits, `the surname appears in ${hits.length} field(s)`).toEqual([]);
  });

  it('no band teaches the capital case at all — the one mention is confined to the adult provenance', () => {
    for (const b of BANDS) {
      expect(L238.levels[b], `${b} band`).not.toMatch(/capital case|execution|lethal injection|death penalty|firing squad/i);
    }
    expect(L238.lesson).toMatch(/deliberately does not teach it/);
  });

  it('PROVEN-TO-CATCH: the surname check fires on a band that does name the person', () => {
    const spoiled = { ...L238, levels: { ...L238.levels, child: `${L238.levels.child} And Christa Pike was in the news too.` } };
    const hits = ALL(spoiled).filter((t) => new RegExp(`\\b${SURNAME}\\b`).test(t));
    expect(hits.length).toBe(1);
  });
});
