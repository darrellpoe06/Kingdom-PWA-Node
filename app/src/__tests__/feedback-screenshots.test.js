// Locks the multi-image feedback contract (2026-06-16): a parishioner asked to
// attach more than one screenshot at a time. uploadFeedback must write the full
// set to the `screenshots` jsonb column AND keep `screenshot` = the first image
// for back-compat, degrading gracefully (screenshots[] -> screenshot -> none) so
// the feedback row always lands even if a column isn't live yet.
//
// supabase + synology-chat are mocked so this is a pure unit test (no network).
import { vi, describe, it, expect, beforeEach } from 'vitest';

let insertRows = [];
let resultQueue = [];
function nextResult() {
  return resultQueue.length ? resultQueue.shift() : { error: null };
}
function makeQuery() {
  const q = {
    insert: vi.fn((row) => { insertRows.push(row); return q; }),
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    order: vi.fn(() => q),
    then: (onF, onR) => Promise.resolve(nextResult()).then(onF, onR),
  };
  return q;
}

vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn(() => makeQuery()),
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { user: { id: 'u1', email: 'mom@example.com' } } },
      })),
    },
    rpc: vi.fn(async () => ({ data: 'instance-1', error: null })),
  },
}));
vi.mock('../lib/synology-chat.js', () => ({
  postToChat: vi.fn(),
  formatFeedbackMessage: vi.fn((x) => x),
}));

import { uploadFeedback } from '../lib/feedback-sync.js';

beforeEach(() => { insertRows = []; resultQueue = []; });

describe('uploadFeedback — multiple screenshots', () => {
  it('writes screenshot=first + screenshots=full array on a clean insert', async () => {
    const res = await uploadFeedback(
      { text: 'looks off', currentView: 'church' },
      { screenshots: ['data:a', 'data:b', 'data:c'] }
    );
    expect(res).toEqual({ uploaded: true });
    expect(insertRows).toHaveLength(1);
    expect(insertRows[0].screenshot).toBe('data:a');
    expect(insertRows[0].screenshots).toEqual(['data:a', 'data:b', 'data:c']);
  });

  it('degrades to a single screenshot if the screenshots[] column is not live', async () => {
    resultQueue = [
      { error: { code: 'PGRST204', message: "Could not find the 'screenshots' column" } },
      { error: null },
    ];
    const res = await uploadFeedback({ text: 'x' }, { screenshots: ['data:a', 'data:b'] });
    expect(res).toEqual({ uploaded: true });
    expect(insertRows).toHaveLength(2);
    expect(insertRows[0].screenshots).toEqual(['data:a', 'data:b']); // first attempt carries the array
    expect(insertRows[1].screenshots).toBeUndefined();               // retry drops the array
    expect(insertRows[1].screenshot).toBe('data:a');                 // but keeps the first image
  });

  it('falls all the way back to no image so the feedback still lands', async () => {
    resultQueue = [
      { error: { message: 'no screenshots col' } },
      { error: { message: 'no screenshot col' } },
      { error: null },
    ];
    const res = await uploadFeedback({ text: 'x' }, { screenshots: ['data:a'] });
    expect(res).toEqual({ uploaded: true });
    expect(insertRows).toHaveLength(3);
    expect(insertRows[2].screenshot).toBeUndefined();
    expect(insertRows[2].screenshots).toBeUndefined();
  });

  it('still accepts the legacy single-screenshot meta shape', async () => {
    const res = await uploadFeedback({ text: 'x' }, { screenshot: 'data:legacy' });
    expect(res).toEqual({ uploaded: true });
    expect(insertRows[0].screenshot).toBe('data:legacy');
    expect(insertRows[0].screenshots).toEqual(['data:legacy']);
  });

  it('writes no image keys when none are attached', async () => {
    const res = await uploadFeedback({ text: 'just text' }, {});
    expect(res).toEqual({ uploaded: true });
    expect(insertRows).toHaveLength(1);
    expect(insertRows[0].screenshot).toBeUndefined();
    expect(insertRows[0].screenshots).toBeUndefined();
  });
});
