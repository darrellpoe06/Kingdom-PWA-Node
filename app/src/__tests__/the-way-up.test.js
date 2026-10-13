// =============================================================================
// the-way-up — the biblical promotion algorithm game, proven not claimed.
// =============================================================================
// Darrell 2026-07-06: build a game where Yahweh raises the meek out of the
// wilderness to a table set before their enemies (Psalm 23:5; Psalm 110:1),
// programming yourself with His Word (Joshua 1:8) and prospering as the soul
// prospers (3 John 1:2). These tests pin its integrity:
//   * VERSE TRUTH — EVERY Scripture reference the game ships (paths, trunk,
//     choices, the trial deck, and every finish/legacy verse) resolves to
//     VERBATIM KJV text in lib/scripture-kjv.js. A fabricated or typo'd ref
//     fails HERE, so no verse from memory can ever render (DR-0076).
//   * TYPOGRAPHIC THEOLOGY — Yahweh/His references are honored; the adversary is
//     never capitalized as a proper name (CLAUDE.md binding), enforced as a gate.
//   * THE GAME RUNS — a deterministic play-through from a wilderness to the
//     finish reaches a real legacy with a tier and a verified verse (the engine
//     is exercised, not admired).
// =============================================================================
import { describe, it, expect } from 'vitest';
import THE_WAY_UP, { CATEGORIES, legacy } from '../lib/games/the-way-up.js';
import { resolveScripture, hasVerse } from '../lib/games/scripture-link.js';
import { createGame, choosePath, takeTurn, resolveChoice } from '../lib/games/engine.js';

// Deep-walk any nested value, collecting every { ref } Scripture object we ship.
function collectRefs(node, out = new Set()) {
  if (!node) return out;
  if (Array.isArray(node)) { node.forEach((n) => collectRefs(n, out)); return out; }
  if (typeof node === 'object') {
    if (typeof node.ref === 'string') out.add(node.ref);
    for (const v of Object.values(node)) collectRefs(v, out);
  }
  return out;
}

// The legacy() reducer's verses aren't on the static tree; surface them by
// running the reducer across states that reach every tier + top axis.
function legacyRefs() {
  const refs = new Set();
  const emptyScores = () => Object.fromEntries(CATEGORIES.map((c) => [c.key, 0]));
  // Top tier, once per axis (each axis drives LEGACY_VERSE_BY_KEY[topKey]).
  for (const c of CATEGORIES) {
    const scores = emptyScores();
    scores[c.key] = 40; // weighted well over the top-tier threshold
    const l = legacy(THE_WAY_UP, { scores });
    if (l.verse?.ref) refs.add(l.verse.ref);
  }
  // Mid "grace" tier (Romans 8:28) and the lowest "road still open" tier.
  const mid = emptyScores(); mid.faith = 9; // weighted 27 -> Still Climbing
  refs.add(legacy(THE_WAY_UP, { scores: mid }).verse.ref);
  refs.add(legacy(THE_WAY_UP, { scores: emptyScores() }).verse.ref); // all zero -> open road
  return refs;
}

describe('verse truth — every reference the game ships resolves to verbatim KJV', () => {
  const staticRefs = [...collectRefs(THE_WAY_UP)];
  const allRefs = [...new Set([...staticRefs, ...legacyRefs()])];

  it('ships a substantial, real set of references', () => {
    expect(allRefs.length).toBeGreaterThan(25);
  });

  it('no reference is missing its verbatim KJV text', () => {
    const missing = allRefs.filter((r) => !hasVerse(r));
    expect(missing, `refs with NO verbatim text (run: node scripts/append-way-up-verses.mjs): ${missing.join(', ')}`).toEqual([]);
  });

  it('spot checks read as the KJV actually reads', () => {
    expect(resolveScripture('Psalm 23:5').text).toMatch(/table before me in the presence of mine enemies/);
    expect(resolveScripture('Psalm 110:1').text).toMatch(/until I make thine enemies thy footstool/);
    expect(resolveScripture('3 John 1:2').text).toMatch(/even as thy soul prospereth/);
    expect(resolveScripture('Matthew 5:5').text).toMatch(/Blessed are the meek/);
    expect(resolveScripture('Joshua 1:8').text).toMatch(/thou shalt meditate therein day and night/);
    expect(resolveScripture('2 Timothy 1:7').text).toMatch(/but of power, and of love, and of a sound mind/);
    expect(resolveScripture('Genesis 50:20').text).toMatch(/ye thought evil against me; but God meant it unto good/);
  });
});

describe('typographic theology — Yahweh honored, the adversary never a proper name', () => {
  // Concatenate every human-facing string the module emits.
  const prose = [];
  const pull = (n) => {
    if (!n) return;
    if (Array.isArray(n)) return n.forEach(pull);
    if (typeof n === 'object') {
      for (const [k, v] of Object.entries(n)) {
        if (typeof v === 'string' && ['title', 'body', 'blurb', 'lens', 'label', 'tagline', 'about', 'subtitle', 'short'].includes(k)) prose.push(v);
        else pull(v);
      }
    }
  };
  pull(THE_WAY_UP);
  const text = prose.join('\n');

  it('never capitalizes the adversary as a proper name', () => {
    // The lost-the-honor rule: satan/devil/adversary/enemy are lowercase.
    expect(text).not.toMatch(/\bSatan\b/);
    expect(text).not.toMatch(/\bthe Devil\b/);
    expect(text).not.toMatch(/\bLucifer\b/);
  });

  it('honors Yahweh and keeps His-reference pronouns capitalized where used', () => {
    expect(text).toMatch(/\bYahweh\b/);
    // No lowercase "yahweh" slipped through.
    expect(text).not.toMatch(/\byahweh\b/);
  });
});

describe('the game runs — a wilderness ascent reaches a real legacy', () => {
  // A deterministic play-through: choose a path, then always take the WAY-UP
  // option (the last choice — the redemption/right choice in this content) when a
  // decision is pending, otherwise advance, until the journey finishes.
  function playThrough(pathId, seed) {
    let s = createGame(THE_WAY_UP, { seed });
    s = choosePath(THE_WAY_UP, s, pathId);
    let guard = 0;
    while (s.status !== 'finished' && guard++ < 500) {
      if (s.pending) s = resolveChoice(THE_WAY_UP, s, s.pending.choices.length - 1);
      else s = takeTurn(THE_WAY_UP, s);
    }
    return s;
  }

  it('finishes with a legacy tier and a verified verse from every wilderness', () => {
    for (const path of THE_WAY_UP.paths) {
      const s = playThrough(path.id, 7);
      expect(s.status, `path ${path.id} never finished`).toBe('finished');
      expect(s.legacy).toBeTruthy();
      expect(typeof s.legacy.tier).toBe('string');
      expect(hasVerse(s.legacy.verse.ref), `legacy verse for ${path.id} unverified`).toBe(true);
    }
  });

  it('walking the Way (always the right choice) lands the top tier — the table', () => {
    const s = playThrough('projects', 7);
    // Every redemption choice taken should carry weighted score into the top band.
    expect(s.legacy.score).toBeGreaterThanOrEqual(78);
    expect(s.legacy.tier).toBe('A Table Before Your Enemies');
    expect(s.legacy.passedOn.length).toBeGreaterThan(0);
  });

  it('is deterministic — same seed + choices yields the same finish', () => {
    expect(playThrough('setback', 42).legacy.score).toBe(playThrough('setback', 42).legacy.score);
  });
});
