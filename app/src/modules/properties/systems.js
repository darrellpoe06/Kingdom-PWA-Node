// =============================================================================
// systems — the mechanical history of a property: what is installed, how old
//           it is, and everything that has ever happened to it
// =============================================================================
// Darrell, 2026-08-28: "...we still want to calculate the funds and other home
// ownership type things like keeping a mechanical history of the system's and
// issues like all our properties etc..."
//
// "LIKE ALL OUR PROPERTIES" IS THE DESIGN. This is not a home feature that the
// rentals happen to share. It is a PROPERTY feature; our own home is one of the
// properties that has one. Nothing in this module knows or cares whether a door
// is rented out — homes.js holds that distinction and it does not reach here.
//
// TWO SHAPES, BECAUSE THEY ARE TWO LIFETIMES (mirroring 0156):
//   A SYSTEM is a thing. A furnace sits in a basement for twenty years and
//   carries a make, a model, an age and a warranty.
//   An EVENT is a moment. "Serviced 2026-03-14, $180, Dave's Heating."
// Folded into one table you lose whichever one you overwrite.
//
// WHY THIS IS NOT maintenance_requests. That table is a work ORDER: something
// broke, someone was dispatched, it cost money, it closed. This is the equipment
// record UNDERNEATH it — the thing a work order happens TO. An event may carry
// the request it came from, which is how "the issues" attach to "the systems".
//
// NOTHING IS GUESSED. An unknown install date stays null and every derived
// figure says "unknown" rather than assuming. A furnace whose age nobody knows
// is not zero years old, and reporting it as new is how a capital plan gets
// built on a fiction (DR-0076 §8: honest uncertainty is a required output).
// =============================================================================

export const SYSTEM_KINDS = Object.freeze([
  'heating', 'cooling', 'water-heater', 'plumbing', 'electrical', 'roof',
  'foundation', 'windows', 'appliance', 'septic', 'well', 'sump', 'gutters',
  'driveway', 'landscape', 'safety', 'other',
]);

export const EVENT_KINDS = Object.freeze([
  'installed', 'serviced', 'inspected', 'repaired', 'issue',
  'replaced', 'removed', 'warranty-claim', 'note',
]);

/** Plain words for the surfaces, so no component invents its own vocabulary. */
export const KIND_LABEL = Object.freeze({
  heating: 'Heating', cooling: 'Cooling', 'water-heater': 'Water heater',
  plumbing: 'Plumbing', electrical: 'Electrical', roof: 'Roof',
  foundation: 'Foundation', windows: 'Windows', appliance: 'Appliance',
  septic: 'Septic', well: 'Well', sump: 'Sump pump', gutters: 'Gutters',
  driveway: 'Driveway', landscape: 'Landscape', safety: 'Safety', other: 'Other',
});

export const EVENT_LABEL = Object.freeze({
  installed: 'Installed', serviced: 'Serviced', inspected: 'Inspected',
  repaired: 'Repaired', issue: 'Issue reported', replaced: 'Replaced',
  removed: 'Removed', 'warranty-claim': 'Warranty claim', note: 'Note',
});

/**
 * Typical service lives, in years, and service intervals, in months.
 *
 * THESE ARE DEFAULTS A PERSON CAN OVERWRITE, NOT FACTS ABOUT ANY PARTICULAR
 * BUILDING. They are only ever used to PREFILL a form the landlord then edits —
 * never to fill in a blank record behind his back, and never shown as though the
 * app measured them. The figures are the ordinary industry service-life ranges
 * (a gas furnace ~15-20 years, a tank water heater ~10-12); a roof on 1213 Koehn
 * is whatever 1213 Koehn's roof turns out to be.
 */
