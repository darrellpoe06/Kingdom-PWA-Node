// @vitest-environment jsdom
// =============================================================================
// The new lesson look reads in the voice you chose (DR-1685).
//
// Darrell, 2026-11-26: "I want the reader to read in my voice!!!!! Haven't had
// that happen yet!!!!!" Measured: LessonExperience drove only createBrowserTTS
// (the phone's own voice); it never read the reading-voice pick, never loaded
// the recording, never asked /voice/speak. These cases pin the new road:
//   1. a person voice picked -> each sentence is asked of the clone, in order,
//      the next one fetched while one plays, and the clips play;
//   2. the clone cannot make a piece -> the device voice reads FROM THAT
//      SENTENCE (never from the top, never twice) and one line says why;
//   3. no recording on this device -> said, with the Voice tab named;
//   4. no person voice picked -> the device voice, exactly as before;
//   5. the screen shows the one line (le-voice-note) when Read Aloud is tapped;
//   6. the door passes the chosen-voice narrator to the new look.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createCloneNarrator, chosenVoiceNarrator, clonePace } from '../lib/chosen-voice-narrator.js';
import { segmentText } from '../lib/tts.js';
import LessonExperience from '../components/learn-studio/LessonExperience.jsx';
import REAL_LESSON from '../lib/living-lessons/ll338-not-with-eyeservice.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const flush = async (n = 8) => {
  for (let i = 0; i < n; i += 1) await Promise.resolve();
};

// An <audio> that "plays" each clip to its end on the next tick.
const played = [];
class FakeAudio {
  constructor() {
    this.src = '';
  }
  play() {
    const src = this.src;
    if (src && !src.startsWith('data:')) {
      played.push(src);
      setTimeout(() => this.onended && this.onended(), 0);
    }
    return Promise.resolve();
  }
  pause() {}
}

// A device narrator that records what it was handed.
function fakeDevice() {
  const made = [];
  const factory = (opts) => {
    const n = { opts, loaded: '', played: 0, rate: 1, onBoundary: null };
    n.load = (t) => {
      n.loaded = t;
    };
    n.play = () => {
      n.played += 1;
      opts.onState && opts.onState({ status: 'playing', segmentIndex: 0 });
    };
    n.pause = () => {};
    n.resume = () => {};
    n.stop = () => {};
    n.setRate = (r) => {
      n.rate = r;
    };
    made.push(n);
    return n;
  };
  return { factory, made };
}

const TEXT = 'In the beginning was the Word. And the Word was with God. And the Word was God.';

