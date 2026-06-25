// =============================================================================
// ProjectInventory (Inventory · Capital Forecast) — null-title render guard.
//
// Regression lock for the 2026-06-23 crash diagnosed in
// docs/99-session-notes/2026-06-23-capex-forecast-crash-diagnosis.md:
//   TypeError: Cannot read properties of null (reading 'slice')
// A synced/older `projects` row with a NULL title reached the component and the
// project-filter button row called `p.title.slice(0, 24)` on it, throwing during
// render — the Capital Forecast sub-tab hit the error boundary.
//
// This test mounts the REAL ProjectInventory (non-compact, the sub-tab path that
// renders the filter row) with a null-title project and proves it renders the
// "Untitled" fallback instead of throwing. Proven-to-catch: reverting the
// `(p.title || 'Untitled')` guard makes this test throw, exactly as the bug did.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ProjectInventory } from '../components/Projects.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('ProjectInventory — null-title render guard (CapEx Capital Forecast)', () => {
  it('renders without throwing when a project has a null title, showing "Untitled"', () => {
    expect(() => {
      act(() => root.render(createElement(ProjectInventory, {
        projects: [{ id: 'pr-null', title: null }],
      })));
    }).not.toThrow();
    // The filter button row (the exact `.slice` site) renders the fallback.
    expect(container.textContent).toMatch(/Untitled/);
  });

  it('renders without throwing when a project title is undefined', () => {
    expect(() => {
      act(() => root.render(createElement(ProjectInventory, {
        projects: [{ id: 'pr-undef' }],
      })));
    }).not.toThrow();
    expect(container.textContent).toMatch(/Untitled/);
  });

  it('still shows a real title when one is present (fallback does not clobber it)', () => {
    act(() => root.render(createElement(ProjectInventory, {
      projects: [{ id: 'pr-real', title: 'Roof Replacement' }],
    })));
    expect(container.textContent).toMatch(/Roof Replacement/);
  });
});
