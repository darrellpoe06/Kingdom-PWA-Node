// =============================================================================
// tv-circle-sync — the client for TV Time family/circle SHARING (0074)
// =============================================================================
// Darrell 2026-07-04, co-designed. This drives the higher-stakes cross-member
// layer 0072 deferred: forming a circle (household/friends), inviting/joining by
// code, publishing ONLY the shows you flagged per audience, and reading the shows
// others shared with you. WRITE is owner-only; READ is membership + role gated by
// the RLS in 0074-tv-circle-sharing.sql, which mirrors lib/tv-sharing.js.
//
// (!!) THE GATE (DR-0076 + 0072's own note). TV_SHARING_ENABLED was FALSE until the
// data-isolation smoke test (infra/supabase/tests/0074-isolation-smoke.sql) PASSED
// against the real database (the rls-isolation CI lane tv-sharing leg, SUPABASE_DB_URL).
// It has now PASSED (2026-07-04), so the flag is true and the circle setup +
// Family/Us/Circle views mount. While it was false the UI mounted none of them, so
// no cross-person read happened in production (no painted "coming soon"). This one
// flag turns the whole feature on/off.
//
// PURE helpers (invite code shape, bucketing shares into views + a community feed)
// are node-tested; the supabase I/O is fail-soft (null/false on any error) exactly
// like tv-time-sync.js, and is proven by the live isolation smoke test, not a mock.
// =============================================================================
import { supabase } from './supabase.js';
import { publishDocFor, AUDIENCE_KEYS, communityFeed } from './tv-sharing.js';

// THE ENABLEMENT GATE — now OPEN. The isolation smoke test
// (infra/supabase/tests/0074-isolation-smoke.sql) ran GREEN against the real
// database via the tv-sharing-isolation CI lane (SUPABASE_DB_URL) on 2026-07-04
// (run 28722936533, head a893dee): every assertion passed — kids never read 'us',
// a spouse reads 'us', a parent has oversight, a friend reads only the circle, and
// a different family reads nothing. Verified isolation (DR-0076), so the flag opens.
export const TV_SHARING_ENABLED = true;

// --- Pure -------------------------------------------------------------------

// A short, human-shareable invite code (no ambiguous chars). rng injectable for
// tests; Math.random in the app is fine (this is not a workflow script).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I/O/0/1/L
export function makeInviteCode(len = 6, rng = Math.random) {
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)];
  return out;
}

// Bucket fetched tv_share rows into the three audience views, resolving each
// owner's display name. rows: [{ owner, audience, doc }]. names: { [uuid]: name }.
// Each bucket is [{ owner, name, doc }]. RLS already removed anything the viewer
// may not read, so this is a pure presentation shape.
export function bucketShares(rows = [], names = {}) {
  const out = { us: [], family: [], circle: [] };
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || !AUDIENCE_KEYS.includes(r.audience)) continue;
    out[r.audience].push({ owner: r.owner, name: names[r.owner] || 'Someone', doc: r.doc || { shows: {}, custom: {} } });
  }
  return out;
}

// The "what everyone's watching" feed for one audience bucket (reuses the tested
// communityFeed). members = a bucket from bucketShares.
export function feedForBucket(bucket = []) {
  return communityFeed((bucket || []).map((m) => ({ name: m.name, doc: m.doc })));
}

// --- I/O: fail-soft, mirrors tv-time-sync -----------------------------------
async function ownedSession() {
  try { const { data } = await supabase.auth.getSession(); return data?.session || null; } catch { return null; }
}

// Create a circle and add yourself as its first member. kind 'household' seats you
// as 'parent'; 'friends' seats you as 'adult'. Returns { id, invite_code } | null.
export async function createCircle(name, kind = 'friends') {
  const session = await ownedSession();
  if (!session) return null;
  try {
    const invite_code = makeInviteCode();
    const { data, error } = await supabase.from('tv_circle')
      .insert({ name: name || 'My circle', kind, invite_code, created_by: session.user.id })
      .select('id,invite_code').single();
    if (error || !data) { console.warn('[tv-circle] create failed:', error); return null; }
    const role = kind === 'household' ? 'parent' : 'adult';
    const { error: mErr } = await supabase.from('tv_circle_member')
      .insert({ circle_id: data.id, member: session.user.id, role, display: '' });
    if (mErr) { console.warn('[tv-circle] seat-self failed:', mErr); return null; }
    return { id: data.id, invite_code: data.invite_code };
  } catch (err) { console.warn('[tv-circle] create failed:', err); return null; }
}

