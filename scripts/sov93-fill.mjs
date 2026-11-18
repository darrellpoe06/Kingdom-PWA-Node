// =============================================================================
// sov93-fill - build Sovereign A.I. week 93 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose holds only a reference in double brackets, [[2 Chronicles 23:19]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory. anchor.ref is DERIVED from the
// placeholders that occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. Level Up Coding (Nikki Siapno) sent "API Gateway
// vs Load Balancer: Do You Need Both?" on 2026-11-11. Darrell forwarded it into
// the lesson lane with ONE WORD above it: Lesson. Gmail thread
// `1a1ca71b314895bf`. Built 2026-11-18. The sponsor block, the images, the
// links and the comparison table (an image) are left out.
//
// ONE TEACHING, ONE LESSON (DR-0610). lesson-already-built.mjs returned MAYBE
// on the source name only; no week of this course and no decision record
// teaches the gateway or the load balancer. Week 92 owns the agent that games
// its own test; week 91 owns evaluation. This week owns ONE thing: the three
// questions in front of every request (may it come in, which service, which
// server) and the two components built to answer them.
//
// WORD FIRST (DR-0127 / DR-0282). 2 Chronicles 23:19 - the porters set at the
// gates - and 1 Chronicles 27:1 - the courses that came in and went out month
// by month - frame the hour before a single word about a gateway. Neither verse
// was carried by any earlier week of this course (counted on the catalog
// before writing: 0 and 0).
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). REPORTED: the newsletter's
// claims about particular products (one cloud's application balancer signing
// users in, Kong balancing load); not checked against the vendors' own pages.
// ESTABLISHED: gateway versus balancer, layer four versus layer seven, health
// checks - standard, long documented, stated plainly. MEASURED in our own house,
// with file:line in the DR and pinned in the test. NOT MEASURED: how many
// requests on the Funnel land on a service they were not meant for.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 93;
const ID = 'sov93-the-porter-and-the-course';
const TITLE = 'The porter and the course - who may come in, which door it goes to, and which one serves';

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
  if (!m) throw new Error(`sov93: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov93: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov93: reference does not resolve in the corpus -> "${ref}"`);
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
  lesson: `WHERE WE STAND ON THE FACTS. REPORTED: what the newsletter says particular products can do - that one cloud provider's application balancer can sign users in, verify their tokens and rewrite addresses, and that gateways such as Kong can balance load, check health and break circuits - comes to us from the newsletter alone. We take it on trust and did not check it against each vendor's own pages. ESTABLISHED, and stated plainly: the difference between a gateway and a load balancer, and between layer four and layer seven, is standard and long documented across the field, and the newsletter teaches it correctly. MEASURED in our own house: the one shared function that carries every road to the server, its refusal of another site's writes and the signature on every answer; the tunnel's table of paths; the token checks on the tax, photo and voice doors and the voice's cap of two readings at once; the three times a path with no mount was answered by a stranger; and the one machine behind every path. Each was read from the file that records it. NOT MEASURED: how many requests on the tunnel today land on a service they were not meant for. Nothing in the house counts that yet. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. A newsletter told us what some big computer tools can do. We did not check every one of those tools ourselves, so we took the newsletter at its word. It is sure that a door helper and a sharing helper do two different jobs. People who build computers have known that for a long time. We read our own files to learn how our own app does it. We do not know yet how many times a message to our home computer still goes to the wrong helper. Nobody has counted that. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. What some big products can do came to us from the newsletter, and we did not check each company's own pages. That a gateway and a load balancer do two different jobs is well known and taught everywhere. Our own house facts were read from our own files: one shared road for every request, a path table, a token lock on each door, a limit of two voice readings at once, and three times a stranger answered. How often a request still lands on the wrong service has not been measured yet. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. Reported: the product features the newsletter lists, which we did not check against the vendors. Established: gateway versus balancer, layer four versus layer seven, and health checks. That is standard and has been taught for years. Measured: our shared road, our path table, our token locks, our cap of two, and our three wrong answers, each one read from a file. Not measured: how often a request on our tunnel still lands on the wrong service. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. The capabilities the newsletter attributes to particular products are reported as it gives them; they were not checked against the vendors' own documentation. The distinction between a gateway and a load balancer, and between balancing at the fourth layer and at the seventh, is established and long documented, and it is stated without hedging. Every statement about this house is traced to the file that makes it true: the single shared road, the table of paths, the token checks and the cap on the voice, the three occasions on which a stranger answered, and the single machine behind every path. How many requests on the tunnel are presently answered by a service they were not meant for has not been measured, and no conclusion is offered. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  'And measure the growth the Word’s way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - who do you let into your room, and how do you decide - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, 2 Chronicles 23:19. Children, ask your mother, your father or a grandparent about a time they were the only one carrying a job until someone finally shared the load; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: which job in our house belongs to everyone, and so to no one, and needs a rota. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - who gets to come into our house, and who decides - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, 1 Chronicles 27:1. Children, ask your mom or your dad or your grandma or your grandpa about a time they had too much work and someone helped. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what chore would be easier if we took turns. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what job in our family feels too heavy for one person - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Exodus 18:18. Children, ask your mom, your dad or a grandparent who kept the door at their house growing up, and how a stranger was told apart from a friend; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: when a message comes back, how do we know who really sent it. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - where in your week does the first answer you get turn out not to be the real answer - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, 2 Samuel 18:29. Children, ask your mom, your dad or a grandparent about a place they worked where one person held every key, and what happened when that person was out; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: what are we adding to our lives that we have no harvest for yet. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - when someone knocks, what do you check before you open, and what do you still check after - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, John 10:3. Children, ask your parents or your grandparents about a time a job was divided well among many hands, and what made the dividing work; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: which door in our life has no keeper, and which keeper has no rota. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no detail from the newsletter stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.
WHO SENT THIS, AND WHEN. On the eleventh of November 2026 the Level Up Coding newsletter, written by Nikki Siapno, asked a builder's question about the two components that stand in front of a set of servers. Darrell forwarded it into this lane with ONE WORD typed above it: Lesson. That word is the ask; the newsletter is only the occasion. Both components sit in front of the servers, both pass requests along, and modern versions of each can do some of the other's work. So does a builder need both? The answer turns on an old distinction: two offices at one house, each with its own charge.
THE WORD FIRST, BEFORE ANY MACHINE. Two verses frame this hour. When Jehoiada the priest set the house of worship in order again, he posted men at its doors: [[2 Chronicles 23:19]] A porter decides who may come in. And when the kingdom's service was ordered under David, it was not laid on one company of men. It was divided into twelve companies of equal size, each serving its month in turn: [[1 Chronicles 27:1]] A course decides which of many equal hands carries this month's load. Two offices, two questions. One asks, may this one enter? The other asks, which of us will carry it? Paul names what stands under both: [[1 Corinthians 12:5]] Different offices, one Master, and neither office is asked to do the other's work.`,
  `THE PORTER AT THE GATE. The porters were not whoever happened to be standing near the door. They were chosen, counted and kept in a set office: [[1 Chronicles 9:22]] They lodged around the house, because opening it every morning was their charge: [[1 Chronicles 9:27]] Every gate was assigned, the small and the great alike, so that no door was left without its ward: [[1 Chronicles 26:13]] And when Nehemiah rebuilt the walls, he set the gate's policy in plain words - when the doors open, who stands by them, and who watches each stretch of the wall: [[Nehemiah 7:3]] That is a gateway's work, written long before there were servers: decide who may come in, on what terms and at what hours, and send the one who enters to the right court of the house.`,
  `THE COURSES THAT TOOK THEIR TURN. Moses once had one seat and one line, and the line ran from morning until evening. His father-in-law saw it plainly: [[Exodus 18:18]] Jethro's counsel did two things at once. It spread the ordinary cases across many able men, and it sent the hard cases to the one who could judge them: [[Exodus 18:22]] Read that verse with this newsletter in your hand and both jobs appear. The great matter is routed to Moses. The small matters are spread across the rulers. David's courses take it one step further: identical companies serving in rotation, so that no company wears out and the king's service never stops. A load balancer is a rota.`,
  `WHAT THE NEWSLETTER TEACHES, IN OUR WORDS. Picture an online shop with three services behind it: one for users, one for orders, one for payments. A customer asks to see her order history. Before any server answers, three questions have to be settled. Is this request allowed? Which service should handle it? Which server of that service should do the work?
The newsletter's answer is that a gateway settles the first two. It checks the caller's credentials. It applies policies such as rate limits and monthly quotas, reshapes a request where a client and a backend expect different forms, keeps older versions of an interface working, and sends the request to the orders service rather than to users or payments. A load balancer settles the third. It spreads requests across several identical copies of the orders service, checks their health, and stops sending work to a copy that has stopped answering until it recovers. Clients keep using one address while servers are added and removed behind it.
It also tells two kinds of balancer apart. A layer four balancer moves connections by address and port and never reads the request inside them, so it can carry traffic that is not web traffic at all. A layer seven balancer reads the web request itself - the path, the host name, the headers - and can send one path to one service and another path to another. That is routing, and it is exactly where the line between the two components blurs.
The newsletter adds one warning worth underlining. A gateway can confirm that a customer's token is valid, but only the orders service knows whether this customer may see this particular order. The gate does not replace the service's own judgment. Jesus put the same two layers in a shepherd's words: [[John 10:3]] The porter opens the door, and the sheep still know whose voice they are hearing.
Its last counsel is the one most builders skip. The goal is not more infrastructure; it is the simplest arrangement that meets what is actually needed, and if one product does both jobs at your size, a second component only adds complexity. Solomon said it about the farm: [[Proverbs 14:4]] An ox earns its stall where there is a harvest to carry. Where there is none, it is only one more thing to feed and clean up after.`,
  `WHY THE TWO JOBS STAY TWO. The sharpest line in the newsletter is that the difference is not where each component sits, or which features it lists, but which responsibility each was built to carry. A balancer can check that a partner's token is valid; it does not know how much of that partner's monthly quota has been spent. A gateway knows the caller, not just the request. Keep those responsibilities apart and the policies can change without touching how load is spread, and servers can be added without changing anything a client sees. That is the sixth chapter of Acts drawn as a diagram: [[Acts 6:3]] The apostles did not stop caring about the widows' tables. They appointed men whose office it was, so that the ministry of the Word was not crowded out by the serving. Dividing the charge well is how care grows without breaking the ones who carry it.`,
  `OUR OWN HOUSE, MEASURED, NOT PAINTED. This house runs no shop, but every request the family app sends to the church's own server has to answer the newsletter's three questions. Here is how it does, from the files that make each statement true.
The first door is the app's own address. Family browsers never call the server directly. They call the app's own site, and a small function there carries the request across. One shared implementation does this for every road to the server. It exists because the public tunnel to the server throttled browsers that called it from another site, answering them with a busy signal before the request ever reached home; through the function, the tunnel sees one trusted caller instead of every browser in the family. The same function refuses a write that arrives from another site's page, and every answer it gives carries a header saying the function itself answered, so a probe can tell a working road from a dark one.
The second door is the tunnel's table of paths. Each path is mounted to one service listening on the server itself: photos on one port, taxes on another, the reading voice on a third, the database stack on a fourth. That table answers the newsletter's second question, which service should handle it. And the database stack's own front door is a gateway, Kong, the very product the newsletter names.
The third door is the lock on each service. The tax archive refuses everyone when no token is configured, never lets everyone in. The photo server and the reading voice's forwarder each compare the family's bearer token in constant time and answer unauthorized otherwise. The voice's forwarder also caps how many readings it will make at once, two by default, and turns the next caller away with a busy answer instead of stacking work on the graphics card. That is a gateway's policy and a balancer's brake, kept on one small door.
And there is no load balancer at all. Each path in the table goes to one port on one machine. When the reading voice does not answer, the reader falls back to a second, lighter voice. That is a health check and a choice, but it is a fallback between two different voices, not work spread across identical copies. At a family's scale that is the newsletter's own counsel: no ox where there is no harvest.`,
  `THE ROUTING FAILURE WE KEEP LEARNING. The newsletter's second question, which service should handle it, is the one this house has failed most often, and the failure has had the same shape each time. A path with no mount does not fail loudly. It falls through to the root of the tunnel, and some other service answers. For about seven weeks the tax archive's reads fell through to the old workflow engine, and the screen said no returns were indexed. In September the reading voice's health check was answered by that same engine's editor page, and for three days any answer at all read as healthy. And on the eighteenth of November, the day this newsletter was built into a lesson, the voice's health check was answered by the camera service, which reported, in perfect order, that it was fine. The voice had no mount yet. The check had asked only whether the answer said ok.
The fix was to ask whose answer it was. The probe now accepts only an answer that names itself as the voice; anything else reads as down, and the reader goes straight to the lighter voice. Scripture has this exact scene. David sat between the gates waiting for word from the battle, and the watchman on the wall named a runner by the way he ran: [[2 Samuel 18:27]] Ahimaaz arrived first, eager and out of breath, and when the king asked the one question that mattered, he had no answer to give: [[2 Samuel 18:29]] The king did not argue with him. He set him aside: [[2 Samuel 18:30]] And he put the same question to the runner who had actually been sent with the word: [[2 Samuel 18:32]] The first runner to answer is not always the one who carries the answer. That is the question our probe had to learn to ask.`,
  `THE DOOR. Every gate in this hour exists to keep one question honest: who may come in? Jesus answered it for every person, once: [[John 10:9]] He is not one door among many with a root behind Him for strangers to fall through. He is the Door. He is the Lamb of Yahweh, [[John 1:29]] the Son the Father gave, [[John 3:16]] the Eternal Son whose throne stands for ever, [[Hebrews 1:8]] and the One by whom all things consist. [[Colossians 1:17]] Every porter, every course and every rota in Scripture served a house that is His.`,
  `FOUR THINGS FOR THE HOUSE. One: name the three questions for every request - may it come in, which service, which server - and know which part of your system answers each. Two: let the gate check the caller and let the service still check the request; the porter does not replace the voice the sheep know. Three: when a path has no home, make it fail loudly, and never let a stranger answer for the service you asked. Four: add the second ox only when there is a harvest; the simplest arrangement that meets the need is the faithful one. Every one of those is a household habit before it is an engineering one: one person keeping the front door, the chores on a rota, and asking who actually answered before trusting the answer.`,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.
