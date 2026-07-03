// =============================================================================
// godhead-study — the Thorough Study of the Living Godhead, proven not claimed.
// =============================================================================
// Darrell 2026-07-03: "Go through the entire Bible and find the deterministic
// algorithms." These tests pin the catalog's integrity:
//   * VERSE TRUTH — every ref in the catalog resolves to VERBATIM KJV text in
//     the verified fetch artifact (godhead-study-verses.json). A ref with no
//     fetched text fails HERE, so a fabricated or typo'd reference can never
//     render (DR-0076: no Scripture from memory);
//   * COVERAGE — the catalog genuinely spans the canon: every section (Torah &
//     History, Wisdom, Prophets, Gospels, Epistles, Revelation) carries entries;
//   * SHAPE — every entry states its IF, its THEN, the practice, and the
//     outcome; ids are unique;
//   * THE GAME — the whole catalog deals as Generations-compatible cards on the
//     same eight Yahweh axes, and running the algorithm beats admiring it.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  GODHEAD_ALGORITHMS, GODHEAD_SECTIONS, godheadBySection, godheadVerse, godheadToGameCards,
  BOOK_MASTERPIECES, booksInCatalog, algorithmsForBook,
} from '../lib/godhead-study.js';
import { AXES, scoreRound } from '../lib/eternal-algorithms-studies.js';
import { withStudyDeck } from '../lib/games/generations.js';

describe('verse truth — every reference resolves to verbatim KJV', () => {
  it('no catalog ref is missing its fetched text', () => {
    const missing = GODHEAD_ALGORITHMS.flatMap((a) => a.refs).filter((r) => !godheadVerse(r));
    expect(missing, `refs with NO verbatim text (run node scripts/fetch-godhead-verses.mjs): ${missing.join(', ')}`).toEqual([]);
  });

  it('spot checks read as the KJV actually reads', () => {
    expect(godheadVerse('Deuteronomy 30:19')).toMatch(/I have set before you life and death/);
    expect(godheadVerse('Matthew 6:33')).toMatch(/seek ye first the kingdom of God/);
    expect(godheadVerse('1 Corinthians 15:31')).toMatch(/I die daily/);
    expect(godheadVerse('Revelation 21:27')).toMatch(/Lamb.?s book of life/);
  });
});

describe('coverage — the whole canon, not a corner of it', () => {
  it('every section of the Bible carries entries', () => {
    for (const s of godheadBySection()) {
      expect(s.entries.length, `section '${s.key}' is empty`).toBeGreaterThan(0);
    }
  });

  it('the catalog is substantial (a Thorough Study, not a sampler)', () => {
    expect(GODHEAD_ALGORITHMS.length).toBeGreaterThanOrEqual(30);
    expect(GODHEAD_SECTIONS).toHaveLength(6);
  });
});

describe('shape — every algorithm is a stated IF/THEN with practice + outcome', () => {
  it('ids unique; condition/consequence/threeD/outcome all present', () => {
    const ids = new Set();
    for (const a of GODHEAD_ALGORITHMS) {
      expect(ids.has(a.id), `duplicate id ${a.id}`).toBe(false);
      ids.add(a.id);
      for (const field of ['name', 'condition', 'consequence', 'threeD', 'outcome']) {
        expect(String(a[field] || '').trim().length, `${a.id}.${field} empty`).toBeGreaterThan(0);
      }
      expect(a.refs.length).toBeGreaterThan(0);
      expect(GODHEAD_SECTIONS.some((s) => s.key === a.section), `${a.id} has unknown section`).toBe(true);
    }
  });
});

describe('the game — the whole catalog deals on the same eight axes', () => {
  it('one card per algorithm, Scripture carried, valid axes, redemption choice present', () => {
    const cards = godheadToGameCards();
    expect(cards).toHaveLength(GODHEAD_ALGORITHMS.length);
    const axisKeys = new Set(AXES.map((a) => a.key));
    for (const c of cards) {
      expect(c.scripture.ref).toBeTruthy();
      expect(c.choices).toHaveLength(3);
      expect(c.choices.some((ch) => ch.redemption)).toBe(true);
      for (const ch of c.choices) {
        for (const k of Object.keys(ch.effects)) expect(axisKeys.has(k), `unknown axis ${k}`).toBe(true);
      }
    }
  });

  it('running the algorithm beats admiring it, via the real scorer', () => {
    const [card] = godheadToGameCards();
    expect(scoreRound([card], { [card.id]: 0 }).totals.weighted)
      .toBeGreaterThan(scoreRound([card], { [card.id]: 1 }).totals.weighted);
  });

  it('injects into a real Generations def alongside the base game', () => {
    const def = withStudyDeck(null, godheadToGameCards());
    expect(def.decks.study).toHaveLength(GODHEAD_ALGORITHMS.length);
    expect(def.decks.life?.length).toBeGreaterThan(0);
  });
});

describe('each book is its own masterpiece (Darrell 2026-07-03)', () => {
  it('every book the catalog draws from carries its identity line', () => {
    const missing = booksInCatalog().filter((b) => !BOOK_MASTERPIECES[b]);
    expect(missing, `books with no masterpiece line: ${missing.join(', ')}`).toEqual([]);
  });

  it('Proverbs carries the kings framing, and filtering by book returns its algorithms', () => {
    expect(BOOK_MASTERPIECES.Proverbs).toMatch(/kings of The Eternal King/);
    const provs = algorithmsForBook('Proverbs');
    expect(provs.length).toBeGreaterThanOrEqual(4);
    for (const a of provs) expect(a.refs.some((r) => r.startsWith('Proverbs'))).toBe(true);
  });
});
