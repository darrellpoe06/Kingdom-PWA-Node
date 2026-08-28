// =============================================================================
// rentable-levels — what a door IS: a whole unit, a room, or a bed
// =============================================================================
// Darrell, 2026-08-28, after hand-building it himself:
//   "all rooms should be able to do what I had to do... the system needs to
//    support 1 room 2 beds... or 1 room 1 bed... or whole unit... etc..."
//
// WHAT HE HAD TO DO. 805 North Prospect Apt 4 shows as "2 DOORS" holding
// "Room 1- Bed B" and "Room 1 - Bed A" — two rentable BEDS inside ONE room
// inside ONE unit. He got there by pressing "Split into doors" and typing those
// names by hand, one character at a time, because the split only ever knew how
// to make "Apt 1..N". The structure he wanted was expressible; nothing in the
// system UNDERSTOOD it. So the two beds are just doors with hand-typed names,
// and the app cannot tell that they share a room, that the room sits in Apt 4,
// or that a third bed would belong beside them.
//
// A DOOR NOW SAYS WHAT IT IS. Three levels, and they nest:
//
//     building  →  unit  →  room  →  bed
//     805 N Prospect   Apt 4    Room 1   Bed A / Bed B
//
// Every level is RENTABLE, and that is the point rather than an accident: a
// landlord lets the whole unit, or the rooms in it, or the beds in a room —
// and the same building can do all three at once, which is exactly what 805
// does today (Apt 2 whole, Apt 4 by the bed).
//
// SPLITTING IS THE SAME MOVE AT EVERY LEVEL. A unit splits into rooms; a room
// splits into beds. "All rooms should be able to do what I had to do" is
// literally that: the control stops being a one-shot for buildings and becomes
// the general operation, so a room he adds next year splits into beds without
// anybody typing "Room 3 - Bed B".
//
// A BED IS THE FLOOR. It does not split further — there is nothing under a bed
// to rent, and offering the control there would be a lie about what the system
// can do.
//
// PURE: no I/O, no React, no clock. The labels are HIS ("Room 1 - Bed A",
// spacing and all), carried into code rather than replaced with a tidier scheme
// of mine.
// =============================================================================

export const LEVELS = Object.freeze(['unit', 'room', 'bed']);

/** Plain words for the surfaces, so no component invents its own vocabulary. */
export const LEVEL_LABEL = Object.freeze({
  unit: 'Whole unit',
  room: 'Room',
  bed: 'Bed',
});

export const LEVEL_PLURAL = Object.freeze({
  unit: 'units',
  room: 'rooms',
  bed: 'beds',
});

/** What a door of this level splits INTO. A bed splits into nothing. */
export const SPLITS_INTO = Object.freeze({ unit: 'room', room: 'bed', bed: null });

const text = (v) => String(v ?? '').trim();

/**
 * What level a door is.
 *
 * Reads the stored level when there is one. Otherwise INFERS from the labels a
 * door already carries — because twelve doors exist today with no level on
 * them, and two of those are beds. Inferring is not guessing: a door whose
 * label says "Bed" is a bed, and saying so beats defaulting it to a whole unit
 * and then showing the landlord a Rooms control that makes no sense.
 */
export function levelOf(rental) {
  if (!rental || typeof rental !== 'object') return 'unit';
  const stored = text(rental.rentableLevel ?? rental.rentable_level);
  if (LEVELS.includes(stored)) return stored;
  const label = `${text(rental.unitLabel ?? rental.unit)} ${text(rental.name)}`;
  if (/\bbed\b/i.test(label)) return 'bed';
  if (/\broom\b/i.test(label)) return 'room';
  return 'unit';
}

/** Can this door be split, and into what? */
export function splitTarget(rental) {
  return SPLITS_INTO[levelOf(rental)] || null;
}

export const canSplit = (rental) => splitTarget(rental) !== null;

/**
 * Why a door cannot be split, in a sentence a landlord can act on — never a
 * disabled control with no explanation.
 */
export function refuseSplit(rental) {
  if (canSplit(rental)) return null;
  return 'A bed is the smallest thing you can rent — there is nothing inside it to split.';
}

// -----------------------------------------------------------------------------
// The labels. His spelling, not mine.
// -----------------------------------------------------------------------------

/** Bed A, Bed B, … Bed Z, then Bed 27 rather than wrapping to AA. */
export function bedSuffix(i) {
  return i < 26 ? `Bed ${String.fromCharCode(65 + i)}` : `Bed ${i + 1}`;
}

/**
 * The labels for splitting one door into `count` children at `level`.
 *
 * For beds the ROOM leads the label — "Room 1 - Bed A" — so a bed still says
 * which room it belongs to when it is read on its own, in a list, on a board,
 * or in a text message to a tenant. That is Darrell's own format, hyphen and
 * all; the system now produces what he was typing.
 */
