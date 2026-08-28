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
import { QRCodeSVG } from 'qrcode.react';
import { buildPropertyTimeline, turnPhotos, latestAtDoor, doorEvents } from './timeline.js';
import {
  liveRooms, archivedRooms, buildRoom, seedRooms, archiveRoom, restoreRoom,
  roomBoard, unitSize, sizeChange, ROOM_KINDS, STARTER_SETS,
} from './rooms.js';
import { paymentLedger, gaps, discrepancies, accuracy, totals } from './payments.js';
import { buildEdit } from './staging.js';
import { applyUrl, applyUrlDisplay, cardCaption } from './apply-link.js';
import { isOwnHome } from './homes.js';
import { shelfOrder } from './showcase.js';
import { photoOrder, movePhoto, makeCover } from './photo-order.js';
import { compressImageFile, isLikelyImageFile } from '../../lib/image.js';

const ACCENT = '#2F5D50';

/** How far ahead a lease end reads as "coming available" rather than just rented. */
export const COMING_WINDOW_DAYS = 90;

/**
 * One word for a door's state, used by both views so they can never disagree.
 * "Coming" outranks "Rented" because it is the more useful truth to whoever is
 * looking — someone is in it now, and it opens on a date.
 */
export function statusWord(x) {
  // OUR OWN HOME OUTRANKS EVERYTHING. It is not available, not advertised and
  // not between tenants — it is where the family lives. Shipped without this
  // branch on 2026-08-27, so 2111 Talans Dr read "AVAILABLE - no rent on
  // record" on the live board with QR TO APPLY beside it, while the database
  // had said status = 'owner-occupied' the whole time (Darrell, 2026-08-28).
  if (x.ownHome) return 'Our home';
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
  notice: 'Notice', system: 'Mechanical',
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
/**
 * Move this square. Darrell, 2026-08-28: "Users should be able move the squares
 * to fit whatever Apt or home to showcase those at the time because of the
 * turnover of that property so people can see it first."
 *
 * Buttons rather than drag: HTML5 drag does not fire on touch at all, and a
 * long-press drag inside a scrolling grid fights the scroll — you reach for the
 * card and the page moves. These work one-handed, with a keyboard, and with a
 * screen reader. "First" is the turnover case in one tap instead of six.
 *
 * Rendered in both the grid and the list from ONE component, so the two views
 * cannot drift apart the way the card summary and the record did.
 */
function ArrangeControls({ id, index, total, onArrange, busy }) {
  if (!onArrange || total < 2) return null;
  const Nudge = ({ dir, label, disabled }) => (
    <button
      type="button"
      disabled={busy || disabled}
      onClick={(e) => { e.stopPropagation(); onArrange(dir === 0 ? { first: id } : { move: id, dir }); }}
      aria-label={label}
      title={label}
      className="text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[32px] border border-[#E8E4DC] bg-white text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] disabled:opacity-30"
    >{dir === 0 ? 'First' : dir < 0 ? '\u2190' : '\u2192'}</button>
  );
  return (
    <span className="flex items-center gap-1">
      <Nudge dir={-1} label="Move this property earlier" disabled={index === 0} />
      <Nudge dir={1} label="Move this property later" disabled={index === total - 1} />
      <Nudge dir={0} label="Show this property first" disabled={index === 0} />
    </span>
  );
}

export function DoorsBoard({
  rentals = [], tenancies = [], photos = [], canManage = false,
  onPick, onStart, onListing, onEditTenancy, onEditRental, onArrange, busy = false,
}) {
  const [openFor, setOpenFor] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editingDoor, setEditingDoor] = useState(null);
  const [qrFor, setQrFor] = useState(null);
  // Two views, because they answer different questions: the GRID is for
  // looking at the properties (an applicant, or the landlord picking which one
  // to photograph next), the LIST is for working them (status, rent, actions
  // legible in one column). Remembered per device — a preference, not state
  // anyone else should inherit, and a throw here must never blank the board.
  // GRID IS THE DEFAULT (Darrell, 2026-08-28: "I like the grid look as the
  // default"). A property list is a thing you look AT before it is a thing you
  // work: the pictures are how you tell 1508 HH from 1513 HH at a glance. The
  // stored preference still wins for anyone who chose list — changing the
  // default must not overrule a choice somebody already made.
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('poe-properties-view') === 'list' ? 'list' : 'grid'; } catch { return 'grid'; }
  });
  const pickView = (v) => {
    setView(v);
    try { localStorage.setItem('poe-properties-view', v); } catch { /* private window, or site data blocked */ }
  };

  // One cover per door: the picture the landlord placed FIRST if he has arranged
  // the gallery (0160, sort_order), else the newest LISTING shot, else the newest
  // of any kind. Photos are keyed by the rentals ID (uuid), not the slug.
  const coverByRental = useMemo(() => {
    const m = new Map();
    const so = (x) => (x.sort_order === null || x.sort_order === undefined ? null : Number(x.sort_order));
    for (const p of photos) {
      if (!p.rental_ref || p.archived_at) continue;
      const cur = m.get(p.rental_ref);
      const ps = so(p);
      const cs = cur ? so(cur) : null;
      const better = !cur
        // A placed picture is the cover over any unplaced one; the lowest placed wins.
        || (ps !== null && cs === null)
        || (ps !== null && cs !== null && ps < cs)
        // Neither placed: the old rule — a listing shot, then the newest.
        || (ps === null && cs === null && (
          (p.kind === 'listing' && cur.kind !== 'listing')
          || ((p.kind === 'listing') === (cur.kind === 'listing')
              && Date.parse(p.taken_at || p.uploaded_at || 0) > Date.parse(cur.taken_at || cur.uploaded_at || 0))));
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

  // THE LANDLORD'S OWN ARRANGEMENT (0157). "Users should be able move the
  // squares to fit whatever Apt or home to showcase those at the time because
  // of the turnover" (Darrell, 2026-08-28). shelfOrder is the same function the
  // public storefront sorts by, so what he arranges here is what a renter sees.
  const arranged = useMemo(() => shelfOrder(rentals), [rentals]);

  const rows = useMemo(() => arranged.map((r) => {
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
      // Ours, not offered. The predicate is homes.js, which is the same
      // sentence as public.rental_is_own_home() in 0156 — the database refuses
      // to publish anything this is true for, so the two cannot drift.
      ownHome: isOwnHome(r),
      cover: coverByRental.get(r.id) || null,
      photoCount: photos.filter((p) => p.rental_ref === r.id && !p.archived_at).length,
    };
  }), [arranged, activeByRef, coverByRental, photos]);

  // TWO LISTS, NOT ONE FILTERED VIEW. "not in the Properties tab because it's
  // not for renting... Real Estate keeps it just as our home and asset"
  // (Darrell, 2026-08-28). Dropping the home from this component entirely would
  // also drop its rooms, its photographs, its papers and its mechanical
  // history, which is the opposite of what was asked — so it keeps a place of
  // its own, below the doors, with none of the leasing machinery attached.
  const doorRows = rows.filter((x) => !x.ownHome);
  const homeRows = rows.filter((x) => x.ownHome);
  const rented = doorRows.filter((x) => x.rented).length;
  const coming = doorRows.filter((x) => x.comingSoon).length;

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
    <>
    {doorRows.length === 0 ? (
      <Card title="Your doors">
        <Empty>
          Nothing here is rented out. Everything on this account is our own — it is below, with its
          records intact.
        </Empty>
      </Card>
    ) : (
    <Card
      title={`Your doors (${doorRows.length})`}
      right={
        <span className="flex items-center gap-2">
          <span className="text-[0.6875rem] text-[#6B665E]">
            {rented} rented · {doorRows.length - rented} available{coming ? ` · ${coming} coming` : ''}
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
          {doorRows.map((x, i) => (
            <li key={x.rental.id} className="border border-[#E8E4DC] bg-white">
              <button
                type="button"
                // A DOOR WITH NO TENANT IS STILL A DOOR. This used to be
                // disabled unless a tenancy existed, and with zero tenancies on
                // the account that made every one of the twelve unselectable —
                // so Rooms, Pictures, Files and Door history had nothing to
                // show anybody. The rentals ID resolves the door on its own
                // (PropertiesApp resolves activeId against rentals.id).
                onClick={() => onPick?.(x.tenancy?.id || x.rental.id)}
                className="w-full text-left"
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
              {canManage && (
                <div className="px-2 pb-2 flex flex-wrap items-center gap-1">
                  <ArrangeControls id={x.rental.id} index={i} total={rows.length} onArrange={onArrange} busy={busy} />
                  <Btn onClick={() => setEditingDoor(editingDoor === x.rental.id ? null : x.rental.id)} disabled={busy}>
                    {editingDoor === x.rental.id ? 'Close' : 'Edit'}
                  </Btn>
                </div>
              )}
              {editingDoor === x.rental.id && (
                <div className="px-2 pb-2">
                  <EditRental
                    rental={x.rental} busy={busy}
                    onSave={(patch, summary) => { onEditRental?.(x.rental.id, patch, summary); setEditingDoor(null); }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {view === 'list' && (
      <ul>
        {doorRows.map((x, i) => (
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
                onClick={() => onPick?.(x.tenancy?.id || x.rental.id)}
                className="text-left flex-1 min-w-[10rem] hover:underline"
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
                <ArrangeControls id={x.rental.id} index={i} total={rows.length} onArrange={onArrange} busy={busy} />
              )}
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
                  <Btn onClick={() => setQrFor(qrFor === x.rental.id ? null : x.rental.id)} disabled={busy}>
                    {qrFor === x.rental.id ? 'Hide code' : 'QR to apply'}
                  </Btn>
                  <Btn onClick={() => onListing?.(x.rental, !x.listed)} disabled={busy}>
                    {x.listed ? 'Stop advertising' : 'Advertise'}
                  </Btn>
                  <Btn onClick={() => setOpenFor(openFor === x.rental.id ? null : x.rental.id)} disabled={busy}>
                    {openFor === x.rental.id ? 'Close' : 'Start a tenancy'}
                  </Btn>
                </div>
              )}
            </div>
            {qrFor === x.rental.id && <DoorQR rental={x.rental} label={x.label} />}
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
    )}
    {homeRows.length > 0 && (
      <OurHomes rows={homeRows} canManage={canManage} busy={busy} onPick={onPick} onEditRental={onEditRental} />
    )}
    </>
  );
}

/**
 * Our own homes. Everything the board gives a rental door EXCEPT the machinery
 * that offers it to somebody: no QR, no Advertise, no Start a tenancy, no
 * "available", no asking rent.
 *
 * Darrell, 2026-08-28: "2111 Talans Dr. is not a rental location it is our own
 * home only in books for our mortgage to be inside our books for showing
 * payments etc... not in the Properties tab because it's not for renting...
 * we still want to calculate the funds and other home ownership type things
 * like keeping a mechanical history of the system's and issues like all our
 * properties" — then: "Real Estate keeps it just as our home and asset."
 *
 * So the card says out loud where the money lives, because a person looking at
 * a house on a properties screen and seeing no rent, no mortgage and no value
 * would reasonably conclude the app had lost them.
 */
function OurHomes({ rows = [], canManage = false, busy = false, onPick, onEditRental }) {
  const [editingDoor, setEditingDoor] = useState(null);
  return (
    <Card
      title={`Our homes (${rows.length})`}
      right={<span className="text-[0.6875rem] text-[#6B665E]">not for rent</span>}
    >
      <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed mb-2">
        Where we live, not what we let. The mortgage, the payments and the asset value stay in
        Real&nbsp;Estate; the rooms, pictures, papers and mechanical history are here, the same as
        every other property.
      </p>
      <ul>
        {rows.map((x) => (
          <li key={x.rental.id} className="border-b border-[#F0EDE6] py-2 last:border-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="w-20 h-20 shrink-0 border border-[#E8E4DC] bg-[#FAF8F4] flex items-center justify-center overflow-hidden">
                {x.cover?.storage_path ? (
                  <img src={x.cover.storage_path} alt={x.cover.caption || x.label} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[0.5625rem] uppercase tracking-wider text-[#8A867E] text-center px-1">No photo</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onPick?.(x.rental.id)}
                className="text-left flex-1 min-w-[10rem] hover:underline"
              >
                <div className="text-[0.875rem] text-[#1A1815]">{x.label}</div>
                {x.address && <div className="text-[0.75rem] text-[#5A5751]">{x.address}</div>}
                <div className="text-[0.75rem] text-[#5A5751]">
                  <span className="uppercase tracking-wider text-[0.625rem] font-semibold" style={{ color: ACCENT }}>
                    {statusWord(x)}
                  </span>
                  {x.where ? ` · ${x.where}` : ''}
                  {x.photoCount > 0 ? ` · ${x.photoCount} photo${x.photoCount === 1 ? '' : 's'}` : ''}
                </div>
                <div className="text-[0.75rem] text-[#6B665E]">Mortgage and payments in Real Estate · records here</div>
              </button>
              {canManage && (
                <Btn onClick={() => setEditingDoor(editingDoor === x.rental.id ? null : x.rental.id)} disabled={busy}>
                  {editingDoor === x.rental.id ? 'Close' : 'Edit home'}
                </Btn>
              )}
            </div>
            {editingDoor === x.rental.id && (
              <EditRental
                rental={x.rental} busy={busy}
                onSave={(patch, summary) => { onEditRental?.(x.rental.id, patch, summary); setEditingDoor(null); }}
              />
            )}
          </li>
        ))}
      </ul>
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
    // Unset means WITHHELD (0158) — the safe reading is the default, so a door
    // nobody has thought about does not publish its street.
    address_visibility: rental.address_visibility || 'after-application',
    display_name: rental.display_name || '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const shortStay = f.offering === 'short-term' || f.offering === 'both';

  // Compare against the door as the FORM sees it: an unset offering displays as
  // "Lease only", so treating it as a change would write a field the landlord
  // never touched and light up Save the moment the editor opens.
  const before = useMemo(() => ({
    ...rental,
    offering: rental.offering || 'long-term',
    address_visibility: rental.address_visibility || 'after-application',
    display_name: rental.display_name || '',
  }), [rental]);
  const edit = useMemo(() => buildEdit(before, {
    ...f,
    // The database refuses a nightly rate on a door that is not offered short —
    // so clearing the offering clears the number rather than leaving one behind
    // that would one day be shown to somebody.
    nightly_rate: shortStay ? f.nightly_rate : '',
    min_stay_nights: shortStay ? f.min_stay_nights : '',
  }, [
    { key: 'display_name', label: 'Name' },
    { key: 'address', label: 'Address' },
    { key: 'unit', label: 'Unit' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'monthly_rent', label: 'Rent', numeric: true },
    { key: 'offering', label: 'Offered as' },
    { key: 'nightly_rate', label: 'Nightly rate', numeric: true },
    { key: 'min_stay_nights', label: 'Minimum stay', numeric: true },
    { key: 'address_visibility', label: 'Address on the public shelf' },
  ]), [before, f, shortStay]);

  const field = 'w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]';
  const lbl = 'block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1';

  return (
    <div className="mt-2 pl-2 border-l-2" style={{ borderColor: ACCENT }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* NAME. "change name and what the words say" (Darrell, 2026-08-28) —
            what a door is CALLED is his, not a label derived from its street. */}
        <label className="sm:col-span-2"><span className={lbl}>Name</span>
          <input type="text" className={field} value={f.display_name} onChange={set('display_name')} placeholder="What this door is called" />
        </label>
        <label className="sm:col-span-2"><span className={lbl}>Address</span>
          <input type="text" className={field} value={f.address} onChange={set('address')} />
        </label>
        {/* WHO MAY SEE THE STREET (0158). Measured 2026-08-28: the public
            listing had been publishing display_name — which IS the address on
            all twelve doors — under a sentence promising it was not. This is
            the control, per door, so it is never my decision again. */}
        <label className="sm:col-span-2"><span className={lbl}>Address on the public shelf</span>
          <select className={field} value={f.address_visibility} onChange={set('address_visibility')}>
            <option value="after-application">Shared when someone applies</option>
            <option value="public">Shown to anyone browsing</option>
          </select>
          <span className="block text-[0.75rem] text-[#6B665E] mt-1 leading-snug">
            {f.address_visibility === 'public'
              ? 'The street shows on the open shelf, to anyone, with no account.'
              : 'Browsers see the size, kind, town and rent \u2014 the street is handed over when they apply.'}
          </span>
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

/**
 * The card that goes in the window. Darrell, 2026-08-27: "Have a person scan a
 * qr code to apply for an open spot."
 *
 * It encodes a rental id and nothing else — see apply-link.js for why a printed
 * code must never carry a token. The address is shown to the LANDLORD here so
 * he knows which card he is printing; the code itself does not carry it.
 */
function DoorQR({ rental, label }) {
  const [copied, setCopied] = useState(false);
  const url = applyUrl(rental.id);
  const unitLabel = [rental.unit, rental.city].filter(Boolean).join(', ');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  };
  return (
    <div className="mt-2 pl-2 border-l-2" style={{ borderColor: ACCENT }}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="bg-white p-2 border border-[#E8E4DC]">
          <QRCodeSVG value={url} size={148} level="M" marginSize={2} />
        </div>
        <div className="min-w-[12rem] flex-1">
          <p className="text-[0.875rem] text-[#1A1815] leading-relaxed">{cardCaption(unitLabel || label)}</p>
          <p className="text-[0.75rem] text-[#5A5751] break-all mt-1">{applyUrlDisplay(rental.id)}</p>
          <p className="text-[0.75rem] text-[#6B665E] leading-relaxed mt-1">
            Print this and put it in the window. It opens the application for this unit with no
            account. If the unit is not advertised, or someone is living in it, the code says so
            instead — a card left up too long tells the truth rather than taking an application for
            somewhere gone.
          </p>
          <div className="mt-2">
            <Btn onClick={copy}>{copied ? 'Copied' : 'Copy the link'}</Btn>
          </div>
          <span aria-live="polite" className="sr-only">{copied ? 'Link copied' : ''}</span>
        </div>
      </div>
    </div>
  );
}

export const PHOTO_KINDS = Object.freeze([
  'listing', 'move-in-condition', 'move-out-condition', 'turn',
  'work-order-before', 'work-order-after', 'damage', 'inspection', 'document-scan',
]);

export const DOCUMENT_KINDS = Object.freeze([
  'lease', 'addendum', 'rules', 'notice', 'receipt', 'inspection',
  'insurance', 'w9', 'invoice', 'permit', 'correspondence', 'id-verification', 'other',
]);

/** Roughly what a data URL costs in the row, for an honest size warning. */
export function dataUrlBytes(dataUrl = '') {
  const i = String(dataUrl).indexOf(',');
  if (i === -1) return 0;
  return Math.round((String(dataUrl).length - i - 1) * 0.75);
}

/**
 * The property's pictures — the shape Darrell pointed at ("like MooreDivahs App
 * kind of"): an upload row, then a grid of cards, each editable in place
 * without re-uploading.
 *
 * The images are compressed data URLs, NOT the showcase bucket. That bucket is
 * public (getPublicUrl), and these are the insides of people's homes — a public
 * URL would walk straight past every RLS policy on property_photos. A data URL
 * lives in the row and inherits its policies for free. The cost is real and
 * bounded: ~80-250KB per photo after compression (C13).
 *
 * "Remove" archives. There is no DELETE grant, because a condition set exists
 * to settle an argument that can arrive long after somebody decided the picture
 * was clutter.
 */
export function GalleryTab({
  door, rooms = [], photos = [], canManage = false, busy = false, onAdd, onPatch,
}) {
  const [f, setF] = useState({ caption: '', kind: 'listing', roomId: '' });
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const live = useMemo(() => liveRooms(rooms), [rooms]);
  // In the landlord's arranged order (0160) — the first picture is the cover.
  const shown = useMemo(() => photoOrder(photos.filter((p) => !p.archived_at)), [photos]);

  // Reorder a picture: the pure model returns the patches, and this writes
  // exactly those (one for "cover", two for a nudge) through the same onPatch
  // that edits a caption. sort_order is not frozen by the 0154 trigger.
  const arrange = (intent) => {
    const { patches } = intent.cover
      ? makeCover(shown, intent.cover)
      : movePhoto(shown, intent.move, intent.dir);
    for (const p of patches) onPatch?.(p.id, p.patch);
  };

  const pick = async (file) => {
    setError('');
    if (!file) { setPending(null); return; }
    if (!isLikelyImageFile(file)) { setError('That does not look like an image.'); return; }
    try {
      const dataUrl = await compressImageFile(file);
      setPending({ dataUrl, bytes: dataUrlBytes(dataUrl), name: file.name });
    } catch (e) {
      // image.js rejects with a real Error, so this says what actually happened
      // rather than "unknown error" (the 2026-07-07 report class).
      setError(e.message || 'The image could not be read.');
      setPending(null);
    }
  };

  const submit = () => {
    if (!pending) { setError('Choose a picture first.'); return; }
    onAdd?.({
      instance_id: door?.instance_id,
      rental_ref: door?.id,
      room_id: f.roomId || null,
      kind: f.kind,
      caption: f.caption.trim(),
      storage_path: pending.dataUrl,
      taken_at: null,       // unknown unless a scanner read it from the EXIF
    });
    setPending(null);
    setF({ caption: '', kind: 'listing', roomId: '' });
  };

  const field = 'w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]';
  const lbl = 'block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1';
  const roomName = (id) => rooms.find((r) => r.id === id)?.name || null;

  return (
    <>
      {canManage && (
        <Card title="Add a picture">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="sm:col-span-2"><span className={lbl}>Picture</span>
              <input type="file" accept="image/*" className="text-[0.8125rem]" onChange={(e) => pick(e.target.files?.[0] || null)} />
            </label>
            <label className="sm:col-span-2"><span className={lbl}>Caption</span>
              <input type="text" className={field} value={f.caption} onChange={(e) => setF((p) => ({ ...p, caption: e.target.value }))} placeholder="What this shows" />
            </label>
            <label><span className={lbl}>What is it</span>
              <select className={field} value={f.kind} onChange={(e) => setF((p) => ({ ...p, kind: e.target.value }))}>
                {PHOTO_KINDS.map((k) => <option key={k} value={k}>{k.replace(/-/g, ' ')}</option>)}
              </select>
            </label>
            <label><span className={lbl}>Room</span>
              <select className={field} value={f.roomId} onChange={(e) => setF((p) => ({ ...p, roomId: e.target.value }))}>
                <option value="">Not a specific room</option>
                {live.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
          </div>
          {pending && (
            <p className="text-[0.8125rem] text-[#6B665E] mt-2">
              {pending.name} — about {Math.round(pending.bytes / 1024)}KB after compression.
            </p>
          )}
          {f.kind === 'listing' && (
            <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed mt-1">
              A <strong>listing</strong> picture is the only kind a stranger can ever see, and only while
              this door is advertised and free. Everything else stays inside the app.
            </p>
          )}
          {error && <p className="text-[0.8125rem] text-[#8C2F2F] mt-2">{error}</p>}
          <div className="mt-2">
            <Btn tone="primary" onClick={submit} disabled={busy || !pending}>Add to the gallery</Btn>
          </div>
        </Card>
      )}

      <Card title={`Pictures (${shown.length})`}>
        {shown.length === 0 ? (
          <Empty>No pictures on this property yet.</Empty>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {shown.map((p, idx) => (
              <li key={p.id} className="border border-[#E8E4DC] bg-white p-2">
                <div className="relative">
                  <img src={p.storage_path} alt={p.caption || p.kind} loading="lazy" className="aspect-square w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-[#2F5D50] text-white text-[0.625rem] uppercase tracking-wider px-1.5 py-0.5">Cover</span>
                  )}
                </div>
                {editing === p.id ? (
                  <PhotoEditor
                    photo={p} rooms={live} busy={busy}
                    onSave={(patch) => { onPatch?.(p.id, patch); setEditing(null); }}
                  />
                ) : (
                  <>
                    <div className="text-[0.8125rem] text-[#1A1815] mt-1 leading-snug">{p.caption || <em className="text-[#6B665E]">No caption</em>}</div>
                    <div className="text-[0.6875rem] text-[#6B665E]">
                      {p.kind.replace(/-/g, ' ')}{roomName(p.room_id) ? ` · ${roomName(p.room_id)}` : ''}
                    </div>
                    {canManage && (
                      <>
                        {shown.length > 1 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <Btn onClick={() => arrange({ cover: p.id })} disabled={busy || idx === 0}>Cover</Btn>
                            <Btn onClick={() => arrange({ move: p.id, dir: -1 })} disabled={busy || idx === 0} aria-label="Move earlier">←</Btn>
                            <Btn onClick={() => arrange({ move: p.id, dir: 1 })} disabled={busy || idx === shown.length - 1} aria-label="Move later">→</Btn>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Btn onClick={() => setEditing(p.id)} disabled={busy}>Edit</Btn>
                          <Btn
                            disabled={busy}
                            onClick={() => {
                              if (typeof window !== 'undefined'
                                && !window.confirm('Remove this from the gallery? It stays on the property’s record — nothing is deleted.')) return;
                              onPatch?.(p.id, { archived_at: new Date().toISOString() });
                            }}
                          >Remove</Btn>
                        </div>
                      </>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/** Correct what a picture SAYS. The picture itself is frozen by a trigger (0154). */
function PhotoEditor({ photo, rooms, onSave, busy }) {
  const [f, setF] = useState({ caption: photo.caption || '', kind: photo.kind, room_id: photo.room_id || '' });
  const edit = useMemo(() => buildEdit(
    { caption: photo.caption || '', kind: photo.kind, room_id: photo.room_id || '' },
    f,
    [{ key: 'caption', label: 'Caption' }, { key: 'kind', label: 'Kind' }, { key: 'room_id', label: 'Room' }],
  ), [photo, f]);
  const field = 'w-full border border-[#E8E4DC] px-1 py-1 text-[0.75rem] mt-1';
  return (
    <div className="mt-1">
      <input type="text" className={field} value={f.caption} onChange={(e) => setF((p) => ({ ...p, caption: e.target.value }))} placeholder="Caption" />
      <select className={field} value={f.kind} onChange={(e) => setF((p) => ({ ...p, kind: e.target.value }))}>
        {PHOTO_KINDS.map((k) => <option key={k} value={k}>{k.replace(/-/g, ' ')}</option>)}
      </select>
      <select className={field} value={f.room_id} onChange={(e) => setF((p) => ({ ...p, room_id: e.target.value }))}>
        <option value="">Not a specific room</option>
        {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      <p className="text-[0.625rem] text-[#6B665E] mt-1">The picture itself never changes — add a new one instead.</p>
      <div className="mt-1">
        <Btn tone="primary" disabled={busy || !edit.changed} onClick={() => onSave(edit.patch)}>Save</Btn>
      </div>
    </div>
  );
}

/**
 * The papers. Darrell, 2026-08-27: "add a location for uploading documents and
 * images like or other workflows."
 *
 * Kept separate from the generated-documents tab, which BUILDS a lease from the
 * door's records; this one HOLDS the ones that already exist — the signed lease,
 * a permit, an insurance certificate, a receipt, correspondence.
 *
 * Same storage decision as the gallery and for the same reason: a data URL in
 * the row inherits the row's RLS, and a tenant's lease is not something to put
 * behind a public URL. A PDF does not compress the way a photo does, so the
 * size is stated plainly before it is saved rather than discovered later.
 */
export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;

export function FilesTab({
  door, tenancies = [], documents = [], canManage = false, busy = false, onAdd, onPatch,
}) {
  const [f, setF] = useState({ title: '', kind: 'lease', note: '', tenancyId: '', effectiveOn: '' });
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const shown = useMemo(() => documents.filter((d) => !d.archived_at), [documents]);

  const pick = (file) => {
    setError('');
    if (!file) { setPending(null); return; }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError(`That file is ${Math.round(file.size / 1024 / 1024)}MB. The limit here is ${MAX_DOCUMENT_BYTES / 1024 / 1024}MB — a document lives in the record itself, so a very large scan would slow every read of this door.`);
      setPending(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPending({ dataUrl: e.target.result, bytes: file.size, name: file.name, type: file.type || '' });
    reader.onerror = () => { setError('The file could not be read from storage.'); setPending(null); };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!pending) { setError('Choose a file first.'); return; }
    const title = f.title.trim() || pending.name;
    onAdd?.({
      instance_id: door?.instance_id,
      rental_ref: door?.id,
      tenancy_id: f.tenancyId || null,
      kind: f.kind,
      title,
      note: f.note.trim(),
      storage_path: pending.dataUrl,
      mime_type: pending.type,
      byte_size: pending.bytes,
      effective_on: f.effectiveOn || null,
    });
    setPending(null);
    setF({ title: '', kind: 'lease', note: '', tenancyId: '', effectiveOn: '' });
  };

  const field = 'w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]';
  const lbl = 'block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1';
  const who = (id) => tenancies.find((t) => t.id === id);

  return (
    <>
      {canManage && (
        <Card title="Add a document">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="sm:col-span-2"><span className={lbl}>File</span>
              <input type="file" accept="application/pdf,image/*,.doc,.docx,.txt" className="text-[0.8125rem]" onChange={(e) => pick(e.target.files?.[0] || null)} />
            </label>
            <label><span className={lbl}>Title</span>
              <input type="text" className={field} value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} placeholder="Defaults to the file name" />
            </label>
            <label><span className={lbl}>What is it</span>
              <select className={field} value={f.kind} onChange={(e) => setF((p) => ({ ...p, kind: e.target.value }))}>
                {DOCUMENT_KINDS.map((k) => <option key={k} value={k}>{k.replace(/-/g, ' ')}</option>)}
              </select>
            </label>
            <label><span className={lbl}>Whose</span>
              <select className={field} value={f.tenancyId} onChange={(e) => setF((p) => ({ ...p, tenancyId: e.target.value }))}>
                {/* A door-level paper is management-only; a tenancy's paper
                    reaches that household, which is how a tenant reads their
                    own lease. The choice decides who can see it, so it says so. */}
                <option value="">The property (only management sees it)</option>
                {tenancies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tenant_name || 'Household not named'}{t.status === 'active' ? '' : ' (past)'}
                  </option>
                ))}
              </select>
            </label>
            <label><span className={lbl}>Effective</span>
              <input type="date" className={field} value={f.effectiveOn} onChange={(e) => setF((p) => ({ ...p, effectiveOn: e.target.value }))} />
            </label>
            <label className="sm:col-span-2"><span className={lbl}>Note</span>
              <input type="text" className={field} value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} />
            </label>
          </div>
          {pending && (
            <p className="text-[0.8125rem] text-[#6B665E] mt-2">
              {pending.name} — {Math.round(pending.bytes / 1024)}KB.
              {f.tenancyId ? ` ${who(f.tenancyId)?.tenant_name || 'That household'} will be able to read this.` : ' Only management will see this.'}
            </p>
          )}
          {error && <p className="text-[0.8125rem] text-[#8C2F2F] leading-relaxed mt-2">{error}</p>}
          <div className="mt-2"><Btn tone="primary" onClick={submit} disabled={busy || !pending}>Save the document</Btn></div>
        </Card>
      )}

      <Card title={`Documents (${shown.length})`}>
        {shown.length === 0 ? (
          <Empty>No documents on this property yet.</Empty>
        ) : (
          <ul className="space-y-2">
            {shown.map((d) => (
              <li key={d.id} className="border-b border-[#F0EDE6] pb-2 last:border-0">
                {editing === d.id ? (
                  <DocumentEditor document={d} busy={busy} onSave={(patch) => { onPatch?.(d.id, patch); setEditing(null); }} />
                ) : (
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="min-w-[12rem] flex-1">
                      <a href={d.storage_path} download={d.title} className="text-[0.875rem] text-[#1A1815] underline">{d.title}</a>
                      <div className="text-[0.6875rem] text-[#6B665E]">
                        {d.kind.replace(/-/g, ' ')}
                        {d.effective_on ? ` · effective ${d.effective_on}` : ''}
                        {d.byte_size ? ` · ${Math.round(d.byte_size / 1024)}KB` : ''}
                        {d.tenancy_id ? ` · ${who(d.tenancy_id)?.tenant_name || 'a household'}` : ' · the property'}
                      </div>
                      {d.note && <div className="text-[0.75rem] text-[#5A5751]">{d.note}</div>}
                    </div>
                    {canManage && (
                      <div className="flex flex-wrap gap-1">
                        <Btn onClick={() => setEditing(d.id)} disabled={busy}>Edit</Btn>
                        <Btn
                          disabled={busy}
                          onClick={() => {
                            if (typeof window !== 'undefined'
                              && !window.confirm(`Remove "${d.title}"? It stays on the property’s record — nothing is deleted.`)) return;
                            onPatch?.(d.id, { archived_at: new Date().toISOString() });
                          }}
                        >Remove</Btn>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function DocumentEditor({ document: doc, onSave, busy }) {
  const [f, setF] = useState({ title: doc.title, kind: doc.kind, note: doc.note || '', effective_on: doc.effective_on || '' });
  const edit = useMemo(() => buildEdit(doc, f, [
    { key: 'title', label: 'Title' }, { key: 'kind', label: 'Kind' },
    { key: 'note', label: 'Note' }, { key: 'effective_on', label: 'Effective' },
  ]), [doc, f]);
  const field = 'w-full border border-[#E8E4DC] px-2 py-1 text-[0.8125rem] mb-1';
  return (
    <div>
      <input type="text" className={field} value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} />
      <select className={field} value={f.kind} onChange={(e) => setF((p) => ({ ...p, kind: e.target.value }))}>
        {DOCUMENT_KINDS.map((k) => <option key={k} value={k}>{k.replace(/-/g, ' ')}</option>)}
      </select>
      <input type="date" className={field} value={f.effective_on} onChange={(e) => setF((p) => ({ ...p, effective_on: e.target.value }))} />
      <input type="text" className={field} value={f.note} onChange={(e) => setF((p) => ({ ...p, note: e.target.value }))} placeholder="Note" />
      <p className="text-[0.6875rem] text-[#6B665E]">The file itself never changes — upload a new one instead.</p>
      <Btn tone="primary" disabled={busy || !edit.changed} onClick={() => onSave(edit.patch)}>Save</Btn>
    </div>
  );
}
