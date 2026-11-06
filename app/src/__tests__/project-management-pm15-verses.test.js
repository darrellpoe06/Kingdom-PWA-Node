// @vitest-environment node
// =============================================================================
// pm15 — sat where they sat: the oldest forward-deployed pattern, and the video
// we never saw
// =============================================================================
// Lesson 15 of Project Management, built 2026-11-06 from a McKinsey & Company
// email Darrell forwarded on 2026-10-22 with two words typed above the header:
// Lesson, and research. Two instructions, not a label, and both are answered —
// the teaching, and a research pass whose findings are stated in the reader's
// own text.
//
// THE THING THIS FILE EXISTS TO PROTECT, AND IT IS THE HONESTY ABOUT A SOURCE
// WE ONLY HALF HAVE.
//
// THE SEND IS A PROMOTION FOR A VIDEO, NOT AN ARTICLE, AND WE NEVER SAW THE
// VIDEO. There is no article body anywhere in it: two teaser paragraphs, three
// headshots, three names, one link to a video Explainer, and then subscription
// furniture. pm13's source was a one-sentence teaser and pm14's was an
// advertiser's pitch; this one is a trailer. So every reader place says what
// the item was and says we never watched it, and the checks below make that
// honesty non-removable. No view is attributed to Holger Hürtgen, Martin
// Harrysson or Nick Robson beyond the two sentences the email literally
// contains, and nothing claims to report what the video said.
//
// WHAT THE SEND DOES CONTAIN IS GENUINELY USEFUL AND IS QUOTED RATHER THAN
// PARAPHRASED AS OURS. The most interesting line in it is the publication's own
// scepticism about its own cover story — that the term "may be a buzzword for a
// service that consulting firms and technology providers have offered for
// years". A publisher saying that about its own headline is telling the truth,
// and under DR-0100 §5 an under-claim is as much a failure as an over-claim, so
// the lesson states it plainly rather than hedging it. The surge claim is
// ATTRIBUTED and never asserted: there is no survey, sample, date range or
// definition behind it anywhere in the message.
//
// THE RESEARCH PASS AND ITS REFUSALS (DR-0190 / DR-0076 §8). The checkable
// question is the send's own "offered for years". Three primary roads were
// attempted and every one was refused by this session's egress:
// www.palantir.com (the originating company's own writing), www.sec.gov and
// sec.gov (its own filed prospectus, CIK 1321655), and www.mckinsey.com (the
// only road to the video). All returned "getaddrinfo ENOTFOUND"; the filings
// full-text host answered with a proxy refusal and no page. So the page says
// NO PRIMARY SOURCE WAS READ, names each host, and quotes the refusal. WHAT THE
// CHECKING CHANGED is on the page too: the lesson was going to date the
// practice and call the title a rename of a decades-old service, and after
// checking it dates nothing, because the only road that answered was a search
// index whose summaries disagreed with each other.
//
// THE ADVERTISING FURNITURE WAS IGNORED, which is the standing rule and needs
// no exception here: app-store badges, share buttons, "Follow our thinking",
// manage-subscriptions and unsubscribe touch nothing in the subject. One line
// of it earned a place as a measured fact rather than a complaint, because it
// is rare to see it printed so plainly — the message says that opening it or
// clicking a link is agreement to cookies and web tracking.
//
// THE WORD IS FIRST AND IT IS THE AUTHORITY (DR-0127 / DR-0282 / DR-0098). The
// pattern the newsletter is selling is in Scripture about twenty-six centuries
// early and better: Ezekiel SAT WHERE THEY SAT seven days before a word came
// (Ezekiel 3:15-17); Nehemiah viewed the broken wall himself, at night, telling
// no man, and then said WE and US (Nehemiah 2:11-17); Jethro WATCHED a whole
// working day and opened with a question before any verdict (Exodus
// 18:13-18); Paul worked the same craft and would not be chargeable (Acts
// 18:3; 1 Thessalonians 2:9; 2 Thessalonians 3:8; 1 Corinthians 2:3); and the
// ground under all of it is that the Word was made flesh and dwelt among us
// (John 1:14; Philippians 2:7; Hebrews 4:15), handled with reverence — the
// point is that nearness is Yahweh's way, NOT that an engineer is like Christ.
// The correction keeps presence from becoming flattery: Job's friends did the
// nearness perfectly (Job 2:13) and the speaking afterward drew wrath (Job
// 42:7). The dividing line the Word draws is ownership, not title (John
// 10:12-13), and counsel before hearing is folly (Proverbs 18:13).
//
// MEASURED BEFORE A WORD WAS WRITTEN (DR-0076 §4). Across app/src and
// docs/decisions, excluding app/public/bible/xref/: Ezekiel 3:15 appeared in
// ZERO files and Exodus 18:14 in ZERO files — the repository had never opened
// either. Per DR-1317 no verse is spent: Proverbs 24:3-4 and the Resources are
// used here on a different landing from pm14's, and the overlap is named in the
// decision record, never in a reader's text.
// =============================================================================

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

