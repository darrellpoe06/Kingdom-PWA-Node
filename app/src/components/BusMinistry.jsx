// =============================================================================
// BusMinistry — the Church Bus/Van Ministry surface (Deacon Anderson, 2026-07-12)
// =============================================================================
// The live need Deacon Anderson named: the schedule comes out but nobody reminds
// the drivers, so "no one's on the phones this morning." This surface fixes that
// with real, instance-scoped, cross-device data (DR-0061): a driver roster (phone
// + email), the weekly Sunday schedule (who drives which route, in which van,
// arrive 9:45 / end ~1:30), a REMINDER queue that fires the Thursday before, a
// shared message thread + 1:1 direct messages + report-to-security, sovereign
// meeting scheduling with load rules, and a dev/ops intake so the ministry hands
// new requirements to the build team.
//
// Access mirrors Choir: read = any ministry member; edit = owner/admin (the
// coordinator). RLS is the real gate (0095-bus-ministry.sql); the client mirrors
// it with getBusAccess() so editor controls only render for the coordinator.
//
// Word-first: "Bear ye one another's burdens" (Galatians 6:2); the reminders so
// "all things be done decently and in order" (1 Corinthians 14:40).
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import SectionTabs from './SectionTabs.jsx';
import DirectMessages from './DirectMessages.jsx';
import SecurityPanel from './SecurityPanel.jsx';
import { onAuthChange } from '../lib/supabase.js';
import {
  getBusAccess,
  subscribeDrivers, subscribeRoutes, subscribeVans, subscribeSchedule, subscribeReminders, subscribeBusMessages, subscribeRequests,
  saveDriver, removeDriver, saveRoute, removeRoute, addStarterRoutes, saveVan, removeVan, addStarterVans,
  saveScheduleRow, removeScheduleRow, setScheduleStatus, scheduleReminders, markReminderSent, acknowledgeReminder,
  sendBusMessage, submitRequest, updateRequest,
  subscribeRideRequests, submitRideRequest, updateRideRequest,
  coverageForDate, buildReminderPlan, dueReminders, overdueReminders, upcomingSundays, remindSendOn,
  serviceWindow, driverRoleLabel, scheduleStatusLabel, requestStatusLabel, DRIVER_ROLES, REQUEST_STATUS,
  validateRideRequest, rideRequestStatusLabel, rideRequestOpen, RIDE_REQUEST_STATUS,
  DEFAULT_ARRIVE, DEFAULT_END,
} from '../lib/bus-ministry-sync.js';
import {
  subscribeMeetings, scheduleMeeting, setMeetingStatus, removeMeeting,
  upcomingMeetings, meetingProviderLabel, meetingStatusLabel, MEETING_PROVIDERS,
  meetingSpaceLabel, canBookSpace, spaceCap,
} from '../lib/ministry-meetings-sync.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const CARD = 'border border-[#E8E4DC] bg-white p-3';

const todayIso = () => { try { return new Date().toISOString().slice(0, 10); } catch { return '2026-01-01'; } };
const fmtDate = (d) => { if (!d) return ''; try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }); } catch { return d; } };
const fmtDateShort = (d) => { if (!d) return ''; try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return d; } };

