// =============================================================================
// life-hub — Christina's home view as a MODEL over real records
// =============================================================================
// Her three mockups agree on the structure and differ only in skin and density,
// so the structure is built once, here, as pure functions over the world the
// app already holds. The component renders what this returns; it invents
// nothing.
//
// THE RULE THIS MODULE EXISTS TO ENFORCE: A TILE SHOWS A NUMBER ONLY WHEN A
// REAL RECORD PRODUCES ONE. Her mockups carry sample numbers, as mockups do —
// a literal 4 on Messages was in the picture. A painted number on the family's
// front screen is the exact defect DR-0061 was written for, and it is worse
// here than anywhere else in the app, because this surface exists to be
// trusted at a glance. So `count` is null wherever this app has no record to
// read, and the renderer shows nothing rather than a zero dressed as news.
//
// WHAT EACH TILE READS, traced to the record (measured 2026-09-17):
//   Big Picture  — no count. It opens the family's years in pictures
//                  (DR-1153); the chapter counts live on that screen, read
//                  from the NAS library, not painted on a tile.
//   Books        — no count. The ledger's honest number is a BALANCE, and a
//                  balance is not a badge: a bare figure on the family's front
//                  screen, with no account beside it and no sign of whether it
//                  is an asset or a debt, is the painted-number defect this
//                  file exists to refuse. The Books tab itself says it
//                  properly. (Until 2026-10-15 this tile opened Learn and
//                  carried no count for a different reason — there is still NO
//                  per-person lesson-progress record in this app.)
//   Messages     — the REAL unread count, passed in from the single DM watcher
//                  (lib/dm-notify.js, which owns the only subscription in the
//                  page). Shown only when it is above zero.
//   Real Estate  — doors, from data.inflows.rentals.
//   Projects     — projects in an ACTIVE status, using the same status list the
//                  capacity layer uses (opportunity-capacity.js), so the hub
//                  and the Action Queue can never disagree about what "open"
//                  means.
//   TLC          — no count. That door runs in its own Supabase instance
//                  (DR-0351); this world cannot see its rows, and a number
//                  invented from nothing is precisely what is forbidden above.
//
// THE "BOOKS" AMBIGUITY, ASKED AND NOW ANSWERED (DR-1055). Christina's tile
// read "Books" with the sub-label "Learn & Grow". In this app "Books" is the
// FINANCIAL surface (BooksAccounts / BooksEntities / Debts), while "Learn &
// Grow" plainly describes the Learn door. The two halves of one tile pointed at
// two different places, so DR-0464 §g recorded the question for Christina
// rather than guessing, and the tile opened LEARN on the sub-label's reading.
//
// Darrell answered it on 2026-10-15, from the home grid on his phone: "Books
// doesn't currently go to the Books tab it goes to Church Learn..."
//
// So the tile opens BOOKS — and the SUB-LABEL CHANGES WITH IT. Pointing the
// label at the ledger while leaving "Learn & Grow" under it would be the same
// lie inverted, and a worse one: a tile that says it teaches and opens the
// family's money. The honest consequence, stated rather than hidden: LEARN
// LOSES ITS HOME TILE. It stays two taps away at Church → Learn, and one tap
// away in the Quick Actions as "Open a lesson", which is why the check that
// used to guard the Learn tile now guards that action instead — the property
// it protects (there is no `view === 'learn'` in this app, so anything aimed at
// Learn must travel as church + learn) is still true and still worth a gate.
import { PROJECT_STATUSES_ACTIVE } from './opportunity-capacity.js';
import { DENSITY_ACTIONS } from './home-view-prefs.js';
import { surfaceAccess } from './surface-access.js';

