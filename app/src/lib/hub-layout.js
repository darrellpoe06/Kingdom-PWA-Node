// =============================================================================
// hub-layout — each person arranges their own Life Hub (DR-1201)
// =============================================================================
// Darrell, 2026-10-21: "Would like to be able to edit our front screens so all
// sections can be edited by users to arrange as they please? Opportunities and
// constraints... unless it undermines."
//
// The Life Hub's sections, in an order the reader chooses, any of them hidden.
// What stays FIXED, on purpose: the header (the title, the density, Current
// View and the Arrange control itself) -- it is the way back, so it never moves
// and never hides. A hidden section leaves one line saying so, so the screen is
// never blank (DR-0381) and the way back is always one tap away.
//
// PER DEVICE, SAID PLAINLY -- the same honest limit home-view-prefs.js states
// for the density: two people on one device share it, and a new device starts
// on the standard order. A profile column is a schema decision of its own.
//
// Pure over a storage object so blocked storage (a private window, cleared site
// data) reads as the standard order, never a crash on the family's front door.
// =============================================================================

export const HUB_LAYOUT_KEY = 'poetech:home-hub-layout.v1';

/** The sections the reader may arrange, in the standard order. `card` sections share a grid row. */
export const HUB_SECTIONS = Object.freeze([
  Object.freeze({ id: 'welcome', label: 'Welcome', kind: 'block' }),
  Object.freeze({ id: 'tiles', label: 'The six tiles', kind: 'block' }),
  Object.freeze({ id: 'messages', label: 'Recent messages', kind: 'card' }),
  Object.freeze({ id: 'focus', label: "Today's focus and goals", kind: 'card' }),
  Object.freeze({ id: 'actions', label: 'Quick actions and recent activity', kind: 'card' }),
]);
const IDS = HUB_SECTIONS.map((s) => s.id);
export const DEFAULT_LAYOUT = Object.freeze({ order: IDS, hidden: [] });

/** Any stored value -> a whole layout: unknown ids dropped, missing ids added in standard order. */
export function normalizeLayout(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const seen = new Set();
  const order = [];
  for (const id of Array.isArray(r.order) ? r.order : []) {
    if (IDS.includes(id) && !seen.has(id)) { order.push(id); seen.add(id); }
  }
  for (const id of IDS) if (!seen.has(id)) order.push(id);
  const hidden = [...new Set((Array.isArray(r.hidden) ? r.hidden : []).filter((id) => IDS.includes(id)))];
  return { order, hidden };
}

export function isStandard(layout) {
  const l = normalizeLayout(layout);
  return l.hidden.length === 0 && l.order.every((id, i) => id === IDS[i]);
}

/** Move one section up (-1) or down (+1); at an end it stays. */
export function moveSection(layout, id, dir) {
  const l = normalizeLayout(layout);
  const i = l.order.indexOf(id);
  const j = i + (dir < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= l.order.length) return l;
  const order = [...l.order];
  [order[i], order[j]] = [order[j], order[i]];
  return { ...l, order };
}

export function toggleHidden(layout, id) {
  const l = normalizeLayout(layout);
  if (!IDS.includes(id)) return l;
  return { ...l, hidden: l.hidden.includes(id) ? l.hidden.filter((x) => x !== id) : [...l.hidden, id] };
}

/**
 * The shown sections as render runs: a `block` alone, consecutive `card`s
 * together in one grid row, so the desktop's three-across survives any order.
 */
export function layoutRuns(layout) {
  const l = normalizeLayout(layout);
  const kind = Object.fromEntries(HUB_SECTIONS.map((s) => [s.id, s.kind]));
  const runs = [];
  for (const id of l.order) {
    if (l.hidden.includes(id)) continue;
    const last = runs[runs.length - 1];
    if (kind[id] === 'card' && last && last.kind === 'cards') last.ids.push(id);
    else runs.push(kind[id] === 'card' ? { kind: 'cards', ids: [id] } : { kind: 'block', id });
  }
  return runs;
}

export function loadHubLayout(storage = (typeof localStorage !== 'undefined' ? localStorage : null)) {
  try {
    const raw = storage ? storage.getItem(HUB_LAYOUT_KEY) : null;
    return normalizeLayout(raw ? JSON.parse(raw) : null);
  } catch { return normalizeLayout(null); }
}

export function saveHubLayout(layout, storage = (typeof localStorage !== 'undefined' ? localStorage : null)) {
  try {
    if (!storage) return false;
    if (isStandard(layout)) storage.removeItem(HUB_LAYOUT_KEY);
    else storage.setItem(HUB_LAYOUT_KEY, JSON.stringify(normalizeLayout(layout)));
    return true;
  } catch { return false; }
}

export function hiddenLine(layout) {
  const n = normalizeLayout(layout).hidden.length;
  if (!n) return '';
  return `${n === 1 ? 'One section is' : `${n} sections are`} hidden on this device.`;
}
