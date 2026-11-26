// =============================================================================
// learn-studio-bridge — what the classic Learn page hands the new look (DR-1662)
// =============================================================================
// Pure helpers kept OUT of ChurchLearn.jsx (its file budget): the reader's
// record shaped for the new look, the classic read mark for a lesson, and the
// scroll to the classic tools rendered inside the new page. Every value comes
// from the same places, progress and records the classic page reads.
// =============================================================================
import { placeInProgress, recordPlace, getPlaceFor, placeIsFinished, finishPlace, readingIsFresh } from './learn-resume.js';
import { hasReadEvidence, readingReached, READ_FLOOR } from './test-integrity.js';
import { versionRead } from './lesson-read-mark.js';
import { readMark, readMarkLabel, bandVersion } from './lesson-read-mark.js';
import { lessonVersions } from './learn-organize.js';

/** { ctx, begun, done } from the device's places and the progress map. Pure. */
export function studioRecord(places, progress) {
  const list = Array.isArray(places) ? places : [];
  const done = new Set(list.filter((pl) => pl && pl.done === true).map((pl) => pl.lessonId));
  for (const k of Object.keys(progress || {})) if (progress[k]) done.add(k);
  return { ctx: { places: list, progress: progress || {} }, begun: list.filter(placeInProgress), done };
}

/** (lesson, courseKey) -> "✓ READ ×3 · Adult" or '' — the SAME mark the classic rows carry. */
export function studioMarkFor({ places, recordFor, ageBand }) {
  return (lesson, courseKey) => {
    if (!lesson) return '';
    const place = (places || []).find((pl) => pl && pl.lessonId === lesson.id && (!courseKey || pl.courseKey === courseKey)) || null;
    const mark = readMark({
      place,
      record: recordFor ? recordFor(lesson.id) : null,
      versions: lessonVersions(lesson),
      attributed: bandVersion(lesson, ageBand),
    });
    return mark.read ? readMarkLabel(mark) : '';
  };
}

/** Bring the classic tools (rendered inside the new look) into view, after React paints. */
export function scrollToStudioTools() {
  setTimeout(() => {
    const el = typeof document !== 'undefined' && document.getElementById('ls-full-tools');
    if (el && 'open' in el) el.open = true; // the tools are condensed by default; a tool chip opens them
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' });
  }, 0);
}

/**
 * THE NEW LOOK'S LESSON SCREEN GETS THE CLASSIC SPACE'S OWN TOOLS (DR-1674). Darrell 2026-11-26:
 * "All features should still be here... we need to check of a list of features". The lesson screen
 * opened from the new look was handed only its quiz hooks, so reading and listening there never
 * credited a READ, the "Pick up where you left off" offer, the downloads and the age-first step
 * never showed. This is CourseView's savePlace for one course: the same recordPlace with the
 * version read, and the same credit at READ_FLOOR on fresh evidence (DR-1384/1386).
 */
export function studioSavePlace({ courseKey, lesson, ageBand, levelOverride = null }) {
  return (patch) => {
    const version = lesson ? versionRead(lesson, ageBand, levelOverride) : null;
    const out = recordPlace({ courseKey, ...(version ? { version } : {}), ...patch });
    const id = patch && patch.lessonId;
    const p = id ? getPlaceFor(courseKey, id) : null;
    if (p && readingReached(p) >= READ_FLOOR && !placeIsFinished(p) && hasReadEvidence(p) && readingIsFresh(p)) {
      try {
        finishPlace({ courseKey, lessonId: id, ...(version ? { version } : {}) });
      } catch {
        /* the reading stands either way */
      }
    }
    return out;
  };
}
