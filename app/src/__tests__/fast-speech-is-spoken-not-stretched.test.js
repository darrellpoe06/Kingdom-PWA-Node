// @vitest-environment node
// =============================================================================
// Fast speech is SPOKEN fast by the voice, not stretched by the browser
// =============================================================================
// Darrell 2026-10-07: "the voice mumbles at times when on faster speaking
// especially... fix it."
//
// What the code did: every NAS clip (Piper on /voice-lite, XTTS in the studio)
// was synthesized at 1x and then sped up in the browser with playbackRate and
// pitch preservation. That is a time-stretch, and a time-stretch at 2x and
// beyond smears consonants into exactly the mumble he hears — the words were
// right, the audio was mangled after the fact. Both voices can simply SPEAK
// faster (Piper --length_scale, XTTS speed), and spoken-fast words stay words.
//
// The contract pinned here:
//   • the reader's rate becomes the pace the voice is asked for, within what
//     the voice says clearly (0.5..2.0); 1 is never sent, so every saved clip
//     keeps its key and its answer;
//   • the element stretches only the remainder (rate / pace);
//   • a clip spoken at a pace other than 1 has its own cache key, and the 1x
//     key is byte-for-byte the old key;
//   • the piece queue applies the remainder PER PIECE, from what each piece
//     says about itself, and a joined (saved, 1x) reading is stretched as before.
// Proven-to-catch: against the code as it was, the body carried no speed and
// the element took the full rate.
import { describe, it, expect, vi } from 'vitest';
import { synthesizeLite, voiceSpeedFor, residualRate, VOICE_SPEED_MAX, VOICE_SPEED_MIN } from '../lib/voice-service.js';
import { clipKey } from '../lib/clip-cache.js';
import { createClipQueue, chunkForClips } from '../lib/clip-queue.js';

describe('the pace the voice is asked for', () => {
  it('is the rate, clamped to what the voice says clearly; nonsense is 1', () => {
    expect(voiceSpeedFor(1)).toBe(1);
    expect(voiceSpeedFor(1.5)).toBe(1.5);
    expect(voiceSpeedFor(2)).toBe(2);
    expect(voiceSpeedFor(3)).toBe(VOICE_SPEED_MAX);
    expect(voiceSpeedFor(5)).toBe(VOICE_SPEED_MAX);
    expect(voiceSpeedFor(0.7)).toBe(0.7);
    expect(voiceSpeedFor(0.1)).toBe(VOICE_SPEED_MIN);
    expect(voiceSpeedFor('fast')).toBe(1);
    expect(voiceSpeedFor(NaN)).toBe(1);
  });
  it('the remainder is rate over pace: a 2x reading spoken at 2x plays at 1x; 5x spoken at 2x plays at 2.5x', () => {
    expect(residualRate(2, 2)).toBe(1);
    expect(residualRate(5, 2)).toBe(2.5);
    expect(residualRate(1.5, 1.5)).toBe(1);
    expect(residualRate(3, 1)).toBe(3);
    expect(residualRate(3, undefined)).toBe(3);
  });
});

describe('the NAS voice is asked for the pace', () => {
  const res = (status, ctype) => ({
    ok: status >= 200 && status < 300, status,
    headers: { get: (k) => (k.toLowerCase() === 'content-type' ? ctype : null) },
    blob: async () => ({ size: 100 }),
  });
  it('carries speed when it is not 1, and nothing when it is (the old body, byte for byte)', async () => {
    globalThis.URL.createObjectURL = () => 'blob:clip';
    const f = vi.fn(async () => res(200, 'audio/wav'));
    await synthesizeLite({ text: 'Quickly now.', voice: 'male', speed: 2, fetchImpl: f, origin: '' });
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ text: 'Quickly now.', voice: 'male', format: 'wav', speed: 2 });
    await synthesizeLite({ text: 'Quickly now.', voice: 'male', speed: 5, fetchImpl: f, origin: '' });
    expect(JSON.parse(f.mock.calls[1][1].body).speed).toBe(VOICE_SPEED_MAX);
    await synthesizeLite({ text: 'Plainly.', voice: 'male', fetchImpl: f, origin: '' });
    expect(JSON.parse(f.mock.calls[2][1].body)).toEqual({ text: 'Plainly.', voice: 'male', format: 'wav' });
  });
});

describe('a pace has its own clip key; 1x is the old key', () => {
  it('keys', () => {
    const base = clipKey({ voice: 'male', text: 'In the beginning was the Word.' });
    expect(clipKey({ voice: 'male', text: 'In the beginning was the Word.', speed: 1 })).toBe(base);
    expect(clipKey({ voice: 'male', text: 'In the beginning  was the Word.' })).toBe(base);
    expect(clipKey({ voice: 'male', text: 'In the beginning was the Word.', speed: 2 })).not.toBe(base);
    expect(clipKey({ voice: 'male', text: 'In the beginning was the Word.', speed: 2 })).not.toBe(clipKey({ voice: 'male', text: 'In the beginning was the Word.', speed: 1.5 }));
    // The 1x key's shape is pinned so a saved lesson from before today still answers.
    expect(base).toMatch(/^v1-[0-9a-z]+$/);
  });
});

describe('the queue stretches only the remainder, per piece', () => {
  const audioEl = () => ({ src: '', paused: true, playbackRate: 1, defaultPlaybackRate: 1, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } });
  const tick = async () => { await new Promise((r) => setTimeout(r, 0)); await new Promise((r) => setTimeout(r, 0)); };

  it('a 2x reading whose pieces were spoken at 2x plays at 1x; a piece that says nothing is stretched to the rate', async () => {
    const pieces = chunkForClips('One sentence here. Two sentence here. Three sentence here.');
    const audio = audioEl();
    const rates = [];
    const q = createClipQueue({
      chunks: pieces, audio, rate: 2,
      fetchClip: async (t, i) => (i === 2 ? { url: `blob:${i}` } : { url: `blob:${i}`, speed: 2 }),
      onPiece: () => rates.push(audio.playbackRate),
    });
    await q.start();
    audio.onended(); await tick();
    audio.onended(); await tick();
    expect(rates).toEqual([1, 1, 2]);
  });

  it('a live speed change keeps the piece pace in the sum: 2x spoken, rate to 3x, the element goes to 1.5x', async () => {
    const pieces = chunkForClips('One sentence here. Two sentence here.');
    const audio = audioEl();
    const q = createClipQueue({ chunks: pieces, audio, rate: 2, fetchClip: async (t, i) => ({ url: `blob:${i}`, speed: 2 }) });
    await q.start();
    expect(audio.playbackRate).toBe(1);
    q.setRate(3);
    expect(audio.playbackRate).toBe(1.5);
  });

  it('a joined (saved, 1x) reading is stretched to the full rate, as before', async () => {
    const pieces = chunkForClips('One sentence here. Two sentence here.');
    const audio = audioEl();
    const q = createClipQueue({ chunks: pieces, audio, rate: 2, fetchClip: async (t, i) => ({ url: `blob:${i}`, speed: 2 }) });
    q.join({ url: 'blob:joined', offsets: [0, 1.2], duration: 2.4 });
    await q.start();
    expect(audio.src).toBe('blob:joined');
    expect(audio.playbackRate).toBe(2);
  });
});
