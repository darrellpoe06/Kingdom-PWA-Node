// =============================================================================
// sov94-fill - build Sovereign A.I. week 94 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose holds only a reference in double brackets, [[Haggai 1:6]], and this
// script replaces it with the corpus text followed by the reference. No verse
// on the page was typed from memory. anchor.ref is DERIVED from the
// placeholders that occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. ByteByteGo sent "The Roundup" on 2026-11-11.
// Darrell forwarded it into the lesson lane with ONE WORD above it: Lesson.
// Gmail thread `1a1cb80997812109`. Built 2026-11-18. Sponsor blocks, images and
// links are left out.
//
// ONE TEACHING, ONE LESSON (DR-0610). lesson-already-built.mjs --thread
// returned NOTHING FOUND. The roundup carries four items and three of them are
// already owned: the bottleneck moving from writing code to trusting it is
// week 60's; the language runtime as a dependency (PHP2Shell) is Software
// Project Management week 11 and this course's weeks 66 and 67; the gateway
// is week 93. This week owns the ONE question the roundup asks and nobody in
// this course has taught: a count of merges is not a count of good work -
// throughput without the rate of what comes back is half a picture.
//
// WORD FIRST (DR-0127 / DR-0282). Haggai 1:6 - wages put into a bag with
// holes - and 2 Chronicles 24:13 - the work was perfected - frame the hour
// before a word about a merge. Neither is the anchor of an earlier week of
// this course (counted on the catalog's anchor.ref before writing: 0 and 0).
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). REPORTED: every figure in
// the roundup (the share of pull requests begun by agents, the daily merges,
// the team size, the resource savings, the filing's numbers); none was checked
// against GitHub's or Anthropic's own pages, and the filing is not used to
// carry the lesson. ESTABLISHED: throughput without a defect rate is half a
// measure. MEASURED in our own house, from git on origin/main at 5d16069df.
// NOT MEASURED: how many changes merged to main later needed repair.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 94;
const ID = 'sov94-a-bag-with-holes';
const TITLE = 'A bag with holes - counting what comes back, not only what goes out';

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
  if (!m) throw new Error(`sov94: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov94: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov94: reference does not resolve in the corpus -> "${ref}"`);
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
// still gets the tiers, the house finding and the date (DR-0795).
// -----------------------------------------------------------------------------
const REVIEW = 're-review: 2026-12-02';