// The six tiles, in her order, with the sub-labels from her own mockups.
//
// EVERY `view` HERE WAS READ OUT OF THE HOST'S ROUTER, not assumed. A tile that
// opens nothing is a lie (DR-0330), and two of these would have been exactly
// that: there is no `view === 'learn'` in this app — Learn is the CHURCH door
// with `churchView === 'learn'` (poe-financial-mvp-v28.jsx:4561) — and
// properties answer to both 'rentals' and 'properties'. So a destination is a
// pair: the top-level view, and the church sub-view where one is needed.
//
// THE BIG PICTURE OPENS THE FAMILY'S YEARS IN PICTURES (DR-1153). Until
// 2026-10-21 it pointed at `overview` — and since the Hub became the home
// (DR-1046) `overview` IS the Hub, so the tile went nowhere. Darrell: "Clicking
// Big Picture should show the family photos... over time or stories like
// Google stories of pictures of family times over the years... Right now it
// goes nowhere...." A `hub` destination is a panel the Hub itself renders
// (FamilyStories over the NAS library), so `view` is null on purpose and the
// host-route check skips it. "Add a photo" lands in the same place, because
// that is where a new picture takes its place in the year.
export const HUB_TILES = [
  { key: 'bigPicture', label: 'Big Picture', sub: 'Our years in pictures', view: null, churchView: null, hub: 'stories' },
  { key: 'books', label: 'Money', sub: 'Accounts & Debts', view: 'books', churchView: null },
  { key: 'messages', label: 'Messages', sub: 'Stay Connected', view: 'messages', churchView: null },
  { key: 'realEstate', label: 'Real Estate', sub: 'Properties', view: 'rentals', churchView: null },
  { key: 'projects', label: 'Projects', sub: 'Ideas to Reality', view: 'projects', churchView: null },
  { key: 'tlc', label: 'TLC', sub: 'People & Purpose', view: 'tlc', churchView: null },
];

// The router's real top-level view names, read from the host on 2026-09-17 and
// pinned here so a renamed route fails a check instead of a family member's tap.
export const HOST_VIEWS = ['overview', 'church', 'books', 'messages', 'rentals', 'projects', 'tlc', 'notes', 'create', 'voice', 'recipes', 'health', 'games', 'tvtime', 'library', 'vault', 'research', 'cameras', 'databack', 'markets', 'advocacy', 'scribe', 'crm', 'inventory', 'forecast', 'cohorts'];

// THE QUICK ACTIONS ARE DOORS TO THE TABS THE TILES DO NOT ALREADY OPEN.
//
// Until 2026-10-21 they were the eight of her densest mockup, and four of them
// opened what a tile beside them already opened (Messages, Projects, Real
// Estate, Money). Darrell, with the Hub on his phone: "Add notes and create to
// the quick links", then: "Have more options, none that overlap, so we have
// more options and advertise the other tabs." (DR-1192.) So:
//
//   - the three RECORD actions stay (focus, goal, photo): they act on this
//     page's own records, not on a tab;
//   - every other action is a door to ONE tab, and no two actions, and no
//     action and tile, open the same place (pinned: `overlappingActions`);
//   - every door names its `surface` in surfaces.js, and `actionsFor` keeps
//     only the doors this viewer may open, by the SAME rule the nav uses
//     (lib/surface-access.js) — a door nobody can walk through is not drawn
//     (DR-0330), so a visitor sees the open rooms and the family sees more;
//   - the order is everyday first; the density decides how many show.
//
// Every `view` / `churchView` here was read out of the host's render switch
// (poe-financial-mvp-v28.jsx) and is pinned against it in life-hub.test.jsx.
export const HUB_ACTIONS = [
  { key: 'focus', label: "Add today's focus", view: null, churchView: null },
  { key: 'goal', label: 'Set a goal', view: null, churchView: null },
  { key: 'photo', label: 'Add a photo', view: null, churchView: null, hub: 'stories' },
  { key: 'lesson', label: 'Open a lesson', view: 'church', churchView: 'learn', surface: 'learn' },
  { key: 'notes', label: 'Open Notes', view: 'notes', churchView: null, surface: 'notes' },
  { key: 'create', label: 'Open Create', view: 'create', churchView: null, surface: 'create' },
  { key: 'voice', label: 'Open Voice', view: 'voice', churchView: null, surface: 'voice' },
  { key: 'scripture', label: 'Read Scripture', view: 'church', churchView: 'scripture', surface: 'scripture' },
  { key: 'recipes', label: "Chef's Corner", view: 'recipes', churchView: null, surface: 'recipes' },
  { key: 'health', label: 'Road to 150', view: 'health', churchView: null, surface: 'health' },
  { key: 'games', label: 'Play a game', view: 'games', churchView: null, surface: 'games' },
  { key: 'tvtime', label: 'TV Time', view: 'tvtime', churchView: null, surface: 'tvtime' },
  { key: 'library', label: 'Open the Library', view: 'library', churchView: null, surface: 'library' },
  { key: 'vault', label: 'Open the Vault', view: 'vault', churchView: null, surface: 'vault' },
  { key: 'research', label: 'Research', view: 'research', churchView: null, surface: 'research' },
  { key: 'cameras', label: 'See the cameras', view: 'cameras', churchView: null, surface: 'cameras' },
  { key: 'databack', label: 'Your Data', view: 'databack', churchView: null, surface: 'databack' },
  { key: 'markets', label: 'Markets', view: 'markets', churchView: null, surface: 'markets' },
  { key: 'advocacy', label: 'Advocacy', view: 'advocacy', churchView: null, surface: 'advocacy' },
  { key: 'scribe', label: 'Scribe', view: 'scribe', churchView: null, surface: 'scribe' },
  { key: 'crm', label: 'CRM', view: 'crm', churchView: null, surface: 'crm' },
  { key: 'inventory', label: 'Inventory', view: 'inventory', churchView: null, surface: 'inventory' },
  { key: 'forecast', label: 'Forecast', view: 'forecast', churchView: null, surface: 'forecast' },
  { key: 'cohorts', label: 'Academy', view: 'cohorts', churchView: null, surface: 'cohorts' },
];

