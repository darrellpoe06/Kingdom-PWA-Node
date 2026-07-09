// =============================================================================
// ChurchLearn — render proof for the sectioned course body (Verification
// Doctrine: observe the REAL DOM, not a claim). The Learn surface was the
// longest single scroll in the Church tab; its course body now flows as
// third-row SectionTabs chips ("sliding tabs instead of a long scroll",
// Darrell 2026-07-04; "a 3rd row of sliding tabs", 2026-07-05) under the
// existing course picker. These renders prove: the pinned blocks stay always
// visible, the weeks/curriculum is the default panel, every chip reveals its
// real content, and the Pace chip never renders as an empty dead-end when the
// host passes no pacing controls.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const mount = (props = {}) =>
  act(() => root.render(createElement(ChurchLearn, props)));

// Click a tab/chip in the SectionTabs strip by its visible label — only the
// active panel is mounted (same proven helper as church-home-render.test.jsx).
const clickTab = (label) => {
  const tab = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));
  if (!tab) throw new Error(`tab not found: ${label}`);
  act(() => tab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};

describe('ChurchLearn — the course body behind section chips', () => {
  it('defaults to the curriculum (Weeks) with the tagline pinned above the strip', () => {
    mount();
    expect(container.querySelector('[role="tablist"]')).toBeTruthy();
    // Week 1 of the youth A.I. class is on the DEFAULT panel — no click needed.
    expect(container.textContent).toMatch(/Week 1 ·/);
    // The pinned intro (tagline + audience) stays above the strip.
    expect(container.textContent).toMatch(/For /);
  });

  it('pins Your progress (the KPI strip) above the chips when a progress record exists', () => {
    mount({ toggleModule: () => {}, progress: {} });
    // Visible without clicking any chip — always-on KPI per the 2026-07-07 rule.
    expect(container.textContent).toMatch(/Your progress/);
    expect(container.querySelector('[role="progressbar"]')).toBeTruthy();
  });

  it('the Join chip reveals the real interest CTA', () => {
    mount();
    clickTab('Join');
    expect(container.textContent).toMatch(/I want to join/);
  });

  it('the Paper & print chip reveals the export controls', () => {
    mount();
    clickTab('Paper & print');
    expect(container.textContent).toMatch(/Copy markdown/);
    expect(container.textContent).toMatch(/Download \.md/);
  });

  it('Pace & depth only exists when the host wires pacing (no empty dead-end panel)', () => {
    mount();
    const labels = [...container.querySelectorAll('[role="tab"]')].map((b) => b.textContent || '');
    expect(labels.some((l) => l.includes('Pace & depth'))).toBe(false);
    // Re-mount WITH the age-band control — the chip appears and carries content.
    act(() => root.unmount());
    root = createRoot(container);
    mount({ setAgeBand: () => {}, ageBand: 'adult' });
    clickTab('Pace & depth');
    expect(container.textContent).toMatch(/Who’s learning\?/);
  });
});
