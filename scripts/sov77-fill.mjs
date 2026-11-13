// =============================================================================
// sov77-fill — build Sovereign A.I. week 77 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[Job 12:11]], and this
// script replaces it with the corpus text followed by the reference. No verse on
// the page was typed from memory, so a quotation cannot drift from the text and
// cannot be approximate. The reference list on the module's anchor is DERIVED
// from the placeholders that occur in the reader places, so anchor.ref names
// every verse the lesson stands on and nothing it does not (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-10-27 at 19:34 UTC Darrell forwarded The
// Neuron's daily issue, subject line "OpenAI's Terra can enter your invoices,"
// out of his university mailbox into the lesson lane, with ONE WORD typed above
// the forwarded header: Lesson. That word is the ask; the newsletter is the
// occasion only. Gmail thread `1a17edb181a9c1f6`. SIXTEEN DAYS stood between his
// word and this build, and the record keeps that rather than smoothing it.
//
// WORD FIRST (DR-0127 / DR-0282 / DR-1326). The hour opens on
// 1 Thessalonians 5:21 — Prove all things; hold fast that which is good — and on
// the Bereans who searched the scriptures daily whether those things were so.
// The newsletter's own closing question was how do you check the work. Scripture
// asked it first, answered it first, and named who the proving finally belongs
// to. Not one figure from the article appears above that frame.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100). A newsletter is a LEAD, never the
// citation. No primary host was read by this build: openai.com, arxiv.org and
// sec.gov were not reachable through this session's egress proxy, so no figure
// here rests on a primary-source read, and that is said in EVERY reader place
// (DR-0076 §8). An independent search road was walked on each load-bearing
// number instead, and the checking CHANGED four things, each gated in
// app/src/__tests__/sovereign-ai-sov77-verses.test.js:
//   1. The 80.75 billion dollar loss is almost entirely a NON-CASH revaluation.
//      Independent coverage of the same filing puts 72.39 billion of it in the
//      changed fair value of convertible notes, derivative liabilities and
//      SAFEs, and the OPERATING loss near 693 million. A reader handed only the
//      headline would have taken a bookkeeping entry for money burned.
//   2. The digest UNDER-stated the revenue rise. Its about 1,200 percent is the
//      lower reading; against the filing's own half-year comparison, 16.286
//      billion against 1.163 billion, the rise is about fourteen-fold, roughly
//      1,300 percent. DR-0100 §5: the verified figure is stated plainly.
//   3. Lean verified the result is NARROWER than the digest made it sound.
//      Secondary analyses report that the published Lean scope note does not
//      claim to verify the manuscript's sharper running-time estimate, and that
//      the posted file does not name the hypothesis at all. The proof-checker
//      checked a formalization; the headline remains unconfirmed, and the
//      working group's verdict had not landed.
//   4. The digest dropped that a second laboratory posted a parallel result the
//      same day. Secondary coverage only, attributed and never asserted.
//   The 27 percent of staff figure checked out and is stated plainly: about
//   60,000 against about 223,000 full-time employees in the company's own
//   June 2026 filing is 26.9 percent. The one-dollar and five-dollar token
//   prices, and half the price of the larger model, also held up across
//   independent coverage. NOT CHECKED AT ALL: the 9.4-second and 17.3-second
//   stopwatch figures, every benchmark score, and the datacenter and lease
//   numbers in the digest's news column.
//
// Run from the repository root:  node scripts/sov77-fill.mjs   (--rebuild to replace)
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 77;
const ID = 'sov77-prove-all-things';
const TITLE = 'Prove all things - the ear that trieth words, the neighbor who comes and searches him, and every man proving his own work';

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
  if (!m) throw new Error(`sov77: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov77: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov77: reference does not resolve in the corpus -> "${ref}"`);
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
// The blocked-road sentence, said in every reader place (DR-0076 section 8), and
// the talk-together close in this lesson's own words, written at each band's own
// level, because a reader reads ONE band (DR-0795).
// -----------------------------------------------------------------------------
const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, ask one of your children today what they believed this week only because somebody confident said it, and listen all the way to the end before you correct a syllable of it; have them retell the claim in their own words, then teach them one verse back, 1 Thessalonians 5:21. Children, ask your mother, your father or a grandparent about a time they trusted a seller's own number and found out later what it really was, hear the whole of it, then retell their answer to them in your own words. Then ask a friend this: which of the things you repeated this week did you actually check, and which did you just pass along? Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one question today - what did you believe this week just because somebody said it loud - and listen all the way to the end before you teach one word; have them say the claim back in their own words, then teach them one verse, 1 Thessalonians 5:21. Children, ask your mom or dad or grandma or grandpa about a time a box said one thing and the thing inside was not that. Hear the whole story. Then say it back to them in your own words. Then ask a friend this: what did you tell somebody this week that you never checked? Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is one thing you repeated this week without checking it first - and listen all the way to the end before you say anything back; have them retell the claim in their own words, then teach them one verse, Acts 17:11. Children, ask your mom, your dad or a grandparent about a time somebody sold them on a number that turned out smaller than it sounded, hear the whole of it, then retell their answer in your own words. Then ask a friend this: how would you and I actually test that, with a timer and a score sheet? Teach each other one verse. ${RHYTHM}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - whose numbers do you trust about the tools you use every day, and who paid for those numbers - and listen all the way to the end before you answer it for them; have them retell the test in their own words, then teach them one verse, Proverbs 18:17. Children, ask your mom, your dad or a grandparent what they learned to check for themselves after being burned once, hear the whole of it, then retell their answer in your own words. Then ask a friend this: what is the one chore you would race two tools on, and how would you score it so the score means something? Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - how do you find out whether a thing is really so - and listen all the way to the end, without finishing the sentence for them; have them retell the question in their own words, then teach them one verse back, Galatians 6:4. Children, ask your parents or your grandparents about the weights and the measures of their own trade, and who taught them to check, and hear the whole of it before you say a thing; then retell it back to them in your own words. Then ask a friend this: what have we both been repeating for years that neither of us has ever once proved? Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson, in eight numbered movements. The Word opens every one.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the twenty-seventh of October 2026, at 19:34 by universal time, Darrell forwarded a daily artificial-intelligence newsletter out of his university mailbox into this lane. Above the forwarded header he typed ONE WORD: Lesson. That word is the ask. The newsletter is the occasion, and the article is not the foundation. Sixteen days stood between his word and this hour, and that gap is on the record here rather than smoothed away.

What the issue carried was four stories and one question underneath all four. A company said its machine had overturned a thirty-five-year-old belief in computer science. The same company, the same day, launched a cheaper model built to click through office software and key in invoices. A second company filed to go public with a loss in the tens of billions. A third offered sixty thousand people a way out the door. And the newsletter's own closing line on the first two was the honest one: both launches share one problem, which is how do you check the work. A filled-in form can be verified in seconds. A proof of a thirty-five-year-old conjecture takes months, a working group, and a conference somebody has to pay for.

That question is not new and it is not theirs. The Word asked it, answered it, and told us whose proving is final.`,

  `MOVEMENT ONE: PROVE ALL THINGS. The frame of this whole hour is four words, and they are a command, not a mood: [[1 Thessalonians 5:21]] Not prove the things that look doubtful. All things. And the verse does not stop at suspicion, which is where most people stop; it ends in commitment - hold fast that which is good. Proving is how you get to holding, and a man who proves nothing holds nothing.

Yahweh honors this so plainly that He commends a congregation for doing it to His own preachers. The Bereans heard Paul, and here is what the Word calls noble about them: [[Acts 17:11]] They received the word with readiness AND they searched, daily, whether those things were so. Readiness and checking in the same people, in the same week. That is the posture. Enthusiasm without checking is credulity, and checking without readiness is cynicism, and the Word has no use for either one.

John makes the duty general and names the reason: [[1 John 4:1]] Because many are gone out. The reason to test is not that everyone lies. It is that enough do, and you cannot tell by the confidence in their voice. The risen Lord Jesus Himself commends an assembly for exactly this work: [[Revelation 2:2]] They tried them, and they found them. He does not scold them for checking credentials. He puts it in the commendation.

So when a newsletter asks how do you check the work, we are not being handed a new problem by the technology industry. We are being handed our own assignment back.`,

  `MOVEMENT TWO: THE EAR TRIETH WORDS. The newsletter's own suggestion was to race two models on the same dull chore and time them, and it described the exercise as a taste test with a stopwatch. That is a better sentence than its author knew, because Scripture already built the metaphor and built it twice: [[Job 12:11]] And again, in Job's own mouth, as a settled principle rather than a question: [[Job 34:3]]

The ear is given the same office the mouth has. A mouth does not reason about meat; it tastes it, and the tasting is the test. So the Word's picture of discernment is not a clever argument at a distance. It is a thing put in the mouth and found out. That is why a claim you have never run is a claim you have never tasted, whatever you can recite about it.

And this faculty is not issued finished. It is trained by use: [[Hebrews 5:14]] By reason of use. A man who has never tested a tool has no palate for tools, and he will be fed whatever the loudest voice in the room is serving.

