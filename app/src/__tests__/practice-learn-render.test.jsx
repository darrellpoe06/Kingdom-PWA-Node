// =============================================================================
// PracticeLearn — live render proof (Verification Doctrine: observe the REAL
// surface). Mounts the actual component in jsdom and reads the DOM, confirming the
// audience scoping + the certification framework actually render, and that a non-
// staff viewer never sees the staff-gated audiences or panels.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import PracticeLearn from '../components/PracticeLearn.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;

async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(PracticeLearn, { email: 'christina@example.com', isStaff: false, ...props }));
  });
}

beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('PracticeLearn — the Practice-scoped Learn space', () => {
  it('mounts with the header, reading support, the bright line, and client content', async () => {
    await mount();
    const text = container.textContent;
    expect(text).toContain('A Learn space for the whole Practice');
    expect(text).toContain('Reading support');
    expect(text).toContain('Certificates vs. accredited CEUs');
    // Client psychoeducation track shows for everyone.
    expect(text).toContain('Understanding & Coping');
    // The psychoeducation-not-treatment safety line is present for clients.
    expect(text).toMatch(/not treatment or diagnosis/i);
  });

  it('PROVEN-TO-CATCH: a non-staff viewer sees NO clinician/cert audience and NO staff panels', async () => {
    await mount({ isStaff: false });
    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent.trim());
    expect(buttons.some((t) => /Therapists/.test(t))).toBe(false);
    expect(buttons.some((t) => /Training & Certs/.test(t))).toBe(false);
    // Staff-only panels must be absent.
    expect(container.textContent).not.toContain('Certificate catalog');
    expect(container.textContent).not.toContain('Required trainings');
  });

  it('a staff viewer sees all three audiences and can switch to the cert framework', async () => {
    await mount({ isStaff: true });
    const trainingTab = [...container.querySelectorAll('button')].find((b) => /Training & Certs/.test(b.textContent));
    expect(trainingTab).toBeTruthy();
    await act(async () => { trainingTab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const text = container.textContent;
    // The staff certification framework + required trainings now show.
    expect(text).toContain('Certificate catalog');
    expect(text).toContain('Required trainings');
    // The CE template renders its honest "not yet accredited" label, never a false claim.
    expect(text).toMatch(/NOT YET ACCREDITED/);
  });

  it('staff can switch to Therapists and see the clinician CE track', async () => {
    await mount({ isStaff: true });
    const tab = [...container.querySelectorAll('button')].find((b) => b.textContent.trim().endsWith('Therapists'));
    expect(tab).toBeTruthy();
    await act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(container.textContent).toContain('Clinician CE & onboarding');
  });
});
