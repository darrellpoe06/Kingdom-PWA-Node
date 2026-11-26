// L349 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll349-let-him-say-what-he-says-the-son-the-prophets-and-the-rigor.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll349-let-him-say-what-he-says-the-son-the-prophets-and-the-rigor',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 349,
  added: '2026-11-26',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Luke 19:10', 'to seek and to save that which was lost'],
    ['John 3:17', 'God sent not his Son into the world to condemn the world'],
    ['2 Timothy 2:15', 'Study to shew thyself approved unto God'],
    ['Acts 17:11', 'searched the scriptures daily, whether those things were so'],
    ['John 8:58', 'Before Abraham was, I am'],
    ['Matthew 28:19', 'in the name of the Father, and of the Son, and of the Holy Ghost'],
    ['Romans 14:12', 'every one of us shall give account of himself to God'],
    ['1 Peter 3:15', 'with meekness and fear'],
  ],
});
