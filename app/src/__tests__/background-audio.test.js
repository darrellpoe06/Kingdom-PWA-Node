// @vitest-environment node
// =============================================================================
// background-audio — the Word keeps reading when the app is not on screen
// =============================================================================
// Darrell 2026-08-10: "let the reader continue after leaving the app... let it
// run in the background while I work on other apps etc... so I can hear the
// Word." A backgrounded page is frozen unless it is playing media, and Web
// Speech is not media — so the reader holds a real, silent, looping audio
// element while it reads, and wires the phone's own transport controls to the
// panel's controls.
//
// Proven-to-catch: every assertion here fails against a reader with no audio
// session at all (the shipped behavior before this) — there is no element, no
// play(), no lock-screen metadata, and the OS buttons drive nothing.
import { describe, it, expect, vi } from 'vitest';
import { createBackgroundAudio, silentWavDataUri } from '../lib/background-audio.js';

function fakeAudio() {
  return {
    paused: true, loop: false, src: '',
    play: vi.fn(function play() { this.paused = false; return Promise.resolve(); }),
    pause: vi.fn(function pause() { this.paused = true; }),
    setAttribute: vi.fn(),
  };
}

function fakeWin({ withMediaSession = true } = {}) {
  const ms = {
    metadata: null, playbackState: 'none', handlers: {},
    setActionHandler: vi.fn(function set(name, fn) { this.handlers[name] = fn; }),
  };
  return {
    navigator: withMediaSession ? { mediaSession: ms } : {},
    MediaMetadata: function MediaMetadata(init) { Object.assign(this, init); },
    _ms: ms,
  };
}

describe('silentWavDataUri', () => {
  it('is a real, decodable WAV — RIFF/WAVE header and one byte per sample frame', () => {
    const uri = silentWavDataUri(0.25, 8000);
    expect(uri.startsWith('data:audio/wav;base64,')).toBe(true);
    const bytes = Buffer.from(uri.split(',')[1], 'base64');
    expect(bytes.slice(0, 4).toString('ascii')).toBe('RIFF');
    expect(bytes.slice(8, 12).toString('ascii')).toBe('WAVE');
    expect(bytes.slice(36, 40).toString('ascii')).toBe('data');
    expect(bytes.length).toBe(44 + 2000); // 0.25s at 8kHz, 8-bit mono
  });

  it('is SILENT by construction, not by volume — every sample is 8-bit zero-level', () => {
    const bytes = Buffer.from(silentWavDataUri(0.05, 8000).split(',')[1], 'base64');
    const samples = new Set(bytes.slice(44));
    expect([...samples]).toEqual([128]); // 128 IS silence in unsigned 8-bit PCM
  });
});

describe('the reading holds an audio session', () => {
  it('start() plays a looping element — the thing that keeps a backgrounded page alive', () => {
    const el = fakeAudio();
    const bg = createBackgroundAudio({ win: fakeWin(), makeAudio: () => el });
    expect(bg.start()).toBe(true);
    expect(el.play).toHaveBeenCalled();
    expect(el.loop).toBe(true);
    expect(bg.active).toBe(true);
  });

  it('reuses ONE element across repeated starts — reading two pieces never stacks sessions', () => {
    const made = [];
    const bg = createBackgroundAudio({ win: fakeWin(), makeAudio: () => { const a = fakeAudio(); made.push(a); return a; } });
    bg.start(); bg.start(); bg.start();
    expect(made.length).toBe(1);
    expect(made[0].play).toHaveBeenCalledTimes(3);
  });

  it('stop() releases the session and clears the lock-screen card', () => {
    const el = fakeAudio();
    const win = fakeWin();
    const bg = createBackgroundAudio({ win, makeAudio: () => el });
    bg.start();
    bg.describe({ title: 'Thinking It Through' });
    bg.stop();
    expect(el.pause).toHaveBeenCalled();
    expect(bg.active).toBe(false);
    expect(win._ms.playbackState).toBe('none');
    expect(win._ms.metadata).toBe(null);
  });

  it('a play() the browser refuses (gesture spent) never throws into the read', () => {
    const el = fakeAudio();
    el.play = () => Promise.reject(new Error('NotAllowedError'));
    const bg = createBackgroundAudio({ win: fakeWin(), makeAudio: () => el });
    expect(() => bg.start()).not.toThrow();
  });
});

describe('the phone’s own controls drive the reader', () => {
  it('names the reading on the lock screen', () => {
    const win = fakeWin();
    const bg = createBackgroundAudio({ win, makeAudio: fakeAudio });
    expect(bg.describe({ title: 'Study 1 · Conditional Truth' })).toBe(true);
    expect(win._ms.metadata.title).toBe('Study 1 · Conditional Truth');
    expect(win._ms.metadata.artist).toContain('Read Aloud');
  });

  it('play/pause/stop from the OS call the reader’s OWN controls', () => {
    const win = fakeWin();
    const bg = createBackgroundAudio({ win, makeAudio: fakeAudio });
    const onPlay = vi.fn(); const onPause = vi.fn(); const onStop = vi.fn();
    expect(bg.onControl({ onPlay, onPause, onStop })).toBe(true);
    win._ms.handlers.play();
    win._ms.handlers.pause();
    win._ms.handlers.stop();
    expect(onPlay).toHaveBeenCalled();
    expect(onPause).toHaveBeenCalled();
    expect(onStop).toHaveBeenCalled();
  });

  it('a throwing handler never kills the media session', () => {
    const win = fakeWin();
    const bg = createBackgroundAudio({ win, makeAudio: fakeAudio });
    bg.onControl({ onPlay: () => { throw new Error('boom'); } });
    expect(() => win._ms.handlers.play()).not.toThrow();
  });

  it('reports playing/paused so the OS control never contradicts the panel', () => {
    const win = fakeWin();
    const bg = createBackgroundAudio({ win, makeAudio: fakeAudio });
    bg.setState('playing');
    expect(win._ms.playbackState).toBe('playing');
    bg.setState('paused');
    expect(win._ms.playbackState).toBe('paused');
  });
});

describe('unbreakable on a device without any of this', () => {
  it('no Media Session support: every call is a safe false, reading still works', () => {
    const bg = createBackgroundAudio({ win: fakeWin({ withMediaSession: false }), makeAudio: fakeAudio });
    expect(bg.describe({ title: 'x' })).toBe(false);
    expect(bg.onControl({ onPlay: () => {} })).toBe(false);
    expect(bg.setState('playing')).toBe(false);
    expect(bg.start()).toBe(true); // the keep-alive itself is independent
  });

  it('no window at all (SSR / a node render): nothing throws and nothing pretends', () => {
    const bg = createBackgroundAudio({ win: null });
    expect(bg.start()).toBe(false);
    expect(bg.active).toBe(false);
    expect(() => bg.stop()).not.toThrow();
  });
});
