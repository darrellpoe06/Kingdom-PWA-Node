// =============================================================================
// THE LESSON KEEPS READING WITH THE SCREEN OFF (DR-1705)
// =============================================================================
// Darrell 2026-11-26: "why does the app not work when ... you turn the screen
// off ... It's a reader app ... if you want to turn off your screen and let it
// read to you, that should be something that you're able to do."
//
// Traced: the new lesson look (learn-studio/LessonExperience.jsx) read the
// System voice through Web Speech (lib/tts.js createBrowserTTS), which Android
// Chrome stops at screen-off and iOS pauses at lock, and it held no media
// session, so the phone had no card and no buttons. These pin the fix: the
// System voice plays as real audio clips through one element, a hidden page
// does not stop the next clip, the speed holds (1.5x spoken, not stretched),
// and the phone's own play / pause / next buttons drive the lesson player.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { chosenVoiceNarrator, createCloneNarrator } from '../lib/chosen-voice-narrator.js';
import { liteClipFor, deviceVoiceNote } from '../lib/lesson-audio-voice.js';
import { paragraphStep, RELEASE_MS } from '../components/learn-studio/lesson-background.js';
import { giveSpeed } from '../components/learn-studio/lesson-speed.js';
import LessonExperience from '../components/learn-studio/LessonExperience.jsx';
import LESSON_A from '../lib/living-lessons/ll338-not-with-eyeservice.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// One fake <audio>: records every source it is handed and ends on demand.
class FakeAudio {
  static made = [];
  constructor(src = '') {
    this.src = src;
    this.sources = [];
    this.paused = true;
    this.playbackRate = 1;
    FakeAudio.made.push(this);
  }
  play() {
    this.paused = false;
    if (this.src && !String(this.src).startsWith('data:')) this.sources.push(this.src);
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  setAttribute() {}
}
const flush = async (n = 6) => {
  for (let i = 0; i < n; i += 1) await Promise.resolve();
};
const hide = () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  document.dispatchEvent(new Event('visibilitychange'));
};
const show = () => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  document.dispatchEvent(new Event('visibilitychange'));
};

const TEXT = 'The first sentence is here. The second one follows. The third ends it.';

