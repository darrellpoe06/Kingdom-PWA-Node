// @vitest-environment node
// =============================================================================
// The reader keeps playing when the phone switches apps (Darrell 2026-09-24)
// =============================================================================
// "Why doesn't the player remain playing in the background when I switch
// between apps?!!? Fix it." With the GPU studio offline the reader fell back to
// the phone's Web Speech voice, which Android stops in the background. The fix:
// the stand-in voice is REAL AUDIO from the NAS (/voice-lite), played piece by
// piece through ONE audio element — media, which the phone keeps playing — and
// the panel says honestly, per voice, what happens when you switch apps.
//
// Proven-to-catch:
//   • the prefetch test fails if the next piece is not fetched while one plays;
//   • the advance test fails if 'ended' does not move to the next piece;
//   • the speed test fails if a new piece loses the chosen playbackRate;
//   • the fallback test fails if a lost piece silences the rest of the reading;
//   • the honest-copy tests fail against the old one-claim-for-all footer.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkForClips, createClipQueue, overallFraction } from '../lib/clip-queue.js';
import { synthesizeLite, mayTryLiteVoice, markLiteVoiceDown, _resetLiteVoiceForTests, LITE_DOWN_MS } from '../lib/voice-service.js';

const HERE = dirname(fileURLToPath(import.meta.url));

function fakeAudio() {
  const a = {
    src: '', paused: true, playbackRate: 1, defaultPlaybackRate: 1, currentTime: 0, duration: NaN,
    onended: null, ontimeupdate: null,
    play: vi.fn(function play() { this.paused = false; return Promise.resolve(); }),
    pause: vi.fn(function pause() { this.paused = true; }),
  };
  // A new src resets the rate, the way a real element's load does.
  let src = '';
  Object.defineProperty(a, 'src', { get: () => src, set: (v) => { src = v; a.playbackRate = a.defaultPlaybackRate = 1; } });
  return a;
}
const flush = () => new Promise((r) => setTimeout(r, 0));
const LESSON = 'In the beginning was the Word. And the Word was with God. And the Word was God. The same was in the beginning with God. All things were made by Him. And without Him was not any thing made that was made. In Him was life. And the life was the light of men.';

describe('the reading is cut into pieces a voice can speak', () => {
  it('one piece per reading segment, each short, nothing lost (DR-0653)', () => {
    const chunks = chunkForClips(LESSON);
    expect(chunks.length).toBeGreaterThan(2);
    for (const c of chunks) expect(c.len).toBeLessThanOrEqual(180);
    expect(chunks.map((c) => c.text).join(' ').replace(/\s+/g, ' ')).toBe(LESSON);
  });

  it('progress is a fraction of the WHOLE reading, so the highlight moves across pieces', () => {
    const chunks = [{ text: 'a', len: 100 }, { text: 'b', len: 300 }];
    expect(overallFraction(chunks, 0, 0)).toBe(0);
    expect(overallFraction(chunks, 0, 1)).toBe(0.25);
    expect(overallFraction(chunks, 1, 0.5)).toBe(0.625);
  });
});

describe('the clip queue plays real audio, piece after piece', () => {
  let chunks;
  beforeEach(() => { chunks = chunkForClips(LESSON); });

  it('plays the first piece through ONE audio element and PREFETCHES the next', async () => {
    const audio = fakeAudio();
    const fetchClip = vi.fn(async (t) => ({ url: `blob:${t.slice(0, 8)}` }));
    const q = createClipQueue({ chunks, fetchClip, audio });
    expect(await q.start()).toBe(true);
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.src).toMatch(/^blob:/);
    // Pieces 1 and 2 were asked for before piece 0 finished (two ahead,
    // because the pieces are short and the NAS CPU takes two at once).
    expect(fetchClip.mock.calls.map((c) => c[0])).toEqual([chunks[0].text, chunks[1].text, chunks[2].text]);
  });

  it('advances to the next paragraph when a piece ends, and ends after the last', async () => {
    const audio = fakeAudio();
    const onPiece = vi.fn();
    const onEnd = vi.fn();
    const q = createClipQueue({ chunks, fetchClip: async (t) => ({ url: `blob:${t}` }), audio, onPiece, onEnd });
    await q.start();
    for (let i = 1; i < chunks.length; i++) {
      audio.onended();
      await flush(); await flush();
      expect(q.index).toBe(i);
      expect(audio.src).toBe(`blob:${chunks[i].text}`);
    }
    audio.onended();
    await flush(); await flush();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onPiece.mock.calls.map((c) => c[0])).toEqual(chunks.map((_, i) => i));
  });

  it('keeps the chosen speed on every new piece, and takes a new speed mid-reading', async () => {
    const audio = fakeAudio();
    const q = createClipQueue({ chunks, fetchClip: async (t) => ({ url: `blob:${t}` }), audio, rate: 1.5 });
    await q.start();
    expect(audio.playbackRate).toBe(1.5);
    audio.onended(); await flush(); await flush();
    expect(audio.playbackRate).toBe(1.5); // the new src reset it; the queue put it back
    q.setRate(0.8);
    expect(audio.playbackRate).toBe(0.8);
    audio.onended(); await flush(); await flush();
    expect(audio.playbackRate).toBe(0.8);
  });

  it('a piece that cannot be had hands the REST of the reading back (never silence)', async () => {
    const audio = fakeAudio();
    const onFallback = vi.fn();
    const fetchClip = async (t) => (t === chunks[1].text ? { error: 'voice-lite-502' } : { url: `blob:${t}` });
    const q = createClipQueue({ chunks, fetchClip, audio, onFallback });
    await q.start();
    audio.onended(); await flush(); await flush();
    expect(onFallback).toHaveBeenCalledTimes(1);
    const [rest, index] = onFallback.mock.calls[0];
    expect(index).toBe(1);
    expect(rest).toBe(chunks.slice(1).map((c) => c.text).join(' '));
  });

  it('stop() halts: no further piece plays after it', async () => {
    const audio = fakeAudio();
    const q = createClipQueue({ chunks, fetchClip: async (t) => ({ url: `blob:${t}` }), audio });
    await q.start();
    q.stop();
    audio.onended(); await flush(); await flush();
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(audio.pause).toHaveBeenCalled();
  });
});

