// @vitest-environment node
// =============================================================================
// spm12 — the button you turn on: the few lines of code that hand you a
// standing obligation
// =============================================================================
// Lesson 12 of Software Project Management: Prove It, built 2026-11-06 from an
// IT Brew (Morning Brew) issue of 2026-10-22 that Darrell forwarded with the
// single word Lessons (Gmail thread `1a16435ca2019031`, 15:23). Recorded as
// DR-1366.
//
// WHO WROTE THE SOURCE: NOT US, AND NOT HIM. The issue is a trade publication's
// own reporting, and the words the lesson leans on belong to three named people
// that publication interviewed — Aaron Hutten (CTO, Studio Science), Stefan
// Ristic (WordPress security specialist) and Brent Neal (CISO, RapidScale).
// Darrell forwarded it; he did not write it, we are not the publisher, and no
// sentence may imply either. The checks below hold that, because an attribution
// error in a teaching artifact is not a typo — it is a false claim about a real
// party, three of them here rather than one.
//
// THE READ WAS NOT INDEPENDENT, AND THAT IS ASSERTED RATHER THAN HOPED (DR-0190
// §6, DR-0076 §8). Both publisher hosts refused to resolve from this session:
// `www.itbrew.com` and `www.morningbrew.com`, each with
// `getaddrinfo ENOTFOUND`. So every external claim is ATTRIBUTED — reported as
// the publication reported it — and the teaching rests on the Word and on this
// house's own written record, never on an unchecked outside fact. The cases
// below refuse any sentence that would assert one on our own authority.
//
// WHAT THIS FILE EXISTS TO PROTECT, in the order the failures would cost most:
//
//   1. THE SOURCE'S WORDS ARE NOT SCRIPTURE AND MUST NOT WEAR ITS CLOTHES.
//      Inside a verbatim-gated module a double quote means the Word and
//      nothing else (SCRIPTURE-REFERENCE-STANDARD, the DR-0314 section). This
//      lesson carries three interviewees' framings, so the pull toward putting
//      their clauses in quotation marks is unusually strong. Every
//      double-quoted span in every field — the four bands included, which the
//      course-wide gate does not read — is resolved against
//      app/public/bible/kjv at test time. Their words are reported in our own
//      voice, unquoted, always.
//   2. THE SHAPE ITSELF, WHICH IS THE WHOLE TEACHING. Three items, one shape:
//      the small addition creates a standing obligation (Deuteronomy 22:8,
//      Exodus 21:33-34, Exodus 22:6), it works until the day it is asked for
//      more than it can serve (Genesis 13:6, Luke 5:6), and a practice can
//      outgrow the hand that ran it (Exodus 18:17-18, with the remedy in
//      18:21-22). A lesson that quoted those and never reasoned them would be
//      hollow (DR-0281 / DR-0381), so each is pinned by its reasoning and not
//      only by its reference.
//   3. ITS THREE NEIGHBOURS, HELD APART BY ID. spm8 is debt a borrower names
//      and dates. spm11 is the version left out of support, whose due date
//      belonged to a maintainer. spm12 is the thing you switched on, which is
//      now yours to carry. Three different clocks; one lesson each.
//   4. THE OVER-CLAIM, AND THE ADVERTISEMENT. The issue also carried a
//      sponsored item about AI-agent traffic. It is an advertisement for a
//      report, it bears on no part of this teaching, and nothing of it is here
//      — asserted below so a later edit cannot quietly import it.
//
// Every pin is re-read from the corpus on disk, so this file cannot drift from
// the text either. Two readings in this corpus differ from the familiar ones
// and were caught by reading rather than recalling: Exodus 18:18 ends
// "thyself alone" with NO comma, and Proverbs 20:25 reads "to the man who
// devoureth" rather than "to a man to devour". A pin typed from memory would
// have been wrong twice — the exact defect the verbatim discipline exists to
// stop.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOFTWARE_PM_MODULES, SOFTWARE_PM_META } from '../lib/software-project-management-course.js';
import { scanQuotedVerses, describeFault } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';
import { hasAllThreeEverywhere, placesMissingDirections, ownPrompts, talkTogetherFor } from '../lib/talk-together.js';
import { censusLesson } from '../lib/library-census.js';
import { fourBandFaults, LADDER, fk, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const SPM12 = 'spm12-the-button-you-turn-on';
const M = () => SOFTWARE_PM_MODULES.find((m) => m.id === SPM12);

// ---------------------------------------------------------------------------
// The corpus, read from disk, compared STRICTLY
// ---------------------------------------------------------------------------
// Whitespace-only normalisation (DR-0456). Apostrophes are never normalised:
// the corpus carries U+2019 and a straight quote must never pass for His text.
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const books = new Map();
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

/** One verse, or a joined range, exactly as the corpus has it. */
function verses(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?$/.exec(String(ref).trim());
  if (!m) return null;
  const key = m[1].replace(/\s+/g, '');
  if (!books.has(key)) {
    try {
      books.set(key, JSON.parse(readFileSync(join(KJV, `${key}.json`), 'utf8')));
    } catch {
      books.set(key, null);
    }
  }
  const bk = books.get(key);
  const chap = bk && bk.chapters[Number(m[2]) - 1];
  if (!chap) return null;
  const out = [];
  for (let n = Number(m[3]); n <= Number(m[4] || m[3]); n += 1) {
    if (chap[n - 1] == null) return null;
    out.push(chap[n - 1]);
  }
  return out.join(' ');
}

// Every reference the lesson names, anywhere in its own text — the only verses
// it is allowed to quote from.
const REF = /([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+(?:\s*-\s*\d+)?)/g;

/** Every authored string of the lesson, including the bands and the quiz. */
const fields = (m) => [
  ['title', m.title],
  ['bigIdea', m.bigIdea],
  ['inApp', m.inApp],
  ['anchor.ref', m.anchor.ref],
  ['anchor.theme', m.anchor.theme],
  ...m.benefits.map((b, i) => [`benefits[${i}]`, b]),
  ...FOUR_BANDS.map((b) => [`levels.${b}`, m.levels[b]]),
  ...m.quiz.questions.flatMap((q, i) => [
    [`quiz[${i}].q`, q.q],
    ...q.options.map((o, j) => [`quiz[${i}].options[${j}]`, o]),
    [`quiz[${i}].explain`, q.explain],
  ]),
];

const allText = (m) =>
  fields(m)
    .map(([, t]) => t)
    .join('\n');

/** The pool of verse text this lesson may quote from. */
function pool(m) {
  const text = allText(m);
  const out = [];
  REF.lastIndex = 0;
  let x;
  while ((x = REF.exec(text))) {
    const v = verses(`${x[1].trim()} ${x[2]}:${x[3].replace(/\s+/g, '')}`);
    if (v != null) out.push(v);
  }
  return norm(out.join('  ~~  '));
}

// The spine, re-read at test time. The VALUE is never typed here; only the
// reference and the fragment the lesson leans on, so a pin cannot assert a
// verse text from memory.
const SPINE = {
  'Deuteronomy 22:8': 'then thou shalt make a battlement for thy roof',
  'Exodus 21:33': 'And if a man shall open a pit, or if a man shall dig a pit, and not cover it',
  'Exodus 21:34': 'The owner of the pit shall make it good',
  'Exodus 22:6': 'he that kindled the fire shall surely make restitution',
  'Genesis 13:6': 'And the land was not able to bear them',
  'Exodus 18:18': 'this thing is too heavy for thee; thou art not able to perform it thyself alone',
  'Exodus 18:21': 'to be rulers of thousands, and rulers of hundreds, rulers of fifties, and rulers of tens',
  'Exodus 18:22': 'every great matter they shall bring unto thee, but every small matter they shall judge',
  'Proverbs 20:25': 'and after vows to make enquiry',
  'Luke 5:6': 'their net brake',
};

describe('spm12 is the twelfth lesson of the course, and the course counts itself', () => {
  // AMENDED BY DR-1363's GUARD, THE FIFTH INSTANCE OF ONE CLASS IN ONE DAY.
  // This case pinned SOFTWARE_PM_MODULES.length to 12 and asserted spm12 is
  // LAST -- both of which say nothing will ever follow spm12, which only a
  // thirteenth lesson can falsify. It is worth reading how it got here: spm12's
  // own build FIXED this exact defect in spm11's gate hours earlier, and that
  // amendment's comment says the total and "which lesson is last" now "belong
  // to whichever lesson is last, and spm12's own gate holds them there." That
  // sentence is the defect being handed forward rather than removed. A
  // per-lesson gate is never the right holder for the course's size, because
  // every lesson is last exactly until the next one lands.
  //
  // So the pins move to what they actually meant and what stays true for good:
  // spm12 exists, it sits at INDEX 11 (the twelfth), and the week count is
  // still derived from the array (DR-0677). The course's total and contiguity
  // belong to the course-level gate, where "this course has N lessons" is a
  // claim about a finished course rather than a promise about the future.
  // Nothing spm12 protects was weakened: every other case here is untouched.
  it('the lesson exists, is the twelfth, and the week count is derived rather than pinned', () => {
    expect(M(), 'spm12 is not in SOFTWARE_PM_MODULES').toBeTruthy();
    expect(SOFTWARE_PM_MODULES.length, 'the course may grow, but never shrink past spm12').toBeGreaterThanOrEqual(12);
    expect(SOFTWARE_PM_MODULES.findIndex((m) => m.id === SPM12), 'spm12 is the TWELFTH lesson').toBe(11);
    // DR-0677: weeks is a getter over the array, so a new lesson edits no count.
    expect(SOFTWARE_PM_META.weeks).toBe(SOFTWARE_PM_MODULES.length);
  });

  it('the course numbers run spm1..spm12 with no gap and no repeat', () => {
    // CONTIGUITY MEASURED, NOT TRUSTED. The build brief asserted eleven
    // contiguous modules; this reads it off the array instead, so a future
    // insertion that skips or doubles a number is named here.
    const nums = SOFTWARE_PM_MODULES.map((m) => Number(/^spm(\d+)-/.exec(m.id)[1]));
    expect(nums).toEqual(Array.from({ length: SOFTWARE_PM_MODULES.length }, (_, i) => i + 1));
  });

  it('carries every field a lesson page renders, four bands included', () => {
    const m = M();
    expect(m.title.length).toBeGreaterThan(20);
    expect(m.bigIdea.length).toBeGreaterThan(200);
    expect(m.inApp.length).toBeGreaterThan(100);
    expect(m.anchor.theme.length).toBeGreaterThan(80);
    expect(m.benefits.length).toBeGreaterThanOrEqual(3);
    for (const b of FOUR_BANDS) expect(m.levels[b], `${b} band missing`).toBeTruthy();
    expect(m.quiz.questions.length).toBe(3);
    for (const q of m.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain, 'an unexplained answer teaches nothing').toBeTruthy();
    }
  });

  it('is on the four-band ladder the course answers to, and names itself in every band', () => {
    // This course has no adult `lesson` field, so there is no denominator for
    // the share floors and no teen/senior ceiling is imposed — exactly the
    // ladder four-band-group-c.test.js applies to it, restated here so spm12
    // is measured on its own rather than only in a course-wide sweep.
    const noAdult = {
      ...LADDER,
      teenCeiling: Infinity,
      seniorCeiling: Infinity,
      floor: { child: 0, youth: 0, teen: 0, senior: 0 },
    };
    const m = M();
    expect(fourBandFaults(m, noAdult)).toEqual([]);
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(m.levels[b])]));
    expect(g.child, 'the child band must read easiest').toBeLessThan(g.youth);
    expect(g.youth).toBeLessThan(g.teen);
    expect(g.teen).toBeLessThan(g.senior);
    expect(g.child, `child grade ${g.child} over the new-lesson ceiling`).toBeLessThanOrEqual(LADDER.childCeiling);
    for (const b of FOUR_BANDS) expect(namesItsLesson(m.title, m.levels[b]), `${b} never names its lesson`).toBe(true);
  });
});

