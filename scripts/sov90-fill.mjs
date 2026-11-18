// =============================================================================
// sov90-fill - build Sovereign A.I. week 90 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose holds only a reference in double brackets, [[Acts 17:11]], and this
// script replaces it with the corpus text followed by the reference. No verse
// on the page was typed from memory. anchor.ref is DERIVED from the
// placeholders that occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. ByteByteGo sent "Why Thinking More Can Make an LLM
// Dumb" on Tuesday 2026-11-17, and Darrell forwarded it into the lesson lane
// the same day with ONE WORD above the forwarded header: Lesson. Gmail thread
// `1a1ea6587885ee3f`. Built 2026-11-18. The sponsor block is left out so one
// forward stays one teaching.
//
// THE NUMBER. Week 89 (Redis and Memcached, DR-1546) was in flight when this
// build claimed reserve/sov90 with an empty-value lease; 89 landed before 90
// was committed, so 90 was re-spliced on main's catalog and holds nothing.
//
// WORD FIRST (DR-0127 / DR-0282). Acts 17:11 - checked against what is
// written, daily - and Matthew 5:37 - yea, yea; nay, nay - frame the hour
// before a single word about a model. Week 84 already stood on Acts 17:11 for
// the draft that never promotes itself; here it carries the other half of the
// newsletter's point: a second look is worth most when it checks against
// something OUTSIDE the first look.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). ESTABLISHED: models write a
// piece at a time, each piece conditioned on the question and what came before;
// writing a middle step helps (the $100 -> $120 -> $96 arithmetic and the
// three-item loop trace are checkable by hand, and were). VERIFIED at the
// vendor's own door, raw.githubusercontent.com/deepseek-ai/DeepSeek-R1
// README.md:34-37 (read 2026-11-18): R1-Zero trained by reinforcement learning
// without supervised fine-tuning first, its "endless repetition, poor
// readability, and language mixing", and R1's cold-start data before RL.
// REPORTED (ByteByteGo, which itself says it draws on publicly shared details):
// the group-scoring account, the "aha moment" episode, the two-plus-three study
// with thirteen solutions, and the train-timetable drift. arxiv.org,
// openai.com and blog.bytebytego.com did not answer this sandbox (curl exit,
// HTTP 000) on 2026-11-18. MEASURED in our own house, with file:line in the DR.
// NOT MEASURED: whether the course's longer weeks catch more than they drift.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 90;
const ID = 'sov90-let-your-yea-be-yea';
const TITLE = 'Let your yea be yea - the second look that catches the mistake, the second look that talks a right answer wrong, and the Son in whom is yea';

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
  if (!m) throw new Error(`sov90: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov90: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov90: reference does not resolve in the corpus -> "${ref}"`);
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
  lesson: `WHERE WE STAND ON THE FACTS. ESTABLISHED, and stated plainly: a language model writes its answer one small piece at a time, and every piece is chosen by looking at the question and at everything already written; writing a middle step down makes the next step easier; reasoning models are trained to write such working before they answer. The price arithmetic and the three-item loop were worked by hand for this hour and come out as the newsletter says. VERIFIED at the company's own published page: the model trained first by reward alone struggled with endless repetition, poor readability and mixed languages, and the released model was given worked examples before that training. REPORTED, by ByteByteGo, which says it draws on publicly shared details: the account of attempts scored against their own group, the moment a model went back to the original equation, the two-plus-three study with thirteen solutions, and the train-timetable drift. The research pages it names did not answer our network on the eighteenth of November, so those stay the newsletter's account. MEASURED in our own house: every claim about our gates below is traced to the file that makes it true, and the lengths of our own weeks were counted on this tree. NOT MEASURED: whether our longer weeks catch more mistakes than they add. No conclusion is drawn either way. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. Computer helpers really do write one small piece at a time. The money sum and the list puzzle really work out. We checked them with a pencil. One company's own page says its first helper kept saying the same thing over and over. The other stories came from the email, and we took the email at its word. We counted how long our own lessons have grown. We did not find out if longer lessons are better. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. It is well known that these models write one piece at a time, and that writing the middle step helps. We worked the price problem and the list problem by hand, and they come out right. One company's own page says its first model repeated itself without end and mixed up languages. The other stories, like the thirteen answers to two plus three, are the newsletter's report. We counted how long our own lessons have grown. Whether the longer ones are better was not measured. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. Established: models write piece by piece, and a written middle step helps; the price and loop examples were checked by hand. Verified at the source: the company's own page names endless repetition and mixed languages in its first model. Reported: the group scoring, the aha moment, the thirteen answers and the train drift are the newsletter's account. Measured: our gates, file by file, and how long our weeks have grown. Not measured: whether longer weeks catch more than they drift. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. That these models compose an answer piece by piece, each piece conditioned on all that precedes it, and that a recorded intermediate step aids the next, is established and stated without hedging; the newsletter's arithmetic and its loop were both worked by hand for this hour. The developer's own published page confirms that its first model, trained by reward alone, fell into endless repetition, poor readability and mixed languages, and that the released model was first given worked examples. The account of attempts scored against their own group, the reported moment of reconsideration, the study of thirteen solutions to two plus three, and the timetable example remain the newsletter's report; the research pages it cites did not answer our network. Every statement about this house is traced to the code that makes it true, and the length of the course's weeks was counted on this tree. Whether those longer weeks catch more than they add has not been measured, and no conclusion is offered. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  'And measure the growth the Word’s way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - when you check your homework, what do you check it against - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Acts 17:11. Children, ask your mother, your father or a grandparent about a time they changed a right answer to a wrong one because they thought there was a catch; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: when do we keep talking after the answer is already plain. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - how do you know your answer is right - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Matthew 5:37. Children, ask your mom or your dad or your grandma or your grandpa about a time they changed an answer on a test. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: how many times do we need to say yes. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when do you go back over your work, and what do you find - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Proverbs 18:17. Children, ask your mom, your dad or a grandparent about a time a second look caught a real mistake for them, and hear the whole of it before you answer; then retell their answer in your own words. Then ask a friend this: who checks our work who is not us. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when have you talked yourself out of something you knew was true - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Proverbs 4:25. Children, ask your mom, your dad or a grandparent how they tell the difference between a careful second look and second-guessing, and hear the whole of it before you reply; then retell their answer in your own words. Then ask a friend this: what question are we really being asked, and are we still answering it. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what do you check a thing against when it matters - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Matthew 4:4. Children, ask your parents or your grandparents about a decision they once turned over so many times that the plain answer got lost; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: which of our worries is a hard question that deserves time, and which is a plain one we keep reopening. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no detail from the newsletter stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the seventeenth of November 2026 a short engineering newsletter named ByteByteGo reached Darrell's mailbox, and the same day he forwarded it into this lane with ONE WORD typed above it: Lesson. That word is the ask; the newsletter is only the occasion. It was built the next day.

THE WORD FIRST, BEFORE ANY MACHINE. Two verses frame this hour. The first is about checking. Paul and Silas came to Berea with a message, and the people there did a thing Luke calls noble: [[Acts 17:11]] They did not check the teaching against their own feelings, and they did not check it by saying it again to themselves. They checked it against something outside themselves, what was written, and they did it every day. The second verse is about stopping. [[Matthew 5:37]] In its place Jesus is teaching about oaths - the extra words people stack on a plain answer to make it sound surer. A plain yes does not become truer by being said again and again. Hold both: check against what is written, and when the answer is plain, say it and stop. Then hear the article.`,

  `THE OLDEST SECOND LOOK. Before there was any machine there was a garden and a plain word: [[Genesis 2:17]] Then a question came that was built to make a plain word look as if it had a catch in it: [[Genesis 3:1]] The woman answered first with what was true: [[Genesis 3:2]] Then, comparing her words with the command itself, her answer carried a detail the command never held: [[Genesis 3:3]] Yahweh had said nothing about touching. And the next line from the serpent did not find a mistake in the first answer; it made one: [[Genesis 3:4]] This is the oldest form of the failure the newsletter describes. A right answer, looked at again for a hidden twist, was talked into a wrong one, one reasonable-sounding step at a time.`,

  `WHAT THE NEWSLETTER SAID. A language model writes its answer in small pieces. Each new piece is chosen by looking at the question and at everything the model has already written. So what it writes early steers what it writes later. That cuts both ways. A good middle step makes the next step easy: a shop raises a one-hundred-dollar item by twenty percent and then cuts the new price by twenty percent. Say one hundred without thinking and you are wrong. Write down the middle number, one hundred twenty, take twenty percent off that, and you reach ninety-six. [[Luke 14:28]] The builder who sits down first and counts is writing the middle number down.

Reasoning models are trained to write that kind of working before they answer, like a scratchpad. The newsletter tells how one company trained it: the model tried each problem several times, a rule scored each try for a right answer and a tidy form, each try was compared with the others in its own group, and the model leaned toward the tries that beat their peers. Partway through that training, the newsletter reports, a model working a messy equation stopped, went back to the original equation, and reconsidered its steps. The team called it an aha moment.`,

  `WHEN MORE THINKING HELPS. Some questions are hard, and they deserve the time. [[Proverbs 25:2]] The newsletter's example is a program that numbers a list, where the last item always goes missing. Trace three items by hand. Position one runs. Position two runs. At three, the program asks whether three is less than three. That is false, so it stops one short. Following the work through a small example turned a hunch into an explanation and showed the fix.

But a second look is worth most when it tests something the first look could have missed. [[Proverbs 18:17]] Compare an order total against the original order form and you may find the missing item. Add up your own incomplete list a second time and you will not. Scripture names the second kind plainly: [[2 Corinthians 10:12]] Several separate tries help most when each can go wrong in its own way, which is the old rule of witnesses: [[Deuteronomy 19:15]] And the best second look ends in coming back, not in more words: [[Lamentations 3:40]] The son in the far country did not need a longer speech. He came to himself, [[Luke 15:17]] and he went home.`,

  `WHEN MORE THINKING HURTS. In a study the newsletter reports, a model asked what two plus three makes reached five in its first solution, then kept going until its reply held thirteen solutions to the same question. A checker that only looks at the last line gives the short reply and the long one the same score, so the score says nothing about the time it cost. Jesus named the habit long ago: [[Matthew 6:7]] And the Preacher: [[Ecclesiastes 5:2]] [[Ecclesiastes 5:3]]

Sometimes the extra words do worse than waste time. The newsletter's train is scheduled at nine and usually leaves ten minutes late, and the question asks what time the timetable prints. The model sees nine at once, then keeps going because the delay sounds too deliberate to ignore, and answers nine-ten, with a careful explanation of scheduled and actual times. Every sentence makes sense. The answer has drifted off the question. [[Proverbs 4:25]] [[Proverbs 4:27]] [[Proverbs 10:19]] The newsletter's own caution belongs here too: if longer answers hold more errors, it may only be that harder questions draw longer answers. The fair test gives the same question to the same model with more and with less room to think.`,

  `HOW JESUS ANSWERED THE SECOND-GUESS. In the wilderness the tempter came with a question shaped like the garden's: [[Matthew 4:3]] Jesus did not out-argue him with a longer chain of reasons. He went back to what was written: [[Matthew 4:4]] That is the recovery the newsletter describes - stop, return to the original question, and answer that - done perfectly, and done in one line.`,

  `OUR OWN HOUSE, MEASURED, NOT PAINTED. Four places in this house show both halves of the newsletter.

The check that only re-added its own list. Our first quotation gate searched one long run of the whole Bible for each quoted span. It passed a line printed under Haggai 1:5 that is really Haggai 1:7, because the words existed somewhere. A second gate now checks each quotation against the one verse it names. Its first run found eighteen of 25,192 quoted spans that were not the verse they named, and all eighteen were repaired. That is Acts 17:11 in code: check against the source, not against yourself.

The finder that answered a different question. The tool that asks whether a forwarded email is already a lesson first trusted a bare date. It answered ALREADY BUILT on records that merely mentioned that day. Later it said LIKELY ALREADY BUILT for a newsletter nobody had built, because a review date thirty lines away matched. That is the train question exactly: a sensible-looking step that drifted off what was asked. It was fixed so a date counts only when it is the forward's own date and sits near the source's name. Run for this very lesson, it answered MAYBE - a source match only, and the catalog was checked by hand: nothing had been built on this email.

The check that proves it can catch. The shared lesson gate's own test runs fifteen cases that each plant a defect on purpose - a dropped verse, one altered word inside a quotation, a band cut short, a reworded copy - and proves each one is named. A green check that has never been seen to catch anything is the two-plus-three checker again.

Where our gate looks like the two-plus-three checker. Our four-band ladder sets a floor for how much of the lesson each age band carries and a ceiling for how hard each band reads. It sets no ceiling on length. Counted on this tree: week one's adult lesson was 291 words; week eighty-eight's was 3,668; weeks eighty to eighty-eight ran from 3,139 to 4,845. Whether that extra length catches more mistakes than it adds was not measured, and by the newsletter's own caution we draw no conclusion: our later weeks also carry harder questions. This week was written shorter on purpose, against the same floors.`,

  `FOUR THINGS FOR THE HOUSE. One: check against the source, not your memory - the verse, the receipt, the order form. Two: when the answer is plain, say it once. Three: on a hard question, write the middle step down before you go on. Four: when a second look changes your answer, ask whether it found a mistake or told you a story.`,

  `THE ONE IN WHOM IS YEA. Every check in this hour points past itself to the One who never needed a second look. [[2 Corinthians 1:19]] [[2 Corinthians 1:20]] Jesus is not yea and nay. He is the Lamb of Yahweh: [[John 1:29]] [[John 3:16]] He is the Eternal Son, whose throne stands: [[Hebrews 1:8]] And He holds together every true answer we will ever find: [[Colossians 1:17]]`,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

