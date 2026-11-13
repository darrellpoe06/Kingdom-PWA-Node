// =============================================================================
// sov85-fill - build Sovereign A.I. week 85 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[Matthew 7:25]],
// and this script replaces it with the corpus text followed by the reference.
// No verse on the page was typed from memory. The reference list on the
// module's anchor is DERIVED from the placeholders that actually occur in the
// reader places, so anchor.ref names every verse the lesson stands on and
// nothing it does not (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-11-03 at 14:10 UTC Level Up Coding (Nikki
// Siapno) sent the issue Chaos Engineering Clearly Explained. At 14:26:57 UTC
// - 8:26 AM Central - Darrell forwarded it out of his university mailbox into
// the lesson lane with ONE WORD typed above the forwarded header: Lesson.
// Gmail thread `1a1a1c0f5039a929`. The scheduled intake fell behind; this
// build drains it on 2026-11-13. The whole article came inside the email; one
// figure (a table of common practices) arrived as an image and is not taught.
// The sponsor block (an enterprise developer-platform pitch) is left out.
//
// THE NUMBER. sov83 (#2677) and sov84 (reserve/sov84, another session) were in
// flight on origin when this build claimed reserve/sov85 with an empty lease.
// Weeks must be contiguous on main, so HELD_IN_FLIGHT records [83, 84] in
// sovereign-ai-class.test.js and this week lands only after both.
//
// WORD FIRST (DR-0127 / DR-0282). Matthew 7:25 and 7:27 - one storm, two
// houses - and 1 Corinthians 3:13 - the fire shall try every man's work -
// frame the hour before a single word about chaos engineering.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). ESTABLISHED and stated
// plainly: chaos engineering is a recognized discipline and its method is the
// five steps the newsletter gives. ILLUSTRATION, not event: the newsletter's
// failing instance, doubling traffic and vanished database. MEASURED in our
// own house, each with file:line in DR-1500: the proven-to-catch rule
// (CLAUDE.md:366) and its count on main fd36c00 (1,959 test files, 557 with a
// PROVEN-TO-CATCH case, at least 668 such cases); the deploy roads test's
// planted faults (the-deploy-has-more-than-one-road.test.js:129, :219, :226);
// the outside witness's steady state (site-health.yml:12-25, :201); the
// restore drill into a scratch database (infra/nas-db-backup/db_backup.sh:25-27,
// :36-38, :133-165); the brakes after the June runaway (CLAUDE.md:264-272);
// the second road (deploy-cloudflare-pages.yml:113, :118-157); and the run
// logs of 2026-11-13 (deploy runs 43450624384 and 43456540749 refused by
// Cloudflare at 15:22:21Z and 15:56:56Z; 43455120931 and 43458440928 went
// through; every run read took `anon key road: served-site`; site-health
// 43458313166 read UP but STALE, SERVED c5f2ec3, at 16:03:01Z). NOT MEASURED:
// the restore drill's last result on the NAS, which was out of reach.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 85;
const ID = 'sov85-and-it-fell-not';
const TITLE = 'And it fell not - the storm that comes to every house, the test you run before it comes, and the second road that held';

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
  if (!m) throw new Error(`sov85: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov85: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov85: reference does not resolve in the corpus -> "${ref}"`);
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
    "WHERE WE STAND ON THE FACTS. The whole article came inside the email, so this hour is taught from all of it; one figure in it, a table of common practices, arrived as an image and not as words, so nothing is taught from that table. ESTABLISHED, and stated plainly: chaos engineering is a real and recognized discipline, and its method is the one the newsletter gives - know what healthy looks like, say what you expect, introduce a realistic failure under control, watch, and learn - with the experiment kept small until confidence is earned. ILLUSTRATION, not event: the instance that fails over, the traffic that doubles and the database that disappears are the newsletter's teaching examples, not reported happenings. MEASURED in our own house: every claim below about this app's checks, its outside witness, its two roads and its drill is traced to the file and line that does it, and every claim about the thirteenth of November is read from the run records of that day. NOT MEASURED: whether the weekly restore drill on the family's own server has passed lately. That server was out of reach from this session, and the runner's road to it was shut that same day, so the lesson teaches what the drill is built to do and claims nothing about its last result. re-review: 2026-11-27.",
  child:
    'WHAT IS SURE AND WHAT IS NOT. The whole email came to us. One picture in it did not come as words, so we left it out. Testing a thing by breaking a small part on purpose is real. Builders really do it. The stories in the email about a part that stops and a crowd that doubles are made up to teach. They did not really happen. What we say about our own app, we checked in its code and in its records from that day. The home computer was out of reach, so we could not see if its last practice went well. We will look again. re-review: 2026-11-27.',
  youth:
    "WHAT IS SURE AND WHAT IS NOT. The newsletter came whole in the email. One table in it came as a picture and not as words, so it is not taught here. Chaos engineering is established. Real teams test their systems by breaking them on purpose, a little at a time, and the five steps in this lesson are how they do it. The server that stops and the traffic that doubles are examples made up to teach, not real events. What this lesson says about our own app was checked in its code and in the records of the thirteenth of November. The family's own server was out of reach, so we know how its practice restore is built but not how the last one went. re-review: 2026-11-27.",
  teen: "WHAT IS SURE AND WHAT IS NOT. Know what we had. The whole article came in the email. One table in it came as a picture, so we left it out. Chaos engineering is established. It is a real practice, and its steps are the ones in this lesson. The server that drops and the crowd that doubles are teaching examples, not real events. Our own app was checked in its code and in the logs from the thirteenth. The home server was out of reach, so we know how its weekly drill is built, not how the last one went. re-review: 2026-11-27.",
  senior:
    'WHERE WE STAND ON THE FACTS. The newsletter arrived whole within the email, so this hour rests on the entire article; a single table of practices came as an image rather than text, and nothing is taught from it. Chaos engineering is an established discipline, and the method described here is the one its practitioners use; that is stated plainly. The failing server and the doubling of traffic are illustrations, not reported events. Everything said about our own house is traced to its code and to the run records of the thirteenth of November. The household server was out of reach from this session, so the lesson describes how the weekly restore drill is built and claims nothing about its most recent result. re-review: 2026-11-27.',
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - what is something in our house you are sure would hold if it were tested, and how do you know - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Matthew 7:25. Children, ask your mother, your father or a grandparent about a storm, a layoff or a sickness that tested the family, and what held when it came; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what is one thing each of us depends on that has only one road, and what would the second road be. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - what in our house would still work if the lights went out - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Matthew 7:25. Children, ask your mom or your dad or your grandma or your grandpa about a big storm they remember. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what do we do if the thing we need breaks. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what would you do first if the internet went out for a whole day - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Proverbs 27:23. Children, ask your mom, your dad or a grandparent about a time something broke at the worst moment and what saved the day; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: what is one thing we each count on that has never once been tested. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when did a test show you something about yourself you did not know - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Lamentations 3:40. Children, ask your mom, your dad or a grandparent about a time they had a backup plan and needed it, and hear all of it before you reply; then retell their answer in your own words. Then ask a friend this: what is one thing we each say would hold, and how could we check it this week in a small, safe way. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what do you think would still be standing in this family if the hardest year came again - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, 1 Corinthians 3:13. Children, ask your parents or your grandparents about the hardest season the family came through, and what held it together; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: which of the things we lean on has only one road, and which has never been tried. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the third of November 2026, at twenty-six minutes past eight in the morning, Central time, Darrell forwarded a short engineering newsletter out of his university mailbox into this lane. Above the forwarded header he typed ONE WORD: Lesson. That word is the ask. The newsletter is only the occasion; no article is the foundation of an hour in this course. The scheduled intake fell behind, and the lesson was built by hand ten days later.

