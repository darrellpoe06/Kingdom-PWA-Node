// =============================================================================
// LearnDashboard — the classic Learn functions, in the new look (DR-1662)
// =============================================================================
// Darrell 2026-11-26, from the classic Learn page: "We need all these functions
// to be in the new view without loosing the functions"; of a plain first pass:
// "Looks nice however we need the vibrant views and thumbnails"; and "the
// smallest thumbnails with the titles showing so it will be very inviting".
//
// Every number here is the SAME computation the classic page reads
// (lib/learn-organize.js: libraryStanding, lowHangingFruit, courseStanding,
// courseSortsFor, organizeCourses, learnDepartments) over the SAME places and
// progress, so the two views never disagree. Every picture is an approved
// lesson cover already shipped (courseCovers); a course without one shows its
// own code on a panel -- never a blank, never new art.
// =============================================================================
import React, { useMemo, useState } from 'react';
import {
  libraryStanding,
  lowHangingFruit,
  courseStanding,
  courseStandingLabel,
  courseLessonCount,
  courseSortsFor,
  organizeCourses,
  learnDepartments,
  DEFAULT_COURSE_SORT,
} from '../../lib/learn-organize.js';
import { courseCovers } from '../../lib/institute-studio.js';
import { MiniThumb, Toggle, VIEWS, remembered, remember } from './LessonsInOrder.jsx';

const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const keyOf = (c) => (c && (c.key || (c.meta && c.meta.key))) || '';
const titleOf = (c) => (c && c.meta && c.meta.title) || keyOf(c);
const lessonsWord = (n) => `${n} ${n === 1 ? 'lesson' : 'lessons'}`;
export const COURSE_ROWS_FIRST = 12;
export const COURSE_SHOWS = Object.freeze([
  { key: 'all', label: 'All' },
  { key: 'not-started', label: 'Not started' },
  { key: 'in-progress', label: 'Begun' },
  { key: 'completed', label: 'Finished' },
]);
export const LEARN_TOOLS = Object.freeze(['continue', 'latest', 'browse', 'find', 'record', 'downloads']);

/** Course covers from the presentation records the page already holds. Pure. */
export function coversFor(index, preview) {
  return courseCovers(index ? [...index.values()] : [], { preview });
}

/** One course as a compact row: small cover, full title, count, where you stand, a gold meter. */
export function CourseRow({ course, cover, ctx, onOpen, kicker = null, note = null, code = null }) {
  const total = courseLessonCount(course);
  const s = courseStanding(course, ctx);
  const pct = total ? Math.floor((s.done / total) * 100) : 0;
  const c = code || course.code || '';
  return (
    <button type="button" className={`ls-mini ${RING}`} onClick={() => onOpen(keyOf(course))} data-testid={`ls-course-${keyOf(course)}`}>
      <MiniThumb image={cover} label={c || titleOf(course).slice(0, 2)} />
      <span className="ls-mini-body">
        {kicker && <span className="ls-mini-kicker">{kicker}</span>}
        <span className="ls-mini-title">{titleOf(course)}</span>
        <span className="ls-mini-meta">
          {c ? `${c} · ` : ''}
          {lessonsWord(total)} · {note || courseStandingLabel(course, ctx)}
          {s.state === 'completed' ? ' ✓' : ''}
        </span>
        <span className="ls-meter" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </span>
      </span>
    </button>
  );
}

/**
 * props: courses, index, preview, ctx { places, progress }, onOpenCourse(key),
 * onTool(area) — Continue / Latest / Browse / Find / Record / Downloads open
 * the full tools below on that area — continueCount, recordCount.
 */
