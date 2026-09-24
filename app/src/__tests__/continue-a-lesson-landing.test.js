// =============================================================================
// Continue lands ON the words — the sentence is the place for the eye too
// (lib/lesson-landing.js, DR-0623)
// =============================================================================
// Measured before: a Continue brought the reader to the right step and left
// the view at scrollY 0 — the course header on screen, the words a long scroll
// below — and a reader using their eyes recorded no sentence at all. These
// pins hold the two halves: which sentence is at the reading line (what gets
// recorded), and where a Continue lands (the recorded sentence, else the step,
// never a guess). jsdom has no layout, so boxes are injected; the pixels are
// measured by the real-browser journeys in the DR.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  sentenceIndexAtLine, currentSentence, locateSentence, landOnPlace, landingScrollDelta, LANDING_MARGIN,
} from '../lib/lesson-landing.js';
import { sentenceKeyOf } from '../lib/learn-resume.js';
import { buildFollowMap } from '../lib/read-follow.js';

const PROSE = [
  'Yahweh asks for a whole heart.',
  'The word perfect in Genesis 17:1 means complete.',
  'It is grown in you by grace.',
  'Nobody produces it by performance.',
];

let root;
beforeEach(() => {
  root = document.createElement('div');
  root.innerHTML = `<h3>Teach</h3><p>${PROSE.join(' ')}</p>`;
  document.body.appendChild(root);
});
afterEach(() => { root.remove(); });

// Sentence i occupies 100px starting at y = 100 * i (the heading is index 0).
const boxesByIndex = (i) => ({ top: 100 * i, bottom: 100 * i + 90, height: 90 });

describe('which sentence the eye is on', () => {
  it('is the first sentence whose box reaches below the reading line', () => {
    const follow = { segments: [{}, {}, {}, {}] };
    expect(sentenceIndexAtLine(follow, 150, boxesByIndex)).toBe(1);
    expect(sentenceIndexAtLine(follow, 0, boxesByIndex)).toBe(0);
    // Past the last sentence: the last one is the reader's place, not nothing.
    expect(sentenceIndexAtLine(follow, 10_000, boxesByIndex)).toBe(3);
    expect(sentenceIndexAtLine({ segments: [] }, 10, boxesByIndex)).toBe(-1);
  });

  it('across a gap of controls, the NEAREST sentence wins — measured, not assumed', () => {
    // The first after-run in real Chromium: the reading line (229px) fell on
    // the Back/Next row; the sentence above ended at 205px and the next
    // readable one (a story heading) began at 378px. "First below the line"
    // chose the heading and the reader came back ~130px lower than they left.
    const follow = { segments: [{}, {}] };
    const measured = (i) => (i === 0 ? { top: 181, bottom: 205, height: 24 } : { top: 378, bottom: 398, height: 20 });
    expect(sentenceIndexAtLine(follow, 229, measured)).toBe(0);
    // ...and when the next sentence is the closer one, it is chosen.
    const nearBelow = (i) => (i === 0 ? { top: 20, bottom: 60, height: 40 } : { top: 240, bottom: 260, height: 20 });
    expect(sentenceIndexAtLine(follow, 229, nearBelow)).toBe(1);
  });

  it('skips sentences with no box (not rendered) rather than choosing them', () => {
    const follow = { segments: [{}, {}, {}] };
    const boxOf = (i) => (i === 1 ? { top: 0, bottom: 0, height: 0 } : boxesByIndex(i));
    expect(sentenceIndexAtLine(follow, 150, boxOf)).toBe(2);
  });

  it('currentSentence returns the sentence and the SAME fingerprint the reader stores', () => {
    const follow = buildFollowMap(root);
    // Put the reading line inside the second prose sentence.
    const target = follow.segments.findIndex((s) => s && s.text.startsWith('The word perfect'));
    let n = 0;
    const rectOf = () => { const i = n; n += 1; return boxesByIndex(i); };
    const cur = currentSentence(root, { line: 100 * target + 50, rectOf });
    expect(cur.text).toBe('The word perfect in Genesis 17:1 means complete.');
    expect(cur.key).toBe(sentenceKeyOf('The word perfect in Genesis 17:1 means complete.'));
  });
});

describe('where a Continue finds the sentence', () => {
  it('by fingerprint, even when the index moved (a re-paced or partial rendering)', () => {
    const key = sentenceKeyOf('It is grown in you by grace.');
    const hit = locateSentence(root, { sentence: 40, sentenceKey: key });
    expect(hit.how).toBe('moved');
    expect(hit.range.toString()).toBe('It is grown in you by grace.');
  });

  it('never follows a bare index — the same number is a different sentence elsewhere', () => {
    const hit = locateSentence(root, { sentence: 2, sentenceKey: '' });
    expect(hit.range).toBeNull();
    expect(hit.how).toBe('no-sentence');
  });

  it('a sentence that is gone says so', () => {
    const hit = locateSentence(root, { sentence: 2, sentenceKey: sentenceKeyOf('A sentence this lesson no longer has.') });
    expect(hit.range).toBeNull();
    expect(hit.how).toBe('gone');
  });
});

describe('the landing', () => {
  it('scrolls the sentence to just under the chrome and reports "sentence"', () => {
    const scrollBy = vi.fn();
    const win = { scrollBy, innerHeight: 844, innerWidth: 390 };
    const key = sentenceKeyOf('It is grown in you by grace.');
    const res = landOnPlace(root, { stage: 1, step: 2, sentenceKey: key }, { win, rectOf: () => ({ top: 900, bottom: 930 }), mark: false });
    expect(res.how).toBe('sentence');
    expect(scrollBy).toHaveBeenCalledWith(0, landingScrollDelta(900, 0));
    expect(landingScrollDelta(900, 0)).toBe(900 - LANDING_MARGIN);
  });

  it('with the sentence gone, lands on the saved step and says why', () => {
    const scrollBy = vi.fn();
    const win = { scrollBy, innerHeight: 844, innerWidth: 390 };
    const stepEl = { getBoundingClientRect: () => ({ top: 1200 }) };
    const res = landOnPlace(root, { stage: 1, step: 2, sentenceKey: sentenceKeyOf('Gone.') }, { win, stepEl, mark: false });
    expect(res).toEqual({ how: 'step', why: 'gone' });
    expect(scrollBy).toHaveBeenCalledWith(0, 1200 - LANDING_MARGIN);
  });

  it('a lesson never moved in lands nowhere (the caller keeps the top)', () => {
    const win = { scrollBy: vi.fn(), innerHeight: 844, innerWidth: 390 };
    const res = landOnPlace(root, { stage: 0, step: 0, sentenceKey: '' }, { win, stepEl: { getBoundingClientRect: () => ({ top: 5 }) }, mark: false });
    expect(res.how).toBe('none');
    expect(win.scrollBy).not.toHaveBeenCalled();
  });

  it('the delta puts a box under the chrome: above it scrolls up, below it scrolls down', () => {
    expect(landingScrollDelta(10, 120)).toBe(10 - 120 - LANDING_MARGIN);
    expect(landingScrollDelta(1000, 120)).toBe(1000 - 120 - LANDING_MARGIN);
  });
});
