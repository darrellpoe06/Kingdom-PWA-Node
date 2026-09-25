// =============================================================================
// device-voice — the Piper reading voice, made ON the phone (DR-0655)
// =============================================================================
// Darrell, 2026-09-25 00:55 UTC: "So we need a direct connection to the nas for
// a good reading?!!! Can't we give everything it needs for quality without
// needing to reconnect with the nas?"
//
// Yes. The good voice (/voice-lite) is Piper — a ~63 MB ONNX model plus the
// espeak-ng phonemizer — and neither needs a NAS. This module runs the SAME
// model the NAS runs, in a Web Worker, on the device's own CPU:
//
//   phonemizer (espeak-ng compiled to WASM, npm `phonemizer`, bundled)
//     -> Piper's own phoneme-id recipe (device-voice-phonemes.js; 10/10 id
//        sequences identical to the NAS binary, measured)
//     -> onnxruntime-web (WASM backend, one thread, bundled; no COOP/COEP)
//     -> 22.05 kHz WAV, peak-normalized + 0.2 s sentence gap, as the NAS does.
//
// THE THREE FILES, AND WHERE THEY LIVE
//   * the voice model + its .onnx.json: fetched ONCE from Hugging Face,
//     rhasspy/piper-voices pinned at v1.0.0 — the very files the NAS installer
//     pulls (infra/nas-voice-lite/install.sh VOICE_BASE). Cloudflare Pages
//     refuses any file over 25 MiB (DR-0595), so the 63 MB model cannot be
//     served from our own origin; VITE_DEVICE_VOICE_BASE points at a mirror
//     (an R2 bucket is the sovereign proposal) without a code change.
//   * the ONNX runtime's .wasm (14 MB raw): a hashed asset of our own build.
//   All three are copied into Cache Storage `poetech-keep-device-voice-v1`,
//   a name sw.js's activate handler spares, so a deploy never re-downloads
//   63 MB. After that: ZERO network. synthesizeOnDevice reads only the cache.
//
// API (the same shape as voice-service.js synthesizeLite, so the reader can
// take it as a drop-in engine later):
//   synthesizeOnDevice({ text, voice }) -> { url, ms, audioSeconds } | { error }
//   checkDeviceVoice({ voice })         -> { state: 'ready'|'downloadable'|'unsupported', reason }
//   downloadDeviceVoice({ voice, onProgress }) -> { ok, bytes } | { error }
//
// Not wired into the reader yet (DR-0655: after the clip-queue / read-aloud
// PRs land). The card in the Voice surface is the only caller today.
// =============================================================================
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';

export const DEVICE_VOICE_CACHE = 'poetech-keep-device-voice-v1';
// Must match the onnxruntime-web version in package.json (a cached runtime
// from another version would not load; the version is part of its cache key).
export const ORT_VERSION = '1.30.0';
export const DEFAULT_VOICE_BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0';
// Stable logical cache keys: the host can change without a re-download.
const KEY_BASE = 'https://device-voice.poetech.invalid/v1/';

export const DEVICE_VOICES = Object.freeze({
  male: Object.freeze({ id: 'en_US-ryan-medium', path: 'en/en_US/ryan/medium/en_US-ryan-medium', label: 'Ryan (male)' }),
  female: Object.freeze({ id: 'en_US-amy-medium', path: 'en/en_US/amy/medium/en_US-amy-medium', label: 'Amy (female)' }),
});

function voiceBase() {
  try {
    const v = import.meta.env && import.meta.env.VITE_DEVICE_VOICE_BASE;
    if (v) return String(v).replace(/\/+$/, '');
  } catch (_) { /* no env */ }
  return DEFAULT_VOICE_BASE;
}

export function voiceSpec(voice) {
  return DEVICE_VOICES[voice] || DEVICE_VOICES.male;
}

/** The three files a voice needs, each with its cache key and source url. */
export function deviceVoiceFiles(voice, { base = voiceBase(), runtimeUrl = ortWasmUrl } = {}) {
  const v = voiceSpec(voice);
  return [
    { kind: 'config', key: `${KEY_BASE}${v.id}.onnx.json`, url: `${base}/${v.path}.onnx.json` },
    { kind: 'model', key: `${KEY_BASE}${v.id}.onnx`, url: `${base}/${v.path}.onnx` },
    { kind: 'runtime', key: `${KEY_BASE}runtime/ort-${ORT_VERSION}.wasm`, url: runtimeUrl },
  ];
}

