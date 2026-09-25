// =============================================================================
// The NAS voice's clips are kept on the device (DR-0659)
// =============================================================================
// Darrell 2026-09-24: "So we need a direct connection to the nas for a good
// reading?!!! Can't we give everything it needs for quality without needing to
// reconnect with the nas?"
//
// The real player (clip-queue) over the real per-reading source and cache
// (clip-cache), with a Map store and a counted fake network. Proven-to-catch,
// each checked by breaking the code it pins:
//   • replay makes ZERO fetches — fails when the source skips the cache;
//   • a dropped network after the fetch-ahead still plays to the end — fails
//     when the fetch-ahead is not run (the old code: fetch as you go);
//   • eviction keeps the total under the cap, least-recently-played first —
//     fails when eviction is a no-op or evicts newest-first.
import { describe, it, expect } from 'vitest';
import { chunkForClips, createClipQueue } from '../lib/clip-queue.js';
import {
  createClipCache, createClipSource, memoryBackend, cacheAhead, clipKey, formatSaved,
  rememberReadingKeys, recallReadingKeys, LITE_MODELS,
} from '../lib/clip-cache.js';

const TEXT = 'In the beginning was the Word, and the Word was with God, and the Word was God. The same was in the beginning with God. All things were made by Him; and without Him was not any thing made that was made. In Him was life; and the life was the light of men.';
const blob = (n = 1000) => ({ size: n, type: 'audio/wav' });
const tick = () => new Promise((r) => setTimeout(r, 0));

function fakeAudio() {
  return {
    src: '', paused: true, playbackRate: 1, defaultPlaybackRate: 1,
    play() { this.paused = false; return Promise.resolve(); },
    pause() { this.paused = true; },
  };
}

function network({ downAfter = Infinity, slow = 0 } = {}) {
  const net = { calls: 0, up: true };
  net.fetchBlob = async () => {
    net.calls += 1;
    for (let k = 0; k < slow; k++) await tick(); // the NAS takes a moment
    if (!net.up || net.calls > downAfter) return { error: 'voice-lite-no-response' };
    return { blob: blob() };
  };
  return net;
}

async function playToEnd({ chunks, source }) {
  const audio = fakeAudio();
  const played = [];
  let ended = false; let fellBack = null;
  const q = createClipQueue({
    chunks, audio, rate: 1.5,
    fetchClip: (t, i) => source.clip(i),
    onPiece: (i) => played.push(i),
    onEnd: () => { ended = true; },
    onFallback: (rest, i) => { fellBack = i; },
  });
  await q.start();
  for (let n = 0; n < chunks.length + 2 && !ended && fellBack == null; n++) {
    audio.onended();
    for (let k = 0; k < 6; k++) await tick();
  }
  return { played, ended, fellBack };
}

const setup = (net, cache = createClipCache({ backend: memoryBackend(), capBytes: () => 1e9 })) => {
  const chunks = chunkForClips(TEXT);
  const keys = chunks.map((c) => clipKey({ voice: 'male', text: c.text }));
  const source = createClipSource({ keys, cache, fetchBlob: (i) => net.fetchBlob(i), makeUrl: () => 'blob:clip' });
  return { chunks, keys, source, cache };
};

describe('a piece heard once is kept on the device', () => {
  it('a second play of the same reading makes ZERO fetches to the NAS', async () => {
    const net = network();
    const first = setup(net);
    const a = await playToEnd(first);
    expect(a.ended).toBe(true);
    expect(net.calls).toBe(first.chunks.length);
    // A new reading of the same words (a replay), same device cache.
    const again = setup(net, first.cache);
    const before = net.calls;
    const b = await playToEnd(again);
    expect(b.ended).toBe(true);
    expect(b.played).toEqual(first.chunks.map((_, i) => i));
    expect(net.calls - before).toBe(0);
  });

  it('once the fetch-ahead has run, the network can drop and the reading still plays to the end', async () => {
    const net = network();
    const s = setup(net);
    const res = await s.source.ahead({ concurrency: 3 });
    expect(res).toMatchObject({ saved: s.chunks.length, total: s.chunks.length, failed: 0 });
    net.up = false; // the NAS, the Funnel or the phone's signal is gone
    const out = await playToEnd(s);
    expect(out.fellBack).toBe(null);
    expect(out.ended).toBe(true);
    expect(out.played).toEqual(s.chunks.map((_, i) => i));
  });

  it('without anything kept, the same drop stops the NAS voice at the first missing piece (what the old code did)', async () => {
    const net = network({ downAfter: 1 });
    const s = setup(net);
    const out = await playToEnd(s);
    expect(out.ended).toBe(false);
    expect(out.fellBack).toBe(1);
  });

  it('the player and the fetch-ahead never fetch the same piece twice', async () => {
    const net = network({ slow: 8 });
    const s = setup(net);
    // Both ask for piece 0 while the NAS is still making it.
    const first = s.source.clip(0);
    const ahead = s.source.ahead({ concurrency: 3 });
    await Promise.all([first, ahead]);
    expect(net.calls).toBe(s.chunks.length);
  });
});

