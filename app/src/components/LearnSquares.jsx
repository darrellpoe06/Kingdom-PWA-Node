// =============================================================================
// LearnSquares — Learn by squares: an area, then its courses, then its lessons
// =============================================================================
// Darrell 2026-11-24: "Not a scroll of death... sections... so each of the 13
// then inside each... all as squares... not rectangular so it takes up less
// space on the screen and gives more options and a place to go for more
// information the same courses... maybe area tabs... then... courses... the
// lessons... don't get rid of the view I like... just giving another option
// for navigating the app." Then: "What does app development research and
// actual high performance apps say about this? Do we need to reinvent the
// wheel or get an understanding!"
//
// ANOTHER DOOR, NOT A REPLACEMENT: the area strip's other tabs are untouched.
//
// WHAT THE RESEARCH SAYS, AND WHERE IT IS APPLIED (DR-1633):
//   • Tiles for the first one or two levels. Baymard's mobile testing found
//     people rely on tile "intermediary category pages" to choose where to
//     go, recommends them for the top 1–2 layers, and names breadcrumbs as
//     the wayfinding. So AREAS and COURSES are squares, under a breadcrumb.
//   • A list for text. NN/g: a vertical list scans faster than cards, fits
//     more per screen, and cards suit items that look different from each
//     other. A lesson is a long title, and a square would cut it off (weak
//     scent, pogo-sticking). So LESSONS are full-title rows, ten to a page.
//   • No long scroll at any level: one level on screen at a time, paged.
//   • Progress where the choice is made. The best-evidenced engagement
//     lever in learning apps is visible progress and an easy way back in
//     (Duolingo's own A/B data on streaks; an RCT on a reading app). A
//     course tile says where the reader stands, from their real records
//     (courseStandingLabel, DR-1420): no painted number, no leaderboard.
//
// GROUNDED (P15; DR-0076): the areas are learnDepartments(courses), derived
// from each course's own category; every count is counted from the mounted
// catalog. A lesson row opens the lesson through the caller's own opener,
// the one the Latest list uses. Never blank: an empty level says so.
// rem sizes so large print scales (2b); 44px+ targets (2g); in place (2e).
import React, { useMemo, useState } from 'react';
import { learnDepartments, courseLessonCount, courseStandingLabel } from '../lib/learn-organize.js';

export const LESSONS_PAGE = 10;
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const GRID = 'grid gap-2 grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]';
const TILE = `aspect-square w-full flex flex-col items-start justify-between text-left p-2 border bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815] overflow-hidden ${FOCUS}`;
const CRUMB = `text-[0.6875rem] uppercase tracking-wider min-h-[44px] px-2 border border-[#E8E4DC] bg-white text-[#1A1815] hover:border-[#1A1815] ${FOCUS}`;
const SERIF = { fontFamily: '"Fraunces", serif' };
const plural = (n, one) => `${n} ${n === 1 ? one : `${one}s`}`;
const titleOf = (c) => (c && c.meta && c.meta.title) || (c && c.key) || '';

function Tile({ mark, title, foot, onClick, testid, label }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={TILE} data-testid={testid} aria-label={label} title={title}>
        <span className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold">{mark}</span>
        <span className="text-[0.75rem] leading-tight font-semibold line-clamp-3" style={SERIF}>
          {title}
        </span>
        <span className="text-[0.625rem] text-[#5A5751]">{foot}</span>
      </button>
    </li>
  );
}

