// =============================================================================
// sovereign-ai-sov69-verses — the gate for sov69, "At his day, or at evening"
// =============================================================================
// WHAT THIS LESSON IS, AND WHAT IT DELIBERATELY IS NOT.
//
// Gmail thread `1a16401bf7c5898d`, one message, forwarded 2026-10-22 15:21:39
// UTC out of a university mailbox into a household one, subject beginning
// `FW: Batch Processing vs Real-Time Streaming` (Level Up Coding). HIS LINE
// above the forwarded header is TWO INSTRUCTIONS and not a label:
// "Lessons - and potential systemic use?" The second half is a question about
// OUR OWN architecture, so a week that teaches the article and never answers it
// has done half the work. Both halves are answered: the teaching here, and the
// measured systemic finding carried in all five reader places and in DR-1351.
//
// THE ITEM TAUGHT is an EXPLAINER on the choice between letting work pile up
// and handling each arrival as it comes. So the week lands on THE LATENESS THAT
// IS A SIN AND THE WAITING THAT IS OBEDIENCE: Yahweh set a same-day deadline
// for a working man's pay BY THE WORTH OF THE RESULT TO THE ONE WAITING
// (Deuteronomy 24:15; Leviticus 19:13), and the same Word settles a whole
// vineyard in one pass at evening (Matthew 20:8) without apology, lawfully,
// because the window closes INSIDE the deadline. The standard is never the
// mechanism. And the close is the correction most engineering writing misses:
// Yahweh never names speed a sin, only HASTE (Proverbs 18:13; 19:2; 21:5).
//
// THE ADVERTISEMENT IS IGNORED ON PURPOSE. The send carried one vendor pitch
// for a product. The standing rule is that an ad is read only when it relates
// to the lesson; this one does not, so it is ignored, the lesson SAYS it was
// ignored and why, and the cases below assert the vendor and product names
// appear nowhere in the module.
//
// WHERE THE NEIGHBORS LAND, read from their own landing rather than from a
// verse count, which is the measure DR-1317 removed:
//   sov4  glances at "patient batch work overnight" as one bound on what local
//         hardware can do. It is a HARDWARE-CEILING lesson; it never asks what
//         latency a result requires.
//   sov24 names idempotent writes as a PRECONDITION for dual-writing safely
//         during a migration, and is written for the one DOING the migration.
//   sov48 carries Exodus 16:19-21 for a cache that must NOT be kept. This
//         lesson carries the same bread for the MECHANISM question: a product
//         whose worth has a half-life of hours cannot be produced overnight.
//   sov68 carries Exodus 16:23-24 as the ANNOUNCED PAUSE — what stops, what
//         keeps running, and a reader whose part is nothing. Here the same two
//         verses are the one deliberate batch window inside an otherwise
//         continuous system.
//
// A VERSE IS NEVER SPENT (DR-1317, Darrell 2026-11-05). Not one reading was
// dropped for a collision, and the census at the foot of this file is a
// MEASUREMENT that names the other holder — never a veto.
//
// EVERY LESSON STANDS ALONE AND WHOLE. No reader text points at another lesson;
// the comparison above lives here and in DR-1351, where a reviewer reads it and
// a reader does not.
//
// WHO TAUGHT (DR-0719): NOBODY. A forwarded technical newsletter is not a
// recording. All five reader places say so; the cases below forbid the bare
// phrase "the teacher" and forbid crediting Bishop Gwin for a send that names
// nobody.
//
// STORIES ARE PARABLES, NOT TESTIMONIES (DR-1123). Both stories were written to
// teach and no real person's life is behind either, so neither wears the label
// that tells a reader "a true story I lived." The case below pins that.
//
// WEEK 69, AND THE CONTIGUITY CLAIM IS FORWARD-SAFE. sov68 is ON `main`
// (fd5a968dc) and the array mounts 69 modules with no gaps. The cases assert
// week 69 exists exactly once, is this lesson, sits last, and that the weeks run
// contiguous from one through 68 — never that a later week is absent, which
// would turn red the moment a sibling lands.
//
// Every verse was fetched from app/public/bible/kjv BEFORE a word was written,
// and SPINE_FRAGMENTS pins the exact span this lesson quotes for all 38
// references. Recorded as DR-1351.
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

