// =============================================================================
// access-metrics-sync — fetch the real rows the Access & Usage surface reads,
// and report this session's own presence heartbeat.
// =============================================================================
// Two responsibilities, both grounded in real Supabase state (DR-0076: no
// painted data — every row here is a real record, RLS-gated):
//
//   fetchAccessSnapshot() — read the access-governance tables the steward needs:
//     instances (scope), instance_members (WHO + role), member_presence
//     (build-freshness + last-seen), external_users (pending invites),
//     instance_subscriptions (tier), instance_domains (enabled modules). Each
//     query degrades INDEPENDENTLY: a table the caller can't read (RLS) or that
//     isn't migrated yet returns [] with an honest error flag, never a throw and
//     never a fake number.
//
//   reportPresence() — the caller's OWN session reports the build it is running
//     plus a last-seen heartbeat, via the record_presence RPC (which scopes the
//     write to auth.uid()). No-op when signed out. Privacy: build + heartbeat
//     only — no behavior, no content (see 0055-member-presence.sql).
// =============================================================================
import supabase, { readPersistedSession, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase.js';

// Nothing here may hang the Access & Usage panel on "Loading…" forever. A resumed
// tab's getSession() or a stalled SELECT can never resolve (documented incident:
// auth-boot-gate-hang, DR-0076). Every awaited call is raced against this ceiling
// and degrades to an honest fallback instead of freezing. 6s is generous for a
// real round-trip yet bounded so the UI resolves FAST — the multi-tab auth-lock
// case (many PoeTech tabs holding navigator.locks) rides this ceiling, so keeping
// it tight is what turns a ~18s "stuck on Loading" into a quick load-or-honest-error
// (Darrell 2026-07-22, Admin stuck on "Loading access & usage…" with 8 tabs open).
export const SNAPSHOT_TIMEOUT_MS = 6000;

// Resolve `promise`, or return `fallback` after `ms`. A rejection also yields the
// fallback. Pure enough to unit-test with an injected clock is unnecessary — the
// behavior is proven by the snapshot test asserting it never hangs.
export function withTimeout(promise, ms, fallback) {
  let timer;
  const timed = new Promise((resolve) => { timer = setTimeout(() => resolve(fallback), ms); });
  const wrapped = Promise.resolve(promise).then(
    (v) => { clearTimeout(timer); return v; },
    () => { clearTimeout(timer); return fallback; },
  );
  return Promise.race([wrapped, timed]);
}

const BUILD_SHA = (typeof __BUILD_SHA__ !== 'undefined') ? __BUILD_SHA__ : 'dev';
const BUILD_TIME = (typeof __BUILD_TIME__ !== 'undefined') ? __BUILD_TIME__ : null;

// A build_time we can hand to a timestamptz column: a real ISO string or null
// (local 'dev' builds carry no real build time).
function buildTimeOrNull() {
  if (!BUILD_TIME) return null;
  const t = Date.parse(BUILD_TIME);
  return Number.isNaN(t) ? null : BUILD_TIME;
}

export function currentBuild() {
  return { sha: BUILD_SHA, time: buildTimeOrNull() };
}

// ── presence heartbeat ───────────────────────────────────────────────────────
export async function reportPresence() {
  try {
    const { data: s } = await supabase.auth.getSession();
    if (!s || !s.session) return { skipped: 'signed-out' };
    const { error } = await supabase.rpc('record_presence', {
      p_build_sha: BUILD_SHA,
      p_build_time: buildTimeOrNull(),
      p_platform: 'web',
    });
    if (error) {
      // Table/RPC not migrated yet, or transient — never surface to the user.
      console.warn('[access-metrics] presence heartbeat skipped:', error.message || error);
      return { skipped: 'rpc-error', error };
    }
    return { reported: true };
  } catch (e) {
    console.warn('[access-metrics] presence heartbeat failed:', e);
    return { skipped: 'exception', error: e };
  }
}

// Wait for the auth session to be READY before firing the RLS SELECTs. On a
// resumed / cold-started tab (especially mobile), getSession() can return null for
// a beat — or briefly stall — while the persisted token is applied; if the queries
// fire in that window they run WITHOUT a valid token and every one hits the ceiling
// ("Access couldn't load — admin_*-timeout", observed 2026-07-16). Retry a few
// times, each attempt bounded, until a session appears; mirrors choir-sync's
// session-retry (the same cold-start race that stranded The Word). Bounded so the
// panel always proceeds FAST: at most ~4 * (700ms cap + 200ms) ~= 3.6s then falls
// back to the synchronous persisted read. When the cross-tab auth-lock is held
// (many tabs) getSession() never resolves, so retrying it 8x was pure ~10s of
// waiting before the panel could even start its SELECTs — tightened 2026-07-22 so
// the persisted-session fallback kicks in quickly instead.
export async function readySession() {
  for (let i = 0; i < 4; i += 1) {
    const res = await withTimeout(supabase.auth.getSession(), 700, null);
    if (res && res.data && res.data.session) return res.data.session;
    await new Promise((r) => { setTimeout(r, 200); });
  }
  return null;
}

// ── snapshot fetch ───────────────────────────────────────────────────────────
// Read a token WITHOUT the cross-tab auth lock (Darrell 2026-07-22, Admin stuck on
// "Loading access & usage…" with many tabs open). The Supabase JS client serializes
// every getSession()/query through navigator.locks; a wedged/backgrounded PoeTech tab
// holds that lock and blocks this tab's reads. The persisted session lives in
// localStorage and is readable synchronously — no lock — so the SELECTs below carry
// the token via a DIRECT REST fetch and never wait on the client's lock.
export function readSnapshotToken() {
  const persisted = readPersistedSession();
  return (persisted && persisted.access_token) || null;
}
// Back-compat local alias.
const snapshotToken = readSnapshotToken;

// A lock-free PostgREST RPC call with the bearer token — the write/RPC sibling of
// restSelect, for the admin read RPCs (admin_signup_metrics, usage_flow_metrics)
// that otherwise ride the client's contended navigator.locks. Returns the familiar
// { data, error } shape so callers barely change. Bounded by AbortController.
export async function restRpc(fnName, body, token) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SNAPSHOT_TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body || {}),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      let parsed = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
      return {
        data: null,
        error: {
          message: (parsed && parsed.message) || `${res.status} ${raw.slice(0, 140) || res.statusText}`,
          code: (parsed && parsed.code) || String(res.status),
        },
      };
    }
    const data = await res.json().catch(() => null);
    return { data, error: null };
  } catch (e) {
    clearTimeout(timer);
    return {
      data: null,
      error: { message: e && e.name === 'AbortError' ? `${fnName}-timeout` : (e.message || String(e)), timedOut: e && e.name === 'AbortError' },
    };
  }
}