export const KIND_DEFAULTS = Object.freeze({
  heating: { life: 18, service: 12 },
  cooling: { life: 15, service: 12 },
  'water-heater': { life: 11, service: 12 },
  plumbing: { life: 50, service: null },
  electrical: { life: 40, service: null },
  roof: { life: 22, service: null },
  foundation: { life: 75, service: null },
  windows: { life: 25, service: null },
  appliance: { life: 12, service: null },
  septic: { life: 30, service: 36 },
  well: { life: 30, service: 12 },
  sump: { life: 8, service: 12 },
  gutters: { life: 20, service: 6 },
  driveway: { life: 25, service: null },
  landscape: { life: null, service: 6 },
  safety: { life: 10, service: 6 },   // smoke + CO detectors: replace, not repair
  other: { life: null, service: null },
});

/**
 * A first draft for a door with no systems recorded. Same posture as
 * rooms.STARTER_SETS: offered once, edited freely, never consulted again, and
 * nothing downstream assumes a system came from here. Every one is left with a
 * BLANK install date, because the app does not know when this furnace went in
 * and must not pretend to.
 */
export const STARTER_SYSTEMS = Object.freeze({
  house: [
    { name: 'Furnace', kind: 'heating' },
    { name: 'Air conditioner', kind: 'cooling' },
    { name: 'Water heater', kind: 'water-heater' },
    { name: 'Roof', kind: 'roof' },
    { name: 'Electrical panel', kind: 'electrical' },
    { name: 'Smoke and CO detectors', kind: 'safety' },
  ],
  apartment: [
    { name: 'Furnace', kind: 'heating' },
    { name: 'Water heater', kind: 'water-heater' },
    { name: 'Smoke and CO detectors', kind: 'safety' },
  ],
  commercial: [
    { name: 'Rooftop unit', kind: 'heating' },
    { name: 'Roof', kind: 'roof' },
    { name: 'Electrical panel', kind: 'electrical' },
    { name: 'Fire and safety', kind: 'safety' },
  ],
});

const norm = (s) => String(s ?? '').trim().replace(/\s+/g, ' ');
const key = (s) => norm(s).toLowerCase();
const numOrNull = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const dateOrNull = (v) => {
  const s = String(v ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(`${s}T00:00:00Z`)) ? s : null;
};

const NAME_HINTS = [
  [/furnace|boiler|heat\s?pump|radiator|baseboard/i, 'heating'],
  [/\ba\/?c\b|air\s?condition|condenser|mini\s?split|evaporator/i, 'cooling'],
  [/water\s?heater|hot\s?water|tankless/i, 'water-heater'],
  [/roof|shingle|flashing/i, 'roof'],
  [/gutter|downspout/i, 'gutters'],
  [/panel|breaker|wiring|electric/i, 'electrical'],
  [/plumb|pipe|drain|sewer\s?line|supply\s?line/i, 'plumbing'],
  [/foundation|crawl\s?space|footing/i, 'foundation'],
  [/window|storm\s?door|patio\s?door/i, 'windows'],
  [/septic|leach|drain\s?field/i, 'septic'],
  [/\bwell\b|well\s?pump/i, 'well'],
  [/sump/i, 'sump'],
  [/driveway|walk|concrete|asphalt/i, 'driveway'],
  [/smoke|carbon\s?monoxide|\bco\b\s?detector|extinguisher|alarm/i, 'safety'],
  [/tree|lawn|shrub|landscap/i, 'landscape'],
  [/fridge|refrigerator|stove|range|oven|dishwasher|washer|dryer|disposal|microwave/i, 'appliance'],
];

/** A guess at the kind from the name — a default the landlord may override. */
export function inferSystemKind(name = '') {
  for (const [re, kind] of NAME_HINTS) if (re.test(String(name))) return kind;
  return 'other';
}

/** The systems still installed, grouped in display order. */
export function liveSystems(systems = []) {
  return (systems || [])
    .filter((s) => s && !s.archived_at)
    .sort((a, b) => SYSTEM_KINDS.indexOf(a.kind) - SYSTEM_KINDS.indexOf(b.kind)
      || norm(a.name).localeCompare(norm(b.name)));
}

