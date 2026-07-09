// =============================================================================
// eternal-algorithms-studies — the public "Eternal Algorithms" study series.
// Guards the things that must be true for the Word to be handled with care and
// the game hook to be real (DR-0076): every Scripture ref resolves to verbatim
// text, the study->game deck is a valid Generations deck, and the belief-vs-
// action scoring rewards doing the word over restating the belief.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { hasVerse } from '../lib/games/scripture-link.js';
import { kjvText } from '../lib/scriptures.js';
import { GENERATIONS, withStudyDeck } from '../lib/games/generations.js';
import {
  SERIES, listStudies, getStudy, allScriptureRefs,
  studyToGameCards, algorithmsToGameCards, scoreRound, AXES,
  loadResponses, saveResponses, respKey,
} from '../lib/eternal-algorithms-studies.js';

const study1 = getStudy('conditional-truth');

describe('the series + study #1 exist and are well-formed', () => {
  it('the series is "Eternal Algorithms" with the if/then decision-logic frame', () => {
    expect(SERIES.id).toBe('eternal-algorithms');
    expect(SERIES.title).toBe('Eternal Algorithms');
    expect(SERIES.banner.toLowerCase()).toContain('if / then');
    expect(SERIES.banner.toLowerCase()).toContain('decision-logic');
    expect(SERIES.banner.toLowerCase()).toContain('beyond our comprehension'); // reverent, not reduced
  });
  it('study #1 is Conditional Truth with teaching sections and self-examination', () => {
    expect(listStudies().length).toBeGreaterThanOrEqual(1);
    expect(study1).toBeTruthy();
    expect(study1.number).toBe(1);
    expect(study1.title).toBe('Conditional Truth');
    expect(study1.sections.length).toBeGreaterThanOrEqual(5);
    expect(study1.selfExam.length).toBeGreaterThanOrEqual(5);
  });
  it('carries the binding posture: Word-first arbiter, mercy+accountability, humble-seeking', () => {
    const s = study1.sections;
    const blob = (SERIES.posture + ' ' + s.map((x) => x.plain + ' ' + x.deep).join(' ')).toLowerCase();
    expect(blob).toContain('arbiter');                 // Scripture is the arbiter
    expect(blob).toContain('mercy');                   // mercy...
    expect(blob).toContain('accountab');               // ...AND accountability
    expect(blob).toContain('piecing together the truth'); // humble-seeking
    // historical grounding is cited, not asserted (real citation present)
    const mercySec = s.find((x) => x.id === 'mercy-accountability');
    expect(mercySec.citation).toMatch(/Neuropsychiatr Dis Treat\. 2013;9:449-461/);
    expect(mercySec.deep).toMatch(/25 years of age/);
  });
});

describe('WORD IS PRIMARY — every Scripture reference resolves to real text', () => {
  // Proven-to-catch: allScriptureRefs collects section anchors + self-exam words;
  // a typo'd or invented ref fails hasVerse and this test goes red.
  const refs = allScriptureRefs(study1);
  it('collects the study refs', () => {
    expect(refs.length).toBeGreaterThanOrEqual(8);
  });
  it.each(refs)('"%s" resolves to verbatim KJV text', (ref) => {
    expect(hasVerse(ref)).toBe(true);
    expect((kjvText(ref) || '').length).toBeGreaterThan(0);
  });
});

describe('the study -> game hook is a valid, Scripture-anchored Generations deck', () => {
  const cards = studyToGameCards(study1);
  it('produces one belief-vs-action card per self-examination item', () => {
    expect(cards.length).toBe(study1.selfExam.length);
  });
  it('every card carries a resolvable verse and choices that score the 8 axes', () => {
    const axisKeys = new Set(AXES.map((a) => a.key));
    for (const card of cards) {
      expect(hasVerse(card.scripture.ref)).toBe(true); // Word on every card
      expect(card.lens.length).toBeGreaterThan(0);
      expect(card.choices.length).toBeGreaterThanOrEqual(2);
      for (const c of card.choices) {
        expect(c.effects && typeof c.effects === 'object').toBe(true);
        for (const k of Object.keys(c.effects)) expect(axisKeys.has(k)).toBe(true);
      }
      // exactly one "doing the word" redemption choice per card
      expect(card.choices.filter((c) => c.redemption).length).toBe(1);
    }
  });
  it('personalizes the card body from a saved answer when present', () => {
    const cardsP = studyToGameCards(study1, { 'doer-not-hearer': { probe: 'I skipped the hard call' } });
    const c = cardsP.find((x) => x.id.endsWith('doer-not-hearer'));
    expect(c.body).toContain('I skipped the hard call');
  });
});

describe('belief-vs-action scoring rewards doing the word (reuses the game axes)', () => {
  const cards = studyToGameCards(study1);
  it('choosing "do the word" everywhere outscores restating the belief everywhere', () => {
    const doWord = {}; const restate = {};
    for (const card of cards) {
      doWord[card.id] = card.choices.findIndex((c) => c.redemption);        // do-the-word
      restate[card.id] = card.choices.findIndex((c) => !c.redemption && c.effects.faith < 0); // self-deception
    }
    const a = scoreRound(cards, doWord).totals.weighted;
    const b = scoreRound(cards, restate).totals.weighted;
    expect(a).toBeGreaterThan(b);
    expect(b).toBe(0); // scores never fall below 0 (engine invariant) -> restating yields nothing
  });
});

