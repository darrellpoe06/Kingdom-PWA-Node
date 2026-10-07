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
export function streamHealthUrl() { return `${CAMS_BASE}/streams/health`; }
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
      // The NAS keeps an H.264 twin for this camera (it sends only H.265; DR-0798).
      h264: c.h264 === true,
      // The NAS keeps an SD twin (the camera's own substream) for grids of tiles (DR-0799).
      sd: c.sd === true,
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

// =============================================================================
// A SCREEN PAIRS WITH THE OWNER'S PHONE (DR-0778; Darrell 2026-10-07, from the
// Firestick on the wall: "Even after logging into my PoeTech App on my
// Firestick... I have to log in.... I hate that!!! Fix it.... I also would
// like to use a qrcode to type into the Firestick"). The screen asks the NAS
// for a six-letter code, shows it as a QR and as letters, and polls. The
// owner opens the QR with the phone (or types the code into the Cameras tab)
// and approves it as a grant; the screen's next poll hands it the grant and
// the cameras open. Nothing is typed on the TV, ever.
// =============================================================================
export const PAIR_PARAM = 'cams-pair';
export const PAIR_CODE = /^[A-Z2-9]{6}$/;
export const PAIR_POLL_MS = 3000;
// The screen's poll cadence, readable at call time so a test can run it fast.
export const PAIR_TIMING = { pollMs: PAIR_POLL_MS };
export function pairUrl() { return `${CAMS_BASE}/pair`; }
export function pairStatusUrl(code, watch) { return `${CAMS_BASE}/pair/${encodeURIComponent(code)}?w=${encodeURIComponent(watch || '')}`; }
export function pairApproveUrl(code) { return `${CAMS_BASE}/pair/${encodeURIComponent(code)}/approve`; }
export function pairLink(code, origin = '', linkPath = '/poetech-app/?view=cameras&cams-pair=') { return `${origin}${linkPath}${encodeURIComponent(code)}`; }
export function normalizePairCode(raw) {
  const c = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/0/g, 'O').replace(/1/g, 'I');
  // 0/O and 1/I are not in the alphabet; a person reading a TV may still type them
  const fixed = c.replace(/O/g, '0').replace(/I/g, '1').replace(/0/g, 'O').replace(/1/g, 'I');
  return PAIR_CODE.test(fixed) ? fixed : '';
}
export function readPairParam(location) {
  try {
    const url = new URL(String(location && location.href ? location.href : location));
    return normalizePairCode(url.searchParams.get(PAIR_PARAM) || '');
  } catch { return ''; }
}
export function stripPairParam(location, history = null) {
  try {
    const url = new URL(String(location && location.href ? location.href : location));
    if (!url.searchParams.has(PAIR_PARAM)) return;
    url.searchParams.delete(PAIR_PARAM);
    if (history && typeof history.replaceState === 'function') history.replaceState(null, '', url.pathname + (url.search || '') + url.hash);
  } catch { /* fine */ }
}

export async function startPairing(fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(pairUrl(), { method: 'POST' }, FETCH_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status === 200 && body && PAIR_CODE.test(String(body.code || ''))) return { ok: true, code: body.code, watch: String(body.watch || ''), expiresIn: Number(body.expires_in) || 600, linkPath: typeof body.link_path === 'string' ? body.link_path : undefined };
    if (r.status === 429) return { ok: false, retry: true, message: 'The NAS is handing out codes as fast as it will; trying again in a moment.' };
    if (r.status === 404) return { ok: false, message: 'The NAS is running an older camera service that cannot pair a screen yet. It updates itself within 15 minutes of a merge.' };
    return { ok: false, message: `The camera road answered HTTP ${r.status}.` };
  } catch {
    return { ok: false, message: 'The camera road did not answer.' };
  }
}

export async function pollPairing(code, watch, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(pairStatusUrl(code, watch), {}, FETCH_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status === 200 && body && body.status === 'approved' && GRANT_TOKEN.test(String(body.token || ''))) return { status: 'approved', token: body.token };
    if (r.status === 200 && body && body.status === 'waiting') return { status: 'waiting' };
    if (r.status === 404) return { status: 'expired' };
    return { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

export async function approvePairing(code, { name, cameras = '*', days = 0, actions = false }, token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(pairApproveUrl(code), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ name, cameras, days, actions }) }, FETCH_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    const err = body && typeof body.error === 'string' ? body.error : '';
    if (r.status === 200 && body && body.ok) return { ok: true, message: `Done. The screen has its access as ${name}; it opens on its own within a few seconds.` };
    if (r.status === 404) return { ok: false, message: 'That code is not waiting: it expired, was already used, or was mistyped. Ask the screen for a fresh one.' };
    if (r.status === 401) return { ok: false, message: 'Only the owner\'s device can let a screen in.' };
    if (r.status === 400) return { ok: false, message: `The NAS refused it (${err || 'bad request'}).` };
    return { ok: false, message: `The camera road answered HTTP ${r.status}${err ? ` (${err})` : ''}.` };
  } catch {
    return { ok: false, message: 'The camera road did not answer. Nothing was approved.' };
  }
}


