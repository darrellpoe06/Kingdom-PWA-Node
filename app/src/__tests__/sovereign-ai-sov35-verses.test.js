// =============================================================================
// sov35 — the new players: open weights, a just weight, and the One who putteth
// down one and setteth up another
// =============================================================================
// Week 35 of Sovereign A.I., captured 2026-10-07 by the Gmail-lesson-intake Way
// from a Morning Brew newsletter Darrell forwarded with one word over it,
// "Lesson" (thread 1a11666c0798845c, "Fw: The new players"). The newsletter
// reports two Western companies releasing open-weight models — models whose
// learned numbers may be downloaded, kept and adapted on hardware the operator
// owns. It is reported honestly and plainly, in three piles kept apart, and
// then the Word governs the question underneath it. Word first: the industry
// announced OPEN weights and Yahweh has always required a JUST weight
// (Proverbs 11:1; 16:11; Leviticus 19:35-36; Micah 6:11) — openness is ACCESS,
// justness is TRUTH; a new player's seat is granted by the Judge (Psalms
// 75:6-7; Daniel 2:21; 1 Samuel 2:7-8); scale is not a foundation (Psalms
// 33:17; Zechariah 4:6); the alterable artefact is held against the one
// standard no one may alter (Deuteronomy 4:2; Proverbs 30:5-6; Psalms 119:89);
// proving is a practice, not a property (1 Thessalonians 5:21; Acts 17:11;
// Deuteronomy 19:15); judgment is on the work, never the face (Leviticus
// 19:15; Acts 10:34-35; John 7:24); one lamp has two effects (Luke 12:2-3;
// Ephesians 5:11-13; John 3:19-21); and the readable bill is stewardship
// (Proverbs 27:23-24; Proverbs 23:4-5).
//
// WEEK 35 FOLLOWS THE HIGHEST WEEK PRESENT, it is not pinned to an index. A
// sibling lane holds week 36; when that lands this gate still passes, and a
// week inserted out of order still fails. The convention is the one
// living-lessons-id-collision.test.js documents.
//
// Every quoted verse below was FILLED from app/public/bible/kjv by a generator
// (never typed from memory) and is re-read from the corpus at test time — two
// witnesses. Every non-Scripture double-quoted span on any surface is
// allow-listed to the newsletter's own words, the names it reports, or a label
// this lesson itself defines, so a claim cannot enter in quotation marks
// unattributed (DR-0076 §8). Proven-to-catch: the last block mutates a verse,
// smuggles an unattributed claim, drops a band close and misfiles the week, and
// shows the gate fails on each.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, ownPrompts } from '../lib/talk-together.js';
import { anchorRefs } from '../lib/search-it-out.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOV35_ID = 'sov35-the-new-players-open-weights-a-just-weight-and-who-setteth-up-another';
const L = () => SOVEREIGN_AI_MODULES.find((m) => m.id === SOV35_ID);
const FULL_BANDS = ['child', 'youth', 'teen', 'senior'];

