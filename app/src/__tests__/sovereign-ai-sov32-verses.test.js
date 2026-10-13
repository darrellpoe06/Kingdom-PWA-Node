// =============================================================================
// sov32 — the "I’m fine" problem, and the One who looketh on the heart (DR-0752)
// =============================================================================
// Week 32 of Sovereign A.I., captured 2026-10-01 by the Gmail-lesson-intake Way
// (DR-0312) from The Neuron newsletter Darrell forwarded with "Lesson" (the
// 2026-09-30 issue: the newsletter's interview with Hume AI's chief executive
// Andrew Ettinger — "Voice actually has a listening problem because it just reads
// the transcript."). Word first: the LORD looketh on the heart (1 Samuel 16:7);
// Hannah's lips moved and Eli misread her (1 Samuel 1:12-18); the Spirit carries
// groanings which cannot be uttered (Romans 8:26); swift to hear, slow to speak
// (James 1:19); the outcome is the test (James 2:15-16); our own machines mark
// our own voices (DR-0712, DR-0720).
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
import { hasAllThree, ownPrompts } from '../lib/talk-together.js';
import { anchorRefs } from '../lib/search-it-out.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOV32_ID = "sov32-the-im-fine-problem-and-the-one-who-looketh-on-the-heart";
const sov32 = SOVEREIGN_AI_MODULES.find((w) => w.id === SOV32_ID);

