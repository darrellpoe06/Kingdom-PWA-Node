// =============================================================================
// quiz-attempt — one way to file a lesson quiz attempt, from any screen
// =============================================================================
// DR-1386: every attempt carries how it was taken (reading reached, time,
// questions, the paced read), and a pass credits READ only with evidence of
// reading. The classic course page filed attempts this way inside CourseView;
// the new Lesson Experience opened from the new Learn filed nothing and told
// every member "this is the owner preview of a lesson that is not public yet"
// (found 2026-11-26 when the new look went to every member, DR-1664 / DR-1669).
// Both screens now file through this one function, so the record cannot fork.
// =============================================================================
import { recordPacedAttempt } from './pace-understanding.js';
import { readingReached, attemptIntegrity } from './test-integrity.js';
import { getPlaceFor } from './learn-resume.js';

/** File one attempt through `recordQuiz(lessonId, result)`; returns the integrity it carried. */
export function fileQuizAttempt({ courseKey, lessonId, result, recordQuiz }) {
  const r = result || null;
  const paced = r ? recordPacedAttempt({ lessonId, at: r.at, pct: r.pct, passed: r.passed }) : null;
  const integrity = {
    ...attemptIntegrity({ reached: readingReached(getPlaceFor(courseKey, lessonId)), ms: r && r.ms, questions: r && r.questions }),
    ...(paced ? { eyesWpm: paced.eyesWpm, earsWpm: paced.earsWpm, firstTry: paced.firstTry } : {}),
  };
  if (typeof recordQuiz === 'function') recordQuiz(lessonId, { ...r, integrity });
  return integrity;
}
