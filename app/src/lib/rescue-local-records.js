// =============================================================================
// rescue-local-records — lift a door's records out of one browser, into Postgres
// =============================================================================
// THE PROBLEM THIS SOLVES, measured 2026-08-28 against the live database rather
// than the repo's schema files:
//
//   property_notes  — 4 real rows. The three 1508 Williamsburg notes and one on
//                     Apt 2 are ON THE SERVER. UnitManagement.jsx has been
//                     mirroring them all along. Not stranded.
//   property_rooms / property_systems / property_system_events /
//   property_photos — 0 rows.
//
// And in the Real Estate tab, five stores write to localStorage and nowhere
// else: conversationLog, maintenanceLog, rooms, equipment, and room photos.
// Whatever is in them exists in ONE browser on ONE phone. A cleared cache, a
// laptop, or Christina's device does not have them.
//
// This module is the pure half of the fix: it reads a device-local rental
// object and returns the ROWS that would carry its records to the server. It
// performs no I/O, touches no Supabase client, and reads no clock it was not
// given — so what it produces can be shown to the landlord BEFORE anything is
// written, and asserted against in a test without a database.
//
// THREE RULES IT KEEPS:
//
//   1. NEVER INVENT. A maintenance entry naming no machine gets system_ref
//      null (0159 made that legal), not a fabricated furnace. A note with no
//      date carries no date. An unreadable entry is SKIPPED and reported by
//      name, never quietly dropped and never padded into shape.
//
//   2. SAFE TO RUN TWICE. Every row carries legacy_id — the device-local id it
//      came from. The unique (rental_ref, legacy_id) indexes added in 0159 mean
//      a second press of the button updates instead of duplicating. The
//      landlord will press it again to see whether it worked; that must be
//      harmless.
//
//   3. SAY WHAT IS NOT CARRIED. Room photos are data URLs and property_photos
//      wants a storage path — a genuinely different mechanism, not a mapping.
//      They are counted and named in `deferred` so the summary tells the truth
//      about what stayed behind, rather than implying a complete rescue.
//
// TWO KEYS, NOT INTERCHANGEABLE (this bites every time it is forgotten):
//   property_notes.rental_ref   is TEXT — the local slug, 'r-1508williamsburg'
//   property_rooms / _systems / _system_events .rental_ref is UUID — rentals.id
// Both are correct for their own table. A caller must supply both.
// =============================================================================
import { inferSystemKind, SYSTEM_KINDS, EVENT_KINDS } from '../modules/properties/systems.js';
import { inferKind as inferRoomKind, ROOM_KINDS } from '../modules/properties/rooms.js';
import { NOTE_KINDS } from './property-notes.js';

const text = (v, cap = 8000) => String(v ?? '').trim().slice(0, cap);
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? '').trim());
const dateOrNull = (v) => (isDate(v) ? String(v).trim() : null);

const money = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// -----------------------------------------------------------------------------
// Vocabulary bridges. The Real Estate tab grew its own words years before these
// tables existed; the words are the landlord's, so they are translated here
// rather than being taken away from him.
// -----------------------------------------------------------------------------

// Equipment category (the tab's list) -> property_systems.kind.
export const EQUIPMENT_KIND = Object.freeze({
  'HVAC': 'heating',
  'Furnace': 'heating',
  'AC Unit': 'cooling',
  'Water Heater': 'water-heater',
  'Refrigerator': 'appliance',
  'Stove / Oven': 'appliance',
  'Dishwasher': 'appliance',
  'Washer': 'appliance',
  'Dryer': 'appliance',
  'Microwave': 'appliance',
  'Garbage Disposal': 'appliance',
  'Sump Pump': 'sump',
  'Roof': 'roof',
  'Electrical Panel': 'electrical',
  'Garage Door': 'other',
  'Other': 'other',
});

// Maintenance urgency -> property_system_events.kind. 'incident' is something
// that HAPPENED and 'repair' is something that was FIXED; anything the tab
// records without a recognizable urgency is a 'note', which is honest.
export const MAINT_EVENT_KIND = Object.freeze({
  emergency: 'issue',
  urgent: 'issue',
  incident: 'issue',
  repair: 'repaired',
  repaired: 'repaired',
  service: 'serviced',
  serviced: 'serviced',
  inspection: 'inspected',
  inspected: 'inspected',
  replacement: 'replaced',
  replaced: 'replaced',
  routine: 'serviced',
  planned: 'serviced',
});

