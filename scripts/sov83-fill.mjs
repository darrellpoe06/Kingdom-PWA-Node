// =============================================================================
// sov83-fill - build Sovereign A.I. week 83 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[Jeremiah 32:14]],
// and this script replaces it with the corpus text followed by the reference.
// No verse on the page was typed from memory. The reference list on the
// module's anchor is DERIVED from the placeholders that actually occur in the
// reader places, so anchor.ref names every verse the lesson stands on and
// nothing it does not (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-10-30 at 12:38 UTC Level Up Coding (Nikki
// Siapno) sent the issue ACID Clearly Explained. At 12:54 UTC - 7:54 AM
// Central - Darrell forwarded it out of his university mailbox into the lesson
// lane with ONE WORD typed above the forwarded header: Lesson. Gmail thread
// `1a18cd240a3a03eb`. The scheduled intake fell behind; this build drains it on
// 2026-11-13. The whole article came inside the email; nothing sits behind a
// link. The sponsor block (a retrieval guide) is left out.
//
// THE NUMBER. Week 82 was claimed by a sibling build at 14:51:19 UTC as
// reserve/sov82 while this build pushed reserve/sov-82 at 14:51:18 UTC. Two
// spellings of one number, so the server's empty-lease refused neither. This
// build yielded and took 83 (reserve/sov83). That collision is taught in the
// lesson as the isolation movement's own house example, because it is one.
//
// WORD FIRST (DR-0127 / DR-0282). Matthew 5:37 - let your yea be yea - and
// Jeremiah 32:14 - the sealed deed put in an earthen vessel, that it may
// continue many days - frame the hour before a single word about a database.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). ESTABLISHED and stated
// plainly: what the four guarantees mean, and that PostgreSQL keeps its
// guarantees with multi-version concurrency control and a write-ahead log.
// www.postgresql.org was asked for on 2026-11-13 and answered `curl: (56)
// CONNECT tunnel failed, response 403` and getaddrinfo ENOTFOUND through the
// fetch tool, so those facts are stated as the established engineering they
// are, not as a page read back today. The newsletter's dollars and its last
// item in stock are illustrations, not reported events, and are taught so.
//
// MEASURED ON OUR OWN HOUSE (not painted), each with file:line in the DR:
// the payments ledger's CHECK and UNIQUE (0116:37, :46); the webhook's money
// write and seat write as two separate requests closed by retry and keys
// (stripe-webhook.js:342-409); the workshop seat counted at checkout
// (checkout.js:161) and written later with no count (stripe-webhook.js:379,
// 0323:34); the exam rules moved into the wall (0313:82-86); the learner record
// that once lived on one phone (0250:9-21); the reservation referee
// (scripts/lib/reserve-ref.mjs:11, :29). The live tables are on the NAS and
// were not reachable from this session; the hosted project the tooling reaches
// is the mirror (infra/nas-supabase/REPOINT-ARMED), so NO live count is taught.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 83;
const ID = 'sov83-that-they-may-continue-many-days';
const TITLE = 'That they may continue many days - all or nothing, the rule the record knows, one blessing and two hands, and the deed that outlives the siege';

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
  if (!m) throw new Error(`sov83: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov83: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov83: reference does not resolve in the corpus -> "${ref}"`);
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
const FACTS = {
  lesson:
    "WHERE WE STAND ON THE FACTS. The newsletter came whole inside the email, so the teaching here is from the full article and not from a teaser. ESTABLISHED, and stated plainly: what atomicity, consistency, isolation and durability mean, and that PostgreSQL - the database underneath this app - keeps its promises with multi-version concurrency control and a write-ahead log. Its own manual documents both; the manual's site, www.postgresql.org, refused our network when we asked for it on the thirteenth of November, so those two facts are stated here as the established engineering they are, not as a page we read back that day. ILLUSTRATION, not event: the five-thousand-dollar transfer and the last item in stock are the newsletter's teaching examples, not reported happenings. MEASURED in our own code: everything said below about this app's ledger, its seats and its learner records is traced to the file and line that does it. NOT MEASURED: the live tables. They sit on the household's own server, which this session could not reach, and the copy our tools can reach is a mirror, not the live data. So this lesson says what shape the code has, and does not claim whether any seat was ever sold twice. re-review: 2026-11-27.",
  child:
    'WHAT IS SURE AND WHAT IS NOT. The whole email came to us, so we read all of it. The four promises are real. They are how good computer records work. The money story and the last toy story are made up to teach. They did not really happen. We looked at the code in our own app. We could not look at the real records on the home computer. So we know the shape of the code. We do not know if a seat was ever sold two times. We will look again. re-review: 2026-11-27.',
  youth:
    "WHAT IS SURE AND WHAT IS NOT. The newsletter came whole in the email, so nothing was hidden behind a link. The four promises are established. They are how real databases are built. The database under our app is called PostgreSQL, and it keeps its promises with a log written before it says done. The money story and the last item in the store are examples made up to teach, not real events. We read our own app's code line by line. We could not reach the real records on the family's own server, so we know how the code is shaped but not whether a seat was ever sold twice. re-review: 2026-11-27.",
  teen: "WHAT IS SURE AND WHAT IS NOT. Be clear on what we had. The whole article came in the email. The four guarantees are established fact, not opinion. PostgreSQL, the database under this app, keeps them with versions of each row and a log it writes before it answers done. Its own manual says so; that site was blocked from our network on the thirteenth, so we state it as the known engineering it is. The money transfer and the last item in stock are teaching examples, not real events. Our own app was measured in its code, file by file. The live tables were out of reach, so we know the code's shape, not whether any seat was ever double sold. re-review: 2026-11-27.",
  senior:
    'WHERE WE STAND ON THE FACTS. The newsletter arrived whole within the email, so this hour is built on the entire article rather than a summary. The meaning of the four guarantees is established engineering and is stated plainly. So is the fact that PostgreSQL, the database beneath this application, keeps its guarantees with multiple row versions and a write-ahead log; its own manual documents both, and although that site refused our network on the thirteenth of November, nothing about these facts is in dispute. The transfer of five thousand dollars and the last item in stock are illustrations, not reported events. Everything said about our own house is traced to the code that does it. The live tables were not reachable from this session, so the lesson describes the shape of the code and claims nothing about whether a seat was ever sold twice. re-review: 2026-11-27.',
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - what is a promise someone kept to you that you still remember, and how did you know it would hold - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Matthew 5:37. Children, ask your mother, your father or a grandparent about a time two people in the family both thought something was theirs at once - a room, a car, the last piece of something - and how it was settled; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what is one thing each of us started and left half done, and will we finish it or say plainly that we are stopping. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - what is a promise someone kept for you - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Matthew 5:37. Children, ask your mom or your dad or your grandma or your grandpa about a time two kids both wanted the same last thing. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what is one thing we started and did not finish. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when somebody tells you it is done, how do you know it really is - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Jeremiah 32:14. Children, ask your mom, your dad or a grandparent about a paper they kept for years because it proved something - a deed, a title, a letter - and hear the whole of it before you answer; then retell their answer in your own words. Then ask a friend this: what is one rule in each of our houses that lives only in somebody's head. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is something you said yes to and then only half did - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Joshua 11:15. Children, ask your mom, your dad or a grandparent about a time two people were promised the same thing, and what happened next, and hear all of it before you reply; then retell their answer in your own words. Then ask a friend this: which shared thing between us - a ride, a game, a group project - keeps getting claimed twice, and what rule would settle it. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what would you want written down and kept so it outlasts you - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Psalm 15:4. Children, ask your parents or your grandparents about a promise that cost them something to keep, and why they kept it; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: which of our papers, promises or plans would not survive if one of us were gone tomorrow. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no detail from the newsletter stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the thirtieth of October 2026, at six minutes to eight in the morning, Darrell forwarded a short engineering newsletter out of his university mailbox into this lane. Above the forwarded header he typed ONE WORD: Lesson. That word is the ask. The newsletter is only the occasion; no article is the foundation of an hour in this course. The scheduled intake fell behind, and it was built by hand two weeks later.

THE WORD FIRST, BEFORE ANY MACHINE. Two verses frame this hour, and everything after them is application. The first is about the word we give: [[Matthew 5:37]] The second is about the record we keep. Jeremiah bought a field while an army surrounded the city, and the deed was handled like this: [[Jeremiah 32:14]] Say yes and mean all of it. Write it down so it lasts. Hold both, and then hear the article.

WHAT THE NEWSLETTER TEACHES. It asks one question: what does a database have to guarantee before it may tell you the work is complete? Its example is a transfer of money between two accounts. To the person it looks like one act. Inside, it is several steps - take the money out of one account, put it into the other, record the transfer. Four things can go wrong. The machine can fail halfway. The result can break a rule. Two transfers can touch the same account at the same moment. Or everything can succeed, the database can say done, and then the machine can fail. Four failures, four guarantees, and their first letters spell ACID: atomicity, consistency, isolation, durability.

This lesson is close to home. PoeTech keeps money records, workshop seats and every learner's lessons and exams in exactly this kind of database. So the four questions are not about somebody else's bank. They are about our own house, and about our own word.`,

  FACTS.lesson,

  `MOVEMENT ONE: ALL OR NOTHING. Atomicity means a transaction either happens completely or not at all. There are only two honest endings: commit, where every step took effect, or rollback, where none did. What atomicity forbids is the third ending - the half-done thing that looks finished.

The Word sets that standard long before any machine. Of Joshua it says: [[Joshua 11:15]] Nothing undone. And Jesus warned about the builder who starts what he cannot complete: [[Luke 14:28]] [[Luke 14:29]] [[Luke 14:30]] A half-built tower is worse than no tower. It stands in public saying something that is not true.

The sharpest case in the Word is not a failure to finish. It is a part presented as the whole. [[Acts 5:1]] [[Acts 5:2]] Peter's answer shows exactly where the sin lay: [[Acts 5:4]] The field was theirs. Keeping part was allowed. Saying it was all of it was the lie. That is the failure atomicity exists to prevent - a record that claims the whole when only part took place. And Solomon gives the rollback its honour: [[Ecclesiastes 5:5]] Better an honest no than a yes left half paid.

Now our own house, measured. When a payment arrives, the app's payment handler writes the money into the ledger first, and then, as a separate request, hands the buyer the book, the seat or the membership. Each request is its own transaction, so the pair is NOT one all-or-nothing unit. If the second write fails, the money is recorded and the seat is not yet given. The house closes that gap honestly in another way: a failed second write answers with an error so the payment processor sends the event again, and the ledger refuses to count the same event twice. So the retry finishes the work and never doubles the money. That is a real design and a sound one - but it is eventual completion, not atomicity, and there is a window where the record is half done. Naming the window is the point. The schema changes for the book store, by contrast, run inside one begin and one commit, so the whole set of tables lands or none of it does.`,

  `MOVEMENT TWO: THE RULE THE RECORD KNOWS. Consistency means every transaction moves the data from one valid state to another. Every rule still holds when the work is done: no two accounts with the same key, no order for a customer who does not exist, no number below the floor it is allowed.

The Word was giving Israel constraints for its records three thousand years before databases. [[Leviticus 19:35]] [[Leviticus 19:36]] Just balances, just weights. And the standard is not ours to set: [[Proverbs 16:11]] The weights in the bag belong to Yahweh.

The newsletter makes one point that deserves to be read twice: the database can only enforce the rules it knows about. A rule that lives only inside the program - only in somebody's head - is not enforced at the place where the record is written. The Word draws the same line between a law on stone and a law within: [[Hebrews 8:10]] A rule written where the act happens is kept. A rule written somewhere else is hoped for.

Our house learned this exactly. The payments ledger refuses a negative amount and refuses to record one processor event twice, and both rules are written into the table itself, not only into the program that writes it. The learner records allow one row per learner per lesson and refuse an exam score below zero or above one hundred. And then the hard lesson: an exam rule used to live on the phone. The phone sent the score and the attempt count, and the record took whatever came last. So a retake that scored lower overwrote a pass, and a device that had forgotten an attempt could shrink the count. The rule was moved into the database itself. Now the best score stands, every attempt is kept in order, and the attempt count can never go down, whatever any phone sends. Before that, a plain mark that a lesson was read had also erased an exam the learner had passed, because a blank was being written over a real value. Both were fixed by putting the rule where the record lives.`,

  `MOVEMENT THREE: ONE BLESSING AND TWO HANDS. Isolation controls what happens when two transactions touch the same thing at the same time. The newsletter's picture is plain. One item left. Two buyers both read that one is in stock. Both buy. Each step looked right on its own, and together they sold the last item twice.

Scripture has that exact collision, with one blessing and two claimants. [[Genesis 27:30]] Moments apart. And when the second arrived: [[Genesis 27:33]] The blessing had gone to the first hand that reached it, on a reading that was not true. Then the cry every oversold customer understands: [[Genesis 27:38]]

The Word also shows the better way, which is to separate before the strife. [[Genesis 13:6]] [[Genesis 13:8]] [[Genesis 13:9]] Abram did not let two herds work the same ground and hope. He drew a line so that each could act without colliding. That is isolation: deciding in advance how much one party may see and touch of another's work. And it has a cost, which the newsletter is honest about. Abram gave up the first choice to buy peace. Stronger isolation costs waiting, retries and less done at once.

Now two cases from our own house, both measured.

The first happened while this lesson was being built. Builders in this project claim the next lesson number by writing a reservation that only one claimant can win - the server refuses the second push for the same name. It was built after one record number was taken twice in a single day. This morning two builders both read week eighty-two as free, and both claimed it one second apart. Both claims succeeded. Why? One spelled the reservation with a dash and one without. The referee protects only the exact name it is given, and the reservation tool has a fixed spelling only for record numbers and Living Lessons, not for this course. Two spellings, so two different things, so no conflict was seen. The Word has a sentence for it: [[Proverbs 20:10]] One number, two measures. This lesson's builder yielded and took eighty-three. The fix is to give this course one spelling the tool owns, so the rule knows what it is protecting.

The second is a hole, found by reading the code. A workshop seat is counted at checkout - the app asks how many seats are left before it sends the buyer to pay. The seat is written later, after the payment clears, and at that moment nothing counts again. The only rule the table itself knows about capacity is that it is above zero. So two buyers who both see one seat left could both pay and both be seated. That is the newsletter's last item, in our own store. We cannot see the live tables from here, so we do not know whether it has ever happened. The fix also needs a decision only the Governor can make - what the second buyer is told, a waiting list or a refund - so it is written down for him with a date, not patched in silence.`,

  `MOVEMENT FOUR: COMMITTED MEANS COMMITTED. Durability means that once the database says done, the work survives whatever happens next. The newsletter names the common mechanism: before confirming, the database writes what it is about to do into a log on lasting storage, so that after a crash the log can restore it. Write first, then say yes.

Jeremiah did exactly that, with an army at the wall. [[Jeremiah 32:10]] Signed, sealed, witnessed, weighed. And then the instruction at the top of this hour: put the deeds in an earthen jar, that they may continue many days. The city was about to fall. The record was made to outlast it.

The Word holds a spoken yes to the same standard. [[Numbers 30:2]] [[Psalm 15:4]] A committed word is kept even when keeping it costs. And there is writing in Scripture that no one may reverse: [[Esther 8:8]] Yahweh Himself keeps a durable record: [[Malachi 3:16]]

Our house has one plain example. A learner's progress used to live only in the browser on one device - which lessons were read, how each exam went. It never left the phone it was read on. If the phone was lost, the record was lost, and his father, as Governor, could not see it at all. Now each reading and each exam is written to a table on the household's server, and the copy on the phone is kept only as the quick path. The phone's copy was a promise. The table is the deed in the jar.`,

  `MOVEMENT FIVE: COUNT THE COST, AND CHOOSE WHERE IT MATTERS. The newsletter closes on a tradeoff. Stronger guarantees cost time and coordination, so they belong where a failure is expensive: money, orders, the last item, a booking. Elsewhere, a brief delay may be an honest trade for speed.

Jethro gave Moses the same counsel about judgment. [[Exodus 18:22]] Not every matter needs the highest court. The great matters do. And Jesus told us to count before we build, which is the question the newsletter asks: how much would it cost if this were left half done, invalid, colliding, or lost?

This app already chooses that way. The money ledger only ever adds rows and never edits one. A correction is a new row. The learner's record on the phone is allowed to be quick and a little behind, because the table behind it is the one that must be right. The fix for the workshop seat belongs at the great-matter end, because it is money and a person's place.`,

  `MOVEMENT SIX: THE TRANSACTION THAT WAS FINISHED. Bring it home, to the One whose work never fails any of the four.

On the cross Jesus did not leave a step undone: [[John 19:30]] Finished - all of it. He did not break the rule to do it: [[Matthew 5:17]] He kept every just weight. No rival claim stands between Him and any who come; He stands for each of them, always: [[Hebrews 7:25]] And it is durable past every crash the world can suffer: [[Hebrews 10:14]] For ever.

He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] and by Him the whole creation holds together: [[Colossians 1:17]] Every record we keep is small beside that. So pray Moses' prayer over the work: [[Psalm 90:17]] And His word outlasts every disk: [[Matthew 24:35]]`,

  `FOUR THINGS THIS WEEK, and none of them needs a purchase.

One, all or nothing. Find one thing you started and left half done - a repair, a form, a promise. Finish it, or say plainly that you are stopping. Do not leave it looking finished.

Two, write the rule where it happens. Pick one rule your house keeps only in someone's head - who takes the car, when the dishes are done, where the spare key lives. Write it where the act happens, on the door or the fridge.

Three, one claim at a time. Choose one shared thing that keeps getting claimed twice - a calendar slot, a room, the last of something. Agree on how a claim is made, so two people cannot both win it.

Four, put one deed in the jar. Take one paper that matters - a title, a will, a letter, a list of accounts - and store a copy somewhere that would survive the house losing power or a phone being lost. Tell one other person where it is.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that every task needs the strongest guarantee, or that fast is always careless. The point is honesty about state: never call half done finished, keep the rules where the record lives, settle collisions before they happen, and when you say done, make it last.`,

  TALK.lesson,
];
// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader, not a
// re-registering of the adult text, and each carries the whole teaching, the
// tiers and the talk-together close (DR-0795).
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

