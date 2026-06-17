// =============================================================================
// EventCenterModule — the Conference as a REAL multi-attendee system
// =============================================================================
// The operational layer above ConferenceModule's front door: shared, instance-
// scoped, realtime ROOMS + SESSIONS (with type/room/capacity + Service<->Choir)
// + REGISTRATIONS, so every leader and attendee sees the SAME state on every
// device. Self-contained like <Choir /> — it owns its own conference-sync
// subscriptions (no parent props), so it composes without touching the
// concurrent build's ConferenceModule.jsx.
//
// THREE capabilities this surface adds (the build ask):
//   1. Rooms — edit the whole-building room inventory (name / capacity / features).
//   2. Capacity — every session shows registration count vs capacity (live).
//   3. Breakouts — sessions that run PARALLEL to a main service; the building
//      view answers "how many breakouts run while the main space is in use."
//
// GRACEFUL FALLBACK: signed-out / no-church / offline -> a per-device LOCAL
// store (localStorage) so the surface still works; a clear banner invites sign-
// in for shared sync. RLS scopes every synced row to the caller's instance
// (proven in conference-rls-noleak.test.js) — no cross-instance leak.
//
// PRESERVES meals + Service<->Choir: meal_type/dietary on each registration
// (aggregated for catering) and a main_service session links a real choir
// sermon + ordered song set — both reused from lib/conference.js via
// conference-sync, never re-implemented.
// =============================================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { KpiDot } from './KpiDot.jsx';
import {
  getConferenceAccess,
  subscribeVenues, subscribeConferences, subscribeRooms, subscribeSessions, subscribeParticipants,
  saveVenue, saveConference, saveRoom, deleteRoom, saveSession, deleteSession,
  saveParticipant, setRegistrationStatus, deleteParticipant,
  registrationCount, conferenceRsvpCount, effectiveCapacity, capacityStatus,
  buildingView, roomForSession, roomsForVenue, venueSeatTotal, venueById,
  isMainServiceSession, sessionSermon, sessionSongs, toggleSongId,
  aggregateMeals, mealCountRows, MEAL_TYPES, SESSION_TYPES, USE_TYPES,
} from '../lib/conference-sync.js';
import { subscribeSermons, subscribeSongs } from '../lib/choir-sync.js';
import {
  subscribeRegistrations, setRegistrationStatus as setPublicRegStatus,
  aggregateRegistrationMeals, totalHeads,
} from '../lib/conference-register.js';
import SectionBoundary from './SectionBoundary.jsx';

// Shared visual tokens — identical to ConferenceModule (already WCAG AA + gated
// by contrast-guard). Reusing them keeps this surface consistent + compliant.
const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';
const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
const btnDark = 'bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px]';
const btnGhost = 'text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]';
const SESSION_TYPE_LABEL = { main_service: 'Main Service', breakout: 'Breakout', other: 'Other' };

// --- Local fallback store (per-device; signed-out / offline) ------------------
const LOCAL_KEY = 'poe_eventcenter_local_v1';
function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch { return {}; }
}
function writeLocal(obj) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(obj)); } catch { /* storage blocked */ }
}
let localSeq = 0;
const localId = (p) => `local-${p}-${Date.now()}-${localSeq++}`;

// Seed the local-fallback store with the two REAL COLG buildings + the South
// Campus rooms (tagged by use_type), so the signed-out demo mirrors the synced
// seed (migration 0024). Capacities NULL — leaders set real numbers in-app.
function seedLocalVenues(l) {
  if (l.venues && l.venues.length) return false;
  const main = { id: localId('venue'), name: 'Main Campus', address: '312 E. Bradley Avenue, Champaign, IL 61820', sortOrder: 0, status: 'active' };
  const south = { id: localId('venue'), name: 'South Campus Event Center', address: '1109 N 4th Street, Champaign, IL', sortOrder: 1, status: 'active' };
  l.venues = [main, south];
  l.rooms = [
    ...(l.rooms || []),
    { id: localId('room'), venueId: south.id, name: 'Main Sanctuary', capacity: null, features: [], useTypes: ['service', 'class'], locationNote: 'Services + large gatherings (high capacity)', sortOrder: 0, status: 'active' },
    { id: localId('room'), venueId: south.id, name: 'Fellowship Hall', capacity: null, features: [], useTypes: ['class', 'food', 'service'], locationNote: 'Classes / events / dining; service overflow (medium capacity)', sortOrder: 1, status: 'active' },
    { id: localId('room'), venueId: south.id, name: 'Kitchen', capacity: null, features: [], useTypes: ['food'], locationNote: 'Food prep; ties to meals / catering', sortOrder: 2, status: 'active' },
    { id: localId('room'), venueId: south.id, name: 'Bathrooms', capacity: null, features: [], useTypes: ['facility'], locationNote: 'Facility (not booked)', sortOrder: 3, status: 'active' },
  ];
  return true;
}

