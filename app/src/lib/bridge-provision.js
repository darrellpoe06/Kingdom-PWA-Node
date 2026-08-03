// =============================================================================
// bridge-provision — the bridge token provisions itself on family devices
// =============================================================================
// Darrell 2026-08-03 ("Humans don't do anything is our Ways"), from the fold
// screenshot: Real Estate's photos/history panels demanded a per-device token
// paste. That was the v1 pattern (nas-photos.js recorded the promotion to
// family-shared as "a follow-up"); this is the follow-up. A signed-in family
// device pulls the token through the RLS-deny-all + SECURITY DEFINER RPC pair
// (migration 0128) into the same localStorage slot everything already reads;
// one steward paste anywhere publishes it for every family device.
//
// Security posture preserved (the 2026-07-30 leak-closure): the token never
// ships in the bundle; anon/demo gets NULL from the RPC and lands on the same
// honest paste gate as before. Fail-quiet contract like nas-photos.js: these
// never throw, callers never render an error wall because of them.
import { hasBridgeToken, setBridgeToken } from './nas-photos.js';

// Returns 'present' (device already had it), 'provisioned' (fetched + stored),
// or 'none' (signed out, no row yet, offline — the paste gate stays).
export async function provisionBridgeToken(client) {
  try {
    if (hasBridgeToken()) return 'present';
    if (!client || typeof client.rpc !== 'function') return 'none';
    const { data, error } = await client.rpc('get_family_bridge_token');
    const token = typeof data === 'string' ? data.trim() : '';
    if (error || !token) return 'none';
    setBridgeToken(token);
    return 'provisioned';
  } catch {
    return 'none';
  }
}

// Publish a freshly pasted token so every other family device provisions
// itself from now on. Owner/admin-gated server-side (0128). Returns true only
// when the RPC confirms a write; false is non-fatal (the local save stands).
export async function publishBridgeToken(client, token) {
  try {
    const clean = String(token || '').trim();
    if (!clean || !client || typeof client.rpc !== 'function') return false;
    const { data, error } = await client.rpc('set_family_bridge_token', { p_token: clean });
    return !error && data === true;
  } catch {
    return false;
  }
}
