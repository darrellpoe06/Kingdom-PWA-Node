// =============================================================================
// rooms — a property's rooms are rows, so upgrading one is data, not a deploy
// =============================================================================
// Darrell, 2026-08-27: "each room has the ability to add photos to coincide with
// that room... add or delete rooms natively so each property can be upgraded
// without needing to rewrite code... etc..."
//
// The failure this avoids is the obvious one: a ROOMS constant in the source,
// and every finished basement becoming a pull request. There is no such
// constant. STARTER_SETS below is a first draft somebody can accept, edit or
// ignore — it seeds an empty door and is never consulted again. Nothing in this
// module or the surfaces above it branches on a room's name.
//
// Two lines it does hold:
//
//   ARCHIVE, NEVER DELETE. property_photos is append-only evidence. A move-out
//   condition set for a room that was later knocked through is exactly the
//   record a deposit argument needs, so removing a room hides it from the
//   pickers and leaves its history standing. There is no DELETE grant (0153).
//
//   NO SURVEILLANCE IN A ROOM (DR-028). coliving.js already refuses a camera,
//   microphone or sensor config. Rooms now being first-class data is precisely
//   the moment somebody would think to hang a device off one, so the refusal is
//   re-stated here against the room shape itself.
// =============================================================================

export const ROOM_KINDS = Object.freeze([
  'bedroom', 'bathroom', 'kitchen', 'living', 'dining', 'laundry', 'basement',
  'attic', 'garage', 'exterior', 'hallway', 'office', 'storage', 'utility', 'other',
]);

/**
 * A first draft for an empty door — accepted, edited or ignored. NOT a schema,
 * and nothing downstream assumes a door's rooms came from here.
 */
export const STARTER_SETS = Object.freeze({
  house: ['Kitchen', 'Living room', 'Bathroom 1', 'Bedroom 1', 'Bedroom 2', 'Basement', 'Exterior'],
  apartment: ['Kitchen', 'Living room', 'Bathroom', 'Bedroom 1', 'Exterior'],
  room: ['Room', 'Shared bathroom', 'Shared kitchen'],
  duplex: ['Kitchen', 'Living room', 'Bathroom 1', 'Bedroom 1', 'Bedroom 2', 'Exterior'],
});

const KIND_HINTS = [
  [/\bbed\s?room|\bbdrm|\bbr\b/i, 'bedroom'],
  [/\bbath|\bwc\b|powder/i, 'bathroom'],
  [/kitchen|kitchenette/i, 'kitchen'],
  [/living|lounge|family\s?room|den/i, 'living'],
  [/dining/i, 'dining'],
  [/laundry|utility\s?room|mud\s?room/i, 'laundry'],
  [/basement|cellar/i, 'basement'],
  [/attic|loft/i, 'attic'],
  [/garage|carport/i, 'garage'],
  [/exterior|outside|yard|porch|deck|roof|siding/i, 'exterior'],
  [/hall|stair|entry|foyer/i, 'hallway'],
  [/office|study/i, 'office'],
  [/storage|closet|pantry/i, 'storage'],
  [/furnace|boiler|water\s?heater|mechanical/i, 'utility'],
];

/** A guess at the kind from the name — a default the landlord can override. */
export function inferKind(name = '') {
  for (const [re, kind] of KIND_HINTS) if (re.test(String(name))) return kind;
  return 'other';
}

const norm = (s) => String(s ?? '').trim().replace(/\s+/g, ' ');
const key = (s) => norm(s).toLowerCase();

/** The rooms still in use, in display order. */
export function liveRooms(rooms = []) {
  return rooms
    .filter((r) => !r.archived_at)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || norm(a.name).localeCompare(norm(b.name)));
}

/** The rooms removed from the pickers, whose photos are still on the record. */
export function archivedRooms(rooms = []) {
  return rooms.filter((r) => r.archived_at);
}

/**
 * Build the row for a new room. Refuses a blank name and a name already in use
 * at this door — a duplicate would make "which Bathroom 2?" unanswerable the
 * moment a photo is filed to one.
 */
export function buildRoom({ instanceId, rentalRef, name, kind, notes = '' } = {}, existing = []) {
  const clean = norm(name);
  if (!clean) throw new Error('A room needs a name.');
  if (!instanceId || !rentalRef) throw new Error('A room belongs to a door — instanceId and rentalRef are required.');
  if (liveRooms(existing).some((r) => key(r.name) === key(clean))) {
    throw new Error(`This door already has a room called "${clean}".`);
  }
  const resolved = kind ? String(kind) : inferKind(clean);
  if (!ROOM_KINDS.includes(resolved)) {
    throw new Error(`"${resolved}" is not a room kind. Use one of: ${ROOM_KINDS.join(', ')}.`);
  }
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0);
  return {
    instance_id: instanceId,
    rental_ref: rentalRef,
    name: clean,
    kind: resolved,
    notes: String(notes ?? ''),
    sort_order: maxOrder + 10, // gaps, so a room can be slotted between two later
    archived_at: null,
  };
}

/** Seed an empty door from a starter set. Never overwrites what is already there. */
export function seedRooms({ instanceId, rentalRef, propertyType = 'house' } = {}, existing = []) {
  if (liveRooms(existing).length > 0) return [];
  const names = STARTER_SETS[propertyType] || STARTER_SETS.house;
  const out = [];
  for (const n of names) out.push(buildRoom({ instanceId, rentalRef, name: n }, [...existing, ...out]));
  return out;
}

/**
 * Remove a room. Returns the archive patch, plus what it means for the photos —
 * stated rather than assumed, because "delete" reads as "the pictures are gone"
 * and here it does not.
 */