/** The kind a rescued equipment row lands on, falling back to the name. */
export function systemKindFor(entry = {}) {
  const mapped = EQUIPMENT_KIND[text(entry.category, 60)];
  if (mapped && SYSTEM_KINDS.includes(mapped)) return mapped;
  const inferred = inferSystemKind(text(entry.category, 60) || text(entry.make, 60));
  return SYSTEM_KINDS.includes(inferred) ? inferred : 'other';
}

/** The kind a rescued maintenance entry lands on. Unknown urgency -> 'note'. */
export function eventKindFor(entry = {}) {
  const mapped = MAINT_EVENT_KIND[String(entry.urgency ?? '').trim().toLowerCase()];
  return mapped && EVENT_KINDS.includes(mapped) ? mapped : 'note';
}

// -----------------------------------------------------------------------------
// A conversation is a note. It always was.
//
// conversationLog holds { date, person, summary, notes } — "Adrianna, apartment
// 3, porch smoking" is the landlord's private memory of an exchange, which is
// exactly what property_notes is for and exactly what it is NOT: no tenant
// reads it (0062 grants a tenant no SELECT). tenant_messages would be the wrong
// home twice over — it needs a tenancy that does not exist, and it is a thread
// the household can read.
//
// The person's name leads the body so it survives; the kind is 'tenant', which
// is in the 0062 vocabulary. Nothing is reworded.
// -----------------------------------------------------------------------------
export function conversationToNote(entry = {}, { rentalSlug, unitLabel } = {}) {
  const summary = text(entry.summary, 4000);
  if (!summary) return null;
  const person = text(entry.person, 200);
  const tail = text(entry.notes, 3500);
  const body = [person ? `${person}: ${summary}` : summary, tail].filter(Boolean).join('\n\n');
  return {
    rental_ref: rentalSlug,
    unit_label: text(unitLabel, 120) || null,
    body: body.slice(0, 8000),
    kind: NOTE_KINDS.includes('tenant') ? 'tenant' : 'general',
    pinned: false,
    note_date: dateOrNull(entry.date),
    source: 'rescued-from-device',
    legacy_id: text(entry.id, 200) || null,
  };
}

/**
 * A device-local unit note that never reached the cloud.
 *
 * Most DID reach it — UnitManagement writes both — but a note typed while
 * signed out was saved locally and the mirror was skipped. Those are the ones
 * this carries. `existingNotes` is the cloud's current rows for this door; a
 * local note whose body and date already exist there is not sent again.
 */
export function unitNoteToRow(entry = {}, { rentalSlug, unitLabel } = {}) {
  const body = text(entry.body, 8000);
  if (!body) return null;
  return {
    rental_ref: rentalSlug,
    unit_label: text(entry.unit_label ?? entry.unitLabel ?? unitLabel, 120) || null,
    body,
    kind: NOTE_KINDS.includes(entry.kind) ? entry.kind : 'general',
    pinned: !!entry.pinned,
    note_date: dateOrNull(entry.note_date ?? entry.noteDate ?? entry.date),
    source: 'rescued-from-device',
    legacy_id: text(entry.id, 200) || null,
  };
}

// A cloud row and a local row are "the same note" when they say the same thing
// on the same day. Body-and-date rather than body alone: a landlord genuinely
// may write "Rent paid" every month, and collapsing those would erase eleven
// true records to keep one.
const noteFingerprint = (n) => `${text(n && n.body, 8000)}|${dateOrNull(n && (n.note_date ?? n.noteDate ?? n.date)) || ''}`;

// -----------------------------------------------------------------------------
// A room's items fold into its notes.
//
// property_rooms has name, kind, sort_order and notes — no items table. The
// tab's rooms carry items ({ name, status, notes }), which are the punch list
// for that room. Folding them into the notes text keeps every word the landlord
// typed; it does lose the per-item status TOGGLE, which is a real cost and is
// stated in the row's own text rather than hidden.
// -----------------------------------------------------------------------------
export function roomNotesText(entry = {}) {
  const items = Array.isArray(entry.items) ? entry.items : [];
  const lines = items.map((it) => {
    const name = text(it && it.name, 200);
    if (!name) return '';
    const status = text(it && it.status, 60);
    const note = text(it && it.notes, 500);
    return `- ${name}${status ? ` [${status}]` : ''}${note ? ` — ${note}` : ''}`;
  }).filter(Boolean);
  if (!lines.length) return '';
  return ['Needed work (rescued from the Real Estate tab):', ...lines].join('\n').slice(0, 8000);
}