describe('every quotation is the Word, verbatim from the corpus on disk', () => {
  it('every reference the lesson names resolves, and the anchor is the spine', () => {
    const m = M();
    for (const r of m.anchor.ref
      .split(';')
      .map((x) => x.trim())
      .filter(Boolean)) {
      expect(verses(r), `anchor reference ${r} does not resolve`).not.toBeNull();
    }
    // The anchor names the five the lesson is built on; the rest are named in
    // the prose where they are used, which is what the pool reads.
    expect(m.anchor.ref.split(';').map((x) => x.trim())).toEqual(['Deuteronomy 22:8', 'Exodus 21:33-34', 'Exodus 22:6', 'Genesis 13:6', 'Exodus 18:17-18']);
    for (const ref of Object.keys(SPINE)) {
      expect(verses(ref), `${ref} does not resolve in the corpus`).not.toBeNull();
    }
  });

  it('every pinned fragment is in the verse it is pinned to', () => {
    // The pin is a fragment plus a reference; the VALUE comes off disk. If a
    // verse text here were typed from memory, this is where it fails — and it
    // would have, twice: Exodus 18:18's "thyself alone" carries no comma in
    // this corpus, and Proverbs 20:25 reads "to the man who devoureth".
    for (const [ref, fragment] of Object.entries(SPINE)) {
      expect(norm(verses(ref)).includes(norm(fragment)), `${ref} does not contain: ${fragment}`).toBe(true);
    }
  });

  it('EVERY double-quoted span in EVERY field is verbatim Scripture the lesson points at', () => {
    // Wider than the course-wide gate on purpose: it reads teen and senior
    // only, so the child and youth bands — the readers least able to check —
    // would have no whole-span cover without this.
    const m = M();
    const hay = pool(m);
    expect(hay.length, 'the pool is empty, so this check would pass on nothing').toBeGreaterThan(500);
    for (const [where, text] of fields(m)) {
      for (const x of String(text).matchAll(/"([^"]*)"/g)) {
        const q = norm(x[1]).replace(/[.,;:]+$/, '');
        expect(hay.includes(q), `${where}: "${x[1]}" is in quotation marks but is not verbatim in any verse this lesson names`).toBe(true);
      }
    }
  });

  it('every reference-tagged span is the verse it NAMES, with nothing shouted', () => {
    const scan = scanQuotedVerses([M()], (m) => fields(m));
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans, 'no field quotes the Word at all').toBeGreaterThanOrEqual(10);
  });

  it('no elision inside a quotation (DR-0459), and no straight apostrophe inside one', () => {
    for (const [where, text] of fields(M())) {
      for (const x of String(text).matchAll(/"([^"]*)"/g)) {
        expect(/\.\.\.|…/.test(x[1]), `${where}: an elision inside a quotation`).toBe(false);
        expect(x[1].includes("'"), `${where}: a straight apostrophe inside His words`).toBe(false);
      }
    }
  });
});

