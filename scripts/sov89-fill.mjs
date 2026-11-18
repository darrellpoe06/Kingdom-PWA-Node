// =============================================================================
// sov89-fill - build Sovereign A.I. week 89 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[Jeremiah 36:28]],
// and this script replaces it with the corpus text followed by the reference.
// No verse on the page was typed from memory. anchor.ref is DERIVED from the
// placeholders that actually occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. Level Up Coding, Redis vs Memcached, dated Monday
// 2026-11-16, forwarded by Darrell into the lesson lane with ONE WORD typed
// above it: Lesson. Gmail thread `1a1e43310d023259`. Built 2026-11-18. The
// sponsor block (capacity planning with A.I. agents) and the share lines are
// left out, so one forward stays one teaching. One teaching, one lesson
// (DR-0610): no lesson in app/src/lib or docs/decisions was built on caching,
// Redis or Memcached before this one.
//
// PLACEMENT. A technical forward, so a Sovereign A.I. week (the route sov88
// took for a ByteByteGo forward), not a per-file Living Lesson.
//
// WORD FIRST (DR-0127 / DR-0282). Genesis 41:35-36 - the store laid up in the
// cities - and Jeremiah 36:28 - the roll burned and written again from the
// source - frame the hour before a single word about a cache.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). ESTABLISHED: a cache is a
// near copy and never the record; both tools are real. REPORTED (the
// newsletter): each tool's limits and defaults; redis.io, memcached.org and
// valkey.io were outside the session network. MEASURED on 2026-11-18, file:line
// in the DR: infra/nas-immich/docker-compose.yml:53-56 (Valkey 9, no maxmemory,
// no policy, no volume), :17-20 (the photos are files); infra/nas-research/
// searxng.seed.yml:17-19 (limiter off, no valkey); app/public/sw.js:19, :150-161
// (per-build Cache Storage, deleted on activate save poetech-keep-*);
// app/src/lib/clip-cache.js:18-19, :27, :50-57, :247, :323-329 (IndexedDB,
// least recently played over a 300 MB cap, pinned downloads, two in flight).
// NOT VERIFIED: what Immich keeps in Valkey (docs.immich.app refused). NOT
// MEASURED: that store's memory use on the NAS.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 89;
const ID = 'sov89-take-thee-again-another-roll';
const TITLE =
  'Take thee again another roll - the store laid up near the city, the copy that may be burned and written again, and the caches our own house runs';

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
  if (!m) throw new Error(`sov89: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov89: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov89: reference does not resolve in the corpus -> "${ref}"`);
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
    "WHERE WE STAND ON THE FACTS. ESTABLISHED, and stated plainly: a cache is a fast copy kept close to the one who reads it; the copy is not the record; checking the near copy first and fetching from the source on a miss is an ordinary, settled pattern; and Redis and Memcached are real, open, widely used stores that keep data in memory. REPORTED, by the Level Up Coding newsletter of the sixteenth of November: the particular figures and behaviors it gives - Memcached's key and value limits, its three-tier way of choosing what to drop, Redis's default of refusing new writes when memory is full, and Redis copying writes to its replicas after it has already answered. They are taught as the newsletter gives them; the projects' own manuals were not opened for this hour, because their sites were outside our network when we asked. MEASURED in our own house: every claim below about what this app and our NAS keep in memory is traced to the file that does it. NOT VERIFIED: what the photo server stores in the one Redis-family store our NAS runs, and that store's own defaults, because the documentation sites refused our network on the eighteenth. NOT MEASURED: how much memory that store uses on the NAS today; no reading was taken, and no number is guessed for it. re-review: 2026-12-18.",
  child:
    'WHAT IS SURE AND WHAT IS NOT. A cache is a copy kept close by. That is sure. The two tools in the email are real. Some facts about them came only from the email. We took the email at its word. We read our own app to see what it keeps. We could not read the photo program’s own help pages. So we do not say what it keeps in its store. We did not count how full that store is. We will look again. re-review: 2026-12-18.',
  youth:
    'WHAT IS SURE AND WHAT IS NOT. Keeping a quick copy close to the reader is normal, well-known work. Both tools in the newsletter are real, and many companies use them. The exact numbers and rules about each tool came from the newsletter. We teach them the way it said them. We did not open the tools’ own manuals, because our network could not reach their websites. Everything we say about our own app was checked against its code. What the photo program keeps in its store could not be checked. How full that store is was not counted. re-review: 2026-12-18.',
  teen: 'WHAT IS SURE AND WHAT IS NOT. Know what kind of claim each one is. Established: a cache is a near copy, and both tools are real. Reported: the limits and default rules for each tool are the newsletter’s, taught as given. Measured: our own app and NAS, file by file. Not verified: what the photo server keeps in its store, since its help site was blocked from our network. Not measured: how much memory that store uses. re-review: 2026-12-18.',
  senior:
    'WHERE WE STAND ON THE FACTS. That a cache is a near copy and never the record, and that Redis and Memcached are real and widely used, is established and is stated without hedging. The particular limits and defaults the newsletter gives for each are its own, reported as given; the projects’ documentation sites were outside our network on the eighteenth of November and were not consulted. Every statement about this application and our NAS is traced to the file that makes it true. What the photo server keeps in its store has not been verified, and the memory that store uses has not been measured; no figure is offered for either. re-review: 2026-12-18.',
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - if our house burned tonight, what is the one paper or picture we could never get back - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Jeremiah 36:28. Children, ask your mother, your father or a grandparent about a time they lost something written down - a phone, an address book, a letter - and how much of it they were able to find again from somewhere else; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what do we keep close for quick use, and where is the copy that cannot be lost. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - what do we keep by the door so we do not have to hunt for it - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Genesis 41:36. Children, ask your mom or your dad or your grandma or your grandpa about the best thing they ever saved up for a hard day. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what would you grab first if you had to run. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when your phone is full, how do you choose what to delete - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Exodus 16:21. Children, ask your mom, your dad or a grandparent about a time a whole crowd wanted the same thing at once, and what happened at the counter; hear the whole of it before you answer; then retell their answer in your own words. Then ask a friend this: what do we both keep that is only a copy, and where is the real one. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what in your life is saved in only one place - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Exodus 16:33. Children, ask your mom, your dad or a grandparent about a time they lost work they had not saved, and what they did differently after; hear all of it, the whole of it, before you reply; then retell their answer in your own words. Then ask a friend this: when two of us change the same thing at once, whose change wins, and is that fair. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - which of our family's records would be hard to rebuild if they were lost - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Isaiah 40:8. Children, ask your parents or your grandparents about the family Bible, the deed, the old letters - where they are kept and who else holds a copy; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: what do we each keep close for quick use, and what have we laid up where it will last. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no detail from the newsletter stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On Monday the sixteenth of November 2026 a short engineering newsletter, Level Up Coding, set two tools side by side: Redis and Memcached. Darrell forwarded it into this lane with ONE WORD typed above it: Lesson. That word is the ask; the newsletter is only the occasion. It was built on the eighteenth.

THE WORD FIRST, BEFORE ANY MACHINE. Two passages frame this hour. The first is a store laid up near the people. When Pharaoh dreamed of seven fat years and seven lean ones, Joseph told him what to do with the plenty: [[Genesis 41:35]] [[Genesis 41:36]] The grain was kept in the cities, close to the mouths it would feed, so that nobody had to walk back to the field in the famine.

