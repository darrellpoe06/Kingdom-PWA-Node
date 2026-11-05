// =============================================================================
// NO LESSON GATE CLAIMS A VERSE FOR ITSELF (2026-11-05, DR-1323)
// =============================================================================
// Darrell, 2026-11-05, overturning the spent-verse rule (DR-1317):
//
//   "How can we have only reference one scripture ever?! Doesn't make any
//    sense!"
//
//   "there would be overlapping at times however not the exact same lesson...
//    sometimes 8 points of this lesson does not end with the same message it's
//    close however another point entirely after explaining the foundations of
//    the eternal systems Yahweh created in us and outside of us... How else
//    would they connect?!"
//
// Scripture is the foundation of what we teach, it is finite, and the eternal
// systems Yahweh built rest on common ground -- so two lessons teaching from
// them SHOULD share it, and search-it-out's `sharedGround` (DR-0734) already
// turns that shared ground into the reader's path between lessons.
//
// WHY THIS FILE EXISTS. Two lesson gates had grown assertions that a lesson's
// chapters are FREE of every other lesson, that NO OTHER LESSON may stand on
// one of them, and that the chapters it declined really are "SPENT":
// sov64's gate and sov65's gate, four and three cases respectively, removed by
// DR-1323. They protected nothing -- the only thing DR-0610 forbids is two
// lessons LANDING on the same message, and none of them looked at where a
// lesson lands -- and they actively REFUSED his own future lessons. Measured:
// sov66 cited 2 Kings 18:21, sov65's gate went red in a file sov66 never
// touched (DR-1316's cost shape), and that builder had to carry the teaching on
// Isaiah 36:6 instead -- the Word's other witness, the same clause word for
// word -- rather than drop the reading or edit a neighbour's proof.
//
// Both were written by builders following an instruction that was mine and not
// Darrell's, so removing the two is not enough: the next builder would write a
// third. This is the check that stops it.
//
// WHAT IS STILL ALLOWED, deliberately: a lesson gate asserting its OWN ground
// (its chapter count, its spine, its verses quoted verbatim), and a lesson
// DECLARING that it shares ground with a named neighbour. Only the claim that
// another lesson may not use a verse is refused.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TESTS = HERE;

/** Every test file in the suite. */
const files = () => readdirSync(TESTS).filter((f) => /\.test\.jsx?$/.test(f));

/**
 * A case title that claims a verse or chapter for one lesson, forbidding
 * another lesson from standing on it. Matched on the TITLE, because that is
 * where the claim is made in words a reader trusts.
 */
export const EXCLUSIVITY = [
  /\bFREE of (?:every|all) OTHER\b/i,
  /\bno other lesson stands on\b/i,
  /\bDECLINED AS SPENT\b/i,
  /not one of the \d+ references appears anywhere in another/i,
  /\bchapter already spent\b/i,
];

// THE TITLE WAS NOT ENOUGH (2026-11-05, DR-1326). DR-1323 said so itself:
// "the guard matches CASE TITLES ... it does not read assertion bodies, so a
// gate that enforces exclusivity under an innocent title would pass. I did not
// measure that class." It was measured the next day, and a THIRD instance was
// already on `main`: `living-lessons-ll275-peace-and-truth-in-my-days.test.js`
// refused seven verses with the failure message `${v} is spent in sov46` under
// the title "carries NO verse of 2 Kings 20:12-18 or Isaiah 39:2, which sov46
// already teaches" — which matches none of the five patterns above. It also
// carried two FROZEN CENSUSES pinned by equality (ten chapters asserted absent
// from every other lesson, and a prose census pinned to an exact set), and
// those turned red in a file ll281 (DR-1325) never touched.
//
// So the guard now reads the ASSERTION MESSAGES too. It deliberately does NOT
// flag a frozen census by shape: `toEqual([])` over a computed set is ordinary
// and correct in a hundred honest places, and a matcher that guessed at intent
// would cry wolf (P46). What is machine-checkable is the LANGUAGE of spending,
// which is how a builder states the overturned rule to the next builder.
export const SPENDING_LANGUAGE = [
  /\bis spent in\b/i,
  /\bspent in [a-z]{2,4}\d+\b/i,
  /\balready spent by\b/i,
  /\bbelongs to [a-z]{2,4}\d+ and not\b/i,
  /\bmay not (?:use|stand on|carry) (?:this|that) (?:verse|chapter)\b/i,
  /\breserved for [a-z]{2,4}\d+\b/i,
  // Added 2026-11-05 (DR-1333): the real phrasing seven Sovereign A.I. gates
  // used, which none of the six patterns above matched.
  /\banother week already stands on\b/i,
  /\bdeclared? as spent\b/i,
  /\bdeclined as spent\b/i,
];

