// =============================================================================
// DiscernmentStages — live render proof (Verification Doctrine, DR-0076: observe
// the REAL surface, not just the pure logic). Mounts the ACTUAL five-stage
// renderer in jsdom with the ACTUAL published Musk issue (projected through the
// engine the app uses) and reads the DOM. Network-free — the component is pure
// presentational (no supabase, no hooks beyond useState). Proves the surface
// mounts (no white screen), shows all five stages, labels the claim, shows a
// dated source, steelmans a perspective, and carries the grace-note — i.e. the
// safeguards are VISIBLE on the surface the learner actually sees.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

import DiscernmentStages from '../components/DiscernmentStages.jsx';
import { buildDiscernmentModule } from '../lib/discernment-track.js';
import { WORLD_ISSUES } from '../lib/world-issues-class.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const muskModule = buildDiscernmentModule(WORLD_ISSUES.find((i) => i.id === 'wi-musk-creator-critique'));

function mount(issue) {
  act(() => root.render(createElement(DiscernmentStages, { issue })));
}

describe('DiscernmentStages renders the real Musk issue', () => {
  it('mounts without a white screen and shows the five-step header', () => {
    mount(muskModule.issue);
    expect(container.textContent).toContain('Think it through — the five steps');
  });

  it('shows all five stage headings', () => {
    mount(muskModule.issue);
    const txt = container.textContent;
    expect(txt).toContain('The claim');
    expect(txt).toContain('Verifiable vs interpretation');
    expect(txt).toMatch(/Perspectives/);
    expect(txt).toContain("The believer's lens");
    expect(txt).toContain('Reflection');
  });

  it('labels a claim and attributes it to the creator (never a bare verdict)', () => {
    mount(muskModule.issue);
    const txt = container.textContent;
    expect(txt).toMatch(/Allegation|Call to action|Claim|Opinion/);
    expect(txt).toMatch(/DAT BOY WILL|creator/i);
  });

  it('renders a documented fact with a dated, linked source', () => {
    mount(muskModule.issue);
    const txt = container.textContent;
    expect(txt).toContain('Documented');
    expect(txt).toMatch(/as of \d{4}-\d{2}-\d{2}/);
    const links = container.querySelectorAll('a[href][target="_blank"]');
    expect(links.length).toBeGreaterThan(0);
    // sources open safely
    expect(links[0].getAttribute('rel')).toContain('noopener');
  });

  it('separates interpretation from fact on the surface', () => {
    mount(muskModule.issue);
    expect(container.textContent).toContain('What is interpretation');
  });

  it('steelmans multiple perspectives', () => {
    mount(muskModule.issue);
    const txt = container.textContent;
    expect(txt).toMatch(/critics/i);
    expect(txt).toMatch(/defenders/i);
  });

  it('shows the believer\'s lens grace-note (no condemnation) and the transferable skill', () => {
    mount(muskModule.issue);
    const txt = container.textContent;
    expect(txt).toContain('No condemnation');
    expect(txt).toContain('The transferable skill');
  });

  it('is inert for a non-discernment module (no issue)', () => {
    mount(null);
    expect(container.textContent).toBe('');
  });
});