The second is a copy that was burned. Jeremiah's words had been written on a roll by Baruch, and when the king heard them read, he cut the roll and threw it on the fire. Then: [[Jeremiah 36:28]] The roll was gone. The words were not, because the roll was never the source. The source was the Word of Yahweh, and a new roll was written from it, with more besides: [[Jeremiah 36:32]] Keep the copy near; never mistake it for the source. That is the whole of what a cache is: a store kept near the one who needs it, and never the record. Then hear the article.`,

  `WHAT THE NEWSLETTER TEACHES. A cache keeps data in fast memory so that the next request does not have to go all the way back to the database. The newsletter's first example: an app caches a person's profile under a key such as user 42. It checks the cache first; on a miss it reads the database, and then keeps a copy in the cache for next time. That is called cache-aside, and both tools serve it. The difference is in what each will carry for you, what it does when memory runs out, and what it does when a whole server falls.`,

  FACTS.lesson,

  `MOVEMENT ONE: THE STORE IN THE CITIES. Joseph did not keep one great granary at the palace. [[Genesis 41:48]] The food of each field was laid up in the city round about it. Engineers call that locality, and it is the whole point of a cache: the copy lives where the reading happens.

Memcached, as the newsletter reports it, keeps that idea simple. It stores a key and a value, and it treats every value as plain bytes; it does not know what is inside. Keys may be up to two hundred and fifty bytes and values up to one megabyte by default. That suits a value you read whole and replace whole. To change one field inside it, your program must fetch the whole thing, change it and write it all back.`,

  `MOVEMENT TWO: TWO HANDS ON ONE TALLY. Picture a game's scoreboard kept as one value in Memcached. To add fifty points to a player, the program fetches the board, unpacks it, adds, and writes it all back. If two servers do that at once, each starts from the same old board, and whichever writes second erases the other's points. Memcached offers a guard called compare-and-swap - write only if nobody has changed it since I read it, and try again if they have - but the program must use it and handle the retries.

Redis, the newsletter says, can keep the board as a sorted set, and one command raises one player's score in place, at once, without reading or rewriting the rest. It has several shapes it can change in place: simple values and counters, hashes whose single fields can be read or set, lists and streams for queues and events, and sets and sorted sets for membership and rank.

The Word asks the same of a steward: [[Proverbs 27:23]] Know the true state, not the state you read before someone else changed it. A count that two hands can overwrite is not known. Whatever tool keeps it, a faithful tally changes in one place, by one rule, every time: [[1 Corinthians 4:2]]`,

  `MOVEMENT THREE: WHEN THE STOREHOUSE IS FULL. Every cache has a limit. The newsletter's sharpest point is what happens at that limit, and the manna teaches it first. [[Exodus 16:19]] Some kept it anyway, and it spoiled: [[Exodus 16:20]] It was gathered fresh each morning, and what was left out melted: [[Exodus 16:21]] That is an expiry time, written into the food. Yet one portion was kept on purpose, by command, and did not spoil: [[Exodus 16:23]] [[Exodus 16:24]] Most of the store was meant to pass; a marked portion was meant to stay.

Memcached, as reported, makes room by itself. It drops older or less used items first, sorting them into three tiers - hot for the newly added, warm to protect what is often read, and cold for what is idle and goes first - so one rare request cannot push out the daily bread. Redis lets you choose. You set a memory limit and a rule: drop the least recently used, the least often used, a random key, or the one nearest its expiry. But its default is to drop nothing. Once the limit is reached, writes that need more memory are refused, and some rules only ever drop keys that were given an expiry time.

There is a third answer, and the Word warns against it: [[Luke 12:18]] Bigger barns is not a policy; it is a postponement. The wise builder sits down and counts first: [[Luke 14:28]] Decide what may go before the store is full, and mark what must stay.`,

  `MOVEMENT FOUR: WHEN THE ROLL IS BURNED. Now the server falls. In Memcached, the newsletter says, the data on a failed node is simply gone; there is no built-in copy and no automatic failover. If the database is still the source of truth, the program fetches it again. That is Jeremiah's roll: [[Jeremiah 36:23]] And yet: [[Jeremiah 36:27]] The source was untouched, so the copy could be rebuilt.

But rebuilding has a cost. When a value everyone reads disappears at the busiest hour, thousands of requests miss at once and all run to the database together. Engineers call it a stampede, or the thundering herd, and it can bring down the very source the cache was protecting. The famine shows the shape: [[Genesis 41:57]] Every land came to one door. Joseph did not throw the storehouses open to a crowd; he opened them and sold in order: [[Genesis 41:56]] The newsletter's remedies are the same order: warm the store before the rush, let one request rebuild a missing value while the others wait, or serve the slightly old copy while a fresh one is made. Memcached's newer protocol can tell one client to rebuild while the rest hold back.

Redis can write its data to disk - by a snapshot from time to time, or by a log of every write - and copy it to other servers, with watchers that promote a replica when the main one fails. But, as the newsletter says plainly, this does not promise that every write survives. Redis answers the writer first and copies to its replicas after; if the main server falls in between, the replica that takes over may never have seen that write. So the newsletter ends where the Word began: keep a lasting record somewhere built to last, because neither cache promises it.

The Word shows such a record too. Not all the manna was meant to pass: [[Exodus 16:32]] [[Exodus 16:33]] One measure, laid up on purpose, in the one place built to keep it. And above every record men keep stands the one that cannot be lost: [[Matthew 24:35]]`,

  `MOVEMENT FIVE: OUR OWN HOUSE, MEASURED. Each claim here is traced to the file that does it.

First, the plain answer. This app does not run Redis, and it does not run Memcached. None of our own services on the NAS - the voice, the lessons, the finances, the taxes - uses either one. No Memcached appears anywhere in our code.

One Redis-family store does run on our NAS. The photo-backup server we brought home, Immich, ships with Valkey, a store that began as a copy of Redis, and our compose file for it runs Valkey version nine in a container named redis, beside the photo server and its database. That file sets no memory limit, no rule for what to drop, and names no disk for it to keep anything on; it runs as the release made it. What Immich keeps there could not be verified from its own pages this week, and how full it is was not measured. What is plain from the file is where the record lives: the photos are folders of files on the storage pool, and their catalogue is a Postgres database on disk. The file's own words say that if every container is removed, the photos are still a folder of files. The store is the near copy; the pool is the record.

The house also declined a store. Our private search engine has a limiter that needs a Valkey, and its settings say plainly that we do not run one and have no public traffic to limit, so the limiter is off.

The app keeps two caches of its own, both on the device. The first is the service worker's store, which keeps the app's files so it opens with no connection. Each build gets its own store by name, and when a new build takes over, every older store is deleted, save the few marked to be kept across builds. That store is disposable by design: it is burned every build and written again from the source.

The second is the voice clip store. Every sentence the NAS voice reads aloud is kept on the device, keyed by the voice, the model and the exact words, so a replay never asks the NAS again. It is checked first, filled on a miss - cache-aside, exactly as the newsletter drew it. When it passes its cap, three hundred megabytes unless the listener picks more, the least recently played clips go first. Clips that belong to a download are held and never dropped: the omer laid up. And it learned the herd lesson the hard way. The reader once asked the NAS voice for three clips at a time; the voice serves two, so the third was refused as busy and the listener heard the pause. Now the app asks for exactly two, and a test holds the two numbers together.

So our caches carry the right load. Each holds a copy we can rebuild, and none is asked to be the record.`,

  `MOVEMENT SIX: THE SOURCE THAT IS NEVER LOST. Every store in this hour is a copy, and every copy can fail. One source does not: [[Isaiah 40:8]] He who gave the Word is the same in every hour: [[Hebrews 13:8]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] and by Him all things hold together: [[Colossians 1:17]] Keep your copies near and your records lasting, and keep your heart on the source.`,

  `FOUR THINGS THIS WEEK, and none of them needs a purchase.

One, name your source. For every list your family depends on - phone numbers, medicines, accounts, prayer requests - say where the true one lives.

Two, keep a near copy. Put the medicines list on the refrigerator and the numbers in the car.

Three, choose what goes when it is full. Before the closet, the phone or the calendar overflows, decide the rule - oldest first, least used first - and mark what may never be dropped.

Four, lay up one record to last. The will, the deed, the family Bible, the story of how you came to Christ: put one in a place built to keep it, and give one trusted person a second copy.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that one tool is better, or that every house needs either. The point is the right load on each store: copies kept near, rules for the full day, and the record laid up where it lasts.`,

  TALK.lesson,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader, not a
