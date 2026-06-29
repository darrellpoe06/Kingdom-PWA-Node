// =============================================================================
// generations-game.test.js — content integrity for "Generations: Walking in the
// Way", incl. the binding rule that EVERY Scripture reference resolves to real,
// verified KJV text (no verse typed from memory; DR-0076 Verification Doctrine).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { GENERATIONS } from '../lib/games/generations.js';
import { hasVerse, resolveScripture } from '../lib/games/scripture-link.js';
import {
  createGame, choosePath, takeTurn, resolveChoice,
} from '../lib/games/engine.js';

// Collect every { ref } carried anywhere in the game (paths, spaces, choices,
// deck cards, the legacy verses) so the guard is exhaustive.
function collectRefs(def) {
  const refs = [];
  const eat = (s) => { if (s && s.ref) refs.push(s.ref); };
  for (const p of def.paths) {
    eat(p.scripture);
    for (const sp of p.opening) { eat(sp.scripture); (sp.choices || []).forEach((c) => eat(c.scripture)); }
  }
  for (const sp of def.trunk) { eat(sp.scripture); (sp.choices || []).forEach((c) => eat(c.scripture)); }
  for (const deck of Object.values(def.decks)) {
    for (const card of deck) { eat(card.scripture); (card.choices || []).forEach((c) => eat(c.scripture)); }
  }
  // legacy verses (drive the reducer across score profiles)
  for (const profile of [{}, { faith: 99 }, { provision: 99 }, { joy: 99 }]) {
    const v = def.legacy(def, { scores: { ...profile } }).verse;
    eat(v);
  }
  return [...new Set(refs)];
}

describe('Scripture integrity — every ref is real, verified KJV text', () => {
  const refs = collectRefs(GENERATIONS);
  it('the game cites at least a dozen distinct verses', () => {
    expect(refs.length).toBeGreaterThanOrEqual(12);
  });
  it.each(refs)('"%s" resolves to verbatim KJV text', (ref) => {
    expect(hasVerse(ref)).toBe(true);
    const r = resolveScripture({ ref });
    expect(r.text).toBeTruthy();
    expect(r.translation).toBe('KJV');
  });
});

describe('Typography theology (CLAUDE.md binding rules) in authored content', () => {
  // Scan only the game's own authored strings (titles/bodies/lenses/labels),
  // not quoted KJV text (which lives in scripture-kjv.js, unmodified).
  function authoredStrings(def) {
    const out = [];
    const eat = (o) => { if (!o) return; for (const k of ['label', 'blurb', 'title', 'body', 'lens', 'tagline', 'about', 'headline', 'note']) if (typeof o[k] === 'string') out.push(o[k]); };
    eat(def);
    for (const p of def.paths) { eat(p); p.opening.forEach((sp) => { eat(sp); (sp.choices || []).forEach(eat); }); }
    def.trunk.forEach((sp) => { eat(sp); (sp.choices || []).forEach(eat); });
    for (const deck of Object.values(def.decks)) deck.forEach((card) => { eat(card); (card.choices || []).forEach(eat); });
    // legacy authored prose
    for (const profile of [{ faith: 99 }, { provision: 99 }, {}]) {
      const l = def.legacy(def, { scores: { ...profile } });
      eat(l);
    }
    return out;
  }
  const strings = authoredStrings(GENERATIONS);

  it('never lowercases the divine name Yahweh', () => {
    for (const s of strings) expect(s).not.toMatch(/\byahweh\b/);
  });
  it('never capitalizes the adversary as a proper name', () => {
    for (const s of strings) {
      expect(s).not.toMatch(/\bSatan\b/);
      expect(s).not.toMatch(/\bThe Devil\b/);
      expect(s).not.toMatch(/\bLucifer\b/);
    }
  });
});

describe('Game definition is well-formed', () => {
  it('has the eight Yahweh-perspective categories with weights', () => {
    const keys = GENERATIONS.categories.map((c) => c.key);
    expect(keys).toEqual(['faith', 'family', 'souls', 'wisdom', 'service', 'peace', 'joy', 'provision']);
    for (const c of GENERATIONS.categories) expect(typeof c.weight).toBe('number');
  });
  it('weights the Kingdom axes above provision', () => {
    const w = Object.fromEntries(GENERATIONS.categories.map((c) => [c.key, c.weight]));
    expect(w.faith).toBeGreaterThan(w.provision);
    expect(w.family).toBeGreaterThan(w.provision);
    expect(w.souls).toBeGreaterThan(w.provision);
  });
  it('offers four real starting paths, each with a non-empty opening', () => {
    expect(GENERATIONS.paths).toHaveLength(4);
    for (const p of GENERATIONS.paths) {
      expect(p.opening.length).toBeGreaterThan(0);
      expect(p.scripture).toBeTruthy();
    }
  });
  it('every choice everywhere carries an effects map', () => {
    const checkChoices = (arr) => (arr || []).forEach((c) => {
      expect(c.label).toBeTruthy();
      expect(c.effects && typeof c.effects === 'object').toBe(true);
    });
    GENERATIONS.trunk.forEach((sp) => checkChoices(sp.choices));
    GENERATIONS.paths.forEach((p) => p.opening.forEach((sp) => checkChoices(sp.choices)));
    Object.values(GENERATIONS.decks).forEach((deck) => deck.forEach((card) => checkChoices(card.choices)));
  });
  it('includes the explicit redemption / second-chance mechanic', () => {
    const hasRedemption = GENERATIONS.trunk.some((sp) => (sp.choices || []).some((c) => c.redemption));
    expect(hasRedemption).toBe(true);
    // The Crossroads of Return is the named grace space.
    expect(GENERATIONS.trunk.find((sp) => sp.id === 'return')).toBeTruthy();
  });
  it("weaves in the Father's business", () => {
    const fb = GENERATIONS.trunk.find((sp) => sp.id === 'fathersbusiness');
    expect(fb).toBeTruthy();
    expect(fb.scripture.ref).toBe('Luke 2:49');
  });
});

describe('A full play-through reaches a legacy finish', () => {
  function play(seed, pick) {
    let g = choosePath(GENERATIONS, createGame(GENERATIONS, { seed }), 'college');
    let guard = 0;
    while (g.status === 'playing' && guard++ < 300) {
      if (g.pending) g = resolveChoice(GENERATIONS, g, pick(g.pending));
      else g = takeTurn(GENERATIONS, g);
    }
    return g;
  }

  it('finishes with a legacy, a verified verse, and things passed on (faithful play)', () => {
    // Always choose the last option (the redemption/Kingdom choice in the design).
    const g = play(5, (p) => p.choices.length - 1);
    expect(g.status).toBe('finished');
    expect(g.legacy).toBeTruthy();
    expect(g.legacy.passedOn.length).toBeGreaterThan(0);
    expect(hasVerse(g.legacy.verse.ref)).toBe(true);
  });

  it('faithful choices outscore worldly choices on the Kingdom-weighted total', () => {
    const faithful = play(9, (p) => p.choices.length - 1);   // Kingdom option
    const worldly = play(9, () => 0);                        // first/worldly option
    expect(faithful.legacy.score).toBeGreaterThan(worldly.legacy.score);
  });

  it('the lowest outcome is still an invitation, never condemnation (grace-forward)', () => {
    const g = play(9, () => 0);
    expect(g.legacy.tier).toBeTruthy();
    expect(g.legacy.headline.toLowerCase()).not.toMatch(/condemn|damn|hopeless/);
  });
});
