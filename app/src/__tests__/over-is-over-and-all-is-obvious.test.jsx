// @vitest-environment jsdom
// =============================================================================
// IF IT IS OVER, IT IS OVER — and the way back to ALL is not a little bitty
// button. Two defects Darrell reported from his phone on 2026-09-16, standing
// at part 7/7 of a lesson with the Read Aloud panel open.
//
// (1) "can't re-listen to the lesson after the lesson is over because it's
//     allowing the lesson to keep starting at the end because it thinks it's
//     finished because it's starting where it left off at. But if it's over,
//     it's over. So it needs to be able to recognize that the lesson was over
//     and you want to re-listen to the same freaking lesson, obviously."
//
//     The place record stored where the reader last was and nothing else, so a
//     lesson heard to its final sentence saved that final sentence. The next
//     press of "Read this lesson — start to finish" resolved the saved
//     sentence, spoke it, and stopped. A lesson that would not play.
//
// (2) "There's a little bitty button to get back to all. So if you're on a
//     phone, you can't really find the all button to get back to any of the
//     other lessons. Make it obvious. Stop making it difficult to get to
//     places in the app. All should just pop up with all every time you get
//     done, anytime you want."
//
//     The only way out of a lesson was a 10px label in a 1px outline, 36px
//     tall, in a sticky bar above the fold — and at the end of the lesson the
//     footer offered "Previous part", the words "End of this lesson", and a
//     DISABLED "Done ✓": three controls, none of which went anywhere.
//
// PROVEN TO CATCH (each measured against the old behaviour before shipping):
//   • the same saved sentence with `done` false slices the tail and with
//     `done` true reads the whole lesson — one field, opposite outcomes;
//   • the finished flag clears itself the moment a reading moves again, so an
//     interrupted re-listen still resumes;
//   • the bar's way-out is the filled, 44px, "All lessons" control;
//   • the end of a lesson carries two full-width doors, and Start over both
//     returns to part one and clears the place.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setReadTarget, clearReadTarget, getReadTarget } from '../lib/read-target.js';
import { recordPlace, getPlace, finishPlace, placeIsFinished } from '../lib/learn-resume.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const readSpy = vi.fn();
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: (...a) => readSpy(...a), pause: () => {}, resume: () => {}, stop: () => {},
    claimAudio: () => {}, setRate: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');

const src = (file) => readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', file), 'utf8');

let container, root, reading;
beforeEach(() => {
  window.localStorage.clear();
  readSpy.mockClear();
  clearReadTarget((getReadTarget() || {}).owner);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  if (reading) { reading.remove(); reading = null; }
  window.localStorage.clear();
});

