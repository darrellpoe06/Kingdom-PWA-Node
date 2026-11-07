// =============================================================================
// sovereign-ai-sov73-verses — the gate for sov73, "He that answereth a matter
// before he heareth it"
// =============================================================================
// WHAT THIS LESSON IS, AND WHAT IT DELIBERATELY IS NOT.
//
// Gmail thread `1a168b8b45e9410d`, a copy of The Neuron for 2026-10-23,
// forwarded out of Darrell's university mailbox that day at 12:24 UTC with ONE
// WORD typed above the forwarded header: `Lesson`. SINGULAR. That one word is
// the entire brief this build was handed.
//
// ONE ITEM OF MANY, AND THE REST IS NOT SPENT. The letter carries many items;
// this lesson is built from the item reporting that a Microsoft diagnostic
// system scored 83% on hard New England Journal of Medicine cases where
// physicians got 36%, and from nothing else. The MIT island study of thirteen
// unsupervised agents, the Monte Carlo launch-date method, the Treasury
// investment proposal, the reported DeepSeek raise, the four banks blocking
// third-party agents, the proof effort across 123 libraries, the Barclays job
// cuts, the new image model, the agent credential-holder, the live translator,
// the question-routing interface and the opinion column are UNTOUCHED and
// remain available to a later week — the rule is one TEACHING one lesson,
// never one SOURCE one lesson (DR-0610 as DR-1317 fixed its meaning).
//
// THE SECOND NUMBER IN THE SUBJECT LINE IS NOT A SECOND TEACHING. The reported
// 30 billion dollar raise at a 1.25 trillion dollar valuation is the SAME
// teaching wearing money — a number spoken about a matter not yet heard — so
// it takes a movement inside this lesson rather than a lesson of its own. The
// cases below pin that it is carried WITH the publication's own hedge and
// never as a settled fact.
//
// NOT ONE PRIMARY SOURCE WAS OPENED, and that fact governs every case here.
// Four roads refused at the gateway with `curl: (56) CONNECT tunnel failed,
// response 403` — microsoft.ai (the company's own announcement), arxiv.org
// (the preprint describing the benchmark), www.nejm.org (the journal the cases
// are drawn from) and www.bidmc.org (the hospital where the promised
// real-world study is to run) — and a fifth attempt through a different tool
// would not resolve at all: `getaddrinfo ENOTFOUND microsoft.ai`.
// www.microsoft.com answered HTTP 200 in the same minute and the proxy's own
// status log records the refusals as `connect_rejected` / "gateway answered
// 403 to CONNECT (policy denial or upstream failure)", so this is a per-host
// closed door and not a broken wire. NO SECONDARY COVERAGE WAS READ EITHER:
// unlike sov71, which had a mediated read over other people's write-ups, this
// build's source is the forwarded newsletter and nothing else. So the label
// here is a SECOND-HAND READ, and it is carried in all four non-child places.
// A blocked road never reads as a verified claim (DR-0076 §8).
//
// WHAT THE CHECKING CHANGED (DR-0190 §5). The draft expected to reach at least
// the company's own announcement and the preprint and to quote the figures as
// the maker's own PUBLISHED figures. Nothing opened. So every figure sits two
// layers out from anything measured — the maker said it, a newsletter reported
// that the maker said it, we read the newsletter — and the landing had to move
// OFF the numbers entirely and onto the METHOD, which the newsletter describes
// in its own words and which the Word has already judged. The cases below pin
// that sentence, because the closed door produced the better lesson.
//
// THE THREE TIERS (DR-0100) ARE CARRIED, AND THE THIRD TIER IS WORKED. The
// vendor's "medical superintelligence" framing is the over-reach: the WORD is
// refused and the true result underneath it is left standing untouched, which
// is DR-0100's third tier exactly. A case below asserts both halves, because
// refusing the word while quietly deflating the result would be the
// under-claiming failure DR-0100 forbids in the same breath.
//
// THE ADVERTISEMENTS ARE NAMED AND USED FOR NOTHING. A case asserts the
// naming and asserts that the lesson takes nothing from them — not a claim,
// not a figure, not a phrase, and deliberately not a foil to argue against.
//
// THE HEALTH BOUNDARY IS A FIRST-CLASS REQUIREMENT, not a disclaimer, and it
// has its own describe block. All five reader places must send a reader with
// something wrong to a physician, and none may read as guidance about a body.
// The Word's own posture is taught from its own usage (DR-0098): the physician
// honored by name, the healing kept in Yahweh's hands, and 2 Chronicles 16:12
// read for the OMISSION it actually charges — with the lesson saying out loud
// that Scripture does not go on to forbid the physician and neither does it.
//
// EVERY LESSON STANDS ALONE AND WHOLE. No reader text points at another
// lesson; the comparison lives in this header and in DR-1376.
//
// WHO TAUGHT (DR-0719): NOBODY. A forwarded trade newsletter is not a
// recording. All five reader places say so; the cases below forbid the bare
// phrase "the teacher" and forbid crediting Bishop Gwin for a send that names
// nobody.
//
// STORIES ARE PARABLES, NOT TESTIMONIES (DR-1123). Both stories were written
// to teach and no real person's life is behind either.
//
// WEEK 73, AND THE CONTIGUITY CLAIM IS FORWARD-SAFE AND GAP-SAFE. The cases
// assert that week 73 exists exactly once, is this lesson, and sits at the
// index its position in the ascending series requires — never that this is the
// LAST lesson (the fault DR-1316 is named for), and never that the weeks run
// contiguous to 72, because week 72 was being written on a sibling branch when
// this landed and landing is strictly serial. The gap is recorded ONCE, in
// `sovereign-ai-class.test.js`'s HELD_IN_FLIGHT, which fails the moment the
// hold outlives its week. Duplicating that allowance here would be a second
// place to forget to clear.
//
// NOTHING HERE ASSERTS ANYTHING ABOUT THE TREE. No case reads a git ref, a
// branch state or another branch having merged: a case that asserts about the
// environment passes in a worktree and goes red in CI.
//
// Every verse was fetched from app/public/bible/kjv BEFORE a word was written,
// and SPINE_FRAGMENTS pins the exact span this lesson quotes for all 40
// references. Recorded as DR-1376.
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

