// =============================================================================
// hold-the-record — the family's app holds each door's record whole, once
// =============================================================================
// Darrell, 2026-10-13: "why don't the addresses reflect each record... they
// all should be in sync... correct? End to end processes!!!" and "Hold the
// whole address so everyone can see the correct pattern for each property".
//
// Two one-time repairs, decided here (pure) and applied by PropertiesApp
// through the door edit path, so every change leaves its trace in the door's
// notes exactly as a hand edit would:
//
//   1. THE ADDRESS IN ITS PARTS (address.js repairAddress): a row whose street
//      field carries the whole line, or a unit, is split -- only blanks are
//      filled, nothing set is overwritten, a line with no town is left alone
//      and flagged on the card instead. address_held_at marks the row done.
//   2. THE ARCHIVE ON THE RECORD: the nine chat channels that lived in the
//      app's hardcoded list (nas-photos.js PROPERTY_CHANNELS, keyed by the
//      Real Estate slug) are written onto their rows' photo_channel, so the
//      record carries it and the list can retire. A row that already names
//      one is never touched. A door with no archive of its own takes its
//      BUILDING'S (the same buildingKey as a sibling that names one -- the
//      805 archive holds every 805 unit's pictures): Darrell, 2026-10-13, on
//      Apt 1's "photo bridge answered 400" -- the app had sent its display
//      name, spaces and all, as the channel. Cleaned, never fuzzy (DR-0967).
//
// Family only (the caller gates on the owner role); bounded to the doors it
// was handed; never a loop.
// =============================================================================
import { repairAddress } from './address.js';
import { buildingKey } from './apartment.js';
import { PROPERTY_CHANNELS, CHANNEL_RE } from '../../lib/nas-photos.js';

/**
 * The patches to apply: [{id, patch, summary}]. `heldAt` and `channels` are
 * what the database already holds (loadDoorArchives), so a held row and a
 * named archive are skipped.
 */
export function recordRepairs(rentals = [], { heldAt = {}, channels = {}, channelFor = (r) => PROPERTY_CHANNELS[r.slug] || '' } = {}) {
  const out = [];
  const own = (r) => {
    const ch = String(channels[r.id] || r.photo_channel || channelFor(r) || '').trim();
    return CHANNEL_RE.test(ch) ? ch : '';
  };
  // The building's archive: the first sibling (same buildingKey) that names
  // one, in the order the doors were handed over.
  const ofBuilding = (r) => {
    const key = buildingKey(r.address, r.unit);
    if (!key) return '';
    for (const s of rentals) {
      if (!s || s === r || buildingKey(s.address, s.unit) !== key) continue;
      const ch = own(s);
      if (ch) return ch;
    }
    return '';
  };
  for (const r of rentals) {
    if (!r || !r.id) continue;
    const patch = {};
    const why = [];
    if (!heldAt[r.id]) {
      const fix = repairAddress(r);
      if (fix) { Object.assign(patch, fix.patch); why.push(fix.summary); }
      // Held now, whether or not anything needed moving, so this row is never
      // re-read for it; a row that is still missing its town stays unheld,
      // because the card must keep saying so.
      if (fix || !needsTown(r)) patch.address_held_at = new Date().toISOString();
    }
    if (!channels[r.id] && !r.photo_channel) {
      const ch = own(r);
      if (ch) { patch.photo_channel = ch; why.push(`Picture archive on the NAS named: ${ch}`); }
      else {
        const bch = ofBuilding(r);
        if (bch) { patch.photo_channel = bch; why.push(`Picture archive on the NAS named from the building: ${bch}`); }
      }
    }
    if (!Object.keys(patch).length) continue;
    out.push({ id: r.id, patch, summary: why.join('; ') || 'Address held in its parts' });
  }
  return out;
}

function needsTown(r) {
  return !String(r.city || '').trim();
}

/**
 * Apply the repairs through `save(id, patch, summary)`; returns {done, failed,
 * rentals}, where `rentals` is the list AS HELD (each saved patch applied), so
 * whatever runs next -- placing the doors on the map -- reads the repaired
 * address, not the one-line one.
 */
export async function holdTheRecords(rentals, known, save) {
  const out = { done: [], failed: [], rentals: [...(rentals || [])] };
  if (typeof save !== 'function') return out;
  for (const r of recordRepairs(rentals, known)) {
    let res;
    try { res = await save(r.id, r.patch, r.summary); } catch { res = { ok: false }; }
    if (res && res.ok) {
      out.done.push(r.id);
      out.rentals = out.rentals.map((x) => (x && x.id === r.id ? { ...x, ...r.patch } : x));
    } else out.failed.push(r.id);
  }
  return out;
}
