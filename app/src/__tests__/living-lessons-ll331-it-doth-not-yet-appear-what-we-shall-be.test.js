// L331 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll331-it-doth-not-yet-appear-what-we-shall-be.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll331-it-doth-not-yet-appear-what-we-shall-be',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 331,
  added: '2026-11-19',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['1 John 3:2', 'it doth not yet appear what we shall be'],
    ['Genesis 2:25', 'were not ashamed'],
    ['Romans 5:12', 'death by sin'],
    ['Judges 14:6', 'the Spirit of the LORD came mightily upon him'],
    ['Ezekiel 18:20', 'The son shall not bear the iniquity of the father'],
    ['Luke 22:32', 'I have prayed for thee, that thy faith fail not'],
    ['1 Corinthians 15:49', 'we shall also bear the image of the heavenly'],
  ],
});
