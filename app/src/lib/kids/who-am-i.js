// =============================================================================
// kids/who-am-i — the Who Am I? game's pure rules (Kids Zone, Phase E)
// =============================================================================
// Darrell, 2026-11-13: "Develop the Word Builder and Who Am I? Bible games."
//
// GROUNDED, NOT PAINTED (P15; DR-0076): no clue is written here. Each person
// on the roster carries three REFERENCES, and the game loads those verses
// verbatim from the hosted King James text at play time (lib/bible-kjv.js
// verseText). The only change the game makes to a verse on screen is to
// blank the person's own name while the child guesses; after the guess the
// verse is shown whole. kids-who-am-i.test.js opens every clue verse in the
// in-repo KJV and proves the name it blanks is really in that verse, so a
// clue that does not name its person cannot ship.
//
// Two rosters: Kids meets the people a Sunday-school child meets first; Teens
// adds the ones a young person meets next. The week's person is picked by the
// calendar week (lib/youth-zone.js weeklyPick) so every device asks the same
// one; the "Next hero" step walks the roster from there. A wrong guess says
// "not yet", never "wrong": the child reveals the next clue and tries again.
// Pure: no React, no I/O, no Date.

/** A person: the name the clues blank, and three clue references, hardest first. */
export const KIDS_ROSTER = Object.freeze([
  { name: 'Noah', clues: ['Genesis 8:20', 'Genesis 7:7', 'Genesis 6:8'], book: 'Genesis', chapter: 6 },
  { name: 'Abraham', clues: ['Genesis 21:3', 'Genesis 17:5', 'Genesis 22:13'], book: 'Genesis', chapter: 22 },
  { name: 'Joseph', clues: ['Genesis 41:41', 'Genesis 37:28', 'Genesis 37:3'], book: 'Genesis', chapter: 37 },
  { name: 'Moses', clues: ['Exodus 2:10', 'Exodus 14:21', 'Exodus 3:4'], book: 'Exodus', chapter: 3 },
  { name: 'Joshua', clues: ['Joshua 10:12', 'Joshua 1:1', 'Joshua 6:16'], book: 'Joshua', chapter: 6 },
  { name: 'Ruth', clues: ['Ruth 4:13', 'Ruth 2:2', 'Ruth 1:16'], book: 'Ruth', chapter: 1 },
  { name: 'Samuel', clues: ['1 Samuel 16:13', '1 Samuel 3:19', '1 Samuel 3:10'], book: '1 Samuel', chapter: 3 },
  { name: 'David', clues: ['1 Samuel 16:13', '1 Samuel 17:45', '1 Samuel 17:49'], book: '1 Samuel', chapter: 17 },
  { name: 'Elijah', clues: ['1 Kings 17:1', '1 Kings 18:36', '2 Kings 2:11'], book: '1 Kings', chapter: 18 },
  { name: 'Esther', clues: ['Esther 4:15', 'Esther 7:3', 'Esther 2:17'], book: 'Esther', chapter: 4 },
  { name: 'Daniel', clues: ['Daniel 1:8', 'Daniel 6:10', 'Daniel 6:16'], book: 'Daniel', chapter: 6 },
  { name: 'Jonah', clues: ['Jonah 1:3', 'Jonah 3:3', 'Jonah 1:17'], book: 'Jonah', chapter: 1 },
  { name: 'Mary', clues: ['Luke 2:19', 'Luke 1:38', 'Luke 1:30'], book: 'Luke', chapter: 1 },
  { name: 'Peter', clues: ['Acts 3:6', 'Matthew 16:16', 'Matthew 14:29'], book: 'Matthew', chapter: 14 },
  { name: 'Zacchaeus', clues: ['Luke 19:8', 'Luke 19:2', 'Luke 19:5'], book: 'Luke', chapter: 19 },
]);

