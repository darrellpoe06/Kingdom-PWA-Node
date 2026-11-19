// L333 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll333-heavenly-cheat-codes-life-his-way.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll333-heavenly-cheat-codes-life-his-way',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 333,
  added: '2026-11-19',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Luke 8:11', 'The seed is the word of God'],
    ['Psalms 119:11', 'Thy word have I hid in mine heart'],
    ['Joshua 1:8', 'then thou shalt have good success'],
    ['1 Samuel 17:47', 'the battle is the LORD’s'],
    ['Matthew 4:4', 'It is written'],
    ['1 John 5:4', 'this is the victory that overcometh the world, even our faith'],
  ],
});