export function defaultLabels(level, count, parent = {}) {
  const n = Math.max(0, Math.round(Number(count) || 0));
  if (level === 'room') return Array.from({ length: n }, (_, i) => `Room ${i + 1}`);
  if (level === 'bed') {
    const room = text(parent.roomLabel ?? parent.room_label)
      || text(parent.unitLabel ?? parent.unit)
      || 'Room 1';
    return Array.from({ length: n }, (_, i) => `${room} - ${bedSuffix(i)}`);
  }
  return Array.from({ length: n }, (_, i) => `Apt ${i + 1}`);
}

/**
 * A whole unit laid out as rooms AND beds in one go — the shape he described:
 * "1 room 2 beds... or 1 room 1 bed". `bedsPerRoom` of 1 means the room IS the
 * rentable thing and no beds are created, because splitting a room into a
 * single bed adds a level of nesting that rents nothing extra and only makes
 * the board longer.
 */
export function layoutRooms(rooms, bedsPerRoom = 1) {
  const r = Math.max(0, Math.round(Number(rooms) || 0));
  const b = Math.max(1, Math.round(Number(bedsPerRoom) || 1));
  const out = [];
  for (let i = 0; i < r; i += 1) {
    const room = `Room ${i + 1}`;
    if (b === 1) { out.push({ level: 'room', label: room, roomLabel: room }); continue; }
    for (let j = 0; j < b; j += 1) {
      out.push({ level: 'bed', label: `${room} - ${bedSuffix(j)}`, roomLabel: room });
    }
  }
  return out;
}

/**
 * The whole plan for one split, ready to show BEFORE anything is created.
 *
 * Returns the children with their labels, levels and room, plus the patch the
 * base door takes on (it becomes the first child, keeping its tenant, rent and
 * records — the existing split's behaviour, which is right and stays).
 */
export function planSplit(base = {}, { level, count, bedsPerRoom = 1 } = {}) {
  const target = level || splitTarget(base);
  if (!target) return { ok: false, reason: 'cannot-split', message: refuseSplit(base), children: [] };
  if (!LEVELS.includes(target)) return { ok: false, reason: 'unknown-level', children: [] };

  const building = text(base.building) || text(base.address) || text(base.name);
  if (!building) return { ok: false, reason: 'no-building', message: 'Give the building a name first — the doors are grouped by it.', children: [] };

  let parts;
  if (target === 'room') {
    parts = layoutRooms(count, bedsPerRoom);
  } else {
    const labels = defaultLabels(target, count, base);
    const room = target === 'bed'
      ? (text(base.roomLabel ?? base.room_label) || text(base.unitLabel ?? base.unit) || 'Room 1')
      : null;
    parts = labels.map((label) => ({ level: target, label, roomLabel: room }));
  }

  if (parts.length < 2) {
    return {
      ok: false,
      reason: 'too-few',
      message: `Splitting into one ${LEVEL_LABEL[target].toLowerCase()} changes nothing — ask for two or more.`,
      children: [],
    };
  }

  const first = parts[0];
  return {
    ok: true,
    reason: '',
    target,
    building,
    // The base keeps everything it has and becomes the first child.
    basePatch: {
      building,
      unitLabel: first.label,
      rentableLevel: first.level,
      roomLabel: first.roomLabel || null,
      units: 1,
      name: base.address ? `${base.address} ${first.label}` : `${building} ${first.label}`,
    },
    children: parts,
    rest: parts.slice(1),
  };
}

/** One sentence saying exactly what pressing the button will make. */
export function describeSplit(plan) {
  if (!plan || !plan.ok) return (plan && plan.message) || 'This cannot be split.';
  const n = plan.children.length;
  const beds = plan.children.filter((c) => c.level === 'bed').length;
  const rooms = new Set(plan.children.filter((c) => c.roomLabel).map((c) => c.roomLabel)).size;
  if (beds && rooms) {
    return `${rooms} room${rooms === 1 ? '' : 's'}, ${beds} bed${beds === 1 ? '' : 's'} — ${n} rentable door${n === 1 ? '' : 's'}, each with its own records, photos and thread.`;
  }
  return `${n} ${LEVEL_PLURAL[plan.target]} — each its own door, with its own records, photos and thread.`;
}

/**
 * Group a building's doors the way they actually nest, for display: rooms that
 * hold beds, and the doors that stand alone. Pure; the caller sorts.
 */
export function nestByRoom(rentals = []) {
  const rooms = new Map();
  const standalone = [];
  for (const r of rentals || []) {
    const level = levelOf(r);
    const room = r ? text(r.roomLabel ?? r.room_label) : '';
    if (level === 'bed' && room) {
      if (!rooms.has(room)) rooms.set(room, { room, beds: [] });
      rooms.get(room).beds.push(r);
    } else {
      standalone.push(r);
    }
  }
  return { rooms: [...rooms.values()], standalone };
}
