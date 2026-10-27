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
//
// THE SAME ROW AS THE COURSE LIST (Darrell 2026-10-27, two screenshots side by
// side: "Lessons tab is not giving the count or the play buttons etc... Even
// the count is different for lessons and latest with the same courses?"). A
// course's own list gave every lesson a ▶ Play, a Continue or FINISHED mark,
// and a month heading with its "for every age" count; this list gave a bare
// title and a heading with lessons and readings. Same lessons, two different
// rows, two different headings — read as a mismatch, because it was one. Now
// a row here carries the same ▶ Play (the big full-screen reader, through
// `onPlay`), the same place mark (RowContinue, from the device's own record),
// and the month heading says all three numbers both lists can say: lessons ·
// readings · for every age. The course list says the same three
// (ChurchLearn.jsx).
//
// THE MONTH STAYS AT THE TOP OF THE SCROLL, AND FOLDS (DR-0732, carried here;
// Darrell 2026-10-01 on this very list: "October and September should stay at
// the top of the scroll with the count... remember"). The Church > The Word
// list got the sticky, folding month heading on 2026-10-01 and this list did
// not: its heading scrolled off with its first lesson, so by L203 the month
// and its two numbers were gone. The same heading now: sticky inside the
// scrolling list with the list's own background, both numbers on it, one tap
// folds the month, one control folds or opens them all, remembered on the
// device under its own key.
// =============================================================================
import React, { useState } from 'react';
import { latestLessons, latestCountLine, catalogReadings, readingsLine, readingsMeaning, monthReadings, countWords } from '../lib/learn-organize.js';
import { formatAdded, withMonthHeadings } from '../lib/lesson-order.js';
import { undatedReason } from '../lib/lesson-dates.js';
import { rememberedFolds, rememberFolds, toggleFold, foldAll, openAll, visibleItems, foldAllOffer } from '../lib/lesson-month-fold.js';
import { getPlaceFor, placeInProgress } from '../lib/learn-resume.js';
import { RowContinue } from './LessonContinue.jsx';

/** The fold memory's key for this list: one list, every course. */
export const LATEST_FOLD_KEY = 'latest:every-course';

