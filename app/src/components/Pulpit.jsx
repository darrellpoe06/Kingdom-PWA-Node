// =============================================================================
// The Word — Migdal — Bishop Gwin's study (Darrell 2026-06-16).
//
// User-facing name is "The Word — Migdal" (the migdal-'ets / wooden platform Ezra
// the priest stood on to read the Word aloud — Nehemiah 8:4). The internal route
// id stays 'pulpit' (churchView value + deep-link), an invisible implementation
// detail; every label/heading/breadcrumb reads "The Word — Migdal".
//
// RELOCATED from the Choir module's "Sermons" sub-tab into its OWN Church space.
// The Bishop's sermon study does not belong under Choir (worship-team functions);
// it is BG's place to study and review his PAST HISTORICAL messages and to get
// sermon-prep help grounded in his own material. Choir keeps only the worship-
// team surfaces (songs / schedule / roster / availability / team docs / song
// resources / messages); the sermon library + prep moved here intact.
//
// Two surfaces:
//   • Library — every past message (Sundays + Wednesday Bible Study), sourced as
//     LINKS (metadata only, no downloads): watch the service, open the original
//     document, or reuse one as a draft to build a new message from. Backed by
//     the SAME choir_sermons / choir_sermon_documents tables (the 125-message
//     COLG backfill, 0013) — no new table, so the relocation carries the data and
//     the channel-import wiring over verbatim.
//   • Prep from your corpus — sermon-prep help whose corpus is SOURCED FROM HIM:
//     real retrieval over his own past messages (theme / scripture), surfacing
//     what he has preached, the scriptures he has used, and a one-tap reuse-as-
//     draft. The generative outline step is wired to the Word-first local Church
//     model when it is deployed; until then the surface does REAL retrieval and
//     says plainly that the draft assist comes online with the local model — it
//     never paints AI output that did not happen (DR-0076).
//
// Access: getChoirAccess() — owner/admin (BG / Darrell / Christina) get the prep
// tools; any church member may study the library. RLS is the real enforcement.
// Accessibility mirrors Choir: white cards / #1A1815 body, #5A5751 secondary,
// labelled inputs, visible #B85838 focus outline.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { onAuthChange } from '../lib/supabase.js';
import {
  getChoirAccess, youtubeTimedUrl, parseTimecode, formatTimecode,
  subscribeSermons, subscribeSermonDocuments, saveSermon, deleteSermon, reuseSermon,
  saveSermonDocument, importSermonsFromChannel, openSermonDocument,
} from '../lib/choir-sync.js';
import { corpusPrep } from '../lib/pulpit-prep.js';

const todayIso = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
};

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1';

// -----------------------------------------------------------------------------
// Message add/edit form (moved verbatim from Choir's SermonForm)
// -----------------------------------------------------------------------------
function MessageForm({ initial, onSave, onCancel, busy }) {
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
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{f.id ? 'Edit message' : 'Add message'}</div>
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
        <div><label className={LABEL} htmlFor="pm-speaker">Speaker</label><input id="pm-speaker" className={FIELD} value={f.speaker} onChange={set('speaker')} placeholder="Bishop Lloyd E. Gwin" /></div>
        <div><label className={LABEL} htmlFor="pm-scr">Scripture</label><input id="pm-scr" className={FIELD} value={f.scriptureRef} onChange={set('scriptureRef')} placeholder="e.g. 1 Peter 5" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={LABEL} htmlFor="pm-yt">Service video link</label><input id="pm-yt" className={FIELD} value={f.youtubeUrl} onChange={set('youtubeUrl')} placeholder="https://youtu.be/…" /></div>
        <div><label className={LABEL} htmlFor="pm-ts">Sermon starts at (mm:ss)</label><input id="pm-ts" className={FIELD} value={f.startTime} onChange={set('startTime')} placeholder="e.g. 35:10" /></div>
      </div>
      <div><label className={LABEL} htmlFor="pm-doc">Sermon document link (the original message document)</label><input id="pm-doc" className={FIELD} value={f.documentUrl} onChange={set('documentUrl')} placeholder="Link to BG's sermon document" /></div>
      <div><label className={LABEL} htmlFor="pm-notes">Notes (optional)</label><input id="pm-notes" className={FIELD} value={f.notes} onChange={set('notes')} placeholder="Theme, key points…" /></div>
      <div className="flex gap-2 flex-wrap pt-1">
        <button type="button" disabled={busy || !f.title.trim()} onClick={() => onSave({ ...f, startSeconds: parseTimecode(f.startTime) })} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>{busy ? 'Saving…' : 'Save message'}</button>
        <button type="button" onClick={onCancel} className={`${BTN} border border-[#5A5751] text-[#5A5751] hover:bg-white`}>Cancel</button>
      </div>
    </div>
  );
}

