// @vitest-environment jsdom
// =============================================================================
// One play reads the WHOLE core — not step 1 of 4
// =============================================================================
// Darrell 2026-08-13, watching the reader run on Session 8 of 8: "only part 1
// of the core is taught or read by the reader... fix it... I want to hear the
// whole lesson and course from one play action."
//
// WHERE THE TRUNCATION ACTUALLY WAS, because it is not where it looks.
//
// The SPOKEN TEXT was never short. `readAloudTextFromArc` has always pushed
// `lessonPlan.segments` in full (lesson-flow.js:268) — every step of the core.
// What went wrong is that the reader does not read that text when it can map
// the named ELEMENT instead: follow-along works by alignment-by-construction,
// so the DOM *is* the reading. And the DOM held one step.
//
// `showAll` already existed for read-along and already opened every ARC STAGE
// (Open, Teach, Engage, Apply, Send-off) — which is why the later stages were
// visible in his screenshot while the core itself still said "STEP 2 OF 4". The
// reveal stopped one level short: the Teach stage's paced steps live in
// AgePacedLesson, which rendered `segments[cur]` regardless.
//
// HOW THIS FILE GOT HONEST, recorded because it is the same lesson as the fix.
// The first draft mounted the whole ChurchLearn tree on a Healthy Living lesson
// and PASSED — vacuously. That course paces to a single adult segment, so no
// stepper rendered, the "Step n of N" guard matched nothing, and three
// assertions returned early having proven nothing. Retargeting to a course that
// does chunk (living-lessons, 4 adult steps, measured) still missed: Darrell's
// screenshot is a COHORT SESSION view, and which paced core mounts depends on
// which course/session path renders. An assertion whose subject depends on that
// much scaffolding is not a guard, it is a coin flip.
//
// So the paced core is rendered DIRECTLY with a real multi-step plan. The thing
// that broke is the thing under test, and it cannot pass by accident.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { AgePacedLesson } from '../components/ChurchLearn.jsx';
import { readAloudTextFromArc } from '../lib/lesson-flow.js';
import { lessonPlanForAge } from '../lib/learn-framework.js';
import { buildSelfPacedDescriptors } from '../lib/learn-catalog.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('main');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); root = null; });

const text = () => container.textContent || '';
const render = (props) => act(() => root.render(createElement(AgePacedLesson, props)));

// A four-step core, the shape from Darrell's screenshot ("STEP 2 OF 4 · ADULT
// PACE"). Distinctive bodies so a missing step is unmistakable.
const PLAN = {
  segments: [
    'CORE ALPHA the first part',
    'CORE BRAVO the second part',
    'CORE CHARLIE the third part',
    'CORE DELTA the fourth part',
  ],
  totalSegments: 4,
  segmentMinutes: 25,
  breakAfterSegments: 0,
  checkAfterSegments: 99,
  band: { label: 'Adult' },
};

describe('THE BUG: paced reading shows one step at a time', () => {
  it('without read-along, only the current step is in the DOM', () => {
    render({ plan: PLAN });
    expect(text()).toContain('CORE ALPHA');
    for (const missing of ['CORE BRAVO', 'CORE CHARLIE', 'CORE DELTA']) {
      expect(text(), 'the stepper is meant to page for a READER').not.toContain(missing);
    }
    expect(text()).toMatch(/Step\s+1\s+of\s+4/i);
  });
});

describe('THE FIX: read-along puts the whole core in the DOM', () => {
  it('every step is present, so the reader can read all of it', () => {
    render({ plan: PLAN, showAll: true });
    for (const part of ['CORE ALPHA', 'CORE BRAVO', 'CORE CHARLIE', 'CORE DELTA']) {
      expect(text(), `${part} never entered the DOM, so a listener never hears it`).toContain(part);
    }
  });

  it('the steps stay in order — a listener hears the core as taught', () => {
    render({ plan: PLAN, showAll: true });
    const t = text();
    expect(t.indexOf('CORE ALPHA')).toBeLessThan(t.indexOf('CORE BRAVO'));
    expect(t.indexOf('CORE BRAVO')).toBeLessThan(t.indexOf('CORE CHARLIE'));
    expect(t.indexOf('CORE CHARLIE')).toBeLessThan(t.indexOf('CORE DELTA'));
  });

  it('each step keeps its marker, so the listener still hears where they are', () => {
    render({ plan: PLAN, showAll: true });
    for (let i = 1; i <= 4; i += 1) expect(text()).toMatch(new RegExp(`Step\\s+${i}\\s+of\\s+4`, 'i'));
  });

  it('the paging controls are gone in read-along — nothing to tap', () => {
    render({ plan: PLAN, showAll: true });
    const labels = [...container.querySelectorAll('button')].map((b) => b.textContent || '');
    expect(labels.join(' ')).not.toMatch(/next|back/i);
  });

  it('leaving read-along restores the stepper — the reader is not left flattened', () => {
    render({ plan: PLAN, showAll: true });
    render({ plan: PLAN, showAll: false });
    expect(text()).toContain('CORE ALPHA');
    expect(text()).not.toContain('CORE DELTA');
  });

  it('a single-segment lesson is unaffected either way', () => {
    const one = { ...PLAN, segments: ['ONLY PART'], totalSegments: 1 };
    render({ plan: one, showAll: true });
    expect(text()).toContain('ONLY PART');
    expect(text()).not.toMatch(/Step\s+1\s+of\s+1/i);
  });
});

describe('the spoken text carries the whole core too', () => {
  it('readAloudTextFromArc pushes every segment, not the current one', () => {
    const t = readAloudTextFromArc({
      title: 'A lesson',
      audienceSegments: [{ kind: 'teach', audience: { lessonPlan: { segments: PLAN.segments } } }],
    });
    for (const s of PLAN.segments) expect(t).toContain(s);
  });
});

describe('the catalog really does produce multi-step cores', () => {
  it('a real lesson paces into several adult steps — the fixture is not a fiction', () => {
    // Measured, so the fixture above models something real: 120 of the shipped
    // self-paced lessons chunk at adult pace. This pins that the shape is
    // genuine rather than invented to make the test pass.
    const course = buildSelfPacedDescriptors({}).find((c) => (c.meta?.key || c.key) === 'living-lessons');
    const lesson = (course?.schedule || []).find((m) => m.id === 'll1-the-perfect-yahweh-expects');
    expect(lesson, 'living-lessons/ll1 is no longer in the catalog').toBeTruthy();
    expect(lessonPlanForAge(lesson, 'adult').totalSegments).toBeGreaterThan(1);
  });
});
