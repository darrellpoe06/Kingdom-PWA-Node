import { describe, it, expect } from 'vitest';
import { assembleBook } from '../lib/book-engine.js';
import {
  flywheel, marketingAssetFor, evaluatePublishGate, publishRequirements,
  buildPublishHandoff, businessLens, SKILL_LADDER,
} from '../lib/book-flywheel.js';

const resolver = (ref) => (ref === 'John 3:16' ? { text: 'For God so loved', version: 'KJV', ref } : null);
const book = assembleBook({
  title: 'A Book', businesses: ['church', 'poetech'],
  sources: [{ id: 's', kind: 'lesson', title: 'C1', blocks: [{ kind: 'text', text: 'body' }, { kind: 'scripture', ref: 'John 3:16' }] }],
  scriptureResolver: resolver, nowIso: '2026-06-25T00:00:00Z',
});

describe('flywheel — all four loops', () => {
  const f = flywheel(book, { nowIso: '2026-06-25T00:00:00Z' });
  it('wires interaction, marketing, learning, community', () => {
    expect(f.interaction.loop).toBe('interaction');
    expect(f.marketing.loop).toBe('marketing');
    expect(f.learning.loop).toBe('learning');
    expect(f.community.loop).toBe('community');
  });
  it('interaction pulls readers into the live app (deep links + reader route)', () => {
    expect(f.interaction.companion.readerRoute.view).toBe('library');
    expect(f.interaction.hooks.some((h) => h.kind === 'deep-links')).toBe(true);
  });
  it('marketing produces an asset per business', () => {
    expect(f.marketing.assets).toHaveLength(2);
    expect(f.marketing.assets.map((a) => a.business)).toEqual(['church', 'poetech']);
  });
  it('learning is reciprocal (book<->course)', () => {
    expect(f.learning.bookToCourse.suggestedModules.length).toBe(1);
    expect(f.learning.courseToBook.sources).toContain('lesson');
  });
  it('community feeds development AND builds skills (read->teach ladder)', () => {
    expect(f.community.developmentSignal.feedbackTag).toContain('A Book');
    expect(f.community.skillLadder).toBe(SKILL_LADDER);
    expect(SKILL_LADDER.map((r) => r.rung)).toEqual(['read', 'reflect', 'contribute', 'teach']);
  });
});

describe('marketingAssetFor', () => {
  it('uses the per-business lens + opt-in capture', () => {
    const a = marketingAssetFor(book, 'tlc', { nowIso: 'x' });
    expect(a.business).toBe('tlc');
    expect(a.hook).toBe(businessLens('tlc').promise);
    expect(a.leadMagnet.consentRequired).toBe(true);
    expect(a.leadMagnet.landingDeepLink.view).toBe('library');
  });
});

describe('approve-to-publish gate (default-deny)', () => {
  it('denies an integrity-passing book until a human approves', () => {
    const g = evaluatePublishGate(book, {});
    expect(book.integrity.ok).toBe(true);
    expect(g.allowed).toBe(false);
    expect(g.reasons.join(' ')).toContain('approve');
  });
  it('allows once approved', () => {
    const g = evaluatePublishGate(book, { approval: { approvedBy: 'darrell', approvedIso: '2026-06-25' } });
    expect(g.allowed).toBe(true);
  });
  it('NEVER allows a book that fails integrity, even if approved', () => {
    const bad = assembleBook({ title: 'Bad', sources: [{ id: 'b', kind: 'lesson', title: 'C', blocks: [{ kind: 'scripture', ref: 'Nowhere 9:9' }] }], scriptureResolver: resolver });
    const g = evaluatePublishGate(bad, { approval: { approvedBy: 'darrell' } });
    expect(bad.integrity.ok).toBe(false);
    expect(g.allowed).toBe(false);
  });
  it('publish requirements read the integrity report', () => {
    const reqs = publishRequirements(book);
    expect(reqs.find((r) => r.id === 'integrity').met).toBe(true);
  });
  it('hand-off stages, never auto-dispatches (gateAllowed false, dispatchState staged)', () => {
    const h = buildPublishHandoff(book, { persona: 'darrell', channel: 'public', nowIso: 'x' });
    expect(h.kind).toBe('handoff');
    expect(h.meta.lane).toBe('publish');
    expect(h.meta.gateAllowed).toBe(false);
    expect(h.meta.dispatchState).toBe('staged');
  });
});
