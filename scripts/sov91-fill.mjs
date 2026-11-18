// =============================================================================
// sov91-fill - build Sovereign A.I. week 91 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose holds only a reference in double brackets, [[Proverbs 27:23]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory. anchor.ref is DERIVED from the
// placeholders that occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. ByteByteGo sent "Evals for AI Engineers" on
// Wednesday 2026-11-18, an excerpt it says it ran with permission from the
// O'Reilly book of that name by Shreya Shankar and Hamel Husain. Darrell
// forwarded it into the lesson lane the same day with ONE WORD above the
// forwarded header: Lesson. Gmail thread `1a1ef8ba7f9e2432`. Built 2026-11-18.
// The two sponsor blocks are left out so one forward stays one teaching.
//
// ONE TEACHING, ONE LESSON (DR-0610). Week 90 (DR-1548, thread
// 1a1ea6587885ee3f) already teaches reasoning models and when a second look
// helps or hurts. This week does NOT re-teach it. Its own angle is
// EVALUATION: the book's three gulfs (comprehension, specification,
// generalization) and its analyze-measure-improve cycle, applied to the one
// LLM application this house runs every day - the lesson builder - from its
// own records (DR-1551, DR-1552), not from week 90's examples.
//
// WORD FIRST (DR-0127 / DR-0282). Proverbs 27:23 - know the state of thy
// flocks - and Lamentations 3:40 - search, try, turn - frame the hour before a
// single word about a model.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). REPORTED: the book's terms,
// its email-agent example and its eight-in-a-hundred illustration, as the
// newsletter carried them; oreilly.com, arxiv.org and blog.bytebytego.com gave
// HTTP 000 from this sandbox on 2026-11-18, so the excerpt is the newsletter's
// copy, quoted sparingly and attributed, never put in double quotes (those
// carry Scripture only). ESTABLISHED: a language model can answer the same
// request differently on two runs, and makes some mistakes at some rate.
// MEASURED in our own house, with file:line in the DR and pinned in the test.
// NOT MEASURED: whether naming the span lowers the builder's failure rate on
// the next teachings.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 91;
const ID = 'sov91-know-the-state-of-thy-flocks';
const TITLE = 'Know the state of thy flocks - read the real outputs, write the vision plain, weigh what still goes wrong, and turn';

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
  if (!m) throw new Error(`sov91: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov91: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov91: reference does not resolve in the corpus -> "${ref}"`);
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
const REVIEW = 're-review: 2026-11-25';

