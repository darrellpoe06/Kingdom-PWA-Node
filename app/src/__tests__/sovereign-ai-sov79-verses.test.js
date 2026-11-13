// =============================================================================
// sovereign-ai-sov79-verses - the gate for sov79, "Promotion cometh not from
// the east"
// =============================================================================
// WHERE IT CAME FROM. On 2026-10-28 at 14:07 UTC Darrell forwarded a Daily
// Upside daily issue, subject line "FW: Apple Bites Nvidia", out of his
// university mailbox, with ONE WORD typed above the forwarded header: Lessons.
// Gmail thread `1a182d6bb1fd6fa6`. His word is the ask; the newsletter is only
// the occasion, and SIXTEEN DAYS stood between the two. Both DR-1414 witnesses
// agreed it was unbuilt: the thread's own labelIds carried no Lesson-Captured,
// and scripts/lesson-already-built.mjs returned NOTHING FOUND.
//
// WORD FIRST, NOT ARTICLE FIRST (DR-0127 / DR-0282 / DR-1326). The hour opens
// on Psalm 75:6-7 -- promotion comes neither from the east nor the west nor the
// south, because God is the judge, He puts down one and sets up another -- and
// on Luke 22:24, the strife among the disciples over which of them should be
// accounted the greatest. A league table of the two most valuable houses on
// earth is that same strife with a ticker attached. Gated below in every reader
// place, and no engineering figure is permitted above that frame.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100). A newsletter is a LEAD, never the
// citation. THE PRIMARY WAS NOT READ: four primary hosts refused this build
// with the identical refusal, `CONNECT tunnel failed, response 403` --
// www.coca-colacompany.com, www.kearney.com, www.qualcomm.com and www.sec.gov
// -- so no figure on the page rests on a primary-source read, and that is said
// in EVERY reader place (DR-0076 section 8) with a dated re-review. Independent
// secondary roads were walked on each load-bearing number, and the checking
// CHANGED four things, each gated here:
//   (1) STRONGER, stated plainly (DR-0100 section 5): the reshoring pair held
//       on a second road (about 2.8 percent domestic growth against about 29
//       percent import growth), and checking ENLARGED the point -- computers
//       and electronics is the largest low-cost-country import category at
//       about 453 billion dollars, about 44 percent of the total, which the
//       digest never reached.
//   (2) SOFTER, and that is the honest reading: the beverage quarter's home
//       market was flat in VOLUME while its operating income still rose about
//       5 percent. Under-claiming is a failure too, and so is letting a
//       headline stand sharper than the number under it.
//   (3) NOT ESTABLISHED, named rather than quietly dropped: the digest's
//       "more than 90 percent of the prototypes' components" is better
//       supported as a TARGET for the first laptop than as a present property
//       of the prototypes.
//   (4) CORRECTED: the digest credits Friday's change of rank to the launch of
//       the foldable phone. It was unveiled on 2026-09-09 and went on sale on
//       Friday 2026-10-23, so the "launch" was a sale date for a six-week-old
//       announcement. The rank-trading itself is established, and so is the
//       five-trillion first in October 2025.
//   re-review: 2026-11-27.
//
// WHERE THIS GATE IS NARROWER THAN ITS NAME (DR-1467, stated rather than
// smoothed). Three things this file does NOT claim:
//   * The book list for the verse sweep is DERIVED from the module's own quoted
//     references rather than typed, because a typed list omitted Revelation on
//     2026-11-13 while Revelation 3:7 stood quoted in five reader places. A
//     derived list cannot omit a book the module actually cites -- but it also
//     cannot catch a quotation whose parenthetical reference is malformed in a
//     way the reference regex does not match, so the "every double-quoted span
//     anywhere in the module" sweep below reads EVERY string in the module and
//     is the wider of the two checks.
//   * The thread-level and whole-course claims belong to the catalog gates and
//     the Gmail lane, not here.
//   * Nothing here measures the deployed page. CI's own clone and the deploy
//     run are the witnesses for that.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { fourBandFaults, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { storyCount, MIN_STORIES } from '../lib/lesson-completeness.js';

const ID = 'sov79-promotion-cometh-not-from-the-east';
const THREAD = '1a182d6bb1fd6fa6';
const M = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);

