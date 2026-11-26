// =============================================================================
// Lesson Experience tools -- the classic lesson space's OWN features, carried
// into the four-mode look (Darrell, 2026-11-25: "Restore the five missing
// features: Lesson downloads. Accurate progress credit based on actual reading
// or listening. Reading-level selection before starting a lesson. Resume
// functionality. Keep-screen-on hint.").
//
// Nothing here is re-implemented. Each tool is the classic space's component
// or record call, built where the classic space builds it (CourseView) and
// handed to the Experience:
//   downloads   -> DownloadGate + CopyButton ("Copy lesson") and
//                  LessonDownloadButton, inside the same DownloadAccessProvider,
//                  so DR-1652 / DR-1655 / DR-1656 decide exactly as they do on
//                  the classic page (closed => "Ask the administration").
//   levelFirst  -> the same LessonLevelControl ("Who is learning? Pick first,
//                  then start"), shown before the lesson starts.
//   onSeen/onHeard -> CourseView's savePlace, the path the classic reader's
//                  witnesses use; its refreshLiveRead credits the read only at
//                  READ_FLOOR with fresh evidence (DR-1384/1386). Seen is paced
//                  by pacedSeen, so a flick through credits nothing.
//   place       -> getPlaceFor, the record "Continue where you left off" reads.
//   screenHint  -> the useScreenAwake hint, same text and test id.
// =============================================================================
import React from 'react';
import { AGE_BANDS, DEFAULT_AGE_BAND, resolveForAge } from '../../lib/learn-framework.js';
import { DownloadGate } from '../DownloadAccess.jsx';
import { LessonDownloadButton } from '../LessonDownloads.jsx';
import CopyButton from '../CopyButton.jsx';
import { lessonUrl, lessonCopyBlock } from '../../lib/lesson-links.js';
import { getPlaceFor, placeIsFinished } from '../../lib/learn-resume.js';
import { pacedSeen } from '../../lib/test-integrity.js';

/**
 * Builds the tools for one lesson from CourseView's own state. LevelControl is
 * ChurchLearn's LessonLevelControl, passed in (importing it here would loop).
 */
export function experienceTools({
  module: m,
  course,
  signedIn = true,
  ageBand,
  levelOverride = null,
  learnLevel = 'auto',
  setAgeBand = null,
  setLearnLevel = null,
  LevelControl = null,
  versionCount = 0,
  savePlace,
  awake = null,
  touchDevice = false,
  quizSaved = null,
  quizSaves = false,
  onRecordQuiz = null,
}) {
  const courseKey = course.key || (course.meta && course.meta.key);
  const band = AGE_BANDS.find((b) => b.id === ageBand) || AGE_BANDS.find((b) => b.id === DEFAULT_AGE_BAND) || AGE_BANDS[0];
  const resolved = resolveForAge(m, ageBand, levelOverride);
  const url = () => lessonUrl({ courseKey, lessonId: m.id, course });
  return {
    quizSaved,
    quizSaves,
    onRecordQuiz,
    levelFirst:
      versionCount > 1 && typeof setAgeBand === 'function' && LevelControl ? (
        <div data-testid="lesson-level-first">
          <div className="le-levelfirst-k">Who is learning? Pick first, then start</div>
          <LevelControl
            band={band}
            levelId={resolved.levelId}
            levelOverride={levelOverride}
            setAgeBand={setAgeBand}
            setLearnLevel={setLearnLevel}
            branched={resolved.branched}
          />
        </div>
      ) : null,
    downloads: (
      <div className="le-downloads" data-testid="lesson-experience-downloads">
        <DownloadGate compact label="Copy lesson">
          <CopyButton
            label="Copy lesson"
            copiedLabel="Lesson copied ✓"
            title="Copy this lesson's text, with its anchor and a link back to it"
            text={() => lessonCopyBlock(m, { url: url(), level: learnLevel === 'auto' ? 'standard' : learnLevel })}
          />
        </DownloadGate>
        <CopyButton label="Copy link" copiedLabel="Link copied ✓" title="Copy a link that opens exactly this lesson" text={url} />
        <LessonDownloadButton module={m} course={course} signedIn={signedIn} />
      </div>
    ),
    screenHint:
      awake && !awake.supported && touchDevice ? (
        <p className="ts-chrome-region le-screen-hint" data-testid="screen-timeout-hint">
          {awake.hint}
        </p>
      ) : null,
    place: () => getPlaceFor(courseKey, m.id),
    onSeen: (f, version) => savePlace({ lessonId: m.id, seen: f, ...(version ? { version } : {}) }),
    onHeard: (f, version) => savePlace({ lessonId: m.id, heard: f, ...(version ? { version } : {}) }),
    onLevel: (version) => savePlace({ lessonId: m.id, version }),
  };
}

/** A saved place worth offering "Continue": started, not finished. */
export function resumable(place) {
  if (!place || placeIsFinished(place)) return null;
  const seen = Number(place.seen) || 0;
  const heard = Number(place.heard) || 0;
  if (seen <= 0.02 && heard <= 0.02) return null;
  return { seen, heard };
}

/** Seen, paced: never faster than a person can read (pacedSeen, GRACE_WPM). */
export function pacedFraction({ raw, from, words, startedAt, now = Date.now() }) {
  return pacedSeen({ raw, from, words, ms: Math.max(0, now - startedAt) });
}

export const ExperienceToolsContext = React.createContext(null);

/** Whose voice reads, in one line, when it is the listener's own (DR-1685). */
export function VoiceNote({ line }) {
  return line ? (
    <p className="le-resume-note" role="status" data-testid="le-voice-note">
      {line}
    </p>
  ) : null;
}