// =============================================================================
// THE LIVE ROAD IS CHOSEN FROM WHAT WORKED (Darrell 2026-10-07: "All options...
// HLS... what works consistently... or a mixture so we can choose what seems
// to be the best option at that time?"). A browser has exactly two live roads
// from the restreamer: progressive MP4 and HLS (RTSP and the camera's own IP
// are roads for apps like tinyCam, not for a browser). Frames every 5 s are
// the third, always-works road. This device remembers how each live road did
// (first picture, stalls, failures) and Auto picks the better record; the
// person can pin a road instead. A road that fails under Auto is swapped for
// the other on the next reconnect, so the mixture chooses itself.
// =============================================================================
export const LIVE_ROADS = Object.freeze(['auto', 'mp4', 'hls']);
export const LIVE_ROAD_KEY = 'poetech.cameras.live-road.v1';
export const LIVE_ROAD_STATS_KEY = 'poetech.cameras.live-road-stats.v1';
export function roadLabel(road) {
  return road === 'mp4' ? 'MP4' : road === 'hls' ? 'HLS' : 'Auto';
}
function roadStore(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}
export function loadLiveRoad(storage = null) {
  try { const v = roadStore(storage).getItem(LIVE_ROAD_KEY) || ''; return LIVE_ROADS.includes(v) ? v : 'auto'; } catch { return 'auto'; }
}
export function saveLiveRoad(road, storage = null) {
  if (!LIVE_ROADS.includes(road)) return false;
  try { roadStore(storage).setItem(LIVE_ROAD_KEY, road); return true; } catch { return false; }
}
export function loadRoadStats(storage = null) {
  try {
    const j = JSON.parse(roadStore(storage).getItem(LIVE_ROAD_STATS_KEY) || '{}');
    return j && typeof j === 'object' ? j : {};
  } catch { return {}; }
}
// One measured outcome for a road: {ok: boolean, firstFrameMs, stalls}.
export function recordRoadResult(mode, { ok, firstFrameMs = null, stalls = 0 } = {}, storage = null) {
  if (mode !== 'mp4' && mode !== 'hls') return null;
  const all = loadRoadStats(storage);
  const r = all[mode] || { tries: 0, ok: 0, failed: 0, firstFrameMs: [], stalls: 0 };
  r.tries += 1;
  if (ok) r.ok += 1; else r.failed += 1;
  if (Number.isFinite(firstFrameMs)) r.firstFrameMs = [...(r.firstFrameMs || []), Math.round(firstFrameMs)].slice(-10);
  r.stalls = (r.stalls || 0) + (Number(stalls) || 0);
  r.at = Date.now();
  all[mode] = r;
  try { roadStore(storage).setItem(LIVE_ROAD_STATS_KEY, JSON.stringify(all)); } catch { /* fine */ }
  return r;
}
export function roadScore(r) {
  if (!r || !r.tries) return null;
  const okRate = r.ok / r.tries;
  const ff = (r.firstFrameMs || []);
  const median = ff.length ? [...ff].sort((a, b) => a - b)[Math.floor(ff.length / 2)] : 5000;
  // success first, then speed to the first picture, then stalls per try
  return okRate * 100 - median / 1000 - (r.stalls / r.tries) * 2;
}
// Auto: the better measured road; with nothing measured, the device's default
// (pickLiveMode). A pinned road is itself. `avoid` is the road that just failed.
export function chooseLiveRoad({ pref = 'auto', stats = {}, canPlayType = null, userAgent = null, avoid = '' } = {}) {
  if (pref === 'mp4' || pref === 'hls') return pref;
  const base = pickLiveMode(canPlayType, userAgent);
  const other = base === 'mp4' ? 'hls' : 'mp4';
  if (avoid) return avoid === base ? other : base;
  const a = roadScore(stats[base]); const b = roadScore(stats[other]);
  if (a == null && b == null) return base;
  if (a == null) return b > 60 ? other : base;
  if (b == null) return a < 50 ? other : base;
  return b > a + 5 ? other : base;
}
export function roadLine(stats, mode) {
  const r = stats && stats[mode];
  if (!r || !r.tries) return `${roadLabel(mode)} · not tried here yet`;
  const ff = (r.firstFrameMs || []);
  const median = ff.length ? [...ff].sort((a, b) => a - b)[Math.floor(ff.length / 2)] : null;
  return `${roadLabel(mode)} · ${r.ok} of ${r.tries} opened${median != null ? ` · first picture ${(median / 1000).toFixed(1)} s` : ''}${r.stalls ? ` · ${r.stalls} stall${r.stalls === 1 ? '' : 's'}` : ''}`;
}

