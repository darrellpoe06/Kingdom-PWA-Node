// @vitest-environment node
// =============================================================================
// wm9 — the cost of staying warm: the machinery and the rule arriving at one
// household's own door
// =============================================================================
// Lesson 9 of The World Market, captured 2026-10-28 from a Morning Brew
// business newsletter of 8 October 2026 that Darrell forwarded to himself with
// one word above the text: Lessons. Its lead item was the price of heating oil
// and what a winter costs a household.
//
// THE THING THIS FILE EXISTS TO PROTECT, and it is two things at once.
//
//   1. THE SOURCE IS REPORTED AT ITS REAL STANDING. Every figure in the lesson
//      is a DATED, ATTRIBUTED READING of what one named source published on one
//      named day. Nobody in this house opened the Energy Information
//      Administration's projection, the Food & Water Watch study, the
//      weatherization interview or the heating-assistance reporting. The lesson
//      says so, in the adult text and in every band, and the checks below make
//      that disclosure non-removable -- a borrowed number taught as a verified
//      one is exactly the failure DR-0076 sec.8 exists to stop. The sponsor and
//      advertising copy in the same newsletter is refused as advertising; only
//      the PATTERN it illustrates is taught, under Proverbs 22:7.
//
//   2. THE COURSE'S OWN RULE IS NOT QUIETLY BROKEN. The World Market has
//      refused since its first page to quote a LIVE figure. A dated, attributed
//      reading is a categorically different object, and the lesson teaches that
//      distinction out loud rather than relying on it silently. The checks
//      require the distinction to be stated, and require the two questions the
//      reader is sent away with -- who said it, and on what day.
//
// The teaching itself is the Word on a household's fuel and water: the lament
// that the drink and the fuel now carry a price (Lamentations 5:4), the widow
// counting two sticks (1 Kings 17:12), the cold named as a wrong done to a
// person (Job 24:7), the ant ahead of the weather and the woman unafraid of the
// snow (Proverbs 30:25; 31:21), Paul's cloak before winter (2 Timothy 4:21),
// the borrower who is servant to the lender (Proverbs 22:7), the one who SEES
// the naked (Isaiah 58:7), the shut-up compassion (1 John 3:17), and the Lamb
// of Yahweh who was rich and became poor (John 1:29; John 3:16;
// 2 Corinthians 8:9).
//
// Every quoted span is re-read from app/public/bible/kjv at test time, so this
// file cannot drift from the corpus either.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLD_MARKET_MODULES, WORLD_MARKET_META, WORLD_MARKET_TUTOR_META } from '../lib/world-market-course.js';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { anchorRefs } from '../lib/search-it-out.js';
import { lessonSectionPlan } from '../lib/lesson-format.js';
import { scanQuotedVerses, describeFault, loweredHolyNames, ourVoice } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';

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
  } catch { return null; }
  const chap = bookCache.get(name).chapters[Number(m[2]) - 1];
  if (!chap) return null;
  return chap[Number(m[3]) - 1] ?? null;
}

const WM9_ID = 'wm9-the-cost-of-staying-warm';
const L = () => WORLD_MARKET_MODULES.find((m) => m.id === WM9_ID);

// Every verse this lesson stands on. Each is re-read from the corpus at test
// time, so a pin can never be "what I remember the verse saying".
const PINNED = [
  '1 John 3:17', '1 Kings 17:12', '2 Corinthians 8:9', '2 Timothy 4:21',
  'Deuteronomy 6:7', 'Galatians 5:22', 'Hebrews 3:13', 'Isaiah 58:7', 'Job 24:7',
  'John 1:29', 'John 3:16', 'Lamentations 5:4', 'Proverbs 22:7', 'Proverbs 30:25',
  'Proverbs 31:21',
];

const BANDS = ['child', 'youth', 'teen', 'senior'];
const PLACES = () => BANDS.map((k) => ({ place: k, text: L().levels[k] }));

/**
 * The disclosure, however a band words it for its own reader. One pattern, used
 * by the standing check AND by the proven-to-catch case below, so the two can
 * never drift apart and let a removed disclosure read as present.
 */