describe('every band sends the reader to someone (DR-0795)', () => {
  // spm11's builder shipped NONE of the three directions in ANY of its four
  // bands and CI caught it. A reader reads ONE band, so the rule is per band,
  // not per module. Checked here before the push rather than after it.
  it('the lesson and every band it ships send the reader all three ways', () => {
    expect(hasAllThreeEverywhere(M())).toBe(true);
    expect(placesMissingDirections(M())).toEqual([]);
  });

  it('the three directions are in the lesson’s OWN words, not the standing fallback', () => {
    const own = ownPrompts(M());
    expect(own.parents, 'no parents-to-children sentence of its own').toBeTruthy();
    expect(own.children, 'no children-to-parents sentence of its own').toBeTruthy();
    expect(own.friends, 'no friend-to-friend sentence of its own').toBeTruthy();
    expect(talkTogetherFor(M()).allOwn, 'the card would fall back to standing prompts').toBe(true);
  });

  it('the aim and the rhythm are carried, and the friend verse is the verse', () => {
    const s = `${M().levels.child}${M().levels.senior}`;
    expect(s).toMatch(/until we see that Yahweh has been right/);
    expect(s, 'the rhythm is Deuteronomy 6:7’s four places').toMatch(/at the table|four settings of Deuteronomy 6:7/);
    expect(norm(verses('Proverbs 27:17'))).toContain('Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.');
  });

  it('PROVEN TO CATCH: a band that drops its three directions is seen', () => {
    const stripped = { ...M(), levels: { ...M().levels, teen: M().levels.teen.split('\n\n')[0] } };
    expect(stripped.levels.teen, 'the break did not land').not.toBe(M().levels.teen);
    const gaps = placesMissingDirections(stripped);
    expect(
      gaps.map((g) => g.place),
      'a band sending the reader nowhere passed'
    ).toContain('teen');
  });
});

