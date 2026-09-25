// =============================================================================
// voice-service — client for the voice endpoint: SOVEREIGN FIRST, vendor RECORDED
// =============================================================================
// The single seam where a personal voice stops being a labeled browser STAND-IN
// and becomes the person's REAL cloned timbre. The doctrine (Darrell 2026-07-10,
// DR-0138): "We want to not need any vendor llm if possible... use it outside of
// vendor time allotment or when offline" — AND "source the vendor AI for things
// we can't do, with a record of when we need to and what we need to build and/or
// purchase." So:
//
//   1. SOVEREIGN (always outranks): the XTTS studio on the family/church's OWN
//      RTX 4070 (infra/voice-studio, :8770) — offline-capable, unmetered. Point
//      VITE_VOICE_SERVICE_URL at it. Arming it CLOSES the vendor gap.
//   2. VENDOR FALLBACK (a RECORDED sovereignty gap, never the destination): the
//      same-origin /api/voice-speak function (XTTS-v2 via Replicate) — used only
//      while the local studio isn't armed, and carried as an open gap in
//      lib/sovereignty-gaps.js with its build/purchase path and re-review date.
//      Enable with VITE_VOICE_BRIDGE=1 (client) + REPLICATE_API_TOKEN (server).
//
// Contract every endpoint honors (model-agnostic, so XTTS today / F5/OpenVoice/
// Kokoro later swap with no app change):
//   POST {endpoint}  { text, voice, person_key, reference_audio, language }
//                    ->  audio/* body (wav/mp3)
//
// Every call is null-safe and returns a tagged error instead of throwing, so the
// caller can fall back to the browser stand-in and NEVER fail silently.

import { bridgeToken } from './nas-photos.js';

const BRIDGE_PATH = '/api/voice-speak';

function env(name) {
  try { const v = import.meta && import.meta.env && import.meta.env[name]; return typeof v === 'string' ? v.trim() : ''; }
  catch (_) { return ''; }
}

/** The sovereign studio base URL (expects POST {base}/speak), or ''. */
// The same-origin road to the sovereign studio. A browser on an HTTPS page
// cannot fetch the studio's plain-HTTP :8770 at all — mixed content — so an
// absolute tailnet URL was never a working answer from poetech.us, whatever
// was written in an env var. functions/voice/[[path]].js proxies this to the
// Funnel over its own HTTPS, which is the transport shape this house already
// settled on for the NAS (DR-0083/0132/0217: same-origin, never the absolute
// Funnel URL, which throttles cross-origin).
export const SOVEREIGN_VOICE_PATH = '/voice';

export function voiceServiceUrl() {
  // An explicit override still wins — a studio on a different host, or a test.
  const explicit = env('VITE_VOICE_SERVICE_URL').replace(/\/+$/, '');
  if (explicit) return explicit;
  // Otherwise the same-origin transport, which needs no build secret and no
  // per-device setting: ONE route that works from a phone, a Firestick and a
  // smart TV identically, because it is just this site.
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin + SOVEREIGN_VOICE_PATH;
  }
  return '';
}

/** The same-origin vendor bridge is enabled (a recorded sovereignty gap). */
export function voiceBridgeEnabled() {
  return env('VITE_VOICE_BRIDGE') === '1';
}

/** The active POST endpoint + whether the recorded reference must accompany it.
 *  Sovereign ALWAYS outranks the vendor bridge (DR-0138).
 *
 *  `needsReference` USED TO BE HARDCODED TRUE on both, and that one word was the
 *  reason every lesson read in the device's robot voice (DR-0382). It made the
 *  service clone-only by construction: the System voice — the default nobody
 *  changes — could never reach it, so a church running its own voice studio
 *  still heard Android's built-in engine. The flag is now about the REQUEST,
 *  not the endpoint: a cloned voice needs its sample, a built-in voice does
 *  not, and whether this particular deployment can serve a built-in speaker is
 *  DISCOVERED by asking rather than assumed (see synthesizeSpeech). */
export function activeVoiceEndpoint() {
  const sovereign = voiceServiceUrl();
  if (sovereign) return { url: `${sovereign}/speak`, kind: 'sovereign', needsReference: true };
  if (voiceBridgeEnabled()) return { url: BRIDGE_PATH, kind: 'bridge', needsReference: true };
  return null;
}