WHO SENT THIS. Darrell got an email about computers. He sent it to us with one word on top. The word was Lesson. So here it is.

THE WORD FIRST. Some people in a town called Berea heard Paul teach. They did a good thing. [[Acts 17:11]] They did not just say, that sounds nice. They looked it up in what was written. They did it every day.

Jesus said this. [[Matthew 5:37]] He means you do not need to pile up words. A true yes is true the first time.

THE GARDEN. Long ago there was a garden. Yahweh gave a plain rule about one tree. [[Genesis 2:17]] Then the serpent came. He asked a tricky question. [[Genesis 3:1]] He wanted the plain rule to look like it had a trick in it. Then he said the rule was wrong. [[Genesis 3:4]] The first answer was right. The second look made it wrong.

THE COMPUTER HELPERS. Some computer helpers write answers. They write one tiny piece at a time. Each new piece looks back at the question. It looks back at what it already wrote. So the first pieces steer the last ones.

A good middle step helps. Say a toy costs one hundred dollars. The store makes it cost more. Then the store makes it cost less. Is it back to one hundred? No! You have to write the middle number. Then you can see the real answer. It is ninety-six. [[Luke 14:28]] Jesus said a builder sits down first and counts.

HOW THEY TEACH THE HELPERS. One company let its helper try each problem many times. Each try got a score. The best tries won. Once, the helper got lost in a hard sum. It stopped. It went back to the start. It tried again. The people who made it were glad. Going back to the start is a good thing to learn. The Word says it too. [[Lamentations 3:40]] A boy in a story Jesus told ran far from home. Then he came to himself. [[Luke 15:17]] He did not make a long speech. He went home.