export function roomToRow(entry = {}, { instanceId, rentalUuid, sortOrder = 10 } = {}) {
  const name = text(entry.name, 200);
  if (!name) return null;
  const kind = inferRoomKind(name);
  return {
    instance_id: instanceId,
    rental_ref: rentalUuid,
    name,
    kind: ROOM_KINDS.includes(kind) ? kind : 'other',
    notes: roomNotesText(entry),
    sort_order: sortOrder,
    archived_at: null,
    legacy_id: text(entry.id, 200) || null,
  };
}

export function equipmentToRow(entry = {}, { instanceId, rentalUuid } = {}) {
  // The tab makes CATEGORY the required field and leaves make/model optional,
  // so the category is the name when nothing better was typed.
  const name = [text(entry.make, 120), text(entry.model, 120)].filter(Boolean).join(' ')
    || text(entry.category, 120);
  if (!name) return null;
  return {
    instance_id: instanceId,
    rental_ref: rentalUuid,
    room_id: null,
    name,
    kind: systemKindFor(entry),
    make: text(entry.make, 120),
    model: text(entry.model, 120),
    serial: text(entry.serial, 120),
    location_note: '',
    installed_on: dateOrNull(entry.installDate),
    expected_life_years: null,   // never guessed — an unknown life reads 'unknown', not 'ok'
    warranty_until: dateOrNull(entry.warrantyEnd),
    service_interval_months: null,
    last_service_on: null,
    notes: text(entry.notes, 4000),
    legacy_id: text(entry.id, 200) || null,
  };
}

export function maintenanceToEvent(entry = {}, { instanceId, rentalUuid, authorLabel = '' } = {}) {
  const summary = text(entry.description, 2000);
  const when = dateOrNull(entry.date);
  // Both are required by the table and neither can be invented: an event with
  // no date is a date nobody can read later, and one with no summary says
  // nothing. Such an entry is skipped and named, not padded.
  if (!summary || !when) return null;
  const category = text(entry.category, 60);
  return {
    instance_id: instanceId,
    system_ref: null,            // legal since 0159 — this work names no machine
    rental_ref: rentalUuid,
    request_id: null,
    kind: eventKindFor(entry),
    event_date: when,
    summary: category ? `${category}: ${summary}`.slice(0, 2000) : summary,
    vendor_name: text(entry.vendor, 200),
    cost: money(entry.cost),
    notes: text(entry.notes, 4000),
    author_label: text(authorLabel, 120),
    legacy_id: text(entry.id, 200) || null,
  };
}

