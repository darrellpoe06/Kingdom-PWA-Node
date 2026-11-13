// =============================================================================
// sov81-fill - build Sovereign A.I. week 81 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[James 4:17]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory. The reference list on the module's
// anchor is DERIVED from the placeholders that actually occur in the reader
// places, so anchor.ref names every verse the lesson stands on and nothing it
// does not (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-11-12 at 17:31 UTC Darrell forwarded an IT
// Brew issue, subject line "Copyright, copyleft", out of his university mailbox
// into the lesson lane with ONE WORD typed above the forwarded header: Lesson.
// Gmail thread `1a1d0d054cd67ed2`. The scheduled intake missed it; this build
// is the next day. scripts/lesson-already-built.mjs returned MAYBE on the
// source name only (other IT Brew lessons exist) and nothing on the thread id.
//
// WORD FIRST (DR-0127 / DR-0282). The hour opens on 1 Corinthians 4:7 - what
// hast thou that thou didst not receive - and closes its frame on James 4:17,
// the good that is known and not done. Ownership and the unapplied fix are the
// two stories in the issue, and both are answered from the Word before one
// detail of either article is spoken.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100 / DR-0076 section 8). Read: the forwarded
// newsletter text only. Refused from this session: www.itbrew.com,
// www.copyright.gov and www.php.net (curl: (56) CONNECT tunnel failed, response
// 403), www.bakermckenzie.com and www.copyright.gov again through the fetch tool
// (getaddrinfo ENOTFOUND). A web search returned RESULT SUMMARIES, not pages:
// a listing on the law firm's own newsroom describing the same interview (and
// adding that teams should track which parts of a codebase are machine-written
// and which are human, on the model of open-source governance), and news
// reports that a critical PHP fix was published in October 2026 and that the
// federal cybersecurity agency urged immediate patching. Those reports credit
// OTHER finders as well as the one the newsletter names, and none seen
// confirmed the 2014 date. So checking made the finder claim LESS certain and
// left the date and the seventy-percent share unconfirmed; the teaching rests
// on none of them. ESTABLISHED and stated plainly: a work needs a human author
// for US copyright protection (the Copyright Office's standing position, and
// the rule the app's own IP register was built on, app/src/lib/ip-register.js).
//
// MEASURED ON OUR OWN HOUSE (not painted): the IP register in Books -> Legal
// (app/src/lib/ip-portfolio.js) holds 24 rows - 11 human-authored, 13
// human-directed and AI-expressed, 0 AI-generated - and files the application
// source as human-directed, AI-expressed. On origin/main a5975d92ed0, 1,895 of
// 2,980 commits carry a co-author line naming the machine that helped write
// them. docs/decisions/INDEX.md holds 1,367 dated records.
//
// THE BANDS WERE MOVED BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 81;
const ID = 'sov81-what-hast-thou-that-thou-didst-not-receive';
const TITLE =
  'What hast thou that thou didst not receive - who owns the work a machine helped write, the name written beside it, and the fix that was known and not applied';

// -----------------------------------------------------------------------------
// The corpus
// -----------------------------------------------------------------------------
const books = new Set(
  readdirSync(KJV)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => f.slice(0, -5))
);
const cache = new Map();

function bookFile(name) {
  const k = String(name).replace(/\s+/g, '');
  if (books.has(k)) return k;
  if (books.has(`${k}s`)) return `${k}s`;
  return null;
}

function verseText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) throw new Error(`sov81: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov81: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov81: reference does not resolve in the corpus -> "${ref}"`);
  return text;
}

const readerRefs = [];
const seenReader = new Set();

function fill(text, isReaderPlace = false) {
  return String(text).replace(/\[\[([^\]]+)\]\]/g, (_, ref) => {
    const r = ref.trim();
    const t = verseText(r);
    if (isReaderPlace && !seenReader.has(r)) {
      seenReader.add(r);
      readerRefs.push(r);
    }
    return `"${t}" (${r})`;
  });
}

function fillDeep(value) {
  if (typeof value === 'string') return fill(value);
  if (Array.isArray(value)) return value.map(fillDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = fillDeep(v);
    return out;
  }
  return value;
}

