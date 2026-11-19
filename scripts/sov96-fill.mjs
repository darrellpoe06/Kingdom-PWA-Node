// =============================================================================
// sov96-fill - build Sovereign A.I. week 96 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose holds only a reference in double brackets, [[Leviticus 24:4]], and this
// script replaces it with the corpus text followed by the reference. No verse
// on the page was typed from memory. anchor.ref is DERIVED from the
// placeholders that occur in the reader places (DR-0734).
//
// WHERE THE WORD CAME FROM. Darrell forwarded a ByteByteGo system design
// refresher (EP233, Kubernetes Explained for Busy Engineers, with four shorter
// pieces) into the lesson lane with ONE WORD above it: Lesson. Gmail thread
// `1a1daf286df06d06`. Built 2026-11-19. A newsletter, not a personal email; no
// link or sponsor from it is written here.
//
// ONE TEACHING, ONE LESSON (DR-0610). lesson-already-built.mjs --thread
// returned NOTHING FOUND. Of the five pieces, this week takes ONE: Kubernetes'
// declared desired state and the controllers that keep pulling the actual
// state back to it. Exodus 25:40 is already in this course twice and is named,
// not re-taught: week 86 reads the pattern that came in writing (the maker
// behind the tool) and week 91 uses a written pattern as the rubric an answer
// is graded against. This week owns the KEEPING: the keeper who returns to the
// pattern every cycle (Leviticus 24:3-4), and the copy that must be fresh
// (2 Kings 22). The other four pieces (single vs multi agent, the testing
// pyramid, deep research agents, guardrails) are left to their own weeks;
// sov91-sov95 own evals, cheating benchmarks, the gateway, the verifying
// bottleneck and the security alert.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). REPORTED: the newsletter's
// walk through the Kubernetes parts (API server, etcd, scheduler, kubelet).
// DOCUMENTED: the controller pattern, read 2026-11-19 from the Kubernetes
// project's own docs (kubernetes/website, content/en/docs/concepts/
// architecture/controller.md): a control loop is a non-terminating loop; the
// thermostat example; the cluster may never reach a stable state, and that is
// fine while the controllers run. MEASURED: this house's own self-deploy loop,
// read from infra/nas-loops/services.json, infra/nas-loops/registry.json,
// infra/nas-loops/loops/services-sync.sh and DR-1119. NOT VERIFIED: whether
// the loop's clock is firing on the home server today, and which commit its
// mirror holds today; this session has no road to that machine.
// re-review: 2026-12-03.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 96;
const ID = 'sov96-he-shall-order-the-lamps-continually';
const TITLE = 'He shall order the lamps continually - the pattern declared first, the keeper that returns every cycle, and the copy kept fresh';

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
  if (!m) throw new Error(`sov96: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov96: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov96: reference does not resolve in the corpus -> "${ref}"`);
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
const REVIEW = 're-review: 2026-12-03';

