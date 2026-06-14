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
  getChoirAccess, youtubeEmbedUrl, sortServices, songsForService,
  subscribeSongs, subscribeSchedule, subscribeMembers, subscribeChoirMessages,
  saveSong, deleteSong, saveService, deleteService, addMember, removeMember, sendChoirMessage,
} from '../lib/choir-sync.js';

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
function SongRow({ song, canEdit, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const embed = youtubeEmbedUrl(song.youtubeUrl);
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
              {open ? '▾ Hide video' : '▶ Watch'}
            </button>
          )}
          {!embed && song.youtubeUrl && (
            <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer" className={`${BTN} text-[#B85838] hover:text-[#1A1815] underline`}>▶ Link</a>
          )}
          {canEdit && <button type="button" onClick={() => onEdit(song)} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>Edit</button>}
          {canEdit && <button type="button" onClick={() => onDelete(song)} className={`${BTN} text-[#991B1B] hover:underline`}>Delete</button>}
        </div>
      </div>
      {song.notes && <p className="text-[11px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{song.notes}</p>}
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
    serviceDate: initial?.serviceDate || todayIso(),
    serviceType: initial?.serviceType || 'sunday',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2 my-2">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{f.id ? 'Edit song' : 'Add song'}</div>
      <div><label className={LABEL} htmlFor="cs-title">Title</label><input id="cs-title" className={FIELD} value={f.title} onChange={set('title')} placeholder="Song title" /></div>
      <div><label className={LABEL} htmlFor="cs-yt">YouTube link (the video the choir learns from)</label><input id="cs-yt" className={FIELD} value={f.youtubeUrl} onChange={set('youtubeUrl')} placeholder="https://youtu.be/…" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={LABEL} htmlFor="cs-date">For date</label><input id="cs-date" type="date" className={FIELD} value={f.serviceDate} onChange={set('serviceDate')} /></div>
        <div><label className={LABEL} htmlFor="cs-type">Service</label>
          <select id="cs-type" className={FIELD} value={f.serviceType} onChange={set('serviceType')}>
            <option value="sunday">Sunday service</option>
            <option value="rehearsal">Thursday rehearsal</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>
      <div><label className={LABEL} htmlFor="cs-scr">Scripture (optional)</label><input id="cs-scr" className={FIELD} value={f.scriptureRef} onChange={set('scriptureRef')} placeholder="e.g. Psalm 100" /></div>
      <div><label className={LABEL} htmlFor="cs-notes">Notes (optional)</label><input id="cs-notes" className={FIELD} value={f.notes} onChange={set('notes')} placeholder="Who leads, the part to focus on…" /></div>
      <div className="flex gap-2 flex-wrap pt-1">
        <button type="button" disabled={busy || !f.title.trim()} onClick={() => onSave(f)} className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50`}>{busy ? 'Saving…' : 'Save song'}</button>
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
function ThisWeekPanel({ schedule, songs, canEdit, onAddSong, onEditSong, onDeleteSong }) {
  const upcoming = sortServices(schedule, todayIso()).filter((s) => s.serviceDate >= todayIso()).slice(0, 2);
  if (!upcoming.length) {
    return (
      <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        No upcoming services on the schedule yet.{canEdit ? ' Add the next Sunday or Thursday in the Schedule tab, then assign its songs.' : ' Check back once the director sets the week.'}
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {upcoming.map((svc) => {
        const list = songsForService(songs, svc.serviceDate, svc.serviceType);
        return (
          <div key={svc.id} className="bg-white border border-[#1A1815] p-3">
            <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{serviceLabel(svc.serviceType)} · {fmtDate(svc.serviceDate)}{svc.title ? ` · ${svc.title}` : ''}</div>
              {canEdit && <button type="button" onClick={() => onAddSong(svc)} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>+ Add song</button>}
            </div>
            {list.length ? list.map((s) => <SongRow key={s.id} song={s} canEdit={canEdit} onEdit={onEditSong} onDelete={onDeleteSong} />)
              : <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No songs assigned yet.</p>}
          </div>
        );
      })}
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

function RosterPanel({ members, canEdit, onAdd, onRemove }) {
  const [f, setF] = useState({ displayName: '', section: '', choirRole: 'member' });
  const [adding, setAdding] = useState(false);
  return (
    <div>
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
                <option value="member">Member</option><option value="assistant">Assistant director</option><option value="director">Director</option>
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
                <span className="text-[11px] text-[#5A5751] ml-2">{[m.section, m.choirRole !== 'member' ? m.choirRole : null].filter(Boolean).join(' · ')}</span>
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
// Surface
// -----------------------------------------------------------------------------
const TABS = [['week', 'This week'], ['schedule', 'Schedule'], ['messages', 'Messages'], ['roster', 'Roster']];

export default function Choir() {
  const [signedIn, setSignedIn] = useState(false);
  const [access, setAccess] = useState({ canSee: false, canEdit: false });
  const [tab, setTab] = useState('week');
  const [songs, setSongs] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
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

  // Subscribe to the four streams once the user can see the surface.
  useEffect(() => {
    if (!signedIn || !access.canSee) return undefined;
    const unsubs = [
      subscribeSongs(setSongs),
      subscribeSchedule(setSchedule),
      subscribeMembers(setMembers),
      subscribeChoirMessages(setMessages),
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
            schedule={schedule} songs={songs} canEdit={access.canEdit}
            onAddSong={(svc) => setSongForm({ initial: { serviceDate: svc.serviceDate, serviceType: svc.serviceType } })}
            onEditSong={(s) => setSongForm({ initial: s })}
            onDeleteSong={async (s) => { reportSkip(await deleteSong(s.id)); }}
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

      {tab === 'messages' && (
        <MessagesPanel messages={messages} onSend={async (t) => { reportSkip(await sendChoirMessage(t)); }} />
      )}

      {tab === 'roster' && (
        <RosterPanel
          members={members} canEdit={access.canEdit}
          onAdd={async (m) => { reportSkip(await addMember(m)); }}
          onRemove={async (m) => { reportSkip(await removeMember(m.id)); }}
        />
      )}
    </div>
  );
}

export { Choir };
