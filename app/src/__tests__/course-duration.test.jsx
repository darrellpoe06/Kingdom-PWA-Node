// =============================================================================
// How long a course takes — MEASURED, at the app's own speeds, and never painted
// =============================================================================
// Darrell 2026-09-18: "Can you put the time it takes to go through the course at
// 1 and 1.5 speeds? Users can see the actual time they can expect to spend also
// what happened to the progress bar?"
//
// TWO THINGS THIS GATE EXISTS TO HOLD, and both are things the first draft got
// wrong before measurement caught them:
//
//   1. THE NUMBER MUST NOT BE THE WRONG NUMBER. lessonPlanForAge computes
//      `estimatedMinutes` = segments × the band's `segmentMinutes`, and it is
//      tempting to call that "time to read". It is not: `segmentMinutes` is a
//      FACILITATED SLOT BUDGET (25 min for adults, 5 for children), so across
//      this 171-lesson series it reads 736 HOURS for the adult band against 55
//      hours of actual listening — a factor of thirteen. It is returned as
//      `slotMinutes` for the facilitator who needs it, and this gate checks it
//      NEVER reaches a learner-facing surface.
//   2. A SPEED MUST NOT BE ADVERTISED THAT THE PLAYER CANNOT DO. The offered
//      rates are FILTERED FROM RATE_STEPS (lib/tts.js), the same list the
//      reader's own speed control renders, so removing 1.5× from the control
//      makes this stop claiming it rather than lying about it.
//
// And the progress bar: measured before anything was changed. Signed in it
// renders on every department tab and counts correctly. Signed OUT the whole
// panel vanished — no bar, no percentage, no heading — which reads exactly like
// a break. Progress is per-person and cannot be shown without a person, so the
// absence now explains itself instead of looking like a defect.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import {
  courseDuration, lessonDuration, spokenMinutes, formatDuration,
  offeredRates, HEADLINE_RATES,
} from '../lib/course-duration.js';
import { RATE_STEPS } from '../lib/tts.js';
import { SPOKEN_WPM } from '../lib/lesson-flow.js';

describe('the speeds come FROM the app’s own rate control', () => {
  it('offers exactly the two he asked for, and they are real steps', () => {
    const offered = offeredRates();
    expect(offered.map((o) => o.value)).toEqual([1, 1.5]);
    // Each one is the SAME object the reader's speed control renders, so the
    // label a reader taps and the label shown here cannot drift apart.
    for (const o of offered) expect(RATE_STEPS).toContain(o);
    expect(HEADLINE_RATES).toEqual([1, 1.5]);
  });

  it('PROVEN-TO-CATCH: a speed the control does not offer is NOT invented', () => {
    // 1.75 is not in RATE_STEPS. A module that built its own list would happily
    // advertise it; this one cannot, because it filters the real list.
    expect(offeredRates([1.75]).length).toBe(0);
    expect(offeredRates([1, 1.75]).map((o) => o.value)).toEqual([1]);
  });

  it('and it never advertises more than the control can do', () => {
    const values = new Set(RATE_STEPS.map((s) => s.value));
    for (const o of offeredRates(RATE_STEPS.map((s) => s.value))) expect(values.has(o.value)).toBe(true);
  });
});

describe('the arithmetic is the app’s own cadence, divided by the rate', () => {
  it('words / wpm / rate, exactly', () => {
    expect(spokenMinutes(1400, 1, 140)).toBe(10);
    expect(spokenMinutes(1400, 1.5, 140)).toBeCloseTo(6.6667, 3);
    expect(spokenMinutes(1400, 2, 140)).toBe(5);
  });

  it('uses the SPOKEN_WPM the rest of the app uses, not a private copy', () => {
    // If someone changes the cadence in lesson-flow.js, this follows it.
    expect(spokenMinutes(SPOKEN_WPM, 1)).toBe(1);
  });

  it('refuses to divide by nothing', () => {
    expect(spokenMinutes(0, 1)).toBe(0);
    expect(spokenMinutes(100, 0)).toBe(0);
    expect(spokenMinutes(100, 1, 0)).toBe(0);
    expect(spokenMinutes(null, null)).toBe(0);
  });
});

