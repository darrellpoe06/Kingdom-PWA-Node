// =============================================================================
// home-accounts — a person's own logins on the home servers, ready (DR-1121)
// =============================================================================
// Darrell 2026-10-19: "Your do everything so users can just use them... End to
// end workflows" / "Ready logins for the app automatically gets access....
// right" / "No my family does.... other users can do it on their server".
// The NAS loop (infra/nas-home-accounts) makes each household member an
// account on each home server and writes one home_accounts row per (person,
// service). This module is the app's whole contract with that:
//   home_accounts         the signed-in person's own rows (RLS: owner reads)
//   home_account_seen     "I have it": clears the first password from the row
//   /photo-backup/health  Immich's road, its own words
//   /libraries/health     Jellyfin's and Audiobookshelf's road, its own words
// USER-ACCOUNTS-AND-HISTORIES-STANDARD: the rows are USER-scoped (a login is a
// person's, not an instance's), hold the login and where to use it, and the
// first password only until the person says they have it; the person reads
// only their own, by RLS, never by a UI check. Nothing here paints a status:
// a login shows only when its row exists, and a server reads live only when
// its door said so.
// =============================================================================
import { classifyHealth as classifyPhotoBackup, healthUrl as photoBackupHealthUrl, KEY_HEADER } from './photo-backup.js';

export const LIBRARIES_BASE = '/libraries';
export const HEALTH_TIMEOUT_MS = 12000;
export function librariesHealthUrl() { return `${LIBRARIES_BASE}/health`; }

/** The three home servers a person gets a login on, in the order shown. */
export const HOME_SERVICES = Object.freeze([
  {
    id: 'immich', name: 'Photos', app: 'Immich', what: 'every new photo and video on your phone, backed up to the house',
    getApp: 'https://immich.app/', road: 'photo-backup',
    howToReach: 'From anywhere: the Immich app signs in to the server below. One setting first: Settings, then Advanced, then Custom proxy headers, add the header shown with the family key (Copy below).',
  },
  {
    id: 'jellyfin', name: 'Video', app: 'Jellyfin', what: 'the sermons, the worship recordings and the house’s own films on any screen',
    getApp: 'https://jellyfin.org/downloads/', road: 'libraries',
    howToReach: 'On the house network, or anywhere with Tailscale on: the Jellyfin app signs in to the server below.',
  },
  {
    id: 'audiobookshelf', name: 'Audio', app: 'Audiobookshelf', what: 'the lesson readings, the spoken lessons and the house’s audiobooks, with your place kept',
    getApp: 'https://www.audiobookshelf.org/', road: 'libraries',
    howToReach: 'On the house network, or anywhere with Tailscale on: the Audiobookshelf app signs in to the server below.',
  },
]);

export { KEY_HEADER };

/** The libraries road's state from its /health answer, per server. */
export function classifyLibraries(status, body) {
  const one = (part) => {
    if (!part || typeof part !== 'object') return { state: 'unreachable', reason: 'no answer' };
    if (part.ok === true) return { state: 'live', version: part.version ? String(part.version) : null, note: part.note ? String(part.note) : null };
    return { state: 'dark', reason: String(part.reason || 'not ready') };
  };
  if (typeof status === 'number' && status > 0 && body && typeof body === 'object' && ('jellyfin' in body || 'audiobookshelf' in body)) {
    return { jellyfin: one(body.jellyfin), audiobookshelf: one(body.audiobookshelf), shelves: one(body.shelves) };
  }
  const un = { state: 'unreachable', reason: 'The libraries road is not answering yet. It starts on the NAS once both servers are up.' };
  return { jellyfin: un, audiobookshelf: un, shelves: un };
}

async function timed(fetchImpl, url, opts, ms) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => { try { ctrl && ctrl.abort(); } catch { /* done */ } }, ms);
  try { return await fetchImpl(url, ctrl ? { ...opts, signal: ctrl.signal } : opts); } finally { clearTimeout(timer); }
}

async function readJson(fetchImpl, url) {
  if (typeof fetchImpl !== 'function') return [0, null];
  try {
    const res = await timed(fetchImpl, url, { method: 'GET', cache: 'no-store' }, HEALTH_TIMEOUT_MS);
    let body; try { body = await res.json(); } catch { body = null; }
    return [res.status, body];
  } catch { return [0, null]; }
}

/** {immich, jellyfin, audiobookshelf}: each {state, ...} from its own road. */
export async function homeServersHealth({ fetchImpl = globalThis.fetch } = {}) {
  const [[ps, pb], [ls, lb]] = await Promise.all([readJson(fetchImpl, photoBackupHealthUrl()), readJson(fetchImpl, librariesHealthUrl())]);
  const libs = classifyLibraries(ls, lb);
  return { immich: classifyPhotoBackup(ps, pb), jellyfin: libs.jellyfin, audiobookshelf: libs.audiobookshelf };
}

/** The signed-in person's rows, or [] (never throws). */
export async function fetchHomeAccounts(client) {
  try {
    if (!client || typeof client.from !== 'function') return [];
    const { data, error } = await client.from('home_accounts')
      .select('service,login,initial_password,server_url,header_name,ready_at,seen_at')
      .order('service');
    if (error || !Array.isArray(data)) return [];
    return data.filter((r) => r && HOME_SERVICES.some((s) => s.id === r.service));
  } catch { return []; }
}

/** "I have it": the row forgets the first password. True only when the RPC confirms. */
export async function markSeen(client, service) {
  try {
    if (!client || typeof client.rpc !== 'function') return false;
    const { data, error } = await client.rpc('home_account_seen', { p_service: service });
    return !error && data === true;
  } catch { return false; }
}

export const accountFor = (rows, service) => (Array.isArray(rows) ? rows.find((r) => r.service === service) : null) || null;