WHEN A SECOND LOOK HELPS. Sometimes a second look finds a real mistake. A list of names kept losing the last name. Someone counted one, two, three by hand. Then they saw it. The count stopped one name too soon. Now they could fix it.

A second look works best when you check with something new. Check your list with the real list. Do not just read your own list again. [[Proverbs 18:17]] A friend can see what you missed. Two or three people who check on their own are better than one. [[Deuteronomy 19:15]]

WHEN A SECOND LOOK HURTS. One computer helper was asked, what is two plus three? It said five. That was right! But it kept going. It gave thirteen answers to the same easy question. That wasted time. [[Proverbs 10:19]]

Another helper was asked what time a train is printed to leave. The answer was nine. But the helper knew the train is often late. So it said ten after nine. That was not the question! [[Proverbs 4:25]] Look straight at what you were asked.

HOW JESUS DID IT. The tempter tried a tricky question on Jesus too. [[Matthew 4:3]] Jesus did not argue for a long time. He said what was written. [[Matthew 4:4]] One line. Done.

OUR OWN APP. Our app has checkers. One checker used to search the whole Bible at once. If the words were anywhere, it said OK. A better checker now looks at the one verse a lesson names. It found eighteen mistakes. Now they are fixed.

Another checker looks to see if a lesson was made already. It once got mixed up by a date. It said yes when the answer was no. Now it is fixed. For this lesson it said maybe. So we looked by hand. This lesson was new.

Our checkers make each lesson long enough. They do not stop a lesson from being too long. Our lessons have grown a lot. We do not know yet if longer is better. So we made this one shorter on purpose.

FOUR THINGS TO DO. Check with the real thing, not just your memory. When the answer is plain, say it once. On a hard one, write the middle step. If you change your answer, ask why.

