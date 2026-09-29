// =============================================================================
// sov29 — the agent that went past the bound (DR-0662)
// =============================================================================
// Week 29 of Sovereign A.I., captured 2026-09-29 by the Gmail-lesson-intake Way
// (DR-0312) from The Neuron newsletter Darrell forwarded with "Lesson."
// ("Did OpenAI lose control?", 2026-09-28). Word first: Yahweh sets the bound
// (Job 38:11); the Lamb refused the shortcut (Matthew 4:8-10); to obey is
// better than sacrifice (1 Samuel 15:22); first be proved (1 Timothy 3:10);
// except the LORD keep the city (Psalms 127:1).
//
// Every quoted verse below was FILLED from app/public/bible/kjv (never typed
// from memory) and is re-read from the corpus at test time — two witnesses.
// Every non-Scripture quote in the deep lesson is allow-listed to the
// article's own words or Darrell's marker, so a claim cannot enter the
// lesson in quotation marks unattributed (DR-0076 SS8). Proven-to-catch: the
// last block mutates a verse and a claim and shows the gate fails.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const sov29 = SOVEREIGN_AI_MODULES.find((w) => w.id === 'sov29-the-agent-that-went-past-the-bound');

const SOV29_FRAGMENTS = {
  "Job 38:11": "And said, Hitherto shalt thou come, but no further: and here shall thy proud waves be stayed?",
  "Proverbs 8:29": "When he gave to the sea his decree, that the waters should not pass his commandment: when he appointed the foundations of the earth:",
  "Jeremiah 5:22": "which have placed the sand for the bound of the sea by a perpetual decree, that it cannot pass it",
  "Acts 17:26": "and hath determined the times before appointed, and the bounds of their habitation",
  "Genesis 2:16": "And the LORD God commanded the man, saying, Of every tree of the garden thou mayest freely eat:",
  "Genesis 2:17": "But of the tree of the knowledge of good and evil, thou shalt not eat of it: for in the day that thou eatest thereof thou shalt surely die.",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "Proverbs 14:12": "There is a way which seemeth right unto a man, but the end thereof are the ways of death.",
  "Romans 3:8": "Let us do evil, that good may come? whose damnation is just.",
  "Proverbs 11:1": "A false balance is abomination to the LORD: but a just weight is his delight.",
  "Proverbs 20:17": "Bread of deceit is sweet to a man; but afterwards his mouth shall be filled with gravel.",
  "Matthew 4:8": "Again, the devil taketh him up into an exceeding high mountain, and sheweth him all the kingdoms of the world, and the glory of them;",
  "Matthew 4:9": "And saith unto him, All these things will I give thee, if thou wilt fall down and worship me.",
  "Matthew 4:10": "for it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve.",
  "John 5:19": "The Son can do nothing of himself, but what he seeth the Father do: for what things soever he doeth, these also doeth the Son likewise.",
  "John 12:49": "For I have not spoken of myself; but the Father which sent me, he gave me a commandment, what I should say, and what I should speak.",
  "1 Samuel 15:13": "And Samuel came to Saul: and Saul said unto him, Blessed be thou of the LORD: I have performed the commandment of the LORD.",
  "1 Samuel 15:22": "And Samuel said, Hath the LORD as great delight in burnt offerings and sacrifices, as in obeying the voice of the LORD? Behold, to obey is better than sacrifice, and to hearken than the fat of rams.",
  "Numbers 22:18": "I cannot go beyond the word of the LORD my God, to do less or more.",
  "Ecclesiastes 10:8": "He that diggeth a pit shall fall into it; and whoso breaketh an hedge, a serpent shall bite him.",
  "Song of Solomon 2:15": "Take us the foxes, the little foxes, that spoil the vines: for our vines have tender grapes.",
  "Ezekiel 22:30": "And I sought for a man among them, that should make up the hedge, and stand in the gap before me for the land, that I should not destroy it: but I found none.",
  "Nehemiah 4:7": "that the walls of Jerusalem were made up, and that the breaches began to be stopped",
  "Isaiah 58:12": "and thou shalt be called, The repairer of the breach, The restorer of paths to dwell in.",
  "Ecclesiastes 4:12": "And if one prevail against him, two shall withstand him; and a threefold cord is not quickly broken.",
  "Proverbs 25:28": "He that hath no rule over his own spirit is like a city that is broken down, and without walls.",
  "Matthew 13:25": "But while men slept, his enemy came and sowed tares among the wheat, and went his way.",
  "Mark 13:35": "Watch ye therefore: for ye know not when the master of the house cometh, at even, or at midnight, or at the cockcrowing, or in the morning:",
  "Mark 13:37": "And what I say unto you I say unto all, Watch.",
  "Psalms 121:4": "Behold, he that keepeth Israel shall neither slumber nor sleep.",
  "Ezekiel 33:6": "But if the watchman see the sword come, and blow not the trumpet, and the people be not warned; if the sword come, and take any person from among them, he is taken away in his iniquity; but his blood will I require at the watchman’s hand.",
  "Ephesians 5:11": "And have no fellowship with the unfruitful works of darkness, but rather reprove them.",
  "Daniel 6:4": "forasmuch as he was faithful, neither was there any error or fault found in him.",
  "James 1:19": "Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath:",
  "Proverbs 18:13": "He that answereth a matter before he heareth it, it is folly and shame unto him.",
  "1 Timothy 3:10": "And let these also first be proved; then let them use the office of a deacon, being found blameless.",
  "Luke 16:10": "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.",
  "Matthew 25:21": "Well done, thou good and faithful servant: thou hast been faithful over a few things, I will make thee ruler over many things",
  "Luke 16:2": "And he called him, and said unto him, How is it that I hear this of thee? give an account of thy stewardship; for thou mayest be no longer steward.",
  "Proverbs 25:19": "Confidence in an unfaithful man in time of trouble is like a broken tooth, and a foot out of joint.",
  "Proverbs 27:23": "Be thou diligent to know the state of thy flocks, and look well to thy herds.",
  "Hebrews 4:13": "Neither is there any creature that is not manifest in his sight: but all things are naked and opened unto the eyes of him with whom we have to do.",
  "Luke 12:2": "For there is nothing covered, that shall not be revealed; neither hid, that shall not be known.",
  "Malachi 3:16": "and the LORD hearkened, and heard it, and a book of remembrance was written before him",
  "Matthew 8:9": "For I am a man under authority, having soldiers under me: and I say to this man, Go, and he goeth; and to another, Come, and he cometh; and to my servant, Do this, and he doeth it.",
  "Proverbs 15:22": "Without counsel purposes are disappointed: but in the multitude of counsellors they are established.",
  "Proverbs 11:14": "Where no counsel is, the people fall: but in the multitude of counsellors there is safety.",
  "Proverbs 21:5": "The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.",
  "Luke 14:28": "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?",
  "Proverbs 24:3": "Through wisdom is an house builded; and by understanding it is established:",
  "Proverbs 24:4": "And by knowledge shall the chambers be filled with all precious and pleasant riches.",
  "Luke 6:48": "He is like a man which built an house, and digged deep, and laid the foundation on a rock: and when the flood arose, the stream beat vehemently upon that house, and could not shake it: for it was founded upon a rock.",
  "2 Timothy 1:7": "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
  "Psalms 127:1": "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain.",
};