// Join a circle by its invite code (seats you as 'adult'; a parent can adjust a
// child's role afterward). Returns a STRUCTURED result so the UI can message
// honestly instead of collapsing every outcome to "code didn't match":
//   { ok: true,  circleId, already }  — joined (already=false) or already a member (true)
//   { ok: false, reason: 'not_found' } — no circle has that code
//   { ok: false, reason: 'error' }     — no session / lookup or join failed
// IDEMPOTENT: a circle you already belong to (e.g. the one you created — same
// auth user, or a re-tap) is a SUCCESS, not a failure. The member insert upserts
// with ignoreDuplicates so the PRIMARY KEY(circle_id, member) can't fail-soft into
// a misleading "code didn't match". NOTE: a circle is between two DIFFERENT
// PoeTech sign-ins; the device-profile switcher is one auth user, so a person can
// never "join" a circle their own account already owns (already=true, correctly).
export async function joinByInvite(code) {
  const session = await ownedSession();
  if (!session || !code) return { ok: false, reason: 'error' };
  try {
    const { data: circle, error } = await supabase.from('tv_circle')
      .select('id').eq('invite_code', String(code).trim().toUpperCase()).maybeSingle();
    if (error) { console.warn('[tv-circle] invite lookup failed:', error); return { ok: false, reason: 'error' }; }
    if (!circle) return { ok: false, reason: 'not_found' };
    // Already a member? (You created it, or joined before.) Report it as such,
    // not as a join and not as an error.
    const { data: existing } = await supabase.from('tv_circle_member')
      .select('member').eq('circle_id', circle.id).eq('member', session.user.id).maybeSingle();
    if (existing) return { ok: true, circleId: circle.id, already: true };
    const { error: mErr } = await supabase.from('tv_circle_member')
      .upsert({ circle_id: circle.id, member: session.user.id, role: 'adult', display: '' },
        { onConflict: 'circle_id,member', ignoreDuplicates: true });
    if (mErr) { console.warn('[tv-circle] join failed:', mErr); return { ok: false, reason: 'error' }; }
    return { ok: true, circleId: circle.id, already: false };
  } catch (err) { console.warn('[tv-circle] join failed:', err); return { ok: false, reason: 'error' }; }
}

// The circles I belong to, with my role. [] on any failure.
export async function myCircles() {
  const session = await ownedSession();
  if (!session) return [];
  try {
    const { data, error } = await supabase.from('tv_circle_member')
      .select('role, circle:tv_circle(id,name,kind,invite_code)')
      .eq('member', session.user.id);
    if (error || !data) { console.warn('[tv-circle] myCircles failed:', error); return []; }
    return data.filter((r) => r.circle).map((r) => ({ ...r.circle, role: r.role }));
  } catch (err) { console.warn('[tv-circle] myCircles failed:', err); return []; }
}

// Members of a circle (RLS: only if you're in it). [] on failure.
export async function circleMembers(circleId) {
  if (!circleId) return [];
  try {
    const { data, error } = await supabase.from('tv_circle_member')
      .select('member, role, display, spouse_of').eq('circle_id', circleId);
    if (error || !data) { console.warn('[tv-circle] members failed:', error); return []; }
    return data;
  } catch (err) { console.warn('[tv-circle] members failed:', err); return []; }
}

// A parent sets a member's role / spouse / display (RLS enforces parent-only).
export async function setMember(circleId, member, patch = {}) {
  if (!circleId || !member) return false;
  try {
    const clean = {};
    if (patch.role) clean.role = patch.role;
    if ('spouse_of' in patch) clean.spouse_of = patch.spouse_of || null;
    if ('display' in patch) clean.display = patch.display || '';
    const { error } = await supabase.from('tv_circle_member').update(clean)
      .eq('circle_id', circleId).eq('member', member);
    if (error) { console.warn('[tv-circle] setMember failed:', error); return false; }
    return true;
  } catch (err) { console.warn('[tv-circle] setMember failed:', err); return false; }
}

// Publish your per-audience shared docs to a circle: only the shows you flagged
// for each audience (publishDocFor — private shows never leave). An audience with
// no shows is DELETED (so unsharing everything removes the row). Fail-soft → bool.
export async function publishShares(state, circleId, catalog = {}) {
  const session = await ownedSession();
  if (!session || !circleId) return false;
  try {
    let ok = true;
    for (const audience of AUDIENCE_KEYS) {
      const doc = publishDocFor(state, audience, catalog);
      const has = Object.keys(doc.shows).length > 0;
      if (has) {
        const { error } = await supabase.from('tv_share')
          .upsert({ owner: session.user.id, circle_id: circleId, audience, doc, updated_at: new Date().toISOString() },
            { onConflict: 'owner,circle_id,audience' });
        if (error) { console.warn('[tv-circle] publish failed:', audience, error); ok = false; }
      } else {
        const { error } = await supabase.from('tv_share').delete()
          .eq('owner', session.user.id).eq('circle_id', circleId).eq('audience', audience);
        if (error) { console.warn('[tv-circle] unpublish failed:', audience, error); ok = false; }
      }
    }
    return ok;
  } catch (err) { console.warn('[tv-circle] publish failed:', err); return false; }
}

// Read every share in a circle the RLS lets you see. [] on failure. The DB — not
// this client — decides what you may read (kids never get 'us', etc.).
export async function fetchCircleShares(circleId) {
  if (!circleId) return [];
  try {
    const { data, error } = await supabase.from('tv_share')
      .select('owner, audience, doc').eq('circle_id', circleId);
    if (error || !data) { console.warn('[tv-circle] fetch shares failed:', error); return []; }
    return data;
  } catch (err) { console.warn('[tv-circle] fetch shares failed:', err); return []; }
}

// Live: any share change in the circle re-triggers the caller's refetch. RLS
// scopes the stream. Returns an unsubscribe fn.
export function subscribeCircleShares(circleId, onChange) {
  if (!circleId) return () => {};
  let channel = null; let cancelled = false;
  try {
    channel = supabase.channel(`tv-circle-${circleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tv_share', filter: `circle_id=eq.${circleId}` },
        () => { if (!cancelled) onChange(); })
      .subscribe();
  } catch (err) { console.warn('[tv-circle] subscribe failed:', err); }
  return function unsubscribe() {
    cancelled = true;
    if (channel) { try { supabase.removeChannel(channel); } catch { /* closed */ } }
  };
}
