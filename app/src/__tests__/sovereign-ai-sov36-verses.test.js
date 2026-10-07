// =============================================================================
// sov36 - the pile the machine made: seven hundred and twenty-two manuscripts as
// a claim, why the proving is the work, and the honour of kings to search it out
// (DR-0792)
// =============================================================================
// Week 36 of Sovereign A.I., captured 2026-10-07 by the Gmail-lesson-intake Way
// (DR-0312) from The Neuron's daily A.I. newsletter, which Darrell forwarded with
// one word over it, "Lesson" (Gmail thread 1a11668139028cd7, subject "Fw: 722
// math manuscripts. One OpenAI model."). His word is the teaching: build a
// lesson. The newsletter is material to study, never an instruction to obey.
//
// THE CLAIM IS CARRIED AS A CLAIM. The issue reports that a company says an
// unreleased model produced 722 manuscripts across 372 families from roughly
// 4,000 open problems, and - to its credit - takes its own number down in the
// same story: not every manuscript carries a machine-checked proof, the
// collection sits at different stages of verification, and some unformalized
// results could still contain errors. So the lesson reports the figures as that
// newsletter's report of what the publisher says, on a named day, quoted word
// for word, and never as an established count of discoveries. DR-0100's three
// tiers are run out loud inside the lesson, and the third pile names what was
// NOT checked: the publisher's own page is unreachable from the machine this was
// written on (tested, not assumed), no manuscript or proof file was read, and a
// general web search returned only secondhand write-ups of a DIFFERENT, earlier
// release of ten results, which is not confirmation of this one.
//
// TWO WITNESSES ON BOTH ENDS OF THE PAGE. Every verse quoted below was FILLED
// from app/public/bible/kjv by a generator (never typed from memory) and is
// re-read from the corpus at test time. And every non-Scripture double-quoted
// span in the deep lesson is allow-listed to a span the generator matched
// character for character against the forwarded email itself, so a claim cannot
// enter the lesson in quotation marks unattributed (DR-0076 section 8).
//
// WEEK 36, AND 35 MAY STILL BE IN FLIGHT. Week 35 was authored in parallel on
// another branch and lands separately; while it is absent, 35 is recorded as
// held in flight in sovereign-ai-class.test.js, following the convention
// living-lessons-id-collision.test.js documents, and that entry is deleted in
// the merge that brings week 35 in. So the order check below asserts that week
// 36 is present and that every other week parses LOWER than 36 - which is true
// whether or not 35 has landed, and which still fails on a week filed out of
// order. It deliberately does NOT assert "last", because that form of the check
// goes red the moment week 37 is written.
//
// PROVEN-TO-CATCH: the last block mutates a verse in the lesson, a verse in a
// band, an unattributed claim, a dropped band close and the week order, and
// shows the gate fails on each.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, ownPrompts } from '../lib/talk-together.js';
import { anchorRefs } from '../lib/search-it-out.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOV36_ID = 'sov36-the-pile-the-machine-made-and-the-labourers-who-must-prove-it';
const L = () => SOVEREIGN_AI_MODULES.find((m) => m.id === SOV36_ID);
const FULL_BANDS = ['child', 'youth', 'teen', 'senior'];