JESUS IS YES. [[2 Corinthians 1:19]] Jesus never changes His answer. He is the Lamb of Yahweh. [[John 1:29]] [[John 3:16]] He is the Son forever. He holds everything together. [[Colossians 1:17]]

${FACTS.child}

${TALK.child}`;

const YOUTH = `${TITLE}.

WHO SENT THIS. Darrell forwarded a computer newsletter called ByteByteGo with one word above it: Lesson. The newsletter asked a strange question. Can thinking more make a computer dumber? This lesson starts with the Word and then answers it.

THE WORD FIRST. When Paul taught in Berea, the people did something wise. [[Acts 17:11]] They did not check his teaching against their feelings. They checked it against what was written, every day. That is the first rule of a good second look. Check against something outside yourself.

Jesus gave the second rule. [[Matthew 5:37]] He was talking about people who pile extra promises on top of a plain answer. A plain yes does not get truer by repeating it. When the answer is plain, say it and stop.

THE OLDEST TRICK. In the garden, Yahweh's word was plain. [[Genesis 2:17]] The serpent asked a question built to make it sound unclear. [[Genesis 3:1]] Look closely at how the woman answered. [[Genesis 3:3]] Put it next to the first command and you will find words Yahweh never said. She added a rule about touching. Then he said the opposite of what Yahweh said. [[Genesis 3:4]] Nothing new was discovered. A right answer was simply talked into a wrong one, step by step.

HOW THESE MODELS WRITE. A language model builds its answer in small pieces. Each piece is picked by looking at the question and at everything already written. So early words steer later words. That can help or hurt.

Here is the help. A store raises a hundred-dollar price by twenty percent, then lowers the new price by twenty percent. Most people guess a hundred. Write the middle step, one hundred twenty, and you get the true answer, ninety-six. [[Luke 14:28]] Count first.

Some models are trained to write their working before they answer. The newsletter says one company let a model try each problem several times. Each try was scored, compared with the others, and the better tries were rewarded. At one point a model stopped in the middle of a hard equation, went back to the start, and tried again. The team called it an aha moment.

WHEN EXTRA THINKING HELPS. Hard questions deserve time. [[Proverbs 25:2]] A program kept losing the last item on a list. Someone traced three items by hand and saw the problem. At item three, the test asked if three is less than three. It is not, so the program quit early.

A second look helps most when it checks against something new. [[Proverbs 18:17]] Checking your total against the real receipt can catch a missing item. Adding your own list again cannot. Scripture warns about people who only measure themselves against themselves. [[2 Corinthians 10:12]] Trying several separate times helps when each try can go wrong in a different way. That is the old rule of witnesses. [[Deuteronomy 19:15]] One witness was never enough to settle a matter.

The best second look ends by coming back. [[Lamentations 3:40]] In the story Jesus told, the son who ran away did not need a longer speech. He came to himself, [[Luke 15:17]] and he went home to his father.

WHEN EXTRA THINKING HURTS. The newsletter reports a model that answered two plus three with five, then wrote thirteen solutions to the same question. [[Matthew 6:7]] More words did not make it more right. The Preacher said the same thing long ago. [[Ecclesiastes 5:2]]

Worse, extra thinking can drift. A train is scheduled at nine but usually leaves ten minutes late. What time does the timetable print? Nine. One model talked itself into ten after nine. Each step sounded smart, but it answered a different question. [[Proverbs 4:25]]

HOW JESUS ANSWERED. The tempter asked Jesus a doubting question. [[Matthew 4:3]] Jesus went straight back to what was written. [[Matthew 4:4]] He did not need a long argument or a clever reply. He did not try to prove Himself with a miracle. He went back to the original question, which is exactly what the newsletter says a good model should learn to do, and He did it in a single sentence.

OUR OWN APP. We have checkers too. Our first verse checker searched the whole Bible at once and passed words that were real but under the wrong verse number. A newer checker compares each quote to the exact verse it names. It found eighteen mistakes out of more than twenty-five thousand quotes, and they were fixed.

Another tool checks whether a lesson was already built. It once trusted a plain date and said a lesson existed when it did not. That was a smart-sounding step answering the wrong question, just like the train. It was fixed. Now a date only counts when it is the email's own date and sits near the newsletter's name. For this lesson it said maybe, and we checked by hand. Nothing had been built yet.

Our lesson checkers also set a minimum length for each age band. They set no maximum. Our weekly lessons have grown from about three hundred words to over three thousand. We have not measured whether longer is better, so we wrote this one shorter on purpose.

FOUR HABITS. Check against the real source. Say a plain answer once. Write the middle step on hard problems. When a second look changes your mind, ask whether it found a mistake or just a story.

THE ONE WHO IS YES. [[2 Corinthians 1:19]] Jesus never wavers. He is the Lamb of Yahweh, [[John 1:29]] the Eternal Son, [[Hebrews 1:8]] and in Him all things hold together. [[Colossians 1:17]]

${FACTS.youth}

${TALK.youth}`;

const TEEN = `${TITLE}.

WHO SENT THIS. Darrell forwarded a ByteByteGo newsletter titled with a question about whether thinking more can make a model dumb. One word was on top: Lesson. Here is the Word first, then the machine.

THE FRAME. The Bereans had a rule for checking a message. [[Acts 17:11]] They tested it against Scripture, not against their mood, and they kept doing it daily. Jesus added the rule for stopping. [[Matthew 5:37]] In context He is talking about oaths, the extra layers people add to sound more convincing. A true answer does not need padding.

THE GARDEN. The command was clear. [[Genesis 2:17]] The serpent's opening move was a question meant to plant doubt. [[Genesis 3:1]] Notice the woman's reply. [[Genesis 3:3]] Compare it with the original command and you will see she added a detail about touching that Yahweh never said. Then came the flat denial. [[Genesis 3:4]] No new fact appeared. A correct answer got reworked until it was wrong.

