// @vitest-environment jsdom
// =============================================================================
// The man's voice is kept on the phone by itself, on wifi (DR-1494)
// =============================================================================
// Darrell, 2026-11-13, rendered for meaning (DR-0331): the man's voice stays
// the same from the start of a reading to its end, every time. DR-1254 left
// open whether to keep the Piper man's voice (about 63 MB) on first use;
// DR-1482 held the reading rather than switch, and offered a button. Settled:
// keep it automatically, but only on a connection known to be unmetered.
//
//   1. wifi + not yet kept      -> the download starts, once per session
//   2. cellular                 -> no download
//   3. no navigator.connection  -> no download (unknown is never unmetered)
//   4. Save-Data on             -> no download
//   5. already kept             -> no download
//   6. kept, then a NAS piece fails -> the rest is the man's voice on the
//      phone: no hold, no woman's voice
//
// PROVEN TO CATCH: run against origin/main (c5f2ec387ae) before the change,
// cases 1 and 6 fail (no download is ever started; the hand-off reads a
// kept-voice phone's rest without naming the man's voice); the others are
// guards that must stay green. Recorded in DR-1494.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const family = vi.hoisted(() => ({ key: null }));
// The phone's Piper voice, as the test sets it.
const dv = vi.hoisted(() => ({ state: 'downloadable', checks: [], downloads: [], synth: [] }));
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    rpc: async (name) => (name === 'get_family_bridge_token' ? { data: family.key, error: null } : { data: null, error: null }),
    auth: {
      getUser: async () => ({ data: { user: null } }),
      updateUser: async () => ({ data: null, error: null }),
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
  },
}));
vi.mock('../lib/voice-sync.js', () => ({ loadVoiceProfiles: async () => ({ profiles: [] }) }));
vi.mock('../lib/voice-service.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, isVoiceServiceReady: () => false, mayAttemptStudio: () => false, probeVoiceService: async () => 'down', voiceServiceHealth: () => 'down' };
});
vi.mock('../lib/device-voice.js', async (importOriginal) => {
  const real = await importOriginal();
  // The real checkDeviceVoice answers with a `cached` OBJECT (always truthy)
  // beside its state; the fake answers in the same shape.
  const cached = () => {
    const k = dv.state === 'ready';
    return { config: k, model: k, runtime: k, bytes: 0 };
  };
  return {
    ...real,
    checkDeviceVoice: async (o = {}) => {
      dv.checks.push(o);
      return { state: dv.state, reason: '', cached: cached(), freeBytes: null };
    },
    downloadDeviceVoice: async (o = {}) => {
      dv.downloads.push(o);
      return { ok: true, bytes: 63e6, fetched: 3 };
    },
    synthesizeOnDevice: async (o = {}) => {
      dv.synth.push(o);
      if (dv.state !== 'ready') return { error: 'device-voice-not-downloaded' };
      return { url: 'blob:device', blob: { size: 3200, type: 'audio/wav' }, format: 'wav', engine: 'device-voice', ms: 100, audioSeconds: 2 };
    },
  };
});

import { useReadAloud, _resetDeviceVoiceFallback } from '../lib/use-read-aloud.js';
import { connectionIsUnmetered, keepVoiceOnWifi, _resetKeepVoiceOnWifi } from '../lib/keep-voice-on-wifi.js';
import { _resetLiteVoiceForTests } from '../lib/voice-service.js';
import { _setDeviceClipCacheForTests } from '../lib/clip-cache.js';
import { CHAT_BRIDGE_TOKEN_KEY } from '../lib/nas-photos.js';
import { saveReadingVoiceId } from '../lib/reading-voice.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const WOMAN = { name: 'English (United States) Female', voiceURI: 'en-us-female', lang: 'en-US', localService: true };
const WOMAN2 = { name: 'English (United Kingdom) Female', voiceURI: 'en-gb-female', lang: 'en-GB', localService: true };
const LESSON =
  'In the beginning was the Word. And the Word was with God. And the Word was God. The same was in the beginning with God. All things were made by Him. And without Him was not any thing made that was made. In Him was life. And the life was the light of men.';

const flush = async (n = 8) => {
  for (let i = 0; i < n; i += 1)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
};

