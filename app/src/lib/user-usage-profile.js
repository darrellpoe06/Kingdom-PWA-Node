// =============================================================================
// user-usage-profile — what one person could not stop using, and what they
// tried once (DR-0840)
// =============================================================================
// Darrell 2026-10-09: "Want to be able to sort users... comprehensively
// understand our users... what they couldn't stop using vs..."
// The rows are user_usage_metrics (0145): one per view name, with how many
// times it was opened in the window and when last. Pure: the window and the
// thresholds are inputs; nothing is guessed past the rows. A null answer from
// the server (the caller stewards none of the person's spaces) is a fact the
// surface says, not an empty profile.
export const KEPT_AT = 3;   // opened this many times or more in the window: they kept coming back to it
export const SIGNUP_SORTS = Object.freeze([
  { key: 'newest', label: 'Newest first' },
  { key: 'last-active', label: 'Last active first' },
  { key: 'name', label: 'Name' },
  { key: 'space', label: 'Space' },
  { key: 'returned', label: 'Returned first' },
  { key: 'never', label: 'Never returned first' },
]);

const ms = (v) => Date.parse(v || '') || 0;

/** The profile over one person's rows; null when the rows are null (not allowed to see). */
export function usageProfile(rows, { keptAt = KEPT_AT } = {}) {
  if (rows === null || rows === undefined) return null;
  const list = (Array.isArray(rows) ? rows : [])
    .map((r) => ({ name: String((r && r.name) || '').trim(), views: Number((r && r.views) || 0), lastAt: (r && r.last_at) || null }))
    .filter((r) => r.name && r.views > 0)
    .sort((a, b) => b.views - a.views || ms(b.lastAt) - ms(a.lastAt));
  const total = list.reduce((n, r) => n + r.views, 0);
  const lastAt = list.reduce((best, r) => (ms(r.lastAt) > ms(best) ? r.lastAt : best), null);
  return {
    rows: list,
    total,
    kept: list.filter((r) => r.views >= keptAt),
    once: list.filter((r) => r.views === 1),
    lastAt,
    views: list.length,
  };
}

/** One honest line over a profile. */
export function usageLine(profile, { windowDays = 30 } = {}) {
  if (profile === null || profile === undefined) return 'Their usage is theirs alone until they are in a space you steward.';
  if (profile.total === 0) return `Nothing opened in the last ${windowDays} days.`;
  const kept = profile.kept.slice(0, 4).map((r) => `${r.name} (${r.views})`).join(', ');
  const once = profile.once.slice(0, 4).map((r) => r.name).join(', ');
  const parts = [`${profile.total} opens across ${profile.views} ${profile.views === 1 ? 'view' : 'views'} in ${windowDays} days`];
  parts.push(kept ? `kept coming back to ${kept}${profile.kept.length > 4 ? ` and ${profile.kept.length - 4} more` : ''}` : 'nothing opened three times or more');
  if (once) parts.push(`tried once: ${once}${profile.once.length > 4 ? ` and ${profile.once.length - 4} more` : ''}`);
  return `${parts.join(' · ')}.`;
}

/**
 * The signups list in the order the governor asked for. Pure; a new array.
 * `rows` are the RPC rows; `view(row)` gives the surface's view of one
 * (name, email, categoryLabel, lastActive iso), so the sort reads what the
 * screen shows.
 */
export function sortSignupsBy(rows = [], key = 'newest', view = (r) => r) {
  const list = [...(Array.isArray(rows) ? rows : [])];
  const act = (r) => Math.max(ms(r.last_sign_in_at), ms(r.last_seen_at), ms(r.last_active_at));
  const created = (r) => ms(r.created_at);
  const returned = (r) => !!(act(r) && act(r) > created(r) + 5 * 60 * 1000);
  const label = (r) => { const v = view(r) || {}; return String(v.name || v.email || r.email || '').toLowerCase(); };
  const space = (r) => { const v = view(r) || {}; return String(v.categoryLabel || r.category || '').toLowerCase(); };
  const by = {
    newest: (a, b) => created(b) - created(a),
    'last-active': (a, b) => act(b) - act(a) || created(b) - created(a),
    name: (a, b) => label(a).localeCompare(label(b)),
    space: (a, b) => space(a).localeCompare(space(b)) || label(a).localeCompare(label(b)),
    returned: (a, b) => Number(returned(b)) - Number(returned(a)) || act(b) - act(a),
    never: (a, b) => Number(returned(a)) - Number(returned(b)) || created(b) - created(a),
  }[key] || ((a, b) => created(b) - created(a));
  return list.sort(by);
}
