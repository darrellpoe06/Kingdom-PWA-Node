// =============================================================================
// reactions — the reusable in-app reaction primitive (registry + ranking).
// =============================================================================
// Pins the green-lit "Images of the Godhead" palette, the single-pick model, the
// deterministic ranking (in-app is PRIMARY), and the qualitative reception signal
// (the feedback / Quality-Care pipe). PROVEN-TO-CATCH (DR-0076): every reaction is
// Scripture-anchored with REAL (KJV, public-domain) text; ranking is reproducible;
// counts are only ever what's really recorded.
import { describe, it, expect } from 'vitest';
import {
  REACTIONS, REACTION_GROUPS, REACTION_KEYS, reactionDef, isReactionKey, reactionsInGroup,
  buildReactionMap, reactionScore, sortByReactions, receptionSignal, reactionsFor,
  reactionSummary, EMPTY_REACTIONS,
} from '../lib/reactions.js';
import { REACTION_ICON_NAMES } from '../components/ReactionIcon.jsx';

describe('the Images of the Godhead registry', () => {
  it('has the plain set + all three Godhead groupings', () => {
    expect(reactionsInGroup('plain').map((r) => r.key)).toEqual(['like', 'love', 'thumbs-up', 'thumbs-down']);
    // A few anchor reactions from each group Darrell locked in.
    expect(isReactionKey('lion')).toBe(true);   // Son
    expect(isReactionKey('lamb')).toBe(true);
    expect(isReactionKey('crown')).toBe(true);
    expect(isReactionKey('dove')).toBe(true);   // Spirit
    expect(isReactionKey('fire')).toBe(true);
    expect(isReactionKey('cloud')).toBe(true);  // Father
    expect(isReactionKey('alpha-omega')).toBe(true);
    expect(REACTION_GROUPS.map((g) => g.key)).toEqual(['plain', 'son', 'spirit', 'father']);
  });

  it('anchors each Godhead reaction to a real Scripture (ref + text)', () => {
    const godhead = REACTIONS.filter((r) => r.group !== 'plain');
    for (const r of godhead) {
      expect(r.scripture, `${r.key} has scripture`).toBeTruthy();
      expect(r.scripture.ref.length).toBeGreaterThan(3);
      expect(r.scripture.text.length).toBeGreaterThan(15); // real verse text, not a stub
    }
    // Spot-check the exact anchors named in the brief.
    expect(reactionDef('lion').scripture.ref).toBe('Revelation 5:5');
    expect(reactionDef('lion').scripture.text).toContain('Lion of the tribe of Juda');
    expect(reactionDef('lamb').scripture.ref).toBe('John 1:29');
    expect(reactionDef('sun').scripture.ref).toBe('Malachi 4:2');
    expect(reactionDef('alpha-omega').scripture.text).toContain('Alpha and Omega');
  });

  it('carries a qualitative "how it landed" reading on each reaction', () => {
    expect(reactionDef('lamb').receives).toMatch(/humbled|convicted/);
    expect(reactionDef('lion').receives).toMatch(/emboldened/);
  });
});

describe('single-pick reaction map', () => {
  const counts = [
    { contentId: 'a', reactionKey: 'lion', count: 3 },
    { contentId: 'a', reactionKey: 'lamb', count: 2 },
    { contentId: 'b', reactionKey: 'crown', count: 1 },
  ];
  const mine = [{ contentId: 'a', reactionKey: 'lion' }];

  it('assembles counts + my pick per content', () => {
    const map = buildReactionMap({ counts, mine });
    expect(map.a.counts).toEqual({ lion: 3, lamb: 2 });
    expect(map.a.total).toBe(5);
    expect(map.a.myKey).toBe('lion');
    expect(map.a.top[0]).toEqual({ key: 'lion', count: 3 });
    expect(map.b.myKey).toBe(null);
  });

  it('ignores unknown reaction keys (never invents a reaction)', () => {
    const map = buildReactionMap({ counts: [{ contentId: 'x', reactionKey: 'unicorn', count: 9 }], mine: [] });
    expect(map.x).toBeUndefined();
  });
});

describe('ranking — in-app reactions are the PRIMARY signal', () => {
  const items = [
    { id: '1', contentId: 'a', serviceDate: '2026-01-01' },
    { id: '2', contentId: 'b', serviceDate: '2026-02-01' },
    { id: '3', contentId: 'c', serviceDate: '2026-03-01' }, // no reactions
  ];
  const map = buildReactionMap({
    counts: [
      { contentId: 'a', reactionKey: 'lion', count: 5 },
      { contentId: 'b', reactionKey: 'like', count: 1 },
    ],
    mine: [],
  });

  it('scores by weight and ranks most-reacted first', () => {
    expect(reactionScore({ lion: 2 })).toBe(6); // weight 3 * 2
    expect(reactionScore({})).toBe(0);
    const out = sortByReactions(items, map);
    expect(out.map((x) => x.contentId)).toEqual(['a', 'b', 'c']);
  });

  it('a no-reaction item ranks last (honest zero)', () => {
    expect(sortByReactions(items, map).at(-1).contentId).toBe('c');
  });

  it('does not mutate the input', () => {
    const before = items.map((x) => x.id);
    sortByReactions(items, map);
    expect(items.map((x) => x.id)).toEqual(before);
  });
});

describe('qualitative reception signal (the feedback pipe)', () => {
  it('folds reactions into how-it-landed, ranked, with a net tone', () => {
    const sig = receptionSignal({ lamb: 4, lion: 2, 'thumbs-down': 1 });
    expect(sig.dominant.key).toBe('lamb');
    expect(sig.dominant.receives).toMatch(/humbled|convicted/);
    expect(sig.positive).toBe(6);   // lamb + lion
    expect(sig.negative).toBe(1);   // thumbs-down
    expect(sig.net).toBe(5);
  });
  it('is empty for no reactions', () => {
    expect(receptionSignal({}).landings).toEqual([]);
    expect(receptionSignal({}).dominant).toBe(null);
  });
});

describe('surface helpers', () => {
  it('reactionsFor returns the shared empty entry for an unknown item', () => {
    expect(reactionsFor({}, 'nope')).toBe(EMPTY_REACTIONS);
  });
  it('reactionSummary lists only reactions with a real count, most first', () => {
    const map = buildReactionMap({ counts: [
      { contentId: 'a', reactionKey: 'dove', count: 1 },
      { contentId: 'a', reactionKey: 'fire', count: 4 },
    ], mine: [] });
    const sum = reactionSummary(map.a);
    expect(sum.map((s) => s.key)).toEqual(['fire', 'dove']);
    expect(sum[0].def.label).toBe('Tongues of Fire');
  });
  it('every reaction key has a matching icon name', () => {
    // Guards the ReactionBar contract: each registry entry must name an icon.
    for (const key of REACTION_KEYS) expect(reactionDef(key).icon).toBeTruthy();
  });
  it('every reaction icon is a REAL device-independent icon (no tofu, no missing glyph)', () => {
    // The whole point of ReactionIcon: never a device emoji. Each registry icon
    // must resolve to a hand-authored SVG in ReactionIcon — this fails if a
    // reaction is added without its icon.
    for (const r of REACTIONS) expect(REACTION_ICON_NAMES, `icon for ${r.key}`).toContain(r.icon);
  });
});
