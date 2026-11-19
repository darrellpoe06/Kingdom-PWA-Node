// L330 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll330-he-healeth-the-broken-in-heart.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll330-he-healeth-the-broken-in-heart',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 330,
  added: '2026-11-18',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Psalms 147:3', 'He healeth the broken in heart'],
    ['1 Thessalonians 5:23', 'your whole spirit and soul and body'],
    ['Psalms 86:11', 'unite my heart to fear thy name'],
    ['Genesis 50:20', 'God meant it unto good'],
    ['2 Kings 6:17', 'open his eyes, that he may see'],
    ['Isaiah 40:31', 'they that wait upon the LORD shall renew their strength'],
  ],
});
