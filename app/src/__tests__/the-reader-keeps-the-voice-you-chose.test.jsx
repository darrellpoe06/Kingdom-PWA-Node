// @vitest-environment jsdom
// =============================================================================
// The reader keeps the voice you chose, and the list of the books is seen,
// not read (DR-1482)
// =============================================================================
// Darrell, 2026-11-13, three reports at once (rendered for meaning, DR-0331):
// the reader reads the list of scriptures at the end of a lesson, which is a
// list to look at; the man's voice he chose turns into a woman's part-way
// through, again and again, until a rewind or a skip brings his back; and his
// own recorded voice still does not read.
//
// 1. THE LIST OF THE BOOKS. The figure "When the N books this lesson quotes
//    were written" (LessonFigures, DR-1296 / DR-1372) and the Who He Is
//    register sit at the end of the teach stage, folded. The reader OPENS
//    folds before it reads (lib/read-reveal.js), so it read every book, date
//    and basis line aloud. Now both carry data-read-skip (the reader's own
//    word for "not reading") and data-read-no-expand. A verse quoted in the
//    teaching is still read.
// 2. THE VOICE. Two seams switched it. (a) The engine kept the pick as an
//    object and the hook looked it up by URI at speak time: a list Android was
//    rebuilding returned nothing, no voice was set, and the piece read in the
//    phone's default. (b) A NAS piece that failed handed the rest of the
//    reading to the phone's own engine even when the phone had no voice of the
//    reading's gender. Both now keep the voice or hold the place and say so.
//
// PROVEN TO CATCH: each case below was run against origin/main's tts.js,
// use-read-aloud.js, LessonFigures.jsx and WhoHeIsRegister.jsx and fails
// there (recorded in DR-1482).
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
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
  },
}));
vi.mock('../lib/voice-sync.js', () => ({ loadVoiceProfiles: async () => ({ profiles: [] }) }));
vi.mock('../lib/voice-service.js', async (importOriginal) => {
  const real = await importOriginal();
  // The GPU studio is dark; only the NAS voice and the phone remain.
  return { ...real, isVoiceServiceReady: () => false, mayAttemptStudio: () => false, probeVoiceService: async () => 'down', voiceServiceHealth: () => 'down' };
});
// The Piper voice is not kept on this phone (the case Darrell is in).
vi.mock('../lib/device-voice.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, checkDeviceVoice: async () => ({ state: 'downloadable', cached: false }), synthesizeOnDevice: async () => ({ error: 'not-kept' }) };
});

import { createBrowserTTS, resolveChosenVoice, VOICE_WAIT_MS } from '../lib/tts.js';
import { useReadAloud } from '../lib/use-read-aloud.js';
import { _resetLiteVoiceForTests } from '../lib/voice-service.js';
import { _setDeviceClipCacheForTests } from '../lib/clip-cache.js';
import { CHAT_BRIDGE_TOKEN_KEY } from '../lib/nas-photos.js';
import { saveReadingVoiceId } from '../lib/reading-voice.js';
import { buildFollowMap } from '../lib/read-follow.js';
import { revealAllForReading } from '../lib/read-reveal.js';
import LessonFigures from '../components/LessonFigures.jsx';
import WhoHeIsRegister from '../components/WhoHeIsRegister.jsx';
import { WHO_HE_IS_MODULES } from '../lib/who-he-is-course.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const MAN = { name: 'English (United States) Male', voiceURI: 'en-us-male', lang: 'en-US', localService: true };
const WOMAN = { name: 'English (United States) Female', voiceURI: 'en-us-female', lang: 'en-US', localService: true };
const WOMAN2 = { name: 'English (United Kingdom) Female', voiceURI: 'en-gb-female', lang: 'en-GB', localService: true };
const LESSON = 'In the beginning was the Word. And the Word was with God. And the Word was God. The same was in the beginning with God. All things were made by Him. And without Him was not any thing made that was made. In Him was life. And the life was the light of men.';

const flush = async (n = 8) => { for (let i = 0; i < n; i += 1) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };

