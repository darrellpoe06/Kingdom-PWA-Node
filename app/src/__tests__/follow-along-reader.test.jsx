// @vitest-environment jsdom
// =============================================================================
// FollowAlong — the congregant's device READS THE SLIDE ALOUD and follows it
// =============================================================================
// Darrell 2026-09-06: "the scroll and word highlighted as the TTS reads is not
// working on the presentations or congregation slides". On the congregation
// view it could not work: the standalone ?follow=CODE boot (main.jsx) mounted
// no reader and registered no reading. This pins the fix on the real component:
//   1. the live slide registers a read target — the SAME contract Presenter
//      uses (read-target.js: elementId + text) — pointing at an element that
//      is actually in the DOM and contains the slide's words, so the follow
//      map (sentence + word highlights) is built from what the person sees;
//   2. the reader itself is mounted, so there is a play button to press;
//   3. the hold states register nothing (nothing to read), and a new slide
//      from the presenter replaces the previous target.
// Proven-to-catch: against the pre-fix FollowAlong, getReadTarget() is null
// after a slide arrives and no .tts-controls exists.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

// jsdom has no speechSynthesis; the reader renders only when supported.
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: () => {}, pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {}, setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));

// No network: capture the channel handlers so the test can deliver a slide the
// way the presenter's broadcast would.
const handlers = {};
vi.mock('../lib/follow-along-sync.js', async () => {
  const real = await vi.importActual('../lib/follow-along-sync.js');
  return {
    ...real,
    FOLLOW_ALONG_ENABLED: true,
    subscribeFollow: (code, h) => { Object.assign(handlers, h); return () => {}; },
  };
});

import FollowAlong from '../components/FollowAlong.jsx';
import { getReadTarget } from '../lib/read-target.js';
import { slideReadingText } from '../lib/presentable.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const SLIDE = {
  type: 'slide', index: 3, total: 9, indexLabel: '3 of 9',
  title: 'The Prudent Man Studies',
  lead: 'A prudent man studies and does not get into trouble.',
  bigIdea: 'A prudent man studies and does not get into trouble.',
  points: ['Study to shew thyself approved.', 'The ways of the LORD are right.', 'Hidden until it is not.'],
  revealCount: 2,
  ordered: false,
};

let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  for (const k of Object.keys(handlers)) delete handlers[k];
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('slideReadingText — what a built slide says, in reading order', () => {
  it('title, lead, then only the REVEALED points', () => {
    expect(slideReadingText(SLIDE)).toBe(
      'The Prudent Man Studies. A prudent man studies and does not get into trouble. Study to shew thyself approved. The ways of the LORD are right.',
    );
  });
  it('undefined revealCount speaks every point; a hold or nothing speaks nothing', () => {
    expect(slideReadingText({ ...SLIDE, revealCount: undefined })).toContain('Hidden until it is not.');
    expect(slideReadingText(null)).toBe('');
    expect(slideReadingText({ title: '' })).toBe('');
  });
});

describe('FollowAlong registers the live slide as a reading, and mounts the reader', () => {
  it('the hold state registers NO reading (there is nothing to read yet)', () => {
    act(() => root.render(createElement(FollowAlong, { code: 'love7' })));
    expect(container.textContent).toMatch(/Waiting for the presenter/i);
    expect(getReadTarget()).toBeNull();
  });

  it('a slide from the presenter becomes a read target whose element is on screen and carries the words', () => {
    act(() => root.render(createElement(FollowAlong, { code: 'love7' })));
    expect(typeof handlers.onSlide).toBe('function');
    act(() => handlers.onSlide(SLIDE));

    const t = getReadTarget();
    expect(t, 'the congregant must have a reading to press play on').toBeTruthy();
    expect(t.elementId).toBe('follow-along-slide');
    const el = document.getElementById(t.elementId);
    expect(el, 'the registered element must exist in the DOM — the follow map is built from it').toBeTruthy();
    expect(el.textContent).toContain('The Prudent Man Studies');
    expect(el.textContent).toContain('Study to shew thyself approved.');
    expect(t.text).toBe(slideReadingText(SLIDE));
    // the fixed "Following · CODE" label is OUTSIDE the reading element
    expect(el.textContent).not.toMatch(/Following · LOVE7/);
  });

  it('the reader is mounted on the congregant view (the play button exists)', () => {
    act(() => root.render(createElement(FollowAlong, { code: 'love7' })));
    act(() => handlers.onSlide(SLIDE));
    expect(container.querySelector('.tts-controls'), 'no reader, no play — the pre-fix state').toBeTruthy();
    expect(container.querySelector('button[aria-label="Open read-aloud controls"]')).toBeTruthy();
  });

  it('the next slide REPLACES the reading; a hold clears it', () => {
    act(() => root.render(createElement(FollowAlong, { code: 'love7' })));
    act(() => handlers.onSlide(SLIDE));
    act(() => handlers.onSlide({ ...SLIDE, index: 4, title: 'Seeing Him While Blind', lead: 'He leads while I cannot see.' }));
    expect(getReadTarget().text).toMatch(/^Seeing Him While Blind\. He leads while I cannot see\./);
    act(() => handlers.onHold());
    expect(getReadTarget()).toBeNull();
  });
});