describe('withStudyDeck injects the study cards into a real Generations def', () => {
  const cards = studyToGameCards(study1);
  it('adds a `study` deck without mutating the base def', () => {
    const def = withStudyDeck(GENERATIONS, cards);
    expect(def.decks.study).toBe(cards);
    expect(def.decks.life).toBe(GENERATIONS.decks.life); // life deck preserved
    expect(GENERATIONS.decks.study).toBeUndefined();     // base untouched
  });
  it('every ref in the combined def (base + study deck) resolves — the game stays Word-verified', () => {
    const def = withStudyDeck(GENERATIONS, cards);
    const refs = new Set();
    const eat = (o) => { if (o && o.ref) refs.add(o.ref); };
    for (const p of def.paths) { eat(p.scripture); for (const sp of p.opening) { eat(sp.scripture); (sp.choices || []).forEach((c) => eat(c.scripture)); } }
    for (const sp of def.trunk) { eat(sp.scripture); (sp.choices || []).forEach((c) => eat(c.scripture)); }
    for (const deck of Object.values(def.decks)) for (const card of deck) { eat(card.scripture); (card.choices || []).forEach((c) => eat(c.scripture)); }
    for (const ref of refs) expect(hasVerse(ref)).toBe(true);
  });
  it('returns the base unchanged for an empty deck', () => {
    expect(withStudyDeck(GENERATIONS, [])).toBe(GENERATIONS);
  });
});

describe('the reader\'s answers are device-local + fail soft', () => {
  beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });
  it('round-trips answers per identity', () => {
    saveResponses('a@b.com', { examine: { probe: 'x', agree: 'yes' } });
    expect(loadResponses('a@b.com').examine.probe).toBe('x');
    expect(loadResponses('other@b.com')).toEqual({}); // never commingled
    expect(respKey('A@B.com')).toBe(respKey('a@b.com')); // case-insensitive key
  });
  it('returns {} when storage is missing, never throws', () => {
    expect(() => loadResponses('a@b.com')).not.toThrow();
    expect(loadResponses('a@b.com')).toEqual({});
  });
});

// -----------------------------------------------------------------------------
// Published algorithms -> the game (Darrell 2026-07-03: "All eternal algorithms
// going into the game so they can be further aware of the Word. Real study is
// fun and exploration.") — every forge framework becomes a playable card on the
// SAME eight axes; the deck injects into the real Generations def alongside the
// study cards; an empty forge yields an empty deck, never a painted card.
// -----------------------------------------------------------------------------
describe('published algorithms become playable cards (the Word travels with the play)', () => {
  const forge = [
    { id: 'p1', name: 'Seedtime and Harvest', outcome: 'Compounding returns', threeD: 'Small disciplined deposits.', fourD: null, scripture: 'Galatians 6:7-9; Genesis 8:22', tags: [], publishedAt: null },
    { id: 'p2', name: 'Joy Is the Strength', outcome: 'Strength that does not flicker', threeD: '', fourD: 'The joy of the LORD is your strength.', scripture: 'Nehemiah 8:10', tags: [], publishedAt: null },
  ];

  it('every published framework maps to one card with its Scripture + three choices', () => {
    const cards = algorithmsToGameCards(forge);
    expect(cards).toHaveLength(2);
    for (const c of cards) {
      expect(c.id).toMatch(/^eaforge-/);
      expect(c.title).toBeTruthy();
      expect(c.choices).toHaveLength(3);
      expect(c.choices.some((ch) => ch.redemption)).toBe(true); // doing-the-word is the redemption choice
    }
    expect(cards[0].scripture.ref).toBe('Galatians 6:7-9'); // first anchor carries into the game
    expect(cards[1].lens).toMatch(/joy of the LORD/i);       // the published deep layer is the lens
  });

  it('cards score on the SAME Generations axes (no second scoring system)', () => {
    const cards = algorithmsToGameCards(forge);
    const axisKeys = new Set(AXES.map((a) => a.key));
    for (const c of cards) {
      for (const ch of c.choices) {
        for (const k of Object.keys(ch.effects)) {
          expect(axisKeys.has(k), `unknown axis '${k}' on ${c.id}`).toBe(true);
        }
      }
    }
    // running the algorithm beats admiring it, via the real scorer
    const pick = { [cards[0].id]: 0 };
    const admire = { [cards[0].id]: 1 };
    expect(scoreRound([cards[0]], pick).totals.weighted)
      .toBeGreaterThan(scoreRound([cards[0]], admire).totals.weighted);
  });

  it('the combined study + forge deck injects into a REAL Generations def', () => {
    const study = getStudy(listStudies()[0].id);
    const combined = [...studyToGameCards(study), ...algorithmsToGameCards(forge)];
    const def = withStudyDeck(null, combined);
    expect(def.decks.study).toHaveLength(combined.length);
    expect(def.decks.study.some((c) => c.id.startsWith('eaforge-'))).toBe(true);
    expect(def.decks.life?.length).toBeGreaterThan(0); // the base game is intact
  });

  it('an empty forge yields an empty deck — nothing painted', () => {
    expect(algorithmsToGameCards([])).toEqual([]);
    expect(algorithmsToGameCards(null)).toEqual([]);
  });
});
