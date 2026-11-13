// =============================================================================
// sov82-fill - build Sovereign A.I. week 82 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[Romans 10:15]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory. The reference list on the module's
// anchor is DERIVED from the placeholders that actually occur in the reader
// places, so anchor.ref names every verse the lesson stands on and nothing it
// does not (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-10-29 at 18:38 UTC (1:38 PM CDT) Darrell
// forwarded a ByteByteGo newsletter, subject line "Data Movement Strategies In
// System Design" (sent 15:31 UTC), out of his university mailbox into the
// lesson lane with ONE WORD typed above the forwarded header: Lesson. Gmail
// thread `1a1885689c5c2ffc`. The scheduled intake fell behind; this build drains
// that backlog on 2026-11-13. scripts/lesson-already-built.mjs returned MAYBE
// on the source name only (other ByteByteGo lessons exist: sov39, sov59, sov70)
// and nothing on the thread id.
//
// WORD FIRST (DR-0127 / DR-0282). The hour opens on Romans 10:14-15 - how shall
// they hear without a preacher, and how shall they preach except they be sent -
// which already names the three parts every movement of a message has (the one
// who hears, the one who carries, the sending), and Proverbs 25:13, the faithful
// messenger. Both are laid before one word of the newsletter is spoken.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100 / DR-0076 section 8). The email was a
// PREVIEW of a paid article: four opening paragraphs and a list of nine topics,
// nothing more. blog.bytebytego.com and bytebytego.substack.com were refused
// from this session (curl: (56) CONNECT tunnel failed, response 403). So the
// lesson reports NOTHING ByteByteGo said about any strategy's benefits or about
// how to choose; it teaches each strategy as the standard, established
// engineering it is, and says so in every reader place. re-review: 2026-11-27.
//
// MEASURED ON OUR OWN HOUSE (not painted), on origin/main b0a8e87fe5f:
//   app/src/components/Messages.jsx:84-86        subscribes to group_messages changes
//   app/src/lib/direct-messages-sync.js:221      DM_HEARTBEAT_MS = 15000
//   app/src/lib/direct-messages-sync.js:244-256  the stream is primary, the
//        event triggers a full re-read, the heartbeat is the backstop and never
//        ticks while the app is hidden (Darrell's August question recorded there)
//   37 files under app/src (tests excluded) subscribe to postgres_changes
//   app/node_modules/@supabase/realtime-js RealtimeClient opens a WebSocket
//   no EventSource and no long polling anywhere in app/src or app/functions
//   app/src/components/Inbound.jsx:124           polls an outside service every 5 min
//   .github/workflows/site-health.yml:51-63      requested every 10 min, MEASURED
//        about 67 min (38-154 across 28 runs)
//   infra/supabase/schema-v2.14-realtime-publication.sql:4-8  the June finding:
//        ten tables subscribed to, never published, so subscribe() was a silent
//        no-op and changes appeared only at the next sign-in
//   infra/supabase/migrations-auto/0220-...-the-outbox.sql:10-24, 33-44  the
//        push_outbox: written inside the same function, drained separately
//   .github/workflows/push-outbox-drain.yml:29,42  a 15-minute drain that runs
//        only when switched on
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 82;
const ID = 'sov82-how-beautiful-are-the-feet';
const TITLE =
  'How beautiful are the feet - how a message travels from where it starts to the one who needs it, the watchman asked again and again, and the runner who arrived first with nothing to tell';

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
  if (!m) throw new Error(`sov82: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov82: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov82: reference does not resolve in the corpus -> "${ref}"`);
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
    "WHAT WE DID NOT CHECK AT THE SOURCE. The email Darrell forwarded was a preview of a paid article: its first four paragraphs and its list of nine topics, and nothing after the first heading. The full article lives at blog.bytebytego.com, and that address and the newsletter's own site were refused from our network. So this lesson reports nothing ByteByteGo wrote about the benefits of any strategy or about how they advise choosing one. What is taught here about pull, polling, push, long polling, streams, queues and change data capture is the standard, established engineering every one of those names stands for, stated plainly because it is not in doubt; and every sentence about our own app was measured from its code. A shut road must never read like a verified fact. re-review: 2026-11-27.",
  child:
    'WHAT WE DID NOT CHECK. The email was only the start of a longer story. The rest was on a website called blog.bytebytego.com, and our computer could not open it. So we did not read what the writers said about each way. What we told you about each way is how these things work, and the parts about our app we checked in the app itself. A closed door is not the same as a checked fact. We will try again. re-review: 2026-11-27.',
  youth:
    "WHAT WE DID NOT CHECK. The email was only a preview. It had the first few paragraphs and a list of nine topics. The rest of the article is at blog.bytebytego.com, and our network could not open it. So we are not telling you what the newsletter said about each way, or how it says to choose. What we taught about each way is how these things are known to work. What we said about our own app, we checked in the app's own code. A shut door must never sound like a checked fact. re-review: 2026-11-27.",
  teen: 'WHAT WE DID NOT CHECK. Be clear on what we read. We read a preview. It had four paragraphs and a list of nine topics. The full article is at blog.bytebytego.com. Our network was refused there. So we do not tell you what the newsletter said about each way, or how it says to pick one. What we did teach is how these ways are known to work. That part is not in doubt. And what we said about our app, we checked in its code. re-review: 2026-11-27.',
  senior:
    "WHAT WE DID NOT CHECK AT THE SOURCE. The newsletter arrived as a preview of a paid article - four opening paragraphs and a list of nine topics - and the road behind it was shut: blog.bytebytego.com and the newsletter's own site were refused from our network. The article's own account of each strategy's benefits, and its advice on choosing, are therefore not reported here at all. What is taught about each strategy is the standard, established practice the names refer to, and it is stated plainly because it is not in doubt; every statement about our own app was measured from its code. A shut road must never read like a verified fact. re-review: 2026-11-27.",
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - when something changes for you at school or with your friends, how do we find out, and how would you like us to - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Proverbs 25:13. Children, ask your mother, your father or a grandparent about a time important news reached them late, or never reached them at all, and what it cost; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what is one thing we keep checking over and over that we could simply ask to be told. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - when something big happens to you, who do you tell first - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Proverbs 25:13. Children, ask your mom or your dad or your grandma or your grandpa about a time they got good news. How did it come? Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: how will we tell each other when something changes. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is something you keep checking again and again, and why - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Isaiah 21:12. Children, ask your mom, your dad or a grandparent how news traveled when they were your age - letters, phone calls, a knock at the door - and hear the whole of it before you answer; then retell their answer in your own words. Then ask a friend this: when one of us needs help, how will the other one find out. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - which of your notifications actually matter, and which ones just make you check - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, 2 Samuel 18:22. Children, ask your mom, your dad or a grandparent about a time they heard half a story first and the whole story later, and what they did in between; hear all of it before you reply, then retell their answer in your own words. Then ask a friend this: what is one message we sent each other that came out wrong because it came too fast. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - if something happened to me, how would you hear, and how fast - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Romans 10:15. Children, ask your parents or your grandparents about the phone tree, the prayer chain or the church bulletin they once depended on, and what happened the time it failed; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: who in our two families would not hear if something went wrong, and how do we fix that. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no detail from the newsletter stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the twenty-ninth of October 2026, at 1:38 in the afternoon, Darrell forwarded a technology newsletter out of his university mailbox into this lane. Above the forwarded header he typed ONE WORD: Lesson. That word is the ask. The newsletter is only the occasion, and no article is the foundation of an hour in this course. The lane that should have built it the same day fell behind, and it was built by hand from the backlog.

THE WORD FIRST, BEFORE ANY ARTICLE. Paul, writing to Rome, asks four questions in a row, and they are the oldest description we have of how a message moves: [[Romans 10:14]] [[Romans 10:15]] Someone who needs to hear. Someone who carries the word. And a sending - the moment that sets the carrier moving. Then Solomon names the quality that matters more than speed: [[Proverbs 25:13]] Faithful. The message arrives, and it arrives whole, and the one who sent it is refreshed because it did.