// WHAT THIS DEPLOYMENT CAN ACTUALLY DO, learned at runtime rather than declared.
//
// Some /speak backends (XTTS, Piper and friends) happily synthesize with a
// built-in speaker when no reference sample is sent; others refuse. Which one
// is on the NAS today is NOT something this file can know, and guessing either
// way is how a feature ships broken. So the first built-in request is an
// experiment: if it returns audio, built-in is supported and every later read
// uses it; if it fails, the answer is remembered and we never pay for that
// round trip again — we fall straight through to the device voice, which is
// exactly the behaviour before this change. Strictly better, never worse.
let builtInSupport = 'unknown'; // 'unknown' | 'yes' | 'no'

/** For tests and for a deliberate re-probe after the service is upgraded. */
export function resetBuiltInVoiceProbe() { builtInSupport = 'unknown'; }

/** What we have learned so far. Honest third state — never reported as yes. */
export function builtInVoiceSupport() { return builtInSupport; }

/** True when SOME voice endpoint (bridge or sovereign studio) is configured. */
export function isVoiceServiceReady() {
  return !!activeVoiceEndpoint();
}

// -----------------------------------------------------------------------------
// BOUNDS AND THE LIVE HEALTH PROBE (DR-0440; Darrell 2026-09-16: "I want to be
// able to add my voice... and be able to choose my personal voice... make sure
// that that works"). Two defects stood between a configured studio and an
// honest one: (1) synthesizeSpeech had NO timeout — a hung studio hung the read
// for ever; (2) isVoiceServiceReady() is a CONFIG check, so a mistyped URL read
// as "armed" in every surface and failed on every read. Every async path now
// has an explicit bound and a fallback (DoD), and the studio is ASKED whether it
// answers (GET {base}/health — infra/voice-studio/server.py serves it cold)
// instead of assumed. The vendor bridge has no health route, so it stays
// 'unknown' — never reported up, never reported down.
// -----------------------------------------------------------------------------
export const SPEAK_TIMEOUT_MS = 45000;   // XTTS-class generation for a paragraph on a consumer GPU
export const HEALTH_TIMEOUT_MS = 4000;
export const HEALTH_CACHE_MS = 60000;
let health = 'unknown'; // 'unknown' | 'up' | 'down'
let healthAt = 0;

/** What the last probe learned. Honest third state — never reported as up. */
export function voiceServiceHealth() { return health; }
/** For tests and for a deliberate re-probe after the studio is (re)armed. */
export function resetVoiceServiceHealthForTests() { health = 'unknown'; healthAt = 0; }
/** Configured AND not known to be down — the readiness a reader should trust. */
export function isVoiceServiceAnswering() { return isVoiceServiceReady() && health !== 'down'; }

/**
 * Ask the sovereign studio whether it answers. Cached for HEALTH_CACHE_MS so a
 * page of reads costs one probe; `force` re-asks now. Never throws.
 */
export async function probeVoiceService({ timeoutMs = HEALTH_TIMEOUT_MS, force = false } = {}) {
  const base = voiceServiceUrl();
  if (!base) { health = 'unknown'; return health; }
  if (!force && health !== 'unknown' && Date.now() - healthAt < HEALTH_CACHE_MS) return health;
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => { try { if (ctrl) ctrl.abort(); } catch (_) { /* ignore */ } }, timeoutMs);
  try {
    const res = await fetch(`${base}/health`, { method: 'GET', signal: ctrl ? ctrl.signal : undefined });
    // THE ANSWER MUST BE THE STUDIO'S OWN (2026-09-23, measured from a runner:
    // GET https://poetech.us/voice/health answered HTTP 200 with n8n's editor
    // page — the Funnel had no /voice mount, so the call fell through the root
    // to n8n, the exact class RECORDED-STATE names for /taxes and /nas-photos).
    // Any 200 read as "up" for three days, and every read-aloud first posted to
    // a studio that was not there. The studio (server.py) and the forwarder both
    // answer `{ ok: true }`; an HTML page, an empty body or JSON without ok:true
    // is somebody else talking, and reads as down.
    let body = null;
    if (res && res.ok && typeof res.json === 'function') {
      try { body = await res.json(); } catch (_) { body = null; }
    }
    health = res && res.ok && body && body.ok === true ? 'up' : 'down';
  } catch (_) {
    health = 'down';
  } finally {
    clearTimeout(timer);
    healthAt = Date.now();
  }
  return health;
}

