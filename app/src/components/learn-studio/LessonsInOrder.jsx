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
import { READING_VERSIONS } from '../../lib/learn-organize.js';

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

const NO_DONE = new Set();

// A choice the reader made stays made on this device (a convenience only; the
// page renders the same without storage).
export function remembered(key, fallback, allowed) {
  try {
    const v = window.localStorage.getItem(`ls-view:${key}`);
    return allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
export function remember(key, value) {
  try {
    window.localStorage.setItem(`ls-view:${key}`, value);
  } catch {
    /* no storage */
  }
}
export const LESSON_SHOWS = Object.freeze([
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Not read' },
  { key: 'read', label: 'Read' },
]);
export const VIEWS = Object.freeze([
  { key: 'list', label: 'List' },
  { key: 'cards', label: 'Cards' },
]);

/** A row of pressed/unpressed buttons: one tap, the choice is visible. */
export function Toggle({ label, options, value, onChange, testid }) {
  return (
    <div className="ls-toggle" role="group" aria-label={label} data-testid={testid}>
      <span className="ls-toggle-label">{label}</span>
      {options.map((o) => (
        <button key={o.key} type="button" aria-pressed={value === o.key} className={`ls-toggle-btn ${RING}`} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** The smallest thumbnail: the lesson's approved cover, or its number on a panel. Never blank. */
export function MiniThumb({ image, label }) {
  return (
    <span className="ls-mini-thumb" aria-hidden="true">
      {image && image.src ? <img src={image.src} alt="" loading="lazy" decoding="async" /> : <span className="ls-mini-code">{label}</span>}
    </span>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** "July 2026" from a lesson's recorded day ('YYYY-MM-DD'), or ''. Pure. */
export function monthOf(lesson) {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(String((lesson && lesson.added) || ''));
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
}

/**
 * props: courses, index, preview, onOpen(x), done (Set of read lesson ids),
 * fixedCourse (a course key: the course page -- no course picker, every row shown).
 */
export default function LessonsInOrder({ courses, index, preview = false, onOpen, done = NO_DONE, fixedCourse = null, markFor = null, onVersion = null }) {
  const list = useMemo(() => (Array.isArray(courses) ? courses : []).filter((c) => keyOf(c) && (c.schedule || []).length), [courses]);
  const first = useMemo(
    () => (list.find((c) => keyOf(c) === 'living-lessons') || list[0] ? keyOf(list.find((c) => keyOf(c) === 'living-lessons') || list[0]) : ''),
    [list]
  );
  const [picked, setPicked] = useState('');
  const [order, setOrder] = useState('order');
  const [shown, setShown] = useState(fixedCourse ? Infinity : FIRST_ROWS);
  const courseKey = fixedCourse || picked || first;
  const course = list.find((c) => keyOf(c) === courseKey) || null;
  const [show, setShowState] = useState(() =>
    remembered(
      'lesson-show',
      'all',
      LESSON_SHOWS.map((o) => o.key)
    )
  );
  const [view, setViewState] = useState(() =>
    remembered(
      'lesson-view',
      'list',
      VIEWS.map((o) => o.key)
    )
  );
  const setShow = (v) => {
    setShowState(v);
    remember('lesson-show', v);
  };
  const setView = (v) => {
    setViewState(v);
    remember('lesson-view', v);
  };
  const ordered = useMemo(() => orderedLessons(course, index, { order, preview }), [course, index, order, preview]);
  const rows = useMemo(
    () => (show === 'read' ? ordered.filter((x) => done.has(x.lesson.id)) : show === 'unread' ? ordered.filter((x) => !done.has(x.lesson.id)) : ordered),
    [ordered, show, done]
  );
  const readHere = useMemo(() => ordered.filter((x) => done.has(x.lesson.id)).length, [ordered, done]);
  if (!course) return null;
  return (
    <section className="ls-inorder" aria-labelledby="ls-inorder-h" data-testid="lessons-in-order">
      <header className="ls-inorder-head">
        <h2 id="ls-inorder-h">{fixedCourse ? titleOf(course) : 'Lessons'}</h2>
        <span className="ls-note">
          {ordered.length} lessons{readHere ? ` · ${readHere} read` : ''}
        </span>
      </header>
      <div className="ls-inorder-picks">
        {!fixedCourse && (
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
        )}
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
      <div className="ls-controls">
        <Toggle label="Show" options={LESSON_SHOWS} value={show} onChange={setShow} testid="inorder-show" />
        <Toggle label="View" options={VIEWS} value={view} onChange={setView} testid="inorder-view" />
      </div>
      {!rows.length && (
        <p className="ls-empty" role="status" data-testid="inorder-none">
          {show === 'read' ? 'No lesson of this course is on your record yet.' : 'Every lesson of this course is read.'} Choose Show: All to see every lesson.
        </p>
      )}
      <ol className={`ls-inorder-list ls-inorder-list--${view}`}>
        {rows.slice(0, shown).map((x, i, arr) => (
          <React.Fragment key={x.lesson.id}>
            {(order === 'order' || order === 'newest') && monthOf(x.lesson) && monthOf(x.lesson) !== monthOf(arr[i - 1] && arr[i - 1].lesson) && (
              <li className="ls-month" aria-hidden="true">
                {monthOf(x.lesson)}
              </li>
            )}
            <li>
              <button type="button" className={`ls-inorder-row ${RING}`} onClick={() => onOpen(x)} data-testid={`inorder-${x.lesson.id}`}>
                <MiniThumb image={x.p.image} label={x.n} />
                <span className="ls-inorder-n">{x.n}</span>
                <span className="ls-inorder-t">
                  {x.lesson.title || x.p.displayTitle}
                  {(() => {
                    const mark = markFor ? markFor(x.lesson, courseKey) : done.has(x.lesson.id) ? '✓ READ' : '';
                    return mark ? <span className="ls-read-mark">{mark}</span> : null;
                  })()}
                </span>
                <span className="ls-inorder-go" aria-hidden="true">
                  ▶
                </span>
              </button>
              {onVersion && x.p.versions && x.p.versions.length > 1 && (
                <div className="ls-ages-mini" role="group" aria-label={`Read ${x.lesson.title || x.p.displayTitle} for an age`}>
                  {x.p.versions.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`ls-age-chip ${RING}`}
                      onClick={() => onVersion(x, v)}
                      data-testid={`inorder-age-${x.lesson.id}-${v}`}
                    >
                      {(READING_VERSIONS.find((b) => b.id === v) || { label: v }).label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          </React.Fragment>
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
