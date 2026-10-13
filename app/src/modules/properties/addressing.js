// =============================================================================
// addressing — a Poe Properties page has an ADDRESS, so it can be linked to
// =============================================================================
// Darrell, 2026-10-10, on where feedback belongs:
//
//   "Feedback? Should be inside for app issues... workorders for property
//    issues... make sense?"
//
// and then the requirement that makes it actually useful:
//
//   "It's alread built into the PoeTech App... use discretion and make sure
//    thr fields and pages are all able to be linked to as the page with said
//    issue/s... make sense?"
//
// WHAT WAS MEASURED (2026-10-10). Poe Properties had NO addressing of any
// kind. Every one of its 21 surfaces was held in one React state variable --
// `const [tab, setTab] = useState('')` (PropertiesApp.jsx:244) -- plus the
// door in `activeId` and the Guest Ready area in its own local `area`. The
// URL never changed. So:
//
//   * no page in the module could be linked to, by anyone, ever;
//   * a reload always threw you back to the landing tab, losing the door you
//     had selected and the tab you were reading;
//   * the browser's and the TV remote's BACK gesture left the app entirely
//     instead of stepping back a tab; and
//   * a report saying "this is broken" could not say WHERE, because there was
//     no where to say.
//
// That last one is why this module exists. "Make sure the pages are all able
// to be linked to as the page with said issue" cannot be built on top of a
// surface that has no address -- the deep link has to exist before anything
// can point at it. This is that address.
//
// THE SHAPE, and why it is this shape. The module is already entered through
// a query parameter (`?properties=1`, main.jsx), the door it is standing in
// is a uuid, and a Guest Ready area is a third level. So the address is three
// query parameters beside the one already there, and NOT a path segment:
// Cloudflare Pages serves this app as a static SPA, and a path like
// /properties/app/board would 404 at the edge before React ever ran unless
// every tab were added to the rewrite rules. A query parameter cannot 404.
//
// PURE ON PURPOSE. Nothing here touches window, history or React -- it maps
// strings to strings and back. That is what lets the gate below prove the
// round trip for all 21 surfaces without a browser, and it is what keeps the
// one unavoidable piece of imperative work (pushState) down to a few lines at
// the call site.
// =============================================================================
import { TENANT_TABS, WORKER_TABS, MANAGER_TABS } from './model.js';

// The parameter names. Short, because they ride in a link a person may read
// aloud or paste into a message, and stable, because a link someone saved has
// to keep working.
export const PARAM_TAB = 'p';      // which page
export const PARAM_DOOR = 'door';  // which door it is scoped to
export const PARAM_AREA = 'area';  // a sub-page inside it (Guest Ready's areas)

/**
 * EVERY SURFACE IN THE MODULE, once each, in reading order.
 *
 * Derived from the three face definitions rather than re-listed, because a
 * second hand-maintained list of the module's pages is exactly the failure
 * this change is paying down -- FEEDBACK_AREAS already collapsed all 17
 * manager tabs into a single 'properties' entry, so a reviewer could not file
 * against any of them individually, while the OLDER Real Estate tab it
 * replaced carried eleven sub-entries. The newer surface was the less
 * reportable one.
 *
 * A tab id can appear in more than one face with a DIFFERENT label -- the
 * manager's 'history' is "History", the worker's is "Property history" -- so
 * the id is the key and the faces that show it are carried alongside, which
 * is information a person reading a report wants: it says who was looking.
 */
export function propertiesSurfaces() {
  const byId = new Map();
  const add = (face, t) => {
    const prev = byId.get(t.id);
    if (prev) {
      if (!prev.faces.includes(face)) prev.faces.push(face);
      if (!prev.labels.includes(t.label)) prev.labels.push(t.label);
      return;
    }
    byId.set(t.id, { id: t.id, label: t.label, labels: [t.label], why: t.why, faces: [face] });
  };
  // Manager first: it is the widest face, so its label is the primary one.
  for (const t of MANAGER_TABS) add('manager', t);
  for (const t of WORKER_TABS) add('worker', t);
  for (const t of TENANT_TABS) add('tenant', t);
  return [...byId.values()];
}

/** Just the ids, for a quick membership test. */
export function surfaceIds() {
  return propertiesSurfaces().map((s) => s.id);
}

export function isSurface(id) {
  return surfaceIds().includes(String(id || ''));
}

