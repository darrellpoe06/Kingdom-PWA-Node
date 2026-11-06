// =============================================================================
// sovereign-ai-sov70-verses — the gate for sov70, "Every one over against his house"
// =============================================================================
// WHAT THIS LESSON IS, AND WHAT IT DELIBERATELY IS NOT.
//
// Gmail thread `1a1644a252304d70`, one message, forwarded 2026-10-22 17:13:47
// UTC, subject beginning `FW: Why Distributed Systems Prefer Independence over
// Coordination` (ByteByteGo). HIS LINE above the forwarded header is one word:
// "Lesson".
//
// THE SEND IS A PAYWALLED PREVIEW AND THE ARTICLE WAS NEVER READ, and that fact
// governs every case below. The send carries the marker "Preview" in its own
// header, gives THREE setup paragraphs, lists FOUR section headings it means to
// cover — why coordination becomes a challenge, how coordination increases in a
// system, how to reduce coordination, strategies to handle coordination — and
// then stops at the first heading into an advertisement. So the lesson carries
// the SUBJECT and the author's framing of the problem, and NOT one line of
// their argument. The cases here assert that all five reader places SAY SO, that
// nothing is attributed to ByteByteGo beyond the three paragraphs literally
// present, and that the headline's assertion of a PREFERENCE for independence
// is named as the newsletter's framing rather than a measured finding. That is
// DR-0076 §8: a blocked road never reads as a verified claim.
//
// THE LANDING IS THE COORDINATION BUDGET: what must wait on agreement, who pays
// for the waiting, and where the Word puts the one channel everybody listens to.
// Nehemiah 3 is a build log whose assignment rule is PROXIMITY — party after
// party set at the stretch in front of their own door — finished in fifty-two
// days (6:15) with no verse anywhere recording a crew idle on a decision. The
// agreement was spent ONCE, up front, in the cutting. And the one coordination
// point is named on purpose: builders "separated upon the wall, one far from
// another" (4:19), one trumpeter beside the leader (4:18), one rule everybody
// already knew (4:20).
//
// THE ADVERTISEMENT IS IGNORED ON PURPOSE. The send carried one vendor pitch for
// a password manager. The standing rule is that an ad is read only when it
// relates to the lesson; a password manager has nothing to do with how much of a
// work must wait on agreement. So it is ignored, the lesson SAYS it was ignored
// and why, and the cases below assert the vendor and product names appear
// nowhere in the module.
//
// WHERE THE NEIGHBOURS LAND, read from their own landing and not from a verse
// count, which is the measure DR-1317 removed:
//   sov40 carries Nehemiah 3:1 for TRACEABILITY — no worker is untraceable.
//   sov66 carries Nehemiah 3:28 for SECURITY — the hole that was always open,
//         reading "over against his house" as the shape of fast, honest repair
//         of one's OWN exposure.
//   sov69 carries Nehemiah 4:9 / 4:18 / 4:20 and Exodus 18:18 / 18:21 / 18:22
//         for LATENCY — how quickly a result must be useful, the watch read as
//         a latency REQUIREMENT. THIS lesson reads the same trumpet as the
//         SINGLE COORDINATION POINT inside an otherwise independent build: one
//         channel, reserved for the one event that needs everybody, so nothing
//         else has to wait on anybody. Same two verses, different question.
//
// A VERSE IS NEVER SPENT (DR-1317). Not one reading was dropped here for a
// collision, and the census at the foot of this file is a MEASUREMENT that names
// the other holder — never a veto.
//
// EVERY LESSON STANDS ALONE AND WHOLE. No reader text points at another lesson;
// the comparison above lives here and in DR-1357, where a reviewer reads it and
// a reader does not.
//
// WHO TAUGHT (DR-0719): NOBODY. A forwarded technical newsletter is not a
// recording. All five reader places say so; the cases below forbid the bare
// phrase "the teacher" and forbid crediting Bishop Gwin for a send that names
// nobody. A quiz distractor naming him was removed for exactly that reason.
//
// STORIES ARE PARABLES, NOT TESTIMONIES (DR-1123). Both stories were written to
// teach and no real person's life is behind either, so neither wears the label
// that tells a reader "a true story I lived." The case below pins that.
//
// WEEK 70, AND THE CONTIGUITY CLAIM IS FORWARD-SAFE. The array mounts 70 modules
// with no gaps. The cases assert week 70 exists exactly once, is this lesson,
// sits at the index its week number requires, and that the weeks run contiguous
// from one through 69 — never that this is the LAST lesson, which is the exact
// fault DR-1316 is named for and which sov69's arrival turned red in sov68's
// gate. A gate may not claim to be last for ever.
//
// Every verse was fetched from app/public/bible/kjv BEFORE a word was written,
// and SPINE_FRAGMENTS pins the exact span this lesson quotes for all 48
// references. Recorded as DR-1357.
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