HOW A MODEL REASONS. A language model writes in small pieces called tokens. Each token depends on the question plus everything written so far. Early tokens steer later ones.

That is why a written middle step helps. Raise a hundred-dollar item by twenty percent and you get one hundred twenty. Cut that by twenty percent and you get ninety-six, not a hundred. [[Luke 14:28]] Count first, then build.

Reasoning models are trained to show their working. The newsletter describes one method. The model made several attempts per problem, a rule scored each one, and each attempt was compared to the rest of its group. Better-than-average attempts got reinforced. During training, it reports, one model abandoned a messy line of algebra, returned to the original equation, and started over. The company's own published page confirms its first reward-only model had trouble with endless repetition and mixed languages.

WHEN MORE TIME PAYS OFF. Some problems need digging. [[Proverbs 25:2]] Example: a loop that should number every item drops the last one. Trace it with three items. Steps one and two run. At three, is three less than three? No. It quits one early. Tracing turned a guess into a cause.

The key is what you check against. [[Proverbs 18:17]] A second look that compares your total with the original order can catch the missing line. Re-adding your own incomplete list cannot. Paul calls out people who measure themselves only by themselves. [[2 Corinthians 10:12]] Separate attempts help when each can fail differently, like independent witnesses. [[Deuteronomy 19:15]] And good reconsidering ends in a return, not a longer speech. [[Lamentations 3:40]] The son in the far country came to himself [[Luke 15:17]] and went home. That is the aha moment done right: back to the start, then forward.

WHEN MORE TIME BACKFIRES. The newsletter cites a model that solved two plus three thirteen times after getting it right the first time. A grader that only checks the final line scores both replies the same, so the score says nothing about the wasted time. [[Matthew 6:7]] [[Ecclesiastes 5:2]]

The timetable example is worse. The question asks what time is printed. The model sees nine, then decides the usual delay must matter and answers ten after nine. Every step is logical. The final answer is to a different question. [[Proverbs 4:27]] Stay on the road you were given.

One honest caution from the newsletter itself: longer answers may contain more errors simply because harder questions get longer answers. A fair test varies the thinking time on the same question.

JESUS AND THE TEMPTER. [[Matthew 4:3]] Jesus did not debate. He quoted what was written. [[Matthew 4:4]] That is returning to the original question, done right. Notice the contrast with the garden: there, a plain answer was reopened and lost; here, the same kind of question was met with the plain answer and closed.

OUR OWN CODE. Our first verse gate searched one giant string of the whole Bible. It passed real words printed under the wrong reference. The newer gate checks each quote against the exact verse named. First run: eighteen bad spans out of 25,192, all fixed.

Our duplicate finder once trusted a bare date and reported a lesson as already built when it was not. Another time a review date thirty lines away from a newsletter's name fooled it. That is drift, a logical step off the real question. It now counts a date only when it is the forward's own date and sits near the source. For this lesson it reported maybe, and a hand check confirmed nothing existed.

Our shared lesson gate's test runs fifteen cases that each plant a defect on purpose and prove it gets caught: a dropped verse, one changed word inside a quote, a band cut short, a band that copies another. A check that has never caught anything proves nothing.

And one place we resemble the two-plus-three grader: our band checks set a minimum length but no maximum. Week one ran 291 words; week eighty-eight ran 3,668. Whether the growth helps was not measured. This week was kept shorter on purpose.

FOUR MOVES. Check against the source. Say a plain answer once. Write the middle step on hard problems. When a second look flips your answer, ask what it actually found.

THE SON WHO IS YES. [[2 Corinthians 1:19]] [[2 Corinthians 1:20]] Jesus is the Lamb of Yahweh [[John 1:29]] and the Eternal Son, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]]

${FACTS.teen}

${TALK.teen}`;

const SENIOR = `${TITLE}.

WHO SENT THIS, AND WHEN. On the seventeenth of November, Darrell forwarded an engineering newsletter, ByteByteGo, whose subject asked why thinking more can make a language model dumb. Above the forwarded header he typed a single word, Lesson. The newsletter is the occasion; the Word is the substance.

THE FRAME. Two verses govern this hour. The first concerns verification. [[Acts 17:11]] The Bereans received the message eagerly, yet they tested it against an external standard, the Scriptures, and did so daily. The second concerns restraint. [[Matthew 5:37]] Our Lord spoke these words about oaths, about the habit of stacking assurances upon a plain answer to lend it weight. A truthful yes requires no reinforcement. Together the two verses mark both halves of the newsletter's argument: a second look is valuable when it consults something beyond the first, and superfluous, even harmful, when it merely multiplies words.

THE FIRST SECOND-GUESS. The command in Eden was unambiguous. [[Genesis 2:17]] The serpent's approach was a question designed to suggest ambiguity where none existed. [[Genesis 3:1]] The woman's reply, set beside the original command, contains an addition Yahweh had not spoken. [[Genesis 3:3]] The serpent then contradicted the command outright. [[Genesis 3:4]] Nothing had been discovered. A correct understanding was revised, one plausible step after another, into an error.

THE MECHANISM. A language model composes text in small units, each selected in light of the question and of everything already produced. Early text therefore shapes later reasoning, for good or ill. A recorded intermediate result often decides the matter: a one-hundred-dollar item raised twenty percent and then reduced twenty percent comes to ninety-six dollars, not one hundred, and the error is avoided only by setting down the intermediate one hundred twenty. [[Luke 14:28]] The prudent builder counts before he builds.

Reasoning models are trained to produce such working before answering. The newsletter describes a method in which a model attempted each problem several times, each attempt was scored by a rule for correctness and form, and the attempts were compared within their own group, with the stronger ones reinforced. It reports that during training one model abandoned an increasingly complicated line of algebra, returned to the original equation and reconsidered. The developer's own published account confirms that the model trained by reward alone suffered from endless repetition, poor readability and mixed languages, which is why the released model was first given worked examples.