THE WORD FIRST, BEFORE ANY MACHINE. Two passages frame this hour, and everything after them is application. The first is the close of the Sermon on the Mount. Jesus describes two builders, and then He sends the same weather to both houses. To the wise man's house: [[Matthew 7:25]] To the foolish man's house: [[Matthew 7:27]] The second is Paul, writing to builders of another kind: [[1 Corinthians 3:13]] The storm is not a maybe in either passage. Rain comes to both houses. Fire comes to every man's work. What differs is what was found standing afterward. Hold that, and then hear the article.

WHAT THE NEWSLETTER TEACHES. Its subject is chaos engineering, and its opening question sounds backwards: why would a team that keeps a system running deliberately break it? Its answer is that large systems rarely fail the way their builders pictured, and until a failure happens you do not know whether the design holds. So a team causes a small, controlled failure on purpose, watches, and learns while the experiment is still in its own hands.

The method has five steps. First, define the steady state: what healthy looks like, in numbers. Second, form a hypothesis: if this one piece fails, this is what we expect. Third, introduce a realistic failure. Fourth, observe. Fifth, learn, change what needs changing, and run it again. The hard part, the article says, is where to run it. Production is the most realistic place and the most dangerous one. So you control the blast radius: one instance instead of a whole service, a sliver of traffic instead of everyone, a practice ground before the real one, and an automatic stop if it goes wrong. It closes with a sentence worth keeping: do not create failure to see what breaks; create controlled failure to find what needs to become stronger.

This is close to home: PoeTech runs a live site the family and the church open every day, and a server in the house that holds its records.`,
  FACTS.lesson,
  `MOVEMENT ONE: THE STORM IS NOT AN IF. The newsletter's most honest line is its plainest: there will be failures. Jesus said the same about the life of His people, without softening it: [[John 16:33]] And the Preacher said it about everyone under the sun: [[Ecclesiastes 9:11]] Time and chance happen to them all - the swift, the strong and the skilled.

On a sunny afternoon the two houses look the same; the difference was real the whole time, but hidden until the weather came. That is the problem chaos engineering exists for. A system that has never met its storm is not proven strong. It is only unproven. Luke's telling shows where the wise builder did his proving - underground, before the rain, when he dug down to the rock: [[Luke 6:48]] The digging was the test he ran on his own foundation before the flood ran it for him.`,
  `MOVEMENT TWO: KNOW THE STATE OF THY FLOCKS. The first step is to know what healthy looks like, because you cannot see a change in something you never measured. Solomon made it a shepherd's duty: [[Proverbs 27:23]] Not a guess about the flock. Its state, known, and looked at well.

Our house learned this the hard way, and the record keeps the date. On the eighth of July the app was reported down while every deploy in the record was green. Every safeguard was watching the pipeline that builds the site, and not one of them had ever asked the site itself whether it answered. Out of that day came a witness that visits the live site from outside and defines healthy in plain measures: is it up, is it intact, is it fresh - the newest build - and is it usable, with the database behind it answering? When freshness cannot be read, it does not call it fresh. That is a steady state, written where a machine checks it.`,
  `MOVEMENT THREE: A TEST THAT COULD FAIL. The second and third steps belong together: say what you expect, then introduce a real failure and see. A test is only worth something if it could have come out the other way. Elijah understood that on Mount Carmel. Before he asked for fire, he made the test harder on purpose, so that nobody could say afterward it had been arranged: [[1 Kings 18:34]] Three times the water. And then he named the line that kept it from being a stunt: [[1 Kings 18:36]] At His word. He did not stage a test of Yahweh for his own curiosity. The Word forbids that plainly: [[Deuteronomy 6:16]] What we put under test is our own work and our own hearts, never the Lord. Paul turns the test where it belongs: [[2 Corinthians 13:5]]

The test also has to be realistic. When Yahweh thinned Gideon's army, He did not ask the men how alert they felt. He sent them to the water, where tired men actually drink, and watched what they did there: [[Judges 7:4]] The conditions were the real ones. The newsletter makes the same point: a random failure may be interesting, but a realistic one tells you how the system will behave on the day it matters.

Our house has a rule that is chaos engineering at the level of the code: a check that always passes is itself a lie. So no check ships in this project until it has been shown to CATCH the thing it guards against: a break is planted on purpose, and the check must turn red. On the morning this lesson was built there were 1,959 test files in the app, and 557 of them carry at least one case built exactly that way - at least 668 such cases in all. Some of them are fault injection in the newsletter's own sense. The tests for the deploy's two roads hand the code a live site that cannot be reached, a database that is away, and a job that hangs, and they require the code to refuse loudly, name the trouble, and kill the hung job at its time limit rather than wait forever.`,
  `MOVEMENT FOUR: TWO BANDS, AND A SMALL FIRE FIRST. The newsletter's answer to its hardest problem is to keep the blast radius small. Jacob did that the night before he met his brother. He did not know whether Esau was coming in peace, so he arranged his household so that one blow could not take everything: [[Genesis 32:7]] [[Genesis 32:8]] Two bands. If one is struck, the other escapes. That is failover and blast radius in one sentence. The Preacher gives the same counsel for people: [[Ecclesiastes 4:9]] [[Ecclesiastes 4:10]] [[Ecclesiastes 4:12]]

And the newsletter's other counsel - start small, prove it in a safer place, then widen it - is how the Word itself raises people into responsibility: [[Luke 16:10]] And of those who would serve the church: [[1 Timothy 3:10]] First proved, then trusted with more.

Our house has a drill of exactly this shape. The household's own server backs up the database every night, and on drill days it does something most backups never do: it restores the new copy into a separate scratch database, counts the people and the tables in it against the live one, and then throws the scratch copy away. The script says why in one line: a backup that has never been restored is a claim. And it keeps the blast radius at nothing - it reads the live database and never writes to it; the restore goes only into its own scratch room. And after a fleet of timed jobs ran away in June while Darrell traveled, and had to be shut down by hand, nothing that runs on a clock ships active without a budget that ends a run and a lock that stops two runs stacking. The newsletter calls these abort conditions; the house calls them brakes.`,
  `MOVEMENT FIVE: THE DAY THE RAIN CAME. On the thirteenth of November, the day this lesson was built, two storms reached our deploy lane in the same hour, and neither was planned.

The first was a closed road. To build the site, the deploy needs one public key that the household server holds, and it normally asks the server for it over a private network. That day the server did not answer over that network. Before the twenty-eighth of October, that alone would have stopped every deploy: on that day the same kind of refusal left the site serving an old build for more than five hours. Out of that outage a second road was built. The key is public by nature - every browser that opens the site downloads it - so when the server does not answer, the deploy reads the key back from the live site itself, and refuses rather than guesses if anything looks wrong. On the thirteenth, all seven deploy runs we read from that day said in their own logs that they took the second road, and the build went on.

The second storm was the hosting company. At 9:22 in the morning, Central time, Cloudflare refused to publish the site with an unknown internal error. At 9:56 it refused again, answering that it had no healthy upstream. Neither refusal took the site down. A failed publish leaves the last good build in place, and the deploy is written to fail closed: if it cannot ship the whole thing, the live site keeps what it had. Seven minutes after the second refusal the outside witness visited the site, found it up but serving the older build, said so, and asked for the deploy again. Each refusal was followed by another deploy that went through.

The Preacher was right about the two, and on that day the second road was not a theory. But here is the honest finding, and this lesson is the place to say it. The second road has been proven by real storms, not by a drill. Nobody has yet closed the first road on purpose, on a quiet day, with a hypothesis written down, to watch the second road take over. Our code-level tests plant breaks by the hundred; the household server rehearses its restore every week; but the deploy's roads have only been exercised when the weather chose. That is the newsletter's own counsel left undone, and it is written down for the Governor with a date, because a change to the deploy lane has to be proven live before it is called done.`,
  `MOVEMENT SIX: SEARCH AND TRY OUR WAYS. The experiment is not finished when the fault is removed. The newsletter's last step is learning: what did we expect, what happened, what surprised us, what protected us, and what changes before we run it again. Jeremiah said it in a ruined city: [[Lamentations 3:40]] Search, try, and turn. And the righteous are not those who never fall: [[Proverbs 24:16]]

Our house turns its falls into checks. Every outage named above left something standing behind it: the July report of a down site left the outside witness; the October closed road left the second road; the June runaway left the brakes. A smaller one sits inside this very course: when one week's lesson was lost this autumn before it was saved, the hole in the numbering turned ten checks red at once - an unplanned experiment that corrected an earlier count of seven, because the same rule had been written two different ways. The failure became information, which is the whole point.`,
  `MOVEMENT SEVEN: THE TRIED STONE. Bring it home, to the One whose foundation has never failed a test. Long before the Sermon on the Mount, Isaiah heard Yahweh describe the cornerstone He would lay: [[Isaiah 28:16]] A tried stone. Jesus is that stone. He was tested as no system ever will be: [[Hebrews 4:15]] Tested at every point, and found without sin. Every other foundation is measured against Him: [[1 Corinthians 3:11]] And unless He builds, the builders labour in vain: [[Psalm 127:1]]

He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] and by Him the whole creation holds together: [[Colossians 1:17]] Every drill we run on our small house is practice for the day the rain comes. The house that stands is the one built on Him.`,
  `FOUR THINGS THIS WEEK, and none of them needs a purchase.

One, know the steady state. Pick one thing your household depends on - the monthly money, the car, the internet, the medicine schedule - and write down in a sentence what normal looks like, so you can tell when it is not.

Two, run one small drill, at a quiet time, with a way back. Turn the internet router off for fifteen minutes on a calm evening and see what stops. Or pretend the main phone is lost and see whether anyone else can reach the doctor, the bank and the family. Small blast radius, real conditions, and an end time.

Three, build one second road. Find one thing that has only one way through - one key, one person who knows the password, one ride to church - and make a second.

Four, hold the review afterward. Ask the five questions out loud: what did we expect, what happened, what surprised us, what protected us, and what will we change before we try it again.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that breaking things is clever, or that every risk should be tested in the open. Not testing Yahweh, ever. The point is honesty about strength: a house that has never met its storm is unproven, not strong; know your normal, test your own work in small and realistic ways, keep a second road, and learn from every fall. And build on the Rock, because the rain is coming to every house.`,
  TALK.lesson,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader, not a
