// =============================================================================
// How much of the lesson is left — counted in words, by two witnesses
// =============================================================================
// Darrell 2026-10-29: "what percentage of the lesson is left in each so that I
// and users can verify the full reading of each lesson", "timed perfectly with
// the words in each lesson no matter the speed", and "merged version of both
// so it can be accurate both ways".
//
// PROVEN-TO-CATCH (DR-0076 §3): a witness that can fall (scrolling back up
// lowering "seen") fails the ratchet case; rounding a nearly-read lesson to
// "0% left" fails the never-zero-early case; a pace claimed before it was
// measured, or carried across a speed change, fails the pace cases; a re-read
// that inherits the last reading's 100% fails the fresh-reading case; and a
// Continue row that paints a percentage with nothing measured fails the row
// case.
import React, { act } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import {
  countWords, wordsBefore, wordsIn, fractionOf, percentLeft, percentRead, leftLabel, seenFraction,
  mergeWitness, witnessLabel, createPaceMeter, minutesLeft, timeLeftLabel, PACE_MIN_MS,
} from '../lib/reading-progress.js';
import { recordPlace, finishPlace, getPlaceFor, placeReached } from '../lib/learn-resume.js';
import { RowContinue } from '../components/LessonContinue.jsx';
import { AgePacedLesson } from '../components/ChurchLearn.jsx';
import { lessonPlanForAge } from '../lib/learn-framework.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function memory() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

describe('words, not steps or minutes', () => {
  it('counts words the way a reader does', () => {
    expect(countWords('In the beginning God created the heaven and the earth.')).toBe(10);
    expect(countWords('  — ')).toBe(0);
    expect(countWords('')).toBe(0);
    expect(countWords("Christ’s own — words")).toBe(3);
  });
  it('words before a point, and in the whole', () => {
    const segs = ['one two three', 'four five', { text: 'six' }];
    expect(wordsBefore(segs, 0)).toBe(0);
    expect(wordsBefore(segs, 2)).toBe(5);
    expect(wordsIn(segs)).toBe(6);
    expect(fractionOf(3, 6)).toBe(0.5);
    expect(fractionOf(3, 0)).toBe(0);
  });
  it('never says 0% left before the last word, and says "all read" at it', () => {
    expect(percentLeft(0)).toBe(100);
    expect(percentLeft(0.38)).toBe(62);
    expect(percentLeft(0.999)).toBe(1);
    expect(percentLeft(1)).toBe(0);
    expect(percentRead(0.999)).toBe(99);
    expect(leftLabel(0.38)).toBe('62% left');
    expect(leftLabel(1)).toBe('all read');
  });
});

describe('seen: a paragraph counts once its last line has been on screen', () => {
  it('weights by words, not by paragraphs', () => {
    const blocks = [{ words: 10, bottom: 100 }, { words: 30, bottom: 500 }, { words: 60, bottom: 1200 }];
    expect(seenFraction(blocks, 800)).toBe(0.4);
    expect(seenFraction(blocks, 1300)).toBe(1);
    expect(seenFraction([], 800)).toBe(0);
  });
  it('paragraphs scrolled ABOVE the screen still count as seen', () => {
    expect(seenFraction([{ words: 50, bottom: -400 }, { words: 50, bottom: 2000 }], 800)).toBe(0.5);
  });
});

describe('two witnesses, one number', () => {
  it('each only rises, and the lesson is the larger of the two', () => {
    const a = mergeWitness({ seen: 0.6, heard: 0.2 }, { seen: 0.3, heard: 0.5 });
    expect(a).toEqual({ seen: 0.6, heard: 0.5, reached: 0.6 });
    expect(mergeWitness(null, { heard: 2 }).heard).toBe(1);
    expect(witnessLabel({ seen: 0.4, heard: 0.62 })).toBe('seen 40% · heard 62%');
    expect(witnessLabel({ seen: 0.4 })).toBe('seen 40%');
  });
});

describe('the reader’s pace is measured at this speed, never assumed', () => {
  it('says nothing until enough has been heard', () => {
    const m = createPaceMeter();
    expect(m.mark(0, 0, 1)).toBeNull();
    expect(m.mark(10, 3000, 1)).toBeNull();
  });
  // The reader marks every sentence, a few seconds apart; one mark a minute
  // later would be a pause, not speech (PACE_GAP_MS).
  const speak = (m, fromWords, fromMs, wpm, seconds, rate) => {
    let out = null;
    for (let t = 10; t <= seconds; t += 10) out = m.mark(fromWords + (wpm * t) / 60, fromMs + t * 1000, rate);
    return out;
  };
  it('measures words a minute from this reading', () => {
    const m = createPaceMeter();
    m.mark(0, 0, 1);
    expect(speak(m, 0, 0, 150, 60, 1)).toBeCloseTo(150, 5);
  });
  it('a new speed starts the measure again', () => {
    const m = createPaceMeter();
    m.mark(0, 0, 1);
    expect(speak(m, 0, 0, 150, 60, 1)).toBeCloseTo(150, 5);
    expect(m.mark(160, 61000, 1.5)).toBeNull();
    expect(speak(m, 160, 61000, 225, 60, 1.5)).toBeCloseTo(225, 5);
  });
  it('a pause or a jump back starts it again', () => {
    const m = createPaceMeter();
    m.mark(0, 0, 1);
    m.mark(100, 40000, 1);
    expect(m.mark(140, 40000 + 60000, 1)).toBeNull();
    const j = createPaceMeter();
    j.mark(100, 0, 1);
    expect(j.mark(50, PACE_MIN_MS + 1, 1)).toBeNull();
  });
  it('minutes left from words left and the measured pace', () => {
    expect(minutesLeft(300, 150)).toBe(2);
    expect(minutesLeft(301, 150)).toBe(3);
    expect(minutesLeft(10, 150)).toBe(1);
    expect(minutesLeft(0, 150)).toBe(0);
    expect(minutesLeft(300, null)).toBeNull();
    expect(timeLeftLabel(6, 1.5)).toBe('about 6 min left at 1.5×');
    expect(timeLeftLabel(1, 1)).toBe('under a minute left at 1.0×');
    expect(timeLeftLabel(null, 1)).toBe('');
  });
});

