// =============================================================================
// LatestLessons — the newest lessons across EVERY course, newest first (DR-0686)
// =============================================================================
// Darrell 2026-09-29, on Church -> Learn: "Can we make the top sort work to do
// all sorting options? Also the latest created lessons?"
//
// WHERE IT LIVES AND WHY: it is an option IN the top sort ("Latest lessons,
// every course"), and choosing it shows this list directly under the picker
// row. The top of Learn is guarded picker-first (learn-course-picker-is-first,
// learn-lesson-index-is-next), and Darrell has asked more than once that
// nothing be stacked above the picker or between it and where you left off by
// default — so the list appears only when the reader asks for it, in the same
// control he was already using, and the device remembers the pick like every
// other sort.
//
// REAL DAYS ONLY: every row is a mounted lesson with a recorded day (`added`,
// the commit day each lesson first landed — living-lessons-dates.js, and for
// every other course lesson-dates.js, DR-0687: Darrell 2026-09-30, "Add all
// the days the lessons were created so we can have all of them in each course
// so they can get done."). A lesson with no recorded day is left out and
// counted in the header with its reason, never dated by guess (DR-0076).
// Tapping a row opens it in its HOME course.
//
// BOTH NUMBERS (DR-0715; Darrell 2026-09-30: "is the lesson count 349 or is
// that with every variation based on the age number? I want both so it shows
// the scale"). The lesson count is one per lesson; beside it stands every age
// version those lessons really carry (child, youth, teen, adult, senior),
// counted by lessonVersions in lib/learn-organize.js, never assumed. Each
// month shows both too.
// =============================================================================
import React from 'react';
import { latestLessons, latestCountLine, catalogReadings, readingsLine, readingsMeaning, monthReadings, countWords } from '../lib/learn-organize.js';
import { formatAdded, withMonthHeadings } from '../lib/lesson-order.js';
import { undatedReason } from '../lib/lesson-dates.js';

export default function LatestLessons({ courses, onOpen }) {
  const latest = latestLessons(courses);
  const { rows } = latest;
  if (!rows.length) return null;
  const items = withMonthHeadings(rows);
  const scale = catalogReadings(courses);
  const perMonth = monthReadings(items);
  const meaning = readingsMeaning(scale);
  return (
    <nav aria-label="Latest lessons, every course" data-testid="learn-latest-lessons" className="mb-4 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">
        Latest lessons · every course · newest first · <span data-testid="learn-latest-count">{rows.length}</span>
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        <span data-testid="learn-latest-line">{latestCountLine(latest, undatedReason)}</span>
      </p>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }} data-testid="learn-latest-scale">
        <span data-testid="learn-latest-readings" data-readings={scale.readings}>{readingsLine(scale)}.</span>
        {meaning ? <>{' '}<span>{meaning}</span></> : null}
      </p>
      <ol className="space-y-0.5 max-h-[45vh] overflow-y-auto pr-1" data-testid="learn-latest-list">
        {items.map((r) => (r.heading ? (
          <li key={`latest-${r.heading.key}`} data-month-heading={r.heading.key} className="pt-2 pb-1 text-[0.6875rem] uppercase tracking-wider text-[#5A6E3D] font-semibold border-t border-[#E8E4DC] flex flex-wrap items-center justify-between gap-x-2">
            <span>{r.heading.label}</span>
            <span className="text-[#5A5751] normal-case tracking-normal" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <span data-month-lessons>{r.heading.count} {r.heading.count === 1 ? 'lesson' : 'lessons'}</span>
              {' · '}
              <span data-month-readings={perMonth[r.heading.key] || 0}>{countWords(perMonth[r.heading.key] || 0)} readings</span>
            </span>
          </li>
        ) : (
          <li key={`${r.courseKey}:${r.lessonId}`} data-lesson-id={r.lessonId} data-course-key={r.courseKey} data-added={r.added}>
            <button
              type="button"
              onClick={() => onOpen(r.courseKey, r.lessonId)}
              className="w-full text-left py-2 min-h-[44px] text-sm text-[#1A1815] hover:text-[#B85838] hover:underline focus:outline focus:outline-2 focus:outline-[#B85838]"
              style={{ fontFamily: '"Fraunces", serif' }}
            >
              <span className="block text-[#5A5751] text-[0.6875rem] leading-snug" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <span className="whitespace-nowrap">{formatAdded(r.added)}</span>
                {' · '}<span>{r.courseTitle}</span>
                {r.n != null ? <>{' · '}<span className="whitespace-nowrap">L{r.n}</span></> : null}
              </span>
              <span className="block">{r.title}</span>
            </button>
          </li>
        )))}
      </ol>
    </nav>
  );
}
