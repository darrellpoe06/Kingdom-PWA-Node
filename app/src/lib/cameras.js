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
export function restartUrl() { return `${CAMS_BASE}/restart`; }
export function whyUrl(id) { return `${CAMS_BASE}/why/${encodeURIComponent(id)}`; }
export function recordingUrl() { return `${CAMS_BASE}/recording`; }
export function recListUrl(id) { return `${CAMS_BASE}/rec/${encodeURIComponent(id)}`; }
export function recClipUrl(id, name, ticket) { return `${CAMS_BASE}/rec/${encodeURIComponent(id)}/${encodeURIComponent(name)}?t=${encodeURIComponent(ticket || '')}`; }
export const RESTART_TIMEOUT_MS = 15000;
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

// Which live road a device gets. Progressive MP4 is the default everywhere:
// one HTTP stream, no playlist polling, no session to expire. HLS is used
// ONLY where MP4 live cannot play at all: Apple's engines (Safari, every iOS
// browser, which must use WebKit). Measured 2026-10-07 (DR-0776): Samsung
// Internet answers 'maybe' to HLS and its native player then ended the view
// at 6 s and at 28 s with no NAS reason, while MP4 ran. The earlier rule
// ("ask the device, not the user agent") stands for CAN-play; which road is
// RELIABLE is answered by the one engine family that has no MP4-live choice.
export function pickLiveMode(canPlayType, userAgent = null) {
  const ua = String(userAgent != null ? userAgent : (typeof navigator !== 'undefined' && navigator.userAgent) || '');
  const apple = /iPhone|iPad|iPod/i.test(ua) || (/Safari\//.test(ua) && !/Chrome\/|Chromium\/|CriOS\/|FxiOS\/|Edg\/|SamsungBrowser\/|OPR\//.test(ua) && /Macintosh/.test(ua));
  if (!apple) return 'mp4';
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
  { id: 'wyze',    label: 'Wyze',        how: 'Signed in once, here in this tab (Sign in to Wyze once); the NAS keeps the account and each camera becomes one wyze:// line, the same P2P road tinyCam and docker-wyze-bridge use. Needs DTLS firmware; Gwell models (Cam OG, Pan v4, Floodlight Pro) are not yet supported.' },
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
  { key: 'password', label: 'Wyze password', type: 'password', autoComplete: 'current-password', hint: 'Used once to sign in; the NAS keeps it. Kept on this device only until the NAS accepts it.' },
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
// THE DRAFT SURVIVES A RELOAD (2026-10-07; Darrell, after the app redeployed
// under him with four typed values and the NAS's 404 still on screen: "Why am
// I needing to redo this?!"). The form kept its values only in React state,
// so a deploy, a tab reload or a PWA relaunch erased them before the NAS ever
// accepted them. Now the draft is kept on THIS device (the same storage that
// already holds the family key, a higher-value secret) until the NAS says ok,
// then erased; Clear erases it by hand. Never sent anywhere but the NAS.
export const WYZE_DRAFT_KEY = 'poetech.cameras.wyze-draft.v1';
const EMPTY_WYZE = Object.freeze({ email: '', password: '', api_id: '', api_key: '' });
function storageOf(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}
export function loadWyzeDraft(storage = null) {
  const st = storageOf(storage);
  if (!st) return { ...EMPTY_WYZE };
  try {
    const raw = st.getItem(WYZE_DRAFT_KEY);
    const d = raw ? JSON.parse(raw) : null;
    const out = { ...EMPTY_WYZE };
    if (d && typeof d === 'object') for (const k of Object.keys(EMPTY_WYZE)) if (typeof d[k] === 'string') out[k] = d[k];
    return out;
  } catch { return { ...EMPTY_WYZE }; }
}
export function saveWyzeDraft(fields, storage = null) {
  const st = storageOf(storage);
  if (!st) return false;
  try {
    const d = {};
    for (const k of Object.keys(EMPTY_WYZE)) d[k] = typeof fields[k] === 'string' ? fields[k] : '';
    if (!Object.values(d).some(Boolean)) { st.removeItem(WYZE_DRAFT_KEY); return true; }
    st.setItem(WYZE_DRAFT_KEY, JSON.stringify(d));
    return true;
  } catch { return false; }
}
export function clearWyzeDraft(storage = null) {
  const st = storageOf(storage);
  if (!st) return;
  try { st.removeItem(WYZE_DRAFT_KEY); } catch { /* fine */ }
}

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

// THE SERVICE SAYS WHETHER IT RUNS ITS OWN CODE (DR-0772). /health names the
// sha of the code that is serving (`forwarder`) and the sha of the file on the
// NAS disk (`on_disk`). Equal: current. Different: the running process is
// behind the file (the 2026-10-07 hour of 404s), and ONE button fixes it from
// the app. Either missing: an older forwarder that cannot say -- 'unknown',
// never a guess.
export function serviceCodeState(health) {
  const running = health && typeof health.forwarder === 'string' ? health.forwarder : '';
  const onDisk = health && typeof health.on_disk === 'string' ? health.on_disk : '';
  if (!running || !onDisk) return 'unknown';
  return running === onDisk ? 'current' : 'behind';
}

export function classifyRestartResult({ status, body, networkError } = {}) {
  if (networkError) return { kind: 'unreachable', message: 'The camera road did not answer. Nothing was restarted.' };
  const err = body && typeof body.error === 'string' ? body.error : '';
  if (status === 200 && body && body.ok) {
    return {
      kind: 'ok',
      changed: body.changed === true,
      message: body.changed === true
        ? 'Restarting the camera service on the newer code. It is back in about ten seconds; this screen checks again on its own.'
        : 'Restarting the camera service. It is back in about ten seconds; this screen checks again on its own.',
    };
  }
  if (status === 429) return { kind: 'too-soon', message: `The service was restarted moments ago. Try again in ${Number.isFinite(Number(body && body.retry_in)) ? body.retry_in : 60} seconds.` };
  if (status === 401) return { kind: 'unauthorized', message: 'The family key on this device was refused. Paste the current key again (Admin > NAS photos).' };
  if (status === 404) return { kind: 'old-service', message: 'The NAS is running an older camera service that cannot restart itself yet. It updates itself within 15 minutes of a merge.' };
  return { kind: 'error', message: `The camera road answered HTTP ${status}${err ? ` (${err})` : ''}. Nothing was restarted.` };
}

export async function restartService(token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(restartUrl(), { method: 'POST', headers: authHeaders(token) }, RESTART_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    return classifyRestartResult({ status: r.status, body });
  } catch {
    return classifyRestartResult({ networkError: true });
  }
}

// =============================================================================
// SIGHT, NOT A STATUS (DR-0774; Darrell 2026-10-07: "the feed needs to be able
// to give us sight", "I need multiple views... different cameras together",
// "Let's not build in undermining constraints"). What follows is the app's
// half of that: the frame sweep runs several cameras at once and stops
// hammering a camera that just failed; a blank tile names its REAL cause in
// plain words and can ask the NAS why; a live view reconnects itself instead
// of going black; and a wall shows several live cameras together.
// =============================================================================
export const SNAP_CONCURRENCY = 3;            // frames in flight from this device at once (the NAS allows 6)
export const SNAP_RETRY_FAILED_MS = 30000;    // a camera that just failed is tried again after this, not every sweep
export const LIVE_RECONNECT_MAX = 6;          // a live view that ends on its own is re-opened this many times...
export const LIVE_RECONNECT_DELAY_MS = 1500;  // ...this soon; then it offers Resume
export const WALL_KEY = 'poetech.cameras.wall.v1';
export const WALL_MAX_DEFAULT = 6;            // the wall's size when the NAS does not say (its max_live wins)

/** Run `fn` over `items` with at most `limit` in flight; order of start preserved. */
export async function runLimited(items, limit, fn) {
  const queue = [...items];
  const n = Math.max(1, Math.min(limit, queue.length));
  const workers = Array.from({ length: n }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await fn(item);
    }
  });
  await Promise.all(workers);
}

