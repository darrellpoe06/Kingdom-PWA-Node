// =============================================================================
// properties/readiness — is this door ready to take a guest?
// =============================================================================
// Darrell, 2026-09-12: a completion checklist for the Airbnb apartment — "track
// everything that needs to be completed before the apartment is ready to list
// and accept guests." It began life as a standalone page
// (tools/airbnb-checklist/); this is that work brought INTO the app, where the
// door it describes already lives (CLAUDE.md, "The App Is the Primary Artifact").
//
// REALITY-TRACE (DR-0061), before the code as the rule requires:
//   · The real record is board_tasks (migration 0059) — the same table, the same
//     RLS, the same realtime sync the Project Boards already ride. NO migration:
//     status/notes/group_label/sort_rank are columns, and the cost rides
//     links.readiness.cost (jsonb), which is what links exists for.
//   · One board per door: board_slug = `airbnb-ready:<rental ref>`. Slugs carry
//     the door too, because board_tasks is UNIQUE on (instance_id, slug).
//   · NOTHING IS SEEDED. The 181-item list is a TEMPLATE that lives in this
//     file; a row is written the moment a task is actually touched. An untouched
//     door holds zero rows, and the database never stores a copy of a constant.
//     Untouched items read as Not Started because that is what they are.
//   · BEDROOMS ARE NOT INVENTED. The bedroom groups come from the door's real
//     property_rooms rows (kind === 'bedroom'), named as the landlord named
//     them. A door with no bedroom rooms recorded says so and sends him to the
//     Rooms tab — it never paints "Bedroom 1" that nobody entered.
//
// PURE: no I/O, no React. The caller supplies the rows and the rooms; this
// decides what the door's readiness actually is.
// =============================================================================

/** The three statuses the checklist offers, mapped onto 0059's CHECK values. */
export const READY_STATUS = Object.freeze({
  'not-started': { label: 'Not Started', short: 'To do' },
  'in-progress': { label: 'In Progress', short: 'Started' },
  done: { label: 'Completed', short: 'Done' },
});
export const READY_STATUS_ORDER = Object.freeze(['not-started', 'in-progress', 'done']);

/** Every task a bedroom needs, applied to each real bedroom in the unit. */
export const BEDROOM_TASKS = Object.freeze([
  'Bed frame', 'Mattress', 'Mattress protector', 'Two complete sheet sets',
  'Pillows', 'Pillow protectors', 'Comforter or duvet', 'Extra blanket',
  'Nightstand', 'Bedside lamp', 'Dresser or clothing storage', 'Hangers',
  'Full-length mirror', 'Curtains or blinds', 'Charging access near bed', 'Trash can',
]);

/**
 * The nine areas. `perBedroom` marks the one that expands against the door's
 * real rooms instead of carrying a fixed list.
 */
