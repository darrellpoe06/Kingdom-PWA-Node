// =============================================================================
// project-management-pm16-verses — the gate for pm16, "Divers weights in the bag"
// =============================================================================
// WHO TAUGHT THIS: NOBODY. Gmail thread `1a17ed862dc396be`, a Retail Dive send
// forwarded out of Darrell's university mailbox on 2026-10-27 at 19:31 UTC with
// ONE LINE typed above the forwarded header: `Lesson and research and
// implementation of the research.` The third word in that line is what the hour
// is for — he did not ask for a summary, he asked what we DO.
//
// THE SEND IS AN ADVERTISEMENT AND SAYS SO ITSELF: "Custom content by Studio
// ... created by members of the Studio Expert Network for a sponsor of our
// publication." The sponsor sells payment systems.
//
// ITS GATED REPORT WAS NEVER READ, AND NOTHING FROM IT IS ASSERTED. Opening it
// means handing a vendor a real person's name, employer and job title. So the
// survey of 100+ retail leaders it advertises is quoted nowhere, summarised
// nowhere and relied on nowhere (DR-0076: never assert the unverified). Exactly
// ONE claim in the email stands without that report, and it is the lesson:
// customers expect one message across every channel, and they NOTICE when it is
// absent. The checks below hold that limit in place.
//
// THE SEAM WAS CHOSEN BY MEASUREMENT (DR-0610), not by taste: pm14 already
// teaches WHICH measure, pm12 capability over titles, pm15 proximity to the
// work. None of them teaches the SAME measure in every place, which is what
// Deuteronomy 25:13-14 is about — not one bad weight but TWO, a great and a
// small, one in the bag and one in the HOUSE, so which standard you met
// depended on WHERE you met him. That relocation is what makes an ancient
// commandment a lesson about channels.
//
// THE HOUSE'S OWN WITNESS IS FIRST-PARTY AND CHECKABLE, which is the whole
// reason it is in here rather than a vendor's survey: on the day this lesson
// was written this platform was caught carrying two standards itself, and the
// repair is the teaching — the bar was made to READ the one rule rather than be
// handed a corrected second list.
//
// EVERY VERSE WAS FILLED FROM app/public/bible/kjv RATHER THAN TYPED (DR-0456)
// AND CARRIES ITS REFERENCE BESIDE IT (DR-0402, relearned on sov73, where every
// verse was verbatim but lesson-completeness still counted the lesson short of
// the Word because the references sat in the surrounding prose). The sweep below
// re-derives both from disk instead of trusting the generator.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_MANAGEMENT_MODULES } from '../lib/project-management-course.js';
import { fourBandFaults, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import { hasAllThreeEverywhere, placesMissingDirections } from '../lib/talk-together.js';
import { quotesTheWord, storyCount, lessonBodies } from '../lib/lesson-completeness.js';

const ID = 'pm16-divers-weights-in-the-bag';
const THREAD = '1a17ed862dc396be';
const M = PROJECT_MANAGEMENT_MODULES.find((m) => m.id === ID);

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
 *  so a CONTIGUOUS range is a substring while a reordered or cross-chapter span
 *  is not. */
const CHAPTERS = ['Deuteronomy', 'Psalms', 'Proverbs', 'Matthew', 'Luke', '2 Corinthians', 'Hebrews', 'James'].flatMap((b) =>
  bookOf(b).chapters.map((ch) => ch.join(' '))
);

const TEXTS = () => ({ adult: M.lesson, ...M.levels });

describe('pm16 exists and is whole', () => {
  it('the module is in the course with all four bands and an adult lesson', () => {
    expect(M, `${ID} must be in PROJECT_MANAGEMENT_MODULES`).toBeTruthy();
    for (const b of FOUR_BANDS) expect(M.levels[b], b).toBeTruthy();
    expect(M.lesson.length).toBeGreaterThan(5000);
  });

  it('it names the thread it was built from, so the repo is a second witness (DR-0076 §8)', () => {
    expect(M.bigIdea).toContain(THREAD);
  });

  it('it says plainly that nobody taught it', () => {
    expect(M.bigIdea).toMatch(/WHO TAUGHT THIS: NOBODY/);
    expect(M.lesson).toMatch(/WHO TAUGHT THIS: NOBODY/);
  });
});

describe('every quoted span is verbatim the KJV on disk', () => {
  // A SCRIPTURE span is a quotation followed by its reference. The first draft
  // of this sweep treated EVERY double-quoted span as a verse and duly reported
  // seven failures that were ordinary prose in quotation marks ("this is the
  // church", "do these use the same sentences?"). A gate that fires on correct
  // prose teaches you to ignore it, so it now matches what it actually means to
  // check — and the reference is guaranteed to be there by DR-0402, which the
  // generator enforces and the final check in this block re-proves.
  const SCRIPTURE = /"([^"]+)"\s*\(((?:[1-3]\s)?[A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*\s\d+:\d+(?:-\d+)?)\)/g;
  const spans = () => Object.entries(TEXTS()).flatMap(([band, t]) => [...String(t).matchAll(SCRIPTURE)].map((m) => [band, m[1], m[2]]));

  it('the sweep looks at a real number of spans, so it cannot pass by checking nothing', () => {
    // ll300's first sweep read the wrong field, examined NOTHING, and printed
    // "0 mismatches". A check that cannot fail is a lie (DR-0076 §3).
    expect(spans().length).toBeGreaterThan(25);
  });

  it('every band carries Scripture of its own, so none can pass on the adult lesson’s back', () => {
    const byBand = {};
    for (const [band] of spans()) byBand[band] = (byBand[band] || 0) + 1;
    for (const band of ['adult', ...FOUR_BANDS]) {
      expect(byBand[band] || 0, `${band} quotes no Scripture with a reference`).toBeGreaterThan(0);
    }
  });

  it('each span is a contiguous span of its own chapter', () => {
    const bad = spans().filter(([, s]) => !CHAPTERS.some((c) => c.includes(s)));
    expect(bad.map(([b, s]) => `${b}: ${s.slice(0, 70)}`)).toEqual([]);
  });

  it('PROVEN TO CATCH: one altered word in a quoted span is rejected', () => {
    const [, first] = spans()[0];
    const broken = first.replace(/\b(\w+)\b/, 'notaword');
    expect(broken).not.toBe(first);
    expect(CHAPTERS.some((c) => c.includes(broken))).toBe(false);
  });

  it('PROVEN TO CATCH: the DR-0456 apostrophe class — an ASCII apostrophe where the corpus has U+2019', () => {
    // None of the verses THIS lesson happens to quote carries a curly
    // apostrophe, and demanding that it did would be a check about which verses
    // were chosen rather than about the sweep. So the class is proved against
    // the corpus itself: take a real verse that does carry U+2019, retype it
    // the way a hand would, and show the sweep above would no longer match it.
    const curly = CHAPTERS.find((c) => c.includes('’'));
    expect(curly, 'the KJV corpus on disk must carry U+2019 somewhere').toBeTruthy();
    const i = curly.indexOf('’');
    const real = curly.slice(Math.max(0, i - 40), i + 40);
    expect(CHAPTERS.some((c) => c.includes(real))).toBe(true);
    const retyped = real.replace(/’/g, "'");
    expect(retyped).not.toBe(real);
    expect(CHAPTERS.some((c) => c.includes(retyped))).toBe(false);
  });

  it('EVERY body hands the reader a verse WITH its reference, not merely a pointer (DR-0402)', () => {
    // sov73 quoted every verse verbatim and was still reported short of the
    // Word, because the references sat in the prose around the quotation. Here
    // the per-module gate is not enough: all five bodies are asserted.
    const bodies = lessonBodies(M);
    expect(bodies.length).toBe(5);
    const short = bodies.filter((b) => !quotesTheWord({ lesson: b }));
    expect(short.length, 'a band quotes Scripture without its reference beside it').toBe(0);
  });
});

