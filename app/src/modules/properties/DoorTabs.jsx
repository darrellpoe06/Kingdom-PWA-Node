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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { buildPropertyTimeline, turnPhotos, latestAtDoor, doorEvents } from './timeline.js';
import { cadenceChoice } from './cadence.js';
import {
  liveRooms, archivedRooms, buildRoom, seedRooms, archiveRoom, restoreRoom,
  roomBoard, unitSize, sizeChange, ROOM_KINDS, STARTER_SETS,
} from './rooms.js';
import { paymentLedger, gaps, discrepancies, accuracy, totals } from './payments.js';
import { buildEdit } from './staging.js';
import { applyUrl, applyUrlDisplay, cardCaption } from './apply-link.js';
import { isOwnHome } from './homes.js';
import { shelfOrder, doorLabel } from './showcase.js';
import { sameApartment } from './apartment.js';
import { moneyLine, dollarsLong } from './door-money.js';
import { AreaEditor } from './AreaMap.jsx';
import { buildingOptions, pickedBuilding, formatAddress } from './address.js';
import { fetchChannels, hasBridgeToken, nasRoad, fetchChannelPhotos, fetchLibrary, fetchListingPhoto, fetchLibraryPhoto, nasSource, nasLibrarySource, thisMonth } from '../../lib/nas-photos.js';
import { stampImage, stampFileName } from '../../lib/brand-stamp.js';
import SharpPicture, { sharpestKnown } from './SharpPicture.jsx';
import { photoOrder, movePhoto, makeCover, pickCovers } from './photo-order.js';
import { compressImageFile, isLikelyImageFile } from '../../lib/image.js';
import { mergePictureNames, isNewPictureName } from '../../lib/work-order-pictures.js';
import { NAMES_OPS } from './picture-names.js';
import { useVoiceDictation } from '../../lib/voice-dictation.js';
import Lightbox from '../../components/Lightbox.jsx';
import { useDocumentViewer } from '../../components/DocumentViewer.jsx';
import { propertyDocRecord, shelfReport } from '../../lib/document-record.js';
import ReportActions from '../../components/ReportActions.jsx';
import ShelfLedger from '../../components/ShelfLedger.jsx';

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
        {title && <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50]">{title}</h3>}
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
  notice: 'Notice', system: 'Mechanical', change: 'Change',
};