// =============================================================================
describe('1. the list of the books at the end of a lesson is seen, not read', () => {
  let container; let root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const LESSON_MODULE = { id: 'test-lesson', anchor: { ref: 'Genesis 1:1; Isaiah 40:8; John 1:1; Hebrews 11:3' } };
  const BODY = 'As the Word says, "In the beginning God created the heaven and the earth" (Genesis 1:1), and that is where we stand.';

  async function lessonEnd() {
    await act(async () => root.render(createElement('div', { id: 'read-root' },
      createElement('p', null, BODY),
      createElement(LessonFigures, { module: LESSON_MODULE }),
    )));
    return container.querySelector('#read-root');
  }

  it('the books timeline is on the page and out of what the reader speaks; the verse in the teaching is still spoken', async () => {
    const el = await lessonEnd();
    const fold = el.querySelector('[data-testid="lesson-figures"]');
    expect(fold, 'the list must stay on the page').toBeTruthy();
    expect(fold.textContent).toMatch(/books this lesson quotes/);
    expect(fold.textContent).toMatch(/Isaiah/);
    // The reader opens folds before it reads; this one it must leave alone.
    await revealAllForReading(el);
    expect(fold.open, 'the reader opened a fold it does not read').toBe(false);
    const spoken = buildFollowMap(el, document).text;
    expect(spoken).toContain('In the beginning God created the heaven and the earth');
    expect(spoken).toContain('Genesis 1:1');
    expect(spoken).not.toMatch(/books this lesson quotes/);
    expect(spoken).not.toMatch(/Isaiah/);
    expect(spoken).not.toMatch(/written/);
  });

  it('proven to catch: without the mark, the same map speaks the whole list', async () => {
    const el = await lessonEnd();
    for (const n of el.querySelectorAll('[data-read-skip]')) n.removeAttribute('data-read-skip');
    const spoken = buildFollowMap(el, document).text;
    expect(spoken).toMatch(/books this lesson quotes/);
    expect(spoken).toMatch(/Isaiah/);
  });

  it('the Who He Is register (every passage, where and when) is seen, not read', async () => {
    const m = WHO_HE_IS_MODULES.find((x) => x.whoHeIs && !x.whoHeIs.edge);
    expect(m, 'a Who He Is lesson with a register').toBeTruthy();
    await act(async () => root.render(createElement('div', { id: 'read-root' },
      createElement('p', null, BODY),
      createElement(WhoHeIsRegister, { spec: m.whoHeIs }),
    )));
    const el = container.querySelector('#read-root');
    const reg = el.querySelector('[data-testid="who-he-is-register"]');
    expect(reg).toBeTruthy();
    expect(reg.textContent).toMatch(/Every passage set here/);
    const spoken = buildFollowMap(el, document).text;
    expect(spoken).toContain('In the beginning God created');
    expect(spoken).not.toMatch(/Every passage set here/);
  });
});

// =============================================================================
// A fake engine: getVoices() answers from a list the test can rebuild.
function fakeSynth(initial) {
  const s = {
    list: initial,
    spoken: [],
    speaking: false, paused: false, pending: false,
    getVoices() { return typeof s.list === 'function' ? s.list() : s.list; },
    speak(u) { s.spoken.push(u); s.speaking = true; if (u.onstart) u.onstart(); },
    cancel() { s.speaking = false; },
    pause() {}, resume() {},
  };
  return s;
}
class Utt { constructor(t) { this.text = t; this.voice = null; this.lang = ''; } }
const clone = (v) => ({ ...v });
const endCurrent = (s) => { const u = s.spoken.at(-1); if (u && u.onend) u.onend(); };