const ID = 'sov69-at-his-day-or-at-evening';
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
 *
 * Ezekiel 33:6 is pinned TWICE — the sighting and the verdict are quoted as two
 * separate spans in the reader text, and both must be verbatim — but it is ONE
 * reference. `SPINE` below de-duplicates it.
 */
const SPINE_FRAGMENTS = {
  'Deuteronomy 24:15': 'At his day thou shalt give him his hire, neither shall the sun go down upon it; for he is poor, and setteth his heart upon it',
  'Leviticus 19:13': 'the wages of him that is hired shall not abide with thee all night until the morning',
  'Matthew 20:8':
    'So when even was come, the lord of the vineyard saith unto his steward, Call the labourers, and give them their hire, beginning from the last unto the first.',
  'Exodus 16:19': 'And Moses said, Let no man leave of it till the morning.',
  'Exodus 16:20': 'it bred worms, and stank',
  'Exodus 16:21': 'And they gathered it every morning, every man according to his eating: and when the sun waxed hot, it melted.',
  'Exodus 16:23': 'that which remaineth over lay up for you to be kept until the morning',
  'Exodus 16:24': 'it did not stink, neither was there any worm therein',
  'Genesis 41:35':
    'And let them gather all the food of those good years that come, and lay up corn under the hand of Pharaoh, and let them keep food in the cities.',
  'Genesis 41:49': 'And Joseph gathered corn as the sand of the sea, very much, until he left numbering; for it was without number.',
  'Genesis 41:32': 'And for that the dream was doubled unto Pharaoh twice; it is because the thing is established by God',
  'Ezekiel 33:6': 'But if the watchman see the sword come, and blow not the trumpet, and the people be not warned',
  'Ezekiel 33:6b': 'but his blood will I require at the watchman’s hand.',
  '2 Samuel 18:24': 'the watchman went up to the roof over the gate unto the wall, and lifted up his eyes, and looked, and behold a man running alone',
  '2 Samuel 18:29': 'I saw a great tumult, but I knew not what it was',
  '2 Samuel 18:31': 'And, behold, Cushi came; and Cushi said, Tidings, my lord the king',
  'Nehemiah 4:9': 'we made our prayer unto our God, and set a watch against them day and night',
  'Nehemiah 4:20': 'In what place therefore ye hear the sound of the trumpet, resort ye thither unto us: our God shall fight for us.',
  'Exodus 18:18':
    'Thou wilt surely wear away, both thou, and this people that is with thee: for this thing is too heavy for thee; thou art not able to perform it thyself alone.',
  'Exodus 18:21': 'place such over them, to be rulers of thousands, and rulers of hundreds, rulers of fifties, and rulers of tens',
  'Exodus 18:22':
    'every great matter they shall bring unto thee, but every small matter they shall judge: so shall it be easier for thyself, and they shall bear the burden with thee',
  'Hebrews 10:11': 'And every priest standeth daily ministering and offering oftentimes the same sacrifices, which can never take away sins:',
  'Hebrews 10:12': 'But this man, after he had offered one sacrifice for sins for ever, sat down on the right hand of God;',
  'Hebrews 10:14': 'For by one offering he hath perfected for ever them that are sanctified.',
  'Habakkuk 2:3':
    'For the vision is yet for an appointed time, but at the end it shall speak, and not lie: though it tarry, wait for it; because it will surely come, it will not tarry.',
  'Ecclesiastes 3:1': 'To every thing there is a season, and a time to every purpose under the heaven:',
  'Ecclesiastes 8:6': 'Because to every purpose there is time and judgment, therefore the misery of man is great upon him.',
  'Luke 12:42':
    'Who then is that faithful and wise steward, whom his lord shall make ruler over his household, to give them their portion of meat in due season?',
  'Jeremiah 8:20': 'The harvest is past, the summer is ended, and we are not saved.',
  'Proverbs 18:13': 'He that answereth a matter before he heareth it, it is folly and shame unto him.',
  'Proverbs 19:2': 'he that hasteth with his feet sinneth',
  'Proverbs 21:5': 'The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.',
  'John 1:29': 'Behold the Lamb of God, which taketh away the sin of the world.',
  'John 3:16': 'For God so loved the world, that he gave his only begotten Son',
  'Hebrews 1:8': 'But unto the Son he saith, Thy throne, O God, is for ever and ever',
  'Colossians 1:17': 'And he is before all things, and by him all things consist.',
  'Galatians 5:22': 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,',
  'Deuteronomy 6:7':
    'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
  'Hebrews 3:13': 'But exhort one another daily, while it is called To day',
};
/** The pinned FRAGMENT keys (39: Ezekiel 33:6 twice) and the REFERENCES (38). */
const FRAGMENT_KEYS = Object.keys(SPINE_FRAGMENTS);
const SPINE = FRAGMENT_KEYS.filter((k) => !k.endsWith('b'));
/** The counts this gate asserts about ITSELF, so an empty scan can never pass. */
const SPINE_COUNT = 38;
const FRAGMENT_COUNT = 39;

