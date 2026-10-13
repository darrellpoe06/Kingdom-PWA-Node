// =============================================================================
// own-space — a landlord gets their own app, by their own hand (DR-1007)
// =============================================================================
// The door asks "Who are you?" and one answer is "I own properties". For the
// family that answer was always true; for anyone else it was a dead end: after
// the sign-in they met the tenant face with nothing on it. This module holds
// the pure parts of the road out of that dead end:
//
//   * the intent that survives the sign-in reload (`?who=landlord` in the
//     page's own address — not storage, so a shared or re-opened link says
//     the same thing on every device and a test can read it);
//   * the two paths a landlord may choose and where each one lands;
//   * the words the chooser says.
//
// Nothing here talks to the network; cloud.js carries the RPC.
// =============================================================================

export const WHO_PARAM = 'who';

/** The intent carried in the address: 'landlord', or null when none is said. */
export function readWhoIntent(search = '') {
  try {
    const v = new URLSearchParams(String(search || '')).get(WHO_PARAM);
    return v === 'landlord' ? 'landlord' : null;
  } catch { return null; }
}

/** The same address with the intent written into it (keeps every other key). */
export function withWhoIntent(search = '', who = 'landlord') {
  const q = new URLSearchParams(String(search || ''));
  q.set(WHO_PARAM, who);
  return `?${q.toString()}`;
}

/** The same address with the intent taken out; '' when nothing is left. */
export function withoutWhoIntent(search = '') {
  const q = new URLSearchParams(String(search || ''));
  q.delete(WHO_PARAM);
  const s = q.toString();
  return s ? `?${s}` : '';
}

/**
 * The two paths. `id` is what claim_landlord_space(path_in) accepts; `goes`
 * is where the person lands once the space exists — a same-origin path, so
 * the journeys' own stack and poetech.us read the same words.
 */
export const LANDLORD_PATHS = Object.freeze([
  Object.freeze({
    id: 'properties',
    title: 'Poe Properties by itself',
    blurb: 'Your doors, tenants, work orders, pictures and the rent record — the property app alone, at /properties.',
    goes: '/properties/app/?properties=1',
  }),
  Object.freeze({
    id: 'poetech',
    title: 'The full PoeTech app',
    blurb: 'Poe Properties inside PoeTech: the same doors beside your books, family, lessons and the rest. You can start here and add the full app later.',
    goes: '/?view=properties',
  }),
]);

export function landlordPath(id) {
  return LANDLORD_PATHS.find((p) => p.id === id) || null;
}

/** Where a claim lands; null for a path that is not one of the two. */
export function landingFor(id) {
  return landlordPath(id)?.goes || null;
}

/**
 * Does this person hold a landlord seat? The resolver (0207) answers with the
 * seat or nothing; a seat of ANY role is the proof — a manager seated in
 * someone's space is not a prospective landlord and must not be offered one.
 */
export function holdsSeat(seat) {
  return Boolean(seat && seat.instance_id);
}

/** The owner's face is earned by the seat, not only by owning a door already. */
export function seatIsOwner(seat) {
  return Boolean(seat && seat.instance_id && (seat.role === 'owner' || seat.role === 'admin'));
}

/** Where the person goes once the space exists. One seam, so a test can watch it. */
export function navigate(url) {
  if (typeof window !== 'undefined' && url) window.location.assign(url);
}
