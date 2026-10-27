// =============================================================================
// The NAS-voice queue never hangs on a bad piece
// =============================================================================
// Darrell 2026-10-27: "Not one stone lesson will not play all the way through
// the lesson!!!" Measured in lib/clip-queue.js: the element's 'ended' was the
// only event the queue listened for. A piece the element could not play
// fired 'error' and never 'ended' — the queue waited forever, the panel still
// said it was playing — and a bad blob kept on the device stopped the same
// lesson at the same sentence every time.
//
// Now: an element error, or a piece that has not begun STALL_MS after play()
// was accepted, asks for the piece again ONCE, fresh from the voice (the kept
// copy forgotten); a second fault hands the rest on as a fetch failure always
// did; a fault inside the joined file drops the join and carries on piece by
// piece. And only real audio is ever kept or served (lib/clip-cache.js).
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClipQueue, chunkForClips, STALL_MS } from '../lib/clip-queue.js';
import { createClipSource, createClipCache, memoryBackend, looksLikeAudio } from '../lib/clip-cache.js';

const SRC = (rel) => readFileSync(join(process.cwd(), 'src', rel), 'utf8');
const tick = () => new Promise((r) => setTimeout(r, 0));
const TEXT = 'One sentence here. Two sentence here. Three sentence here. Four sentence here.';

function audioEl() {
  const handlers = {};
  return {
    src: '', paused: true, ended: false, playbackRate: 1, defaultPlaybackRate: 1, duration: 2, currentTime: 0,
    play() { this.paused = false; this.ended = false; return Promise.resolve(); },
    pause() { this.paused = true; },
    addEventListener(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
    removeEventListener(ev, fn) { handlers[ev] = (handlers[ev] || []).filter((f) => f !== fn); },
    fire(ev) { (handlers[ev] || []).forEach((f) => f()); },
    end() { this.ended = true; this.paused = true; this.onended(); },
  };
}

describe('an element error on a piece', () => {
  it('asks for that piece again, fresh, and plays it; a second error hands the rest on', async () => {
    const chunks = chunkForClips(TEXT);
    const audio = audioEl();
    const fetchClip = vi.fn(async (t, i) => ({ url: `blob:${i}` }));
    const fetchFresh = vi.fn(async (t, i) => ({ url: `fresh:${i}` }));
    const onFallback = vi.fn();
    const onEnd = vi.fn();
    const q = createClipQueue({ chunks, audio, fetchClip, fetchFresh, onFallback, onEnd, schedule: () => 1, unschedule: () => {} });
    await q.start();
    await tick();
    expect(audio.src).toBe('blob:0');
    audio.end(); await tick(); await tick();
    expect(audio.src).toBe('blob:1');
    audio.fire('error');                          // piece 1 would not decode
    await tick(); await tick();
    expect(fetchFresh).toHaveBeenCalledTimes(1);
    expect(fetchFresh.mock.calls[0][1]).toBe(1);
    expect(audio.src, 'the fresh copy is on the element').toBe('fresh:1');
    expect(onFallback).not.toHaveBeenCalled();
    audio.fire('error');                          // and the fresh copy fails too
    await tick();
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback.mock.calls[0][1]).toBe(1);
    expect(onFallback.mock.calls[0][2]).toBe('piece-unplayable');
    expect(onFallback.mock.calls[0][0]).toMatch(/^Two sentence here\./);
    expect(onEnd, 'a fault is never the end of the reading').not.toHaveBeenCalled();
  });

  it('with no fresh road, the rest is handed on at once — never a silent wait', async () => {
    const chunks = chunkForClips(TEXT);
    const audio = audioEl();
    const onFallback = vi.fn();
    const q = createClipQueue({ chunks, audio, fetchClip: async (t, i) => ({ url: `blob:${i}` }), onFallback, schedule: () => 1, unschedule: () => {} });
    await q.start(); await tick();
    audio.fire('error');
    await tick();
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback.mock.calls[0][2]).toBe('piece-unplayable');
  });

  it('a fault inside the joined file drops the join and carries on piece by piece from the same sentence', async () => {
    const chunks = chunkForClips(TEXT);
    const audio = audioEl();
    const fetchClip = vi.fn(async (t, i) => ({ url: `blob:${i}` }));
    const onFallback = vi.fn();
    const q = createClipQueue({ chunks, audio, fetchClip, fetchFresh: async (t, i) => ({ url: `fresh:${i}` }), onFallback, schedule: () => 1, unschedule: () => {} });
    await q.start(); await tick();
    expect(q.join({ url: 'blob:joined', offsets: chunks.map((c, i) => i * 2), duration: chunks.length * 2 })).toBe(true);
    audio.end(); await tick(); await tick();      // the join takes over at the boundary
    expect(q.joined).toBe(true);
    expect(audio.src).toBe('blob:joined');
    audio.currentTime = 5; audio.ontimeupdate();  // into piece 2
    audio.fire('error');                          // the joined file faults
    await tick(); await tick();
    expect(q.joined).toBe(false);
    expect(audio.src, 'piece 2, as a piece').toBe('blob:2');
    expect(onFallback).not.toHaveBeenCalled();
  });
});