Here is where the article's figures can come in, now that the frame is set and not borrowed. The newsletter reported a fifteen-field web form, three runs on each of two models, and a median of 9.4 seconds against 17.3 seconds, with a third and cheaper model getting every field right in only one run out of three. This build did not verify those stopwatch numbers and could not; they come to us through secondary coverage, and they are attributed here and never asserted. But the SHAPE of the exercise is the whole point: he put the thing in his mouth, and the mouth tasted it, and he wrote down what happened.`,

  `MOVEMENT THREE: THE NEIGHBOR COMES AND SEARCHES HIM. Now to the hinge of the hour. The company said Terra finished more than three times faster. An independent tester saw a gap closer to 1.8 times. Both sentences can be honest at once, and Scripture explains how in a single verse: [[Proverbs 18:17]]

He that is FIRST in his own cause seemeth just. Not is a liar. Seemeth just. A seller's account of his own goods is one-sided before anybody intends to deceive, because the seller chose the goods, chose the test, and chose which runs to report. The remedy the Word names is not suspicion; it is a second party. The neighbor comes. And the Word puts the matter of self-praise plainly: [[Proverbs 27:2]] Let another man praise thee. And again, on motive: [[John 7:18]]

Paul names the exact failure mode of a vendor benchmark, and the phrase he uses could be printed on the chart: [[2 Corinthians 10:12]] They measuring themselves by themselves. A number produced on a task the measurer selected, scored by a scale the measurer wrote, is self-comparison with a decimal point on it. Scripture does not call that lying. It calls it not wise.

The same chapter of the same newsletter carried a company's own filing about its own future, and the writer said the right thing about it: read it like a pitch deck, not a weather report. That is Proverbs 27:2 in modern dress, and the Word also knows the opposite trick, where the interested party talks a thing DOWN until he owns it: [[Proverbs 20:14]] It is naught, saith the buyer. Both mouths are interested. Neither is the measure.

And notice one thing the technology story got genuinely right, because under-claiming a good thing is its own failure. The group now sitting over that computer-science claim includes the very men who first proposed the hypothesis, and the raw data was made public at that group's own asking. That is a neighbor coming and searching the matter, arranged on purpose, with the authors of the belief invited to kill it. The Word has a name for that honor: [[Proverbs 25:2]] The honor of kings is to search out a matter.`,

  `MOVEMENT FOUR: LET EVERY MAN PROVE HIS OWN WORK. The newsletter's sharpest line was that vendor numbers are averages across their tasks, and your task is the one that matters. Scripture said it as a command about a man's own labor: [[Galatians 6:4]] And it closes the escape route, which is comparing yourself to somebody else's result: [[Galatians 6:5]]

Your task. Your burden. Your form, your spreadsheet, your invoices, your Friday afternoon. An average over a laboratory's chosen chores tells you something about the laboratory. It tells you nothing certain about the one chore that is actually yours, and no amount of reading the chart converts into having run it.

Paul turns the same instrument on the self, where it is far harder to hold: [[2 Corinthians 13:5]] Examine yourselves. Prove your own selves. The man who will stopwatch a machine and never once audit his own week has learned the technique and missed the subject. Haggai says it to a whole nation in four words, twice in one chapter, because they did not hear it the first time: [[Haggai 1:5]] And again: [[Haggai 1:7]]

Consider your ways. That is the instruction, and it is addressed to the one person whose work you are actually responsible for.`,

  `MOVEMENT FIVE: A JUST WEIGHT AND A JUST MEASURE. If you are going to measure, the measure itself is under judgment. This is not a metaphor in the Word; it is law, and it is law about commerce: [[Leviticus 19:35]] [[Leviticus 19:36]] Just balances, just weights - and then the reason, which is not economics but identity: I am the LORD your God.

Yahweh's delight and His abomination are both named over this one thing: [[Proverbs 11:1]] And the bag with two stones in it, a heavy one for buying and a light one for selling, is forbidden by name: [[Deuteronomy 25:13]] with the promise attached to the honest one: [[Deuteronomy 25:15]]

Read a benchmark through that law and it reads differently. Two models scored on tasks one of them was tuned for is divers weights in the bag. A median taken from three runs and then reported as a speed is a measure that will not bear the weight put on it; three runs cannot settle anything scientific, as the newsletter itself admitted, and a lesson that repeated the number without that admission would be using the light stone.

So here is the honest loss, said rather than hidden, because compression of any kind loses detail and a page that hid that would be holding a crooked measure. The cheap model in the article got every field right in only one run of three. Cheaper was not worse at everything. It was worse at the one thing the job needed, which was being right every time, and a measure that averaged accuracy together with price would have concealed exactly that. The correct conclusion is the newsletter's own: switch to the cheaper tool only if accuracy holds.`,

  `MOVEMENT SIX: HOW LONG PROVING TAKES, AND WHY THAT IS NOT AN EXCUSE. A form verifies in seconds. A thirty-five-year-old conjecture takes months. The Word is not embarrassed by either timescale, and it gives a test that is explicitly built to wait: [[Deuteronomy 18:21]] [[Deuteronomy 18:22]] If the thing follow not. The test is time. You do not get to know yet, and the verse treats that as normal rather than as a crisis.

Against that patience, Scripture sets the man who settles everything instantly: [[Proverbs 14:15]] The simple believeth every word. The prudent looks well to his going - which is to say, he watches where his own feet are actually landing. And haste is named as a sin and not a style: [[Proverbs 19:2]] The foundation itself is laid as a TRIED stone, and the clause that follows is the posture of everyone standing on it: [[Isaiah 28:16]] He that believeth shall not make haste.

James will not let the waiting be dead time either: [[James 1:4]] Let patience have her perfect work.

So the honest status of the biggest claim in the forward is: not yet. A proof-checking program confirmed a formalization, and independent analyses of the published scope note say it does not cover the sharper running-time estimate the headline rested on. The working group had not returned a verdict when this was forwarded, and had not when it was built. Secondary coverage also reports that a second laboratory posted a parallel result the same day, which the digest did not mention; that reaches us through coverage only and is attributed, not asserted. The lesson does not teach the hypothesis as overturned. It teaches that the hour of checking had not finished, and that saying so is the discipline rather than a hedge.`,

  `MOVEMENT SEVEN: THE HALF WAS NOT TOLD ME. Proving is not a machine for shrinking claims. Sometimes the check makes the thing BIGGER, and refusing to say so is the same sin as exaggeration wearing a modest coat.

The queen of Sheba came the whole distance for one purpose, and the Word states it as a test: [[1 Kings 10:1]] She came to prove him with hard questions. And her verdict after the testing was not a correction downward: [[1 Kings 10:7]] The half was not told me. The report she had been given had UNDER-stated the truth, and she said so out loud.

Scripture also shows twelve men searching the same ground and bringing back two reports. The fruit was real and nobody disputed it: [[Numbers 13:27]] One man drew the right conclusion from the same evidence: [[Numbers 13:30]] And ten took the same facts and brought back what the Word itself calls an evil report: [[Numbers 13:32]] Same land. Same grapes. The difference was not data.

This is where our own checking has to be reported honestly in both directions, so here it is. Four things the checking corrected, and two it made stronger. Corrected: the eighty-point-seven-five billion dollar loss is almost all a non-cash revaluation, with independent coverage of the same filing putting about 72.39 billion of it in changed fair value of convertible notes and similar instruments, and the OPERATING loss near 693 million - a reader handed only the headline would have taken a bookkeeping entry for money burned. Corrected: the digest's about 1,200 percent revenue rise is the LOWER reading; against the filing's own half-year comparison, 16.286 billion against 1.163 billion, the rise is about fourteen-fold, roughly 1,300 percent. Corrected: Lean verified the result is narrower than it sounds, per the paragraph above. Corrected: the parallel result from a second laboratory was dropped. Made stronger, and now stated plainly: the roughly 27 percent of staff figure holds - about sixty thousand against about 223,000 full-time employees in the company's own June 2026 filing is 26.9 percent - and the one-dollar and five-dollar token prices, at half the larger model's rate, held up across independent coverage.

WHAT WE CHECKED AND WHAT WE DID NOT. The newsletter is a lead and never the citation. No primary host was read by this build: openai.com, arxiv.org and sec.gov were NOT reachable from this build's network boundary, so no figure here rests on a primary-source read, and that is said in every band rather than only to the adult reader. An independent search road was walked on each load-bearing number instead, and what the checking changed is listed above rather than merely claimed. Attributed and not asserted on our own authority: the stopwatch figures, the names of the men on the working group, and the parallel result from the second laboratory, all of which reach us through secondary coverage this build could not set against a primary page. Not checked at all: every benchmark score, the datacenter and chip-lease numbers in the news column, and the disclosed data leak. A dated re-review stands against all of it - re-review: 2026-11-26 - because a blocked road must never be left reading like a verified claim.`,

  `MOVEMENT EIGHT: WHO TRIETH THE HEART. Everything above is a method for examining work. Now the bright line, because a method applied past its bound becomes a lie.

No stopwatch, no score sheet and no model weighs a man. Scripture reserves that: [[Jeremiah 17:9]] Who can know it - and then the answer, in the first person: [[Jeremiah 17:10]] I the LORD search the heart. That is not a capability anybody is building toward. It is His by right, and a system that claims it is claiming His office.

The believer's posture under that is not avoidance. It is invitation, which is the opposite of how we treat a benchmark: [[Psalm 139:23]] [[Psalm 139:24]] Search me. Try me. David asks for the audit: [[Psalm 26:2]] And Yahweh Himself issues the one standing invitation to be tested, over the tithe: [[Malachi 3:10]] Prove me now herewith.

Paul holds the line where it belongs - neither flinching from examination nor accepting the wrong judge: [[1 Corinthians 4:3]] And the timing: [[1 Corinthians 4:5]] Judge nothing before the time. There is a day set for it, and a fire that does the measuring: [[1 Corinthians 3:13]] The fire shall try every man's work.

Meanwhile the test He gives us for people and teachers is not a metric but a harvest: [[Matthew 7:16]] And again: [[Matthew 7:20]] Fruit takes a season, which is the same patience Movement Six asked for, applied to souls instead of software.

And the close. The one Word that was proved all the way down and held fast is a Person. He is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever: [[Hebrews 1:8]] He was tested in the wilderness, tested by His enemies with hard questions, tested to the cross, and He did not fail one examination. The Word is the authority here, not the article and not the chart.

So: prove all things. Run your own chore, not the laboratory's. Keep one weight in your bag. Wait for the thing to follow or not follow. Say it plainly when the half was not told you. And remember that the last proving is not yours to run, and that the One who runs it already knows the answer.`,

  TALK.lesson,
];

