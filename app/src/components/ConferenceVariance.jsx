// =============================================================================
// ConferenceVariance — ANTICIPATED vs ACTUAL for the conference (check-in + variance)
// =============================================================================
// The operational close of the conference loop: the engine projects who's coming
// (registrations) and how to size the day; THIS surface captures what really
// happened and shows the gap. Two halves, organizer-gated (RLS), self-contained
// like <EventCenterModule /> (owns its own subscriptions; no parent props):
//
//   1. CHECK-IN — the ACTUAL headcount capture. Non-technical-friendly: a big
//      search box + a list of big one-tap rows. Tap a name → checked in (records
//      the time + how many of the party came). Unbreakable (SectionBoundary +
//      fail-soft writes) + WCAG AA (44px targets, text labels never color-alone).
//
//   2. VARIANCE — anticipated vs actual side by side, with the delta + no-show
//      rate, for: the whole event (heads), each MEAL type (plates — serves the
//      kitchen), each ROOM (capacity vs used — serves capacity/staffing), and each
//      SESSION (signed-up vs checked-in, derived). Staff record meals SERVED + room
//      USE inline; everything persists (conference_actuals) so projection accuracy
//      can be reviewed after the event AND is useful live.
//
// ANTICIPATED reads the SAME real tables the rest of the engine does (no painted
// numbers): conference_public_registrations (heads + meal mix), event_sessions /
// event_participants (per-session roll). ACTUAL = check-in + conference_actuals.
// =============================================================================
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { KpiDot } from './KpiDot.jsx';
import SectionBoundary from './SectionBoundary.jsx';
import {
  getConferenceAccess, subscribeConferences, subscribeSessions, subscribeRooms, subscribeParticipants,
} from '../lib/conference-sync.js';
import {
  subscribeRegistrations, checkInRegistration, undoCheckIn, isCheckedIn,
} from '../lib/conference-register.js';
import {
  subscribeActuals, saveActual,
  eventVariance, checkInProgress, mealVarianceRows, roomVarianceRows, sessionVarianceRows,
  ratePct,
} from '../lib/conference-variance.js';

// Shared tokens — identical to EventCenterModule (already WCAG AA + contrast-gated).
const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';
const sectionH = 'text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';

// --- the data hook -----------------------------------------------------------
function useVarianceData() {
  const [access, setAccess] = useState({ signedIn: false, canSee: false, canEdit: false });
  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [actuals, setActuals] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const unsubs = [];
    (async () => {
      const acc = await getConferenceAccess();
      if (cancelled) return;
      setAccess(acc);
      setLoading(false);
      // Organizer-only surface (reads the registration roll — RLS owner/admin).
      if (acc.signedIn && acc.canEdit) {
        unsubs.push(subscribeRegistrations((r) => !cancelled && setRegs(r || [])));
        unsubs.push(subscribeConferences((r) => !cancelled && setConferences(r || [])));
        unsubs.push(subscribeSessions((r) => !cancelled && setSessions(r || [])));
        unsubs.push(subscribeRooms((r) => !cancelled && setRooms(r || [])));
        unsubs.push(subscribeParticipants((r) => !cancelled && setParticipants(r || [])));
        unsubs.push(subscribeActuals((r) => !cancelled && setActuals(r || [])));
      }
    })();
    return () => { cancelled = true; unsubs.forEach((u) => { try { u(); } catch { /* noop */ } }); };
  }, []);

  return { access, loading, regs, conferences, sessions, rooms, participants, actuals };
}

