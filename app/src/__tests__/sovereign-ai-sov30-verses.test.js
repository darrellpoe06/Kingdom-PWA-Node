// =============================================================================
// sov30 — the watcher the agent cannot see (DR-0682)
// =============================================================================
// Week 30 of Sovereign A.I., captured 2026-09-29 by the Gmail-lesson-intake Way
// (DR-0312) from The Daily Upside newsletter Darrell forwarded with "Lesson"
// ("Nvidia's Rogue AI Slayer", 2026-09-29). The answer-half of sov29 (the agent
// that went past the bound, DR-0662). Word first: Yahweh keeps the way
// (Genesis 3:24); the Lamb is the one door (John 10:1, 9); the eyes of Yahweh
// run to and fro (2 Chronicles 16:9); quarantine that looks again (Leviticus
// 13:4, 6); the first in his own cause is searched out (Proverbs 18:17).
//
// Every quoted verse below was FILLED from app/public/bible/kjv by a generator
// (never typed from memory) and is re-read from the corpus at test time — two
// witnesses. Every non-Scripture quote in the deep lesson is allow-listed to
// the article's own words or Darrell's marker, so a claim cannot enter the
// lesson in quotation marks unattributed (DR-0076 SS8). Proven-to-catch: the
// last block mutates a verse, a band, a claim and a pile, and shows each fails.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOV30_ID = 'sov30-the-watcher-the-agent-cannot-see-and-the-door-with-no-hidden-hatch';
const sov30 = SOVEREIGN_AI_MODULES.find((w) => w.id === SOV30_ID);

const SOV30_FRAGMENTS = {
  "Genesis 3:24": "So he drove out the man; and he placed at the east of the garden of Eden Cherubims, and a flaming sword which turned every way, to keep the way of the tree of life.",
  "Genesis 7:16": "And they that went in, went in male and female of all flesh, as God had commanded him: and the LORD shut him in.",
  "Genesis 11:6": "And the LORD said, Behold, the people is one, and they have all one language; and this they begin to do: and now nothing will be restrained from them, which they have imagined to do.",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "Proverbs 18:17": "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.",
  "Acts 17:11": "and searched the scriptures daily, whether those things were so.",
  "John 1:29": "Behold the Lamb of God, which taketh away the sin of the world.",
  "John 10:1": "Verily, verily, I say unto you, He that entereth not by the door into the sheepfold, but climbeth up some other way, the same is a thief and a robber.",
  "John 10:2": "But he that entereth in by the door is the shepherd of the sheep.",
  "John 10:9": "I am the door: by me if any man enter in, he shall be saved, and shall go in and out, and find pasture.",
  "John 10:11": "I am the good shepherd: the good shepherd giveth his life for the sheep.",
  "Nehemiah 13:19": "I commanded that the gates should be shut, and charged that they should not be opened till after the sabbath: and some of my servants set I at the gates, that there should no burden be brought in on the sabbath day.",
  "Psalms 141:3": "Set a watch, O LORD, before my mouth; keep the door of my lips.",
  "Proverbs 4:23": "Keep thy heart with all diligence; for out of it are the issues of life.",
  "Psalms 125:2": "As the mountains are round about Jerusalem, so the LORD is round about his people from henceforth even for ever.",
  "Zechariah 2:5": "For I, saith the LORD, will be unto her a wall of fire round about, and will be the glory in the midst of her.",
  "2 Chronicles 16:9": "For the eyes of the LORD run to and fro throughout the whole earth, to shew himself strong in the behalf of them whose heart is perfect toward him.",
  "Proverbs 15:3": "The eyes of the LORD are in every place, beholding the evil and the good.",
  "Jeremiah 23:24": "Can any hide himself in secret places that I shall not see him? saith the LORD. Do not I fill heaven and earth? saith the LORD.",
  "Psalms 139:7": "Whither shall I go from thy spirit? or whither shall I flee from thy presence?",
  "Psalms 139:12": "Yea, the darkness hideth not from thee; but the night shineth as the day: the darkness and the light are both alike to thee.",
  "Hebrews 4:13": "Neither is there any creature that is not manifest in his sight: but all things are naked and opened unto the eyes of him with whom we have to do.",
  "Numbers 32:23": "be sure your sin will find you out.",
  "Leviticus 13:4": "then the priest shall shut up him that hath the plague seven days:",
  "Leviticus 13:6": "And the priest shall look on him again the seventh day: and, behold, if the plague be somewhat dark, and the plague spread not in the skin, the priest shall pronounce him clean:",
  "Proverbs 17:14": "The beginning of strife is as when one letteth out water: therefore leave off contention, before it be meddled with.",
  "Proverbs 16:32": "He that is slow to anger is better than the mighty; and he that ruleth his spirit than he that taketh a city.",
  "Titus 2:12": "Teaching us that, denying ungodliness and worldly lusts, we should live soberly, righteously, and godly, in this present world;",
  "Romans 13:1": "Let every soul be subject unto the higher powers. For there is no power but of God: the powers that be are ordained of God.",
  "Proverbs 22:3": "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.",
  "Luke 14:28": "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?",
  "Proverbs 14:15": "The simple believeth every word: but the prudent man looketh well to his going.",
  "Leviticus 19:36": "Just balances, just weights, a just ephah, and a just hin, shall ye have:",
  "Proverbs 25:2": "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.",
  "Proverbs 22:7": "The rich ruleth over the poor, and the borrower is servant to the lender.",
  "1 Kings 21:3": "And Naboth said to Ahab, The LORD forbid it me, that I should give the inheritance of my fathers unto thee.",
  "Micah 4:4": "But they shall sit every man under his vine and under his fig tree; and none shall make them afraid: for the mouth of the LORD of hosts hath spoken it.",
  "Daniel 1:12": "Prove thy servants, I beseech thee, ten days;",
  "Isaiah 62:6": "I have set watchmen upon thy walls, O Jerusalem, which shall never hold their peace day nor night:",
  "Habakkuk 2:1": "I will stand upon my watch, and set me upon the tower, and will watch to see what he will say unto me, and what I shall answer when I am reproved.",
  "2 Timothy 1:7": "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
  "Psalms 127:1": "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain.",
};

