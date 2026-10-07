// =============================================================================
// sov34 — the bounded answer: define the options before the model runs, count
// the cost before you build, and except Yahweh build the house (DR-0760)
// =============================================================================
// Week 34 of Sovereign A.I., captured 2026-10-06 by the Gmail-lesson-intake Way
// (DR-0312) from a Level Up Coding system-design newsletter Darrell forwarded
// with one word over it, "Lesson" (Gmail thread 1a111a629d9474b8, "FW: Jev
// Clearly Explained"). The article explains a bounded-decision A.I. tool:
// declare every allowed answer BEFORE the model runs, read the weight it returns
// on each, and keep the rules and the action in plain code. It is reported
// honestly and plainly, in three piles kept apart, and then the Word governs the
// question underneath it — what makes a structure sound. Word first: except
// Yahweh build the house (Psalms 127:1); the builder sits down first and counts
// (Luke 14:28-32); the house on rock against the house on sand (Matthew 7:24-27;
// Luke 6:47-49); the bound set beforehand (Proverbs 8:29; Job 38:11; Proverbs
// 22:28); the just weight (Proverbs 11:1); evidence matched to irreversibility
// (Deuteronomy 19:15; 17:6); the judgment no tool may be handed (1 Samuel 16:7);
// the servant under authority (Luke 7:8).
//
// WEEK 34, NOT 33. Week 33 (DR-0761) was authored in parallel on another branch
// and lands separately; 33 is recorded as held in flight in
// sovereign-ai-class.test.js, following the convention
// living-lessons-id-collision.test.js documents, and that entry is deleted in
// the merge that brings week 33 in. So this gate asserts that week 34 follows
// the highest week already present, not that it sits at a fixed index.
//
// Every quoted verse below was FILLED from app/public/bible/kjv by a generator
// (never typed from memory) and is re-read from the corpus at test time — two
// witnesses. Every non-Scripture double-quoted span in the deep lesson is
// allow-listed to the article's own words or Darrell's marker, so a claim cannot
// enter the lesson in quotation marks unattributed (DR-0076 §8). Proven-to-catch:
// the last block mutates a verse, an unattributed claim, a dropped band close
// and the week order, and shows the gate fails on each.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, ownPrompts } from '../lib/talk-together.js';
import { anchorRefs } from '../lib/search-it-out.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOV34_ID = 'sov34-the-bounded-answer-count-the-cost-before-you-build-and-except-yahweh-build-the-house';
const L = () => SOVEREIGN_AI_MODULES.find((m) => m.id === SOV34_ID);
const FULL_BANDS = ['child', 'youth', 'teen', 'senior'];