// THE WORD WAS HIDING IN AN IDENTIFIER (2026-11-05, DR-1333). DR-1326 widened
// this guard from case titles to assertion MESSAGES, and it still missed the
// class — because the overturned rule was not written in a sentence at all. It
// was the NAME of a constant: `DECLINED_AS_SPENT`, carried by seven gates
// (sov57 through sov63), copied forward lesson after lesson. A builder reading
// any one of those files learns the spent-verse rule from the identifier
// before it reads a word of prose.
//
// Measured: seven Sovereign A.I. gates carried a frozen chapter census, and
// three of them blocked sov67 (DR-1332) outright — Psalms 102, Hebrews 12 and
// Haggai 2. Hebrews 12 had NO route around it: "the removing of those things
// that are shaken, as of things that are made" exists nowhere else in
// Scripture, so unlike sov66's Isaiah 36:6 there was no second witness.
export const SPENDING_IDENTIFIERS = [
  /\bDECLINED_AS_SPENT\b/,
  /\b[A-Z_]*_AS_SPENT\b/,
  /\bSPENT_(?:CHAPTERS|VERSES|GROUND)\b/,
  /\b(?:CHAPTERS|VERSES)_SPENT\b/,
];

/** `const NAME = …` / `let NAME = …` declarations in a file. */
export function declaredNames(text) {
  return [...String(text).matchAll(/^\s*(?:export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
}

/** The string literals passed as an assertion's message, across a file. */
export function assertionMessages(text) {
  const out = [];
  // expect(x, 'message') and expect(x, `message`) — the second argument only.
  for (const m of String(text).matchAll(/expect\((?:[^,()]|\([^()]*\))*,\s*(['"`])((?:(?!\1)[\s\S]){2,400}?)\1/g)) {
    out.push(m[2]);
  }
  return out;
}

/** The `it('…')` titles in a file. */
export function caseTitles(text) {
  return [...String(text).matchAll(/^\s*it\(\s*(['"`])((?:(?!\1).)+)\1/gm)].map((m) => m[2]);
}

describe('no lesson gate claims a verse for itself (DR-1317 / DR-1323)', () => {
  it('the scanner actually finds case titles (not vacuously empty)', () => {
    const t = caseTitles(readFileSync(join(TESTS, 'sovereign-ai-sov65-verses.test.js'), 'utf8'));
    expect(t.length, 'found no it() titles — re-anchor this gate').toBeGreaterThan(10);
  });

  it('NO test in the suite asserts that another lesson may not use a verse', () => {
    const bad = [];
    for (const f of files()) {
      if (f === 'no-lesson-gate-claims-a-verse-for-itself.test.js') continue;
      for (const title of caseTitles(readFileSync(join(TESTS, f), 'utf8'))) {
        if (EXCLUSIVITY.some((re) => re.test(title))) bad.push(`${f}: ${title}`);
      }
    }
    expect(
      bad,
      'these cases enforce the spent-verse rule Darrell overturned on 2026-11-05 (DR-1317). '
      + 'A verse is never spent; shared ground is how lessons connect. Assert your OWN lesson\'s '
      + `ground instead, or declare the neighbour you share it with:\n${bad.join('\n')}`,
    ).toEqual([]);
  });

  it('PROVEN TO CATCH: each removed case title is still recognised as exclusivity', () => {
    // The four real titles removed by DR-1323, reconstructed rather than
    // remembered — if the matcher ever stops seeing them, it is decorative.
    const REMOVED = [
      'every chapter this lesson stands on is FREE of every OTHER lesson in the department',
      'and in the OTHER direction: no other lesson stands on a chapter this one claims',
      'the chapters DECLINED AS SPENT really are spent, so the census cannot have been invented',
      'THE PROSE-LEVEL CENSUS: not one of the 40 references appears anywhere in another department lesson',
    ];
    for (const title of REMOVED) {
      expect(EXCLUSIVITY.some((re) => re.test(title)), `no longer caught: ${title}`).toBe(true);
    }
  });

  it('PROVEN NOT TO OVER-REACH: a lesson asserting its OWN ground passes', () => {
    const FINE = [
      'stands on exactly the chapters it declares, and its spine is whole',
      'every verse is quoted verbatim from the KJV corpus on disk',
      'declares the ground it shares with sov14 rather than hiding it',
      'the lesson and each band end with TALK ABOUT IT TOGETHER in all three directions',
      'all four age bands are written long enough to teach their reader',
    ];
    for (const title of FINE) {
      expect(EXCLUSIVITY.some((re) => re.test(title)), `wrongly flagged: ${title}`).toBe(false);
    }
  });

  it('the two gates that carried it are clean now', () => {
    for (const f of ['sovereign-ai-sov64-verses.test.js', 'sovereign-ai-sov65-verses.test.js']) {
      const titles = caseTitles(readFileSync(join(TESTS, f), 'utf8'));
      const bad = titles.filter((t) => EXCLUSIVITY.some((re) => re.test(t)));
      expect(bad, `${f} still claims a verse for itself: ${bad.join(', ')}`).toEqual([]);
    }
  });

  // ── DR-1326: the same refusal, stated in an assertion message ──────────────

  it('the message scanner actually finds assertion messages (not vacuously empty)', () => {
    const msgs = assertionMessages(readFileSync(join(TESTS, 'living-lessons-ll275-peace-and-truth-in-my-days.test.js'), 'utf8'));
    expect(msgs.length, 'found no expect(x, "message") strings — re-anchor this gate').toBeGreaterThan(5);
  });

  it('NO test in the suite tells the next builder a verse is SPENT', () => {
    const bad = [];
    for (const f of files()) {
      if (f === 'no-lesson-gate-claims-a-verse-for-itself.test.js') continue;
      const text = readFileSync(join(TESTS, f), 'utf8');
      for (const msg of assertionMessages(text)) {
        if (SPENDING_LANGUAGE.some((re) => re.test(msg))) bad.push(`${f}: "${msg}"`);
      }
    }
    expect(
      bad,
      'these failure messages teach the spent-verse rule Darrell overturned on 2026-11-05 (DR-1317). '
      + 'A verse is never spent. Where a lesson genuinely keeps to its own passage, say that it is THIS '
      + "lesson's chosen scope — never that another lesson owns the ground:\n" + bad.join('\n'),
    ).toEqual([]);
  });

  it('PROVEN TO CATCH: the real message ll275 carried is recognised', () => {
    // The literal string on `main` until DR-1326, reconstructed rather than
    // remembered. It refused seven verses of 2 Kings 20 and Isaiah 39 under a
    // title no pattern above matches, which is why the body is read at all.
    expect(SPENDING_LANGUAGE.some((re) => re.test('2 Kings 20:12 is spent in sov46'))).toBe(true);
    expect(SPENDING_LANGUAGE.some((re) => re.test('Isaiah 39:2 is spent in sov46'))).toBe(true);
    // And its title really does evade the title patterns — the measurement that
    // justifies this half of the guard existing.
    expect(
      EXCLUSIVITY.some((re) => re.test('carries NO verse of 2 Kings 20:12-18 or Isaiah 39:2, which sov46 already teaches')),
      'if the title alone were enough, DR-1326 would not have been needed',
    ).toBe(false);
  });

  it('PROVEN NOT TO OVER-REACH: an honest scope message passes', () => {
    const FINE = [
      "2 Kings 20:12 belongs to the treasure-house passage, which is outside this lesson's chosen scope",
      'the just-weight ground really is built in this course',
      'FREE at anchor level',
      'Amos 6:3 was restored by Darrell’s correction and must still be carried',
      'the ten unshared chapters were measured on 2026-11-04 and are reported, not enforced',
    ];
    for (const msg of FINE) {
      expect(SPENDING_LANGUAGE.some((re) => re.test(msg)), `wrongly flagged: ${msg}`).toBe(false);
    }
  });

  // ── DR-1333: the word was hiding in an identifier ─────────────────────────

  it('the name scanner actually finds declarations (not vacuously empty)', () => {
    const names = declaredNames(readFileSync(join(TESTS, 'sovereign-ai-sov62-verses.test.js'), 'utf8'));
    expect(names.length, 'found no const/let names — re-anchor this gate').toBeGreaterThan(10);
  });

  it('NO test in the suite NAMES a constant for the spent-verse rule', () => {
    const bad = [];
    for (const f of files()) {
      if (f === 'no-lesson-gate-claims-a-verse-for-itself.test.js') continue;
      for (const name of declaredNames(readFileSync(join(TESTS, f), 'utf8'))) {
        if (SPENDING_IDENTIFIERS.some((re) => re.test(name))) bad.push(`${f}: ${name}`);
      }
    }
    expect(
      bad,
      'an identifier teaches the next builder before any prose does, and this one teaches the rule '
      + 'Darrell overturned on 2026-11-05 (DR-1317). A verse is never spent. Name it for what the '
      + "choice actually was — DECLINED_FOR_ANOTHER_LANDING — not for a claim on another lesson's "
      + `ground:\n${bad.join('\n')}`,
    ).toEqual([]);
  });

  it('PROVEN TO CATCH: the real identifier seven gates carried', () => {
    // The literal name on `main` until DR-1333, reconstructed rather than
    // remembered. sov57 through sov63 each declared it.
    expect(SPENDING_IDENTIFIERS.some((re) => re.test('DECLINED_AS_SPENT'))).toBe(true);
    // And the real message those gates used, which DR-1326's six patterns all
    // missed — the measurement that justifies widening them.
    expect(SPENDING_LANGUAGE.some((re) => re.test('another week already stands on: Hebrews 12'))).toBe(true);
    // The replacement name must NOT be flagged, or the fix is unshippable.
    expect(SPENDING_IDENTIFIERS.some((re) => re.test('DECLINED_FOR_ANOTHER_LANDING'))).toBe(false);
  });

  it('PROVEN NOT TO OVER-REACH: ordinary gate identifiers pass', () => {
    const FINE = ['SPINE', 'OURS', 'ANCHOR_BOOKS', 'DECLINED_FOR_ANOTHER_LANDING',
      'DECLINED_AS_PROSE_BUILT', 'CONFESSION_CHAPTERS', 'SHARED_CHAPTERS', 'DEPT_SOURCES'];
    for (const name of FINE) {
      expect(SPENDING_IDENTIFIERS.some((re) => re.test(name)), `wrongly flagged: ${name}`).toBe(false);
    }
  });

  it('the seven Sovereign A.I. gates are clean in all three directions now', () => {
    const bad = [];
    for (const n of [57, 58, 59, 60, 61, 62, 63]) {
      const f = `sovereign-ai-sov${n}-verses.test.js`;
      const text = readFileSync(join(TESTS, f), 'utf8');
      for (const t of caseTitles(text)) if (EXCLUSIVITY.some((re) => re.test(t))) bad.push(`${f} title: ${t}`);
      for (const m of assertionMessages(text)) if (SPENDING_LANGUAGE.some((re) => re.test(m))) bad.push(`${f} message: ${m}`);
      for (const nm of declaredNames(text)) if (SPENDING_IDENTIFIERS.some((re) => re.test(nm))) bad.push(`${f} name: ${nm}`);
    }
    expect(bad).toEqual([]);
  });

  it('ll275 — the third instance — is clean in BOTH directions now', () => {
    const text = readFileSync(join(TESTS, 'living-lessons-ll275-peace-and-truth-in-my-days.test.js'), 'utf8');
    const badTitles = caseTitles(text).filter((t) => EXCLUSIVITY.some((re) => re.test(t)));
    const badMsgs = assertionMessages(text).filter((m) => SPENDING_LANGUAGE.some((re) => re.test(m)));
    expect([...badTitles, ...badMsgs]).toEqual([]);
  });
});
