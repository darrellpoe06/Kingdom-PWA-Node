// =============================================================================
// PersonRecord — everything known about one person, in one fold on the Admin
//                roster (DR-0828)
// =============================================================================
// Darrell 2026-10-09: "Devices from this person... EIN... or MAC address...
// other device details... all of these are from this user." / "End to end
// comprehensive fields inside the database connects to what we needed from
// them and communicate etc..."
//
// Reads the real rows (person-record-sync.js) and shows the record
// person-record.js builds: who, the sign-in doors, the ways to reach them as
// real links, the devices seen, and what the cloud does NOT hold, said. A read
// that failed says so with its reason; nothing is painted (DR-0076).
// =============================================================================
import React, { useEffect, useState } from 'react';
import { buildPersonRecord } from '../lib/person-record.js';
import { loadPersonRows, loadSeatRows } from '../lib/person-record-sync.js';
import { listMyAdminInstances, listInstanceMembersStrict } from '../lib/member-roles.js';
import { loadInvites } from '../modules/properties/cloud.js';
import { fetchUserUsage } from '../lib/usage-events.js';
import { SEATS, seatsHeld, seatsWalked, seatsToWalk, apprenticeshipLine } from '../lib/apprenticeship.js';
import { relativeTime } from '../lib/access-metrics.js';

const serif = { fontFamily: '"Fraunces", Georgia, serif' };
const H = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold';

