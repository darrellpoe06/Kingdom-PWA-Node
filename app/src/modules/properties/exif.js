// =============================================================================
// exif — filing a NAS photo to the right door, by what the camera recorded
// =============================================================================
// Darrell, 2026-08-27: "use meta data from the images on the nas for location
// documentation and image sorting to the proper location."
//
// THE SEAM. This module does NOT open image files. The NAS side extracts the
// metadata (sovereign Python, per the backend direction) and hands over a plain
// object; the judgement about WHERE a photo belongs is made here, in code that
// is testable without a filesystem and reviewable without a binary.
//
// WHAT GPS CAN AND CANNOT SETTLE. It can put a photo at a building. It can
// never put one in an apartment: the four doors at 805 North Prospect share a
// roof, and no consumer GPS resolves a floor. So a filing proposal names the
// DOOR RECORD when a door is unambiguous, and says plainly that the unit is
// still the landlord's to pick. Any other behaviour would file a leaking
// bathroom to whichever tenant happened to sort first.
//
// AND IT LIES OFTEN ENOUGH TO MATTER. A phone photographing a lease at the
// kitchen table stamps the kitchen. A camera with a stale fix stamps the last
// place it saw sky. So the proposal carries the distance it measured and
// refuses on ambiguity rather than picking a winner — the same law the rest of
// this module runs on: propose, never assert.
// =============================================================================

