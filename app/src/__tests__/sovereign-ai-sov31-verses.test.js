// =============================================================================
// sov31 — whose errand does your agent carry? (DR-0683)
// =============================================================================
// Week 31 of Sovereign A.I., captured 2026-09-29 by the Gmail-lesson-intake Way
// (DR-0312) from The Neuron newsletter Darrell forwarded with "Lesson"
// ("Your AI agent needs an agent", 2026-09-29). Word first: one Mediator holds
// the seat (1 Timothy 2:5); Abraham's servant carried his master's errand
// (Genesis 24); no man can serve two masters (Matthew 6:24); the owner answers
// for the ox and the fire (Exodus 21:28-29; 22:5-6); Jethro's counsel (Exodus 18).
//
// Every quoted verse below was FILLED from app/public/bible/kjv by a generator
// (never typed from memory) and is re-read from the corpus at test time — two
// witnesses. Every non-Scripture quote in the deep lesson is allow-listed to
// the article's own words or Darrell's marker, so a claim cannot enter the
// lesson in quotation marks unattributed (DR-0076 SS8). Proven-to-catch: the
// last block mutates a verse, a claim and the week order and shows the gate fails.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOV31_ID = 'sov31-whose-errand-does-your-agent-carry';
const sov31 = SOVEREIGN_AI_MODULES.find((w) => w.id === SOV31_ID);

