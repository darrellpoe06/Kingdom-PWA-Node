// @vitest-environment jsdom
//
// BlueprintFieldGuide — live render proof (Verification Doctrine DR-0076 §7:
// validate by USING the surface, not by reading the code). Mounts the real
// component in jsdom and proves the three sub-panels are reachable and carry the
// source material faithfully: the five commitments (incl. the Cage + three
// brakes), the five ICM layers, and the two-door access model.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import BlueprintFieldGuide from '../components/BlueprintFieldGuide.jsx';

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(BlueprintFieldGuide));
  });
}
const tabByText = (re) => [...document.body.querySelectorAll('[role="tab"]')].find((b) => re.test(b.textContent));
async function click(el) { await act(async () => { el.click(); }); }

beforeEach(async () => { await mount(); });
afterEach(async () => { await act(async () => { root.unmount(); }); container.remove(); });

describe('BlueprintFieldGuide surface', () => {
  it('renders the header and the five-commitments panel by default', () => {
    const text = document.body.textContent;
    expect(text).toContain('How PoeTech is built');
    // The five commitments are the default panel.
    expect(text).toContain('Clarity, so anxiety lifts');
    expect(text).toContain('Sovereignty over your own data');
    expect(text).toContain('90-day trial with zero lockout');
  });

  it('names the Cage and its three brakes on the AI commitment', () => {
    const text = document.body.textContent.toLowerCase();
    expect(text).toContain('kill-switch');
    expect(text).toContain('budget');
    // The governance ordering line.
    expect(document.body.textContent).toContain('the human governs');
  });

  it('opens the five ICM layers panel and shows Layer 0 → Layer 4', async () => {
    const layersTab = tabByText(/Five layers/);
    expect(layersTab).toBeTruthy();
    await click(layersTab);
    const text = document.body.textContent;
    expect(text).toContain('Layer 0 · Identity');
    expect(text).toContain('Layer 4 · Working');
  });

  it('opens the two-door access panel and shows both paths', async () => {
    const doorsTab = tabByText(/Two doors/);
    expect(doorsTab).toBeTruthy();
    await click(doorsTab);
    const text = document.body.textContent;
    expect(text).toContain('Path A');
    expect(text).toContain('Path B');
    expect(text).toContain('Instant entry');
    expect(text).toContain('Durable, isolated ownership');
  });
});
