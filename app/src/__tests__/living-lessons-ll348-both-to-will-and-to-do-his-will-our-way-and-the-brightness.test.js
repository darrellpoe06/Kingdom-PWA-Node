// L348 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll348-both-to-will-and-to-do-his-will-our-way-and-the-brightness.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll348-both-to-will-and-to-do-his-will-our-way-and-the-brightness',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 348,
  added: '2026-11-26',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Philippians 2:13', 'both to will and to do of his good pleasure'],
    ['Ephesians 1:4', 'he hath chosen us in him before the foundation of the world'],
    ['Deuteronomy 30:19', 'choose life'],
    ['Galatians 6:7', 'whatsoever a man soweth, that shall he also reap'],
    ['Proverbs 16:9', 'the LORD directeth his steps'],
    ['James 1:17', 'Every good gift and every perfect gift is from above'],
    ['Deuteronomy 29:29', 'The secret things belong unto the LORD our God'],
    ['Proverbs 4:18', 'shineth more and more unto the perfect day'],
  ],
});
