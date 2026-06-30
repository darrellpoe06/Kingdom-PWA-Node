// AdoptPoeTech — live render proof (Verification Doctrine: validate by USING the
// surface, not by reading the code). Mounts the real component in jsdom and proves
// it shows the offering, the journey, the trust promises, and a per-type starter
// preview that switches when a type button is clicked.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import AdoptPoeTech from '../components/AdoptPoeTech.jsx';

let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(AdoptPoeTech));
  });
}
const button = (re) => [...document.body.querySelectorAll('button')].find((b) => re.test(b.textContent));
async function click(el) { await act(async () => { el.click(); }); }

beforeEach(async () => { await mount(); });
afterEach(async () => { await act(async () => { root.unmount(); }); container.remove(); });

describe('AdoptPoeTech surface', () => {
  it('renders the offering headline and the three adopter types', () => {
    const text = document.body.textContent;
    expect(text).toContain('Adopt PoeTech');
    expect(text).toContain('A family');
    expect(text).toContain('A church');
    expect(text).toContain('A small business');
  });

  it('shows the trust promises including the Cage-bounded AI', () => {
    expect(document.body.textContent.toLowerCase()).toContain('kill-switch');
  });

  it('shows the guided journey starting with creating a profile', () => {
    expect(document.body.textContent).toContain('Create your profile');
    expect(document.body.textContent).toContain('Add your people');
  });

  it('previews the family starter by default and switches to the business starter on click', async () => {
    // Family is the default pick — its members include Caleb.
    expect(document.body.textContent).toContain('Caleb');
    const bizBtn = button(/A small business/);
    expect(bizBtn).toBeTruthy();
    await click(bizBtn);
    expect(document.body.textContent).toContain('Trailhead Goods');
  });

  it('surfaces the honest "still being decided" flags', () => {
    expect(document.body.textContent).toContain('Still being decided');
  });
});
