// =============================================================================
// LearnStudio — the cinematic doorway in front of Learn (redesign prototype).
// A presentation layer ONLY: every lesson, title, age reading, Scripture, audio
// and quiz is the existing reader's. This component reads the catalog and the
// presentation records (lib/learn-presentation/presentation.js) and hands every
// Read / Listen / age-version action back to the caller (ChurchLearn's own
// openLessonFromList / readVersion), so the reader stays the production path.
//
// Inside an opened lesson the author's COMPLETE ORIGINAL TITLE is shown in full,
// directly under the new display title — visible text, never a tooltip.
// =============================================================================
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useHistoryValue } from '../../lib/nav-history.js';
import {
  studioHome,
  searchPresented,
  presentLesson,
  SHELVES,
  shelfForDepartment,
  interimHeadline,
  findPresentedLesson,
} from '../../lib/learn-presentation/presentation.js';
import { READING_VERSIONS } from '../../lib/learn-organize.js';
import { lessonUrl, lessonSharePayload, lessonDoorFor, shareLink } from '../../lib/lesson-links.js';
import { newShareToken } from '../../lib/lesson-share.js';
import { recordLessonShare, reportShareLanded, pendingShareToken } from '../../lib/lesson-share-record.js';

const versionLabel = (id) => (READING_VERSIONS.find((b) => b.id === id) || { label: id }).label;
// A keyboard user must SEE where they are (ui-standards focus-ring). Gold, never red (red is reserved, DR-0099).
const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
import LessonsInOrder, { MiniThumb, Toggle, VIEWS, remembered, remember } from './LessonsInOrder.jsx';
import { shippedSrcSet } from '../../lib/institute-studio.js';
import { scrollToStudioTools } from '../../lib/learn-studio-bridge.js';
import CourseLessonsView from './CourseLessonsView.jsx';
import { PlaceLookupContext, LessonProgressFor } from '../LessonProgressBar.jsx';
import { placeLookup } from '../../lib/lesson-progress.js';
import './learn-studio.css';

/** 2–3 balanced lines, the same rule the thumbnail compositor uses. */
export function stackLines(text, maxLines = 3) {
  const w = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (w.length <= 2) return w;
  const lines = Math.min(maxLines, w.length <= 4 ? 2 : 3);
  const per = Math.ceil(w.length / lines);
  const out = [];
  for (let i = 0; i < w.length; i += per) out.push(w.slice(i, i + per).join(' '));
  return out;
}

/** White lines, the last line gold over a red brush stroke. */
export function Headline({ text, size = 'card', align = 'left' }) {
  const lines = stackLines(String(text || '').toUpperCase());
  if (!lines.length) return null;
  return (
    <div className={`ls-headline ls-headline--${size} ls-headline--${align}`} aria-hidden="true">
      {lines.map((l, i) => {
        const last = i === lines.length - 1 && lines.length > 1;
        return (
          <span key={i} className={last ? 'ls-hl-line ls-hl-gold' : 'ls-hl-line'}>
            {l}
            {last && <span className="ls-brush" />}
          </span>
        );
      })}
    </div>
  );
}

function Picture({ image, alt, eager = false, sizes = '(max-width: 640px) 90vw, 420px', pendingLabel = 'Picture coming' }) {
  // Never blank: a lesson without a picture still shows its card and says so.
  if (!image || !image.src)
    return (
      <div className="ls-pic ls-pic--empty" role="img" aria-label={pendingLabel}>
        <span>{pendingLabel}</span>
      </div>
    );
  return (
    <picture>
      {image.srcSet && image.srcSet.avif && <source type="image/avif" srcSet={image.srcSet.avif} sizes={sizes} />}
      {/* Only the sizes that really ship (w640, w1280): 826 of 976 records also list w320 and w1920,
          which do not exist, and a big picture picked w1920 and broke (Darrell 2026-11-26). */}
      {image.srcSet && shippedSrcSet(image.srcSet.webp) && <source type="image/webp" srcSet={shippedSrcSet(image.srcSet.webp)} sizes={sizes} />}
      <img
        className="ls-pic"
        src={image.src}
        alt={alt || ''}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={image.lqip ? { backgroundImage: `url(${image.lqip})` } : undefined}
      />
    </picture>
  );
}