Hold those two, and then hear the news.

WHAT THE NEWSLETTER HELD. The newsletter was ByteByteGo, a well-known teacher of how large software systems are designed, and its subject was data movement: how information gets from where it starts to every place that needs it. It listed nine topics: the source, the consumer and the trigger; pull; polling; push; long polling; server-sent events and WebSockets; message queues; change data capture; and how to choose. The email was only a preview, so what follows teaches each as the established practice it is, and applies each to the app you are reading this in, measured from its own code.`,

  `MOVEMENT ONE: EVERY MESSAGE HAS THREE PARTS. Romans 10 already named them. The SOURCE is where the news starts. The CONSUMER is whoever needs to know. The TRIGGER is what sets the news moving. Every strategy on the list answers one question: who moves first? If the hearer moves first, that is a pull. If the sender moves first, that is a push. If neither waits on the other, something stands in the middle - a queue, a log, a post rider. And Paul's last line says why it matters at all: [[Romans 10:17]]`,

  `MOVEMENT TWO: ASKING - PULL, AND ASKING AGAIN. The simplest way to get news is to ask for it. Moses told Israel to do exactly that: [[Deuteronomy 32:7]] The one who needs to know goes to the one who knows, and asks. In software this is a PULL: the consumer sends a request and the source answers. It is simple, and it is honest, because the answer is as fresh as the moment you asked. Its weakness is that nobody tells you when something changes between your questions.

POLLING is pull on a schedule: ask, wait, ask again. Isaiah records a man doing just that: [[Isaiah 21:11]] He asks twice in one breath. And the watchman's answer is the polling contract, word for word: [[Isaiah 21:12]] If you want to know, ask - and come back and ask again.

Elijah used the same method on the top of Carmel: [[1 Kings 18:43]] [[1 Kings 18:44]] Six trips up the hill, and six times the answer was there is nothing. That is the cost of polling, and it is worth seeing plainly. Most of the asking finds nothing new, and whatever does change is not seen until the next trip up the hill. Ask too often and you waste the servant's legs; ask too seldom and you see the cloud late.

OUR OWN HOUSE asks this way where it must. The app's Inbound screen asks an outside service for new records every five minutes, because that service cannot call us. And the outside-in check that watches whether the website itself is up is set to ask every ten minutes. But the record beside that setting is honest about what really happens: measured across twenty-eight runs, the actual gap averaged about sixty-seven minutes and stretched as long as two and a half hours, because the service that runs it treats the schedule as a request, not a promise. [[Proverbs 27:1]] A schedule is a hope about tomorrow. Measure what actually came.`,

  `MOVEMENT THREE: BEING TOLD - PUSH, AND THE RUNNER WITH NOTHING READY. The other way is for the source to move first. In software this is a PUSH: when something changes, the source sends word at once, unasked. A webhook - one system calling a web address another system gave it - is the common form. Nobody climbs the hill for nothing. But the sender must be able to reach the hearer, and if the hearer is away when the runner arrives, the news can be lost unless somebody tries again.

Scripture tells the most careful push story there is. After the battle in the wood of Ephraim, David sat waiting for news: [[2 Samuel 18:24]] Two runners had been sent. One of them, Ahimaaz, had begged to go: [[2 Samuel 18:22]] Joab's question is the whole lesson. Why run, when you have no tidings ready? Ahimaaz ran anyway, and he was faster, and the watchman recognised him: [[2 Samuel 18:27]] Then the king asked the only question that mattered, and the fast runner had nothing: [[2 Samuel 18:29]] So the king set him aside: [[2 Samuel 18:30]] And then the second runner arrived with the actual news: [[2 Samuel 18:31]]

There is a design in that story, and our own app uses it on purpose. When a family member sends a message in PoeTech, the database records it, and the app is listening for changes to that table, so it is told the moment a change happens; thirty-seven files in the app listen this way. But the app treats that notice the way David should have treated Ahimaaz: as a sign that something happened, not as the news itself. On every notice, it turns and reads the messages again from the record. The fast signal is welcome. The record is the truth. A notification that something changed is useful, and Joab was right that it is not the same as tidings.`,

  `MOVEMENT FOUR: HOLDING THE QUESTION OPEN - LONG POLLING, STREAMS, AND THE OPEN LINE. Between asking and being told there is a middle posture. LONG POLLING is a question that is not answered until there is something to say: the consumer asks, the source holds the request open until news arrives or a time limit passes, and then the consumer asks again at once. It is polling without the empty trips. Habakkuk described the posture before anyone built it: [[Habakkuk 2:1]] He did not walk away and come back. He stood at his post with the question open. And he was told how to wait: [[Habakkuk 2:3]] Though it tarry, wait for it.

Then there are connections that simply stay open. SERVER-SENT EVENTS keep one line open from the source to the hearer, and the source speaks down it whenever it has news; the hearer only listens. Creation does that every day: [[Psalm 19:2]] One direction, without ceasing. WEBSOCKETS keep a line open in both directions, so either side may speak at any moment. Malachi records a people living that way: [[Malachi 3:16]] They spoke often, one to another, and it was heard, and it was written down.

OUR OWN HOUSE: the open line our app keeps with its database is a WebSocket, held by the database library the app is built on; that is how the change notices in Movement Three arrive. And measured honestly, there is no long polling and no server-sent events anywhere in the app's own code today. That is a choice, not a fault.`,

  `MOVEMENT FIVE: THE LETTER THAT WAITS - MESSAGE QUEUES. Sometimes the hearer is not there when the news is ready, or there are many hearers, or the sender cannot wait for every one of them. Then a MESSAGE QUEUE stands in the middle: the sender writes the message into a durable place and goes on with its work, and each consumer takes messages out at its own pace. If a consumer is down for an hour, nothing is lost; the messages wait.

The book of Esther runs on exactly this. When the king's second decree was written, it was written once and addressed to every reader in their own tongue: [[Esther 8:9]] Then it was handed to a fleet of carriers: [[Esther 8:10]] [[Esther 8:14]] The writing was the durable thing; the posts were the delivery; and every province received the same message, in its own language, as fast as the riders could reach it. And notice how Persia handled a message already sent: [[Esther 8:8]] A sealed writing could not be taken back. The remedy for the first decree was not to erase it but to send a second one. Good message systems keep that rule: what was sent stays sent, and a correction is a new message. This project keeps its own decisions the same way - a new decision is written as a new record, and an old record is never rewritten.

OUR OWN HOUSE learned why this matters the hard way. This app serves public pages for small businesses - the house calls each one a door - and one business's order form failed on every attempt for its whole life. Nothing was recorded and nobody was alerted; it came to light only because a customer happened to mention it. So now, when a door reports that something is broken for its customers, the same database step that records the fault also writes one row into an outbox addressed to that business's office. Delivering that row to a phone is a separate job, set to run every fifteen minutes and only when it has been switched on. The record beside it says plainly what that means while it is off: the outbox simply fills, the office board still shows every fault, and no row is lost. That is a queue doing its one job. The letter is written and sealed, and it waits for the rider.`,

  `MOVEMENT SIX: THE RECORD OF WHAT CHANGED - CHANGE DATA CAPTURE. The last strategy goes to the source itself. Every serious database keeps its own running log of every change it makes. CHANGE DATA CAPTURE reads that log and passes each change along to whoever needs it, so nobody has to ask what changed and nobody has to remember to send word. The change itself becomes the message.

Persia kept such a log, and one sleepless night proves both its value and its danger: [[Esther 6:1]] [[Esther 6:2]] The change had been captured perfectly. Mordecai's warning was written down, dated, kept. And then: [[Esther 6:3]] Recorded, and never delivered to anyone who would act on it. A log nobody reads is a faithful record and an unfaithful messenger at the same time.

OUR OWN HOUSE learned that exact lesson in June. The database our app uses sends change notices only for tables that have been placed on its published list of tables to report. A review found that the app was listening for changes on ten family tables - rentals, incidents, accounts, debts, transactions, projects and others - but nobody had ever put those ten on the list. So the app's listening was a silent nothing: no error, no notice, and changes from another device showed up only the next time someone signed in. The fix was one script that added the ten tables to the list. The watchman had been on the wall the whole time, watching a road no runner had been sent down.

The app's private messages now carry the right order. The change notice is the main road; under it, every fifteen seconds and never while the screen is hidden, the app reads again as a net under a stream that might be sick. When Darrell asked in August why it should be time-based at all, the answer written into the code was that it is not: the occurrence is primary, and the timer is the backstop.`,

  `MOVEMENT SEVEN: HOW TO CHOOSE - THE WORD IN DUE SEASON. We could not read the newsletter's answer to how to choose. Scripture's answer lines up with what engineers learned the hard way.

[[Ecclesiastes 3:1]] [[Proverbs 15:23]] First, timing: how soon does this hearer actually need it? A family message needs seconds; a daily summary can wait for morning. [[Proverbs 13:17]] Second, faithfulness: what happens if the hearer is away when the news is ready? If losing it would matter, put a queue or a log between you. [[Proverbs 26:6]] Then three more: can the source reach the hearer at all, how many hearers are there, and what does a wrong guess cost? This house wrote its own answer into its rules: watch for the event first, and keep a timer only as a short backstop - never a timer standing in for news you could simply be told.`,

  `MOVEMENT EIGHT: THE WORD WHO CAME IN PERSON. Bring it home, to the message all the others serve.

[[Hebrews 1:1]] Sundry times and divers manners - prophets and dreams, letters and visions, a watchman's cry and a runner's feet. [[Hebrews 1:2]] And then the last word was not carried. It came. [[John 1:1]] [[John 1:14]]

He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] and the One in whom everything holds together, every message included: [[Colossians 1:17]] Isaiah saw the runners on the hills long before Paul quoted him: [[Isaiah 52:7]] Our part is the part of the feet. To carry what we were given, faithfully, whole and in season.`,

  `THREE THINGS THIS WEEK, and none of them needs a purchase.

One, draw one message. Pick one kind of news in your household - a schedule change, a school pickup, a prayer need - and write down its three parts: where it starts, who needs it, and what sets it moving today. Many families find the honest answer is somebody happens to mention it.

Two, trade one poll for a push. Find one thing you check over and over - a delivery page, an inbox, a child's location, the question are we there yet - and arrange to be told instead. Keep a backstop: if you have heard nothing by a set time, then you ask.

Three, test one listener. A listener that has never heard anything may be listening to a road nobody runs on. Send a test message through your family group chat, your church prayer chain or your phone tree, and ask each person to answer that they received it. Then fix whoever did not.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that asking is wrong and being told is right, or that the newest way is the best. Every one of these strategies is good in its season. The point is faithfulness: choose the way that gets the whole message to the one who needs it, in time, and check that it actually arrived.`,

  BLOCKED.lesson,

  TALK.lesson,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader, not a
