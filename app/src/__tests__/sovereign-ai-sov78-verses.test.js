// =============================================================================
// sovereign-ai-sov78-verses - the gate for sov78, "Count the cost"
// =============================================================================
// WHERE IT CAME FROM. On 2026-10-27 at 19:34 UTC Darrell forwarded a Morning
// Brew daily issue, subject line "FW: ANT on the march", out of his university
// mailbox, with ONE WORD typed above the forwarded header: Lesson. Gmail thread
// `1a17edb6eaedf195`. His word is the ask; the newsletter is only the occasion,
// and SEVENTEEN DAYS stood between the two.
//
// WORD FIRST, NOT ARTICLE FIRST (DR-0127 / DR-0282 / DR-1326). The hour opens on
// Luke 14:28 -- the man intending to build a tower who sitteth not down FIRST
// and counteth the cost -- and on the king who sits down and consults whether he
// be able. A prospectus is, in its form, a man sitting down to count out loud,
// and Jesus taught the form before any exchange on earth required it. He also
// supplied the ending nobody wants: an honest count can end in an ambassage and
// conditions of peace. That is gated below in every reader place, and no figure
// from the newsletter is permitted above the frame.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100). A newsletter is a LEAD, never the
// citation. THE PRIMARY WAS NOT READ: www.sec.gov refused this build twice by
// two different roads -- curl got `CONNECT tunnel failed, response 403` and the
// fetch tool got `ENOTFOUND www.sec.gov` -- so no figure on the page rests on a
// primary-source read, and that is said in EVERY band (DR-0076 section 8) with a
// dated re-review. Independent secondary roads were walked on each load-bearing
// number, and the checking CHANGED five things, each gated here:
//   (1) STRONGER, stated plainly (DR-0100 section 5): the fourteen-fold rise to
//       about 16.3 billion dollars holds by a SECOND arithmetic road that does
//       not pass through the first -- consumption revenue of 13.1 billion as 80
//       percent of the total gives about 16.4 billion -- and the filing's own
//       halves as reported elsewhere, 16.286 against 1.163 billion, give 14.0.
//   (2) BIGGER IN MEANING: the 417 billion dollars is COMPUTE obligations, which
//       is more exact and harder to exit than general supplier debt.
//   (3) CORRECTED IN THE DIGEST'S FAVOR: "has yet to make a profit" was the
//       careful phrase; the enormous loss figure circulating about the same
//       filing is almost wholly a non-cash revaluation, operating loss near 693
//       million, and this digest printed no loss figure at all.
//   (4) NOT ESTABLISHED: the "94 pages" of risk did not survive checking --
//       coverage puts that section at roughly 80 to 93 pages and disagrees on
//       the total -- so no page count is taught anywhere on the page.
//   (5) STRONGER, and the finding of the hour: the self-warning is real and more
//       striking than the digest's phrasing.
// ATTRIBUTED, never asserted: the up-to-100-billion raise and the record
// comparison, the governance account, and the critics' objection.
//
// EVERY VERSE WAS FILLED FROM app/public/bible/kjv RATHER THAN TYPED (DR-0456),
// by scripts/sov78-fill.mjs, and swept against that corpus below.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { fourBandFaults, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { storyCount, MIN_STORIES } from '../lib/lesson-completeness.js';

const ID = 'sov78-count-the-cost';
const THREAD = '1a17edb6eaedf195';
const M = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);

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
/** Every chapter of every book this lesson touches, verses joined by one space,
 *  so a CONTIGUOUS span is a substring while a reordered one is not. */
const BOOKS = [
  'Genesis',
  'Exodus',
  'Deuteronomy',
  'Psalms',
  'Proverbs',
  'Ecclesiastes',
  'Isaiah',
  'Jeremiah',
  'Ezekiel',
  'Daniel',
  'Micah',
  'Matthew',
  'Luke',
  'John',
  'Romans',
  '1 Corinthians',
  'Galatians',
  'Colossians',
  '1 Thessalonians',
  '2 Thessalonians',
  '1 Timothy',
  'Hebrews',
  'Revelation',
];
const CHAPTERS = BOOKS.flatMap((b) => bookOf(b).chapters.map((ch) => ch.join(' ')));

const TEXTS = () => ({ adult: M.lesson, ...M.levels });

