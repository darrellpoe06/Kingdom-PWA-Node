// L327 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll327-let-there-be-search-made.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll327-let-there-be-search-made',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 327,
  added: '2026-11-18',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Ezra 5:17', 'let there be search made'],
    ['Ezra 5:5', 'they could not cause them to cease, till the matter came to Darius'],
    ['Ezra 6:1', 'search was made in the house of the rolls'],
    ['Ezra 6:2', 'therein was a record thus written'],
    ['Proverbs 18:13', 'He that answereth a matter before he heareth it, it is folly and shame unto him.'],
  ],
});