// -----------------------------------------------------------------------------
// The plan. Pure: hand it a rental and it tells you exactly what would be
// written, what would be skipped and why, and what it cannot carry at all.
// Nothing is sent until a caller takes this and does the I/O.
// -----------------------------------------------------------------------------
export function planRescue(rental, {
  instanceId, rentalUuid, existingNotes = [], authorLabel = '',
} = {}) {
  if (!rental || typeof rental !== 'object') {
    return { ok: false, reason: 'no-rental', notes: [], rooms: [], systems: [], events: [], skipped: [], deferred: [], total: 0 };
  }
  const rentalSlug = text(rental.id, 200);
  const unitLabel = text(rental.name || rental.address, 120);
  if (!rentalSlug) {
    return { ok: false, reason: 'no-slug', notes: [], rooms: [], systems: [], events: [], skipped: [], deferred: [], total: 0 };
  }

  const skipped = [];
  const deferred = [];
  const keep = (rows, label) => rows.filter((r, i) => {
    if (r) return true;
    skipped.push(`${label} #${i + 1} — not enough to file it (it needs, at minimum, words and a date)`);
    return false;
  });

  // --- notes: conversations, plus any unit note that never reached the cloud
  const seen = new Set((existingNotes || []).map(noteFingerprint));
  const noteRows = [];
  for (const row of keep(
    (Array.isArray(rental.conversationLog) ? rental.conversationLog : [])
      .map((e) => conversationToNote(e, { rentalSlug, unitLabel })),
    'conversation',
  )) {
    if (seen.has(noteFingerprint(row))) continue;
    seen.add(noteFingerprint(row));
    noteRows.push(row);
  }
  for (const row of keep(
    (Array.isArray(rental.unitNotes) ? rental.unitNotes : [])
      .map((e) => unitNoteToRow(e, { rentalSlug, unitLabel })),
    'note',
  )) {
    if (seen.has(noteFingerprint(row))) continue;  // already on the server
    seen.add(noteFingerprint(row));
    noteRows.push(row);
  }

  // --- rooms, equipment, maintenance: these need the door's UUID, which only
  //     exists once the door itself has synced. Without it they cannot be
  //     keyed, and a row keyed to nothing is worse than a row not yet written.
  let roomRows = [];
  let systemRows = [];
  let eventRows = [];
  if (rentalUuid && instanceId) {
    const rooms = Array.isArray(rental.rooms) ? rental.rooms : [];
    roomRows = keep(
      rooms.map((e, i) => roomToRow(e, { instanceId, rentalUuid, sortOrder: (i + 1) * 10 })),
      'room',
    );
    systemRows = keep(
      (Array.isArray(rental.equipment) ? rental.equipment : [])
        .map((e) => equipmentToRow(e, { instanceId, rentalUuid })),
      'equipment',
    );
    eventRows = keep(
      (Array.isArray(rental.maintenanceLog) ? rental.maintenanceLog : [])
        .map((e) => maintenanceToEvent(e, { instanceId, rentalUuid, authorLabel })),
      'maintenance entry',
    );

    // Photographs are the one thing this cannot carry. property_photos wants a
    // storage_path; these are data URLs sitting in localStorage. That is a file
    // upload, not a field mapping — a different mechanism entirely. Counting
    // them here is how the summary avoids implying a complete rescue.
    const roomShots = rooms.reduce((n, r) => n + ((r && Array.isArray(r.photos) ? r.photos : []).length), 0);
    const maintShots = (Array.isArray(rental.maintenanceLog) ? rental.maintenanceLog : [])
      .reduce((n, m) => n + ((m && Array.isArray(m.photos) ? m.photos : []).length), 0);
    const shots = roomShots + maintShots;
    if (shots) {
      deferred.push(`${shots} photo${shots === 1 ? '' : 's'} stay on this device for now — pictures need a file upload, not a field copy, and that is its own step`);
    }
  } else {
    const blocked = (Array.isArray(rental.rooms) ? rental.rooms.length : 0)
      + (Array.isArray(rental.equipment) ? rental.equipment.length : 0)
      + (Array.isArray(rental.maintenanceLog) ? rental.maintenanceLog.length : 0);
    if (blocked) {
      deferred.push(`${blocked} room/equipment/maintenance record${blocked === 1 ? '' : 's'} wait until this property itself has synced — they are filed under its server id, which it does not have yet`);
    }
  }

  const total = noteRows.length + roomRows.length + systemRows.length + eventRows.length;
  return {
    ok: true,
    reason: total ? 'ready' : 'nothing-to-carry',
    slug: rentalSlug,
    rentalUuid: rentalUuid || null,
    notes: noteRows,
    rooms: roomRows,
    systems: systemRows,
    events: eventRows,
    skipped,
    deferred,
    total,
  };
}

/** One plain sentence for the button, so the landlord knows before he presses. */
export function describePlan(plan) {
  if (!plan || !plan.ok) return 'Nothing here can be carried up yet.';
  if (!plan.total) return 'Everything in this record is already on the server.';
  const parts = [];
  const say = (n, one, many) => { if (n) parts.push(`${n} ${n === 1 ? one : many}`); };
  say(plan.notes.length, 'note', 'notes');
  say(plan.rooms.length, 'room', 'rooms');
  say(plan.systems.length, 'system', 'systems');
  say(plan.events.length, 'maintenance entry', 'maintenance entries');
  const head = parts.length > 1
    ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
    : parts[0];
  return `${head} on this device only — carry up to the server`;
}
