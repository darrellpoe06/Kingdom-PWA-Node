// =============================================================================
// sovereign-ai-sov71-verses — the gate for sov71, "Hide thyself for a little moment"
// =============================================================================
// WHAT THIS LESSON IS, AND WHAT IT DELIBERATELY IS NOT.
//
// Gmail thread `1a163ce16938ed48`, a 1440 Daily Digest of 2026-10-22,
// forwarded 13:30 with ONE WORD typed above the forwarded header: `Lessons`.
//
// ONE ITEM OF MANY, AND THE REST IS NOT SPENT. The digest carries many items;
// this lesson is built from the item headed Internet Insecurities and from
// nothing else. The Russia/Ukraine talks, the Supreme Court order on
// transgender inmates, the circadian-depression study, the Meta privacy fine,
// the chemical tank explosion and the culture items are UNTOUCHED and remain
// available to a later week — the rule is one TEACHING one lesson, never one
// SOURCE one lesson (DR-0610 as DR-1317 fixed its meaning). On the court item
// the source supplies a second reason itself: the high court did not sign or
// explain the order, so there is no reasoning in it to teach from, and what the
// Word says about who a person is was never going to be derived from a stay of
// a prison regulation.
//
// NOT ONE PRIMARY SOURCE WAS OPENED, and that fact governs every case below.
// Four roads refused at the gateway with `curl: (56) CONNECT tunnel failed,
// response 403` — php.net's own changelog, the United States vulnerability
// database, the American cyber agency's alert index and the German federal
// security office — and two would not resolve at all: `getaddrinfo ENOTFOUND
// www.php.net` and `getaddrinfo ENOTFOUND www.csa.gov.sg`, the Singapore
// agency that had published its own advisory. What checking exists came through
// a search over SECONDARY coverage, which the lesson labels a MEDIATED READ in
// all four non-child places. A blocked road never reads as a verified claim
// (DR-0076 §8), and a mediated read never passes as a direct one.
//
// WHAT THE CHECKING CHANGED (DR-0190 §5). The draft assumed the quiet hold
// worked: a disciplined team held the fault, finished the repair, announced on
// its own hour. The mediated read REVERSED that. The PHP Foundation's own
// account is that it was caught off guard, that the hold broke early and
// another company broke it, and that one of the two faults traced back to an
// outside audit in 2024 after which the fix stalled for months. So the ethic
// stands and its EXECUTION failed — which is the stronger teaching, and the
// cases below pin the sentence it produced: an agreement is not a mechanism.
//
// THE LANDING IS THE DISCLOSURE ETHIC AND SOVEREIGNTY, in three truths, each
// of them cutting against a rule this house already holds:
//   ONE   protective silence withholds the METHOD from an attacker while
//         telling the DEFENDER exactly what to do; concealment withholds the
//         DANGER from the person who bears it. Nehemiah 2:12/2:16 look like a
//         doctrine of secrecy until 2:18 spends the silence.
//   TWO   darkness chosen on purpose is stewardship; darkness discovered
//         because nobody was watching is the failure DR-0107 names. The
//         resolution is an ORDERING: uptime outranks delivery velocity,
//         integrity outranks uptime.
//   THREE a capability holds no loyalty. The models that found the faults
//         would serve an attacker, which is this course's own subject.
//
// THE SAME EVENT, THREE DIFFERENT LANDINGS, named rather than avoided
// (DR-1317). sov66 (DR-1322, Morning Brew thread `1a163a78c1d14d84`, the same
// day) reads this same PHP defect for UNPRICED PROTECTION — a risk ranked low
// because the attacker was assumed weak. spm11 (#2570 / DR-1358, built from
// the University of Illinois cPanel advisory) reads it from the LOCAL
// OPERATOR'S CHAIR — an unsupported version cannot be patched, a mitigation is
// not a fix, there is no road back. THIS week reads the DISCLOSURE side. The
// census at the foot of this file measures the overlap: ZERO shared anchor
// references with either neighbour.
//
// A VERSE IS NEVER SPENT. Nothing was dropped here for a collision. Note in
// particular that Nehemiah 7:3 carries the phrase that sov70 and sov66 take
// from Nehemiah 3:28 — a DIFFERENT verse, read here for the gate shut on a
// TIMETABLE rather than for proximity of assignment or for repairing one's own
// exposure.
//
// EVERY LESSON STANDS ALONE AND WHOLE. No reader text points at another
// lesson; the comparison lives in this header and in DR-1364.
//
// WHO TAUGHT (DR-0719): NOBODY. A forwarded news digest is not a recording.
// All five reader places say so; the cases below forbid the bare phrase "the
// teacher" and forbid crediting Bishop Gwin for a send that names nobody.
//
// STORIES ARE PARABLES, NOT TESTIMONIES (DR-1123). Both stories were written
// to teach and no real person's life is behind either, so neither wears the
// label that tells a reader "a true story I lived."
//
// WEEK 71, AND THE CONTIGUITY CLAIM IS FORWARD-SAFE. The cases assert that
// week 71 exists exactly once, is this lesson, sits at the index its week
// number requires, and that the weeks run contiguous from one through 70 —
// never that this is the LAST lesson, which is the exact fault DR-1316 is
// named for and which sov69's arrival turned red in sov68's gate. A gate may
// not claim to be last for ever.
//
// NOTHING HERE ASSERTS ANYTHING ABOUT THE TREE. No case reads a git ref, a
// branch state or another branch having merged: a case that asserts about the
// environment passes in a worktree and goes red in CI.
//
// Every verse was fetched from app/public/bible/kjv BEFORE a word was written,
// and SPINE_FRAGMENTS pins the exact span this lesson quotes for all 35
// references. Recorded as DR-1364.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES, SOVEREIGN_AI_META } from '../lib/sovereign-ai-class.js';
import { lessonCreatedDay } from '../lib/lesson-dates.js';
import { NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { findBritish } from '../../../scripts/american-spelling.mjs';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { storyCount, quotesTheWord } from '../lib/lesson-completeness.js';
import { termFaults } from '../lib/plain-before-the-term.js';
import { censusLesson } from '../lib/library-census.js';
import { fourBandFaults, LADDER, fk, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';

const ID = 'sov71-hide-thyself-for-a-little-moment';
const M = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
/** The five places a reader actually meets this lesson. */
const PLACES = () => ({ adult: M.lesson, child: M.levels.child, youth: M.levels.youth, teen: M.levels.teen, senior: M.levels.senior });
/** Every string in the module, so no field can go unchecked. */
const allStrings = (o = M, out = []) => {
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
const verseText = (ref) => {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) return null;
  const ch = bookOf(m[1]).chapters[Number(m[2]) - 1];
  return ch && ch[Number(m[3]) - 1] ? ch[Number(m[3]) - 1] : null;
};

/**
 * THE PINNED SPINE, reference by reference, with the EXACT span this lesson
 * quotes for it. Each is asserted (a) to be a substring of that verse in the
 * corpus on disk, so it cannot have come from memory or from a neighbouring
 * verse, and (b) to be present in the ADULT lesson, so no reference can sit in
 * `anchor.ref` without the Word actually being quoted for it.
 */
const SPINE_FRAGMENTS = {
  'Nehemiah 2:12': 'neither told I any man what my God had put in my heart to do at Jerusalem',
  'Nehemiah 2:16':
    'And the rulers knew not whither I went, or what I did; neither had I as yet told it to the Jews, nor to the priests, nor to the nobles, nor to the rulers, nor to the rest that did the work.',
  'Nehemiah 2:18':
    'Then I told them of the hand of my God which was good upon me; as also the king’s words that he had spoken unto me. And they said, Let us rise up and build.',
  'Amos 3:7': 'Surely the Lord GOD will do nothing, but he revealeth his secret unto his servants the prophets.',
  'Proverbs 11:13': 'A talebearer revealeth secrets: but he that is of a faithful spirit concealeth the matter.',
  'Ecclesiastes 3:7': 'a time to keep silence, and a time to speak',
  'Proverbs 25:2': 'It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.',
  'Matthew 10:16': 'be ye therefore wise as serpents, and harmless as doves',
  'Proverbs 27:12': 'A prudent man foreseeth the evil, and hideth himself; but the simple pass on, and are punished.',
  'Proverbs 28:13': 'He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy.',
  '2 Kings 7:9': 'We do not well: this day is a day of good tidings, and we hold our peace',
  'Ezekiel 33:6':
    'But if the watchman see the sword come, and blow not the trumpet, and the people be not warned; if the sword come, and take any person from among them, he is taken away in his iniquity; but his blood will I require at the watchman’s hand.',
  'Luke 12:2': 'For there is nothing covered, that shall not be revealed; neither hid, that shall not be known.',
  'Isaiah 26:20':
    'Come, my people, enter thou into thy chambers, and shut thy doors about thee: hide thyself as it were for a little moment, until the indignation be overpast.',
  'Exodus 12:22': 'none of you shall go out at the door of his house until the morning',
  'Nehemiah 7:3': 'Let not the gates of Jerusalem be opened until the sun be hot; and while they stand by, let them shut the doors, and bar them',
  'Leviticus 13:46': 'he shall dwell alone; without the camp shall his habitation be',
  'Genesis 7:16': 'and the LORD shut him in',
  'Luke 14:28': 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  '1 Corinthians 3:13': 'the fire shall try every man’s work of what sort it is',
  'James 3:9': 'Therewith bless we God, even the Father; and therewith curse we men, which are made after the similitude of God.',
  'James 3:10': 'Out of the same mouth proceedeth blessing and cursing. My brethren, these things ought not so to be.',
  'Romans 6:13':
    'Neither yield ye your members as instruments of unrighteousness unto sin: but yield yourselves unto God, as those that are alive from the dead, and your members as instruments of righteousness unto God.',
  '1 Timothy 1:8': 'the law is good, if a man use it lawfully',
  'Isaiah 2:4': 'they shall beat their swords into plowshares, and their spears into pruninghooks',
  'Joel 3:10': 'Beat your plowshares into swords, and your pruninghooks into spears: let the weak say, I am strong.',
  'Genesis 50:20': 'ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive',
  '1 Samuel 17:51': 'took his sword, and drew it out of the sheath thereof, and slew him, and cut off his head therewith',
  'John 1:29': 'Behold the Lamb of God, which taketh away the sin of the world.',
  'John 3:16': 'For God so loved the world, that he gave his only begotten Son',
  'Hebrews 1:8': 'But unto the Son he saith, Thy throne, O God, is for ever and ever',
  'Colossians 1:17': 'And he is before all things, and by him all things consist.',
  'Galatians 5:22': 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,',
  'Deuteronomy 6:7':
    'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
  'Hebrews 3:13': 'But exhort one another daily, while it is called To day',
};
/** The pinned references, all 35. The counts this gate asserts about ITSELF, so an empty scan can never pass. */
const SPINE = Object.keys(SPINE_FRAGMENTS);
const SPINE_COUNT = 35;

describe('sov71 — the lesson is mounted and is the week it says it is', () => {
  it('is mounted as week 71, at the index its week requires, with every reader field present', () => {
    expect(M, `${ID} is not mounted`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(m.id.match(/^sov(\d+)-/)[1]));
    // FORWARD-SAFE AND GAP-SAFE ON PURPOSE (DR-1316 / DR-1338 / DR-1351). This
    // gate does NOT assert `MODULES[length - 1].id === ID`. sov68's gate made
    // exactly that claim and sov69's arrival turned it red. What is durably
    // true, and stays true when week 72 lands: week 71 exists, exactly once, it
    // is THIS lesson, it sits at the index its week number requires, and the
    // weeks run contiguous one through 70.
    expect(weeks).toContain(71);
    expect(weeks.filter((w) => w === 71).length, 'week 71 is mounted twice').toBe(1);
    expect(
      SOVEREIGN_AI_MODULES.findIndex((m) => m.id === ID),
      'sov71 is not at the index its week number requires'
    ).toBe(70);
    expect(Math.max(...weeks)).toBeGreaterThanOrEqual(71);
    for (let w = 1; w <= 70; w += 1) expect(weeks, `week ${w} is missing`).toContain(w);
    expect(SOVEREIGN_AI_META.weeks).toBe(SOVEREIGN_AI_MODULES.length);
    expect(String(M.title).length).toBeGreaterThan(80);
    for (const k of ['bigIdea', 'inApp', 'lesson']) expect(String(M[k]).length, k).toBeGreaterThan(200);
    for (const b of FOUR_BANDS) expect(String(M.levels[b]).length, b).toBeGreaterThan(2000);
    expect(M.media).toEqual([]);
    expect(storyCount(M), 'two stories').toBeGreaterThanOrEqual(2);
    expect(quotesTheWord(M), 'the lesson quotes the Word').toBe(true);
    expect(M.quiz.questions.length, 'quiz questions').toBeGreaterThanOrEqual(10);
    expect(M.benefits.length, 'benefits').toBeGreaterThanOrEqual(12);
    expect(M.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(M.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(8);
    for (const k of ['research', 'plan', 'execute']) expect(String(M.rpe[k]).length, k).toBeGreaterThan(400);
  });

  it('the lesson is WHOLE by the library census, with nothing missing', () => {
    const c = censusLesson(M);
    expect(c.missingComponents, `missing components: ${c.missingComponents.join(', ')}`).toEqual([]);
    expect(c.missingVersions, `missing versions: ${c.missingVersions.join(', ')}`).toEqual([]);
    expect(c.whole, 'the lesson is not whole').toBe(true);
    expect(c.short, 'the adult lesson is short').toBe(false);
  });

  it('every quiz answer index points at a real option, and no two options are identical', () => {
    for (const q of M.quiz.questions) {
      expect(q.options.length, `${q.q} has too few options`).toBeGreaterThanOrEqual(3);
      expect(q.answer, `${q.q} answer index out of range`).toBeLessThan(q.options.length);
      expect(new Set(q.options).size, `${q.q} repeats an option`).toBe(q.options.length);
      expect(String(q.explain).length, `${q.q} has no explanation`).toBeGreaterThan(20);
    }
  });
});

describe('sov71 — every verse came from the corpus on disk, not from memory', () => {
  it(`pins all ${SPINE_COUNT} references, and the count is asserted so an empty scan cannot pass`, () => {
    expect(SPINE.length, 'the pinned spine changed size without this count being updated').toBe(SPINE_COUNT);
    const refs = M.anchor.ref
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    expect(refs.length, 'anchor.ref count').toBe(SPINE_COUNT);
    expect([...refs].sort()).toEqual([...SPINE].sort());
  });

  it('every pinned fragment is verbatim its own verse in app/public/bible/kjv', () => {
    let checked = 0;
    for (const ref of SPINE) {
      const vt = verseText(ref);
      expect(vt, `${ref} is not in the corpus on disk`).toBeTruthy();
      expect(vt.includes(SPINE_FRAGMENTS[ref]), `${ref} is NOT verbatim in its own verse`).toBe(true);
      checked += 1;
    }
    expect(checked, 'the scan ran over nothing').toBe(SPINE_COUNT);
  });

  it('every reference in anchor.ref is actually QUOTED in the adult lesson, with its citation', () => {
    let checked = 0;
    for (const ref of SPINE) {
      expect(M.lesson.includes(SPINE_FRAGMENTS[ref]), `${ref} is listed but its words are not in the lesson`).toBe(true);
      expect(M.lesson.includes(`(${ref})`), `${ref} is quoted without its citation`).toBe(true);
      checked += 1;
    }
    expect(checked).toBe(SPINE_COUNT);
  });

  it('PROVEN TO CATCH: bending any one pinned fragment by a single word breaks the corpus check', () => {
    let caught = 0;
    for (const ref of SPINE) {
      const bent = SPINE_FRAGMENTS[ref].replace(/\b([a-z]{4,})\b/, 'xqzzy');
      expect(bent, `${ref} could not be bent`).not.toBe(SPINE_FRAGMENTS[ref]);
      expect(verseText(ref).includes(bent), `a bent ${ref} was NOT caught`).toBe(false);
      caught += 1;
    }
    expect(caught, 'the proof ran over nothing').toBe(SPINE_COUNT);
  });

  it('no verse is quoted with a straight apostrophe where the corpus has a curly one (DR-1273 / DR-0456)', () => {
    for (const s of allStrings()) {
      const bad = s.match(/[a-z]'(?:s|t|d|ll|re|ve)\b/g) || [];
      for (const hit of bad) {
        const i = s.indexOf(hit);
        const openQuotes = (s.slice(0, i).match(/"/g) || []).length;
        expect(openQuotes % 2, `straight apostrophe inside a quotation: ...${s.slice(Math.max(0, i - 40), i + 20)}...`).toBe(0);
      }
    }
  });
});

describe('sov71 — the Word is quoted, never rewritten', () => {
  it('Yahweh is never substituted into a quotation (DR-0076 bright line)', () => {
    for (const s of allStrings()) {
      const spans = [...s.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
      for (const q of spans) {
        if (!/\b(LORD|God|saith|thou|ye)\b/.test(q)) continue;
        expect(q.includes('Yahweh'), `Yahweh was substituted into a quotation: ${q.slice(0, 80)}`).toBe(false);
      }
    }
  });

  it('the adversary is never capitalised, and the Godhead always is', () => {
    const blob = allStrings().join('\n');
    for (const bad of ['Satan', 'Lucifer', 'The Devil', 'Baal']) {
      expect(blob.includes(bad), `${bad} is capitalised`).toBe(false);
    }
    expect(blob.includes('Yahweh'), 'our voice never names Yahweh').toBe(true);
    expect(blob.includes('Jesus'), 'our voice never names Jesus').toBe(true);
  });

  it('the DR-0210 confession is present in all five reader places: the Lamb and the Eternal Son', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(txt.includes('Lamb of Yahweh'), `${place} lacks the Lamb confession`).toBe(true);
      expect(txt.includes('Eternal Son of Yahweh'), `${place} lacks the Son confession`).toBe(true);
    }
  });

  it('our own prose carries no British spellings (quoted Scripture is left exactly as written)', () => {
    for (const s of allStrings()) {
      const hits = findBritish(s);
      expect(
        hits.map((h) => h.word),
        `British spelling in our prose: ${hits.map((h) => h.word).join(', ')}`
      ).toEqual([]);
    }
  });
});

describe('sov71 — WHO TAUGHT: NOBODY, and the provenance is carried', () => {
  it('all five reader places say nobody taught it, and name the source as a digest', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(/NOBODY/.test(txt), `${place} does not say WHO TAUGHT: NOBODY`).toBe(true);
      expect(/digest/i.test(txt), `${place} never says the source was a news digest`).toBe(true);
    }
  });

  it('never credits Bishop Gwin, and never uses the bare phrase "the teacher" (DR-0719)', () => {
    const blob = allStrings().join('\n');
    expect(/Gwin/i.test(blob), 'a source that names nobody must not credit Bishop Gwin').toBe(false);
    expect(/\bthe teacher\b/i.test(blob), 'the bare phrase "the teacher" is forbidden').toBe(false);
  });

  it('carries the thread, the forward time, and his one word', () => {
    const blob = allStrings().join('\n');
    expect(blob.includes('1a163ce16938ed48'), 'the thread id is not carried').toBe(true);
    expect(blob.includes('13:30'), 'the forward time is not carried').toBe(true);
    expect(/one word/i.test(blob), 'his one word is not named as one word').toBe(true);
    // The word was Lessons, PLURAL. The gate pins the exact word, because the
    // build is judged by what he typed rather than by the subject line.
    expect(blob.includes('Lessons'), 'his word, Lessons, is not carried').toBe(true);
  });

  it('ONE TEACHING, ONE LESSON: the untouched items are declared, and none of them is taught here', () => {
    // The digest carried many items. Every reader place but the child band
    // says so, and the UNBUILT items are named as unbuilt rather than silently
    // dropped, so a later session does not read the thread as spent.
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue;
      expect(/untouched|left the rest|left alone|not spent/i.test(txt), `${place} does not declare the rest of the digest untouched`).toBe(true);
    }
    // And the court item's own reason is carried, in the source's own words,
    // in the adult lesson: there is no reasoning in it to teach from.
    expect(M.lesson.includes('the high court did not sign or explain the order'), 'the court item’s own reason is not carried').toBe(true);
    // NAMED AS UNBUILT IS NOT THE SAME AS TAUGHT, and this case first conflated
    // them: it forbade the words outright and went red on the very sentence
    // that does the declaring. The honest check is that each unbuilt subject
    // appears ONLY inside the declaration — named once so a later session does
    // not read the thread as spent, and never carrying a verse of its own.
    const DECLARATION = M.lesson.split('\n\n').find((p) => p.includes('WHAT WE BUILT FROM, AND WHAT WE LEFT ALONE ON PURPOSE'));
    expect(DECLARATION, 'the declaration paragraph is missing').toBeTruthy();
    for (const term of ['inmate', 'Ukraine', 'body clocks', 'tank explosion']) {
      expect(DECLARATION.includes(term), `the declaration does not name the unbuilt ${term} item`).toBe(true);
      const elsewhere = allStrings().filter((s) => s.includes(term) && !s.includes('WHAT WE BUILT FROM, AND WHAT WE LEFT ALONE ON PURPOSE'));
      expect(elsewhere, `the unbuilt ${term} item is taught outside the declaration`).toEqual([]);
    }
  });
});

describe('sov71 — WE NEVER OPENED A PRIMARY SOURCE, and every reader place says so (DR-0076 §8)', () => {
  it('all five places state plainly that no first-hand source was opened', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(
        // The child band carries the same claim in plain words rather than the
        // term, which is a reading-level decision and not a weaker claim.
        /not one primary source|never reached a single|not one first-hand source|did not read the real papers/i.test(txt),
        `${place} does not say no primary source was opened`
      ).toBe(true);
    }
  });

  it('BOTH refused roads are quoted word for word in every non-child place, never described', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue; // the child band carries the fact in plain words
      expect(txt.includes('curl: (56) CONNECT tunnel failed, response 403'), `${place} does not quote the proxy refusal`).toBe(true);
      expect(txt.includes('getaddrinfo ENOTFOUND www.php.net'), `${place} does not quote the resolver refusal`).toBe(true);
      expect(txt.includes('getaddrinfo ENOTFOUND www.csa.gov.sg'), `${place} does not quote the second resolver refusal`).toBe(true);
      // A mediated read NEVER reads as a direct one.
      expect(/mediated read/i.test(txt), `${place} does not label the read as mediated`).toBe(true);
    }
  });

  it('the three tiers are carried in every non-child place (DR-0100)', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue; // the child band carries the teaching, not the audit
      expect(/DOCUMENTED|documented/.test(txt), `${place} has no documented tier`).toBe(true);
      expect(/ATTRIBUTED|attributed|the publication/.test(txt), `${place} has no attributed tier`).toBe(true);
      expect(/UNCHECKED|unchecked/.test(txt), `${place} has no unchecked tier`).toBe(true);
    }
    // And in the adult lesson the tiers are named as tiers, with the three
    // things that stay unchecked said out loud rather than smeared over the topic.
    expect(M.lesson.includes('TRUST BUT VERIFY, IN THREE TIERS'), 'the adult lesson does not name the three tiers').toBe(true);
    expect(M.lesson.includes('UNCHECKED, and it stays unchecked'), 'the adult lesson does not keep the unchecked tier unchecked').toBe(true);
  });

  it('what the checking CHANGED is stated, and it names the assumption it reversed (DR-0190 §5)', () => {
    expect(M.lesson.includes('THE MEDIATED READ REVERSED THAT'), 'the adult lesson does not say what the checking changed').toBe(true);
    expect(M.lesson.includes('caught off guard'), 'the reversal is not stated in the Foundation’s own terms').toBe(true);
    expect(M.lesson.includes('a quiet hold is a promise kept by every single person who was told'), 'the corrected claim is not stated').toBe(true);
    // The sentence the reversal produced, pinned, because it is the teaching.
    const blob = allStrings().join('\n');
    expect(/an agreement is not a mechanism/i.test(blob), 'the lesson does not carry the sentence the reversal produced').toBe(true);
    // The stalled fix is carried as the Foundation's own account, not as our finding.
    expect(/outside audit in 2024|outside audit during 2024|outside audit back in 2024/i.test(blob), 'the 2024 audit is not carried').toBe(true);
  });

  it('the publication’s own numbers are attributed to it and never asserted as measured findings', () => {
    const blob = allStrings().join('\n');
    expect(/roughly 70%/.test(blob), 'the publication’s share figure is not carried').toBe(true);
    // It must be marked as the publication's, and the six-country list must be
    // explicitly unchecked, because the reachable sources disagree about it.
    expect(
      /the publication's number carried as the publication's number|the publication’s number carried as the publication’s number/i.test(blob),
      'the attributed tier does not say whose numbers these are'
    ).toBe(true);
    expect(/do not agree on it|disagree/i.test(blob), 'the country list is not named as contested').toBe(true);
    // And the lesson never claims to have measured the share itself.
    expect(/measured by nobody we could reach/i.test(blob), 'the share figure is not marked unmeasured').toBe(true);
  });
});

