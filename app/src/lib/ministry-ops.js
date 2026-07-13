// =============================================================================
// ministry-ops — pure logic for the internal Ministry Ops workspace + the
// member-visible curated digest (the $39.99 subscriber's content source).
// =============================================================================
// Declared by Darrell 2026-07-13: the internal TLC staff + team run the weekly
// operation of the ministries as real ops items under Projects; items marked
// member-visible become the paid subscriber's "content context." PURE (no
// Supabase, no React) so every rule is unit-tested (DR-0076); I/O lives in
// ministry-ops-sync.js, backed by 0099-ministry-ops.sql. Mirrors the choir/bus
// ministry spine (MINISTRY-SUPPORT-PATTERN.md).
// =============================================================================

export const OPS_STATUS = [
  ['todo', 'To do'],
  ['in-progress', 'In progress'],
  ['blocked', 'Blocked'],
  ['done', 'Done'],
];
export const opsStatusLabel = (s) => (OPS_STATUS.find(([k]) => k === s)?.[1]) || s;

// The ministries ops items can belong to. 'general' = cross-ministry / platform.
export const OPS_MINISTRIES = [
  ['general', 'General / Platform'],
  ['bus', 'Bus / Van'],
  ['choir', 'Choir'],
  ['ushers', 'Ushers'],
  ['security', 'Security'],
  ['media', 'Media / Sound'],
  ['hospitality', 'Hospitality'],
  ['outreach', 'Outreach'],
];
export const opsMinistryLabel = (m) => (OPS_MINISTRIES.find(([k]) => k === m)?.[1]) || m;

// Only staff (owner/admin) manage ops; everyone else who can see the surface
// sees the member-visible digest (read-only).
export function canManageOps(role) {
  return role === 'owner' || role === 'admin';
}

// --- Date helpers (UTC-anchored, deterministic) ------------------------------
function toDate(iso) { return new Date(String(iso) + 'T00:00:00Z'); }
function isoOf(d) { return d.toISOString().slice(0, 10); }
export function addDays(iso, n) { const d = toDate(iso); d.setUTCDate(d.getUTCDate() + Number(n)); return isoOf(d); }
// The Monday on/before the given date — the ops "week of" key.
export function weekOf(iso) {
  const dow = toDate(iso).getUTCDay(); // 0 = Sun … 1 = Mon
  const back = (dow + 6) % 7;          // days since Monday
  return addDays(iso, -back);
}

// --- Row <-> shape mapper ----------------------------------------------------
export function toOpsShape(row, myUserId) {
  return {
    id: row.id,
    ministry: row.ministry ?? 'general',
    title: row.title ?? '',
    detail: row.detail ?? null,
    status: row.status ?? 'todo',
    weekOf: row.week_of ?? null,
    ownerName: row.owner_name ?? null,
    ownerUserId: row.owner_user_id ?? null,
    memberVisible: row.member_visible === true,
    createdAt: row.created_at ?? null,
    mine: !!myUserId && row.owner_user_id === myUserId,
  };
}

// --- Views the surface renders ----------------------------------------------
// Group items by their ops week, newest week first; items within a week sorted
// by ministry then title. Null weeks bucket under 'undated'.
export function groupByWeek(items = []) {
  const by = new Map();
  for (const it of items || []) {
    if (!it) continue;
    const key = it.weekOf || 'undated';
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(it);
  }
  const weeks = [...by.entries()].map(([week, list]) => ({
    week,
    items: list.slice().sort((a, b) =>
      String(a.ministry).localeCompare(String(b.ministry)) || String(a.title).localeCompare(String(b.title))),
  }));
  // Dated weeks newest-first; 'undated' always last.
  weeks.sort((a, b) => {
    if (a.week === 'undated') return 1;
    if (b.week === 'undated') return -1;
    return String(b.week).localeCompare(String(a.week));
  });
  return weeks;
}

export function groupByMinistry(items = []) {
  const by = new Map();
  for (const it of items || []) {
    if (!it) continue;
    if (!by.has(it.ministry)) by.set(it.ministry, []);
    by.get(it.ministry).push(it);
  }
  return [...by.entries()]
    .map(([ministry, list]) => ({ ministry, items: list }))
    .sort((a, b) => String(a.ministry).localeCompare(String(b.ministry)));
}

// Status tally for a set of items (the "what's the ministry's week look like").
export function opsProgress(items = []) {
  const t = { todo: 0, 'in-progress': 0, blocked: 0, done: 0, total: 0 };
  for (const it of items || []) {
    if (!it) continue;
    t.total += 1;
    if (t[it.status] != null) t[it.status] += 1;
  }
  return t;
}

// The CURATED subscriber digest: only member-visible items, grouped by ministry,
// most-recent first. This is the paid member's "content context" (the tier gate
// that shows it to $39.99/poetech-plus subscribers is a surface concern — the
// filter itself is here, unit-tested, so what a member could ever see is a
// proven subset). NEVER returns a non-member-visible item.
export function memberDigest(items = []) {
  const visible = (items || []).filter((it) => it && it.memberVisible);
  const byMinistry = groupByMinistry(visible);
  for (const g of byMinistry) {
    g.items = g.items.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    g.ministryLabel = opsMinistryLabel(g.ministry);
    g.done = g.items.filter((it) => it.status === 'done').length;
  }
  return byMinistry;
}
export function memberVisibleCount(items = []) {
  return (items || []).filter((it) => it && it.memberVisible).length;
}