const SOV32_FRAGMENTS = {
  "1 Samuel 16:7": "But the LORD said unto Samuel, Look not on his countenance, or on the height of his stature; because I have refused him: for the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart.",
  "Jeremiah 17:10": "I the LORD search the heart, I try the reins, even to give every man according to his ways, and according to the fruit of his doings.",
  "Jeremiah 17:9": "The heart is deceitful above all things, and desperately wicked: who can know it?",
  "1 Chronicles 28:9": "And thou, Solomon my son, know thou the God of thy father, and serve him with a perfect heart and with a willing mind: for the LORD searcheth all hearts, and understandeth all the imaginations of the thoughts: if thou seek him, he will be found of thee; but if thou forsake him, he will cast thee off for ever.",
  "Psalms 139:1": "O LORD, thou hast searched me, and known me.",
  "Psalms 139:2": "Thou knowest my downsitting and mine uprising, thou understandest my thought afar off.",
  "Psalms 139:4": "For there is not a word in my tongue, but, lo, O LORD, thou knowest it altogether.",
  "Hebrews 4:12": "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.",
  "Hebrews 4:13": "Neither is there any creature that is not manifest in his sight: but all things are naked and opened unto the eyes of him with whom we have to do.",
  "Romans 8:27": "And he that searcheth the hearts knoweth what is the mind of the Spirit, because he maketh intercession for the saints according to the will of God.",
  "Proverbs 20:12": "The hearing ear, and the seeing eye, the LORD hath made even both of them.",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "1 Samuel 1:10": "And she was in bitterness of soul, and prayed unto the LORD, and wept sore.",
  "1 Samuel 1:12": "And it came to pass, as she continued praying before the LORD, that Eli marked her mouth.",
  "1 Samuel 1:13": "Now Hannah, she spake in her heart; only her lips moved, but her voice was not heard: therefore Eli thought she had been drunken.",
  "1 Samuel 1:14": "And Eli said unto her, How long wilt thou be drunken? put away thy wine from thee.",
  "Proverbs 18:13": "He that answereth a matter before he heareth it, it is folly and shame unto him.",
  "1 Samuel 1:15": "And Hannah answered and said, No, my lord, I am a woman of a sorrowful spirit: I have drunk neither wine nor strong drink, but have poured out my soul before the LORD.",
  "1 Samuel 1:16": "Count not thine handmaid for a daughter of belial: for out of the abundance of my complaint and grief have I spoken hitherto.",
  "1 Samuel 1:17": "Then Eli answered and said, Go in peace: and the God of Israel grant thee thy petition that thou hast asked of him.",
  "1 Samuel 1:18": "And she said, Let thine handmaid find grace in thy sight. So the woman went her way, and did eat, and her countenance was no more sad.",
  "Matthew 15:8": "This people draweth nigh unto me with their mouth, and honoureth me with their lips; but their heart is far from me.",
  "Isaiah 29:13": "Wherefore the Lord said, Forasmuch as this people draw near me with their mouth, and with their lips do honour me, but have removed their heart far from me, and their fear toward me is taught by the precept of men:",
  "Proverbs 14:13": "Even in laughter the heart is sorrowful; and the end of that mirth is heaviness.",
  "Proverbs 14:10": "The heart knoweth his own bitterness; and a stranger doth not intermeddle with his joy.",
  "Proverbs 15:13": "A merry heart maketh a cheerful countenance: but by sorrow of the heart the spirit is broken.",
  "Genesis 4:6": "And the LORD said unto Cain, Why art thou wroth? and why is thy countenance fallen?",
  "Nehemiah 2:2": "Wherefore the king said unto me, Why is thy countenance sad, seeing thou art not sick? this is nothing else but sorrow of heart. Then I was very sore afraid,",
  "Genesis 40:7": "And he asked Pharaoh’s officers that were with him in the ward of his lord’s house, saying, Wherefore look ye so sadly to day?",
  "Luke 24:17": "And he said unto them, What manner of communications are these that ye have one to another, as ye walk, and are sad?",
  "Luke 6:45": "A good man out of the good treasure of his heart bringeth forth that which is good; and an evil man out of the evil treasure of his heart bringeth forth that which is evil: for of the abundance of the heart his mouth speaketh.",
  "James 4:14": "Whereas ye know not what shall be on the morrow. For what is your life? It is even a vapour, that appeareth for a little time, and then vanisheth away.",
  "James 4:15": "For that ye ought to say, If the Lord will, we shall live, and do this, or that.",
  "Romans 8:26": "Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought: but the Spirit itself maketh intercession for us with groanings which cannot be uttered.",
  "Exodus 2:23": "And it came to pass in process of time, that the king of Egypt died: and the children of Israel sighed by reason of the bondage, and they cried, and their cry came up unto God by reason of the bondage.",
  "Exodus 2:24": "And God heard their groaning, and God remembered his covenant with Abraham, with Isaac, and with Jacob.",
  "Exodus 3:7": "And the LORD said, I have surely seen the affliction of my people which are in Egypt, and have heard their cry by reason of their taskmasters; for I know their sorrows;",
  "Psalms 38:9": "Lord, all my desire is before thee; and my groaning is not hid from thee.",
  "Psalms 6:6": "I am weary with my groaning; all the night make I my bed to swim; I water my couch with my tears.",
  "Psalms 56:8": "Thou tellest my wanderings: put thou my tears into thy bottle: are they not in thy book?",
  "John 1:29": "The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.",
  "John 3:16": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "Mark 7:34": "And looking up to heaven, he sighed, and saith unto him, Ephphatha, that is, Be opened.",
  "John 11:33": "When Jesus therefore saw her weeping, and the Jews also weeping which came with her, he groaned in the spirit, and was troubled,",
  "John 11:35": "Jesus wept.",
  "Hebrews 4:15": "For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin.",
  "Hebrews 4:16": "Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.",
  "James 1:19": "Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath:",
  "Proverbs 17:27": "He that hath knowledge spareth his words: and a man of understanding is of an excellent spirit.",
  "Proverbs 17:28": "Even a fool, when he holdeth his peace, is counted wise: and he that shutteth his lips is esteemed a man of understanding.",
  "Proverbs 10:19": "In the multitude of words there wanteth not sin: but he that refraineth his lips is wise.",
  "Ecclesiastes 3:7": "A time to rend, and a time to sew; a time to keep silence, and a time to speak;",
  "Job 2:13": "So they sat down with him upon the ground seven days and seven nights, and none spake a word unto him: for they saw that his grief was very great.",
  "Job 13:5": "O that ye would altogether hold your peace! and it should be your wisdom.",
  "Romans 12:15": "Rejoice with them that do rejoice, and weep with them that weep.",
  "Proverbs 25:11": "A word fitly spoken is like apples of gold in pictures of silver.",
  "Proverbs 15:23": "A man hath joy by the answer of his mouth: and a word spoken in due season, how good is it!",
  "Isaiah 50:4": "The Lord GOD hath given me the tongue of the learned, that I should know how to speak a word in season to him that is weary: he wakeneth morning by morning, he wakeneth mine ear to hear as the learned.",
  "Proverbs 16:24": "Pleasant words are as an honeycomb, sweet to the soul, and health to the bones.",
  "Proverbs 12:25": "Heaviness in the heart of man maketh it stoop: but a good word maketh it glad.",
  "Matthew 26:73": "And after a while came unto him they that stood by, and said to Peter, Surely thou also art one of them; for thy speech bewrayeth thee.",
  "Judges 12:6": "Then said they unto him, Say now Shibboleth: and he said Sibboleth: for he could not frame to pronounce it right. Then they took him, and slew him at the passages of Jordan: and there fell at that time of the Ephraimites forty and two thousand.",
  "John 10:3": "To him the porter openeth; and the sheep hear his voice: and he calleth his own sheep by name, and leadeth them out.",
  "John 10:4": "And when he putteth forth his own sheep, he goeth before them, and the sheep follow him: for they know his voice.",
  "John 10:5": "And a stranger will they not follow, but will flee from him: for they know not the voice of strangers.",
  "John 10:27": "My sheep hear my voice, and I know them, and they follow me:",
  "1 Kings 19:11": "And he said, Go forth, and stand upon the mount before the LORD. And, behold, the LORD passed by, and a great and strong wind rent the mountains, and brake in pieces the rocks before the LORD; but the LORD was not in the wind: and after the wind an earthquake; but the LORD was not in the earthquake:",
  "1 Kings 19:12": "And after the earthquake a fire; but the LORD was not in the fire: and after the fire a still small voice.",
  "James 2:15": "If a brother or sister be naked, and destitute of daily food,",
  "James 2:16": "And one of you say unto them, Depart in peace, be ye warmed and filled; notwithstanding ye give them not those things which are needful to the body; what doth it profit?",
  "1 John 3:18": "My little children, let us not love in word, neither in tongue; but in deed and in truth.",
  "Matthew 7:16": "Ye shall know them by their fruits. Do men gather grapes of thorns, or figs of thistles?",
  "Matthew 7:20": "Wherefore by their fruits ye shall know them.",
  "1 Corinthians 13:1": "Though I speak with the tongues of men and of angels, and have not charity, I am become as sounding brass, or a tinkling cymbal.",
  "Isaiah 42:3": "A bruised reed shall he not break, and the smoking flax shall he not quench: he shall bring forth judgment unto truth.",
  "Psalms 115:4": "Their idols are silver and gold, the work of men’s hands.",
  "Psalms 115:5": "They have mouths, but they speak not: eyes have they, but they see not:",
  "Psalms 115:6": "They have ears, but they hear not: noses have they, but they smell not:",
  "Psalms 115:7": "They have hands, but they handle not: feet have they, but they walk not: neither speak they through their throat.",
  "Psalms 115:8": "They that make them are like unto them; so is every one that trusteth in them.",
  "Matthew 6:7": "But when ye pray, use not vain repetitions, as the heathen do: for they think that they shall be heard for their much speaking.",
  "1 Corinthians 2:11": "For what man knoweth the things of a man, save the spirit of man which is in him? even so the things of God knoweth no man, but the Spirit of God.",
  "Deuteronomy 6:7": "And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.",
  "Hebrews 5:14": "But strong meat belongeth to them that are of full age, even those who by reason of use have their senses exercised to discern both good and evil.",
  "Psalms 62:8": "Trust in him at all times; ye people, pour out your heart before him: God is a refuge for us. Selah.",
  "Psalms 34:15": "The eyes of the LORD are upon the righteous, and his ears are open unto their cry.",
  "Psalms 34:17": "The righteous cry, and the LORD heareth, and delivereth them out of all their troubles.",
  "Psalms 34:18": "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
  "Psalms 147:3": "He healeth the broken in heart, and bindeth up their wounds.",
  "Luke 18:13": "And the publican, standing afar off, would not lift up so much as his eyes unto heaven, but smote upon his breast, saying, God be merciful to me a sinner.",
  "Matthew 11:28": "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
  "Proverbs 14:15": "The simple believeth every word: but the prudent man looketh well to his going.",
  "Psalms 19:14": "Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD, my strength, and my redeemer.",
};