describe('sov71 — the three truths, each of them against a rule this house holds', () => {
  it('states its own standard, and it is the two-sided test rather than a posture', () => {
    expect(M.bigIdea.includes('PROTECTIVE SILENCE IS NOT CONCEALMENT'), 'the lesson does not state its own standard').toBe(true);
    // TRUTH ONE: the line is drawn on DIRECTION, not on volume.
    expect(
      M.lesson.includes('Protective silence withholds the METHOD from the one who would use it, and tells the DEFENDER exactly what to do'),
      'the lesson does not carry the protective half of the test'
    ).toBe(true);
    expect(
      M.lesson.includes('Concealment withholds the DANGER from the one who has to live with it'),
      'the lesson does not carry the concealing half of the test'
    ).toBe(true);
    expect(
      /THAT IS THE WHOLE TEST, and it is a test about DIRECTION, not about volume/.test(M.lesson),
      'the lesson does not say the test is about direction'
    ).toBe(true);
    // And it names the house rule it is cutting against, rather than quietly ignoring it.
    expect(M.lesson.includes('a run that did nothing must never report success'), 'the lesson does not name the house rule it cuts against').toBe(true);
  });

  it('TRUTH TWO is resolved as an ORDERING, with DR-0107 named honestly rather than avoided', () => {
    expect(M.lesson.includes('a down site is the worst outcome'), 'the lesson does not quote this house’s own rule').toBe(true);
    expect(M.lesson.includes('about nine hours'), 'the lesson does not carry the measured cost that produced that rule').toBe(true);
    expect(M.lesson.includes('Uptime outranks delivery speed. Integrity outranks uptime.'), 'the lesson does not state the ordering').toBe(true);
    expect(
      M.lesson.includes('A service that is down because nobody was watching is the failure that rule was written about'),
      'the lesson does not separate chosen darkness from an absence'
    ).toBe(true);
    // The three conditions the Word attaches to a deliberate darkness.
    expect(M.lesson.includes('it is COMMANDED, it is BOUNDED by a little moment, and it names the end'), 'the lesson does not carry the three conditions').toBe(
      true
    );
  });

  it('TRUTH THREE lets the dual use stand without moralising about the tool', () => {
    expect(M.lesson.includes('Same capability. Two hands.'), 'the lesson does not state the dual use plainly').toBe(true);
    expect(M.lesson.includes('We will not moralize about that'), 'the lesson does not refuse to moralise').toBe(true);
    expect(
      M.lesson.includes('a capability has no loyalty, and the question is only ever whose hand it is in and what that hand is yielded to'),
      'the lesson does not land the dual-use question on the hand'
    ).toBe(true);
    // The Word's own both-directions pair is carried as a pair.
    expect(M.lesson.includes(SPINE_FRAGMENTS['Isaiah 2:4']), 'the swords-to-plowshares half is missing').toBe(true);
    expect(M.lesson.includes(SPINE_FRAGMENTS['Joel 3:10']), 'the plowshares-to-swords half is missing').toBe(true);
  });

  it('quotes AND reasons from the Word, never staging competing human views (DR-0281 / DR-0098)', () => {
    // DR-0281: a verse dropped in without the reasoning worked out is hollow
    // (DR-0381). The Nehemiah 2 sequence is the reasoning, and it must be
    // present as a sequence: the withholding, then the SPENDING of it.
    expect(
      M.lesson.includes('Then look at what he did with the silence the moment the survey was finished'),
      'the Nehemiah 2 reasoning is not worked out'
    ).toBe(true);
    expect(M.lesson.includes('and notice where the secret goes'), 'the Amos 3:7 reasoning is not worked out').toBe(true);
    // The order of the quotes is the argument: 2:12 and 2:16 BEFORE 2:18.
    const at = (ref) => M.lesson.indexOf(SPINE_FRAGMENTS[ref]);
    expect(at('Nehemiah 2:12')).toBeLessThan(at('Nehemiah 2:18'));
    expect(at('Nehemiah 2:16')).toBeLessThan(at('Nehemiah 2:18'));
    // No both-sides-you-decide staging anywhere in the module.
    const blob = allStrings().join('\n');
    expect(/scholars (?:are )?divided|some scholars say|you decide which|three views|pick a side/i.test(blob), 'the module stages competing human views').toBe(
      false
    );
  });
});

