// TlcPublicDoor render — proves the sendable client door actually mounts a
// working screen: it leads with "Match a Preferred Provider" (Darrell: "the
// first thing we see"), lists the real clinical team + insurance + a Book
// action, and shows NOTHING operator (no inquiry queue, no Intake, no Assistant,
// no nav). Uses the repo's react-dom/client + act convention (no @testing-lib).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import TlcPublicDoor from '../components/TlcPublicDoor.jsx';
import { TLC_TEAM, TLC_BRAND } from '../lib/tlc-practice.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(TlcPublicDoor));
  });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('TlcPublicDoor — the sendable client door', () => {
  it('leads with Match a Preferred Provider + the real clinical team', async () => {
    await mount();
    const text = container.textContent;
    expect(text).toContain('Match a Preferred Provider');
    expect(text).toContain('Christina Poe, LCSW');
    // every clinician on the public roster is rendered
    for (const t of TLC_TEAM) expect(text, `missing ${t.name}`).toContain(t.name);
    // the provider match heading comes BEFORE the services heading (first thing)
    expect(text.indexOf('Match a Preferred Provider')).toBeLessThan(text.indexOf('All Options'));
  });

  it('offers the two real client actions — Book (Acuity) and Learn more', async () => {
    await mount();
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(TLC_BRAND.bookingUrl);
    expect(hrefs).toContain(TLC_BRAND.website);
    // all outbound links are new-tab + rel-safe (no in-app operator navigation)
    for (const a of container.querySelectorAll('a')) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel') || '').toContain('noopener');
    }
  });

  it('shows insurance accepted', async () => {
    await mount();
    expect(container.textContent).toContain('Insurance Accepted');
    expect(container.textContent).toContain('Blue Cross Blue Shield');
  });

  it('exposes NOTHING operator — no inquiry queue, Intake, Assistant, or nav', async () => {
    await mount();
    const text = container.textContent;
    for (const bad of ['Pre-Intake Inquiry', 'Big Picture', 'Dev/Ops', 'Client Growth', 'Sign in']) {
      expect(text, `operator surface leaked: "${bad}"`).not.toContain(bad);
    }
    // no in-app buttons (the door's only controls are outbound <a> links)
    expect(container.querySelectorAll('button').length).toBe(0);
  });
});
