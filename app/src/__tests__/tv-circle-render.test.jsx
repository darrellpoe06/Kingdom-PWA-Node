// TVCircle — proves the ENABLED sharing UI renders real (mocked) circle data, so
// the code gated behind TV_SHARING_ENABLED is not untested dormant code. We mock
// tv-circle-sync to flip the gate ON and stub the fail-soft I/O with fixtures
// (the pure bucketShares/feedForBucket stay real via importActual). The LIVE gate
// still opens only after 0074-isolation-smoke.sql passes on the NAS (DR-0076).
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/tv-circle-sync.js', async () => {
  const actual = await vi.importActual('../lib/tv-circle-sync.js');
  return {
    ...actual,
    TV_SHARING_ENABLED: true,
    myCircles: async () => [{ id: 'c1', name: 'Our Home', kind: 'household', invite_code: 'ABC234', role: 'parent' }],
    circleMembers: async () => [
      { member: 'me', role: 'parent', display: 'Dad', spouse_of: null },
      { member: 'kid', role: 'child', display: 'Kid', spouse_of: null },
    ],
    fetchCircleShares: async () => [
      { owner: 'kid', audience: 'family', doc: { shows: { x: { watched: { '1x1': true } } }, custom: { x: { title: 'Bluey' } } } },
    ],
  };
});

import TVCircle from '../components/TVCircle.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
const tick = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); });
afterEach(() => { try { act(() => root && root.unmount()); } catch { /* noop */ } container.remove(); container = null; root = null; });

async function mount(props = {}) {
  await act(async () => { root = createRoot(container); root.render(createElement(TVCircle, { state: { shows: {}, custom: {} }, catalog: {}, email: 'me', ...props })); });
  await tick(); await tick();
}

describe('TVCircle — enabled sharing surface', () => {
  it('shows the circle, its invite code, and a member-shared show in the Family view', async () => {
    await mount();
    const text = container.textContent || '';
    expect(text).toMatch(/Your circle/);
    expect(text).toMatch(/Our Home/);
    expect(text).toMatch(/ABC234/);        // the invite code to share
    expect(text).toContain('Bluey');       // the kid's family-shared show renders
    expect(text).toMatch(/What everyone/);  // the community feed
  });

  it('the Us tab shows nothing when nobody shared "us" (kids protected by design)', async () => {
    await mount();
    const usTab = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Us');
    expect(usTab).toBeTruthy();
    await act(async () => { usTab.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
    await tick();
    expect(container.textContent).toMatch(/No us shows shared here yet/);
  });
});