const SOV35_FRAGMENTS = {
  "Proverbs 11:1": "A false balance is abomination to the LORD: but a just weight is his delight.",
  "Proverbs 16:11": "A just weight and balance are the LORD’s: all the weights of the bag are his work.",
  "Deuteronomy 25:13": "Thou shalt not have in thy bag divers weights, a great and a small.",
  "Deuteronomy 25:14": "Thou shalt not have in thine house divers measures, a great and a small.",
  "Deuteronomy 25:15": "But thou shalt have a perfect and just weight, a perfect and just measure shalt thou have: that thy days may be lengthened in the land which the LORD thy God giveth thee.",
  "Leviticus 19:35": "Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure.",
  "Leviticus 19:36": "Just balances, just weights, a just ephah, and a just hin, shall ye have: I am the LORD your God, which brought you out of the land of Egypt.",
  "Micah 6:11": "Shall I count them pure with the wicked balances, and with the bag of deceitful weights?",
  "Proverbs 18:13": "He that answereth a matter before he heareth it, it is folly and shame unto him.",
  "Psalms 75:6": "For promotion cometh neither from the east, nor from the west, nor from the south.",
  "Psalms 75:7": "But God is the judge: he putteth down one, and setteth up another.",
  "Daniel 2:21": "And he changeth the times and the seasons: he removeth kings, and setteth up kings: he giveth wisdom unto the wise, and knowledge to them that know understanding:",
  "1 Samuel 2:7": "The LORD maketh poor, and maketh rich: he bringeth low, and lifteth up.",
  "1 Samuel 2:8": "He raiseth up the poor out of the dust, and lifteth up the beggar from the dunghill, to set them among princes, and to make them inherit the throne of glory: for the pillars of the earth are the LORD’s, and he hath set the world upon them.",
  "Ecclesiastes 9:11": "I returned, and saw under the sun, that the race is not to the swift, nor the battle to the strong, neither yet bread to the wise, nor yet riches to men of understanding, nor yet favour to men of skill; but time and chance happeneth to them all.",
  "Isaiah 40:23": "That bringeth the princes to nothing; he maketh the judges of the earth as vanity.",
  "Proverbs 21:1": "The king’s heart is in the hand of the LORD, as the rivers of water: he turneth it whithersoever he will.",
  "Psalms 20:7": "Some trust in chariots, and some in horses: but we will remember the name of the LORD our God.",
  "Psalms 33:16": "There is no king saved by the multitude of an host: a mighty man is not delivered by much strength.",
  "Psalms 33:17": "An horse is a vain thing for safety: neither shall he deliver any by his great strength.",
  "Psalms 147:10": "He delighteth not in the strength of the horse: he taketh not pleasure in the legs of a man.",
  "Psalms 147:11": "The LORD taketh pleasure in them that fear him, in those that hope in his mercy.",
  "Zechariah 4:6": "Then he answered and spake unto me, saying, This is the word of the LORD unto Zerubbabel, saying, Not by might, nor by power, but by my spirit, saith the LORD of hosts.",
  "1 Corinthians 1:27": "But God hath chosen the foolish things of the world to confound the wise; and God hath chosen the weak things of the world to confound the things which are mighty;",
  "Jeremiah 9:23": "Thus saith the LORD, Let not the wise man glory in his wisdom, neither let the mighty man glory in his might, let not the rich man glory in his riches:",
  "Jeremiah 9:24": "But let him that glorieth glory in this, that he understandeth and knoweth me, that I am the LORD which exercise lovingkindness, judgment, and righteousness, in the earth: for in these things I delight, saith the LORD.",
  "Deuteronomy 4:2": "Ye shall not add unto the word which I command you, neither shall ye diminish ought from it, that ye may keep the commandments of the LORD your God which I command you.",
  "Deuteronomy 12:32": "What thing soever I command you, observe to do it: thou shalt not add thereto, nor diminish from it.",
  "Proverbs 30:5": "Every word of God is pure: he is a shield unto them that put their trust in him.",
  "Proverbs 30:6": "Add thou not unto his words, lest he reprove thee, and thou be found a liar.",
  "Revelation 22:18": "For I testify unto every man that heareth the words of the prophecy of this book, If any man shall add unto these things, God shall add unto him the plagues that are written in this book:",
  "Revelation 22:19": "And if any man shall take away from the words of the book of this prophecy, God shall take away his part out of the book of life, and out of the holy city, and from the things which are written in this book.",
  "Isaiah 40:8": "The grass withereth, the flower fadeth: but the word of our God shall stand for ever.",
  "Matthew 24:35": "Heaven and earth shall pass away, but my words shall not pass away.",
  "Psalms 119:89": "For ever, O LORD, thy word is settled in heaven.",
  "Psalms 12:6": "The words of the LORD are pure words: as silver tried in a furnace of earth, purified seven times.",
  "Psalms 12:7": "Thou shalt keep them, O LORD, thou shalt preserve them from this generation for ever.",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "Acts 17:11": "These were more noble than those in Thessalonica, in that they received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.",
  "1 John 4:1": "Beloved, believe not every spirit, but try the spirits whether they are of God: because many false prophets are gone out into the world.",
  "Deuteronomy 19:15": "One witness shall not rise up against a man for any iniquity, or for any sin, in any sin that he sinneth: at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.",
  "2 Corinthians 13:1": "This is the third time I am coming to you. In the mouth of two or three witnesses shall every word be established.",
  "Proverbs 18:17": "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.",
  "Proverbs 14:15": "The simple believeth every word: but the prudent man looketh well to his going.",
  "Proverbs 27:12": "A prudent man foreseeth the evil, and hideth himself; but the simple pass on, and are punished.",
  "1 Corinthians 14:40": "Let all things be done decently and in order.",
  "Leviticus 19:15": "Ye shall do no unrighteousness in judgment: thou shalt not respect the person of the poor, nor honor the person of the mighty: but in righteousness shalt thou judge thy neighbour.",
  "Deuteronomy 1:17": "Ye shall not respect persons in judgment; but ye shall hear the small as well as the great; ye shall not be afraid of the face of man; for the judgment is God’s: and the cause that is too hard for you, bring it unto me, and I will hear it.",
  "John 7:24": "Judge not according to the appearance, but judge righteous judgment.",
  "Acts 10:34": "Then Peter opened his mouth, and said, Of a truth I perceive that God is no respecter of persons:",
  "Acts 10:35": "But in every nation he that feareth him, and worketh righteousness, is accepted with him.",
  "James 2:1": "My brethren, have not the faith of our Lord Jesus Christ, the Lord of glory, with respect of persons.",
  "James 2:4": "Are ye not then partial in yourselves, and are become judges of evil thoughts?",
  "Proverbs 24:23": "These things also belong to the wise. It is not good to have respect of persons in judgment.",
  "Luke 12:2": "For there is nothing covered, that shall not be revealed; neither hid, that shall not be known.",
  "Luke 12:3": "Therefore whatsoever ye have spoken in darkness shall be heard in the light; and that which ye have spoken in the ear in closets shall be proclaimed upon the housetops.",
  "Matthew 10:26": "Fear them not therefore: for there is nothing covered, that shall not be revealed; and hid, that shall not be known.",
  "Ephesians 5:11": "And have no fellowship with the unfruitful works of darkness, but rather reprove them.",
  "Ephesians 5:12": "For it is a shame even to speak of those things which are done of them in secret.",
  "Ephesians 5:13": "But all things that are reproved are made manifest by the light: for whatsoever doth make manifest is light.",
  "John 3:19": "And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.",
  "John 3:20": "For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.",
  "John 3:21": "But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.",
  "Proverbs 10:9": "He that walketh uprightly walketh surely: but he that perverteth his ways shall be known.",
  "Proverbs 28:13": "He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy.",
  "Proverbs 27:23": "Be thou diligent to know the state of thy flocks, and look well to thy herds.",
  "Proverbs 27:24": "For riches are not for ever: and doth the crown endure to every generation?",
  "Luke 16:10": "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.",
  "Luke 16:11": "If therefore ye have not been faithful in the unrighteous mammon, who will commit to your trust the true riches?",
  "Proverbs 23:4": "Labour not to be rich: cease from thine own wisdom.",
  "Proverbs 23:5": "Wilt thou set thine eyes upon that which is not? for riches certainly make themselves wings; they fly away as an eagle toward heaven.",
  "1 Timothy 6:17": "Charge them that are rich in this world, that they be not highminded, nor trust in uncertain riches, but in the living God, who giveth us richly all things to enjoy;",
  "Proverbs 22:3": "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.",
  "Proverbs 24:3": "Through wisdom is an house builded; and by understanding it is established:",
  "Proverbs 24:4": "And by knowledge shall the chambers be filled with all precious and pleasant riches.",
  "Psalms 127:1": "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain.",
  "Proverbs 11:14": "Where no counsel is, the people fall: but in the multitude of counsellors there is safety.",
  "Colossians 1:16": "For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him:",
  "Colossians 1:17": "And he is before all things, and by him all things consist.",
  "John 1:29": "The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.",
  "John 3:16": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "Hebrews 13:8": "Jesus Christ the same yesterday, and to day, and for ever.",
  "Galatians 5:22": "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,",
  "Deuteronomy 6:7": "And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.",
  "Proverbs 27:17": "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.",
  "James 1:19": "Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath:",
};