describe('the phrasing is something a reader can act on', () => {
  it('rounds the way a person reads a duration', () => {
    expect(formatDuration(1)).toBe('1 min');
    expect(formatDuration(59.6)).toBe('60 min');
    expect(formatDuration(60)).toBe('1 hour');
    expect(formatDuration(90)).toBe('1.5 hours');
    expect(formatDuration(221)).toBe('3.7 hours');
    expect(formatDuration(120)).toBe('2 hours');
  });

  it('a whole number of hours carries no decimal', () => {
    // "4.0 hours" is the tell of a number that came out of a machine.
    expect(formatDuration(240)).toBe('4 hours');
    expect(formatDuration(240)).not.toContain('.0');
  });

  it('ZERO IS A CLAIM, so it is never made', () => {
    // A surface that says "0 min" asserts the course is empty. Null means the
    // caller renders nothing (DR-0061: absent beats painted).
    expect(formatDuration(0)).toBe(null);
    expect(formatDuration(-5)).toBe(null);
    expect(formatDuration(0.4)).toBe('under a minute');
  });
});

describe('a real course, measured', () => {
  it('returns real totals for the real series', () => {
    const d = courseDuration(LIVING_LESSONS_MODULES, { ageBand: 'adult' });
    expect(d).toBeTruthy();
    expect(d.lessons).toBe(LIVING_LESSONS_MODULES.length);
    expect(d.spokenWords).toBeGreaterThan(100000);
    expect(d.wpm).toBe(SPOKEN_WPM);
    expect(d.listen.map((l) => l.label)).toEqual(['1×', '1.5×']);
    // 1.5x is faster than 1x. Stated because an inverted rate would still look
    // like a plausible number on the surface.
    expect(d.listen[1].minutes).toBeLessThan(d.listen[0].minutes);
    expect(d.listen[0].minutes / d.listen[1].minutes).toBeCloseTo(1.5, 5);
  });

  it('THE LEVEL CHANGES THE LENGTH, because each band is written out in full', () => {
    const child = courseDuration(LIVING_LESSONS_MODULES, { ageBand: 'child' });
    const adult = courseDuration(LIVING_LESSONS_MODULES, { ageBand: 'adult' });
    expect(child.levelId).toBe('child');
    expect(adult.levelId).toBe('standard');
    // A child band that reported the adult's length would be telling a parent
    // something false about their own child's time.
    expect(child.spokenWords).not.toBe(adult.spokenWords);
    expect(child.listen[0].minutes).toBeLessThan(adult.listen[0].minutes);
  });

  it('the course total is the SUM of its lessons — no drift', () => {
    const sample = LIVING_LESSONS_MODULES.slice(0, 12);
    const d = courseDuration(sample, { ageBand: 'adult' });
    const summed = sample.reduce((t, m) => t + lessonDuration(m, { ageBand: 'adult' }).spokenWords, 0);
    expect(d.spokenWords).toBe(summed);
  });

  it('an empty course is ABSENT, not zeroed', () => {
    expect(courseDuration([], { ageBand: 'adult' })).toBe(null);
    expect(courseDuration(null)).toBe(null);
    expect(courseDuration([{ id: 'x' }])).toBe(null); // no lesson and no levels
  });

  it('the slot figure is kept, and it is NOT the listening time', () => {
    // Both are returned; they are wildly different, which is the whole reason
    // they must never be confused. This asserts the gap rather than trusting
    // a comment about it.
    const d = courseDuration(LIVING_LESSONS_MODULES, { ageBand: 'adult' });
    expect(d.slotMinutes).toBeGreaterThan(d.listen[0].minutes * 5);
  });
});

// ---------------------------------------------------------------------------
// The surface
// ---------------------------------------------------------------------------
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const extraCourses = buildCatalogCourseDescriptors();
const mount = (props = {}) => act(() => root.render(createElement(ChurchLearn, {
  extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {}, ...props,
})));
const panel = (id) => container.querySelector(`[data-testid="${id}"]`);
const flat = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

