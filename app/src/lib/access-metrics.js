// =============================================================================
// access-metrics — pure rollups for the Access & Usage surface
// =============================================================================
// Declared by Darrell 2026-06-29: be aware of HOW MANY people and WHO has access
// to the PoeTech App, plus the obvious update/engagement signals. These are pure,
// deterministic functions over already-fetched rows (no I/O, no Date.now — the
// caller passes nowMs) so every count is unit-tested and reproducible (DR-0076:
// measure, don't claim). The component (AccessUsageMetrics.jsx) only renders what
// these return; the sync layer (access-metrics-sync.js) only fetches the rows.
//
// PRIVACY (binding, served-not-surveilled): these functions roll up ACCESS +
// AGGREGATE engagement + build-freshness only. There is no per-person behavioral
// data here to roll up — none is collected. Emails are never part of any shape;
// the roster shows display_name + role + scope, nothing more.
// =============================================================================

const DAY_MS = 86400000;

// ── servant-king role tiers ──────────────────────────────────────────────────
// The DB role is the source of truth (owner/admin/specialist/member/viewer). We
// present it under the servant-king vocabulary Darrell uses, with a stable order.
export const ROLE_META = Object.freeze({
  owner:      { label: 'Owner',         rank: 0 },
  admin:      { label: 'Steward-Admin', rank: 1 },
  specialist: { label: 'Builder',       rank: 2 },
  member:     { label: 'Member',        rank: 3 },
  viewer:     { label: 'User',          rank: 4 },
});

export function roleLabel(role) {
  return (ROLE_META[role] && ROLE_META[role].label) || (role ? String(role) : 'Member');
}

function roleRank(role) {
  return ROLE_META[role] ? ROLE_META[role].rank : 99;
}

// ── scope (which business / ministry / circle) ───────────────────────────────
const SCOPE_LABELS = Object.freeze({
  family: 'Family circle',
  church: 'Church',
  'therapy-practice': 'TLC / Practice',
  business: 'Business',
  'tech-business': 'PoeTech',
  landlord: 'Poe Properties',
  contractor: 'Contractor',
  nonprofit: 'Nonprofit',
  'law-practice': 'Law Practice',
  mentor: 'Mentor',
  trades: 'Trades',
  'media-org': 'Media',
  trust: 'Trust',
  'holding-company': 'Holding Company',
});

export function scopeLabel(instanceType) {
  return SCOPE_LABELS[instanceType] || (instanceType ? String(instanceType) : 'Instance');
}

// ── time helpers (nowMs injected for determinism) ────────────────────────────
export function daysAgo(iso, nowMs) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((nowMs - t) / DAY_MS);
}

export function relativeTime(iso, nowMs) {
  const d = daysAgo(iso, nowMs);
  if (d == null) return 'unknown';
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// ── WHO + counts ─────────────────────────────────────────────────────────────

// Unique PEOPLE (a person in two instances is one person) vs memberships.
export function summarize(members = []) {
  const people = new Set();
  for (const m of members) if (m && m.userId) people.add(m.userId);
  return {
    totalPeople: people.size,
    totalMemberships: members.length,
  };
}

// Count people by role, deduped to the person's HIGHEST role across instances,
// returned in servant-king order. (A person who is owner of one instance and
// member of another counts once, as owner.)
export function countByRole(members = []) {
  const best = new Map(); // userId -> role with lowest rank
  for (const m of members) {
    if (!m || !m.userId) continue;
    const prev = best.get(m.userId);
    if (prev == null || roleRank(m.role) < roleRank(prev)) best.set(m.userId, m.role);
  }
  const counts = new Map();
  for (const role of best.values()) counts.set(role, (counts.get(role) || 0) + 1);
  return Array.from(counts.entries())
    .map(([role, count]) => ({ role, label: roleLabel(role), count }))
    .sort((a, b) => roleRank(a.role) - roleRank(b.role));
}

// Group memberships by scope (instance), each with its members sorted by role.
export function groupByScope(members = [], instances = []) {
  const byId = new Map(instances.map((i) => [i.id, i]));
  const groups = new Map();
  for (const m of members) {
    if (!m || !m.instanceId) continue;
    if (!groups.has(m.instanceId)) {
      const inst = byId.get(m.instanceId);
      groups.set(m.instanceId, {
        instanceId: m.instanceId,
        name: (inst && inst.displayName) || 'Instance',
        type: inst && inst.instanceType,
        scopeLabel: scopeLabel(inst && inst.instanceType),
        members: [],
      });
    }
    groups.get(m.instanceId).members.push(m);
  }
  const out = Array.from(groups.values());
  for (const g of out) {
    g.count = g.members.length;
    g.members.sort((a, b) => roleRank(a.role) - roleRank(b.role)
      || String(a.displayName || '').localeCompare(String(b.displayName || '')));
  }
  // Largest circle first, then by name.
  return out.sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name)));
}

