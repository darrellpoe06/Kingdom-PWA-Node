// =============================================================================
// sov86-fill - build Sovereign A.I. week 86 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[Daniel 1:8]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory. The reference list on the module's
// anchor is DERIVED from the placeholders that actually occur in the reader
// places, so anchor.ref names every verse the lesson stands on and nothing it
// does not (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-11-06 at 20:46:35 UTC (2:46 PM CST)
// Darrell forwarded the TLDR daily digest of that morning (subject: Anthropic
// IPO doubts, datacenter bans, GitHub's new storage) out of his university
// mailbox into the lesson lane with ONE WORD typed above the forwarded header:
// Lesson. Gmail thread `1a1b29d09bf45870`. The scheduled intake fell behind;
// this build drains that backlog on 2026-11-13.
// scripts/lesson-already-built.mjs --thread 1a1b29d09bf45870: NOTHING FOUND.
//
// ONE TEACHING FROM A DIGEST (the KNOWN_SHARED_THREADS note on TLDR digests in
// scripts/one-thread-one-record-guard.mjs). Fourteen editorial items and four
// sponsor blocks. The LEAD (the maker's planned IPO and investors who expect
// the valuation to come down) is the price-of-a-promise and the
// value-that-is-a-forecast this course already taught in sov78 and sov79, so it
// is named and not retaught. The teaching taken is the one the course has not
// given: a three-sentence summary of a long profile of the same company's chief
// executive reporting that rationalism and effective altruism "form the
// foundation" of the company. Every tool has a maker and every maker has a
// mind; the steward's question is whose PATTERN the house is built on. Word
// first on 1 Chronicles 28:11-12, 19 (the pattern in writing from Yahweh's
// hand), Colossians 2:8 and 1 Corinthians 3:10-11.
//
// DISCLOSURE (the brief's binding instruction for an item that concerns
// Anthropic). This app is built with an A.I. tool Anthropic makes, and this
// lesson was drafted with it. Every teaching place says so before the digest
// is described, and the lesson is held to a stricter rule because of it:
// nothing about the company or any person is praised or blamed beyond what was
// reported; the person is never named in a reader place; the Word's posture
// toward careful thought and doing good is taught as COMMENDED (Isaiah 1:18;
// Proverbs 14:15; Galatians 6:10) before the warning is taught; and the
// teaching is applied to every maker, the local open models included.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100 / DR-0076 section 8). The profile was
// NOT read. A web search returned secondary listings naming The New York Times,
// 2026-11-05, as its publisher, and reporting second-hand that the chief
// executive said in 2023 he does not consider himself an effective altruist;
// the one copy tried (a repost host) did not resolve from this session's
// network, and no further hosts were tried. The IPO figures are the digest's
// report of what investors expect. All of it is told as REPORTED, never as
// fact. re-review: 2026-11-27 -- read the profile from a runner and compare.
//
// MEASURED ON OUR OWN HOUSE (not painted), on origin/main 152cfb3b302:
//   CLAUDE.md:106, :114   The Source of Answers: the agent does NOT improvise
//        theology and does NOT cite training-data theology as if canonical;
//        when unsure it surfaces the uncertainty
//   CLAUDE.md:372          The human governs the bright lines
//   app/src/__tests__/the-author-never-types-a-verse.test.js  the gate that
//        fails a hand-typed verse; this script fills from app/public/bible/kjv
//   app/src/lib/llm-providers.js:280-292  the maker's model: sovereign false,
//        cost high, reserved for work the local tier cannot do well
//   app/src/lib/llm-providers.js:296, :312, :324  two other makers' slots, so
//        the router is not bound to one company
//   app/src/lib/llm-providers.js:12, :200-258  local engines on church GPU nodes
//   app/src/lib/ai-usage-ledger.json  149 entries before this one, every one
//        naming a tool from the same maker
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 86;
const ID = 'sov86-all-the-works-of-this-pattern';
const TITLE =
  'All the works of this pattern - the maker behind the tool, the skilled hands from Tyre at the temple, and the pattern that came in writing from Yahweh';

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
  if (!m) throw new Error(`sov86: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov86: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov86: reference does not resolve in the corpus -> "${ref}"`);
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
// still gets the disclosure, the shut road, the date and the frame (DR-0795).
// -----------------------------------------------------------------------------
const DISCLOSE = {
  lesson:
    'A DISCLOSURE, BEFORE ANY NEWS. This app is built with the help of an A.I. tool made by a company called Anthropic, and this lesson was drafted with that same tool. Two items in this week\'s digest are about that company. So it is said plainly first, and the lesson is held to a stricter rule because of it: nothing about the company or anyone in it is praised or blamed beyond what was reported, and everything taught here applies to every maker of every tool, including the ones this house runs instead.',
  child:
    'A DISCLOSURE. That means telling the truth about yourself first. Here it is. People who build our app use a computer helper. It is made by a company called Anthropic. This lesson was written with that helper too. The news this week was about that same company. So we tell you that first. We will not say good or bad things about them that we do not know.',
  youth:
    'A DISCLOSURE. Before the news, here is something you should know. Our app is built with help from an A.I. tool made by a company called Anthropic. This lesson was written with that same tool. And this week the news was about that same company. So we say it first. We will not praise them or blame them for anything beyond what was reported. And what we teach is true of every company that makes tools, not just this one.',
  teen: 'A DISCLOSURE. You should know this before anything else. Our app is built with help from an A.I. tool made by a company called Anthropic. This lesson was drafted with that tool. Two items in this week\'s news were about that company. That is a reason to be more careful, not less. So we will not praise or blame the company, or anyone in it, past what was reported. And the lesson applies to every maker of every tool.',
  senior:
    'A DISCLOSURE, STATED BEFORE THE NEWS. This app is built with the assistance of an A.I. tool made by a company called Anthropic, and this lesson was drafted with that same tool. Two items in the week\'s digest concern that company. A teacher with that relationship owes the class two things: to say it at the start, and to hold the lesson to a stricter standard because of it. Nothing about the company or anyone in it is praised or blamed beyond what was reported, and the teaching is applied to every maker, including those whose tools this house runs instead.',
};