const SAYS_UNVERIFIED = /(?:verified|checked) against an original|We did not check those numbers/i;

const EVERY_TEXT = () => {
  const m = L();
  const out = [m.title, m.bigIdea, m.inApp, m.anchor.theme, m.lesson, ...(m.benefits || [])];
  out.push(...Object.values(m.levels));
  for (const q of m.quiz.questions) out.push(q.q, q.explain, ...q.options);
  out.push(m.facilitator.howToRun, ...m.facilitator.talkingPoints, ...m.facilitator.discussionPrompts);
  for (const s of m.stories) out.push(s.title, s.body);
  return out.filter((x) => typeof x === 'string');
};

describe('wm9 is in the World Market course, with all four bands', () => {
  it('is the ninth lesson, uniquely, and the header count is the real one', () => {
    const m = L();
    expect(m, 'wm9 is not in WORLD_MARKET_MODULES').toBeTruthy();
    expect(WORLD_MARKET_MODULES.filter((x) => x.id === WM9_ID)).toHaveLength(1);
    expect(WORLD_MARKET_MODULES.filter((x) => /^wm9-/.test(x.id))).toHaveLength(1);
    expect(WORLD_MARKET_MODULES.indexOf(m)).toBe(8);
    expect(WORLD_MARKET_META.weeks).toBe(WORLD_MARKET_MODULES.length);
    expect(WORLD_MARKET_META.format).toContain('9 lessons');
  });

  it('the lessons run in numeric order and wm9 is the last of them', () => {
    const nums = WORLD_MARKET_MODULES.map((m) => Number(/^wm(\d+)-/.exec(m.id)[1]));
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(new Set(nums).size).toBe(nums.length);
    expect(Math.max(...nums)).toBe(9);
    expect(WORLD_MARKET_MODULES[WORLD_MARKET_MODULES.length - 1].id).toBe(WM9_ID);
  });

  it('wm8 no longer calls itself the last lesson of the course, because it is not', () => {
    // Adding a ninth made four sentences in wm8 false on the page a reader
    // meets. Surfaces say true things (DR-0239); the smallest honest fix was
    // four words, and this pins it so a later edit cannot quietly undo it.
    const wm8 = WORLD_MARKET_MODULES.find((m) => /^wm8-/.test(m.id));
    for (const band of BANDS) {
      expect(wm8.levels[band], `wm8 ${band} still claims to be the last lesson`)
        .toContain('is the last lesson of the eight');
    }
  });

  it('every one of the four bands is written long enough to teach its reader', () => {
    for (const band of BANDS) {
      expect(typeof L().levels[band], `band ${band}`).toBe('string');
      expect(L().levels[band].length, `band ${band} is too short to teach`).toBeGreaterThan(900);
    }
    expect(L().levels.senior.length).toBeGreaterThan(L().levels.teen.length);
  });
});