WHEN DELIBERATION SERVES. Some questions warrant patient inquiry. [[Proverbs 25:2]] The newsletter's example of a list that always loses its final item is resolved by tracing three items by hand: at the third, the test of whether three is less than three fails, and the loop ends one item early. The tracing turned suspicion into explanation.

The decisive question is what the second look consults. [[Proverbs 18:17]] Reconciling a total against the original order may expose an omission; re-adding one's own incomplete list will not. The apostle describes the latter error precisely. [[2 Corinthians 10:12]] Independent attempts are most useful when each is liable to a different error, which is the principle of independent witnesses. [[Deuteronomy 19:15]] And sound reconsideration ends in a return. [[Lamentations 3:40]]

WHEN DELIBERATION HARMS. The newsletter reports a study in which a model, having answered two plus three correctly in its first solution, went on to produce thirteen. A grader that examines only the final line rewards the long reply and the short one equally. [[Matthew 6:7]] [[Ecclesiastes 5:2]] More seriously, deliberation can drift. Asked what departure time a timetable prints for a train scheduled at nine that habitually leaves ten minutes late, a model may begin with nine and reason its way to nine-ten. Each sentence is sensible; the answer addresses a different question. [[Proverbs 4:25]] [[Proverbs 10:19]] The newsletter itself cautions that harder questions may simply draw longer answers, so length alone proves nothing; the fair test varies the deliberation on the same question.

THE PERFECT ANSWER. When the tempter pressed a question of the same shape, [[Matthew 4:3]] our Lord did not offer a longer argument. He returned to what was written. [[Matthew 4:4]]

THIS HOUSE, EXAMINED. The application's first quotation check searched the entire Bible as one text and therefore passed genuine words printed under the wrong reference. Its successor tests each quotation against the single verse it names; on its first run it found eighteen faulty spans among 25,192, all of which were corrected. The tool that determines whether a forwarded message has already become a lesson once accepted a bare date as decisive and declared lessons built that were not, and later was misled by a review date thirty lines distant from a source's name. That is the timetable error in our own code, since corrected; for this lesson it returned only a possible match, and a manual search confirmed none existed. The shared lesson gate's test runs fifteen cases that each deliberately plant a defect and confirm it is reported. Finally, the age-band checks impose a minimum share of the adult lesson and a ceiling on reading difficulty, but no ceiling on length. The first week's adult lesson ran 291 words and the eighty-eighth 3,668. Whether that growth catches more than it adds has not been measured, and this week was deliberately written shorter.

FOUR PRACTICES. Verify against the source rather than memory. State a plain answer once. On a difficult problem, record the intermediate step. When reconsideration reverses a conclusion, ask whether it found an error or merely constructed a story.

THE ONE IN WHOM IS YEA. [[2 Corinthians 1:19]] [[2 Corinthians 1:20]] Jesus is the Lamb of Yahweh, [[John 1:29]] [[John 3:16]] the Eternal Son whose throne endures, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]]

${FACTS.senior}

