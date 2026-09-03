// =============================================================================
// Legacy Provisions — JOURNEY WALKS (COMPREHENSIVE-REVIEW-STANDARD dimension 2)
// =============================================================================
// Dimension 2 exists because component-level tracing misses journeys: "the owner
// saves a phone-only contact and tries to message him" was a two-minute walk no
// component test ever took. A journey that cannot be COMPLETED is a finding even
// when every component passes — and that is exactly what this file found on
// 2026-09-03 (DR-0323).
//
// THE WALK THAT FAILED: an heir opens Books -> Plan, goes straight to
// Constitution (the tab their name is on), reads Article 1, and wants to attest.
// On a fresh install the roster is empty, so the whole Attestation card did not
// render, the attest control did not exist, and NOTHING on that tab said why or
// where to go. Every unit test passed; the journey was impossible. The card now
// always renders, says the roster is empty, and offers the SAME builder the
// production tab uses.
//
// Each `it` below is one persona walking from their own entry point to their own
// goal. They drive the real component — no mocks of our own code.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import LegacyProvisions from '../components/LegacyProvisions.jsx';
import { POE_PRODUCTION_POLICY } from '../lib/family-trust.js';
import { aboutFor } from '../lib/surface-help.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  try { localStorage.clear(); } catch { /* storage-less jsdom still runs the surface */ }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const mount = () => act(() => root.render(createElement(LegacyProvisions)));
const text = () => container.textContent;
const btn = (needle) => [...container.querySelectorAll('button')].find((b) => b.textContent.includes(needle));
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const type = (el, value) => act(() => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
const pick = (select, value) => act(() => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  setter.call(select, value);
  select.dispatchEvent(new Event('change', { bubbles: true }));
});
const selects = () => [...container.querySelectorAll('select')];

describe('JOURNEY 1 — an heir opens Constitution first and wants to attest', () => {
  it('can go from a fresh install to an attested article WITHOUT leaving the tab', () => {
    mount();
    // They land on Constitution (the default section) and read Article 1.
    expect(text()).toContain('Article 1');
    expect(text()).toContain('Unattested');

    // THE REGRESSION THIS PINS: the roster is empty, and the surface must still
    // tell them what to do rather than hiding the whole card.
    expect(text()).toMatch(/Nobody on the roster yet|Nothing is attested yet, because nobody is on the roster/);

    // They add themselves in place, through the same builder the other tab uses.
    const reader = selects()[0];
    pick(reader, '__add__');
    const input = container.querySelector('input[placeholder="Your name"]');
    expect(input, 'the in-place add must appear on THIS tab').toBeTruthy();
    type(input, 'Firstborn');
    click(btn('Add and read as'));

    // And now the attest control exists and works.
    const attest = btn('I have read this article');
    expect(attest, 'the attest control must exist once they have added themselves').toBeTruthy();
    click(attest);
    expect(text()).toContain('Attested');
    expect(text()).toMatch(/1 of \d+ articles attested/);
  });
});

describe('JOURNEY 2 — a steward records the first contribution on day one', () => {
  it('can add a beneficiary from inside the record form and record against them', () => {
    mount();
    click(btn('Produce before you take'));

    // The dropdown must not dead-end on an empty roster (Pattern 2f.2).
    expect(text()).toMatch(/No beneficiaries yet/);
    const who = selects().find((s) => [...s.options].some((o) => o.value === '__add__'));
    expect(who, 'the beneficiary picker must offer an in-place add').toBeTruthy();
    pick(who, '__add__');
    // Two "add a person" inputs live on this panel (the roster card and the
    // in-place add); they carry DIFFERENT placeholders so a person — and this
    // walk — can tell them apart.
    const input = container.querySelector('input[placeholder="New beneficiary\u2019s name"]');
    expect(input, 'the in-place add box must open inside the record form').toBeTruthy();
    type(input, 'Second Son');
    click(btn('Add and select'));

    // The record button must now be enabled and say so.
    const record = btn('Record it');
    expect(record, 'the record action should be reachable once a person is chosen').toBeTruthy();
    expect(record.disabled).toBe(false);
  });
});

describe('JOURNEY 3 — a steward answers the wall with no roster at all', () => {
  it('completes without ever needing a beneficiary, because the wall is house-level', () => {
    mount();
    click(btn('The wall'));
    expect(text()).toContain('not reviewed');
    const no = btn('No — exposed');
    expect(no).toBeTruthy();
    click(no);
    expect(text()).toContain('Exposed');
    expect(text()).toMatch(/1 exposure/);
  });
});

describe('JOURNEY 4 — a trustee looks for a distribution answer before any record exists', () => {
  it('is told NO RECORD and is never shown a passing standing', () => {
    mount();
    click(btn('Produce before you take'));
    expect(text()).toMatch(/No entries yet/);
    expect(text()).toMatch(/never as a pass/);
    // No standing card can claim a pass with nothing recorded.
    expect(text()).not.toMatch(/Standing met/);
  });
});

// =============================================================================
// SURFACE-SAYS-TRUTH (COMPREHENSIVE-REVIEW-STANDARD dimension 3)
// =============================================================================
// "A false explanation is a defect of the first rank" — the Messages footer
// blamed the encryption key while the real gate was membership, so the owner
// debugged the wrong thing WITH THE APP'S OWN HELP. Every explanatory string
// this surface shows is checked here against the mechanism it describes, so the
// copy cannot drift away from the engine that actually decides.
describe('SURFACE-SAYS-TRUTH — the copy matches the mechanism', () => {
  it('the rule it states is the rule the engine runs — every number, from the policy', () => {
    mount();
    click(btn('Produce before you take'));
    const shown = text();
    expect(shown).toContain(String(POE_PRODUCTION_POLICY.minProductionEntries));
    expect(shown).toContain(String(POE_PRODUCTION_POLICY.periodMonths));
    expect(shown).toContain(`${Math.round(POE_PRODUCTION_POLICY.contributeBackRatio * 100)}%`);
    expect(shown).toContain(POE_PRODUCTION_POLICY.reviewFloorAmount.toLocaleString());
    // And every exemption reason it advertises is one the engine accepts.
    for (const reason of POE_PRODUCTION_POLICY.exemptionReasons) expect(shown).toContain(reason);
  });

  it('does not promise protection anywhere the engine would not confirm it', () => {
    mount();
    click(btn('The wall'));
    const shown = text();
    // With nothing answered, no string may say the posture is confirmed.
    expect(shown).toMatch(/not reviewed/);
    expect(shown).not.toMatch(/Every item confirmed/);
    expect(shown).toMatch(/never counted as protection/);
  });

  it('the Help entry describes the same two halves the tab actually renders', () => {
    const about = aboutFor('books:plan');
    expect(about, 'the Plan tab must have a light about (help-freshness gate)').toBeTruthy();
    expect(about.what).toMatch(/constitution/i);
    expect(about.what).toMatch(/spendthrift/i);
    expect(about.what).toMatch(/produce/i);
    // The source line must not claim a store the surface does not use.
    expect(about.where).toMatch(/device/i);
  });
});