describe('sov78 exists and is whole', () => {
  it('the module is in the course with all four bands and an adult lesson', () => {
    expect(M, `${ID} must be in SOVEREIGN_AI_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(M.levels[b], b).toBeTruthy();
    expect(M.lesson.length).toBeGreaterThan(5000);
  });

  it('it is the week after sov77, in order', () => {
    const i = SOVEREIGN_AI_MODULES.findIndex((m) => m.id === ID);
    expect(SOVEREIGN_AI_MODULES[i - 1].id).toMatch(/^sov77-/);
  });

  // The whole-course contiguity claim belongs to the catalog, not to one
  // lesson's gate (the ordering finding recorded in DR-1146). This pins only
  // what a lesson can honestly own: the weeks ascend, they are unique, and 78
  // is among them.
  it('the course weeks ascend, are unique, and include 78', () => {
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(/^sov(\d+)-/.exec(m.id)[1]));
    expect(weeks).toEqual([...weeks].sort((a, b) => a - b));
    expect(new Set(weeks).size).toBe(weeks.length);
    expect(weeks).toContain(78);
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
    }
  });
});

describe('the Word goes first, not the article (DR-0127 / DR-0282 / DR-1326)', () => {
  it('the adult lesson reaches Yahweh’s frame BEFORE it reports any engineering figure', () => {
    const word = M.lesson.indexOf('MOVEMENT ONE: SITTETH NOT DOWN FIRST');
    const next = M.lesson.indexOf('MOVEMENT TWO:');
    expect(word).toBeGreaterThan(0);
    expect(next).toBeGreaterThan(word);
    const opening = M.lesson.slice(0, word);
    expect(opening).not.toMatch(/417|16\.3|sixteen point three|fourteen-fold|693|16\.286|100 billion|94 pages|ninety-four/i);
  });

  it('every reader place quotes the counting command verbatim, and keeps the ending nobody wants', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band} must quote Luke 14:28 verbatim`).toContain(
        '"For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28)'
      );
      expect(s, `${band} must carry the ambassage, so an honest count may end in no`).toMatch(/conditions of peace|asks for peace/i);
    }
  });

  it('every reader place teaches that the counting comes FIRST, on the one adverb', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), band).toMatch(/\bfirst\b/i);
      expect(String(t), `${band} must put the weight on that word`).toMatch(
        /sitteth (?:not )?down first|sits down first|the word is first|You do that FIRST|on one word|on a single adverb/i
      );
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
    expect(M.bigIdea).toMatch(/ONE WORD typed above the forwarded header: Lesson/);
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must name his word`).toMatch(/\bLesson\b/);
    }
  });

  it('the seventeen-day gap between his word and the build is kept, not smoothed (DR-0075)', () => {
    expect(M.bigIdea).toMatch(/Seventeen days/i);
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must keep the gap on the record`).toMatch(/[Ss]eventeen days/);
    }
  });
});

describe('TRUST BUT VERIFY: the blocked road is named everywhere, and what checking changed is stated', () => {
  it('EVERY reader place says the primary was not read and names the host', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band} must say the primary road was refused`).toMatch(/sec\.gov|the government's own (?:website|site|archive)|the real paper|that paper/i);
      expect(s, `${band} must say it was refused twice, by two roads`).toMatch(/twice/i);
    }
  });

  it('EVERY reader place carries the dated re-review, so a blocked road never reads as verified', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must carry the date`).toMatch(/re-review: 2026-11-27|re-review 2026-11-27|twenty-seventh of November 2026/);
    }
  });

  it('what checking made STRONGER is said plainly rather than hedged (DR-0100 §5)', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band} must state the verified growth plainly`).toMatch(/fourteen/i);
      expect(s, `${band} must say under-claiming is also a failure`).toMatch(
        /under-claiming|making a true thing sound small|a true thing said small|we do not make a true thing sound small|shrink that to sound careful|do not hedge a true thing|understate a verified truth/i
      );
    }
    // The second arithmetic road is the evidence, not a claim of diligence.
    expect(M.lesson).toMatch(/thirteen point one/);
    expect(M.lesson).toMatch(/does not (?:run|travel|pass) through the first/i);
  });

  it('the claim that did NOT survive is named rather than quietly dropped', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must name the page count that failed`).toMatch(/ninety-(?:four|three)/i);
    }
    // ...and no page count is ever taught as a fact.
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must not assert a page count`).not.toMatch(/(?:the|its) ninety-four pages of (?:risk|warnings) (?:are|is|were)\b/i);
    }
  });

  it('the obligation figure is taught as COMPUTE, which is what checking enlarged', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must name the obligation`).toMatch(/four hundred and seventeen billion/i);
    }
    expect(M.lesson).toMatch(/data centers/);
    expect(M.lesson).toMatch(/cloud services/);
  });

  it('the attributed claims are marked as attributed and never asserted on our own authority', () => {
    expect(M.bigIdea).toMatch(/ATTRIBUTED, NEVER ASSERTED/);
    expect(M.bigIdea).toMatch(/analysts believe/i);
    expect(M.lesson).toMatch(/attributed|taught as nothing more|taught as nothing further/i);
  });

  it('what was NOT checked at all is listed, so silence is never mistaken for a check', () => {
    expect(M.bigIdea).toMatch(/NOT CHECKED AT ALL/);
    expect(M.lesson).toMatch(/Not checked at all/i);
  });
});