const ID = 'sov73-he-that-answereth-a-matter-before-he-heareth-it';
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
  'Proverbs 18:13': 'He that answereth a matter before he heareth it, it is folly and shame unto him.',
  'Proverbs 15:28': 'The heart of the righteous studieth to answer',
  'Proverbs 18:15': 'The heart of the prudent getteth knowledge; and the ear of the wise seeketh knowledge.',
  'James 1:19': 'let every man be swift to hear, slow to speak, slow to wrath',
  'Proverbs 20:5': 'Counsel in the heart of man is like deep water; but a man of understanding will draw it out.',
  'Genesis 3:9': 'And the LORD God called unto Adam, and said unto him, Where art thou?',
  'Genesis 18:21': 'I will go down now, and see whether they have done altogether according to the cry of it, which is come unto me; and if not, I will know.',
  'Job 38:3': 'for I will demand of thee, and answer thou me',
  'Mark 10:51': 'And Jesus answered and said unto him, What wilt thou that I should do unto thee?',
  'John 5:6': 'he saith unto him, Wilt thou be made whole?',
  'John 2:25': 'And needed not that any should testify of man: for he knew what was in man.',
  'Proverbs 25:2': 'the honour of kings is to search out a matter',
  'Proverbs 18:17': 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.',
  'Jeremiah 6:16': 'Stand ye in the ways, and see, and ask for the old paths, where is the good way, and walk therein, and ye shall find rest for your souls',
  '1 Corinthians 13:12': 'For now we see through a glass, darkly; but then face to face: now I know in part',
  'Proverbs 11:14': 'Where no counsel is, the people fall: but in the multitude of counsellors there is safety.',
  'Proverbs 15:22': 'Without counsel purposes are disappointed: but in the multitude of counsellors they are established.',
  'Proverbs 24:6': 'For by wise counsel thou shalt make thy war: and in multitude of counsellors there is safety.',
  '1 Kings 22:6': 'Then the king of Israel gathered the prophets together, about four hundred men',
  '1 Kings 22:7': 'Is there not here a prophet of the LORD besides, that we might enquire of him?',
  '1 Kings 22:8':
    'There is yet one man, Micaiah the son of Imlah, by whom we may enquire of the LORD: but I hate him; for he doth not prophesy good concerning me, but evil.',
  'Proverbs 14:15': 'The simple believeth every word: but the prudent man looketh well to his going.',
  'Luke 14:28': 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
  'Proverbs 24:3': 'Through wisdom is an house builded; and by understanding it is established',
  'Proverbs 24:4': 'And by knowledge shall the chambers be filled with all precious and pleasant riches.',
  'Deuteronomy 19:15': 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.',
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good.',
  'Proverbs 27:2': 'Let another man praise thee, and not thine own mouth; a stranger, and not thine own lips.',
  'Matthew 9:12': 'They that be whole need not a physician, but they that are sick.',
  'Colossians 4:14': 'Luke, the beloved physician',
  'Exodus 15:26': 'I am the LORD that healeth thee',
  '2 Chronicles 16:12': 'yet in his disease he sought not to the LORD, but to the physicians.',
  'Proverbs 27:1': 'Boast not thyself of to morrow; for thou knowest not what a day may bring forth.',
  'John 1:29': 'Behold the Lamb of God, which taketh away the sin of the world.',
  'John 3:16': 'For God so loved the world, that he gave his only begotten Son',
  'Hebrews 1:8': 'But unto the Son he saith, Thy throne, O God, is for ever and ever',
  'Colossians 1:17': 'And he is before all things, and by him all things consist.',
  'Galatians 5:22': 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,',
  'Deuteronomy 6:7':
    'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
  'Hebrews 3:13': 'But exhort one another daily, while it is called To day',
};
/** The pinned references, all 40. The count this gate asserts about ITSELF, so an empty scan can never pass. */
const SPINE = Object.keys(SPINE_FRAGMENTS);
const SPINE_COUNT = 40;

