// @vitest-environment jsdom
// =============================================================================
// The Firestick reads aloud, and every reading keeps ONE voice (DR-0654)
// =============================================================================
// Darrell 2026-09-25, on his Fire TV Stick in Silk, The Love Corner -> Learn ->
// Living Lessons, "Read this lesson": the panel said "This device has no voice
// of its own, and the church's voice service did not answer" and nothing was
// heard. The NAS voice was up (voice-lite-probe run 36079165210, 1 s through
// poetech.us). Measured in Chromium at 960x540 with no device voices and a
// family key waiting at the RPC: the System voice's /voice-lite request went
// out with NO Authorization header, the NAS answered 401, and the notice
// blamed the studio.
//
// The same evening, on his Android phone: "stopped working in the background"
// and "Reading with two voices at times and the voices change on their own at
// times... female to male etc.. different female voices."
//
// These tests drive the REAL hook (use-read-aloud.js) with the REAL
// synthesizeLite and clip queue, a fetch shaped like /voice-lite, and a
// speechSynthesis shaped like each device. Every one fails on the code before
// this record (checked against origin/main's use-read-aloud.js and
// voice-service.js).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const family = vi.hoisted(() => ({ key: null }));
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    rpc: async (name) => (name === 'get_family_bridge_token' ? { data: family.key, error: null } : { data: null, error: null }),
    auth: {
      getUser: async () => ({ data: { user: null } }),
      updateUser: async () => ({ data: null, error: null }),
    },
  },
}));
vi.mock('../lib/voice-sync.js', () => ({ loadVoiceProfiles: async () => ({ profiles: [] }) }));
vi.mock('../lib/voice-service.js', async (importOriginal) => {
  const real = await importOriginal();
  // The GPU studio is dark tonight; only the NAS voice and the device remain.
  return { ...real, isVoiceServiceReady: () => false, mayAttemptStudio: () => false, probeVoiceService: async () => 'down', voiceServiceHealth: () => 'down' };
});

import { useReadAloud } from '../lib/use-read-aloud.js';
import { _resetLiteVoiceForTests, mayTryLiteVoice, liteVoiceReasonText, liteRestFor } from '../lib/voice-service.js';
import { CHAT_BRIDGE_TOKEN_KEY } from '../lib/nas-photos.js';
import { deviceVoiceForPin, newReadingPin } from '../lib/reading-voice-pin.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const LESSON = 'In the beginning was the Word. And the Word was with God. And the Word was God. The same was in the beginning with God. All things were made by Him. And without Him was not any thing made that was made. In Him was life. And the life was the light of men. And the light shineth in darkness; and the darkness comprehended it not.';

// ---- /voice-lite, as the NAS answers it -----------------------------------
const road = { calls: [], answer: null };
function voiceLiteFetch(url, init) {
  if (!String(url).includes('/voice-lite/')) return Promise.resolve({ ok: false, status: 404, headers: { get: () => null } });
  const auth = (init && init.headers && init.headers.Authorization) || '';
  const body = JSON.parse(init.body);
  road.calls.push({ auth, voice: body.voice, text: body.text });
  const n = road.calls.length;
  const status = road.answer ? road.answer({ auth, n, body }) : (auth === 'Bearer fam-key' ? 200 : 401);
  return Promise.resolve({
    ok: status === 200, status,
    headers: { get: (k) => (k.toLowerCase() === 'content-type' ? (status === 200 ? 'audio/wav' : 'application/json') : null) },
    blob: async () => ({ size: 3200 }),
  });
}