/** True when a frame record says this camera failed recently enough to leave it alone this sweep. */
export function skipFailedFrame(frame, now = Date.now(), retryMs = SNAP_RETRY_FAILED_MS) {
  return !!(frame && frame.error && Number.isFinite(frame.errorAt) && now - frame.errorAt < retryMs);
}

/** go2rtc's own error text -> plain words, with the class it belongs to. */
export function humanizeCameraError(text, host = '') {
  const t = String(text || '');
  const where = host ? ` (the NAS tried ${host})` : '';
  if (/i\/o timeout|connect failed|no route to host|network is unreachable|connection refused|deadline exceeded/i.test(t)) {
    return { kind: 'other-network', text: `The NAS cannot reach this camera on its own network${where}. The restreamer speaks to cameras on the network it sits on; a camera at the other house needs a relay or a box there.` };
  }
  if (/only DTLS|dtls/i.test(t)) return { kind: 'firmware', text: 'This camera\'s firmware has no DTLS, so the restreamer cannot talk to it yet. A firmware update from the Wyze app may add it.' };
  if (/av login failed|K10001|K10002|auth|unauthori[sz]ed|enr/i.test(t)) return { kind: 'auth', text: 'The camera refused the restreamer\'s sign-in. Redo the Wyze sign-in in this tab so the keys are fresh.' };
  if (/no sources|not found|404/i.test(t)) return { kind: 'missing', text: 'The restreamer has no stream by this name any more. Refresh the list.' };
  if (/no answer in \d+ s|timeout/i.test(t)) return { kind: 'asleep', text: `${t.replace(/^wyze:\s*/i, '')}. The camera may be asleep, powered off, or at the other house.` };
  if (!t) return { kind: 'unknown', text: 'The restreamer gave no reason.' };
  return { kind: 'unknown', text: t.replace(/^wyze:\s*/i, '') };
}

