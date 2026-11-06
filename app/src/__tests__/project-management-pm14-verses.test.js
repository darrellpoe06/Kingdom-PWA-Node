// @vitest-environment node
// =============================================================================
// pm14 — whose measure: the benchmark, the census, and the KPIs the Word
// already gave us
// =============================================================================
// Lesson 14 of Project Management, built 2026-11-05 from a CFO Dive letter
// Darrell forwarded on 2026-10-22 with two things written above it: Lesson, and
// potential KPIs.
//
// THE THING THIS FILE EXISTS TO PROTECT, AND IT IS TWO THINGS.
//
// ONE, THE SOURCE IS AN ADVERTISEMENT AND NOT AN ARTICLE. pm13's source was a
// one-sentence teaser; this one is thinner still. The forwarded item carries no
// reporting, no byline and no study at all. Its own masthead line says the
// week's letter is brought to you by one advertiser, and the whole body is that
// advertiser's pitch for a self-scored maturity assessment. The standing
// instruction is to ignore the advertisements, and this is the exception that
// instruction allows: he forwarded it AS the lesson, and what is being sold is
// a MEASURE, which is exactly the subject. So the page says what the item was,
// in the reader's own text, and the checks below make that honesty
// non-removable.
//
// TWO, AND THIS IS WHAT THE GATE GUARDS HARDEST: NOT ONE FIGURE FROM THE PITCH
// IS TAUGHT AS A FACT. A benchmark newsletter is wall-to-wall numbers, and
// every one is somebody's survey with a sample, a definition and a sponsor
// (DR-0190). The audit carried in the reader's text is three-tiered (DR-0100):
//   ESTABLISHED   measured from the message in hand -- it is advertising, its
//                 own tracking links carry the seller's labels for a gated
//                 middle-of-funnel offer, and the message CONTRADICTS ITS OWN
//                 HEADLINE NUMBER inside one email, 76M against 75 million,
//                 with no definition of a subscriber in either place.
//   ATTRIBUTED    the merchant count, the subscriber counts, the six levers,
//                 the thirty minutes, the publisher's audience figure -- the
//                 advertiser's claims, never asserted on our authority.
//   UNVERIFIED    no primary source was reachable. recurly.com did not resolve
//                 on this session's network and neither did the newswire that
//                 carries that company's releases, both failing with
//                 getaddrinfo ENOTFOUND. A blocked road NEVER reads as a
//                 verified claim (DR-0076 section 8).
// And what the checking CHANGED is stated rather than buried: a single solid
// 76M became a number that MOVES -- 55 million, then 60 million, then 75 and 76
// inside one email -- with no published change of definition, and its
// denominator turned out to be the vendor's own book of business.
//
// WHO TAUGHT: NOBODY (DR-0719). There was no class, no recording and no human
// teacher. A forwarded advertisement is not a teaching, and the page says so in
// every reader place. Nobody is credited with the doctrine on it.
//
// THE TEACHING ITSELF IS THE WORD, and the ground is genuinely unbuilt: the
// census narrative measured ZERO hits across app/src and docs/decisions before
// this lesson (2 Samuel 24:3, 24:10; 1 Chronicles 21:3, 21:7; 1 Chronicles
// 27:23, 27:24; Numbers 1:2), as did 2 Corinthians 10:13, 10:15 and 10:17 and
// 1 Corinthians 3:7. Counting is NOT the sin -- Yahweh commanded a census
// (Numbers 1:2) and the Word records figures (Acts 2:41, 2:47). What made
// David's census sin was its PURPOSE (2 Samuel 24:2), and the proof is the
// boundary he would not cross (1 Chronicles 27:23) and the figure struck from
// the record (1 Chronicles 27:24). A metric can point the wrong way and He will
// reduce it (Judges 7:2). The subject line walks into 2 Corinthians 10:12, and
// the replacement is the right denominator rather than no measure (10:13, 10:15,
// 10:17, 10:18). The self-report is the instrument Scripture trusts least
// (Revelation 3:17, 3:1; Proverbs 16:2; Jeremiah 17:10; Luke 16:15; 12:20). The
// increase is given (1 Corinthians 3:6-7; Mark 4:27-28; Psalms 127:1). The
// instrument itself is under judgment (Proverbs 11:1; Amos 7:8; Daniel 5:27;
// 1 Samuel 16:7). And then the seven KPIs, each countable and none imported --
// fruit (Galatians 5:22; John 15:8; Philippians 1:11; Matthew 7:20), occasions
// and days (Deuteronomy 6:7; Hebrews 3:13), faithfulness (1 Corinthians 4:2;
// Luke 16:10), your own work proved (Galatians 6:4), confirmation from outside
// (Proverbs 27:2), the sown-against-brought-in ledger (Haggai 1:5-6) and
// sufficiency to finish (Luke 14:28) -- with the Resources (Proverbs 24:3-4)
// and Love senior to all of it (1 Corinthians 13:1).
//
// Every pin below is re-read from app/public/bible/kjv at test time, so this
// file cannot drift from the text either.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_MANAGEMENT_MODULES, PROJECT_MANAGEMENT_META } from '../lib/project-management-course.js';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { anchorRefs } from '../lib/search-it-out.js';
import { censusLesson } from '../lib/library-census.js';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { scanQuotedVerses, describeFault, loweredHolyNames, ourVoice } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';

