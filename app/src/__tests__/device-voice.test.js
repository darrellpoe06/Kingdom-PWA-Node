// @vitest-environment node
// =============================================================================
// The voice can live on the device (DR-0655). Proven-to-catch, each block:
//   * PARITY — the ids our recipe feeds the model equal, byte for byte, the ids
//     the NAS's own piper binary (2023.11.14-2) fed it for the same text. Break
//     the clause rule, the terminator handling or the pad rule and it fails.
//   * THE CACHE — the voice downloads once; a second download and every speak
//     after it make ZERO network requests.
//   * THE HONEST CHECK — unsupported / downloadable / ready, each with a reason.
//   * THE KEPT CACHE — sw.js's activate no longer deletes the voice on deploy.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { phonemize } from 'phonemizer';
import { splitClauses, textToPhonemeSentences, phonemesToIds, assembleWav } from '../lib/device-voice-phonemes.js';
import {
  assessDeviceVoice, speedVerdict, downloadDeviceVoice, synthesizeOnDevice, checkDeviceVoice,
  deviceVoiceFiles, validateFile, releaseDeviceVoice, cachedState, measureDownloadSize, DEVICE_VOICE_CACHE,
} from '../lib/device-voice.js';

function readRel(rel) {
  for (const base of ['', 'app/']) {
    try { return readFileSync(join(process.cwd(), base + rel), 'utf8'); } catch (_) { /* next */ }
  }
  throw new Error(`${rel} not found from ${process.cwd()}`);
}
const PARITY = JSON.parse(readRel('src/__tests__/fixtures/device-voice-nas-parity.json'));

describe('Piper recipe parity with the NAS binary', () => {
  for (const c of PARITY.cases) {
    it(`same ids as piper 2023.11.14-2: ${c.text.slice(0, 48)}`, async () => {
      const sentences = await textToPhonemeSentences(c.text, (s) => phonemize(s, 'en-us'));
      const ids = sentences.map((s) => phonemesToIds(s, PARITY.phoneme_id_map));
      expect(ids).toEqual(c.ids);
    }, 20000);
  }

  it('the fixture really is the NAS binary output (10 cases, BOS/pad/EOS shape)', () => {
    expect(PARITY.source).toMatch(/2023\.11\.14-2/);
    expect(PARITY.cases).toHaveLength(10);
    for (const c of PARITY.cases) for (const s of c.ids) {
      expect(s.slice(0, 2)).toEqual([1, 0]);
      expect(s[s.length - 1]).toBe(2);
    }
  });
});

describe('espeak clause rule', () => {
  it('breaks only at punctuation followed by a space or the end', () => {
    expect(splitClauses('Read John 1:29 today. Who is He?').map((c) => [c.text, c.terminator, c.endOfSentence]))
      .toEqual([['Read John 1:29 today', '.', true], ['Who is He', '?', true]]);
    expect(splitClauses('Set aside $2,450 now').map((c) => c.text)).toEqual(['Set aside $2,450 now']);
  });
  it('a closing quote after the mark still ends the clause at the mark', () => {
    expect(splitClauses('"Trust in the LORD," he said.').map((c) => c.terminator)).toEqual([',', '.']);
  });
  it('a comma is not a sentence end; the id recipe keeps the space after it', async () => {
    const s = await textToPhonemeSentences('Wisdom, then rest.', () => ['x']);
    expect(s).toHaveLength(1);
    expect(s[0].join('')).toBe('x, x.');
  });
});

describe('WAV assembly matches the piper binary', () => {
  it('peak-normalizes each sentence and adds 0.2 s of silence after each', () => {
    const buf = assembleWav([new Float32Array([0.5, -0.25]), new Float32Array([0.1])], 22050, 0.2);
    const v = new DataView(buf);
    expect(String.fromCharCode(...new Uint8Array(buf, 0, 4))).toBe('RIFF');
    expect(v.getUint32(24, true)).toBe(22050);
    const samples = (buf.byteLength - 44) / 2;
    expect(samples).toBe(2 + 4410 + 1 + 4410);
    expect(v.getInt16(44, true)).toBe(32767);           // 0.5 scaled to the peak
    expect(v.getInt16(46, true)).toBe(-16383);          // -0.25 at the same scale
    expect(v.getInt16(44 + (2 + 4410) * 2, true)).toBe(32767); // next sentence normalized on its own
  });
});