describe('the source is reported, never impersonated and never dressed as Scripture', () => {
  const REPORTED = [
    // The clauses the lesson leans on. Each must appear in our own voice and
    // OUTSIDE quotation marks, because a quotation mark here would read as the
    // Word saying it.
    /changes the nature of your business/i,
    /living and breathing entity/i,
    /basically clogged/i,
    /becoming unfeasible/i,
  ];

  it('the reported words are carried in our own voice, with none of them in quotation marks', () => {
    const text = allText(M());
    for (const re of REPORTED) expect(re.test(text), `the lesson never reports: ${re}`).toBe(true);
    const quoted = [...text.matchAll(/"([^"]*)"/g)].map((x) => x[1]).join(' ‖ ');
    for (const re of REPORTED) {
      expect(re.test(quoted), `a reported clause is inside quotation marks: ${re}`).toBe(false);
    }
  });

  it('all three interviewees are named with their own affiliation, and nothing more', () => {
    // The publication named them; the lesson attributes their words to them and
    // claims nothing else about any of them.
    const text = allText(M());
    expect(text).toMatch(/Aaron Hutten/);
    expect(text).toMatch(/Studio Science/);
    expect(text).toMatch(/Stefan Risti/);
    expect(text).toMatch(/Brent Neal/);
    expect(text).toMatch(/RapidScale/);
    expect(text, 'the publication is named as the place the words were reported').toMatch(/IT Brew/);
  });

  it('nobody here is credited with the source, and no reader is told it is ours', () => {
    const text = allText(M());
    expect(text).not.toMatch(/Darrell/);
    expect(text, 'we are not the publisher').not.toMatch(/our (own )?(newsletter|publication|interview|reporting)/i);
    expect(text, 'the lesson must not claim we lived any of these three').not.toMatch(/we (were|got) (hit|breached|clogged|overloaded)/i);
    expect(text, 'the nonprofit and its site are not ours').not.toMatch(/our (theatre|theater) nonprofit/i);
  });

  it('every external claim is ATTRIBUTED, and the read is admitted as not independent', () => {
    // DR-0190 §6 / DR-0100 tier 2. Both publisher hosts refused to resolve
    // from this session, so no claim of the issue may stand on our authority.
    const s = M().levels.senior;
    expect(s, 'the attribution must be stated where a reader meets it').toMatch(/attributed rather than asserted|was reported|as he put it/i);
    // BADLY-AIMED PIN, CORRECTED (spm7's own lesson). The first version of this
    // case demanded the exact words "not independently verified"; the band says
    // "neither was independently verified here", which is better English and
    // the same claim. The pin now holds the CLAIM in either phrasing rather
    // than one sentence's wording — a pin that forces the prose to match the
    // test is the tail wagging the dog.
    expect(s, 'the limit of the read is said out loud').toMatch(/(not|neither was) independently verified/i);
    for (const re of [/told IT Brew/i, /was reported describing/i, /described helping/i]) {
      expect(re.test(allText(M())), `a reporting verb is missing: ${re}`).toBe(true);
    }
  });

  it('the sponsored item in the same issue is nowhere in the lesson', () => {
    // It is an advertisement for a report and bears on no part of this
    // teaching, so it was ignored deliberately. Asserted so a later edit
    // cannot import it quietly.
    const text = allText(M());
    expect(text).not.toMatch(/HUMAN Security/i);
    expect(text).not.toMatch(/agent(ic)? traffic/i);
    expect(text).not.toMatch(/bot traffic report/i);
  });
});