const SOV34_FRAGMENTS = {
  "Psalms 127:1": "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain.",
  "Psalms 127:2": "It is vain for you to rise up early, to sit up late, to eat the bread of sorrows: for so he giveth his beloved sleep.",
  "Proverbs 3:19": "The LORD by wisdom hath founded the earth; by understanding hath he established the heavens.",
  "Psalms 11:3": "If the foundations be destroyed, what can the righteous do?",
  "1 Corinthians 3:11": "For other foundation can no man lay than that is laid, which is Jesus Christ.",
  "1 Corinthians 3:12": "Now if any man build upon this foundation gold, silver, precious stones, wood, hay, stubble;",
  "1 Corinthians 3:13": "Every man’s work shall be made manifest: for the day shall declare it, because it shall be revealed by fire; and the fire shall try every man’s work of what sort it is.",
  "Isaiah 28:16": "Therefore thus saith the Lord GOD, Behold, I lay in Zion for a foundation a stone, a tried stone, a precious corner stone, a sure foundation: he that believeth shall not make haste.",
  "Amos 7:7": "Thus he shewed me: and, behold, the Lord stood upon a wall made by a plumbline, with a plumbline in his hand.",
  "Amos 7:8": "And the LORD said unto me, Amos, what seest thou? And I said, A plumbline. Then said the Lord, Behold, I will set a plumbline in the midst of my people Israel: I will not again pass by them any more:",
  "Proverbs 9:1": "Wisdom hath builded her house, she hath hewn out her seven pillars:",
  "Proverbs 24:3": "Through wisdom is an house builded; and by understanding it is established:",
  "Proverbs 24:4": "And by knowledge shall the chambers be filled with all precious and pleasant riches.",
  "1 Corinthians 13:1": "Though I speak with the tongues of men and of angels, and have not charity, I am become as sounding brass, or a tinkling cymbal.",
  "Luke 14:28": "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?",
  "Luke 14:29": "Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him,",
  "Luke 14:30": "Saying, This man began to build, and was not able to finish.",
  "Luke 14:31": "Or what king, going to make war against another king, sitteth not down first, and consulteth whether he be able with ten thousand to meet him that cometh against him with twenty thousand?",
  "Luke 14:32": "Or else, while the other is yet a great way off, he sendeth an ambassage, and desireth conditions of peace.",
  "Proverbs 21:5": "The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.",
  "Proverbs 4:26": "Ponder the path of thy feet, and let all thy ways be established.",
  "Matthew 7:24": "Therefore whosoever heareth these sayings of mine, and doeth them, I will liken him unto a wise man, which built his house upon a rock:",
  "Matthew 7:25": "And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell not: for it was founded upon a rock.",
  "Matthew 7:26": "And every one that heareth these sayings of mine, and doeth them not, shall be likened unto a foolish man, which built his house upon the sand:",
  "Matthew 7:27": "And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell: and great was the fall of it.",
  "Luke 6:47": "Whosoever cometh to me, and heareth my sayings, and doeth them, I will shew you to whom he is like:",
  "Luke 6:48": "He is like a man which built an house, and digged deep, and laid the foundation on a rock: and when the flood arose, the stream beat vehemently upon that house, and could not shake it: for it was founded upon a rock.",
  "Luke 6:49": "But he that heareth, and doeth not, is like a man that without a foundation built an house upon the earth; against which the stream did beat vehemently, and immediately it fell; and the ruin of that house was great.",
  "Proverbs 8:29": "When he gave to the sea his decree, that the waters should not pass his commandment: when he appointed the foundations of the earth:",
  "Job 38:11": "And said, Hitherto shalt thou come, but no further: and here shall thy proud waves be stayed?",
  "Jeremiah 5:22": "Fear ye not me? saith the LORD: will ye not tremble at my presence, which have placed the sand for the bound of the sea by a perpetual decree, that it cannot pass it: and though the waves thereof toss themselves, yet can they not prevail; though they roar, yet can they not pass over it?",
  "Deuteronomy 19:14": "Thou shalt not remove thy neighbour’s landmark, which they of old time have set in thine inheritance, which thou shalt inherit in the land that the LORD thy God giveth thee to possess it.",
  "Proverbs 22:28": "Remove not the ancient landmark, which thy fathers have set.",
  "Matthew 5:37": "But let your communication be, Yea, yea; Nay, nay: for whatsoever is more than these cometh of evil.",
  "James 5:12": "But above all things, my brethren, swear not, neither by heaven, neither by the earth, neither by any other oath: but let your yea be yea; and your nay, nay; lest ye fall into condemnation.",
  "Leviticus 19:35": "Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure.",
  "Leviticus 19:36": "Just balances, just weights, a just ephah, and a just hin, shall ye have: I am the LORD your God, which brought you out of the land of Egypt.",
  "Proverbs 11:1": "A false balance is abomination to the LORD: but a just weight is his delight.",
  "Proverbs 16:11": "A just weight and balance are the LORD’s: all the weights of the bag are his work.",
  "Deuteronomy 25:13": "Thou shalt not have in thy bag divers weights, a great and a small.",
  "Deuteronomy 25:14": "Thou shalt not have in thine house divers measures, a great and a small.",
  "Deuteronomy 25:15": "But thou shalt have a perfect and just weight, a perfect and just measure shalt thou have: that thy days may be lengthened in the land which the LORD thy God giveth thee.",
  "Deuteronomy 19:15": "One witness shall not rise up against a man for any iniquity, or for any sin, in any sin that he sinneth: at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.",
  "Deuteronomy 17:6": "At the mouth of two witnesses, or three witnesses, shall he that is worthy of death be put to death; but at the mouth of one witness he shall not be put to death.",
  "2 Corinthians 13:1": "This is the third time I am coming to you. In the mouth of two or three witnesses shall every word be established.",
  "Proverbs 18:13": "He that answereth a matter before he heareth it, it is folly and shame unto him.",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "Deuteronomy 22:8": "When thou buildest a new house, then thou shalt make a battlement for thy roof, that thou bring not blood upon thine house, if any man fall from thence.",
  "Exodus 21:33": "And if a man shall open a pit, or if a man shall dig a pit, and not cover it, and an ox or an ass fall therein;",
  "Exodus 21:34": "The owner of the pit shall make it good, and give money unto the owner of them; and the dead beast shall be his.",
  "1 Samuel 16:7": "But the LORD said unto Samuel, Look not on his countenance, or on the height of his stature; because I have refused him: for the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart.",
  "Hebrews 4:12": "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.",
  "Jeremiah 17:10": "I the LORD search the heart, I try the reins, even to give every man according to his ways, and according to the fruit of his doings.",
  "Isaiah 11:3": "And shall make him of quick understanding in the fear of the LORD: and he shall not judge after the sight of his eyes, neither reprove after the hearing of his ears:",
  "John 7:24": "Judge not according to the appearance, but judge righteous judgment.",
  "Luke 7:8": "For I also am a man set under authority, having under me soldiers, and I say unto one, Go, and he goeth; and to another, Come, and he cometh; and to my servant, Do this, and he doeth it.",
  "Matthew 8:9": "For I am a man under authority, having soldiers under me: and I say to this man, Go, and he goeth; and to another, Come, and he cometh; and to my servant, Do this, and he doeth it.",
  "Luke 16:10": "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.",
  "Luke 16:11": "If therefore ye have not been faithful in the unrighteous mammon, who will commit to your trust the true riches?",
  "Matthew 25:21": "His lord said unto him, Well done, thou good and faithful servant: thou hast been faithful over a few things, I will make thee ruler over many things: enter thou into the joy of thy lord.",
  "Proverbs 14:15": "The simple believeth every word: but the prudent man looketh well to his going.",
  "James 1:22": "But be ye doers of the word, and not hearers only, deceiving your own selves.",
  "Habakkuk 2:2": "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it.",
  "1 Corinthians 14:40": "Let all things be done decently and in order.",
  "2 Timothy 2:15": "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.",
  "Romans 12:3": "For I say, through the grace given unto me, to every man that is among you, not to think of himself more highly than he ought to think; but to think soberly, according as God hath dealt to every man the measure of faith.",
  "John 1:29": "The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.",
  "John 3:16": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "Colossians 1:17": "And he is before all things, and by him all things consist.",
  "Deuteronomy 6:7": "And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.",
  "Proverbs 27:17": "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.",
  "James 1:19": "Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath:",
};