describe('the honest capability check', () => {
  const base = { wasm: true, simd: true, worker: true, cacheStorage: true, freeBytes: 5e9, needBytes: 9e7, cached: {} };
  it('names why a device cannot', () => {
    expect(assessDeviceVoice({ ...base, wasm: false })).toMatchObject({ state: 'unsupported', reason: expect.stringMatching(/WebAssembly/) });
    expect(assessDeviceVoice({ ...base, simd: false })).toMatchObject({ state: 'unsupported', reason: expect.stringMatching(/SIMD/) });
    expect(assessDeviceVoice({ ...base, worker: false })).toMatchObject({ state: 'unsupported', reason: expect.stringMatching(/worker/) });
    expect(assessDeviceVoice({ ...base, cacheStorage: false })).toMatchObject({ state: 'unsupported', reason: expect.stringMatching(/keep files/) });
    expect(assessDeviceVoice({ ...base, freeBytes: 2e7 })).toMatchObject({ state: 'unsupported', reason: expect.stringMatching(/about 20 MB free .* about 90 MB/) });
  });
  it('downloadable until all three files are kept, then ready', () => {
    expect(assessDeviceVoice({ ...base, cached: { config: true, model: false, runtime: true } }).state).toBe('downloadable');
    expect(assessDeviceVoice({ ...base, cached: { config: true, model: true, runtime: true } }).state).toBe('ready');
  });
  it('unknown free space is not treated as full', () => {
    expect(assessDeviceVoice({ ...base, freeBytes: null }).state).toBe('downloadable');
  });
  it('a browser with no WebAssembly answers unsupported through the live check', async () => {
    const r = await checkDeviceVoice({ env: { navigator: {} }, cachesImpl: memoryCaches().api });
    expect(r.state).toBe('unsupported');
  });
  it('the speed verdict comes from a measurement, with a clear line at real time', () => {
    expect(speedVerdict(null).level).toBe('unknown');
    expect(speedVerdict(0.3).level).toBe('good');
    expect(speedVerdict(0.9).level).toBe('tight');
    expect(speedVerdict(1.6)).toMatchObject({ level: 'slow', text: expect.stringMatching(/Too slow/) });
  });
});

// --- a Cache Storage + network double ----------------------------------------
function memoryCaches() {
  const stores = new Map();
  const api = {
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const m = stores.get(name);
      return {
        match: async (k) => { const r = m.get(String(k)); return r ? r.clone() : undefined; },
        put: async (k, res) => { m.set(String(k), res); },
        delete: async (k) => m.delete(String(k)),
      };
    },
  };
  return { api, stores };
}

const CONFIG = JSON.stringify({ audio: { sample_rate: 22050 }, espeak: { voice: 'en-us' }, inference: {}, phoneme_id_map: { _: [0] }, num_speakers: 1 });
const MODEL = new Uint8Array(2e6).fill(8);
const WASM = new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 0, 0]);
const FILES = deviceVoiceFiles('male', { base: 'https://host.test/v', runtimeUrl: 'https://app.test/ort.wasm' });

function network() {
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url, method: opts.method || 'GET' });
    const body = url.endsWith('.json') ? new TextEncoder().encode(CONFIG) : url.endsWith('.onnx') ? MODEL : WASM;
    return new Response(opts.method === 'HEAD' ? null : body, { status: 200, headers: { 'Content-Length': String(body.length) } });
  };
  return { calls, fetchImpl };
}

function fakeWorker() {
  const w = {
    posted: [],
    postMessage(msg) {
      w.posted.push(msg.type);
      const reply = msg.type === 'init'
        ? { id: msg.id, ok: true, ms: 5 }
        : { id: msg.id, ok: true, wav: assembleWav([new Float32Array([0.2, 0.1])]), ms: 7, audioSeconds: 0.2 };
      setTimeout(() => w.onmessage({ data: reply }), 0);
    },
    terminate() {},
  };
  return w;
}