/** EVERY string in the module, however deeply nested. The DR-1467 rule: a check
 *  that reads only the adult lesson and four bands is narrower than its name. */
const allStrings = (o, out = []) => {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach((v) => allStrings(v, out));
  else if (o && typeof o === 'object') Object.values(o).forEach((v) => allStrings(v, out));
  return out;
};

// --- the KJV corpus on disk --------------------------------------------------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const bookCache = new Map();
const bookOf = (b) => {
  const f = b.replace(/\s+/g, '');
  if (!bookCache.has(f)) bookCache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  return bookCache.get(f);
};

const TEXTS = () => ({ adult: M.lesson, ...M.levels });

/** The reference regex, used for BOTH the book list and the anchor check, so
 *  the two cannot disagree about what counts as a reference. */
const REF = /\(((?:[1-3]\s)?[A-Z][a-z]+) (\d+):(\d+)\)/g;

/** DERIVED, never typed: every book named in a parenthetical reference anywhere
 *  in the module, plus the Psalm/Psalms spelling the corpus uses on disk. */
const BOOKS = [
  ...new Set(
    allStrings(M)
      .flatMap((s) => [...s.matchAll(REF)].map((m) => m[1]))
      .map((b) => (b === 'Psalm' ? 'Psalms' : b))
  ),
].sort();
const CHAPTERS = BOOKS.flatMap((b) => bookOf(b).chapters.map((ch) => ch.join(' ')));

// The sentences a reader who reads ONE band must still meet (DR-0795).
const THREADS = [
  ['his word', /\bLessons\b/],
  ['the sixteen-day gap', /[Ss]ixteen days/],
  ['promotion', /promotion/i],
  ['accounted the greatest', /accounted the greatest/],
  ['highly esteemed', /highly esteemed/],
  ['no smith', /no smith/i],
  ['the state of the flocks', /state of thy flocks/],
  ['the might of mine hand', /might of mine hand/],
  ['what hast thou in the house', /in the house/],
  ['the Sidonian counterweight', /Sidonians/],
  ['the first-in-his-own-cause counterweight', /first in his own cause/],
  ['the bright line', /not a (?:verdict|ruling) on worth|not a gold star/],
  ['the 453 billion enlargement', /453 billion/],
  ['the seed, called a seed', /\bseed\b/],
  ['the wall nobody walked', /walked the fence/],
  ['the honest softening', /about 5 percent/],
  ['the 90 percent refused as present fact', /90 percent/],
  ['the primary was not read', /The primary was not read/],
  ['the refused host named', /www\.kearney\.com/],
  ['the dated re-review', /re-review: 2026-11-27/],
];