/** The systems taken out. Their history stands; they are simply no longer here. */
export function retiredSystems(systems = []) {
  return (systems || []).filter((s) => s && s.archived_at);
}

/**
 * Build the row for a new system. Refuses a blank name and a name already in use
 * at this door, for the same reason a duplicate room is refused: "which water
 * heater?" has to have an answer before an event is filed against one.
 */
export function buildSystem({
  instanceId, rentalRef, roomId, name, kind, make, model, serial,
  locationNote, installedOn, expectedLifeYears, warrantyUntil,
  serviceIntervalMonths, lastServiceOn, notes,
} = {}, existing = []) {
  const clean = norm(name);
  if (!clean) throw new Error('A system needs a name.');
  if (!instanceId || !rentalRef) throw new Error('A system belongs to a property — instanceId and rentalRef are required.');
  if (liveSystems(existing).some((s) => key(s.name) === key(clean))) {
    throw new Error(`This property already has a system called "${clean}".`);
  }
  const resolved = kind ? String(kind) : inferSystemKind(clean);
  if (!SYSTEM_KINDS.includes(resolved)) {
    throw new Error(`"${resolved}" is not a system kind. Use one of: ${SYSTEM_KINDS.join(', ')}.`);
  }
  const life = numOrNull(expectedLifeYears);
  const interval = numOrNull(serviceIntervalMonths);
  if (life !== null && life < 1) throw new Error('An expected life of less than a year is not a life; leave it blank if it is unknown.');
  if (interval !== null && interval < 1) throw new Error('A service interval of less than a month is not a schedule; leave it blank if nothing is scheduled.');
  return {
    instance_id: instanceId,
    rental_ref: rentalRef,
    room_id: roomId || null,
    name: clean,
    kind: resolved,
    make: norm(make),
    model: norm(model),
    serial: norm(serial),
    location_note: norm(locationNote),
    // Blank stays blank. An unknown install date is a fact about the record,
    // and writing today's date so the field looks complete would silently
    // report a thirty-year-old furnace as brand new.
    installed_on: dateOrNull(installedOn),
    expected_life_years: life === null ? null : Math.round(life),
    warranty_until: dateOrNull(warrantyUntil),
    service_interval_months: interval === null ? null : Math.round(interval),
    last_service_on: dateOrNull(lastServiceOn),
    notes: String(notes ?? '').trim(),
    archived_at: null,
  };
}

/** Prefill for the add form: the usual figures for this kind, all editable. */
export function defaultsFor(kind) {
  const d = KIND_DEFAULTS[kind] || KIND_DEFAULTS.other;
  return { expectedLifeYears: d.life, serviceIntervalMonths: d.service };
}

/** Seed a property with no systems recorded. Never overwrites what is there. */
export function seedSystems({ instanceId, rentalRef, propertyType = 'house' } = {}, existing = []) {
  if (liveSystems(existing).length > 0) return [];
  const set = STARTER_SYSTEMS[propertyType] || STARTER_SYSTEMS.house;
  const out = [];
  for (const s of set) {
    const d = defaultsFor(s.kind);
    out.push(buildSystem({
      instanceId, rentalRef, name: s.name, kind: s.kind,
      expectedLifeYears: d.expectedLifeYears,
      serviceIntervalMonths: d.serviceIntervalMonths,
    }, [...existing, ...out]));
  }
  return out;
}

