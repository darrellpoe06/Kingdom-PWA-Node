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
import React, { useEffect, useRef, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { onAuthChange } from '../lib/supabase.js';
import {
  getChoirAccess, youtubeEmbedUrl, youtubeTimedUrl, parseTimecode, formatTimecode,
  sortServices, songsForService, weekBucket, isOutOnDate, suggestBackups,
  subscribeSongs, subscribeSchedule, subscribeMembers, subscribeChoirMessages, subscribeAbsences,
  subscribeSermons, subscribeResources, subscribeSermonDocuments, saveSermonDocument,
  subscribeTeamDocuments, saveTeamDocument, deleteTeamDocument, openTeamDocument,
  saveSong, deleteSong, reuseSong, saveService, deleteService, addMember, removeMember, sendChoirMessage,
  saveAbsence, deleteAbsence, respondToBackup,
  saveSermon, deleteSermon, reuseSermon, saveResource, deleteResource, importSermonsFromChannel,
  inviteToChurch, openSermonDocument,
} from '../lib/choir-sync.js';

const ROLE_OPTS = [['member', 'Member'], ['assistant', 'Assistant director'], ['director', 'Director'], ['musician', 'Musician'], ['sound', 'Sound'], ['media', 'Media'], ['tech', 'Tech']];
const roleLabel = (r) => (ROLE_OPTS.find(([k]) => k === r)?.[1]) || r;

const todayIso = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
  catch { return d; }
};
const serviceLabel = (t) => (t === 'rehearsal' ? 'Thursday rehearsal' : t === 'sunday' ? 'Sunday service' : t);

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1';

