// ChatPane — the pane says the truth (render-level pins for the three honesty
// rules the pure core enforces; the core itself is proven in chat-bus.test.js).
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let host; let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); });
afterEach(() => { act(() => root?.unmount()); host.remove(); });
async function renderPane(props = {}) {
  const { default: ChatPane } = await import('../components/ChatPane.jsx');
  root = createRoot(host);
  await act(async () => { root.render(createElement(ChatPane, props)); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  return host;
}

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(() => {
      const chain = {
        select: () => chain, eq: () => chain, order: () => chain,
        range: async () => ({ data: [
          { id: 'r1', message: 'hello', target: 'local', status: 'queued' },
          { id: 'r2', message: 'old one', target: 'local', status: 'failed', error: 'HTTP 402' },
        ], error: null }),
        insert: async () => ({ error: null }),
      };
      return chain;
    }),
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u' } } } }) },
    channel: vi.fn(() => { const ch = { on: () => ch, subscribe: () => ch }; return ch; }),
    removeChannel: vi.fn(),
    rpc: async () => ({ data: 'inst', error: null }),
  },
}));


describe('ChatPane surface honesty', () => {
  it('renders a queued row as an HONEST pending state', async () => {
    const h = await renderPane();
    expect(h.textContent).toMatch(/Queued — the box agent/);
  });

  it('renders a failed row with the agent error verbatim, role=alert', async () => {
    const h = await renderPane();
    const alert = h.querySelector('[role="alert"]');
    expect(alert?.textContent).toBe('HTTP 402');
  });

  it('vendors with NO keys render off-with-why; local reads ready', async () => {
    const h = await renderPane();
    expect((h.textContent.match(/off — no key provisioned/g) || [])).toHaveLength(2);
    expect(h.textContent).toMatch(/Local \(sovereign\): ready/);
  });

  it('a vendor with a key present reads ready', async () => {
    const h = await renderPane({ vendorKeysPresent: { claude: true } });
    expect(h.textContent).toMatch(/Claude: ready/);
    expect((h.textContent.match(/off — no key provisioned/g) || [])).toHaveLength(1);
  });
});