/**
 * A lesson's art. Its own picture when it has one; otherwise a TEMPORARY cover
 * built from its department's approved Explore-by-Topic artwork, tinted in the
 * department's color, with the department named. Free: no new picture is made,
 * and the lesson's own cover replaces it the moment its record carries one.
 */
function Art({ p, eager = false, sizes, children }) {
  const covers = React.useContext(CoversContext);
  if (p.image) {
    return (
      <>
        <Picture image={p.image} alt={p.imageAlt} eager={eager} sizes={sizes} />
        {children}
      </>
    );
  }
  const shelf = shelfForDepartment(p.department) || 'none';
  const c = covers[shelf];
  return (
    <div className={`ls-interim ls-interim--${shelf}`} data-interim="true">
      <Picture image={c && c.image} alt="" eager={eager} sizes={sizes} pendingLabel={p.department || 'Learn'} />
      <span className="ls-interim-tint" aria-hidden="true" />
      {p.department && <span className="ls-interim-dept">{p.department}</span>}
      {children}
    </div>
  );
}

function Card({ x, onOpen }) {
  const { p } = x;
  return (
    <button type="button" className={`ls-card ${RING}`} onClick={() => onOpen(x)}>
      <div className="ls-thumb">
        <Art p={p}>
          <Headline text={p.image ? p.thumbHeadline : interimHeadline(p)} />
        </Art>
        {p.duration && <span className="ls-badge">{p.duration}</span>}
        {/* HOW FAR, ON EVERY CARD (DR-1684): read or heard, from this device's own place; nothing measured, no bar. */}
        <LessonProgressFor courseKey={p.courseKey} lessonId={p.lessonId} look="studio" />
      </div>
      <div className="ls-card-title">{p.displayTitle}</div>
      <div className="ls-card-meta">
        {p.courseTitle} • {p.code}
      </div>
    </button>
  );
}

