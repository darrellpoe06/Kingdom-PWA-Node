// L326 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Below it, what is particular to this lesson:
// each of Darrell's questions has its section, and blessed points to L84.
import { describe, it, expect } from 'vitest';
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll326-touch-not-mine-anointed.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll326-touch-not-mine-anointed',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 326,
  added: '2026-11-18',
  // [reference, a span every text quotes]: one span for each question the lesson answers.
  spine: [
    ['1 Samuel 16:13', 'the Spirit of the LORD came upon David from that day forward'],
    ['Acts 10:38', 'anointed Jesus of Nazareth with the Holy Ghost and with power'],
    ['Galatians 5:22', 'the fruit of the Spirit is love, joy, peace'],
    ['Acts 2:39', 'the promise is unto you, and to your children'],
    ['1 John 2:27', 'the anointing which ye have received of him abideth in you'],
    ['1 John 4:4', 'greater is he that is in you, than he that is in the world'],
    ['1 Chronicles 16:22', 'Touch not mine anointed, and do my prophets no harm.'],
  ],
});

describe('L326 — every question Darrell asked has its answer', () => {
  it('the adult lesson answers each question under its own heading', () => {
    for (const h of [
      'WHAT ANOINTED MEANS',
      'HOW IT SHOWS IN A LIFE',
      'WHO CAN AND WHO CANNOT',
      'DOES IT HAPPEN NOW',
      'HOW HE JOINS HIMSELF TO US',
      'WHAT A PROPHET IS',
      'AN ANOINTED ONE, THEN',
    ])
      expect(lesson.lesson, h).toContain(h);
  });

  it('touch not mine anointed is read in its place: the patriarchs, David and Saul, and Nathan', () => {
    for (const ref of ['(Psalms 105:15)', '(1 Samuel 26:9)', '(2 Samuel 12:7)']) expect(lesson.lesson).toContain(ref);
  });

  it('blessed is named as L84, not re-taught here (one teaching, one lesson)', () => {
    expect(lesson.inApp).toContain('Blessed and Highly Favored');
  });
});
