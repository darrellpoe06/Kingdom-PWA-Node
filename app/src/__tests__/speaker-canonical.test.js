// @vitest-environment node
//
// Speaker canonicalization (migration 0037 + pulpit-prep). The bug Darrell
// surfaced: ONE man, Bishop Lloyd E. Gwin, fragmented into NINE "Preachers &
// Teachers" rows because the speaker was free text and the roster grouped by the
// raw string. These pin the collapse to ONE entity and prove the normalization
// actually catches the fragmentation (DR-0076 — verifiable, not "looks fixed").
import { describe, it, expect } from 'vitest';
import { speakerKey, speakerRoster } from '../lib/pulpit-prep.js';

// The nine real variants from the live roster screenshot, with their counts.
// (The 0013 seed has the same nine forms; the live DB grew via the importer.)
const VARIANTS = [
  ['Bishop Lloyd E. Gwin', 89],
  ['Bishop Lloyd Gwin', 25],
  ['Bishop Gwin', 5],
  ['Bishop Lloyd E Gwin', 3],
  ['BISHOP LLOYD GWIN', 3],
  ['Bishop Lloyd E. Gwin ', 2], // trailing space — the invisible duplicate of #1
  ['Bishop Lloyd E.Gwin', 2],
  ['Bishop E. Gwin', 1],
  ['Bishop Lloyd E .Gwin', 1],
];
const TOTAL = VARIANTS.reduce((n, [, c]) => n + c, 0); // 131

// speaker_norm() in 0037 is lower + strip non-[a-z0-9]; speakerKey is its mirror.
// Pure case/space/punctuation variants share a key; genuinely different name-
// forms do not — those are tied by the canonical's alias set (mirrored here).
const CANONICAL_KEY = speakerKey('Bishop Lloyd E. Gwin');     // 'bishoplloydegwin'
const ALIAS_KEYS = ['Bishop Lloyd Gwin', 'Bishop Gwin', 'Bishop E. Gwin'].map(speakerKey);
const resolvesToBG = (name) => {
  const k = speakerKey(name);
  return k === CANONICAL_KEY || ALIAS_KEYS.includes(k);
};

describe('speakerKey — the client mirror of SQL speaker_norm()', () => {
  it('collapses case, spacing, and punctuation to one key', () => {
    expect(speakerKey('Bishop Lloyd E. Gwin')).toBe('bishoplloydegwin');
    expect(speakerKey('BISHOP  LLOYD   E.GWIN')).toBe('bishoplloydegwin');
    expect(speakerKey('Bishop Lloyd E .Gwin')).toBe('bishoplloydegwin');
    expect(speakerKey('Bishop Lloyd E. Gwin ')).toBe('bishoplloydegwin'); // trailing space gone
  });
  it('keeps genuinely different name-forms as different keys (aliases tie them, not guessing)', () => {
    expect(speakerKey('Bishop Lloyd Gwin')).not.toBe(CANONICAL_KEY); // no middle "E"
    expect(speakerKey('Bishop Gwin')).not.toBe(CANONICAL_KEY);
    expect(new Set(VARIANTS.map(([n]) => speakerKey(n))).size).toBe(4); // 9 spellings -> 4 keys
  });
});

describe('canonical resolution — all nine variants are the same man', () => {
  it('every variant resolves to Bishop Lloyd E. Gwin (canonical key OR an alias)', () => {
    for (const [name] of VARIANTS) expect(resolvesToBG(name)).toBe(true);
  });
});

describe('do NOT over-collapse — a guest preacher stays their own person', () => {
  it('a guest never resolves to BG (only the nine true-BG forms do)', () => {
    expect(resolvesToBG('Sister Jasmine Johnson')).toBe(false);
    expect(resolvesToBG('AP Harden')).toBe(false);
    expect(resolvesToBG('Pastor Gwin')).toBe(false);   // a DIFFERENT Gwin would not match
    expect(resolvesToBG('Minister Smith')).toBe(false);
  });
  it('roster keeps the guest distinct from BG, each with their own count', () => {
    const rows = [
      { status: 'active', speaker: 'Bishop Lloyd E. Gwin', speakerId: 'bg', speakerIsPrimary: true },
      { status: 'active', speaker: 'Bishop Gwin', speakerId: 'bg', speakerIsPrimary: true }, // same entity (alias)
      { status: 'active', speaker: 'Sister Jasmine Johnson', speakerId: 'jj' },              // a real guest
    ];
    const roster = speakerRoster(rows);
    expect(roster).toHaveLength(2);
    const bg = roster.find((r) => r.isBG);
    const guest = roster.find((r) => !r.isBG);
    expect(bg.count).toBe(2);                                  // both BG spellings, one person
    expect(guest.name).toBe('Sister Jasmine Johnson');
    expect(guest.count).toBe(1);                               // guest credit preserved, NOT absorbed
  });
});

describe('speakerRoster — the nine collapse to ONE, count reconciles', () => {
  it('groups by the canonical entity id: one row, count = the sum (proves the fix)', () => {
    // Post-0037 every Gwin row carries the same speaker_id + canonical text.
    const rows = VARIANTS.flatMap(([, count]) =>
      Array.from({ length: count }, () => ({
        status: 'active', speaker: 'Bishop Lloyd E. Gwin', speakerId: 'bg-entity', speakerIsPrimary: true,
      })));
    const roster = speakerRoster(rows);
    expect(roster).toHaveLength(1);
    expect(roster[0].name).toBe('Bishop Lloyd E. Gwin');
    expect(roster[0].count).toBe(TOTAL); // 131 — one entry, not nine
    expect(roster[0].isBG).toBe(true);   // primary from real entity data
  });

  it('PROVEN-TO-CATCH: free-text rows with no entity still collapse via the normalized key', () => {
    // Even without speaker_id (the public-RPC path), the SAME letters group as
    // one. The genuinely-different name-forms remain separate — exactly why the
    // DB needs the alias set; here they are the expected 4 distinct keys.
    const rows = VARIANTS.flatMap(([name, count]) =>
      Array.from({ length: count }, () => ({ status: 'active', speaker: name })));
    const roster = speakerRoster(rows);
    expect(roster.length).toBe(4); // collapses 9 raw spellings to 4 (case/space/punct gone)
    expect(roster.reduce((n, r) => n + r.count, 0)).toBe(TOTAL); // no message lost
    // The dominant key carries every case/space/punct variant of the full name.
    const top = roster[0];
    expect(speakerKey(top.name)).toBe(CANONICAL_KEY);
    expect(top.count).toBe(89 + 3 + 2 + 2 + 1); // 97
    expect(top.isBG).toBe(true); // /gwin/i fallback on the public path
  });

  it('REGRESSION SENTINEL: if speakerKey stopped stripping punctuation, the count would fragment', () => {
    // A broken normalizer (identity) reproduces the original bug — 9 rows. This
    // asserts the real speakerKey does NOT behave that way.
    const broken = VARIANTS.map(([n]) => n); // raw, untouched
    expect(new Set(broken).size).toBe(9);                                   // the bug
    expect(new Set(VARIANTS.map(([n]) => speakerKey(n))).size).toBeLessThan(9); // the fix
  });
});