describe('sov79 exists and is whole', () => {
  it('the module is in the course with all four bands and an adult lesson', () => {
    expect(M, `${ID} must be in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(M.levels[b], b).toBeTruthy();
    expect(M.lesson.length).toBeGreaterThan(5000);
    expect(storyCount(M)).toBeGreaterThanOrEqual(MIN_STORIES);
  });

  it('it is the week after sov78, in order', () => {
    const i = SOVEREIGN_AI_MODULES.findIndex((m) => m.id === ID);
    expect(SOVEREIGN_AI_MODULES[i - 1].id).toMatch(/^sov78-/);
  });

  it('the course weeks ascend, are unique, and include 79', () => {
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)[1]));
    expect(weeks).toEqual([...weeks].sort((a, b) => a - b));
    expect(new Set(weeks).size).toBe(weeks.length);
    expect(weeks).toContain(79);
  });

  it('the adult lesson runs in eight numbered movements, in order', () => {
    const order = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'].map((n) => M.lesson.indexOf(`MOVEMENT ${n}:`));
    expect(
      order.every((p) => p > 0),
      `movements found at ${order.join(',')}`
    ).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('every lesson has a test: the quiz is present and every answer points at a real option', () => {
    const qs = M.quiz.questions;
    expect(qs.length).toBeGreaterThanOrEqual(7);
    for (const q of qs) {
      expect(q.options.length, q.q).toBeGreaterThanOrEqual(3);
      expect(q.answer, q.q).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.q).toBeLessThan(q.options.length);
      expect(q.explain.length, q.q).toBeGreaterThan(40);
      // DR-1467 in miniature: a quiz option carrying no answer index would pass
      // a check that only counted questions.
      expect(Object.keys(q).sort(), q.q).toEqual(['answer', 'explain', 'options', 'q']);
    }
  });
});

describe('the Word goes first, not the article (DR-0127 / DR-0282 / DR-1326)', () => {
  it('the adult lesson reaches Yahweh’s frame BEFORE it reports any engineering figure', () => {
    const word = M.lesson.indexOf('MOVEMENT ONE: PROMOTION COMETH NEITHER FROM THE EAST');
    const next = M.lesson.indexOf('MOVEMENT TWO:');
    expect(word).toBeGreaterThan(0);
    expect(next).toBeGreaterThan(word);
    const opening = M.lesson.slice(0, word);
    expect(opening).not.toMatch(/453|2\.8 percent|29 percent|33\.4|32\.0|90 percent|5 trillion|five trillion|market cap/i);
  });

  it('every reader place quotes the promotion verse verbatim and keeps the judge who sets up and puts down', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must quote Psalm 75:6 verbatim`).toContain(
        '"For promotion cometh neither from the east, nor from the west, nor from the south." (Psalm 75:6)'
      );
      expect(String(t), `${band} must keep the judge who puts down one and sets up another`).toContain(
        '"But God is the judge: he putteth down one, and setteth up another." (Psalm 75:7)'
      );
    }
  });

  it('every reader place teaches that the answer is not a direction at all', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must say the answer is not a direction`).toMatch(/not a direction|not a place on a map|where does it come from/i);
    }
  });

  it('the hour names the newsletter as the occasion and the Word as the foundation', () => {
    expect(M.bigIdea).toMatch(/the newsletter is the occasion/i);
    expect(M.lesson).toMatch(/no article is the foundation/i);
  });
});

describe('the provenance is honest', () => {
  it('it names the Gmail thread it was built from, so the repo is a second witness (DR-0076 §8)', () => {
    expect(M.bigIdea).toContain(THREAD);
  });

  it('it says in every reader place that one word was typed above the forward', () => {
    expect(M.bigIdea).toMatch(/ONE WORD typed above the forwarded header: Lessons/);
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must name his word`).toMatch(/\bLessons\b/);
    }
  });

  it('the sixteen-day gap between his word and the build is kept, not smoothed (DR-0075)', () => {
    expect(M.bigIdea).toMatch(/Sixteen days/i);
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must keep the gap on the record`).toMatch(/[Ss]ixteen days/);
    }
  });
});

describe('TRUST BUT VERIFY: the blocked roads are named everywhere, and what checking changed is stated', () => {
  const HOSTS = ['www.coca-colacompany.com', 'www.kearney.com', 'www.qualcomm.com', 'www.sec.gov'];

  it('EVERY reader place says the primary was not read and names all four refused hosts', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must say the primary was not read`).toContain('The primary was not read');
      for (const h of HOSTS) expect(String(t), `${band} must name ${h}`).toContain(h);
    }
  });

  it('EVERY reader place carries the dated re-review, so a blocked road never reads as verified', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toContain('re-review: 2026-11-27');
    }
  });

  it('what checking made STRONGER is said plainly rather than hedged (DR-0100 §5)', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band} must carry the verified pair`).toMatch(/2\.8 percent/);
      expect(s, `${band} must carry the import side`).toMatch(/29 percent/);
      expect(s, `${band} must carry the enlargement checking produced`).toContain('453 billion');
      expect(s, `${band} must say the category is the largest`).toMatch(/largest|biggest/i);
    }
  });

  it('what checking SOFTENED is stated rather than left as the sharper headline', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must carry the home-market income rise`).toMatch(/about 5 percent/);
    }
    expect(M.lesson).toMatch(/SOFTENED/);
    expect(M.bigIdea).toMatch(/SOFTENED/);
  });

  it('the claim that did NOT survive as present fact is named rather than quietly dropped', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band} must name the 90 percent figure`).toMatch(/90 percent/);
      expect(s, `${band} must call it a target or a goal, not a measured fact`).toMatch(/target|goal/i);
    }
    expect(M.bigIdea).toMatch(/REFUSED one claim as present fact/);
  });

  it('the CORRECTION about the launch date is on the record with both dates', () => {
    const all = allStrings(M).join('\n');
    expect(all).toMatch(/ninth of September/);
    expect(all).toMatch(/twenty-third of October/);
    expect(M.bigIdea).toMatch(/CORRECTED/);
  });

  it('the attributed claims are marked as attributed and never asserted on our own authority', () => {
    expect(M.bigIdea).toMatch(/Attributed and never asserted/);
    expect(M.lesson).toMatch(/attributed to its leaders and not asserted by us/);
    expect(M.lesson).toMatch(/attributed to a chief executive by way of a newspaper report/);
  });

  it('what was NOT checked at all is listed, so silence is never mistaken for a check', () => {
    expect(M.bigIdea).toMatch(/Not checked at all/i);
    expect(M.lesson).toMatch(/We did not check his figures or his quotations/);
  });
});

describe('every quoted span is the KJV on disk, letter for letter (DR-0456)', () => {
  const spans = () => Object.entries(TEXTS()).flatMap(([band, t]) => [...String(t).matchAll(/"([^"]+)"/g)].map((m) => [band, m[1]]));

  it('the book list is DERIVED from the module and holds every book it cites', () => {
    expect(BOOKS.length).toBeGreaterThan(15);
    // The trap this replaces: a typed list that omits a book the lesson quotes.
    const cited = new Set(
      allStrings(M)
        .flatMap((s) => [...s.matchAll(REF)].map((m) => m[1]))
        .map((b) => (b === 'Psalm' ? 'Psalms' : b))
    );
    expect([...cited].filter((b) => !BOOKS.includes(b))).toEqual([]);
  });

  it('the lesson quotes a great many verses, and they are swept rather than trusted', () => {
    expect(spans().length).toBeGreaterThan(150);
  });

  it('each span is a contiguous span of its own chapter', () => {
    const bad = spans().filter(([, s]) => !CHAPTERS.some((c) => c.includes(s)));
    expect(bad.map(([b, s]) => `${b}: ${s.slice(0, 70)}`)).toEqual([]);
  });

  it('every double-quoted span ANYWHERE in the module is Scripture, so no one else is put in quotation marks (DR-0331)', () => {
    const quoted = allStrings(M).flatMap((s) => [...s.matchAll(/"([^"]+)"/g)].map((m) => m[1]));
    expect(quoted.length).toBeGreaterThan(150);
    expect(quoted.filter((s) => !CHAPTERS.some((c) => c.includes(s)))).toEqual([]);
  });

  it('each quoted verse carries its reference beside it in every band (DR-0402)', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect([...String(t).matchAll(/"[^"]+" \((?:[1-3]\s)?[A-Z][a-z]+ \d+:\d+\)/g)].length, band).toBeGreaterThan(25);
    }
  });

  it('PROVEN TO CATCH: one altered word in a quoted span is rejected', () => {
    const [, first] = spans()[0];
    const broken = first.replace(/\b(\w+)\b/, 'notaword');
    expect(broken).not.toBe(first);
    expect(CHAPTERS.some((c) => c.includes(broken))).toBe(false);
  });

  it('PROVEN TO CATCH: a reordered span of the same chapter is not contiguous', () => {
    const seventyFive = bookOf('Psalms').chapters[74];
    const reordered = [seventyFive[6], seventyFive[5]].join(' ');
    expect(CHAPTERS.some((c) => c.includes(reordered))).toBe(false);
  });

  it('PROVEN TO CATCH, SCOPED TO THIS RECORD: altering Psalm 75:6 inside sov79 fails, and the scope is why', () => {
    // DR-1146 in miniature: Psalm 75:6 may be quoted in other lessons, so a
    // file-scoped check could pass on somebody else's copy. Decide by exact
    // identity INSIDE this module.
    const real = 'For promotion cometh neither from the east';
    expect(M.lesson).toContain(real);
    const mutated = M.lesson.replace(real, 'For promotion comes neither from the east');
    const mutatedSpans = [...mutated.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(mutatedSpans.filter((s) => !CHAPTERS.some((c) => c.includes(s))).length).toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: the derived book list notices a book a typed list would have omitted', () => {
    // Drop one book the module really cites and the sweep must fail by name.
    const shortBooks = BOOKS.filter((b) => b !== 'Psalms');
    const shortChapters = shortBooks.flatMap((b) => bookOf(b).chapters.map((ch) => ch.join(' ')));
    const nowBad = spans().filter(([, s]) => !shortChapters.some((c) => c.includes(s)));
    expect(nowBad.length, 'removing Psalms from the corpus list must orphan the psalm quotations').toBeGreaterThan(0);
  });
});

describe('anchor.ref names every verse the lesson stands on, and nothing it does not (DR-0734)', () => {
  const normalise = (r) => r.trim().replace(/^Psalms /, 'Psalm ');
  const declared = () => new Set(M.anchor.ref.split(';').map(normalise));

  it('it is a real list, generated from the same placeholders the verses are', () => {
    expect(declared().size).toBeGreaterThan(50);
  });

  it('every reference it declares is quoted in a reader place', () => {
    const all = Object.values(TEXTS()).join('\n');
    expect([...declared()].filter((r) => !all.includes(`(${r})`))).toEqual([]);
  });

  it('every reference it declares resolves in the corpus on disk', () => {
    for (const r of declared()) {
      const m = /^(.+?)\s+(\d+):(\d+)$/.exec(r);
      expect(m, r).toBeTruthy();
      const b = m[1] === 'Psalm' ? 'Psalms' : m[1];
      expect(bookOf(b).chapters[Number(m[2]) - 1][Number(m[3]) - 1], r).toBeTruthy();
    }
  });

  it('no verse quoted ANYWHERE in the module is missing from anchor.ref', () => {
    const quotedRefs = new Set(allStrings(M).flatMap((s) => [...s.matchAll(/" \(((?:[1-3]\s)?[A-Z][a-z]+ \d+:\d+)\)/g)].map((m) => m[1])));
    expect(quotedRefs.size).toBeGreaterThan(50);
    expect([...quotedRefs].filter((r) => !declared().has(r))).toEqual([]);
  });
});

describe('the four bands clear the gate, measured not claimed', () => {
  it('shares, ladder, child ceiling and differentiation all pass', () => {
    expect(fourBandFaults(M)).toEqual([]);
  });

  it('the ladder is monotone and every ceiling is cleared with margin', () => {
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(M.levels[b])]));
    expect(g.child).toBeLessThan(g.youth);
    expect(g.youth).toBeLessThan(g.teen);
    expect(g.teen).toBeLessThan(g.senior);
    expect(g.child).toBeLessThanOrEqual(5.0);
    expect(g.teen).toBeLessThanOrEqual(6.0);
    expect(g.senior).toBeLessThanOrEqual(10.0);
  });

  it('no band is a near copy of another or of the adult lesson', () => {
    for (let i = 0; i < FOUR_BANDS.length; i += 1) {
      expect(overlapOf(M.levels[FOUR_BANDS[i]], M.lesson), `${FOUR_BANDS[i]}~adult`).toBeLessThan(0.25);
      for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
        expect(overlapOf(M.levels[FOUR_BANDS[i]], M.levels[FOUR_BANDS[j]]), `${FOUR_BANDS[i]}~${FOUR_BANDS[j]}`).toBeLessThan(0.25);
      }
    }
  });

  it('each band names its lesson in its opening, so a reader inside it knows what he is in', () => {
    for (const b of FOUR_BANDS) expect(M.levels[b].slice(0, 400), b).toContain('Promotion cometh not from the east');
  });
});

describe('TALK ABOUT IT TOGETHER, in the lesson AND in every band (DR-0733 / DR-0795)', () => {
  it('every place carries the heading', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toContain('TALK ABOUT IT TOGETHER');
    }
  });

  it('every place sends the reader to parents, to children and to a friend', () => {
    expect(placesMissingDirections(M)).toEqual([]);
    expect(hasAllThree(M)).toBe(true);
  });

  it('every place carries the skill and the rhythm in the lesson’s own words', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band} must ask`).toMatch(/\bask\b/i);
      expect(s, `${band} must listen to the end`).toMatch(/all the way to the end|the whole story|the whole of it/i);
      expect(s, `${band} must retell`).toMatch(/in their own words|back to them/i);
      expect(s, `${band} must teach one verse`).toMatch(/teach (?:them|each other) one verse/i);
      expect(s, `${band} must carry the rhythm`).toMatch(/four places of Deuteronomy 6:7/);
      expect(s, `${band} must carry the one friend this week`).toMatch(/one friend this week/);
    }
  });

  it('PROVEN TO CATCH: stripping ONE band’s friend line alone names that band while the pooled check stays green', () => {
    const broken = {
      ...M,
      levels: { ...M.levels, teen: M.levels.teen.replace(/Then ask a friend this:[^]*?Teach each other one verse\./, '') },
    };
    expect(broken.levels.teen).not.toBe(M.levels.teen);
    expect(JSON.stringify(placesMissingDirections(broken)), 'the per-band check must name teen').toMatch(/teen/);
    expect(hasAllThree(broken), 'while the pooled module still reads whole').toBe(true);
  });
});

