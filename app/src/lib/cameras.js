// =============================================================================
// cameras — pure helpers behind the Cameras surface (DR-0756)
// =============================================================================
// Darrell 2026-10-06: "I want to be able to see my wyze cam feeds inside my
// PoeTech App... and any system I own..."
//
// The app never holds a camera registry of its own. The ONE source of truth is
// the restreamer that actually reaches the cameras (go2rtc on the NAS, behind
// cams_forwarder.py); this module shapes what it says into what the screen
// shows. Reality-trace (P15): every number on the surface is read from that
// running system or measured in the browser — nothing is painted.
//
// Transport: the same-origin /cams road (app/functions/cams/[[path]].js ->
// Funnel -> poetech-cams.service). Bearer = the family bridge token every
// family device already provisions itself (lib/bridge-provision.js). Media
// elements cannot carry a header, so media URLs carry a short one-camera
// PLAYBACK TICKET the forwarder mints for the bearer.
//
// HONEST BROWSER FACTS this module encodes (DR-0076): progressive MP4 does not
// play in Safari/iOS; HLS does, natively. Chrome/Edge/Firefox/Android play MP4.
// So the player is chosen by asking the device's own <video> what it can play,
// never by sniffing a user agent.
// =============================================================================

export const CAMS_BASE = '/cams';

// Cadence + ceilings (the surface's brakes, mirrored from the forwarder's).
export const SNAPSHOT_INTERVAL_MS = 5000;   // one frame per camera per 5 s while the tab is visible
export const FETCH_TIMEOUT_MS = 12000;      // any single call (list / ticket / frame)
export const LIVE_FIRST_FRAME_TIMEOUT_MS = 20000; // a live view that shows nothing by then is reported, not left spinning
export const SNAPSHOT_WIDTH = 640;

export function healthUrl() { return `${CAMS_BASE}/health`; }
export function listUrl() { return `${CAMS_BASE}/list`; }
export function ticketUrl() { return `${CAMS_BASE}/ticket`; }
export function setupUrl() { return `${CAMS_BASE}/setup/wyze`; }
export const SETUP_TIMEOUT_MS = 75000; // Wyze's cloud listing + go2rtc's persist; the NAS gives it 60 s

export function snapUrl(id, { w = SNAPSHOT_WIDTH, ticket = '' } = {}) {
  const q = [`w=${Math.max(16, Math.min(1920, Number(w) || SNAPSHOT_WIDTH))}`];
  if (ticket) q.push(`t=${encodeURIComponent(ticket)}`);
  return `${CAMS_BASE}/snap/${encodeURIComponent(id)}.jpg?${q.join('&')}`;
}

// mode: 'hls' (Safari / iOS / Fire TV) | 'mp4' (everything else)
export function liveUrl(id, mode, ticket) {
  const t = `t=${encodeURIComponent(ticket || '')}`;
  const cam = encodeURIComponent(id);
  return mode === 'hls'
    ? `${CAMS_BASE}/live/${cam}/index.m3u8?${t}`
    : `${CAMS_BASE}/live/${cam}.mp4?${t}`;
}

// Ask the device, not the user agent. `canPlayType` is the <video> element's
// own answer ('probably' | 'maybe' | ''). Safari and iOS answer for HLS;
// Chrome/Firefox answer '' and get progressive MP4.
export function pickLiveMode(canPlayType) {
  try {
    const a = typeof canPlayType === 'function' ? canPlayType('application/vnd.apple.mpegurl') : '';
    return a ? 'hls' : 'mp4';
  } catch { return 'mp4'; }
}

export const CAMERA_ID = /^[A-Za-z0-9_.-]{1,64}$/;

