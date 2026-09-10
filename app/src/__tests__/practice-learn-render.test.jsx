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
// Training is areas on a second-row chip strip (Darrell 2026-09-10: "training
// tab is too deep... another tab slider for each section"); a reader taps an
// audience, then an area. These walk the surface the way the reader does.
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
async function audience(re) { const b = [...container.querySelectorAll('button')].find((x) => re.test(x.textContent)); expect(b, `audience ${re}`).toBeTruthy(); await click(b); }
function chip(label) { return [...container.querySelectorAll('[role="tablist"][aria-label="Training areas"] [role="tab"]')].find((t) => t.textContent.trim() === label); }
async function area(label) { const t = chip(label); expect(t, `area ${label}`).toBeTruthy(); await click(t); }
const areas = () => [...container.querySelectorAll('[role="tablist"][aria-label="Training areas"] [role="tab"]')].map((t) => t.textContent.trim());
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('PracticeLearn — the Practice-scoped Learn space', () => {
  it('leads with the lessons and reading support; every area is one chip away; no moralizing caveats', async () => {
    await mount();
    let text = container.textContent;
    expect(text).toContain('A Learn space that builds real skill');
    expect(text).toContain('Reading support');
    expect(text).toContain('Understanding & Coping'); // client track, the default area
    expect(text).toMatch(/not treatment or diagnosis/i);
    // The areas a client sees, side by side — nothing staff-only.
    expect(areas()).toEqual(['Lessons', 'What you’ll gain', 'Certificates']);
    expect(container.querySelectorAll('[role="tablist"]').length).toBe(1);
    await area('What you’ll gain');
    text = container.textContent;
    expect(text).toContain('Coping skills');
    expect(text).toContain('Skills you’ll build');
    await area('Certificates');
    expect(container.textContent).toMatch(/No certificate earned on this device yet/);
    // The old moralizing accreditation framing is gone.
    expect(container.textContent).not.toMatch(/NOT YET ACCREDITED/);
    expect(container.textContent).not.toMatch(/bright line/i);
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

  it('a staff viewer on Training & Hours sees every area on the strip, and the supervised-hours ledger toward the IL pathway', async () => {
    await mount({ isStaff: true });
    await audience(/Training & Hours/);
    expect(areas()).toEqual(['Lessons', 'What you’ll gain', 'Course library', 'Training map', 'Pathways', 'Certificates', 'Hours', 'CE renewal', 'Catalog & required']);
    await area('Hours');
    let text = container.textContent;
    expect(text).toContain('Supervised hours ledger');
    expect(text).toMatch(/Illinois supervised clinical experience/);
    // A real "Log hours" control exists.
    expect([...container.querySelectorAll('button')].some((b) => /Log hours/.test(b.textContent))).toBe(true);
    await area('Catalog & required');
    text = container.textContent;
    expect(text).toContain('Certificate catalog');
    expect(text).toContain('Required trainings');
  });

  it('a staff viewer on Training & Hours sees the CEU renewal tracker — distinct from the supervised-hours ledger, driven by the Illinois ruleset', async () => {
    await mount({ isStaff: true });
    await audience(/Training & Hours/);
    // The post-license CE tracker is its own area, separate from the supervised-hours ledger (its own area too).
    expect(areas()).toContain('Hours');
    await area('CE renewal');
    const text = container.textContent;
    expect(text).toContain('CEU renewal tracker');
    expect(text).not.toContain('Supervised hours ledger');
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
    await audience(/Training & Hours/);
    await area('CE renewal');
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
    await audience(/Therapists$/);
    expect(container.textContent).toContain('Clinician CE & onboarding');
    await area('Hours');
    expect(container.textContent).toContain('Supervised hours ledger');
  });

  it('staff on Training & Hours sees the built-out course library + the multi-year plan', async () => {
    await mount({ isStaff: true });
    await audience(/Training & Hours/);
    await area('Course library');
    let text = container.textContent;
    // The course library renders, grouped by the clinical fields.
    expect(text).toContain('Course library');
    expect(text).toMatch(/Assessment & diagnosis/);
    expect(text).toMatch(/Crisis & risk/);
    // The 24-hours/month, multi-year plan is its own area, with its honest runway language.
    await area('Training map');
    text = container.textContent;
    expect(text).toContain('Multi-year training plan');
    expect(text).toMatch(/24 hours \/ month/);
    expect(text).toMatch(/runway/i);
    await area('Course library');
    // Christina's SME gate is present (Agree / Disagree).
    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(buttons.some((t) => /Agree \(approve\)/.test(t))).toBe(true);
    expect(buttons.some((t) => /Disagree \(send back\)/.test(t))).toBe(true);
  });

  it('PROVEN-TO-CATCH: a non-staff viewer never sees the course library or the SME gate', async () => {
    await mount({ isStaff: false });
    const text = container.textContent;
    expect(text).not.toContain('Course library');
    expect(text).not.toContain('Multi-year training plan');
    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent);
    expect(buttons.some((t) => /Agree \(approve\)/.test(t))).toBe(false);
  });

  it('staff see the four-strand spine (Yahweh-centred) and the multi-track / UIUC panel', async () => {
    await mount({ isStaff: true });
    await audience(/Training & Hours/);
    await area('Course library');
    let text = container.textContent;
    // Four-strand spine, with Yahweh's perspective & Will at the centre.
    expect(text).toContain('four-strand spine');
    expect(text).toMatch(/Yahweh’s perspective/);
    // The audiences/tracks panel with grounded hours + SME-confirm honesty — the Pathways area.
    await area('Pathways');
    text = container.textContent;
    expect(text).toContain('Who this serves');
    expect(text).toMatch(/MSW student/);
    expect(text).toMatch(/supervised clinical/i);
    expect(text).toMatch(/SME-confirm pending/);
    // UIUC pipeline + the Christiana connection.
    expect(text).toMatch(/UIUC student pipeline/);
    expect(text).toContain('Christiana Poe');
  });
});
