// sme-weighting — who knows which tab; prioritize their feedback (Darrell 2026-07-05).
// Proven-to-catch: attributed engagement builds SME standing; anonymous never does;
// an SME's note on their own tab is prioritized above a non-SME's.
import { describe, it, expect } from 'vitest';
import {
  attributedName, computeTabExperts, expertRankFor, smeSignal, prioritizeBySme,
} from '../lib/sme-weighting.js';

const fb = (o) => ({ createdAt: '2026-07-01T00:00:00Z', ...o });

describe('attributedName — only credited submitters count', () => {
  it('returns the name for a credited submitter', () => {
    expect(attributedName(fb({ displayName: 'Christina' }))).toBe('Christina');
  });
  it('returns null for anonymous / confidential / scrubbed', () => {
    expect(attributedName(fb({ displayName: 'Christina', isAnonymous: true }))).toBe(null);
    expect(attributedName(fb({ displayName: 'Christina', isConfidential: true }))).toBe(null);
    expect(attributedName(fb({ display_name: 'Anonymous' }))).toBe(null);
    expect(attributedName(fb({}))).toBe(null);
  });
});

describe('computeTabExperts — ranks who engages each tab', () => {
  const items = [
    fb({ displayName: 'Christina', which_tab: 'practice' }),
    fb({ displayName: 'Christina', which_tab: 'practice' }),
    fb({ displayName: 'Darrell', which_tab: 'practice' }),
    fb({ displayName: 'Darrell', which_tab: 'books' }),
    fb({ displayName: 'Anonymous', which_tab: 'practice' }),      // ignored
    fb({ displayName: 'Naomi', which_tab: 'practice', isAnonymous: true }), // ignored
  ];
  const experts = computeTabExperts(items);
  it('ranks the most-engaged attributed submitter first', () => {
    expect(experts.practice.map((e) => e.name)).toEqual(['Christina', 'Darrell']);
    expect(experts.practice[0].count).toBe(2);
  });
  it('excludes anonymous/confidential submitters from expert standing', () => {
    expect(experts.practice.find((e) => e.name === 'Anonymous')).toBeUndefined();
    expect(experts.practice.find((e) => e.name === 'Naomi')).toBeUndefined();
  });
  it('keeps tabs separate', () => {
    expect(expertRankFor('Darrell', 'books', experts)).toBe(0);
    expect(expertRankFor('Darrell', 'practice', experts)).toBe(1);
    expect(expertRankFor('Nobody', 'practice', experts)).toBe(null);
  });
});

describe('smeSignal + prioritizeBySme — the expert’s issue rises', () => {
  const items = [
    fb({ displayName: 'Christina', which_tab: 'practice' }),
    fb({ displayName: 'Christina', which_tab: 'practice' }),
  ];
  const experts = computeTabExperts(items);
  it('weights the top expert of a tab highest', () => {
    const sig = smeSignal(fb({ displayName: 'Christina', which_tab: 'practice' }), experts);
    expect(sig).toMatchObject({ isSME: true, tabRank: 0, weight: 3 });
  });
  it('gives no weight to a non-expert / anonymous submitter', () => {
    expect(smeSignal(fb({ displayName: 'Stranger', which_tab: 'practice' }), experts).weight).toBe(0);
    expect(smeSignal(fb({ isAnonymous: true, which_tab: 'practice' }), experts).weight).toBe(0);
  });
  it('sorts an SME note on their own tab above a non-SME note (same severity)', () => {
    const inbox = [
      fb({ id: 'x', displayName: 'Stranger', which_tab: 'practice', text: 'minor thing' }),
      fb({ id: 'y', displayName: 'Christina', which_tab: 'practice', text: 'the thing SMEs hit' }),
    ];
    const sorted = prioritizeBySme(inbox, experts, () => ({ priorityRank: 2 }));
    expect(sorted[0].id).toBe('y');
    expect(sorted[0].sme).toMatchObject({ isSME: true });
  });
  it('does not mutate the input array', () => {
    const inbox = [fb({ id: 'a', displayName: 'Christina', which_tab: 'practice' })];
    const copy = JSON.parse(JSON.stringify(inbox));
    prioritizeBySme(inbox, experts);
    expect(inbox).toEqual(copy);
  });
});