// =============================================================================
// VIEWS: THE CAMERAS YOU WANT, IN THE ORDER YOU WANT, AS MANY AS YOU WANT
// (DR-0783; Darrell 2026-10-07: "the Wall sucks!!!! My views should be able
// to have and reorder the view live while it is still actively streaming",
// "Views should be able to drag whichever cameras they want to use... or see
// 4 with each other or 6... liberation of options"). A view is a named,
// ordered list of cameras with its own layout (how many across). There can
// be several; one is active. The wall of DR-0774 becomes the first view, so
// nobody loses what they had. Kept per device, like the wall was; a view
// carried to every device by the database is the next step.
// =============================================================================
export const VIEWS_KEY = 'poetech.cameras.views.v1';
export const VIEW_LAYOUTS = Object.freeze(['auto', 1, 2, 3, 4]);
// ONE CAMERA, LARGEST, ON A CLICK (DR-0796; Darrell 2026-10-07: "Clicking
// inside the image of one camera makes it largest size... click again it goes
// to the previous position"). A view or the full-size window keeps one
// focused camera id: that tile takes the whole area, the others stay mounted
// and hidden (their streams keep running, so the way back is instant), and
// the second click restores every tile to exactly where it was.
export function toggleFocus(current, id) {
  return current === id ? '' : String(id || '');
}
/** The focused id, or '' when it names no camera in the view. */
export function focusIn(cams, focused) {
  return focused && Array.isArray(cams) && cams.some((c) => c && c.id === focused) ? focused : '';
}
/** How many tiles the grid lays out: one when a camera is focused, else all. */
export function shownCount(cams, focused) {
  return focusIn(cams, focused) ? 1 : (Array.isArray(cams) ? cams.length : 0);
}
export const VIEW_NAME_MAX = 40;
function viewStore(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}
function newViewId() {
  try { return 'v' + Math.random().toString(36).slice(2, 8); } catch { return 'v' + Date.now().toString(36); }
}
export function makeView(name = 'My view', cameras = [], layout = 'auto') {
  return { id: newViewId(), name: String(name || 'My view').slice(0, VIEW_NAME_MAX), cameras: cameras.filter((x) => typeof x === 'string' && CAMERA_ID.test(x)), layout: VIEW_LAYOUTS.includes(layout) ? layout : 'auto', scale: 1 };
}
function cleanView(v) {
  if (!v || typeof v !== 'object' || typeof v.id !== 'string') return null;
  return {
    id: v.id,
    name: String(v.name || 'View').slice(0, VIEW_NAME_MAX),
    cameras: Array.isArray(v.cameras) ? [...new Set(v.cameras.filter((x) => typeof x === 'string' && CAMERA_ID.test(x)))] : [],
    layout: VIEW_LAYOUTS.includes(v.layout) ? v.layout : (VIEW_LAYOUTS.includes(Number(v.layout)) ? Number(v.layout) : 'auto'),
    scale: clampScale(v.scale),
  };
}
// {views: [...], active: id}. With nothing saved, the old wall (if any) becomes "My view".
export function loadViews(storage = null) {
  const st = viewStore(storage);
  try {
    const raw = st && st.getItem(VIEWS_KEY);
    if (raw) {
      const j = JSON.parse(raw);
      const views = (Array.isArray(j.views) ? j.views : []).map(cleanView).filter(Boolean);
      if (views.length) return { views, active: views.some((v) => v.id === j.active) ? j.active : views[0].id };
    }
  } catch { /* fall through to a fresh start */ }
  const wall = loadWall(st);
  const first = makeView('My view', wall);
  return { views: [first], active: first.id };
}
export function saveViews(state, storage = null) {
  const st = viewStore(storage);
  if (!st) return false;
  try { st.setItem(VIEWS_KEY, JSON.stringify({ views: state.views.map(cleanView).filter(Boolean), active: state.active })); return true; } catch { return false; }
}
export function activeView(state) {
  return (state.views || []).find((v) => v.id === state.active) || state.views[0] || null;
}
function updateView(state, id, fn) {
  return { ...state, views: state.views.map((v) => (v.id === id ? fn(v) : v)) };
}
export function addToView(state, id, cameraId) {
  return updateView(state, id, (v) => (v.cameras.includes(cameraId) ? v : { ...v, cameras: [...v.cameras, cameraId] }));
}
export function removeFromView(state, id, cameraId) {
  return updateView(state, id, (v) => ({ ...v, cameras: v.cameras.filter((c) => c !== cameraId) }));
}
// Move a camera to a new position (live: the players keep their keys, so the streams keep running).
export function moveInView(state, id, cameraId, toIndex) {
  return updateView(state, id, (v) => {
    const from = v.cameras.indexOf(cameraId);
    if (from < 0) return v;
    const next = v.cameras.filter((c) => c !== cameraId);
    const at = Math.max(0, Math.min(next.length, Number(toIndex)));
    next.splice(at, 0, cameraId);
    return { ...v, cameras: next };
  });
}
export function setViewLayout(state, id, layout) {
  const l = VIEW_LAYOUTS.includes(layout) ? layout : (VIEW_LAYOUTS.includes(Number(layout)) ? Number(layout) : 'auto');
  return updateView(state, id, (v) => ({ ...v, layout: l }));
}
// THE WINDOW (2026-10-07, DR-0788; Darrell, watching two cameras on the
// Firestick under the header and the nav: "I should also be able to put my
// chosen cameras into one full-size window that has all of the ones I chose
// and fit automatically based on the size of the screen and an adjuster that
// lets me up or down size so it fits whatever perfectly"). The view's cameras
// fill the whole screen: the grid that gives every 16:9 tile the most area
// for this many cameras on this screen, and a size the viewer sets — 100% is
// the fit; smaller leaves a margin for a TV that cuts its edges (overscan).
// The size is kept with the view, so the wall remembers it.
export const VIEW_SCALE_MIN = 0.5;
export const VIEW_SCALE_MAX = 1;
export const VIEW_SCALE_STEP = 0.05;
export function clampScale(s) {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(VIEW_SCALE_MAX, Math.max(VIEW_SCALE_MIN, Math.round(n * 100) / 100));
}
/**
 * The grid that gives `count` tiles of `aspect` the most area inside width ×
 * height with `gap` px between them: every column count is tried; a tile is
 * as wide as its column unless the rows would run past the bottom, in which
 * case the height decides. Pure, so it is tested on real screens.
 */