/** A failed /snap answer (status + JSON body) -> the short reason a tile shows. */
export function classifySnapError({ status, body } = {}) {
  const err = body && typeof body.error === 'string' ? body.error : '';
  if (status === 504 || err === 'frame-timeout') return `no answer in ${Number.isFinite(Number(body && body.after_s)) ? body.after_s : 12} s`;
  if (err === 'resting') return `resting ${Math.max(1, Math.round((Number(body && body.retry_in) || 300) / 60))} min after repeated misses${body && body.detail ? ` (${humanizeCameraError(body.detail).kind === 'other-network' ? 'NAS cannot reach it on its network' : String(body.detail).replace(/^wyze:\s*/i, '').slice(0, 60)})` : ''}`;
  if (status === 503 || err === 'busy') return 'NAS busy, next sweep';
  if (status === 401) return 'family key refused';
  if (err === 'go2rtc-unreachable') return 'restreamer dark';
  if (err === 'no-frame') {
    const h = humanizeCameraError(body && body.detail);
    return h.kind === 'unknown' && body && body.detail ? String(body.detail).slice(0, 80) : h.kind === 'other-network' ? 'NAS cannot reach it on its network' : h.kind === 'firmware' ? 'firmware has no DTLS' : h.kind === 'auth' ? 'camera refused the sign-in' : h.kind === 'missing' ? 'no such stream now' : `HTTP ${status}`;
  }
  return `HTTP ${status || 0}`;
}

/** The NAS's /why answer -> what the person reads. */
export function explainWhy(why) {
  if (!why || typeof why !== 'object') return { kind: 'unknown', headline: 'No answer from the NAS.', lines: [] };
  const host = Array.isArray(why.producers) && why.producers[0] && why.producers[0].host ? why.producers[0].host : '';
  const state = Array.isArray(why.producers) && why.producers[0] && why.producers[0].state ? String(why.producers[0].state) : '';
  const probe = why.probe || {};
  const lines = [];
  if (host) lines.push(`Camera address the NAS uses: ${host}${state ? ` · restreamer state: ${state}` : ''}`);
  if (probe.ok) {
    lines.push(`A fresh frame just came back in ${Number.isFinite(probe.ms) ? probe.ms : '?'} ms.`);
    return { kind: 'ok', headline: 'This camera answers now. The tile fills on the next sweep.', lines, log: why.log || [] };
  }
  const h = humanizeCameraError(probe.error || (why.log || []).find((l) => /error|failed|timeout/i.test(l)) || '', host);
  if (probe.timeout) lines.push(`The NAS asked for one frame and heard nothing for ${Math.round((probe.ms || 0) / 1000)} s.`);
  else if (probe.error) lines.push(`The restreamer said: ${probe.error}`);
  return { kind: h.kind, headline: h.text, lines, log: why.log || [] };
}

export async function fetchWhy(id, token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(whyUrl(id), { headers: authHeaders(token) }, 30000, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status !== 200) return { ok: false, status: r.status, explanation: { kind: 'unknown', headline: r.status === 404 ? 'The NAS runs an older camera service that cannot explain yet. It updates itself within 15 minutes of a merge.' : `The camera road answered HTTP ${r.status}.`, lines: [], log: [] } };
    return { ok: true, status: 200, why: body, explanation: explainWhy(body) };
  } catch {
    return { ok: false, status: 0, explanation: { kind: 'unknown', headline: 'The camera road did not answer.', lines: [], log: [] } };
  }
}