export const READINESS_SECTIONS = Object.freeze([
  {
    id: 'construction', name: 'Construction & Repairs', short: 'Construction',
    tasks: [
      'Walls patched and repaired', 'Drywall finished', 'Walls painted',
      'Ceilings finished and painted', 'Baseboards installed', 'Trim installed and painted',
      'Interior doors installed', 'Doors painted', 'Door handles installed',
      'Doors close and lock properly', 'Flooring completed', 'Windows checked',
      'Window locks working', 'Blinds or curtains installed', 'Outlet covers installed',
      'Switch covers installed', 'Light fixtures installed', 'All lights tested',
      'Smoke detectors installed and tested', 'Carbon monoxide detector installed if needed',
      'Heating working', 'Air conditioning working', 'Plumbing checked for leaks',
      'No exposed wiring', 'No unfinished holes or construction areas',
    ],
  },
  {
    id: 'kitchen', name: 'Kitchen', short: 'Kitchen',
    tasks: [
      'Refrigerator', 'Stove/oven', 'Microwave', 'Dishwasher if applicable',
      'Microwave/kitchen exhaust vent completed', 'Cabinets completed', 'Countertops completed',
      'Kitchen sink working', 'Faucet working with no leaks', 'Garbage can', 'Trash bags',
      'Coffee maker', 'Toaster', 'Pots and pans', 'Baking sheet', 'Cooking utensils',
      'Kitchen knives', 'Cutting board', 'Can opener', 'Bottle opener', 'Plates', 'Bowls',
      'Drinking glasses', 'Coffee mugs', 'Wine glasses', 'Silverware', 'Dish soap',
      'Sponges', 'Dish towels', 'Paper towels', 'Coffee and tea supplies',
    ],
  },
  { id: 'bedrooms', name: 'Bedrooms', short: 'Bedrooms', perBedroom: true, tasks: BEDROOM_TASKS },
  {
    id: 'bathroom', name: 'Bathroom', short: 'Bathroom',
    tasks: [
      'Toilet working', 'Bathroom sink working', 'Faucet working', 'Shower/tub completed',
      'Hot water tested', 'Shower curtain', 'Shower liner or shower door', 'Bath towels',
      'Hand towels', 'Washcloths', 'Bath mat', 'Toilet paper', 'Extra toilet paper',
      'Toilet brush', 'Plunger', 'Trash can', 'Hand soap', 'Shampoo', 'Body wash',
      'Hair dryer', 'Towel bars/hooks',
    ],
  },
  {
    id: 'living', name: 'Living & Dining Area', short: 'Living/Dining',
    tasks: [
      'Sofa', 'Chairs', 'Coffee table', 'End tables', 'TV', 'TV mounted or positioned',
      'Wi-Fi installed', 'Wi-Fi tested', 'Streaming/TV setup tested', 'Lamps',
      'Dining table', 'Dining chairs', 'Area rug if needed', 'Wall art', 'Decorations',
      'Curtains/blinds', 'Charging outlets accessible',
    ],
  },
  {
    id: 'supplies', name: 'Cleaning & Guest Supplies', short: 'Supplies',
    tasks: [
      'Vacuum', 'Broom', 'Dustpan', 'Mop', 'Cleaning products',
      'Laundry detergent if applicable', 'Iron', 'Ironing board', 'Extra sheets',
      'Extra towels', 'Extra blankets', 'Extra toilet paper', 'Extra paper towels',
      'Extra trash bags',
    ],
  },
  {
    id: 'safety', name: 'Safety & Airbnb Setup', short: 'Safety',
    tasks: [
      'Secure exterior door lock', 'Smart lock/keypad if using self check-in',
      'Guest access procedure established', 'Fire extinguisher', 'Smoke detectors tested',
      'Carbon monoxide detector tested if applicable', 'Emergency exits clear',
      'First-aid kit', 'House rules written', 'Wi-Fi information prepared',
      'Check-in instructions written', 'Check-out instructions written',
      'Parking instructions written', 'Emergency contact information available',
    ],
  },
  {
    id: 'walkthrough', name: 'Final Walk-Through', short: 'Final Walk-Through',
    tasks: [
      'Deep clean entire apartment', 'Remove construction dust', 'Remove construction debris',
      'Check every cabinet', 'Check every drawer', 'Test every light', 'Test every appliance',
      'Test electrical outlets', 'Test hot and cold water', 'Flush toilet', 'Run shower',
      'Test heating', 'Test air conditioning', 'Test Wi-Fi throughout apartment',
      'Check furniture for stability', 'Check apartment for odors', 'Make all beds',
      'Stage bathrooms', 'Stage towels', 'Stock kitchen', 'Stock bathroom',
      'Complete one-night test stay', 'Fix anything discovered during test stay',
    ],
  },
  {
    id: 'listing', name: 'Airbnb Listing', short: 'Airbnb Listing',
    tasks: [
      'Take high-quality photos', 'Choose cover photo', 'Write listing title',
      'Write property description', 'List amenities', 'Enter number of guests',
      'Enter bedrooms and beds', 'Enter bathroom information', 'Establish nightly rate',
      'Establish cleaning fee', 'Set minimum stay', 'Set check-in time', 'Set check-out time',
      'Set cancellation policy', 'Set house rules', 'Add parking information',
      'Add Wi-Fi information', 'Set calendar availability', 'Review listing', 'Publish listing',
    ],
  },
]);

const BOARD_PREFIX = 'airbnb-ready:';

/** The board_slug for one door. `ref` is the rental's slug or id — never empty. */
export function readinessBoardSlug(ref) {
  const clean = String(ref || '').trim();
  return clean ? `${BOARD_PREFIX}${clean}` : '';
}