const SOV32_CORPUS = {
  "1 Samuel 16:7": ["1Samuel",16,7],
  "Jeremiah 17:10": ["Jeremiah",17,10],
  "Jeremiah 17:9": ["Jeremiah",17,9],
  "1 Chronicles 28:9": ["1Chronicles",28,9],
  "Psalms 139:1": ["Psalms",139,1],
  "Psalms 139:2": ["Psalms",139,2],
  "Psalms 139:4": ["Psalms",139,4],
  "Hebrews 4:12": ["Hebrews",4,12],
  "Hebrews 4:13": ["Hebrews",4,13],
  "Romans 8:27": ["Romans",8,27],
  "Proverbs 20:12": ["Proverbs",20,12],
  "1 Thessalonians 5:21": ["1Thessalonians",5,21],
  "1 Samuel 1:10": ["1Samuel",1,10],
  "1 Samuel 1:12": ["1Samuel",1,12],
  "1 Samuel 1:13": ["1Samuel",1,13],
  "1 Samuel 1:14": ["1Samuel",1,14],
  "Proverbs 18:13": ["Proverbs",18,13],
  "1 Samuel 1:15": ["1Samuel",1,15],
  "1 Samuel 1:16": ["1Samuel",1,16],
  "1 Samuel 1:17": ["1Samuel",1,17],
  "1 Samuel 1:18": ["1Samuel",1,18],
  "Matthew 15:8": ["Matthew",15,8],
  "Isaiah 29:13": ["Isaiah",29,13],
  "Proverbs 14:13": ["Proverbs",14,13],
  "Proverbs 14:10": ["Proverbs",14,10],
  "Proverbs 15:13": ["Proverbs",15,13],
  "Genesis 4:6": ["Genesis",4,6],
  "Nehemiah 2:2": ["Nehemiah",2,2],
  "Genesis 40:7": ["Genesis",40,7],
  "Luke 24:17": ["Luke",24,17],
  "Luke 6:45": ["Luke",6,45],
  "James 4:14": ["James",4,14],
  "James 4:15": ["James",4,15],
  "Romans 8:26": ["Romans",8,26],
  "Exodus 2:23": ["Exodus",2,23],
  "Exodus 2:24": ["Exodus",2,24],
  "Exodus 3:7": ["Exodus",3,7],
  "Psalms 38:9": ["Psalms",38,9],
  "Psalms 6:6": ["Psalms",6,6],
  "Psalms 56:8": ["Psalms",56,8],
  "John 1:29": ["John",1,29],
  "John 3:16": ["John",3,16],
  "Mark 7:34": ["Mark",7,34],
  "John 11:33": ["John",11,33],
  "John 11:35": ["John",11,35],
  "Hebrews 4:15": ["Hebrews",4,15],
  "Hebrews 4:16": ["Hebrews",4,16],
  "James 1:19": ["James",1,19],
  "Proverbs 17:27": ["Proverbs",17,27],
  "Proverbs 17:28": ["Proverbs",17,28],
  "Proverbs 10:19": ["Proverbs",10,19],
  "Ecclesiastes 3:7": ["Ecclesiastes",3,7],
  "Job 2:13": ["Job",2,13],
  "Job 13:5": ["Job",13,5],
  "Romans 12:15": ["Romans",12,15],
  "Proverbs 25:11": ["Proverbs",25,11],
  "Proverbs 15:23": ["Proverbs",15,23],
  "Isaiah 50:4": ["Isaiah",50,4],
  "Proverbs 16:24": ["Proverbs",16,24],
  "Proverbs 12:25": ["Proverbs",12,25],
  "Matthew 26:73": ["Matthew",26,73],
  "Judges 12:6": ["Judges",12,6],
  "John 10:3": ["John",10,3],
  "John 10:4": ["John",10,4],
  "John 10:5": ["John",10,5],
  "John 10:27": ["John",10,27],
  "1 Kings 19:11": ["1Kings",19,11],
  "1 Kings 19:12": ["1Kings",19,12],
  "James 2:15": ["James",2,15],
  "James 2:16": ["James",2,16],
  "1 John 3:18": ["1John",3,18],
  "Matthew 7:16": ["Matthew",7,16],
  "Matthew 7:20": ["Matthew",7,20],
  "1 Corinthians 13:1": ["1Corinthians",13,1],
  "Isaiah 42:3": ["Isaiah",42,3],
  "Psalms 115:4": ["Psalms",115,4],
  "Psalms 115:5": ["Psalms",115,5],
  "Psalms 115:6": ["Psalms",115,6],
  "Psalms 115:7": ["Psalms",115,7],
  "Psalms 115:8": ["Psalms",115,8],
  "Matthew 6:7": ["Matthew",6,7],
  "1 Corinthians 2:11": ["1Corinthians",2,11],
  "Deuteronomy 6:7": ["Deuteronomy",6,7],
  "Hebrews 5:14": ["Hebrews",5,14],
  "Psalms 62:8": ["Psalms",62,8],
  "Psalms 34:15": ["Psalms",34,15],
  "Psalms 34:17": ["Psalms",34,17],
  "Psalms 34:18": ["Psalms",34,18],
  "Psalms 147:3": ["Psalms",147,3],
  "Luke 18:13": ["Luke",18,13],
  "Matthew 11:28": ["Matthew",11,28],
  "Proverbs 14:15": ["Proverbs",14,15],
  "Psalms 19:14": ["Psalms",19,14],
};

