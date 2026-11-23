// L340 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll340-wisdom-is-profitable-to-direct.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll340-wisdom-is-profitable-to-direct',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 340,
  added: '2026-11-23',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Ecclesiastes 10:10', 'wisdom is profitable to direct'],
    ['Haggai 1:5', 'Consider your ways'],
    ['Haggai 1:6', 'Ye have sown much, and bring in little'],
    ['Leviticus 19:25', 'that it may yield unto you the increase thereof'],
    ['Proverbs 31:16', 'She considereth a field, and buyeth it'],
    ['Proverbs 3:9', 'Honour the LORD with thy substance'],
  ],
});