/**
 * Synthesize speech in the chosen voice and return a playable object URL.
 * `referenceDataUri` is the person's recorded sample (base64) — required for the
 * few-shot clone. Returns { url } on success or { error } on any failure so the
 * caller can fall back to the browser stand-in.
 */
export async function synthesizeSpeech({
  text, voiceId, personKey, referenceDataUri, language, signal,
  // The caller is asking for the service's OWN voice rather than a clone of a
  // person. Set by the System-voice read path; never set for a person's voice,
  // where a missing sample is a real error the reader must be told about.
  allowBuiltIn = false,
  // The explicit bound (DR-0440). A studio that neither answers nor refuses
  // within it is treated as a failure — the reader falls back to the stand-in
  // instead of waiting for ever.
  timeoutMs = SPEAK_TIMEOUT_MS,
} = {}) {
  const endpoint = activeVoiceEndpoint();
  if (!endpoint) return { error: 'voice-service-not-configured' };
  const body = String(text || '').trim();
  if (!body) return { error: 'empty-text' };
  if (!referenceDataUri) {
    if (!allowBuiltIn) return { error: 'no-voice-sample' };
    // Already asked once and been refused — do not spend the round trip again.
    if (builtInSupport === 'no') return { error: 'no-builtin-voice' };
  }
  // One controller carries BOTH the caller's own abort and the timeout.
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; try { if (ctrl) ctrl.abort(); } catch (_) { /* ignore */ } }, timeoutMs);
  if (signal && ctrl) {
    if (signal.aborted) ctrl.abort();
    else { try { signal.addEventListener('abort', () => ctrl.abort(), { once: true }); } catch (_) { /* ignore */ } }
  }
  try {
    // THE SOVEREIGN ROAD IS LOCKED, and this is the key. /voice sits on the
    // PUBLIC Funnel and the studio has no authentication of its own, so the
    // NAS-side forwarder (infra/voice-studio/voice_forwarder.py) gates /speak
    // on the family bridge bearer -- the same token the photo and tax reads
    // already carry, provisioned to a signed-in family device by the 0128 RPC
    // (lib/bridge-provision.js). No token -> no header -> the forwarder's 401
    // arrives as a tagged error below and the device voice still speaks.
    const headers = { 'Content-Type': 'application/json' };
    if (endpoint.kind === 'sovereign') {
      const token = bridgeToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: body,
        voice: voiceId || null,
        person_key: personKey || null,
        reference_audio: referenceDataUri || null,
        language: language || 'en',
      }),
      signal: ctrl ? ctrl.signal : signal,
    });
    if (!res || !res.ok) {
      if (!referenceDataUri && allowBuiltIn) builtInSupport = 'no';
      return { error: `voice-service-${res ? res.status : 'no-response'}` };
    }
    const blob = await res.blob();
    if (!blob || !blob.size) {
      if (!referenceDataUri && allowBuiltIn) builtInSupport = 'no';
      return { error: 'voice-service-empty' };
    }
    if (!referenceDataUri && allowBuiltIn) builtInSupport = 'yes';
    return { url: URL.createObjectURL(blob) };
  } catch (e) {
    if (!referenceDataUri && allowBuiltIn) builtInSupport = 'no';
    if (timedOut) return { error: 'voice-service-timeout' };
    return { error: (e && e.message) || 'voice-service-error' };
  } finally {
    clearTimeout(timer);
  }
}