// One RLS-gated read, straight to PostgREST with the bearer token — bypassing the
// Supabase client (and its navigator.locks). Bounded by AbortController so a stalled
// network can never hang the panel; degrades to [] + an honest error flag.
async function restSelect(table, columns, token, map, errors) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SNAPSHOT_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(columns)}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: ctrl.signal,
      },
    );
    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const msg = `${res.status} ${body.slice(0, 140) || res.statusText}`;
      console.warn(`[access-metrics] read ${table} failed:`, msg);
      errors[table] = msg;
      return [];
    }
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map(map);
  } catch (e) {
    clearTimeout(timer);
    const msg = e && e.name === 'AbortError' ? `${table}-timeout` : (e.message || String(e));
    console.warn(`[access-metrics] read ${table} threw:`, msg);
    errors[table] = msg;
    return [];
  }
}

export async function fetchAccessSnapshot() {
  const errors = {};

  // Token from the persisted session (no lock). If none is stored yet (just signed
  // in, not flushed), fall back to the bounded client getSession ONCE — still
  // lock-safe because readySession is timeout-raced. No token -> honest signed-out.
  let token = snapshotToken();
  if (!token) {
    try {
      const session = await readySession();
      token = (session && session.access_token) || snapshotToken();
    } catch (e) {
      token = snapshotToken();
    }
  }
  if (!token) {
    return {
      signedIn: false,
      instances: [], members: [], presence: [], invites: [],
      subscriptions: [], domains: [], errors: {},
    };
  }

  const [instances, members, presence, invites, subscriptions, domains] = await Promise.all([
    restSelect('instances', 'id,slug,display_name,instance_type', token,
      (r) => ({ id: r.id, slug: r.slug, displayName: r.display_name, instanceType: r.instance_type }), errors),
    restSelect('instance_members', 'id,instance_id,user_id,role,display_name,title,joined_at', token,
      (r) => ({ id: r.id, instanceId: r.instance_id, userId: r.user_id, role: r.role,
                displayName: r.display_name, title: r.title, joinedAt: r.joined_at }), errors),
    restSelect('member_presence', 'instance_id,user_id,display_name,build_sha,build_time,platform,last_seen_at', token,
      (r) => ({ instanceId: r.instance_id, userId: r.user_id, displayName: r.display_name,
                buildSha: r.build_sha, buildTime: r.build_time, platform: r.platform,
                lastSeenAt: r.last_seen_at }), errors),
    restSelect('external_users', 'id,instance_id,display_name,type,invite_status,invited_at', token,
      (r) => ({ id: r.id, instanceId: r.instance_id, displayName: r.display_name, type: r.type,
                inviteStatus: r.invite_status, invitedAt: r.invited_at }), errors),
    restSelect('instance_subscriptions', 'instance_id,tier,status', token,
      (r) => ({ instanceId: r.instance_id, tier: r.tier, status: r.status }), errors),
    restSelect('instance_domains', 'instance_id,domain,requires_tier', token,
      (r) => ({ instanceId: r.instance_id, domain: r.domain, requiresTier: r.requires_tier }), errors),
  ]);

  return { signedIn: true, instances, members, presence, invites, subscriptions, domains, errors };
}