const BLOCKED = {
  lesson:
    'WHAT WE DID NOT CHECK AT THE SOURCE. The digest gave three sentences about a profile it lists as a twenty-minute read, and we did not read the profile. Search listings we could see but not open name The New York Times, on the fifth of November 2026, as its publisher; the one copy we tried to open was refused from our network. Those same listings report, second-hand, that the chief executive said in 2023 that he does not count himself an effective altruist. We did not check that either, and it is set here so that a reported claim about a person is never told as more than it is. The figures about the planned sale of shares are the digest\'s report of what investors expect, not facts about any sale, and they are not taught. A shut road must never read like a verified fact. re-review: 2026-11-27.',
  child:
    'WHAT WE DID NOT CHECK. The news only gave us a few lines about a long story. We did not get to read the long story. Our computer could not open it. Some other pages said it came from a big newspaper, The New York Times. Those pages also said the boss of the company once said he does not call himself one of those thinkers. We did not check that. So we only tell you what was reported, and we say so. We will try again. re-review: 2026-11-27.',
  youth:
    'WHAT WE DID NOT CHECK. The digest gave only three sentences about a long article, and we did not read the article. Other pages we found say it was printed in The New York Times on November 5, but our network could not open a copy. Those pages also say that the company\'s leader said in 2023 that he does not count himself an effective altruist. We did not check that either. So everything here about the company is what was reported, not what we proved. re-review: 2026-11-27.',
  teen: 'WHAT WE DID NOT CHECK. Be clear on what we read. We read three sentences in a digest. We did not read the profile they came from. Search results we could not open say it ran in The New York Times on November 5. The copy we tried was blocked on our network. Those results also report that the leader said in 2023 he does not count himself an effective altruist. We did not check that. And the money figures were what investors expect, not facts. So all of it stays in the reported pile. re-review: 2026-11-27.',
  senior:
    'WHAT WE DID NOT CHECK AT THE SOURCE. What we hold is the digest\'s three-sentence summary of a profile it describes as a twenty-minute read; the profile itself was not read. Search listings that could be seen but not opened name The New York Times, 5 November 2026, as its publisher, and the one copy attempted was refused from our network. The same listings report, second-hand, that the chief executive said in 2023 that he does not regard himself as an effective altruist. That is unverified here, and it is recorded precisely so that a reported claim about a person is not allowed to harden into a verdict. The share-sale figures are the digest\'s account of investors\' expectations and are not taught. A shut road must never read like a verified fact. re-review: 2026-11-27.',
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - when you ask a phone, a search box or a chat helper something important, how do you know whether the answer is true - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Acts 17:11. Children, ask your mother, your father or a grandparent about a time they learned something from a teacher or a book they did not agree with, and what they kept and what they left; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what is one thing in our homes that no tool will ever decide for us. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - if a computer told you something about Yahweh, how would you check it - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Proverbs 3:5. Children, ask your mom or your dad or your grandma or your grandpa who taught them about Jesus. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what are the tools in our homes, and who made them. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - which apps or helpers do you ask questions of, and do you know who made them - and listen all the way to the end before you correct anything; have them retell the answer in their own words, then teach them one verse, Daniel 1:8. Children, ask your mom, your dad or a grandparent about a school or a job where they had to learn from people who did not share their faith, and how they kept it; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: what is one answer a tool gave us that we should check in the Bible. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when a tool gives you an answer about right and wrong, whose answer is it really - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Colossians 2:8. Children, ask your mom, your dad or a grandparent about a time a smart, kind person told them something about life that turned out not to fit the Word, and how they noticed; hear all of it before you reply, then retell their answer in your own words. Then ask a friend this: which of our habits did we get from an app without ever deciding it. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - which tools do you trust most, and what would make you stop trusting one - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, 1 Chronicles 28:19. Children, ask your parents or your grandparents about the books, teachers or programs that shaped how they think, and which of them they had to set down; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: where in our two households has a tool quietly become the pattern, and what should take its place. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no detail from the digest stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the sixth of November 2026, at 2:46 in the afternoon Central time, Darrell forwarded a daily technology digest out of his university mailbox into this lane, with ONE WORD typed above the forwarded header: Lesson. That word is the ask. The digest is only the occasion, and no article is the foundation of an hour in this course. The lane that should have built it that day fell behind, and it was built by hand from the backlog a week later.

THE WORD FIRST, BEFORE ANY HEADLINE. When David handed the building of the temple to his son, he handed him two things, and Scripture keeps them apart. First, the plan of every room: [[1 Chronicles 28:11]] [[1 Chronicles 28:12]] Then, where the plan came from: [[1 Chronicles 28:19]] The pattern was not David's invention, and it was not the builders'. It came in writing, from Yahweh's own hand. Paul names the danger on the other side of that line: [[Colossians 2:8]] And he names the one foundation no builder may swap for another, with a warning to everyone who builds on it: [[1 Corinthians 3:10]] [[1 Corinthians 3:11]]

Hold those, and then hear the news.`,

  DISCLOSE.lesson,

  `WHAT THE DIGEST HELD, AND THE ONE WE TOOK. The digest was TLDR, a daily summary of technology news. Beside its advertisements it carried fourteen items: a cheaper rocket engine, a cell built from lifeless parts that can copy itself, a new way to store code for thousands of A.I. agents working at once, a flaw that let attackers into some Linux machines, and more. It led with the maker's planned sale of shares to the public, and with investors who said its expected value would likely need to come down. This course has already taught the price of a promise and the value that is only a forecast, in weeks seventy-eight and seventy-nine, so that is named here and not taught again.

The item that offers a teaching this course has not given is a short summary of a long profile of the same company's chief executive. As the digest reported it, two schools of thought sit at the heart of his worldview - rationalism, which tries to think about the world without passion, and effective altruism, which tries to do the most good it can, measured with mathematical precision - and these form the foundation of the company. That is the whole of what we hold: three sentences, reported, not checked. But it raises the question every household that uses these tools has to answer. Every tool comes from a maker, and every maker has a mind. Whose pattern is your house built on?`,

  `MOVEMENT ONE: THE SKILLED HANDS AND THE PATTERN. Solomon did not pretend Israel could do everything. He wrote to the king of Tyre and said so: [[1 Kings 5:6]] He named his need, he let the other side set the wage, and he put his own servants to work beside theirs. Then he brought in a master craftsman from outside: [[1 Kings 7:13]] [[1 Kings 7:14]] The king of Tyre described the man's range this way: [[2 Chronicles 2:14]] Able to find out every device put to him. That is a fair description of a good tool.

And still the skilled hands did not supply the plan. The pattern was already written. The rule Moses received at the tabernacle held at the temple too: [[Exodus 25:40]] and the letter to the Hebrews repeats it for every builder after: [[Hebrews 8:5]] The craftsman's bronze was good, and it was paid for honestly. It was good because it served a pattern he did not write.`,

  `MOVEMENT TWO: DANIEL'S TABLE. Daniel lived inside a mind that was not Israel's. He was chosen to be taught everything Babylon knew: [[Daniel 1:4]] He did not refuse the school. He learned its learning and its language, well enough to serve its kings for most of his life. But on one point he drew a line: [[Daniel 1:8]] He purposed in his heart. The learning was Babylon's; the table was his. And notice where his understanding finally came from: [[Daniel 1:17]] The outcome was not that he knew less than the palace. It was this: [[Daniel 1:20]] A tool is like the palace school. Learn it well. Use it faithfully. Keep your table.`,

  `MOVEMENT THREE: WHAT THE WORD COMMENDS, AND WHAT IT REFUSES. This is where a lesson like this can go wrong, so go slowly. Careful thinking is not the enemy. Yahweh Himself invites it: [[Isaiah 1:18]] And Proverbs praises the person who weighs a thing before believing it: [[Proverbs 14:15]] Wanting to do the most good is not the enemy either: [[Galatians 6:10]] Whatever any profile says about any person, those two desires are not what Paul warns against. What he warns against is a philosophy becoming the foundation in Christ's place - the tradition of men set where the Rock belongs.

And Paul shows why even the best reasoning and the largest giving cannot be the foundation: [[1 Corinthians 13:2]] [[1 Corinthians 13:3]] All knowledge, and nothing without Love. All goods given away, and no profit without Love. Love is senior to every calculation. So the Word's posture is not suspicion of thinking, and it is not a contest of camps for you to judge. It is this: [[Proverbs 3:5]] [[Proverbs 3:6]]

The same is true of every maker. The other companies whose tools sit beside this one have their own aims. The open models this house runs on its own machines were trained by companies too, with their own priorities. No tool comes from nowhere. The question is never whether a maker has a mind. It is whether that mind is allowed to become your pattern.`,

  `MOVEMENT FOUR: TRY THE SPIRITS - KNOW THE MAKER, CHECK THE ANSWER. A tool answers out of what it was taught and how it was tuned, and the people who tuned it chose what it should care about. That is not a scandal; it is how every tool is made. It means a household must do with a machine what John told the church to do with every voice: [[1 John 4:1]] [[1 Thessalonians 5:21]] And the Bereans show the practice: [[Acts 17:11]] They did not refuse Paul. They checked him, daily, against the Scriptures. Do the same with any answer a machine gives you about faith, about right and wrong, or about what a person is for.`,

  `MOVEMENT FIVE: OUR OWN HOUSE, MEASURED. This house is not free of the maker. It is built with its tool every day, and the record in this repository says so plainly: when this lesson was built, every one of the roughly one hundred and fifty entries in the house's own log of A.I. work named a tool from that same company. So the question is not whether we use it. It is whose pattern the work follows, and the house has written its answer down in four places.

First, the rules every working session loads before it does anything say where answers come from: the worldview drawn from Scripture is the source, and the tool is told not to improvise theology and not to treat what it learned in training as if it were the authority. When it is unsure, it must say so rather than invent certainty.

Second, no verse in this lesson came from the tool's memory. Every quotation was filled by a script from the King James text stored inside the app, and a check in the build fails any lesson whose verse was typed by hand instead of drawn from that text. The skilled hands do the work; the Word comes from the Word.

Third, the app's own list of A.I. engines marks that maker's model as not sovereign, sets its cost as high, and reserves it for work the local engines cannot do well. The same list keeps places for two other companies, so the house is not bound to one, and it lists open engines that run on the church's own computers.

Fourth, a person decides. The tool advises and shows its evidence; Darrell governs. The craftsman from Tyre did not choose the plan, and neither does the machine.`,

  `MOVEMENT SIX: THE TRUTH IS A PERSON. Bring it home. Every school of thought, ancient or new, is a method for reaching truth. Jesus did not offer a method: [[John 14:6]] And He promised a Guide who does not speak on His own authority: [[John 16:13]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] the One by whom every maker, and everything any maker makes, was made, and in whom all of it holds together: [[Colossians 1:16]] [[Colossians 1:17]] The pattern is His. The foundation is already laid. Our part is to build on it with whatever good tools we are given, and to take heed how we build.`,

  `THREE THINGS THIS WEEK, and none of them needs a purchase.

One, name the makers. Write down every tool your household asks questions of - a search engine, a chat assistant, a school curriculum, a news app - and beside each one, who made it and what they say it is for.

Two, check one answer. Take one answer a tool gave you this month about faith, about right and wrong, or about what people are for, and search the Scriptures for it the way the Bereans did.

Three, keep one table. Decide one thing in your house the tool will never decide - what you teach your children about Yahweh, how you pray, whom you forgive - and say it out loud together.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that the maker is wicked, or the tool forbidden, or careful thought and generous giving wrong. The bronze from Tyre was good. Daniel's learning was real. The point is the order of things: use the skill, keep the pattern, and let no philosophy - anyone's, ours included - stand where Christ stands.`,

  BLOCKED.lesson,

  TALK.lesson,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader, not a
// re-registering of the adult text, and each carries the whole teaching, the
// disclosure, the shut road and the talk-together close (DR-0795).
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

ONE BIG QUESTION. Who made the tools we use? And who gets to make the plan? That is what this lesson is about.

WHO SENT THIS. Darrell got an email full of news about computers. He wrote one word on top of it. The word was Lesson. Then he sent it to us. That one word is why you are reading this.

THE WORD FIRST. King David had a big job for his son Solomon. Solomon was going to build a house for Yahweh. David gave him a plan. Here is where the plan came from. [[1 Chronicles 28:19]]

Look at that. The plan did not come from David's head. Yahweh gave it. He wrote it down for them.

Paul tells us to be careful about plans that come from people instead. [[Colossians 2:8]]

And he tells us what the most important part of any house is. [[1 Corinthians 3:11]] Jesus is the ground we build on.

${DISCLOSE.child}

THE NEWS. The email came from a news letter called TLDR. It tells people about new things in computers. It had lots of stories. One story was about the boss of the company that makes our helper. It said he likes two big ideas. One idea is to think very carefully. The other idea is to do as much good as you can, and to count it with numbers. The story said those ideas are at the bottom of his company, like a floor. That is what was reported. We did not get to read the whole story.

So here is our question. Every tool has a maker. Every maker has ideas. Whose plan do we follow?

THE MAN FROM TYRE. When Solomon built Yahweh's house, he needed help. His people did not know how to cut big trees the best way. So he asked a king from another land. [[1 Kings 5:6]] He paid them fairly. Then he got a man named Hiram, who was very good with metal. [[1 Kings 7:14]]

Hiram made beautiful things. But Hiram did not make the plan. The plan was already written by Yahweh. Hiram used his skill to follow it.

Our computer helper is a bit like Hiram. It is very good at some jobs. But it does not make our plan.

DANIEL'S FOOD. Daniel was a boy who was taken far from home. The king put him in a school. [[Daniel 1:4]] Daniel learned all of it. He was a good student. But there was one thing he would not do. [[Daniel 1:8]] He would not eat the king's food. He kept his own table.

And then look at what Yahweh did. [[Daniel 1:17]]

Daniel learned the school's lessons. But he kept his own heart. We can do that too.

THINKING IS GOOD. Is it bad to think hard? No! Yahweh says, Come and let us reason. [[Isaiah 1:18]] Is it bad to do good things? No! [[Galatians 6:10]] Thinking and helping are good.

But there is something more important. [[1 Corinthians 13:2]] Love is the most important thing. Love comes first. That is why we trust Yahweh most of all. [[Proverbs 3:5]]

EVERY MAKER. This is true of every tool, not just one. Every app and every game and every helper was made by someone. They all have ideas. So we ask who made it.

CHECK IT. Long ago, some people heard Paul teach. They did something smart. [[Acts 17:11]] They looked in the Bible to see if he was right. We can do that too. If a helper tells you something about Yahweh, check it in the Bible.

OUR APP. Our app has some rules about this. The helper is not allowed to make up things about Yahweh. Every Bible verse in our app comes from a real Bible kept inside the app. A computer test checks that no one typed a verse from memory. And a real person, Darrell, makes the big choices. The helper does the work. Yahweh gives the plan.

A STORY TO HELP YOU THINK. This story is made up. It did not really happen.

Mia wanted to build a tree house with her dad. Her neighbor, Mr. Lee, had lots of tools. He let them use his saw and his drill. They were very good tools.

But Mia's dad did not ask Mr. Lee where to put the tree house. He did not ask him how big to make it. He and Mia had already drawn the plan on paper. It was taped to the fridge.

Mia asked, Why not use Mr. Lee's plan? Dad smiled. He said, His tools are great. But this is our tree house. We follow our plan.

When it was done, Mia carried the saw back to Mr. Lee. She said thank you. He said, I like what you built. Mia was happy. Good tools helped. The plan was theirs.

JESUS IS THE TRUTH. Jesus said something very big. [[John 14:6]] Jesus is not just a good idea. He is the truth. He is the Lamb. [[John 1:29]] He made everything, even the people who make computers.

THREE THINGS THIS WEEK. One. Name the makers. Pick three apps or helpers in your home. Who made them? Two. Check one answer. If a helper tells you something about Yahweh, look it up in the Bible with a grown up. Three. Keep one table. Pick one thing your family will always decide together, like how you pray.

WHAT NOT TO THINK. Tools are not bad. Thinking is not bad. Doing good is not bad. Just remember who gives the plan. Yahweh does.

${BLOCKED.child}

${TALK.child}`;

const YOUTH = `${TITLE}.

THE QUESTION. Every tool you use was made by someone. Every maker has ideas about the world. So when you build your life with tools, whose plan do you follow? That is this lesson.

WHO SENT THIS. On November 6, Darrell forwarded a technology news email. He typed one word above it: Lesson. That word is why this lesson exists. The email was the reason, but it is not the foundation. The Word is.

THE WORD FIRST. When David gave Solomon the job of building the temple, he gave him a detailed plan for every room. [[1 Chronicles 28:11]] Then David said where the plan came from. [[1 Chronicles 28:19]] The plan was Yahweh's, written down by His hand.

Paul gives the warning that goes with it. [[Colossians 2:8]] A plan can come from people's ideas instead of from Christ, and Paul says to watch for that. And he says what every life has to be built on. [[1 Corinthians 3:11]]

${DISCLOSE.youth}

THE NEWS. The email was TLDR, a daily list of short tech stories. It had fourteen of them. The first one was about the company planning to sell shares of itself. Investors said it may be worth less than people hoped. This course already taught about prices and promises, so we leave that one alone.

The story we chose was a short summary of a long article about the company's leader. As reported, two ways of thinking sit at the center of how he sees the world. One is rationalism, which tries to think about everything calmly and logically. The other is effective altruism, which tries to do the most good possible and measure it with math. The summary said these ideas are the foundation of the company. We only read three sentences, so that is reported, not proven.

But it leads to a real question for you. Every tool has a maker with a mind. Whose pattern is your life built on?

THE CRAFTSMAN FROM TYRE. Solomon knew his people could not do everything. He asked a neighboring king for help cutting timber. [[1 Kings 5:6]] He let the other king set the pay, and he was fair. Then he hired a master worker in metal named Hiram. [[1 Kings 7:13]] [[1 Kings 7:14]]

Hiram was brilliant at his work. But he did not design the temple. The pattern was already given. Moses had heard the same rule long before. [[Exodus 25:40]] Build it the way it was shown to you.

That is how a good tool fits in a life. It brings real skill. It does not bring the plan.

DANIEL'S TABLE. Daniel was taken to Babylon as a young man. The king's officials picked him for the best school in the empire. [[Daniel 1:4]] Daniel did not refuse to learn. He learned their language and their knowledge, and he served well. But he made one decision on his own. [[Daniel 1:8]] He kept his own table.

Where did his wisdom really come from? [[Daniel 1:17]] And in the end he was not behind the palace experts. [[Daniel 1:20]] Ten times better.

You can go to the school, use the tool, and learn the skill. Just keep your table.

WHAT THE BIBLE SAYS IS GOOD. Careful thinking is good. Yahweh says so. [[Isaiah 1:18]] Doing good to people is good too. [[Galatians 6:10]] Those are not the problem. The problem is when any idea, even a good one, takes the place that only Christ should have.

Paul shows why. [[1 Corinthians 13:2]] [[1 Corinthians 13:3]] You can know everything. You can give everything away. Without Love it adds up to nothing. Love comes first. So we trust Yahweh more than our own smart thinking. [[Proverbs 3:5]] [[Proverbs 3:6]]

And this is true for every company, not just one. Other A.I. tools come from other companies with their own goals. Even the free models our church runs on its own computers were made by companies. Nobody's tool comes from nowhere.

CHECK THE ANSWER. A tool answers from what it was trained on, and its makers chose what it should care about. So test what it says. [[1 John 4:1]] The people of Berea did this with Paul himself. [[Acts 17:11]] They checked him against Scripture every day.

OUR OWN APP. Our app is built with that company's tool, almost every day. Its own log of A.I. work shows it. It has about one hundred and fifty entries, all from that one maker. So here is how the app keeps the pattern. First, its rules say answers about faith come from Scripture. The tool may not make up theology. Second, every Bible verse is pulled from a Bible stored in the app. A test fails if anyone types one from memory. Third, the app's list of A.I. engines marks this one as not sovereign and costly. It keeps room for two other companies. It lists free engines on church computers too. Fourth, a person decides. Darrell governs, not the machine.

JESUS IS THE TRUTH. Every way of thinking is a method for finding truth. Jesus is the truth Himself. [[John 14:6]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne lasts forever. [[Hebrews 1:8]] Everything was made through Him, even the people who make computers. [[Colossians 1:16]]

THREE THINGS THIS WEEK. One, name the makers. List the apps and helpers you ask questions of, and who made each. Two, check one answer. Take something a tool told you about faith or right and wrong, and look it up in the Bible. Three, keep one table. Decide one thing no app will ever decide for you.

WHAT NOT TO THINK. Not that the company is evil, or that tools are bad, or that thinking and giving are wrong. Hiram's work was good. Daniel's learning was real. Use the skill. Keep the pattern.

${BLOCKED.youth}

${TALK.youth}`;

const TEEN = `${TITLE}.

THE QUESTION. You use tools all day, and every one of them was made by people who have beliefs about what matters. So here is the question: when your life runs through their tools, whose pattern is it built on?

WHO SENT THIS. On November 6, at 2:46 in the afternoon, Darrell sent us a tech news digest with one word typed above it: Lesson. That word is the request; the digest is just the occasion, and the Word is the foundation.

THE WORD FIRST. David gave Solomon a full plan for the temple. It listed every porch and room and storehouse. [[1 Chronicles 28:11]] [[1 Chronicles 28:12]] Then he said who wrote it. [[1 Chronicles 28:19]] Not David. Not the builders. Yahweh.

Paul warns about the other kind of plan. [[Colossians 2:8]] Notice what he names - philosophy, human tradition, the basic ideas of the world - and notice that the test is simple: is it after Christ, or not? Then he names the base of every life. [[1 Corinthians 3:10]] [[1 Corinthians 3:11]] Take heed how you build.

${DISCLOSE.teen}

THE NEWS. The digest was TLDR. It had fourteen tech stories, and the top one was about the company's plan to sell shares, with investors saying its value might have to come down. This course already covered prices and forecasts in weeks 78 and 79, so we skip that here.

We took a different item. It was a short summary of a long profile of the company's chief executive. As reported, two schools of thought shape his view of the world. Rationalism tries to think without emotion getting in the way. Effective altruism tries to do the most good possible, measured by math. The summary said these form the company's foundation. That is three sentences, and it is reported, not checked.

Here is why it matters to you. Every tool carries some of its makers' minds. So the real issue is not whether they have beliefs, but whether their beliefs quietly become your pattern.

THE CRAFTSMAN. Solomon admitted that his people lacked a skill: [[1 Kings 5:6]] So he asked Tyre for help and paid what they asked, and then he brought in Hiram, a master of bronze work. [[1 Kings 7:14]] Tyre's king said Hiram could figure out any design you gave him. [[2 Chronicles 2:14]]

That sounds like a good tool, right - skilled, fast, able to handle anything you give it? But Hiram still didn't write the plan, because it came from above. Hebrews repeats the rule from Moses. [[Hebrews 8:5]] Make it by the pattern you were shown. Hiram's work was good because it served a plan he didn't write.

DANIEL'S TABLE. Daniel was taken to Babylon as a teen. He was enrolled in the empire's top program. [[Daniel 1:4]] He didn't drop out; he learned their language and their science, and he did it well. But he drew one line. [[Daniel 1:8]] He purposed in his heart: the learning was theirs, but the table was his.

And here is the result. [[Daniel 1:17]] [[Daniel 1:20]] Yahweh gave him the wisdom, and he came out ten times better than the experts.

Use the tool and learn the skill, but keep your table.

BE FAIR ABOUT IT. Don't turn this into a hit piece, because careful thinking is good, and Yahweh invites it. [[Isaiah 1:18]] The wise person looks before believing. [[Proverbs 14:15]] Wanting to do good is good. [[Galatians 6:10]] Those aren't what Paul warns about; he warns about any idea taking Christ's place as the foundation.

Here is the deeper reason. [[1 Corinthians 13:2]] [[1 Corinthians 13:3]] All the knowledge in the world, and all the giving, are nothing without Love. Love is senior to every calculation. So we lean on Yahweh, not on our own smarts. [[Proverbs 3:5]]

And this goes for every maker. Other A.I. companies have their own goals, and the free open models our church runs were also built by companies. No tool is neutral, and that's normal, but you should know it.

TEST WHAT YOU HEAR. A tool answers from its training, and its makers chose what it values, so do what John says. [[1 John 4:1]] [[1 Thessalonians 5:21]] The Bereans checked Paul himself against Scripture. [[Acts 17:11]] Do the same with any answer about faith, morals, or who you are.

OUR APP, MEASURED. Our app is built with that company's tool nearly every day. Its own work log has about 150 entries, all naming that maker's tool. So how does the app keep the pattern? Four ways. One, its rules say Scripture is the source of answers, and the tool may not invent theology or treat its training as the authority. Two, every verse is filled from a Bible stored in the app, and a build check fails any verse typed by hand. Three, the app's engine list marks this maker's model not sovereign and high cost, keeps slots for two other companies, and lists free engines on church computers. Four, Darrell governs. The tool advises with evidence. A person decides.

THE TRUTH IS A PERSON. Philosophies are methods for finding truth. Jesus said He is the truth. [[John 14:6]] And the Spirit guides us into it. [[John 16:13]] Jesus is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is forever. [[Hebrews 1:8]] He made the makers. Everything holds together in Him. [[Colossians 1:17]]

THREE THINGS THIS WEEK. One, name the makers. List every app or helper you ask questions, and who made it. Two, check one answer. Take one thing a tool told you about faith or right and wrong, and search Scripture for it. Three, keep one table. Pick one thing in your life no app decides, and tell someone.

WHAT NOT TO THINK. Not that the company is evil. Not that tools are wrong. Not that thinking or giving is bad. Hiram's bronze was good. Daniel's learning was real. Use the skill. Keep the pattern.

${BLOCKED.teen}

${TALK.teen}`;

const SENIOR = `${TITLE}.

PROVENANCE OF THIS PAGE, STATED BEFORE ITS ARGUMENT. On the sixth of November 2026, at 2:46 in the afternoon Central time, Darrell forwarded a daily technology digest from his university mailbox into the lesson lane, with a single word typed above the forwarded header: Lesson. His word is the commission; the digest is merely the occasion, and no periodical serves as the foundation of an hour in this course. The intake fell behind, and the lesson was composed by hand from the backlog a week afterward.

THE WORD FIRST. When David transferred the building of the temple to Solomon, Scripture records two distinct handings-over. The first was the plan itself, room by room and treasury by treasury: [[1 Chronicles 28:11]] [[1 Chronicles 28:12]] The second was the plan's origin: [[1 Chronicles 28:19]] The pattern belonged neither to David nor to the craftsmen; it was given in writing by Yahweh's own hand. Paul identifies the opposite peril with some precision: [[Colossians 2:8]] And he identifies the one foundation no builder is free to substitute, adding a caution to every builder who follows: [[1 Corinthians 3:10]] [[1 Corinthians 3:11]]

${DISCLOSE.senior}

THE DIGEST, AND THE ITEM SELECTED. The periodical was TLDR, a daily précis of technology news, carrying fourteen editorial items besides its sponsorships. Its lead concerned the company's anticipated public offering and investors who expect the projected valuation to be revised downward. That subject - the price of a promise and a value that is only a forecast - was treated in weeks seventy-eight and seventy-nine, and is not repeated here.

The item that offers a teaching this course has not yet given is a brief summary of an extended profile of the company's chief executive. According to the digest's report, two philosophies are interwoven at the heart of his outlook: rationalism, which seeks to apply dispassionate thinking to the world, and effective altruism, which seeks to maximize social good with mathematical precision; and these are said to form the company's foundation. That is the entirety of what we hold - three sentences, reported and unverified. Yet it poses a question every household that relies on such tools must answer. Every instrument proceeds from a maker, and every maker has a mind. On whose pattern is your house being built?

THE CRAFTSMAN FROM TYRE. Solomon did not pretend to a competence Israel lacked, and said so in writing to the king of Tyre: [[1 Kings 5:6]] He named the need. He let the other party set the wage, and he set his own servants to labor alongside. Then he engaged a master craftsman from abroad: [[1 Kings 7:13]] [[1 Kings 7:14]] The king of Tyre's own commendation of the man is a fair description of any capable tool: [[2 Chronicles 2:14]]

Yet the skilled hands did not furnish the design. The rule given to Moses for the tabernacle governed the temple as well, and Hebrews restates it for every subsequent builder: [[Exodus 25:9]] [[Hebrews 8:5]] The bronze was excellent and honestly paid for; its excellence lay precisely in its service to a pattern its maker did not author.

DANIEL'S TABLE. Daniel spent his life within an intellectual order foreign to Israel. He was selected for instruction in the whole of Babylonian learning: [[Daniel 1:4]] He did not withdraw from that school; he mastered its language and its sciences sufficiently to serve its kings for decades. On one point, however, he resolved otherwise: [[Daniel 1:8]] The curriculum was Babylon's; the table remained his own. The source of his eventual understanding is recorded plainly: [[Daniel 1:17]] And the result was not a diminished man but this: [[Daniel 1:20]] A tool is rather like the palace school. Learn it thoroughly, employ it faithfully, and keep your table.

WHAT THE WORD COMMENDS, AND WHAT IT REFUSES. Fairness is required here, and the Word supplies it. Disciplined reasoning is not the adversary; Yahweh Himself invites it: [[Isaiah 1:18]] Proverbs commends the person who weighs a matter before accepting it: [[Proverbs 14:15]] The desire to do the greatest good is likewise commended: [[Galatians 6:10]] Whatever a profile may say of any individual, neither of those aspirations is what Paul cautions against. His caution concerns any philosophy installed as the foundation in the place that belongs to Christ.

And Paul explains why even the most rigorous reasoning and the most generous benefaction cannot bear that weight: [[1 Corinthians 13:2]] [[1 Corinthians 13:3]] All knowledge, yet nothing without Love; every possession distributed, yet no profit without Love. Love is senior to every calculation. The posture the Word requires, then, is neither suspicion of the intellect nor a contest of schools for the reader to adjudicate. It is this: [[Proverbs 3:5]] [[Proverbs 3:6]]

The principle applies to every maker without exception. Other firms whose tools stand alongside this one pursue their own purposes, and the open models this house operates on its own church computers were trained by companies with priorities of their own. No instrument arrives from nowhere. The question is never whether a maker holds convictions, but whether those convictions are permitted to become the household's pattern.

TRY THE SPIRITS. A tool answers from what it was taught and how it was tuned, and those who tuned it decided what it should regard as important. That is no scandal; it is the nature of every made thing. It does oblige a household to treat a machine as John instructed the church to treat every voice: [[1 John 4:1]] [[1 Thessalonians 5:21]] The Bereans model the practice: [[Acts 17:11]] They did not dismiss the apostle; they examined him daily against the Scriptures. Any answer a machine supplies concerning faith, morality, or the purpose of a human life deserves the same examination.

OUR OWN HOUSE, MEASURED. This house is not independent of the maker; it is built with that tool daily, and its own log of A.I. work confirms it - roughly one hundred and fifty entries when this lesson was composed, every one naming a tool from that company. So the question is not whether the tool is used. It is whose pattern the work obeys, and the house has recorded its answer in four places. First, the rules every working session loads before any task say that answers come from the worldview drawn from Scripture. They forbid the tool to improvise theology or to treat its training as the authority, and where it is unsure, it must say so. Second, no verse in this lesson came from the tool's memory. Each was filled by a script from the King James text stored within the app, and a check in the build fails any lesson with a verse typed by hand. Third, the app's register of A.I. engines marks that maker's model as not sovereign and costly. It reserves that model for work the local engines cannot do well. It keeps places for two other companies, and it lists open engines running on the church's own machines. Fourth, a person governs: the tool advises with evidence, and Darrell decides.

THE TRUTH IS A PERSON. Every school of thought, ancient or modern, is a method for approaching truth. Jesus offered no method; He declared Himself the truth: [[John 14:6]] And He promised a Guide who does not speak on His own authority: [[John 16:13]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne endures for ever, [[Hebrews 1:8]] by whom every maker and every made thing was created, and in whom all things consist: [[Colossians 1:16]] [[Colossians 1:17]]

THREE THINGS THIS WEEK. First, name the makers: list each tool your household consults and, beside it, its maker and its stated purpose. Second, examine one answer: take one reply a tool gave on faith or conduct and search the Scriptures on it, as the Bereans did. Third, keep one table: settle aloud, as a household, one matter no tool will ever decide.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that the maker is wicked, nor that the tool is forbidden, nor that careful thought and generous giving are wrong. The bronze from Tyre was good, and Daniel's learning was genuine. The point is order: employ the skill, keep the pattern, and permit no philosophy - anyone's, our own included - to stand where Christ stands.

${BLOCKED.senior}

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.

WHO SENT THIS. On the sixth of November 2026 at 20:46 UTC (2:46 in the afternoon, Central) Darrell forwarded the TLDR daily digest of that morning out of his university mailbox with ONE WORD typed above the forwarded header: Lesson. Gmail thread 1a1b29d09bf45870. His word is the ask; the digest is the occasion. The lane fell behind, and it was built by hand from the backlog.

A DISCLOSURE. This app is built with an A.I. tool made by Anthropic, and this lesson was drafted with it. Two items in the digest concern that company, so the lesson says so first, praises and blames nothing beyond what was reported, names no person, and applies its teaching to every maker.

THE WORD FIRST. 1 Chronicles 28:11-12 and 19 open the hour - the plan of every room, and the pattern Yahweh made David understand in writing by His hand - with Colossians 2:8 and 1 Corinthians 3:10-11. Then six movements: the skilled hands from Tyre who worked to a pattern they did not write (1 Kings 5 and 7; Exodus 25; Hebrews 8:5); Daniel, who learned Babylon's learning and kept his own table (Daniel 1); what the Word commends - reasoning and doing good - and what it refuses, any philosophy set where Christ belongs, with Love senior to every calculation (1 Corinthians 13); trying the spirits and the Berean habit; our own house measured; and the truth who is a Person.

ONE TEACHING FROM A DIGEST. Fourteen items. The lead, the maker's planned share sale and investors' doubts about its value, was already taught in weeks 78 and 79. The teaching taken is a reported summary of a profile of the company's chief executive: that rationalism and effective altruism form the company's foundation. Every tool has a maker, and every maker has a mind.

OUR OWN HOUSE. Every entry in the house's own log of A.I. work names that maker's tool. The house keeps the pattern four ways: its rules make Scripture the source of answers and forbid the tool to improvise theology; every verse is filled from the stored King James text and a gate fails a hand-typed one; its engine list marks that maker's model not sovereign and keeps two other makers and local engines beside it; and a person governs.

TRUST BUT VERIFY. The profile was not read; secondary listings name The New York Times, 5 November 2026, and report second-hand that the chief executive has said he does not count himself an effective altruist. All of it is told as reported. re-review: 2026-11-27.

LEFT OUT ON PURPOSE. The four sponsor blocks, and the other twelve items.

PLACEMENT. Sovereign A.I., week 86, because a household that builds with other people's tools must know whose pattern it is building on.`,
  inApp: `No new screens this week. One page in your Study, one honest list, and one answer checked.

In the app: open Sovereign A.I. week 86 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each holds the whole teaching. Use Search it out on 1 Chronicles 28, Daniel 1 and Acts 17 so the pattern, the table and the Bereans sit side by side; the links come from the lesson's own references.

Then look at how this app keeps its own pattern. Every verse you read in it is drawn from the Bible text stored inside the app, never typed from a machine's memory. That is Movement Five, on your own screen.

Away from the app, two exercises. Write down every tool your household asks questions of, and who made each one. And take one answer a tool gave you about faith or right and wrong, and search the Scriptures for it.`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[1 Chronicles 28:19]] [[Colossians 2:8]] [[1 Corinthians 3:11]] [[1 Kings 7:14]] [[Hebrews 8:5]] [[Daniel 1:8]] [[1 Corinthians 13:2]] [[Acts 17:11]] [[John 14:6]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them lands on your own house.

First, read 1 Chronicles 28:9-21 whole. Mark everything David hands Solomon, and underline where the pattern came from. Write one sentence on the difference between the builders' skill and the builders' plan.

Second, read 1 Kings 5:1-12 and 7:13-14. Notice how Solomon asked for help: he named his need and paid what the other side asked. Ask: which tools in my house do I depend on, and do I know who made them?

Third, read Daniel 1 whole. Mark what Daniel learned and what he refused. Ask what my table is - the one thing no school and no tool decides for me.

And one verification reading, because this course works this way. The digest gave three sentences about a profile nobody here could open. So everything in this lesson about the company is reported, not proven, and the one second-hand report in the other direction is told too. Practice telling apart what was read, what was reported, and what nobody checked.`,
    plan: `PLAN. Decide two measures before the week starts, and decide who hears them.

One: the makers list. Choose the evening you will sit down with your household and write every tool you ask questions of, and who made each one.

Two: the checked answer. Name one answer a tool gave you about faith, right and wrong, or what people are for, and the day you will search the Scriptures on it.

Then name the person who will ask you about both next week. A measure nobody asks about is a wish.

And decide what you will say to the young people in your house. The sentence is short: use the skill, keep the pattern.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.

Write the makers list on the evening you named. Read it to the person asking you about it.

Check the answer. Write down what the tool said, what the Scriptures say, and whether they agree.

Keep one table. Say aloud together the one thing in your house no tool will decide.

At the end of the week, answer three questions to the person who is asking. Which tool did I trust without knowing its maker? Which answer did I take without checking? And where has a tool quietly become my pattern?

Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a daily technology digest, answered from the Word rather than from the news, and built by hand when the intake lane fell behind.`,
    `A plain disclosure in every teaching place: this app is built with a tool from the company in the news, and this lesson was drafted with it.`,
    `1 Chronicles 28:19 laid down first, so the pattern is learned as Yahweh's before any headline is read.`,
    `Colossians 2:8 and 1 Corinthians 3:10-11 set as the test for every philosophy: after Christ, or not.`,
    `One teaching chosen from fourteen items, with the reason given: the lead was already taught in weeks 78 and 79.`,
    `The reported claim kept in the reported pile, and the second-hand report in the other direction told beside it.`,
    `The craftsman from Tyre taught as the picture of a good tool: real skill, paid honestly, working to a pattern he did not write.`,
    `Exodus 25:40 and Hebrews 8:5 used to show that the rule of the pattern held from the tabernacle to the temple.`,
    `Daniel 1 taught as the way to learn in a foreign school: learn it well, serve faithfully, keep your table.`,
    `Reasoning and doing good taught as commended by the Word (Isaiah 1:18; Proverbs 14:15; Galatians 6:10), not cast as enemies.`,
    `1 Corinthians 13:2-3 used to show that Love is senior to every calculation.`,
    `The teaching applied to every maker, including the companies whose open models this house runs on its own machines.`,
    `1 John 4:1 and the Bereans of Acts 17:11 turned into a household habit: check the answer against the Scriptures.`,
    `The house's own log measured honestly: every entry names a tool from the company in the news.`,
    `The house's rule shown: the tool may not improvise theology or treat its training as the authority.`,
    `Every verse in the lesson filled from the stored King James text, with a gate that fails a hand-typed one.`,
    `The app's engine list shown: that maker's model marked not sovereign, two other makers kept beside it, local engines on church computers.`,
    `A person governs: the tool advises with evidence, and Darrell decides.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, the truth who is a Person (John 14:6).`,
    `The unread profile told as unread, with the shut road named and a dated re-review.`,
    `No person named and no motive judged beyond what was reported.`,
    `All four age bands carried from the first commit, each written for its own reader.`,
    `Three household actions that cost nothing: name the makers, check one answer, keep one table.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The borrowed loom',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A quilting circle at a small church lost its oldest member, and with her went the only long-arm machine any of them knew how to run. A woman at a fabric shop across town offered to lend them hers, and to teach them.

She was a fine teacher and an honest one. The circle learned more from her in a month than in the five years before. She also had opinions about everything - which patterns were old-fashioned, which colors were tired, which quilts were worth a person's time. Without anyone deciding it, the circle's quilts began to look like hers.

At Christmas a girl in the church asked why none of the new quilts had the cross block her grandmother used to put in the corner. Nobody had an answer. Nobody had chosen to leave it out.

The next Saturday the circle took out the old pattern book their late friend had kept, with her pencil notes in the margins. They kept the borrowed machine. They kept everything the teacher had taught them about tension and thread. And they went back to their own blocks.

When the shop owner saw the next quilt, with the cross in the corner, she said it was the best work they had done. She was right. Her machine had made it better. The pattern had made it theirs.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The answer on the kitchen table',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A father found his twelve-year-old son at the kitchen table, typing a question into a chat helper on his phone: is it ever right to lie to protect a friend?

The boy turned the screen around. The answer was long, kind and careful. It listed several ways to think about the question and told him the choice was his to make.

The father read it twice. It was not a bad answer. It was thoughtful, and it never told the boy to do anything wrong. But he noticed what was missing.

He did not take the phone away. He put a Bible on the table beside it and said, Let's see what the One who made you says, and then let's compare. They read Proverbs 12:22, Ephesians 4:25 and the story of the midwives in Exodus 1, and they talked for an hour, longer than either of them expected.

At the end the boy said the helper was good at listing ways to think. The Bible was the only one that told him who he was. His father wrote the three references on a card and stuck it on the refrigerator. It is still there.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'According to 1 Chronicles 28:19, where did the pattern for the temple come from?',
        options: [
          'From the best builders of Tyre',
          'From Yahweh, who made David understand it in writing by His hand',
          'From Solomon’s own design',
        ],
        answer: 1,
        explain: 'The plan was given, not invented. The builders brought skill; Yahweh brought the pattern.',
      },
      {
        q: 'What does Colossians 2:8 warn against?',
        options: [
          'All thinking and all learning',
          'Being spoiled through philosophy and the tradition of men that is not after Christ',
          'Using tools made by other people',
        ],
        answer: 1,
        explain: 'The test is not whether an idea is clever, but whether it is after Christ. Any philosophy set in His place as the foundation fails it.',
      },
      {
        q: 'How did Solomon treat the craftsmen from Tyre?',
        options: [
          'He hid that he needed them',
          'He named his need, paid what they asked, and had them work to the pattern already given',
          'He let them redesign the temple',
        ],
        answer: 1,
        explain: 'A good tool brings real skill and is paid for honestly. It does not supply the plan.',
      },
      {
        q: 'What did Daniel do at the king’s school?',
        options: [
          'He refused to learn anything',
          'He learned its learning and language well, and purposed in his heart not to take the king’s table',
          'He became a Babylonian in every way',
        ],
        answer: 1,
        explain: 'Daniel 1:8, 17 and 20: he learned, he kept his table, and Yahweh gave him understanding ten times beyond the palace experts.',
      },
      {
        q: 'Does the Word treat careful reasoning and doing good as enemies?',
        options: [
          'Yes, both are dangerous',
          'No - Yahweh invites reasoning (Isaiah 1:18) and commands doing good (Galatians 6:10); the danger is any philosophy taking Christ’s place',
          'Only reasoning is dangerous',
        ],
        answer: 1,
        explain: 'The lesson is fair on purpose. What the Word refuses is not thought or kindness, but a foundation other than Christ.',
      },
      {
        q: 'What does 1 Corinthians 13:2-3 add?',
        options: [
          'That knowledge is enough',
          'That all knowledge and all giving, without Love, are nothing and profit nothing',
          'That giving is wrong',
        ],
        answer: 1,
        explain: 'Love is senior to every calculation.',
      },
      {
        q: 'What did the Bereans do with Paul’s teaching (Acts 17:11)?',
        options: [
          'They rejected it at once',
          'They received it readily and searched the Scriptures daily to see whether it was so',
          'They accepted it without checking',
        ],
        answer: 1,
        explain: 'That is the household habit for any answer a tool gives about faith or right and wrong.',
      },
      {
        q: 'What does this lesson disclose about how the app is built?',
        options: [
          'Nothing',
          'That the app is built with a tool made by the company in the news, and this lesson was drafted with it',
          'That the app uses no A.I. at all',
        ],
        answer: 1,
        explain: 'Every entry in the house’s own log of A.I. work names that maker’s tool, so the lesson says so first.',
      },
      {
        q: 'Which of these is one way this house keeps its own pattern?',
        options: [
          'It lets the tool write the verses from memory',
          'Every verse is filled from the King James text stored in the app, and a gate fails a hand-typed one',
          'It never checks the tool’s work',
        ],
        answer: 1,
        explain: 'The skilled hands do the work; the Word comes from the Word. The rules also forbid the tool to improvise theology, and a person governs.',
      },
      {
        q: 'What does this lesson say about the profile it describes?',
        options: [
          'That every claim in it was checked',
          'That only the digest’s three-sentence summary was read, the profile itself could not be opened, and all of it is reported, not proven',
          'That the profile was wrong',
        ],
        answer: 1,
        explain: 'Secondary listings name its publisher and report, second-hand, a statement in the other direction; that is told too. re-review: 2026-11-27.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read 1 Chronicles 28:11-12 and 19 aloud before you say one word about any company. Then read Colossians 2:8 and 1 Corinthians 3:10-11. Then ask the room one question and wait: who made the tools you asked questions of this week?

MINUTES 0 TO 6 - THE DISCLOSURE. Say plainly that this app is built with a tool made by the company in the news, and that the lesson was drafted with it. Say what that obliges: nothing praised or blamed beyond what was reported.

MINUTES 6 TO 14 - THE DIGEST AND THE ONE ITEM. Name the digest and its lead, and why the lead is not retaught. Read the three reported sentences about the profile exactly as the lesson gives them, and say they are reported.

MINUTES 14 TO 24 - THE SKILLED HANDS. 1 Kings 5:6, 7:13-14, 2 Chronicles 2:14, Exodus 25:40 and Hebrews 8:5. Skill from outside, paid honestly, working to a pattern it did not write.

MINUTES 24 TO 34 - DANIEL'S TABLE. Daniel 1:4, 8, 17 and 20, read as a story. Ask the room what their table is.

MINUTES 34 TO 44 - WHAT THE WORD COMMENDS AND REFUSES. Isaiah 1:18, Proverbs 14:15, Galatians 6:10, then 1 Corinthians 13:2-3 and Proverbs 3:5-6. Make sure the room hears both halves. Then say it applies to every maker.

MINUTES 44 TO 52 - TRY THE SPIRITS, AND OUR OWN HOUSE. 1 John 4:1, 1 Thessalonians 5:21, Acts 17:11. Then the four ways this house keeps its pattern.

MINUTES 52 TO 60 - THE TRUTH IS A PERSON. John 14:6, 16:13, 1:29, 3:16, Hebrews 1:8, Colossians 1:16-17. Give the three household actions and close with the talk-together directions.

WHAT NOT TO DO. Do not turn this into an attack on a company or a person; the lesson holds three reported sentences and names no one. Do not stage schools of thought as rival camps for the room to pick between (DR-0098); teach what the Word commends and what it refuses. Do not tell the profile as read. And do not skip the disclosure; it is the part that keeps the hour honest.`,
    talkingPoints: [
      `This app is built with a tool made by the company in the news, and this lesson was drafted with it.`,
      `The temple's pattern came in writing from Yahweh's hand, not from David and not from the builders (1 Chronicles 28:19).`,
      `Colossians 2:8 tests every philosophy by one question: is it after Christ?`,
      `Other foundation can no man lay (1 Corinthians 3:11).`,
      `The digest's lead was already taught in weeks 78 and 79, so one other item was taken.`,
      `As reported, the profile says rationalism and effective altruism form the company's foundation. That is reported, not checked.`,
      `Solomon named his need and paid the craftsmen of Tyre honestly (1 Kings 5:6).`,
      `The master craftsman was filled with wisdom and skill, and still worked to the pattern given (1 Kings 7:14; Hebrews 8:5).`,
      `Daniel learned Babylon's learning and kept his own table (Daniel 1:4, 8).`,
      `Yahweh gave Daniel his understanding, ten times beyond the palace (Daniel 1:17, 20).`,
      `Careful reasoning is commended (Isaiah 1:18; Proverbs 14:15).`,
      `Doing good is commanded (Galatians 6:10).`,
      `All knowledge and all giving, without Love, are nothing (1 Corinthians 13:2-3).`,
      `Every maker has a mind, including the makers of the open models the house runs on its own machines.`,
      `Try the spirits and prove all things (1 John 4:1; 1 Thessalonians 5:21).`,
      `The Bereans checked even Paul against the Scriptures, daily (Acts 17:11).`,
      `Every entry in the house's own log of A.I. work names that maker's tool.`,
      `The house's rules forbid the tool to improvise theology or treat its training as the authority.`,
      `Every verse is filled from the stored King James text; a gate fails a hand-typed one.`,
      `The app's engine list marks that maker's model not sovereign and keeps two other makers and local engines beside it.`,
      `A person governs: the tool advises with evidence, Darrell decides.`,
      `Jesus is the truth Himself, the Lamb of Yahweh and the Eternal Son (John 14:6; John 1:29; John 3:16).`,
    ],
    discussionPrompts: [
      `Which tools do you ask questions of in a week? Do you know who made each one?`,
      `Where has a tool quietly become the pattern in your home, without anyone deciding it?`,
      `What did Daniel learn in Babylon, and what did he refuse? What is your table?`,
      `When has a thoughtful, kind answer still been missing something the Word supplies?`,
      `How would you check one answer a tool gave you, the way the Bereans checked Paul?`,
      `Why does it matter that the lesson disclosed how the app itself is built?`,
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
console.log(`sov86: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov86: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov86: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov86: refusing to splice a lesson that fails the four-band ladder');
}
if (process.argv.includes('--measure')) process.exit(0);

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov86: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov86: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov86: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov86: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov86: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  // from - 1 also takes the newline before the block, so a rebuild is byte-identical.
  src2 = src2.slice(0, from - 1 - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov86: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov86: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov86: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov86: week ${WEEK} is already taken`);
if (!after.includes(WEEK)) throw new Error(`sov86: week ${WEEK} is not in the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov86: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov86: spliced ${ID}`);
console.log(`sov86: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov86: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