// -----------------------------------------------------------------------------
// THE FOUR AGE BANDS, each written FOR ITS READER rather than trimmed from the
// adult text. Each opens by naming the lesson, each carries the Word-first
// frame, the blocked-road honesty, the just weight, the two bright lines, and
// its own talk-together close in all three directions.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

Today we learn how to find out if a thing is true. The big word for it is prove. It does not mean argue. It means check.

Here is the day it started. On a Tuesday in October, Darrell got a news letter in his work mail. It was about computers. He sent it to us. On the top he typed one word. The word was Lesson. That word is the job. The news letter is just the reason. Sixteen days went by before we built it, and we say so.

The news letter said something funny at the end. It said nobody knows how to check the work. That is a real problem. But it is not a new one. Yahweh told us about it a long time ago.

HERE IS THE VERSE THE WHOLE DAY STANDS ON. [[1 Thessalonians 5:21]] Four words. Prove all things. Not some things. All of them. And look how it ends. Hold fast that which is good. So you check a thing so you can keep the good part.

There were some people in a town called Berea. Paul came and taught them. They were glad. But they also went home and looked it up. Every day. [[Acts 17:11]] Yahweh calls that noble. They were glad AND they checked. You can be both.

John says to try things too. [[1 John 4:1]] Not because everybody lies. But some do. And you cannot tell by how sure they sound.

HOW DO YOU CHECK A THING. The Word says to use your ear the way you use your mouth. [[Job 12:11]] You do not argue about food. You taste it. Then you know. Job says it again like a rule. [[Job 34:3]]

So if you never tried a thing, you never tasted it. You just heard about it.

And this gets better when you do it a lot. [[Hebrews 5:14]] By reason of use. That means you get better at tasting by tasting.

A man in the news letter did this with two computer helpers. He gave both the same boring job. He used a timer. He wrote down who was faster and who got it right. That is a taste test with a timer, and that is a good idea. We could not check his numbers, and we say so. Nobody here could read the company papers. Those pages were not reachable from this build. So we tell you it was reported, and we do not tell you it is proved.

WHY YOU NEED SOMEBODY ELSE TO CHECK. The company said its helper was three times faster. A different man tested it and got a smaller number. Both can be telling the truth. Here is why. [[Proverbs 18:17]]

That verse is so good. The first man to talk SEEMS right. Then the neighbor comes and looks. You need the neighbor. The man selling the thing picked the test himself. So he is not a bad man. He is just first.

That is why we do not brag on ourselves. [[Proverbs 27:2]] Let somebody else say it.

CHECK YOUR OWN WORK, NOT SOMEBODY ELSE'S. The news letter said a smart thing. It said the company's numbers come from the company's own jobs. But your job is the one that matters. The Word says that too. [[Galatians 6:4]] Prove your own work. Your work. Not his.

And Paul says to check yourself the same way. [[2 Corinthians 13:5]] That is harder than checking a machine.

KEEP ONE SET OF WEIGHTS. Long ago people sold things with a stone on a scale. Some men kept two stones. A heavy one when they bought. A light one when they sold. Yahweh said no. [[Leviticus 19:35]] [[Leviticus 19:36]] Just balances, just weights. And look. [[Proverbs 11:1]]

So the way you measure has to be fair too. One of the cheap helpers in the story was fast. But it only got it all right one time out of three. Fast is not the same as right. If you only count how fast, you lose some of the truth. So we say it out loud. Cheap cost something.

SOME THINGS TAKE A LONG TIME TO CHECK. You can check a form in a minute. But one big math claim in the story will take months and a whole group of people. The Word is fine with waiting. [[Deuteronomy 18:21]] [[Deuteronomy 18:22]] If the thing does not happen, then you know.

And do not believe everything just because it came fast. [[Proverbs 14:15]] The wise person looks at where his feet are going.

SOMETIMES CHECKING MAKES IT BIGGER. A queen heard about a king named Solomon. She came a long way to test him. [[1 Kings 10:1]] And after she tested him she said this. [[1 Kings 10:7]] The half was not told me. So checking does not always make a story smaller. Sometimes the real thing is bigger than the story.

AND SOMETIMES CHECKING MAKES IT SMALLER. We checked some of the numbers in the news letter. One of them was a very big loss. It was eighty billion dollars. That sounds like money that got burned up. But we looked. Most of it was not money spent at all. It was a math note in a book. The real money part was much smaller. So the big scary number was not the real story.

That is why we check. Not to be mean. To be fair.

We also checked a number and it came out the same. The news letter said a company asked sixty thousand workers if they wanted to leave. It said that was about twenty-seven out of every hundred workers there. We did the math. Sixty thousand out of two hundred twenty-three thousand really is about twenty-seven out of a hundred. So that one was right. We say that out loud too. It is not fair to only say when somebody got it wrong.

WHAT WE COULD NOT DO. We want you to know what we did not do. We could not open the company's own papers. Those pages were not reachable from this build. So nothing on this page comes from the paper itself. We used other news to check. That is not as good, and we are telling you so. We wrote a date on our page to go back and try again.

That is part of proving too. You say what you could not find out. A grown-up word for that is honest.

YOU CAN ASK YAHWEH TO TEST YOU. This is the best part. We check things. And we also let Yahweh check us. He even asked us to test Him once. It was about giving. [[Malachi 3:10]] Prove me now, He said. He is not scared of being tested.

THE ONE THING NO MACHINE CAN CHECK. A timer can check a job. No timer can check a heart. Only Yahweh does that. [[Jeremiah 17:9]] [[Jeremiah 17:10]] I the LORD search the heart.

And David asked Him to do it. He was not scared of it. [[Psalm 139:23]] [[Psalm 139:24]]

For people, Yahweh gives us a test we can use. It is fruit. [[Matthew 7:16]] [[Matthew 7:20]] Fruit takes a season. So you wait, and then you know.

And the best news. One Word was tested all the way and never failed. That is Jesus, the Lamb of Yahweh. [[John 1:29]] He is the Son of Yahweh whom the Father gave. [[John 3:16]] His throne lasts for ever. [[Hebrews 1:8]]

WE DO NOT ARGUE THE WORD. One more thing. There is a difference between checking and arguing. We check claims that people make. We do not argue with Yahweh. The Word is the thing we check other things BY. It is the ruler, not the thing being measured.

And here is a happy part. Jesus got tested a lot. He got tested in the desert. People asked Him hard questions on purpose, to trip Him. He got tested all the way to the cross. He never once failed a test. So He is the one Word you can lean your whole weight on.

So prove all things. Taste it yourself. Let a neighbor look. Keep one honest weight. And wait when you have to. Say it out loud when you do not know yet. That is not being dumb. That is being honest.

${TALK.child}`;

const YOUTH = `${TITLE}.

This week we learn to prove a thing instead of just repeating it. Proving does not mean arguing. It means you go and find out.

WHERE IT CAME FROM. On the twenty-seventh of October, Darrell forwarded a daily news letter about computers out of his work mail. Above the forwarded part he typed one word: Lesson. That word is the request. The news letter is only the occasion. Sixteen days passed between his word and this lesson, and we leave that on the record instead of hiding it.

The news letter had four stories, and one question under all of them. A company said its machine had knocked over a belief that computer scientists had held for thirty-five years. The same company launched a cheaper model built to click around office software and type in invoices. And the writer asked the right question at the end: how do you check the work? A form can be checked in seconds. A thirty-five-year-old math claim takes months and a whole group of experts.

THE WORD GOES FIRST. That question is not new. [[1 Thessalonians 5:21]] Prove all things. It is a command and not a mood. And notice the end of it. Hold fast that which is good. You check a thing so that you can keep the good part of it. Somebody who proves nothing ends up holding nothing.

Yahweh even praises a church for checking a preacher. [[Acts 17:11]] They were glad to hear, and they went and looked it up daily. Glad and careful at the same time. That is the posture.

John makes it a rule for all of us. [[1 John 4:1]] The reason is not that everybody lies. It is that some do, and you cannot tell from how confident they sound.

THE EAR TASTES WORDS. How do you check? The Word says your ear works like your mouth. [[Job 12:11]] You do not debate food. You taste it, and then you know. Job states it again as a settled thing. [[Job 34:3]]

So a claim you have never run is a claim you have never tasted, no matter how much you can say about it. And this skill grows by using it. [[Hebrews 5:14]] By reason of use.

The news letter suggested a race. Give two models the same boring chore. Time them. Score them. Someone did it with a fifteen-field form, three runs each, and reported a median of 9.4 seconds against 17.3 seconds. We did NOT verify those numbers. The company papers were not reachable from this build, so we report them as reported and we do not claim them as proved.

THE NEIGHBOR COMES. The company said its model was more than three times faster. An outside tester got a gap closer to 1.8 times. Both can be honest. Here is why. [[Proverbs 18:17]]

Read it closely. The first one to speak SEEMS right. He is not called a liar. He is called first. A seller picked the goods, picked the test, and picked which runs to report. The fix is not suspicion. The fix is a second person. The neighbor comes.

That is why the Word says not to praise yourself. [[Proverbs 27:2]] And Paul names the exact mistake a vendor chart makes. [[2 Corinthians 10:12]] They measure themselves by themselves. Scripture does not call that a lie. It calls it not wise.

The Word also knows the other trick, where the buyer talks a thing down until he owns it. [[Proverbs 20:14]] Both mouths want something. Neither is the measure.

YOUR TASK IS THE ONE THAT MATTERS. The best line in the whole news letter was this: vendor numbers are averages over their tasks, and your task is the one that matters. The Word said it as a command. [[Galatians 6:4]] Let every man prove his OWN work. And it closes the back door, which is comparing yourself to somebody else's score. [[Galatians 6:5]]

