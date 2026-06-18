// Church "Give" surface — link safety + scripture integrity (DR-0076).
// Proven-to-catch: the Give button must NEVER point at an invented URL (it only
// ever echoes the church's OWN configured destination); the "confirmed" flag
// must honestly distinguish a dedicated giving deep-link from a bare site root;
// and the benefits-according-to-the-Word content must carry the doctrinal
// bright line against prosperity gospel (worship/stewardship, not promised yield)
// plus the six anchor scriptures with real ESV text.
import { describe, it, expect } from 'vitest';
import { resolveGiveDestination, GIVING_SCRIPTURES, GIVING_DOCTRINE } from '../lib/giving.js';

describe('resolveGiveDestination — link safety (never invent a URL)', () => {
  it('echoes ONLY the church-provided giving link, verbatim', () => {
    const d = resolveGiveDestination({ links: { give: 'https://example.org/give' }, site: 'https://example.org' });
    expect(d.url).toBe('https://example.org/give');
  });

  it('falls back to the site root when no give link, never to a guess', () => {
    const d = resolveGiveDestination({ site: 'https://thechurchofthelivinggod.com' });
    expect(d.url).toBe('https://thechurchofthelivinggod.com');
  });

  it('returns a null url (flagged state) when the church carries no link at all', () => {
    const d = resolveGiveDestination({});
    expect(d.url).toBeNull();
    expect(d.confirmed).toBe(false);
    expect(d.note).toMatch(/not been provided/i);
  });

  it('marks a bare site root as NOT a confirmed deep-link (honest)', () => {
    const d = resolveGiveDestination({ site: 'https://thechurchofthelivinggod.com', links: { give: 'https://thechurchofthelivinggod.com' } });
    expect(d.confirmed).toBe(false);
    expect(d.note).toMatch(/website/i);
  });

  it('marks a real giving deep-link / known giving host as confirmed', () => {
    expect(resolveGiveDestination({ links: { give: 'https://www.givelify.com/donate/colg' } }).confirmed).toBe(true);
    expect(resolveGiveDestination({ site: 'https://x.org', links: { give: 'https://x.org/giving' } }).confirmed).toBe(true);
  });

  it('never collects payment data — every note says so', () => {
    const d = resolveGiveDestination({ site: 'https://x.org' });
    expect(d.note).toMatch(/no payment information/i);
  });
});

describe('benefits according to the Word — content integrity', () => {
  it('holds the bright line against prosperity gospel', () => {
    expect(GIVING_DOCTRINE.brightLine).toMatch(/not a transaction with a promised return/i);
    expect(GIVING_DOCTRINE.brightLine).toMatch(/prosperity/i);
    expect(GIVING_DOCTRINE.tithe).toMatch(/10%/);
  });

  it('carries the six anchor scriptures, all ESV, with text + benefit', () => {
    const refs = GIVING_SCRIPTURES.map((s) => s.ref);
    for (const r of ['Malachi 3:10', '2 Corinthians 9:6-8', 'Luke 6:38', 'Proverbs 11:25', 'Proverbs 3:9-10', 'Acts 20:35']) {
      expect(refs).toContain(r);
    }
    for (const s of GIVING_SCRIPTURES) {
      expect(s.translation).toBe('ESV');
      expect(s.text.length).toBeGreaterThan(10);
      expect(s.benefit.length).toBeGreaterThan(10);
    }
  });

  it('renders the OT divine name as "LORD" (ESV + typographic rule)', () => {
    const mal = GIVING_SCRIPTURES.find((s) => s.ref === 'Malachi 3:10');
    const pro = GIVING_SCRIPTURES.find((s) => s.ref === 'Proverbs 3:9-10');
    expect(mal.text).toMatch(/\bLORD\b/);
    expect(pro.text).toMatch(/Honor the LORD/);
  });
});