describe('the teaching is reasoned from the Word, not decorated with it (DR-0281)', () => {
  const t = () => allText(M());

  it('the battlement is taught as a duty the standing house creates, not as a reaction', () => {
    expect(t()).toMatch(/Deuteronomy 22:8/);
    expect(t(), 'the whole force of the statute is that it binds BEFORE anybody falls').toMatch(
      /owed on a (quiet|calm) day|before (anybody|anyone) falls|before anybody falls/i
    );
    expect(t(), 'the house is the project and the battlement is what it owes afterwards').toMatch(/the house was the project/i);
  });

  it('the pit and the fire are taught as continuing ownership of a brief act', () => {
    expect(t()).toMatch(/Exodus 21:3[34]/);
    expect(t()).toMatch(/Exodus 22:6/);
    expect(t(), 'build, open, kindle is the three-act reading the lesson turns on').toMatch(/Build, open, kindle/);
    expect(t(), 'the brevity of the act against the duration of the duty is the argument').toMatch(
      /the act is brief and the duty it creates is not|the ownership does not expire/i
    );
  });

  it('the capacity limit is taught as blessing, not as fault', () => {
    expect(t()).toMatch(/Genesis 13:6/);
    expect(t(), 'the land was unchanged — that is the entire point of the pin').toMatch(/the land (had not|never) changed/i);
    expect(M().levels.senior, 'Genesis 13 is taught without a rebuke in it').toMatch(/rather than a rebuke|without any reference to fault/i);
    expect(M().levels.senior, 'a limit found under success is the common kind').toMatch(/discovered under success/i);
  });

  it('the broken net is taught with its honest second step', () => {
    expect(t()).toMatch(/Luke 5:6/);
    expect(M().levels.senior, 'the partners in the other ship are the practical half').toMatch(/partners in the other ship/i);
  });

  it('Jethro is taught as arithmetic, with the numeric remedy, not as a scolding', () => {
    expect(t()).toMatch(/Exodus 18:1[78]/);
    expect(t(), 'the diagnosis is a weight and not a character charge').toMatch(
      /arithmetic rather than of character|counting, not scolding|arithmetic —|No charge of laziness/i
    );
    expect(M().levels.senior).toMatch(/Exodus 18:21/);
    expect(M().levels.senior).toMatch(/Exodus 18:22/);
    expect(M().levels.senior, 'the thousands/hundreds/fifties/tens structure IS the automation design').toMatch(/automation design written in Exodus/i);
    expect(M().levels.senior, 'borne WITH him is the part the remedy insists on').toMatch(/borne WITH him/);
  });

  it('the enquiry-after-the-vow is the landing, and Luke 14:28 is named rather than reused', () => {
    // This course's own spm3 already counts cost at
    // Luke 14:28. spm12 names it and lands elsewhere ON PURPOSE, because the
    // failure here is not a refusal to count — it is counting the build and
    // never the owning. Asserted so the distinction cannot be edited away.
    expect(t()).toMatch(/Proverbs 20:25/);
    expect(M().levels.senior, 'the course already counts cost at Luke 14:28 and this lesson says so').toMatch(/Luke 14:28/);
    expect(M().levels.senior, 'the different landing has to be stated, not implied').toMatch(/counting the construction and never the tenancy/i);
    const spm3 = SOFTWARE_PM_MODULES.find((m) => m.id === 'spm3-the-honest-unknown');
    expect(spm3.anchor.ref, 'spm3 is the lesson that owns the tower-costing verse here').toMatch(/Luke 14:28/);
    expect(M().anchor.ref, 'spm12 must not re-anchor on it').not.toMatch(/Luke 14:28/);
  });
});

