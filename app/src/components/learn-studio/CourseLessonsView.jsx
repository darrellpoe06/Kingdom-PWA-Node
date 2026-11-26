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
import { ORDERS } from './LessonsInOrder.jsx';

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
  const byTitle = (a, b) => titleOf(a).localeCompare(titleOf(b), undefined, { sensitivity: 'base', numeric: true });
  if (order === 'az') return rows.sort(byTitle);
  if (order === 'za') return rows.sort((a, b) => byTitle(b, a));
  return rows;
}

/** renderList(order), when given, draws the List look itself (DR-1662: the compact-thumbnail list). */
export default function CourseLessonsView({ title, items, onOpen, renderPictures, renderList = null }) {
  const [view, setView] = useState(readView);
  const [order, setOrder] = useState('order');
  const rows = useMemo(() => orderCourseItems(items, order), [items, order]);
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
            {ORDERS.map((o) => (
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
        renderList(order)
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
                    <span className="ls-inorder-t">{titleOf(x)}</span>
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