// Every verse the lesson stands on, verbatim from the repo's King James text.
const SOV36_FRAGMENTS = {
  "Hebrews 11:3": "Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.",
  "Psalms 147:4": "He telleth the number of the stars; he calleth them all by their names.",
  "Psalms 147:5": "Great is our Lord, and of great power: his understanding is infinite.",
  "Isaiah 40:12": "Who hath measured the waters in the hollow of his hand, and meted out heaven with the span, and comprehended the dust of the earth in a measure, and weighed the mountains in scales, and the hills in a balance?",
  "Isaiah 40:26": "Lift up your eyes on high, and behold who hath created these things, that bringeth out their host by number: he calleth them all by names by the greatness of his might, for that he is strong in power; not one faileth.",
  "Isaiah 40:28": "Hast thou not known? hast thou not heard, that the everlasting God, the LORD, the Creator of the ends of the earth, fainteth not, neither is weary? there is no searching of his understanding.",
  "Job 38:4": "Where wast thou when I laid the foundations of the earth? declare, if thou hast understanding.",
  "Job 38:5": "Who hath laid the measures thereof, if thou knowest? or who hath stretched the line upon it?",
  "Psalms 19:1": "The heavens declare the glory of God; and the firmament sheweth his handywork.",
  "Psalms 8:3": "When I consider thy heavens, the work of thy fingers, the moon and the stars, which thou hast ordained;",
  "Psalms 8:4": "What is man, that thou art mindful of him? and the son of man, that thou visitest him?",
  "Colossians 1:16": "For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him:",
  "Romans 1:20": "For the invisible things of him from the creation of the world are clearly seen, being understood by the things that are made, even his eternal power and Godhead; so that they are without excuse:",
  "Romans 1:21": "Because that, when they knew God, they glorified him not as God, neither were thankful; but became vain in their imaginations, and their foolish heart was darkened.",
  "Psalms 139:17": "How precious also are thy thoughts unto me, O God! how great is the sum of them!",
  "Psalms 139:18": "If I should count them, they are more in number than the sand: when I awake, I am still with thee.",
  "Genesis 15:5": "And he brought him forth abroad, and said, Look now toward heaven, and tell the stars, if thou be able to number them: and he said unto him, So shall thy seed be.",
  "Jeremiah 33:22": "As the host of heaven cannot be numbered, neither the sand of the sea measured: so will I multiply the seed of David my servant, and the Levites that minister unto me.",
  "Luke 12:7": "But even the very hairs of your head are all numbered. Fear not therefore: ye are of more value than many sparrows.",
  "Psalms 90:12": "So teach us to number our days, that we may apply our hearts unto wisdom.",
  "Proverbs 25:2": "It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.",
  "Deuteronomy 29:29": "The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever, that we may do all the words of this law.",
  "Colossians 2:3": "In whom are hid all the treasures of wisdom and knowledge.",
  "Psalms 111:2": "The works of the LORD are great, sought out of all them that have pleasure therein.",
  "Proverbs 2:3": "Yea, if thou criest after knowledge, and liftest up thy voice for understanding;",
  "Proverbs 2:4": "If thou seekest her as silver, and searchest for her as for hid treasures;",
  "Proverbs 2:5": "Then shalt thou understand the fear of the LORD, and find the knowledge of God.",
  "Job 11:7": "Canst thou by searching find out God? canst thou find out the Almighty unto perfection?",
  "Job 9:10": "Which doeth great things past finding out; yea, and wonders without number.",
  "Ecclesiastes 1:9": "The thing that hath been, it is that which shall be; and that which is done is that which shall be done: and there is no new thing under the sun.",
  "Proverbs 18:17": "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.",
  "Daniel 12:4": "But thou, O Daniel, shut up the words, and seal the book, even to the time of the end: many shall run to and fro, and knowledge shall be increased.",
  "Job 28:1": "Surely there is a vein for the silver, and a place for gold where they fine it.",
  "Job 28:2": "Iron is taken out of the earth, and brass is molten out of the stone.",
  "Job 28:3": "He setteth an end to darkness, and searcheth out all perfection: the stones of darkness, and the shadow of death.",
  "Job 28:9": "He putteth forth his hand upon the rock; he overturneth the mountains by the roots.",
  "Job 28:10": "He cutteth out rivers among the rocks; and his eye seeth every precious thing.",
  "Job 28:11": "He bindeth the floods from overflowing; and the thing that is hid bringeth he forth to light.",
  "Job 28:12": "But where shall wisdom be found? and where is the place of understanding?",
  "Job 28:13": "Man knoweth not the price thereof; neither is it found in the land of the living.",
  "Job 28:20": "Whence then cometh wisdom? and where is the place of understanding?",
  "Job 28:21": "Seeing it is hid from the eyes of all living, and kept close from the fowls of the air.",
  "Job 28:23": "God understandeth the way thereof, and he knoweth the place thereof.",
  "Job 28:28": "And unto man he said, Behold, the fear of the Lord, that is wisdom; and to depart from evil is understanding.",
  "2 Timothy 3:7": "Ever learning, and never able to come to the knowledge of the truth.",
  "Matthew 9:37": "Then saith he unto his disciples, The harvest truly is plenteous, but the labourers are few;",
  "Matthew 9:36": "But when he saw the multitudes, he was moved with compassion on them, because they fainted, and were scattered abroad, as sheep having no shepherd.",
  "Matthew 9:38": "Pray ye therefore the Lord of the harvest, that he will send forth labourers into his harvest.",
  "Ecclesiastes 12:12": "And further, by these, my son, be admonished: of making many books there is no end; and much study is a weariness of the flesh.",
  "Acts 17:11": "These were more noble than those in Thessalonica, in that they received the word with all readiness of mind, and searched the scriptures daily, whether those things were so.",
  "1 Thessalonians 5:21": "Prove all things; hold fast that which is good.",
  "Proverbs 14:15": "The simple believeth every word: but the prudent man looketh well to his going.",
  "Job 12:11": "Doth not the ear try words? and the mouth taste his meat?",
  "1 John 4:1": "Beloved, believe not every spirit, but try the spirits whether they are of God: because many false prophets are gone out into the world.",
  "Jeremiah 23:28": "The prophet that hath a dream, let him tell a dream; and he that hath my word, let him speak my word faithfully. What is the chaff to the wheat? saith the LORD.",
  "Jeremiah 23:29": "Is not my word like as a fire? saith the LORD; and like a hammer that breaketh the rock in pieces?",
  "Matthew 3:12": "Whose fan is in his hand, and he will throughly purge his floor, and gather his wheat into the garner; but he will burn up the chaff with unquenchable fire.",
  "Matthew 13:24": "Another parable put he forth unto them, saying, The kingdom of heaven is likened unto a man which sowed good seed in his field:",
  "Matthew 13:25": "But while men slept, his enemy came and sowed tares among the wheat, and went his way.",
  "Matthew 13:29": "But he said, Nay; lest while ye gather up the tares, ye root up also the wheat with them.",
  "Matthew 13:30": "Let both grow together until the harvest: and in the time of harvest I will say to the reapers, Gather ye together first the tares, and bind them in bundles to burn them: but gather the wheat into my barn.",
  "Psalms 12:6": "The words of the LORD are pure words: as silver tried in a furnace of earth, purified seven times.",
  "Proverbs 17:3": "The fining pot is for silver, and the furnace for gold: but the LORD trieth the hearts.",
  "2 Timothy 2:15": "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.",
  "1 Corinthians 14:40": "Let all things be done decently and in order.",
  "Habakkuk 2:2": "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it.",
  "Proverbs 14:12": "There is a way which seemeth right unto a man, but the end thereof are the ways of death.",
  "Isaiah 5:20": "Woe unto them that call evil good, and good evil; that put darkness for light, and light for darkness; that put bitter for sweet, and sweet for bitter!",
  "Isaiah 29:16": "Surely your turning of things upside down shall be esteemed as the potter’s clay: for shall the work say of him that made it, He made me not? or shall the thing framed say of him that framed it, He had no understanding?",
  "Isaiah 45:9": "Woe unto him that striveth with his Maker! Let the potsherd strive with the potsherds of the earth. Shall the clay say to him that fashioneth it, What makest thou? or thy work, He hath no hands?",
  "Psalms 100:3": "Know ye that the LORD he is God: it is he that hath made us, and not we ourselves; we are his people, and the sheep of his pasture.",
  "Revelation 4:11": "Thou art worthy, O Lord, to receive glory and honour and power: for thou hast created all things, and for thy pleasure they are and were created.",
  "Proverbs 20:5": "Counsel in the heart of man is like deep water; but a man of understanding will draw it out.",
  "Proverbs 10:19": "In the multitude of words there wanteth not sin: but he that refraineth his lips is wise.",
  "Proverbs 25:11": "A word fitly spoken is like apples of gold in pictures of silver.",
  "Philippians 4:8": "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.",
  "2 Corinthians 10:5": "Casting down imaginations, and every high thing that exalteth itself against the knowledge of God, and bringing into captivity every thought to the obedience of Christ;",
  "Ecclesiastes 12:13": "Let us hear the conclusion of the whole matter: Fear God, and keep his commandments: for this is the whole duty of man.",
  "Nehemiah 4:9": "Nevertheless we made our prayer unto our God, and set a watch against them day and night, because of them.",
  "Proverbs 22:3": "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.",
  "Ecclesiastes 3:1": "To every thing there is a season, and a time to every purpose under the heaven:",
  "Luke 12:15": "And he said unto them, Take heed, and beware of covetousness: for a man’s life consisteth not in the abundance of the things which he possesseth.",
  "Mark 13:32": "But of that day and that hour knoweth no man, no, not the angels which are in heaven, neither the Son, but the Father.",
  "Acts 1:7": "And he said unto them, It is not for you to know the times or the seasons, which the Father hath put in his own power.",
  "Luke 19:13": "And he called his ten servants, and delivered them ten pounds, and said unto them, Occupy till I come.",
  "2 Timothy 1:7": "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
  "1 Corinthians 8:1": "Now as touching things offered unto idols, we know that we all have knowledge. Knowledge puffeth up, but charity edifieth.",
  "1 Corinthians 8:2": "And if any man think that he knoweth any thing, he knoweth nothing yet as he ought to know.",
  "1 Corinthians 13:2": "And though I have the gift of prophecy, and understand all mysteries, and all knowledge; and though I have all faith, so that I could remove mountains, and have not charity, I am nothing.",
  "Proverbs 24:3": "Through wisdom is an house builded; and by understanding it is established:",
  "Proverbs 24:4": "And by knowledge shall the chambers be filled with all precious and pleasant riches.",
  "Colossians 1:17": "And he is before all things, and by him all things consist.",
  "John 1:29": "The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.",
  "John 3:16": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "James 1:22": "But be ye doers of the word, and not hearers only, deceiving your own selves.",
  "Galatians 5:22": "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,",
  "Luke 2:52": "And Jesus increased in wisdom and stature, and in favour with God and man.",
  "Deuteronomy 6:7": "And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.",
  "Proverbs 27:17": "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.",
  "James 1:19": "Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath:",};

