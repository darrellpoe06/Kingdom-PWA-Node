// =============================================================================
// LessonNav — Previous lesson / Next lesson at the end of the lesson screen
// =============================================================================
// Darrell 2026-11-25, from the live build at the end of a lesson: "What about
// the next or last lesson? Options!" The new look ended on the reading bar with
// no way on but Back to Learn. This is the course's own order (the same rows
// the course page lists), one step each way, in every mode. Where there is no
// lesson that way it says so instead of going blank (P15). The host's own
// lesson switch does the moving, so a neighbor that is not yet in the new look
// opens on its full lesson page.
import React from 'react';

const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

/** The lessons either side of this one in its course's own order: { prev, next }, each { courseKey, lessonId, title } or null. */
export function neighborLessons(lesson, course, courseKey = null) {
  const rows = ((course && (course.schedule || course.lessons)) || []).filter((l) => l && l.id);
  const at = lesson ? rows.findIndex((l) => l.id === lesson.id) : -1;
  const key = courseKey || (course && (course.key || (course.meta && course.meta.key))) || null;
  const pick = (l) => (l ? { courseKey: key, lessonId: l.id, title: typeof l.title === 'string' && l.title.trim() ? l.title : l.id } : null);
  if (at < 0) return { prev: null, next: null };
  return { prev: pick(rows[at - 1]), next: pick(rows[at + 1]) };
}

export default function LessonNav({ prev = null, next = null, onOpen = null }) {
  if (!onOpen || (!prev && !next)) return null;
  const go = (n) => () => onOpen(n.courseKey, n.lessonId);
  return (
    <nav className="le-nav" aria-label="Previous and next lesson" data-read-skip="" data-testid="le-lesson-nav">
      {prev ? (
        <button type="button" className={`le-nav-btn ${RING}`} onClick={go(prev)} data-testid="le-prev-lesson">
          <span className="le-nav-k">‹ Previous lesson</span>
          <span className="le-nav-t">{prev.title}</span>
        </button>
      ) : (
        <span className="le-nav-none" data-testid="le-prev-none">
          This is the first lesson of the course.
        </span>
      )}
      {next ? (
        <button type="button" className={`le-nav-btn le-nav-btn--next ${RING}`} onClick={go(next)} data-testid="le-next-lesson">
          <span className="le-nav-k">Next lesson ›</span>
          <span className="le-nav-t">{next.title}</span>
        </button>
      ) : (
        <span className="le-nav-none" data-testid="le-next-none">
          This is the last lesson of the course.
        </span>
      )}
    </nav>
  );
}
