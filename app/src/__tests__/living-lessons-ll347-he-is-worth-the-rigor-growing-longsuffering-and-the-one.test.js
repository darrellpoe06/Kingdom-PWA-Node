// L347 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll347-he-is-worth-the-rigor-growing-longsuffering-and-the-one.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll347-he-is-worth-the-rigor-growing-longsuffering-and-the-one',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 347,
  added: '2026-11-26',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Hebrews 5:14', 'by reason of use have their senses exercised'],
    ['Psalms 34:8', 'O taste and see that the LORD is good'],
    ['Numbers 23:19', 'God is not a man, that he should lie'],
    ['John 7:17', 'If any man will do his will, he shall know of the doctrine'],
    ['1 Corinthians 13:4', 'Charity suffereth long, and is kind'],
    ['Luke 13:8', 'this year also, till I shall dig about it, and dung it'],
    ['Proverbs 24:16', 'For a just man falleth seven times, and riseth up again'],
    ['Joshua 24:15', 'as for me and my house, we will serve the LORD'],
  ],
});
