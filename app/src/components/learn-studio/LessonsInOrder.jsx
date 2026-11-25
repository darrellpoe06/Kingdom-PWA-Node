// =============================================================================
// LessonsInOrder — the lessons themselves, first on the page, in order (DR-1661)
// =============================================================================
// Darrell 2026-11-26, on the Learn home: "Fix it!!!!!! Where is the
// lessons!!!!!!!!!!!!!!!!" The banner and the hero filled the phone; no lesson
// was on screen without scrolling. And 2026-11-25: "Show lessons in
// chronological order as the default however let them be sorted in all
// options... I want to read these in order especially the living lessons."
//
// So the first thing under the search box is the list: a course (Living
// Lessons first when it is mounted), an order (In order by default), and the
// lessons as compact rows, lesson 1 on top. Every lesson of the course is
// reachable from here; a row opens the same cover a card opens.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { presentLesson } from '../../lib/learn-presentation/presentation.js';

const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
export const FIRST_ROWS = 5;
export const MORE_ROWS = 20;
export const ORDERS = Object.freeze([
  { key: 'order', label: 'In order' },
  { key: 'newest', label: 'Newest first' },
  { key: 'az', label: 'A to Z' },
  { key: 'za', label: 'Z to A' },
]);

const keyOf = (c) => (c && (c.key || (c.meta && c.meta.key))) || '';
const titleOf = (c) => (c && c.meta && c.meta.title) || keyOf(c);

/** The course's lessons in the chosen order, numbered by their place in the course. Pure. */
export function orderedLessons(course, index, { order = 'order', preview = false } = {}) {
  const rows = ((course && course.schedule) || [])
    .filter((l) => l && l.id)
    .map((l, i) => ({ lesson: l, course, n: i + 1, p: presentLesson(l, course, index, { preview }) }))
    .filter((x) => x.p);
  if (order === 'newest') return rows.reverse();
  const t = (x) => String(x.lesson.title || x.p.displayTitle || '');
  const byTitle = (a, b) => t(a).localeCompare(t(b), undefined, { sensitivity: 'base', numeric: true });
  if (order === 'az') return rows.sort(byTitle);
  if (order === 'za') return rows.sort((a, b) => byTitle(b, a));
  return rows;
}

export default function LessonsInOrder({ courses, index, preview = false, onOpen }) {
  const list = useMemo(() => (Array.isArray(courses) ? courses : []).filter((c) => keyOf(c) && (c.schedule || []).length), [courses]);
  const first = useMemo(
    () => (list.find((c) => keyOf(c) === 'living-lessons') || list[0] ? keyOf(list.find((c) => keyOf(c) === 'living-lessons') || list[0]) : ''),
    [list]
  );
  const [picked, setPicked] = useState('');
  const [order, setOrder] = useState('order');
  const [shown, setShown] = useState(FIRST_ROWS);
  const courseKey = picked || first;
  const course = list.find((c) => keyOf(c) === courseKey) || null;
  const rows = useMemo(() => orderedLessons(course, index, { order, preview }), [course, index, order, preview]);
  if (!course) return null;
  return (
    <section className="ls-inorder" aria-labelledby="ls-inorder-h" data-testid="lessons-in-order">
      <header className="ls-inorder-head">
        <h2 id="ls-inorder-h">Lessons</h2>
        <span className="ls-note">{rows.length} lessons</span>
      </header>
      <div className="ls-inorder-picks">
        <label>
          <span className="sr-only">Course</span>
          <select
            className={RING}
            value={courseKey}
            onChange={(e) => {
              setPicked(e.target.value);
              setShown(FIRST_ROWS);
            }}
            data-testid="inorder-course"
          >
            {list.map((c) => (
              <option key={keyOf(c)} value={keyOf(c)}>
                {titleOf(c)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Order</span>
          <select
            className={RING}
            value={order}
            onChange={(e) => {
              setOrder(e.target.value);
              setShown(FIRST_ROWS);
            }}
            data-testid="inorder-order"
          >
            {ORDERS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ol className="ls-inorder-list">
        {rows.slice(0, shown).map((x) => (
          <li key={x.lesson.id}>
            <button type="button" className={`ls-inorder-row ${RING}`} onClick={() => onOpen(x)} data-testid={`inorder-${x.lesson.id}`}>
              <span className="ls-inorder-n">{x.n}</span>
              <span className="ls-inorder-t">{x.lesson.title || x.p.displayTitle}</span>
              <span className="ls-inorder-go" aria-hidden="true">
                ▶
              </span>
            </button>
          </li>
        ))}
      </ol>
      {shown < rows.length && (
        <div className="ls-inorder-more">
          <button type="button" className={`ls-btn ls-btn--outline ${RING}`} onClick={() => setShown((n) => n + MORE_ROWS)} data-testid="inorder-more">
            Show {Math.min(MORE_ROWS, rows.length - shown)} more
          </button>
          <button type="button" className={`ls-btn ls-btn--outline ${RING}`} onClick={() => setShown(rows.length)} data-testid="inorder-all">
            Show all {rows.length}
          </button>
        </div>
      )}
    </section>
  );
}