export default function LearnSquares({ courses = [], ctx = null, onOpenLesson = null, onOpenCourse = null }) {
  const areas = useMemo(() => learnDepartments(courses), [courses]);
  const [areaId, setAreaId] = useState(null);
  const [courseKey, setCourseKey] = useState(null);
  const [page, setPage] = useState(0);
  const area = areas.find((a) => a.id === areaId) || null;
  const course = area ? area.courses.find((c) => c.key === courseKey) || null : null;
  const lessons = course ? (course.schedule || []).filter((m) => m && m.id) : [];
  const pages = Math.max(1, Math.ceil(lessons.length / LESSONS_PAGE));
  const at = Math.min(page, pages - 1);
  const first = at * LESSONS_PAGE;
  const shown = lessons.slice(first, first + LESSONS_PAGE);
  const go = (a, c) => {
    setAreaId(a);
    setCourseKey(c);
    setPage(0);
  };
  const level = course ? 'lessons' : area ? 'courses' : 'areas';

  return (
    <section className="mb-3" aria-label="Browse by area" data-testid="learn-squares" data-level={level}>
      <nav className="flex flex-wrap items-center gap-1 mb-2" aria-label="Where you are" data-read-skip>
        <button
          type="button"
          onClick={() => go(null, null)}
          className={CRUMB}
          aria-current={level === 'areas' ? 'page' : undefined}
          data-testid="squares-crumb-areas"
        >
          All {areas.length} areas
        </button>
        {area && (
          <button
            type="button"
            onClick={() => go(area.id, null)}
            className={CRUMB}
            aria-current={level === 'courses' ? 'page' : undefined}
            data-testid="squares-crumb-area"
          >
            › {area.label}
          </button>
        )}
        {course && (
          <span className="text-[0.6875rem] uppercase tracking-wider px-2 text-[#5A5751]" aria-current="page" data-testid="squares-crumb-course">
            › {titleOf(course)}
          </span>
        )}
      </nav>

      {level === 'areas' &&
        (areas.length === 0 ? (
          <p className="text-xs text-[#5A5751]" data-testid="squares-empty">
            No course is mounted here yet, so there is no area to show. Courses appear here as soon as one is registered.
          </p>
        ) : (
          <ul className={GRID} aria-label="Areas" data-testid="squares-areas">
            {areas.map((a) => (
              <Tile
                key={a.id}
                mark={a.code}
                title={a.label}
                foot={`${plural(a.courses.length, 'course')} · ${a.lessons}`}
                label={`${a.label}: ${plural(a.courses.length, 'course')}, ${plural(a.lessons, 'lesson')}`}
                onClick={() => go(a.id, null)}
                testid={`square-area-${a.id}`}
              />
            ))}
          </ul>
        ))}

      {level === 'courses' && (
        <ul className={GRID} aria-label={`${area.label} courses`} data-testid="squares-courses">
          {area.courses.map((c) => (
            <Tile
              key={c.key}
              mark={c.code}
              title={titleOf(c)}
              foot={(ctx && courseStandingLabel(c, ctx)) || plural(courseLessonCount(c), 'lesson')}
              label={`${titleOf(c)}: ${plural(courseLessonCount(c), 'lesson')}${ctx ? `, ${courseStandingLabel(c, ctx)}` : ''}`}
              onClick={() => go(area.id, c.key)}
              testid={`square-course-${c.key}`}
            />
          ))}
        </ul>
      )}

      {level === 'lessons' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-[0.6875rem] text-[#5A5751]" data-testid="squares-course-about">
              {course.meta && course.meta.audience ? `For ${course.meta.audience}. ` : ''}
              {plural(lessons.length, 'lesson')}.
            </p>
            {onOpenCourse && (
              <button type="button" onClick={() => onOpenCourse(course.key)} className={CRUMB} data-testid="squares-open-course">
                More about this course →
              </button>
            )}
          </div>
          {lessons.length === 0 ? (
            <p className="text-xs text-[#5A5751]" data-testid="squares-no-lessons">
              This course has no lesson yet. Its page says what is planned.
            </p>
          ) : (
            <ol className="grid gap-1" aria-label={`${titleOf(course)} lessons`} data-testid="squares-lessons">
              {shown.map((m, i) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onOpenLesson && onOpenLesson(course.key, m.id)}
                    className={`w-full min-h-[44px] flex items-center gap-2 text-left px-2 py-1 border bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815] ${FOCUS}`}
                    data-testid={`square-lesson-${m.id}`}
                  >
                    <span className="text-[0.625rem] text-[#B85838] font-semibold min-w-[1.75rem]">{first + i + 1}</span>
                    <span className="text-[0.75rem] leading-snug" style={SERIF}>
                      {m.title || m.id}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-between gap-2 mt-2" data-read-skip data-testid="squares-pager">
              <button type="button" disabled={at === 0} onClick={() => setPage(at - 1)} className={`${CRUMB} disabled:opacity-40`} data-testid="squares-prev">
                ← Earlier
              </button>
              <span className="text-[0.6875rem] text-[#5A5751]" role="status" data-testid="squares-range">
                {first + 1}–{Math.min(lessons.length, first + LESSONS_PAGE)} of {lessons.length}
              </span>
              <button
                type="button"
                disabled={at >= pages - 1}
                onClick={() => setPage(at + 1)}
                className={`${CRUMB} disabled:opacity-40`}
                data-testid="squares-next"
              >
                Later →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