describe('this house’s own record is cited as a record, never as an illustration', () => {
  it('DR-0125 is named in a field that is not a reader band', () => {
    // READER_FIELDS (quotation-integrity.mjs) forbids a DR id in bigIdea, inApp
    // and the four bands: a reader has no idea what DR-0125 is, and a lesson
    // showing its own bookkeeping has stopped speaking to the person in front
    // of it. So the id lives in a benefit and a quiz explanation, and the
    // senior band tells the same failure in reader language.
    const m = M();
    const ids = [...m.benefits, ...m.quiz.questions.map((q) => q.explain)].join('\n');
    expect(ids).toMatch(/DR-0125/);
    for (const where of ['bigIdea', 'inApp', 'levels.child', 'levels.youth', 'levels.teen', 'levels.senior']) {
      const text = fields(m).find(([w]) => w === where)[1];
      expect(/DR-\d{4}/.test(String(text)), `${where} recites a decision record at a reader`).toBe(false);
    }
  });

  it('the senior band tells our own failure as written record, with its measured shape', () => {
    const s = M().levels.senior;
    expect(s, 'the nine hours is what makes it a cost and not an anecdote').toMatch(/nine hours/i);
    expect(s, 'the safeguards that never asked the product are the other half').toMatch(/HTTP request/i);
    expect(s, 'it must read as our own record rather than an invented example').toMatch(/written down rather than illustrated/i);
    expect(s, 'the merge lane is named as a thing WE switched on — that is why it belongs here').toMatch(/an automated merge path is a thing turned on/i);
  });

  it('spm12 is not spm11 and not spm8 — three clocks, one lesson each', () => {
    const debt = SOFTWARE_PM_MODULES.find((m) => m.id === 'spm8-debt-named-and-dated');
    const stale = SOFTWARE_PM_MODULES.find((m) => m.id === 'spm11-unsupported-cannot-be-patched');
    expect(debt, 'spm8 must exist to be distinguished from').toBeTruthy();
    expect(stale, 'spm11 must exist to be distinguished from').toBeTruthy();
    // spm8: name your debt and date it. The clock is the borrower's.
    expect(debt.bigIdea).toMatch(/re-review DATE|re-review date/i);
    // spm11: the clock belongs to whoever maintains what you stand on.
    expect(allText(stale)).toMatch(/due date (is held by|belongs to) whoever maintains/i);
    // spm12: the clock starts when you switch it on and does not stop.
    expect(allText(M()), 'spm12 must state its own distinct claim').toMatch(/the obligation begins at a moment and then does not stop/i);
    expect(allText(M())).toMatch(/the cost of owning it for every day it (stays|is switched) on/i);
    // And no two of the three open with the same words.
    const head = (x) => x.title.split(/\s+/).slice(0, 3).join(' ');
    expect(new Set([head(M()), head(debt), head(stale)]).size).toBe(3);
  });
});

