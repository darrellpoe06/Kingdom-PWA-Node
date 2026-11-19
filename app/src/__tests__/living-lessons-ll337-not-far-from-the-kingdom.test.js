// L337 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll337-not-far-from-the-kingdom.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll337-not-far-from-the-kingdom',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 337,
  added: '2026-11-19',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Psalms 146:3', 'Put not your trust in princes'],
    ['Luke 12:2', 'there is nothing covered, that shall not be revealed'],
    ['Acts 10:34', 'God is no respecter of persons'],
    ['Acts 17:26', 'hath made of one blood all nations of men'],
    ['Micah 6:8', 'to do justly, and to love mercy'],
    ['Mark 12:34', 'Thou art not far from the kingdom of God'],
    ['Acts 4:12', 'Neither is there salvation in any other'],
  ],
});
