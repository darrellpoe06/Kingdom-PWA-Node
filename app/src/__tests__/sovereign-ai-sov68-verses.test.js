// =============================================================================
// sovereign-ai-sov68-verses — the gate for sov68, "There shall be none in the
// field"
// =============================================================================
// WHAT THIS LESSON IS, AND WHAT IT DELIBERATELY IS NOT.
//
// Gmail thread `1a163d3dfa9641dc`, one message, forwarded 2026-10-22 13:36:27
// UTC from dpoe@illinois.edu to darrellpoe06@gmail.com, subject
// `FW: [Illinois StatusHub] - Canvas Maintenance - SCORM Engine Upgrade - New
// Maintenance`. HIS LINE above the forwarded header is a QUESTION and not a
// label: "Lesson... do we use SCORM or the process or something like it, if
// not, what?" The week is judged by that question, never by the subject line.
//
// THE ITEM TAUGHT is a SCHEDULED, ANNOUNCED UPGRADE OF A WORKING ENGINE. Not an
// emergency. Not a removal. The notice went out eight days ahead with the hour
// named, and it does three things almost no notice does: it names what STOPS
// (nothing new may be imported), it names what KEEPS RUNNING ("launching and
// completing existing SCORM packages, recording scores in the gradebook, and
// general navigation, will remain fully operational"), and it names the
// reader's part ("No action required"). So the week lands on THE ANNOUNCED
// PAUSE, on Exodus 16's sabbath manna: the gathering ceased, the eating did
// not, the portion laid up for the announced day did not spoil against its own
// nature, and those who went out to gather in the window found none.
//
// WHERE THE NEIGHBORS LAND, read from their own big idea and in-app step rather
// than from a verse count, which is the measure DR-1317 removed:
//   sov66 lands on a REPRICING and a HAND — a protection whose only support is
//         that nobody has tried it is UNPRICED; its page is headed WHAT
//         ACTUALLY HOLDS IT and the remedy is a repair by your own hand.
//   sov67 lands on REMOVAL — what cannot be patched is taken away, sooner than
//         announced and with less warning than anybody wanted, and on a part
//         nobody can lend you; its page is a page of DATES when support ENDS.
//         Its source is an EMERGENCY with less communication than is desirable.
//         This source is the opposite on both axes: a PLANNED upgrade of a
//         WORKING engine, with MORE warning than was needed. Asserted below on
//         both lessons' own text, in both directions.
//   sov24 lands on the MIGRATION CRAFT — counting the cost before touching a
//         running system, a weapon in one hand, a reversible first step, two
//         witnesses — and it is written for the one DOING the migration. This
//         week is written for the one who RECEIVES the notice, whose part is
//         nothing.
//   sov48 lands on CACHE INVALIDATION and carries Exodus 16:19-21 for bread
//         that would NOT keep. This lesson carries 16:19-20 for that same fact
//         and then goes on to 16:22-29, which sov48 does not touch, for the
//         opposite one: the portion laid up for the announced day DID keep.
//
// A VERSE IS NEVER SPENT (DR-1317, Darrell 2026-11-05). Not one reading was
// dropped here for a collision. The census below is a MEASUREMENT that names
// the other holder, never a veto. TWO readings were refused on the LANDING
// rather than on the Scripture — Matthew 9:17's new bottles and the
// Hebrews 8:13 / Isaiah 40:8 / Matthew 24:35 chain — because taking them would
// pull this lesson onto sov24's message ("the Word is not a schema"), not
// because any verse is spent. Both are named in DR-1338.
//
// EVERY LESSON STANDS ALONE AND WHOLE (DR-1317's second correction). No reader
// text points at another lesson. The comparison above lives in DR-1338 and in
// this header, where a reviewer reads it and a reader does not.
//
// WHO TAUGHT (DR-0719): NOBODY. A forwarded institutional maintenance notice is
// not a recording. All five reader places say so; the cases below forbid the
// bare phrase "the teacher" and forbid naming Bishop Gwin for a source that
// names nobody.
//
// WEEK 68 WHILE WEEK 67 IS IN FLIGHT, SAID PLAINLY. sov67 is open on PR #2552
// and had not landed on `main` when this was written, so this lesson is the
// 67th MOUNTED module while carrying the number 68. The cases below assert
// contiguity through 66 (durably true), that week 68 is mounted exactly once,
// and that it sits last — never that 67 is absent, which would turn red the
// moment the sibling lands. Recorded in DR-1338.
//
// Every verse was fetched from app/public/bible/kjv by script BEFORE a word was
// written, and SPINE_FRAGMENTS pins the exact span this lesson quotes for every
// one of the 34 references. Recorded as DR-1338.
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

