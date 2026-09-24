// =============================================================================
// The loop closes into Decision Intelligence (DR-0622): the intake's state
// feeds the operations readouts, and a sender's reply re-enters as a decision
// a person makes. Proven to catch and proven quiet.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { deriveOperations, REPEAT_OBSERVATIONS } from '../lib/operations-intelligence.js';
import { STALL_DAYS } from '../lib/decision-intelligence.js';
import OperationsIntelligence from '../components/OperationsIntelligence.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const NOW = Date.parse('2026-09-24T20:00:00Z');
const daysAgo = (d) => new Date(NOW - d * 86400000).toISOString();
const ops = (feedback) => deriveOperations({ feedback, nowMs: NOW });

describe('intake in the operations readouts', () => {
  it('reads the counts per category into the board', () => {
    const r = ops([
      { id: 'a', createdAt: daysAgo(0), text: 'Not working: typo on the bus page title' },
      { id: 'b', createdAt: daysAgo(0), text: '[Learn engagement] band=adult signal=started' },
      { id: 'c', createdAt: daysAgo(0), text: 'Rated: love' },
    ]);
    expect(r.read.intake).toMatchObject({ fix: 1, signal: 1, thanks: 1, work: 0 });
    expect(r.sources).toContain('intake (every note, categorized)');
  });
  it('an unread intake is left out, never a zero', () => {
    expect(ops(null).read.intake).toBeUndefined();
  });
  it('PROVEN TO CATCH: a sender’s untouched reply is a decision required', () => {
    const r = ops([{ id: 'r', createdAt: daysAgo(0), replyTo: 'x', text: 'Not working: that answer does not fit my case' }]);
    expect(r.decisionsRequired[0]).toMatchObject({ id: 'reply-r' });
    expect(ops([{ id: 'r', createdAt: daysAgo(0), replyTo: 'x', triageStatus: 'in-progress', text: 'Not working: that answer does not fit my case' }]).decisionsRequired).toHaveLength(0);
  });
  it(`PROVEN TO CATCH: real work untouched ${STALL_DAYS}+ days is one escalation, counted`, () => {
    const note = (id, d) => ({ id, createdAt: daysAgo(d), text: 'Not working: my transactions disappeared after reload' });
    const r = ops([note('a', STALL_DAYS + 3), note('b', STALL_DAYS), note('c', 1)]);
    const e = r.escalations.find((x) => x.id === 'intake-stale-work');
    expect(e).toMatchObject({ title: '2 notes of real work untouched', days: STALL_DAYS + 3 });
    expect(ops([note('c', 1)]).escalations.find((x) => x.id === 'intake-stale-work')).toBeUndefined();
  });
  it(`PROVEN TO CATCH: ${REPEAT_OBSERVATIONS}+ failed system fixes are a risk`, () => {
    const failed = (id) => ({ id, createdAt: daysAgo(0), text: 'Not working: typo on the bus page title', intakeBasis: { kind: 'fix-failed' } });
    expect(ops(Array.from({ length: REPEAT_OBSERVATIONS }, (_, i) => failed(`f${i}`))).risks.find((x) => x.key === 'intake-fix-failures')).toBeTruthy();
    expect(ops([failed('f0')]).risks.find((x) => x.key === 'intake-fix-failures')).toBeUndefined();
  });
});

describe('the board shows it', () => {
  let container; let root;
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  it('renders the intake line from the notes it is given', async () => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    await act(async () => {
      root.render(createElement(OperationsIntelligence, {
        feedback: [{ id: 'a', createdAt: daysAgo(0), text: 'Not working: typo on the bus page title' }],
        ledger: { ok: false, items: [] }, nowMs: NOW, deps: { fetchSiteHealth: async () => ({ ok: false, notice: 'test' }) },
      }));
    });
    expect(container.querySelector('[data-testid="ops-intake"]').textContent).toMatch(/1 low-hanging \(the system fixes\)/);
  });
});
