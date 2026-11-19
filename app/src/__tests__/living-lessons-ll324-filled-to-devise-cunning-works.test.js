// L324 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll324-filled-to-devise-cunning-works.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll324-filled-to-devise-cunning-works',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 324,
  added: '2026-11-18',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Exodus 31:4', 'devise cunning works'],
    ['Exodus 35:34', 'he hath put in his heart that he may teach'],
    ['Nehemiah 2:6', 'I set him a time'],
    ['Luke 14:28', 'counteth the cost'],
    ['Jeremiah 29:7', 'seek the peace of the city'],
    ['2 Corinthians 8:21', 'Providing for honest things'],
  ],
});