/** The wall (which cameras to watch together), kept per device. */
export function loadWall(storage = null) {
  const st = storage || (() => { try { return globalThis.localStorage || null; } catch { return null; } })();
  if (!st) return [];
  try {
    const raw = st.getItem(WALL_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string' && CAMERA_ID.test(x)) : [];
  } catch { return []; }
}
export function saveWall(ids, storage = null) {
  const st = storage || (() => { try { return globalThis.localStorage || null; } catch { return null; } })();
  if (!st) return false;
  try {
    if (!ids || !ids.length) st.removeItem(WALL_KEY); else st.setItem(WALL_KEY, JSON.stringify(ids));
    return true;
  } catch { return false; }
}
export function wallLimit(health) {
  const n = Number(health && health.max_live);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 12) : WALL_MAX_DEFAULT;
}

// =============================================================================
// RECORDED LOOPS TO THE NAS (DR-0775; Darrell 2026-10-07: "Recorded loops for
// however long I want backed up to the nas?"). The recorder service on the
// NAS copies each enabled camera into ten-minute clips; the owner chooses a
// retention per camera and one disk budget; the forwarder serves the settings
// (GET/PUT /recording), the clips (GET /rec/<id>) and playback with Range.
// Everything shown here is read from the recorder's own status file, never
// painted.
// =============================================================================
export const RETENTION_CHOICES = Object.freeze([1, 3, 7, 14, 30, 90, 180, 365]);
export const CLIP_TICKET_TTL = 3600;
export const RECORDING_TIMEOUT_MS = 15000;

export async function fetchRecording(token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(recordingUrl(), { headers: authHeaders(token) }, RECORDING_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status === 404 || r.status === 501) return { ok: false, status: r.status, message: 'The NAS runs an older camera service without the recorder yet. It updates itself within 15 minutes of a merge.' };
    if (r.status !== 200 || !body) return { ok: false, status: r.status, message: `The camera road answered HTTP ${r.status}.` };
    return { ok: true, status: 200, config: body.config || { disk_budget_gb: 200, cameras: {} }, recStatus: body.status || null, configError: body.config_error || null, root: body.root || '' };
  } catch {
    return { ok: false, status: 0, message: 'The camera road did not answer.' };
  }
}

export async function saveRecording(config, token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(recordingUrl(), { method: 'PUT', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify(config) }, RECORDING_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status === 200 && body && body.ok) return { ok: true, config: body.config };
    if (r.status === 400 && body && body.error === 'unknown-camera') return { ok: false, message: `The restreamer has no camera named ${(body.cameras || []).join(', ')}. Refresh the list.` };
    if (r.status === 401) return { ok: false, message: 'The family key on this device was refused.' };
    if (r.status === 404 || r.status === 501) return { ok: false, message: 'The NAS runs an older camera service without the recorder yet.' };
    return { ok: false, message: `The camera road answered HTTP ${r.status}${body && body.error ? ` (${body.error})` : ''}. Nothing was changed.` };
  } catch {
    return { ok: false, message: 'The camera road did not answer. Nothing was changed.' };
  }
}

export async function fetchClips(id, token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(recListUrl(id), { headers: authHeaders(token) }, RECORDING_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status !== 200 || !body) return { ok: false, status: r.status, clips: [] };
    const clips = Array.isArray(body.clips) ? body.clips.filter((c) => c && typeof c.name === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.mp4$/.test(c.name)) : [];
    return { ok: true, status: 200, clips };
  } catch {
    return { ok: false, status: 0, clips: [] };
  }
}

/** Clip name 2026-10-07T06-40-00.mp4 -> { day: '2026-10-07', time: '06:40' }. */
export function clipParts(name) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})\.mp4$/.exec(String(name || ''));
  return m ? { day: m[1], time: `${m[2]}:${m[3]}`, seconds: `${m[2]}:${m[3]}:${m[4]}` } : { day: '', time: '', seconds: '' };
}

/** [{name,bytes,start}] -> [{day, clips:[...newest first], bytes}] newest day first. */
export function groupClipsByDay(clips) {
  const days = new Map();
  for (const c of clips || []) {
    const { day } = clipParts(c.name);
    if (!day) continue;
    if (!days.has(day)) days.set(day, { day, clips: [], bytes: 0 });
    const d = days.get(day);
    d.clips.push(c);
    d.bytes += Number(c.bytes) || 0;
  }
  const out = [...days.values()].sort((a, b) => (a.day < b.day ? 1 : -1));
  for (const d of out) d.clips.sort((a, b) => (b.start || 0) - (a.start || 0));
  return out;
}