Then Paul turns the same tool on us. [[2 Corinthians 13:5]] Examine yourselves. A person who will stopwatch a machine and never audit his own week has learned the trick and missed the point.

A JUST WEIGHT. If you are going to measure, your measure is on trial too. This is law in the Word, and it is law about business. [[Leviticus 19:35]] [[Leviticus 19:36]] Just balances, just weights - and then the reason, which is not economics. I am the LORD your God. [[Proverbs 11:1]]

Read a benchmark through that law and it reads differently. Two models scored on a task one was tuned for is two different stones in one bag. Three runs cannot settle anything scientific, and the news letter admitted that itself.

Here is the loss said honestly, because hiding it would be a crooked measure. The cheapest model was fast and got every field right only one run in three. Cheap was not worse at everything. It was worse at the one thing the job needed, which was being right every time. If you average speed and accuracy together, you lose some of the truth.

CHECKING TAKES TIME. The Word gives a test that is built to wait. [[Deuteronomy 18:21]] [[Deuteronomy 18:22]] If the thing does not come to pass, then you know. The test is time, and the verse treats not knowing yet as normal. Against that it sets the person who settles everything instantly. [[Proverbs 14:15]] And haste gets named as a sin, not a style. [[Proverbs 19:2]]

So the honest status of the big math claim is: not yet. A proof-checking program confirmed a formalization, and outside analyses of the published notes say it does not cover the sharper claim the headline rested on. The group of experts had not given a verdict. We do not teach it as settled.

SOMETIMES IT GETS BIGGER. Proving is not a machine for shrinking things. A queen travelled a long way to test a king with hard questions. [[1 Kings 10:1]] And her verdict after the test was not a correction downward. [[1 Kings 10:7]] The half was not told me.

Our own checking worked both ways. It corrected a headline loss that turned out to be mostly a bookkeeping entry rather than money burned. And it made one claim stronger: about sixty thousand people out of about 223,000 really is close to 27 percent, so that number is stated plainly.

TWO REPORTS OFF ONE PIECE OF GROUND. Moses sent twelve men to look at a land. They all walked the same ground. They all saw the same fruit, and nobody argued about the fruit. [[Numbers 13:27]] One of them said we should go. [[Numbers 13:30]] Ten of them brought back what the Word itself calls an evil report. [[Numbers 13:32]] Same land. Same grapes. Ten men and one man, off the same facts. So the difference between two reports is not always the data.

WHAT WE COULD NOT REACH, SAID OUT LOUD. Here is what this build could not do. No primary host was read. The company papers were not reachable from this build, and neither were the filing site or the research archive. So nothing here rests on reading the thing itself. We walked an independent search road instead, which is weaker, and we are telling you that rather than letting it pass as proved. A dated re-review stands against every road that was blocked, because a blocked road must never read like a verified claim.

Our checking corrected a headline, too. The forward carried a loss in the tens of billions, which reads like money burned. Independent coverage of the same filing puts almost all of it in a non-cash revaluation and the operating loss far lower. A reader given only the headline would have taken a bookkeeping entry for cash. And one figure came out STRONGER than the digest hedged it, so we say that plainly: the revenue rise is nearer fourteen-fold than the lower percentage printed.

YAHWEH INVITES THE TEST. One more thing, because it changes the posture. We test claims; we do not test Him in unbelief. But He issues one standing invitation in Scripture to be put to the test, and He issues it over the tithe. [[Malachi 3:10]] Prove me now herewith. The One who cannot fail an examination is the only one unafraid of it.

WHO TRIES THE HEART. All of the above is a method for examining work. Here is the line it may not cross. No timer and no model weighs a person. [[Jeremiah 17:9]] Who can know it - and then the answer. [[Jeremiah 17:10]] I the LORD search the heart.

And the right response is not to dodge that but to invite it. [[Psalm 139:23]] [[Psalm 139:24]] Search me. Try me. David asks for the audit.

For people, the test Yahweh gives us is a harvest, not a score. [[Matthew 7:16]] [[Matthew 7:20]] Fruit takes a season.

And the close. One Word was proved all the way down and held. He is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]] He was tested in the wilderness, tested with hard questions, tested to the cross, and He never failed one.

AND ONE LINE WE WILL NOT CROSS. There is a difference between proving a claim and arguing with the Word. We test what people say. We do not stage the Word as one opinion against another so a reader can pick a side. The Word is the ruler we measure other things by, not the thing on the scale. Paul held that line both ways at once, refusing neither the examination nor the right judge. [[1 Corinthians 4:3]] And on the timing of the final verdict. [[1 Corinthians 4:5]] Judge nothing before the time. There is a day set for it, and a fire that does the measuring. [[1 Corinthians 3:13]]

So here is the week. Prove all things. Run your own chore instead of the laboratory's. Keep one weight in the bag. Wait when the test is time. Say it plainly when the half was not told you. And say I do not know yet out loud, because that sentence is a finding and not a failure.

${TALK.youth}`;

const TEEN = `${TITLE}.

Proving a claim is a skill, and this week it gets taught as one. Prove does not mean argue; it means go and find out whether the thing is so.

PROVENANCE FIRST, BECAUSE THAT IS PART OF THE EVIDENCE. On 27 October 2026 at 19:34 universal time, Darrell forwarded a daily artificial-intelligence newsletter out of his university mailbox into this lane, and above the forwarded header he typed one word: Lesson. His word is the ask. The newsletter is only the occasion, and the article is not the foundation of the hour. Sixteen days stood between his word and this build, and that gap stays on the record.

The issue carried four stories and one question under all four. A laboratory said its model had overturned a belief computer scientists had leaned on for thirty-five years. The same laboratory, the same day, shipped a cheaper model built for computer use. That means it looks at a screen and clicks and types the way a person would. The example given was reading invoices and keying them into accounting software. A second company filed to go public with a loss in the tens of billions. A third offered sixty thousand people a way out. And the writer's own closing line was the honest one: how do you check the work? A filled form verifies in seconds. A proof takes months, a working group and a funded conference.

THE WORD SETS THE FRAME, NOT THE ARTICLE. [[1 Thessalonians 5:21]] Four words, and a command rather than a mood. It does not say prove the doubtful things; it says all things. And it does not stop at suspicion, which is where most people stop. It ends in commitment: hold fast that which is good. Proving is the road to holding, and somebody who proves nothing holds nothing.

Yahweh commends a congregation for running this on His own preacher. [[Acts 17:11]] Readiness and daily checking in the same people. Enthusiasm without checking is credulity; checking without readiness is cynicism; the Word has no use for either. John makes the duty general. He names the reason too. [[1 John 4:1]] And the risen Lord Jesus puts it in a commendation, not a rebuke. [[Revelation 2:2]]

THE EAR TRIETH WORDS. The newsletter called its own exercise a taste test with a stopwatch, which is better than its writer knew, because Scripture built that metaphor twice. [[Job 12:11]] And as a settled principle. [[Job 34:3]] A mouth does not reason about meat; it tastes it, and the tasting is the test. So a claim you have never run is a claim you have never tasted, whatever you can recite about it. And the faculty is trained rather than issued finished. [[Hebrews 5:14]]

Now the figures, placed under the frame rather than above it. The reported exercise was a fifteen-field web form. Three runs went to each of two models. The median was 9.4 seconds against 17.3. A cheaper third model was right in only one run of three. This build did not verify those stopwatch numbers. The laboratory's own pages were not read by this build. Its hosts were not reachable at this session's network boundary. They are attributed to secondary coverage here and never asserted.

THE NEIGHBOR COMES AND SEARCHES HIM. The laboratory said more than three times faster. An independent test saw about 1.8 times. Both sentences can be honest at once, and one verse explains how. [[Proverbs 18:17]] He that is first in his own cause SEEMETH just - not is a liar. A seller's account of his own goods is one-sided before anybody intends deceit. The seller chose the goods, the test and the runs reported. The remedy is not suspicion but a second party. [[Proverbs 27:2]] And on motive. [[John 7:18]]

Paul names the exact failure mode of a vendor chart, in words that could be printed on it. [[2 Corinthians 10:12]] Measuring themselves by themselves. A number produced on a self-selected task and scored on a self-written scale is self-comparison with a decimal point. Scripture does not call it lying. It calls it not wise. The same issue carried a company's own forecast of its own future. The writer said the right thing about it. Read it like a pitch deck, not a weather report. The Word also knows the buyer's version of the trick. [[Proverbs 20:14]]

And credit where checking earns it, because under-claiming is its own failure. The group now sitting over that computer-science claim includes the men who first proposed the hypothesis, and the raw data was published at that group's own request. That is a neighbor arranged on purpose. The authors of the belief were invited to kill it. [[Proverbs 25:2]]

YOUR OWN WORK, YOUR OWN TASK. The newsletter's sharpest sentence: vendor numbers are averages across their tasks, and your task is the one that matters. Scripture commands it. [[Galatians 6:4]] And closes the escape route of comparison. [[Galatians 6:5]] An average over a laboratory's chosen chores tells you about the laboratory. It tells you nothing sure about your chore. Reading the chart never converts into having run the thing. Then Paul turns the instrument on the self. [[2 Corinthians 13:5]] And Haggai says it to a nation, twice in one chapter. [[Haggai 1:5]] [[Haggai 1:7]]

A JUST WEIGHT. If you measure, the measure is itself on trial, and in the Word that is law about commerce. [[Leviticus 19:35]] [[Leviticus 19:36]] Just balances, just weights, and the reason is identity rather than economics. [[Proverbs 11:1]] The bag with a heavy stone for buying and a light one for selling is forbidden by name. [[Deuteronomy 25:13]] with a promise on the honest weight. [[Deuteronomy 25:15]]