describe('wm9 — the four bands hold, MEASURED and not claimed (DR-0076 sec.4)', () => {
  it('each band carries at least its floor share of the adult lesson\'s own prose', () => {
    const full = measureFullness(L());
    expect(full.adultWords).toBeGreaterThan(800);
    for (const b of BANDS) {
      expect(full.bands[b].share, `${b} carries ${full.bands[b].share} of the adult lesson`)
        .toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
    expect(shortBands(full)).toEqual([]);
  });

  it('the reading ladder is strictly ascending and the child band is under the new-lesson ceiling', () => {
    const rl = measureLesson(L());
    const ladder = BANDS.map((b) => rl.bands[b].authored);
    expect(isInverted(rl), `ladder ${ladder.join(' / ')}`).toBe(false);
    for (let i = 0; i + 1 < ladder.length; i += 1) {
      expect(ladder[i], `${BANDS[i]} ${ladder[i]} is not below ${BANDS[i + 1]} ${ladder[i + 1]}`)
        .toBeLessThan(ladder[i + 1]);
    }
    expect(breachesChildCeiling(rl, NEW_LESSON_CHILD_CEILING)).toBe(false);
    expect(rl.bands.child.authored).toBeLessThan(NEW_LESSON_CHILD_CEILING);
  });

  it('no two bands repeat each other, and every band names its own lesson', () => {
    const diff = measureDifferentiation(L());
    expect(duplicatedBands(diff), `worst pair ${diff.worst}`).toEqual([]);
    expect(diff.worst, `worst band-pair overlap ${diff.worst}`).toBeLessThan(DIFF_CEILING);
    expect(unnamedBands(L())).toEqual([]);
  });

  it('the author\'s own points number contiguously from 1, in the lesson and in every band', () => {
    for (const [where, text] of [['lesson', L().lesson], ...BANDS.map((b) => [b, L().levels[b]])]) {
      const ns = lessonSectionPlan(text).headings.map((h) => h.n);
      expect(ns.length, `${where} carries no numbered point at all`).toBeGreaterThan(0);
      expect(ns, `${where} numbers its points ${ns.join(',')}`).toEqual(ns.map((_, i) => i + 1));
    }
  });
});

describe('wm9 — the verses are the corpus, verbatim', () => {
  it('every quoted span that names a reference IS that verse, character for character', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans, 'the scan found nothing to check').toBeGreaterThan(60);
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
    expect(refs.filter((r) => !corpusText(r)), 'anchor refs that do not resolve in the corpus').toEqual([]);
  });

  it('BOTH DIRECTIONS: nothing is quoted that anchor.ref does not name', () => {
    const refs = new Set(anchorRefs(L()));
    const quoted = new Set();
    for (const [, text] of quotedTexts(L())) {
      for (const x of String(text).matchAll(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g)) {
        quoted.add(`${x[2].trim()} ${x[3]}:${x[4].trim()}`);
      }
    }
    expect([...quoted].filter((r) => !refs.has(r)), 'quoted but not named in anchor.ref').toEqual([]);
    expect([...refs].filter((r) => !quoted.has(r)), 'named in anchor.ref but never quoted').toEqual([]);
  });

  it('every anchor reference is NAMED in the lesson a reader actually reads', () => {
    const all = EVERY_TEXT().join('\n');
    const unnamed = anchorRefs(L()).filter((r) => !all.includes(`(${r})`));
    expect(unnamed, 'anchor refs the reader never meets under their own name').toEqual([]);
  });

  it('PROVEN-TO-CATCH: a single altered word inside a quoted verse is caught', () => {
    const m = L();
    const broken = {
      ...m,
      levels: {
        ...m.levels,
        child: m.levels.child.replace(
          'We have drunken our water for money; our wood is sold unto us',
          'We have drunken our water for money; our wood is sold unto them',
        ),
      },
    };
    expect(broken.levels.child).not.toBe(m.levels.child);
    expect(scanQuotedVerses([broken], quotedTexts).faults.length,
      'the scan did not catch an altered quotation').toBeGreaterThan(0);
    // and the real module is still clean, so the catch is not a stuck failure
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a straight apostrophe where the corpus carries the typographic one', () => {
    // The exact fault class a sibling builder hit twelve times in one draft:
    // the quotation reads right and is not the verse, because `world’s` was
    // retyped as `world's`. The corpus bytes are the standard, so the check is
    // not allowed to fold them together.
    const m = L();
    expect(corpusText('1 John 3:17')).toContain('world’s good');
    const broken = {
      ...m,
      levels: { ...m.levels, teen: m.levels.teen.replace('world’s good', 'world\'s good') },
    };
    expect(broken.levels.teen).not.toBe(m.levels.teen);
    expect(scanQuotedVerses([broken], quotedTexts).faults.length,
      'a straight apostrophe inside a quotation went unreported').toBeGreaterThan(0);
    expect(scanQuotedVerses([m], quotedTexts).faults).toEqual([]);
  });

  it('no ellipsis inside any quotation, anywhere on the page (DR-0459)', () => {
    const bad = [];
    for (const text of EVERY_TEXT()) {
      for (const x of text.matchAll(/"([^"]*)"/g)) if (/\.\.\.|…/.test(x[1])) bad.push(x[1].slice(0, 60));
    }
    expect(bad).toEqual([]);
  });
});