// A row in the check-in list. Big tap target; checked-in shows a green confirmed
// state with the recorded heads + an undo, never color-alone (text "Checked in").
function CheckInRow({ reg, onCheckIn, onAdjust, onUndo }) {
  const arrived = isCheckedIn(reg);
  const heads = Number.isFinite(reg.checkedInHeads) ? reg.checkedInHeads : reg.partySize;
  const party = reg.partySize > 1 ? ` · party of ${reg.partySize}` : '';
  return (
    <li className="flex items-stretch gap-2 border-b border-[#E8E4DC] last:border-0">
      {arrived ? (
        <>
          <div className="flex-1 min-w-0 flex items-center gap-2 py-2 px-2 bg-[#F0F4EA]" style={{ fontFamily: '"Fraunces", serif' }}>
            <span aria-hidden="true" className="text-[#3F5226] text-base">✓</span>
            <span className="flex-1 min-w-0">
              <span className="font-semibold text-[#1A1815]">{reg.name}</span>
              <span className="text-[#3F5226] text-[11px]"> · Checked in{heads > 1 ? ` (${heads} of ${reg.partySize})` : ''}</span>
            </span>
            {reg.partySize > 1 && (
              <span className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => onAdjust(reg, Math.max(1, heads - 1))} aria-label={`One fewer in ${reg.name}'s party`}
                  className="min-w-[36px] min-h-[36px] border border-[#D6DEC8] text-[#3F5226] text-base leading-none">−</button>
                <span className="text-xs text-[#3F5226] w-5 text-center" aria-hidden="true">{heads}</span>
                <button type="button" onClick={() => onAdjust(reg, Math.min(reg.partySize, heads + 1))} aria-label={`One more in ${reg.name}'s party`}
                  className="min-w-[36px] min-h-[36px] border border-[#D6DEC8] text-[#3F5226] text-base leading-none">+</button>
              </span>
            )}
          </div>
          <button type="button" onClick={() => onUndo(reg)} aria-label={`Undo check-in for ${reg.name}`}
            className="shrink-0 min-h-[44px] px-3 text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] border border-[#E8E4DC]">Undo</button>
        </>
      ) : (
        <button type="button" onClick={() => onCheckIn(reg)}
          className="flex-1 min-w-0 min-h-[52px] flex items-center gap-2 py-2 px-2 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
          style={{ fontFamily: '"Fraunces", serif' }}>
          <span aria-hidden="true" className="w-5 h-5 border-2 border-[#B85838] shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="font-semibold text-[#1A1815] text-sm">{reg.name}</span>
            <span className="text-[#5A5751] text-[11px]">{party}{reg.mealType ? ` · ${reg.mealType}` : ''}{reg.dietary ? ` · ${reg.dietary}` : ''}</span>
          </span>
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-[#B85838] font-semibold border border-[#B85838] px-3 py-2">Check in</span>
        </button>
      )}
    </li>
  );
}

// A variance line: label + the anticipated/actual numbers + a tone dot. Reused for
// event / meal / room / session so the read is identical everywhere.
function VarianceLine({ name, cell, suffix = '' }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-[#E8E4DC] last:border-0 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
      <span className="flex-1 min-w-0 font-semibold text-[#1A1815] truncate">{name}</span>
      <span className="shrink-0 text-[#5A5751] tabular-nums" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
        {cell.anticipated == null ? '—' : cell.anticipated}<span className="text-[#B8B2A6]"> ant</span>
        {' · '}
        {cell.actual == null ? '—' : cell.actual}<span className="text-[#B8B2A6]"> act</span>{suffix}
      </span>
      <KpiDot status={cell.tone} label={cell.label} className="shrink-0 text-[10px]" />
    </div>
  );
}

function ConferenceVarianceInner() {
  const { access, loading, regs, conferences, sessions, rooms, participants, actuals } = useVarianceData();
  const [flash, setFlash] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('checkin'); // 'checkin' | 'variance'
  // Local drafts for the meals-served / room-used inputs (keyed by ref).
  const [mealDraft, setMealDraft] = useState({});
  const [roomDraft, setRoomDraft] = useState({});

  const isOrganizer = access.signedIn && access.canEdit;

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

  // ANTICIPATED vs ACTUAL (all derived from real rows + recorded actuals).
  const event = useMemo(() => eventVariance(regs), [regs]);
  const progress = useMemo(() => checkInProgress(regs), [regs]);
  const meals = useMemo(() => mealVarianceRows(regs, actuals), [regs, actuals]);
  const roomRows = useMemo(() => roomVarianceRows(activeRooms, actuals), [activeRooms, actuals]);
  const sessionRows = useMemo(() => sessionVarianceRows(confSessions, confParticipants), [confSessions, confParticipants]);

  // Check-in list: not-yet-arrived first (the work to do), then arrived; filtered
  // by the search box (name / email / phone). Cancelled drop out.
  const checkInList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const live = regs.filter((r) => r.status !== 'cancelled');
    const match = (r) => !q || [r.name, r.email, r.phone].filter(Boolean).some((f) => f.toLowerCase().includes(q));
    const filtered = live.filter(match);
    return [...filtered.filter((r) => !isCheckedIn(r)), ...filtered.filter(isCheckedIn)];
  }, [regs, search]);

  const doCheckIn = useCallback(async (reg) => {
    const res = await checkInRegistration(reg.id, reg.partySize);
    if (!res.ok) setFlash(`Couldn't check in ${reg.name}. Try again.`);
  }, []);
  const doAdjust = useCallback(async (reg, heads) => {
    const res = await checkInRegistration(reg.id, heads);
    if (!res.ok) setFlash(`Couldn't update ${reg.name}'s count.`);
  }, []);
  const doUndo = useCallback(async (reg) => {
    const res = await undoCheckIn(reg.id);
    if (!res.ok) setFlash(`Couldn't undo ${reg.name}.`);
  }, []);

  const recordActual = useCallback(async (scope, refKey, label, anticipated, value) => {
    if (!conference) { setFlash('No conference to record against yet.'); return; }
    if (value === '' || value == null) return;
    const res = await saveActual({
      conferenceId: conference.id, scope, refKey, label,
      anticipated: Number.isFinite(anticipated) ? anticipated : null,
      actual: Number(value),
    });
    if (res.skipped) setFlash(`Couldn't save the ${scope} actual (${res.skipped}).`);
  }, [conference]);

  if (loading) {
    return (
      <section className={card} aria-labelledby="conf-var-h">
        <h2 id="conf-var-h" className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">📊 Anticipated vs Actual</h2>
        <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Loading…</p>
      </section>
    );
  }

  // Non-organizers: the Event Center above already explains the area. Stay quiet
  // here rather than duplicating the message (this surface is leadership-only).
  if (!isOrganizer) return null;

  return (
    <section className={card} aria-labelledby="conf-var-h">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">📊 Anticipated vs Actual</div>
          <h2 id="conf-var-h" className="text-lg sm:text-xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
            Check-in &amp; variance
          </h2>
          <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
            {conference ? conference.name : 'Conference'} · {progress.arrived} of {progress.expected} registrations arrived
            {event.noShowRate != null ? ` · ${ratePct(event.noShowRate)} no-show` : ''}
          </p>
        </div>
        <div role="tablist" aria-label="Anticipated vs actual view" className="flex shrink-0 border border-[#E8E4DC]">
          <button type="button" role="tab" aria-selected={tab === 'checkin'} onClick={() => setTab('checkin')}
            className={`min-h-[40px] px-3 text-[11px] uppercase tracking-wider font-semibold ${tab === 'checkin' ? 'bg-[#1A1815] text-white' : 'bg-white text-[#5A5751]'}`}>Check-in</button>
          <button type="button" role="tab" aria-selected={tab === 'variance'} onClick={() => setTab('variance')}
            className={`min-h-[40px] px-3 text-[11px] uppercase tracking-wider font-semibold ${tab === 'variance' ? 'bg-[#1A1815] text-white' : 'bg-white text-[#5A5751]'}`}>Variance</button>
        </div>
      </div>

      {flash && (
        <p role="alert" className="text-[11px] text-[#B85838] bg-[#FBEFEA] border border-[#E8C4B5] px-3 py-2 mt-3" style={{ fontFamily: '"Fraunces", serif' }}>{flash}</p>
      )}

      {/* CHECK-IN — the ACTUAL headcount capture */}
      {tab === 'checkin' && (
        <div className="mt-4">
          {/* Progress: arrived heads vs anticipated heads */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-3 bg-[#EFE9DF] border border-[#E8E4DC] overflow-hidden" role="progressbar"
              aria-valuemin={0} aria-valuemax={event.anticipated || 0} aria-valuenow={event.actual || 0}
              aria-label="Heads checked in versus anticipated">
              <div className="h-full bg-[#5A6E3D]" style={{ width: event.anticipated > 0 ? `${Math.min(100, Math.round((event.actual / event.anticipated) * 100))}%` : '0%' }} />
            </div>
            <span className="shrink-0 text-xs text-[#1A1815] font-semibold tabular-nums" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {event.actual} / {event.anticipated} heads
            </span>
          </div>

          <label className={labelCls} htmlFor="conf-var-search">Find a name to check in</label>
          <input id="conf-var-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a name…" autoComplete="off"
            className="w-full p-3 border border-[#1A1815] text-base bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838] mb-2" />

          {checkInList.length === 0 ? (
            <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              {regs.length === 0 ? 'No registrations yet — once the congregation signs up, names appear here to check in.' : 'No one matches that search.'}
            </p>
          ) : (
            <ul className="max-h-[28rem] overflow-auto border border-[#E8E4DC]">
              {checkInList.map((reg) => (
                <CheckInRow key={reg.id} reg={reg} onCheckIn={doCheckIn} onAdjust={doAdjust} onUndo={doUndo} />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* VARIANCE — anticipated vs actual side by side */}
      {tab === 'variance' && (
        <div className="mt-4 space-y-4">
          {/* EVENT — heads + no-show */}
          <div>
            <h3 className={`${sectionH} mb-1`}>👥 Whole event · headcount</h3>
            <VarianceLine name="Registered → arrived" cell={event} />
            <p className="text-[10px] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
              No-show rate <span className="font-semibold text-[#1A1815]">{event.noShowRate != null ? ratePct(event.noShowRate) : '—'}</span>
              {' '}— the share of anticipated heads who didn’t check in. Drives next year’s sizing.
            </p>
          </div>

          {/* MEALS — anticipated plates vs served (kitchen). Inline served entry. */}
          <div>
            <h3 className={`${sectionH} mb-1`}>🍽 Meals · plates anticipated vs served</h3>
            {meals.length === 0 ? (
              <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No meal selections yet.</p>
            ) : (
              <ul className="space-y-0">
                {meals.map((m) => (
                  <li key={m.type} className="flex items-center gap-2 py-1.5 border-b border-[#E8E4DC] last:border-0 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
                    <span className="flex-1 min-w-0 font-semibold text-[#1A1815]">{m.type}</span>
                    <span className="shrink-0 text-[#5A5751] tabular-nums" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{m.anticipated} ant</span>
                    <label className="sr-only" htmlFor={`meal-${m.type}`}>{m.type} plates served</label>
                    <input id={`meal-${m.type}`} type="number" min="0" inputMode="numeric"
                      value={mealDraft[m.type] ?? (m.hasActual ? String(m.actual) : '')}
                      onChange={(e) => setMealDraft({ ...mealDraft, [m.type]: e.target.value })}
                      onBlur={(e) => recordActual('meal', m.type, m.type, m.anticipated, e.target.value)}
                      placeholder="served" aria-label={`${m.type} plates served`}
                      className="w-20 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" />
                    <KpiDot status={m.hasActual ? m.tone : 'idle'} label={m.hasActual ? m.label : 'awaiting count'} className="shrink-0 text-[10px] w-28" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ROOMS — capacity vs actually used (capacity / staffing). Inline entry. */}
          <div>
            <h3 className={`${sectionH} mb-1`}>🚪 Rooms · capacity vs actually used</h3>
            {roomRows.length === 0 ? (
              <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No rooms with a capacity yet — set room capacities in the Event Center.</p>
            ) : (
              <ul className="space-y-0">
                {roomRows.map((r) => (
                  <li key={r.roomId} className="flex items-center gap-2 py-1.5 border-b border-[#E8E4DC] last:border-0 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
                    <span className="flex-1 min-w-0 font-semibold text-[#1A1815] truncate">{r.name}</span>
                    <span className="shrink-0 text-[#5A5751] tabular-nums" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.anticipated == null ? '—' : `${r.anticipated} cap`}</span>
                    <label className="sr-only" htmlFor={`room-${r.roomId}`}>{r.name} actual occupancy</label>
                    <input id={`room-${r.roomId}`} type="number" min="0" inputMode="numeric"
                      value={roomDraft[r.roomId] ?? (r.hasActual ? String(r.actual) : '')}
                      onChange={(e) => setRoomDraft({ ...roomDraft, [r.roomId]: e.target.value })}
                      onBlur={(e) => recordActual('room', r.roomId, r.name, r.anticipated, e.target.value)}
                      placeholder="used" aria-label={`${r.name} actual occupancy`}
                      className="w-20 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" />
                    <KpiDot status={r.hasActual ? r.tone : 'idle'} label={r.hasActual ? r.label : 'awaiting count'} className="shrink-0 text-[10px] w-28" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* SESSIONS — signed-up vs checked-in (fully derived from the roll) */}
          {sessionRows.length > 0 && (
            <div>
              <h3 className={`${sectionH} mb-1`}>📅 Sessions · signed-up vs checked-in</h3>
              <ul className="space-y-0">
                {sessionRows.map((s) => (
                  <VarianceLine key={s.sessionId} name={`${s.day ? `${s.day} · ` : ''}${s.title}`} cell={s} />
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            Every number above is real — anticipated reads the registration roll &amp; rooms; actual is check-in + the counts staff record here. All persist for post-event review.
          </p>
        </div>
      )}
    </section>
  );
}

export function ConferenceVariance() {
  return (
    <SectionBoundary name="Anticipated vs Actual">
      <ConferenceVarianceInner />
    </SectionBoundary>
  );
}

export default ConferenceVariance;