describe('the course door shows the time, before the decision', () => {
  it('renders the panel with BOTH speeds and their real values', () => {
    mount();
    const d = panel('course-duration');
    expect(d, 'the duration panel is not on the course door').toBeTruthy();
    const text = flat(d);
    expect(text).toMatch(/1×/);
    expect(text).toMatch(/1\.5×/);
    // The numbers are the lib's, not re-derived in the component.
    const expected = courseDuration(LIVING_LESSONS_MODULES, { ageBand: 'adult' });
    expect(text).toContain(formatDuration(expected.listen[0].minutes));
    expect(text).toContain(formatDuration(expected.listen[1].minutes));
  });

  it('names WHICH version the numbers describe', () => {
    // Without this a reader at one level reads another level's time and has no
    // way to know. The level is part of the claim, not decoration.
    mount();
    expect(flat(panel('course-duration'))).toMatch(/standard version/);
    mount({ ageBand: 'child' });
    expect(flat(panel('course-duration'))).toMatch(/child version/);
  });

  it('THE SLOT BUDGET NEVER REACHES THE LEARNER, and this is the painted-number check', () => {
    // 736 hours of "reading" would have looked entirely plausible on this
    // surface. The panel must carry no reading-time claim and must not contain
    // the slot figure in any rounding.
    mount();
    const text = flat(panel('course-duration'));
    const d = courseDuration(LIVING_LESSONS_MODULES, { ageBand: 'adult' });
    expect(text).not.toMatch(/to read|reading time|time to read/i);
    for (const candidate of [
      formatDuration(d.slotMinutes),
      String(Math.round(d.slotMinutes)),
      String(Math.round(d.slotMinutes / 60)),
    ]) {
      expect(text, `the slot budget (${candidate}) leaked onto the learner-facing panel`).not.toContain(candidate);
    }
  });

  it('shows a per-lesson figure derived from the same total', () => {
    mount();
    const d = courseDuration(LIVING_LESSONS_MODULES, { ageBand: 'adult' });
    expect(flat(panel('course-duration')))
      .toContain(formatDuration(d.listen[0].minutes / d.lessons));
  });

  it('is shown to a reader who is NOT signed in, because that is when it is needed', () => {
    mount({ toggleModule: null });
    expect(panel('course-duration'), 'the time vanished for a signed-out reader').toBeTruthy();
    expect(flat(panel('course-duration'))).toMatch(/1\.5×/);
  });
});

describe('the progress panel, and the absence that used to look like a break', () => {
  it('signed IN: the bar renders and counts from the real record', () => {
    mount({ progress: { 'll1-the-perfect-yahweh-expects': true, 'll2-the-energy-you-were-given': true } });
    const bar = container.querySelector('[aria-label="Class progress"]');
    expect(bar, 'the progress bar is missing for a signed-in reader').toBeTruthy();
    expect(container.textContent).toMatch(/2 of \d+ ·/);
    // And the sign-in explanation is NOT also shown — they are alternatives.
    expect(panel('progress-needs-signin')).toBe(null);
  });

  it('signed OUT: no bar, but the absence EXPLAINS ITSELF', () => {
    mount({ toggleModule: null });
    expect(container.querySelector('[aria-label="Class progress"]'),
      'a progress bar was drawn with no person to own it').toBe(null);
    const note = panel('progress-needs-signin');
    expect(note, 'signed out, the progress panel vanished with no explanation').toBeTruthy();
    expect(flat(note)).toMatch(/Your progress/);
    expect(flat(note)).toMatch(/[Ss]ign in/);
    // And it must not discourage reading: nothing is actually locked.
    expect(flat(note)).toMatch(/nothing is locked/i);
  });

  it('NO PAINTED PERCENTAGE when there is nobody to own it', () => {
    // The tempting fix was a 0% bar. That asserts a reader has done none of it,
    // about a reader the app cannot identify.
    mount({ toggleModule: null });
    expect(flat(panel('progress-needs-signin'))).not.toMatch(/\b0\s*%/);
  });

  it('the bar survives on every department tab, signed in', () => {
    // The measured answer to "what happened to the progress bar?" — it is on
    // all of them, and this keeps it that way.
    mount();
    const tabs = [...container.querySelectorAll('[data-testid="learn-departments"] button')];
    expect(tabs.length).toBeGreaterThan(3);
    for (const t of tabs) {
      act(() => t.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      expect(container.querySelector('[aria-label="Class progress"]'),
        `the progress bar is missing on the "${t.textContent.trim()}" tab`).toBeTruthy();
      expect(panel('course-duration'),
        `the duration panel is missing on the "${t.textContent.trim()}" tab`).toBeTruthy();
    }
  });
});
