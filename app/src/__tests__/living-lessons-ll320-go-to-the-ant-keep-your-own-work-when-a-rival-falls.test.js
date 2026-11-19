// L320 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll320-go-to-the-ant-keep-your-own-work-when-a-rival-falls.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll320-go-to-the-ant-keep-your-own-work-when-a-rival-falls',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 320,
  added: '2026-11-18',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Proverbs 6:6', 'Go to the ant, thou sluggard; consider her ways, and be wise'],
    ['Proverbs 6:7', 'Which having no guide, overseer, or ruler'],
    ['Proverbs 24:17', 'Rejoice not when thine enemy falleth'],
    ['Galatians 6:4', 'let every man prove his own work'],
    ['Proverbs 14:15', 'The simple believeth every word'],
    ['Proverbs 27:23', 'Be thou diligent to know the state of thy flocks'],
  ],
});
