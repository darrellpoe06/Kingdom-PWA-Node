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
import { subscribeSongLoves, toggleSongLove, saveSongCrossRef } from '../lib/choir-songbook-sync.js';
import {
  buildSongbook, tallyLoves, allThemes, searchSongbook, filterByTheme,
  suggestSongsForSermon, suggestSongsForText, crossRefSermons, lastSungLabel,
  suggestThemes, parseThemes,
} from '../lib/choir-songbook.js';

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

// --- A single songbook card --------------------------------------------------
function SongCard({ entry, sermons, canEdit, today, onLove, onAdd, onSaveMeta, busy }) {
  const [open, setOpen] = useState(null); // 'add' | 'meta' | 'video' | null
  const embed = youtubeEmbedUrl(entry.youtubeUrl);
  const fits = useMemo(() => crossRefSermons(entry, sermons, { limit: 2 }), [entry, sermons]);
  return (
    <div className="bg-white border border-[#1A1815] p-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{entry.title}</span>
          {entry.lovesCount >= 3 && <Chip tone="reason">♥ most-loved</Chip>}
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

      <div className="flex items-center gap-2 flex-wrap mt-1">
        {embed && <button type="button" onClick={() => setOpen(open === 'video' ? null : 'video')} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`} aria-expanded={open === 'video'}>{open === 'video' ? '▾ Hide' : '▶ Watch'}</button>}
        {!embed && entry.youtubeUrl && <a href={entry.youtubeUrl} target="_blank" rel="noopener noreferrer" className={`${BTN} text-[#B85838] hover:text-[#1A1815] underline`}>▶ Link</a>}
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

// --- Surface -----------------------------------------------------------------
export default function ChoirSongbook({ songs, access }) {
  const canEdit = !!access?.canEdit;
  const [sermons, setSermons] = useState([]);
  const [loves, setLoves] = useState([]);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const today = todayIso();

  useEffect(() => {
    const unsubs = [subscribeSermons(setSermons), subscribeSongLoves(setLoves)];
    return () => unsubs.forEach((u) => { try { u && u(); } catch { /* noop */ } });
  }, []);

  const lovesMap = useMemo(() => tallyLoves(loves), [loves]);
  const songbook = useMemo(() => buildSongbook(songs, { loves: lovesMap, today }), [songs, lovesMap, today]);
  const themes = useMemo(() => allThemes(songbook), [songbook]);
  const visible = useMemo(() => searchSongbook(filterByTheme(songbook, theme), query), [songbook, theme, query]);

  const reportSkip = (res) => { setErr(res && res.skipped ? `Could not save (${res.skipped}). Try again.` : ''); };
  const onLove = async (entry) => { reportSkip(await toggleSongLove(entry.titleKey, entry.lovedByMe)); };
  const onAdd = async (entry, date, type) => { setBusy(true); reportSkip(await reuseSong(toSongRecord(entry), date, type)); setBusy(false); };
  const onSaveMeta = async (entry, fields) => {
    setBusy(true);
    // Coherent across the song's rows; if it's a single library row, saveSong keeps it.
    const res = entry.rowIds.length
      ? await saveSongCrossRef(entry.rowIds, fields)
      : await saveSong({ ...toSongRecord(entry), id: entry.latestId, ...fields, themes: fields.themes });
    reportSkip(res); setBusy(false);
  };

  return (
    <div>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        Every song the choir sings, cross-referenced by scripture, theme, and the message it fits — so Sunday's set is a few taps away. {canEdit ? 'Tag a song once; it stays cross-referenced everywhere.' : 'Tap ♥ on the songs you love.'}
      </p>

      {err && <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-2 mb-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{err}</div>}

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
            <SongCard key={entry.titleKey} entry={entry} sermons={sermons} canEdit={canEdit} today={today} busy={busy} onLove={onLove} onAdd={onAdd} onSaveMeta={onSaveMeta} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          {songbook.length ? 'No songs match — clear the search or theme filter.' : 'No songs yet. Add the week’s music in the This Week tab, then cross-reference it here.'}
        </p>
      )}
    </div>
  );
}

export { ChoirSongbook };