const SOV30_CORPUS = {
  "Genesis 3:24": ["Genesis", 3, 24],
  "Genesis 7:16": ["Genesis", 7, 16],
  "Genesis 11:6": ["Genesis", 11, 6],
  "1 Thessalonians 5:21": ["1Thessalonians", 5, 21],
  "Proverbs 18:17": ["Proverbs", 18, 17],
  "Acts 17:11": ["Acts", 17, 11],
  "John 1:29": ["John", 1, 29],
  "John 10:1": ["John", 10, 1],
  "John 10:2": ["John", 10, 2],
  "John 10:9": ["John", 10, 9],
  "John 10:11": ["John", 10, 11],
  "Nehemiah 13:19": ["Nehemiah", 13, 19],
  "Psalms 141:3": ["Psalms", 141, 3],
  "Proverbs 4:23": ["Proverbs", 4, 23],
  "Psalms 125:2": ["Psalms", 125, 2],
  "Zechariah 2:5": ["Zechariah", 2, 5],
  "2 Chronicles 16:9": ["2Chronicles", 16, 9],
  "Proverbs 15:3": ["Proverbs", 15, 3],
  "Jeremiah 23:24": ["Jeremiah", 23, 24],
  "Psalms 139:7": ["Psalms", 139, 7],
  "Psalms 139:12": ["Psalms", 139, 12],
  "Hebrews 4:13": ["Hebrews", 4, 13],
  "Numbers 32:23": ["Numbers", 32, 23],
  "Leviticus 13:4": ["Leviticus", 13, 4],
  "Leviticus 13:6": ["Leviticus", 13, 6],
  "Proverbs 17:14": ["Proverbs", 17, 14],
  "Proverbs 16:32": ["Proverbs", 16, 32],
  "Titus 2:12": ["Titus", 2, 12],
  "Romans 13:1": ["Romans", 13, 1],
  "Proverbs 22:3": ["Proverbs", 22, 3],
  "Luke 14:28": ["Luke", 14, 28],
  "Proverbs 14:15": ["Proverbs", 14, 15],
  "Leviticus 19:36": ["Leviticus", 19, 36],
  "Proverbs 25:2": ["Proverbs", 25, 2],
  "Proverbs 22:7": ["Proverbs", 22, 7],
  "1 Kings 21:3": ["1Kings", 21, 3],
  "Micah 4:4": ["Micah", 4, 4],
  "Daniel 1:12": ["Daniel", 1, 12],
  "Isaiah 62:6": ["Isaiah", 62, 6],
  "Habakkuk 2:1": ["Habakkuk", 2, 1],
  "2 Timothy 1:7": ["2Timothy", 1, 7],
  "Psalms 127:1": ["Psalms", 127, 1],
};

