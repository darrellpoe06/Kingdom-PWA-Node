// =============================================================================
// subscribeSermons -- the load reports its state honestly (Darrell 2026-07-15,
// "we don't have any Word in the Word Tab"). The old subscriber bailed SILENTLY
// when getSession() returned null on a cold-start beat, so onChange never fired
// and the list sat at "No messages yet." though the session + rows were both
// there a moment later. Proven-to-catch:
//   1. session arrives late (null, then a session) -> retries, then delivers rows.
//   2. session never arrives -> onChange([]) (honest empty), never a silent hang.
//   3. a fetch error -> onError fires (so the UI can show Retry, not a false empty).
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Controllable supabase mock.
let sessionQueue;     // values returned by successive getSession() calls
let selectResult;     // { data, error } returned by the table read
const removeChannel = vi.fn();
vi.mock('../lib/supabase.js', () => ({
  default: {
    auth: { getSession: vi.fn(async () => ({ data: { session: sessionQueue.shift() ?? sessionQueue[sessionQueue.length - 1] ?? null } })) },
    from: () => ({ select: () => ({ order: async () => selectResult }) }),
    channel: () => ({ on: () => ({ subscribe: () => ({ _ch: true }) }) }),
    removeChannel,
  },
}));
vi.mock('../lib/church-instance.js', () => ({ churchInstanceId: async () => 'inst-1' }));

const { subscribeSermons } = await import('../lib/choir-sync.js');

const SESSION = { user: { id: 'u1' } };
const flush = async () => { await vi.runAllTimersAsync(); };

beforeEach(() => { vi.useFakeTimers(); selectResult = { data: [], error: null }; removeChannel.mockClear(); });
afterEach(() => { vi.useRealTimers(); });

describe('subscribeSermons — honest load state (session-retry + error surface)', () => {
  it('retries past an early null session, then delivers the rows', async () => {
    sessionQueue = [null, null, SESSION];            // null twice, then signed in
    selectResult = { data: [{ id: 's1', title: 'Msg', service_date: '2026-07-05', service_type: 'sunday', status: 'active' }], error: null };
    const onChange = vi.fn();
    const onError = vi.fn();
    subscribeSermons(onChange, onError);
    await flush();
    expect(onError).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].map((r) => r.id)).toEqual(['s1']); // rows delivered, not a false empty
  });

  it('reports an honest empty (not a silent hang) when the session never arrives', async () => {
    sessionQueue = [null];                            // null forever
    const onChange = vi.fn();
    subscribeSermons(onChange, vi.fn());
    await flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toEqual([]);    // empty, but onChange DID fire (UI leaves "loading")
  });

  it('calls onError when the table read fails (UI can show Retry, not empty)', async () => {
    sessionQueue = [SESSION];
    selectResult = { data: null, error: { message: 'network' } };
    const onChange = vi.fn();
    const onError = vi.fn();
    subscribeSermons(onChange, onError);
    await flush();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();          // no false-empty on error
  });
});
