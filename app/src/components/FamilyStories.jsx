// =============================================================================
// FamilyStories — the Big Picture: the family's years in pictures (DR-1153)
// =============================================================================
// Darrell, 2026-10-21, from the Life Hub: "Clicking Big Picture should show the
// family photos... over time or stories like Google stories of pictures of
// family times over the years... make sense?" And: "Right now it goes
// nowhere...."
//
// WHAT THIS READS (the reality trace, DR-0061): the NAS photo server's library
// — the phones' backups and the dated roots, listed by month with the date
// read from the camera's own file name (the `library/years`, `library?month=`
// and `library-photo?name=` routes, behind the same-origin nas-photos road in
// lib/nas-photos.js). Every chapter count on this screen is the server's
// count of real files; every frame is a real picture; a year with no pictures
// is not a chapter. Nothing here is painted.
//
// THREE HONEST STATES, said in words rather than a spinner that never ends:
// no key on this device (the signed-in family device connects itself from the
// Life Gallery on the Current View, and that is said), the NAS unreachable (a
// Retry), and a library with nothing in it yet (Add a photo).
//
// THE STORY PLAYER is the memories feed: full-bleed, one frame at a time with
// its date in words and how long ago, progress bars across the top, moving on
// by itself every FRAME_MS, held still while a thumb is down or the tab is
// hidden, tap left for back and right for forward, and the keyboard the same.
// The thumbnail the listing already carried shows first; the listing-size
// picture replaces it when it arrives, so the first frame is never blank.
//
// COLORS ARE CLASSES, NEVER INLINE (the Hub's rule, contrast-guard's founding
// bug). Chrome is fixed rem so it never grows with the reader's text
// (DR-0438). No width cap (DR-0246). Dependencies are injected so the suite
// can prove every state without a NAS.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  hasBridgeToken, fetchLibraryYears, fetchLibrary, fetchLibraryPhoto, uploadPhoto,
} from '../lib/nas-photos.js';
import { compressImageFile } from '../lib/image.js';
import {
  monthsToProbe, monthsFromYears, chaptersFrom, thisWeekAcrossYears, chapterTitle,
  frameCaption, dateInWords, FRAME_MS, nextIndex,
} from '../lib/family-stories.js';
import UiIcon from './UiIcon.jsx';

const DEFAULT_DEPS = {
  hasBridgeToken, fetchLibraryYears, fetchLibrary, fetchLibraryPhoto, uploadPhoto, compressImageFile,
  now: () => new Date(),
};

const CARD = 'bg-white border border-[#E8E4DC] rounded-2xl p-4';
const MUTED = 'text-[#5A5751]';
const FOCUS_RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';
const CHIP = 'border border-[#E8E4DC] px-2.5 py-1 rounded-full text-[0.625rem] uppercase tracking-wider min-h-[36px]';
const PAGE = 24;
const AT_ONCE = 3;

/** The month keys whose pictures can fall within `window` days of today, in any year. */
function monthsNearToday(today, window = 7) {
  const d = today.getDate();
  const m = today.getMonth() + 1;
  const keys = new Set([m]);
  if (d <= window) keys.add(m === 1 ? 12 : m - 1);
  const last = new Date(today.getFullYear(), m, 0).getDate();
  if (d > last - window) keys.add(m === 12 ? 1 : m + 1);
  return [...keys].map((k) => String(k).padStart(2, '0'));
}

/** Run `fn` over `items`, at most `n` at a time, calling `onEach` as each settles. */
async function inBatches(items, n, fn, onEach) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(n, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      try { onEach(item, await fn(item)); } catch { onEach(item, null); }
    }
  });
  await Promise.all(workers);
}

