// Live render proof (Verification Doctrine): mount the ACTUAL surface in jsdom.
// The component is pure (no supabase) — the plan renders from real seed data.
import { describe, it, expect } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchInfraPlan from '../components/ChurchInfraPlan.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(createElement(ChurchInfraPlan)); });
  return { container, root };
}

describe('ChurchInfraPlan — renders the real plan (no white screen)', () => {
  it('shows the header, the PLANNED 5x3090 rig, and the verified 4070s', async () => {
    const { container, root } = await mount();
    const text = container.textContent;
    expect(text).toMatch(/Church Infrastructure Plan/);
    expect(text).toMatch(/5x RTX 3090/);
    expect(text).toMatch(/planned/i);
    expect(text).toMatch(/RTX 4070/);
    await act(async () => { root.unmount(); });
  });
  it('renders the binding fairness gate as enforced (not a footnote)', async () => {
    const { container, root } = await mount();
    const text = container.textContent;
    expect(text).toMatch(/VISION-FAIRNESS-STANDARD/);
    expect(text).toMatch(/Enforced on all/i);
    await act(async () => { root.unmount(); });
  });
});