// ---- media: every play, and whether Web Speech was speaking at that moment --
const media = { plays: [], strict: false, gesture: false, overlaps: 0 };
let synth;
function installMedia() {
  window.HTMLMediaElement.prototype.play = function play() {
    const blob = String(this.src || '').startsWith('blob:');
    // A strict engine: a play() outside the tap is refused, unless this very
    // element was already started inside one (the Silk / iOS model).
    if (media.strict && !media.gesture && !(this.dataset && this.dataset.everPlayed === '1')) {
      media.plays.push({ blob, ok: false });
      return Promise.reject(new DOMException('play() can only be initiated by a user gesture', 'NotAllowedError'));
    }
    if (this.dataset) this.dataset.everPlayed = '1';
    if (blob && synth && synth.speaking) media.overlaps += 1;
    media.plays.push({ blob, ok: true, el: this });
    this._paused = false;
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function pause() { this._paused = true; };
  window.HTMLMediaElement.prototype.load = function load() {};
}

// ---- speechSynthesis shaped like each device --------------------------------
class FakeUtterance { constructor(t) { this.text = t; this.voice = null; this.lang = ''; this.rate = 1; this.pitch = 1; } }
function installSynth(voices) {
  const s = {
    spoken: [], speaking: false, paused: false, pending: false, cancels: 0,
    speak(u) { s.spoken.push(u); s.speaking = true; if (media.plays.some((p) => p.blob && p.ok && !p.el._paused)) media.overlaps += 1; if (u.onstart) u.onstart(); },
    cancel() { s.cancels += 1; s.speaking = false; },
    pause() {}, resume() {},
    getVoices() { return voices; },
    addEventListener() {}, removeEventListener() {},
    onvoiceschanged: null,
  };
  window.speechSynthesis = s;
  window.SpeechSynthesisUtterance = FakeUtterance;
  synth = s;
  return s;
}
const MAN = { name: 'English (United States) Male', voiceURI: 'en-us-male', lang: 'en-US', localService: true };
const WOMAN = { name: 'English (United States) Female', voiceURI: 'en-us-female', lang: 'en-US', localService: true };
const WOMAN2 = { name: 'English (United Kingdom) Female', voiceURI: 'en-gb-female', lang: 'en-GB', localService: true };

let container; let root; let api;
function Probe() { api = useReadAloud({ isOwner: true }); return null; }
const flush = async (n = 8) => { for (let i = 0; i < n; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
const setHidden = (hidden) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
  document.dispatchEvent(new Event('visibilitychange'));
};

beforeEach(async () => {
  localStorage.clear();
  family.key = null;
  road.calls = []; road.answer = null;
  media.plays = []; media.strict = false; media.gesture = false; media.overlaps = 0;
  _resetLiteVoiceForTests();
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
});

async function mount() {
  await act(async () => root.render(createElement(Probe)));
  await flush();
}
// The press: the claim happens inside the tap, the read continues after it.
async function press(text = LESSON) {
  media.gesture = true;
  api.claimAudio('Lesson');
  const reading = api.read(text, { title: 'Lesson' });
  media.gesture = false;
  await act(async () => { await reading; });
  await flush();
}

// =============================================================================
describe('THE FIRESTICK: Silk has speechSynthesis and no voices', () => {
  beforeEach(() => installSynth([]));

  it('a signed-in family device asks for the key BEFORE the first NAS piece, and the voice plays', async () => {
    family.key = 'fam-key';
    await mount();
    await press();
    expect(road.calls.length, 'the NAS voice was never asked').toBeGreaterThan(0);
    expect(road.calls[0].auth, 'the first /voice-lite request carried no key (the 401 on his Firestick)').toBe('Bearer fam-key');
    expect(localStorage.getItem(CHAT_BRIDGE_TOKEN_KEY)).toBe('fam-key');
    expect(media.plays.some((p) => p.blob && p.ok), 'no NAS clip played').toBe(true);
    expect(api.notice).toBe('');
  });

  it('a device the family does not recognise is told to sign in, never that the service "did not answer"', async () => {
    await mount();
    await press();
    expect(road.calls[0].auth).toBe('');
    expect(api.notice).toMatch(/signed-in family account/);
    expect(api.notice).not.toMatch(/did not answer/);
  });

  it('after signing in, the very next press asks the NAS voice again (a locked door is not a dark road)', async () => {
    await mount();
    await press();
    expect(mayTryLiteVoice()).toBe(false);
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'fam-key');
    expect(mayTryLiteVoice(), 'the new key did not reopen the road').toBe(true);
    await press();
    expect(media.plays.some((p) => p.blob && p.ok)).toBe(true);
  });

  it('the NAS voice plays through the element unlocked INSIDE the tap, on a strict-gesture engine', async () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'fam-key');
    media.strict = true;
    await mount();
    await press();
    const voice = media.plays.filter((p) => p.blob);
    expect(voice.length, 'no voice clip was even tried').toBeGreaterThan(0);
    expect(voice[0].ok, 'the first voice clip was refused: a fresh element was played after the gesture').toBe(true);
  });

  it('a play the screen refused says "press play once more" and does not rest the NAS voice', async () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'fam-key');
    await mount();
    window.HTMLMediaElement.prototype.play = function play() {
      if (String(this.src || '').startsWith('blob:')) return Promise.reject(new DOMException('no gesture', 'NotAllowedError'));
      return Promise.resolve();
    };
    await press();
    expect(api.notice).toMatch(/would not start the sound/);
    expect(mayTryLiteVoice(), 'a gesture refusal rested the voice for two minutes').toBe(true);
  });

  it('a dropped request is asked again before the reading gives up', async () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'fam-key');
    road.answer = ({ n }) => (n === 1 ? 502 : 200);
    await mount();
    await press();
    expect(road.calls.length).toBeGreaterThan(1);
    expect(media.plays.some((p) => p.blob && p.ok), 'one 502 ended the reading').toBe(true);
  });
});