FOUR SMALL QUESTIONS. Did you do all of it? Did you keep the rules? Did two people grab the same thing? Will it last? This whole lesson is about those four questions.

WHO SENT THIS. Darrell got an email. It was about how computers keep track of things. He wrote one word on top. The word was Lesson. Then he sent it to us. That one word is why you are reading this.

THE WORD FIRST. Jesus said a short thing about our words. Here it is. [[Matthew 5:37]]

That means when you say yes, mean yes. When you say no, mean no. Do not say yes and then do half.

AND ONE MORE VERSE. A man named Jeremiah bought a field. An army was all around the town. He wrote down that he bought it. Then he put the paper in a clay jar so it would last. [[Jeremiah 32:14]]

He wanted the paper to last a long, long time. Even if the town fell down.

WHAT THE EMAIL SAID. The email was about a database. A database is a place where a computer keeps lists. Lists of money. Lists of who came to class. Lists of who passed a test. The email said a good list keeps four promises.

PROMISE ONE: ALL OR NOTHING. Say you move ten dollars from one jar to another jar. You take it out of the first jar. Then you must put it in the second jar. If you stop in the middle, the money is lost. So a good list does all of it, or none of it. Never half.

Joshua was like that. [[Joshua 11:15]] He left nothing undone. Not one thing.