/**
 * The feedback-area key for a surface. Namespaced under `properties-` so it
 * cannot collide with the Real Estate tab's own `rentals-*` keys, which are a
 * different (older) surface that still exists.
 *
 * FEEDBACK_AREAS' own rule, stated in its header: "Existing keys are STABLE
 * (stored feedback rows reference them); only add, don't rename." So the bare
 * `properties` key STAYS -- every report already filed against it keeps
 * meaning what it meant -- and these are added beside it.
 */
export function areaKeyFor(surfaceId) {
  return `properties-${surfaceId}`;
}

export function surfaceIdFromAreaKey(key) {
  const k = String(key || '');
  if (!k.startsWith('properties-')) return null;
  const id = k.slice('properties-'.length);
  return isSurface(id) ? id : null;
}

// A door id is a uuid in every live row (rentals.id / rental_tenancies.id).
// Validated rather than trusted because it arrives from a URL a stranger can
// type: an unparseable one is DROPPED and the app lands on its own default,
// which is the safe failure -- never a query built from arbitrary text.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDoorId(v) {
  return UUID.test(String(v || ''));
}

// A Guest Ready area id is a plain slug from the readiness board. Bounded the
// same way, and length-capped so a link cannot carry a payload in it.
const AREA = /^[a-z0-9][a-z0-9-]{0,48}$/;

/**
 * Read an address out of a query string. Accepts what `location.search` gives
 * ("?properties=1&p=board"), a bare query, or a URLSearchParams.
 *
 * Returns { tab, door, area } with any field that was absent OR invalid set
 * to null. Never throws: a malformed URL has to land the person SOMEWHERE
 * rather than render nothing, and the caller's own default is that somewhere.
 */
export function addressFromSearch(search) {
  let params;
  try {
    params = search instanceof URLSearchParams
      ? search
      : new URLSearchParams(String(search || '').replace(/^[?]/, ''));
  } catch {
    return { tab: null, door: null, area: null };
  }
  const tab = params.get(PARAM_TAB);
  const door = params.get(PARAM_DOOR);
  const area = params.get(PARAM_AREA);
  return {
    tab: tab && isSurface(tab) ? tab : null,
    door: door && isDoorId(door) ? door : null,
    area: area && AREA.test(area) ? area : null,
  };
}

/**
 * Write an address INTO an existing query string, keeping every parameter
 * that is not ours.
 *
 * Keeping them is the whole reason this takes the current search rather than
 * building one: `?properties=1` is how the door boots at all (main.jsx reads
 * `__params.get('properties') === '1'`), and a demo or reviewer flag can be
 * riding alongside it. A navigation that dropped those would boot the person
 * out of the module they were navigating inside.
 *
 * A null/absent field REMOVES its parameter, so leaving a door-scoped page
 * does not leave a stale door in the link.
 */
export function searchWithAddress(search, { tab = null, door = null, area = null } = {}) {
  const params = new URLSearchParams(String(search || '').replace(/^[?]/, ''));
  const set = (key, value, valid) => {
    if (value && valid(value)) params.set(key, String(value));
    else params.delete(key);
  };
  set(PARAM_TAB, tab, isSurface);
  set(PARAM_DOOR, door, isDoorId);
  set(PARAM_AREA, area, (v) => AREA.test(v));
  const q = params.toString();
  return q ? `?${q}` : '';
}

/**
 * A full link to a page, for a report or a message. `origin` and `pathname`
 * come from the caller because this module never reads window -- and because
 * the SAME module is served at two paths (the PoeTech shell and the
 * /properties/app door), so there is no single correct pathname to assume.
 */
export function linkToAddress({ origin = '', pathname = '', search = '' } = {}, address = {}) {
  return `${origin}${pathname}${searchWithAddress(search, address)}`;
}

/**
 * The human sentence for an address: what a person filing a report, and the
 * person later reading it, both need to see.
 *
 * Written as prose rather than ids because a report that says
 * "properties-readiness" is a report somebody has to decode before they can
 * act on it, and the whole point of naming the page is that nobody has to ask
 * "where?" -- Darrell's standing reason for the record: "less questions for
 * owners."
 */
export function describeAddress({ tab = null, door = null, area = null } = {}, { doorName = '' } = {}) {
  const surface = propertiesSurfaces().find((s) => s.id === tab);
  const page = surface ? surface.label : null;
  if (!page) return 'Poe Properties';
  const where = doorName ? `${page}, on ${doorName}` : page;
  return area ? `${where} (${area})` : where;
}