// -----------------------------------------------------------------------------
// SAY THE REAL REASON (Darrell, 2026-09-22: "Didn't work!!!!!!" with the studio
// showing "All 7 checks pass" and the read answering "The voice studio was
// unreachable — using the stand-in voice for now.")
//
// Both of those cannot be true, and the app already knew which one was. Every
// failure path above returns a TAGGED error — voice-service-401,
// voice-service-timeout, no-voice-sample — and both call sites threw the tag
// away and printed one generic sentence. "Unreachable" for a 401 is not a
// rounding error: it sends a person to check their network when the real
// problem is a credential, which is the same wrong-reason defect as the
// female-voices copy corrected the same evening.
//
// THE 401 IS THE LIKELY ONE, and it explains the contradiction exactly. The
// health probe calls GET /health, which takes no authentication. The read calls
// POST /speak, which the NAS-side forwarder gates on the family bridge bearer.
// That token lives in localStorage and is PER-DEVICE BY DESIGN (nas-photos.js:
// "a device credential, never synced"), so a device that has never been
// provisioned answers the probe perfectly and is refused at the door.
//
// Pure: a tag in, a sentence out. No network, no DOM.
export function voiceErrorReason(tag) {
  const t = String(tag || '');
  if (/^voice-service-(401|403)$/.test(t)) {
    return 'The voice studio refused this device — it is running, but this device does not hold the family key that /speak requires. The key is per-device and never syncs, so a device that has never been set up is refused even though the studio answers.';
  }
  if (t === 'voice-service-timeout') {
    return 'The voice studio answered too slowly and the read gave up rather than hanging. It is up; it just did not finish in time.';
  }
  if (t === 'no-voice-sample') {
    return 'There is no voice sample on THIS device, so there is nothing for the studio to read in your voice.';
  }
  if (t === 'no-builtin-voice') {
    return 'The voice studio has no built-in voice of its own, and no sample was sent, so it had nothing to speak with.';
  }
  if (t === 'voice-service-empty') {
    return 'The voice studio answered but sent no audio back.';
  }
  if (t === 'voice-service-not-configured') {
    return 'No voice endpoint is configured for this build.';
  }
  // A 404 IS THE ROAD, NOT THE DEVICE (Darrell 2026-09-23, a lesson page with
  // "The voice studio answered with an error (HTTP 404)" floating over it).
  // The same-origin /voice route proxies through the Funnel to the NAS
  // forwarder, which answers every real path (/speak, /voice/speak, /health)
  // and 404s only an unknown one. DR-0566 mounts the Funnel's /voice path only
  // while the forwarder passes its health check, so a 404 at the read means
  // the road to the studio is not mounted right now -- the studio on the 4070
  // is dark or unarmed. Nothing on this device, and not the recording.
  if (t === 'voice-service-404') {
    return 'The road to the voice studio is not open right now (HTTP 404): the studio’s door on the house network is not mounted, which happens when the studio itself is dark. Nothing on this device is wrong, and your recording is safe.';
  }
  if (/^voice-service-\d{3}$/.test(t)) {
    return `The voice studio answered with an error (${t.replace('voice-service-', 'HTTP ')}).`;
  }
  if (t === 'voice-service-no-response' || t === 'voice-service-error') {
    return 'The voice studio could not be reached at all.';
  }
  return t ? `The voice studio failed: ${t}.` : 'The voice studio failed for a reason it did not name.';
}

/**
 * True when the failure is the ROAD or the STUDIO — the house's problem, not
 * the reader's. Darrell 2026-09-23, on being shown "HTTP 404": "What?!!!!
 * Intuitive... you do it!!!! Deduce if it worked properly!!!!!!!!! No
 * headaches!!!!" A person reading a lesson can do nothing about a dark studio
 * or an unmounted route, so the reader is told nothing to dismiss: the read
 * falls back to the stand-in voice and the panel's status line says which
 * voice is speaking and why. Only a problem the person CAN act on — no sample
 * on this device, no key, no consent — earns a notice, and that notice
 * carries its door (DR-0558). Pure: a tag in, a verdict out.
 */
export function isStudioRoadProblem(tag) {
  const t = String(tag || '');
  if (t === 'voice-service-404' || t === 'voice-service-timeout' || t === 'voice-service-no-response'
    || t === 'voice-service-error' || t === 'voice-service-empty' || t === 'voice-service-not-configured') return true;
  return /^voice-service-5\d{2}$/.test(t);
}

/** True when the tag means "refused", which is a credential problem, not a network one. */
export function isVoiceAuthRefusal(tag) {
  return /^voice-service-(401|403)$/.test(String(tag || ''));
}