function MessageRow({ sermon, canEdit, onEdit, onDelete, onReuse }) {
  const watch = youtubeTimedUrl(sermon.youtubeUrl, sermon.startSeconds);
  return (
    <div className="p-3 border-b border-[#E8E4DC]">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{sermon.title}</span>
          {sermon.status === 'draft' && <span className="text-[9px] uppercase tracking-wider bg-[#5A6E3D] text-white px-1.5 py-0.5">Draft</span>}
          {sermon.scriptureRef && <span className="text-[11px] text-[#5A5751]">{sermon.scriptureRef}</span>}
        </div>
        <span className="text-[11px] text-[#5A5751]">{fmtDate(sermon.serviceDate)} · {sermon.serviceType === 'wednesday' ? 'Wed' : 'Sun'}{sermon.serviceSlot ? ` ${sermon.serviceSlot}` : ''}</span>
      </div>
      {sermon.speaker && <p className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{sermon.speaker}</p>}
      {sermon.notes && <p className="text-[11px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{sermon.notes}</p>}
      <div className="flex gap-2 mt-1 flex-wrap">
        {watch && <a href={watch} target="_blank" rel="noopener noreferrer" className={`${BTN} text-[#B85838] hover:text-[#1A1815] underline`}>▶ Watch{sermon.startSeconds ? ` @ ${formatTimecode(sermon.startSeconds)}` : ''}</a>}
        {sermon.documentUrl && <button type="button" onClick={async () => { const u = await openSermonDocument(sermon.documentUrl); if (u) window.open(u, '_blank', 'noopener'); }} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815] underline`}>📄 Document</button>}
        {canEdit && onReuse && <button type="button" onClick={() => onReuse(sermon)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>↻ Reuse for new</button>}
        {canEdit && <button type="button" onClick={() => onEdit(sermon)} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Edit</button>}
        {canEdit && <button type="button" onClick={() => onDelete(sermon)} className={`${BTN} text-[#991B1B] hover:underline`}>Delete</button>}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Library — the historical message archive (search · watch · document · reuse).
// -----------------------------------------------------------------------------
function LibraryPanel({ sermons, canEdit, onSave, onDelete, onReuse, onImport, busy }) {
  const [form, setForm] = useState(null); // {initial}|null
  const [q, setQ] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const runImport = async () => {
    setImportMsg('Importing…');
    const r = await onImport();
    if (r?.imported >= 0 && r.imported !== undefined) setImportMsg(`Imported ${r.imported} new message(s) from the channel.`);
    else if (r?.skipped === 'no-key') setImportMsg('Add VITE_YOUTUBE_API_KEY (Vercel env) to enable channel import.');
    else setImportMsg(`Import skipped (${r?.skipped || 'error'}).`);
  };
  const drafts = (sermons || []).filter((s) => s.status === 'draft');
  const history = (sermons || []).filter((s) => s.status !== 'draft')
    .filter((s) => !q || `${s.title} ${s.scriptureRef || ''} ${s.speaker || ''}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Every past message — Sundays + Wednesday Bible Study. Watch the service, open the original document, or reuse one as a draft to build a new message from.</p>
      {canEdit && (form ? (
        <MessageForm initial={form.initial} busy={busy} onSave={async (s) => { await onSave(s); setForm(null); }} onCancel={() => setForm(null)} />
      ) : (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <button type="button" onClick={() => setForm({ initial: null })} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>+ Add message</button>
          {onImport && <button type="button" onClick={runImport} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>↻ Import from channel</button>}
          {importMsg && <span className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{importMsg}</span>}
        </div>
      ))}

      {drafts.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#5A6E3D] mb-1">In progress</div>
          <div className="bg-white border border-[#5A6E3D]">
            {drafts.map((s) => <MessageRow key={s.id} sermon={s} canEdit={canEdit} onEdit={(x) => setForm({ initial: x })} onDelete={onDelete} onReuse={onReuse} />)}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <label className="sr-only" htmlFor="pm-q">Search messages</label>
        <input id="pm-q" className={FIELD} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search past messages by title, scripture, theme…" />
      </div>
      {history.length ? (
        <>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#5A5751] mb-1">{history.length} message{history.length === 1 ? '' : 's'}</p>
          <div className="bg-white border border-[#1A1815]">
            {history.map((s) => <MessageRow key={s.id} sermon={s} canEdit={canEdit} onEdit={(x) => setForm({ initial: x })} onDelete={onDelete} onReuse={onReuse} />)}
          </div>
        </>
      ) : <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{q ? 'No messages match.' : 'No messages yet. Import them from the channel or add one.'}</p>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Prep from your corpus — REAL retrieval over BG's own past messages (the pure
// engine lives in ../lib/pulpit-prep.js so it is unit-tested in node). No
// fabrication — the help is "sourced from him" because it IS his history.
// -----------------------------------------------------------------------------
function PrepPanel({ sermons, canEdit, onReuse }) {
  const [query, setQuery] = useState('');
  const { matches, scriptures, span, total } = corpusPrep(sermons, query);
  const searched = query.trim().length > 0;
  return (
    <div className="space-y-3">
      <div className="bg-[#FAF8F4] border border-[#5A6E3D] p-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">Prep from your own messages</div>
        <p className="text-[11px] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Study help grounded in <strong>your</strong> corpus — your {total} past message{total === 1 ? '' : 's'}. Enter a theme or a scripture and see what you have already preached on it, the scriptures you have leaned on, and start a new draft from any of them. (The Word-first local Church model will draft an outline from this material once it is deployed; today this does real retrieval over your history, nothing invented.)
        </p>
        <label className="sr-only" htmlFor="pp-q">Theme or scripture</label>
        <input id="pp-q" className={FIELD} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. faith · Psalm 23 · restoration · victory" />
      </div>

      {searched && (
        matches.length ? (
          <>
            <div className="bg-white border border-[#1A1815] p-3">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#5A5751] mb-1">Scriptures you have preached on this {span ? `· ${span}` : ''}</div>
              {scriptures.length
                ? <div className="flex flex-wrap gap-1.5">{scriptures.map((s) => <span key={s} className="text-[11px] bg-[#FAF8F4] border border-[#E8E4DC] px-1.5 py-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{s}</span>)}</div>
                : <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No scripture references recorded on these yet.</p>}
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#5A5751]">{matches.length} of your message{matches.length === 1 ? '' : 's'} touch “{query.trim()}”</p>
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

// -----------------------------------------------------------------------------
// Surface
// -----------------------------------------------------------------------------
const TABS = [['library', 'Message library'], ['prep', 'Prep from your corpus']];

export default function Pulpit() {
  const [signedIn, setSignedIn] = useState(false);
  const [access, setAccess] = useState({ canSee: false, canEdit: false });
  const [tab, setTab] = useState('library');
  const [sermons, setSermons] = useState([]);
  const [sermonDocs, setSermonDocs] = useState([]); // owner/admin only (RLS)
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => onAuthChange((s) => setSignedIn(!!s)), []);

  useEffect(() => {
    let alive = true;
    if (!signedIn) { setAccess({ canSee: false, canEdit: false }); return undefined; }
    getChoirAccess().then((a) => { if (alive) setAccess(a); });
    return () => { alive = false; };
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn || !access.canSee) return undefined;
    const unsubs = [subscribeSermons(setSermons), subscribeSermonDocuments(setSermonDocs)];
    return () => unsubs.forEach((u) => { try { u && u(); } catch { /* noop */ } });
  }, [signedIn, access.canSee]);

  const reportSkip = (res) => { if (res && res.skipped) setErr(`Could not save (${res.skipped}). Your changes were not stored — try again.`); else setErr(''); };

  // The library + prep both render the same message shape, with the admin-only
  // document link merged in (RLS returns docs only to owner/admin).
  const withDocs = sermons.map((s) => ({ ...s, documentUrl: (sermonDocs.find((d) => d.sermonId === s.id) || {}).documentUrl || null }));

  const onSave = async (s) => { setBusy(true); const r = await saveSermon(s); reportSkip(r); if (r?.id) await saveSermonDocument(r.id, s.documentUrl); setBusy(false); };
  const onDelete = async (s) => { reportSkip(await deleteSermon(s.id)); };
  const onReuse = async (s) => { const d = new Date(); d.setDate(d.getDate() + 7); reportSkip(await reuseSermon(s, d.toISOString().slice(0, 10), s.serviceType)); setTab('library'); };

  if (!signedIn) {
    return (
      <div className="max-w-2xl">
        <SectionTitle eyebrow="Church · The Word — Migdal">The Word — Migdal</SectionTitle>
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Sign in to open the Bishop's study.</p>
      </div>
    );
  }
  if (!access.canSee) {
    return (
      <div className="max-w-2xl">
        <SectionTitle eyebrow="Church · The Word — Migdal">The Word — Migdal</SectionTitle>
        <div className="bg-white border border-[#E8E4DC] p-6 text-center">
          <div className="text-2xl mb-1" aria-hidden="true">📖</div>
          <p className="text-sm text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>This is the Bishop's study.</p>
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Ask to be added to the church leadership, then BG's message history and prep tools will show up here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <SectionTitle eyebrow="Church · The Word — Migdal">The Word — Migdal · the Bishop's study</SectionTitle>
      <p className="text-xs text-[#5A5751] -mt-2 mb-3" style={{ fontFamily: '"Fraunces", serif' }}>Bishop Gwin's space to study and review his past messages, and to prepare new ones grounded in his own preaching.</p>

      {/* Nehemiah 8 epigraph — the migdal (Neh 8:4, the wooden platform Ezra read
          from) names this space; 8:8 names its purpose: read the Word, give the
          sense, cause understanding. KJV (public domain); translation-flexible. */}
      <blockquote className="border-l-2 border-[#5A6E3D] bg-[#FAF8F4] pl-3 pr-2 py-2 mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        <p className="text-sm text-[#1A1815] italic">“So they read in the book in the law of God distinctly, and gave the sense, and caused them to understand the reading.”</p>
        <footer className="text-[11px] text-[#5A5751] mt-1">— Nehemiah 8:8 (KJV). Ezra the priest read from a <span className="italic">migdal</span> of wood built for the purpose (Nehemiah 8:4).</footer>
      </blockquote>

      <div className="flex gap-1 text-xs mb-3 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`px-3 py-2 whitespace-nowrap border-b-2 focus:outline focus:outline-2 focus:outline-[#B85838] ${tab === id ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
        ))}
      </div>

      {err && <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-2 mb-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{err}</div>}

      {tab === 'library' && (
        <LibraryPanel
          sermons={withDocs} canEdit={access.canEdit} busy={busy}
          onSave={onSave} onDelete={onDelete} onReuse={onReuse}
          onImport={() => importSermonsFromChannel()}
        />
      )}

      {tab === 'prep' && (
        <PrepPanel sermons={withDocs} canEdit={access.canEdit} onReuse={onReuse} />
      )}
    </div>
  );
}

export { Pulpit };
