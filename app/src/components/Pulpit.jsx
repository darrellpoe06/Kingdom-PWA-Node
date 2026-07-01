// =============================================================================
// The Word — Migdal — the church's sermon library + Bishop Gwin's study.
//
// User-facing name is "The Word — Migdal" (the migdal-'ets / wooden platform Ezra
// the priest stood on to read the Word aloud — Nehemiah 8:4). Internal route id
// stays 'pulpit' (invisible); every label/heading/breadcrumb reads "The Word —
// Migdal".
//
// ACCESS (decided by Darrell 2026-06-16, RLS-ENFORCED — never a UI-only lock):
//   • LIBRARY — PUBLIC. The chronological archive of published messages (Sundays
//     + Wednesday Bible Study) is viewable by EVERYONE — congregation AND the
//     unchurched, signed in or not (Father's-Business reach). Fed by the
//     SECURITY DEFINER RPC `theword_public_sermons()` (0029), which returns only
//     non-draft, colg-scoped messages — no drafts, no prep notes, no documents.
//     Each message credits who delivered it (BG primary; guest preachers/teachers
//     rostered alongside) and embeds its service video inline.
//   • PREP + MANAGEMENT — PRIVATE to leadership (owner/admin = BG / Darrell /
//     Christina). "Prep from your corpus", add / edit / delete, and draft
//     management are gated to canManage in the UI AND enforced at the data layer:
//     the choir_sermons table read policy is owner/admin only (0029), so a
//     non-privileged user can never see a draft or the prep, even off-UI.
//
// The generative outline step is wired to the Word-first local Church model when
// it is deployed; until then prep does REAL retrieval over BG's own history and
// says so — it never paints AI output that did not happen (DR-0076).
//
// Accessibility: white cards / #1A1815 body, #5A5751 secondary, labelled inputs,
// visible #B85838 focus outline.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { SectionTitle, TabScroll } from './shared.jsx';
import { onAuthChange } from '../lib/supabase.js';
import {
  getChoirAccess, youtubeEmbedUrl, youtubeTimedUrl, parseTimecode, formatTimecode,
  subscribeSermons, subscribeSermonDocuments, subscribeSpeakers, saveSermon, deleteSermon, reuseSermon,
  saveSermonDocument, importSermonsFromChannel, openSermonDocument, fetchPublicSermons, dedupeSermons,
} from '../lib/choir-sync.js';
import { corpusPrep, speakerRoster, theWordTabs } from '../lib/pulpit-prep.js';
import { extractYoutubeId } from '../lib/youtube-title-parse.js';
import { pointsForVideo, pointsSearchText } from '../lib/sermon-points.js';
import { sortByReactions, reactionsFor } from '../lib/reactions.js';
import { subscribeReactions, toggleReaction, fetchReactors } from '../lib/reactions-sync.js';
import { churchInstanceId } from '../lib/church-instance.js';
import ReactionBar from './ReactionBar.jsx';
import { fetchPointsData, fetchVideoStats } from '../lib/sermon-library-sync.js';
import Presenter from './Presenter.jsx';
import RecordsLog from './RecordsLog.jsx';
import { wordLibrary, messagePresentable } from '../lib/presentable.js';
import { useReadingResume } from '../lib/reading-position.js';
import { aboutFor } from '../lib/surface-help.js';

// The stable YouTube id for a message — the row's own video_id, else parsed from
// its watch URL. Keys the thumbnail, the points, and the engagement counts.
const videoIdOf = (s) => (s && (s.videoId || extractYoutubeId(s.youtubeUrl))) || null;
// YouTube's always-present medium thumbnail (no API key, no vendor tracker).
const thumbUrl = (id) => (id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null);

// LIGHT inline self-explanation — declared centrally in surface-help.js so the
// Help-freshness gate can verify the deep Help entry stays current with it.
const THEWORD_ABOUT = aboutFor('church:pulpit');

const todayIso = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
};
// Newest-first by message date — a deterministic chronological order for the
// library regardless of source (Darrell: "sorted in chronological order").
const byDateDesc = (a, b) => String(b.serviceDate || '').localeCompare(String(a.serviceDate || ''));

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';