describe('sov69 — the lesson is mounted and is the week it says it is', () => {
  it('is mounted as week 69, last in the series, with every reader field present', () => {
    expect(M, `${ID} is not mounted`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(m.id.match(/^sov(\d+)-/)[1]));
    // FORWARD-SAFE AND GAP-SAFE ON PURPOSE (DR-1316 / DR-1338): a lesson gate
    // may not claim to be the last lesson for ever, and it may not claim a
    // sibling's week is absent. What is durably true: week 69 exists, exactly
    // once, it is THIS lesson, it is the highest mounted at the time of writing,
    // it sits last in the array, and the weeks run contiguous one through 68.
    expect(weeks).toContain(69);
    expect(weeks.filter((w) => w === 69).length, 'week 69 is mounted twice').toBe(1);
    // POSITION IS PINNED WITHOUT CLAIMING TO BE LAST (DR-1316). sov68's gate
    // asserts `MODULES[length - 1].id === ITS own id`, which is the exact fault
    // DR-1316 is named for, and which THIS lesson's arrival turns red — reported
    // to the orchestrator rather than edited here (it is a neighbour's gate).
    // What is durably true instead, and stays true when week 70 lands: the weeks
    // ascend and run contiguous, so a lesson's INDEX is its week minus one.
    expect(
      SOVEREIGN_AI_MODULES.findIndex((m) => m.id === ID),
      'sov69 is not at the index its week number requires'
    ).toBe(68);
    expect(Math.max(...weeks)).toBeGreaterThanOrEqual(69);
    for (let w = 1; w <= 68; w += 1) expect(weeks, `week ${w} is missing`).toContain(w);
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

describe('sov69 — every verse came from the corpus on disk, not from memory', () => {
  it(`pins all ${SPINE_COUNT} references in ${FRAGMENT_COUNT} spans, and both counts are asserted so an empty scan cannot pass`, () => {
    expect(FRAGMENT_KEYS.length, 'the pinned spans changed count without this gate being updated').toBe(FRAGMENT_COUNT);
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
    for (const key of FRAGMENT_KEYS) {
      const ref = key.replace(/b$/, '');
      const vt = verseText(ref);
      expect(vt, `${ref} is not in the corpus on disk`).toBeTruthy();
      expect(vt.includes(SPINE_FRAGMENTS[key]), `${key} is NOT verbatim in its own verse`).toBe(true);
      checked += 1;
    }
    expect(checked, 'the scan ran over nothing').toBe(FRAGMENT_COUNT);
  });

  it('every reference in anchor.ref is actually QUOTED in the adult lesson, with its citation', () => {
    let checked = 0;
    for (const key of FRAGMENT_KEYS) {
      const ref = key.replace(/b$/, '');
      expect(M.lesson.includes(SPINE_FRAGMENTS[key]), `${key} is listed but its words are not in the lesson`).toBe(true);
      expect(M.lesson.includes(`(${ref})`), `${ref} is quoted without its citation`).toBe(true);
      checked += 1;
    }
    expect(checked).toBe(FRAGMENT_COUNT);
  });

  it('PROVEN TO CATCH: bending any one pinned fragment by a single word breaks the corpus check', () => {
    let caught = 0;
    for (const key of FRAGMENT_KEYS) {
      const ref = key.replace(/b$/, '');
      const bent = SPINE_FRAGMENTS[key].replace(/\b([a-z]{4,})\b/, 'xqzzy');
      expect(bent, `${key} could not be bent`).not.toBe(SPINE_FRAGMENTS[key]);
      expect(verseText(ref).includes(bent), `a bent ${key} was NOT caught`).toBe(false);
      caught += 1;
    }
    expect(caught, 'the proof ran over nothing').toBe(FRAGMENT_COUNT);
  });

  it('no verse is quoted with a straight apostrophe where the corpus has a curly one (DR-1273)', () => {
    for (const s of allStrings()) {
      const bad = s.match(/[a-z]'(?:s|t|d|ll|re|ve)\b/g) || [];
      for (const hit of bad) {
        // our own prose may use a straight apostrophe; a QUOTED span may not,
        // because the corpus writes it curly. Only flag inside quotations.
        const i = s.indexOf(hit);
        const openQuotes = (s.slice(0, i).match(/"/g) || []).length;
        expect(openQuotes % 2, `straight apostrophe inside a quotation: ...${s.slice(Math.max(0, i - 40), i + 20)}...`).toBe(0);
      }
    }
  });
});

describe('sov69 — the Word is quoted, never rewritten', () => {
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

describe('sov69 — WHO TAUGHT: NOBODY, and the provenance is carried', () => {
  it('all five reader places say nobody taught it', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(/NOBODY/.test(txt), `${place} does not say WHO TAUGHT: NOBODY`).toBe(true);
    }
  });

  it('never credits Bishop Gwin, and never uses the bare phrase "the teacher" (DR-0719)', () => {
    const blob = allStrings().join('\n');
    expect(/Gwin/i.test(blob), 'a source that names nobody must not credit Bishop Gwin').toBe(false);
    expect(/\bthe teacher\b/i.test(blob), 'the bare phrase "the teacher" is forbidden').toBe(false);
  });

  it('carries the thread, the forward time, and BOTH halves of his one line', () => {
    const blob = allStrings().join('\n');
    expect(blob.includes('1a16401bf7c5898d'), 'the thread id is not carried').toBe(true);
    expect(blob.includes('15:21:39'), 'the forward time is not carried').toBe(true);
    expect(blob.includes('Lessons - and potential systemic use?'), 'HIS line is not quoted').toBe(true);
    // His line is TWO instructions. The lesson must say so, and must answer both.
    expect(/TWO instructions|two instructions/.test(blob), 'the lesson does not name his line as two instructions').toBe(true);
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(/newsletter/i.test(txt), `${place} never says the source was a newsletter`).toBe(true);
    }
  });

  it('the advertisement in the send is IGNORED, said plainly, and the vendor is never named', () => {
    const blob = allStrings().join('\n');
    // The pitch was for a named product from a named vendor. Neither appears.
    expect(/\bAI Studio\b/.test(blob), 'the advertised product is named').toBe(false);
    expect(/\bPrecisely\b/.test(blob), 'the advertising vendor is named').toBe(false);
    // And the lesson says, in its own words, that it ignored it and why.
    expect(/advertisement/i.test(blob), 'the lesson never mentions the advertisement').toBe(true);
    expect(/ignored/i.test(blob), 'the lesson never says the advertisement was ignored').toBe(true);
    for (const place of ['adult', 'child', 'youth', 'teen', 'senior']) {
      const txt = PLACES()[place];
      if (place === 'child') continue; // the child band carries the teaching, not the editorial note
      expect(/advertisement/i.test(txt), `${place} does not name the advertisement`).toBe(true);
    }
  });
});

describe('sov69 — trust but verify: the tiers, the blocked roads quoted, and what checking changed (DR-0190 §5 / DR-0100)', () => {
  it('every place but the child band carries all three tiers', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue; // the child band carries the teaching, not the audit
      expect(/DOCUMENTED/.test(txt), `${place} has no documented tier`).toBe(true);
      expect(/ATTRIBUTED/.test(txt), `${place} has no attributed tier`).toBe(true);
      expect(/UNCHECKED/.test(txt), `${place} has no unchecked tier`).toBe(true);
    }
  });

  it('BOTH refused roads are quoted word for word, never described (DR-0076 §8)', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue;
      expect(txt.includes('getaddrinfo ENOTFOUND kafka.apache.org'), `${place} does not quote the first refusal`).toBe(true);
      expect(txt.includes('GitHub access to this repository is not enabled for this session'), `${place} does not quote the second refusal`).toBe(true);
    }
    const blob = allStrings().join('\n');
    // A blocked road NEVER reads as a verified claim.
    expect(/blocked road/i.test(blob), 'the lesson never names the blocked road as such').toBe(true);
    expect(
      /not a quotation from the builders|not a quote from the builders/i.test(blob),
      'the lesson never says the terms are not the maintainers’ own words'
    ).toBe(true);
    // Third-party blogs are not a primary source and were not used (DR-0190 §1).
    expect(/blogs/i.test(blob), 'the lesson never says what the search returned').toBe(true);
  });

  it('what the checking CHANGED is stated, and the over-claim it avoided is named', () => {
    // DR-0100: do not UNDER-claim either. The article's careful phrasing checked
    // out STRONGER than most writing on the subject, and the lesson says so.
    expect(/CAREFUL AND CORRECT/.test(M.lesson), 'the adult lesson does not state the verdict of the checking').toBe(true);
    expect(M.lesson.includes('over-promises it as exactly-once delivery'), 'the common over-claim is not named').toBe(true);
    expect(/each effect to appear once|each EFFECT appearing once/i.test(M.lesson), 'the effect-versus-delivery distinction is not carried').toBe(true);
    // And the one claim we could check ourselves, measured rather than repeated.
    expect(M.lesson.includes('fourteen hours and fifty-nine minutes'), 'the arithmetic we checked is not shown').toBe(true);
  });
});

describe('sov69 — his SECOND instruction is answered on our own house, with measured numbers', () => {
  it('names our own mismatch rather than giving an opinion about it', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue; // the child band teaches the Word, not our ops
      expect(/forty-two live subscriptions/i.test(txt), `${place} omits the continuous tier measurement`).toBe(true);
      expect(/one hundred (and )?forty-four|a hundred and forty-four/.test(txt), `${place} omits what the witness asks for`).toBe(true);
      expect(/six hundred (and )?sixteen minutes/.test(txt), `${place} omits the worst measured gap`).toBe(true);
      expect(/thirty-nine/.test(txt), `${place} omits the timer-driven lane count`).toBe(true);
    }
    const blob = allStrings().join('\n');
    expect(/Unknown freshness never reads as fresh/.test(blob), 'the recorded fix is not carried').toBe(true);
    // And the part we could NOT reach is named rather than guessed (DR-0076 §8).
    expect(/could not reach/i.test(blob), 'the unreachable part of the answer is not named').toBe(true);
  });
});