const ID = 'sov70-every-one-over-against-his-house';
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
  'Nehemiah 3:5': 'And next unto them the Tekoites repaired; but their nobles put not their necks to the work of their Lord.',
  'Nehemiah 3:10': 'And next unto them repaired Jedaiah the son of Harumaph, even over against his house.',
  'Nehemiah 3:12': 'And next unto him repaired Shallum the son of Halohesh, the ruler of the half part of Jerusalem, he and his daughters.',
  'Nehemiah 3:23': 'After him repaired Benjamin and Hashub over against their house.',
  'Nehemiah 3:28': 'From above the horse gate repaired the priests, every one over against his house.',
  'Nehemiah 3:30': 'After him repaired Hananiah the son of Shelemiah, and Hanun the sixth son of Zalaph, another piece.',
  'Nehemiah 4:6': 'So built we the wall; and all the wall was joined together unto the half thereof: for the people had a mind to work.',
  'Nehemiah 4:18': 'For the builders, every one had his sword girded by his side, and so builded. And he that sounded the trumpet was by me.',
  'Nehemiah 4:19': 'The work is great and large, and we are separated upon the wall, one far from another.',
  'Nehemiah 4:20': 'In what place therefore ye hear the sound of the trumpet, resort ye thither unto us: our God shall fight for us.',
  'Nehemiah 6:3': 'I am doing a great work, so that I cannot come down: why should the work cease, whilst I leave it, and come down to you?',
  'Nehemiah 6:15': 'So the wall was finished in the twenty and fifth day of the month Elul, in fifty and two days.',
  '1 Corinthians 14:8': 'For if the trumpet give an uncertain sound, who shall prepare himself to the battle?',
  'Exodus 18:14': 'why sittest thou thyself alone, and all the people stand by thee from morning unto even?',
  'Exodus 18:17': 'The thing that thou doest is not good.',
  'Exodus 18:18':
    'Thou wilt surely wear away, both thou, and this people that is with thee: for this thing is too heavy for thee; thou art not able to perform it thyself alone.',
  'Exodus 18:21': 'place such over them, to be rulers of thousands, and rulers of hundreds, rulers of fifties, and rulers of tens',
  'Exodus 18:22':
    'every great matter they shall bring unto thee, but every small matter they shall judge: so shall it be easier for thyself, and they shall bear the burden with thee',
  'Exodus 18:23': 'then thou shalt be able to endure, and all this people shall also go to their place in peace.',
  'Numbers 11:14': 'I am not able to bear all this people alone, because it is too heavy for me.',
  'Numbers 11:16': 'Gather unto me seventy men of the elders of Israel',
  'Numbers 11:17': 'they shall bear the burden of the people with thee, that thou bear it not thyself alone.',
  'Acts 6:2': 'It is not reason that we should leave the word of God, and serve tables.',
  'Acts 6:3': 'look ye out among you seven men of honest report, full of the Holy Ghost and wisdom, whom we may appoint over this business.',
  'Acts 6:4': 'But we will give ourselves continually to prayer, and to the ministry of the word.',
  'Acts 6:7': 'And the word of God increased; and the number of the disciples multiplied in Jerusalem greatly',
  '1 Corinthians 12:14': 'For the body is not one member, but many.',
  '1 Corinthians 12:18': 'But now hath God set the members every one of them in the body, as it hath pleased him.',
  '1 Corinthians 12:21': 'And the eye cannot say unto the hand, I have no need of thee: nor again the head to the feet, I have no need of you.',
  '1 Corinthians 12:25': 'That there should be no schism in the body; but that the members should have the same care one for another.',
  '1 Corinthians 12:27': 'Now ye are the body of Christ, and members in particular.',
  'Romans 12:4': 'For as we have many members in one body, and all members have not the same office:',
  'Romans 12:5': 'So we, being many, are one body in Christ, and every one members one of another.',
  'Ephesians 4:16':
    'the whole body fitly joined together and compacted by that which every joint supplieth, according to the effectual working in the measure of every part',
  'Galatians 6:4': 'But let every man prove his own work, and then shall he have rejoicing in himself alone, and not in another.',
  'Galatians 6:5': 'For every man shall bear his own burden.',
  'Genesis 11:1': 'And the whole earth was of one language, and of one speech.',
  'Genesis 11:6':
    'Behold, the people is one, and they have all one language; and this they begin to do: and now nothing will be restrained from them, which they have imagined to do.',
  'Genesis 11:7': 'Go to, let us go down, and there confound their language, that they may not understand one another’s speech.',
  'Genesis 11:8': 'So the LORD scattered them abroad from thence upon the face of all the earth: and they left off to build the city.',
  '1 Corinthians 14:33': 'For God is not the author of confusion, but of peace, as in all churches of the saints.',
  'John 1:29': 'Behold the Lamb of God, which taketh away the sin of the world.',
  'John 3:16': 'For God so loved the world, that he gave his only begotten Son',
  'Hebrews 1:8': 'But unto the Son he saith, Thy throne, O God, is for ever and ever',
  'Colossians 1:17': 'And he is before all things, and by him all things consist.',
  'Galatians 5:22': 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,',
  'Deuteronomy 6:7':
    'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
  'Hebrews 3:13': 'But exhort one another daily, while it is called To day',
};
/** The pinned references, all 48. The counts this gate asserts about ITSELF, so an empty scan can never pass. */
const SPINE = Object.keys(SPINE_FRAGMENTS);
const SPINE_COUNT = 48;

