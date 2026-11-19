// L336 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll336-the-lie-the-fear-and-the-last-adam.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll336-the-lie-the-fear-and-the-last-adam',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 336,
  added: '2026-11-19',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Genesis 3:10', 'I was afraid'],
    ['1 John 3:4', 'sin is the transgression of the law'],
    ['Romans 5:12', 'by one man sin entered into the world'],
    ['Romans 6:23', 'the wages of sin is death'],
    ['1 Peter 2:24', 'bare our sins in his own body on the tree'],
    ['1 Corinthians 15:22', 'even so in Christ shall all be made alive'],
    ['1 John 4:18', 'perfect love casteth out fear'],
  ],
});
