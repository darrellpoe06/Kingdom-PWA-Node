// ClientDiscovery — the review gate renders and previews a REAL extraction:
// the paste → preview path drives parseDiscoveryJson through the surface the
// steward actually uses (DR-0061 pt.3), garbage is named, honest empty state.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: null } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

import ClientDiscovery from '../components/ClientDiscovery.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

const setTextarea = async (el, value) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(el, value);
  await act(async () => { el.dispatchEvent(new window.Event('input', { bubbles: true })); });
};
const click = async (label) => {
  const btn = [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes(label));
  if (!btn) throw new Error(`button not found: ${label}`);
  await act(async () => { btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });
};

describe('ClientDiscovery surface', () => {
  it('renders the gate with an honest empty queue', async () => {
    await act(async () => { root.render(createElement(ClientDiscovery)); });
    const text = container.textContent || '';
    expect(text).toContain('the review gate');
    expect(text).toContain('Nothing awaiting review');
    expect(text).toContain('extracted (0)');
  });

  it('previews a pasted extraction with real counts and the unclear flags', async () => {
    await act(async () => { root.render(createElement(ClientDiscovery)); });
    const ta = container.querySelector('textarea[aria-label="Extraction JSON"]');
    await setTextarea(ta, JSON.stringify({
      client: { name: 'Jo', business: 'QC Cakes' },
      requirements: [{ area: 'orders', requirement: 'Track custom cake orders', confidence: 'high', source_quote: 'I lose track' }],
      pricing: [{ item: 'Base cake', amount_text: '$40', source_quote: 'forty' }],
      policies: [], pain_points: [], channels: [], unclear: ['delivery radius'],
    }));
    await click('Preview');
    const text = container.textContent || '';
    expect(text).toContain('QC Cakes');
    expect(text).toContain('1 requirements');
    expect(text).toContain('1 pricing');
    expect(text).toContain('delivery radius');
    expect(text).toContain('Save 2 items for review');
  });

  it('names garbage instead of pretending', async () => {
    await act(async () => { root.render(createElement(ClientDiscovery)); });
    const ta = container.querySelector('textarea[aria-label="Extraction JSON"]');
    await setTextarea(ta, 'not json at all');
    await click('Preview');
    expect(container.textContent).toContain('Not valid extraction JSON');
  });
});
