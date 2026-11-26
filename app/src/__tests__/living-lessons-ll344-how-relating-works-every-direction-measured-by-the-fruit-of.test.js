// L344 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll344-how-relating-works-every-direction-measured-by-the-fruit-of.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll344-how-relating-works-every-direction-measured-by-the-fruit-of',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 344,
  added: '2026-11-26',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Galatians 5:22', 'love, joy, peace, longsuffering, gentleness, goodness, faith'],
    ['Matthew 22:39', 'Thou shalt love thy neighbour as thyself'],
    ['Proverbs 4:23', 'Keep thy heart with all diligence'],
    ['1 John 4:19', 'We love him, because he first loved us'],
    ['1 John 4:20', 'he that loveth not his brother whom he hath seen'],
  ],
});
