// L342 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll342-let-there-be-light-the-light-before-time.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll342-let-there-be-light-the-light-before-time',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 342,
  added: '2026-11-26',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Genesis 1:3', 'Let there be light: and there was light'],
    ['Genesis 1:16', 'And God made two great lights'],
    ['1 John 1:5', 'in him is no darkness at all'],
    ['John 1:4', 'the life was the light of men'],
    ['2 Corinthians 4:6', 'who commanded the light to shine out of darkness'],
    ['John 8:12', 'the light of the world'],
  ],
});