Read a benchmark through that and it reads differently. Two models scored on a task one was tuned for is divers weights in one bag. A median of three runs is not a speed. Reported as one, it is a measure that will not bear the weight put on it. And the loss is said rather than hidden. Any compression does lose detail, and concealing that is the crooked measure. The cheapest model was fastest in price and right in one run of three. Cheap was not worse at everything; it was worse at the one thing the job required, which was being right every time. Switch to the cheaper tool only if accuracy holds.

HOW LONG PROVING TAKES. The Word gives a test explicitly built to wait. [[Deuteronomy 18:21]] [[Deuteronomy 18:22]] The test is time, and not knowing yet is treated as normal. Against it stands the man who settles everything instantly. [[Proverbs 14:15]] Haste is named a sin, not a style. [[Proverbs 19:2]] The foundation is laid as a tried stone, and the clause after it is the posture. [[Isaiah 28:16]] And James will not let waiting be dead time. [[James 1:4]]

So the honest status of the headline claim is: not yet. A proof-checking program confirmed a formalization. Independent analyses of the published scope note report something else. It does not cover the sharper running-time estimate. That estimate is what the headline rested on. The working group had returned no verdict. It had none when this was forwarded. It had none when this was built. Secondary coverage also reports a parallel result from a second laboratory the same day. The digest dropped that. It is attributed here, not asserted. The lesson does not teach the hypothesis as overturned. It teaches that the checking was unfinished, and that saying so is discipline rather than a hedge.

THE HALF WAS NOT TOLD ME. Proving is not a machine for shrinking claims. [[1 Kings 10:1]] She came to prove him with hard questions, and her verdict was not downward. [[1 Kings 10:7]] Twelve men also searched one piece of ground. They brought back two reports. Nobody disputed the fruit. [[Numbers 13:27]] One man drew the right conclusion. [[Numbers 13:30]] Ten took the same facts and brought back what the Word calls an evil report. [[Numbers 13:32]] The difference was not data.

Our own checking ran both ways. Corrected: the eighty-point-seven-five billion dollar loss is almost all a non-cash revaluation. Independent coverage puts about 72.39 billion of it in changed fair value of convertible notes and similar instruments. It puts the operating loss near 693 million. Corrected: the digest's about 1,200 percent revenue rise is the lower reading; 16.286 billion against 1.163 billion is about fourteen-fold, roughly 1,300 percent. Corrected: the scope of what the proof-checker verified. Corrected: the dropped parallel result. Two things checked out, so they are stated plainly. Sixty thousand against about 223,000 full-time employees in the company's own June 2026 filing is 26.9 percent. So the roughly 27 percent figure holds. The one-dollar and five-dollar token prices held up too, at half the larger model's rate. Not checked at all: every benchmark score, the chip-lease and datacenter numbers, and the disclosed data leak. A dated re-review stands against the blocked roads - re-review: 2026-11-26.

WHO TRIETH THE HEART. All of the above is a method for examining work, and here is the bound it may not cross. No stopwatch and no model weighs a person. [[Jeremiah 17:9]] Who can know it - and then the answer in the first person. [[Jeremiah 17:10]] That is not a capability anybody is building toward. It is His by right. A system claiming it is claiming His office. The believer's posture is invitation, which is the opposite of how we treat a benchmark. [[Psalm 139:23]] [[Psalm 139:24]] David asks for the audit. [[Psalm 26:2]] And Yahweh issues His own standing invitation to be tested. [[Malachi 3:10]]

Paul keeps the line in both directions, neither flinching from examination nor accepting the wrong judge. [[1 Corinthians 4:3]] And the timing. [[1 Corinthians 4:5]] There is a day set, and a fire that does the measuring. [[1 Corinthians 3:13]] Meanwhile the test He gives us for people and teachers is a harvest, not a metric. [[Matthew 7:16]] [[Matthew 7:20]]

The close. One Word was proved all the way down and held fast. He is a Person. He is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]] He was tested in the wilderness, tested with hard questions, tested to the cross, and failed no examination. And mark the one line this method may not cross in the other direction either. We prove claims; we do not debate the Word. The Word is the ruler we measure other things by, never the thing we lay on the scale, and the authority in this hour is His rather than the article's or the chart's. So prove all things. Run your own chore rather than the laboratory's. Keep one weight in the bag. Wait for the thing to follow or not follow. Say it plainly when the half was not told you. And remember that the last proving is not yours to run.

${TALK.teen}`;

const SENIOR = `${TITLE}.

The discipline this hour teaches is proving, and the word carries its older and stronger sense throughout: not to argue a matter, but to put a thing to the test and find out whether it is actually so.

THE PROVENANCE, STATED BEFORE THE TEACHING. On the twenty-seventh of October 2026, at 19:34 by universal time, Darrell forwarded a daily artificial-intelligence newsletter out of his university mailbox into this lane, and above the forwarded header he typed a single word: Lesson. That word is the request this hour answers; the newsletter underneath it is the occasion and nothing more, and the article is not the foundation of anything taught here. Sixteen days stood between his word and this build, and the record keeps that interval rather than smoothing it into a tidier story.

The issue carried four items and one question beneath all four of them. A laboratory announced that its model had overturned a belief that computer scientists had reasoned from for thirty-five years. The same laboratory, on the same day, released a cheaper model built for what the trade calls computer use, which means it reads a screen and then clicks and types its way through software as a person would, the stated example being the reading of incoming invoices and the entry of their details into accounting software. A second company filed to go public carrying a loss in the tens of billions of dollars. A third offered some sixty thousand of its people a voluntary way out the door. And the writer's own closing observation was the honest and useful one: both of the first two announcements share a single problem, which is how anybody is supposed to check the work. A completed form can be verified in seconds; the proof of a thirty-five-year-old conjecture requires months, a working group of specialists, and a conference that somebody has to underwrite.

THE WORD ESTABLISHES THE FRAME, AND THE ARTICLE IS PLACED UNDERNEATH IT. [[1 Thessalonians 5:21]] Four words, issued as a command rather than offered as a disposition, and observe that the verse does not restrict itself to the claims that already look doubtful: it says all things. Observe further that it does not terminate in suspicion, which is precisely where most people are content to stop, but in commitment - hold fast that which is good. Proving is the road by which a man arrives at holding, and the man who proves nothing in the end holds nothing either.

Yahweh honors this discipline so plainly that He commends an entire congregation for exercising it upon His own apostle. [[Acts 17:11]] They received the word with readiness of mind, and they also searched the scriptures daily to determine whether the things they had been told were so. Readiness and verification residing in the same people, in the same week: enthusiasm without verification is credulity, verification without readiness is cynicism, and the Word has no use whatever for either disposition. John makes the obligation general, and states its reason. [[1 John 4:1]] The reason is not that every man is a liar; it is that a sufficient number are, and that the confidence in a man's voice is no index of the truth of his claim. And the risen Lord Jesus places this work inside a commendation rather than a rebuke. [[Revelation 2:2]]

THE EAR TRIETH WORDS, AS THE MOUTH TASTETH MEAT. The newsletter described its own recommended exercise as a taste test with a stopwatch attached, which is a better sentence than its author can have realised, because Scripture had already constructed that metaphor and constructed it twice. [[Job 12:11]] And again, in Job's own mouth, no longer as a question but as a settled principle. [[Job 34:3]] The ear is given the identical office that the mouth holds. A mouth does not deliberate about meat; it tastes the meat, and the tasting is itself the test. It follows that a claim a man has never run is a claim he has never tasted, however fluently he can recite its particulars. And the faculty is not issued to anybody finished: it is trained by exercise. [[Hebrews 5:14]]

Now the article's figures may be admitted, the frame having been established from Scripture rather than borrowed from the engineering. The exercise as reported involved a fifteen-field web form, three runs upon each of two models, a median of 9.4 seconds against 17.3 seconds, and a third and cheaper model which returned every field correctly in only one run out of the three. This build verified none of those stopwatch figures and could not: the laboratory's own pages were not read by this build, its hosts having proved unreachable at this session's network boundary, and consequently no figure anywhere on this page rests upon a primary-source reading. They are attributed to secondary coverage and are nowhere asserted upon our own authority.

THE NEIGHBOR COMETH AND SEARCHETH HIM. The laboratory stated that its new model finished more than three times faster than its predecessors. An independent tester, running a smaller version of the same exercise, observed a gap nearer 1.8 times. Both sentences may be entirely honest at once, and a single verse accounts for how. [[Proverbs 18:17]] He that is first in his own cause SEEMETH just: the verse does not call him a liar, it calls him first. A seller's account of his own goods is one-sided before any intention to deceive enters the matter at all, for the seller selected the goods, selected the test, and selected which of the runs would be reported. The remedy Scripture names is accordingly not suspicion but a second and disinterested party - the neighbor comes. [[Proverbs 27:2]] And upon the question of motive. [[John 7:18]]

Paul names the precise failure mode of a vendor's benchmark, and in language that might be printed across the chart itself. [[2 Corinthians 10:12]] They measuring themselves by themselves. A figure produced upon a task the measurer selected, and scored against a scale the measurer himself composed, is self-comparison with a decimal point appended to it, and Scripture declines to call that lying: it calls it not wise. The same issue carried a company's own forecast concerning its own future, and the writer said the correct thing about the document - read it as a pitch deck rather than as a weather report - which is Proverbs 27:2 in contemporary dress. The Word is equally familiar with the inverse move, in which the interested party disparages a thing until he has possession of it. [[Proverbs 20:14]] Both mouths are interested parties, and neither of them is the measure.

And let the credit be given where the checking earns it, because to under-claim a verified good is as much a failure of truth as to over-claim an unverified one. The working group now sitting in judgment upon that computer-science claim includes the very men who first proposed the hypothesis, and the raw data was placed in public at that group's own insistence. That is a neighbor summoned deliberately, with the authors of the belief expressly invited to destroy it, and the Word has a name for that kind of honor. [[Proverbs 25:2]]

