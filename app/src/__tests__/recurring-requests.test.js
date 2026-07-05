// recurring-requests — the "already-requested / already-said" tally (Darrell 2026-07-05).
// Proven-to-catch: the same ask five ways collapses to ONE row with count=5;
// a decided request is flagged alreadyDecided; count+decided ⇒ `known` (the
// Tier-A-upgrade candidate).
import { describe, it, expect } from 'vitest';
import {
  normalizeSignature, isRequest, tallyRequests, crossReferenceDecided, buildRecurringReport,
} from '../lib/recurring-requests.js';

describe('normalizeSignature — meaning words, order-independent', () => {
  it('collapses phrasings of the same ask to one key', () => {
    expect(normalizeSignature('Can you add dark mode?')).toBe(normalizeSignature('please add a dark mode'));
    expect(normalizeSignature('dark mode')).toBe('dark mode');
  });
  it('is empty for filler-only text', () => {
    expect(normalizeSignature('can you please add it')).toBe('');
  });
});

describe('isRequest — asks vs everything else', () => {
  it('detects requests by category or keywords', () => {
    expect(isRequest({ category: 'feature-request', text: 'x' })).toBe(true);
    expect(isRequest({ text: 'I would like a dark mode' })).toBe(true);
    expect(isRequest({ categories: ['idea'], whatsMissing: 'dark mode' })).toBe(true);
  });
  it('ignores praise / bugs with no ask', () => {
    expect(isRequest({ category: 'praise', text: 'love it' })).toBe(false);
  });
});

describe('tallyRequests — how many times, how many ways, who', () => {
  // category:'feature-request' so isRequest is deterministic; texts chosen so
  // the meaning-words ("dark mode toggle") give one shared signature.
  const R = (text, displayName, createdAt, extra = {}) => ({ text, category: 'feature-request', displayName, createdAt, ...extra });
  const items = [
    R('add dark mode toggle', 'Christina', '2026-07-01'),
    R('please, dark mode toggle!', 'Darrell', '2026-07-03'),
    R('the dark mode toggle', 'Christina', '2026-07-02'),
    R('dark mode toggle', 'Anonymous', '2026-07-04', { isAnonymous: true }),
    R('budget export button', 'Darrell', '2026-07-01'),
  ];
  const rows = tallyRequests(items);
  it('groups the same ask across phrasings', () => {
    const dark = rows.find((r) => r.signature.includes('dark'));
    expect(dark.count).toBe(4);          // asked four times
    expect(dark.ways).toBe(4);           // four distinct phrasings
    expect(dark.submitterCount).toBe(2); // Christina + Darrell (Anonymous excluded from names)
    expect(dark.submitters.sort()).toEqual(['Christina', 'Darrell']);
  });
  it('ranks the most-requested first', () => {
    expect(rows[0].signature).toContain('dark');
  });
  it('picks a shortest phrasing as the label', () => {
    const dark = rows.find((r) => r.signature.includes('dark'));
    expect(dark.label.length).toBeLessThanOrEqual('add dark mode toggle'.length);
    expect(dark.label.toLowerCase()).toContain('dark mode toggle');
  });
});

describe('crossReferenceDecided + buildRecurringReport — the `known` flag', () => {
  const items = [
    { text: 'add dark mode toggle', category: 'feature-request', displayName: 'A', createdAt: '2026-07-01' },
    { text: 'please dark mode toggle', category: 'feature-request', displayName: 'B', createdAt: '2026-07-02' },
    { text: 'the dark mode toggle', category: 'feature-request', displayName: 'C', createdAt: '2026-07-03' },
  ];
  it('flags a request that matches a decided directive', () => {
    const rows = crossReferenceDecided(tallyRequests(items), ['Dark mode toggle across the app']);
    expect(rows[0].alreadyDecided).toBe('Dark mode toggle across the app');
  });
  it('known = asked >= min times AND already decided', () => {
    const report = buildRecurringReport(items, { decidedTitles: ['Ship a dark mode toggle'], knownMinTimes: 3 });
    expect(report.totalAsks).toBe(3);
    expect(report.known.length).toBe(1);
    expect(report.known[0].known).toBe(true);
  });
  it('NOT known when decided but under the min-times bar', () => {
    const report = buildRecurringReport(items.slice(0, 1), { decidedTitles: ['Ship a dark mode toggle'], knownMinTimes: 3 });
    expect(report.known.length).toBe(0);
  });
  it('NOT known when repeated but never decided', () => {
    const report = buildRecurringReport(items, { decidedTitles: [], knownMinTimes: 3 });
    expect(report.known.length).toBe(0);
  });
});