export default function FamilyStories({ onClose = null, deps = {} }) {
  const d = useMemo(() => ({ ...DEFAULT_DEPS, ...deps }), [deps]);
  const [status, setStatus] = useState('loading'); // loading | no-key | unreachable | ready
  const [pages, setPages] = useState(() => new Map()); // month -> {month, photos, total}
  const [loadingMonths, setLoadingMonths] = useState(() => new Set());
  const [open, setOpen] = useState(null); // a year, when a chapter is open
  const [story, setStory] = useState(null); // {frames, i, title}
  const [uploadState, setUploadState] = useState('idle'); // idle | busy | failed | done
  const [generation, setGeneration] = useState(0);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const putPage = useCallback((month, page) => {
    if (!alive.current || !page) return;
    setPages((prev) => {
      const next = new Map(prev);
      const have = next.get(month);
      // A later page of the same month is appended, never replaces the first.
      const photos = have && Array.isArray(have.photos) && page.offset > 0
        ? [...have.photos, ...page.photos] : page.photos;
      next.set(month, { month, photos, total: page.total });
      return next;
    });
  }, []);

  const loadMonths = useCallback(async (months, { limit = PAGE } = {}) => {
    const todo = months.filter(Boolean);
    if (!todo.length) return;
    setLoadingMonths((s) => new Set([...s, ...todo]));
    await inBatches(todo, AT_ONCE, (m) => d.fetchLibrary({ month: m, limit, offset: 0 }), (m, page) => {
      if (page) putPage(m, { ...page, offset: 0 });
      if (alive.current) setLoadingMonths((s) => { const n = new Set(s); n.delete(m); return n; });
    });
  }, [d, putPage]);

  // THE FIRST LOAD: the years, then the pictures near today's date from every
  // year, then one picture from each year's newest month for the covers.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!d.hasBridgeToken()) { setStatus('no-key'); return; }
      setStatus('loading');
      const today = d.now();
      const ys = await d.fetchLibraryYears();
      if (cancelled) return;
      if (!ys) { setStatus('unreachable'); return; }
      let yearList = ys.years;
      if (!yearList) {
        // An older server with no years route: probe the last three years a
        // month at a time, asking for one picture each, and keep what answers.
        const found = new Map();
        await inBatches(monthsToProbe(today, 36), AT_ONCE, (m) => d.fetchLibrary({ month: m, limit: 1, offset: 0 }), (m, page) => {
          if (page && page.total > 0) found.set(m, page);
        });
        if (cancelled) return;
        yearList = [];
        for (const [m, page] of [...found.entries()].sort()) {
          const y = m.slice(0, 4);
          let yr = yearList.find((x) => x.year === y);
          if (!yr) { yr = { year: y, count: 0, months: [] }; yearList.push(yr); }
          yr.months.push({ month: m, count: page.total });
          yr.count += page.total;
          putPage(m, { ...page, offset: 0 });
        }
      }
      // Every month the server names becomes a page with its real total and
      // no frames yet; the frames arrive as the months load.
      setPages((prev) => {
        const next = new Map(prev);
        for (const yr of yearList) for (const mo of yr.months || []) {
          if (!next.has(mo.month)) next.set(mo.month, { month: mo.month, photos: [], total: mo.count });
        }
        return next;
      });
      setStatus('ready');
      const all = monthsFromYears(yearList);
      const near = monthsNearToday(today);
      const weekMonths = all.filter((m) => near.includes(m.slice(5, 7)));
      const covers = yearList.map((yr) => (yr.months || []).map((x) => x.month).sort().pop()).filter((m) => m && !weekMonths.includes(m));
      await loadMonths(weekMonths);
      if (cancelled) return;
      await loadMonths(covers, { limit: 1 });
    })();
    return () => { cancelled = true; };
  }, [d, generation, loadMonths, putPage]);

  const chapters = useMemo(() => chaptersFrom([...pages.values()]), [pages]);
  const today = useMemo(() => d.now(), [d]);
  const week = useMemo(() => thisWeekAcrossYears(chapters, today), [chapters, today]);
  const weekYears = new Set(week.map((f) => f.date.slice(0, 4))).size;
  const openChapter = open ? chapters.find((c) => c.year === open) : null;
  const totalPictures = chapters.reduce((n, c) => n + c.count, 0);

  const openYear = async (year) => {
    setOpen(year);
    const ch = chapters.find((c) => c.year === year);
    if (!ch) return;
    const months = ch.months.map((m) => m.month).filter((m) => {
      const pg = pages.get(m);
      return !pg || (pg.photos.length === 0 && pg.total > 0) || (pg.photos.length === 1 && pg.total > 1);
    });
    await loadMonths(months);
  };

  const moreOf = async (month) => {
    const pg = pages.get(month);
    if (!pg) return;
    setLoadingMonths((s) => new Set([...s, month]));
    const page = await d.fetchLibrary({ month, limit: PAGE, offset: pg.photos.length });
    if (page) putPage(month, { ...page, offset: pg.photos.length });
    if (alive.current) setLoadingMonths((s) => { const n = new Set(s); n.delete(month); return n; });
  };

  const play = (frames, i = 0, title = '') => {
    if (!frames || !frames.length) return;
    setStory({ frames, i: Math.max(0, Math.min(i, frames.length - 1)), title });
  };

  // ADD PICTURES, plural (ui-standards: a picker for something plural takes
  // more than one). Each one is shrunk on the device and sent in turn; the
  // note says how many landed and how many did not, never a bare "saved".
  const [uploadNote, setUploadNote] = useState('');
  const onPickFiles = async (e) => {
    const files = Array.from((e.target.files && e.target.files.length) ? e.target.files : []);
    e.target.value = '';
    if (!files.length) return;
    setUploadState('busy');
    setUploadNote(files.length === 1 ? 'Sending 1 picture…' : `Sending ${files.length} pictures…`);
    let sent = 0;
    for (const file of files) {
      try {
        const dataUrl = await d.compressImageFile(file, 1600, 0.75);
        const r = await d.uploadPhoto(dataUrl, { dest: 'family', filename: file.name });
        if (r) sent += 1;
      } catch { /* counted below as not sent */ }
      if (!alive.current) return;
      if (sent < files.length) setUploadNote(`${sent} of ${files.length} sent…`);
    }
    if (!alive.current) return;
    const failed = files.length - sent;
    if (sent === 0) {
      setUploadState('failed');
      setUploadNote(files.length === 1 ? 'That picture did not reach the library. Nothing was saved; try it again.' : `None of the ${files.length} pictures reached the library. Nothing was saved; try again.`);
      return;
    }
    setUploadState('done');
    setUploadNote(`${sent} ${sent === 1 ? 'picture' : 'pictures'} saved to the family library${failed ? `; ${failed} did not reach it` : ''}. ${sent === 1 ? 'It takes its place' : 'They take their place'} in this year's chapter.`);
    setGeneration((g) => g + 1);
  };

  const addPhoto = (
    <label className={`inline-flex items-center gap-1.5 cursor-pointer ${CHIP} ${FOCUS_RING} border-[#1A1815]`}>
      <span aria-hidden="true"><UiIcon name="upload" /></span>
      <span>{uploadState === 'busy' ? 'Sending…' : 'Add photos'}</span>
      <input type="file" accept="image/*" multiple className="sr-only" onChange={onPickFiles} disabled={uploadState === 'busy'} data-testid="stories-add-photo" />
    </label>
  );

  return (
    <section aria-labelledby="stories-h" className="space-y-4" data-testid="family-stories">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="stories-h" className="text-lg font-semibold tracking-tight" style={{ fontFamily: '"Fraunces", serif' }}>Our years in pictures</h2>
          <p className={`text-xs ${MUTED}`}>
            {status === 'ready' && totalPictures > 0
              ? `${totalPictures.toLocaleString()} pictures across ${chapters.length} ${chapters.length === 1 ? 'year' : 'years'}, from the family's own library.`
              : 'The family\'s pictures, read from our own library on the NAS — a chapter for every year.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {status === 'ready' && addPhoto}
          {onClose && (
            <button type="button" onClick={onClose} className={`${CHIP} ${FOCUS_RING}`} data-testid="stories-close">Back to the Hub</button>
          )}
        </div>
      </header>

      {uploadNote && (
        <p role="status" className={`text-xs ${uploadState === 'failed' ? 'text-[#9E4A2A]' : MUTED}`} data-testid="stories-upload-note">{uploadNote}</p>
      )}

      {status === 'loading' && (
        <p className={`text-sm ${MUTED}`} role="status" data-testid="stories-loading">Opening the library…</p>
      )}

      {status === 'no-key' && (
        <div className={CARD} data-testid="stories-no-key">
          <h3 className="text-sm font-semibold">This device is not connected to the family library yet</h3>
          <p className={`mt-1 text-sm ${MUTED}`}>
            The pictures live on our own NAS, and this device holds no key to it. A signed-in family device connects itself:
            open the <strong>Current View</strong> and the <strong>Life Gallery</strong> there asks for the key on your behalf — no password, nothing typed.
            Then come back here and the years are waiting.
          </p>
        </div>
      )}

      {status === 'unreachable' && (
        <div className={CARD} data-testid="stories-unreachable">
          <h3 className="text-sm font-semibold">The library did not answer</h3>
          <p className={`mt-1 text-sm ${MUTED}`}>The NAS could not be reached from here just now. The pictures are safe where they are; this screen only reads them.</p>
          <button type="button" onClick={() => setGeneration((g) => g + 1)} className={`mt-3 ${CHIP} ${FOCUS_RING} border-[#1A1815]`} data-testid="stories-retry">Retry</button>
        </div>
      )}

      {status === 'ready' && chapters.length === 0 && (
        <div className={CARD} data-testid="stories-empty">
          <h3 className="text-sm font-semibold">No pictures in the library yet</h3>
          <p className={`mt-1 text-sm ${MUTED}`}>The first picture starts the first chapter. Add one from this phone, or turn on the photo backup and the years fill in on their own.</p>
          <div className="mt-3">{addPhoto}</div>
        </div>
      )}

      {status === 'ready' && chapters.length > 0 && !openChapter && (
        <>
          {/* THIS WEEK ACROSS THE YEARS — the memories strip. Only when the
              library has something near today's date; an empty strip is not
              drawn. */}
          {week.length > 0 && (
            <section aria-labelledby="stories-week-h" className={CARD} data-testid="stories-week">
              <div className="flex items-baseline justify-between gap-2">
                <h3 id="stories-week-h" className="text-sm font-semibold flex items-center gap-2"><span aria-hidden="true" className="text-[#5A6E3D]"><UiIcon name="calendar" /></span>This week across the years</h3>
                <button type="button" onClick={() => play(week, 0, 'This week across the years')} className={`text-[0.625rem] uppercase tracking-wider text-[#2A5A8E] font-semibold ${FOCUS_RING}`} data-testid="stories-play-week">Play →</button>
              </div>
              <p className={`text-xs ${MUTED}`}>{week.length} {week.length === 1 ? 'picture' : 'pictures'} taken within a week of today, across {weekYears} {weekYears === 1 ? 'year' : 'different years'}.</p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {week.map((f, i) => (
                  <button key={f.id} type="button" onClick={() => play(week, i, 'This week across the years')} className={`shrink-0 w-[7rem] text-left ${FOCUS_RING}`} aria-label={`Play from ${dateInWords(f.date)}`}>
                    <span className="block aspect-square rounded-xl overflow-hidden bg-[#E8E4DC]">
                      {f.thumb ? <img src={f.thumb} alt="" className="w-full h-full object-cover" loading="lazy" /> : null}
                    </span>
                    <span className={`block mt-1 text-[0.625rem] ${MUTED} truncate`}>{f.date.slice(0, 4)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* THE CHAPTERS — one per year, newest first, each with the server's
              count and a cover from a real frame when one has loaded. */}
          <nav aria-label="Years" className="ts-grid-collapse grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5" data-testid="stories-chapters">
            {chapters.map((ch) => (
              <button key={ch.year} type="button" onClick={() => openYear(ch.year)} className={`relative rounded-2xl overflow-hidden text-left bg-[#1F3A2E] text-white min-h-[9rem] ${FOCUS_RING}`} data-testid={`stories-chapter-${ch.year}`}>
                {ch.cover && ch.cover.thumb ? <img src={ch.cover.thumb} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" loading="lazy" /> : null}
                <span className="relative z-10 flex flex-col justify-end h-full min-h-[9rem] p-3 bg-gradient-to-t from-[#1A1815]/80 to-transparent">
                  <span className="text-[1.5rem] font-semibold leading-none" style={{ fontFamily: '"Fraunces", serif' }}>{ch.year}</span>
                  <span className="block text-[0.625rem] opacity-90 mt-1">{chapterTitle(ch).split(' · ')[1]}{ch.months.length > 1 ? ` · ${ch.months.length} months` : ''}</span>
                </span>
              </button>
            ))}
          </nav>
        </>
      )}

      {status === 'ready' && openChapter && (
        <section aria-labelledby="stories-year-h" className="space-y-3" data-testid="stories-year">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <button type="button" onClick={() => setOpen(null)} className={`text-[0.625rem] uppercase tracking-wider ${MUTED} ${FOCUS_RING}`}>← All years</button>
              <h3 id="stories-year-h" className="text-base font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{chapterTitle(openChapter)}</h3>
            </div>
            <button type="button" onClick={() => play(openChapter.frames, 0, openChapter.year)} disabled={openChapter.frames.length === 0} className={`${CHIP} ${FOCUS_RING} border-[#1A1815] disabled:opacity-50`} data-testid="stories-play-year">Play {openChapter.year}</button>
          </div>
          {openChapter.months.map((mo) => {
            const pg = pages.get(mo.month);
            const frames = openChapter.frames.filter((f) => f.date.startsWith(mo.month));
            const loading = loadingMonths.has(mo.month);
            return (
              <section key={mo.month} aria-label={mo.month} className={CARD}>
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-sm font-semibold">{dateInWords(`${mo.month}-01`).replace(/ 1,/, ',')}</h4>
                  <span className={`text-[0.625rem] ${MUTED}`}>{mo.count} {mo.count === 1 ? 'picture' : 'pictures'}</span>
                </div>
                <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {frames.map((f) => (
                    <button key={f.id} type="button" onClick={() => play(openChapter.frames, openChapter.frames.indexOf(f), openChapter.year)} className={`aspect-square rounded-lg overflow-hidden bg-[#E8E4DC] ${FOCUS_RING}`} aria-label={`Play from ${dateInWords(f.date)}`}>
                      {f.thumb ? <img src={f.thumb} alt="" className="w-full h-full object-cover" loading="lazy" /> : null}
                    </button>
                  ))}
                </div>
                {loading && <p className={`mt-2 text-xs ${MUTED}`} role="status">Gathering {dateInWords(`${mo.month}-01`).replace(/ 1,/, ',')}…</p>}
                {!loading && pg && pg.photos.length < pg.total && (
                  <button type="button" onClick={() => moreOf(mo.month)} className={`mt-2 ${CHIP} ${FOCUS_RING}`}>Show more · {pg.total - pg.photos.length} left</button>
                )}
              </section>
            );
          })}
        </section>
      )}

      {story && (
        <StoryPlayer
          frames={story.frames}
          start={story.i}
          title={story.title}
          today={today}
          fetchFull={d.fetchLibraryPhoto}
          onClose={() => setStory(null)}
        />
      )}
    </section>
  );
}

/**
 * The full-bleed story: one frame at a time, auto-advancing, held while a
 * thumb is down or the tab is hidden. Presentational over the frames it is
 * handed; the only fetch is the listing-size picture for the frame on screen.
 */
export function StoryPlayer({ frames, start = 0, title = '', today = new Date(), fetchFull = null, onClose }) {
  const [i, setI] = useState(start);
  const [paused, setPaused] = useState(false);
  const [full, setFull] = useState(() => new Map());
  const [finished, setFinished] = useState(false);
  const n = frames.length;
  const frame = frames[Math.min(i, n - 1)];

  const goNext = useCallback(() => {
    setI((cur) => {
      const nx = nextIndex(cur, n);
      if (nx === null) { setFinished(true); return cur; }
      return nx;
    });
  }, [n]);
  const goPrev = useCallback(() => { setFinished(false); setI((cur) => Math.max(0, cur - 1)); }, []);

  // THE CLOCK: one timer per frame, cancelled on pause, hidden tab, or close.
  useEffect(() => {
    if (paused || finished) return undefined;
    const t = setTimeout(goNext, FRAME_MS);
    return () => clearTimeout(t);
  }, [i, paused, finished, goNext]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onVis = () => setPaused(document.hidden === true);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose();
      else if (e.key === 'ArrowRight') { setFinished(false); goNext(); }
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  // THE PICTURE: the listing thumb first, the listing-size picture when it
  // arrives. Fetched once per name and kept for the rest of the story.
  useEffect(() => {
    if (!frame || !fetchFull || full.has(frame.name)) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchFull(frame.name, { max: 1600 });
        if (!cancelled && r && r.ok && typeof r.image === 'string') setFull((m) => new Map(m).set(frame.name, r.image));
      } catch { /* the thumb stays */ }
    })();
    return () => { cancelled = true; };
  }, [frame, fetchFull, full]);

  if (!frame) return null;
  const src = full.get(frame.name) || frame.thumb || null;
  const tap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / Math.max(1, rect.width);
    if (x < 0.33) goPrev(); else { setFinished(false); goNext(); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={title ? `Story: ${title}` : 'Story'} className="fixed inset-0 z-50 bg-[#1A1815] text-white flex flex-col" data-testid="story-player">
      <div className="flex gap-1 p-2" aria-hidden="true">
        {frames.map((f, k) => (
          <span key={f.id} className={`h-1 flex-1 rounded-full ${k < i || (finished && k === i) ? 'bg-white' : k === i ? 'bg-white/70' : 'bg-white/25'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 px-3">
        <span className="text-xs opacity-90 truncate">{title}{title ? ' · ' : ''}{i + 1} of {n}</span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} className={`${CHIP} border-white/40 text-white ${FOCUS_RING}`} data-testid="story-pause">{paused ? 'Play' : 'Pause'}</button>
          <button type="button" onClick={onClose} className={`${CHIP} border-white/40 text-white ${FOCUS_RING}`} aria-label="Close the story" data-testid="story-close">Close</button>
        </div>
      </div>
      <button
        type="button"
        onClick={tap}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        className="flex-1 min-h-0 w-full relative flex items-center justify-center p-2"
        aria-label="Tap the right side for the next picture, the left side for the one before"
      >
        {src ? <img src={src} alt={frameCaption(frame, today)} className="max-h-full w-auto h-auto object-contain rounded-lg" data-testid="story-image" /> : <span className="text-sm opacity-80">This picture could not be shown.</span>}
      </button>
      <div className="px-3 pb-3 text-center">
        <p className="text-sm font-semibold" style={{ fontFamily: '"Fraunces", serif' }} data-testid="story-caption">{frameCaption(frame, today)}</p>
        {finished && (
          <button type="button" onClick={() => { setFinished(false); setI(0); }} className={`mt-2 ${CHIP} border-white/40 text-white ${FOCUS_RING}`} data-testid="story-again">Play again</button>
        )}
      </div>
    </div>
  );
}