// The forwarder's /list -> a clean, sorted array. Tolerates garbage.
export function parseCameraList(json) {
  const list = json && Array.isArray(json.cameras) ? json.cameras : [];
  const out = [];
  for (const c of list) {
    if (!c || typeof c.id !== 'string' || !CAMERA_ID.test(c.id)) continue;
    out.push({
      id: c.id,
      name: typeof c.name === 'string' && c.name.trim() ? c.name.trim() : c.id.replace(/[_-]+/g, ' '),
      kind: typeof c.kind === 'string' ? c.kind : 'unknown',
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// Systems, as go2rtc names their source schemes. `how` is the one line that
// adds that kind of system — documentation that lives IN the app (DR-0065).
export const KINDS = [
  { id: 'wyze',    label: 'Wyze',        how: 'Signed in once through the NAS restreamer (Add > Wyze); each camera becomes one wyze:// line. Needs DTLS firmware; Gwell models (Cam OG, Pan v4, Floodlight Pro) are not yet supported.' },
  { id: 'ring',    label: 'Ring',        how: 'Add > Ring on the NAS restreamer signs in and writes one ring:// line per device.' },
  { id: 'onvif',   label: 'ONVIF',       how: 'driveway: onvif://user:pass@192.168.1.x — the sovereign PoE backbone (DR-0050); UniFi Protect speaks this and rtsps.' },
  { id: 'rtsp',    label: 'RTSP / RTMP', how: 'garage: rtsp://user:pass@192.168.1.y/live — anything that already streams.' },
  { id: 'homekit', label: 'HomeKit',     how: 'A HomeKit camera paired to the restreamer instead of a phone.' },
  { id: 'http',    label: 'HTTP / MJPEG', how: 'A snapshot or MJPEG URL the camera already serves.' },
  { id: 'unknown', label: 'Camera',      how: '' },
  { id: 'other',   label: 'Other',       how: '' },
];

export function kindLabel(kind) {
  const k = KINDS.find((x) => x.id === kind);
  return k ? k.label : 'Camera';
}

export function groupByKind(cameras) {
  const groups = new Map();
  for (const c of cameras || []) {
    const key = c.kind || 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  // Known kinds first in KINDS order, then anything else alphabetically.
  const order = KINDS.map((k) => k.id);
  return [...groups.entries()]
    .sort((a, b) => {
      const ia = order.indexOf(a[0]); const ib = order.indexOf(b[0]);
      if (ia === -1 && ib === -1) return a[0].localeCompare(b[0]);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .map(([kind, list]) => ({ kind, label: kindLabel(kind), cameras: list }));
}

// What the whole surface IS right now — derived, never painted.
//   'no-token'     this device holds no family key (the honest gate)
//   'unauthorized' the key was refused (stale / rotated)
//   'unreachable'  the road or the restreamer is dark (502 / network)
//   'empty'        the restreamer is up and has zero cameras (setup)
//   'ready'        cameras listed
//   'error'        anything else (status shown)
export function classifyServiceState({ tokenPresent, status, count, networkError } = {}) {
  if (!tokenPresent) return 'no-token';
  if (networkError) return 'unreachable';
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 502 || status === 503 || status === 504) return 'unreachable';
  if (status === 200) return (Number(count) || 0) > 0 ? 'ready' : 'empty';
  return 'error';
}

// "3 s ago" / "1 m ago" — for the per-frame freshness line.
export function formatAge(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '';
  const s = Math.round(ms / 1000);
  if (s < 1) return 'just now';
  if (s < 60) return `${s} s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} m ago`;
  return `${Math.round(m / 60)} h ago`;
}

export function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// fetch with an explicit ceiling (DoD: every async routine has a timeout and a
// fallback path). Resolves to the Response or throws; the caller classifies.
export async function fetchWithTimeout(url, opts = {}, ms = FETCH_TIMEOUT_MS, fetchImpl = globalThis.fetch) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => { try { ctrl && ctrl.abort(); } catch { /* already done */ } }, ms);
  try {
    return await fetchImpl(url, ctrl ? { ...opts, signal: ctrl.signal } : opts);
  } finally {
    clearTimeout(timer);
  }
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// WYZE SIGN-IN FROM THE APP (2026-10-07; Darrell: "Is that the easiest way
// to build it so I don't have to do much work for it to work right away?").
// The four values are the only thing the repo cannot supply. They are typed
// ONCE, here, and handed over the locked road to go2rtc's own sign-in on the
// NAS (infra/nas-cameras/cams_forwarder.py POST /setup/wyze), which keeps the
// account and lists and registers the cameras itself. Nothing is kept in the
// browser. The PowerShell steps below remain as the road for a terminal.
export const WYZE_FIELDS = Object.freeze([
  { key: 'email', label: 'Wyze email', type: 'email', autoComplete: 'username', hint: 'The email you sign in to the Wyze app with.' },
  { key: 'password', label: 'Wyze password', type: 'password', autoComplete: 'current-password', hint: 'Used once to sign in; the NAS keeps it, this browser does not.' },
  { key: 'api_id', label: 'API ID', type: 'text', autoComplete: 'off', hint: 'Made once on the Wyze Developer API Console (the link above). It is NOT in the Wyze app or on my.wyze.com.' },
  { key: 'api_key', label: 'API Key', type: 'password', autoComplete: 'off', hint: 'Shown once beside the API ID when you create it; copy both then. The key signs in without the 2FA code prompt.' },
]);

// WHERE THE KEY COMES FROM (2026-10-07; Darrell, on his phone at my.wyze.com:
// "Not finding an api key... again... is this best for elderly users?"). The
// key is not on my.wyze.com and not in the Wyze app: it is made once on the
// Wyze Developer API Console, which Wyze's own article names (and go2rtc's
// Wyze README points to the same article). The form links straight there and
// says so, so nobody hunts. This is a ONE-TIME STEWARD step: the person who
// owns the Wyze account types it once; every other family member only opens
// the Cameras tab. go2rtc's Wyze sign-in requires the key (verified in its
// source: "api_key and api_id required"), so the step cannot be removed, only
// made plain.
export const WYZE_API_KEY_HELP_URL = 'https://support.wyze.com/hc/en-us/articles/16129834216731';
export const WYZE_API_KEY_STEPS = Object.freeze([
  'Open the Wyze API key page (the link below) and sign in with the same Wyze email and password.',
  'Press Create an API Key and give it any name, like PoeTech.',
  'Copy the API ID and the API Key it shows. The key is shown once.',
  'Come back here, fill in the four boxes, press Sign in and add my cameras.',
]);

/** Pure: which fields are missing, before anything is sent. */
export function validateWyzeSetup(fields) {
  const f = fields || {};
  const missing = WYZE_FIELDS.filter((d) => !String(f[d.key] || '').trim()).map((d) => d.key);
  if (missing.length) return { ok: false, missing, message: `Fill in ${missing.map((k) => WYZE_FIELDS.find((d) => d.key === k).label).join(', ')}.` };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(f.email).trim())) return { ok: false, missing: ['email'], message: 'That does not look like an email address.' };
  return { ok: true, missing: [], message: '' };
}

/** Pure: the NAS's answer -> what the screen says. */
export function classifySetupResult({ status, body, networkError } = {}) {
  if (networkError) return { kind: 'unreachable', message: 'The NAS could not be reached. The cameras road is down or this device is offline.' };
  const b = body || {};
  if (status === 200 && b.ok) {
    const cams = Array.isArray(b.cameras) ? b.cameras : [];
    const added = Number(b.added) || 0;
    const existing = cams.filter((c) => c && c.existing).length;
    const unsupported = cams.filter((c) => c && c.dtls === false).map((c) => c.name);
    if (!cams.length) return { kind: 'ok', added: 0, cameras: [], unsupported: [], message: b.note ? `Signed in. ${b.note.charAt(0).toUpperCase()}${b.note.slice(1)}.` : 'Signed in. No cameras were listed.' };
    const parts = [`Signed in. ${added} camera${added === 1 ? '' : 's'} added`];
    if (existing) parts.push(`${existing} already here`);
    return { kind: 'ok', added, cameras: cams, unsupported, message: `${parts.join(', ')}.` };
  }
  if (status === 401 && b.error === 'wyze-sign-in-refused') return { kind: 'refused', message: 'Wyze refused the sign-in. Check the email, password, API ID and API Key; the key must be the one from the developer portal.' };
  if (status === 401) return { kind: 'unauthorized', message: 'This device\'s family key was refused by the NAS. Sign in to the app again, then retry.' };
  if (status === 400) return { kind: 'invalid', message: b.field ? `The NAS says ${String(b.field).replace('_', ' ')} is missing.` : 'The NAS could not read the form.' };
  if (status === 409) return { kind: 'busy', message: 'Another sign-in is already running on the NAS. Wait a moment and look again.' };
  if (status === 502) return { kind: 'unreachable', message: b.error === 'go2rtc-unreachable' ? 'The restreamer on the NAS is dark; the sign-in could not be handed to it.' : `Wyze could not be reached from the NAS${b.detail ? ` (${b.detail})` : ''}.` };
  return { kind: 'error', message: `The NAS answered HTTP ${status || '?'}.` };
}

/** POST the four values to the NAS; resolves to classifySetupResult's shape. Never throws. */
export async function setupWyze(fields, token, fetchImpl = globalThis.fetch) {
  const v = validateWyzeSetup(fields);
  if (!v.ok) return { kind: 'invalid', message: v.message };
  try {
    const res = await fetchWithTimeout(setupUrl(), {
      method: 'POST',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fields.email.trim(), password: fields.password, api_id: fields.api_id.trim(), api_key: fields.api_key.trim() }),
    }, SETUP_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    return classifySetupResult({ status: res.status, body });
  } catch {
    return classifySetupResult({ networkError: true });
  }
}

// The two his-hand steps, paste-ready, from anywhere (CLAUDE.md: every block
// starts with the cd; ASCII only; no && outside quotes; PS 5.x). These are the
// ONLY values the repo cannot supply: his Wyze sign-in (a secret value only he
// holds). Everything else self-deploys.
export const NAS_HOST = 'dpoe@192.168.1.26';
export const REPO_DIR = 'C:\\Users\\dpoe\\Kingdom-PWA-Node';

export function setupCommands() {
  const cd = `cd ${REPO_DIR}`;
  const place = `${cd}\nssh ${NAS_HOST} "sudo mkdir -p /volume1/PoeTech/secrets; printf 'WYZE_EMAIL=%s\\nWYZE_PASSWORD=%s\\nWYZE_API_ID=%s\\nWYZE_API_KEY=%s\\n' 'YOUR-WYZE-EMAIL' 'YOUR-WYZE-PASSWORD' 'YOUR-API-ID' 'YOUR-API-KEY' | sudo tee /volume1/PoeTech/secrets/wyze.env > /dev/null; sudo chmod 600 /volume1/PoeTech/secrets/wyze.env; echo placed"`;
  const tunnel = `${cd}\nssh -L 1984:127.0.0.1:1984 ${NAS_HOST}`;
  return {
    place: { title: 'Step 1 - place your Wyze sign-in on the NAS (once)', text: place, note: 'Replace the four values in quotes. The next services-sync cycle (within 15 minutes) adds the sign-in to the restreamer.' },
    tunnel: { title: 'Step 2 - load the cameras (once)', text: tunnel, note: 'Leave the window open, open http://localhost:1984 in the browser, choose Add > Wyze, pick the cameras. Close the window when done; the cameras appear here within seconds.' },
  };
}

// Only ASCII leaves for the clipboard (the .ps1 / paste rule).
export function isAscii(s) {
  for (const ch of String(s)) {
    const n = ch.charCodeAt(0);
    if (n === 9 || n === 10 || n === 13) continue;
    if (n < 32 || n > 126) return false;
  }
  return true;
}
