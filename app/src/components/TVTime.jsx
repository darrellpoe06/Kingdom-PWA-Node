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
  STATUSES, REACTIONS, SEED_CIRCLE,
  loadTv, saveTv, bucketShows, customCatalog, addCustomShow, addShowFromCatalog, addMovieFromCatalog, toggleMovieWatched,
  setStatus, untrack, rateShow, addComment, getComments, toggleReaction, reactionCount,
  discernmentPromptFor, toggleEpisode, isEpisodeWatched, setSeasonWatched, showProgress, seasonProgress,
  trendingWatches, exportTv, importTvJson,
} from '../lib/tv-time.js';
import { searchTitles, loadShow, TV_SOURCE, MOVIE_SOURCE } from '../lib/tv-catalog.js';

const serif = { fontFamily: '"Fraunces", serif' };
const BTN = 'text-[0.6875rem] uppercase tracking-wider px-2 py-1 focus:outline focus:outline-2 focus:outline-[#B85838]';

function Poster({ url, title, className = 'w-12 h-16' }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return <img src={url} alt={`${title} poster`} loading="lazy" onError={() => setBroken(true)} className={`${className} object-cover border border-[#E8E4DC] shrink-0`} />;
  }
  return (
    <span className={`${className} shrink-0 border border-[#E8E4DC] bg-[#FAF8F4] flex items-center justify-center text-[0.5rem] uppercase tracking-wider text-[#5A5751] text-center p-0.5`}>{title.slice(0, 18)}</span>
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
// the live list; honestly scoped to your device until circle sync lands.
function TrendingStrip({ items }) {
  if (!items.length) return null;
  return (
    <section className="bg-[#1A1815] text-white p-3 mb-3" aria-labelledby="tv-trending">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 id="tv-trending" className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#E8B84B] font-semibold">What’s getting watched</h3>
        <span className="text-[0.5625rem] text-[#C9BFA8]">Ranked by activity in your list · circle-wide when live sync lands</span>
      </div>
      <ol className="space-y-1.5">
        {items.map((r, i) => (
          <li key={r.id} className="flex items-center gap-2.5">
            <span className="text-[0.6875rem] text-[#E8B84B] w-4 shrink-0 text-right" aria-hidden="true">{i + 1}</span>
            <Poster url={r.poster} title={r.title} className="w-7 h-10" />
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

function ShowCard({ show, me, state, onStatus, onRate, onAddComment, onReact, onUntrack, onToggleEp, onToggleSeason, onToggleMovie }) {
  const [tab, setTab] = useState(null); // 'episodes' | 'talk' | null
  const [draft, setDraft] = useState('');
  const comments = getComments(state, show.id);
  const prog = showProgress(state, show.id);
  const isMovie = show.kind === 'movie';
  const seen = show.status === 'watched';
  const send = () => { const t = draft.trim(); if (!t) return; onAddComment(show.id, t); setDraft(''); };
  return (
    <div className="bg-white border border-[#1A1815] p-3">
      <div className="flex items-start gap-3">
        <Poster url={show.poster} title={show.title} />
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
  const persist = (next) => { saveTv(email, next); setState(next); };

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
  const onAddComment = (id, text) => { seq.current += 1; persist(addComment(state, id, { author: me, text }, safeNow(), seq.current)); };
  const onReact = (id, cid, rk) => persist(toggleReaction(state, id, cid, rk, me));
  const onToggleEp = (id, se, nu) => persist(toggleEpisode(state, id, se, nu));
  const onToggleSeason = (id, se, on) => persist(setSeasonWatched(state, id, se, on));
  const onToggleMovie = (id) => persist(toggleMovieWatched(state, id));

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

  // Restore from a previously-exported file (merges in, restore-wins).
  const restoreFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const before = STATUSES.reduce((n, st) => n + buckets[st.key].length, 0);
        const next = importTvJson(state, JSON.parse(String(reader.result || '{}')));
        persist(next);
        const after = STATUSES.reduce((n, st) => n + bucketShows(next, customCatalog(next))[st.key].length, 0);
        setImportMsg(`Restored — ${Math.max(0, after - before)} added from your backup.`);
      } catch { setImportMsg('That file wasn’t a TV Time backup.'); }
    };
    reader.readAsText(file);
  };

  const anyTracked = STATUSES.some((st) => buckets[st.key].length);

  return (
    <div className="max-w-3xl">
      <SectionTitle eyebrow="Shows & movies · check off every episode · talk it · watch it through The Way">PoeTech TV Time</SectionTitle>

      <p className="text-sm text-[#1A1815] mb-2" style={serif}>
        Keep up with your shows and movies and talk about them with your people. Look one up — a show’s seasons come in and you check off each episode; a movie is a single tap to mark watched. It lives in the PoeTech App (a website you install on any phone or computer), so it’s not going anywhere.
      </p>
      <p className="text-[0.6875rem] text-[#5A5751] mb-3" style={serif}>
        Your circle: {SEED_CIRCLE.join(' · ')}. <span className="text-[#B85838]">Live group sync is coming next</span> — for now your list is saved on your device, private to you. Show info + posters: {TV_SOURCE.name}; movies: {MOVIE_SOURCE.name}.
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
                Restore from a backup file
                <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { restoreFile(e.target.files && e.target.files[0]); e.target.value = ''; }} />
              </label>
              {importMsg && <span className="text-[0.6875rem] text-[#5A6E3D]" style={serif}>{importMsg}</span>}
            </div>
          </div>
        )}
      </div>

      {/* What's getting watched — dynamic, from real activity. */}
      <TrendingStrip items={trending} />

      {/* The four sections. */}
      {STATUSES.map((st) => {
        const list = buckets[st.key];
        if (!list.length) return null;
        return (
          <section key={st.key} className="mb-4" aria-labelledby={`sec-${st.key}`}>
            <h3 id={`sec-${st.key}`} className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">{st.label} <span className="text-[#B85838]">· {st.hint}</span></h3>
            <div className="space-y-2">
              {list.map((show) => (
                <ShowCard key={show.id} show={show} me={me} state={state}
                  onStatus={onStatus} onRate={onRate} onAddComment={onAddComment} onReact={onReact} onUntrack={onUntrack}
                  onToggleEp={onToggleEp} onToggleSeason={onToggleSeason} onToggleMovie={onToggleMovie} />
              ))}
            </div>
          </section>
        );
      })}

      {!anyTracked && <p className="text-sm text-[#5A5751]" style={serif}>Nothing tracked yet — look up a show above (or import your old list) and you’re off.</p>}
    </div>
  );
}

function safeNow() {
  try { return typeof Date !== 'undefined' && Date.now ? Date.now() : 0; } catch { return 0; }
}

export { TVTime };
