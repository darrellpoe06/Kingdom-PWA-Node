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
import { buildEdit } from './staging.js';

const ACCENT = '#2F5D50';

/** How far ahead a lease end reads as "coming available" rather than just rented. */
export const COMING_WINDOW_DAYS = 90;

/**
 * One word for a door's state, used by both views so they can never disagree.
 * "Coming" outranks "Rented" because it is the more useful truth to whoever is
 * looking — someone is in it now, and it opens on a date.
 */
export function statusWord(x) {
  if (x.comingSoon) return x.daysOut === 0 ? 'Opens today' : `Opens in ${x.daysOut}d`;
  if (x.rented) return 'Rented';
  return x.listed ? 'Advertised' : 'Available';
}

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

/**
 * The landlord's own doors, and the way to put a tenant on one.
 *
 * THE DEFECT THIS CLOSES (measured 2026-08-27): the Doors tab listed
 * rental_tenancies only. With 12 rentals and zero tenancies, the owner opened
 * his own app to an empty screen — and because the role resolver needed a door
 * to call him an owner, he was shown a TENANT face. Nothing he owned was
 * reachable, and there was no path anywhere in the app to create the first
 * tenancy, so the emptiness was self-sustaining.
 *
 * A door with no tenancy is not a problem to hide; it is the next piece of work,
 * so it is listed as loudly as an occupied one.
 */
