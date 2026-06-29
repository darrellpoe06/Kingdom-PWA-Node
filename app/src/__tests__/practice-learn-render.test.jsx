// =============================================================================
// PracticeLearn — live render proof (Verification Doctrine: observe the REAL
// surface). Mounts the actual component in jsdom and reads the DOM, confirming the
// outcomes-led experience, the audience scoping, and the training-hours ledger
// actually render — and that a non-staff viewer never sees staff-gated audiences.
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
  it('leads with outcomes, reading support, and client content — no moralizing caveats', async () => {
    await mount();
    const text = container.textContent;
    expect(text).toContain('A Learn space that builds real skill');
    expect(text).toContain('What you’ll gain');
    expect(text).toContain('Coping skills');
    expect(text).toContain('Reading support');
    expect(text).toContain('Understanding & Coping'); // client track
    expect(text).toMatch(/not treatment or diagnosis/i);
    // The old moralizing accreditation framing is gone.
    expect(text).not.toMatch(/NOT YET ACCREDITED/);
    expect(text).not.toMatch(/bright line/i);
  });

  it('PROVEN-TO-CATCH: a non-staff viewer sees NO clinician/training audience, ledger, or staff panels', async () => {
    await mount({ isStaff: false });
    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent.trim());
    expect(buttons.some((t) => /Therapists/.test(t))).toBe(false);
    expect(buttons.some((t) => /Training & Hours/.test(t))).toBe(false);
    const text = container.textContent;
    expect(text).not.toContain('Supervised hours ledger');
    expect(text).not.toContain('Certificate catalog');
    expect(text).not.toContain('Required trainings');
    expect(text).not.toContain('CEU renewal tracker');
  });

  it('a staff viewer on Training & Hours sees the supervised-hours ledger toward the IL pathway', async () => {
    await mount({ isStaff: true });
    const tab = [...container.querySelectorAll('button')].find((b) => /Training & Hours/.test(b.textContent));
    expect(tab).toBeTruthy();
    await act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const text = container.textContent;
    expect(text).toContain('Supervised hours ledger');
    expect(text).toMatch(/Illinois supervised clinical experience/);
    expect(text).toContain('Certificate catalog');
    expect(text).toContain('Required trainings');
    // A real "Log hours" control exists.
    expect([...container.querySelectorAll('button')].some((b) => /Log hours/.test(b.textContent))).toBe(true);
  });

  it('a staff viewer on Training & Hours sees the CEU renewal tracker — distinct from the supervised-hours ledger, driven by the Illinois ruleset', async () => {
    await mount({ isStaff: true });
    const tab = [...container.querySelectorAll('button')].find((b) => /Training & Hours/.test(b.textContent));
    await act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const text = container.textContent;
    // The post-license CE tracker renders, separate from the supervised-hours ledger.
    expect(text).toContain('CEU renewal tracker');
    expect(text).toContain('Supervised hours ledger'); // both coexist
    // Reads the Illinois ruleset: total hours, renewal countdown, mandated topics.
    expect(text).toMatch(/Illinois/);
    expect(text).toContain('of 30');                      // 30 CE hours required
    expect(text).toContain('Days to renew');
    expect(text).toContain('Social Work Practice Ethics'); // a mandated topic
    expect(text).toContain('Cultural Competence');
    // The approved-provider rule is surfaced once, as a neutral data field.
    expect(text).toMatch(/159\.xxxxxx/);
    // SME-confirm honesty is visible (not yet ratified by Christina).
    expect(text).toMatch(/SME/);
    // A real "Log CE activity" control exists.
    expect([...container.querySelectorAll('button')].some((b) => /Log CE activity/.test(b.textContent))).toBe(true);
  });

  it('the CEU tracker honors the first-renewal exemption when renewal # is set to 1st', async () => {
    await mount({ isStaff: true });
    const tab = [...container.querySelectorAll('button')].find((b) => /Training & Hours/.test(b.textContent));
    await act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    // Find the "Renewal #" select and choose 1st (newly licensed).
    const selects = [...container.querySelectorAll('select')];
    const renewalSelect = selects.find((s) => [...s.options].some((o) => /newly licensed/i.test(o.textContent)));
    expect(renewalSelect).toBeTruthy();
    await act(async () => {
      renewalSelect.value = '1';
      renewalSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const text = container.textContent;
    expect(text).toMatch(/No CE required for the first renewal/i);
  });

  it('staff can switch to Therapists and see the clinician track + hours ledger', async () => {
    await mount({ isStaff: true });
    const tab = [...container.querySelectorAll('button')].find((b) => b.textContent.trim().endsWith('Therapists'));
    expect(tab).toBeTruthy();
    await act(async () => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const text = container.textContent;
    expect(text).toContain('Clinician CE & onboarding');
    expect(text).toContain('Supervised hours ledger');
  });
});