describe('the voice downloads ONCE and then speaks with zero network', () => {
  afterEach(() => releaseDeviceVoice());

  it('first download fetches the three files with growing progress; the second fetches nothing', async () => {
    const { api } = memoryCaches();
    const net = network();
    const seen = [];
    const first = await downloadDeviceVoice({ files: FILES, fetchImpl: net.fetchImpl, cachesImpl: api, onProgress: (p) => seen.push(p) });
    expect(first).toMatchObject({ ok: true, fetched: 3, bytes: CONFIG.length + MODEL.length + WASM.length });
    expect(net.calls.map((c) => c.url)).toEqual(FILES.map((f) => f.url));
    expect(seen[seen.length - 1].loaded).toBe(seen[seen.length - 1].total);
    for (let i = 1; i < seen.length; i++) expect(seen[i].loaded).toBeGreaterThanOrEqual(seen[i - 1].loaded);

    const second = await downloadDeviceVoice({ files: FILES, fetchImpl: net.fetchImpl, cachesImpl: api });
    expect(second).toMatchObject({ ok: true, fetched: 0 });
    expect(net.calls).toHaveLength(3);
    expect(await cachedState('male', { cachesImpl: api, files: FILES })).toMatchObject({ config: true, model: true, runtime: true });
    // Nothing left to size once it is all here.
    expect(await measureDownloadSize({ files: FILES, fetchImpl: net.fetchImpl, cachesImpl: api })).toBe(0);
  });

  it('progress is a percentage only against the size measured up front (never 100% of a partial total)', async () => {
    const all = CONFIG.length + MODEL.length + WASM.length;
    const seen = [];
    await downloadDeviceVoice({ files: FILES, fetchImpl: network().fetchImpl, cachesImpl: memoryCaches().api, expectedBytes: all, onProgress: (p) => seen.push(p) });
    expect(seen[0]).toMatchObject({ file: 'config', total: all, exact: true }); // the 5 KB config arrives first
    expect(seen[0].loaded / seen[0].total).toBeLessThan(0.01);
    const blind = [];
    await downloadDeviceVoice({ files: FILES, fetchImpl: network().fetchImpl, cachesImpl: memoryCaches().api, onProgress: (p) => blind.push(p) });
    expect(blind.every((p) => p.exact === false)).toBe(true);
    const size = await measureDownloadSize({ files: FILES, fetchImpl: network().fetchImpl, cachesImpl: memoryCaches().api });
    expect(size).toBe(all);
  });

  it('speaking reads only the cache: no fetch at all, and a real audio url back', async () => {
    const { api } = memoryCaches();
    const net = network();
    // Seed through the real download path, under the app's own keys.
    const appFiles = deviceVoiceFiles('male').map((f, i) => ({ ...f, url: FILES[i].url }));
    await downloadDeviceVoice({ files: appFiles, fetchImpl: net.fetchImpl, cachesImpl: api });
    const before = net.calls.length;
    const globalFetch = globalThis.fetch;
    let stray = 0;
    globalThis.fetch = async () => { stray++; throw new Error('network used'); };
    try {
      const w = fakeWorker();
      const r = await synthesizeOnDevice({ text: 'In the beginning was the Word.', cachesImpl: api, workerFactory: () => w });
      expect(r.url).toMatch(/^blob:/);
      expect(r.audioSeconds).toBeCloseTo(0.2);
      const again = await synthesizeOnDevice({ text: 'And the Word was with God.', cachesImpl: api, workerFactory: () => w });
      expect(again.url).toMatch(/^blob:/);
      expect(w.posted).toEqual(['init', 'speak', 'speak']); // the model loads once
    } finally {
      globalThis.fetch = globalFetch;
    }
    expect(stray).toBe(0);
    expect(net.calls.length).toBe(before);
  });

  it('before the download, speaking says so and still touches no network', async () => {
    const { api } = memoryCaches();
    const r = await synthesizeOnDevice({ text: 'Hello.', cachesImpl: api, workerFactory: () => { throw new Error('no worker should start'); } });
    expect(r).toEqual({ error: 'device-voice-not-downloaded' });
    expect(await synthesizeOnDevice({ text: '  ' })).toEqual({ error: 'empty-text' });
  });

  it('a host that answers with an HTML page is refused, and nothing is kept', async () => {
    const { api, stores } = memoryCaches();
    const html = new TextEncoder().encode('<!doctype html><title>404</title>' + ' '.repeat(2e6));
    const fetchImpl = async (url) => new Response(url.endsWith('.onnx') ? html : url.endsWith('.json') ? new TextEncoder().encode(CONFIG) : WASM, { status: 200 });
    const r = await downloadDeviceVoice({ files: FILES, fetchImpl, cachesImpl: api });
    expect(r).toMatchObject({ error: 'invalid:model' });
    const kept = stores.get(DEVICE_VOICE_CACHE);
    expect(kept.has(FILES[1].key)).toBe(false);
    expect(validateFile('runtime', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]))).toMatch(/not a WebAssembly/);
    expect(validateFile('config', new TextEncoder().encode('{}'))).toMatch(/Piper/);
  });
});

describe('sw.js keeps the device voice across deploys', () => {
  function activateWith(keys) {
    const src = readRel('public/sw.js');
    const listeners = {};
    const deleted = [];
    const cachesApi = { keys: async () => keys, delete: async (k) => { deleted.push(k); return true; }, open: async () => ({}), match: async () => undefined };
    const selfMock = { location: { origin: 'https://poetech.us' }, addEventListener: (t, fn) => { listeners[t] = fn; }, skipWaiting() {}, clients: { claim: () => Promise.resolve() } };
    new Function('self', 'caches', 'fetch', 'Request', 'URL', src)(selfMock, cachesApi, async () => ({}), function R() {}, URL);
    let p;
    listeners.activate({ waitUntil: (x) => { p = x; } });
    return p.then(() => deleted);
  }
  it('drops old deploy caches but never the kept voice cache', async () => {
    const deleted = await activateWith(['poetech-oldsha', DEVICE_VOICE_CACHE, 'poetech-__SW_VERSION__']);
    expect(deleted).toContain('poetech-oldsha');
    expect(deleted).not.toContain(DEVICE_VOICE_CACHE);
    expect(DEVICE_VOICE_CACHE.startsWith('poetech-keep-')).toBe(true);
  });
});