const SOV34_CORPUS = {
  "Psalms 127:1": ["Psalms",127,1],
  "Psalms 127:2": ["Psalms",127,2],
  "Proverbs 3:19": ["Proverbs",3,19],
  "Psalms 11:3": ["Psalms",11,3],
  "1 Corinthians 3:11": ["1Corinthians",3,11],
  "1 Corinthians 3:12": ["1Corinthians",3,12],
  "1 Corinthians 3:13": ["1Corinthians",3,13],
  "Isaiah 28:16": ["Isaiah",28,16],
  "Amos 7:7": ["Amos",7,7],
  "Amos 7:8": ["Amos",7,8],
  "Proverbs 9:1": ["Proverbs",9,1],
  "Proverbs 24:3": ["Proverbs",24,3],
  "Proverbs 24:4": ["Proverbs",24,4],
  "1 Corinthians 13:1": ["1Corinthians",13,1],
  "Luke 14:28": ["Luke",14,28],
  "Luke 14:29": ["Luke",14,29],
  "Luke 14:30": ["Luke",14,30],
  "Luke 14:31": ["Luke",14,31],
  "Luke 14:32": ["Luke",14,32],
  "Proverbs 21:5": ["Proverbs",21,5],
  "Proverbs 4:26": ["Proverbs",4,26],
  "Matthew 7:24": ["Matthew",7,24],
  "Matthew 7:25": ["Matthew",7,25],
  "Matthew 7:26": ["Matthew",7,26],
  "Matthew 7:27": ["Matthew",7,27],
  "Luke 6:47": ["Luke",6,47],
  "Luke 6:48": ["Luke",6,48],
  "Luke 6:49": ["Luke",6,49],
  "Proverbs 8:29": ["Proverbs",8,29],
  "Job 38:11": ["Job",38,11],
  "Jeremiah 5:22": ["Jeremiah",5,22],
  "Deuteronomy 19:14": ["Deuteronomy",19,14],
  "Proverbs 22:28": ["Proverbs",22,28],
  "Matthew 5:37": ["Matthew",5,37],
  "James 5:12": ["James",5,12],
  "Leviticus 19:35": ["Leviticus",19,35],
  "Leviticus 19:36": ["Leviticus",19,36],
  "Proverbs 11:1": ["Proverbs",11,1],
  "Proverbs 16:11": ["Proverbs",16,11],
  "Deuteronomy 25:13": ["Deuteronomy",25,13],
  "Deuteronomy 25:14": ["Deuteronomy",25,14],
  "Deuteronomy 25:15": ["Deuteronomy",25,15],
  "Deuteronomy 19:15": ["Deuteronomy",19,15],
  "Deuteronomy 17:6": ["Deuteronomy",17,6],
  "2 Corinthians 13:1": ["2Corinthians",13,1],
  "Proverbs 18:13": ["Proverbs",18,13],
  "1 Thessalonians 5:21": ["1Thessalonians",5,21],
  "Deuteronomy 22:8": ["Deuteronomy",22,8],
  "Exodus 21:33": ["Exodus",21,33],
  "Exodus 21:34": ["Exodus",21,34],
  "1 Samuel 16:7": ["1Samuel",16,7],
  "Hebrews 4:12": ["Hebrews",4,12],
  "Jeremiah 17:10": ["Jeremiah",17,10],
  "Isaiah 11:3": ["Isaiah",11,3],
  "John 7:24": ["John",7,24],
  "Luke 7:8": ["Luke",7,8],
  "Matthew 8:9": ["Matthew",8,9],
  "Luke 16:10": ["Luke",16,10],
  "Luke 16:11": ["Luke",16,11],
  "Matthew 25:21": ["Matthew",25,21],
  "Proverbs 14:15": ["Proverbs",14,15],
  "James 1:22": ["James",1,22],
  "Habakkuk 2:2": ["Habakkuk",2,2],
  "1 Corinthians 14:40": ["1Corinthians",14,40],
  "2 Timothy 2:15": ["2Timothy",2,15],
  "Romans 12:3": ["Romans",12,3],
  "John 1:29": ["John",1,29],
  "John 3:16": ["John",3,16],
  "Colossians 1:17": ["Colossians",1,17],
  "Deuteronomy 6:7": ["Deuteronomy",6,7],
  "Proverbs 27:17": ["Proverbs",27,17],
  "James 1:19": ["James",1,19],
};