describe('the place keeps both witnesses, on this device only', () => {
  const C = 'living-lessons';
  const L = 'll1-the-perfect-yahweh-expects';
  it('ratchets: scrolling back up never lowers what was read', () => {
    const storage = memory();
    recordPlace({ courseKey: C, lessonId: L, seen: 0.5 }, { storage });
    recordPlace({ courseKey: C, lessonId: L, seen: 0.2 }, { storage });
    recordPlace({ courseKey: C, lessonId: L, heard: 0.7 }, { storage });
    const p = getPlaceFor(C, L, { storage });
    expect(p.seen).toBe(0.5);
    expect(p.heard).toBe(0.7);
    expect(placeReached(p)).toBe(0.7);
  });
  it('a witness write is not a move: it does not clear the step or the sentence', () => {
    const storage = memory();
    recordPlace({ courseKey: C, lessonId: L, step: 3, sentence: 9, sentenceKey: 'abc' }, { storage });
    recordPlace({ courseKey: C, lessonId: L, seen: 0.4 }, { storage });
    const p = getPlaceFor(C, L, { storage });
    expect([p.step, p.sentence, p.sentenceKey]).toEqual([3, 9, 'abc']);
  });
  it('heard to the end is every word, and a NEW reading starts its witnesses fresh', () => {
    const storage = memory();
    recordPlace({ courseKey: C, lessonId: L, seen: 0.3 }, { storage });
    finishPlace({ courseKey: C, lessonId: L, heard: 1 }, { storage });
    expect(placeReached(getPlaceFor(C, L, { storage }))).toBe(1);
    recordPlace({ courseKey: C, lessonId: L, step: 0, seen: 0.1 }, { storage });
    const again = getPlaceFor(C, L, { storage });
    expect(again.seen).toBeCloseTo(0.1, 5);
    expect(again.heard).toBe(0);
  });
  it('a place written before this shipped reads as nothing measured', () => {
    const storage = memory();
    storage.setItem('poe-learn-places', JSON.stringify({ v: 1, last: `${C}::${L}`, byLesson: { [`${C}::${L}`]: { courseKey: C, lessonId: L, step: 2, started: true } } }));
    expect(placeReached(getPlaceFor(C, L, { storage }))).toBe(0);
  });
});

describe('each lesson row says how much is left', () => {
  let root; let host;
  afterEach(() => { if (root) act(() => root.unmount()); host?.remove(); root = null; });
  const render = (el) => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(el));
    return host;
  };
  const base = { courseKey: 'living-lessons', lessonId: 'll1', stage: 1, step: 2, sentence: 0, sentenceKey: '', done: false, started: true, finishes: 0, at: Date.now() };
  it('Continue · 62% left, from the furthest witness', () => {
    const el = render(<RowContinue place={{ ...base, seen: 0.38, heard: 0.1 }} title="L1" onContinue={() => {}} />);
    const b = el.querySelector('[data-testid="row-continue"]');
    expect(b.textContent).toBe('Continue · 62% left');
    expect(b.getAttribute('aria-label')).toContain('62% left');
    expect(b.getAttribute('title')).toContain('seen 38% · heard 10%');
  });
  it('nothing measured, nothing painted', () => {
    const el = render(<RowContinue place={{ ...base, seen: 0, heard: 0 }} title="L1" onContinue={() => {}} />);
    expect(el.querySelector('[data-testid="row-continue"]').textContent).toBe('Continue');
    expect(el.querySelector('[data-testid="row-left"]')).toBeNull();
  });
});

describe('the seen meter settles: a plan rebuilt every render never loops', () => {
  // THE BUG THIS PINS (found 2026-10-29 before it shipped): the host rebuilds
  // the plan on every render, so keying the meter on the plan's identity reset
  // it each render, reported again, saved the place, re-rendered, and looped.
  // The real lesson screen hung its test for sixteen minutes. Proven to catch:
  // keying the reset on `plan` again sends the report count past the bound.
  let root; let host;
  afterEach(() => { if (root) act(() => root.unmount()); host?.remove(); root = null; });
  it('reports a bounded number of times while its host re-renders on every report', () => {
    const lesson = LIVING_LESSONS_MODULES[0];
    let reports = 0;
    function Host() {
      const [, bump] = React.useState(0);
      const plan = lessonPlanForAge(lesson, 'adult');
      // Capped at 20 so the old loop FAILS with a count instead of hanging.
      return <AgePacedLesson plan={plan} onSeen={() => { reports += 1; if (reports < 20) bump((n) => n + 1); }} />;
    }
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(<Host />));
    expect(reports).toBeGreaterThanOrEqual(1);
    expect(reports, 'the meter re-reported on every render').toBeLessThanOrEqual(3);
  });
});