// -----------------------------------------------------------------------------
// TRY THE REAL THING — the health probe does not get a vote.
//
// Darrell, 2026-09-22: "Why does the health matter?!!! Can't we build it to work
// independently?"
//
// He is right, and the gate was doing real damage in BOTH directions. The read
// path computed `isVoiceServiceReady() && studioHealth !== 'down'` and refused
// to even ATTEMPT a read when the probe said down. So:
//
//   * probe says UP, /speak refused (401)  -> he was told "unreachable"
//   * probe says DOWN, /speak would work   -> the app never tried at all
//
// The second is the worse one. A health check is a SECOND system that can be
// wrong about the first, and when it is wrong it silently withholds a working
// feature. GET /health and POST /speak are different routes with different
// gates -- on this deployment /speak is bearer-gated and /health is not -- so
// the probe was never able to answer the question it was being asked.
//
// DR-0440 said "ready means ANSWERING, never configured". This takes the same
// rule one step further: the only thing that proves /speak answers is CALLING
// /speak. So the attempt is always made when an endpoint exists, the result is
// the truth, and the probe is demoted from a gate to a DISPLAY signal and to
// this: how long to wait before giving up.
//
// The gate existed for a real reason -- a dark studio made every read sit
// through the full timeout. That cost is paid by SIZING the patience instead of
// skipping the call: a studio we last saw answering gets the full generation
// window; one we last saw dark gets a short one, still tried, and still able to
// prove the probe wrong.
export const SPEAK_TIMEOUT_WHEN_DARK_MS = 6000;

/** How long to wait on /speak, given what the probe last saw. Pure. */
export function speakTimeoutFor(health) {
  return health === 'down' ? SPEAK_TIMEOUT_WHEN_DARK_MS : SPEAK_TIMEOUT_MS;
}

/** May we ATTEMPT a studio read? Endpoint configured — health is not consulted. */
export function mayAttemptStudio() {
  return isVoiceServiceReady();
}

// -----------------------------------------------------------------------------
// THE NAS'S OWN AUDIO VOICE — so the stand-in keeps playing in the background
// -----------------------------------------------------------------------------
// Darrell 2026-09-24, on his Android phone: "Why doesn't the player remain
// playing in the background when I switch between apps?!!? Fix it." With the
// GPU studio dark the reader fell back to the phone's Web Speech, which Android
// stops when the app leaves the screen. /voice-lite is Piper on the NAS CPU
// (infra/nas-voice-lite): always AUDIO, so a reading in it plays on like music.
// Same lock as /voice (the family bridge bearer). A miss is remembered briefly
// so a dark road is paid for once, not on every paragraph.
export const LITE_VOICE_PATH = '/voice-lite/speak';
export const LITE_FIRST_TIMEOUT_MS = 15000;   // the first, short piece on a NAS CPU
export const LITE_TIMEOUT_MS = 60000;         // later pieces are prefetched while one plays
export const LITE_DOWN_MS = 2 * 60 * 1000;
let liteDownUntil = 0;
// The key the miss was paid with (DR-0654). A miss with NO key is a locked
// door, not a dark road: the moment this device has a key it did not have
// then (the reader signed in, the family key provisioned), the road is asked
// again at once. Without this a Fire TV that signed in after a refused read
// stayed silent for the rest of the two minutes.
let liteDownKey = '';

/** False for a short while after the audio voice failed, so it is not re-asked per paragraph. */
export function mayTryLiteVoice(now = Date.now()) {
  if (now >= liteDownUntil) return true;
  return bridgeToken() !== liteDownKey;
}
export function markLiteVoiceDown(now = Date.now()) { liteDownUntil = now + LITE_DOWN_MS; liteDownKey = bridgeToken(); }
/** Tests only. */
export function _resetLiteVoiceForTests() { liteDownUntil = 0; liteDownKey = ''; }

