// @vitest-environment jsdom
// =============================================================================
// Where the words land, and the door back to the projector (DR-1690).
//
// Darrell, 2026-11-26, from the full-screen Watch view: "We need the words to
// be at the top of the screen... not the bottom unless we say so... give the
// options to users... I want to be able to use this on the led wall behind the
// speakers podium at church." And: "What happened to our projector of our
// words... workflows?"
//   1. the words sit at the top by default;
//   2. one chip moves them Top -> Middle -> Bottom, kept on this device;
//   3. a link (?captions=bottom) fixes the place for one screen and wins;
//   4. the new look carries Present, the door into the presenter + projector
//      screen that lived only on the classic list; the course wires it.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import LessonExperience from '../components/learn-studio/LessonExperience.jsx';
import { captionPlaceFrom, nextCaptionPlace, CAPTION_PLACE_KEY } from '../components/learn-studio/lesson-reading.js';
import REAL_LESSON from '../lib/living-lessons/ll338-not-with-eyeservice.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('the place is decided plainly', () => {
  it('top by default; a remembered choice; the link wins', () => {
    expect(captionPlaceFrom('', '')).toBe('top');
    expect(captionPlaceFrom('', 'bottom')).toBe('bottom');
    expect(captionPlaceFrom('?captions=middle', 'bottom')).toBe('middle');
    expect(captionPlaceFrom('?captions=sideways', 'junk')).toBe('top');
    expect(['top', 'middle', 'bottom'].map(nextCaptionPlace)).toEqual(['middle', 'bottom', 'top']);
  });
});

describe('the Watch stage', () => {
  let container, root;
  beforeEach(() => {
    window.localStorage.clear();
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
  const open = async (props = {}) => {
    await act(async () => {
      root.render(<LessonExperience lesson={REAL_LESSON} record={null} onExit={() => {}} {...props} />);
    });
  };
  const stage = () => container.querySelector('.le-stage');

  it('opens with the words at the top', async () => {
    await open();
    expect(stage().getAttribute('data-caption-place')).toBe('top');
    expect(stage().className).toMatch(/le-cap-top/);
  });

  it('the chip moves the words and the device keeps the choice', async () => {
    await open();
    const chip = container.querySelector('[data-testid="le-caption-place"]');
    expect(chip.textContent).toBe('Words: Top');
    await act(async () => chip.click());
    expect(stage().getAttribute('data-caption-place')).toBe('middle');
    await act(async () => chip.click());
    expect(stage().getAttribute('data-caption-place')).toBe('bottom');
    expect(window.localStorage.getItem(CAPTION_PLACE_KEY)).toBe('bottom');
  });

  it('Present opens the projector workflow when the course offers it, and is absent otherwise', async () => {
    let asked = 0;
    await open({ onPresent: () => (asked += 1) });
    const btn = container.querySelector('[data-testid="le-present"]');
    expect(btn).toBeTruthy();
    await act(async () => btn.click());
    expect(asked).toBe(1);
    act(() => root.unmount());
    root = createRoot(container);
    await open();
    expect(container.querySelector('[data-testid="le-present"]')).toBeNull();
  });
});

describe('the course wires Present to the deck', () => {
  it('ChurchLearn hands the new look a Present that opens this lesson in the Presenter', () => {
    const src = readFileSync(resolve(__dirname, '../components/ChurchLearn.jsx'), 'utf8');
    expect(src).toMatch(/<LessonExperienceDoor[^\n]*onPresent=\{\(\) => \{[^}]*setPresentLesson\(focusModule\)/);
    const door = readFileSync(resolve(__dirname, '../components/learn-studio/LessonExperienceDoor.jsx'), 'utf8');
    expect(door).toMatch(/onPresent=\{onPresent\}/);
  });
});