describe('wm9 — the source is reported at its real standing, and the honesty cannot be edited out', () => {
  it('the newsletter, its date and the one word above it are named in the adult text and in every band', () => {
    for (const [where, text] of [['lesson', L().lesson], ...BANDS.map((b) => [b, L().levels[b]])]) {
      expect(/Morning Brew/.test(text), `${where} never names the newsletter`).toBe(true);
      expect(/8(?:th)? of October 2026|8 October 2026/.test(text), `${where} never names the day`).toBe(true);
      expect(/one word|a single word/.test(text), `${where} drops the one word he wrote`).toBe(true);
      expect(/Lessons/.test(text), `${where} never says what the one word was`).toBe(true);
    }
  });

  it('the adult text AND every band say plainly that nobody here verified the numbers', () => {
    for (const [where, text] of [['lesson', L().lesson], ...BANDS.map((b) => [b, L().levels[b]])]) {
      expect(SAYS_UNVERIFIED.test(text), `${where} never discloses what was not verified`).toBe(true);
      expect(
        /as reported|only know what the letter said/i.test(text),
        `${where} never says the figures are carried as reported`,
      ).toBe(true);
    }
  });

  it('no figure is presented as this course\'s own measurement', () => {
    const all = EVERY_TEXT().join('\n');
    // Every number in the lesson is attributed; the attribution words are
    // present and the counter-claim is absent.
    expect(/Morning Brew (?:reports|says)/.test(all), 'the figures are never attributed in those words').toBe(true);
    expect(/we measured|we verified|our own measurement|we checked (?:it|them) against/i.test(all),
      'the lesson claims a verification nobody did').toBe(false);
  });

  it('the sponsor copy is named as advertising and refused, and no product is named', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/sponsor slot/.test(adult), 'the advertising is never named as advertising').toBe(true);
    expect(/no product is named here|we name no card|we name no product/i.test(adult),
      'the advertising is never refused').toBe(true);
    expect(/THE PATTERN IS THE TEACHING|We name the pattern|The PATTERN is the teaching/.test(adult),
      'the pattern is never separated from the offer').toBe(true);
    expect(adult).toContain('the borrower is servant to the lender');
  });

  it('the distinction the course turns on is TAUGHT, not relied on silently', () => {
    for (const [where, text] of [['lesson', L().lesson], ['bigIdea', L().bigIdea], ['youth', L().levels.youth], ['teen', L().levels.teen], ['senior', L().levels.senior]]) {
      expect(/dated, attributed reading/i.test(text), `${where} never names the dated, attributed reading`).toBe(true);
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(/live figure/i.test(adult), 'the course rule it is held against is never named').toBe(true);
    expect(/who said it[^.]*(?:and )?(?:on )?what day|who said it and when/i.test(adult),
      'the two questions the reader leaves with are missing').toBe(true);
  });

  it('the tutor carries the same distinction, and still refuses a live figure', () => {
    const p = WORLD_MARKET_TUTOR_META.posture;
    expect(p).toMatch(/never quote a live figure/i);
    expect(p).toMatch(/DATED, ATTRIBUTED READING/);
    expect(p).toMatch(/who said it, and on what day/i);
    expect(WORLD_MARKET_TUTOR_META.blurb).toMatch(/nobody here checked them against an original/i);
  });

  it('the three tiers are all three, so a truth is not shrunk and a claim is not inflated (DR-0100)', () => {
    for (const [where, text] of [['lesson', L().lesson], ['teen', L().levels.teen], ['senior', L().levels.senior]]) {
      expect(/ESTABLISHED/.test(text), `${where} has no established tier`).toBe(true);
      expect(/OPEN/.test(text), `${where} has no open tier`).toBe(true);
      expect(/OVER-REACH/.test(text), `${where} has no over-reach tier`).toBe(true);
      // the established thing, stated with no hedge
      expect(/Cold is dangerous/.test(text), `${where} does not state the harm plainly`).toBe(true);
      expect(/disputed by nobody serious|Nobody serious disputes it|not contested by anybody serious/.test(text),
        `${where} does not say the harm is uncontested`).toBe(true);
      // the open thing, named narrowly rather than smeared over the subject
      expect(/A projection is a projection/.test(text), `${where} does not flag the open thing narrowly`).toBe(true);
    }
    expect(/nobody really knows/i.test(L().lesson), 'the blanket hedge is never named and refused').toBe(true);
  });

  it('PROVEN-TO-CATCH: deleting the disclosure from one band is reported', () => {
    const m = L();
    const stripped = {
      ...m,
      levels: { ...m.levels, youth: m.levels.youth.replace(/AND HERE IS WHAT NOBODY HERE DID\.[^]*?and that is all they are\./, '') },
    };
    expect(stripped.levels.youth, 'the strip did not change the band').not.toBe(m.levels.youth);
    expect(SAYS_UNVERIFIED.test(stripped.levels.youth), 'the disclosure check did not notice it was gone').toBe(false);
    expect(SAYS_UNVERIFIED.test(m.levels.youth), 'the real band is missing its disclosure').toBe(true);
  });
});