class Utt {
  constructor(t) {
    this.text = t;
    this.voice = null;
    this.lang = '';
  }
}
const road = { calls: [], answer: null };
function voiceLiteFetch(url, init) {
  if (!String(url).includes('/voice-lite/')) return Promise.resolve({ ok: false, status: 404, headers: { get: () => null } });
  const body = JSON.parse(init.body);
  road.calls.push({ voice: body.voice, text: body.text });
  const status = road.answer ? road.answer({ n: road.calls.length, body }) : 200;
  return Promise.resolve({
    ok: status === 200,
    status,
    headers: { get: (k) => (k.toLowerCase() === 'content-type' ? (status === 200 ? 'audio/wav' : 'application/json') : null) },
    blob: async () => ({ size: 3200 }),
  });
}
const media = { plays: [] };
function installMedia() {
  window.HTMLMediaElement.prototype.play = function play() {
    media.plays.push({ blob: String(this.src || '').startsWith('blob:'), el: this });
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function pause() {};
  window.HTMLMediaElement.prototype.load = function load() {};
}
function installPhone(voices) {
  const s = {
    spoken: [],
    speaking: false,
    paused: false,
    pending: false,
    speak(u) {
      s.spoken.push(u);
      s.speaking = true;
      if (u.onstart) u.onstart();
    },
    cancel() {
      s.speaking = false;
    },
    pause() {},
    resume() {},
    getVoices() {
      return [...voices];
    },
    addEventListener() {},
    removeEventListener() {},
    onvoiceschanged: null,
  };
  window.speechSynthesis = s;
  window.SpeechSynthesisUtterance = Utt;
  return s;
}
function setConnection(c) {
  if (c === undefined) {
    try {
      delete navigator.connection;
    } catch (_) {
      /* not own */
    }
    Object.defineProperty(navigator, 'connection', { configurable: true, get: () => undefined });
    return;
  }
  Object.defineProperty(navigator, 'connection', { configurable: true, get: () => c });
}

// =============================================================================
describe('unmetered is measured, never assumed', () => {
  it('wifi and ethernet are unmetered; Save-Data, cellular, other and absent are not', () => {
    expect(connectionIsUnmetered({ connection: { type: 'wifi' } })).toBe(true);
    expect(connectionIsUnmetered({ connection: { type: 'ethernet', saveData: false } })).toBe(true);
    expect(connectionIsUnmetered({ connection: { type: 'wifi', saveData: true } })).toBe(false);
    expect(connectionIsUnmetered({ connection: { type: 'cellular' } })).toBe(false);
    expect(connectionIsUnmetered({ connection: { type: 'unknown' } })).toBe(false);
    // Chrome desktop reports only effectiveType: no type is unknown, not wifi.
    expect(connectionIsUnmetered({ connection: { effectiveType: '4g' } })).toBe(false);
    expect(connectionIsUnmetered({})).toBe(false);
    expect(connectionIsUnmetered(undefined)).toBe(false);
  });

  it('keepVoiceOnWifi: never for a woman’s reading, and once per session for a man’s', async () => {
    _resetKeepVoiceOnWifi();
    const downloads = [];
    const nav = { connection: { type: 'wifi' } };
    const check = async () => ({ state: 'downloadable' });
    const download = async (o) => {
      downloads.push(o);
      return { error: 'http-503:model' };
    };
    const notes = [];
    const note = (k, d) => notes.push([k, d]);
    expect((await keepVoiceOnWifi({ voice: 'female', nav, check, download, note })).skipped).toBe('not-the-man');
    const first = await keepVoiceOnWifi({ voice: 'male', nav, check, download, note });
    expect(first.started).toBe(true);
    await first.done;
    expect((await keepVoiceOnWifi({ voice: 'male', nav, check, download, note })).skipped).toBe('once');
    expect(downloads).toEqual([{ voice: 'male' }]);
    // A failed keep is silent to the reading, and written to the trip.
    expect(notes.map(([k]) => k)).toEqual(['keep-voice', 'keep-voice']);
    expect(notes[1][1]).toEqual({ error: 'http-503:model' });
  });

  it('a metered check does not use up the session’s one keep', async () => {
    _resetKeepVoiceOnWifi();
    const downloads = [];
    const check = async () => ({ state: 'downloadable' });
    const download = async (o) => (downloads.push(o), { ok: true, bytes: 1 });
    expect((await keepVoiceOnWifi({ voice: 'male', nav: { connection: { type: 'cellular' } }, check, download })).skipped).toBe('not-unmetered');
    const r = await keepVoiceOnWifi({ voice: 'male', nav: { connection: { type: 'wifi' } }, check, download });
    await r.done;
    expect(downloads.length).toBe(1);
  });
});

// =============================================================================
describe('the reader keeps the man’s voice on the phone, on wifi only', () => {
  let container;
  let root;
  let api;
  function Probe() {
    api = useReadAloud({ isOwner: true });
    return null;
  }
  beforeEach(async () => {
    localStorage.clear();
    family.key = 'fam-key';
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'fam-key');
    // His pick is a man's voice; the NAS man's voice reads it meanwhile.
    saveReadingVoiceId('person:darrell');
    road.calls = [];
    road.answer = null;
    media.plays = [];
    dv.state = 'downloadable';
    dv.checks = [];
    dv.downloads = [];
    dv.synth = [];
    _resetLiteVoiceForTests();
    _resetDeviceVoiceFallback();
    if (_resetKeepVoiceOnWifi) _resetKeepVoiceOnWifi();
    _setDeviceClipCacheForTests(null);
    globalThis.fetch = vi.fn(voiceLiteFetch);
    URL.createObjectURL = () => `blob:clip-${Math.random().toString(36).slice(2, 8)}`;
    URL.revokeObjectURL = () => {};
    installMedia();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
    setConnection(undefined);
  });
  async function mount() {
    await act(async () => root.render(createElement(Probe)));
    await flush();
  }
  async function readOnce() {
    api.claimAudio('Lesson');
    const reading = api.read(LESSON, { title: 'Lesson' });
    await act(async () => {
      await reading;
    });
    await flush();
  }
  async function stopAndReadAgain() {
    await act(async () => {
      api.stop();
    });
    await flush();
    await readOnce();
  }
  async function playOn(times = 4) {
    for (let i = 0; i < times; i += 1) {
      const el = media.plays.filter((p) => p.blob).at(-1);
      if (el && el.el.onended)
        await act(async () => {
          el.el.onended();
        });
      await flush();
    }
  }

  it('1. on wifi, with the man’s voice not yet kept, the download starts, once per session', async () => {
    installPhone([WOMAN, WOMAN2]);
    setConnection({ type: 'wifi', saveData: false });
    await mount();
    await readOnce();
    await stopAndReadAgain();
    expect(dv.downloads.length, 'the man’s voice was not kept on wifi').toBe(1);
    expect(dv.downloads[0].voice).toBe('male');
  });

  it('2. on cellular, nothing is downloaded', async () => {
    installPhone([WOMAN, WOMAN2]);
    setConnection({ type: 'cellular', saveData: false, effectiveType: '4g' });
    await mount();
    await readOnce();
    expect(dv.downloads.length).toBe(0);
  });

  it('3. with no navigator.connection (iOS Safari), nothing is downloaded', async () => {
    installPhone([WOMAN, WOMAN2]);
    setConnection(undefined);
    await mount();
    await readOnce();
    expect(dv.downloads.length).toBe(0);
  });

  it('4. on wifi with Save-Data on, nothing is downloaded', async () => {
    installPhone([WOMAN, WOMAN2]);
    setConnection({ type: 'wifi', saveData: true });
    await mount();
    await readOnce();
    expect(dv.downloads.length).toBe(0);
  });

  it('5. on wifi, with the man’s voice already kept, nothing is downloaded', async () => {
    installPhone([WOMAN, WOMAN2]);
    setConnection({ type: 'wifi' });
    dv.state = 'ready';
    await mount();
    await readOnce();
    expect(dv.downloads.length).toBe(0);
  });

  it('6. kept on the phone, a NAS failure is read on by the same man’s voice: no hold, no woman’s voice', async () => {
    const phone = installPhone([WOMAN, WOMAN2]);
    setConnection(undefined);
    dv.state = 'ready';
    await mount();
    road.answer = ({ n }) => (n === 1 ? 200 : 404);
    await readOnce();
    await playOn(10);
    expect(road.calls[0].voice).toBe('male');
    expect(phone.spoken.length, 'a woman’s voice took the man’s reading').toBe(0);
    expect(api.notice || '').not.toMatch(/waits here/);
    expect(dv.synth.length, 'the kept voice on the phone was never asked').toBeGreaterThan(0);
    for (const s of dv.synth) expect(s.voice, 'the phone’s Piper must be asked for the reading’s own voice').toBe('male');
  });
});
