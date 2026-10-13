// @vitest-environment jsdom
// DR-0784 — step by step, or scroll it all, on EVERY lesson surface.
// Christina 2026-10-07 (through Darrell): the TLC app needs full scrolling
// for lessons. Measured: the TLC door renders lessons through
// LessonFlowAudience with no flow switch, so a reader there was held to one
// part at a time; the Learn tab's guide had the switch (DR-0749) and the flow
// did not. The switch now lives in the flow, shared device-wide.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { LessonFlowAudience } from '../components/LessonFlow.jsx';
import { buildLessonArc } from '../lib/lesson-flow.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { FLOW_KEY } from '../lib/lesson-room.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); try { localStorage.removeItem(FLOW_KEY); } catch { /* fine */ } });
afterEach(() => { act(() => root.unmount()); container.remove(); try { localStorage.removeItem(FLOW_KEY); } catch { /* fine */ } });

const MODULE = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll1-')) || LIVING_LESSONS_MODULES[0];
const arc = () => buildLessonArc(MODULE, { ageBand: 'adult' });
const renderStage = (s) => createElement('div', { 'data-stage': s.kind }, s.title);
const mount = (props) => act(() => root.render(createElement(LessonFlowAudience, { arc: arc(), renderStage, unitNoun: 'lesson', ...props })));
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

describe('the flow carries the Steps / Scroll switch itself (every door that uses it gets it)', () => {
  it('starts step by step (one part box), shows the switch, and Scroll renders every part at once', () => {
    mount({});
    const sw = container.querySelector('[data-testid="lesson-flow-mode"]');
    expect(sw, 'the switch is in the flow, not only in the Learn guide').toBeTruthy();
    expect(container.querySelectorAll('[data-stage]').length).toBe(1);
    expect(container.querySelector('[data-testid="lesson-part-box"]')).toBeTruthy();
    click(sw.querySelector('[data-flow="scroll"]'));
    expect(container.textContent).toMatch(/Reading the whole lesson/);
    const parts = container.querySelectorAll('[data-stage]');
    expect(parts.length).toBe(arc().audienceSegments.length);
    expect(parts.length).toBeGreaterThan(1);
    expect(localStorage.getItem(FLOW_KEY)).toBe('scroll');
    // and back
    click(container.querySelector('[data-testid="lesson-flow-mode"] [data-flow="steps"]'));
    expect(container.querySelectorAll('[data-stage]').length).toBe(1);
  });

  it('the choice is the device\'s: a second lesson opens the way the first was left', () => {
    try { localStorage.setItem(FLOW_KEY, 'scroll'); } catch { /* fine */ }
    mount({});
    expect(container.textContent).toMatch(/Reading the whole lesson/);
    expect(container.querySelectorAll('[data-stage]').length).toBe(arc().audienceSegments.length);
  });

  it('a host that renders its own switch passes flowSwitch={false} and gets none here; its showAll still wins', () => {
    mount({ flowSwitch: false });
    expect(container.querySelector('[data-testid="lesson-flow-mode"]')).toBeNull();
    expect(container.querySelectorAll('[data-stage]').length).toBe(1);
    mount({ flowSwitch: false, showAll: true });
    expect(container.querySelectorAll('[data-stage]').length).toBe(arc().audienceSegments.length);
  });

  it('the TLC door and the Learn guide both render this flow, and only the guide carries its own switch', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const here = path.resolve(process.cwd(), 'src/components');
    const practice = fs.readFileSync(path.join(here, 'PracticeLearn.jsx'), 'utf8');
    const learn = fs.readFileSync(path.join(here, 'ChurchLearn.jsx'), 'utf8');
    expect(practice).toMatch(/<LessonFlowAudience[^>]*\/>/);
    expect(practice).not.toMatch(/flowSwitch=\{false\}/);
    expect(learn).toMatch(/flowSwitch=\{false\}/);
  });
});
