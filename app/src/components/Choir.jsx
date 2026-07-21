// =============================================================================
// Choir — the Church module's choir surface (Darrell 2026-06-14).
//
// Christina (choir director, COLG) maintains the weekly music for the whole
// choir to review — each song with the YouTube video they learn it from — plus
// a yearly schedule (Sunday singing + Thursday rehearsal) and a choir message
// thread. Real, instance-scoped, cross-device-synced data (DR-0061) backed by
// choir-sync.js; editor controls render only for owner/admin (RLS enforces).
//
// Access (decided 2026-06-14): only choir members SEE it; owner/admin EDIT.
// Christina (owner/admin) sees it immediately; member onboarding (linking real
// user ids into the roster) is the follow-up tied to the community/instance
// model. Until a non-director member is on the roster, they see the gentle
// "ask to be added" state rather than a painted surface.
//
// Accessibility: white cards / #1A1815 body (>= 16:1), #5A5751 secondary (~7:1),
// labelled inputs, visible #B85838 focus outline, aria-live on the thread.
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import SectionTabs from './SectionTabs.jsx';
import ChoirSongWorkshop from './ChoirSongWorkshop.jsx';
import ChoirSongbook from './ChoirSongbook.jsx';
import { onAuthChange } from '../lib/supabase.js';
import {
  getChoirAccess, youtubeEmbedUrl, youtubeTimedUrl, parseTimecode, formatTimecode,
  sortServices, songsForService, buildPastServices, weekBucket, isOutOnDate, suggestBackups, backupsAreCrossSection,
  subscribeSongs, subscribeSchedule, subscribeSermons, subscribeMembers, subscribeChoirMessages, subscribeAbsences,
  subscribeResources, subscribeTeamDocuments, saveTeamDocument, deleteTeamDocument, openTeamDocument,
  saveSong, deleteSong, reuseSong, distinctSongCatalog, saveService, deleteService, addMember, removeMember, sendChoirMessage,
  saveAbsence, deleteAbsence, respondToBackup,
  saveResource, deleteResource,
  inviteToChurch, subscribeChurchInvites, sortInvites, deriveInviteStatus, classifyUpload,
} from '../lib/choir-sync.js';
import { serviceDayLabel } from '../lib/service-day.js';
import { extractHeardQuote, draftWordsFromTranscript } from '../lib/choir-words.js';
import { isAutoDraft } from '../lib/ari-words-training.js';
import { fetchTranscriptsByVideo } from '../lib/sermon-library-sync.js';
import { compressImageFile, fileToDataUrl } from '../lib/image.js';

const ROLE_OPTS = [['member', 'Member'], ['assistant', 'Assistant director'], ['director', 'Director'], ['musician', 'Musician'], ['sound', 'Sound'], ['media', 'Media'], ['tech', 'Tech']];
const roleLabel = (r) => (ROLE_OPTS.find(([k]) => k === r)?.[1]) || r;

const todayIso = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
  catch { return d; }
};

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';