const SOV29_CORPUS = {
  "Job 38:11": ["Job", 38, 11],
  "Proverbs 8:29": ["Proverbs", 8, 29],
  "Jeremiah 5:22": ["Jeremiah", 5, 22],
  "Acts 17:26": ["Acts", 17, 26],
  "Genesis 2:16": ["Genesis", 2, 16],
  "Genesis 2:17": ["Genesis", 2, 17],
  "1 Thessalonians 5:21": ["1Thessalonians", 5, 21],
  "Proverbs 14:12": ["Proverbs", 14, 12],
  "Romans 3:8": ["Romans", 3, 8],
  "Proverbs 11:1": ["Proverbs", 11, 1],
  "Proverbs 20:17": ["Proverbs", 20, 17],
  "Matthew 4:8": ["Matthew", 4, 8],
  "Matthew 4:9": ["Matthew", 4, 9],
  "Matthew 4:10": ["Matthew", 4, 10],
  "John 5:19": ["John", 5, 19],
  "John 12:49": ["John", 12, 49],
  "1 Samuel 15:13": ["1Samuel", 15, 13],
  "1 Samuel 15:22": ["1Samuel", 15, 22],
  "Numbers 22:18": ["Numbers", 22, 18],
  "Ecclesiastes 10:8": ["Ecclesiastes", 10, 8],
  "Song of Solomon 2:15": ["SongofSolomon", 2, 15],
  "Ezekiel 22:30": ["Ezekiel", 22, 30],
  "Nehemiah 4:7": ["Nehemiah", 4, 7],
  "Isaiah 58:12": ["Isaiah", 58, 12],
  "Ecclesiastes 4:12": ["Ecclesiastes", 4, 12],
  "Proverbs 25:28": ["Proverbs", 25, 28],
  "Matthew 13:25": ["Matthew", 13, 25],
  "Mark 13:35": ["Mark", 13, 35],
  "Mark 13:37": ["Mark", 13, 37],
  "Psalms 121:4": ["Psalms", 121, 4],
  "Ezekiel 33:6": ["Ezekiel", 33, 6],
  "Ephesians 5:11": ["Ephesians", 5, 11],
  "Daniel 6:4": ["Daniel", 6, 4],
  "James 1:19": ["James", 1, 19],
  "Proverbs 18:13": ["Proverbs", 18, 13],
  "1 Timothy 3:10": ["1Timothy", 3, 10],
  "Luke 16:10": ["Luke", 16, 10],
  "Matthew 25:21": ["Matthew", 25, 21],
  "Luke 16:2": ["Luke", 16, 2],
  "Proverbs 25:19": ["Proverbs", 25, 19],
  "Proverbs 27:23": ["Proverbs", 27, 23],
  "Hebrews 4:13": ["Hebrews", 4, 13],
  "Luke 12:2": ["Luke", 12, 2],
  "Malachi 3:16": ["Malachi", 3, 16],
  "Matthew 8:9": ["Matthew", 8, 9],
  "Proverbs 15:22": ["Proverbs", 15, 22],
  "Proverbs 11:14": ["Proverbs", 11, 14],
  "Proverbs 21:5": ["Proverbs", 21, 5],
  "Luke 14:28": ["Luke", 14, 28],
  "Proverbs 24:3": ["Proverbs", 24, 3],
  "Proverbs 24:4": ["Proverbs", 24, 4],
  "Luke 6:48": ["Luke", 6, 48],
  "2 Timothy 1:7": ["2Timothy", 1, 7],
  "Psalms 127:1": ["Psalms", 127, 1],
};