const CORPUS = join(process.cwd(), 'public', 'bible', 'kjv');
const bookCache = new Map();

/** The verse exactly as the corpus on disk has it. No normalisation at all. */
function corpusText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) return null;
  const name = m[1].trim().replace(/\s+/g, '');
  try {
    if (!bookCache.has(name)) {
      bookCache.set(name, JSON.parse(readFileSync(join(CORPUS, `${name}.json`), 'utf8')));
    }
  } catch {
    return null;
  }
  const chap = bookCache.get(name).chapters[Number(m[2]) - 1];
  if (!chap) return null;
  return chap[Number(m[3]) - 1] ?? null;
}

const PM14_ID = 'pm14-whose-measure-the-benchmark-the-census-and-the-kpis';
const L = () => PROJECT_MANAGEMENT_MODULES.find((m) => m.id === PM14_ID);

// Every verse this lesson stands on, re-read from the corpus at test time so a
// pin can never be "what I remember the verse saying".
const PINNED = [
  '1 Chronicles 21:3',
  '1 Chronicles 21:7',
  '1 Chronicles 27:23',
  '1 Chronicles 27:24',
  '1 Corinthians 3:6',
  '1 Corinthians 3:7',
  '1 Corinthians 4:2',
  '1 Corinthians 13:1',
  '1 Samuel 16:7',
  '2 Corinthians 10:12',
  '2 Corinthians 10:13',
  '2 Corinthians 10:15',
  '2 Corinthians 10:17',
  '2 Corinthians 10:18',
  '2 Samuel 24:2',
  '2 Samuel 24:3',
  '2 Samuel 24:10',
  'Acts 2:41',
  'Acts 2:47',
  'Amos 7:8',
  'Daniel 5:27',
  'Deuteronomy 6:7',
  'Galatians 5:22',
  'Galatians 6:4',
  'Haggai 1:5',
  'Haggai 1:6',
  'Hebrews 3:13',
  'Jeremiah 17:10',
  'John 1:29',
  'John 3:16',
  'John 15:8',
  'Judges 7:2',
  'Luke 12:20',
  'Luke 14:28',
  'Luke 16:10',
  'Luke 16:15',
  'Mark 4:27',
  'Mark 4:28',
  'Matthew 7:20',
  'Numbers 1:2',
  'Philippians 1:11',
  'Proverbs 11:1',
  'Proverbs 16:2',
  'Proverbs 24:3',
  'Proverbs 24:4',
  'Proverbs 27:2',
  'Proverbs 27:17',
  'Psalms 19:14',
  'Psalms 127:1',
  'Revelation 3:1',
  'Revelation 3:17',
];

const BANDS = ['child', 'youth', 'teen', 'senior'];
const PLACES = () => BANDS.map((k) => ({ place: k, text: L().levels[k] }));

const EVERY_TEXT = () => {
  const m = L();
  const out = [m.title, m.bigIdea, m.inApp, m.lesson, m.anchor.theme, ...(m.benefits || [])];
  out.push(...Object.values(m.levels));
  out.push(m.facilitator.howToRun, ...m.facilitator.talkingPoints, ...m.facilitator.discussionPrompts);
  for (const q of m.quiz.questions) out.push(q.q, q.explain, ...q.options);
  return out.filter((x) => typeof x === 'string');
};