// Where each one lives in the corpus, so the pins are re-read rather than trusted.
const SOV36_CORPUS = {
  "Hebrews 11:3": ["Hebrews", 11, 3],
  "Psalms 147:4": ["Psalms", 147, 4],
  "Psalms 147:5": ["Psalms", 147, 5],
  "Isaiah 40:12": ["Isaiah", 40, 12],
  "Isaiah 40:26": ["Isaiah", 40, 26],
  "Isaiah 40:28": ["Isaiah", 40, 28],
  "Job 38:4": ["Job", 38, 4],
  "Job 38:5": ["Job", 38, 5],
  "Psalms 19:1": ["Psalms", 19, 1],
  "Psalms 8:3": ["Psalms", 8, 3],
  "Psalms 8:4": ["Psalms", 8, 4],
  "Colossians 1:16": ["Colossians", 1, 16],
  "Romans 1:20": ["Romans", 1, 20],
  "Romans 1:21": ["Romans", 1, 21],
  "Psalms 139:17": ["Psalms", 139, 17],
  "Psalms 139:18": ["Psalms", 139, 18],
  "Genesis 15:5": ["Genesis", 15, 5],
  "Jeremiah 33:22": ["Jeremiah", 33, 22],
  "Luke 12:7": ["Luke", 12, 7],
  "Psalms 90:12": ["Psalms", 90, 12],
  "Proverbs 25:2": ["Proverbs", 25, 2],
  "Deuteronomy 29:29": ["Deuteronomy", 29, 29],
  "Colossians 2:3": ["Colossians", 2, 3],
  "Psalms 111:2": ["Psalms", 111, 2],
  "Proverbs 2:3": ["Proverbs", 2, 3],
  "Proverbs 2:4": ["Proverbs", 2, 4],
  "Proverbs 2:5": ["Proverbs", 2, 5],
  "Job 11:7": ["Job", 11, 7],
  "Job 9:10": ["Job", 9, 10],
  "Ecclesiastes 1:9": ["Ecclesiastes", 1, 9],
  "Proverbs 18:17": ["Proverbs", 18, 17],
  "Daniel 12:4": ["Daniel", 12, 4],
  "Job 28:1": ["Job", 28, 1],
  "Job 28:2": ["Job", 28, 2],
  "Job 28:3": ["Job", 28, 3],
  "Job 28:9": ["Job", 28, 9],
  "Job 28:10": ["Job", 28, 10],
  "Job 28:11": ["Job", 28, 11],
  "Job 28:12": ["Job", 28, 12],
  "Job 28:13": ["Job", 28, 13],
  "Job 28:20": ["Job", 28, 20],
  "Job 28:21": ["Job", 28, 21],
  "Job 28:23": ["Job", 28, 23],
  "Job 28:28": ["Job", 28, 28],
  "2 Timothy 3:7": ["2Timothy", 3, 7],
  "Matthew 9:37": ["Matthew", 9, 37],
  "Matthew 9:36": ["Matthew", 9, 36],
  "Matthew 9:38": ["Matthew", 9, 38],
  "Ecclesiastes 12:12": ["Ecclesiastes", 12, 12],
  "Acts 17:11": ["Acts", 17, 11],
  "1 Thessalonians 5:21": ["1Thessalonians", 5, 21],
  "Proverbs 14:15": ["Proverbs", 14, 15],
  "Job 12:11": ["Job", 12, 11],
  "1 John 4:1": ["1John", 4, 1],
  "Jeremiah 23:28": ["Jeremiah", 23, 28],
  "Jeremiah 23:29": ["Jeremiah", 23, 29],
  "Matthew 3:12": ["Matthew", 3, 12],
  "Matthew 13:24": ["Matthew", 13, 24],
  "Matthew 13:25": ["Matthew", 13, 25],
  "Matthew 13:29": ["Matthew", 13, 29],
  "Matthew 13:30": ["Matthew", 13, 30],
  "Psalms 12:6": ["Psalms", 12, 6],
  "Proverbs 17:3": ["Proverbs", 17, 3],
  "2 Timothy 2:15": ["2Timothy", 2, 15],
  "1 Corinthians 14:40": ["1Corinthians", 14, 40],
  "Habakkuk 2:2": ["Habakkuk", 2, 2],
  "Proverbs 14:12": ["Proverbs", 14, 12],
  "Isaiah 5:20": ["Isaiah", 5, 20],
  "Isaiah 29:16": ["Isaiah", 29, 16],
  "Isaiah 45:9": ["Isaiah", 45, 9],
  "Psalms 100:3": ["Psalms", 100, 3],
  "Revelation 4:11": ["Revelation", 4, 11],
  "Proverbs 20:5": ["Proverbs", 20, 5],
  "Proverbs 10:19": ["Proverbs", 10, 19],
  "Proverbs 25:11": ["Proverbs", 25, 11],
  "Philippians 4:8": ["Philippians", 4, 8],
  "2 Corinthians 10:5": ["2Corinthians", 10, 5],
  "Ecclesiastes 12:13": ["Ecclesiastes", 12, 13],
  "Nehemiah 4:9": ["Nehemiah", 4, 9],
  "Proverbs 22:3": ["Proverbs", 22, 3],
  "Ecclesiastes 3:1": ["Ecclesiastes", 3, 1],
  "Luke 12:15": ["Luke", 12, 15],
  "Mark 13:32": ["Mark", 13, 32],
  "Acts 1:7": ["Acts", 1, 7],
  "Luke 19:13": ["Luke", 19, 13],
  "2 Timothy 1:7": ["2Timothy", 1, 7],
  "1 Corinthians 8:1": ["1Corinthians", 8, 1],
  "1 Corinthians 8:2": ["1Corinthians", 8, 2],
  "1 Corinthians 13:2": ["1Corinthians", 13, 2],
  "Proverbs 24:3": ["Proverbs", 24, 3],
  "Proverbs 24:4": ["Proverbs", 24, 4],
  "Colossians 1:17": ["Colossians", 1, 17],
  "John 1:29": ["John", 1, 29],
  "John 3:16": ["John", 3, 16],
  "James 1:22": ["James", 1, 22],
  "Galatians 5:22": ["Galatians", 5, 22],
  "Luke 2:52": ["Luke", 2, 52],
  "Deuteronomy 6:7": ["Deuteronomy", 6, 7],
  "Proverbs 27:17": ["Proverbs", 27, 17],
  "James 1:19": ["James", 1, 19],};