const FACTS = {
  lesson: `WHERE WE STAND ON THE FACTS. REPORTED: every number in the newsletter - the share of pull requests begun by agents and how fast it grew, the monthly total, the share merged within two weeks, the daily merges on the new system, the size of the team that built it and the savings it claims, and every figure from the company's filing to go public - comes to us from the newsletter alone. We take them on trust; we did not check them against the companies' own pages, and the filing's figures are left out of this lesson on purpose. ESTABLISHED, and stated plainly: a count of work shipped, without a count of the work that came back, is half a measure. That is standard in every trade that builds things, and the newsletter says it correctly. MEASURED in our own house, from the history of our own main branch: the changes merged in thirty days, the changes merged on the day this was built, the reverts in that window and in all our history, the change found wrong and repaired the same day, and the line of finished changes that once could not merge. NOT MEASURED: how many of the changes merged to our main branch later needed repair. Nothing in the house counts that yet. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. A newsletter told us some big numbers about other companies. We did not check those numbers ourselves, so we took the newsletter at its word. It is sure that counting what you send out is not enough. You must also count what comes back broken. Builders have known that for a long time. We counted our own work by reading our own records. We do not know yet how many of our own changes had to be fixed later. Nobody has counted that. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. The newsletter's numbers about other companies came from the newsletter, and we did not check them against the companies' own pages. That counting output without counting what comes back is only half a measure is well known in every trade. Our own house numbers were read from our own records: the changes merged in a month and in one day, the reverts, the same-day repair, and the line of work that could not merge. How many of our changes later needed fixing has not been measured yet. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. Reported: the newsletter's numbers about other companies, which we did not check against their own pages. Established: throughput with no defect rate is half a picture. Every trade knows it. Measured: our merges in thirty days and in one day, our reverts, our same-day repair, and our line of stuck work, each read from our records. Not measured: how many of our merged changes later needed a fix. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. The figures the newsletter attributes to other companies are reported as it gives them; they were not checked against those companies' own publications, and the figures from the public filing are deliberately left out. That a count of output without a count of what returns is only half a measure is established across every building trade and is stated without hedging. Every statement about this house is traced to the history of its own main branch: the merges in thirty days and on a single day, the reverts in that window and in all its history, the defect repaired the same afternoon, and the line of finished work that once could not merge. How many merged changes later required repair has not been measured, and no conclusion is offered. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  'And measure the growth the Word’s way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - what is something you finished fast that you had to do over - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Haggai 1:6. Children, ask your mother, your father or a grandparent about a job they did slowly and well that is still standing today; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what do we count in our week, and what comes back that nobody counts. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - what did you make that you had to fix after - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, 2 Chronicles 24:13. Children, ask your mom or your dad or your grandma or your grandpa about something they built that is still good today. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what is one thing we should check before we say done. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when did going fast cost you more time later - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Ezekiel 13:11. Children, ask your mom, your dad or a grandparent who checked their work when they were young, and what that person caught; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: what do we finish that we never look at again. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what number do people use to judge you that does not tell the whole story - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Nehemiah 4:10. Children, ask your mom, your dad or a grandparent about a place they worked that counted the wrong thing, and what happened; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: who checks our work, and is that person worn out. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what have you made that you were proud of, and is it still standing - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, 1 Corinthians 3:13. Children, ask your parents or your grandparents about a time they built something slowly so it would last, and what they would have lost by hurrying; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: which of our counts tells us how much, and which tells us of what sort. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no figure from the newsletter stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.
WHO SENT THIS, AND WHEN. On the eleventh of November 2026 the ByteByteGo newsletter sent its roundup of the month in software. Darrell forwarded it into this lane with ONE WORD typed above it: Lesson. That word is the ask; the newsletter is only the occasion. The roundup carries four stories. Three of them are already taught in this house, and this week names where. The fourth is a single question the author asks in passing, and it is the one this hour is built on: when the count of finished work goes up, who is counting what comes back?
THE WORD FIRST, BEFORE ANY NUMBER. Two verses frame this hour. After the exiles came home, they built their own houses, and the house of Yahweh lay waste. They were busy. They worked hard. And the prophet told them what all that work came to: [[Haggai 1:6]] Every sack of wages was filled at the top and counted at the top. The hole was in the bottom, and nobody was counting the bottom. Yahweh's word to them was not work harder. It was this, twice over: [[Haggai 1:5]]
The second verse is the other end of the same story. When King Joash set out to repair the house, money came in day after day, in abundance, and the scribe counted it every evening. But the money was never the measure. The measure was the house: [[2 Chronicles 24:13]] Not how much was gathered. Whether the work was perfected, the house set in its state, and strengthened.`,
  `HOW MUCH, AND OF WHAT SORT. Paul gives a builder the one measure that no count of output can stand in for: [[1 Corinthians 3:13]] The fire does not ask how many. It asks of what sort. A day is coming that declares every man's work, and the work that was only fast will be found out on that day, not on the day it was finished.
Ezekiel saw the cheap version of finishing. A wall went up, and others came behind the builder and covered its cracks with plaster that had never been mixed right: [[Ezekiel 13:10]] It looked finished. It passed inspection by everyone who only looked. And Yahweh said what would happen to it when the weather came: [[Ezekiel 13:11]] Then comes the question that is asked after every fall, and it is the question this week is about: [[Ezekiel 13:12]] Where is the daubing? Who said this was done?`,
  `WHAT THE NEWSLETTER REPORTS, IN OUR WORDS. The roundup's first story is about who writes the first draft of new code. It reports that in September more than four in ten pull requests on GitHub began as a first draft written by an agent, up from fewer than one in five in March, which it reckons at around a hundred and ten million in a single month. It reports that one A.I. company replaced the version control system in its largest code store with one it built itself, that daily merges there grew from about two and a half thousand in May to more than thirty thousand in September, and that seven people built and moved it in five months.
Those are the newsletter's numbers, and we pass them on as its report. What makes the story worth an hour is not the numbers. It is the three questions the author asks of his own numbers.
First, who is reviewing a hundred and ten million pull requests a month? The report says nine in ten of the ones an agent touched were merged within two weeks. That might mean the code is better. It might mean the reviewing is thinner. The number alone cannot tell you which.
Second, how does anyone know which work an agent began? An agent can commit under a person's account and leave no trace of itself, so the true share may be higher than anyone counted.
Third, of those thirty thousand merges a day, how many were later undone? The author's own sentence is the lesson in plain words: throughput without a defect rate is not the whole picture.
His conclusion is that writing code has become the cheap part. The scarce things now are the hours a person has to review it, the capacity of the machines that test it, and the rate at which finished work can actually be merged. He expects the next tools to be about checking code, not writing it.`,
  `THE BOTTLENECK IS THE BEARER, NOT THE STONE. Nehemiah's builders hit exactly that wall halfway up the wall: [[Nehemiah 4:10]] They did not run out of stones. They ran out of strength in the men who carried them. When the writing of code costs almost nothing, a team has the same problem in a new form. There is more to carry than there are hands to carry it, and the first hands to tire are the ones that check.
That is why a fast merge is not good news on its own. Solomon says it about any hurried road: [[Proverbs 19:2]] Speed is not the sin. Speed without knowledge is. A team that merges in a day with a reviewer who read every line knows something. A team that merges in a day because no one had the hour to read it knows nothing, and the count of merges looks exactly the same in both houses.`,
  `OUR OWN HOUSE, MEASURED, NOT PAINTED. This house builds the family app with an A.I. agent doing most of the typing, so the newsletter's three questions are our questions. Here is what our own records say, read from the history of the main branch.
In the thirty days from the nineteenth of October to the eighteenth of November, four hundred and twenty-nine changes were merged to our main branch. On the eighteenth of November alone, the day this was built, there were forty-five. So the first half of the newsletter's picture is true here too: the writing is not the slow part any more.
Now the second half. In those thirty days, not one change was reverted. In the whole history of the branch, two thousand eight hundred and fifty-nine changes, four were reverted. That looks like a perfect record. It is not a record of anything, and this is the part of the lesson the newsletter's own question does not reach. A revert is only one way a defect comes back. This house almost never reverts. It repairs forward. On the eighteenth of November a change that put the reading voice on the church's own server merged in the morning, the first run of its health check read another service's answer as the voice's, and a second change repaired that check the same afternoon. The defect was real, it was found, and it was fixed. And the count of reverts did not move.
Could we count repairs instead? We tried. Our change titles follow no single habit for a repair: four in that window begin with the word fix, twelve contain it somewhere, and the same-day repair above contains it nowhere. That is not a measure either. So we say it plainly: this house does not yet count how many of its merged changes later needed repair. That is the escaped-defect count the newsletter's author tells leaders to start measuring, and we do not have it.`,
  `WHAT THE HOUSE DOES HAVE. What this house has instead is a gate at the front and a rule about the gate. Roughly two thousand test files run against every change, and a change that fails one is not merged, by machine, not by anyone's opinion. A gate is not a defect count. It tells you what was caught before the merge. It cannot tell you what got past. But it is where the house spends the scarce thing the newsletter names, the checking, on purpose.
And the newsletter's third scarce thing, the rate at which finished work can merge, this house has met head on. In September every open change the agent had finished was green and could not merge, because each one appended a line to the same two shared ledger files, every merge knocked the others out of date, and the test run took about twenty minutes to repeat. The house built a workflow that now carries main into each waiting change and resolves only those two ledger files by rule, refusing anything else. Today the lessons built in this lane still wait their turn behind each other, because each one adds to the same course file. This lesson will wait its turn too. That queue is not a failure. It is what a merge rate looks like when it is the bottleneck.`,
  `THE OTHER STORIES, AND WHERE THEY LIVE. The roundup's last story is that a language runtime is a dependency too, and that running one past its end of life leaves every application on it open; that teaching is already in this course's weeks on the strongest wall and on what cannot be patched, and in the eleventh week of Software Project Management. This house keeps a register that dates every runtime it pins and fails the build on a pin past its date. The story about a router choosing the model is for another week. The bottleneck moving from writing code to trusting it is week sixty's. This week keeps to one thing.`,
  `WHAT TO COUNT. If the newsletter is right that checking is the new bottleneck, then a builder needs to count three things, not one. How much went out. How much came back. And how long the checking took and who did it. The author's own list is cycle time, escaped defects and review load. The Word's list is older and shorter: how much, and of what sort.
Haggai's people were not lazy. They were counting the wrong end of the bag. Joash's scribe was not wrong to count the money; he was wrong only if he had stopped there. The house was the measure. Ask of every count you keep: does this tell me how much, or of what sort? If every number you have answers how much, the hole in the bottom of the bag is still uncounted.`,
  `IT IS FINISHED. There is one work in all of history that never came back for repair. Jesus said of it, at the end: [[John 19:30]] He is the Lamb of Yahweh, [[John 1:29]] the Son the Father gave, [[John 3:16]] the Eternal Son whose throne stands for ever, [[Hebrews 1:8]] and the One by whom all things consist. [[Colossians 1:17]] Every other work, ours included, is tried by fire. His was finished, and it stands.`,
  `FOUR THINGS FOR THE HOUSE. One: count what comes back, not only what goes out, and if your house repairs forward, count the repairs, not the reverts. Two: when work is approved quickly, ask whether that means it was good or that no one had the hour to read it. Three: name the scarce thing - the reviewer's hour, the test machine's capacity, the merge line - and spend it on purpose. Four: for every number you keep, ask whether it measures how much or of what sort. Every one of those is a household habit before it is an engineering one: the chores done fast that have to be done again, the bag filled at the top with a hole in the bottom, and the work that is still standing years later because someone checked it.`,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.
WHO SENT THIS. Darrell read an email about people who make computer programs. He sent it to us with one word on top. The word was Lesson. So here it is.
THE WORD FIRST. Long ago, some people came home after a long time away. They worked very hard on their own houses. But they did not fix Yahweh's house. The prophet Haggai told them what all their work was like. Here is what the Bible says. [[Haggai 1:6]] Think about a bag with a hole in the bottom. You put money in the top. You count it as it goes in. But it falls out the bottom, and you do not see it go.
Here is a second verse. A king named Joash wanted to fix Yahweh's house. People brought money every day. Lots of money! But money was not the goal. The goal was a strong house. [[2 Chronicles 24:13]] The house was made strong again. That is how they knew the work was good.
HOW MUCH, OR HOW GOOD. Paul said a day is coming that will test all our work. [[1 Corinthians 3:13]] The fire does not ask how much you made. It asks what kind of work it was.
A man named Ezekiel saw a wall that looked done. But people had just covered the cracks with bad paste. [[Ezekiel 13:10]] When the big storm came, the wall would fall down. [[Ezekiel 13:11]] And then people would ask, who said this was done? [[Ezekiel 13:12]]
WHAT THE EMAIL SAID. Today, computers can help write programs very fast. The email said lots of new program work now starts with a computer helper. Some teams finish thousands of changes every day. Those are the email's numbers. We did not count them.
But the writer asked a good question. How many of those changes came back broken? He said counting how much you finish is only half the story. You also have to count what comes back.
He said the slow part now is checking. Writing is fast. Checking still takes a person, and people get tired.
TIRED HELPERS. Nehemiah's builders got tired too. They said this. [[Nehemiah 4:10]] They had lots of stones. They did not have enough strong arms to carry them.
The Bible also says going fast is not good if you do not know what you are doing. [[Proverbs 19:2]]
OUR OWN APP. We build our family app with a computer helper. So we counted our own work, by reading our own records.
In one month, we finished four hundred and twenty nine changes. In one day, we finished forty five! That is a lot.
How many did we have to undo? None that month. Only four ever. That sounds perfect. But it is not the whole story.
We do not undo things. We fix them. One day a change went in during the morning. By the afternoon, we saw that part of it was wrong. A new change fixed it. So a broken thing did come back, but our undo count did not see it.
So here is the truth. We do not yet count how many of our changes had to be fixed later. Nobody has counted that.
WHAT WE DO HAVE. We have about two thousand tests. Every change must pass them before it goes in. If it fails one, it waits. The tests are like a gate. They catch a lot. But they cannot tell us what got past them.
And sometimes our finished changes stand in line. They wait their turn to go in, one at a time. This lesson will wait in that line too.
TWO COLUMNS. Here is a good way to count. Draw a line down the middle of a page. On one side, write what you finished. On the other side, write what came back to be done again. The first side shows how much you did. The second side shows how good it was. You need both sides to know the truth.
THANK THE CHECKERS. Somebody in your house checks things. Maybe it is your mom looking at your homework. Maybe it is your dad looking at the yard after you mow. Checking is hard work, and checkers get tired. You can help them. Check your own work first, before you hand it in. Then their job is easier, and less comes back.
GOOD WORK LASTS. Joash's workers did not just take the money and stop. They fixed the walls. They made the house strong. Long after the money was spent, the house was still standing. That is how you can tell good work. It is still good later, not just on the day you finish it. When you build a block tower, a sand castle, or a birdhouse, ask yourself one question. Will it still be standing tomorrow?
JESUS FINISHED HIS WORK. Jesus did one work that never had to be fixed. He said this on the cross. [[John 19:30]] He is the Lamb of Yahweh. [[John 1:29]] [[John 3:16]] He holds everything together. [[Colossians 1:17]] Our work gets tested. His work is done, and it stands.
AT HOME. Think about your own chores. Did you ever clean your room so fast that you had to clean it again? That is a bag with holes. Did you ever do a job slowly and well, and it stayed good? That is the strong house.
Try this. Pick one chore this week. Do it, then check it. Ask a grown up to check it too. Write down if it needed fixing. That is counting what comes back.
FOUR THINGS TO DO. Count what comes back, not just what goes out. Ask if fast means good. Help the tired checkers. Ask, how much, and also, how good.
${FACTS.child}
${TALK.child}`;

const YOUTH = `${TITLE}.
WHO SENT THIS. Darrell forwarded a ByteByteGo newsletter roundup with one word above it: Lesson. It had four stories. Three are already taught in other weeks. The fourth is one question the writer asks almost in passing. When the count of finished work keeps climbing, who counts what comes back?
THE WORD FIRST. Start with the prophet Haggai. The people were home from exile and busy with their own houses, while Yahweh's house lay in ruins. They worked hard, and here is what it added up to. [[Haggai 1:6]] Wages went into the bag at the top, and that is where they were counted. Nobody counted the hole at the bottom. Yahweh did not tell them to work harder. He told them this. [[Haggai 1:5]]
Then look at King Joash, who set out to repair the temple. Money poured in every day and was counted every night. But the money was never the goal. [[2 Chronicles 24:13]] The house was set in its state and made strong. That was the real measure.
WHAT KIND OF WORK. Paul says every builder's work will be tested. [[1 Corinthians 3:13]] The fire asks of what sort, not how many. Ezekiel describes a wall where others came behind the builder and covered the cracks with bad mortar. [[Ezekiel 13:10]] It looked fine until the storm. [[Ezekiel 13:11]] Afterward everyone asks the same question. [[Ezekiel 13:12]]
THE NEWSLETTER'S STORY. The newsletter reports that in September more than four in ten pull requests on GitHub began with an agent writing the first draft, up from fewer than one in five in March. It reports that one A.I. company built its own version control system and went from about two and a half thousand merges a day to more than thirty thousand. Those are the newsletter's numbers. We pass them on as its report.
The interesting part is the questions the writer asks about his own numbers. Who is reviewing all of this? The report says nine in ten of these pull requests merged within two weeks. That could mean the code is good, or it could mean the reviews are thin, and the number cannot tell you which. How do you even know which work an agent started? And of thirty thousand merges a day, how many were undone later? His point is simple: counting what goes out without counting what comes back is only half the picture.
He says writing code is now the cheap part. The scarce things are a reviewer's time, testing machines, and how fast finished work can actually merge.
TIRED HANDS. Nehemiah's builders hit that problem on the wall. [[Nehemiah 4:10]] They had plenty of stones. They ran out of strength to carry them. When writing is cheap, the checkers are the ones who get tired first. Proverbs warns about speed with no knowledge behind it. [[Proverbs 19:2]]
OUR OWN HOUSE. We build our family app with an A.I. agent doing most of the typing, so we checked our own records.
In thirty days, from October 19 to November 18, we merged 429 changes to our main branch. On November 18 alone we merged 45. The writing is not the slow part here either.
In that same month, zero changes were reverted. In the whole history of the branch, only four out of 2,859. That sounds perfect, but it is not a real measure. We almost never undo a change. We fix forward. On November 18 a change for the reading voice merged in the morning, its first health check was fooled by another service's answer, and a second change fixed it that afternoon. A real mistake came back, and the revert count never saw it.
Could we count the word fix in our change titles? Four start with it, twelve contain it, and that same-day repair does not use it at all. So that does not work either. The honest answer: we do not yet count how many of our merged changes needed fixing later.
WHAT WE DO HAVE. About two thousand test files run on every change, and a change that fails is not merged. That is a gate. It catches problems before they get in, but it cannot count what slipped past. And in September, every finished change was stuck in line because they all edited the same two record files. We built a workflow that keeps them current, and lessons like this one still wait their turn.
YOUR OWN COUNTS. You live with numbers like this too. Grades, followers, likes, minutes practiced. Each one counts how much. Ask what would count how good. A practice log that says one hour is not the same as a song you can now play all the way through.
THREE THINGS TO COUNT. If checking is the new slow part, then counting only what goes out will fool you. A builder needs three counts, not one. How much went out. How much came back. And how long the checking took, and who did it. The writer's own list is close to that: how long a change takes from start to finish, how many problems escape into the real app, and how much reviewing is piled on each person. The Bible's list is shorter and older: how much, and of what sort.
Haggai's people were not lazy. They were counting the wrong end of the bag. Joash's scribe was not wrong to count the money every night. He would only have been wrong if he had stopped there and never looked at the house.
WHERE THE PLASTER HIDES. Ezekiel's wall shows up in school too. Homework copied from a friend looks finished. A paper that was never read through looks finished. A room where everything was shoved under the bed looks finished. Each one passes a quick look, and each one falls apart when the test comes, the paper is graded, or someone opens the closet. The fix is not to work slower. It is to check before you say done, and to be honest about what comes back.
WHEN SOMETHING COMES BACK. Here is the hard part. When something you finished comes back broken, it is easy to hide it. You fix it quietly and act like it never happened. But a mistake you hide cannot teach you anything, and nobody can count it. Our own house had to learn this too. The honest move is to write it down. Then next time you can see where the holes in your bag are, and patch them before the money falls out.
THE OTHER STORIES. The newsletter's story about old language runtimes is taught in other weeks of this course and in Software Project Management. This week keeps to one thing.
FINISHED. Jesus did the one work that never needed repair. [[John 19:30]] He is the Lamb of Yahweh, [[John 1:29]] [[John 3:16]] the Eternal Son, [[Hebrews 1:8]] who holds all things together. [[Colossians 1:17]]
FOUR HABITS. Count what comes back. Ask if fast means good. Protect the checkers. Measure how good, not only how much.
${FACTS.youth}
${TALK.youth}`;

const TEEN = `${TITLE}.
WHO SENT THIS. Darrell forwarded a ByteByteGo roundup with one word on top: Lesson. It carried four stories, and three of them are already taught in other weeks of this course. This week takes the one question the writer asks almost in passing: if the count of finished work keeps climbing, who is counting what comes back?
THE FRAME. Haggai spoke to people who had come home from exile and were working hard on their own houses while Yahweh's house lay in ruins. [[Haggai 1:6]] Their wages went into a bag with holes, so they counted at the top while the loss happened at the bottom, where nobody was looking. Yahweh's answer was not to work harder, but to stop and look. [[Haggai 1:5]]
Then there is King Joash, who set out to repair the temple. Money came in every day and was counted every night, but the count was never the goal. [[2 Chronicles 24:13]] The goal was a house set back in its state and made strong, and that was the measure that mattered.
OF WHAT SORT. Paul gives every builder a single test that no count can replace. [[1 Corinthians 3:13]] The fire does not ask how much you made; it asks what kind of work it was. Ezekiel saw a wall that only looked done, because others had come behind the builder and plastered over its cracks with mortar that was never mixed right. [[Ezekiel 13:10]] The storm would expose it. [[Ezekiel 13:11]] And when it fell, everyone would ask the same question. [[Ezekiel 13:12]] Who said this was finished?
THE NEWSLETTER. The roundup reports some big numbers. It says that more than four in ten pull requests on GitHub in September began as a first draft written by an agent, up from fewer than one in five in March. It says one A.I. company built its own version control system, and its daily merges climbed from about 2,500 to more than 30,000. Those are the newsletter's figures, not ours, and we pass them on as its report.
The good part is that the writer questions his own numbers. Who is reviewing all of this work? The report says nine in ten of these pull requests merged within two weeks, which could mean the code got better or the reviews got thinner, and the number by itself cannot tell you which. Can anyone even tell which work an agent began, when an agent can commit under a person's name? And how many of those 30,000 daily merges were undone later? His own line is the lesson: throughput with no defect rate is only half a picture.
He argues that writing code has become the cheap part. What is scarce now is a reviewer's time, the capacity of the machines that run the tests, and how fast finished work can actually be merged.
THE BEARERS. Nehemiah's crew hit this exact problem halfway up the wall. [[Nehemiah 4:10]] There were plenty of stones, but the people carrying them ran out of strength. Cheap code puts the weight on the people who check it, and they are the first to wear out. Speed by itself proves nothing either. [[Proverbs 19:2]] Fast with knowledge is fine; fast without knowledge is a gamble that only looks like progress.
OUR OWN RECORDS. We build our family app with an A.I. agent doing most of the typing, so the writer's questions are our questions too. Here is what the history of our main branch says.
From October 19 to November 18 we merged 429 changes, and on November 18 alone we merged 45. Writing is not the slow part for us either.
In that same month we reverted zero changes, and across all 2,859 changes in the branch's history we have reverted only four. That looks perfect, but it is not really a measure, because we almost never revert. We fix forward. On November 18 a change for the reading voice merged in the morning, its first health check trusted another service's answer as if it were the voice, and a second change fixed that check the same afternoon. A real defect came back, and the revert count stayed at zero.
So we tried counting fixes instead. Four change titles in that month start with the word fix, twelve contain it somewhere, and the same-day repair does not use it at all. Without one habit for naming a repair, there is nothing clean to count. So here is the plain truth: we do not yet count how many of our merged changes needed repair later.
WHAT WE DO HAVE. About two thousand test files run on every change, and a change that fails any of them does not merge. That gate catches problems before they get in, but it cannot see what slipped past it. The merge rate has caught us too. In September every finished change was green and still stuck, because each one edited the same two shared record files, and every merge knocked the others out of date. A workflow now keeps them current, but lessons like this one still wait in line, and this one will too.
THREE COUNTS. If checking is the bottleneck, one number will fool you. Keep three. How much went out. How much came back. How long the checking took, and who did it. The writer's list for team leaders is close: how long a change takes from start to finish, how many problems escape into real use, and how much review lands on each person. The Word's list is shorter: how much, and of what sort.
WHERE THE PLASTER HIDES. Ezekiel's wall shows up in a teenager's week all the time. A project finished the night before looks done until someone asks one question about it. A group assignment where one person did everything looks done until the presentation. A streak kept alive with the least possible effort looks like discipline on the app and feels like nothing in real life. None of those needs you to slow down. Each one needs a second column, the honest count of what comes back.
WRITE IT DOWN. When something you finished comes back broken, the easy move is to fix it quietly and say nothing. But a hidden repair teaches no one, and it never gets counted. Write it down, even if only for yourself.
YOUR NUMBERS. You are measured all the time: grades, followers, streaks, hours practiced. Most of those count how much. Pick one of them and ask what would count how good, and then start keeping that count too.
OTHER STORIES. The newsletter's story about old language runtimes is taught in other weeks of this course and in Software Project Management, and the shift from writing code to trusting it has its own earlier week. This week keeps to one thing.
FINISHED. Jesus did the one work that never came back for repair. [[John 19:30]] He is the Lamb of Yahweh, [[John 1:29]] the Eternal Son, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]]
FOUR MOVES. Count what comes back. Ask what a fast approval really means. Guard the checker's time. Measure of what sort, not only how much.
${FACTS.teen}
${TALK.teen}`;

const SENIOR = `${TITLE}.
WHO SENT THIS, AND WHEN. Darrell forwarded the ByteByteGo roundup of the eleventh of November with a single word above it: Lesson. Of its four stories, three are already taught elsewhere in this house. This week takes the fourth, which is really a question the author poses almost in passing: as the volume of finished work rises, who is accounting for what returns?
THE FRAME. Haggai addressed a people returned from exile who laboured diligently on their own dwellings while the house of Yahweh lay waste. The prophet summarised what their labour amounted to. [[Haggai 1:6]] Their wages were tallied as they entered the bag; the loss occurred unobserved at the bottom. The remedy given was not greater exertion but reflection. [[Haggai 1:5]]
The account of Joash supplies the other end of the matter. When he undertook to repair the house, contributions arrived daily and were reckoned each evening, yet the treasury was never the measure of success. [[2 Chronicles 24:13]] The house was set in its state and strengthened. That was the measure.
QUANTITY AND QUALITY. The apostle gives the one standard that no tally of output can replace. [[1 Corinthians 3:13]] The trial is of what sort, not of how much. Ezekiel describes a wall that appeared complete because others had plastered its defects with mortar improperly prepared. [[Ezekiel 13:10]] Its exposure awaited the storm. [[Ezekiel 13:11]] And after its collapse comes the inevitable enquiry. [[Ezekiel 13:12]]
THE ARTICLE, IN OUR WORDS. The newsletter reports that during September more than four in ten pull requests on GitHub originated as a first draft composed by an automated agent, compared with fewer than one in five in March, and that one artificial intelligence company replaced the version control system in its principal code repository with one of its own making, after which its daily merges rose from roughly two and a half thousand to more than thirty thousand. These figures are the newsletter's, and they are relayed as its report.
The value of the article lies in the questions its author directs at his own figures. Who is reviewing such a volume? Nine in ten of the pull requests in question were reportedly merged within a fortnight, which may indicate better code or shallower review, and the figure alone cannot distinguish the two. How is an agent's involvement even detected, when an agent may commit under a person's account? And of thirty thousand daily merges, how many were subsequently undone? His own conclusion is that throughput without a defect rate is an incomplete picture. Writing code, he argues, has become inexpensive, and the scarce resources are now the reviewer's time, the capacity of the testing machinery, and the rate at which completed work can be merged.
THE BEARERS OF BURDENS. Nehemiah's builders encountered the same constraint midway through the wall. [[Nehemiah 4:10]] Material was plentiful; the strength of those who carried it was exhausted. When composition becomes cheap, the burden shifts to those who verify, and they tire first. Haste itself is not condemned, but haste without understanding is. [[Proverbs 19:2]]
THIS HOUSE, EXAMINED. The family application is built with an artificial intelligence agent performing most of the composition, so the author's questions apply here, and the history of the main branch has been examined to answer them.
Between the nineteenth of October and the eighteenth of November, four hundred and twenty-nine changes were merged; on the eighteenth alone there were forty-five. In that period no change was reverted, and in the entire history of the branch, comprising two thousand eight hundred and fifty-nine changes, only four have been. The record appears flawless, but it measures nothing, because this house seldom reverts; it repairs forward. On the eighteenth of November a change concerning the reading voice was merged in the morning, its first health check mistook another service's reply for the voice's own, and a further change corrected the check that afternoon. A genuine defect returned, and the count of reverts did not register it.
An attempt to count repairs instead also fails. Four change titles in the period begin with the word fix, twelve contain it, and the same-day repair contains it nowhere, so no consistent convention exists to be counted. The plain conclusion is that this house does not yet measure how many merged changes subsequently required repair, which is precisely the escaped-defect figure the author urges leaders to begin keeping.
WHAT THE HOUSE POSSESSES. Approximately two thousand test files are run against every change, and a change that fails any of them is not merged. Such a gate records what was intercepted before merging; it cannot disclose what passed undetected. The merge rate has also been a genuine constraint. In September every completed change stood green yet unable to merge, because each altered the same two shared ledger files and every merge put the others out of date. A workflow now carries the main branch into each waiting change and resolves those two files by rule alone, and lessons built in this lane continue to queue in order behind one another.
WHAT OUGHT TO BE COUNTED. If verification has become the scarce resource, a single measure of output will mislead. Three are required: how much was sent out, how much returned, and how long the checking took and by whose hand. The author's own list, offered to those who lead engineering teams, is the time a change takes from beginning to end, the defects that escape into use, and the burden of review on each person. The Word's list is older and briefer: how much, and of what sort. Haggai's hearers were not idle; they were counting the wrong end of the bag. Joash's scribe was not mistaken to reckon the money each evening; he would have been mistaken only had he stopped there and never examined the house.
THE HONEST RECORD. A defect that returns and is quietly mended teaches nothing unless it is written down. The temptation in any house, whether of builders or of families, is to repair without recording, so that the tally of finished work remains untroubled. Ezekiel's question is asked of exactly such a house: where is the daubing? The remedy is a record kept honestly, so that the holes in the bag can be located and closed.
OTHER STORIES. The article's account of an obsolete language runtime is taught in other weeks of this course and in Software Project Management, and the shift from writing code to trusting it is the subject of an earlier week. This week confines itself to one question.
IT IS FINISHED. One work alone has never returned for repair. [[John 19:30]] He is the Lamb of Yahweh, [[John 1:29]] [[John 3:16]] the Eternal Son whose throne endures, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]]
FOUR PRACTICES. Account for what returns and not merely for what departs. Enquire what rapid approval actually signifies. Steward the reviewer's hours deliberately. Ask of every figure whether it measures quantity or quality.
${FACTS.senior}
${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded ByteByteGo's roundup of the eleventh of November with ONE WORD typed above it: Lesson.
THE WORD FIRST. Haggai 1:6 opens the hour - wages put into a bag with holes, counted at the top and lost at the bottom - with 2 Chronicles 24:13 beside it - the money counted every day, and the measure the house set in its state. [[Haggai 1:6]] [[2 Chronicles 24:13]] 1 Corinthians 3:13 asks of what sort, not how much; Ezekiel 13:10-12 asks where the daubing is; Nehemiah 4:10 names the tired bearers.
THE NEWSLETTER, IN OUR WORDS. Agents now write the first draft of much new code, and merges have multiplied. The author's own question is the lesson: throughput without a defect rate is half a picture, and the scarce things are review time, test capacity and merge rate.
OUR OWN HOUSE. 429 changes merged to our main branch in thirty days, 45 in one day, and 0 reverted. That zero measures nothing, because this house repairs forward: a defect merged in the morning of the eighteenth of November was repaired that afternoon. We do not yet count how many merged changes needed repair.
THE TIERS. REPORTED: the newsletter's numbers. ESTABLISHED: output without what comes back is half a measure. MEASURED: our own history. NOT MEASURED: our escaped defects. ${REVIEW}.
LEFT OUT ON PURPOSE. The sponsor blocks, the images, the links, and the figures from the public filing.
PLACEMENT. Sovereign A.I., week 94, because a household that builds with an agent must count what comes back.
CLOSE. [[John 19:30]] Jesus, the Lamb of Yahweh and the Eternal Son, finished the one work that never came back.`,
  inApp: `One screen to read in this app, and one page in your Study.
In the app: open Sovereign A.I. week 94 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one is whole on its own. Then look at one thing you count in your week, and ask whether it counts the top of the bag or the bottom. [[Haggai 1:6]]
In your Study, write three lines. One thing you count that only measures how much. One thing that came back this month that nobody counted. One check you will add before you call something done. [[2 Chronicles 24:13]]`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Haggai 1:6]] [[2 Chronicles 24:13]] [[1 Corinthians 3:13]] [[Ezekiel 13:11]] [[Nehemiah 4:10]] [[Proverbs 19:2]] [[John 19:30]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, each landing on your own house.
First, read Haggai 1:2-11. Mark every place the people worked hard and got little. Write one sentence on a bag with holes in your own week.
Second, read 2 Chronicles 24:4-14. Mark what was counted every day and what was the real measure. Write down one thing you count that is not the real measure.
Third, read Ezekiel 13:10-16. Mark who built and who daubed. Write down one place where something looked finished because someone covered it over.
And one verification reading, because this course works this way. The newsletter's numbers are reported as it gives them. That output without what comes back is half a measure is established. Our house numbers were read from our own history. How many of our changes later needed repair is not yet measured. ${REVIEW}.`,
    plan: `PLAN. Decide four measures before the week starts, and decide who hears them.
One: the bag. Name one thing you count that only measures how much.
Two: the hole. Name what comes back from it, and how you will count that.
Three: the bearer. Name who checks your work, and one way to give them back an hour.
Four: the fire. Name one piece of work you will check of what sort before you call it done.
Then name the person who will ask you about all four on the same day next week.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.
Each day, count one thing that came back as well as one thing that went out. Give your checker an hour back. Before you say done, test it of what sort.
Teach the verse at a meal: wages put into a bag with holes. Ask a child what they had to do over this week.
At the end of the week, answer three questions to the person who is asking. What came back? Who checked it? What did you count that you never counted before?
Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a roundup of the month in software, answered from the Word rather than from the roundup.`,
    `The hour opened by Haggai 1:6, so a count of finished work is heard as wages counted at the top of a bag with a hole in the bottom.`,
    `2 Chronicles 24:13 laid beside it, so the measure is the house set in its state, not the money gathered.`,
    `1 Corinthians 3:13 naming the one test no count of output can replace: of what sort.`,
    `Ezekiel 13:10-12 read as the plastered wall and the question after the fall: where is the daubing?`,
    `Nehemiah 4:10 naming the new bottleneck: not the stones, the strength of the bearers.`,
    `Proverbs 19:2 keeping speed honest: not speed, but speed without knowledge.`,
    `The newsletter's numbers carried as its report, and its own three questions taught as the lesson.`,
    `Throughput without a defect rate named as half a picture, and the three scarce things named: review time, test capacity, merge rate.`,
    `Our own main branch measured: 429 merges in thirty days, 45 in one day, and 0 reverts.`,
    `The zero read honestly: this house repairs forward, so a revert count does not see its defects.`,
    `A same-day repair named as the proof, and the escaped-defect count named as not yet kept.`,
    `The gate, the stuck line of finished work, and the queue this lesson itself will join.`,
    `Jesus confessed as the One whose work is finished, the Lamb of Yahweh and the Eternal Son (John 19:30).`,
    `The reported, the established, the measured and the unmeasured told apart in every reader place, with a dated re-review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: 'Haggai 1:6',
      title: 'The fastest dishwasher on the block',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A family made a chart on the refrigerator to see who could wash the most dishes in a week. The middle boy won it by Wednesday. He washed forty plates a night, faster than anyone had ever seen.
On Thursday his grandmother reached for a glass and found it still sticky. On Friday the frying pan had last night's eggs on the bottom. By Saturday half the cupboard had gone back into the sink, and his mother was washing them again after everyone went to bed.
The family did not take the chart down. They added a second column. One column counted what was washed. The other counted what came back. The middle boy's first number dropped by half the next week. His second number dropped to nothing. His grandmother said it was the first week in a year she had not had to rinse a glass before she drank from it.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: 'Ezekiel 13:11',
      title: 'The inspector who signed by the dozen',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A county building office was proud of its speed. Its inspectors signed off on more new homes each month than any office in the state, and the number was printed every quarter in the local paper.
One inspector, nearing retirement, noticed what the number did not show. He kept a small notebook of his own, and in it he wrote down every house he had approved that later called the office back: a sagging floor, a leaking roof, a porch pulling away from the wall. Over the years the notebook filled.
When the county asked him to train his replacement, he did not show her the quarterly number. He showed her the notebook. He told her the office had counted for twenty years how many houses it approved, and never once how many of those houses came back. Then he asked her which of the two she thought a family moving in would rather know.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Haggai 1:6, where did the wages go?',
        options: ['Into a locked chest', 'Into a bag with holes', 'Into the temple treasury'],
        answer: 1,
        explain:
          'He that earneth wages earneth wages to put it into a bag with holes. The wages were counted going in at the top, and lost at the bottom where nobody was counting.',
      },
      {
        q: 'In 2 Chronicles 24, what was the real measure of King Joash’s repair?',
        options: [
          'How much money was gathered each day',
          'That the work was perfected and the house was set in its state and strengthened',
          'How many workmen were hired',
        ],
        answer: 1,
        explain:
          'The money was counted day by day in abundance, but 2 Chronicles 24:13 gives the measure: the work was perfected, and the house was set in its state and strengthened.',
      },
      {
        q: 'What does the fire try in 1 Corinthians 3:13?',
        options: ['How much work each man did', 'Every man’s work, of what sort it is', 'How fast the work was finished'],
        answer: 1,
        explain: 'The fire shall try every man’s work of what sort it is. A count of output tells you how much; only the trial tells you of what sort.',
      },
      {
        q: 'In Ezekiel 13:10-12, what was wrong with the wall?',
        options: ['It was too short', 'Others daubed it with untempered morter, so it looked finished and would fall in the storm', 'It had no gate'],
        answer: 1,
        explain: 'The cracks were covered, not repaired. After the fall comes the question: where is the daubing wherewith ye have daubed it?',
      },
      {
        q: 'What three questions does the newsletter’s author ask of his own numbers?',
        options: [
          'How fast, how cheap and how big',
          'Who is reviewing it all, how anyone knows an agent began the work, and how many merges were later undone',
          'Which company is winning, which model is best, and which language is fastest',
        ],
        answer: 1,
        explain: 'His own line is the lesson: throughput without a defect rate does not give the whole picture.',
      },
      {
        q: 'Why is nine in ten pull requests merging within two weeks not good news on its own?',
        options: [
          'Because two weeks is too slow',
          'It could mean better code or thinner review, and the number alone cannot tell you which',
          'Because the number is always wrong',
        ],
        answer: 1,
        explain: 'Proverbs 19:2 makes the same point about any hurried road: speed is not the fault, speed without knowledge is.',
      },
      {
        q: 'What does Nehemiah 4:10 teach about the new bottleneck?',
        options: [
          'They ran out of stones',
          'The strength of the bearers of burdens was decayed: the carriers wore out, not the material',
          'The wall was finished early',
        ],
        answer: 1,
        explain: 'When writing code costs almost nothing, there is more to carry than hands to carry it, and the first hands to tire are the ones that check.',
      },
      {
        q: 'Our main branch recorded zero reverts in thirty days. Why is that not a defect rate?',
        options: [
          'Because zero is always a mistake',
          'Because this house repairs forward: a defect merged in the morning was fixed by a new change that afternoon, and the revert count never saw it',
          'Because nobody merged anything',
        ],
        answer: 1,
        explain: 'A revert is only one way a defect comes back. A house that fixes forward needs to count repairs, and this house does not yet count them.',
      },
      {
        q: 'What does the gate of about two thousand test files tell the house, and what can it not tell it?',
        options: [
          'It tells everything about every defect',
          'It tells what was caught before the merge; it cannot tell what got past',
          'It tells nothing at all',
        ],
        answer: 1,
        explain: 'A failing change is not merged, by machine. That spends the checking on purpose, but it is not a count of escaped defects.',
      },
      {
        q: 'What did Jesus say of His work in John 19:30?',
        options: ['It is begun', 'It is finished', 'It will be repaired'],
        answer: 1,
        explain: 'Every other work is tried by fire. His is the one work that never came back for repair, and it stands.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Haggai 1:6 aloud before you say one word about any computer. Then read 2 Chronicles 24:13 aloud and write two words on the board: how much, and of what sort. Then ask the room: in your home, what do you count, and what comes back that nobody counts?
MINUTES 0 TO 12 - THE BAG AND THE HOUSE. Haggai 1:2-11 and 2 Chronicles 24:4-14. Have someone list what was counted in each story and what the real measure was.
MINUTES 12 TO 22 - THE FIRE AND THE WALL. 1 Corinthians 3:13 and Ezekiel 13:10-12. Ask: what makes a thing look finished when it is not?
MINUTES 22 TO 35 - THE NEWSLETTER'S QUESTIONS. Give its numbers as its report. Then teach its three questions: who reviews it all, how anyone knows an agent began it, and how many merges came back. Name the three scarce things. Read Nehemiah 4:10 and Proverbs 19:2.
MINUTES 35 TO 50 - OUR OWN HOUSE. 429 merges in thirty days, 45 in one day, 0 reverts, and why the zero measures nothing here: the same-day repair forward. The attempt to count fixes, and why it fails. The gate, the stuck line, and the queue. Say plainly what is not yet measured.
MINUTES 50 TO 60 - IT IS FINISHED. John 19:30, John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Give the four household habits and the week's assignment.
WHAT NOT TO DO. Do not turn this into praise or blame of any company; the figures are the newsletter's and are not ranked here. Do not teach that speed is the enemy; the enemy is speed without knowledge. Do not read the newsletter in a voice of authority over the Word; the Word frames the hour and the newsletter is its occasion.`,
    talkingPoints: [
      `Wages put into a bag with holes (Haggai 1:6).`,
      `Consider your ways (Haggai 1:5).`,
      `The work was perfected, and the house set in its state (2 Chronicles 24:13).`,
      `The fire tries every man's work of what sort it is (1 Corinthians 3:13).`,
      `Where is the daubing? (Ezekiel 13:12).`,
      `Not the stones, the bearers (Nehemiah 4:10).`,
      `Speed without knowledge is the fault, not speed (Proverbs 19:2).`,
      `Throughput without a defect rate is half a picture.`,
      `The scarce things: review time, test capacity, merge rate.`,
      `Our house: 429 merges in thirty days, 45 in one day, 0 reverts.`,
      `A house that repairs forward must count repairs, not reverts.`,
      `We do not yet count our escaped defects.`,
      `A gate tells what was caught, not what got past.`,
      `Finished work still waits its turn in the merge line.`,
      `It is finished (John 19:30).`,
    ],
    discussionPrompts: [
      `What do you count in your week that only measures how much?`,
      `What came back this month that nobody counted?`,
      `Who checks your work, and are they worn out?`,
      `When did a fast yes turn out to mean nobody read it?`,
      `What looked finished in your house because someone covered it over?`,
      `What one check would you add before you call something done?`,
    ],
  },
  lesson: [...LESSON, FACTS.lesson, TALK.lesson].join('\n\n'),
  levels: { child: CHILD, youth: YOUTH, teen: TEEN, senior: SENIOR },
};
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
console.log(`sov94: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov94: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov94: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov94: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov94: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov94: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov94: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov94: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov94: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov94: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov94: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov94: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov94: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov94: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov94: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov94: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov94: spliced ${ID}`);
console.log(`sov94: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov94: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