function Row({ icon = 'play', title, note, items, onOpen, onSeeAll, grid = false, view = 'pictures' }) {
  if (!items || !items.length) return null;
  return (
    <section className="ls-row">
      <header className="ls-row-head">
        <h2>
          <span className={`ls-ico ls-ico--${icon}`} aria-hidden="true" />
          {title}
        </h2>
        {note && <span className="ls-note">{note}</span>}
        {onSeeAll && (
          <button type="button" className={`ls-see ${RING}`} onClick={onSeeAll}>
            See All ›
          </button>
        )}
      </header>
      {view === 'list' ? (
        // The compact rows every lesson list offers (Pictures | List, DR-1662): same picture, full title.
        <ol className="ls-inorder-list ls-inorder-list--list">
          {items.map((x) => (
            <li key={`${x.p.courseKey}::${x.p.lessonId}`}>
              <button type="button" className={`ls-inorder-row ${RING}`} onClick={() => onOpen(x)} data-testid={`row-${x.p.lessonId}`}>
                <MiniThumb image={x.p.image} label={x.p.code || ''} />
                <span className="ls-inorder-t">{x.p.displayTitle}</span>
                <span className="ls-inorder-go" aria-hidden="true">
                  ▶
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className={grid ? 'ls-grid ts-grid-collapse' : 'ls-scroller'}>
          {items.map((x) => (
            <Card key={`${x.p.courseKey}::${x.p.lessonId}`} x={x} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}

/** A horizontal swipe of at least this many px, more sideways than up/down, turns the slide. */
export const SWIPE_PX = 40;
/** -1 (back), 1 (forward) or 0 for a touch that moved from (x0, y0) to (x1, y1). Pure. */
export function swipeStep(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}

function Hero({ slides, onOpen, onListen }) {
  const [i, setI] = useState(0);
  // A swipe or a dot restarts the clock, so the slide just chosen is not turned away a moment later.
  const [moved, setMoved] = useState(0);
  const start = React.useRef(null);
  useEffect(() => {
    if (slides.length < 2) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [slides.length, moved]);
  if (!slides.length) return null;
  const x = slides[i % slides.length];
  const go = (n) => {
    setI(((n % slides.length) + slides.length) % slides.length);
    setMoved((m) => m + 1);
  };
  // SWIPING THE PICTURE MOVES IT (Darrell 2026-11-26, on his phone: "Swiping there pictures of
  // lessons should move it"). Only the dots turned it before.
  const onTouchStart = (e) => {
    const t = e.touches && e.touches[0];
    start.current = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e) => {
    const t = e.changedTouches && e.changedTouches[0];
    const s0 = start.current;
    start.current = null;
    if (!t || !s0 || slides.length < 2) return;
    const step = swipeStep(s0.x, s0.y, t.clientX, t.clientY);
    if (step) go((i % slides.length) + step);
  };
  return (
    <section
      className="ls-hero"
      aria-roledescription="carousel"
      aria-label="Featured lessons"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      data-testid="ls-hero"
      data-slide={i % slides.length}
    >
      <Art p={x.p} eager sizes="100vw" />
      <div className="ls-hero-body">
        <Headline text={x.p.displayTitle} size="hero" align="right" />
        <div className="ls-hero-actions">
          <button type="button" className={`ls-btn ls-btn--play ${RING}`} onClick={() => onOpen(x)}>
            <span className="ls-play" aria-hidden="true" /> Start Lesson
          </button>
          <button type="button" className={`ls-btn ls-btn--ghost ${RING}`} onClick={() => onListen(x)}>
            Listen
          </button>
        </div>
      </div>
      <div className="ls-dots">
        {slides.map((s, n) => (
          <button
            key={s.p.lessonId}
            type="button"
            aria-label={`Show featured lesson ${n + 1}`}
            className={`${n === i % slides.length ? 'on' : ''} ${RING}`}
            onClick={() => go(n)}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Every classic Learn tool, CONDENSED BY DEFAULT (Darrell 2026-11-26: "this functionality is
 * great however by default it should be condensed"). One tap opens it; a tool or department
 * chip opens it and scrolls to it (scrollToStudioTools). Its contents stay mounted while closed.
 */
function ToolsPanel({ title, note, children }) {
  return (
    <details className="ls-row ls-full-tools" id="ls-full-tools" data-testid="ls-full-tools">
      <summary className={`ls-tools-summary ${RING}`}>
        <span className="ls-ico ls-ico--star" aria-hidden="true" />
        <span className="ls-tools-title">{title}</span>
        {note && <span className="ls-note">{note}</span>}
        <span className="ls-tools-open" aria-hidden="true">
          Open ▾
        </span>
      </summary>
      <div className="ls-tools-body">{children}</div>
    </details>
  );
}

const RELATIONSHIPS_TOPIC = Object.freeze({ id: 'relationships', label: 'Relationships', departments: ['Marriage', 'Family', 'Friends', 'Forgiveness'] });

function TopicGrid({ topics, covers, onPick }) {
  return (
    <section className="ls-row">
      <header className="ls-row-head">
        <h2>
          <span className="ls-ico ls-ico--star" aria-hidden="true" />
          Explore by Topic
        </h2>
      </header>
      <div className="ls-topics ts-grid-collapse">
        {topics.map((t) => {
          const c = covers && covers[t.id];
          return (
            <button key={t.id} type="button" className={`ls-topic ${RING}`} onClick={() => onPick(t)}>
              <Picture image={c && c.image} alt={c && c.alt} sizes="240px" pendingLabel="Cover coming" />
              <span className="ls-topic-text">
                <span className="ls-topic-label">{t.label}</span>
                <span className="ls-topic-sub">{t.departments.join(' · ')}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function LessonCover({ x, next, onBack, onRead, onListen, onVersion, onOpen }) {
  const { p } = x;
  const [shared, setShared] = useState(false);
  // Darrell, 2026-11-25: "our share links do/should go to each lesson... the
  // new look needs to do that also... currently it doesn't." This used to
  // share window.location.href -- the generic Learn page, no course/lesson at
  // all, since Learn Studio never pushes a URL as it navigates. lessonUrl() is
  // the SAME real deep-link builder the classic reader's own Share uses
  // (?course=...&lesson=...), so a link shared from here opens exactly this
  // lesson for anyone, and (via ChurchLearn's deepLink -> initialLessonId)
  // lands back in this same new look for the owner's device.
  // THE SAME SHARE AS THE CLASSIC BUTTON (DR-1680; measured 2026-11-26: lesson_shares held 0 rows,
  // ever, while lessons were being shared from here). A fresh token rides on the link, the share is
  // recorded (DR-0698), and the message is the lesson's own note with its title and summary; the
  // link previews as the lesson's picture and title (DR-1673).
  const share = async () => {
    const course = x.course;
    const meta = (course && course.meta) || {};
    const payload = lessonSharePayload(x.lesson || { id: p.lessonId, title: p.displayTitle }, {
      url: lessonUrl({ courseKey: p.courseKey, lessonId: p.lessonId, course }),
      courseTitle: meta.title || p.courseTitle || '',
      token: newShareToken(),
      courseKey: p.courseKey,
      lessonId: p.lessonId,
      brand: lessonDoorFor(course).brand,
    });
    const result = await shareLink(payload);
    if (result === 'shared' || result === 'copied') {
      setShared(true);
      recordLessonShare(payload, result);
    }
  };
  // A shared link that opened this lesson reports it on screen (the open's record, DR-0698): the
  // classic watch looks for the classic card, which the new look never draws.
  useEffect(() => {
    if (pendingShareToken()) reportShareLanded({ ok: true });
  }, []);
  return (
    <article className="ls-cover" id={`learn-lesson-${p.lessonId}`}>
      <button type="button" className={`ls-back ${RING}`} onClick={onBack}>
        ‹ Back to Learn
      </button>
      <div className="ls-cover-art">
        <Art p={p} eager sizes="100vw">
          <Headline text={p.image ? p.thumbHeadline : interimHeadline(p)} size="cover" />
        </Art>
        <LessonProgressFor courseKey={p.courseKey} lessonId={p.lessonId} look="studio" />
      </div>
      <h1 className="ls-cover-title">{p.displayTitle}</h1>
      {/* The author's complete original title, directly under the new title. */}
      <p className="ls-original" data-testid="original-title">
        {p.originalTitle}
      </p>
      <p className="ls-cover-meta">
        {p.courseTitle} · Lesson {p.number ?? ''}
        {p.duration ? ` · ${p.duration} to listen` : ''}
      </p>
      {p.promoDescription && <p className="ls-cover-desc">{p.promoDescription}</p>}
      <div className="ls-cover-actions">
        <button type="button" className={`ls-btn ls-btn--red ${RING}`} onClick={() => onRead(x)}>
          Read Lesson
        </button>
        <button type="button" className={`ls-btn ls-btn--white ${RING}`} onClick={() => onListen(x)}>
          ▶ Listen
        </button>
        {p.hasVideo && (
          <button type="button" className={`ls-btn ls-btn--outline ${RING}`} onClick={() => onRead(x, 'video')}>
            Watch Video
          </button>
        )}
        <button type="button" className={`ls-btn ls-btn--outline ${RING}`} onClick={share}>
          {shared ? 'Link ready' : 'Share'}
        </button>
      </div>
      {p.versions && p.versions.length > 0 && (
        <div className="ls-ages">
          <div className="ls-ages-label">Read it for your age</div>
          {p.versions.map((v) => (
            <button key={v} type="button" className={`ls-chip ${RING}`} onClick={() => onVersion(x, v)}>
              {versionLabel(v)}
            </button>
          ))}
        </div>
      )}
      <p className="ls-handoff">
        Every lesson opens exactly as written: Watch, Read, Listen and Study, its Scriptures, every age version, the quiz and your place.
      </p>
      {next && (
        <section className="ls-row ls-next">
          <header className="ls-row-head">
            <h2>
              <span className="ls-ico ls-ico--play" aria-hidden="true" />
              Next Lesson
            </h2>
          </header>
          <div className="ls-scroller ls-scroller--one">
            <Card x={next} onOpen={onOpen} />
          </div>
        </section>
      )}
    </article>
  );
}

/**
 * props: courses (mounted catalog), index (presentation records Map), preview,
 * topicCovers { shelfId: { image, alt } }, places, progress, and the reader
 * hand-offs onRead(lesson, course, mode) / onListen / onVersion / onExit.
 */
// Stable defaults: a fresh [] / {} per render would bust the memo below and,
// with the initialLesson effect, loop renders forever (caught by the test, 2026-11-24).
const NO_PLACES = Object.freeze([]);
const NO_PROGRESS = Object.freeze({});
const NO_COVERS = Object.freeze({});
const NO_DONE = new Set();
const CoversContext = React.createContext(NO_COVERS);

export default function LearnStudio({
  courses,
  index,
  preview = false,
  topicCovers = NO_COVERS,
  places = NO_PLACES,
  allPlaces = null, // DR-1684: every saved place on the device (begun, finished, measured) -- the bars and Closest to Finished
  progress = NO_PROGRESS,
  onRead,
  onListen,
  onVersion,
  onExit,
  initialLesson = null,
  initialCourse = null,
  // DR-1662: every classic Learn function in the new look.
  dashboard = null, // node: Your Learning, Pick Up Next, Courses (LearnDashboard)
  tools = null, // node: the full classic tools (Record, Downloads, Find by verse...), in this page
  done = NO_DONE, // Set of lesson ids on the reader's record
  onCourse = null, // (courseKey) a course page opened: the tools follow it
  onDepartment = null, // (label) -> true when the tools took the department
  courseRequest = null, // { key, nonce }: open this course page (from the dashboard)
  markFor = null, // (lesson, courseKey) -> "✓ READ ×3 · Adult" or ''
}) {
  const everyPlace = allPlaces || places;
  const home = useMemo(
    () => studioHome(courses, index, { places, allPlaces: everyPlace, progress, preview }),
    [courses, index, places, everyPlace, progress, preview]
  );
  const findPlace = useMemo(() => placeLookup(everyPlace), [everyPlace]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const [shelf, setShelf] = useState(null);
  // A COURSE PAGE IN THE NEW LOOK (Darrell, 2026-11-25, on a course link like
  // ?course=healthy-living: "Fix it"). Every lesson in the course, as a grid --
  // a lesson without its own picture wears its department's approved art (the
  // existing Art fallback), so nothing new is generated and nothing is hidden.
  const [courseKey, setCourseKey] = useState(null);
  const [allCoursesTick, setAllCoursesTick] = useState(0);
  const [relView, setRelViewState] = useState(() =>
    remembered(
      'relationship-view',
      'pictures',
      VIEWS.map((o) => o.key)
    )
  );
  const setRelView = (v) => {
    setRelViewState(v);
    remember('relationship-view', v);
  };
  // THE PHONE'S BACK GOES TO THE LAST PAGE (Darrell 2026-11-26: "Back button should go to the last
  // page the user was on!!!" -- "Not close the app or start over"). A course page, a shelf and a
  // lesson's cover each take one history step when they open, so Back closes the one on top and
  // lands where the reader was; their own Back to Learn gives the step back (useHistoryValue,
  // the primitive the classic lesson space has used since DR-0262).
  useHistoryValue(courseKey, setCourseKey, { base: null, key: 'ls-course' });
  useHistoryValue(shelf, setShelf, { base: null, key: 'ls-shelf' });
  const closeCover = useCallback((v) => {
    if (v == null) setOpen(null);
  }, []);
  useHistoryValue(open ? (open.p && open.p.lessonId) || 'cover' : null, closeCover, { base: null, key: 'ls-cover' });
  useEffect(() => {
    if (!allCoursesTick) return;
    const el = typeof document !== 'undefined' && document.querySelector('[data-testid="ls-courses"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' });
  }, [allCoursesTick]);
  const courseOpened = React.useRef(false);
  // With a lesson in the link too, the lesson's cover shows first and Back
  // lands on its course; a stale lesson id still lands on the course.
  useEffect(() => {
    if (!initialCourse || courseOpened.current) return;
    courseOpened.current = true;
    setCourseKey(initialCourse);
  }, [initialCourse]);
  useEffect(() => {
    if (!courseRequest || !courseRequest.key) return;
    setShelf(null);
    setQuery('');
    setOpen(null);
    setCourseKey(courseRequest.key);
    try {
      window.scrollTo(0, 0);
    } catch {
      /* no window (tests) */
    }
  }, [courseRequest]);
  useEffect(() => {
    if (courseKey && onCourse) onCourse(courseKey);
    // onCourse is a fresh closure each parent render; the course is what matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseKey]);
  const pickedCourse = useMemo(() => {
    if (!courseKey) return null;
    const c = (courses || []).find((k) => (k.key || (k.meta && k.meta.key)) === courseKey);
    if (!c) return null;
    const items = (c.schedule || [])
      .filter((l) => l && l.id)
      .map((l) => ({ lesson: l, course: c, p: presentLesson(l, c, index, { preview }) }))
      .filter((x) => x.p);
    return { title: (c.meta && c.meta.title) || courseKey, items };
  }, [courseKey, courses, index, preview]);
  const all = useMemo(() => [...home.discover, ...home.featuredAll, ...home.shelves.flatMap((s) => s.items)], [home]);
  const opened = React.useRef(null);
  useEffect(() => {
    if (!initialLesson || opened.current === initialLesson) return;
    // A DEEP LINK MUST OPEN ANY PRESENTED LESSON, NOT ONLY A HOME-CURATED ONE
    // (Darrell, 2026-11-25: "our share links do/should go to each lesson...
    // the new look needs to do that also"). `all` is only the home screen's
    // picks (discover/featured/shelves) -- a real lesson absent from every
    // pick (reachable today only via search) silently failed to open. Fall
    // back to the full catalog, the same lookup search already uses.
    const inHome = all.find((x) => x.p.lessonId === initialLesson);
    const hit = inHome || findPresentedLesson(courses, index, initialLesson, { preview });
    if (hit) {
      opened.current = initialLesson; // open once; Back to Learn must stay back
      setOpen(hit);
    }
  }, [initialLesson, all, courses, index, preview]);
  const results = useMemo(() => (query.trim() ? searchPresented(courses, index, query, { preview }) : []), [courses, index, query, preview]);
  const read = (x, mode) => onRead && onRead(x.lesson, x.course, mode);
  const listen = (x) => onListen && onListen(x.lesson, x.course);
  const version = (x, v) => onVersion && onVersion(x.lesson, x.course, v);
  const openLesson = (x) => {
    setOpen(x);
    try {
      window.scrollTo(0, 0);
    } catch {
      /* no window (tests) */
    }
  };

  if (open) {
    const sameShelf = home.shelves.find((s) => s.items.some((y) => y.p.lessonId === open.p.lessonId));
    const list = sameShelf ? sameShelf.items : home.discover;
    const at = list.findIndex((y) => y.p.lessonId === open.p.lessonId);
    const next = list.length > 1 ? list[(at + 1) % list.length] : null;
    return (
      <CoversContext.Provider value={topicCovers}>
        <PlaceLookupContext.Provider value={findPlace}>
          <div className="ls-root">
            <LessonCover x={open} next={next} onBack={() => setOpen(null)} onRead={read} onListen={listen} onVersion={version} onOpen={openLesson} />
          </div>
        </PlaceLookupContext.Provider>
      </CoversContext.Provider>
    );
  }

  const heroSlides = (home.featuredAll.length ? home.featuredAll : home.discover).slice(0, 4);
  const pickedShelf =
    shelf === 'relationships' ? { id: 'relationships', label: 'Relationships', items: home.relationships } : shelf && home.shelves.find((s) => s.id === shelf);
  return (
    <CoversContext.Provider value={topicCovers}>
      <PlaceLookupContext.Provider value={findPlace}>
        <div className="ls-root">
          {/* WE SEE OURSELVES FIRST (Darrell 2026-11-26: "Best start with seeing ourselves!!!"): on the
            Learn home the pictures lead, then Relationships and what you were reading; search and the Lessons
            list follow. */}
          {!query.trim() && !pickedCourse && !pickedShelf && (
            <div data-testid="ls-home-lead">
              <Hero slides={heroSlides} onOpen={openLesson} onListen={listen} />
              {/* RELATIONSHIPS, IN ONE PLACE (Darrell 2026-11-26: "my wife says ladies will want those most"). */}
              <div data-testid="ls-relationships">
                <Row
                  icon="star"
                  title="Relationships"
                  note="Marriage, love, family and friendship"
                  items={home.relationships}
                  onOpen={openLesson}
                  onSeeAll={() => setShelf('relationships')}
                />
              </div>
              <Row icon="play" title="Continue Learning" items={home.continueLearning} onOpen={openLesson} />
              {/* DR-1684 (Darrell 2026-11-26): "so we can pick the ones we are closest to finishing". */}
              <div data-testid="ls-closest">
                <Row icon="play" title="Closest to Finished" note="Started, furthest along first" items={home.closestToFinished} onOpen={openLesson} />
              </div>
            </div>
          )}
          <div className="ls-top">
            <label className="ls-search">
              <span className="ls-search-ico" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lessons, titles or courses..."
                aria-label="Search lessons, titles or courses"
              />
            </label>
            {/* ALL COURSES STAYS IN THE NEW LOOK (Darrell 2026-11-26, sent the classic page:
              "How is this still a view?"). It opened the classic page; with the courses here it
              goes to them. Only a page without the dashboard still leaves. */}
            <button
              type="button"
              className={`ls-btn ls-btn--outline ls-all ${RING}`}
              data-testid="ls-all-courses"
              onClick={() => {
                if (!dashboard) return onExit && onExit();
                setQuery('');
                setShelf(null);
                setCourseKey(null);
                setAllCoursesTick((n) => n + 1);
              }}
            >
              All Courses
            </button>
          </div>
          {home.totals.presented === 0 && (
            <p className="ls-empty" role="status">
              No lesson has an approved cover yet, so this view has nothing to show. Every lesson is still in All Courses; covers appear here once they are
              approved in the review.
            </p>
          )}
          {query.trim() ? (
            results.length ? (
              <Row
                title={`Results for “${query.trim()}”`}
                note={`${results.length} lessons`}
                items={results.map((r) => ({ ...r, p: r.p || presentLesson(r.lesson, r.course, index, { preview }) }))}
                onOpen={openLesson}
              />
            ) : (
              <p className="ls-empty" role="status">
                No lesson matches “{query.trim()}”. Search reads new titles, original titles, courses and lesson numbers; try a word from the original title.
              </p>
            )
          ) : pickedCourse ? (
            <>
              <button type="button" className={`ls-back ${RING}`} onClick={() => setCourseKey(null)}>
                ‹ Back to Learn
              </button>
              <CourseLessonsView
                title={pickedCourse.title}
                items={pickedCourse.items}
                onOpen={openLesson}
                renderPictures={(rows) => <Row title={pickedCourse.title} note={`${rows.length} lessons`} items={rows} onOpen={openLesson} grid />}
                // DR-1662: List is the compact-thumbnail list (read marks, ages, Show), in the order chosen above.
                course={(courses || []).find((k) => (k.key || (k.meta && k.meta.key)) === courseKey) || null}
                onResume={(x) => read(x)}
                renderList={(order, partIds) => (
                  <LessonsInOrder
                    courses={courses}
                    index={index}
                    preview={preview}
                    onOpen={(x) => read(x)}
                    done={done}
                    fixedCourse={courseKey}
                    order={order}
                    onlyIds={partIds}
                    onListen={listen}
                    listTestId="course-list"
                    markFor={markFor}
                    onVersion={version}
                  />
                )}
              />
              {tools && (
                <ToolsPanel title={`${pickedCourse.title}: every tool`} note="record, downloads, share, ages">
                  {tools}
                </ToolsPanel>
              )}
            </>
          ) : pickedShelf ? (
            <>
              <button type="button" className={`ls-back ${RING}`} onClick={() => setShelf(null)}>
                ‹ Back to Learn
              </button>
              {pickedShelf.id === 'relationships' && home.relationshipGroups && home.relationshipGroups.length ? (
                // Relationships is a section of its own, in four parts (DR-1675).
                <div data-testid="ls-relationship-sections">
                  <h2 className="ls-section-title">Relationships · {pickedShelf.items.length} lessons</h2>
                  <Toggle label="View" options={VIEWS} value={relView} onChange={setRelView} testid="ls-relationship-view" />
                  {home.relationshipGroups.map((g) => (
                    <Row key={g.id} title={`${g.label} · ${g.items.length}`} items={g.items} onOpen={openLesson} grid view={relView} />
                  ))}
                </div>
              ) : (
                <Row title={pickedShelf.label} items={pickedShelf.items} onOpen={openLesson} grid />
              )}
            </>
          ) : (
            <>
              <LessonsInOrder
                foldable
                courses={courses}
                index={index}
                preview={preview}
                onOpen={(x) => read(x)}
                done={done}
                markFor={markFor}
                onVersion={version}
                renderPictures={(rows, { grid }) => (
                  <div className={grid ? 'ls-grid ts-grid-collapse' : 'ls-scroller'}>
                    {rows.map((x) => (
                      <Card key={`${x.p.courseKey}::${x.p.lessonId}`} x={x} onOpen={openLesson} />
                    ))}
                  </div>
                )}
              />
              <Row icon="star" title="Discover Something New" note="Hand-picked lessons" items={home.discover} onOpen={openLesson} />
              <Row icon="play" title="Recently Added" items={home.recentlyAdded} onOpen={openLesson} />
              {/* The picture shelves first, then the words (your record, the course list) below them (DR-1686). */}
              {dashboard}
              {/* Relationships is a topic of its own, first in the grid (DR-1675; Darrell 2026-11-26: "Should
                say relationships as an option"), wearing one of its own lessons' approved covers. */}
              <TopicGrid
                topics={home.relationships && home.relationships.length ? [RELATIONSHIPS_TOPIC, ...SHELVES] : SHELVES}
                covers={
                  home.relationships && home.relationships[0] && home.relationships[0].p.image
                    ? { ...topicCovers, relationships: { image: home.relationships[0].p.image, alt: home.relationships[0].p.displayTitle } }
                    : topicCovers
                }
                onPick={(t) => setShelf(t.id)}
              />
              {home.shelves.map((s) => (
                <Row key={s.id} title={s.label} items={s.items} onOpen={openLesson} onSeeAll={() => setShelf(s.id)} />
              ))}
              <section className="ls-row">
                <header className="ls-row-head">
                  <h2>
                    <span className="ls-ico ls-ico--star" aria-hidden="true" />
                    All {home.topics.length} Departments
                  </h2>
                  <span className="ls-note">{home.totals.lessons} lessons</span>
                </header>
                <div className="ls-depts">
                  {home.topics.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      className={`ls-chip ls-chip--dept ${RING}`}
                      onClick={() => {
                        // The department opens in the tools on this page; only a department the tools do not know leaves for All Courses.
                        // Never back to the classic page: the department opens in the tools on this page.
                        if (onDepartment) onDepartment(t.label);
                        scrollToStudioTools();
                      }}
                    >
                      {t.label} · {t.lessons}
                    </button>
                  ))}
                </div>
              </section>
              {tools && (
                <ToolsPanel title="Every Learn Tool" note="Continue, Latest, Browse, Find, Record, Downloads">
                  {tools}
                </ToolsPanel>
              )}
            </>
          )}
        </div>
      </PlaceLookupContext.Provider>
    </CoversContext.Provider>
  );
}
