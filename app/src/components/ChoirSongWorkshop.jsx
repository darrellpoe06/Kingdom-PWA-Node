// =============================================================================
// ChoirSongWorkshop — collaborative song-idea pool inside the Choir tab
// =============================================================================
// Declared by Darrell 2026-06-17: the choir adds + reviews links for songs to
// sing, plays them in-app, leaves comments, and the director CHOOSES which of the
// ~10 ideas are FINAL — the rest go back to the song pool. Single source of
// truth: whatever surface a member adds on feeds this same shared, instance-
// scoped, realtime-synced pool (DR-0061), so every member sees the same list.
//
// Authority: ANY choir member adds / comments / votes; only the director
// (owner/admin -> access.canEdit) marks FINAL or returns to pool. RLS is the real
// guard (0036) — canEdit just hides controls the server would refuse anyway.
//
// Unbreakable (break-it ship gate): wrapped in SectionBoundary so a bad embed
// degrades to a recover card, not a white screen; players load lazily on click
// (no 10 iframes at once / offline-safe until asked); non-embeddable URLs fall
// back to an "Open link" button — never a dead card; empty/over-long input is
// capped + trimmed in the sync layer. Keyboard-operable, visible #B85838 focus,
// and a large-print TextSizeControl that only scales root rem (layout holds).
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import TextSizeControl from './TextSizeControl.jsx';
import SectionBoundary from './SectionBoundary.jsx';
import {
  subscribeSongIdeas, subscribeSongComments, subscribeSongVotes,
  addSongIdea, addSongIdeaList, setIdeaStatus, deleteSongIdea,
  addSongComment, toggleSongVote,
  ideaEmbedUrl, splitByStatus, groupCommentsBySong, tallyVotes, parseSongList,
} from '../lib/song-workshop-sync.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1';

const fmtWhen = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  catch { return ''; }
};

// ---------------------------------------------------------------------------
// Player — lazy YouTube embed, or a safe "Open link" fallback. Never a dead card.
// ---------------------------------------------------------------------------
function Player({ idea }) {
  const [open, setOpen] = useState(false);
  const embed = ideaEmbedUrl(idea);

  if (embed) {
    return open ? (
      <div className="relative w-full mt-2" style={{ aspectRatio: '16 / 9' }}>
        <iframe
          className="absolute inset-0 w-full h-full border border-[#1A1815]"
          src={embed}
          title={`Play: ${idea.title}`}
          loading="lazy"
          allow="encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    ) : (
      <button type="button" onClick={() => setOpen(true)} className={`${BTN} mt-2 bg-[#1A1815] text-white font-semibold hover:bg-[#B85838]`}>
        ▶ Play in app
      </button>
    );
  }
  if (idea.url) {
    return (
      <a href={idea.url} target="_blank" rel="noopener noreferrer" className={`${BTN} mt-2 inline-block text-[#5A6E3D] hover:text-[#1A1815] underline`}>
        ▶ Open link ↗
      </a>
    );
  }
  return <p className="text-xs text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>No link yet — paste one so the choir can play it.</p>;
}