// re-registering of the adult text, and each carries the whole teaching, the
// tiers and the talk-together close (DR-0795).
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

KEEP IT CLOSE, AND KNOW WHERE IT CAME FROM. This lesson is about keeping things close by. It is about what to do when there is no more room. And it is about the one thing that can never be lost.

WHO SENT THIS. Darrell got an email. It was about computers. He wrote one word on top. The word was Lesson. Then he sent it to us. That one word is why you are reading this.

THE WORD FIRST. Long ago, a king had a dream. Joseph told him what it meant. There would be seven good years with lots of food. Then there would be seven hard years with no food. So Joseph said, save food now. Keep it in the towns. [[Genesis 41:35]] [[Genesis 41:36]]

The food was kept in each town. So people did not have to walk far to get it. It was close by when they needed it.

AND ONE MORE STORY. A man named Jeremiah had words from Yahweh. His helper wrote them on a long paper roll. A bad king cut up the roll. He threw it in the fire. It all burned up! But Yahweh told Jeremiah to write it all again. [[Jeremiah 36:28]]

The paper burned. The words did not. The words came from Yahweh, and He still had every one.

WHAT THE EMAIL SAID. Computers keep lots of facts. Some facts are kept far away in a big safe place. It takes time to go get them. So computers keep a copy close by too. The close copy is called a cache. You say it like the word cash. When the computer needs a fact, it looks in the cache first. If the fact is there, that is fast! If not, it goes to the safe place. Then it keeps a copy in the cache for next time.

The email told about two cache tools. One is called Memcached. One is called Redis. Both keep copies close by. But they act in different ways.

CLOSE TO HOME. Joseph kept the food from each field in the town next to it. [[Genesis 41:48]] That is what a cache does. It keeps the copy right where it will be used.

Memcached is simple. It keeps each thing like a closed box. To change one thing in the box, you take out the whole box. You fix it. Then you put the whole box back.

TWO KIDS, ONE SCORE CARD. Two kids keep score on one card. Both read the card. It says ten. Both add five. Both write fifteen. But it should be twenty! One kid's points got lost. Redis can add points right on the card, one at a time, so none get lost. Yahweh wants us to know how things really are. [[Proverbs 27:23]]

WHEN THERE IS NO MORE ROOM. A cache can get full. Then what? Think of the manna. Manna was food from heaven. Moses said, do not keep it for the next day. [[Exodus 16:19]] Some kept it anyway. It got bugs and smelled bad! [[Exodus 16:20]] Each day the old manna was gone, and new manna came.

But one day each week was different. On that day they kept some for the next day, and it stayed good. [[Exodus 16:24]] Most of it went away. A little was kept on purpose.

Memcached makes room by itself. It lets go of old things that nobody used for a while. Redis waits for you to choose. If you do not choose, it says no to new things when it is full.

A rich man in a story Jesus told had too much stuff. He said, I will tear down my barns and build bigger ones. [[Luke 12:18]] That is not a plan. It is just putting off the choice.

WHEN IT ALL GOES DARK. Sometimes a computer stops. Then its cache is gone, like the burned roll. But if the real facts are safe, the computer can get them again. That is OK. But if lots of people ask at the same time, the safe place can get too busy. In Joseph's day, people from every land came for food. [[Genesis 41:57]] Joseph opened the storehouses and sold the food in good order. [[Genesis 41:56]]

Some things must never be lost. Moses kept one jar of manna on purpose, in a safe place, for a very long time. [[Exodus 16:33]]

OUR APP. Our app does not use Memcached. It does not use Redis. But our big home computer, the NAS, runs a photo helper. It keeps a store a lot like Redis. The real photos are kept as files. The store is just the close copy.

Our app keeps two caches of its own. One keeps the app's own parts, so it can open with no internet. The other keeps the voice that reads lessons out loud. When it gets full, the oldest sounds go first. Sounds you saved to keep are never thrown out.

A STORY ABOUT A FRIDGE LIST. Here is a made-up story. It did not really happen.

Nana kept a list of Pop's pills in her purse. One day the purse was lost. Nobody knew which pills Pop took! They had to call the doctor. The doctor had the real list. So Nana made a new plan. She put a copy on the fridge. She put a copy in the car. And she knew the real list was at the doctor's office. Now if one copy is lost, that is OK.

WHAT THIS MEANS FOR YOU. You keep copies too. Maybe you have a picture of Grandma on your wall. The real Grandma is not in the picture! The picture is a copy. It helps you think of her. If it gets lost, she is still there. Copies are good. Just know where the real thing is.

THE WORD LASTS. Grass dries up. Flowers fade. But Yahweh's Word stands forever. [[Isaiah 40:8]] Jesus is the same yesterday, today and forever. [[Hebrews 13:8]] He is the Lamb of Yahweh. [[John 1:29]]

${FACTS.child}

FOUR THINGS THIS WEEK. One, find where the real list lives. Two, keep a copy close by. Three, pick what to throw out when a drawer is full. Four, keep one special thing in a safe place.

${TALK.child}`;

const YOUTH = `${TITLE}.

THE QUESTION. Why does your phone keep copies of things, and what happens when the copy is gone? This lesson answers from the Word first. Then it looks at a newsletter about two computer tools. Then it looks at what our own app keeps.

WHERE IT CAME FROM. A newsletter about building software arrived on the sixteenth of November. Darrell sent it on with one word typed above it: Lesson. His word is the reason this exists. The newsletter is only what got us talking. It was built two days later.

TWO PASSAGES TO START. First, Joseph. Pharaoh had a dream. It showed seven years of plenty. Then it showed seven years of hunger. Joseph told him to save food during the good years and keep it in the cities: [[Genesis 41:35]] [[Genesis 41:36]] The food was stored near the people who would need it. Nobody had to travel back to the fields when the hunger came.