export function DoorsBoard({
  rentals = [], tenancies = [], photos = [], canManage = false,
  onPick, onStart, onListing, onEditTenancy, onEditRental, busy = false,
}) {
  const [openFor, setOpenFor] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editingDoor, setEditingDoor] = useState(null);
  // Two views, because they answer different questions: the GRID is for
  // looking at the properties (an applicant, or the landlord picking which one
  // to photograph next), the LIST is for working them (status, rent, actions
  // legible in one column). Remembered per device — a preference, not state
  // anyone else should inherit, and a throw here must never blank the board.
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('poe-properties-view') === 'grid' ? 'grid' : 'list'; } catch { return 'list'; }
  });
  const pickView = (v) => {
    setView(v);
    try { localStorage.setItem('poe-properties-view', v); } catch { /* private window, or site data blocked */ }
  };

  // One cover per door: the newest LISTING shot if there is one, else the newest
  // picture of any kind. Photos are keyed by the rentals ID (uuid), not the slug.
  const coverByRental = useMemo(() => {
    const m = new Map();
    for (const p of photos) {
      if (!p.rental_ref || p.archived_at) continue;
      const cur = m.get(p.rental_ref);
      const better = !cur
        || (p.kind === 'listing' && cur.kind !== 'listing')
        || (p.kind === 'listing' === (cur.kind === 'listing')
            && Date.parse(p.taken_at || p.uploaded_at || 0) > Date.parse(cur.taken_at || cur.uploaded_at || 0));
      if (better) m.set(p.rental_ref, p);
    }
    return m;
  }, [photos]);

  // Two keys, not interchangeable: tenancies carry the rentals SLUG, the newer
  // door tables carry the rentals ID. Match on slug here, because that is what
  // a tenancy actually holds.
  const activeByRef = useMemo(() => {
    const m = new Map();
    for (const t of tenancies) if (t.status === 'active') m.set(t.rental_ref, t);
    return m;
  }, [tenancies]);

  const rows = useMemo(() => rentals.map((r) => {
    const tenancy = activeByRef.get(r.slug) || null;
    // What it rents for: the tenancy's actual rent if occupied, otherwise the
    // asking rent, otherwise the door's own figure. Never invented — a door
    // with no rent anywhere says so rather than showing $0.
    const rent = Number(tenancy?.monthly_rent) || Number(r.listed_rent) || Number(r.monthly_rent) || 0;
    // "so people can see when an opening is available or not... or coming"
    // (Darrell). A lease with an end date inside the window is an opening the
    // family can already talk about. Past the end date it is not "coming" any
    // more — the tenancy is simply stale and says so rather than advertising.
    const endMs = tenancy?.lease_end ? Date.parse(tenancy.lease_end) : NaN;
    const daysOut = Number.isFinite(endMs) ? Math.ceil((endMs - Date.now()) / 86400000) : null;
    const comingSoon = daysOut !== null && daysOut >= 0 && daysOut <= COMING_WINDOW_DAYS;
    return {
      rental: r,
      tenancy,
      rented: Boolean(tenancy),
      comingSoon,
      daysOut,
      availableFrom: comingSoon ? tenancy.lease_end : null,
      listed: Boolean(r.listed_at),
      rent,
      label: [r.display_name || r.address, r.unit].filter(Boolean).join(' · ') || 'Unnamed door',
      // The ADDRESS is shown as its own line, not folded into a display name —
      // "see the properties and their addresses" (Darrell).
      address: [r.address, r.unit].filter(Boolean).join(', '),
      where: [r.city, r.state].filter(Boolean).join(', '),
      shortStay: r.offering === 'short-term' || r.offering === 'both',
      cover: coverByRental.get(r.id) || null,
      photoCount: photos.filter((p) => p.rental_ref === r.id && !p.archived_at).length,
    };
  }), [rentals, activeByRef, coverByRental, photos]);

  const rented = rows.filter((x) => x.rented).length;
  const coming = rows.filter((x) => x.comingSoon).length;

  if (rentals.length === 0) {
    return (
      <Card title="Your doors">
        <Empty>
          No properties are on your account yet. A door has to exist before a tenancy, a work order
          or an invitation can hang on it.
        </Empty>
      </Card>
    );
  }

  return (
    <Card
      title={`Your doors (${rentals.length})`}
      right={
        <span className="flex items-center gap-2">
          <span className="text-[0.6875rem] text-[#6B665E]">
            {rented} rented · {rentals.length - rented} available{coming ? ` · ${coming} coming` : ''}
          </span>
          <span className="flex gap-1">
            <Btn tone={view === 'list' ? 'primary' : 'ghost'} onClick={() => pickView('list')}>List</Btn>
            <Btn tone={view === 'grid' ? 'primary' : 'ghost'} onClick={() => pickView('grid')}>Grid</Btn>
          </span>
        </span>
      }
    >
      {view === 'grid' && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {rows.map((x) => (
            <li key={x.rental.id} className="border border-[#E8E4DC] bg-white">
              <button
                type="button"
                onClick={() => x.tenancy && onPick?.(x.tenancy.id)}
                disabled={!x.tenancy}
                className={`w-full text-left ${x.tenancy ? '' : 'cursor-default'}`}
              >
                <div className="aspect-square w-full bg-[#FAF8F4] flex items-center justify-center overflow-hidden">
                  {x.cover?.storage_path ? (
                    <img src={x.cover.storage_path} alt={x.cover.caption || x.label} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[0.5625rem] uppercase tracking-wider text-[#8A867E]">No photo</span>
                  )}
                </div>
                <div className="p-2">
                  <div className="text-[0.8125rem] text-[#1A1815] leading-snug">{x.label}</div>
                  {x.address && <div className="text-[0.6875rem] text-[#5A5751] leading-snug">{x.address}</div>}
                  <div className="text-[0.6875rem] mt-1">
                    <span className="uppercase tracking-wider text-[0.5625rem] font-semibold" style={{ color: ACCENT }}>
                      {statusWord(x)}
                    </span>
                    {x.rent > 0 ? ` · $${x.rent.toFixed(0)}/mo` : ' · no rent on record'}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {view === 'list' && (
      <ul>
        {rows.map((x) => (
          <li key={x.rental.id} className="border-b border-[#F0EDE6] py-2 last:border-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              {/* The picture, so the board reads like a property list and not a
                  spreadsheet. A door with none says so rather than showing a
                  stand-in photograph of somewhere else. */}
              <div className="w-20 h-20 shrink-0 border border-[#E8E4DC] bg-[#FAF8F4] flex items-center justify-center overflow-hidden">
                {x.cover?.storage_path ? (
                  <img
                    src={x.cover.storage_path} alt={x.cover.caption || x.label}
                    loading="lazy" className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[0.5625rem] uppercase tracking-wider text-[#8A867E] text-center px-1">No photo</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => x.tenancy && onPick?.(x.tenancy.id)}
                disabled={!x.tenancy}
                className={`text-left flex-1 min-w-[10rem] ${x.tenancy ? 'hover:underline' : 'cursor-default'}`}
              >
                <div className="text-[0.875rem] text-[#1A1815]">{x.label}</div>
                {x.address && <div className="text-[0.75rem] text-[#5A5751]">{x.address}</div>}
                <div className="text-[0.75rem] text-[#5A5751]">
                  {/* Rented or available, and the rent EITHER WAY — an occupied
                      door still tells you what these units go for. */}
                  <span className="uppercase tracking-wider text-[0.625rem] font-semibold" style={{ color: ACCENT }}>
                    {statusWord(x)}
                  </span>
                  {x.rent > 0 ? ` · $${x.rent.toFixed(0)}/mo` : ' · no rent on record'}
                  {x.where ? ` · ${x.where}` : ''}
                  {x.photoCount > 0 ? ` · ${x.photoCount} photo${x.photoCount === 1 ? '' : 's'}` : ''}
                  {x.shortStay ? ` · short stay${x.rental.nightly_rate ? ` $${Number(x.rental.nightly_rate).toFixed(0)}/night` : ''}` : ''}
                </div>
                <div className="text-[0.75rem] text-[#6B665E]">
                  {x.rented
                    ? (x.tenancy.tenant_name || 'Household not named in the record')
                    : 'No tenancy on this door'}
                </div>
              </button>

              {canManage && (
                <Btn onClick={() => setEditingDoor(editingDoor === x.rental.id ? null : x.rental.id)} disabled={busy}>
                  {editingDoor === x.rental.id ? 'Close' : 'Edit door'}
                </Btn>
              )}
              {canManage && x.rented && (
                <Btn onClick={() => setEditing(editing === x.tenancy.id ? null : x.tenancy.id)} disabled={busy}>
                  {editing === x.tenancy.id ? 'Close' : 'Edit tenant'}
                </Btn>
              )}
              {canManage && !x.rented && (
                <div className="flex flex-wrap gap-1">
                  <Btn onClick={() => onListing?.(x.rental, !x.listed)} disabled={busy}>
                    {x.listed ? 'Stop advertising' : 'Advertise'}
                  </Btn>
                  <Btn onClick={() => setOpenFor(openFor === x.rental.id ? null : x.rental.id)} disabled={busy}>
                    {openFor === x.rental.id ? 'Close' : 'Start a tenancy'}
                  </Btn>
                </div>
              )}
            </div>
            {editingDoor === x.rental.id && (
              <EditRental
                rental={x.rental} busy={busy}
                onSave={(patch, summary) => { onEditRental?.(x.rental.id, patch, summary); setEditingDoor(null); }}
              />
            )}
            {editing === x.tenancy?.id && x.tenancy && (
              <EditTenancy
                tenancy={x.tenancy} busy={busy}
                onSave={(patch, summary) => { onEditTenancy?.(x.tenancy.id, patch, summary); setEditing(null); }}
              />
            )}
            {openFor === x.rental.id && (
              <StartTenancy
                rental={x.rental} busy={busy}
                onStart={(input) => { onStart?.(input); setOpenFor(null); }}
              />
            )}
          </li>
        ))}
      </ul>
      )}
    </Card>
  );
}

/**
 * Put a tenant on a door. The rent prefills from the door's OWN record — real
 * data, not a guess — and the name may be left blank, because 1003 Koehn's
 * household genuinely is not named in the family's sheet. A blank name then
 * demands a reason, so it reads later as a decision rather than an oversight.
 */
function StartTenancy({ rental, onStart, busy }) {
  const [f, setF] = useState({
    tenantName: '', tenantPhone: '', tenantEmail: '',
    leaseStart: '', monthlyRent: Number(rental?.monthly_rent) > 0 ? String(rental.monthly_rent) : '',
    subsidised: false,
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const named = f.tenantName.trim().length > 0;

  const field = 'w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]';
  const lbl = 'block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1';

  return (
    <div className="mt-2 pl-2 border-l-2" style={{ borderColor: ACCENT }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label><span className={lbl}>Tenant name</span>
          <input type="text" className={field} value={f.tenantName} onChange={set('tenantName')} placeholder="Leave blank if the record does not name them" />
        </label>
        <label><span className={lbl}>Rent</span>
          <input type="text" inputMode="decimal" className={field} value={f.monthlyRent} onChange={set('monthlyRent')} />
        </label>
        <label><span className={lbl}>Cell phone</span>
          <input type="tel" className={field} value={f.tenantPhone} onChange={set('tenantPhone')} placeholder="How you will invite them" />
        </label>
        <label><span className={lbl}>Email</span>
          <input type="email" className={field} value={f.tenantEmail} onChange={set('tenantEmail')} />
        </label>
        <label><span className={lbl}>Lease start</span>
          <input type="date" className={field} value={f.leaseStart} onChange={set('leaseStart')} />
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input type="checkbox" checked={f.subsidised} onChange={set('subsidised')} className="w-4 h-4" />
          <span className="text-[0.8125rem] text-[#1A1815]">Subsidised (Section 8 / voucher)</span>
        </label>
      </div>

      {/* No gate on a blank name. Put in what is known and let it be edited
          (Darrell, 2026-08-27) — an earlier version demanded a written reason
          before it would accept a blank, which is friction on the way IN where
          EDITABLE-EVERYWHERE puts the answer on the way OUT. */}
      {!named && (
        <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed mt-2">
          No name yet is fine — the tenancy is saved with everything you do have, and every field
          here stays editable. A blank stays blank; it is never filled in with &ldquo;Unknown&rdquo;.
        </p>
      )}

      <div className="mt-2">
        <Btn tone="primary" disabled={busy} onClick={() => onStart({ ...f, rental })}>
          Start the tenancy
        </Btn>
      </div>
    </div>
  );
}

/**
 * Correct a tenancy in place (IN-PLACE-FIRST: the content comes to you, you do
 * not get moved to it). Every field here is one somebody may need to fix later
 * — a name that was blank when the tenancy started, a rent that changed, a
 * lease end that got agreed. The change is described in words and kept on the
 * tenancy's own note thread, because an edit nobody can see is how two people
 * end up disagreeing about what the lease said.
 */
function EditTenancy({ tenancy, onSave, busy }) {
  const [f, setF] = useState({
    tenant_name: tenancy.tenant_name || '',
    tenant_phone: tenancy.tenant_phone || '',
    tenant_email: tenancy.tenant_email || '',
    monthly_rent: tenancy.monthly_rent ?? '',
    lease_start: tenancy.lease_start || '',
    lease_end: tenancy.lease_end || '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const edit = useMemo(() => buildEdit(tenancy, f, [
    { key: 'tenant_name', label: 'Tenant' },
    { key: 'tenant_phone', label: 'Phone' },
    { key: 'tenant_email', label: 'Email' },
    { key: 'monthly_rent', label: 'Rent', numeric: true },
    { key: 'lease_start', label: 'Lease start' },
    { key: 'lease_end', label: 'Lease end' },
  ]), [tenancy, f]);

  const field = 'w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]';
  const lbl = 'block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1';

  return (
    <div className="mt-2 pl-2 border-l-2" style={{ borderColor: ACCENT }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label><span className={lbl}>Tenant name</span>
          <input type="text" className={field} value={f.tenant_name} onChange={set('tenant_name')} placeholder="Blank if the record does not name them" />
        </label>
        <label><span className={lbl}>Rent</span>
          <input type="text" inputMode="decimal" className={field} value={f.monthly_rent} onChange={set('monthly_rent')} />
        </label>
        <label><span className={lbl}>Cell phone</span>
          <input type="tel" className={field} value={f.tenant_phone} onChange={set('tenant_phone')} />
        </label>
        <label><span className={lbl}>Email</span>
          <input type="email" className={field} value={f.tenant_email} onChange={set('tenant_email')} />
        </label>
        <label><span className={lbl}>Lease start</span>
          <input type="date" className={field} value={f.lease_start} onChange={set('lease_start')} />
        </label>
        <label><span className={lbl}>Lease end</span>
          <input type="date" className={field} value={f.lease_end} onChange={set('lease_end')} />
          <span className="block text-[0.6875rem] text-[#6B665E] mt-1">
            Setting this makes the door read &ldquo;coming available&rdquo; as the date nears.
          </span>
        </label>
      </div>
      {edit.changed && (
        <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed mt-2">{edit.summary}</p>
      )}
      <div className="mt-2">
        <Btn tone="primary" disabled={busy || !edit.changed} onClick={() => onSave(edit.patch, edit.summary)}>
          {edit.changed ? 'Save the change' : 'Nothing changed'}
        </Btn>
      </div>
    </div>
  );
}

/** What a door can be offered as. 'long-term' is the unstated default. */
export const OFFERINGS = Object.freeze([
  { key: 'long-term', label: 'Lease only' },
  { key: 'short-term', label: 'Short stay only' },
  { key: 'both', label: 'Lease or short stay' },
]);

/**
 * Edit the DOOR itself — the unit label, the address, the rent, and what it is
 * offered as.
 *
 * The unit label matters more than it looks. All four 805 North Prospect rows
 * carry unit = NULL, so nothing in the data can tell which one a person calls
 * Apt 2 — and Apt 2 is the one Darrell offers as a short stay. That is the
 * single piece of this feature only he holds, so the app hands him the field
 * instead of guessing, and every other door is untouched.
 */
function EditRental({ rental, onSave, busy }) {
  const [f, setF] = useState({
    address: rental.address || '',
    unit: rental.unit || '',
    city: rental.city || '',
    state: rental.state || '',
    monthly_rent: rental.monthly_rent ?? '',
    offering: rental.offering || 'long-term',
    nightly_rate: rental.nightly_rate ?? '',
    min_stay_nights: rental.min_stay_nights ?? '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const shortStay = f.offering === 'short-term' || f.offering === 'both';

  // Compare against the door as the FORM sees it: an unset offering displays as
  // "Lease only", so treating it as a change would write a field the landlord
  // never touched and light up Save the moment the editor opens.
  const before = useMemo(() => ({ ...rental, offering: rental.offering || 'long-term' }), [rental]);
  const edit = useMemo(() => buildEdit(before, {
    ...f,
    // The database refuses a nightly rate on a door that is not offered short —
    // so clearing the offering clears the number rather than leaving one behind
    // that would one day be shown to somebody.
    nightly_rate: shortStay ? f.nightly_rate : '',
    min_stay_nights: shortStay ? f.min_stay_nights : '',
  }, [
    { key: 'address', label: 'Address' },
    { key: 'unit', label: 'Unit' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'monthly_rent', label: 'Rent', numeric: true },
    { key: 'offering', label: 'Offered as' },
    { key: 'nightly_rate', label: 'Nightly rate', numeric: true },
    { key: 'min_stay_nights', label: 'Minimum stay', numeric: true },
  ]), [before, f, shortStay]);

  const field = 'w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]';
  const lbl = 'block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1';

  return (
    <div className="mt-2 pl-2 border-l-2" style={{ borderColor: ACCENT }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="sm:col-span-2"><span className={lbl}>Address</span>
          <input type="text" className={field} value={f.address} onChange={set('address')} />
        </label>
        <label><span className={lbl}>Unit</span>
          <input type="text" className={field} value={f.unit} onChange={set('unit')} placeholder="e.g. Apt 2" />
        </label>
        <label><span className={lbl}>Rent</span>
          <input type="text" inputMode="decimal" className={field} value={f.monthly_rent} onChange={set('monthly_rent')} />
        </label>
        <label><span className={lbl}>City</span>
          <input type="text" className={field} value={f.city} onChange={set('city')} />
        </label>
        <label><span className={lbl}>State</span>
          <input type="text" className={field} value={f.state} onChange={set('state')} />
        </label>
        <label className="sm:col-span-2"><span className={lbl}>Offered as</span>
          <select className={field} value={f.offering} onChange={set('offering')}>
            {OFFERINGS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </label>
        {shortStay && (
          <>
            <label><span className={lbl}>Nightly rate</span>
              <input type="text" inputMode="decimal" className={field} value={f.nightly_rate} onChange={set('nightly_rate')} />
            </label>
            <label><span className={lbl}>Minimum stay (nights)</span>
              <input type="text" inputMode="numeric" className={field} value={f.min_stay_nights} onChange={set('min_stay_nights')} />
            </label>
          </>
        )}
      </div>
      {edit.changed && <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed mt-2">{edit.summary}</p>}
      <div className="mt-2">
        <Btn tone="primary" disabled={busy || !edit.changed} onClick={() => onSave(edit.patch, edit.summary)}>
          {edit.changed ? 'Save the change' : 'Nothing changed'}
        </Btn>
      </div>
    </div>
  );
}