// The only non-Scripture double-quoted spans the deep lesson may carry: the
// article's own words (attributed in the text) and Darrell's marker. Each was
// read from the forwarded email (Gmail thread 1a0f763a9c30fbea) when generated.
const SOV32_ALLOWED = [
  '"Voice actually has a listening problem because it just reads the transcript."',
  '"But sounding human and understanding a human are two very different problems."',
  '"I’m fine"',
  '"tone, emotion, pauses, accents, background noise, facial expressions, and a whole lot more."',
  '"Turns out humans have spent thousands of years inventing tone of voice for a reason."',
  '"One model can sound incredibly natural while another is more reliable, accurate, or better at reproducing the person it was supposed to sound like."',
  '"Are we all about to start talking to ourselves?"',
  '"It means an AI can hear how you said something, understand what that changes, maintain that understanding over a long conversation, use tools in the background, and still respond naturally."',
  '"you can’t evaluate a multidimensional voice conversation with a flat transcript."',
  '"The words alone won’t show you that."',
  '"Did the system hear what you actually said?"',
  '"Did its response sound natural and appropriate?"',
  '"Did it pick up information carried by your tone?"',
  '"Does it keep working across a longer conversation?"',
  '"Can it deal with accents, noise, interruptions, and weird real-world situations?"',
  '"Most importantly, did the conversation actually accomplish what the human wanted?"',
  '"Welcome to the final boss of AI benchmarking: actual humans."',
  '"Or mistakes a thoughtful pause for the end of your sentence."',
  '"Lesson"',
  '"private evaluations built around their own customers and use cases, instead of blindly optimizing for a public leaderboard."',
  '"They’ll be the ones that can actually listen to you, understand you, and keep doing it correctly for 30 minutes."',
  '"call centers have accumulated enormous amounts of recorded human conversation that could help train much better voice agents."',
];