// The only non-Scripture double-quoted spans the deep lesson may carry: the
// article's own words (attributed in the text) and Darrell's marker.
const SOV30_ALLOWED = [
  '"Lesson"',
  '"Nvidia\'s Rogue AI Slayer"',
  '"The first problem is the isolation; the containment wasn\'t good enough."',
  '"browser for agents"',
  '"that attempt to move outside their boundaries in milliseconds"',
  '"from just capability to a lot of verification, evaluation and testing"',
  '"In other words: more chip sales for Nvidia."',
];

// The article's own words, checked against the forwarded email text as it was
// read on 2026-09-29 (apostrophes normalised to straight quotes).
const ARTICLE_SENTENCES = [
  'The first problem is the isolation; the containment wasn\'t good enough.',
  'that attempt to move outside their boundaries in milliseconds',
  'from just capability to a lot of verification, evaluation and testing',
  'In other words: more chip sales for Nvidia.',
];

const corpusVerse = (book, ch, v) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

// The checks, as pure functions of a module, so the proven-to-catch block can
// run the SAME checks against a mutated copy and show they fail.
function missingVerbatim(mod) {
  const bad = [];
  for (const [ref, fragment] of Object.entries(SOV30_FRAGMENTS)) {
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
    const pinned = SOV30_FRAGMENTS[ref];
    seen += 1;
    if (!pinned || !(pinned.includes(q) || q.includes(pinned))) bad.push(`${ref}: ${q}`);
  }
  return { bad, seen };
}
function unattributedQuotes(mod) {
  const isWord = (q) => Object.values(SOV30_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
  const nonScripture = (mod.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
  return { nonScripture, bad: nonScripture.filter((q) => !SOV30_ALLOWED.includes(q)) };
}
// The unverified claims must sit in the third pile, never ahead of it.
const UNVERIFIED = [
  'the exact wording of the Ezra Klein quotation',
  'the CNBC remarks about a browser for agents and big trouble',
  'that OpenShell runs on Vera chips in particular',
  'that Sentry is itself open source',
  'the factor-of-10 compute claim',
  'an intrusion at the US government',
  'the largest-company-in-history line',
];
function unverifiedOutOfPlace(mod) {
  const pile = mod.lesson.indexOf('THIRD PILE, WHAT WE COULD NOT VERIFY');
  const third = mod.lesson.indexOf('THIRD, ONE DOOR');
  return UNVERIFIED.filter((u) => { const at = mod.lesson.indexOf(u); return pile < 0 || at < pile || at > third; });
}

describe('sov30 — the watcher the agent cannot see quotes its whole spine verbatim, Word first', () => {
  it('the week exists right after sov29, anchored on the one door and the Watcher out of reach', () => {
    expect(sov30).toBeTruthy();
    const sov29 = SOVEREIGN_AI_MODULES.findIndex((w) => w.id === 'sov29-the-agent-that-went-past-the-bound');
    expect(SOVEREIGN_AI_MODULES.indexOf(sov30)).toBe(sov29 + 1);
    expect(sov30.anchor.ref).toContain('John 10:9');
    expect(sov30.anchor.ref).toContain('2 Chronicles 16:9');
    expect(sov30.anchor.theme).toContain(`"${SOV30_FRAGMENTS['John 10:9']}" (John 10:9)`);
    expect(sov30.anchor.theme).toContain(`"${SOV30_FRAGMENTS['2 Chronicles 16:9']}" (2 Chronicles 16:9)`);
  });
  it('every pinned fragment appears letter-for-letter in the deep lesson, named beside its quote', () => {
    expect(Object.keys(SOV30_FRAGMENTS).length).toBeGreaterThanOrEqual(40);
    expect(missingVerbatim(sov30)).toEqual([]);
  });
  it('every fragment matches the repo KJV corpus, not memory (two witnesses)', () => {
    for (const [ref, fragment] of Object.entries(SOV30_FRAGMENTS)) {
      const at = SOV30_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(corpusVerse(...at), `${ref} corpus`).toContain(fragment);
    }
  });
  it('every quoted verse in the other fields (bigIdea, anchor, benefits, rpe, bands, quiz, facilitator) is a pinned fragment or nests with one', () => {
    const { bad, seen } = unpinnedQuotesInOtherFields(sov30);
    expect(bad).toEqual([]);
    expect(seen).toBeGreaterThan(30);
  });
  it('the Word LEADS: Yahweh keeps the way before the article is reported', () => {
    expect(sov30.lesson.indexOf('FIRST, YAHWEH KEEPS THE WAY')).toBe(0);
    expect(sov30.lesson.indexOf('(Genesis 3:24)')).toBeLessThan(sov30.lesson.indexOf('SECOND,'));
    expect(sov30.lesson.indexOf('(Genesis 11:6)')).toBeLessThan(sov30.lesson.indexOf('The Daily Upside'));
  });
  it('the ten movements are carried in order', () => {
    const heads = [
      'FIRST, YAHWEH KEEPS THE WAY - THE FLAMING SWORD, THE SHUT DOOR, AND NOTHING RESTRAINED',
      'SECOND, WHAT THE ARTICLE REPORTED - AND WHAT WE COULD VERIFY',
      'THIRD, ONE DOOR AND NO HIDDEN HATCH - THE LAMB IS THE DOOR OF THE SHEEPFOLD',
      'FOURTH, SET THE WATCH BEFORE IT RUNS - WHAT IT MAY SEE, DO, AND TOUCH',
      'FIFTH, THE WATCHER THE AGENT CANNOT SEE - THE EYES OF YAHWEH RUN TO AND FRO',
      'SIXTH, QUARANTINE IS NOT DESTRUCTION - SHUT UP, LOOKED ON AGAIN, AND PRONOUNCED CLEAN',
      'SEVENTH, RESTRAINT AND AUTHORITY - THE WORD GIVES BOTH',
      'EIGHTH, THE SELLER WHO SELLS THE REMEDY - SEARCH IT OUT, WHETHER THOSE THINGS WERE SO',
      'NINTH, THE HUB CHANGES HANDS - SIT UNDER YOUR OWN VINE',
      'TENTH, PROVE IT, THEN KEEP THE CITY - EVALUATION OVER CAPABILITY, AND NOT THE SPIRIT OF FEAR',
    ];
    let last = -1;
    for (const h of heads) {
      const at = sov30.lesson.indexOf(h);
      expect(at, `movement in order: ${h}`).toBeGreaterThan(last);
      last = at;
    }
    // The one door is John 10, taught inside the third movement.
    for (const v of ['John 10:1', 'John 10:9', 'John 1:29']) {
      expect(sov30.lesson.indexOf(`(${v})`)).toBeGreaterThan(sov30.lesson.indexOf('THIRD,'));
      expect(sov30.lesson.indexOf(`(${v})`)).toBeLessThan(sov30.lesson.indexOf('FOURTH,'));
    }
    // Quarantine is Leviticus 13, taught inside the sixth movement.
    for (const v of ['Leviticus 13:4', 'Leviticus 13:6']) {
      expect(sov30.lesson.indexOf(`(${v})`)).toBeGreaterThan(sov30.lesson.indexOf('SIXTH,'));
      expect(sov30.lesson.indexOf(`(${v})`)).toBeLessThan(sov30.lesson.indexOf('SEVENTH,'));
    }
  });
  it('provenance is honest: claims attributed, corroborations named, the unverified named and NOT taught as fact', () => {
    expect(sov30.lesson).toContain('FIRST PILE, WHAT THE ARTICLE CLAIMED, attributed to it.');
    expect(sov30.lesson).toContain('SECOND PILE, WHAT NVIDIA\'S RELEASE AND INDEPENDENT REPORTS CORROBORATE');
    expect(sov30.lesson).toContain('read as search results, not every page in full; that is said plainly');
    expect(sov30.lesson).toContain('THIRD PILE, WHAT WE COULD NOT VERIFY, and so do not teach as fact');
    expect(unverifiedOutOfPlace(sov30)).toEqual([]);
    // Where the newsletter's line differs from the record, the lesson says so.
    expect(sov30.lesson).toContain('broader than the newsletter\'s line');
    expect(sov30.lesson).toContain('agreed, not yet closed');
    expect(sov30.lesson).toContain('the government system independently reported last week was an Australian health-statistics portal');
    // Conflict of interest disclosed: the drafting A.I.'s maker is a named launch partner.
    expect(sov30.lesson).toContain('the A.I. that drafted this page is built by Anthropic, which Nvidia names among the platform\'s launch partners');
    const { nonScripture, bad } = unattributedQuotes(sov30);
    expect(nonScripture.length).toBeGreaterThanOrEqual(7);
    expect(bad).toEqual([]);
  });
  it('the allow-listed article words are the article\'s own sentences, not a paraphrase', () => {
    for (const s of ARTICLE_SENTENCES) expect(SOV30_ALLOWED.some((a) => a === `"${s}"`), s).toBe(true);
  });
  it('speaks established fact plainly and flags narrowly (DR-0100): three tiers, over-reach corrected both ways', () => {
    expect(sov30.lesson).toContain('Established, and stated plainly:');
    expect(sov30.lesson).toContain('That is real, and not to be shrunk into nothing.');
    expect(sov30.lesson).toContain('Open, and named narrowly:');
    expect(sov30.lesson).toContain('Over-reach, corrected both ways:');
    // The incentive is named as fact, not as a charge (DR-0100), and answered by testing.
    expect(sov30.lesson).toContain('because it is a fact, not a charge');
  });
  it('teaches the Word, not a debate (DR-0098): restraint AND authority, no side staged', () => {
    expect(sov30.lesson).toContain('This lesson does not stage that as a contest for the reader to pick a side');
    expect(sov30.lesson).toContain('(Proverbs 16:32)');
    expect(sov30.lesson).toContain('(Romans 13:1)');
  });
  it('links back to sov29 and cites this house honestly; readers never see record ids', () => {
    expect(sov30.lesson).toContain('the agent that went past the bound (week 29)');
    expect(sov30.bigIdea).toContain('the agent that went past the bound');
    expect(sov30.facilitator.talkingPoints.join(' ')).toContain('sov29 (DR-0662)');
    expect(sov30.facilitator.talkingPoints.join(' ')).toContain('DR-0682');
    expect(JSON.stringify({ ...sov30, facilitator: null })).not.toMatch(/DR-\d{4}/);
    expect(sov30.inApp).toMatch(/Admin - Systems/);
    expect(sov30.inApp).toMatch(/Admin - Support access/);
  });
  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized; the Lamb confessed', () => {
    const ours = sov30.lesson.replace(/"[^"]+"/g, '');
    expect(ours).not.toMatch(/\bGod\b/);
    expect(ours).toMatch(/Yahweh/);
    expect(JSON.stringify(sov30)).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
    expect(sov30.lesson).toContain('the Word');
    expect(sov30.lesson).toContain('Jesus is the Lamb of Yahweh, the Eternal Son');
  });
  it('age bands: child, teen and senior are authored, and the quiz has real questions', () => {
    for (const b of ['child', 'teen', 'senior']) expect(sov30.levels[b].length, b).toBeGreaterThan(800);
    expect(sov30.quiz.questions.length).toBeGreaterThanOrEqual(6);
    for (const q of sov30.quiz.questions) expect(q.options[q.answer], q.q).toBeTruthy();
  });
});