// -----------------------------------------------------------------------------
export default function BusMinistry() {
  const [signedIn, setSignedIn] = useState(false);
  const [access, setAccess] = useState({ signedIn: false, canSee: false, canEdit: false });
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vans, setVans] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [rideRequests, setRideRequests] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => onAuthChange((s) => setSignedIn(!!s)), []);
  useEffect(() => {
    if (!signedIn) { setAccess({ signedIn: false, canSee: false, canEdit: false }); return undefined; }
    let alive = true;
    getBusAccess().then((a) => { if (alive) setAccess(a); });
    return () => { alive = false; };
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn || !access.canSee) return undefined;
    const unsubs = [
      subscribeDrivers(setDrivers), subscribeRoutes(setRoutes), subscribeVans(setVans),
      subscribeSchedule(setSchedule), subscribeReminders(setReminders), subscribeBusMessages(setMessages),
      subscribeRequests(setRequests), subscribeMeetings(setMeetings),
    ];
    return () => unsubs.forEach((u) => { try { u && u(); } catch { /* noop */ } });
  }, [signedIn, access.canSee]);

  // Ride requests stream for EVERY signed-in member (not just the ministry):
  // RLS returns a rider their OWN requests and a ministry member ALL of them, so
  // both the rider's "your requests" and the coordinator's inbox stay live.
  useEffect(() => {
    if (!signedIn) return undefined;
    const unsub = subscribeRideRequests(setRideRequests);
    return () => { try { unsub && unsub(); } catch { /* noop */ } };
  }, [signedIn]);

  const reportSkip = (r) => { if (r && r.skipped) setErr(`Could not save (${r.skipped}). Try again.`); else setErr(''); };
  const canEdit = access.canEdit;

  // Roster people I can DM (linked app accounts only).
  const dmRoster = useMemo(() => drivers.filter((d) => d.userId).map((d) => ({ userId: d.userId, displayName: d.displayName })), [drivers]);

  if (!signedIn) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <SectionTitle>Bus / Van Ministry</SectionTitle>
        <p className="text-sm text-[#5A5751] mt-2">Sign in to see the bus ministry schedule and messages.</p>
      </div>
    );
  }
  // A rider (not a driver) can't see the coordination space — but they CAN ask
  // for a ride. Instead of a dead end, give them the request form + their own
  // requests. RLS lets any church member file one and see only their own.
  if (!access.canSee) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-3">
        <SectionTitle>Bus / Van Ministry</SectionTitle>
        <p className="text-xs text-[#5A5751] italic">
          "Bear ye one another's burdens, and so fulfil the law of Christ." — Galatians 6:2 (KJV)
        </p>
        {err && <p className="text-xs text-[#991B1B]" role="alert">{err}</p>}
        <RiderRequestPanel myRequests={rideRequests.filter((r) => r.mine)} reportSkip={reportSkip} />
        <p className="text-xs text-[#5A5751] mt-2">
          Drive with the ministry? Ask Deacon Anderson (the coordinator) to add you to the driver roster, and the schedule, reminders, and messages will show here.
        </p>
      </div>
    );
  }

  const sections = [
    { id: 'sunday', label: 'This Sunday', icon: 'calendar', render: () => <SundayPanel {...{ schedule, routes, reminders, canEdit, setErr, reportSkip }} /> },
    { id: 'schedule', label: 'Schedule', icon: 'calendar', render: () => <SchedulePanel {...{ schedule, routes, vans, drivers, canEdit, reportSkip }} /> },
    { id: 'roster', label: 'Drivers', icon: 'users', render: () => <RosterPanel {...{ drivers, canEdit, reportSkip, dmRoster }} /> },
    { id: 'fleet', label: 'Routes & Vans', icon: 'pin', render: () => <FleetPanel {...{ routes, vans, canEdit, reportSkip }} /> },
    { id: 'reminders', label: 'Reminders', icon: 'phone', render: () => <RemindersPanel {...{ reminders, canEdit, reportSkip }} /> },
    { id: 'meetings', label: 'Meetings', icon: 'monitor', render: () => <MeetingsPanel {...{ meetings, canEdit, reportSkip }} /> },
    { id: 'talk', label: 'Messages', icon: 'chat', render: () => <TalkPanel {...{ messages, reportSkip, dmRoster }} /> },
    { id: 'rides', label: 'Ride requests', icon: 'users', render: () => <RideRequestsPanel {...{ rideRequests, drivers, canEdit, reportSkip }} /> },
    { id: 'requests', label: 'Requests', icon: 'sliders', render: () => <RequestsPanel {...{ requests, canEdit, reportSkip }} /> },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-3">
      <SectionTitle>Bus / Van Ministry</SectionTitle>
      <p className="text-xs text-[#5A5751] italic">
        "Bear ye one another's burdens, and so fulfil the law of Christ." — Galatians 6:2 (KJV)
      </p>
      {err && <p className="text-xs text-[#991B1B]" role="alert">{err}</p>}
      <SectionTabs sections={sections} ariaLabel="Bus ministry sections" idBase="bus" />
    </div>
  );
}