describe('the four bands clear the gate, measured not claimed', () => {
  it('shares, ladder, child ceiling and differentiation all pass', () => {
    expect(fourBandFaults(M)).toEqual([]);
  });

  it('the ladder is monotone, child is under its ceiling and teen under 6', () => {
    const t = TEXTS();
    expect(fk(t.child)).toBeLessThan(fk(t.youth));
    expect(fk(t.youth)).toBeLessThan(fk(t.teen));
    expect(fk(t.teen)).toBeLessThanOrEqual(fk(t.senior));
    expect(fk(t.child)).toBeLessThanOrEqual(5.0);
    expect(fk(t.teen)).toBeLessThanOrEqual(6.0);
  });

  it('no band is a truncation or a re-wording of another', () => {
    const t = TEXTS();
    const keys = Object.keys(t);
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        expect(overlapOf(t[keys[i]], t[keys[j]]), `${keys[i]} vs ${keys[j]}`).toBeLessThan(0.25);
      }
    }
  });

  it('every band sends the reader to parents, to children AND to a friend (DR-0795)', () => {
    // pm16's elder sibling spm11 and sov73 BOTH shipped this missing and were
    // caught by CI rather than by reading. It is asserted here at the source.
    expect(placesMissingDirections(M)).toEqual([]);
    expect(hasAllThreeEverywhere(M)).toBe(true);
  });
});

