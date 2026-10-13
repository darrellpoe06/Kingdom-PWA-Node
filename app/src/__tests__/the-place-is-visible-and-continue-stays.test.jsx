// @vitest-environment jsdom
// =============================================================================
// How far through, always visible — and ▶ Continue that does not flash away
// =============================================================================
// Darrell 2026-09-17, from the live church door, with a screenshot:
//   "The timeline bar for the place or how far or close to the end isn't
//    visible to the user during the reading process... also the continue button
//    flashes and leaves pretty quickly... fix"
//
// TRACED (DR-0061) before either fix was written:
//
//   DEFECT 1 - the step line and its bar were rendered INLINE at the top of the
//   current segment inside AgePacedLesson, 96px wide. The instant a reader
//   scrolled into the prose they were reading, the only indicator of how far
//   through the lesson they were had scrolled off the screen. His screenshot
//   shows precisely that: a stranded fragment of green bar above the sticky
//   block, while the body reads STEP 4 OF 5 far below it.
//
//   DEFECT 2 - TTSControl cleared the "screen went dark" offer on the FIRST
//   tick of isReading:
//        useEffect(() => { if (isReading) setInterrupted(false); }, [isReading])
//   On waking a dark screen the speech engine frequently performs its own brief
//   recovery, flickers alive, and dies again. So the offer was dismissed by the
//   very failure it exists to recover from - appearing and vanishing within a
//   frame or two, leaving no reading AND no way back to the lost sentence.
//
// Both fixes are held here against the real component tree, and each assertion
// below fails against the code as it stood before.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const ra = {
  supported: true, isReading: false, isPaused: false, rate: 1,
  read: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn(), claimAudio: vi.fn(), setRate: () => {},
  catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
  voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  segmentIndex: 0, setBoundaryHandler: () => {}, deviceRead: true, cloudProgress: null,
};
vi.mock('../lib/use-read-aloud.js', () => ({ useReadAloud: () => ({ ...ra }) }));

import TTSControl, { INTERRUPT_GRACE_MS, RESUME_CONFIRM_MS } from '../components/TTSControl.jsx';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root, vis, sentinels, requestSpy;
const setVisibility = (v) => { vis = v; act(() => { document.dispatchEvent(new Event('visibilitychange')); }); };
function installWakeLock() {
  sentinels = [];
  requestSpy = vi.fn(async () => { const w = { released: false, release: vi.fn(async () => { w.released = true; }), addEventListener: () => {} }; sentinels.push(w); return w; });
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: requestSpy } });
}
function removeWakeLock() { Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: undefined }); }
const renderReader = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));

beforeEach(() => {
  window.localStorage.clear();
  vis = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => vis });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  ra.isReading = false;
  ra.isPaused = false;
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  removeWakeLock();
  window.localStorage.clear();
  vi.useRealTimers();
});

const byText = (text) => [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes(text));

