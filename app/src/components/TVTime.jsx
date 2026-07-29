// =============================================================================
// TVTime — PoeTech TV Time (Darrell 2026-07-04). Look up a show, its poster comes
// up, every season + episode comes in, and you check off what you've watched —
// plus talk about it and laugh together, and (the PoeTech twist) watch it through
// The Way. Import your old list by pasting titles. It's a PWA, so the friends
// install it on iOS + Android + desktop from one link.
//
// Surface only. State/transforms: ../lib/tv-time.js (pure, tested). Show lookup:
// ../lib/tv-catalog.js (TVmaze, browser fetch, fail-soft). Device-local + private.
// Accessibility: white cards, #1A1815 body, #5A5751 secondary, #B85838 focus (AA);
// no device-font emoji (icons via UiIcon). Posters are external (TVmaze); a broken
// image collapses to a titled placeholder.
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import {
  STATUSES, REACTIONS,
  loadTv, saveTv, bucketShows, customCatalog, addCustomShow, addShowFromCatalog, addMovieFromCatalog, toggleMovieWatched,
  setStatus, untrack, rateShow, addComment, getComments, toggleReaction, reactionCount,
  discernmentPromptFor, toggleEpisode, isEpisodeWatched, setSeasonWatched, showProgress, seasonProgress,
  trendingWatches, exportTv, importTvJson, touchTv, tvUpdatedAt,
} from '../lib/tv-time.js';
import { searchTitles, loadShow, resolvePoster, TV_SOURCE, MOVIE_SOURCE, GENRES, genreMatches } from '../lib/tv-catalog.js';
import { relatedTitles, franchiseOf, titleKey } from '../lib/tv-franchises.js';
import { fetchTvCloud, pushTvCloud, subscribeTvRealtime, mergeTvCloud } from '../lib/tv-time-sync.js';
import { importTvTimeZip, looksLikeZip } from '../lib/tv-time-import-zip.js';
import { POPULAR_SHOWS, popularByGenre, popularCount } from '../lib/tv-popular.js';
import { AUDIENCES, shareFlags, setShowShare } from '../lib/tv-sharing.js';
import { TV_SHARING_ENABLED } from '../lib/tv-circle-sync.js';
import TVCircle from './TVCircle.jsx';
import SectionTabs from './SectionTabs.jsx';
import { createDebouncer } from '../lib/table-sync.js';

const serif = { fontFamily: '"Fraunces", serif' };
const BTN = 'text-[0.6875rem] uppercase tracking-wider px-2 py-1 focus:outline focus:outline-2 focus:outline-[#B85838]';

// Posters come from the catalog. Most items already carry one (a search result, a
// popular pick). Imported shows do NOT — a TV Time export has no artwork, so they
// arrive with poster:''. When `resolve` is set and the url is empty, we look the
// title up in the catalog and fill the picture in — but LAZILY, only once the card
// scrolls into view (IntersectionObserver), so a 100+ show imported list resolves
// a few at a time as you scroll instead of bursting the free API. Fail-soft: no
// match / any error leaves the titled placeholder exactly as before.
function Poster({ url, title, kind, resolve = false, className = 'w-12 h-16' }) {
  const [broken, setBroken] = useState(false);
  const [found, setFound] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    if (url || found || !resolve || !title) return undefined;
    let live = true;
    const go = () => resolvePoster(title, kind === 'movie' ? 'movie' : 'show')
      .then((u) => { if (live && u) setFound(u); })
      .catch(() => { /* fail-soft: placeholder stays */ });
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { go(); return () => { live = false; }; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); go(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => { live = false; io.disconnect(); };
  }, [url, found, resolve, title, kind]);
  const src = url || found;
  if (src && !broken) {
    return <img ref={ref} src={src} alt={`${title} poster`} loading="lazy" onError={() => setBroken(true)} className={`${className} object-cover border border-[#E8E4DC] shrink-0`} />;
  }
  return (
    <span ref={ref} className={`${className} shrink-0 border border-[#E8E4DC] bg-[#FAF8F4] flex items-center justify-center text-[0.5rem] uppercase tracking-wider text-[#5A5751] text-center p-0.5`}>{title.slice(0, 18)}</span>
  );
}

function Stars({ value, onRate }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onRate(n === value ? 0 : n)} aria-label={`${n} of 5`} aria-pressed={n <= value}
          className={`leading-none focus:outline focus:outline-2 focus:outline-[#B85838] ${n <= value ? 'text-[#B85838]' : 'text-[#C9BFA8]'}`}>
          <UiIcon name={n <= value ? 'heartFilled' : 'heart'} />
        </button>
      ))}
    </span>
  );
}

