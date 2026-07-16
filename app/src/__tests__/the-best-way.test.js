// Verification harness for the Best Way framework (DR-0076). Every anchor must be
// KJV VERBATIM (reconstructed from app/public/bible/kjv), and every domain must
// carry all four tiers in order with real anchors. Proven-to-catch: mistype a
// verse or drop a tier and this fails.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  BEST_WAY_DOMAINS, BEST_WAY_FRAME, BEST_WAY_TIERS, BEST_WAY_TIER_LABEL,
  listDomains, getDomain, tiersInOrder, allBestWayAnchors,
} from '../lib/the-best-way.js';

const BOOK_FILE = (book) => (book === 'Psalm' ? 'Psalms' : book).replace(/\s+/g, '');
function kjv(ref) {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) throw new Error(`unparseable ref: ${ref}`);
  const [, book, chap, a, b] = m;
  const data = JSON.parse(readFileSync(`public/bible/kjv/${BOOK_FILE(book)}.json`, 'utf8'));
  const verses = data.chapters[Number(chap) - 1];
  return verses.slice(Number(a) - 1, b ? Number(b) : Number(a)).join(' ');
}

describe('the-best-way — every anchor is KJV verbatim (DR-0076)', () => {
  for (const a of allBestWayAnchors()) {
    it(`${a.ref} matches the KJV text exactly`, () => {
      expect(a.text).toBe(kjv(a.ref));
    });
  }
});

describe('the-best-way — every domain carries all four tiers, in order, with anchors', () => {
  it('the four tiers are preferred -> accepted -> natural -> against', () => {
    expect(BEST_WAY_TIERS).toEqual(['preferred', 'accepted', 'natural', 'against']);
    for (const t of BEST_WAY_TIERS) expect(BEST_WAY_TIER_LABEL[t]).toBeTruthy();
  });
  it('each domain has all four tiers, each with a summary and >=1 anchor', () => {
    expect(BEST_WAY_DOMAINS.length).toBeGreaterThanOrEqual(5);
    for (const d of BEST_WAY_DOMAINS) {
      expect(d.id && d.title && d.question, `${d.id}: id/title/question`).toBeTruthy();
      for (const key of BEST_WAY_TIERS) {
        const tier = d.tiers[key];
        expect(tier, `${d.id}.${key} exists`).toBeTruthy();
        expect(typeof tier.summary === 'string' && tier.summary.length > 15, `${d.id}.${key}: summary`).toBe(true);
        expect(Array.isArray(tier.anchors) && tier.anchors.length >= 1, `${d.id}.${key}: anchors`).toBe(true);
      }
    }
  });
  it('domain ids are unique', () => {
    const ids = BEST_WAY_DOMAINS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('the-best-way — helpers', () => {
  it('tiersInOrder returns the four tiers best -> worst with labels', () => {
    const ordered = tiersInOrder(getDomain('marriage'));
    expect(ordered.map((t) => t.key)).toEqual(['preferred', 'accepted', 'natural', 'against']);
    expect(ordered[0].label).toMatch(/Preferred/);
    expect(ordered[0].anchors.length).toBeGreaterThan(0);
  });
  it('tiersInOrder is safe on junk', () => {
    expect(tiersInOrder(null)).toEqual([]);
    expect(tiersInOrder({})).toEqual([]);
  });
  it('getDomain resolves and misses', () => {
    expect(getDomain('marriage').title).toMatch(/Marriage/);
    expect(getDomain('nope')).toBe(null);
  });
  it('listDomains returns a copy, not the frozen source', () => {
    const a = listDomains();
    expect(a).not.toBe(BEST_WAY_DOMAINS);
    expect(a.length).toBe(BEST_WAY_DOMAINS.length);
  });
  it('the frame carries Romans 12:2 (good/acceptable/perfect) and Matthew 19:8', () => {
    const refs = BEST_WAY_FRAME.map((a) => a.ref);
    expect(refs).toContain('Romans 12:2');
    expect(refs).toContain('Matthew 19:8');
  });
});