// New (joined within `days`) vs returning, by unique person (earliest join wins).
export function newVsReturning(members = [], nowMs, days = 30) {
  const firstJoin = new Map();
  for (const m of members) {
    if (!m || !m.userId || !m.joinedAt) continue;
    const t = Date.parse(m.joinedAt);
    if (Number.isNaN(t)) continue;
    if (!firstJoin.has(m.userId) || t < firstJoin.get(m.userId)) firstJoin.set(m.userId, t);
  }
  let newCount = 0;
  let returningCount = 0;
  for (const t of firstJoin.values()) {
    if ((nowMs - t) <= days * DAY_MS) newCount += 1;
    else returningCount += 1;
  }
  return { newCount, returningCount, windowDays: days };
}

// ── activity (from presence heartbeats) ──────────────────────────────────────
// active = seen within activeDays; idle = within recentDays; dormant = older.
export function activityRollup(presence = [], nowMs, { activeDays = 7, recentDays = 30 } = {}) {
  // Dedup to the person's most-recent heartbeat across instances.
  const last = new Map();
  for (const p of presence) {
    if (!p || !p.userId || !p.lastSeenAt) continue;
    const t = Date.parse(p.lastSeenAt);
    if (Number.isNaN(t)) continue;
    if (!last.has(p.userId) || t > last.get(p.userId)) last.set(p.userId, t);
  }
  let active = 0;
  let idle = 0;
  let dormant = 0;
  for (const t of last.values()) {
    const ageDays = (nowMs - t) / DAY_MS;
    if (ageDays <= activeDays) active += 1;
    else if (ageDays <= recentDays) idle += 1;
    else dormant += 1;
  }
  return { active, idle, dormant, reporting: last.size, activeDays, recentDays };
}

// ── build-freshness (rollout management) ─────────────────────────────────────
// "Latest" = the newest build_time seen across all reporting sessions (the
// freshest build anyone is actually on). Each person is classified against it.
// People with NO presence row are 'unknown' (handled by the caller against the
// member roster) — never silently counted as up to date.
export function buildFreshness(presence = []) {
  // Dedup to each person's most-recent heartbeat.
  const byUser = new Map();
  for (const p of presence) {
    if (!p || !p.userId) continue;
    const t = p.lastSeenAt ? Date.parse(p.lastSeenAt) : 0;
    const prev = byUser.get(p.userId);
    if (!prev || t > prev._t) byUser.set(p.userId, { ...p, _t: Number.isNaN(t) ? 0 : t });
  }
  const rows = Array.from(byUser.values());

  // Latest build = max build_time among rows that report one; fall back to the
  // SHA of the most-recently-seen session if no build_time is present.
  let latestSha = null;
  let latestAt = null;
  let latestAtMs = -1;
  for (const r of rows) {
    const bt = r.buildTime ? Date.parse(r.buildTime) : NaN;
    if (!Number.isNaN(bt) && bt > latestAtMs) { latestAtMs = bt; latestAt = r.buildTime; latestSha = r.buildSha; }
  }
  if (!latestSha) {
    let seenMs = -1;
    for (const r of rows) if (r._t > seenMs) { seenMs = r._t; latestSha = r.buildSha || null; }
  }

  const onLatest = [];
  const behind = [];
  for (const r of rows) {
    const entry = {
      userId: r.userId,
      displayName: r.displayName,
      buildSha: r.buildSha || null,
      buildTime: r.buildTime || null,
      lastSeenAt: r.lastSeenAt || null,
    };
    if (latestSha && r.buildSha === latestSha) onLatest.push(entry);
    else behind.push(entry);
  }
  return {
    latestSha,
    latestAt,
    onLatest,
    behind,
    onLatestCount: onLatest.length,
    behindCount: behind.length,
    reporting: rows.length,
  };
}

// People who have a membership but have NEVER reported a session (no build/
// last-seen signal yet). Honest "unknown", not assumed-current.
export function membersWithoutPresence(members = [], presence = []) {
  const seen = new Set(presence.map((p) => p && p.userId).filter(Boolean));
  const out = new Map();
  for (const m of members) {
    if (!m || !m.userId || seen.has(m.userId)) continue;
    if (!out.has(m.userId)) out.set(m.userId, { userId: m.userId, displayName: m.displayName });
  }
  return Array.from(out.values());
}

// ── pending invites (admin actions) ──────────────────────────────────────────
export function pendingInvites(invites = []) {
  return invites
    .filter((i) => i && i.inviteStatus === 'invited')
    .map((i) => ({
      id: i.id,
      displayName: i.displayName || 'Invited person',
      type: i.type || null,
      invitedAt: i.invitedAt || null,
    }))
    .sort((a, b) => (Date.parse(b.invitedAt || 0) || 0) - (Date.parse(a.invitedAt || 0) || 0));
}
