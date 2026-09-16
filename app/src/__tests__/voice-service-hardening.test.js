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
  it('unconfigured → unknown, and no request is made', async () => {
    delete import.meta.env.VITE_VOICE_SERVICE_URL;
    globalThis.fetch = vi.fn();
    expect(await probeVoiceService()).toBe('unknown');
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(isVoiceServiceAnswering()).toBe(false);
  });
  it('GET {base}/health ok → up; the reader may trust it', async () => {
    globalThis.fetch = vi.fn(async (u) => ({ ok: u === 'https://voice.example/health' }));
    expect(await probeVoiceService()).toBe('up');
    expect(globalThis.fetch.mock.calls[0][0]).toBe('https://voice.example/health');
    expect(isVoiceServiceReady()).toBe(true);
    expect(isVoiceServiceAnswering()).toBe(true);
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
