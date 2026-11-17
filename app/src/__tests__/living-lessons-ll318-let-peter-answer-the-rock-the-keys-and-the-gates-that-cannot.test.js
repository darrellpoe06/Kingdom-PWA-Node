// L318 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll318-let-peter-answer-the-rock-the-keys-and-the-gates-that-cannot.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll318-let-peter-answer-the-rock-the-keys-and-the-gates-that-cannot',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 318,
  added: '2026-11-17',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  // These six ARE the argument. Take any one away and the lesson stops standing:
  // the sentence under dispute (16:18); the confession it answers (16:16); where
  // that confession came from, which decides the whole thing before it starts
  // (16:17); and then Peter answering the question about Peter three times over —
  // preaching the stone (Acts 4:11), writing the corner stone (1 Peter 2:6), and
  // calling himself a fellow elder rather than a foundation (1 Peter 5:1).
  spine: [
    ['Matthew 16:18', 'upon this rock I will build my church'],
    ['Matthew 16:16', 'Thou art the Christ, the Son of the living God'],
    ['Matthew 16:17', 'flesh and blood hath not revealed it unto thee'],
    ['Acts 4:11', 'This is the stone which was set at nought of you builders'],
    ['1 Peter 2:6', 'a chief corner stone, elect, precious'],
    ['Revelation 1:18', 'I am he that liveth, and was dead'],
  ],
});