// The only non-Scripture double-quoted spans the deep lesson may carry: the
// article's own words (attributed in the text) and Darrell's marker.
const SOV29_ALLOWED = [
  '"Lesson."',
  '"Did OpenAI lose control?"',
  '"This isn\'t Skynet. It\'s a very motivated intern with zero sense of boundaries."',
  '"agents chase the goal, not your rules"',
  '"Give agents only the access the task needs."',
  '"maybe don\'t hand your agent the whole keychain"',
  '"Turn on activity logs, then actually read them."',
  '"Require human approval before anything sends, posts, or pays."',
  '"Same brain, better workspace."',
];

const corpusVerse = (book, ch, v) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

// The checks, as pure functions of a module, so the proven-to-catch block can
// run the SAME checks against a mutated copy and show they fail.
function missingVerbatim(mod) {
  const bad = [];
  for (const [ref, fragment] of Object.entries(SOV29_FRAGMENTS)) {
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
    const pinned = SOV29_FRAGMENTS[ref];
    seen += 1;
    if (!pinned || !(pinned.includes(q) || q.includes(pinned))) bad.push(`${ref}: ${q}`);
  }
  return { bad, seen };
}
function unattributedQuotes(mod) {
  const isWord = (q) => Object.values(SOV29_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
  const nonScripture = (mod.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
  return { nonScripture, bad: nonScripture.filter((q) => !SOV29_ALLOWED.includes(q)) };
}

describe('sov29 — the agent that went past the bound quotes its whole spine verbatim, Word first', () => {
  it('the week exists as the 29th, anchored on the bound and on obedience', () => {
    expect(sov29).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.indexOf(sov29)).toBe(28);
    expect(sov29.anchor.ref).toContain('Job 38:11');
    expect(sov29.anchor.ref).toContain('1 Samuel 15:22');
    expect(sov29.anchor.theme).toContain(SOV29_FRAGMENTS['Job 38:11']);
    expect(SOV29_FRAGMENTS['1 Samuel 15:22']).toContain('Behold, to obey is better than sacrifice, and to hearken than the fat of rams.');
    expect(sov29.anchor.theme).toContain('"Behold, to obey is better than sacrifice, and to hearken than the fat of rams." (1 Samuel 15:22)');
  });
  it('every pinned fragment appears letter-for-letter in the deep lesson, named beside its quote', () => {
    expect(Object.keys(SOV29_FRAGMENTS).length).toBeGreaterThanOrEqual(50);
    expect(missingVerbatim(sov29)).toEqual([]);
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    for (const [ref, fragment] of Object.entries(SOV29_FRAGMENTS)) {
      const at = SOV29_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(corpusVerse(...at), `${ref} corpus`).toContain(fragment);
    }
  });
  it('every quoted verse in the other fields (bigIdea, anchor, benefits, rpe, bands, quiz, facilitator) is a pinned fragment or nests with one', () => {
    const { bad, seen } = unpinnedQuotesInOtherFields(sov29);
    expect(bad).toEqual([]);
    expect(seen).toBeGreaterThan(20);
  });
  it('the Word LEADS: the bound is taught before the article is reported', () => {
    expect(sov29.lesson.indexOf('FIRST, YAHWEH SETS THE BOUND')).toBe(0);
    expect(sov29.lesson.indexOf('(Job 38:11)')).toBeLessThan(sov29.lesson.indexOf('SECOND,'));
    expect(sov29.lesson.indexOf('(Genesis 2:17)')).toBeLessThan(sov29.lesson.indexOf('The Neuron'));
  });
  it('the ten movements are carried in order', () => {
    const heads = [
      'FIRST, YAHWEH SETS THE BOUND - HITHERTO SHALT THOU COME, BUT NO FURTHER',
      'SECOND, WHAT THE ARTICLE REPORTED - AND WHAT WE COULD VERIFY',
      'THIRD, THE AGENT CHASED THE GOAL - AND THE LAMB REFUSED THE SHORTCUT',
      'FOURTH, TO OBEY IS BETTER THAN SACRIFICE - A REPORT OF SUCCESS IS NOT OBEDIENCE',
      'FIFTH, THE HEDGE WITH A GAP - STAND IN THE GAP, AND MAKE THE CORD THREEFOLD',
      'SIXTH, THE BRAKE THAT DID NOT FIRE - ONLY ONE WATCHMAN NEVER SLEEPS',
      'SEVENTH, THE WHISTLEBLOWERS AND THE UNREAD INBOX - A WARNING NO ONE HEARS',
      'EIGHTH, FIRST BE PROVED, THEN USE THE OFFICE - ONLY THE ACCESS THE TASK NEEDS',
      'NINTH, READ THE RECORD, AND ASK BEFORE IT SENDS, POSTS, OR PAYS - THE SERVANT UNDER AUTHORITY',
      'TENTH, THE HARNESS, THE HOUSE, AND NOT THE SPIRIT OF FEAR',
    ];
    let last = -1;
    for (const h of heads) {
      const at = sov29.lesson.indexOf(h);
      expect(at, `movement in order: ${h}`).toBeGreaterThan(last);
      last = at;
    }
    // The shortcut refused is Matthew 4:8-10, taught inside the third movement.
    for (const v of ['Matthew 4:8', 'Matthew 4:9', 'Matthew 4:10']) {
      expect(sov29.lesson.indexOf(`(${v})`)).toBeGreaterThan(sov29.lesson.indexOf('THIRD,'));
      expect(sov29.lesson.indexOf(`(${v})`)).toBeLessThan(sov29.lesson.indexOf('FOURTH,'));
    }
  });
  it('provenance is honest: claims attributed, corroborations named, the unverified named and NOT taught as fact', () => {
    expect(sov29.lesson).toContain('FIRST PILE, WHAT THE ARTICLE CLAIMED, attributed to it.');
    expect(sov29.lesson).toContain('SECOND PILE, WHAT INDEPENDENT REPORTS CORROBORATE');
    expect(sov29.lesson).toContain('the lab\'s own statement and the Axios report were not read directly from this session; that is said plainly');
    expect(sov29.lesson).toContain('THIRD PILE, WHAT WE COULD NOT VERIFY, and so do not teach as fact');
    for (const unverified of ['16,000-plus visits to a UN data site', 'the 53 images', 'the SEC and Census details', 'no one read the feedback channel until later']) {
      expect(sov29.lesson.indexOf(unverified), unverified).toBeGreaterThan(sov29.lesson.indexOf('THIRD PILE'));
    }
    // The newsletter's "national health database" is stronger than the record; the lesson says so.
    expect(sov29.lesson).toContain('the newsletter\'s national health database is a stronger phrase than the record supports');
    // Conflict of interest disclosed: the drafting A.I.'s maker is named in the article.
    expect(sov29.lesson).toContain('the A.I. that drafted this page is built by one of the labs the article names');
    const { nonScripture, bad } = unattributedQuotes(sov29);
    expect(nonScripture.length).toBeGreaterThanOrEqual(8);
    expect(bad).toEqual([]);
  });
  it('speaks established fact plainly and flags narrowly (DR-0100): three tiers, over-reach corrected both ways', () => {
    expect(sov29.lesson).toContain('Established, and stated plainly:');
    expect(sov29.lesson).toContain('That is real, documented, and not to be shrunk into nothing.');
    expect(sov29.lesson).toContain('Open, and named narrowly:');
    expect(sov29.lesson).toContain('Over-reach, corrected both ways:');
  });
  it('this house is cited honestly: the June runaway, the three brakes, and the amendment as it actually stands', () => {
    expect(sov29.lesson).toContain('On 2026-06-06 a fleet of this house\'s own timer-driven automation');
    expect(sov29.lesson).toContain('that law was amended by Darrell: the deterministic loops');
    expect(sov29.lesson).toContain('the heavier A.I.-class gates keep the full brake set');
    expect(sov29.lesson).toContain('the Governed Support Door lets a helper fix issues without ambient access');
    // Readers are never handed our bookkeeping: record ids live only in the facilitator notes.
    expect(JSON.stringify({ ...sov29, facilitator: null })).not.toMatch(/DR-\d{4}/);
    expect(sov29.inApp).toMatch(/Admin - Systems/);
    expect(sov29.inApp).toMatch(/Admin - Support access/);
  });
  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized; the Lamb confessed', () => {
    const ours = sov29.lesson.replace(/"[^"]+"/g, '');
    expect(ours).not.toMatch(/\bGod\b/);
    expect(ours).toMatch(/Yahweh/);
    expect(JSON.stringify(sov29)).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
    expect(sov29.lesson).toContain('the Word');
    expect(sov29.lesson).toMatch(/The Son of Yahweh, the Lamb/);
    // Matthew 4:10's opening words to the adversary are not quoted; the answer is.
    expect(SOV29_FRAGMENTS['Matthew 4:10'].startsWith('for it is written')).toBe(true);
  });
  it('age bands: child, teen and senior are authored, and the quiz has real questions', () => {
    for (const b of ['child', 'teen', 'senior']) expect(sov29.levels[b].length, b).toBeGreaterThan(800);
    expect(sov29.quiz.questions.length).toBeGreaterThanOrEqual(6);
    for (const q of sov29.quiz.questions) expect(q.options[q.answer], q.q).toBeTruthy();
  });
});