describe('2a. the engine speaks every sentence in the voice chosen at the start', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('the list is rebuilt mid-reading (new objects): every sentence is the chosen voice, as the list holds it NOW', () => {
    const s = fakeSynth([MAN, WOMAN]);
    const eng = createBrowserTTS({ synth: s, Utterance: Utt, prefs: { rate: 1 }, doc: null, tv: false });
    eng.setVoice(MAN);
    eng.load(LESSON);
    eng.play();
    endCurrent(s);
    // Android rebuilds the list: the same voices, new objects, a new order.
    const rebuilt = [clone(WOMAN), clone(WOMAN2), clone(MAN)];
    s.list = rebuilt;
    endCurrent(s);
    endCurrent(s);
    expect(s.spoken.length).toBeGreaterThanOrEqual(4);
    for (const u of s.spoken) expect(u.voice && u.voice.voiceURI).toBe(MAN.voiceURI);
    // After the rebuild the voice handed over is the one the list holds now.
    expect(s.spoken.at(-1).voice).toBe(rebuilt[2]);
  });

  it('a lookup that finds nothing while the list is empty never sets "no voice": it waits, then speaks in the chosen voice', () => {
    let ready = false;
    const s = fakeSynth(() => (ready ? [WOMAN, MAN] : []));
    const eng = createBrowserTTS({ synth: s, Utterance: Utt, prefs: { rate: 1 }, doc: null, tv: false });
    eng.wantVoice(MAN.voiceURI);
    eng.load(LESSON);
    eng.play();
    expect(s.spoken.length, 'spoke before the chosen voice was there').toBe(0);
    ready = true;
    vi.advanceTimersByTime(200);
    expect(s.spoken.length).toBe(1);
    expect(s.spoken[0].voice).toBe(MAN);
    expect(s.spoken[0].lang).toBe('en-US');
  });

  it('a voice that leaves the list mid-reading HOLDS the place and says why; nothing is spoken in another voice', () => {
    const s = fakeSynth([MAN, WOMAN]);
    const states = [];
    const eng = createBrowserTTS({ synth: s, Utterance: Utt, prefs: { rate: 1 }, doc: null, tv: false, onState: (st) => states.push(st) });
    eng.setVoice(MAN);
    eng.load(LESSON);
    eng.play();
    s.list = [WOMAN, WOMAN2];
    endCurrent(s);
    vi.advanceTimersByTime(VOICE_WAIT_MS + 200);
    for (const u of s.spoken) expect(u.voice && u.voice.voiceURI).toBe(MAN.voiceURI);
    const last = states.at(-1);
    expect(last.status).toBe('idle');
    expect(last.heldAt).toBe(1);
    expect(last.heldWhy).toBe('voice-missing');
  });

  it('the device default chosen ON PURPOSE is still the device default (nothing resolved)', () => {
    const s = fakeSynth([MAN, WOMAN]);
    const eng = createBrowserTTS({ synth: s, Utterance: Utt, prefs: { rate: 1 }, doc: null, tv: false });
    eng.setVoice(null);
    eng.load(LESSON);
    eng.play();
    endCurrent(s);
    expect(s.spoken.length).toBe(2);
    for (const u of s.spoken) expect(u.voice).toBe(null);
  });

  it('resolveChosenVoice, pure: by URI, then by name AND language, never by name alone', () => {
    expect(resolveChosenVoice([], { uri: 'x' }).state).toBe('wait');
    expect(resolveChosenVoice([MAN], null).state).toBe('none');
    expect(resolveChosenVoice([WOMAN, MAN], { uri: MAN.voiceURI }).voice).toBe(MAN);
    const reissued = { ...MAN, voiceURI: 'en-us-male#2' };
    expect(resolveChosenVoice([reissued], { uri: MAN.voiceURI, name: MAN.name, lang: 'en_US' }).voice).toBe(reissued);
    expect(resolveChosenVoice([{ ...MAN, voiceURI: 'z', lang: 'en-GB' }], { uri: MAN.voiceURI, name: MAN.name, lang: 'en-US' }).state).toBe('missing');
  });
});