// ---------------------------------------------------------------------------
// Comment thread — any member reads + posts.
// ---------------------------------------------------------------------------
function CommentThread({ comments, onSend }) {
  const [draft, setDraft] = useState('');
  const send = () => { const t = draft.trim(); if (!t) return; onSend(t); setDraft(''); };
  return (
    <div className="mt-2 border-t border-[#E8E4DC] pt-2">
      <div className="max-h-48 overflow-y-auto" aria-live="polite">
        {comments.length ? comments.map((c) => (
          <div key={c.id} className="mb-1.5">
            <span className="text-[10px] text-[#5A5751]">{c.author}{c.createdAt ? ` · ${fmtWhen(c.createdAt)}` : ''}</span>
            <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{c.body}</p>
          </div>
        )) : <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No comments yet — start the conversation.</p>}
      </div>
      <div className="flex gap-2 mt-2">
        <label className="sr-only" htmlFor={`cmt-${comments[0]?.songId || 'new'}`}>Add a comment</label>
        <input
          className={FIELD}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Add a comment…"
          maxLength={2000}
        />
        <button type="button" onClick={send} disabled={!draft.trim()} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>Post</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SongCard — one idea: player + vote + comments + (director) status controls.
// ---------------------------------------------------------------------------
function SongCard({ idea, comments, vote, canEdit, onVote, onComment, onStatus, onDelete }) {
  const [showComments, setShowComments] = useState(false);
  const count = vote?.count || 0;
  const mine = !!vote?.mine;
  const isFinal = idea.status === 'final';

  return (
    <div className={`bg-white border ${isFinal ? 'border-[#5A6E3D] border-l-4' : 'border-[#1A1815]'} p-3 mb-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[9px] uppercase tracking-wider bg-[#E8E4DC] text-[#1A1815] px-1.5 py-0.5">{idea.sourceType === 'youtube' ? 'YouTube' : 'Link'}</span>
            <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }} className="text-[#1A1815] break-words">{idea.title}</span>
            {isFinal && <span className="text-[9px] uppercase tracking-wider bg-[#5A6E3D] text-white px-1.5 py-0.5">★ Final</span>}
          </div>
          <div className="text-[10px] text-[#5A5751] mt-0.5">
            Added by {idea.addedByName}{idea.createdAt ? ` · ${fmtWhen(idea.createdAt)}` : ''}
            {idea.keyLabel ? ` · Key ${idea.keyLabel}` : ''}{idea.arrangement ? ` · ${idea.arrangement}` : ''}
          </div>
          {idea.note && <p className="text-sm text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{idea.note}</p>}
        </div>
        <button
          type="button"
          onClick={onVote}
          aria-pressed={mine}
          aria-label={mine ? `Remove your vote (${count} total)` : `Vote for this song (${count} total)`}
          className={`shrink-0 text-xs px-2 py-1.5 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] ${mine ? 'bg-[#B85838] text-white border-[#B85838]' : 'border-[#5A5751] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'}`}
        >
          {mine ? '♥' : '♡'} {count}
        </button>
      </div>

      <Player idea={idea} />

      <div className="flex flex-wrap gap-2 mt-2 items-center">
        <button type="button" onClick={() => setShowComments((v) => !v)} className={`${BTN} text-[#5A5751] hover:text-[#1A1815] underline`}>
          {showComments ? 'Hide' : 'Comments'} ({comments.length})
        </button>
        {canEdit && (
          <div className="flex flex-wrap gap-2 ml-auto" role="group" aria-label="Director decision">
            {idea.status !== 'final' && <button type="button" onClick={() => onStatus('final')} className={`${BTN} bg-[#5A6E3D] text-white font-semibold hover:bg-[#1A1815]`}>★ Mark final</button>}
            {idea.status !== 'idea' && <button type="button" onClick={() => onStatus('idea')} className={`${BTN} border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white`}>To candidates</button>}
            {idea.status !== 'pool' && <button type="button" onClick={() => onStatus('pool')} className={`${BTN} border border-[#5A5751] text-[#5A5751] hover:text-[#1A1815]`}>↩ To pool</button>}
            <button type="button" onClick={onDelete} className={`${BTN} text-[#991B1B] hover:underline`}>Remove</button>
          </div>
        )}
      </div>

      {showComments && <CommentThread comments={comments} onSend={onComment} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddBar — any member adds one song or pastes a whole list.
// ---------------------------------------------------------------------------
function AddBar({ busy, onAddOne, onAddList }) {
  const [mode, setMode] = useState(null);              // null | 'one' | 'list'
  const [f, setF] = useState({ title: '', url: '', note: '', keyLabel: '', arrangement: '' });
  const [listText, setListText] = useState('');
  const previewCount = useMemo(() => parseSongList(listText).length, [listText]);

  const reset = () => { setF({ title: '', url: '', note: '', keyLabel: '', arrangement: '' }); setListText(''); setMode(null); };

  if (!mode) {
    return (
      <div className="flex gap-2 mb-3">
        <button type="button" onClick={() => setMode('one')} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838]`}>+ Add a song</button>
        <button type="button" onClick={() => setMode('list')} className={`${BTN} border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white`}>Paste a list</button>
      </div>
    );
  }

  if (mode === 'list') {
    return (
      <div className="bg-[#FAF8F4] border border-[#1A1815] p-3 mb-3 space-y-2">
        <div>
          <label className={LABEL} htmlFor="sw-list">Paste links or lines — one song per line</label>
          <textarea id="sw-list" rows={5} className={FIELD} value={listText} onChange={(e) => setListText(e.target.value)} placeholder={'Total Praise - https://youtu.be/...\nhttps://youtube.com/watch?v=...\nWay Maker'} />
        </div>
        <p className="text-[11px] text-[#5A5751]">{previewCount} song{previewCount === 1 ? '' : 's'} detected.</p>
        <div className="flex gap-2">
          <button type="button" disabled={busy || !previewCount} onClick={async () => { await onAddList(listText); reset(); }} className={`${BTN} bg-[#1A1815] text-white font-semibold disabled:opacity-50`}>Add {previewCount || ''} to pool</button>
          <button type="button" onClick={reset} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F4] border border-[#1A1815] p-3 mb-3 space-y-2">
      <div><label className={LABEL} htmlFor="sw-title">Song title</label><input id="sw-title" className={FIELD} value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} placeholder="Total Praise" maxLength={200} /></div>
      <div><label className={LABEL} htmlFor="sw-url">Link (YouTube or other)</label><input id="sw-url" className={FIELD} value={f.url} onChange={(e) => setF((p) => ({ ...p, url: e.target.value }))} placeholder="https://youtu.be/…" maxLength={2000} /></div>
      <div className="flex gap-2">
        <div className="flex-1"><label className={LABEL} htmlFor="sw-key">Key (optional)</label><input id="sw-key" className={FIELD} value={f.keyLabel} onChange={(e) => setF((p) => ({ ...p, keyLabel: e.target.value }))} placeholder="Ab" maxLength={40} /></div>
        <div className="flex-1"><label className={LABEL} htmlFor="sw-arr">Arrangement (optional)</label><input id="sw-arr" className={FIELD} value={f.arrangement} onChange={(e) => setF((p) => ({ ...p, arrangement: e.target.value }))} placeholder="Choir + solo" maxLength={120} /></div>
      </div>
      <div><label className={LABEL} htmlFor="sw-note">Note (optional)</label><input id="sw-note" className={FIELD} value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} placeholder="Good for the offering" maxLength={2000} /></div>
      <div className="flex gap-2">
        <button type="button" disabled={busy || !f.title.trim()} onClick={async () => { await onAddOne(f); reset(); }} className={`${BTN} bg-[#1A1815] text-white font-semibold disabled:opacity-50`}>Add to pool</button>
        <button type="button" onClick={reset} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Surface
// ---------------------------------------------------------------------------
export default function ChoirSongWorkshop({ access }) {
  const canEdit = !!access?.canEdit;
  const [ideas, setIdeas] = useState([]);
  const [comments, setComments] = useState([]);
  const [votes, setVotes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [poolOpen, setPoolOpen] = useState(false);

  useEffect(() => {
    const unsubs = [subscribeSongIdeas(setIdeas), subscribeSongComments(setComments), subscribeSongVotes(setVotes)];
    return () => unsubs.forEach((u) => { try { u && u(); } catch { /* noop */ } });
  }, []);

  const reportSkip = (res) => { if (res && res.skipped) setErr(`Could not save (${res.skipped}). Nothing was lost — please try again.`); else setErr(''); };

  const grouped = useMemo(() => groupCommentsBySong(comments), [comments]);
  const tally = useMemo(() => tallyVotes(votes), [votes]);
  const { finals, candidates, pool } = useMemo(() => splitByStatus(ideas), [ideas]);

  const onAddOne = async (f) => { setBusy(true); reportSkip(await addSongIdea(f)); setBusy(false); };
  const onAddList = async (text) => { setBusy(true); reportSkip(await addSongIdeaList(text)); setBusy(false); };

  const cardProps = (idea) => ({
    idea,
    comments: grouped.get(idea.id) || [],
    vote: tally.get(idea.id),
    canEdit,
    onVote: async () => { reportSkip(await toggleSongVote(idea.id, !!tally.get(idea.id)?.mine)); },
    onComment: async (body) => { reportSkip(await addSongComment(idea.id, body)); },
    onStatus: async (status) => { reportSkip(await setIdeaStatus(idea.id, status)); },
    onDelete: async () => { reportSkip(await deleteSongIdea(idea.id)); },
  });

  const total = ideas.length;

  return (
    <SectionBoundary name="Song Workshop">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          Add songs, play them, comment — {canEdit ? 'you choose the finals.' : 'the director chooses the finals.'}
        </p>
        <TextSizeControl variant="header" />
      </div>

      <AddBar busy={busy} onAddOne={onAddOne} onAddList={onAddList} />

      {err && <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-2 mb-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{err}</div>}

      {total === 0 && (
        <div className="bg-white border border-[#E8E4DC] p-6 text-center">
          <div className="text-2xl mb-1" aria-hidden="true">🎶</div>
          <p className="text-sm text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>No songs yet — add the first.</p>
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Paste a YouTube link (or any streaming link) and a title, and the whole choir can play it and weigh in.</p>
        </div>
      )}

      {finals.length > 0 && (
        <section className="mb-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-2">★ Final songs ({finals.length})</h3>
          {finals.map((idea) => <SongCard key={idea.id} {...cardProps(idea)} />)}
        </section>
      )}

      {candidates.length > 0 && (
        <section className="mb-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#1A1815] font-semibold mb-2">Candidates ({candidates.length})</h3>
          {candidates.map((idea) => <SongCard key={idea.id} {...cardProps(idea)} />)}
        </section>
      )}

      {pool.length > 0 && (
        <section className="mb-2">
          <button type="button" onClick={() => setPoolOpen((v) => !v)} className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] font-semibold mb-2 hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
            {poolOpen ? '▾' : '▸'} Song pool ({pool.length})
          </button>
          {poolOpen && pool.map((idea) => <SongCard key={idea.id} {...cardProps(idea)} />)}
        </section>
      )}
    </SectionBoundary>
  );
}

export { ChoirSongWorkshop };