describe('sov71 — the four bands, and TALK ABOUT IT TOGETHER everywhere', () => {
  it('the four-band ladder has no faults', () => {
    expect(fourBandFaults(M), `band faults: ${fourBandFaults(M).join(' | ')}`).toEqual([]);
  });

  it('the reading ladder rises and each band stays under its ceiling', () => {
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(M.levels[b])]));
    expect(g.child).toBeLessThan(NEW_LESSON_CHILD_CEILING);
    expect(g.child).toBeLessThan(g.youth);
    expect(g.youth).toBeLessThan(g.teen);
    expect(g.teen).toBeLessThan(g.senior);
    expect(g.teen).toBeLessThan(LADDER.teenCeiling);
    expect(g.senior).toBeLessThan(LADDER.seniorCeiling);
  });

  it('no band is a near copy of another or of the adult lesson', () => {
    for (let i = 0; i < FOUR_BANDS.length; i += 1) {
      expect(overlapOf(M.levels[FOUR_BANDS[i]], M.lesson), `${FOUR_BANDS[i]}~adult`).toBeLessThan(LADDER.nearCopy);
      for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
        expect(overlapOf(M.levels[FOUR_BANDS[i]], M.levels[FOUR_BANDS[j]]), `${FOUR_BANDS[i]}~${FOUR_BANDS[j]}`).toBeLessThan(LADDER.nearCopy);
      }
    }
  });

  it('every band names its own lesson in its opening', () => {
    expect(unnamedBands(M), `bands that do not name the lesson: ${unnamedBands(M).join(', ')}`).toEqual([]);
  });

  it('explains every hard term in plain words at or before its first use (DR-0521)', () => {
    expect(termFaults(M.lesson), JSON.stringify(termFaults(M.lesson))).toEqual([]);
    // The two terms THIS lesson introduces are glossed where they are first
    // used, which is what DR-0521 requires and what the registry's HARD_TERMS
    // list cannot know about a term it does not carry. They are NOT added to
    // that list here: `digest` and `programming language` both already appear
    // un-glossed in neighbouring lessons, so a registry entry would turn red a
    // lesson this build never touched. Named in DR-1364 with
    // `re-review: 2026-11-27`.
    expect(M.levels.youth.includes('A digest is a letter that packs a day of news into short items'), 'digest is used before it is glossed').toBe(true);
    expect(
      M.levels.youth.includes('PHP is a programming language. That means steps people write to make a web page work'),
      'programming language is used before it is glossed'
    ).toBe(true);
    // PROVEN TO CATCH: the gloss must PRECEDE the term's load-bearing use.
    const at = (s) => M.levels.youth.indexOf(s);
    expect(at('A digest is a letter that packs a day of news into short items')).toBeLessThan(at('The digest held a dozen stories'));
  });

  it('TALK ABOUT IT TOGETHER is on the lesson AND on every band, in all three directions (DR-0733 / DR-0795)', () => {
    expect(hasAllThree(M), 'the module pooled does not carry all three directions').toBe(true);
    expect(placesMissingDirections(M), `places missing directions: ${JSON.stringify(placesMissingDirections(M))}`).toEqual([]);
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(txt.includes('TALK ABOUT IT TOGETHER'), `${place} has no TALK block`).toBe(true);
      expect(/Deuteronomy 6:7/.test(txt), `${place} omits the four places`).toBe(true);
      expect(/one friend this week/i.test(txt), `${place} omits the friend rhythm`).toBe(true);
      expect(/listen all the way/i.test(txt), `${place} omits listening to the end`).toBe(true);
      expect(/(?:say|said) it back|retell/i.test(txt), `${place} omits the retell`).toBe(true);
    }
  });

  it('PROVEN TO CATCH: stripping one band’s friend line alone is named by the per-band check while the pooled check stays green', () => {
    // The exact proof DR-0795 asks for: a module can read whole while one band
    // sends a reader nowhere, and a reader reads ONE band.
    const stripped = {
      ...M,
      levels: { ...M.levels, teen: M.levels.teen.replace(/Then one friend this week:[^]*?pray one for another\./, '') },
    };
    expect(stripped.levels.teen, 'the teen friend line could not be stripped').not.toBe(M.levels.teen);
    const gaps = placesMissingDirections(stripped);
    expect(
      gaps.map((g) => g.place),
      'the per-band check does not name the teen band'
    ).toContain('teen');
    expect(gaps.find((g) => g.place === 'teen').missing, 'the named gap is not the friend direction').toContain('friends');
    expect(hasAllThree(stripped), 'the POOLED check should still read green, which is the whole point of DR-0795').toBe(true);
  });

  it('growth is measured the Word’s way, qualitative and quantitative, never imported', () => {
    const blob = allStrings().join('\n');
    expect(blob.includes(SPINE_FRAGMENTS['Galatians 5:22']), 'Galatians 5:22 is not carried').toBe(true);
    expect(blob.includes(SPINE_FRAGMENTS['Deuteronomy 6:7']), 'Deuteronomy 6:7 is not carried').toBe(true);
    expect(blob.includes(SPINE_FRAGMENTS['Hebrews 3:13']), 'Hebrews 3:13 is not carried').toBe(true);
  });
});