// =============================================================================
describe('THE ANDROID PHONE: one voice at a time, the same voice all the way', () => {
  it('a hand-over from the phone voice to the NAS voice never speaks in two voices at once', async () => {
    const s = installSynth([MAN, WOMAN, WOMAN2]);
    await mount();
    // The NAS voice is resting, so the reading starts in the phone's voice.
    road.answer = () => 401;
    await press();
    expect(s.spoken.length, 'the phone voice never started').toBeGreaterThan(0);
    expect(s.speaking).toBe(true);
    // The road is back; the reading continues (a paragraph jump / the hand-over into the dark).
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'fam-key');
    _resetLiteVoiceForTests();
    road.answer = null;
    await act(async () => { await api.read(LESSON.slice(40)); });
    await flush();
    expect(media.plays.some((p) => p.blob && p.ok), 'the NAS voice did not take over').toBe(true);
    expect(media.overlaps, 'the NAS clip started while the phone voice was still speaking').toBe(0);
  });

  it('a NAS piece that fails hands the rest to a phone voice of the SAME gender, and says so', async () => {
    const s = installSynth([MAN, WOMAN, WOMAN2]);
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'fam-key');
    await mount();
    road.answer = ({ n }) => (n === 1 ? 200 : 404);
    await press();
    // Piece 1 ends; piece 2 (or 3) cannot be had.
    for (let i = 0; i < 4; i += 1) {
      const el = media.plays.filter((p) => p.blob && p.ok).at(-1);
      if (el && el.el.onended) await act(async () => { el.el.onended(); });
      await flush();
    }
    const nasVoice = road.calls[0].voice;
    const last = s.spoken.at(-1);
    expect(last, 'the rest was never handed to the phone voice').toBeTruthy();
    const spokeAs = last.voice === MAN ? 'male' : (last.voice === WOMAN || last.voice === WOMAN2) ? 'female' : 'unknown';
    expect(spokeAs, `the NAS voice was ${nasVoice}; the phone took over as ${spokeAs}`).toBe(nasVoice);
    expect(api.notice).toMatch(/phone’s own voice/);
  });

  it('with the screen off, a failed piece is HELD, never handed to Web Speech, and resumes in the NAS voice', async () => {
    const s = installSynth([MAN, WOMAN]);
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'fam-key');
    await mount();
    let fail = true;
    road.answer = ({ n }) => (n === 1 || !fail ? 200 : 404);
    await press();
    const before = s.spoken.length;
    setHidden(true);
    const el = media.plays.filter((p) => p.blob && p.ok).at(-1);
    await act(async () => { el.el.onended(); });
    await flush();
    expect(s.spoken.length, 'Web Speech was started in the background, where Android stops it').toBe(before);
    fail = false;
    const asked = road.calls.length;
    setHidden(false);
    await flush();
    expect(road.calls.length, 'the held reading did not resume in the NAS voice').toBeGreaterThan(asked);
  });
});

// =============================================================================
describe('the pieces, pure', () => {
  it('each miss rests the voice for as long as its cause lasts', () => {
    expect(liteRestFor('NotAllowedError')).toBe(0);
    expect(liteRestFor('voice-lite-503')).toBe(0);
    expect(liteRestFor('voice-lite-timeout')).toBe(30000);
    expect(liteRestFor('voice-lite-401')).toBe(120000);
    expect(liteRestFor('voice-lite-502')).toBe(45000);
  });
  it('the notice names the NAS voice’s own reason', () => {
    expect(liteVoiceReasonText('voice-lite-401', { hasKey: false })).toMatch(/sign in/i);
    expect(liteVoiceReasonText('voice-lite-timeout')).toMatch(/15 seconds/);
    expect(liteVoiceReasonText('NotAllowedError')).toMatch(/press play once more/i);
  });
  it('a pinned reading keeps its device voice, and a new pin picks the pinned gender', () => {
    const pin = newReadingPin('female');
    const first = deviceVoiceForPin(pin, { voices: [MAN, WOMAN], preferredURI: MAN.voiceURI });
    expect(first).toEqual({ uri: WOMAN.voiceURI, matched: true });
    pin.uri = first.uri; pin.matched = true;
    expect(deviceVoiceForPin(pin, { voices: [WOMAN2, MAN, WOMAN] }).uri).toBe(WOMAN.voiceURI);
    expect(deviceVoiceForPin(newReadingPin('male'), { voices: [WOMAN] }).matched).toBe(false);
  });
});