describe('the fetch-ahead', () => {
  it('asks the NAS at most three at a time and reports saved / total / bytes', async () => {
    let open = 0; let peak = 0;
    const cache = createClipCache({ backend: memoryBackend(), capBytes: () => 1e9 });
    const keys = Array.from({ length: 10 }, (_, i) => `k${i}`);
    const seen = [];
    const out = await cacheAhead({
      keys, cache, concurrency: 3,
      fetchPiece: async () => { open += 1; peak = Math.max(peak, open); await tick(); await tick(); open -= 1; return blob(500); },
      onProgress: (p) => seen.push(p),
    });
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1);
    expect(out).toEqual({ saved: 10, total: 10, bytes: 5000, failed: 0 });
    expect(seen.at(-1)).toEqual({ saved: 10, total: 10, bytes: 5000 });
    expect(formatSaved({ saved: 34, total: 120, bytes: 5.2 * 1024 * 1024 })).toBe('34 of 120 pieces · 5.2 MB');
  });

  it('a stopped fetch-ahead stops asking', async () => {
    const cache = createClipCache({ backend: memoryBackend(), capBytes: () => 1e9 });
    const signal = { aborted: false };
    let calls = 0;
    await cacheAhead({ keys: ['a', 'b', 'c', 'd', 'e', 'f'], cache, concurrency: 1, signal, fetchPiece: async () => { calls += 1; if (calls === 2) signal.aborted = true; return blob(); } });
    expect(calls).toBe(2);
  });
});

describe('the cap', () => {
  it('keeps the total under the cap, clearing the least recently played first', async () => {
    let t = 0;
    const backend = memoryBackend();
    const cache = createClipCache({ backend, capBytes: () => 3000, now: () => ++t });
    await cache.put('a', blob(1000));
    await cache.put('b', blob(1000));
    await cache.put('c', blob(1000));
    await cache.get('a'); // 'a' was just played: it is now the newest
    await cache.put('d', blob(1000)); // 4000 > 3000: one must go — 'b'
    expect(await cache.has('b')).toBe(false);
    expect(await cache.has('a')).toBe(true);
    expect(await cache.has('c')).toBe(true);
    expect(await cache.has('d')).toBe(true);
    expect(await cache.totalBytes()).toBe(3000);
  });
});

describe('what a clip is keyed by', () => {
  it('the voice, its model and the exact words — so a man’s clip is never played for a woman’s voice', () => {
    const k = clipKey({ voice: 'male', text: 'The Word.' });
    expect(clipKey({ voice: 'male', text: '  The   Word. ' })).toBe(k);
    expect(clipKey({ voice: 'female', text: 'The Word.' })).not.toBe(k);
    expect(clipKey({ voice: 'male', model: 'en_US-ryan-high', text: 'The Word.' })).not.toBe(k);
    expect(clipKey({ voice: 'male', text: 'The Word!' })).not.toBe(k);
    expect(LITE_MODELS.male).toBe('en_US-ryan-medium');
  });

  it('a lesson’s pieces are remembered per voice, so the panel can say what is kept', () => {
    const mem = new Map();
    const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
    rememberReadingKeys('ll191', 'male', ['x', 'y'], storage);
    expect(recallReadingKeys('ll191', 'male', storage)).toEqual(['x', 'y']);
    expect(recallReadingKeys('ll191', 'female', storage)).toBe(null);
  });
});
