// =============================================================================
// ClientGrowth — live render proof (Verification Doctrine: observe the REAL
// surface, not just the pure engine). Mounts the actual component in jsdom with
// real props and reads the DOM — catching a runtime render error the build can't.
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

describe('ClientGrowth renders the 3-sided automated surface', () => {
  it('mounts with the run-the-team trigger, three sides, balance, lessons, and the outbound gate', async () => {
    await mount();
    const text = container.textContent;
    expect(text).toContain('Revenue Agent Team');
    // The four roles (stage cards render the role even when collapsed).
    expect(text).toContain('Market Signal Researcher');
    expect(text).toContain('Conversion System Builder');
    // The automation headline + the one human gate.
    expect(text).toContain('Run the team');
    expect(text).toContain('Outbound — needs your approval');
    // Three-sided marketplace + balance.
    expect(text).toContain('Marketplace balance');
    // Supporting lessons layer.
    expect(text).toContain('Supporting lessons');
    // Binding guardrails (incl. the approve-outbound line).
    expect(text).toContain('Humans approve outbound');
    expect(text).toContain('No payment processing by us');
    // Optional cadence is present but inert.
    expect(text).toMatch(/Inert/i);
    // The run trigger exists as a real control.
    const runBtn = [...container.querySelectorAll('button')].find((b) => /run the team/i.test(b.textContent));
    expect(runBtn).toBeTruthy();
  });

  it('leads with an observable COCKPIT: live state, brakes, and what awaits the human', async () => {
    await mount();
    const text = container.textContent;
    // The cockpit band + idle state (answers "why can't I tell").
    expect(text).toMatch(/Cockpit/);
    expect(text).toMatch(/Idle/i);
    // The three brakes are visible controls.
    expect(text).toMatch(/Kill-switch/i);
    expect(text).toMatch(/Budget:/);
    expect(text).toMatch(/Awaiting your approval/i);
    // The kill-switch is a real toggle.
    const killBtn = [...container.querySelectorAll('button')].find((b) => /kill-switch/i.test(b.textContent));
    expect(killBtn).toBeTruthy();
  });

  it('shows the CONTRACT (what it should do) + the ACTIVITY REPORT (what it did, with metrics)', async () => {
    await mount();
    const text = container.textContent;
    // Contract strip: automated vs you-approve is explicit.
    expect(text).toMatch(/What the team does/i);
    expect(text).toMatch(/Automated draft/);
    expect(text).toMatch(/Drafts → you approve/);
    // Activity report: metric labels + the empty-state honesty.
    expect(text).toMatch(/Activity report/i);
    expect(text).toMatch(/Drafts produced/i);
    expect(text).toMatch(/Est\. time saved/i);
    expect(text).toMatch(/No runs yet/i);
  });

  it('disables Run when the kill-switch is engaged (brake is real, not theater)', async () => {
    await mount();
    const killBtn = [...container.querySelectorAll('button')].find((b) => /kill-switch clear/i.test(b.textContent));
    expect(killBtn).toBeTruthy();
    await act(async () => { killBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const runBtn = [...container.querySelectorAll('button')].find((b) => /run the team/i.test(b.textContent));
    expect(runBtn.disabled).toBe(true);
    expect(container.textContent).toMatch(/Kill-switch ON/i);
  });

  it('reflects real client-side lead data in the funnel + pipeline count', async () => {
    const leads = [
      newLead({ sideKey: 'client', stage: 'new', name: 'A' }, { id: 'a' }),
      newLead({ sideKey: 'client', stage: 'intake-scheduled', name: 'B' }, { id: 'b' }),
      newLead({ sideKey: 'therapist', stage: 'active', name: 'Dr T' }, { id: 't' }), // other side, excluded from client pipeline
    ];
    await mount({ leads });
    const text = container.textContent;
    expect(text).toContain('Clients pipeline · 2'); // only the 2 client-side leads
    expect(text).toContain('Funnel');
  });

  it('switches sides (Therapists) and shows the recruiting funnel', async () => {
    await mount();
    const therapistTab = [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Therapists');
    expect(therapistTab).toBeTruthy();
    await act(async () => { therapistTab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const text = container.textContent;
    expect(text).toContain('Therapists pipeline');
    expect(text).toContain('Credential check'); // a therapist-funnel stage label
  });
});