export default function PersonRecord({ instanceId, member, contactIndex = null }) {
  const [rows, setRows] = useState(null); // null = reading
  const userId = (member && member.userId) || '';
  useEffect(() => {
    let alive = true;
    setRows(null);
    loadPersonRows(instanceId, userId).then((r) => { if (alive) setRows(r); });
    return () => { alive = false; };
  }, [instanceId, userId]);
  // THE SEATS (DR-0842): held from the rows, walked from their opens.
  const [seats, setSeats] = useState(null);
  const email = (member && member.email) || '';
  useEffect(() => {
    let alive = true;
    setSeats(null);
    loadSeatRows(userId, email, { listMyAdminInstances, listInstanceMembersStrict, loadInvites, fetchUserUsage }).then((r) => { if (alive) setSeats(r); });
    return () => { alive = false; };
  }, [userId, email]);
  const held = seats ? seatsHeld({ userId, email }, seats) : [];
  const walked = seats ? seatsWalked(held, seats.usage || []) : [];
  const toWalk = seats ? seatsToWalk(held) : [];

  const rec = buildPersonRecord({
    member: member || {},
    contactIndex,
    dmDevices: rows && rows.dm.ok ? rows.dm.rows : [],
    presence: rows && rows.presence.ok ? rows.presence.rows : [],
    lanDevices: rows && rows.lan && rows.lan.ok ? rows.lan.rows : [],
  });
  const nowMs = Date.now();

  return (
    <div className="mt-1.5 border border-[#E8E4DC] bg-[#FAF8F4] p-2.5 space-y-2" data-testid="person-record">
      <div>
        <div className={H}>Everything on record for {rec.name || member.email || 'this person'}</div>
        <p className="text-[0.6875rem] text-[#5A5751]" style={serif} data-testid="person-record-summary">
          {rows === null ? 'Reading…' : rec.summary}
          {rec.nameNote ? ` · ${rec.nameNote}` : ''}
        </p>
      </div>

      <div>
        <div className={H}>Sign-in doors</div>
        {rec.doors.length === 0 ? (
          <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>No email or phone on record. Not a constraint.</p>
        ) : (
          <ul className="text-xs text-[#1A1815]" style={serif}>
            {rec.doors.map((d) => (
              <li key={d.kind + d.value} data-testid="person-record-door">{d.kind === 'email' ? 'Email' : 'Phone'} · {d.value} <span className="text-[#5A5751]">({d.source})</span></li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className={H}>Reach them</div>
        {rec.reach.length === 0 ? (
          <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>No way to reach them on record.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {rec.reach.map((r) => (
              <a key={r.kind} href={r.href} data-testid={`person-record-reach-${r.kind}`} className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#1A1815] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{r.label}</a>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className={H}>Devices seen, and LAN devices assigned to them in the register</div>
        {rows === null ? (
          <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>Reading…</p>
        ) : (
          <>
            {!rows.dm.ok && <p className="text-[0.6875rem] text-[#B85838]" style={serif} data-testid="person-record-dm-reason">Could not read their message devices: {rows.dm.reason}.</p>}
            {!rows.presence.ok && <p className="text-[0.6875rem] text-[#B85838]" style={serif} data-testid="person-record-presence-reason">Could not read where the app saw them: {rows.presence.reason}.</p>}
            {rows.lan && !rows.lan.ok && <p className="text-[0.6875rem] text-[#B85838]" style={serif} data-testid="person-record-lan-reason">Could not read the register for their LAN devices: {rows.lan.reason}.</p>}
            {rec.devices.length === 0 && rows.dm.ok && rows.presence.ok && (!rows.lan || rows.lan.ok) && (
              <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>No device has been seen for this person yet.</p>
            )}
            {rec.devices.length > 0 && (
              <ul className="text-xs text-[#1A1815] space-y-0.5" style={serif}>
                {rec.devices.map((d) => (
                  <li key={d.kind + d.id} data-testid="person-record-device">
                    {d.label} <span className="text-[#5A5751]">· {d.note} · {d.lastSeenAt ? `last seen ${relativeTime(d.lastSeenAt, nowMs)}` : 'last seen not recorded'}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div data-testid="person-record-seats">
        <div className={H}>Seats: what they hold, what they have walked, what is not yet theirs</div>
        {seats === null ? (
          <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>Reading their seats…</p>
        ) : (
          <>
            <p className="text-[0.6875rem] text-[#1A1815]" style={serif} data-testid="person-record-seats-line">{apprenticeshipLine(held, walked, seats.usage)}</p>
            {!seats.invitesOk ? <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>The Poe Properties invites could not be read from here, so a tenant, household, worker or manager seat may be missing below.</p> : null}
            {walked.length > 0 ? (
              <ul className="text-xs text-[#1A1815] space-y-0.5 mt-1" style={serif}>
                {walked.map((s) => {
                  const seat = SEATS.find((x) => x.key === s.key) || { label: s.key, does: [] };
                  return (
                    <li key={`${s.key}|${s.where}`} data-testid="person-record-seat" data-walked={s.walked ? 'true' : 'false'}>
                      <b>{seat.label}</b> · {s.where}{s.role && s.role !== s.key ? ` · ${s.role}` : ''}{s.claimed ? '' : ' · invited, not signed in yet'}
                      <span className="text-[#5A5751]"> · {seats.usage === null ? 'walked: not visible from here' : (s.walked ? `walked: ${s.opens} open${s.opens === 1 ? '' : 's'} in 30 days` : 'not walked yet')}</span>
                      <span className="block text-[0.625rem] text-[#5A5751]">what this seat does: {seat.does.join('; ')}</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {toWalk.length > 0 ? (
              <details className="mt-1">
                <summary className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] cursor-pointer focus:outline focus:outline-2 focus:outline-[#B85838]">Not yet theirs · {toWalk.length} seat{toWalk.length === 1 ? '' : 's'} to walk</summary>
                <ul className="text-[0.6875rem] text-[#5A5751] space-y-0.5 mt-1" style={serif}>
                  {toWalk.map((s) => <li key={s.key} data-testid="person-record-seat-next"><b className="text-[#1A1815]">{s.label}</b> ({s.where}) — {s.how}</li>)}
                </ul>
              </details>
            ) : null}
          </>
        )}
      </div>

      <div>
        <div className={H}>Not held in the cloud, on purpose</div>
        <ul className="text-[0.6875rem] text-[#5A5751] space-y-0.5" style={serif}>
          {rec.notHeld.map((n) => (
            <li key={n.what} data-testid="person-record-not-held"><b className="text-[#1A1815]">{n.what}</b> — {n.why}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
