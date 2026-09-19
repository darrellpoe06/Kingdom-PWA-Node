// @vitest-environment node
// =============================================================================
// "Same lesson on all levels?!!!!! Won't change?"
// =============================================================================
// Darrell, 2026-09-19, with two screenshots of the SAME Development lesson --
// one with TEEN selected, one with ADULT -- showing byte-identical text. He was
// right, and the row that was supposed to explain it could never speak.
//
// WHAT WAS ACTUALLY WRONG. LessonLevelControl already carried the sentence
// "This lesson has no <band> version yet". It was gated on:
//
//     const fellBack = !overridden && levelId && levelId !== band.depth;
//
// For a lesson carrying NO authored bands, resolveForAge falls through to the
// plain `lesson` and returns `levelId: chain[0]` -- and chain[0] IS the band's
// own depth. So `levelId !== band.depth` was false for EVERY band on EVERY
// bandless lesson, and the row stayed silent while the words never changed.
//
// The flag that actually knows is `branched`, which resolveForAge has returned
// all along, which lessonPlanForAge passes straight through, and which the
// component simply never destructured. The data was present at every layer and
// ignored at the last one.
//
// WHAT IT COSTS, MEASURED 2026-09-19 across the live catalog: of 317 course
// lessons (Living Lessons excluded -- its own ratchets own those), ZERO carry
// all four bands and 37 carry none at all. So this row was implying a live
// choice on hundreds of lessons that have exactly one version.
import { describe, it, expect } from 'vitest';
import { resolveForAge, lessonPlanForAge, AGE_BANDS } from '../lib/learn-framework.js';

const BANDLESS = { id: 'x', title: 'T', lesson: 'A single version, written once, for everybody who opens it.' };
const BANDED = {
  id: 'y',
  title: 'T',
  lesson: 'The adult version.',
  levels: { child: 'The child version.', teen: 'The teen version.', senior: 'The senior version.' },
};

// THE SECOND SCREENSHOT, THE SAME DAY (2026-09-19). With the row finally
// speaking, Darrell opened L186 (Glory to Glory -- four authored bands plus its
// adult prose) and was told "The Adult version has not been written yet", over
// the very words it was showing him: "Choosing to change the length?!!!!!!!!!!!
// Not the lessons to fit the level?!!!!!!!!!!!!!"
//
// He was right again. The adult band's depth key is 'standard'; almost no module
// carries `levels.standard`; so EVERY adult reader -- the DEFAULT band and the
// widest audience -- fell through to the plain `lesson` and was flagged
// branched:false. On a lesson with real bands that is simply false: `lesson` IS
// the adult version, authored for them, sitting beside the other four.
//
// The two complaints are the same wire and the fix has to thread both. A lesson
// carrying NO bands still reports false for every band (one version, written
// once, and the row says so). A lesson carrying bands reports TRUE for adult,
// because the adult is being served their own text. The test below pins the
// screenshot so neither half can regress into the other.
describe('a banded lesson does not call its adult prose nobody\u2019s (the second screenshot)', () => {
  const GLORY = {
    id: 'll186-glory-to-glory-one-letter-holds-both-sides',
    title: 'Glory to Glory: One Letter Holds Both Sides',
    lesson: 'The adult version, authored for the adult reader.',
    levels: {
      child: 'The child version.', youth: 'The youth version.',
      teen: 'The teen version.', senior: 'The senior version.',
    },
  };

  it('the ADULT band is served its own authored text, and knows it', () => {
    const r = resolveForAge(GLORY, 'adult');
    expect(r.text).toBe(GLORY.lesson);
    expect(r.branched, 'the adult was told their version was never written').toBe(true);
  });

  it('every band on a fully banded lesson reports branched:true', () => {
    for (const b of AGE_BANDS) {
      expect(resolveForAge(GLORY, b.id).branched, `${b.id} reads as a fallback`).toBe(true);
    }
  });

  it('PROVEN-TO-CATCH: strip the bands and the adult honestly reports false again', () => {
    // The guard against over-correcting. Remove the authored levels and the
    // lesson really does have one version for everybody -- the morning's case.
    const stripped = { id: GLORY.id, title: GLORY.title, lesson: GLORY.lesson };
    expect(resolveForAge(stripped, 'adult').branched).toBe(false);
  });
});

describe('the resolver tells the truth, and the flag is the thing that knows', () => {
  it('a bandless lesson reports branched:false for EVERY band', () => {
    for (const b of AGE_BANDS) {
      const r = resolveForAge(BANDLESS, b.id);
      expect(r.branched, `${b.id} claims its own version on a bandless lesson`).toBe(false);
      expect(r.text).toBe(BANDLESS.lesson);
    }
  });

  it('PROVEN-TO-CATCH: levelId alone CANNOT tell -- it matches the band depth anyway', () => {
    // This is the exact reason the old gate was silent, pinned so nobody
    // reintroduces the levelId-only test believing it is equivalent.
    for (const b of AGE_BANDS) {
      const r = resolveForAge(BANDLESS, b.id);
      const oldGateWouldFire = Boolean(r.levelId && r.levelId !== b.depth);
      expect(oldGateWouldFire, `${b.id}: the old levelId test would have caught this`).toBe(false);
      // while the honest flag does know
      expect(r.branched).toBe(false);
    }
  });

  it('a banded lesson really does hand different words to different bands', () => {
    const child = resolveForAge(BANDED, 'child');
    const teen = resolveForAge(BANDED, 'teen');
    expect(child.branched).toBe(true);
    expect(teen.branched).toBe(true);
    expect(child.text).not.toBe(teen.text);
  });

  it('the plan carries the flag through to whatever renders it', () => {
    // If lessonPlanForAge ever stopped passing it, the row would go silent
    // again in exactly the way it just did.
    for (const b of AGE_BANDS) {
      expect(lessonPlanForAge(BANDLESS, b.id).branched).toBe(false);
    }
    expect(lessonPlanForAge(BANDED, 'child').branched).toBe(true);
  });
});

describe('and the surface is wired to it', () => {
  const SRC = new URL('../components/ChurchLearn.jsx', import.meta.url);
  const src = () => require('node:fs').readFileSync(SRC, 'utf8');

  it('the control accepts branched and both call sites pass it', () => {
    const s = src();
    expect(s).toMatch(/setLearnLevel = null, branched = true,/);
    expect(s.match(/<LessonLevelControl[^>]*branched=\{/g) || [], 'a call site is not passing branched').toHaveLength(2);
  });

  it('the notice is gated on branched, not on levelId alone', () => {
    expect(src()).toContain('const fellBack = !overridden && (!branched || (levelId && levelId !== band.depth));');
  });

  it('and it says the honest thing when NO band was ever authored', () => {
    // Not "no teen version" -- which implies other bands have one. The truth is
    // that the lesson has a single version and switching changes the pace.
    const s = src();
    expect(s).toContain('const noneAuthored = !overridden && !branched;');
    expect(s).toMatch(/one version for every age so far/);
    expect(s).toMatch(/changes the pace, not the words/);
  });
});
