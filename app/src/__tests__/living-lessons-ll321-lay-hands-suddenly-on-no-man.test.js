// L321 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll321-lay-hands-suddenly-on-no-man.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll321-lay-hands-suddenly-on-no-man',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 321,
  added: '2026-11-18',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['1 Timothy 5:22', 'Lay hands suddenly on no man'],
    ['1 Timothy 5:21', 'doing nothing by partiality'],
    ['1 Timothy 3:10', 'let these also first be proved'],
    ['1 Samuel 15:24', 'because I feared the people, and obeyed their voice'],
    ['Proverbs 18:17', 'his neighbour cometh and searcheth him'],
    ['Galatians 6:1', 'restore such an one in the spirit of meekness'],
  ],
});