// re-registering of the adult text, and each carries the whole teaching, the
// shut road and the talk-together close (DR-0795).
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

ONE BIG QUESTION. How does news get from one place to another? That is what this whole lesson is about.

WHO SENT THIS. Darrell got an email about computers. He wrote one word on top of it. The word was Lesson. Then he sent it to us. That one word is why you are reading this.

THE WORD FIRST. Paul asked some questions in a letter. Here they are. [[Romans 10:14]] [[Romans 10:15]]

Look at what Paul saw. Someone needs to hear. Someone has to bring the news. And someone has to send them. That is three parts. Every message has those three parts.

Now a verse from King Solomon. [[Proverbs 25:13]]

Snow is cold. Cold feels so good on a hot day at work. A good helper who brings the news right is like that. It makes people glad.

THE EMAIL. The email came from a group called ByteByteGo. They teach how big computer programs work. This one was about how news moves inside a computer program. When you send a message in an app, how does your friend's phone find out? That is the question.

ASK. One way is to ask. Moses told the people to do this. [[Deuteronomy 32:7]] If you want to know, go and ask. Computers do that too. One computer asks. The other one answers.

ASK AGAIN. Sometimes you have to ask again and again. A man in the Bible did that. [[Isaiah 21:11]] He asked the man on the wall. The man on the wall said this. [[Isaiah 21:12]] Come back and ask again!

Elijah did that too. He sent his helper up a hill. Was there rain coming? [[1 Kings 18:43]] Seven times! Then on the last time, the helper saw something. [[1 Kings 18:44]]

Asking again and again works. But it is a lot of walking. Most times, the answer is nothing yet.

BE TOLD. Another way is for the news to come to you. You do not have to ask. Someone runs and tells you.

In the Bible, King David was waiting for news. Two men ran to tell him. One man was named Ahimaaz. He wanted to run so much. But his boss asked him a question. [[2 Samuel 18:22]] He did not even have the news! He ran anyway. He got there first. The king asked him a question, and he said this. [[2 Samuel 18:29]] He did not know! Then the second man came. He had the real news. [[2 Samuel 18:31]]

Being first is not the same as being right. Bring the whole news.

OUR APP. When you send a message in our app, the other phone gets a little tap. The tap says, Something new is here. Then the phone goes and reads the real message. The tap is like Ahimaaz. The real message is like the second runner. Our app uses both.

STAY ON THE LINE. Some computers keep a line open all the time, like a phone call that never hangs up. Then news can come any second. The Bible says the sky talks all the time. [[Psalm 19:2]] Every day, every night, it keeps telling us about Yahweh.

THE LETTER THAT WAITS. Long ago a king sent letters. Men rode fast horses to carry them. [[Esther 8:10]] If a person was not home, the letter could wait. It did not get lost.

Some computers keep a box of letters like that. Our app has one. Our app makes web pages for small shops. When something breaks on a shop's page, a note goes in the box for the shop owner. The note waits until it can be sent. No note is lost.

THE BOOK NOBODY READ. Here is a sad story. A man named Mordecai saved the king's life. It was written in the king's book. But nobody did anything about it! [[Esther 6:3]] It was written down, but the news never got to anyone who would act.

Our app had a problem like that once. It was waiting to hear about some changes. But nobody had told the computer to send them. So it waited and heard nothing. Then someone found it and fixed it.

THE THREE PARTS GAME. Let's play a game with the three parts. Who needs to hear? Who brings the news? What starts it?

Here is one. Grandma is coming to visit. You need to hear it. Mom brings the news. Grandma's phone call starts it. Easy!

Here is another. Your friend is sick and will miss school. Your teacher needs to hear it. Your friend's dad brings the news. A cough in the night starts it.

Now you try one. Think of some news from this week. Say the three parts out loud. It is fun once you see it. You will start to see the three parts everywhere.

A STORY TO HELP YOU THINK. This story is made up. It did not really happen.

A boy named Sam wanted to know when the cookies were done. So he ran to the kitchen. Are they done? No. He ran back. Then he ran to the kitchen again. Are they done? No. He did this ten times! His legs got tired. Mom was tired too.

So Mom had an idea. She said, When the cookies are done, I will ring this little bell. You do not have to run in. Just listen for the bell.

Sam sat down to read. He did not have to run at all. Then ding! The bell rang. The cookies were done. And they were still warm.

Then Sam had a question. What if Mom forgot to ring the bell? Mom smiled. She said, That is why we have a plan for that too. Sam liked the plan. His little sister liked it too. Now she listens for the bell every time they bake.

Sam's running was like asking again and again. Mom's bell was like being told. Both got Sam his cookie. The bell just saved a lot of running.