// -----------------------------------------------------------------------------
// DEFECT 2 — the offer must survive the flicker that caused it.
// -----------------------------------------------------------------------------
describe('the ▶ Continue offer does not flash away', () => {
  const raiseOffer = () => {
    installWakeLock();
    ra.isReading = true; renderReader();
    setVisibility('hidden');       // hid while a reading was live
    ra.isReading = false; renderReader();
    setVisibility('visible');      // back, and the reading did not survive
    act(() => { vi.advanceTimersByTime(INTERRUPT_GRACE_MS + 50); });
  };

  it('the confirm window exists and is a real, positive delay', () => {
    // A zero or missing window is the original bug restored.
    expect(typeof RESUME_CONFIRM_MS).toBe('number');
    expect(RESUME_CONFIRM_MS).toBeGreaterThan(0);
  });

  it('a BRIEF engine flicker on wake does NOT dismiss the offer — the whole defect', () => {
    vi.useFakeTimers();
    raiseOffer();
    expect(container.querySelector('[data-testid="reading-interrupted"]'), 'the offer should be up').toBeTruthy();

    // The engine flickers alive for less than the confirm window, then dies.
    ra.isReading = true; renderReader();
    act(() => { vi.advanceTimersByTime(Math.max(1, Math.floor(RESUME_CONFIRM_MS / 3))); });
    ra.isReading = false; renderReader();
    act(() => { vi.advanceTimersByTime(RESUME_CONFIRM_MS * 3); });

    expect(
      container.querySelector('[data-testid="reading-interrupted"]'),
      'a flicker dismissed the offer — the reader is left with no reading and no way back',
    ).toBeTruthy();
  });

  it('but reading that actually STAYS live does take the offer down', () => {
    // The offer must not become permanent furniture either.
    vi.useFakeTimers();
    raiseOffer();
    expect(container.querySelector('[data-testid="reading-interrupted"]')).toBeTruthy();

    ra.isReading = true; renderReader();
    act(() => { vi.advanceTimersByTime(RESUME_CONFIRM_MS + 100); });

    expect(container.querySelector('[data-testid="reading-interrupted"]')).toBeNull();
  });

  it('once up, nothing takes it down on its own — only the reader does', () => {
    vi.useFakeTimers();
    raiseOffer();
    act(() => { vi.advanceTimersByTime(60000); });
    expect(container.querySelector('[data-testid="reading-interrupted"]'), 'the offer expired by itself').toBeTruthy();

    const dismiss = [...container.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Dismiss');
    expect(dismiss, 'the reader needs a way to dismiss it').toBeTruthy();
    act(() => { dismiss.click(); });
    expect(container.querySelector('[data-testid="reading-interrupted"]')).toBeNull();
  });
});

// -----------------------------------------------------------------------------
// DEFECT 1 — the data path, then the surface.
// -----------------------------------------------------------------------------
describe('how far through is visible where it cannot scroll away', () => {
  const extraCourses = buildCatalogCourseDescriptors();
  const mount = () => act(() => root.render(createElement(ChurchLearn, {
    extraCourses,
    progress: {},
    toggleModule: () => {},
    quizState: {},
    recordQuiz: () => {},
    learnLevel: 'auto',
    setLearnLevel: () => {},
    ageBand: 'adult',
    setAgeBand: () => {},
  })));
  const openLivingLessons = () => {
    const sel = container.querySelector('#learn-course-pick');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'living-lessons');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
  };
  // THE REAL PATH, found by probing the running tree rather than assumed: a
  // lesson opens to a card with "Start this lesson"; the paced steps live
  // inside the TEACH stage of the guide. The first version of this test clicked
  // a button reading "Next" and silently navigated to the NEXT LESSON, because
  // the sticky bar carries a "Next" of its own - which is exactly the
  // observe-don't-assume rule this repository keeps learning.
  const openALesson = () => {
    mount();
    openLivingLessons();
    act(() => { byText('Bodybuilding Christ').click(); });
  };
  const startAndTeach = () => {
    act(() => { byText('Start this lesson').click(); });
    act(() => { byText('Teach').click(); });
  };
  // The step control, never the sticky bar's next-lesson control.
  const stepNext = () => [...container.querySelectorAll('button')]
    .filter((b) => /Next\s*→/.test(b.textContent || ''))
    .find((b) => !b.closest('[data-testid="lesson-space-sticky"]'));

  it('NOTHING is painted before a real step is reported', () => {
    // A bar showing a position nobody has reached is exactly the painted number
    // the reality-trace rule forbids. Absence is correct here.
    openALesson();
    startAndTeach();
    expect(container.querySelector('[data-testid="lesson-space-progress"]')).toBeNull();
  });

  it('once the reader advances a step, the bar appears IN THE STICKY BLOCK', () => {
    openALesson();
    startAndTeach();
    const next = stepNext();
    expect(next, 'the teach stage should be paced into steps').toBeTruthy();
    act(() => { next.click(); });

    const bar = container.querySelector('[data-testid="lesson-space-progress"]');
    expect(bar, 'the place indicator never reached the sticky block').toBeTruthy();

    const sticky = container.querySelector('[data-testid="lesson-space-sticky"]');
    expect(sticky).toBeTruthy();
    expect(sticky.className).toContain('sticky');
    expect(
      sticky.contains(bar),
      'the bar is on the page but not in the sticky block — it will scroll away again',
    ).toBe(true);
  });

  it('it reports the REAL position and distance to the end, from the live step', () => {
    openALesson();
    startAndTeach();
    act(() => { stepNext().click(); });
    const bar = container.querySelector('[data-testid="lesson-space-progress"]');
    const meter = bar.querySelector('[role="progressbar"]');
    expect(meter, 'there must be a real progressbar, not just text').toBeTruthy();

    const now = Number(meter.getAttribute('aria-valuenow'));
    const max = Number(meter.getAttribute('aria-valuemax'));
    expect(Number.isFinite(now) && Number.isFinite(max)).toBe(true);
    expect(now).toBeGreaterThanOrEqual(1);
    expect(now).toBeLessThanOrEqual(max);
    // The text must agree with the meter — two views of one state, never two states.
    expect(bar.textContent).toContain(`Step ${now} of ${max}`);
    if (now < max) expect(bar.textContent).toContain(`${max - now} to go`);
    else expect(bar.textContent).toContain('last step');

    // And the fill must be proportional. Comparing it to ONE computed value is
    // not enough: a hardcoded 50% equals step 1 of 2 exactly, and a break that
    // replaced the calculation with a constant stayed GREEN against that
    // assertion. So the width must also MOVE when the step moves - which no
    // constant can satisfy.
    const fill = meter.querySelector('div');
    expect(fill.style.width).toBe(`${Math.round((now / max) * 100)}%`);
    const firstWidth = fill.style.width;
    const more = stepNext();
    if (more) {
      act(() => { more.click(); });
      const after = container.querySelector('[data-testid="lesson-space-progress"] [role="progressbar"]');
      const afterNow = Number(after.getAttribute('aria-valuenow'));
      expect(afterNow, 'the step did not advance').toBeGreaterThan(now);
      expect(
        after.querySelector('div').style.width,
        'the fill did not move when the step did — it is decorative, not proportional',
      ).not.toBe(firstWidth);
    }
  });

  it('it is FULL WIDTH, not the 96px inline bar — a glance target while reading', () => {
    // The inline bar is w-24 and legible only beside its own label. This one has
    // to be readable without being looked for, which was the actual complaint.
    openALesson();
    startAndTeach();
    act(() => { stepNext().click(); });
    const meter = container.querySelector('[data-testid="lesson-space-progress"] [role="progressbar"]');
    expect(meter.className, 'the sticky bar must not be the narrow inline one').not.toContain('w-24');
    expect(meter.className).toMatch(/h-2/);
  });

  it('the inline step row is KEPT as well — this adds a view, it does not move one', () => {
    // A reader scrolled to the top of a segment should still see where the
    // segment begins. Two views of the same real state is the intent.
    openALesson();
    startAndTeach();
    act(() => { stepNext().click(); });
    expect(container.textContent).toMatch(/Step \d+ of \d+/);
    const inline = [...container.querySelectorAll('[role="progressbar"]')]
      .filter((el) => el.getAttribute('aria-label') === 'Lesson step');
    expect(inline.length, 'the inline indicator was removed rather than supplemented').toBeGreaterThan(0);
  });

  it('leaving for the index takes it away', () => {
    openALesson();
    startAndTeach();
    act(() => { stepNext().click(); });
    expect(container.querySelector('[data-testid="lesson-space-progress"]')).toBeTruthy();
    act(() => { byText('All lesson').click(); }); // back to the index
    expect(container.querySelector('[data-testid="lesson-space-progress"]')).toBeNull();
  });

  it('and moving to ANOTHER lesson never shows the previous one\'s position', () => {
    // This is where the lessonId guard actually earns its keep, and the first
    // version of this test missed it: going back to the INDEX unmounts the whole
    // sticky block regardless, so removing the guard stayed green. Moving from
    // lesson A straight to lesson B is the real case - a stale step from A on
    // B's bar is a confidently wrong number, which is worse than none at all.
    openALesson();
    startAndTeach();
    act(() => { stepNext().click(); });
    const before = container.querySelector('[data-testid="lesson-space-progress"]');
    expect(before, 'lesson A should be showing its own position').toBeTruthy();

    // The sticky bar's own next-LESSON control, not the step control.
    const nextLesson = [...container.querySelectorAll('button')]
      .filter((b) => /Next\s*→/.test(b.textContent || ''))
      .find((b) => b.closest('[data-testid="lesson-space-sticky"]'));
    expect(nextLesson, 'the sticky bar should offer the next lesson').toBeTruthy();
    act(() => { nextLesson.click(); });

    // Lesson B has reported no step, so there is nothing honest to show.
    expect(
      container.querySelector('[data-testid="lesson-space-progress"]'),
      "the previous lesson's position is being shown on this one",
    ).toBeNull();
  });
});
