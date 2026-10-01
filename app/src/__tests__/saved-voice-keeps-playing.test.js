// @vitest-environment node
// =============================================================================
// A started lesson keeps playing with the screen off or another app in front
// (DR-0718; Darrell 2026-10-01, Galaxy Fold 7, installed app: "shouldn't I be
// able to continue to hear my lessons after I start them even if I go to
// another app... it stops each time on the downloaded version?!")
// =============================================================================
// Proven-to-catch, each against origin/main before DR-0718:
//   • 'ended' with the page hidden: main awaited the next piece before putting
//     it on the element, so right after the event the element still held the
//     old piece. Fails there; passes here with no timer pending at all.
//   • the joined file: main had no join, so q.join is not a function.
//   • the keep-alive length: main looped 0.5 s of silence, which Chromium on
//     Android classes as a transient sound (<= 5 s); here it is 6 s.
//   • the saved gate: main reached the saved pieces only when the NAS voice
//     was not resting (mayTryLiteVoice), so offline they were skipped.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkForClips, createClipQueue } from '../lib/clip-queue.js';
import { joinWavs, parseWav, pieceAt, joinClipBlobs } from '../lib/joined-clip.js';
import { createBackgroundAudio, silentWavDataUri, MEDIA_ACTIONS } from '../lib/background-audio.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const LESSON = 'In the beginning was the Word. And the Word was with God. And the Word was God. The same was in the beginning with God. All things were made by Him. And without Him was not any thing made that was made.';

function fakeAudio() {
  const listeners = {};
  const a = {
    paused: true, playbackRate: 1, defaultPlaybackRate: 1, currentTime: 0, duration: NaN,
    onended: null, ontimeupdate: null,
    play: vi.fn(function play() { this.paused = false; return Promise.resolve(); }),
    pause: vi.fn(function pause() { this.paused = true; }),
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
    removeEventListener: (t, fn) => { listeners[t] = (listeners[t] || []).filter((f) => f !== fn); },
  };
  let src = '';
  Object.defineProperty(a, 'src', { get: () => src, set: (v) => { src = v; a.currentTime = 0; } });
  return a;
}
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

// A real PCM WAV: `seconds` of 16-bit mono at `rate` Hz.
function wav(seconds, rate = 22050, value = 0) {
  const frames = Math.round(seconds * rate);
  const b = new Uint8Array(44 + frames * 2);
  const s = (at, t) => { for (let i = 0; i < t.length; i++) b[at + i] = t.charCodeAt(i); };
  const w32 = (at, n) => { b[at] = n & 255; b[at + 1] = (n >> 8) & 255; b[at + 2] = (n >> 16) & 255; b[at + 3] = (n >> 24) & 255; };
  const w16 = (at, n) => { b[at] = n & 255; b[at + 1] = (n >> 8) & 255; };
  s(0, 'RIFF'); w32(4, 36 + frames * 2); s(8, 'WAVE'); s(12, 'fmt '); w32(16, 16); w16(20, 1); w16(22, 1);
  w32(24, rate); w32(28, rate * 2); w16(32, 2); w16(34, 16); s(36, 'data'); w32(40, frames * 2);
  b.fill(value, 44);
  return b;
}

const realDocument = globalThis.document;
afterEach(() => { vi.useRealTimers(); if (realDocument === undefined) delete globalThis.document; else globalThis.document = realDocument; });