// useEventCenter — one interface over BOTH backends. mode tells the UI which.
function useEventCenter() {
  const [mode, setMode] = useState('loading'); // loading | synced | local
  const [access, setAccess] = useState({ signedIn: false, canSee: false, canEdit: false });
  const [venues, setVenues] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [songs, setSongs] = useState([]);
  const [tick, setTick] = useState(0); // forces local re-read after a local write

  useEffect(() => {
    let cancelled = false;
    const unsubs = [];
    (async () => {
      const acc = await getConferenceAccess();
      if (cancelled) return;
      setAccess(acc);
      if (acc.signedIn && acc.canSee) {
        setMode('synced');
        unsubs.push(subscribeVenues((r) => !cancelled && setVenues(r)));
        unsubs.push(subscribeConferences((r) => !cancelled && setConferences(r)));
        unsubs.push(subscribeRooms((r) => !cancelled && setRooms(r)));
        unsubs.push(subscribeSessions((r) => !cancelled && setSessions(r)));
        unsubs.push(subscribeParticipants((r) => !cancelled && setParticipants(r)));
        // Choir lists power the Service<->Choir picker (organizers are owner/admin
        // = in choir, so RLS returns them; a plain member just sees no picker).
        if (acc.canEdit) {
          unsubs.push(subscribeSermons((r) => !cancelled && setSermons(r)));
          unsubs.push(subscribeSongs((r) => !cancelled && setSongs(r)));
        }
      } else {
        setMode('local');
        const l = readLocal();
        if (seedLocalVenues(l)) writeLocal(l);
        setVenues(l.venues || []);
        setConferences(l.conference ? [l.conference] : []);
        setRooms(l.rooms || []);
        setSessions(l.sessions || []);
        setParticipants(l.participants || []);
      }
    })();
    return () => { cancelled = true; unsubs.forEach((u) => { try { u(); } catch { /* noop */ } }); };
  }, []);

  // Re-read local store on local writes.
  useEffect(() => {
    if (mode !== 'local') return;
    const l = readLocal();
    setVenues(l.venues || []);
    setConferences(l.conference ? [l.conference] : []);
    setRooms(l.rooms || []);
    setSessions(l.sessions || []);
    setParticipants(l.participants || []);
  }, [tick, mode]);

  const bumpLocal = useCallback((mutate) => {
    const l = readLocal();
    mutate(l);
    writeLocal(l);
    setTick((t) => t + 1);
  }, []);

  return {
    mode, access, venues, conferences, rooms, sessions, participants, sermons, songs,
    bumpLocal,
  };
}

// A small inline error/skip surface so a failed write never fails silently.
function useFlash() {
  const [flash, setFlash] = useState(null);
  const show = useCallback((msg) => { setFlash(msg); }, []);
  return [flash, show];
}