// -----------------------------------------------------------------------------
// This Sunday — coverage + the driver's confirm + reminders that are due
// -----------------------------------------------------------------------------
function SundayPanel({ schedule, routes, reminders, canEdit, setErr, reportSkip }) {
  const sundays = useMemo(() => upcomingSundays(todayIso(), 6), []);
  const [date, setDate] = useState(sundays[0]);
  const cov = useMemo(() => coverageForDate(schedule, routes, date), [schedule, routes, date]);
  const myRows = useMemo(() => schedule.filter((s) => s.serviceDate === date && s.mine), [schedule, date]);
  const due = useMemo(() => dueReminders(reminders, todayIso()), [reminders]);
  const overdue = useMemo(() => overdueReminders(reminders, todayIso()), [reminders]);
  const [busy, setBusy] = useState(false);

  const publishReminders = async () => {
    const rows = schedule.filter((s) => s.serviceDate === date);
    const plan = buildReminderPlan(rows);
    if (!plan.length) { setErr('No assigned drivers to remind yet — assign drivers on the Schedule tab first.'); return; }
    setBusy(true);
    const r = await scheduleReminders(rows, {});
    setBusy(false);
    reportSkip(r);
  };

  return (
    <div className="space-y-4">
      <label className="block max-w-xs">
        <span className={LABEL}>Sunday</span>
        <select value={date} onChange={(e) => setDate(e.target.value)} className={FIELD}>
          {sundays.map((s) => <option key={s} value={s}>{fmtDate(s)}</option>)}
        </select>
      </label>

      {(overdue.length > 0) && (
        <div className="border border-[#991B1B] bg-[#FAF1EC] p-3">
          <p className="text-sm text-[#991B1B] font-medium">{overdue.length} reminder{overdue.length > 1 ? 's are' : ' is'} overdue.</p>
          <p className="text-xs text-[#5A5751]">These drivers should already have been reminded. Open the Reminders tab to send them.</p>
        </div>
      )}

      {/* Coverage per route */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h4 className="text-sm font-medium text-[#1A1815]">Coverage</h4>
          <span className={`text-xs ${cov.fullyCovered ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>
            {cov.assignedCount}/{cov.totalRoutes} routes · {cov.confirmedCount} confirmed
          </span>
        </div>
        {cov.routes.length === 0 && <p className="text-sm text-[#5A5751]">No routes set up yet. Add them on the Routes &amp; Vans tab.</p>}
        {cov.routes.map((c) => (
          <div key={c.scheduleId || c.routeId || c.routeName} className={`${CARD} flex items-baseline justify-between gap-2`}>
            <div>
              <div className="text-sm text-[#1A1815]">{c.routeName}{c.accessible ? ' (accessible)' : ''}</div>
              <div className="text-xs text-[#5A5751]">{c.assigned ? `${c.driverName}${c.vanName ? ` · ${c.vanName}` : ''}` : 'No driver yet'}</div>
            </div>
            <span className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border ${c.assigned ? (c.status === 'confirmed' ? 'border-[#5A6E3D] text-[#5A6E3D]' : 'border-[#C9BFA8] text-[#5A5751]') : 'border-[#B85838] text-[#B85838]'}`}>
              {c.assigned ? scheduleStatusLabel(c.status) : 'Open'}
            </span>
          </div>
        ))}
      </div>

      {/* The driver's own confirm/decline */}
      {myRows.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[#1A1815]">You're scheduled</h4>
          {myRows.map((r) => (
            <div key={r.id} className={`${CARD} space-y-1`}>
              <div className="text-sm text-[#1A1815]">{r.routeName || 'Route'} · {serviceWindow(r.arriveTime, r.endTime)}</div>
              <div className="flex gap-1.5">
                <button type="button" onClick={async () => reportSkip(await setScheduleStatus(r.id, 'confirmed'))} className={`${BTN} ${r.status === 'confirmed' ? 'bg-[#5A6E3D] text-white' : 'text-[#5A6E3D] border border-[#5A6E3D]'}`}>I'll be there</button>
                <button type="button" onClick={async () => reportSkip(await setScheduleStatus(r.id, 'declined'))} className={`${BTN} ${r.status === 'declined' ? 'bg-[#991B1B] text-white' : 'text-[#991B1B] border border-[#991B1B]'}`}>Can't make it</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="pt-2 border-t border-[#E8E4DC]">
          <button type="button" disabled={busy} onClick={publishReminders} className={`${BTN} bg-[#1A1815] text-white disabled:opacity-50`}>
            {busy ? 'Scheduling…' : `Send Thursday reminders for ${fmtDateShort(date)}`}
          </button>
          <p className="text-[0.625rem] text-[#5A5751] mt-1">Creates a reminder for each assigned driver, dated {fmtDateShort(remindSendOn(date))} (the Thursday before). This is the call that wasn't happening.</p>
          {due.length > 0 && <p className="text-xs text-[#B85838] mt-1">{due.length} reminder{due.length > 1 ? 's' : ''} due to send now — see the Reminders tab.</p>}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Schedule — assign a driver + van per route for a chosen Sunday
// -----------------------------------------------------------------------------
function SchedulePanel({ schedule, routes, vans, drivers, canEdit, reportSkip }) {
  const sundays = useMemo(() => upcomingSundays(todayIso(), 8), []);
  const [date, setDate] = useState(sundays[0]);
  const activeRoutes = useMemo(() => routes.filter((r) => r.active !== false).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)), [routes]);
  const rowsForDate = useMemo(() => schedule.filter((s) => s.serviceDate === date), [schedule, date]);
  const rowForRoute = (routeId) => rowsForDate.find((s) => s.routeId === routeId);

  const assign = async (route, driverId, vanId) => {
    const existing = rowForRoute(route.id);
    const driver = drivers.find((d) => d.id === driverId);
    const van = vans.find((v) => v.id === vanId);
    const row = {
      id: existing?.id,
      serviceDate: date,
      routeId: route.id,
      routeName: route.name,
      vanId: vanId || existing?.vanId || null,
      vanName: van?.name || existing?.vanName || null,
      driverId: driverId || null,
      driverUserId: driver?.userId || null,
      driverName: driver?.displayName || null,
      arriveTime: existing?.arriveTime || DEFAULT_ARRIVE,
      endTime: existing?.endTime || DEFAULT_END,
      status: driverId ? 'scheduled' : 'open',
    };
    reportSkip(await saveScheduleRow(row));
  };

  return (
    <div className="space-y-4">
      <label className="block max-w-xs">
        <span className={LABEL}>Sunday</span>
        <select value={date} onChange={(e) => setDate(e.target.value)} className={FIELD}>
          {sundays.map((s) => <option key={s} value={s}>{fmtDate(s)}</option>)}
        </select>
      </label>
      {!canEdit && <p className="text-xs text-[#5A5751]">Only the coordinator can change the schedule. This is {fmtDate(date)}.</p>}
      {activeRoutes.length === 0 && <p className="text-sm text-[#5A5751]">Add routes first (Routes &amp; Vans tab).</p>}
      {activeRoutes.map((route) => {
        const row = rowForRoute(route.id);
        return (
          <div key={route.id} className={`${CARD} space-y-2`}>
            <div className="text-sm text-[#1A1815]">{route.name}{route.accessible ? ' (accessible)' : ''}</div>
            {canEdit ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="block">
                  <span className={LABEL}>Driver</span>
                  <select value={row?.driverId || ''} onChange={(e) => assign(route, e.target.value, row?.vanId)} className={FIELD}>
                    <option value="">— open —</option>
                    {drivers.filter((d) => d.active !== false).map((d) => <option key={d.id} value={d.id}>{d.displayName}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className={LABEL}>Van</span>
                  <select value={row?.vanId || ''} onChange={(e) => assign(route, row?.driverId, e.target.value)} className={FIELD}>
                    <option value="">— none —</option>
                    {vans.filter((v) => v.active !== false).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </label>
              </div>
            ) : (
              <div className="text-xs text-[#5A5751]">{row?.driverName ? `${row.driverName}${row.vanName ? ` · ${row.vanName}` : ''} · ${scheduleStatusLabel(row.status)}` : 'Open'}</div>
            )}
            {canEdit && row && (
              <button type="button" onClick={async () => reportSkip(await removeScheduleRow(row.id))} className={`${BTN} text-[#991B1B] hover:underline`}>Clear</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Drivers roster
// -----------------------------------------------------------------------------
function RosterPanel({ drivers, canEdit, reportSkip, dmRoster }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ displayName: '', phone: '', email: '', role: 'driver' });
  const submit = async () => {
    if (!form.displayName.trim()) return;
    const r = await saveDriver(form);
    reportSkip(r);
    if (r?.saved) { setForm({ displayName: '', phone: '', email: '', role: 'driver' }); setAdding(false); }
  };
  return (
    <div className="space-y-3">
      {drivers.length === 0 && <p className="text-sm text-[#5A5751]">No drivers on the roster yet.{canEdit ? ' Add your drivers below — Deacon Anderson has ~4 every Sunday.' : ''}</p>}
      {drivers.map((d) => (
        <div key={d.id} className={`${CARD} flex items-baseline justify-between gap-2`}>
          <div>
            <div className="text-sm text-[#1A1815]">{d.displayName} <span className="text-[0.625rem] text-[#5A5751]">· {driverRoleLabel(d.role)}</span></div>
            <div className="text-xs text-[#5A5751]">
              {d.phone && <a href={`tel:${d.phone}`} className="hover:underline">{d.phone}</a>}
              {d.phone && d.email ? ' · ' : ''}
              {d.email && <a href={`mailto:${d.email}`} className="hover:underline">{d.email}</a>}
            </div>
          </div>
          {canEdit && <button type="button" onClick={async () => reportSkip(await removeDriver(d.id))} className={`${BTN} text-[#991B1B] hover:underline`}>Remove</button>}
        </div>
      ))}

      {canEdit && (adding ? (
        <div className={`${CARD} space-y-2`}>
          <label className="block"><span className={LABEL}>Name</span><input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className={FIELD} /></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block"><span className={LABEL}>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={FIELD} placeholder="217-555-0100" /></label>
            <label className="block"><span className={LABEL}>Email</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={FIELD} /></label>
          </div>
          <label className="block"><span className={LABEL}>Role</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={FIELD}>
              {DRIVER_ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <div className="flex gap-1.5">
            <button type="button" onClick={submit} className={`${BTN} bg-[#B85838] text-white`}>Save</button>
            <button type="button" onClick={() => setAdding(false)} className={`${BTN} text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>+ Add driver</button>
      ))}

      {dmRoster.length > 0 && (
        <div className="pt-3 border-t border-[#E8E4DC]">
          <DirectMessages roster={dmRoster} title="Message a driver 1:1" />
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Routes & Vans
// -----------------------------------------------------------------------------
function FleetPanel({ routes, vans, canEdit, reportSkip }) {
  const [routeForm, setRouteForm] = useState(null); // {name, area, accessible}
  const [vanForm, setVanForm] = useState(null);
  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h4 className="text-sm font-medium text-[#1A1815]">Routes</h4>
        {routes.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-[#5A5751]">No routes yet.</p>
            {canEdit && <button type="button" onClick={async () => reportSkip(await addStarterRoutes())} className={`${BTN} bg-[#1A1815] text-white`}>Add the 4 standard routes</button>}
          </div>
        )}
        {routes.map((r) => (
          <div key={r.id} className={`${CARD} flex items-baseline justify-between gap-2`}>
            <div><div className="text-sm text-[#1A1815]">{r.name}{r.accessible ? ' (accessible)' : ''}</div>{r.area && <div className="text-xs text-[#5A5751]">{r.area}</div>}</div>
            {canEdit && <button type="button" onClick={async () => reportSkip(await removeRoute(r.id))} className={`${BTN} text-[#991B1B] hover:underline`}>Remove</button>}
          </div>
        ))}
        {canEdit && (routeForm ? (
          <div className={`${CARD} space-y-2`}>
            <label className="block"><span className={LABEL}>Route name</span><input value={routeForm.name} onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} className={FIELD} /></label>
            <label className="block"><span className={LABEL}>Area</span><input value={routeForm.area} onChange={(e) => setRouteForm({ ...routeForm, area: e.target.value })} className={FIELD} /></label>
            <label className="flex items-center gap-2 text-sm text-[#1A1815]"><input type="checkbox" checked={!!routeForm.accessible} onChange={(e) => setRouteForm({ ...routeForm, accessible: e.target.checked })} /> Accessibility route</label>
            <div className="flex gap-1.5">
              <button type="button" onClick={async () => { const r = await saveRoute({ ...routeForm, sortOrder: routes.length + 1 }); reportSkip(r); if (r?.saved) setRouteForm(null); }} className={`${BTN} bg-[#B85838] text-white`}>Save</button>
              <button type="button" onClick={() => setRouteForm(null)} className={`${BTN} text-[#5A5751]`}>Cancel</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setRouteForm({ name: '', area: '', accessible: false })} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>+ Add route</button>
        ))}
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-medium text-[#1A1815]">Vans</h4>
        {vans.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-[#5A5751]">No vans yet.</p>
            {canEdit && <button type="button" onClick={async () => reportSkip(await addStarterVans())} className={`${BTN} bg-[#1A1815] text-white`}>Add the starter vans</button>}
          </div>
        )}
        {vans.map((v) => (
          <div key={v.id} className={`${CARD} flex items-baseline justify-between gap-2`}>
            <div><div className="text-sm text-[#1A1815]">{v.name}{v.accessible ? ' (accessible)' : ''}</div>{v.capacity && <div className="text-xs text-[#5A5751]">Seats {v.capacity}</div>}</div>
            {canEdit && <button type="button" onClick={async () => reportSkip(await removeVan(v.id))} className={`${BTN} text-[#991B1B] hover:underline`}>Remove</button>}
          </div>
        ))}
        {canEdit && (vanForm ? (
          <div className={`${CARD} space-y-2`}>
            <label className="block"><span className={LABEL}>Van name</span><input value={vanForm.name} onChange={(e) => setVanForm({ ...vanForm, name: e.target.value })} className={FIELD} /></label>
            <label className="block"><span className={LABEL}>Capacity</span><input type="number" value={vanForm.capacity} onChange={(e) => setVanForm({ ...vanForm, capacity: Number(e.target.value) })} className={FIELD} /></label>
            <label className="flex items-center gap-2 text-sm text-[#1A1815]"><input type="checkbox" checked={!!vanForm.accessible} onChange={(e) => setVanForm({ ...vanForm, accessible: e.target.checked })} /> Accessibility van</label>
            <div className="flex gap-1.5">
              <button type="button" onClick={async () => { const r = await saveVan(vanForm); reportSkip(r); if (r?.saved) setVanForm(null); }} className={`${BTN} bg-[#B85838] text-white`}>Save</button>
              <button type="button" onClick={() => setVanForm(null)} className={`${BTN} text-[#5A5751]`}>Cancel</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setVanForm({ name: '', capacity: 15, accessible: false })} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>+ Add van</button>
        ))}
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Reminders queue
// -----------------------------------------------------------------------------
function RemindersPanel({ reminders, canEdit, reportSkip }) {
  const today = todayIso();
  const sorted = useMemo(() => reminders.slice().sort((a, b) => String(a.sendOn).localeCompare(String(b.sendOn))), [reminders]);
  if (sorted.length === 0) return <p className="text-sm text-[#5A5751]">No reminders scheduled yet. Assign drivers, then tap "Send Thursday reminders" on the This Sunday tab.</p>;
  return (
    <div className="space-y-2">
      {sorted.map((r) => {
        const overdue = r.status === 'pending' && r.sendOn < today;
        const dueToday = r.status === 'pending' && r.sendOn === today;
        return (
          <div key={r.id} className={`${CARD} space-y-1 ${overdue ? 'border-[#991B1B]' : ''}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm text-[#1A1815]">{r.driverName}{r.routeName ? ` · ${r.routeName}` : ''}</span>
              <span className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border ${r.status === 'acknowledged' ? 'border-[#5A6E3D] text-[#5A6E3D]' : r.status === 'sent' ? 'border-[#C9BFA8] text-[#5A5751]' : overdue ? 'border-[#991B1B] text-[#991B1B]' : 'border-[#B85838] text-[#B85838]'}`}>
                {r.status}
              </span>
            </div>
            <div className="text-xs text-[#5A5751]">For {fmtDateShort(r.serviceDate)} · remind {fmtDateShort(r.sendOn)}{overdue ? ' (overdue)' : dueToday ? ' (today)' : ''}</div>
            <div className="flex gap-1.5">
              {canEdit && r.status === 'pending' && <button type="button" onClick={async () => reportSkip(await markReminderSent(r.id))} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>Mark sent</button>}
              {r.mine && r.status !== 'acknowledged' && <button type="button" onClick={async () => reportSkip(await acknowledgeReminder(r.id))} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>Got it</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Meetings — sovereign scheduling with load rules
// -----------------------------------------------------------------------------
function MeetingsPanel({ meetings, canEdit, reportSkip }) {
  const [form, setForm] = useState(null);
  const [violations, setViolations] = useState([]);
  const upcoming = useMemo(() => upcomingMeetings(meetings, Date.now()), [meetings]);

  const create = async () => {
    if (!form.title.trim() || !form.scheduledAt) return;
    let iso = null;
    try { iso = new Date(form.scheduledAt).toISOString(); } catch { /* invalid date stays null; load-check rejects it */ }
    // A main-space meeting is an admin/staff meeting, not a bus-ministry one.
    const ministry = form.space === 'main' ? null : 'bus';
    const r = await scheduleMeeting({ ...form, ministry, scheduledAt: iso }, meetings);
    if (r?.violations) { setViolations(r.violations); return; }
    setViolations([]);
    reportSkip(r);
    if (r?.saved) setForm(null);
  };

  return (
    <div className="space-y-4">
      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <p className="text-xs text-[#5A5751]">
          Sovereign PoeTech meetings — our own, on our on-site stack (the Synology NAS today; the 5&times;RTX&nbsp;3090 rig
          the infrastructure project is building). Two rooms, sized to that hardware: the <b>main meeting space</b> (admin
          staff &amp; monthly meetings, up to {spaceCap('main')} people — it takes the whole stack, so nothing else runs
          alongside it) and <b>ministry meetings</b> (working meetings, up to {spaceCap('ministry')}). "Count the cost,
          whether he have sufficient to finish it" (Luke 14:28).
        </p>
      </div>

      {upcoming.length === 0 && <p className="text-sm text-[#5A5751]">No meetings scheduled.</p>}
      {upcoming.map((m) => (
        <div key={m.id} className={`${CARD} space-y-1`}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-[#1A1815]">{m.title}</span>
            <span className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#C9BFA8] text-[#5A5751]">{meetingStatusLabel(m.status)}</span>
          </div>
          <div className="text-xs text-[#5A5751]">{meetingSpaceLabel(m.space)} · {meetingProviderLabel(m.provider)} · {m.hostName} · cap {m.participantCap}</div>
          <div className="text-xs text-[#5A5751]">{(() => { try { return new Date(m.scheduledAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return m.scheduledAt; } })()} · {m.durationMin} min</div>
          <div className="flex gap-1.5 pt-1">
            {m.joinUrl && <a href={m.joinUrl} target="_blank" rel="noreferrer" className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>Join</a>}
            {(m.mine || canEdit) && <button type="button" onClick={async () => reportSkip(await setMeetingStatus(m.id, 'ended'))} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>End</button>}
            {(m.mine || canEdit) && <button type="button" onClick={async () => reportSkip(await removeMeeting(m.id))} className={`${BTN} text-[#991B1B] hover:underline`}>Cancel</button>}
          </div>
        </div>
      ))}

      {form ? (
        <div className={`${CARD} space-y-2`}>
          <label className="block"><span className={LABEL}>Room</span>
            <select value={form.space} onChange={(e) => { const space = e.target.value; setForm({ ...form, space, participantCap: Math.min(form.participantCap, spaceCap(space)) }); }} className={FIELD}>
              <option value="ministry">{meetingSpaceLabel('ministry')} · up to {spaceCap('ministry')}</option>
              {canBookSpace('main', canEdit ? 'admin' : 'member') && <option value="main">{meetingSpaceLabel('main')} · up to {spaceCap('main')}</option>}
            </select>
          </label>
          <label className="block"><span className={LABEL}>Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={FIELD} placeholder={form.space === 'main' ? 'Monthly staff meeting' : 'Bus ministry sync'} /></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block"><span className={LABEL}>When</span><input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className={FIELD} /></label>
            <label className="block"><span className={LABEL}>Minutes</span><input type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} className={FIELD} /></label>
            <label className="block"><span className={LABEL}>Participant cap</span><input type="number" value={form.participantCap} onChange={(e) => setForm({ ...form, participantCap: Number(e.target.value) })} className={FIELD} /></label>
            <label className="block"><span className={LABEL}>Provider</span>
              <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className={FIELD}>
                {MEETING_PROVIDERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          </div>
          <label className="block"><span className={LABEL}>Join link (optional until the OBS engine lands)</span><input value={form.joinUrl} onChange={(e) => setForm({ ...form, joinUrl: e.target.value })} className={FIELD} placeholder="https://…" /></label>
          {violations.length > 0 && (
            <ul className="text-xs text-[#991B1B] list-disc pl-4">
              {violations.map((v) => <li key={v.rule}>{v.message}</li>)}
            </ul>
          )}
          <div className="flex gap-1.5">
            <button type="button" onClick={create} className={`${BTN} bg-[#B85838] text-white`}>Schedule</button>
            <button type="button" onClick={() => { setForm(null); setViolations([]); }} className={`${BTN} text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setForm({ space: 'ministry', title: '', scheduledAt: '', durationMin: 60, participantCap: 12, provider: 'poetech-obs', joinUrl: '' })} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>+ Schedule a meeting</button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Talk — group thread + 1:1 direct + report to security (nested sub-tabs)
// -----------------------------------------------------------------------------
function TalkPanel({ messages, reportSkip, dmRoster }) {
  const sub = [
    { id: 'group', label: 'Everyone', render: () => <GroupThread messages={messages} reportSkip={reportSkip} /> },
    { id: 'direct', label: 'Direct', render: () => <DirectMessages roster={dmRoster} title="Direct messages" /> },
    { id: 'security', label: 'Security', render: () => <SecurityPanel /> },
  ];
  return <SectionTabs sections={sub} ariaLabel="Message channels" idBase="bus-talk" variant="sub" />;
}

function GroupThread({ messages, reportSkip }) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const sorted = useMemo(() => messages.slice().sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))), [messages]);
  const send = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    const r = await sendBusMessage(draft);
    setBusy(false);
    if (r?.sent) setDraft(''); else reportSkip(r);
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-[#5A5751]">Everyone in the ministry sees this thread. "Let no corrupt communication proceed out of your mouth, but that which is good to the use of edifying" (Ephesians 4:29).</p>
      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 max-h-72 overflow-y-auto space-y-2" aria-live="polite">
        {sorted.length === 0 && <p className="text-xs text-[#5A5751]">No messages yet. Deacon Anderson can send the first word.</p>}
        {sorted.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium text-[#1A1815]">{m.displayName}:</span> <span className="text-[#1A1815]">{m.body}</span>
          </div>
        ))}
      </div>
      <label className="block">
        <span className={LABEL}>Message the whole ministry</span>
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className={FIELD} placeholder="Reminder: be here by 9:45 Sunday…" />
      </label>
      <div className="flex justify-end">
        <button type="button" disabled={busy || !draft.trim()} onClick={send} className={`${BTN} bg-[#B85838] text-white disabled:opacity-50`}>{busy ? 'Sending…' : 'Send to everyone'}</button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Requests — the dev/ops intake
// -----------------------------------------------------------------------------
function RequestsPanel({ requests, canEdit, reportSkip }) {
  const [form, setForm] = useState(null);
  const submit = async () => {
    if (!form.title.trim()) return;
    const r = await submitRequest(form);
    reportSkip(r);
    if (r?.saved) setForm(null);
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-[#5A5751]">Tell the build team what to add or change. Deacon Anderson: "tell me what more you need to add to it, and we'll do that."</p>
      {requests.length === 0 && <p className="text-sm text-[#5A5751]">No requests yet.</p>}
      {requests.map((q) => (
        <div key={q.id} className={`${CARD} space-y-1`}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-[#1A1815]">{q.title}</span>
            <span className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#C9BFA8] text-[#5A5751]">{requestStatusLabel(q.status)}</span>
          </div>
          {q.detail && <div className="text-xs text-[#5A5751]">{q.detail}</div>}
          <div className="text-[0.5625rem] text-[#5A5751]">{q.submitterName}{q.priority === 'high' ? ' · high priority' : ''}</div>
          {canEdit && (
            <label className="block pt-1">
              <span className={LABEL}>Status</span>
              <select value={q.status} onChange={async (e) => reportSkip(await updateRequest(q.id, { status: e.target.value }))} className={FIELD}>
                {REQUEST_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          )}
        </div>
      ))}
      {form ? (
        <div className={`${CARD} space-y-2`}>
          <label className="block"><span className={LABEL}>What do you need?</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={FIELD} placeholder="Text reminders, not just in-app" /></label>
          <label className="block"><span className={LABEL}>Details (optional)</span><textarea value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} rows={2} className={FIELD} /></label>
          <label className="flex items-center gap-2 text-sm text-[#1A1815]"><input type="checkbox" checked={form.priority === 'high'} onChange={(e) => setForm({ ...form, priority: e.target.checked ? 'high' : 'normal' })} /> High priority</label>
          <div className="flex gap-1.5">
            <button type="button" onClick={submit} className={`${BTN} bg-[#B85838] text-white`}>Submit</button>
            <button type="button" onClick={() => setForm(null)} className={`${BTN} text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setForm({ title: '', detail: '', priority: 'normal' })} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>+ New request</button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Rider request — how a church member (not a driver) asks for a ride. Shown to
// anyone who isn't on the ministry roster. Files a structured request the
// coordinator + drivers see; the rider tracks their own below.
// -----------------------------------------------------------------------------
function RiderRequestPanel({ myRequests, reportSkip }) {
  const sundays = useMemo(() => upcomingSundays(todayIso(), 6), []);
  const [form, setForm] = useState({
    riderName: '', riderPhone: '', pickupArea: '', pickupAddress: '',
    serviceDate: sundays[0] || '', passengers: 1, accessibleNeeded: false, notes: '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const v = validateRideRequest(form);
    setErrors(v.errors);
    if (!v.ok) return;
    setBusy(true);
    const r = await submitRideRequest(form);
    setBusy(false);
    reportSkip(r);
    if (r && r.saved) {
      setSent(true);
      setForm((f) => ({ ...f, pickupAddress: '', notes: '' }));
    }
  };

  return (
    <div className="space-y-3">
      <div className={CARD}>
        <h3 className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: 'Fraunces, serif' }}>Need a ride to church?</h3>
        <p className="text-xs text-[#5A5751] mt-1 mb-3">Send the bus/van ministry a ride request. Deacon Anderson and the drivers will see it and set your pickup.</p>
        {sent && <p className="text-xs text-[#3F5226] mb-2" role="status">Your ride request was sent. You'll see its status below — a driver will confirm your pickup.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={LABEL}>Your name</label>
            <input className={FIELD} value={form.riderName} onChange={(e) => set('riderName', e.target.value)} placeholder="First and last" />
            {errors.riderName && <p className="text-[0.6875rem] text-[#991B1B] mt-0.5">{errors.riderName}</p>}
          </div>
          <div>
            <label className={LABEL}>Phone (so a driver can reach you)</label>
            <input className={FIELD} value={form.riderPhone} onChange={(e) => set('riderPhone', e.target.value)} placeholder="(optional)" inputMode="tel" />
          </div>
          <div>
            <label className={LABEL}>Pickup area</label>
            <input className={FIELD} value={form.pickupArea} onChange={(e) => set('pickupArea', e.target.value)} placeholder="e.g. Urbana, Champaign south" />
            {errors.pickupArea && <p className="text-[0.6875rem] text-[#991B1B] mt-0.5">{errors.pickupArea}</p>}
          </div>
          <div>
            <label className={LABEL}>Pickup address</label>
            <input className={FIELD} value={form.pickupAddress} onChange={(e) => set('pickupAddress', e.target.value)} placeholder="Street address (optional)" />
          </div>
          <div>
            <label className={LABEL}>Which Sunday</label>
            <select className={FIELD} value={form.serviceDate} onChange={(e) => set('serviceDate', e.target.value)}>
              {sundays.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>How many riders</label>
            <input className={FIELD} type="number" min="1" value={form.passengers} onChange={(e) => set('passengers', e.target.value)} />
            {errors.passengers && <p className="text-[0.6875rem] text-[#991B1B] mt-0.5">{errors.passengers}</p>}
          </div>
        </div>
        <label className="flex items-center gap-2 mt-2 text-xs text-[#1A1815]">
          <input type="checkbox" checked={form.accessibleNeeded} onChange={(e) => set('accessibleNeeded', e.target.checked)} />
          I need the accessibility van (wheelchair / walker)
        </label>
        <div className="mt-2">
          <label className={LABEL}>Anything else</label>
          <textarea className={FIELD} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Number of steps, a helper coming, timing… (optional)" />
        </div>
        <button type="button" disabled={busy} onClick={submit} className={`${BTN} mt-3 bg-[#B85838] text-white hover:bg-[#1A1815] disabled:opacity-60`}>
          {busy ? 'Sending…' : 'Send ride request'}
        </button>
      </div>

      <div className={CARD}>
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">Your ride requests</div>
        {(!myRequests || myRequests.length === 0)
          ? <p className="text-sm text-[#5A5751]">No ride requests yet. Send one above and you'll track it here.</p>
          : (
            <ul className="space-y-2">
              {myRequests.map((r) => (
                <li key={r.id} className="border-l-2 border-[#E8E4DC] pl-3 py-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[#1A1815]">{fmtDateShort(r.serviceDate)} · {r.pickupArea || r.pickupAddress || 'pickup'}</span>
                    <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{rideRequestStatusLabel(r.status)}</span>
                  </div>
                  {r.assignedDriverName && <p className="text-[0.6875rem] text-[#3F5226]">Driver: {r.assignedDriverName}</p>}
                  {r.coordinatorNote && <p className="text-[0.6875rem] text-[#5A5751]">Note: {r.coordinatorNote}</p>}
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Ride requests inbox — what the coordinator + drivers see. Open ones first;
// the coordinator moves each along (seen / ride set / completed / declined),
// assigns a driver, and can leave a note the rider sees.
// -----------------------------------------------------------------------------
function RideRequestsPanel({ rideRequests, drivers, canEdit, reportSkip }) {
  const open = useMemo(() => (rideRequests || []).filter((r) => rideRequestOpen(r.status)), [rideRequests]);
  const closed = useMemo(() => (rideRequests || []).filter((r) => !rideRequestOpen(r.status)), [rideRequests]);

  const act = async (id, patch) => { const r = await updateRideRequest(id, patch); reportSkip(r); };

  const Card = ({ r }) => (
    <li className={CARD}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#1A1815]">{r.riderName}{r.passengers > 1 ? ` +${r.passengers - 1}` : ''}</p>
          <p className="text-[0.6875rem] text-[#5A5751]">
            {fmtDate(r.serviceDate)} · {[r.pickupArea, r.pickupAddress].filter(Boolean).join(' · ') || 'pickup TBD'}
            {r.accessibleNeeded ? ' · ♿ accessible van' : ''}
          </p>
          {r.riderPhone && <p className="text-[0.6875rem] text-[#5A5751]">☎ {r.riderPhone}</p>}
          {r.notes && <p className="text-[0.6875rem] text-[#5A5751] mt-0.5">{r.notes}</p>}
          {r.assignedDriverName && <p className="text-[0.6875rem] text-[#3F5226] mt-0.5">Driver: {r.assignedDriverName}</p>}
        </div>
        <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] whitespace-nowrap">{rideRequestStatusLabel(r.status)}</span>
      </div>
      {canEdit && (
        <div className="mt-2 space-y-2 border-t border-[#F0EDE6] pt-2">
          <div className="flex flex-wrap gap-1">
            {RIDE_REQUEST_STATUS.filter(([k]) => k !== r.status).map(([k, label]) => (
              <button key={k} type="button" onClick={() => act(r.id, { status: k })}
                className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#E8E4DC] text-[#1A1815] hover:border-[#B85838] hover:text-[#B85838]">
                {label}
              </button>
            ))}
          </div>
          {drivers && drivers.length > 0 && (
            <select className={FIELD} value="" onChange={(e) => {
              const d = drivers.find((x) => x.id === e.target.value);
              if (d) act(r.id, { assignedDriverId: d.id, assignedDriverName: d.displayName });
            }}>
              <option value="">Assign a driver…</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.displayName}</option>)}
            </select>
          )}
        </div>
      )}
    </li>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#1A1815]">
        {open.length === 0 ? 'No open ride requests right now.' : `${open.length} open ride request${open.length === 1 ? '' : 's'} — riders waiting on a pickup.`}
      </p>
      {open.length > 0 && <ul className="space-y-2">{open.map((r) => <Card key={r.id} r={r} />)}</ul>}
      {closed.length > 0 && (
        <details>
          <summary className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold cursor-pointer">Closed ({closed.length})</summary>
          <ul className="space-y-2 mt-2">{closed.map((r) => <Card key={r.id} r={r} />)}</ul>
        </details>
      )}
      {!canEdit && open.length + closed.length > 0 && <p className="text-[0.6875rem] text-[#5A5751]">Only the coordinator changes a request's status or assigns a driver.</p>}
    </div>
  );
}