describe('wm9 — the Word is the substance, taught and not merely cited (DR-0281)', () => {
  it('the spine is the lament, and it is reasoned rather than decorated', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain(corpusText('Lamentations 5:4'));
    expect(/the drink and the fuel/i.test(all), 'the spine is quoted but never worked').toBe(true);
    expect(/wrote (?:its|their) (?:sad song|lament)/i.test(all),
      'the point of the lament -- that He wrote it down -- is never made').toBe(true);
  });

  it('a named person sits at the bottom of the fuel shortage, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never carries the two sticks`)
        .toContain('I am gathering two sticks, that I may go in and dress it for me and my son, that we may eat it, and die');
      expect(/[Tt]wo sticks/.test(text), `${place} never weighs the two sticks`).toBe(true);
    }
  });

  it('the ant\'s work is taught as commanded and as the one lever a household holds', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops the ant`).toContain('The ants are a people not strong, yet they prepare their meat in the summer');
      expect(text, `${place} drops the woman unafraid of the snow`).toContain('She is not afraid of the snow for her household: for all her household are clothed with scarlet');
      expect(text, `${place} drops the cloak before winter`).toContain('Do thy diligence to come before winter');
    }
    const adult = [L().lesson, L().levels.senior].join('\n');
    expect(/does not move a world price|moves a world price by a (?:single )?cent/i.test(adult),
      'the lever is never distinguished from the thing out of reach').toBe(true);
  });

  it('the cold is named as a wrong done to a person, and the shut-up compassion answered', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops Job 24:7`).toContain('They cause the naked to lodge without clothing, that they have no covering in the cold');
      expect(text, `${place} drops 1 John 3:17`).toContain('and shutteth up his bowels of compassion from him');
      expect(text, `${place} drops the command to the one who sees`).toContain('when thou seest the naked, that thou cover him');
    }
  });

  it('Jesus is confessed as the Lamb and the Eternal Son of Yahweh, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(/Lamb of Yahweh/.test(text), `${place} does not confess the Lamb of Yahweh`).toBe(true);
      expect(/Eternal Son of Yahweh/.test(text), `${place} does not confess the Eternal Son of Yahweh`).toBe(true);
      expect(text).toContain('Behold the Lamb of God, which taketh away the sin of the world');
      expect(text).toContain('For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life');
      expect(text).toContain('though he was rich, yet for your sakes he became poor, that ye through his poverty might be rich');
    }
  });

  it('growth is measured the Word\'s way, qualitative and quantitative', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops the fruit`).toContain('But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith');
      expect(text, `${place} drops the count of days`).toContain('But exhort one another daily, while it is called To day');
    }
  });
});

describe('wm9 — typographic theology holds on every surface', () => {
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
    expect(all).toContain('how dwelleth the love of God in him?');          // 1 John 3:17
    expect(all).toContain('Behold the Lamb of God');                         // John 1:29
    expect(all).toContain('For God so loved the world');                     // John 3:16
    // and the substitution the bright line forbids was never made
    expect(all.includes('the love of Yahweh in him'), 'Yahweh was substituted into a quotation').toBe(false);
    expect(all.includes('Behold the Lamb of Yahweh, which'), 'Yahweh was substituted into a quotation').toBe(false);
  });

  it('no holy name is lowercased in our own voice', () => {
    for (const { place, text } of PLACES()) {
      expect(loweredHolyNames(text), `${place} lowercases a holy name`).toEqual([]);
    }
  });

  it('no adversary name is capitalised, anywhere', () => {
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

describe('wm9 — every band sends the reader in all three directions', () => {
  it('the module carries all three, and no band is short of one (DR-0733 / DR-0795)', () => {
    expect(hasAllThree(L())).toBe(true);
    expect(placesMissingDirections(L())).toEqual([]);
  });

  it('every band carries TALK ABOUT IT TOGETHER with the skill and the rhythm, in the lesson\'s own words', () => {
    for (const { place, text } of [{ place: 'lesson', text: L().lesson }, ...PLACES()]) {
      expect(/TALK ABOUT IT TOGETHER/.test(text), `${place} has no close`).toBe(true);
      expect(/listen all the way to the end/i.test(text), `${place} drops the listening skill`).toBe(true);
      expect(/retell/i.test(text), `${place} drops the retelling skill`).toBe(true);
      expect(/teach them one verse back/i.test(text), `${place} drops teaching one verse back`).toBe(true);
      expect(/once today/i.test(text), `${place} drops the rhythm`).toBe(true);
      expect(/one friend this week/i.test(text), `${place} drops the friend rhythm`).toBe(true);
      expect(text, `${place} drops the four places`).toContain('when thou sittest in thine house');
    }
  });

  it('PROVEN-TO-CATCH: stripping ONE band\'s friend line names that band while the module still reads whole', () => {
    const m = L();
    const stripped = {
      ...m,
      levels: { ...m.levels, teen: m.levels.teen.replace(/Friends, tell one friend this week[^.]*\./, '') },
    };
    expect(stripped.levels.teen, 'the strip did not change the band').not.toBe(m.levels.teen);
    const named = placesMissingDirections(stripped);
    expect(named.map((p) => p.place)).toContain('teen');
    expect(named.find((p) => p.place === 'teen').missing).toContain('friends');
    // ...while the pooled check still reads green, which is exactly why the
    // per-band check has to exist (DR-0795).
    expect(hasAllThree(stripped)).toBe(true);
    // and the real module is clean, so this catch is not a stuck failure
    expect(placesMissingDirections(m)).toEqual([]);
  });
});

describe('wm9 — the lesson page is whole', () => {
  it('carries every field a World Market lesson page renders', () => {
    const m = L();
    expect(m.title.length).toBeGreaterThan(10);
    expect(m.bigIdea.length).toBeGreaterThan(200);
    expect(m.inApp.length).toBeGreaterThan(100);
    expect(m.anchor.theme.length).toBeGreaterThan(100);
    expect(m.lesson.length).toBeGreaterThan(1500);
    expect(m.benefits).toHaveLength(6);
    expect(m.stories).toHaveLength(2);
    expect(m.quiz.questions).toHaveLength(6);
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(4);
  });

  it('the hands-on work sends the reader to their own house and their own street', () => {
    const inApp = L().inApp;
    expect(/what you paid to heat it last winter/.test(inApp)).toBe(true);
    expect(/one name/.test(inApp), 'the neighbour is not asked for by name').toBe(true);
  });

  it('the quiz answers point at the option they claim', () => {
    for (const q of L().quiz.questions) {
      expect(q.options[q.answer], `answer index out of range: ${q.q.slice(0, 50)}`).toBeTruthy();
      expect(typeof q.explain).toBe('string');
      expect(q.explain.length).toBeGreaterThan(60);
    }
  });
});
