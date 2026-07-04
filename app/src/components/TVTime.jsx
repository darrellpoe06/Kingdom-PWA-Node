// =============================================================================
// TVTime — PoeTech TV Time (Darrell 2026-07-04). His wife's friend group asked
// for this by name when their "TV Time" app announced it shuts down July 15.
// Track your shows, talk about them, laugh together — and, the PoeTech twist,
// watch it THROUGH THE WAY with a gentle discernment prompt (never preachy).
// It's a PWA, so the friends install it on iOS + Android + desktop from one link.
//
// Surface only. State + transforms live in ../lib/tv-time.js (pure, tested).
// Device-local + private (their data serves them, not an ad model that
// disappears). Accessibility mirrors the app: white cards, #1A1815 body, #5A5751
// secondary, visible #B85838 focus outline (AA); no device-font emoji.
// =============================================================================
import React, { useMemo, useRef, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import {
  STATUSES, REACTIONS, SEED_SHOWS, SEED_CIRCLE,
  loadTv, saveTv, bucketShows, customCatalog, addCustomShow,
  setStatus, untrack, rateShow, addComment, getComments, toggleReaction, reactionCount,
  discernmentPromptFor,
} from '../lib/tv-time.js';

const serif = { fontFamily: '"Fraunces", serif' };
const BTN = 'text-[0.6875rem] uppercase tracking-wider px-2 py-1 focus:outline focus:outline-2 focus:outline-[#B85838]';
const GENRES = ['Reality', 'Drama', 'Comedy', 'Fantasy', 'Competition', 'Faith', 'Documentary', 'Show'];

// A 1–5 rating in hearts (loved-it), rendered with the shared icon set — no
// device-font emoji (consistency-guard). Tapping the current top heart clears it.
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

function ShowCard({ show, me, onStatus, onRate, onAddComment, onReact, onUntrack }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const comments = show.comments || [];
  const send = () => { const t = draft.trim(); if (!t) return; onAddComment(show.id, t); setDraft(''); };
  return (
    <div className="bg-white border border-[#1A1815] p-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <span style={{ ...serif, fontWeight: 600 }} className="text-[#1A1815]">{show.title}</span>
          <span className="text-[0.5625rem] uppercase tracking-wider bg-[#E8E4DC] text-[#1A1815] px-1.5 py-0.5 ml-2">{show.genre}</span>
        </div>
        <Stars value={show.rating || 0} onRate={(n) => onRate(show.id, n)} />
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <label className="sr-only" htmlFor={`st-${show.id}`}>Status for {show.title}</label>
        <select id={`st-${show.id}`} value={show.status} onChange={(e) => onStatus(show.id, e.target.value)}
          className="text-[0.6875rem] border border-[#E8E4DC] bg-white text-[#1A1815] px-2 py-1 focus:outline focus:outline-2 focus:outline-[#B85838]">
          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>
          {open ? 'Hide talk' : `Talk${comments.length ? ` (${comments.length})` : ''}`}
        </button>
        <button type="button" onClick={() => onUntrack(show.id)} className={`${BTN} text-[#991B1B] hover:underline`}>Remove</button>
      </div>
      {open && (
        <div className="mt-2 border-t border-[#E8E4DC] pt-2">
          {/* Watch it through The Way — gentle, relational discernment. */}
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
                      <button key={r.key} type="button" onClick={() => onReact(show.id, c.id, r.key)}
                        aria-pressed={mine} title={r.label}
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
            <input id={`cm-${show.id}`} value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="What did you think? Keep it real…"
              className="flex-1 text-sm px-2 py-1 border border-[#E8E4DC] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif} />
            <button type="button" onClick={send} disabled={!draft.trim()} className={`${BTN} border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50`}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TVTime({ email = null }) {
  const [state, setState] = useState(() => loadTv(email));
  const [newTitle, setNewTitle] = useState('');
  const [newGenre, setNewGenre] = useState('Reality');
  const seq = useRef(0);
  const me = useMemo(() => (email ? String(email).split('@')[0] : 'You'), [email]);

  const catalog = useMemo(() => [...SEED_SHOWS, ...customCatalog(state)], [state]);
  const buckets = useMemo(() => bucketShows(state, catalog), [state, catalog]);
  const withComments = (list) => list.map((s) => ({ ...s, comments: getComments(state, s.id) }));

  const persist = (next) => { saveTv(email, next); setState(next); };
  const onStatus = (id, status) => persist(setStatus(state, id, status));
  const onRate = (id, n) => persist(rateShow(state, id, n));
  const onUntrack = (id) => persist(untrack(state, id));
  const onAddComment = (id, text) => { seq.current += 1; persist(addComment(state, id, { author: me, text }, safeNow(), seq.current)); };
  const onReact = (id, cid, rk) => persist(toggleReaction(state, id, cid, rk, me));
  const addShow = () => { const t = newTitle.trim(); if (!t) return; persist(addCustomShow(state, { title: t, genre: newGenre })); setNewTitle(''); };
  const quickAdd = (id) => persist(setStatus(state, id, 'want'));

  return (
    <div className="max-w-3xl">
      <SectionTitle eyebrow="Track it · talk it · laugh together — watch it through The Way">PoeTech TV Time</SectionTitle>

      <p className="text-sm text-[#1A1815] mb-2" style={serif}>
        The place to keep up with your shows and talk about them with your people — the fun AND the real. It lives in the PoeTech App (a website you can install on any phone or computer), so it’s not going anywhere.
      </p>
      <p className="text-[0.6875rem] text-[#5A5751] mb-3" style={serif}>
        Your circle: {SEED_CIRCLE.join(' · ')}. <span className="text-[#B85838]">Live group sync (everyone’s activity in real time) is coming next</span> — for now your list and notes are saved on your device, private to you.
      </p>

      {/* Add a show */}
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-3">
        <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1.5">Add a show</div>
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-[10rem]">
            <label className="sr-only" htmlFor="tv-new">Show title</label>
            <input id="tv-new" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addShow(); }}
              placeholder="What are you watching?" className="w-full text-sm px-2 py-1 border border-[#E8E4DC] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif} />
          </div>
          <div>
            <label className="sr-only" htmlFor="tv-genre">Genre</label>
            <select id="tv-genre" value={newGenre} onChange={(e) => setNewGenre(e.target.value)} className="text-sm border border-[#E8E4DC] bg-white text-[#1A1815] px-2 py-1 focus:outline focus:outline-2 focus:outline-[#B85838]">
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button type="button" onClick={addShow} disabled={!newTitle.trim()} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>Add</button>
        </div>
        {buckets.untracked.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Quick add:</span>
            {buckets.untracked.map((s) => (
              <button key={s.id} type="button" onClick={() => quickAdd(s.id)} className="text-[0.6875rem] px-1.5 py-0.5 border border-[#E8E4DC] bg-white text-[#5A6E3D] hover:text-[#1A1815] hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif}>+ {s.title}</button>
            ))}
          </div>
        )}
      </div>

      {/* The four sections. */}
      {STATUSES.map((st) => {
        const list = withComments(buckets[st.key]);
        if (!list.length) return null;
        return (
          <section key={st.key} className="mb-4" aria-labelledby={`sec-${st.key}`}>
            <h3 id={`sec-${st.key}`} className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">{st.label} <span className="text-[#B85838]">· {st.hint}</span></h3>
            <div className="space-y-2">
              {list.map((show) => (
                <ShowCard key={show.id} show={show} me={me}
                  onStatus={onStatus} onRate={onRate} onAddComment={onAddComment} onReact={onReact} onUntrack={onUntrack} />
              ))}
            </div>
          </section>
        );
      })}

      {Object.values(buckets).every((b, i) => (i === 4 ? true : b.length === 0)) && (
        <p className="text-sm text-[#5A5751]" style={serif}>Nothing tracked yet — add a show above and you’re off.</p>
      )}
    </div>
  );
}

// Date.now() guarded for SSR/tests — a 0 timestamp still yields a stable id via seq.
function safeNow() {
  try { return typeof Date !== 'undefined' && Date.now ? Date.now() : 0; } catch { return 0; }
}

export { TVTime };
