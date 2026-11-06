// @vitest-environment node
// =============================================================================
// Credit where credit is due: a lesson Darrell spoke names Darrell, never
// "the teacher" or "the man who gave this lesson" (DR-0719 applied to the
// spoken lessons; DR-1353).
// =============================================================================
// Darrell, 2026-11-06, verbatim: "We give credit where credit is due in these
// lessons. My name should be in the lessons. The people who say stuff should
// be in the lessons... Don't take names out. Leave them in and say what they
// said and research if they said it or not and put it in." And: "Name BG...
// name who it is in the lessons I send!!!!!"
//
// DR-0719 already ruled it for Bishop Gwin: never "the teacher" alone. The
// same rule was being broken for Darrell himself. MEASURED 2026-11-06 on main
// 8ebafe55d: seven lessons whose own provenance line says "Darrell spoke into
// the app" carried 150 bare "the teacher" / "the man who gave this lesson"
// mentions (ll271 8, ll272 6, ll276 43, ll277 47, ll278 1, ll279 6, ll282 68
// counting both phrasings) where his name belonged. This gate makes that
// impossible to ship again.
//
// SCOPE. A lesson is "spoken by Darrell" when its own inApp provenance says so
// ("Darrell spoke", "spoke into the app", "teaching Darrell spoke"). The gate
// reads that from the lesson, never from a hand-kept list, so the next spoken
// lesson is covered the day it lands. It does not touch lessons built from a
// forwarded source or a recording by someone else: those name THEIR speaker
// (DR-0719 for Bishop Gwin; DR-1229 names Wes Huff), and "the speaker" used
// generically ("it cost the speaker nothing", ll274) is not a bare mention of
// an unnamed teacher.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { lessonStrings, authoredProse } from '../lib/bible-study-session.js';

const SPOKEN_BY_DARRELL = /\bDarrell (?:spoke|said|gave)\b|\bspoke into (?:the|this) app\b/;
const BARE = /\b(?:[Tt]he|[Oo]ur)\s+(?:teacher|instructor)\b|\b[Tt]he man who gave this lesson\b/g;

export function isSpokenByDarrell(lesson) {
  return SPOKEN_BY_DARRELL.test(String(lesson?.inApp || ''));
}

export function bareMentionsInSpokenLesson(lesson) {
  const out = [];
  for (const [where, s] of lessonStrings(lesson)) {
    const prose = authoredProse(s);
    for (const m of prose.matchAll(BARE)) {
      out.push({ where, hit: prose.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, ' ').trim() });
    }
  }
  return out;
}

const SPOKEN = LIVING_LESSONS_MODULES.filter(isSpokenByDarrell);
const BANDS = ['child', 'youth', 'teen', 'senior'];

describe('every lesson Darrell spoke names Darrell', () => {
  it('finds the spoken lessons from their own provenance, so the scan is not vacuous', () => {
    expect(SPOKEN.length).toBeGreaterThanOrEqual(7);
    for (const id of ['ll271', 'll272', 'll276', 'll277', 'll279', 'll282']) {
      expect(SPOKEN.some((m) => m.id.startsWith(`${id}-`)), `${id} is a spoken lesson`).toBe(true);
    }
  });

  it('carries no bare "the teacher" or "the man who gave this lesson" in any string of a spoken lesson', () => {
    const faults = [];
    for (const L of SPOKEN) for (const f of bareMentionsInSpokenLesson(L)) faults.push(`${L.id} ${f.where}: ${f.hit}`);
    expect(faults).toEqual([]);
  });

  it('says his name in the lesson and in every band of every spoken lesson', () => {
    for (const L of SPOKEN) {
      expect(L.lesson, `${L.id} lesson`).toMatch(/\bDarrell\b/);
      for (const b of BANDS) expect(L.levels[b], `${L.id} ${b}`).toMatch(/\bDarrell\b/);
    }
  });

  it('PROVEN TO CATCH: the exact phrasing that shipped on main is refused', () => {
    const L = SPOKEN[0];
    const planted = { ...L, levels: { ...L.levels, child: `${L.levels.child} The man who gave this lesson said one more thing.` } };
    const hits = bareMentionsInSpokenLesson(planted);
    expect(hits.length).toBe(1);
    expect(hits[0].where).toBe('levels.child');
    const planted2 = { ...L, lesson: `${L.lesson} Then the teacher said it again.` };
    expect(bareMentionsInSpokenLesson(planted2).length).toBe(1);
  });

  it('and a mention inside a quotation is not counted, so the Word is never edited to satisfy it', () => {
    const L = SPOKEN[0];
    const planted = { ...L, lesson: `${L.lesson} "the teacher is not above his master" (Fake 1:1).` };
    expect(bareMentionsInSpokenLesson(planted).length).toBe(0);
  });

  it('a lesson whose provenance names no spoken teaching is out of scope, so a generic "the speaker" elsewhere is not a finding here', () => {
    const notSpoken = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll274-'));
    expect(notSpoken).toBeTruthy();
    expect(isSpokenByDarrell(notSpoken)).toBe(false);
  });
});