describe('sov30 — proven-to-catch: the gate fails on a drifted verse, a stray claim, or a misplaced pile', () => {
  it('the pinned ground truth is itself exact', () => {
    expect(SOV30_FRAGMENTS['John 10:9']).toBe('I am the door: by me if any man enter in, he shall be saved, and shall go in and out, and find pasture.');
    expect(SOV30_FRAGMENTS['2 Chronicles 16:9']).toBe('For the eyes of the LORD run to and fro throughout the whole earth, to shew himself strong in the behalf of them whose heart is perfect toward him.');
    expect(SOV30_FRAGMENTS['Leviticus 13:4']).toBe('then the priest shall shut up him that hath the plague seven days:');
  });
  it('a one-word drift of John 10:9 in the lesson is caught', () => {
    const drifted = { ...sov30, lesson: sov30.lesson.split('I am the door: by me').join('I am the gate: by me') };
    expect(missingVerbatim(drifted)).toContain('John 10:9');
  });
  it('a drifted verse in another field (the child band) is caught', () => {
    const drifted = { ...sov30, levels: { ...sov30.levels, child: sov30.levels.child.split('beholding the evil and the good').join('beholding the bad and the good') } };
    expect(unpinnedQuotesInOtherFields(drifted).bad.some((b) => b.startsWith('Proverbs 15:3'))).toBe(true);
  });
  it('an unattributed claim smuggled into the lesson in quotation marks is caught', () => {
    const smuggled = { ...sov30, lesson: `${sov30.lesson} "Rogue A.I. is now a solved problem."` };
    expect(unattributedQuotes(smuggled).bad).toEqual(['"Rogue A.I. is now a solved problem."']);
  });
  it('an unverified claim promoted out of the third pile is caught', () => {
    const promoted = { ...sov30, lesson: sov30.lesson.replace('the factor-of-10 compute claim; ', '').replace('FIRST PILE, WHAT THE ARTICLE CLAIMED', 'the factor-of-10 compute claim is settled. FIRST PILE, WHAT THE ARTICLE CLAIMED') };
    expect(unverifiedOutOfPlace(promoted)).toEqual(['the factor-of-10 compute claim']);
  });
});