Jesus told a story about a man who started a tower. He could not finish it. People laughed. [[Luke 14:30]] So think first. Then finish what you start.

There is a sad story too. A man and his wife sold a field. They kept some of the money. That was fine. But they said they gave all of it. That was a lie. [[Acts 5:4]] Half is not all. Do not say all when it is half.

PROMISE TWO: KEEP THE RULES. A good list has rules. You cannot have less than zero. You cannot be on the list two times. Yahweh gave rules like that long ago, for fair weights at the store. [[Leviticus 19:36]]

Here is a smart thing the email said. A list can only keep the rules it knows. If the rule is only in your head, the list will not keep it. So write the rule down where the work is done.

Yahweh does this with us. He writes His rules on our hearts. [[Hebrews 8:10]] Then the rule is right where we act.

OUR APP LEARNED THIS. Our app keeps a score for each test you take. It used to let a worse score wipe out a better one. That was not fair. Now the rule lives in the list itself. Your best score stays. Every try is kept.

PROMISE THREE: ONE AT A TIME. Say there is one cookie left. Two kids both see it. Both grab it at the same time. Now there is a fight.

The Bible has a story like that. A father named Isaac had one big blessing to give. Two sons came for it, one right after the other. [[Genesis 27:38]] Only one got it. The other one cried.

Abram did better. His men and Lot's men kept fighting over the same land. So Abram said, let us not fight. You pick a side. I will take the other side. [[Genesis 13:8]] They split it up before anyone grabbed.

THIS HAPPENED TO US TODAY. Two helpers were building lessons for this app. Both wanted lesson number eighty-two. Both wrote their claim one second apart. One wrote the name with a dash. One wrote it with no dash. So the computer thought they were two different names. It let both win! One helper gave it up and took eighty-three. That is this lesson.

AND A SEAT IN A CLASS. Our app can sell a seat in a class. It checks if a seat is left before you pay. But it does not check again when the seat is given. So two people might get the last seat. We told Darrell so he can choose what to do.

PROMISE FOUR: IT WILL LAST. When a good list says done, it is done. Even if the power goes out. The list writes things down first. Then it says done.

That is just what Jeremiah did with his paper in the jar. [[Jeremiah 32:10]]

Yahweh keeps a list too. He writes down the names of people who love Him. [[Malachi 3:16]]

OUR APP DID THIS TOO. It used to keep your reading list only on your phone. If you lost the phone, the list was gone. Now it is saved at home too. So it lasts.

WHY IT MATTERS FOR YOU. These four promises are not just for computers. They are for you too. Did you clean all of your room, or just the part Mom can see? Do you keep the rule when no one is looking? Do you take turns when two of you want the same toy? When you say you will come, do you come? A computer has to be made to keep its promises. You get to choose to keep yours. And Yahweh always keeps His. He never does half. He never breaks His own rule. He never forgets what He said.

JESUS FINISHED ALL OF IT. When Jesus died on the cross, He said three words. [[John 19:30]] It is finished. He did all of it. Not half. And what He did lasts forever. [[Matthew 24:35]]

A STORY ABOUT A LEMONADE STAND. Here is a made-up story to help you think. It did not really happen.

Mia and her brother Leo had a lemonade stand. They had one cup of lemonade left. A lady walked up and said, I will take it. At the same time, Leo's friend ran up and said, me too! Both held out a dollar.

Mia did not know what to do. Then she had an idea. She took a marker. She wrote on a card, Last cup goes to the first name on this card. She held it out. The lady wrote her name first. Leo's friend was sad, but he said that was fair.

Then Mia wrote one more rule on the card: When the jug is empty, say so out loud. She taped the card to the stand. Now the rule was right where the selling happened.

