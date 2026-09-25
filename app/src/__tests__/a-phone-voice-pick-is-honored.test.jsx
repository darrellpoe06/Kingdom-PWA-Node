// @vitest-environment jsdom
// =============================================================================
// A phone voice the listener picks is the voice that speaks
// =============================================================================
// Darrell 2026-09-25, on his Android phone, in the Read Aloud panel: "I can
// only pic this fake dying voice!!!!!! Why limitations are built into the
// app!!!!! Fix it!!!!!" — and then, after picking another voice: "I did it
// didn't work!!!!! ... Obviously".
//
// Two causes, both measured here against the REAL hook and the REAL engine
// driven by a fake speechSynthesis shaped like his phone's (voices named by
// locale, languages written "en_US"):
//
//   1. tts.js set `utterance.voice` and never `utterance.lang`. Chrome on
//      Android picks the engine voice from the LANGUAGE, so the utterance
//      inherited the page's English and every pick spoke in one voice.
//   2. reading-voice.js adopted the account's saved voice whenever it merely
//      DIFFERED from this device's pick. A refused account write left the old
//      voice there, and the next reader that mounted pulled it back over the
//      new pick without a word.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

// The account: whatever the test puts here is what getUser answers.
const account = { meta: {} };
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { user_metadata: account.meta } } }),
      // A refused write: supabase answers with an error object, it does not throw.
      updateUser: async () => ({ data: null, error: { message: 'session expired' } }),
    },
  },
}));
vi.mock('../lib/voice-sync.js', () => ({ loadVoiceProfiles: async () => ({ profiles: [] }) }));
const lite = vi.hoisted(() => ({ calls: [] }));
vi.mock('../lib/voice-service.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    synthesizeLite: async (args) => { lite.calls.push(args); return { error: 'voice-lite-test' }; },
    synthesizeSpeech: async () => ({ error: 'studio-test' }),
    isVoiceServiceReady: () => false,
    mayAttemptStudio: () => false,
  };
});

import { useReadAloud } from '../lib/use-read-aloud.js';
import { _resetLiteVoiceForTests } from '../lib/voice-service.js';

// His Android names every voice by locale and writes the language with "_".
const US = { name: 'English United States (en_US)', voiceURI: 'English United States (en_US)', lang: 'en_US', localService: true };
const UK = { name: 'English United Kingdom (en_GB)', voiceURI: 'English United Kingdom (en_GB)', lang: 'en_GB', localService: true };
const IN = { name: 'English India (en_IN)', voiceURI: 'English India (en_IN)', lang: 'en_IN', localService: true };

class FakeUtterance {
  constructor(t) { this.text = t; this.rate = 1; this.pitch = 1; this.voice = null; this.lang = ''; }
}
function installSynth(voices) {
  const spoken = [];
  const synth = {
    spoken, paused: false, speaking: false, pending: false,
    speak(u) { spoken.push(u); if (u.onstart) u.onstart(); },
    cancel() {}, pause() {}, resume() {},
    getVoices() { return voices; },
    addEventListener() {}, removeEventListener() {},
    onvoiceschanged: null,
  };
  window.speechSynthesis = synth;
  window.SpeechSynthesisUtterance = FakeUtterance;
  return synth;
}

let container; let root; let api;
function Probe() { api = useReadAloud({ isOwner: true }); return null; }
const flush = async () => { for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); }); };

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// jsdom has no media playback; the silent keep-alive element only needs to exist.
window.HTMLMediaElement.prototype.play = function play() { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function pause() {};
window.HTMLMediaElement.prototype.load = function load() {};

beforeEach(() => {
  localStorage.clear();
  account.meta = {};
  lite.calls = [];
  _resetLiteVoiceForTests();
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

describe('picking a phone voice on Android', () => {
  it('the picked voice speaks, carrying its own language so Android honours it', async () => {
    const synth = installSynth([US, UK, IN]);
    await act(async () => root.render(createElement(Probe)));
    await flush();
    // The phone's voices are in the list to choose from.
    expect(api.catalog.map((c) => c.id)).toEqual(expect.arrayContaining([US.voiceURI, UK.voiceURI, IN.voiceURI]));

    await act(async () => api.setVoiceId(UK.voiceURI));
    await flush();
    await act(async () => { await api.read('The Lord is my shepherd; I shall not want.'); });
    await flush();

    const last = synth.spoken[synth.spoken.length - 1];
    expect(last, 'nothing was spoken').toBeTruthy();
    expect(last.voice, 'the picked voice was not the one used').toBe(UK);
    // THE ANDROID CAUSE: without this the utterance takes the page's language
    // and the engine speaks its one default voice whatever was picked.
    expect(last.lang, 'the utterance does not carry the picked voice’s language').toBe('en-GB');
    // A phone voice picked on purpose is not diverted to the NAS voice.
    expect(lite.calls, 'the pick was routed to /voice-lite instead').toHaveLength(0);
  });

  it('the pick is saved, and survives a reader mounting while the account still holds the old voice', async () => {
    installSynth([US, UK, IN]);
    // The account holds his earlier pick (unstamped, as every pick before today was).
    account.meta = { reading_voice_id: 'person:darrell' };
    await act(async () => root.render(createElement(Probe)));
    await flush();
    await act(async () => api.setVoiceId(IN.voiceURI));
    await flush();
    expect(JSON.parse(localStorage.getItem('poe-reading-voice')).voiceId).toBe(IN.voiceURI);

    // Another reader mounts (a new page, the header picker): it hydrates from
    // the account, whose write was refused, so the account still says the old voice.
    act(() => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(createElement(Probe)));
    await flush();
    expect(api.voiceId, 'a stale account value overwrote the listener’s pick').toBe(IN.voiceURI);
  });

  it('a NEWER pick made on another device still follows the account here', async () => {
    installSynth([US, UK, IN]);
    localStorage.setItem('poe-reading-voice', JSON.stringify({ voiceId: US.voiceURI, at: 1000 }));
    account.meta = { reading_voice_id: UK.voiceURI, reading_voice_at: 2000 };
    await act(async () => root.render(createElement(Probe)));
    await flush();
    expect(api.voiceId).toBe(UK.voiceURI);
  });

  it('a voice list still empty at the tap waits for the phone’s voices, and uses the pick', async () => {
    const voices = [];
    const synth = installSynth(voices);
    localStorage.setItem('poe-reading-voice', JSON.stringify({ voiceId: UK.voiceURI, at: Date.now() }));
    await act(async () => root.render(createElement(Probe)));
    await flush();
    // The voices arrive only after the tap, as on a cold Android load.
    await act(async () => {
      const reading = api.read('Hello there.');
      voices.push(US, UK, IN);
      await reading;
    });
    await flush();
    const last = synth.spoken[synth.spoken.length - 1];
    expect(last && last.voice).toBe(UK);
    expect(last && last.lang).toBe('en-GB');
  });

  it('a pick that does not exist on this device is said, never swapped in silence', async () => {
    installSynth([US]);
    localStorage.setItem('poe-reading-voice', JSON.stringify({ voiceId: 'Google UK English Male', at: Date.now() }));
    await act(async () => root.render(createElement(Probe)));
    await flush();
    await act(async () => { await api.read('Hello there.'); });
    await flush();
    expect(api.notice).toMatch(/not on this device/);
  });
});