const PM15_ID = 'pm15-sat-where-they-sat-the-oldest-forward-deployed-pattern';
const L = () => PROJECT_MANAGEMENT_MODULES.find((m) => m.id === PM15_ID);

// Every verse this lesson stands on, re-read from the corpus at test time so a
// pin can never be "what I remember the verse saying".
const PINNED = [
  '1 Corinthians 2:3',
  '1 Corinthians 13:1',
  '1 Thessalonians 2:9',
  '2 Thessalonians 3:8',
  'Acts 18:3',
  'Deuteronomy 6:7',
  'Ecclesiastes 1:9',
  'Ecclesiastes 1:10',
  'Exodus 18:13',
  'Exodus 18:14',
  'Exodus 18:17',
  'Exodus 18:18',
  'Ezekiel 3:15',
  'Ezekiel 3:16',
  'Ezekiel 3:17',
  'Galatians 5:22',
  'Galatians 6:2',
  'Hebrews 1:8',
  'Hebrews 3:13',
  'Hebrews 4:15',
  'Jeremiah 6:16',
  'Job 2:13',
  'Job 42:7',
  'John 1:14',
  'John 1:29',
  'John 3:16',
  'John 10:12',
  'John 10:13',
  'Nehemiah 2:11',
  'Nehemiah 2:12',
  'Nehemiah 2:13',
  'Nehemiah 2:17',
  'Philippians 2:7',
  'Proverbs 18:13',
  'Proverbs 24:3',
  'Proverbs 24:4',
  'Proverbs 27:17',
  'Romans 12:15',
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

describe('pm15 is in the Project Management course, whole, with every reader version', () => {
  it('is the fifteenth lesson, uniquely, and the header count is the real one', () => {
    const m = L();
    expect(m, 'pm15 is not in PROJECT_MANAGEMENT_MODULES').toBeTruthy();
    expect(PROJECT_MANAGEMENT_MODULES.filter((x) => x.id === PM15_ID)).toHaveLength(1);
    expect(PROJECT_MANAGEMENT_MODULES.filter((x) => /^pm15-/.test(x.id))).toHaveLength(1);
    expect(PROJECT_MANAGEMENT_MODULES.indexOf(m)).toBe(14);
    expect(PROJECT_MANAGEMENT_META.weeks).toBe(PROJECT_MANAGEMENT_MODULES.length);
  });

  // DR-1316: a lesson's gate may NOT claim to be the last lesson. This course
  // DERIVES its count, so it is open and this gate must be too. Contiguity from
  // one is asserted; nothing is asserted about what comes after pm15.
  it('the lessons run contiguously from one, and pm15 sits at the fifteenth place', () => {
    const nums = PROJECT_MANAGEMENT_MODULES.map((m) => Number(/^pm(\d+)-/.exec(m.id)[1]));
    expect(new Set(nums).size, 'two lessons may not share a number').toBe(nums.length);
    expect(nums, 'the course numbers must run 1..n with no gap').toEqual(Array.from({ length: nums.length }, (_, i) => i + 1));
    expect(nums, 'pm15 must be in the course').toContain(15);
    expect(PROJECT_MANAGEMENT_MODULES[14].id).toBe(PM15_ID);
  });

  // PROVEN-TO-BE-FORWARD-SAFE, and written the way pm13's defect taught us to
  // write it. pm13's own forward-safety case appended the LITERAL 14, which was
  // true while the course ended at 13 and false the instant pm14 landed — DR-
  // 1316's defect class reproduced inside its own fix. The next number is
  // DERIVED here, so no edit is owed to this file when pm16 arrives.
  it('PROVEN-TO-BE-FORWARD-SAFE: the NEXT lesson landing does not break this gate (DR-1316)', () => {
    const nums = [...PROJECT_MANAGEMENT_MODULES.map((m) => Number(/^pm(\d+)-/.exec(m.id)[1])), PROJECT_MANAGEMENT_MODULES.length + 1];
    expect(nums).toEqual(Array.from({ length: nums.length }, (_, i) => i + 1));
    expect(nums.indexOf(15), 'pm15 stays at the fifteenth place').toBe(14);
    expect(Math.max(...nums), 'this gate never claims pm15 is the highest').not.toBe(15);
  });

  // THE LIBRARY RATCHET IS THE REASON THIS TEST EXISTS (DR-1266). Measured on
  // the tree this lesson was built from, live `waiting` sat at the frozen
  // baseline's 374 with ZERO slack, so a lesson landing without its adult
  // register or its facilitator fields would have raised `waiting` and failed
  // the build. pm15 lands WHOLE and this pin keeps it that way.
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

  it('carries two real stories, and neither is labelled a testimony nobody can name (DR-1123)', () => {
    const stories = L().stories || [];
    expect(stories.length, 'a lesson carries at least two stories').toBeGreaterThanOrEqual(2);
    for (const s of stories) {
      // Nobody's life is on the record here: the source was a forwarded
      // promotion, so there is no person to name in a `source:` field, and a
      // story with no one to name is a parable. Always.
      expect(s.kind, `"${s.title}" must be a parable, not a testimony`).toBe('parable');
      expect(s.body.trim().length, `"${s.title}" is too short to be a story`).toBeGreaterThan(400);
    }
  });
});

describe('pm15 — the verses are the corpus, verbatim', () => {
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
          'and I sat where they sat, and remained there astonished among them seven days',
          'and I sat where they sat, and remained there astonished among them seven weeks'
        ),
      },
    };
    expect(broken.levels.child).not.toBe(m.levels.child);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.length, 'the scan did not catch an altered quotation').toBeGreaterThan(0);
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });
});

