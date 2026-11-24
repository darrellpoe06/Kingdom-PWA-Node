// =============================================================================
// app-map — an app's places, shaped for the "where can I go?" sheet (DR-1627)
// =============================================================================
// Pure. The PoeTech door's places are the reader's own gated tab list, grouped
// by lib/nav-items.jsx (navGroups). This turns those groups into the tiles
// AppMapSheet draws: plain words, one icon, which one is open now. Nothing is
// added here that the reader's list does not already hold, so the map is gated
// exactly as the tabs are.
// =============================================================================
import { NAV_WORDS, NAV_ICONS } from './nav-items.jsx';

/** The first group has no heading in the sidebar; on the map it needs one. */
export const UNNAMED_GROUP_LABEL = 'Family';

/**
 * @param {Array} groups  navGroups() output: [{ key, label, items: [[id, node]], links }]
 * @param {{ view?: string, churchView?: string }} now  where the reader is
 * @returns {Array<{ key, label, items: Array<{ id, label, icon, on, view, churchView? }> }>}
 */
export function poetechMapGroups(groups = [], now = {}) {
  const out = [];
  for (const g of groups || []) {
    if (!g) continue;
    const items = [];
    for (const pair of g.items || []) {
      const id = Array.isArray(pair) ? pair[0] : null;
      if (!id || id === '__sep__') continue;
      items.push({ id, view: id, label: NAV_WORDS[id] || String(id), icon: NAV_ICONS[id] || 'home', on: now.view === id });
    }
    for (const l of g.links || []) {
      if (!l || !l.view) continue;
      items.push({
        id: `link-${l.key}`,
        view: l.view,
        churchView: l.churchView || null,
        label: l.words || l.key,
        icon: l.icon || 'link',
        on: now.view === l.view && !!l.churchView && now.churchView === l.churchView,
      });
    }
    if (items.length) out.push({ key: g.key, label: g.label || UNNAMED_GROUP_LABEL, items });
  }
  // A quick link and its section can both read "on"; the more exact one wins.
  for (const g of out) {
    const exact = g.items.find((it) => it.on && it.churchView);
    if (exact) for (const it of g.items) if (it !== exact && it.view === exact.view) it.on = false;
  }
  return out;
}

/**
 * A door's own tab list as one group of the map. The door has already decided
 * which tabs this reader has; a locked tab is left off, because the map lists
 * places a person can go.
 * @param {string} label   the group's heading
 * @param {Array<{ id: string, label: string, icon?: string, locked?: boolean }>} tabs
 * @param {string} activeId  the tab the reader is on
 * @param {{ key?: string, icon?: string }} [opts]
 */
export function doorMapGroup(label, tabs = [], activeId = '', opts = {}) {
  const items = [];
  for (const t of tabs || []) {
    if (!t || !t.id || t.locked) continue;
    items.push({ id: t.id, label: t.label || String(t.id), icon: t.icon || opts.icon || 'home', on: t.id === activeId });
  }
  return items.length ? [{ key: opts.key || 'places', label, items }] : [];
}
