// =============================================================================
// FINISHED IS A COUNT, NOT A FLAG — and the history already on the device counts
// =============================================================================
// Darrell, 2026-10-10, looking at the lesson list and the Class Record on the
// same screen, one saying "✓ FINISHED" on a lesson and the other saying
// "nothing read yet": "I've read most if not all of the lessons!!!!!!!!!!!!!!
// What are these fake records?!!!!!!!!" Then, a minute later: "Some say
// finished should be how many times I've finished it..."
//
// WHY THE TWO SURFACES DISAGREED, measured in the code (DR-0076 §4):
//
//   learn-resume.js      recordPlace() writes a place per lesson, with
//                        `done: true` when it is read to the end. The list
//                        reads that — which is why it says FINISHED.
//   use-learner-records  the Class Record has exactly TWO writers: the
//                        learner TAPPING "mark read", and answering an exam.
//                        Reading a lesson writes nothing to it at all.
//   lessons-walked.js    says so in its own header: "a lesson's opens are not
//                        recorded per lesson".
//
// So the record counted taps while the places counted reading, and the record
// then printed "nothing read yet" — a false sentence on a surface whose whole
// job is to be true.
//
// AND `done` COULD NOT COUNT ANYWAY. It is a flag that CLEARS itself the
// moment a reading moves again (recordPlace, the `moves` branch) — correct for
// resuming, useless for counting: reading a lesson a second time erased the
// evidence of the first. So a ratcheting `finishes` now sits beside it.
//
// THE LAW PINNED HERE:
//   * every finish increments the count, and nothing lowers it — re-reading,
//     starting over, or backing up;
//   * the count is per lesson, never shared;
//   * a place written BEFORE the count existed, carrying `done: true`, reads
//     as one finish, so the reading history already on the device survives.
//
// PROVEN-TO-CATCH (DR-0076 §3): each case fails against the code as it stood,
// where `done` was a bare boolean and there was no count at all.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordPlace, finishPlace, getPlaceFor, placeIsFinished, placeFinishes, finishedLabel,
} from '../lib/learn-resume.js';

/** A storage double, so nothing here depends on a browser. */
function store() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

const C = 'living-lessons';
const L = 'll1-the-perfect-yahweh-expects';
let storage;
beforeEach(() => { storage = store(); });
const place = () => getPlaceFor(C, L, { storage });
const readThrough = () => {
  recordPlace({ courseKey: C, lessonId: L, stage: 0, step: 0 }, { storage });
  finishPlace({ courseKey: C, lessonId: L }, { storage });
};

describe('every finish is counted', () => {
  it('a lesson never read has no count and no label', () => {
    expect(placeFinishes(null)).toBe(0);
    expect(placeFinishes(place())).toBe(0);
    expect(finishedLabel(place())).toBe('');
  });

  it('reading it to the end once counts once', () => {
    readThrough();
    expect(placeIsFinished(place())).toBe(true);
    expect(placeFinishes(place())).toBe(1);
    expect(finishedLabel(place())).toBe('FINISHED');
  });

  it('PROVEN-TO-CATCH: reading it three times counts THREE — the old flag said only "yes"', () => {
    readThrough(); readThrough(); readThrough();
    expect(placeFinishes(place())).toBe(3);
    expect(finishedLabel(place())).toBe('FINISHED ×3');
  });

  it('starting it over clears the flag but NEVER the count', () => {
    readThrough();
    expect(placeFinishes(place())).toBe(1);
    // Pressing read again moves the place, which clears `done` by design.
    recordPlace({ courseKey: C, lessonId: L, sentence: 2 }, { storage });
    expect(placeIsFinished(place())).toBe(false);
    expect(placeFinishes(place()), 'a re-read erased the first finish').toBe(1);
    expect(finishedLabel(place())).toBe('FINISHED');
  });

  it('a finish is counted once, however many times the end is re-recorded', () => {
    readThrough();
    finishPlace({ courseKey: C, lessonId: L }, { storage });
    finishPlace({ courseKey: C, lessonId: L }, { storage });
    expect(placeFinishes(place())).toBe(1);
  });

  it('each lesson keeps its own count — one lesson never lends another its reading', () => {
    readThrough();
    recordPlace({ courseKey: C, lessonId: 'll2-the-energy-you-were-given', stage: 0 }, { storage });
    finishPlace({ courseKey: C, lessonId: 'll2-the-energy-you-were-given' }, { storage });
    readThrough();
    expect(placeFinishes(getPlaceFor(C, L, { storage }))).toBe(2);
    expect(placeFinishes(getPlaceFor(C, 'll2-the-energy-you-were-given', { storage }))).toBe(1);
  });
});

describe('the reading already on the device is not thrown away', () => {
  it('PROVEN-TO-CATCH: a place saved BEFORE the count existed, marked done, reads as one finish', () => {
    // Exactly the shape on Darrell's phone tonight: the list says FINISHED
    // because `done` is true, and there is no `finishes` field because the
    // count did not exist when it was written. Reading that as 0 would erase
    // the history the screen is already showing him.
    const old = { courseKey: C, lessonId: L, stage: 0, step: 0, sentence: 0, sentenceKey: '', done: true, started: true, at: 1 };
    expect(placeFinishes(old)).toBe(1);
    expect(finishedLabel(old)).toBe('FINISHED');
  });

  it('and an old place NOT finished still reads as none', () => {
    const old = { courseKey: C, lessonId: L, done: false, started: true, at: 1 };
    expect(placeFinishes(old)).toBe(0);
    expect(finishedLabel(old)).toBe('');
  });

  it('a nonsense count is not trusted, and never goes negative', () => {
    expect(placeFinishes({ done: true, finishes: -4 })).toBe(1);
    expect(placeFinishes({ done: false, finishes: 'lots' })).toBe(0);
    expect(placeFinishes({ done: false, finishes: 2.7 })).toBe(2);
  });
});