// The only non-Scripture double-quoted spans the deep lesson may carry: the
// article's own words (attributed in the text) and Darrell's marker. Each was
// read from the forwarded email (Gmail thread 1a111a629d9474b8) when generated.
const SOV34_ALLOWED = [
  '"Lesson"',
  '"Jev"',
  '"Traditional software works well when the rules are clear. LLMs work well when the problem is open-ended."',
  '"Jev is built for that middle layer."',
  '"Instead of generating free-form text, Jev turns unstructured input into a bounded decision with probabilities that application code can use directly."',
  '"It may sound like a small distinction, but it changes where AI sits inside your system."',
  '"You end up using a model that can write an essay to produce something your code wants to treat like an enum."',
  '"The input being judged, such as a support ticket, agent trace, policy excerpt, or JSON record."',
  '"The judgments you want Jev to make, with the possible answers defined up front."',
  '"Select one option from a predefined set and return probabilities across the options."',
  '"Place something on an ordered scale with defined levels."',
  '"Estimate the probability that a yes/no statement is true."',
  '"The possible answers are defined before the model runs, rather than generating free-form text and constraining it afterward."',
  '"If you give it three valid support teams, the result must stay within those three options; it cannot invent a fourth option."',
  '"Jev is trained for calibrated decisions."',
  '"In simple terms, its probabilities are meant to reflect how confident the model is across many similar predictions."',
  '"The threshold depends on the cost of being wrong."',
  '"Sending someone to the wrong help page is easy to recover from. Triggering an irreversible action should require much stronger confidence."',
  '"Vague questions can produce misleading results because Jev judges what you ask, not what you intended."',
  '"Arithmetic, counting, and date comparisons are better handled in deterministic code."',
  '"Accuracy can drop when a decision depends on several reasoning steps."',
  '"Irrelevant information can distract the model and weaken the result."',
  '"Text designed to influence its own classification can affect the judgment."',
  '"Images, audio, and video need separate processing."',
  '"Use deterministic code for arithmetic, permissions, limits, and explicit rules."',
  '"Changing instructions or criteria can change application behavior."',
  '"Test performance and thresholds before switching versions."',
  '"Confidence matters, but production accuracy matters more."',
  '"Ambiguous cases should escalate instead of being forced into automation."',
  '"Treat external text as untrusted when it can influence important decisions."',
  '"Do you already know the possible answers?"',
  '"Is the hard part interpreting ambiguous input rather than computing an exact result?"',
  '"Use Jev when the output is known, but the input is too messy for a reliable rule."',
  '"Jev works best alongside LLMs, not as a replacement of them."',
  '"Jev can sit before an LLM, after one, or inside an agent loop."',
  '"Often, the stronger architecture does the opposite. It gives the model a narrower job, makes uncertainty visible, and keeps the workflow in software."',
  '"The model handles the ambiguity."',
  '"The application still decides what happens next."',
  '"The model makes the judgment. The software decides what happens next."',
  '"LLMs handle open-ended work. Jev handles bounded ambiguity. Code controls the workflow."',
];