const SOV31_FRAGMENTS = {
  "1 Timothy 2:5": "For there is one God, and one mediator between God and men, the man Christ Jesus;",
  "1 John 2:1": "My little children, these things write I unto you, that ye sin not. And if any man sin, we have an advocate with the Father, Jesus Christ the righteous:",
  "Genesis 24:33": "And there was set meat before him to eat: but he said, I will not eat, until I have told mine errand. And he said, Speak on.",
  "Matthew 6:24": "No man can serve two masters: for either he will hate the one, and love the other; or else he will hold to the one, and despise the other. Ye cannot serve God and mammon.",
  "Exodus 22:6": "If fire break out, and catch in thorns, so that the stacks of corn, or the standing corn, or the field, be consumed therewith; he that kindled the fire shall surely make restitution.",
  "Deuteronomy 22:8": "When thou buildest a new house, then thou shalt make a battlement for thy roof, that thou bring not blood upon thine house, if any man fall from thence.",
  "Mark 13:34": "For the Son of man is as a man taking a far journey, who left his house, and gave authority to his servants, and to every man his work, and commanded the porter to watch.",
  "Exodus 18:22": "And let them judge the people at all seasons: and it shall be, that every great matter they shall bring unto thee, but every small matter they shall judge: so shall it be easier for thyself, and they shall bear the burden with thee.",
  "Proverbs 14:15": "The simple believeth every word: but the prudent man looketh well to his going.",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "Hebrews 7:25": "Wherefore he is able also to save them to the uttermost that come unto God by him, seeing he ever liveth to make intercession for them.",
  "Genesis 3:12": "And the man said, The woman whom thou gavest to be with me, she gave me of the tree, and I did eat.",
  "Proverbs 4:23": "Keep thy heart with all diligence; for out of it are the issues of life.",
  "Habakkuk 2:2": "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it.",
  "Romans 14:12": "So then every one of us shall give account of himself to God.",
  "Genesis 24:27": "And he said, Blessed be the LORD God of my master Abraham, who hath not left destitute my master of his mercy and his truth: I being in the way, the LORD led me to the house of my master’s brethren.",
  "John 10:13": "The hireling fleeth, because he is an hireling, and careth not for the sheep.",
  "Exodus 18:21": "Moreover thou shalt provide out of all the people able men, such as fear God, men of truth, hating covetousness; and place such over them, to be rulers of thousands, and rulers of hundreds, rulers of fifties, and rulers of tens:",
  "Deuteronomy 25:15": "But thou shalt have a perfect and just weight, a perfect and just measure shalt thou have: that thy days may be lengthened in the land which the LORD thy God giveth thee.",
  "John 1:29": "The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.",
  "Romans 8:34": "Who is he that condemneth? It is Christ that died, yea rather, that is risen again, who is even at the right hand of God, who also maketh intercession for us.",
  "Romans 8:26": "Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought: but the Spirit itself maketh intercession for us with groanings which cannot be uttered.",
  "John 10:9": "I am the door: by me if any man enter in, he shall be saved, and shall go in and out, and find pasture.",
  "John 14:6": "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
  "Genesis 24:2": "And Abraham said unto his eldest servant of his house, that ruled over all that he had, Put, I pray thee, thy hand under my thigh:",
  "Genesis 24:3": "And I will make thee swear by the LORD, the God of heaven, and the God of the earth, that thou shalt not take a wife unto my son of the daughters of the Canaanites, among whom I dwell:",
  "Genesis 24:12": "And he said, O LORD God of my master Abraham, I pray thee, send me good speed this day, and shew kindness unto my master Abraham.",
  "Genesis 24:56": "And he said unto them, Hinder me not, seeing the LORD hath prospered my way; send me away that I may go to my master.",
  "John 10:12": "But he that is an hireling, and not the shepherd, whose own the sheep are not, seeth the wolf coming, and leaveth the sheep, and fleeth: and the wolf catcheth them, and scattereth the sheep.",
  "John 10:11": "I am the good shepherd: the good shepherd giveth his life for the sheep.",
  "Proverbs 25:13": "As the cold of snow in the time of harvest, so is a faithful messenger to them that send him: for he refresheth the soul of his masters.",
  "Proverbs 13:17": "A wicked messenger falleth into mischief: but a faithful ambassador is health.",
  "2 Corinthians 5:20": "Now then we are ambassadors for Christ, as though God did beseech you by us: we pray you in Christ’s stead, be ye reconciled to God.",
  "Genesis 3:13": "And the LORD God said unto the woman, What is this that thou hast done? And the woman said, The serpent beguiled me, and I did eat.",
  "Exodus 21:28": "If an ox gore a man or a woman, that they die: then the ox shall be surely stoned, and his flesh shall not be eaten; but the owner of the ox shall be quit.",
  "Exodus 21:29": "But if the ox were wont to push with his horn in time past, and it hath been testified to his owner, and he hath not kept him in, but that he hath killed a man or a woman; the ox shall be stoned, and his owner also shall be put to death.",
  "Exodus 22:5": "If a man shall cause a field or vineyard to be eaten, and shall put in his beast, and shall feed in another man’s field; of the best of his own field, and of the best of his own vineyard, shall he make restitution.",
  "Galatians 6:7": "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap.",
  "John 12:6": "This he said, not that he cared for the poor; but because he was a thief, and had the bag, and bare what was put therein.",
  "Luke 16:11": "If therefore ye have not been faithful in the unrighteous mammon, who will commit to your trust the true riches?",
  "Matthew 24:45": "Who then is a faithful and wise servant, whom his lord hath made ruler over his household, to give them meat in due season?",
  "Matthew 24:46": "Blessed is that servant, whom his lord when he cometh shall find so doing.",
  "Psalms 139:1": "O LORD, thou hast searched me, and known me.",
  "Psalms 139:2": "Thou knowest my downsitting and mine uprising, thou understandest my thought afar off.",
  "Jeremiah 17:10": "I the LORD search the heart, I try the reins, even to give every man according to his ways, and according to the fruit of his doings.",
  "1 Samuel 8:11": "And he said, This will be the manner of the king that shall reign over you: He will take your sons, and appoint them for himself, for his chariots, and to be his horsemen; and some shall run before his chariots.",
  "1 Samuel 8:17": "He will take the tenth of your sheep: and ye shall be his servants.",
  "1 Samuel 8:18": "And ye shall cry out in that day because of your king which ye shall have chosen you; and the LORD will not hear you in that day.",
  "Leviticus 19:35": "Ye shall do no unrighteousness in judgment, in meteyard, in weight, or in measure.",
  "Leviticus 19:36": "Just balances, just weights, a just ephah, and a just hin, shall ye have: I am the LORD your God, which brought you out of the land of Egypt.",
  "Matthew 5:37": "But let your communication be, Yea, yea; Nay, nay: for whatsoever is more than these cometh of evil.",
  "Proverbs 22:29": "Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men.",
  "Luke 6:31": "And as ye would that men should do to you, do ye also to them likewise.",
  "Exodus 18:17": "And Moses’ father in law said unto him, The thing that thou doest is not good.",
  "Exodus 18:18": "Thou wilt surely wear away, both thou, and this people that is with thee: for this thing is too heavy for thee; thou art not able to perform it thyself alone.",
  "Acts 6:2": "Then the twelve called the multitude of the disciples unto them, and said, It is not reason that we should leave the word of God, and serve tables.",
  "Acts 6:3": "Wherefore, brethren, look ye out among you seven men of honest report, full of the Holy Ghost and wisdom, whom we may appoint over this business.",
  "Acts 6:4": "But we will give ourselves continually to prayer, and to the ministry of the word.",
  "Luke 12:42": "And the Lord said, Who then is that faithful and wise steward, whom his lord shall make ruler over his household, to give them their portion of meat in due season?",
  "Luke 12:43": "Blessed is that servant, whom his lord when he cometh shall find so doing.",
};