describe('the NAS audio voice road (/voice-lite)', () => {
  beforeEach(() => { _resetLiteVoiceForTests(); globalThis.URL.createObjectURL = () => 'blob:clip'; });
  const res = (status, ctype, size = 1000) => ({
    ok: status >= 200 && status < 300, status,
    headers: { get: (k) => (k.toLowerCase() === 'content-type' ? ctype : null) },
    blob: async () => ({ size }),
  });

  it('a real audio answer becomes a playable clip, asked of the same-origin route', async () => {
    const fetchImpl = vi.fn(async () => res(200, 'audio/wav'));
    const out = await synthesizeLite({ text: 'In the beginning was the Word.', voice: 'male', fetchImpl, origin: 'https://poetech.us' });
    expect(out).toEqual({ url: 'blob:clip' });
    expect(fetchImpl.mock.calls[0][0]).toBe('https://poetech.us/voice-lite/speak');
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ text: 'In the beginning was the Word.', voice: 'male' });
  });

  it('the app shell falling through (200 text/html) is NOT a voice', async () => {
    const out = await synthesizeLite({ text: 'x', fetchImpl: async () => res(200, 'text/html'), origin: '' });
    expect(out.error).toBe('voice-lite-not-audio');
  });

  it('a refused key or a dark road is a tagged error, and the road rests before it is asked again', async () => {
    expect((await synthesizeLite({ text: 'x', fetchImpl: async () => res(401, 'application/json'), origin: '' })).error).toBe('voice-lite-401');
    expect(mayTryLiteVoice(1000)).toBe(true);
    markLiteVoiceDown(1000);
    expect(mayTryLiteVoice(1000 + LITE_DOWN_MS - 1)).toBe(false);
    expect(mayTryLiteVoice(1000 + LITE_DOWN_MS)).toBe(true);
  });
});

describe('the panel says honestly what happens when you switch apps', () => {
  it('per voice: audio keeps playing, the phone voice stops, and says why', async () => {
    const { backgroundLine, BACKGROUND_LINES } = await import('../components/TTSControl.jsx');
    expect(backgroundLine({ isReading: true, audioVoice: 'device' })).toBe('This voice stops when you switch apps — the audio voice is offline.');
    expect(backgroundLine({ isReading: true, audioVoice: 'audio' })).toBe(BACKGROUND_LINES.audio);
    expect(BACKGROUND_LINES.audio).toMatch(/keeps playing when you switch apps/);
    expect(backgroundLine({ isReading: false })).toBe(BACKGROUND_LINES.idle);
    expect(BACKGROUND_LINES.idle).toMatch(/stops when you switch apps/);
  }, 30000);

  it('the old one-claim-for-all promise is gone from the rendered panel copy', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'TTSControl.jsx'), 'utf8');
    const jsx = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    expect(jsx).not.toMatch(/the reading carries on when you leave the app/);
    expect(jsx).toMatch(/backgroundLine\(\{ isReading, audioVoice \}\)/);
  });

  it('the stand-in reaches for the NAS audio voice BEFORE the phone voice', () => {
    const hook = readFileSync(join(HERE, '..', 'lib', 'use-read-aloud.js'), 'utf8');
    // The voice being read is `vid` since DR-0655 (a sample reads in a voice
    // other than the pick); the order this pins is unchanged.
    const lite = hook.indexOf('await playLiteVoice(clean, vid)');
    const device = hook.indexOf("setNotice('This device can’t read aloud");
    expect(lite).toBeGreaterThan(0);
    expect(device).toBeGreaterThan(lite);
  });
});