describe('pm14 is in the Project Management course, whole, with every reader version', () => {
  it('is the fourteenth lesson, uniquely, and the header count is the real one', () => {
    const m = L();
    expect(m, 'pm14 is not in PROJECT_MANAGEMENT_MODULES').toBeTruthy();
    expect(PROJECT_MANAGEMENT_MODULES.filter((x) => x.id === PM14_ID)).toHaveLength(1);
    expect(PROJECT_MANAGEMENT_MODULES.filter((x) => /^pm14-/.test(x.id))).toHaveLength(1);
    expect(PROJECT_MANAGEMENT_MODULES.indexOf(m)).toBe(13);
    expect(PROJECT_MANAGEMENT_META.weeks).toBe(PROJECT_MANAGEMENT_MODULES.length);
  });

  // DR-1316: a lesson's gate may NOT claim to be the last lesson. This course
  // DERIVES its count, so it is open and this gate must be too. Contiguity from
  // one is asserted; nothing is asserted about what comes after pm14.
  it('the lessons run contiguously from one, and pm14 sits at the fourteenth place', () => {
    const nums = PROJECT_MANAGEMENT_MODULES.map((m) => Number(/^pm(\d+)-/.exec(m.id)[1]));
    expect(new Set(nums).size, 'two lessons may not share a number').toBe(nums.length);
    expect(nums, 'the course numbers must run 1..n with no gap').toEqual(Array.from({ length: nums.length }, (_, i) => i + 1));
    expect(nums, 'pm14 must be in the course').toContain(14);
    expect(PROJECT_MANAGEMENT_MODULES[13].id).toBe(PM14_ID);
  });

  it('PROVEN-TO-BE-FORWARD-SAFE: the next lesson landing does not break this gate (DR-1316)', () => {
    // THE LITERAL WAS THE BUG, AND THIS IS DR-1316'S DEFECT CLASS THE THIRD
    // TIME -- the second time inside a fix for it. pm13's gate appended a
    // literal 14; this file's own earlier case repaired that with the derived
    // form, and then hardcoded 15 right here. When pm15 actually landed the
    // list became [1..15, 15] and contiguity failed, blocking #2567 on a gate
    // belonging to the lesson before it. A forward-safety case that names the
    // next number is only safe until that number exists, which is the one
    // moment it is meant to cover.
    const next = PROJECT_MANAGEMENT_MODULES.length + 1;
    const nums = [...PROJECT_MANAGEMENT_MODULES.map((m) => Number(/^pm(\d+)-/.exec(m.id)[1])), next];
    expect(nums).toEqual(Array.from({ length: nums.length }, (_, i) => i + 1));
    expect(nums.indexOf(14), 'pm14 stays at the fourteenth place').toBe(13);
    expect(Math.max(...nums), 'this gate never claims pm14 is the highest').not.toBe(14);
  });

  // THE LIBRARY RATCHET IS THE REASON THIS TEST EXISTS (DR-1266). Measured on
  // the tree this lesson was built from: live `waiting` sat at exactly the
  // frozen baseline's 374, with ZERO slack. A lesson that landed without its
  // adult register or its facilitator fields would have raised `waiting` and
  // failed the build. So pm14 lands WHOLE -- all five reader versions and all
  // eight components -- and this pin keeps it that way.
  it('lands WHOLE: every reader version and every component, adding nothing to the wait', () => {
    const c = censusLesson(L());
    expect(c.missingVersions, 'a reader version is missing').toEqual([]);
    expect(c.missingComponents, 'a lesson component is missing').toEqual([]);
    expect(c.whole).toBe(true);
    expect(c.short, 'the adult register is a note rather than a lesson').toBe(false);
    expect(c.versions).toEqual(['child', 'youth', 'teen', 'adult', 'senior']);
  });

  it('every band is written long enough to teach its reader, and the adult register is its own text', () => {
    for (const band of BANDS) {
      expect(typeof L().levels[band], `band ${band}`).toBe('string');
      expect(L().levels[band].length, `band ${band} is too short to teach`).toBeGreaterThan(900);
    }
    expect(L().lesson.trim().split(/\s+/).length, 'the adult register is short').toBeGreaterThan(400);
  });

  it('every band names its own lesson near its start (title-in-narrative)', () => {
    expect(unnamedBands(L())).toEqual([]);
  });
});