// -----------------------------------------------------------------------------
// The sentences every reader place must carry, so a reader who reads ONE band
// still gets the shut road, the date and the frame (DR-0795).
// -----------------------------------------------------------------------------
const BLOCKED = {
  lesson:
    "WHAT WE DID NOT CHECK AT THE SOURCE. We read the newsletter itself and nothing behind it. The full articles sit on www.itbrew.com, and that address, the Copyright Office at www.copyright.gov, the PHP project at www.php.net and the law firm's own newsroom were all refused or would not resolve from our network. So the lawyer's words are told here as the newsletter reported them, and every detail of the security story - who found the flaw, the year it began, the share of websites it touches, which offices were slow - is the newsletter's account and not ours. A web search returned summaries of news reports that agree a critical fix was published in October and that the federal cybersecurity agency urged everyone to apply it at once. Those reports name other finders besides the one the newsletter names, and none we saw confirmed the year 2014. We opened none of those pages either. What we state plainly is what is established: a work needs a human author to be protected by copyright in this country, and a fix that is published and not applied leaves the hole open. A shut road must never read like a verified fact. re-review: 2026-11-27.",
  child:
    'WHAT WE DID NOT CHECK. We read the email. We did not get to read the long stories behind it. They are on a website called www.itbrew.com, and our computer could not open it. So the parts about the lawyer and the fix are what the email said. We tell you that so you know. Some news we found agrees there was a fix. But some of it names other people who found the problem. A closed door is not the same as a checked fact. We will try again. re-review: 2026-11-27.',
  youth:
    "WHAT WE DID NOT CHECK. We read the newsletter and nothing behind it. The full stories live at www.itbrew.com, and our network could not open that site, or the Copyright Office, or the PHP site, or the law firm. So what the lawyer said is told the way the newsletter told it. Who found the flaw, what year it started, and who was slow to fix it are the newsletter's claims, not ours. A search showed news reports that agree a big fix came out in October. Those reports name other finders too, and none we saw proved the year 2014. A shut door must never sound like a checked fact. re-review: 2026-11-27.",
  teen: "WHAT WE DID NOT CHECK. Be clear on what we actually read. We read the newsletter. We did not get behind it: www.itbrew.com, the Copyright Office, the PHP site and the law firm's page were all blocked from our network. So the lawyer's words are the newsletter's report of them. The security details - who found it, since when, how many sites, which offices were slow - are the newsletter's claims. A web search turned up news summaries that agree a critical fix shipped in October and that the federal security agency told everyone to patch right away. They also name other finders, and none we saw backed the 2014 date. Two things are not in doubt: copyright needs a human author, and a patch you do not install protects nothing. re-review: 2026-11-27.",
  senior:
    "WHAT WE DID NOT CHECK AT THE SOURCE. We read the newsletter and went no further, because the roads behind it were shut: www.itbrew.com, the Copyright Office, the PHP project and the law firm's own newsroom were each refused or would not resolve from our network. The lawyer's counsel is therefore given as the newsletter reported it, and the particulars of the security story - the finder, the year 2014, the share of the web, the slow offices - remain the newsletter's account. A web search did return summaries of news reports agreeing that a critical fix was published in October and that the federal cybersecurity agency urged it be applied at once; those reports credit other finders as well, and none we saw confirmed the date. Two things are established and are stated plainly here: copyright in this country requires a human author, and a published fix that is never applied leaves the door exactly as open as before. A shut road must never read like a verified fact. re-review: 2026-11-27.",
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - what is something you made that you are proud of, and who helped you make it - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, 1 Corinthians 4:7. Children, ask your mother, your father or a grandparent about a time they knew something needed fixing and put it off, and what it cost; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what is one thing each of us knows we should fix, and when will we do it. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - what did you make, and who helped you - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, James 4:17. Children, ask your mom or your dad or your grandma or your grandpa about a time they fixed something right away. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what is one thing we know we should fix. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is something you made that had help in it, and how would you tell people which part was yours - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Exodus 31:3. Children, ask your mom, your dad or a grandparent about something they were given credit for that someone else helped with, and what they did about it, and hear the whole of it before you answer; then retell their answer in your own words. Then ask a friend this: what is one update, one repair or one apology we both keep putting off. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when you turn in work that a tool helped with, how do you say which part is yours - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Romans 16:22. Children, ask your mom, your dad or a grandparent about a warning they ignored once, what happened next, and what they would tell their younger self, and hear all of it before you reply; then retell their answer in your own words. Then ask a friend this: what is one thing on each of our phones we already know needs updating, and why have we not done it. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what have you made that you would put your name on, and what would you say about the help you had - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Psalm 24:1. Children, ask your parents or your grandparents about a repair they put off for years, a roof or a fence or a quarrel, and what the waiting cost; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: which fix in our two houses has been known for a long time and still not made. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no detail from the newsletter stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the twelfth of November 2026, a little after half past eleven in the morning, Darrell forwarded a technology newsletter out of his university mailbox into this lane. Above the forwarded header he typed ONE WORD: Lesson. That word is the ask. The newsletter is only the occasion, and no article is the foundation of an hour in this course. The scheduled intake that should have caught it did not, and it was built the next day by hand.

THE WORD FIRST, BEFORE ANY ARTICLE. Two verses frame this hour, and everything after them is application. The first is a question about everything we hold: [[1 Corinthians 4:7]] The second is a sentence about everything we know: [[James 4:17]] Received, and responsible. Hold both, and then hear the news.

WHAT THE ISSUE HELD. Two stories worth an hour. The first asks who owns software that was written with the help of an artificial-intelligence tool - what the industry has started calling vibe-coded software, where a person describes what they want and a machine writes most of the code. A lawyer who leads technology transactions at a large law firm told the newsletter that current copyright law requires some amount of human contribution and authorship before a work is protected, and that companies using these tools need to talk about authorship, about documenting authorship, and about protecting both what comes out of the machine and what they put into it. The second story is about a security flaw in PHP, a programming language that runs a great share of the world's websites. The newsletter says the flaw was reported in October, that it had gone unnoticed for years, that the people who maintain the language published a fix quickly, and that some organizations, federal offices among them, have been slow to apply it.

This lesson is close to home. PoeTech, the app you are reading this in, is written with the help of exactly this kind of tool. So the questions are not about somebody else's company. What do we own? How do we show which part is ours? And what do we do with a fix we already know about?`,

  `MOVEMENT ONE: NOTHING IN THE HOUSE STARTED WITH US. Begin where the Word begins, because the Word is the foundation here and the authority.

[[Psalm 24:1]] Before anybody files for a copyright, the title deed to the whole earth is already written, and the name on it is not ours. Then Paul's question from the top of this hour sits underneath every argument about ownership. Three questions in one verse. Who made you different? What do you have that you were not given? And if it was given, why are you boasting as though it were not?

Moses warned Israel about the exact moment this question gets forgotten, which is the moment the work succeeds: [[Deuteronomy 8:17]] And the answer he gave: [[Deuteronomy 8:18]] The power to produce is itself a gift. James says it about every good thing at once: [[James 1:17]] And David, standing in front of the largest offering Israel had ever gathered, refused to take credit even for the giving: [[1 Chronicles 29:14]]

So the first answer to who owns the work is not a legal one. Everything we hold, we received. That does not make ownership meaningless. It makes it stewardship. A steward holds real things, really, and answers for them.`,

  `MOVEMENT TWO: THE SKILL WAS GIVEN, AND THE CRAFTSMAN WAS CALLED BY NAME. When Yahweh wanted a tabernacle built, He did not leave the craftsmanship to chance. [[Exodus 31:2]] Called by name. Then: [[Exodus 31:3]] Wisdom, understanding, knowledge and every kind of workmanship - filled in, from outside the man. And it was not only Bezaleel: [[Exodus 31:6]] He put wisdom into the hearts of all the skilled workers, so that they could make all that He had commanded.

Two things are true at once in that passage, and the whole ownership question lives between them. The skill was given. Bezaleel did not invent his own ability. And yet the record names him, by father and grandfather and tribe, and when the work is done the text says plainly who did it: [[Exodus 36:1]] The gift came from above, and the hands that worked were still real hands, and Scripture writes their names down.

That is the shape we want for anything built with a tool. A tool is a given thing, like the skill was. The human part is still real, and it should be named.`,

  `MOVEMENT THREE: WHAT THE LAWYER SAID, AND WHAT IS SIMPLY ESTABLISHED. Now the article, and only after the frame. The newsletter reports the lawyer's counsel in one long sentence: talk about authorship, document authorship, and think about protecting both the output and what you use and create. We could not open the full interview, so his words stand here exactly as the newsletter carried them.

Underneath his advice is something that is not in doubt and does not need hedging. In this country, a work needs a human author to be protected by copyright. That is the standing position of the US Copyright Office, and our own app already built a rule on it in September: the IP register refuses to record any work whose authorship nobody decided, and it refuses to call machine-generated material registrable. The open questions in the law are narrower than the headlines make them sound. They are about HOW MUCH human contribution is enough in a given work - not about whether a human is required.

So the practical counsel follows from the established part. If the human contribution is what makes the work protectable, then the human contribution has to be visible. And the Word said that long before any court did: [[Habakkuk 2:2]] Write it. Make it plain. Put it where it can be read by someone moving fast. Documentation of authorship is not paperwork. It is writing the vision on tables.`,

  `MOVEMENT FOUR: THE SCRIBE IS NAMED, AND THE LETTER IS STILL PAUL'S. Scripture has already shown us what honest authorship looks like when more than one hand is on the page.

[[Jeremiah 36:4]] The words are Jeremiah's, from the LORD. The pen is Baruch's. Nobody is confused about that, and the text says both. When the king burned the roll, the same arrangement wrote it again: [[Jeremiah 36:32]]

Then the most charming line in all of Paul's letters, near the end of Romans, where the man holding the pen steps forward for one sentence: [[Romans 16:22]] The scribe names himself. And the letter is still Paul's, and everyone has always known it. Paul even explains how a reader could tell: [[2 Thessalonians 3:17]] A token in every letter. A mark only the author makes.

Now look at our own house, because it already does this, and the numbers are measured rather than remembered. Darrell speaks a teaching or makes a decision, and that word is the source - captured, dated and attributed to him. The decisions are written as dated records, more than thirteen hundred of them, each saying who decided and when. And the machine that writes much of the code is named on the work itself: on the main line of this project, 1,895 of 2,980 commits carry a co-author line naming the tool that helped write them. That line is Tertius, stepping forward to say I wrote this. The decision records and the spoken teachings are the token in every epistle. The record says which hand held the pen and whose words they were.`,

  `MOVEMENT FIVE: DO NOT OVERSTATE YOUR SHARE. There is a temptation on the other side, and the Word closes it as firmly as it closes boasting. [[Proverbs 11:1]] A false balance is not only cheating someone else out of what is theirs. It is also weighing your own share heavier than it is.

[[Proverbs 12:22]] And Paul set the standard for the honest record, before both audiences at once: [[2 Corinthians 8:21]] Honest in the sight of the Lord, and honest in the sight of men.

This is where our own register is wiser than a lot of companies. It will not let anyone mark a work human-authored by default. Of the twenty-four things it lists, eleven are recorded as human-authored - the binding rules, the Worldview, the decision ledger, the captured spoken teachings and the marks - thirteen as human-directed and AI-expressed, and none as purely generated. The application source itself is filed honestly in the middle category, with a note that it must be sorted before anything is filed, because bulk generated code is the weakest part. And the project's license reserves its rights only to the extent such rights exist - which is the honest sentence. It does not claim more than the law gives.

[[Proverbs 27:2]] Let the record do the praising. A true record that says this part is mine and this part was the tool's is worth more than a large claim that falls apart when someone asks.`,

  `MOVEMENT SIX: THE LANDMARK - WHAT CAME IN UNDER SOMEONE ELSE'S TERMS. The newsletter's own title names a second word: copyleft. Copyleft is the name for licenses that let anyone use, change and share code freely, on one condition - what you build from it must be shared on the same terms. It is generous, and it has a boundary, and the boundary is the point.

Scripture is not vague about boundaries that belong to someone else. [[Proverbs 22:28]] [[Proverbs 23:10]] [[Deuteronomy 19:14]] And Israel said amen to this out loud, as a people: [[Deuteronomy 27:17]]

A tool that writes code has learned from a great deal of other people's code, and it can carry pieces of it into your work without telling you where they came from. The lawyer's counsel about protecting what you use is the landmark question. What came in under somebody else's terms? Did their conditions come with it? The golden rule settles the posture: [[Luke 6:31]] If you would want your terms honored, honor theirs. Moving a neighbour's landmark is not made innocent because a machine moved it for you.`,

  `MOVEMENT SEVEN: THE FIX THAT WAS KNOWN. Now the second story, and it is shorter because the Word is so direct about it.

Go back to the second verse that opened this hour, James 4:17, and read it twice. Not to him that did evil - to him that KNEW TO DO GOOD and did not. A fix that has been published and is sitting unapplied is exactly that verse in a server room. The flaw is no longer a secret, the remedy is in hand, and the only thing between the hole and the patch is a choice not yet made.

[[Proverbs 3:27]] When it is in the power of thine hand to do it. The fix is in the power of the hand. And the watchman passage says who carries the cost when a warning is not acted on: [[Ezekiel 33:6]]

Solomon walked past a neglected field once and took a lesson from it: [[Proverbs 24:30]] [[Proverbs 24:31]] [[Proverbs 24:32]] The stone wall was broken down. Not by an enemy - by being left. [[Ecclesiastes 10:18]] The house drops through by idle hands.

When Nehemiah rebuilt the wall of Jerusalem, every family fixed the part in front of its own door: [[Nehemiah 3:28]] Nobody waited for the whole city to be fixed first. And Jesus put the heaviest weight not on ignorance but on knowledge left unused: [[Luke 12:47]]

So this is what the newsletter's story teaches once the details are set aside. Being slow to apply a known fix is not a technical delay. It is a decision. It may be a fair one - testing a patch before applying it is wise, and Solomon praises the man who sees trouble coming and takes cover: [[Proverbs 27:12]] But waiting must be a decision with a date, not a drift. And you cannot make that decision about a flock you do not know you have: [[Proverbs 27:23]] Know the state of thy flocks - which devices, which programs, which versions. You cannot patch what you have not counted.`,

  `MOVEMENT EIGHT: THE AUTHOR AND FINISHER. Bring it home, and bring it to the One every work finally belongs to.

All of this - the earth, the skill, the tools, the people who use them - was made through the Son: [[Colossians 1:16]] [[Colossians 1:17]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] and He is the one Author whose work is never in question and never left unfinished: [[Hebrews 12:2]]

And so the right prayer over anything we build, with any tool, is Moses' prayer: [[Psalm 90:17]] Not our name established. The work of our hands, established by Him.`,

  `THREE THINGS THIS WEEK, and none of them needs a purchase.

One, name the hands. Take one thing you made with a machine's help - a letter, a school paper, a flyer, a spreadsheet, a piece of code - and write two short lines about it: what was mine, and what the tool did. Tertius did it in one sentence. So can you.

Two, walk one landmark. Find one thing you use that belongs to someone else under their terms - a photo, a song, a font, a recipe from a book, a piece of shared code - and read the terms once. Honor them, or stop using it.

Three, apply one known fix. Every phone and computer in your house has an update waiting that somebody has dismissed. Count the devices first, then install one fix today. If you decide to wait, write down why and the date you will do it. A delay with a date is stewardship. A delay without one is the broken wall.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that tools are wrong to use, or that nothing made with help can be ours. Bezaleel's skill was given and his name is still on the work. The point is honesty in both directions: claim what is truly yours, name what is not, honor the landmarks, and fix what you already know is broken.`,

  BLOCKED.lesson,

  TALK.lesson,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader, not a
// re-registering of the adult text, and each carries the whole teaching, the
// shut road and the talk-together close (DR-0795).
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

TWO SMALL QUESTIONS. Who made it? Who fixes it? This whole lesson is about those two questions.

WHO SENT THIS. Darrell got an email about computers. He wrote one word on top of it. The word was Lesson. Then he sent it to us. That one word is why you are reading this.

THE WORD FIRST. Long ago, Paul asked a big question. Here it is. [[1 Corinthians 4:7]]

What do you have that you were not given? Think about it. Your eyes were given. Your hands were given. The air you breathe was given. Even the smart things you can do were given.

David said the same thing in a song. [[Psalm 24:1]] The whole earth is Yahweh's. Everything in it is His. That means everything we have is on loan. We take care of it for Him.

AND ONE MORE VERSE. James wrote a short verse. It is easy to say and hard to do. [[James 4:17]]

If you know the good thing to do, do it. If you know and you do not do it, that is sin. Hold on to that one.

THE STORY THE EMAIL TOLD. Some people use a computer helper to write computer programs. They tell the helper what they want. The helper writes most of it. Then they fix it up and use it.

So who made it? The person? Or the helper?

A lawyer is a person who knows the rules of the land. A lawyer said a thing about this. He said a person has to do some of the work. If no person did any of it, no one can own it the way the law means. So people should write down which part they did.

A MAN NAMED BEZALEEL. Yahweh once picked a man to build beautiful things. He called him by his name. [[Exodus 31:2]]

Then Yahweh filled him with skill. [[Exodus 31:3]]

Look at that. The skill was a gift. But the man still did the work. And the Bible still wrote down his name. Both things are true. The gift came from Yahweh. The hands were Bezaleel's.

THE MAN WHO HELD THE PEN. Paul wrote letters. Sometimes a helper held the pen for him. One helper wrote his own name in the letter. Here it is. [[Romans 16:22]]

Tertius wrote it down. But the letter was still Paul's. Everyone knew. The helper did not pretend. Paul did not pretend. They both told the truth.

That is how to do it. Say what you did. Say what the helper did. Tell the truth about both.

OUR APP DOES THIS TOO. The app you are reading is built with a computer helper. Darrell says what he wants. He makes the choices. The helper writes a lot of the code. And every time the helper writes some, its name gets written down beside the work. Just like Tertius.

DO NOT TAKE WHAT IS NOT YOURS. Long ago people used big stones to mark land. A stone showed where your field stopped. Your neighbor's field started there. The Word says do not move it. [[Proverbs 22:28]]

Some things we use belong to other people. A song. A picture. A game. They let us use them, but they have rules. We keep their rules. That is like leaving the stone where it is.

THE FIX NOBODY PUT ON. Here is the second story. Some people found a hole in a computer program. Lots of websites use that program. The people who made it found a fix fast. They gave the fix to everyone.

But some people did not put the fix on. They knew about it. They just did not do it.

That is like a hole in your fence. You know it is there. You have the boards. You have the nails. But you leave it. Then the dog gets out.

Remember the verse? If you know the good thing, do it.

A WALL THAT FELL DOWN. King Solomon saw a field once. [[Proverbs 24:30]] [[Proverbs 24:31]]

The wall was broken. No one broke it on purpose. It was just left alone too long. Left alone, things fall down.

A STORY ABOUT A CAKE. Here is a made-up story to help you think. It did not really happen.

A boy named Sam wanted to bake a cake for his mom. His big sister helped. She read the recipe out loud. She turned on the oven, because Sam is not allowed to. Sam cracked the eggs. Sam stirred and stirred. Sam put on the frosting. He put on way too many sprinkles.

At dinner, Dad said, Sam, did you make this all by yourself?

Sam wanted to say yes. It would feel good to say yes. But it would not be true.

So Sam said, I made it with my sister. She read the recipe and did the oven. I did the eggs and the stirring and the frosting. And all the sprinkles.

Everyone laughed. Mom gave them both a hug. The cake was still Sam's gift. And his sister got thanked too. Telling the truth did not make the cake any less good. It made it better.

That is what this lesson is about. Say what you did. Say what your helper did. Both are true.

WHAT IF NO ONE SEES? Sometimes no one would ever know. No one would know the helper did a part. No one would know you skipped the fix.

But Yahweh knows. And you know. That is enough reason to tell the truth and do the good thing.

COUNT YOUR SHEEP. A good shepherd counts his sheep every day. He wants to know if one is hurt. He wants to know if one is lost. [[Proverbs 27:23]]

You can count too. How many toys do you have? How many of them are broken? You cannot fix a toy you forgot about. So first you count. Then you fix.

FIX YOUR OWN PART FIRST. Long ago the wall around a big city was broken. A man named Nehemiah came to fix it. Every family fixed the part of the wall by their own house. [[Nehemiah 3:28]]

They did not wait for someone else. They did their part. You can do your part too. Start with the thing right next to you.

THE ONE WHO MADE IT ALL. Jesus is the One who made everything. [[Colossians 1:16]]

He is the Lamb. [[John 1:29]] He is the Son of Yahweh. Yahweh gave Him to us because of His great love. [[John 3:16]]

He never leaves a job half done. He finishes what He starts.

THREE THINGS THIS WEEK.

One. Think of a thing you made with help. Tell someone which part you did. Tell them which part the helper did.

Two. Find a rule on a thing you use. Keep it.

Three. Find one thing to fix. A loose toy. A messy shelf. A sorry you did not say. Fix it today.

${BLOCKED.child}

${TALK.child}`;

const YOUTH = `${TITLE}.

THE QUESTION UNDER THE QUESTION. If you build something with help, whose is it? And if you already know how to fix something, why is it still broken? Those are the two questions in this lesson, and the Word answers both.

WHERE THIS CAME FROM. Darrell forwarded a technology newsletter into the app with one word typed on top: Lesson. His word is why this lesson exists. The newsletter is only the starting point.

THE WORD FIRST. Start with the question Paul asked the church at Corinth. [[1 Corinthians 4:7]]

There are three questions in that verse. What makes you different from anyone else? What do you have that was not given to you? And if it was given, why are you bragging like you made it yourself?

Then a song of David that says who owns everything. [[Psalm 24:1]]

And one verse from James that you will need by the end. [[James 4:17]]

That is the frame. Everything we have was received. And knowing the right thing makes us responsible for doing it.

WHAT THE NEWSLETTER SAID. More and more people write software by telling a computer program what they want, and the program writes most of the code. Some call it vibe coding. A lawyer told the newsletter that the law says a work needs some human contribution to be protected by copyright. Copyright is the right that says a book, a song or a program is yours and others cannot copy it without asking. So he said teams should keep a record of who did what.

That part is not a guess. In this country, a work needs a human author for copyright. That is settled. The open question is only how much human work is enough.

THE SKILL WAS A GIFT. When Yahweh wanted the tabernacle built, He chose a craftsman by name. [[Exodus 31:2]] [[Exodus 31:3]]

Bezaleel did not make up his own talent. Yahweh filled him with it. And Yahweh gave skill to other workers too. [[Exodus 31:6]]

But here is the thing. The Bible still writes down Bezaleel's name, and his father's name, and his tribe. The gift came from above. The work was still really his. Both are true.

A tool is like that too. It is a gift. But the person who directs it, chooses, fixes and decides is still doing real work, and that work should be named.

THE HELPER WHO SIGNED HIS NAME. Paul often had someone else write his letters down while he spoke them. At the end of Romans, the writer adds one line of his own. [[Romans 16:22]]

Tertius says plainly that he held the pen. And nobody thinks Romans is Tertius's letter. It is Paul's. Paul even had a way to prove it. [[2 Thessalonians 3:17]]

So honest authorship looks like this: the helper is named, the author is clear, and there is a mark that shows whose it is.

HOW OUR APP DOES IT. The app you are using right now is built with a computer helper that writes code. Darrell speaks the teachings and makes the decisions, and those are written down with his name and the date. When the helper writes code, a line naming it is added to the record. That is Tertius signing his name. Our own list of what we own does not pretend the code is all human. It marks the code as human-directed and machine-written, which is the honest label.

DO NOT WEIGH YOUR SHARE HEAVY. Bragging is one danger. Lying about your part is another. [[Proverbs 11:1]]

A false balance is a scale that lies. If you say you did more than you did, your scale is lying. Tell the true weight.

THE OLD STONES. The newsletter's title also had the word copyleft in it. That is a kind of license that lets you use someone's code for free, as long as what you build with it is shared the same way. It is generous, with a boundary.

The Word says to respect boundaries that belong to others. [[Proverbs 22:28]] [[Deuteronomy 27:17]]

A landmark was a stone that marked where one family's land ended. Moving it was stealing land. When a tool brings someone else's work into yours, their terms come with it. Keep them.

THE FIX THAT SAT THERE. The second story was about a hole found in PHP, a language that runs a lot of websites. The people who look after it made a fix quickly. But the newsletter says some offices were slow to put it on.

Go back to James. If you know the good to do and do not do it, that is sin. A fix you know about and do not use is that verse exactly.

Solomon walked past a neglected field and learned from it. [[Proverbs 24:30]] [[Proverbs 24:31]] [[Proverbs 24:32]]

Nobody attacked that wall. It fell down from being ignored.

When Nehemiah rebuilt Jerusalem's wall, each family repaired the part in front of its own house. [[Nehemiah 3:28]] Start with yours.

You also have to know what you have. [[Proverbs 27:23]] You cannot fix a phone you forgot you own.

WHY WRITING IT DOWN HELPS. Yahweh once told a prophet to write a message so clearly that a person running past could still read it. [[Habakkuk 2:2]]

That is a good rule for your own work. If a teacher or a boss asks later which part of a project was yours, you should not have to guess. Keep a short note while you work. What did I plan? What did I choose? What did I change after the tool gave me its first try? What did the tool write? A note like that takes two minutes. It saves you from ever having to stretch the truth, and it shows the real work you did.

WHEN SOMEONE ELSE GETS THE CREDIT. The same rule works the other way. Maybe you helped a friend with a project and your name was left off. Do not get bitter. The Word says to let others do the praising, not your own mouth. [[Proverbs 27:2]]

Honest records protect everyone. They protect the helper who did real work, and they protect the person whose name is on the front from being accused of taking more than they did.

A GOOD FIX HABIT. Here is a simple plan for the second half of this lesson. Once a week, maybe Sunday night, check your phone, your tablet and any computer you use. Look for updates that are waiting. Install them. If one needs a grown-up, ask one. If you decide to wait on one, write down why and when you will do it.

That is all. It takes ten minutes. It is the Nehemiah way: fix the part of the wall in front of your own door first.

And help someone else do it. Many grandparents have phones full of waiting updates because nobody showed them where to look. Sit down with one of them and do it together. That is a gift that keeps their messages, their photos and their bank safer, and it costs you one afternoon.

WHAT IF IT SEEMS SMALL? A hole in a program does not look like much. It is just a line in a settings screen that says an update is ready. But a small hole is how a thief gets in. Solomon saw the broken wall and learned a lesson from it, and he said so. The point is to learn from the wall before yours falls down, not after.

THE AUTHOR OF EVERYTHING. All things were made through Jesus, and all things hold together in Him. [[Colossians 1:17]]

He is the Lamb who takes away sin. [[John 1:29]] He is the Eternal Son of Yahweh. [[John 3:16]] And He finishes what He starts. [[Hebrews 12:2]]

THREE THINGS THIS WEEK.

One. Pick something you made with help - homework, a video, a drawing, a program. Write two lines: what I did, and what the tool or the helper did.

Two. Find one thing you use that belongs to someone else, and check its rules.

Three. Count the devices in your room. Install one update you have been ignoring. If you wait, write down why and when.

${BLOCKED.youth}

${TALK.youth}`;

const TEEN = `${TITLE}.

TWO HONEST QUESTIONS. You will build things with tools your whole life. So here are two questions worth getting right early. When a tool helps you make something, what part is actually yours? And when you know a fix exists, what is your excuse for not using it?

WHO SENT THIS. Darrell forwarded a tech newsletter into this lane and typed one word above it: Lesson. That word is the ask. The newsletter is just where it started.

START WITH THE WORD. Read this slowly. [[1 Corinthians 4:7]]

Paul is not saying you are nothing. He is saying everything you have came from somewhere. Your brain, your skill, the tools you use, the time you get - all received. So bragging as if you made yourself is just false.

The psalm says who holds the deed. [[Psalm 24:1]]

Now hold this verse next to it, because the second half of the lesson hangs on it. [[James 4:17]]

That verse does not say whoever does bad. It says whoever KNOWS the good and skips it.

THE OWNERSHIP STORY. Here is what the newsletter reported. People now build apps by describing what they want to an AI tool, which writes most of the code. A lawyer who handles tech deals told the newsletter that copyright law requires some human contribution before work gets protected. His advice: talk about authorship, document it, and protect both the output and the inputs.

Here is the part that is not up for debate. In the US, copyright needs a human author. That is the settled position of the Copyright Office. What courts and offices are still working out is how much human input is enough in a given case. So if your part is what makes something yours, you had better be able to show your part.

Habakkuk got a command that fits. [[Habakkuk 2:2]] Write it down. Make it clear. Make it readable for someone in a hurry.

SKILL IS GIVEN, AND NAMES STILL MATTER. Look at how the tabernacle got built. [[Exodus 31:2]] [[Exodus 31:3]]

Bezaleel's talent came from Yahweh. He did not earn it. And still, Scripture records his name, his family and his tribe, and later says straight out who did the work. [[Exodus 36:1]]

So which is it - gift or achievement? Both. The ability was given. The work was real. That is the pattern for using any tool well.

THE SCRIBE WHO SAID HI. Paul usually dictated his letters. At the end of Romans the guy writing it down slips in one line. [[Romans 16:22]]

He does not pretend he wrote Romans. Paul does not pretend he held the pen. And Paul had a way to mark his own letters. [[2 Thessalonians 3:17]]

Jeremiah did the same with Baruch. [[Jeremiah 36:4]] Jeremiah's words, Baruch's pen, and the record says both.

That is what documented authorship looks like: the helper is named, the author is obvious, and there is a mark nobody else makes.

YOUR SCHOOLWORK, YOUR CODE, OUR APP. Think about this for your own work. If a tool wrote most of your essay, putting only your name on it is a false balance. [[Proverbs 11:1]]

Our own app runs on this rule. It is built with an AI coding tool. Darrell's spoken teachings and decisions are the source, written down with his name and the date. The tool is named on its work in the project history, like Tertius. And the app's own register of what PoeTech owns does not let anyone mark something human-authored by default. It labels the code as human-directed and machine-written. That is the honest label, and the honest label is the one that holds up.

THE LANDMARK. The newsletter's title had a second word: copyleft. Copyleft licenses let you use code for free on one condition: what you build with it gets shared on the same terms. Generous, with a line.

The Word is serious about lines that belong to other people. [[Proverbs 23:10]] [[Deuteronomy 19:14]]

AI tools learn from huge amounts of other people's code and can drop pieces of it into yours. If that code came with terms, the terms came too. Treat their work the way you want yours treated. [[Luke 6:31]]

THE PATCH NOBODY INSTALLED. Second story. A serious hole was found in PHP, a language behind a lot of the web. The people who maintain it shipped a fix fast. The newsletter says some organizations, including federal offices, were slow to apply it.

Back to James. Knowing the fix and not applying it is the verse in real life. And there is no hiding behind being busy. [[Proverbs 3:27]]

Is waiting ever okay? Sure - testing a fix before rolling it out is smart. [[Proverbs 27:12]] But smart waiting has a reason and a date. Drift has neither.

Solomon's walk past a lazy man's field says what drift does. [[Proverbs 24:31]] [[Ecclesiastes 10:18]]

And you cannot patch what you have not counted. [[Proverbs 27:23]]

A QUICK TEST FOR YOUR OWN WORK. Before you put your name on something a tool helped with, ask yourself five questions.

What did I decide? The idea, the goal, the order of things - those choices are yours.

What did I write or change myself? Not what you approved. What you actually made.

What did the tool produce that I kept as it was? Be honest about this one. It is usually more than you want to admit.

Whose work might the tool have pulled in? If you cannot tell, that is worth knowing too.

Could I explain every part of it if someone asked? If not, you do not really own that part yet.

None of these questions means you did something wrong by using a tool. They are just how you find out what is true. And when you know what is true, you can say it without worrying about getting caught.

WHY PATCHES GET SKIPPED. Be real about the excuses, because you will use them. It might break something. I will do it later. It is probably fine. I do not have time. Some of those are fair for a day. None of them is fair for a month.

The watchman in Ezekiel had one job: see the danger and blow the trumpet. If he saw it and stayed quiet, the Word put the blame on him. [[Ezekiel 33:6]] Once you know about a hole, you are the watchman for your own devices. Knowing makes it yours.

So set a rule now, before you need it. Updates on your own stuff happen within a week of showing up. If one is held back, it gets a note with the reason and the date. Simple rules beat good intentions.

ONE MORE THING ABOUT REPUTATION. You are building a name right now, whether you think about it or not, and teachers, coaches and future employers will eventually decide how much to trust your work. The fastest way to lose that trust is to get caught claiming work that was not yours. The fastest way to build it is to be the person whose description of their own work always turns out to be accurate, including the parts where you say a tool helped. Nobody can take that kind of name from you. It is built one honest sentence at a time, and it lasts longer than any grade.

THE AUTHOR AND FINISHER. Everything was made by Jesus and holds together in Him. [[Colossians 1:16]] He is the Lamb of Yahweh. [[John 1:29]] He is the Eternal Son of Yahweh. [[John 3:16]] His throne lasts forever. [[Hebrews 1:8]] And He finishes what He starts. [[Hebrews 12:2]]

THREE THINGS THIS WEEK.

One. Next time you turn in work a tool helped with, add one honest line about what the tool did.

Two. Pick one thing you use that is someone else's - a song in your video, a font, some code - and read its terms.

Three. Open the settings on your phone and laptop. Install the updates you keep dismissing. If you hold one back, write down why and when you will do it.

${BLOCKED.teen}

${TALK.teen}`;

const SENIOR = `${TITLE}.

A QUESTION OLDER THAN COMPUTERS. Most of us have spent a lifetime making things with help. A family business built with a spouse's bookkeeping. A garden planted from a neighbour's cuttings. A sermon shaped by a mentor's counsel. So the question in this lesson is not new to you, even if the machine is: when many hands touch the work, what is honestly ours? And beside it, a second question every homeowner knows: what do we do about the repair we have known about for years?

WHO SENT THIS. Darrell forwarded a technology newsletter into the app with a single word typed above it: Lesson. That word is the request. The newsletter is only where the conversation began.

THE WORD FIRST. Paul put the matter to the Corinthians in three questions. [[1 Corinthians 4:7]]

You have lived long enough to answer them from experience. What do we have that we did not receive? The strength to work, the years to work in, the people who taught us, the opportunities that opened - all of it received. David put the title deed in one line. [[Psalm 24:1]]

Moses warned that prosperity is the moment people forget this. [[Deuteronomy 8:17]] [[Deuteronomy 8:18]] And David, at the height of Israel's giving, would not even take credit for the gift. [[1 Chronicles 29:14]]

Then James sets the other half of the frame, and it is one of the plainest verses in the Bible. [[James 4:17]]

WHAT THE NEWSLETTER REPORTED. Software is increasingly written by describing to a computer program what one wants and letting it compose most of the code. A lawyer who leads technology transactions at a large firm told the newsletter that copyright requires some human contribution and authorship, and that companies should discuss authorship, document it, and protect both what the tool produces and what goes into it.

The principle beneath his counsel is settled, and should be stated without hedging: in this country a work must have a human author to be protected by copyright. That is the Copyright Office's standing position. What remains open is only how much human contribution suffices in a particular work.

THE CRAFTSMAN CALLED BY NAME. When the tabernacle was built, Yahweh named the craftsman Himself and supplied the gift. [[Exodus 31:2]] [[Exodus 31:3]] [[Exodus 31:6]]

The pattern deserves a moment's reflection. The skill was plainly given; Bezaleel did not author his own ability. Yet the record names him with his father, grandfather and tribe, and later says without embarrassment that he and Aholiab did the work. [[Exodus 36:1]] Gift and labour are both honoured. Neither cancels the other.

THE SCRIBE WHO SIGNED HIS LINE. Many of us remember dictating letters, or typing them for an employer. Scripture records the same arrangement. [[Jeremiah 36:4]] [[Jeremiah 36:32]]

And at the close of Romans, the secretary adds a single sentence of his own. [[Romans 16:22]] Tertius is named. Romans remains Paul's. Paul even marked his genuine letters with his own hand. [[2 Thessalonians 3:17]]

That is a sound model for authorship in any age: name the helper, keep the author clear, and leave a mark only the author makes. Habakkuk received the instruction that underlies all good record-keeping. [[Habakkuk 2:2]]

HOW OUR OWN HOUSE KEEPS THE RECORD. This app is built with an artificial-intelligence coding tool, so the question is ours as well. Darrell's spoken teachings and decisions are the authored source, each written down with his name and the date, and the decision records now number more than thirteen hundred. The tool's contribution is named in the project's history, line by line, much as Tertius named himself. And the app's register of what PoeTech owns, under Books and then Legal, will not mark any work human-authored by default. It files the application code as human-directed and machine-expressed - the honest middle category - and records none of its holdings as purely generated.

THE HONEST WEIGHT. A long life teaches the cost of overstated claims. [[Proverbs 11:1]] [[Proverbs 12:22]] [[2 Corinthians 8:21]]

Claiming more of a shared work than one did is a false balance, however small the overstatement. And Solomon's counsel still holds. [[Proverbs 27:2]]

THE NEIGHBOUR'S LANDMARK. The newsletter's title paired copyright with copyleft. Copyleft licenses permit anyone to use and adapt code freely, on condition that what is built from it is shared on the same terms. It is a generous arrangement with a boundary.

Israel treated boundary stones with great seriousness. [[Proverbs 22:28]] [[Deuteronomy 19:14]] [[Deuteronomy 27:17]]

These tools have learned from enormous quantities of other people's work, and can carry fragments of it into ours. Where that work came with conditions, the conditions came too. Moving a neighbour's landmark is not made innocent because a machine did the moving. [[Luke 6:31]]

THE REPAIR LONG KNOWN. The second story concerned a serious flaw in PHP, a programming language behind a great share of websites. Its maintainers published a fix promptly. The newsletter reports that some organizations, including federal offices, were slow to apply it.

Every homeowner here has a version of this: the gutter, the step, the letter of apology. The Word speaks to it plainly. [[Proverbs 3:27]] [[Ezekiel 33:6]]

Solomon's walk past the neglected field is worth reading aloud. [[Proverbs 24:30]] [[Proverbs 24:31]] [[Proverbs 24:32]] [[Ecclesiastes 10:18]]

When Nehemiah rebuilt the wall, each household repaired what lay before its own door. [[Nehemiah 3:28]] And the knowing servant bears the heavier account. [[Luke 12:47]]

There is wisdom in waiting to test a fix. [[Proverbs 27:12]] But a prudent delay has a reason and a date; neglect has neither. And one cannot tend what one has not counted. [[Proverbs 27:23]]

WHAT A LIFETIME TEACHES ABOUT CREDIT. Those who have managed people know how much harm is done when credit is taken that belonged to someone else, and how much good is done when it is given freely and accurately. A workplace where the record is honest is one where people keep giving their best. A family where the story of how things were built is told truthfully is one where the next generation knows whom to thank.

You also know that the most capable people you worked with were rarely the ones who claimed the most. They were the ones who could tell you exactly what they had done, and who had done, and who were content to let the work speak. That is the spirit of Proverbs 27:2, and it is the spirit we want in a household that builds with new tools.

THE KEEPER OF ACCOUNTS. Many of you have kept the books, the keys or the records for an employer, a church or an aging parent. You know that the person who holds the records carries a particular duty: to know what is there, and to act on what is known. The watchman's charge in Ezekiel was not to fix every danger himself, but to see it and sound the warning. In a house full of devices, someone must count them and see that the known fixes are applied. If the young people in the house handle the tapping, let the elders handle the asking, faithfully and every week. There is no shame in not knowing where the settings are kept. There is only a choice about whether to ask.

THE AUTHOR AND FINISHER. All things were made by the Son and are held together in Him. [[Colossians 1:16]] [[Colossians 1:17]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne endures for ever, [[Hebrews 1:8]] the Author and Finisher who leaves nothing undone. [[Hebrews 12:2]]

So the prayer over any work, with any tool, is Moses' prayer. [[Psalm 90:17]]

THREE THINGS THIS WEEK.

First, name the hands. Choose one thing you made with help and write a sentence about who did what. Then tell a grandchild the story of how it was made.

Second, walk one landmark. Find one thing in your house used under someone else's terms - a borrowed book, a recording, a recipe - and honour the terms.

Third, apply one known fix. Ask someone younger to sit with you while every device in the house is counted and its waiting updates are installed. Write down any you postpone, with the reason and the date.

${BLOCKED.senior}

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.

WHO SENT THIS. On the twelfth of November 2026 at 17:31 UTC Darrell forwarded an IT Brew issue, subject line Copyright, copyleft, out of his university mailbox with ONE WORD typed above the forwarded header: Lesson. Gmail thread 1a1d0d054cd67ed2. His word is the ask; the newsletter is the occasion. The scheduled intake missed it and it was built by hand the next day.

THE WORD FIRST. 1 Corinthians 4:7 opens the hour - what hast thou that thou didst not receive - with Psalm 24:1 beside it, and James 4:17 sets the other half of the frame: to him that knoweth to do good and doeth it not, it is sin. Then eight movements: nothing in the house started with us; Bezaleel's skill was given and his name is still on the work; what the lawyer said and what is simply established; the scribe who signed his line and the letter that is still Paul's; the honest weight; the neighbour's landmark; the fix that was known; and the Author and Finisher.

OUR OWN HOUSE. PoeTech is written with an AI coding tool, so the hour applies at home. Darrell's spoken teachings and decisions are the authored source, dated and attributed; the tool is named on its work in the project history; and the app's IP register under Books and then Legal records the code as human-directed and machine-expressed, never human-authored by default.

TRUST BUT VERIFY. Read: the newsletter only. Refused or unresolved from this session: www.itbrew.com, www.copyright.gov, www.php.net and the law firm's newsroom. The lawyer's counsel is REPORTED as the newsletter carried it. ESTABLISHED and stated plainly: US copyright requires a human author. The security story's particulars - the finder, the year 2014, the share of websites, the slow offices - are the newsletter's account; a web search returned news summaries that agree a critical fix shipped in October and that the federal cybersecurity agency urged immediate patching, but those name other finders as well and none confirmed the date, so checking made those particulars LESS certain and the teaching rests on none of them. re-review: 2026-11-27.

LEFT OUT ON PURPOSE. The sponsor's advertisement, the jobs figure, the piece on small IT teams, the poll, the linked reads and the job board are not taught.

PLACEMENT. Sovereign A.I., week 81, because the hour is about what a household that builds with its own machines may honestly call its own, and what it owes the fixes it already knows about.`,
  inApp: `No new screens this week. One page in your Study, one honest note, and one round of updates.

In the app: open Sovereign A.I. week 81 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each holds the whole teaching. Use Search it out on 1 Corinthians 4, Exodus 31 and Romans 16 so the three passages sit side by side; the links come from the lesson's own references.

Then look at how this app keeps its own record. Open Books, then Legal, and find the IP register. Read the authorship column. You will see that nothing is marked human-authored by default, and that the application code is filed as human-directed and machine-expressed. That is the lesson in practice.

Away from the app, two exercises. Write two lines about one thing you made with a tool's help - what was mine, what the tool did. And count every device in your household, then install the updates that have been waiting. If you postpone one, write down why and the date.`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[1 Corinthians 4:7]] [[Psalm 24:1]] [[Exodus 31:3]] [[Habakkuk 2:2]] [[Romans 16:22]] [[Proverbs 11:1]] [[Proverbs 22:28]] [[James 4:17]] [[Proverbs 27:23]] [[Hebrews 12:2]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them lands on your own house.

First, read Exodus 31:1-11 whole. Notice how much of the passage is Yahweh giving - the Spirit, wisdom, understanding, workmanship - and how carefully it still records the names of the men who did the work. Write one sentence on how both can be true of something you have made.

Second, read the end of Romans, chapter 16, and find the one verse where someone other than Paul speaks. Then read 2 Thessalonians 3:17. Ask: in my own work, who holds the pen, and what is the token that shows whose work it is?

Third, read James 4:17 and then Proverbs 24:30-34. Make an honest list of the fixes you already know about - on your devices, in your house, in your relationships - that are still waiting.

And one verification reading, because this course works this way. The lawyer's counsel in this lesson is REPORTED as the newsletter carried it, because the full article would not open from our network. The rule that copyright needs a human author is ESTABLISHED and stated plainly. The details of the security story are the newsletter's account, and our search made some of them less certain, not more. Practice telling apart what was reported, what is established, and what nobody checked.`,
    plan: `PLAN. Decide two measures before the week starts, and decide who hears them.

One: the authorship note. Choose one thing you made with a tool's help, and decide when you will sit down and write two lines about it - what was mine, what the tool did. Put it on the calendar.

Two: the fix count. Name the day you will count every device in your household and install the updates that are waiting. Decide in advance that any update you hold back gets a reason and a date written beside it.

Then name the person who will ask you about both on the same day next week. A measure nobody asks about is a wish.

And decide what you will say to the young people in your house. The sentence is short: say which part is yours, and fix what you already know is broken.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.

Write the authorship note on the day you named. Two lines, plain. Read them to the person asking you about it.

Count the devices. Install the waiting updates. For any you hold back, write the reason and the date. Say out loud what you found - how many devices you had forgotten, how long some fixes had been waiting.

Teach the verse at a meal. What hast thou that thou didst not receive. Ask a child to say it back in their own words.

At the end of the week, answer three questions to the person who is asking. What did I make that I could now describe honestly? Which fix had I known about the longest? And which landmark - someone else's work under someone else's terms - did I find in my own house?

Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a technology newsletter, answered from the Word rather than from the article, and built the day after the scheduled intake missed it.`,
    `The hour opened by 1 Corinthians 4:7, so the ownership question is asked under the deeper one: what do we have that we did not receive?`,
    `Psalm 24:1 laid down first, so every later word about owning is heard as stewardship rather than possession.`,
    `Deuteronomy 8:17-18 placed where success tempts us to forget that the power to produce was itself given.`,
    `Bezaleel taught as the pattern for working with any given capability: the skill came from above, and his name is still on the work.`,
    `Exodus 36:1 kept in, so the record that names the craftsmen is read alongside the gift that made them able.`,
    `Habakkuk 2:2 set beside the lawyer's counsel, so documenting authorship is understood as writing the vision plain.`,
    `Jeremiah and Baruch, and Paul and Tertius, used to show honest shared authorship: the helper named, the author clear.`,
    `2 Thessalonians 3:17 read as the token in every letter, the mark only the author makes.`,
    `The app's own practice traced on the real record: dated decisions, captured spoken teachings, and a tool named on its work in the project history.`,
    `A measured figure instead of a painted one: 1,895 of 2,980 commits on the main line carry a co-author line naming the tool.`,
    `The IP register in Books then Legal shown as the in-app place this lesson already lives, refusing a default of human authorship.`,
    `Proverbs 11:1 applied in both directions, so overstating one's share is named as plainly as boasting.`,
    `The project's own license quoted for its honest limit: rights reserved only to the extent they exist.`,
    `Copyleft explained in one plain sentence, so the newsletter's title word is understood rather than skipped.`,
    `The landmark verses applied to inputs: what came in under someone else's terms carries those terms with it.`,
    `Luke 6:31 set at the boundary, so honoring another's terms is taught as love and not as compliance.`,
    `James 4:17 made the whole second story: a published fix that sits unapplied is the good that was known and not done.`,
    `Proverbs 27:12 kept beside it, so testing before patching is honored and drift is not excused.`,
    `Proverbs 24:30-32 and Ecclesiastes 10:18 used to show that walls fall from neglect, not only from attack.`,
    `Nehemiah 3:28 brought home: every family repaired the wall in front of its own house first.`,
    `Proverbs 27:23 made practical: count the devices before you claim they are patched.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, the Author and Finisher whose work is never in question.`,
    `The reported, the established and the unchecked told apart in every reader place, with the shut roads named and a dated re-review.`,
    `A checking pass that made some newsletter particulars LESS certain, and said so, instead of passing them on as fact.`,
    `All four age bands carried from the first commit, each written for its own reader.`,
    `Three household actions that cost nothing: name the hands, walk one landmark, apply one known fix.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The quilt with two names on the label',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A grandmother made quilts for forty years, and in her last years her hands would not do the fine stitching any more. Her granddaughter had a sewing machine that could follow a pattern on its own, and together they made one more quilt. The grandmother chose every fabric, laid out every block on the living-room floor, and moved them around for a week until the pattern was right. The machine did most of the stitching.

When it was finished, the granddaughter wanted to sew a label on the back with only her grandmother's name. It seemed kind.

The grandmother said no. She asked for a label that said what was true: designed and pieced by her, stitched with her granddaughter and the machine, and the year.

The granddaughter asked why it mattered. The grandmother said that a label is a promise to whoever owns the quilt after both of them are gone. If it says more than happened, the next person cannot trust the other labels either.

The quilt hangs in a church fellowship hall now. People read the label. Nobody thinks less of it. Several people have said it is the most honest thing in the room.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The latch that was going to be fixed on Saturday',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A family had a gate latch that did not catch properly. Everyone in the house knew. You had to lift the gate and push it just so. The new latch was bought and sat in its package on the shelf in the garage, and the screws were in a jar beside it.

It was going to be fixed on Saturday. It was going to be fixed on Saturday for most of a spring.

Nothing happened for weeks, which is the part that made it last. Then one evening the latch did not catch, and the dog was gone. They found her two streets over, unhurt and very pleased with herself, and everyone was so relieved that the fixing was put off again.

What finally ended it was the youngest child. She was nine. She asked at dinner why they had a new latch if they were not going to use it. Nobody had a good answer. Her father said they were busy. She said the latch only took ten minutes, because she had read the back of the package.

He fixed it that night, with a flashlight, with her holding the screws. It took eleven minutes.

Afterward he said the hard part had never been the latch. The hard part was admitting that knowing about it had made it his.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'What three questions does Paul ask in 1 Corinthians 4:7?',
        options: [
          'Who are you, where are you going, and why',
          'Who makes you differ, what do you have that you did not receive, and why boast as if you had not received it',
          'Who taught you, who paid you, and who will remember you',
        ],
        answer: 1,
        explain: 'All three turn on one point: everything we hold was received. That does not make ownership meaningless; it makes it stewardship.',
      },
      {
        q: 'In Exodus 31:2-3, where did Bezaleel’s skill come from, and was his name kept on the record?',
        options: [
          'He trained himself, and his name was left out',
          'Yahweh filled him with it, and the record still names him by father, grandfather and tribe',
          'He inherited it, and only his tribe is named',
        ],
        answer: 1,
        explain:
          'Both are true together. The gift came from above, and the hands that worked were real hands whose names Scripture keeps. That is the pattern for working with any given capability.',
      },
      {
        q: 'What does Romans 16:22 show about shared authorship?',
        options: [
          'That Tertius was the real author of Romans',
          'That the scribe named himself, and the letter was still Paul’s',
          'That Paul never wrote letters himself',
        ],
        answer: 1,
        explain: 'The helper is named and the author is clear. Paul even explains in 2 Thessalonians 3:17 that his own hand is the token in every letter.',
      },
      {
        q: 'Which statement about US copyright does this lesson state plainly as established?',
        options: [
          'That machine-written code is always protected',
          'That a work needs a human author to be protected',
          'That nobody knows whether a human author is required',
        ],
        answer: 1,
        explain:
          'That is the Copyright Office’s standing position, and the app’s own register was built on it. What remains open is how much human contribution is enough in a given work, not whether a human is required.',
      },
      {
        q: 'How does this app record its own code in the IP register under Books then Legal?',
        options: [
          'As human-authored, by default',
          'As human-directed and machine-expressed, the honest middle category, with no default allowed',
          'It does not record the code at all',
        ],
        answer: 1,
        explain:
          'The register refuses a default of human authorship and files the application source in the middle category, with a note that it must be sorted before anything is filed.',
      },
      {
        q: 'Why is Proverbs 11:1 used in this lesson?',
        options: [
          'To warn only against cheating customers',
          'To show that overstating your own share of a shared work is a false balance',
          'To teach how to price software',
        ],
        answer: 1,
        explain:
          'A false balance weighs wrong in either direction. Claiming more of the work than you did is as much a false weight as claiming less of someone else’s.',
      },
      {
        q: 'What is copyleft, as this lesson explains it?',
        options: [
          'A license that forbids all copying',
          'A license that lets anyone use and change code freely, on condition that what is built from it is shared on the same terms',
          'A tax on software',
        ],
        answer: 1,
        explain:
          'It is generous and it has a boundary. The landmark verses (Proverbs 22:28; Deuteronomy 19:14) teach that someone else’s boundary is not moved because a machine moved it for you.',
      },
      {
        q: 'In James 4:17, who is said to sin?',
        options: ['Only the one who does evil on purpose', 'The one who knows to do good and does not do it', 'The one who did not know the rule'],
        answer: 1,
        explain: 'That is why a published fix left unapplied is not a technical delay but a choice. Waiting can be wise, but it needs a reason and a date.',
      },
      {
        q: 'What broke down the stone wall in Proverbs 24:31?',
        options: ['An enemy army', 'Neglect - it was simply left', 'An earthquake'],
        answer: 1,
        explain:
          'The field belonged to the slothful man. Nobody attacked the wall; it fell from being left alone. Ecclesiastes 10:18 says the same of a house.',
      },
      {
        q: 'What does this lesson say about the details of the security story in the newsletter?',
        options: [
          'That each one was confirmed at its source',
          'That the full article would not open from our network, so the finder, the 2014 date, the share of websites and the slow offices are the newsletter’s account, with a dated re-review',
          'That the story was false',
        ],
        answer: 1,
        explain:
          'A web search returned news summaries agreeing that a critical fix shipped in October, but they name other finders as well and none confirmed the date. So checking made some particulars less certain. The teaching rests on James 4:17, not on any of them. re-review: 2026-11-27.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read 1 Corinthians 4:7 aloud before you say one word about any law or any computer. Then read James 4:17 aloud. Then ask the room one question and wait: what do you have that you were not given?

MINUTES 0 TO 10 - WHAT WE RECEIVED. Psalm 24:1, 1 Corinthians 4:7, Deuteronomy 8:17-18, James 1:17, 1 Chronicles 29:14. Let the room name gifts they did not earn. Do not rush this; it is the foundation.

MINUTES 10 TO 20 - THE CRAFTSMAN. Exodus 31:2-6 and Exodus 36:1. Make the point carefully: the skill was given and the name is still recorded. Both. Ask what the equivalent is when a person works with a tool.

MINUTES 20 TO 30 - THE SCRIBE AND THE RECORD. Habakkuk 2:2, Jeremiah 36:4 and 36:32, Romans 16:22, 2 Thessalonians 3:17. Then say what the newsletter reported, and say it is reported - the lawyer's counsel as the newsletter carried it. Then say the established part plainly: copyright needs a human author. Then show how this app keeps its own record: the IP register under Books then Legal, the dated decisions, the tool named on its work.

MINUTES 30 TO 40 - THE HONEST WEIGHT AND THE LANDMARK. Proverbs 11:1, 12:22, 27:2, 2 Corinthians 8:21. Then explain copyleft in one sentence and read Proverbs 22:28, 23:10, Deuteronomy 19:14, 27:17 and Luke 6:31.

MINUTES 40 TO 52 - THE FIX THAT WAS KNOWN. James 4:17 again, Proverbs 3:27, Ezekiel 33:6, Proverbs 24:30-32, Ecclesiastes 10:18, Nehemiah 3:28, Luke 12:47, Proverbs 27:12, Proverbs 27:23. Say the verification note BEFORE any detail of the security story: the full article would not open, the details are the newsletter's, and a search made some of them less certain. Then the teaching, which rests on none of them: a known fix not applied is a choice.

MINUTES 52 TO 60 - THE AUTHOR AND FINISHER, AND THE CLOSE. Colossians 1:16-17, John 1:29, John 3:16, Hebrews 1:8, Hebrews 12:2, Psalm 90:17. Give the three household actions and close with the talk-together directions.

WHAT NOT TO DO. Do not turn this into a legal seminar or give anyone legal advice; the room needs the Word and an honest habit. Do not stage two schools of opinion about artificial intelligence and let the room pick a side; teach the Word and work it (DR-0098). Do not hedge the established part into nobody-knows - a human author is required, and saying otherwise is false (DR-0100). And do not repeat a detail of the security story as fact; it is the newsletter's account.`,
    talkingPoints: [
      `The title deed to the earth is already written, and the name on it is Yahweh's (Psalm 24:1). Ownership among us is stewardship.`,
      `1 Corinthians 4:7 asks three questions, and all three turn on one fact: everything we hold was received.`,
      `Moses warned that success is the moment we forget the power to produce was given (Deuteronomy 8:17-18).`,
      `Bezaleel's skill was given by Yahweh, and Scripture still records his name, his father, his grandfather and his tribe.`,
      `Gift and labour are both honoured in Exodus 31 and 36. Neither cancels the other.`,
      `A tool is a given thing. The human who directs, chooses, corrects and decides is doing real work, and it should be named.`,
      `The lawyer's counsel is reported as the newsletter carried it; the full interview would not open from our network.`,
      `Established and stated plainly: in the US a work needs a human author to be protected by copyright.`,
      `The open legal question is how much human contribution is enough, not whether a human is required.`,
      `Habakkuk 2:2 is the oldest instruction for documentation: write it, make it plain, make it readable at a run.`,
      `Jeremiah's words, Baruch's pen, and the record says both (Jeremiah 36:4).`,
      `Tertius names himself in Romans 16:22, and nobody has ever thought Romans was his letter.`,
      `Paul's own hand was the token in every letter (2 Thessalonians 3:17) - the mark only the author makes.`,
      `This app's record: spoken teachings and decisions dated and attributed to Darrell, and the tool named on its work in the project history.`,
      `Measured: 1,895 of 2,980 commits on the main line carry a co-author line naming the tool.`,
      `The IP register refuses a default of human authorship and files the code as human-directed and machine-expressed.`,
      `Overstating your share is a false balance (Proverbs 11:1), as much as boasting is.`,
      `The project's license reserves rights only to the extent they exist. That is the honest sentence.`,
      `Copyleft lets anyone use code freely on condition that what is built from it is shared on the same terms.`,
      `A landmark moved by a machine is still a moved landmark (Proverbs 22:28; Deuteronomy 27:17).`,
      `James 4:17 is the whole second story: the good that is known and not done.`,
      `Testing a fix before applying it is prudence (Proverbs 27:12). Drift is not.`,
      `A delay with a reason and a date is stewardship. A delay without one is the broken wall of Proverbs 24:31.`,
      `Nehemiah's builders repaired the wall in front of their own houses first (Nehemiah 3:28).`,
      `You cannot patch what you have not counted (Proverbs 27:23).`,
      `Jesus is the Lamb of Yahweh and the Eternal Son, the Author and Finisher whose work is never in question (Hebrews 12:2).`,
    ],
    discussionPrompts: [
      `What is something you made that you are proud of, and who or what helped you make it?`,
      `When you have used a tool to help with work - writing, school, a job - how did you tell people which part was yours?`,
      `Where have you been tempted to claim more of a shared work than you actually did? Where have you claimed less than was fair?`,
      `What is one thing in your house that belongs to someone else under their terms, and do you know what the terms are?`,
      `Which fix have you known about the longest without making it? What has the waiting cost?`,
      `If you counted every device in your household tonight, how many do you think you would find that you had forgotten?`,
    ],
  },
  lesson: LESSON.join('\n\n'),
  levels: { child: CHILD, youth: YOUTH, teen: TEEN, senior: SENIOR },
};