const SOV35_CORPUS = {
  "Proverbs 11:1": ["Proverbs",11,1],
  "Proverbs 16:11": ["Proverbs",16,11],
  "Deuteronomy 25:13": ["Deuteronomy",25,13],
  "Deuteronomy 25:14": ["Deuteronomy",25,14],
  "Deuteronomy 25:15": ["Deuteronomy",25,15],
  "Leviticus 19:35": ["Leviticus",19,35],
  "Leviticus 19:36": ["Leviticus",19,36],
  "Micah 6:11": ["Micah",6,11],
  "Proverbs 18:13": ["Proverbs",18,13],
  "Psalms 75:6": ["Psalms",75,6],
  "Psalms 75:7": ["Psalms",75,7],
  "Daniel 2:21": ["Daniel",2,21],
  "1 Samuel 2:7": ["1Samuel",2,7],
  "1 Samuel 2:8": ["1Samuel",2,8],
  "Ecclesiastes 9:11": ["Ecclesiastes",9,11],
  "Isaiah 40:23": ["Isaiah",40,23],
  "Proverbs 21:1": ["Proverbs",21,1],
  "Psalms 20:7": ["Psalms",20,7],
  "Psalms 33:16": ["Psalms",33,16],
  "Psalms 33:17": ["Psalms",33,17],
  "Psalms 147:10": ["Psalms",147,10],
  "Psalms 147:11": ["Psalms",147,11],
  "Zechariah 4:6": ["Zechariah",4,6],
  "1 Corinthians 1:27": ["1Corinthians",1,27],
  "Jeremiah 9:23": ["Jeremiah",9,23],
  "Jeremiah 9:24": ["Jeremiah",9,24],
  "Deuteronomy 4:2": ["Deuteronomy",4,2],
  "Deuteronomy 12:32": ["Deuteronomy",12,32],
  "Proverbs 30:5": ["Proverbs",30,5],
  "Proverbs 30:6": ["Proverbs",30,6],
  "Revelation 22:18": ["Revelation",22,18],
  "Revelation 22:19": ["Revelation",22,19],
  "Isaiah 40:8": ["Isaiah",40,8],
  "Matthew 24:35": ["Matthew",24,35],
  "Psalms 119:89": ["Psalms",119,89],
  "Psalms 12:6": ["Psalms",12,6],
  "Psalms 12:7": ["Psalms",12,7],
  "1 Thessalonians 5:21": ["1Thessalonians",5,21],
  "Acts 17:11": ["Acts",17,11],
  "1 John 4:1": ["1John",4,1],
  "Deuteronomy 19:15": ["Deuteronomy",19,15],
  "2 Corinthians 13:1": ["2Corinthians",13,1],
  "Proverbs 18:17": ["Proverbs",18,17],
  "Proverbs 14:15": ["Proverbs",14,15],
  "Proverbs 27:12": ["Proverbs",27,12],
  "1 Corinthians 14:40": ["1Corinthians",14,40],
  "Leviticus 19:15": ["Leviticus",19,15],
  "Deuteronomy 1:17": ["Deuteronomy",1,17],
  "John 7:24": ["John",7,24],
  "Acts 10:34": ["Acts",10,34],
  "Acts 10:35": ["Acts",10,35],
  "James 2:1": ["James",2,1],
  "James 2:4": ["James",2,4],
  "Proverbs 24:23": ["Proverbs",24,23],
  "Luke 12:2": ["Luke",12,2],
  "Luke 12:3": ["Luke",12,3],
  "Matthew 10:26": ["Matthew",10,26],
  "Ephesians 5:11": ["Ephesians",5,11],
  "Ephesians 5:12": ["Ephesians",5,12],
  "Ephesians 5:13": ["Ephesians",5,13],
  "John 3:19": ["John",3,19],
  "John 3:20": ["John",3,20],
  "John 3:21": ["John",3,21],
  "Proverbs 10:9": ["Proverbs",10,9],
  "Proverbs 28:13": ["Proverbs",28,13],
  "Proverbs 27:23": ["Proverbs",27,23],
  "Proverbs 27:24": ["Proverbs",27,24],
  "Luke 16:10": ["Luke",16,10],
  "Luke 16:11": ["Luke",16,11],
  "Proverbs 23:4": ["Proverbs",23,4],
  "Proverbs 23:5": ["Proverbs",23,5],
  "1 Timothy 6:17": ["1Timothy",6,17],
  "Proverbs 22:3": ["Proverbs",22,3],
  "Proverbs 24:3": ["Proverbs",24,3],
  "Proverbs 24:4": ["Proverbs",24,4],
  "Psalms 127:1": ["Psalms",127,1],
  "Proverbs 11:14": ["Proverbs",11,14],
  "Colossians 1:16": ["Colossians",1,16],
  "Colossians 1:17": ["Colossians",1,17],
  "John 1:29": ["John",1,29],
  "John 3:16": ["John",3,16],
  "Hebrews 13:8": ["Hebrews",13,8],
  "Galatians 5:22": ["Galatians",5,22],
  "Deuteronomy 6:7": ["Deuteronomy",6,7],
  "Proverbs 27:17": ["Proverbs",27,17],
  "James 1:19": ["James",1,19],
};