// wasm-feature-detect's SIMD probe (Apache-2.0): the only ORT WASM build
// shipped since 1.19 requires SIMD.
const SIMD_PROBE = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);

/**
 * The honest answer, from facts about the device (pure; tested).
 * @param {{ wasm:boolean, simd:boolean, worker:boolean, cacheStorage:boolean,
 *           freeBytes?:number|null, needBytes?:number, cached:{config:boolean, model:boolean, runtime:boolean} }} f
 */
export function assessDeviceVoice(f) {
  if (!f.wasm) return { state: 'unsupported', reason: 'This browser cannot run WebAssembly, which the on-device voice is built on.' };
  if (!f.simd) return { state: 'unsupported', reason: 'This browser’s WebAssembly lacks SIMD, which the voice engine needs. A newer browser version would add it.' };
  if (!f.worker) return { state: 'unsupported', reason: 'This browser cannot run a background worker, so the voice would freeze the screen while it speaks.' };
  if (!f.cacheStorage) return { state: 'unsupported', reason: 'This browser will not keep files for the app (private window, or storage turned off), so the voice could not stay on the device.' };
  const c = f.cached || {};
  if (c.config && c.model && c.runtime) return { state: 'ready', reason: 'It speaks with no connection, from this device alone.' };
  if (typeof f.freeBytes === 'number' && typeof f.needBytes === 'number' && f.freeBytes < f.needBytes) {
    return { state: 'unsupported', reason: `This device has about ${mb(f.freeBytes)} free for the app, and the voice needs about ${mb(f.needBytes)}.` };
  }
  return { state: 'downloadable', reason: 'The voice can be downloaded once and kept on this device.' };
}

/**
 * How fast is fast enough, from a MEASURED real-time factor (seconds of work
 * per second of speech). Below 0.5 the next sentence is always ready before
 * this one ends; up to 1.0 it keeps up with no margin; above 1.0 it cannot
 * keep up, and cache-ahead from the NAS stays that device's voice.
 */
export function speedVerdict(rtf) {
  if (typeof rtf !== 'number' || !isFinite(rtf) || rtf <= 0) return { level: 'unknown', text: 'Not measured on this device yet. Press Sample.' };
  if (rtf <= 0.5) return { level: 'good', text: `Fast enough: it makes a second of speech in ${rtf.toFixed(2)} seconds.` };
  if (rtf <= 1) return { level: 'tight', text: `It keeps up, without much margin: a second of speech takes ${rtf.toFixed(2)} seconds to make.` };
  return { level: 'slow', text: `Too slow on this device: a second of speech takes ${rtf.toFixed(2)} seconds to make. Pre-downloaded lessons from home stay this device’s voice.` };
}

export function mb(bytes) {
  return `${(bytes / 1e6).toFixed(bytes >= 1e7 ? 0 : 1)} MB`;
}

function cachesApi(cachesImpl) {
  if (cachesImpl) return cachesImpl;
  return typeof caches !== 'undefined' ? caches : null;
}

/** Which of the voice's files are already on the device (no network). */
export async function cachedState(voice, { cachesImpl, files } = {}) {
  const cs = cachesApi(cachesImpl);
  const out = { config: false, model: false, runtime: false, bytes: 0 };
  if (!cs) return out;
  try {
    const cache = await cs.open(DEVICE_VOICE_CACHE);
    for (const f of files || deviceVoiceFiles(voice)) {
      const hit = await cache.match(f.key);
      if (hit) {
        out[f.kind] = true;
        const len = Number(hit.headers && hit.headers.get && hit.headers.get('Content-Length'));
        if (len) out.bytes += len;
      }
    }
  } catch (_) { /* storage blocked: reported as not cached */ }
  return out;
}

/** Live device facts -> assessDeviceVoice. Makes no network request. */
export async function checkDeviceVoice({ voice = 'male', cachesImpl, env } = {}) {
  const g = env || globalThis;
  const wasm = typeof g.WebAssembly === 'object' && typeof g.WebAssembly.validate === 'function';
  let simd;
  try { simd = wasm && g.WebAssembly.validate(SIMD_PROBE); } catch (_) { simd = false; }
  const cs = cachesApi(cachesImpl || (env ? env.caches : undefined));
  const cached = await cachedState(voice, { cachesImpl: cs });
  let freeBytes = null;
  try {
    const nav = g.navigator;
    if (nav && nav.storage && nav.storage.estimate) {
      const e = await nav.storage.estimate();
      if (e && typeof e.quota === 'number') freeBytes = e.quota - (e.usage || 0);
    }
  } catch (_) { /* unknown is not "full" */ }
  const verdict = assessDeviceVoice({
    wasm, simd, worker: typeof g.Worker === 'function', cacheStorage: !!cs,
    // 84.9 MB measured for the largest pair (a 70.6 MB model + the 14.2 MB
    // runtime, DR-0655), rounded up so a device right at the edge is told first.
    freeBytes, needBytes: 90e6, cached,
  });
  return { ...verdict, cached, freeBytes };
}

