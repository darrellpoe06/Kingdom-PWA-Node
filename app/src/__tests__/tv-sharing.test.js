// tv-sharing — the PURE privacy model for TV Time family/circle sharing (Darrell
// 2026-07-04). These tests LOCK the safety properties before any DB/UI exists:
// a private show can never appear in shared data; kids never see 'us'; a parent
// has oversight; nobody reads across circles. The JS visibility rule mirrors the
// SQL RLS so the two walls can be checked against each other (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  AUDIENCES, AUDIENCE_KEYS, shareFlags, isPrivate, sharedAudiences, withShare,
  publishDocFor, canReadShare, normalizeRole, communityFeed,
} from '../lib/tv-sharing.js';
import { normalize } from '../lib/tv-time.js';

describe('the audience model', () => {
  it('has exactly us / family / circle, private = no flags', () => {
    expect(AUDIENCE_KEYS).toEqual(['us', 'family', 'circle']);
    expect(AUDIENCES.every((a) => a.label && a.hint)).toBe(true);
  });
  it('a fresh show is private', () => {
    expect(isPrivate({ status: 'watching' })).toBe(true);
    expect(shareFlags({})).toEqual({ us: false, family: false, circle: false });
    expect(sharedAudiences({})).toEqual([]);
  });
});

describe('withShare — immutable, conditional share key', () => {
  it('turns an audience on and lists it', () => {
    const e = withShare({ status: 'watching' }, 'family', true);
    expect(e.share).toEqual({ family: true });
    expect(sharedAudiences(e)).toEqual(['family']);
    expect(isPrivate(e)).toBe(false);
  });
  it('turning the last audience off returns to a private shape (no share key)', () => {
    const on = withShare({ status: 'watching' }, 'circle', true);
    const off = withShare(on, 'circle', false);
    expect('share' in off).toBe(false);
    expect(isPrivate(off)).toBe(true);
  });
  it('audiences are independent — circle on, family off (hide from kids)', () => {
    let e = withShare({ status: 'watching' }, 'circle', true);
    e = withShare(e, 'us', true);
    expect(shareFlags(e)).toEqual({ us: true, family: false, circle: true });
  });
  it('ignores an unknown audience', () => {
    expect(withShare({ status: 'x' }, 'public', true)).toEqual({ status: 'x' });
  });
  it('survives the store normalize() round-trip with flags intact', () => {
    const e = withShare({ status: 'watching', rating: 0, comments: [], watched: {} }, 'family', true);
    const norm = normalize({ shows: { '42': e } });
    expect(norm.shows['42'].share).toEqual({ family: true });
    // a private show keeps the original shape (no share key) — equality preserved
    const plain = normalize({ shows: { '7': { status: 'want' } } });
    expect('share' in plain.shows['7']).toBe(false);
  });
});

describe('publishDocFor — THE SAFETY ROOT: private shows never leave', () => {
  const state = {
    shows: {
      priv: { status: 'watching', watched: { '1x1': true } },              // private
      fam: { status: 'watching', watched: {}, share: { family: true } },   // kids ok
      us: { status: 'watching', watched: {}, share: { us: true } },        // couple
      circ: { status: 'watching', watched: {}, share: { circle: true } },  // friends
      mixed: { status: 'watching', watched: {}, share: { circle: true, us: true } }, // NOT family
    },
    custom: { fam: { id: 'fam', title: 'Bluey', kind: 'show' } },
  };
  it('a private show appears in NO audience doc', () => {
    for (const a of AUDIENCE_KEYS) {
      expect(Object.keys(publishDocFor(state, a).shows), `${a} must not carry a private show`).not.toContain('priv');
    }
  });
  it('the family doc excludes a mature (circle+us, not family) show — kids protected', () => {
    const fam = publishDocFor(state, 'family');
    expect(Object.keys(fam.shows)).toEqual(['fam']);
    expect(Object.keys(fam.shows)).not.toContain('mixed');
    expect(Object.keys(fam.shows)).not.toContain('us');
  });
  it('each audience doc contains exactly its flagged shows', () => {
    expect(Object.keys(publishDocFor(state, 'us').shows).sort()).toEqual(['mixed', 'us']);
    expect(Object.keys(publishDocFor(state, 'circle').shows).sort()).toEqual(['circ', 'mixed']);
  });
  it('carries display metadata (custom or catalog) for the reader', () => {
    const fam = publishDocFor(state, 'family');
    expect(fam.custom.fam.title).toBe('Bluey');
    const circ = publishDocFor(state, 'circle', { circ: { id: 'circ', title: 'Snowfall' } });
    expect(circ.custom.circ.title).toBe('Snowfall');
  });
  it('never leaks watched/comments beyond status+watched+rating', () => {
    const doc = publishDocFor(state, 'family');
    expect(Object.keys(doc.shows.fam).sort()).toEqual(['rating', 'status', 'watched']);
  });
});

describe('canReadShare — the JS mirror of the SQL RLS', () => {
  it('never reads across circles', () => {
    for (const a of AUDIENCE_KEYS) {
      expect(canReadShare(a, { inCircle: false, role: 'parent', isSpouse: true })).toBe(false);
    }
  });
  it('a child sees family + circle, but NEVER us', () => {
    expect(canReadShare('family', { inCircle: true, role: 'child' })).toBe(true);
    expect(canReadShare('circle', { inCircle: true, role: 'child' })).toBe(true);
    expect(canReadShare('us', { inCircle: true, role: 'child', isSpouse: true })).toBe(false);
  });
  it('a spouse (adult) sees us; a non-spouse adult does not', () => {
    expect(canReadShare('us', { inCircle: true, role: 'adult', isSpouse: true })).toBe(true);
    expect(canReadShare('us', { inCircle: true, role: 'adult', isSpouse: false })).toBe(false);
  });
  it('a parent has oversight — reads any audience in the household', () => {
    for (const a of AUDIENCE_KEYS) {
      expect(canReadShare(a, { inCircle: true, role: 'parent', isSpouse: false })).toBe(true);
    }
  });
  it('an unknown audience is never readable', () => {
    expect(canReadShare('public', { inCircle: true, role: 'parent' })).toBe(false);
  });
  it('normalizeRole falls back to adult, never child by accident', () => {
    expect(normalizeRole('PARENT ')).toBe('parent');
    expect(normalizeRole('garbage')).toBe('adult');
    expect(normalizeRole(null)).toBe('adult');
  });
});

describe('communityFeed — what everyone is watching', () => {
  it('counts watchers per title, most-watched first', () => {
    const members = [
      { name: 'Darrell', doc: { shows: { a: {}, b: {} }, custom: { a: { title: 'Snowfall' }, b: { title: 'Power' } } } },
      { name: 'Christina', doc: { shows: { a: {} }, custom: { a: { title: 'Snowfall' } } } },
    ];
    const feed = communityFeed(members);
    expect(feed[0]).toMatchObject({ title: 'Snowfall', count: 2 });
    expect(feed[0].watchers.sort()).toEqual(['Christina', 'Darrell']);
    expect(feed.find((f) => f.title === 'Power').count).toBe(1);
  });
  it('is empty-safe', () => {
    expect(communityFeed()).toEqual([]);
    expect(communityFeed([])).toEqual([]);
  });
});