/**
 * Is this board a property's readiness list? The Projects hub uses it to keep
 * a door's checklist OUT of the program-board list — a board there is a program
 * the family runs, and 1003 Koehn's towel count is not one of them.
 */
export function isReadinessBoard(boardSlug) {
  return String(boardSlug || '').startsWith(BOARD_PREFIX);
}

/** Stable per-instance slug. board_tasks is UNIQUE(instance_id, slug). */
export function readinessSlug(boardSlug, key) {
  return `${boardSlug}:${key}`;
}

/** The live bedrooms of a door, as the landlord named them (property_rooms). */
export function bedroomsOf(rooms = []) {
  return (Array.isArray(rooms) ? rooms : [])
    .filter((r) => r && r.kind === 'bedroom' && !r.archived_at)
    .map((r) => ({ id: String(r.id), name: String(r.name || 'Bedroom').trim() || 'Bedroom' }));
}

/**
 * 0059's CHECK allows a fourth value, 'blocked'. This surface never writes one,
 * but a row that arrives carrying it is started-and-not-done — reading it as
 * Not Started would under-report work that is genuinely underway.
 */
export function normalizeReadyStatus(status) {
  if (status === 'done') return 'done';
  if (status === 'in-progress' || status === 'blocked') return 'in-progress';
  return 'not-started';
}

const readinessLinks = (row) => (row && row.links && typeof row.links === 'object' && row.links.readiness) || {};

