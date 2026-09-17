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
//   Big Picture  — no count. It IS the overview; a number on it would be a
//                  summary of a summary.
//   Learn & Grow — no count. There is NO per-person lesson-progress record in
//                  this app: `grep -rn "lessonProgress|lessonsCompleted|
//                  completedLessons|lesson_progress|learnProgress" app/src/lib`
//                  returns nothing. The catalog's 169 lessons are platform
//                  content, not her progress, so printing it here would answer
//                  a question she did not ask. When a progress record ships,
//                  this is the one line to change.
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
// THE "BOOKS" AMBIGUITY, NAMED RATHER THAN GUESSED. Her tile reads "Books" with
// the sub-label "Learn & Grow". In this app "Books" is the FINANCIAL surface
// (BooksAccounts / BooksEntities / Debts), while "Learn & Grow" plainly
// describes the Learn door. The sub-label is the clearer statement of intent,
// so this tile opens LEARN, and the financial books stay one tap away behind
// Big Picture. If she meant the money books, it is one line here — and the
// question is in DR-0464 rather than silently resolved.
import { PROJECT_STATUSES_ACTIVE } from './opportunity-capacity.js';
import { DENSITY_ACTIONS } from './home-view-prefs.js';

// The six tiles, in her order, with the sub-labels from her own mockups.
//
// EVERY `view` HERE WAS READ OUT OF THE HOST'S ROUTER, not assumed. A tile that
// opens nothing is a lie (DR-0330), and two of these would have been exactly
// that: there is no `view === 'learn'` in this app — Learn is the CHURCH door
// with `churchView === 'learn'` (poe-financial-mvp-v28.jsx:4561) — and
// properties answer to both 'rentals' and 'properties'. So a destination is a
// pair: the top-level view, and the church sub-view where one is needed.
export const HUB_TILES = [
  { key: 'bigPicture', label: 'Big Picture', sub: 'My Life Overview', view: 'overview', churchView: null },
  { key: 'learn', label: 'Books', sub: 'Learn & Grow', view: 'church', churchView: 'learn' },
  { key: 'messages', label: 'Messages', sub: 'Stay Connected', view: 'messages', churchView: null },
  { key: 'realEstate', label: 'Real Estate', sub: 'Properties', view: 'rentals', churchView: null },
  { key: 'projects', label: 'Projects', sub: 'Ideas to Reality', view: 'projects', churchView: null },
  { key: 'tlc', label: 'TLC', sub: 'People & Purpose', view: 'tlc', churchView: null },
];

// The router's real top-level view names, read from the host on 2026-09-17 and
// pinned here so a renamed route fails a check instead of a family member's tap.
export const HOST_VIEWS = ['overview', 'church', 'messages', 'rentals', 'projects', 'tlc'];

// The Quick Actions, in the order her densest mockup shows them. Every one of
// these has real machinery behind it in this app; none is a placeholder.
export const HUB_ACTIONS = [
  { key: 'focus', label: "Add today's focus", view: null, churchView: null },
  { key: 'goal', label: 'Set a goal', view: null, churchView: null },
  { key: 'message', label: 'Send a message', view: 'messages', churchView: null },
  { key: 'lesson', label: 'Open a lesson', view: 'church', churchView: 'learn' },
  { key: 'addProject', label: 'Start a project', view: 'projects', churchView: null },
  { key: 'property', label: 'Check a property', view: 'rentals', churchView: null },
  { key: 'money', label: 'Open the books', view: 'books', churchView: null },
  { key: 'photo', label: 'Add a photo', view: 'overview', churchView: null },
];

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

/** How many Quick Actions this density shows, and which ones. */
export function actionsFor(density = 'airy') {
  const n = DENSITY_ACTIONS[density] || DENSITY_ACTIONS.airy;
  return HUB_ACTIONS.slice(0, n);
}

/** True when a tile's number came from a record rather than from nowhere. */
export function hasRealCount(tile) {
  return tile && typeof tile.count === 'number' && Number.isFinite(tile.count);
}