export default function LearnDashboard({ courses, index, preview = false, ctx, onOpenCourse, onTool, continueCount = 0, recordCount = 0 }) {
  const covers = useMemo(() => coversFor(index, preview), [index, preview]);
  const all = useMemo(() => libraryStanding(courses, ctx), [courses, ctx]);
  const fruit = useMemo(() => lowHangingFruit(courses, ctx), [courses, ctx]);
  const departments = useMemo(() => learnDepartments(courses), [courses]);
  const sorts = useMemo(() => courseSortsFor(courses, ctx).filter((o) => o.key !== 'latest'), [courses, ctx]);
  const [dept, setDept] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [sort, setSortState] = useState(() =>
    remembered(
      'course-sort',
      DEFAULT_COURSE_SORT,
      sorts.map((o) => o.key)
    )
  );
  const [show, setShowState] = useState(() =>
    remembered(
      'course-show',
      'all',
      COURSE_SHOWS.map((o) => o.key)
    )
  );
  const [view, setViewState] = useState(() =>
    remembered(
      'course-view',
      'pictures',
      VIEWS.map((o) => o.key)
    )
  );
  const setSort = (v) => {
    setSortState(v);
    remember('course-sort', v);
  };
  const setShow = (v) => {
    setShowState(v);
    setShowAll(false);
    remember('course-show', v);
  };
  const setView = (v) => {
    setViewState(v);
    remember('course-view', v);
  };
  const pool = useMemo(() => {
    const d = departments.find((x) => x.id === dept);
    return d ? d.courses : courses;
  }, [departments, dept, courses]);
  // organizeCourses gives each course its department code (e.g. LL-101), the same one the classic picker shows.
  const ordered = useMemo(
    () =>
      organizeCourses(pool, sort, ctx)
        .flatMap((g) => g.courses)
        .filter((c) => show === 'all' || courseStanding(c, ctx).state === show)
        .filter((c, i, all) => all.findIndex((y) => keyOf(y) === keyOf(c)) === i), // one card per course key
    [pool, sort, ctx, show]
  );
  const shown = showAll ? ordered : ordered.slice(0, COURSE_ROWS_FIRST);
  if (!all.courses) {
    return (
      <p className="ls-empty" role="status" data-testid="learn-dashboard-empty">
        No course is mounted yet, so there is nothing to count. Courses appear here as soon as the catalog loads.
      </p>
    );
  }
  const labels = {
    continue: continueCount ? `Continue · ${continueCount}` : 'Continue',
    latest: 'Latest',
    browse: 'Browse',
    find: 'Find by verse',
    record: recordCount ? `Record · ${recordCount}` : 'Record',
    downloads: 'Downloads',
  };
  return (
    <div className="ls-dash" data-testid="learn-dashboard">
      <section className="ls-row ls-standing" data-testid="ls-standing">
        <header className="ls-row-head">
          <h2>
            <span className="ls-ico ls-ico--star" aria-hidden="true" />
            Your Learning
          </h2>
          <span className="ls-note">{all.pct}% read</span>
        </header>
        <div className="ls-stats">
          <div className="ls-stat">
            <strong>{all.notStarted}</strong>
            <span>not started</span>
          </div>
          <div className="ls-stat">
            <strong>{all.inProgress}</strong>
            <span>begun</span>
          </div>
          <div className="ls-stat">
            <strong>{all.completed}</strong>
            <span>finished</span>
          </div>
          <div className="ls-stat">
            <strong>{all.lessonsRead}</strong>
            <span>of {lessonsWord(all.lessons)} read</span>
          </div>
        </div>
        <div
          className="ls-meter ls-meter--big"
          role="progressbar"
          aria-label="Lessons read, of every lesson in these courses"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={all.pct}
        >
          <span style={{ width: `${all.pct}%` }} />
        </div>
        <div className="ls-tools-strip" role="group" aria-label="Learn tools">
          {LEARN_TOOLS.map((id) => (
            <button key={id} type="button" className={`ls-chip ${RING}`} onClick={() => onTool && onTool(id)} data-testid={`ls-tool-${id}`}>
              {labels[id]}
            </button>
          ))}
        </div>
        {(fruit.nearest || fruit.quickStart) && (
          <div className="ls-mini-list ls-mini-list--two" data-testid="ls-fruit">
            {fruit.nearest && (
              <CourseRow
                course={fruit.nearest.course}
                cover={covers.get(keyOf(fruit.nearest.course))}
                ctx={ctx}
                onOpen={onOpenCourse}
                kicker="Closest to finished"
                note={`${lessonsWord(fruit.nearest.left)} left`}
              />
            )}
            {fruit.quickStart && (
              <CourseRow
                course={fruit.quickStart.course}
                cover={covers.get(keyOf(fruit.quickStart.course))}
                ctx={ctx}
                onOpen={onOpenCourse}
                kicker="Not started, and short"
                note="nothing on your record yet"
              />
            )}
          </div>
        )}
      </section>

      <section className="ls-row" data-testid="ls-courses">
        <header className="ls-row-head">
          <h2>
            <span className="ls-ico ls-ico--play" aria-hidden="true" />
            Courses
          </h2>
          <span className="ls-note">
            {pool.length} of {courses.length}
          </span>
        </header>
        <div className="ls-depts" role="group" aria-label="Departments">
          {[{ id: 'all', label: 'All', n: courses.length }, ...departments.map((d) => ({ id: d.id, label: d.label, n: d.courses.length }))].map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={dept === d.id}
              className={`ls-chip ls-chip--dept ${dept === d.id ? 'is-on' : ''} ${RING}`}
              onClick={() => {
                setDept(d.id);
                setShowAll(false);
              }}
              data-testid={`ls-dept-${d.id}`}
            >
              {d.label} · {d.n}
            </button>
          ))}
        </div>
        <div className="ls-controls">
          <label className="ls-sort">
            <span>Sort courses</span>
            <select className={RING} value={sort} onChange={(e) => setSort(e.target.value)} data-testid="ls-course-sort">
              {sorts.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <Toggle label="Show" options={COURSE_SHOWS} value={show} onChange={setShow} testid="ls-course-show" />
          <Toggle label="View" options={VIEWS} value={view} onChange={setView} testid="ls-course-view" />
        </div>
        {!ordered.length && (
          <p className="ls-empty" role="status" data-testid="ls-courses-none">
            No course here is {(COURSE_SHOWS.find((o) => o.key === show) || {}).label.toLowerCase()}. Choose Show: All to see every course.
          </p>
        )}
        {/* Pictures: a condensed shelf of course tiles to swipe; Show all lays every one out. */}
        <div className={`ls-mini-list ls-mini-list--${view}${view === 'pictures' && !showAll ? ' ls-mini-list--shelf' : ''}`}>
          {shown.map((c) => (
            <CourseRow key={keyOf(c)} course={c} cover={covers.get(keyOf(c))} ctx={ctx} onOpen={onOpenCourse} />
          ))}
        </div>
        {ordered.length > shown.length && (
          <button type="button" className={`ls-btn ls-btn--outline ls-more ${RING}`} onClick={() => setShowAll(true)} data-testid="ls-courses-all">
            Show all {ordered.length} courses
          </button>
        )}
      </section>
    </div>
  );
}