// -----------------------------------------------------------------------------
// Message add/edit form (leadership only)
// -----------------------------------------------------------------------------
function MessageForm({ initial, onSave, onCancel, busy, speakers = [] }) {
  const [f, setF] = useState({
    id: initial?.id || null,
    serviceDate: initial?.serviceDate || todayIso(),
    serviceType: initial?.serviceType || 'sunday',
    title: initial?.title || '',
    speaker: initial?.speaker || '',
    scriptureRef: initial?.scriptureRef || '',
    serviceSlot: initial?.serviceSlot || '',
    youtubeUrl: initial?.youtubeUrl || '',
    documentUrl: initial?.documentUrl || '',
    notes: initial?.notes || '',
    status: initial?.status || 'active',
    startTime: initial?.startSeconds != null ? formatTimecode(initial.startSeconds) : '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 my-2">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{f.id ? 'Edit message' : 'Add message'}</div>
      <div><label className={LABEL} htmlFor="pm-title">Title</label><input id="pm-title" className={FIELD} value={f.title} onChange={set('title')} placeholder="Message title" /></div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className={LABEL} htmlFor="pm-date">Date</label><input id="pm-date" type="date" className={FIELD} value={f.serviceDate} onChange={set('serviceDate')} /></div>
        <div><label className={LABEL} htmlFor="pm-type">Service</label>
          <select id="pm-type" className={FIELD} value={f.serviceType} onChange={set('serviceType')}>
            <option value="sunday">Sunday</option><option value="wednesday">Wednesday</option>
          </select>
        </div>
        <div><label className={LABEL} htmlFor="pm-slot">Slot</label>
          <select id="pm-slot" className={FIELD} value={f.serviceSlot} onChange={set('serviceSlot')}>
            <option value="">—</option><option value="1pm">1pm</option><option value="evening">Evening</option><option value="morning">Morning</option>
          </select>
        </div>
        <div><label className={LABEL} htmlFor="pm-status">Status</label>
          <select id="pm-status" className={FIELD} value={f.status} onChange={set('status')}>
            <option value="active">Active</option><option value="draft">Draft (planning)</option><option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={LABEL} htmlFor="pm-speaker">Speaker</label>
          <input id="pm-speaker" className={FIELD} value={f.speaker} onChange={set('speaker')} placeholder="Bishop Lloyd E. Gwin" list="pm-speaker-list" autoComplete="off" />
          <datalist id="pm-speaker-list">
            {speakers.map((sp) => <option key={sp.id} value={sp.canonicalName} />)}
          </datalist>
          <p className="text-[9px] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>Pick an existing name so the roster stays one person per preacher; a new name starts a new guest entry.</p>
        </div>
        <div><label className={LABEL} htmlFor="pm-scr">Scripture</label><input id="pm-scr" className={FIELD} value={f.scriptureRef} onChange={set('scriptureRef')} placeholder="e.g. 1 Peter 5" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={LABEL} htmlFor="pm-yt">Service video link</label><input id="pm-yt" className={FIELD} value={f.youtubeUrl} onChange={set('youtubeUrl')} placeholder="https://youtu.be/…" /></div>
        <div><label className={LABEL} htmlFor="pm-ts">Sermon starts at (mm:ss)</label><input id="pm-ts" className={FIELD} value={f.startTime} onChange={set('startTime')} placeholder="e.g. 35:10" /></div>
      </div>
      <div><label className={LABEL} htmlFor="pm-doc">Sermon document link (the original message document — private to leadership)</label><input id="pm-doc" className={FIELD} value={f.documentUrl} onChange={set('documentUrl')} placeholder="Link to BG's sermon document" /></div>
      <div><label className={LABEL} htmlFor="pm-notes">Notes (optional)</label><input id="pm-notes" className={FIELD} value={f.notes} onChange={set('notes')} placeholder="Theme, key points…" /></div>
      <div className="flex gap-2 flex-wrap pt-1">
        <button type="button" disabled={busy || !f.title.trim()} onClick={() => onSave({ ...f, startSeconds: parseTimecode(f.startTime) })} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>{busy ? 'Saving…' : 'Save message'}</button>
        <button type="button" onClick={onCancel} className={`${BTN} border border-[#5A5751] text-[#5A5751] hover:bg-white`}>Cancel</button>
      </div>
    </div>
  );
}

// The numbered teaching outline under a video — BG's own points (harvest lane /
// transcript-derived), collapsed by default so the library stays scannable. When
// there are no numbered points yet, a scripture strip still shows (title anchors)
// so the card is never empty — the graceful-until-transcript state.
function PointsBlock({ bundle }) {
  const [open, setOpen] = useState(false);
  if (!bundle) return null;
  const { points = [], scriptures = [], source } = bundle;
  const hasPoints = points.length > 0;
  if (!hasPoints && scriptures.length === 0) return null;
  return (
    <div className="mt-1.5">
      {hasPoints ? (
        <button type="button" onClick={() => setOpen((p) => !p)} aria-expanded={open}
          className="text-[0.6875rem] px-2 py-1 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
          style={{ fontFamily: '"Fraunces", serif' }}>
          {open ? '▾ Hide points' : `▸ ${points.length} point${points.length === 1 ? '' : 's'}`}
        </button>
      ) : (
        scriptures.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Scriptures</span>
            {scriptures.slice(0, 6).map((s) => (
              <span key={s} className="text-[0.6875rem] bg-[#FAF8F4] border border-[#E8E4DC] px-1.5 py-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{s}</span>
            ))}
          </div>
        )
      )}
      {open && hasPoints && (
        <ol className="mt-1.5 space-y-1.5">
          {points.map((p) => (
            <li key={p.n + p.text.slice(0, 12)} className="flex gap-2">
              <span className="text-[0.6875rem] font-semibold text-[#5A6E3D] tabular-nums shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{p.n}.</span>
              <span className="text-[0.8125rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                {p.text}
                {p.scriptures && p.scriptures.length > 0 && (
                  <span className="ml-1.5 inline-flex flex-wrap gap-1 align-middle">
                    {p.scriptures.map((s) => (
                      <span key={s} className="text-[0.625rem] bg-[#FAF8F4] border border-[#E8E4DC] px-1 py-0.5 text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{s}</span>
                    ))}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
      {open && hasPoints && source === 'transcript' && (
        <p className="text-[0.5625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Points read from the message transcript — his own words.</p>
      )}
    </div>
  );
}

function MessageRow({ sermon, canEdit, onEdit, onDelete, onReuse, points = null, reaction = null, onReact = null, onShowWho = null, views = null, signedIn = false, rank = null }) {
  // Embed the service video INLINE (Darrell: embedding is cleaner than frames).
  const [playing, setPlaying] = useState(false);
  const baseEmbed = youtubeEmbedUrl(sermon.youtubeUrl);
  const embed = baseEmbed && sermon.startSeconds ? `${baseEmbed}?start=${Math.floor(sermon.startSeconds)}` : baseEmbed;
  const watch = youtubeTimedUrl(sermon.youtubeUrl, sermon.startSeconds);
  const watchLabel = `▶ Watch${sermon.startSeconds ? ` @ ${formatTimecode(sermon.startSeconds)}` : ''}`;
  const vid = videoIdOf(sermon);
  const thumb = thumbUrl(vid);
  const play = () => setPlaying((p) => !p);
  return (
    <div className="p-3 border-b border-[#E8E4DC]">
      <div className="flex gap-3">
        {/* Thumbnail — the consumer-video-library affordance; click to play inline. */}
        {thumb && (
          <button type="button" onClick={play} aria-label={playing ? 'Hide video' : `Play ${sermon.title}`}
            className="relative shrink-0 w-28 sm:w-36 focus:outline focus:outline-2 focus:outline-[#B85838]">
            <img src={thumb} alt="" loading="lazy" className="w-full aspect-video object-cover border border-[#1A1815]" />
            <span aria-hidden className="absolute inset-0 flex items-center justify-center text-white text-lg" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{playing ? '▾' : '▶'}</span>
            {typeof rank === 'number' && <span className="absolute top-0 left-0 bg-[#1A1815] text-white text-[0.625rem] px-1.5 py-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>#{rank}</span>}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{sermon.title}</span>
              {sermon.status === 'draft' && <span className="text-[0.5625rem] uppercase tracking-wider bg-[#5A6E3D] text-white px-1.5 py-0.5">Draft</span>}
              {sermon.scriptureRef && <span className="text-[0.6875rem] text-[#5A5751]">{sermon.scriptureRef}</span>}
            </div>
            <span className="text-[0.6875rem] text-[#5A5751]">{fmtDate(sermon.serviceDate)} · {sermon.serviceType === 'wednesday' ? 'Wed' : 'Sun'}{sermon.serviceSlot ? ` ${sermon.serviceSlot}` : ''}</span>
          </div>
          {sermon.speaker && <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{sermon.speaker}</p>}
          {sermon.repreachSourceName && (
            <p className="text-[0.6875rem] text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }}>
              ↻ Re-preached — original by {sermon.repreachSourceName}{sermon.repreachSourceTitle ? `: “${sermon.repreachSourceTitle}”` : ''}
            </p>
          )}
          {sermon.notes && <p className="text-[0.6875rem] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{sermon.notes}</p>}

          {/* BG's numbered points (or a scripture strip) under the video. */}
          <PointsBlock bundle={points} />

          {/* In-app reactions (PRIMARY signal) — the reusable Godhead palette.
              YouTube views ride alongside as a SECONDARY display, not the source. */}
          {onReact && (
            <div className="flex gap-3 mt-1.5 flex-wrap items-center">
              <ReactionBar
                entry={reaction}
                signedIn={signedIn}
                contentLabel={sermon.title || 'this message'}
                onReact={(key) => onReact(sermon, key)}
                onShowWho={onShowWho ? (() => onShowWho(sermon)) : null}
              />
              {Number(views) > 0 && (
                <span className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{Number(views).toLocaleString()} YouTube views</span>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-1 flex-wrap">
            {embed && <button type="button" onClick={play} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`} aria-expanded={playing}>{playing ? '▾ Hide video' : watchLabel}</button>}
            {!embed && watch && <a href={watch} target="_blank" rel="noopener noreferrer" className={`${BTN} text-[#B85838] hover:text-[#1A1815] underline`}>{watchLabel}</a>}
            {sermon.documentUrl && <button type="button" onClick={async () => { const u = await openSermonDocument(sermon.documentUrl); if (u) window.open(u, '_blank', 'noopener'); }} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815] underline`}>📄 Document</button>}
            {canEdit && onReuse && <button type="button" onClick={() => onReuse(sermon)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>↻ Re-preach this</button>}
            {canEdit && onEdit && <button type="button" onClick={() => onEdit(sermon)} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Edit</button>}
            {canEdit && onDelete && <button type="button" onClick={() => onDelete(sermon)} className={`${BTN} text-[#991B1B] hover:underline`}>Delete</button>}
          </div>
        </div>
      </div>
      {playing && embed && (
        <div className="mt-2 aspect-video">
          <iframe src={embed} title={`${sermon.title} — service video`} className="w-full h-full border border-[#1A1815]" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Library — the public chronological archive. canEdit (leadership) adds the
// management controls + the in-progress drafts; everyone else sees only the
// published list (the RPC returns no drafts to them).
// -----------------------------------------------------------------------------
const LIB_SORTS = [['newest', 'Newest'], ['reacted', 'Most reacted'], ['viewed', 'Most viewed']];

function LibraryPanel({ sermons, canEdit, onSave, onDelete, onReuse, onImport, busy, speakers = [], userKey, pointsByVideo = {}, reactionMap = {}, statsMap = {}, onReact = null, onShowWho = null, signedIn = false }) {
  const [form, setForm] = useState(null); // {initial}|null
  const [importMsg, setImportMsg] = useState('');
  const [sortMode, setSortMode] = useState('newest'); // newest | reacted (in-app, primary) | viewed (YouTube, secondary)
  const [rankQuery, setRankQuery] = useState('');      // search for the ranked (engagement) views
  const [rankAll, setRankAll] = useState(false);       // cap the ranked list; expand on demand (no death-scroll)
  const runImport = async () => {
    setImportMsg('Importing…');
    const r = await onImport();
    if (r?.imported >= 0 && r.imported !== undefined) setImportMsg(`Imported ${r.imported} new message(s) from the channel.`);
    else if (r?.skipped === 'no-key') setImportMsg('Add VITE_YOUTUBE_API_KEY (Vercel env) to enable channel import.');
    else setImportMsg(`Import skipped (${r?.skipped || 'error'}).`);
  };
  // Display-dedupe (migration 0061 mirror): collapse the harvest's duplicate
  // drafts on their stable key so the library never shows clones, even before the
  // DB migration has run against the cloud.
  const list = dedupeSermons(Array.isArray(sermons) ? sermons : []).kept;
  const drafts = list.filter((s) => s.status === 'draft');
  const history = list.filter((s) => s.status !== 'draft');
  const roster = speakerRoster(list);

  // Attach the points bundle + engagement to each history item (keyed by video),
  // so both the date-grouped and the ranked views render the same enriched row
  // and search can match a point's text ("show me the one about X").
  const enrich = (s) => {
    const vid = videoIdOf(s);
    return {
      ...s, _vid: vid,
      _points: (vid && pointsByVideo[vid]) || null,
      _reaction: reactionsFor(reactionMap, vid),
      _views: (vid && statsMap[vid] && statsMap[vid].ytViews) || 0,
    };
  };
  const historyEnriched = history.map(enrich);
  const rowFor = (s) => (
    <MessageRow sermon={s} canEdit={canEdit} points={s._points} reaction={s._reaction} views={s._views}
      onReact={onReact} onShowWho={onShowWho} signedIn={signedIn}
      onEdit={(x) => setForm({ initial: x })} onDelete={onDelete} onReuse={onReuse} />
  );

  // The Word is the second consumer of the shared reading-position primitive:
  // return to the message library right where you were scrolled, not the top.
  const { hasResume, resume, label } = useReadingResume({ userKey, surface: 'theword', itemId: 'library' });

  // Ranked (engagement) view: sort by the chosen signal, filter by the search,
  // then cap to a scannable top slice with an expand — popularity up top, never a
  // death-scroll. Only used when sortMode !== 'newest'.
  const ranked = sortMode === 'newest' ? [] : (() => {
    const q = rankQuery.trim().toLowerCase();
    const filtered = q
      ? historyEnriched.filter((s) => `${s.title || ''} ${s.scriptureRef || ''} ${s.speaker || ''} ${pointsSearchText(s._points)}`.toLowerCase().includes(q))
      : historyEnriched;
    if (sortMode === 'reacted') {
      // PRIMARY signal — rank by in-app reactions (keyed by video id).
      return sortByReactions(filtered.map((s) => ({ ...s, contentId: s._vid })), reactionMap);
    }
    // SECONDARY — YouTube views, tie-broken newest.
    return [...filtered].sort((a, b) => (b._views - a._views) || String(b.serviceDate || '').localeCompare(String(a.serviceDate || '')));
  })();
  const RANK_CAP = 25;

  return (
    <div>
      {hasResume && (
        <button type="button" onClick={resume} className="mb-2 text-xs px-3 py-2 border w-full text-left bg-[#FAF8F4] border-[#B85838] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>
          ↓ {label || 'Continue where you left off'}
        </button>
      )}
      <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Every past message — Sundays + Wednesday Bible Study. Pick one by its points, or sort by what resonates. Bishop Gwin preaches most; guest preachers and teachers fill in so he can rest, and each message credits who delivered it. Watch the service right here.{canEdit ? ' Add, reuse, and manage messages below.' : ''}</p>

      {/* Sort — a real video library: newest, or ranked by what resonates. */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap" role="group" aria-label="Sort messages">
        <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Sort</span>
        {LIB_SORTS.map(([key, label]) => (
          <button key={key} type="button" onClick={() => { setSortMode(key); setRankAll(false); }}
            aria-pressed={sortMode === key}
            className={`text-[0.6875rem] px-2.5 py-1 rounded-full border whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838] ${sortMode === key ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}
            style={{ fontFamily: '"Fraunces", serif' }}>{label}</button>
        ))}
      </div>

      {roster.length > 0 && (
        <div className="mb-3">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751] mb-1">Preachers &amp; teachers</div>
          <div className="flex flex-wrap gap-1.5">
            {roster.map((p) => (
              <span key={p.name} className={`text-[0.6875rem] px-2 py-0.5 border ${p.isBG ? 'bg-[#1A1815] text-[#FAF8F4] border-[#1A1815]' : 'bg-[#FAF8F4] text-[#1A1815] border-[#E8E4DC]'}`} style={{ fontFamily: '"Fraunces", serif' }}>
                {p.name}{p.isBG ? ' · primary' : ''} <span className={p.isBG ? 'opacity-70' : 'text-[#5A5751]'}>({p.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {canEdit && (form ? (
        <MessageForm initial={form.initial} busy={busy} speakers={speakers} onSave={async (s) => { await onSave(s); setForm(null); }} onCancel={() => setForm(null)} />
      ) : (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <button type="button" onClick={() => setForm({ initial: null })} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>+ Add message</button>
          {onImport && <button type="button" onClick={runImport} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>↻ Import from channel</button>}
          {importMsg && <span className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{importMsg}</span>}
        </div>
      ))}

      {canEdit && drafts.length > 0 && (
        <div className="mb-3">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] mb-1">In progress (private)</div>
          <div className="bg-white border border-[#5A6E3D]">
            {drafts.map(enrich).sort(byDateDesc).map((s) => <div key={s.id}>{rowFor(s)}</div>)}
          </div>
        </div>
      )}

      {historyEnriched.length === 0 ? (
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>No messages yet.</p>
      ) : sortMode === 'newest' ? (
        // NEWEST — the office-like, date-grouped view (no death-scroll). Points
        // text is folded into search so "the one about X" finds it.
        <RecordsLog
          items={historyEnriched}
          getDate={(s) => s.serviceDate}
          getText={(s) => `${s.title} ${s.scriptureRef || ''} ${s.speaker || ''} ${pointsSearchText(s._points)}`}
          countNoun="message"
          about={THEWORD_ABOUT}
          facets={[
            { key: 'speaker', label: 'speakers', getValue: (s) => s.speaker },
            { key: 'type', label: 'services', getValue: (s) => (s.serviceType === 'wednesday' ? 'Wednesday' : 'Sunday') },
          ]}
          renderRow={(s) => rowFor(s)}
        />
      ) : (
        // RANKED — most-hearted / most-viewed first, searchable, capped to a
        // scannable top slice with an expand (popularity up top, not a scroll).
        <div>
          <label className="sr-only" htmlFor="tw-rank-q">Search messages</label>
          <input id="tw-rank-q" className={FIELD} value={rankQuery} onChange={(e) => { setRankQuery(e.target.value); setRankAll(false); }}
            placeholder="Search title, scripture, or a point…" />
          <p className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751] my-2">
            {ranked.length} message{ranked.length === 1 ? '' : 's'} · {sortMode === 'reacted' ? 'most reacted first' : 'most viewed first'}
          </p>
          <div className="bg-white border border-[#1A1815]">
            {(rankAll ? ranked : ranked.slice(0, RANK_CAP)).map((s, i) => (
              <MessageRow key={s.id} sermon={s} canEdit={canEdit} points={s._points} reaction={s._reaction} views={s._views}
                onReact={onReact} onShowWho={onShowWho} signedIn={signedIn}
                onEdit={(x) => setForm({ initial: x })} onDelete={onDelete} onReuse={onReuse}
                rank={i + 1} />
            ))}
          </div>
          {!rankAll && ranked.length > RANK_CAP && (
            <button type="button" onClick={() => setRankAll(true)} className={`${BTN} text-[#B85838] hover:text-[#1A1815] mt-2`}>
              Show all {ranked.length}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Prep from your corpus — leadership only. REAL retrieval over BG's own past
// messages (pure engine in ../lib/pulpit-prep.js). No fabrication.
// -----------------------------------------------------------------------------
function PrepPanel({ sermons, canEdit, onReuse }) {
  const [query, setQuery] = useState('');
  const { matches, scriptures, span, total } = corpusPrep(sermons, query);
  const searched = query.trim().length > 0;
  return (
    <div className="space-y-3">
      <div className="bg-[#FAF8F4] border border-[#5A6E3D] p-3">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">Prep from your own messages</div>
        <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Study help grounded in <strong>your</strong> corpus — your {total} past message{total === 1 ? '' : 's'}. Enter a theme or a scripture and see what you have already preached on it, the scriptures you have leaned on, and start a new draft from any of them. (The Word-first local Church model will draft an outline from this material once it is deployed; today this does real retrieval over your history, nothing invented.)
        </p>
        <label className="sr-only" htmlFor="pp-q">Theme or scripture</label>
        <input id="pp-q" className={FIELD} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. faith · Psalm 23 · restoration · victory" />
      </div>

      {searched && (
        matches.length ? (
          <>
            <div className="bg-white border border-[#1A1815] p-3">
              <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751] mb-1">Scriptures you have preached on this {span ? `· ${span}` : ''}</div>
              {scriptures.length
                ? <div className="flex flex-wrap gap-1.5">{scriptures.map((s) => <span key={s} className="text-[0.6875rem] bg-[#FAF8F4] border border-[#E8E4DC] px-1.5 py-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{s}</span>)}</div>
                : <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No scripture references recorded on these yet.</p>}
            </div>
            <p className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751]">{matches.length} of your message{matches.length === 1 ? '' : 's'} touch “{query.trim()}”</p>
            <div className="bg-white border border-[#1A1815]">
              {matches.map((s) => <MessageRow key={s.id} sermon={s} canEdit={canEdit} onEdit={() => {}} onDelete={() => {}} onReuse={canEdit ? onReuse : null} />)}
            </div>
          </>
        ) : (
          <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>None of your past messages mention “{query.trim()}” yet — a fresh word.</p>
        )
      )}
    </div>
  );
}

// The message PICKER — present mode is per-MESSAGE, so the leader chooses which one
// to put up (newest first; older messages remain selectable — BG presents the newest
// and, when he wants, an older one). Picking enters the Presenter for that one message.
function MessagePicker({ library, onPick, onClose }) {
  const items = Array.isArray(library) ? library : [];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#FAF8F4', color: '#1A1815', overflowY: 'auto', fontFamily: '"Fraunces", Georgia, serif' }} role="dialog" aria-label="Pick a message to present">
      <div style={{ position: 'sticky', top: 0, background: '#1A1815', color: '#FAF8F4', padding: '12px clamp(12px, 3vw, 28px)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#EBA77E', fontFamily: '"JetBrains Mono", monospace' }}>Present a message</span>
        <strong style={{ fontFamily: '"Fraunces", serif', fontSize: 15 }}>Pick one to put on the screen</strong>
        <button type="button" onClick={onClose} style={{ marginLeft: 'auto', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', minHeight: 40, padding: '8px 16px', border: '1px solid #B85838', background: 'transparent', color: '#FAF8F4', fontSize: 12 }}>Close ✕</button>
      </div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(16px, 3vw, 28px)' }}>
        <p style={{ fontSize: 13, color: '#5A5751', margin: '0 0 14px' }}>
          Each message is its own presentation — newest first. {items.length} message{items.length === 1 ? '' : 's'}.
        </p>
        {items.length === 0 && <p style={{ fontSize: 14, color: '#7A1F1F' }}>No published messages to present yet.</p>}
        {items.map((m) => (
          <button key={m.id} type="button" onClick={() => onPick(m.id)}
            style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer', border: '1px solid #E8E4DC', background: '#fff', color: '#1A1815', padding: '12px 14px', marginBottom: 10 }}>
            <strong style={{ fontFamily: '"Fraunces", serif', fontSize: 16, display: 'block' }}>{m.title}</strong>
            <span style={{ fontSize: 12, color: '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>
              {m.dateLabel || 'date TBD'} · {m.dayLabel}{m.speaker ? ` · ${m.speaker}` : ''}{m.scriptureRef ? ` · ${m.scriptureRef}` : ''}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Surface
// -----------------------------------------------------------------------------
export default function Pulpit() {
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState(''); // namespaces reading-position per user
  const [canManage, setCanManage] = useState(false); // owner/admin = BG / Darrell / Christina
  const [tab, setTab] = useState('library');
  const [presenting, setPresenting] = useState(false); // live present mode: opens the message PICKER
  const [presentId, setPresentId] = useState(null);    // the ONE message selected to present
  const [sermons, setSermons] = useState([]);        // leadership: table (incl drafts)
  const [publicSermons, setPublicSermons] = useState([]); // everyone else: RPC (published)
  const [sermonDocs, setSermonDocs] = useState([]);  // owner/admin only (RLS)
  const [speakers, setSpeakers] = useState([]);      // canonical speaker entities (0037) — typeahead source
  const [pointsData, setPointsData] = useState({ transcriptsByVideo: {}, harvestsByVideo: {} }); // points sources
  const [reactionMap, setReactionMap] = useState({}); // { [videoId]: { counts, myKey, score, top } } — PRIMARY signal
  const [statsMap, setStatsMap] = useState({});        // { [videoId]: { ytViews, ytLikes } } — SECONDARY (YouTube)
  const [churchInstId, setChurchInstId] = useState(null); // resolved church instance for keying reactions
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => onAuthChange((s) => { setSignedIn(!!s); setEmail(s?.user?.email || ''); }), []);

  // Resolve leadership (owner/admin) access when signed in.
  useEffect(() => {
    let alive = true;
    if (!signedIn) { setCanManage(false); return undefined; }
    getChoirAccess().then((a) => { if (alive) setCanManage(!!(a && a.canEdit)); });
    return () => { alive = false; };
  }, [signedIn]);

  // Leadership streams the table (all messages incl. drafts + the private docs).
  useEffect(() => {
    if (!canManage) return undefined;
    const unsubs = [subscribeSermons(setSermons), subscribeSermonDocuments(setSermonDocs), subscribeSpeakers(setSpeakers)];
    return () => unsubs.forEach((u) => { try { u && u(); } catch { /* noop */ } });
  }, [canManage]);

  // EVERYONE ELSE (incl. signed-out / unchurched) gets the PUBLIC library via the
  // RPC — published messages only, RLS/SECURITY-DEFINER enforced, no drafts/prep.
  useEffect(() => {
    if (canManage) return undefined; // leadership uses the richer table view
    let alive = true;
    fetchPublicSermons().then((rows) => { if (alive) setPublicSermons(Array.isArray(rows) ? rows : []); });
    return () => { alive = false; };
  }, [canManage]);

  // LIBRARY ENRICHMENT (signed-in): the points sources (transcripts + recorded
  // harvest refs), the live IN-APP reaction map (PRIMARY signal, keyed by the
  // church instance + content_type='sermon'), and the SECONDARY YouTube stats.
  // RLS returns empty for a non-member, so this degrades to a plain library —
  // points fall back to title scriptures, reactions read as no-signal-yet — and
  // never throws. Signed-out skips it. Points/reactions come alive as data lands.
  useEffect(() => {
    if (!signedIn) {
      setPointsData({ transcriptsByVideo: {}, harvestsByVideo: {} });
      setReactionMap({}); setStatsMap({}); setChurchInstId(null);
      return undefined;
    }
    let alive = true;
    fetchPointsData().then((d) => { if (alive) setPointsData(d || { transcriptsByVideo: {}, harvestsByVideo: {} }); });
    fetchVideoStats().then((m) => { if (alive) setStatsMap(m || {}); });
    let unsub = null;
    churchInstanceId(email).then((id) => {
      if (!alive) return;
      setChurchInstId(id || null);
      unsub = subscribeReactions((m) => { if (alive) setReactionMap(m || {}); }, { instanceId: id, contentType: 'sermon' });
    });
    return () => { alive = false; try { unsub && unsub(); } catch { /* noop */ } };
  }, [signedIn, email]);

  const reportSkip = (res) => { if (res && res.skipped) setErr(`Could not save (${res.skipped}). Your changes were not stored — try again.`); else setErr(''); };

  // Tag each message with its canonical speaker's primary flag (0037) so the
  // roster credits BG as primary from real entity data, not a name regex; and
  // resolve re-preach lineage (0038) — the original deliverer + source title —
  // so a re-preached message shows BOTH BG and whose message he re-preached.
  const speakerById = new Map(speakers.map((sp) => [sp.id, sp]));
  const sermonsById = new Map(sermons.map((s) => [s.id, s]));
  const primarySpeaker = speakers.find((sp) => sp.isPrimary) || null;
  const withDocs = sermons.map((s) => {
    const src = s.sourceSermonId ? sermonsById.get(s.sourceSermonId) : null;
    const sourceName = (s.sourceSpeakerId && speakerById.get(s.sourceSpeakerId)?.canonicalName) || src?.speaker || null;
    return {
      ...s,
      documentUrl: (sermonDocs.find((d) => d.sermonId === s.id) || {}).documentUrl || null,
      speakerIsPrimary: !!speakerById.get(s.speakerId)?.isPrimary,
      repreachSourceName: sourceName,
      repreachSourceTitle: src?.title || null,
    };
  });
  const libraryItems = canManage ? withDocs : publicSermons;
  const tabs = theWordTabs(canManage);

  // Points per video: prefer the harvest lane's recorded `lessons` refs, else
  // derive live from the transcript, else fall back to the title's anchor
  // scriptures — all pure (sermon-points.js). Recomputes when the corpus or the
  // points sources change; keyed by video id for the row to look up.
  const pointsByVideo = useMemo(() => {
    const { transcriptsByVideo, harvestsByVideo } = pointsData;
    const out = {};
    for (const s of libraryItems) {
      const vid = videoIdOf(s);
      if (!vid || out[vid]) continue;
      out[vid] = pointsForVideo({ sermon: s, harvestRow: harvestsByVideo[vid] || null, transcript: transcriptsByVideo[vid] || null });
    }
    return out;
  }, [libraryItems, pointsData]);

  // React to a message (single-pick, self-scoped). ReactionBar handles optimistic
  // feedback; the realtime subscription refreshes the real counts. Returns the
  // result so ReactionBar can reconcile on a soft failure.
  const displayName = (email && email.split('@')[0]) || 'Someone';
  const onReact = async (sermon, key) => {
    const vid = videoIdOf(sermon);
    if (!vid) return { skipped: 'no-content' };
    return toggleReaction({ instanceId: churchInstId, contentType: 'sermon', contentId: vid, reactionKey: key, displayName });
  };
  // Who reacted (instance-member gated by the RPC) — the "tap shows who" readout.
  const onShowWho = async (sermon) => {
    const vid = videoIdOf(sermon);
    if (!vid) return [];
    return fetchReactors({ instanceId: churchInstId, contentType: 'sermon', contentId: vid });
  };

  const onSave = async (s) => { setBusy(true); const r = await saveSermon(s); reportSkip(r); if (r?.id) await saveSermonDocument(r.id, s.documentUrl); setBusy(false); };
  const onDelete = async (s) => { reportSkip(await deleteSermon(s.id)); };
  // Re-preach: BG (the primary speaker) curates a new draft from the source,
  // crediting himself while linking the original deliverer's material (0038).
  const onReuse = async (s) => { const d = new Date(); d.setDate(d.getDate() + 7); reportSkip(await reuseSermon(s, d.toISOString().slice(0, 10), s.serviceType, primarySpeaker)); setTab('library'); };

  // The published messages — a LIBRARY of pickable messages, not one mega-presentation.
  // Drafts/prep stay off it by construction. Each message is its OWN presentation.
  const presentMessages = (canManage ? withDocs : publicSermons).filter((s) => s && s.status !== 'draft');
  const canPresent = presentMessages.length > 0;
  const library = wordLibrary(presentMessages);                  // newest-first, pickable
  const selectedMessage = presentId ? presentMessages.find((s) => s.id === presentId) : null;

  // Live present mode: first PICK one message (newest-first; older ones selectable),
  // then present THAT one message — its own slides, its own budget reflow. You do not
  // preach all of them at once.
  if (presenting) {
    if (selectedMessage) {
      return (
        <Presenter
          presentable={messagePresentable(selectedMessage)}
          onClose={() => setPresentId(null)}   // back to the picker, not all the way out
        />
      );
    }
    return <MessagePicker library={library} onPick={(id) => setPresentId(id)} onClose={() => setPresenting(false)} />;
  }

  return (
    <div className="max-w-2xl">
      <SectionTitle eyebrow="Church · The Word — Migdal">The Word — Migdal</SectionTitle>
      <p className="text-xs text-[#5A5751] -mt-2 mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        {canManage
          ? "The Bishop's study — review past messages and prepare new ones, grounded in his own preaching."
          : 'The Church of the Living God — watch past messages, Sundays and Wednesday Bible Study, in the Bishop’s own words.'}
      </p>

      {/* Nehemiah 8 epigraph — the migdal (Neh 8:4, the wooden platform Ezra read
          from) names this space; 8:8 names its purpose: read the Word, give the
          sense, cause understanding. KJV (public domain); translation-flexible. */}
      <blockquote className="border-l-2 border-[#5A6E3D] bg-[#FAF8F4] pl-3 pr-2 py-2 mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        <p className="text-sm text-[#1A1815] italic">“So they read in the book in the law of God distinctly, and gave the sense, and caused them to understand the reading.”</p>
        <footer className="text-[0.6875rem] text-[#5A5751] mt-1">— Nehemiah 8:8 (KJV). Ezra the priest read from a <span className="italic">migdal</span> of wood built for the purpose (Nehemiah 8:4).</footer>
      </blockquote>

      {/* Large-print is the ONE universal control in the header (WCAG 1.4.4) — it
          scales the whole app from a single place, so there is no separate adjuster
          here. "Cause them to understand the reading" (Neh 8:8): the reading text on
          this surface uses rem units (lib/text-size.js) so it grows with that one
          control. A duplicate per-module stepper used to live here; removed so there
          is one control to learn, not two that look the same. */}

      {tabs.length > 1 && (
        <TabScroll className="mb-3">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`px-3 py-2 whitespace-nowrap border-b-2 focus:outline focus:outline-2 focus:outline-[#B85838] ${tab === id ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
          ))}
        </TabScroll>
      )}

      {err && <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-2 mb-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{err}</div>}

      {/* Present live — put a message up on the screen behind the speaker. The same
          shared Presenter the Learn courses use; available on the public library. */}
      {tab === 'library' && canPresent && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => { setPresentId(null); setPresenting(true); }}
            className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            ▶ Present a message (pick + class screen)
          </button>
        </div>
      )}

      {tab === 'library' && (
        <LibraryPanel
          sermons={libraryItems} canEdit={canManage} busy={busy} speakers={speakers} userKey={email}
          pointsByVideo={pointsByVideo} reactionMap={reactionMap} statsMap={statsMap}
          onReact={onReact} onShowWho={onShowWho} signedIn={signedIn}
          onSave={onSave} onDelete={onDelete} onReuse={onReuse}
          onImport={canManage ? (() => importSermonsFromChannel()) : null}
        />
      )}

      {/* Prep is leadership-only — rendered only when canManage AND the tab exists. */}
      {canManage && tab === 'prep' && (
        <PrepPanel sermons={withDocs} canEdit={canManage} onReuse={onReuse} />
      )}
    </div>
  );
}

export { Pulpit };