describe('with the screen off, the next sentence starts inside the ended event', () => {
  it("'ended' while hidden swaps the next piece in synchronously, with no timer and no visibility gate", async () => {
    globalThis.document = { visibilityState: 'hidden', hidden: true, addEventListener() {}, removeEventListener() {} };
    vi.useFakeTimers();
    const chunks = chunkForClips(LESSON);
    expect(chunks.length).toBeGreaterThan(2);
    const audio = fakeAudio();
    const seen = [];
    const q = createClipQueue({ chunks, audio, fetchClip: async (t, i) => ({ url: `blob:piece-${i}` }), onPiece: (i) => seen.push(i) });
    await q.start();
    await flush(); // the prefetch of the next pieces has arrived
    expect(audio.src).toBe('blob:piece-0');
    const playsBefore = audio.play.mock.calls.length;
    audio.onended(); // the phone ends piece 0 with the page hidden
    // Synchronous: no await, no timer between the end of one sentence and the next.
    expect(audio.src).toBe('blob:piece-1');
    expect(audio.play.mock.calls.length).toBe(playsBefore + 1);
    expect(vi.getTimerCount()).toBe(0);
    expect(seen).toEqual([0, 1]);
    // And on to the end, still hidden.
    for (let i = 2; i < chunks.length; i++) { await flush(); audio.onended(); expect(audio.src).toBe(`blob:piece-${i}`); }
    q.stop();
  });

  it('the queue reads no visibility state at all (nothing in it can pause on hide)', () => {
    const src = readFileSync(join(HERE, '..', 'lib', 'clip-queue.js'), 'utf8')
      .split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    expect(src).not.toMatch(/visibilityState|document\.hidden|visibilitychange|setTimeout|setInterval/);
  });
});

