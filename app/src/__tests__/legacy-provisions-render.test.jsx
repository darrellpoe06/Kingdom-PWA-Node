// =============================================================================
// LegacyProvisions — the surface actually renders, and it renders the HONEST
// empty states (proven-to-catch, DR-0076).
// =============================================================================
// A surface that shows a painted "protected" or a painted zero is worse than no
// surface at all on a trust ledger. This harness mounts the real component with
// a clean localStorage and asserts what a family sees on day one: no record, not
// reviewed, and an empty ledger that says so in words. It also drives the real
// controls — attest an article, answer a review item, record a contribution —
// and asserts the state actually moved, so the buttons are wired rather than
// decorative.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import LegacyProvisions from '../components/LegacyProvisions.jsx';
import { FAMILY_CONSTITUTION } from '../lib/family-trust.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  try { localStorage.clear(); } catch { /* jsdom without storage — the surface still runs */ }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const mount = () => act(() => root.render(createElement(LegacyProvisions)));
const text = () => container.textContent;
const byText = (sel, needle) =>
  [...container.querySelectorAll(sel)].find((el) => el.textContent.includes(needle));
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

describe('LegacyProvisions: it mounts and states all three provisions', () => {
  it('renders without throwing and names each provision', () => {
    mount();
    expect(text()).toContain('Three provisions');
    expect(text()).toContain('family constitution');
    expect(text()).toContain('spendthrift provision');
    expect(text()).toContain('Forced income production');
  });

  it('carries the not-legal-advice boundary on the surface itself, not buried', () => {
    mount();
    expect(text()).toMatch(/not legal advice/i);
    expect(text()).toMatch(/attorney/i);
  });
});

describe('LegacyProvisions: day-one honesty', () => {
  it('shows every constitution article as UNATTESTED before anyone attests', () => {
    mount();
    expect(text()).toContain(`Article 1 — ${FAMILY_CONSTITUTION.articles[0].title}`);
    expect(text()).toContain('Unattested');
    expect(text()).not.toContain('Attested '); // no painted attestation
  });

  it('shows the spendthrift wall as NOT reviewed — never as protected', () => {
    mount();
    const wall = byText('button', 'The wall');
    click(wall);
    expect(text()).toContain('not reviewed');
    expect(text()).toMatch(/never counted as protection/i);
    expect(text()).not.toMatch(/Every item confirmed/i);
  });

  it('shows an empty production ledger as NO RECORD, never as a pass', () => {
    mount();
    click(byText('button', 'Produce before you take'));
    expect(text()).toMatch(/no entries yet/i);
    expect(text()).toMatch(/never as a pass/i);
    expect(text()).toMatch(/No beneficiaries added yet/i);
  });
});

describe('LegacyProvisions: the controls actually write records', () => {
  it('attesting an article records it and the article stops reading unattested', () => {
    mount();
    // No roster yet -> no attest control. Add a beneficiary first.
    click(byText('button', 'Produce before you take'));
    const input = container.querySelector('input[placeholder="Name"]');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Firstborn');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    click(byText('button', 'Add'));
    expect(text()).toContain('Firstborn');

    click(byText('button', 'Constitution'));
    const attestButton = byText('button', 'I have read this article');
    expect(attestButton, 'the attest control should exist once a person is on the roster').toBeTruthy();
    click(attestButton);
    expect(text()).toContain('Attested');
    expect(text()).toMatch(/1 of \d+ articles attested/);
  });

  it('answering a wall question moves it off "not reviewed" and can report an exposure', () => {
    mount();
    click(byText('button', 'The wall'));
    const no = [...container.querySelectorAll('button')].find((b) => b.textContent.includes('No — exposed'));
    click(no);
    expect(text()).toContain('Exposed');
    expect(text()).toMatch(/1 exposure/);
  });
});
