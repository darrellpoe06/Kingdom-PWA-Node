// Autonomous fruit-loop batch 2 (DR-0057 additive-test class). The last
// cleanly-pure exports the scout flagged: ensureLinks (link-array normalizer)
// and the nas-photos bridge-token reads. After this, the remaining untested
// exports are network-bound (Supabase/fetch) or React components — they need
// mocking/render infrastructure, which is a deliberate decision, not the
// clean additive class. So this is the autonomous run's terminal batch.
import { describe, it, expect, beforeEach } from 'vitest';
import { ensureLinks } from '../poe-financial-mvp-v28.jsx';
import { bridgeToken, hasBridgeToken, CHAT_BRIDGE_TOKEN_KEY } from '../lib/nas-photos.js';

describe('ensureLinks', () => {
  it('passes null/undefined straight through', () => {
    expect(ensureLinks(null)).toBe(null);
    expect(ensureLinks(undefined)).toBe(undefined);
  });
  it('leaves an item that already has a links array untouched', () => {
    const item = { id: 'x', links: [{ to: 'y' }] };
    expect(ensureLinks(item)).toBe(item);
  });
  it('adds an empty links array when absent, without mutating the input', () => {
    const item = { id: 'x' };
    const out = ensureLinks(item);
    expect(out).not.toBe(item);
    expect(out.links).toEqual([]);
    expect(out.id).toBe('x');
    expect(item.links).toBeUndefined();
  });
});

describe('nas-photos bridge token reads', () => {
  beforeEach(() => { try { localStorage.removeItem(CHAT_BRIDGE_TOKEN_KEY); } catch (_) { /* noop */ } });

  it('empty + hasBridgeToken false when no token is stored', () => {
    expect(bridgeToken()).toBe('');
    expect(hasBridgeToken()).toBe(false);
  });
  it('reads and trims a stored token', () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, '  tok-123  ');
    expect(bridgeToken()).toBe('tok-123');
    expect(hasBridgeToken()).toBe(true);
  });
});
