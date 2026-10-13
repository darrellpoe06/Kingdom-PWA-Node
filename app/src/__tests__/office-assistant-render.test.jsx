// OfficeAssistant render — proves the config-driven UI actually mounts a working
// screen, and that the SAME component renders a DIFFERENT office from a different
// config (the standalone-App-Module payoff: drop in a config, get an app).
// Uses the repo's react-dom/client + act convention (no @testing-library).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import OfficeAssistant from '../modules/office-assistant/OfficeAssistant.jsx';
import { createOfficeModel } from '../modules/office-assistant/model.js';
import { createOfficeStore } from '../modules/office-assistant/store.js';
import { TLC_CONFIG } from '../modules/office-assistant/configs/tlc.js';
import { TEMPLATE_CONFIG } from '../modules/office-assistant/configs/_template.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
async function mount(config, isGovernor = false) {
  const model = createOfficeModel(config);
  const store = createOfficeStore(config, model);
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(OfficeAssistant, { config, store, isGovernor }));
  });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('OfficeAssistant — one component, any office', () => {
  it('renders the TLC office from its config (brand, Assistant header, NO-PHI note)', async () => {
    await mount(TLC_CONFIG);
    expect(container.textContent).toContain('Assistant');
    expect(container.textContent).toContain('TLC Therapy Solutions');
    expect(container.textContent).toContain('never clients or any protected health information');
    expect(container.textContent).toContain('Contacts today'); // derived from real seed rows
  });

  it('renders a DIFFERENT office (the template) from the same component — no code fork', async () => {
    await mount(TEMPLATE_CONFIG);
    expect(container.textContent).toContain('Example Wellness Office');
    expect(container.textContent).toContain('Assistant');
  });

  it('mounts cleanly in both the governor and the read-only view', async () => {
    await mount(TLC_CONFIG, true);
    expect(container.textContent).toContain('Assistant');
    act(() => root.unmount()); container.remove(); root = container = null;
    await mount(TLC_CONFIG, false);
    expect(container.textContent).toContain('Assistant');
  });
});