// -----------------------------------------------------------------------------
// Song display (link + collapsible embedded video)
// -----------------------------------------------------------------------------
function SongRow({ song, canEdit, onEdit, onDelete, onReuse, onDraftWords }) {
  const [open, setOpen] = useState(false);
  const [wordsOpen, setWordsOpen] = useState(false);
  const [reuseOpen, setReuseOpen] = useState(false);
  const [reuseDate, setReuseDate] = useState(todayIso());
  const [reuseType, setReuseType] = useState('sunday');
  // Draft-words flow (DR: choir starting point) — status shown inline, never a
  // native alert (the 2026-07-10 UI/UX review's alert class).
  const [draftMsg, setDraftMsg] = useState('');
  const draftWords = async () => {
    setDraftMsg('Reading the recording…');
    const r = await onDraftWords(song);
    if (r?.ok) { setDraftMsg(''); return; }
    setDraftMsg(r?.reason === 'no-transcript'
      ? 'No transcript for this recording yet — the loader fills these in; check back, or add words by hand with Edit.'
      : 'Could not locate this song in the recording — add the words by hand with Edit.');
  };
  const baseEmbed = youtubeEmbedUrl(song.youtubeUrl);
  const embed = baseEmbed && song.startSeconds ? `${baseEmbed}?start=${Math.floor(song.startSeconds)}` : baseEmbed;
  const watchLabel = song.startSeconds ? `▶ Watch @ ${formatTimecode(song.startSeconds)}` : '▶ Watch';
  return (
    <div className="border-b border-[#E8E4DC] py-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{song.title}</span>
          {song.needsReview && (
            <span className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#B85838] text-[#B85838]" title="Auto-drafted from the service transcript — please verify or correct the title.">Draft · verify</span>
          )}
          {song.scriptureRef && <span className="text-[0.6875rem] text-[#5A5751]">{song.scriptureRef}</span>}
        </div>
        <div className="flex items-center gap-2">
          {embed && (
            <button type="button" onClick={() => setOpen((o) => !o)} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`} aria-expanded={open}>
              {open ? '▾ Hide video' : watchLabel}
            </button>
          )}
          {!embed && song.youtubeUrl && (
            <a href={youtubeTimedUrl(song.youtubeUrl, song.startSeconds)} target="_blank" rel="noopener noreferrer" className={`${BTN} text-[#B85838] hover:text-[#1A1815] underline`}>{watchLabel.replace('Watch', 'Link')}</a>
          )}
          {song.lyrics
            ? <button type="button" onClick={() => setWordsOpen((o) => !o)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`} aria-expanded={wordsOpen}>{wordsOpen ? '▾ Hide words' : '🎵 Words'}</button>
            /* No lyrics yet: give stewards a PLACE to add them (Darrell 2026-07-03:
               "most spots don't have a place to add words") — opens the edit form
               wherever Edit itself is available. */
            : (canEdit && onEdit && <button type="button" onClick={() => onEdit(song)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>+ Words</button>)}
          {!song.lyrics && canEdit && onDraftWords && song.videoId && (
            <button type="button" onClick={draftWords} title="Pull a starting draft of the words from this service's transcript — then trim it to what the choir sings."
              className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>+ Draft words from the recording</button>
          )}
          {canEdit && onReuse && <button type="button" onClick={() => setReuseOpen((o) => !o)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>↻ Reuse</button>}
          {canEdit && onEdit && <button type="button" onClick={() => onEdit(song)} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Edit</button>}
          {canEdit && onDelete && <button type="button" onClick={() => onDelete(song)} className={`${BTN} text-[#991B1B] hover:underline`}>Delete</button>}
        </div>
      </div>
      {song.notes && <p className="text-[0.6875rem] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{song.notes}</p>}
      {draftMsg && <p role="status" className="text-[0.6875rem] text-[#B85838] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{draftMsg}</p>}
      {wordsOpen && song.lyrics && (
        <div className="mt-2">
          {isAutoDraft(song.lyrics) && (
            <p className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] mb-1">Auto-draft from the recording — Edit to trim it to the sung words; the confirmed sheet becomes Ari's next lesson</p>
          )}
          <pre className="p-2 bg-[#FAF8F4] border border-[#E8E4DC] text-sm whitespace-pre-wrap" style={{ fontFamily: '"Fraunces", serif' }}>{song.lyrics}</pre>
        </div>
      )}
      {reuseOpen && onReuse && (
        <div className="mt-2 flex items-end gap-2 flex-wrap bg-[#FAF8F4] border border-[#5A6E3D] p-2">
          <div><label className={LABEL} htmlFor={`reuse-d-${song.id}`}>Reuse on</label><input id={`reuse-d-${song.id}`} type="date" className={FIELD} value={reuseDate} onChange={(e) => setReuseDate(e.target.value)} /></div>
          <div><label className={LABEL} htmlFor={`reuse-t-${song.id}`}>Service</label>
            <select id={`reuse-t-${song.id}`} className={FIELD} value={reuseType} onChange={(e) => setReuseType(e.target.value)}>
              <option value="sunday">Sunday service</option><option value="rehearsal">Thursday rehearsal</option><option value="both">Both</option>
            </select>
          </div>
          <button type="button" onClick={() => { onReuse(song, reuseDate, reuseType); setReuseOpen(false); }} className={`${BTN} bg-[#5A6E3D] text-white font-semibold`}>Schedule it</button>
        </div>
      )}
      {open && embed && (
        <div className="mt-2 aspect-video">
          <iframe src={embed} title={`${song.title} — rehearsal video`} className="w-full h-full border border-[#1A1815]" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Song add/edit form
// -----------------------------------------------------------------------------
function SongForm({ initial, onSave, onCancel, busy }) {
  const [f, setF] = useState({
    id: initial?.id || null,
    title: initial?.title || '',
    youtubeUrl: initial?.youtubeUrl || '',
    scriptureRef: initial?.scriptureRef || '',
    notes: initial?.notes || '',
    lyrics: initial?.lyrics || '',
    serviceDate: initial?.serviceDate || todayIso(),
    serviceType: initial?.serviceType || 'sunday',
    startTime: initial?.startSeconds != null ? formatTimecode(initial.startSeconds) : '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = () => onSave({ ...f, startSeconds: parseTimecode(f.startTime) });
  // The form comes to the USER as an overlay on a still screen — the page must
  // never jump or scroll out from under the tap (Darrell 2026-07-03: "I hate
  // when the whole screen moves after one click"). Escape or a backdrop tap
  // cancels, same as the Cancel button.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={f.id ? 'Edit song' : 'Add song'}
      style={{ background: 'rgba(26,24,21,0.6)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 w-full overflow-y-auto" style={{ maxWidth: '42rem', maxHeight: '85vh' }}>
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{f.id ? `Edit song${f.title ? ` — ${f.title}` : ''}` : 'Add song'}</div>
      <div><label className={LABEL} htmlFor="cs-title">Title</label><input id="cs-title" className={FIELD} value={f.title} onChange={set('title')} placeholder="Song title" /></div>
      <div><label className={LABEL} htmlFor="cs-yt">YouTube link (the video the choir learns from)</label><input id="cs-yt" className={FIELD} value={f.youtubeUrl} onChange={set('youtubeUrl')} placeholder="https://youtu.be/…" /></div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className={LABEL} htmlFor="cs-date">For date</label><input id="cs-date" type="date" className={FIELD} value={f.serviceDate} onChange={set('serviceDate')} /></div>
        <div><label className={LABEL} htmlFor="cs-type">Service</label>
          <select id="cs-type" className={FIELD} value={f.serviceType} onChange={set('serviceType')}>
            <option value="sunday">Sunday service</option>
            <option value="wednesday">Wednesday</option>
            <option value="rehearsal">Thursday rehearsal</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div><label className={LABEL} htmlFor="cs-ts">Starts at (mm:ss)</label><input id="cs-ts" className={FIELD} value={f.startTime} onChange={set('startTime')} placeholder="e.g. 12:30" /></div>
      </div>
      <div><label className={LABEL} htmlFor="cs-scr">Scripture (optional)</label><input id="cs-scr" className={FIELD} value={f.scriptureRef} onChange={set('scriptureRef')} placeholder="e.g. Psalm 100" /></div>
      <div><label className={LABEL} htmlFor="cs-notes">Notes (optional)</label><input id="cs-notes" className={FIELD} value={f.notes} onChange={set('notes')} placeholder="Who leads, the part to focus on…" /></div>
      <div><label className={LABEL} htmlFor="cs-lyrics">Words / lyrics (optional)</label><textarea id="cs-lyrics" rows={5} className={FIELD} value={f.lyrics} onChange={set('lyrics')} placeholder="Paste the words the choir sings…" /></div>
      <div className="flex gap-2 flex-wrap pt-1">
        <button type="button" disabled={busy || !f.title.trim()} onClick={save} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>{busy ? 'Saving…' : 'Save song'}</button>
        <button type="button" onClick={onCancel} className={`${BTN} border border-[#5A5751] text-[#5A5751] hover:bg-white`}>Cancel</button>
      </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Service (schedule entry) add/edit form
// -----------------------------------------------------------------------------
function ServiceForm({ initial, onSave, onCancel, busy }) {
  const [f, setF] = useState({
    id: initial?.id || null,
    serviceDate: initial?.serviceDate || todayIso(),
    serviceType: initial?.serviceType || 'sunday',
    title: initial?.title || '',
    youtubeUrl: initial?.youtubeUrl || '',
    notes: initial?.notes || '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 my-2">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{f.id ? 'Edit date' : 'Add to schedule'}</div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={LABEL} htmlFor="cv-date">Date</label><input id="cv-date" type="date" className={FIELD} value={f.serviceDate} onChange={set('serviceDate')} /></div>
        <div><label className={LABEL} htmlFor="cv-type">Type</label>
          <select id="cv-type" className={FIELD} value={f.serviceType} onChange={set('serviceType')}>
            <option value="sunday">Sunday service</option>
            <option value="wednesday">Wednesday</option>
            <option value="rehearsal">Thursday rehearsal</option>
          </select>
        </div>
      </div>
      <div><label className={LABEL} htmlFor="cv-title">Title (optional)</label><input id="cv-title" className={FIELD} value={f.title} onChange={set('title')} placeholder="e.g. Morning Worship" /></div>
      <div><label className={LABEL} htmlFor="cv-yt">Service video link (the YouTube recording of this service)</label><input id="cv-yt" className={FIELD} value={f.youtubeUrl} onChange={set('youtubeUrl')} placeholder="https://youtu.be/…" /></div>
      <div className="flex gap-2 flex-wrap pt-1">
        <button type="button" disabled={busy || !f.serviceDate} onClick={() => onSave(f)} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>{busy ? 'Saving…' : 'Save date'}</button>
        <button type="button" onClick={onCancel} className={`${BTN} border border-[#5A5751] text-[#5A5751] hover:bg-white`}>Cancel</button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Panels
// -----------------------------------------------------------------------------
const WEEK_GROUPS = [['this', 'This week'], ['next', 'Next week'], ['later', 'Coming up']];

// Pick a song already imported under the Songs tab and add it to THIS date —
// "so you are not doing double duty" (Christina 2026-07-04). Uses the existing
// reuseSong pipeline (onReuse), so the chosen song is scheduled with its video,
// lyrics, and scripture intact. No retyping.
function SongPicker({ songs, onPick }) {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState('');
  const catalog = useMemo(() => distinctSongCatalog(songs), [songs]);
  if (!catalog.length) return null;
  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>+ Choose from imported songs</button>;
  }
  return (
    <div className="mt-2 flex items-end gap-2 flex-wrap bg-[#FAF8F4] border border-[#5A6E3D] p-2">
      <div className="min-w-[12rem]">
        <label className={LABEL} htmlFor="pick-song">Choose an imported song</label>
        <select id="pick-song" className={FIELD} value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">Select a song…</option>
          {catalog.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>
      <button type="button" disabled={!pick}
        onClick={() => { const s = catalog.find((x) => String(x.id) === String(pick)); if (s) onPick(s); setPick(''); setOpen(false); }}
        className={`${BTN} bg-[#5A6E3D] text-white font-semibold disabled:opacity-50`}>Add to this date</button>
      <button type="button" onClick={() => { setOpen(false); setPick(''); }} className={`${BTN} border border-[#5A5751] text-[#5A5751] hover:bg-white`}>Cancel</button>
    </div>
  );
}

function ServiceCard({ svc, songs, absences, canEdit, onAddSong, onEditSong, onDeleteSong, onReuse, onDraftWords, past }) {
  const list = songsForService(songs, svc.serviceDate, svc.serviceType);
  const out = (absences || []).filter((a) => isOutOnDate(a, svc.serviceDate));
  return (
    <div className="bg-white border border-[#1A1815] p-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{serviceDayLabel(svc.serviceType, svc.serviceDate)} · {fmtDate(svc.serviceDate)}{svc.title ? ` · ${svc.title}` : ''}</div>
        <div className="flex items-center gap-2">
          {svc.youtubeUrl && <a href={svc.youtubeUrl} target="_blank" rel="noopener noreferrer" className={`${BTN} text-[#B85838] hover:text-[#1A1815] underline`}>▶ Watch service</a>}
          {canEdit && !past && <button type="button" onClick={() => onAddSong(svc)} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>+ Add song</button>}
        </div>
      </div>
      {list.length ? list.map((s) => (
        // Past cards are read-only EXCEPT auto-draft songs (needsReview), which the
        // choir team edits to confirm the title — that correction is the point.
        <SongRow key={s.id} song={s} canEdit={canEdit}
          onEdit={(!past || s.needsReview) ? onEditSong : null}
          onDelete={(!past || s.needsReview) ? onDeleteSong : null}
          onReuse={onReuse} onDraftWords={onDraftWords} />
      ))
        : <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No songs {past ? 'recorded' : 'assigned'} yet.</p>}
      {canEdit && !past && onReuse && (
        <div className="mt-1"><SongPicker songs={songs} onPick={(s) => onReuse(s, svc.serviceDate, svc.serviceType)} /></div>
      )}
      {!past && out.length > 0 && (
        <p className="text-[0.6875rem] text-[#991B1B] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Out this day: {out.map((a) => a.memberName + (a.backupName ? ` (backup: ${a.backupName}${a.backupStatus === 'confirmed' ? ' ✓' : ''})` : '')).join(', ')}
        </p>
      )}
    </div>
  );
}

// Plan view: upcoming services grouped This week / Next week / Coming up so
// Christina can plan songs as far out as she wants; a collapsible history lets
// her browse past Sundays and reuse old songs onto a future date (Darrell
// 2026-06-14).
// The history renders in derived pages, not a cap: every watchable service in
// the corpus (300+) is reachable via "Show more", while a phone only mounts a
// batch at a time. The count on the toggle is the WHOLE corpus, always.
const PAST_PAGE_SIZE = 15;

function ThisWeekPanel({ schedule, sermons, songs, absences, canEdit, onAddSong, onEditSong, onDeleteSong, onReuse, onDraftWords }) {
  const today = todayIso();
  const [showPast, setShowPast] = useState(false);
  const [pastShown, setPastShown] = useState(PAST_PAGE_SIZE);
  const ordered = sortServices(schedule, today);
  const upcoming = ordered.filter((s) => s.serviceDate >= today);
  // Past history is the REAL service corpus — every past service with a plan, a
  // setlist, OR a recording to watch (DR-0137: a recorded service IS history;
  // the old planned-or-songs filter is why only 7 of 300+ videos showed).
  const past = buildPastServices(schedule, sermons, songs, today);
  return (
    <div className="space-y-5">
      {upcoming.length ? WEEK_GROUPS.map(([bucket, label]) => {
        const group = upcoming.filter((s) => weekBucket(s.serviceDate, today) === bucket);
        if (!group.length) return null;
        return (
          <div key={bucket}>
            <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751] mb-2">{label}</div>
            <div className="space-y-3">
              {group.map((svc) => (
                <ServiceCard key={svc.id} svc={svc} songs={songs} absences={absences} canEdit={canEdit} onAddSong={onAddSong} onEditSong={onEditSong} onDeleteSong={onDeleteSong} onReuse={onReuse} onDraftWords={onDraftWords} />
              ))}
            </div>
          </div>
        );
      }) : (
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          No upcoming services on the schedule yet.{canEdit ? ' Add the next Sunday or Thursday in the Schedule tab, then assign its songs.' : ' Check back once the director sets the week.'}
        </p>
      )}

      {past.length > 0 && (
        <div className="border-t border-[#E8E4DC] pt-3">
          <button type="button" onClick={() => setShowPast((s) => !s)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`} aria-expanded={showPast}>
            {showPast ? '▾ Hide past services' : `▸ Past services (${past.length}) — watch & reuse songs`}
          </button>
          {showPast && (
            <div className="space-y-3 mt-2">
              <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Open a past Sunday to see what was sung, watch the service, and reuse a song onto a future date. A “Draft · verify” song was auto-drafted from the service recording — edit it to confirm the title.</p>
              {past.slice(0, pastShown).map((svc) => (
                <ServiceCard key={svc.id} svc={svc} songs={songs} absences={absences} canEdit={canEdit} onEditSong={onEditSong} onDeleteSong={onDeleteSong} onReuse={onReuse} onDraftWords={onDraftWords} past />
              ))}
              {past.length > pastShown && (
                <button type="button" onClick={() => setPastShown((n) => n + PAST_PAGE_SIZE)}
                  className={`${BTN} w-full border border-[#5A6E3D] text-[#5A6E3D] hover:bg-white`}>
                  Show more services ({past.length - pastShown} more)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// The schedule: each date shows its SONG LIST right inside it (Christina 2026-07-04:
// "inside the date… a place for each song we are singing"), where songs are added
// new OR chosen from the already-imported Songs. Edit/Delete manage the date itself.
function SchedulePanel({ schedule, songs, absences, canEdit, onAdd, onEdit, onDelete, onAddSong, onEditSong, onDeleteSong, onReuse, onDraftWords }) {
  const ordered = sortServices(schedule, todayIso());
  return (
    <div>
      {canEdit && <button type="button" onClick={onAdd} className={`${BTN} text-[#B85838] hover:text-[#1A1815] mb-2`}>+ Add date</button>}
      {ordered.length ? (
        <div className="space-y-3">
          {ordered.map((svc) => (
            <div key={svc.id}>
              <ServiceCard svc={svc} songs={songs} absences={absences} canEdit={canEdit}
                onAddSong={onAddSong} onEditSong={onEditSong} onDeleteSong={onDeleteSong} onReuse={onReuse} onDraftWords={onDraftWords} />
              {canEdit && (
                <div className="flex justify-end gap-3 px-1 pt-1">
                  <button type="button" onClick={() => onEdit(svc)} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Edit date</button>
                  <button type="button" onClick={() => onDelete(svc)} className={`${BTN} text-[#991B1B] hover:underline`}>Delete date</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>No dates scheduled yet.</p>}
    </div>
  );
}

function MessagesPanel({ messages, onSend }) {
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [messages]);
  const send = () => { const t = draft.trim(); if (!t) return; onSend(t); setDraft(''); };
  return (
    <div>
      <div className="bg-white border border-[#1A1815] p-3 max-h-80 overflow-y-auto" aria-live="polite">
        {messages.length ? messages.map((m) => (
          <div key={m.id} className={`mb-2 ${m.mine ? 'text-right' : ''}`}>
            <div className="text-[0.625rem] text-[#5A5751]">{m.displayName}{m.createdAt ? ` · ${new Date(m.createdAt).toLocaleString()}` : ''}</div>
            <div className={`inline-block px-2 py-1 text-sm ${m.mine ? 'bg-[#1A1815] text-white' : 'bg-[#FAF8F4] border border-[#E8E4DC]'}`} style={{ fontFamily: '"Fraunces", serif' }}>{m.body}</div>
          </div>
        )) : <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No messages yet. Post the week's focus for the choir to review.</p>}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 mt-2">
        <label className="sr-only" htmlFor="choir-msg">Message to the choir</label>
        <input id="choir-msg" className={FIELD} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Message the choir…" />
        <button type="button" onClick={send} disabled={!draft.trim()} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>Send</button>
      </div>
    </div>
  );
}

const inviteRoleLabel = (r) => (r === 'admin' ? 'Co-director' : r === 'viewer' ? 'Viewer' : 'Member');
// Traffic-light status, all from tokens that already carry a midnight (dark-
// theme) remap in theme-css.js — no new colors, so the contrast + legibility
// guards stay green in both themes: green = joined, rust = still pending, grey
// = expired.
const INVITE_BADGE = {
  accepted: { label: 'Joined', cls: 'bg-[#5A6E3D] text-white' },
  pending: { label: 'Pending', cls: 'bg-[#B85838] text-white' },
  expired: { label: 'Expired', cls: 'bg-[#E8E4DC] text-[#5A5751]' },
};

function RosterPanel({ members, invites = [], canEdit, onAdd, onRemove, onInvite }) {
  const [f, setF] = useState({ displayName: '', section: '', choirRole: 'member' });
  const [adding, setAdding] = useState(false);
  const [inv, setInv] = useState({ email: '', role: 'member' });
  const [invMsg, setInvMsg] = useState('');
  const sendInvite = async () => {
    setInvMsg('Inviting…');
    const r = await onInvite(inv.email, inv.role);
    if (r?.invited) { setInvMsg(`Invite sent to ${inv.email}. They'll get access on their next sign-in.`); setInv({ email: '', role: 'member' }); }
    else setInvMsg(r?.skipped === 'bad-email' ? 'Enter a valid email.' : `Couldn't invite (${r?.skipped || 'error'}).`);
  };
  return (
    <div>
      {canEdit && onInvite && (
        <div className="bg-[#FAF8F4] border border-[#5A6E3D] p-3 mb-3">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">Invite a member to the choir</div>
          <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Send an email invite. When they sign in to PoeTech they'll see the Choir tab. Use "Co-director" for someone who should edit.</p>
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-[180px]"><label className={LABEL} htmlFor="ci-email">Email</label><input id="ci-email" type="email" className={FIELD} value={inv.email} onChange={(e) => setInv((p) => ({ ...p, email: e.target.value }))} placeholder="member@email.com" /></div>
            <div><label className={LABEL} htmlFor="ci-role">Access</label>
              <select id="ci-role" className={FIELD} value={inv.role} onChange={(e) => setInv((p) => ({ ...p, role: e.target.value }))}>
                <option value="member">Member (view)</option><option value="admin">Co-director (edit)</option>
              </select>
            </div>
            <button type="button" disabled={!inv.email.trim()} onClick={sendInvite} className={`${BTN} bg-[#5A6E3D] text-white font-semibold disabled:opacity-50`}>Invite</button>
          </div>
          {invMsg && <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{invMsg}</p>}
        </div>
      )}
      {canEdit && onInvite && (
        <div className="bg-white border border-[#E8E4DC] p-3 mb-3">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-2">Invites you've sent</div>
          {invites.length ? (
            <ul className="space-y-2">
              {invites.map((iv) => {
                const badge = INVITE_BADGE[deriveInviteStatus(iv, Date.now())] || INVITE_BADGE.pending;
                return (
                  <li key={iv.id} className="flex items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm text-[#1A1815] break-all" style={{ fontFamily: '"Fraunces", serif' }}>{iv.email}</span>
                      <span className="text-[0.6875rem] text-[#5A5751] ml-2">{inviteRoleLabel(iv.role)}{iv.invitedAt ? ` · sent ${fmtDate(String(iv.invitedAt).slice(0, 10))}` : ''}</span>
                    </div>
                    <span className={`text-[0.5625rem] uppercase tracking-wider px-2 py-1 whitespace-nowrap ${badge.cls}`}>{badge.label}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>No invites sent yet. When you invite someone above, they'll show here — pending until they sign in, then marked joined.</p>
          )}
        </div>
      )}
      {canEdit && (adding ? (
        <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 mb-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div><label className={LABEL} htmlFor="cm-name">Name</label><input id="cm-name" className={FIELD} value={f.displayName} onChange={(e) => setF((p) => ({ ...p, displayName: e.target.value }))} /></div>
            <div><label className={LABEL} htmlFor="cm-sec">Section</label>
              <select id="cm-sec" className={FIELD} value={f.section} onChange={(e) => setF((p) => ({ ...p, section: e.target.value }))}>
                <option value="">—</option><option value="soprano">Soprano</option><option value="alto">Alto</option><option value="tenor">Tenor</option><option value="bass">Bass</option><option value="other">Other</option>
              </select>
            </div>
            <div><label className={LABEL} htmlFor="cm-role">Role</label>
              <select id="cm-role" className={FIELD} value={f.choirRole} onChange={(e) => setF((p) => ({ ...p, choirRole: e.target.value }))}>
                {ROLE_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={!f.displayName.trim()} onClick={() => { onAdd({ ...f, section: f.section || null }); setF({ displayName: '', section: '', choirRole: 'member' }); setAdding(false); }} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>Add</button>
            <button type="button" onClick={() => setAdding(false)} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      ) : <button type="button" onClick={() => setAdding(true)} className={`${BTN} text-[#B85838] hover:text-[#1A1815] mb-2`}>+ Add member</button>)}
      {members.length ? (
        <div className="bg-white border border-[#1A1815]">
          {members.map((m) => (
            <div key={m.id} className="flex items-baseline justify-between gap-2 p-3 border-b border-[#E8E4DC]">
              <div>
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{m.displayName}</span>
                <span className="text-[0.6875rem] text-[#5A5751] ml-2">{[m.section, m.choirRole !== 'member' ? roleLabel(m.choirRole) : null].filter(Boolean).join(' · ')}</span>
              </div>
              {canEdit && <button type="button" onClick={() => onRemove(m)} className={`${BTN} text-[#991B1B] hover:underline`}>Remove</button>}
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>No one on the roster yet.</p>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Availability — members schedule themselves out + request a backup; the surface
// suggests same-section members who are free (Darrell 2026-06-14).
// -----------------------------------------------------------------------------
function AvailabilityPanel({ absences, members, canEdit, onSave, onDelete, onRespond }) {
  const [open, setOpen] = useState(false);
  const blank = { memberId: '', startDate: todayIso(), endDate: '', reason: '', backupMemberId: '' };
  const [f, setF] = useState(blank);
  const today = todayIso();
  const upcoming = (absences || []).filter((a) => (a.endDate || a.startDate) >= today)
    .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
  const absentMember = members.find((m) => m.id === f.memberId) || null;
  const suggestions = suggestBackups(members, absences, f.startDate, absentMember);

  const submit = () => {
    const bm = members.find((m) => m.id === f.backupMemberId) || null;
    onSave({
      memberId: f.memberId || null,
      // When "Me" is selected (no member picked), leave the name null so the sync
      // falls back to the signed-in user's REAL displayName — never the literal
      // string "Me" (which everyone else would then see in the who's-out list).
      memberName: absentMember?.displayName || null,
      startDate: f.startDate,
      endDate: f.endDate || null,
      reason: f.reason || null,
      backupMemberId: bm?.id || null,
      backupUserId: bm?.userId || null,
      backupName: bm?.displayName || null,
    });
    setF(blank); setOpen(false);
  };

  return (
    <div>
      <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Let the choir know when you'll be out and request a backup to cover your part. The list shows everyone scheduled out so the director can plan ahead.</p>
      {open ? (
        <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 mb-3">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Schedule time out</div>
          <div>
            <label className={LABEL} htmlFor="av-who">Who's out</label>
            <select id="av-who" className={FIELD} value={f.memberId} onChange={(e) => setF((p) => ({ ...p, memberId: e.target.value, backupMemberId: '' }))}>
              <option value="">Me</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.displayName}{m.section ? ` (${m.section})` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={LABEL} htmlFor="av-start">From</label><input id="av-start" type="date" className={FIELD} value={f.startDate} onChange={(e) => setF((p) => ({ ...p, startDate: e.target.value }))} /></div>
            <div><label className={LABEL} htmlFor="av-end">Through (optional)</label><input id="av-end" type="date" className={FIELD} value={f.endDate} onChange={(e) => setF((p) => ({ ...p, endDate: e.target.value }))} /></div>
          </div>
          <div><label className={LABEL} htmlFor="av-reason">Reason (optional)</label><input id="av-reason" className={FIELD} value={f.reason} onChange={(e) => setF((p) => ({ ...p, reason: e.target.value }))} placeholder="Out of town, etc." /></div>
          <div>
            <label className={LABEL} htmlFor="av-backup">Request a backup{absentMember?.section ? ` (${absentMember.section} preferred)` : ''}</label>
            <select id="av-backup" className={FIELD} value={f.backupMemberId} onChange={(e) => setF((p) => ({ ...p, backupMemberId: e.target.value }))}>
              <option value="">No backup requested</option>
              {suggestions.map((m) => <option key={m.id} value={m.id}>{m.displayName}{m.section ? ` (${m.section})` : ''}</option>)}
            </select>
            {f.memberId !== '' && backupsAreCrossSection(suggestions, absentMember) && (
              <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>No same-section singer is free that day &mdash; showing others who can cover.</p>
            )}
            {f.memberId !== '' && !suggestions.length && (
              <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>No one else is free that day &mdash; try different dates, or leave it as no backup.</p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={!f.startDate} onClick={submit} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>Schedule out</button>
            <button type="button" onClick={() => { setOpen(false); setF(blank); }} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      ) : <button type="button" onClick={() => setOpen(true)} className={`${BTN} text-[#B85838] hover:text-[#1A1815] mb-3`}>+ Schedule time out</button>}

      {upcoming.length ? (
        <div className="bg-white border border-[#1A1815]">
          {upcoming.map((a) => (
            <div key={a.id} className="p-3 border-b border-[#E8E4DC]">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{a.memberName}</span>
                <span className="text-[0.6875rem] text-[#5A5751]">{fmtDate(a.startDate)}{a.endDate && a.endDate !== a.startDate ? ` – ${fmtDate(a.endDate)}` : ''}</span>
              </div>
              {a.reason && <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{a.reason}</p>}
              {a.backupName && (
                <p className="text-[0.6875rem] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                  Backup: <strong>{a.backupName}</strong>{' '}
                  <span className={a.backupStatus === 'confirmed' ? 'text-[#166534]' : a.backupStatus === 'declined' ? 'text-[#991B1B]' : 'text-[#5A5751]'}>· {a.backupStatus}</span>
                </p>
              )}
              <div className="flex gap-2 mt-1 flex-wrap">
                {a.iAmBackup && a.backupStatus === 'requested' && (
                  <>
                    <button type="button" onClick={() => onRespond(a, true)} className={`${BTN} text-[#166534] hover:underline`}>Confirm backup</button>
                    <button type="button" onClick={() => onRespond(a, false)} className={`${BTN} text-[#991B1B] hover:underline`}>Decline</button>
                  </>
                )}
                {(a.mine || canEdit) && <button type="button" onClick={() => onDelete(a)} className={`${BTN} text-[#991B1B] hover:underline`}>Remove</button>}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>No one is scheduled out. Everyone's in for the upcoming services.</p>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Resources — director-curated links of where to find new songs (Word-first).
// -----------------------------------------------------------------------------
function ResourcesPanel({ resources, canEdit, onAdd, onDelete }) {
  const [f, setF] = useState({ title: '', url: '', note: '' });
  const [adding, setAdding] = useState(false);
  return (
    <div>
      <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Where the team looks for new songs to sing — the sources you trust, curated by the director.</p>
      {canEdit && (adding ? (
        <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 mb-2">
          <div><label className={LABEL} htmlFor="cr-title">Name</label><input id="cr-title" className={FIELD} value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. A playlist, a publisher, a chart" /></div>
          <div><label className={LABEL} htmlFor="cr-url">Link</label><input id="cr-url" className={FIELD} value={f.url} onChange={(e) => setF((p) => ({ ...p, url: e.target.value }))} placeholder="https://…" /></div>
          <div><label className={LABEL} htmlFor="cr-note">Note (optional)</label><input id="cr-note" className={FIELD} value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} placeholder="Why it's useful" /></div>
          <div className="flex gap-2">
            <button type="button" disabled={!f.title.trim()} onClick={() => { onAdd(f); setF({ title: '', url: '', note: '' }); setAdding(false); }} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>Add</button>
            <button type="button" onClick={() => setAdding(false)} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      ) : <button type="button" onClick={() => setAdding(true)} className={`${BTN} text-[#B85838] hover:text-[#1A1815] mb-2`}>+ Add resource</button>)}
      {resources.length ? (
        <div className="bg-white border border-[#1A1815]">
          {resources.map((r) => (
            <div key={r.id} className="flex items-baseline justify-between gap-2 p-3 border-b border-[#E8E4DC]">
              <div>
                {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.title}</a>
                  : <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.title}</span>}
                {r.note && <span className="text-[0.6875rem] text-[#5A5751] ml-2">{r.note}</span>}
              </div>
              {canEdit && <button type="button" onClick={() => onDelete(r)} className={`${BTN} text-[#991B1B] hover:underline`}>Remove</button>}
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>No resources yet.{canEdit ? ' Add the sources your team trusts.' : ''}</p>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Team Docs — order of service / announcements / calendar; the whole team's
// weekly get-ready material (choir-visible). Darrell 2026-06-14.
// -----------------------------------------------------------------------------
const TEAM_TYPES = [['order-of-service', 'Order of Service'], ['announcements', 'Announcements'], ['calendar', 'Calendar'], ['other', 'Other']];
const teamTypeLabel = (t) => (TEAM_TYPES.find(([k]) => k === t)?.[1]) || t;

function TeamDocsPanel({ docs, canEdit, onAdd, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ docDate: todayIso(), docType: 'order-of-service', title: '', documentUrl: '', documentSource: 'manual', fileName: '' });
  const [uploadErr, setUploadErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const resetForm = () => { setF({ docDate: todayIso(), docType: 'order-of-service', title: '', documentUrl: '', documentSource: 'manual', fileName: '' }); setUploadErr(''); };
  const open = async (d) => { const u = await openTeamDocument(d.documentUrl); if (u) window.open(u, '_blank', 'noopener'); };
  // Upload a picture or a document (Christina 2026-07-04). Images are compressed;
  // other files ride as a data URL under a size cap. Either becomes documentUrl.
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // let the same file be re-picked
    if (!file) return;
    const c = classifyUpload(file);
    if (!c.ok) {
      setUploadErr(c.reason === 'too-large' ? 'That file is over 3 MB — paste a link instead, or upload an image.'
        : c.reason === 'unsupported-type' ? 'Please choose an image or a PDF / doc / text file.'
          : 'Could not read that file.');
      return;
    }
    setUploadErr(''); setUploading(true);
    try {
      const dataUrl = c.kind === 'image' ? await compressImageFile(file) : await fileToDataUrl(file);
      setF((p) => ({ ...p, documentUrl: dataUrl, documentSource: 'upload', fileName: file.name, title: p.title || file.name }));
    } catch { setUploadErr('Could not read that file.'); }
    finally { setUploading(false); }
  };
  return (
    <div>
      <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>The team's weekly get-ready material — order of service, announcements, and the church calendar. Everyone on the roster can open these.</p>
      {canEdit && (adding ? (
        <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 mb-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className={LABEL} htmlFor="td-date">Date</label><input id="td-date" type="date" className={FIELD} value={f.docDate} onChange={(e) => setF((p) => ({ ...p, docDate: e.target.value }))} /></div>
            <div><label className={LABEL} htmlFor="td-type">Type</label>
              <select id="td-type" className={FIELD} value={f.docType} onChange={(e) => setF((p) => ({ ...p, docType: e.target.value }))}>
                {TEAM_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          </div>
          <div><label className={LABEL} htmlFor="td-title">Title</label><input id="td-title" className={FIELD} value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. 06-14 Order of Service" /></div>
          {/* Upload a picture or document — or paste a link. (Christina 2026-07-04) */}
          <div>
            <span className={LABEL}>Upload a picture or document</span>
            <div className="flex items-center gap-2 flex-wrap">
              <label className={`${BTN} border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#FAF8F4] cursor-pointer`}>
                {uploading ? 'Reading…' : 'Choose file'}
                <input type="file" accept="image/*,.pdf,.doc,.docx,.txt,application/pdf" className="sr-only" onChange={onFile} disabled={uploading} />
              </label>
              {f.documentSource === 'upload' && f.fileName && (
                <span className="text-[0.6875rem] text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }}>✓ {f.fileName} attached
                  <button type="button" onClick={() => setF((p) => ({ ...p, documentUrl: '', documentSource: 'manual', fileName: '' }))} className="ml-2 text-[#991B1B] hover:underline">remove</button>
                </span>
              )}
            </div>
            {uploadErr && <p className="text-[0.6875rem] text-[#991B1B] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{uploadErr}</p>}
          </div>
          <div><label className={LABEL} htmlFor="td-url">…or paste a document link</label><input id="td-url" className={FIELD} value={f.documentSource === 'upload' ? '' : f.documentUrl} disabled={f.documentSource === 'upload'} onChange={(e) => setF((p) => ({ ...p, documentUrl: e.target.value, documentSource: 'manual', fileName: '' }))} placeholder="https://…" /></div>
          <div className="flex gap-2">
            <button type="button" disabled={!f.title.trim() || !f.documentUrl || uploading} onClick={() => { onAdd(f); resetForm(); setAdding(false); }} className={`${BTN} bg-[#1A1815] text-white font-semibold disabled:opacity-50`}>Add</button>
            <button type="button" onClick={() => { resetForm(); setAdding(false); }} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      ) : <button type="button" onClick={() => setAdding(true)} className={`${BTN} text-[#B85838] hover:text-[#1A1815] mb-2`}>+ Add document</button>)}
      {docs.length ? (
        <div className="bg-white border border-[#1A1815]">
          {docs.map((d) => (
            <div key={d.id} className="flex items-baseline justify-between gap-2 p-3 border-b border-[#E8E4DC]">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[0.5625rem] uppercase tracking-wider bg-[#E8E4DC] text-[#1A1815] px-1.5 py-0.5">{teamTypeLabel(d.docType)}</span>
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{d.title}</span>
                {d.docDate && <span className="text-[0.6875rem] text-[#5A5751]">{fmtDate(d.docDate)}</span>}
              </div>
              <div className="flex gap-2">
                {d.documentUrl && <button type="button" onClick={() => open(d)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815] underline`}>📄 Open</button>}
                {canEdit && <button type="button" onClick={() => onDelete(d)} className={`${BTN} text-[#991B1B] hover:underline`}>Remove</button>}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>No team documents yet.</p>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Surface
// -----------------------------------------------------------------------------
const TABS = [['week', 'This week'], ['songs', 'Songs'], ['songbook', 'Songbook'], ['schedule', 'Schedule'], ['teamdocs', 'Team Docs'], ['availability', 'Availability'], ['messages', 'Messages'], ['resources', 'Resources'], ['roster', 'Roster']];

export default function Choir() {
  const [signedIn, setSignedIn] = useState(false);
  const [access, setAccess] = useState({ canSee: false, canEdit: false });
  const [songs, setSongs] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [teamDocs, setTeamDocs] = useState([]);
  const [resources, setResources] = useState([]);
  const [invites, setInvites] = useState([]);
  const [songForm, setSongForm] = useState(null);     // { initial } | null
  const [serviceForm, setServiceForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => onAuthChange((s) => setSignedIn(!!s)), []);

  useEffect(() => {
    let alive = true;
    if (!signedIn) { setAccess({ canSee: false, canEdit: false }); return; }
    getChoirAccess().then((a) => { if (alive) setAccess(a); });
    return () => { alive = false; };
  }, [signedIn]);

  // Subscribe to the streams once the user can see the surface.
  useEffect(() => {
    if (!signedIn || !access.canSee) return undefined;
    const unsubs = [
      subscribeSongs(setSongs),
      subscribeSchedule(setSchedule),
      subscribeSermons(setSermons),
      subscribeMembers(setMembers),
      subscribeChoirMessages(setMessages),
      subscribeAbsences(setAbsences),
      subscribeTeamDocuments(setTeamDocs),
      subscribeResources(setResources),
      subscribeChurchInvites(setInvites),
    ];
    return () => unsubs.forEach((u) => { try { u && u(); } catch { /* noop */ } });
  }, [signedIn, access.canSee]);

  const reportSkip = (res) => { if (res && res.skipped) setErr(`Could not save (${res.skipped}). Your changes were not stored — try again.`); else setErr(''); };

  // A failed save must never discard what was typed (feedback bf8ad82f: "tapped
  // Add and the information disappeared"). Close the form ONLY on a confirmed
  // save; otherwise the entry stays on screen with the error banner saying why.
  const onSaveSong = async (f) => { setBusy(true); const r = await saveSong(f); reportSkip(r); setBusy(false); if (r?.saved) setSongForm(null); };
  // Draft a STARTING POINT of words from the service transcript (Darrell
  // 2026-07-10: "we don't have the words for each one so the choir can have a
  // starting point"). One transcript source, many harvests (DR-0134's recipe);
  // the draft lands in the song's lyrics clearly labeled auto-draft for
  // trimming. Transcripts are fetched once per visit and cached.
  const transcriptsRef = useRef(null);
  const onDraftWords = async (song) => {
    if (!song?.videoId) return { ok: false, reason: 'no-video' };
    if (!transcriptsRef.current) transcriptsRef.current = await fetchTranscriptsByVideo();
    const t = transcriptsRef.current[song.videoId];
    const r = draftWordsFromTranscript({ transcriptText: t && t.text, heardQuote: extractHeardQuote(song.notes), title: song.title });
    if (!r.ok) return r;
    const saved = await saveSong({ ...song, lyrics: r.draft });
    reportSkip(saved);
    return saved?.saved ? { ok: true } : { ok: false, reason: 'save-failed' };
  };
  const onSaveService = async (f) => { setBusy(true); const r = await saveService(f); reportSkip(r); setBusy(false); if (r?.saved) setServiceForm(null); };

  if (!signedIn) {
    return (
      <div className="max-w-2xl">
        <SectionTitle eyebrow="Church · choir">Choir</SectionTitle>
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Sign in to see the choir's music, schedule, and messages.</p>
      </div>
    );
  }
  if (!access.canSee) {
    return (
      <div className="max-w-2xl">
        <SectionTitle eyebrow="Church · choir">Choir</SectionTitle>
        <div className="bg-white border border-[#E8E4DC] p-6 text-center">
          <div className="text-2xl mb-1" aria-hidden="true">🎵</div>
          <p className="text-sm text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>This is the choir's space.</p>
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Ask the choir director to add you to the roster, then the week's music, schedule, and messages will show up here.</p>
        </div>
      </div>
    );
  }

  // One panel per tab id — plain closures over the top-level state (SectionTabs
  // mounts only the active one, same lazy behavior the hand-rolled strip had).
  // Keyed off `const TABS` above, which scripts/feedback-area-guard.mjs scrapes:
  // the ids must keep matching the `choir-<id>` FEEDBACK_AREAS keys.
  const PANELS = {
    week: () => (
      <>
        {songForm && access.canEdit && <SongForm initial={songForm.initial} busy={busy} onSave={onSaveSong} onCancel={() => setSongForm(null)} />}
        <ThisWeekPanel
          schedule={schedule} sermons={sermons} songs={songs} absences={absences} canEdit={access.canEdit}
          onAddSong={(svc) => setSongForm({ initial: { serviceDate: svc.serviceDate, serviceType: svc.serviceType } })}
          onEditSong={(s) => setSongForm({ initial: s })}
          onDeleteSong={async (s) => { reportSkip(await deleteSong(s.id)); }}
          onReuse={async (s, date, type) => { reportSkip(await reuseSong(s, date, type)); }}
          onDraftWords={onDraftWords}
        />
      </>
    ),
    songs: () => <ChoirSongWorkshop access={access} />,
    songbook: () => <ChoirSongbook songs={songs} access={access} />,
    schedule: () => (
      <>
        {serviceForm && access.canEdit && <ServiceForm initial={serviceForm.initial} busy={busy} onSave={onSaveService} onCancel={() => setServiceForm(null)} />}
        {songForm && access.canEdit && <SongForm initial={songForm.initial} busy={busy} onSave={onSaveSong} onCancel={() => setSongForm(null)} />}
        <SchedulePanel
          schedule={schedule} songs={songs} absences={absences} canEdit={access.canEdit}
          onAdd={() => setServiceForm({ initial: null })}
          onEdit={(svc) => setServiceForm({ initial: svc })}
          onDelete={async (svc) => { reportSkip(await deleteService(svc.id)); }}
          onAddSong={(svc) => setSongForm({ initial: { serviceDate: svc.serviceDate, serviceType: svc.serviceType } })}
          onEditSong={(s) => setSongForm({ initial: s })}
          onDeleteSong={async (s) => { reportSkip(await deleteSong(s.id)); }}
          onReuse={async (s, date, type) => { reportSkip(await reuseSong(s, date, type)); }}
          onDraftWords={onDraftWords}
        />
      </>
    ),
    teamdocs: () => (
      <TeamDocsPanel
        docs={teamDocs} canEdit={access.canEdit}
        onAdd={async (d) => { reportSkip(await saveTeamDocument(d)); }}
        onDelete={async (d) => { reportSkip(await deleteTeamDocument(d.id)); }}
      />
    ),
    availability: () => (
      <AvailabilityPanel
        absences={absences} members={members} canEdit={access.canEdit}
        onSave={async (a) => { reportSkip(await saveAbsence(a)); }}
        onDelete={async (a) => { reportSkip(await deleteAbsence(a.id)); }}
        onRespond={async (a, accept) => { reportSkip(await respondToBackup(a.id, accept)); }}
      />
    ),
    messages: () => (
      <MessagesPanel messages={messages} onSend={async (t) => { reportSkip(await sendChoirMessage(t)); }} />
    ),
    resources: () => (
      <ResourcesPanel
        resources={resources} canEdit={access.canEdit}
        onAdd={async (r) => { reportSkip(await saveResource(r)); }}
        onDelete={async (r) => { reportSkip(await deleteResource(r.id)); }}
      />
    ),
    roster: () => (
      <RosterPanel
        members={members} invites={sortInvites(invites)} canEdit={access.canEdit}
        onAdd={async (m) => { reportSkip(await addMember(m)); }}
        onRemove={async (m) => { reportSkip(await removeMember(m.id)); }}
        onInvite={(email, role) => inviteToChurch(email, role)}
      />
    ),
  };

  // The sliding section row is the shared SectionTabs primitive ("sliding tabs
  // instead of a long scroll", Darrell 2026-07-04) — same TabScroll motion the
  // old strip had, now with the real tablist a11y. The error banner stays PINNED
  // above the strip so a failed save is visible from any tab.
  const sections = TABS.map(([id, label]) => ({ id, label, render: PANELS[id] }));

  return (
    <div className="max-w-2xl">
      <SectionTitle eyebrow="Church · choir">Choir</SectionTitle>

      {err && <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-2 mb-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{err}</div>}

      <SectionTabs sections={sections} ariaLabel="Choir sections" idBase="choir" defaultId="week" />
    </div>
  );
}

export { Choir };
