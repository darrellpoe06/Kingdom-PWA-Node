// Live render proof for the visible durable 90-day counter (DR-0076).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import TrialStatus from '../components/TrialStatus.jsx';

const created = '2026-01-01T00:00:00.000Z';
const at = (days) => new Date(Date.parse(created) + days * 86400000).toISOString();

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(TrialStatus, props));
  });
}
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('TrialStatus — visible counter', () => {
  it('renders Day X of 90 with a progressbar mid-trial', async () => {
    await mount({ createdAt: created, nowIso: at(30) });
    expect(container.textContent).toContain('Day 31 of 90');
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).not.toBeNull();
    expect(bar.getAttribute('aria-valuenow')).toBe('31');
    expect(bar.getAttribute('aria-valuemax')).toBe('90');
  });

  it('promises no lockout in the copy', async () => {
    await mount({ createdAt: created, nowIso: at(10) });
    expect(container.textContent.toLowerCase()).toContain('never locked out');
    expect(container.textContent.toLowerCase()).toContain('full access through');
  });

  it('shows the graceful expired state', async () => {
    await mount({ createdAt: created, nowIso: at(120) });
    expect(container.textContent.toLowerCase()).toContain('free 90 days are complete');
  });

  it('renders nothing when signed-out (no createdAt) or paid', async () => {
    await mount({ createdAt: null, nowIso: at(5) });
    expect(container.textContent).toBe('');
    await act(async () => root.unmount());
    await mount({ createdAt: created, nowIso: at(5), paid: true });
    expect(container.textContent).toBe('');
  });

  it('day-83 heads-up: ending-soon shows the calm what-changes line (free tabs named)', async () => {
    await mount({ createdAt: created, nowIso: at(83) });
    const text = container.textContent || '';
    expect(text).toMatch(/Heads-up/);
    expect(text).toMatch(/What changes after/);
    expect(text).toMatch(/Markets, Books, Big Picture, Debts, and Church stay free forever/);
    expect(text).toMatch(/never locked out/);
  });

  it('a family account in the final week sees the FAMILY truth, not a false countdown', async () => {
    await mount({ createdAt: created, nowIso: at(85), familyFullAccess: true });
    const text = container.textContent || '';
    expect(text).toMatch(/Family access — full features, always/);
    expect(text).not.toMatch(/Heads-up/); // the subscriber nudge would be untrue for them
    // and an ordinary mid-trial family view keeps the normal meter (nothing to correct yet)
    await act(async () => root.unmount());
    await mount({ createdAt: created, nowIso: at(30), familyFullAccess: true });
    expect(container.textContent).toMatch(/Day 31 of 90/);
  });
});