const SOV35_ALLOWED = [
  "\"Lesson\"",
  "\"download and customize them with their own proprietary data\"",
  "\"The new players\"",
  "\"Open weight means that, unlike with closed weight models, users can download and customize them with their own proprietary data.\"",
  "\"It is from far away, so it is bad.\"",
  "\"It is from near, so it is good.\"",
  "\"Western companies debut open-weight AI models\"",
  "\"Two Western companies are releasing open-weight AI models tailored toward businesses and governments that they claim are as powerful as the leading models offered by China\"",
  "\"They are also cheaper to run than the difficult-to-budget closed models, which could present a new challenge for US-based AI leaders Anthropic, Google, and OpenAI.\"",
  "\"US-based Reflection AI, which Nvidia financially backs, is launching its first model, Beam, which it says is adept at coding and agentic tasks.\"",
  "\"Meanwhile, France-based Mistral is debuting Mistral Large 4\"",
  "\"Should these new models have the capabilities claimed by their companies, they could be massive disruptors to the status quo\"",
  "\"Businesses and governments in the West are currently hesitant to use the Chinese open models due to security concerns. Reflection and Mistral could be the answer.\"",
  "\"may have new competition as they prepare to go public.\"",
  "\"By putting powerful models that anyone can tweak into circulation, it creates the potential for even more cybersecurity issues.\"",
  "\"more availability of models can help improve defenses and allows researchers to audit the technology\"",
  "\"which is currently only being previewed for developers, will have a wider release on Oct. 27 after more testing\"",
  "\"open weight\"",
  "\"I am allowed to inspect this\"",
  "\"I have inspected this\"",
  "\"Reflection will release full technical details of Beam later this month.\"",
  "\"open, therefore safe\"",
  "\"foreign, therefore wicked\"",
];

const corpusVerse = (book, ch, v) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