describe('pm15 — the source is a PROMOTION FOR A VIDEO WE NEVER SAW, and the honesty cannot be edited out', () => {
  it('his words are carried: Lesson, and research', () => {
    const all = EVERY_TEXT().join('\n');
    expect(
      /two words typed above (?:it|the header)[^.]*Lesson and research|two words (?:over|above) it: Lesson and research/.test(all),
      'his words are not carried'
    ).toBe(true);
    for (const place of ['youth', 'teen', 'senior']) {
      expect(/research/i.test(L().levels[place]), `${place} never names the second thing he asked for`).toBe(true);
    }
  });

  it('EVERY reader place says it was a promotion for a video and that WE NEVER SAW IT', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['lesson', L().lesson],
      ['child', L().levels.child],
      ['youth', L().levels.youth],
      ['teen', L().levels.teen],
      ['senior', L().levels.senior],
    ]) {
      expect(/never saw the video|video we never saw/i.test(text), `${where} never says we did not see the video`).toBe(true);
    }
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['lesson', L().lesson],
      ['teen', L().levels.teen],
      ['senior', L().levels.senior],
    ]) {
      expect(/promotion for a video|advertisement for a video/i.test(text), `${where} never calls it a promotion for a video`).toBe(true);
      expect(/no article/i.test(text), `${where} never says there was no article`).toBe(true);
      expect(/no byline/i.test(text), `${where} never says there was no byline`).toBe(true);
    }
  });

  it('NOTHING IS PUT IN THE THREE SPEAKERS’ MOUTHS: they are named as the SOURCE names them, never as teachers', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/Hürtgen/.test(all), 'the speakers are never named at all').toBe(true);
    expect(/named in the SOURCE/i.test(all), 'the speakers are not placed in the source rather than in the teaching').toBe(true);
    expect(/not teachers of this lesson|they are not teachers/i.test(all), 'the speakers are not excluded as teachers').toBe(true);
    // And the limit on what may be attributed to them is stated out loud.
    expect(
      /beyond the two sentences the email (?:itself )?(?:literally )?(?:contains|prints)/i.test(all),
      'the page never states the limit on what may be attributed to them'
    ).toBe(true);
  });

  it('WHO TAUGHT: nobody — never the bare phrase "the teacher", and never Bishop Gwin (DR-0719)', () => {
    const all = EVERY_TEXT().join('\n');
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['lesson', L().lesson],
      ['child', L().levels.child],
      ['youth', L().levels.youth],
      ['teen', L().levels.teen],
      ['senior', L().levels.senior],
    ]) {
      expect(/[Nn]obody taught this lesson/.test(text), `${where} does not say nobody taught it`).toBe(true);
      expect(/no class/i.test(text), `${where} does not say there was no class`).toBe(true);
    }
    expect(/\bthe teacher\b/i.test(all), 'the bare phrase "the teacher" reaches a reader').toBe(false);
    expect(/Gwin/i.test(all), 'a teacher is credited who did not teach this').toBe(false);
  });

  it('the page says an A.I. agent drafted it and the gates decide', () => {
    for (const text of [L().bigIdea, L().lesson, L().levels.senior]) {
      expect(/[Aa]n A\.I\. agent drafted/.test(text)).toBe(true);
      expect(/the gates decide/.test(text)).toBe(true);
    }
    // the child band says the same thing in a child's words
    expect(/computer helper wrote it/i.test(L().levels.child)).toBe(true);
  });

  it('THE THREE TIERS are all three, so a truth is not shrunk and a claim is not inflated (DR-0100)', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['teen', L().levels.teen],
      ['senior', L().levels.senior],
    ]) {
      expect(/ESTABLISHED/.test(text), `${where} has no established tier`).toBe(true);
      expect(/ATTRIBUTED/.test(text), `${where} has no attributed tier`).toBe(true);
      expect(/UNVERIFIED/.test(text), `${where} has no unverified tier`).toBe(true);
    }
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['senior', L().levels.senior],
    ]) {
      expect(/OVER-REACH/.test(text), `${where} has no over-reach tier`).toBe(true);
    }
  });

  it('THE SURGE CLAIM IS ATTRIBUTED AND NEVER OURS, and the reason is stated: no number is behind it', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['teen', L().levels.teen],
      ['senior', L().levels.senior],
    ]) {
      expect(/has surged in recent months/.test(text), `${where} drops the claim being weighed`).toBe(true);
      expect(/no survey/i.test(text), `${where} never says there is no survey behind it`).toBe(true);
      expect(/no sample/i.test(text), `${where} never says there is no sample behind it`).toBe(true);
      expect(/stays (?:the author’s|theirs)/i.test(text), `${where} never says the claim stays theirs`).toBe(true);
    }
    // And no figure is invented to fill the hole the source left.
    expect(
      EVERY_TEXT()
        .join('\n')
        .match(/\d+(?:\.\d+)?\s?(?:%|per cent|percent)/g),
      'a percentage appears, and the source carried none'
    ).toBeNull();
  });

  it("THE PUBLICATION'S OWN SCEPTICISM is quoted, not paraphrased as ours, and stated PLAINLY (DR-0100 §5)", () => {
    const BUZZWORD =
      'may be a buzzword for a service that consulting firms and technology providers have offered for years: embedding engineers at a client’s company, inside its systems and data, to build software alongside the people who will use it.';
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['lesson', L().lesson],
      ['teen', L().levels.teen],
      ['senior', L().levels.senior],
    ]) {
      expect(text, `${where} does not carry the publication's own scepticism verbatim`).toContain(BUZZWORD);
    }
    // Plainly, because THEY printed it — not hedged into "some say".
    expect(/rather than hedging it/i.test(L().bigIdea + L().levels.senior), 'the plain statement of their own printed words is hedged').toBe(true);
    // And the disagreement between the three is carried as the send framed it.
    expect(/still evolving/.test(L().bigIdea + L().levels.senior), 'the send’s note that the role is still evolving is dropped').toBe(true);
    expect(/do not agree/i.test(L().bigIdea + L().levels.senior + L().lesson), 'the send’s own signal that the three disagree is dropped').toBe(true);
  });

  it('TRUST BUT VERIFY: what was checked, the primary source, what the checking CHANGED, and the honest limit (DR-0190 §5)', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['senior', L().levels.senior],
    ]) {
      expect(/TRUST BUT VERIFY|What we checked|WHAT WE CHECKED/i.test(text), `${where} has no audit`).toBe(true);
      expect(/primary source/i.test(text), `${where} never names the primary source`).toBe(true);
      expect(/WHAT THE CHECKING CHANGED/i.test(text), `${where} never says what checking changed`).toBe(true);
      expect(/honest limit/i.test(text), `${where} never states the honest limit`).toBe(true);
      expect(/NO PRIMARY SOURCE WAS READ/i.test(text), `${where} does not state the limit plainly`).toBe(true);
    }
    // The change itself, named: a date was going to be claimed and is not.
    expect(/it dates nothing/i.test(L().bigIdea + L().levels.senior), 'the actual change the checking produced is not stated').toBe(true);
  });

  it('A BLOCKED ROAD NEVER READS AS A VERIFIED CLAIM: every refused host is NAMED, with the refusal quoted (DR-0076 §8)', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['lesson', L().lesson],
      ['senior', L().levels.senior],
    ]) {
      expect(/www\.palantir\.com/.test(text), `${where} does not name the originating company's host`).toBe(true);
      expect(/www\.sec\.gov/.test(text), `${where} does not name the filings host`).toBe(true);
      expect(/www\.mckinsey\.com/.test(text), `${where} does not name the publisher's own host`).toBe(true);
      expect(/getaddrinfo ENOTFOUND/.test(text), `${where} does not quote the refusal`).toBe(true);
    }
    // And the one road that DID answer is named for what it is, so a search
    // index is never mistaken for a primary document.
    expect(/search index/i.test(L().bigIdea + L().levels.senior), 'the only working road is not named').toBe(true);
    expect(
      /disagreed with itself|two different years/i.test(L().bigIdea + L().levels.senior),
      'the disagreement in the secondary sources is not reported'
    ).toBe(true);
  });

  it('THE ADVERTISING FURNITURE was ignored and said so, and the one measured fact from it is reported without complaint', () => {
    for (const [where, text] of [
      ['bigIdea', L().bigIdea],
      ['lesson', L().lesson],
      ['senior', L().levels.senior],
    ]) {
      expect(/furniture/i.test(text), `${where} never names the furniture`).toBe(true);
      expect(/ignored/i.test(text), `${where} never says it was ignored`).toBe(true);
    }
    for (const text of [L().bigIdea, L().levels.senior]) {
      expect(text).toContain('By opening our emails or clicking on links, you agree to our use of cookies and web tracking technology.');
      expect(/measured fact/i.test(text), 'the cookie line is not framed as a measured fact').toBe(true);
    }
  });
});

