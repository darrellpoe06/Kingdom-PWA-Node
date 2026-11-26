// =============================================================================
// lesson-progress — how far each lesson has been read or heard, for its card
// =============================================================================
// Darrell 2026-11-26, on the new-look Learn grid: "Possibly a indicator bar
// that shows how far a lesson has been listened to or read so we can pick the
// ones we are closest to finishing etc... make sense?" Then: "For all lessons
// not just these." DR-1684.
//
// THE NUMBER IS NOT NEW. It is the lesson's own saved place on this device
// (lib/learn-resume.js), and the fraction is the one DR-1293 already measures
// there: `seen` (the furthest share of the version's WORDS that has been on
// screen) and `heard` (the furthest share the reader has spoken), merged as
// placeReached(). Words, not steps or sentence indexes, so a lesson re-paced
// for another age band or another time-fit keeps a true fraction: index 14 of
// one rendering is not index 14 of another, but 40% of the words is 40%.
//
// NEVER PAINTED (DR-0076):
//   - no place                    -> null (no bar)
//   - a place with nothing measured (an old step-only record, a browse, a
//     Start pressed and left)     -> null. A step or a sentence index is never
//     turned into a percentage: the total it would be divided by is not in the
//     record, and a guessed total is a painted number.
//   - a reading credited to the end (`done`) -> full, "Read to the end"
//   - otherwise                   -> the measured fraction, "About 40% read"
//
// WHOSE IT IS (DATA-AS-EMPOWERMENT; USER-ACCOUNTS-AND-HISTORIES). The reader's
// own history, on the reader's own device, shown back to the reader so they
// can choose what to finish. Nothing new is collected or sent: the bar only
// reads the place the reader already keeps, and Start fresh still clears it.
// "Closest to finished" is a plain list to choose from, never a streak.
// =============================================================================

import { placeReached, placeIsFinished, recordPlace, finishPlace, getPlaceFor, readingIsFresh } from './learn-resume.js';
import { percentRead } from './reading-progress.js';
import { hasReadEvidence } from './test-integrity.js';

const VERSION_WORD = { child: 'Child', youth: 'Youth', teen: 'Teen', adult: 'Adult', senior: 'Senior' };

/**
 * The progress a lesson card shows, or null when there is nothing true to show.
 * @param {object|null} place  one place from learn-resume (getPlaceFor / listPlaces)
 * @returns {null | { fraction:number, percent:number, finished:boolean, label:string, version:string }}
 */
export function lessonProgress(place) {
  if (!place || typeof place !== 'object') return null;
  const version = VERSION_WORD[place.version] || '';
  if (placeIsFinished(place)) {
    return { fraction: 1, percent: 100, finished: true, label: version ? `Read to the end, ${version} version` : 'Read to the end', version };
  }
  const reached = placeReached(place);
  if (!(reached > 0)) return null;
  const percent = percentRead(reached);
  const said = reached >= 1 ? 'All read' : percent < 1 ? 'Under 1% read' : `About ${percent}% read`;
  return { fraction: reached, percent, finished: false, label: version ? `${said}, ${version} version` : said, version };
}

/** Started and not finished: something measured, short of the end. */
export function isUnfinished(progress) {
  return !!progress && !progress.finished && progress.fraction > 0 && progress.fraction < 1;
}

/**
 * The lessons closest to finished, from every saved place on the device:
 * begun, measured, not finished; the furthest along first, then the most
 * recently touched. `limit` caps the list (0 = no cap).
 * @returns {Array<{place:object, progress:object}>}
 */
export function closestToFinished(places, { limit = 0 } = {}) {
  const out = (Array.isArray(places) ? places : [])
    .map((place) => ({ place, progress: lessonProgress(place) }))
    .filter((x) => isUnfinished(x.progress))
    .sort((a, b) => b.progress.fraction - a.progress.fraction || (b.place.at || 0) - (a.place.at || 0));
  return limit > 0 ? out.slice(0, limit) : out;
}

/**
 * One lookup for a whole grid: (courseKey, lessonId) -> place. A card whose
 * course key matches no place falls back to the newest place of that lesson
 * in any course (the same rule as getPlaceFor(null, id)).
 */
export function placeLookup(places) {
  const byKey = new Map();
  const byLesson = new Map();
  for (const p of Array.isArray(places) ? places : []) {
    if (!p || !p.lessonId) continue;
    byKey.set(`${p.courseKey}::${p.lessonId}`, p);
    const had = byLesson.get(p.lessonId);
    if (!had || (p.at || 0) > (had.at || 0)) byLesson.set(p.lessonId, p);
  }
  return (courseKey, lessonId) => (courseKey && byKey.get(`${courseKey}::${lessonId}`)) || byLesson.get(lessonId) || null;
}

/**
 * The witnesses for the new-look Lesson Experience when it is opened from the
 * Learn grid (LearnStudioPreview). Before DR-1684 that path handed the
 * Experience no-op onSeen/onHeard, so a lesson read or heard there wrote
 * nothing: no bar, no Continue, no read credit. These write the SAME place the
 * classic space writes (CourseView's savePlace), and credit the read on the
 * SAME evidence floor as its finishRead (DR-1384/1386): never on a flick.
 */
export function studioWitness(courseKey, lessonId, opts = {}) {
  const ok = !!(courseKey && lessonId);
  const at = (patch) => recordPlace({ courseKey, lessonId, ...patch }, opts);
  const credit = (version) => {
    const p = getPlaceFor(courseKey, lessonId, opts);
    if (!p || placeIsFinished(p) || !hasReadEvidence(p) || !readingIsFresh(p)) return;
    try {
      finishPlace({ courseKey, lessonId, ...(version ? { version } : {}) }, opts);
    } catch {
      /* the reading stands either way */
    }
  };
  const witness = (key) => (f, version) => {
    if (!ok) return;
    at({ [key]: f, started: true, ...(version ? { version } : {}) });
    credit(version);
  };
  return {
    place: () => (ok ? getPlaceFor(courseKey, lessonId, opts) : null),
    onSeen: witness('seen'),
    onHeard: witness('heard'),
    onLevel: (version) => {
      if (ok && version) at({ version });
    },
  };
}