/**
 * What the disk is doing, measured from the recorder's status: bytes a day
 * per recording camera (from its oldest and newest clip), days the budget
 * holds at that rate, and the plain line the tab shows. Nothing is estimated
 * from a nominal bitrate; a camera with under an hour of clips says so.
 */
export function diskForecast(recStatus) {
  if (!recStatus || typeof recStatus !== 'object') return null;
  const cams = recStatus.cameras || {};
  let perDay = 0;
  let measured = 0;
  let recording = 0;
  for (const c of Object.values(cams)) {
    if (!c) continue;
    if (c.recording) recording += 1;
    const span = (Number(c.newest) || 0) - (Number(c.oldest) || 0);
    if (c.recording && span >= 3600 && Number(c.bytes) > 0) {
      perDay += (Number(c.bytes) / span) * 86400;
      measured += 1;
    }
  }
  const budget = (Number(recStatus.disk_budget_gb) || 0) * 1e9;
  const total = Number(recStatus.total_bytes) || 0;
  const free = Number.isFinite(Number(recStatus.disk_free_bytes)) ? Number(recStatus.disk_free_bytes) : null;
  const daysAtBudget = perDay > 0 ? budget / perDay : null;
  return { recording, measured, bytesPerDay: perDay, total, budget, free, daysAtBudget,
    line: recording === 0 ? 'No camera is recording.'
      : measured === 0 ? `${recording} recording · under an hour of clips so far, the rate is not measured yet.`
      : `${recording} recording · about ${formatBytes(perDay)} a day${measured < recording ? ` (measured on ${measured})` : ''} · the ${Math.round(budget / 1e9)} GB budget holds about ${Math.max(1, Math.round(daysAtBudget))} day${Math.round(daysAtBudget) === 1 ? '' : 's'} at this rate` };
}

// LIVE IN EVERY TILE (DR-0776; Darrell 2026-10-07: "Live views... all the
// time... I should see the seconds moving and wind blowing"). The tiles are
// live players by default; a snapshot is the fallback for a camera that has
// no picture yet (so its tile can still show the reason and notice recovery).
// The choice is kept per device. The NAS's live cap bounds how many tiles
// may be live at once; the rest fall back to snapshots and the tab says so.
export const LIVE_TILES_KEY = 'poetech.cameras.live-tiles.v1';
export function loadLiveTiles(storage = null) {
  const st = storage || (() => { try { return globalThis.localStorage || null; } catch { return null; } })();
  if (!st) return true;
  try { const v = st.getItem(LIVE_TILES_KEY); return v == null ? true : v === '1'; } catch { return true; }
}
export function saveLiveTiles(on, storage = null) {
  const st = storage || (() => { try { return globalThis.localStorage || null; } catch { return null; } })();
  if (!st) return false;
  try { st.setItem(LIVE_TILES_KEY, on ? '1' : '0'); return true; } catch { return false; }
}
/** How many tiles may be live at once given the NAS's cap and what the wall already uses. */
export function liveTileBudget(health, wallCount = 0) {
  const cap = Number(health && health.max_live);
  const n = Number.isFinite(cap) && cap > 0 ? cap : 32;
  return Math.max(0, n - (Number(wallCount) || 0));
}
/** The live traffic line from /health: open streams and measured bits per second through the Funnel. */
export function liveTrafficLine(health) {
  if (!health || !Number.isFinite(Number(health.live_bytes_per_s))) return '';
  const bps = Number(health.live_bytes_per_s) * 8;
  const open = Number(health.live_open) || 0;
  const rate = bps >= 1e6 ? `${(bps / 1e6).toFixed(1)} Mbit/s` : bps >= 1e3 ? `${Math.round(bps / 1e3)} kbit/s` : `${Math.round(bps)} bit/s`;
  return `${open} live stream${open === 1 ? '' : 's'} · ${rate} through the Funnel`;
}

