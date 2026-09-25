// =============================================================================
// The default voice reaches the church's own studio, not just a cloned one
// =============================================================================
// DR-0382. Darrell 2026-09-13: "can we get close to humans when talking or do
// we still have to sound like a computer no offense?"
//
// Shaping the text (DR-0381) fixed the RHYTHM. This is the TIMBRE, and the
// blocker was one hardcoded word: voice-service.js declared needsReference:true
// on every endpoint, which made the studio clone-only BY CONSTRUCTION. The
// System voice — the default nobody changes — could never reach it, so a church
// running its own sovereign voice studio still heard Android's built-in engine
// on every lesson.
//
// Whether a given /speak deployment can serve a built-in speaker is NOT
// knowable from this repo, so it is discovered by asking once and remembered.
// Guessing yes ships a broken feature; guessing no ships the robot forever.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  synthesizeSpeech, builtInVoiceSupport, resetBuiltInVoiceProbe, activeVoiceEndpoint,
} from '../lib/voice-service.js';

const realFetch = globalThis.fetch;
const realURL = globalThis.URL.createObjectURL;

beforeEach(() => {
  resetBuiltInVoiceProbe();
  globalThis.URL.createObjectURL = () => 'blob:fake';
  import.meta.env.VITE_VOICE_SERVICE_URL = 'https://voice.example/';
});
afterEach(() => {
  globalThis.fetch = realFetch;
  globalThis.URL.createObjectURL = realURL;
  delete import.meta.env.VITE_VOICE_SERVICE_URL;
  resetBuiltInVoiceProbe();
});

const ok = () => Promise.resolve({ ok: true, blob: async () => ({ size: 10 }) });
const bad = () => Promise.resolve({ ok: false, status: 400, blob: async () => ({ size: 0 }) });

describe('a cloned voice still REQUIRES its sample', () => {
  it('refuses without a reference when the caller did not ask for built-in', async () => {
    globalThis.fetch = vi.fn(ok);
    const r = await synthesizeSpeech({ text: 'hello' });
    expect(r.error).toBe('no-voice-sample');
    expect(globalThis.fetch).not.toHaveBeenCalled(); // never spends a round trip
  });

  it('a person read is unchanged — a missing sample is still a real error', async () => {
    globalThis.fetch = vi.fn(ok);
    const r = await synthesizeSpeech({ text: 'hello', personKey: 'darrell' });
    expect(r.error).toBe('no-voice-sample');
  });
});

describe('the System voice may ask for the studio’s OWN voice', () => {
  it('sends the request with no reference when allowBuiltIn is set', async () => {
    globalThis.fetch = vi.fn(ok);
    const r = await synthesizeSpeech({ text: 'hello', allowBuiltIn: true });
    expect(r.url).toBe('blob:fake');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(body.reference_audio).toBeNull();
    expect(body.text).toBe('hello');
  });

  it('reaches the SOVEREIGN endpoint, which outranks the bridge (DR-0138)', () => {
    expect(activeVoiceEndpoint()).toMatchObject({ kind: 'sovereign' });
  });
});

describe('what this deployment can do is DISCOVERED, never assumed', () => {
  it('starts as unknown — never reported as yes before it is known', () => {
    expect(builtInVoiceSupport()).toBe('unknown');
  });

  it('a success records yes', async () => {
    globalThis.fetch = vi.fn(ok);
    await synthesizeSpeech({ text: 'hi', allowBuiltIn: true });
    expect(builtInVoiceSupport()).toBe('yes');
  });

  it('a refusal records no — and the round trip is never paid again', async () => {
    globalThis.fetch = vi.fn(bad);
    const first = await synthesizeSpeech({ text: 'hi', allowBuiltIn: true });
    expect(first.error).toMatch(/voice-service-400/);
    expect(builtInVoiceSupport()).toBe('no');

    globalThis.fetch = vi.fn(ok); // even if it would now succeed
    const second = await synthesizeSpeech({ text: 'hi', allowBuiltIn: true });
    expect(second.error).toBe('no-builtin-voice');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('a thrown request records no rather than retrying forever', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('offline')));
    await synthesizeSpeech({ text: 'hi', allowBuiltIn: true });
    expect(builtInVoiceSupport()).toBe('no');
  });

  it('an empty clip counts as a refusal, not as audio', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, blob: async () => ({ size: 0 }) }));
    const r = await synthesizeSpeech({ text: 'hi', allowBuiltIn: true });
    expect(r.error).toBe('voice-service-empty');
    expect(builtInVoiceSupport()).toBe('no');
  });

  it('a CLONE failure never teaches us anything about built-in support', async () => {
    globalThis.fetch = vi.fn(bad);
    await synthesizeSpeech({ text: 'hi', referenceDataUri: 'data:audio/wav;base64,AA' });
    expect(builtInVoiceSupport()).toBe('unknown');
  });
});