But what if the bell is broken? Then Sam would wait and wait. So Mom said, If you do not hear the bell by dinner, come and ask. That is a good plan. Be told first. Ask if it takes too long.

JESUS IS THE BEST NEWS. Yahweh sent many messages long ago. Then He sent Jesus. Jesus is called the Word. [[John 1:14]] Jesus is the Lamb. [[John 1:29]] He did not just bring the news. He is the good news.

THREE THINGS THIS WEEK. One. Pick some news in your house, like when dinner is. Who needs to know? Who tells them? Two. Find one thing you keep asking about. Ask to be told instead. Three. Send a test message to your family. Did everyone get it? If not, help fix it.

WHAT NOT TO THINK. Asking is not bad. Being told is not bad. Each one is good at the right time. Just make sure the whole news gets there.

ONE MORE THING TO REMEMBER. Good news is a gift. When you bring news to someone, bring all of it. Be kind when you tell it. Tell the truth. And if you are not sure, say so. That is how a good helper brings news.

${BLOCKED.child}

${TALK.child}`;

const YOUTH = `${TITLE}.

THE QUESTION. When something changes in one place, how does every other place find out? That is called data movement, and this lesson is about it.

WHO SENT THIS. On October 29, Darrell forwarded an email about how computer systems are built. He typed one word above it: Lesson. That word is why this lesson exists. The email was the reason, but it is not the foundation. The Word is.

THE WORD FIRST. Paul asked four questions in a row, and they describe how any message moves. [[Romans 10:14]] [[Romans 10:15]]

Find the three parts. There is a person who needs to hear. There is a messenger who carries the news. And there is the sending, the thing that starts the messenger moving. Every message ever sent has those three parts.

Then Solomon tells us what kind of messenger to be. [[Proverbs 25:13]] Not the fastest one. The faithful one. The one who gets the whole message there.

THE NEWSLETTER. The email was from ByteByteGo, a group that teaches how big software systems are designed. It listed nine topics about how data moves. We will walk through them, and then look at how our own app does each one.

PULL: YOU ASK. The simplest way is to ask. Moses told Israel to ask the older people. [[Deuteronomy 32:7]] In software, a pull is when one computer asks and another answers. The answer is fresh at the moment you ask. But if something changes later, nobody tells you.

POLLING: YOU ASK AGAIN AND AGAIN. Polling is asking on a schedule. A man in Isaiah kept asking a guard on the wall. [[Isaiah 21:11]] The guard's answer is a perfect picture of polling. [[Isaiah 21:12]] Ask, and come back and ask again.

Elijah sent his servant up a hill to look for rain. [[1 Kings 18:43]] Six times there was nothing. On the seventh trip, there was a tiny cloud. [[1 Kings 18:44]]

That shows the problem with polling. Most trips find nothing, and you only see the change on your next trip. Our app polls in places where the other side cannot call us. One screen asks an outside service for news every five minutes. And the checker that watches whether our website is up is set to run every ten minutes, but when it was measured, it really ran about once an hour. [[Proverbs 27:1]] A schedule is a plan, not a promise.

PUSH: YOU ARE TOLD. Push is the opposite. When something changes, the source sends the news right away. Nobody has to keep asking.

David was waiting for news after a battle. Two runners were sent. Ahimaaz begged to go, and his commander asked him something important. [[2 Samuel 18:22]] Ahimaaz ran anyway. He was faster and got there first. But when the king asked his question, this was the answer. [[2 Samuel 18:29]] Then Cushi arrived with the real news. [[2 Samuel 18:31]]

Our app uses that idea on purpose. When someone sends you a message, the database tells the app that something changed. But the app does not trust the quick signal as the full news. It goes back and reads the real messages from the record. The fast signal is welcome. The record is the truth.

LONG POLLING AND OPEN LINES. Long polling is asking a question and having the answer held until there is news. Habakkuk did that. [[Habakkuk 2:1]] He stood and waited instead of walking away.

Some connections just stay open. With server-sent events, the source keeps talking down one line to you, like the sky that never stops speaking. [[Psalm 19:2]] With WebSockets, the line is open both ways, so either side can talk at any time. Our app keeps a two-way line like that open to its database. We checked, and the app does not use long polling or server-sent events at all right now.

QUEUES: THE LETTER THAT WAITS. A message queue is a safe place where messages wait until they can be picked up. In Esther, the king's letters were written once and carried by fast riders to every province. [[Esther 8:10]] [[Esther 8:14]] And once a sealed letter was sent, it could not be taken back. [[Esther 8:8]] The fix for a bad letter was a new letter.

Our app has a box like this. The app runs web pages for small businesses. Once, one shop's order form failed every single time, and nobody found out until a customer mentioned it. Now, when a shop's page reports a problem, a note is written into an outbox for that shop's office. Sending it to a phone is a separate job. If that job is off, the notes just wait. None is lost.

CHANGE DATA CAPTURE: THE RECORD OF CHANGES. A database keeps a log of every change. Change data capture reads that log and sends each change to whoever needs it.

But a log has to be read. The king of Persia had a book of records, and one night he found something in it. [[Esther 6:2]] Mordecai had saved his life! Then the king asked a question. [[Esther 6:3]] It was written, but nobody acted on it.

Our app had a problem like that in June. It was listening for changes on ten tables, but nobody had put those tables on the list the database sends out. So the app heard nothing, with no error at all. A review found it, and one fix added the ten tables.

Messages in our app also have a backup. Every fifteen seconds, while the screen is open, the app checks again just in case the open line is sick. Darrell asked why it had to be on a timer at all. The answer in the code is that it doesn't: the real news comes when it happens, and the timer is only the backup.

A STORY TO THINK ABOUT. This story is made up to help you think. It did not really happen.

A soccer team had a group chat. The coach used it to tell everyone when practice moved. One week a boy named Eli missed two practices in a row. The coach was upset, and Eli was confused. He said nobody told him.

The coach showed him the chat. There it was, in plain words: practice moved to Thursday. Eli looked at his phone. He was not in the chat at all. He had gotten a new phone in the summer, and nobody had added his new number.

So the coach was sending, and the message was real, and the team was hearing. But one player was not on the list. To the coach, it looked like everyone knew. To Eli, it looked like nobody cared.

The fix took one minute. The coach added him. Then the coach did one more thing. Before the next season, he sent a message that said, Reply with a thumbs-up if you can see this. Three more kids did not answer. They were not on the list either.

That is what our app learned in June, too. A list nobody checks can leave someone out, and it will not tell you.

Think about your own groups. Your family chat, your class, your church youth group. Is anyone missing? Is there someone who always seems to hear about things last? Maybe it is not that nobody cares. Maybe they are just not on the list. You could be the one who notices and asks. Sometimes the kindest thing you can do is make sure someone else heard the news you already have.

HOW TO CHOOSE. [[Ecclesiastes 3:1]] Ask how soon the news is really needed. Ask what happens if the person is away. Ask who can reach whom. [[Proverbs 13:17]] Pick the way that gets the whole message there, in time.

THE WORD WHO CAME. Yahweh spoke in many ways long ago. [[Hebrews 1:1]] [[Hebrews 1:2]] Then the final Word came in person. [[John 1:14]] Jesus is the Lamb, [[John 1:29]] the Eternal Son of Yahweh. [[John 3:16]] Our part is to carry His news faithfully.

THREE THINGS THIS WEEK. One, pick one kind of news in your house and write its three parts: where it starts, who needs it, what starts it moving. Two, find one thing you keep checking and ask to be told instead, with a backup time to ask. Three, send a test message to your family group and make sure everyone got it.

WHAT NOT TO THINK. Asking is not wrong, and being told is not always better. Each way is good in its season. Faithful means the whole message gets there, and you check that it did.

${BLOCKED.youth}

${TALK.youth}`;

const TEEN = `${TITLE}.

THE PROBLEM. Data almost never stays in one place. You send a message, a record changes on a server, and some other part of the system has to find out about it. How that happens, and whether it happens at all, is what this lesson is about.

