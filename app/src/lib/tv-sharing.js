// =============================================================================
// tv-sharing — the PURE privacy model for TV Time family/circle sharing
// =============================================================================
// Darrell 2026-07-04, co-designed: a show is PRIVATE by default; per show you can
// share it with any of a few independent audiences — never nested, so a mature
// show can go to the friend Circle while staying hidden from the kids' Family view.
//   🔒 Just me   — private; not even your spouse (the default)
//   💑 Us        — you + your spouse only (never the kids)
//   👪 Family    — the whole household, INCLUDING the kids (kid-appropriate)
//   👥 Circle    — the friend group / community feed
//
// THE SAFETY ROOT (defense-in-depth, deeper than RLS): the owner's client only
// ever PUBLISHES the shows it flagged for a given audience (`publishDocFor`). A
// private show is never written to any shared row, so even a total row-level
// security failure cannot leak it — it simply is not in the shared data. RLS is
// the second wall; this is the first. Both must hold before the cross-person views
// flip on, and that requires the live NAS data-isolation smoke test (DR-0076 +
// the deferral written into migration 0072). This module is PURE + fully tested
// so the model is provable without a database, and it MIRRORS the SQL RLS in JS
// (`canReadShare`) so the two can be checked against each other.
// =============================================================================

// The audiences a show can be shared with. `private` is the absence of all flags.
export const AUDIENCES = [
  { key: 'us', label: 'Us', hint: 'You + your spouse', minRole: 'adult' },
  { key: 'family', label: 'Family', hint: 'Everyone at home, incl. kids', minRole: 'child' },
  { key: 'circle', label: 'Circle', hint: 'Your friend group', minRole: 'child' },
];
export const AUDIENCE_KEYS = AUDIENCES.map((a) => a.key);

// The share flags on a show entry, as a clean {us,family,circle} boolean map.
export function shareFlags(entry) {
  const s = entry && typeof entry.share === 'object' && entry.share ? entry.share : {};
  return { us: s.us === true, family: s.family === true, circle: s.circle === true };
}

// Is this show private (shared with no audience)? The default.
export function isPrivate(entry) {
  const f = shareFlags(entry);
  return !f.us && !f.family && !f.circle;
}

// The audiences a show is shared to, as a list of keys (for a badge row).
export function sharedAudiences(entry) {
  const f = shareFlags(entry);
  return AUDIENCE_KEYS.filter((k) => f[k]);
}

// Immutable: set one audience flag on/off for a show, returning a new entry with a
// CONDITIONAL `share` key (dropped entirely when the show goes back to private, so
// equality with an unshared show is preserved).
export function withShare(entry, audience, on) {
  const base = entry && typeof entry === 'object' ? entry : {};
  if (!AUDIENCE_KEYS.includes(audience)) return base;
  const next = { ...shareFlags(base), [audience]: !!on };
  const share = {};
  for (const k of AUDIENCE_KEYS) if (next[k]) share[k] = true;
  const out = { ...base };
  delete out.share;
  return Object.keys(share).length ? { ...out, share } : out;
}

// Build the sub-document a client PUBLISHES for one audience: only the shows
// flagged for that audience, with their metadata. Private/unflagged shows are
// EXCLUDED — this is the safety root. `catalog` maps showId -> display metadata
// (title/poster/genre) so the shared view can render without a second lookup.
// Returns { shows, custom } shaped like the store (so the same renderers work).
export function publishDocFor(state, audience, catalog = {}) {
  const shows = {};
  const custom = {};
  if (!AUDIENCE_KEYS.includes(audience)) return { shows, custom };
  const src = state && typeof state.shows === 'object' && state.shows ? state.shows : {};
  const cat = catalog && typeof catalog === 'object' ? catalog : {};
  const stateCustom = state && typeof state.custom === 'object' && state.custom ? state.custom : {};
  for (const [id, entry] of Object.entries(src)) {
    if (!shareFlags(entry)[audience]) continue;          // not shared to this audience
    shows[id] = {
      status: entry.status, rating: entry.rating || 0, watched: entry.watched || {},
    };
    // carry display metadata (a custom/imported show, or a catalog hit) so the
    // reader can show a poster + title without re-fetching.
    if (stateCustom[id]) custom[id] = stateCustom[id];
    else if (cat[id]) custom[id] = cat[id];
  }
  return { shows, custom };
}

// A member's role in a circle. Parents have oversight; children are protected.
export const ROLES = ['parent', 'adult', 'child'];
export function normalizeRole(role) {
  const r = String(role || '').toLowerCase().trim();
  return ROLES.includes(r) ? r : 'adult';
}

// THE VISIBILITY RULE — the JS mirror of the SQL RLS. Can a viewer read a show
// the owner shared to `audience`? Inputs are the viewer's relationship to the
// owner WITHIN one circle:
//   inCircle   — viewer and owner are members of the same circle
//   role       — the viewer's role in that circle (parent/adult/child)
//   isSpouse   — viewer is the owner's spouse (an adult pairing)
// Rules (kids are protected; parents have oversight):
//   • never read across circles (inCircle gate)
//   • a parent may read any household member's shares (oversight)
//   • 'family' and 'circle' shares are readable by any member of that circle
//   • 'us' shares are readable ONLY by the owner's spouse — never a child
export function canReadShare(audience, viewer = {}) {
  if (!AUDIENCE_KEYS.includes(audience)) return false;
  if (!viewer.inCircle) return false;
  if (normalizeRole(viewer.role) === 'parent') return true;      // parental oversight
  if (audience === 'family' || audience === 'circle') return true;
  if (audience === 'us') return viewer.isSpouse === true && normalizeRole(viewer.role) !== 'child';
  return false;
}

// Aggregate a "what everyone's watching" community feed from several members'
// shared docs. Each entry: a title, how many people are watching it, and who.
// Pure; `members` is [{ name, doc:{shows}, catalog }]. Titles resolve from the
// member's own custom/catalog metadata (already inside their shared doc).
export function communityFeed(members = []) {
  const byTitle = new Map();
  for (const m of Array.isArray(members) ? members : []) {
    const doc = m && m.doc ? m.doc : {};
    const shows = doc.shows && typeof doc.shows === 'object' ? doc.shows : {};
    const meta = doc.custom && typeof doc.custom === 'object' ? doc.custom : {};
    const name = (m && m.name) || 'Someone';
    const seen = new Set();
    for (const id of Object.keys(shows)) {
      const title = (meta[id] && meta[id].title) || id;
      const key = String(title).toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);
      if (!byTitle.has(key)) byTitle.set(key, { title, watchers: [] });
      byTitle.get(key).watchers.push(name);
    }
  }
  return [...byTitle.values()]
    .map((e) => ({ title: e.title, count: e.watchers.length, watchers: e.watchers }))
    .sort((a, b) => (b.count - a.count) || a.title.localeCompare(b.title));
}
