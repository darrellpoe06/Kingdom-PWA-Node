// The "before you begin" block is proven ON THE SURFACE, not in the function.
//
// lesson-context.js is pure and its own suite checks its arithmetic. That
// proves nothing about whether a reader ever sees it — the defect Darrell
// reported was precisely that a lesson's limits EXISTED and did not reach him.
// So this mounts the real renderer with the real catalog issue and reads the
// DOM, including the one property the whole complaint turns on: the block comes
// BEFORE Stage 1, where a reader meets it before he has invested anything.
//
// Network-free; DiscernmentStages is pure presentational.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

import DiscernmentStages from '../components/DiscernmentStages.jsx';
import { buildDiscernmentModule } from '../lib/discernment-track.js';
import { WORLD_ISSUES } from '../lib/world-issues-class.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const issue17 = buildDiscernmentModule(
  WORLD_ISSUES.find((i) => i.id === 'wi-biology-walked-back-and-the-word-on-the-worlds'),
).issue;

function mount(issue) {
  act(() => root.render(createElement(DiscernmentStages, { issue })));
}

describe('a reader meets the terms before the lesson', () => {
  it('the block is on the page', () => {
    mount(issue17);
    expect(container.querySelector('[data-testid="lesson-context"]')).toBeTruthy();
    expect(container.textContent).toContain('Before you begin');
  });

  it('BOTH columns are there — opportunities and constraints', () => {
    mount(issue17);
    expect(container.textContent).toContain('Opportunities — what you get');
    expect(container.textContent).toContain('Constraints — what this cannot do');
  });

  it('it comes BEFORE Stage 1, which is the entire point of the complaint', () => {
    mount(issue17);
    const html = container.innerHTML;
    const block = html.indexOf('lesson-context');
    const stageOne = html.indexOf('The claim');
    expect(block).toBeGreaterThan(-1);
    expect(stageOne).toBeGreaterThan(-1);
    expect(block).toBeLessThan(stageOne);
  });

  it('the measured numbers are on the surface, not only in the return value', () => {
    mount(issue17);
    const opp = container.querySelector('[data-testid="lesson-context-opportunities"]').textContent;
    const con = container.querySelector('[data-testid="lesson-context-constraints"]').textContent;
    expect(opp).toMatch(/8 facts are stated as DOCUMENTED/);
    expect(opp).toMatch(/26 dated sources/);
    expect(con).toMatch(/2 are DISPUTED/);
  });

  it('the authored source limits reach the reader here, not only inside the provenance paragraph', () => {
    mount(issue17);
    const con = container.querySelector('[data-testid="lesson-context-constraints"]').textContent;
    expect(con).toContain('Nobody here has watched or heard this conversation');
    expect(con).toMatch(/not a warrant for putting his sentence inside quotation marks/);
  });

  it('every issue in the catalog renders the block with both sides filled', () => {
    // A lesson that renders an empty "what this cannot do" column would be
    // claiming it has no limits, which is worse than saying nothing.
    for (const raw of WORLD_ISSUES) {
      mount(buildDiscernmentModule(raw).issue);
      const opp = container.querySelector('[data-testid="lesson-context-opportunities"]');
      const con = container.querySelector('[data-testid="lesson-context-constraints"]');
      expect(opp?.querySelectorAll('li').length, raw.id).toBeGreaterThan(0);
      expect(con?.querySelectorAll('li').length, raw.id).toBeGreaterThan(0);
    }
  });

  it('a lesson that has not authored its limits says so ON THE PAGE', () => {
    // The sixteen issues that predate the field are visibly marked, so the debt
    // is something a reader can see rather than something only a test knows.
    const older = WORLD_ISSUES.find((x) => !Array.isArray(x.limits) || x.limits.length === 0);
    expect(older).toBeTruthy();
    mount(buildDiscernmentModule(older).issue);
    expect(container.querySelector('[data-testid="lesson-context-constraints"]').textContent)
      .toMatch(/has not stated its source limits separately/);
  });

  it('the five stages still render — the block added context, it did not displace anything', () => {
    mount(issue17);
    const t = container.textContent;
    expect(t).toContain('Think it through — the five steps');
    expect(t).toContain('Verifiable vs interpretation');
    expect(t).toContain('Perspectives — every side, at its strongest');
    expect(t).toContain("The believer's lens — truth AND grace");
    expect(t).toContain('Reflection + the skill you carry out');
  });
});