describe('sov73 — the lesson is mounted and is the week it says it is', () => {
  it('is mounted as week 73, at the index its place in the series requires, with every reader field present', () => {
    expect(M, `${ID} is not mounted`).toBeTruthy();
    const weeks = SOVEREIGN_AI_MODULES.map((m) => Number(m.id.match(/^sov(\d+)-/)[1]));
    // FORWARD-SAFE AND GAP-SAFE ON PURPOSE (DR-1316 / DR-1338 / DR-1351). This
    // gate does NOT assert `MODULES[length - 1].id === ID`: sov68's gate made
    // exactly that claim and sov69's arrival turned it red. Nor does it assert
    // the weeks run contiguous to 72, because week 72 was on a sibling branch
    // when this landed. What is durably true, and stays true when week 74
    // lands: week 73 exists, exactly once, it is THIS lesson, the weeks ascend
    // strictly, and this lesson sits where that ascending order puts it.
    expect(weeks).toContain(73);
    expect(weeks.filter((w) => w === 73).length, 'week 73 is mounted twice').toBe(1);
    expect(
      weeks.every((n, i) => i === 0 || n > weeks[i - 1]),
      `weeks ascend: ${weeks.join(',')}`
    ).toBe(true);
    expect(
      SOVEREIGN_AI_MODULES.findIndex((m) => m.id === ID),
      'sov73 does not sit where the ascending week order puts it'
    ).toBe([...weeks].sort((a, b) => a - b).indexOf(73));
    expect(Math.max(...weeks)).toBeGreaterThanOrEqual(73);
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

describe('sov73 — every verse came from the corpus on disk, not from memory', () => {
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

  it('PROVEN TO CATCH: the two spans most easily misremembered are held to the letter', () => {
    // These two were chosen because the natural paraphrase is so close that a
    // writer working from memory would not notice. Proverbs 18:13 is habitually
    // recalled as "answers a matter before he hears it", and Mark 10:51 as
    // "What do you want me to do for you" — and the KJV construction in Mark is
    // load-bearing for this lesson, because "And Jesus answered and said unto
    // him" is the whole point that He ANSWERED by ASKING.
    const NEAR_MISSES = {
      'Proverbs 18:13': 'He that answers a matter before he hears it, it is folly and shame unto him.',
      'Mark 10:51': 'And Jesus said unto him, What wilt thou that I should do unto thee?',
    };
    for (const [ref, wrong] of Object.entries(NEAR_MISSES)) {
      expect(verseText(ref).includes(SPINE_FRAGMENTS[ref]), `${ref} right form is not in the corpus`).toBe(true);
      expect(verseText(ref).includes(wrong), `a near-miss form of ${ref} was NOT caught`).toBe(false);
      expect(M.lesson.includes(wrong), `the lesson carries the near-miss form of ${ref}`).toBe(false);
    }
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

describe('sov73 — the Word is quoted, never rewritten', () => {
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
    // PROVEN NOT HOLLOW: the scan really does see our prose, and really does
    // leave a quotation alone. Proverbs 25:2 carries "honour" INSIDE its
    // quotation marks in this lesson and must never be reported.
    expect(
      findBritish('we honour the searching').map((h) => h.word),
      'the British scan is blind'
    ).toEqual(['honour']);
    expect(
      findBritish('"the honour of kings is to search out a matter"').map((h) => h.word),
      'the scan reads inside a quotation'
    ).toEqual([]);
  });
});

describe('sov73 — WHO TAUGHT: NOBODY, and the provenance is carried', () => {
  it('all five reader places say nobody taught it, and name the source as a newsletter', () => {
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

  it('carries the thread, the forward time, and his one word — singular', () => {
    const blob = allStrings().join('\n');
    expect(blob.includes('1a168b8b45e9410d'), 'the thread id is not carried').toBe(true);
    expect(blob.includes('12:24'), 'the forward time is not carried').toBe(true);
    expect(/one word/i.test(blob), 'his one word is not named as one word').toBe(true);
    // The word was Lesson, SINGULAR, and the gate pins that. sov71's send
    // carried the PLURAL; the build is judged by what he actually typed, so the
    // number matters and is asserted rather than assumed.
    expect(/\bword was Lesson\b|\bword: Lesson\b|\bword, singular: Lesson\b/.test(blob), 'his word, Lesson, is not carried').toBe(true);
    expect(/\bthe word was Lessons\b|\bone word: Lessons\b/.test(blob), 'the plural form of his word is carried').toBe(false);
  });

  it('ONE TEACHING, ONE LESSON: the untouched items are declared, and none of them is taught here', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue;
      expect(/UNTOUCHED|unbuilt|left alone/i.test(txt), `${place} does not declare the rest of the send untouched`).toBe(true);
    }
    // NAMED AS UNBUILT IS NOT THE SAME AS TAUGHT, and this case first conflated
    // them. Its first cut allowed the unbuilt subjects ONLY inside the ADULT
    // declaration paragraph and went red on the band declarations, which do the
    // same honest job in their own words — four bands and one quiz explanation
    // all name the unbuilt items so a reader of any one place knows the send is
    // not spent. The honest rule is not WHERE the subject appears but WHAT the
    // paragraph around it does: every occurrence, anywhere in the module, must
    // sit inside a passage that DECLARES the item unbuilt. A subject carrying a
    // verse, a movement or a teaching of its own would fail, which is the thing
    // one TEACHING one lesson actually forbids.
    const DECLARATION = M.lesson.split('\n\n').find((p) => p.includes('WHAT WE BUILT FROM, AND WHAT WE LEFT ALONE ON PURPOSE'));
    expect(DECLARATION, 'the adult declaration paragraph is missing').toBeTruthy();
    const DECLARES = /UNTOUCHED|unbuilt|LEFT ALONE|left alone|not spent|still open for a later week|available for a later week/;
    for (const term of ['simulated island', 'Treasury', 'DeepSeek', 'open-source libraries']) {
      expect(DECLARATION.includes(term), `the adult declaration does not name the unbuilt ${term} item`).toBe(true);
      const taught = [];
      for (const s of allStrings()) {
        for (const para of s.split('\n\n')) {
          if (para.includes(term) && !DECLARES.test(para)) taught.push(para.slice(0, 90));
        }
      }
      expect(taught, `the unbuilt ${term} item appears outside a passage that declares it unbuilt`).toEqual([]);
    }
    // PROVEN TO CATCH: the same subject planted in a paragraph that teaches it
    // rather than declaring it unbuilt is named.
    const planted = 'The Treasury proposal shows what the Word says about a bound set on a nation.';
    expect(DECLARES.test(planted), 'a planted teaching paragraph was NOT caught').toBe(false);
  });

  it('the second number in the subject line is carried as the SAME teaching, with the publication’s hedge intact', () => {
    expect(
      M.lesson.includes('is NOT a second teaching here'),
      'the adult lesson does not say the valuation is the same teaching rather than a second one'
    ).toBe(true);
    const blob = allStrings().join('\n');
    expect(/reportedly|reported as a thing|said to be/i.test(blob), 'the raise is not carried with the publication’s hedge').toBe(true);
    // And it is never stated as a completed fact.
    expect(/the company raised 30 billion|raised thirty billion dollars at/i.test(blob), 'the reported raise is stated as a completed fact').toBe(false);
  });
});

describe('sov73 — WE NEVER OPENED A PRIMARY SOURCE, and every reader place says so (DR-0076 §8)', () => {
  it('all five places state plainly that no first-hand source was opened', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(
        // The child band carries the same claim in plain words rather than the
        // term, which is a reading-level decision and not a weaker claim.
        /NOT ONE PRIMARY SOURCE WAS OPENED|did not read the real papers/i.test(txt),
        `${place} does not say no primary source was opened`
      ).toBe(true);
    }
  });

  it('BOTH refused roads are quoted word for word in every non-child place, never described', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue; // the child band carries the fact in plain words
      expect(txt.includes('curl: (56) CONNECT tunnel failed, response 403'), `${place} does not quote the gateway refusal`).toBe(true);
      expect(txt.includes('getaddrinfo ENOTFOUND microsoft.ai'), `${place} does not quote the resolver refusal`).toBe(true);
      // A second-hand read NEVER reads as a checked one.
      expect(/SECOND-HAND READ/.test(txt), `${place} does not label the read as second-hand`).toBe(true);
    }
  });

  it('the closed door is distinguished from a broken wire, by a measurement and not a guess', () => {
    const blob = allStrings().join('\n');
    expect(/closed door and not a broken wire|closed door rather than a broken wire/i.test(blob), 'the lesson does not separate a refusal from a failure').toBe(
      true
    );
    expect(/policy denial/i.test(blob), 'the gateway’s own word for the refusal is not carried').toBe(true);
  });

  it('the three tiers are carried in every non-child place (DR-0100)', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue; // the child band carries the teaching, not the audit
      expect(/DOCUMENTED/.test(txt), `${place} has no documented tier`).toBe(true);
      expect(/ATTRIBUTED/.test(txt), `${place} has no attributed tier`).toBe(true);
      expect(/UNCHECKED/.test(txt), `${place} has no unchecked tier`).toBe(true);
    }
    expect(M.lesson.includes('TRUST BUT VERIFY, IN THREE TIERS'), 'the adult lesson does not name the three tiers').toBe(true);
    expect(M.lesson.includes('UNCHECKED, and it stays unchecked'), 'the adult lesson does not keep the unchecked tier unchecked').toBe(true);
  });

  it('every figure is ATTRIBUTED to the publication and never asserted on our authority', () => {
    const blob = allStrings().join('\n');
    for (const n of ['83%', '36%', '22%', '80%', '47%', '304', '78.9%']) {
      expect(blob.includes(n), `the publication’s figure ${n} is not carried`).toBe(true);
    }
    expect(
      /the publication's figures carried as the publication's figures|the publication’s number carried as the publication’s number|the publication's number carried as the publication's number/i.test(
        blob
      ),
      'the attributed tier does not say whose figures these are'
    ).toBe(true);
    // The specific limits the publication itself printed are carried, not hidden.
    expect(/working alone/i.test(blob), 'the publication’s own caveat about the physicians is not carried').toBe(true);
    expect(/still to be tested/i.test(blob), 'the publication’s own caveat about real-world performance is not carried').toBe(true);
  });

  it('what the checking CHANGED is stated, and it names the expectation it reversed (DR-0190 §5)', () => {
    expect(M.lesson.includes('AND HERE IS WHAT THE CHECKING CHANGED'), 'the adult lesson does not say what the checking changed').toBe(true);
    expect(M.lesson.includes('The probe REVERSED that'), 'the reversal is not named as a reversal').toBe(true);
    expect(M.lesson.includes('every number here sits two layers out from anything measured'), 'the lesson does not state how far out its figures sit').toBe(
      true
    );
    const blob = allStrings().join('\n');
    expect(
      /the landing had to move off the numbers entirely|the landing of the lesson had to move off the numbers altogether/i.test(blob),
      'the lesson does not say the landing moved off the numbers'
    ).toBe(true);
  });

  it('the advertisements are NAMED and taken from for nothing', () => {
    const blob = allStrings().join('\n');
    expect(/advertisement/i.test(blob), 'the advertisements in the send are not named').toBe(true);
    expect(M.lesson.includes('THE ADVERTISEMENTS IN THE SAME SEND'), 'the adult lesson has no paragraph naming the advertising').toBe(true);
    expect(
      /taking NOTHING from them|draw NOTHING from any of it|used for nothing/i.test(blob),
      'the lesson does not say it takes nothing from the advertising'
    ).toBe(true);
    // Not even as a foil, which is the subtle way an advertisement gets used.
    expect(
      /not a foil to argue against|not even a target to argue against|not even a convenient position to argue against/i.test(blob),
      'the lesson does not refuse the advertisement as a foil'
    ).toBe(true);
    // And the advertised product is never named, because naming it would be carrying it.
    expect(/\bDemi\b/.test(blob), 'the advertised product is named, which is carrying the advertising').toBe(false);
  });
});

