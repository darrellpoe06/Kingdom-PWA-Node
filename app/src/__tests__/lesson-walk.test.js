// =============================================================================
// Moving by PARAGRAPH, not only by section — the speaker's fine adjustment
// =============================================================================
// Darrell 2026-09-13: "we need the forward or backwards player to move back and
// fourth to last paragraph or sometimes a whole section... currently I believe
// we just get section jumps... fix these."
//
// He was right about the cause, and it was structural rather than a bug: the
// only stepper in the reader steps AGE-PACED segments, and for the adult band
// there is exactly one segment — so the whole lesson renders at once and the
// only arrows are the ARC STAGE arrows. Those are the section jumps.
//
// These pin the behaviour a person behind a pulpit actually needs.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { stepParagraph, stepPoint, pointAt, pointIndices, walkState } from '../lib/lesson-walk.js';
import { formatLessonText, lessonPoints, lessonPointCount } from '../lib/lesson-format.js';

// 0 line · 1 POINT · 2 line · 3 line · 4 POINT · 5 line · 6 POINT
const items = [
  { kind: 'line', text: 'opening prose' },
  { kind: 'heading', n: 1, text: 'FIRST, the trouble lab: go to Him first.' },
  { kind: 'line', text: 'a' }, { kind: 'line', text: 'b' },
  { kind: 'heading', n: 2, text: 'SECOND, the promise lab: act on one promise.' },
  { kind: 'line', text: 'c' },
  { kind: 'heading', n: 3, text: 'THIRD, the invited test: prove me now.' },
];

describe('one paragraph at a time', () => {
  it('goes forward and back a single paragraph', () => {
    expect(stepParagraph(items, 2, 1)).toBe(3);
    expect(stepParagraph(items, 3, -1)).toBe(2);
  });

  it('STAYS at the ends rather than wrapping — a speaker is never thrown across the lesson', () => {
    expect(stepParagraph(items, 0, -1)).toBe(0);
    expect(stepParagraph(items, items.length - 1, 1)).toBe(items.length - 1);
  });

  it('survives an out-of-range index instead of crashing mid-sermon', () => {
    expect(stepParagraph(items, 999, 1)).toBe(items.length - 1);
    expect(stepParagraph(items, -5, -1)).toBe(0);
  });
});

describe('or a whole point, which is the coarse move he also asked for', () => {
  it('forward lands on the next numbered point', () => {
    expect(stepPoint(items, 0, 1)).toBe(1);
    expect(stepPoint(items, 2, 1)).toBe(4);
    expect(stepPoint(items, 4, 1)).toBe(6);
  });

  it('BACK from inside a point returns to the head of the point you are in', () => {
    // Mid-point: "start this one over" — the music-player behaviour.
    // Index 5 is inside point 2 (head at 4) and there IS a point before it (1),
    // so this case DISTINGUISHES the right behaviour from the naive one. An
    // earlier version of this test used index 3, where both behaviours return
    // the same answer — it passed against a deliberately broken walker and
    // therefore proved nothing. Caught by running the break, not by re-reading.
    expect(stepPoint(items, 5, -1)).toBe(4);
    expect(stepPoint(items, 3, -1)).toBe(1);
  });

  it('back AGAIN, from the head, goes to the point before', () => {
    expect(stepPoint(items, 1, -1)).toBe(1); // only point 1 exists before it
    expect(stepPoint(items, 4, -1)).toBe(1);
    expect(stepPoint(items, 6, -1)).toBe(4);
  });

  it('does not run off either end', () => {
    expect(stepPoint(items, 6, 1)).toBe(6);
    expect(stepPoint(items, 0, -1)).toBe(1);
  });

  it('a lesson with no points still answers without throwing', () => {
    const flat = [{ kind: 'line', text: 'x' }, { kind: 'line', text: 'y' }];
    expect(stepPoint(flat, 0, 1)).toBe(0);
    expect(pointIndices(flat)).toEqual([]);
  });
});

describe('"you are on point 3 of 7" — what the speaker reads at a glance', () => {
  it('reports the containing point and the position in the list', () => {
    expect(pointAt(items, 3)).toMatchObject({ n: 1, ordinal: 1, total: 3 });
    expect(pointAt(items, 5)).toMatchObject({ n: 2, ordinal: 2, total: 3 });
  });

  it('returns null BEFORE the first point rather than a wrong badge', () => {
    expect(pointAt(items, 0)).toBeNull();
  });
});

describe('the controls say what they will do', () => {
  it('back is dead at the top and forward is dead at the bottom', () => {
    expect(walkState(items, 0).canBack).toBe(false);
    expect(walkState(items, 0).canForward).toBe(true);
    expect(walkState(items, items.length - 1).canForward).toBe(false);
  });

  it('reports whether this lesson has points at all', () => {
    expect(walkState(items, 0).hasPoints).toBe(true);
    expect(walkState([{ kind: 'line', text: 'x' }], 0).hasPoints).toBe(false);
  });
});

describe('the walker and the index cannot disagree', () => {
  const text = 'FIRST, the trouble lab: go to Him first. That is the trial David ran. '
    + 'SECOND, the promise lab: act on one promise. Build the choice on it. '
    + 'THIRD, the invited test: prove me now herewith.';

  it('every point the index lists is a heading the walker can reach', () => {
    const { items: real } = formatLessonText(text);
    const listed = lessonPoints(text).map((p) => p.itemIndex);
    expect(listed).toEqual(pointIndices(real));
  });

  it('the count the speaker is shown is the number of stops there are', () => {
    const { items: real } = formatLessonText(text);
    expect(lessonPointCount(text)).toBe(pointIndices(real).length);
  });

  it('a label carries the POINT, never just the marker word', () => {
    const labels = lessonPoints(text).map((p) => p.label);
    expect(labels).toEqual(['the trouble lab', 'the promise lab', 'the invited test']);
    for (const l of labels) expect(l).not.toMatch(/^(FIRST|SECOND|THIRD)$/);
  });
});