Second, Jeremiah. His words from Yahweh were written on a scroll. The king cut the scroll into pieces and burned it. Then Yahweh spoke again: [[Jeremiah 36:28]] The scroll was ashes. But the message was safe. It had never lived in the scroll. It came from Yahweh, and He wrote it again.

Hold both ideas. A copy kept close is a gift. But a copy is never the source.

WHAT A CACHE IS. Apps keep their real information in a database. It is safe, but it is slow to reach. So they also keep quick copies in fast memory. That quick copy is a cache. The app checks the cache first. If the answer is there, great. If not, it goes to the database, gets the answer, and saves a copy in the cache. The newsletter calls this cache-aside.

The newsletter compares two tools that do this: Memcached and Redis.

NEAR THE PEOPLE. Joseph kept the food from each field in the city right next to it: [[Genesis 41:48]] Programmers call that locality. Keep the copy where it gets used.

Memcached keeps things simple. It stores a name and a value, and it does not look inside the value. Do you want to change one detail? Then you must pull out the whole value. You change it. Then you put it all back.

TWO PEOPLE, ONE SCORE. Imagine a game scoreboard saved as one value. Two servers both want to add points. Both read the old score. Both add. Both save. The second save wipes out the first one's points. Memcached has a tool to catch this. But the app has to use it. And it has to try again when it fails. Redis can add points to one player right where the score is kept. It takes one step. Nothing is lost. The Word asks us to know the real state of what we keep: [[Proverbs 27:23]]

WHEN MEMORY RUNS OUT. Every cache has a limit. Look at the manna in the desert. Moses told the people not to save any for the next morning: [[Exodus 16:19]] Some did anyway, and it rotted: [[Exodus 16:20]] It was gathered each morning, and what was left in the sun melted away: [[Exodus 16:21]] That is like a timer on each item. But before the day of rest, they were told to keep some, and it stayed fresh: [[Exodus 16:24]]

Memcached clears space on its own. It sorts items into hot, warm and cold. Cold items, the ones nobody has touched in a while, go first. Redis lets you pick the rule. But what if you never pick? Then it will not save anything new once memory is full.

Jesus told about a rich man whose barns were too small. His answer was to build bigger ones: [[Luke 12:18]] Bigger barns only delay the choice. Jesus also said to sit down and count the cost first: [[Luke 14:28]]

WHEN A SERVER CRASHES. Say a Memcached server stops. Its data is gone. That is fine if the database still has the real copy. But here is the danger. When a popular item vanishes, thousands of requests rush to the database at once. That is called a thundering herd. In the famine, every country came to Egypt at the same time: [[Genesis 41:57]] Joseph did not let it turn into a riot. He opened the storehouses and sold in order: [[Genesis 41:56]] Apps do the same. They let one request rebuild the missing copy while the others wait.

Redis can save to disk. It can copy itself to backup servers too. But the newsletter gives a warning. Redis says done before the backup has the copy. What if the main server crashes right then? That write can be lost. So the really important records belong in a database built to last. Moses kept a jar of manna on purpose, before the LORD, for the generations to come: [[Exodus 16:33]]

WHAT OUR APP KEEPS. Here is the honest answer. Our app does not use Redis or Memcached, and neither do our own programs on the NAS. One store like Redis does run there. It is called Valkey, and it came with the photo backup program. Our setup file gives it no memory limit. It gives no rule for what to drop. The photos themselves are saved as files on the drives, so the store is not the record.

Our private search engine has a feature that would need Valkey. Our settings turn that feature off, because we do not need it.

The app has two caches of its own. One saves the app's files so it can open without internet. Every new version deletes the old saved files and starts fresh. The other saves the reading voice, sentence by sentence. When it gets too full, some clips must go. The ones played longest ago go first. Clips you downloaded on purpose are never dropped. And the app asks the NAS for just two clips at a time. That is all the voice can serve at once. When it asked for three, the third got turned away. Then the reader paused.

A STORY ABOUT A BAND FOLDER. This is a made-up story to help you think.

Maya played clarinet in the school band. She kept all her music in one folder. It went everywhere with her. The week before the spring concert, she left the folder on the bus. It was gone. She panicked. Then her director smiled. Every part was saved in the school's music library. He printed her a new set that afternoon. After that, Maya kept a photo of each page on her phone too. She knew the folder was just a copy. The library had the real thing.

THE ONE SOURCE. Every copy in this lesson can fail. One source does not: [[Isaiah 40:8]] Jesus does not change: [[Hebrews 13:8]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] and everything holds together in Him: [[Colossians 1:17]]

${FACTS.youth}

ONE MORE THOUGHT. You use caches all day. Your phone keeps small copies of your photos. Your browser keeps copies of pages. Your music app keeps songs for when there is no signal. All of those can be cleared. That is fine, as long as the real thing is kept somewhere else.

FOUR THINGS THIS WEEK. Know where the real copy of your important stuff lives. Keep a handy copy nearby. Decide what to delete when your phone is full. Put one important thing somewhere safe, and give a copy to someone you trust.

${TALK.youth}`;

const TEEN = `${TITLE}.

THE SHORT VERSION. Fast copies are useful, but they are never the real record, and this week works that idea out carefully. We start from the Word, then read a newsletter about two caching tools, and then open the code of our own app to see what it actually keeps.

THE SOURCE. On the sixteenth of November, a programming newsletter compared Redis and Memcached. Darrell forwarded it with one word on top: Lesson. That one word is the request, and the newsletter is just the occasion for it. This was built on the eighteenth.

THE FRAME. Start with Joseph. He planned for the famine years before they came: [[Genesis 41:35]] [[Genesis 41:36]] Notice where the grain was kept: not in one far palace, but in the cities, near the people who would need it when the harvest failed.

Then Jeremiah. A king burned the scroll of his prophecy, page by page. Yahweh said to write it again: [[Jeremiah 36:28]] The scroll was a copy, and the source was Yahweh, so the king could burn the copy but he could never burn the source.

THE IDEA. A cache is a quick copy kept in fast memory, where an app looks first; on a miss, it asks the database and saves a copy for next time. The newsletter calls that cache-aside. Redis and Memcached both do it. They differ in three ways that matter: what they can change in place, what they do when memory is full, and what happens when a server crashes.

LOCALITY. Joseph stored each field's grain in the town beside it: [[Genesis 41:48]] Keep the copy where the work happens, because that is the whole reason caches exist in the first place.

Memcached stores a key and a blob of bytes, and it never looks inside the blob, so if you want to change one field you have to pull the whole blob, edit it, and push it back. It is a simple tool that leaves more of the work to you.

THE LOST UPDATE. Two servers both add points to one scoreboard. Both read the old score, both add their points, and both save, so the second save erases the first. No one cheated; the math just broke because two hands touched one number. Memcached offers a check-and-retry guard, called compare-and-swap. But your code must use it. Redis can bump one player's score in place, in one step. It also has lists, sets, hashes and counters it can change in place. The Word says to know the true state of what you manage: [[Proverbs 27:23]] And stewards must be faithful: [[1 Corinthians 4:2]]