describe('sov73 — the landing: the sequence, the counsel, and the score that is not a healing', () => {
  it('states its own standard, and the standard is the SEQUENCE rather than the outcome', () => {
    expect(M.bigIdea.includes('WHY A SCORE IS NOT A HEALING'), 'the lesson does not state its own standard').toBe(true);
    expect(
      M.lesson.includes('It does not say the answer was wrong'),
      'the lesson does not carry the point that Proverbs 18:13 is silent about the answer being wrong'
    ).toBe(true);
    expect(M.lesson.includes('so the fault is located in the SEQUENCE, not in the outcome'), 'the lesson does not place the fault on the sequence').toBe(true);
    // The EAR, not the mouth, is the organ given the seeking, and the lesson says so.
    expect(M.lesson.includes('The EAR seeks. Not the mouth.'), 'the lesson does not work out Proverbs 18:15').toBe(true);
  });

  it('TRUTH TWO: the asking is honor, proved from John 2:25 standing beside Mark 10:51', () => {
    const at = (ref) => M.lesson.indexOf(SPINE_FRAGMENTS[ref]);
    expect(at('John 2:25')).toBeGreaterThan(-1);
    expect(at('Mark 10:51')).toBeGreaterThan(-1);
    // The reasoning, not a bare pair of citations (DR-0281 / DR-0381).
    expect(M.lesson.includes('He ANSWERED by ASKING'), 'the lesson does not work out Mark 10:51').toBe(true);
    expect(
      M.lesson.includes('So the asking is not a method for closing a gap in knowledge. It is HONOR.'),
      'the lesson does not land the asking on honor'
    ).toBe(true);
    // And the distinction from a machine that asks for score is kept.
    expect(/asking raises its score/i.test(M.lesson), 'the lesson does not distinguish honor from a scoring incentive').toBe(true);
  });

  it('TRUTH THREE: the counsel of many is promised SAFETY, never TRUTH, and 1 Kings 22 is read as the mechanism', () => {
    expect(M.lesson.includes('The many give SAFETY and ESTABLISHMENT. Not truth.'), 'the lesson does not read the promise exactly').toBe(true);
    expect(
      M.lesson.includes('the panel was assembled by the man who already knew what he wanted to hear'),
      'the lesson does not name why the four hundred were worthless'
    ).toBe(true);
    expect(M.lesson.includes('excluded for being unwelcome rather than for being wrong'), 'the lesson does not name why Micaiah was left out').toBe(true);
    expect(M.lesson.includes('not whether they argue, but whether any of them can lose'), 'the lesson does not state the panel test').toBe(true);
    // The order of the quotes IS the argument: the four hundred, then the question, then the admission.
    const at = (ref) => M.lesson.indexOf(SPINE_FRAGMENTS[ref]);
    expect(at('1 Kings 22:6')).toBeLessThan(at('1 Kings 22:7'));
    expect(at('1 Kings 22:7')).toBeLessThan(at('1 Kings 22:8'));
  });

  it('a benchmark is DEFINED before it is weighed, and both halves of DR-0100 are carried', () => {
    expect(/a benchmark - a fixed set of problems with known answers/i.test(M.lesson), 'the lesson uses the term without defining it').toBe(true);
    // The true result is stated plainly — under-claiming is a failure of truth too.
    expect(
      M.lesson.includes('That is a real result and we will not shrink it'),
      'the lesson under-claims the result, which DR-0100 forbids as much as over-claiming'
    ).toBe(true);
    expect(
      M.lesson.includes('under-claiming a true thing is as much a failure of truth as over-claiming a false one'),
      'the lesson does not state the under-claiming rule'
    ).toBe(true);
    // And the limits are named item by item rather than as a mood.
    for (const limit of ['It does not establish that a living person got better', 'it does not establish itself']) {
      expect(M.lesson.includes(limit), `the lesson does not name the limit: ${limit}`).toBe(true);
    }
    // One mouth is not an establishment, and we accuse nobody.
    expect(M.lesson.includes('That is not an accusation of dishonesty and we are making none'), 'the lesson does not refuse the accusation').toBe(true);
  });

  it('the over-reach tier refuses the WORD while leaving the true result standing (DR-0100 tier three)', () => {
    expect(/medical superintelligence/i.test(M.lesson), 'the vendor’s framing is not named').toBe(true);
    expect(
      M.lesson.includes('It is not a superior mind, and the true result under the inflated word is untouched by our refusing the word'),
      'the lesson either keeps the over-reach or deflates the true result with it'
    ).toBe(true);
  });

  it('quotes AND reasons from the Word, never staging competing human views (DR-0281 / DR-0098)', () => {
    const blob = allStrings().join('\n');
    expect(
      /scholars (?:are )?divided|some scholars say|you decide which|three views|pick a side|both sides/i.test(blob),
      'the module stages competing human views'
    ).toBe(false);
    expect(M.lesson.includes('we will not stage two sides of it'), 'the lesson does not refuse the both-sides posture').toBe(true);
  });
});

