// =============================================================================
// /api/device-link — turn an approved TV request into a real session
// =============================================================================
// Darrell on the Fire TV, 2026-09-25 02:30 UTC: "Hard to sign in on a
// Firestick... what happened to the qr code ways?" The device-link table and
// its functions (migration 0222) were written 2026-09-20 and could approve a
// request, but nothing could turn an approval into a signed-in television:
// device_link_claim returns a user_id, and a user_id is not a session. THIS is
// that missing piece (DR-0658).
//
// WHY HERE. The app's privileged server pieces live in Pages Functions beside
// this file (/api/push-send is the model): they run on poetech.us, hold
// SUPABASE_URL + SUPABASE_SERVICE_KEY in the Pages environment (installed and
// proven by push-sender-credentials.yml, run 34431549970), and the key never
// reaches a browser. Minting a session needs the service role; nothing else in
// the flow does.
//
// THE SECURITY SPLIT, kept exactly as device-link.js documents it:
//   - The TV sends its RAW device_code here, and only here. We hash it
//     (SHA-256, the same function the TV used) and claim by the hash. A leaked
//     row holds only the hash, which this endpoint will not accept as a code.
//   - The user_code is never accepted here. It cannot claim anything.
//   - device_link_claim burns the row in the same UPDATE that reads it, so a
//     second claim finds nothing (single use), and it refuses an expired row
//     (10 minutes). Since migration 0239 only service_role may call it.
//   - Starts and approvals are rate-limited in the database (0239).
//
// HOW A SESSION IS MINTED. GoTrue's admin generate_link (type magiclink) makes
// a one-time hashed token for the approver's email WITHOUT sending any mail;
// /verify exchanges it for an access + refresh token pair. Phone+PIN members
// have their synthetic login email (phone.poetech.us), so both doors work.
// The token pair goes back to the TV once, over this same-origin POST.
import { isDeviceCode, hashDeviceCode } from '../../src/lib/device-link.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

const asStr = (v) => (typeof v === 'string' ? v.trim() : '');

function config(env) {
  const e = env || {};
  return {
    url: asStr(e.SUPABASE_URL).replace(/\/+$/, ''),
    key: asStr(e.SUPABASE_SERVICE_KEY),
  };
}

/**
 * Is the endpoint wired, and can it reach what it needs? Status codes only,
 * never a value. This is the live witness for the one thing the sandbox could
 * not measure: that the NAS gateway's /sb mount passes GoTrue's admin route
 * and the device_link RPCs through to the service role (DR-0658). Open
 * https://poetech.us/api/device-link: ready:true means the TV can be signed in.
 */
export async function onRequestGet(context) {
  const { url, key } = config(context.env);
  if (!url || !key) return json({ ok: true, configured: false, ready: false });
  const svc = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' };
  const status = async (p) => { try { return (await p).status; } catch { return 0; } };
  const [auth, db] = await Promise.all([
    status(fetch(`${url}/auth/v1/admin/users?per_page=1`, { headers: svc })),
    status(fetch(`${url}/rest/v1/rpc/device_link_poll`, { method: 'POST', headers: svc, body: JSON.stringify({ p_device_hash: '0'.repeat(64) }) })),
  ]);
  return json({ ok: true, configured: true, ready: auth === 200 && db === 200, auth, db });
}

export async function onRequestPost(context) {
  const { url, key } = config(context.env);
  if (!url || !key) return json({ error: 'not-configured' }, 503);

  let body;
  try { body = await context.request.json(); } catch { return json({ error: 'bad-json' }, 400); }
  const deviceCode = asStr(body && body.device_code);
  // Only a 64-hex device_code is accepted. A user_code (8 letters), a hash
  // lifted from a row, or anything else stops here.
  if (!isDeviceCode(deviceCode)) return json({ error: 'bad-device-code' }, 400);

  const deviceHash = await hashDeviceCode(deviceCode);
  const svc = { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' };

  // 1. Claim: burn the row and learn whose it is, in one statement.
  let claimed;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/device_link_claim`, {
      method: 'POST', headers: svc, body: JSON.stringify({ p_device_hash: deviceHash }),
    });
    if (!res.ok) return json({ error: `claim-${res.status}` }, 502);
    claimed = await res.json();
  } catch {
    return json({ error: 'claim-unreachable' }, 502);
  }
  const userId = Array.isArray(claimed) && claimed[0] && claimed[0].user_id;
  if (!userId) {
    // Say why, in the state words the TV already knows. Read-only.
    let state = 'unknown';
    try {
      const res = await fetch(`${url}/rest/v1/rpc/device_link_poll`, {
        method: 'POST', headers: svc, body: JSON.stringify({ p_device_hash: deviceHash }),
      });
      const rows = res.ok ? await res.json() : [];
      state = (Array.isArray(rows) && rows[0] && rows[0].state) || 'unknown';
    } catch { /* unknown */ }
    return json({ error: 'not-claimable', state }, 409);
  }

  // 2. Whose email carries the one-time token.
  let email = '';
  try {
    const res = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, { headers: svc });
    if (!res.ok) return json({ error: `user-${res.status}` }, 502);
    const u = await res.json();
    email = asStr(u && (u.email || (u.user && u.user.email)));
  } catch {
    return json({ error: 'user-unreachable' }, 502);
  }
  if (!email) return json({ error: 'no-email' }, 422);

  // 3. A one-time token for that account. No mail is sent by generate_link.
  let tokenHash = '';
  try {
    const res = await fetch(`${url}/auth/v1/admin/generate_link`, {
      method: 'POST', headers: svc, body: JSON.stringify({ type: 'magiclink', email }),
    });
    if (!res.ok) return json({ error: `link-${res.status}` }, 502);
    const g = await res.json();
    tokenHash = asStr(g && (g.hashed_token || (g.properties && g.properties.hashed_token)));
  } catch {
    return json({ error: 'link-unreachable' }, 502);
  }
  if (!tokenHash) return json({ error: 'link-empty' }, 502);

  // 4. Exchange it for the session the television keeps.
  try {
    const res = await fetch(`${url}/auth/v1/verify`, {
      method: 'POST',
      headers: { apikey: key, 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'magiclink', token_hash: tokenHash }),
    });
    const s = await res.json().catch(() => ({}));
    if (!res.ok || !s.access_token || !s.refresh_token) return json({ error: `verify-${res.status}` }, 502);
    return json({ access_token: s.access_token, refresh_token: s.refresh_token });
  } catch {
    return json({ error: 'verify-unreachable' }, 502);
  }
}
