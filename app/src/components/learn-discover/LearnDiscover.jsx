// =============================================================================
// LearnDiscover — the Learning Zone's front door (additive; replaces nothing)
// =============================================================================
// Darrell 2026-11-26: "an entirely new discovery landing page that serves as the
// entrance to everything we have already built" — The Word / Learning Zone opens
// here first; "Browse All Lessons" opens the existing Learn exactly as it is.
//
// This page READS the curriculum (through learn-discover-index.json, derived from
// the mounted catalog) and POINTS at it. It owns no lesson, no course, no
// progress record and no preference: opening a lesson hands it to Learn's own
// opener, Continue reads Learn's own saved places, and every course and
// department assignment is untouched. Photographs are the existing approved
// lesson covers; promotional titles ride beside — never instead of — the
// lesson's own title.
// =============================================================================
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import './learn-discover.css';
import INDEX from '../../lib/learn-discover-index.json';
import DATES from '../../lib/lesson-dates.json';
import RECORDS from '../../lib/learn-presentation/presentation-records.json';
import { prepareIndex, discoverSearch } from '../../lib/learn-discover-search.js';
import { CATEGORIES, categoryMembers, MIN_SHOWN } from '../../lib/learn-discover-categories.js';
import { HERO_LESSON, categoryPhotoRow, photoSrc } from '../../lib/learn-discover-photos.js';
import { continueRows, newestRows, featuredRows, relationshipRows } from '../../lib/learn-discover-home.js';
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
const ACCESS = [
  { id: 'lessons', label: 'All Courses', hint: 'Every course, in order', glyph: '▤' },
  { id: 'browse', label: 'All Departments', hint: 'Thirteen areas of study', glyph: '◫' },
  { id: 'record', label: 'My Learning', hint: 'Your progress and record', glyph: '◉' },
  { id: 'tools', label: 'Study Tools', hint: 'Read, listen, quiz, tutor', glyph: '✎' },
  { id: 'downloads', label: 'Downloads', hint: 'Take a course with you', glyph: '⬇' },
];