describe('pm14 — the verses are the corpus, verbatim', () => {
  it('every quoted span that names a reference IS that verse, character for character', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans, 'the scan found nothing to check').toBeGreaterThan(150);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every pinned verse is quoted somewhere in the module, as the corpus has it', () => {
    const all = EVERY_TEXT().join('\n');
    const missing = [];
    for (const ref of PINNED) {
      const text = corpusText(ref);
      expect(text, `${ref} does not resolve in the corpus`).toBeTruthy();
      const spans = [...all.matchAll(new RegExp(`"([^"]+)"\\s*\\(${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'))];
      if (!spans.length || spans.some((s) => !text.includes(s[1]))) missing.push(ref);
    }
    expect(missing, 'pinned verses the module never quotes verbatim under their own reference').toEqual([]);
  });

  it('anchor.ref names every verse the lesson stands on, and each one resolves (DR-0734)', () => {
    const refs = anchorRefs(L());
    expect(refs.length).toBe(PINNED.length);
    for (const ref of PINNED) {
      expect(refs, `${ref} is taught but missing from anchor.ref`).toContain(ref);
    }
    expect(
      refs.filter((r) => !corpusText(r)),
      'anchor refs that do not resolve in the corpus'
    ).toEqual([]);
  });

  it('BOTH DIRECTIONS: nothing is quoted that anchor.ref does not name', () => {
    const refs = new Set(anchorRefs(L()));
    const quoted = new Set();
    for (const [, text] of quotedTexts(L())) {
      for (const x of String(text).matchAll(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g)) {
        quoted.add(`${x[2].trim()} ${x[3]}:${x[4].trim()}`);
      }
    }
    expect(
      [...quoted].filter((r) => !refs.has(r)),
      'quoted but not named in anchor.ref'
    ).toEqual([]);
    expect(
      [...refs].filter((r) => !quoted.has(r)),
      'named in anchor.ref but never quoted'
    ).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a single altered word inside a quoted verse is caught', () => {
    const m = L();
    const broken = {
      ...m,
      levels: {
        ...m.levels,
        child: m.levels.child.replace(
          'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith',
          'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, growth'
        ),
      },
    };
    expect(broken.levels.child).not.toBe(m.levels.child);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.length, 'the scan did not catch an altered quotation').toBeGreaterThan(0);
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });
});

describe('pm14 — the source is an ADVERTISEMENT, reported at its real size, and the honesty cannot be edited out', () => {
  it('his words are carried: Lesson, and potential KPIs', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/two things (?:written )?above it: Lesson, and potential KPIs/.test(all), 'his words are not carried').toBe(true);
    for (const place of ['youth', 'teen', 'senior']) {
      expect(/KPI/.test(L().levels[place]), `${place} never names the thing he asked for`).toBe(true);
    }
  });

  it('the adult register AND the senior band both say it was an advertisement with no article in it', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['lesson', L().lesson],
      ['senior', L().levels.senior],
    ]) {
      expect(/advertis/i.test(text), `${where} never calls it an advertisement`).toBe(true);
      expect(/no article|not an article|carries no article/i.test(text), `${where} never says there was no article`).toBe(true);
      expect(/no byline/i.test(text), `${where} never says there was no byline`).toBe(true);
    }
  });

  it('the standing instruction to ignore the advertisements is named, with the reason this one is the exception', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['lesson', L().lesson],
      ['senior', L().levels.senior],
    ]) {
      expect(/ignore the advertisements/i.test(text), `${where} does not name the standing rule`).toBe(true);
      expect(/exception/i.test(text), `${where} does not name it as the exception`).toBe(true);
    }
  });

  it('WHO TAUGHT: nobody — and never the bare phrase "the teacher", and never Bishop Gwin (DR-0719)', () => {
    const all = EVERY_TEXT().join('\n');
    // Said out loud in every reader place that weighs the source.
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['lesson', L().lesson],
      ['senior', L().levels.senior],
      ['teen', L().levels.teen],
      ['youth', L().levels.youth],
      ['child', L().levels.child],
    ]) {
      expect(/nobody taught|no class|not a teacher|no human teacher/i.test(text), `${where} does not say nobody taught it`).toBe(true);
    }
    expect(/\bthe teacher\b/i.test(all), 'the bare phrase "the teacher" reaches a reader').toBe(false);
    expect(/Gwin/i.test(all), 'a teacher is credited who did not teach this').toBe(false);
  });

  it('THE THREE TIERS are all three, so a truth is not shrunk and a claim is not inflated (DR-0100)', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['senior', L().levels.senior],
    ]) {
      expect(/ESTABLISHED/.test(text), `${where} has no established tier`).toBe(true);
      expect(/ATTRIBUTED/.test(text), `${where} has no attributed tier`).toBe(true);
      expect(/UNVERIFIED/.test(text), `${where} has no unverified tier`).toBe(true);
      expect(/OVER-REACH/.test(text), `${where} has no over-reach tier`).toBe(true);
    }
  });

  it('TRUST BUT VERIFY: the note says what was checked, the primary source, the tiers, what checking CHANGED, and the limit (DR-0190 section 5)', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['senior', L().levels.senior],
    ]) {
      expect(/Trust but verify|trust but verify/.test(text) || /WHAT WE CHECKED/.test(text), `${where} has no audit`).toBe(true);
      expect(/primary source/i.test(text), `${where} never names the primary source`).toBe(true);
      expect(/What the checking changed|WHAT THE CHECKING CHANGED|What checking CHANGED/i.test(text), `${where} never says what checking changed`).toBe(true);
      expect(/honest limit/i.test(text), `${where} never states the honest limit`).toBe(true);
    }
    expect(/no primary source was read/i.test(L().bigIdea + L().levels.senior), 'the limit is not stated plainly').toBe(true);
  });

  it('A BLOCKED ROAD NEVER READS AS A VERIFIED CLAIM: the refused host is NAMED, with the refusal (DR-0076 section 8)', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['lesson', L().lesson],
      ['senior', L().levels.senior],
    ]) {
      expect(/recurly\.com|did not resolve/i.test(text), `${where} does not name the blocked road`).toBe(true);
      expect(/getaddrinfo ENOTFOUND/.test(text), `${where} does not quote the refusal`).toBe(true);
    }
    expect(/recurly\.com did not resolve/i.test(L().bigIdea), 'the host is not named in the adult text').toBe(true);
  });

  it('THE AUDIT FINDING: the email contradicts its own headline number, and both numbers are carried', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['lesson', L().lesson],
      ['teen', L().levels.teen],
      ['youth', L().levels.youth],
      ['senior', L().levels.senior],
    ]) {
      expect(/76M/.test(text), `${where} drops the preheader figure`).toBe(true);
      expect(/75 million/.test(text), `${where} drops the body figure`).toBe(true);
      expect(/contradict|disagrees with itself/i.test(text), `${where} never names the contradiction`).toBe(true);
    }
  });

  it('EVERY FIGURE FROM THE PITCH IS ATTRIBUTED OR REFUSED — not one is asserted as ours', () => {
    const all = EVERY_TEXT().join('\n');
    // The denominator is named for what it is, which is the decisive finding.
    expect(/vendor’s own (?:book of business|customer base|customers)|company’s own customers/i.test(all), 'the denominator is never named').toBe(true);
    expect(/mirror/i.test(all), 'the mirror, which is what a seller-sampled benchmark is, is never named').toBe(true);
    expect(/A benchmark without its sample and its definition is not a fact/.test(all), 'the rule itself is never stated').toBe(true);
    // And no percentage, because the source carried none and an invented
    // finding is what one would look like.
    expect(all.match(/\d+(?:\.\d+)?\s?(?:%|per cent|percent)/g), 'a percentage appears, and the source carried none').toBeNull();
  });

  it('the page says an A.I. agent drafted it and the gates decide', () => {
    for (const text of [L().bigIdea, L().lesson, L().levels.senior]) {
      expect(/An A\.I\. agent drafted|an A\.I\. agent drafted/.test(text)).toBe(true);
      expect(/the gates decide/.test(text)).toBe(true);
    }
  });
});

describe('pm14 — the Word is the authority, and it is taught rather than debated', () => {
  it('COUNTING IS NOT THE SIN: the commanded census and the recorded figure are in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never carries the commanded census`).toContain('Take ye the sum of all the congregation of the children of Israel');
      expect(text, `${place} never carries the Word's own count`).toContain('the same day there were added unto them about three thousand souls');
    }
    const adult = [L().bigIdea, L().lesson, L().levels.senior].join('\n');
    expect(/counting is not the sin/i.test(adult), 'the point is never stated plainly').toBe(true);
    expect(adult).toContain('And the Lord added to the church daily such as should be saved');
  });

  it('THE CENSUS THAT WAS SIN: the purpose, the objection, the verdict, the boundary and the struck number', () => {
    const adult = [L().bigIdea, L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain('number ye the people, that I may know the number of the people');
    expect(adult).toContain('why then doth my lord require this thing? why will he be a cause of trespass to Israel?');
    expect(adult).toContain('And God was displeased with this thing; therefore he smote Israel');
    expect(adult).toContain('And David’s heart smote him after that he had numbered the people');
    // The boundary is the detail that proves the arithmetic was never the fault.
    expect(adult).toContain(
      'But David took not the number of them from twenty years old and under: because the LORD had said he would increase Israel like to the stars of the heavens'
    );
    expect(adult).toContain('neither was the number put in the account of the chronicles of king David');
    expect(/the (?:sin|problem) was (?:never the arithmetic|the purpose)|purpose/i.test(adult), 'the discriminator is never named').toBe(true);
  });

  it('A METRIC CAN POINT THE WRONG WAY: Gideon is in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never carries Judges 7:2`).toContain('lest Israel vaunt themselves against me, saying, Mine own hand hath saved me');
    }
  });

  it('THE VERSE THE SUBJECT LINE WALKED INTO is taught as a judgment about WISDOM, with the replacement denominator', () => {
    const adult = [L().bigIdea, L().lesson, L().levels.youth, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain('they measuring themselves by themselves, and comparing themselves among themselves, are not wise');
    expect(/not wise/i.test(adult)).toBe(true);
    // The replacement is NOT "stop measuring" -- that is the error this lesson
    // refuses in both directions.
    expect(adult).toContain('according to the measure of the rule which God hath distributed to us');
    expect(adult).toContain('Not boasting of things without our measure, that is, of other men’s labours');
    expect(adult).toContain('But he that glorieth, let him glory in the Lord');
    expect(adult).toContain('For not he that commendeth himself is approved, but whom the Lord commendeth');
    expect(/your assignment is your denominator/i.test(adult), 'the replacement denominator is never named').toBe(true);
  });

  it('THE SELF-REPORT is named as the instrument Scripture trusts least', () => {
    const adult = [L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(
      'Because thou sayest, I am rich, and increased with goods, and have need of nothing; and knowest not that thou art wretched, and miserable, and poor, and blind, and naked'
    );
    expect(adult).toContain('I know thy works, that thou hast a name that thou livest, and art dead');
    const senior = L().levels.senior;
    expect(senior).toContain('All the ways of a man are clean in his own eyes; but the LORD weigheth the spirits');
    expect(senior).toContain(
      'I the LORD search the heart, I try the reins, even to give every man according to his ways, and according to the fruit of his doings'
    );
    expect(senior).toContain('that which is highly esteemed among men is abomination in the sight of God');
    expect(senior).toContain('Thou fool, this night thy soul shall be required of thee');
  });

  it('WHO GIVES THE INCREASE: growth is reported rather than claimed, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never says Who gives the increase`).toMatch(/but God gave the increase|but God that giveth the increase/);
    }
    const adult = [L().levels.child, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain('the seed should spring and grow up, he knoweth not how');
    expect(adult).toContain('For the earth bringeth forth fruit of herself; first the blade, then the ear, after that the full corn in the ear');
    expect(adult).toContain('Except the LORD build the house, they labour in vain that build it');
    expect(L().levels.senior).toContain('So then neither is he that planteth any thing, neither he that watereth; but God that giveth the increase');
  });

  it('THE INSTRUMENT ITSELF is under judgment: a just weight, held from outside the work', () => {
    const adult = [L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain('A false balance is abomination to the LORD: but a just weight is his delight');
    expect(adult).toContain('Behold, I will set a plumbline in the midst of my people Israel');
    expect(adult).toContain('TEKEL; Thou art weighed in the balances, and art found wanting');
    expect(/outside the work|from OUTSIDE/i.test(adult), 'the point of the plumbline is never stated').toBe(true);
    expect(/a wall never measures itself/i.test(L().levels.senior)).toBe(true);
    expect(L().levels.senior).toContain('man looketh on the outward appearance, but the LORD looketh on the heart');
  });

  it("THE KPIs HE ASKED FOR: all seven, each with its verse, and the Word's way of measuring growth (both halves)", () => {
    const senior = L().levels.senior;
    // qualitative: fruit
    expect(senior).toContain('But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith');
    expect(senior).toContain('Herein is my Father glorified, that ye bear much fruit; so shall ye be my disciples');
    expect(senior).toContain('Being filled with the fruits of righteousness, which are by Jesus Christ, unto the glory and praise of God');
    expect(senior).toContain('Wherefore by their fruits ye shall know them');
    // quantitative: occasions and days
    expect(senior).toContain('when thou sittest in thine house');
    expect(senior).toContain('But exhort one another daily, while it is called To day');
    // the other five
    expect(senior).toContain('Moreover it is required in stewards, that a man be found faithful');
    expect(senior).toContain('He that is faithful in that which is least is faithful also in much');
    expect(senior).toContain('But let every man prove his own work, and then shall he have rejoicing in himself alone, and not in another');
    expect(senior).toContain('Let another man praise thee, and not thine own mouth; a stranger, and not thine own lips');
    expect(senior).toContain('Consider your ways');
    expect(senior).toContain('Ye have sown much, and bring in little');
    expect(senior).toContain('whether he have sufficient to finish it');
    // never imported, said out loud
    expect(/none (?:of them )?imported|none is imported|not one is imported/i.test(senior), 'the refusal of imported measures is never stated').toBe(true);
  });

  it('the Resources are named AND capitalised where they are named as the Resources, with Love senior (DR-0530)', () => {
    const senior = L().levels.senior;
    expect(senior).toContain('Through wisdom is an house builded; and by understanding it is established');
    expect(senior).toContain('And by knowledge shall the chambers be filled with all precious and pleasant riches');
    expect(/Wisdom builds, Understanding establishes, Knowledge/.test(senior)).toBe(true);
    expect(/Love is senior/.test(senior)).toBe(true);
    expect(senior).toContain('Though I speak with the tongues of men and of angels, and have not charity, I am become as sounding brass, or a tinkling cymbal');
  });

  it('the industry term is named as THEIR term, never as the authority (DR-0098)', () => {
    const senior = L().levels.senior;
    expect(/what the industry calls/i.test(senior), 'the industry term is never named as theirs').toBe(true);
    expect(/denominator|sample frame/i.test(senior)).toBe(true);
    // And the newsletter's own metrics are NEVER staged as co-equal with the Word.
    expect(/not one benchmark from this send is taught/i.test(senior), 'the refusal to stage the pitch as a standard is missing').toBe(true);
  });
});

describe('pm14 — typographic theology holds on every surface', () => {
  it('our own voice says Yahweh (DR-0210), in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(/Yahweh/.test(text), `${place} never names Yahweh`).toBe(true);
    }
  });

  it('the generic name never appears in OUR voice, on any surface', () => {
    const ours = EVERY_TEXT().map(ourVoice).join('\n');
    expect([...ours.matchAll(/.{0,40}\bGod\b.{0,40}/g)].map((x) => x[0])).toEqual([]);
  });

  it('the KJV\'s own "God" and "the LORD" are untouched inside the quotations (DR-0076 bright line)', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain('And God was displeased with this thing; therefore he smote Israel'); // 1 Chronicles 21:7
    expect(all).toContain('but God gave the increase'); // 1 Corinthians 3:6
    expect(all).toContain('Now the LORD thy God add unto the people'); // 2 Samuel 24:3
    expect(all).toContain('which God hath distributed to us'); // 2 Corinthians 10:13
  });

  it('Jesus is confessed as the Lamb and the Eternal Son of Yahweh', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/Lamb of Yahweh/.test(all)).toBe(true);
    expect(/Eternal Son of Yahweh/.test(all)).toBe(true);
    expect(all).toContain('Behold the Lamb of God, which taketh away the sin of the world');
    expect(all).toContain(
      'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life'
    );
  });

  it('no holy name is lowercased in our own voice, and no adversary name is capitalised anywhere', () => {
    for (const { place, text } of PLACES()) {
      expect(loweredHolyNames(text), `${place} lowercases a holy name`).toEqual([]);
    }
    expect(loweredHolyNames(L().lesson), 'the adult register lowercases a holy name').toEqual([]);
    const all = EVERY_TEXT().join('\n');
    for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Dragon', 'The Adversary', 'The Accuser', 'The Deceiver', 'Baal']) {
      expect(all.includes(bad), `${bad} is capitalised`).toBe(false);
    }
  });

  it('no decision-record id reaches a reader', () => {
    for (const text of EVERY_TEXT()) {
      expect(/DR-\d{4}/.test(text), 'a DR id is shown to a reader').toBe(false);
    }
  });
});

