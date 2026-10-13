// @vitest-environment jsdom
// =============================================================================
// "My voice (Darrell)" is offered, is the voice the reader asks for, and when
// it cannot read the reader says why (DR-0721)
// =============================================================================
// Darrell 2026-10-01: "Also my recorded voice still will not work as my reader
// voice… why?", "it just doesn't use it after choosing it", and "When I push
// play on the recorded voice I gave it, it sounds like me... just won't read
// like me."
//
// Measured against the REAL hook (use-read-aloud), with the network seams
// faked: his recording is on this device under 'darrell', and the studio
// either clones or does not answer. Before DR-0721 the reader:
//   * listed his voice as "Darrell Poe", and not at all when the consent row
//     did not load (nas-health logs "permission denied for table
//     voice_profiles");
//   * sent the WHOLE lesson to the studio as one request with a 45 s bound,
//     which an XTTS clone of a lesson cannot meet;
//   * on a dark studio set no message at all: the stand-in read and he was
//     told nothing he could see.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const state = vi.hoisted(() => ({
  profiles: [],
  samples: {},
  speak: [],
  lite: [],
  speakAnswer: () => ({ error: 'voice-service-404' }),
  health: 'unknown',
}));

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { user_metadata: {} } } }),
      getSession: async () => ({ data: { session: null } }),
      updateUser: async () => ({ data: null, error: null }),
    },
  },
}));
vi.mock('../lib/voice-sync.js', () => ({ loadVoiceProfiles: async () => ({ profiles: state.profiles }) }));
vi.mock('../lib/bridge-provision.js', () => ({ provisionBridgeToken: async () => null }));
vi.mock('../lib/voice-reference.js', () => ({
  loadReference: async (k) => state.samples[k] || null,
  blobToDataUri: async () => 'data:audio/webm;codecs=opus;base64,SGlzIHZvaWNl',
}));
vi.mock('../lib/voice-service.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    synthesizeSpeech: async (args) => { state.speak.push(args); return state.speakAnswer(args); },
    synthesizeLite: async (args) => { state.lite.push(args); return { error: 'voice-lite-test' }; },
    probeVoiceService: async () => state.health,
    voiceServiceHealth: () => state.health,
    isVoiceServiceReady: () => true,
    mayAttemptStudio: () => true,
  };
});

import { useReadAloud } from '../lib/use-read-aloud.js';
import { _resetLiteVoiceForTests } from '../lib/voice-service.js';

const DARRELL_ROW = {
  remoteId: 'r1', personKey: 'darrell', displayName: 'Darrell Poe', consentState: 'granted',
  entitlement: 'subscriber', providerHint: 'sovereign-clone', createdBy: 'phone-door',
};
const SAMPLE = { size: 48000, type: 'audio/webm' };
const LESSON = [
  'In the beginning was the Word, and the Word was with God, and the Word was God.',
  'The same was in the beginning with God.',
  'All things were made by him; and without him was not any thing made that was made.',
  'In him was life; and the life was the light of men.',
  'And the light shineth in darkness; and the darkness comprehended it not.',
].join(' ');

class FakeUtterance { constructor(t) { this.text = t; } }
function installSynth() {
  const synth = {
    spoken: [], paused: false, speaking: false, pending: false,
    speak(u) { synth.spoken.push(u); if (u.onstart) u.onstart(); },
    cancel() {}, pause() {}, resume() {},
    getVoices() { return [{ name: 'English United States', voiceURI: 'English United States', lang: 'en-US', localService: true }]; },
    addEventListener() {}, removeEventListener() {}, onvoiceschanged: null,
  };
  window.speechSynthesis = synth;
  window.SpeechSynthesisUtterance = FakeUtterance;
  return synth;
}

let container; let root; let api;
function Probe() { api = useReadAloud({ isOwner: true }); return null; }
const flush = async () => { for (let i = 0; i < 8; i += 1) await act(async () => { await Promise.resolve(); }); };

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.HTMLMediaElement.prototype.play = function play() { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function pause() {};
if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:x';
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};