/** Build one event. The date and a plain summary are the whole requirement. */
export function buildSystemEvent({
  instanceId, systemRef, rentalRef, requestId, kind, eventDate,
  summary, vendorName, cost, notes, authorLabel,
} = {}) {
  const clean = norm(summary);
  if (!clean) throw new Error('Say what happened — an event with no summary is a date nobody can read later.');
  if (!instanceId || !systemRef || !rentalRef) throw new Error('An event belongs to a system on a property.');
  const when = dateOrNull(eventDate);
  if (!when) throw new Error('An event needs the date it happened, as YYYY-MM-DD.');
  const k = String(kind || 'note');
  if (!EVENT_KINDS.includes(k)) throw new Error(`"${k}" is not an event kind. Use one of: ${EVENT_KINDS.join(', ')}.`);
  const money = numOrNull(cost);
  if (money !== null && money < 0) throw new Error('A cost cannot be negative.');
  return {
    instance_id: instanceId,
    system_ref: systemRef,
    rental_ref: rentalRef,
    request_id: requestId || null,
    kind: k,
    event_date: when,
    summary: clean,
    vendor_name: norm(vendorName),
    cost: money,
    notes: String(notes ?? '').trim(),
    author_label: norm(authorLabel),
  };
}

/** Take a system out of service. Its events stay; there is no delete. */
export function retireSystem(system, { at = new Date().toISOString(), by = null } = {}) {
  if (!system?.id) throw new Error('Which system?');
  return {
    patch: { archived_at: at, archived_by: by },
    meansFor: 'The system stops being listed and stops being counted. Every event recorded against it stays on the property’s mechanical history, because what a replaced furnace cost and how often it failed is exactly what tells you whether the replacement was overdue.',
  };
}

const YEAR_MS = 365.2425 * 86400000;
const MONTH_MS = YEAR_MS / 12;

/** How old it is, in years, or null when the install date is not known. */
export function ageYears(system, nowMs = Date.now()) {
  const on = dateOrNull(system?.installed_on);
  if (!on) return null;
  const ms = nowMs - Date.parse(`${on}T00:00:00Z`);
  return ms < 0 ? 0 : Math.round((ms / YEAR_MS) * 10) / 10;
}

/**
 * Where it is in its life. 'unknown' is a first-class answer and is NEVER
 * rendered as 'ok' — a system nobody has dated is the one most likely to be
 * the oldest thing in the building.
 */
export function lifeStatus(system, nowMs = Date.now()) {
  const age = ageYears(system, nowMs);
  const life = numOrNull(system?.expected_life_years);
  if (age === null || life === null) {
    return { state: 'unknown', age, life, yearsLeft: null,
      say: age === null ? 'Install date not recorded' : 'No expected life recorded' };
  }
  const yearsLeft = Math.round((life - age) * 10) / 10;
  if (yearsLeft < 0) return { state: 'past-life', age, life, yearsLeft, say: `${Math.abs(yearsLeft)}y past its usual life` };
  if (yearsLeft <= 2) return { state: 'near-end', age, life, yearsLeft, say: `about ${yearsLeft}y of usual life left` };
  return { state: 'ok', age, life, yearsLeft, say: `about ${yearsLeft}y of usual life left` };
}

/**
 * When it is next due for service. Reads the newest servicing EVENT in
 * preference to the system's own last_service_on field, because the event is
 * the thing somebody actually recorded happening; the field is a summary that
 * can fall behind it.
 */
export function serviceStatus(system, events = [], nowMs = Date.now()) {
  const interval = numOrNull(system?.service_interval_months);
  const serviced = (events || [])
    .filter((e) => e && e.system_ref === system?.id && ['serviced', 'inspected', 'installed', 'replaced', 'repaired'].includes(e.kind))
    .map((e) => dateOrNull(e.event_date))
    .filter(Boolean)
    .sort();
  const lastFromEvents = serviced.length ? serviced[serviced.length - 1] : null;
  const lastField = dateOrNull(system?.last_service_on);
  const last = [lastFromEvents, lastField].filter(Boolean).sort().pop() || null;
  if (interval === null) {
    return { state: 'none', last, dueOn: null, say: last ? `last touched ${last}` : 'nothing scheduled, nothing recorded' };
  }
  if (!last) {
    return { state: 'unknown', last: null, dueOn: null, say: `due every ${interval} month${interval === 1 ? '' : 's'} — never recorded` };
  }
  const dueMs = Date.parse(`${last}T00:00:00Z`) + interval * MONTH_MS;
  const dueOn = new Date(dueMs).toISOString().slice(0, 10);
  const daysOut = Math.round((dueMs - nowMs) / 86400000);
  if (daysOut < 0) return { state: 'overdue', last, dueOn, daysOut, say: `overdue by ${Math.abs(daysOut)} days` };
  if (daysOut <= 30) return { state: 'due', last, dueOn, daysOut, say: `due in ${daysOut} days` };
  return { state: 'ok', last, dueOn, daysOut, say: `next due ${dueOn}` };
}

