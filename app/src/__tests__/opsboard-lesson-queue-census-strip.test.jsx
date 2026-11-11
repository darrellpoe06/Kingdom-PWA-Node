// =============================================================================
// The lesson-queue strip on the OpsBoard: step 7 of the Way (DR-1414)
// =============================================================================
// THE-WAY-A-SERVICE-COMES-HOME says a loop is a service too, and keeps step 7:
// "it shows in the app... never a painted status". The census loop was built,
// gated and witnessed with its reader importing nowhere -- written by the NAS
// and read by no screen -- which is the gap reading that Way surfaced. This
// gates the surface.
//
// The one property worth a test of its own: AN UNCOUNTED QUEUE MUST NEVER
// RENDER AS AN EMPTY ONE (DR-1186). That is the exact failure
// inbox-lessons-waiting.yml was rewritten to stop making, and on a strip it is
// the easiest thing in the world to get wrong, because `total ?? 0` reads so
// naturally. A reader who sees "0 waiting" when nobody could count stops
// looking, and the queue -- 35 rows deep on 2026-11-10 -- goes unbuilt.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { QueueCensusStrip } from '../components/OpsBoard.jsx';
import { EXPECTED_EXCLUDES, CENSUS_TAG } from '../lib/lesson-queue-census.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const AT = new Date(Date.now() - 5 * 60 * 1000).toISOString();
const body = (over = {}) =>
  JSON.stringify({
    at: AT,
    host: 'poetech',
    total: 6,
    by_road: { 'thinking-space': 2, 'research-inbox': 4 },
    by_shape: { plain: 2, 'build-failed': 4 },
    oldest_waiting: '2026-09-29T17:59:56Z',
    excludes: [...EXPECTED_EXCLUDES],
    ...over,
  });
const row = (over = {}) => ({ id: 'r1', body: body(over), tags: [CENSUS_TAG], created_at: AT });

let container;
let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const mount = (census) => act(() => root.render(React.createElement(QueueCensusStrip, { census })));
const text = () => container.textContent || '';

describe('the lesson queue shows in the app, as the NAS counted it', () => {
  it('names the number, the oldest wait and that no runner stood between', () => {
    mount({ row: row(), reason: '' });
    expect(container.querySelector('[data-testid="lesson-queue-census"]')).toBeTruthy();
    expect(text()).toMatch(/6 lesson row\(s\) waiting/);
    expect(text()).toMatch(/oldest waiting \d+ days/);
    expect(text()).toMatch(/no tailnet, runner or key between the count and this line/);
  });

  it('breaks the count down by shape, so a reader sees what KIND of work waits', () => {
    mount({ row: row(), reason: '' });
    const roads = container.querySelector('[data-testid="lesson-queue-census-roads"]');
    expect(roads).toBeTruthy();
    expect(roads.textContent).toMatch(/4 build-failed/);
  });
});

describe('an uncounted queue is never an empty queue (DR-1186)', () => {
  it('PROVEN TO CATCH: no census row says NEVER COUNTED and shows no zero', () => {
    mount({ row: null, reason: '' });
    expect(text()).toMatch(/never counted/i);
    // The whole point: not a zero, not "none", not "empty" anywhere on the strip.
    expect(text()).not.toMatch(/\b0 lesson row/);
    expect(text()).not.toMatch(/nothing is waiting/i);
    // And it says plainly that the two are different things.
    expect(text()).toMatch(/not the same as nothing waiting/i);
    // No shape breakdown is drawn for a count that does not exist.
    expect(container.querySelector('[data-testid="lesson-queue-census-roads"]')).toBeNull();
  });

  it('a table that could not be read says WHY, and claims no number', () => {
    mount({ row: null, reason: 'permission denied' });
    expect(text()).toMatch(/unreadable: permission denied/);
    expect(text()).not.toMatch(/\b0 lesson row/);
  });

  it('a genuinely empty queue reads DIFFERENTLY from an uncounted one', () => {
    mount({ row: row({ total: 0, by_road: {}, by_shape: {}, oldest_waiting: null }), reason: '' });
    const empty = text();
    expect(empty).toMatch(/0 lesson row\(s\) waiting/);
    expect(empty).not.toMatch(/never counted/i);
    // A real zero draws no shape row either, but for the opposite reason.
    expect(container.querySelector('[data-testid="lesson-queue-census-roads"]')).toBeNull();
  });

  it('nothing at all renders nothing, rather than an invented state', () => {
    mount(null);
    expect(container.querySelector('[data-testid="lesson-queue-census"]')).toBeNull();
  });
});

describe('a count that asked a different question is never shown bare (DR-0725)', () => {
  it('PROVEN TO CATCH: the 2026-11-10 abbreviated list is named on the strip', () => {
    const shortened = EXPECTED_EXCLUDES.filter((t) => t !== 'not-a-lesson' && t !== 'withdrawn');
    mount({ row: row({ excludes: shortened }), reason: '' });
    const drift = container.querySelector('[data-testid="lesson-queue-census-drift"]');
    expect(drift).toBeTruthy();
    expect(drift.textContent).toMatch(/did not exclude not-a-lesson, withdrawn/);
    // The number still shows -- but never alone.
    expect(text()).toMatch(/6 lesson row\(s\) waiting/);
  });

  it('a matching definition draws no drift line at all', () => {
    mount({ row: row(), reason: '' });
    expect(container.querySelector('[data-testid="lesson-queue-census-drift"]')).toBeNull();
  });
});

describe('a stale count is not presented as current', () => {
  it('says how long ago it was counted and marks it a problem', () => {
    const old = new Date(Date.now() - 3 * 86400000).toISOString();
    mount({ row: row({ at: old }), reason: '' });
    expect(text()).toMatch(/stale: last counted 3 days ago/);
  });
});