// =============================================================================
// THE DOOR OPENS WITHOUT THE VIDEO (DR-0777; Darrell 2026-10-07: "I open the
// garage doors through the camera that supports the switch... I want that
// functionality inside the PoeTech too", and: "sometimes I don't need to see
// to open the door... it still has to wait for video... why... I want a button
// for garage that is independent of the video streaming being available").
// The Wyze app does not open the door through the video either: it sends one
// cloud action to the camera's device record. The NAS does the same through
// Wyze's own cloud (wyze_cloud.py) with the sign-in it kept; the button here
// needs no ticket, no stream, no frame. A tap is one POST; the answer is said.
// =============================================================================
export function devicesUrl() { return `${CAMS_BASE}/devices`; }
export function actionUrl() { return `${CAMS_BASE}/action`; }
export function setupAgainUrl() { return `${CAMS_BASE}/setup/wyze/again`; }
export const ACTION_TIMEOUT_MS = 20000;
export const ACTION_REARM_MS = 3000; // the NAS refuses a second trigger inside its window; the button rests as long

// A nickname -> the stream id the NAS gives it (the same rule as
// cams_forwarder.stream_name_for, so a device pairs with its tile).
export function streamNameFor(nickname) {
  const base = String(nickname || '').trim().replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/^[_.-]+|[_.-]+$/g, '').toLowerCase().slice(0, 48);
  return base || 'camera';
}

export function parseDevices(json) {
  const list = json && Array.isArray(json.devices) ? json.devices : [];
  return list
    .filter((d) => d && typeof d.mac === 'string' && d.mac)
    .map((d) => ({
      mac: d.mac,
      nickname: String(d.nickname || d.mac),
      model: String(d.model || ''),
      online: d.online === true,
      garage: d.garage === true,
      stream: typeof d.stream === 'string' && d.stream ? d.stream : streamNameFor(d.nickname),
      actions: Array.isArray(d.actions) ? d.actions.filter((a) => typeof a === 'string') : [],
    }));
}

export function classifyDevicesResult({ status, body, networkError } = {}) {
  if (networkError) return { kind: 'unreachable', devices: [], message: 'The camera road did not answer.' };
  const err = body && typeof body.error === 'string' ? body.error : '';
  if (status === 200) return { kind: 'ok', devices: parseDevices(body), message: '' };
  if (status === 503 && err === 'no-credentials') return { kind: 'no-credentials', devices: [], message: 'The NAS has no Wyze sign-in kept yet. Sign in once in this tab and the doors appear here.' };
  if (status === 401 && err === 'wyze-sign-in-refused') return { kind: 'refused', devices: [], message: 'Wyze refused the kept sign-in. Sign in again once in this tab.' };
  if (status === 401) return { kind: 'unauthorized', devices: [], message: 'The family key on this device was refused.' };
  if (status === 403) return { kind: 'no-actions', devices: [], message: 'This access does not include the doors.' };
  if (status === 404) return { kind: 'old-service', devices: [], message: 'The NAS is running an older camera service without the doors yet. It updates itself within 15 minutes of a merge.' };
  if (status === 502 || status === 503) return { kind: 'wyze-down', devices: [], message: `Wyze's cloud did not answer the NAS${err ? ` (${err})` : ''}.` };
  return { kind: 'error', devices: [], message: `The camera road answered HTTP ${status}${err ? ` (${err})` : ''}.` };
}

export async function fetchDevices(token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(devicesUrl(), { headers: authHeaders(token) }, ACTION_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    return classifyDevicesResult({ status: r.status, body });
  } catch {
    return classifyDevicesResult({ networkError: true });
  }
}

export function classifyActionResult({ status, body, networkError } = {}, action = 'garage') {
  const what = action === 'garage' ? 'The door was told to move' : `Sent: ${action.replace(/_/g, ' ')}`;
  if (networkError) return { kind: 'unreachable', message: 'The camera road did not answer. Nothing was sent to the door.' };
  const err = body && typeof body.error === 'string' ? body.error : '';
  if (status === 200 && body && body.ok) return { kind: 'ok', message: `${what}. Wyze accepted it${body.nickname ? ` for ${body.nickname}` : ''}.` };
  if (status === 429) return { kind: 'too-soon', message: `Sent a moment ago. The door is never told twice at once; try again in ${Number.isFinite(Number(body && body.retry_in)) ? body.retry_in : 3} s.` };
  if (status === 409) return { kind: 'offline', message: 'Wyze says this camera is offline, so its door cannot be reached right now.' };
  if (status === 503 && err === 'no-credentials') return { kind: 'no-credentials', message: 'The NAS has no Wyze sign-in kept. Sign in once in this tab.' };
  if (status === 401 && err === 'wyze-sign-in-refused') return { kind: 'refused', message: 'Wyze refused the kept sign-in. Sign in again once in this tab.' };
  if (status === 401) return { kind: 'unauthorized', message: 'The family key on this device was refused.' };
  if (status === 400 && err === 'no-garage-controller') return { kind: 'no-controller', message: 'This camera has no garage controller on it.' };
  if (status === 404) return { kind: 'old-service', message: 'The NAS is running an older camera service without the doors yet.' };
  return { kind: 'error', message: `Wyze did not take it: HTTP ${status}${err ? ` (${err})` : ''}.` };
}