describe('sov70 — the lesson is mounted and is the week it says it is', () => {
  it('is mounted as week 70, at the index its week requires, with every reader field present', () => {
    expect(M, `${ID} is not mounted`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(m.id.match(/^sov(\d+)-/)[1]));
    // FORWARD-SAFE AND GAP-SAFE ON PURPOSE (DR-1316 / DR-1338 / DR-1351). This
    // gate does NOT assert `MODULES[length - 1].id === ID`. sov68's gate made
    // exactly that claim and sov69's arrival turned it red. What is durably
    // true, and stays true when week 71 lands: week 70 exists, exactly once, it
    // is THIS lesson, it sits at the index its week number requires, and the
    // weeks run contiguous one through 69.
    expect(weeks).toContain(70);
    expect(weeks.filter((w) => w === 70).length, 'week 70 is mounted twice').toBe(1);
    expect(
      SOVEREIGN_AI_MODULES.findIndex((m) => m.id === ID),
      'sov70 is not at the index its week number requires'
    ).toBe(69);
    expect(Math.max(...weeks)).toBeGreaterThanOrEqual(70);
    for (let w = 1; w <= 69; w += 1) expect(weeks, `week ${w} is missing`).toContain(w);
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

describe('sov70 — every verse came from the corpus on disk, not from memory', () => {
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

  it('no verse is quoted with a straight apostrophe where the corpus has a curly one (DR-1273)', () => {
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

describe('sov70 — the Word is quoted, never rewritten', () => {
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

describe('sov70 — WHO TAUGHT: NOBODY, and the provenance is carried', () => {
  it('all five reader places say nobody taught it', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(/NOBODY/.test(txt), `${place} does not say WHO TAUGHT: NOBODY`).toBe(true);
      expect(/newsletter/i.test(txt), `${place} never says the source was a newsletter`).toBe(true);
    }
  });

  it('never credits Bishop Gwin, and never uses the bare phrase "the teacher" (DR-0719)', () => {
    const blob = allStrings().join('\n');
    expect(/Gwin/i.test(blob), 'a source that names nobody must not credit Bishop Gwin').toBe(false);
    expect(/\bthe teacher\b/i.test(blob), 'the bare phrase "the teacher" is forbidden').toBe(false);
  });

  it('carries the thread, the forward time, and his one word', () => {
    const blob = allStrings().join('\n');
    expect(blob.includes('1a1644a252304d70'), 'the thread id is not carried').toBe(true);
    expect(blob.includes('17:13:47'), 'the forward time is not carried').toBe(true);
    expect(/one word/i.test(blob), 'his one word is not named as one word').toBe(true);
  });

  it('the advertisement in the send is IGNORED, said plainly in every place, and the vendor is never named', () => {
    const blob = allStrings().join('\n');
    // The pitch was for a named product from a named vendor. Neither appears.
    expect(/\bProton\b/i.test(blob), 'the advertising vendor is named').toBe(false);
    expect(/Proton Pass/i.test(blob), 'the advertised product is named').toBe(false);
    expect(/proton\.me/i.test(blob), 'the advertiser’s domain is carried').toBe(false);
    // And every reader place says, in its own words, that it was ignored.
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(/advertisement/i.test(txt), `${place} does not name the advertisement`).toBe(true);
      expect(/ignored/i.test(txt), `${place} does not say the advertisement was ignored`).toBe(true);
    }
  });
});

describe('sov70 — WE NEVER READ THE ARTICLE, and every reader place says so (DR-0076 §8)', () => {
  it('all five places state plainly that the article was never read', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(/never read the article/i.test(txt), `${place} does not say the article was never read`).toBe(true);
    }
  });

  it('the four non-child places carry the paywall marker and the counts that prove the stub', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      // The child band carries the same fact in plain words ("locked", "pay
      // money", "only the first page or two") rather than the marker, which is
      // a reading-level decision and not a weaker claim.
      if (place === 'child') continue;
      expect(/\bPreview\b/.test(txt), `${place} does not carry the Preview marker`).toBe(true);
      expect(/three (?:\w+ )?paragraphs/i.test(txt), `${place} does not carry the paragraph count`).toBe(true);
      expect(
        /four section headings|four headings|four promised section|four sections|four things it plan/i.test(txt),
        `${place} does not carry the section count`
      ).toBe(true);
    }
  });

  it('the headline’s PREFERENCE claim is attributed to the newsletter and never asserted as a finding', () => {
    const blob = allStrings().join('\n');
    expect(
      /the newsletter's framing rather than|the newsletter’s framing rather than|belongs to the newsletter rather than/i.test(blob),
      'the headline claim is not named as the newsletter’s framing'
    ).toBe(true);
    // The lesson must say the body never argues the assertion.
    expect(
      /never argues (it|the assertion)|nothing (left )?in the body argues|the body never argues/i.test(blob),
      'the lesson never points out that the surviving body does not argue its own headline'
    ).toBe(true);
  });

  it('what the send LITERALLY says is quoted, and the three waiting examples are carried', () => {
    // The only things attributable to ByteByteGo: the three paragraphs present.
    expect(M.lesson.includes('coordination as the talking between components'), 'the source’s own definition is not quoted').toBe(true);
    expect(M.lesson.includes('waiting for a lock'), 'the third waiting example is missing').toBe(true);
    expect(M.lesson.includes('acknowledgment from its replicas'), 'the second waiting example is missing').toBe(true);
  });
});

describe('sov70 — trust but verify: the tiers, the blocked roads quoted, and what checking changed (DR-0190 §5 / DR-0100)', () => {
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
      expect(txt.includes('curl: (56) CONNECT tunnel failed, response 403'), `${place} does not quote the proxy refusal`).toBe(true);
      expect(txt.includes('getaddrinfo ENOTFOUND kafka.apache.org'), `${place} does not quote the resolver refusal`).toBe(true);
      expect(txt.includes('amturing.acm.org'), `${place} does not name the host that held the primary paper`).toBe(true);
      // A mediated read NEVER reads as a direct one.
      expect(/mediated read/i.test(txt), `${place} does not label the read as mediated`).toBe(true);
    }
    const blob = allStrings().join('\n');
    // The founding literature was NOT reached and is cited for nothing.
    expect(/not reached at all|was not reached/i.test(blob), 'the unreached literature is not named as unreached').toBe(true);
    expect(/Lamport/.test(blob), 'the unreached primary author is not named').toBe(true);
  });

  it('the two primary sources that WERE reached are named with what they actually state', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue;
      expect(/Kafka/.test(txt), `${place} omits the first primary source`).toBe(true);
      expect(/ZooKeeper/.test(txt), `${place} omits the second primary source`).toBe(true);
    }
    // The load-bearing statements, in the adult lesson, from the projects' own docs.
    expect(M.lesson.includes('each partition is consumed by exactly one consumer'), 'Kafka’s ownership rule is not carried').toBe(true);
    expect(M.lesson.includes('only WITHIN a partition and not across a topic'), 'Kafka’s ordering scope is not carried').toBe(true);
    expect(M.lesson.includes('recorded the proposal to persistent storage'), 'ZooKeeper’s quorum cost is not carried').toBe(true);
    expect(M.lesson.includes('writes are linearizable while reads served by one server are NOT'), 'ZooKeeper’s per-operation split is not carried').toBe(true);
  });

  it('what the checking CHANGED is stated, and it names the assumption it reversed', () => {
    // DR-0190 §5: the note must say what the checking CHANGED, not merely that
    // checking happened. Here it reversed a sentence the draft was carrying.
    expect(/had the trade backwards before I checked/.test(M.lesson), 'the adult lesson does not say what the checking changed').toBe(true);
    expect(M.lesson.includes('The order is a consequence of single ownership, not of agreement'), 'the corrected claim is not stated').toBe(true);
    // And the honest finding that the headline missed.
    expect(
      M.lesson.includes('they CONFINE coordination to one channel and keep everything else off it'),
      'the lesson does not state its own finding against the headline'
    ).toBe(true);
    // The arithmetic we could do ourselves, measured rather than repeated.
    expect(/thirty-five times/.test(M.lesson), 'the measurement we made ourselves is not shown').toBe(true);
  });
});