describe('the refusals hold — nothing is claimed that was not measured (DR-0076 §1)', () => {
  it('spm12 claims no effect on a defect rate, a cycle time or an exam score', () => {
    const text = allText(M());
    expect(text).not.toMatch(/defect rate/i);
    expect(text).not.toMatch(/exam score/i);
    expect(text).not.toMatch(/cycle time/i);
    expect(text, 'no unmeasured percentage may be asserted').not.toMatch(/\b\d{1,3}\s?% (fewer|faster|more|less)/i);
  });

  it('no number is asserted about the source’s own systems', () => {
    // The issue gave no measured figure for the nonprofit's traffic, the
    // certificate count, or any outage duration, so the lesson states none.
    // The only durations in it are the source's own vague ones (a few hours)
    // and this house's own recorded nine.
    const text = allText(M());
    expect(text, 'a request-per-second figure was never in the source').not.toMatch(/\d+\s*(requests|req)\s*(per|\/)\s*(second|s)\b/i);
    expect(text, 'no certificate count was given').not.toMatch(/\b\d{2,}\s+certificates\b/);
    expect(text, 'the vague count is kept vague, as reported').toMatch(/hundreds or thousands of (security )?certificates/i);
  });

  it('the covenant name is ours and His own quoted words are untouched (DR-0210)', () => {
    const m = M();
    // Our authored voice, with every quotation stripped first: the KJV's own
    // "God" and "the LORD" inside a span are never touched by this.
    const ours = allText(m).replace(/"[^"]*"/g, ' ');
    expect(
      [...ours.matchAll(/.{0,50}\bGod\b.{0,50}/g)].map((x) => x[0]),
      'the generic name appears in our own voice'
    ).toEqual([]);
    expect(m.bigIdea, 'the lesson names Him').toMatch(/Yahweh/);
    expect(allText(m).match(/\b(Lucifer|Satan|The Devil|The Adversary|Baal)\b/g) || []).toEqual([]);
  });
});