// -----------------------------------------------------------------------------
// The record itself — the one field that knows a lesson is over
// -----------------------------------------------------------------------------
describe('the place record knows when a lesson is OVER', () => {
  const mem = () => {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  };

  it('a place written before this shipped is not finished — an old record resumes exactly as it did', () => {
    const storage = mem();
    storage.setItem('poe-learn-place', JSON.stringify({ courseKey: 'living-lessons', lessonId: 'll3', stage: 6, step: 0, sentence: 41, sentenceKey: 'abc', at: 1 }));
    const p = getPlace({ storage });
    expect(p.done).toBe(false);
    expect(placeIsFinished(p)).toBe(false);
    expect(p.sentence).toBe(41); // everything else is untouched
  });

  it('finishing marks it, and keeps every other part of the place', () => {
    const storage = mem();
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll3', stage: 6, sentence: 41, sentenceKey: 'abc' }, { storage, now: 1 });
    finishPlace({}, { storage, now: 2 });
    const p = getPlace({ storage });
    expect(placeIsFinished(p)).toBe(true);
    expect(p).toMatchObject({ lessonId: 'll3', stage: 6, sentence: 41, sentenceKey: 'abc' });
  });

  it('OVER clears itself the moment a reading moves again — so an interrupted re-listen still resumes', () => {
    const storage = mem();
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll3', sentence: 41, sentenceKey: 'abc' }, { storage, now: 1 });
    finishPlace({}, { storage, now: 2 });
    expect(placeIsFinished(getPlace({ storage }))).toBe(true);
    // The re-listen starts at the top and stores its first sentence:
    recordPlace({ sentence: 0, sentenceKey: 'zzz' }, { storage, now: 3 });
    expect(placeIsFinished(getPlace({ storage }))).toBe(false);
    expect(getPlace({ storage }).sentence).toBe(0);
  });

  it('a stage or step move also clears it — paging back into a finished lesson is reading it again', () => {
    const storage = mem();
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll3', stage: 6 }, { storage, now: 1 });
    finishPlace({}, { storage, now: 2 });
    recordPlace({ stage: 2 }, { storage, now: 3 });
    expect(placeIsFinished(getPlace({ storage }))).toBe(false);
  });

  it('re-OPENING the same lesson keeps it finished — that is what makes it reopen at part one', () => {
    const storage = mem();
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll3', stage: 6 }, { storage, now: 1 });
    finishPlace({}, { storage, now: 2 });
    recordPlace({ lessonId: 'll3' }, { storage, now: 3 }); // exactly what opening a lesson writes
    expect(placeIsFinished(getPlace({ storage }))).toBe(true);
  });

  it('OVER never leaks onto a different lesson', () => {
    const storage = mem();
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll3', stage: 6 }, { storage, now: 1 });
    finishPlace({}, { storage, now: 2 });
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll7' }, { storage, now: 3 });
    expect(placeIsFinished(getPlace({ storage }))).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// The reader — the same saved sentence, one field apart, opposite outcomes
// -----------------------------------------------------------------------------
describe('Read this lesson — start to finish, after it is over', () => {
  const SENTENCES = [
    'The first sentence of the authored lesson body opens the teaching.',
    'The second sentence carries the teaching one step further along.',
    'The third sentence closes the teaching and ends this lesson here.',
  ];

  // A real element for the follow map to walk, registered the way the open
  // lesson registers itself (elementId + full text).
  const registerLesson = () => {
    reading = document.createElement('div');
    reading.id = 'learn-read-ll3';
    reading.textContent = SENTENCES.join(' ');
    document.body.appendChild(reading);
    setReadTarget('ll3', { label: 'this lesson', text: SENTENCES.join(' '), elementId: 'learn-read-ll3' });
  };

  const pressStartToFinish = async () => {
    await act(async () => { root.render(createElement(TTSControl, { view: 'church' })); });
    const fab = container.querySelector('button[aria-label="Open read-aloud controls"]');
    await act(async () => { fab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const panel = container.querySelector('.tts-controls > div');
    const btn = [...panel.querySelectorAll('button')].find((b) => /start to finish/.test(b.textContent));
    expect(btn).toBeTruthy();
    await act(async () => { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    // The read path awaits reveal + settle (lib/read-reveal.js: up to ten
    // double-frame ticks) before it maps the element and speaks, so the press
    // is not done when the click returns. Pump frames until it speaks.
    for (let i = 0; i < 60 && readSpy.mock.calls.length === 0; i += 1) {
      await act(async () => { await new Promise((r) => { window.requestAnimationFrame(() => window.requestAnimationFrame(() => r())); }); });
    }
    return readSpy.mock.calls.length ? String(readSpy.mock.calls[readSpy.mock.calls.length - 1][0]) : '';
  };

  it('a lesson HEARD TO THE END plays from the top again — not one last sentence and silence', async () => {
    registerLesson();
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll3' });
    // Exactly the state the old reader left behind: the last sentence saved,
    // and (new) the knowledge that the lesson was finished.
    recordPlace({ sentence: SENTENCES.length - 1, sentenceKey: '' });
    finishPlace();
    const spoken = await pressStartToFinish();
    expect(spoken).toContain(SENTENCES[0]);
    expect(spoken).toContain(SENTENCES[SENTENCES.length - 1]);
  });

  it('but a lesson PAUSED part-way still resumes where it was — the fix is not a reset for everyone', async () => {
    registerLesson();
    recordPlace({ courseKey: 'living-lessons', lessonId: 'll3' });
    recordPlace({ sentence: 1, sentenceKey: '' }); // mid-lesson, never finished
    expect(placeIsFinished(getPlace())).toBe(false);
    const spoken = await pressStartToFinish();
    expect(spoken).not.toContain(SENTENCES[0]);
    expect(spoken).toContain(SENTENCES[1]);
  });

  it('the reader refuses a finished place at the source, and marks the end at the last sentence', () => {
    const s = src('TTSControl.jsx');
    // The resume decision short-circuits for a finished lesson...
    expect(s).toMatch(/if \(placeIsFinished\(place\)\) return -1;/);
    // ...and the end is recorded from the per-sentence write, on the last one.
    expect(s).toMatch(/absIndex >= total - 1\) finishPlace\(\)/);
    // The contract resume-at-the-sentence pins is untouched.
    expect(s).toMatch(/recordPlace\(\{ sentence: absIndex, sentenceKey: sentenceKeyOf\(text\) \}\)/);
    expect(s).toMatch(/continuing \? -1 : savedStartIndex/);
  });

  it('the lesson space reopens a finished lesson at its top, not at its last part', () => {
    const s = src('ChurchLearn.jsx');
    expect(s).toMatch(/return placeIsFinished\(p\) \? null : p;/);
    // The arc still opens at the saved stage for an unfinished place.
    expect(s).toMatch(/initialIndex=\{savedHere \? savedHere\.stage : 0\}/);
  });
});

// -----------------------------------------------------------------------------
// ALL is obvious — in the bar, and again at the end of every lesson
// -----------------------------------------------------------------------------
describe('the way back to ALL is not a little bitty button', () => {
  it('the bar way-out is the PRIMARY control: filled, 44px, and it says All on a phone too', () => {
    const s = src('ChurchLearn.jsx');
    const m = s.match(/data-testid="lesson-bar-all"\s*\n\s*className="([^"]+)"/);
    expect(m).toBeTruthy();
    const cls = m[1];
    expect(cls).toContain('bg-[#1A1815]');     // filled, not a hairline outline
    expect(cls).toContain('border-2');
    expect(cls).toContain('min-h-[44px]');     // was 36px
    expect(cls).toContain('text-[0.8125rem]'); // was 0.625rem (10px)
    // No phone-only truncation to the word "All" on its own any more.
    expect(s).not.toMatch(/<span className="sm:hidden">← All<\/span>/);
    // Still inside the capped chrome region, so Big Print grows words not frames.
    expect(s).toMatch(/ts-chrome-region sticky top-0/);
  });

  it('the bar keeps ONE row on a phone — the way out did not cost the frame', () => {
    const s = src('ChurchLearn.jsx');
    const bar = s.slice(s.indexOf('data-testid="lesson-space-bar"') - 400, s.indexOf('data-testid="lesson-space-bar"') + 100);
    expect(bar).toContain('flex-nowrap');
    // Prev/Next stay quiet arrows beside it — the right weight for them.
    expect(s).toMatch(/←<span className="hidden sm:inline"> Prev<\/span>/);
  });

  it('the end of a lesson carries two full-width doors: start over, and all lessons', () => {
    const s = src('LessonFlow.jsx');
    expect(s).toMatch(/data-testid="lesson-end-doors"/);
    const over = s.match(/data-testid="lesson-start-over"\s*\n\s*className="([^"]+)"/);
    const all = s.match(/data-testid="lesson-end-all"\s*\n\s*className="([^"]+)"/);
    expect(over).toBeTruthy();
    expect(all).toBeTruthy();
    for (const cls of [over[1], all[1]]) {
      expect(cls).toContain('flex-1');        // full width, side by side on a wide screen
      expect(cls).toContain('min-h-[48px]');
      expect(cls).toContain('text-[0.8125rem]');
      expect(cls).toContain('border-2');
    }
    expect(all[1]).toContain('bg-[#1A1815]'); // ALL is the primary of the two
    // They appear ONLY at the end, and they are chrome (never read aloud).
    expect(s).toMatch(/\{atLast && \(onStartOver \|\| onAllUnits\) && \(/);
    expect(s).toMatch(/data-read-skip data-testid="lesson-end-doors"/);
  });

  it('Start over goes back to part one AND clears the place; All lessons leaves the space', () => {
    const flow = src('LessonFlow.jsx');
    // Part one first, then the host clears the record — both, in that order.
    expect(flow).toMatch(/onClick=\{\(\) => \{ goTo\(0\); onStartOver\(\); \}\}/);
    const learn = src('ChurchLearn.jsx');
    // DR-0623: leaving by the end door also records the lesson finished, so
    // Continue stops offering a lesson that was read to its end — then leaves.
    expect(learn).toMatch(/onAllUnits=\{focusModule \? \(\) => \{ finishPlace\(\{ courseKey: course\.key, lessonId: m\.id \}\); setFocusId\(null\); \} : null\}/);
    expect(learn).toMatch(/onStartOver=\{\(\) => \{ savePlace\(\{ lessonId: m\.id, stage: 0, step: 0 \}\); \}\}/);
  });

  it('a host that wires neither door keeps the old footer exactly', () => {
    const s = src('LessonFlow.jsx');
    expect(s).toMatch(/onAllUnits = null, onStartOver = null/);
  });
});