FULL MEMORY. The manna had a shelf life. Moses said not to keep it overnight: [[Exodus 16:19]] Those who did found it rotten: [[Exodus 16:20]] In the heat of the day the rest melted: [[Exodus 16:21]] Each item had a timer built into it, which is exactly what programmers call an expiry time. But one portion was kept on command, and it lasted: [[Exodus 16:24]]

Memcached evicts on its own. Its LRU has three tiers, hot, warm and cold. Cold goes first, so one odd request cannot shove out the things people read every day. Redis makes you pick a policy, like least recently used or least often used. Its default is to evict nothing at all, so once memory is full it refuses new writes, and that surprises a lot of people the first time it happens.

The rich fool's fix for full barns was bigger barns: [[Luke 12:18]] Bigger is not a plan; it only pushes the hard choice down the road. Count the cost first: [[Luke 14:28]]

CRASHES AND HERDS. Lose a Memcached node and its data is gone, but if the database is fine, you rebuild from it. Rebuilding still costs something, though: when a hot key vanishes at peak time, thousands of misses hit the database together. That is a stampede, or thundering herd. It can take the database down too. Every nation came to Egypt at once: [[Genesis 41:57]] Joseph opened the storehouses and sold in order: [[Genesis 41:56]] The fixes look the same as Joseph's order: warm the cache before the rush, let one request rebuild while the others wait, or serve the slightly old copy while a fresh one loads.

Redis can snapshot to disk, log each write, and copy to replicas. But replication is asynchronous, which means Redis says done before the replica has the write, and if the primary dies in that moment the write is gone. That is why the newsletter says critical records belong in a real database built to last. Moses kept one jar of manna on purpose, before the LORD, for the generations: [[Exodus 16:33]]

WHY THIS MATTERS TO YOU. You already live with caches every day. Your browser keeps copies of pages so they load faster. Your phone keeps thumbnails of your photos so the gallery scrolls smoothly. Your music app keeps songs so they play on the bus without signal. Each of those is a near copy, and each one can be cleared without losing the real thing, as long as the real thing is kept somewhere else. The danger comes when the only copy of something precious lives in a place that was only ever meant to be a cache.

OUR APP, CHECKED IN THE CODE. Here is the straight answer, read from the files: the app runs no Redis and no Memcached, and neither do any of the services we wrote for the NAS. One Redis-style store does run on the NAS. It is Valkey, a fork of Redis, and it came bundled with Immich, our photo backup. Our compose file sets no memory cap and no eviction rule for it, and gives it no disk of its own. The photos themselves are ordinary files on the storage pool, and that pool is the record, not the store.

Our search engine has a rate limiter that needs Valkey. The config turns it off and says why: we do not run one, and no public traffic hits it.

The app keeps two caches on your device. The service worker saves the app's files so it works offline. Each build gets a fresh store, and old stores get deleted, except a few marked keep. The voice clip cache saves each spoken sentence, keyed by voice, model and words. Once it passes its cap, which is three hundred megabytes unless you choose more, it drops the least recently played clips first, while downloads are pinned and never dropped. The app also asks the NAS for only two clips at once, the exact number the voice can serve. When it used to ask for three, the third request was rejected as busy, and the reader stalled in the middle of a sentence.

A STORY ABOUT A GROUP CHAT. This is invented, to help you think.

Jordan ran the schedule for a youth retreat in a group chat, and fifteen people kept asking the same question: what time does the bus leave? Each time, Jordan scrolled up, found the plan, and typed the answer. Then the bus time changed. Jordan updated the chat, but three people were still going by screenshots of the old answer, and they nearly missed the bus. After that, Jordan pinned one message with the real schedule; screenshots were still fine, but everyone knew they were only copies, and the pin was the source.

