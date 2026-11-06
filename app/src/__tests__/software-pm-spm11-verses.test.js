// @vitest-environment node
// =============================================================================
// spm11 — too old to patch: an unsupported version cannot be fixed on the day
// the fix arrives
// =============================================================================
// Lesson 11 of Software Project Management: Prove It, built 2026-11-06 from a
// University of Illinois Technology Services advisory about the PHP2Shell
// vulnerability, sent to its cPanel users on 2026-10-21 and forwarded by
// Darrell with the single word Lesson (Gmail thread `1a164aa1e4aed308`).
// Recorded as DR-1358.
//
// WHO WROTE THE SOURCE: NOT US, AND NOT HIM. The advisory is a hosting team's
// own notice to its own customers. Darrell forwarded it; he did not write it,
// nobody here operates that cPanel estate, and no sentence of the lesson may
// imply otherwise. The checks below hold that, because an attribution error in
// a teaching artifact is not a typo — it is a false claim about a real party.
//
// WHAT THIS FILE EXISTS TO PROTECT, in the order the failures would cost most:
//
//   1. THE ADVISORY'S WORDS ARE NOT SCRIPTURE AND MUST NOT WEAR ITS CLOTHES.
//      Inside a verbatim-gated module a double quote means the Word and
//      nothing else (SCRIPTURE-REFERENCE-STANDARD, the DR-0314 section). This
//      lesson quotes a secular document heavily, so the temptation to put its
//      clauses in quotation marks is unusually strong. Every double-quoted span
//      in every field — the four bands included, which the course-wide gate
//      does not read — is resolved against app/public/bible/kjv at test time.
//      The advisory is reported in our own voice, unquoted, always.
//   2. A MITIGATION REPORTED AS A FIX. That is the lesson's own middle
//      consequence and it is this house's own recorded failure (DR-0107, a site
//      stale about nine hours under green checks; DR-0125, a fleet of
//      safeguards that never once made an HTTP request to the product). The
//      citations are pinned so a later edit cannot soften them into an
//      invented, untraceable example.
//   3. THE DEFERRAL WHOSE DATE WAS NEVER OURS. spm8 teaches debt named and
//      dated by the borrower. spm11 is the other half: the bill called in on a
//      maintainer's clock, where no amount of naming would have moved the hour.
//      The two are held apart below, by id, so neither is read as the other.
//   4. THE OVER-CLAIM. Nothing here claims the lesson lowers a defect rate,
//      shortens a cycle or raises an exam score. The course header carries that
//      refusal and the course-wide suite checks it; this file keeps spm11 from
//      quietly introducing one of its own.
//
// Every pin is re-read from the corpus on disk, so this file cannot drift from
// the text either — a pin typed from memory would be the exact defect the whole
// verbatim discipline exists to stop.
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

const SPM11 = 'spm11-unsupported-cannot-be-patched';
const M = () => SOFTWARE_PM_MODULES.find((m) => m.id === SPM11);

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
  'Proverbs 22:3': 'A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.',
  'Proverbs 6:10': 'a little folding of the hands to sleep',
  'Proverbs 6:11': 'So shall thy poverty come as one that travelleth, and thy want as an armed man.',
  'Jeremiah 6:14': 'healed also the hurt of the daughter of my people slightly',
  'Deuteronomy 19:15': 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established',
  'Galatians 6:5': 'For every man shall bear his own burden.',
  'Philippians 3:13': 'forgetting those things which are behind, and reaching forth unto those things which are before',
  '2 Samuel 12:23': 'I shall go to him, but he shall not return to me',
  'Proverbs 24:30': 'I went by the field of the slothful',
  'Proverbs 24:31': 'the stone wall thereof was broken down',
};