export async function runDeviceAction(mac, action, token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(actionUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ mac, action }) }, ACTION_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    return classifyActionResult({ status: r.status, body }, action);
  } catch {
    return classifyActionResult({ networkError: true }, action);
  }
}

// THE SIGN-IN IS NEVER TYPED TWICE (Darrell 2026-10-07: "I better not need to
// resign in!"). When the restreamer comes back with no cameras but the NAS
// kept the sign-in, one press (or the NAS by itself) re-adds them.
export async function setupWyzeAgain(token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(setupAgainUrl(), { method: 'POST', headers: authHeaders(token) }, SETUP_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status === 503) return { kind: 'no-credentials', cameras: [], message: 'The NAS has no Wyze sign-in kept yet, so the four values are needed once below.' };
    if (r.status === 404) return { kind: 'old-service', cameras: [], message: 'The NAS is running an older camera service that cannot re-add on its own yet.' };
    return classifySetupResult({ status: r.status, body });
  } catch {
    return classifySetupResult({ networkError: true });
  }
}

export function wyzeKept(health) {
  return !!(health && health.wyze_cloud === 'ready');
}

// Pair each garage device with its tile, if the tile exists.
export function garagesFor(devices, cameras) {
  const ids = new Set((cameras || []).map((c) => c.id));
  return (devices || []).filter((d) => d.garage).map((d) => ({ ...d, cameraId: ids.has(d.stream) ? d.stream : '' }));
}

// =============================================================================
// ACCESS IS GIVEN AND TAKEN BACK, NEVER A PASSWORD (DR-0778; Darrell
// 2026-10-07: "My wife and family should also have access to my cameras...
// unless I say no... One time setup for owners and they can give access to
// who they want.... inside or out", and: "we never give a password just
// access and no access whenever the owner wants to"). The owner's device
// (the family bearer) mints a per-person GRANT on the NAS: a name, which
// cameras, how long (or until taken back), doors or not. The grant is a link;
// opening it on a phone gives THAT device access, nothing typed. The holder's
// device sends the grant as its bearer; the NAS admits it to its cameras only.
// Revoke here and the link dies on its next request.
// =============================================================================
export const GRANT_KEY = 'poetech.cameras.grant.v1';
export const GRANT_PARAM = 'cams-grant';
export const GRANT_TOKEN = /^g\.[a-f0-9]{12}\.[a-f0-9]{32}$/;
export const GRANT_DAYS_CHOICES = Object.freeze([0, 1, 7, 30, 365]);
export function grantsUrl() { return `${CAMS_BASE}/grants`; }
export function grantRevokeUrl(id) { return `${CAMS_BASE}/grants/${encodeURIComponent(id)}/revoke`; }

function grantStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

export function grantToken(storage = null) {
  const st = grantStorage(storage);
  try { const v = (st && st.getItem(GRANT_KEY)) || ''; return GRANT_TOKEN.test(v) ? v : ''; } catch { return ''; }
}

export function saveGrantToken(token, storage = null) {
  const st = grantStorage(storage);
  try {
    if (!token) st.removeItem(GRANT_KEY); else if (GRANT_TOKEN.test(token)) st.setItem(GRANT_KEY, token); else return false;
    return true;
  } catch { return false; }
}

// On boot: a `?cams-grant=` in the address is stored on this device and taken
// out of the address (so a shared screenshot or history entry does not carry
// it). Returns the token adopted, or ''.
export function adoptGrantFromUrl(location, storage = null, history = null) {
  try {
    const url = new URL(String(location && location.href ? location.href : location));
    const tok = url.searchParams.get(GRANT_PARAM) || '';
    if (!tok) return '';
    if (!GRANT_TOKEN.test(tok)) return '';
    saveGrantToken(tok, storage);
    url.searchParams.delete(GRANT_PARAM);
    if (history && typeof history.replaceState === 'function') history.replaceState(null, '', url.pathname + (url.search || '') + url.hash);
    return tok;
  } catch { return ''; }
}

