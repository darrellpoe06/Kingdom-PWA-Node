// L325 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Below it, what is particular to this lesson:
// Bishop Gwin's four points in order, and his Trivia of the Day from Isaiah.
import { describe, it, expect } from 'vitest';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll325-god-is-able.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll325-god-is-able',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 325,
  added: '2026-11-18',
  // [reference, a span every text quotes]: the anchor and one span for each of his four points.
  spine: [
    ['2 Corinthians 9:8', 'God is able to make all grace abound toward you'],
    ['2 Kings 4:2', 'what hast thou in the house'],
    ['Genesis 50:20', 'God meant it unto good'],
    ['2 Corinthians 12:9', 'My grace is sufficient for thee'],
    ['Ephesians 3:20', 'exceeding abundantly above all that we ask or think'],
    ['Daniel 3:17', 'our God whom we serve is able to deliver us'],
  ],
});

describe('L325 — Bishop Gwin’s outline, and only his outline', () => {
  it('the adult lesson walks his four points in his order', () => {
    const at = (s) => lesson.lesson.indexOf(s);
    const points = [
      'ONE: YAHWEH IS ABLE WHEN YOU DO NOT HAVE ENOUGH',
      'TWO: YAHWEH IS ABLE WHEN LIFE IS REDIRECTED',
      'THREE: YAHWEH IS ABLE IN WEAKNESS',
      'FOUR: YAHWEH IS ABLE TO DO MORE THAN WE THINK CAN BE DONE',
    ];
    for (const p of points) expect(at(p), p).toBeGreaterThan(-1);
    expect(points.map(at)).toEqual([...points.map(at)].sort((a, b) => a - b));
  });

  it('his Trivia of the Day is one quiz item, answered from Isaiah 40:31, with no contest details', () => {
    const q = lesson.quiz.questions.find((x) => /Trivia of the Day/.test(x.q));
    expect(q.explain).toContain('(Isaiah 40:31)');
    expect(JSON.stringify(lesson)).not.toMatch(/\bprizes?\b|mail your answer|mailing address/i);
  });
});