const ID = 'sov68-there-shall-be-none-in-the-field';
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
  "Amos 3:7": "Surely the Lord GOD will do nothing, but he revealeth his secret unto his servants the prophets.",
  "Exodus 16:5": "And it shall come to pass, that on the sixth day they shall prepare that which they bring in; and it shall be twice as much as they gather daily.",
  "Exodus 16:19": "And Moses said, Let no man leave of it till the morning.",
  "Exodus 16:20": "Notwithstanding they hearkened not unto Moses; but some of them left of it until the morning, and it bred worms, and stank: and Moses was wroth with them.",
  "Exodus 16:22": "on the sixth day they gathered twice as much bread, two omers for one man",
  "Exodus 16:23": "This is that which the LORD hath said, To morrow is the rest of the holy sabbath unto the LORD: bake that which ye will bake to day, and seethe that ye will seethe; and that which remaineth over lay up for you to be kept until the morning.",
  "Exodus 16:24": "And they laid it up till the morning, as Moses bade: and it did not stink, neither was there any worm therein.",
  "Exodus 16:25": "Eat that to day; for to day is a sabbath unto the LORD: to day ye shall not find it in the field.",
  "Exodus 16:26": "Six days ye shall gather it; but on the seventh day, which is the sabbath, in it there shall be none.",
  "Exodus 16:27": "And it came to pass, that there went out some of the people on the seventh day for to gather, and they found none.",
  "Exodus 16:28": "And the LORD said unto Moses, How long refuse ye to keep my commandments and my laws?",
  "Exodus 16:29": "See, for that the LORD hath given you the sabbath, therefore he giveth you on the sixth day the bread of two days; abide ye every man in his place, let no man go out of his place on the seventh day.",
  "2 Chronicles 29:17": "Now they began on the first day of the first month to sanctify, and on the eighth day of the month came they to the porch of the LORD: so they sanctified the house of the LORD in eight days; and in the sixteenth day of the first month they made an end.",
  "2 Chronicles 29:34": "But the priests were too few, so that they could not flay all the burnt offerings: wherefore their brethren the Levites did help them, till the work was ended, and until the other priests had sanctified themselves: for the Levites were more upright in heart to sanctify themselves than the priests.",
  "2 Chronicles 29:36": "And Hezekiah rejoiced, and all the people, that God had prepared the people: for the thing was done suddenly.",
  "2 Chronicles 30:3": "For they could not keep it at that time, because the priests had not sanctified themselves sufficiently, neither had the people gathered themselves together to Jerusalem.",
  "Hebrews 6:10": "For God is not unrighteous to forget your work and labour of love, which ye have shewed toward his name, in that ye have ministered to the saints, and do minister.",
  "2 Timothy 1:12": "For the which cause I also suffer these things: nevertheless I am not ashamed: for I know whom I have believed, and am persuaded that he is able to keep that which I have committed unto him against that day.",
  "2 Timothy 2:2": "And the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also.",
  "Jeremiah 31:33": "But this shall be the covenant that I will make with the house of Israel; After those days, saith the LORD, I will put my law in their inward parts, and write it in their hearts; and will be their God, and they shall be my people.",
  "Deuteronomy 6:6": "And these words, which I command thee this day, shall be in thine heart:",
  "Leviticus 19:36": "Just balances, just weights, a just ephah, and a just hin, shall ye have: I am the LORD your God, which brought you out of the land of Egypt.",
  "Proverbs 11:1": "A false balance is abomination to the LORD: but a just weight is his delight.",
  "Hebrews 4:9": "There remaineth therefore a rest to the people of God.",
  "Hebrews 4:10": "For he that is entered into his rest, he also hath ceased from his own works, as God did from his.",
  "Hebrews 4:11": "Let us labour therefore to enter into that rest, lest any man fall after the same example of unbelief.",
  "Isaiah 30:15": "For thus saith the Lord GOD, the Holy One of Israel; In returning and rest shall ye be saved; in quietness and in confidence shall be your strength: and ye would not.",
  "John 1:29": "The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.",
  "John 3:16": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "Hebrews 1:8": "But unto the Son he saith, Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom.",
  "Colossians 1:17": "And he is before all things, and by him all things consist.",
  "Galatians 5:22": "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,",
  "Deuteronomy 6:7": "And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.",
  "Hebrews 3:13": "But exhort one another daily, while it is called To day; lest any of you be hardened through the deceitfulness of sin.",
};
const SPINE = Object.keys(SPINE_FRAGMENTS);
/** The count this gate asserts about ITSELF, so an empty scan can never pass. */
const SPINE_COUNT = 34;