The next day they wrote down every cup they sold in a little book. They kept the book in a tin box. Mom said, that is a good book. It will last.

${FACTS.child}

FOUR THINGS THIS WEEK. One, finish one thing you started. Two, write down one house rule and put it where it is used. Three, make a fair way to take turns with one thing you share. Four, put one paper you love in a safe box.

${TALK.child}`;

const YOUTH = `${TITLE}.

FOUR QUESTIONS FOR ANY PROMISE. Did all of it happen? Is it still fair? Did two people bump into each other? Will it last? Those four questions are this whole lesson.

WHO SENT THIS. On the thirtieth of October, a little before eight in the morning, Darrell forwarded a short newsletter about computers into this lane. He typed one word above it: Lesson. His word is the ask. The newsletter is only the reason we started.

THE WORD FIRST. Two verses come before any talk of machines. Jesus said: [[Matthew 5:37]] Mean your yes all the way.

And when Jeremiah bought a field while an army surrounded the city, he was told to keep the deed like this: [[Jeremiah 32:14]] Write it down so it lasts. Keep both verses in mind.

WHAT THE NEWSLETTER SAID. It was about a database, which is the place a program keeps its records. Its example was moving money from one account to another. That looks like one act, but it is really two or three steps. Four things can go wrong, and good databases make four promises to stop them. Their first letters spell ACID.

THE FIRST PROMISE: ALL OR NOTHING. Either every step happens, or none of them does. You never end up with the money gone from one account and missing from the other.

Joshua lived like that. [[Joshua 11:15]] And Jesus warned about the man who began a tower and ran out of money halfway: [[Luke 14:29]] [[Luke 14:30]]

The worst half-done thing is the one that pretends to be whole. Ananias and Sapphira sold land, kept part of the money, and said they gave all of it. Peter told them the land was theirs and keeping some was fine. The lie was calling part the whole. [[Acts 5:4]] A record that says all when it was half is that same lie.

Our app has a spot like this. When someone pays, it writes the money down first. Then it gives them their book or seat in a second step. Those are two separate saves, so the pair is not atomic. If the second one fails, the money is written but the seat is not. The app fixes it by asking the payment company to send the news again, and the money list refuses to count it twice. So it finishes in the end, but for a moment it is half done. We say that out loud because it is true.

THE SECOND PROMISE: KEEP THE RULES. When the work is done, every rule still holds. No amount below zero. No one counted twice. Yahweh gave Israel rules for fair weights: [[Leviticus 19:35]] [[Leviticus 19:36]]

The newsletter said something important. A database can only keep the rules it knows about. A rule that lives somewhere else is only hoped for. Yahweh puts His rules where we act: [[Hebrews 8:10]]

Our app learned this the hard way. Test scores used to be decided by the phone. If you took a test again and did worse, the worse score could replace your pass. Now the rule lives in the database. Your best score stays, every try is kept in order, and the number of tries can never go down.

THE THIRD PROMISE: TAKE TURNS. When two people reach for the same thing at the same time, the database decides who goes first so they do not both win.

Isaac had one blessing. Jacob got there first, and Esau came in right after. [[Genesis 27:30]] [[Genesis 27:38]] One blessing, two hands. Abram did it better. When his herds and Lot's herds kept crowding the same land, he split it before anyone fought: [[Genesis 13:8]] [[Genesis 13:9]]

This happened in our own project the day this lesson was built. Two helpers both wanted lesson number eighty-two. The project has a referee: whoever claims a number first wins, and the second claim is refused. But one helper spelled the claim with a dash and the other without one. The referee only checks the exact name, so it saw two different names and let both win. The Bible has a word for that: [[Proverbs 20:10]] One helper stepped back and took eighty-three.

There is another spot like it. Our app sells seats in a workshop. It checks how many seats are left before you pay. It does not check again when the seat is handed out after the payment. So two people could both get the last seat. We wrote that down for Darrell, because he has to decide what the second person is offered.

THE FOURTH PROMISE: IT LASTS. Once the database says done, it stays done, even if the power goes out a second later. It does this by writing a note to lasting storage before it says yes.

Jeremiah did the same with his field: [[Jeremiah 32:10]] Signed, sealed, witnessed. A promise spoken out loud is meant to last too: [[Psalm 15:4]] And Yahweh keeps His own record: [[Malachi 3:16]]

Our app used to keep a learner's reading list only on the phone. Lose the phone, lose the list. Now each reading and each test is saved on the family's own server too. The phone copy is just the fast way to see it.

WHEN DO YOU NEED ALL FOUR? The newsletter was honest that strong promises cost time. The computer has to wait, check and sometimes try again. So you use the strongest ones where a mistake would cost a lot, like money, or a seat that only one person can have. Moses learned this from his father-in-law Jethro. Moses was trying to judge every problem himself, big and small, and he was worn out. Jethro told him to let other leaders handle the small things and bring only the big ones to him: [[Exodus 18:22]] Our app does the same. The money list only ever adds new lines. It never erases one. If there is a mistake, a new line fixes it, so the history stays whole. But the list of lessons you read on your phone is allowed to be a few seconds behind, because the real copy is safe on the server. Big things get the strong promise. Small things get the fast one.

WHY THIS IS ABOUT YOU, NOT ONLY COMPUTERS. Every one of these promises is something people do too. When you say you cleaned your room, did you clean all of it? When you agree to a house rule, do you keep it when nobody checks? When you and your brother both want the front seat, is there a fair way to decide before the fight starts? And when you promise a friend you will be there, will that promise still be standing on Saturday? A computer has to be built to keep these four. A person has to choose to, every day.

