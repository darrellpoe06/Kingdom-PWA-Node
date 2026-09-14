// THE EXACT LOCATION IS KEPT, AND ARRIVAL NO LONGER THROWS IT AWAY.
// =============================================================================
// Darrell 2026-09-14: "Lessons keep being interrupted and I'm loosing my exact
// location!!!!!!!!!!!!!????? Fix it!!!!!!!!!!!!"
//
// This is the THIRD pass at his place-keeping and the first two were each partly
// right and jointly useless. Reading the code rather than guessing found three
// separate reasons, and this file pins all three so none can come back:
//
//   1. ONLY THE READ-ALOUD EVER WROTE A SENTENCE, so a reader using his EYES
//      produced no position at all.
//   2. ONLY THE DEVICE VOICE WROTE IT -- the cloud/cloned-voice path tracked its
//      own sentence and was never wired to the record, so listening in the
//      sovereign voice saved nothing either.
//   3. ARRIVAL CALLED scrollTo({top: 0}), throwing the view away even when the
//      record was perfect. That is the half he would feel every single time.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickTopSentence, sentenceBoxes, scrollToSentence, throttle } from '../lib/reading-position.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

describe('pickTopSentence — the sentence at the reading line, not the top edge', () => {
  const boxes = [
    { index: 0, top: -400, bottom: -300 }, // long scrolled past
    { index: 1, top: -50, bottom: 20 },    // straddling the line
    { index: 2, top: 120, bottom: 180 },
    { index: 3, top: 200, bottom: 260 },
  ];

  it('skips sentences already read past and takes the one still live at the line', () => {
    // Index 1 still has its bottom below the line, so it is the one being read.
    expect(pickTopSentence(boxes, 0)).toBe(1);
  });

  it('moves the choice down as the reading line moves down', () => {
    // With the line at 100, index 1 is finished and 2 is the live one.
    expect(pickTopSentence(boxes, 100)).toBe(2);
  });

  it('does NOT simply return the first element, which is the naive version', () => {
    expect(pickTopSentence(boxes, 0)).not.toBe(0);
  });

  it('at the very end of a lesson it returns the LAST sentence, not -1', () => {
    // Everything above the line: the reader has scrolled to the bottom, and the
    // last sentence is the honest answer. Returning -1 here would silently stop
    // recording exactly when someone finishes a lesson.
    const allAbove = [{ index: 7, top: -300, bottom: -250 }, { index: 8, top: -200, bottom: -150 }];
    expect(pickTopSentence(allAbove, 0)).toBe(8);
  });

  it('is total on degenerate input rather than throwing', () => {
    expect(pickTopSentence([], 0)).toBe(-1);
    expect(pickTopSentence(null, 0)).toBe(-1);
    expect(pickTopSentence([{ index: 0 }], 0)).toBe(-1);
  });
});

describe('sentenceBoxes — measures what is laid out, skips what is not', () => {
  const follow = { segments: [{ start: 0, end: 5, text: 'one' }, { start: 6, end: 9, text: 'two' }] };

  it('measures each sentence', () => {
    const rf = () => ({ getBoundingClientRect: () => ({ top: 10, bottom: 30 }) });
    expect(sentenceBoxes(follow, rf, null)).toHaveLength(2);
  });

  it('drops an unlaid-out sentence (a 0/0 rect) instead of recording it as the top', () => {
    // A collapsed element measures 0/0. Treating that as top-of-page would send
    // the reader back to the wrong place.
    const rf = () => ({ getBoundingClientRect: () => ({ top: 0, bottom: 0 }) });
    expect(sentenceBoxes(follow, rf, null)).toEqual([]);
  });

  it('survives a range that throws', () => {
    const rf = () => { throw new Error('unmappable'); };
    expect(sentenceBoxes(follow, rf, null)).toEqual([]);
  });

  it('is total on junk', () => {
    expect(sentenceBoxes(null, null, null)).toEqual([]);
    expect(sentenceBoxes(follow, null, null)).toEqual([]);
  });
});

