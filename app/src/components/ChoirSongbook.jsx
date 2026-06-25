// =============================================================================
// ChoirSongbook — cross-referenced songbook so the choir pulls Sunday's song in
// seconds (Darrell 2026-06-24: "the easiest way possible").
// =============================================================================
// A DERIVED view over the real set-list rows (choir_songs): songs grouped by
// title, each cross-referenced with scripture, themes, the sermon it fits, the
// practical detail (key / arrangement / soloist / last-sung), and the body's
// most-loved hearts. The director can:
//   • SEARCH/FILTER by theme or scripture (type "Psalm 100" or "thanksgiving"),
//   • get SUGGESTIONS for an upcoming message/theme (with the reason WHY),
//   • one-tap ADD a song onto a service set-list,
//   • see WHERE/WHEN it was last used,
//   • ❤ the songs the choir loves (most-loved rise to the top).
// Pure cross-reference logic lives in lib/choir-songbook.js (unit-tested); the
// canonical song writes reuse choir-sync.js (saveSong/reuseSong). Nothing is
// painted — every value traces to a real row (Reality-trace / Verification).
//
// Accessibility mirrors the Choir module: white cards / #1A1815 body, #5A5751
// secondary, labelled inputs, visible #B85838 focus outline.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { youtubeEmbedUrl, reuseSong, saveSong, subscribeSermons } from '../lib/choir-sync.js';
import {
  subscribeSongLoves, toggleSongLove, saveSongCrossRef,
  importRepertoireJson, scanArchiveForSongs, confirmArchiveSong,
} from '../lib/choir-songbook-sync.js';
import {
  buildSongbook, tallyLoves, allThemes, searchSongbook, filterByTheme,
  suggestSongsForSermon, suggestSongsForText, crossRefSermons, lastSungLabel,
  suggestThemes, parseThemes,
} from '../lib/choir-songbook.js';
import { subscribeSmeNotes, importKnowledgeJson, reviewSmeNote, deleteSmeNote } from '../lib/choir-sme-sync.js';
import { attachSmeNotes, generalGuidance, pendingSmeNotes, orphanSmeNotes } from '../lib/choir-sme-notes.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const todayIso = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
};
// Tones reuse ONLY palette tokens midnight already remaps (no new inline color
// bypasses the per-theme remap — DR-0076 contrast guard).
const Chip = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: 'bg-[#E8E4DC] text-[#1A1815]',
    scripture: 'bg-[#E8E4DC] text-[#5A5751]',
    theme: 'bg-[#F2F4EC] text-[#5A6E3D]',
    reason: 'bg-[#FAF8F4] text-[#B85838]',
  };
  return <span className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 ${tones[tone] || tones.neutral}`}>{children}</span>;
};

// Build a song-shaped object for reuse/save from a Songbook entity.
function toSongRecord(entry) {
  return {
    title: entry.title,
    youtubeUrl: entry.youtubeUrl ?? null,
    scriptureRef: (entry.scriptureRefs || []).join('; ') || null,
    notes: entry.notes ?? null,
    lyrics: entry.lyrics ?? null,
    startSeconds: entry.startSeconds ?? null,
    serviceType: 'sunday',
    themes: entry.themes || [],
    songKey: (entry.keys || [])[0] || null,
    arrangement: (entry.arrangements || [])[0] || null,
    soloist: (entry.soloists || [])[0] || null,
    sermonRef: (entry.sermonRefs || [])[0] || null,
  };
}

// --- One-tap "add to a service" ---------------------------------------------
function AddToService({ entry, onAdd, onClose }) {
  const [date, setDate] = useState(todayIso());
  const [type, setType] = useState('sunday');
  return (
    <div className="mt-2 flex items-end gap-2 flex-wrap bg-[#FAF8F4] border border-[#5A6E3D] p-2">
      <div><label className={LABEL} htmlFor={`add-d-${entry.titleKey}`}>Add on</label><input id={`add-d-${entry.titleKey}`} type="date" className={FIELD} value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div><label className={LABEL} htmlFor={`add-t-${entry.titleKey}`}>Service</label>
        <select id={`add-t-${entry.titleKey}`} className={FIELD} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="sunday">Sunday service</option><option value="wednesday">Wednesday</option><option value="rehearsal">Thursday rehearsal</option><option value="both">Both</option>
        </select>
      </div>
      <button type="button" onClick={() => { onAdd(entry, date, type); onClose(); }} className={`${BTN} bg-[#5A6E3D] text-white font-semibold`}>Add it</button>
      <button type="button" onClick={onClose} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
    </div>
  );
}

