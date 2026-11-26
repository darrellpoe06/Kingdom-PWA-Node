// =============================================================================
// learn-studio-bridge — what the classic Learn page hands the new look (DR-1662)
// =============================================================================
// Pure helpers kept OUT of ChurchLearn.jsx (its file budget): the reader's
// record shaped for the new look, the classic read mark for a lesson, and the
// scroll to the classic tools rendered inside the new page. Every value comes
// from the same places, progress and records the classic page reads.
// =============================================================================
import { placeInProgress } from './learn-resume.js';
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
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' });
  }, 0);
}
