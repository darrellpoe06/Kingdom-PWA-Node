// =============================================================================
// device-link-client — the I/O half of "sign in to the TV from your phone"
// =============================================================================
// device-link.js decides what is safe; this file only talks. Every function
// takes its client (a supabase-js client, a fetch) as an argument, so the
// suite drives the real code against fakes and the Playwright proof drives it
// against a real GoTrue + PostgREST (DR-0658).
//
//   TV    startLink    -> device_link_start (anon RPC; only the HASH is sent)
//         pollLink     -> device_link_poll  (anon RPC; answers a state word)
//         claimLink    -> POST /api/device-link with the RAW device_code. The
//                         Pages Function hashes it, burns the row with the
//                         service role and hands back a one-time session.
//         finishSignIn -> supabase.auth.setSession(tokens)
//   PHONE describeLink -> device_link_describe (signed-in RPC; no secret)
//         decideLink   -> device_link_decide   (signed-in RPC)
// =============================================================================
import {
  newDeviceCode, newUserCode, hashDeviceCode, deviceLabel, isUserCode, STATE,
} from './device-link.js';

export const CLAIM_ENDPOINT = '/api/device-link';

const errText = (e) => String((e && (e.message || e.details || e.hint)) || e || '');

/** A sentence for a failure, never a stack trace on a television. */
export function linkErrorMessage(e) {
  const t = errText(e);
  if (/rate-limited/i.test(t)) return 'Too many sign-in codes were asked for just now. Wait a minute, then try again.';
  if (/sign-in-required/i.test(t)) return 'Sign in on this phone first, then approve.';
  if (/not-configured/i.test(t)) return 'Phone sign-in is not switched on for this site yet. Use Google or your phone number and PIN below.';
  if (/Failed to fetch|NetworkError|network/i.test(t)) return 'We could not reach PoeTech. Check the connection and try again.';
  return 'Something went wrong starting phone sign-in. Try again, or use another way below.';
}

/**
 * The television opens a request. Returns the secret it must keep and the
 * short code it shows. A collision on the short code (unique index) is
 * retried with a fresh one; anything else is thrown.
 */
export async function startLink(sb, { userAgent = '', crypto, attempts = 3 } = {}) {
  const deviceCode = newDeviceCode(crypto);
  const deviceHash = await hashDeviceCode(deviceCode, crypto);
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    const userCode = newUserCode(crypto);
    const { data, error } = await sb.rpc('device_link_start', {
      p_device_hash: deviceHash,
      p_user_code: userCode,
      p_label: deviceLabel(userAgent),
    });
    if (!error) {
      const row = Array.isArray(data) ? data[0] : data;
      return {
        deviceCode,
        deviceHash,
        userCode: (row && row.user_code) || userCode,
        expiresAt: (row && row.expires_at) || null,
      };
    }
    lastErr = error;
    // 23505 = unique_violation: another TV holds that short code. Try again.
    if (error.code !== '23505') break;
  }
  throw lastErr || new Error('device-link: start failed');
}

/** How the request stands. Unknown on any failure: never a false "approved". */
export async function pollLink(sb, deviceHash) {
  const { data, error } = await sb.rpc('device_link_poll', { p_device_hash: deviceHash });
  if (error) return STATE.UNKNOWN;
  const row = Array.isArray(data) ? data[0] : data;
  const s = row && row.state;
  return Object.values(STATE).includes(s) ? s : STATE.UNKNOWN;
}

/**
 * Collect the session. The raw device_code goes to our own Pages Function and
 * nowhere else. Returns { ok, session } or { ok:false, error, status }.
 */
export async function claimLink(deviceCode, { fetchImpl, endpoint = CLAIM_ENDPOINT } = {}) {
  const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!f) return { ok: false, error: 'no-fetch', status: 0 };
  let res;
  try {
    res = await f(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ device_code: deviceCode }),
    });
  } catch (e) {
    return { ok: false, error: errText(e) || 'network', status: 0 };
  }
  let body;
  try { body = await res.json(); } catch { body = {}; }
  if (res.ok && body && body.access_token && body.refresh_token) {
    return { ok: true, session: { access_token: body.access_token, refresh_token: body.refresh_token } };
  }
  return { ok: false, error: (body && body.error) || `http-${res.status}`, status: res.status };
}

/** Become signed in with the tokens the claim handed over. */
export async function finishSignIn(sb, session) {
  const { data, error } = await sb.auth.setSession(session);
  if (error) throw error;
  return data && data.session;
}

/** The phone looks up what it is about to approve. Null when there is no such code. */
export async function describeLink(sb, userCode) {
  if (!isUserCode(userCode)) return null;
  const { data, error } = await sb.rpc('device_link_describe', { p_user_code: userCode });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row || null;
}

/** Approve (true) or deny (false). True only when exactly one pending row moved. */
export async function decideLink(sb, userCode, approve) {
  if (!isUserCode(userCode)) return false;
  const { data, error } = await sb.rpc('device_link_decide', { p_user_code: userCode, p_approve: !!approve });
  if (error) throw error;
  return data === true;
}