// The only non-Scripture double-quoted spans the deep lesson may carry: spans of
// the forwarded newsletter (each matched against the email by the generator) and
// Darrell's own one-word marker over the forward.
const SOV36_ALLOWED = [
  "\"Lesson\"",
  "\"These are actual research results.\"",
  "\"722 manuscripts across 372 families of related results after being given roughly 4,000 open research problems.\"",
  "\"On average, each result used about three hours of ChatGPT Pro thinking compute.\"",
  "\"OpenAI also published 10 abridged reasoning summaries\"",
  "\"Many of the proofs come with Lean formalizations, meaning a computer can mechanically check whether each logical step follows from the rules.\"",
  "\"a model writing something that looks like a proof is not the same thing as producing a correct proof\"",
  "\"Think of Lean like running every formula in someone’s spreadsheet instead of trusting that the numbers look plausible.\"",
  "\"It can catch a broken logical step that reads perfectly well in normal prose.\"",
  "\"It is literally running the numbers and saying yup, the math maths!\"",
  "\"But this is not 722 gold-star-certified discoveries.\"",
  "\"OpenAI says the collection contains results at different stages of verification, not every manuscript has a Lean proof yet, and some unformalized results could still contain errors.\"",
  "\"OpenAI also says it consulted the Institute for Advanced Study’s independent math-and-AI advisory group\"",
  "\"plans to fund workshops and conferences around major AI-produced results.\"",
  "\"The research bottleneck may be moving.\"",
  "\"For years, the question was whether AI could answer hard math questions at all.\"",
  "\"If outside mathematicians validate meaningful chunks of this release, the next problem becomes verification and absorption: how quickly humans can check, understand, and build on a growing pile of machine-generated research.\"",
  "\"Not how many manuscripts the model can generate, but how many survive serious independent scrutiny.\"",
  "\"roughly 4,000 open research problems\"",
  "\"the internet has apparently reached the inevitable next stage of AI culture\"",
  "\"Now an Indonesian teen says he created it with AI tools, a French agency represents him, and a Roblox developer is fighting over the right to use it.\"",
  "\"U.S. copyright law protects human authorship, not AI generated ones, so the case may turn on how much of this extremely online creature came from a person versus a model.\"",
  "\"The legal system has officially been asked to decide who gets custody of the haunted meme stick.\"",
  "\"Use AI to beat the blank page, not replace your writing\"",
  "\"getting something onto the page when you know what you mean, but can’t quite figure out how to say it yet\"",
  "\"And actually, your prompt can be your first draft.\"",
  "\"Explain the idea in your own words.\"",
  "\"treat AI’s draft as something to edit or rewrite, not something to publish\"",
  "\"You’ll quickly notice what sounds wrong, what it misunderstood, and what you actually wanted to say.\"",
  "\"Weirdly, sometimes a bad draft teaches you what you mean faster than staring at an empty page.\"",
  "\"My rule: use AI to increase the quality of the thought, not the quantity of the output.\"",
  "\"Being able to produce writing 100x faster doesn’t mean you suddenly have 100x more worth saying.\"",
  "\"Use AI to structure your thinking, not do the thinking for you!\"",
  "\"If something is unclear or could be interpreted multiple ways, flag it instead of inventing what I meant.\"",
  "\"gives you a frontier-class multimodal model across 160+ languages, with downloadable weights due by the end of October for teams that want to run or tune it themselves\"",
  "\"powers private search across text, photos, audio, and video that can run directly on a laptop, phone, or browser\"",
  "\"argues that the cyber debate around open-weight AI has become too binary: banning open models can also deprive defenders of systems they can run privately, while closed APIs have hardly proved abuse-proof.\"",
  "\"expanded its Cyber Verification Program, giving vetted defenders broader access to Claude’s strongest models after partners found at least 129,000 verified software vulnerabilities\"",
  "\"strategy chief Jason Kwon flew to Australia to apologize for its agent’s Medicare breach and said the company now flags unexpected internet access during agent training\"",
  "\"for letting people authorize AI agents while businesses define what those agents may do\"",
  "\"warns that AI may hit a physical scaling wall because high-voltage transformers and other grid hardware can take five-plus years to arrive\"",
  "\"says he quit because frontier labs still operate like perpetual startups, when increasingly capable systems need the layered redundancy and failure planning of nuclear plants or aviation\"",
  "\"fast take-off, where AI reaches intelligence explosion\"",
  "\"the next problem becomes verification and absorption: how quickly humans can check, understand, and build on a growing pile of machine-generated research.\"",];