beforeEach(() => {
  played.length = 0;
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('the clone narrator', () => {
  it('asks the clone for every sentence in order and plays each clip', async () => {
    const asked = [];
    const states = [];
    const notes = [];
    const n = createCloneNarrator({
      fetchClip: (t, i, pace) => {
        asked.push([t, i, pace]);
        return Promise.resolve({ url: `blob:clip-${i}` });
      },
      onState: (s) => states.push(s),
      onNote: (l) => notes.push(l),
      readyNote: () => 'My voice is reading.',
      AudioCtor: FakeAudio,
      fallback: () => {
        throw new Error('the device voice must not read');
      },
    });
    const segs = segmentText(TEXT);
    n.load(TEXT);
    n.play();
    for (let k = 0; k < 10; k += 1) {
      await flush();
      await vi.advanceTimersByTimeAsync(1);
    }
    expect(asked.map((a) => a[0])).toEqual(segs);
    expect(played).toEqual(segs.map((_, i) => `blob:clip-${i}`));
    expect(states.filter((s) => s.status === 'playing').map((s) => s.segmentIndex)).toEqual(expect.arrayContaining([0, 1, 2]));
    expect(states[states.length - 1].status).toBe('idle');
    expect(notes).toContain('My voice is reading.');
  });

  it('hands the rest to the device voice from the sentence that failed, and says why', async () => {
    const dev = fakeDevice();
    const notes = [];
    const states = [];
    const n = createCloneNarrator({
      fetchClip: (t, i) => Promise.resolve(i === 0 ? { url: 'blob:first' } : { error: 'voice-service-404' }),
      fallback: dev.factory,
      onState: (s) => states.push(s),
      onNote: (l) => notes.push(l),
      noteFor: (e) => `why: ${e}`,
      AudioCtor: FakeAudio,
    });
    const segs = segmentText(TEXT);
    n.load(TEXT);
    n.play();
    for (let k = 0; k < 10; k += 1) {
      await flush();
      await vi.advanceTimersByTimeAsync(1);
    }
    expect(played).toEqual(['blob:first']);
    expect(dev.made).toHaveLength(1);
    // From sentence 2 on: the first sentence is never read twice.
    expect(dev.made[0].loaded).toBe(segs.slice(1).join(' '));
    expect(dev.made[0].played).toBe(1);
    expect(notes).toContain('why: voice-service-404');
    // The page's highlight index stays on the real sentence.
    expect(states[states.length - 1]).toEqual({ status: 'playing', segmentIndex: 1 });
  });

  it('a stop makes a late clip stale: nothing plays after stop', async () => {
    let release;
    const n = createCloneNarrator({
      fetchClip: () =>
        new Promise((r) => {
          release = r;
        }),
      AudioCtor: FakeAudio,
      fallback: () => {
        throw new Error('no hand-over after a stop');
      },
    });
    n.load(TEXT);
    n.play();
    await flush();
    n.stop();
    release({ url: 'blob:late' });
    await flush();
    await vi.advanceTimersByTimeAsync(5);
    expect(played).toEqual([]);
  });

  it('the clone is asked at the player pace, bounded', () => {
    expect(clonePace(1)).toBe(1);
    expect(clonePace(1.5)).toBe(1.5);
    expect(clonePace(4)).toBe(2);
    expect(clonePace(0)).toBe(1);
  });
});

describe('chosenVoiceNarrator', () => {
  it('a person voice picked: My voice (Darrell), asked of the clone', async () => {
    const notes = [];
    const clipFor = vi.fn(() => () => Promise.resolve({ url: 'blob:x' }));
    const base = vi.fn();
    const make = chosenVoiceNarrator({ readVoiceId: () => 'person:darrell', clipFor, base, engineName: () => 'nas-clone' });
    make({ onNote: (l) => notes.push(l), onState: () => {} });
    expect(clipFor).toHaveBeenCalledWith('darrell');
    expect(base).not.toHaveBeenCalled();
    expect(notes[0]).toMatch(/My voice \(Darrell\)/);
  });

  it('no recording on this device: said, with the Voice tab', async () => {
    const dev = fakeDevice();
    const notes = [];
    const make = chosenVoiceNarrator({
      readVoiceId: () => 'person:darrell',
      clipFor: () => () => Promise.resolve({ error: 'no-voice-sample' }),
      base: dev.factory,
      AudioCtor: FakeAudio,
    });
    const n = make({ onNote: (l) => notes.push(l), onState: () => {} });
    n.load(TEXT);
    n.play();
    await flush(12);
    const last = notes[notes.length - 1];
    expect(last).toMatch(/your recording is not on this device/);
    expect(last).toMatch(/Voice tab/);
    expect(last).toMatch(/phone’s own voice reads from here/);
    expect(dev.made[0].loaded).toBe(TEXT);
  });

  it('no person voice picked and no key on this device: the device voice reads (DR-1705 adds the audio road when a key is here)', () => {
    const base = vi.fn(() => ({ marker: true }));
    const clipFor = vi.fn();
    const opts = { onState: () => {}, onNote: () => {} };
    const n = chosenVoiceNarrator({ readVoiceId: () => 'system', clipFor, base })(opts);
    expect(n).toEqual({ marker: true });
    expect(base).toHaveBeenCalledWith(opts);
    expect(clipFor).not.toHaveBeenCalled();
  });
});

describe('the new look shows whose voice reads', () => {
  let container, root;
  beforeEach(() => {
    vi.useRealTimers();
    window.speechSynthesis = {
      speaking: false,
      pending: false,
      paused: false,
      speak() {},
      cancel() {},
      pause() {},
      resume() {},
      getVoices: () => [],
      addEventListener() {},
      removeEventListener() {},
    };
    window.SpeechSynthesisUtterance = class {
      constructor(t) {
        this.text = t;
      }
    };
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('Read Aloud with My voice picked: the clone is asked for the first sentence and the line is on screen', async () => {
    const asked = [];
    const createNarrator = chosenVoiceNarrator({
      readVoiceId: () => 'person:darrell',
      clipFor: () => (t) => {
        asked.push(t);
        return new Promise(() => {}); // the engine is still making it
      },
      engineName: () => 'nas-clone',
      AudioCtor: FakeAudio,
    });
    await act(async () => {
      root.render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={() => {}} initialMode="read" createNarrator={createNarrator} />);
    });
    const note = container.querySelector('[data-testid="le-voice-note"]');
    expect(note && note.textContent).toMatch(/My voice \(Darrell\)/);
    const btn = [...container.querySelectorAll('button')].find((b) => /Read Aloud/.test(b.textContent));
    await act(async () => {
      btn.click();
      await flush(12);
    });
    expect(asked.length).toBe(1);
    expect(asked[0].length).toBeGreaterThan(0);
  });
});

describe('the door wires it', () => {
  it('LessonExperienceDoor hands the chosen-voice narrator to the new look', () => {
    const src = readFileSync(resolve(__dirname, '../components/learn-studio/LessonExperienceDoor.jsx'), 'utf8');
    expect(src).toMatch(/chosenVoiceNarrator\(\)/);
    expect(src).toMatch(/createNarrator=\{narrator\}/);
  });
});