THE SOURCE THAT STAYS. Every store here can fail. The Word cannot: [[Isaiah 40:8]] Jesus is the same yesterday, today and forever: [[Hebrews 13:8]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne lasts forever: [[Hebrews 1:8]]

${FACTS.teen}

WHAT TO TAKE WITH YOU. The newsletter's own last line is worth keeping: a good cache does not need every feature, it needs the right responsibilities. The same is true of the people and the things we lean on, because a quick copy is a gift as long as nobody mistakes it for the source.

FOUR THINGS THIS WEEK. Name the real home of your important files. Keep a handy copy. Choose what to clear when storage fills. Back up one thing that cannot be replaced, and tell someone where it is.

${TALK.teen}`;

const SENIOR = `${TITLE}.

AN HOUR ON STORES, COPIES AND RECORDS. Every household keeps some things close at hand and other things put away for safekeeping. Every household has learned, sometimes painfully, which is which. This week a technical newsletter about two computer tools gives us occasion to think it through, beginning with the Word and ending in our own house.

THE OCCASION. Level Up Coding, an engineering newsletter, published a comparison of Redis and Memcached on Monday, the sixteenth of November 2026. Darrell forwarded it into the lesson lane with a single word written above it: Lesson. His word is the request; the newsletter supplies the occasion. The lesson was prepared on the eighteenth.

THE FRAME FROM GENESIS AND JEREMIAH. Joseph's counsel to Pharaoh is the first picture: [[Genesis 41:35]] [[Genesis 41:36]] Observe that the reserve was distributed, held in the cities where it would be eaten, rather than gathered into one distant treasury.

Jeremiah supplies the second. The prophet's words, written by Baruch upon a roll, were cut and burned by King Jehoiakim. The response from heaven was immediate: [[Jeremiah 36:28]] The written copy perished; the Word it carried did not, for it had never depended on the parchment. These two passages govern everything that follows: a nearby store is a blessing, and no store is the source.

THE TECHNICAL MATTER IN BRIEF. Software keeps its authoritative information in a database, which is durable but comparatively slow to consult. To answer quickly, it also keeps copies in fast memory, called a cache. A program consults the cache first; failing to find what it wants there, it reads the database and leaves a copy in the cache for the next request. The newsletter calls this arrangement cache-aside, and both Redis and Memcached support it. Where they part company is in what they can modify, how they behave when memory is exhausted, and what survives the failure of a server.

THE STOREHOUSES OF THE CITIES. Scripture records how Joseph executed his plan: [[Genesis 41:48]] Engineers would call this locality - keeping the copy beside the place of use - and it is the entire justification for a cache.

Memcached, by the newsletter's account, is deliberately plain. It holds pairs of keys and values and regards each value as an opaque sequence of bytes. To alter a single detail, the program retrieves the entire value, amends it, and writes the whole back.

THE OVERWRITTEN TALLY. Consider a scoreboard held as one value. Two servers each add points; both read the same earlier total, both add, both store, and the second store silently erases the first. Memcached provides a safeguard, compare-and-swap, which writes only if nothing has changed since the read, but the program must employ it and repeat the attempt when it fails. Redis, the newsletter explains, offers structures such as counters, hashes, lists, streams, sets and sorted sets that may be modified in place, so a single command can raise one score without disturbing the rest. The proverb applies directly: [[Proverbs 27:23]] A steward must know the true condition of what he keeps, and Paul names the requirement: [[1 Corinthians 4:2]]

WHEN THE STORE IS FULL. Memory is finite, and the newsletter's most practical warning concerns what happens at its limit. The manna in the wilderness furnishes a precise illustration. Moses instructed: [[Exodus 16:19]] Those who disregarded him found the result: [[Exodus 16:20]] The food carried, so to speak, its own expiry: [[Exodus 16:21]] Yet before the sabbath a portion was preserved by command, and remained sound: [[Exodus 16:24]]

Memcached frees space automatically, ordering its contents into hot, warm and cold divisions and discarding the cold first, so that an occasional request does not displace what is consulted daily. Redis lets the operator select a policy - least recently used, least frequently used, random, or nearest to expiry - but its default is to discard nothing, and once the configured limit is reached it declines any write requiring more memory.

Our Lord's parable describes the third response to a full store: [[Luke 12:18]] Enlargement merely postpones the decision. His counsel elsewhere is to reckon beforehand: [[Luke 14:28]]

WHEN A SERVER FAILS. Should a Memcached server fail, its contents are lost; it offers neither built-in replication nor automatic failover. Provided the database remains intact, the program simply rebuilds. Rebuilding, however, has a price. If a heavily used value disappears during peak demand, a great many requests miss together and converge upon the database. Engineers call this a cache stampede or thundering herd. It may overwhelm the very source the cache was meant to spare. The famine presents the same pattern: [[Genesis 41:57]] Joseph met it with order rather than a rush: [[Genesis 41:56]] The newsletter's remedies are similar in spirit - preparing the cache in advance, allowing a single request to rebuild a missing value while the others wait, or serving a slightly older copy while a fresh one is prepared.

Redis can preserve its data by periodic snapshots or by a log of every write, and can replicate to other servers under watchers that promote a replica if the primary fails. The newsletter is careful to add that this guarantees nothing absolute. Replication is asynchronous by default, so a write may be acknowledged before any replica receives it. It is lost if the primary fails at that moment. Its conclusion is that critical records belong in a durable database. Moses provided such a record: [[Exodus 16:33]]

OUR OWN HOUSEHOLD, EXAMINED. What follows is drawn from the configuration and code themselves. The application uses neither Redis nor Memcached, and none of our own services on the NAS uses either. One store of the Redis family does run there: Valkey, which began as a derivative of Redis, supplied with Immich, the photo-backup system we host. Our configuration for it specifies no memory ceiling, no eviction policy and no dedicated disk; it runs as the release provides it. The photographs themselves reside as ordinary files on the storage pool, catalogued in a database on disk, so the store is not the record. Our private search engine includes a rate limiter that would require Valkey; its settings disable it, noting that we run none and receive no public traffic to limit.

The application maintains two caches on the device. The first, kept by the service worker, holds the application's files so it can open offline; each release receives a fresh store and the previous ones are deleted, apart from a few marked for keeping. The second holds the spoken sentences of the reading voice, each keyed by voice, model and wording; beyond its limit, three hundred megabytes unless the listener chooses more, the clips played least recently are removed first, while those belonging to a deliberate download are never removed. The application also requests exactly two clips at a time from the NAS voice, matching what the voice can serve; when it once requested three, the third was declined and the listener heard the delay.

AN ILLUSTRATION FROM THE PARISH OFFICE. The following account is invented for illustration.

For thirty years the church secretary kept the membership roll in a card file on her desk, and it was the fastest way to find anyone's address. When the office flooded one spring, the card file was ruined. The pastor feared the worst, until the treasurer remembered that every family's record was also entered in the annual report filed with the denomination. The roll was rebuilt within a week. Afterward the secretary still kept her card file, for it remained the quickest way to look someone up, but she understood it differently. It was the convenient copy. The record lay elsewhere.

THE SOURCE THAT ENDURES. Every store described here may fail. One will not: [[Isaiah 40:8]] Christ is unchanging: [[Hebrews 13:8]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] and in Him all things consist: [[Colossians 1:17]]

${FACTS.senior}

FOUR THINGS THIS WEEK. Establish where each important family record truly resides. Keep a convenient copy within reach. Decide in advance what may be discarded when space runs short. Place one irreplaceable document in secure keeping and entrust a second copy to someone reliable.

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.

WHO SENT THIS. On the sixteenth of November 2026 Darrell forwarded a Level Up Coding issue, Redis vs Memcached, with ONE WORD typed above it: Lesson. His word is the ask; the newsletter is the occasion. It was built on the eighteenth of November.

THE WORD FIRST. Genesis 41:35-36 opens the hour - the store laid up in the cities, near the mouths it would feed - with Jeremiah 36:28 beside it: the roll burned and written again, because the copy was never the source. Then the food of every field kept in its own city (Genesis 41:48); the true state of the flock and the faithful steward (Proverbs 27:23; 1 Corinthians 4:2) for the lost update; the manna that spoiled, melted, and the portion kept on purpose (Exodus 16:19-24) for eviction and expiry; the bigger barns and the counted cost (Luke 12:18; Luke 14:28); every land at one door and the storehouses opened in order (Genesis 41:56-57) for the stampede; the omer laid up for the generations (Exodus 16:32-33) for the durable record; and the Word that shall not pass away (Matthew 24:35; Isaiah 40:8).

OUR OWN HOUSE. Read from the files, not assumed: the app and our own NAS services run no Redis and no Memcached; the one Redis-family store is Valkey 9 inside the Immich photo stack, on its release defaults, with the photos kept as files on the pool; the search engine's limiter is off because we run no Valkey for it; and the app's two caches - the service worker's per-build store and the voice clip store with least-recently-played eviction, pinned downloads, and two requests at a time - each hold a copy that can be rebuilt.

THE TIERS. ESTABLISHED and stated plainly: a cache is a near copy and never the record, and both tools are real. REPORTED by the newsletter: each tool's limits and defaults. MEASURED: our house, file by file. NOT VERIFIED: what Immich keeps in its Valkey, and Valkey's own defaults, since the documentation sites refused our network. NOT MEASURED: that store's memory use. re-review: 2026-12-18.

LEFT OUT ON PURPOSE. The sponsor block, on planning capacity with A.I. agents, and the share and subscribe lines.

PLACEMENT. Sovereign A.I., week 89, because a household that runs its own machines must know which of its stores are copies and which is the record.`,
  inApp: `No new screens this week. One page in your Study, and four small acts of keeping in your house.

In the app: open Sovereign A.I. week 89 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each holds the whole teaching. Use Search it out on Genesis 41, Exodus 16 and Jeremiah 36 so the storehouses, the manna and the burned roll sit side by side; the links come from the lesson's own references.

Then, if you listen to lessons read aloud, open the voice settings and look at the size of the clip store. That is one of the two caches this lesson describes, and the cap is yours to choose. Downloaded lessons are held and never dropped from it.

Away from the app, four exercises. Name where each family record truly lives. Keep a near copy of what you reach for daily. Decide what goes when a drawer is full. And lay up one record where it will last.`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Genesis 41:35]] [[Genesis 41:36]] [[Jeremiah 36:28]] [[Genesis 41:48]] [[Proverbs 27:23]] [[Exodus 16:21]] [[Exodus 16:24]] [[Luke 14:28]] [[Genesis 41:56]] [[Exodus 16:33]] [[Matthew 24:35]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them lands on your own house.

First, read Genesis 41:33-57 whole. Notice that the grain was kept in the cities near the fields, and that when every land came at once, the storehouses were opened in order. Write one sentence on what your house reaches for daily that should be kept nearer to hand.

Second, read Exodus 16. Mark what spoiled, what melted, what was kept for the sabbath, and the one omer laid up for the generations. Ask: what in my house is meant to pass, and what is meant to last?

Third, read Jeremiah 36. Mark the moment the roll is burned and the moment it is written again. Ask where the true source of each of your family's records lives, and whether it could be rebuilt.

And one verification reading, because this course works this way. That a cache is a near copy and never the record, and that both tools are real, is ESTABLISHED and stated without hedging. Each tool's limits and defaults are REPORTED by the newsletter. Our house was MEASURED, file by file. What Immich keeps in its store was NOT VERIFIED, and that store's memory use was NOT MEASURED. Practice telling those apart.`,
    plan: `PLAN. Decide four measures before the week starts, and decide who hears them.

One: the source. For each list your family depends on, name where the true one lives.

Two: the near copy. Name the copy you will keep close, and where.

Three: the full day. Name the rule for what goes when the closet, the phone or the calendar is full, and what may never be dropped.

Four: the record. Name the one document you will lay up to last, and the trusted person who will hold a second copy.

Then name the person who will ask you about all four on the same day next week. A measure nobody asks about is a wish.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.

Find the source of each list. Make the near copy. Clear one full drawer or phone by the rule you chose. Lay up the record and hand over the second copy.

Teach the verse at a meal: take thee again another roll. Ask a child to say in their own words why the words were not lost.

At the end of the week, answer three questions to the person who is asking. What did we keep that was only a copy? What would have been lost if it burned? And where is our heart kept - on the copies, or on the source?

Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over an engineering newsletter, answered from the Word rather than from the article.`,
    `The hour opened by Genesis 41:35-36, so every talk of caching is heard under the store laid up near the people against the famine.`,
    `Jeremiah 36:28 laid down beside it, so every reader learns that a copy can burn and the source still stands.`,
    `Cache-aside taught plainly: check the near copy, fetch from the source on a miss, keep a copy for next time.`,
    `Locality read beside Genesis 41:48, the food of every field laid up in its own city.`,
    `The lost update and compare-and-swap read beside Proverbs 27:23 and 1 Corinthians 4:2: know the true state, keep the tally faithfully.`,
    `Redis's in-place structures taught as the newsletter reports them, without ranking either tool.`,
    `Eviction and expiry read beside the manna: what spoiled, what melted, and the portion kept by command (Exodus 16:19-24).`,
    `Memcached's hot, warm and cold tiers and Redis's default of refusing writes taught as reported.`,
    `The bigger barns of Luke 12:18 named as a postponement, and Luke 14:28's counted cost set in its place.`,
    `The thundering herd read beside Genesis 41:56-57: every land at one door, and storehouses opened in order.`,
    `Redis persistence and its asynchronous replicas taught with the newsletter's own warning that an acknowledged write can be lost.`,
    `The durable record read beside the omer laid up for the generations (Exodus 16:32-33).`,
    `Our own house read from its files: no Redis and no Memcached in the app or our own NAS services.`,
    `The one Redis-family store on the NAS named plainly: Valkey 9 in the Immich photo stack, on its release defaults, with the photos kept as files.`,
    `A store the house declined named too: the search engine's limiter is off because we run no Valkey for it.`,
    `The app's two device caches traced: the service worker's per-build store and the voice clip store.`,
    `The clip store's least-recently-played eviction, pinned downloads and two-at-a-time requests taught as the house's own answers to the newsletter's three questions.`,
    `Matthew 24:35 and Isaiah 40:8 close the hour on the source that is never lost.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, by whom all things consist.`,
    `The established, the reported, the measured, the unverified and the unmeasured told apart in every reader place, with a dated re-review.`,
    `All four age bands carried from the first commit, each written for its own reader.`,
    `Four household actions that cost nothing: name the source, keep a near copy, choose what goes when full, lay up one record to last.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The address book in the kitchen drawer',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. For forty years a grandmother kept every address that mattered in one small book in the kitchen drawer. Christmas cards, birthday cards, sympathy cards: all of them went out from that book, and she could find anyone in it faster than her grandchildren could on their phones.

The winter she moved into her daughter's house, the book was lost in the boxes. She grieved it more than the furniture. Then her daughter sat down with her and they began to rebuild it - from the church directory, from the cards that came that December, from cousins who kept their own lists. By spring the new book held nearly everything, and a few names it had never held before.

They made one change. The daughter typed the whole book into a list that the family kept together, and printed it each January. The grandmother still kept her little book in the kitchen drawer, because it was still the quickest way to find anyone. But now it was the near copy, and everybody knew where the record was.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The bakery counter at seven',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A small bakery sold out of its one famous pastry by seven every Saturday morning. The baker kept a tray of them at the counter and the rest in the back, and the counter girl refilled the tray whenever it emptied.

One Saturday the tray emptied at five past seven, just as a bus of tourists came through the door. Twenty people asked at once. The counter girl ran to the back, then the baker ran to the back, then both of them carried trays at the same time and dropped one, and for ten minutes nobody was served at all.

The next week the baker changed two things. He filled a second tray before seven, so the counter never ran empty at the rush. And he made one rule: when the tray ran out, one person went to the back and everyone else kept serving what was on hand. The line moved. Nothing was dropped.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'What is a cache, as this lesson teaches it?',
        options: [
          'The only safe copy of the data',
          'A fast copy kept close to the one who reads it, never the record itself',
          'A kind of database that never loses anything',
        ],
        answer: 1,
        explain: 'The near copy saves the trip to the source. It is a mercy, and it is never the source.',
      },
      {
        q: 'What does cache-aside mean?',
        options: [
          'Check the cache first; on a miss, read the database and keep a copy in the cache',
          'Write to the cache and never to the database',
          'Turn the cache off when it is busy',
        ],
        answer: 0,
        explain: 'The newsletter’s profile example: look near first, fetch from the source on a miss, and keep a copy for next time. Both tools serve it.',
      },
      {
        q: 'Which passage pictures a store kept near the people who will need it?',
        options: ['Genesis 41:48, the food of every field laid up in its own city', 'Luke 12:18, the bigger barns', 'Jeremiah 36:23, the roll in the fire'],
        answer: 0,
        explain: 'Joseph kept the grain in the cities, beside the fields, so nobody walked back to the field in the famine. Engineers call it locality.',
      },
      {
        q: 'What goes wrong when two servers update one scoreboard by reading, changing and writing it back?',
        options: ['Nothing; both updates are kept', 'The second write can erase the first, losing one update', 'The database deletes the scoreboard'],
        answer: 1,
        explain: 'Each starts from the same old board. Compare-and-swap can catch it, or Redis can raise one score in place in a single step.',
      },
      {
        q: 'What does Redis do by default when its memory limit is reached, as the newsletter reports?',
        options: ['It drops the oldest data', 'It refuses writes that need more memory', 'It doubles its memory'],
        answer: 1,
        explain:
          'Its default is to drop nothing. You may choose a policy - least recently used, least often used, random, or by expiry - but until you do, new writes are refused.',
      },
      {
        q: 'How does the manna in Exodus 16 picture eviction and expiry?',
        options: [
          'Nothing was ever kept',
          'Most of it spoiled or melted by design, while one portion was kept on purpose by command',
          'Everything was kept for ever',
        ],
        answer: 1,
        explain:
          'What was left overnight bred worms; what lay in the sun melted; the sabbath portion stayed sound. Most of a cache is meant to pass; a marked part is meant to stay.',
      },
      {
        q: 'What is a cache stampede, or thundering herd?',
        options: ['A cache that grows too fast', 'Many requests missing at once and all running to the database together', 'A server that restarts itself'],
        answer: 1,
        explain:
          'When every land came to one door, Joseph opened the storehouses and sold in order (Genesis 41:56-57). One request rebuilds while the rest wait.',
      },
      {
        q: 'Why does the newsletter say neither tool should be the only home of a critical record?',
        options: [
          'Because caches are slow',
          'Because even Redis may acknowledge a write before its replicas have it, so a failure at that moment can lose it',
          'Because Memcached cannot store text',
        ],
        answer: 1,
        explain: 'Keep the record in a durable database. Moses laid up one omer before the LORD for the generations (Exodus 16:33).',
      },
      {
        q: 'Does this app run Redis or Memcached?',
        options: [
          'Yes, both, for every page',
          'No; neither the app nor our own NAS services runs either, and the one Redis-family store on the NAS is Valkey inside the Immich photo stack',
          'Only Memcached',
        ],
        answer: 1,
        explain: 'Read from the files: the Immich compose file runs Valkey 9 on its release defaults, and the photos themselves are files on the pool.',
      },
      {
        q: 'How does the app’s voice clip store decide what to drop when it is full?',
        options: [
          'It drops the newest clips first',
          'It drops the least recently played clips first, and never drops clips that belong to a download',
          'It never drops anything',
        ],
        answer: 1,
        explain: 'Over its cap, three hundred megabytes unless the listener picks more, the oldest-played go first. Downloads are held, like the omer laid up.',
      },
      {
        q: 'Why does the app ask the NAS voice for exactly two clips at a time?',
        options: [
          'Because the voice serves two at once, and a third request was refused as busy and made the reader pause',
          'Because two is a lucky number',
          'Because the phone can only hold two clips',
        ],
        answer: 0,
        explain: 'Asking the source for more than it can serve only makes everyone wait. A test holds the two numbers together.',
      },
      {
        q: 'Which of these does this lesson state as NOT VERIFIED?',
        options: [
          'That the app runs no Memcached',
          'What Immich keeps in its Valkey store, and that store’s own defaults',
          'That the clip store drops the least recently played first',
        ],
        answer: 1,
        explain:
          'The documentation sites refused our network, so it is named and not claimed; the store’s memory use was not measured either. re-review: 2026-12-18.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Genesis 41:35-36 aloud before you say one word about any computer. Then read Jeremiah 36:28 aloud. Then ask the room one question and wait: what have you lost that you were able to get back from somewhere else, and what have you lost for good?

MINUTES 0 TO 10 - THE NEWSLETTER IN ONE PICTURE. Define a cache and cache-aside in plain words. Write three questions on the board: what can it change, what does it do when full, what survives a crash.

MINUTES 10 TO 20 - THE STOREHOUSES. Genesis 41:48 for locality; Proverbs 27:23 and 1 Corinthians 4:2 for the lost update. Explain compare-and-swap and in-place updates as the newsletter reports them, ranking neither tool.

MINUTES 20 TO 32 - THE MANNA. Exodus 16:19-24 for expiry and eviction; Memcached's hot, warm and cold tiers; Redis's default of refusing writes. Then Luke 12:18 and Luke 14:28.

MINUTES 32 TO 42 - THE BURNED ROLL. Jeremiah 36:23, 27, 28 and 32 for rebuilding from the source; Genesis 41:56-57 for the stampede; Redis persistence and its asynchronous replicas; Exodus 16:32-33 for the durable record.

MINUTES 42 TO 52 - OUR OWN HOUSE. No Redis and no Memcached in the app or our own NAS services; Valkey 9 in the Immich stack on its defaults, the photos as files; the search limiter off; the service worker's per-build store; the voice clip store with its least-recently-played rule, pinned downloads and two requests at a time. Say plainly what was not verified and not measured.

MINUTES 52 TO 60 - THE SOURCE THAT STANDS. Matthew 24:35, Isaiah 40:8, Hebrews 13:8, then John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Give the four household actions and close with the talk-together directions.

WHAT NOT TO DO. Do not turn this into a contest between the two tools; the newsletter itself says a good cache needs the right responsibilities, not every feature. Do not stage it as camps for the room to pick between; teach the storehouses and the roll and work them (DR-0098). Do not hedge the established engineering into nobody-knows (DR-0100). And do not guess what Immich keeps or how full its store is; that was not verified or measured.`,
    talkingPoints: [
      `Lay up the store in the cities, against the famine (Genesis 41:35-36).`,
      `Take thee again another roll: the copy burned, the source stood (Jeremiah 36:28).`,
      `A cache is a near copy; it is never the record.`,
      `Cache-aside: look near, fetch from the source on a miss, keep a copy.`,
      `Locality: the food of every field in its own city (Genesis 41:48).`,
      `Memcached keeps values as plain bytes; change one field and you rewrite the whole.`,
      `Two hands on one tally lose an update; compare-and-swap or an in-place change keeps it (Proverbs 27:23).`,
      `Stewards must be found faithful (1 Corinthians 4:2).`,
      `The manna spoiled, melted, and one portion was kept by command (Exodus 16:19-24).`,
      `Memcached evicts by hot, warm and cold; Redis by default refuses new writes when full.`,
      `Bigger barns postpone the choice (Luke 12:18); count first (Luke 14:28).`,
      `A lost server is a burned roll; rebuild from the source (Jeremiah 36:27-28).`,
      `The thundering herd: every land at one door, storehouses opened in order (Genesis 41:56-57).`,
      `Redis can persist and replicate, and an acknowledged write can still be lost.`,
      `Lay up the critical record where it lasts (Exodus 16:32-33).`,
      `Our app and our own NAS services run no Redis and no Memcached.`,
      `The one Redis-family store is Valkey 9 in the Immich stack; the photos are files.`,
      `The search engine's limiter is off: a store we do not need.`,
      `The service worker's store is burned every build and written again.`,
      `The voice clip store drops the least recently played, holds downloads, and asks for two at a time.`,
      `My words shall not pass away (Matthew 24:35; Isaiah 40:8).`,
      `Jesus is the Lamb of Yahweh and the Eternal Son, by whom all things consist (John 1:29; Colossians 1:17).`,
    ],
    discussionPrompts: [
      `Where does the true copy of each of your family's important records live?`,
      `What do you keep close at hand that is only a copy?`,
      `When your phone, closet or calendar is full, how do you decide what goes?`,
      `When have two people in your house changed the same thing at once, and one change was lost?`,
      `What would be hardest to rebuild if your house burned tonight?`,
      `Is your heart kept on the copies or on the source?`,
    ],
  },
  lesson: LESSON.join('\n\n'),
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
console.log(`sov89: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov89: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov89: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov89: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov89: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov89: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov89: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov89: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov89: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov89: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov89: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov89: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov89: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov89: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov89: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov89: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov89: spliced ${ID}`);
console.log(`sov89: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov89: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