describe('spm11 is the eleventh lesson of the course, and the course counts itself', () => {
  // AMENDED 2026-11-06 BY spm12 (DR-1366), and the amendment is the honest one.
  // This case asserted `length === 11` and that spm11 was LAST. Neither was ever
  // a property OF spm11: both were claims about the course having nothing after
  // it, which only a twelfth lesson can falsify — and the twelfth lesson did.
  // CI shard 4/4 named it. So the pin is moved to what it actually meant and
  // what stays true for good: spm11 exists, it sits at INDEX 10 (the eleventh),
  // and the week count is still derived from the array rather than pinned
  // (DR-0677). The course's total length and which lesson is last belong to
  // whichever lesson is last, and spm12's own gate holds them there, along with
  // contiguity spm1..spmN read off the ids. Nothing spm11 protects was weakened:
  // every other case in this file is untouched.
  it('the lesson exists, is the eleventh, and the week count is derived rather than pinned', () => {
    expect(M(), 'spm11 is not in SOFTWARE_PM_MODULES').toBeTruthy();
    expect(SOFTWARE_PM_MODULES.length, 'the course may grow, but never shrink past spm11').toBeGreaterThanOrEqual(11);
    expect(SOFTWARE_PM_MODULES.findIndex((m) => m.id === SPM11), 'spm11 is the ELEVENTH lesson').toBe(10);
    // DR-0677: weeks is a getter over the array, so a new lesson edits no count.
    expect(SOFTWARE_PM_META.weeks).toBe(SOFTWARE_PM_MODULES.length);
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
    // ladder four-band-group-c.test.js applies to it, restated here so spm11
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
    expect(m.anchor.ref.split(';').map((x) => x.trim())).toEqual(['Proverbs 22:3', 'Proverbs 6:10-11', 'Jeremiah 6:14', 'Deuteronomy 19:15', 'Galatians 6:5']);
    for (const ref of Object.keys(SPINE)) {
      expect(verses(ref), `${ref} does not resolve in the corpus`).not.toBeNull();
    }
  });

  it('every pinned fragment is in the verse it is pinned to', () => {
    // The pin is a fragment plus a reference; the VALUE comes off disk. If a
    // verse text here were typed from memory, this is where it fails.
    for (const [ref, fragment] of Object.entries(SPINE)) {
      expect(norm(verses(ref)).includes(norm(fragment)), `${ref} does not contain: ${fragment}`).toBe(true);
    }
  });

  it('EVERY double-quoted span in EVERY field is verbatim Scripture the lesson points at', () => {
    // Wider than the course-wide gate on purpose: it reads teen and senior
    // only, so the child and youth bands — the readers least able to check —
    // had no whole-span cover until this.
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
  // CAUGHT IN CI, NOT HERE, ON THE FIRST PUSH. talk-together.test.js requires
  // every lesson added on or after 2026-10-01 to send the reader in all three
  // directions — parents to children, children to parents, friend to friend —
  // IN EVERY BAND, because a reader reads ONE band. The first draft did it in
  // none of the four. That is the finding: this file was built to hold what
  // spm11 says about ITS OWN subject and never asked whether the lesson obeys
  // the rules every new lesson obeys. It asks now.
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
  const ADVISORY = [
    // The clauses the lesson leans on. Each must appear in our own voice and
    // OUTSIDE quotation marks, because a quotation mark here would read as the
    // Word saying it.
    /older versions of PHP will not be patched/i,
    /slower, more controlled removal/i,
    /no way to return to a compatible version/i,
    /only path forward is to update/i,
  ];

  it('the advisory is carried in our own voice, with none of it in quotation marks', () => {
    const text = allText(M());
    for (const re of ADVISORY) expect(re.test(text), `the lesson never reports: ${re}`).toBe(true);
    const quoted = [...text.matchAll(/"([^"]*)"/g)].map((x) => x[1]).join(' ‖ ');
    for (const re of ADVISORY) {
      expect(re.test(quoted), `an advisory clause is inside quotation marks: ${re}`).toBe(false);
    }
  });

  it('the source is placed where a reader can see what it was, and dated', () => {
    const m = M();
    expect(`${m.bigIdea}${m.levels.senior}`).toMatch(/2026-10-21/);
    expect(`${m.bigIdea}${m.levels.youth}${m.levels.senior}`).toMatch(/hosting team/i);
    expect(m.levels.senior, 'the runtime and the version boundary are the fact').toMatch(/PHP release below 8\.3/);
  });

  it('nobody here is credited with the advisory, and no reader is told this estate is ours', () => {
    // The attribution failure, held directly: the forwarder is not the author,
    // and this house does not run that estate.
    const text = allText(M());
    expect(text).not.toMatch(/Darrell/);
    expect(text, 'our own estate must not be implied').not.toMatch(/our (own )?(cPanel|servers|hosting|estate)/i);
    expect(text, 'the lesson must not claim we lived this outage').not.toMatch(/we (were|got) (hit|breached|owned)/i);
  });
});

describe('the teaching is reasoned from the Word, not decorated with it (DR-0281)', () => {
  const t = () => allText(M());

  it('the prudent man is taught as the discipline, not quoted and left', () => {
    expect(t()).toMatch(/foresee/i);
    expect(t(), 'the point of Proverbs 22:3 here is that it is addressed to someone who can still act').toMatch(
      /can still act|while acting is still possible|see it coming and move/i
    );
  });

  it('the deferral is taught with the agency in the verse — the loss moves, the sleeper does not', () => {
    expect(t()).toMatch(/Proverbs 6:1[01]|Proverbs 6:10-11/);
    expect(t(), 'the travelling want is the whole argument of the pin').toMatch(/under its own power|on its own day|its own arrival|keeps the clock/i);
  });

  it('the half-healing is reasoned, so a mitigation cannot be reported as a fix', () => {
    const m = M();
    expect(`${m.anchor.theme}${m.levels.youth}${m.levels.senior}`).toMatch(/Jeremiah 6:14/);
    expect(t(), 'healed slightly must be applied to the mitigation, not merely quoted').toMatch(/healed slightly is (exactly|precisely) what a mitigation/i);
    expect(t(), 'the honesty of the advisory is the model to copy').toMatch(/still risk present until/i);
  });

  it('the two-witness rule is applied to the logs, which is the practical half', () => {
    expect(t()).toMatch(/error_log/);
    expect(t(), 'the two logs hold different contexts — that is the finding').toMatch(/different contexts/i);
    expect(t(), 'one log is not the whole witness').toMatch(/one log is not the whole witness/i);
    expect(t(), 'a clean screen in one file is not an absence of errors').toMatch(/is not an absence of errors/i);
  });

  it('ownership of custom code is taught as ownership of its currency', () => {
    expect(t()).toMatch(/Galatians 6:5/);
    expect(t(), 'the burden-bearing verse must land on who updates the code').toMatch(/owning its currency|ownership of its currency/i);
    expect(t(), 'nobody is coming').toMatch(/nobody else is coming/i);
  });

  it('the irreversibility is taught, and the road is forward', () => {
    expect(M().levels.senior).toMatch(/Philippians 3:13/);
    expect(M().levels.senior).toMatch(/2 Samuel 12:23/);
    expect(t(), 'the no-road-back consequence must be named plainly').toMatch(/no road back|no way to return/i);
  });
});

describe('this house’s own record is cited as a record, never as an illustration', () => {
  it('DR-0107 and DR-0125 are named, in a field that is not a reader band', () => {
    // READER_FIELDS (quotation-integrity.mjs) forbids a DR id in bigIdea, inApp
    // and the four bands: a reader has no idea what DR-0107 is, and a lesson
    // showing its own bookkeeping has stopped speaking to the person in front
    // of it. So the ids live in the benefits and the quiz explanation, and the
    // bands tell the same two failures in reader language.
    const m = M();
    const ids = [...m.benefits, ...m.quiz.questions.map((q) => q.explain)].join('\n');
    expect(ids).toMatch(/DR-0107/);
    expect(ids).toMatch(/DR-0125/);
    for (const where of ['bigIdea', 'inApp', 'levels.child', 'levels.youth', 'levels.teen', 'levels.senior']) {
      const text = fields(m).find(([w]) => w === where)[1];
      expect(/DR-\d{4}/.test(String(text)), `${where} recites a decision record at a reader`).toBe(false);
    }
  });

  it('the senior band tells both failures as written record, with their measured shape', () => {
    const s = M().levels.senior;
    expect(s, 'the nine hours is what makes DR-0107 a cost and not an anecdote').toMatch(/nine hours/i);
    expect(s, 'DR-0125 is the safeguards that never asked the product').toMatch(/HTTP request/i);
    expect(s, 'it must read as our own record rather than an invented example').toMatch(/on its own written record|rather than in an illustration/i);
  });

  it('spm11 is not spm8 — the deferral whose date was never ours is the distinct lesson', () => {
    const debt = SOFTWARE_PM_MODULES.find((m) => m.id === 'spm8-debt-named-and-dated');
    expect(debt, 'spm8 is the lesson spm11 must be distinguishable from').toBeTruthy();
    // spm8: name your debt and date it. The date is the borrower's.
    expect(debt.bigIdea).toMatch(/re-review DATE|re-review date/i);
    // spm11: the date belongs to whoever maintains what you stand on.
    expect(allText(M())).toMatch(/due date (is held by|belongs to) whoever maintains/i);
    expect(M().title.split(/\s+/).slice(0, 3).join(' ')).not.toBe(debt.title.split(/\s+/).slice(0, 3).join(' '));
  });
});

describe('the refusals hold — nothing is claimed that was not measured (DR-0076 §1)', () => {
  it('spm11 claims no effect on a defect rate, a cycle time or an exam score', () => {
    const text = allText(M());
    expect(text).not.toMatch(/defect rate/i);
    expect(text).not.toMatch(/exam score/i);
    expect(text).not.toMatch(/cycle time/i);
    expect(text, 'no unmeasured percentage may be asserted').not.toMatch(/\b\d{1,3}\s?% (fewer|faster|more|less)/i);
  });

  it('the lesson does not call the deferral stupid — the plan was reasonable, the calendar was not theirs', () => {
    // DR-0100: state the established fact plainly, and do not over-reach past
    // it. The removal was already planned; what failed was whose clock it ran
    // on. A lesson that moralised instead would teach the wrong thing.
    expect(M().levels.senior).toMatch(/reasonable plan/i);
    expect(M().levels.senior).toMatch(/who owns the calendar/i);
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

describe('what spm11 costs the library census, stated rather than discovered', () => {
  // ALSO CAUGHT IN CI. The library ratchet lets readings, whole, allVersions and
  // exams only RISE and `waiting` only FALL. spm11 raises waiting by one, and
  // the reason is a property of its COURSE, not a shortfall in the lesson: this
  // course carries no adult `lesson` and no facilitator fields, so all eleven
  // of its lessons count as waiting for a version they were never designed to
  // have. Asserting it here means the fact is a statement in the tree rather
  // than a surprise in a later PR's red build.
  it('spm11 waits for exactly what its ten neighbours wait for, and nothing else', () => {
    const rows = SOFTWARE_PM_MODULES.map((m) => censusLesson(m));
    const mine = rows.find((r) => r.id === SPM11);
    expect(mine.missingVersions, 'the course has no adult lesson field').toEqual(['adult']);
    expect(mine.missingComponents.sort()).toEqual(['howToRun', 'talkingPoints']);
    // Every lesson of this course is identical on this point. If that ever
    // stops being true, the honest +1 in the baseline stops being honest.
    for (const r of rows) {
      expect(r.missingVersions, `${r.id} diverges from its course`).toEqual(mine.missingVersions);
      expect(r.missingComponents.sort(), `${r.id} diverges from its course`).toEqual(mine.missingComponents.sort());
    }
  });

  it('it carries every component the course DOES give a lesson', () => {
    const mine = censusLesson(M());
    for (const id of ['lesson', 'anchor', 'bigIdea', 'quiz', 'benefits', 'inApp']) {
      expect(mine.missingComponents, `spm11 is missing ${id}`).not.toContain(id);
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
    const m = broken({ levels: { ...M().levels, child: M().levels.child.replace('hideth himself', 'hides himself') } });
    const hay = pool(m);
    const bad = [...fields(m).flatMap(([, t]) => [...String(t).matchAll(/"([^"]*)"/g)])].filter((x) => !hay.includes(norm(x[1]).replace(/[.,;:]+$/, '')));
    expect(bad.length, 'a changed word inside His quoted text passed').toBeGreaterThan(0);
  });

  it('a span pinned to the WRONG reference is seen', () => {
    // Philippians 3:13 is not 3:12. scanQuotedVerses resolves the reference,
    // which is the whole reason it exists beside the pool check — the pool
    // alone would pass this, because the words ARE Scripture somewhere.
    // BADLY-AIMED BREAK, CORRECTED (spm7's own lesson): the first version of
    // this case re-tagged the Galatians span, which carries its reference
    // BEFORE the quotation rather than after it, so the replace was a no-op and
    // the gate was never exercised. A break that lands nowhere teaches nothing
    // about the check.
    const m = broken({
      levels: { ...M().levels, senior: M().levels.senior.replace('(Philippians 3:13)', '(Philippians 3:12)') },
    });
    expect(m.levels.senior, 'the break did not land').not.toBe(M().levels.senior);
    const faults = scanQuotedVerses([m], (x) => fields(x)).faults;
    expect(faults.length, 'a quotation tagged with the wrong verse passed').toBeGreaterThan(0);
  });

  it('an advisory clause put in quotation marks is seen', () => {
    const m = broken({
      inApp: `${M().inApp} The notice said "older versions of PHP will not be patched for this critical vulnerability."`,
    });
    const quoted = [...allText(m).matchAll(/"([^"]*)"/g)].map((x) => x[1]).join(' ');
    expect(/older versions of PHP will not be patched/i.test(quoted), 'a secular clause wearing quotation marks passed').toBe(true);
    const hay = pool(m);
    expect(
      hay.includes(norm('older versions of PHP will not be patched for this critical vulnerability')),
      'the pool should not contain a clause that is not Scripture'
    ).toBe(false);
  });

  it('a DR id put into a reader band is seen', () => {
    const m = broken({ levels: { ...M().levels, senior: `${M().levels.senior} (DR-0107.)` } });
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

  it('a lesson that drops its two-witness reasoning is seen', () => {
    // The phrase is carried in THREE places on purpose — the anchor theme, the
    // senior band and the quiz option that is the right answer — so the break
    // has to remove all three. Discovering that was itself the point: the first
    // two aims each left the phrase standing somewhere else, which is the
    // evidence that the reasoning does not rest on one removable sentence.
    const strip = (s) => String(s).replace(/one log is not the whole witness/gi, 'read the logs');
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
    expect(m.quiz.questions[2].options[1], 'the break did not land on the quiz').not.toBe(M().quiz.questions[2].options[1]);
    expect(/one log is not the whole witness/i.test(allText(m)), 'the reasoning was removable without this check going red').toBe(false);
    expect(/one log is not the whole witness/i.test(allText(M())), 'the real lesson must carry the reasoning, or the case above is vacuous').toBe(true);
  });
});

describe('the quotation gate the whole catalog runs reads this lesson too', () => {
  it('quotedTexts covers the lesson, and every span it finds is its own verse', () => {
    // The catalog-wide gate (every-catalog-quotes-the-verse.test.js) pins this
    // file's catalog at exactly 0 faults. Asserting it here as well means a
    // break is named against spm11 rather than against the whole course.
    const covered = quotedTexts(M()).map(([where]) => where);
    for (const b of FOUR_BANDS) expect(covered).toContain(`levels.${b}`);
    const scan = scanQuotedVerses([M()], quotedTexts);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans).toBeGreaterThanOrEqual(10);
  });
});