const corpusVerse = (book, ch, v) => JSON.parse(readFileSync(join(HERE, '..', '..', 'public', 'bible', 'kjv', `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

// The checks, as pure functions, so the proven-to-catch block runs the SAME
// checks against a mutated copy and shows they fail.
function missingVerbatim(mod) {
  const bad = [];
  for (const [ref, fragment] of Object.entries(SOV36_FRAGMENTS)) {
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
    const pinned = SOV36_FRAGMENTS[ref];
    seen += 1;
    if (!pinned || !pinned.includes(q)) bad.push(`${ref}: ${q}`);
  }
  return { bad, seen };
}
function unattributedQuotes(mod) {
  const isWord = (q) => Object.values(SOV36_FRAGMENTS).some((f) => q.includes(f) || f.includes(q.slice(1, -1)));
  const nonScripture = (mod.lesson.match(/"[^"]+"/g) || []).filter((q) => !isWord(q));
  return { nonScripture, bad: nonScripture.filter((q) => !SOV36_ALLOWED.includes(q)) };
}
// Week 36 is present, and every other week in the series parses LOWER than 36.
// True whether or not week 35 has landed yet; still fails on a week filed out of
// order, and does not go red when week 37 is written.
function orderProblem(modules) {
  const at = modules.findIndex((w) => w.id === SOV36_ID);
  if (at < 1) return 'sov36 missing';
  const n = (m) => Number((/^sov(\d+)-/.exec(m.id) || [])[1]);
  if (n(modules[at]) !== 36) return `sov36 parses as week ${n(modules[at])}`;
  for (const other of modules.filter((w) => w.id !== SOV36_ID)) {
    if (!(n(other) < 36)) return `week ${n(other)} is not before week 36`;
  }
  for (let i = 1; i < modules.length; i += 1) {
    if (!(n(modules[i - 1]) < n(modules[i]))) return `weeks do not ascend at ${modules[i].id}`;
  }
  return null;
}

const MOVEMENTS = [
  'FIRST, HE TELLETH THE NUMBER - YAHWEH AUTHORED MEASURE BEFORE ANY MACHINE COUNTED.',
  'SECOND, THE GLORY TO CONCEAL AND THE HONOUR TO SEARCH OUT - WHY A PROOF IS FOUND AND NOT INVENTED.',
  'THIRD, WHAT THE NEWSLETTER REPORTED - PLAINLY, AS A CLAIM, WITH ITS OWN CAVEAT KEPT.',
  'FOURTH, WHERE SHALL WISDOM BE FOUND - A HYMN TO ENGINEERING THAT ENDS SOMEWHERE ELSE.',
  'FIFTH, THE HARVEST IS PLENTEOUS, THE LABOURERS ARE FEW - THE BOTTLENECK MOVED TO THE PROVING.',
  'SIXTH, WHAT IS THE CHAFF TO THE WHEAT - A PILE AT MIXED STAGES OF PROOF IS A FIELD WITH TARES IN IT.',
  'SEVENTH, A MACHINE THAT CHECKS EVERY STEP - WHAT A FORMAL PROOF SETTLES, AND WHAT IT CANNOT.',
  'EIGHTH, SHALL THE THING FRAMED SAY OF HIM THAT FRAMED IT - WHO AUTHORED WHAT A TOOL MADE.',
  'NINTH, THE QUALITY OF THE THOUGHT, NOT THE QUANTITY OF THE OUTPUT - THE SKILL THE ISSUE TAUGHT.',
  'TENTH, OCCUPY TILL I COME - THE REST OF THE ISSUE READ HONESTLY, THE FEAR REFUSED, AND WHO HOLDS IT ALL TOGETHER.',
];

describe('sov36 - the pile the machine made quotes its whole spine verbatim, Word first', () => {
  it('the week exists, in order, anchored on the frame that was written first and the honour of searching it out', () => {
    expect(L()).toBeTruthy();
    expect(orderProblem(SOVEREIGN_AI_MODULES)).toBeNull();
    expect(L().rpe.research && L().rpe.plan && L().rpe.execute).toBeTruthy();
    expect(L().anchor.ref).toContain('Hebrews 11:3');
    expect(L().anchor.ref).toContain('Proverbs 25:2');
    expect(L().anchor.ref).toContain('Job 28:12');
    expect(L().anchor.theme).toContain(`"${SOV36_FRAGMENTS['Hebrews 11:3']}" (Hebrews 11:3)`);
    expect(L().anchor.theme).toContain(`"${SOV36_FRAGMENTS['Proverbs 25:2']}" (Proverbs 25:2)`);
  });
  it('anchor.ref names every verse the lesson quotes in full, so Search it out derives its links from the real spine (DR-0734)', () => {
    const refs = new Set(anchorRefs(L()));
    for (const ref of Object.keys(SOV36_FRAGMENTS)) expect(refs.has(ref), `anchor.ref names ${ref}`).toBe(true);
  });
  it('every pinned fragment appears letter-for-letter in the deep lesson, named beside its quote', () => {
    // Derived, not a literal count (DR-0677): the pins and the corpus map are the same set.
    expect(Object.keys(SOV36_FRAGMENTS).length).toBeGreaterThanOrEqual(100);
    expect(Object.keys(SOV36_CORPUS).sort()).toEqual(Object.keys(SOV36_FRAGMENTS).sort());
    expect(missingVerbatim(L())).toEqual([]);
  });
  it('every fragment matches the repo KJV corpus exactly, not memory (two witnesses)', () => {
    for (const [ref, fragment] of Object.entries(SOV36_FRAGMENTS)) {
      const at = SOV36_CORPUS[ref];
      expect(at, `${ref} must have a corpus address`).toBeTruthy();
      expect(corpusVerse(...at), `${ref} corpus`).toBe(fragment);
    }
  });
  it('every quoted verse in the other fields (bigIdea, anchor, benefits, bands, quiz, facilitator) is a piece of a pinned verse', () => {
    const { bad, seen } = unpinnedQuotesInOtherFields(L());
    expect(bad).toEqual([]);
    expect(seen).toBeGreaterThan(180);
  });
  it('the Word LEADS: the frame and the honour of the search are taught before the newsletter is reported', () => {
    expect(L().lesson.indexOf(MOVEMENTS[0])).toBe(0);
    expect(L().lesson.indexOf('(Hebrews 11:3)')).toBeLessThan(L().lesson.indexOf('SECOND,'));
    expect(L().lesson.indexOf('(Proverbs 25:2)')).toBeLessThan(L().lesson.indexOf('The Neuron'));
  });
  it('the ten movements are carried in order, with each block of verses inside its own movement', () => {
    let last = -1;
    for (const h of MOVEMENTS) {
      const at = L().lesson.indexOf(h);
      expect(at, `movement in order: ${h}`).toBeGreaterThan(last);
      last = at;
    }
    // Job 28 is taught inside the fourth movement.
    for (const v of ['Job 28:1', 'Job 28:11', 'Job 28:12', 'Job 28:23', 'Job 28:28']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeGreaterThan(L().lesson.indexOf('FOURTH,'));
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('FIFTH,'));
    }
    // The harvest and the labourers are inside the fifth.
    for (const v of ['Matthew 9:36', 'Matthew 9:37', 'Matthew 9:38', 'Acts 17:11']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeGreaterThan(L().lesson.indexOf('FIFTH,'));
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('SIXTH,'));
    }
    // Chaff, tares and the fining pot are inside the sixth.
    for (const v of ['Jeremiah 23:28', 'Matthew 3:12', 'Matthew 13:29', 'Psalms 12:6', 'Proverbs 17:3']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeGreaterThan(L().lesson.indexOf('SIXTH,'));
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('SEVENTH,'));
    }
    // The authorship verses are inside the eighth.
    for (const v of ['Isaiah 29:16', 'Isaiah 45:9', 'Psalms 100:3', 'Revelation 4:11']) {
      expect(L().lesson.indexOf(`(${v})`)).toBeGreaterThan(L().lesson.indexOf('EIGHTH,'));
      expect(L().lesson.indexOf(`(${v})`)).toBeLessThan(L().lesson.indexOf('NINTH,'));
    }
  });
  it('the newsletter is explained honestly and in full enough that the reader understands the thing', () => {
    const lesson = L().lesson;
    for (const piece of [
      '"These are actual research results."',
      '"722 manuscripts across 372 families of related results after being given roughly 4,000 open research problems."',
      '"Many of the proofs come with Lean formalizations, meaning a computer can mechanically check whether each logical step follows from the rules."',
      '"But this is not 722 gold-star-certified discoveries."',
      '"OpenAI says the collection contains results at different stages of verification, not every manuscript has a Lean proof yet, and some unformalized results could still contain errors."',
      '"The research bottleneck may be moving."',
      '"Not how many manuscripts the model can generate, but how many survive serious independent scrutiny."',
    ]) expect(lesson, piece).toContain(piece);
    // The day and the source are named, and the number is never bare.
    expect(lesson).toContain('2026-10-07');
    expect(lesson).toContain('The Neuron');
    expect(lesson).toContain('"Lesson"');
  });
  it('THE CAUTION ON THIS ONE: the headline figure is never restated as established fact', () => {
    const lesson = L().lesson;
    // Wherever the count is spoken in our own voice it is attributed, and the
    // publisher's own caveat is carried beside it. The figure must never appear
    // in our prose as a settled count of discoveries.
    expect(lesson).toContain("is The Neuron's report of what OpenAI says");
    expect(lesson).toContain('a newsletter reports that a company says it produced a large body of mathematical research');
    expect(lesson).not.toMatch(/the model (?:proved|discovered) (?:722|seven hundred and twenty-two)/i);
    expect(lesson).not.toMatch(/722 (?:new |confirmed )?(?:discoveries|theorems|proofs)\b(?! is a rounding)/i);
  });
  it('provenance is honest: three piles kept apart, our own ground named with its limit, the unchecked named and NOT taught as fact', () => {
    const lesson = L().lesson;
    expect(lesson).toContain('FIRST PILE, WHAT THE NEWSLETTER SAID, attributed to it.');
    expect(lesson).toContain('SECOND PILE, WHAT THIS HOUSE HAS ALREADY BUILT ON THIS PATTERN');
    expect(lesson).toContain('THIRD PILE, WHAT WE DID NOT CHECK, and so do not teach as fact.');
    const third = lesson.indexOf('THIRD PILE');
    for (const unchecked of [
      "We did not open the publisher's own page",
      'blocked from reaching it, which was tested, not assumed',
      'returned only secondhand write-ups',
      'An A.I. agent drafted this page from the forwarded email',
    ]) expect(lesson.indexOf(unchecked, third), unchecked).toBeGreaterThan(third);
    // The limit on our own pile is said, not hidden.
    expect(lesson).toContain('we have not run the model, we have not read a single one of the manuscripts');
    const { nonScripture, bad } = unattributedQuotes(L());
    expect(nonScripture.length).toBeGreaterThanOrEqual(40);
    expect(bad).toEqual([]);
  });
  it('speaks established fact plainly and flags narrowly (DR-0100): three tiers, over-reach corrected both ways', () => {
    const lesson = L().lesson;
    expect(lesson).toContain('Established, and stated plainly:');
    expect(lesson).toContain('That is real, and it is not to be shrunk into nothing');
    expect(lesson).toContain('Open, and named narrowly:');
    expect(lesson).toContain('Over-reach, corrected both ways.');
    // Both directions of over-reach are named, not only the hype one.
    expect(lesson).toContain('Over-reach in the other direction says none of this is real');
    // Never the hedge-word: the unchecked is named by what it is.
    expect(JSON.stringify(L())).not.toMatch(/not verified/i);
  });
  it('teaches, never debates (DR-0098): no both-sides staging, and the Word is the authority', () => {
    const lesson = L().lesson;
    expect(lesson).not.toMatch(/some say|others say|scholars (?:are )?(?:divided|debate)|you decide/i);
    expect(lesson).toContain('We will not stage that as a debate with two confident sides');
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
      expect(L().levels[b].slice(0, 80), b).toContain('The pile the machine made:');
      expect(L().levels[b], b).toContain('TALK ABOUT IT TOGETHER.');
      expect(hasAllThree({ lesson: L().levels[b] }), `${b} band carries all three directions`).toBe(true);
    }
    expect(L().lesson).toContain('TALK ABOUT IT TOGETHER.');
    expect(hasAllThree(L())).toBe(true);
    const own = ownPrompts(L());
    expect(own.parents).toMatch(/Parents, ask your child/);
    expect(own.children).toBeTruthy();
    expect(own.friends).toBeTruthy();
    expect(L().lesson).toMatch(/Friends, tell one friend this week/);
    // ALL THREE DIRECTIONS IN THE CLOSE OF EVERY SURFACE, matched on the
    // sentence TEXT rather than through ownPrompts. ownPrompts cannot be used to
    // measure one band in isolation: it searches PARENTS_TO_CHILDREN only in the
    // adult prose plus the senior band, so handing it a child band under any
    // other field reports a gap that is in the instrument, not in the lesson.
    // So the per-surface check is literal, the way L215 does it.
    for (const [where, t] of [['lesson', L().lesson], ...FULL_BANDS.map((b) => [b, L().levels[b]])]) {
      const close = t.slice(t.indexOf('TALK ABOUT IT TOGETHER.'));
      expect(close, `${where}: parents to children`).toMatch(/Parents, ask your child/);
      expect(close, `${where}: children to parents`).toMatch(/[Cc]hildren, ask your mom, dad or grandparent/);
      expect(close, `${where}: friend to friend`).toMatch(/Friends, tell one friend this week/);
    }
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
  it('the lesson teaches what a formal proof settles and what it cannot, which is the point of the week', () => {
    const lesson = L().lesson;
    expect(lesson).toContain('A proof assistant settles that the steps follow.');
    expect(lesson).toContain('It does not settle that the assumptions you started from are the right ones.');
    expect(lesson).toContain('a witness about the chain, never about the choice of what to prove');
    expect(lesson.indexOf('(Proverbs 14:12)')).toBeGreaterThan(lesson.indexOf('SEVENTH,'));
    expect(lesson.indexOf('(Isaiah 5:20)')).toBeLessThan(lesson.indexOf('EIGHTH,'));
  });
});

describe('sov36 - proven-to-catch: the gate fails on a drifted verse, an unattributed claim, a dropped close, or a misfiled week', () => {
  it('the pinned ground truth is itself exact', () => {
    expect(SOV36_FRAGMENTS['Hebrews 11:3']).toBe('Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.');
    expect(SOV36_FRAGMENTS['Proverbs 25:2']).toBe('It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.');
    expect(SOV36_FRAGMENTS['Job 28:12']).toBe('But where shall wisdom be found? and where is the place of understanding?');
    expect(SOV36_FRAGMENTS['Matthew 9:37']).toBe('Then saith he unto his disciples, The harvest truly is plenteous, but the labourers are few;');
    // The corpus apostrophe is typographic; a straight one would be a silent drift.
    expect(SOV36_FRAGMENTS['Isaiah 29:16']).toContain('the potter’s clay');
    expect(SOV36_FRAGMENTS['Luke 12:15']).toContain('a man’s life');
  });
  it('a one-word drift of Hebrews 11:3 in the lesson is caught', () => {
    const drifted = { ...L(), lesson: L().lesson.split('the worlds were framed by the word of God').join('the worlds were formed by the word of God') };
    expect(missingVerbatim(drifted)).toContain('Hebrews 11:3');
  });
  it('a drifted verse in another field (the senior band) is caught', () => {
    const t = L().levels.senior;
    expect(t).toContain('He telleth the number of the stars');
    const drifted = { ...L(), levels: { ...L().levels, senior: t.split('he calleth them all by their names').join('he calleth them all by name') } };
    expect(unpinnedQuotesInOtherFields(drifted).bad.some((b) => b.startsWith('Psalms 147:4'))).toBe(true);
  });
  it('an unattributed claim smuggled into the lesson in quotation marks is caught', () => {
    const smuggled = { ...L(), lesson: `${L().lesson} "All seven hundred and twenty-two results have now been confirmed by mathematicians."` };
    expect(unattributedQuotes(smuggled).bad).toEqual(['"All seven hundred and twenty-two results have now been confirmed by mathematicians."']);
  });
  it('restating the headline as an established count of discoveries is caught', () => {
    // The exact failure this week was briefed to avoid: a reported number
    // repeated as fact. The detector must see it in our own prose.
    const overclaimed = `${L().lesson} The model discovered 722 new theorems.`;
    expect(/722 (?:new |confirmed )?(?:discoveries|theorems|proofs)\b(?! is a rounding)/i.test(overclaimed)).toBe(true);
    expect(/the model (?:proved|discovered) (?:722|seven hundred and twenty-two)/i.test(`${L().lesson} the model proved 722 results`)).toBe(true);
  });
  it('a lesson that drops TALK ABOUT IT TOGETHER from its bands loses the children-to-parents direction and fails the three-direction rule', () => {
    // The close is where the three directions are authored. Strip it from every
    // band and blank the adult fields that also carry it, and the parents-to-
    // children direction is gone - so the rule fails, which is the whole point.
    const strip = (t) => t.split('TALK ABOUT IT TOGETHER.')[0];
    const cut = {
      ...L(),
      lesson: '',
      bigIdea: '',
      inApp: '',
      benefits: [],
      facilitator: { talkingPoints: [], howToRun: '', discussionPrompts: [] },
      levels: { child: strip(L().levels.child), youth: strip(L().levels.youth), teen: strip(L().levels.teen), senior: strip(L().levels.senior) },
    };
    expect(ownPrompts(cut).parents).toBe('');
    expect(hasAllThree(cut)).toBe(false);
    // And the real lesson, untouched, still passes - otherwise this is theatre.
    expect(hasAllThree(L())).toBe(true);
  });
  it('THE PER-BAND CHECK IS NOT THEATRE: one band losing one direction leaves hasAllThree GREEN, and the literal check names the band', () => {
    // hasAllThree(module) reads the three directions out of DIFFERENT places on
    // purpose -- parents-to-children from the adult prose plus the senior band,
    // children-to-parents from the young bands, friend-to-friend from anywhere.
    // So a single band quietly losing its parents line is invisible to it: the
    // senior band still carries one and the module still passes. That is the gap
    // the literal per-surface assertion closes, and this is the proof.
    const PARENTS = /Parents, ask your child/;
    const CHILDREN = /[Cc]hildren, ask your mom, dad or grandparent/;
    const FRIENDS = /Friends, tell one friend this week/;
    const closeOf = (t) => t.slice(t.indexOf('TALK ABOUT IT TOGETHER.'));
    // The real lesson: every surface carries all three.
    for (const [where, t] of [['lesson', L().lesson], ...FULL_BANDS.map((b) => [b, L().levels[b]])]) {
      const c = closeOf(t);
      expect(PARENTS.test(c) && CHILDREN.test(c) && FRIENDS.test(c), `${where} carries all three`).toBe(true);
    }
    // Now take the parents sentence out of the YOUTH band only.
    const youthClose = closeOf(L().levels.youth);
    const parentsSentence = /Parents, ask your child[^.!?]*[.!?]/.exec(youthClose);
    expect(parentsSentence, 'the youth close has a parents sentence to remove').toBeTruthy();
    const maimed = {
      ...L(),
      levels: { ...L().levels, youth: L().levels.youth.replace(parentsSentence[0], '') },
    };
    // The module-level gate does not notice, which is exactly the point.
    expect(hasAllThree(maimed), 'hasAllThree still passes - it cannot see one band').toBe(true);
    expect(ownPrompts(maimed).parents, 'and it still finds a parents prompt elsewhere').toBeTruthy();
    // The literal per-surface check names the band that lost it.
    const lost = [['lesson', maimed.lesson], ...FULL_BANDS.map((b) => [b, maimed.levels[b]])]
      .filter(([, t]) => !PARENTS.test(closeOf(t))).map(([where]) => where);
    expect(lost, 'the per-surface check must name the youth band').toEqual(['youth']);
  });

  it('week 36 missing, or a higher week filed before it, is caught', () => {
    expect(orderProblem(SOVEREIGN_AI_MODULES.filter((w) => w.id !== SOV36_ID))).toBe('sov36 missing');
    const shuffled = [...SOVEREIGN_AI_MODULES];
    shuffled.splice(shuffled.length - 1, 0, { id: 'sov99-a-week-from-the-future' });
    expect(orderProblem(shuffled)).toMatch(/week 99 is not before week 36/);
    const outOfOrder = [SOVEREIGN_AI_MODULES[1], SOVEREIGN_AI_MODULES[0], ...SOVEREIGN_AI_MODULES.slice(2)];
    expect(orderProblem(outOfOrder)).toMatch(/weeks do not ascend/);
  });
  it('a band that stops naming its lesson, or falls under a full reading, is caught', () => {
    const thin = 'The pile the machine made: check things. TALK ABOUT IT TOGETHER.';
    expect(thin.length).toBeLessThan(2500);
    expect(hasAllThree({ lesson: thin })).toBe(false);
  });
});
