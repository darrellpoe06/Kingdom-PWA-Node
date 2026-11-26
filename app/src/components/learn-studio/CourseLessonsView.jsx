// =============================================================================
// CourseLessonsView — one course's lessons as Pictures or as a List, in any order
// =============================================================================
// Darrell 2026-11-25, on a course page (Made in Time, 18 lessons, the picture
// grid): "Is there a list view also?... so we can choose chronological or this
// look." The Learn home already has the list (LessonsInOrder, DR-1661); a course
// page had only the pictures. This gives the course page the same choice: a
// Pictures | List switch and the same four orders, In order first. The choice is
// the reader's own, remembered on this device; the lessons, their titles and
// their numbers are exactly the course's (nothing is filtered or renamed).
// =============================================================================
import React, { useMemo, useState } from 'react';
import { ordersForCourse } from './LessonsInOrder.jsx';
import { wantsSections, sectionLessons, divisionOf, LESSON_DIVISIONS } from '../../lib/lesson-sections.js';
import { courseCompleteness, completenessLine } from '../../lib/lesson-completeness.js';
import { recentUsed } from '../../lib/ux-signals.js';
import { LessonProgressFor } from '../LessonProgressBar.jsx';

const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
export const COURSE_VIEW_KEY = 'poe-learn-course-view';
export const COURSE_VIEWS = Object.freeze([
  { key: 'pictures', label: 'Pictures' },
  { key: 'list', label: 'List' },
]);

function readView() {
  try {
    return window.localStorage.getItem(COURSE_VIEW_KEY) === 'list' ? 'list' : 'pictures';
  } catch {
    return 'pictures';
  }
}

const titleOf = (x) => String((x.p && x.p.displayTitle) || (x.lesson && x.lesson.title) || '');

/** The course's items in the chosen order; each keeps its own place in the course as `n`. Pure. */
export function orderCourseItems(items, order = 'order') {
  const rows = (Array.isArray(items) ? items : []).map((x, i) => ({ ...x, n: (x.p && x.p.number) || i + 1 }));
  if (order === 'newest') return rows.reverse();
  if (order === 'divisions') {
    const rank = new Map(LESSON_DIVISIONS.map((d, i) => [d.key, i]));
    const r = (x) => (rank.has(divisionOf(x.lesson).key) ? rank.get(divisionOf(x.lesson).key) : rank.size);
    return rows
      .map((x, i) => [x, i])
      .sort((a, b) => r(a[0]) - r(b[0]) || a[1] - b[1])
      .map(([x]) => x);
  }
  const byTitle = (a, b) => titleOf(a).localeCompare(titleOf(b), undefined, { sensitivity: 'base', numeric: true });
  if (order === 'az') return rows.sort(byTitle);
  if (order === 'za') return rows.sort((a, b) => byTitle(b, a));
  return rows;
}

/** renderList(order, partIds), when given, draws the List look itself (DR-1662: the compact-thumbnail list). */
/**
 * EVERY OPTION THE CLASSIC COURSE PAGE HAS (Darrell 2026-11-26, sending the classic Living Lessons
 * page: "All options?!!!"): the course's own promise and audience, the completeness line, the parts
 * of the course by the Word's divisions as one-tap chips, Recently opened, and every order including
 * the Word's divisions -- from the same libraries the classic page reads.
 */