// What's getting watched — a real-data activity ranking (Darrell 2026-07-04:
// "update the shows list dynamically based on what people are watching"). Reads
// the live list. Honestly scoped: circle sharing IS live (TVCircle below), but
// this strip deliberately ranks YOUR OWN list's activity — shows others shared
// have their own feed in the circle section; no cross-person data mixes in here.
function TrendingStrip({ items }) {
  if (!items.length) return null;
  return (
    <section className="bg-[#1A1815] text-white p-3 mb-3" aria-labelledby="tv-trending">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 id="tv-trending" className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#E8B84B] font-semibold">What’s getting watched</h3>
        <span className="text-[0.5625rem] text-[#C9BFA8]">Ranked by activity in your own list · your circle’s picks live in “Your circle” below</span>
      </div>
      <ol className="space-y-1.5">
        {items.map((r, i) => (
          <li key={r.id} className="flex items-center gap-2.5">
            <span className="text-[0.6875rem] text-[#E8B84B] w-4 shrink-0 text-right" aria-hidden="true">{i + 1}</span>
            <Poster url={r.poster} title={r.title} kind={r.kind} resolve className="w-7 h-10" />
            <span className="min-w-0">
              <span className="text-sm text-white block truncate" style={{ ...serif, fontWeight: 600 }}>
                {r.title}
                {r.kind === 'movie' && <span className="text-[0.5rem] uppercase tracking-wider text-[#C9BFA8] border border-[#5A5751] px-1 py-0.5 ml-1.5 align-middle">Movie</span>}
              </span>
              <span className="text-[0.6875rem] text-[#C9BFA8]">{r.reason}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// The seasons + episode checkmarks (Darrell: "check off each show you watched…
// it brings in all the seasons so you know how many seasons of each show it is").
function EpisodeList({ show, isWatched, onToggleEp, onToggleSeason, progressFor }) {
  const [openSeason, setOpenSeason] = useState(show.seasons && show.seasons.length ? show.seasons[0].season : null);
  if (!show.seasons || !show.seasons.length) {
    return <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={serif}>No episode list for this one — track it and check it off by hand.</p>;
  }
  return (
    <div className="mt-2 space-y-1">
      {show.seasons.map((s) => {
        const p = progressFor(s.season);
        const open = openSeason === s.season;
        const done = p.total > 0 && p.watched === p.total;
        return (
          <div key={s.season} className="border border-[#E8E4DC]">
            <div className="flex items-center justify-between gap-2 px-2 py-1 bg-[#FAF8F4]">
              <button type="button" onClick={() => setOpenSeason(open ? null : s.season)} aria-expanded={open}
                className="flex items-center gap-2 text-left focus:outline focus:outline-2 focus:outline-[#B85838]">
                <span className="text-[0.6875rem] uppercase tracking-wider text-[#1A1815] font-semibold" style={serif}>Season {s.season}</span>
                <span className={`text-[0.625rem] ${done ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`}>{p.watched}/{p.total}{done ? ' ✓' : ''}</span>
              </button>
              <button type="button" onClick={() => onToggleSeason(s.season, !done)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>{done ? 'Clear season' : 'Mark all'}</button>
            </div>
            {open && (
              <ul className="divide-y divide-[#F2EFE9]">
                {s.episodes.map((e) => {
                  const w = isWatched(s.season, e.number);
                  return (
                    <li key={e.number}>
                      <button type="button" onClick={() => onToggleEp(s.season, e.number)} aria-pressed={w}
                        className="w-full flex items-center gap-2 px-2 py-1 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
                        <span className={`inline-flex items-center justify-center w-4 h-4 border shrink-0 ${w ? 'bg-[#2F6B33] border-[#2F6B33] text-white' : 'border-[#C9BFA8] text-transparent'}`} aria-hidden="true"><UiIcon name="check" /></span>
                        <span className="text-[0.6875rem] text-[#5A5751] w-8 shrink-0" style={serif}>E{e.number}</span>
                        <span className={`text-sm ${w ? 'text-[#5A5751] line-through' : 'text-[#1A1815]'}`} style={serif}>{e.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ShowCard({ show, me, state, onStatus, onRate, onAddComment, onReact, onUntrack, onToggleEp, onToggleSeason, onToggleMovie, onAddByTitle, onShare, trackedKeys, busy }) {
  const [tab, setTab] = useState(null); // 'episodes' | 'talk' | null
  const [draft, setDraft] = useState('');
  const comments = getComments(state, show.id);
  const prog = showProgress(state, show.id);
  const isMovie = show.kind === 'movie';
  const seen = show.status === 'watched';
  // Same-universe connections (curated; only real spinoffs — never guessed).
  const related = relatedTitles(show.title);
  const universe = related.length ? franchiseOf(show.title) : '';
  const send = () => { const t = draft.trim(); if (!t) return; onAddComment(show.id, t); setDraft(''); };
  return (
    <div className="bg-white border border-[#1A1815] p-3">
      <div className="flex items-start gap-3">
        <Poster url={show.poster} title={show.title} kind={show.kind} resolve />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <span style={{ ...serif, fontWeight: 600 }} className="text-[#1A1815]">{show.title}</span>
              {isMovie && <span className="text-[0.5rem] uppercase tracking-wider text-[#5A6E3D] border border-[#C9BFA8] px-1 py-0.5 ml-2 align-middle">Movie</span>}
              <span className="text-[0.6875rem] text-[#5A5751] ml-2">{[show.year, show.network, show.genre].filter(Boolean).join(' · ')}</span>
            </div>
            <Stars value={show.rating || 0} onRate={(n) => onRate(show.id, n)} />
          </div>
          {!isMovie && prog.total > 0 && (
            <p className="text-[0.6875rem] text-[#5A6E3D] mt-0.5" style={serif}>{prog.watched} / {prog.total} episodes watched{prog.watched === prog.total ? ' — all caught up!' : ''}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            {isMovie ? (
              // A movie is a single watch — one tap marks it seen (moves it to Watched).
              <button type="button" onClick={() => onToggleMovie(show.id)} aria-pressed={seen}
                className={`${BTN} inline-flex items-center gap-1.5 border ${seen ? 'bg-[#2F6B33] border-[#2F6B33] text-white' : 'border-[#C9BFA8] text-[#5A6E3D] hover:text-[#1A1815]'}`}>
                <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border ${seen ? 'border-white text-white' : 'border-[#C9BFA8] text-transparent'}`} aria-hidden="true"><UiIcon name="check" /></span>
                {seen ? 'Watched' : 'Mark watched'}
              </button>
            ) : (
              <>
                <label className="sr-only" htmlFor={`st-${show.id}`}>Status for {show.title}</label>
                <select id={`st-${show.id}`} value={show.status} onChange={(e) => onStatus(show.id, e.target.value)}
                  className="text-[0.6875rem] border border-[#E8E4DC] bg-white text-[#1A1815] px-2 py-1 focus:outline focus:outline-2 focus:outline-[#B85838]">
                  {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <button type="button" onClick={() => setTab(tab === 'episodes' ? null : 'episodes')} aria-expanded={tab === 'episodes'} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>Episodes</button>
              </>
            )}
            <button type="button" onClick={() => setTab(tab === 'talk' ? null : 'talk')} aria-expanded={tab === 'talk'} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>Talk{comments.length ? ` (${comments.length})` : ''}</button>
            <button type="button" onClick={() => onUntrack(show.id)} className={`${BTN} text-[#991B1B] hover:underline`}>Remove</button>
          </div>
          {/* Who sees this? — per-show visibility (family-sharing model). PRIVATE by
              default; you opt each show into independent audiences. This is the real,
              saved control; the shared Family/Circle VIEWS turn on once your circle
              is set up and the data-isolation test passes (nothing shared leaks). */}
          {onShare && (() => {
            const flags = shareFlags(state && state.shows ? state.shows[show.id] : null);
            const priv = !flags.us && !flags.family && !flags.circle;
            return (
              <div className="mt-2 border-t border-[#F2EFE9] pt-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold inline-flex items-center gap-1"><UiIcon name="lock" /> Who sees this?</span>
                  {AUDIENCES.map((a) => {
                    const on = flags[a.key];
                    return (
                      <button key={a.key} type="button" onClick={() => onShare(show.id, a.key, !on)} aria-pressed={on} title={a.hint}
                        className={`text-[0.625rem] px-1.5 py-0.5 border focus:outline focus:outline-2 focus:outline-[#B85838] ${on ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>
                        {a.label}
                      </button>
                    );
                  })}
                  {priv && <span className="text-[0.5625rem] text-[#5A5751]">Just you</span>}
                </div>
              </div>
            );
          })()}
          {related.length > 0 && (
            <div className="mt-2 border-t border-[#F2EFE9] pt-1.5">
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">Same universe{universe ? ` · ${universe}` : ''}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {related.map((t) => {
                  const have = trackedKeys && trackedKeys.has(titleKey(t));
                  const loading = busy === `u:${t}`;
                  return have ? (
                    <span key={t} className="text-[0.625rem] px-1.5 py-0.5 border border-[#C9BFA8] text-[#5A6E3D] inline-flex items-center gap-1"><UiIcon name="check" /> {t}</span>
                  ) : (
                    <button key={t} type="button" disabled={loading} onClick={() => onAddByTitle(t)}
                      className="text-[0.625rem] px-1.5 py-0.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50">
                      {loading ? 'Adding…' : `+ ${t}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isMovie && tab === 'episodes' && (
        <EpisodeList show={show}
          isWatched={(se, nu) => isEpisodeWatched(state, show.id, se, nu)}
          onToggleEp={(se, nu) => onToggleEp(show.id, se, nu)}
          onToggleSeason={(se, on) => onToggleSeason(show.id, se, on)}
          progressFor={(se) => seasonProgress(state, show.id, se)} />
      )}

      {tab === 'talk' && (
        <div className="mt-2 border-t border-[#E8E4DC] pt-2">
          <div className="bg-[#FAF8F4] border-l-2 border-[#5A6E3D] pl-2.5 pr-2 py-1.5 mb-2">
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">Watch it through The Way</span>
            <p className="text-xs text-[#1A1815]" style={serif}>{discernmentPromptFor(show.id)}</p>
          </div>
          <div className="space-y-2 mb-2">
            {comments.length ? comments.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="text-[0.6875rem] text-[#5A6E3D] font-semibold">{c.author}</span>
                <p className="text-[#1A1815]" style={serif}>{c.text}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {REACTIONS.map((r) => {
                    const n = reactionCount(c, r.key);
                    const mine = Array.isArray(c.reactions?.[r.key]) && c.reactions[r.key].includes(me);
                    return (
                      <button key={r.key} type="button" onClick={() => onReact(show.id, c.id, r.key)} aria-pressed={mine} title={r.label}
                        className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border focus:outline focus:outline-2 focus:outline-[#B85838] ${mine ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>
                        {r.label}{n ? ` ${n}` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )) : <p className="text-xs text-[#5A5751] italic" style={serif}>No one’s said anything yet — start it off.</p>}
          </div>
          <div className="flex gap-1.5">
            <label className="sr-only" htmlFor={`cm-${show.id}`}>Add a comment</label>
            <input id={`cm-${show.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="What did you think? Keep it real…" className="flex-1 text-sm px-2 py-1 border border-[#E8E4DC] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif} />
            <button type="button" onClick={send} disabled={!draft.trim()} className={`${BTN} border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50`}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

// A single "Popular pick" card in the browse grid. The poster + real genre
// resolve lazily from the catalog when the card mounts (only once the Popular
// section is open, so it's not fetched on every TV Time load). Tapping Add runs
// the SAME add-by-title flow as search; a show already on your list shows ✓.
function PopularCard({ title, genre, tracked, onAdd, busy }) {
  const [poster, setPoster] = useState('');
  useEffect(() => {
    let live = true;
    searchTitles(title).then((hits) => {
      const h = hits && hits[0];
      if (live && h && h.poster) setPoster(h.poster);
    }).catch(() => { /* no poster — the titled placeholder still shows */ });
    return () => { live = false; };
  }, [title]);
  const adding = busy === `u:${title}`;
  return (
    <div className="bg-white border border-[#1A1815] p-2 flex flex-col gap-1.5">
      <Poster url={poster} title={title} className="w-full aspect-[2/3]" />
      <div className="min-w-0">
        <div className="text-[0.75rem] font-semibold text-[#1A1815] leading-tight" style={serif}>{title}</div>
        <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{genre}</div>
      </div>
      {tracked ? (
        <span className="mt-auto inline-flex items-center gap-1 text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">
          <UiIcon name="check" /> On your list
        </span>
      ) : (
        <button type="button" onClick={() => onAdd(title)} disabled={adding}
          className={`${BTN} mt-auto border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50`}>
          {adding ? 'Adding…' : '+ Add'}
        </button>
      )}
    </div>
  );
}

// The "Popular picks" browse grid, grouped by genre (Darrell 2026-07-04: "click a
// tab and it will sort what we have inside as a list already under drama etc" +
// "it should be able to show all below" — so a genre chip surfaces the popular
// shows in that genre instead of dead-ending on "none in your list"). A curated
// starter set (honest — not a live chart); already-tracked shows are hidden so it
// reads as "what you don't have yet". When `genre` is set, shows just that genre.
function PopularBrowse({ trackedKeys, onAddByTitle, busy, genre = '' }) {
  const exclude = useMemo(() => new Set(POPULAR_SHOWS
    .filter((s) => trackedKeys.has(titleKey(s.title)))
    .map((s) => s.title.toLowerCase().trim())), [trackedKeys]);
  const groups = useMemo(() => {
    const all = popularByGenre(POPULAR_SHOWS, undefined, exclude);
    return genre ? all.filter((grp) => genreMatches(grp.genre, genre)) : all;
  }, [exclude, genre]);
  if (!groups.length) {
    return (
      <p className="text-sm text-[#5A5751]" style={serif}>
        No {genre ? `${genre} ` : ''}picks here yet — look one up above and it comes right in.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {groups.map((grp) => (
        <section key={grp.genre} aria-labelledby={`pop-${grp.genre}`}>
          {!genre && <h4 id={`pop-${grp.genre}`} className="text-[0.625rem] uppercase tracking-[0.25em] text-[#1A1815] font-semibold mb-2">{grp.genre}</h4>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {grp.shows.map((s) => (
              <PopularCard key={s.title} title={s.title} genre={s.genre}
                tracked={trackedKeys.has(titleKey(s.title))} onAdd={onAddByTitle} busy={busy} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function TVTime({ email = null }) {
  const [state, setState] = useState(() => loadTv(email));
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null); // null idle, [] none, [..] hits
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const seq = useRef(0);
  const me = useMemo(() => (email ? String(email).split('@')[0] : 'You'), [email]);

  const catalog = useMemo(() => [...customCatalog(state)], [state]);
  const buckets = useMemo(() => bucketShows(state, catalog), [state, catalog]);
  const trending = useMemo(() => trendingWatches(state, catalog, 5), [state, catalog]);
  // Which titles are already tracked (by universe key) — so a "same universe"
  // sibling shows as done rather than an add button. And the tracked list flat.
  const tracked = useMemo(() => STATUSES.flatMap((st) => buckets[st.key]), [buckets]);
  const trackedKeys = useMemo(() => new Set(tracked.map((s) => titleKey(s.title || s.id))), [tracked]);
  const [genreFilter, setGenreFilter] = useState('');
  const [popularOpen, setPopularOpen] = useState(false);
  // Condensed poster WALL vs full cards (Darrell 2026-07-05, from the TV Time
  // app's grid: "a more condensed view … for quick and easy choosing"). Sticky
  // per device; first-time default = wall once the list is big enough that
  // scrolling cards is slower than scanning posters.
  const [viewMode, setViewMode] = useState(() => {
    try { const v = localStorage.getItem('poe-tv-view'); if (v === 'wall' || v === 'squares' || v === 'cards') return v; } catch { /* fresh */ }
    return null; // decided from list size on first render
  });
  const [focusId, setFocusId] = useState(null); // grid tile tapped → its card opens
  const activeView = viewMode || (tracked.length > 9 ? 'wall' : 'cards');
  // 'wall' (tall 2:3 posters) and 'squares' (Darrell 2026-07-05: "a view that has
  // squares" — 1:1 tiles, art cropped to fill) are both the condensed grid; they
  // differ only in tile shape. 'cards' is the full detail list.
  const wallMode = activeView === 'wall' || activeView === 'squares';
  const tileAspect = activeView === 'squares' ? 'aspect-square' : 'aspect-[2/3]';
  const pickView = (v) => { setViewMode(v); setFocusId(null); try { localStorage.setItem('poe-tv-view', v); } catch { /* device-local nicety */ } };
  // Poster-size slider (Darrell 2026-07-05: "adjust image sizes with a slider so
  // it's smaller or bigger based on the position"). The value is the tile's MIN
  // width in rem; the grid auto-fills, so sliding smaller packs more posters per
  // row and sliding bigger shows fewer, larger ones. Sticky per device.
  const [wallSize, setWallSize] = useState(() => {
    try { const n = parseFloat(localStorage.getItem('poe-tv-wall-size')); if (Number.isFinite(n) && n >= 3.5 && n <= 14) return n; } catch { /* fresh */ }
    return 6; // rem — lands ~3 columns on a phone, ~6 on a laptop
  });
  const pickWallSize = (n) => { setWallSize(n); try { localStorage.setItem('poe-tv-wall-size', String(n)); } catch { /* device-local nicety */ } };

  // Cross-device sync (owner-only; fail-soft — offline degrades to device-local).
  const stateRef = useRef(state);
  stateRef.current = state;
  const pushCloud = useRef(null);
  if (!pushCloud.current) pushCloud.current = createDebouncer((st) => { pushTvCloud(st, tvUpdatedAt(st) || safeNowIso()); }, 900);

  // A local change: stamp it (newest-wins), save on-device, render, and (signed
  // in) write it up to the family server for the owner's other devices.
  const persist = (next) => {
    const stamped = touchTv(next, safeNowIso());
    saveTv(email, stamped);
    setState(stamped);
    if (email) pushCloud.current(stamped);
  };

  // On sign-in: pull the owner's cloud list, merge (newest-wins / union), and
  // subscribe so a change on another device shows up here live.
  useEffect(() => {
    if (!email) return undefined;
    let alive = true;
    const pull = async () => {
      const cloud = await fetchTvCloud();
      if (!alive || !cloud) return;
      const { state: merged, push } = mergeTvCloud(stateRef.current, cloud);
      const at = tvUpdatedAt(merged) || safeNowIso();
      const stamped = push ? touchTv(merged, at) : merged;
      saveTv(email, stamped);
      if (alive) setState(stamped);
      if (push) pushTvCloud(stamped, at);
    };
    pull();
    const unsub = subscribeTvRealtime(pull);
    return () => { alive = false; if (unsub) unsub(); };
  }, [email]);

  // Live search — shows AND movies as you type (debounced). The reason typing didn't
  // populate before (Darrell 2026-07-04) — now it does, and "movies too?".
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults(null); setSearching(false); return undefined; }
    let alive = true;
    setSearching(true);
    const t = setTimeout(async () => {
      const rows = await searchTitles(q);
      if (alive) { setResults(rows); setSearching(false); }
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);

  // Add a result: a show brings in its seasons (a second fetch); a movie is a
  // single-watch item and its search brief already has everything.
  const addFromResult = async (brief) => {
    setBusy(brief.id);
    if (brief.kind === 'movie') {
      persist(addMovieFromCatalog(state, brief));
    } else {
      const full = await loadShow(brief.id);
      persist(addShowFromCatalog(state, full || brief));
    }
    setBusy(''); setQuery(''); setResults(null);
  };
  const onStatus = (id, s) => persist(setStatus(state, id, s));
  const onRate = (id, n) => persist(rateShow(state, id, n));
  const onUntrack = (id) => persist(untrack(state, id));
  // Per-show visibility: flip one audience (us/family/circle) on a show. Saves to
  // your own list (and syncs across your devices); the shared views read it later.
  const onShare = (id, audience, on) => persist(setShowShare(state, id, audience, on));
  const onAddComment = (id, text) => { seq.current += 1; persist(addComment(state, id, { author: me, text }, safeNow(), seq.current)); };
  const onReact = (id, cid, rk) => persist(toggleReaction(state, id, cid, rk, me));
  const onToggleEp = (id, se, nu) => persist(toggleEpisode(state, id, se, nu));
  const onToggleSeason = (id, se, on) => persist(setSeasonWatched(state, id, se, on));
  const onToggleMovie = (id) => persist(toggleMovieWatched(state, id));

  // Add a connected title (a "same universe" sibling) by name: look it up and
  // bring it in — a show with its seasons, a movie as a single watch.
  const onAddByTitle = async (title) => {
    setBusy(`u:${title}`);
    const hits = await searchTitles(title);
    const hit = hits && hits[0];
    if (hit && hit.kind === 'movie') persist(addMovieFromCatalog(state, hit));
    else if (hit) { const full = await loadShow(hit.id); persist(addShowFromCatalog(state, full || hit)); }
    else persist(addCustomShow(state, { title }));
    setBusy('');
  };

  // Import your old list: paste titles (one per line). Each is looked up (show or
  // movie); a show brings in its seasons, a movie comes in as a single watch, and
  // no match is kept as a plain title.
  const runImport = async () => {
    const titles = importText.split('\n').map((t) => t.trim()).filter(Boolean).slice(0, 40);
    if (!titles.length) return;
    setImportMsg('Looking up your list…');
    let next = state; let added = 0; let missed = 0;
    for (const title of titles) {
      const hits = await searchTitles(title);
      const hit = hits && hits[0];
      if (hit && hit.kind === 'movie') {
        next = addMovieFromCatalog(next, hit); added += 1;
      } else if (hit) {
        const full = await loadShow(hit.id);
        next = addShowFromCatalog(next, full || hit); added += 1;
      } else { next = addCustomShow(next, { title }); missed += 1; }
    }
    persist(next);
    setImportMsg(`Added ${added} title${added === 1 ? '' : 's'}${missed ? `, ${missed} kept as a plain title (no match)` : ''}.`);
    setImportText('');
  };

  // Your data is yours — download the whole list (full fidelity) as a file.
  const exportList = () => {
    try {
      const blob = new Blob([JSON.stringify(exportTv(state), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'poetech-tv-time.json';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setImportMsg('Downloaded your list — that file is yours to keep.');
    } catch { setImportMsg('Could not export here — try from the installed app.'); }
  };

  // Restore from a file (merges in, restore-wins). Two real shapes are accepted:
  //   • a PoeTech backup (.json) — the file exportList() writes.
  //   • a TV Time GDPR export (.zip) — the ~55-CSV archive TV Time actually hands
  //     you (Christina 2026-07-04: the zip had nowhere to go). We detect the zip
  //     by its magic bytes and map its real CSVs into the list. Anyone in the
  //     friend group brings their OWN export in this way — their data, one tap.
  const restoreFile = async (file) => {
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const before = STATUSES.reduce((n, st) => n + buckets[st.key].length, 0);
      if (looksLikeZip(buf)) {
        setImportMsg('Reading your TV Time export…');
        const { state: mapped, summary, ok } = await importTvTimeZip(buf);
        if (!ok) { setImportMsg('That .zip didn’t look like a TV Time export (no shows found).'); return; }
        persist(importTvJson(state, mapped));
        setImportMsg(`Imported ${summary.shows} show${summary.shows === 1 ? '' : 's'}${summary.episodes ? ` and ${summary.episodes} watched episode${summary.episodes === 1 ? '' : 's'}` : ''} from your TV Time export.`);
        return;
      }
      const text = new TextDecoder('utf-8').decode(buf);
      const next = importTvJson(state, JSON.parse(text || '{}'));
      persist(next);
      const after = STATUSES.reduce((n, st) => n + bucketShows(next, customCatalog(next))[st.key].length, 0);
      setImportMsg(`Restored — ${Math.max(0, after - before)} added from your backup.`);
    } catch { setImportMsg('That file wasn’t a PoeTech backup or a TV Time export.'); }
  };

  const anyTracked = STATUSES.some((st) => buckets[st.key].length);
  const genreEmpty = genreFilter && !tracked.some((s) => genreMatches(s.genre, genreFilter));

  return (
    <div className="w-full">
      <SectionTitle eyebrow="Shows & movies · check off every episode · talk it · watch it through The Way">PoeTech TV Time</SectionTitle>

      <p className="text-sm text-[#1A1815] mb-2" style={serif}>
        Keep up with your shows and movies and talk about them with your people. Look one up — a show’s seasons come in and you check off each episode; a movie is a single tap to mark watched. It lives in the PoeTech App (a website you install on any phone or computer), so it’s not going anywhere.
      </p>
      <p className="text-[0.6875rem] text-[#5A5751] mb-3" style={serif}>
        {email ? <span className="text-[#5A6E3D]">Your list follows your sign-in across your devices</span> : <span>Your list is saved on this device</span>}; <span className="text-[#5A6E3D]">circle sharing is live — start or join a circle in “Your circle” below to share your tagged shows</span>. Show info + posters: {TV_SOURCE.name}; movies: {MOVIE_SOURCE.name}.
      </p>

      {/* Look up a show — live search. */}
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Look up a show</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportList} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>Export my list</button>
            <button type="button" onClick={() => { setImportOpen((v) => !v); setImportMsg(''); }} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>{importOpen ? 'Close import' : 'Import my old list'}</button>
          </div>
        </div>
        <label className="sr-only" htmlFor="tv-search">Search for a show</label>
        <input id="tv-search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off"
          placeholder="Type a show — e.g. Game of Thrones" className="w-full text-sm px-2 py-1.5 border border-[#E8E4DC] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif} />
        {query.trim().length >= 2 && (
          <div className="mt-1 border border-[#E8E4DC] bg-white max-h-80 overflow-y-auto divide-y divide-[#F2EFE9]" aria-live="polite">
            {searching && <p className="text-xs text-[#5A5751] p-2" style={serif}>Searching {TV_SOURCE.name}…</p>}
            {!searching && results && results.length === 0 && (
              <div className="p-2">
                <p className="text-xs text-[#5A5751]" style={serif}>No match. You can still add it as a plain title:</p>
                <button type="button" onClick={() => { persist(addCustomShow(state, { title: query.trim() })); setQuery(''); }} className={`${BTN} text-[#B85838] hover:text-[#1A1815] mt-1`}>+ Add “{query.trim()}”</button>
              </div>
            )}
            {!searching && results && results.map((r) => (
              <button key={r.id} type="button" disabled={busy === r.id} onClick={() => addFromResult(r)}
                className="w-full flex items-center gap-2 p-2 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-50">
                <Poster url={r.poster} title={r.title} className="w-9 h-12" />
                <span className="min-w-0">
                  <span className="text-sm text-[#1A1815] block truncate" style={{ ...serif, fontWeight: 600 }}>
                    {r.title}
                    {r.kind === 'movie' && <span className="text-[0.5rem] uppercase tracking-wider text-[#5A6E3D] border border-[#C9BFA8] px-1 py-0.5 ml-1.5 align-middle">Movie</span>}
                  </span>
                  <span className="text-[0.6875rem] text-[#5A5751]">{[r.year, r.network, r.genre].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="ml-auto text-[0.625rem] uppercase tracking-wider text-[#B85838] shrink-0">{busy === r.id ? 'Adding…' : '+ Add'}</span>
              </button>
            ))}
          </div>
        )}
        {importOpen && (
          <div className="mt-2 border-t border-[#E8E4DC] pt-2">
            <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" htmlFor="tv-import">Paste your shows — one per line</label>
            <textarea id="tv-import" rows={5} value={importText} onChange={(e) => setImportText(e.target.value)}
              placeholder={'Game of Thrones\nThe Real Housewives\nBreaking Bad'} className="w-full text-sm px-2 py-1 border border-[#E8E4DC] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838] mt-1" style={serif} />
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <button type="button" onClick={runImport} disabled={!importText.trim()} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>Bring them in</button>
              <label className={`${BTN} border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white cursor-pointer`}>
                Import from a file (.zip or .json)
                <input type="file" accept=".zip,.json,application/zip,application/json" className="sr-only" onChange={(e) => { restoreFile(e.target.files && e.target.files[0]); e.target.value = ''; }} />
              </label>
              {importMsg && <span className="text-[0.6875rem] text-[#5A6E3D]" style={serif}>{importMsg}</span>}
            </div>
            <p className="text-[0.6875rem] text-[#5A5751] mt-1.5 leading-relaxed" style={serif}>
              Coming from TV&nbsp;Time? Download your data from their app (Settings → your export gives a <strong>.zip</strong>), then tap <strong>Import from a file</strong> above and pick that .zip — your shows and watched episodes come right in. It&apos;s your data.
            </p>
          </div>
        )}
      </div>

      {/* What's getting watched — dynamic, from real activity. PINNED above the
          section strip (the KPI-style summary stays always visible). */}
      <TrendingStrip items={trending} />

      <SectionTabs sections={[
        { id: 'shows', label: 'My shows & picks', icon: 'monitor', render: renderShows },
        // Family/circle sharing — LIVE. TV_SHARING_ENABLED opened 2026-07-04 after
        // the data-isolation smoke test passed against the real database
        // (tv-circle-sync.js); the flag remains the kill-switch — flipped false,
        // the section is filtered out entirely (no empty panel, no dead tab).
        TV_SHARING_ENABLED ? { id: 'circle', label: 'Your circle', icon: 'users', render: renderCircle } : null,
      ]} ariaLabel="TV Time sections" idBase="tvtime" defaultId="shows" />
    </div>
  );

  // The shows-and-picks flow. One section on purpose: the genre chips filter
  // BOTH your tracked list AND the Popular picks below them (never a dead end),
  // so splitting them across tabs would break that promise. Plain closure over
  // the top-level state — no hooks in here.
  function renderShows() {
    return (
      <>
      {/* Browse by genre — a chip filters BOTH your tracked list AND the Popular
          picks below (Darrell 2026-07-04: pick a genre and it shows all in that
          genre, never a dead end). Always shown, so an empty list still browses. */}
      <section className="mb-4" aria-labelledby="tv-genres">
        <h3 id="tv-genres" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">Browse by genre <span className="text-[#B85838] normal-case tracking-normal font-normal">· your list + popular picks</span>{genreFilter && <button type="button" onClick={() => setGenreFilter('')} className="text-[#B85838] hover:underline normal-case tracking-normal ml-1 font-normal">clear “{genreFilter}”</button>}</h3>
        <div className="flex flex-wrap gap-1">
          {GENRES.map((g) => {
            const on = genreFilter === g;
            return (
              <button key={g} type="button" onClick={() => setGenreFilter(on ? '' : g)} aria-pressed={on}
                className={`text-[0.625rem] px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${on ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:text-[#1A1815]'}`}>{g}</button>
            );
          })}
        </div>
      </section>

      {/* View toggle — the condensed poster WALL (like the TV Time app's grid;
          Darrell 2026-07-05) vs the full cards. Only shown once there's a list. */}
      {anyTracked && (
        <div className="flex items-center gap-1.5 mb-2 flex-wrap" role="group" aria-label="List view">
          <span className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mr-1">View</span>
          {[['wall', 'Poster wall'], ['squares', 'Squares'], ['cards', 'Full cards']].map(([v, label]) => {
            const on = activeView === v;
            return (
              <button key={v} type="button" onClick={() => pickView(v)} aria-pressed={on}
                className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${on ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#C9BFA8] hover:text-[#1A1815]'}`}>{label}</button>
            );
          })}
          {wallMode && (
            <label className="inline-flex items-center gap-1.5 ml-2">
              <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Size</span>
              <input
                type="range"
                min="3.5" max="14" step="0.5"
                value={wallSize}
                onChange={(e) => pickWallSize(parseFloat(e.target.value))}
                aria-label="Poster size — slide left for smaller, right for bigger"
                className="w-28 sm:w-40 accent-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
              />
            </label>
          )}
        </div>
      )}

      {/* The four sections (genre-filtered when a genre is picked). */}
      {STATUSES.map((st) => {
        const list = genreFilter ? buckets[st.key].filter((s) => genreMatches(s.genre, genreFilter)) : buckets[st.key];
        if (!list.length) return null;
        const focused = wallMode ? list.find((s) => s.id === focusId) : null;
        return (
          <section key={st.key} className="mb-4" aria-labelledby={`sec-${st.key}`}>
            <h3 id={`sec-${st.key}`} className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">{st.label} <span className="text-[#B85838]">· {st.hint}</span></h3>
            {wallMode ? (
              <>
                {/* Condensed wall: a dense poster grid for quick choosing. Tap a
                    tile → its full card opens right below the grid. Progress rides
                    under each tile so "where am I" reads at a glance. Posters
                    lazy-resolve (imports included) as tiles scroll into view.
                    Columns come from the Size slider: auto-fill at the chosen
                    min-tile-width (rem), so smaller = more per row, bigger = fewer. */}
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${wallSize}rem, 1fr))` }}>
                  {list.map((show) => {
                    const prog = showProgress(state, show.id);
                    const pct = prog.total ? Math.round((prog.watched / prog.total) * 100) : 0;
                    const on = focusId === show.id;
                    return (
                      <button key={show.id} type="button" onClick={() => setFocusId(on ? null : show.id)}
                        aria-pressed={on}
                        aria-label={`${show.title} — ${prog.watched} of ${prog.total || '?'} watched`}
                        className={`text-left focus:outline focus:outline-2 focus:outline-[#B85838] ${on ? 'ring-2 ring-[#B85838]' : ''}`}>
                        <Poster url={show.poster} title={show.title} kind={show.kind} resolve className={`w-full ${tileAspect}`} />
                        <span className="block h-1 bg-[#E8E4DC]" aria-hidden="true">
                          <span className="block h-1 bg-[#2F6B33]" style={{ width: `${pct}%` }} />
                        </span>
                      </button>
                    );
                  })}
                </div>
                {focused && (
                  <div className="mt-2">
                    <ShowCard key={focused.id} show={focused} me={me} state={state}
                      onStatus={onStatus} onRate={onRate} onAddComment={onAddComment} onReact={onReact} onUntrack={onUntrack}
                      onToggleEp={onToggleEp} onToggleSeason={onToggleSeason} onToggleMovie={onToggleMovie}
                      onAddByTitle={onAddByTitle} onShare={onShare} trackedKeys={trackedKeys} busy={busy} />
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                {list.map((show) => (
                  <ShowCard key={show.id} show={show} me={me} state={state}
                    onStatus={onStatus} onRate={onRate} onAddComment={onAddComment} onReact={onReact} onUntrack={onUntrack}
                    onToggleEp={onToggleEp} onToggleSeason={onToggleSeason} onToggleMovie={onToggleMovie}
                    onAddByTitle={onAddByTitle} onShare={onShare} trackedKeys={trackedKeys} busy={busy} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {genreEmpty && <p className="text-sm text-[#5A5751] mb-3" style={serif}>Nothing {genreFilter} on your list yet — here are popular {genreFilter} picks to add:</p>}

      {/* Popular picks — a curated starter catalog so the app opens to a FULL,
          browsable list (Darrell 2026-07-04) instead of empty, and a genre chip
          shows all picks in that genre "below". Grouped by genre when browsing
          all; filtered to the chosen genre when one is picked. Expanded by default
          for an empty list or when a genre is picked; collapsible otherwise (so we
          don't fetch ~30 posters for someone happily in their own list). Tap to
          add; already-tracked picks are hidden. */}
      {(() => {
        const show = popularOpen || !anyTracked || !!genreFilter;
        return (
          <section className="mb-4" aria-labelledby="tv-popular">
            <button type="button" onClick={() => setPopularOpen((v) => !v)} aria-expanded={show}
              className="w-full flex items-center justify-between gap-2 text-left mb-2 focus:outline focus:outline-2 focus:outline-[#B85838]">
              <h3 id="tv-popular" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">
                {genreFilter ? `Popular ${genreFilter} picks` : 'Popular picks'} <span className="text-[#B85838] normal-case tracking-normal font-normal">· {genreFilter ? 'tap to add' : `${popularCount()} shows to browse & add, by genre`}</span>
              </h3>
              {!genreFilter && <span className="text-[0.6875rem] text-[#B85838] shrink-0">{show ? 'Hide' : 'Browse'}</span>}
            </button>
            {show && <PopularBrowse trackedKeys={trackedKeys} onAddByTitle={onAddByTitle} busy={busy} genre={genreFilter} />}
          </section>
        );
      })()}

      {!anyTracked && !genreFilter && <p className="text-sm text-[#5A5751]" style={serif}>Tip: look up any show above, or import your old list — your own shows land in the sections here.</p>}
      </>
    );
  }

  // Your circle — the family/friends sharing surface, in its own section so the
  // main list isn't a long read-down past it. Its circle fetch runs when the
  // panel mounts (publishing is a deliberate button, never a mount side effect),
  // so nothing is lost by opening it on demand.
  function renderCircle() {
    return (
      <TVCircle state={state} email={me}
        catalog={Object.fromEntries(tracked.map((s) => [s.id, { id: s.id, title: s.title, poster: s.poster, genre: s.genre, kind: s.kind }]))} />
    );
  }
}

function safeNow() {
  try { return typeof Date !== 'undefined' && Date.now ? Date.now() : 0; } catch { return 0; }
}

function safeNowIso() {
  try { return new Date().toISOString(); } catch { return ''; }
}

export { TVTime };