describe('the System voice in the lesson player is real audio', () => {
  beforeEach(() => {
    FakeAudio.made = [];
  });
  afterEach(() => show());

  it('with a key and the road open, the System voice plays clips, never Web Speech', async () => {
    const base = vi.fn();
    const clips = vi.fn(async (t, i) => ({ url: `blob:clip-${i}` }));
    const make = chosenVoiceNarrator({ readVoiceId: () => 'system', base, audioRoad: () => true, systemClipFor: () => clips, AudioCtor: FakeAudio });
    const states = [];
    const n = make({ onState: (s) => states.push(s), onNote: () => {} });
    n.load(TEXT);
    n.play();
    await flush();
    expect(base).not.toHaveBeenCalled();
    const el = FakeAudio.made[0];
    expect(el.sources).toEqual(['blob:clip-0']);
    expect(clips).toHaveBeenCalledWith('The first sentence is here.', 0, 1);
  });

  it('turning the screen off does not stop it: the next clip plays while the page is hidden', async () => {
    const clips = vi.fn(async (t, i) => ({ url: `blob:clip-${i}` }));
    const states = [];
    const n = createCloneNarrator({ fetchClip: clips, AudioCtor: FakeAudio, onState: (s) => states.push(s) });
    n.load(TEXT);
    n.play();
    await flush();
    const el = FakeAudio.made[0];
    hide();
    el.onended();
    await flush();
    el.onended();
    await flush();
    expect(el.sources).toEqual(['blob:clip-0', 'blob:clip-1', 'blob:clip-2']);
    expect(states.filter((s) => s.status === 'playing').map((s) => s.segmentIndex)).toEqual(expect.arrayContaining([0, 1, 2]));
    el.onended();
    await flush();
    expect(states[states.length - 1].status).toBe('idle');
  });

  it('keeps the 1.5x speed: the voice is asked to speak at 1.5 and nothing is stretched; above 2x only the rest is stretched', async () => {
    const clips = vi.fn(async (t, i) => ({ url: `blob:clip-${i}` }));
    const n = createCloneNarrator({ fetchClip: clips, AudioCtor: FakeAudio });
    giveSpeed(n, 1.5);
    expect(n.rate).toBe(1.5);
    n.load(TEXT);
    n.play();
    await flush();
    expect(clips).toHaveBeenCalledWith('The first sentence is here.', 0, 1.5);
    expect(FakeAudio.made[0].playbackRate).toBe(1);
    n.stop();
    giveSpeed(n, 3);
    n.load(TEXT);
    n.play();
    await flush();
    expect(clips).toHaveBeenLastCalledWith(expect.any(String), expect.any(Number), 2);
    expect(FakeAudio.made[0].playbackRate).toBe(1.5);
  });

  it('a pick of the same speed keeps the pieces already made ahead (rate is readable)', async () => {
    const clips = vi.fn(async (t, i) => ({ url: `blob:clip-${i}` }));
    const n = createCloneNarrator({ fetchClip: clips, AudioCtor: FakeAudio });
    giveSpeed(n, 1.5);
    const spy = vi.spyOn(n, 'setRate');
    giveSpeed(n, 1.5);
    expect(spy).not.toHaveBeenCalled();
  });

  it('with no key, the phone reads at once and says it stops when the screen turns off', () => {
    const base = vi.fn(() => ({ marker: true }));
    const notes = [];
    const n = chosenVoiceNarrator({ readVoiceId: () => 'system', base, hasKey: () => false, audioRoad: () => false })({ onState() {}, onNote: (l) => notes.push(l) });
    expect(n).toEqual({ marker: true });
    expect(notes[notes.length - 1]).toMatch(/stops when the screen turns off/);
    expect(deviceVoiceNote('voice-lite-401')).toMatch(/signed in/);
  });

  it('a browser accent picked on purpose stays the listener’s choice', () => {
    const base = vi.fn(() => ({ marker: true }));
    const n = chosenVoiceNarrator({ readVoiceId: () => 'browser:Google UK English Female', base, audioRoad: () => true })({ onState() {}, onNote() {} });
    expect(n).toEqual({ marker: true });
  });
});

describe('liteClipFor: saved first, the road bounded, a miss remembered', () => {
  it('a clip saved on this device plays with no road', async () => {
    const blob = { size: 10 };
    const synth = vi.fn();
    const get = liteClipFor('male', { synth, cache: () => ({ get: async () => blob }), makeUrl: () => 'blob:saved' });
    expect(await get('Hello there.', 0, 1)).toEqual({ url: 'blob:saved', saved: true });
    expect(synth).not.toHaveBeenCalled();
  });

  it('a slow saved-clip lookup gives way to the road; a miss is remembered', async () => {
    const synth = vi.fn(async () => ({ error: 'voice-lite-timeout' }));
    const markMiss = vi.fn();
    const get = liteClipFor('male', { synth, markMiss, cacheMs: 5, cache: () => ({ get: () => new Promise(() => {}) }) });
    expect(await get('Hello there.', 0, 1.5)).toEqual({ error: 'voice-lite-timeout' });
    expect(synth).toHaveBeenCalledWith(expect.objectContaining({ speed: 1.5, timeoutMs: 15000 }));
    expect(markMiss).toHaveBeenCalledWith('voice-lite-timeout');
  });

  it('a clip from the road is kept on the device for the next play', async () => {
    const put = vi.fn(async () => true);
    const synth = vi.fn(async () => ({ url: 'blob:road', blob: { size: 9 } }));
    const get = liteClipFor('male', { synth, cache: () => ({ get: async () => null, put }) });
    expect(await get('Hello there.', 3, 1)).toEqual({ url: 'blob:road' });
    expect(synth).toHaveBeenCalledWith(expect.objectContaining({ timeoutMs: 60000 }));
    expect(put).toHaveBeenCalled();
  });
});