const SOV31_CORPUS = {
  "1 Timothy 2:5": ["1Timothy",2,5],
  "1 John 2:1": ["1John",2,1],
  "Genesis 24:33": ["Genesis",24,33],
  "Matthew 6:24": ["Matthew",6,24],
  "Exodus 22:6": ["Exodus",22,6],
  "Deuteronomy 22:8": ["Deuteronomy",22,8],
  "Mark 13:34": ["Mark",13,34],
  "Exodus 18:22": ["Exodus",18,22],
  "Proverbs 14:15": ["Proverbs",14,15],
  "1 Thessalonians 5:21": ["1Thessalonians",5,21],
  "Hebrews 7:25": ["Hebrews",7,25],
  "Genesis 3:12": ["Genesis",3,12],
  "Proverbs 4:23": ["Proverbs",4,23],
  "Habakkuk 2:2": ["Habakkuk",2,2],
  "Romans 14:12": ["Romans",14,12],
  "Genesis 24:27": ["Genesis",24,27],
  "John 10:13": ["John",10,13],
  "Exodus 18:21": ["Exodus",18,21],
  "Deuteronomy 25:15": ["Deuteronomy",25,15],
  "John 1:29": ["John",1,29],
  "Romans 8:34": ["Romans",8,34],
  "Romans 8:26": ["Romans",8,26],
  "John 10:9": ["John",10,9],
  "John 14:6": ["John",14,6],
  "Genesis 24:2": ["Genesis",24,2],
  "Genesis 24:3": ["Genesis",24,3],
  "Genesis 24:12": ["Genesis",24,12],
  "Genesis 24:56": ["Genesis",24,56],
  "John 10:12": ["John",10,12],
  "John 10:11": ["John",10,11],
  "Proverbs 25:13": ["Proverbs",25,13],
  "Proverbs 13:17": ["Proverbs",13,17],
  "2 Corinthians 5:20": ["2Corinthians",5,20],
  "Genesis 3:13": ["Genesis",3,13],
  "Exodus 21:28": ["Exodus",21,28],
  "Exodus 21:29": ["Exodus",21,29],
  "Exodus 22:5": ["Exodus",22,5],
  "Galatians 6:7": ["Galatians",6,7],
  "John 12:6": ["John",12,6],
  "Luke 16:11": ["Luke",16,11],
  "Matthew 24:45": ["Matthew",24,45],
  "Matthew 24:46": ["Matthew",24,46],
  "Psalms 139:1": ["Psalms",139,1],
  "Psalms 139:2": ["Psalms",139,2],
  "Jeremiah 17:10": ["Jeremiah",17,10],
  "1 Samuel 8:11": ["1Samuel",8,11],
  "1 Samuel 8:17": ["1Samuel",8,17],
  "1 Samuel 8:18": ["1Samuel",8,18],
  "Leviticus 19:35": ["Leviticus",19,35],
  "Leviticus 19:36": ["Leviticus",19,36],
  "Matthew 5:37": ["Matthew",5,37],
  "Proverbs 22:29": ["Proverbs",22,29],
  "Luke 6:31": ["Luke",6,31],
  "Exodus 18:17": ["Exodus",18,17],
  "Exodus 18:18": ["Exodus",18,18],
  "Acts 6:2": ["Acts",6,2],
  "Acts 6:3": ["Acts",6,3],
  "Acts 6:4": ["Acts",6,4],
  "Luke 12:42": ["Luke",12,42],
  "Luke 12:43": ["Luke",12,43],
};

// The only non-Scripture double-quoted spans the deep lesson may carry: the
// article's own words (attributed in the text) and Darrell's marker. Each was
// checked against the forwarded email when the lesson was generated.
const SOV31_ALLOWED = [
  '"Lesson"',
  '"Your AI agent needs an agent"',
  '"does your agent actually represent you, or the company that built it?"',
  '"infinite liability"',
  '"Now, that’s a prediction, not the current legal framework."',
  '"tort law"',
  '"Whoever owns the interface sees your intent first, and aggregates everything else."',
  '"Make authentication, permissions, purchases, and refunds agent-friendly."',
  '"Be the supplier the aggregator picks."',
  '"The internet was built around getting humans to click your website. The next one may be built around getting an agent to pick you."',
  '"use expensive generative models only when generation is required."',
  '"if you can write every valid answer on a sticky note, you probably don’t need a giant model composing prose to pick one."',
];