describe('what spm12 costs the library census, stated rather than discovered', () => {
  // The library ratchet lets readings, whole, allVersions and exams only RISE
  // and `waiting` only FALL. spm12 raises waiting by one, and the reason is a
  // property of its COURSE, not a shortfall in the lesson: this course carries
  // no adult `lesson` and no facilitator fields, so all twelve of its lessons
  // count as waiting for a version they were never designed to have.
  // Asserting it here means the fact is a statement in the tree rather than a
  // surprise in a later PR's red build — the shape spm11 recorded.
  it('spm12 waits for exactly what its eleven neighbours wait for, and nothing else', () => {
    const rows = SOFTWARE_PM_MODULES.map((m) => censusLesson(m));
    const mine = rows.find((r) => r.id === SPM12);
    expect(mine.missingVersions, 'the course has no adult lesson field').toEqual(['adult']);
    expect(mine.missingComponents.sort()).toEqual(['howToRun', 'talkingPoints']);
    for (const r of rows) {
      expect(r.missingVersions, `${r.id} diverges from its course`).toEqual(mine.missingVersions);
      expect(r.missingComponents.sort(), `${r.id} diverges from its course`).toEqual(mine.missingComponents.sort());
    }
  });

  it('it carries every component the course DOES give a lesson', () => {
    const mine = censusLesson(M());
    for (const id of ['lesson', 'anchor', 'bigIdea', 'quiz', 'benefits', 'inApp']) {
      expect(mine.missingComponents, `spm12 is missing ${id}`).not.toContain(id);
    }
    expect(mine.versions.sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });
});

describe('PROVEN-TO-CATCH — a gate is only worth its green if it goes red (DR-0076 §3)', () => {
  const broken = (patch) => ({ ...M(), ...patch });

  it('the real lesson passes the whole-span check, so each catch below is real', () => {
    const hay = pool(M());
    for (const [, text] of fields(M())) {
      for (const x of String(text).matchAll(/"([^"]*)"/g)) {
        expect(hay.includes(norm(x[1]).replace(/[.,;:]+$/, ''))).toBe(true);
      }
    }
  });

  it('one wrong word inside a quotation is seen', () => {
    const m = broken({
      levels: { ...M().levels, child: M().levels.child.replace('make it good', 'make it right') },
    });
    expect(m.levels.child, 'the break did not land').not.toBe(M().levels.child);
    const hay = pool(m);
    const bad = [...fields(m).flatMap(([, t]) => [...String(t).matchAll(/"([^"]*)"/g)])].filter((x) => !hay.includes(norm(x[1]).replace(/[.,;:]+$/, '')));
    expect(bad.length, 'a changed word inside His quoted text passed').toBeGreaterThan(0);
  });

  it('the comma a memory would add to Exodus 18:18 is seen', () => {
    // THE REAL TRAP IN THIS LESSON, caught by reading the corpus rather than
    // recalling it: this KJV reads "thyself alone" with no comma. The familiar
    // "thyself, alone" is the version a memory supplies, and it would be wrong
    // in four places at once. The whole-span check is what stands between.
    const m = broken({
      levels: { ...M().levels, youth: M().levels.youth.replace('it thyself alone', 'it thyself, alone') },
    });
    expect(m.levels.youth, 'the break did not land').not.toBe(M().levels.youth);
    const hay = pool(m);
    const bad = [...String(m.levels.youth).matchAll(/"([^"]*)"/g)].filter((x) => !hay.includes(norm(x[1]).replace(/[.,;:]+$/, '')));
    expect(bad.length, 'a remembered comma inside His text passed').toBeGreaterThan(0);
  });

  it('a span pinned to the WRONG reference is seen', () => {
    // Exodus 18:22 is not 18:23. scanQuotedVerses resolves the reference,
    // which is the whole reason it exists beside the pool check — the pool
    // alone would pass this, because the words ARE Scripture somewhere.
    const m = broken({
      levels: { ...M().levels, senior: M().levels.senior.replace('(Exodus 18:22)', '(Exodus 18:23)') },
    });
    expect(m.levels.senior, 'the break did not land').not.toBe(M().levels.senior);
    const faults = scanQuotedVerses([m], (x) => fields(x)).faults;
    expect(faults.length, 'a quotation tagged with the wrong verse passed').toBeGreaterThan(0);
  });

  it('an interviewee’s clause put in quotation marks is seen', () => {
    const m = broken({
      inApp: `${M().inApp} He said the site becomes "a living and breathing entity the second the button is turned on."`,
    });
    const quoted = [...allText(m).matchAll(/"([^"]*)"/g)].map((x) => x[1]).join(' ');
    expect(/living and breathing entity/i.test(quoted), 'a secular clause wearing quotation marks passed').toBe(true);
    const hay = pool(m);
    expect(
      hay.includes(norm('a living and breathing entity the second the button is turned on')),
      'the pool should not contain a clause that is not Scripture'
    ).toBe(false);
  });

  it('a DR id put into a reader band is seen', () => {
    const m = broken({ levels: { ...M().levels, senior: `${M().levels.senior} (DR-0125.)` } });
    expect(/DR-\d{4}/.test(m.levels.senior), 'a reader band reciting our bookkeeping passed').toBe(true);
  });

  it('a child band handed the senior words is seen by the ladder', () => {
    const m = broken({ levels: { ...M().levels, child: M().levels.senior } });
    const noAdult = {
      ...LADDER,
      teenCeiling: Infinity,
      seniorCeiling: Infinity,
      floor: { child: 0, youth: 0, teen: 0, senior: 0 },
    };
    expect(fourBandFaults(m, noAdult).join(' ')).toMatch(/ladder: child|child: grade|near copy/);
  });

  it('a lesson that drops the blessing-not-fault reading of Genesis 13 is seen', () => {
    // The phrase is carried in THREE places on purpose — the anchor theme, the
    // youth band and the quiz option that is the right answer — so a break has
    // to remove all three before the reasoning is gone. That it took three
    // aims to land is itself the evidence the teaching does not hang on one
    // removable sentence (spm7's own lesson about a badly-aimed break).
    const strip = (s) => String(s).replace(/the land (had not|never) changed/gi, 'the site went down');
    const m = broken({
      anchor: { ...M().anchor, theme: strip(M().anchor.theme) },
      levels: Object.fromEntries(FOUR_BANDS.map((b) => [b, strip(M().levels[b])])),
      quiz: {
        questions: M().quiz.questions.map((q) => ({
          ...q,
          q: strip(q.q),
          explain: strip(q.explain),
          options: q.options.map(strip),
        })),
      },
    });
    expect(m.anchor.theme, 'the break did not land on the theme').not.toBe(M().anchor.theme);
    expect(m.quiz.questions[1].options[1], 'the break did not land on the quiz').not.toBe(M().quiz.questions[1].options[1]);
    expect(/the land (had not|never) changed/i.test(allText(m)), 'the reasoning was removable without this going red').toBe(false);
    expect(/the land (had not|never) changed/i.test(allText(M())), 'the real lesson must carry the reasoning, or the case above is vacuous').toBe(true);
  });

  it('a lesson that lets the sponsored item in is seen', () => {
    const m = broken({ inApp: `${M().inApp} The same issue carried a HUMAN Security report on agentic traffic.` });
    expect(/HUMAN Security/i.test(allText(m)), 'the advertisement walked in unchallenged').toBe(true);
    expect(/HUMAN Security/i.test(allText(M())), 'the real lesson must be clean, or the case above is vacuous').toBe(false);
  });
});

describe('the quotation gate the whole catalog runs reads this lesson too', () => {
  it('quotedTexts covers the lesson, and every span it finds is its own verse', () => {
    // The catalog-wide gate (every-catalog-quotes-the-verse.test.js) pins this
    // file's catalog at exactly 0 faults. Asserting it here as well means a
    // break is named against spm12 rather than against the whole course.
    const covered = quotedTexts(M()).map(([where]) => where);
    for (const b of FOUR_BANDS) expect(covered).toContain(`levels.${b}`);
    const scan = scanQuotedVerses([M()], quotedTexts);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans).toBeGreaterThanOrEqual(10);
  });
});