/** The people a teen meets next, added to the kids' roster. */
export const TEENS_EXTRA = Object.freeze([
  { name: 'Deborah', clues: ['Judges 5:1', 'Judges 4:9', 'Judges 4:4'], book: 'Judges', chapter: 4 },
  { name: 'Gideon', clues: ['Judges 6:36', 'Judges 7:7', 'Judges 6:11'], book: 'Judges', chapter: 6 },
  { name: 'Hannah', clues: ['1 Samuel 2:21', '1 Samuel 1:2', '1 Samuel 1:20'], book: '1 Samuel', chapter: 1 },
  { name: 'Solomon', clues: ['1 Kings 6:14', '1 Kings 4:29', '1 Kings 3:5'], book: '1 Kings', chapter: 3 },
  { name: 'Josiah', clues: ['2 Chronicles 35:1', '2 Kings 22:3', '2 Kings 22:1'], book: '2 Kings', chapter: 22 },
  { name: 'Nehemiah', clues: ['Nehemiah 10:1', 'Nehemiah 8:9', 'Nehemiah 1:1'], book: 'Nehemiah', chapter: 1 },
  { name: 'Rahab', clues: ['Hebrews 11:31', 'Joshua 2:3', 'Joshua 6:25'], book: 'Joshua', chapter: 2 },
  { name: 'Paul', clues: ['Acts 13:9', 'Acts 28:3', 'Acts 16:25'], book: 'Acts', chapter: 16 },
  { name: 'Timothy', clues: ['2 Timothy 1:2', '1 Timothy 6:20', '1 Timothy 1:2'], book: '1 Timothy', chapter: 1 },
]);

export const CLUES_PER_PERSON = 3;

/** The roster a door plays: Kids its own, Teens both. */
export function rosterFor(doorKey) {
  return doorKey === 'teens' ? KIDS_ROSTER.concat(TEENS_EXTRA) : KIDS_ROSTER.slice();
}

/** Find a person by name on a roster (case-insensitive), or null. */
export function personByName(roster, name) {
  const n = String(name || '').toLowerCase();
  return (roster || []).find((p) => p.name.toLowerCase() === n) || null;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** True when the verse text names the person as a whole word. */
export function namesPerson(text, name) {
  return new RegExp(`\\b${escapeRe(String(name || ''))}\\b`).test(String(text || ''));
}

/**
 * The verse with the person's name blanked, as tokens the surface renders:
 * { word, blank }. The name is matched as a whole word, in any case; a
 * possessive ("Noah's") blanks the name and keeps the "'s".
 */
export function blankName(text, name) {
  const re = new RegExp(`\\b${escapeRe(String(name || ''))}\\b`, 'gi');
  const out = [];
  let last = 0;
  const s = String(text || '');
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push({ word: s.slice(last, m.index), blank: false });
    out.push({ word: m[0], blank: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ word: s.slice(last), blank: false });
  return out;
}

/** A small deterministic generator (mulberry32), the same as the Word Builder's. */
function seededRandom(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Four names to choose from: the person and three others from the same
 * roster, in a seeded order so the right answer is not always in one spot.
 */
export function choicesFor(person, roster, seed = 0, count = 4) {
  const others = (roster || []).filter((p) => p.name !== person.name);
  const rnd = seededRandom(seed + person.name.length);
  const picked = [];
  const pool = others.slice();
  while (picked.length < count - 1 && pool.length) {
    picked.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  }
  const all = picked.concat([person]);
  for (let i = all.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.map((p) => p.name);
}

/** The person after this one on the roster, wrapping, for "Next hero". */
export function nextPerson(roster, person) {
  const i = (roster || []).findIndex((p) => p.name === (person && person.name));
  if (i < 0 || !roster.length) return roster && roster.length ? roster[0] : null;
  return roster[(i + 1) % roster.length];
}

/** Stars for a round: three if guessed on the first clue, two on the second, one on the third. */
export function starsForClues(cluesRevealed) {
  const n = Math.max(1, Math.min(CLUES_PER_PERSON, Number(cluesRevealed) || 1));
  return CLUES_PER_PERSON + 1 - n;
}

/** Grade a tap: right, or "not yet" with whether another clue remains. */
export function gradeGuess(person, guess, cluesRevealed) {
  const right = String(guess || '').toLowerCase() === person.name.toLowerCase();
  if (right) return { right: true, stars: starsForClues(cluesRevealed), more: false };
  return { right: false, stars: 0, more: cluesRevealed < CLUES_PER_PERSON };
}
