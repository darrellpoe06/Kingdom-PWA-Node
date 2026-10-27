// =============================================================================
// LessonContinue — every way back into a lesson you started (DR-0631)
// =============================================================================
// Darrell 2026-09-24, from the live app: "Continuing a lesson doesn't work
// well... it needs to be way better..."
//
// MEASURED at 390x844 before this file (the before-*.png journeys):
//   • the only Continue offer on the Learn tab sat at y≈2,084 on an 844-px
//     screen — two and a half screens below the top, under the department
//     tabs, the course picker, the whole lesson index and the finder;
//   • it offered ONE lesson per device, so a second lesson in another course
//     erased the first, and the reader who went back found no way to continue
//     it anywhere — not on the course, not in its lesson list;
//   • it vanished after one use and did not come back until Learn remounted.
//
// Three offers now, each one tap, each fed from the SAME place records
// (lib/learn-resume.js — one place per lesson), resolved against the MOUNTED
// catalog so none can ever point at a lesson that no longer exists:
//   ContinueOffer   — under the course picker (Darrell has said, twice, that
//                     the picker comes first — "even above where you left
//                     off" — so the offer sits directly beneath it): the
//                     latest lesson as one big button, and every other lesson
//                     in progress beneath it.
//   ContinueChip    — in the sticky lessons bar, for the open course: the bar
//                     never scrolls away, so the course's own Continue is
//                     always in reach.
//   RowContinue     — on each lesson in the by-title list: Continue on the
//                     ones begun, a quiet "Finished" on the ones done.
// =============================================================================
import React from 'react';
import { placeAgo, placeWhere, placeInProgress } from '../lib/learn-resume.js';
import { readMark, readMarkLabel, readMarkSays, VERSION_LABEL } from '../lib/lesson-read-mark.js';
import { confirmThen } from '../lib/confirm-action.js';
import { unitLabels } from '../lib/learn-units.js';
import { ownNumber } from '../lib/lesson-order.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

/**
 * Resolve saved places against the mounted catalog. A place whose course or
 * lesson is gone is dropped from every offer (never a dead door) — the record
 * itself is kept, so a lesson that comes back is still continued.
 * @returns {Array<{place, course, lesson}>}
 */
export function resolvePlaces(places, courses) {
  const out = [];
  for (const place of Array.isArray(places) ? places : []) {
    const course = (courses || []).find((c) => c.key === place.courseKey);
    const lesson = course ? ((course.schedule || []).find((m) => m.id === place.lessonId) || null) : null;
    if (course && lesson) out.push({ place, course, lesson });
  }
  return out;
}

// The lesson by ITS OWN number (DR-0626): "Lesson 192", never its place in
// the written array ("Lesson 191" was L192's array position).
function lessonLabel(course, lesson) {
  const U = unitLabels(course.meta || {});
  return `${U.cap} ${ownNumber(lesson, course.schedule)} · ${lesson.title}`;
}