/**
 * Download the voice's files once into Cache Storage, with progress.
 * Files already cached are not fetched again.
 * onProgress({ loaded, total, exact, file }) — `total` is `expectedBytes`
 * (measureDownloadSize's HEAD answer) when given, and `exact` is true; without
 * it the total is only what the hosts have declared SO FAR, so `exact` is
 * false and a percentage must not be shown (the walk on 2026-09-25 caught
 * "0.0 MB of 0.0 MB (100%)" while the 5 KB config arrived first).
 */
export async function downloadDeviceVoice({ voice = 'male', onProgress, fetchImpl, cachesImpl, files, expectedBytes } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  const cs = cachesApi(cachesImpl);
  if (!f) return { error: 'no-fetch' };
  if (!cs) return { error: 'no-cache-storage' };
  const list = files || deviceVoiceFiles(voice);
  let cache;
  try { cache = await cs.open(DEVICE_VOICE_CACHE); } catch (e) { return { error: 'cache-open-failed' }; }
  let loaded = 0;
  let total = 0;
  let fetched = 0;
  for (const file of list) {
    if (await cache.match(file.key)) continue;
    let res;
    try { res = await f(file.url); } catch (e) { return { error: `fetch-failed:${file.kind}`, detail: (e && e.message) || '' }; }
    if (!res || !res.ok) return { error: `http-${res ? res.status : 'none'}:${file.kind}` };
    const declared = Number(res.headers && res.headers.get && res.headers.get('Content-Length')) || 0;
    total += declared;
    const chunks = [];
    let got = 0;
    const reader = res.body && res.body.getReader ? res.body.getReader() : null;
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        got += value.length;
        loaded += value.length;
        if (onProgress) onProgress(progressOf(loaded, total, expectedBytes, file.kind));
      }
    } else {
      const ab = await res.arrayBuffer();
      chunks.push(new Uint8Array(ab));
      got += ab.byteLength;
      loaded += ab.byteLength;
      if (onProgress) onProgress(progressOf(loaded, total, expectedBytes, file.kind));
    }
    const bytes = concat(chunks, got);
    const bad = validateFile(file.kind, bytes);
    if (bad) return { error: `invalid:${file.kind}`, detail: bad };
    const type = file.kind === 'config' ? 'application/json' : file.kind === 'runtime' ? 'application/wasm' : 'application/octet-stream';
    await cache.put(file.key, new Response(bytes, { headers: { 'Content-Type': type, 'Content-Length': String(bytes.byteLength) } }));
    fetched++;
  }
  return { ok: true, bytes: loaded, fetched };
}

/**
 * The real download size, asked of the hosts (HEAD), for the files not yet on
 * the device. Returns null when any host does not say — never a guessed number.
 */
export async function measureDownloadSize({ voice = 'male', fetchImpl, cachesImpl, files } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!f) return null;
  const list = files || deviceVoiceFiles(voice);
  const have = await cachedState(voice, { cachesImpl, files: list });
  let sum = 0;
  for (const file of list) {
    if (have[file.kind]) continue;
    try {
      const res = await f(file.url, { method: 'HEAD' });
      const n = Number(res && res.ok && res.headers && res.headers.get && res.headers.get('Content-Length'));
      if (!n) return null;
      sum += n;
    } catch (_) { return null; }
  }
  return sum;
}

export function progressOf(loaded, declared, expectedBytes, file) {
  const exact = typeof expectedBytes === 'number' && expectedBytes > 0;
  return { loaded, total: Math.max(exact ? expectedBytes : declared, loaded), exact, file };
}

