// =============================================================================
// app-doors — WHICH DOOR a space lives behind, and which door this page is
// =============================================================================
// THE BREAK THIS FIXES (measured 2026-09-16, reported twice by Darrell in one
// sitting):
//
//   1. "The messages notifications don't work fully... the open the app to the
//      welcome instead of the text message."
//   2. "I text Christina from the Love Corner App and receive a text from the
//      PoeTech App... I also need the message to be sent from and received
//      from the group it belongs to originally."
//
// Two independent defects, one missing primitive. `push-announce.js` shipped a
// landing of `/poetech-app/?tab=messages`:
//
//   * `?tab=` — the shell has NEVER read a `tab` param. getInitialView() and
//     parseNav() both read `?view=`. So an unknown param fell through to the
//     default view and the tap landed on Big Picture with the welcome card on
//     it. That is defect 1, exactly as photographed.
//   * `/poetech-app/` — hard-coded. Since DR-0258 the installable faces live
//     under DISJOINT scopes (/poetech-app/, /lovecorner/app/, /moore/app/,
//     /tlc/app/, /properties/app/), each with its own served HTML and its own
//     manifest. A church thread notified into /poetech-app/ hands a member the
//     family door. That is defect 2.
//
// So a landing needs one fact nothing in the app could answer: GIVEN A SPACE,
// WHICH DOOR IS ITS APP. This module is that answer, in one place, as data.
// It is also the answer for the same question asked the other way — which door
// is THIS page — which is what lets feedback be filed to the space it was
// actually given in (Darrell, same sitting: "Feedback should work the same
// way").
//
// PURE (no React, no network, no Supabase). Every value below is READ from
// something that already exists, never guessed:
//   * the door paths are the MPA inputs in app/vite.config.js, each with a
//     served index.html on disk (app-doors.test.js asserts both — a typo in a
//     path fails CI rather than sending a person to a 404).
//   * 'colg' is the church instance slug seeded by migration 0012 and used by
//     ~20 later migrations; 'poe-family' is the default instance the same
//     migration seeds; 'moore-divahs' is business-registry.js's row.
//   * 'tlc-therapy-solutions' and 'poe-properties' were read from the LIVE
//     instances table on 2026-09-16 (the content-sync run that carried them).
// =============================================================================

/** PoeTech's own door — the family app, and the fallback for any space that
 *  has no door of its own. A space without a door is not an error: most
 *  instances (a trust, a holding company) are only ever met inside the family
 *  app, and that is where their notifications belong. */
export const PERSONAL_DOOR = '/poetech-app/';

/**
 * Every installable door, keyed by its path. `instances` lists the instance
 * SLUGS whose app is that door. One door may serve several slugs (a door older
 * than a rename still has to work); a slug appears under exactly one door.
 */
export const DOORS = [
  {
    path: PERSONAL_DOOR,
    key: 'poetech',
    label: 'PoeTech',
    instances: ['poe-family'],
  },
  {
    path: '/lovecorner/app/',
    key: 'lovecorner',
    label: 'The Love Corner',
    // Migration 0012 seeds the church as slug 'colg'; DR-0174/DR-0258 gave it
    // the /lovecorner/ scope. The name a member reads is The Love Corner.
    instances: ['colg'],
  },
  {
    path: '/moore/app/',
    key: 'moore',
    label: 'Moore Divahs',
    instances: ['moore-divahs'],
  },
  {
    path: '/tlc/app/',
    key: 'tlc',
    label: 'TLC Therapy Solutions',
    // Both slugs are honored on purpose: crm-engine.js carries 'tlc' and the
    // live instances table carries 'tlc-therapy-solutions' (read 2026-09-16).
    instances: ['tlc-therapy-solutions', 'tlc'],
  },
  {
    path: '/properties/app/',
    key: 'properties',
    label: 'Poe Properties',
    instances: ['poe-properties'],
  },
];

const byPath = new Map(DOORS.map((d) => [d.path, d]));

/** The door a space's app lives behind. An unknown or absent slug is the
 *  personal door — never null, because a landing must always be openable. */
export function doorForInstanceSlug(slug) {
  const s = String(slug || '').toLowerCase().trim();
  if (s) {
    for (const d of DOORS) {
      if (d.instances.includes(s)) return d;
    }
  }
  return byPath.get(PERSONAL_DOOR);
}