export function fitGrid({ count, width, height, aspect = 16 / 9, gap = 0 } = {}) {
  const n = Math.max(1, Math.floor(Number(count) || 0));
  const W = Math.max(0, Number(width) || 0);
  const H = Math.max(0, Number(height) || 0);
  const g = Math.max(0, Number(gap) || 0);
  let best = null;
  for (let cols = 1; cols <= n; cols += 1) {
    const rows = Math.ceil(n / cols);
    let tileW = (W - g * (cols - 1)) / cols;
    let tileH = tileW / aspect;
    if (rows * tileH + g * (rows - 1) > H) { tileH = (H - g * (rows - 1)) / rows; tileW = tileH * aspect; }
    if (tileW <= 0 || tileH <= 0) continue;
    const area = tileW * tileH;
    // Equal area, more columns: a wall of cameras reads wider, not taller.
    if (!best || area > best.area - 0.5) best = { cols, rows, tileW: Math.floor(tileW), tileH: Math.floor(tileH), area };
  }
  if (!best) return { cols: 1, rows: n, tileW: 0, tileH: 0 };
  return { cols: best.cols, rows: best.rows, tileW: best.tileW, tileH: best.tileH };
}
export function setViewScale(state, id, scale) {
  return updateView(state, id, (v) => ({ ...v, scale: clampScale(scale) }));
}
export function renameView(state, id, name) {
  return updateView(state, id, (v) => ({ ...v, name: String(name || v.name).trim().slice(0, VIEW_NAME_MAX) || v.name }));
}
export function addView(state, name = '') {
  const v = makeView(name || `View ${state.views.length + 1}`);
  return { views: [...state.views, v], active: v.id };
}
export function deleteView(state, id) {
  const views = state.views.filter((v) => v.id !== id);
  if (!views.length) { const v = makeView('My view'); return { views: [v], active: v.id }; }
  return { views, active: state.active === id ? views[0].id : state.active };
}
// How many across: a chosen number, or for auto a shape that fits the count
// (1 alone, 2 for two to four, 3 for five to nine, 4 beyond).
export function viewCols(layout, count) {
  if (layout !== 'auto') return Number(layout) || 1;
  const n = Number(count) || 0;
  if (n <= 1) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  return 4;
}
export function viewGridClass(cols) {
  return { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' }[cols] || 'grid-cols-1 sm:grid-cols-2';
}
// The index a pointer is over, given the tiles' boxes [{id, left, top, right, bottom}].
export function indexAtPoint(boxes, x, y) {
  for (let i = 0; i < boxes.length; i += 1) {
    const b = boxes[i];
    if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return i;
  }
  return -1;
}

// =============================================================================
// CLIP DOWNLOADS BY SIZE (DR-0797; Darrell 2026-10-07: "Pushing record only
// records to the nas... not to the cellphone correct... options to download
// based on size and the ability to give smaller to large size files with
// their best resolutions"). Correct: Record writes to the NAS only (DR-0775);
// a clip reaches a phone only when it is asked for. A clip can be asked for
// at one of three sizes besides the original -- each the best picture that
// fits (480p / 720p / 1080p, never upscaled) -- and the NAS makes that file
// once with its own ffmpeg, answering 202 while it works. The estimate shown
// before the file exists is the tier's rate for the clip's length, never more
// than the original; once made, the real bytes replace it.
// =============================================================================
export const CLIP_SIZE_TIERS = Object.freeze([
  Object.freeze({ key: 'original', label: 'Original', height: null }),
  Object.freeze({ key: 'uhd', label: 'Ultra (2160p / 4K)', height: 2160 }),
  Object.freeze({ key: 'xlarge', label: 'Extra large (1440p / 2.5K)', height: 1440 }),
  Object.freeze({ key: 'large', label: 'Large (1080p)', height: 1080 }),
  Object.freeze({ key: 'medium', label: 'Medium (720p)', height: 720 }),
  Object.freeze({ key: 'small', label: 'Small (480p)', height: 480 }),
]);
export const CLIP_MAKE_POLL_MS = 3000;
export const CLIP_MAKE_MAX_WAIT_MS = 15 * 60 * 1000;
export function recClipSizesUrl(id, name, ticket) { return `${recClipUrl(id, name, ticket)}&sizes=1`; }
export function recClipDownloadUrl(id, name, ticket, size, { retry = false, dl = true } = {}) {
  const base = recClipUrl(id, name, ticket);
  const tier = size && size !== 'original' ? `&size=${encodeURIComponent(size)}` : '';
  return `${base}${tier}${dl ? '&dl=1' : ''}${retry ? '&retry=1' : ''}`;
}
/** The same clip at a size, to WATCH in place: no download header (DR-0802). */
export function recClipPlayUrl(id, name, ticket, size) {
  return recClipDownloadUrl(id, name, ticket, size, { dl: false });
}
/** A fetch failure in words a person can act on: a timeout names the seconds and the likely cause. */
export function humanizeFetchError(e, ms = FETCH_TIMEOUT_MS) {
  const name = e && (e.name || '');
  const msg = String((e && e.message) || e || '');
  if (name === 'AbortError' || /aborted/i.test(msg)) return `the NAS did not answer in ${Math.round(ms / 1000)} s (the link is busy or the camera service is down)`;
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'the camera road did not answer';
  return msg || 'unknown error';
}
export const CLIP_TICKET_TIMEOUT_MS = 15000;
/**
 * A playback ticket for a camera's clips: a longer bound than a frame fetch
 * (a busy link makes even a small POST slow), one retry on a timeout, and a
 * plain message when it fails (DR-0802). Resolves {ok:true, ticket} or
 * {ok:false, message}.
 */
export async function clipTicket(id, token, { fetchImpl = globalThis.fetch, timeoutMs = CLIP_TICKET_TIMEOUT_MS, tries = 2, ttl = CLIP_TICKET_TTL } = {}) {
  let last = null;
  for (let i = 0; i < Math.max(1, tries); i += 1) {
    try {
      const r = await fetchWithTimeout(ticketUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ camera: id, ttl }) }, timeoutMs, fetchImpl);
      if (r.status === 401) return { ok: false, message: 'The family key on this device was refused. Sign in to the app again.' };
      if (r.status === 503) return { ok: false, message: 'The NAS has all its live slots in use; close a view and try again.' };
      if (!r.ok) return { ok: false, message: `The camera road answered HTTP ${r.status}.` };
      const body = await r.json();
      if (!body || !body.ticket) return { ok: false, message: 'The NAS sent no ticket.' };
      return { ok: true, ticket: body.ticket };
    } catch (e) {
      last = e;
      if (!(e && (e.name === 'AbortError' || /aborted/i.test(String(e.message || ''))))) break;
    }
  }
  return { ok: false, message: `Could not get a playback ticket: ${humanizeFetchError(last, timeoutMs)}.` };
}
/** The file a phone saves: camera-time-size.mp4 (the NAS names it the same). */
export function clipDownloadName(id, name, size) {
  const stem = String(name || '').replace(/\.mp4$/, '');
  return `${id}-${stem}-${size && size !== 'original' ? size : 'original'}.mp4`;
}
/** One line per tier for the menu: the label and the size it is or is expected to be. */
export function clipTierLine(tier, sizes) {
  if (!tier) return '';
  if (tier.key === 'original') return `${tier.label} · ${sizes && Number.isFinite(sizes.original) ? formatBytes(sizes.original) : 'as recorded'}`;
  const row = sizes && sizes.tiers ? sizes.tiers[tier.key] : null;
  if (!row) return tier.label;
  if (row.state === 'ready' && Number.isFinite(row.bytes)) return `${tier.label} · ${formatBytes(row.bytes)} · ready`;
  if (row.state === 'making') return `${tier.label} · about ${formatBytes(row.estimate)} · being made now`;
  if (row.state === 'queued') return `${tier.label} · about ${formatBytes(row.estimate)} · in line (${row.position})`;
  if (row.state === 'failed') return `${tier.label} · could not be made: ${row.error || 'ffmpeg failed'}`;
  return `${tier.label} · about ${formatBytes(row.estimate)}`;
}
export async function fetchClipSizes(id, name, ticket, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(recClipSizesUrl(id, name, ticket), {}, RECORDING_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status !== 200 || !body) return { ok: false, status: r.status };
    return { ok: true, status: 200, original: Number(body.original) || 0, seconds: Number(body.seconds) || 0, tiers: body.tiers || {}, downloadName: body.download_name || '' };
  } catch {
    return { ok: false, status: 0 };
  }
}
/**
 * Ask the NAS for a clip at a size and wait until it is ready: resolves
 * {ok:true, url} when the ticketed URL answers 200, {ok:false, message}
 * otherwise. `onProgress({state, position})` says where it is in the line.
 * Explicit timeouts throughout (the make is bounded; so is the wait).
 */