describe('sov70 — the four bands, and TALK ABOUT IT TOGETHER everywhere', () => {
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
    // The three terms THIS lesson introduces are glossed where they are first
    // used, which is what DR-0521 requires and what the registry's HARD_TERMS
    // list cannot know about a term it does not carry. They are NOT added to
    // that list here: `partition` and `replica` already appear un-glossed in
    // neighbouring lessons, so a registry entry would turn a lesson this build
    // never touched red. Named in DR-1357 with `re-review: 2026-11-20`.
    expect(M.levels.youth.includes('Apache Kafka is a real tool for moving streams of data'), 'Kafka is used before it is glossed').toBe(true);
    expect(
      M.levels.youth.includes('Apache ZooKeeper is a tool whose whole job is keeping other machines in agreement'),
      'ZooKeeper is used before it is glossed'
    ).toBe(true);
    expect(M.levels.youth.includes('a topic is cut into pieces called partitions'), 'partition is used before it is glossed').toBe(true);
    // PROVEN TO CATCH: the gloss must PRECEDE the term, not follow it.
    const at = (s) => M.levels.youth.indexOf(s);
    expect(at('a topic is cut into pieces called partitions')).toBeLessThan(at('each piece goes to exactly one reader'));
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

describe('sov70 — a true story names whose life it was, so neither story claims to be one (DR-1123)', () => {
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

describe('sov70 — PROVEN TO CATCH, place by place', () => {
  const everyPlace = (re) => (p) => Object.values(p).every((v) => re.test(v));
  it('breaking any load-bearing marker, at every site it appears, is caught', () => {
    const rows = [
      ['NOBODY', 'SOMEBODY', everyPlace(/NOBODY/), 'the DR-0719 who-taught marker'],
      ['TALK ABOUT IT TOGETHER', 'ONE LAST THING', everyPlace(/TALK ABOUT IT TOGETHER/), 'the DR-0733 block'],
      ['Deuteronomy 6:7', 'the Word', everyPlace(/Deuteronomy 6:7/), 'the TALK rhythm'],
      ['Lamb of Yahweh', 'Lamb', everyPlace(/Lamb of Yahweh/), 'the DR-0210 confession'],
      ['Eternal Son of Yahweh', 'Son', everyPlace(/Eternal Son of Yahweh/), 'the DR-0210 Son confession'],
      ['every one over against his house', 'near their homes', everyPlace(/every one over against his house/), 'the week’s own hinge'],
      ['resort ye thither unto us', 'come to us', everyPlace(/resort ye thither unto us/), 'the one coordination point'],
      ['fifty and two days', 'under two months', everyPlace(/fifty and two days/), 'the measured outcome'],
      ['never read the article', 'read the article closely', everyPlace(/never read the article/i), 'the DR-0076 §8 disclosure'],
      ['advertisement', 'notice', everyPlace(/advertisement/i), 'the ignored-ad declaration'],
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

  it('PROVEN TO CATCH: naming the advertiser anywhere in the module is caught', () => {
    // The guard that keeps a sponsor out of a lesson it did not buy.
    const vendorFree = (blob) => !/\bProton\b/i.test(blob) && !/Proton Pass/i.test(blob);
    expect(vendorFree(allStrings().join('\n')), 'the shipped lesson already names the vendor').toBe(true);
    expect(vendorFree(`${M.lesson}\nsponsored by Proton Pass`), 'a planted vendor name was NOT caught').toBe(false);
  });

  it('the per-place slices used above are UNIQUE to their place, so no band can be reworded from a sibling', () => {
    const p = PLACES();
    const uniqueCarrier = (slice, place) => {
      const holders = Object.entries(p)
        .filter(([, v]) => v.includes(slice))
        .map(([k]) => k);
      expect(holders, `"${slice.slice(0, 40)}" is not unique to ${place}`).toEqual([place]);
    };
    uniqueCarrier('Just a list of who fixed what.', 'child');
    uniqueCarrier('A password tool has nothing to do with how much of a job', 'youth');
    uniqueCarrier('That is the cheapest lie available in this work', 'teen');
    uniqueCarrier('Give the room that sentence twice.', 'senior');
    uniqueCarrier('Independence was not the absence of a plan.', 'adult');
  });
});

describe('sov70 — shared ground is MEASURED, never claimed (DR-1317)', () => {
  // This is a measurement and not a veto. It names the other holder for every
  // reference this lesson shares, and it asserts NOTHING about what another
  // lesson may stand on. A verse is never spent.
  //
  // Measured 2026-11-06 on `origin/main` eab90722c, by scanning the catalog's
  // own course and class modules (app/src/lib/*-class.js, *-course.js) with
  // THIS lesson's own block excluded, so a holder is always some other lesson.
  // app/public/bible/xref/ is excluded because it is the cross-reference index
  // and not taught content.
  const SHARED_AND_WHO_ELSE_HOLDS_IT = {
    'Nehemiah 3:28': 'another sovereign-ai week (read for SECURITY — repairing your own exposure — not for how the work was divided)',
    'Nehemiah 4:6': 'datasystems, economics, living-lessons, partnerships and another sovereign-ai week',
    'Nehemiah 4:18': 'development, living-lessons and another sovereign-ai week',
    'Nehemiah 4:19': 'another sovereign-ai week (the same verse read as a LATENCY requirement)',
    'Nehemiah 4:20': 'another sovereign-ai week (the trumpet read for how fast the watch must report)',
    'Nehemiah 6:3': 'living-lessons, project-management and another sovereign-ai week',
    'Nehemiah 6:15': 'living-lessons, project-management and another sovereign-ai week',
    '1 Corinthians 14:8': 'economics and living-lessons',
    'Exodus 18:17': 'living-lessons, project-management and another sovereign-ai week',
    'Exodus 18:18': 'living-lessons, project-management and another sovereign-ai week',
    'Exodus 18:21': 'living-lessons, mathematics, project-management and another sovereign-ai week',
    'Exodus 18:22': 'living-lessons, project-management and another sovereign-ai week',
    'Numbers 11:16': 'living-lessons',
    'Numbers 11:17': 'living-lessons',
    'Acts 6:2': 'church-offices, living-lessons, project-management and another sovereign-ai week',
    'Acts 6:3': 'living-lessons, project-management and another sovereign-ai week',
    'Acts 6:4': 'living-lessons, project-management and another sovereign-ai week',
    'Acts 6:7': 'another sovereign-ai week',
    '1 Corinthians 12:14': 'datasystems, living-lessons, project-management, sound-board and another sovereign-ai week',
    '1 Corinthians 12:18': 'living-lessons, world-issues and another sovereign-ai week',
    '1 Corinthians 12:21': 'broadcast, living-lessons, world-issues and another sovereign-ai week',
    '1 Corinthians 12:25': 'living-lessons and world-issues',
    '1 Corinthians 12:27': 'church-offices and living-lessons',
    'Romans 12:4': 'datasystems and living-lessons',
    'Romans 12:5': 'living-lessons',
    'Ephesians 4:16': 'living-lessons, world-issues and another sovereign-ai week',
    'Galatians 6:4': 'living-lessons, project-management and another sovereign-ai week',
    'Galatians 6:5': 'living-lessons and another sovereign-ai week',
    'Genesis 11:1': 'living-lessons',
    'Genesis 11:6': 'living-lessons and another sovereign-ai week',
    'Genesis 11:7': 'living-lessons',
    'Genesis 11:8': 'living-lessons and another sovereign-ai week',
    '1 Corinthians 14:33': 'broadcast, living-lessons, sound-board and another sovereign-ai week',
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
   * eight appear in NO file of app/src or docs/decisions at all (measured
   * 2026-11-06, excluding app/public/bible/xref/). Five of them are the
   * Nehemiah 3 pattern itself — the verses that place a worker at his own door
   * — which is the ground this week stands on and which the library had never
   * once taught.
   */
  const MEASURED_UNTAUGHT_WHEN_WRITTEN = [
    'Nehemiah 3:5',
    'Nehemiah 3:10',
    'Nehemiah 3:12',
    'Nehemiah 3:23',
    'Nehemiah 3:30',
    'Exodus 18:14',
    'Exodus 18:23',
    'Numbers 11:14',
  ];

  it('the census covers every reference exactly once, and the two halves add up', () => {
    const shared = Object.keys(SHARED_AND_WHO_ELSE_HOLDS_IT);
    const all = [...shared, ...MEASURED_UNTAUGHT_WHEN_WRITTEN].sort();
    expect(all.length, 'the census double-counts or misses a reference').toBe(SPINE_COUNT);
    expect(all).toEqual([...SPINE].sort());
    expect(MEASURED_UNTAUGHT_WHEN_WRITTEN.length, 'the untaught count changed without the record being updated').toBe(8);
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
      expect(/\bweek (?:forty|sixty-six|sixty-nine|seventy)\b/i.test(txt), `${place} points a reader at another week`).toBe(false);
    }
  });

  it('the landing is this lesson’s own, and is not a sibling’s (proved from the landing, not the headline)', () => {
    // sov40's landing is TRACEABILITY — no worker is untraceable.
    // sov66's landing is SECURITY — the hole that was always open.
    // sov69's landing is THE LATENCY REQUIREMENT — how fast a result must be useful.
    // THIS lesson's landing is THE COORDINATION BUDGET: what must wait on
    // agreement, and where the one channel belongs.
    expect(M.bigIdea.includes('COORDINATION IS NOT FREE AND IT IS NOT EVIL - IT IS A BUDGET'), 'the lesson does not state its own standard').toBe(true);
    expect(/Independence was not the absence of a plan\. Independence WAS the plan\./.test(M.lesson), 'the lesson does not carry its own hinge').toBe(true);
    expect(M.lesson.includes('agreement was spent UP FRONT, in the cutting'), 'the lesson does not carry why the single cut buys the independence').toBe(true);
    expect(
      M.lesson.includes('It was reserved for the single event that genuinely required the whole wall to stop and converge'),
      'the lesson does not carry the reserved-channel landing'
    ).toBe(true);
    // And it does NOT teach the sibling landings.
    const blob = allStrings().join('\n');
    expect(/untraceable/i.test(blob), 'this lesson teaches the traceability landing of another week').toBe(false);
    expect(/dwelt careless|no deliverer/i.test(blob), 'this lesson teaches the careless-dwelling landing of another week').toBe(false);
    expect(/at his day, or at evening/i.test(blob), 'this lesson teaches the latency landing of another week').toBe(false);
  });
});

describe('sov70 — the date is derived, never typed', () => {
  it('lesson-dates records this lesson, derived from git and not from the working tree', () => {
    const d = lessonCreatedDay('sovereign-ai', ID);
    expect(d, `${ID} has no lesson-dates entry; run npm run lesson-dates`).toBeTruthy();
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