/** The top-of-Learn offer: the latest lesson, then every other one begun. */
export function ContinueOffer({ items, onContinue, onRefresh, onForget, now = Date.now(), max = 4 }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const [first, ...rest] = items;
  const { place, course, lesson } = first;
  const more = rest.slice(0, Math.max(0, max - 1));
  return (
    <div className="mb-4 border-2 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] p-3" data-testid="continue-offer">
      <div className="text-[0.6875rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-2">Pick up where you left off</div>
      <button
        type="button"
        onClick={() => onContinue(place)}
        data-testid="continue-latest"
        aria-label={`Continue ${lesson.title}, ${placeWhere(place)}`}
        className={`w-full text-left px-4 py-3 min-h-[56px] border-2 border-[#5A6E3D] bg-[#5A6E3D] text-white hover:bg-[#4a5a31] ${FOCUS}`}
      >
        <span className="block text-[0.8125rem] uppercase tracking-wider font-semibold">Continue →</span>
        <span className="block text-base leading-snug mt-0.5" style={SERIF}>{lessonLabel(course, lesson)}</span>
        <span className="block text-[0.75rem] opacity-90 mt-0.5">
          {course.meta.title} · {placeWhere(place)}{placeAgo(place.at, now) ? ` · ${placeAgo(place.at, now)}` : ''}
        </span>
      </button>
      <div className="flex flex-wrap gap-2 mt-2">
        {place.step > 0 && (
          <button
            type="button"
            onClick={() => onRefresh(place)}
            title="Replay the last couple of steps before the new one"
            className={`text-[0.6875rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white ${FOCUS}`}
          >
            Refresh first
          </button>
        )}
        <button
          type="button"
          onClick={confirmThen(
            `Start "${lesson.title}" fresh? Your place in this lesson is forgotten on this device. Your other lessons keep theirs.`,
            () => onForget(place),
          )}
          className={`text-[0.6875rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white ${FOCUS}`}
        >
          Start fresh
        </button>
      </div>
      {more.length > 0 && (
        <div className="mt-3 pt-2 border-t border-[#5A6E3D]/40" data-testid="continue-others">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">
            Also in progress · {rest.length}
          </div>
          <ul className="space-y-1">
            {more.map(({ place: p, course: c, lesson: l }) => (
              <li key={`${p.courseKey}::${p.lessonId}`}>
                <button
                  type="button"
                  onClick={() => onContinue(p)}
                  aria-label={`Continue ${l.title}, ${placeWhere(p)}`}
                  className={`w-full text-left px-2 py-2 min-h-[44px] border border-[#5A6E3D]/50 bg-white text-[#1A1815] hover:border-[#5A6E3D] ${FOCUS}`}
                >
                  <span className="block text-sm leading-snug" style={SERIF}>{lessonLabel(c, l)}</span>
                  <span className="block text-[0.6875rem] text-[#5A5751]">
                    Continue → {c.meta.title} · {placeWhere(p)}{placeAgo(p.at, now) ? ` · ${placeAgo(p.at, now)}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** The open course's own Continue, for the sticky lessons bar. */
export function ContinueChip({ item, onContinue }) {
  if (!item) return null;
  const { place, course, lesson } = item;
  const U = unitLabels(course.meta || {});
  return (
    <button
      type="button"
      onClick={() => onContinue(place)}
      data-testid="continue-chip"
      aria-label={`Continue ${lesson.title}, ${placeWhere(place)}`}
      title={`Continue ${U.noun} ${ownNumber(lesson, course.schedule)} · ${lesson.title} — ${placeWhere(place)}`}
      className={`text-[0.6875rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border-2 border-[#5A6E3D] bg-[#5A6E3D] text-white font-semibold hover:bg-[#4a5a31] ${FOCUS}`}
    >
      Continue <span style={MONO}>{U.cap.charAt(0)}{ownNumber(lesson, course.schedule)}</span>
    </button>
  );
}

/** A lesson row's own state in the by-title list: Continue, or Finished. */
/**
 * The lesson's own state on its row (DR-0631), and WHICH VERSION (DR-1255):
 * "✓ READ · Adult" with a tap for each version not read yet, from the
 * device's place AND the learner's own cloud record; Continue on a lesson
 * begun; nothing on a lesson never touched. `versions` is the list the lesson
 * really carries (lib/learn-organize.js lessonVersions); `record` is the
 * learner's row for this lesson (learner_lesson_records), or null.
 */
export function RowContinue({ place, title, onContinue, versions = null, record = null, onReadVersion = null }) {
  const mark = readMark({ place, record, versions });
  if (mark.read) {
    // HOW MANY TIMES, NOT WHETHER (Darrell 2026-10-10: "Some say finished
    // should be how many times I've finished it..."), and now WHICH WORDS
    // (Darrell 2026-10-27: "Even which version so I can try the one I didn't
    // read!!!!!!"). The count and the versions ride the place and ratchet
    // (lib/learn-resume.js); the record carries them across his devices.
    const says = readMarkSays(mark, title);
    return (
      <span className="shrink min-w-0 flex items-center justify-end gap-1 flex-wrap" data-testid="row-read-mark">
        <span
          className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold px-1"
          data-testid="row-finished"
          data-times={mark.times}
          data-from-record={mark.fromRecord ? 'true' : 'false'}
          data-versions={mark.readIds.join(' ')}
          data-unread={mark.unreadIds.join(' ')}
          title={says}
          aria-label={says}
        >
          {readMarkLabel(mark)}
        </span>
        {onReadVersion && mark.unreadIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onReadVersion(id)}
            data-testid="row-read-version"
            data-version={id}
            aria-label={`Read the ${VERSION_LABEL[id]} version of ${title}`}
            title={`Not read yet — read the ${VERSION_LABEL[id]} version of ${title}`}
            className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white ${FOCUS}`}
          >
            {VERSION_LABEL[id]}
          </button>
        ))}
      </span>
    );
  }
  if (!place || !placeInProgress(place)) return null;
  return (
    <button
      type="button"
      onClick={() => onContinue(place)}
      data-testid="row-continue"
      aria-label={`Continue ${title}, ${placeWhere(place)}`}
      title={`Continue — ${placeWhere(place)}`}
      className={`shrink-0 text-[0.625rem] uppercase tracking-wider px-2 py-2 min-h-[44px] border-2 border-[#5A6E3D] bg-[#5A6E3D] text-white font-semibold hover:bg-[#4a5a31] ${FOCUS}`}
    >
      Continue
    </button>
  );
}