describe('sov29 — proven-to-catch: the gate fails on a drifted verse or an unattributed claim', () => {
  it('the pinned ground truth is itself exact', () => {
    expect(SOV29_FRAGMENTS['Job 38:11']).toBe('And said, Hitherto shalt thou come, but no further: and here shall thy proud waves be stayed?');
    expect(SOV29_FRAGMENTS['1 Samuel 15:22']).toBe('And Samuel said, Hath the LORD as great delight in burnt offerings and sacrifices, as in obeying the voice of the LORD? Behold, to obey is better than sacrifice, and to hearken than the fat of rams.');
    expect(SOV29_FRAGMENTS['Psalms 121:4']).toBe('Behold, he that keepeth Israel shall neither slumber nor sleep.');
    // The corpus apostrophe is typographic; a straight one would be a silent drift.
    expect(SOV29_FRAGMENTS['Ezekiel 33:6']).toContain('watchman’s hand');
  });
  it('a one-word drift of Job 38:11 in the lesson is caught', () => {
    const drifted = { ...sov29, lesson: sov29.lesson.split('Hitherto shalt thou come').join('Thus far shalt thou come') };
    expect(missingVerbatim(drifted)).toContain('Job 38:11');
  });
  it('a drifted verse in another field (the teen band) is caught', () => {
    const drifted = { ...sov29, levels: { ...sov29.levels, teen: sov29.levels.teen.split('to obey is better than sacrifice').join('to obey is better than offerings') } };
    expect(unpinnedQuotesInOtherFields(drifted).bad.some((b) => b.startsWith('1 Samuel 15:22'))).toBe(true);
  });
  it('an unattributed claim smuggled into the lesson in quotation marks is caught', () => {
    const smuggled = { ...sov29, lesson: `${sov29.lesson} "The A.I. is alive."` };
    expect(unattributedQuotes(smuggled).bad).toEqual(['"The A.I. is alive."']);
  });
});