describe('sov71 — a true story names whose life it was, so neither story claims to be one (DR-1123)', () => {
  it('both stories are parables, and no story wears the testimony label', () => {
    expect(M.stories.length).toBeGreaterThanOrEqual(2);
    for (const s of M.stories) {
      expect(s.kind, `a story in ${ID} is labelled ${s.kind}`).toBe('parable');
      expect(String(s.title || '').length, 'a story has no title').toBeGreaterThan(5);
      expect(String(s.body || '').length, 'a story has no body').toBeGreaterThan(400);
    }
    // Written to teach, never lived by a named person, so the label that tells a
    // reader "a true story I lived" is not used. DR-1123's pin of 88 unsourced
    // true stories cannot move because of this lesson.
    expect(
      M.stories.some((s) => s.kind === 'testimony'),
      'this lesson adds an unsourced true story'
    ).toBe(false);
    // And neither parable is written in the first person as a lived account.
    for (const s of M.stories) {
      expect(/^\s*(I |We )/.test(s.body), 'a parable opens as a first-person account').toBe(false);
      expect(/\bPicture\b/.test(s.body), 'a parable does not frame itself as one').toBe(true);
    }
  });
});

describe('sov71 — PROVEN TO CATCH, place by place', () => {
  const everyPlace = (re) => (p) => Object.values(p).every((v) => re.test(v));
  it('breaking any load-bearing marker, at every site it appears, is caught', () => {
    const rows = [
      ['NOBODY', 'SOMEBODY', everyPlace(/NOBODY/), 'the DR-0719 who-taught marker'],
      ['TALK ABOUT IT TOGETHER', 'ONE LAST THING', everyPlace(/TALK ABOUT IT TOGETHER/), 'the DR-0733 block'],
      ['Deuteronomy 6:7', 'the Word', everyPlace(/Deuteronomy 6:7/), 'the TALK rhythm'],
      ['Lamb of Yahweh', 'Lamb', everyPlace(/Lamb of Yahweh/), 'the DR-0210 confession'],
      ['Eternal Son of Yahweh', 'Son', everyPlace(/Eternal Son of Yahweh/), 'the DR-0210 Son confession'],
      ['hide thyself as it were for a little moment', 'hide for a while', everyPlace(/hide thyself as it were for a little moment/), 'the week’s own hinge'],
      ['let them shut the doors, and bar them', 'close up at night', everyPlace(/let them shut the doors, and bar them/), 'the gate shut on a timetable'],
      // NOT the mediated-read label: the child band carries that fact in plain
      // words rather than the term, so a five-place guard on it does not hold
      // on the shipped lesson. This case caught that, and the label keeps its
      // own non-child case plus its own proven-to-catch case below.
      [SPINE_FRAGMENTS['Amos 3:7'], 'He tells His servants', everyPlace(/Surely the Lord GOD will do nothing/), 'the verse that proves the direction'],
      ['Lessons', 'a note', everyPlace(/Lessons/), 'his one word'],
      ['digest', 'email', everyPlace(/digest/i), 'the named source form'],
    ];
    const p0 = PLACES();
    for (const [from, to, guard, name] of rows) {
      const sites = Object.values(p0).filter((v) => v.includes(from)).length;
      expect(sites, `break "${from.slice(0, 46)}" found NO SITES`).toBeGreaterThan(0);
      expect(guard(p0), `guard for "${name}" does not hold on the SHIPPED lesson`).toBe(true);
      const bent = Object.fromEntries(Object.entries(p0).map(([k, v]) => [k, v.split(from).join(to)]));
      expect(guard(bent), `break "${from.slice(0, 46)}" at all ${sites} site(s) was NOT caught by ${name}`).toBe(false);
    }
    // And the band ladder catches a break of its own, since no row above does.
    const stripped = { ...M, levels: { ...M.levels, child: M.levels.child.slice(0, 400) } };
    expect(fourBandFaults(stripped).length, 'the band ladder catches a gutted child band').toBeGreaterThan(0);
  });

  it('PROVEN TO CATCH: softening the refusal into a description, in any non-child place, is caught', () => {
    // The guard that keeps a blocked road from reading as a verified claim.
    const quotesTheRefusal = (txt) => txt.includes('curl: (56) CONNECT tunnel failed, response 403');
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue;
      expect(quotesTheRefusal(txt), `${place} does not quote the refusal on the shipped lesson`).toBe(true);
      const softened = txt.replace('curl: (56) CONNECT tunnel failed, response 403', 'the request was blocked');
      expect(quotesTheRefusal(softened), `a softened refusal in ${place} was NOT caught`).toBe(false);
    }
  });

  it('PROVEN TO CATCH: an unsourced true story planted in this module is caught', () => {
    const noTestimony = (stories) => !stories.some((s) => s.kind === 'testimony');
    expect(noTestimony(M.stories), 'the shipped lesson already carries a testimony').toBe(true);
    expect(noTestimony([...M.stories, { kind: 'testimony', title: 'planted', body: 'x' }]), 'a planted testimony was NOT caught').toBe(false);
  });

  it('the per-place slices used above are UNIQUE to their place, so no band can be reworded from a sibling', () => {
    const p = PLACES();
    const uniqueCarrier = (slice, place) => {
      const holders = Object.entries(p)
        .filter(([, v]) => v.includes(slice))
        .map(([k]) => k);
      expect(holders, `"${slice.slice(0, 40)}" is not unique to ${place}`).toEqual([place]);
    };
    uniqueCarrier('Good quiet hides the trick from the thief.', 'child');
    uniqueCarrier('Weigh it with a line, not a mood.', 'youth');
    uniqueCarrier('That is the cheapest lie available in this work', 'teen');
    uniqueCarrier('Give the room that sentence twice', 'senior');
    uniqueCarrier('THAT IS THE WHOLE TEST, and it is a test about DIRECTION', 'adult');
  });
});