describe('the seam is the one the course has not already taught', () => {
  it('it names the neighbours it is NOT re-teaching', () => {
    expect(M.bigIdea).toMatch(/pm14/);
    expect(M.bigIdea).toMatch(/pm12/);
    expect(M.bigIdea).toMatch(/pm15/);
  });

  it('the landing is plurality — two measures — and not merely honesty', () => {
    expect(M.lesson).toMatch(/TWO weights|two weights|divers weights/i);
    expect(M.lesson).toMatch(/in the bag[\s\S]{0,400}in the house|bag[\s\S]{0,200}house/i);
  });
});

describe('the source is handled honestly', () => {
  it('the send is named as an advertisement, in the lesson itself', () => {
    expect(M.lesson).toMatch(/advertisement/i);
    expect(M.lesson).toMatch(/Custom content by Studio/);
  });

  it('the gated report is said to be UNREAD, and none of its findings are asserted', () => {
    expect(M.lesson).toMatch(/never read|was not read|NEVER READ/i);
    expect(M.bigIdea).toMatch(/NEVER READ/i);
    // the survey is the thing most easily smuggled in as fact
    expect(M.lesson).toMatch(/not quoted here|quoted nowhere|is not quoted/i);
  });

  it('who gains is named rather than argued, since the profit motive is taught elsewhere', () => {
    expect(M.lesson).toMatch(/sponsor|sells payment systems|payment systems/i);
  });

  it('the house names its OWN failure, by name, rather than only the retailer’s', () => {
    expect(M.lesson).toMatch(/Love Corner/);
    expect(M.lesson).toMatch(/this house was caught|caught doing it|our own/i);
  });
});

describe('the house typography holds', () => {
  it('the adversary is never capitalised anywhere in the module', () => {
    for (const s of allStrings(M)) {
      expect(s, s.slice(0, 60)).not.toMatch(/\bSatan\b|\bLucifer\b|\bThe Devil\b/);
    }
  });

  it('our own voice says Yahweh, and quoted Scripture is left exactly as it is', () => {
    // The corpus writes "God" and "the LORD" inside quotations; that must never
    // be rewritten (DR-0076 bright line), so the check is only that our prose
    // uses His name.
    expect(M.lesson).toMatch(/Yahweh/);
    const quoted = [...M.lesson.matchAll(/"([^"]+)"/g)].map((m) => m[1]).join(' ');
    expect(quoted, 'a quotation must never have Yahweh substituted into it').not.toMatch(/Yahweh/);
  });
});

describe('the parables are invented people', () => {
  it('two stories, and neither names a member', () => {
    expect(storyCount(M)).toBe(2);
    expect(M.stories).toHaveLength(2);
    for (const s of M.stories) {
      expect(s.kind).toBe('parable');
      expect(s.body.length).toBeGreaterThan(400);
    }
  });
});
