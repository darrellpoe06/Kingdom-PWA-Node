// L345 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll345-the-mirror-your-relationship-with-everything-you-touch.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll345-the-mirror-your-relationship-with-everything-you-touch',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 345,
  added: '2026-11-26',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['James 1:23', 'beholding his natural face in a glass'],
    ['Hebrews 4:12', 'dividing asunder of soul and spirit'],
    ['Psalms 1:3', 'a tree planted by the rivers of water'],
    ['Mark 10:44', 'shall be servant of all'],
    ['John 14:6', 'I am the way, the truth, and the life'],
    ['Galatians 5:22', 'love, joy, peace'],
  ],
});
