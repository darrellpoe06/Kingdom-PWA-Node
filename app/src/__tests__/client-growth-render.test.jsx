// =============================================================================
// ClientGrowth — live render proof (Verification Doctrine: observe the REAL
// surface, not just the pure engine). Mounts the actual component in jsdom with
// real props and reads the DOM it produces, so a runtime render error (bad hook,
// undefined map) is caught — the build alone can't catch that.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ClientGrowth from '../components/ClientGrowth.jsx';
import { newLead } from '../lib/client-acquisition.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;

async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ClientGrowth, { leads: [], addLead: () => {}, updateLead: () => {}, deleteLead: () => {}, ...props }));
  });
}

beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('ClientGrowth renders the real 4-stage acquisition surface', () => {
  it('mounts and shows all four agent-team roles + the guardrails ledger', async () => {
    await mount();
    const text = container.textContent;
    expect(text).toContain('Revenue Agent Team');
    expect(text).toContain('Market Signal Researcher');
    expect(text).toContain('Offer Architect');
    expect(text).toContain('Content Angle Strategist');
    expect(text).toContain('Conversion System Builder');
    // Binding guardrails are surfaced.
    expect(text).toContain('Binding guardrails');
    expect(text).toContain('No PHI in marketing');
    expect(text).toContain('No payment processing by us');
  });

  it('renders the first stage prompt (deterministic) for the default B2B path', async () => {
    await mount();
    // market-signal is open by default; its prompt names the role + tenant.
    expect(container.textContent).toContain('TLC Therapy Solutions');
    expect(container.textContent).toContain('A.I. prompt (deterministic)');
  });

  it('reflects real lead data in the funnel + metrics', async () => {
    const leads = [
      newLead({ audiencePresetKey: 'b2b-practices', stage: 'new', name: 'A' }, { id: 'a' }),
      newLead({ audiencePresetKey: 'b2b-practices', stage: 'converted', name: 'B' }, { id: 'b' }),
    ];
    await mount({ leads });
    const text = container.textContent;
    expect(text).toContain('Lead pipeline · 2');
    expect(text).toContain('Funnel');
  });
});