WHO SENT THIS. On October 29, Darrell forwarded an email about how big computer systems are designed. Above it he typed one word: Lesson. That word is the request. The email gave us the topic, but the Word is the foundation we build on.

THE WORD FIRST. Read Paul slowly, because he is describing exactly the thing engineers draw on whiteboards. [[Romans 10:14]] [[Romans 10:15]]

Paul names three parts. There is someone who needs to hear, someone who carries the word, and a sending that gets the carrier moving. Every system that moves data has those same three parts, even if the names on the diagram are different.

Now listen to Solomon on what makes a messenger good. [[Proverbs 25:13]] Notice the word he picks. He does not say fast, and he does not say loud. He says faithful, which means the whole message actually gets there.

THE EMAIL. It came from ByteByteGo, a group that teaches how large software systems are built. This issue listed nine topics on how data moves between the parts of a system. We will take them one at a time, and for each one we will look at how our own app really does it.

PULL. The simplest way to get information is to ask for it. Moses told Israel to ask the older generation when they wanted to know something. [[Deuteronomy 32:7]] In software, a pull means one computer sends a request and another one sends back an answer. The answer is fresh at the moment you ask. The problem is that if something changes a minute later, nobody tells you.

POLLING. Polling is pull on a timer: you ask, you wait, and you ask again. Isaiah records a man calling out to a guard on the city wall, twice in one breath. [[Isaiah 21:11]] The guard's answer sounds like it was written for programmers. [[Isaiah 21:12]] If you want to know, ask, and then come back and ask again.

Elijah used the same method on Mount Carmel while he waited for rain. [[1 Kings 18:43]] His servant climbed up six times and saw nothing. On the seventh trip he finally saw a small cloud. [[1 Kings 18:44]]

That is the real cost of polling. Most of the trips find nothing new, and anything that does change is only noticed on the next trip. Our app polls in places where it has no other choice, because the outside service cannot call us. One screen asks an outside service for new records every five minutes. And the checker that watches whether our website is up is set to run every ten minutes. When someone actually measured it over twenty-eight runs, it ran about once an hour. [[Proverbs 27:1]] A timer is a plan, not a promise, so measure what you really got.

PUSH. Now flip it around. With push, the source tells you the moment something changes, and you never have to ask. A webhook works this way: one system calls a web address that another system gave it. The catch is that the sender must be able to reach you, and if you are not there, the news can be missed.

The Bible has a great push story. David was waiting for news after a battle, and two runners were sent to him. A young man named Ahimaaz begged to be one of them, and his commander asked him a sharp question. [[2 Samuel 18:22]] Ahimaaz ran anyway, and he was faster, so he arrived first. Then the king asked him the one question that mattered. [[2 Samuel 18:29]] He did not actually know anything. A moment later Cushi arrived with the real news. [[2 Samuel 18:31]]

Being first is not the same as being right, and our app is built around that idea. When someone sends a message, the database sends the app a quick signal that something changed. The app treats that signal like Ahimaaz: it means something happened, not what happened. So the app goes back and reads the actual messages from the record. The signal is welcome, but the record is the truth. We counted, and thirty-seven files in the app listen for signals this way.

LONG POLLING. Long polling is a question that waits. You ask, and instead of answering right away, the source holds your request open until there is something to say. Then you ask again. Habakkuk took that posture on his watchtower. [[Habakkuk 2:1]] He did not wander off and come back; he stood there and kept the question open. [[Habakkuk 2:3]]

OPEN LINES. Some connections just stay open the whole time. With server-sent events, the line goes one way, and the source keeps talking whenever it has news, a little like the sky that never stops speaking. [[Psalm 19:2]] With WebSockets, the line goes both ways, so either side can talk at any moment. Our app keeps a two-way line like that open to its database. We also checked the code, and it does not use long polling or server-sent events anywhere.

QUEUES. A message queue is like a safe mailbox in the middle. The sender drops a message in and goes back to work, and the reader takes it out later. If the reader is away, the message just waits there. In the book of Esther, the king's letters were written once and carried by riders to every province. [[Esther 8:10]] [[Esther 8:14]] Once a sealed letter went out, nobody could take it back. [[Esther 8:8]] The way to fix a bad letter was to send a new one.

Our app has a mailbox like this, and it was built after a painful lesson. The app runs public web pages for some small businesses. One shop's order form failed every single time someone used it, and nobody found out until a customer happened to mention it. Now, when one of those pages reports a problem, a note is written into an outbox for that shop's office. Sending the note to a phone is a separate job. If that job is turned off, the notes simply wait, and none of them is lost.

THE CHANGE LOG. Every database writes down every change it makes. Change data capture reads that log and sends each change to whoever needs it. But a log only helps if somebody reads it and acts. The king of Persia learned that on a night he could not sleep. [[Esther 6:2]] Then he asked a question that should make anyone who keeps records nervous. [[Esther 6:3]] Everything was written down, and nobody had done anything about it.

Our app had a bug just like that in June. It was listening for changes on ten tables, but nobody had put those tables on the list the database sends out. So the app heard nothing, and it showed no error at all. Changes made on one phone only showed up on another phone the next time someone signed in. A review finally caught it, and one fix added the ten tables to the list.

Our private messages also have a backup now. Every fifteen seconds, the app checks again, but only while the screen is open. Darrell asked why it needed a timer at all instead of reacting when something actually happens. The answer written in the code is that it does not: the real news comes the moment it happens, and the timer is only a safety net.

HOW TO PICK. [[Ecclesiastes 3:1]] Ask a few honest questions. How soon does the person really need this? What happens if they are away when it is ready? Can the sender even reach them? How many people need it? [[Proverbs 13:17]] Pick the way that gets the whole message there, on time, and then check that it arrived.

THE WORD WHO CAME. Yahweh spoke in many different ways over the centuries. [[Hebrews 1:1]] [[Hebrews 1:2]] Then the last Word was not carried by a runner, because He came Himself. [[John 1:14]] Jesus is the Lamb, [[John 1:29]] the Eternal Son of Yahweh. [[John 3:16]] Our job is to carry His news the way Cushi did: whole, and on time.

THREE THINGS THIS WEEK. One: pick one kind of news in your house and write down its three parts, where it starts, who needs it, and what sets it moving. Two: find one thing you keep checking and ask to be told instead, but keep a backup time when you will ask. Three: send a test message to your family or your friend group, and make sure every person actually got it.

WHAT NOT TO THINK. Asking is not bad, and push is not always better. Each way has its time and place. Being faithful means the whole message gets there, and someone checks that it did.

${BLOCKED.teen}

${TALK.teen}`;

const SENIOR = `${TITLE}.

AN OLD QUESTION IN A NEW MACHINE. Long before there were computers, families and churches and kingdoms had to answer the same question this lesson asks: when something changes in one place, how does everyone who needs to know find out, and how do you make sure they did?

WHO SENT THIS. On the twenty-ninth of October, early in the afternoon, Darrell forwarded a newsletter on the design of computer systems, and above it he typed a single word: Lesson. That word is the request. The newsletter is the occasion; the foundation is the Word.

THE WORD FIRST. Paul's letter to the Romans lays out, in four questions, every part a message needs. [[Romans 10:14]] [[Romans 10:15]] There is the hearer, the one who carries the word, and the sending that puts the carrier on the road. Solomon adds the quality that matters most in the carrier. [[Proverbs 25:13]] He did not say swift. He said faithful.

THE NEWSLETTER. It came from ByteByteGo, a widely read teacher of how large software systems are designed, and its subject was data movement: how information travels from where it starts to every place that needs it. It listed nine topics, and we take them in turn, each with the Scripture that pictures it and the place our own app uses it.

ASKING. The plainest way to learn something is to go and ask. [[Deuteronomy 32:7]] Engineers call that a pull: the one who needs the information requests it, and the source answers. The answer is as current as the moment of asking, and no more.