// A MISS IS REMEMBERED FOR AS LONG AS ITS CAUSE LASTS, NOT A FLAT TWO MINUTES
// (DR-0654, Darrell's Firestick and his phone the same evening). One slow
// piece from a busy NAS used to rest the voice for two minutes, and every read
// in that window went to the phone's Web Speech, which Android stops in the
// background: "stopped working in the background" again. A busy NAS (503) or a
// play the screen refused is not a dark road at all; a slow answer rests the
// road briefly; a locked door or a missing route rests it longer (and a locked
// door opens again the moment the device holds a new key, mayTryLiteVoice).
export const LITE_REST_MS = Object.freeze({ timeout: 30 * 1000, road: 45 * 1000, locked: LITE_DOWN_MS });
/** Is this a play the browser refused (a gesture matter), not a voice fault? Pure. */
export function isPlayRefusal(reason) {
  return /^(NotAllowedError|AbortError|play-refused)$/.test(String(reason || ''));
}
/** How long the NAS voice rests after a miss with this reason, in ms. Pure. */
export function liteRestFor(reason) {
  const r = String(reason || '');
  if (!r || isPlayRefusal(r) || r === 'voice-lite-503' || r === 'empty-text') return 0;
  if (r === 'voice-lite-timeout') return LITE_REST_MS.timeout;
  if (/^voice-lite-(401|403|404|not-audio)$/.test(r)) return LITE_REST_MS.locked;
  return LITE_REST_MS.road;
}
/** Remember a miss for as long as its cause lasts. */
export function markLiteVoiceMiss(reason, now = Date.now()) {
  const ms = liteRestFor(reason);
  if (ms <= 0) return;
  liteDownUntil = Math.max(liteDownUntil, now + ms);
  liteDownKey = bridgeToken();
}

/**
 * The NAS voice's own reason, in words a listener can act on (DR-0654). The
 * notice used to name only the GPU studio, whatever the NAS voice had said, so
 * a Firestick told "the church's voice service did not answer" had no way to
 * know it was a key, a slow machine, or the screen refusing to play. Pure.
 */
export function liteVoiceReasonText(reason, { hasKey = true } = {}) {
  const r = String(reason || '');
  if (r === 'voice-lite-401' || r === 'voice-lite-403') {
    return hasKey
      ? 'the church’s reading voice did not accept this device’s key. Sign out and in again to fetch a fresh one'
      : 'the church’s reading voice opens only to a signed-in family account. Sign in on this screen, then press play again';
  }
  if (r === 'voice-lite-timeout') return 'the church’s reading voice took longer than 15 seconds to answer. Press play once more';
  if (r === 'voice-lite-503') return 'the church’s reading voice is busy reading for someone else. Press play again in a moment';
  if (r === 'voice-lite-not-audio' || r === 'voice-lite-404') return 'the road to the church’s reading voice is not open on this site yet';
  if (isPlayRefusal(r)) return 'this screen would not start the sound. Press play once more';
  if (!r) return 'the church’s reading voice did not answer';
  return `the church’s reading voice did not answer (${r.replace(/^voice-lite-/, '')})`;
}

// A piece is asked again before the reading gives up on it: a road that
// dropped one request (a network blip, a 5xx from the Funnel, a busy NAS) is
// not a road that is down. A locked door, a missing route or a slow answer is
// not asked again here: asking again cannot open it, and a slow NAS asked
// twice is twice as slow.
export const LITE_RETRIES = 2;
const LITE_RETRY_BASE_MS = 600;
function liteTransient(err) {
  const e = String(err || '');
  if (!e || e === 'voice-lite-timeout' || e === 'empty-text' || e === 'no-fetch') return false;
  if (/^voice-lite-(401|403|404|not-audio|empty)$/.test(e)) return false;
  return true;
}

// -----------------------------------------------------------------------------
// THE HOUSE VOICES, AS THE NAS REPORTS THEM (DR-0655, "Every voice is choosable")
// -----------------------------------------------------------------------------
// Darrell 2026-09-25: "I can only pic this fake dying voice!!!!!!" The NAS had
// voices the app never offered by name. /voice-lite/voices answers with the
// Piper models REALLY on disk (infra/nas-voice-lite), so the list is never a
// painted one: a voice still downloading is simply not there yet.
export const LITE_VOICES_PATH = '/voice-lite/voices';
const HOUSE_CACHE_MS = 5 * 60 * 1000;
let houseCache = null; // { at, result }

/** Tests only. */
export function _resetHouseVoicesForTests() { houseCache = null; }

/**
 * The NAS's installed voices: { voices: [{id,label,gender,accent,quality,note}], default }
 * or { error, voices: [] }. Cached five minutes; `force` re-asks. Never throws.
 */