export default function LatestLessons({ courses, onOpen, onPlay = null, onContinue = null, scope = 'every course' }) {
  const [folded, setFolded] = useState(() => rememberedFolds(LATEST_FOLD_KEY));
  const setFolds = (next) => { setFolded(next); rememberFolds(LATEST_FOLD_KEY, next); };
  const latest = latestLessons(courses);
  const { rows } = latest;
  if (!rows.length) return null;
  const items = withMonthHeadings(rows);
  const scale = catalogReadings(courses);
  const perMonth = monthReadings(items);
  const meaning = readingsMeaning(scale);
  const shown = visibleItems(items, folded);
  const foldOffer = foldAllOffer(items, folded);
  return (
    <nav aria-label={`Latest lessons, ${scope}`} data-testid="learn-latest-lessons" className="mb-4 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">
        Latest lessons · {scope} · newest first · <span data-testid="learn-latest-count">{rows.length}</span>
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        <span data-testid="learn-latest-line">{latestCountLine(latest, undatedReason)}</span>
      </p>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }} data-testid="learn-latest-scale">
        <span data-testid="learn-latest-readings" data-readings={scale.readings}>{readingsLine(scale)}.</span>
        {meaning ? <>{' '}<span>{meaning}</span></> : null}
      </p>
      {foldOffer ? (
        <div className="mb-1 flex justify-end">
          <button
            type="button"
            data-testid="latest-months-fold-all"
            data-action={foldOffer.action}
            onClick={() => setFolds(foldOffer.action === 'fold' ? foldAll(items) : openAll())}
            className="px-2 py-1 min-h-[36px] text-[0.625rem] uppercase tracking-wider border border-[#C9BFA8] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            {foldOffer.label}
          </button>
        </div>
      ) : null}
      {/* ONE SCROLL (DR-1182): the list rides the page; the month headings stay
          sticky against the page's own scroll, and the folds keep it short. */}
      <ol className="space-y-0.5" data-testid="learn-latest-list">
        {shown.map((r) => (r.heading ? (
          /* THE MONTH STAYS AT THE TOP (DR-0732): sticky inside the scrolling
             list, the list's own background, so the next month pushes it off
             and never a lesson scrolls under it unnamed. The whole row is the
             fold; both numbers stay on it folded or open. */
          <li
            key={`latest-${r.heading.key}`}
            data-month-heading={r.heading.key}
            data-folded={r.heading.folded ? 'true' : 'false'}
            data-count={r.heading.count}
            className="sticky top-0 z-10 bg-[#FAF8F4] border-t border-[#E8E4DC]"
          >
            <button
              type="button"
              data-testid="latest-month-fold"
              aria-expanded={!r.heading.folded}
              aria-label={`${r.heading.label}, ${r.heading.count} ${r.heading.count === 1 ? 'lesson' : 'lessons'}, ${countWords(perMonth[r.heading.key] || 0)} readings${r.heading.aged ? `, ${r.heading.aged} written for every age` : ''} — ${r.heading.folded ? 'open this month' : 'fold this month'}`}
              onClick={() => setFolds(toggleFold(folded, r.heading.key))}
              className="w-full min-h-[44px] pt-2 pb-1 text-[0.6875rem] uppercase tracking-wider text-[#5A6E3D] font-semibold flex flex-wrap items-center justify-between gap-x-2 text-left focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-[#5A5751] text-xs">{r.heading.folded ? '▸' : '▾'}</span>
                <span>{r.heading.label}</span>
              </span>
              <span className="text-[#5A5751] normal-case tracking-normal" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <span data-month-lessons>{r.heading.count} {r.heading.count === 1 ? 'lesson' : 'lessons'}</span>
                {' · '}
                <span data-month-readings={perMonth[r.heading.key] || 0}>{countWords(perMonth[r.heading.key] || 0)} readings</span>
                {/* THE OTHER NUMBER, FOR PARENTS (DR-0732) — the same count the
                    course list's heading carries, so the two headings agree. */}
                {r.heading.aged ? <span className="text-[#5A6E3D]" data-month-aged={r.heading.aged}>{` · ${r.heading.aged} for every age`}</span> : null}
              </span>
            </button>
          </li>
        ) : (
          <li key={`${r.courseKey}:${r.lessonId}`} data-lesson-id={r.lessonId} data-course-key={r.courseKey} data-added={r.added} className="flex items-center gap-2">
            {/* The title opens the lesson's own space — first in the row, as
                the course list has it, so the same tap means the same thing. */}
            <button
              type="button"
              onClick={() => onOpen(r.courseKey, r.lessonId)}
              className="flex-1 min-w-0 text-left py-2 min-h-[44px] text-sm text-[#1A1815] hover:text-[#B85838] hover:underline focus:outline focus:outline-2 focus:outline-[#B85838]"
              style={{ fontFamily: '"Fraunces", serif' }}
            >
              <span className="block text-[#5A5751] text-[0.6875rem] leading-snug" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <span className="whitespace-nowrap">{formatAdded(r.added)}</span>
                {' · '}<span>{r.courseTitle}</span>
                {r.n != null ? <>{' · '}<span className="whitespace-nowrap">L{r.n}</span></> : null}
              </span>
              <span className="block">{r.title}</span>
              {/* ONCE, AT HOME: the course that also teaches this very lesson
                  (carried whole under its own number) is named here instead
                  of listed again as a second row. */}
              {r.alsoIn && r.alsoIn.length ? (
                <span className="block text-[#5A6E3D] text-[0.6875rem] leading-snug" data-testid="latest-also-in">also taught whole in {r.alsoIn.join(' and ')}</span>
              ) : null}
              {/* ONE QUESTION, TWO LESSONS: a different lesson with the same
                  title is a pair on purpose, and each row says so. */}
              {r.sameTitleIn && r.sameTitleIn.length ? (
                <span className="block text-[#5A5751] text-[0.6875rem] leading-snug" data-testid="latest-same-title">same title, another lesson: {r.sameTitleIn.join(', ')}</span>
              ) : null}
            </button>
            {/* THE LESSON'S OWN STATE, as the course list shows it (DR-0631):
                Continue on a lesson begun, FINISHED on one read to the end —
                from this device's own record, never painted. */}
            {(() => {
              const place = getPlaceFor(r.courseKey, r.lessonId);
              const shown = place && (place.done || placeInProgress(place)) ? place : null;
              return shown && onContinue ? <RowContinue place={shown} title={r.title} onContinue={onContinue} /> : null;
            })()}
            {/* THE SAME ▶ PLAY the course list carries: the big full-screen
                reader on this one lesson — read it yourself, or read to you. */}
            {onPlay ? (
              <button
                type="button"
                onClick={() => onPlay(r.courseKey, r.lessonId)}
                data-testid="latest-play"
                aria-label={`Play ${r.title} in the big full-screen view`}
                title={`Open ${r.title} in the big full-screen view — read it yourself or have it read aloud`}
                className="shrink-0 text-[0.625rem] uppercase tracking-wider px-2 py-2 min-h-[44px] border-2 border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
              >
                ▶ Play
              </button>
            ) : null}
          </li>
        )))}
      </ol>
    </nav>
  );
}
