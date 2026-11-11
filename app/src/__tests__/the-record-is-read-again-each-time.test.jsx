// the-record-is-read-again-each-time — the class record shows the latest
// numbers every time it is opened, says when they were read, and never blanks
// itself on a read that failed. DR-1417.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { subscribeLearnerRecords, requestLearnerRecordsRefresh, getRecordsFreshness, REFRESH_EVENT } from '../lib/learner-records-sync.js';
import RecordFreshness, { freshnessLine } from '../components/RecordFreshness.jsx';
import LearnersPanel from '../components/LearnersPanel.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ME = 'b0000000-0000-4000-a000-000000000250';
const tick = () => new Promise((r) => setTimeout(r, 0));

// A record table that can change between reads, and can be made to fail.
function fakeClient() {
  const state = { rows: [{ user_id: ME, lesson_id: 'L1' }], error: null, selects: 0 };
  const chain = {
    select: () => {
      state.selects += 1;
      return chain;
    },
    order: () => chain,
    limit: () => Promise.resolve({ data: state.error ? null : state.rows, error: state.error }),
  };
  return { state, auth: { getSession: async () => ({ data: { session: { user: { id: ME } } } }) }, from: () => chain };
}

let stop = null;
let root = null;
let host = null;
afterEach(() => {
  if (stop) stop();
  stop = null;
  if (root) act(() => root.unmount());
  if (host) host.remove();
  root = null;
  host = null;
});

describe('the record is read again on every real moment', () => {
  it('PROVEN TO CATCH: asked for again, it reads again and hands over the new rows (it used to read once)', async () => {
    const client = fakeClient();
    const seen = [];
    stop = subscribeLearnerRecords((r) => seen.push(r.map((x) => x.lessonId)), { client, minGapMs: 0 });
    await tick();
    expect(seen).toEqual([['L1']]);
    client.state.rows = [...client.state.rows, { user_id: ME, lesson_id: 'L2' }];
    requestLearnerRecordsRefresh();
    await tick();
    expect(seen[seen.length - 1]).toEqual(['L1', 'L2']);
  });
  it('reads again when the app comes back to the front, and when the network returns', async () => {
    const client = fakeClient();
    stop = subscribeLearnerRecords(() => {}, { client, minGapMs: 0 });
    await tick();
    const before = client.state.selects;
    window.dispatchEvent(new Event('focus'));
    await tick();
    window.dispatchEvent(new Event('online'));
    await tick();
    document.dispatchEvent(new Event('visibilitychange'));
    await tick();
    expect(client.state.selects).toBe(before + 3);
  });
  it('PROVEN TO CATCH: a read that fails keeps what is on the screen and says so (it used to hand over an empty record)', async () => {
    const client = fakeClient();
    const seen = [];
    stop = subscribeLearnerRecords((r) => seen.push(r.length), { client, minGapMs: 0 });
    await tick();
    const readAt = getRecordsFreshness().at;
    expect(getRecordsFreshness()).toMatchObject({ ok: true, reading: false });
    client.state.error = { message: 'network' };
    requestLearnerRecordsRefresh();
    await tick();
    expect(seen).toEqual([1]);
    expect(getRecordsFreshness()).toMatchObject({ ok: false, at: readAt });
    client.state.error = null;
    requestLearnerRecordsRefresh();
    await tick();
    expect(seen).toEqual([1, 1]);
    expect(getRecordsFreshness().ok).toBe(true);
  });
  it('a burst of asks is one read in flight and one after it, never one each', async () => {
    const client = fakeClient();
    stop = subscribeLearnerRecords(() => {}, { client, minGapMs: 0 });
    for (let i = 0; i < 10; i += 1) requestLearnerRecordsRefresh();
    await tick();
    await tick();
    expect(client.state.selects).toBeLessThanOrEqual(2);
  });
  it('asks no closer together than the gap: the second waits for it', async () => {
    vi.useFakeTimers();
    try {
      const client = fakeClient();
      stop = subscribeLearnerRecords(() => {}, { client, minGapMs: 1500 });
      await vi.advanceTimersByTimeAsync(1);
      requestLearnerRecordsRefresh();
      await vi.advanceTimersByTimeAsync(100);
      expect(client.state.selects).toBe(1);
      await vi.advanceTimersByTimeAsync(1500);
      expect(client.state.selects).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
  it('nothing is read after unsubscribe', async () => {
    const client = fakeClient();
    stop = subscribeLearnerRecords(() => {}, { client, minGapMs: 0 });
    await tick();
    stop();
    stop = null;
    const before = client.state.selects;
    requestLearnerRecordsRefresh();
    window.dispatchEvent(new Event('focus'));
    await tick();
    expect(client.state.selects).toBe(before);
  });
});

describe('the record says when it was read', () => {
  it('never draws unknown as fresh', () => {
    expect(freshnessLine({})).toBe('Reading the record now.');
    expect(freshnessLine({ at: '2026-11-10T18:24:05.000Z', ok: true })).toMatch(/^Latest figures, read from the record at /);
    expect(freshnessLine({ at: '2026-11-10T18:24:05.000Z', ok: false })).toMatch(/^Could not reach the record just now\. These are the figures read at /);
    expect(freshnessLine({ ok: false })).toBe('Could not reach the record just now.');
  });
  it('asks for the latest the moment the record appears, each time its section is opened, and on Refresh', () => {
    let asks = 0;
    const count = () => {
      asks += 1;
    };
    window.addEventListener(REFRESH_EVENT, count);
    host = document.createElement('div');
    host.innerHTML = '<details><summary>Class record</summary><div id="slot"></div></details>';
    document.body.appendChild(host);
    root = createRoot(host.querySelector('#slot'));
    act(() => root.render(createElement(RecordFreshness)));
    expect(asks).toBe(1);
    const details = host.querySelector('details');
    act(() => {
      details.open = true;
      details.dispatchEvent(new Event('toggle'));
    });
    expect(asks).toBe(2);
    act(() => {
      details.open = false;
      details.dispatchEvent(new Event('toggle'));
    });
    expect(asks).toBe(2);
    act(() => host.querySelector('[data-testid="record-refresh"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(asks).toBe(3);
    window.removeEventListener(REFRESH_EVENT, count);
  });
  it('the class record carries it, with records and with none', () => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(createElement(LearnersPanel, { records: [], currentUserId: ME })));
    expect(host.querySelector('[data-testid="record-freshness"]')).not.toBeNull();
    expect(host.querySelector('p p, p div')).toBeNull();
  });
});