const corpusVerse = (book, ch, v) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

// The checks, as pure functions, so the proven-to-catch block runs the SAME
// checks against a mutated copy and shows they fail.
function missingVerbatim(mod) {
  const bad = [];
  for (const [ref, fragment] of Object.entries(SOV34_FRAGMENTS)) {
    if (!mod.lesson.includes(`"${fragment}" (${ref})`)) bad.push(ref);
  }
  return bad;
}
function unpinnedQuotesInOtherFields(mod) {
  const strings = [];
  const walk = (o) => { if (typeof o === 'string') strings.push(o); else if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') Object.values(o).forEach(walk); };
  walk({ ...mod, lesson: '' });
  const re = /"([^"]+)"\s*\(((?:[1-3] )?[A-Za-z]+ \d+:\d+)\)/g;
  const bad = [];
  let seen = 0;
  let m;
  while ((m = re.exec(strings.join('\n')))) {
    const [, q, ref] = m;
    const pinned = SOV34_FRAGMENTS[ref];
    seen += 1;
    if (!pinned || !pinned.includes(q)) bad.push(`${ref}: ${q}`);
  }
  return { bad, seen };
}
function unattributedQuotes(mod) {
  const isWord = (q) => Object.values(SOV34_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
  const nonScripture = (mod.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
  return { nonScripture, bad: nonScripture.filter((q) => !SOV34_ALLOWED.includes(q)) };
}
// Week 34 follows every week already present and precedes every later one —
// 34 after 32 while 33 was held in flight, 34 after 33 once that lane landed.
// It was ALSO asserted to be LAST, until week 35 (the new players) landed.
// "Last" was never the property this gate wanted; it was a proxy for it while
// 34 happened to be the newest week, and a proxy that makes the next lesson's
// merge red is the wrong proxy. The real property is the ORDER, asserted in
// both directions, so a later sibling week is not a red build while a week
// filed out of order still fails.
function orderProblem(modules) {
  const at = modules.findIndex((w) => w.id === SOV34_ID);
  if (at < 1) return 'sov34 missing';
  const n = (m) => Number((/^sov(\d+)-/.exec(m.id) || [])[1]);
  const mine = n(modules[at]);
  if (mine !== 34) return `sov34 parses as week ${mine}`;
  for (const other of modules.slice(0, at)) {
    if (!(n(other) < mine)) return `week ${n(other)} is not before week ${mine}`;
  }
  for (const other of modules.slice(at + 1)) {
    if (!(n(other) > mine)) return `week ${n(other)} is not after week ${mine}`;
  }
  return null;
}

const MOVEMENTS = [
  'FIRST, EXCEPT YAHWEH BUILD THE HOUSE - THE FOUNDATION IS SETTLED BEFORE ANY DESIGN IS DRAWN.',
  'SECOND, WHAT THE ARTICLE EXPLAINED - PLAINLY, AND HOW THIS HOUSE HOLDS IT.',
  'THIRD, SITTETH NOT DOWN FIRST AND COUNTETH THE COST - THE TOWER AND THE WAR.',
  'FOURTH, UPON A ROCK OR UPON THE SAND - THE SAME STORM, TWO FOUNDATIONS.',
  'FIFTH, HITHERTO SHALT THOU COME - THE BOUND SET BEFORE THE WORK IS A MERCY, NOT A CAGE.',
  'SIXTH, YEA, YEA; NAY, NAY - THE PLAIN ANSWER AND THE JUST WEIGHT.',
  'SEVENTH, AT THE MOUTH OF TWO WITNESSES - WHAT A NARROW MARGIN MAY DO, AND WHAT IT MAY NOT.',
  'EIGHTH, MAN LOOKETH ON THE OUTWARD APPEARANCE - THE JUDGMENT NO TOOL MAY BE HANDED.',
  'NINTH, A MAN SET UNDER AUTHORITY - WHO DECIDES WHAT HAPPENS NEXT.',
  'TENTH, THROUGH WISDOM IS AN HOUSE BUILDED - WHAT WE DO, AND WHO HOLDS IT ALL TOGETHER.',
];

describe('sov34 — the bounded answer quotes its whole spine verbatim, Word first', () => {
  it('the week exists, last in the series and after every week already present, anchored on the house Yahweh builds and the cost counted first', () => {
    expect(L()).toBeTruthy();
    expect(orderProblem(SOVEREIGN_AI_MODULES)).toBeNull();
    expect(L().rpe.research && L().rpe.plan && L().rpe.execute).toBeTruthy();
    expect(L().anchor.ref).toContain('Psalms 127:1');
    expect(L().anchor.ref).toContain('Luke 14:28');
    expect(L().anchor.theme).toContain(`"${SOV34_FRAGMENTS['Psalms 127:1']}" (Psalms 127:1)`);
    expect(L().anchor.theme).toContain(`"${SOV34_FRAGMENTS['Luke 14:28']}" (Luke 14:28)`);
  });
  it('anchor.ref names every verse the lesson quotes in full, so Search it out derives its links from the real spine (DR-0734)', () => {
    const refs = new Set(anchorRefs(L()));
    for (const ref of Object.keys(SOV34_FRAGMENTS)) expect(refs.has(ref), `anchor.ref names ${ref}`).toBe(true);
  });
  it('every pinned fragment appears letter-for-letter in the deep lesson, named beside its quote', () => {
    // Derived, not a literal count (DR-0677): the pins and the corpus map are the same set.
    expect(Object.keys(SOV34_FRAGMENTS).length).toBeGreaterThanOrEqual(70);
    expect(Object.keys(SOV34_CORPUS).sort()).toEqual(Object.keys(SOV34_FRAGMENTS).sort());
    expect(missingVerbatim(L())).toEqual([]);
  });
  it('every fragment matches the repo KJV corpus exactly, not memory (two witnesses)', () => {
    for (const [ref, fragment] of Object.entries(SOV34_FRAGMENTS)) {
      const at = SOV34_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(corpusVerse(...at), `${ref} corpus`).toBe(fragment);
    }
  });
  it('every quoted verse in the other fields (bigIdea, anchor, benefits, bands, quiz, facilitator) is a piece of a pinned verse', () => {
    const { bad, seen } = unpinnedQuotesInOtherFields(L());
    expect(bad).toEqual([]);
    expect(seen).toBeGreaterThan(180);
  });
  it('the Word LEADS: the foundation Yahweh lays is taught before the article is reported', () => {
    expect(L().lesson.indexOf(MOVEMENTS[0])).toBe(0);
    expect(L().lesson.indexOf('(Psalms 127:1)')).toBeLessThan(L().lesson.indexOf('SECOND,'));
    expect(L().lesson.indexOf('(Proverbs 24:3)')).toBeLessThan(L().lesson.indexOf('Level Up Coding'));
  });
  it('the ten movements are carried in order', () => {
    let last = -1;
    for (const h of MOVEMENTS) {
      const at = L().lesson.indexOf(h);
      expect(at, `movement in order: ${h}`).toBeGreaterThan(last);
      last = at;
    }
    // The tower and the war are Luke 14, taught inside the third movement.
    for (const v of ['Luke 14:28', 'Luke 14:29', 'Luke 14:30', 'Luke 14:31', 'Luke 14:32']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeGreaterThan(L().lesson.indexOf('THIRD,'));
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('FOURTH,'));
    }
    // The two houses are taught inside the fourth.
    for (const v of ['Matthew 7:24', 'Matthew 7:25', 'Matthew 7:26', 'Matthew 7:27', 'Luke 6:48', 'Luke 6:49']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeGreaterThan(L().lesson.indexOf('FOURTH,'));
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('FIFTH,'));
    }
    // The just weight is taught inside the sixth.
    for (const v of ['Proverbs 11:1', 'Leviticus 19:36', 'Deuteronomy 25:15']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeGreaterThan(L().lesson.indexOf('SIXTH,'));
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('SEVENTH,'));
    }
  });
  it('the article is explained honestly and in full enough that the reader understands the thing', () => {
    const lesson = L().lesson;
    for (const piece of [
      '"Jev is built for that middle layer."',
      '"The possible answers are defined before the model runs, rather than generating free-form text and constraining it afterward."',
      '"Estimate the probability that a yes/no statement is true."',
      '"The threshold depends on the cost of being wrong."',
      '"LLMs handle open-ended work. Jev handles bounded ambiguity. Code controls the workflow."',
    ]) expect(lesson, piece).toContain(piece);
    // The name and the answer types are reported as the issue spelled them.
    expect(lesson).toContain('Noul');
    expect(lesson).toContain('Jev Clearly Explained');
    expect(lesson).toContain('2026-10-06');
  });
  it('provenance is honest: the article attributed, our own ground named with its limit, the unchecked named and NOT taught as fact', () => {
    const lesson = L().lesson;
    expect(lesson).toContain('FIRST PILE, WHAT THE ARTICLE SAID, attributed to it.');
    expect(lesson).toContain('SECOND PILE, WHAT THIS HOUSE HAS ALREADY BUILT ON THIS PATTERN');
    expect(lesson).toContain('THIRD PILE, WHAT WE DID NOT CHECK, and so do not teach as fact.');
    const third = lesson.indexOf('THIRD PILE');
    for (const unchecked of [
      'We did not use the tool',
      'we did not read any benchmark or model card behind it',
      'it is an advertisement and is not taught here',
      'an A.I. agent drafted this page from the forwarded email',
    ]) expect(lesson.indexOf(unchecked, third), unchecked).toBeGreaterThan(third);
    // The limit on our own pile is said, not hidden.
    expect(lesson).toContain('we have not run this product, we hold no measurement of our own about it');
    const { nonScripture, bad } = unattributedQuotes(L());
    expect(nonScripture.length).toBeGreaterThanOrEqual(30);
    expect(bad).toEqual([]);
  });
  it('speaks established fact plainly and flags narrowly (DR-0100): three tiers, over-reach corrected both ways', () => {
    const lesson = L().lesson;
    expect(lesson).toContain('Established, and stated plainly:');
    expect(lesson).toContain('That is real, and it is not to be shrunk into nothing.');
    expect(lesson).toContain('Open, and named narrowly:');
    expect(lesson).toContain('Over-reach, corrected both ways:');
    // Never the hedge-word: the unchecked is named by what it is.
    expect(JSON.stringify(L())).not.toMatch(/not verified/i);
  });
  it('teaches, never debates (DR-0098): no both-sides staging, and the Word is the authority', () => {
    const lesson = L().lesson;
    expect(lesson).not.toMatch(/some say|others say|scholars (?:are )?(?:divided|debate)|you decide/i);
    expect(L().bigIdea).toContain('the Word already governs the question under it');
  });
  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized; the Lamb confessed', () => {
    const ours = JSON.stringify(L()).replace(/\\"[^"\\]+\\"/g, '');
    const strip = (t) => t.replace(/"[^"]+"/g, '');
    expect(strip(L().lesson)).not.toMatch(/\bGod\b/);
    for (const f of ['bigIdea', 'inApp', 'title']) expect(strip(L()[f]), f).not.toMatch(/\bGod\b/);
    for (const b of FULL_BANDS) expect(strip(L().levels[b]), b).not.toMatch(/\bGod\b/);
    expect(ours).toMatch(/Yahweh/);
    expect(JSON.stringify(L())).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
    expect(L().lesson).toContain('the Word');
    expect(L().lesson).toMatch(/the Son of Yahweh, the Lamb/);
    expect(L().lesson).toContain('(John 1:29)');
    // Readers are never handed our bookkeeping: no record id, no percent sign.
    expect(JSON.stringify(L())).not.toMatch(/DR-\d{4}/);
    expect(JSON.stringify(L())).not.toMatch(/%/);
  });
  it('all four age bands are authored, each a full reading that names its lesson and ends by sending the reader to someone (P60, DR-0733)', () => {
    for (const b of FULL_BANDS) {
      expect(L().levels[b].length, b).toBeGreaterThan(2500);
      expect(L().levels[b].slice(0, 80), b).toContain('The bounded answer:');
      expect(L().levels[b], b).toContain('TALK ABOUT IT TOGETHER.');
      expect(hasAllThree({ lesson: L().levels[b] }), `${b} band carries all three directions`).toBe(true);
    }
    expect(L().lesson).toContain('TALK ABOUT IT TOGETHER.');
    expect(hasAllThree(L())).toBe(true);
    const own = ownPrompts(L());
    expect(own.parents).toMatch(/Parents, ask your child/);
    expect(own.children).toMatch(/ask your mom, dad or grandparent/);
    expect(own.friends).toBeTruthy();
    expect(L().lesson).toMatch(/Friends, tell one friend this week/);
    // the skill and the rhythm ride every close
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {
      expect(t).toMatch(/listen(?:ing)? (?:all the way )?to the end|listen all the way through|listen before you/);
      expect(t).toContain('Deuteronomy 6:7');
    }
    expect(L().quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of L().quiz.questions) expect(q.options[q.answer], q.q).toBeTruthy();
  });
  it('the bands ascend: each older band is a fuller reading than the one before it', () => {
    const len = FULL_BANDS.map((b) => L().levels[b].length);
    for (let i = 1; i < len.length; i += 1) expect(len[i], FULL_BANDS[i]).toBeGreaterThan(len[i - 1]);
  });
});