describe('the teaching itself: the threads reach EVERY reader place', () => {
  it('every reader place carries all twenty threads', () => {
    const missing = [];
    for (const [band, t] of Object.entries(TEXTS())) {
      for (const [name, re] of THREADS) if (!re.test(String(t))) missing.push(`${band}: ${name}`);
    }
    expect(missing).toEqual([]);
  });

  it('PROVEN TO CATCH: a band with one thread stripped fails by name', () => {
    const stripped = M.levels.youth.replace(/453 billion/g, 'a lot');
    const missing = [];
    for (const [name, re] of THREADS) if (!re.test(stripped)) missing.push(`youth: ${name}`);
    expect(missing).toContain('youth: the 453 billion enlargement');
  });

  it('both counterweights are kept in every band, so neither movement is a slogan', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band} must keep the Sidonian counterweight on trade`).toContain('Sidonians');
      expect(s, `${band} must keep the counterweight on raising a grievance`).toContain('first in his own cause');
    }
  });

  it('the bright line is kept in every band: a rank is not a verdict on worth or on righteousness', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toMatch(/not a (?:verdict|ruling) on worth|not a gold star/);
    }
  });

  it('we teach the Word rather than debate it (DR-0098): no both-sides staging of economic schools', () => {
    expect(M.facilitator.howToRun).toMatch(/Do not stage two schools of economic opinion/);
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must teach from Scripture's own usage`).toMatch(/Scripture|the Word/);
    }
  });

  it('the quiz tests the frame, the corrections and the counterweights', () => {
    const qs = M.quiz.questions.map((q) => q.q).join('\n');
    expect(qs).toMatch(/Psalm 75:6-7/);
    expect(qs).toMatch(/Luke 22:24/);
    expect(qs).toMatch(/1 Samuel 13:19/);
    expect(qs).toMatch(/counterweight/i);
    expect(M.quiz.questions.map((q) => q.explain).join('\n')).toMatch(/re-review: 2026-11-27/);
  });
});