WHO SENT THIS. Darrell read an email about the helpers that stand in front of a big computer. He sent it to us with one word on top. The word was Lesson. So here it is.
THE WORD FIRST. Long ago there was a house where people came to worship. A good priest named Jehoiada put men at the doors. Here is what the Bible says. [[2 Chronicles 23:19]] Those men were called porters. A porter keeps a door. He looks at each person and says yes, come in, or no, not yet.
Here is a second verse. King David had a lot of work to do. He did not give it all to one group. He made twelve groups. Each group took a turn for one month. Then the next group came. [[1 Chronicles 27:1]] That is a rota. A rota means we take turns.
So there are two jobs. One job is to keep the door. One job is to share the work. They are not the same job. The Bible says this. [[1 Corinthians 12:5]]
THE DOOR KEEPERS. The porters were picked with care. They were counted. [[1 Chronicles 9:22]] They slept close by. Each morning they opened the doors. [[1 Chronicles 9:27]] Every door got a keeper, big doors and small doors. [[1 Chronicles 26:13]] Nehemiah said when the doors could open and who would watch. [[Nehemiah 7:3]]
TOO MUCH FOR ONE MAN. Moses tried to help all the people by himself. He sat from morning to night. His father in law told him the truth. [[Exodus 18:18]] So Moses picked good men to help. Small things went to them. Hard things came to Moses. [[Exodus 18:22]] Now the work was shared, and nobody got worn out.
THE TWO COMPUTER HELPERS. Big apps work the same way. When you tap a button, a message goes to a big computer far away. Before it gets an answer, three things must be checked. Is this message allowed in? Which part of the computer should get it? Which copy of that part should do the work?
The first helper is called a gateway. A gateway is like the porter. It checks who you are. It makes sure you do not knock too many times. Then it sends you to the right room.
The second helper is called a load balancer. A load balancer is like the rota. Sometimes there are many copies of the same room. The load balancer picks one that is not too busy. If a copy gets sick and stops answering, it stops sending work there until it is well.
The room still checks too. The gateway can say you are a real person. But only the room knows if this thing is yours to see. Jesus said it like this. [[John 10:3]] The porter opens the door. The sheep still know the voice of their own shepherd.
The email said one more wise thing. Do not add helpers you do not need. Pick the simple way that does the job. The Bible says this about a farm. [[Proverbs 14:4]] An ox is a big help when there is a big crop. If there is no crop, the ox just makes a mess.
OUR OWN APP. Our app talks to a computer at our church. So we checked how it does it, by reading our own files.
First, your phone never talks to the church computer by itself. It talks to our app's own website. A small helper there carries the message the rest of the way. It does not let other websites send changes. Every answer it gives has a little tag that says I carried this.
Second, there is a list of paths. Each path goes to one room. Photos have a room. Taxes have a room. The reading voice has a room.
Third, each room has a lock. You need the family key to get in. The reading voice will only read for two people at a time. The next one hears, please wait.
We do not have a load balancer. Each room has just one copy. We are a family, not a giant store. That is the simple way, like no ox when there is no crop.
THE WRONG ROOM. Sometimes a path had no room yet. Then the message went to some other room by mistake. That other room said, I am fine! Our app believed it. But it was the wrong room talking. This happened three times.
So now our app asks, who is talking? It only trusts an answer from the right room.
The Bible has a story like this. King David waited at the gate for news. A man named Ahimaaz ran up first. The king asked him the big question. He did not know the answer. [[2 Samuel 18:29]] So the king told him to step aside and wait. The next runner had the real news. The first one to answer is not always the one with the answer.
JESUS IS THE DOOR. Jesus said this about Himself. [[John 10:9]] He is the Lamb of Yahweh. [[John 1:29]] [[John 3:16]] He holds everything together. [[Colossians 1:17]] Every door keeper in the Bible kept a door to His house.
Think about your own home. Who opens the front door? Who takes turns with the dishes? When a voice says, it's me, do you check who it is? Those are the same two jobs.
A ROTA AT HOME. Try this at your house. Make a list of the jobs that need doing every day. Feed the dog. Set the table. Take out the trash. Then write names next to them, and change the names each week. Now nobody does all of it, and nobody gets left out. That is what King David did with his twelve groups.
FOUR THINGS TO DO. Keep the door with care. Take turns with the work. Check who is really talking. Do not add more than you need.
${FACTS.child}
${TALK.child}`;

const YOUTH = `${TITLE}.
WHO SENT THIS. Darrell forwarded a newsletter from Level Up Coding with one word above it: Lesson. It was about two parts that sit in front of the computers behind an app. Both pass messages along, and each one can do some of the other's work. So do you need both?
THE WORD FIRST. Start in an old house of worship. When the priest Jehoiada set it in order, he put guards at its doors. [[2 Chronicles 23:19]] A porter decides who comes in. Then turn to King David's kingdom. Its work was split into twelve equal groups, and each group served for one month before the next took over. [[1 Chronicles 27:1]] A course decides which of many equal teams carries the load right now. Those are two jobs and two questions. Paul names what holds them together. [[1 Corinthians 12:5]]
KEEPERS OF THE GATE. The porters were chosen and counted, not random people standing by the door. [[1 Chronicles 9:22]] They lived close by because opening the house each morning was their duty. [[1 Chronicles 9:27]] Every gate got its keepers, small and great. [[1 Chronicles 26:13]] Nehemiah made rules for the gates: when to open, when to shut, and who watches. [[Nehemiah 7:3]]
SHARING THE LOAD. Moses tried to settle every case himself, from morning until evening. Jethro told him he would wear out. [[Exodus 18:18]] So the easy cases went to many helpers, and the hard ones came to Moses. [[Exodus 18:22]] Look closely and you can see both jobs in that one plan. Hard cases were routed to the right judge. Ordinary cases were spread out.
THE THREE QUESTIONS. Picture an online store with three services: users, orders and payments. A shopper asks to see her past orders. Before a server answers, three things must be decided. Is she allowed? Which service handles it? Which copy of that service does the work?
A gateway answers the first two. It checks her login, applies rules like how many requests she can make in a minute, and sends the request to orders, not to payments. A load balancer answers the third. There may be three copies of the orders service running, and it picks one that is healthy and not overloaded. If a copy stops answering its health checks, the balancer stops sending it work until it recovers.
There are two kinds of balancer. One only looks at addresses and ports and never opens the message. The other reads the web request itself, like the path, and can send different paths to different services. That second kind is starting to do a gateway's routing job, which is why people get confused.
The newsletter warns that a gateway is not the whole lock. It can tell that a shopper's login is real, but only the orders service knows if order number one two three is hers. Jesus described those two layers. [[John 10:3]]
The best advice comes last. Use the simplest setup that does what you need. If one tool can do both jobs for you, a second one just adds things to break. Proverbs says it about oxen. [[Proverbs 14:4]] You keep the ox when there is a harvest to bring in.
WHY KEEP THEM APART. The difference is the job each one was built for. A balancer can check that a token is real, but it does not track how much of a partner's monthly limit is used up. A gateway knows who is calling. Keeping the jobs apart means you can change the rules without touching the servers. In Acts the apostles did the same thing when they chose seven men to serve the tables. [[Acts 6:3]] The serving was still done with care, and the teaching was not crowded out.
OUR OWN HOUSE. Our app talks to a server at our church, so we checked our own files to see how it answers the three questions.
The first door: your browser never calls the church server directly. It calls our own site, and one shared function there carries the request. That function exists because the tunnel to the server used to throttle browsers calling from another site. It also refuses changes sent from another website, and it tags every answer so we can tell when it is working.
The second door: the tunnel has a table of paths. Each path goes to one service on the server, like photos, taxes or the reading voice. The database has its own gateway, Kong, the same product the newsletter names.
The third door: each service has its own lock. The tax archive lets nobody in if no key is set up. The photo server and the voice check the family's key. The voice will only read for two people at once, and the third gets a busy answer.
We have no load balancer. Each path goes to one copy on one machine. If the main reading voice is down, the app switches to a lighter voice. That is a backup, not a balancer. For a family, simple is right.
WHAT A BUILDER CAN DO. If you ever build an app, you can use these ideas from day one. Write down the three questions for each request your app gets, and next to each one write which part answers it. If a part has no answer for one of them, that is a gap. Give every door a lock, even if a gate sits in front of it. Make your app say clearly when a path goes nowhere, instead of letting something else reply. And before you add a new tool, ask what harvest it will carry. Most small projects need one server and one good door. You can add more later when the crowd is real.
WHEN A STRANGER ANSWERS. A path with no service behind it does not fail loudly. The message slides to the tunnel's root and some other service answers. Tax reads did this for about seven weeks. The voice's health check was answered by the wrong program in September, and then by the camera service in November. Each time the check only asked, did it say ok?
Now it asks, who said ok? Only the voice's own answer counts.
Second Samuel has the same story. David waited at the gate for news of the battle. Ahimaaz ran in first, but when the king asked about his son, he had no real answer. [[2 Samuel 18:29]] The king had him step aside, and the next runner brought the real word. Being first is not the same as being right.
You meet this every day. A text says it is from your bank. A video says it shows the news. A friend repeats something he heard. Before you act, ask who really sent it, and whether they were the one who could know.
THE DOOR. Jesus said He is the door. [[John 10:9]] He is the Lamb of Yahweh, [[John 1:29]] [[John 3:16]] the Eternal Son, [[Hebrews 1:8]] who holds all things together. [[Colossians 1:17]] Every gatekeeper in Scripture kept a door to His house.
FOUR HABITS. Know who keeps each door. Share the load in turns. Ask who really answered. Do not add what you do not need.
${FACTS.youth}
${TALK.youth}`;

const TEEN = `${TITLE}.
WHO SENT THIS. Darrell forwarded a Level Up Coding issue by Nikki Siapno with one word on top: Lesson. Its question sounds technical but it is really about responsibility. Two components sit in front of an app's servers, both forward requests, and their features overlap. Why would anyone run both?
THE FRAME. Start with two offices in Scripture. When Jehoiada restored order to the house of worship, he stationed gatekeepers. [[2 Chronicles 23:19]] Their whole job was the question of entry. Then look at how David organized the kingdom's service, in twelve equal divisions rotating month by month. [[1 Chronicles 27:1]] Their job was a different question, about which equal team carries the work right now. Paul says both kinds of office answer to one Master. [[1 Corinthians 12:5]] Keep those two questions separate in your head, because the newsletter is about to separate them in code.
THE GATEKEEPERS. These were not volunteers who happened to be nearby. They were selected and numbered. [[1 Chronicles 9:22]] They lived around the house because the morning opening was their charge. [[1 Chronicles 9:27]] Gates were assigned by lot, no gate left without a guard. [[1 Chronicles 26:13]] Nehemiah wrote the gate policy, which covered opening hours, who stands guard, and who watches each section. [[Nehemiah 7:3]] That is authentication, policy and routing, all done by people.
THE ROTA. Moses tried to be the single server for a whole nation, and Jethro saw the crash coming. [[Exodus 18:18]] His fix split the work two ways. Ordinary cases were spread across many judges, and hard cases were routed up to Moses. [[Exodus 18:22]] In one verse you get load distribution and routing by kind.
THE ARTICLE. Picture an online store with users, orders and payments as separate services, and a customer who requests her order history. Three decisions happen before any server responds. Is the request allowed? Which service owns it? Which instance of that service should process it?
An API gateway handles the first two. It validates credentials. It enforces policies like rate limits and quotas. It can rewrite requests and keep old API versions working. Then it routes the request to the orders service. A load balancer handles the third. It spreads traffic across healthy copies of orders. It runs health checks. It pulls a failing copy out of rotation until it recovers. Clients see one stable address the whole time.
The article also separates layer four from layer seven. Layer four balancing works on IP addresses and ports. It never opens the request, so it works for non-web traffic too. Layer seven balancing reads URLs, hostnames and headers. So it can send one path to checkout and another to search. That is routing, and it is where the two components start to overlap.
Two warnings stand out. First, a gateway does not replace the service's own authorization. It can confirm the token, but only orders knows whether this customer may see that order. Jesus described the same two layers. [[John 10:3]] The porter opens, and the sheep still check the voice. Second, do not add components for their own sake. Use the simplest architecture that meets the requirement. [[Proverbs 14:4]] An ox is worth its upkeep only when there is a harvest.
THE REAL DIFFERENCE. It is not where each sits or what features it has. It is responsibility. A balancer can validate a partner's token, but it does not track that partner's monthly quota. A gateway knows the consumer, not only the request. Keep the jobs separate and you can change policy without touching distribution. You can also add servers and no client will notice. The apostles did the same in Acts when they delegated the food distribution. [[Acts 6:3]] Separation of duties protected both the serving and the teaching.
OUR OWN STACK. Our app talks to a server at our church, so here is how it answers the three questions, read from our files.
Same origin: the browser never calls the server directly. It calls our own site, where one shared function proxies every route. Why does it exist? The tunnel used to throttle browser calls from other sites. It sent back busy errors before the call reached the server. The function also refuses writes from other origins, and it stamps every response with a header so a probe can prove the function ran.
Path table: the tunnel mounts each path to one local port, for photos, taxes, the reading voice and the database. That table is our routing. The database stack's front door is Kong, an actual API gateway, the same one the article names.
Locks: each service checks its own bearer token in constant time. The tax service fails closed, so with no token configured nobody gets in. The voice forwarder also limits itself to two readings at once and sends the next caller a busy response, which is rate limiting on a single door.
No balancer: every path maps to one instance on one machine. The reader does fall back to a lighter voice when the main one is down, but that is failover between two different engines, not distribution across identical copies. At our scale, adding a balancer would be an ox with no harvest.
TRY IT YOURSELF. You can map any app this way, even one you only use. Pick one action, like sending a message. Ask who checks that it is really you. Ask what decides which service gets it. Ask how many copies of that service might be running. You will not always find out, but asking trains your eye. Then do the same with your own life. Who checks what comes into your mind? What decides where your time goes? Where are you the single server for a job that should rotate? A builder who can see the three questions in a stack can see them at home too.
THE BUG WE KEEP MEETING. When a path has no mount, the request does not fail. It falls through to the tunnel's root and some other service answers. Tax reads did this for about seven weeks. The voice health check got the old workflow editor's page in September, and the camera service's healthy reply in November. Both times the check asked only whether the reply said ok.
The fix is to check who replied. Only a body that identifies itself as the voice counts now. Everything else reads as down, and the reader falls back right away.
David lived this. He was waiting at the gate, and the first runner to arrive, Ahimaaz, had nothing real to report. [[2 Samuel 18:29]] So David told him to stand aside, and he asked the runner who actually carried the message. First response is not the same as correct response.
THE DOOR. Jesus did not claim to be one route among many. [[John 10:9]] He is the Lamb of Yahweh, [[John 1:29]] the Eternal Son, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]]
FOUR MOVES. Name who answers each of the three questions. Let the service still check after the gate. Make a missing route fail loudly. Run the simplest stack that does the job.
${FACTS.teen}
${TALK.teen}`;

const SENIOR = `${TITLE}.
WHO SENT THIS, AND WHEN. Darrell forwarded an issue of the Level Up Coding newsletter, written by Nikki Siapno and dated the eleventh of November, with a single word above it: Lesson. Its subject is the pair of components that commonly stand before a company's servers. Both forward requests, and in their modern forms each has acquired some of the other's capabilities, so the author asks whether a builder genuinely requires both.
THE FRAME. Two verses govern the hour. When Jehoiada the priest restored the order of the house of worship, he appointed keepers to its entrances. [[2 Chronicles 23:19]] Theirs was the question of admission. The kingdom's service under David was apportioned among twelve divisions of equal strength, each attending in its appointed month. [[1 Chronicles 27:1]] Theirs was the question of which among equal companies should bear the present burden. The apostle names the unity beneath such distinctions. [[1 Corinthians 12:5]]
THE OFFICE OF THE PORTER. The keepers of the gates were neither casual nor anonymous. They were chosen, reckoned and established in their office. [[1 Chronicles 9:22]] They lodged about the house, since its opening each morning was committed to them. [[1 Chronicles 9:27]] Every gate was allotted its ward, the lesser and the greater alike. [[1 Chronicles 26:13]] Nehemiah, restoring the city, prescribed when the gates should open, who should stand by them, and how the watches should be kept. [[Nehemiah 7:3]] Admission, terms and direction were thus a charge entrusted to particular men.
THE COURSES. Moses once sat alone in judgment from morning until evening, and Jethro foresaw the consequence. [[Exodus 18:18]] His counsel divided the burden in two respects at once. The ordinary matters were distributed among many capable men, while the weighty ones were referred to Moses himself. [[Exodus 18:22]] The same verse thus contains both distribution and direction by kind.
THE ARTICLE, IN OUR WORDS. The author imagines an online shop whose work is divided among three services, for users, for orders and for payments, and a customer who asks to see her past orders. Three determinations precede any reply. Is the request permitted? Which service ought to receive it? Which of that service's several servers ought to perform the work?
The gateway, in the author's account, makes the first two determinations. It verifies the caller's credentials and enforces policy, including limits on the rate of requests, quotas, the reshaping of requests and the support of older versions of an interface, and it directs the request to the appropriate service. The load balancer makes the third. It distributes requests among identical servers, examines their health continually, and withholds work from any server that ceases to respond until it recovers, while the client continues to address a single unchanging point.
The author distinguishes further between balancing at the fourth layer, which considers only addresses and ports and never examines the request, and balancing at the seventh, which reads the path, host and headers and can therefore route. At that point the two components begin to overlap.
Two cautions deserve emphasis. A gateway may confirm that a token is genuine, yet only the service that holds the order can judge whether this particular customer may see it, so admission at the gate does not discharge the service's own judgment. The parable of the fold that Jesus told presents precisely these two layers. [[John 10:3]] The second caution is that architecture should be no more elaborate than the requirement demands. [[Proverbs 14:4]] The ox repays its keep only where there is a harvest to gather.
THE TRUE DISTINCTION. The author locates the difference not in position or in features but in responsibility. A balancer may validate a partner's token without knowing how much of that partner's monthly allowance has been consumed, whereas a gateway knows the consumer and not merely the request. With these responsibilities kept distinct, policy may change without disturbing distribution, and capacity may grow without any change visible to the client. The apostles followed the same principle when they committed the daily ministration to others. [[Acts 6:3]] The serving was not neglected, and the ministry of the Word was not crowded out.
THIS HOUSE, EXAMINED. The family application addresses the church's own server, and its arrangement has been examined against its records.
The browser never addresses that server directly. It addresses the application's own site, where a single shared function conveys every route onward. That function was introduced because the public tunnel throttled requests made from another site, refusing them before they arrived. It also declines any write originating from another site, and it marks each response with a header that proves the function itself replied.
The tunnel keeps a table in which each path is mounted to a single local service: photographs, the tax archive, the reading voice and the database. That table performs the routing. The database's own entrance is Kong, a true gateway and the very product the author mentions.
Each service then applies its own lock. The tax archive admits no one at all when no token has been configured, and the photograph server and the voice's forwarder compare the household's bearer token in constant time. The forwarder further limits itself to two concurrent readings and returns a busy reply to any further caller, which amounts to a gateway's rate policy applied at a single door.
There is no load balancer. Every path leads to one service on one machine. When the principal reading voice fails to answer, the reader turns to a lighter one, but that is a failover between dissimilar voices rather than a distribution among identical servers. At a household's scale the author's own counsel applies, and no ox is kept where there is no harvest.
THE RECURRING FAULT. A path with no mount does not fail openly. The request falls through to the root of the tunnel, and another service replies in its place. The tax archive's reads did so for some seven weeks. The voice's health check was answered in September by the editor page of the former workflow engine, and in November by the camera service, which reported itself well. On each occasion the check asked only whether the reply said ok. It now asks whose reply it is, and anything that does not identify itself as the voice is treated as absent.
The narrative of Absalom's death records the same discernment. David waited between the gates, and the first runner to arrive could not answer the one question that mattered. [[2 Samuel 18:29]] The king set him aside and put the question to the messenger who had actually been sent. The first to answer is not necessarily the one who bears the answer.
THE DOOR. Jesus declared Himself the one true entrance. [[John 10:9]] He is the Lamb of Yahweh, [[John 1:29]] [[John 3:16]] the Eternal Son whose throne endures, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]] Every porter and every course in Scripture served a house that is His.
FOUR PRACTICES. Know which part of a system answers each of the three questions. Let the service judge even after the gate has admitted. Cause a missing route to fail openly. Keep the arrangement as simple as the need allows.
${FACTS.senior}
${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded Level Up Coding's issue on the two components in front of a server, by Nikki Siapno, with ONE WORD typed above it: Lesson.
THE WORD FIRST. 2 Chronicles 23:19 opens the hour - the porters set at the gates, deciding who may enter - with 1 Chronicles 27:1 beside it - the courses that came in and went out month by month, sharing the load. [[2 Chronicles 23:19]] [[1 Chronicles 27:1]] Exodus 18:22 routes the great matter and spreads the small; John 10:3 keeps the shepherd's voice behind the porter's door; Proverbs 14:4 keeps no ox without a harvest.
THE NEWSLETTER, IN OUR WORDS. Every request raises three questions: may it come in, which service handles it, and which server does the work. A gateway answers the first two; a load balancer answers the third.
OUR OWN HOUSE. One shared function carries every road to the church's server; the tunnel's path table routes; each service keeps its own lock; there is no load balancer, because every path leads to one machine. Three times a path with no mount was answered by a stranger, and the voice's probe now asks whose answer it is.
THE TIERS. REPORTED: the products' features, as the newsletter gives them. ESTABLISHED: gateway versus balancer, layer four versus layer seven. MEASURED: our own files. NOT MEASURED: how many requests still land on the wrong service. ${REVIEW}.
LEFT OUT ON PURPOSE. The sponsor block, the images, the links and the comparison table.
PLACEMENT. Sovereign A.I., week 93, because a household that runs its own server must know who keeps each door.
CLOSE. [[John 10:9]] Jesus, the Lamb of Yahweh and the Eternal Son, is the Door.`,
  inApp: `One screen to read in this app, and one page in your Study.
In the app: open Sovereign A.I. week 93 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one is whole on its own. Then walk the doors of your own home, the front door, the phone and the inbox, and ask of each one the porter's question: who may come in here? [[2 Chronicles 23:19]]
In your Study, write three lines. One door in your life with no keeper. One load in your house that one person carries alone. One rota you will set up this week, and who will take the first turn. [[1 Chronicles 27:1]]`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[2 Chronicles 23:19]] [[1 Chronicles 27:1]] [[1 Corinthians 12:5]] [[Exodus 18:18]] [[Exodus 18:22]] [[John 10:3]] [[Proverbs 14:4]] [[2 Samuel 18:29]] [[John 10:9]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, each landing on your own house.
First, read 2 Chronicles 23:16-21 and 1 Chronicles 9:22-27. Mark everything the porters were charged with: who they let in, when they opened, where they lived. Write one sentence on a door in your life that nobody is keeping.
Second, read Exodus 18:13-26 and 1 Chronicles 27:1-3. Mark the two things Jethro's counsel does: what it spreads and what it sends up. Write down one load in your house that one person carries alone.
Third, read 2 Samuel 18:24-32. Mark the moment the king asks the real question, and who can answer it. Write down one place where you trusted the first answer and not the right one.
And one verification reading, because this course works this way. The product features in the newsletter are reported as it gives them. The difference between a gateway and a load balancer is established. Our house facts were read from our own files. How many requests still reach the wrong service is not yet measured. ${REVIEW}.`,
    plan: `PLAN. Decide four measures before the week starts, and decide who hears them.
One: the porter. Name one door in your home or work, and who keeps it.
Two: the course. Name one load that one person carries, and the rota that will share it.
Three: the runner. Name one answer you will check for its source before you trust it.
Four: the ox. Name one thing you were about to add that has no harvest yet, and set it aside.
Then name the person who will ask you about all four on the same day next week.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.
Keep the one door with care each day. Start the rota and take the first turn yourself. Ask who really answered before you act on an answer. Leave the ox in the field.
Teach the verse at a meal: he set the porters at the gates. Ask a child who keeps the door of your house.
At the end of the week, answer three questions to the person who is asking. Which door did you keep? Who took a turn? Which answer turned out to come from the wrong runner?
Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a newsletter about two components in front of a server, answered from the Word rather than from the newsletter.`,
    `The hour opened by 2 Chronicles 23:19, so a gateway is heard as the porter's office: who may come in.`,
    `1 Chronicles 27:1 laid beside it, so a load balancer is heard as the courses: which equal hand carries the load.`,
    `1 Corinthians 12:5 naming two offices under one Master, neither asked to do the other's work.`,
    `The porters' office traced through 1 Chronicles 9:22, 9:27, 26:13 and Nehemiah 7:3: chosen, lodged nearby, every gate kept, the policy written.`,
    `Jethro's counsel read as both jobs at once: the great matter routed, the small matters spread (Exodus 18:18, 18:22).`,
    `The three questions in front of every request taught plainly: allowed, which service, which server.`,
    `Layer four and layer seven told apart, and the place the two components blur named.`,
    `The gate that does not replace the service's own check, heard in John 10:3.`,
    `The simplest arrangement that meets the need, from Proverbs 14:4: no ox without a harvest.`,
    `Separation of responsibility drawn from Acts 6:3, so dividing the charge is heard as care that scales.`,
    `Our own house examined by its own files: one shared road, the path table, a lock on each door, and no load balancer.`,
    `Three routing failures named honestly, and the probe that now asks whose answer it is, read through 2 Samuel 18:27-32.`,
    `Jesus confessed as the Door, the Lamb of Yahweh and the Eternal Son (John 10:9).`,
    `The reported, the established, the measured and the unmeasured told apart in every reader place, with a dated re-review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: '1 Chronicles 27:1',
      title: 'The potluck with one serving spoon',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A small church held its first potluck in years, and one deacon volunteered to serve. He stood behind the long table with one spoon and a smile, and the line went out the fellowship hall door and halfway across the parking lot.
His wife watched for ten minutes. Then she put a second spoon in their teenage son's hand, sent him to the far end of the table, and told the line to split. The line split. It moved twice as fast, and nobody's mashed potatoes got cold.
She was not finished. A lady at the front was trying to explain to the deacon that she could not eat anything with nuts, and the whole line was waiting on that conversation. So she set their youngest daughter at the door with the sign-up sheet, to answer questions and point people to the right end of the table before they ever reached a spoon. By the next potluck the church had a serving rota pinned on the kitchen wall, a greeter at the door, and two spoons. The deacon said it was the best meal he had ever been allowed to eat sitting down.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: '2 Chronicles 23:19',
      title: 'The badge at the door and the band on the wrist',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A care home for elderly residents kept a front desk where every visitor showed identification and signed in. The desk was careful. It turned away people with no reason to be there, and it gave each approved visitor a badge.
One evening a visitor with a perfectly good badge walked down the wrong hallway. He was a real son, visiting a real mother. But he had been given the wrong room number, and he was about to sit down beside a frail woman who was not his mother, with a bag of food she was not allowed to eat.
The night nurse stopped him at the doorway. She did not ask about his badge. She looked at the band on the resident's wrist, looked at the name on his sign-in, and saw they did not match. She walked him to the right room herself. Afterward the director did not blame the front desk. The desk had answered its question correctly: this man may come in. Only the nurse at the bedside could answer the other one: is this person yours to see. The home kept both checks, and never again let the first stand in for the second.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In 2 Chronicles 23:19, what was the porters’ charge at the gates?',
        options: ['To collect an offering', 'To keep out anyone who should not enter', 'To count the people who left'],
        answer: 1,
        explain:
          'The porters were set at the gates so that none who was unclean in any thing should enter in. A porter answers the question of admission, which is the gateway’s first job.',
      },
      {
        q: 'What does 1 Chronicles 27:1 describe about the kingdom’s service?',
        options: [
          'One company served all year',
          'Equal companies came in and went out month by month, each carrying its turn',
          'Every man served whenever he chose',
        ],
        answer: 1,
        explain:
          'Twelve courses of twenty-four thousand each took their turn month by month. That is a rota of equal hands, which is what a load balancer keeps among identical servers.',
      },
      {
        q: 'How does Jethro’s counsel in Exodus 18:22 contain both jobs from the newsletter?',
        options: [
          'It does not; it only adds more judges',
          'Ordinary matters were spread across many able men, and the great matter was routed to Moses',
          'It sent every case to Moses faster',
        ],
        answer: 1,
        explain:
          'Spreading the small matters is distribution; sending the great matter to the one who could judge it is routing by kind. Exodus 18:18 shows why: one man alone wears out.',
      },
      {
        q: 'Which three questions does the newsletter say every request must settle?',
        options: [
          'How fast, how cheap and how big',
          'Is it allowed, which service should handle it, and which server should process it',
          'Who wrote it, when, and in what language',
        ],
        answer: 1,
        explain:
          'A gateway settles the first two, checking the caller and routing to the right service. A load balancer settles the third, choosing a healthy copy of that service.',
      },
      {
        q: 'What is the difference between a layer four and a layer seven load balancer?',
        options: [
          'Layer four is newer',
          'Layer four moves connections by address and port without reading the request; layer seven reads the path, host and headers and can route',
          'There is no difference',
        ],
        answer: 1,
        explain:
          'Because a layer seven balancer reads the request, it can send one path to one service and another path to another. That is routing, which is where the two components blur.',
      },
      {
        q: 'Why does a gateway not replace the service’s own check?',
        options: [
          'Because gateways cannot read tokens',
          'The gateway can confirm a token is valid, but only the service knows whether this caller may see this particular record',
          'Because services never check anything',
        ],
        answer: 1,
        explain:
          'John 10:3 has the two layers: the porter opens the door, and the sheep still know their own shepherd’s voice. The gate admits; the service still judges.',
      },
      {
        q: 'What does Proverbs 14:4 teach about adding a second component?',
        options: [
          'Always add more',
          'An ox is worth its upkeep only where there is a harvest; add a component when the need is real, not for its own sake',
          'Never use any components',
        ],
        answer: 1,
        explain:
          'The newsletter ends the same way: use the simplest architecture that meets the requirement, because a second component at the wrong scale only adds complexity.',
      },
      {
        q: 'In our own house, what answers the question of which service should handle a request?',
        options: ['A load balancer', 'The tunnel’s table of paths, where each path is mounted to one service on the server', 'Nothing at all'],
        answer: 1,
        explain:
          'Photos, taxes, the reading voice and the database each have their own mount. There is no load balancer: every path goes to one copy on one machine.',
      },
      {
        q: 'What went wrong three times when a path had no mount?',
        options: [
          'The request failed loudly and was retried',
          'The request fell through to the root of the tunnel and some other service answered in its place',
          'The server shut down',
        ],
        answer: 1,
        explain:
          'The tax reads reached the old workflow engine, and the voice’s health check was answered once by that engine and once by the camera service. The probe now asks whose answer it is.',
      },
      {
        q: 'What does the story of Ahimaaz in 2 Samuel 18:29 teach a builder?',
        options: [
          'The fastest runner is always right',
          'The first to answer is not always the one who carries the answer; ask who is speaking',
          'Never wait for news',
        ],
        answer: 1,
        explain:
          'Ahimaaz arrived first but could not answer the king’s question, so he was set aside and the question went to the messenger who had actually been sent.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read 2 Chronicles 23:19 aloud before you say one word about any computer. Then read 1 Chronicles 27:1 aloud and write two words on the board: porter and course. Then ask the room: in your home, who keeps the door, and who takes turns?
MINUTES 0 TO 12 - THE PORTERS AND THE COURSES. 1 Chronicles 9:22-27, 26:13, Nehemiah 7:3, and Exodus 18:13-26. Have someone list what the porters were charged with, and what Jethro's counsel spread and what it routed.
MINUTES 12 TO 27 - THE THREE QUESTIONS. Draw the shop: users, orders, payments. Walk one request through: allowed, which service, which server. Name the gateway's jobs and the balancer's jobs, then layer four and layer seven. Read John 10:3 for the check the gate does not replace, and Proverbs 14:4 for the simplest arrangement.
MINUTES 27 TO 35 - WHY THE JOBS STAY TWO. Responsibility, not position or features. Acts 6:3 as separation of duties done in love.
MINUTES 35 TO 50 - OUR OWN HOUSE. The one shared road, the path table, the lock on each door, the cap of two, and no load balancer. Then the three times a stranger answered, and 2 Samuel 18:27-32 for the runner who had no answer. Say plainly what is not yet measured.
MINUTES 50 TO 60 - THE DOOR. John 10:9, John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Give the four household habits and the week's assignment.
WHAT NOT TO DO. Do not turn this into a contest between vendors; the product claims are the newsletter's and are not ranked here. Do not teach that every household needs a load balancer; the point is the simplest arrangement that meets the need. Do not read the newsletter in a voice of authority over the Word; the Word frames the hour and the newsletter is its occasion.`,
    talkingPoints: [
      `He set the porters at the gates (2 Chronicles 23:19).`,
      `The courses came in and went out month by month (1 Chronicles 27:1).`,
      `Differences of administrations, but the same Master (1 Corinthians 12:5).`,
      `Every gate had its ward, the small and the great (1 Chronicles 26:13).`,
      `Too heavy for one: the great matter routed, the small matters spread (Exodus 18:18, 18:22).`,
      `Three questions: allowed, which service, which server.`,
      `A gateway checks the caller and routes; a load balancer spreads the work and checks health.`,
      `Layer four reads addresses; layer seven reads the request and can route.`,
      `The gate does not replace the service's own check (John 10:3).`,
      `No ox without a harvest: the simplest arrangement that meets the need (Proverbs 14:4).`,
      `Separate responsibilities so policy and capacity can change apart (Acts 6:3).`,
      `Our house: one shared road, a path table, a lock on each door, no balancer.`,
      `A path with no mount falls through, and a stranger answers.`,
      `Ask whose answer it is, not only whether it said ok (2 Samuel 18:29).`,
      `Jesus is the Door (John 10:9).`,
    ],
    discussionPrompts: [
      `Which door in your home or work has no keeper?`,
      `Which load in your house does one person carry alone?`,
      `Where has the gate in your life been trusted to do the service's job?`,
      `When did you act on the first answer instead of the right one?`,
      `What are you about to add that has no harvest yet?`,
      `How would a rota change the hardest week in your house?`,
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
console.log(`sov93: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov93: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov93: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov93: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov93: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov93: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov93: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov93: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov93: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov93: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov93: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov93: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov93: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov93: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov93: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov93: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov93: spliced ${ID}`);
console.log(`sov93: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov93: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
