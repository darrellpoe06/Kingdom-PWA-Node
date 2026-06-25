// =============================================================================
// Projects row closing — live render proof (Verification Doctrine: observe the
// REAL surface, not just the pure logic). The 2026-06-23 closure-lifecycle check
// found finished projects linger as active/overdue and inflate the live Active +
// 12-month-forecast numbers because closing was manual + buried in Manage. This
// mounts the ACTUAL <Projects> surface and proves the new one-tap "Mark complete"
// on the row writes the terminal `complete` status — closing from where you see
// the project — and that a completed project is hidden from the default list.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { Projects } from '../components/Projects.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;

// An overdue, still-`active` project — exactly the kind that lingers and keeps
// counting toward Active + the forecast until a human remembers to close it.
const overdueProject = {
  id: 'p-overdue', title: 'Roof repair', status: 'active', domain: 'family',
  startDate: '2026-01-01', endDate: '2026-02-01', hoursPerWeek: 5, createdBy: null,
};
const completedProject = {
  id: 'p-done', title: 'Taxes filed', status: 'complete', domain: 'family',
  startDate: '2026-01-01', endDate: '2026-04-15', hoursPerWeek: 0, createdBy: null,
};

async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(Projects, props));
  });
}

beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('Projects row — one-tap close (real surface)', () => {
  it('clicking "Mark complete" on the row writes status: complete via updateProject', async () => {
    const calls = [];
    await mount({
      projects: [overdueProject],
      entities: [],
      addProject: () => {}, updateProject: (id, patch) => calls.push([id, patch]), deleteProject: () => {},
    });

    const btn = container.querySelector('[aria-label="Mark Roof repair complete"]');
    expect(btn).toBeTruthy(); // the one-tap close exists on the row
    await act(async () => { btn.click(); });

    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe('p-overdue');
    expect(calls[0][1].status).toBe('complete');
  });

  it('an overdue row also offers Reschedule (slipped-but-not-done path)', async () => {
    await mount({
      projects: [overdueProject],
      entities: [],
      addProject: () => {}, updateProject: () => {}, deleteProject: () => {},
    });
    expect(container.querySelector('[aria-label="Reschedule Roof repair"]')).toBeTruthy();
  });

  it('hides completed projects from the default list (active work only)', async () => {
    await mount({
      projects: [overdueProject, completedProject],
      entities: [],
      addProject: () => {}, updateProject: () => {}, deleteProject: () => {},
    });
    expect(container.textContent).toContain('Roof repair');   // open work shows
    expect(container.textContent).not.toContain('Taxes filed'); // closed work hidden by default
  });
});