/** Metres. Good to well under a metre at these distances; no projection needed. */
export function haversineMeters(a, b) {
  if (!a || !b) return null;
  const R = 6371008.8;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** EXIF stores degrees/minutes/seconds; a hemisphere ref makes it signed. */
export function dmsToDecimal(dms, ref) {
  if (typeof dms === 'number') {
    const n = dms;
    if (!Number.isFinite(n)) return null;
    return /^[sw]$/i.test(String(ref ?? '')) ? -Math.abs(n) : n;
  }
  if (!Array.isArray(dms) || dms.length < 2) return null;
  const [d, m, s = 0] = dms.map((v) => (Array.isArray(v) && v.length === 2 ? v[0] / v[1] : Number(v)));
  if (![d, m, s].every(Number.isFinite)) return null;
  const dec = Math.abs(d) + m / 60 + s / 3600;
  if (dec > 180) return null;
  return /^[sw]$/i.test(String(ref ?? '')) ? -dec : dec;
}

/** The coordinate a photo carries, or the reason it carries none. */
export function readExifLocation(exif = {}) {
  const lat = dmsToDecimal(exif.GPSLatitude, exif.GPSLatitudeRef);
  const lng = dmsToDecimal(exif.GPSLongitude, exif.GPSLongitudeRef);
  if (lat === null || lng === null) return { location: null, reason: 'the image carries no GPS coordinate' };
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return { location: null, reason: 'the GPS coordinate is out of range' };
  // 0,0 is the Gulf of Guinea and, far more often, a camera that wrote nothing.
  if (lat === 0 && lng === 0) return { location: null, reason: 'the GPS coordinate is 0,0 — an unset fix, not a place' };
  const accuracy = Number(exif.GPSHPositioningError);
  return {
    location: { lat, lng },
    accuracyMeters: Number.isFinite(accuracy) ? accuracy : null,
    reason: null,
  };
}

/** "2025:10:04 14:22:31" is the EXIF form — not what Date.parse expects. */
export function readExifTaken(exif = {}) {
  const raw = exif.DateTimeOriginal || exif.CreateDate || exif.DateTime || null;
  if (!raw) return null;
  const s = String(raw).trim();
  const m = /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s);
  if (m) {
    const [, y, mo, d, h, mi, se] = m;
    const t = Date.parse(`${y}-${mo}-${d}T${h}:${mi}:${se}Z`);
    return Number.isFinite(t) ? new Date(t).toISOString() : null;
  }
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/** How far a photo may sit from a door and still be OF that door. */
export const DEFAULT_RADIUS_METERS = 75;

/**
 * Where does this photo belong? Returns a PROPOSAL, never a filing.
 *
 * Refuses when: there is no coordinate; no door is close enough; or two doors
 * at DIFFERENT addresses are both in range. Several doors at the SAME address
 * is not ambiguity about the building — it is the apartment question, which
 * GPS was never going to answer, so the proposal names the address and leaves
 * the unit open.
 */
export function proposeFiling(exif = {}, doors = [], { radiusMeters = DEFAULT_RADIUS_METERS } = {}) {
  const { location, accuracyMeters, reason } = readExifLocation(exif);
  const takenAt = readExifTaken(exif);
  const base = { takenAt, location, filed: false, rentalId: null, address: null, unitOpen: false };

  if (!location) return { ...base, confidence: 'none', reason };

  const placed = doors
    .filter((d) => d.latitude !== null && d.latitude !== undefined && d.longitude !== null && d.longitude !== undefined)
    .map((d) => ({
      door: d,
      meters: haversineMeters(location, { lat: Number(d.latitude), lng: Number(d.longitude) }),
    }))
    .filter((x) => Number.isFinite(x.meters))
    .sort((a, b) => a.meters - b.meters);

  if (placed.length === 0) {
    return { ...base, confidence: 'none', reason: 'no door on record carries coordinates to compare against' };
  }

  const inRange = placed.filter((x) => x.meters <= radiusMeters);
  if (inRange.length === 0) {
    const n = placed[0];
    return {
      ...base,
      confidence: 'none',
      nearest: { address: n.door.address, meters: Math.round(n.meters) },
      reason: `the nearest door is ${Math.round(n.meters)}m away, beyond the ${radiusMeters}m radius`,
    };
  }

  const addresses = [...new Set(inRange.map((x) => String(x.door.address ?? '').trim().toLowerCase()))];
  if (addresses.length > 1) {
    return {
      ...base,
      confidence: 'ambiguous',
      candidates: inRange.map((x) => ({ address: x.door.address, meters: Math.round(x.meters) })),
      reason: `${addresses.length} different addresses are within ${radiusMeters}m — the landlord picks`,
    };
  }

  // One address. If it holds several doors, GPS has done all it can.
  const address = inRange[0].door.address;
  const nearest = inRange[0];
  // A fix looser than the radius put it in range by luck, not by knowing.
  const loose = accuracyMeters !== null && accuracyMeters > radiusMeters;

  if (inRange.length > 1) {
    return {
      ...base,
      confidence: loose ? 'low' : 'address-only',
      address,
      unitOpen: true,
      candidates: inRange.map((x) => ({ rentalId: x.door.id, unit: x.door.unit ?? null })),
      meters: Math.round(nearest.meters),
      accuracyMeters,
      reason: `${inRange.length} units share this address; GPS cannot tell them apart`,
    };
  }

  return {
    ...base,
    confidence: loose ? 'low' : 'high',
    filed: false, // still a proposal — the landlord confirms, as everywhere else
    rentalId: nearest.door.id,
    address,
    meters: Math.round(nearest.meters),
    accuracyMeters,
    reason: loose
      ? `matched at ${Math.round(nearest.meters)}m, but the fix is only accurate to ${accuracyMeters}m`
      : `matched at ${Math.round(nearest.meters)}m`,
  };
}

/** The camera that took it — useful for telling a worker's phone from a tenant's. */
export function readExifDevice(exif = {}) {
  const parts = [exif.Make, exif.Model].map((v) => String(v ?? '').trim()).filter(Boolean);
  return parts.length ? [...new Set(parts)].join(' ') : null;
}

/**
 * Sort a batch. Every photo lands in exactly one bucket, and the ones needing a
 * person are counted rather than quietly dropped — a sorter that reports only
 * its successes is how a shoebox of unfiled photos becomes invisible.
 */
export function sortBatch(items = [], doors = [], opts = {}) {
  const filed = [];
  const addressOnly = [];
  const needsAPerson = [];
  for (const item of items) {
    const p = proposeFiling(item.exif ?? {}, doors, opts);
    const row = { ...item, proposal: p };
    if (p.confidence === 'high') filed.push(row);
    else if (p.confidence === 'address-only') addressOnly.push(row);
    else needsAPerson.push(row);
  }
  return {
    filed,
    addressOnly,
    needsAPerson,
    total: items.length,
    // Stated so a caller cannot read "12 filed" as "12 of 12".
    summary: `${filed.length} matched to one door, ${addressOnly.length} to an address only, ${needsAPerson.length} need a person`,
  };
}