// re-registering of the adult text, and each carries the whole teaching, the
// tiers and the talk-together close (DR-0795).
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

DOES IT HOLD? This lesson asks one question. How can you know a thing is strong before the storm comes?

WHO SENT THIS. Darrell got an email. It was about people who build big computer systems. He wrote one word on top. The word was Lesson. Then he sent it to us. That one word is why you are reading this.

THE WORD FIRST. Jesus told a story about two men. Each man built a house. One built on rock. One built on sand. Then a big storm came to both houses. Here is the house on the rock. [[Matthew 7:25]]

It did not fall! Now here is the house on the sand. [[Matthew 7:27]]

It fell. On a sunny day the two houses looked the same. Only the storm showed which one was strong.

AND ONE MORE VERSE. Paul said our work will be tested too, like gold in a fire. [[1 Corinthians 3:13]]

Fire shows what a thing is made of.

WHAT THE EMAIL SAID. Big computer systems break sometimes. A part stops. A line gets slow. Too many people come at once. Builders know this will happen. So some builders do a funny thing. They break a small part on purpose! They do it on a calm day, when they are ready. Then they watch what happens. If something goes wrong, they fix it before a real storm comes. This is called chaos engineering. Chaos means a big mess. But this is a small mess, made on purpose, so we can learn.

WHY BREAK THINGS ON PURPOSE? Think about a fire drill at school. Nobody wants a fire. But you practice anyway. You line up. You walk out the door. You learn the way out on a calm day. Then if a real fire ever comes, you already know what to do. That is what these builders do with their computers. They practice the hard day on an easy day.

STEP ONE: KNOW WHAT GOOD LOOKS LIKE. First you have to know what normal is. Do you know what your room looks like when it is clean? Then you can tell when it is messy! A good shepherd looks at his sheep every day. [[Proverbs 27:23]]

If he never counts, he will not know when one is lost. Our app has a helper that checks it from the outside. It asks: Is the app open? Are all its parts there? Is it the newest one? That is like counting the sheep.

STEP TWO: A TEST THAT COULD FAIL. A real test has to be able to fail. Elijah knew this. Before he prayed for fire, he had them pour water on the wood. Not once. Three times! [[1 Kings 18:34]]

He made it hard on purpose. Then no one could say it was a trick. But Elijah did this because Yahweh told him to. We never test Yahweh. [[Deuteronomy 6:16]]

We test our own work, and our own hearts.

STEP THREE: TEST IT THE REAL WAY. Gideon had too many soldiers. Yahweh said, take them down to the water. I will test them there. [[Judges 7:4]]

The test was at a real stream, where real soldiers drink. A good test looks like real life.

OUR APP DOES THIS. Our app has lots and lots of small tests. Many of them break something on purpose, just to make sure the test can catch it. If a test can never turn red, it is not a real test. So we make it turn red once, on purpose. Then we know it works.

STEP FOUR: KEEP IT SMALL. Jacob was afraid his brother would attack. So he split his family and his animals into two groups. [[Genesis 32:8]]

If one group got hurt, the other could run away. Do not put everything in one basket. Having two is better than having one. [[Ecclesiastes 4:9]]

THE HOME COMPUTER PRACTICES TOO. Our family has a computer at home that keeps the app's lists. Every night it makes a copy. Once a week it does a practice. It opens the copy in a different place. It checks that all the names are there. Then it throws the practice copy away. It never changes the real list. That is a small, safe test.

THE DAY THE STORM CAME. On the day this lesson was made, two real storms hit our app. First, a road the app uses was shut. But our app had a second road. It went the second way, and it kept going. Then the company that puts our app on the internet said no. It said no two times! But the app did not fall. The old copy stayed up. A helper saw it was old, and asked again. The next try worked.

Nobody planned these storms. They just came. That is why it was good to have a second road ready.

Here is something we still need to do. We have never shut the first road on purpose, on a calm day, to practice. The storms did that for us. So we wrote it down for Darrell to decide.

STEP FIVE: LEARN AND TRY AGAIN. After a test, you stop and think. What did we think would happen? What did happen? What surprised us? What kept us safe? What will we change? The Bible says it this way. [[Lamentations 3:40]]

Look at what we did. Then turn back to Yahweh. Our app does this too. When something goes wrong, the helpers write it down. Then they fix it. Then they test it again. Good people fall down. But they get back up. [[Proverbs 24:16]]

JESUS IS THE ROCK. Jesus was tested more than anyone. But He never did wrong. [[Hebrews 4:15]]

He is the rock we build on. [[1 Corinthians 3:11]]

Jesus never falls. He never breaks. He is strong every day, in every storm. When we build on Jesus, the storm can come, and we will still stand.

A STORY ABOUT A FLASHLIGHT. Here is a made-up story to help you think. It did not really happen.

Sam's family kept a flashlight in the kitchen drawer for storms. One calm night, Dad said, let us have a practice. He turned off the lights. Sam ran to the drawer. He clicked the flashlight. Nothing! The batteries were dead.

