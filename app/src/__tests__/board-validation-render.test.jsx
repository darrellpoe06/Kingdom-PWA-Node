// =============================================================================
// ValidationLanes render proof — the sideways Current → Future → Gap → Decision
// walk (DR-0119), rendered with the REAL Moore discovery-validation seed rows.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { ValidationLanes } from '../components/ProjectBoards.jsx';
import { seedTasksForBoard } from '../lib/board.js';
import { nextOutcome, outcomeOf } from '../lib/board-validation.js';

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const flowRows = () => seedTasksForBoard('board-client-factory').filter((r) => r.links && r.links.flow);

describe('ValidationLanes', () => {
  it('renders one lane per unit, All units pinned first, steps flowing sideways in a scroll row', () => {
    act(() => root.render(<ValidationLanes tasks={flowRows()} onPatch={() => {}} onCycle={() => {}} />));
    const text = container.textContent;
    expect(text).toContain('Validation — current → future → gap → decision');
    // All units pinned first with its cross-cutting marker.
    const laneHeads = [...container.querySelectorAll('.bg-\\[\\#FAF8F4\\]')].map((n) => n.textContent);
    expect(laneHeads[0]).toContain('All units impacted');
    // Every lane walks the four steps.
    expect(text).toContain('Current state');
    expect(text).toContain('Future state');
    expect(text).toContain('Decision');
    // The step row is a sideways scroll container (the thin tab-scroll bar).
    expect(container.querySelector('.tab-scroll.overflow-x-auto')).toBeTruthy();
    // Honest states render: the unbuilt registry decision reads Unknown / open.
    expect(text).toContain('Unknown');
    expect(text).toContain('open');
    // A step no row examined yet says so — never invented.
    expect(text).toContain('not examined');
  });

  it('tapping an outcome chip patches links.outcome to the next outcome in the cycle', () => {
    const rows = flowRows();
    const patches = [];
    act(() => root.render(<ValidationLanes tasks={rows} onPatch={(t, p) => patches.push([t, p])} onCycle={() => {}} />));
    const chip = [...container.querySelectorAll('button')].find((b) => /Fit|Gap|Unknown|Partial fit/.test(b.textContent));
    expect(chip).toBeTruthy();
    act(() => chip.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(patches.length).toBe(1);
    const [t, p] = patches[0];
    expect(p.links.outcome).toBe(nextOutcome(outcomeOf(t)));
    // The patch preserves the row's other links metadata (flow/unit survive).
    expect(p.links.flow).toBe(t.links.flow);
    expect(p.links.unit).toBe(t.links.unit);
  });

  it('renders nothing for a board without flow rows', () => {
    act(() => root.render(<ValidationLanes tasks={[{ slug: 'x', status: 'done', links: {} }]} onPatch={() => {}} onCycle={() => {}} />));
    expect(container.textContent).toBe('');
  });
});
