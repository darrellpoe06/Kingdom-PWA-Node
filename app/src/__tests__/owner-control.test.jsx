// =============================================================================
// owner-control tests — "WE keep control" proven (Darrell 2026-07-23):
// the gate rides the platform role system (generalized, not a family
// hardcode), members never reach generation, and the offboarding drill
// enumerates every control with its revocation.
// =============================================================================
import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { fetchOwnerControl, OFFBOARDING_DRILL } from '../lib/owner-control.js';
import StoreSigningKey from '../components/StoreSigningKey.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
vi.mock('../lib/supabase.js', () => ({ supabase: {} }));

describe('fetchOwnerControl — the platform role system is the gate', () => {
  it('owner when list_my_admin_instances returns any instance', async () => {
    const client = { rpc: async (name) => { expect(name).toBe('list_my_admin_instances'); return { data: [{ instance_id: 'i1', role: 'owner' }] }; } };
    expect((await fetchOwnerControl(client)).state).toBe('owner');
  });
  it('not-owner on empty, error, or thrown — honest denial, never assumed', async () => {
    expect((await fetchOwnerControl({ rpc: async () => ({ data: [] }) })).state).toBe('not-owner');
    expect((await fetchOwnerControl({ rpc: async () => ({ error: { message: 'x' } }) })).state).toBe('not-owner');
    expect((await fetchOwnerControl({ rpc: async () => { throw new Error('net'); } })).state).toBe('not-owner');
  });
});

describe('OFFBOARDING_DRILL — control as a checklist', () => {
  it('every control names its risk, revocation, and where', () => {
    expect(OFFBOARDING_DRILL.length).toBeGreaterThanOrEqual(4);
    for (const d of OFFBOARDING_DRILL) {
      expect(d.control.length).toBeGreaterThan(3);
      expect(d.risk.length).toBeGreaterThan(10);
      expect(d.revocation.length).toBeGreaterThan(10);
      expect(d.where.length).toBeGreaterThan(3);
    }
  });
  it('names rotation as the revocation for key knowledge (knowledge cannot be un-known)', () => {
    const key = OFFBOARDING_DRILL.find((d) => d.control.toLowerCase().includes('signing key'));
    expect(key.revocation).toContain('ROTATE');
    expect(key.revocation).toContain('uninstall/reinstall');
  });
});

async function mount(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(createElement(StoreSigningKey, props)); });
  await act(async () => {});
  return { container, cleanup: () => { act(() => root.unmount()); container.remove(); } };
}

describe('StoreSigningKey — owner-gated generation', () => {
  it('a non-owner sees the honest gate and NO generate button', async () => {
    const { container, cleanup } = await mount({ checkOwner: async () => ({ state: 'not-owner', instances: [] }) });
    expect(container.textContent).toContain('Owner-gated');
    expect(container.textContent).not.toContain('Generate the key');
    cleanup();
  });
  it('an owner gets the generate step; the drill is visible to all', async () => {
    const { container, cleanup } = await mount({ checkOwner: async () => ({ state: 'owner', instances: [{ instance_id: 'i1' }] }) });
    expect(container.textContent).toContain('Generate the key');
    expect(container.textContent).toContain('offboarding drill');
    cleanup();
  });
});