function concat(chunks, n) {
  const out = new Uint8Array(n);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

/** A file that is plainly not what it claims is refused BEFORE it is kept. */
export function validateFile(kind, bytes) {
  if (kind === 'runtime') {
    return bytes.length > 8 && bytes[0] === 0 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d ? '' : 'not a WebAssembly module';
  }
  if (kind === 'config') {
    try {
      const j = JSON.parse(new TextDecoder().decode(bytes));
      return j && j.phoneme_id_map && j.audio ? '' : 'not a Piper voice config';
    } catch (_) { return 'not JSON'; }
  }
  if (kind === 'model') {
    // An HTML error page or a truncated body is small; a medium voice is ~63 MB.
    return bytes.length > 1e6 && bytes[0] !== 0x3c ? '' : 'not an ONNX model';
  }
  return '';
}

/** Remove the voice's files (the model is the bulk; the runtime is shared). */
export async function removeDeviceVoice({ voice = 'male', cachesImpl } = {}) {
  const cs = cachesApi(cachesImpl);
  if (!cs) return false;
  const cache = await cs.open(DEVICE_VOICE_CACHE);
  for (const f of deviceVoiceFiles(voice)) if (f.kind !== 'runtime') await cache.delete(f.key);
  return true;
}

// --- the worker --------------------------------------------------------------
const workers = new Map(); // voice -> { worker, ready: Promise, seq, pending }

function defaultWorkerFactory() {
  return new Worker(new URL('./device-voice.worker.js', import.meta.url), { type: 'module' });
}

function call(entry, msg, transfer) {
  return new Promise((resolve) => {
    const id = ++entry.seq;
    entry.pending.set(id, resolve);
    entry.worker.postMessage({ ...msg, id }, transfer || []);
  });
}

async function workerFor(voice, { cachesImpl, workerFactory } = {}) {
  const have = workers.get(voice);
  if (have) return have;
  const cs = cachesApi(cachesImpl);
  if (!cs) return { error: 'no-cache-storage' };
  const cache = await cs.open(DEVICE_VOICE_CACHE);
  const files = deviceVoiceFiles(voice);
  const got = {};
  for (const f of files) {
    const hit = await cache.match(f.key);
    if (!hit) return { error: 'device-voice-not-downloaded' };
    got[f.kind] = f.kind === 'config' ? await hit.json() : await hit.arrayBuffer();
  }
  const worker = (workerFactory || defaultWorkerFactory)();
  const entry = { worker, seq: 0, pending: new Map() };
  worker.onmessage = (e) => {
    const r = entry.pending.get(e.data && e.data.id);
    if (r) { entry.pending.delete(e.data.id); r(e.data); }
  };
  worker.onerror = (e) => {
    for (const r of entry.pending.values()) r({ error: `worker-error:${(e && e.message) || ''}` });
    entry.pending.clear();
    workers.delete(voice);
  };
  const init = await call(entry, { type: 'init', config: got.config, model: got.model, wasmBinary: got.runtime }, [got.model, got.runtime]);
  if (!init || init.error) {
    try { worker.terminate(); } catch (_) { /* gone */ }
    if (init && /protobuf|model|onnx/i.test(init.error)) {
      // A damaged model must not stay "ready" forever: drop it so the card offers the download again.
      try { await cache.delete(files[1].key); } catch (_) { /* best effort */ }
    }
    return { error: (init && init.error) || 'device-voice-init-failed' };
  }
  entry.initMs = init.ms;
  workers.set(voice, entry);
  return entry;
}

/**
 * Speak `text` on this device. Reads ONLY Cache Storage — never the network.
 * @returns {Promise<{url:string, ms:number, audioSeconds:number, initMs?:number}|{error:string}>}
 */
export async function synthesizeOnDevice({ text, voice = 'male', cachesImpl, workerFactory } = {}) {
  const body = String(text || '').trim();
  if (!body) return { error: 'empty-text' };
  let entry;
  try { entry = await workerFor(voice, { cachesImpl, workerFactory }); } catch (e) { return { error: (e && e.message) || 'device-voice-error' }; }
  if (entry.error) return { error: entry.error };
  const r = await call(entry, { type: 'speak', text: body });
  if (!r || r.error) return { error: (r && r.error) || 'device-voice-error' };
  const blob = new Blob([r.wav], { type: 'audio/wav' });
  return { url: URL.createObjectURL(blob), ms: r.ms, audioSeconds: r.audioSeconds, initMs: entry.initMs };
}

/** Stop the worker(s) and free their memory (the model session is ~100+ MB). */
export function releaseDeviceVoice() {
  for (const e of workers.values()) { try { e.worker.terminate(); } catch (_) { /* gone */ } }
  workers.clear();
}