// THE NAME A PERSON RECOGNIZES IS THE DOOR'S (DR-0447).
// ---------------------------------------------------------------------------
// Darrell 2026-09-16, with the Messages -> Add contact picker open: "Messages
// don't give an option for the Love Corner." Measured the same day: the option
// WAS there — he owns that space — listed under the name its row carries, "The
// Church of the Living God." He opens that house through a door named The Love
// Corner, so nothing in the list read as the thing he was looking for. A space
// named only by its registry name is, to the person using it, missing.
//
// So a space is labeled by the DOOR it lives behind, with its own name kept
// beside it: the door is what the person opens, the display name is what the
// record says, and neither is invented here (both are real values, DR-0121).
// When a space IS its door's namesake, the name is said once.
export function doorLabelForInstanceSlug(slug) {
  return doorForInstanceSlug(slug).label;
}

export function spaceLabel({ slug, displayName } = {}) {
  const name = String(displayName || '').trim();
  const door = doorLabelForInstanceSlug(slug);
  if (!name) return door;
  if (!slug) return name;                       // no slug: nothing to name a door from
  if (name.toLowerCase() === door.toLowerCase()) return name;
  return `${door} \u00b7 ${name}`;
}

/** Just the base path, for callers that only need somewhere to land. */
export function doorPathForInstanceSlug(slug) {
  return doorForInstanceSlug(slug).path;
}

/**
 * The door THIS page booted as, decided by where it booted — the same rule
 * PwaPrompts' currentFace() uses for install identity, and for the same
 * reason: a door is a page-load property, not a tab you are on. The church
 * door's legacy launch param (?lovecorner=1) is honored so a page opened from
 * a printed QR is still the church's door.
 */
export function currentDoor(pathname, search) {
  const p = String(pathname || '');
  for (const d of DOORS) {
    if (d.path !== PERSONAL_DOOR && p.indexOf(d.path) === 0) return d;
  }
  try {
    const sp = new URLSearchParams(search || '');
    for (const d of DOORS) {
      if (d.key !== 'poetech' && sp.get(d.key) === '1') return d;
    }
  } catch { /* malformed query: the path already decided */ }
  return byPath.get(PERSONAL_DOOR);
}

// ── deep links a notification can carry ─────────────────────────────────────

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Where a tap on "<name> sent you a message" must land: the Messages surface
 * OF THE THREAD'S OWN DOOR, with that person's thread already open.
 *
 * `dm` carries the OTHER party's user id — the one value DirectMessages needs
 * to open a thread (its `openWith` is an otherUserId). A non-uuid is dropped
 * rather than written through, so a bad value lands on the Messages list
 * instead of a dead deep link.
 */
export function messageLanding({ instanceSlug, peerUserId } = {}) {
  const base = doorPathForInstanceSlug(instanceSlug);
  const peer = String(peerUserId || '');
  const q = UUID.test(peer)
    ? `?view=messages&dm=${encodeURIComponent(peer)}`
    : '?view=messages';
  return base + q;
}

/** Where a tap on "the service is live" must land: the Church surface of that
 *  space's own door. */
export function liveLanding({ instanceSlug } = {}) {
  return `${doorPathForInstanceSlug(instanceSlug)}?view=church`;
}

/** The `dm=` peer in a query string, or null. Pure; validated. */
export function dmPeerFrom(search) {
  try {
    const v = new URLSearchParams(search || '').get('dm') || '';
    return UUID.test(v) ? v : null;
  } catch {
    return null;
  }
}

// ── the boot snapshot (the one stateful thing here, and why) ────────────────
//
// nav-history's history seed rewrites the URL on arrival and keeps only
// view/sub/PRESERVED_PARAMS, so `dm=` is gone within a tick of boot. The
// Messages surface is LAZY (surfaces.js imports it on demand), so by the time
// it mounts the param it needs no longer exists. So the value is snapshotted
// once, synchronously, at module load — the shell imports this module at its
// own module scope — and the surface CONSUMES it. Consuming clears it, so
// leaving Messages and coming back later does not silently reopen the thread.

let snapshot = null;
let snapshotTaken = false;

/** Snapshot the deep link from the current location. Idempotent: the first
 *  call wins, so a later import can never re-read a rewritten URL. */
export function captureDeepLink(search) {
  if (snapshotTaken) return snapshot;
  snapshotTaken = true;
  const s = search != null
    ? search
    : (typeof window !== 'undefined' && window.location ? window.location.search : '');
  snapshot = { dmPeer: dmPeerFrom(s) };
  return snapshot;
}

/** Take the snapshotted DM peer, once. Null when there was none, or when it
 *  has already been used. */
export function consumeDmPeer() {
  const snap = captureDeepLink();
  const peer = snap.dmPeer;
  snapshot = { ...snap, dmPeer: null };
  return peer;
}

/** Test seam only: forget the snapshot so a case can take its own. */
export function resetDeepLinkForTests() {
  snapshot = null;
  snapshotTaken = false;
}