const bookCache = new Map();
function defaultGetBook(file) {
  if (!bookCache.has(file)) bookCache.set(file, fetch(`${BASE}bible/kjv/${file}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return bookCache.get(file);
}

function Photo({ im, className = '', eager = false, label = '' }) {
  const p = photoSrc(im, BASE);
  // A lesson still waiting for its own picture shows its course name on a panel: never a blank, never new art.
  if (!p) return <span className={`ld-ph ld-ph-none ${className}`} aria-hidden="true">{label}</span>;
  return <img className={`ld-ph ${className}`} src={p.src} srcSet={p.srcSet} sizes="(max-width: 600px) 60vw, 280px" alt="" width="640" height="360" loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}

/** One lesson, as a card: promotional title first, the lesson's own title kept beside it. */
function LessonCard({ row, course, onOpen, reached, note }) {
  const promo = row.p && !row.stale ? row.p : '';
  return (
    <button type="button" className="ld-card" onClick={() => onOpen(course.k, row.i)} data-testid="ld-lesson-card" data-lesson={row.i}>
      <span className="ld-card-pic">
        <Photo im={row.im} label={course.t} />
        {row.h && !row.stale ? <span className="ld-card-hl">{row.h}</span> : null}
        {typeof reached === 'number' ? <span className="ld-bar" aria-hidden="true"><i style={{ width: `${Math.round(reached * 100)}%` }} /></span> : null}
      </span>
      <span className="ld-card-t">{promo || row.t}</span>
      {promo ? <span className="ld-card-o">{row.t}</span> : null}
      <span className="ld-card-m">{note || course.t}</span>
    </button>
  );
}

export default function LearnDiscover({ onBrowseAll, onOpenLesson, onOpenArea, places, getBook = defaultGetBook, now, index = INDEX }) {
  const P = useMemo(() => prepareIndex(index), [index]);
  const members = useMemo(() => categoryMembers(P), [P]);
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [more, setMore] = useState(1);
  const [cat, setCat] = useState(null);
  const [catMore, setCatMore] = useState(1);
  const [word, setWord] = useState(null);
  const [saved] = useState(() => (places ? places : listPlaces({ inProgress: true })));
  const [example, setExample] = useState(0);

  const results = useMemo(() => (deferred.trim() ? discoverSearch(P, deferred) : []), [P, deferred]);
  const cont = useMemo(() => continueRows(P, saved), [P, saved]);
  const newest = useMemo(() => newestRows(P, DATES), [P]);
  const featured = useMemo(() => featuredRows(P, RECORDS.records), [P]);
  const rels = useMemo(() => relationshipRows(P), [P]);
  const hero = P.byId.get(HERO_LESSON);
  const shown = CATEGORIES.filter((c) => (members.get(c.id) || { lessonIds: [] }).lessonIds.length >= MIN_SHOWN);

  useEffect(() => {
    let live = true;
    todaysWord(index, getBook, now || new Date()).then((w) => { if (live) setWord(w); }).catch(() => {});
    return () => { live = false; };
  }, [index, getBook, now]);
  useEffect(() => {
    const t = setInterval(() => setExample((n) => (n + 1) % EXAMPLES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const open = (courseKey, lessonId) => onOpenLesson && onOpenLesson(courseKey, lessonId);
  const asCard = (r, i) => <LessonCard key={`${r.row.i}-${i}`} row={r.row} course={r.course} onOpen={open} reached={r.reached} note={r.day ? `Added ${r.day}` : undefined} />;
  const catRows = cat ? (members.get(cat) || { lessonIds: [] }).lessonIds.map((id) => P.byId.get(id)).filter(Boolean) : [];
  const wordLesson = word ? P.byId.get(word.lessonId) : null;
  const counts = index.counts || {};

  return (
    <section className="ld-root" aria-labelledby="ld-h" data-testid="learn-discover">
      <header className="ld-hero">
        {hero ? <Photo im={hero.raw.im} className="ld-hero-img" eager /> : null}
        <div className="ld-hero-fade" />
        <div className="ld-hero-copy">
          <p className="ld-eyebrow">The Word · Learning Zone</p>
          <h1 id="ld-h" className="ld-h1">Welcome to the Learning Zone</h1>
          <p className="ld-sub">
            {counts.lessons} lessons across {counts.courses} courses. Start with what is on your heart.
          </p>
        </div>
      </header>

      <div className="ld-find">
        <form className="ld-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="ld-q" className="ld-sr">Ask a question or search the curriculum</label>
          <span className="ld-search-ic" aria-hidden="true">⌕</span>
          <input
            id="ld-q"
            type="search"
            inputMode="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={EXAMPLES[example]}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setMore(1); }}
            data-testid="ld-search"
          />
        </form>
        <button type="button" className="ld-browse" onClick={onBrowseAll} data-testid="ld-browse-all">Browse All Lessons</button>
      </div>

      {deferred.trim() ? (
        <section className="ld-sec" aria-live="polite" data-testid="ld-results">
          <div className="ld-sec-h">
            <h2 className="ld-h2">{results.length ? `${results.length} lessons for “${deferred.trim()}”` : `Nothing yet for “${deferred.trim()}”`}</h2>
            <button type="button" className="ld-link" onClick={() => setQuery('')}>Clear</button>
          </div>
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
          {cont.length ? (
            <section className="ld-sec" aria-labelledby="ld-cont-h" data-testid="ld-continue">
              <div className="ld-sec-h"><h2 id="ld-cont-h" className="ld-h2">Continue Learning</h2></div>
              <div className="ld-rail">{cont.map(asCard)}</div>
            </section>
          ) : null}

          {word ? (
            <section className="ld-sec" aria-labelledby="ld-word-h" data-testid="ld-word">
              <div className="ld-word">
                <p className="ld-eyebrow" id="ld-word-h">Today’s Word</p>
                <blockquote className="ld-verse"><p>{word.text}</p><footer>{word.ref} · {word.translation}</footer></blockquote>
                {wordLesson ? <button type="button" className="ld-link ld-word-go" onClick={() => open(wordLesson.course.k, wordLesson.raw.i)}>Go deeper: {wordLesson.raw.p && !wordLesson.raw.stale ? wordLesson.raw.p : wordLesson.raw.t} ›</button> : null}
              </div>
            </section>
          ) : null}

          <section className="ld-sec" aria-labelledby="ld-cat-h" data-testid="ld-categories">
            <div className="ld-sec-h"><h2 id="ld-cat-h" className="ld-h2">What do you need today?</h2></div>
            <div className="ld-rail ld-rail-cats">
              {shown.map((c) => {
                const m = members.get(c.id);
                const ph = categoryPhotoRow(P, c.id, m.lessonIds);
                return (
                  <button key={c.id} type="button" className="ld-cat" aria-pressed={cat === c.id} onClick={() => { setCat(cat === c.id ? null : c.id); setCatMore(1); }} data-testid="ld-category" data-cat={c.id}>
                    <Photo im={ph && ph.im} />
                    <span className="ld-cat-t">{c.label}</span>
                    <span className="ld-cat-n">{m.lessonIds.length} lessons</span>
                  </button>
                );
              })}
            </div>
            {cat ? (
              <div className="ld-shelf" data-testid="ld-category-shelf">
                <div className="ld-sec-h">
                  <h3 className="ld-h3">{(CATEGORIES.find((c) => c.id === cat) || {}).blurb}</h3>
                  <span className="ld-small">{Math.min(catRows.length, catMore * 12)} of {catRows.length}</span>
                </div>
                <div className="ld-rail">{catRows.slice(0, catMore * 12).map((L, i) => asCard({ row: L.raw, course: L.course }, i))}</div>
                {catRows.length > catMore * 12 ? <button type="button" className="ld-more" onClick={() => setCatMore(catMore + 1)}>Show 12 more</button> : null}
              </div>
            ) : null}
          </section>

          {featured.length ? (
            <section className="ld-sec" aria-labelledby="ld-feat-h" data-testid="ld-featured">
              <div className="ld-sec-h"><h2 id="ld-feat-h" className="ld-h2">Featured lessons</h2></div>
              <div className="ld-rail">{featured.map(asCard)}</div>
            </section>
          ) : null}

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
                <button key={a.id} type="button" className="ld-tile" onClick={() => onOpenArea && onOpenArea(a.id)} data-testid={`ld-access-${a.id}`}>
                  <span className="ld-tile-g" aria-hidden="true">{a.glyph}</span>
                  <span className="ld-tile-t">{a.label}</span>
                  <span className="ld-tile-h">{a.hint}</span>
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