describe('scrollToSentence — puts the reader back, or reports it could not', () => {
  const follow = { segments: [{ start: 0, end: 3, text: 'a' }, { start: 4, end: 7, text: 'b' }] };
  const rf = () => ({ getBoundingClientRect: () => ({ top: 500, bottom: 520 }) });

  it('scrolls the sentence to the reading line', () => {
    const win = { scrollY: 1000, scrollTo: vi.fn() };
    const r = scrollToSentence({ follow, index: 1, rangeFor: rf, doc: null, win, topInset: 96 });
    expect(r).toBeTruthy();
    // 1000 (current) + 500 (offset from viewport top) - 96 (the line)
    expect(win.scrollTo).toHaveBeenCalledWith({ top: 1404, behavior: 'auto' });
  });

  it('never scrolls to a negative offset', () => {
    const win = { scrollY: 0, scrollTo: vi.fn() };
    const near = () => ({ getBoundingClientRect: () => ({ top: 10, bottom: 30 }) });
    scrollToSentence({ follow, index: 0, rangeFor: near, doc: null, win, topInset: 96 });
    expect(win.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('returns null WITHOUT scrolling when the sentence cannot be resolved', () => {
    // The caller must then leave the scroll alone. Jumping to the top here is
    // the original defect.
    const win = { scrollY: 100, scrollTo: vi.fn() };
    expect(scrollToSentence({ follow, index: 9, rangeFor: rf, doc: null, win })).toBeNull();
    expect(scrollToSentence({ follow, index: -1, rangeFor: rf, doc: null, win })).toBeNull();
    expect(win.scrollTo).not.toHaveBeenCalled();
  });
});

describe('throttle — the reader scrolls constantly, the record must not', () => {
  it('runs immediately, then coalesces the burst into one trailing call', () => {
    let calls = 0;
    const timers = [];
    const t = throttle(() => { calls += 1; }, 100, {
      set: (fn) => { timers.push(fn); return timers.length; },
      clear: () => {},
    });
    t(); t(); t(); t();
    expect(calls).toBe(1);          // leading edge only
    timers.shift()();               // the window elapses
    expect(calls).toBe(2);          // one trailing call for the whole burst
  });

  it('does not fire a trailing call when there was no burst', () => {
    let calls = 0;
    const timers = [];
    const t = throttle(() => { calls += 1; }, 100, {
      set: (fn) => { timers.push(fn); return timers.length; }, clear: () => {},
    });
    t();
    timers.shift()();
    expect(calls).toBe(1);
  });
});

describe('the three writers are all wired, and arrival stops discarding the place', () => {
  it('the CLOUD voice records the sentence (it never did)', () => {
    const src = read('components/TTSControl.jsx');
    const cloud = src.slice(src.indexOf('CLOUD (cloned-voice) sentence-follow'));
    const effect = cloud.slice(0, cloud.indexOf('}, [cloudProgress'));
    expect(effect).toMatch(/rememberSentence\(st\.base \+ idx, seg\.text\)/);
  });

  it('the DEVICE voice still records it', () => {
    expect(read('components/TTSControl.jsx')).toMatch(/rememberSentence\(st\.base \+ segmentIndex, seg\.text\)/);
  });

  it('a SILENT reader is watched too', () => {
    const src = read('components/ChurchLearn.jsx');
    expect(src).toMatch(/useReadingPosition\(\{/);
    expect(src).toMatch(/restoreKey: resumeNonce/);
  });

  it('the watcher flushes on interruption rather than waiting for the throttle', () => {
    const src = read('lib/use-reading-position.jsx');
    expect(src).toMatch(/visibilitychange/);
    expect(src).toMatch(/pagehide/);
    expect(src).toMatch(/onScroll\.cancel\(\);\s*write\(\);/);
  });

  it('ARRIVAL NO LONGER JUMPS TO THE TOP when a place exists', () => {
    // The single most-felt half of the bug. Pinned as source because the
    // alternative is mounting the whole Learn tree with a real scroll.
    const src = read('components/ChurchLearn.jsx');
    const i = src.indexOf('ARRIVAL NO LONGER JUMPS TO THE TOP');
    expect(i).toBeGreaterThan(-1);
    const block = src.slice(i, i + 900);
    expect(block).toMatch(/if \(hasPlace\) return undefined;/);
    // and the top-scroll is still there for a genuinely fresh open
    expect(block).toMatch(/window\.scrollTo\(\{ top: 0/);
  });

  it('the watcher refuses to stamp one lesson’s sentence onto another', () => {
    const src = read('lib/use-reading-position.jsx');
    expect(src).toMatch(/place\.lessonId !== lessonId\) return;/);
  });
});