Everybody laughed. It was not scary, because it was only practice. They put in new batteries. Then Sam said, what if we lose this flashlight? So they put a second one by the back door.

Two weeks later a real storm came. The lights went out. Sam got the flashlight. It worked. His little sister got the other one. It worked too.

Dad said, the practice night is why we are not in the dark.

${FACTS.child}

FOUR THINGS THIS WEEK. One, say what normal looks like for one thing at home. Two, do one small practice on a calm day, like a flashlight test. Three, make a second way for one thing that has only one. Four, after the practice, talk about what you learned.

${TALK.child}`;

const YOUTH = `${TITLE}.

HOW DO YOU KNOW IT WILL HOLD? Something can look strong for years and still fall the first time it is really tested. This lesson is about finding out before the storm does.

WHO SENT THIS. On the third of November, Darrell forwarded an engineering newsletter from his school email. Above it he typed one word: Lesson. The newsletter is not the foundation of this lesson. The Word is. The newsletter is just the reason we opened it.

THE WORD FIRST. At the end of the Sermon on the Mount, Jesus tells about two builders. Both houses get the same storm. About the house on the rock He says: [[Matthew 7:25]] About the house on the sand: [[Matthew 7:27]] Paul says our work will face fire too: [[1 Corinthians 3:13]] Notice that in both places the test is certain. The rain comes to every house. The only question is what will still be standing.

WHAT THE NEWSLETTER SAID. It was about chaos engineering. That sounds wild, but it is careful work. Big computer systems are made of many parts, and parts fail. A server shuts off, a connection gets slow, or a crowd shows up all at once. Builders can plan for those things, but they cannot be sure the plan works until it is tested. So teams break a small piece on purpose, while they are watching and ready, and they see what happens. Then they fix what was weak before a real outage finds it. The newsletter gave five steps. Know what healthy looks like. Guess what will happen. Cause a real kind of failure. Watch closely. Learn and fix, then test again. It also warned: keep the test small at first, so the test itself does not cause the outage you are trying to stop.

WHY BREAK SOMETHING ON PURPOSE? Think about a fire drill at school. Nobody wants a fire. But if the first time you look for the exit is during a real fire, that is a bad time to find out the door is locked. A drill lets you find the problem on a calm day. Chaos engineering is a fire drill for a computer system. It is not about making a mess. It is about finding the weak spot while it is still safe to fix.

STEP ONE: KNOW WHAT HEALTHY LOOKS LIKE. A shepherd who never counts his flock cannot tell when one goes missing. [[Proverbs 27:23]] Our app learned this one summer day. People said the app was down, but every check the team had said things were fine. The checks were all watching the machine that builds the app, and none of them had ever visited the app itself. So a new helper was built. It visits the live app from outside and asks simple questions. Does it open? Are all of its parts there? Is it the newest version? Does the database behind it answer? Now healthy has a meaning, and a machine checks it. The helper is like a shepherd counting the flock.

STEPS TWO AND THREE: A FAIR TEST, IN REAL LIFE. A test only proves something if it could have failed. On Mount Carmel, Elijah had the altar soaked with water three times before he prayed, so no one could call it a trick: [[1 Kings 18:34]] And he did it at Yahweh's word, not to test Yahweh. The Bible says clearly not to do that: [[Deuteronomy 6:16]] We test our own work and ourselves, never the Lord. The test should also be real. When Yahweh made Gideon's army smaller, He tested the men at a real stream, doing a real thing, drinking: [[Judges 7:4]]

Our app follows a rule like Elijah's water. A check is not trusted until someone breaks something on purpose and the check turns red. On the day this lesson was made, more than five hundred of the app's test files had at least one test built that way. Some go even further. The tests for how the app gets published pretend the website cannot be reached, the database is away, and a job gets stuck forever. Then they make sure the code names each problem and stops the stuck job on time.

STEP FOUR: KEEP THE TEST SMALL. When Jacob was afraid his brother Esau was coming to attack, he split everyone into two groups: [[Genesis 32:8]] If one group was struck, the other would get away. Builders call that limiting the blast radius. The Bible also praises having two instead of one: [[Ecclesiastes 4:9]] Start with small things, and grow from there. Jesus said: [[Luke 16:10]] A new driver practices in an empty parking lot before the highway. A team practices before the big game. Small first, then bigger.

Our family's home server does a small, safe test every week. Each night it copies the app's whole database. Once a week it builds that copy again in a separate practice database, checks that the people and the tables are all there, and deletes the practice copy. It reads the real database but never changes it. The script says why: a backup that has never been restored is only a claim.

THE DAY THE STORM CAME. On the thirteenth of November, the day this lesson was built, two real problems hit the app. First, the private road the publishing system uses to reach the home server was closed. A few weeks earlier, a closed road like that left the app showing an old version for more than five hours. Since then a second road was built, and on the thirteenth every publish we checked used it and kept going. Second, the company that hosts the app refused to publish it two times that morning. The app did not go down. The last good version stayed up, the outside helper noticed it was behind, and the next publish worked. Nobody planned either storm. They came on their own, the way storms do. That is why it mattered that the second road was already there.

Here is the honest part. The second road has only been tested by real storms, not by a planned practice. No one has closed the first road on purpose, on a calm day, to watch the second road take over. That is written down for Darrell to decide, with a date to look again.

STEP FIVE: LEARN FROM IT. After a test, ask what you expected, what happened, what surprised you, what protected you, and what you will change. Jeremiah said: [[Lamentations 3:40]] Falling is not the end for a righteous person: [[Proverbs 24:16]] Then you run the test again, to see if the fix really worked. Our app turns each failure into a new check. The day the app was reported down gave us the outside helper. The closed road gave us the second road. Even a mistake inside this course became a lesson, when a missing week turned ten checks red and showed that an earlier count of them was wrong.