describe('pm14 — every reader place sends the reader in all three directions', () => {
  it('the module carries all three, and no place is short of one (DR-0733 / DR-0795)', () => {
    expect(hasAllThree(L())).toBe(true);
    expect(placesMissingDirections(L())).toEqual([]);
  });

  it('every band AND the adult register carry TALK ABOUT IT TOGETHER with the skill and the rhythm', () => {
    for (const { place, text } of [...PLACES(), { place: 'lesson', text: L().lesson }]) {
      expect(/TALK ABOUT IT TOGETHER/.test(text), `${place} has no close`).toBe(true);
      expect(/listen all the way to the end/i.test(text), `${place} drops the listening skill`).toBe(true);
      expect(/retell/i.test(text), `${place} drops the retelling skill`).toBe(true);
      expect(/teach them one verse back/i.test(text), `${place} drops teaching one verse back`).toBe(true);
      expect(/Once today/i.test(text), `${place} drops the rhythm`).toBe(true);
      expect(/one friend this week/i.test(text), `${place} drops the friend rhythm`).toBe(true);
      expect(text, `${place} drops the four places`).toContain('when thou sittest in thine house');
    }
  });

  it("PROVEN-TO-CATCH: stripping ONE band's friend line names that band while the module still reads whole", () => {
    const m = L();
    const stripped = {
      ...m,
      levels: { ...m.levels, youth: m.levels.youth.replace(/Friends, tell one friend this week[^.]*\./, '') },
    };
    expect(stripped.levels.youth).not.toBe(m.levels.youth);
    const named = placesMissingDirections(stripped);
    expect(named.map((p) => p.place)).toContain('youth');
    expect(named.find((p) => p.place === 'youth').missing).toContain('friends');
    // the pooled check still reads green, which is exactly why the per-band
    // check has to exist (DR-0795)
    expect(hasAllThree(stripped)).toBe(true);
    expect(placesMissingDirections(m)).toEqual([]);
  });
});

describe('pm14 — the lesson page is whole', () => {
  it('carries every field a lesson page renders', () => {
    const m = L();
    expect(m.bigIdea.length).toBeGreaterThan(200);
    expect(m.inApp.length).toBeGreaterThan(100);
    expect(m.anchor.theme.length).toBeGreaterThan(80);
    expect(m.benefits.length).toBeGreaterThanOrEqual(3);
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(3);
    expect(m.facilitator.howToRun.length).toBeGreaterThan(200);
  });

  it('the hands-on work sends the reader to a real project and a real page in the app', () => {
    expect(/scorecard/i.test(L().inApp)).toBe(true);
    expect(/Projects page/.test(L().inApp)).toBe(true);
  });

  it('the quiz answers point at the option they claim', () => {
    for (const q of L().quiz.questions) {
      expect(q.options[q.answer], `answer index out of range: ${q.q.slice(0, 50)}`).toBeTruthy();
      expect(typeof q.explain).toBe('string');
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});