export async function waitForClipSize(id, name, ticket, size, { fetchImpl = globalThis.fetch, onProgress = null, pollMs = CLIP_MAKE_POLL_MS, maxWaitMs = CLIP_MAKE_MAX_WAIT_MS, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), retry = false, dl = true } = {}) {
  const url = recClipDownloadUrl(id, name, ticket, size, { retry, dl });
  const plain = recClipDownloadUrl(id, name, ticket, size, { dl });
  const started = Date.now();
  let first = true;
  while (Date.now() - started <= maxWaitMs) {
    let r;
    try {
      // HEAD would be enough, but the forwarder answers GET; Range 0-0 keeps the probe to one byte.
      r = await fetchWithTimeout(first ? url : plain, { headers: { Range: 'bytes=0-0' } }, RECORDING_TIMEOUT_MS, fetchImpl);
    } catch {
      return { ok: false, message: 'The camera road did not answer.' };
    }
    first = false;
    if (r.status === 200 || r.status === 206) return { ok: true, url: plain };
    let body;
    try { body = await r.json(); } catch { body = null; }
    if (r.status === 202) {
      if (onProgress) onProgress({ state: (body && body.status) || 'queued', position: Number(body && body.position) || 0 });
      await sleep(Number(body && body.retry_in) > 0 ? Math.min(pollMs, Number(body.retry_in) * 1000) : pollMs);
      continue;
    }
    if (r.status === 500) return { ok: false, message: `The NAS could not make that size: ${(body && body.detail) || 'ffmpeg failed'}.`, failed: true };
    if (r.status === 401) return { ok: false, message: 'The playback ticket ran out; press Download again.' };
    if (r.status === 404) return { ok: false, message: 'That clip is no longer on the NAS.' };
    return { ok: false, message: `The camera road answered HTTP ${r.status}.` };
  }
  return { ok: false, message: 'The NAS is still making that file; try again in a minute.' };
}

// =============================================================================
// THE STREAM HEALTH LOG (DR-0798; Darrell 2026-10-07: "Are there some type of
// logs we can use to make the cameras stream more continuous?... based on the
// information cameras provided can we make sure we optimize the videos
// streams"). The NAS samples go2rtc's own numbers every few seconds and
// keeps an hour per camera: bits per second while watched, up%, every drop
// while someone watched (a producer gone, bytes frozen, a producer
// restarted), the codecs the camera sends. The app shows it on the tile and
// uses the one fact that decides a road: a camera that sends only H.265 has an
// H.264 twin on the NAS, and a device whose <video> cannot decode H.265 plays
// the twin instead of a blank tile.
// =============================================================================
export const STREAM_HEALTH_POLL_MS = 15000;
export const TWIN_SUFFIX = '_h264';
export function twinOf(id) { return `${id}${TWIN_SUFFIX}`; }
export async function fetchStreamHealth(token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(streamHealthUrl(), { headers: authHeaders(token) }, FETCH_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status !== 200 || !body || typeof body !== 'object') return { ok: false, status: r.status, cameras: {}, events: [] };
    return { ok: true, status: 200, cameras: body.cameras || {}, events: Array.isArray(body.events) ? body.events : [], sampledAt: Number(body.sampled_at) || null, intervalS: Number(body.interval_s) || null };
  } catch {
    return { ok: false, status: 0, cameras: {}, events: [] };
  }
}
/** Can this device's <video> decode H.265? Asked of the element, never a UA sniff. */
export function deviceCanPlayHevc(canPlayType) {
  if (typeof canPlayType !== 'function') return true; // no probe: assume the camera's own stream
  for (const t of ['video/mp4; codecs="hvc1.1.6.L93.B0"', 'video/mp4; codecs="hev1.1.6.L93.B0"']) {
    try { if (canPlayType(t)) return true; } catch { /* a device fact */ }
  }
  return false;
}
export const SD_SUFFIX = '_sd';
export function sdOf(id) { return `${id}${SD_SUFFIX}`; }
/**
 * The stream this device should open for a camera: the SD twin for a tile in
 * a grid (when the NAS keeps one), else the H.264 twin when the camera sends
 * only H.265 and this device cannot decode it, else the camera's own.
 */
