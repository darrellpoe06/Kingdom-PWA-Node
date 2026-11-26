// =============================================================================
// THE LESSON PLAYER KEEPS THE CHOSEN SPEED (DR-1688)
// =============================================================================
// Darrell 2026-11-26, from the lessons: "When I push it to push play, it will
// not keep the 1.5 reading level I like. Others may like 2, others may like 1,
// but it doesn't keep it." Traced: the new-look lesson player
// (learn-studio/LessonExperience.jsx) held its speed in its own useState(1).
// It never read the device's saved speed (lib/tts.js 'poe-tts-prefs'), never
// saved a pick, and built every lesson's narrator at 1x. So 1.5 lasted only
// until the next lesson, a reload, or the next time the player opened, while
// the READ button and the Personalize sheet remembered it correctly.
//
// These pin what the listener hears: the speed the narrator is given when
// play starts, on a fresh mount, after a reload and on the next lesson.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LessonExperience from '../components/learn-studio/LessonExperience.jsx';
import { loadTTSPrefs, saveTTSRate, RATE_STEPS, useTextToSpeech } from '../lib/tts.js';
import LESSON_A from '../lib/living-lessons/ll338-not-with-eyeservice.js';
import LESSON_B from '../lib/living-lessons/ll339-the-profit-of-the-earth-is-for-all.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root, made;

// A narrator on the component's own seam: it records the speed it holds at the
// moment play starts, which is the speed the listener hears.
const createNarrator = (opts) => {
  const e = {
    rate: 1,
    heardAt: [],
    onBoundary() {},
    load() {},
    play() {
      this.heardAt.push(this.rate);
      opts.onState({ status: 'playing', segmentIndex: 0 });
    },
    pause() {},
    resume() {
      this.heardAt.push(this.rate);
    },
    stop() {},
    setRate(r) {
      this.rate = r;
    },
  };
  made.push(e);
  return e;
};
const narrator = () => made[made.length - 1];
const render = (lesson) =>
  act(() => root.render(<LessonExperience lesson={lesson} record={null} onExit={vi.fn()} initialMode="watch" createNarrator={createNarrator} />));
const click = (node) => act(() => node.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const speedChip = () => container.querySelector('button[aria-label^="Speed "]');
const pressPlay = () => click(container.querySelector('.le-playerbar button[aria-label="Play"]'));
const reload = () => {
  act(() => root.unmount());
  root = createRoot(container);
};

beforeEach(() => {
  localStorage.clear();
  made = [];
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  localStorage.clear();
});

describe('the lesson player keeps the listener’s speed', () => {
  it('a speed already chosen on this device is the speed play starts at, on a fresh mount', () => {
    saveTTSRate(1.5);
    render(LESSON_A);
    expect(speedChip().getAttribute('aria-label')).toBe('Speed 1.5×');
    pressPlay();
    expect(narrator().heardAt).toEqual([1.5]);
  });

  it('a speed picked in the player is saved for the device, and survives a reload', () => {
    render(LESSON_A);
    click(speedChip()); // 1x -> 1.5x
    expect(loadTTSPrefs().rate).toBe(1.5);
    reload();
    render(LESSON_A);
    expect(speedChip().getAttribute('aria-label')).toBe('Speed 1.5×');
    pressPlay();
    expect(narrator().heardAt).toEqual([1.5]);
  });

  it('the next lesson plays at the same speed (a new narrator never starts at 1x)', () => {
    render(LESSON_A);
    click(speedChip()); // 1.5x
    render(LESSON_B); // same player, next lesson: a new narrator is built
    expect(made.length).toBeGreaterThan(1);
    pressPlay();
    expect(narrator().heardAt).toEqual([1.5]);
  });

  it('every speed the house offers round-trips, including ones the chip does not cycle to', () => {
    for (const { value, label } of RATE_STEPS) {
      saveTTSRate(value);
      reload();
      made = [];
      render(LESSON_A);
      expect(speedChip().getAttribute('aria-label')).toBe(`Speed ${label}`);
      pressPlay();
      expect(narrator().heardAt).toEqual([value]);
    }
  });

  it('a speed picked elsewhere on the page (the Personalize sheet) reaches an open player', async () => {
    render(LESSON_A);
    await act(async () => {
      saveTTSRate(2);
      await Promise.resolve();
    });
    expect(speedChip().getAttribute('aria-label')).toBe('Speed 2×');
    pressPlay();
    expect(narrator().heardAt).toEqual([2]);
  });

  it('the chip from a speed above its four steps goes on to the next step, not back to Slower', () => {
    saveTTSRate(2.5);
    render(LESSON_A);
    click(speedChip());
    expect(loadTTSPrefs().rate).toBe(0.7);
    saveTTSRate(1.25);
    reload();
    render(LESSON_A);
    click(speedChip());
    expect(loadTTSPrefs().rate).toBe(1.5);
  });
});

// The READ button's engine (lib/tts.js useTextToSpeech) on a device with no
// built-in speech voice (a television's web view, a locked-down browser): the
// recorded voice still reads there, but setRate returned before saving, so the
// pick was never kept and the next render put the old speed back.
describe('the READ button keeps the speed on a device with no built-in voice', () => {
  it('a pick is saved and held even when the device cannot speak itself', () => {
    const had = 'speechSynthesis' in window;
    const keep = window.speechSynthesis;
    delete window.speechSynthesis;
    let api;
    const Probe = () => {
      api = useTextToSpeech();
      return null;
    };
    try {
      act(() => root.render(<Probe />));
      expect(api.supported).toBe(false);
      act(() => api.setRate(1.5));
      expect(api.rate).toBe(1.5);
      expect(loadTTSPrefs().rate).toBe(1.5);
    } finally {
      if (had) window.speechSynthesis = keep;
    }
  });
});