export function archiveRoom(room = {}, { by = null, at = null, photos = [] } = {}) {
  if (!room.id) throw new Error('Which room? An archive needs the room row.');
  if (room.archived_at) throw new Error(`"${room.name}" is already archived.`);
  const kept = photos.filter((p) => p.room_id === room.id).length;
  return {
    patch: { archived_at: at || new Date().toISOString(), archived_by: by },
    keepsPhotos: kept,
    statement: kept > 0
      ? `"${room.name}" will stop being offered. Its ${kept} photo(s) stay on the property's record.`
      : `"${room.name}" will stop being offered. It has no photos.`,
  };
}

/** Put an archived room back, if it is not fighting a live name. */
export function restoreRoom(room = {}, existing = []) {
  if (!room.archived_at) throw new Error(`"${room.name}" is not archived.`);
  if (liveRooms(existing).some((r) => key(r.name) === key(room.name) && r.id !== room.id)) {
    throw new Error(`A live room is already called "${room.name}". Rename one of them first.`);
  }
  return { archived_at: null, archived_by: null };
}

/** Reorder by the ids given; anything not named keeps its place at the end. */
export function reorderRooms(rooms = [], orderedIds = []) {
  const patches = [];
  orderedIds.forEach((id, i) => {
    const room = rooms.find((r) => r.id === id);
    if (room) patches.push({ id, sort_order: (i + 1) * 10 });
  });
  return patches;
}

/** A room's photos, newest first — what the room's page opens to. */
export function photosForRoom(roomId, photos = []) {
  return photos
    .filter((p) => p.room_id === roomId)
    .sort((a, b) => {
      const at = Date.parse(a.taken_at || a.uploaded_at || 0) || 0;
      const bt = Date.parse(b.taken_at || b.uploaded_at || 0) || 0;
      return bt - at;
    });
}

/**
 * The door's rooms with their photo counts, plus the photos filed to the door
 * but to no room — surfaced rather than hidden, so an unsorted pile stays
 * visible instead of quietly becoming nobody's job.
 */
export function roomBoard(rooms = [], photos = []) {
  const live = liveRooms(rooms);
  const board = live.map((r) => ({
    room: r,
    photos: photosForRoom(r.id, photos),
    count: photosForRoom(r.id, photos).length,
  }));
  const roomIds = new Set(rooms.map((r) => r.id));
  const unfiled = photos.filter((p) => !p.room_id || !roomIds.has(p.room_id));
  const archived = archivedRooms(rooms).map((r) => ({ room: r, count: photosForRoom(r.id, photos).length }));
  return {
    rooms: board,
    unfiled,
    archived: archived.filter((a) => a.count > 0),
    statement: `${live.length} room(s); ${photos.length - unfiled.length} photo(s) filed, ${unfiled.length} not yet in a room.`,
  };
}

/**
 * How big the unit IS — counted from its rooms, never stored beside them.
 *
 * Darrell, 2026-08-27: "if we add a room etc... we want users to be able to
 * change a 2 bedroom to a 3 etc..."
 *
 * So there is no `bedrooms` column to update and forget. Adding a bedroom row
 * makes the door a 3-bedroom in the same instant, everywhere it is shown, with
 * no second write to fall out of step and no code to change. A door whose
 * listing says 2 while its rooms say 3 is a class of bug that cannot occur
 * here, because there is only one number and it is the count.
 *
 * A half bath counts as a half, the way every listing in the country counts it.
 */
export function unitSize(rooms = []) {
  const live = liveRooms(rooms);
  const bedrooms = live.filter((r) => r.kind === 'bedroom').length;
  const baths = live.filter((r) => r.kind === 'bathroom');
  const half = baths.filter((r) => /half|powder|\b1\/2\b|0\.5/i.test(`${r.name} ${r.notes ?? ''}`)).length;
  const bathrooms = (baths.length - half) + half * 0.5;
  const bathLabel = Number.isInteger(bathrooms) ? String(bathrooms) : bathrooms.toFixed(1);
  return {
    bedrooms,
    bathrooms,
    rooms: live.length,
    // "Studio" is the honest reading of a unit with rooms but no bedroom; a
    // door with no rooms recorded at all is unknown, and says so.
    label: live.length === 0
      ? 'Size not recorded'
      : `${bedrooms === 0 ? 'Studio' : `${bedrooms} bed`}${baths.length ? ` / ${bathLabel} bath` : ''}`,
    derived: true,
  };
}

/** What changed when a room was added or archived — the reclassification, said plainly. */
export function sizeChange(before = [], after = []) {
  const a = unitSize(before);
  const b = unitSize(after);
  const changed = a.bedrooms !== b.bedrooms || a.bathrooms !== b.bathrooms;
  return {
    from: a,
    to: b,
    changed,
    statement: changed
      ? `This door is now ${b.label} (was ${a.label}). Nothing else needs updating — the size is counted from the rooms.`
      : `Still ${b.label}.`,
  };
}

/**
 * DR-028, restated against the room shape. Rooms became first-class data here,
 * which is exactly when somebody would think to hang a device off one.
 */
export function assertNoRoomDevice(config = {}) {
  const banned = ['camera', 'cameras', 'microphone', 'mic', 'audio', 'sensor',
    'sensors', 'occupancy', 'motion', 'stream', 'recording', 'listen', 'monitor'];
  for (const k of Object.keys(config)) {
    if (banned.includes(k.toLowerCase())) {
      throw new Error(
        `A room cannot carry "${k}". Locks and logs live at the DOOR; there is no surveillance inside a room (DR-028).`,
      );
    }
  }
  return true;
}
