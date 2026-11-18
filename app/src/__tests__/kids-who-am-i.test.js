// @vitest-environment node
// =============================================================================
// Who Am I? — every clue reference opens in the in-repo King James text and
// NAMES the person it blanks; the blank hides only that name; the choices
// always hold the answer; stars fall with each clue; a wrong tap says "not
// yet" while a clue remains (DR-0076: the clue is the Word, verbatim).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRef } from '../lib/bible-kjv.js';
import {
  KIDS_ROSTER,
  TEENS_EXTRA,
  CLUES_PER_PERSON,
  rosterFor,
  personByName,
  namesPerson,
  blankName,
  choicesFor,
  nextPerson,
  starsForClues,
  gradeGuess,
} from '../lib/kids/who-am-i.js';

const KJV = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'bible', 'kjv');
const books = new Map();
function verse(ref) {
  const p = parseRef(ref);
  if (!p) throw new Error(`unparseable reference: ${ref}`);
  if (!books.has(p.file)) books.set(p.file, JSON.parse(readFileSync(join(KJV, `${p.file}.json`), 'utf8')));
  const ch = books.get(p.file).chapters[p.chapter - 1];
  const parts = [];
  for (let v = p.v1; v <= p.v2; v += 1) parts.push(ch[v - 1]);
  return parts.join(' ');
}

describe('every clue is a real verse that names its person', () => {
  const all = KIDS_ROSTER.concat(TEENS_EXTRA);
  it('each person carries exactly three references, and no two people share a name', () => {
    for (const p of all) expect(p.clues.length).toBe(CLUES_PER_PERSON);
    expect(new Set(all.map((p) => p.name)).size).toBe(all.length);
  });
  for (const p of all) {
    it(`${p.name}: all three clue verses open in the KJV and name ${p.name} as a whole word`, () => {
      for (const ref of p.clues) {
        const text = verse(ref);
        expect(text.length).toBeGreaterThan(10);
        expect(namesPerson(text, p.name)).toBe(true);
      }
    });
  }
  it('the gate catches a clue that does not name its person', () => {
    expect(namesPerson(verse('Genesis 1:1'), 'Noah')).toBe(false);
    expect(namesPerson('Jonah went', 'Jonah')).toBe(true);
    expect(namesPerson('Jonahs went', 'Jonah')).toBe(false);
  });
});

describe('the blank hides only the name, and the verse comes back whole', () => {
  it('blanks every whole-word occurrence and nothing else', () => {
    const text = verse('Jonah 1:17');
    const tokens = blankName(text, 'Jonah');
    expect(tokens.filter((t) => t.blank).length).toBe(2);
    expect(tokens.map((t) => t.word).join('')).toBe(text);
    expect(
      tokens
        .filter((t) => !t.blank)
        .map((t) => t.word)
        .join('')
    ).not.toMatch(/Jonah/);
  });
  it('a possessive keeps its apostrophe-s outside the blank', () => {
    const tokens = blankName("Noah's ark", 'Noah');
    expect(tokens[0]).toEqual({ word: 'Noah', blank: true });
    expect(tokens[1].word).toBe("'s ark");
  });
});

describe('the round', () => {
  it('the rosters: Kids its own, Teens both; a name finds its person', () => {
    expect(rosterFor('kids').length).toBe(KIDS_ROSTER.length);
    expect(rosterFor('teens').length).toBe(KIDS_ROSTER.length + TEENS_EXTRA.length);
    expect(personByName(KIDS_ROSTER, 'jonah').name).toBe('Jonah');
    expect(personByName(KIDS_ROSTER, 'Paul')).toBeNull();
  });
  it('four choices, the answer among them, in a seeded order that is not always last', () => {
    const jonah = personByName(KIDS_ROSTER, 'Jonah');
    const positions = new Set();
    for (let seed = 0; seed < 30; seed += 1) {
      const c = choicesFor(jonah, KIDS_ROSTER, seed);
      expect(c.length).toBe(4);
      expect(new Set(c).size).toBe(4);
      expect(c).toContain('Jonah');
      positions.add(c.indexOf('Jonah'));
    }
    expect(positions.size).toBeGreaterThan(1);
    expect(choicesFor(jonah, KIDS_ROSTER, 5)).toEqual(choicesFor(jonah, KIDS_ROSTER, 5));
  });
  it('stars fall with each clue; a wrong tap says not yet while a clue remains', () => {
    const jonah = personByName(KIDS_ROSTER, 'Jonah');
    expect(starsForClues(1)).toBe(3);
    expect(starsForClues(2)).toBe(2);
    expect(starsForClues(3)).toBe(1);
    expect(gradeGuess(jonah, 'jonah', 2)).toEqual({ right: true, stars: 2, more: false });
    expect(gradeGuess(jonah, 'Noah', 1)).toEqual({ right: false, stars: 0, more: true });
    expect(gradeGuess(jonah, 'Noah', 3)).toEqual({ right: false, stars: 0, more: false });
  });
  it('next hero walks the roster and wraps', () => {
    expect(nextPerson(KIDS_ROSTER, KIDS_ROSTER[0]).name).toBe(KIDS_ROSTER[1].name);
    expect(nextPerson(KIDS_ROSTER, KIDS_ROSTER[KIDS_ROSTER.length - 1]).name).toBe(KIDS_ROSTER[0].name);
  });
});
