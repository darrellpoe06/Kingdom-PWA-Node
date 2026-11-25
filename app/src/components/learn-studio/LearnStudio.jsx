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
import React, { useMemo, useState, useEffect } from 'react';
import { studioHome, searchPresented, presentLesson, SHELVES, shelfForDepartment, interimHeadline, findPresentedLesson } from '../../lib/learn-presentation/presentation.js';
import { READING_VERSIONS } from '../../lib/learn-organize.js';
import { lessonUrl } from '../../lib/lesson-links.js';

const versionLabel = (id) => (READING_VERSIONS.find((b) => b.id === id) || { label: id }).label;
// A keyboard user must SEE where they are (ui-standards focus-ring). Gold, never red (red is reserved, DR-0099).
const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
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
      {image.srcSet && image.srcSet.webp && <source type="image/webp" srcSet={image.srcSet.webp} sizes={sizes} />}
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
      </div>
      <div className="ls-card-title">{p.displayTitle}</div>
      <div className="ls-card-meta">
        {p.courseTitle} • {p.code}
      </div>
    </button>
  );
}

function Row({ icon = 'play', title, note, items, onOpen, onSeeAll, grid = false }) {
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
      <div className={grid ? 'ls-grid ts-grid-collapse' : 'ls-scroller'}>
        {items.map((x) => (
          <Card key={`${x.p.courseKey}::${x.p.lessonId}`} x={x} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function Hero({ slides, onOpen, onListen }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [slides.length]);
  if (!slides.length) return null;
  const x = slides[i % slides.length];
  return (
    <section className="ls-hero" aria-roledescription="carousel" aria-label="Featured lessons">
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
            onClick={() => setI(n)}
          />
        ))}
      </div>
    </section>
  );
}

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
  const share = async () => {
    const url = lessonUrl({ courseKey: p.courseKey, lessonId: p.lessonId, course: x.course });
    try {
      if (navigator.share) await navigator.share({ title: p.displayTitle, url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
    } catch {
      /* the person closed the share sheet */
    }
  };
  return (
    <article className="ls-cover">
      <button type="button" className={`ls-back ${RING}`} onClick={onBack}>
        ‹ Back to Learn
      </button>
      <div className="ls-cover-art">
        <Art p={p} eager sizes="100vw">
          <Headline text={p.image ? p.thumbHeadline : interimHeadline(p)} size="cover" />
        </Art>
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
        The lesson opens in the reader exactly as written, with its Scriptures, age versions, read-aloud, quiz, downloads and your saved place.
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
const CoversContext = React.createContext(NO_COVERS);

export default function LearnStudio({
  courses,
  index,
  preview = false,
  topicCovers = NO_COVERS,
  places = NO_PLACES,
  progress = NO_PROGRESS,
  onRead,
  onListen,
  onVersion,
  onExit,
  initialLesson = null,
  initialCourse = null,
}) {
  const home = useMemo(() => studioHome(courses, index, { places, progress, preview }), [courses, index, places, progress, preview]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const [shelf, setShelf] = useState(null);
  // A COURSE PAGE IN THE NEW LOOK (Darrell, 2026-11-25, on a course link like
  // ?course=healthy-living: "Fix it"). Every lesson in the course, as a grid --
  // a lesson without its own picture wears its department's approved art (the
  // existing Art fallback), so nothing new is generated and nothing is hidden.
  const [courseKey, setCourseKey] = useState(null);
  const courseOpened = React.useRef(false);
  // With a lesson in the link too, the lesson's cover shows first and Back
  // lands on its course; a stale lesson id still lands on the course.
  useEffect(() => {
    if (!initialCourse || courseOpened.current) return;
    courseOpened.current = true;
    setCourseKey(initialCourse);
  }, [initialCourse]);
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
        <div className="ls-root">
          <LessonCover x={open} next={next} onBack={() => setOpen(null)} onRead={read} onListen={listen} onVersion={version} onOpen={openLesson} />
        </div>
      </CoversContext.Provider>
    );
  }

  const heroSlides = (home.featuredAll.length ? home.featuredAll : home.discover).slice(0, 4);
  const pickedShelf = shelf && home.shelves.find((s) => s.id === shelf);
  return (
    <CoversContext.Provider value={topicCovers}>
      <div className="ls-root">
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
          <button type="button" className={`ls-btn ls-btn--outline ls-all ${RING}`} onClick={onExit}>
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
            <Row title={pickedCourse.title} note={`${pickedCourse.items.length} lessons`} items={pickedCourse.items} onOpen={openLesson} grid />
          </>
        ) : pickedShelf ? (
          <>
            <button type="button" className={`ls-back ${RING}`} onClick={() => setShelf(null)}>
              ‹ Back to Learn
            </button>
            <Row title={pickedShelf.label} items={pickedShelf.items} onOpen={openLesson} grid />
          </>
        ) : (
          <>
            <Hero slides={heroSlides} onOpen={openLesson} onListen={listen} />
            <Row icon="play" title="Continue Learning" items={home.continueLearning} onOpen={openLesson} />
            <Row icon="star" title="Discover Something New" note="Hand-picked lessons" items={home.discover} onOpen={openLesson} />
            <Row icon="play" title="Recently Added" items={home.recentlyAdded} onOpen={openLesson} />
            <TopicGrid topics={SHELVES} covers={topicCovers} onPick={(t) => setShelf(t.id)} />
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
                  <button key={t.label} type="button" className={`ls-chip ls-chip--dept ${RING}`} onClick={onExit}>
                    {t.label} · {t.lessons}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </CoversContext.Provider>
  );
}