describe('sov69 — the four bands, and TALK ABOUT IT TOGETHER everywhere', () => {
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

  it('explains every hard term in plain words at or before its first use, in EVERY reader place (DR-1367)', () => {
    // WIDENED FROM `M.lesson` ALONE. A reader reads ONE band, so a band is not
    // a lesser copy of the adult field — it is the whole lesson for whoever
    // opens it, which is the reasoning DR-0795 already applied to the TALK
    // block. MEASURED 2026-11-06 on sov71: its gate checked the adult field
    // only, read green, and the catalog-wide `the-plain-meaning-comes-first`
    // gate caught `assay` in its senior band — the first entry in HARD_TERMS
    // and the very word on Darrell's phone that founded DR-0521. A per-lesson
    // gate that checks one field leaks band-only defects into slower,
    // catalog-wide gates, where they surface as a shrink-only debt rising
    // rather than as this lesson's own failure.
    //
    // THIS LESSON WAS CLEAN WHEN WIDENED: 0 faults across all six places,
    // measured before the change. So this closes a latent hole by machinery
    // instead of leaving it closed by luck.
    const places = { lesson: M.lesson, bigIdea: M.bigIdea, ...(M.levels || {}) };
    for (const [where, text] of Object.entries(places)) {
      if (typeof text !== 'string') continue;
      expect(termFaults(text), `${where}: ${JSON.stringify(termFaults(text))}`).toEqual([]);
    }
  });

  it('and the terms THIS lesson introduces are glossed at first use (DR-0521)', () => {
    // The four terms THIS lesson introduces are glossed in the same sentence as
    // their first use, which is what DR-0521 requires and what the registry's
    // HARD_TERMS list cannot know about a term it does not carry. Adding these
    // to that list is NOT done here: `idempotent` already appears un-glossed in
    // a neighbouring lesson, so a registry entry would turn a lesson this build
    // never touched red. Named in DR-1351 with `re-review: 2026-11-19`.
    expect(/LATENCY just means the delay/.test(M.lesson), 'latency is used before it is glossed').toBe(true);
    expect(/A BATCH MEANING SIMPLY THAT YOU LET THE WORK PILE UP/.test(M.lesson), 'batch is used before it is glossed').toBe(true);
    expect(
      /BACKPRESSURE - WHICH IS ONLY A NAME FOR THINGS ARRIVING FASTER THAN THEY CAN BE HANDLED/.test(M.lesson),
      'backpressure is used before it is glossed'
    ).toBe(true);
    expect(/streaming meaning the opposite of a pile/.test(M.lesson), 'streaming is used before it is glossed').toBe(true);
    // PROVEN TO CATCH: the gloss must PRECEDE the term, not follow it.
    const at = (s) => M.lesson.indexOf(s);
    expect(at('LATENCY just means the delay')).toBeLessThan(at('latency requirement'));
    expect(at('A BATCH MEANING SIMPLY')).toBeLessThan(at('That is a batch job'));
  });

  it('TALK ABOUT IT TOGETHER is on the lesson AND on every band, in all three directions (DR-0733 / DR-0795)', () => {
    expect(hasAllThree(M), 'the module pooled does not carry all three directions').toBe(true);
    expect(placesMissingDirections(M), `places missing directions: ${JSON.stringify(placesMissingDirections(M))}`).toEqual([]);
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(txt.includes('TALK ABOUT IT TOGETHER'), `${place} has no TALK block`).toBe(true);
      expect(/Deuteronomy 6:7/.test(txt), `${place} omits the four places`).toBe(true);
      expect(/one friend this week/i.test(txt), `${place} omits the friend rhythm`).toBe(true);
      expect(/listen all the way (?:to the end|through)|listen all the way/i.test(txt), `${place} omits listening to the end`).toBe(true);
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

describe('sov69 — a true story names whose life it was, so neither story claims to be one (DR-1123)', () => {
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

describe('sov69 — PROVEN TO CATCH, place by place', () => {
  const everyPlace = (re) => (p) => Object.values(p).every((v) => re.test(v));
  it('breaking any load-bearing marker, at every site it appears, is caught', () => {
    const rows = [
      ['NOBODY', 'SOMEBODY', everyPlace(/NOBODY/), 'the DR-0719 who-taught marker'],
      ['TALK ABOUT IT TOGETHER', 'ONE LAST THING', everyPlace(/TALK ABOUT IT TOGETHER/), 'the DR-0733 block'],
      ['Deuteronomy 6:7', 'the Word', everyPlace(/Deuteronomy 6:7/), 'the TALK rhythm'],
      ['Lamb of Yahweh', 'Lamb', everyPlace(/Lamb of Yahweh/), 'the DR-0210 confession'],
      ['Eternal Son of Yahweh', 'Son', everyPlace(/Eternal Son of Yahweh/), 'the DR-0210 Son confession'],
      ['At his day', 'At some point', everyPlace(/At his day/), 'the week’s own hinge'],
      ['setteth his heart upon it', 'wanted it', everyPlace(/setteth his heart upon it/), 'the reason the deadline exists'],
      ['he that hasteth with his feet sinneth', 'hurrying is a sin', everyPlace(/he that hasteth with his feet sinneth/), 'the haste correction'],
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
      const holders = Object.entries(p)
        .filter(([, v]) => v.includes(slice))
        .map(([k]) => k);
      expect(holders, `"${slice.slice(0, 40)}" is not unique to ${place}`).toEqual([place]);
    };
    uniqueCarrier('Worms! It went bad.', 'child');
    uniqueCarrier('A blocked road never gets to sound like a checked fact.', 'youth');
    uniqueCarrier('The trap is assuming the second is merely the first operating on a faster clock.', 'teen');
    uniqueCarrier("Teach this as the course's week on THE LATENESS THAT IS A SIN", 'senior');
    uniqueCarrier('Three things stop, keep running, and are required of you', 'adult');
  });
});

describe('sov69 — shared ground is MEASURED, never claimed (DR-1317)', () => {
  // This is a measurement and not a veto. It names the other holder for every
  // reference this lesson shares, and it asserts NOTHING about what another
  // lesson may stand on. A verse is never spent.
  //
  // Measured 2026-11-05 on `origin/main` 3e9efd896, by grep over the catalog's
  // own course and class modules (app/src/lib/*-class.js, *-course.js), with
  // app/public/bible/xref/ excluded because it is the cross-reference index and
  // not taught content.
  const SHARED_AND_WHO_ELSE_HOLDS_IT = {
    'Deuteronomy 24:15': 'living-lessons, rent-to-own-business, world-issues, history, property-principle and another sovereign-ai week',
    'Leviticus 19:13': 'the same six modules as Deuteronomy 24:15 — the wage pair travels together',
    'Matthew 20:8': 'world-issues (the vineyard read for its wage, not for its window)',
    'Exodus 16:19': 'another sovereign-ai week (bread that would not keep)',
    'Exodus 16:20': 'living-lessons and another sovereign-ai week',
    'Exodus 16:21': 'another sovereign-ai week',
    'Exodus 16:23': 'another sovereign-ai week (the announced pause)',
    'Exodus 16:24': 'another sovereign-ai week (the portion that did not spoil)',
    'Genesis 41:35': 'living-lessons, world-issues, banking, business-research, investing and another sovereign-ai week',
    'Genesis 41:49': 'infrastructure, banking and another sovereign-ai week',
    'Genesis 41:32': 'another sovereign-ai week',
    'Ezekiel 33:6': 'world-issues, project-management, software-project-management and another sovereign-ai week',
    '2 Samuel 18:24': 'another sovereign-ai week',
    'Nehemiah 4:9': 'infrastructure, living-lessons, world-issues, project-management and another sovereign-ai week',
    'Nehemiah 4:20': 'another sovereign-ai week',
    'Exodus 18:18': 'living-lessons, project-management and another sovereign-ai week',
    'Exodus 18:21': 'living-lessons, mathematics, project-management and another sovereign-ai week',
    'Exodus 18:22': 'living-lessons, project-management and another sovereign-ai week',
    'Hebrews 10:12': 'living-lessons',
    'Hebrews 10:14': 'living-lessons',
    'Habakkuk 2:3': 'living-lessons, world-issues and another sovereign-ai week',
    'Ecclesiastes 3:1':
      'living-lessons, world-issues, healthy-living, made-in-time, project-management, software-project-management, word-out and another sovereign-ai week',
    'Luke 12:42': 'infrastructure, management-stewardship and another sovereign-ai week',
    'Jeremiah 8:20': 'living-lessons and another sovereign-ai week',
    'Proverbs 18:13': 'eleven modules across the library, including development, living-lessons and world-issues',
    'Proverbs 19:2': 'living-lessons, business-research, historical-research and another sovereign-ai week',
    'Proverbs 21:5': 'ten modules across the library, including sound-board, datasystems and buying-terms',
    'John 1:29': 'the standing Godhead confession',
    'John 3:16': 'the standing Godhead confession',
    'Hebrews 1:8': 'the standing Godhead confession',
    'Colossians 1:17': 'the standing Godhead confession',
    'Galatians 5:22': 'the standing growth measure',
    'Deuteronomy 6:7': 'the standing growth measure',
    'Hebrews 3:13': 'the standing growth measure',
  };
  /**
   * References the TAUGHT CORPUS had never opened when this was written. Three
   * of the four appear in no file of app/src or docs/decisions at all; Hebrews
   * 10:11 appears only in the Godhead reference data (who-he-is-rules.js,
   * who-he-is-data.json) and in no lesson.
   */
  const MEASURED_UNTAUGHT_WHEN_WRITTEN = ['2 Samuel 18:29', '2 Samuel 18:31', 'Hebrews 10:11', 'Ecclesiastes 8:6'];

  it('the census covers every reference exactly once, and the two halves add up', () => {
    const shared = Object.keys(SHARED_AND_WHO_ELSE_HOLDS_IT);
    const all = [...shared, ...MEASURED_UNTAUGHT_WHEN_WRITTEN].sort();
    expect(all.length, 'the census double-counts or misses a reference').toBe(SPINE_COUNT);
    expect(all).toEqual([...SPINE].sort());
    expect(MEASURED_UNTAUGHT_WHEN_WRITTEN.length, 'the untaught count changed without the record being updated').toBe(4);
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
      expect(/\bweek (?:four|twenty|forty|forty-eight|sixty-eight)\b/i.test(txt), `${place} points a reader at another week`).toBe(false);
    }
  });

  it('the landing is this lesson’s own, and is not a sibling’s (proved from the landing, not the headline)', () => {
    // sov4's landing is the HARDWARE CEILING of a local model.
    // sov24's landing is the MIGRATION CRAFT of changing an engine in flight.
    // sov48's landing is CACHE INVALIDATION — bread that must not be kept.
    // sov68's landing is the ANNOUNCED PAUSE — what stops, what keeps running.
    // THIS lesson's landing is THE LATENCY REQUIREMENT: who sets the deadline,
    // and what lower delay costs.
    const blob = allStrings().join('\n');
    expect(M.bigIdea.includes('WHEN THE RESULT MUST BE USEFUL TO THE PERSON WAITING ON IT'), 'the lesson does not state its own standard').toBe(true);
    expect(/Choosing between them is an engineering question\. Being late is a sin question\./.test(M.lesson), 'the lesson does not carry its own hinge').toBe(
      true
    );
    expect(/[Tt]he window closes INSIDE the deadline/.test(M.lesson), 'the lesson does not carry why the batch is lawful').toBe(true);
    // And it does NOT teach the sibling landings.
    expect(/Xeon|GPU speed/i.test(blob), 'this lesson teaches sov4’s hardware-ceiling landing').toBe(false);
    expect(/dual-write|cut-over/i.test(blob), 'this lesson teaches sov24’s migration landing').toBe(false);
    expect(/No action required/.test(blob), 'this lesson teaches sov68’s no-action landing').toBe(false);
  });
});

describe('sov69 — the date is derived, never typed', () => {
  it('lesson-dates records this lesson, derived from git and not from the working tree', () => {
    const d = lessonCreatedDay('sovereign-ai', ID);
    expect(d, `${ID} has no lesson-dates entry; run npm run lesson-dates`).toBeTruthy();
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
