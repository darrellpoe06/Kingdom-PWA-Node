// =============================================================================
// DoorTabs — the two surfaces the door's own records earned
// =============================================================================
// These live outside PropertiesApp.jsx so the workspace stays inside its
// monolith budget, and because they are the door's story rather than the
// person's inbox: the same two tabs would be right in any shell that mounts
// this module.
//
// REALITY-TRACE (DR-0061), stated before the code as the rule requires:
//   TimelineTab reads rental_tenancies (lease_start/lease_end/status),
//   property_photos, tenancy_notes/messages/requests/rent via buildHistory, and
//   the generated documents — all real rows, all RLS-scoped. Nothing painted:
//   a door with no tenancies says so, and an undated event says it is undated
//   rather than sorting to the top as "latest".
//   RoomsTab reads and writes property_rooms and reads property_photos. The
//   bed/bath figure is COUNTED from the rows on screen, so what the header
//   claims and what the list shows cannot disagree.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { buildPropertyTimeline, turnPhotos, latestAtDoor, doorEvents } from './timeline.js';
import {
  liveRooms, archivedRooms, buildRoom, seedRooms, archiveRoom, restoreRoom,
  roomBoard, unitSize, sizeChange, ROOM_KINDS, STARTER_SETS,
} from './rooms.js';
import { paymentLedger, gaps, discrepancies, accuracy, totals } from './payments.js';

const ACCENT = '#2F5D50';

