// =============================================================================
// LessonsForSituation — "From the Word for this" under the Lesson chip
// =============================================================================
// DR-0630. With the Lesson chip chosen and words in the box, the lessons
// already written from the Word that speak to those words are listed right
// there, each opening in Learn through the same exact-lesson link Learn
// shares (lib/lesson-links.js). Local and deterministic (lib/lessons-for-
// situation.js): it works signed in or signed out, and it never paints a weak
// match as a strong one. When nothing reaches the bar it says so and offers
// the whole Living Lessons shelf instead.
import React, { useMemo } from 'react';
import { lessonsForSituation, whyLine, BROWSE_LIVING_LESSONS_HREF } from '../lib/lessons-for-situation.js';

export function LessonsForSituation({ words, courses = null }) {
  const results = useMemo(() => lessonsForSituation(words, courses ? { courses } : {}), [words, courses]);
  const serif = { fontFamily: '"Fraunces", serif' };
  return (
    <div className="mt-2 border border-[#5A6E3D] bg-[#FAF8F4] p-3" data-testid="lessons-for-situation" aria-live="polite">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">From the Word for this</div>
      {results.length > 0 ? (
        <>
          <p className="text-[0.75rem] text-[#5A5751] mt-1" style={serif}>
            Lessons already written from the Word that speak to what you said. Tap one to open it in Learn.
          </p>
          <ul className="mt-2 space-y-2">
            {results.map((r) => (
              <li key={`${r.courseKey}/${r.lessonId}`} data-testid="situation-lesson" data-lesson-id={r.lessonId}>
                <a
                  href={r.href}
                  data-testid="situation-lesson-link"
                  className="text-sm font-semibold text-[#1A1815] underline decoration-[#5A6E3D] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                  style={serif}
                >
                  {r.title}
                </a>
                <div className="text-[0.6875rem] text-[#5A5751]" style={serif}>
                  {r.courseTitle}{r.refs.length ? ` · ${r.refs.slice(0, 3).join('; ')}` : ''}
                </div>
                <div className="text-[0.6875rem] text-[#5A6E3D] italic" style={serif} data-testid="situation-lesson-why">{whyLine(r)}</div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-[0.75rem] text-[#5A5751] mt-1" style={serif} data-testid="situation-no-match">
          No lesson written yet speaks to these words closely enough to name one.{' '}
          <a href={BROWSE_LIVING_LESSONS_HREF} data-testid="situation-browse" className="underline text-[#B85838] hover:text-[#1A1815]">Browse Living Lessons →</a>
        </p>
      )}
    </div>
  );
}

export default LessonsForSituation;
