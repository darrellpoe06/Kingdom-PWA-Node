// @vitest-environment jsdom
// =============================================================================
// The lit sentence is the one being HEARD — never the one before (DR-0653)
// =============================================================================
// Darrell 2026-09-25, live: "The reader seems to be one sentence behind the
// voice."
//
// Two causes on main, both pinned here against the REAL hook, the REAL clip
// queue and the REAL synthesizeLite, with /voice-lite answered by a fake:
//
//  1. THE PIECES WERE CUT FROM THE SPOKEN FORM. The highlight map cuts the text
//     AS WRITTEN; the NAS was handed pieces cut after toSpokenForm, which
//     removes the full stops in references ("2 Tim. 1:7" -> "2nd Tim chapter 1
//     verse 7"). Measured on the text below: 11 sentences as written, 7 spoken
//     pieces — so from the first reference on, piece i was not sentence i and
//     the light fell behind the voice and stayed behind.
//  2. THE LIGHT CAME FROM THE CLOCK. The lit sentence was the fraction of the
//     clip played, mapped onto the written lengths; at the start of a piece the
//     fraction sits on the boundary and lands on the sentence before.
//
// Pinned: the i-th request to the NAS is sentence i as written (in its spoken
// form), and the moment a piece starts playing the reader reports THAT piece —
// the one whose audio is in the element — at 1.5x. Both fail on main.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    rpc: async (name) => (name === 'get_family_bridge_token' ? { data: 'fam-key', error: null } : { data: null, error: null }),
    auth: { getUser: async () => ({ data: { user: null } }), updateUser: async () => ({ data: null, error: null }) },
  },
}));
vi.mock('../lib/voice-sync.js', () => ({ loadVoiceProfiles: async () => ({ profiles: [] }) }));
vi.mock('../lib/voice-service.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, isVoiceServiceReady: () => false, mayAttemptStudio: () => false, probeVoiceService: async () => 'down', voiceServiceHealth: () => 'down' };
});

import { useReadAloud } from '../lib/use-read-aloud.js';
import { _resetLiteVoiceForTests } from '../lib/voice-service.js';
import { _setDeviceClipCacheForTests } from '../lib/clip-cache.js';
import { CHAT_BRIDGE_TOKEN_KEY } from '../lib/nas-photos.js';
import { segmentText } from '../lib/tts.js';
import { toSpokenForm } from '../lib/speech-text.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// A lesson paragraph the way lessons are written: references with full stops.
const TEXT = 'Paul wrote in 2 Tim. 1:7 that fear is not from Him. Read Rom. 8:15 as well. The spirit of adoption cries Abba. Gen. 1:1 opens the Word. Ps. 23 is a psalm of David. Matt. 5:3 blesses the poor in spirit.';
const SENTENCES = segmentText(TEXT, 180);

const road = { texts: [] };
const urlText = new Map();
let pendingText = [];
let el = null;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'fam-key');
  _resetLiteVoiceForTests();
  _setDeviceClipCacheForTests(null); // nothing kept on the device from before
  road.texts = []; urlText.clear(); pendingText = []; el = null;
  globalThis.fetch = vi.fn(async (url, init) => {
    if (!String(url).includes('/voice-lite/')) return { ok: false, status: 404, headers: { get: () => null } };
    const body = JSON.parse(init.body);
    road.texts.push(body.text);
    pendingText.push(body.text);
    return { ok: true, status: 200, headers: { get: (k) => (k.toLowerCase() === 'content-type' ? 'audio/wav' : null) }, blob: async () => ({ size: 3200, text: body.text }) };
  });
  let n = 0;
  URL.createObjectURL = (b) => { const u = `blob:piece-${n++}`; urlText.set(u, b && b.text != null ? b.text : pendingText.shift()); return u; };
  URL.revokeObjectURL = () => {};
  window.HTMLMediaElement.prototype.play = function play() { el = this; this._paused = false; return Promise.resolve(); };
  window.HTMLMediaElement.prototype.pause = function pause() { this._paused = true; };
  window.HTMLMediaElement.prototype.load = function load() {};
  window.speechSynthesis = { speak() {}, cancel() {}, pause() {}, resume() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {}, speaking: false, paused: false, pending: false };
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
});
afterEach(() => { delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; });

describe('the lit sentence is the one being heard', () => {
  it('each NAS request is the next sentence as written, and the reported piece is the one whose audio is playing, at 1.5x', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let api;
    function Probe() { api = useReadAloud({ isOwner: true }); return null; }
    const flush = async (k = 10) => { for (let i = 0; i < k; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); };
    await act(async () => root.render(createElement(Probe)));
    await flush();
    act(() => { api.setRate(1.5); });
    api.claimAudio('Lesson');
    await act(async () => { await api.read(TEXT, { title: 'Lesson' }); });
    await flush();

    const heard = [];
    for (let i = 0; i < SENTENCES.length; i++) {
      expect(el, `piece ${i} never reached the audio element`).not.toBe(null);
      const playing = urlText.get(String(el.src));
      heard.push({ reported: api.cloudPiece, playing });
      // The reported piece is the one in the element — never the one before.
      expect(api.cloudPiece, `while "${playing}" plays`).toBe(i);
      expect(playing).toBe(toSpokenForm(SENTENCES[i]));
      expect(el.playbackRate).toBe(1.5);
      await act(async () => { if (el.onended) el.onended(); });
      await flush();
    }
    // Every sentence as written was asked for, once, in order.
    expect(road.texts).toEqual(SENTENCES.map((s) => toSpokenForm(s)));
    act(() => root.unmount());
    container.remove();
  });
});
