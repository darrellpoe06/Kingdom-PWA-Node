// =============================================================================
// LearnDiscover — the Learning Zone's front door (additive; replaces nothing)
// =============================================================================
// Darrell 2026-11-26: "an entirely new discovery landing page that serves as the
// entrance to everything we have already built" — The Word / Learning Zone opens
// here first; "Browse All Lessons" opens the existing Learn exactly as it is.
// Visual target: docs/design/learn-discover/reference/approved-mockup.png.
//
// This page READS the curriculum (through learn-discover-index.json, derived from
// the mounted catalog) and POINTS at it. It owns no lesson, no course, no
// progress record and no preference: opening a lesson hands it to Learn's own
// opener, Continue reads Learn's own saved places, and every course and
// department assignment is untouched. Photographs are the existing approved
// lesson covers; promotional titles ride beside — never instead of — the
// lesson's own title. Colours come from the shell's theme tokens (--lc-*), so the
// page follows each person's chosen theme (the church door's own default, Night,
// is the mockup's red, black and gold).
// =============================================================================
import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import './learn-discover.css';
import INDEX from '../../lib/learn-discover-index.json';
import DATES from '../../lib/lesson-dates.json';
import RECORDS from '../../lib/learn-presentation/presentation-records.json';
import { prepareIndex, discoverSearch, correctQuery } from '../../lib/learn-discover-search.js';
import { CATEGORIES, categoryMembers, MIN_SHOWN } from '../../lib/learn-discover-categories.js';
import { HERO_LESSON, categoryPhotoRow, photoSrc } from '../../lib/learn-discover-photos.js';
import { continueRows, newestRows, featuredRows, relationshipRows } from '../../lib/learn-discover-home.js';
import { SERIES } from '../../lib/learn-discover-series.js';
import { todaysWord } from '../../lib/learn-discover-word.js';
import { listPlaces } from '../../lib/learn-resume.js';

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
const WHY = { title: 'Matches the title', verse: 'Scripture match', topic: 'On this topic', content: 'In the lesson', related: 'Related idea' };
const EXAMPLES = [
  'Why am I always stressed?',
  'How can I strengthen my marriage?',
  'How do I raise godly children?',
  'How can I get out of debt?',
  'How do I buy my first home?',
  'What does the Bible say about forgiveness?',
  'How do I find my purpose?',
  'How can I become a better leader?',
  'How can I grow closer to God?',
];
// The short name on a tile. The full approved name stays on the category page and in the accessible label.
const SHORT = {
  faith: 'Faith & Spiritual Growth', wellness: 'Emotional Wellness', marriage: 'Marriage & Relationships', parenting: 'Parenting & Family',
  purpose: 'Personal Growth', money: 'Money & Stewardship', business: 'Career & Business', realestate: 'Real Estate & Ownership',
  leadership: 'Leadership & Ministry', bible: 'Bible Study', history: 'History & Our World', tech: 'Technology & AI',
};
const TILE_ORDER = ['faith', 'wellness', 'marriage', 'parenting', 'purpose', 'money', 'realestate', 'business', 'leadership', 'bible', 'history', 'tech'];
const ACCESS = [
  { id: 'lessons', label: 'All Courses', glyph: '▤' },
  { id: 'browse', label: 'All Departments', glyph: '◫' },
  { id: 'record', label: 'My Learning', glyph: '◉' },
  { id: 'tools', label: 'Study Tools', glyph: '✎' },
  { id: 'downloads', label: 'Downloads', glyph: '⬇' },
];