const FACTS = {
  lesson: `WHERE WE STAND ON THE FACTS. REPORTED: the three gulfs, the search-measure-improve cycle, the email helper and the eight-in-a-hundred signature check are the book's teaching as the newsletter carried it, credited to Shreya Shankar and Hamel Husain and their publisher. We take it on trust and verify what we can: the publisher's page, the research page and the newsletter's own site did not answer our network on the eighteenth of November, so we have the newsletter's copy and no other, and we name the ideas in our own words rather than quote them. ESTABLISHED, and stated plainly: a language model can answer the same request two different ways on two runs, and any such model gets some inputs wrong at some rate; no instruction removes that. MEASURED in our own house: the builder's six silent days, the four of seven teachings that failed on one problem, the rule the writer was already given, the count that could not be found, and the bug caught before it shipped are each traced to the file that records them. NOT MEASURED: whether naming the missing reference lowers the builder's failure rate on the teachings that come next. No conclusion is drawn either way. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. The three gulfs and the three steps came from a book. A newsletter sent us part of that book. We could not open the book's own page, so we took the newsletter at its word. It is sure that computer helpers do not always give the same answer twice. It is sure they make some mistakes. We counted the mistakes in our own lesson helper, and we read its own notes. We do not know yet if pointing at the exact spot will make it fail less. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. The three gulfs and the three steps are the book's ideas, carried to us by a newsletter. We could not reach the book's own page, so those stay the newsletter's report, and we tell them in our own words. It is well known that a model can answer the same thing two ways and will get some inputs wrong. Our own builder's numbers were read from its own records: four of seven stuck lessons failed on one problem. Whether naming the exact spot lowers that count was not measured yet. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. Reported: the three gulfs, the cycle, the email example and the signature check come from the book through the newsletter, and the book's own page did not answer us. Established: models vary from run to run and fail on some inputs at some rate. Measured: our builder's silent days, its four of seven on one problem, the rule it already had, and the bug caught before shipping, each read from a file. Not measured: whether naming the span lowers the rate next time. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. The three gulfs, the cycle of analysis, measurement and improvement, the email illustration and the signature check belong to the book by Shreya Shankar and Hamel Husain, received here through the newsletter that excerpted it; the publisher's page did not answer our network, so those remain the newsletter's report, and they are rendered in our own words rather than quoted. That a language model may answer one request differently on two occasions, and errs on some fraction of real inputs, is established and stated without hedging. Every statement about this house is traced to the record that makes it true: the silent days, the four of seven failures on a single problem, the instruction already in the writer's hands, and the defect caught before release. Whether naming the missing reference reduces the failure rate has not yet been measured, and no conclusion is offered. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  'And measure the growth the Word’s way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - when you give someone a job to do, how do you know they understood what you meant - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Habakkuk 2:2. Children, ask your mother, your father or a grandparent about a time an instruction they gave was followed exactly and still came out wrong; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: which mistake in our week keeps coming back, and have we ever counted it. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - how do you know your room is really clean - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Proverbs 27:23. Children, ask your mom or your dad or your grandma or your grandpa about a time someone did a job the wrong way because the words were not clear. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what do we check by looking, and what do we only guess. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is one job where nobody ever told you what done looks like - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, 1 Corinthians 14:8. Children, ask your mom, your dad or a grandparent about a mistake they made more than once before they noticed it was the same mistake, and hear the whole of it before you answer; then retell their answer in your own words. Then ask a friend this: what would we see if we counted instead of guessed. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when something you made did not work, how did you tell whether the plan was unclear or the doing slipped - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Lamentations 3:40. Children, ask your mom, your dad or a grandparent how they find out what is really going on at work or at home before they change anything, and hear the whole of it before you reply; then retell their answer in your own words. Then ask a friend this: which of our problems have we argued about without ever looking at the real cases. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - how do you know a thing you depend on is working, and not only that it looks fine - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Proverbs 18:13. Children, ask your parents or your grandparents about a time they saw the real state of something only by going to look for themselves; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: where do the people we serve have no way to catch our mistakes, and what do we owe them there. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no detail from the book stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.
WHO SENT THIS, AND WHEN. On the eighteenth of November 2026 the engineering newsletter ByteByteGo carried a long excerpt from a new book, Evals for AI Engineers, by Shreya Shankar and Hamel Husain, published by O'Reilly. The same day Darrell forwarded it into this lane with ONE WORD typed above it: Lesson. That word is the ask; the excerpt is only the occasion. Last week's hour taught when a second look helps a model and when it hurts. This hour asks a different question, the one every builder of these systems must answer: how do you find out whether the thing is doing what you meant?
THE WORD FIRST, BEFORE ANY MACHINE. Two verses frame this hour. The first is a shepherd's rule: [[Proverbs 27:23]] A shepherd does not know his flock by remembering the lambs he hoped to have. He goes out, he looks, he counts, and he notices the one that limps. Knowing the state of a thing is work done with the eyes, not with the hopes. The second verse gives the whole cycle in three verbs: [[Lamentations 3:40]] Search: look honestly at what is there. Try: test it, weigh it, count it. Turn: change direction where the weighing shows you are wrong. Hold those three verbs. The book arrives at the same three, and our own house walked them this very week.`,
  `THE BUILDER WHO WENT TO LOOK. Nehemiah wept over the news of Jerusalem's broken walls, and he prayed. But before he asked one person to lift one stone, he went out at night and looked for himself: [[Nehemiah 2:15]] Only after he had seen it did he call the people to work, and notice how he began: [[Nehemiah 2:17]] Ye see, he said, because he had seen. He did not design the rebuilding from a report he had never checked. The opposite of Nehemiah is named in Proverbs: [[Proverbs 18:13]] To build a system against an imagined version of its work is to answer a matter before hearing it.`,
  `WHAT THE BOOK SAYS: THREE GULFS. Shankar and Husain describe three gaps that stand between what a builder means and what an AI system does, and they call them gulfs. Their example is a helper that reads incoming email, pulls out the sender's name, sums up what is being asked, and sorts the message.
The first is the gulf of comprehension, between the builder and the data. Real email is not the tidy sample in your head. It holds forwards, replies with long quoted threads underneath, signatures in more than one language, and text pasted out of documents with the formatting broken. A helper built for the tidy sample will sum up the whole old thread instead of the new message, or take a signature for the request. The gulf runs the other way too: you cannot read every answer the system gives, but you must know the common ways it succeeds and fails, or a few good examples will fool you.
The second is the gulf of specification, between the builder and the model. What we mean is only loosely caught by what we write. Pull out the sender's name and sum up the requests, the instruction says. But in a paragraph or in points? The name shown, the address, or both? Only what is asked outright, or what is hinted too? How short? If the builder does not decide, the model guesses, and two runs may come back in two shapes. The Word saw this long before: [[Habakkuk 2:2]] and Paul put the same thing as a soldier would hear it: [[1 Corinthians 14:8]]
The third is the gulf of generalization, between the data and the model. Even when you know your inputs and your instructions are plain, the model will still get some cases wrong. If an email's body mentions a famous person, the helper may now and then hand back that name instead of the sender's. Nothing about your reading or your instruction was wrong. The model failed to apply a clear rule the same way every time. The book says these errors show up only across the full variety of real data, and that they cannot be avoided. Scripture is honest about every worker: [[James 3:2]]
The book's quiet gift is a shared vocabulary. A team that can say this is a specification failure or this is a generalization failure stops arguing about whether the model works and starts choosing the right fix. And it warns that where the people using a system cannot catch its mistakes, or where a mistake costs much, the checking must be heavier. [[Luke 12:48]]`,
  `SEARCH, TRY, TURN: THE CYCLE. The book's answer is a loop it names analyze, measure, improve. Analyze means reading the real record of what the system did, case by case, talking with the people who know what right looks like, and writing down the ways it fails, without counting yet. Measure means asking how often each failure happens, and whether that rate is low enough; without a count you are steering by your impression of a handful of cases, which misleads in both directions. The counting is done by evaluators, either plain rules written in code or a second model asked to judge. Their example: a simple rule that looks for signature lines in the summaries, run across thousands of answers, finds them in about eight of every hundred. Improve means choosing the fix that fits the failure. A specification gap is closed by saying more plainly what you want. A generalization failure needs a stronger hand: more examples, better retrieval of the right material, further training, or a redesign, such as reading the sender from the email's own header instead of asking the model to find the name in the body. Then the loop runs again.
This is Lamentations 3:40 with a stopwatch. Search is analyze. Try is measure, and the Word cares how we weigh: [[Proverbs 11:1]] A just weight is a count you did not round in your own favor. And turn is improve, done because the weighing told you the truth: [[Daniel 5:27]]`,
  `OUR OWN HOUSE, MEASURED, NOT PAINTED. This house runs exactly the kind of system the book describes. When a teaching comes in, a lesson builder on our own home server asks a model to draft a lesson from it, and a row of gates weighs the draft before anything is kept. This week that builder walked the whole cycle, and the records say so.
Search. For six days the builder's own failure count could say only other: six. Six teachings were stuck and nothing said why. The tool that reads the queue did not guess. It said the next read was the builder's own record on the box, and a small reader was written to make that read. It prints which gate refused and how many faults it found, and it never prints a draft or a prompt, because those carry a person's words.
Try. The first read that named the gates found that the quotation gate had refused four of the seven waiting teachings, the verse gate three, the voice gate one, and three had crashed outright. The next read named the problem inside the gate, and it was the same one every time: four of the seven died on a quoted span with no reference after it. Not scatter. One repeated behavior.
Which gulf? The writer's instructions already said it plainly: every double-quoted span is Scripture and is followed at once by its reference. And the earlier attempt's failure lines were handed to the next attempt. So the instruction was not missing; these drafts failed with the rule in hand. By the book's words that leans toward generalization, not specification. But one more look found a gap of our own: the feedback was only a count. Seven quoted spans, four with a reference, it said, and the second attempt was asked to fix what it could not find.
Turn. The gate now names the spans that lack a reference, up to five of them. What the gate accepts was not changed; whether that rule is the right rule stays Darrell's call.
And the weigher was weighed. While that change was made, a bug was caught before it shipped: the matcher handed back its pieces in bundles, so every span looked unreferenced, and a clean draft would have been told its Scripture carried none. A check was also added that fails if a gate's wording changes and the sorting stops recognizing it. A judge must be judged too.
The strongest hand is the one this course already uses. No verse in this course is asked of a model's memory. A fill script takes every quotation from the King James file on disk at build time, the way the book's redesign takes the sender from the header instead of asking the model to read it from the body.
What is not yet known: whether naming the span lowers the failure rate on the next teachings. The seven stuck rows were past their attempt budget, so the change helps the ones still to come, and that count has not been taken.`,
  `THE ONE WHO NEVER FAILED ON ANY INPUT. Every gulf in this hour is a gap between what was meant and what was done. There is one in whom that gap never opened. [[Hebrews 4:15]] Every test, every pressure, every kind of case, and no failure. Run Him on any day and the answer is the same: [[Hebrews 13:8]] He is the Lamb of Yahweh, [[John 1:29]] the Son the Father gave, [[John 3:16]] the Eternal Son whose throne stands for ever, [[Hebrews 1:8]] and the One in whom all things hold together. [[Colossians 1:17]] Our gates and our counts are honest work in a world where every worker slips. He is the standard they are weighed against.`,
  `FOUR THINGS FOR THE HOUSE. One: go and look at the real cases before you change anything. Two: write what you mean plainly enough that a stranger could run with it. Three: count how often a mistake happens before you decide how bad it is. Four: name which kind of failure it is before you choose the fix, and check your checker. Every one of those is a household habit before it is an engineering one: the chores chart, the grocery list, the budget, the child's homework.`,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.
WHO SENT THIS. Darrell read an email about computer helpers. It had part of a book in it. He sent it to us with one word on top. The word was Lesson. So here it is.
THE WORD FIRST. A shepherd takes care of sheep. The Bible tells him what to do. [[Proverbs 27:23]] That means go and look. Count the sheep. See which one is hurt. Do not just hope they are fine.
Here is a second verse. [[Lamentations 3:40]] It has three action words. Search means look hard. Try means test it. Turn means change what is wrong. Keep those three words. We will use them a lot today.
A MAN WHO WENT TO LOOK. Long ago a man named Nehemiah heard sad news. The walls of his city were broken. He did not start yelling orders. First he went out at night to look. [[Nehemiah 2:15]] Then he told the people what he saw. [[Nehemiah 2:17]] He said ye see, because he had seen it for real. The Bible says it is silly to answer before you hear. [[Proverbs 18:13]]
THE BOOK. Two people wrote a book about computer helpers. Their names are Shreya Shankar and Hamel Husain. They say there are three big gaps between what we want and what the helper does. They call each gap a gulf. A gulf is a wide gap, like a deep ditch you cannot just step over.
Their helper reads email. It finds who sent it. It tells what the person wants.
GULF ONE: NOT KNOWING THE REAL STUFF. Real email is messy. Some emails have old emails stuck under them. Some have long names and phone numbers at the bottom. If you build the helper for neat emails, it gets mixed up by messy ones. It might tell about the old email and not the new one. So you have to look at lots of real emails first, just like Nehemiah looked at the real wall.
GULF TWO: NOT SAYING IT CLEARLY. Say you tell the helper, find the name and tell what they want. But do you want a list or a story? Short or long? The first name or the whole name? If you do not say, the helper guesses. One day it does it one way. The next day it does it another way. The Bible says to make it plain. [[Habakkuk 2:2]] Paul said a horn must give a clear sound. [[1 Corinthians 14:8]]
GULF THREE: MISTAKES ANYWAY. Even when you know the real emails, and even when you say it clearly, the helper still makes some mistakes. Say an email talks about a famous person. Sometimes the helper picks the famous name and not the real sender. You did nothing wrong. Helpers just slip sometimes. People slip too. [[James 3:2]]
THE THREE STEPS. The book gives three steps. Look at what the helper did. Count how often each mistake happens. Then fix the right thing. That is search, try and turn, from our verse! The Bible likes fair counting. [[Proverbs 11:1]] Once a king was weighed and found too light. [[Daniel 5:27]] Counting tells the truth even when we do not want to hear it.
If the helper did not know what you wanted, say it more clearly. If it knew and still slipped, you need a bigger fix. One big fix is to stop asking the helper to guess. The book says you can read the sender from the top of the email, where it is already written.
The book also says this. If the people using a helper cannot spot its mistakes, you must check extra hard for them. [[Luke 12:48]]
OUR OWN APP. Our app has a lesson helper too. It turns things people send into lessons. Checkers look at each lesson before we keep it.
This week some lessons got stuck. For six days the notes only said other. Nobody knew why. So we did not guess. We went and read the helper's own notes, like Nehemiah at the wall. Our reader shows which checker said no. It never shows a person's own words.
Then we counted. Four of the seven stuck lessons had the same mistake. A Bible verse was in quote marks, but the place it came from was missing.
Here is the odd part. The helper was already told the rule. It was even told it failed before. It still slipped. That is gulf three. But we found a gulf of our own too. The checker only said how many were missing. It did not say which ones. So the helper could not find them to fix them.
Now the checker points to the exact verses that are missing their place. We also found a bug in our own checker before it went out. It would have said good lessons were bad. So we check the checker too.
And here is our biggest fix. In these lessons we never ask a computer to remember a Bible verse. A tool copies each verse right out of the Bible file. That is like reading the name from the top of the email.
JESUS NEVER SLIPPED. Every gulf is a gap between what was meant and what was done. Jesus never had that gap. [[Hebrews 4:15]] He is the same every day. [[Hebrews 13:8]] He is the Lamb of Yahweh. [[John 1:29]] [[John 3:16]] He holds everything together. [[Colossians 1:17]]
FOUR THINGS TO DO. Go and look before you fix. Say what you want clearly. Count before you decide. Find out what kind of mistake it is, and check your checker.
${FACTS.child}
${TALK.child}`;

const YOUTH = `${TITLE}.
WHO SENT THIS. Darrell forwarded a ByteByteGo newsletter with one word above it: Lesson. It carried a long piece of a new book, Evals for AI Engineers, by Shreya Shankar and Hamel Husain. Last week we learned when thinking longer helps a model and when it hurts. This week asks something else. How do you find out if your system is doing what you meant?
THE WORD FIRST. A shepherd's rule comes first. [[Proverbs 27:23]] You do not know your flock by remembering it. You go out and look and count, and you notice the lamb that limps. Then a verse with three verbs. [[Lamentations 3:40]] Search is looking honestly. Try is testing and weighing. Turn is changing course. That is the whole lesson in one line.
NEHEMIAH WENT TO SEE. When Nehemiah heard Jerusalem's walls were broken, he prayed. Then, before giving one order, he rode out at night and inspected them. [[Nehemiah 2:15]] Only then did he speak. [[Nehemiah 2:17]] He could say ye see because he had seen. Proverbs warns about doing the opposite. [[Proverbs 18:13]] Building a system for a version of the job you only imagine is answering before you hear.
THE THREE GULFS. The book says three gaps stand between what a builder wants and what an AI system does. It calls them gulfs. The example is a helper that reads email, finds the sender, sums up the requests, and sorts the message.
The gulf of comprehension is between you and your data. Real email is messy. It has forwards and long old threads under the new note. It has signatures and text pasted from other files. A helper built for neat examples might sum up the old thread instead of the new one. It might think a signature is the request. The same is true of answers. You cannot read every one, but you must know the usual ways it goes right and wrong.
The gulf of specification is between you and the model. Your instruction says find the sender and sum up the requests. But does that mean bullets or a paragraph? A name or an address? Hinted requests or only stated ones? How short? If you do not decide, the model decides for you, maybe differently each time. [[Habakkuk 2:2]] A trumpet with a fuzzy note helps nobody. [[1 Corinthians 14:8]]
The gulf of generalization is between your data and the model. Say your rules are clear and you know the inputs well. The model will still slip at times. If an email names a famous person, the model might now and then give back that name instead of the sender's. You did nothing wrong. It just did not use the rule the same way every time. The book says these errors cannot be avoided. The Bible says the same of every worker. [[James 3:2]]
Notice that the three gulfs need three different fixes. Reading more emails will not fix a vague prompt, and a clearer prompt will not stop every slip. That is why naming the gulf comes first.
Having names for these helps a team. Instead of arguing that the model is broken, they can say this is a specification problem or a generalization problem, and pick the right fix. And where users cannot catch mistakes, the builder owes them heavier checking. [[Luke 12:48]]
THE CYCLE. The book's loop is analyze, measure, improve. Analyze: read what the system really did, case by case, and list the ways it fails. Measure: count how often each failure happens, using simple code rules or a second model as a judge. The book's example rule looked for signature lines in summaries and found them in about eight out of every hundred. Improve: if the instructions were vague, make them clear. If the model slips even with clear instructions, use a stronger fix: more examples, better material to look things up in, more training, or a redesign, like reading the sender from the email header instead of asking the model.
That is search, try and turn. And the weighing must be honest. [[Proverbs 11:1]] A king was once weighed and the scale did not flatter him. [[Daniel 5:27]]
OUR OWN HOUSE. Our home server runs a lesson builder. A model drafts a lesson from a teaching, and a set of gates checks the draft.
Search. For six days its failure count could only say other. Six teachings were stuck with no reason given. Nobody guessed. A small reader was written to read the builder's own records, and it shows which gate refused without ever printing a person's words.
Try. The count came back: the quotation gate refused four of the seven, the verse gate three, the voice gate one, and three had crashed. Looking deeper, four of the seven had failed on one thing: a Bible quote with no reference after it.
Which gulf? The builder's instructions already stated that rule, and it was shown its earlier failures. It still slipped, which sounds like generalization. But we found our own gap too. The feedback only gave a count, like seven quotes and four with a reference, so the next try could not find which ones to fix.
Turn. The gate now names up to five quotes that are missing a reference. What it allows did not change. While building that, a bug was caught that would have called every quote unreferenced, even in a clean draft. So we check our checkers too.
Our strongest fix was already in place. In this course a model never supplies a Bible verse from memory. A script copies each one from the King James file on disk. That is the same idea as reading the sender from the header.
THE ONE WITH NO GAP. Every gulf is a gap between what was meant and what was done. Jesus never had one. [[Hebrews 4:15]] He is the same every day. [[Hebrews 13:8]] He is the Lamb of Yahweh, [[John 1:29]] [[John 3:16]] the Eternal Son, [[Hebrews 1:8]] who holds all things together. [[Colossians 1:17]]
FOUR HABITS. Look at the real cases first. Say what you mean plainly. Count before you judge. Name the kind of failure before you fix it, and check your checker.
${FACTS.youth}
${TALK.youth}`;

const TEEN = `${TITLE}.
WHO SENT THIS. Darrell forwarded a ByteByteGo newsletter carrying an excerpt from Evals for AI Engineers, a new O'Reilly book by Shreya Shankar and Hamel Husain. One word was on top: Lesson. Week 90 covered when extra reasoning helps or hurts. This week is about evaluation: how a builder finds out whether an AI system is doing what was intended.
THE FRAME. Start with the shepherd. [[Proverbs 27:23]] Knowing the state of something is not memory or optimism; it is going and looking. Then the method. [[Lamentations 3:40]] Search, try, turn: examine, test, change direction. Hold onto those three; the book lands on the same three.
NEHEMIAH'S NIGHT RIDE. Nehemiah did not start rebuilding from a rumor. He inspected the damage himself first, at night, quietly. [[Nehemiah 2:15]] Then he addressed the people. [[Nehemiah 2:17]] Ye see: he could say it because he had looked. The failure mode is named in Proverbs. [[Proverbs 18:13]] Designing a system around an imagined version of the task is exactly that.
THE THREE GULFS. The authors describe three gaps between intent and behavior in any app built on a language model. Their running example is an email agent that extracts the sender, summarizes requests, and categorizes the message.
Gulf of comprehension: you versus your data. Real email has forwards. It has old threads quoted below the new message. It has signatures in more than one language, and text pasted from documents with the spacing wrecked. A prompt built on clean samples might sum up the old thread. It might treat a signature as the request. The same goes for outputs. You will never read them all, so you need to know the common ways they go right and wrong. Otherwise a few good examples will fool you.
Gulf of specification: you versus the model. The prompt says pull out the sender's name and sum up the key requests. That leaves a lot open. Bullets or a paragraph? The name or the address? Only what was asked out loud, or hints too? How short? Choices you skip get guessed, and two runs can come back different. [[Habakkuk 2:2]] Paul's version: [[1 Corinthians 14:8]]
Gulf of generalization: your data versus the model. Say you know the inputs well and the prompt is clear. The model still makes mistakes. Mention a famous person in the body and it may once in a while return that name instead of the sender. Your reading was fine. Your prompt was fine. The model just did not apply the rule the same way every time. These slips show up only across lots of real cases, and you cannot avoid them. [[James 3:2]]
The payoff is vocabulary. A team that can label a specification failure versus a generalization failure stops debating whether the model works and picks the matching fix. The book also scales rigor to stakes: when users cannot catch errors, the builder must check harder. [[Luke 12:48]]
THE CYCLE. Step one is analyze. Read traces, which are the full record of what the agent did. Talk to people who know what right looks like. List the ways it fails, but do not count yet. Step two is measure. How often does each failure happen, and is that low enough? The counting is done by checks written in code, or by a second model used as a judge. Their example check looks for signature lines in summaries. Across thousands of answers it finds them in about eight of every hundred. Step three is improve. If the spec was vague, tighten the prompt. If the model slips with a clear spec, go stronger: more examples, better material to look things up in, more training, or a redesign. One redesign reads the sender from the email's header, so the model never has to dig the name out of the body. Then run the loop again.
Map it back: analyze is search, measure is try, improve is turn. Honest measurement is a moral issue. [[Proverbs 11:1]] And a measurement can deliver bad news. [[Daniel 5:27]]
OUR OWN CODE. Our NAS runs a lesson builder: a model drafts a lesson from a teaching, and gates score the draft. This week it ran the full cycle, and the records show it.
Search: for six days the failure count could only say other, six. Nobody guessed. The count pointed to the builder's own records, and a small script was written to read them. It prints which gate said no and how many faults it found. It never prints a draft or a prompt, because those hold people's words.
Try: the quotation gate refused four of seven waiting teachings, the verse gate three, the voice gate one, and three crashed. Drilling in, four of seven failed on one problem: a quoted span with no reference.
Diagnosis: the writer's prompt already states that rule. Its earlier failures are fed back to the next attempt too. So the spec was there, which points to generalization. But there was a second gap. The feedback was a bare count, seven quoted spans and four with a reference. The retry could not find which ones to fix.
Turn: the gate now lists up to five spans that lack a reference. What it accepts did not change. Whether the rule itself is right is Darrell's call. Then the checker got checked. A matching bug would have flagged every span, even in a clean draft. It was caught before it shipped. A drift test now fails if someone rewords a gate's message and the sorting quietly breaks.
The biggest fix was already here. No verse in this course comes from a model's memory. A fill script pulls every quote from the King James file when the lesson is built. That is our version of reading the header instead of digging through the body.
Open question: whether span-level feedback lowers the failure rate. The seven stuck rows were past their retry budget, so the change applies to future teachings, and that count has not been taken.
THE SON WITH NO GULF. Every gulf is distance between intent and outcome. Jesus has none. [[Hebrews 4:15]] Same output every time. [[Hebrews 13:8]] The Lamb of Yahweh [[John 1:29]] and the Eternal Son, [[Hebrews 1:8]] in whom all things consist. [[Colossians 1:17]]
FOUR MOVES. Inspect real cases first. Write the spec plainly. Count before you judge. Classify the failure before choosing the fix, and test your tests.
${FACTS.teen}
${TALK.teen}`;

const SENIOR = `${TITLE}.
WHO SENT THIS, AND WHEN. On the eighteenth of November, Darrell forwarded an engineering newsletter, ByteByteGo, carrying a substantial excerpt from Evals for AI Engineers, a new book by Shreya Shankar and Hamel Husain, with a single word above it: Lesson. The previous week considered when prolonged reasoning serves a model and when it harms; this week takes up the prior question of evaluation, how a builder discovers whether a system actually does what was intended.
THE FRAME. Two verses govern the hour. The first is pastoral and practical. [[Proverbs 27:23]] A shepherd's knowledge of his flock is not recollection or expectation; it is inspection, renewed by going out and looking. The second supplies the method. [[Lamentations 3:40]] Search, try, turn: honest examination, deliberate testing, and a change of course where the testing requires it. The book arrives at precisely these three movements.
THE GOVERNOR WHO INSPECTED FIRST. When Nehemiah learned of Jerusalem's ruin, he grieved and prayed, and then, before issuing a single instruction, he surveyed the walls himself by night. [[Nehemiah 2:15]] Only afterwards did he address the people. [[Nehemiah 2:17]] His appeal rested on what he had personally observed. Proverbs names the contrary error. [[Proverbs 18:13]] To design a system for a task one has imagined rather than examined is to answer before hearing.
THE THREE GULFS. The authors identify three gaps separating a builder's intention from an AI system's behavior, and call them gulfs, a term they adapt from earlier design research. Their illustration is an agent that reads incoming mail, identifies the sender, summarizes the requests, and classifies the message.
The gulf of comprehension lies between the builder and the data. Actual correspondence includes forwarded chains, long quoted histories, signatures in several languages, and text pasted from documents with its formatting destroyed. A design that presumes tidy messages may summarize an old thread in place of the new message, or mistake a signature for the request. The gulf extends to outputs as well: one cannot read every response, yet one must recognize the characteristic ways the system succeeds and fails.
The gulf of specification lies between the builder and the model. An instruction to extract the sender and summarize the requests leaves undecided the format, whether a name or an address is wanted, whether implied requests count, and how brief the summary should be. Whatever is left unstated the model supplies by guesswork, and successive runs may differ. [[Habakkuk 2:2]] The apostle made the same point in martial terms. [[1 Corinthians 14:8]]
The gulf of generalization lies between the data and the model. Even with thorough knowledge of the inputs and an unambiguous instruction, the model will occasionally err; a message mentioning a public figure may yield that name in place of the sender's. Neither the builder's knowledge nor the instruction was at fault; the rule was simply applied inconsistently. The authors hold such errors to be unavoidable and visible only across the full range of real cases. [[James 3:2]]
The value of these distinctions is a shared vocabulary, by which a team may distinguish a failure of specification from a failure of generalization rather than contend vaguely about whether the model works. The authors add that where users cannot detect errors, or errors are costly, evaluation must be correspondingly more rigorous. [[Luke 12:48]]
THE CYCLE. Their remedy is a recurring sequence of analysis, measurement, and improvement. Analysis reads the full record of what the system did, consults those who know what a correct result looks like, and catalogs the modes of failure without yet quantifying them. Measurement establishes how frequently each mode occurs, by rules written in code or by a second model acting as judge; their example finds signature boilerplate in roughly eight of every hundred summaries. Improvement matches the remedy to the cause: clearer instructions for a specification gap; for a generalization failure, more examples, better retrieval, further training, or redesign, such as taking the sender from the message header rather than asking the model to infer it.
Search, try, and turn, in other words. Honest weighing is itself a matter of righteousness. [[Proverbs 11:1]] And a true measure does not flatter. [[Daniel 5:27]]
THIS HOUSE, EXAMINED. The application's lesson builder, running on the household server, is a system of exactly this kind: a model drafts a lesson from a submitted teaching, and a series of gates evaluates the draft. This week it passed through every stage of the cycle, and its records document each one.
For six days its failure census could report only an unexplained category of six. Rather than guess, the census directed attention to the builder's own records, and a reader was written for them, one that reports which gate refused and how many faults it found while never printing a draft or prompt, since those contain a person's words.
The first named reading found that the quotation gate had refused four of the seven waiting teachings, the verse gate three, the voice gate one, and that three had failed outright. A further reading found that four of the seven had failed on a single problem: a quoted span with no reference following it.
The diagnosis was instructive. The writer's instructions already stated the rule, and earlier failures were returned to each new attempt, so the specification was present and the pattern pointed to generalization. Yet a second gap appeared: the feedback reported only a count, seven quoted spans and four referenced, leaving the next attempt unable to locate what needed correction. The gate now names up to five unreferenced spans; what it accepts is unchanged, and whether the rule is itself correct remains Darrell's decision. In making the change, a defect that would have reported every span as unreferenced, even in a clean draft, was caught before release, and a test now fails should a gate's wording change and its classification silently lapse. The evaluator, too, is evaluated.
The most decisive remedy predates all of this. No verse in the course is supplied from a model's memory; a fill script draws each quotation from the King James text on disk at build time, which is the household's equivalent of reading the header rather than parsing the body.
What remains unknown is whether naming the span will reduce the failure rate. The seven stalled teachings had exhausted their attempts, so the change serves those still to come, and their count has not yet been taken.
THE ONE IN WHOM NO GULF OPENED. Each gulf is a distance between intention and performance. In Jesus there was none. [[Hebrews 4:15]] He is constant across every occasion. [[Hebrews 13:8]] He is the Lamb of Yahweh, [[John 1:29]] [[John 3:16]] the Eternal Son whose throne endures, [[Hebrews 1:8]] in whom all things consist. [[Colossians 1:17]]
FOUR PRACTICES. Examine actual cases before altering anything. State intentions plainly enough for another to act on them. Count before judging severity. Identify the kind of failure before selecting a remedy, and examine the examiner.
${FACTS.senior}
${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.
WHO SENT THIS. On the eighteenth of November 2026 Darrell forwarded a ByteByteGo issue carrying an excerpt from Evals for AI Engineers, by Shreya Shankar and Hamel Husain (O'Reilly), with ONE WORD typed above the forwarded header: Lesson. Week 90 taught when a second look helps or hurts a model; this week teaches how a builder finds out whether a system does what was meant.
THE WORD FIRST. Proverbs 27:23 opens the hour - be thou diligent to know the state of thy flocks - with Lamentations 3:40 beside it: search, try, turn. [[Proverbs 27:23]] [[Lamentations 3:40]] Nehemiah inspects the walls before he asks anyone to build; Habakkuk 2:2 and 1 Corinthians 14:8 make the vision plain; James 3:2 admits every worker slips; Proverbs 11:1 asks for a just weight.
THE BOOK, IN OUR WORDS. Three gulfs: comprehension (you do not yet know your real inputs and outputs), specification (you have not said plainly what you want), generalization (you have, and the model still slips on some cases). And one cycle: analyze, measure, improve.
OUR OWN HOUSE. The lesson builder on our own server walked the cycle this week: six silent days read from its own records, four of seven stuck teachings failing on one problem, a rule the writer already had, feedback that gave a count instead of a place, the place now named, and a bug in the checker caught before it shipped.
THE TIERS. REPORTED: the book's terms and examples, through the newsletter. ESTABLISHED: models vary run to run and fail at some rate. MEASURED: our builder's records. NOT MEASURED: whether naming the span lowers the rate. ${REVIEW}.
LEFT OUT ON PURPOSE. The two sponsor blocks.
PLACEMENT. Sovereign A.I., week 91, because a household that runs its own models must be able to tell whether they are doing what it meant.
CLOSE. [[Hebrews 4:15]] Jesus, the Lamb of Yahweh and the Eternal Son, is the one in whom intent and act never parted.`,
  inApp: `One screen to read in this app, and one page in your Study.
In the app: open Sovereign A.I. week 91 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one is whole on its own. Then open Your lessons and read the states of the teachings you have sent in: waiting, built, or stuck with a reason. That list is the same record this hour reads, seen from your side. [[Proverbs 27:23]]
In your Study, write three lines about one thing you depend on - a chore chart, a budget, a tool at work. Search: what does it really do on an ordinary day? Try: how often does it go wrong, counted, not guessed? Turn: is the fix a plainer instruction or a stronger change? [[Lamentations 3:40]]`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Proverbs 27:23]] [[Lamentations 3:40]] [[Nehemiah 2:15]] [[Proverbs 18:13]] [[Habakkuk 2:2]] [[1 Corinthians 14:8]] [[James 3:2]] [[Proverbs 11:1]] [[Hebrews 4:15]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, each landing on your own house.
First, read Nehemiah 2:11-18. Mark everything Nehemiah did before he spoke to anyone. Write one sentence on a decision you are about to make from a report you have not checked yourself.
Second, read Habakkuk 2:1-3 and 1 Corinthians 14:7-9. Write down one instruction you gave this month that could be followed two different ways. Rewrite it so a stranger could run with it.
Third, read James 3:1-2 and Proverbs 11:1. Name one mistake in your week that keeps coming back. Write down how many times it happened, counted, not remembered.
And one verification reading, because this course works this way. The three gulfs and the cycle are the book's, reported through a newsletter. That models vary and slip is established. Our builder's numbers were read from its own records. Whether the fix lowers the rate is not yet measured. ${REVIEW}.`,
    plan: `PLAN. Decide four measures before the week starts, and decide who hears them.
One: the look. Name one thing you will go and inspect yourself instead of trusting the report.
Two: the plain word. Name one instruction you will rewrite so it cannot be read two ways.
Three: the count. Name one repeating mistake you will tally every day this week.
Four: the kind. Before you fix it, write whether it was unclear instructions or a slip despite clear ones.
Then name the person who will ask you about all four on the same day next week.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.
Go and look at the real thing. Rewrite the instruction plainly and hand it over. Mark the tally each evening. At the end, choose the fix that fits the kind of failure.
Teach the verse at a meal: know the state of thy flocks. Ask a child to say it back in their own words.
At the end of the week, answer three questions to the person who is asking. What did looking show that the report did not? How many times did the mistake happen? Which fix did you choose, and why that one?
Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a book excerpt on evaluating AI systems, answered from the Word rather than from the book.`,
    `The hour opened by Proverbs 27:23, so knowing the state of a thing is heard as going and looking.`,
    `Lamentations 3:40 laid beside it, so search, try and turn carry the whole cycle.`,
    `Nehemiah inspecting the walls before asking anyone to build, with Proverbs 18:13 naming the opposite.`,
    `The gulf of comprehension taught plainly: real inputs are messier than the sample in your head.`,
    `The gulf of specification taught from Habakkuk 2:2 and 1 Corinthians 14:8: what is not said is guessed.`,
    `The gulf of generalization taught honestly from James 3:2: clear instructions still meet some slips.`,
    `The analyze, measure and improve loop mapped onto search, try and turn, with Proverbs 11:1's just weight.`,
    `Heavier checking where users cannot catch mistakes, from Luke 12:48.`,
    `Our own lesson builder's week read from its own records: six silent days, four of seven on one problem.`,
    `The difference between a missing rule and a slip despite the rule, shown in our own house.`,
    `Feedback that gave a count instead of a place, named as our own gap, and fixed.`,
    `The checker checked: a bug caught before it shipped, and a drift test that guards the sorting.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, in whom intent and act never parted.`,
    `The reported, the established, the measured and the unmeasured told apart in every reader place, with a dated re-review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: 'Habakkuk 2:2',
      title: 'Three batches from one recipe card',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A grandmother was asked to bring her biscuits to the church supper, but her wrist was in a brace that week, so she wrote the recipe on a card and handed it to her three grandchildren to bake together.
They split the work and each made a batch. The first batch came out flat. The second came out salty enough to make the pastor cough. The third was perfect. At the table they compared notes. The card said a little salt, a good bit of butter, and bake until done. The eldest had read a little as a pinch, the middle one as a spoonful, and the youngest had simply gone next door and watched their grandmother's neighbor make the same biscuits.
Nobody had disobeyed the card. The card had left the choices open, and each of them had filled the gap a different way. The grandmother laughed until she had to sit down. The next week she sat in the kitchen with the youngest and rewrote the card: one level teaspoon, half a cup, twelve minutes, golden on top. She taped it inside the cupboard door, where everyone who came after could run with it.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: 'Luke 12:48',
      title: 'The labels he could no longer read',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A widower in his eighties took seven medicines, and his eyes had grown too weak to read the labels. His daughter lived two hours away. She sorted his pills into a weekly box every other Sunday, and for a year it worked.
One Sunday she noticed a new bottle. The pharmacy had changed a dose, and the new label said once a day where the old one had said twice. She had been filling the box from memory, from the old pattern in her head. He had no way to catch it; he took what was in the box.
She sat at his kitchen table a long while that afternoon. Then she changed how she did it. She stopped filling the box from memory. She laid every bottle out, read every label aloud, and wrote the week down on a sheet he kept by the sink. She counted the pills left over at each visit, because a count would tell her what her memory would not. When he asked why it took so much longer now, she told him the truth: because you cannot check it, I have to.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'What does Proverbs 27:23 tell the shepherd to do?',
        options: ['Trust that the flock is fine', 'Be diligent to know the state of the flock, and look well to the herds', 'Sell the weakest sheep'],
        answer: 1,
        explain:
          'Knowing the state of a thing is work done by going and looking, not by remembering or hoping. That is the first move of any honest evaluation.',
      },
      {
        q: 'What three verbs does Lamentations 3:40 give, and how do they map onto the book’s cycle?',
        options: ['Wait, hope, rest - plan, build, ship', 'Search, try, turn - analyze, measure, improve', 'Ask, seek, knock - read, write, run'],
        answer: 1,
        explain: 'Search is looking honestly at what happened, try is testing and counting, and turn is changing course where the count shows you are wrong.',
      },
      {
        q: 'What did Nehemiah do before he called the people to rebuild?',
        options: ['He hired builders from Babylon', 'He went out by night and viewed the wall himself', 'He waited for a report from the king'],
        answer: 1,
        explain:
          'He inspected the real damage first, so he could say ye see. Building against an imagined version of the work is answering before hearing (Proverbs 18:13).',
      },
      {
        q: 'An email helper sums up an old quoted thread instead of the new message. Which gulf is that most likely?',
        options: ['Comprehension: the builder did not know what real inputs look like', 'Generalization only', 'No gulf; the model is broken'],
        answer: 0,
        explain: 'Real email carries forwards and long quoted threads. A helper designed for tidy samples was built against an imagined version of the data.',
      },
      {
        q: 'An instruction says sum up the requests, and two runs come back as a paragraph and as bullet points. What gulf is that?',
        options: ['Comprehension', 'Specification: the format was never stated, so the model guessed', 'Generalization'],
        answer: 1,
        explain:
          'What is not said gets guessed. Write the vision, and make it plain (Habakkuk 2:2); a trumpet with an uncertain sound prepares no one (1 Corinthians 14:8).',
      },
      {
        q: 'The instruction is clear and the inputs are known, yet now and then the helper returns a famous name from the body instead of the sender. What gulf is that, and what kind of fix fits?',
        options: [
          'Specification; rewrite the prompt again',
          'Generalization; measure how often, then use a stronger fix such as reading the sender from the header',
          'Comprehension; read more emails',
        ],
        answer: 1,
        explain:
          'Nothing in the builder’s reading or instruction was wrong; the model applied the rule unevenly. In many things we offend all (James 3:2), so count it and choose a stronger hand.',
      },
      {
        q: 'Why does the book say to measure, and not only look at a few cases?',
        options: [
          'Because counting is faster than reading',
          'Because impressions from a handful of cases mislead in both directions; a rate tells you whether the failure is low enough',
          'Because looking at cases is not allowed',
        ],
        answer: 1,
        explain: 'A just weight is His delight (Proverbs 11:1). A count you did not round in your own favor is the honest weight.',
      },
      {
        q: 'When our lesson builder’s stuck teachings were finally read by kind, what did the count show?',
        options: [
          'Every teaching failed for a different reason',
          'Four of the seven failed on one problem: a quoted span with no reference after it',
          'None had failed at all',
        ],
        answer: 1,
        explain: 'Not scatter but one repeated behavior. That count turned six days of not knowing into a fix that could be chosen.',
      },
      {
        q: 'The writer had already been told the rule, and was shown its earlier failure. What gap of our own did the second look find?',
        options: [
          'The rule was never written down',
          'The feedback gave only a count, so the next attempt could not find which quotations to fix',
          'The model was switched off',
        ],
        answer: 1,
        explain:
          'Seven quoted spans and four with a reference says something is wrong but not where. The gate now names up to five of the spans that lack one.',
      },
      {
        q: 'What is the strongest fix this course already uses, the same kind as reading the sender from the email header?',
        options: [
          'Asking the model to remember verses more carefully',
          'Never asking a model for a verse at all: a fill script copies every quotation from the King James file on disk',
          'Removing Scripture from the lessons',
        ],
        answer: 1,
        explain: 'A redesign takes the job away from the model where a plain source already holds the answer, which is the strongest of the book’s remedies.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Proverbs 27:23 aloud before you say one word about any computer. Then read Lamentations 3:40 aloud and write its three verbs on the board: search, try, turn. Then ask the room: what in your week do you know only by memory, and not by looking?
MINUTES 0 TO 10 - NEHEMIAH AT NIGHT. Nehemiah 2:11-18. Have someone list what he did before he spoke. Read Proverbs 18:13 beside it.
MINUTES 10 TO 25 - THE THREE GULFS. Comprehension, specification, generalization, with the book's email helper. For specification read Habakkuk 2:2 and 1 Corinthians 14:8; for generalization read James 3:2. Say plainly that the terms and examples are the book's, reported through a newsletter.
MINUTES 25 TO 35 - THE CYCLE. Analyze, measure, improve, set under search, try, turn. Proverbs 11:1 for the honest count. Luke 12:48 for heavier checking where users cannot catch mistakes.
MINUTES 35 TO 48 - OUR OWN HOUSE. The builder's six silent days; the read of its own records; four of seven on one problem; the rule already given; the count that could not be found; the named spans; the checker checked; the verse fill that asks no model for Scripture. Say plainly what is not yet measured.
MINUTES 48 TO 60 - THE ONE WITH NO GULF. Hebrews 4:15, Hebrews 13:8, John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Give the four household habits and the week's assignment.
WHAT NOT TO DO. Do not turn this into a contest between companies or models; none is ranked here. Do not read the book's words in a voice of authority over the Word; the Word frames the hour and the book is its occasion. Do not promise that the builder's fix has worked; that count has not been taken.`,
    talkingPoints: [
      `Know the state of thy flocks: go and look (Proverbs 27:23).`,
      `Search, try, turn (Lamentations 3:40).`,
      `Nehemiah viewed the wall before he asked anyone to build (Nehemiah 2:15-17).`,
      `Answering before hearing is folly (Proverbs 18:13).`,
      `Comprehension: real inputs are messier than the sample in your head.`,
      `Specification: what is not said is guessed (Habakkuk 2:2; 1 Corinthians 14:8).`,
      `Generalization: clear instructions still meet slips (James 3:2).`,
      `Name the kind of failure before you choose the fix.`,
      `Analyze, measure, improve - search, try, turn.`,
      `Count honestly: a just weight (Proverbs 11:1).`,
      `Where users cannot catch mistakes, check harder (Luke 12:48).`,
      `Our builder: six silent days, then four of seven on one problem, read from its own records.`,
      `The rule was already given; the feedback gave a count, not a place. Now it names the place.`,
      `The checker was checked: a bug caught before it shipped.`,
      `No verse in this course is asked of a model's memory.`,
      `Jesus is the Lamb of Yahweh and the Eternal Son, in whom intent and act never parted (Hebrews 4:15).`,
    ],
    discussionPrompts: [
      `What do you know only by report that you could go and look at yourself?`,
      `Which instruction in your house could be followed two different ways?`,
      `What mistake keeps coming back, and have you ever counted it?`,
      `When something failed, was the plan unclear, or did the doing slip despite a clear plan?`,
      `Who depends on you and cannot catch your mistakes?`,
      `What checker do you trust that you have never checked?`,
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
console.log(`sov91: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov91: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov91: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov91: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov91: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov91: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov91: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov91: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov91: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov91: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov91: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov91: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov91: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov91: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov91: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov91: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov91: spliced ${ID}`);
console.log(`sov91: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov91: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