ASKING ON A SCHEDULE. When you must keep up with something that changes, you can ask again and again. That is polling, and Isaiah gives us a man doing it. [[Isaiah 21:11]] The watchman's reply could be printed on any polling system. [[Isaiah 21:12]] Elijah's servant did the same on Carmel. [[1 Kings 18:43]] Six trips, and six times nothing; then, on the seventh, a cloud the size of a man's hand. [[1 Kings 18:44]] That is polling's honest cost: most trips are wasted, and a change is only seen on the next trip. Our app polls where the other side cannot call us; one screen asks an outside service for news every five minutes. And the checker that watches whether our website is up is set to run every ten minutes, but measured over twenty-eight runs it averaged about sixty-seven, because the service that runs it treats a schedule as a request. [[Proverbs 27:1]]

BEING TOLD. The opposite is a push: when something changes, the source sends word at once, unasked. It saves the wasted trips, but the sender must be able to reach the hearer, and a hearer who is away may miss the runner entirely. Scripture's great push story comes from the day of Absalom's defeat. [[2 Samuel 18:24]] Ahimaaz pleaded to carry the news, and Joab's reply has never stopped being wise. [[2 Samuel 18:22]] He ran, and outran the other messenger, and when the king asked the one question that mattered, he had no answer. [[2 Samuel 18:29]] Then Cushi arrived with the real tidings. [[2 Samuel 18:31]]

Our app is built with that story in mind, whether its builders thought of Ahimaaz or not. When a family member sends a message, the database sends the app a quick notice that something changed; thirty-seven parts of the app listen for such notices. But the app does not mistake the notice for the news. On each one, it reads the messages afresh from the record itself. The signal is welcome; the record is the truth.

HOLDING THE LINE OPEN. Between asking and being told are the connections that stay open. In long polling a question is held unanswered until there is something to say, and then asked again; Habakkuk took that posture on his watchtower. [[Habakkuk 2:1]] [[Habakkuk 2:3]] Server-sent events keep a one-way line on which the source speaks whenever it wishes, as the heavens do. [[Psalm 19:2]] WebSockets keep a line open in both directions, the way Malachi's faithful kept their conversation going. [[Malachi 3:16]] Our app holds a two-way line of that kind to its database; we checked, and it uses neither long polling nor server-sent events anywhere in its own code.

THE LETTER THAT WAITS. A message queue is a durable middle place: the sender writes the message and moves on, and each reader collects it when able, so nothing is lost while a reader is away. The Persian post worked that way. [[Esther 8:9]] [[Esther 8:10]] [[Esther 8:14]] And a sealed decree could not be recalled; the remedy for a bad one was a second decree. [[Esther 8:8]] This project keeps its own decisions on the same principle: a new decision becomes a new record, and old ones are never rewritten. Our app also keeps an outbox, and it was built after a hard lesson: one small business's order form, on a public page this app serves, failed on every attempt for its whole life, and nobody knew until a customer happened to mention it. Now, when such a page reports a new fault, a note to that business's office is written in the same step that records the fault, and delivering it to a phone is a separate job that runs only when switched on. Until then, the record says plainly, the notes simply wait and none is lost.

THE RECORD OF WHAT CHANGED. Every database keeps its own log of changes, and change data capture reads that log and passes each change along. But a log must be read by someone who will act. [[Esther 6:1]] [[Esther 6:2]] [[Esther 6:3]] Our app learned this in June. It had been listening for changes on ten family tables that nobody had ever placed on the database's list of tables to report, so it heard nothing at all, without any error, and changes from another device appeared only at the next sign-in. A review caught it, and a single script corrected it. Today the app's private messages also carry a quiet backstop: every fifteen seconds, and only while the screen is showing, it reads again in case the open line has failed. When Darrell asked in August why it should be time-based at all, the answer written into the code was that it is not; the event comes first, and the timer is only the net beneath it.

WHAT A LIFETIME TEACHES ABOUT THIS. Many of us remember news that came by a knock at the door, by a letter that took a week, or by a telephone that rang in the hallway at an hour no good news ever came. We learned without being taught which messages could wait for the mail and which ones had to be carried in person. We learned, too, that the worst failures were seldom the slow ones. They were the silent ones: the letter sent to the old address, the cousin nobody thought to call, the prayer request that stopped somewhere along the chain. Engineers have spent decades relearning exactly what an attentive grandmother already knew. And the remedy has always been the same: someone takes responsibility for the list, checks it now and then, and makes a point of calling the person at the end of the line to be sure the news arrived.

CHOOSING WELL. [[Ecclesiastes 3:1]] [[Proverbs 15:23]] How soon is the news truly needed? What happens if the hearer is away when it is ready? Who can reach whom? How many must hear? And what will a wrong choice cost? [[Proverbs 13:17]] Choose the way that brings the whole message, in season, and then confirm that it came.

THE WORD WHO CAME. [[Hebrews 1:1]] [[Hebrews 1:2]] The final message was not carried by a runner; He came Himself. [[John 1:14]] Jesus is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]] [[Isaiah 52:7]] Our part is the part of the feet.

THREE THINGS THIS WEEK. First, take one kind of household news - a change of plans, a doctor's appointment, a prayer request - and write down where it starts, who needs it, and what currently sets it moving. Second, find one thing you check repeatedly and arrange to be told instead, keeping a time after which you will ask. Third, test your listeners: send a message through your family's group, your church prayer chain or your phone tree, and ask everyone to confirm they received it.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Asking is not inferior to being told, and the newest method is not always the best. Each has its season. Faithfulness means the whole message reaches the one who needs it, in time, and that someone checks.

${BLOCKED.senior}

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.

WHO SENT THIS. On the twenty-ninth of October 2026 at 18:38 UTC (1:38 in the afternoon, Central) Darrell forwarded a ByteByteGo newsletter, Data Movement Strategies In System Design, out of his university mailbox with ONE WORD typed above the forwarded header: Lesson. Gmail thread 1a1885689c5c2ffc. His word is the ask; the newsletter is the occasion. The lane fell behind, and it was built by hand from the backlog.

THE WORD FIRST. Romans 10:14-15 opens the hour - how shall they hear without a preacher, and how shall they preach, except they be sent - naming the three parts of every message: the hearer, the carrier and the sending. Proverbs 25:13 sets the standard: a faithful messenger. Then eight movements: the three parts; asking and asking again (Isaiah 21 and Elijah's servant on Carmel); being told, and Ahimaaz who ran first with no tidings ready; the question held open, the one-way stream and the open line; the letter that waits (Esther's posts, and the sealed writing no man may reverse); the record of what changed, and the record nobody acted on (Esther 6); how to choose, a word in due season; and the Word who came in person.

OUR OWN HOUSE. PoeTech moves its own data every one of these ways, and each was measured from its code: change notices on an open two-way line for messages, treated as a signal and followed by a fresh read; polling where an outside service cannot call us; an outbox where a broken business page's fault report waits for delivery; the June finding of ten tables listened to and never published; and a site checker scheduled every ten minutes that measured about once an hour.

TRUST BUT VERIFY. The email was a preview of a paid article - four paragraphs and nine topics. blog.bytebytego.com was refused from our network, so nothing from the article about benefits or choosing is reported. Each strategy is taught as the established engineering it is. re-review: 2026-11-27.

LEFT OUT ON PURPOSE. The sponsor's advertisement and the subscription offer are not taught.

PLACEMENT. Sovereign A.I., week 82, because a household that runs its own systems has to know how its own news travels, and whether it arrives.`,
  inApp: `No new screens this week. One page in your Study, one test message, and one honest look at how this app keeps you informed.

In the app: open Sovereign A.I. week 82 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each holds the whole teaching. Use Search it out on 2 Samuel 18, Isaiah 21 and Esther 6 and 8 so the runners, the watchman and the posts sit side by side; the links come from the lesson's own references.

