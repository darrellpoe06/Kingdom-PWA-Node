// @vitest-environment node
//
// finance-activity — the budget picture must be driven by REAL financial documents
// arriving (Darrell 2026-06-16: "based on WHEN a financial document comes in from
// her emails ... chase etc"), never painted. These prove: the latest document sets
// the "as of", the source is recovered from the sender, in/out totals only count
// the recent window, an empty stream is an honest null (not a fake zero-date), and
// latestFinancialDocMs drives loop freshness off real arrival.
import { describe, it, expect } from 'vitest';
import { summarizeFinancialActivity, latestFinancialDocMs, institutionFromSender, toMs } from '../lib/finance-activity.js';

const NOW = Date.parse('2026-06-16T00:00:00Z');
const ago = (days) => new Date(NOW - days * 86400000).toISOString();

describe('institutionFromSender', () => {
  it('maps known finance senders to friendly names', () => {
    expect(institutionFromSender('alerts@chase.com')).toBe('Chase');
    expect(institutionFromSender('no-reply@bankofamerica.com')).toBe('Bank of America');
    expect(institutionFromSender('x@americanexpress.com')).toBe('American Express');
  });
  it('falls back to the bare domain for an unknown sender (never drops it)', () => {
    expect(institutionFromSender('billing@somecreditunion.com')).toBe('somecreditunion');
  });
});

describe('summarizeFinancialActivity', () => {
  it('an empty stream is an HONEST null, not a painted zero-date', () => {
    const s = summarizeFinancialActivity({ gmail_events: [], transactions: [] }, NOW);
    expect(s.lastDocAt).toBe(null);
    expect(s.count).toBe(0);
    expect(s.recentIn).toBe(0);
  });

  it('the latest document sets the "as of" date and source', () => {
    const s = summarizeFinancialActivity({
      gmail_events: [
        { internal_date: ago(5), amount: 1200, direction: 'out', from: 'alerts@chase.com', subject: 'Payment' },
        { internal_date: ago(1), amount: 50, direction: 'in', from: 'service@wellsfargo.com', subject: 'Deposit' },
      ],
    }, NOW);
    expect(s.lastDocAgoDays).toBe(1);
    expect(s.lastSource).toBe('Wells Fargo');
    expect(s.count).toBe(2);
  });

  it('totals only count the recent window', () => {
    const s = summarizeFinancialActivity({
      gmail_events: [
        { internal_date: ago(2), amount: 300, direction: 'in', from: 'a@chase.com' },
        { internal_date: ago(10), amount: 100, direction: 'out', from: 'a@chase.com' },
        { internal_date: ago(90), amount: 9999, direction: 'out', from: 'a@chase.com' }, // outside 30d window
      ],
    }, NOW, 30);
    expect(s.recentIn).toBe(300);
    expect(s.recentOut).toBe(100); // the 90-day-old 9999 is excluded
  });

  it('merges bank transactions with email events; infers direction from sign', () => {
    const s = summarizeFinancialActivity({
      gmail_events: [{ internal_date: ago(3), amount: 40, direction: 'in', from: 'a@chase.com' }],
      transactions: [{ date: ago(1), amount: -75, institution: 'Chase', description: 'Card' }],
    }, NOW);
    expect(s.count).toBe(2);
    expect(s.recentOut).toBe(75); // negative bank amount => out
    expect(s.recentIn).toBe(40);
  });
});

describe('latestFinancialDocMs — drives loop freshness off real arrival', () => {
  it('returns the newest document timestamp, or null when nothing has arrived', () => {
    expect(latestFinancialDocMs({ gmail_events: [] })).toBe(null);
    const ms = latestFinancialDocMs({ gmail_events: [{ internal_date: ago(4) }, { internal_date: ago(1) }] });
    expect(ms).toBe(toMs(ago(1)));
  });
});