const FACTS = {
  lesson: `WHERE WE STAND ON THE FACTS. REPORTED: the newsletter's walk through the parts of Kubernetes - the file you write, the server that checks and stores it, the scheduler that places the work, and the agent on each machine that runs it - as it was forwarded; it is a summary, and we did not test a cluster. DOCUMENTED, and stated plainly: the Kubernetes project's own documentation, read on the day this lesson was built, describes a controller as a loop that never ends, compares it to a thermostat, and says a cluster may never reach a stable state and that this is fine while the controllers run. MEASURED in our own house, from our own files: the services list, the fifteen-minute self-deploy loop, its installers that do nothing when the work is already done, the step that freshens the copy before every cycle, and the written Way a service comes home. NOT VERIFIED: whether that loop's clock is firing on the home server today, and which version of the pattern its copy holds today; this build had no road to that machine. ${REVIEW}.`,
  child: `WHAT IS SURE AND WHAT IS NOT. Darrell sent us a letter about how big computers keep their work running. We did not test one ourselves. The people who build that system wrote down how it works, and we read their own words. It is sure that it works like a thermostat: you say how warm the room should be, and it keeps checking. We read the files of our own home computer to see how it keeps its list. We do not know if that home computer is checking its list today. We could not reach it from here. That is not verified yet. We will look again. ${REVIEW}.`,
  youth: `WHAT IS SURE AND WHAT IS NOT. The newsletter came to us forwarded, and we did not run a cluster to test it. The core idea is documented: the Kubernetes project's own pages describe a controller as a loop that never stops comparing what is to what should be, like a thermostat. Our own home server's list and its fifteen-minute keeper were read from our own files. Whether that keeper is running on the home server today is not verified; we had no way to reach it from where this was built. ${REVIEW}.`,
  teen: `WHAT IS SURE AND WHAT IS NOT. Sort every claim. Reported: the newsletter's tour of the Kubernetes parts, as forwarded; we did not run a cluster. Documented: the project's own docs say a controller is a loop that never ends, like a thermostat, and that a cluster may never be fully still. Measured: our own services list and the keeper that runs it, read from our own files. Not verified: whether that keeper is firing on the home server today, and which copy of the list it holds; we had no road to that machine. ${REVIEW}.`,
  senior: `WHERE WE STAND ON THE FACTS. The newsletter's account of the parts of Kubernetes is reported as it was forwarded; no cluster was run to test it. The controller pattern itself is documented, read from the project's own pages on the day of building: a loop without end, likened to a thermostat, under which a cluster may never come to rest, and need not. Every statement about this house is traced to its own files: the services list, the fifteen-minute keeper, its installers that are safe to run again, the fresh copy pulled before each cycle, and the written Way a service comes home. Whether the keeper is firing on the home server today, and which copy it holds, is not verified, and no conclusion is drawn about either. ${REVIEW}.`,
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  'And measure the growth the Word’s way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - what in our house should always be true, even when nobody is looking - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Leviticus 24:4. Children, ask your mother, your father or a grandparent about a job they did every morning and every evening for years, and why they never let it go; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: which of our rules are written down, and which live only in someone's memory. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - what should our room look like when it is clean - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Exodus 25:40. Children, ask your mom or your dad or your grandma or your grandpa about a chore they did every single day. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what is one thing we check every morning. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - if we wrote down how our house should run, what would be on the list - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Exodus 39:43. Children, ask your mom, your dad or a grandparent about a time they followed old instructions that had changed, and what happened; hear the whole of it before you answer, then retell their answer in your own words. Then ask a friend this: what do we do over and over that keeps things working. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is the difference between doing a job once and keeping it done - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, James 1:25. Children, ask your mom, your dad or a grandparent about a book, a manual or a rule they found again after it had been forgotten; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: which pattern do we follow that might be out of date. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what do you check every day without being told, and why - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, 2 Kings 22:13. Children, ask your parents or your grandparents about the daily duties they kept for years, and the ones they let slip; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: who in our house goes back to the plan and sets things right again. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no word about a machine stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.
WHO SENT THIS. Darrell forwarded a system design newsletter into this lane with ONE WORD typed above it: Lesson. The issue carried five short pieces. The first and longest explained Kubernetes for busy engineers: the platform that keeps many programs running across many machines. That word is the ask; the newsletter is the occasion. One teaching, one lesson: this week takes only the first piece, and only its heart, which is a declared pattern and a keeper that keeps returning to it.
The pattern verse is not new to this course. Week eighty-six read the pattern that came in writing, as the maker behind the tool. Week ninety-one used a written pattern as the rubric a model's answer is graded against. This week takes up what neither of them taught: who goes back to the pattern every morning and every evening, and pulls what is back to what was shown.`,
  `THE WORD FIRST, BEFORE ANY MACHINE. Before one board of the tabernacle was cut, Yahweh showed Moses the whole of it and said: [[Exodus 25:9]] And again, at the end of the instructions for the lampstand: [[Exodus 25:40]] The letter to the Hebrews reads that same word back and calls it an admonition: [[Hebrews 8:5]]
Notice the order. The pattern came first, complete, shown on the mount. The work came second, and it was judged against the pattern, not against what the workers remembered or preferred. When it was finished, there was an inspection, and it was a comparison: [[Exodus 39:42]] [[Exodus 39:43]] Moses looked at what was, held it beside what had been commanded, and found them the same. Only then did he bless the work.`,
  `THE KEEPER WHO RETURNS. A finished tabernacle is not the end of the pattern. The lamp in it was meant to burn always: [[Exodus 27:20]] And the way it burned always was not a single act. It was a keeper, coming back on a cycle: [[Leviticus 24:3]] [[Leviticus 24:4]] Exodus gives the two ends of the day: [[Exodus 30:7]] [[Exodus 30:8]]
Read those verses as a builder reads them. The pattern said what must be true: a lamp burning before the testimony. The priest did not light it once and walk away. Every evening and every morning he came back, looked at the lamps as they actually were, trimmed the one that had burned low, filled the one that was running dry, and set each one back to what the pattern required. A statute for ever. Continually. That word continually is the whole lesson. The pattern was declared once. The keeping never stopped.`,
  `KUBERNETES IN ONE PARAGRAPH. Here is what the newsletter described, and what the project's own documentation confirms. You do not tell Kubernetes a list of steps. You write down what should be true - this program, four copies of it, always running - in a file. A server checks that file and stores it as the desired state. Then a set of controllers does one thing forever: each one looks at the actual state, compares it with the desired state, and acts to close the gap. If a copy crashes, the actual state is three, the desired state is four, and a controller starts another. A scheduler decides which machine each copy runs on, and an agent on each machine makes sure the copies assigned to it are really running. The project's own docs use the word loop, and they mean a loop that never ends. Their example is a thermostat. You set the temperature you want, the room has the temperature it has, and the thermostat keeps turning the heat on and off to bring the one toward the other. They even say a busy cluster may never be perfectly still, and that this is fine as long as the controllers keep running and keep making useful changes.
That is Leviticus 24 in a data center. The pattern is declared. The keeper returns. The lamps are ordered continually.`,
  `TWO WAYS TO RUN A HOUSE. There are two ways to keep anything running, and every family uses both. The first is a list of steps done once: plug this in, set that up, change this setting. It works on the day you do it. Then something drifts - a power cut, an update, a child who unplugs the wrong thing - and nobody notices, because the list was finished long ago and no one is comparing.
The second way is a written pattern and a keeper. You write down what should be true: these devices are backed up, this door is locked at night, this medicine is in this cabinet. Then someone, or something, comes back on a schedule and compares what is with what should be, and fixes the difference. The second way survives a crash, a move, a busy week and a forgotten hand, because it does not depend on anyone remembering what was done. It depends only on the pattern being written and the keeper coming back.
For the keeper's work to be safe, the step must be safe to repeat. A priest who poured a full measure of oil into a lamp that was already full would make a mess. The good keeper looks first and does only what is missing. Engineers call that idempotent: running it a second time changes nothing that was already right. It is the difference between a keeper who trims the lamps and a keeper who throws out the lampstand every morning and builds a new one.`,
  `THE COPY MUST BE FRESH. A keeper can do every motion faithfully and still keep the house to the wrong pattern, if the copy in his hand is old. That is what happened in Judah. For years the house had been kept by habit, and the written law itself was lost inside it. Then, during repairs: [[2 Kings 22:8]] When the words were read to the young king, he saw at once how far the house had drifted: [[2 Kings 22:11]] And he named the cause without excuse: [[2 Kings 22:13]]
The fathers had not stopped working. They had stopped working from the book. That is the quietest failure a keeper can have, because from the outside it looks exactly like faithfulness. Every morning the motions are made. Every evening the report says all is well. And the whole time, the house is being kept to yesterday's pattern.
James gives the same warning to a single heart: [[James 1:23]] [[James 1:24]] The man looks once, then forgets, and goes on as if the glass had never shown him anything. The blessing goes to the other man: [[James 1:25]] He looks, and he continues therein. That is a keeper with a fresh copy.`,
  `OUR OWN HOUSE, MEASURED, NOT PAINTED. This house builds the family app, and it runs a small home server in the same pattern, with no Kubernetes at all. We read our own files to say what it does.
There is one list of services, written in the repository. Each entry names a service, the installer that sets it up, and whether it is enabled. The file itself says that adding a service to the list and merging the change is its deployment. Enabled is the committed go-ahead; a service switched off is skipped, and the loop says so. That list is the pattern shown on the mount.
There is one keeper. Every fifteen minutes the home server runs a loop that reads the list and runs the installer of every enabled service, every time. The installers are written to be safe to repeat: every step does nothing when it is already done. A service that crashed is started again. A service whose code changed is moved onto the new code. A service already right is left alone. That loop is Aaron at the lampstand, evening and morning.
And the keeper learned, by measurement, that the copy must be fresh. Our own loop records it. In August the home server's copy of the repository sat a night behind, and every cycle faithfully set the house to yesterday's list. So the loop now pulls the newest copy before it does anything else. Eleven days later it was measured again: the pull had been failing quietly because of who owned the files, and the loop kept deploying a stale copy that looked exactly like a healthy one. Now the pull runs as the owner of the files, and when it fails it says why, out loud, on both of its channels. In October a daily limit on the loop let a camera service run thirteen-hour-old code while the new code sat on the disk; the limit was raised and the reason written down. That is Josiah's lesson learned three times in our own house: a keeper is only as good as the copy in his hand.
Last, our written Way for bringing a service home asks for Moses' inspection. The step that moves the running service onto the repository's code must be called on every path the installer can take, and a witness must print the code the service is actually running beside the code in the repository. What is, beside what was shown.
What we have measured is the files. We did not reach the home server from where this lesson was built, and this lesson does not claim that the loop is firing today.`,
  `FOUR THINGS FOR THE HOUSE. One: write the pattern down before you build, and write what should be true, not only the steps you took. Two: make every keeping step safe to repeat, so it can run every day without harm. Three: keep the copy fresh - before you keep the house to a pattern, make sure the pattern in your hand is the current one. Four: compare on a schedule, what is beside what was shown, and when they differ, say why in plain words.`,
  `IT IS KEPT. Every human keeper grows tired, and every copy in human hands can go stale. There is one High Priest whose ministry never lapses: [[Hebrews 8:1]] [[Hebrews 8:2]] He is not a keeper who comes back every morning; He is the keeper who never leaves: [[Hebrews 7:25]] And the pattern in Him does not drift: [[Hebrews 13:8]] He is the Lamb of Yahweh, [[John 1:29]] the Son the Father gave, [[John 3:16]] the Eternal Son whose throne stands for ever, [[Hebrews 1:8]] and the One by whom all things consist. [[Colossians 1:17]] We order our lamps continually because we are not Him. We do it without fear because He holds the true tabernacle.`,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader.
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.
WHO SENT THIS. Darrell got a letter about how big computers keep their work going. He sent it to us with one word on top. The word was Lesson. So here it is.
THE WORD FIRST. Long ago, Yahweh asked Moses to build a special tent. It was a house where Yahweh would meet His people. But first, Yahweh showed Moses the plan. He showed him all of it, on top of a mountain. Then He said this. [[Exodus 25:40]] The plan came first. The building came next.
When the people were done, Moses came to look. He looked at the plan. He looked at the work. They were the same! [[Exodus 39:43]] So Moses blessed them.
THE LAMPS. Inside the tent was a lamp stand with seven lamps. The plan said the lamps must always burn. But oil runs out. Wicks burn down. So a priest named Aaron had a job. Every night and every morning, he came back to the lamps. [[Leviticus 24:4]] He looked at each lamp. If one was low, he filled it. If one was messy, he cleaned it. He did it again and again, every day. That is what continually means. It means it never stops.
[[Exodus 30:7]] Every morning. [[Exodus 30:8]] Every evening. Aaron did not light the lamps one time and go home. He came back.
A COMPUTER THAT CHECKS. Some big computers work the same way. A person writes down a plan. The plan might say, keep four copies of this game running. Then the computer checks, over and over. If one copy stops, now there are only three. The computer sees it. It starts one more. Now there are four again. It never stops checking.
The people who made it say it is like the thing on the wall that keeps a room warm. You set how warm you want it. It keeps checking the room. If the room gets cold, it turns on the heat. If it gets warm, it turns the heat off.
A LOST BOOK. Here is one more story. Many years later, a young king named Josiah was fixing up Yahweh's house. A priest found a book in there. It was Yahweh's law. It had been lost! [[2 Kings 22:8]] Everyone had been doing things the way they always did. But they were not doing them the way the book said. When the king heard the book, he was very sad. [[2 Kings 22:11]] He knew they had been following the wrong plan. So he made things right again.
That means a helper must have the newest plan. If you keep checking an old plan, you will keep fixing things the wrong way.
A MIRROR. James tells about a man who looks in a mirror. Then he walks away and forgets what he saw. [[James 1:24]] But the one who keeps looking at Yahweh's Word, and keeps doing it, is blessed. [[James 1:25]]
OUR OWN COMPUTER. Our family has a small computer at home. It keeps a list. The list says which helpers should be running. Every fifteen minutes, the computer reads the list. It checks each helper. If one stopped, it starts it again. If one is fine, it leaves it alone. That is like Aaron at the lamps! Once, the computer was using an old list by mistake. It kept fixing things the old way. Now it gets the newest list first, every time. And if it cannot get it, it says so.
WHY NOT JUST DO IT ONCE? Think about your shoes by the door. Mom says, put your shoes by the door. You do it today. Good! But tomorrow you kick them under the bed. The next day one shoe is in the car. Doing it once did not keep it done. Now think about a rule on a card. The card says, shoes by the door at bedtime. Every night, someone looks at the card. Then they look at the door. Are the shoes there? If yes, good. Leave them. If not, go get them. That is keeping. It is not hard. It just never stops. It is what Aaron did with the lamps. He did not have to remember what he did yesterday. He only had to look at the plan, and then look at the lamps.
YOUR TURN. You can do this too. With a grown up, make a list of what your room should look like when it is clean. Then check it every morning. Fix what is not right. That is keeping, not just cleaning once.
YAHWEH KEEPS US. Aaron got tired. People forget. But Jesus never stops. He is our great Priest, and He always helps us. [[Hebrews 7:25]] He is the Lamb of Yahweh. [[John 1:29]] [[John 3:16]] He never changes. [[Hebrews 13:8]] He holds everything together. [[Colossians 1:17]]
FOUR THINGS TO DO. Write the plan first. Check it again and again. Use the newest plan. Look at what is, next to what the plan says, and fix it.
${FACTS.child}
${TALK.child}`;

const YOUTH = `${TITLE}.
WHO SENT THIS. Darrell forwarded a tech newsletter with one word on it: Lesson. Its main article explained Kubernetes, a system big companies use to keep lots of programs running on lots of computers at once. We are taking just one idea from it. Week eighty-six of this course looked at a pattern written down by Yahweh, and week ninety-one used a written pattern to grade an answer. This week is about something else: who keeps going back to the pattern, every day, to set things right.
THE WORD FIRST. When Yahweh told Moses to build the tabernacle, He did not start with tools. He started with a plan, and He showed Moses the whole thing on the mountain. [[Exodus 25:9]] [[Exodus 25:40]] The plan came first. Then the people built.
When the building was done, Moses checked it. [[Exodus 39:42]] [[Exodus 39:43]] He compared what they made with what he had been shown. They matched, so he blessed the work.
THE PRIEST WHO CAME BACK. Inside the tabernacle was a lampstand, and the plan said its lamps should burn all the time. [[Exodus 27:20]] That could not happen by lighting them once. Oil runs low and wicks burn down. So Aaron had a job that never ended. [[Leviticus 24:3]] [[Leviticus 24:4]] Every evening and every morning he came back, looked at each lamp as it really was, and fixed whatever did not match the plan. Continually means exactly that: over and over, with no finish line.
WHAT KUBERNETES DOES. Kubernetes works like Aaron. You do not give it a list of steps. You give it a file that says what should be true, like: run four copies of this app. That becomes the desired state. Then little programs called controllers check, over and over, what is actually running. If one copy crashes and only three are left, a controller sees the difference and starts a new one. The people who built Kubernetes describe it with a thermostat. You set the temperature you want. The thermostat keeps checking the room and turns the heat on or off to match. It never says, done.
TWO WAYS TO RUN THINGS. You can run anything two ways. One is to follow steps once and hope nothing changes. The other is to write down what should be true and keep checking. The first breaks the moment something drifts, and nobody notices. The second fixes drift by itself, because someone keeps comparing.
There is a catch. The fixing step has to be safe to run again. If Aaron poured oil into a lamp that was already full, he would spill it everywhere. A good keeper looks first and only adds what is missing. Programmers call that idempotent, which just means running it twice does no harm.
THE OLD COPY. Years later, a king named Josiah was repairing Yahweh's house when the high priest found something. [[2 Kings 22:8]] It was the book of the law, lost inside the very house it was supposed to guide. When Josiah heard it read, he tore his clothes. [[2 Kings 22:11]] He saw the problem right away. [[2 Kings 22:13]] The people had kept doing things out of habit, but not from the book.
That is the sneakiest kind of failure. Everything looks fine. Everyone is busy. But they are all following an old copy. A keeper has to make sure the plan in his hand is the current one.
James says it this way. [[James 1:23]] [[James 1:24]] Looking once is not enough. [[James 1:25]] The blessing is for the one who keeps looking and keeps doing.
OUR OWN HOUSE. Our family runs a small home server, and it uses this same idea without Kubernetes. We read our own files to check. There is one list of services in our code. Each one has an installer and an on or off switch. Every fifteen minutes, a loop on the server reads the list and runs every installer that is switched on. The installers are safe to repeat, so a service that is already fine is left alone and one that crashed gets started again.
And we learned the old copy lesson the hard way. One night the server's copy of our code was a day old, and every check kept setting things up the old way. Now the loop grabs the newest copy first. Later we found that grab had been failing quietly, so now it says why when it fails. A stale copy can look exactly like a healthy one.
WHEN IT IS OFF, SAY WHY. Moses did not just say the work looked fine. He checked it against the plan, piece by piece. A good keeper does one more thing too. When something does not match, it says why. Our home server learned this as well. For a week its loop kept failing, and the only thing it wrote down was the name of the service it was working on. It never wrote down the reason. So nobody could fix it without guessing. Now, when an installer fails, the loop keeps the last lines of what went wrong and writes them where people will read them. If a service is running but cannot do its job that day, the loop marks it as limping instead of calling the whole house broken. A warning that does not say why is barely better than no warning at all.
YOUR OWN PATTERN. Think of something in your life that should always be true. Your bike tires are full. Your homework folder is packed the night before. Your phone is charged by morning. Write it down. Then check it every day and fix what drifted. That is the difference between doing a chore and keeping it done.
JESUS KEEPS IT. Aaron got tired, and every copy we hold can get old. Jesus is the High Priest who never stops. [[Hebrews 8:1]] [[Hebrews 7:25]] He is the Lamb of Yahweh, [[John 1:29]] given by the Father, [[John 3:16]] the Eternal Son, [[Hebrews 1:8]] who holds all things together. [[Colossians 1:17]] [[Hebrews 13:8]]
FOUR THINGS TO DO. Write down what should be true. Make the fix safe to repeat. Use the newest copy of the plan. Check on a schedule and say why when something is off.
${FACTS.youth}
${TALK.youth}`;

const TEEN = `${TITLE}.
WHO SENT THIS. Darrell forwarded a system design newsletter with one word on it: Lesson. Its lead piece was Kubernetes Explained for Busy Engineers. We take one idea from it: declared desired state, and controllers that keep pulling the real state back to it. Week eighty-six of this course read a written pattern as the maker behind a tool. Week ninety-one used a written pattern as a grading rubric. This week is about the keeping.
THE WORD FIRST. The tabernacle was declared before it was built. Yahweh showed Moses the full design and told him to match it. [[Exodus 25:9]] [[Exodus 25:40]] Hebrews quotes that line back and calls it a warning. [[Hebrews 8:5]] The design was not a suggestion. It was the spec.
Then came the first check, and it was a diff. [[Exodus 39:42]] [[Exodus 39:43]] Moses put what existed next to what was commanded. Match found. Blessing given.
THE LOOP THAT NEVER ENDS. A finished build still had to stay right. The lamp was supposed to burn always. [[Exodus 27:20]] That outcome was held by a loop, not a launch. [[Leviticus 24:3]] [[Leviticus 24:4]] Morning and evening, Aaron came back. [[Exodus 30:7]] [[Exodus 30:8]] He read the actual state of each lamp, compared it to the spec, and closed the gap. Statute for ever. No exit condition.
THE KUBERNETES VERSION. In Kubernetes you write a file that says what you want, such as four replicas of an app. The API server checks it and stores it. That stored record is the desired state. Controllers then compare desired with actual, forever. One pod dies, actual drops to three, a controller creates a fourth. The scheduler picks which node gets the new pod. On each node, an agent called the kubelet makes sure the pods it was given are running. The project's own docs call a controller a loop that never terminates and point to a thermostat as the picture. They also admit a busy cluster may never be perfectly still. That is fine. The goal is not stillness. The goal is that someone keeps reconciling.
DECLARED VERSUS SCRIPTED. A script says, do these steps. A declaration says, this must be true. A script is great on day one and blind on day ninety, when something drifted and nothing is comparing. A declaration plus a reconciler heals itself, because the comparison runs whether or not anyone remembers what happened.
For that to work, every fix has to be idempotent: run it once or a hundred times, the result is the same, and anything already correct is untouched. Aaron filled the lamp that was low. He did not dump oil on the one that was full.
STALE STATE. The worst bug in a reconciler is not a crash. It is a stale spec. Under King Josiah the book of the law was found during repairs. [[2 Kings 22:8]] Reading it hit like a failing test. [[2 Kings 22:11]] The king named the root cause. [[2 Kings 22:13]] The people had kept up their motions, but against a pattern that had drifted from the written one. Every report said fine. Every report was wrong.
James puts the same failure inside one person. [[James 1:23]] [[James 1:24]] One look, then drift. [[James 1:25]] The one who keeps reading the true copy, and keeps doing it, is the one who is blessed.
OUR HOUSE, FROM OUR FILES. Our home server runs this exact pattern with no Kubernetes. One file in the repo lists every service with its installer and an enabled flag, and it says that merging a change to that list is the deploy. A loop runs every fifteen minutes and executes every enabled installer, every time. The installers are idempotent, so nothing that is right gets touched. Disabled ones are skipped and named.
The loop hit stale state for real. In August, its copy of the repo sat a night behind, so every cycle faithfully applied yesterday's list. The fix was to pull first. Eleven days later the pull itself was failing quietly over file ownership, and the loop kept shipping a stale tree that looked healthy. The fix: pull as the files' owner, and print the reason on both channels when it fails. And our written Way for a service coming home says the step that moves the running code onto the repo's code must run on every path, and a witness must show running code next to repo code. That is Moses' diff.
SAY WHY, OR IT IS NOT A CHECK. A reconciler that only says pass or fail is half a keeper. Our loop proved it. For a week in August every run failed, and the log kept only one line: the name of the service being installed. The real error went to a stream nobody saved. Six failures, zero causes. The fix was simple. Keep the last lines of each failure and print them where the log is actually kept. Then a second fix came. One small rider failed on days its source would not answer, and that turned the whole fleet red for hours while everything else was fine. Now a service can exit as degraded. The fleet stays green, and the one that limped is named with its reason. A witness that is always red is no witness. Moses did not just bless or curse the build. He looked at all of it.
WHAT YOU CAN BUILD. If you code, build a reconciler, not a script, for anything that must stay true. If you do not, apply it to your own life: write the spec, check on a schedule, fix only the gap, and keep the spec current.
IT IS KEPT. Every human loop eventually lapses. Jesus does not. He is the High Priest of the true tabernacle, [[Hebrews 8:1]] [[Hebrews 8:2]] who always lives to intercede. [[Hebrews 7:25]] He is the Lamb of Yahweh, [[John 1:29]] the Son given, [[John 3:16]] the Eternal Son, [[Hebrews 1:8]] who holds all things together, [[Colossians 1:17]] the same yesterday, today and for ever. [[Hebrews 13:8]]
FOUR RULES. Declare before you build. Make every fix idempotent. Keep the spec fresh. Diff on a schedule and log the reason.
${FACTS.teen}
${TALK.teen}`;

const SENIOR = `${TITLE}.
WHO SENT THIS. Darrell forwarded a system design newsletter, led by an article on Kubernetes for busy engineers, with a single word above it: Lesson. The present lesson draws one principle from it: that a system is best kept by a declared desired state and by keepers who return to it without end. The pattern verse has been read twice already in this course: in week eighty-six, as the written plan behind the tool, and in week ninety-one, as the measure against which an answer is graded. Here the subject is the keeping itself.
THE WORD FIRST. The tabernacle was complete in pattern before it existed in wood and gold. Moses was shown the whole on the mount and charged to make it accordingly. [[Exodus 25:9]] [[Exodus 25:40]] The writer to the Hebrews recalls that charge as an admonition. [[Hebrews 8:5]] When the work was finished, it was judged by comparison with what had been commanded, not by the workmen's memory or preference. [[Exodus 39:42]] [[Exodus 39:43]] Moses beheld the work, found it conformed to the pattern, and only then pronounced the blessing.
THE DAILY ORDERING OF THE LAMPS. Yet a finished sanctuary did not complete the obligation. The lamp was to burn always, [[Exodus 27:20]] and that requirement was met not by a single lighting but by a priest who returned on a fixed cycle. [[Leviticus 24:3]] [[Leviticus 24:4]] Morning and evening are named. [[Exodus 30:7]] [[Exodus 30:8]] Each time Aaron surveyed the lamps as they actually stood, attended to whatever had departed from the appointed order, and left the rest as it was. The statute is perpetual; the word is continually. The pattern was given once. The keeping was never concluded.
THE PRINCIPLE IN THE MACHINE. Kubernetes applies that same arrangement to computing. The operator does not issue a sequence of commands; he records in a file what ought to be true, for instance that four copies of a given program should be running. That record is checked, stored, and treated as the desired state. Controllers then compare it continually with the actual state and act to close any difference: should one copy fail, another is started. A scheduler assigns each copy to a machine, and an agent on each machine sees that its assigned copies run. The project's own documentation describes the controller as a loop without end, likens it to a thermostat, and acknowledges that a busy cluster may never come fully to rest, which is acceptable so long as the controllers continue their work.
TWO MANNERS OF KEEPING. A household may be kept in either of two manners. The first is a sequence of tasks performed once: sound on the day it is done, and silent thereafter, so that any drift passes unnoticed. The second is a written account of what should hold, together with someone who returns on schedule to compare and correct. The second endures interruption and forgetfulness, because it relies only on the pattern being written and the keeper returning.
Such keeping requires that each corrective step be safe to repeat. A careful priest supplied oil where it was lacking and did not flood a lamp already full. Engineers call this property idempotence: a step performed again changes nothing that is already right.
THE COPY THAT MUST BE CURRENT. The gravest failure of a faithful keeper is to keep the house to an outdated pattern. In the days of Josiah the book of the law was recovered during the repair of the house. [[2 Kings 22:8]] When it was read to the king, the distance between the house and the book was plain to him. [[2 Kings 22:11]] He named its cause without excuse. [[2 Kings 22:13]] The generations before him had not ceased their labors; they had ceased to labor from the written word. From without, such drift is indistinguishable from fidelity.
The apostle James describes the same condition in a single life. [[James 1:23]] [[James 1:24]] [[James 1:25]] The blessing rests on the one who continues in the true copy, not on the one who glanced at it once.
THIS HOUSE, TRACED TO ITS FILES. The family's home server is kept by this very arrangement, without Kubernetes. A single file in the repository lists each service, the installer that establishes it, and whether it is enabled; the file states that adding a service and merging the change constitutes its deployment. Every fifteen minutes a loop reads that list and runs each enabled installer in turn. The installers are written to be safe to repeat, so that a service already in order is left untouched and one that has failed is restored. Disabled entries are passed over, and the loop records that it passed them over.
The loop has also learned, by measurement, the lesson of Josiah. In August its copy of the repository was found a night out of date, and each cycle faithfully restored the previous day's list; it now obtains the current copy before doing anything else. Eleven days later that very step was found failing in silence because of file ownership, so that a stale deployment resembled a healthy one; the step now runs as the owner of the files and declares its reason aloud when it fails. In October a daily limit on the loop left a camera service running code thirteen hours old while the new code lay on the disk, and the limit was raised with the reason recorded. Finally, the house's written Way for bringing a service home requires that the step moving a running service onto the repository's code be taken on every path, and that a witness show the running code beside the repository's code: the inspection of Moses, renewed.
APPLICATION. Whether one keeps machines, accounts, medicines or a household's routines, the principle holds: write what should be true, make each correction safe to repeat, keep the written copy current, and compare at fixed seasons, stating plainly why any difference arose.
HE KEEPS THE TRUE TABERNACLE. Every human keeper wearies, and every copy in human hands may fall out of date. One High Priest serves without interruption, [[Hebrews 8:1]] [[Hebrews 8:2]] for He ever lives to make intercession. [[Hebrews 7:25]] He is the Lamb of Yahweh, [[John 1:29]] the Son the Father gave, [[John 3:16]] the Eternal Son whose throne is for ever, [[Hebrews 1:8]] in whom all things consist, [[Colossians 1:17]] and who does not change. [[Hebrews 13:8]] We order our lamps continually because we are not He; we do so in peace because He holds the true tabernacle.
FOUR PRACTICES. Declare the pattern before building. Make each correction safe to repeat. Keep the pattern current. Compare on a schedule and record the reason for every difference.
${FACTS.senior}
${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.
THE WORD FIRST. [[Exodus 25:40]] [[Leviticus 24:4]] The pattern was shown before anything was built, and the lamps were kept to it by a priest who came back every evening and every morning, continually.
THE MACHINE. Kubernetes keeps programs running the same way: you declare what should be true, and controllers compare what is with what should be, forever, and close the gap.
THE COPY. [[2 Kings 22:8]] A faithful keeper with an old copy keeps the house to the wrong pattern; the copy must be fresh.
OUR OWN HOUSE. Our home server keeps one written list of services, and a loop every fifteen minutes runs each enabled installer, safe to repeat, after first pulling the newest copy of the list.
THE TIERS. REPORTED: the newsletter's tour of the Kubernetes parts. DOCUMENTED: the controller loop, from the project's own docs. MEASURED: our own files. NOT VERIFIED: whether the home server's loop is firing today. ${REVIEW}.
PLACEMENT. Sovereign A.I., week 96, because a house that runs its own machines must keep them to a declared pattern, not to a memory.
CLOSE. [[Hebrews 7:25]] Jesus, the Lamb of Yahweh and the Eternal Son, is the High Priest who never stops keeping.`,
  inApp: `One screen to read in this app, and one page in your Study.
In the app: open Sovereign A.I. week 96 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one is whole on its own. Then pick one thing in your house that should always be true, and write it as a pattern, not as a step.
In your Study, write three lines. One pattern you will declare. One keeping step you will repeat, safe to run again. One day each week you will compare what is with what you wrote. [[Leviticus 24:3]]`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Exodus 25:40]] [[Leviticus 24:4]] [[Exodus 39:43]] [[2 Kings 22:13]] [[James 1:25]] [[Hebrews 7:25]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, each landing on your own house.
First, read Exodus 25:1-9 and Exodus 39:42-43. Mark when the pattern was shown and when the work was inspected. Write one sentence on something you built without a written pattern.
Second, read Leviticus 24:1-4 and Exodus 30:7-8. Mark every word that says the keeping never ends. Write down one thing in your house that should always be true.
Third, read 2 Kings 22:8-13 and James 1:22-25. Write down one pattern you follow that may be out of date.
And one verification reading, because this course works this way. The newsletter's tour of the parts is reported. The controller loop is documented by the project itself. Our house was read from our own files. Whether our home server's loop is firing today is not verified.`,
    plan: `PLAN. Decide four steps before the week starts, and decide who hears them.
One: the pattern. Write down three things that should always be true in your house, in plain words.
Two: the keeping step. For each one, decide the check and the fix, and make the fix safe to repeat.
Three: the fresh copy. Decide where the one current copy lives, so nobody keeps to an old one.
Four: the season. Choose the day and the hour each week when you will compare what is with what you wrote.
Then name the person who will ask you about all four on the same day next week.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.
Write the pattern. Each day, compare one item with what is, and fix only the gap. At the end of the week, read the pattern again and change anything that is no longer current.
Teach the verse at a meal: he shall order the lamps continually. Ask a child what in your house should always be true.
At the end of the week, answer three questions to the person who is asking. What drifted? What did you fix? What did you change in the pattern itself?
Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a system design newsletter, answered from the Word with one idea taken from it, not five.`,
    `The hour opened by Exodus 25:40 and Leviticus 24:4: the pattern shown first, and the lamps kept to it continually.`,
    `Exodus 39:42-43 read as the first inspection: what is, held beside what was commanded.`,
    `Kubernetes explained in plain words: declared desired state, and controllers that compare and correct forever.`,
    `Two ways to run a house named - steps done once, and a written pattern with a keeper - and why the second heals drift.`,
    `Idempotence taught as a careful priest: fill the lamp that is low, leave the full one alone.`,
    `2 Kings 22:8-13 laid beside it: a house kept faithfully to the wrong copy, and a king who named the cause.`,
    `James 1:23-25: the one who looks once and forgets, and the one who continues in the true copy.`,
    `Our own home server measured from its files: one list, a fifteen-minute keeper, installers safe to repeat, and the fresh copy pulled first.`,
    `Three times our own loop learned that a stale copy looks exactly like a healthy one, each written down with its fix.`,
    `Jesus confessed as the High Priest who ever lives to make intercession, the Lamb of Yahweh and the Eternal Son (Hebrews 7:25).`,
    `The reported, the documented, the measured and the unverified told apart in every reader place, with a dated re-review.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'light',
      verse: 'Leviticus 24:4',
      title: 'The card on the refrigerator',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A family with four children kept losing track of the small things that kept the house running. The goldfish was fed twice one day and not at all the next. The porch light was left on all week. Nobody could say whether the back door had been locked.
The oldest daughter got tired of the arguments and wrote a card for the refrigerator. It did not say what to do. It said what should be true at bedtime: the fish is fed once today, the porch light is off, the back door is locked, the phones are charging in the kitchen.
Each night one child walked the house with the card in hand. If the fish had already been fed, they left the food alone. If the door was already locked, they moved on. They only fixed what did not match. Within a month the arguments stopped, because nobody had to remember what anyone else had done. They only had to read the card and look. When the family got a second fish, the father changed the card that same evening, so nobody would keep the house to the old one.`,
    },
    {
      kind: 'parable',
      tone: 'solemn',
      verse: '2 Kings 22:13',
      title: 'The checklist nobody had read in years',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A small clinic had a nurse who checked the emergency cart every morning for eleven years. She was faithful. She opened every drawer, counted every item against the list taped inside the lid, and signed the log. Not once did she miss a day.
One winter a new doctor asked to see the current standard for the cart. The office manager found it in a binder: it had been revised four years earlier. Two medicines on the taped list were no longer recommended, and one that was now required had never been added. The nurse had kept the cart perfectly, to a list that had gone out of date.
Nobody had done anything careless. Every morning the work had been real and the log had been true. That was what troubled the nurse most when she understood it. She said afterward that she would rather have found a missed day than a perfect record kept to the wrong list. The next morning the old list came down from the lid, the current one went up, and the clinic made one person responsible for checking the list itself every season.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Exodus 25:40, what came before the building of the tabernacle?',
        options: ['A vote of the people', 'The pattern, shewed to Moses in the mount', 'A trial tent built first'],
        answer: 1,
        explain: 'The pattern was shown complete before any work began, and the work was to be made after it. The pattern is declared first.',
      },
      {
        q: 'What did Moses do in Exodus 39:43 before he blessed the people?',
        options: ['He counted the workers', 'He looked upon all the work and found it done as had been commanded', 'He rebuilt it himself'],
        answer: 1,
        explain: 'He compared what was made with what was commanded. That comparison of what is with what was shown is the heart of keeping.',
      },
      {
        q: 'According to Leviticus 24:3-4, how often was Aaron to order the lamps?',
        options: ['Once, at the dedication', 'From the evening unto the morning, continually, a statute for ever', 'Only on feast days'],
        answer: 1,
        explain: 'The keeping never ended. Morning and evening the priest came back and set each lamp to what the pattern required (Exodus 30:7-8).',
      },
      {
        q: 'In Kubernetes, what is the desired state?',
        options: [
          'Whatever happens to be running right now',
          'What you declared should be true, such as four copies of a program, stored for the controllers to keep',
          'A list of steps run once',
        ],
        answer: 1,
        explain: 'You declare what should be true. The controllers keep comparing the actual state with it and act to close the gap.',
      },
      {
        q: 'What picture do the Kubernetes docs use for a controller?',
        options: ['A light switch', 'A thermostat that keeps bringing the room toward the temperature you set', 'A calendar'],
        answer: 1,
        explain: 'A thermostat never says done. It keeps comparing and correcting, just as the lamps were ordered continually.',
      },
      {
        q: 'What does idempotent mean for a keeping step?',
        options: [
          'It must run only once',
          'Running it again changes nothing that was already right; it fixes only what is missing',
          'It deletes everything and starts over',
        ],
        answer: 1,
        explain: 'A careful priest filled the lamp that was low and left the full one alone. A step safe to repeat can run every cycle without harm.',
      },
      {
        q: 'What was found in 2 Kings 22:8, and why did it matter?',
        options: [
          'Gold for the repairs',
          'The book of the law, lost inside the house; the house had been kept by habit, not by the written copy',
          'A new set of lamps',
        ],
        answer: 1,
        explain:
          'The fathers had not stopped working; they had stopped working from the book (2 Kings 22:13). A keeper with an old copy keeps the house to the wrong pattern.',
      },
      {
        q: 'In James 1:25, who is blessed in his deed?',
        options: ['The one who glances once', 'The one who looketh into the perfect law of liberty and continueth therein', 'The one who owns the mirror'],
        answer: 1,
        explain: 'Looking once and forgetting is drift. Continuing in the true copy is keeping.',
      },
      {
        q: 'How does our own home server keep its services, according to its files?',
        options: [
          'A person installs each one by hand',
          'One written list, and a loop every fifteen minutes that pulls the newest copy and runs every enabled installer, each safe to repeat',
          'It never changes once set up',
        ],
        answer: 1,
        explain:
          'The loop learned by measurement to pull the current copy first and to say why when it cannot, because a stale copy looks exactly like a healthy one.',
      },
      {
        q: 'In Hebrews 7:25, why is Jesus able to save to the uttermost?',
        options: ['Because He was once a priest', 'Seeing He ever liveth to make intercession for them', 'Because the tabernacle still stands'],
        answer: 1,
        explain: 'Every human keeper grows tired. He is the High Priest of the true tabernacle (Hebrews 8:1-2), who never leaves His post.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Exodus 25:40 and Leviticus 24:3-4 aloud before you say one word about any machine. Write two words on the board: declared, and kept. Then ask the room: what in your house should always be true, and who checks it?
MINUTES 0 TO 12 - THE PATTERN. Exodus 25:1-9, 25:40 and 39:42-43. Ask: what came first, and how was the finished work judged?
MINUTES 12 TO 24 - THE LAMPS. Exodus 27:20-21, 30:7-8 and Leviticus 24:1-4. Have someone list every word that says the keeping never ends.
MINUTES 24 TO 36 - THE MACHINE. Explain Kubernetes in plain words: the declared desired state, the controllers that compare and correct, the thermostat. Teach idempotence with the full lamp and the low one.
MINUTES 36 TO 48 - THE COPY. 2 Kings 22:8-13 and James 1:23-25. Ask: what pattern might we be keeping faithfully that is out of date? Tell how our own home server learned to pull the newest copy first.
MINUTES 48 TO 60 - IT IS KEPT. Hebrews 8:1-2, Hebrews 7:25, Hebrews 13:8, John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Give the four household practices and the week's assignment.
WHAT NOT TO DO. Do not make the hour about Kubernetes; the machine is the occasion, the Word frames it. Do not teach the other four pieces of the newsletter here; they belong to their own weeks. Do not claim our home server's loop is running today; we read its files, not the machine.`,
    talkingPoints: [
      `Make them after their pattern, which was shewed thee in the mount (Exodus 25:40).`,
      `Moses looked upon all the work, and it was done as commanded (Exodus 39:43).`,
      `He shall order the lamps continually (Leviticus 24:4).`,
      `Morning and evening, the keeper came back (Exodus 30:7-8).`,
      `Kubernetes: declare the desired state; controllers compare and correct forever.`,
      `A thermostat never says done.`,
      `A step safe to repeat: fill the low lamp, leave the full one.`,
      `The book was lost inside the house it was meant to guide (2 Kings 22:8).`,
      `Our fathers have not hearkened unto the words of this book (2 Kings 22:13).`,
      `Look, and continue therein (James 1:25).`,
      `Our home server: one list, a fifteen-minute keeper, the newest copy pulled first.`,
      `A stale copy looks exactly like a healthy one.`,
      `He ever liveth to make intercession (Hebrews 7:25).`,
    ],
    discussionPrompts: [
      `What in your house should always be true?`,
      `Which of your routines are written down, and which live only in memory?`,
      `What keeping step do you repeat that would do harm if run twice?`,
      `What pattern might you be keeping faithfully that is out of date?`,
      `Who in your house compares what is with what should be?`,
      `When something drifts, how would you know, and who would say why?`,
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
console.log(`sov96: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov96: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov96: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov96: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov96: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov96: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov96: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov96: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov96: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov96: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov96: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov96: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov96: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov96: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov96: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov96: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov96: spliced ${ID}`);
console.log(`sov96: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov96: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
