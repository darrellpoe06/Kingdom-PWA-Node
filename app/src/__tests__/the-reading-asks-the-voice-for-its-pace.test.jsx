// @vitest-environment jsdom
// =============================================================================
// The real hook asks the NAS voice for the reading's pace and stretches only
// the remainder (2026-10-07; "the voice mumbles... on faster speaking")
// =============================================================================
// Driven over the REAL useReadAloud with only the network seam faked: at 2x
// the /voice-lite request carries speed 2 and the element plays at 1x; at 1x
// no speed is sent at all (every saved clip keeps its key).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const state = vi.hoisted(() => ({ asked: [], tag: new WeakMap() }));

vi.mock('../lib/supabase.js', () => ({
  supabase: { auth: { getUser: async () => ({ data: { user: { user_metadata: {} } } }), getSession: async () => ({ data: { session: null } }), updateUser: async () => ({ data: null, error: null }) } },
}));
vi.mock('../lib/voice-sync.js', () => ({ loadVoiceProfiles: async () => ({ profiles: [] }) }));
vi.mock('../lib/bridge-provision.js', () => ({ provisionBridgeToken: async () => null }));
vi.mock('../lib/nas-photos.js', () => ({ hasBridgeToken: () => true }));
vi.mock('../lib/voice-reference.js', () => ({ loadReference: async () => null, blobToDataUri: async () => '' }));
vi.mock('../lib/voice-service.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    synthesizeSpeech: async () => ({ error: 'voice-service-404' }),
    synthesizeLite: async (args) => {
      state.asked.push({ text: args.text, speed: args.speed });
      const blob = new Blob([new Uint8Array(64)], { type: 'audio/wav' });
      state.tag.set(blob, args.text);
      return { blob, url: `blob:${args.text}` };
    },
    probeVoiceService: async () => 'down', voiceServiceHealth: () => 'down', isVoiceServiceReady: () => false,
    mayAttemptStudio: () => false, mayTryLiteVoice: () => true,
  };
});

const { useReadAloud } = await import('../lib/use-read-aloud.js');
const { createClipCache, memoryBackend, _setDeviceClipCacheForTests } = await import('../lib/clip-cache.js');

const TEXT = 'Alpha one sentence here. Alpha two sentence here.';
class FakeUtterance { constructor(t) { this.text = t; } }
let container; let root; let api;
const rates = [];
function Probe() { api = useReadAloud({ isOwner: true }); return null; }
const flush = async () => { for (let i = 0; i < 30; i += 1) await act(async () => { await Promise.resolve(); }); };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  state.asked.length = 0; rates.length = 0;
  _setDeviceClipCacheForTests(createClipCache({ backend: memoryBackend() }));
  try { localStorage.clear(); } catch { /* ignore */ }
  window.HTMLMediaElement.prototype.play = function play() { rates.push(this.playbackRate); return Promise.resolve(); };
  window.HTMLMediaElement.prototype.pause = function pause() {};
  URL.createObjectURL = (b) => `blob:${state.tag.get(b) || 'unknown'}`;
  URL.revokeObjectURL = () => {};
  window.speechSynthesis = { speaking: false, pending: false, paused: false, speak() {}, cancel() {}, pause() {}, resume() {}, getVoices() { return []; }, addEventListener() {}, removeEventListener() {}, onvoiceschanged: null };
  window.SpeechSynthesisUtterance = FakeUtterance;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; });

describe('the pace rides to the voice', () => {
  it('at 2x: the voice is asked for speed 2 and the element plays the piece at 1x', async () => {
    await act(async () => root.render(createElement(Probe)));
    await flush();
    await act(async () => { api.setRate(2); });
    await flush();
    await act(async () => { await api.read(TEXT); });
    await act(async () => { await new Promise((r) => setTimeout(r, 200)); });
    await flush();
    expect(state.asked.length, 'the NAS voice was never asked').toBeGreaterThan(0);
    expect(state.asked.every((a) => a.speed === 2), `asked with ${JSON.stringify(state.asked)}`).toBe(true);
    expect(rates.length).toBeGreaterThan(0);
    expect(rates[0], 'the element stretched a clip the voice already spoke at 2x').toBe(1);
  });

  it('at 1x: no speed is sent, and the element plays at 1x', async () => {
    await act(async () => root.render(createElement(Probe)));
    await flush();
    await act(async () => { await api.read(TEXT); });
    await act(async () => { await new Promise((r) => setTimeout(r, 200)); });
    await flush();
    expect(state.asked.length).toBeGreaterThan(0);
    expect(state.asked.every((a) => a.speed === 1)).toBe(true);
    expect(rates[0]).toBe(1);
  });
});