// -----------------------------------------------------------------------------
// Fill, then DERIVE the anchor from the placeholders that occur in reader places
// -----------------------------------------------------------------------------
const filled = fillDeep({ ...MODULE, anchor: { ...MODULE.anchor, ref: '' } });

readerRefs.length = 0;
seenReader.clear();
filled.bigIdea = fill(MODULE.bigIdea, true);
filled.inApp = fill(MODULE.inApp, true);
filled.lesson = fill(MODULE.lesson, true);
filled.levels = {
  child: fill(CHILD, true),
  youth: fill(YOUTH, true),
  teen: fill(TEEN, true),
  senior: fill(SENIOR, true),
};
filled.anchor.theme = fill(MODULE.anchor.theme);
filled.anchor.ref = readerRefs.join('; ');

// -----------------------------------------------------------------------------
// Refuse to splice a lesson that fails its own measures
// -----------------------------------------------------------------------------
const { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } = await import('../app/src/__tests__/fixtures/four-band-ladder.js');
const adultWords = words(filled.lesson);
console.log(`sov81: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov81: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov81: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov81: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov81: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov81: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov81: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov81: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov81: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov81: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov81: the id survived the excision; refusing to rebuild');
}

const block = JSON.stringify(filled, null, 2)
  .split('\n')
  .map((l) => `  ${l}`)
  .join('\n');
const tailHasComma = /\}\s*,\s*$/.test(src2.slice(0, end2));
const next = tailHasComma ? `${src2.slice(0, end2)}\n${block},${src2.slice(end2)}` : `${src2.slice(0, end2)},\n${block}${src2.slice(end2)}`;

const weeks = (text) => [...new Set([...text.matchAll(/sov(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src2);
const after = weeks(next);
if (after.length !== before.length + 1) throw new Error(`sov81: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov81: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov81: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov81: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov81: spliced ${ID}`);
console.log(`sov81: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov81: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