beforeEach(() => {
  localStorage.clear();
  state.profiles = [DARRELL_ROW];
  state.samples = { darrell: SAMPLE };
  state.speak = [];
  state.lite = [];
  state.health = 'unknown';
  state.speakAnswer = () => ({ error: 'voice-service-404' });
  _resetLiteVoiceForTests();
  installSynth();
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

describe('the reader offers his own recorded voice by name', () => {
  it('lists "My voice (Darrell)" when his recording is on this device', async () => {
    await mount();
    const item = api.catalog.find((c) => c.id === 'person:darrell');
    expect(item, 'his voice is not in the reader’s list').toBeTruthy();
    expect(item.label).toBe('My voice (Darrell)');
    expect(item.usable).toBe(true);
  });

  it('still lists it when the consent row did not load (permission denied on voice_profiles)', async () => {
    state.profiles = [];
    await mount();
    const item = api.catalog.find((c) => c.id === 'person:darrell');
    expect(item, 'a failed profile read hid the voice he recorded').toBeTruthy();
    expect(item.label).toBe('My voice (Darrell)');
  });
});

describe('picking it makes the reader ask the studio for HIS voice', () => {
  it('sends his recording as the reference, names his voice, and sends the lesson a piece at a time', async () => {
    state.health = 'up';
    state.speakAnswer = () => ({ url: 'blob:his-voice' });
    await mount();
    await act(async () => api.setVoiceId('person:darrell'));
    await flush();
    await act(async () => { await api.read(LESSON); });
    await flush();

    expect(state.speak.length, 'the studio was never asked for his voice').toBeGreaterThan(0);
    const first = state.speak[0];
    expect(first.personKey).toBe('darrell');
    expect(first.voiceId).toBe('voice-dp');
    expect(first.referenceDataUri).toMatch(/^data:audio\/webm/);
    // One request per breath-sized piece, never the whole lesson in one.
    expect(first.text.length, 'the whole lesson went in one request').toBeLessThanOrEqual(200);
    expect(state.speak.every((c) => c.referenceDataUri && c.personKey === 'darrell')).toBe(true);
    // His voice played; the stand-in was not asked and nothing was said.
    expect(state.lite).toHaveLength(0);
    expect(api.notice).toBe('');
    expect(api.myVoice.status).toBe('ready');
  });
});

describe('when his voice cannot read, the reader says why, never in silence', () => {
  it('a studio that does not answer is named, in a sentence, and the stand-in is said to be reading', async () => {
    await mount();
    await act(async () => api.setVoiceId('person:darrell'));
    await flush();
    await act(async () => { await api.read(LESSON); });
    await flush();

    expect(state.speak.length, 'the studio was not even tried').toBeGreaterThan(0);
    expect(api.notice, 'the stand-in read in silence').toMatch(/My voice \(Darrell\) is not reading yet/);
    expect(api.notice).toMatch(/not answering/);
    expect(api.notice).toMatch(/stand-in voice reads instead/);
    expect(api.myVoice.status).toBe('studio-offline');
    expect(api.myVoice.line).toMatch(/not answering/);
  });

  it('a studio the probe saw dark is said BEFORE play', async () => {
    state.health = 'down';
    await mount();
    await act(async () => api.setVoiceId('person:darrell'));
    await flush();
    expect(api.myVoice.picked).toBe(true);
    expect(api.myVoice.status).toBe('studio-offline');
    expect(api.myVoice.line).toMatch(/is not reading yet/);
  });

  it('no recording on this device is said, with the door to the Voice tab, and the studio is not asked', async () => {
    state.samples = {};
    state.health = 'up';
    await mount();
    await act(async () => api.setVoiceId('person:darrell'));
    await flush();
    expect(api.myVoice.status).toBe('sample-missing');
    await act(async () => { await api.read(LESSON); });
    await flush();
    expect(state.speak).toHaveLength(0);
    expect(api.notice).toMatch(/your recording is not on this device/);
    expect(api.noticeAction && api.noticeAction.label).toBe('Open the Voice tab');
  });

  it('a refused key is named as a key, not as a dark studio', async () => {
    state.health = 'up';
    state.speakAnswer = () => ({ error: 'voice-service-401' });
    await mount();
    await act(async () => api.setVoiceId('person:darrell'));
    await flush();
    await act(async () => { await api.read(LESSON); });
    await flush();
    expect(api.myVoice.status).toBe('key-refused');
    expect(api.notice).toMatch(/family key/);
  });
});
