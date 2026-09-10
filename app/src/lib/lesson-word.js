// =============================================================================
// lesson-word — every lesson in two renderings: without the Word by default,
// the Word on click (DR-0345)
// =============================================================================
// Darrell 2026-09-10: "build two lessons one with the Word and the other
// without it so our curriculum is capable of working for all clients" /
// "on click for the Word versions". A module's `levels` are the plain
// rendering (no Scripture, usable by any client); its Word rendering is
// `module.word` = { principle, verses: [refs], reflection? } — authored on
// the module, or, for a library course, drawn from the course's own
// Yahweh strand (lib/tlc-course-strands.js). The verse text is never typed
// here: the reader loads each reference verbatim from the corpus
// (lib/bible-kjv.js), so nothing can be misquoted (DR-0076 / DR-0340).
import { courseStrands } from './tlc-course-strands.js';
import { referencesIn } from './verse-refs.js';

// The Word rendering for a module, or null when it has none. A course's
// Illinois lesson has none by design (the state's rule carries no Scripture).
export function wordForModule(module, course = null) {
  if (!module) return null;
  if (module.word && Array.isArray(module.word.verses) && module.word.verses.length) {
    return { principle: module.word.principle || '', verses: module.word.verses.slice(), reflection: module.word.reflection || '', source: 'lesson' };
  }
  if (module.illinois) return null;
  const s = course ? courseStrands(course) : null;
  if (s && s.yahweh && s.yahweh.anchors && s.yahweh.anchors.length) {
    return { principle: s.yahweh.principle || '', verses: s.yahweh.anchors.slice(), reflection: '', source: 'course-strand' };
  }
  return null;
}

export function hasWord(module, course = null) { return !!wordForModule(module, course); }

// The plain rendering must stay plain: no Scripture reference in any level,
// so a client who chose the version without the Word never meets one. Pure;
// the gate in the tests runs it over every module.
export function plainIsPlain(module) {
  const levels = (module && module.levels) || {};
  const text = [module && module.bigIdea, ...Object.values(levels)].filter(Boolean).join(' ');
  return referencesIn(text).length === 0;
}