export default function CourseLessonsView({ title, items, onOpen, renderPictures, renderList = null, course = null, onResume = null }) {
  const schedule = useMemo(() => (Array.isArray(items) ? items.map((x) => x.lesson) : []), [items]);
  const sections = useMemo(() => (wantsSections(schedule) ? sectionLessons(schedule) : []), [schedule]);
  const [part, setPart] = useState('all');
  const partIds = useMemo(() => {
    const sec = sections.find((x) => x.key === part);
    return sec ? new Set(sec.lessons.map((m) => m.id)) : null;
  }, [sections, part]);
  const recent = useMemo(() => {
    const byId = new Map((items || []).map((x) => [x.lesson.id, x]));
    const ids = (() => {
      try {
        return recentUsed(12);
      } catch {
        return [];
      }
    })();
    return ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .slice(0, 3);
  }, [items]);
  const meta = (course && course.meta) || {};
  const complete = useMemo(() => {
    try {
      return course ? completenessLine(courseCompleteness({ key: course.key, meta: course.meta, schedule })) : '';
    } catch {
      return '';
    }
  }, [course, schedule]);
  const [view, setView] = useState(readView);
  const [order, setOrder] = useState('order');
  const rows = useMemo(() => orderCourseItems(items, order).filter((x) => !partIds || partIds.has(x.lesson.id)), [items, order, partIds]);
  const pick = (v) => {
    setView(v);
    try {
      window.localStorage.setItem(COURSE_VIEW_KEY, v);
    } catch {
      /* no storage: the choice holds for this visit */
    }
  };
  return (
    <div data-testid="course-lessons-view" data-view={view}>
      {(meta.tagline || meta.audience || complete) && (
        <header className="ls-course-head" data-testid="course-view-head">
          {meta.tagline && <p className="ls-course-tagline">{meta.tagline}</p>}
          {(meta.audience || meta.format) && (
            <p className="ls-note">
              {meta.audience ? `For ${meta.audience}. ` : ''}
              {meta.format ? `${meta.format}.` : ''}
            </p>
          )}
          {complete && <p className="ls-course-complete">{complete}</p>}
        </header>
      )}
      {sections.length > 1 && (
        <div className="ls-depts ls-course-parts" role="group" aria-label="Show part of this course" data-testid="course-view-parts">
          {[{ key: 'all', label: 'All lessons', n: schedule.length }, ...sections.map((x) => ({ key: x.key, label: x.label, n: x.lessons.length }))].map(
            (x) => (
              <button
                key={x.key}
                type="button"
                aria-pressed={part === x.key}
                className={`ls-chip ls-chip--dept ${part === x.key ? 'is-on' : ''} ${RING}`}
                onClick={() => setPart(x.key)}
                data-testid={`course-part-${x.key}`}
              >
                {x.label} · {x.n}
              </button>
            )
          )}
        </div>
      )}
      {recent.length > 0 && (
        <div className="ls-recent" data-testid="course-view-recent">
          <span className="ls-mini-kicker">Recently opened</span>
          <div className="ls-mini-list">
            {recent.map((x) => (
              <button key={x.lesson.id} type="button" className={`ls-inorder-row ${RING}`} onClick={() => (onResume || onOpen)(x)}>
                <span className="ls-inorder-t">
                  {titleOf(x)}
                  <LessonProgressFor courseKey={x.p && x.p.courseKey} lessonId={x.lesson.id} look="studio" className="ls-progress--inline" />
                </span>
                <span className="ls-inorder-go" aria-hidden="true">
                  ▶
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="ls-inorder-picks ls-courseview-picks">
        <div role="group" aria-label="Show lessons as" className="ls-courseview-switch">
          {COURSE_VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              aria-pressed={view === v.key}
              className={`ls-courseview-btn ${RING}`}
              onClick={() => pick(v.key)}
              data-testid={`course-view-${v.key}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <label>
          <span className="sr-only">Order</span>
          <select className={RING} value={order} onChange={(e) => setOrder(e.target.value)} data-testid="course-view-order">
            {ordersForCourse(course || { schedule }).map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {view === 'pictures' ? (
        renderPictures(rows)
      ) : renderList ? (
        renderList(order, partIds)
      ) : (
        <section className="ls-inorder" aria-label={`${title}, as a list`}>
          <header className="ls-inorder-head">
            <h2>{title}</h2>
            <span className="ls-note">{rows.length} lessons</span>
          </header>
          {rows.length === 0 ? (
            <p className="ls-empty" role="status">
              This course has no lesson to list yet.
            </p>
          ) : (
            <ol className="ls-inorder-list" data-testid="course-list">
              {rows.map((x) => (
                <li key={x.lesson.id}>
                  <button type="button" className={`ls-inorder-row ${RING}`} onClick={() => onOpen(x)} data-testid={`course-row-${x.lesson.id}`}>
                    <span className="ls-inorder-n">{x.n}</span>
                    <span className="ls-inorder-t">
                      {titleOf(x)}
                      <LessonProgressFor courseKey={x.p && x.p.courseKey} lessonId={x.lesson.id} look="studio" className="ls-progress--inline" />
                    </span>
                    <span className="ls-inorder-go" aria-hidden="true">
                      ▶
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