JESUS, THE TESTED STONE. Isaiah called the coming Savior a tried stone: [[Isaiah 28:16]] Jesus was tested in every way and never sinned: [[Hebrews 4:15]] He is the only foundation that never fails: [[1 Corinthians 3:11]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne lasts forever, [[Hebrews 1:8]] and in Him everything holds together: [[Colossians 1:17]]

A STORY ABOUT A FIRE DRILL. This is a made-up story to teach, not a real event.

Maya's youth group met in the church basement every Wednesday. One week the leader said, before we start, let us practice a fire drill. Everyone groaned. They walked to the back stairs, and the door was locked. Somebody had put a new lock on it that summer, and nobody had a key.

Nobody was hurt, because it was only practice. The next Sunday the elders had the lock changed so it opens from the inside. They also made a second way out, through the kitchen.

Maya said later that the drill felt silly until the door did not open. Then it felt like the most important thing they did all year.

${FACTS.youth}

FOUR THINGS THIS WEEK. One, write down what normal looks like for one thing your family depends on. Two, run one small practice at a calm time, with a way to undo it. Three, give one thing that has only one way through a second way. Four, talk afterward about what you learned.

${TALK.youth}`;

const TEEN = `${TITLE}.

FIVE STEPS TO PROVE A THING. Plenty of things look solid right up until the day they are tested, and by then it is too late to fix them. This lesson is about testing them first, on purpose, while you still have time to make them stronger.

WHO SENT THIS. On the third of November, Darrell forwarded an engineering newsletter from his school email, and he typed one word above it: Lesson. His word is the ask. The newsletter is only the reason we opened the subject, and the Word is the base we build on.

THE WORD FIRST. Jesus ends the Sermon on the Mount with two builders who face the same storm. About the house on the rock He says: [[Matthew 7:25]] About the house on the sand He says: [[Matthew 7:27]] Paul adds that fire will test what each of us builds: [[1 Corinthians 3:13]] Look at what is missing from these verses. There is no if in them. The storm comes to both houses, and the fire comes to every work, so the only real question is what will still be standing when it is over.

WHAT THE ARTICLE TEACHES. The topic is chaos engineering, which sounds reckless but is actually careful work. Big computer systems are built from many parts, and sooner or later some of those parts fail. A server dies, a link slows down, or a crowd of users shows up all at once. Teams can plan for those things, but they cannot know the plan works until it has been tested for real. So they break a small piece on purpose, on a calm day when they are watching and ready, and they see what happens. The article gives five steps. Know what healthy looks like. Predict what will happen. Cause a realistic kind of failure. Watch closely. Then learn, fix what was weak, and run the test again. It also warns that you have to keep the blast radius small, so the test does not cause the very outage it was meant to prevent.

STEP ONE: KNOW YOUR NORMAL. [[Proverbs 27:23]] You cannot spot a change in something you never measured, which is why a shepherd keeps track of his flock every day. Our app learned this the hard way in July. People said the app was down, but every check the team had said everything was fine, because the checks were all watching the build and none of them were watching the app. So the team built a probe that visits the live app from the outside. It asks whether the app is up, whether all its parts are there, whether it is the newest build, and whether the database behind it answers. If the probe cannot tell whether the build is new, it refuses to call it new. That is what engineers call a steady state.

STEPS TWO AND THREE: A FAIR TEST, IN REAL CONDITIONS. A test that cannot fail proves nothing at all. Elijah understood this on Mount Carmel, so before he prayed for fire he had the altar soaked with water three times: [[1 Kings 18:34]] He did it at Yahweh's word, though, and not to test Yahweh, because that is forbidden: [[Deuteronomy 6:16]] What we are told to test is our own work and our own hearts: [[2 Corinthians 13:5]] The test also has to match real life. When Yahweh cut down the size of Gideon's army, He tested the men at a real stream, while they did the ordinary thing every soldier does: [[Judges 7:4]]

Our app keeps a rule that works like Elijah's water. A check is not trusted until somebody plants the exact break it is supposed to catch and watches it turn red. On the day this lesson was written, more than five hundred of the app's test files had at least one test built that way. Some of them go further and inject faults on purpose. One set of tests pretends that the website cannot be reached, that the database has gone away, and that a job has frozen, and then it makes sure the code names each problem out loud and kills the frozen job before its time runs out.

STEP FOUR: KEEP THE BLAST RADIUS SMALL. Jacob was afraid that his brother Esau was coming to attack him, so he split his whole camp into two groups: [[Genesis 32:8]] If one band was struck, the other would escape, which is exactly what engineers mean by failover. The Preacher says having a partner is better than standing alone: [[Ecclesiastes 4:9]] And Paul says the church should prove people in small things before it trusts them with big ones: [[1 Timothy 3:10]]

Our family's home server runs a safe drill like that every week. Each night it backs up the whole database, and once a week it restores that backup into a separate scratch database, counts the users and the tables, and then deletes the scratch copy. It reads the real database but never writes to it, so the drill can never hurt the thing it is checking. A comment in its own script says it best: a backup that has never been restored is a claim.

THE DAY IT RAINED. On the thirteenth of November, the day this lesson was built, two real storms hit the app within the same hour. First, the private road the publishing system uses to reach the home server was shut. Back in October that same kind of failure left the app stuck on an old build for more than five hours. Afterward, a second road was built. This time, every deploy we checked took the second road and kept going. Second, the company that hosts the app refused to publish it two times that morning, once with an internal error and once because its own systems were down. The app never went offline. It stayed up on its last good build, the outside probe noticed it was behind and asked for a new deploy, and the next attempt worked.

Now here is the honest part. The second road has only been proven by real storms, never by a planned drill. Nobody has shut the first road on purpose, on a calm day, to watch the second road take over. That gap has been written down for Darrell to decide, with a date to look at it again.

STEP FIVE: LEARN AND TRY AGAIN. After any test, ask five questions. What did we expect? What actually happened? What surprised us? What kept us safe? What will we change before we try it again? Jeremiah gave the same advice from a ruined city: [[Lamentations 3:40]] And a fall is not the end of a righteous person: [[Proverbs 24:16]] The goal is not to blame anyone. The goal is to make sure the next storm finds you stronger. Our app turns each fall into a new check. The scare in July gave us the outside probe, the closed road in October gave us the second road, and a runaway in June gave us brakes on every job that runs on a timer.

THE TRIED STONE. Isaiah saw the answer long before any of this: [[Isaiah 28:16]] Jesus was tested in every way that we are, and He never sinned: [[Hebrews 4:15]] He is the one foundation that will hold when everything else is tested: [[1 Corinthians 3:11]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] and He holds all things together: [[Colossians 1:17]]

A STORY ABOUT A SPARE. This is a made-up story to teach. It did not happen.

Jordan got his license in May, and his grandpa made him change a tire in the driveway before he was allowed to drive alone. Jordan said it was a waste of a perfectly good Saturday. Grandpa just said, humor me.

When they opened the trunk, the jack was missing. Someone had taken it out a year before and never put it back, and the spare tire was flat too.

They fixed both problems that afternoon. In October, Jordan hit a pothole on a back road late at night and blew a tire. He had the jack, and the spare had air, and he was home in forty minutes.

He called his grandpa that night. He did not say much. He just said thanks for the Saturday.

${FACTS.teen}

FOUR THINGS THIS WEEK. One, write down what normal looks like for one thing you depend on, like your phone, your ride or your money. Two, run one small, safe test, the way Jordan checked the spare. Three, add a second road wherever there is only one. Four, talk it through afterward and change one thing because of what you learned.

${TALK.teen}`;

const SENIOR = `${TITLE}.

THE QUESTION BENEATH EVERY STORM. Anything we build - a house, a family's finances, a church, a computer system - can look sound for years and still fail the first time it is truly tested. This hour asks how we may learn what is strong before the storm teaches us.

WHO SENT THIS. On the third of November, at twenty-six minutes past eight in the morning, Central time, Darrell forwarded an engineering newsletter from his university mailbox and typed one word above it: Lesson. His word is the request; the newsletter is only the occasion; the Word is the foundation. The intake that should have caught it fell behind, and the lesson was built ten days later.

THE WORD FIRST. The Sermon on the Mount closes with two builders and one storm. Of the house on the rock our Lord said: [[Matthew 7:25]] Of the house on the sand: [[Matthew 7:27]] And the apostle Paul, writing about the work of those who build the church, said: [[1 Corinthians 3:13]] Neither passage treats the trial as a possibility. The rain falls on both houses; the fire tries every work. What the trial reveals is what was true of the foundation all along.

WHAT THE ARTICLE EXPLAINS. Its subject is chaos engineering, the practice of breaking part of a working system deliberately, under control, in order to learn how it behaves when something goes wrong. Large systems are made of many dependent parts, and they rarely fail in the ways their designers pictured. A slow service in one corner can cause trouble in another entirely. Rather than wait for a real outage to reveal those weaknesses, a team introduces a small, realistic failure while it is watching and ready, observes the result, and corrects what proves weak. The article lays out five steps - establish what healthy looks like, state what you expect, introduce a realistic disruption, observe carefully, and learn before repeating. It also insists on limiting the blast radius: one instance rather than a whole service, a small share of traffic rather than every user, a rehearsal environment before the real one, and an automatic stop if things go badly.

KNOWING THE STEADY STATE. Solomon made it a shepherd's duty: [[Proverbs 27:23]] A change cannot be noticed in something that was never measured. Our own household learned this in July, when the application was reported down while every deployment record looked healthy. Every safeguard had been watching the process that builds the site, and none had ever visited the site itself. Out of that day came an outside witness that visits the live application and defines health in plain terms: whether it answers, whether every piece it needs is present, whether it is the newest version, and whether the database behind it responds. When it cannot tell whether the version is current, it refuses to call it current.

A TEST THAT COULD FAIL, UNDER REAL CONDITIONS. On Mount Carmel, before he prayed, Elijah had the altar drenched three times, so that no one could later call the outcome arranged: [[1 Kings 18:34]] Yet he acted at Yahweh's word, not to put Him to the test, which the law forbids: [[Deuteronomy 6:16]] What we may test, and must, is our own work and our own hearts: [[2 Corinthians 13:5]] The test should also mirror reality. When Yahweh reduced Gideon's army, He tried the men at an actual stream, in the ordinary act of drinking: [[Judges 7:4]]

Our project holds every automated check to Elijah's standard. A check is not trusted until someone has planted the very fault it exists to catch and watched it fail. On the day this lesson was written, more than five hundred of the application's test files contained at least one such deliberate break. Some go further and inject faults directly: the tests that guard the way the site is published simulate an unreachable site, an absent database and a job that never finishes, and require the code to name each failure and stop the stalled job at its time limit.

LIMITING THE HARM. When Jacob feared that Esau was coming against him, he divided his household: [[Genesis 32:8]] Engineers would call that both failover and a limited blast radius. The Preacher commended the same arrangement among people: [[Ecclesiastes 4:9]] And the church was told to prove its servants in small things before entrusting them with more: [[1 Timothy 3:10]]

The household's own server keeps such a rehearsal. Every night it copies the whole database, and once a week it restores that copy into a separate scratch database, compares the count of users and tables against the live one, and then discards the rehearsal. It reads the live database but never writes to it. The comment in its script states the principle exactly: a backup that has never been restored is a claim. The same household also learned what happens without a stop: in June a set of timed jobs left running during travel ran away and had to be shut down by hand, and since then nothing that runs on a clock is switched on without limits on its running time and a lock against overlapping runs.

THE DAY THE STORM CAME. On the thirteenth of November, the day this lesson was built, two real disruptions reached the publishing process within a single hour. The private connection through which the process normally asks the household server for a public key brought no answer. On the twenty-eighth of October the same kind of failure had left the site showing an outdated version for more than five hours, and a second route was built afterward: since the key is public, the process can read it back from the live site itself. On the thirteenth, every publication we examined took that second route and continued. Then the hosting company twice refused to publish, once with an internal error and once because its own systems were unavailable. The site did not go down. The last good version remained in service. The outside witness found it out of date and requested another publication, and the next attempt succeeded.

Honesty requires one more sentence. The second route has been proven only by real storms, never by a planned rehearsal; no one has yet closed the first route deliberately, on a quiet day, to watch the second take over. That is the newsletter's own counsel left undone, and it has been set before Darrell with a date for review.

LEARNING FROM EVERY FALL. The article's final step is the review: what was expected, what happened, what surprised us, what protected us, and what must change. Jeremiah, writing amid ruins, gave the same counsel: [[Lamentations 3:40]] And the righteous are not those who never fall: [[Proverbs 24:16]] The purpose of the review is not blame. It is understanding, so that the next storm finds the house stronger than the last one did. In our house each failure has left something stronger behind it - the July report left the outside witness, the October closure left the second route, the June runaway left the limits on every timed job.

THE CORNERSTONE THAT WAS TRIED. Isaiah heard Yahweh promise a foundation: [[Isaiah 28:16]] Jesus is that tried stone, tested in every respect and found without sin: [[Hebrews 4:15]] No other foundation will hold: [[1 Corinthians 3:11]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne endures for ever, [[Hebrews 1:8]] and by Him all things consist: [[Colossians 1:17]]

A STORY ABOUT A GENERATOR. An illustration, not a reported event.

A small congregation bought a generator after an ice storm left the fellowship hall dark during a funeral meal. It was installed in the shed, and everyone felt better for having it.

Two winters later a retired electrician joined the church and asked when it had last been started. No one knew. On a mild Saturday he and two deacons tried it. It would not turn over; the fuel had gone stale and the battery was dead.

They replaced both, wrote a single line on the shed door - start it on the first Saturday of every month - and put a second name beside his, so the habit would not depend on one man.

When the next storm came, the hall had light and heat, and the families who gathered there that night never knew how close it had been.

${FACTS.senior}

FOUR THINGS THIS WEEK. First, write down what normal looks like for one thing your household depends on. Second, rehearse one small failure at a calm hour, with a way back. Third, give one single point of failure a second road. Fourth, hold an honest review afterward and change what it shows.

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.

WHO SENT THIS. On the third of November 2026 at 8:26 in the morning Central time, Darrell forwarded a Level Up Coding issue, Chaos Engineering Clearly Explained, out of his university mailbox with ONE WORD typed above the forwarded header: Lesson. Gmail thread 1a1a1c0f5039a929. His word is the ask; the newsletter is the occasion. The scheduled intake fell behind and it was built by hand on the thirteenth of November.

THE WORD FIRST. Matthew 7:25 and 7:27 open the hour - one storm, two houses, and only one of them fell - with 1 Corinthians 3:13 beside them: fire will try every work and show what it is made of. Then seven movements on the newsletter's five steps: the storm is not an if (John 16:33; Ecclesiastes 9:11; the builder who dug to the rock, Luke 6:48); know the state of thy flocks (Proverbs 27:23); a test that could fail, at His word and never testing Him (1 Kings 18:34, 36; Deuteronomy 6:16; 2 Corinthians 13:5; Judges 7:4); two bands and a small fire first (Genesis 32:7-8; Ecclesiastes 4:9-12; Luke 16:10; 1 Timothy 3:10); the day the rain came; search and try our ways (Lamentations 3:40; Proverbs 24:16); and the tried stone (Isaiah 28:16; Hebrews 4:15; 1 Corinthians 3:11).

OUR OWN HOUSE. Measured in the code and in the run records, not painted: the rule that no check ships until it catches a planted break, with its count on the morning of the build; the deploy tests that inject an unreachable site, an absent database and a hung job; the outside witness that defines healthy as up, intact, fresh and usable; the weekly restore drill into a scratch database that never touches the live one; the brakes born of the June runaway; and the thirteenth of November itself, when the private road was shut and every deploy took the second road, and Cloudflare refused two publishes while the site stayed up on its last good build. And the honest gap: the second road has been proven only by real storms; no drill has yet closed the first road on purpose. Written down for the Governor with a date.

THE TIERS. ESTABLISHED and stated plainly: chaos engineering is a recognized discipline and its method is the five steps taught here. ILLUSTRATIONS, not events: the newsletter's failing instance, doubling traffic and vanished database. NOT MEASURED: the weekly restore drill's last result on the household server, which was out of reach from this session. re-review: 2026-11-27.

LEFT OUT ON PURPOSE. The sponsor's pitch for an enterprise developer program, one figure that arrived only as an image, the share-and-subscribe lines and the app links are not taught.

PLACEMENT. Sovereign A.I., week 85, because a household that runs its own machines must prove them itself, before the storm proves them for it.`,
  inApp: `No new screens this week. One page in your Study, and one small drill for your own house.

In the app: open Sovereign A.I. week 85 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each holds the whole teaching. Use Search it out on Matthew 7, 1 Kings 18 and Genesis 32 so the three passages sit side by side; the links come from the lesson's own references.

If you steward the app, open the OpsBoard and read its Uptime strip. It shows what the outside witness found the last time it visited the live site - up or down, fresh or behind. That strip is the steady state this lesson talks about, read from the real runs, not painted.

Away from the app, four exercises. Write down what normal looks like for one thing you depend on. Run one small drill at a quiet time, with a way back. Give one thing that has only one road a second road. And hold the review afterward.`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Matthew 7:25]] [[1 Corinthians 3:13]] [[Proverbs 27:23]] [[1 Kings 18:34]] [[Deuteronomy 6:16]] [[Judges 7:4]] [[Genesis 32:8]] [[Lamentations 3:40]] [[Isaiah 28:16]] [[Hebrews 4:15]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them lands on your own house.

First, read Matthew 7:24-27 and then Luke 6:47-49. Notice that the storm in both tellings reaches both houses, and that Luke adds where the wise builder did his work - digging deep, before the flood. Write one sentence on something in your life that has never met its storm.

Second, read 1 Kings 18:30-39. Mark every step Elijah takes to make the test harder, and then mark the line in verse 36 that says why he could. Then read Deuteronomy 6:16 and write down the difference between testing your own work and testing Yahweh.

Third, read Genesis 32:6-8 and Ecclesiastes 4:9-12. Make a list of the things in your house that have only one road - one key, one person who knows, one way to get there.

And one verification reading, because this course works this way. Chaos engineering is ESTABLISHED practice and is stated without hedging. The newsletter's failing server and doubling traffic are ILLUSTRATIONS, not events. The app's own code and run records were MEASURED; the household server was out of reach, so no claim is made about how its last drill went. Practice telling those apart.`,
    plan: `PLAN. Decide four measures before the week starts, and decide who hears them.

One: the steady state. Name the one thing you will describe, and write the sentence that says what normal looks like.

Two: the drill. Name the small failure you will rehearse, the quiet hour you will rehearse it, how you will undo it, and what you expect to happen. Write the expectation down before you start.

Three: the second road. Name the single point of failure and the second road you will build.

Four: the review. Name the person who will sit with you afterward and ask the five questions.

Then name the person who will ask you about all four on the same day next week. A measure nobody asks about is a wish.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.

Write the steady state where the household will see it. Run the drill on the day you named, and stop it at the time you named. Build the second road. Hold the review and change one thing because of it.

Teach Matthew 7:25 at a meal. Ask a child to say it back in their own words.

At the end of the week, answer three questions to the person who is asking. What did I assume would hold that I had never tested? What did the drill show me that I did not expect? And which second road now exists that did not exist last week?

Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over an engineering newsletter, answered from the Word rather than from the article, and built when the intake that missed it was drained.`,
    `The hour opened by Matthew 7:25 and 7:27, so every test a machine runs is heard under the deeper one: the same storm reaches every house.`,
    `1 Corinthians 3:13 laid down first, so testing is taught as the fire that shows what a work is made of.`,
    `The storm taught as certain, not possible, from John 16:33 and Ecclesiastes 9:11, and the wise builder's digging taught as a test run before the flood.`,
    `The steady state taught from Proverbs 27:23, a shepherd who knows the state of his flock before anything touches it.`,
    `Elijah's three barrels taught as the test that could have failed, and his own line, that he acted at Yahweh's word, kept beside it.`,
    `Deuteronomy 6:16 set as the bright line: we test our own work and hearts, never Yahweh.`,
    `Gideon's men tested at the real water, so a realistic failure is taught from the Word before the article says it.`,
    `The house rule that no check ships until it catches a planted break, counted on the morning of the build.`,
    `Jacob's two bands taught as failover and a small blast radius in one sentence.`,
    `The household server's weekly restore drill into a scratch database, which reads the live data and never writes to it.`,
    `The brakes on every timed job, taught as the automatic abort conditions the newsletter asks for, and traced to the runaway that taught them.`,
    `The thirteenth of November read from its own run records: a shut road carried by the second road, and two refused publishes that never took the site down.`,
    `An honest gap named: the second road has only ever been proven by real storms, and the drill that would prove it on purpose is written down with a date.`,
    `Lamentations 3:40 and Proverbs 24:16 used to teach the review after the fall.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, the tried stone and the one foundation.`,
    `The established, the illustrative and the unmeasured told apart in every reader place, with a dated re-review.`,
    `All four age bands carried from the first commit, each written for its own reader.`,
    `Four household actions that cost nothing: know the normal, run a small drill, build a second road, hold the review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The key under the mat',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A widow in a small town kept one spare key to her house, under the mat by the back door, and her son had the only other one, three hours away.

One winter morning she stepped out for the paper and the door swung shut behind her. The spare was not under the mat. Her grandson had borrowed it in the summer and it was still on his ring.

She sat in a neighbor's kitchen for most of the day while her son drove up. Nobody was hurt. But that evening the family sat at her table and asked the questions in order: what did we think was there, what was actually there, what surprised us, what saved the day, and what will we change.

They changed two things. A second spare went to the neighbor who had given her coffee. And once a month, on the day the pension came, she would lift the mat and look.

She has not been locked out since. She says the looking takes four seconds.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The Sunday the sound board died',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A church ran its whole service through one sound board, and one volunteer knew how to work it.

The deacons had talked for a year about what they would do if it failed. On a quiet Thursday the volunteer suggested they find out. They unplugged the board, on purpose, with the pastor standing at the pulpit, and timed how long it took to get a voice into the room another way.

It took eleven minutes. The spare microphone cable was the wrong kind. The small speaker in the closet had a dead battery. Nobody else knew where the breaker was.

They fixed all three that week and taught two more people the board.

Four months later the board quit in the middle of the first hymn. Within a minute the pastor had the spare microphone in hand, and most of the congregation never knew anything had gone wrong.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Matthew 7:24-27, what is different about the weather that reaches the two houses?',
        options: ['Only the foolish man’s house is struck by the storm', 'Nothing: the same rain, floods and winds beat on both houses', 'Only the wise man’s house is tested'],
        answer: 1,
        explain: 'The storm reaches both. What differs is the foundation, and only the storm shows it. A system that has never met its storm is unproven, not strong.',
      },
      {
        q: 'What is chaos engineering, as the newsletter describes it?',
        options: [
          'Letting a system run with no monitoring',
          'Deliberately introducing a small, controlled failure and watching how the system behaves, so weaknesses are found before a real outage',
          'Breaking as much as possible in production to see what happens',
        ],
        answer: 1,
        explain: 'The goal is not chaos for its own sake. It is controlled failure, in order to learn what needs to become stronger.',
      },
      {
        q: 'Which verse does the lesson use to teach the first step, knowing the steady state?',
        options: ['Proverbs 27:23', 'Psalm 23:1', 'John 10:11'],
        answer: 0,
        explain: 'A shepherd keeps close track of his flock. You cannot notice a change in something you never measured.',
      },
      {
        q: 'Why did Elijah have the altar drenched three times before he prayed?',
        options: [
          'To put Yahweh to the test for his own curiosity',
          'So the test could plainly have failed and no one could call the outcome arranged, and he did it at Yahweh’s word',
          'Because the wood was too dry to burn',
        ],
        answer: 1,
        explain: 'A test that could not fail proves nothing. And 1 Kings 18:36 records that he acted at His word, which keeps it from being a test of Yahweh.',
      },
      {
        q: 'What line does Deuteronomy 6:16 draw for this whole subject?',
        options: [
          'That testing anything is forbidden',
          'That we do not put Yahweh to the test; what we test is our own work and our own hearts',
          'That only priests may run tests',
        ],
        answer: 1,
        explain: '2 Corinthians 13:5 points the testing where it belongs: at ourselves.',
      },
      {
        q: 'What does this project require before any automated check is trusted?',
        options: [
          'That it passes on the first run',
          'That it is shown to catch a break planted on purpose',
          'That it runs once a month',
        ],
        answer: 1,
        explain: 'A check that always passes is itself a lie. More than five hundred of the app’s test files carried such a planted-break case on the morning this was built.',
      },
      {
        q: 'How does Genesis 32:7-8 picture limiting the blast radius?',
        options: [
          'Jacob sent everything ahead in one group',
          'Jacob divided his people and flocks into two bands, so that if one were struck the other would escape',
          'Jacob ran away alone',
        ],
        answer: 1,
        explain: 'One blow could not take everything. That is failover and a small blast radius together.',
      },
      {
        q: 'What does the household server’s weekly drill do?',
        options: [
          'It deletes the live database and rebuilds it',
          'It restores the newest backup into a separate scratch database, counts users and tables against the live one, and throws the scratch copy away',
          'It emails the backup to everyone',
        ],
        answer: 1,
        explain: 'A backup that has never been restored is a claim. The drill reads the live database and never writes to it. Its last result was out of reach from this session, so the lesson claims nothing about it.',
      },
      {
        q: 'What happened on the thirteenth of November, the day the lesson was built?',
        options: [
          'The site went down for five hours',
          'The private road to the household server was shut and every deploy took the second road; Cloudflare refused two publishes, and the site stayed up on its last good build',
          'Nothing went wrong all day',
        ],
        answer: 1,
        explain: 'Two storms in one hour, neither planned. The second road held, and the outside witness found the site up but behind and asked for the deploy again.',
      },
      {
        q: 'What honest gap does the lesson name in our own house?',
        options: [
          'That no tests exist at all',
          'That the second road has been proven only by real storms, and no drill has yet closed the first road on purpose',
          'That the site has no outside witness',
        ],
        answer: 1,
        explain: 'Code-level tests plant breaks by the hundred and the server rehearses its restore weekly, but the deploy’s roads have only been exercised when the weather chose. It is written down for the Governor with a date.',
      },
      {
        q: 'Which verse does the lesson use for the review after a failure?',
        options: ['Lamentations 3:40', 'Genesis 1:1', 'Revelation 22:21'],
        answer: 0,
        explain: 'Jeremiah calls us to search our ways, try them, and turn back to Yahweh - and Proverbs 24:16 adds that the righteous fall and rise again.',
      },
      {
        q: 'Which of these does this lesson state as established fact?',
        options: [
          'That the household server’s last restore drill passed',
          'That chaos engineering is a recognized discipline and its method is the five steps taught here',
          'That the newsletter’s doubling traffic really happened somewhere',
        ],
        answer: 1,
        explain: 'The discipline is established. The newsletter’s examples are illustrations. The drill’s last result is not measured, because the server was out of reach. re-review: 2026-11-27.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Matthew 7:24-27 aloud before you say one word about any computer. Then read 1 Corinthians 3:13 aloud. Then ask the room one question and wait: what in your life looked strong until the day it was tested?

MINUTES 0 TO 10 - THE NEWSLETTER IN ONE PICTURE. Describe a system made of many parts, and ask the room how they would know it could survive one part failing. Then give the five steps: steady state, hypothesis, realistic failure, observe, learn. Write blast radius on the board and explain it.

MINUTES 10 TO 18 - THE STORM IS NOT AN IF. John 16:33, Ecclesiastes 9:11, Luke 6:48. The two houses look the same on a sunny day.

MINUTES 18 TO 26 - KNOW THE STATE OF THY FLOCKS. Proverbs 27:23. Tell how the outside witness was born on a day every deploy was green and the site was reported down.

MINUTES 26 TO 38 - A TEST THAT COULD FAIL. 1 Kings 18:34 and 36, Deuteronomy 6:16, 2 Corinthians 13:5, Judges 7:4. Make the bright line plain: we test our own work, never Yahweh. Then tell the house rule that every check must catch a planted break.

MINUTES 38 TO 46 - TWO BANDS, AND A SMALL FIRE FIRST. Genesis 32:7-8, Ecclesiastes 4:9-12, Luke 16:10, 1 Timothy 3:10. Tell the weekly restore drill and the brakes on every timed job.

MINUTES 46 TO 52 - THE DAY THE RAIN CAME. Tell the thirteenth of November honestly: the second road held, the site stayed up, and no one has yet drilled the second road on purpose. Say plainly that the household server was out of reach, so the drill's last result is not claimed.

MINUTES 52 TO 60 - SEARCH AND TRY OUR WAYS, AND THE TRIED STONE. Lamentations 3:40, Proverbs 24:16, then Isaiah 28:16, Hebrews 4:15, 1 Corinthians 3:11, Psalm 127:1, John 1:29, John 3:16, Hebrews 1:8, Colossians 1:17. Give the four household actions and close with the talk-together questions.

WHAT NOT TO DO. Do not turn this into a reliability seminar; the room needs the Word and an honest habit. Do not suggest testing Yahweh; Deuteronomy 6:16 is the line. Do not stage whether to test as two camps for the room to pick between; teach the Word and work it (DR-0098). Do not hedge the established engineering, and do not claim the drill's last result or any number not read from a record (DR-0100, DR-0076).`,
    talkingPoints: [
      `The same storm reaches every house; only the foundation differs (Matthew 7:24-27).`,
      `Fire will show what every work is made of (1 Corinthians 3:13).`,
      `Chaos engineering is controlled failure on purpose, to find what must become stronger.`,
      `There will be failures; Jesus said so plainly (John 16:33).`,
      `The wise builder dug to the rock before the flood: the test he ran first (Luke 6:48).`,
      `Know the state of your flocks before you test them (Proverbs 27:23).`,
      `Our outside witness defines healthy: up, intact, fresh, usable.`,
      `A test that could not fail proves nothing; Elijah drenched the altar three times (1 Kings 18:34).`,
      `He did it at Yahweh's word; we never test Yahweh (1 Kings 18:36; Deuteronomy 6:16).`,
      `Test your own work and your own hearts (2 Corinthians 13:5).`,
      `Test under real conditions, as Gideon's men were tried at the water (Judges 7:4).`,
      `No check ships in this project until it catches a planted break.`,
      `Two bands: one blow cannot take everything (Genesis 32:7-8).`,
      `Two hold better than one, and three strands hold better still (Ecclesiastes 4:9-12).`,
      `Prove small, then trust with more (Luke 16:10; 1 Timothy 3:10).`,
      `The household server rehearses its restore weekly, in a scratch database.`,
      `On the thirteenth of November the second road held and the site stayed up.`,
      `The second road has been proven by storms, not yet by a drill: an honest gap with a date.`,
      `Search and try our ways, and turn again (Lamentations 3:40).`,
      `The righteous fall and rise again (Proverbs 24:16).`,
      `Jesus is the tried stone and the one foundation (Isaiah 28:16; 1 Corinthians 3:11).`,
      `Jesus is the Lamb of Yahweh and the Eternal Son, tested in all points and without sin (John 1:29; Hebrews 4:15).`,
    ],
    discussionPrompts: [
      `What in your house has never met its storm, and how would you know if it would hold?`,
      `What does normal look like for the one thing your family depends on most?`,
      `What is the difference between testing your own work and testing Yahweh, and why does it matter?`,
      `Which thing in your life has only one road?`,
      `When did a failure teach you something a success never could?`,
      `What small drill could your family or church run this month, at a quiet time, with a way back?`,
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
console.log(`sov85: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov85: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov85: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov85: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov85: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov85: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov85: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov85: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov85: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov85: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  // from - 1 also takes the newline before the block, so a rebuild is byte-identical (the sov82-fill fix).
  src2 = src2.slice(0, from - 1 - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov85: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov85: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov85: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov85: week ${WEEK} is already taken`);
if (!after.includes(WEEK)) throw new Error(`sov85: week ${WEEK} is not in the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov85: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov85: spliced ${ID}`);
console.log(`sov85: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov85: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
