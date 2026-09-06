// =============================================================================
// IpRegisterPanel — live render proof (the IP register on Books -> Legal)
// =============================================================================
// Mounts the REAL panel in jsdom. Reality-trace (P15) says a surface is a live
// view of real state, and the failure class it exists to catch is a number that
// looks right and traces to nothing. So these tests do not check that the panel
// renders — they check that it renders the TRUTH, by feeding it a portfolio
// whose answers differ from the real one and requiring the screen to change.
//
// A test asserting only "the words IP Register appear" would pass against a
// painted version. Every assertion here is about DERIVED output a painted panel
// could not have produced.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { IpRegisterPanel } from '../components/Legal.jsx';
import { assetShape, portfolioScore } from '../lib/ip-register.js';

let container, root;
async function mount(props = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(IpRegisterPanel, props));
  });
}
afterEach(async () => {
  if (root) await act(async () => { root.unmount(); });
  if (container) container.remove();
  root = null; container = null;
});
const text = () => document.body.textContent || '';
const buttons = (re) => [...document.body.querySelectorAll('button')].filter((b) => re.test(b.textContent || ''));
async function click(el) { await act(async () => { el.click(); }); }

describe('IpRegisterPanel reports the real position', () => {
  it('says 0 of 22 are assets, and names the shared bottleneck as the one document that moves it', async () => {
    await mount();
    expect(text()).toMatch(/0 of 22 are assets/i);
    expect(text()).toMatch(/one document moves the whole register/i);
    expect(text()).toMatch(/written IP assignment into an entity/i);
  });

  it('warns about the six methods publication put outside trade-secret reach, without implying all is lost', async () => {
    await mount();
    expect(text()).toMatch(/6 methods outside trade-secret reach/i);
    expect(text()).toMatch(/Deterministic gate suite/);
    expect(text()).toMatch(/disclosure is not recoverable/i);
    expect(text()).toMatch(/Still protectable, because not yet published/i);
  });

  it('DERIVES the headline — a converted portfolio reads differently', async () => {
    const converted = [assetShape({
      name: 'PoeTech', lane: 'trademark', owner: 'PoeTech LLC', assigned: true,
      fixedOn: '2026-09-06', authorship: 'human', publiclyDisclosed: true,
      protection: 'registered', licensed: true,
    })];
    expect(portfolioScore(converted).fullAssets).toBe(1);
    await mount({ assets: converted });
    expect(text()).toMatch(/1 of 1 are assets/i);
    // Nothing forfeited and nothing blocked, so neither warning is always-on.
    expect(text()).not.toMatch(/outside trade-secret reach/i);
    expect(text()).not.toMatch(/one document moves the whole register/i);
  });

  it('does not claim a shared bottleneck when the rows do not share one', async () => {
    await mount({ assets: [
      assetShape({ name: 'A', lane: 'trademark', fixedOn: '2026-09-06', authorship: 'human', publiclyDisclosed: true, protection: 'registered' }),
      assetShape({ name: 'B', lane: 'trademark', owner: 'X', assigned: true, fixedOn: '2026-09-06', authorship: 'human', publiclyDisclosed: true, protection: 'none' }),
    ] });
    expect(text()).not.toMatch(/one document moves the whole register/i);
  });

  it('keeps the schedule collapsed until asked, then puts the clearance risk on screen', async () => {
    await mount();
    const toggle = buttons(/show all 22 rows/i)[0];
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(text()).not.toMatch(/collides with the W3C/i);
    await click(toggle);
    expect(buttons(/hide the schedule/i)[0].getAttribute('aria-expanded')).toBe('true');
    // The SKOS collision is a finding the user should meet on the screen.
    expect(text()).toMatch(/collides with the W3C/i);
    // And the mark we refuse to claim is named as refused, so no later pass adds it.
    expect(text()).toMatch(/not a coined mark/i);
  });

  it('shows an empty lane by omission rather than rendering a zero section', async () => {
    await mount();
    await click(buttons(/show all 22 rows/i)[0]);
    // 8 marks, 8 works, 6 methods, 0 patents — the patent lane is absent, not "Patent · 0".
    expect(text()).toMatch(/Trademark · 8/);
    expect(text()).toMatch(/Copyright · 8/);
    expect(text()).toMatch(/Trade secret · 6/);
    expect(text()).not.toMatch(/Patent · 0/);
  });

  it('says plainly that this is PoeTech’s register and not the tenant’s', async () => {
    await mount();
    expect(text()).toMatch(/not yours/i);
    expect(text()).toMatch(/Not legal advice/i);
  });

  it('renders an empty register honestly instead of throwing', async () => {
    await mount({ assets: [] });
    expect(text()).toMatch(/0 of 0 are assets/i);
  });
});