// The credential this device sends: the family bearer (owner) first, a grant second.
export function cameraCredential({ bridge = '', storage = null } = {}) {
  if (bridge) return { token: bridge, kind: 'owner' };
  const g = grantToken(storage);
  if (g) return { token: g, kind: 'grant' };
  return { token: '', kind: 'none' };
}

export function parseGrants(json) {
  const list = json && Array.isArray(json.grants) ? json.grants : [];
  return list.filter((g) => g && typeof g.id === 'string').map((g) => ({
    id: g.id, name: String(g.name || ''), cameras: g.cameras === '*' ? '*' : (Array.isArray(g.cameras) ? g.cameras.filter((c) => typeof c === 'string') : []),
    actions: g.actions === true, created: Number(g.created) || 0, expires: Number(g.expires) || 0, revoked: Number(g.revoked) || 0, lastUsed: Number(g.last_used) || 0,
  }));
}

export function grantState(g, nowMs = Date.now()) {
  if (g.revoked) return 'revoked';
  if (g.expires && nowMs / 1000 >= g.expires) return 'expired';
  return 'live';
}

export function grantLine(g, nowMs = Date.now()) {
  const cams = g.cameras === '*' ? 'every camera' : `${g.cameras.length} camera${g.cameras.length === 1 ? '' : 's'}`;
  const until = g.expires ? `until ${new Date(g.expires * 1000).toLocaleDateString()}` : 'until taken back';
  const doors = g.actions ? ' · doors too' : '';
  const used = g.lastUsed ? ` · last used ${formatAge(Math.max(0, nowMs - g.lastUsed * 1000))}` : ' · never used yet';
  const st = grantState(g, nowMs);
  return `${cams} · ${until}${doors}${st === 'live' ? used : ` · ${st}`}`;
}

export function grantLink(token, origin = '', linkPath = '/poetech-app/?view=cameras&cams-grant=') {
  return `${origin}${linkPath}${encodeURIComponent(token)}`;
}

export async function fetchGrants(token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(grantsUrl(), { headers: authHeaders(token) }, FETCH_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status === 200) return { ok: true, grants: parseGrants(body), linkPath: body && typeof body.link_path === 'string' ? body.link_path : undefined, message: '' };
    if (r.status === 404) return { ok: false, grants: [], message: 'The NAS is running an older camera service without access grants yet. It updates itself within 15 minutes of a merge.' };
    if (r.status === 401) return { ok: false, grants: [], message: 'Only the owner\'s device can see who has access.' };
    return { ok: false, grants: [], message: `The camera road answered HTTP ${r.status}.` };
  } catch {
    return { ok: false, grants: [], message: 'The camera road did not answer.' };
  }
}

export async function createGrant({ name, cameras = '*', days = 0, actions = false }, token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(grantsUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ name, cameras, days, actions }) }, FETCH_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    const err = body && typeof body.error === 'string' ? body.error : '';
    if (r.status === 200 && body && body.token) return { ok: true, id: body.id, token: body.token, linkPath: body.link_path || undefined, message: `Access made for ${name}. Share the link below; it is shown once.` };
    if (r.status === 400) return { ok: false, message: err === 'missing-name' ? 'Give the access a name (whose it is).' : err === 'bad-cameras' ? 'Pick at least one camera, or every camera.' : `The NAS refused it (${err || 'bad request'}).` };
    if (r.status === 401) return { ok: false, message: 'Only the owner\'s device can give access.' };
    if (r.status === 404) return { ok: false, message: 'The NAS is running an older camera service without access grants yet.' };
    return { ok: false, message: `The camera road answered HTTP ${r.status}${err ? ` (${err})` : ''}.` };
  } catch {
    return { ok: false, message: 'The camera road did not answer. Nothing was made.' };
  }
}

export async function revokeGrant(id, token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(grantRevokeUrl(id), { method: 'POST', headers: authHeaders(token) }, FETCH_TIMEOUT_MS, fetchImpl);
    if (r.status === 200) return { ok: true, message: 'Taken back. That link no longer opens anything.' };
    if (r.status === 404) return { ok: false, message: 'That access was not found on the NAS.' };
    if (r.status === 401) return { ok: false, message: 'Only the owner\'s device can take access back.' };
    return { ok: false, message: `The camera road answered HTTP ${r.status}.` };
  } catch {
    return { ok: false, message: 'The camera road did not answer. Nothing changed.' };
  }
}