describe('the house typography holds', () => {
  it('the adversary is never capitalised anywhere in the module', () => {
    const bad = allStrings(M).filter((s) => /\b(Satan|Lucifer|The Devil|The Adversary|Baal)\b/.test(s));
    expect(bad.map((s) => s.slice(0, 80))).toEqual([]);
  });

  it('our own voice says Yahweh, and quoted Scripture is left exactly as it is', () => {
    expect(M.lesson).toMatch(/Yahweh/);
    // The KJV's own God / the LORD stand verbatim inside quotations.
    expect(M.lesson).toContain('"But God is the judge: he putteth down one, and setteth up another." (Psalm 75:7)');
  });

  it('PROVEN TO CATCH: substituting Yahweh into a quoted verse fails (the DR-0076 bright line)', () => {
    const real = '"But God is the judge: he putteth down one, and setteth up another."';
    const mutated = real.replace('God', 'Yahweh');
    expect(CHAPTERS.some((c) => c.includes(mutated.slice(1, -1)))).toBe(false);
  });

  it('the Word is capitalised where it names the Scriptures, and His pronouns follow', () => {
    expect(M.lesson).toMatch(/the Word is the foundation/);
    expect(M.lesson).toMatch(/\bHe\b/);
    expect(M.lesson).toMatch(/Lamb of Yahweh/);
    expect(M.lesson).toMatch(/Eternal Son of Yahweh/);
  });
});
