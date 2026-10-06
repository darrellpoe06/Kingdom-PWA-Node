// @vitest-environment jsdom
// =============================================================================
// One reading owns the voice element — the garble (DR-0756)
// =============================================================================
// Darrell 2026-10-06, from his phone, a lesson whose every piece was on the
// device ("169 of 169 pieces · 3.2 MB"): "it gets garbled words at times even
// with the storage increase for cache."
//
// Cause, measured against the REAL hook with the network seam faked: a read is
// asynchronous for seconds before it plays a note — the family key, the
// saved-on-device check, and, once a reading is fully saved, decoding and
// joining every piece into one file (DR-0718/DR-0747). A SECOND read begun
// inside that window (a paragraph jump, a Continue, the headset's skip) calls
// stopCloud() first, exactly as it should, and finds NOTHING to stop: the first
// read has not installed its queue yet. Both reads then build a clip queue over
// the ONE shared <audio> element (lib/use-read-aloud.js — liteAudioRef), and
// the superseded one puts its own piece on that element mid-sentence. Nothing
// in the cache can cure it; a fully saved reading makes the window LONGER,
// which is why he saw it after raising the cache.
//
// Proven-to-catch: against the code as it was, with the first read's piece
// slower than the second's, the element took "Bravo one…" and then "Alpha
// one…" — the new reading cut off part-way and replaced by a sentence from
// where the listener no longer is — and the superseded read went on fetching
// its remaining pieces, each of which would have swapped in at the next
// sentence boundary.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const state = vi.hoisted(() => ({ asked: [], tag: new WeakMap() }));

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { user_metadata: {} } } }),
      getSession: async () => ({ data: { session: null } }),
      updateUser: async () => ({ data: null, error: null }),
    },
  },
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
    // The first reading's pieces come back SLOWER than the second's — the shape
    // of a jump made while a long join or a slow first piece is still in flight.
    synthesizeLite: async (args) => {
      state.asked.push(args.text);
      await new Promise((r) => setTimeout(r, /^Alpha/.test(args.text) ? 90 : 30));
      const blob = new Blob([new Uint8Array(64)], { type: 'audio/wav' });
      state.tag.set(blob, args.text);
      return { blob, url: `blob:${args.text}` };
    },
    probeVoiceService: async () => 'down',
    voiceServiceHealth: () => 'down',
    isVoiceServiceReady: () => false,
    mayAttemptStudio: () => false,
    mayTryLiteVoice: () => true,
  };
});

const { useReadAloud } = await import('../lib/use-read-aloud.js');
const { createClipCache, memoryBackend, _setDeviceClipCacheForTests } = await import('../lib/clip-cache.js');

const ALPHA = 'Alpha one sentence here. Alpha two sentence here. Alpha three sentence here.';
const BRAVO = 'Bravo one sentence here. Bravo two sentence here. Bravo three sentence here.';

class FakeUtterance { constructor(t) { this.text = t; } }

let container; let root; let api;
const srcs = [];
function Probe() { api = useReadAloud({ isOwner: true }); return null; }
const flush = async () => { for (let i = 0; i < 30; i += 1) await act(async () => { await Promise.resolve(); }); };

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  srcs.length = 0; state.asked.length = 0;
  // A fresh device cache per test: a piece kept by one test must not shorten
  // the next one's preparing window, which is the whole subject here.
  _setDeviceClipCacheForTests(createClipCache({ backend: memoryBackend() }));
  try { localStorage.clear(); } catch { /* ignore */ }
  window.HTMLMediaElement.prototype.play = function play() { return Promise.resolve(); };
  window.HTMLMediaElement.prototype.pause = function pause() {};
  // Every src ever put on any audio element, in order.
  Object.defineProperty(window.HTMLMediaElement.prototype, 'src', {
    configurable: true,
    get() { return this.getAttribute('src') || ''; },
    set(v) { srcs.push(String(v)); this.setAttribute('src', String(v)); },
  });
  URL.createObjectURL = (b) => `blob:${state.tag.get(b) || 'unknown'}`;
  URL.revokeObjectURL = () => {};
  window.speechSynthesis = {
    speaking: false, pending: false, paused: false,
    speak() {}, cancel() {}, pause() {}, resume() {}, getVoices() { return []; },
    addEventListener() {}, removeEventListener() {}, onvoiceschanged: null,
  };
  window.SpeechSynthesisUtterance = FakeUtterance;
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

describe('a read superseded while it prepares never reaches the voice element', () => {
  it('only the reading the listener is on puts pieces on the element', async () => {
    await act(async () => root.render(createElement(Probe)));
    await flush();

    let first;
    await act(async () => { first = api.read(ALPHA); });
    // The jump: a second read while the first is still fetching its first piece.
    await act(async () => { await api.read(BRAVO); });
    await act(async () => { await first; });
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });
    await flush();

    const played = srcs.filter((s) => s.startsWith('blob:'));
    expect(played.length, 'nothing was played at all').toBeGreaterThan(0);
    expect(
      played.filter((s) => s.includes('Alpha')),
      'the superseded reading put its piece on the shared audio element',
    ).toEqual([]);
    expect(played[0]).toContain('Bravo one sentence here.');
    // And it stops asking for the rest of a reading nobody is listening to.
    expect(state.asked.filter((t) => /^Alpha/.test(t)).length).toBeLessThanOrEqual(1);
  });

  it('Stop supersedes a read still preparing — it never starts speaking afterwards', async () => {
    await act(async () => root.render(createElement(Probe)));
    await flush();
    let pending;
    await act(async () => { pending = api.read(ALPHA); });
    act(() => { api.stop(); });
    await act(async () => { await pending; });
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });
    await flush();
    expect(srcs.filter((s) => s.startsWith('blob:'))).toEqual([]);
  });
});