const corpusVerse = (book, ch, v) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

// The checks, as pure functions, so the proven-to-catch block runs the SAME
// checks against a mutated copy and shows they fail.
function missingVerbatim(mod) {
  const bad = [];
  for (const [ref, fragment] of Object.entries(SOV32_FRAGMENTS)) {
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
    const pinned = SOV32_FRAGMENTS[ref];
    seen += 1;
    if (!pinned || !pinned.includes(q)) bad.push(`${ref}: ${q}`);
  }
  return { bad, seen };
}
function unattributedQuotes(mod) {
  const isWord = (q) => Object.values(SOV32_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
  const nonScripture = (mod.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
  return { nonScripture, bad: nonScripture.filter((q) => !SOV32_ALLOWED.includes(q)) };
}
// Week 32 lands after week 31 (DR-0683): the week before it must be sov31.
function orderProblem(modules) {
  const at = modules.findIndex((w) => w.id === SOV32_ID);
  if (at < 1) return 'sov32 missing';
  if (!/^sov31-/.test(modules[at - 1].id)) return `week before sov32 is ${modules[at - 1].id}, not sov31`;
  return null;
}

describe('sov32 — the "I’m fine" problem quotes its whole spine verbatim, Word first', () => {
  it('the week exists, directly after week 31, anchored on the heart Yahweh looks on and the groanings the Spirit carries', () => {
    expect(sov32).toBeTruthy();
    expect(orderProblem(SOVEREIGN_AI_MODULES)).toBeNull();
    expect(sov32.anchor.ref).toContain('1 Samuel 16:7');
    expect(sov32.anchor.ref).toContain('Romans 8:26');
    expect(sov32.anchor.theme).toContain(`"${SOV32_FRAGMENTS['1 Samuel 16:7']}" (1 Samuel 16:7)`);
    expect(sov32.anchor.theme).toContain(`"${SOV32_FRAGMENTS['Romans 8:26']}" (Romans 8:26)`);
  });
  it('anchor.ref names every verse the lesson quotes in full, so Search it out derives its links from the real spine (DR-0734)', () => {
    const refs = new Set(anchorRefs(sov32));
    for (const ref of Object.keys(SOV32_FRAGMENTS)) expect(refs.has(ref), `anchor.ref names ${ref}`).toBe(true);
  });
  it('every pinned fragment appears letter-for-letter in the deep lesson, named beside its quote', () => {
    // Derived, not a literal count (DR-0677): the pins and the corpus map are the same set.
    expect(Object.keys(SOV32_FRAGMENTS).length).toBeGreaterThanOrEqual(80);
    expect(Object.keys(SOV32_CORPUS).sort()).toEqual(Object.keys(SOV32_FRAGMENTS).sort());
    expect(missingVerbatim(sov32)).toEqual([]);
  });
  it('every fragment matches the repo KJV corpus exactly, not memory (two witnesses)', () => {
    for (const [ref, fragment] of Object.entries(SOV32_FRAGMENTS)) {
      const at = SOV32_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(corpusVerse(...at), `${ref} corpus`).toBe(fragment);
    }
  });
  it('every quoted verse in the other fields (bigIdea, anchor, benefits, rpe, bands, quiz, facilitator) is a piece of a pinned verse', () => {
    const { bad, seen } = unpinnedQuotesInOtherFields(sov32);
    expect(bad).toEqual([]);
    expect(seen).toBeGreaterThan(60);
  });
  it('the Word LEADS: the heart Yahweh looks on is taught before the article is reported', () => {
    expect(sov32.lesson.indexOf('FIRST, THE LORD LOOKETH ON THE HEART')).toBe(0);
    expect(sov32.lesson.indexOf('(1 Samuel 16:7)')).toBeLessThan(sov32.lesson.indexOf('SECOND,'));
    expect(sov32.lesson.indexOf('(Proverbs 20:12)')).toBeLessThan(sov32.lesson.indexOf('The Neuron'));
  });
  it('the ten movements are carried in order', () => {
    const heads = [
      "FIRST, THE LORD LOOKETH ON THE HEART - YAHWEH HEARS WHAT IS UNDER THE WORDS.",
      "SECOND, WHAT THE ARTICLE REPORTED - AND HOW THIS HOUSE HOLDS IT.",
      "THIRD, HANNAH'S LIPS MOVED - ELI READ THE TRANSCRIPT AND MISSED THE WOMAN.",
      "FOURTH, \"I’m fine\" - WHEN THE LIPS SAY ONE THING AND THE HEART CARRIES ANOTHER.",
      "FIFTH, GROANINGS WHICH CANNOT BE UTTERED - THE SPIRIT CARRIES WHAT THE TRANSCRIPT DROPS.",
      "SIXTH, SWIFT TO HEAR, SLOW TO SPEAK - RECOGNITION COMES BEFORE EXPRESSION.",
      "SEVENTH, SHIBBOLETH AND THE SHEPHERD'S VOICE - ACCENTS, NOISE, AND KNOWING WHO SPEAKS.",
      "EIGHTH, DEPART IN PEACE, BE YE WARMED AND FILLED - THE OUTCOME IS THE TEST.",
      "NINTH, THEY HAVE EARS, BUT THEY HEAR NOT - OUR OWN MACHINES, OUR OWN VOICES, IN OUR OWN HOUSE.",
      "TENTH, POUR OUT YOUR HEART BEFORE HIM - THE ONE WHO HEARS THE WHOLE OF YOU."
    ];
    let last = -1;
    for (const h of heads) {
      const at = sov32.lesson.indexOf(h);
      expect(at, `movement in order: ${h}`).toBeGreaterThan(last);
      last = at;
    }
    // Hannah and Eli are 1 Samuel 1, taught inside the third movement.
    for (const v of ['1 Samuel 1:10', '1 Samuel 1:12', '1 Samuel 1:13', '1 Samuel 1:14', '1 Samuel 1:17', '1 Samuel 1:18']) {
      expect(sov32.lesson.indexOf(`(${v})`)).toBeGreaterThan(sov32.lesson.indexOf('THIRD,'));
      expect(sov32.lesson.indexOf(`(${v})`)).toBeLessThan(sov32.lesson.indexOf('FOURTH,'));
    }
    // The groanings and the Lamb who wept are taught inside the fifth.
    for (const v of ['Romans 8:26', 'Exodus 2:24', 'Mark 7:34', 'John 11:35', 'Hebrews 4:15']) {
      expect(sov32.lesson.indexOf(`(${v})`)).toBeGreaterThan(sov32.lesson.indexOf('FIFTH,'));
      expect(sov32.lesson.indexOf(`(${v})`)).toBeLessThan(sov32.lesson.indexOf('SIXTH,'));
    }
  });
  it('provenance is honest: the article attributed, this house\'s own measurement named with its limit, the unchecked named and NOT taught as fact', () => {
    expect(sov32.lesson).toContain('The Neuron');
    expect(sov32.lesson).toContain('2026-09-30');
    expect(sov32.lesson).toContain('Andrew Ettinger, the chief executive of Hume AI');
    expect(sov32.lesson).toContain('FIRST PILE, WHAT THE ARTICLE SAID, attributed to it.');
    expect(sov32.lesson).toContain('SECOND PILE, WHAT THIS HOUSE HAS MEASURED ON ITS OWN MACHINE');
    expect(sov32.lesson).toContain('THIRD PILE, WHAT WE DID NOT CHECK, and so do not teach as fact.');
    const third = sov32.lesson.indexOf('THIRD PILE');
    for (const unchecked of ['We did not listen to the episode itself', 'We did not read Hume\'s benchmark', 'is an advertisement and is not taught', 'An A.I. agent drafted this page from the forwarded email']) {
      expect(sov32.lesson.indexOf(unchecked, third), unchecked).toBeGreaterThan(third);
    }
    // The limit of this house's own marking is said, not hidden: it hears who spoke, not how they felt.
    expect(sov32.lesson).toContain('the marking hears who spoke; it does not yet hear how they felt');
    const { nonScripture, bad } = unattributedQuotes(sov32);
    expect(nonScripture.length).toBeGreaterThanOrEqual(20);
    expect(bad).toEqual([]);
  });
  it('speaks established fact plainly and flags narrowly (DR-0100): three tiers, over-reach corrected both ways', () => {
    expect(sov32.lesson).toContain('Established, and stated plainly:');
    expect(sov32.lesson).toContain('That is real, and it is not to be shrunk into nothing.');
    expect(sov32.lesson).toContain('Open, and named narrowly:');
    expect(sov32.lesson).toContain('Over-reach, corrected both ways:');
    // Never the hedge-word the brief forbids; the unchecked is named by what it is.
    expect(JSON.stringify(sov32)).not.toMatch(/not verified/i);
  });
  it('this house is cited honestly: speakers marked by voice on our own machine, consent, nothing guessed, nothing leaves', () => {
    expect(sov32.lesson).toContain('names a voice only when it matches a voiceprint its owner agreed to');
    expect(sov32.lesson).toContain('Nothing is guessed, and a person can take their voice back at any time');
    expect(sov32.lesson).toContain('nothing leaves the house');
    // Readers are never handed our bookkeeping: no record id and no percent sign anywhere in the entry.
    expect(JSON.stringify(sov32)).not.toMatch(/DR-\d{4}/);
    expect(JSON.stringify(sov32)).not.toMatch(/%/);
    expect(sov32.inApp).toMatch(/Your lessons/);
    expect(sov32.inApp).toMatch(/Add my voice/);
  });
  it('typographic theology: Yahweh in our voice; the adversary lowercase; the Word capitalized; the Lamb confessed', () => {
    const ours = JSON.stringify(sov32).replace(/\\"[^"\\]+\\"/g, '');
    expect(sov32.lesson.replace(/"[^"]+"/g, '')).not.toMatch(/\bGod\b/);
    for (const f of ['bigIdea', 'inApp', 'title']) expect(sov32[f].replace(/"[^"]+"/g, ''), f).not.toMatch(/\bGod\b/);
    for (const b of ['child', 'youth', 'teen', 'senior']) expect(sov32.levels[b].replace(/"[^"]+"/g, ''), b).not.toMatch(/\bGod\b/);
    expect(ours).toMatch(/Yahweh/);
    expect(JSON.stringify(sov32)).not.toMatch(/\bSatan\b|\bDevil\b|\bLucifer\b/);
    expect(sov32.lesson).toContain('the Word');
    expect(sov32.lesson).toMatch(/the Son of Yahweh, the Lamb/);
    expect(sov32.lesson).toContain('(John 1:29)');
  });
  it('all four age bands are authored, each a full reading that names its lesson and ends by sending the reader to someone (P60, DR-0733)', () => {
    for (const b of ['child', 'youth', 'teen', 'senior']) {
      expect(sov32.levels[b].length, b).toBeGreaterThan(2500);
      expect(sov32.levels[b].slice(0, 60).toUpperCase(), b).toContain('I’M FINE PROBLEM');
      expect(sov32.levels[b], b).toContain('TALK ABOUT IT TOGETHER.');
    }
    expect(sov32.lesson).toContain('TALK ABOUT IT TOGETHER.');
    expect(hasAllThree(sov32)).toBe(true);
    const own = ownPrompts(sov32);
    expect(own.parents).toMatch(/Parents, ask your child/);
    expect(own.children).toMatch(/ask your mom, dad or grandparent/);
    expect(own.friends).toBeTruthy();
    expect(sov32.lesson).toMatch(/Friends, tell one friend this week/);
    expect(sov32.quiz.questions.length).toBeGreaterThanOrEqual(8);
    for (const q of sov32.quiz.questions) expect(q.options[q.answer], q.q).toBeTruthy();
  });
});

describe('sov32 — proven-to-catch: the gate fails on a drifted verse, an unattributed claim, or the wrong week order', () => {
  it('the pinned ground truth is itself exact', () => {
    expect(SOV32_FRAGMENTS['1 Samuel 16:7']).toBe("But the LORD said unto Samuel, Look not on his countenance, or on the height of his stature; because I have refused him: for the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart.");
    expect(SOV32_FRAGMENTS['1 Samuel 1:13']).toBe("Now Hannah, she spake in her heart; only her lips moved, but her voice was not heard: therefore Eli thought she had been drunken.");
    expect(SOV32_FRAGMENTS['Romans 8:26']).toBe("Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought: but the Spirit itself maketh intercession for us with groanings which cannot be uttered.");
    // The corpus apostrophe is typographic; a straight one would be a silent drift.
    expect(SOV32_FRAGMENTS['Genesis 40:7']).toContain('Pharaoh’s officers');
  });
  it('a one-word drift of 1 Samuel 16:7 in the lesson is caught', () => {
    const drifted = { ...sov32, lesson: sov32.lesson.split('the LORD looketh on the heart.').join('the LORD looketh at the heart.') };
    expect(missingVerbatim(drifted)).toContain('1 Samuel 16:7');
  });
  it('a drifted verse in another field (the youth band) is caught', () => {
    const drifted = { ...sov32, levels: { ...sov32.levels, youth: sov32.levels.youth.split('only her lips moved, but her voice was not heard').join('only her lips moved, and her voice was not heard') } };
    expect(unpinnedQuotesInOtherFields(drifted).bad.some((b) => b.startsWith('1 Samuel 1:13'))).toBe(true);
  });
  it('an unattributed claim smuggled into the lesson in quotation marks is caught', () => {
    const smuggled = { ...sov32, lesson: `${sov32.lesson} "Voice assistants now hear exactly how you feel."` };
    expect(unattributedQuotes(smuggled).bad).toEqual(['"Voice assistants now hear exactly how you feel."']);
  });
  it('a lesson that drops TALK ABOUT IT TOGETHER from its bands loses the children-to-parents direction and fails the three-direction rule', () => {
    const strip = (t) => t.split('TALK ABOUT IT TOGETHER.')[0];
    const cut = { ...sov32, levels: { child: strip(sov32.levels.child), youth: strip(sov32.levels.youth), teen: strip(sov32.levels.teen), senior: strip(sov32.levels.senior) } };
    expect(ownPrompts(cut).children).toBe('');
    expect(hasAllThree(cut)).toBe(false);
  });
  it('week 32 landing anywhere but directly after week 31 is caught', () => {
    const without31 = SOVEREIGN_AI_MODULES.filter((w) => !/^sov31-/.test(w.id));
    expect(orderProblem(without31)).toMatch(/not sov31/);
    expect(orderProblem(SOVEREIGN_AI_MODULES.filter((w) => w.id !== SOV32_ID))).toBe('sov32 missing');
  });
});