export function liveStreamId(cam, canPlayType, { sd = false } = {}) {
  if (!cam || !cam.id) return '';
  if (sd && cam.sd) return sdOf(cam.id);
  return cam.h264 && !deviceCanPlayHevc(canPlayType) ? twinOf(cam.id) : cam.id;
}
/** A grid tile wants the SD substream; the one camera made largest, or a single camera, wants HD. */
export function wantsSd({ shown = 1, picked = false } = {}) {
  return !picked && Number(shown) > 1;
}
const fmtKbps = (k) => (k >= 1000 ? `${(k / 1000).toFixed(1)} Mb/s` : `${Math.round(k)} kb/s`);
/** One short line under a tile from the camera's hour of health; '' when nothing was ever watched. */
export function streamHealthLine(h) {
  if (!h || typeof h !== 'object') return '';
  const parts = [];
  if (Number.isFinite(h.kbps)) parts.push(fmtKbps(h.kbps));
  if (Array.isArray(h.codecs) && h.codecs.length) parts.push(h.codecs.join('+') + (h.hevc_only ? (h.twin ? ' · H264 twin' : ' · H265 only') : ''));
  if (Number.isFinite(h.up_pct)) parts.push(`up ${h.up_pct}%`);
  if (Number.isFinite(h.drops_1h)) parts.push(h.drops_1h === 0 ? 'no drops this hour' : `${h.drops_1h} drop${h.drops_1h === 1 ? '' : 's'} this hour`);
  return parts.join(' · ');
}
export function dropKindText(kind) {
  if (kind === 'producer-gone') return 'the camera\'s connection to the NAS dropped while someone watched';
  if (kind === 'bytes-frozen') return 'the camera sent nothing for a whole sample while someone watched';
  if (kind === 'producer-restarted') return 'the camera reconnected to the NAS (its counter started over)';
  return String(kind || 'a drop');
}
/** The last drops for one camera, newest first, in words with the time. */
export function dropLines(events, camId, limit = 6) {
  if (!Array.isArray(events)) return [];
  return events.filter((e) => e && e.camera === camId).slice(-limit).reverse()
    .map((e) => `${Number.isFinite(e.at) ? new Date(e.at * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''} · ${dropKindText(e.kind)}`.replace(/^ · /, ''));
}

// =============================================================================
// A LIVE TILE STAYS LIVE (DR-0799; Darrell 2026-10-07, the Firestick window,
// two cameras whose own clocks had stopped at 17:08:3x: "Cameras in the window
// don't stay live... the seconds timers show they are not live.... why?!!!!!
// Fix it!!!!!!"). Measured against the player as it was: a tile reconnected
// only when the stream ENDED or ERRORED. A picture that silently stopped --
// the element starved of bytes, or a decoder that fell behind -- stayed
// frozen for ever, and a picture that stalled and resumed stayed BEHIND the
// live edge by the length of the stall, and fell further behind with each
// one. Nothing watched the one number that says "live": the play position
// moving, and how far it trails the edge of what has arrived. Now every tile
// is tended every LIVE_TEND_MS: a position that has not moved for
// FREEZE_SECONDS is a freeze and the tile reconnects (a new ticket, the same
// road); a position more than LIVE_LAG_SEEK_S behind the edge jumps to the
// edge; a smaller lag is run down at LIVE_CATCHUP_RATE until it is gone.
// Pure decisions here, proven in plain tests; the element is only touched by
// tendLiveVideo.
// =============================================================================
export const LIVE_TEND_MS = 2000;
export const FREEZE_SECONDS = 6;
export const LIVE_LAG_SEEK_S = 3;
export const LIVE_LAG_RATE_S = 1;
export const LIVE_CATCHUP_RATE = 1.08;
export const LIVE_EDGE_MARGIN_S = 0.5;

/** Where "now" is on this element: the end of what has arrived (mp4) or of what is seekable (HLS). */
export function liveEdge(video, mode = 'mp4') {
  const endOf = (ranges) => { try { return ranges && ranges.length ? ranges.end(ranges.length - 1) : null; } catch { return null; } };
  const buffered = endOf(video && video.buffered);
  const seekable = endOf(video && video.seekable);
  if (mode === 'hls') return Number.isFinite(seekable) ? seekable : buffered;
  return Number.isFinite(buffered) ? buffered : seekable;
}

/** What to do about the distance from the play position to the live edge. */
export function liveEdgeDecision({ currentTime, edge, playbackRate = 1 }) {
  if (!Number.isFinite(currentTime) || !Number.isFinite(edge)) return { action: 'none', lag: null };
  const lag = Math.max(0, edge - currentTime);
  if (lag > LIVE_LAG_SEEK_S) return { action: 'seek', to: Math.max(0, edge - LIVE_EDGE_MARGIN_S), lag };
  if (lag > LIVE_LAG_RATE_S) return { action: 'rate', rate: LIVE_CATCHUP_RATE, lag };
  if (Math.abs(Number(playbackRate) - 1) > 0.001) return { action: 'rate', rate: 1, lag };
  return { action: 'none', lag };
}

/**
 * One step of the freeze watch. `memo` is {lastTime, since, frozenFor}; a
 * position that moved, a pause, or the end resets it; a position that has not
 * moved counts the seconds since it last did.
 */
export function freezeStep(memo, { currentTime, paused = false, ended = false }, nowMs) {
  const t = Number(currentTime);
  if (paused || ended || !Number.isFinite(t)) return { lastTime: Number.isFinite(t) ? t : null, since: nowMs, frozenFor: 0 };
  if (!memo || memo.lastTime == null || t !== memo.lastTime) return { lastTime: t, since: nowMs, frozenFor: 0 };
  return { lastTime: t, since: memo.since, frozenFor: Math.max(0, (nowMs - memo.since) / 1000) };
}

