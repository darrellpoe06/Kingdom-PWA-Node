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
import { LessonProgressFor } from '../LessonProgressBar.jsx';
import { READING_VERSIONS } from '../../lib/learn-organize.js';
import { wantsSections, divisionOf, LESSON_DIVISIONS } from '../../lib/lesson-sections.js';

const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
export const FIRST_ROWS = 5;
// "By the Word's divisions", offered where the classic page offers it (a course long enough to shelve).
export const DIVISIONS_ORDER = Object.freeze({ key: 'divisions', label: 'By the Word’s divisions' });
const DIVISION_RANK = new Map(LESSON_DIVISIONS.map((d, i) => [d.key, i]));
/** The orders a course can honestly offer: the four, plus the Word's divisions for a long course. Pure. */
export function ordersForCourse(course) {
  return wantsSections((course && course.schedule) || []) ? [...ORDERS, DIVISIONS_ORDER] : [...ORDERS];
}
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
  if (order === 'divisions') {
    const rank = (x) => {
      const r = DIVISION_RANK.get(divisionOf(x.lesson).key);
      return r == null ? DIVISION_RANK.size : r;
    };
    return rows
      .map((x, i) => [x, i])
      .sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1])
      .map(([x]) => x);
  }
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
// Pictures first (Darrell 2026-11-26: "by default it should be condensed... we should see images and
// titles... and the full images with options for pictures or list"); List is the compact rows.
export const VIEWS = Object.freeze([
  { key: 'pictures', label: 'Pictures' },
  { key: 'list', label: 'List' },
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
export default function LessonsInOrder({
  courses,
  index,
  preview = false,
  onOpen,
  done = NO_DONE,
  fixedCourse = null,
  markFor = null,
  onVersion = null,
  order: orderProp = null,
  listTestId = null,
  renderPictures = null, // (rows, { grid }) => the full-image cards; without it the list is the only look
  onlyIds = null, // a Set: show only these lessons (a part of the course chosen above)
  onListen = null, // (x) => play the lesson aloud (the classic ▶ Play)
}) {
  // One row per course key: a catalog that mounts a course twice must not list it twice (or repeat a React key).
  const list = useMemo(() => {
    const seen = new Set();
    return (Array.isArray(courses) ? courses : []).filter((c) => keyOf(c) && (c.schedule || []).length && !seen.has(keyOf(c)) && seen.add(keyOf(c)));
  }, [courses]);
  const first = useMemo(
    () => (list.find((c) => keyOf(c) === 'living-lessons') || list[0] ? keyOf(list.find((c) => keyOf(c) === 'living-lessons') || list[0]) : ''),
    [list]
  );
  const [picked, setPicked] = useState('');
  const [orderPick, setOrder] = useState('order');
  // A parent that owns the order (the course page's own picker) hides this one: one control, never two.
  const order = orderProp || orderPick;
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
      'pictures',
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
  const rows = useMemo(() => {
    const inPart = onlyIds ? ordered.filter((x) => onlyIds.has(x.lesson.id)) : ordered;
    return show === 'read' ? inPart.filter((x) => done.has(x.lesson.id)) : show === 'unread' ? inPart.filter((x) => !done.has(x.lesson.id)) : inPart;
  }, [ordered, show, done, onlyIds]);
  // FOLD A MONTH (or a division), as the classic list does: tap its heading; Fold all folds every one.
  const [folded, setFolded] = useState(() => new Set());
  const groupOf = (x) => (order === 'divisions' ? divisionOf(x.lesson).label : order === 'order' || order === 'newest' ? monthOf(x.lesson) : '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const groups = useMemo(() => [...new Set(rows.map(groupOf).filter(Boolean))], [rows, order]);
  const toggleFold = (g) =>
    setFolded((f) => {
      const n = new Set(f);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });
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
        {!orderProp && (
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
              {ordersForCourse(course).map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="ls-controls">
        <Toggle label="Show" options={LESSON_SHOWS} value={show} onChange={setShow} testid="inorder-show" />
        {renderPictures && <Toggle label="View" options={VIEWS} value={view} onChange={setView} testid="inorder-view" />}
      </div>
      {groups.length > 1 && (
        <button
          type="button"
          className={`ls-btn ls-btn--outline ls-fold-all ${RING}`}
          onClick={() => setFolded(folded.size === groups.length ? new Set() : new Set(groups))}
          data-testid="inorder-fold-all"
        >
          {folded.size === groups.length ? `Unfold all ${groups.length}` : `Fold all ${groups.length}`}
        </button>
      )}
      {!rows.length && (
        <p className="ls-empty" role="status" data-testid="inorder-none">
          {show === 'read' ? 'No lesson of this course is on your record yet.' : 'Every lesson of this course is read.'} Choose Show: All to see every lesson.
        </p>
      )}
      {renderPictures && view === 'pictures' ? (
        <div className="ls-inorder-pictures" data-testid="inorder-pictures">
          {renderPictures(rows.slice(0, shown), { grid: shown > FIRST_ROWS })}
        </div>
      ) : (
        <ol className="ls-inorder-list ls-inorder-list--list" data-testid={listTestId || undefined}>
          {rows.slice(0, shown).map((x, i, arr) => (
            <React.Fragment key={x.lesson.id}>
              {groupOf(x) && groupOf(x) !== (arr[i - 1] ? groupOf(arr[i - 1]) : '') && (
                <li className="ls-month">
                  <button
                    type="button"
                    className={`ls-month-btn ${RING}`}
                    aria-expanded={!folded.has(groupOf(x))}
                    onClick={() => toggleFold(groupOf(x))}
                    data-testid="inorder-group"
                  >
                    {folded.has(groupOf(x)) ? '▸' : '▾'} {groupOf(x)} · {arr.filter((y) => groupOf(y) === groupOf(x)).length}
                  </button>
                </li>
              )}
              {!folded.has(groupOf(x)) && (
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
                      <LessonProgressFor courseKey={x.p.courseKey || courseKey} lessonId={x.lesson.id} look="studio" className="ls-progress--inline" />
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
                  {onListen && (
                    <button
                      type="button"
                      className={`ls-age-chip ls-play-chip ${RING}`}
                      onClick={() => onListen(x)}
                      aria-label={`Play ${x.lesson.title || x.p.displayTitle} aloud`}
                      data-testid={`inorder-play-${x.lesson.id}`}
                    >
                      ▶ Play
                    </button>
                  )}
                </li>
              )}
            </React.Fragment>
          ))}
        </ol>
      )}
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