// The checks, as pure functions, so the proven-to-catch block runs the SAME
// checks against a mutated copy and shows they fail.
function missingVerbatim(mod) {
  const bad = [];
  for (const [ref, fragment] of Object.entries(SOV35_FRAGMENTS)) {
    if (!mod.lesson.includes(`"${fragment}" (${ref})`)) bad.push(ref);
  }
  return bad;
}
const everyString = (o, out = []) => {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach((x) => everyString(x, out));
  else if (o && typeof o === 'object') Object.values(o).forEach((x) => everyString(x, out));
  return out;
};
const REF_RE = /"([^"]+)"\s*\(((?:[1-3] )?[A-Za-z]+ \d+:\d+)\)/g;
function unpinnedQuotesInOtherFields(mod) {
  const text = everyString({ ...mod, lesson: '' }).join('\n');
  const bad = [];
  let seen = 0;
  for (const m of text.matchAll(REF_RE)) {
    const [, q, ref] = m;
    seen += 1;
    const pinned = SOV35_FRAGMENTS[ref];
    if (!pinned || !pinned.includes(q)) bad.push(`${ref}: ${q}`);
  }
  return { bad, seen };
}
// Every double-quoted span ANYWHERE in the lesson — the deep lesson and every
// band, benefit, quiz line and facilitator note — is either a piece of the Word
// or an allow-listed quotation of the newsletter. Wider than sov34's check,
// which read the deep lesson only.
function unattributedQuotes(mod) {
  const isWord = (q) => Object.values(SOV35_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
  const nonScripture = [...new Set((everyString(mod).join('\n').match(/"[^"]+"/g) || []).filter((q) => !isWord(q)))];
  return { nonScripture, bad: nonScripture.filter((q) => !SOV35_ALLOWED.includes(q)) };
}
// Week 35 follows every week already present and precedes every later one, so
// a sibling lane landing week 36 is not a red build while a week filed out of
// order still fails.
function orderProblem(modules) {
  const at = modules.findIndex((w) => w.id === SOV35_ID);
  if (at < 1) return 'sov35 missing';
  const n = (m) => Number((/^sov(\d+)-/.exec(m.id) || [])[1]);
  const mine = n(modules[at]);
  if (mine !== 35) return `sov35 parses as week ${mine}`;
  for (const other of modules.slice(0, at)) {
    if (!(n(other) < mine)) return `week ${n(other)} is not before week ${mine}`;
  }
  for (const other of modules.slice(at + 1)) {
    if (!(n(other) > mine)) return `week ${n(other)} is not after week ${mine}`;
  }
  return null;
}

const MOVEMENTS = [
  'FIRST, A JUST WEIGHT IS HIS DELIGHT - OPEN IS NOT THE SAME AS TRUE.',
  'SECOND, WHAT THE NEWSLETTER REPORTED - PLAINLY, AND HOW THIS HOUSE HOLDS IT.',
  'THIRD, HE PUTTETH DOWN ONE, AND SETTETH UP ANOTHER - WHO SEATS THE NEW PLAYERS.',
  'FOURTH, NOT BY MIGHT, NOR BY POWER - A TRILLION PARAMETERS IS NOT A FOUNDATION.',
  'FIFTH, ADD THOU NOT UNTO HIS WORDS - THE THING ANYONE MAY CHANGE, AND THE STANDARD NO ONE MAY.',
  'SIXTH, PROVE ALL THINGS - WHAT AUDITING IS FOR, AND WHAT IT CANNOT DO.',
  'SEVENTH, IN RIGHTEOUSNESS SHALT THOU JUDGE - JUDGE THE WORK, NOT THE FACE.',
  'EIGHTH, THERE IS NOTHING COVERED - WHY OPENNESS CUTS BOTH WAYS.',
  'NINTH, KNOW THE STATE OF THY FLOCKS - THE BILL YOU CAN READ AND THE RICHES THAT FLY AWAY.',
  'TENTH, THROUGH WISDOM IS AN HOUSE BUILDED - WHAT WE DO, AND WHO HOLDS IT ALL TOGETHER.',
];

describe('sov35 — the new players quotes its whole spine verbatim, Word first', () => {
  it('the week exists, after every week already present, anchored on the just weight and the Judge who seats and unseats', () => {
    expect(L()).toBeTruthy();
    expect(orderProblem(SOVEREIGN_AI_MODULES)).toBeNull();
    expect(L().rpe.research && L().rpe.plan && L().rpe.execute).toBeTruthy();
    expect(L().anchor.ref).toContain('Proverbs 11:1');
    expect(L().anchor.ref).toContain('Psalms 75:7');
    expect(L().anchor.theme).toContain(`"${SOV35_FRAGMENTS['Proverbs 11:1']}" (Proverbs 11:1)`);
    expect(L().anchor.theme).toContain(`"${SOV35_FRAGMENTS['Psalms 75:7']}" (Psalms 75:7)`);
  });

  it('anchor.ref names every verse the lesson stands on, so Search it out derives its links from the real spine (DR-0734)', () => {
    const refs = new Set(anchorRefs(L()));
    for (const ref of Object.keys(SOV35_FRAGMENTS)) expect(refs.has(ref), `anchor.ref names ${ref}`).toBe(true);
  });

  it('every pinned fragment appears letter-for-letter in the deep lesson, named beside its quote', () => {
    // Derived, not a literal count (DR-0677): the pins and the corpus map are the same set.
    expect(Object.keys(SOV35_FRAGMENTS).length).toBeGreaterThanOrEqual(80);
    expect(Object.keys(SOV35_CORPUS).sort()).toEqual(Object.keys(SOV35_FRAGMENTS).sort());
    expect(missingVerbatim(L())).toEqual([]);
  });

  it('every fragment matches the repo KJV corpus exactly, not memory (two witnesses)', () => {
    for (const [ref, fragment] of Object.entries(SOV35_FRAGMENTS)) {
      const at = SOV35_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(corpusVerse(...at), `${ref} corpus`).toBe(fragment);
    }
  });

  it('every quoted verse in the other fields (bigIdea, anchor, rpe, benefits, bands, quiz, facilitator) is a piece of a pinned verse', () => {
    const { bad, seen } = unpinnedQuotesInOtherFields(L());
    expect(bad).toEqual([]);
    expect(seen).toBeGreaterThan(130);
  });

  it('the Word LEADS: the just weight is taught before the newsletter is reported', () => {
    expect(L().lesson.indexOf(MOVEMENTS[0])).toBe(0);
    expect(L().lesson.indexOf('(Proverbs 11:1)')).toBeLessThan(L().lesson.indexOf('SECOND,'));
    expect(L().lesson.indexOf('(Micah 6:11)')).toBeLessThan(L().lesson.indexOf('Morning Brew'));
  });

  it('the ten movements are carried in order, each with its own ground', () => {
    let last = -1;
    for (const h of MOVEMENTS) {
      const at = L().lesson.indexOf(h);
      expect(at, `movement in order: ${h}`).toBeGreaterThan(last);
      last = at;
    }
    // The just weight is taught inside the first movement.
    for (const v of ['Proverbs 11:1', 'Proverbs 16:11', 'Leviticus 19:36', 'Micah 6:11']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('SECOND,'));
    }
    // Who seats the players is taught inside the third.
    for (const v of ['Psalms 75:6', 'Psalms 75:7', 'Daniel 2:21', '1 Samuel 2:8', 'Ecclesiastes 9:11']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeGreaterThan(L().lesson.indexOf('THIRD,'));
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('FOURTH,'));
    }
    // The horse that does not deliver is taught inside the fourth.
    for (const v of ['Psalms 20:7', 'Psalms 33:17', 'Psalms 147:10', 'Zechariah 4:6']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeGreaterThan(L().lesson.indexOf('FOURTH,'));
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('FIFTH,'));
    }
    // The unalterable standard is taught inside the fifth.
    for (const v of ['Deuteronomy 4:2', 'Proverbs 30:6', 'Revelation 22:19', 'Psalms 119:89']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeGreaterThan(L().lesson.indexOf('FIFTH,'));
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('SIXTH,'));
    }
    // Righteous judgment is taught inside the seventh.
    for (const v of ['Leviticus 19:15', 'Acts 10:34', 'John 7:24', 'James 2:4']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeGreaterThan(L().lesson.indexOf('SEVENTH,'));
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('EIGHTH,'));
    }
  });

  it('the newsletter is explained honestly and in full enough that the reader understands the thing', () => {
    const lesson = L().lesson;
    for (const piece of [
      '"Open weight means that, unlike with closed weight models, users can download and customize them with their own proprietary data."',
      '"They are also cheaper to run than the difficult-to-budget closed models, which could present a new challenge for US-based AI leaders Anthropic, Google, and OpenAI."',
      '"US-based Reflection AI, which Nvidia financially backs, is launching its first model, Beam, which it says is adept at coding and agentic tasks."',
      '"By putting powerful models that anyone can tweak into circulation, it creates the potential for even more cybersecurity issues."',
      '"more availability of models can help improve defenses and allows researchers to audit the technology"',
    ]) expect(lesson, piece).toContain(piece);
    // The names and the date are reported as the issue gave them.
    expect(lesson).toContain('Mistral Large 4');
    expect(lesson).toContain('Le Chonk');
    expect(lesson).toContain('Morning Brew');
    expect(lesson).toContain('2026-10-07');
    // The self-report hedge the article itself used is kept, not dropped.
    expect(lesson).toContain('that they CLAIM');
  });

  it('provenance is honest: the newsletter attributed, our own ground named with its limit, the unchecked named and NOT taught as fact', () => {
    const lesson = L().lesson;
    expect(lesson).toContain('FIRST PILE, WHAT THE ARTICLE SAID, attributed to it.');
    expect(lesson).toContain('SECOND PILE, WHAT THIS HOUSE HAS ALREADY BUILT ON THIS PATTERN');
    expect(lesson).toContain('THIRD PILE, WHAT WE DID NOT CHECK, and so do not teach as fact.');
    const third = lesson.indexOf('THIRD PILE');
    for (const unchecked of [
      'We did not download either model',
      'We read no model card, no licence and no benchmark',
      'are advertisements and are not taught here',
      'an A.I. agent drafted this page from the forwarded email',
    ]) expect(lesson.indexOf(unchecked, third), unchecked).toBeGreaterThan(third);
    // The limit on our own pile is said, not hidden.
    expect(lesson).toContain('we have not run either of these two models, we hold no measurement of our own about either one');
    // The honest hardware ceiling rides with the sovereignty claim, as always.
    expect(lesson).toContain('has no graphics card by design');
    const { nonScripture, bad } = unattributedQuotes(L());
    expect(nonScripture.length).toBeGreaterThanOrEqual(20);
    expect(bad).toEqual([]);
  });

  it('speaks established fact plainly and flags narrowly (DR-0100): three tiers, over-reach corrected both ways', () => {
    const lesson = L().lesson;
    expect(lesson).toContain('Established, and stated plainly:');
    expect(lesson).toContain('That is real, and it is not to be shrunk into nothing.');
    expect(lesson).toContain('Open, and named narrowly:');
    expect(lesson).toContain('Over-reach, corrected both ways:');
    // BOTH over-reaches are named, so the correction cannot run one way only.
    expect(lesson).toContain('"open, therefore safe"');
    expect(lesson).toContain('"foreign, therefore wicked"');
    // And the true datum under the prejudice is left standing, not deleted with it.
    expect(lesson).toMatch(/an unproven binary from any source, near or far, is a real risk/i);
    // Never the hedge-word: the unchecked is named by what it is.
    expect(JSON.stringify(L())).not.toMatch(/not verified/i);
  });

  it('teaches, never debates (DR-0098): no both-sides staging, and the Word is the authority', () => {
    const lesson = L().lesson;
    expect(lesson).not.toMatch(/some say|others say|scholars (?:are )?(?:divided|debate)|you decide/i);
    expect(L().bigIdea).toContain('the Word already governs the question under it');
    // The two true things are reconciled by the Word, not staged against each other.
    expect(lesson).toContain('Light is a mercy to the honest and an exposure to the hidden');
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
      expect(L().levels[b].slice(0, 90), b).toContain('The new players:');
      expect(L().levels[b], b).toContain('TALK ABOUT IT TOGETHER.');
    }
    expect(L().lesson).toContain('TALK ABOUT IT TOGETHER.');
    // hasAllThree is the MODULE-level gate, and it is asserted on the module.
    expect(hasAllThree(L())).toBe(true);
    const own = ownPrompts(L());
    expect(own.parents).toMatch(/Parents, ask your child/);
    expect(own.children).toMatch(/ask your mom, dad or grandparent/);
    expect(own.friends).toBeTruthy();
    // PER BAND, the three directions are asserted on the SENTENCE TEXT, never
    // by calling ownPrompts or hasAllThree on a single band. ownPrompts
    // searches each direction in a different place by design — parents to
    // children only in the adult prose and the senior band — so feeding it one
    // band is an instrument that cannot see what this check is for, and
    // feeding a band in as `lesson` only works by accident of that shape. The
    // literal sentence can always be seen. This is the shape
    // living-lessons-l215-verses.test.js uses, and all five surfaces carry all
    // three, so a band that drops one is caught by name.
    for (const [where, t] of [['lesson', L().lesson], ...FULL_BANDS.map((b) => [b, L().levels[b]])]) {
      expect(t, `${where}: parents to children`).toMatch(/Parents, ask your child/);
      expect(t, `${where}: children to parents`).toMatch(/Children, ask your mom, dad or grandparent/);
      expect(t, `${where}: friend to friend`).toMatch(/Friends, tell one friend this week/);
    }
    // the skill and the rhythm ride every close
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {
      expect(t).toMatch(/listen all the way to the end|listen all the way through|Listen all the way/);
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

describe('sov35 — proven-to-catch: the gate fails on a drifted verse, an unattributed claim, a dropped close, or a misfiled week', () => {
  it('the pinned ground truth is itself exact', () => {
    expect(SOV35_FRAGMENTS['Proverbs 11:1']).toBe('A false balance is abomination to the LORD: but a just weight is his delight.');
    expect(SOV35_FRAGMENTS['Psalms 75:7']).toBe('But God is the judge: he putteth down one, and setteth up another.');
    expect(SOV35_FRAGMENTS['Psalms 33:17']).toBe('An horse is a vain thing for safety: neither shall he deliver any by his great strength.');
    expect(SOV35_FRAGMENTS['Psalms 119:89']).toBe('For ever, O LORD, thy word is settled in heaven.');
    // The corpus apostrophe is typographic; a straight one would be a silent drift.
    expect(SOV35_FRAGMENTS['Proverbs 16:11']).toContain('the LORD’s');
    // The corpus spells this one the American way; typing it from memory would drift.
    expect(SOV35_FRAGMENTS['Leviticus 19:15']).toContain('nor honor the person of the mighty');
  });

  it('a one-word drift of Proverbs 11:1 in the lesson is caught', () => {
    const drifted = { ...L(), lesson: L().lesson.split('but a just weight is his delight').join('but a just weight is his pleasure') };
    expect(missingVerbatim(drifted)).toContain('Proverbs 11:1');
  });

  it('a drifted verse in another field (the teen band) is caught', () => {
    const t = L().levels.teen;
    const drifted = { ...L(), levels: { ...L().levels, teen: t.split('An horse is a vain thing for safety').join('A horse is a vain thing for safety') } };
    expect(unpinnedQuotesInOtherFields(drifted).bad.some((b) => b.startsWith('Psalms 33:17'))).toBe(true);
  });

  it('a straight apostrophe where the corpus is typographic is caught', () => {
    const drifted = { ...L(), lesson: L().lesson.split('the LORD’s: all the weights').join("the LORD's: all the weights") };
    expect(missingVerbatim(drifted)).toContain('Proverbs 16:11');
  });

  it('an unattributed claim smuggled into the lesson in quotation marks is caught', () => {
    const smuggled = { ...L(), lesson: `${L().lesson} "This model is safer than every closed model on the market."` };
    expect(unattributedQuotes(smuggled).bad).toEqual(['"This model is safer than every closed model on the market."']);
  });

  it('an unattributed claim smuggled into a BAND is caught too, not only the deep lesson', () => {
    const smuggled = { ...L(), levels: { ...L().levels, child: `${L().levels.child} "Beam is the best coding model in the world."` } };
    expect(unattributedQuotes(smuggled).bad).toEqual(['"Beam is the best coding model in the world."']);
  });

  it('a lesson that drops TALK ABOUT IT TOGETHER from its bands loses the children-to-parents direction and fails the three-direction rule', () => {
    const strip = (t) => t.split('TALK ABOUT IT TOGETHER.')[0];
    const cut = { ...L(), levels: { child: strip(L().levels.child), youth: strip(L().levels.youth), teen: strip(L().levels.teen), senior: strip(L().levels.senior) } };
    expect(ownPrompts(cut).children).toBe('');
    expect(hasAllThree(cut)).toBe(false);
  });

  it('ONE band quietly dropping ONE direction is caught by name — the case hasAllThree on the module cannot see', () => {
    // The youth band loses only its friend-to-friend line. The module still
    // carries all three somewhere, so the module-level gate stays green; the
    // per-band sentence check is what names the band that lost it.
    const cut = L().levels.youth.replace(/Friends, tell one friend this week/, 'Friends, something vague');
    const drifted = { ...L(), levels: { ...L().levels, youth: cut } };
    expect(hasAllThree(drifted), 'the module-level gate cannot see a single band losing one line').toBe(true);
    const missing = [['lesson', drifted.lesson], ...FULL_BANDS.map((b) => [b, drifted.levels[b]])]
      .filter(([, t]) => !/Friends, tell one friend this week/.test(t)).map(([w]) => w);
    expect(missing).toEqual(['youth']);
  });

  it('week 35 missing, or filed out of order in either direction, is caught — while a later sibling week is not', () => {
    expect(orderProblem(SOVEREIGN_AI_MODULES.filter((w) => w.id !== SOV35_ID))).toBe('sov35 missing');
    const earlierTooHigh = [...SOVEREIGN_AI_MODULES];
    earlierTooHigh.splice(earlierTooHigh.findIndex((w) => w.id === SOV35_ID), 0, { id: 'sov99-a-week-from-the-future' });
    expect(orderProblem(earlierTooHigh)).toMatch(/week 99 is not before week 35/);
    const laterTooLow = [...SOVEREIGN_AI_MODULES, { id: 'sov5-a-duplicated-week' }];
    expect(orderProblem(laterTooLow)).toMatch(/week 5 is not after week 35/);
    // A sibling lane landing week 36 after this one is NOT a red build.
    expect(orderProblem([...SOVEREIGN_AI_MODULES, { id: 'sov36-a-sibling-lane' }])).toBeNull();
  });

  it('a band that stops naming its lesson, or falls under a full reading, is caught', () => {
    const thin = 'The new players: hold the weights. TALK ABOUT IT TOGETHER.';
    expect(thin.length).toBeLessThan(2500);
    expect(hasAllThree({ lesson: thin })).toBe(false);
  });
});