describe('sov73 — the health boundary is a first-class requirement, not a disclaimer', () => {
  it('every reader place sends a reader with something wrong to a physician', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(/go to a physician|go see a doctor/i.test(txt), `${place} does not send the reader to a physician`).toBe(true);
    }
  });

  it('the four non-child places state plainly that nothing here is guidance about a body', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue;
      expect(/nothing (?:in this hour|in this lesson|here) is (?:advice|guidance)/i.test(txt), `${place} does not disclaim medical guidance`).toBe(true);
      expect(/diagnoses anything/i.test(txt), `${place} does not say it diagnoses nothing`).toBe(true);
    }
    // The child band carries the same boundary in its own words.
    expect(M.levels.child.includes('This lesson is NOT about your body'), 'the child band does not carry the boundary').toBe(true);
  });

  it('2 Chronicles 16:12 is read for the OMISSION it charges, and the Word’s reticence is kept (DR-0098)', () => {
    expect(M.lesson.includes('It does not say he went to physicians. It says he sought NOT to the LORD'), 'the lesson misreads the charge against Asa').toBe(
      true
    );
    expect(
      M.lesson.includes('the Word does not go on to forbid the physician and neither will we'),
      'the lesson does not keep the Word’s reticence about the physician'
    ).toBe(true);
    expect(M.lesson.includes('Seek Yahweh, and go to the doctor, in that order'), 'the lesson does not state the order').toBe(true);
    // The physician's office is honored rather than tolerated.
    expect(M.lesson.includes(SPINE_FRAGMENTS['Colossians 4:14']), 'the beloved physician is not carried').toBe(true);
  });

  it('PROVEN TO CATCH: softening the boundary in any place is named', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      const sendsThem = /go to a physician|go see a doctor/i.test(txt);
      expect(sendsThem, `${place} does not carry the boundary on the shipped lesson`).toBe(true);
      const softened = txt.replace(/go to a physician/gi, 'think it over').replace(/go see a doctor/gi, 'think it over');
      expect(/go to a physician|go see a doctor/i.test(softened), `a softened boundary in ${place} was NOT caught`).toBe(false);
    }
  });
});