const corpusVerse = (book, ch, v) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

// The checks, as pure functions, so the proven-to-catch block runs the SAME
// checks against a mutated copy and shows they fail.
function missingVerbatim(mod) {
  const bad = [];
  for (const [ref, fragment] of Object.entries(SOV31_FRAGMENTS)) {
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
    const pinned = SOV31_FRAGMENTS[ref];
    seen += 1;
    if (!pinned || !pinned.includes(q)) bad.push(`${ref}: ${q}`);
  }
  return { bad, seen };
}
function unattributedQuotes(mod) {
  const isWord = (q) => Object.values(SOV31_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
  const nonScripture = (mod.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
  return { nonScripture, bad: nonScripture.filter((q) => !SOV31_ALLOWED.includes(q)) };
}
// Week 31 lands after week 30 (DR-0682): the week before it must be sov30.
function orderProblem(modules) {
  const at = modules.findIndex((w) => w.id === SOV31_ID);
  if (at < 1) return 'sov31 missing';
  if (!/^sov30-/.test(modules[at - 1].id)) return `week before sov31 is ${modules[at - 1].id}, not sov30`;
  return null;
}

describe('sov31 — whose errand does your agent carry quotes its whole spine verbatim, Word first', () => {
  it('the week exists, directly after week 30, anchored on the one Mediator and the two masters', () => {
    expect(sov31).toBeTruthy();
    expect(orderProblem(SOVEREIGN_AI_MODULES)).toBeNull();
    expect(sov31.anchor.ref).toContain('1 Timothy 2:5');
    expect(sov31.anchor.ref).toContain('Matthew 6:24');
    expect(sov31.anchor.theme).toContain(`"${SOV31_FRAGMENTS['1 Timothy 2:5']}" (1 Timothy 2:5)`);
    expect(sov31.anchor.theme).toContain(`"${SOV31_FRAGMENTS['Matthew 6:24']}" (Matthew 6:24)`);
  });
  it('every pinned fragment appears letter-for-letter in the deep lesson, named beside its quote', () => {
    // Derived, not a literal count (DR-0677): the pins and the corpus map are the same set.
    expect(Object.keys(SOV31_FRAGMENTS).length).toBeGreaterThanOrEqual(50);
    expect(Object.keys(SOV31_CORPUS).sort()).toEqual(Object.keys(SOV31_FRAGMENTS).sort());
    expect(missingVerbatim(sov31)).toEqual([]);
  });
  it('every fragment matches the repo KJV corpus exactly, not memory (two witnesses)', () => {
    for (const [ref, fragment] of Object.entries(SOV31_FRAGMENTS)) {
      const at = SOV31_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(corpusVerse(...at), `${ref} corpus`).toBe(fragment);
    }
  });
  it('every quoted verse in the other fields (bigIdea, anchor, benefits, rpe, bands, quiz, facilitator) is a piece of a pinned verse', () => {
    const { bad, seen } = unpinnedQuotesInOtherFields(sov31);
    expect(bad).toEqual([]);
    expect(seen).toBeGreaterThan(30);
  });
  it('the Word LEADS: the one Mediator is taught before the article is reported', () => {
    expect(sov31.lesson.indexOf('FIRST, ONE MEDIATOR')).toBe(0);
    expect(sov31.lesson.indexOf('(1 Timothy 2:5)')).toBeLessThan(sov31.lesson.indexOf('SECOND,'));
    expect(sov31.lesson.indexOf('(John 14:6)')).toBeLessThan(sov31.lesson.indexOf('The Neuron'));
  });
  it('the ten movements are carried in order', () => {
    const heads = [
      'FIRST, ONE MEDIATOR - THE SEAT BETWEEN YOU AND THE FATHER IS ALREADY TAKEN',
      'SECOND, WHAT THE ARTICLE REPORTED - AND WHAT WE COULD VERIFY',
      'THIRD, THE SERVANT SENT TO SPEAK FOR HIS MASTER - ABRAHAM\'S ELDEST SERVANT',
      'FOURTH, WHOSE AGENT IS IT? - NO MAN CAN SERVE TWO MASTERS',
      'FIFTH, WHO GETS BLAMED - THE FIRST SHIFTED BLAME, AND THE LAW OF THE OX AND THE FIRE',
      'SIXTH, A PHONE, A WALLET AND A COMPUTER - WHO HOLDS THE BAG',
      'SEVENTH, WHOEVER OWNS THE GATE SEES YOUR INTENT FIRST - GUARD THE HEART, AND COUNT THE KING\'S COST',
      'EIGHTH, WRITE THE VISION AND MAKE IT PLAIN - BE THE SUPPLIER AN HONEST AGENT CAN READ',
      'NINTH, JETHRO\'S COUNSEL - SMALL MATTERS TO THE SMALL, GREAT MATTERS TO THE GREAT',
      'TENTH, THE ADVOCATE WHO NEVER CHANGES SIDES - AND EVERY STEWARD GIVES ACCOUNT',
    ];
    let last = -1;
    for (const h of heads) {
      const at = sov31.lesson.indexOf(h);
      expect(at, `movement in order: ${h}`).toBeGreaterThan(last);
      last = at;
    }
    // Abraham's servant is Genesis 24, taught inside the third movement.
    for (const v of ['Genesis 24:2', 'Genesis 24:3', 'Genesis 24:12', 'Genesis 24:27', 'Genesis 24:33', 'Genesis 24:56']) {
      expect(sov31.lesson.indexOf(`(${v})`)).toBeGreaterThan(sov31.lesson.indexOf('THIRD,'));
      expect(sov31.lesson.indexOf(`(${v})`)).toBeLessThan(sov31.lesson.indexOf('FOURTH,'));
    }
    // The ox and the fire are taught inside the fifth.
    for (const v of ['Exodus 21:29', 'Exodus 22:6', 'Deuteronomy 22:8']) {
      expect(sov31.lesson.indexOf(`(${v})`)).toBeGreaterThan(sov31.lesson.indexOf('FIFTH,'));
      expect(sov31.lesson.indexOf(`(${v})`)).toBeLessThan(sov31.lesson.indexOf('SIXTH,'));
    }
  });
  it('provenance is honest: claims attributed, corroborations named, the unverified and the differently-reported named and NOT taught as fact', () => {
    expect(sov31.lesson).toContain('FIRST PILE, WHAT THE ARTICLE CLAIMED, attributed to it.');
    expect(sov31.lesson).toContain('SECOND PILE, WHAT INDEPENDENT REPORTS CORROBORATE');
    expect(sov31.lesson).toContain('were not read directly from this session; that is said plainly');
    expect(sov31.lesson).toContain('THIRD PILE, WHAT WE COULD NOT VERIFY, and so do not teach as fact - including where other reports say something different.');
    const third = sov31.lesson.indexOf('THIRD PILE');
    for (const unverified of ['Manus 2.0, the Cue agent, and the Prime Agent', 'the Florida emergency injunction', 'the Cambridge-led report', 'not a purchase', 'no cancelled 6.1 release was found', 'near one trillion dollars, not above two', 'are advertisements, and are not taught']) {
      expect(sov31.lesson.indexOf(unverified, third), unverified).toBeGreaterThan(third);
    }
    // The article's own hedge on its liability forecast is carried, not dropped.
    expect(sov31.lesson).toContain('"Now, that’s a prediction, not the current legal framework."');
    // Conflict of interest disclosed: the drafting A.I.'s maker is named in the article, and it was sent by another agent.
    expect(sov31.lesson).toContain('the A.I. that drafted this page is built by Anthropic, which the article names several times');
    expect(sov31.lesson).toContain('it was itself sent to write this lesson as a helper by another agent');
    const { nonScripture, bad } = unattributedQuotes(sov31);
    expect(nonScripture.length).toBeGreaterThanOrEqual(12);
    expect(bad).toEqual([]);
  });
  it('speaks established fact plainly and flags narrowly (DR-0100): three tiers, over-reach corrected both ways', () => {
    expect(sov31.lesson).toContain('Established, and stated plainly:');
    expect(sov31.lesson).toContain('That is real, and it is not to be shrunk into nothing.');
    expect(sov31.lesson).toContain('Open, and named narrowly:');
    expect(sov31.lesson).toContain('Over-reach, corrected both ways:');
  });
  it('this house is cited honestly: the Cage as built, the bright line on money, the lane, and this lesson\'s own making', () => {
    expect(sov31.lesson).toContain('only approved kinds of work may go out, every escalation is written to a ledger with its cost, and work walled as sovereign cannot reach a vendor at all');
    expect(sov31.lesson).toContain('moving real money is a bright line that waits for Darrell\'s own yes');
    expect(sov31.lesson).toContain('the gates - not the helper\'s confidence - decide whether it ships');
    // Readers are never handed our bookkeeping: record ids live only in the facilitator notes.
    expect(JSON.stringify({ ...sov31, facilitator: null })).not.toMatch(/DR-\d{4}/);
    expect(sov31.inApp).toMatch(/Admin - Systems/);
    expect(sov31.inApp).toMatch(/Admin - Support access/);
  });
  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized; the Lamb confessed', () => {
    const ours = JSON.stringify(sov31).replace(/\\"[^"\\]+\\"/g, '');
    expect(sov31.lesson.replace(/"[^"]+"/g, '')).not.toMatch(/\bGod\b/);
    for (const f of ['bigIdea', 'inApp', 'title']) expect(sov31[f].replace(/"[^"]+"/g, ''), f).not.toMatch(/\bGod\b/);
    for (const b of ['child', 'teen', 'senior']) expect(sov31.levels[b].replace(/"[^"]+"/g, ''), b).not.toMatch(/\bGod\b/);
    expect(ours).toMatch(/Yahweh/);
    expect(JSON.stringify(sov31)).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
    expect(sov31.lesson).toContain('the Word');
    expect(sov31.lesson).toMatch(/The Son of Yahweh, the Lamb/);
    expect(sov31.lesson).toContain('(John 1:29)');
  });
  it('age bands: child, teen and senior are authored, and the quiz has real questions', () => {
    for (const b of ['child', 'teen', 'senior']) expect(sov31.levels[b].length, b).toBeGreaterThan(800);
    expect(sov31.quiz.questions.length).toBeGreaterThanOrEqual(6);
    for (const q of sov31.quiz.questions) expect(q.options[q.answer], q.q).toBeTruthy();
  });
});

describe('sov31 — proven-to-catch: the gate fails on a drifted verse, an unattributed claim, or the wrong week order', () => {
  it('the pinned ground truth is itself exact', () => {
    expect(SOV31_FRAGMENTS['1 Timothy 2:5']).toBe('For there is one God, and one mediator between God and men, the man Christ Jesus;');
    expect(SOV31_FRAGMENTS['Genesis 24:33']).toBe('And there was set meat before him to eat: but he said, I will not eat, until I have told mine errand. And he said, Speak on.');
    expect(SOV31_FRAGMENTS['Exodus 22:6']).toBe('If fire break out, and catch in thorns, so that the stacks of corn, or the standing corn, or the field, be consumed therewith; he that kindled the fire shall surely make restitution.');
    // The corpus apostrophe is typographic; a straight one would be a silent drift.
    expect(SOV31_FRAGMENTS['Genesis 24:27']).toContain('master’s brethren');
  });
  it('a one-word drift of 1 Timothy 2:5 in the lesson is caught', () => {
    const drifted = { ...sov31, lesson: sov31.lesson.split('one mediator between God and men').join('one mediator between God and man') };
    expect(missingVerbatim(drifted)).toContain('1 Timothy 2:5');
  });
  it('a drifted verse in another field (the teen band) is caught', () => {
    const drifted = { ...sov31, levels: { ...sov31.levels, teen: sov31.levels.teen.split('No man can serve two masters').join('No man can serve two lords') } };
    expect(unpinnedQuotesInOtherFields(drifted).bad.some((b) => b.startsWith('Matthew 6:24'))).toBe(true);
  });
  it('an unattributed claim smuggled into the lesson in quotation marks is caught', () => {
    const smuggled = { ...sov31, lesson: `${sov31.lesson} "Your agent always works for you."` };
    expect(unattributedQuotes(smuggled).bad).toEqual(['"Your agent always works for you."']);
  });
  it('week 31 landing anywhere but directly after week 30 is caught', () => {
    const without30 = SOVEREIGN_AI_MODULES.filter((w) => !/^sov30-/.test(w.id));
    expect(orderProblem(without30)).toMatch(/not sov30/);
    expect(orderProblem(SOVEREIGN_AI_MODULES.filter((w) => w.id !== SOV31_ID))).toBe('sov31 missing');
  });
});
