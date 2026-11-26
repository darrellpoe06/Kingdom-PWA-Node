// L346 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll346-better-than-he-that-taketh-a-city-ruling-your-spirit-when.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll346-better-than-he-that-taketh-a-city-ruling-your-spirit-when',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 346,
  added: '2026-11-26',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Proverbs 16:32', 'he that ruleth his spirit than he that taketh a city'],
    ['James 1:19', 'swift to hear, slow to speak, slow to wrath'],
    ['1 Peter 2:23', 'committed himself to him that judgeth righteously'],
    ['Proverbs 19:11', 'it is his glory to pass over a transgression'],
    ['John 16:13', 'he will guide you into all truth'],
    ['Acts 11:26', 'the disciples were called Christians first in Antioch'],
    ['Romans 12:18', 'as much as lieth in you, live peaceably with all men'],
  ],
});