const Btn = ({ children, onClick, tone = 'ghost', disabled, ...rest }) => (
  <button
    type="button" onClick={onClick} disabled={disabled}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40 ${
      tone === 'primary' ? 'bg-[#2F5D50] text-white border-[#2F5D50] hover:bg-[#1A1815] hover:border-[#1A1815]'
        : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
    {...rest}
  >{children}</button>
);

const Card = ({ title, children, right }) => (
  <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3">
    {(title || right) && (
      <div className="flex items-baseline justify-between gap-3 mb-2">
        {title && <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold" style={{ color: ACCENT }}>{title}</h3>}
        {right}
      </div>
    )}
    {children}
  </section>
);

const Empty = ({ children }) => (
  <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed">{children}</p>
);

const when = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'no date recorded');

const KIND_WORDS = {
  'move-in': 'Moved in', 'move-out': 'Moved out', photo: 'Photo', document: 'Document',
  note: 'Note', 'property-note': 'Landlord note', message: 'Message', rent: 'Rent',
  'work-order': 'Work order', 'work-order-closed': 'Work order closed', 'job-doc': 'Job documented',
  notice: 'Notice',
};

function EventRow({ e }) {
  return (
    <li className="border-l-2 pl-3 py-1.5" style={{ borderColor: e.undated || e.ms === null ? '#E8E4DC' : ACCENT }}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[0.625rem] uppercase tracking-wider font-semibold" style={{ color: ACCENT }}>
          {KIND_WORDS[e.kind] || e.kind}
        </span>
        <span className="text-[0.6875rem] text-[#6B665E]">{when(e.at)}</span>
        {e.datedByUpload && (
          <span className="text-[0.6875rem] text-[#6B665E] italic">(dated by upload — the camera recorded no time)</span>
        )}
        {e.who && <span className="text-[0.6875rem] text-[#6B665E]">· {e.who}</span>}
      </div>
      {e.summary && <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed">{e.summary}</p>}
    </li>
  );
}

/**
 * The door's chronology, newest first, across every tenancy it has held.
 * Chapters, not a flat feed — the turn between households is its own section
 * because that is where the condition photos live.
 */
export function TimelineTab({ tenancies = [], events = [], photos = [], docs = [], rent = [], expectedRent = null }) {
  // The ledger is bounded by the TENANCY, not by the records that happen to
  // exist — otherwise a month nobody filled in simply is not there, and the
  // gap the ledger was built to expose stays invisible on the one surface a
  // person actually reads. Found by walking this page as the landlord.
  const span = useMemo(() => {
    const active = tenancies.find((t) => !t.lease_end) || tenancies[0];
    const month = (v) => {
      const ms = Date.parse(v);
      if (!Number.isFinite(ms)) return null;
      const d = new Date(ms);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    };
    if (!active) return { from: null, to: null };
    // An open tenancy runs to today; a closed one to the month it ended.
    return { from: month(active.lease_start), to: month(active.lease_end) || month(new Date().toISOString()) };
  }, [tenancies]);
  const chapters = useMemo(
    () => buildPropertyTimeline({ tenancies, events, photos, docs }),
    [tenancies, events, photos, docs],
  );
  const stream = useMemo(
    () => doorEvents({ tenancies, events, photos, docs }),
    [tenancies, events, photos, docs],
  );
  const latest = useMemo(() => latestAtDoor(stream), [stream]);
  const ledger = useMemo(
    () => paymentLedger({ records: rent, expectedRent, from: span.from, to: span.to }),
    [rent, expectedRent, span],
  );
  const acc = useMemo(() => accuracy(ledger), [ledger]);
  const money = useMemo(() => totals(ledger), [ledger]);
  const issues = useMemo(() => discrepancies(ledger), [ledger]);
  const missing = useMemo(() => gaps(ledger), [ledger]);

  if (chapters.length === 0 && stream.length === 0) {
    return (
      <Card title="History">
        <Empty>
          Nothing has been recorded against this door yet — no tenancy, no note, no picture.
          This is empty because it is empty, not because something failed to load.
        </Empty>
      </Card>
    );
  }

  return (
    <>
      <Card title="Latest at this door">
        {stream.length === 0 ? <Empty>Nothing recorded yet.</Empty> : (
          <ul className="space-y-1.5">
            {[...latest.transitions, ...latest.documents, ...latest.notes].slice(0, 5).map((e) => (
              <EventRow key={`latest-${e.id}`} e={e} />
            ))}
          </ul>
        )}
      </Card>

      {ledger.length > 0 && (
        <Card title="Payment record" right={
          <span className="text-[0.6875rem] text-[#6B665E]">{money.basis}</span>
        }>
          <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed">
            ${money.paid.toFixed(2)} recorded against ${money.expected.toFixed(2)} expected.
          </p>
          {/* Unknown must never read as fine: the caveat rides with the total. */}
          {money.caveat && (
            <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed mt-1">{money.caveat}</p>
          )}
          {missing.length > 0 && (
            <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed mt-2">
              No record at all for: {missing.join(', ')}.
            </p>
          )}
          {issues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {issues.map((d, i) => (
                <li key={`disc-${d.period}-${d.kind}-${i}`} className="text-[0.8125rem] text-[#1A1815]">
                  <span className="uppercase tracking-wider text-[0.625rem] font-semibold" style={{ color: ACCENT }}>{d.period}</span>
                  {' '}{d.kind}{d.note ? ` — ${d.note}` : ''}
                </li>
              ))}
            </ul>
          )}
          {acc.complete && <p className="text-[0.8125rem] text-[#6B665E] mt-1">Every month in this ledger carries a confirmed payment.</p>}
        </Card>
      )}

      {chapters.map((c, i) => {
        if (c.type === 'turn') {
          const t = turnPhotos(c);
          return (
            <Card
              key={`turn-${i}`}
              title="Between tenants"
              right={<span className="text-[0.6875rem] text-[#6B665E]">{when(c.from)} → {when(c.to)}</span>}
            >
              <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed mb-2">
                {c.after ? `After ${c.after}, before ${c.before}.` : `Before ${c.before}.`}
                {' '}
                {t.complete
                  ? 'Both condition sets are on file — what was left, and what the next household walked into.'
                  : 'Only one side of the turn was photographed, so the pair a deposit argument needs is incomplete.'}
              </p>
              <ul className="space-y-1.5">{c.events.map((e) => <EventRow key={e.id} e={e} />)}</ul>
            </Card>
          );
        }
        if (c.type === 'unplaced') {
          return (
            <Card key="unplaced" title="Outside every tenancy">
              <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed mb-2">{c.reason}.</p>
              <ul className="space-y-1.5">{c.events.map((e) => <EventRow key={e.id} e={e} />)}</ul>
            </Card>
          );
        }
        return (
          <Card
            key={c.tenancyId || `chapter-${i}`}
            title={c.label}
            right={
              <span className="text-[0.6875rem] text-[#6B665E]">
                {c.undated ? 'no dates recorded' : `${when(c.movedIn)} → ${c.current ? 'still here' : when(c.movedOut)}`}
              </span>
            }
          >
            {c.events.length === 0
              ? <Empty>Nothing was recorded during this tenancy.</Empty>
              : <ul className="space-y-1.5">{c.events.map((e) => <EventRow key={e.id} e={e} />)}</ul>}
          </Card>
        );
      })}
    </>
  );
}

/**
 * Rooms. Adding one is a row, not a deploy — and the bed/bath figure in the
 * header is COUNTED from the list below it, so the two cannot disagree.
 */
export function RoomsTab({
  door, rooms = [], photos = [], canManage = false, onAdd, onPatch, busy = false,
}) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState('');
  const [error, setError] = useState('');

  const board = useMemo(() => roomBoard(rooms, photos), [rooms, photos]);
  const size = useMemo(() => unitSize(rooms), [rooms]);
  const live = useMemo(() => liveRooms(rooms), [rooms]);
  const archived = useMemo(() => archivedRooms(rooms), [rooms]);

  const preview = useMemo(() => {
    if (!name.trim()) return null;
    try {
      const next = buildRoom({ instanceId: door?.instance_id, rentalRef: door?.id, name, kind: kind || undefined }, rooms);
      return sizeChange(rooms, [...rooms, { ...next, id: '__preview__' }]);
    } catch { return null; }
  }, [name, kind, rooms, door]);

  const add = () => {
    setError('');
    try {
      const row = buildRoom({ instanceId: door?.instance_id, rentalRef: door?.id, name, kind: kind || undefined }, rooms);
      onAdd?.(row);
      setName('');
      setKind('');
    } catch (e) { setError(e.message); }
  };

  const remove = (room) => {
    setError('');
    try {
      const r = archiveRoom(room, { photos });
      if (typeof window !== 'undefined' && !window.confirm(r.statement)) return;
      onPatch?.(room.id, r.patch);
    } catch (e) { setError(e.message); }
  };

  const restore = (room) => {
    setError('');
    try { onPatch?.(room.id, restoreRoom(room, rooms)); } catch (e) { setError(e.message); }
  };

  return (
    <>
      <Card title="This unit" right={<span className="text-[0.6875rem] text-[#6B665E]">counted from the rooms</span>}>
        <p className="text-[0.9375rem] text-[#1A1815]">{size.label}</p>
        <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed mt-1">
          {live.length === 0
            ? 'No rooms recorded yet. Add them below, or start from a template — nothing here needs a code change.'
            : `${board.statement} Add a bedroom and this door becomes a ${size.bedrooms + 1}-bedroom everywhere it is shown, including its listing.`}
        </p>
        {canManage && live.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.keys(STARTER_SETS).map((t) => (
              <Btn key={t} onClick={() => seedRooms({ instanceId: door?.instance_id, rentalRef: door?.id, propertyType: t }, rooms).forEach((r) => onAdd?.(r))} disabled={busy}>
                Start from {t}
              </Btn>
            ))}
          </div>
        )}
      </Card>

      {canManage && (
        <Card title="Add a room">
          <div className="flex flex-wrap gap-2 items-end">
            <label className="flex-1 min-w-[10rem]">
              <span className="block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1">Name</span>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Bedroom 3"
                className="w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
              />
            </label>
            <label className="min-w-[8rem]">
              <span className="block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1">Kind</span>
              <select
                value={kind} onChange={(e) => setKind(e.target.value)}
                className="w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
              >
                <option value="">From the name</option>
                {ROOM_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
            <Btn tone="primary" onClick={add} disabled={busy || !name.trim()}>Add</Btn>
          </div>
          {preview?.changed && (
            <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed mt-2">{preview.statement}</p>
          )}
          {error && <p className="text-[0.8125rem] text-[#8C2F2F] leading-relaxed mt-2">{error}</p>}
        </Card>
      )}

      <Card title="Rooms">
        {board.rooms.length === 0 ? <Empty>No rooms yet.</Empty> : (
          <ul className="space-y-2">
            {board.rooms.map(({ room, count }) => (
              <li key={room.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E8E4DC] pb-2 last:border-0">
                <span className="text-[0.875rem] text-[#1A1815]">
                  {room.name}
                  <span className="text-[0.6875rem] text-[#6B665E]"> · {room.kind}</span>
                </span>
                <span className="text-[0.6875rem] text-[#6B665E]">
                  {count === 0 ? 'no photos' : `${count} photo${count === 1 ? '' : 's'}`}
                </span>
                {canManage && <Btn onClick={() => remove(room)} disabled={busy}>Remove</Btn>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {board.unfiled.length > 0 && (
        <Card title="Not yet in a room">
          <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed">
            {board.unfiled.length} picture{board.unfiled.length === 1 ? '' : 's'} at this door {board.unfiled.length === 1 ? 'is' : 'are'} not
            filed to a room. Shown here so the pile stays somebody&rsquo;s job.
          </p>
        </Card>
      )}

      {archived.length > 0 && (
        <Card title="Removed rooms">
          <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed mb-2">
            These are no longer offered when filing a picture. Their history stays on the record.
          </p>
          <ul className="space-y-2">
            {archived.map((room) => (
              <li key={room.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[0.875rem] text-[#6B665E]">{room.name}</span>
                {canManage && <Btn onClick={() => restore(room)} disabled={busy}>Put back</Btn>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
