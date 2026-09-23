// =============================================================================
// voice-service — every call is BOUNDED and the studio is ASKED, not assumed
// (DR-0440). Darrell 2026-09-16: "I want to be able to add my voice... make
// sure that that works." Two defects stood between a configured studio and an
// honest one: no request timeout (a hung studio hung the read for ever) and a
// readiness check that only looked at config (a mistyped URL read as armed).
// PROVEN-TO-CATCH: each case fails against the pre-DR-0440 module.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  synthesizeSpeech, probeVoiceService, voiceServiceHealth, isVoiceServiceAnswering, isVoiceServiceReady,
  resetVoiceServiceHealthForTests, resetBuiltInVoiceProbe, SPEAK_TIMEOUT_MS, HEALTH_TIMEOUT_MS, HEALTH_CACHE_MS,
} from '../lib/voice-service.js';

const realFetch = globalThis.fetch;
const realURL = globalThis.URL.createObjectURL;
beforeEach(() => {
  resetVoiceServiceHealthForTests(); resetBuiltInVoiceProbe();
  globalThis.URL.createObjectURL = () => 'blob:fake';
  import.meta.env.VITE_VOICE_SERVICE_URL = 'https://voice.example/';
});
afterEach(() => {
  globalThis.fetch = realFetch; globalThis.URL.createObjectURL = realURL;
  delete import.meta.env.VITE_VOICE_SERVICE_URL;
  resetVoiceServiceHealthForTests(); vi.useRealTimers();
});
const hang = (opts) => new Promise((_, rej) => { if (opts && opts.signal) opts.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))); });

describe('the speak request is bounded', () => {
  it('the bounds are explicit and sane', () => {
    expect(SPEAK_TIMEOUT_MS).toBeGreaterThanOrEqual(10000);
    expect(HEALTH_TIMEOUT_MS).toBeGreaterThan(0);
    expect(HEALTH_TIMEOUT_MS).toBeLessThan(SPEAK_TIMEOUT_MS);
  });
  it('PROVEN-TO-CATCH: a studio that never answers returns voice-service-timeout at the bound instead of hanging', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn((_u, opts) => hang(opts));
    const p = synthesizeSpeech({ text: 'hello', referenceDataUri: 'data:audio/webm;base64,AAAA', timeoutMs: 50 });
    await vi.advanceTimersByTimeAsync(60);
    expect(await p).toEqual({ error: 'voice-service-timeout' });
  });
  it("the caller's own abort still cancels the request and is not reported as a timeout", async () => {
    globalThis.fetch = vi.fn((_u, opts) => hang(opts));
    const ac = new AbortController();
    const p = synthesizeSpeech({ text: 'hello', referenceDataUri: 'data:audio/webm;base64,AAAA', signal: ac.signal, timeoutMs: 10000 });
    ac.abort();
    const r = await p;
    expect(r.error).toBeTruthy();
    expect(r.error).not.toBe('voice-service-timeout');
  });
  it('a normal answer is untouched by the bound', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, blob: async () => ({ size: 10 }) }));
    expect(await synthesizeSpeech({ text: 'hello', referenceDataUri: 'data:audio/webm;base64,AAAA' })).toEqual({ url: 'blob:fake' });
  });
});

describe('the studio is asked whether it answers', () => {
  it('NO ORIGIN AT ALL → unknown, and no request is made', async () => {
    // This used to be the "unconfigured" case: clear VITE_VOICE_SERVICE_URL and
    // there was no endpoint to probe. /voice being a same-origin route deleted
    // that state — the URL is now derived from window.location, so a browser
    // ALWAYS has one. What is left is the case the derivation itself cannot
    // serve: no window (a node/SSR import, a worker without location). It still
    // must not invent an endpoint, and it must not report a guess as health.
    delete import.meta.env.VITE_VOICE_SERVICE_URL;
    const realWindow = globalThis.window;
    delete globalThis.window;
    globalThis.fetch = vi.fn();
    try {
      expect(await probeVoiceService()).toBe('unknown');
      expect(globalThis.fetch, 'it probed something it had to invent').not.toHaveBeenCalled();
      expect(isVoiceServiceAnswering()).toBe(false);
    } finally {
      globalThis.window = realWindow;
    }
  });

  it('and IN a browser there is always an endpoint — the probe really runs', async () => {
    // The other half, so the test above cannot be read as "the probe is off by
    // default". Without an override the same-origin road is probed, which is
    // the behaviour a Fire TV depends on: nobody types a URL into a television.
    delete import.meta.env.VITE_VOICE_SERVICE_URL;
    resetVoiceServiceHealthForTests();
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    expect(await probeVoiceService({ force: true })).toBe('up');
    expect(String(globalThis.fetch.mock.calls[0][0])).toBe(window.location.origin + '/voice/health');
  });
  it('GET {base}/health ok → up; the reader may trust it', async () => {
    globalThis.fetch = vi.fn(async (u) => ({ ok: u === 'https://voice.example/health', json: async () => ({ ok: true }) }));
    expect(await probeVoiceService()).toBe('up');
    expect(globalThis.fetch.mock.calls[0][0]).toBe('https://voice.example/health');
    expect(isVoiceServiceReady()).toBe(true);
    expect(isVoiceServiceAnswering()).toBe(true);
  });
  it('PROVEN-TO-CATCH: a 200 that is not the studio\'s own {ok:true} reads as down — n8n\'s page answered /voice/health for three days (2026-09-23)', async () => {
    // What the runner measured: HTTP 200, text/html, "n8n.io - workflow automation".
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } }));
    expect(await probeVoiceService({ force: true })).toBe('down');
    // A JSON body that is not the studio's answer.
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ message: 'no route matched' }) }));
    expect(await probeVoiceService({ force: true })).toBe('down');
    // The forwarder's dark-studio answer: 502 with ok:false.
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 502, json: async () => ({ ok: false, error: 'studio-unreachable' }) }));
    expect(await probeVoiceService({ force: true })).toBe('down');
    expect(isVoiceServiceAnswering()).toBe(false);
  });
  it('PROVEN-TO-CATCH: a non-ok answer, a thrown fetch, or a hang all read as down — configured is not the same as alive', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 502 }));
    expect(await probeVoiceService({ force: true })).toBe('down');
    globalThis.fetch = vi.fn(async () => { throw new Error('ECONNREFUSED'); });
    expect(await probeVoiceService({ force: true })).toBe('down');
    vi.useFakeTimers();
    globalThis.fetch = vi.fn((_u, opts) => hang(opts));
    const p = probeVoiceService({ force: true, timeoutMs: 30 });
    await vi.advanceTimersByTimeAsync(40);
    expect(await p).toBe('down');
    expect(isVoiceServiceReady()).toBe(true);      // still configured…
    expect(isVoiceServiceAnswering()).toBe(false); // …but not to be trusted
    expect(voiceServiceHealth()).toBe('down');
  });
  it('the answer is cached for a minute, and force re-asks', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true }));
    await probeVoiceService(); await probeVoiceService();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    await probeVoiceService({ force: true });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(HEALTH_CACHE_MS).toBeGreaterThan(0);
  });
});
