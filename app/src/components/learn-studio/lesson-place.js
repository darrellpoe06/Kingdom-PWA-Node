// =============================================================================
// Lesson place -- the lesson screen keeps the SAME place as the classic page (DR-1672)
// =============================================================================
// Darrell 2026-11-26: "I just ended on chapter 6 and I can't go back to chapter
// 6 in that exact same lesson, even though while in the lesson it showed me that
// I ended at chapter 6 out of 12 chapters." The new lesson screen kept its own
// paragraph number on the device, beside the per-lesson place record every other
// Learn surface has read and written since DR-0631 (lib/learn-resume.js: one
// place per lesson, down to the sentence, matched by fingerprint so it survives
// re-pacing). Two records disagreed about the same reading.
//
// Now Read writes the sentence that opens the paragraph you are in to that same
// record, and opening Read lands on the paragraph holding the saved sentence --
// whichever view saved it. Nothing new is stored: keys and a sentence hash only,
// this device only, exactly DR-0631's bright line.
// =============================================================================
import { getPlaceFor, recordPlace, sentenceKeyOf, findSentence } from '../../lib/learn-resume.js';

/** The course this lesson's place lives under: the record's, or the lesson's own saved place. */
function courseFor(lessonId, courseKey) {
  if (courseKey) return courseKey;
  const own = getPlaceFor(null, lessonId);
  return own ? own.courseKey : '';
}

/**
 * The Read paragraph that holds the saved sentence, or -1 when there is no place,
 * the reading is finished, or the sentence is not in this rendering (never a guess).
 */
export function placeParagraph({ lessonId, courseKey, segments, segPara }) {
  if (!lessonId || !segments || !segments.length) return -1;
  const place = getPlaceFor(courseKey || null, lessonId) || (courseKey ? getPlaceFor(null, lessonId) : null);
  if (!place || place.done === true || !place.sentenceKey) return -1;
  const { index } = findSentence(segments, place);
  if (index < 0) return -1;
  const p = segPara[index];
  return Number.isFinite(p) ? p : -1;
}

/** Record the reader at sentence `sentence` (the one opening their paragraph) in the shared place. */
export function recordReadPlace({ lessonId, courseKey, segments, sentence }) {
  const course = courseFor(lessonId, courseKey);
  if (!lessonId || !course || !segments || !(sentence >= 0) || sentence >= segments.length) return;
  recordPlace({ courseKey: course, lessonId, sentence, sentenceKey: sentenceKeyOf(segments[sentence]) });
}