export async function fetchHouseVoices({ fetchImpl, origin, timeoutMs = 8000, force = false, now = Date.now() } = {}) {
  if (!force && houseCache && now - houseCache.at < HOUSE_CACHE_MS) return houseCache.result;
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!f) return { error: 'no-fetch', voices: [] };
  const base = origin != null ? origin : (typeof window !== 'undefined' && window.location ? window.location.origin : '');
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => { try { if (ctrl) ctrl.abort(); } catch (_) { /* ignore */ } }, timeoutMs);
  let result;
  try {
    const res = await f(`${base}${LITE_VOICES_PATH}`, { method: 'GET', signal: ctrl ? ctrl.signal : undefined });
    const ctype = (res && res.headers && typeof res.headers.get === 'function' && res.headers.get('Content-Type')) || '';
    if (!res || !res.ok) result = { error: `voice-lite-${res ? res.status : 'no-response'}`, voices: [] };
    // The app shell answering 200 with HTML is not a voice list.
    else if (ctype && !/json/i.test(ctype)) result = { error: 'voice-lite-not-json', voices: [] };
    else {
      const body = await res.json();
      const voices = (body && Array.isArray(body.voices) ? body.voices : [])
        .filter((v) => v && typeof v.id === 'string' && v.id)
        .map((v) => ({
          id: v.id,
          label: String(v.label || v.id),
          gender: v.gender === 'male' || v.gender === 'female' ? v.gender : 'unknown',
          accent: String(v.accent || ''),
          quality: String(v.quality || ''),
          note: String(v.note || ''),
        }));
      result = { voices, default: body && typeof body.default === 'string' ? body.default : (voices[0] ? voices[0].id : null) };
    }
  } catch (e) {
    result = { error: (e && e.name === 'AbortError') ? 'voice-lite-timeout' : 'voice-lite-error', voices: [] };
  } finally {
    clearTimeout(timer);
  }
  // A failure is cached for a shorter while than a real list.
  houseCache = { at: result.error ? now - HOUSE_CACHE_MS + 30 * 1000 : now, result };
  return result;
}

/**
 * One piece of a reading as a real audio clip from the NAS voice.
 * @returns {Promise<{url:string}|{error:string}>}
 */
export async function synthesizeLite({ retries = LITE_RETRIES, retryDelayMs = LITE_RETRY_BASE_MS, ...opts } = {}) {
  let out = await synthesizeLiteOnce(opts);
  for (let n = 0; out.error && n < retries && liteTransient(out.error); n += 1) {
    await new Promise((r) => setTimeout(r, retryDelayMs * (n + 1)));
    out = await synthesizeLiteOnce(opts);
  }
  return out;
}

async function synthesizeLiteOnce({ text, voice = 'male', timeoutMs = LITE_TIMEOUT_MS, fetchImpl, origin } = {}) {
  const body = String(text || '').trim();
  if (!body) return { error: 'empty-text' };
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!f) return { error: 'no-fetch' };
  const base = origin != null ? origin : (typeof window !== 'undefined' && window.location ? window.location.origin : '');
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; try { if (ctrl) ctrl.abort(); } catch (_) { /* ignore */ } }, timeoutMs);
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = bridgeToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await f(`${base}${LITE_VOICE_PATH}`, {
      method: 'POST', headers, body: JSON.stringify({ text: body, voice }), signal: ctrl ? ctrl.signal : undefined,
    });
    if (!res || !res.ok) return { error: `voice-lite-${res ? res.status : 'no-response'}` };
    const ctype = (res.headers && typeof res.headers.get === 'function' && res.headers.get('Content-Type')) || '';
    // A route that fell through to the app shell answers 200 with HTML; that
    // is not a voice, and must never be played as one.
    if (ctype && !/^audio\//i.test(ctype)) return { error: 'voice-lite-not-audio' };
    const blob = await res.blob();
    if (!blob || !blob.size) return { error: 'voice-lite-empty' };
    return { url: URL.createObjectURL(blob) };
  } catch (e) {
    return { error: timedOut ? 'voice-lite-timeout' : ((e && e.message) || 'voice-lite-error') };
  } finally {
    clearTimeout(timer);
  }
}
