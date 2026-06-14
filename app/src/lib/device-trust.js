// =============================================================================
// device-trust — P2 (Device) client wrapper
// =============================================================================
// On a full multi-point login we mint a device-trust token (issue_device_trust)
// and store the RAW token ON-DEVICE (localStorage). The server keeps only its
// SHA-256 hash (migration 0022), so a DB leak cannot reconstruct device trust —
// "process, don't store". On the next visit, a trusted device presents the token
// and counts as one access point, so the user only needs their PIN (fast path).
//
// A NEW / unknown device holds no token, so it is NOT a point until earned by a
// full login. Revoking a device deletes the local token and marks the row
// revoked server-side, so the fast path stops working immediately.
//
// Keys:
//   poe-device-id            — stable per-browser device id (shared across the
//                              accounts that sign in on this browser).
//   poe-device-trust:<uid>   — the raw token for a given Supabase user on THIS
//                              device. Scoped per user so a family shared device
//                              keeps each member's trust separate.
// =============================================================================
import supabase from './supabase.js';

const DEVICE_ID_KEY = 'poe-device-id';
const TOKEN_KEY_PREFIX = 'poe-device-trust:';

function ls() {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch (_) { return null; }
}

function randomId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const b = new Uint8Array(16); crypto.getRandomValues(b);
      return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    }
  } catch (_) { /* fall through */ }
  // Last-resort id — still >= 8 chars so the server accepts it. Not security
  // material (the token is); the device_id only namespaces the token.
  return 'dev-' + String(Date.now()) + '-' + String(Math.floor(Math.random() * 1e9));
}

/** Stable id for this browser/device; created and persisted on first call. */
export function getDeviceId() {
  const store = ls();
  if (!store) return randomId();
  let id = null;
  try { id = store.getItem(DEVICE_ID_KEY); } catch (_) { /* ignore */ }
  if (!id) {
    id = randomId();
    try { store.setItem(DEVICE_ID_KEY, id); } catch (_) { /* ignore */ }
  }
  return id;
}

function tokenKey(userId) { return TOKEN_KEY_PREFIX + String(userId || 'anon'); }

function readToken(userId) {
  const store = ls();
  if (!store) return null;
  try { return store.getItem(tokenKey(userId)); } catch (_) { return null; }
}
function writeToken(userId, token) {
  const store = ls();
  if (!store) return;
  try { store.setItem(tokenKey(userId), token); } catch (_) { /* ignore */ }
}
function clearToken(userId) {
  const store = ls();
  if (!store) return;
  try { store.removeItem(tokenKey(userId)); } catch (_) { /* ignore */ }
}

function isMissingRpc(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  return code === 'PGRST202' || code === '404'
    || msg.includes('could not find the function') || msg.includes('does not exist');
}

/** Is THIS device currently trusted for the given user? Verifies the local
 *  token against the server. @returns {trusted, backendAvailable} */
export async function isDeviceTrusted(userId) {
  const token = readToken(userId);
  if (!token) return { trusted: false, backendAvailable: true };
  try {
    const { data, error } = await supabase.rpc('verify_device_trust', {
      device_id: getDeviceId(), token,
    });
    if (error) {
      if (isMissingRpc(error)) return { trusted: false, backendAvailable: false };
      console.warn('[device-trust] verify failed:', error.code || error.message);
      return { trusted: false, backendAvailable: true };
    }
    // Stale/revoked token: drop it so we don't keep presenting it.
    if (data !== true) clearToken(userId);
    return { trusted: data === true, backendAvailable: true };
  } catch (_) {
    console.warn('[device-trust] verify threw');
    return { trusted: false, backendAvailable: true };
  }
}

/** Mint a trust token for this device + user and store it locally.
 *  @returns {ok, backendAvailable} */
export async function trustThisDevice(userId, label) {
  try {
    const { data, error } = await supabase.rpc('issue_device_trust', {
      device_id: getDeviceId(), label: label || deviceLabel(),
    });
    if (error) {
      if (isMissingRpc(error)) return { ok: false, backendAvailable: false };
      console.warn('[device-trust] issue failed:', error.code || error.message);
      return { ok: false, backendAvailable: true };
    }
    if (typeof data === 'string' && data) {
      writeToken(userId, data);
      return { ok: true, backendAvailable: true };
    }
    return { ok: false, backendAvailable: true };
  } catch (_) {
    console.warn('[device-trust] issue threw');
    return { ok: false, backendAvailable: true };
  }
}

/** List the user's trusted devices (for the manage/revoke UI). */
export async function listTrustedDevices() {
  try {
    const { data, error } = await supabase.rpc('list_trusted_devices', {});
    if (error) {
      if (isMissingRpc(error)) return { devices: [], backendAvailable: false };
      console.warn('[device-trust] list failed:', error.code || error.message);
      return { devices: [], backendAvailable: true };
    }
    return { devices: Array.isArray(data) ? data : [], backendAvailable: true };
  } catch (_) {
    return { devices: [], backendAvailable: true };
  }
}

/** Revoke a device by its row id. If it is THIS device, also clear local token. */
export async function revokeDevice(deviceUuid, userId, isThisDevice) {
  try {
    const { data, error } = await supabase.rpc('revoke_device_trust', { device_uuid: deviceUuid });
    if (error) {
      if (isMissingRpc(error)) return { ok: false, backendAvailable: false };
      console.warn('[device-trust] revoke failed:', error.code || error.message);
      return { ok: false, backendAvailable: true };
    }
    if (isThisDevice) clearToken(userId);
    return { ok: !!(data && data.ok), backendAvailable: true };
  } catch (_) {
    return { ok: false, backendAvailable: true };
  }
}

/** Forget this device's local token (e.g. on sign-out). Does not revoke
 *  server-side — that is an explicit user action via revokeDevice. */
export function forgetLocalDeviceTrust(userId) { clearToken(userId); }

/** A human-friendly default label from the user agent (best-effort, no PII). */
export function deviceLabel() {
  try {
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    if (/iphone/i.test(ua)) return 'iPhone';
    if (/ipad/i.test(ua)) return 'iPad';
    if (/android/i.test(ua)) return 'Android device';
    if (/macintosh|mac os x/i.test(ua)) return 'Mac';
    if (/windows/i.test(ua)) return 'Windows PC';
    if (/linux/i.test(ua)) return 'Linux';
  } catch (_) { /* ignore */ }
  return 'This device';
}