describe('a piece that never begins', () => {
  it('is taken as stuck after STALL_MS and asked for again; one that is playing, or paused by the listener, is left alone', async () => {
    const chunks = chunkForClips(TEXT);
    const audio = audioEl();
    const due = [];
    const fetchFresh = vi.fn(async (t, i) => ({ url: `fresh:${i}` }));
    const q = createClipQueue({ chunks, audio, fetchClip: async (t, i) => ({ url: `blob:${i}` }), fetchFresh, onFallback: () => {}, schedule: (fn, ms) => { due.push({ fn, ms }); return due.length; }, unschedule: () => {} });
    await q.start(); await tick();
    expect(due.length).toBe(1);
    expect(due[0].ms).toBe(STALL_MS);
    // Playing: the clock moved. Left alone.
    audio.currentTime = 0.5;
    due[0].fn();
    await tick();
    expect(fetchFresh).not.toHaveBeenCalled();
    // Paused by the listener at the top: left alone.
    audio.currentTime = 0; audio.paused = true;
    due[0].fn();
    await tick();
    expect(fetchFresh).not.toHaveBeenCalled();
    // Accepted, not paused, never moved: stuck.
    audio.paused = false;
    due[0].fn();
    await tick(); await tick();
    expect(fetchFresh).toHaveBeenCalledTimes(1);
    expect(audio.src).toBe('fresh:0');
  });
});

describe('only audio is kept or served', () => {
  const wav = () => new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4])]);          // RIFF
  const html = () => new Blob([new TextEncoder().encode('<html>error</html>')], { type: 'text/html' });
  it('looksLikeAudio trusts a blob that says audio or says nothing, and refuses one that says otherwise', async () => {
    expect(await looksLikeAudio(new Blob([new Uint8Array([1])], { type: 'audio/wav' }))).toBe(true);
    expect(await looksLikeAudio(wav())).toBe(true);
    expect(await looksLikeAudio(new Blob([new Uint8Array([1])], { type: 'application/octet-stream' }))).toBe(true);
    expect(await looksLikeAudio(html())).toBe(false);
    expect(await looksLikeAudio(new Blob(['{}'], { type: 'application/json' }))).toBe(false);
    expect(await looksLikeAudio(new Blob([]))).toBe(false);
    expect(await looksLikeAudio(null)).toBe(false);
  });
  it('a kept blob that is not audio is forgotten and the piece fetched again; a fetched non-audio body is never kept', async () => {
    const cache = createClipCache({ backend: memoryBackend(), capBytes: () => 1e9, schedule: () => 0 });
    await cache.put('k1', html());
    const fetchBlob = vi.fn(async (i) => ({ blob: i === 1 ? wav() : html() }));
    const src = createClipSource({ keys: ['k0', 'k1'], fetchBlob, cache, makeUrl: (b) => `url:${b.size}` });
    const one = await src.clip(1);
    expect(one.url, 'the bad kept copy was dropped and the voice asked').toBe('url:8');
    expect(fetchBlob).toHaveBeenCalledWith(1, undefined);
    expect(await cache.has('k1')).toBe(true);
    const zero = await src.clip(0);
    expect(zero.error).toBe('voice-lite-not-audio');
    expect(await cache.has('k0'), 'an error page is never kept').toBe(false);
  });
  it('fresh(i) forgets the kept copy and fetches the piece again', async () => {
    const cache = createClipCache({ backend: memoryBackend(), capBytes: () => 1e9, schedule: () => 0 });
    await cache.put('k0', wav());
    const fetchBlob = vi.fn(async () => ({ blob: new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46, 9, 9, 9, 9, 9])]) }));
    const src = createClipSource({ keys: ['k0'], fetchBlob, cache, makeUrl: (b) => `url:${b.size}` });
    expect((await src.clip(0)).url).toBe('url:8');
    expect(fetchBlob).not.toHaveBeenCalled();
    const got = await src.fresh(0);
    expect(got.url).toBe('url:9');
    expect(got.fresh).toBe(true);
    expect(fetchBlob).toHaveBeenCalledTimes(1);
  });
});

describe('the source pins the listeners that make this true', () => {
  it('the queue listens for error, playing and timeupdate, and arms the stall watch', () => {
    const src = SRC('lib/clip-queue.js');
    expect(src).toMatch(/listen\('error'/);
    expect(src).toMatch(/listen\('playing'/);
    expect(src).toMatch(/armStall\(i\)/);
  });
});
