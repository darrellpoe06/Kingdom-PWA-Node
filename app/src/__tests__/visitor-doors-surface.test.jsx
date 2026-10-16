// @vitest-environment jsdom
// =============================================================================
// At the doors (DR-1070 derived it, this is where it is READ)
// =============================================================================
// DR-1070 shipped the visitor stage as a pure library and nothing rendered it.
// A number nobody can see is not a measurement, so these cases are weighted at
// the ways this SCREEN could lie rather than at the arithmetic — the library's
// own suite already pins that.
//
// The three lies a visitor surface tells most easily:
//   1. Drawing zeros when the road did not answer ("nobody came" vs "we could
//      not look"). DR-0076: unknown is never a no.
//   2. Counting our own site-health probes as visitors — the most flattering
//      lie available here, and site-health hits the site on a schedule forever.
//   3. Labelling requests as people, or splitting the bot share per door, which
//      would invent a join Cloudflare's payload does not contain.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const E = vi.hoisted(() => ({ traffic: null }));
vi.mock('../lib/edge-guard.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, getTraffic: async () => E.traffic };
});

const VisitorDoors = (await import('../components/VisitorDoors.jsx')).default;

async function render() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => { root.render(createElement(VisitorDoors)); });
  return host;
}

// A payload shaped exactly like the Edge Guard's: paths and agents as two
// independent aggregations, with no row linking an agent to a path.
const PAYLOAD = {
  ok: true,
  paths: [
    { path: '/', count: 120 },
    { path: '/lovecorner/give', count: 40 },
    { path: '/church/songs', count: 10 },
    { path: '/properties/805', count: 30 },
    { path: '/tlc', count: 5 },
    { path: '/assets/index-abc.js', count: 900 },   // plumbing, must not be a door
    { path: '/sw.js', count: 300 },                 // plumbing
  ],
  agents: [
    { agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15', count: 150 },
    { agent: 'curl/8.5.0', count: 60 },
    { agent: 'Googlebot/2.1 (+http://www.google.com/bot.html)', count: 40 },
    { agent: '', count: 10 },
  ],
};

describe('At the doors — the surface', () => {
  beforeEach(() => { document.body.innerHTML = ''; E.traffic = PAYLOAD; });

  it('draws one row per door from the edge payload, and leaves plumbing out', async () => {
    const host = await render();
    const list = host.querySelector('[data-testid="visitor-door-list"]');
    expect(list, 'the door list did not render').toBeTruthy();
    const text = list.textContent;
    for (const label of ['The Love Corner', 'Poe Properties', 'TLC Therapy Solutions', 'PoeTech']) {
      expect(text, `${label} is not on the surface`).toContain(label);
    }
    // 1200 requests of plumbing must never appear as a door, and they are said
    // separately so the reader is not left wondering where they went.
    expect(list.textContent).not.toMatch(/assets|sw\.js/);
    expect(host.textContent).toMatch(/1\.2k more requests were the app loading itself/);
  });

  it('NEVER CALLS A REQUEST A PERSON, and keeps the bot share site-wide', async () => {
    const host = await render();
    // The door rows are labelled in requests...
    expect(host.querySelector('[data-testid="visitor-door-list"]').textContent).toMatch(/requests/);
    // ...and the two limits are rendered from the library's own strings.
    expect(host.textContent).toMatch(/Counted requests, not people/);
    expect(host.textContent).toMatch(/bot share is for the whole site/);
    // The word "visitors" as a count is exactly what this surface must not say.
    expect(host.querySelector('[data-testid="visitor-door-list"]').textContent).not.toMatch(/visitors/i);
  });

  it('DOES NOT COUNT OUR OWN WITNESSES AS PEOPLE — four buckets, named', async () => {
    const host = await render();
    const mix = host.querySelector('[data-testid="visitor-mix"]');
    expect(mix, 'the mix did not render').toBeTruthy();
    expect(mix.textContent).toContain('Our own witnesses');
    expect(mix.textContent).toContain('Browsers');
    expect(mix.textContent).toContain('Crawlers, scripts, AI');
    expect(mix.textContent).toContain('Unknown');
    // curl/8.5.0 is our witness (60 of 260 = 23%), Googlebot is a crawler
    // (40 = 15%), the iPhone is a browser (150 = 58%), the empty agent is
    // unknown (10 = 4%). If a search engine were ever folded in with browsers
    // this surface would claim 73% people.
    expect(mix.textContent).toMatch(/Browsers[\s\S]*?58%/);
    expect(mix.textContent).toMatch(/Our own witnesses[\s\S]*?23%/);
    expect(mix.textContent).toMatch(/Crawlers, scripts, AI[\s\S]*?15%/);
  });

  it('AN UNANSWERED ROAD IS UNKNOWN, NOT ZERO — no bars are drawn at all', async () => {
    E.traffic = { ok: false, message: 'The Worker is not deployed on this zone.' };
    const host = await render();
    expect(host.querySelector('[data-testid="visitor-unavailable"]').textContent)
      .toContain('The Worker is not deployed on this zone.');
    expect(host.querySelector('[data-testid="visitor-door-list"]'), 'zeros were drawn for an unknown')
      .toBeNull();
    expect(host.querySelector('[data-testid="visitor-mix"]')).toBeNull();
  });

  it('a genuine zero says it is the edge’s answer, not an empty table of ours', async () => {
    E.traffic = { ok: true, paths: [], agents: [] };
    const host = await render();
    expect(host.textContent).toMatch(/No requests reached a door in the last 24 hours/);
    expect(host.textContent).toMatch(/the edge’s own answer, not an empty table of ours/);
  });

  it('says on the screen that nothing is collected, and the chip is wired in', async () => {
    const host = await render();
    expect(host.textContent).toMatch(/No tracker, no cookie, no beacon/);
    // The surface is reachable: the chip exists in the third row of tabs, and
    // the component is imported rather than written and orphaned — which is
    // precisely how DR-1070's library sat unread.
    const panel = read('app/src/components/AccessUsageMetrics.jsx');
    expect(panel).toMatch(/import VisitorDoors from '\.\/VisitorDoors\.jsx'/);
    expect(panel).toMatch(/id: 'doors'/);
    expect(panel).toMatch(/label: 'At the doors'/);
    expect(panel).toMatch(/render: \(\) => <VisitorDoors \/>/);
  });

  it('the component reads the edge and writes nothing', async () => {
    const code = read('app/src/components/VisitorDoors.jsx');
    expect(code).not.toMatch(/\.insert\(|\.upsert\(|localStorage|sessionStorage/);
    expect(code, 'a tracker on the one surface about visitors would be the whole joke')
      .not.toMatch(/gtag|dataLayer|fbq|plausible\(|posthog/);
  });
});