// =============================================================================
// The hook, with the NAS voice and a phone shaped like his: no man's voice.
const road = { calls: [], answer: null };
function voiceLiteFetch(url, init) {
  if (!String(url).includes('/voice-lite/')) return Promise.resolve({ ok: false, status: 404, headers: { get: () => null } });
  const body = JSON.parse(init.body);
  road.calls.push({ voice: body.voice, text: body.text });
  const n = road.calls.length;
  const status = road.answer ? road.answer({ n, body }) : 200;
  return Promise.resolve({
    ok: status === 200, status,
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
    spoken: [], speaking: false, paused: false, pending: false,
    speak(u) { s.spoken.push(u); s.speaking = true; if (u.onstart) u.onstart(); },
    cancel() { s.speaking = false; }, pause() {}, resume() {},
    getVoices() { return [...voices]; },
    addEventListener() {}, removeEventListener() {}, onvoiceschanged: null,
  };
  window.speechSynthesis = s;
  window.SpeechSynthesisUtterance = Utt;
  return s;
}

describe('2b. a NAS piece that fails never hands a man’s reading to a woman’s voice', () => {
  let container; let root; let api;
  function Probe() { api = useReadAloud({ isOwner: true }); return null; }
  beforeEach(async () => {
    localStorage.clear();
    family.key = 'fam-key';
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'fam-key');
    // He picked his own voice: a man's, read by the NAS man's voice meanwhile.
    saveReadingVoiceId('person:darrell');
    road.calls = []; road.answer = null; media.plays = [];
    _resetLiteVoiceForTests();
    _setDeviceClipCacheForTests(null);
    globalThis.fetch = vi.fn(voiceLiteFetch);
    URL.createObjectURL = () => `blob:clip-${Math.random().toString(36).slice(2, 8)}`;
    URL.revokeObjectURL = () => {};
    installMedia();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount()); container.remove();
    delete window.speechSynthesis; delete window.SpeechSynthesisUtterance;
  });
  async function mount() { await act(async () => root.render(createElement(Probe))); await flush(); }
  async function press() {
    api.claimAudio('Lesson');
    const reading = api.read(LESSON, { title: 'Lesson' });
    await act(async () => { await reading; });
    await flush();
  }
  async function playOn(times = 4) {
    for (let i = 0; i < times; i += 1) {
      const el = media.plays.filter((p) => p.blob).at(-1);
      if (el && el.el.onended) await act(async () => { el.el.onended(); });
      await flush();
    }
  }

  it('the reading holds at the failed sentence, says why, and no woman’s voice speaks', async () => {
    const phone = installPhone([WOMAN, WOMAN2]);
    await mount();
    road.answer = ({ n }) => (n === 1 ? 200 : 404);
    await press();
    expect(road.calls[0].voice, 'the NAS voice for his pick is a man’s').toBe('male');
    await playOn();
    expect(phone.spoken.map((u) => u.voice && u.voice.voiceURI), 'a woman’s voice took over the man’s reading').toEqual([]);
    expect(api.isReading).toBe(true);
    expect(api.isPaused).toBe(true);
    expect(api.notice).toMatch(/waits here instead of going on in a different voice/);
    expect(api.noticeAction && api.noticeAction.label).toMatch(/Keep the man’s voice on this phone/);
  });

  it('play asks the man’s voice again, and the reading goes on in it', async () => {
    const phone = installPhone([WOMAN, WOMAN2]);
    await mount();
    let fail = true;
    road.answer = ({ n }) => (n === 1 || !fail ? 200 : 404);
    await press();
    await playOn();
    fail = false;
    const asked = road.calls.length;
    await act(async () => { api.resume(); });
    await flush();
    expect(road.calls.length, 'play did not ask the NAS voice again').toBeGreaterThan(asked);
    expect(road.calls.at(-1).voice).toBe('male');
    expect(phone.spoken.length).toBe(0);
  });

  it('coming back to the screen does not resume a voice hold on its own', async () => {
    const phone = installPhone([WOMAN, WOMAN2]);
    await mount();
    road.answer = ({ n }) => (n === 1 ? 200 : 404);
    await press();
    await playOn();
    const asked = road.calls.length;
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(road.calls.length).toBe(asked);
    expect(phone.spoken.length).toBe(0);
  });

  it('pressed through, with the man’s voice still down, the phone reads on, as it was told it would', async () => {
    const phone = installPhone([WOMAN, WOMAN2]);
    await mount();
    road.answer = ({ n }) => (n === 1 ? 200 : 404);
    await press();
    await playOn();
    await act(async () => { api.resume(); });
    await flush(12);
    expect(phone.spoken.length, 'after the press the rest is read').toBeGreaterThan(0);
  });

  it('a phone WITH a man’s voice carries on in it, as before', async () => {
    const phone = installPhone([WOMAN, MAN]);
    await mount();
    road.answer = ({ n }) => (n === 1 ? 200 : 404);
    await press();
    await playOn();
    expect(phone.spoken.length).toBeGreaterThan(0);
    for (const u of phone.spoken) expect(u.voice && u.voice.voiceURI).toBe(MAN.voiceURI);
  });
});