describe('paragraphStep: the car and headset skip a paragraph', () => {
  const segPara = [0, 0, 0, 1, 1, 2];
  const firstSeg = [0, 3, 5];
  it('next goes to the next paragraph, the last stays at the end', () => {
    expect(paragraphStep(segPara, firstSeg, 1, 1)).toBe(3);
    expect(paragraphStep(segPara, firstSeg, 5, 1)).toBe(5);
  });
  it('back returns to the paragraph start, then to the one before', () => {
    expect(paragraphStep(segPara, firstSeg, 4, -1)).toBe(3);
    expect(paragraphStep(segPara, firstSeg, 3, -1)).toBe(0);
    expect(paragraphStep(segPara, firstSeg, 0, -1)).toBe(0);
  });
});

describe('the lesson player owns the lock screen while it reads', () => {
  let container, root, made, handlers, ms;
  const createNarrator = (opts) => {
    const e = {
      rate: 1,
      loaded: [],
      onBoundary() {},
      load(t) {
        this.loaded.push(t);
      },
      play: vi.fn(() => opts.onState({ status: 'playing', segmentIndex: 0 })),
      pause: vi.fn(() => opts.onState({ status: 'paused', segmentIndex: 0 })),
      resume: vi.fn(() => opts.onState({ status: 'playing', segmentIndex: 0 })),
      stop: vi.fn(() => opts.onState({ status: 'idle', segmentIndex: 0 })),
      setRate(r) {
        this.rate = r;
      },
      idle: () => opts.onState({ status: 'idle', segmentIndex: 0 }),
    };
    made.push(e);
    return e;
  };
  beforeEach(() => {
    made = [];
    handlers = {};
    ms = {
      metadata: null,
      playbackState: 'none',
      setActionHandler: (a, fn) => {
        handlers[a] = fn;
      },
      setPositionState: vi.fn(),
    };
    Object.defineProperty(window.navigator, 'mediaSession', { configurable: true, value: ms });
    window.MediaMetadata = class {
      constructor(m) {
        Object.assign(this, m);
      }
    };
    window.Audio = FakeAudio;
    FakeAudio.made = [];
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<LessonExperience lesson={LESSON_A} record={null} onExit={vi.fn()} initialMode="watch" createNarrator={createNarrator} />));
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete window.navigator.mediaSession;
    vi.useRealTimers();
  });
  const click = (node) => act(() => node.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  const pressPlay = () => click(container.querySelector('.le-playerbar button[aria-label="Play"]'));
  const n = () => made[made.length - 1];

  it('Play claims the card, the keep-alive and the buttons, inside the tap', () => {
    pressPlay();
    expect(ms.metadata && ms.metadata.title).toBeTruthy();
    expect(ms.playbackState).toBe('playing');
    expect(typeof handlers.play).toBe('function');
    expect(typeof handlers.nexttrack).toBe('function');
    expect(FakeAudio.made.some((a) => a.loop && !a.paused)).toBe(true);
    expect(ms.setPositionState).toHaveBeenCalled();
  });

  it('the lock screen pause and play drive the lesson player', () => {
    pressPlay();
    act(() => handlers.pause());
    expect(n().pause).toHaveBeenCalled();
    expect(ms.playbackState).toBe('paused');
    act(() => handlers.play());
    expect(n().resume).toHaveBeenCalled();
    expect(ms.playbackState).toBe('playing');
  });

  it('the car’s next button starts the next paragraph', () => {
    pressPlay();
    const before = n().loaded.length;
    act(() => handlers.nexttrack());
    expect(n().loaded.length).toBe(before + 1);
    const heard = n().loaded[n().loaded.length - 1];
    const whole = n().loaded[0];
    expect(heard.length).toBeLessThan(whole.length);
  });

  it('a lasting stop hands every button back to the phone', () => {
    vi.useFakeTimers();
    pressPlay();
    act(() => n().idle());
    act(() => vi.advanceTimersByTime(RELEASE_MS + 10));
    expect(handlers.play).toBeNull();
    expect(handlers.nexttrack).toBeNull();
    expect(ms.metadata).toBeNull();
  });
});