Then watch this app move a message. Open Messages with someone in your household on another phone, and send one line. It appears on theirs without anyone refreshing: the database told the app something changed, and the app read the record again. That is Movement Three, on your own screen.

Away from the app, two exercises. Write the three parts of one kind of household news - where it starts, who needs it, what sets it moving. And send one test message through your family group or your church prayer chain, and ask everyone to confirm they received it.`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Romans 10:15]] [[Proverbs 25:13]] [[Isaiah 21:12]] [[2 Samuel 18:22]] [[Habakkuk 2:3]] [[Esther 8:8]] [[Esther 6:3]] [[Proverbs 15:23]] [[Hebrews 1:2]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them lands on your own house.

First, read 2 Samuel 18:19-33 whole. Mark where Ahimaaz is fast and where Cushi is faithful. Write one sentence on the difference between being told that something happened and being told what happened.

Second, read Isaiah 21:11-12 and 1 Kings 18:41-45. Count the trips. Ask: what do I check again and again, and how many of those trips find nothing?

Third, read Esther 6:1-3 and then Esther 8:8-14. One passage is a record nobody acted on; the other is a message written once and carried to every province. Ask which one your household's news is more like.

And one verification reading, because this course works this way. The newsletter was only a preview; the full article would not open from our network. So nothing in this lesson reports what ByteByteGo wrote about benefits or choosing. What is taught about each strategy is established engineering. Practice telling apart what was read, what is established, and what nobody checked.`,
    plan: `PLAN. Decide two measures before the week starts, and decide who hears them.

One: the message map. Choose one kind of household news and decide when you will sit down and write its three parts - where it starts, who needs it, what sets it moving.

Two: the listener test. Name the day you will send a test message through your family group, your prayer chain or your phone tree, and decide in advance what you will do for anyone who does not answer.

Then name the person who will ask you about both next week. A measure nobody asks about is a wish.

And decide what you will say to the young people in your house. The sentence is short: bring the whole news, and check that it arrived.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.

Write the message map on the day you named. Read it to the person asking you about it.

Send the test message. Count who answered. Fix whatever kept the others from hearing - a changed number, a muted group, a person nobody added.

Trade one poll for a push. Stop checking one thing over and over; arrange to be told, and set the time after which you will ask.

At the end of the week, answer three questions to the person who is asking. Whose news was not reaching them? Which of my checking was wasted trips? And where have I been Ahimaaz - fast, and without the tidings?

Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a system-design newsletter, answered from the Word rather than from the article, and built by hand when the intake lane fell behind.`,
    `Romans 10:14-15 laid down first, so the three parts of every message - hearer, carrier, sending - are learned from Scripture before any diagram.`,
    `Proverbs 25:13 set as the standard: faithful before fast.`,
    `Pull taught through Deuteronomy 32:7 - ask thy father, and he will shew thee.`,
    `Polling taught through the watchman of Isaiah 21, whose answer is the polling contract: enquire, return, come.`,
    `Elijah's servant on Carmel used to show polling's honest cost: six trips for nothing, and the change seen only on the seventh.`,
    `A measured figure instead of a painted one: our site checker is scheduled every ten minutes and measured about once an hour across twenty-eight runs.`,
    `Proverbs 27:1 applied to schedules: a timer is a hope about tomorrow, so measure what actually came.`,
    `Push taught through the runners of 2 Samuel 18, with Joab's question kept whole: why run with no tidings ready?`,
    `The app's own message design traced in its code: a change notice treated as a signal, then a fresh read of the record.`,
    `Long polling pictured by Habakkuk on his watch, the question held open until the answer came.`,
    `Server-sent events and WebSockets told apart plainly: one line one way, one line both ways.`,
    `An honest measurement of what the app does not use: no long polling and no server-sent events in its own code.`,
    `Message queues taught through Esther's posts: written once, carried to every province in its own language.`,
    `Esther 8:8 used to teach that a sent message is not recalled; the correction is a new message.`,
    `The app's push outbox shown as a real queue: a broken business page's fault report waits, and none is lost while delivery is off.`,
    `Change data capture taught through the book of records in Esther 6: captured perfectly, and nothing done.`,
    `The June finding told plainly: ten tables listened to and never published, a silent nothing with no error.`,
    `The fifteen-second backstop under the message stream shown as the right order: the event first, the timer only as a net.`,
    `Choosing taught from Ecclesiastes 3:1, Proverbs 15:23, 13:17 and 26:6: in season, faithful, and never by a fool's hand.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, the Word who came in person after sundry times and divers manners.`,
    `The preview told as a preview: nothing reported from the article that was not read, with the shut road named and a dated re-review.`,
    `All four age bands carried from the first commit, each written for its own reader.`,
    `Three household actions that cost nothing: draw one message, trade one poll for a push, test one listener.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The prayer chain that went quiet',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A small church had a prayer chain for thirty years. When someone needed prayer, the first person called the second, the second called the third, and so on down a typed list taped inside a kitchen cabinet.

One spring, a widow near the end of the list had a fall and spent four days in the hospital. Nobody from the church came. When she was home again, she said nothing, but she stopped coming on Sundays.

A deacon finally went to see her. Over coffee, she asked him why no one had called when her own name went on the chain. He did not know. He went home and called down the list himself.

The man two places above her had moved to his daughter's house in another state the year before. His old number still rang in an empty kitchen. Every request that reached him had stopped there, quietly, for eleven months. No one had noticed, because a chain that is not ringing sounds exactly like a chain with nothing to say.

The church fixed the list that week. Then the deacon added one thing: every first Sunday of the month, a short test message went down the chain, and the last person called the first one back to say it arrived.

The widow is on the call-back end now. She says she has never once missed it.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The mother who stopped calling every hour',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. During an ice storm, a woman's son lost power at his house across town. She called him at eight to ask if it was back. Then at nine. Then at ten.

At eleven he answered tired and said the phone was the only thing he had to keep warm by, and the battery was going.

She was quiet, and then she said what she was really asking. She did not need to know every hour. She needed to know that he was all right, and that she would hear if he was not.

So they made an arrangement. He would text her the moment the power came back. If anything went wrong, he would call. And if she had heard nothing by seven the next morning, she could call him then, and he would answer.

She slept that night for the first time in two days. At four in the morning her phone lit up with three words: Power is back.

Later she told her friends it was the best rule she had ever made. Be told when it changes. Ask only if it has been too long.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'What three parts of a message does Romans 10:14-15 name?',
        options: [
          'The price, the speed and the distance',
          'The one who hears, the one who carries the word, and the sending that sets the carrier moving',
          'The author, the editor and the printer',
        ],
        answer: 1,
        explain: 'Software calls them the consumer, the source and the trigger. Paul named them first: the hearer, the preacher, and the being sent.',
      },
      {
        q: 'What quality does Proverbs 25:13 praise in a messenger?',
        options: ['Speed', 'Faithfulness', 'Eloquence'],
        answer: 1,
        explain: 'A faithful messenger refreshes the soul of those who sent him. The whole message arriving matters more than the first message arriving.',
      },
      {
        q: 'Why is the watchman of Isaiah 21:11-12 a picture of polling?',
        options: [
          'Because he never answered',
          'Because the one asking calls out repeatedly, and the watchman tells him to enquire, return and come again',
          'Because he sent a letter',
        ],
        answer: 1,
        explain: 'Polling is asking on a schedule. Its cost is that most trips find nothing new, as Elijah’s servant found six times on Carmel.',
      },
      {
        q: 'What did Joab ask Ahimaaz in 2 Samuel 18:22?',
        options: ['Why he was late', 'Why he would run, seeing he had no tidings ready', 'Whether the king was safe'],
        answer: 1,
        explain: 'Ahimaaz arrived first and knew nothing. A quick signal is useful, but it is not the same as the news. Cushi brought the tidings.',
      },
      {
        q: 'When this app is told that a message changed, what does it do next?',
        options: [
          'It shows the notice as the message',
          'It treats the notice as a signal and reads the messages again from the record',
          'It ignores it until the next sign-in',
        ],
        answer: 1,
        explain: 'The notice is Ahimaaz; the record is Cushi. The fast signal is welcome, and the record is the truth.',
      },
      {
        q: 'What is the difference between server-sent events and WebSockets?',
        options: [
          'There is none',
          'Server-sent events keep one line open from the source to the hearer; WebSockets keep a line open both ways',
          'WebSockets only work on phones',
        ],
        answer: 1,
        explain:
          'Psalm 19:2 pictures the one-way stream; Malachi 3:16 pictures people who spoke often one to another. This app holds a two-way line to its database.',
      },
      {
        q: 'What does a message queue do, as Esther 8 pictures it?',
        options: [
          'It deletes old messages',
          'It holds a message written once until each reader can receive it, so nothing is lost while a reader is away',
          'It makes messages arrive faster than push',
        ],
        answer: 1,
        explain:
          'The decree was written once and carried by posts to every province. The app’s outbox does the same when a business page it serves reports a fault: the note waits, and none is lost.',
      },
      {
        q: 'According to Esther 8:8, how was a wrong sealed decree dealt with?',
        options: ['It was erased', 'It could not be reversed, so a new decree was sent', 'The posts refused to carry it'],
        answer: 1,
        explain: 'Good message systems keep that rule: what was sent stays sent, and a correction is a new message.',
      },
      {
        q: 'What went wrong in this app in June, as the lesson tells it?',
        options: [
          'The database crashed',
          'The app listened for changes on ten tables that were never placed on the list the database reports, so it heard nothing and showed no error',
          'Messages were sent twice',
        ],
        answer: 1,
        explain: 'Like the book of records in Esther 6, a change can be captured and still reach no one. A review caught it and one script fixed it.',
      },
      {
        q: 'What does this lesson say about the ByteByteGo article itself?',
        options: [
          'That every claim in it was checked',
          'That the email was only a preview, the full article would not open from our network, and nothing it says about benefits or choosing is reported',
          'That the article was wrong',
        ],
        answer: 1,
        explain:
          'The strategies are taught as the established engineering they are, and every claim about the app was measured from its code. re-review: 2026-11-27.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Romans 10:14-15 aloud before you say one word about any computer. Then read Proverbs 25:13 aloud. Then ask the room one question and wait: how do you find out when something changes for someone you love?

MINUTES 0 TO 8 - THE THREE PARTS. Romans 10:14-15 and 10:17. Name the hearer, the carrier and the sending. Ask the room for one example from their own week.

MINUTES 8 TO 18 - ASKING AND ASKING AGAIN. Deuteronomy 32:7, Isaiah 21:11-12, 1 Kings 18:43-44, Proverbs 27:1. Explain pull and polling in one sentence each. Give the measured figure: a checker scheduled every ten minutes that ran about once an hour.

MINUTES 18 TO 30 - BEING TOLD. 2 Samuel 18:19-32, read as a story, with two readers if you can. Explain push and webhooks. Then show how this app treats a change notice as a signal and reads the record again.

MINUTES 30 TO 38 - THE OPEN LINE. Habakkuk 2:1 and 2:3, Psalm 19:2, Malachi 3:16. Long polling, server-sent events and WebSockets, one sentence each.

MINUTES 38 TO 48 - THE LETTER THAT WAITS AND THE RECORD NOBODY READ. Esther 8:8-14 and Esther 6:1-3. Explain queues and change data capture. Tell the outbox and the June finding plainly. Say the verification note: the email was only a preview, and nothing from the full article is reported.

MINUTES 48 TO 60 - CHOOSING, AND THE WORD WHO CAME. Ecclesiastes 3:1, Proverbs 15:23, 13:17 and 26:6; then Hebrews 1:1-2, John 1:1 and 1:14, John 1:29, John 3:16, Hebrews 1:8, Colossians 1:17 and Isaiah 52:7. Give the three household actions and close with the talk-together directions.

WHAT NOT TO DO. Do not turn this into a technical seminar; the room needs the Word and one faithful habit. Do not stage the strategies as rival camps and let the room pick a winner; each is good in its season (DR-0098). Do not attribute to ByteByteGo anything the email did not contain. And do not skip the listener test; it is the part people will remember.`,
    talkingPoints: [
      `Romans 10:14-15 names the three parts of every message: the hearer, the carrier and the sending.`,
      `Software calls them the consumer, the source and the trigger.`,
      `Proverbs 25:13 praises the faithful messenger, not the fast one.`,
      `Pull: the hearer asks and the source answers (Deuteronomy 32:7).`,
      `Polling: asking on a schedule. The watchman’s answer is the contract - enquire, return, come (Isaiah 21:12).`,
      `Polling’s cost: most trips find nothing, and change is seen only on the next trip (1 Kings 18:43-44).`,
      `Measured: our site checker is scheduled every ten minutes and ran about once an hour across twenty-eight runs.`,
      `A schedule is a hope about tomorrow (Proverbs 27:1). Measure what actually came.`,
      `Push: the source tells the hearer when something changes. A webhook is the common form.`,
      `Ahimaaz was first and had nothing; Cushi had the tidings (2 Samuel 18:29-31).`,
      `This app treats a change notice as a signal and then reads the record again. The signal is welcome; the record is the truth.`,
      `Long polling holds the question open until there is an answer (Habakkuk 2:1).`,
      `Server-sent events: one line, one way. WebSockets: one line, both ways.`,
      `This app holds a two-way line to its database, and uses no long polling or server-sent events in its own code.`,
      `A message queue holds a message until each reader can take it; nothing is lost while a reader is away.`,
      `Esther’s posts carried one decree to every province, each in its own language (Esther 8:9-10).`,
      `A sealed decree could not be reversed; the correction was a new decree (Esther 8:8).`,
      `The app’s push outbox waits for delivery, and none of its notes is lost while delivery is off.`,
      `Change data capture reads the database’s own log of changes and passes each one on.`,
      `A log nobody reads is a faithful record and an unfaithful messenger (Esther 6:3).`,
      `In June the app listened to ten tables nobody had published: no error, and no news.`,
      `Event first, timer only as a backstop: the app’s messages are read again every fifteen seconds, and never while the screen is hidden.`,
      `Choose by timing, faithfulness, reach, number of hearers and the cost of a wrong guess (Ecclesiastes 3:1; Proverbs 13:17).`,
      `Jesus is the Lamb of Yahweh and the Eternal Son, the Word who came in person (Hebrews 1:1-2; John 1:14).`,
    ],
    discussionPrompts: [
      `When something important changes for someone in your family, how do you find out today? Is it by design or by accident?`,
      `What do you check over and over? How many of those checks find nothing new?`,
      `When have you been Ahimaaz - quick to speak, without the whole news?`,
      `Who in your church or family might not be hearing the things everyone assumes they hear?`,
      `What message in your life is like Mordecai’s - recorded somewhere, and never acted on?`,
      `If you sent a test message to everyone who should hear from you, who would not answer?`,
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
console.log(`sov82: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov82: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov82: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov82: refusing to splice a lesson that fails the four-band ladder');
}
if (process.argv.includes('--measure')) process.exit(0);

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov82: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov82: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov82: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov82: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov82: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  // from - 1 also takes the newline before the block, so a rebuild is byte-identical (sov81-fill grew a blank line per rebuild).
  src2 = src2.slice(0, from - 1 - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov82: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov82: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov82: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov82: week ${WEEK} is already taken`);
if (!after.includes(WEEK)) throw new Error(`sov82: week ${WEEK} is not in the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov82: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov82: spliced ${ID}`);
console.log(`sov82: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov82: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