LET EVERY MAN PROVE HIS OWN WORK. The sharpest sentence in the entire forward was that a vendor's numbers are averages taken across the vendor's own tasks, whereas your task is the one that actually matters. Scripture issued that as a command concerning a man's own labor. [[Galatians 6:4]] And it closes the escape route, which is the comparison of oneself against another man's reported result. [[Galatians 6:5]] An average computed over a laboratory's chosen chores tells a man something about the laboratory and nothing certain about the single chore that is genuinely his, and no quantity of reading the chart will ever convert itself into having run the thing. Paul then turns the identical instrument upon the self, where it is considerably harder to hold steady. [[2 Corinthians 13:5]] And Haggai delivers it to an entire nation, twice within one chapter, because they did not hear it the first time. [[Haggai 1:5]] And again. [[Haggai 1:7]]

A JUST WEIGHT AND A JUST MEASURE. If a man intends to measure, then the measure he uses stands itself under judgment, and in the Word this is not a figure of speech but law, and law concerning commerce at that. [[Leviticus 19:35]] [[Leviticus 19:36]] Just balances and just weights, and then the reason given, which is not economic but a matter of identity: I am the LORD your God. Yahweh's delight and His abomination are both named over this one article. [[Proverbs 11:1]] And the bag containing two stones, a heavy one for buying and a light one for selling, is forbidden by name. [[Deuteronomy 25:13]] with a promise attached to the honest weight. [[Deuteronomy 25:15]]

Read a benchmark through that law and it reads rather differently. Two models scored upon a task for which one of them was tuned is divers weights carried in a single bag. A median drawn from three runs and then reported as a speed is a measure that will not bear the weight placed upon it, three runs being incapable of settling anything scientific, as the newsletter itself conceded. And the loss must be stated rather than concealed, since compression of any kind does lose detail and a page that hid the fact would itself be holding the crooked measure: the cheapest of the three models was the fastest in price and returned every field correctly in only one run of three. Cheaper was not worse at everything. It was worse at the single thing the work actually required, which was correctness every time, and any measure that averaged accuracy together with price would have concealed precisely that. The correct conclusion is the newsletter's own, which is to move to the cheaper instrument only where accuracy holds.

HOW LONG PROVING TAKES, AND WHY DURATION IS NOT AN EXCUSE. The Word supplies a test constructed expressly to wait. [[Deuteronomy 18:21]] [[Deuteronomy 18:22]] If the thing follow not. The test is time itself, and the verse treats a man's not yet knowing as an ordinary condition rather than as a crisis requiring resolution. Against that patience Scripture sets the man who settles every question instantly. [[Proverbs 14:15]] And haste is named as a sin rather than as a temperament. [[Proverbs 19:2]] The foundation itself is laid as a tried stone, and the clause which follows describes the posture of everyone standing upon it. [[Isaiah 28:16]] He that believeth shall not make haste. Nor will James permit the waiting to be dead time. [[James 1:4]]

The honest status of the largest claim in the forward is therefore: not yet. A proof-checking program confirmed a formalization, and independent analyses of the published scope note report that the formalization does not cover the sharper running-time estimate upon which the headline rested. The working group had returned no verdict when the newsletter was forwarded, and had returned none when this lesson was built. Secondary coverage further reports a parallel result posted by a second laboratory on the same day, which the digest did not mention, and that reaches us through coverage alone and is attributed rather than asserted. This lesson does not teach the hypothesis as overturned; it teaches that the hour of checking had not finished, and that saying so plainly is the discipline itself and not a hedge.

THE HALF WAS NOT TOLD ME. Proving is not an apparatus for diminishing claims. Sometimes the examination enlarges the thing, and a refusal to say so is the identical sin as exaggeration, merely wearing a modest coat. The queen of Sheba travelled the entire distance for one declared purpose. [[1 Kings 10:1]] She came to prove him with hard questions, and her verdict following the examination was no correction downward. [[1 Kings 10:7]] The report she had been handed had under-stated the truth, and she said as much aloud. Scripture likewise shows twelve men searching one piece of ground and returning with two reports, the fruit being real and nobody disputing it. [[Numbers 13:27]] One man drew the correct conclusion from the identical evidence. [[Numbers 13:30]] Ten took the same facts and brought back what the Word itself names an evil report. [[Numbers 13:32]] The same land, the same grapes; the difference between the reports was not data.

Our own checking accordingly ran in both directions, and both are reported. Corrected: the eighty-point-seven-five billion dollar loss is very nearly all of it a non-cash revaluation, independent coverage of that same filing placing some 72.39 billion of it in the changed fair value of convertible notes, derivative liabilities and similar instruments, and putting the operating loss nearer 693 million - a reader handed only the headline would have mistaken a bookkeeping entry for money burned. Corrected: the digest's figure of about 1,200 percent for the revenue rise is the lower of the available readings, since against the filing's own half-year comparison, 16.286 billion against 1.163 billion, the increase is approximately fourteen-fold, or roughly 1,300 percent. Corrected: the scope of what the proof-checker actually verified. Corrected: the omission of the parallel result. Stated plainly because it survived the checking: some sixty thousand against about 223,000 full-time employees in the company's own June 2026 filing is 26.9 percent, so the roughly 27 percent figure holds, and the one-dollar and five-dollar per-million token prices, at half the larger model's rate, held up across independent coverage as well. Not checked at all: every benchmark score, the chip-lease and datacenter figures carried in the news column, and the disclosed data leak. A dated re-review stands against every blocked road, because a road that was blocked must never be left reading as though it were a verified claim.

WHO TRIETH THE HEART. All of the foregoing is a method for the examination of work, and here is the bound beyond which a method becomes a falsehood. No stopwatch, no score sheet and no model weighs a man. [[Jeremiah 17:9]] Who can know it - and then the answer, delivered in the first person. [[Jeremiah 17:10]] I the LORD search the heart. That is not a capability toward which anybody is building; it is His by right, and any system which claims it is claiming His office rather than extending its own. The believer's posture beneath that searching is not avoidance but invitation, which is the exact opposite of how a man treats a benchmark. [[Psalm 139:23]] [[Psalm 139:24]] Search me, try me. David requests the audit. [[Psalm 26:2]] And Yahweh Himself issues the one standing invitation in Scripture to be put to the test, and issues it over the tithe. [[Malachi 3:10]] Prove me now herewith.

Paul holds the line in both directions at once, neither flinching from examination nor conceding it to the wrong judge. [[1 Corinthians 4:3]] And upon the timing of the final verdict. [[1 Corinthians 4:5]] Judge nothing before the time. There is a day appointed for it, and a fire which performs the measuring. [[1 Corinthians 3:13]] The fire shall try every man's work. Meanwhile the test He hands us for the examination of people and of teachers is not a metric at all but a harvest. [[Matthew 7:16]] And again. [[Matthew 7:20]] Fruit requires a season, which is the same patience the sixth movement asked for, now applied to souls rather than to software.

