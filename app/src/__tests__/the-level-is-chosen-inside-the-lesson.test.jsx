// @vitest-environment jsdom
// THE LEVEL IS CHOSEN INSIDE THE LESSON, AND THE ROW SAYS WHOSE WORDS THESE ARE.
// =============================================================================
// Darrell 2026-09-15: "can we bring those level controls into each lesson so
// it can be chosen even inside the lessons like the PowerPoint currently do?
// Flexibility with rigorous control of the system and processes."
//
// Before: the only age control was the course's "Pace & depth" tab; inside a
// lesson the paced core read "STEP 1 OF 41 · CHILD PACE" over the ADULT text
// (a standing depth override wins over the band in resolveForAge) and offered
// no way to change either. Now (DR-0417) the same "Who is learning?" row the
// Presenter keeps in its speaker bar sits at the top of the paced core, wired
// to the same remembered state, and it tells the truth when the words are not
// the band's own.
//
// Proven-to-catch: every assertion below fails against the previous
// AgePacedLesson (no radiogroup, no note, setters never reached).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { AgePacedLesson, LessonLevelControl } from '../components/ChurchLearn.jsx';
import { lessonPlanForAge, AGE_BANDS } from '../lib/learn-framework.js';

const words = (n, s) => Array.from({ length: n }, (_, i) => `${s} ${i + 1}.`).join(' ');
const MODULE = {
  id: 'level-test',
  lesson: words(60, 'The adult sentence is plain and full'),
  levels: {
    child: words(120, 'The sun is warm'),
    teen: words(80, 'You can carry a longer thought'),
    standard: words(60, 'The adult sentence is plain and full'),
    senior: words(50, 'The why and the edge case'),
  },
};

let host; let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const draw = (props) => { act(() => { root.render(createElement(AgePacedLesson, props)); }); return host; };
const group = () => host.querySelector('[role="radiogroup"]');
const radio = (label) => [...host.querySelectorAll('[role="radio"]')].find((b) => b.textContent.startsWith(label));

describe('the row is in the lesson', () => {
  it('the paced core carries the age row, checked on the band in force, above step 1', () => {
    const plan = lessonPlanForAge(MODULE, 'child');
    expect(plan.totalSegments).toBeGreaterThan(1);
    const setAgeBand = vi.fn();
    draw({ plan, setAgeBand });
    expect(group()).not.toBeNull();
    expect(host.querySelectorAll('[role="radio"]').length).toBe(AGE_BANDS.length);
    expect(radio('Child').getAttribute('aria-checked')).toBe('true');
    expect(radio('Adult').getAttribute('aria-checked')).toBe('false');
    // The row sits before the step line, where the choice is felt.
    const rowAt = host.innerHTML.indexOf('radiogroup');
    const stepAt = host.innerHTML.indexOf('Step 1 of');
    expect(rowAt).toBeGreaterThan(-1);
    expect(rowAt).toBeLessThan(stepAt);
  });

  it('picking an age reaches the same remembered state the Pace tab sets', () => {
    const plan = lessonPlanForAge(MODULE, 'child');
    const setAgeBand = vi.fn(); const setLearnLevel = vi.fn();
    draw({ plan, setAgeBand, setLearnLevel });
    act(() => { radio('Adult').click(); });
    expect(setAgeBand).toHaveBeenCalledWith('adult');
    // No override was standing, so nothing else is touched.
    expect(setLearnLevel).not.toHaveBeenCalled();
  });

  it('the read-along whole-core render and the single-segment render carry it too', () => {
    const setAgeBand = vi.fn();
    draw({ plan: lessonPlanForAge(MODULE, 'child'), setAgeBand, showAll: true });
    expect(group()).not.toBeNull();
    const short = { id: 'short', lesson: 'One sentence only.', levels: { child: 'One short sentence.' } };
    const plan = lessonPlanForAge(short, 'child');
    expect(plan.totalSegments).toBe(1);
    draw({ plan, setAgeBand });
    expect(group()).not.toBeNull();
  });

  it('the row is a control, not the lesson: the reader skips it and never clicks a radio', () => {
    draw({ plan: lessonPlanForAge(MODULE, 'child'), setAgeBand: vi.fn() });
    const row = host.querySelector('[data-testid="lesson-level-control"]');
    expect(row.getAttribute('data-read-skip')).toBe('true');
    expect(row.querySelector('[aria-expanded]')).toBeNull();
  });

  it('a host that hands in no setter renders exactly as before — no row', () => {
    draw({ plan: lessonPlanForAge(MODULE, 'child') });
    expect(group()).toBeNull();
  });
});