describe('every quoted span is the KJV on disk, letter for letter (DR-0456)', () => {
  const spans = () => Object.entries(TEXTS()).flatMap(([band, t]) => [...String(t).matchAll(/"([^"]+)"/g)].map((m) => [band, m[1]]));

  it('the lesson quotes a great many verses, and they are swept rather than trusted', () => {
    expect(spans().length).toBeGreaterThan(150);
  });

  it('each span is a contiguous span of its own chapter', () => {
    const bad = spans().filter(([, s]) => !CHAPTERS.some((c) => c.includes(s)));
    expect(bad.map(([b, s]) => `${b}: ${s.slice(0, 70)}`)).toEqual([]);
  });

  it('every double-quoted span anywhere in the module is Scripture, so no one else is put in quotation marks (DR-0331)', () => {
    const quoted = allStrings(M).flatMap((s) => [...s.matchAll(/"([^"]+)"/g)].map((m) => m[1]));
    expect(quoted.filter((s) => !CHAPTERS.some((c) => c.includes(s)))).toEqual([]);
  });

  it('each quoted verse carries its reference beside it in every band (DR-0402)', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect([...String(t).matchAll(/"[^"]+" \([1-3]?\s?[A-Z][a-z]+ \d+:\d+(-\d+)?\)/g)].length, band).toBeGreaterThan(25);
    }
  });

  it('PROVEN TO CATCH: one altered word in a quoted span is rejected', () => {
    const [, first] = spans()[0];
    const broken = first.replace(/\b(\w+)\b/, 'notaword');
    expect(broken).not.toBe(first);
    expect(CHAPTERS.some((c) => c.includes(broken))).toBe(false);
  });

  it('PROVEN TO CATCH: the DR-0456 apostrophe class -- an ASCII apostrophe where the corpus has U+2019', () => {
    const withCurly = spans().filter(([, s]) => s.includes('’'));
    expect(withCurly.length, 'the lesson must quote at least one verse carrying U+2019').toBeGreaterThan(0);
    const retyped = withCurly[0][1].replace(/’/g, "'");
    expect(CHAPTERS.some((c) => c.includes(retyped))).toBe(false);
  });

  it('PROVEN TO CATCH: a reordered span of the same chapter is not contiguous', () => {
    const fourteen = bookOf('Luke').chapters[13];
    const reordered = [fourteen[31], fourteen[27]].join(' ');
    expect(CHAPTERS.some((c) => c.includes(reordered))).toBe(false);
  });

  it('PROVEN TO CATCH, SCOPED TO THIS RECORD: altering Luke 14:28 inside sov78 fails, and the scope is why', () => {
    // The DR-1146 lesson in miniature: Luke 14:28 occurs in other lessons too,
    // so a file-scoped check would pass on somebody else's copy. Decide by
    // exact identity inside THIS module.
    const real = 'sitteth not down first, and counteth the cost';
    expect(M.lesson).toContain(real);
    const mutated = M.lesson.replace(real, 'sitteth not down first, and considers the cost');
    const mutatedSpans = [...mutated.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(mutatedSpans.filter((s) => !CHAPTERS.some((c) => c.includes(s))).length).toBeGreaterThan(0);
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
    const missing = [...declared()].filter((r) => !all.includes(`(${r})`));
    expect(missing).toEqual([]);
  });

  it('every reference it declares resolves in the corpus on disk', () => {
    for (const r of declared()) {
      const m = /^(.+?)\s+(\d+):(\d+)$/.exec(r);
      expect(m, r).toBeTruthy();
      const b = m[1] === 'Psalm' ? 'Psalms' : m[1];
      expect(bookOf(b).chapters[Number(m[2]) - 1][Number(m[3]) - 1], r).toBeTruthy();
    }
  });

  it('no verse quoted in a reader place is missing from anchor.ref', () => {
    const quotedRefs = new Set(
      Object.values(TEXTS())
        .flatMap((t) => [...String(t).matchAll(/" \(([1-3]?\s?[A-Z][a-z]+ \d+:\d+)\)/g)].map((m) => m[1]))
        .map(normaliseRef)
    );
    function normaliseRef(r) {
      return r.trim();
    }
    const undeclared = [...quotedRefs].filter((r) => !declared().has(r));
    expect(undeclared).toEqual([]);
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
    expect(g.child, `child ${g.child}`).toBeLessThanOrEqual(5.0);
    expect(g.teen, `teen ${g.teen}`).toBeLessThanOrEqual(6.0);
    expect(g.senior, `senior ${g.senior}`).toBeLessThanOrEqual(10.0);
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
    for (const b of FOUR_BANDS) {
      expect(M.levels[b].slice(0, 200), b).toMatch(/Count the cost/);
    }
  });
});

describe('TALK ABOUT IT TOGETHER, in the lesson AND in every band (DR-0733 / DR-0795)', () => {
  const places = () => ({ lesson: M.lesson, ...M.levels });

  it('every place carries the heading', () => {
    for (const [p, t] of Object.entries(places())) {
      expect(String(t), p).toContain('TALK ABOUT IT TOGETHER');
    }
  });

  it('every place sends the reader to parents, to children and to a friend', () => {
    expect(hasAllThree(M)).toBe(true);
    expect(placesMissingDirections(M)).toEqual([]);
  });

  it('every place carries the skill and the rhythm in the lesson’s own words', () => {
    for (const [p, t] of Object.entries(places())) {
      const s = String(t);
      expect(s, `${p} must carry listening to the end`).toMatch(/listen all the way to the end/i);
      expect(s, `${p} must have them retell it`).toMatch(/retell|say it back|tell it back/i);
      expect(s, `${p} must teach one verse back`).toMatch(/teach (?:them|each other) one verse/i);
      expect(s, `${p} must carry the four places of Deuteronomy 6:7`).toMatch(/four places of Deuteronomy 6:7/);
      expect(s, `${p} must carry the one friend this week`).toMatch(/one friend this week/i);
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

describe('the teaching itself: eight movements, each from the Word', () => {
  const THREADS = [
    [/counteth the cost|count the cost|count first/i, 'count the cost first'],
    [/prudent|foreseeth the evil|sees trouble coming|wise man/i, 'the prudent man foresees'],
    [/watchman/i, 'the watchman and the trumpet'],
    [/servant to the lender|owes is a servant|who gets a (?:vote|say)/i, 'the borrower is servant'],
    [/surety|suretiship|snared with the words/i, 'surety snares by your own mouth'],
    [/make us a name|a name\. The tower|wanted to be famous/i, 'Babel built for a name'],
    [/builder and maker|whose builder|except the LORD build|Yahweh does not build/i, 'the city whose builder is Yahweh'],
    [/take thine ease|rich toward|required of thee/i, 'the rich fool'],
    [/two witnesses|one voice does not|one witness/i, 'one witness establishes nothing'],
    [/covetousness|a gift doth blind|a gift makes a wise man blind|gift blinds/i, 'hating covetousness'],
    [/openeth, and no man shutteth|holds that (?:same )?key|not sovereignty|not the throne/i, 'governance is not sovereignty'],
    [/Build ye houses|Build houses|build, dwell, plant|Build\. Dwell\. Plant/i, 'build and dwell and plant'],
    [/founded upon a rock|on rock|two builders|Both built/i, 'the two builders in one storm'],
  ];

  it('every reader place carries all thirteen threads', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const missing = THREADS.filter(([re]) => !re.test(String(t))).map(([, n]) => n);
      expect(missing, `${band} is missing`).toEqual([]);
    }
  });

  it('PROVEN TO CATCH: a band with one thread stripped fails by name', () => {
    const stripped = M.levels.child.replace(/watchman/gi, 'guard');
    expect(stripped).not.toBe(M.levels.child);
    const missing = THREADS.filter(([re]) => !re.test(stripped)).map(([, n]) => n);
    expect(missing).toContain('the watchman and the trumpet');
  });

  it('the counterweight on debt is kept in every band, so it is not a slogan', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must keep that a vow is still owed`).toMatch(/sweareth to his own hurt|still owed|a promise is a promise|did not change/i);
    }
  });

  it('the sharpest word is turned on this house too, not only on a company (Psalm 127:1)', () => {
    expect(M.lesson).toMatch(/in vain/i);
    expect(M.lesson).toMatch(/[Ww]asted/);
    expect(M.lesson).toMatch(/We build in this house too|applies to us and not only to a company/i);
  });

  it('the bright line is kept in every band: governance is not sovereignty, and the key is Jesus’', () => {
    for (const [band, t] of Object.entries(TEXTS())) {
      const s = String(t);
      expect(s, `${band} must keep the ceiling over every charter`).toMatch(/not sovereignty|not the throne|rules are not Yahweh/i);
      expect(s, `${band} must close on Jesus as the foundation`).toMatch(/Lamb of Yahweh/);
    }
  });

  it('we teach the Word rather than debate it (DR-0098): the critics are named to educate past them, not staged as co-equal', () => {
    // The critics' objection appears, and the Word's own answer is given in the
    // same place -- never "here are two views, you decide".
    expect(M.lesson).toMatch(/[Cc]ritics/);
    expect(M.lesson).toMatch(/we will say that plainly rather than hedge/i);
  });

  it('the quiz tests the frame, the corrections and the bright lines', () => {
    const qs = M.quiz.questions.map((q) => `${q.q} ${q.options.join(' ')} ${q.explain}`).join(' ');
    expect(qs).toMatch(/first/i);
    expect(qs).toMatch(/conditions of peace/i);
    expect(qs).toMatch(/servant to the lender/i);
    expect(qs).toMatch(/make us a name/i);
    expect(qs).toMatch(/in vain/i);
    expect(qs).toMatch(/one voice does not establish/i);
  });
});

describe('the house typography holds', () => {
  it('the adversary is never capitalised anywhere in the module', () => {
    for (const s of allStrings(M)) {
      expect(s, s.slice(0, 60)).not.toMatch(/\bSatan\b|\bLucifer\b|\bThe Devil\b|\bBaal\b/);
    }
  });

  it('our own voice says Yahweh, and quoted Scripture is left exactly as it is', () => {
    expect(M.lesson).toMatch(/Yahweh/);
    for (const [band, t] of Object.entries(TEXTS())) {
      expect(String(t), `${band} must say Yahweh in our own voice`).toMatch(/Yahweh/);
      const quoted = [...String(t).matchAll(/"([^"]+)"/g)].map((m) => m[1]).join(' ');
      expect(quoted, `${band}: a quotation must never have Yahweh substituted into it`).not.toMatch(/Yahweh/);
    }
  });

  it('PROVEN TO CATCH: substituting Yahweh into a quoted verse fails (the DR-0076 bright line)', () => {
    const quoted = [...M.lesson.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    const withGod = quoted.find((s) => /\bGod\b/.test(s));
    expect(withGod, 'the lesson must quote at least one verse carrying God').toBeTruthy();
    const corrupted = withGod.replace(/\bGod\b/, 'Yahweh');
    expect(CHAPTERS.some((c) => c.includes(corrupted))).toBe(false);
  });

  it('the Word is capitalised where it names the Scriptures, and His pronouns follow', () => {
    expect(M.lesson).toMatch(/\bthe Word\b/);
    for (const s of allStrings(M)) expect(s, s.slice(0, 60)).not.toMatch(/\bthe word of Yahweh\b/);
  });

  // CAUGHT BY CI, NOT BY THIS FILE, AND WIDENED HERE BECAUSE OF IT (DR-0239).
  // The first version of this check read the adult lesson and the four bands
  // only -- the same narrowness that let Revelation go unswept -- so it passed a
  // bigIdea that recited two decision records. The curriculum course-quotation
  // gate caught it (`sov78-count-the-cost :: bigIdea :: recites a decision
  // record`), which is the right instrument doing its job and the wrong place
  // for this lesson to learn it. Now it reads EVERY string in the module.
  it('no decision-record number is recited anywhere a reader can see it', () => {
    const offenders = allStrings(M)
      .filter((t) => /DR-\d{3,4}/.test(t))
      .map((t) => `${(t.match(/DR-\d{3,4}/g) || []).join(',')} in: ${t.slice(0, 70)}`);
    expect(offenders).toEqual([]);
  });

  it('PROVEN TO CATCH: a recited decision record in a field other than a band fails', () => {
    const broken = { ...M, bigIdea: `${M.bigIdea} Recorded as DR-1470.` };
    const offenders = allStrings(broken).filter((t) => /DR-\d{3,4}/.test(t));
    expect(offenders.length).toBeGreaterThan(0);
    expect(allStrings(M).filter((t) => /DR-\d{3,4}/.test(t))).toEqual([]);
  });

  it('our own prose spells American EVERYWHERE in the module, while the KJV’s spellings inside a quote are untouched', () => {
    // THE KNOWN GATE GAP, CLOSED FOR THIS RECORD AND WIDER THAN SOV77's.
    // american-spelling.test.js reads only living-lessons-class.js, so a course
    // file's British spelling passes green. sov77's own version of this check
    // reads the adult lesson and the four bands ONLY -- and sov77 ships
    // "favourable" in a story title, which is exactly the hole that leaves
    // (recorded in DR-1470, `re-review: 2026-11-27`). This one reads EVERY
    // string in the module -- bigIdea, inApp, anchor, rpe, benefits, stories,
    // quiz, facilitator and all five reader places -- with the quotations
    // removed, so honour, neighbour, favour and laboured are left exactly where
    // the corpus wrote them.
    const BRITISH =
      /\b(memorise|summaris\w*|capitalis\w*|realis\w*|generalis\w*|formalis\w*|organis\w*|recognis\w*|analyse\w*|analysed|colour\w*|favour\w*|honour\w*|labour\w*|neighbour\w*|behaviour\w*|centre|centres|metre|metres|defence|offence|licence|programme|counsellor|counsellors|catalogue|whilst|amongst|judgement|manoeuvre|learnt|modelling|per cent)\b/i;
    const offenders = allStrings(M)
      .map((s) => [s, s.replace(/"[^"]*"/g, ' ').match(BRITISH)])
      .filter(([, hit]) => hit)
      .map(([s, hit]) => `${hit[0]} in: ${s.slice(0, 70)}`);
    expect(offenders).toEqual([]);
  });

  it('PROVEN TO CATCH: a British spelling in our own prose fails, and the same word inside a quote does not', () => {
    const BRITISH = /\b(favour\w*|honour\w*|labour\w*)\b/i;
    const ours = 'We took a more favourable reading of the filing.';
    expect(BRITISH.test(ours.replace(/"[^"]*"/g, ' '))).toBe(true);
    const inQuote = 'As it is written, "In whose eyes a vile person is contemned; but he honoureth them that fear the LORD."';
    expect(BRITISH.test(inQuote.replace(/"[^"]*"/g, ' '))).toBe(false);
  });
});

describe('the illustrations are invented people, and say so', () => {
  it('two stories, each marked illustrative, and neither names a member', () => {
    expect(M.stories).toHaveLength(2);
    for (const s of M.stories) {
      expect(s.body, s.title).toMatch(/ILLUSTRATIVE, NOT A REAL EVENT/);
      expect(s.body.length, s.title).toBeGreaterThan(400);
      expect(s.body, s.title).not.toMatch(/Darrell|Bishop|Gwin/);
    }
  });

  // CAUGHT BY CI, NOT BY THIS FILE (DR-0239). The first draft gave both stories
  // `kind: 'example'`, and lesson-completeness counts a story only when its kind
  // is 'parable' or 'testimony' -- so the lesson read as carrying ZERO stories
  // against a MIN_STORIES of 2, and `shortOfStories` named it. The field is now
  // asserted here by the same rule the census uses, because "two stories" is
  // only true if the house counts them.
  it('both stories carry a kind the completeness census actually counts', () => {
    expect(storyCount(M), 'storyCount must see both stories').toBe(2);
    expect(storyCount(M)).toBeGreaterThanOrEqual(MIN_STORIES);
    for (const s of M.stories) expect(['parable', 'testimony'], s.title).toContain(s.kind);
  });

  it('PROVEN TO CATCH: a story whose kind the census does not count reads as missing', () => {
    const broken = { ...M, stories: M.stories.map((s) => ({ ...s, kind: 'example' })) };
    expect(storyCount(broken)).toBe(0);
    expect(storyCount(broken)).toBeLessThan(MIN_STORIES);
  });
});