And the close, which is the only place a subject like this one can honestly end. The single Word that was proved the whole way down and held fast is not a proposition but a Person. He is Jesus, the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] and His throne is for ever. [[Hebrews 1:8]] He was tested in the wilderness, tested by His enemies with hard questions, tested all the way to the cross, and He failed no examination that was ever set before Him. The Word is the authority in this hour, not the article and not the chart. So prove all things; run your own chore rather than the laboratory's; keep a single weight in your bag; wait for the thing to follow or not to follow; say it plainly when the half was not told you; and remember that the last proving is not yours to run, and that the One who will run it already knows the answer.

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `PROVE ALL THINGS - THE EAR THAT TRIETH WORDS, THE NEIGHBOR WHO COMES AND SEARCHES HIM, AND EVERY MAN PROVING HIS OWN WORK.

WHO SENT THIS. On the twenty-seventh of October 2026 at 19:34 UTC Darrell forwarded a daily artificial-intelligence newsletter out of his university mailbox, with ONE WORD typed above the forwarded header: Lesson. That word is the ask; the article is the occasion. Sixteen days stood between his word and this build, and the record keeps that rather than smoothing it. Gmail thread \`1a17edb181a9c1f6\`.

WORD FIRST. The hour opens on 1 Thessalonians 5:21 - Prove all things; hold fast that which is good - a command rather than a mood, which does not stop at suspicion but ends in commitment. The Bereans are called noble for receiving the word with readiness AND searching daily whether those things were so, and the risen Lord Jesus puts the trying of false apostles inside a commendation. The newsletter's own closing question was how do you check the work. Scripture asked it first, answered it first, and named whose proving is final.

EIGHT MOVEMENTS. Prove all things (1 Thessalonians 5:21; Acts 17:11; 1 John 4:1; Revelation 2:2). The ear trieth words - the taste test the Word built twice (Job 12:11; Job 34:3; Hebrews 5:14). The neighbor comes and searches him (Proverbs 18:17; Proverbs 27:2; John 7:18; 2 Corinthians 10:12; and the honor of kings, Proverbs 25:2). Let every man prove his own work (Galatians 6:4-5; 2 Corinthians 13:5; Haggai 1:5, 7). A just weight and a just measure (Leviticus 19:35-36; Proverbs 11:1; Deuteronomy 25:13, 15). How long proving takes (Deuteronomy 18:21-22; Proverbs 14:15; Proverbs 19:2; Isaiah 28:16; James 1:4). The half was not told me (1 Kings 10:1, 7; Numbers 13:27, 30, 32). Who trieth the heart (Jeremiah 17:9-10; Psalm 139:23-24; Psalm 26:2; Malachi 3:10; 1 Corinthians 4:3, 5; 1 Corinthians 3:13; Matthew 7:16, 20).

TRUST BUT VERIFY. The newsletter is a lead, never the citation. NO primary host was read by this build - openai.com, arxiv.org and sec.gov were not reachable at the session's network boundary - so no figure here rests on a primary-source read, and that is said in every reader place with a dated re-review. An independent search road was walked on each load-bearing number. The checking CHANGED four things: the 80.75 billion dollar loss is almost all a non-cash revaluation, about 72.39 billion of it in changed fair value of convertible notes and similar instruments, with the operating loss near 693 million; the digest UNDER-stated the revenue rise, which against the filing's own half-year comparison is about fourteen-fold rather than about 1,200 percent; what the proof-checker verified is narrower than the headline, the published scope note not covering the sharper running-time estimate; and a parallel result from a second laboratory the same day had been dropped. Two things checked out STRONGER and are stated plainly: the roughly 27 percent of staff figure, which arithmetic confirms at 26.9 percent, and the one-dollar and five-dollar token prices at half the larger model's rate. The stopwatch figures, the working-group names and the parallel result are attributed to secondary coverage and never asserted.`,
  inApp: `No new screens this week. One page in your Study, and one race you run yourself.

Head a page PROVED and date it. Draw three columns: CLAIM, WHO SAID IT, HOW I CHECKED. Then fill it from your own week - what you repeated, who you got it from, and whether you ever once put it in your mouth. Mark every row you could not check with the reason, not with a shrug.

Then run the race. Pick one chore you can actually grade, with fake data and a throwaway form. Run the same instructions three times on a cheaper tool and three times on a dearer one. Score two things and only two: how many runs came out fully right, and how long each took. Keep one weight in the bag - same task, same instructions, same scale - and write the numbers down before you have an opinion about them.

Under the page write one verse you will have in you by next week, from the anchors of this hour, and the four places of Deuteronomy 6:7 where you will say it: at the table, on the way, at lying down, at rising up.

Then open your record under Learn and take one exam again with nothing else open. Every try counts as study. The columns show you how much of your week was borrowed; the race shows you what the chart could not; and the verse you learn by heart is the part no outage and no vendor can reach.`,
  anchor: {
    ref: 'FILLED-BY-GENERATOR',
    theme:
      'Prove all things; hold fast that which is good (1 Thessalonians 5:21). Proving is a command, not a mood, and it ends in commitment rather than suspicion. The ear tries words the way the mouth tastes meat (Job 12:11), the one who is first in his own cause only seemeth just until a neighbor comes and searches him (Proverbs 18:17), every man is told to prove his OWN work rather than read somebody else’s average (Galatians 6:4), and the measure itself stands under judgment (Leviticus 19:36). Where the method must stop is the heart, which Yahweh alone searches (Jeremiah 17:10).',
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them yours rather than a chart's.

ONE, AUDIT WHAT YOU REPEATED. For three days write down every claim you passed along - at work, at the table, in a message - and beside it the person or page you got it from. Then mark which ones you had actually checked. The ratio is the finding.

TWO, FIND THE PRIMARY. Take the single claim you leaned on hardest this week and try to reach the thing itself: the filing, the study, the maintainer's own page. Write down what you found AND write down what refused you. A blocked road is a finding and must never be written up as a verified claim.

THREE, RUN THE RACE. Pick a chore you can grade. Use dummy data and a throwaway form, because a tool that clicks around the web can be misled by whatever is on the page. Three identical runs on a cheaper tool, three on a dearer one. Record runs fully correct, and seconds.`,
    plan: `PLAN. Decide the measure BEFORE you see the result, because a scale written afterwards is the light stone in the bag.

Four lines on one card. The one claim I will stop repeating until I have checked it. The one chore I will race, and the two things I will score. The one weight I will keep the same on both sides. The one thing I am content to take on somebody's word, named on purpose rather than by drift, with the reason.

For a family, add the fifth line: the hour in the week when somebody at the table has to say how he knows a thing, and is not teased for answering I do not know yet.`,
    execute: `EXECUTE. Keep the card for one week, out loud, with one other person.

Run the race and write the numbers before you form an opinion of them. Report the result that went against you as plainly as the one that helped you; that is the just weight. Where a road was blocked, say which host refused and put a date on going back. Then say the verse in all four places of Deuteronomy 6:7 until it is in you rather than on a page, take one exam again in this app with nothing else open, and tell one person what your checking changed - including the place where checking made the thing BIGGER than you had been told.`,
  },
  media: [],
  benefits: [
    'Darrell’s one word, Lesson, over an engineering newsletter, answered from the Word first: Prove all things is a command and not a mood (1 Thessalonians 5:21).',
    'The newsletter’s own closing question - how do you check the work - met with the passage that asked it first and did not stop at suspicion but ended in holding fast.',
    'The Bereans read as the posture rather than the exception: readiness of mind AND daily searching, in the same people, in the same week (Acts 17:11).',
    'The trying of false apostles found inside a commendation from the risen Lord Jesus, not a rebuke (Revelation 2:2).',
    'The taste test with a stopwatch given its older and better form: the ear trieth words as the mouth tasteth meat (Job 12:11; Job 34:3).',
    'Discernment named as a trained faculty rather than an issued one - by reason of use (Hebrews 5:14).',
    'The one verse that explains how a vendor and an independent tester can both be honest at once: he that is first in his own cause seemeth just (Proverbs 18:17).',
    'Paul naming the exact failure mode of a vendor’s benchmark chart in words that could be printed on it - measuring themselves by themselves (2 Corinthians 10:12).',
    'The buyer trick kept beside the seller trick, so neither interested mouth is mistaken for the measure (Proverbs 20:14; Proverbs 27:2).',
    'Your task is the one that matters, stated as a command about a man’s own labor, with the comparison escape route closed (Galatians 6:4-5).',
    'The measure itself placed under judgment, as commerce law and not metaphor: just balances, just weights, divers weights forbidden by name (Leviticus 19:35-36; Deuteronomy 25:13).',
    'The honest loss said rather than hidden: the cheapest tool was right in one run of three, so cheaper was worse at the one thing the work required.',
    'A test built to wait, so not knowing yet is treated as normal rather than as a crisis (Deuteronomy 18:21-22; Isaiah 28:16).',
    'The no-under-claiming side taught from the queen of Sheba: checking sometimes enlarges the thing, and the half was not told me (1 Kings 10:7).',
    'Twelve men, one piece of ground, two reports, and the difference named as something other than data (Numbers 13:27, 30, 32).',
    'A trust-but-verify note that names every blocked host, lists what the checking corrected AND what it made stronger, and carries a dated re-review.',
    'The bright line kept: no stopwatch and no model weighs a man, because Yahweh alone searches the heart, and the believer’s posture under that is invitation (Jeremiah 17:10; Psalm 139:23).',
    'A three-column page and a graded race a family can run this week, with the measure written down before the result is seen.',
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The scale in the back of the shop',
      body: `A man kept a feed store on a county road for thirty-one years, and the thing he was known for was not his prices. It was that he would weigh your order again, in front of you, on a second scale in the back, if you asked him to. Almost nobody ever asked. But everybody knew the second scale was there, and that was the whole point of it.

His son came into the business out of school with a better idea. The supplier had begun printing the weight on the sack, certified, with a seal, and the son could not see the sense in weighing a sack that already said what it weighed. It slowed the line and it looked like distrust. For about two years they did it the son way, and nothing went wrong, and the son was quietly satisfied that he had been right.

In the third year a sack came in light. Not very light. About four percent light, which is the kind of light that nobody notices and everybody pays for. A farmer with a long memory and a small operation came in and said he thought his sacks had been running short since the spring, and he could not prove it, and he knew how that sounded.

The old man took him to the back and weighed six sacks. Four were fine. Two were short. The supplier, when called, was not dishonest about it; a filling line had drifted and the certified print came off the order sheet rather than off the scale. It was corrected in a week.

What the son remembered afterwards was not the supplier. It was that the seal had been genuine the entire time. The number on the sack was printed by an honest company on a line that had quietly gone wrong, and the only thing in the county that could have caught it was a second scale in the back of a feed store, kept by a man who had never stopped weighing things he had already been told the weight of.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The nurse who kept her own notebook',
      body: `A hospital put in a new system that read a patient chart and suggested the next step, and the training said it agreed with the senior staff ninety-four percent of the time. The number came from the company that sold it, measured on cases the company had selected, and nobody at the hospital had any reason to think the company was lying, because the company was not lying.

One night nurse did a thing nobody asked her to do. She kept a notebook. For eleven weeks, on her own ward, with her own patients, she wrote down what the system suggested and what the attending physician actually did, and at the end of each shift she marked whether they had matched.

Her ward was a geriatric ward. Her number was not ninety-four percent. It was closer to seventy, and almost all of the gap sat in one place: patients on more than five medications, where the system kept suggesting a dose that the physicians kept adjusting downward.

She did not announce that the system was bad, because it was not bad. She took eleven weeks of her own handwriting to the committee and said, this is what it does on my ward, and my ward is not the ward it was measured on. They kept the system. They added a rule that on five or more medications a human sets the dose, and they wrote her ward name into the rule.

Two years later a visiting administrator asked her what had made her start the notebook. She said nobody had told her not to trust the ninety-four percent. She just noticed that it was not a number about her patients, and that the only person who could get a number about her patients was somebody standing where she was standing.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'What does 1 Thessalonians 5:21 command, and where does the verse END?',
        options: [
          'Prove the doubtful things, and then move on',
          'Prove all things - and it ends in commitment, hold fast that which is good, not in suspicion',
          'Prove nothing, because testing is a sign of unbelief',
        ],
        answer: 1,
        explain:
          'It says all things, not the doubtful ones, and it does not stop where most people stop. Proving is the road to holding, and a man who proves nothing in the end holds nothing either.',
      },
      {
        q: 'Why does Yahweh call the Bereans noble in Acts 17:11?',
        options: [
          'Because they accepted everything Paul said without question',
          'Because they received the word with readiness AND searched the scriptures daily whether those things were so',
          'Because they refused to listen until the apostle produced credentials',
        ],
        answer: 1,
        explain:
          'Readiness and checking in the same people, in the same week. Enthusiasm without checking is credulity and checking without readiness is cynicism, and the Word has no use for either one.',
      },
      {
        q: 'What office does Job 12:11 and Job 34:3 give to the ear?',
        options: [
          'The office of a judge, who hears arguments and rules on them',
          'The office of the mouth - the ear trieth words as the mouth tasteth meat, so the tasting IS the test',
          'The office of a witness, who only reports what was said',
        ],
        answer: 1,
        explain:
          'A mouth does not reason about meat; it tastes it. So a claim you have never run is a claim you have never tasted, however fluently you can recite it. And Hebrews 5:14 says the faculty is trained by use.',
      },
      {
        q: 'How does Proverbs 18:17 explain a vendor saying three times faster while an independent tester measures 1.8 times?',
        options: [
          'One of them must be deliberately lying',
          'He that is first in his own cause seemeth just - the seller chose the goods, the test and the runs; the remedy is a neighbor who comes and searches him',
          'Benchmarks cannot be compared at all, so neither number means anything',
        ],
        answer: 1,
        explain:
          'The verse does not call the first speaker a liar. It calls him first. A seller’s account of his own goods is one-sided before any intent to deceive, and Scripture’s answer is a second party rather than suspicion.',
      },
      {
        q: 'What phrase does Paul use in 2 Corinthians 10:12 that describes a vendor benchmark exactly?',
        options: [
          'Measuring themselves by themselves, and comparing themselves among themselves',
          'Speaking peace where there is no peace',
          'Casting about for a more favourable report',
        ],
        answer: 0,
        explain:
          'A figure produced on a self-selected task and scored on a self-written scale is self-comparison with a decimal point. Scripture does not call that lying; it calls it not wise.',
      },
      {
        q: 'What does Galatians 6:4 command about measurement, and what escape route does Galatians 6:5 close?',
        options: [
          'Compare your work to the best in your field; and it closes the route of excusing yourself',
          'Let every man prove his OWN work; and it closes comparison, for every man shall bear his own burden',
          'Submit your work to the elders; and it closes the route of private judgment',
        ],
        answer: 1,
        explain:
          'Your task, your burden. An average over a laboratory’s chosen chores tells you about the laboratory and nothing certain about the one chore that is genuinely yours.',
      },
      {
        q: 'Why does the lesson read a benchmark through Leviticus 19:36 and Deuteronomy 25:13?',
        options: [
          'Because measuring is forbidden to believers',
          'Because Just balances, just weights makes the MEASURE itself answerable - two models scored on a task one was tuned for is divers weights in one bag',
          'Because the law of weights applies only to grain and oil',
        ],
        answer: 1,
        explain:
          'If you intend to measure, the measure stands under judgment too, and the reason given is identity rather than economics: I am the LORD your God. A scale written after the result is the light stone.',
      },
      {
        q: 'What is the honest status of the computer-science claim in the forwarded newsletter?',
        options: [
          'Overturned, since a proof-checking program verified the result',
          'Not yet - the proof-checker confirmed a formalisation whose published scope note does not cover the sharper estimate the headline rested on, and the working group had returned no verdict',
          'Disproved, since an independent tester found a smaller gap',
        ],
        answer: 1,
        explain:
          'Deuteronomy 18:22 gives a test built to wait: if the thing follow not. The lesson teaches that the checking was unfinished, and saying so plainly is the discipline rather than a hedge.',
      },
      {
        q: 'What did the queen of Sheba conclude after she came to prove Solomon with hard questions?',
        options: [
          'That the reports had been exaggerated and she had travelled for nothing',
          'The half was not told me - the report she had been handed had UNDER-stated the truth, and she said so aloud',
          'That she could not tell whether the reports were true',
        ],
        answer: 1,
        explain:
          'Proving is not an apparatus for shrinking claims. Under-claiming a verified good is the same sin as exaggeration in a modest coat, which is why this lesson states plainly the figures that checked out stronger.',
      },
      {
        q: 'Where must the method of this whole lesson stop?',
        options: [
          'At the heart - no stopwatch and no model weighs a man, for I the LORD search the heart, and the believer answer is invitation: search me, try me',
          'At the vendor chart, which may never be questioned',
          'At the point where a claim becomes too expensive to check',
        ],
        answer: 0,
        explain:
          'Jeremiah 17:10 reserves it, and it is His by right rather than a capability anybody is building toward. Psalm 139:23 is the posture, 1 Corinthians 4:5 the timing, and the one Word proved all the way down is a Person - Jesus, the Lamb of Yahweh.',
      },
    ],
  },
  facilitator: {
    howToRun: `HOW TO RUN THIS HOUR. Sixty minutes, built on one question: how do you know?

OPEN WITH THE WORD, NOT THE ARTICLE (6 min). Read 1 Thessalonians 5:21 and Acts 17:11 before anybody mentions a computer. Ask the room what the first verse ENDS in, and do not move on until somebody says hold fast that which is good. Proving ends in holding, not in doubt.

NAME THE OCCASION HONESTLY (4 min). One word, Lesson, typed over a daily newsletter, forwarded sixteen days before this hour. Say that the newsletter is the occasion and the Word is the authority, and say that no primary host was reachable from this build, so nothing on the page rests on a primary-source read.

THE TASTE TEST (8 min). Job 12:11 and Job 34:3. Ask the room for one thing each person has an opinion about and has never once run. Let the silence sit.

THE NEIGHBOR (10 min). Proverbs 18:17, then Proverbs 27:2 and 2 Corinthians 10:12. Give the vendor number and the independent number and ask how both can be honest. Land on: he is not a liar, he is first.

YOUR OWN WORK (8 min). Galatians 6:4-5 and 2 Corinthians 13:5. Move it from machines to the week each person actually had.

THE WEIGHT (8 min). Leviticus 19:35-36 and Deuteronomy 25:13. Ask what a scale written AFTER the result is. Then name the loss out loud: the cheapest tool was right one run in three.

THE WAIT AND THE ENLARGEMENT (8 min). Deuteronomy 18:21-22 and Isaiah 28:16 for the patience; 1 Kings 10:7 and Numbers 13:27-32 for the other direction. Checking sometimes makes the thing bigger.

THE BOUND, AND THE CLOSE (8 min). Jeremiah 17:9-10, then Psalm 139:23-24 as the posture. Close on the one Word proved all the way down: Jesus, the Lamb of Yahweh. Hand out the three-column page and the race.`,
    talkingPoints: [
      'One word, Lesson, over a newsletter, and sixteen days before it was built; the gap is reported, not smoothed.',
      'The newsletter’s own closing question was how do you check the work. Scripture asked it first and ended it in holding fast rather than in doubt.',
      'Prove all things is a command, not a mood, and not restricted to the claims that already look doubtful.',
      'The Bereans were noble for readiness AND daily searching; the Word has no use for either half alone.',
      'The risen Lord Jesus puts the trying of false apostles in a commendation (Revelation 2:2).',
      'The ear trieth words as the mouth tasteth meat; a claim you never ran is a claim you never tasted.',
      'He that is first in his own cause seemeth just - not a liar, FIRST. The seller chose the goods, the test and the runs reported.',
      'Measuring themselves by themselves is Paul’s phrase for a self-scored benchmark, and he calls it not wise rather than false.',
      'Your task is the one that matters; let every man prove his OWN work, and bear his own burden.',
      'The measure is on trial too: just balances, just weights, and divers weights in a bag forbidden by name.',
      'The loss stated, not hidden: the cheapest tool was right in one run of three, so cheap was worse at the one thing the job needed.',
      'Deuteronomy 18:22 is a test built to WAIT, so not knowing yet is ordinary rather than a crisis.',
      'The half was not told me: checking sometimes enlarges a claim, and refusing to say so is its own lie.',
      'No primary host was reachable from this build; the blocked hosts are named in every band with a dated re-review.',
      'The bound: no stopwatch weighs a man. I the LORD search the heart - and the believer’s answer to that is search me, try me.',
    ],
    discussionPrompts: [
      'What did you repeat this week that you never checked, and who did you get it from?',
      'Name one thing you have a firm opinion about and have never once run yourself.',
      'How can a vendor and an independent tester both be honest about the same tool? What does Proverbs 18:17 add?',
      'Who writes your scale, and do you write it before or after you see the result?',
      'Where in your life is the honest answer I do not know yet, and why is that hard to say out loud?',
      'When has checking something made it BIGGER than you had been told?',
    ],
  },
  lesson: LESSON.join('\n\n'),
  levels: { child: CHILD, youth: YOUTH, teen: TEEN, senior: SENIOR },
};

// -----------------------------------------------------------------------------
// Fill: reader places FIRST so anchor.ref is derived from them alone (DR-0734).
// -----------------------------------------------------------------------------
const filledLesson = fill(MODULE.lesson, true);
const filledLevels = {
  child: fill(MODULE.levels.child, true),
  youth: fill(MODULE.levels.youth, true),
  teen: fill(MODULE.levels.teen, true),
  senior: fill(MODULE.levels.senior, true),
};
const rest = fillDeep({ ...MODULE, lesson: '', levels: {} });
const filled = {
  ...rest,
  lesson: filledLesson,
  levels: filledLevels,
  anchor: { ...rest.anchor, ref: readerRefs.join('; ') },
};

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov77: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov77: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov77: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov77: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov77: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov77: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov77: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov77: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov77: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov77: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov77: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov77: spliced ${ID}`);
console.log(`sov77: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov77: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
console.log(
  `sov77: lesson ${filled.lesson.length} chars; bands child ${filled.levels.child.length}, youth ${filled.levels.youth.length}, teen ${filled.levels.teen.length}, senior ${filled.levels.senior.length}`
);