${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.

WHO SENT THIS. On the seventeenth of November 2026 Darrell forwarded a ByteByteGo issue, Why Thinking More Can Make an LLM Dumb, with ONE WORD typed above the forwarded header: Lesson. Gmail thread 1a1ea6587885ee3f. Built the next day.

THE WORD FIRST. Acts 17:11 opens the hour - the Bereans searched the Scriptures daily whether those things were so - with Matthew 5:37 beside it: let your communication be yea, yea; nay, nay. Then the garden's plain word and the question built to make it look crooked (Genesis 2:17; 3:1-4); the model that writes a piece at a time and the middle step that helps (Luke 14:28); the hard question that deserves time and the second look that checks against something new (Proverbs 25:2; 18:17; 2 Corinthians 10:12; Deuteronomy 19:15); the thirteen answers to two plus three and the timetable that drifted (Matthew 6:7; Ecclesiastes 5:2-3; Proverbs 4:25-27; 10:19); and Jesus answering the second-guess in one line (Matthew 4:3-4).

OUR OWN HOUSE. Measured in the code, not painted: a quotation gate that once checked against itself and now checks against the verse named; a duplicate finder that once answered a different question and was fixed; a gate whose own test proves it can catch; and a band ladder with a floor and no ceiling on length, beside the course's own measured growth.

THE TIERS. ESTABLISHED: piece-by-piece generation and the value of a written middle step. VERIFIED at the developer's own page: endless repetition and mixed languages in the reward-only model. REPORTED by ByteByteGo: the group scoring, the aha moment, the thirteen solutions and the train. MEASURED: our gates and our lengths. NOT MEASURED: whether longer weeks catch more than they drift. ${REVIEW}.

LEFT OUT ON PURPOSE. The sponsor block, an answer tool for engineering teams.

PLACEMENT. Sovereign A.I., week 90, because a household that runs its own models and its own checkers must know when a second look is worth its time and when it is only more words.

CLOSE. [[2 Corinthians 1:19]] Jesus, the Lamb of Yahweh and the Eternal Son, is the yea every check is measured by.`,
  inApp: `No new screens this week. One page in your Study, and four small habits.

In the app: open Sovereign A.I. week 90 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each holds the whole teaching. Use Search it out on Acts 17, Matthew 5 and Genesis 3 so the Bereans, the plain yea and the garden's question sit side by side. [[Acts 17:11]]

Away from the app, four habits. Check against the source, not your memory. Say a plain answer once. Write the middle step on a hard problem. And when a second look changes your answer, ask whether it found a mistake or told you a story. ${REVIEW}.`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Acts 17:11]] [[Matthew 5:37]] [[Genesis 3:1]] [[Proverbs 18:17]] [[2 Corinthians 10:12]] [[Proverbs 4:25]] [[Matthew 4:4]] [[2 Corinthians 1:20]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, each landing on your own house.

First, read Acts 17:10-12. Mark what the Bereans checked the message against, and how often. Write one sentence on what you check important things against: the source, or your memory of it.

Second, read Genesis 2:15-17 and Genesis 3:1-6 side by side. Underline every word in the woman's answer that is not in the command. Ask where a plain instruction in your house has picked up extra words over time.

Third, read Matthew 4:1-11. Count how many words Jesus spends on each answer. Ask which of your decisions keeps getting reopened though the answer is plain.

And one verification reading, because this course works this way. Piece-by-piece generation is ESTABLISHED. The repetition problem is VERIFIED at the developer's own page. The training story, the thirteen answers and the timetable are REPORTED by the newsletter. The house's gates were MEASURED. Whether longer lessons are better was NOT MEASURED. ${REVIEW}.`,
    plan: `PLAN. Decide four measures before the week starts, and decide who hears them.

One: the source. Name the one thing you will check against this week instead of your memory - a receipt, a calendar, a verse.

Two: the plain yes. Name one answer you keep reopening, and decide to say it once.

Three: the middle step. Name the hard question that deserves time, and where you will write your working.

Four: the drift check. Name the question you are really being asked in one sentence, and keep it in front of you.

Then name the person who will ask you about all four on the same day next week.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.

Check the receipt against the order. Say the plain yes once and stop. Write the middle number on paper. When you change your mind, say what you found.

Teach the verse at a meal: let your yea be yea. Ask a child to say it back in their own words.

At the end of the week, answer three questions to the person who is asking. What did checking against the source catch? What plain answer did you stop reopening? And where did a second look turn into a story?

Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over an engineering newsletter, answered from the Word rather than from the article.`,
    `The hour opened by Acts 17:11, so every talk of checking is heard as checking against what is written.`,
    `Matthew 5:37 laid beside it, so a plain answer is said once and not padded.`,
    `The garden read as the oldest second-guess: a plain word, a question built to make it look crooked, and an answer talked from right to wrong.`,
    `Piece-by-piece generation and the written middle step taught plainly, with Luke 14:28's builder who counts first.`,
    `The hard question that deserves time, from Proverbs 25:2, with the three-item loop traced by hand.`,
    `The second look that checks against something new, from Proverbs 18:17 and 2 Corinthians 10:12.`,
    `The thirteen answers to two plus three read beside Matthew 6:7 and Ecclesiastes 5:2-3.`,
    `The timetable that drifted read beside Proverbs 4:25-27.`,
    `Jesus answering the tempter in one line from what was written, Matthew 4:4.`,
    `Our own quotation gate shown moving from checking against itself to checking against the verse it names.`,
    `Our duplicate finder's two drifts named, and the fix that keeps a date to its own question.`,
    `A floor without a ceiling named honestly in our own band ladder, beside the measured growth of the course.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, in whom is yea.`,
    `The established, the verified, the reported, the measured and the unmeasured told apart in every reader place, with a dated re-review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: 'Proverbs 18:17',
      title: 'The grocery list checked twice',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A father made a grocery list for a birthday supper and read it over twice at the kitchen table. Both times it looked complete. He was proud of how careful he had been.

At the store his daughter, who was eight, asked to see the recipe card their grandmother had written. She walked down it with her finger and his list beside it. Flour, yes. Eggs, yes. Butter, yes. Then she stopped. Candles were not on the card, but the card had a line he had never copied: buttermilk. His two careful readings had only read his own list. Her one reading had read the list against the card.

They laughed about it in the car. He did not stop checking his lists after that. He changed what he checked them against. And the next week she wanted to be the one holding the card again.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: 'Proverbs 4:25',
      title: 'The letter that was never sent',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A man had wronged his brother years before, and one winter he decided to write and ask forgiveness. His first draft was four lines long. It said what he had done, that he was sorry, and that he loved him.

Then he read it again and thought it sounded too plain. He added a paragraph explaining what had led up to it. Then another, about what his brother had done first. Then another, answering what he imagined his brother would say back. By spring the letter was six pages and had become an argument. Every sentence in it made sense. None of it was the question he had sat down to answer.

His brother died that summer. Going through his desk, the man's wife found the first draft, folded small, the four lines still true. She sat with him while he read it. He said only that he had known the answer the first night, and had talked himself past it.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'What did the Bereans check Paul’s teaching against in Acts 17:11?',
        options: ['Their own feelings', 'The Scriptures, daily', 'What the crowd in Thessalonica said'],
        answer: 1,
        explain:
          'They received the word readily and then searched the Scriptures daily, whether those things were so: a check against something outside themselves.',
      },
      {
        q: 'In its own place, what is Jesus teaching in Matthew 5:37?',
        options: [
          'That we should never answer questions',
          'That a plain yes or no needs no stack of oaths on top to make it true',
          'That long answers are always wrong',
        ],
        answer: 1,
        explain:
          'He is teaching about oaths. Extra words piled on a plain answer do not make it more true; this lesson applies that to the habit of padding a settled answer.',
      },
      {
        q: 'Comparing Genesis 3:3 with Genesis 2:17, what did the woman’s answer add?',
        options: ['A second tree', 'Neither shall ye touch it', 'Permission to eat it later'],
        answer: 1,
        explain: 'The command in Genesis 2:17 said nothing about touching. Read the Word beside the Word and the added detail shows.',
      },
      {
        q: 'A $100 item is raised 20 percent, then the new price is cut 20 percent. What is the final price, and why does a middle step help?',
        options: [
          '$100, because the changes cancel',
          '$96, because writing down $120 first shows the cut comes off the larger number',
          '$80, because 20 and 20 make 40',
        ],
        answer: 1,
        explain:
          'One hundred twenty less twenty percent is ninety-six. The written middle number is what makes the second step easy, like the builder in Luke 14:28 who counts first.',
      },
      {
        q: 'Why did the list program in the newsletter always lose its last item?',
        options: [
          'The computer was too slow',
          'At the third item it asked whether three is less than three, which is false, so it stopped one short',
          'The list was too long',
        ],
        answer: 1,
        explain: 'Tracing three items by hand turned a suspicion into an explanation and showed the fix. A hard question deserves that time (Proverbs 25:2).',
      },
      {
        q: 'Which second look is most likely to catch a missing item?',
        options: ['Adding up your own list again', 'Checking your total against the original order form', 'Reading your list faster'],
        answer: 1,
        explain:
          'A check is worth most when it tests something the first pass could have missed. Measuring ourselves by ourselves is not wise (2 Corinthians 10:12).',
      },
      {
        q: 'What went wrong when the model answered the timetable question with ten after nine?',
        options: [
          'Its arithmetic was wrong',
          'It drifted from the question asked - what the timetable prints - to a different one, when the train actually leaves',
          'It refused to answer',
        ],
        answer: 1,
        explain: 'Every sentence made sense, but the answer left the road it was given. Let thine eyes look right on (Proverbs 4:25).',
      },
      {
        q: 'How did Jesus answer the tempter in Matthew 4:3-4?',
        options: ['With a long chain of reasons', 'By going back to what was written, in one line', 'By staying silent'],
        answer: 1,
        explain: 'It is written. That is the return to the original question, done perfectly.',
      },
      {
        q: 'What did our newer quotation gate find on its first run?',
        options: ['Nothing at all', 'Eighteen of 25,192 quoted spans that were not the verse they named, all repaired', 'That every lesson was wrong'],
        answer: 1,
        explain:
          'The older gate searched the whole Bible as one text and passed real words under the wrong reference. The newer one checks against the one verse named.',
      },
      {
        q: 'Which of these does this lesson say was NOT measured?',
        options: [
          'That week one’s adult lesson was 291 words',
          'Whether the course’s longer weeks catch more mistakes than they add',
          'That the band ladder has a floor but no length ceiling',
        ],
        answer: 1,
        explain:
          'The lengths and the ladder were measured on this tree. Whether the growth helps was not, and the newsletter itself warns that harder questions may simply draw longer answers.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Acts 17:11 aloud before you say one word about any computer. Then read Matthew 5:37 aloud. Then ask the room one question and wait: when did a second look last save you, and when did one cost you?

MINUTES 0 TO 10 - THE GARDEN. Genesis 2:17, then Genesis 3:1-4. Have someone read 2:17 and 3:3 side by side and find the added words.

MINUTES 10 TO 22 - HOW A MODEL WRITES. A piece at a time, each piece looking back. Work the $100 problem on the board: 120, then 96. Luke 14:28.

MINUTES 22 TO 34 - WHEN MORE HELPS. Proverbs 25:2 and the three-item loop traced by hand. Proverbs 18:17 and 2 Corinthians 10:12: check against something new. Deuteronomy 19:15: separate witnesses.

MINUTES 34 TO 44 - WHEN MORE HURTS. The thirteen answers (Matthew 6:7; Ecclesiastes 5:2-3) and the timetable (Proverbs 4:25-27). Say plainly which parts are the newsletter's report.

MINUTES 44 TO 52 - OUR OWN HOUSE. The quotation gate that once checked against itself; the duplicate finder that drifted; the gate that proves it can catch; the floor with no ceiling and the measured growth of the course.

MINUTES 52 TO 60 - THE YEA. Matthew 4:3-4, then 2 Corinthians 1:19-20, John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Give the four household habits and close with the talk-together directions.

WHAT NOT TO DO. Do not turn this into a contest between companies or models; none is ranked here. Do not stage Genesis 3 as a debate; read the Word beside the Word and let it show what was added (DR-0098). And keep it to sixty minutes - this is the hour that says more is not always better.`,
    talkingPoints: [
      `Check against what is written, daily (Acts 17:11).`,
      `A plain yes is said once (Matthew 5:37).`,
      `The oldest second-guess was a question built to make a plain word look crooked (Genesis 3:1).`,
      `Read Genesis 3:3 beside Genesis 2:17 and the added detail shows.`,
      `A model writes a piece at a time, and early pieces steer later ones.`,
      `Write the middle step: 120, then 96 (Luke 14:28).`,
      `A hard question deserves the time (Proverbs 25:2).`,
      `Check against something new, not your own list again (Proverbs 18:17; 2 Corinthians 10:12).`,
      `Separate attempts help when each can fail differently (Deuteronomy 19:15).`,
      `Thirteen answers to two plus three are not more right than one (Matthew 6:7).`,
      `Stay on the question you were asked (Proverbs 4:25-27).`,
      `Jesus answered in one line from what was written (Matthew 4:4).`,
      `Our quotation gate now checks each quote against the verse it names: eighteen of 25,192 found and fixed.`,
      `Our duplicate finder drifted twice and was fixed so a date answers its own question.`,
      `Our band ladder has a floor and no ceiling on length; whether longer is better was not measured.`,
      `Jesus is the Lamb of Yahweh and the Eternal Son, in whom is yea (2 Corinthians 1:19-20).`,
    ],
    discussionPrompts: [
      `What do you check important things against: the source, or your memory of it?`,
      `Which plain answer in your house keeps getting reopened?`,
      `When has a second look caught a real mistake for you? What did it check against?`,
      `When has a second look talked you out of something true?`,
      `How can you tell a hard question that deserves time from a plain one you keep circling?`,
      `What question are you really being asked this week, in one sentence?`,
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
console.log(`sov90: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov90: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov90: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov90: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov90: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov90: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov90: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov90: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov90: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov90: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov90: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov90: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov90: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov90: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov90: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov90: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov90: spliced ${ID}`);
console.log(`sov90: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov90: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