/**
 * Tend one live element: watch for a freeze and keep it at the live edge.
 * Returns the next memo plus {frozen, lag, action}. Only here is the element
 * written (currentTime, playbackRate), and only when the decision says so.
 */
export function tendLiveVideo(video, memo, { mode = 'mp4', nowMs = Date.now() } = {}) {
  if (!video) return { memo, frozen: false, lag: null, action: 'none' };
  const state = { currentTime: Number(video.currentTime), paused: !!video.paused, ended: !!video.ended };
  const next = freezeStep(memo, state, nowMs);
  const frozen = next.frozenFor >= FREEZE_SECONDS;
  let decision = { action: 'none', lag: null };
  if (!frozen && !state.paused && !state.ended && Number(video.readyState) >= 2) {
    decision = liveEdgeDecision({ currentTime: state.currentTime, edge: liveEdge(video, mode), playbackRate: video.playbackRate });
    try {
      if (decision.action === 'seek') video.currentTime = decision.to;
      else if (decision.action === 'rate') video.playbackRate = decision.rate;
    } catch { /* a device fact */ }
  }
  return { memo: next, frozen, lag: decision.lag, action: decision.action };
}

// =============================================================================
// ANY CAMERA, FROM THE APP, TESTED ON THE SPOT (DR-0803; Darrell 2026-10-07:
// "Build the other options... so I can set up rstp... and all other options
// so I can verify they work!!!!!!!!", "Ring... etc... all pathways for our
// home cameras"). The Setup tab said "one line in go2rtc.yaml by hand" for
// every system but Wyze. Now the app builds the source line from a few boxes
// (the password never shown back), the NAS registers it and probes ONE frame,
// and the answer -- a picture's size and time, or go2rtc's own reason -- is
// shown before the form is left. Ring signs in through go2rtc's own road
// (email, password, the 2FA code Ring sends). A Google sign-in is not a road
// the camera makers' APIs offer (see GOOGLE_SIGN_IN_NOTE).
// =============================================================================
export const GOOGLE_SIGN_IN_NOTE = 'Signed up with Google or Apple? Wyze and Ring only take their own email and password here (plus a 2FA code). Set a password for that account once in its own app, then sign in here with it.';
export const ADD_KINDS = Object.freeze([
  Object.freeze({ id: 'rtsp', label: 'RTSP / RTMP', fields: ['name', 'host', 'port', 'user', 'password', 'path'], hint: 'Any camera or NVR that already streams: UniFi Protect (rtsps), Reolink, Amcrest, Hikvision, Dahua, a Blue Iris or Frigate restream. Port 554 is the usual one; the path is what the maker documents (for example /live or /h264Preview_01_main).' }),
  Object.freeze({ id: 'onvif', label: 'ONVIF', fields: ['name', 'host', 'port', 'user', 'password'], hint: 'The sovereign PoE backbone (DR-0050): the NAS asks the camera for its own stream links. The camera must be on a network the NAS reaches (the NAS is on 192.168.1.x). Port is usually 80, 8000 or 2020.' }),
  Object.freeze({ id: 'http', label: 'HTTP snapshot / MJPEG', fields: ['name', 'url'], hint: 'A JPEG snapshot or MJPEG URL the camera already serves, with any sign-in inside the URL (http://user:pass@host/snap.jpg).' }),
  Object.freeze({ id: 'url', label: 'Any source line', fields: ['name', 'url'], hint: 'A go2rtc source line as its documentation writes it (rtsp://, rtsps://, rtmp://, onvif://, http://, homekit://, tapo://, dvrip://, isapi://, ...). Never exec: or ffmpeg# raw arguments; the NAS refuses those.' }),
]);
export const ADD_SCHEMES = Object.freeze(['rtsp', 'rtsps', 'rtmp', 'rtmps', 'onvif', 'http', 'https', 'ring', 'nest', 'wyze', 'homekit', 'hass', 'dvrip', 'tapo', 'kasa', 'isapi', 'gopro', 'roborock', 'webrtc', 'webtorrent', 'ivideon', 'bubble', 'expr']);
/** A camera's name as the NAS addresses it: the stream id grammar, lower-cased. */
export function streamIdFrom(name) {
  return String(name || '').trim().replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/^[_.-]+|[_.-]+$/g, '').toLowerCase().slice(0, 48);
}
const enc = (v) => encodeURIComponent(String(v || '').trim());
/** The source line go2rtc is handed, built from the form's boxes; '' when a needed box is empty. */
export function buildSourceUrl(kind, f = {}) {
  const host = String(f.host || '').trim();
  const port = String(f.port || '').trim();
  const user = String(f.user || '').trim();
  const pass = String(f.password || '');
  const auth = user ? `${enc(user)}${pass ? `:${enc(pass)}` : ''}@` : '';
  const hp = port ? `${host}:${port}` : host;
  if (kind === 'rtsp') {
    if (!host) return '';
    const scheme = (f.scheme === 'rtsps' || f.scheme === 'rtmp' || f.scheme === 'rtmps') ? f.scheme : 'rtsp';
    let path = String(f.path || '').trim();
    if (path && !path.startsWith('/')) path = `/${path}`;
    return `${scheme}://${auth}${hp}${path}`;
  }
  if (kind === 'onvif') return host ? `onvif://${auth}${hp}` : '';
  if (kind === 'http' || kind === 'url') return String(f.url || '').trim();
  return '';
}
/** Is a source line one the NAS will accept? Answers '' or the reason. */
export function sourceProblem(url) {
  const u = String(url || '').trim();
  if (!u) return 'empty';
  if (/^(exec|ffmpeg|echo):|#raw=|#exec/i.test(u)) return 'that kind of source is not allowed from the app';
  const scheme = u.split(':', 1)[0].toLowerCase();
  if (!ADD_SCHEMES.includes(scheme)) return `the NAS does not speak ${scheme}://`;
  return '';
}
/** The source line with its password hidden, for the preview. */
export function maskSource(url) {
  return String(url || '').replace(/:\/\/([^/@\s]+):([^@\s]+)@/, '://$1:***@').replace(/([?&](password|pass|pwd|token|refresh_token|enr|key|secret)=)[^&\s]*/gi, '$1***');
}
export function streamsUrl() { return `${CAMS_BASE}/streams`; }
export function streamTestUrl(id) { return `${CAMS_BASE}/streams/${encodeURIComponent(id)}/test`; }
export function streamRemoveUrl(id) { return `${CAMS_BASE}/streams/${encodeURIComponent(id)}`; }
export function ringSetupUrl() { return `${CAMS_BASE}/setup/ring`; }
/** One frame's probe, in words. */
export function probeLine(p) {
  if (!p) return 'not tested yet';
  if (p.ok) return `works: a ${formatBytes(p.bytes || 0)} picture in ${((Number(p.ms) || 0) / 1000).toFixed(1)} s`;
  if (p.timeout) return `no picture: ${p.error || 'the camera did not answer'}`;
  return `no picture: ${p.error || `HTTP ${p.status}`}`;
}
export async function addStream({ name, url, replace = false }, token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(streamsUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ name, url, replace }) }, SETUP_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status === 200 && body && body.ok) return { ok: true, id: body.id, kind: body.kind, registered: !!body.registered, persisted: !!body.persisted, detail: body.detail || '', probe: body.probe || null };
    if (r.status === 400) {
      const e = body && body.error;
      return { ok: false, message: e === 'bad-camera-id' ? 'The name must be letters, digits, dots, dashes or underscores.' : e === 'scheme-not-allowed' ? 'That kind of source is not allowed from the app.' : e === 'reserved-name' ? 'That name ends like a twin the NAS makes itself; choose another.' : `The NAS refused it (${e || 'bad request'}).` };
    }
    if (r.status === 409) return { ok: false, taken: true, message: `A camera named ${body && body.id ? body.id : name} is already there. Choose another name, or replace it.` };
    if (r.status === 401) return { ok: false, message: 'The family key on this device was refused.' };
    if (r.status === 404) return { ok: false, message: 'The NAS runs an older camera service without this road yet. It updates itself within 15 minutes of a merge.' };
    return { ok: false, message: `The camera road answered HTTP ${r.status}${body && body.error ? ` (${body.error})` : ''}.` };
  } catch (e) {
    return { ok: false, message: `The camera road did not answer: ${humanizeFetchError(e, SETUP_TIMEOUT_MS)}.` };
  }
}
export async function testStream(id, token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(streamTestUrl(id), { headers: authHeaders(token) }, RECORDING_TIMEOUT_MS + 5000, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status === 200 && body) return { ok: true, probe: body.probe || null };
    return { ok: false, message: r.status === 404 ? 'The NAS runs an older camera service without this road yet.' : `The camera road answered HTTP ${r.status}.` };
  } catch (e) {
    return { ok: false, message: `The camera road did not answer: ${humanizeFetchError(e, RECORDING_TIMEOUT_MS + 5000)}.` };
  }
}
export async function removeStream(id, token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(streamRemoveUrl(id), { method: 'DELETE', headers: authHeaders(token) }, RECORDING_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status === 200 && body && body.ok) return { ok: true, removed: body.removed || [] };
    return { ok: false, message: r.status === 401 ? 'Only the owner can remove a camera.' : r.status === 404 ? 'The NAS runs an older camera service without this road yet.' : `The camera road answered HTTP ${r.status}.` };
  } catch (e) {
    return { ok: false, message: `The camera road did not answer: ${humanizeFetchError(e)}.` };
  }
}
/** Ring: email + password, then the 2FA code Ring sends; the NAS registers every camera it lists. */
export async function setupRing({ email, password, code = '' }, token, fetchImpl = globalThis.fetch) {
  try {
    const r = await fetchWithTimeout(ringSetupUrl(), { method: 'POST', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, code }) }, SETUP_TIMEOUT_MS, fetchImpl);
    let body = null;
    try { body = await r.json(); } catch { body = null; }
    if (r.status === 200 && body && body.ok) return { kind: 'ok', added: Number(body.added) || 0, cameras: Array.isArray(body.cameras) ? body.cameras : [] };
    if (r.status === 409 && body && body.error === 'needs-2fa') return { kind: 'needs-code', prompt: body.prompt || 'Enter the code Ring sent you.' };
    if (r.status === 409) return { kind: 'error', message: 'Another setup is running on the NAS; try again in a moment.' };
    if (r.status === 401 && body && body.error === 'ring-sign-in-refused') return { kind: 'refused', message: `Ring refused the sign-in${body.detail ? `: ${body.detail}` : ''}. ${GOOGLE_SIGN_IN_NOTE}` };
    if (r.status === 401) return { kind: 'error', message: 'The family key on this device was refused.' };
    if (r.status === 400) return { kind: 'error', message: `A box is missing or wrong (${(body && body.field) || 'email'}).` };
    if (r.status === 404) return { kind: 'error', message: 'The NAS runs an older camera service without the Ring road yet. It updates itself within 15 minutes of a merge.' };
    return { kind: 'error', message: `The camera road answered HTTP ${r.status}${body && body.error ? ` (${body.error})` : ''}.` };
  } catch (e) {
    return { kind: 'error', message: `The camera road did not answer: ${humanizeFetchError(e, SETUP_TIMEOUT_MS)}.` };
  }
}
