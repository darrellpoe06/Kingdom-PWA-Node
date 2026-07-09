// Render proof (Verification Doctrine): mount the ACTUAL Talk-to-Ari surface. The
// component is pure — it renders Ari's identity, responsibilities, and the compose
// flow, and is honest that the live persistence + reply loop are not yet wired.
import { describe, it, expect } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import AriInbox from '../components/AriInbox.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(createElement(AriInbox)); });
  return { container, root };
}

describe('AriInbox — Talk to Ari renders honestly', () => {
  it('shows Ari, the honesty line, his responsibilities, and opportunities/constraints', async () => {
    const { container, root } = await mount();
    const text = container.textContent;
    expect(text).toMatch(/Talk to Ari/);
    expect(text).toMatch(/can be wrong/i);   // ARI.honesty
    expect(text).toMatch(/responsibility/i);
    expect(text).toMatch(/Opportunities/);
    expect(text).toMatch(/Constraints/);
    await act(async () => { root.unmount(); });
  });
  it('is honest that the live loop is not yet wired (no faked reply)', async () => {
    const { container, root } = await mount();
    expect(container.textContent).toMatch(/being wired|awaiting|DR-0088/i);
    await act(async () => { root.unmount(); });
  });
});