// -----------------------------------------------------------------------------
// Song display (link + collapsible embedded video)
// -----------------------------------------------------------------------------
function SongRow({ song, canEdit, onEdit, onDelete, onReuse }) {
  const [open, setOpen] = useState(false);
  const [wordsOpen, setWordsOpen] = useState(false);
  const [reuseOpen, setReuseOpen] = useState(false);
  const [reuseDate, setReuseDate] = useState(todayIso());
  const [reuseType, setReuseType] = useState('sunday');
  const baseEmbed = youtubeEmbedUrl(song.youtubeUrl);
  const embed = baseEmbed && song.startSeconds ? `${baseEmbed}?start=${Math.floor(song.startSeconds)}` : baseEmbed;
  const watchLabel = song.startSeconds ? `▶ Watch @ ${formatTimecode(song.startSeconds)}` : '▶ Watch';
  return (
    <div className="border-b border-[#E8E4DC] py-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{song.title}</span>
          {song.scriptureRef && <span className="text-[11px] text-[#5A5751]">{song.scriptureRef}</span>}
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
          {song.lyrics && <button type="button" onClick={() => setWordsOpen((o) => !o)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`} aria-expanded={wordsOpen}>{wordsOpen ? '▾ Hide words' : '🎵 Words'}</button>}
          {canEdit && onReuse && <button type="button" onClick={() => setReuseOpen((o) => !o)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>↻ Reuse</button>}
          {canEdit && onEdit && <button type="button" onClick={() => onEdit(song)} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Edit</button>}
          {canEdit && onDelete && <button type="button" onClick={() => onDelete(song)} className={`${BTN} text-[#991B1B] hover:underline`}>Delete</button>}
        </div>
      </div>
      {song.notes && <p className="text-[11px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{song.notes}</p>}
      {wordsOpen && song.lyrics && (
        <pre className="mt-2 p-2 bg-[#FAF8F4] border border-[#E8E4DC] text-sm whitespace-pre-wrap" style={{ fontFamily: '"Fraunces", serif' }}>{song.lyrics}</pre>
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
  return (
    <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 my-2">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{f.id ? 'Edit song' : 'Add song'}</div>
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
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{f.id ? 'Edit date' : 'Add to schedule'}</div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={LABEL} htmlFor="cv-date">Date</label><input id="cv-date" type="date" className={FIELD} value={f.serviceDate} onChange={set('serviceDate')} /></div>
        <div><label className={LABEL} htmlFor="cv-type">Type</label>
          <select id="cv-type" className={FIELD} value={f.serviceType} onChange={set('serviceType')}>
            <option value="sunday">Sunday service</option>
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

function ServiceCard({ svc, songs, absences, canEdit, onAddSong, onEditSong, onDeleteSong, onReuse, past }) {
  const list = songsForService(songs, svc.serviceDate, svc.serviceType);
  const out = (absences || []).filter((a) => isOutOnDate(a, svc.serviceDate));
  return (
    <div className="bg-white border border-[#1A1815] p-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{serviceLabel(svc.serviceType)} · {fmtDate(svc.serviceDate)}{svc.title ? ` · ${svc.title}` : ''}</div>
        <div className="flex items-center gap-2">
          {svc.youtubeUrl && <a href={svc.youtubeUrl} target="_blank" rel="noopener noreferrer" className={`${BTN} text-[#B85838] hover:text-[#1A1815] underline`}>▶ Watch service</a>}
          {canEdit && !past && <button type="button" onClick={() => onAddSong(svc)} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>+ Add song</button>}
        </div>
      </div>
      {list.length ? list.map((s) => <SongRow key={s.id} song={s} canEdit={canEdit} onEdit={past ? null : onEditSong} onDelete={past ? null : onDeleteSong} onReuse={onReuse} />)
        : <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No songs {past ? 'recorded' : 'assigned'} yet.</p>}
      {!past && out.length > 0 && (
        <p className="text-[11px] text-[#991B1B] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
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
function ThisWeekPanel({ schedule, songs, absences, canEdit, onAddSong, onEditSong, onDeleteSong, onReuse }) {
  const today = todayIso();
  const [showPast, setShowPast] = useState(false);
  const ordered = sortServices(schedule, today);
  const upcoming = ordered.filter((s) => s.serviceDate >= today);
  const past = ordered.filter((s) => s.serviceDate < today); // sortServices already newest-first
  return (
    <div className="space-y-5">
      {upcoming.length ? WEEK_GROUPS.map(([bucket, label]) => {
        const group = upcoming.filter((s) => weekBucket(s.serviceDate, today) === bucket);
        if (!group.length) return null;
        return (
          <div key={bucket}>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#5A5751] mb-2">{label}</div>
            <div className="space-y-3">
              {group.map((svc) => (
                <ServiceCard key={svc.id} svc={svc} songs={songs} absences={absences} canEdit={canEdit} onAddSong={onAddSong} onEditSong={onEditSong} onDeleteSong={onDeleteSong} onReuse={onReuse} />
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
              <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Open a past Sunday to see what was sung, watch the service, and reuse a song onto a future date.</p>
              {past.map((svc) => (
                <ServiceCard key={svc.id} svc={svc} songs={songs} absences={absences} canEdit={canEdit} onReuse={onReuse} past />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SchedulePanel({ schedule, canEdit, onAdd, onEdit, onDelete }) {
  const ordered = sortServices(schedule, todayIso());
  return (
    <div>
      {canEdit && <button type="button" onClick={onAdd} className={`${BTN} text-[#B85838] hover:text-[#1A1815] mb-2`}>+ Add date</button>}
      {ordered.length ? (
        <div className="bg-white border border-[#1A1815]">
          {ordered.map((svc) => (
            <div key={svc.id} className="flex items-baseline justify-between gap-2 flex-wrap p-3 border-b border-[#E8E4DC]">
              <div>
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{fmtDate(svc.serviceDate)}</span>
                <span className="text-[11px] text-[#5A5751] ml-2">{serviceLabel(svc.serviceType)}{svc.title ? ` · ${svc.title}` : ''}</span>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => onEdit(svc)} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Edit</button>
                  <button type="button" onClick={() => onDelete(svc)} className={`${BTN} text-[#991B1B] hover:underline`}>Delete</button>
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
            <div className="text-[10px] text-[#5A5751]">{m.displayName}{m.createdAt ? ` · ${new Date(m.createdAt).toLocaleString()}` : ''}</div>
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

function RosterPanel({ members, canEdit, onAdd, onRemove, onInvite }) {
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
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">Invite a member to the choir</div>
          <p className="text-[11px] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Send an email invite. When they sign in to PoeTech they'll see the Choir tab. Use "Co-director" for someone who should edit.</p>
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-[180px]"><label className={LABEL} htmlFor="ci-email">Email</label><input id="ci-email" type="email" className={FIELD} value={inv.email} onChange={(e) => setInv((p) => ({ ...p, email: e.target.value }))} placeholder="member@email.com" /></div>
            <div><label className={LABEL} htmlFor="ci-role">Access</label>
              <select id="ci-role" className={FIELD} value={inv.role} onChange={(e) => setInv((p) => ({ ...p, role: e.target.value }))}>
                <option value="member">Member (view)</option><option value="admin">Co-director (edit)</option>
              </select>
            </div>
            <button type="button" disabled={!inv.email.trim()} onClick={sendInvite} className={`${BTN} bg-[#5A6E3D] text-white font-semibold disabled:opacity-50`}>Invite</button>
          </div>
          {invMsg && <p className="text-[11px] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{invMsg}</p>}
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
                <span className="text-[11px] text-[#5A5751] ml-2">{[m.section, m.choirRole !== 'member' ? roleLabel(m.choirRole) : null].filter(Boolean).join(' · ')}</span>
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
      memberName: absentMember?.displayName || 'Me',
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
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Schedule time out</div>
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
            <label className={LABEL} htmlFor="av-backup">Request a backup{absentMember?.section ? ` (${absentMember.section}, available)` : ''}</label>
            <select id="av-backup" className={FIELD} value={f.backupMemberId} onChange={(e) => setF((p) => ({ ...p, backupMemberId: e.target.value }))}>
              <option value="">No backup requested</option>
              {suggestions.map((m) => <option key={m.id} value={m.id}>{m.displayName}{m.section ? ` (${m.section})` : ''}</option>)}
            </select>
            {f.memberId !== '' && !suggestions.length && <p className="text-[11px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>No same-section members are free that day.</p>}
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
                <span className="text-[11px] text-[#5A5751]">{fmtDate(a.startDate)}{a.endDate && a.endDate !== a.startDate ? ` – ${fmtDate(a.endDate)}` : ''}</span>
              </div>
              {a.reason && <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{a.reason}</p>}
              {a.backupName && (
                <p className="text-[11px] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
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
// Sermons — BG's historical message library (Sundays + Wednesday Bible Study),
// sourced from the @thelovecorner channel + uploads; reuse a past message as a
// draft to curate a new one (Darrell 2026-06-14).
// -----------------------------------------------------------------------------
function SermonForm({ initial, onSave, onCancel, busy }) {
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
      <div><label className={LABEL} htmlFor="sm-title">Title</label><input id="sm-title" className={FIELD} value={f.title} onChange={set('title')} placeholder="Message title" /></div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className={LABEL} htmlFor="sm-date">Date</label><input id="sm-date" type="date" className={FIELD} value={f.serviceDate} onChange={set('serviceDate')} /></div>
        <div><label className={LABEL} htmlFor="sm-type">Service</label>
          <select id="sm-type" className={FIELD} value={f.serviceType} onChange={set('serviceType')}>
            <option value="sunday">Sunday</option><option value="wednesday">Wednesday</option>
          </select>
        </div>
        <div><label className={LABEL} htmlFor="sm-slot">Slot</label>
          <select id="sm-slot" className={FIELD} value={f.serviceSlot} onChange={set('serviceSlot')}>
            <option value="">—</option><option value="1pm">1pm</option><option value="evening">Evening</option><option value="morning">Morning</option>
          </select>
        </div>
        <div><label className={LABEL} htmlFor="sm-status">Status</label>
          <select id="sm-status" className={FIELD} value={f.status} onChange={set('status')}>
            <option value="active">Active</option><option value="draft">Draft (planning)</option><option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={LABEL} htmlFor="sm-speaker">Speaker</label><input id="sm-speaker" className={FIELD} value={f.speaker} onChange={set('speaker')} placeholder="Bishop Lloyd E. Gwin" /></div>
        <div><label className={LABEL} htmlFor="sm-scr">Scripture</label><input id="sm-scr" className={FIELD} value={f.scriptureRef} onChange={set('scriptureRef')} placeholder="e.g. 1 Peter 5" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={LABEL} htmlFor="sm-yt">Service video link</label><input id="sm-yt" className={FIELD} value={f.youtubeUrl} onChange={set('youtubeUrl')} placeholder="https://youtu.be/…" /></div>
        <div><label className={LABEL} htmlFor="sm-ts">Sermon starts at (mm:ss)</label><input id="sm-ts" className={FIELD} value={f.startTime} onChange={set('startTime')} placeholder="e.g. 35:10" /></div>
      </div>
      <div><label className={LABEL} htmlFor="sm-doc">Sermon document link (the original message document)</label><input id="sm-doc" className={FIELD} value={f.documentUrl} onChange={set('documentUrl')} placeholder="Link to BG's sermon document" /></div>
      <div><label className={LABEL} htmlFor="sm-notes">Notes (optional)</label><input id="sm-notes" className={FIELD} value={f.notes} onChange={set('notes')} placeholder="Theme, key points…" /></div>
      <div className="flex gap-2 flex-wrap pt-1">
        <button type="button" disabled={busy || !f.title.trim()} onClick={() => onSave({ ...f, startSeconds: parseTimecode(f.startTime) })} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>{busy ? 'Saving…' : 'Save message'}</button>
        <button type="button" onClick={onCancel} className={`${BTN} border border-[#5A5751] text-[#5A5751] hover:bg-white`}>Cancel</button>
      </div>
    </div>
  );
}

function SermonRow({ sermon, canEdit, onEdit, onDelete, onReuse }) {
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

function SermonsPanel({ sermons, canEdit, onSave, onDelete, onReuse, onImport, busy }) {
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
  const reuse = (s) => { onReuse(s); };
  return (
    <div>
      <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>BG's sermon prep — every past message (Sundays + Wednesday Bible Study): watch the service, open the original document, or reuse one as a draft to build a new sermon from.</p>
      {canEdit && (form ? (
        <SermonForm initial={form.initial} busy={busy} onSave={async (s) => { await onSave(s); setForm(null); }} onCancel={() => setForm(null)} />
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
            {drafts.map((s) => <SermonRow key={s.id} sermon={s} canEdit={canEdit} onEdit={(x) => setForm({ initial: x })} onDelete={onDelete} onReuse={reuse} />)}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <label className="sr-only" htmlFor="sm-q">Search messages</label>
        <input id="sm-q" className={FIELD} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search past messages by title, scripture, theme…" />
      </div>
      {history.length ? (
        <div className="bg-white border border-[#1A1815]">
          {history.map((s) => <SermonRow key={s.id} sermon={s} canEdit={canEdit} onEdit={(x) => setForm({ initial: x })} onDelete={onDelete} onReuse={reuse} />)}
        </div>
      ) : <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{q ? 'No messages match.' : 'No messages yet. Import them from the channel or add one.'}</p>}
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
                {r.note && <span className="text-[11px] text-[#5A5751] ml-2">{r.note}</span>}
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
  const [f, setF] = useState({ docDate: todayIso(), docType: 'order-of-service', title: '', documentUrl: '' });
  const open = async (d) => { const u = await openTeamDocument(d.documentUrl); if (u) window.open(u, '_blank', 'noopener'); };
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
          <div><label className={LABEL} htmlFor="td-url">Document link</label><input id="td-url" className={FIELD} value={f.documentUrl} onChange={(e) => setF((p) => ({ ...p, documentUrl: e.target.value }))} placeholder="https://…" /></div>
          <div className="flex gap-2">
            <button type="button" disabled={!f.title.trim()} onClick={() => { onAdd(f); setF({ docDate: todayIso(), docType: 'order-of-service', title: '', documentUrl: '' }); setAdding(false); }} className={`${BTN} bg-[#1A1815] text-white font-semibold disabled:opacity-50`}>Add</button>
            <button type="button" onClick={() => setAdding(false)} className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      ) : <button type="button" onClick={() => setAdding(true)} className={`${BTN} text-[#B85838] hover:text-[#1A1815] mb-2`}>+ Add document</button>)}
      {docs.length ? (
        <div className="bg-white border border-[#1A1815]">
          {docs.map((d) => (
            <div key={d.id} className="flex items-baseline justify-between gap-2 p-3 border-b border-[#E8E4DC]">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[9px] uppercase tracking-wider bg-[#E8E4DC] text-[#1A1815] px-1.5 py-0.5">{teamTypeLabel(d.docType)}</span>
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{d.title}</span>
                {d.docDate && <span className="text-[11px] text-[#5A5751]">{fmtDate(d.docDate)}</span>}
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
const TABS = [['week', 'This week'], ['schedule', 'Schedule'], ['sermons', 'Sermons'], ['teamdocs', 'Team Docs'], ['availability', 'Availability'], ['messages', 'Messages'], ['resources', 'Resources'], ['roster', 'Roster']];

export default function Choir() {
  const [signedIn, setSignedIn] = useState(false);
  const [access, setAccess] = useState({ canSee: false, canEdit: false });
  const [tab, setTab] = useState('week');
  const [songs, setSongs] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [sermonDocs, setSermonDocs] = useState([]); // owner/admin only (RLS)
  const [teamDocs, setTeamDocs] = useState([]);
  const [resources, setResources] = useState([]);
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
      subscribeMembers(setMembers),
      subscribeChoirMessages(setMessages),
      subscribeAbsences(setAbsences),
      subscribeSermons(setSermons),
      subscribeSermonDocuments(setSermonDocs),
      subscribeTeamDocuments(setTeamDocs),
      subscribeResources(setResources),
    ];
    return () => unsubs.forEach((u) => { try { u && u(); } catch { /* noop */ } });
  }, [signedIn, access.canSee]);

  const reportSkip = (res) => { if (res && res.skipped) setErr(`Could not save (${res.skipped}). Your changes were not stored — try again.`); else setErr(''); };

  const onSaveSong = async (f) => { setBusy(true); reportSkip(await saveSong(f)); setBusy(false); setSongForm(null); };
  const onSaveService = async (f) => { setBusy(true); reportSkip(await saveService(f)); setBusy(false); setServiceForm(null); };

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

  return (
    <div className="max-w-2xl">
      <SectionTitle eyebrow="Church · choir">Choir</SectionTitle>
      <div className="flex gap-1 text-xs mb-3 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`px-3 py-2 whitespace-nowrap border-b-2 focus:outline focus:outline-2 focus:outline-[#B85838] ${tab === id ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
        ))}
      </div>

      {err && <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-2 mb-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{err}</div>}

      {tab === 'week' && (
        <>
          {songForm && access.canEdit && <SongForm initial={songForm.initial} busy={busy} onSave={onSaveSong} onCancel={() => setSongForm(null)} />}
          <ThisWeekPanel
            schedule={schedule} songs={songs} absences={absences} canEdit={access.canEdit}
            onAddSong={(svc) => setSongForm({ initial: { serviceDate: svc.serviceDate, serviceType: svc.serviceType } })}
            onEditSong={(s) => setSongForm({ initial: s })}
            onDeleteSong={async (s) => { reportSkip(await deleteSong(s.id)); }}
            onReuse={async (s, date, type) => { reportSkip(await reuseSong(s, date, type)); }}
          />
        </>
      )}

      {tab === 'schedule' && (
        <>
          {serviceForm && access.canEdit && <ServiceForm initial={serviceForm.initial} busy={busy} onSave={onSaveService} onCancel={() => setServiceForm(null)} />}
          {songForm && access.canEdit && <SongForm initial={songForm.initial} busy={busy} onSave={onSaveSong} onCancel={() => setSongForm(null)} />}
          <SchedulePanel
            schedule={schedule} canEdit={access.canEdit}
            onAdd={() => setServiceForm({ initial: null })}
            onEdit={(svc) => setServiceForm({ initial: svc })}
            onDelete={async (svc) => { reportSkip(await deleteService(svc.id)); }}
          />
        </>
      )}

      {tab === 'sermons' && (
        <SermonsPanel
          sermons={sermons.map((s) => ({ ...s, documentUrl: (sermonDocs.find((d) => d.sermonId === s.id) || {}).documentUrl || null }))}
          canEdit={access.canEdit} busy={busy}
          onSave={async (s) => { setBusy(true); const r = await saveSermon(s); reportSkip(r); if (r?.id) await saveSermonDocument(r.id, s.documentUrl); setBusy(false); }}
          onDelete={async (s) => { reportSkip(await deleteSermon(s.id)); }}
          onReuse={async (s) => { const d = new Date(); d.setDate(d.getDate() + 7); reportSkip(await reuseSermon(s, d.toISOString().slice(0, 10), s.serviceType)); }}
          onImport={() => importSermonsFromChannel()}
        />
      )}

      {tab === 'teamdocs' && (
        <TeamDocsPanel
          docs={teamDocs} canEdit={access.canEdit}
          onAdd={async (d) => { reportSkip(await saveTeamDocument(d)); }}
          onDelete={async (d) => { reportSkip(await deleteTeamDocument(d.id)); }}
        />
      )}

      {tab === 'resources' && (
        <ResourcesPanel
          resources={resources} canEdit={access.canEdit}
          onAdd={async (r) => { reportSkip(await saveResource(r)); }}
          onDelete={async (r) => { reportSkip(await deleteResource(r.id)); }}
        />
      )}

      {tab === 'availability' && (
        <AvailabilityPanel
          absences={absences} members={members} canEdit={access.canEdit}
          onSave={async (a) => { reportSkip(await saveAbsence(a)); }}
          onDelete={async (a) => { reportSkip(await deleteAbsence(a.id)); }}
          onRespond={async (a, accept) => { reportSkip(await respondToBackup(a.id, accept)); }}
        />
      )}

      {tab === 'messages' && (
        <MessagesPanel messages={messages} onSend={async (t) => { reportSkip(await sendChoirMessage(t)); }} />
      )}

      {tab === 'roster' && (
        <RosterPanel
          members={members} canEdit={access.canEdit}
          onAdd={async (m) => { reportSkip(await addMember(m)); }}
          onRemove={async (m) => { reportSkip(await removeMember(m.id)); }}
          onInvite={(email, role) => inviteToChurch(email, role)}
        />
      )}
    </div>
  );
}

export { Choir };
