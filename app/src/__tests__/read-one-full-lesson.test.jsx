// @vitest-environment jsdom
// =============================================================================
// Read ONE full lesson — not the page's mixed lesson cards (DR-0076).
// Darrell 2026-07-30, with Read Aloud open mid-lesson: "The reader reads
// different lessons not one full one... Just the pages showing on the full
// list view.... not good." The reader took <main>.innerText — fragments of
// every lesson card in DOM order, and only the VISIBLE paced step of the open
// one. These pin the fix end-to-end:
//   • read-target registry semantics (owner-keyed set/clear/subscribe);
//   • readAloudTextFromArc builds the WHOLE lesson (every teach segment, not
//     one step) and can never leak facilitator notes;
//   • opening a Learn lesson guide registers exactly that one lesson —
//     closing it clears the registration;
//   • the Read Aloud panel offers "Read this <unit> — start to finish" as the
//     primary action and hands the reader the registered full text.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setReadTarget, clearReadTarget, getReadTarget, subscribeReadTarget } from '../lib/read-target.js';
import { buildLessonArc, readAloudTextFromArc } from '../lib/lesson-flow.js';
import ChurchLearn from '../components/ChurchLearn.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The reader hook is mocked (jsdom has no speechSynthesis); `read` is a spy so
// the panel's hand-off of the FULL text is observable.
const readSpy = vi.fn();
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: (...a) => readSpy(...a), pause: () => {}, resume: () => {}, stop: () => {}, setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');

let container, root;
beforeEach(() => {
  window.localStorage.clear();
  readSpy.mockClear();
  clearReadTarget((getReadTarget() || {}).owner);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

// A module with every audience field AND facilitator-only notes, chunked into
// MANY paced steps (teen band) so "full lesson vs visible step" is testable.
const MODULE = {
  id: 'test-full-read',
  week: 1,
  title: 'The Whole Lesson Title',
  bigIdea: 'The one big idea of this lesson.',
  anchor: { ref: 'Psalm 1:2', theme: 'meditation day and night' },
  lesson: Array.from({ length: 12 }, (_, i) => `Teaching sentence number ${i + 1} of the authored lesson body carrying real content forward.`).join(' '),
  inApp: 'Open the study space and walk one real example.',
  benefits: ['Freedom benefit one.', 'Freedom benefit two.'],
  stories: [{ kind: 'parable', title: 'The Widened Riverbed', body: 'A town sat by a thin creek that never gave enough water.', verse: 'Luke 6:38' }],
  facilitator: {
    talkingPoints: ['SECRET-TALKING-POINT never spoken to a learner'],
    howToRun: 'Prayer + the anchor (5): SECRET-RUN-NOTE open in prayer | Teach (15): SECRET-TEACH-NOTE',
    discussionPrompts: ['What did the creek teach you?'],
  },
};

describe('read-target registry', () => {
  it('set/get/clear round-trip, owner-keyed: a stale owner cannot clear the new target', () => {
    setReadTarget('a', { label: 'this lesson', text: 'text A' });
    expect(getReadTarget()).toMatchObject({ owner: 'a', text: 'text A' });
    setReadTarget('b', { label: 'this lesson', text: 'text B' });
    clearReadTarget('a'); // the OLD owner unmounting must not wipe b's target
    expect(getReadTarget()).toMatchObject({ owner: 'b', text: 'text B' });
    clearReadTarget('b');
    expect(getReadTarget()).toBeNull();
  });

  it('subscribers hear changes; empty text never registers', () => {
    const seen = [];
    const unsub = subscribeReadTarget((t) => seen.push(t));
    setReadTarget('x', { text: '   ' }); // no-op
    expect(getReadTarget()).toBeNull();
    setReadTarget('x', { label: 'this week', text: 'hello' });
    clearReadTarget('x');
    unsub();
    expect(seen.length).toBe(2);
    expect(seen[0]).toMatchObject({ owner: 'x' });
    expect(seen[1]).toBeNull();
  });
});

describe('readAloudTextFromArc — the WHOLE lesson, audience-only', () => {
  it('carries title, big idea, anchor, EVERY teach segment, stories, prompts, hands-on, and benefits', () => {
    const arc = buildLessonArc(MODULE, { ageBand: 'teen' });
    // Teen pacing chunks the lesson into multiple steps — the full read must span them all.
    expect(arc.audienceSegments.find((s) => s.kind === 'teach').audience.lessonPlan.segments.length).toBeGreaterThan(1);
    const text = readAloudTextFromArc(arc);
    expect(text).toContain('The Whole Lesson Title');
    expect(text).toContain('The one big idea');
    expect(text).toContain('Psalm 1:2');
    expect(text).toContain('Teaching sentence number 1');
    expect(text).toContain('Teaching sentence number 12'); // the LAST chunk — not just the visible step
    expect(text).toContain('Picture this — The Widened Riverbed');
    expect(text).toContain('What did the creek teach you?');
    expect(text).toContain('Open the study space');
    expect(text).toContain('Freedom benefit two.');
  });

  it('NO-LEAK: facilitator talking points and run-of-show notes are never in the spoken text', () => {
    const text = readAloudTextFromArc(buildLessonArc(MODULE, { ageBand: 'adult' }));
    expect(text).not.toContain('SECRET-TALKING-POINT');
    expect(text).not.toContain('SECRET-RUN-NOTE');
    expect(text).not.toContain('SECRET-TEACH-NOTE');
  });

  it('fail-soft: no arc → empty string', () => {
    expect(readAloudTextFromArc(null)).toBe('');
  });
});

describe('Learn — the open lesson registers itself as the one full reading', () => {
  const mountLearn = () =>
    act(() => root.render(createElement(ChurchLearn, {
      progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
      learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
    })));
  const button = (text) => [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes(text));

  it('opening a lesson guide registers THAT one lesson, full text; closing clears it', () => {
    mountLearn();
    expect(getReadTarget()).toBeNull();
    act(() => { button('Start this week →').click(); });
    const t = getReadTarget();
    expect(t).toBeTruthy();
    expect(t.owner).toBe('wk1-what-is-ai');
    expect(t.label).toBe('this week');
    // The FULL week-1 lesson — and no other week's title mixed in.
    expect(t.text).toContain('What is A.I., really?');
    expect(t.text.length).toBeGreaterThan(400);
    act(() => { button('Close the guide').click(); });
    expect(getReadTarget()).toBeNull();
  });
});

describe('Read Aloud panel — one-tap full-piece reading', () => {
  const openPanel = () => {
    act(() => root.render(createElement(TTSControl, { view: 'church' })));
    const fab = container.querySelector('button[aria-label="Open read-aloud controls"]');
    act(() => fab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    return container.querySelector('.tts-controls > div');
  };
  const buttons = (panel) => [...panel.querySelectorAll('button')];

  it('with a registered target: "Read this lesson — start to finish" is offered and hands the reader the FULL text', () => {
    setReadTarget('m1', { label: 'this lesson', text: 'The entire lesson text start to finish.' });
    const panel = openPanel();
    const btn = buttons(panel).find((b) => /Read this lesson — start to finish/.test(b.textContent));
    expect(btn).toBeTruthy();
    act(() => { btn.click(); });
    expect(readSpy).toHaveBeenCalledWith('The entire lesson text start to finish.');
    clearReadTarget('m1');
  });

  it('without a target the panel is unchanged: page reading is the primary action, no full-piece button', () => {
    const panel = openPanel();
    expect(buttons(panel).some((b) => /start to finish/.test(b.textContent))).toBe(false);
    expect(buttons(panel).some((b) => /Read this page/.test(b.textContent))).toBe(true);
  });
});