function EventRow({ e }) {
  return (
    <li className="border-l-2 pl-3 py-1.5" style={{ borderColor: e.undated || e.ms === null ? '#E8E4DC' : ACCENT }}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[0.625rem] uppercase tracking-wider font-semibold text-[#2F5D50]">
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
                  <span className="uppercase tracking-wider text-[0.625rem] font-semibold text-[#2F5D50]">{d.period}</span>
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

/**
 * A new door, in the words the editor already uses (DR-1007). Six fields,
 * the address required; the rest can be filled from Edit afterwards. The
 * result line says exactly what happened — saved, or why not.
 */
export function AddDoor({ onAdd, busy = false, open = false }) {
  const [f, setF] = useState({ address: '', unit: '', city: '', state: '', property_type: 'single-family', monthly_rent: '' });
  const [said, setSaid] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const field = 'w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]';
  const lbl = 'block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1';
  if (!open) return null;
  const submit = async (e) => {
    e.preventDefault();
    if (!f.address.trim()) { setSaid('The address is the one thing a door needs.'); return; }
    setSaving(true);
    const r = await onAdd?.({
      address: f.address, unit: f.unit, city: f.city, state: f.state,
      propertyType: f.property_type, monthlyRent: f.monthly_rent,
    });
    setSaving(false);
    if (r && r.ok) { setSaid('Saved. The door is on your board.'); setF({ address: '', unit: '', city: '', state: '', property_type: 'single-family', monthly_rent: '' }); }
    else setSaid(`Not saved: ${(r && r.reason) || 'unknown'}`);
  };
  return (
    <form onSubmit={submit} className="mt-3 pl-2 border-l-2" style={{ borderColor: ACCENT }} data-testid="add-door">
      <p className="text-[0.8125rem] text-[#1A1815] mb-2">Add a door</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="sm:col-span-2"><span className={lbl}>Street address</span>
          <input type="text" className={field} value={f.address} onChange={set('address')} placeholder="12 Elm Street" aria-label="Street address" required />
        </label>
        <label><span className={lbl}>Unit</span>
          <input type="text" className={field} value={f.unit} onChange={set('unit')} placeholder="Apt 2 (if any)" aria-label="Unit" />
        </label>
        <label><span className={lbl}>What it is</span>
          <select className={field} value={f.property_type} onChange={set('property_type')} aria-label="What it is">
            <option value="single-family">Single-family</option>
            <option value="duplex">Duplex</option>
            <option value="multi-family">Multi-family</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
          </select>
        </label>
        <label><span className={lbl}>City</span>
          <input type="text" className={field} value={f.city} onChange={set('city')} aria-label="City" />
        </label>
        <label><span className={lbl}>State</span>
          <input type="text" className={field} value={f.state} onChange={set('state')} aria-label="State" />
        </label>
        <label><span className={lbl}>Monthly rent</span>
          <input type="number" inputMode="decimal" min="0" className={field} value={f.monthly_rent} onChange={set('monthly_rent')} aria-label="Monthly rent" />
        </label>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Btn tone="primary" type="submit" disabled={busy || saving} onClick={undefined} data-testid="add-door-save">{saving ? 'Saving…' : 'Add this door'}</Btn>
        {said && <span className="text-[0.75rem] text-[#6B665E]" data-testid="add-door-said" aria-live="polite">{said}</span>}
      </div>
    </form>
  );
}

export function DoorsBoard({
  rentals = [], tenancies = [], photos = [], canManage = false,
  // Each door's own order of the apartment pictures it borrows (DR-0984):
  // {rental_id: {photo_id: position}}. Bed B's card leads with its choice.
  photoOrders = {},
  // The family's known buildings (for the address dropdown) and each door's
  // picture archive on the NAS, {rental_id: channel} (DR-0999).
  knownBuildings = [], archives = {},
  onPick, onStart, onListing, onEditTenancy, onEditRental, onArrange, busy = false,
  // A new door on the account (DR-1007): the owner's hand, null for anyone else.
  onAddRental = null,
  // What each door has brought in (DR-0903, door_money_months): moneyByDoor's
  // result. Shown on the family's board only; null hides it.
  money = null,
  // The full image by id (DR-0931): covers sharpen past their thumbnail.
  loadImage = null, loadThumb = null,
}) {
  const [openFor, setOpenFor] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editingDoor, setEditingDoor] = useState(null);
  const [qrFor, setQrFor] = useState(null);
  const [adding, setAdding] = useState(false);
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
  // The choice is pure (photo-order.js pickCovers) and needs only metadata, so
  // the list this receives carries thumbnails, never full images (0185).
  const coverByRental = useMemo(() => pickCovers(photos), [photos]);

  // Two keys, not interchangeable: tenancies carry the rentals SLUG, the newer
  // door tables carry the rentals ID. Match on slug here, because that is what
  // a tenancy actually holds.
  const activeByRef = useMemo(() => {
    const m = new Map();
    // The door's current record: the active tenancy, or else the unit's own
    // pending record (DR-0870), so a pick lands on the record its messages
    // and work live on (2026-10-10, "Message Didn't save").
    for (const t of tenancies) if (t.status === 'pending' && !m.has(t.rental_ref)) m.set(t.rental_ref, t);
    for (const t of tenancies) if (t.status === 'active') m.set(t.rental_ref, t);
    return m;
  }, [tenancies]);

  // THE LANDLORD'S OWN ARRANGEMENT (0157). "Users should be able move the
  // squares to fit whatever Apt or home to showcase those at the time because
  // of the turnover" (Darrell, 2026-08-28). shelfOrder is the same function the
  // public storefront sorts by, so what he arranges here is what a renter sees.
  const arranged = useMemo(() => shelfOrder(rentals), [rentals]);

  // THE APARTMENT'S PICTURES, ON THE BOARD TOO (DR-0980). Darrell, 2026-10-12,
  // Bed B reading "NO PHOTO" beside Bed A's 37: "Why don't the images show up
  // for apartment 4 B?" and "If the Apartment field is the same?!" The door's
  // own Pictures tab (DR-0963) and the public card (0278) already borrow from a
  // door in the same apartment; the board was the one place that did not. Same
  // rule, same function: same instance, same street, same apartment NUMBER,
  // never a whole place with no unit. Its own pictures always come first.
  const apartmentOf = useCallback((r) => arranged.filter((o) => o.id !== r.id
    && o.instance_id === r.instance_id && sameApartment(o, r)), [arranged]);
  const rows = useMemo(() => arranged.map((r) => {
    const tenancy = activeByRef.get(r.slug) || null;
    // What it rents for: the tenancy's actual rent if occupied, otherwise the
    // door's own figure, otherwise the price it was advertised at. Never
    // invented — a door with no rent anywhere says so rather than showing $0.
    //
    // THE EDITABLE FIGURE WINS (2026-10-27). This read `listed_rent` before
    // `r.monthly_rent`, and `listed_rent` is a copy frozen when the door was
    // first advertised that NO screen can edit. So editing the rent on an
    // advertised door changed nothing anyone could see: "the $750 will not
    // update to $1000 even after saving it" (Darrell, 805 North Prospect Apt
    // 4). When the two disagree, the one the owner can actually type in is by
    // definition the newer intent. staging.js advertisedPriceFollows now keeps
    // them in step on every save; this order is what tells the truth about the
    // doors that already drifted, without rewriting anybody's data.
    const rent = Number(tenancy?.monthly_rent) || Number(r.monthly_rent) || Number(r.listed_rent) || 0;
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
      // An empty unit's own pending record (nobody named, DR-0870) is not a
      // rental: the door stays Available / Advertised.
      rented: Boolean(tenancy) && !(tenancy.status === 'pending' && !tenancy.tenant_name && !tenancy.tenant_user_id),
      comingSoon,
      daysOut,
      availableFrom: comingSoon ? tenancy.lease_end : null,
      listed: Boolean(r.listed_at),
      rent,
      label: doorLabel(r),
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
      // WHAT A VISITOR WOULD SEE ON THE CARD (DR-1199): only 'listing' shots
      // reach the public shelf (public_vacancy_photos). An advertised door
      // with none is advertised with a blank card, and the board says so.
      listingShots: photos.filter((p) => p.rental_ref === r.id && !p.archived_at && p.kind === 'listing').length,
      ...(() => {
        if (coverByRental.get(r.id)) return { sharedCount: 0, sharedFrom: '' };
        const sibs = apartmentOf(r);
        const withCover = sibs.find((o) => coverByRental.get(o.id));
        const ids = new Set(sibs.map((o) => o.id));
        const borrowed = photos.filter((p) => ids.has(p.rental_ref) && !p.archived_at);
        // THIS DOOR'S OWN COVER of the apartment, when it chose one (DR-0984):
        // Bed B's card leads with the bedroom while Bed A's leads with its own.
        const mine = photoOrders[r.id] || {};
        const chosenCover = borrowed
          .filter((p) => mine[p.id] !== undefined && mine[p.id] !== null)
          .sort((a, b) => mine[a.id] - mine[b.id])[0] || null;
        const cover = chosenCover || (withCover ? coverByRental.get(withCover.id) : null);
        return cover
          ? { cover, sharedCount: borrowed.length, sharedFrom: r.unit || withCover?.unit || 'this apartment' }
          : { sharedCount: 0, sharedFrom: '' };
      })(),
    };
  }), [arranged, activeByRef, coverByRental, photos, apartmentOf, photoOrders]);

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
        {/* THE FIRST DOOR (DR-1007): a landlord who just got their own space
            met this sentence and nothing to do about it. The form is right
            here, open, because it is the only next step there is. */}
        {canManage && onAddRental && <AddDoor onAdd={onAddRental} busy={busy} open />}
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
            {canManage && onAddRental && (
              <Btn tone={adding ? 'primary' : 'ghost'} onClick={() => setAdding((a) => !a)} data-testid="add-door-toggle">{adding ? 'Close' : 'Add a door'}</Btn>
            )}
            <Btn tone={view === 'list' ? 'primary' : 'ghost'} onClick={() => pickView('list')}>List</Btn>
            <Btn tone={view === 'grid' ? 'primary' : 'ghost'} onClick={() => pickView('grid')}>Grid</Btn>
          </span>
        </span>
      }
    >
      {adding && canManage && onAddRental && (
        <AddDoor onAdd={async (f) => { const r = await onAddRental(f); if (r && r.ok) setAdding(false); return r; }} busy={busy} open />
      )}
      {money && (
        // THE WHOLE PORTFOLIO, by what each asset has actually brought in —
        // confirmed money only; a reported payment is named, never added.
        <p className="text-[0.8125rem] text-[#1A1815] mb-2" data-testid="portfolio-money">
          {money.doorsWithMoney === 0
            ? 'No money is recorded on any door yet. Record it on a door\u2019s Rent tab, tenant or no tenant.'
            : `${dollarsLong(money.received)} brought in across ${money.doorsWithMoney} door${money.doorsWithMoney === 1 ? '' : 's'} \u00b7 ${dollarsLong(money.thisYear)} this year${money.awaiting > 0 ? ` \u00b7 ${dollarsLong(money.awaiting)} reported, not yet confirmed` : ''}`}
        </p>
      )}
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
                  {x.cover ? (
                    <SharpPicture photo={x.cover} loadImage={loadImage} loadThumb={loadThumb} alt={x.cover.caption || x.label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[0.5625rem] uppercase tracking-wider text-[#8A867E]">No photo</span>
                  )}
                </div>
                <div className="p-2">
                  <div className="text-[0.8125rem] text-[#1A1815] leading-snug">{x.label}</div>
                  {x.address && <div className="text-[0.6875rem] text-[#5A5751] leading-snug">{x.address}</div>}
                  <div className="text-[0.6875rem] mt-1">
                    <span className="uppercase tracking-wider text-[0.5625rem] font-semibold text-[#2F5D50]">
                      {statusWord(x)}
                    </span>
                    {x.rent > 0 ? ` · $${x.rent.toFixed(0)}/mo` : ' · no rent on record'}
                  </div>
                  {money && (
                    <div className="text-[0.6875rem] text-[#1A1815] mt-0.5" data-testid="door-card-money">
                      {moneyLine(money.doors.get(x.rental.id))}
                    </div>
                  )}
                </div>
              </button>
              {x.listed && !x.rented && x.listingShots === 0 && (
                <p className="px-2 pb-1 text-[0.6875rem] text-[#9E4A2A] leading-snug" role="status" data-testid="listing-no-pictures">
                  Advertised with no listing pictures: visitors see this door&rsquo;s card with no picture on it. In Pictures, file or re-mark the shots you want shown as &ldquo;Listing&rdquo;.
                </p>
              )}
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
                  <EditRental knownBuildings={knownBuildings} archive={archives?.[x.rental.id] || ''}
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
                  stand-in photograph of somewhere else.

                  "NO PHOTO" IS A FACT ABOUT THE DOOR, NOT ABOUT THE READ
                  (DR-0955). This asked `listImage(x.cover)` — do the bytes
                  happen to be in hand — which meant a door whose only
                  pictures predate 0185 read as having none, and which with
                  thumbnails out of the list would have made EVERY cover on
                  this board say "No photo" for good. pickCovers chose a cover
                  from metadata; whether its bytes have landed yet is
                  SharpPicture's business and it draws a waiting tile while it
                  finds out. */}
              <div className="w-20 h-20 shrink-0 border border-[#E8E4DC] bg-[#FAF8F4] flex items-center justify-center overflow-hidden">
                {x.cover ? (
                  <SharpPicture photo={x.cover} loadImage={loadImage} loadThumb={loadThumb} alt={x.cover.caption || x.label} className="w-full h-full object-cover" />
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
                  <span className="uppercase tracking-wider text-[0.625rem] font-semibold text-[#2F5D50]">
                    {statusWord(x)}
                  </span>
                  {x.rent > 0 ? ` · $${x.rent.toFixed(0)}/mo` : ' · no rent on record'}
                  {x.where ? ` · ${x.where}` : ''}
                  {x.photoCount > 0 ? ` · ${x.photoCount} photo${x.photoCount === 1 ? '' : 's'}` : x.sharedCount > 0 ? ` · ${x.sharedCount} photo${x.sharedCount === 1 ? '' : 's'} shared with ${x.sharedFrom}` : ''}
                  {x.shortStay ? ` · short stay${x.rental.nightly_rate ? ` $${Number(x.rental.nightly_rate).toFixed(0)}/night` : ''}` : ''}
                </div>
                {money && (
                  <div className="text-[0.75rem] text-[#1A1815]" data-testid="door-card-money">
                    {moneyLine(money.doors.get(x.rental.id))}
                  </div>
                )}
                <div className="text-[0.75rem] text-[#6B665E]">
                  {x.rented
                    ? (x.tenancy.tenant_name || 'Household not named in the record')
                    : x.tenancy ? 'Empty \u2014 its record keeps the work and messages' : 'No tenancy on this door'}
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
            {x.listed && !x.rented && x.listingShots === 0 && (
              <p className="mt-1 text-[0.75rem] text-[#9E4A2A] leading-snug" role="status" data-testid="listing-no-pictures">
                Advertised with no listing pictures: visitors see this door&rsquo;s card with no picture on it. In Pictures, file or re-mark the shots you want shown as &ldquo;Listing&rdquo;.
              </p>
            )}
            {qrFor === x.rental.id && <DoorQR rental={x.rental} label={x.label} />}
            {editingDoor === x.rental.id && (
              <EditRental knownBuildings={knownBuildings} archive={archives?.[x.rental.id] || ''}
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
      <OurHomes rows={homeRows} canManage={canManage} busy={busy} onPick={onPick} onEditRental={onEditRental} loadImage={loadImage} loadThumb={loadThumb} knownBuildings={knownBuildings} archives={archives} />
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
function OurHomes({ rows = [], canManage = false, busy = false, onPick, onEditRental, loadImage = null, loadThumb = null, knownBuildings = [], archives = {} }) {
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
                {x.cover ? (
                  <SharpPicture photo={x.cover} loadImage={loadImage} loadThumb={loadThumb} alt={x.cover.caption || x.label} className="w-full h-full object-cover" />
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
                  <span className="uppercase tracking-wider text-[0.625rem] font-semibold text-[#2F5D50]">
                    {statusWord(x)}
                  </span>
                  {x.where ? ` · ${x.where}` : ''}
                  {x.photoCount > 0 ? ` · ${x.photoCount} photo${x.photoCount === 1 ? '' : 's'}` : x.sharedCount > 0 ? ` · ${x.sharedCount} photo${x.sharedCount === 1 ? '' : 's'} shared with ${x.sharedFrom}` : ''}
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
              <EditRental knownBuildings={knownBuildings} archive={archives?.[x.rental.id] || ''}
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
// UTILITIES ARE THE FAMILY'S TO SAY, ON EVERY DOOR (DR-1020). Darrell,
// 2026-10-14: "All utilities paid for the shared room tenants... single person
// renting a whole unit pays their own utilities"; "Currently... it may change
// in the future... however we eat that cost." Until now utilities_included was
// written only by the co-living split (true on every room and bed) and no
// editor could change it or say it on a whole unit. Three words, three states.
export const UTILITIES_WORDS = Object.freeze({ paid: 'all paid', tenant: 'tenant pays' });
export function utilitiesWord(v) { return v === true ? UTILITIES_WORDS.paid : v === false ? UTILITIES_WORDS.tenant : ''; }
// WHO SEES THIS DOOR'S LISTING PICTURES (DR-1199, 0309). A word on the form,
// a boolean on the row; ON unless the family holds them. The database decides
// what a tenant reads — this is only the family's hand on the switch.
export const PICTURES_WORDS = Object.freeze({ shared: 'Its tenant and household see them', held: 'Only the family sees them' });
export function picturesWord(v) { return v === false ? PICTURES_WORDS.held : PICTURES_WORDS.shared; }
export function picturesValue(word) { return word !== PICTURES_WORDS.held; }
export function utilitiesValue(word) { return word === UTILITIES_WORDS.paid ? true : word === UTILITIES_WORDS.tenant ? false : null; }
/** The editor's patch, with the utilities word turned back into the column's boolean (or NULL). */
export function rentalPatchOut(patch = {}) {
  let out = patch;
  if ('utilities' in out) {
    const { utilities, ...rest } = out;
    out = { ...rest, utilities_included: utilitiesValue(utilities) };
  }
  if ('pictures' in out) {
    const { pictures, ...rest } = out;
    out = { ...rest, pictures_shared_with_door: picturesValue(pictures) };
  }
  return out;
}

function EditRental({ rental, onSave, busy, knownBuildings = [], archive = '' }) {
  const [f, setF] = useState({
    utilities: utilitiesWord(rental.utilities_included),
    pictures: picturesWord(rental.pictures_shared_with_door),
    photo_channel: archive || rental.photo_channel || '',
    address: rental.address || '',
    unit: rental.unit || '',
    city: rental.city || '',
    state: rental.state || '',
    monthly_rent: rental.monthly_rent ?? '',
    offering: rental.offering || 'long-term',
    nightly_rate: rental.nightly_rate ?? '',
    min_stay_nights: rental.min_stay_nights ?? '',
    // ANY CADENCE (DR-1003): a weekly price, a price every two weeks, and
    // what the building offers — on any door, lease or short stay.
    weekly_rate: rental.weekly_rate ?? '',
    biweekly_rate: rental.biweekly_rate ?? '',
    building_note: rental.building_note || '',
    // THE STREET SHOWS UNLESS THE FAMILY HOLDS IT (DR-0977): 0280 made
    // 'public' the default. A row read before that (unset) is shown as the
    // database now treats it after 0280's one-time step: shown.
    address_visibility: rental.address_visibility || 'public',
    display_name: rental.display_name || '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const shortStay = f.offering === 'short-term' || f.offering === 'both';
  // The two boxes (DR-1009): nights, and more than nights. Neither ticked is
  // a lease-only door, the default a door is born with.
  const offersNights = shortStay;
  const offersLonger = f.offering !== 'short-term';
  const setOffering = (nights, longer) => setF((p) => ({ ...p, offering: nights && longer ? 'both' : nights ? 'short-term' : 'long-term' }));

  // THE ADDRESS IS PICKED, NOT RETYPED (DR-0999). Darrell: "Drop down with
  // addresses... instead of letting someone else mistyped". The family's
  // known buildings are offered under the street field; an exact pick fills
  // the town and state; new text is a new building.
  const buildings = useMemo(() => buildingOptions(knownBuildings), [knownBuildings]);
  const setAddress = (e) => {
    const v = e.target.value;
    const b = pickedBuilding(v, buildings);
    setF((p) => (b ? { ...p, address: b.address, city: b.city || p.city, state: b.state || p.state } : { ...p, address: v }));
  };
  // THE ARCHIVE IS PICKED FROM WHAT THE NAS HOLDS (DR-0999): the list the
  // photo server serves, with counts, read once when the editor opens. When
  // the NAS cannot be reached the current name is shown and kept as it is;
  // a name is never typed here, so one is never mistyped.
  const [archives, setArchives] = useState({ state: 'reading', list: [] });
  useEffect(() => {
    let on = true;
    if (!hasBridgeToken()) { setArchives({ state: 'no-key', list: [] }); return undefined; }
    fetchChannels().then((list) => { if (on) setArchives(list ? { state: 'ready', list } : { state: 'unreachable', list: [] }); });
    return () => { on = false; };
  }, []);

  // Compare against the door as the FORM sees it: an unset offering displays as
  // "Lease only", so treating it as a change would write a field the landlord
  // never touched and light up Save the moment the editor opens.
  const before = useMemo(() => ({
    ...rental,
    offering: rental.offering || 'long-term',
    address_visibility: rental.address_visibility || 'public',
    display_name: rental.display_name || '',
    photo_channel: archive || rental.photo_channel || '',
    building_note: rental.building_note || '',
    utilities: utilitiesWord(rental.utilities_included),
    pictures: picturesWord(rental.pictures_shared_with_door),
  }), [rental, archive]);
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
    { key: 'weekly_rate', label: 'Weekly rate', numeric: true },
    { key: 'biweekly_rate', label: 'Rate every two weeks', numeric: true },
    { key: 'building_note', label: 'What the building offers' },
    { key: 'utilities', label: 'Utilities' },
    { key: 'pictures', label: 'Who sees the listing pictures' },
    { key: 'address_visibility', label: 'Street on the public listing' },
    { key: 'photo_channel', label: 'Picture archive on the NAS' },
  ]), [before, f, shortStay]);
  // The co-living cadences only (DR-1008): a night is a stay, never stretched over a month.
  const cadencePreview = useMemo(() => cadenceChoice({ monthly: f.monthly_rent, weekly: f.weekly_rate, biweekly: f.biweekly_rate }), [f.monthly_rent, f.weekly_rate, f.biweekly_rate]);

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
          <input type="text" className={field} value={f.address} onChange={setAddress} list="known-buildings" autoComplete="off" data-testid="door-address" />
          <datalist id="known-buildings">
            {buildings.map((b) => <option key={b.label} value={b.label} />)}
          </datalist>
          <span className="block text-[0.6875rem] text-[#6B665E] mt-1" data-testid="door-address-line">
            {buildings.length ? 'Pick a building the family already holds, or type a new one. ' : ''}
            This door reads: <strong>{formatAddress({ ...f, unit: f.unit }) || 'nothing yet'}</strong>
          </span>
        </label>
        {/* THE PICTURE ARCHIVE ON THE NAS (DR-0999), picked from the list the NAS
            serves. Darrell: "Most of the properties have pictures already on
            the nas... why don't they show up". */}
        <label className="sm:col-span-2"><span className={lbl}>Picture archive on the NAS</span>
          {archives.state === 'ready' ? (
            <select className={field} value={f.photo_channel} onChange={set('photo_channel')} data-testid="door-archive">
              <option value="">None named</option>
              {!archives.list.some((c) => c.name === f.photo_channel) && f.photo_channel && <option value={f.photo_channel}>{f.photo_channel} (not on the NAS's list)</option>}
              {archives.list.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.total} picture{c.total === 1 ? '' : 's'})</option>)}
            </select>
          ) : (
            <span className="block text-[0.8125rem] text-[#1A1815]" data-testid="door-archive-state" data-state={archives.state}>
              {f.photo_channel ? <>Named: <strong>{f.photo_channel}</strong>. </> : 'None named. '}
              {archives.state === 'reading' ? 'Reading the NAS\u2019s list\u2026'
                : archives.state === 'no-key' ? 'This device has no family key yet, so the NAS\u2019s list cannot be read here.'
                : 'The NAS could not be reached just now; the archive stays as it is.'}
            </span>
          )}
          {archives.state === 'ready' && (
            <span className="block text-[0.6875rem] text-[#6B665E] mt-1">
              The pictures in this archive show on this door and in Real Estate. Read over the {nasRoad() === 'direct' ? 'direct' : 'same-origin'} road.
            </span>
          )}
        </label>
        {/* WHO MAY SEE THE STREET (0158, DR-0933, then DR-0977). Darrell,
            2026-10-12: "show address unless..." -- the street is the default,
            and the family can hold it until someone applies or books. The
            sentence under the choice says exactly what the shelf will do, so
            the page never promises one thing and shows another (the 0268
            incident). */}
        <label className="sm:col-span-2"><span className={lbl}>Street on the public listing</span>
          <select className={field} value={f.address_visibility} onChange={set('address_visibility')} data-testid="address-visibility">
            <option value="public">Show the street address</option>
            <option value="after-application">Hold it until someone applies or books</option>
          </select>
          <span className="block text-[0.75rem] text-[#6B665E] mt-1 leading-snug" data-testid="address-rule">
            {f.address_visibility === 'public'
              ? 'Visitors see the street, what is nearby, Street view, and a map with the house pinned when they ask for it.'
              : 'Visitors see the town, what is nearby, and the area on a map when they ask for it; the street is handed over when someone applies or books.'}
          </span>
        </label>
        <AreaEditor rental={rental} onSave={onSave} busy={busy} />
        {/* WHO SEES THIS DOOR'S LISTING PICTURES (DR-1199). Darrell: "those
            images should be able to be seen by the people we are adding to
            the system, or if we decide we want them to." The sentence under
            the choice says what the database will do. */}
        <label className="sm:col-span-2"><span className={lbl}>Who sees the listing pictures</span>
          <select className={field} value={f.pictures} onChange={set('pictures')} data-testid="pictures-shared">
            <option value={PICTURES_WORDS.shared}>{PICTURES_WORDS.shared}</option>
            <option value={PICTURES_WORDS.held}>{PICTURES_WORDS.held}</option>
          </select>
          <span className="block text-[0.75rem] text-[#6B665E] mt-1 leading-snug" data-testid="pictures-rule">
            {f.pictures === PICTURES_WORDS.held
              ? 'The tenant and household see only the pictures filed to their own tenancy. Workers sent to this door still see its pictures.'
              : 'The tenant and household see this door\u2019s listing pictures and its rooms, and the pictures filed to their own tenancy; never a condition picture from before their time.'}
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
        {/* WHAT THIS DOOR IS OFFERED AS, BY SEASON (DR-1009). Darrell: "a check
            box for if/when we offer something more than short stays... for the
            seasons we decided"; "all of the above can also be an option... the
            first opportunity to get revenue." Two boxes, three states: short
            stays only, leases and longer terms only, or all of the above. The
            prices stay on the row either way; the shelf advertises only what
            is ticked (0288). */}
        <fieldset className="sm:col-span-2" data-testid="offering-boxes">
          <legend className={lbl}>Offered as</legend>
          <label className="flex items-center gap-2 text-[0.8125rem] min-h-[44px]">
            <input
              type="checkbox" checked={offersNights} aria-label="Short stays, by the night"
              onChange={(e) => setOffering(e.target.checked, offersLonger)}
            />
            <span>Short stays, by the night</span>
          </label>
          <label className="flex items-center gap-2 text-[0.8125rem] min-h-[44px]">
            <input
              type="checkbox" checked={offersLonger} aria-label="More than short stays: leases, weekly, every two weeks"
              onChange={(e) => setOffering(offersNights, e.target.checked)}
            />
            <span>More than short stays: leases, weekly, every two weeks</span>
          </label>
          <span className="block text-[0.6875rem] text-[#6B665E]" data-testid="offering-reads">
            {OFFERINGS.find((o) => o.key === f.offering)?.label || 'Lease only'}
            {offersNights && offersLonger ? ' — all of the above: the first revenue that comes is taken.' : ''}
            {!offersLonger ? ' — the lease prices stay on file and are not advertised this season.' : ''}
          </span>
        </fieldset>
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
        {/* ANY CADENCE, AND THE TRUE MONTH BESIDE EACH (DR-1003). Darrell:
            "$800 a monthly however $200 weekly... sounds the same until you
            get a 5 week month." The family sees here exactly what the renter
            will read on the card, before saving. */}
        <label><span className={lbl}>Weekly rate (optional)</span>
          <input type="text" inputMode="decimal" className={field} value={f.weekly_rate} onChange={set('weekly_rate')} aria-label="Weekly rate" />
        </label>
        <label><span className={lbl}>Rate every two weeks (optional)</span>
          <input type="text" inputMode="decimal" className={field} value={f.biweekly_rate} onChange={set('biweekly_rate')} aria-label="Rate every two weeks" />
        </label>
        {cadencePreview.line && (
          <p className="sm:col-span-2 text-[0.75rem] text-[#1A1815] leading-snug" data-testid="edit-cadence-preview">
            On the listing: {cadencePreview.line}{cadencePreview.deal ? ` — ${cadencePreview.deal}` : ''}
          </p>
        )}
        <label className="sm:col-span-2"><span className={lbl}>What the building offers (shared by every door in it)</span>
          <input type="text" className={field} value={f.building_note} onChange={set('building_note')} maxLength={300} placeholder="Laundry in the entry" aria-label="What the building offers" />
        </label>
        <label className="sm:col-span-2"><span className={lbl}>Utilities (said on the listing)</span>
          <select className={field} value={f.utilities} onChange={set('utilities')} aria-label="Utilities" data-testid="edit-utilities">
            <option value="">Not said</option>
            <option value={UTILITIES_WORDS.paid}>All utilities paid</option>
            <option value={UTILITIES_WORDS.tenant}>The tenant pays their own utilities</option>
          </select>
        </label>
      </div>
      {edit.changed && <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed mt-2">{edit.summary}</p>}
      <div className="mt-2">
        <Btn tone="primary" disabled={busy || !edit.changed} onClick={() => onSave(rentalPatchOut(edit.patch), edit.summary)}>
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

// RECORDS VS ADVERTISING (DR-0906). Darrell, 2026-10-10, over a move-out
// condition set of a unit he had just got back: "just don't want it to be
// advertised!!!" and then the principle itself: "Records vs advertising!!!"
//
// Eight of these nine kinds are RECORDS — what a place looked like on a day,
// kept so the family and a worker can see later "how horrible it was or nice".
// Exactly ONE, 'listing', is ADVERTISING: it is the only kind
// public_vacancy_photos will return, and then only while the door is listed
// and nobody lives there (0161).
//
// AND THE FORM DEFAULTED TO THE ADVERTISING ONE — `useState({ kind:
// 'listing' })`, and it RESET BACK to it after every add. So the one kind a
// stranger can see was the standing default for a panel whose ordinary use is
// documenting damage, and a landlord adding a second batch of move-out photos
// got silently switched back to "advertise this" between batches.
//
// The order here is the reading order of the picker, so the records come
// first and the advertising kind is last, beside its own label.
export const RECORD_KINDS = Object.freeze([
  'move-in-condition', 'move-out-condition', 'turn',
  'work-order-before', 'work-order-after', 'damage', 'inspection', 'document-scan',
]);

/** The only kind a stranger can ever be shown. One member, named, on purpose. */
export const ADVERTISING_KINDS = Object.freeze(['listing']);

export const PHOTO_KINDS = Object.freeze([...RECORD_KINDS, ...ADVERTISING_KINDS]);

export const isAdvertising = (kind) => ADVERTISING_KINDS.includes(kind);

// WHAT THE PANEL OPENS ON. The kind he used last, on this device, because a
// move-out set is a dozen photographs over several batches and re-choosing it
// each time is how the wrong one gets saved. Never 'listing' from memory
// alone: advertising is a thing a person chooses each time they mean it, not
// a state the app can drift into.
const KIND_MEMORY = 'poetech-properties-photo-kind-v1';

export function rememberedKind(storage) {
  try {
    const store = storage || (typeof localStorage === 'undefined' ? null : localStorage);
    const seen = store && store.getItem(KIND_MEMORY);
    if (seen && RECORD_KINDS.includes(seen)) return seen;
  } catch { /* a private window has no storage; the default below is fine */ }
  return RECORD_KINDS[0];
}

export function rememberKind(kind, storage) {
  try {
    const store = storage || (typeof localStorage === 'undefined' ? null : localStorage);
    // Only a record is remembered. See above.
    if (store && RECORD_KINDS.includes(kind)) store.setItem(KIND_MEMORY, kind);
  } catch { /* nothing to do, and nothing worth failing an upload over */ }
}

export const DOCUMENT_KINDS = Object.freeze([
  'lease', 'addendum', 'rules', 'notice', 'receipt', 'inspection',
  'insurance', 'w9', 'invoice', 'permit', 'correspondence', 'id-verification', 'other',
]);

/**
 * A typed day ("2026-09-28") to the instant the record keeps (DR-0908).
 *
 * MIDDAY, not midnight, and this is not a detail. A date input gives a bare
 * day with no zone; parsing that as UTC midnight renders as the DAY BEFORE
 * anywhere west of Greenwich — Champaign is UTC-5, so every photograph a
 * landlord dated would move back one day on his own screen. Noon is far
 * enough from either edge that no real zone can shift the date.
 *
 * Returns null for empty or unparseable input, so the field is optional and a
 * typo can never write a wrong instant: the record would rather know nothing
 * than record a day that is not true.
 */
export function takenAtIso(when) {
  const v = String(when || '').trim();
  // A bare day keeps the noon rule. A day WITH a time is taken as given, in
  // the person's own zone — that is what a datetime-local field means, and
  // "4:20pm" is the answer he actually has when he says what time he walked
  // the unit.
  const day = /^\d{4}-\d{2}-\d{2}$/.test(v);
  const dayTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(v);
  if (!day && !dayTime) return null;
  const at = new Date(day ? `${v}T12:00:00` : v);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

/** An instant from the record back into a datetime-local field, local zone. */
export function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return nowLocalInput(d);
}

/** Now, in the shape a datetime-local field wants, in the viewer's own zone. */
export function nowLocalInput(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    + `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
 * THE LIST NEVER CARRIES THE BYTES (2026-09-08, DR-0303 / migration 0185).
 * Every picture now lands with a small thumbnail beside it. The grid draws the
 * thumbnail; the full image is fetched by id, one at a time, only when a
 * picture is opened. The board, the gallery and the Real Estate strip all read
 * the same thumbnails, so taking fifty pictures on a walk-through costs a
 * gallery open fifty thumbnails, not fifty images.
 *
 * WALKING A UNIT WITH A PHONE (Darrell, 2026-09-08, on his way to 805 North
 * Prospect Apt 2 while Corion installs a microwave and ductwork): "I can take a
 * picture and then say a voice note of some sort, and it captures the
 * information." So: a TAKE A PHOTO button that opens the camera directly,
 * every queued picture gets its own caption, and every caption has a Speak
 * button (the one shared push-to-end dictation primitive) where the browser
 * supports it. A picture taken through the camera here is stamped taken_at =
 * now, because that is when the shutter fired; a picture picked from the
 * phone's storage is left undated, because the app does not know.
 *
 * "Remove" archives. There is no DELETE grant, because a condition set exists
 * to settle an argument that can arrive long after somebody decided the picture
 * was clutter.
 *
 * canAdd vs canManage: a 1099 worker delegated "Add job documentation" may
 * FILE pictures to the door he is working (0185), but the arrangement, the
 * captions of others' pictures and the archive stay the landlord's.
 */
// 640 px at 75% (DR-0931): 320 px at 60% blurred on every phone-width tile.
// Still a small fraction of the full image; SharpPicture swaps the full one
// in where a tile needs more than the thumbnail holds.
export const THUMB_MAX_WIDTH = 640;
export const THUMB_QUALITY = 0.75;
// THE FULL PICTURE (DR-0939). Darrell 2026-10-10: "I want the best pictures in
// the PoeTech App too". His Fold unfolded is ~1800 device pixels wide; a 1280px
// picture was stretched across it. 1920px at 0.85 is sharp on that screen, and
// the list read never carries these bytes (0185), so a board stays light.
export const FULL_MAX_WIDTH = 1920;
export const FULL_QUALITY = 0.85;

/** Type-or-speak for one caption box: the mic appears only where the browser can hear. */
// THE NAMES ALREADY GIVEN (DR-1235). Darrell, 2026-10-27: "when adding a
// new name for an image it should be automatically one of the options moving
// forward". `options` are the names this instance has typed before (the
// picture_names table, 0310), offered under the box on every device; a name
// typed here is remembered once a picture carrying it is saved.
function CaptionField({ value, onChange, placeholder, label, className = '', options = null }) {
  const mic = useVoiceDictation({
    onTranscript: (t) => onChange(value ? `${value} ${t}` : t),
  });
  const listId = options && options.length ? `caption-names-${label.replace(/[^a-z0-9]+/gi, '-')}` : null;
  return (
    <div className={`flex items-start gap-1 ${className}`}>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} aria-label={label} list={listId || undefined}
        className="flex-1 min-w-0 border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
      />
      {listId && (
        <datalist id={listId} data-testid="caption-names">
          {options.map((n) => <option key={n} value={n} />)}
        </datalist>
      )}
      {mic.supported && (
        <button
          type="button" onClick={mic.toggle} aria-pressed={mic.listening}
          aria-label={mic.listening ? `Stop speaking ${label}` : `Speak ${label}`}
          className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] ${
            mic.listening ? 'bg-[#8C2F2F] text-white border-[#8C2F2F]' : 'border-[#1A1815] text-[#1A1815] bg-white'}`}
        >{mic.listening ? 'Stop' : 'Speak'}</button>
      )}
      {mic.error && <span role="status" className="text-[0.6875rem] text-[#8C2F2F] self-center">{mic.error}</span>}
    </div>
  );
}

// =============================================================================
// FROM THE NAS -- the family's pictures onto a door, picked, never twice (DR-1002)
// =============================================================================
// Darrell, 2026-10-13: "Most of the properties have pictures already on the
// nas... why don't they show up", "The nas has all pictures period!!!... why
// not just pull from there?" Two shelves on the family NAS: this door's chat
// archive (0284 names it) and the whole library by month (the dated photo
// roots and the phone backup, read as folders -- no Synology Photos sign-in).
// Each picture offers the two purposes DR-0906 keeps apart: USE ON THE
// LISTING (advertising, chosen each time) or KEEP AS A RECORD (the record
// kind the form holds). The bytes come down at listing size from the server
// (/property-photo, /library-photo) and are filed the way a phone picture is;
// the row carries its SOURCE so the database refuses a second copy (0285).
// A picture already on this door says so. An unreachable NAS says so --
// never "none". The read is timed and the road named (DR-0955's slow-pictures
// thread: measured, not felt).
// The shelf and month a person last chose on a door, kept across the gallery's
// own refreshes (filing one picture reloads the door's data and can remount
// this card) so the next picture is still in front of them.
const NAS_SHELF_MEMORY = new Map();
export function NasShelf({ door, archive = '', nasFiled = null, recordKind = 'move-in-condition', onAdd, onDone }) {
  const remembered = NAS_SHELF_MEMORY.get(door?.id) || {};
  const [shelf, setShelfState] = useState(remembered.shelf || (archive ? 'archive' : 'library'));
  const [month, setMonthState] = useState(() => remembered.month || thisMonth());
  const setShelf = (v) => { setShelfState(v); NAS_SHELF_MEMORY.set(door?.id, { ...(NAS_SHELF_MEMORY.get(door?.id) || {}), shelf: v }); };
  const setMonth = (v) => { setMonthState(v); NAS_SHELF_MEMORY.set(door?.id, { ...(NAS_SHELF_MEMORY.get(door?.id) || {}), month: v }); };
  const [state, setState] = useState({ status: 'idle', photos: [], total: 0, ms: 0, road: '' });
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState('');
  // SOME OR ALL (DR-1162). Darrell, 2026-10-21, the worker's Pictures tab on
  // 709 Commercial St reading "No pictures on this property yet" while this
  // shelf held 121: "1099 worker won't see pictures of the property?... Yes
  // it does on the other edit side... my point." The archive is behind the
  // family key, which never leaves a family device, so a worker, a manager or
  // a tenant sees only what is FILED to the door's record (0185 lets a
  // delegated worker read it). The landlord chooses, some or all: tick the
  // ones, or file the whole archive, page by page, filed once, with a bar
  // that counts real writes (DR-0961) and one refresh at the end (DR-0947).
  const [ticked, setTicked] = useState(() => new Set());
  const [batch, setBatch] = useState(null); // {done, total, saved, failed, stop}
  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    const t0 = Date.now();
    const r = shelf === 'archive' ? await fetchChannelPhotos(archive, { limit: 24 }) : await fetchLibrary({ month, limit: 24 });
    const ms = Date.now() - t0;
    if (!r) { setState({ status: 'unreachable', photos: [], total: 0, ms, road: nasRoad() }); return; }
    setState({ status: 'ready', photos: r.photos || [], total: r.total || 0, ms, road: nasRoad() });
  }, [shelf, archive, month]);
  useEffect(() => { load(); }, [load]);
  const keyOf = (p) => (shelf === 'archive' ? nasSource(archive, p.id) : nasLibrarySource(p.name || p.id));
  const reasonText = (reason) => {
    if (reason === 'unreachable') return 'the NAS could not be reached by either road';
    if (reason === 'no-key') return 'no NAS key on this phone';
    if (/source/i.test(String(reason || ''))) return 'the database is still being updated for this; try again in a minute';
    return String(reason || 'unknown');
  };
  // One picture, filed: the bytes from the NAS, the row with its source. The
  // single buttons and the batch both come through here, so there is one way
  // a NAS picture becomes a record. `quiet` keeps the per-picture refresh and
  // note out of a batch (DR-0947: twelve bootstraps for twelve pictures).
  const fileOne = async (p, kind, { quiet = false } = {}) => {
    const key = keyOf(p);
    if (!key) return { ok: false, reason: 'this picture has no usable name' };
    const got = shelf === 'archive' ? await fetchListingPhoto(archive, p.id) : await fetchLibraryPhoto(p.name || p.id);
    if (!got.ok) return { ok: false, reason: reasonText(got.reason) };
    let thumb = p.thumb || '';
    if (!thumb && shelf === 'library') { const small = await fetchLibraryPhoto(p.name || p.id, { max: 480 }); if (small.ok) thumb = small.image; }
    const res = await onAdd?.({
      instance_id: door?.instance_id, rental_ref: door?.id, room_id: null, kind,
      caption: String(p.text || '').trim(),
      storage_path: got.image, thumb_path: thumb || got.image,
      taken_at: p.date ? `${p.date}T12:00:00Z` : null,
      source: key,
    });
    if (res?.ok) { if (!quiet) onDone?.(); return { ok: true }; }
    return { ok: false, reason: reasonText(`${res?.reason || ''} ${res?.error || ''}`.trim()) };
  };
  const file = async (p, kind) => {
    setBusy(p.id); setNote('');
    const r = await fileOne(p, kind);
    setBusy(null);
    if (r.ok) setNote(kind === 'listing' ? 'On the listing.' : `Kept as ${kind.replace(/-/g, ' ')}.`);
    else setNote(`Not filed: ${r.reason}.`);
  };
  // THE BATCH: the ticked pictures, or every unfiled picture on this door's
  // archive (paged through the NAS, 24 at a time, at most 50 pages). Each is
  // one real write; the bar counts them; a failure is counted and named, never
  // hidden behind the ones that landed; the gallery refreshes once at the end.
  const fileMany = async (list, kind) => {
    const todo = list.filter((p) => !filed(p));
    if (todo.length === 0) { setNote('Nothing to file: every picture here is on this door already.'); return; }
    const b = { done: 0, total: todo.length, saved: 0, failed: 0, stop: false };
    setBatch({ ...b }); setNote('');
    for (const p of todo) {
      if (b.stop) break;
      const r = await fileOne(p, kind, { quiet: true });
      b.done += 1; if (r.ok) b.saved += 1; else b.failed += 1;
      setBatch({ ...b });
    }
    setBatch(null); setTicked(new Set());
    setNote(`${b.saved} of ${b.total} filed as ${kind === 'listing' ? 'listing pictures' : kind.replace(/-/g, ' ')}${b.failed ? `; ${b.failed} did not land` : ''}.`);
    onDone?.();
  };
  const fileAll = async (kind) => {
    if (shelf !== 'archive' || !archive) return;
    const all = []; const seen = new Set();
    for (let page = 0; page < 50; page += 1) {
      const r = await fetchChannelPhotos(archive, { limit: 24, offset: page * 24 });
      if (!r) { setNote('Not filed: the NAS could not be reached by either road.'); return; }
      let fresh = 0;
      for (const p of r.photos || []) if (!seen.has(p.id)) { seen.add(p.id); all.push(p); fresh += 1; }
      if (fresh === 0 || (r.photos || []).length < 24 || all.length >= (r.total || 0)) break;
    }
    await fileMany(all, kind);
  };
  const tick = (id) => setTicked((t) => { const n = new Set(t); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const tickedPhotos = state.photos.filter((p) => ticked.has(p.id));
  const filed = (p) => (nasFiled && keyOf(p) && nasFiled[keyOf(p)]) ? nasFiled[keyOf(p)] : null;
  const seconds = (state.ms / 1000).toFixed(1);
  return (
    <Card title="From the NAS" right={<span className="text-[0.6875rem] text-[#6B665E]">picked, never twice</span>}>
      <div className="flex flex-wrap items-end gap-2 mb-2" data-testid="nas-shelf">
        <label className="text-[0.75rem] text-[#5A5751]">Shelf
          <select className="block border border-[#E8E4DC] bg-white px-2 py-2 text-sm min-h-[36px]" value={shelf} data-testid="nas-shelf-pick" onChange={(e) => setShelf(e.target.value)}>
            {archive && <option value="archive">This door&rsquo;s archive ({archive})</option>}
            <option value="library">The whole library, by month</option>
          </select>
        </label>
        {shelf === 'library' && (
          <label className="text-[0.75rem] text-[#5A5751]">Month
            <input type="month" className="block border border-[#E8E4DC] bg-white px-2 py-2 text-sm min-h-[36px]" value={month} data-testid="nas-month" onChange={(e) => setMonth(e.target.value)} />
          </label>
        )}
        <button type="button" className="min-h-[36px] px-3 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#2F5D50] border border-[#E8E4DC] text-sm" onClick={load} disabled={state.status === 'loading'}>Look again</button>
      </div>
      {state.status === 'loading' && <p className="text-sm text-[#5A5751]">Reading the NAS&hellip;</p>}
      {state.status === 'unreachable' && (
        <p className="text-sm text-[#8C2F2F]" data-testid="nas-shelf-unreachable">
          The NAS could not be reached by either road just now &mdash; this is not the same as there being no pictures. Try again in a moment.
        </p>
      )}
      {state.status === 'ready' && (
        <>
          <p className="text-[0.75rem] text-[#6B665E] mb-2" data-testid="nas-shelf-timing">
            {state.total} picture{state.total === 1 ? '' : 's'}{state.total > state.photos.length ? ` (showing ${state.photos.length})` : ''} &middot; read in {seconds} s over the {state.road} road
          </p>
          {state.photos.length === 0 && <p className="text-sm text-[#5A5751]">Nothing on this shelf{shelf === 'library' ? ` for ${month}` : ''}.</p>}
          {state.photos.some((p) => !filed(p)) && (
            /* SOME OR ALL (DR-1162): the ticked ones, or the whole archive.
               Filing is what lets a 1099 worker, a manager or the household
               see a picture at all; the archive itself stays behind the
               family key. The bar counts real writes (DR-0961). */
            <div className="flex flex-wrap items-center gap-2 mb-2" data-testid="nas-batch">
              <button type="button" className="min-h-[36px] px-3 text-[0.75rem] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#2F5D50] border border-[#2F5D50] text-[#2F5D50] disabled:opacity-40" disabled={!!batch || tickedPhotos.length === 0} data-testid="nas-file-ticked" onClick={() => fileMany(tickedPhotos, recordKind)}>
                {`File ${tickedPhotos.length} ticked as records`}
              </button>
              <button type="button" className="min-h-[36px] px-3 text-[0.75rem] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#2F5D50] border border-[#E8E4DC] text-[#5A5751] disabled:opacity-40" disabled={!!batch || tickedPhotos.length === 0} data-testid="nas-use-ticked" onClick={() => fileMany(tickedPhotos, 'listing')}>
                {`Use ${tickedPhotos.length} ticked on the listing`}
              </button>
              {shelf === 'archive' && archive && (
                <button type="button" className="min-h-[36px] px-3 text-[0.75rem] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#2F5D50] border border-[#2F5D50] bg-[#2F5D50] text-white disabled:opacity-40" disabled={!!batch} data-testid="nas-file-all" onClick={() => fileAll(recordKind)}>
                  {`File all ${state.total} on this door’s archive as records`}
                </button>
              )}
              {tickedPhotos.length === 0 && !batch && (
                <span className="text-[0.75rem] text-[#6B665E]">Tick pictures to file some; or file the whole archive. Each lands once; the record keeps them for everyone on this door.</span>
              )}
              {batch && (
                <div className="w-full" data-testid="nas-batch-progress">
                  <div className="h-2 w-full bg-[#E8E4DC]" role="progressbar" aria-valuenow={batch.done} aria-valuemin={0} aria-valuemax={batch.total} aria-label="Filing the pictures to this door">
                    <div className="h-2 bg-[#2F5D50]" style={{ width: `${Math.round((batch.done / Math.max(batch.total, 1)) * 100)}%` }} />
                  </div>
                  <span className="text-[0.75rem] text-[#5A5751]">{`Filing ${batch.done} of ${batch.total}… don’t leave this screen.${batch.failed ? ` ${batch.failed} did not land.` : ''}`}</span>
                </div>
              )}
            </div>
          )}
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {state.photos.map((p) => {
              const already = filed(p);
              return (
                <li key={p.id} className="border border-[#E8E4DC] bg-white p-2" data-testid={`nas-tile-${p.id}`}>
                  {!already && (
                    <label className="flex items-center gap-1 text-[0.75rem] text-[#5A5751] mb-1 cursor-pointer">
                      <input type="checkbox" checked={ticked.has(p.id)} onChange={() => tick(p.id)} disabled={!!batch} aria-label={`Tick ${p.text || p.name || p.id} to file it`} data-testid={`nas-tick-${p.id}`} />
                      <span>Tick to file</span>
                    </label>
                  )}
                  {p.thumb
                    ? <img src={p.thumb} alt={p.text || p.name || 'a picture on the NAS'} className="w-full h-28 object-cover" loading="lazy" />
                    : <div className="w-full h-28 bg-[#E8E4DC] text-[0.6875rem] text-[#6B665E] flex items-center justify-center px-2 text-center">{p.name || p.id}</div>}
                  <p className="text-[0.6875rem] text-[#6B665E] mt-1">{p.date || ''}{p.text ? ` · ${p.text}` : ''}</p>
                  {already ? (
                    <p className="text-[0.75rem] text-[#2F5D50] mt-1" data-testid={`nas-tile-${p.id}-filed`}>On this door already.</p>
                  ) : (
                    <div className="flex flex-col gap-1 mt-1">
                      <button type="button" className="min-h-[36px] px-2 text-[0.75rem] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#2F5D50] border border-[#2F5D50] text-[#2F5D50]" disabled={busy === p.id} data-testid={`nas-use-${p.id}`} onClick={() => file(p, 'listing')}>
                        {busy === p.id ? 'Filing…' : 'Use on the listing'}
                      </button>
                      <button type="button" className="min-h-[36px] px-2 text-[0.75rem] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#2F5D50] border border-[#E8E4DC] text-[#5A5751]" disabled={busy === p.id} data-testid={`nas-keep-${p.id}`} onClick={() => file(p, recordKind)}>
                        Keep as a record ({recordKind.replace(/-/g, ' ')})
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {note && <p className="text-sm mt-2" data-testid="nas-shelf-note" aria-live="polite">{note}</p>}
    </Card>
  );
}

// THE BUILDING'S PICTURES (DR-1290). Darrell, 2026-10-29, on a door at 805:
// "Need to be able to show images of the entry on all doors in 805!!!!! All
// pictures for any apartment should be available from the same images
// pool... we can add which apt... however we should be able to use anything
// it's the same building!!!!!"
//
// One pool for the building, every picture saying which apartment holds it.
// "Use on this door" places it here (one door_photo_order row, nothing
// copied); "Stop using" takes it off. A listing picture placed here shows on
// this door's open listing while this door is advertised and empty, even when
// the apartment that holds it is let -- which is why the card asks for the
// shared spaces. A record (move-in, inspection, work) placed here shows in
// this gallery only, never to a stranger (0314).
const POOL_PAGE = 24;
function doorName(d) {
  return (d && (d.display_name || d.unit || d.address)) || 'another door';
}
function BuildingPool({ photos = [], doors = [], placed = {}, unread = false, loadImage, loadThumb, onPlace, onUnplace, nextPosition = 10 }) {
  const [which, setWhich] = useState('all');
  const [limit, setLimit] = useState(POOL_PAGE);
  const [busy, setBusy] = useState(null);
  const [said, setSaid] = useState('');
  const byDoor = useMemo(() => Object.fromEntries((doors || []).map((d) => [d.id, d])), [doors]);
  const counts = useMemo(() => {
    const c = {};
    for (const p of photos || []) c[p.rental_ref] = (c[p.rental_ref] || 0) + 1;
    return c;
  }, [photos]);
  const list = useMemo(() => (which === 'all' ? photos : photos.filter((p) => p.rental_ref === which)), [photos, which]);
  const inUse = Object.keys(placed || {}).length;
  const move = async (p, use) => {
    if (busy) return;
    setBusy(p.id); setSaid('');
    const r = use ? await onPlace?.(p.id, nextPosition) : await onUnplace?.(p.id);
    setBusy(null);
    const name = p.caption || p.kind.replace(/-/g, ' ');
    if (r && r.ok === false) setSaid(`Not saved: ${r.reason || 'the database refused it'}.`);
    else setSaid(use ? `${name} is on this door now.` : `${name} is off this door; it stays on ${doorName(byDoor[p.rental_ref])}.`);
  };
  return (
    <Card title={`The rest of the building (${photos.length})`}>
      {unread ? (
        <p className="text-sm text-[#8C2F2F]" data-testid="building-pool-unreadable">
          The rest of this building could not be read just now &mdash; this is not the same as there being none. Pull down to try again.
        </p>
      ) : (
        <div data-testid="building-pool" data-in-use={inUse}>
          <p className="text-[0.8125rem] text-[#5A5751] mb-2" data-testid="building-pool-note">
            Every picture on the other apartments of this building, each saying which apartment holds it.
            {' '}<strong>Use one on this door</strong> and it shows here and on this door&rsquo;s listing, in this door&rsquo;s own order, with nothing copied.
            {' '}<strong>Choose the shared spaces</strong> &mdash; the entry, the halls, the laundry, the outside &mdash; because a listing picture
            used here is shown while this door is advertised, even if the apartment it came from is lived in.
            A record (move-in, inspection, work) used here stays in this gallery and is never shown on the listing.
          </p>
          <div className="flex flex-wrap items-end gap-2 mb-2">
            {/* Full width on a phone: a select sizes itself to its longest
                option ("805 North Prospect Avenue Room 1 - Bed A"), which
                ran 15px off a 360px screen (measured). */}
            <label className="text-[0.75rem] text-[#5A5751] min-w-0 w-full sm:w-auto">Which apartment
              <select
                className="block w-full sm:w-auto border border-[#E8E4DC] bg-white px-2 py-2 text-sm min-h-[36px] max-w-full"
                value={which} data-testid="building-pool-door"
                onChange={(e) => { setWhich(e.target.value); setLimit(POOL_PAGE); }}
              >
                <option value="all">{`Every apartment (${photos.length})`}</option>
                {(doors || []).filter((d) => counts[d.id]).map((d) => (
                  <option key={d.id} value={d.id}>{`${doorName(d)} (${counts[d.id]})`}</option>
                ))}
              </select>
            </label>
            <span className="text-[0.75rem] text-[#6B665E] pb-2" data-testid="building-pool-in-use">{`${inUse} in use on this door`}</span>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {list.slice(0, limit).map((p) => {
              const used = Object.prototype.hasOwnProperty.call(placed || {}, p.id);
              const record = p.kind !== 'listing';
              return (
                <li key={p.id} className="border border-[#E8E4DC] bg-white p-2 min-w-0" data-testid={`building-pool-${p.id}`} data-used={used ? 'true' : 'false'}>
                  <div className="relative">
                    <SharpPicture photo={p} loadImage={loadImage} loadThumb={loadThumb} alt={p.caption || p.kind} className="aspect-square w-full object-cover" />
                    {used && <span className="absolute bottom-1 left-1 bg-[#2F5D50] text-white text-[0.625rem] uppercase tracking-wider px-1.5 py-0.5">In use here</span>}
                  </div>
                  <div className="text-[0.8125rem] text-[#1A1815] mt-1 leading-snug break-words">
                    {p.caption || <em className="text-[#6B665E]">No caption</em>}
                  </div>
                  <div className="text-[0.6875rem] text-[#6B665E] break-words" data-testid={`building-pool-from-${p.id}`}>
                    {`${p.kind.replace(/-/g, ' ')} · from ${doorName(byDoor[p.rental_ref])}`}
                  </div>
                  {record && <div className="text-[0.6875rem] text-[#6B665E]">a record: this gallery only, never the listing</div>}
                  {used ? (
                    <Btn onClick={() => move(p, false)} disabled={busy === p.id} aria-label={`Stop using ${p.caption || p.kind} on this door`}>
                      {busy === p.id ? 'Saving…' : 'Stop using here'}
                    </Btn>
                  ) : (
                    <Btn onClick={() => move(p, true)} disabled={busy === p.id || !onPlace} aria-label={`Use ${p.caption || p.kind} on this door`}>
                      {busy === p.id ? 'Saving…' : 'Use on this door'}
                    </Btn>
                  )}
                </li>
              );
            })}
          </ul>
          {list.length > limit && (
            <div className="mt-2">
              <Btn onClick={() => setLimit((n) => n + POOL_PAGE)}>{`Show ${Math.min(POOL_PAGE, list.length - limit)} more of ${list.length - limit}`}</Btn>
            </div>
          )}
          {said && <p className="text-sm mt-2" aria-live="polite" data-testid="building-pool-said">{said}</p>}
        </div>
      )}
    </Card>
  );
}

export function GalleryTab({
  door, rooms = [], photos = [], canManage = false, canAdd = canManage, busy = false, unread = false,
  onAdd, onDone, onPatch, onAddRoom, loadImage = null, loadThumb = null, doorLabel = '',
  // THE REST OF THE APARTMENT (DR-0963). Deliberately a SEPARATE prop, never
  // merged into `photos`: these rows belong to another door of the same
  // apartment, and a gallery that quietly folded them in would be telling
  // this door it owns pictures it does not — the same invented fact DR-0946
  // was written about, pointing the other way.
  sharedPhotos: apartmentShared = [], sharedDoors = [], sharedUnread = false,
  // THIS DOOR'S OWN ORDER of those pictures (DR-0984): {photo_id: position}.
  // Saved per door, so Bed B can lead with the bedroom while Bed A leads with
  // the kitchen; the pictures themselves stay on the door that owns them.
  sharedOrder: apartmentOrder = {}, onArrangeShared = null,
  // THE BUILDING'S PICTURE POOL (DR-1290): every picture on the OTHER
  // apartments of this door's building, which of them this door uses
  // ({photo_id: position}), and the two moves. Placed ones join the shared
  // card below (arranged in this door's order, like the apartment's); the
  // pool card lists the rest by which apartment holds them.
  buildingPhotos = [], buildingDoors = [], buildingPlaced = {}, buildingUnread = false,
  onPlaceBuilding = null, onUnplaceBuilding = null,
  // FROM THE NAS (DR-1002): the door's archive name on its record (0284) and
  // which NAS pictures it has already filed ({source: photo id}); null when
  // that read failed -- unknown, never "none".
  archive = '', nasFiled = null,
  // THE NAMES THIS INSTANCE GIVES ITS PICTURES (DR-1235): read once when the
  // tab opens, offered under every caption box, and a new one remembered when
  // a picture carrying it is saved. Injected in tests.
  namesOps = NAMES_OPS,
}) {
  // Every picture opened or saved here carries the Poe Properties band and a
  // QR to this unit's listing (DR-0941): "all downloaded materials have our
  // tags and logos". The stored original is never altered.
  const doorId = door ? door.id : null;
  const stamp = useCallback((item) => stampImage({ src: item.src, door: doorLabel, link: applyUrl(doorId) }), [doorLabel, doorId]);
  // What this door shows from other doors: its apartment's (automatic,
  // DR-0963) and the building pictures it was given (DR-1290), one list in
  // this door's own order, so the cover and the arrows work on all of them.
  const placedBuilding = useMemo(
    () => (buildingPhotos || []).filter((p) => Object.prototype.hasOwnProperty.call(buildingPlaced || {}, p.id)),
    [buildingPhotos, buildingPlaced],
  );
  const sharedPhotos = useMemo(() => [...(apartmentShared || []), ...placedBuilding], [apartmentShared, placedBuilding]);
  const sharedOrder = useMemo(() => ({ ...(buildingPlaced || {}), ...(apartmentOrder || {}) }), [buildingPlaced, apartmentOrder]);
  const [f, setF] = useState(() => ({ caption: '', kind: rememberedKind(), roomId: '', takenOn: nowLocalInput() }));
  const [knownNames, setKnownNames] = useState([]);
  useEffect(() => {
    let live = true;
    if (!namesOps || typeof namesOps.load !== 'function') return undefined;
    Promise.resolve(namesOps.load()).then((r) => { if (live && r && r.ok) setKnownNames(mergePictureNames([], r.names || [])); }).catch(() => {});
    return () => { live = false; };
  }, [namesOps]);
  const [saving, setSaving] = useState(false);
  const [savedSoFar, setSaved] = useState(null);
  const [report, setReport] = useState(null);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  // MANY PICTURES, ONE ROOM (DR-0949). Darrell, 2026-10-10, after the room
  // picker reached this editor: twelve move-out photographs is twelve times
  // Edit -> pick -> Save, which is thirty-six taps on a phone to say one
  // thing. A move-out set is naturally grouped — six bathroom shots in a row,
  // then the kitchen — so the room is exactly the field worth setting once.
  //
  // `chosen` is a Set of photo ids.
  //
  // THE ARMING STEP IS GONE (DR-0961). It used to be hidden behind a "Choose
  // several" toggle, on my reasoning that a grid always in selection mode makes
  // tapping a picture to LOOK at it ambiguous. Darrell, 2026-10-11, with the
  // feature already shipped and in front of him: "Maybe it should say move to
  // listing... checkmarks!!!!!!! For each photo on any section". The reasoning
  // was wrong in the way a hidden feature is always wrong -- the ambiguity I
  // was protecting against never arrived, because the checkbox is its own small
  // target in the corner and the picture underneath still opens on tap, while
  // the cost I did not count was that nobody can find a capability whose button
  // names its mechanism ("choose several") instead of its outcome ("move to
  // listing"). Checkmarks now show on every picture in every kind tab.
  const [chosen, setChosen] = useState(() => new Set());
  // HOW FAR THE MOVE HAS GOT. The add panel learned this in DR-0907 -- "a
  // button that only greys out is how a person decides it has hung and leaves"
  // -- and the lesson was never carried the six hundred lines down to here,
  // where the same serial one-at-a-time loop ran with no sign of life at all.
  // Null when nothing is moving; {done, total} while it runs.
  const [moving, setMoving] = useState(null);
  const [bulkRoom, setBulkRoom] = useState('');
  // WHAT the bulk action sets: the room, or the kind (DR-0951). Darrell,
  // 2026-10-11, on Bed A holding MOVE IN CONDITION (39) and LISTING (0):
  // "Need to be able to move pictures to the advertisement sections for
  // advertisement when necessary" and "I don't want to have to re-upload when
  // we already have them."
  const [bulkField, setBulkField] = useState('room');
  // Never remembered, and never the opening value. DR-0906: advertising is
  // chosen each time it is meant, because this is the one change that takes a
  // picture of the inside of a place and makes it publicly visible.
  const [bulkKind, setBulkKind] = useState(RECORD_KINDS[0]);
  const [bulkSaid, setBulkSaid] = useState('');
  const [newRoom, setNewRoom] = useState('');
  // The full images fetched so far, by id — only what somebody has opened.
  const [full, setFull] = useState({});
  const [open, setOpen] = useState(null);
  const live = useMemo(() => liveRooms(rooms), [rooms]);
  // In the landlord's arranged order (0160) — the first picture is the cover.
  const allShots = useMemo(() => photoOrder(photos.filter((p) => !p.archived_at)), [photos]);
  // SHOW ME THE SET I AM WORKING ON (DR-0908). Darrell, 2026-10-10: "Maybe
  // choosing a move out conditions should show those images etc..."
  //
  // A door accumulates every kind in one pile — move-in, move-out, damage,
  // work-order before and after, the listing shots. Looking for "how it came
  // back" meant reading captions down a single list. The kinds already exist
  // and are already on every row; they were simply never offered as a way to
  // LOOK. `null` means every kind, which stays the default on arrival.
  const [only, setOnly] = useState(null);
  const counts = useMemo(() => {
    const m = new Map();
    for (const p of allShots) m.set(p.kind, (m.get(p.kind) || 0) + 1);
    return m;
  }, [allShots]);
  const shown = useMemo(
    () => (only ? allShots.filter((p) => p.kind === only) : allShots),
    [allShots, only],
  );
  // The apartment's pictures in THIS listing's order (DR-0984): what this door
  // placed first, then the rest in the owning door's order.
  const sharedArranged = useMemo(
    () => photoOrder((sharedPhotos || []).map((p) => ({ ...p, sort_order: sharedOrder[p.id] ?? null }))),
    [sharedPhotos, sharedOrder],
  );
  // One viewer for everything on screen: this door's pictures, then the shared
  // ones -- "the apartment B picture can't be used/clicked and enlarged".
  const viewable = useMemo(() => [...shown, ...sharedArranged], [shown, sharedArranged]);
  const arrangeShared = (res) => { if (onArrangeShared && res.patches.length) onArrangeShared(res.patches); };

  // MOVE THE TICKED ONES, SAYING HOW FAR IT HAS GOT (DR-0961).
  //
  // Serial on purpose, as the upload is: one write at a time, so the count
  // that comes back is the count that actually SAVED and not the count that
  // was attempted. What is new is that the counter is published after each
  // write instead of only at the end, which is the whole of the progress bar
  // -- there is no second source of truth to drift (DR-0076 section 4: the
  // number shown is measured, never estimated).
  //
  // It reads `chosen` against `shown`, so a tick in one kind tab is not
  // carried into another by accident.
  const applyToChosen = async (patch, say) => {
    // WHAT IS ON SCREEN RIGHT NOW: this kind tab, plus the shared-apartment
    // card below it (DR-0963). Still NOT every photo on the door -- a tick
    // left behind in another kind tab must not be dragged along, which is the
    // rule `shown` was carrying before the shared card existed.
    const visible = [...shown, ...sharedPhotos];
    const ids = visible.filter((p) => chosen.has(p.id)).map((p) => p.id);
    if (!ids.length) return;
    setBulkSaid('');
    setMoving({ done: 0, total: ids.length });
    let saved = 0;
    for (const id of ids) {
      const r = await onPatch?.(id, patch);
      if (!r || r.ok !== false) saved += 1;
      setMoving({ done: saved, total: ids.length });
    }
    setMoving(null);
    setBulkSaid(say(saved, ids.length));
    setChosen(new Set());
  };

  // Reorder a picture: the pure model returns the patches, and this writes
  // exactly those (one for "cover", two for a nudge) through the same onPatch
  // that edits a caption. sort_order is not frozen by the 0154 trigger.
  const arrange = (intent) => {
    const { patches } = intent.cover
      ? makeCover(shown, intent.cover)
      : movePhoto(shown, intent.move, intent.dir);
    for (const p of patches) onPatch?.(p.id, p.patch);
  };

  // MANY AT ONCE (2026-08-28). Darrell: "we have multiple pictures upload etc...
  // all these features need to be applied as we build without needing to keep
  // saying it." Photographing an apartment is a plural act.
  //
  // Each file is compressed twice — the image and its thumbnail — and queued
  // with its own name and its own caption; one bad file is named and skipped
  // rather than killing the batch, and the queue is reviewable and removable
  // BEFORE anything is written.
  const pick = async (fileList, { captured = false } = {}) => {
    setError('');
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const added = [];
    const refused = [];
    for (const file of files) {
      if (!isLikelyImageFile(file)) { refused.push(`${file.name} (not an image)`); continue; }
      try {
        const dataUrl = await compressImageFile(file, FULL_MAX_WIDTH, FULL_QUALITY);
        const thumbUrl = await compressImageFile(file, THUMB_MAX_WIDTH, THUMB_QUALITY);
        added.push({
          key: `${file.name}-${added.length}-${Date.now()}`,
          dataUrl, thumbUrl, bytes: dataUrlBytes(dataUrl), name: file.name, caption: '',
          takenAt: captured ? new Date().toISOString() : null,
        });
      } catch (e) {
        // image.js rejects with a real Error, so this says what actually
        // happened rather than "unknown error" (the 2026-07-07 report class).
        refused.push(`${file.name} (${e.message || 'could not be read'})`);
      }
    }
    setPending((q) => [...q, ...added]);
    if (refused.length) setError(`Skipped ${refused.length}: ${refused.join(', ')}`);
  };

  const drop = (key) => setPending((q) => q.filter((x) => x.key !== key));
  const captionOf = (key, caption) => setPending((q) => q.map((x) => (x.key === key ? { ...x, caption } : x)));

  // A PICTURE IS NOT GONE UNTIL IT IS SAVED (DR-0907). Darrell, 2026-10-10,
  // after the HEIC fix let fourteen move-out photographs in at last: "Would
  // let me upload however didn't take them".
  //
  // WHAT THIS USED TO DO, and all three parts matter:
  //   pending.forEach((pic) => { onAdd?.({...}); });   // async, NOT awaited
  //   setPending([]);                                  // cleared regardless
  //
  //   1. Fourteen inserts fired AT ONCE, each carrying a ~226KB data URL, and
  //      each handler then reloading the door — twenty-eight more reads on top.
  //   2. THE QUEUE WAS EMPTIED BEFORE A SINGLE RESULT CAME BACK. Anything that
  //      failed — size, a dropped connection, RLS, a hiccup under fourteen-way
  //      concurrency — was gone from the screen with nothing left to retry and
  //      no copy of the file. The thumbnails vanished, so it LOOKED saved.
  //   3. Failures were announced through a six-second toast called fourteen
  //      times, each stomping the last, so a partial failure read as success.
  //
  // Now: one at a time (the picker already reads files serially, so this
  // matches), only what actually saved leaves the queue, and the tally is the
  // truth. A photograph of a unit at move-out cannot be re-taken.
  const submit = async () => {
    if (!pending.length) { setError('Choose at least one picture first.'); return; }
    if (saving) return;
    setSaving(true);
    setError('');
    setReport(null);
    // A picture's OWN caption wins. The set caption is the honest reading of
    // one box above many files: it names the set, numbered, for any picture
    // that was not given its own words.
    const setCaption = f.caption.trim();
    const total = pending.length;
    const kept = [];
    const lost = [];
    const done = [];
    for (let i = 0; i < pending.length; i += 1) {
      const pic = pending[i];
      const own = (pic.caption || '').trim();
      const caption = own
        || (setCaption && total > 1 ? `${setCaption} (${i + 1} of ${total})` : setCaption);
      let res;
      try {
        res = await onAdd?.({
          instance_id: door?.instance_id,
          rental_ref: door?.id,
          room_id: f.roomId || null,
          kind: f.kind,
          caption,
          storage_path: pic.dataUrl,
          thumb_path: pic.thumbUrl,
            // WHEN IT WAS TAKEN, NOT WHEN IT WAS UPLOADED (DR-0908). Darrell:
          // "allow me to enter the correct dates for photos... they will sort
          // my move out dates". taken_at has existed since 0153 ("when the
          // shutter fired, if known"), is indexed, and is what photo-order and
          // the door timeline already sort by — and it was written ONLY for a
          // photo captured in the app this second. A set chosen from the phone
          // had none, so a move-out set from three weeks ago sorted as though
          // it were taken the moment it was uploaded. A typed date is the
          // truth the person holds; the in-app shutter still wins when it
          // fired here.
          taken_at: pic.takenAt || takenAtIso(f.takenOn) || null,
        });
      } catch (e) {
        res = { ok: false, reason: (e && e.message) || 'failed' };
      }
      // An onAdd that answers nothing is treated as a SUCCESS, because that is
      // what every caller before this change did and a false "lost" would be
      // its own lie. The one in PropertiesApp returns a real result.
      if (res && res.ok === false) {
        lost.push({ pic, why: res.reason || 'could not be saved' });
        kept.push(pic);
      } else {
        // The set's UNNUMBERED caption is the name given; "(2 of 5)" is not.
        done.push({ name: pic.name, caption: own || setCaption });
      }
      setSaved({ done: i + 1, total });
    }
    // ONLY what saved leaves. What failed stays on screen with its caption and
    // its thumbnail, ready to try again.
    setPending(kept);
    setSaving(false);
    setSaved(null);
    // ONE REFRESH FOR THE WHOLE SET, NOT ONE PER PICTURE (DR-0947).
    //
    // Darrell, 2026-10-10, watching twelve move-out photographs go up: "The
    // flow of uploading pictures is not working well... it keeps flashing...
    // and pausing the coming back with new images about 20 seconds later".
    //
    // The cause was here, and it was ours. onAdd is awaited INSIDE the loop
    // above (DR-0907 made the save serial, correctly), and the handler it
    // calls in PropertiesApp ended with `loadDoorData(); boot();` — boot()
    // being the WHOLE APP bootstrap: doors, grants, household, rentals. So a
    // twelve-picture set ran twelve full bootstraps and twelve door reloads,
    // interleaved with the writes, each of them seconds long on the throttled
    // cross-origin road. That is precisely a screen that flashes, stalls, and
    // repopulates twenty seconds later.
    //
    // It very likely cost him pictures, too. His run reported "Skipped 2 ...
    // The requested file could not be read, typically due to permission
    // problems that have occurred after a reference to a file was acquired" —
    // the browser's NotReadableError, which is what an Android file handle
    // gives once the page has churned long enough underneath it. Fewer
    // remounts, longer-lived handles.
    //
    // The saves still happen one at a time; only the REFRESH is hoisted out.
    await onDone?.();
    // A NAME TYPED ONCE IS OFFERED AFTER (DR-1235): every caption a SAVED
    // picture carries (its own, or the set's unnumbered one) joins the
    // instance's names; a numbered "(2 of 5)" is not a name anyone gave.
    if (namesOps && typeof namesOps.remember === 'function' && door?.instance_id) {
      const given = new Set();
      for (const d of done) if (d.caption) given.add(d.caption);
      for (const name of given) {
        if (!isNewPictureName(name, knownNames)) continue;
        try { const r = await namesOps.remember(door.instance_id, name); if (r && r.ok) setKnownNames((k) => mergePictureNames([], k.concat([name]))); } catch { /* the picture is saved; the name is offered next read */ }
      }
    }
    // THE FINALIZE LIST (DR-0908). Darrell asked for it by name: "a finalize
    // list of uploaded images and a where to store". A toast cannot be that —
    // it is gone in six seconds and fourteen of them overwrite each other.
    // This is a panel that STAYS, names every file and its outcome, and says
    // where the saved ones went.
    setReport({
      at: Date.now(),
      saved: done.map((d) => d.name),
      lost: lost.map((l) => ({ name: l.pic.name, why: l.why })),
      total,
      where: {
        door: [door?.label, door?.unit].filter(Boolean).join(' \u00b7 ') || null,
        kind: f.kind,
        room: f.roomId ? (rooms.find((r) => r.id === f.roomId)?.name || null) : null,
      },
    });
    if (lost.length) return;
    // KEEP THE KIND. A move-out set arrives in batches; reverting to
    // 'listing' between them is how an advertising photo gets made by
    // accident. Only the caption and room clear.
    // The DATE is kept with the kind: a move-out set is one day's work in
    // several batches, and retyping it each time is how half a set ends up
    // dated differently from the other half.
    setF((p) => ({ caption: '', kind: p.kind, roomId: '', takenOn: p.takenOn }));
  };

  // Open a picture: draw what we have at once, then swap in the full image the
  // moment it arrives. A picture whose bytes cannot be fetched stays at its
  // thumbnail rather than going blank.
  const openAt = async (idx) => {
    setOpen(idx);
    const p = viewable[idx];
    if (!p || full[p.id] || p.storage_path || typeof loadImage !== 'function') return;
    try {
      const src = await loadImage(p.id);
      if (src) setFull((m) => ({ ...m, [p.id]: src }));
    } catch { /* the thumbnail stays up */ }
  };

  const field = 'w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]';
  const lbl = 'block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1';
  const pickBtn = 'inline-flex items-center justify-center text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-[#2F5D50]';
  const roomName = (id) => rooms.find((r) => r.id === id)?.name || null;

  return (
    <>
      {canAdd && (
        <Card title="Add a picture">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="sm:col-span-2">
              <span className={lbl}>Pictures</span>
              <div className="flex flex-wrap gap-2">
                {/* THE CAMERA, DIRECTLY. capture="environment" opens the back
                    camera on a phone instead of a chooser; a desktop browser
                    ignores it and offers files, which is the right fallback. */}
                <label className={`${pickBtn} bg-[#2F5D50] text-white border-[#2F5D50]`}>
                  Take a photo
                  <input
                    type="file" accept="image/*" capture="environment" className="sr-only"
                    aria-label="Take a photo with the camera"
                    onChange={(e) => { pick(e.target.files, { captured: true }); e.target.value = ''; }}
                  />
                </label>
                <label className={`${pickBtn} border-[#1A1815] text-[#1A1815] bg-white`}>
                  Choose from this phone
                  <input
                    type="file" accept="image/*" multiple className="sr-only"
                    aria-label="Choose pictures already on this device"
                    onChange={(e) => { pick(e.target.files); e.target.value = ''; }}
                  />
                </label>
              </div>
              <span className="block text-[0.75rem] text-[#6B665E] mt-1">Take as many as you like — they queue up below, each with its own caption.</span>
            </div>
            <div className="sm:col-span-2">
              <span className={lbl}>Caption for the set</span>
              <CaptionField
                value={f.caption} onChange={(v) => setF((p) => ({ ...p, caption: v }))}
                placeholder="What these show, if one line covers them all" label="the caption for the set"
                options={knownNames}
              />
            </div>
            <label><span className={lbl}>What is it</span>
              <select
                className={field} value={f.kind}
                data-testid="photo-kind"
                onChange={(e) => {
                  rememberKind(e.target.value);
                  setF((p) => ({ ...p, kind: e.target.value }));
                  // "Maybe choosing a move out conditions should show those
                  // images" — saying what you are about to add is also saying
                  // what you want to look at (DR-0908).
                  setOnly(e.target.value);
                }}
              >
                {/* The two purposes are SEPARATE and named, because they are
                    not two flavours of one thing (DR-0906). */}
                <optgroup label="A record — stays inside the app">
                  {RECORD_KINDS.map((k) => <option key={k} value={k}>{k.replace(/-/g, ' ')}</option>)}
                </optgroup>
                <optgroup label="Advertising — a stranger can see this">
                  {ADVERTISING_KINDS.map((k) => <option key={k} value={k}>{k.replace(/-/g, ' ')}</option>)}
                </optgroup>
              </select>
            </label>
            {/* THE DAY THEY WERE TAKEN (DR-0908). Optional, and never a gate —
                an upload is not refused for want of a date. Empty means the
                record says "unknown" rather than claiming the upload day,
                which is what it did before and is how a move-out set from
                three weeks ago sorted as though it were taken this minute. */}
            <label><span className={lbl}>When were these taken</span>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local" className={field} value={f.takenOn}
                  data-testid="photo-taken-on"
                  max={nowLocalInput()}
                  onChange={(e) => setF((p) => ({ ...p, takenOn: e.target.value }))}
                />
                {f.takenOn && (
                  <button
                    type="button" onClick={() => setF((p) => ({ ...p, takenOn: '' }))}
                    data-testid="photo-taken-clear"
                    className="text-[0.625rem] uppercase tracking-wider px-2 py-2 min-h-[36px] border border-[#E8E4DC] text-[#6B665E] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
                  >Unknown</button>
                )}
              </div>
              <span className="block text-[0.625rem] text-[#6B665E] mt-0.5">
                {f.takenOn
                  ? 'These sort by this, not by when they were uploaded. Change it if the set is from another day.'
                  : 'Left unknown. The record will say the day is not known rather than guessing the upload day.'}
              </span>
            </label>
            {/* A DROPDOWN NEVER DEAD-ENDS (2026-08-28). On a door with no rooms
                this offered exactly one choice — "Not a specific room" — with no
                way to make one without abandoning the pictures already queued.
                Choosing "Add a room" opens a box right here; the room is created
                and selected without leaving the form. */}
            <label><span className={lbl}>Room</span>
              <select
                className={field}
                value={f.roomId}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__add__') { setNewRoom(' '); return; }
                  setNewRoom('');
                  setF((p) => ({ ...p, roomId: v }));
                }}
              >
                <option value="">{live.length ? 'Not a specific room' : 'No rooms yet — not a specific room'}</option>
                {live.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                {onAddRoom && <option value="__add__">+ Add a room…</option>}
              </select>
            </label>
            {newRoom !== '' && onAddRoom && (
              <label className="sm:col-span-2"><span className={lbl}>New room</span>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text" className={`${field} flex-1`} autoFocus
                    value={newRoom.trim()} placeholder="Kitchen, Bedroom 1, Porch…"
                    onChange={(e) => setNewRoom(e.target.value || ' ')}
                  />
                  <Btn
                    tone="primary" disabled={busy || !newRoom.trim()}
                    onClick={async () => {
                      const name = newRoom.trim();
                      if (!name) return;
                      const created = await onAddRoom(name);
                      // Select it the moment it exists, so the picture he already
                      // queued lands in the room he just made.
                      if (created?.id) setF((p) => ({ ...p, roomId: created.id }));
                      setNewRoom('');
                    }}
                  >Add room</Btn>
                  <Btn onClick={() => setNewRoom('')}>Cancel</Btn>
                </div>
              </label>
            )}
          </div>
          {pending.length > 0 && (
            <ul className="mt-2 space-y-2">
              {pending.map((pic) => (
                <li key={pic.key} className="flex items-start gap-2 text-[0.8125rem] text-[#6B665E]">
                  <img src={pic.thumbUrl || pic.dataUrl} alt="" className="h-12 w-12 object-cover border border-[#E8E4DC] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <CaptionField
                      value={pic.caption} onChange={(v) => captionOf(pic.key, v)}
                      placeholder="Say or type what this one shows" label={`the caption for ${pic.name}`}
                      options={knownNames}
                    />
                    <span className="block leading-snug mt-0.5">{pic.name} — about {Math.round(pic.bytes / 1024)}KB{pic.takenAt ? ' · taken just now' : ''}</span>
                  </div>
                  <button
                    type="button" onClick={() => drop(pic.key)}
                    aria-label={`Remove ${pic.name}`}
                    className="text-[0.75rem] uppercase tracking-wider text-[#8C2F2F] px-2 py-1 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
                  >Remove</button>
                </li>
              ))}
            </ul>
          )}
          {/* ADVERTISING SAYS SO, LOUDLY. This sentence existed and was grey
              body text under a control that DEFAULTED to advertising, so it
              read as reassurance rather than as a warning. It is now the
              exception, shown only when a person has deliberately chosen the
              one public kind, and it is marked. */}
          {isAdvertising(f.kind) && (
            <p
              className="text-[0.8125rem] text-[#8C2F2F] leading-relaxed mt-1 border-l-2 border-[#8C2F2F] pl-2"
              data-testid="advertising-warning"
              role="status"
            >
              <strong>This is advertising, not a record.</strong> A <strong>listing</strong> picture is the
              only kind a stranger can ever see — and only while this door is advertised and nobody lives
              in it. For a move-out set, damage, or a before and after, pick one of the record kinds above
              and it stays inside the app.
            </p>
          )}
          {error && <p className="text-[0.8125rem] text-[#8C2F2F] mt-2">{error}</p>}

          {/* THE PROGRESS BAR (DR-0908). Darrell asked for it by name, and the
              reason is not decoration: the writes stall (see cloud.js's
              deadline note), and a button that only greys out is how a person
              decides the app has hung. A bar that MOVES says the difference
              between working and stuck. */}
          {saving && savedSoFar && (
            <div className="mt-2" data-testid="upload-progress">
              <div
                role="progressbar"
                aria-valuemin={0} aria-valuemax={savedSoFar.total} aria-valuenow={savedSoFar.done}
                aria-label="Saving pictures"
                className="h-2 w-full bg-[#E8E4DC] border border-[#E8E4DC]"
              >
                <div
                  className="h-full bg-[#2F5D50]"
                  style={{ width: `${Math.round((savedSoFar.done / Math.max(1, savedSoFar.total)) * 100)}%` }}
                />
              </div>
              <p className="text-[0.75rem] text-[#6B665E] mt-1">
                Saving {savedSoFar.done} of {savedSoFar.total} — each one is written before the next starts,
                so nothing is lost if this is interrupted.
              </p>
            </div>
          )}

          {/* THE FINALIZE LIST. Stays until dismissed, names every file, and
              says WHERE the saved ones went — "or store it in the prechosen
              location", which it does: the kind and room chosen above. */}
          {report && (
            <div className="mt-2 border border-[#E8E4DC] bg-white p-2" data-testid="upload-report">
              <p className="text-[0.625rem] uppercase tracking-[0.25em] text-[#2F5D50] mb-1">
                {report.lost.length ? 'Some did not save' : 'Added'}
              </p>
              <p className="text-[0.8125rem] text-[#1A1815]">
                <strong>{report.saved.length} of {report.total}</strong> saved
                {report.where.door ? <> to <strong>{report.where.door}</strong></> : null}
                {' '}as <strong>{String(report.where.kind).replace(/-/g, ' ')}</strong>
                {report.where.room ? <> in <strong>{report.where.room}</strong></> : ', not filed to a room'}.
              </p>
              {report.saved.length > 0 && (
                <ul className="mt-1 text-[0.75rem] text-[#6B665E]" data-testid="upload-report-saved">
                  {report.saved.map((n) => <li key={n}>{n} — saved</li>)}
                </ul>
              )}
              {report.lost.length > 0 && (
                <ul className="mt-1 text-[0.75rem] text-[#8C2F2F]" data-testid="upload-report-lost">
                  {report.lost.map((l) => <li key={l.name}>{l.name} — NOT saved ({l.why}) · still in the list above</li>)}
                </ul>
              )}
              <button
                type="button" onClick={() => setReport(null)}
                data-testid="upload-report-dismiss"
                className="mt-1 text-[0.625rem] uppercase tracking-wider text-[#2F5D50] px-2 py-1 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
              >Done</button>
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {/* SAYING WHERE IT HAS GOT TO (DR-0907). Fourteen photographs
                saved one at a time is a real wait, and a button that only
                greys out is how a person decides it has hung and leaves —
                which, before this change, genuinely lost the ones not yet
                written. */}
            <Btn
              tone="primary" onClick={submit}
              disabled={busy || saving || !pending.length}
              data-testid="add-to-gallery"
            >
              {saving
                ? `Saving ${savedSoFar ? `${savedSoFar.done} of ${savedSoFar.total}` : ''}\u2026`.replace('  ', ' ')
                : (pending.length > 1 ? `Add ${pending.length} to the gallery` : 'Add to the gallery')}
            </Btn>
            {/* A DISABLED CONTROL SAYS WHY. A greyed button with no sentence
                beside it is the app refusing without explaining itself. */}
            {!pending.length && (
              <span className="text-[0.8125rem] text-[#6B665E]">Take or choose at least one picture to enable this.</span>
            )}
          </div>
        </Card>
      )}

      {canAdd && hasBridgeToken() && (
        <NasShelf door={door} archive={archive} nasFiled={nasFiled} recordKind={isAdvertising(f.kind) ? rememberedKind() : f.kind} onAdd={onAdd} onDone={onDone} />
      )}

      {/* WHAT IS THIS DOOR'S AND WHAT IS SHARED (DR-1022). Darrell read
          "PICTURES (3)" over a door whose buttons said "Tick all 40 shown"
          and concluded 37 were gone; they were in the shared card below.
          The heading now says both counts when the apartment lends any. */}
      <Card title={only
        ? `${only.replace(/-/g, ' ')} (${shown.length} of ${allShots.length})`
        : (sharedPhotos.length ? `Pictures (${allShots.length} of this door · ${sharedPhotos.length} shared with the apartment, below)` : `Pictures (${allShots.length})`)}>
        {/* LOOK BY KIND (DR-0908). Only the kinds this door actually has, so
            the strip never offers an empty answer. "Every kind" stays first
            and is the default. */}
        {allShots.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2" role="tablist" aria-label="Which pictures" data-testid="gallery-kinds">
            <button
              type="button" role="tab" aria-selected={only === null}
              onClick={() => setOnly(null)}
              data-testid="gallery-kind-all"
              className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[32px] border ${
                only === null ? 'bg-[#2F5D50] text-white border-[#2F5D50]' : 'bg-white text-[#1A1815] border-[#E8E4DC]'}`}
            >Every kind ({allShots.length})</button>
            {/* EVERY OPTION SHOWS ITS IMAGES (DR-0908). Darrell: "All options
                show their images". So the kinds this door HAS are listed with
                their counts, and the one currently being looked at or added is
                always listed too — picking a kind must never lead to a strip
                that has forgotten it. */}
            {[...new Set([...counts.keys(), ...(only ? [only] : []), f.kind])].map((k) => (
              <button
                key={k} type="button" role="tab" aria-selected={only === k}
                onClick={() => setOnly(k)}
                className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[32px] border ${
                  only === k ? 'bg-[#2F5D50] text-white border-[#2F5D50]' : 'bg-white text-[#1A1815] border-[#E8E4DC]'}`}
              >{k.replace(/-/g, ' ')} ({counts.get(k) || 0})</button>
            ))}
          </div>
        )}
        {/* TICK THEM AND MOVE THEM (DR-0949, DR-0951, DR-0961). No arming
            step: the checkmarks are on the pictures themselves, in whichever
            kind tab he is looking at, and the first button names the move he
            actually keeps making. */}
        {/* BED B HAS NO PICTURES OF ITS OWN and must still get the buttons
            (DR-0963): gating this on `allShots.length > 1` alone would have
            shipped a shared card with nothing able to act on it, which is the
            half-feature he has now caught me at twice. */}
        {canManage && allShots.length + sharedPhotos.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Btn
              onClick={() => setChosen(new Set([...shown, ...sharedPhotos].map((p) => p.id)))}
              data-testid="gallery-choose-all"
            >{`Tick all ${shown.length + sharedPhotos.length} shown`}</Btn>
            {chosen.size > 0 && (
              <Btn
                onClick={() => { setChosen(new Set()); setBulkSaid(''); }}
                data-testid="gallery-choose-none"
              >Untick all</Btn>
            )}
            <span className="text-[0.75rem] text-[#5A5751]" data-testid="gallery-chosen-count">
              {chosen.size === 0 ? 'Tick the pictures you want to move' : `${chosen.size} ticked`}
            </span>
            {/* THE ONE-TAP PATH, NAMED FOR WHAT IT DOES. Everything else on
                this bar is still here; this is simply the move he asked for by
                name, without going through a field picker and a kind picker
                first. It carries the same red sentence underneath, because it
                is the same change: a record becoming advertising (DR-0906). */}
            {chosen.size > 0 && (
              <Btn
                tone="primary" disabled={busy || !!moving}
                data-testid="gallery-move-to-listing"
                onClick={() => applyToChosen({ kind: 'listing' }, (saved, total) => `${saved} of ${total} are now listing.`)}
              >{moving ? `Moving ${moving.done} of ${moving.total}…` : `Move ${chosen.size} to listing`}</Btn>
            )}
            {/* THE RED SENTENCE RIDES THE BUTTON IT BELONGS TO (DR-0906,
                DR-0961). The one-tap path is one tap from public, so the
                warning is on screen whenever that button is. The field-picker
                path keeps its own warning for the OTHER advertising kinds,
                and excludes 'listing' so the two never stack. */}
            {chosen.size > 0 && (
              <p className="w-full text-[0.75rem] text-[#B85838] leading-snug" data-testid="gallery-move-to-listing-warning">
                <strong>Moving to listing makes them advertising.</strong> A listing picture
                is the only kind a stranger can see — and only while this door is advertised
                and nobody lives in it. The pictures are not copied; these same ones move.
              </p>
            )}
            {chosen.size > 0 && (
              <>
                <select
                  className="text-sm border border-[#E8E4DC] px-2 py-2 bg-white text-[#1A1815]"
                  value={bulkField} aria-label="What to set for the chosen pictures"
                  data-testid="gallery-bulk-field"
                  onChange={(e) => setBulkField(e.target.value)}
                >
                  <option value="room">Set the room</option>
                  <option value="kind">Set what it is</option>
                </select>
                {bulkField === 'room' ? (
                  <select
                    className="text-sm border border-[#E8E4DC] px-2 py-2 bg-white text-[#1A1815]"
                    value={bulkRoom} aria-label="Room for the chosen pictures"
                    data-testid="gallery-bulk-room"
                    onChange={(e) => setBulkRoom(e.target.value)}
                  >
                    <option value="">Not a specific room</option>
                    {live.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                ) : (
                  /* THE SAME TWO NAMED GROUPS AS THE ADD PANEL (DR-0906): they
                     are not two flavours of one thing. */
                  <select
                    className="text-sm border border-[#E8E4DC] px-2 py-2 bg-white text-[#1A1815]"
                    value={bulkKind} aria-label="What the chosen pictures are"
                    data-testid="gallery-bulk-kind"
                    onChange={(e) => setBulkKind(e.target.value)}
                  >
                    <optgroup label="A record — stays inside the app">
                      {RECORD_KINDS.map((k) => <option key={k} value={k}>{k.replace(/-/g, ' ')}</option>)}
                    </optgroup>
                    <optgroup label="Advertising — a stranger can see this">
                      {ADVERTISING_KINDS.map((k) => <option key={k} value={k}>{k.replace(/-/g, ' ')}</option>)}
                    </optgroup>
                  </select>
                )}
                <Btn
                  tone="primary" disabled={busy || !!moving}
                  data-testid="gallery-bulk-apply"
                  onClick={() => {
                    const patch = bulkField === 'kind'
                      ? { kind: bulkKind }
                      : { room_id: bulkRoom || null };
                    const where = bulkField === 'kind'
                      ? bulkKind.replace(/-/g, ' ')
                      : (bulkRoom
                        ? (live.find((r) => r.id === bulkRoom)?.name || 'that room')
                        : 'no specific room');
                    return applyToChosen(patch, (saved, total) => (
                      bulkField === 'kind'
                        ? `${saved} of ${total} are now ${where}.`
                        : `${saved} of ${total} filed to ${where}.`
                    ));
                  }}
                >{moving
                  ? `Moving ${moving.done} of ${moving.total}…`
                  : (bulkField === 'kind' ? `Change ${chosen.size}` : `File ${chosen.size} here`)}</Btn>
              </>
            )}
            {/* HOW FAR IT HAS GOT (DR-0961). A real bar driven by the loop's
                own counter, not a spinner: eighteen pictures is eighteen
                separate writes and a long enough wait to abandon. */}
            {moving && (
              <div className="w-full" data-testid="gallery-move-progress">
                <div className="h-2 w-full bg-[#E8E4DC]" role="progressbar"
                  aria-valuenow={moving.done} aria-valuemin={0} aria-valuemax={moving.total}
                  aria-label="Moving the ticked pictures">
                  <div className="h-2 bg-[#2F5D50]" style={{ width: `${Math.round((moving.done / Math.max(moving.total, 1)) * 100)}%` }} />
                </div>
                <span className="text-[0.75rem] text-[#5A5751]">
                  {`Moving ${moving.done} of ${moving.total}… don’t leave this screen.`}
                </span>
              </div>
            )}
            {chosen.size > 0 && bulkField === 'kind' && isAdvertising(bulkKind) && bulkKind !== 'listing' && (
              /* THE SAME EXCEPTION IN THE SAME RED REGISTER as the add panel
                 (DR-0906). Turning records into advertising is exactly what he
                 asked for — "move pictures to the advertisement sections ...
                 I don't want to have to re-upload when we already have them" —
                 and it is also the one change that makes a picture of the
                 inside of a place publicly visible. Offered, and said plainly,
                 on the same screen as the button. */
              <p className="w-full text-[0.75rem] text-[#B85838] leading-snug" data-testid="gallery-bulk-advertising">
                <strong>This makes them advertising.</strong> A listing picture is the only
                kind a stranger can see — and only while this door is advertised and nobody
                lives in it. The pictures are not copied; these same ones move.
              </p>
            )}
            {bulkSaid && (
              <span className="text-[0.75rem] text-[#2F5D50]" data-testid="gallery-bulk-said">{bulkSaid}</span>
            )}
          </div>
        )}
        {only && shown.length === 0 && (
          <p className="text-sm text-[#6B665E] mb-2">
            No {only.replace(/-/g, ' ')} pictures at this door yet.
          </p>
        )}
        {shown.length === 0 && unread ? (
          /* THE DOOR WAS NOT READ, SO IT IS NOT EMPTY (DR-0946). Darrell,
             2026-10-10: "What happened to the pictures in Apartment 2?!" The
             photo list carries thumb_path — base64 — so a full gallery is
             about a megabyte in one response, and with Pages Functions dark
             the app is on the throttled cross-origin road. The read fails and
             the rows are untouched on the NAS. Saying "none yet" about a
             landlord's move-out evidence is the app inventing an absence, and
             it is the one thing this surface must never do. */
          <p className="text-sm text-[#B85838]" data-testid="gallery-unread">
            These could not be loaded just now — that is not the same as there being none.
            Nothing has been lost; try again in a moment.
          </p>
        ) : allShots.length === 0 ? (
          /* ONLY WHEN THE DOOR REALLY HAS NONE (DR-0947). This branch tested
             `shown`, the FILTERED list, so picking "move out condition" on a
             door holding ten listing shots printed BOTH "No move out condition
             pictures at this door yet." AND "No pictures on this property
             yet." — two sentences, one of them false, directly under a header
             reading "10 pictures". Darrell saw exactly that while hunting for
             his move-out set, which is the worst possible moment to be told
             the door is bare. The filtered case is already said above, once,
             and accurately. */
          /* AND IT SAYS WHAT KIND OF NONE (DR-1162). Darrell, 2026-10-21: the
             worker's tab on 709 Commercial St read "No pictures on this
             property yet" while the door's NAS archive held 121. Nothing is
             filed to the RECORD; the archive is a different shelf, behind
             the family key, and the sentence says so from the seat that can
             do something about it. */
          <Empty>
            No pictures filed to this door&rsquo;s record yet.
            {canAdd && hasBridgeToken() && archive
              ? ' This door’s NAS archive is below: file some or all, and everyone on this door sees them.'
              : archive ? ' The family keeps this door’s archive on the NAS; what they file shows here.' : ''}
          </Empty>
        ) : shown.length === 0 ? null : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {shown.map((p, idx) => (
              <li key={p.id} className="border border-[#E8E4DC] bg-white p-2">
                <div className="relative">
                  {/* ON EVERY PICTURE, IN EVERY SECTION (DR-0961), not behind
                      a mode. The picture underneath still opens on tap; this
                      is its own target in the corner. */}
                  {canManage && allShots.length + sharedPhotos.length > 1 && (
                    <label className="absolute top-1 right-1 z-10 bg-white border border-[#E8E4DC] px-1.5 py-1 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox" checked={chosen.has(p.id)}
                        aria-label={`Choose ${p.caption || p.kind}`}
                        data-testid={`gallery-choose-${p.id}`}
                        onChange={(e) => setChosen((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(p.id); else next.delete(p.id);
                          return next;
                        })}
                      />
                    </label>
                  )}
                  <button type="button" onClick={() => openAt(idx)} className="block w-full cursor-zoom-in" aria-label={`Open ${p.caption || p.kind}`}>
                    <SharpPicture photo={p} loadImage={loadImage} loadThumb={loadThumb} alt={p.caption || p.kind} className="aspect-square w-full object-cover" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-[#2F5D50] text-white text-[0.625rem] uppercase tracking-wider px-1.5 py-0.5">Cover</span>
                  )}
                </div>
                {editing === p.id ? (
                  <PhotoEditor
                    photo={p} rooms={live} busy={busy} onAddRoom={onAddRoom}
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

      {/* =====================================================================
          THE REST OF THE APARTMENT (DR-0963)
          =====================================================================
          Darrell, 2026-10-11, on Bed B of Apt 4 reading "PICTURES (0)":
          "Same options as the other co-living tenant... pictures are already
          available for this place apartment 4... remember?" and "Where are
          the images... they should be able to be used here too!!!!!!!"

          Its own card, not folded into the gallery above, because WHOSE these
          are is a fact the screen must keep saying. Each one still lives on
          the sibling door; nothing is copied (0154 freezes storage_path, so a
          copy would mean re-photographing the same wall — the exact waste he
          has now refused twice). Working on one here works on the real row,
          which serves both doors at once, and that is the point of a shared
          home rather than a limitation of it. */}
      {canManage && (sharedUnread || sharedPhotos.length > 0) && (
        <Card title={placedBuilding.length ? `Shared with this door (${sharedPhotos.length})` : `Shared with this apartment (${sharedPhotos.length})`}>
          {sharedUnread ? (
            /* A READ THAT FAILED IS NOT AN APARTMENT WITH NO PICTURES
               (DR-0946). Saying "none" here would be the same invented
               absence, one door over. */
            <p className="text-sm text-[#8C2F2F]" data-testid="gallery-shared-unreadable">
              The rest of this apartment could not be read just now — this is not
              the same as there being none. Pull down to try again.
            </p>
          ) : (
            <>
              {placedBuilding.length > 0 && (
                <p className="text-[0.8125rem] text-[#5A5751] mb-2" data-testid="gallery-shared-building-note">
                  <strong>{placedBuilding.length} {placedBuilding.length === 1 ? 'is' : 'are'} from elsewhere in the building</strong>,
                  placed on this door from the building&rsquo;s pictures below. Each still lives on its own apartment&rsquo;s door.
                </p>
              )}
              {apartmentShared.length > 0 && (
              <p className="text-[0.8125rem] text-[#5A5751] mb-2" data-testid="gallery-shared-note">
                These live on {sharedDoors.length === 1
                  ? <strong>{sharedDoors[0].display_name || 'the other door'}</strong>
                  : <strong>{sharedDoors.length} other doors</strong>} in this same
                apartment, and they advertise this door too, with no need to photograph
                the kitchen and the halls again. <strong>The order and the cover here are
                this listing&rsquo;s own</strong>: lead with the bedroom here and the other
                listing still leads with whatever it chose, so a visitor sees two different
                rooms before tapping anything. A caption or a tick changes the picture
                itself, on both listings.
              </p>
              )}
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sharedArranged.map((p, i) => (
                  <li key={p.id} className="border border-[#E8E4DC] bg-white p-2" data-testid={`gallery-shared-${p.id}`}>
                    <div className="relative">
                      {canManage && (
                        <label className="absolute top-1 right-1 z-10 bg-white border border-[#E8E4DC] px-1.5 py-1 flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox" checked={chosen.has(p.id)}
                            aria-label={`Choose ${p.caption || p.kind}`}
                            data-testid={`gallery-choose-${p.id}`}
                            onChange={(e) => setChosen((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(p.id); else next.delete(p.id);
                              return next;
                            })}
                          />
                        </label>
                      )}
                      <button
                        type="button" onClick={() => openAt(shown.length + i)}
                        aria-label={`Open ${p.caption || p.kind} large`}
                        data-testid={`gallery-shared-open-${p.id}`}
                        className="block w-full focus:outline focus:outline-2 focus:outline-[#2F5D50]"
                      >
                        <SharpPicture
                          photo={p} loadImage={loadImage} loadThumb={loadThumb}
                          alt={p.caption || p.kind} className="aspect-square w-full object-cover"
                        />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-[#5A5751] text-white text-[0.625rem] uppercase tracking-wider px-1.5 py-0.5">
                        {i === 0 ? 'This listing\u2019s cover' : 'Shared'}
                      </span>
                    </div>
                    <div className="text-[0.8125rem] text-[#1A1815] mt-1 leading-snug">
                      {p.caption || <em className="text-[#6B665E]">No caption</em>}
                    </div>
                    <div className="text-[0.6875rem] text-[#6B665E]">{p.kind.replace(/-/g, ' ')}</div>
                    {canManage && onArrangeShared && sharedArranged.length > 1 && (
                      <div className="flex flex-wrap gap-1 mt-1" data-testid={`gallery-shared-arrange-${p.id}`}>
                        <Btn onClick={() => arrangeShared(movePhoto(sharedArranged, p.id, -1))} disabled={i === 0} aria-label={`Move ${p.caption || p.kind} earlier in this listing`}>&larr;</Btn>
                        <Btn onClick={() => arrangeShared(movePhoto(sharedArranged, p.id, 1))} disabled={i === sharedArranged.length - 1} aria-label={`Move ${p.caption || p.kind} later in this listing`}>&rarr;</Btn>
                        <Btn onClick={() => arrangeShared(makeCover(sharedArranged, p.id))} disabled={i === 0}>Make this listing&rsquo;s cover</Btn>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      {canManage && (buildingUnread || buildingPhotos.length > 0) && (
        <BuildingPool
          photos={buildingPhotos} doors={buildingDoors} placed={buildingPlaced}
          unread={buildingUnread} loadImage={loadImage} loadThumb={loadThumb}
          onPlace={onPlaceBuilding} onUnplace={onUnplaceBuilding}
          nextPosition={Math.max(0, ...Object.values(sharedOrder || {}).map(Number).filter(Number.isFinite)) + 10}
        />
      )}

      {open !== null && viewable.length > 0 && (
        <Lightbox
          items={viewable.map((p, n) => ({
            src: full[p.id] || sharpestKnown(p),
            alt: p.caption || p.kind,
            caption: [p.caption, p.kind.replace(/-/g, ' '), roomName(p.room_id)].filter(Boolean).join(' · '),
            date: p.taken_at ? p.taken_at.slice(0, 10) : '',
            fileName: stampFileName(doorLabel, n + 1),
          }))}
          index={open}
          onClose={() => setOpen(null)}
          stamp={stamp}
        />
      )}
    </>
  );
}

/** Correct what a picture SAYS. The picture itself is frozen by a trigger (0154). */
/**
 * TWO DATES, TWO DIFFERENT KINDS OF FACT (DR-0943). Darrell, 2026-10-10:
 * "always put the uploaded dates... and the other option is default however
 * editable... however the upload dat never is".
 *
 *   uploaded_at — what the SYSTEM observed. Shown, never offered for editing,
 *                 and frozen in the database by 0261 so nothing here is the
 *                 only thing stopping it.
 *   taken_at    — what a PERSON says. Editable, because the app only ever
 *                 wrote it for an in-app capture, so a set chosen from a phone
 *                 had none and could never be given one.
 *
 * The immutable upload date is what makes the editable one safe: a photograph
 * that says "taken 28 September" and arrived on 10 October says both, to
 * anyone reading the record.
 */
// CHOOSE THE ROOM AFTER — INCLUDING ONE THAT DOES NOT EXIST YET (DR-0948).
//
// Darrell, 2026-10-10, with twelve move-out photographs just landed and this
// very editor open: "Need to be able to choose the rooms after.... make
// sense?" His screenshot shows why it was impossible: the room list offered
// "Not a specific room" and "Bedroom", and every photograph on his screen was
// a BATHROOM. The door has one room.
//
// He could already pick an EXISTING room here. What he could not do was make
// the missing one without leaving for the Rooms tab and losing his place in a
// grid of twelve. The ADD panel has had "+ Add a room…" inline since rooms
// shipped; this editor never got it, so the same person doing the same job
// five seconds later met a dead end. Same affordance, same onAddRoom, and the
// new room is selected the moment it exists.
function PhotoEditor({ photo, rooms, onSave, onAddRoom, busy }) {
  const [newRoom, setNewRoom] = useState('');
  const [f, setF] = useState(() => ({
    caption: photo.caption || '',
    kind: photo.kind,
    room_id: photo.room_id || '',
    takenOn: isoToLocalInput(photo.taken_at),
  }));
  // `was` is derived INSIDE the memo, from `photo` alone: built outside it is
  // a fresh object every render, so listing it as a dependency would rebuild
  // the diff on every keystroke and defeat the memo entirely.
  const edit = useMemo(() => buildEdit(
    {
      caption: photo.caption || '',
      kind: photo.kind,
      room_id: photo.room_id || '',
      taken_at: photo.taken_at || '',
    },
    { ...f, taken_at: takenAtIso(f.takenOn) || '' },
    [
      { key: 'caption', label: 'Caption' }, { key: 'kind', label: 'Kind' },
      { key: 'room_id', label: 'Room' }, { key: 'taken_at', label: 'Taken' },
    ],
  ), [photo, f]);
  const field = 'w-full border border-[#E8E4DC] px-1 py-1 text-[0.75rem] mt-1';
  return (
    <div className="mt-1">
      <input type="text" className={field} value={f.caption} onChange={(e) => setF((p) => ({ ...p, caption: e.target.value }))} placeholder="Caption" />
      <select className={field} value={f.kind} onChange={(e) => setF((p) => ({ ...p, kind: e.target.value }))}>
        {PHOTO_KINDS.map((k) => <option key={k} value={k}>{k.replace(/-/g, ' ')}</option>)}
      </select>
      <select
        className={field} value={f.room_id} data-testid="photo-edit-room"
        onChange={(e) => {
          const v = e.target.value;
          if (v === '__add__') { setNewRoom(' '); return; }
          setNewRoom('');
          setF((p) => ({ ...p, room_id: v }));
        }}
      >
        <option value="">Not a specific room</option>
        {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        {onAddRoom && <option value="__add__">+ Add a room…</option>}
      </select>
      {newRoom !== '' && onAddRoom && (
        <div className="flex gap-1 flex-wrap mt-1">
          <input
            type="text" className={`${field} flex-1 mt-0`} autoFocus
            value={newRoom.trim()} placeholder="Bathroom, Kitchen, Bedroom 2…"
            aria-label="Name the new room"
            data-testid="photo-edit-new-room"
            onChange={(e) => setNewRoom(e.target.value || ' ')}
          />
          <Btn
            tone="primary" disabled={busy || !newRoom.trim()}
            data-testid="photo-edit-add-room"
            onClick={async () => {
              const name = newRoom.trim();
              if (!name) return;
              const created = await onAddRoom(name);
              // Selected the instant it exists, so the picture he is already
              // editing lands in the room he just made — the whole point.
              if (created?.id) setF((p) => ({ ...p, room_id: created.id }));
              setNewRoom('');
            }}
          >Add room</Btn>
          <Btn onClick={() => setNewRoom('')}>Cancel</Btn>
        </div>
      )}
      <label className="block mt-1">
        <span className="text-[0.625rem] uppercase tracking-wider text-[#6B665E]">When it was taken</span>
        <input
          type="datetime-local" className={field} value={f.takenOn}
          data-testid="photo-edit-taken"
          max={nowLocalInput()}
          onChange={(e) => setF((p) => ({ ...p, takenOn: e.target.value }))}
        />
      </label>
      {/* THE ANCHOR, SHOWN AND NOT OFFERED. */}
      <p className="text-[0.625rem] text-[#6B665E] mt-1" data-testid="photo-uploaded-at">
        Uploaded {photo.uploaded_at ? new Date(photo.uploaded_at).toLocaleString() : 'at an unrecorded time'}
        {' '}— that never changes.
      </p>
      <p className="text-[0.625rem] text-[#6B665E] mt-1">The picture itself never changes — add a new one instead.</p>
      <div className="mt-1">
        <Btn
          tone="primary" disabled={busy || !edit.changed}
          data-testid="photo-edit-save"
          onClick={() => onSave(
            // "Unknown" must reach the column as NULL. An empty string into a
            // timestamptz is an error, not a clearing, and buildEdit carries
            // whatever it was handed.
            'taken_at' in edit.patch && !edit.patch.taken_at
              ? { ...edit.patch, taken_at: null }
              : edit.patch,
          )}
        >Save</Btn>
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
  // DR-1086: a property's paper opens INSIDE the app, with its record beside it
  // (DR-1085), like every other shelf; "Save a copy" in the viewer replaces the
  // old download link.
  const viewer = useDocumentViewer();
  const openDoc = (d) => viewer.open({
    title: d.title || 'Document',
    name: d.title || '',
    resolve: () => d.storage_path || null,
    record: propertyDocRecord({ ...d, tenancyName: d.tenancy_id ? (who(d.tenancy_id)?.tenant_name || '') : '' }, { admin: !!canManage }),
  });

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
      {viewer.element}
      {shown.length > 0 && (() => {
        const model = () => shelfReport(shown.map((d) => propertyDocRecord({ ...d, tenancyName: d.tenancy_id ? (who(d.tenancy_id)?.tenant_name || '') : '' }, { admin: !!canManage })), { title: 'Property documents' });
        return (
          <div className="mb-2">
            <ReportActions className="mb-2" label="Every paper on this door" filenameBase="property-documents" buildModel={model} />
            <ShelfLedger model={model()} items={shown} onOpen={openDoc} label="See every paper, sorted" />
          </div>
        );
      })()}
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
                      <button type="button" onClick={() => openDoc(d)} data-testid="property-doc-open" className="text-left text-[0.875rem] text-[#1A1815] underline focus:outline focus:outline-2 focus:outline-[#B85838]">{d.title}</button>
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
