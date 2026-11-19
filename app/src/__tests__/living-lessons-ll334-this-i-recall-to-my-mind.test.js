// L334 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll334-this-i-recall-to-my-mind.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll334-this-i-recall-to-my-mind',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 334,
  added: '2026-11-19',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Lamentations 3:21', 'This I recall to my mind, therefore have I hope.'],
    ['Isaiah 46:10', 'Declaring the end from the beginning'],
    ['Deuteronomy 30:19', 'therefore choose life'],
    ['Psalms 31:15', 'My times are in thy hand'],
    ['2 Samuel 12:23', 'I shall go to him, but he shall not return to me'],
    ['Psalms 118:22', 'The stone which the builders refused'],
    ['2 Corinthians 1:4', 'that we may be able to comfort them which are in any trouble'],
  ],
});