describe('pm15 — the Word is the authority, and it is taught rather than debated', () => {
  it('THE SPINE: Ezekiel sat where they sat, and the word came AFTER, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops the spine of the lesson`).toContain('and I sat where they sat, and remained there astonished among them seven days');
      expect(text, `${place} drops the order the whole lesson turns on`).toContain(
        'And it came to pass at the end of seven days, that the word of the LORD came unto me, saying,'
      );
    }
    // The order is stated as the point, not left for the reader to infer.
    for (const text of [L().lesson, L().levels.senior, L().levels.youth, L().levels.child]) {
      expect(/[Nn]earness (?:came |)first|[Ss]itting with them came first/.test(text), 'the order is never stated').toBe(true);
    }
    // And the commission, which is what the seven days earned.
    expect(L().lesson).toContain('Son of man, I have made thee a watchman unto the house of Israel');
  });

  it('NEHEMIAH IS THE PROJECT CASE: he viewed it himself, told no man, and then said WE', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops the night survey`).toContain('and viewed the walls of Jerusalem, which were broken down');
      expect(text, `${place} drops the WE`).toContain('come, and let us build up the wall of Jerusalem, that we be no more a reproach');
    }
    for (const text of [L().lesson, L().levels.teen, L().levels.senior]) {
      expect(text).toContain('neither told I any man what my God had put in my heart to do at Jerusalem');
      expect(text).toContain('So I came to Jerusalem, and was there three days');
    }
  });

  it('JETHRO IS THE HONEST OUTSIDER: he WATCHED a whole day and opened with a QUESTION before any verdict', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain('that Moses sat to judge the people: and the people stood by Moses from the morning unto the evening');
    expect(adult).toContain('And when Moses’ father in law saw all that he did to the people');
    expect(adult).toContain('why sittest thou thyself alone, and all the people stand by thee from morning unto even?');
    expect(adult).toContain('The thing that thou doest is not good');
    expect(adult).toContain('for this thing is too heavy for thee; thou art not able to perform it thyself alone');
    expect(
      /a QUESTION, not a finding|a question rather than a finding|a QUESTION rather than a finding/i.test(adult),
      'the question-before-verdict point is never made'
    ).toBe(true);
    // And the earlier lesson's landing on that same chapter is acknowledged so
    // the reader is not taught the delegation half twice (DR-1317).
    expect(
      /already worked (?:the second half of |the rest of )that chapter/i.test(L().lesson + L().levels.senior),
      'the overlap with the earlier lesson on Exodus 18 is not acknowledged'
    ).toBe(true);
  });

  it('PAUL WORKED RATHER THAN ADVISED, and refused the posture of the expert', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain('And because he was of the same craft, he abode with them, and wrought: for by their occupation they were tentmakers');
    expect(adult).toContain('because we would not be chargeable unto any of you');
    expect(adult).toContain('that we might not be chargeable to any of you');
    expect(adult).toContain('And I was with you in weakness, and in fear, and in much trembling');
  });

  it('THE CORRECTION, so presence is never flattered: Job’s friends sat right and spoke wrong, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops the seven days on the ground`).toContain(
        'So they sat down with him upon the ground seven days and seven nights, and none spake a word unto him'
      );
    }
    for (const text of [L().lesson, L().levels.teen, L().levels.senior, L().levels.youth]) {
      expect(text).toContain('My wrath is kindled against thee, and against thy two friends: for ye have not spoken of me the thing that is right');
    }
    expect(
      /necessary and it is not sufficient|necessary but not sufficient/i.test(L().lesson + L().levels.senior + L().levels.teen),
      'the lesson never says nearness is necessary and not sufficient'
    ).toBe(true);
    expect(/sitting was right.{0,20}speaking was wrong/i.test(L().lesson + L().levels.senior + L().levels.teen), 'both halves are not held').toBe(true);
  });

  it('THE DIVIDING LINE IS OWNERSHIP, NOT THE TITLE — which is the thing the three could not settle', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain('whose own the sheep are not, seeth the wolf coming, and leaveth the sheep, and fleeth');
    expect(adult).toContain('The hireling fleeth, because he is an hireling, and careth not for the sheep');
    expect(/whose own the sheep are\.? Not the title|It is whose own the sheep are|[Nn]ot the title/i.test(adult), 'the dividing line is never named').toBe(
      true
    );
    expect(adult).toContain('He that answereth a matter before he heareth it, it is folly and shame unto him');
  });

  it('THE GROUND: the Word was made flesh and dwelt among us — with the reverence guard stated out loud', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops the ground of the whole lesson`).toContain(
        'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth'
      );
    }
    for (const text of [L().lesson, L().levels.teen, L().levels.senior]) {
      expect(text).toContain('But made himself of no reputation, and took upon him the form of a servant, and was made in the likeness of men:');
      expect(text).toContain('For we have not an high priest which cannot be touched with the feeling of our infirmities');
      // THE REVERENCE GUARD. The point is that nearness is His way, never that
      // an embedded engineer resembles Christ.
      expect(/NOT that an embedded engineer (?:is like|resembles) Christ|not that a job is like Christ/i.test(text), 'the reverence guard is missing').toBe(
        true
      );
      // The separator and the pronoun are both free: what must be present is
      // the claim. (Written loosely on purpose after the first draft of this
      // matcher required "Him; it never" with no space and reported a hole in
      // three places that all carried the line.)
      expect(/borrows from Him[;,.]?\s*(?:it\s+)?never stands beside Him/i.test(text), 'the borrows-never-stands-beside line is missing').toBe(true);
    }
  });

  it('THE BUZZWORD QUESTION is answered from the Word, and no date is claimed', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior, L().bigIdea].join('\n');
    expect(adult).toContain('and there is no new thing under the sun');
    expect(adult).toContain('Is there any thing whereof it may be said, See, this is new? it hath been already of old time, which was before us');
    expect(adult).toContain('ask for the old paths, where is the good way, and walk therein, and ye shall find rest for your souls');
    expect(/the name is the least important part/i.test(adult), 'the conclusion is never drawn').toBe(true);
  });

  it('THE RESOURCES are named AND capitalised where they are named as the Resources, with Love senior (DR-0530)', () => {
    const adult = [L().lesson, L().levels.senior].join('\n');
    expect(adult).toContain('Through wisdom is an house builded; and by understanding it is established');
    expect(adult).toContain('And by knowledge shall the chambers be filled with all precious and pleasant riches');
    expect(/Wisdom builds, Understanding establishes, Knowledge fills/.test(adult)).toBe(true);
    expect(/Love is senior/.test(adult)).toBe(true);
    expect(adult).toContain('Though I speak with the tongues of men and of angels, and have not charity, I am become as sounding brass, or a tinkling cymbal');
    // The different landing from the earlier lesson that used these verses is
    // said out loud for the reader, without naming a record id (DR-1317).
    expect(/An earlier lesson in this course used these same two verses/i.test(L().levels.senior), 'the different landing is not named').toBe(true);
  });

  it('GROWTH IS MEASURED THE WORD’S WAY, both halves, and none of it imported', () => {
    const adult = [L().lesson, L().levels.senior].join('\n');
    expect(adult).toContain('But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,');
    expect(adult).toContain('But exhort one another daily, while it is called To day');
    expect(
      /[Nn]one of it imported|none of those is borrowed|[Nn]ot one of those is borrowed/.test(adult),
      'the refusal of imported measures is never stated'
    ).toBe(true);
    expect(/hours (?:spent )?inside the work/i.test(adult), 'the quantitative measure is never named').toBe(true);
  });

  it('the industry term is named as THEIR term and never as the authority (DR-0098)', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/grown-ups now call|people now call|what a forward-deployed engineer is|job title/i.test(all), 'the term is never placed as theirs').toBe(true);
    // The Word is never staged as one of several views to pick from.
    expect(/you decide|three views|pick a side/i.test(all), 'the lesson stages a both-sides choice').toBe(false);
  });
});

describe('pm15 — typographic theology holds on every surface', () => {
  it('our own voice says Yahweh (DR-0210), in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(/Yahweh/.test(text), `${place} never names Yahweh`).toBe(true);
    }
    expect(/Yahweh/.test(L().lesson)).toBe(true);
  });

  it('the generic name never appears in OUR voice, on any surface', () => {
    const ours = EVERY_TEXT().map(ourVoice).join('\n');
    expect([...ours.matchAll(/.{0,40}\bGod\b.{0,40}/g)].map((x) => x[0])).toEqual([]);
  });

  it('the KJV\'s own "God" and "the LORD" are untouched inside the quotations (DR-0076 bright line)', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain('that the word of the LORD came unto me'); // Ezekiel 3:16
    expect(all).toContain('what my God had put in my heart to do at Jerusalem'); // Nehemiah 2:12
    expect(all).toContain('we preached unto you the gospel of God'); // 1 Thessalonians 2:9
    expect(all).toContain('Thus saith the LORD, Stand ye in the ways'); // Jeremiah 6:16
    expect(all).toContain('For God so loved the world'); // John 3:16
  });

  it('Jesus is confessed as the Lamb and the Eternal Son of Yahweh', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/Lamb of Yahweh/.test(all)).toBe(true);
    expect(/Eternal Son of Yahweh/.test(all)).toBe(true);
    expect(all).toContain('Behold the Lamb of God, which taketh away the sin of the world');
    expect(all).toContain(
      'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life'
    );
    expect(all).toContain('But unto the Son he saith, Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom');
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

describe('pm15 — every reader place sends the reader in all three directions', () => {
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
      levels: { ...m.levels, teen: m.levels.teen.replace(/Friends, tell one friend this week[^.]*\./, '') },
    };
    expect(stripped.levels.teen).not.toBe(m.levels.teen);
    const named = placesMissingDirections(stripped);
    expect(named.map((p) => p.place)).toContain('teen');
    expect(named.find((p) => p.place === 'teen').missing).toContain('friends');
    // the pooled check still reads green, which is exactly why the per-band
    // check has to exist (DR-0795)
    expect(hasAllThree(stripped)).toBe(true);
    expect(placesMissingDirections(m)).toEqual([]);
  });

  it('PROVEN-TO-CATCH: removing the never-saw-the-video line from one band is caught', () => {
    const m = L();
    const quiet = { ...m, levels: { ...m.levels, child: m.levels.child.replace(/a video we never saw/g, 'a video') } };
    expect(quiet.levels.child).not.toBe(m.levels.child);
    expect(/never saw the video|video we never saw/i.test(quiet.levels.child)).toBe(false);
    expect(/never saw the video|video we never saw/i.test(m.levels.child)).toBe(true);
  });
});

describe('pm15 — the lesson page is whole', () => {
  it('carries every field a lesson page renders', () => {
    const m = L();
    expect(m.bigIdea.length).toBeGreaterThan(200);
    expect(m.inApp.length).toBeGreaterThan(100);
    expect(m.anchor.theme.length).toBeGreaterThan(80);
    expect(m.benefits.length).toBeGreaterThanOrEqual(3);
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
    expect(m.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(3);
    expect(m.facilitator.howToRun.length).toBeGreaterThan(200);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(3);
  });

  it('the hands-on work sends the reader to a real project and a real page in the app', () => {
    expect(/Projects page/.test(L().inApp)).toBe(true);
    // The three questions the step actually asks, so it cannot decay into advice.
    expect(/how many hours/i.test(L().inApp)).toBe(true);
    expect(/whose own are the sheep/i.test(L().inApp)).toBe(true);
    expect(/has not been asked/i.test(L().inApp)).toBe(true);
  });

  it('the quiz answers point at the option they claim', () => {
    for (const q of L().quiz.questions) {
      expect(q.options[q.answer], `answer index out of range: ${q.q.slice(0, 50)}`).toBeTruthy();
      expect(typeof q.explain).toBe('string');
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });
});