describe('THERE IS NO LONGER A "NOT CONFIGURED" STATE, and that is the point', () => {
  // This block used to assert that clearing VITE_VOICE_SERVICE_URL produced
  // `voice-service-not-configured` and made no request at all. That was true
  // and is now false, deliberately: /voice is a SAME-ORIGIN route derived from
  // window.location, so every device has an endpoint without a build variable,
  // a per-device setting or a steward's one-time enable. Darrell asked for the
  // reading voice on a Fire TV he had just plugged in; a feature that needs an
  // environment variable typed somewhere is not an answer to that.
  //
  // What replaces the old assertion is the thing that actually protects the
  // reader: the call is MADE, and when it fails the caller is handed a tagged
  // error rather than an exception, so the device voice still speaks.
  it('with no override, the call goes to the same-origin /voice route', async () => {
    delete import.meta.env.VITE_VOICE_SERVICE_URL;
    globalThis.fetch = vi.fn(ok);
    await synthesizeSpeech({ text: 'hi', allowBuiltIn: true });
    expect(globalThis.fetch).toHaveBeenCalled();
    const url = String(globalThis.fetch.mock.calls[0][0]);
    expect(url, 'the default endpoint is not the same-origin /voice road').toContain('/voice/speak');
    expect(url.startsWith(window.location.origin), 'the endpoint left this origin').toBe(true);
  });

  it('a studio that refuses returns a TAGGED error, never a throw', async () => {
    // The whole safety of the fall-back-to-device-voice path: use-read-aloud
    // checks `r.error` and keeps reading. An exception here would take the tap
    // handler down and the reader would get silence with no explanation.
    delete import.meta.env.VITE_VOICE_SERVICE_URL;
    globalThis.fetch = vi.fn(async () => { throw new Error('ECONNREFUSED'); });
    const r = await synthesizeSpeech({ text: 'hi', allowBuiltIn: true });
    expect(r && r.error, 'a dark studio did not produce a tagged error').toBeTruthy();
  });
});

describe('the reader wires it up', () => {
  it('the System-voice path asks for built-in and falls through on failure', async () => {
    const { readFileSync } = await import('node:fs');
    const path = await import('node:path');
    const code = readFileSync(path.resolve(__dirname, '../lib/use-read-aloud.js'), 'utf8');
    expect(code).toMatch(/isSystemVoiceId\(voiceId\)\s*&&\s*sovereignVoiceReady/);
    expect(code).toMatch(/allowBuiltIn:\s*true/);
    // The fall-through IS the safety: a refused built-in never early-returns,
    // so the device voice below still speaks. Sounding better or the same —
    // never worse, and never silent.
    expect(code).toMatch(/builtInVoiceSupport\(\)\s*!==\s*'no'/);
    // DR-0654: the clip's error goes through the ONE hand-off to the device
    // voice, which silences the audio first and speaks in the reading's
    // pinned voice; that hand-off still ends in tts.speak.
    expect(code).toMatch(/a\.onerror[\s\S]{0,200}deviceRestRef\.current\(/);
    expect(code).toMatch(/deviceRestRef\.current = async \(rest, reason\) => \{[\s\S]{0,2000}tts\.speak\(rest, pick\.uri\)/);
  });
});

describe('the sovereign road carries the family key, and the bridge never does', () => {
  // The NAS-side forwarder gates /speak on the family bridge bearer. The app
  // already holds that token for photos and taxes (localStorage
  // "poetech-chat-bridge-token", provisioned by the 0128 RPC); the same value
  // must ride the voice call, and must NOT ride the vendor bridge, which is a
  // Pages Function with its own server-side secret.
  const KEY = 'poetech-chat-bridge-token';
  afterEach(() => { try { localStorage.removeItem(KEY); } catch (_) { /* jsdom */ } });

  it('sends Authorization: Bearer <token> to the same-origin /voice/speak when the device has it', async () => {
    delete import.meta.env.VITE_VOICE_SERVICE_URL;
    localStorage.setItem(KEY, 'family-token-abc');
    globalThis.fetch = vi.fn(ok);
    await synthesizeSpeech({ text: 'hi', allowBuiltIn: true });
    const [url, init] = globalThis.fetch.mock.calls[0];
    expect(String(url)).toContain('/voice/speak');
    expect(init.headers.Authorization).toBe('Bearer family-token-abc');
  });

  it('sends NO Authorization header when the device has no token -- the forwarder 401s, the app falls back', async () => {
    delete import.meta.env.VITE_VOICE_SERVICE_URL;
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 401, blob: async () => ({ size: 0 }) }));
    const r = await synthesizeSpeech({ text: 'hi', allowBuiltIn: true });
    const [, init] = globalThis.fetch.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
    expect(r.error).toBe('voice-service-401');
  });

  it('PROVEN-TO-CATCH: the vendor bridge never receives the family token', async () => {
    delete import.meta.env.VITE_VOICE_SERVICE_URL;
    localStorage.setItem(KEY, 'family-token-abc');
    // Force the bridge: no window origin means no sovereign URL, and the
    // bridge flag on.
    const realWindow = globalThis.window;
    import.meta.env.VITE_VOICE_BRIDGE = '1';
    delete globalThis.window;
    globalThis.fetch = vi.fn(ok);
    try {
      await synthesizeSpeech({ text: 'hi', allowBuiltIn: true });
      const [url, init] = globalThis.fetch.mock.calls[0];
      expect(String(url)).toBe('/api/voice-speak');
      expect(init.headers.Authorization, 'the family bearer leaked to the vendor bridge').toBeUndefined();
    } finally {
      globalThis.window = realWindow;
      delete import.meta.env.VITE_VOICE_BRIDGE;
    }
  });
});