describe('sov73 — the four bands, and TALK ABOUT IT TOGETHER everywhere', () => {
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

  it('explains every hard term in plain words at or before its first use, IN ALL FIVE PLACES (DR-0521)', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      expect(termFaults(txt), `${place}: ${JSON.stringify(termFaults(txt))}`).toEqual([]);
    }
    // PROVEN TO CATCH, on the exact defect that once shipped in a sibling week:
    // planting an un-glossed hard term into the senior band is named.
    const planted = `${M.levels.senior}\nThe fire assays the WORK.`;
    expect(termFaults(planted), 'a planted un-glossed hard term was NOT caught').toContain('assay');
    // The term THIS lesson leans hardest on is glossed where it is first used
    // in each place that uses it, which is what DR-0521 asks and what the
    // registry's HARD_TERMS list cannot know about a word it does not carry.
    // `benchmark` is NOT added to that list here: it already appears un-glossed
    // in neighbouring lessons, so a registry entry would turn red a lesson this
    // build never touched. Named in DR-1376 with `re-review: 2026-12-04`.
    // The honest check is that the term's FIRST appearance in a place IS its
    // gloss, which is stronger than "the gloss exists somewhere earlier": a
    // gloss that merely precedes some later headline would still let the word
    // land cold on the reader the first time. This case's first cut compared the
    // gloss against a headline rather than against the word's own first use,
    // and reported a fault on prose that was already correct.
    const GLOSS = 'A benchmark is a fixed set of problems with known answers';
    for (const band of ['youth', 'teen', 'senior']) {
      const txt = M.levels[band];
      const first = txt.indexOf('benchmark');
      expect(first, `the ${band} band never uses the word benchmark`).toBeGreaterThan(-1);
      // The gloss opens with "A ", so the word itself sits two characters in.
      expect(txt.indexOf(GLOSS), `the ${band} band uses benchmark before it glosses it`).toBe(first - 2);
    }
    // And in the adult lesson too, where the gloss is set off by dashes.
    expect(M.lesson.indexOf('benchmark'), 'the adult lesson never uses the word benchmark').toBeGreaterThan(-1);
    expect(M.lesson.indexOf('a benchmark - a fixed set of problems with known answers'), 'the adult lesson does not gloss benchmark at first use').toBe(
      M.lesson.indexOf('benchmark') - 2
    );
    // PROVEN TO CATCH: a band that uses the word before its gloss is named.
    const bent = `The benchmark says so. ${M.levels.youth}`;
    expect(bent.indexOf(GLOSS) === bent.indexOf('benchmark'), 'an un-glossed first use was NOT caught').toBe(false);
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

describe('sov73 — a true story names whose life it was, so neither story claims to be one (DR-1123)', () => {
  it('both stories are parables, and no story wears the testimony label', () => {
    expect(M.stories.length).toBeGreaterThanOrEqual(2);
    for (const s of M.stories) {
      expect(s.kind, `a story in ${ID} is labelled ${s.kind}`).toBe('parable');
      expect(String(s.title || '').length, 'a story has no title').toBeGreaterThan(5);
      expect(String(s.body || '').length, 'a story has no body').toBeGreaterThan(400);
    }
    expect(
      M.stories.some((s) => s.kind === 'testimony'),
      'this lesson adds an unsourced true story'
    ).toBe(false);
    for (const s of M.stories) {
      expect(/^\s*(I |We )/.test(s.body), 'a parable opens as a first-person account').toBe(false);
      expect(/\bPicture\b/.test(s.body), 'a parable does not frame itself as one').toBe(true);
    }
  });

  it('PROVEN TO CATCH: an unsourced true story planted in this module is caught', () => {
    const noTestimony = (stories) => !stories.some((s) => s.kind === 'testimony');
    expect(noTestimony(M.stories), 'the shipped lesson already carries a testimony').toBe(true);
    expect(noTestimony([...M.stories, { kind: 'testimony', title: 'planted', body: 'x' }]), 'a planted testimony was NOT caught').toBe(false);
  });
});

describe('sov73 — PROVEN TO CATCH, place by place', () => {
  const everyPlace = (re) => (p) => Object.values(p).every((v) => re.test(v));
  it('breaking any load-bearing marker, at every site it appears, is caught', () => {
    const rows = [
      ['NOBODY', 'SOMEBODY', everyPlace(/NOBODY/), 'the DR-0719 who-taught marker'],
      ['TALK ABOUT IT TOGETHER', 'ONE LAST THING', everyPlace(/TALK ABOUT IT TOGETHER/), 'the DR-0733 block'],
      ['Deuteronomy 6:7', 'the Word', everyPlace(/Deuteronomy 6:7/), 'the TALK rhythm'],
      ['Lamb of Yahweh', 'Lamb', everyPlace(/Lamb of Yahweh/), 'the DR-0210 confession'],
      ['Eternal Son of Yahweh', 'Son', everyPlace(/Eternal Son of Yahweh/), 'the DR-0210 Son confession'],
      [
        SPINE_FRAGMENTS['Proverbs 18:13'],
        'Do not answer too soon.',
        everyPlace(/He that answereth a matter before he heareth it, it is folly and shame unto him\./),
        'the week’s own hinge',
      ],
      [SPINE_FRAGMENTS['Mark 10:51'], 'Jesus asked him what he wanted', everyPlace(/And Jesus answered and said unto him/), 'the One who asks though He knows'],
      ['1a168b8b45e9410d', 'a thread', everyPlace(/1a168b8b45e9410d/), 'the provenance thread'],
      ['12:24', 'that morning', everyPlace(/12:24/), 'the forward hour'],
      ['newsletter', 'email', everyPlace(/newsletter/i), 'the named source form'],
      // NOT the SECOND-HAND READ label and NOT the quoted refusals: the child
      // band carries those facts in plain words rather than in the terms, so a
      // five-place guard on them does not hold on the shipped lesson. Each
      // keeps its own non-child case above, with its own proof below.
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

  it('PROVEN TO CATCH: softening either refusal into a description, in any non-child place, is caught', () => {
    const quotesBoth = (txt) => txt.includes('curl: (56) CONNECT tunnel failed, response 403') && txt.includes('getaddrinfo ENOTFOUND microsoft.ai');
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue;
      expect(quotesBoth(txt), `${place} does not quote both refusals on the shipped lesson`).toBe(true);
      expect(
        quotesBoth(txt.replace('curl: (56) CONNECT tunnel failed, response 403', 'the request was blocked')),
        `a softened gateway refusal in ${place} was NOT caught`
      ).toBe(false);
      expect(
        quotesBoth(txt.replace('getaddrinfo ENOTFOUND microsoft.ai', 'the address did not work')),
        `a softened resolver refusal in ${place} was NOT caught`
      ).toBe(false);
    }
  });

  it('PROVEN TO CATCH: dropping the SECOND-HAND READ label in any non-child place is caught', () => {
    for (const [place, txt] of Object.entries(PLACES())) {
      if (place === 'child') continue;
      expect(/SECOND-HAND READ/.test(txt), `${place} does not carry the label on the shipped lesson`).toBe(true);
      expect(/SECOND-HAND READ/.test(txt.split('SECOND-HAND READ').join('careful read')), `a dropped label in ${place} was NOT caught`).toBe(false);
    }
  });

  it('the per-place slices used above are UNIQUE to their place, so no band can be reworded from a sibling', () => {
    const p = PLACES();
    const uniqueCarrier = (slice, place) => {
      const holders = Object.entries(p)
        .filter(([, v]) => v.includes(slice))
        .map(([k]) => k);
      expect(holders, `"${slice.slice(0, 40)}" is not unique to ${place}`).toEqual([place]);
    };
    uniqueCarrier('Your ear does the hunting.', 'child');
    uniqueCarrier('Saying a true thing too softly is its own way of lying.', 'youth');
    uniqueCarrier('That is the cheapest lie available in this work and we are not telling it.', 'teen');
    uniqueCarrier('Give the room that detail twice if you have to.', 'senior');
    uniqueCarrier('and nobody draws water without lowering something first', 'adult');
  });
});

describe('sov73 — shared ground is MEASURED, never claimed (DR-1317)', () => {
  // This is a measurement and not a veto. It names the other holder for every
  // reference this lesson shares, and it asserts NOTHING about what another
  // lesson may stand on. A verse is never spent.
  //
  // Measured 2026-11-06 on this branch, by scanning the catalog's own course
  // and class modules (app/src/lib/*-class.js, *-course.js) with THIS lesson's
  // own block excluded, so a holder is always some other lesson.
  // app/public/bible/xref/ is excluded because it is the cross-reference index
  // and not taught content. The two halves are asserted to add up to the spine,
  // so a reference cannot be quietly left out of the census.
  const SHARED_AND_WHO_ELSE_HOLDS_IT = {
    'Proverbs 18:13':
      'eleven other courses and six other sovereign-ai weeks (the most-taught verse in this catalog; read here for the SEQUENCE being the fault rather than the outcome)',
    'Proverbs 15:28': 'living-lessons and one other sovereign-ai week',
    'Proverbs 18:15': 'living-lessons and rent-to-own-business',
    'James 1:19': 'living-lessons, sound-board and four other sovereign-ai weeks',
    'Proverbs 20:5': 'living-lessons and one other sovereign-ai week',
    'Genesis 3:9': 'living-lessons and the torah-pattern surface',
    'Job 38:3': 'car-research, healthy-living, living-lessons and world-issues',
    'Mark 10:51':
      'the therapy-lesson surface (app/src/lib/tlc-lessons.js) and DR-0345 - NOT any course or class module of the taught catalog, so this is the first lesson to teach it',
    'John 2:25': 'living-lessons, world-issues and the seeing-study surface',
    'Proverbs 25:2': 'ten other courses including business-research, development and world-issues (the standing search-it-out verse)',
    'Proverbs 18:17': 'six other courses and six other sovereign-ai weeks',
    'Jeremiah 6:16': 'living-lessons, project-management and three other sovereign-ai weeks',
    '1 Corinthians 13:12': 'living-lessons and world-issues',
    'Proverbs 11:14': 'datasystems, living-lessons, project-management, stocks, world-issues and four other sovereign-ai weeks',
    'Proverbs 15:22': 'historical-research, living-lessons, partnerships, project-management and two other sovereign-ai weeks',
    'Proverbs 24:6': 'living-lessons, project-management and two other sovereign-ai weeks',
    '1 Kings 22:6':
      'sovereign-ai week 33 and DR-0761 (read there for the CONSENSUS THAT KILLED A KING and a tool trained on approval; read here for WHO ASSEMBLED THE PANEL and whether anyone in it can lose)',
    '1 Kings 22:7':
      'sovereign-ai week 33 (the same chapter, the visiting king\u2019s question, read there for the instinct that distrusts unanimity and here for the available voice that was excluded)',
    '1 Kings 22:8':
      'sovereign-ai week 33 (read there for what the four hundred were selected FOR; read here for the admission that the exclusion was for being unwelcome rather than for being wrong)',
    'Proverbs 14:15': 'nine other courses and nine other sovereign-ai weeks',
    'Luke 14:28': 'fifteen other courses (the standing count-the-cost verse)',
    'Proverbs 24:3': 'seven other courses and nine other sovereign-ai weeks (the standing Resources pair)',
    'Proverbs 24:4': 'five other courses and eight other sovereign-ai weeks (the standing Resources pair)',
    'Deuteronomy 19:15': 'eight other courses and four other sovereign-ai weeks (the standing two-or-three-witnesses verse)',
    '1 Thessalonians 5:21': 'thirteen other courses and nine other sovereign-ai weeks (the standing prove-all-things verse)',
    'Proverbs 27:2': 'fifteen other courses and six other sovereign-ai weeks',
    'Colossians 4:14': 'world-issues, and nowhere else in the catalog',
    'Exodus 15:26': 'living-lessons, and nowhere else in the catalog',
    'Proverbs 27:1': 'twelve other courses and nine other sovereign-ai weeks',
    'John 1:29': 'the standing Godhead confession',
    'John 3:16': 'the standing Godhead confession',
    'Hebrews 1:8': 'the standing Godhead confession',
    'Colossians 1:17': 'the standing Godhead confession',
    'Galatians 5:22': 'the standing growth measure',
    'Deuteronomy 6:7': 'the standing growth measure',
    'Hebrews 3:13': 'the standing growth measure',
  };
  /**
   * References the catalog had NEVER opened when this was written. All four
   * appear in NO file of app/src or docs/decisions at all (measured 2026-11-06
   * with this lesson\u2019s own block cut out, excluding app/public/bible/xref/).
   * Three of the four are the heart of the second and seventh movements: the
   * Judge going down to see before He rules, Jesus asking a long-sick man
   * whether he wants to be made whole, Jesus naming whom a physician is for,
   * and the king charged with an OMISSION rather than with consulting doctors.
   */
  const MEASURED_UNTAUGHT_WHEN_WRITTEN = ['Genesis 18:21', 'John 5:6', 'Matthew 9:12', '2 Chronicles 16:12'];

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
      expect(/\bspm\d+\b/i.test(txt), `${place} points a reader at another lesson`).toBe(false);
    }
  });

  it('the LARGEST overlap is MEASURED and named, and the landings still differ (DR-1317)', () => {
    // This course reuses verses on purpose: a verse is never spent. What DR-1317
    // forbids is an unmeasured claim, so the overlap is computed here from the
    // mounted modules rather than asserted in prose. MEASURED 2026-11-06: the
    // largest overlap outside the standing seven is with sovereign-ai week 33,
    // at 14 shared teaching references including the whole of 1 Kings 22:6-8.
    // That is reported, not hidden, and it is not a veto.
    const STANDING_SEVEN = ['John 1:29', 'John 3:16', 'Hebrews 1:8', 'Colossians 1:17', 'Galatians 5:22', 'Deuteronomy 6:7', 'Hebrews 3:13'];
    const sov33 = SOVEREIGN_AI_MODULES.find((m) => m.id.startsWith('sov33-'));
    expect(sov33, 'sov33 is not mounted, so the measurement cannot be made').toBeTruthy();
    const theirs = new Set(sov33.anchor.ref.split(';').map((s) => s.trim()));
    const sharedTeaching = SPINE.filter((r) => theirs.has(r) && !STANDING_SEVEN.includes(r));
    expect(sharedTeaching.length, 'the measured overlap with week 33 changed without this census being updated').toBe(14);
    for (const r of ['1 Kings 22:6', '1 Kings 22:7', '1 Kings 22:8']) {
      expect(sharedTeaching, `${r} is shared with week 33 and the census must name it`).toContain(r);
      expect(String(SHARED_AND_WHO_ELSE_HOLDS_IT[r]).includes('week 33'), `the census does not name week 33 as a holder of ${r}`).toBe(true);
    }
    // PROVEN NOT HOLLOW: the filter really is excluding something rather than
    // dressing up an empty scan. This case's first cut asserted that all SEVEN
    // standing verses are shared with week 33 and went red at three — because
    // week 33 predates the standing growth measure being carried everywhere, so
    // it carries John 1:29, John 3:16 and Deuteronomy 6:7 and not the other
    // four. The claim is now the MEASURED three rather than the assumed seven,
    // which is the whole discipline this census exists for.
    expect(STANDING_SEVEN.filter((r) => theirs.has(r)).sort(), 'the standing verses week 33 shares changed; re-measure rather than widen').toEqual([
      'Deuteronomy 6:7',
      'John 1:29',
      'John 3:16',
    ]);
    // AND THE LANDINGS DIFFER, which is what makes the overlap legitimate.
    // Week 33 lands on a TOOL TRAINED ON APPROVAL and the faithful witness.
    // This week lands on the SEQUENCE, the asking as honor, and a score that is
    // not a healing. Neither sibling's landing language appears here.
    const blob = allStrings().join('\n');
    expect(
      /trained on approval|faithful witness|hurt healed slightly|smooth things|consensus that killed a king/i.test(blob),
      'this lesson teaches the approval-reward landing of week 33'
    ).toBe(false);
    // sov71's landing is the DISCLOSURE ETHIC — the two-sided test for silence.
    expect(/protective silence|concealment withholds|gate shut on purpose/i.test(blob), 'this lesson teaches the disclosure landing of another week').toBe(
      false
    );
    // sov70's landing is THE COORDINATION BUDGET — what must wait on agreement.
    expect(/coordination budget|every one over against his house/i.test(blob), 'this lesson teaches the coordination landing of another week').toBe(false);
    // And this lesson's own landing IS stated, so the case is not purely negative.
    expect(M.bigIdea.includes('WHY A SCORE IS NOT A HEALING'), 'this lesson does not state its own landing').toBe(true);
  });

  it('no reader field recites a decision-record identifier at a reader', () => {
    for (const s of allStrings()) {
      expect(/\bDR-\d{3,4}\b/.test(s), `a reader field recites a decision record: ${s.slice(0, 80)}`).toBe(false);
    }
  });
});

describe('sov73 — the date is derived, never typed', () => {
  it('lesson-dates records this lesson, derived from git and not from the working tree', () => {
    const d = lessonCreatedDay('sovereign-ai', ID);
    expect(d, `${ID} has no lesson-dates entry; run npm run lesson-dates`).toBeTruthy();
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
