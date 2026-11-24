// A choir-sync subscriber (subscribeSermons et al.) must fail FAST to the
// honest Retry state instead of hanging forever behind a frozen/background
// tab's cross-tab auth lock -- the exact class lib/bounded-read.js already
// names ("the boot gate / Admin access+usage / PIN reads / Properties") but
// this module was never wrapped in. Root-cause reproduction for Darrell's
// wife, 2026-11-24: "Not getting the Word... historical videos" -- still
// failing after Retry, with the server/database/RLS all independently
// confirmed healthy, pointing at a stranded client-side read rather than a
// server error.
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

function makeHangingQuery() {
  // select().order() returns a thenable that NEVER settles -- the exact
  // shape of a request stuck behind a stolen/contended auth lock.
  const never = new Promise(() => {});
  return { select: vi.fn(() => ({ order: vi.fn(() => never) })) };
}

let queryFactory = makeHangingQuery;
vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(() => queryFactory()),
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'u1' } } } })) },
    channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) })),
    removeChannel: vi.fn(),
  },
}));

import { subscribeSermons } from '../lib/choir-sync.js';
import { READ_TIMEOUT_MS } from '../lib/bounded-read.js';

beforeEach(() => { vi.useFakeTimers(); queryFactory = makeHangingQuery; });
afterEach(() => { vi.useRealTimers(); });

describe('subscribeSermons: a stranded read fails fast to Retry instead of hanging forever', () => {
  it('calls onError (never onChange) once READ_TIMEOUT_MS elapses on a request that never settles', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    subscribeSermons(onChange, onError);
    // let the cold-start session resolution + the fetch kick off
    await vi.advanceTimersByTimeAsync(0);
    expect(onError).not.toHaveBeenCalled(); // not yet -- still within budget
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS + 100);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toMatchObject({ timedOut: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('a healthy query still resolves normally through the same bounded wrapper', async () => {
    queryFactory = () => ({ select: vi.fn(() => ({ order: vi.fn(() => Promise.resolve({ data: [{ id: 's1', title: 'A Message' }], error: null })) })) });
    const onChange = vi.fn();
    const onError = vi.fn();
    subscribeSermons(onChange, onError);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(10);
    expect(onError).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ id: 's1' });
  });
});
