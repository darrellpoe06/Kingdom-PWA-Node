// L343 — the shared Living Lesson gate (helpers/living-lesson-gate.js, DR-1477):
// on its own number and day, the spine in every band, every quotation verbatim,
// our voice naming Yahweh, the three talk-together directions per band, real
// band shares and no reworded copy, two parables and ten questions, and no
// spoken word put in double quotes. Add below what is particular to this lesson.
import lesson, { ORDER, ADDED, UNCHECKED } from '../lib/living-lessons/ll343-unbelievers-are-not-righteous.js';
import { livingLessonGate } from './helpers/living-lesson-gate.js';

livingLessonGate({
  id: 'll343-unbelievers-are-not-righteous',
  lesson,
  ORDER,
  ADDED,
  UNCHECKED,
  order: 343,
  added: '2026-11-26',
  // [reference, a span every text quotes]: at least five the lesson cannot teach without.
  spine: [
    ['Hebrews 11:6', 'without faith it is impossible to please him'],
    ['James 2:20', 'faith without works is dead'],
    ['Revelation 4:11', 'for thy pleasure they are and were created'],
    ['Ephesians 2:10', 'For we are his workmanship'],
    ['Isaiah 55:9', 'so are my ways higher than your ways'],
    ['John 14:6', 'I am the way, the truth, and the life'],
    ['Isaiah 53:5', 'with his stripes we are healed'],
  ],
});