describe('surface says truth about whose words these are', () => {
  it('a standing depth override is named, and a fresh age pick clears it so the words change with the pace', () => {
    // The screenshot case: CHILD pace over the ADULT words.
    const plan = lessonPlanForAge(MODULE, 'child', 'standard');
    expect(plan.band.id).toBe('child');
    expect(plan.levelId).toBe('standard');
    const setAgeBand = vi.fn(); const setLearnLevel = vi.fn();
    draw({ plan, setAgeBand, setLearnLevel, levelOverride: 'standard' });
    const note = host.querySelector('[data-testid="lesson-level-control"]').textContent;
    expect(note).toContain('Depth is set to Adult');
    expect(note).toContain('Adult words at Child pace');
    act(() => { radio('Youth').click(); });
    expect(setAgeBand).toHaveBeenCalledWith('youth');
    expect(setLearnLevel).toHaveBeenCalledWith('auto');
  });

  it('"Follow my age instead" clears the override on its own', () => {
    const plan = lessonPlanForAge(MODULE, 'child', 'standard');
    const setLearnLevel = vi.fn();
    draw({ plan, setAgeBand: vi.fn(), setLearnLevel, levelOverride: 'standard' });
    const back = [...host.querySelectorAll('button')].find((b) => b.textContent.includes('Follow my age'));
    act(() => { back.click(); });
    expect(setLearnLevel).toHaveBeenCalledWith('auto');
  });

  it('a lesson with no version at the band is said plainly, without an override', () => {
    const thin = { id: 'thin', lesson: words(60, 'Only the adult words exist'), levels: { standard: words(60, 'Only the adult words exist') } };
    const plan = lessonPlanForAge(thin, 'child');
    expect(plan.levelId).toBe('standard');
    draw({ plan, setAgeBand: vi.fn() });
    const note = host.querySelector('[data-testid="lesson-level-control"]').textContent;
    expect(note).toContain('no Child version yet');
    expect(note).toContain('Adult words at Child pace');
  });

  it('with the band’s own words, no note is printed', () => {
    draw({ plan: lessonPlanForAge(MODULE, 'child'), setAgeBand: vi.fn() });
    const note = host.querySelector('[data-testid="lesson-level-control"]').textContent;
    expect(note).not.toContain('pace.');
  });
});

describe('the setters are threaded from the course to the paced core', () => {
  // A component test proves the row; this pins that the live tree actually
  // hands the setters down (the lesson space → TutorPanel → AgePacedLesson),
  // which is what the previous build lacked.
  const src = readFileSync(resolve(process.cwd(), 'src/components/ChurchLearn.jsx'), 'utf8');
  it('TutorPanel receives setAgeBand + setLearnLevel and passes them to AgePacedLesson', () => {
    const tutorCall = src.slice(src.indexOf('<TutorPanel'), src.indexOf('/>', src.indexOf('<TutorPanel')));
    expect(tutorCall).toContain('setAgeBand={setAgeBand}');
    expect(tutorCall).toContain('setLearnLevel={setLearnLevel}');
    const pacedCall = src.slice(src.indexOf('<AgePacedLesson'), src.indexOf('/>', src.indexOf('<AgePacedLesson')));
    expect(pacedCall).toContain('setAgeBand={setAgeBand}');
    expect(pacedCall).toContain('setLearnLevel={setLearnLevel}');
    expect(pacedCall).toContain('levelOverride={levelOverride}');
  });
  it('LessonLevelControl is the exported piece the row is made of', () => {
    expect(typeof LessonLevelControl).toBe('function');
  });
});