describe('sov71 — shared ground is MEASURED, never claimed (DR-1317)', () => {
  // This is a measurement and not a veto. It names the other holder for every
  // reference this lesson shares, and it asserts NOTHING about what another
  // lesson may stand on. A verse is never spent.
  //
  // Measured 2026-11-06 on `origin/main` 3a073d0c3, by scanning the catalog's
  // own course and class modules (app/src/lib/*-class.js, *-course.js) with
  // THIS lesson's own block excluded, so a holder is always some other lesson.
  // app/public/bible/xref/ is excluded because it is the cross-reference index
  // and not taught content.
  const SHARED_AND_WHO_ELSE_HOLDS_IT = {
    'Nehemiah 2:12': 'inspections (read for the walk-the-property survey, not for what a surveyor may withhold)',
    'Nehemiah 2:16': 'inspections and another sovereign-ai week',
    'Nehemiah 2:18': 'inspections, living-lessons and word-out',
    'Amos 3:7': 'living-lessons and another sovereign-ai week',
    'Proverbs 11:13': 'ai-legal-blueprint, living-lessons and another sovereign-ai week',
    'Ecclesiastes 3:7': 'living-lessons and two other sovereign-ai weeks',
    'Proverbs 25:2': 'ten other courses including business-research, development and world-issues (the standing search-it-out verse)',
    'Matthew 10:16': 'ai-legal-blueprint and living-lessons',
    'Proverbs 27:12': 'ai-legal-blueprint, bonds, insurance-risk, living-lessons, world-issues and another sovereign-ai week',
    'Proverbs 28:13': 'business-research, historical-research, living-lessons, world-issues and three other sovereign-ai weeks',
    '2 Kings 7:9': 'another sovereign-ai week',
    'Ezekiel 33:6': 'project-management, software-project-management, world-issues and seven other sovereign-ai weeks (the standing watchman verse)',
    'Luke 12:2': 'ten other courses including economics, legacy-provisions and world-issues',
    'Exodus 12:22': 'another sovereign-ai week',
    'Nehemiah 7:3': 'another sovereign-ai week (the SAME verse read for the watch assignment rather than for the gate on a timetable)',
    'Genesis 7:16': 'little-learners and another sovereign-ai week',
    'Luke 14:28': 'sixteen other courses (the standing count-the-cost verse)',
    '1 Corinthians 3:13': 'development, living-lessons, project-management and five other sovereign-ai weeks',
    'James 3:9': 'living-lessons',
    'James 3:10': 'living-lessons and another sovereign-ai week',
    'Romans 6:13': 'living-lessons',
    'Isaiah 2:4': 'living-lessons',
    'Joel 3:10': 'living-lessons',
    'Genesis 50:20': 'living-lessons, made-in-time and world-issues',
    '1 Samuel 17:51': 'living-lessons',
    'John 1:29': 'the standing Godhead confession',
    'John 3:16': 'the standing Godhead confession',
    'Hebrews 1:8': 'the standing Godhead confession',
    'Colossians 1:17': 'the standing Godhead confession',
    'Galatians 5:22': 'the standing growth measure',
    'Deuteronomy 6:7': 'the standing growth measure',
    'Hebrews 3:13': 'the standing growth measure',
  };
  /**
   * References the TAUGHT CATALOG had never opened when this was written. All
   * three appear in NO file of app/src or docs/decisions at all (measured
   * 2026-11-06, excluding app/public/bible/xref/). Isaiah 26:20 is the ground
   * this week's second movement stands on — the commanded, bounded, named-at-
   * its-end withdrawal — and the library had never once taught it.
   */
  const MEASURED_UNTAUGHT_WHEN_WRITTEN = ['Isaiah 26:20', 'Leviticus 13:46', '1 Timothy 1:8'];

  it('the census covers every reference exactly once, and the two halves add up', () => {
    const shared = Object.keys(SHARED_AND_WHO_ELSE_HOLDS_IT);
    const all = [...shared, ...MEASURED_UNTAUGHT_WHEN_WRITTEN].sort();
    expect(all.length, 'the census double-counts or misses a reference').toBe(SPINE_COUNT);
    expect(all).toEqual([...SPINE].sort());
    expect(MEASURED_UNTAUGHT_WHEN_WRITTEN.length, 'the untaught count changed without the record being updated').toBe(3);
    for (const [ref, who] of Object.entries(SHARED_AND_WHO_ELSE_HOLDS_IT)) {
      expect(String(who).length, `${ref} is listed as shared without naming a holder`).toBeGreaterThan(5);
    }
  });

  it('every shared reference is still carried IN FULL here, nothing thinned for overlap', () => {
    for (const ref of Object.keys(SHARED_AND_WHO_ELSE_HOLDS_IT)) {
      expect(M.anchor.ref.includes(ref), `${ref} was dropped for appearing elsewhere`).toBe(true);
      expect(M.lesson.includes(SPINE_FRAGMENTS[ref]), `${ref} is listed but thinned out of the lesson`).toBe(true);
    }
  });

  // THE STANDING SEVEN. Every lesson in this course closes on the same Godhead
  // confession and the same growth measure, so these appear in every sibling by
  // construction and cannot be evidence of a duplicated teaching. Naming them
  // here is the correction to a premise THIS GATE CARRIED AND GOT WRONG: the
  // case below first claimed sov71 and sov66 shared NO reference at all, and it
  // went red on exactly these seven. The teaching-spine claim is the honest one.
  const STANDING_SEVEN = ['John 1:29', 'John 3:16', 'Hebrews 1:8', 'Colossians 1:17', 'Galatians 5:22', 'Deuteronomy 6:7', 'Hebrews 3:13'];

  it('shares NO teaching reference with the sibling built from the same event, outside the standing seven', () => {
    // sov66 (DR-1322) reads this same PHP defect for UNPRICED PROTECTION; spm11
    // (#2570 / DR-1358) reads it from the local operator's chair. The overlap is
    // MEASURED here from the mounted modules rather than asserted in prose, and
    // the claim is about THIS lesson's spine only — it says nothing about what
    // either neighbour may stand on, which is what DR-1317 removed.
    const sov66 = SOVEREIGN_AI_MODULES.find((m) => m.id.startsWith('sov66-'));
    expect(sov66, 'sov66 is not mounted, so the comparison cannot be made').toBeTruthy();
    const theirs = new Set(sov66.anchor.ref.split(';').map((s) => s.trim()));
    const sharedTeaching = SPINE.filter((r) => theirs.has(r) && !STANDING_SEVEN.includes(r));
    expect(sharedTeaching, 'sov71 and sov66 now share a teaching reference; the census must name it and the landings must still differ').toEqual([]);
    // PROVEN NOT HOLLOW: the standing seven really are shared, so the filter is
    // excluding something rather than dressing up an empty scan.
    expect(STANDING_SEVEN.filter((r) => theirs.has(r)).length, 'the standing seven are not shared, so this filter proves nothing').toBe(STANDING_SEVEN.length);
  });

  it('this lesson’s reader text never points at another lesson (every lesson stands alone and whole)', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(/\bsov\d+\b/i.test(txt), `${place} points a reader at another lesson`).toBe(false);
      expect(/\bll\d+\b/i.test(txt), `${place} points a reader at another lesson`).toBe(false);
      expect(/\bspm\d+\b/i.test(txt), `${place} points a reader at another lesson`).toBe(false);
      expect(/\bweek (?:sixty-six|seventy|seventy-one)\b/i.test(txt), `${place} points a reader at another week`).toBe(false);
    }
  });

  it('the landing is this lesson’s own, and is not a sibling’s (proved from the landing, not the headline)', () => {
    // sov66's landing is UNPRICED PROTECTION — a risk ranked low because the
    // attacker was assumed weak.
    // sov70's landing is THE COORDINATION BUDGET — what must wait on agreement.
    // THIS lesson's landing is THE DISCLOSURE ETHIC: the two-sided test for
    // silence, darkness chosen on purpose, and a capability with no loyalty.
    const blob = allStrings().join('\n');
    expect(/dwelt careless|no deliverer|ranked low because/i.test(blob), 'this lesson teaches the unpriced-protection landing of another week').toBe(false);
    expect(/coordination budget|every one over against his house - the wall/i.test(blob), 'this lesson teaches the coordination landing of another week').toBe(
      false
    );
    expect(/unsupported version|mitigation is not a fix/i.test(blob), 'this lesson teaches the local-operator landing of the project-management week').toBe(
      false
    );
  });
});

describe('sov71 — the date is derived, never typed', () => {
  it('lesson-dates records this lesson, derived from git and not from the working tree', () => {
    const d = lessonCreatedDay('sovereign-ai', ID);
    expect(d, `${ID} has no lesson-dates entry; run npm run lesson-dates`).toBeTruthy();
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