describe('sov68 — the lesson is mounted and is the week it says it is', () => {
  it('is mounted as week 68, at the index its week requires, with every reader field present', () => {
    expect(M, `${ID} is not mounted`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(m.id.match(/^sov(\d+)-/)[1]));
    // FORWARD-SAFE AND GAP-SAFE ON PURPOSE (DR-1316 / DR-1338): a lesson gate
    // may not claim to be the last lesson, and it may not claim a sibling's
    // week is absent. What is durably true: week 68 exists, exactly once, it is
    // THIS lesson, it is the highest week mounted at the time of writing, and
    // the weeks run contiguous from one through 66.
    //
    // THIS COMMENT FORBADE WHAT THE NEXT LINE DID, and the next line won until
    // sov69 arrived (DR-1351). The removed assertion was
    // `expect(MODULES[MODULES.length - 1].id).toBe(ID)` with the message
    // 'sov68 is not last' -- a claim to be the final lesson, in the file whose
    // own comment says a gate may not make it. It read green for one reason
    // only: no later week existed yet. That is a snapshot read as an invariant,
    // and it is the third time DR-1316's class has landed (pm13's gate appended
    // a literal 14; sov65's met it before that).
    //
    // Replaced by what stays true when week 70 lands, and the form sov69's own
    // gate reached independently: the weeks ascend and run contiguous, so a
    // lesson's INDEX is its week minus one. That pins position without claiming
    // finality.
    expect(weeks).toContain(68);
    expect(weeks.filter((w) => w === 68).length, 'week 68 is mounted twice').toBe(1);
    expect(
      SOVEREIGN_AI_MODULES.findIndex((m) => m.id === ID),
      'sov68 is not at the index its week number requires'
    ).toBe(67);
    expect(Math.max(...weeks)).toBeGreaterThanOrEqual(68);
    for (let w = 1; w <= 66; w += 1) expect(weeks, `week ${w} is missing`).toContain(w);
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
});

describe('sov68 — every verse came from the corpus on disk, not from memory', () => {
  it(`pins all ${SPINE_COUNT} references, and the count is asserted so an empty scan cannot pass`, () => {
    expect(SPINE.length, 'the pinned spine changed size without this count being updated').toBe(SPINE_COUNT);
    const refs = M.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
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

  it('every reference in anchor.ref is actually QUOTED in the adult lesson', () => {
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

  it('no verse is quoted with a straight apostrophe where the corpus has a curly one (DR-1273)', () => {
    for (const s of allStrings()) {
      const bad = s.match(/[a-z]'(?:s|t|d|ll|re|ve)\b/g) || [];
      for (const hit of bad) {
        // our own prose may use a straight apostrophe; a QUOTED span may not,
        // because the corpus writes it curly. Only flag inside quotations.
        const i = s.indexOf(hit);
        const before = s.slice(0, i);
        const openQuotes = (before.match(/"/g) || []).length;
        expect(openQuotes % 2, `straight apostrophe inside a quotation: ...${s.slice(Math.max(0, i - 40), i + 20)}...`).toBe(0);
      }
    }
  });
});

describe('sov68 — the Word is quoted, never rewritten', () => {
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

  it('the DR-0210 confession is present: the Lamb of Yahweh and the Eternal Son of Yahweh', () => {
    const p = PLACES();
    for (const [place, txt] of Object.entries(p)) {
      if (place === 'child') {
        expect(txt.includes('Lamb of Yahweh'), `${place} lacks the Lamb confession`).toBe(true);
        continue;
      }
      expect(txt.includes('Lamb of Yahweh'), `${place} lacks the Lamb confession`).toBe(true);
      expect(txt.includes('Eternal Son of Yahweh'), `${place} lacks the Son confession`).toBe(true);
    }
  });

  it('our own prose carries no British spellings (quoted Scripture is left exactly as written)', () => {
    for (const s of allStrings()) {
      const hits = findBritish(s);
      expect(hits.map((h) => h.word), `British spelling in our prose: ${hits.map((h) => h.word).join(', ')}`).toEqual([]);
    }
  });
});

describe('sov68 — WHO TAUGHT: NOBODY', () => {
  it('all five reader places say nobody taught it', () => {
    const p = PLACES();
    for (const [place, txt] of Object.entries(p)) {
      expect(/NOBODY/.test(txt), `${place} does not say WHO TAUGHT: NOBODY`).toBe(true);
    }
  });

  it('never credits Bishop Gwin, and never uses the bare phrase "the teacher" (DR-0719)', () => {
    const blob = allStrings().join('\n');
    expect(/Gwin/i.test(blob), 'a source that names nobody must not credit Bishop Gwin').toBe(false);
    expect(/\bthe teacher\b/i.test(blob), 'the bare phrase "the teacher" is forbidden').toBe(false);
  });

  it('the provenance is carried: the thread, the forward time, and HIS question', () => {
    const blob = allStrings().join('\n');
    expect(blob.includes('1a163d3dfa9641dc'), 'the thread id is not carried').toBe(true);
    expect(blob.includes('13:36:27'), 'the forward time is not carried').toBe(true);
    expect(blob.includes('do we use SCORM or the process or something like it, if not, what?'), 'HIS question is not quoted').toBe(true);
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(/notice|letter/i.test(txt), `${place} never says the source was a notice`).toBe(true);
    }
  });
});

describe('sov68 — the lesson agrees with what we actually measured about standards', () => {
  it('never claims this platform uses an interchange standard, and never urges adopting one', () => {
    // The measured truth (DR-1338): a search of app/src, docs/decisions and
    // docs/00-foundations for scorm|xapi|tincan|cmi5|lti returns NOTHING, and
    // the platform carries its own native record model instead.
    //
    // HIS QUESTION IS REMOVED BEFORE THE SCAN, deliberately. He asked "do we
    // use SCORM or the process or something like it, if not, what?" (he typed an
// ellipsis after "Lesson"; reader text renders that pause as a dash, DR-0331,
// because the shrink-only elision ratchet reads an ellipsis inside a quotation
// as an elided Scripture -- the raw form is kept in this header and in DR-1338)
// and the
    // lesson quotes him verbatim in all five places (DR-0331). Scanning for the
    // phrase without first removing his own words would flag the quotation of
    // the question as a claim, which is the opposite of the truth.
    const HIS_QUESTION = 'Lesson - do we use SCORM or the process or something like it, if not, what?';
    const blob = allStrings().join('\n').split(HIS_QUESTION).join(' [HIS QUESTION] ');
    expect(blob.includes('do we use SCORM'), 'his question leaked past the removal').toBe(false);
    expect(/\bwe use none\b/i.test(blob), 'the lesson never states the measured answer').toBe(true);
    for (const claim of [
      'we use SCORM', 'we do use SCORM', 'our SCORM', 'we should adopt', 'we ought to adopt',
      'we need to adopt', 'this app uses SCORM', 'our platform uses SCORM',
    ]) {
      expect(blob.toLowerCase().includes(claim.toLowerCase()), `the lesson claims "${claim}"`).toBe(false);
    }
  });

  it('names the native record model rather than hand-waving at it', () => {
    const blob = allStrings().join('\n');
    let named = 0;
    for (const piece of ['catalog', 'units', 'resume point', 'clip progress', 'learner records']) {
      if (blob.toLowerCase().includes(piece.toLowerCase())) named += 1;
    }
    expect(named, 'the native model is not named').toBeGreaterThanOrEqual(4);
  });

  it('carries the trust-but-verify note: the tiers, the blocked roads quoted, and what checking changed (DR-0190 §5)', () => {
    const p = PLACES();
    for (const [place, txt] of Object.entries(p)) {
      if (place === 'child') continue; // the child band carries the teaching, not the audit
      expect(/DOCUMENTED|stated flat|measured/i.test(txt), `${place} has no documented tier`).toBe(true);
      expect(/ATTRIBUTED|reported as what/i.test(txt), `${place} has no attributed tier`).toBe(true);
      expect(/UNCHECKED|blocked road/i.test(txt), `${place} has no unchecked tier`).toBe(true);
      expect(txt.includes('getaddrinfo ENOTFOUND status.illinois.edu'), `${place} does not quote the first refusal`).toBe(true);
      expect(txt.includes('HTTP 403 Forbidden'), `${place} does not quote the second refusal`).toBe(true);
    }
    // And the finding that only reading the WHOLE notice produced.
    expect(M.lesson.includes('three times'), 'the self-contradicting window is not named').toBe(true);
  });
});

describe('sov68 — the four bands, and TALK ABOUT IT TOGETHER everywhere', () => {
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

  it('explains its term in plain words before using it (plain-before-the-term)', () => {
    expect(termFaults(M), JSON.stringify(termFaults(M))).toEqual([]);
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue;
      expect(/set of rules (?:that |which )?every(?:one|body) agrees to/i.test(txt), `${place} never explains the term plainly`).toBe(true);
    }
  });

  it('TALK ABOUT IT TOGETHER is on the lesson AND on every band, in all three directions (DR-0733 / DR-0795)', () => {
    expect(hasAllThree(M), 'the module pooled does not carry all three directions').toBe(true);
    expect(placesMissingDirections(M), `places missing directions: ${JSON.stringify(placesMissingDirections(M))}`).toEqual([]);
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(txt.includes('TALK ABOUT IT TOGETHER'), `${place} has no TALK block`).toBe(true);
      expect(/Deuteronomy 6:7/.test(txt), `${place} omits the four places`).toBe(true);
      expect(/one friend this week/i.test(txt), `${place} omits the friend rhythm`).toBe(true);
      expect(/listen all the way (?:to the end|through)/i.test(txt), `${place} omits listening to the end`).toBe(true);
      expect(/(?:say|said) it back|retell/i.test(txt), `${place} omits the retell`).toBe(true);
    }
  });

  it('growth is measured the Word’s way, qualitative and quantitative, never imported', () => {
    const blob = allStrings().join('\n');
    expect(blob.includes('But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith'), 'Galatians 5:22 is not carried').toBe(true);
    expect(blob.includes('But exhort one another daily, while it is called To day'), 'Hebrews 3:13 is not carried').toBe(true);
  });
});

describe('sov68 — PROVEN TO CATCH, place by place', () => {
  const everyPlace = (re) => (p) => Object.values(p).every((v) => re.test(v));
  it('breaking any load-bearing marker, at every site it appears, is caught', () => {
    const rows = [
      ['NOBODY', 'SOMEBODY', everyPlace(/NOBODY/), 'the DR-0719 who-taught marker'],
      ['TALK ABOUT IT TOGETHER', 'ONE LAST THING', everyPlace(/TALK ABOUT IT TOGETHER/), 'the DR-0733 block'],
      ['Deuteronomy 6:7', 'the Word', everyPlace(/Deuteronomy 6:7/), 'the TALK rhythm'],
      ['Lamb of Yahweh', 'Lamb', everyPlace(/Lamb of Yahweh/), 'the DR-0210 confession'],
      ['there shall be none', 'there shall be some', everyPlace(/there shall be none/), 'the week’s own hinge'],
      ['it did not stink, neither was there any worm therein', 'it kept well enough', everyPlace(/it did not stink, neither was there any worm therein/), 'the portion that did not spoil'],
      ['they found none', 'they found a little', everyPlace(/they found none/), 'the men who went out anyway'],
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

  it('the per-place slices used above are UNIQUE to their place, so no band can be reworded from a sibling', () => {
    const p = PLACES();
    const uniqueCarrier = (slice, place) => {
      const holders = Object.entries(p).filter(([, v]) => v.includes(slice)).map(([k]) => k);
      expect(holders, `"${slice.slice(0, 40)}" is not unique to ${place}`).toEqual([place]);
    };
    uniqueCarrier('Late is better than sloppy.', 'child');
    uniqueCarrier('The name has four parts, and the last one is the part most people never think about.', 'youth');
    uniqueCarrier('Four parts in the name, and the fourth is the one that answers the question this week came in with.', 'teen');
    uniqueCarrier("Teach this as the course's week on THE ANNOUNCED PAUSE", 'senior');
    uniqueCarrier('Three things stop, keep running, and are required of you.', 'adult');
  });
});

describe('sov68 — shared ground is MEASURED, never claimed (DR-1317)', () => {
  // This is a measurement and not a veto. It names the other holder for every
  // reference this lesson shares, and it asserts NOTHING about what another
  // lesson may stand on. A verse is never spent.
  const SHARED_AND_WHO_ELSE_HOLDS_IT = {
    'Exodus 16:19': 'sov48 (cache invalidation — bread that would not keep)',
    'Exodus 16:20': 'sov48 (the same fact, read the other way)',
    'Amos 3:7': 'a Living Lesson on what Yahweh discloses and when',
    'Jeremiah 31:33': 'several lessons across the library',
    '2 Timothy 2:2': 'many lessons across the library',
    'Leviticus 19:36': 'the just-weight lessons',
    'Proverbs 11:1': 'the just-weight lessons',
    'Deuteronomy 6:6': 'the Deuteronomy 6 lessons',
    'Hebrews 6:10': 'll264 and others',
    '2 Timothy 1:12': 'sov44 and others',
    'Isaiah 30:15': 'll275, l115 and others',
    'Hebrews 4:9': 'the rest lessons',
    'Hebrews 4:10': 'sov41 and others',
    'John 1:29': 'the standing Godhead confession',
    'John 3:16': 'the standing Godhead confession',
    'Hebrews 1:8': 'the standing Godhead confession',
    'Colossians 1:17': 'the standing Godhead confession',
    'Galatians 5:22': 'the standing growth measure',
    'Deuteronomy 6:7': 'the standing growth measure',
    'Hebrews 3:13': 'the standing growth measure',
  };
  const MEASURED_UNBUILT_WHEN_WRITTEN = [
    'Exodus 16:5', 'Exodus 16:22', 'Exodus 16:23', 'Exodus 16:24', 'Exodus 16:25',
    'Exodus 16:26', 'Exodus 16:27', 'Exodus 16:28', 'Exodus 16:29',
    '2 Chronicles 29:17', '2 Chronicles 29:34', '2 Chronicles 29:36', '2 Chronicles 30:3',
    'Hebrews 4:11',
  ];

  it('the census covers every reference exactly once, and the two halves add up', () => {
    const shared = Object.keys(SHARED_AND_WHO_ELSE_HOLDS_IT);
    const all = [...shared, ...MEASURED_UNBUILT_WHEN_WRITTEN].sort();
    expect(all.length, 'the census double-counts or misses a reference').toBe(SPINE_COUNT);
    expect(all).toEqual([...SPINE].sort());
    expect(MEASURED_UNBUILT_WHEN_WRITTEN.length, 'the unbuilt count changed without the record being updated').toBe(14);
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

  it('this lesson’s reader text never points at another lesson (every lesson stands alone and whole)', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(/\bsov\d+\b/i.test(txt), `${place} points a reader at another lesson`).toBe(false);
      expect(/\bll\d+\b/i.test(txt), `${place} points a reader at another lesson`).toBe(false);
      expect(/\bweek (?:twenty|forty|sixty|sixty-six|sixty-seven)\b/i.test(txt), `${place} points a reader at another week`).toBe(false);
    }
  });

  it('the landing is this lesson’s own, and is not a sibling’s (proved from the landing, not the headline)', () => {
    // sov67's landing is REMOVAL of what cannot be patched, on an unchosen day.
    // sov66's landing is an UNPRICED protection, repriced and repaired by hand.
    // This lesson's landing is an ANNOUNCED PAUSE of a WORKING thing.
    const blob = allStrings().join('\n');
    expect(/working/i.test(blob) && /announced/i.test(blob), 'the landing markers are absent').toBe(true);
    expect(M.bigIdea.includes('It was not broken.'), 'the lesson does not say the thing was working').toBe(true);
    expect(M.bigIdea.includes('No action required'), 'the lesson does not carry the reader’s part').toBe(true);
    // And it does NOT teach the sibling landings.
    expect(/cannot be made safe to run/i.test(blob), 'this lesson teaches sov67’s removal landing').toBe(false);
    expect(/UNPRICED/.test(blob), 'this lesson teaches sov66’s repricing landing').toBe(false);
    expect(/the Word is not a schema/i.test(blob), 'this lesson teaches sov24’s landing').toBe(false);
  });
});

describe('sov68 — the date is derived, never typed', () => {
  it('lesson-dates records this lesson, derived from git and not from the working tree', () => {
    const d = lessonCreatedDay('sovereign-ai', ID);
    expect(d, `${ID} has no lesson-dates entry; run npm run lesson-dates`).toBeTruthy();
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