function EventCenterModuleInner() {
  const ec = useEventCenter();
  const { mode, access, venues, conferences, rooms, sessions, participants, sermons, songs } = ec;
  const [flash, showFlash] = useFlash();

  // Only a REAL organizer (synced + owner/admin) sees the operational tooling.
  // Local-fallback / signed-in members do not — congregants register in the front
  // door above and aren't buried in leadership tools.
  const isOrganizer = mode === 'synced' && access.canEdit;

  // The congregation's OPEN registrations (conference_public_registrations, 0027) —
  // the real "who's coming" + meal counts. Organizer-only (RLS gates the read).
  const [publicRegs, setPublicRegs] = useState([]);
  useEffect(() => {
    if (!isOrganizer) { setPublicRegs([]); return undefined; }
    const unsub = subscribeRegistrations((rows) => setPublicRegs(rows || []));
    return () => { try { unsub(); } catch { /* noop */ } };
  }, [isOrganizer]);
  const regMeals = useMemo(() => aggregateRegistrationMeals(publicRegs), [publicRegs]);
  const regHeads = useMemo(() => totalHeads(publicRegs), [publicRegs]);

  const activeVenues = useMemo(() => venues.filter((v) => v.status !== 'archived'), [venues]);
  // Which building is being viewed/managed; 'all' = every building.
  const [venueFilter, setVenueFilter] = useState('all');

  // The active conference: first active row (most churches run one at a time).
  const conference = useMemo(
    () => conferences.find((c) => c.status !== 'archived') || conferences[0] || null,
    [conferences],
  );
  const confSessions = useMemo(
    () => (conference ? sessions.filter((s) => s.conferenceId === conference.id && s.status !== 'archived') : []),
    [sessions, conference],
  );
  const confParticipants = useMemo(
    () => (conference ? participants.filter((p) => p.conferenceId === conference.id) : []),
    [participants, conference],
  );
  const activeRooms = useMemo(() => rooms.filter((r) => r.status !== 'archived'), [rooms]);
  // Rooms shown in the Rooms section, filtered to the selected building.
  const visibleRooms = useMemo(
    () => (venueFilter === 'all' ? activeRooms : activeRooms.filter((r) => r.venueId === venueFilter)),
    [activeRooms, venueFilter],
  );
  const building = useMemo(() => buildingView(confSessions, activeRooms), [confSessions, activeRooms]);
  const mealAgg = useMemo(
    () => aggregateMeals(confParticipants.filter((p) => p.registrationStatus !== 'cancelled')),
    [confParticipants],
  );

  const canEdit = mode === 'synced' ? access.canEdit : true; // local fallback: you edit your own device

  // --- write helpers: route to Supabase (synced) or localStorage (local) ------
  const runWrite = useCallback(async (syncedFn, localMutate) => {
    if (mode === 'synced') {
      const res = await syncedFn();
      if (res && res.skipped) showFlash(`Couldn't save (${res.skipped}). Your change wasn't shared.`);
      return res;
    }
    ec.bumpLocal(localMutate);
    return { saved: true, local: true };
  }, [mode, ec, showFlash]);

  // ---- form state -----------------------------------------------------------
  const [venueForm, setVenueForm] = useState({ name: '', address: '' });
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', capacity: '', features: '', venueId: '', useTypes: [] });
  const [sessForm, setSessForm] = useState({ day: '', time: '', title: '', speaker: '', sessionType: 'breakout', venueId: '', roomResourceId: '', capacity: '', sermonRef: '', musicSet: [] });
  const [showSessForm, setShowSessForm] = useState(false);
  const [rsvp, setRsvp] = useState({ name: '', mealType: 'Regular', dietary: '', sessionId: '' });

  // Default a room/session's building to the one currently in view.
  const defaultVenueId = venueFilter !== 'all' ? venueFilter : (activeVenues[0]?.id || '');

  const addVenue = async () => {
    if (!venueForm.name.trim()) return;
    await runWrite(
      () => saveVenue({ name: venueForm.name.trim(), address: venueForm.address.trim(), sortOrder: activeVenues.length }),
      (l) => { l.venues = [...(l.venues || []), { id: localId('venue'), name: venueForm.name.trim(), address: venueForm.address.trim(), sortOrder: (l.venues || []).length, status: 'active' }]; },
    );
    setVenueForm({ name: '', address: '' });
    setShowVenueForm(false);
  };

  const ensureConference = useCallback(async () => {
    if (conference) return conference;
    // Create the conference shell so rooms/sessions have a home.
    const seed = { name: '77th National Assembly', theme: 'Reviving Faith, Restoring Hope, Rebuilding Communities', host: 'The Church of the Living God', status: 'active' };
    if (mode === 'synced') {
      const res = await saveConference(seed);
      if (res.skipped) { showFlash(`Couldn't create the conference (${res.skipped}).`); return null; }
      return { ...seed, id: res.id };
    }
    const withId = { ...seed, id: localId('conf') };
    ec.bumpLocal((l) => { l.conference = withId; });
    return withId;
  }, [conference, mode, ec, showFlash]);

  const addRoom = async () => {
    if (!roomForm.name.trim()) return;
    const features = roomForm.features.split(/[,·\n]/).map((s) => s.trim()).filter(Boolean);
    const cap = roomForm.capacity === '' ? null : Number(roomForm.capacity);
    const venueId = roomForm.venueId || defaultVenueId || null;
    const useTypes = roomForm.useTypes;
    await runWrite(
      () => saveRoom({ name: roomForm.name.trim(), capacity: cap, features, useTypes, venueId, sortOrder: activeRooms.length }),
      (l) => { l.rooms = [...(l.rooms || []), { id: localId('room'), venueId, name: roomForm.name.trim(), capacity: cap, features, useTypes, sortOrder: (l.rooms || []).length, status: 'active' }]; },
    );
    setRoomForm({ name: '', capacity: '', features: '', venueId: roomForm.venueId, useTypes: [] });
  };
  const removeRoom = async (id) => {
    if (!window.confirm('Remove this room?')) return;
    await runWrite(() => deleteRoom(id), (l) => { l.rooms = (l.rooms || []).filter((r) => r.id !== id); });
  };

  const addSession = async () => {
    if (!sessForm.title.trim()) return;
    const conf = await ensureConference();
    if (!conf) return;
    const cap = sessForm.capacity === '' ? null : Number(sessForm.capacity);
    const venueId = sessForm.venueId || defaultVenueId || null;
    const base = {
      conferenceId: conf.id, day: sessForm.day.trim(), time: sessForm.time.trim(),
      title: sessForm.title.trim(), speaker: sessForm.speaker.trim(),
      sessionType: sessForm.sessionType, venueId, roomResourceId: sessForm.roomResourceId || null,
      capacity: cap, sermonRef: sessForm.sessionType === 'main_service' ? (sessForm.sermonRef || null) : null,
      musicSet: sessForm.sessionType === 'main_service' ? sessForm.musicSet : [],
    };
    await runWrite(
      () => saveSession(base),
      (l) => { l.sessions = [...(l.sessions || []), { ...base, id: localId('sess'), status: 'active', sortOrder: (l.sessions || []).length }]; },
    );
    setSessForm({ day: sessForm.day, time: '', title: '', speaker: '', sessionType: 'breakout', venueId: sessForm.venueId, roomResourceId: '', capacity: '', sermonRef: '', musicSet: [] });
    setShowSessForm(false);
  };
  const removeSession = async (id) => {
    if (!window.confirm('Remove this session?')) return;
    await runWrite(() => deleteSession(id), (l) => { l.sessions = (l.sessions || []).filter((s) => s.id !== id); });
  };

  const addRsvp = async () => {
    if (!rsvp.name.trim()) return;
    const conf = await ensureConference();
    if (!conf) return;
    const base = { conferenceId: conf.id, sessionId: rsvp.sessionId || null, name: rsvp.name.trim(), mealType: rsvp.mealType, dietary: rsvp.dietary.trim(), registrationStatus: 'registered' };
    await runWrite(
      () => saveParticipant(base),
      (l) => { l.participants = [...(l.participants || []), { ...base, id: localId('part'), createdAt: new Date().toISOString() }]; },
    );
    setRsvp({ name: '', mealType: 'Regular', dietary: '', sessionId: rsvp.sessionId });
  };
  const changeStatus = async (p, status) => {
    await runWrite(
      () => setRegistrationStatus(p.id, status),
      (l) => { l.participants = (l.participants || []).map((x) => (x.id === p.id ? { ...x, registrationStatus: status } : x)); },
    );
  };
  const removeParticipant = async (id) => {
    await runWrite(() => deleteParticipant(id), (l) => { l.participants = (l.participants || []).filter((p) => p.id !== id); });
  };

  // ---- render ---------------------------------------------------------------
  if (mode === 'loading') {
    return (
      <section className={card} aria-labelledby="eventcenter-h">
        <h2 id="eventcenter-h" className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🏛 Event Center</h2>
        <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Loading the shared conference system…</p>
      </section>
    );
  }

  // Non-organizers (signed-out, local, or a plain member) don't see the operational
  // tooling — they register in the front door above. A compact, honest note only.
  if (!isOrganizer) {
    return (
      <section className={card} aria-labelledby="eventcenter-h">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🏛 Event Center</div>
        <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Rooms, sessions, capacity, and the registration roll are managed by church leadership. To register, use the form above.
        </p>
      </section>
    );
  }

  return (
    <section className={card} aria-labelledby="eventcenter-h">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🏛 Event Center · Rooms &amp; Breakouts</div>
          <h2 id="eventcenter-h" className="text-lg sm:text-xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
            {conference ? conference.name : 'Multi-attendee conference system'}
          </h2>
          <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
            {mode === 'synced'
              ? 'Shared live — every leader and attendee sees the same rooms, sessions, and registrations.'
              : 'On this device — sign in with your church account to share it with everyone.'}
          </p>
        </div>
        <KpiDot
          status={mode === 'synced' ? 'good' : 'idle'}
          label={mode === 'synced' ? 'Shared / live' : 'This device'}
          className="text-[10px] uppercase tracking-wider text-[#5A5751] shrink-0"
        />
      </div>

      {mode === 'local' && (
        <p className="text-[11px] text-[#8A6E1F] bg-[#FBF7EC] border border-[#E8D9A8] px-3 py-2 mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
          {access.signedIn
            ? 'Your account isn’t linked to a church yet — ask to be added, then this becomes the shared system. For now it saves on this device.'
            : 'Sign in to make this the shared, live conference system. Until then your changes stay on this device.'}
        </p>
      )}
      {flash && (
        <p role="alert" className="text-[11px] text-[#B85838] bg-[#FBEFEA] border border-[#E8C4B5] px-3 py-2 mt-3" style={{ fontFamily: '"Fraunces", serif' }}>{flash}</p>
      )}

      {/* CONGREGATION REGISTRATIONS — the OPEN, no-login sign-ups (the real
          headcount + meal counts). Organizer-only; RLS gates the read. */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">🙋 Congregation registrations · {regHeads} {regHeads === 1 ? 'person' : 'people'}</h3>
          <span className="text-[10px] text-[#5A5751]">{publicRegs.length} {publicRegs.length === 1 ? 'entry' : 'entries'}</span>
        </div>
        {publicRegs.length === 0 ? (
          <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No registrations yet — share the open link (in the Conference front door above) so the congregation can sign up.</p>
        ) : (
          <>
            {mealCountRows(regMeals.counts).length > 0 && (
              <p className="text-[10px] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
                <span className="uppercase tracking-wider text-[#B85838] font-semibold">Meal counts:</span> {mealCountRows(regMeals.counts).map(([k, n]) => `${n} ${k}`).join(' · ')}
                {regMeals.notes.length > 0 ? ` · ${regMeals.notes.length} with dietary notes` : ''}
              </p>
            )}
            <ul className="space-y-1 max-h-72 overflow-auto">
              {publicRegs.map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-[11px] py-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                  <span className={`flex-1 min-w-0 ${r.status === 'cancelled' ? 'line-through text-[#5A5751]' : ''}`}>
                    <span className="font-semibold text-[#1A1815]">{r.name}{r.partySize > 1 ? <span className="text-[#5A5751] font-normal"> +{r.partySize - 1}</span> : null}</span>
                    <span className="text-[#5A5751]"> · {r.mealType}</span>
                    {r.dietary ? <span className="text-[#5A6E3D]"> · {r.dietary}</span> : null}
                    {r.days ? <span className="text-[#5A5751]"> · {r.days}</span> : null}
                    {(r.email || r.phone) ? <span className="text-[#5A5751]"> · {r.email || r.phone}</span> : null}
                  </span>
                  <select aria-label={`Status for ${r.name}`} value={r.status} onChange={(e) => setPublicRegStatus(r.id, e.target.value)} className="text-[10px] border border-[#E8E4DC] bg-[#FAF8F4] p-1">
                    <option value="new">New</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* VENUES — the buildings. Pick one to manage/book it, or see all. */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">🏢 Buildings · {activeVenues.length}</h3>
          {canEdit && <button type="button" onClick={() => setShowVenueForm(!showVenueForm)} className={btnGhost}>{showVenueForm ? '× Cancel' : '+ Add building'}</button>}
        </div>
        {canEdit && showVenueForm && (
          <div className="bg-[#FAF8F4] border border-[#B85838] p-2 mb-2 grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
            <div className="sm:col-span-2"><label className={labelCls} htmlFor="ec-v-name">Building name</label><input id="ec-v-name" className={fieldCls} placeholder="South Campus Event Center" value={venueForm.name} onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })} /></div>
            <div className="sm:col-span-3"><label className={labelCls} htmlFor="ec-v-addr">Address</label><input id="ec-v-addr" className={fieldCls} placeholder="1109 N 4th Street, Champaign, IL" value={venueForm.address} onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })} /></div>
            <button type="button" onClick={addVenue} className={`${btnDark} sm:col-span-1`}>Add</button>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={venueFilter === 'all'} onClick={() => setVenueFilter('all')}
            className={`text-[11px] px-2.5 py-1 border ${venueFilter === 'all' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}>All buildings</button>
          {activeVenues.map((v) => {
            const seats = venueSeatTotal(activeRooms, v.id);
            const on = venueFilter === v.id;
            return (
              <button key={v.id} type="button" aria-pressed={on} onClick={() => setVenueFilter(v.id)} title={v.address || v.name}
                className={`text-[11px] px-2.5 py-1 border ${on ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}>
                {v.name} · {roomsForVenue(activeRooms, v.id).length} {roomsForVenue(activeRooms, v.id).length === 1 ? 'room' : 'rooms'}{seats ? ` · ${seats} seats` : ''}
              </button>
            );
          })}
        </div>
        {venueFilter !== 'all' && venueById(activeVenues, venueFilter)?.address && (
          <p className="text-[10px] text-[#5A5751] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>📍 {venueById(activeVenues, venueFilter).address}</p>
        )}
      </div>

      {/* ROOMS — the per-building inventory */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">
            🚪 Rooms{venueFilter !== 'all' ? ` · ${venueById(activeVenues, venueFilter)?.name || ''}` : ''} · {visibleRooms.length}
          </h3>
        </div>
        {canEdit && (
          <div className="bg-[#FAF8F4] border border-[#B85838] p-2 mb-2 grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
            <div className="col-span-2"><label className={labelCls} htmlFor="ec-room-name">Room name</label><input id="ec-room-name" className={fieldCls} placeholder="Main Sanctuary" value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} /></div>
            <div><label className={labelCls} htmlFor="ec-room-bldg">Building</label>
              <select id="ec-room-bldg" className={fieldCls} value={roomForm.venueId || defaultVenueId} onChange={(e) => setRoomForm({ ...roomForm, venueId: e.target.value })}>
                {activeVenues.length === 0 && <option value="">— add a building first —</option>}
                {activeVenues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls} htmlFor="ec-room-cap">Capacity</label><input id="ec-room-cap" type="number" min="0" className={fieldCls} placeholder="600" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} /></div>
            <div className="col-span-2 sm:col-span-2"><label className={labelCls} htmlFor="ec-room-feat">Features</label><input id="ec-room-feat" className={fieldCls} placeholder="projector · sound" value={roomForm.features} onChange={(e) => setRoomForm({ ...roomForm, features: e.target.value })} /></div>
            <div className="col-span-2 sm:col-span-5">
              <span className={labelCls}>Supports (which module can use this room)</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {USE_TYPES.map((u) => {
                  const on = roomForm.useTypes.includes(u);
                  return (
                    <button key={u} type="button" aria-pressed={on}
                      onClick={() => setRoomForm({ ...roomForm, useTypes: on ? roomForm.useTypes.filter((x) => x !== u) : [...roomForm.useTypes, u] })}
                      className={`text-[10px] px-2 py-1 border capitalize ${on ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}>
                      {on ? '✓ ' : ''}{u}
                    </button>
                  );
                })}
              </div>
            </div>
            <button type="button" onClick={addRoom} className={`${btnDark} col-span-2 sm:col-span-1`}>Add room</button>
          </div>
        )}
        {visibleRooms.length === 0 ? (
          <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No rooms in this building yet{canEdit ? ' — add the spaces (main hall, classrooms, fellowship hall, kitchen) and tag what each supports so sessions can be assigned and capacity tracked.' : '.'}</p>
        ) : (
          <ul className="space-y-1">
            {visibleRooms.map((r) => {
              const venue = venueById(activeVenues, r.venueId);
              return (
                <li key={r.id} className="flex items-center gap-2 text-xs py-1 border-b border-[#E8E4DC] last:border-0" style={{ fontFamily: '"Fraunces", serif' }}>
                  <span className="font-semibold min-w-0">{r.name}</span>
                  {venueFilter === 'all' && venue && <span className="text-[9px] uppercase tracking-wider text-[#5A5751] border border-[#E8E4DC] px-1 py-0.5">{venue.name}</span>}
                  <span className="flex-1 min-w-0 flex flex-wrap gap-1">
                    {(r.useTypes || []).map((u) => <span key={u} className="text-[9px] uppercase tracking-wider text-[#5A6E3D] border border-[#D6DEC8] px-1 py-0.5 capitalize">{u}</span>)}
                  </span>
                  <span className="text-[#5A5751] shrink-0">{Number.isFinite(r.capacity) ? `${r.capacity} seats` : 'capacity —'}</span>
                  {canEdit && <button type="button" onClick={() => removeRoom(r.id)} aria-label={`Remove ${r.name}`} className="text-[#5A5751] hover:text-[#B85838] px-2">×</button>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* SESSIONS — type / room / capacity vs registration */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">📅 Sessions · {confSessions.length}</h3>
          {canEdit && <button type="button" onClick={() => setShowSessForm(!showSessForm)} className={btnGhost}>{showSessForm ? '× Cancel' : '+ Add session'}</button>}
        </div>
        {canEdit && showSessForm && (
          <div className="bg-[#FAF8F4] border border-[#B85838] p-2 mb-3 grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
            <div><label className={labelCls} htmlFor="ec-s-day">Day</label><input id="ec-s-day" className={fieldCls} placeholder="Tue Jul 15" value={sessForm.day} onChange={(e) => setSessForm({ ...sessForm, day: e.target.value })} /></div>
            <div><label className={labelCls} htmlFor="ec-s-time">Time</label><input id="ec-s-time" className={fieldCls} placeholder="7:00 PM" value={sessForm.time} onChange={(e) => setSessForm({ ...sessForm, time: e.target.value })} /></div>
            <div className="col-span-2"><label className={labelCls} htmlFor="ec-s-title">Session</label><input id="ec-s-title" className={fieldCls} placeholder="Evening Worship" value={sessForm.title} onChange={(e) => setSessForm({ ...sessForm, title: e.target.value })} /></div>
            <div><label className={labelCls} htmlFor="ec-s-type">Type</label>
              <select id="ec-s-type" className={fieldCls} value={sessForm.sessionType} onChange={(e) => setSessForm({ ...sessForm, sessionType: e.target.value })}>
                {SESSION_TYPES.map((t) => <option key={t} value={t}>{SESSION_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div><label className={labelCls} htmlFor="ec-s-cap">Capacity</label><input id="ec-s-cap" type="number" min="0" className={fieldCls} placeholder="room default" value={sessForm.capacity} onChange={(e) => setSessForm({ ...sessForm, capacity: e.target.value })} /></div>
            <div><label className={labelCls} htmlFor="ec-s-venue">Building</label>
              <select id="ec-s-venue" className={fieldCls} value={sessForm.venueId || defaultVenueId}
                onChange={(e) => setSessForm({ ...sessForm, venueId: e.target.value, roomResourceId: '' })}>
                {activeVenues.length === 0 && <option value="">— add a building —</option>}
                {activeVenues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls} htmlFor="ec-s-room">Room</label>
              <select id="ec-s-room" className={fieldCls} value={sessForm.roomResourceId} onChange={(e) => setSessForm({ ...sessForm, roomResourceId: e.target.value })}>
                <option value="">— unassigned —</option>
                {roomsForVenue(activeRooms, sessForm.venueId || defaultVenueId).map((r) => <option key={r.id} value={r.id}>{r.name}{Number.isFinite(r.capacity) ? ` (${r.capacity})` : ''}</option>)}
              </select>
            </div>
            <div><label className={labelCls} htmlFor="ec-s-speaker">Speaker</label><input id="ec-s-speaker" className={fieldCls} placeholder="optional" value={sessForm.speaker} onChange={(e) => setSessForm({ ...sessForm, speaker: e.target.value })} /></div>
            {/* Service<->Choir link (main_service only): real sermon + song set */}
            {sessForm.sessionType === 'main_service' && (
              <div className="col-span-2 sm:col-span-6 border-t border-[#E8E4DC] pt-2 mt-1">
                <p className="text-[9px] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">⛪ Service ↔ Choir (links the real sermon &amp; music)</p>
                {sermons.length === 0 && songs.length === 0 ? (
                  <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>The choir’s sermons &amp; songs appear here once they’re in the Choir module.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><label className={labelCls} htmlFor="ec-s-sermon">Sermon</label>
                      <select id="ec-s-sermon" className={fieldCls} value={sessForm.sermonRef} onChange={(e) => setSessForm({ ...sessForm, sermonRef: e.target.value })}>
                        <option value="">— none —</option>
                        {sermons.map((s) => <option key={s.id} value={s.id}>{s.title}{s.serviceDate ? ` (${s.serviceDate})` : ''}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className={labelCls}>Music set {sessForm.musicSet.length > 0 ? `· ${sessForm.musicSet.length}` : ''}</span>
                      <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-auto">
                        {songs.map((sg) => {
                          const on = sessForm.musicSet.includes(sg.id);
                          return (
                            <button key={sg.id} type="button" aria-pressed={on}
                              onClick={() => setSessForm({ ...sessForm, musicSet: toggleSongId(sessForm.musicSet, sg.id) })}
                              className={`text-[10px] px-2 py-1 border ${on ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`}>
                              {on ? '✓ ' : ''}{sg.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button type="button" onClick={addSession} className={`${btnDark} col-span-2 sm:col-span-6`}>Add session</button>
          </div>
        )}
        {confSessions.length === 0 ? (
          <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No sessions yet{canEdit ? ' — add the main services and the breakouts that run alongside them.' : '.'}</p>
        ) : (
          <ul className="space-y-1.5">
            {confSessions.map((s) => {
              const room = roomForSession(s, activeRooms);
              const cap = effectiveCapacity(s, activeRooms);
              const count = registrationCount(confParticipants, s.id);
              const st = capacityStatus(count, cap);
              const isMain = isMainServiceSession(s);
              const venue = venueById(activeVenues, s.venueId);
              const sermon = isMain ? sessionSermon(s, sermons) : null;
              const setSongs = isMain ? sessionSongs(s, songs) : [];
              return (
                <li key={s.id} className="text-xs py-1.5 border-b border-[#E8E4DC] last:border-0" style={{ fontFamily: '"Fraunces", serif' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border shrink-0"
                      style={{ borderColor: isMain ? '#B85838' : '#5A6E3D', color: isMain ? '#B85838' : '#5A6E3D' }}>{SESSION_TYPE_LABEL[s.sessionType]}</span>
                    <span className="text-[10px] text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{[s.day, s.time].filter(Boolean).join(' · ')}</span>
                    <span className="flex-1 min-w-0 font-semibold">{s.title}{s.speaker ? <span className="text-[#5A5751] font-normal"> — {s.speaker}</span> : null}</span>
                    {(venue || room) && <span className="text-[10px] text-[#5A5751] shrink-0">{[venue?.name, room?.name].filter(Boolean).join(' · ')}</span>}
                    <KpiDot status={st.tone} label={st.label} className="text-[10px] shrink-0" />
                    {canEdit && <button type="button" onClick={() => removeSession(s.id)} aria-label={`Remove ${s.title}`} className="text-[#5A5751] hover:text-[#B85838] px-1">×</button>}
                  </div>
                  {isMain && (sermon || setSongs.length > 0) && (
                    <div className="text-[10px] text-[#5A6E3D] mt-0.5 ml-1">
                      {sermon && <span>⛪ {sermon.title}</span>}
                      {setSongs.length > 0 && <span>{sermon ? ' · ' : ''}🎵 {setSongs.map((sg) => sg.title).join(' · ')}</span>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* WHOLE-BUILDING — breakouts parallel to each main service */}
      {building.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">🏛 Whole-building · breakouts during the main service</h3>
          <ul className="space-y-1.5">
            {building.map(({ main, breakouts, parallelCount, totalBreakoutSeats }) => (
              <li key={main.id} className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                While <span className="font-semibold text-[#1A1815]">{main.title}</span>{main.day ? ` (${main.day})` : ''} runs in the main space,{' '}
                <span className="font-semibold text-[#B85838]">{parallelCount} {parallelCount === 1 ? 'breakout' : 'breakouts'}</span> run in parallel{totalBreakoutSeats ? ` (${totalBreakoutSeats} breakout seats)` : ''}
                {breakouts.length > 0 && <span className="text-[#5A6E3D]"> — {breakouts.map((b) => b.title).join(' · ')}</span>}.
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* WALK-IN / SESSION REGISTRATION — the organizer's on-site + per-session
          roll (event_participants, with capacity). Separate from the open
          congregation registrations above (those are the public sign-ups). */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">
          🪑 Walk-in / session registration · {conferenceRsvpCount(confParticipants, conference?.id)} on the roll
        </h3>
        <p className="text-[10px] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>For on-site check-in and assigning people to specific breakout sessions (capacity-tracked).</p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 items-end">
          <div className="sm:col-span-2"><label className={labelCls} htmlFor="ec-rsvp-name">Name</label><input id="ec-rsvp-name" className={fieldCls} placeholder="Your name" value={rsvp.name} onChange={(e) => setRsvp({ ...rsvp, name: e.target.value })} /></div>
          <div><label className={labelCls} htmlFor="ec-rsvp-meal">Meal</label>
            <select id="ec-rsvp-meal" className={fieldCls} value={rsvp.mealType} onChange={(e) => setRsvp({ ...rsvp, mealType: e.target.value })}>
              {MEAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div><label className={labelCls} htmlFor="ec-rsvp-sess">For</label>
            <select id="ec-rsvp-sess" className={fieldCls} value={rsvp.sessionId} onChange={(e) => setRsvp({ ...rsvp, sessionId: e.target.value })}>
              <option value="">Whole conference</option>
              {confSessions.filter((s) => s.sessionType === 'breakout').map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
          <button type="button" onClick={addRsvp} className={btnDark}>RSVP</button>
        </div>
        {/* Allergy / dietary — ALWAYS available (not hidden behind "Other"), so a
            Vegan or Gluten-free attendee with a nut allergy can still record it. */}
        <input className={`${fieldCls} mt-1.5`} placeholder="Allergy or specific dietary need (optional)" value={rsvp.dietary} onChange={(e) => setRsvp({ ...rsvp, dietary: e.target.value })} aria-label="Allergy or specific dietary need" />
        {mealCountRows(mealAgg.counts).length > 0 && (
          <p className="text-[10px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            <span className="uppercase tracking-wider text-[#B85838] font-semibold">Meal counts:</span> {mealCountRows(mealAgg.counts).map(([k, n]) => `${n} ${k}`).join(' · ')}
            {mealAgg.notes.length > 0 ? ` · ${mealAgg.notes.length} with dietary notes` : ''}
          </p>
        )}
        {confParticipants.length > 0 && (
          <ul className="mt-2 space-y-1">
            {confParticipants.slice(-8).map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-[11px]" style={{ fontFamily: '"Fraunces", serif' }}>
                <span className={`flex-1 min-w-0 ${p.registrationStatus === 'cancelled' ? 'line-through text-[#5A5751]' : ''}`}>
                  {p.name} <span className="text-[#5A5751]">· {p.mealType}</span>{p.dietary ? <span className="text-[#5A6E3D]"> · {p.dietary}</span> : null}
                </span>
                {canEdit ? (
                  <select aria-label={`Status for ${p.name}`} className="text-[10px] border border-[#E8E4DC] bg-[#FAF8F4] p-1" value={p.registrationStatus} onChange={(e) => changeStatus(p, e.target.value)}>
                    <option value="registered">Registered</option>
                    <option value="checked_in">Checked in</option>
                    <option value="waitlist">Waitlist</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className="text-[10px] text-[#5A5751] uppercase tracking-wider">{p.registrationStatus.replace('_', ' ')}</span>
                )}
                {(canEdit || p.mine) && <button type="button" onClick={() => removeParticipant(p.id)} aria-label={`Remove ${p.name}`} className="text-[#5A5751] hover:text-[#B85838] px-1">×</button>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function EventCenterModule() {
  return (
    <SectionBoundary name="Event Center">
      <EventCenterModuleInner />
    </SectionBoundary>
  );
}

export default EventCenterModule;