// --- Cross-reference metadata editor (director only) -------------------------
function MetaEditor({ entry, sermons, busy, onSave, onClose }) {
  const [f, setF] = useState({
    themes: (entry.themes || []).join(', '),
    songKey: (entry.keys || [])[0] || '',
    arrangement: (entry.arrangements || [])[0] || '',
    soloist: (entry.soloists || [])[0] || '',
    sermonRef: (entry.sermonRefs || [])[0] || '',
  });
  const suggested = useMemo(
    () => suggestThemes(`${entry.title} ${entry.notes || ''} ${(entry.scriptureRefs || []).join(' ')}`)
      .filter((t) => !parseThemes(f.themes).includes(t)),
    [entry, f.themes]);
  const addTheme = (t) => setF((p) => ({ ...p, themes: parseThemes(`${p.themes}, ${t}`).join(', ') }));
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div className="mt-2 bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Cross-reference "{entry.title}"</div>
      <div>
        <label className={LABEL} htmlFor={`m-themes-${entry.titleKey}`}>Themes (comma-separated)</label>
        <input id={`m-themes-${entry.titleKey}`} className={FIELD} value={f.themes} onChange={set('themes')} placeholder="e.g. praise, thanksgiving" />
        {suggested.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-1">
            <span className="text-[0.5625rem] text-[#5A5751]">Suggested:</span>
            {suggested.map((t) => (
              <button key={t} type="button" onClick={() => addTheme(t)} className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 bg-[#F2F4EC] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white">+ {t}</button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className={LABEL} htmlFor={`m-key-${entry.titleKey}`}>Key</label><input id={`m-key-${entry.titleKey}`} className={FIELD} value={f.songKey} onChange={set('songKey')} placeholder="e.g. Ab" /></div>
        <div><label className={LABEL} htmlFor={`m-arr-${entry.titleKey}`}>Arrangement</label><input id={`m-arr-${entry.titleKey}`} className={FIELD} value={f.arrangement} onChange={set('arrangement')} placeholder="Choir + solo" /></div>
        <div><label className={LABEL} htmlFor={`m-solo-${entry.titleKey}`}>Soloist / parts</label><input id={`m-solo-${entry.titleKey}`} className={FIELD} value={f.soloist} onChange={set('soloist')} placeholder="e.g. Sis. M (lead)" /></div>
      </div>
      <div>
        <label className={LABEL} htmlFor={`m-sermon-${entry.titleKey}`}>Fits the message (optional)</label>
        <select id={`m-sermon-${entry.titleKey}`} className={FIELD} value={f.sermonRef} onChange={set('sermonRef')}>
          <option value="">— none —</option>
          {(sermons || []).slice(0, 60).map((s) => (
            <option key={s.id} value={s.id}>{s.title}{s.serviceDate ? ` · ${fmtDate(s.serviceDate)}` : ''}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" disabled={busy} onClick={() => onSave(entry, { ...f, themes: parseThemes(f.themes) })} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>{busy ? 'Saving…' : 'Save cross-reference'}</button>
        <button type="button" onClick={onClose} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
      </div>
    </div>
  );
}

// The keyboardist's (Christian) SME note for a song: how to play it, the key,
// the arrangement — sourced from his video, with provenance + a confirm action.
function KeyboardistNote({ sme, canEdit, onConfirm, busy }) {
  const [open, setOpen] = useState(false);
  if (!sme) return null;
  const unconfirmed = sme.status !== 'reviewed';
  return (
    <div className="mt-2 bg-[#F2F4EC] border border-[#5A6E3D] p-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <span className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">🎹 {sme.smeName} · {sme.smeRole}</span>
        <div className="flex items-center gap-1">
          {sme.confidence && <Chip tone="theme">{sme.confidence} confidence</Chip>}
          {unconfirmed && <Chip tone="reason">unconfirmed</Chip>}
        </div>
      </div>
      <div className="text-[0.8125rem] text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
        {[sme.songKey && `Key: ${sme.songKey}`, sme.arrangement].filter(Boolean).join(' · ')}
      </div>
      {sme.howToPlay && <p className="text-[0.8125rem] text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{sme.howToPlay}</p>}
      <div className="flex items-center gap-2 flex-wrap mt-1">
        {sme.sourceQuote && <button type="button" onClick={() => setOpen((o) => !o)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`} aria-expanded={open}>{open ? '▾ Hide source' : '“ Source'}</button>}
        {canEdit && unconfirmed && <button type="button" disabled={busy} onClick={() => onConfirm(sme)} className={`${BTN} bg-[#5A6E3D] text-white font-semibold disabled:opacity-50`}>✓ Confirm</button>}
      </div>
      {open && sme.sourceQuote && (
        <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>“{sme.sourceQuote}”{sme.sourceVideo ? ` — ${sme.sourceVideo}` : ''}</p>
      )}
    </div>
  );
}

// --- A single songbook card --------------------------------------------------
function SongCard({ entry, sermons, canEdit, today, onLove, onAdd, onSaveMeta, onConfirmSme, onConfirmArchive, busy }) {
  const [open, setOpen] = useState(null); // 'add' | 'meta' | 'video' | null
  const embed = youtubeEmbedUrl(entry.youtubeUrl);
  const fits = useMemo(() => crossRefSermons(entry, sermons, { limit: 2 }), [entry, sermons]);
  return (
    <div className="bg-white border border-[#1A1815] p-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{entry.title}</span>
          {entry.lovesCount >= 3 && <Chip tone="reason">♥ most-loved</Chip>}
          {entry.fromArchive && <Chip tone="scripture">📼 archive</Chip>}
          {entry.needsReview && <Chip tone="reason">needs review</Chip>}
        </div>
        <button
          type="button"
          onClick={() => onLove(entry)}
          aria-pressed={entry.lovedByMe}
          aria-label={entry.lovedByMe ? `Remove your love for ${entry.title}` : `Love ${entry.title}`}
          className={`${BTN} ${entry.lovedByMe ? 'text-[#B85838]' : 'text-[#5A5751] hover:text-[#B85838]'}`}
        >
          {entry.lovedByMe ? '♥' : '♡'} {entry.lovesCount || 0}
        </button>
      </div>

      {/* scripture + theme chips */}
      {(entry.scriptureRefs.length > 0 || entry.themes.length > 0) && (
        <div className="flex items-center gap-1 flex-wrap mt-1">
          {entry.scriptureRefs.map((r) => <Chip key={`s-${r}`} tone="scripture">{r}</Chip>)}
          {entry.themes.map((t) => <Chip key={`t-${t}`} tone="theme">{t}</Chip>)}
        </div>
      )}

      {/* practical line */}
      <div className="text-[0.6875rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
        {lastSungLabel(entry, today)}
        {entry.timesUsed > 0 && ` · used ${entry.timesUsed}×`}
        {entry.nextScheduled && ` · next ${fmtDate(entry.nextScheduled)}`}
        {(entry.keys[0] || entry.arrangements[0] || entry.soloists[0]) && ' · '}
        {[entry.keys[0] && `key ${entry.keys[0]}`, entry.arrangements[0], entry.soloists[0]].filter(Boolean).join(' · ')}
      </div>

      {fits.length > 0 && (
        <div className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
          Fits: {fits.map((f) => f.sermon.title).join('; ')}
        </div>
      )}

      <KeyboardistNote sme={entry.sme} canEdit={canEdit} busy={busy} onConfirm={onConfirmSme} />

      <div className="flex items-center gap-2 flex-wrap mt-1">
        {embed && <button type="button" onClick={() => setOpen(open === 'video' ? null : 'video')} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`} aria-expanded={open === 'video'}>{open === 'video' ? '▾ Hide' : '▶ Watch'}</button>}
        {!embed && entry.youtubeUrl && <a href={entry.youtubeUrl} target="_blank" rel="noopener noreferrer" className={`${BTN} text-[#B85838] hover:text-[#1A1815] underline`}>▶ Link</a>}
        {canEdit && entry.needsReview && <button type="button" disabled={busy} onClick={() => onConfirmArchive(entry)} className={`${BTN} bg-[#5A6E3D] text-white font-semibold disabled:opacity-50`}>✓ Confirm song</button>}
        {canEdit && <button type="button" onClick={() => setOpen(open === 'add' ? null : 'add')} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>+ Add to service</button>}
        {canEdit && <button type="button" onClick={() => setOpen(open === 'meta' ? null : 'meta')} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>✎ Cross-reference</button>}
      </div>

      {open === 'add' && <AddToService entry={entry} onAdd={onAdd} onClose={() => setOpen(null)} />}
      {open === 'meta' && <MetaEditor entry={entry} sermons={sermons} busy={busy} onSave={(e, fields) => { onSaveMeta(e, fields); setOpen(null); }} onClose={() => setOpen(null)} />}
      {open === 'video' && embed && (
        <div className="mt-2 aspect-video"><iframe src={embed} title={`${entry.title} — video`} className="w-full h-full border border-[#1A1815]" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" /></div>
      )}
    </div>
  );
}

// --- Suggestion panel: "what should we sing?" --------------------------------
function SuggestPanel({ songbook, sermons, canEdit, today, onAdd }) {
  const [mode, setMode] = useState('sermon'); // 'sermon' | 'theme'
  const [sermonId, setSermonId] = useState('');
  const [text, setText] = useState('');
  const orderedSermons = useMemo(
    () => (sermons || []).slice().sort((a, b) => String(b.serviceDate || '').localeCompare(String(a.serviceDate || ''))),
    [sermons]);
  const results = useMemo(() => {
    if (mode === 'sermon') {
      const sermon = orderedSermons.find((s) => s.id === sermonId);
      return sermon ? suggestSongsForSermon(songbook, sermon) : [];
    }
    return suggestSongsForText(songbook, text);
  }, [mode, sermonId, text, orderedSermons, songbook]);

  return (
    <div className="bg-[#FAF8F4] border border-[#5A6E3D] p-3 mb-4">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">Find songs for Sunday</div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Pick the upcoming message or type a theme/scripture — the songbook suggests what fits, and tells you why.</p>
      <div className="flex gap-1 mb-2">
        <button type="button" onClick={() => setMode('sermon')} className={`${BTN} ${mode === 'sermon' ? 'bg-[#5A6E3D] text-white' : 'border border-[#5A6E3D] text-[#5A6E3D]'}`}>By message</button>
        <button type="button" onClick={() => setMode('theme')} className={`${BTN} ${mode === 'theme' ? 'bg-[#5A6E3D] text-white' : 'border border-[#5A6E3D] text-[#5A6E3D]'}`}>By theme / verse</button>
      </div>
      {mode === 'sermon' ? (
        <div><label className={LABEL} htmlFor="sg-sermon">Upcoming / recent message</label>
          <select id="sg-sermon" className={FIELD} value={sermonId} onChange={(e) => setSermonId(e.target.value)}>
            <option value="">— choose a message —</option>
            {orderedSermons.slice(0, 60).map((s) => <option key={s.id} value={s.id}>{s.title}{s.scriptureRef ? ` · ${s.scriptureRef}` : ''}{s.serviceDate ? ` · ${fmtDate(s.serviceDate)}` : ''}</option>)}
          </select>
        </div>
      ) : (
        <div><label className={LABEL} htmlFor="sg-text">Theme, occasion, or scripture</label>
          <input id="sg-text" className={FIELD} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. thanksgiving, communion, Psalm 23" />
        </div>
      )}
      {((mode === 'sermon' && sermonId) || (mode === 'theme' && text.trim())) && (
        <div className="mt-2 space-y-2" aria-live="polite">
          {results.length ? results.map(({ song, reasons }) => (
            <div key={song.titleKey} className="bg-white border border-[#E8E4DC] p-2">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{song.title}</span>
                <span className="text-[0.6875rem] text-[#5A5751]">{lastSungLabel(song, today)}</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap mt-0.5">
                {reasons.map((r, i) => <Chip key={i} tone="reason">{r}</Chip>)}
              </div>
              {canEdit && (
                <div className="mt-1"><AddSuggestion entry={song} onAdd={onAdd} /></div>
              )}
            </div>
          )) : <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No cross-referenced matches yet. Tag a few songs' themes/scripture and matches will appear here.</p>}
        </div>
      )}
    </div>
  );
}

// Inline "add this suggestion to a date" toggler.
function AddSuggestion({ entry, onAdd }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>+ Add to a service</button>;
  return <AddToService entry={entry} onAdd={onAdd} onClose={() => setOpen(false)} />;
}

// --- Director "Sources" panel: auto-seed the repertoire + import keyboardist --
// knowledge from the same archive the content engine uses (reviewed, faithful).
function SourcesPanel({ smeNotes, songbook, onScan, onImportRepertoire, onImportKnowledge, onReviewSme, onDeleteSme, busy }) {
  const [open, setOpen] = useState(false);
  const [rep, setRep] = useState('');
  const [know, setKnow] = useState('');
  const [video, setVideo] = useState('');
  const [msg, setMsg] = useState('');
  const pending = useMemo(() => pendingSmeNotes(smeNotes).filter((n) => n.kind === 'song'), [smeNotes]);
  const guidance = useMemo(() => generalGuidance(smeNotes, { includeExtracted: true }), [smeNotes]);
  const orphans = useMemo(() => orphanSmeNotes(smeNotes, songbook), [smeNotes, songbook]);

  const run = async (fn) => { setMsg('Working…'); const r = await fn(); setMsg(r); };

  return (
    <div className="border border-[#5A6E3D] mb-4">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${BTN} w-full text-left text-[#5A6E3D] hover:text-[#1A1815] flex items-center justify-between`}>
        <span>📼 Source the repertoire + keyboardist knowledge</span><span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="p-3 space-y-3 bg-[#FAF8F4]">
          <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            The choir’s past songs live in the church archive (the YouTube channel + NAS recordings). Seed them here — every seeded song is flagged <em>needs review</em> until you confirm it; nothing is guessed.
          </p>

          <div>
            <button type="button" disabled={busy} onClick={() => run(onScan)} className={`${BTN} bg-[#5A6E3D] text-white font-semibold disabled:opacity-50`}>Scan the church YouTube archive</button>
            <p className="text-[0.5625rem] text-[#5A5751] mt-1">Reads song lists / chapters in the channel’s video descriptions (real metadata). For the deeper “what was actually sung” extract, paste the pipeline’s repertoire.json below.</p>
          </div>

          <div>
            <label className={LABEL} htmlFor="src-rep">Import repertoire.json (the SME/content pipeline’s per-song extract)</label>
            <textarea id="src-rep" rows={3} className={FIELD} value={rep} onChange={(e) => setRep(e.target.value)} placeholder='{ "songs": [ { "title": "...", "video_id": "...", "confidence": "high" } ] }' />
            <button type="button" disabled={busy || !rep.trim()} onClick={() => run(async () => { const r = await onImportRepertoire(rep); if (!r.skipped) setRep(''); return r; })} className={`${BTN} bg-[#1A1815] text-white font-semibold disabled:opacity-50 mt-1`}>Import repertoire</button>
          </div>

          <div>
            <label className={LABEL} htmlFor="src-know">Import knowledge.json (Christian, the keyboardist)</label>
            <input className={`${FIELD} mb-1`} value={video} onChange={(e) => setVideo(e.target.value)} placeholder="Source video name (optional, for provenance)" aria-label="Source video name" />
            <textarea id="src-know" rows={3} className={FIELD} value={know} onChange={(e) => setKnow(e.target.value)} placeholder='{ "sme": {"name":"Christian"}, "songs": [ { "title":"...", "key_label":"B", "note":"..." } ] }' />
            <button type="button" disabled={busy || !know.trim()} onClick={() => run(async () => { const r = await onImportKnowledge(know, video); if (!r.skipped) setKnow(''); return r; })} className={`${BTN} bg-[#1A1815] text-white font-semibold disabled:opacity-50 mt-1`}>Import keyboardist knowledge</button>
          </div>

          {msg && <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">{msg}</p>}

          {pending.length > 0 && (
            <div>
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">Keyboardist notes to confirm ({pending.length})</div>
              <div className="space-y-1">
                {pending.map((n) => (
                  <div key={n.id} className="bg-white border border-[#E8E4DC] p-2 text-[0.6875rem]" style={{ fontFamily: '"Fraunces", serif' }}>
                    <strong>{n.titleDisplay}</strong>{n.songKey ? ` · key ${n.songKey}` : ''}{n.confidence ? ` · ${n.confidence}` : ''}
                    {n.howToPlay && <div className="text-[#5A5751]">{n.howToPlay}</div>}
                    <div className="flex gap-2 mt-1">
                      <button type="button" disabled={busy} onClick={() => onReviewSme(n.id, 'reviewed')} className={`${BTN} text-[#166534] hover:underline`}>✓ Confirm</button>
                      <button type="button" disabled={busy} onClick={() => onDeleteSme(n.id)} className={`${BTN} text-[#991B1B] hover:underline`}>Discard</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orphans.length > 0 && (
            <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              {orphans.length} keyboardist note{orphans.length > 1 ? 's' : ''} reference a song not in the songbook yet ({orphans.slice(0, 4).map((n) => n.titleDisplay).join(', ')}). Add the song, then the note will attach.
            </p>
          )}

          {guidance.length > 0 && (
            <div>
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">General guidance from {guidance[0].smeName}</div>
              {guidance.map((g) => (
                <div key={g.id} className="text-[0.6875rem] text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>
                  {g.topic ? <strong>{g.topic}: </strong> : null}{g.guidance}
                  {g.status !== 'reviewed' && <button type="button" disabled={busy} onClick={() => onReviewSme(g.id, 'reviewed')} className={`${BTN} text-[#166534] hover:underline ml-1`}>✓</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Surface -----------------------------------------------------------------
export default function ChoirSongbook({ songs, access }) {
  const canEdit = !!access?.canEdit;
  const [sermons, setSermons] = useState([]);
  const [loves, setLoves] = useState([]);
  const [smeNotes, setSmeNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const today = todayIso();

  useEffect(() => {
    const unsubs = [subscribeSermons(setSermons), subscribeSongLoves(setLoves), subscribeSmeNotes(setSmeNotes)];
    return () => unsubs.forEach((u) => { try { u && u(); } catch { /* noop */ } });
  }, []);

  const lovesMap = useMemo(() => tallyLoves(loves), [loves]);
  const baseSongbook = useMemo(() => buildSongbook(songs, { loves: lovesMap, today }), [songs, lovesMap, today]);
  // Confirmed keyboardist notes ride on every song; the director also sees the
  // unconfirmed ones (to review). Faithful: extracted = unconfirmed until reviewed.
  const songbook = useMemo(() => attachSmeNotes(baseSongbook, smeNotes, { includeExtracted: canEdit }), [baseSongbook, smeNotes, canEdit]);
  const themes = useMemo(() => allThemes(songbook), [songbook]);
  const visible = useMemo(() => searchSongbook(filterByTheme(songbook, theme), query), [songbook, theme, query]);

  const reportSkip = (res) => { setErr(res && res.skipped ? `Could not save (${res.skipped}). Try again.` : ''); };
  const onLove = async (entry) => { reportSkip(await toggleSongLove(entry.titleKey, entry.lovedByMe)); };
  const onAdd = async (entry, date, type) => { setBusy(true); reportSkip(await reuseSong(toSongRecord(entry), date, type)); setBusy(false); };
  const onConfirmSme = async (sme) => { setBusy(true); reportSkip(await reviewSmeNote(sme.id, 'reviewed')); setBusy(false); };
  const onConfirmArchive = async (entry) => { setBusy(true); for (const id of entry.reviewRowIds) await confirmArchiveSong(id); setBusy(false); };
  const onSaveMeta = async (entry, fields) => {
    setBusy(true);
    // Coherent across the song's rows; if it's a single library row, saveSong keeps it.
    const res = entry.rowIds.length
      ? await saveSongCrossRef(entry.rowIds, fields)
      : await saveSong({ ...toSongRecord(entry), id: entry.latestId, ...fields, themes: fields.themes });
    reportSkip(res); setBusy(false);
  };
  // Source actions return a human-readable status string for the panel.
  const onScan = async () => { setBusy(true); const r = await scanArchiveForSongs(); setBusy(false);
    if (r.skipped === 'no-key') return 'No YouTube API key set — paste the pipeline’s repertoire.json instead.';
    if (r.skipped) return `Couldn’t scan (${r.skipped}).`;
    return `Scanned ${r.scanned} videos · seeded ${r.imported} song${r.imported === 1 ? '' : 's'} (all need review).`; };
  const onImportRepertoire = async (text) => { setBusy(true); const r = await importRepertoireJson(text); setBusy(false);
    if (r.skipped === 'bad-json') return 'That isn’t valid JSON — paste the pipeline’s repertoire.json.';
    if (r.skipped === 'empty') return 'No songs found in that file.';
    if (r.skipped) return `Couldn’t import (${r.skipped}).`;
    return `Seeded ${r.imported} song${r.imported === 1 ? '' : 's'}${r.unclear?.length ? ` · ${r.unclear.length} to confirm with the team` : ''}.`; };
  const onImportKnowledge = async (text, video) => { setBusy(true); const r = await importKnowledgeJson(text, { sourceVideo: video }); setBusy(false);
    if (r.skipped === 'bad-json') return 'That isn’t valid JSON — paste Christian’s knowledge.json.';
    if (r.skipped === 'empty') return 'No song notes found in that file.';
    if (r.skipped) return `Couldn’t import (${r.skipped}).`;
    return `Imported ${r.count} note${r.count === 1 ? '' : 's'} — confirm them below${r.unclear?.length ? ` · ${r.unclear.length} to ask Christian` : ''}.`; };

  return (
    <div>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        Every song the choir sings, cross-referenced by scripture, theme, the message it fits, and how the keyboardist plays it — so Sunday's set is a few taps away. {canEdit ? 'Seed the repertoire from the archive below; tag a song once and it stays cross-referenced everywhere.' : 'Tap ♥ on the songs you love.'}
      </p>

      {err && <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-2 mb-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{err}</div>}

      {canEdit && (
        <SourcesPanel
          smeNotes={smeNotes} songbook={songbook} busy={busy}
          onScan={onScan} onImportRepertoire={onImportRepertoire} onImportKnowledge={onImportKnowledge}
          onReviewSme={async (id, status) => { reportSkip(await reviewSmeNote(id, status)); }}
          onDeleteSme={async (id) => { reportSkip(await deleteSmeNote(id)); }}
        />
      )}

      <SuggestPanel songbook={songbook} sermons={sermons} canEdit={canEdit} today={today} onAdd={onAdd} />

      <div className="mb-2">
        <label className="sr-only" htmlFor="sb-search">Search songs by theme or scripture</label>
        <input id="sb-search" className={FIELD} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a song, theme, or scripture (e.g. Psalm 100)…" />
      </div>
      {themes.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-3">
          <button type="button" onClick={() => setTheme('')} className={`text-[0.5625rem] uppercase tracking-wider px-2 py-1 ${!theme ? 'bg-[#1A1815] text-white' : 'bg-[#E8E4DC] text-[#1A1815] hover:bg-[#5A6E3D] hover:text-white'}`}>All</button>
          {themes.map((t) => (
            <button key={t} type="button" onClick={() => setTheme(theme === t ? '' : t)} className={`text-[0.5625rem] uppercase tracking-wider px-2 py-1 ${theme === t ? 'bg-[#5A6E3D] text-white' : 'bg-[#F2F4EC] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white'}`}>{t}</button>
          ))}
        </div>
      )}

      {visible.length ? (
        <div className="space-y-3">
          {visible.map((entry) => (
            <SongCard key={entry.titleKey} entry={entry} sermons={sermons} canEdit={canEdit} today={today} busy={busy} onLove={onLove} onAdd={onAdd} onSaveMeta={onSaveMeta} onConfirmSme={onConfirmSme} onConfirmArchive={onConfirmArchive} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          {songbook.length ? 'No songs match — clear the search or theme filter.' : (canEdit ? 'No songs yet. Seed the choir’s past repertoire from the church archive using “Source the repertoire” above, or add this week’s music in the This Week tab.' : 'No songs yet. The director is loading the choir’s repertoire from the church archive — check back soon.')}
        </p>
      )}
    </div>
  );
}

export { ChoirSongbook };