/** The cost a row carries, or null. Never a guess, never negative. */
export function costOf(row) {
  const raw = readinessLinks(row).cost;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const isRemoved = (row) => readinessLinks(row).removed === true;
const isCustom = (row) => readinessLinks(row).custom === true;

/**
 * The template, expanded for THIS door: every task the door should have, with
 * its stable slug, its section and its display group. Bedrooms expand against
 * the real rooms; with none recorded the section expands to nothing and the
 * surface says why.
 */
export function templateFor(boardSlug, rooms = []) {
  const out = [];
  for (const sec of READINESS_SECTIONS) {
    if (sec.perBedroom) {
      bedroomsOf(rooms).forEach((bed) => {
        sec.tasks.forEach((title, i) => {
          out.push({
            key: `${sec.id}:${bed.id}:${i}`,
            slug: readinessSlug(boardSlug, `${sec.id}:${bed.id}:${i}`),
            sectionId: sec.id, group: bed.name, title, sortRank: out.length,
          });
        });
      });
      continue;
    }
    sec.tasks.forEach((title, i) => {
      out.push({
        key: `${sec.id}:${i}`,
        slug: readinessSlug(boardSlug, `${sec.id}:${i}`),
        sectionId: sec.id, group: sec.name, title, sortRank: out.length,
      });
    });
  }
  return out;
}

/** Roll a list of merged tasks into the numbers every header shows. */
export function readinessTally(tasks = []) {
  const t = { total: tasks.length, done: 0, started: 0, cost: 0 };
  for (const task of tasks) {
    if (task.status === 'done') t.done += 1;
    else {
      if (task.status === 'in-progress') t.started += 1;
      if (typeof task.cost === 'number') t.cost += task.cost;
    }
  }
  t.left = t.total - t.done;
  t.pct = t.total ? Math.round((t.done / t.total) * 100) : 0;
  return t;
}

/**
 * The door's readiness, merged from the template and the rows that exist.
 *
 * A template item with no row is a real Not Started task (`row: null`) — the
 * absence IS the state, which is why nothing is seeded. A row marked removed
 * drops its template item; a custom row is appended to its section.
 */
export function readinessBoard(boardSlug, rows = [], rooms = []) {
  const mine = (Array.isArray(rows) ? rows : []).filter((r) => r && r.boardSlug === boardSlug);
  const bySlug = new Map(mine.map((r) => [r.slug, r]));

  const tasks = [];
  for (const item of templateFor(boardSlug, rooms)) {
    const row = bySlug.get(item.slug) || null;
    if (row && isRemoved(row)) continue;
    tasks.push({
      ...item,
      row,
      title: row && row.title ? row.title : item.title,
      group: row && row.group ? row.group : item.group,
      status: row ? normalizeReadyStatus(row.status) : 'not-started',
      note: (row && row.notes) || '',
      cost: costOf(row),
      custom: false,
    });
  }
  for (const row of mine) {
    if (!isCustom(row) || isRemoved(row)) continue;
    const links = readinessLinks(row);
    const sectionId = READINESS_SECTIONS.some((s) => s.id === links.section) ? links.section : 'construction';
    tasks.push({
      key: row.slug, slug: row.slug, sectionId,
      group: row.group || (READINESS_SECTIONS.find((s) => s.id === sectionId) || {}).name || '',
      title: row.title || 'Untitled task',
      sortRank: row.sortRank != null ? row.sortRank : Number.MAX_SAFE_INTEGER,
      row,
      status: normalizeReadyStatus(row.status),
      note: row.notes || '',
      cost: costOf(row),
      custom: true,
    });
  }

  const sections = READINESS_SECTIONS.map((sec) => {
    const secTasks = tasks
      .filter((t) => t.sectionId === sec.id)
      .sort((a, b) => (a.sortRank || 0) - (b.sortRank || 0));
    const groups = [];
    for (const t of secTasks) {
      let g = groups.find((x) => x.name === t.group);
      if (!g) { g = { name: t.group, tasks: [] }; groups.push(g); }
      g.tasks.push(t);
    }
    return {
      ...sec,
      tasks: secTasks,
      groups: groups.map((g) => ({ ...g, tally: readinessTally(g.tasks) })),
      grouped: !!sec.perBedroom,
      tally: readinessTally(secTasks),
    };
  });

  return { boardSlug, sections, tasks, tally: readinessTally(tasks) };
}

/**
 * The board_tasks row a touched task writes. Called for a task that has no row
 * yet; `patch` carries only what the person actually changed.
 */
export function rowForTask(task, boardSlug, boardTitle, patch = {}) {
  const links = { readiness: { section: task.sectionId } };
  if (task.custom) links.readiness.custom = true;
  const cost = patch.cost !== undefined ? patch.cost : task.cost;
  if (typeof cost === 'number' && cost >= 0) links.readiness.cost = cost;
  return {
    slug: task.slug,
    boardSlug,
    boardTitle,
    title: patch.title !== undefined ? patch.title : task.title,
    status: patch.status !== undefined ? patch.status : task.status,
    owner: null,
    group: task.group || null,
    startDate: null,
    dueDate: null,
    sortRank: task.sortRank != null ? task.sortRank : 0,
    notes: patch.note !== undefined ? (patch.note || null) : (task.note || null),
    links,
  };
}

/**
 * The patch an EXISTING row takes. Cost and the removed/custom marks live under
 * links.readiness, so the patch has to carry the whole links object forward
 * rather than replacing it (an update that dropped links.history would erase a
 * record the rest of the board keeps).
 */
export function patchForTask(task, patch = {}) {
  const out = {};
  if (patch.title !== undefined) out.title = patch.title;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.note !== undefined) out.notes = patch.note || null;
  if (patch.cost !== undefined || patch.removed !== undefined) {
    const prior = (task.row && task.row.links && typeof task.row.links === 'object') ? task.row.links : {};
    const readiness = { ...(prior.readiness || {}), section: task.sectionId };
    if (task.custom) readiness.custom = true;
    if (patch.cost !== undefined) {
      if (typeof patch.cost === 'number' && patch.cost >= 0) readiness.cost = patch.cost;
      else delete readiness.cost;
    }
    if (patch.removed !== undefined) {
      if (patch.removed) readiness.removed = true; else delete readiness.removed;
    }
    out.links = { ...prior, readiness };
  }
  return out;
}

/** A task the landlord adds himself, in a section he picked. */
export function buildCustomTask(boardSlug, sectionId, group, title, sortRank = 0) {
  const sec = READINESS_SECTIONS.find((s) => s.id === sectionId) || READINESS_SECTIONS[0];
  const clean = String(title || '').trim();
  if (!clean) return null;
  const key = `x:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    key,
    slug: readinessSlug(boardSlug, key),
    sectionId: sec.id,
    group: group || sec.name,
    title: clean,
    sortRank,
    row: null,
    status: 'not-started',
    note: '',
    cost: null,
    custom: true,
  };
}