/** Where a tile or action lands, as one comparable string; records are null. */
export function destinationOf(x = {}) {
  if (x.hub) return `hub:${x.hub}`;
  if (!x.view) return null;
  return x.churchView ? `${x.view}/${x.churchView}` : x.view;
}

/**
 * Actions that open a tab another action, or a tile, already opens. Empty is
 * the promise; the test pins it, and a new action that duplicates a tile fails
 * there instead of on somebody's phone. Hub records (the stories panel the Big
 * Picture tile also opens) are this page's own, not a tab, and are not counted.
 */
export function overlappingActions(actions = HUB_ACTIONS, tiles = HUB_TILES) {
  const seen = new Map();
  for (const t of tiles) { const d = destinationOf(t); if (d && !d.startsWith('hub:')) seen.set(d, `tile ${t.key}`); }
  const out = [];
  for (const a of actions) {
    const d = destinationOf(a);
    if (!d || d.startsWith('hub:')) continue;
    if (seen.has(d)) out.push({ key: a.key, destination: d, same: seen.get(d) });
    else seen.set(d, `action ${a.key}`);
  }
  return out;
}

/** Active projects, by the SAME definition the capacity layer uses. */
export function openProjectCount(projects = []) {
  return (Array.isArray(projects) ? projects : [])
    .filter((p) => p && PROJECT_STATUSES_ACTIVE.includes(p.status)).length;
}

/** Doors the family actually has on record. */
export function doorCount(world = {}) {
  const rentals = world?.inflows?.rentals;
  return Array.isArray(rentals) ? rentals.length : 0;
}

/**
 * The tiles, each with a `count` that is either a real number or null.
 * `unread` comes from the page's single DM watcher; it is never defaulted to a
 * decorative value, and zero unread reads as no badge rather than "0".
 */
export function hubTiles(world = {}, { unread = 0 } = {}) {
  const n = Number(unread);
  const unreadReal = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  return HUB_TILES.map((t) => {
    let count = null;
    if (t.key === 'messages') count = unreadReal > 0 ? unreadReal : null;
    if (t.key === 'realEstate') count = doorCount(world);
    if (t.key === 'projects') count = openProjectCount(world?.projects);
    return { ...t, count };
  });
}

/**
 * How many Quick Actions this density shows, and which ones: the doors this
 * viewer may open, in order, cut to the density's count. `surfaces` is the
 * registry keyed by id (surfaceById); without it every door is assumed open,
 * which only a test should rely on.
 */
export function actionsFor(density = 'airy', { viewer = null, surfaces = null } = {}) {
  const n = DENSITY_ACTIONS[density] || DENSITY_ACTIONS.airy;
  const open = HUB_ACTIONS.filter((a) => {
    if (!a.surface || !surfaces) return true;
    const s = surfaces[a.surface];
    if (!s) return false;
    return surfaceAccess(s, viewer || {}).allowed;
  });
  return open.slice(0, n);
}

/** True when a tile's number came from a record rather than from nowhere. */
export function hasRealCount(tile) {
  return tile && typeof tile.count === 'number' && Number.isFinite(tile.count);
}
