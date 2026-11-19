// L335 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll335-not-done-in-a-corner.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll335-not-done-in-a-corner',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 335,
  added: '2026-11-19',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Acts 26:26', 'this thing was not done in a corner'],
    ['1 Corinthians 15:3', 'Christ died for our sins according to the scriptures'],
    ['1 Corinthians 15:6', 'he was seen of above five hundred brethren at once'],
    ['John 7:5', 'For neither did his brethren believe in him.'],
    ['1 Corinthians 15:7', 'he was seen of James'],
    ['Acts 2:32', 'whereof we all are witnesses'],
    ['1 Corinthians 15:20', 'now is Christ risen from the dead'],
  ],
});
