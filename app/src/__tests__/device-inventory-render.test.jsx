// =============================================================================
// DeviceInventory — live render proof (Verification Doctrine: observe the real
// surface). Mounts the ACTUAL component in jsdom. supabase is mocked (no
// session), so getDeviceAccess returns signed-out and the surface renders the
// KNOWN-infrastructure seed baseline — no cloud call. Proves: the register
// mounts (no white screen), shows the real named hardware, surfaces the honest
// SME-needed flags, and the Compute Pool tab shows the scheduler INERT.
// =============================================================================
import { describe, it, expect, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/supabase.js', () => {
  const query = {
    select: () => query,
    order: () => Promise.resolve({ data: [], error: null }),
    eq: () => query,
    then: (res) => Promise.resolve({ data: [], error: null }).then(res),
  };
  const supabase = {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
    from: () => query,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
  return { default: supabase, supabase };
});

import DeviceInventory from '../components/DeviceInventory.jsx';

async function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(createElement(DeviceInventory)); });
  await act(async () => { await Promise.resolve(); }); // flush access effect
  return { container, root };
}

describe('DeviceInventory — the register renders (no white screen)', () => {
  it('shows the header and the real named hardware from the seed', async () => {
    const { container, root } = await mount();
    const text = container.textContent;
    expect(text).toMatch(/Device Inventory/);
    expect(text).toMatch(/DS1621xs/);          // the NAS
    expect(text).toMatch(/VX1000/);            // the NovaStar processor
    expect(text).toMatch(/Video Wall|video-wall|sanctuary-video-wall/i);
    await act(async () => { root.unmount(); });
  });

  it('surfaces honest SME-needed flags rather than fabricating specs', async () => {
    const { container, root } = await mount();
    expect(container.textContent).toMatch(/confirmation|Unverified/i);
    await act(async () => { root.unmount(); });
  });

  it('the Compute Pool tab shows the scheduler INERT (not armed)', async () => {
    const { container, root } = await mount();
    const btns = Array.from(container.querySelectorAll('button'));
    const computeBtn = btns.find((b) => /Compute Pool/i.test(b.textContent));
    expect(computeBtn).toBeTruthy();
    await act(async () => { computeBtn.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true })); });
    const text = container.textContent;
    expect(text).toMatch(/Inert/i);
    expect(text).toMatch(/KILL_SWITCH|not ARMED|budget unset/i);
    await act(async () => { root.unmount(); });
  });
});