/**
 * Everything a property's Systems surface needs, computed once. The counts are
 * COUNTED from the rows returned, so the header and the list below it cannot
 * disagree — the same rule the Rooms header follows.
 */
export function systemBoard(systems = [], events = [], nowMs = Date.now()) {
  const live = liveSystems(systems);
  const rows = live.map((s) => {
    const own = (events || []).filter((e) => e && e.system_ref === s.id);
    const life = lifeStatus(s, nowMs);
    const service = serviceStatus(s, own, nowMs);
    const openIssues = own.filter((e) => e.kind === 'issue').length;
    const spend = own.reduce((sum, e) => sum + (numOrNull(e.cost) || 0), 0);
    return {
      system: s, events: sortEvents(own), life, service,
      eventCount: own.length, openIssues,
      spend: Math.round(spend * 100) / 100,
      label: `${norm(s.name)}${s.make || s.model ? ` — ${[norm(s.make), norm(s.model)].filter(Boolean).join(' ')}` : ''}`,
    };
  });
  return {
    rows,
    retired: retiredSystems(systems),
    count: rows.length,
    // "Needs attention" is deliberately NOT padded with the unknowns: a thing
    // nobody has dated is a gap in the record, not a repair, and mixing the two
    // makes the number useless for planning either one.
    attention: rows.filter((r) => r.life.state === 'past-life' || r.service.state === 'overdue').length,
    unknown: rows.filter((r) => r.life.state === 'unknown' || r.service.state === 'unknown').length,
    spend: Math.round(rows.reduce((s, r) => s + r.spend, 0) * 100) / 100,
  };
}

/** Newest first, undated last — the ordering the rest of the module uses. */
export function sortEvents(events = []) {
  return [...(events || [])].sort((a, b) => {
    const av = Date.parse(`${a?.event_date}T00:00:00Z`);
    const bv = Date.parse(`${b?.event_date}T00:00:00Z`);
    if (!Number.isFinite(av) && !Number.isFinite(bv)) return 0;
    if (!Number.isFinite(av)) return 1;
    if (!Number.isFinite(bv)) return -1;
    return bv - av;
  });
}

/**
 * The mechanical events, shaped for the door's own chronology so a furnace
 * replacement sits in the same stream as a move-out and a photograph. Uses the
 * same event shape buildPropertyTimeline already consumes.
 */
export function toTimelineEvents(events = [], systems = []) {
  const byId = new Map((systems || []).map((s) => [s.id, s]));
  return (events || []).map((e) => {
    const s = byId.get(e.system_ref);
    const at = dateOrNull(e.event_date) ? `${e.event_date}T12:00:00.000Z` : null;
    const cost = numOrNull(e.cost);
    // The shape the door's chronology already renders (DoorTabs.EventRow reads
    // `summary` and `who`) — so a furnace replacement sits in the same stream as
    // a move-out and a photograph, with no second renderer to keep in step.
    return {
      kind: 'system',
      at,
      ms: at ? Date.parse(at) : null,
      undated: !at,
      summary: `${s ? norm(s.name) : 'A system'} — ${EVENT_LABEL[e.kind] || e.kind}: ${norm(e.summary)}${cost !== null ? ` ($${cost})` : ''}`,
      who: norm(e.author_label) || norm(e.vendor_name) || null,
      cost,
      id: e.id,
    };
  });
}
