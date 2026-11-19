// L338 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll338-not-with-eyeservice.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll338-not-with-eyeservice',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 338,
  added: '2026-11-19',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Colossians 3:22', 'not with eyeservice, as menpleasers'],
    ['Colossians 3:23', 'do it heartily, as to the Lord'],
    ['Proverbs 6:7', 'having no guide, overseer, or ruler'],
    ['Proverbs 15:3', 'The eyes of the LORD are in every place'],
    ['Luke 16:10', 'He that is faithful in that which is least is faithful also in much'],
    ['Matthew 7:20', 'by their fruits ye shall know them'],
    ['Matthew 25:21', 'Well done, thou good and faithful servant'],
  ],
});