describe('a reading on the device plays as ONE file', () => {
  it('joins WAV pieces into one WAV, with where each piece starts', () => {
    const j = joinWavs([wav(1.0), wav(0.5), wav(2.0)]);
    expect(j).toBeTruthy();
    expect(j.offsets).toEqual([0, 1, 1.5]);
    expect(j.duration).toBeCloseTo(3.5, 5);
    const back = parseWav(j.bytes);
    expect(back.sampleRate).toBe(22050);
    expect(back.data.length).toBe(Math.round(3.5 * 22050) * 2);
    expect(pieceAt(j.offsets, 0.2)).toBe(0);
    expect(pieceAt(j.offsets, 1.2)).toBe(1);
    expect(pieceAt(j.offsets, 3)).toBe(2);
  });

  it('pieces that disagree on format, or are not WAV, are not joined (piece by piece instead)', () => {
    expect(joinWavs([wav(1, 22050), wav(1, 16000)])).toBeNull();
    expect(joinWavs([wav(1), new Uint8Array([1, 2, 3])])).toBeNull();
  });

  it('joins Blobs from the device cache', async () => {
    const j = await joinClipBlobs([new Blob([wav(1)]), new Blob([wav(1)])]);
    expect(j.blob.type).toBe('audio/wav');
    expect(j.offsets).toEqual([0, 1]);
  });

  it('a saved reading plays the joined file start to finish: one src, no swap, highlight follows', async () => {
    globalThis.document = { visibilityState: 'hidden', hidden: true, addEventListener() {}, removeEventListener() {} };
    const chunks = chunkForClips(LESSON);
    const offsets = chunks.map((_, i) => i * 2);
    const audio = fakeAudio();
    const fetchClip = vi.fn(async () => ({ error: 'offline' }));
    const pieces = []; const ends = vi.fn(); const pos = [];
    const q = createClipQueue({ chunks, audio, fetchClip, onPiece: (i) => pieces.push(i), onEnd: ends, onPosition: (p) => pos.push(p) });
    expect(q.join({ url: 'blob:whole', offsets, duration: chunks.length * 2 })).toBe(true);
    await q.start();
    expect(fetchClip).not.toHaveBeenCalled(); // nothing from the network
    expect(audio.src).toBe('blob:whole');
    expect(q.joined).toBe(true);
    audio.currentTime = 4.5; audio.ontimeupdate();
    expect(pieces).toEqual([0, 2]);
    expect(pos.at(-1)).toMatchObject({ position: 4.5, duration: chunks.length * 2 });
    audio.onended();
    expect(ends).toHaveBeenCalledTimes(1);
    expect(audio.src).toBe('blob:whole'); // never swapped
  });

  it('a reading that finishes downloading moves onto the joined file at the next sentence', async () => {
    const chunks = chunkForClips(LESSON);
    const audio = fakeAudio();
    const q = createClipQueue({ chunks, audio, fetchClip: async (t, i) => ({ url: `blob:piece-${i}` }) });
    await q.start();
    await flush();
    expect(audio.src).toBe('blob:piece-0');
    q.join({ url: 'blob:whole', offsets: chunks.map((_, i) => i * 3), duration: chunks.length * 3 });
    audio.onended();
    expect(audio.src).toBe('blob:whole');
    expect(audio.currentTime).toBe(3); // piece 1 starts at 3 s
  });

  it('use-read-aloud joins a saved reading and hands the queue the whole file', () => {
    const hook = readFileSync(join(HERE, '..', 'lib', 'use-read-aloud.js'), 'utf8');
    expect(hook).toMatch(/joinClipBlobs\(/);
    expect(hook).toMatch(/if \(whole\) q\.join\(whole\)/);
  });

  it('a saved reading is played even while the NAS voice is resting (offline)', () => {
    const hook = readFileSync(join(HERE, '..', 'lib', 'use-read-aloud.js'), 'utf8');
    expect(hook).toMatch(/\(mayTryLiteVoice\(\) \|\| await savedOnDevice\(clean\)\)/);
  });
});

describe('the phone keeps the reading as media: lock screen, notification, buttons', () => {
  it('the keep-alive loop is longer than five seconds (a persistent player, not a transient sound)', () => {
    const made = [];
    const bg = createBackgroundAudio({ win: { navigator: {} }, makeAudio: (src) => { made.push(src); return { play: () => Promise.resolve(), pause() {}, setAttribute() {}, paused: true }; } });
    bg.start();
    const bytes = Buffer.from(made[0].split(',')[1], 'base64');
    const parsed = parseWav(new Uint8Array(bytes));
    expect(parsed.data.length / parsed.byteRate).toBeGreaterThan(5);
    expect(silentWavDataUri(6).length).toBeGreaterThan(silentWavDataUri(0.5).length);
  });

  it('registers play, pause, stop, next and previous with navigator.mediaSession', () => {
    const set = {};
    const ms = { setActionHandler: (a, fn) => { set[a] = fn; }, metadata: null, playbackState: 'none', setPositionState: vi.fn() };
    function MediaMetadata(o) { Object.assign(this, o); }
    const bg = createBackgroundAudio({ win: { navigator: { mediaSession: ms }, MediaMetadata }, makeAudio: () => ({ play: () => Promise.resolve(), pause() {}, setAttribute() {} }) });
    const h = { onPlay: vi.fn(), onPause: vi.fn(), onStop: vi.fn(), onNext: vi.fn(), onPrev: vi.fn() };
    expect(bg.onControl(h)).toBe(true);
    for (const a of ['play', 'pause', 'stop', 'nexttrack', 'previoustrack']) expect(typeof set[a]).toBe('function');
    set.nexttrack(); set.previoustrack(); set.pause();
    expect(h.onNext).toHaveBeenCalled(); expect(h.onPrev).toHaveBeenCalled(); expect(h.onPause).toHaveBeenCalled();
    expect(bg.describe({ title: 'Lesson 191' })).toBe(true);
    expect(ms.metadata.title).toBe('Lesson 191');
    expect(bg.setPosition({ duration: 600, position: 30, playbackRate: 1.25 })).toBe(true);
    expect(ms.setPositionState).toHaveBeenCalledWith({ duration: 600, position: 30, playbackRate: 1.25 });
    expect(MEDIA_ACTIONS).toEqual(expect.arrayContaining(['play', 'pause', 'nexttrack', 'previoustrack']));
  });
});

describe('the panel says which voice will read, before Play', () => {
  it('names the phone voice, and a saved lesson, before the press', async () => {
    const { backgroundLine, BACKGROUND_LINES } = await import('../components/TTSControl.jsx');
    expect(backgroundLine({ isReading: false, usesNasVoice: false })).toBe(BACKGROUND_LINES.phone);
    expect(BACKGROUND_LINES.phone).toMatch(/stops it when you switch apps/);
    expect(backgroundLine({ isReading: false, usesNasVoice: true, saved: true })).toBe(BACKGROUND_LINES.saved);
    expect(BACKGROUND_LINES.saved).toMatch(/keeps playing when you switch apps/);
    expect(backgroundLine({ isReading: false })).toBe(BACKGROUND_LINES.idle);
  }, 30000);
});
