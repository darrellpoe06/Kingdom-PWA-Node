// =============================================================================
// Eternal Algorithms — a pattern that carries an authored lesson is a FULL lesson
// =============================================================================
// Darrell 2026-11-26: "We should have no short one minute lessons" and "Make sure
// they are a full lessons... not too short", and on the child level: "I'm not
// sure the child level needs to be longer than whatever the neuroscience maps to
// our age groups". Every pattern in eternal-algorithms-teaching.js is read
// through the same checks a new Living Lesson passes (helpers/living-lesson-gate.js):
// every quotation verbatim from the corpus, our voice naming Yahweh, no bare
// quotes, the three talk-together directions in the lesson and every band, a
// reading ladder; plus the lengths: the adult reading a full lesson, the child
// version inside the child window (about three to ten minutes for ages 6-10),
// the other bands real shares of the adult teaching.
import { describe, it, expect } from 'vitest';
import TEACHING, { PARTS, mergeParts } from '../lib/eternal-algorithms-teaching.js';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';
import {
  stringsOf,
  verbatimFaults,
  referencedCount,
  voiceFaults,
  yahwehInQuoteFaults,
  adversaryFaults,
  bareQuoteFaults,
  directionFaults,
  ladderFaults,
} from './helpers/living-lesson-gate.js';
import { measureFullness, words } from '../../../scripts/full-levels.mjs';

const ADULT_MIN_WORDS = 1500; // the house reader length for a full lesson (new-lessons-keep-a-reader-length)
const CHILD_MIN_WORDS = 300; // about three minutes at a grade 2-3 pace (Hasbrouck & Tindal 2017)
const CHILD_MAX_WORDS = 1100; // about ten minutes: one sitting before the child band's break
const SHARE_FLOOR = 0.6; // youth, teen, senior (DR-0418)

const MODULES = buildEternalProcessingCourses().flatMap((c) => c.schedule || []);
const ids = Object.keys(TEACHING);

describe('Eternal Algorithms authored lessons are split into parts without loss', () => {
  it('every part is merged, and no pattern sits in two parts', () => {
    const total = PARTS.reduce((n, part) => n + Object.keys(part).length, 0);
    expect(Object.keys(TEACHING).length).toBe(total);
  });
  it('the merge refuses a pattern id written into two parts (proven to catch)', () => {
    const entry = { lesson: 'x', levels: {} };
    expect(() => mergeParts([{ 'gh-a': entry }, { 'gh-a': entry }])).toThrow(/more than one part/);
    expect(Object.keys(mergeParts([{ 'gh-a': entry }, { 'gh-b': entry }]))).toEqual(['gh-a', 'gh-b']);
  });
});

describe('Eternal Algorithms authored lessons', () => {
  it('there is at least one, and every one belongs to a real pattern the course renders', () => {
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids)
      expect(
        MODULES.some((m) => m.id === `ea-${id}`),
        id
      ).toBe(true);
  });

  for (const id of ids) {
    describe(id, () => {
      const L = MODULES.find((m) => m.id === `ea-${id}`);
      const own = TEACHING[id];

      it('the course renders the authored lesson and every authored band', () => {
        // The Word reads first (every anchor verse, whole), then the authored teaching.
        expect(L.lesson.startsWith('The Word, read first:')).toBe(true);
        expect(L.lesson.endsWith(own.lesson)).toBe(true);
        expect(L.levels.standard).toBe(L.lesson);
        for (const b of ['child', 'youth', 'teen', 'senior']) {
          expect(L.levels[b].startsWith('The Word, read first:'), b).toBe(true);
          expect(L.levels[b].endsWith(own.levels[b]), b).toBe(true);
        }
      });

      it('every quotation is the corpus verbatim, and there are enough to read as the Word first', () => {
        expect(verbatimFaults(stringsOf(own))).toEqual([]);
        expect(referencedCount(stringsOf(own))).toBeGreaterThanOrEqual(20);
      });

      it('our voice names Yahweh, the adversary is never capitalised, and no bare quotes', () => {
        const shaped = { lesson: own.lesson, levels: own.levels };
        expect(voiceFaults(shaped)).toEqual([]);
        expect(yahwehInQuoteFaults(shaped)).toEqual([]);
        expect(adversaryFaults(shaped)).toEqual([]);
        expect(bareQuoteFaults(shaped)).toEqual([]);
      });

      it('the lesson and every band send the reader all three ways', () => {
        expect(directionFaults({ lesson: own.lesson, levels: own.levels })).toEqual([]);
      });

      it('the bands read as a ladder, child inside its reading ceiling', () => {
        expect(ladderFaults({ id, lesson: own.lesson, levels: own.levels })).toEqual([]);
      });

      it('a full lesson: the adult reading, the child window, the other bands real shares', () => {
        expect(words(own.lesson), 'adult words').toBeGreaterThanOrEqual(ADULT_MIN_WORDS);
        const child = words(L.levels.child); // what the child actually reads or hears, the Word included
        expect(child, 'child words').toBeGreaterThanOrEqual(CHILD_MIN_WORDS);
        expect(child, 'child words').toBeLessThanOrEqual(CHILD_MAX_WORDS);
        const m = measureFullness({ id, lesson: own.lesson, levels: own.levels });
        for (const b of ['youth', 'teen', 'senior']) expect(m.bands[b].share, b).toBeGreaterThanOrEqual(SHARE_FLOOR);
      });

      it('PROVEN-TO-CATCH: a one-minute lesson fails the length check', () => {
        const stub = { id, lesson: own.lesson.split(/\s+/).slice(0, 200).join(' '), levels: own.levels };
        expect(words(stub.lesson)).toBeLessThan(ADULT_MIN_WORDS);
      });
    });
  }
});
