// =============================================================================
// The harvest ledger never hangs on "Loading…" (Christina's phone, 2026-10-15,
// while the /sb road was dark on #2057): after LEDGER_WAIT_MS it says the
// church's records did not answer and offers a retry (DR-0076: a loading line
// that cannot end is a claim of progress nobody measured).
// =============================================================================
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const access = vi.fn();
const subscribe = vi.fn();
vi.mock('../lib/supabase.js', () => ({ onAuthChange: () => () => {}, supabase: {} }));
vi.mock('../lib/choir-sync.js', () => ({ getChoirAccess: (...a) => access(...a) }));
vi.mock('../lib/harvest-ledger.js', () => ({ subscribeLedger: (...a) => subscribe(...a), recordHarvest: vi.fn(), markHarvestNotApplicable: vi.fn() }));
vi.mock('../lib/ops-commands.js', () => ({ OPS_JOBS: [], queueCommand: vi.fn(), cancelCommand: vi.fn(), subscribeOpsCommands: () => () => {}, runnerHint: () => '' }));
vi.mock('../lib/corpus-coverage.js', () => ({ corpusCoverage: () => ({ known: false }) }));

const { default: HarvestLedger, LEDGER_WAIT_MS } = await import('../components/HarvestLedger.jsx');

let container; let root;
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  vi.useRealTimers();
  access.mockReset(); subscribe.mockReset();
});
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(HarvestLedger)); });
}

describe('the harvest ledger says when the road is dark', () => {
  it('after the wait, a road that never answers becomes an honest message with a retry, and the retry asks again', async () => {
    vi.useFakeTimers();
    access.mockImplementation(() => new Promise(() => {})); // the /sb road never answers
    await mount();
    expect(container.textContent).toMatch(/Loading the harvest ledger/);
    expect(container.querySelector('[data-testid="harvest-ledger-stalled"]')).toBeNull();
    await act(async () => { vi.advanceTimersByTime(LEDGER_WAIT_MS - 1); });
    expect(container.querySelector('[data-testid="harvest-ledger-stalled"]')).toBeNull();
    await act(async () => { vi.advanceTimersByTime(1); });
    const stalled = container.querySelector('[data-testid="harvest-ledger-stalled"]');
    expect(stalled).toBeTruthy();
    expect(stalled.textContent).toMatch(/could not be opened/);
    expect(stalled.textContent).toMatch(/did not answer within 15 seconds/);
    expect(access).toHaveBeenCalledTimes(1);
    await act(async () => { stalled.querySelector('button').click(); });
    expect(access).toHaveBeenCalledTimes(2);
    expect(container.textContent).toMatch(/Loading the harvest ledger/);
  });

  it('a road that answers in time never shows the message, and the timer is cleared', async () => {
    vi.useFakeTimers();
    access.mockResolvedValue({ signedIn: true, canSee: false, canEdit: false, tenantId: null, role: null });
    await mount();
    await act(async () => { await Promise.resolve(); });
    expect(container.textContent).toMatch(/for the choir \/ church team/);
    await act(async () => { vi.advanceTimersByTime(LEDGER_WAIT_MS + 1); });
    expect(container.querySelector('[data-testid="harvest-ledger-stalled"]')).toBeNull();
    expect(container.textContent).toMatch(/for the choir \/ church team/);
  });

  it('the wait is the same one the member record gives', async () => {
    const { RPC_TIMEOUT_MS } = await import('../lib/church-member-sync.js');
    expect(LEDGER_WAIT_MS).toBe(RPC_TIMEOUT_MS);
  });
});