const bookCache = new Map();
function defaultGetBook(file) {
  if (!bookCache.has(file)) bookCache.set(file, fetch(`${BASE}bible/kjv/${file}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return bookCache.get(file);
}

const titleCase = (s) => String(s || '').toLowerCase().replace(/(^|[\s-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
/** A short headline for a lesson: its own thumbnail headline, else the first clause of its title. */
function headlineOf(row) {
  if (row.h && !row.stale) return titleCase(row.h);
  const first = String(row.p && !row.stale ? row.p : row.t).split(/[:?—–]/)[0].trim();
  return first.split(/\s+/).length <= 7 ? first : first.split(/\s+/).slice(0, 6).join(' ');
}

function Photo({ im, className = '', eager = false, label = '' }) {
  const p = photoSrc(im, BASE);
  // A lesson still waiting for its own picture shows its course name on a panel: never a blank, never new art.
  if (!p) return <span className={`ld-ph ld-ph-none ${className}`} aria-hidden="true">{label}</span>;
  return <img className={`ld-ph ${className}`} src={p.src} srcSet={p.srcSet} sizes="(max-width: 600px) 60vw, 280px" alt="" width="640" height="360" loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}

const Ic = {
  search: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14l2.5 2.5L16 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
  ),
  chev: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
};

function BibleArt({ className = '' }) {
  return (
    <svg viewBox="0 0 120 84" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ld-pg" x1="0" x2="1"><stop offset="0" stopColor="#fbefc9" /><stop offset="1" stopColor="#e9c978" /></linearGradient>
        <linearGradient id="ld-cv" x1="0" x2="1"><stop offset="0" stopColor="#7a4a14" /><stop offset="1" stopColor="#4d2a08" /></linearGradient>
      </defs>
      <path d="M4 20c0-2 2-4 4-3 20 6 40 4 52 12 12-8 32-6 52-12 2-1 4 1 4 3v50c0 2-2 4-4 3-20-6-40-4-52 4-12-8-32-10-52-4-2 1-4-1-4-3z" fill="url(#ld-cv)" />
      <path d="M8 14c18-6 38-5 52 4 14-9 34-10 52-4v52c-18-6-38-5-52 4-14-9-34-10-52-4z" fill="url(#ld-pg)" stroke="#b8862b" strokeWidth="1.6" />
      <path d="M60 18v52" stroke="#b8862b" strokeWidth="1.6" />
      <g stroke="#a67c2e" strokeWidth="1.1" opacity=".55" strokeLinecap="round"><path d="M16 26c12-3 28-3 38 2M16 34c12-3 28-3 38 2M16 42c12-3 28-3 38 2M16 50c12-3 28-3 38 2M66 28c10-5 26-5 38-2M66 36c10-5 26-5 38-2M66 44c10-5 26-5 38-2M66 52c10-5 26-5 38-2" fill="none" /></g>
    </svg>
  );
}

/** One lesson, as a compact card: promotional title first, the lesson's own title kept beside it. */
function LessonCard({ row, course, onOpen, reached, note }) {
  const promo = row.p && !row.stale ? row.p : '';
  return (
    <button type="button" className="ld-card" onClick={() => onOpen(course.k, row.i)} data-testid="ld-lesson-card" data-lesson={row.i}>
      <span className="ld-card-pic">
        <Photo im={row.im} label={course.t} />
        {typeof reached === 'number' ? <span className="ld-bar" aria-hidden="true"><i style={{ width: `${Math.round(reached * 100)}%` }} /></span> : null}
      </span>
      <span className="ld-card-t">{promo || row.t}</span>
      {promo ? <span className="ld-card-o">{row.t}</span> : null}
      <span className="ld-card-m">{note || course.t}</span>
    </button>
  );
}

export default function LearnDiscover({ onBrowseAll, onOpenLesson, onOpenArea, onOpenCourse, places, getBook = defaultGetBook, now, index = INDEX }) {
  const P = useMemo(() => prepareIndex(index), [index]);
  const members = useMemo(() => categoryMembers(P), [P]);
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [more, setMore] = useState(1);
  const [cat, setCat] = useState(null);
  const [catMore, setCatMore] = useState(1);
  const [allTopics, setAllTopics] = useState(false);
  const [ser, setSer] = useState(null);
  const [word, setWord] = useState(null);
  const [verseOpen, setVerseOpen] = useState(false);
  const [saved] = useState(() => (places ? places : listPlaces({ inProgress: true })));
  const [dept, setDept] = useState('all');
  const [courseMore, setCourseMore] = useState(1);
  const seriesRail = useRef(null);

  const fixed = useMemo(() => (deferred.trim() ? correctQuery(P, deferred.trim()) : { text: '', changed: [] }), [P, deferred]);
  const results = useMemo(() => (deferred.trim() ? discoverSearch(P, deferred) : []), [P, deferred]);
  const cont = useMemo(() => continueRows(P, saved), [P, saved]);
  const newest = useMemo(() => newestRows(P, DATES), [P]);
  const featured = useMemo(() => featuredRows(P, RECORDS.records), [P]);
  const rels = useMemo(() => relationshipRows(P), [P]);
  const hero = P.byId.get(HERO_LESSON);
  // Tile order follows the mockup (Faith, Wellness, Marriage, Parenting, Personal Growth / Money, Real Estate, Career, Bible, Leadership...).
  const shown = TILE_ORDER.map((id) => CATEGORIES.find((c) => c.id === id)).filter((c) => c && (members.get(c.id) || { lessonIds: [] }).lessonIds.length >= MIN_SHOWN);
  const covers = useMemo(() => {
    const m = new Map();
    for (const L of P.lessons) if (L.raw.im && !m.has(L.course.k)) m.set(L.course.k, L.raw);
    return m;
  }, [P]);
  const depts = useMemo(() => [...new Set((index.courses || []).map((c) => c.d))], [index]);
  const courseList = useMemo(() => (index.courses || []).filter((c) => dept === 'all' || c.d === dept), [index, dept]);
  const series = useMemo(() => SERIES.map((s) => ({ ...s, rows: s.lessons.map((id) => P.byId.get(id)).filter(Boolean) })), [P]);

  useEffect(() => {
    let live = true;
    todaysWord(index, getBook, now || new Date()).then((w) => { if (live) setWord(w); }).catch(() => {});
    return () => { live = false; };
  }, [index, getBook, now]);

  const open = (courseKey, lessonId) => onOpenLesson && onOpenLesson(courseKey, lessonId);
  const openCourse = (c) => {
    if (onOpenCourse) { onOpenCourse(c.k); return; }
    const first = P.lessons.find((L) => L.course.k === c.k);
    if (first) open(c.k, first.raw.i);
  };
  const asCard = (r, i) => <LessonCard key={`${r.row.i}-${i}`} row={r.row} course={r.course} onOpen={open} reached={r.reached} note={r.day ? `Added ${r.day}` : undefined} />;
  const rowsOf = (ids) => ids.map((id) => P.byId.get(id)).filter(Boolean);
  const catRows = cat ? rowsOf((members.get(cat) || { lessonIds: [] }).lessonIds) : [];
  const catInfo = cat ? CATEGORIES.find((c) => c.id === cat) : null;
  const serInfo = ser ? series.find((s) => s.id === ser) : null;
  const wordLesson = word ? P.byId.get(word.lessonId) : null;
  const counts = index.counts || {};
  const lead = cont[0];
  const asTile = (c, i) => {
    const m = members.get(c.id);
    const ph = categoryPhotoRow(P, c.id, m.lessonIds);
    // Two rows that scroll sideways fill by column, so a tile's visual slot is set here: row one holds the first six, row two the rest.
    const half = Math.ceil(shown.length / 2);
    const slot = i < half ? i * 2 : (i - half) * 2 + 1;
    return (
      <button key={c.id} type="button" className="ld-tile" style={{ '--ld-o': slot, '--ld-o-wide': i }} aria-pressed={cat === c.id} aria-label={`${c.label}, ${m.lessonIds.length} lessons`} onClick={() => { setCat(cat === c.id ? null : c.id); setCatMore(1); }} data-testid="ld-category" data-cat={c.id}>
        <Photo im={ph && ph.im} />
        <span className="ld-tile-n" aria-hidden="true">{m.lessonIds.length}</span>
        <span className="ld-tile-t" aria-hidden="true">{SHORT[c.id] || c.label}</span>
      </button>
    );
  };

  return (
    <section className="ld-root" aria-labelledby="ld-h" data-testid="learn-discover">
      <header className="ld-hero">
        <div className="ld-hero-photo">{hero ? <Photo im={hero.raw.im} eager /> : null}</div>
        <div className="ld-hero-copy">
          <h1 id="ld-h" className="ld-h1"><span className="ld-h1-a">The Word</span> <span className="ld-h1-b">Learning Zone</span></h1>
          <p className="ld-tag">Bible Truth for Everyday Life</p>
          <p className="ld-stat">{counts.lessons} lessons · {counts.courses} courses · {counts.departments} departments</p>
        </div>
        <BibleArt className="ld-hero-bible" />
      </header>

      <div className="ld-find">
        <form className="ld-search" role="search" onSubmit={(e) => { e.preventDefault(); const r = document.getElementById('ld-results'); if (r && r.scrollIntoView) r.scrollIntoView({ block: 'start' }); }}>
          <label htmlFor="ld-q" className="ld-sr">Ask a question or search the curriculum</label>
          <span className="ld-pill">
            <span className="ld-pill-ic" aria-hidden="true">{Ic.search}</span>
            <input
              id="ld-q"
              type="search"
              inputMode="search"
              autoComplete="off"
              enterKeyHint="search"
              placeholder="What are you facing today?"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setMore(1); }}
              data-testid="ld-search"
            />
          </span>
          <button type="submit" className="ld-go">Search</button>
        </form>
        <p className="ld-help">Search a question, topic, scripture, or life situation (e.g., anxiety, marriage, money, purpose)</p>
        <div className="ld-chips" role="group" aria-label="Suggested questions" data-testid="ld-suggested">
          {EXAMPLES.map((q) => (
            <button key={q} type="button" className="ld-chip-q" onClick={() => { setQuery(q); setMore(1); }}>{q}</button>
          ))}
        </div>
      </div>

      {deferred.trim() ? (
        <section className="ld-sec" id="ld-results" aria-live="polite" data-testid="ld-results">
          <div className="ld-sec-h">
            <h2 className="ld-h2">{results.length ? `${results.length} lessons for “${deferred.trim()}”` : `Nothing yet for “${deferred.trim()}”`}</h2>
            <button type="button" className="ld-link" onClick={() => setQuery('')}>Clear</button>
          </div>
          {fixed.changed.length ? <p className="ld-p" data-testid="ld-corrected">Showing results for “{fixed.text}”.</p> : null}
          {!results.length ? <p className="ld-p">Try a feeling, a question, a verse like Matthew 6, or a single word like “debt.”</p> : null}
          <ul className="ld-results">
            {results.slice(0, more * 8).map((r) => {
              const L = P.byId.get(r.lessonId);
              const row = L.raw;
              const promo = row.p && !row.stale ? row.p : '';
              return (
                <li key={r.lessonId}>
                  <button type="button" className="ld-res" onClick={() => open(L.course.k, row.i)} data-testid="ld-result" data-lesson={row.i} data-why={r.why}>
                    <span className="ld-res-pic"><Photo im={row.im} label={L.course.t} /></span>
                    <span className="ld-res-body">
                      <span className="ld-res-t">{promo || row.t}</span>
                      {promo ? <span className="ld-res-o">{row.t}</span> : null}
                      <span className="ld-res-m">{L.course.t}{row.r ? ` · ${String(row.r).split(/[;·]/)[0].trim()}` : ''}</span>
                      <span className="ld-chip">{WHY[r.why] || 'Related idea'}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {results.length > more * 8 ? <button type="button" className="ld-more" onClick={() => setMore(more + 1)}>Show more</button> : null}
        </section>
      ) : (
        <>
          <section className="ld-sec" aria-labelledby="ld-cat-h" data-testid="ld-categories">
            <div className="ld-sec-h">
              <h2 id="ld-cat-h" className="ld-h2">Explore by Topic</h2>
              <button type="button" className="ld-link" aria-expanded={allTopics} onClick={() => setAllTopics(!allTopics)} data-testid="ld-all-topics">{allTopics ? 'Show fewer' : 'View All Topics'} <span aria-hidden="true">→</span></button>
            </div>
            <div className={`ld-tiles${allTopics ? ' ld-tiles-all' : ''}`}>{shown.map(asTile)}</div>
            {cat && catInfo ? (
              <div className="ld-shelf" data-testid="ld-category-shelf">
                <div className="ld-sec-h">
                  <h3 className="ld-h3"><b>{catInfo.label}</b> · {catInfo.blurb}</h3>
                  <span className="ld-small">{Math.min(catRows.length, catMore * 12)} of {catRows.length}</span>
                </div>
                <div className="ld-rail">{catRows.slice(0, catMore * 12).map((L, i) => asCard({ row: L.raw, course: L.course }, i))}</div>
                {catRows.length > catMore * 12 ? <button type="button" className="ld-more" onClick={() => setCatMore(catMore + 1)}>Show 12 more</button> : null}
              </div>
            ) : null}
          </section>

          <div className={`ld-duo${lead ? '' : ' ld-duo-one'}`}>
            {lead ? (
              <section className="ld-sec" aria-labelledby="ld-cont-h" data-testid="ld-continue">
                <div className="ld-sec-h">
                  <h2 id="ld-cont-h" className="ld-h2">Continue Learning</h2>
                  <button type="button" className="ld-link" onClick={() => onOpenArea && onOpenArea('record')}><span className="ld-vlong">View </span>My Learning <span aria-hidden="true">→</span></button>
                </div>
                <button type="button" className="ld-cont" onClick={() => open(lead.course.k, lead.row.i)} data-testid="ld-lesson-card" data-lesson={lead.row.i} aria-label={`Continue: ${lead.row.p && !lead.row.stale ? lead.row.p : lead.row.t}, ${Math.round(lead.reached * 100)}% read`}>
                  <span className="ld-cont-pic"><Photo im={lead.row.im} label={lead.course.t} /></span>
                  <span className="ld-cont-body">
                    <span className="ld-cont-t">{lead.row.p && !lead.row.stale ? lead.row.p : lead.row.t}</span>
                    <span className="ld-cont-c">{lead.course.t}</span>
                    <span className="ld-cont-prog">
                      <span className="ld-bar2" aria-hidden="true"><i style={{ width: `${Math.round(lead.reached * 100)}%` }} /></span>
                      <span className="ld-cont-pct">{Math.round(lead.reached * 100)}% read</span>
                    </span>
                  </span>
                  <span className="ld-play" aria-hidden="true">{Ic.play}</span>
                </button>
                {cont.length > 1 ? <button type="button" className="ld-link ld-more-saved" onClick={() => onOpenArea && onOpenArea('record')}>+{cont.length - 1} more in progress</button> : null}
              </section>
            ) : null}

            {word ? (
              <section className="ld-sec ld-sec-word" aria-labelledby="ld-word-h" data-testid="ld-word">
                <div className="ld-word">
                  <div className="ld-word-bar"><span className="ld-word-ic" aria-hidden="true">{Ic.calendar}</span><h2 id="ld-word-h" className="ld-word-h">Today’s Word</h2></div>
                  <div className="ld-word-body">
                    <p className="ld-word-t">{wordLesson ? headlineOf(wordLesson.raw) : word.ref}</p>
                    <p className="ld-word-ref">{word.ref} <span>· {word.translation}</span></p>
                    <button type="button" className="ld-word-btn" aria-expanded={verseOpen} onClick={() => setVerseOpen(!verseOpen)} data-testid="ld-word-toggle">{verseOpen ? 'Hide the verse' : 'Read the verse'}</button>
                    <BibleArt className="ld-word-bible" />
                  </div>
                  {verseOpen ? (
                    <blockquote className="ld-verse" data-testid="ld-verse"><p>{word.text}</p>
                      {wordLesson ? <button type="button" className="ld-word-go" onClick={() => open(wordLesson.course.k, wordLesson.raw.i)}>Go deeper: {wordLesson.raw.p && !wordLesson.raw.stale ? wordLesson.raw.p : wordLesson.raw.t} {Ic.chev}</button> : null}
                    </blockquote>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>

          <section className="ld-sec" aria-labelledby="ld-ser-h" data-testid="ld-series">
            <div className="ld-sec-h">
              <h2 id="ld-ser-h" className="ld-h2">Featured Series</h2>
              <span className="ld-small ld-prop">Proposed lists</span>
            </div>
            <div className="ld-series-wrap">
              <div className="ld-series" ref={seriesRail}>
                {series.map((s) => {
                  const ph = s.rows.find((L) => L.raw.im);
                  return (
                    <button key={s.id} type="button" className="ld-ser" aria-pressed={ser === s.id} aria-label={`${s.title}, ${s.rows.length} lessons`} onClick={() => setSer(ser === s.id ? null : s.id)} data-testid="ld-series-tile" data-series={s.id}>
                      <Photo im={ph && ph.raw.im} />
                      <span className="ld-ser-t" aria-hidden="true">{s.title}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" className="ld-next" aria-label="Show more series" onClick={() => seriesRail.current && seriesRail.current.scrollBy({ left: 220, behavior: 'smooth' })}>{Ic.chev}</button>
            </div>
            {serInfo ? (
              <div className="ld-shelf" data-testid="ld-series-shelf">
                <div className="ld-sec-h">
                  <h3 className="ld-h3"><b>{serInfo.title}</b> · {serInfo.blurb}</h3>
                  <button type="button" className="ld-link" onClick={() => serInfo.rows[0] && open(serInfo.rows[0].course.k, serInfo.rows[0].raw.i)}>Start the series {Ic.chev}</button>
                </div>
                <div className="ld-rail">{serInfo.rows.map((L, i) => <LessonCard key={L.raw.i} row={L.raw} course={L.course} onOpen={open} note={`${i + 1} of ${serInfo.rows.length} · ${L.course.t}`} />)}</div>
              </div>
            ) : null}
          </section>

          {featured.length ? (
            <section className="ld-sec" aria-labelledby="ld-feat-h" data-testid="ld-featured">
              <div className="ld-sec-h"><h2 id="ld-feat-h" className="ld-h2">Featured Lessons</h2></div>
              <div className="ld-rail">{featured.map(asCard)}</div>
            </section>
          ) : null}

          <section className="ld-sec" aria-labelledby="ld-crs-h" data-testid="ld-courses">
            <div className="ld-sec-h">
              <h2 id="ld-crs-h" className="ld-h2">All Courses</h2>
              <span className="ld-sec-actions">
                <button type="button" className="ld-browse ld-browse-sm" onClick={onBrowseAll} data-testid="ld-browse-all">Browse All Lessons</button>
                <button type="button" className="ld-link" onClick={() => onOpenArea && onOpenArea('lessons')}>View All Courses <span aria-hidden="true">→</span></button>
              </span>
            </div>
            <div className="ld-dchips" role="group" aria-label="Filter courses by department" data-testid="ld-dept-chips">
              <button type="button" className="ld-dchip" aria-pressed={dept === 'all'} onClick={() => { setDept('all'); setCourseMore(1); }}>All Courses</button>
              {depts.map((d) => (
                <button key={d} type="button" className="ld-dchip" aria-pressed={dept === d} onClick={() => { setDept(d); setCourseMore(1); }}>{d}</button>
              ))}
            </div>
            <div className="ld-courses">
              {courseList.slice(0, courseMore * 6).map((c) => {
                const cv = covers.get(c.k);
                return (
                  <button key={c.k} type="button" className="ld-course" onClick={() => openCourse(c)} data-testid="ld-course" data-course={c.k}>
                    <span className="ld-course-pic"><Photo im={cv && cv.im} label={c.t} /></span>
                    <span className="ld-course-body"><span className="ld-course-t">{c.t}</span><span className="ld-course-n">{c.n} lessons</span></span>
                  </button>
                );
              })}
            </div>
            {courseList.length > courseMore * 6 ? <button type="button" className="ld-more" onClick={() => setCourseMore(courseMore + 1)}>Show more courses ({courseList.length - courseMore * 6} more)</button> : null}
          </section>

          {rels.length ? (
            <section className="ld-sec" aria-labelledby="ld-rel-h" data-testid="ld-collection-relationships">
              <div className="ld-sec-h"><h2 id="ld-rel-h" className="ld-h2">Collection · Relationships in one place</h2></div>
              <div className="ld-rail">{rels.map(asCard)}</div>
            </section>
          ) : null}

          {newest.length ? (
            <section className="ld-sec" aria-labelledby="ld-new-h" data-testid="ld-newest">
              <div className="ld-sec-h"><h2 id="ld-new-h" className="ld-h2">Collection · Newest lessons</h2></div>
              <div className="ld-rail">{newest.map(asCard)}</div>
            </section>
          ) : null}

          <section className="ld-sec" aria-labelledby="ld-acc-h" data-testid="ld-access">
            <div className="ld-sec-h"><h2 id="ld-acc-h" className="ld-h2">Everything in the Learning Zone</h2></div>
            <div className="ld-access">
              {ACCESS.map((a) => (
                <button key={a.id} type="button" className="ld-apill" onClick={() => onOpenArea && onOpenArea(a.id)} data-testid={`ld-access-${a.id}`}>
                  <span aria-hidden="true" className="ld-apill-g">{a.glyph}</span>{a.label}
                </button>
              ))}
            </div>
            <button type="button" className="ld-browse ld-browse-wide" onClick={onBrowseAll}>Browse All Lessons</button>
          </section>
        </>
      )}
    </section>
  );
}