describe('sov34 — proven-to-catch: the gate fails on a drifted verse, an unattributed claim, a dropped close, or drifted doors', () => {
  it('the pinned ground truth is itself exact', () => {
    expect(SOV34_FRAGMENTS['Psalms 127:1']).toBe('Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain.');
    expect(SOV34_FRAGMENTS['Luke 14:28']).toBe('For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?');
    expect(SOV34_FRAGMENTS['Matthew 7:25']).toBe('And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell not: for it was founded upon a rock.');
    expect(SOV34_FRAGMENTS['Proverbs 11:1']).toBe('A false balance is abomination to the LORD: but a just weight is his delight.');
    // The corpus apostrophe is typographic; a straight one would be a silent drift.
    expect(SOV34_FRAGMENTS['Deuteronomy 19:14']).toContain('neighbour’s landmark');
  });
  it('a one-word drift of Psalms 127:1 in the lesson is caught', () => {
    const drifted = { ...L(), lesson: L().lesson.split('they labour in vain that build it').join('they labor in vain that build it') };
    expect(missingVerbatim(drifted)).toContain('Psalms 127:1');
  });
  it('a drifted verse in another field (the teen band) is caught', () => {
    const t = L().levels.teen;
    const drifted = { ...L(), levels: { ...L().levels, teen: t.split('it fell not: for it was founded upon a rock').join('it fell not, for it was founded upon a rock') } };
    expect(unpinnedQuotesInOtherFields(drifted).bad.some((b) => b.startsWith('Matthew 7:25'))).toBe(true);
  });
  it('an unattributed claim smuggled into the lesson in quotation marks is caught', () => {
    const smuggled = { ...L(), lesson: `${L().lesson} "This tool is faster and cheaper than every large language model."` };
    expect(unattributedQuotes(smuggled).bad).toEqual(['"This tool is faster and cheaper than every large language model."']);
  });
  it('a lesson that drops TALK ABOUT IT TOGETHER from its bands loses the children-to-parents direction and fails the three-direction rule', () => {
    const strip = (t) => t.split('TALK ABOUT IT TOGETHER.')[0];
    const cut = { ...L(), levels: { child: strip(L().levels.child), youth: strip(L().levels.youth), teen: strip(L().levels.teen), senior: strip(L().levels.senior) } };
    expect(ownPrompts(cut).children).toBe('');
    expect(hasAllThree(cut)).toBe(false);
  });
  it('week 34 missing, or filed out of order in either direction, is caught — while a genuinely later week is not', () => {
    expect(orderProblem(SOVEREIGN_AI_MODULES.filter((w) => w.id !== SOV34_ID))).toBe('sov34 missing');
    const earlierTooHigh = [...SOVEREIGN_AI_MODULES];
    earlierTooHigh.splice(earlierTooHigh.findIndex((w) => w.id === SOV34_ID), 0, { id: 'sov99-a-week-from-the-future' });
    expect(orderProblem(earlierTooHigh)).toMatch(/week 99 is not before week 34/);
    const laterTooLow = [...SOVEREIGN_AI_MODULES, { id: 'sov5-a-duplicated-week' }];
    expect(orderProblem(laterTooLow)).toMatch(/week 5 is not after week 34/);
    // Week 35 landing after week 34 is the normal case, not a defect.
    expect(orderProblem([...SOVEREIGN_AI_MODULES, { id: 'sov36-a-sibling-lane' }])).toBeNull();
  });
  it('a band that stops naming its lesson, or falls under a full reading, is caught', () => {
    const thin = 'The bounded answer: pick the answers first. TALK ABOUT IT TOGETHER.';
    expect(thin.length).toBeLessThan(2500);
    expect(hasAllThree({ lesson: thin })).toBe(false);
  });
});