JESUS AND THE FOUR PROMISES. On the cross Jesus said: [[John 19:30]] All of it, finished. He came to keep the law, not to break it: [[Matthew 5:17]] And His work lasts forever: [[Hebrews 10:14]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne lasts for ever: [[Hebrews 1:8]]

A STORY ABOUT A GROUP PROJECT. Here is a made-up story to help you think. It did not really happen.

Ana, Ben and Kofi had a science project due Friday. They used one shared document. On Wednesday night Ana and Ben both opened the same section and started typing at once. Ben saved first. Ana saved second, and her version wiped out his whole page without either of them noticing.

On Thursday Kofi read it and asked where Ben's chart went. Ben was upset. Ana felt terrible. Nobody had done anything wrong on purpose. They just both reached for the same page at the same time.

So they made a rule and wrote it at the top of the document: Put your name on a section before you edit it. Take your name off when you are done. They also agreed that a section is not done until all three parts are in - the words, the chart and the source. No half sections marked finished.

On Friday morning Kofi saved a copy of the finished project to a drive and emailed one to the teacher. Ben asked why both. Kofi said, in case one gets lost. The project was turned in whole, on time, and safe.

${FACTS.youth}

FOUR THINGS THIS WEEK. One, finish one thing you left half done, or say out loud that you are stopping. Two, write one family rule where it is used. Three, agree on how to claim one shared thing so two people cannot both win it. Four, keep a copy of one important paper somewhere safe and tell someone where it is.

${TALK.youth}`;
const TEEN = `${TITLE}.

FOUR WAYS A RECORD BREAKS. It stops halfway. It ends up breaking a rule. It collides with somebody else's change. Or it says done and then disappears. Every app you use is built to survive those four, and so is a trustworthy person.

WHO SENT THIS. On October 30, just before eight in the morning Central time, Darrell forwarded an engineering newsletter called Level Up Coding into this lane with one word typed on top: Lesson. That word is the assignment. The article is the occasion, not the foundation.

THE WORD FIRST. Before any tech, two verses. Jesus: [[Matthew 5:37]] Your yes should be a whole yes. Then Jeremiah, buying a field while an enemy army camped outside the walls, was told how to keep the deed: [[Jeremiah 32:14]] Built to outlast the siege. Keep both in view.

WHAT THE ARTICLE TEACHES. A database is the system an app uses to store its records. The article's example is a bank transfer: subtract from one account, add to another, log it. Simple, unless something fails. It names four failures and the four guarantees that answer them. Atomicity, consistency, isolation, durability. ACID.

ATOMICITY: ALL OR NOTHING. A transaction either commits, meaning every step lands, or rolls back, meaning none does. What it refuses is the half-finished state that looks complete.

Joshua is the model: [[Joshua 11:15]] Jesus told the opposite story, the builder who could not finish: [[Luke 14:28]] [[Luke 14:30]]

Here is the sharp version. Ananias and Sapphira sold property and kept back part of the price, which they were allowed to do. Then they presented the part as the whole. [[Acts 5:2]] [[Acts 5:4]] The problem was never the money kept. It was the claim of all. A record that reports a full transfer when half happened is the same move.

And our own app, honestly: when a payment comes in, the server writes the money to the ledger, then hands over the book, seat or membership in a separate request. Two requests means two transactions, not one. If step two fails, there is a moment where the money is recorded and the seat is not. The app recovers by returning an error so the payment company resends the event, and the ledger has a unique key that refuses to count the same event twice. It completes in the end, but it is not atomic, and saying so is part of the lesson. Better an honest no than a broken yes: [[Ecclesiastes 5:5]]

CONSISTENCY: THE RULES STILL HOLD. Every transaction leaves the data valid. Unique keys stay unique. Amounts stay in range. Yahweh gave Israel the same kind of constraint for trade: [[Leviticus 19:35]] [[Leviticus 19:36]] And the weights were never theirs to redefine: [[Proverbs 16:11]]

The article's best line is that the database only enforces rules it knows about. A rule that lives in app code, or in someone's memory, is not enforced where the data is written. The Word makes the same move from stone tablets to hearts: [[Hebrews 8:10]]

Real example from our code: exam scores used to be decided by the phone. A retake that scored lower could overwrite your pass, and a device that forgot an attempt could shrink your attempt count. So the rule was moved into the database. Best score stands, every attempt is logged in order, the count can only go up. Earlier, simply marking a lesson read had wiped a passed exam, because a blank was written over a real score. Same fix: put the rule where the record lives.

ISOLATION: WHEN TWO HANDS REACH AT ONCE. Two transactions touching the same data at the same moment can each look fine and together be wrong. The article's example: one item left, two buyers both see it in stock, both check out, and the store has sold the last item twice.

Genesis has the original version. One blessing, two sons, minutes apart: [[Genesis 27:30]] [[Genesis 27:33]] [[Genesis 27:38]] Abram shows the healthy alternative. When his herds and Lot's kept colliding over the same ground, he drew a line first: [[Genesis 13:6]] [[Genesis 13:8]] [[Genesis 13:9]] That is what isolation does. It also costs something, which the article admits: stronger isolation means more waiting and retrying. Abram paid that cost by giving Lot first pick.

Two isolation stories from this project, both real. First, the day this lesson was built, two builders both claimed lesson number eighty-two, one second apart. The project uses a server-side referee where the first claim wins and any second claim on the same name is refused. It exists because a record number was taken twice the day before it was built. But one builder spelled the claim with a dash and the other without. The referee only compares exact names, so it saw two different claims and accepted both. Two spellings of one number: [[Proverbs 20:10]] One builder backed off and took eighty-three, which is this lesson.

Second, a gap found by reading the code. The workshop store checks seats left at checkout, but the seat is actually written later, after payment, with no recount. The table only knows capacity is above zero. So two buyers who both see one seat left could both be seated. We cannot see the live data from here, so we do not know if it ever happened. It is written up for Darrell with a date, since fixing it means deciding what the second buyer gets.

DURABILITY: DONE MEANS DONE. After the database says committed, a crash one second later cannot undo it. The standard method is a write-ahead log: write the change to lasting storage first, then confirm.

Jeremiah's purchase is a write-ahead log in clay: [[Jeremiah 32:10]] Signed, sealed, witnessed, stored, before the city fell. The Word holds spoken commitments to the same bar: [[Numbers 30:2]] [[Psalm 15:4]] Some writing no one can reverse: [[Esther 8:8]] And Yahweh keeps His own record: [[Malachi 3:16]]

Our app's version: a learner's progress used to live only in the browser on one phone. Lose the phone, lose the record, and nobody else could see it. Now every reading and every exam is saved to a table on the family's own server. The phone copy is just the fast path.

THE TRADEOFF. Strong guarantees cost speed, so use them where failure is expensive. Jethro told Moses to send only the great matters up: [[Exodus 18:22]] Money and seats are great matters. A reading list that is a few seconds behind is a small one.

THE FINISHED WORK. Jesus on the cross: [[John 19:30]] Finished, all of it. He did not break the law to do it: [[Matthew 5:17]] It lasts forever: [[Hebrews 10:14]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] and everything holds together in Him: [[Colossians 1:17]]

A STORY ABOUT A RIDE. Here is a made-up story to help you think. It did not really happen.

Jaden had a car on Saturdays and offered rides to the youth event. He texted Marcus, yes, I can pick you up at six. Ten minutes later, in a different group chat, he told Priya and her sister the same thing. He had four seats and had now promised five. Neither text was a lie when he sent it. Together they were a problem.

At six he pulled up to Marcus's house, did the math, and realized it. He called Priya and told her straight: I double-booked, that is on me. Then he asked his mom if she could take the sisters. She could.

That night he made one shared list in the group chat. Anyone who wanted a ride had to put their name on it, and once four names were there, the list was full. No more side texts.

A week later Marcus asked why he did not just quietly drop someone. Jaden said, because half a promise kept is still a broken one.

${FACTS.teen}

FOUR THINGS THIS WEEK. One, finish one half-done thing or say clearly that you are dropping it. Two, write down one rule that only lives in someone's head, and put it where it is used. Three, set up one fair claim rule for something your friends or family share. Four, back up one thing that matters to a second place, and tell someone where.

${TALK.teen}`;

const SENIOR = `${TITLE}.

THE FOUR QUESTIONS OF A TRUSTWORTHY RECORD. Was the whole of it done? Does it still keep the rules? Did another hand interfere with it? Will it outlast what comes next? A good ledger asks these of every entry, and a faithful life asks them of every promise.

WHO SENT THIS. On the thirtieth of October, a few minutes before eight in the morning, Darrell forwarded an engineering newsletter from his university mailbox into this lane, with a single word typed above it: Lesson. The word is the commission. The article is the occasion; the foundation is the Word.

THE WORD FIRST. Two verses govern the hour. From the Lord Jesus: [[Matthew 5:37]] A yes that means the whole of yes. And from the darkest week of Jerusalem's siege, when Jeremiah was told to buy a field the Babylonians were about to overrun: [[Jeremiah 32:14]] The record was made to outlast the fall of the city.

WHAT THE ARTICLE EXPLAINS. A database is the ledger a program keeps. The article's illustration is a transfer between two accounts: one withdrawal, one deposit, one entry recording it. Four things can go wrong, and the four guarantees that answer them are known together by their initials, ACID: atomicity, consistency, isolation and durability. The writer's best advice is to stop memorising four definitions and remember four failures instead.

ATOMICITY. The whole of a transaction takes effect, or none of it does. There is commit and there is rollback, and nothing respectable in between.

Scripture honours the man who finished: [[Joshua 11:15]] And the Lord warned against beginning what cannot be completed: [[Luke 14:28]] [[Luke 14:29]] But the passage that cuts deepest is in Acts. Ananias and his wife sold land and kept back part of the price. Peter's rebuke makes the point exactly: the land was theirs, the money was theirs, and keeping some was permitted. [[Acts 5:4]] The sin was presenting the part as the whole. A ledger entry that records a completed transfer when only half occurred tells that same lie. The Preacher puts it plainly: [[Ecclesiastes 5:5]]

Our own house deserves the same candour. When a payment arrives, the application records the money in the ledger and then, in a second and separate request, grants the book, seat or membership. Those are two transactions, not one. If the second fails, there is a moment in which the money is recorded and the grant is not. The design recovers soundly: it reports an error so the payment processor sends the event again, and the ledger's unique key refuses to count any event twice. The work completes. But it completes by retrying, not atomically, and a faithful account says so.

CONSISTENCY. Every transaction leaves the data in a valid state, with every rule intact. The Law set constraints of this very kind on Israel's trade: [[Leviticus 19:35]] [[Leviticus 19:36]] And the standard was never Israel's to adjust: [[Proverbs 16:11]]

The article makes an observation worth remembering: the database can enforce only the rules it has been told. A rule that lives in a program elsewhere, or in a person's memory, is not enforced where the entry is made. The new covenant answers the same problem in the human heart: [[Hebrews 8:10]]

This application learned it in practice. Examination results were once settled by the phone, which sent the score and the attempt count, and the record accepted whatever arrived last. A lower retake could overwrite a pass. A device that had forgotten an attempt could reduce the count. The rule was moved into the database itself, where the best score stands, every attempt is kept in order, and the count can never decrease. Earlier still, simply marking a lesson as read had erased an examination already passed, because a blank was written over a real result. Both were corrected by placing the rule where the record lives.

ISOLATION. When two transactions reach for the same thing at once, each may look reasonable and the two together be wrong. The article's example is the last item in stock, read as available by two buyers and sold to both.

Genesis records the original collision. One blessing, two sons, and only moments between them: [[Genesis 27:30]] [[Genesis 27:33]] [[Genesis 27:38]] And it records the wiser course, taken before the quarrel could ripen: [[Genesis 13:6]] [[Genesis 13:8]] [[Genesis 13:9]] Abram separated the herds in advance and accepted the cost of giving Lot the first choice. Isolation always carries such a cost: more waiting, more coordination, less done at once.

Two examples from our house, both measured. On the very morning this lesson was built, two builders each claimed the eighty-second week of this course, one second apart. The project has a referee for such claims, built after a record number was taken twice in a single day: the first claim on a given name wins and any later claim on that name is refused. But one builder wrote the name with a dash and the other without. The referee compares exact names, saw two different claims, and refused neither. The Proverbs anticipated it: [[Proverbs 20:10]] One builder yielded and took the eighty-third week, which is this lesson. The remedy is to give the course one spelling that the tool itself owns.

The second is a gap found by reading the code. The workshop store counts the seats remaining at checkout, but the seat is written afterwards, once payment clears, with no second count. The only capacity rule the table knows is that capacity is greater than zero. Two buyers who each see one seat left could therefore both be seated. The live tables were beyond reach, so whether it has ever happened is unknown. It has been written up for Darrell with a date, because the remedy requires his decision about what the second buyer is offered.

DURABILITY. Once the database has said committed, a failure a moment later cannot undo it. The usual method is the write-ahead log: the change is written to lasting storage before the confirmation is given.

Jeremiah's purchase was exactly that: [[Jeremiah 32:10]] Signed, sealed, witnessed and weighed, then laid in an earthen vessel before the city fell. Scripture holds a spoken commitment to the same standard: [[Numbers 30:2]] [[Psalm 15:4]] It speaks of writing that no one may reverse: [[Esther 8:8]] And it tells us Yahweh keeps a book of His own: [[Malachi 3:16]]

In our house, a learner's progress once lived only in the browser on a single telephone. Lost phone, lost record, and no one else could see it. Now each reading and each examination is written to a table on the household's own server, and the copy on the telephone is kept only as the quick path.

COUNTING THE COST. Strong guarantees cost time and coordination, so they belong where failure is expensive. Jethro gave Moses the principle: [[Exodus 18:22]] Money and a person's seat are great matters. A reading list a few seconds behind is a small one.

THE FINISHED WORK. On the cross the Lord said: [[John 19:30]] The whole of it, complete. He came to fulfil, not to break: [[Matthew 5:17]] His intercession has no rival and no interruption: [[Hebrews 7:25]] And His offering endures: [[Hebrews 10:14]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] and in Him all things hold together: [[Colossians 1:17]] So we pray Moses' prayer over every record we keep: [[Psalm 90:17]]

A STORY ABOUT A DEED. Here is a made-up story to help you think. It did not really happen.

A widower in his eighties kept the deed to the family farm in a drawer in the kitchen, with the receipts for forty years of taxes beside it. Everyone knew it was there. Twice, his sons had asked him to put copies somewhere safer, and twice he had said he would.

One winter a pipe burst over the kitchen while he was in the hospital. The drawer took most of the water. The deed survived, barely readable. Half the receipts did not.

When he came home and saw it, he did not scold anyone. He sat at the table with his granddaughter and her phone, and they photographed every page that could still be read. Then they drove to the county office together and asked for a certified copy of the deed. He put the original in a fireproof box at the bank and told all three children where the key was.

On the drive home he said he had been treating I will as if it were done. It is not done, he said, until it is written somewhere that will still be there when you are not.

${FACTS.senior}

FOUR THINGS THIS WEEK. One, finish one undertaking you have left half done, or say plainly that you are setting it down. Two, write one household rule where it is actually used. Three, settle how one shared thing is claimed, so that two people cannot both be promised it. Four, place one important document where it will survive a lost phone or a flooded drawer, and tell one other person where it is.

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.

WHO SENT THIS. On the thirtieth of October 2026 at 7:54 in the morning Central time, Darrell forwarded a Level Up Coding issue, ACID Clearly Explained, out of his university mailbox with ONE WORD typed above the forwarded header: Lesson. Gmail thread 1a18cd240a3a03eb. His word is the ask; the newsletter is the occasion. The scheduled intake fell behind and it was built by hand on the thirteenth of November.

THE WORD FIRST. Matthew 5:37 opens the hour - let your yea be yea - with Jeremiah 32:14 beside it: the sealed deed put in an earthen vessel, that it may continue many days. Then four movements on the four guarantees: all or nothing (Joshua 11:15; the builder who could not finish; Ananias, who called the part the whole); the rule the record knows (just weights, and the law written where we act, Hebrews 8:10); one blessing and two hands (Genesis 27; Abram and Lot separating before the strife); and committed means committed (Jeremiah 32:10; Numbers 30:2; Psalm 15:4). Then the cost of coordination (Exodus 18:22), and the work that was finished (John 19:30).

OUR OWN HOUSE. Measured in the code, not painted: the money ledger that refuses a negative amount and a doubled event; the payment that is written in two steps and finished by retry, which is honest completion but not atomicity; the exam rules that were moved off the phone into the database; the learner record that once lived on one phone; the number referee that two spellings got past on the morning this lesson was built; and a workshop seat counted at checkout but not when it is given, written up for the Governor with a date.

THE TIERS. ESTABLISHED and stated plainly: the meaning of the four guarantees, and that PostgreSQL keeps them with row versions and a write-ahead log (its manual's host refused our network on the thirteenth). ILLUSTRATIONS, not events: the newsletter's transfer and its last item. NOT MEASURED: the live tables, which were out of this session's reach, so no live count is taught. re-review: 2026-11-27.

LEFT OUT ON PURPOSE. The sponsor's guide to retrieval strategies, the share-and-subscribe lines and the app links are not taught.

PLACEMENT. Sovereign A.I., week 83, because a household that runs its own machines keeps its own records, and owes them the same honesty it owes its word.`,
  inApp: `No new screens this week. One page in your Study, and four small acts of honesty about the state of things.

In the app: open Sovereign A.I. week 83 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each holds the whole teaching. Use Search it out on Jeremiah 32, Genesis 27 and Acts 5 so the three passages sit side by side; the links come from the lesson's own references.

Then look at the record this app keeps of you. Open your Class Record and find an exam you have taken more than once. You will see every attempt kept in order, and the best score standing. That is a rule the database knows, not one the phone remembers.

Away from the app, four exercises. Finish one half-done thing or say you are stopping. Write one house rule where it is used. Agree how one shared thing is claimed. And put one important paper where it will outlast a lost phone.`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Matthew 5:37]] [[Jeremiah 32:14]] [[Joshua 11:15]] [[Acts 5:4]] [[Leviticus 19:36]] [[Hebrews 8:10]] [[Genesis 27:38]] [[Genesis 13:9]] [[Jeremiah 32:10]] [[John 19:30]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them lands on your own house.

First, read Jeremiah 32:6-15 whole. Notice every step Jeremiah takes before he calls the purchase done - weighing, signing, sealing, witnessing, storing - and that all of it happens while the city is under siege. Write one sentence on which of your own important records would not survive a fire, a flood or a lost phone.

Second, read Acts 5:1-11. Find the verse where Peter says the land was theirs to keep. Ask: where have I presented part of something as the whole of it - a chore, a report, a promise?

Third, read Genesis 13:1-12 and then Genesis 27:30-38. One story separates two claimants before the collision; the other does not. Make a list of the shared things in your house that two people sometimes both believe are theirs.

And one verification reading, because this course works this way. The four guarantees are ESTABLISHED engineering and are stated without hedging. The newsletter's transfer and its last item are ILLUSTRATIONS, not events. The app's own code was MEASURED; the live tables were not reachable, so no claim is made about what has happened in them. Practice telling those apart.`,
    plan: `PLAN. Decide four measures before the week starts, and decide who hears them.

One: the half-done thing. Name it, and the day you will either finish it or say plainly you are stopping.

Two: the rule. Name the one house rule that lives only in someone's head, and where it will be written.

Three: the claim. Name the shared thing that gets claimed twice, and the rule that will settle who has it.

Four: the deed. Name the paper, the second place it will be kept, and the person you will tell.

Then name the person who will ask you about all four on the same day next week. A measure nobody asks about is a wish.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.

Finish or close the half-done thing on the day you named. Write the rule where it is used. Agree the claim rule with everyone who shares the thing. Copy the paper and tell your person where it is.

Teach the verse at a meal. Let your yea be yea. Ask a child to say it back in their own words.

At the end of the week, answer three questions to the person who is asking. What did I call finished that was not? Which rule did I find living in only one head? And which record in my house would have been lost tomorrow, and is now safe?

Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over an engineering newsletter, answered from the Word rather than from the article, and built when the intake that missed it was drained.`,
    `The hour opened by Matthew 5:37, so every guarantee a machine makes is heard under the deeper one: a yes that means the whole of yes.`,
    `Jeremiah 32:14 laid down first, so durability is taught as the deed sealed in an earthen jar during a siege.`,
    `Atomicity taught from Joshua, who left nothing undone, and from the builder who began and could not finish.`,
    `Ananias and Sapphira read with care: the part was theirs to keep, and the sin was calling the part the whole.`,
    `Ecclesiastes 5:5 set beside the rollback, so an honest no is honoured above a half-paid yes.`,
    `The app's own payment path traced honestly: two writes finished by retry and a unique key, sound but not atomic, and said so.`,
    `Consistency taught from the just weights of Leviticus 19 and Proverbs 16:11, where the standard is Yahweh's and not ours.`,
    `The newsletter's best line - the database keeps only the rules it knows - set beside Hebrews 8:10, the law written where we act.`,
    `The exam rule that moved off the phone and into the database, so a lower retake can no longer erase a pass.`,
    `Isolation taught from Genesis 27, one blessing and two hands, and Genesis 13, the separation that came before the strife.`,
    `A real collision from the morning this lesson was built: two spellings of one week number, and a referee that could see only names.`,
    `Proverbs 20:10 applied to it: one number, two measures.`,
    `A workshop seat gap found by reading the code, written up for the Governor with a date instead of patched in silence.`,
    `Durability taught from Jeremiah 32:10, Numbers 30:2, Psalm 15:4, Esther 8:8 and Malachi 3:16.`,
    `The learner record that once lived on one phone, and now lives where it can be kept and seen.`,
    `Exodus 18:22 used to teach where strong guarantees belong: the great matters, not every matter.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, whose finished work fails none of the four.`,
    `The established, the illustrative and the unmeasured told apart in every reader place, with a dated re-review.`,
    `No live count taught from a database that is only a mirror.`,
    `All four age bands carried from the first commit, each written for its own reader.`,
    `Four household actions that cost nothing: finish or close, write the rule, settle the claim, keep the deed.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The envelope marked paid',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A small church kept its building fund in a ledger book and a bank account, and an older deacon had done the deposits for twenty years. One Sunday he counted the offering, wrote the total in the ledger, marked the envelope paid, and set it in his coat to take to the bank on Monday.

On Monday his grandson was taken to the hospital, and the envelope stayed in the coat for nine days.

The treasurer's report that month showed the money in the fund. The bank did not. For a week, two careful people each believed the other had made a mistake.

When the deacon came back and found the envelope, he did not hide it. He stood up at the next meeting, told the whole story, and asked for one change: the ledger would not be written until the deposit slip was in hand. Write it when it is done, he said, not when you mean to do it.

They have kept that rule since. Nobody has had to stand up again.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The two keys to one room',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A church fellowship hall had one paper calendar on the kitchen wall and two people who took bookings: the pastor's assistant on weekdays and a retired teacher on weekends. Each kept the calendar faithfully. Each wrote in pencil when someone called.

One spring both of them said yes to the same Saturday - a baby shower and a funeral lunch. Each had checked the calendar first. Each had found it empty, because the other's yes was still on a sticky note waiting to be copied.

The funeral family got the hall. The shower moved to a home at short notice, and the young mother cried.

Afterward the two bookers did not argue about whose fault it was. They agreed on one rule: no yes over the phone until the name is written on the wall calendar, in ink. If you cannot get to the wall, you say I will call you back.

It slowed them down a little. It has not happened again.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'What do the four letters of ACID stand for?',
        options: ['Accuracy, Control, Integrity, Delivery', 'Atomicity, Consistency, Isolation, Durability', 'Access, Copy, Index, Data'],
        answer: 1,
        explain: 'Each answers one failure: stopping halfway, breaking a rule, colliding with another change, and losing work after it was confirmed.',
      },
      {
        q: 'In Acts 5:4, what does Peter say about the land Ananias sold?',
        options: [
          'That he was required to give all of it',
          'That it was his to keep, and the lie was presenting part as the whole',
          'That selling land was forbidden',
        ],
        answer: 1,
        explain:
          'Keeping part was allowed. Calling the part the whole was the sin. That is the failure atomicity exists to prevent: a record that claims all when only part took place.',
      },
      {
        q: 'Why does this lesson say the app’s payment path is not atomic?',
        options: [
          'Because it never records the money',
          'Because the money and the seat are written in two separate requests, and the second is finished by retry rather than in one transaction',
          'Because it records every payment twice',
        ],
        answer: 1,
        explain:
          'The ledger’s unique key refuses to count an event twice, so the retry completes the work safely. It is sound, but it is eventual completion, and saying so is the honest account.',
      },
      {
        q: 'What does the newsletter mean when it says the database can only enforce the rules it knows about?',
        options: [
          'That rules should be kept secret',
          'That a rule living only in the program or in someone’s head is not enforced where the record is written',
          'That databases have no rules',
        ],
        answer: 1,
        explain: 'Hebrews 8:10 makes the same move in the heart: the law written where the act happens is the one that is kept.',
      },
      {
        q: 'What changed when the app moved the exam rule into the database?',
        options: [
          'Scores are now hidden',
          'The best score stands, every attempt is kept in order, and the attempt count can never go down',
          'Only the first attempt counts',
        ],
        answer: 1,
        explain: 'Before, the phone decided, and a lower retake could overwrite a pass. Now the rule lives where the record lives.',
      },
      {
        q: 'Which Bible story shows two claimants reaching for one thing moments apart?',
        options: ['Genesis 27, Isaac’s one blessing and his two sons', 'Genesis 1, the creation', 'Exodus 20, the commandments'],
        answer: 0,
        explain:
          'Jacob was scarcely gone out when Esau came in. One blessing, two hands. Genesis 13 shows the better way: Abram separated the herds before the strife.',
      },
      {
        q: 'Why did two builders both win the claim on week eighty-two?',
        options: [
          'Because the referee was turned off',
          'Because one spelled the claim with a dash and one without, and the referee compares exact names only',
          'Because both builders were the same person',
        ],
        answer: 1,
        explain:
          'Two spellings of one number looked like two different things. Proverbs 20:10 calls divers measures an abomination. The fix is one spelling the tool itself owns.',
      },
      {
        q: 'What gap did reading the workshop code find?',
        options: [
          'Seats are counted at checkout but not again when the seat is given after payment, so two buyers could both get the last seat',
          'Workshops cannot be sold at all',
          'Every seat is free',
        ],
        answer: 0,
        explain:
          'It is the newsletter’s last item in our own store. The live tables were out of reach, so nobody can say whether it has happened. It is written up for the Governor, because the fix needs his decision about what the second buyer is offered.',
      },
      {
        q: 'How does Jeremiah 32:10-14 picture durability?',
        options: [
          'He kept the deal in his memory',
          'He signed, sealed, witnessed and weighed, then stored the deed in an earthen vessel so it would last through the siege',
          'He burned the deed',
        ],
        answer: 1,
        explain: 'Write it down on lasting storage before you call it done. A database’s write-ahead log does the same.',
      },
      {
        q: 'What does Exodus 18:22 teach about where strong guarantees belong?',
        options: [
          'Every matter should go to the highest court',
          'The great matters go up and the small ones are judged nearer at hand, so strong guarantees belong where failure is costly',
          'No matter needs judging',
        ],
        answer: 1,
        explain: 'Money and a person’s seat are great matters. A reading list a few seconds behind is a small one.',
      },
      {
        q: 'Which of these does this lesson state as established fact?',
        options: [
          'That a seat in the app has already been sold twice',
          'That PostgreSQL keeps its guarantees with row versions and a write-ahead log',
          'That the newsletter’s five-thousand-dollar transfer really happened',
        ],
        answer: 1,
        explain:
          'The engineering is established. The transfer is an illustration. Whether a seat was ever double sold is unknown, because the live tables were out of reach. re-review: 2026-11-27.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Matthew 5:37 aloud before you say one word about any computer. Then read Jeremiah 32:14 aloud. Then ask the room one question and wait: what promise has someone kept to you that you still remember?

MINUTES 0 TO 10 - THE NEWSLETTER IN ONE PICTURE. Describe the transfer between two accounts and the four ways it can fail. Write the four failures on the board, not the four definitions. Then name the guarantees.

MINUTES 10 TO 22 - ALL OR NOTHING. Joshua 11:15, Luke 14:28-30, Acts 5:1-4, Ecclesiastes 5:5. Make the Ananias point carefully: keeping part was allowed; calling the part the whole was the lie. Then show the app's payment path honestly: two writes, finished by retry, sound but not atomic.

MINUTES 22 TO 32 - THE RULE THE RECORD KNOWS. Leviticus 19:35-36, Proverbs 16:11, Hebrews 8:10. Tell how the exam rule moved off the phone and into the database.

MINUTES 32 TO 44 - ONE BLESSING, TWO HANDS. Genesis 27:30, 33 and 38, then Genesis 13:6-9, then Proverbs 20:10. Tell the week-number collision and the workshop seat gap. Say plainly that the live tables were not reachable, so nobody knows whether a seat was ever double sold.

MINUTES 44 TO 52 - COMMITTED MEANS COMMITTED. Jeremiah 32:10, Numbers 30:2, Psalm 15:4, Esther 8:8, Malachi 3:16. Tell how the learner record left the phone.

MINUTES 52 TO 60 - COUNT THE COST, AND THE FINISHED WORK. Exodus 18:22, then John 19:30, Matthew 5:17, Hebrews 7:25, Hebrews 10:14, John 1:29, John 3:16, Hebrews 1:8, Colossians 1:17, Psalm 90:17. Give the four household actions and close with the talk-together directions.

WHAT NOT TO DO. Do not turn this into a database seminar; the room needs the Word and an honest habit. Do not stage the strong-or-fast tradeoff as two camps for the room to pick between; teach Exodus 18:22 and work it (DR-0098). Do not hedge the established engineering into nobody-knows (DR-0100). And do not say a seat has been sold twice; that is not known.`,
    talkingPoints: [
      `A yes that means the whole of yes is the first guarantee, and Jesus gave it (Matthew 5:37).`,
      `Jeremiah's deed was signed, sealed, witnessed and stored in clay during a siege, so that it would continue many days (Jeremiah 32:10, 14).`,
      `ACID is four failures before it is four definitions: halfway, invalid, colliding, lost.`,
      `Atomicity: commit or rollback, never the half-done thing that looks finished.`,
      `Joshua left nothing undone (Joshua 11:15).`,
      `The builder who could not finish became a public mockery (Luke 14:28-30).`,
      `Ananias could keep part. He could not call the part the whole (Acts 5:4).`,
      `Better an honest no than a yes left half paid (Ecclesiastes 5:5).`,
      `Our payment path writes money and seat in two requests and finishes by retry: sound, not atomic, and said so.`,
      `Consistency: every rule still holds when the work is done.`,
      `The weights in the bag are Yahweh's (Proverbs 16:11).`,
      `The database keeps only the rules it knows; Yahweh writes His where we act (Hebrews 8:10).`,
      `The exam rule moved off the phone: the best score stands and the count never shrinks.`,
      `Isolation: two right steps can make one wrong result when they touch the same thing.`,
      `One blessing, two sons, moments apart (Genesis 27:30-38).`,
      `Abram separated the herds before the strife, and paid for peace with the first choice (Genesis 13:8-9).`,
      `Two spellings of one week number got past a referee that compares names: divers measures (Proverbs 20:10).`,
      `A workshop seat counted at checkout and not at the moment it is given is the last item sold twice, in our own store.`,
      `Durability: write it down to lasting storage, then say done.`,
      `A vow is kept even when it costs (Numbers 30:2; Psalm 15:4).`,
      `The learner record left the phone for the household's own server.`,
      `Strong guarantees belong to the great matters (Exodus 18:22).`,
      `Jesus is the Lamb of Yahweh and the Eternal Son, and His work is finished, lawful and for ever (John 19:30; Hebrews 10:14).`,
    ],
    discussionPrompts: [
      `What is something you called finished that was really only half done? What did it cost?`,
      `Which rule in your house lives only in one person's head?`,
      `When have two people in your family both been promised the same thing? How was it settled?`,
      `Which of your important papers would not survive a flood, a fire or a lost phone?`,
      `Where in your life is speed worth a little risk, and where is it not?`,
      `What promise has someone kept to you at a cost, and how did it change how you trust them?`,
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
console.log(`sov83: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov83: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov83: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov83: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov83: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov83: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov83: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov83: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov83: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov83: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov83: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov83: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov83: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov83: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov83: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov83: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov83: spliced ${ID}`);
console.log(`sov83: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov83: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
