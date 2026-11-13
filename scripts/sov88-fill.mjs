// =============================================================================
// sov88-fill - build Sovereign A.I. week 88 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[Numbers 2:2]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory. The reference list on the module's
// anchor is DERIVED from the placeholders that actually occur in the reader
// places, so anchor.ref names every verse the lesson stands on and nothing it
// does not (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-11-07 at 16:30 UTC ByteByteGo sent EP232,
// 6 Frequently Used Orchestration Frameworks in an AI system. On 2026-11-09 at
// 13:29 UTC - 7:29 AM Central - Darrell forwarded it out of his university
// mailbox into the lesson lane with ONE WORD typed above the forwarded header:
// Lesson. Gmail thread `1a1b6e6085128724`. The scheduled intake fell behind;
// this build drains it on 2026-11-13. The six one-line framework descriptions
// came whole in the email; the diagram came only as an image, and
// blog.bytebytego.com answered `curl: (56) CONNECT tunnel failed, response 403`
// on 2026-11-13, so nothing is taught from the picture. The two sponsor blocks
// and the issue's other three items (cost strategies, how a SQL query runs -
// week 83's ground - and the request path, kept only as the inside of item six)
// are left out so one forward stays one teaching.
//
// THE NUMBER. Week 84 was claimed by another session; 85, 86 and 87 were in
// flight from this orchestrator. This build claimed reserve/sov88 with an
// empty-value lease before writing, and HELD_IN_FLIGHT carries [84, 85, 86, 87]
// until they land - the landing order this lesson teaches.
//
// WORD FIRST (DR-0127 / DR-0282). Colossians 2:19 - holding the Head - and
// Numbers 2:2 - every man by his own standard - frame the hour before a single
// word about an orchestrator. Week 70 (DR-1357) already taught Nehemiah 3,
// Exodus 18 and 1 Corinthians 12, and week 84 is built on 1 Corinthians 12, so
// this hour stands on Numbers 2, 4, 9 and 33, Mark 6 and John 5 and LINKS to
// those weeks by name rather than quoting them again.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). ESTABLISHED: orchestration
// as ordinary engineering, and that the six named frameworks are real,
// publicly released tools. REPORTED (ByteByteGo, EP232): the one-line account
// of how each keeps order; no ranking is made. MEASURED on 2026-11-13, each
// with file:line in the DR: the lanes and the order of landing (DR-0077:30-37),
// the reservation referee (scripts/lib/reserve-ref.mjs:11, :29), the capacity
// budget (scripts/capacity-budget.mjs:22-24, run live: room 3, wanted 4, over
// by 1), the course's held weeks (sovereign-ai-class.test.js:176), the ledger
// conflicts (scripts/resolve-ledger-conflicts.mjs:5-31) and the live landing
// train at 17:10 UTC (7 of the 14 PRs opened that day `dirty`; the usage
// ledger in 6 of the 7, INDEX.md in 3). NOT MEASURED: the hours it has cost.
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 88;
const ID = 'sov88-every-man-by-his-own-standard';
const TITLE =
  'Every man by his own standard - one camp kept in order under one Head, six ways the machines are taught to keep step, and the one book every builder had to write in';

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
  if (!m) throw new Error(`sov88: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov88: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov88: reference does not resolve in the corpus -> "${ref}"`);
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
// The sentences every reader place must carry, so a reader who reads ONE band
// still gets the tiers, the house finding and the date (DR-0795).
// -----------------------------------------------------------------------------
const FACTS = {
  lesson:
    "WHERE WE STAND ON THE FACTS. ESTABLISHED, and stated plainly: orchestration - many workers given their tasks, their order, their shared memory and their recovery from failure by something set over them - is ordinary, settled engineering, and the six frameworks the newsletter names are real, publicly released tools from LangChain, CrewAI, Microsoft, OpenAI, Google and Anthropic. REPORTED, by ByteByteGo in its issue of the seventh of November: the one-line account of how each of the six keeps order. Those six descriptions came whole in the email and are taught here as the newsletter gives them; each project's own manual was not opened for this hour, so no ranking is made and nothing is claimed beyond the newsletter's sentence. The diagram that went with the list came only as a picture, and the newsletter's site refused our network when it was asked for on the thirteenth of November, so nothing is taught from the picture. MEASURED in our own house: every claim below about how this app's builders are kept in order is traced to the file and line that does it, and two numbers were read live on the thirteenth - the room the machine had for more builders, and how many of that day's pieces of work were stuck in conflict. NOT MEASURED: how many hours those conflicts have cost in all. That is not counted here, and no number is guessed for it. re-review: 2026-11-27.",
  child:
    'WHAT IS SURE AND WHAT IS NOT. Teams of computer helpers are real. The six tools are real too. The short way each tool works came from the email. We took the email at its word and did not test the tools. There was a picture in the email that did not come through, so we left it out. We looked at the code in our own app. We counted the stuck jobs and the room for helpers on the day this was written. We did not count how many hours the stuck jobs cost. We will look again. re-review: 2026-11-27.',
  youth:
    'WHAT IS SURE AND WHAT IS NOT. Running many computer helpers under one leader is normal, well-known work. The six tools named are real ones, made by real companies. The newsletter told how each tool works in one sentence each. We teach it the way they said it, and we do not rank them. A picture came with the list, but it did not come through. Their website was blocked from our network too, so we left the picture out. What we say about our own app was checked against its code. Two numbers were counted that afternoon. The total hours lost to the stuck work were not counted. re-review: 2026-11-27.',
  teen: "WHAT IS SURE AND WHAT IS NOT. Know what kind of claim each one is. Established: orchestration is standard engineering, and all six frameworks are real tools you can download. Reported: the one-line account of how each works is the newsletter's, taught as they gave it, with no ranking. Left out: a diagram that only came as an image, since their site was blocked from our network. Measured: our own build, file by file, plus two numbers counted live that afternoon. Not measured: the total hours the conflicts have cost. re-review: 2026-11-27.",
  senior:
    "WHERE WE STAND ON THE FACTS. That a coordinating layer keeps many workers in order, and that the six frameworks named are real and publicly released, is established and is stated without hedging. The account of how each framework keeps order is the newsletter's own, reported as given and not ranked; the projects' own documentation was not consulted for this hour. The diagram that accompanied the list arrived only as an image, and the newsletter's website refused our network on the thirteenth of November, so nothing is drawn from it. Every statement about this application is traced to the code or record that makes it true, and two figures were read live that afternoon. The total cost in hours of the conflicts described has not been measured, and no figure is offered for it. re-review: 2026-11-27.",
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - when our family is busy and everyone is going a different way, who do you think decides what happens next - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Numbers 2:2. Children, ask your mother, your father or a grandparent about a time a big group they belonged to - a team, a church project, a crew at work - ran in good order, and who kept it that way; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: in the things we do together, who is the head, and are we both holding on to Him. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - who gets to say when our family goes - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Colossians 2:19. Children, ask your mom or your dad or your grandma or your grandpa about the biggest team they were ever on. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: when we play together, how do we take turns. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when a group project goes wrong, what usually breaks first - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Numbers 9:18. Children, ask your mom, your dad or a grandparent about a time they had to wait for somebody else's go-ahead before they could move, and hear the whole of it before you answer; then retell their answer in your own words. Then ask a friend this: what shared thing between us keeps getting written over or lost. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - who do you actually follow when nobody says who is in charge - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, Luke 14:31. Children, ask your mom, your dad or a grandparent about a time they said yes to too much and how they got out of it, and hear all of it, the whole of it, before you reply; then retell their answer in your own words. Then ask a friend this: when we work on something together, who sets the order, and does it work. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what keeps a family moving together when everyone is busy - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Mark 6:40. Children, ask your parents or your grandparents about the best-run work crew, choir or congregation they ever served in, and what made it run well; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: in what we do together, are we both holding the Head, or only holding the plan. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no detail from the newsletter stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the seventh of November 2026 a short engineering newsletter reached Darrell's university mailbox. At 7:29 on Monday morning, the ninth, he forwarded it into this lane with ONE WORD typed above the forwarded header: Lesson. That word is the ask; the newsletter is only the occasion. The intake fell behind, and this was built by hand on the thirteenth of November by one of several builders working side by side that day - which is exactly what the newsletter was about.

THE WORD FIRST, BEFORE ANY MACHINE. Two verses frame this hour. The first is about the Head. Paul wrote to a church being pulled toward rules and visions that did not come from Christ, and warned about the member who lets go: [[Colossians 2:19]] The whole body grows, joints and bands and every part, but only while it holds the Head. The second is about the members. When Yahweh set Israel in order in the wilderness - more than six hundred thousand fighting men and their families around one tent - the first instruction was this: [[Numbers 2:2]] Every man had his own standard, every family its own ground, and all of it faced one center. The chapter ends with the report every leader wants: [[Numbers 2:34]] Hold the Head, and keep your place. Then hear the article.

WHAT THE NEWSLETTER TEACHES. ByteByteGo opened its issue with six frequently used orchestration frameworks in an A.I. system, and its definition is worth keeping: orchestration manages tasks across agents, handles failures, and keeps shared memory and context. An agent is a program that uses a language model to choose its next step and then takes it. Several agents on one job are a crew, and a crew needs something that says who does what, in what order, what everyone knows, and what happens when one fails. That is the orchestrator, named after the conductor of an orchestra.

This is close to home. On the day this was written, one orchestrating session was sending lessons to several builder sessions at once, each in its own copy of the code, each with the same written brief. The six descriptions are about our own camp.`,

  FACTS.lesson,

  `MOVEMENT ONE: THE CAMP UNDER THE CLOUD. Israel did not decide by vote when to move. [[Numbers 9:18]] One signal, and every tribe watched the same one; however long it stayed, nobody went ahead on his own: [[Numbers 9:22]] That is the first job of an orchestrator: workers do not start themselves into a collision.

The order of the march was settled before the march. Judah first: [[Numbers 2:9]] The tabernacle in the middle: [[Numbers 2:17]] Nobody argued at the edge of camp, because it had been decided at rest. That is the second job: the order is set before the work, not during it.

And the camp shared one memory: [[Numbers 9:23]] A man of Dan at the back and a man of Judah at the front worked from one instruction delivered by one hand. That is the third job, shared context. The fourth, recovering from failure, had its provision too, in the silver trumpets of alarm. Every one of these jobs belongs to something above the workers, never to one worker deciding for the rest.

Week seventy of this course read Nehemiah's builders, each over against his own house, and Jethro's rulers of thousands and hundreds, and a Living Lesson returned to Jethro since. Those teach dividing the work. This hour asks the question above it: once the work is divided, what keeps it in one order under one Head?`,

  `MOVEMENT TWO: SIX WAYS TO KEEP A CREW IN STEP, AS THE NEWSLETTER REPORTS THEM. Each is given in the newsletter's own description, put plainly, beside a picture from the Word of the same shape. The newsletter ranks none of them, and neither does this lesson; they are shapes for different work.

One, LangGraph: a graph. Each step is a node; the edges between them say which step may follow which, and the state of the work travels along them. Israel's journey was kept that way: [[Numbers 33:2]] Each station a node, each departure an edge. A graph fits when the path must be written down.

Two, CrewAI: roles. Each agent has a role and a goal and works in sequence, or under a manager agent who hands out the work. So were the Levites: [[Numbers 4:49]] Kohath carried the holy things, Gershon the curtains, Merari the boards. Nobody carried another's load, and nobody had none.

Three, Microsoft Agent Framework: a graph for an organization's workflows, with branches, saved checkpoints and pauses where a person decides. When men made unclean asked about the Passover, Moses did not guess: [[Numbers 9:8]] A pause fits when a wrong step costs more than a short wait.

Four, the OpenAI Agents SDK: handoffs. The agent decides while it runs whether to finish a task or pass control to another agent. Israel's judges had that rule: [[Deuteronomy 1:17]] The danger is that the worker judges its own limits, so the rule for handing up must be set before the work starts.

Five, Google's Agent Development Kit: a hybrid. The developer sets the strategy and a root agent splits the work among sub-agents. That is Numbers 2: Yahweh set four camps of three tribes, and a captain over each carried the order: [[Numbers 2:3]]

Six, the Claude Agent SDK: the loop. Here, the newsletter says, no separate orchestration layer exists; it lives inside one agent that gathers context, uses tools, checks its work and keeps going until no calls are left. The same issue traced that loop: the agent proposes, a permission system checks the proposal against the rules, the tool runs, the result returns, and around it goes. [[Proverbs 16:9]] The worker plans; the step must be directed from above. The newsletter's own trace puts the rule-check between the plan and the act, which is the right place for it.

A map, roles, a map with pauses, handoffs, a plan with captains, a loop with a check. Each answers who decides the next step, what each worker knows, and what happens when one fails - and each is only as good as what sits at the top.`,

  `MOVEMENT THREE: THE ORCHESTRATOR IS A SERVANT, NOT THE HEAD. Here the Word corrects how people talk. The orchestrator is called the brain. It is not. At best it is the priest who blew the trumpet; the cloud was never his to lift. The Head is named plainly: [[Colossians 1:18]]

The Son Himself shows what acting under a Head looks like: [[John 5:19]] [[John 5:30]] He is not a tool, and nothing here makes Him one. The point runs the other way. If the Eternal Son, co-eternal with the Father, chose to do nothing of Himself, then a crew of programs that does whatever its loop proposes, with nobody above it, has lost the thing that makes work good.

Our house writes that order down. Its standing rule for how it builds says the orchestrator directs the lanes, re-checks them and brings them into the main code in order, never editing the work by hand, and every lane must check itself before calling its work done. Above the orchestrator is the Governor, Darrell, whose hand on moving work is a label named hold: it stops any piece until he lifts it. Above him is the Head of the house. The machines are at the bottom of that order, where tools belong.`,

  `MOVEMENT FOUR: OUR OWN CAMP, MEASURED. Each claim here is traced to the code that does it.

Lanes and the brief. Each builder works in its own copy of the code, so no two type into one file at once, and each receives the same written brief first - the charge of the camp delivered to every tent.

The lock. A builder claims its number by writing a marker on the shared server, and the server referees: the first claim on a name wins, and a second claim on that exact name is refused. This builder claimed week eighty-eight that way before writing. The honest edge, found in this course the same day: the claiming tool knows the spelling only for decision records and Living Lessons, so this course claims its weeks by a convention every builder must type exactly. That rule is kept by care, not by the machine.

The count. A small program measures free memory and disk against the cost of one builder before more are sent. Run while this was written, it said: room for three, four asked for, over budget by one - launch three and queue the rest. [[Luke 14:31]] An orchestrator that launches without counting is the king who did not sit down.

The order of landing. Weeks in this course must land in number order, and the course's test holds a later week until the earlier ones arrive. Weeks eighty-four through eighty-seven were being built the same day, so this one waits behind them, in the second rank, and is content to.

The board. The app's Ops board, in the See tab of the Command and Serve Center, shows every piece of work in flight and sorts it into a lane: safe to land in parallel, or must land alone. Its rule marks work must-land-alone only when it touches the one large shared screen file or a database change. The shared books below are not on its list, so a lesson stuck on them still reads as safe. The board is true about what it measures; it does not yet measure where today's collisions happened.`,

  `MOVEMENT FIVE: THE ONE BOOK EVERY BUILDER HAD TO WRITE IN. Every finished piece of work adds a line to a few shared books - the register of the house's decisions, and the ledger of what each piece of A.I.-assisted work cost in hours. Every builder writes at the same place, the end. When one lands, the end moves, and every other builder's line is written against an end that no longer exists. The system that keeps the code sees two last lines, cannot tell which belongs, and stops: a conflict. Someone settles it, every check runs again, and meanwhile another piece lands. Builders call it a landing train.

The house first measured it in September, when at least four finished pieces of work had passed every check and still could not land, the only conflict being in the shared books; it wrote a program to settle them by rule. In early November the cost ledger joined them, and in one afternoon the same conflict was settled by hand five times across nine pieces of work. The program now joins the books by the name of each line, not its text, and on the thirteenth one more change landed so that no builder rewrites the line that used to say what number came next.

Then it was counted again. At ten past five that afternoon, by the servers' clock, fourteen pieces of work opened that day were waiting. Seven could not land because they were in conflict. The cost ledger was in six of the seven; the decision register in three. One lesson in this very course was in conflict on five shared files at once.

Look again at the frame verse: far off about the tabernacle shall they pitch. Every tribe had its own ground, and the one place all must approach had keepers: [[Numbers 1:53]] No wrath, no collision at the center. So with builders: give each its own ground, keep the few shared books add-only with a keeper that joins them the same way every time, and settle the order of arrival before the rush.

Be plain about what is fixed. The keeper settles the books and the worked-out number removed one certain collision. But two lines added at the same end still collide as text, and every check must still run again. It is real, it was measured, and it is not gone.`,

  `MOVEMENT SIX: THE HEAD WHO LOSES NONE. When five thousand men sat on a hillside with nothing to eat, Jesus did not leave the crowd to sort itself: [[Mark 6:39]] [[Mark 6:40]] Order before the bread, so every person was reached. Then: [[John 6:12]] And of every person the Father gives Him: [[John 6:39]] An orchestrator drops tasks and lands work on top of other work. He loses none.

He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] and by Him all things hold together: [[Colossians 1:17]] Every crew we build is small beside that, and every crew - of programs, of builders, of a household - stands under Paul's word to a church falling over itself: [[1 Corinthians 14:40]]`,

  `FOUR THINGS THIS WEEK, and none of them needs a purchase.

One, name the Head. Who decides when your house moves - when you leave, rest, or change a plan? If the answer is whoever speaks loudest, settle it together and set it under the Lord in prayer.

Two, give everyone a standard. Take one shared job that everybody half does and give each person one part that is plainly theirs.

Three, keep one book that only grows - the family calendar, the list of who paid what, the prayer list. Nobody erases a line; a change is a new line.

Four, count before you send. Before one more yes this week, sit down like the king and count the room you have.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that one framework is right, or that the machines are the point. The point is order under a Head: every worker in its place, the order set before the rush, the shared book kept so nobody's line is lost, and every crew holding the Head.`,

  TALK.lesson,
];
// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader, not a
// re-registering of the adult text, and each carries the whole teaching, the
// tiers and the talk-together close (DR-0795).
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

ONE HEAD AND MANY HANDS. This lesson is about how a lot of helpers can work as one team. It is about who is in charge. And it is about staying in your own spot.

WHO SENT THIS. Darrell got an email. It was about computer helpers. He wrote one word on top. The word was Lesson. Then he sent it to us. That one word is why you are reading this.

THE WORD FIRST. Paul wrote a letter to a church. He said the church is like a body, and Jesus is the Head. The body grows when it holds on to the Head. [[Colossians 2:19]]

That means we stay close to Jesus. Then the whole body grows.

AND ONE MORE VERSE. Long ago, Yahweh's people lived in tents in the desert. There were so many of them! Yahweh told each family where to put its tent. Each family had its own flag. [[Numbers 2:2]]

Every family had a flag. Every family had a place. And all the tents faced the one tent in the middle, where Yahweh met with His people.

And they did just what He said. [[Numbers 2:34]]

WHAT THE EMAIL SAID. The email was about computer helpers. Some computer programs can do jobs. They can read. They can write. They can look things up. A helper like that is called an agent. When lots of agents work on one big job, someone has to keep the order. Who goes first? Who does what? What if one gets stuck? The email had a big word for the one who keeps the order. The word is orchestrator. It is like the leader of a band who helps everyone play at the right time.

THE CLOUD AND THE CAMP. Yahweh's people had a cloud over the tent in the middle. When the cloud went up, they packed up and walked. When the cloud stayed, they stayed. [[Numbers 9:18]]

Nobody ran ahead. Nobody stayed behind. They all watched the same cloud. That is what a good team does. It goes when the leader says go. It rests when the leader says rest.

They also knew who went first. The tribe of Judah went first. [[Numbers 2:9]] Then the next group. Then the next. They did not fight about it at the gate. They had settled it before.

SIX WAYS TO RUN A TEAM. The email told about six computer tools. Each one runs a team of helpers in a different way. Here they are, made simple.

The first is like a map. Each stop is a dot. Lines show where to go next. Moses kept a list like that. He wrote down every place they camped. [[Numbers 33:2]]

The second gives each helper a job. One reads. One writes. One checks. The Levites had jobs like that. Each family carried its own part of the holy tent. [[Numbers 4:49]]

The third is a map with stops to wait. The helpers stop and ask a person what to do. Moses did that. Some men asked him a hard question. Moses said, wait here while I ask. [[Numbers 9:8]]

The fourth lets a helper pass the job on. If the job is too hard, it hands it to a better helper. The judges did that. Hard cases went up to Moses. [[Deuteronomy 1:17]]

The fifth has a plan from the top and a leader for each group. Each camp had its own captain. [[Numbers 2:3]]

The sixth is one helper going round and round. It makes a plan. A rule checks the plan. It does the job. It looks at what happened. Then it goes again, until the job is done. [[Proverbs 16:9]] We can make a plan. But Yahweh is the One who guides our steps.

The six tools have names. They are LangGraph, CrewAI, Microsoft Agent Framework, the OpenAI Agents SDK, Google's Agent Development Kit and the Claude Agent SDK. You do not need to remember them. Remember this: every team needs a head.

THE ONE WHO KEEPS THE ORDER IS NOT THE HEAD. The computer boss is just a helper too. It is like the man who blew the horn in the camp. He did not move the cloud. Jesus is the real Head. [[Colossians 1:18]]

Even Jesus said He did what He saw His Father do. [[John 5:19]] Jesus is Yahweh's own Son. He chose to follow His Father. So we follow too.

HOW OUR APP IS BUILT. Our app is built by a team of computer helpers too! One helper keeps the order. It sends jobs to the others. Each helper works in its own copy, so they do not bump into each other. Each one gets the same list of rules first.

Each lesson has a number. A helper must claim its number first, so two helpers do not take the same one. The name has to be spelled just one way, or the computer cannot tell it is the same number. This lesson is number eighty-eight. Other helpers were still writing lessons eighty-four, eighty-five, eighty-six and eighty-seven. So this one waits its turn, like the second group in the line.

Before more helpers were sent, the computer counted. Is there room for more? It said there was room for three more. But four were asked for. That is one too many. So one has to wait. Jesus said a king should sit down and count first. [[Luke 14:31]]

THE ONE BOOK. Here is a problem we found. Every helper has to write one line in the same book when its job is done. They all write at the bottom. When one helper finishes, the bottom moves. Now the others wrote in the wrong spot! The computer stops and says, these do not fit. On the day this lesson was written, seven jobs were stuck like that. That was half of the fourteen jobs from that day.

Long ago, the Levites camped all around the holy tent. They kept it, so the crowd would not crowd in. [[Numbers 1:53]] Our app needs a keeper for its shared book too. It has one. A small program puts the lines in order by their names. But the problem is not all gone yet. We say so.

A STORY ABOUT A CHORE CHART. Here is a made-up story to help you think. It did not really happen.

Five kids lived in one house. Every Saturday they all cleaned the kitchen at the same time. Two kids washed the same pan. Nobody swept. One kid stood in the middle and waited to be told what to do.

Their dad took a big card. He drew five boxes. In each box he wrote one name and one job. Sam washes. Ruth dries. Ben sweeps. Lily wipes the table. Joy puts things away. He hung the card on the fridge.

The next Saturday, each kid went to his own job. Nobody washed the same pan twice. Nobody waited. When a job was done, the kid made a check mark at the bottom of the card. But two kids made their marks in the same spot and could not tell whose was whose. So Dad gave each kid a line of his own to mark on. After that, every mark was in the right place.

JESUS LOSES NONE. One day Jesus fed five thousand men. He did not let them push and shove. He had them sit down in groups. [[Mark 6:39]] Then everyone ate. After, He told His friends to pick up what was left. [[John 6:12]] Nothing lost! And He keeps every person His Father gives Him. [[John 6:39]] A computer helper can lose a job. Jesus never loses one of His.

${FACTS.child}

FOUR THINGS THIS WEEK. One, ask who decides when your family goes. Two, give each person one part of a shared job. Three, keep one list where nobody rubs anything out. Four, count before you say yes to one more thing.

${TALK.child}`;

const YOUTH = `${TITLE}.

THE QUESTION. When lots of workers share one job, what keeps them from tripping over each other? This lesson answers from the Word first. Then it looks at a newsletter about computers. Then it looks at the way our own app gets built.

WHERE IT CAME FROM. A newsletter about building software came on a Saturday in November. Two days later Darrell sent it on to this lesson lane. Above it he typed just one word: Lesson. His word is the reason this exists. The newsletter is only what got us talking. It sat in a pile that fell behind. It was built on the thirteenth of November.

TWO VERSES TO START. The first is about Jesus as the Head of His people. Paul told believers not to let go of Him: [[Colossians 2:19]] A body grows when every joint holds on to the head. Let go of the head, and the body stops growing the right way.

The second comes from the desert. Yahweh was setting a huge nation in order. There were more than six hundred thousand men who could fight, plus all their families. His first rule was simple: [[Numbers 2:2]] Each family had a flag. Each family had a spot. Everybody faced the tent in the middle. Hold on to the Head. Stay in your place. Keep those two ideas in mind for the rest of the hour.

WHAT THE NEWSLETTER SAID. The newsletter is called ByteByteGo. Its first item was about orchestration. That word comes from music. An orchestra has dozens of players and one conductor. In computers, an agent is a program that uses an A.I. model to pick its next step. Then it does that step. Some jobs need many agents. Then something has to hand out the tasks. It has to set the order. It has to keep everyone working from the same facts. And it has to deal with it when one agent fails. That something is called the orchestrator. The newsletter listed six tools people use for it.

HOW THE CAMP MOVED. Israel had a conductor of its own, and it was not a person. A cloud rested on the tent in the middle. When it lifted, the people packed up. Where it stopped, they set up camp. [[Numbers 9:17]] Sometimes it stayed for days. Sometimes it stayed a whole year. They waited the whole time. [[Numbers 9:22]] Nobody started early because he was bored. Nobody stayed behind because he was comfy.

The marching order was set before anyone took a step. Judah went first. Reuben's group came next, in the second place. [[Numbers 2:16]] The tent of meeting went in the middle. There was no shoving at the edge of camp. The order had been picked while everyone was resting.

THE SIX, MADE SIMPLE. Here is how the newsletter describes each tool. Each one has a picture from the Word next to it. The newsletter does not say which is best, and we will not either. They fit different jobs.

LangGraph works like a map with dots and lines. Each dot is a step. Each line shows which step can come next. Moses kept that kind of map of the whole trip: [[Numbers 33:2]]

CrewAI gives each agent a role and a goal. Think of a team where one person looks things up, one writes, and one checks. The work goes in order, or a manager agent hands it out. The Levites worked like that. Each family carried its own part of the holy tent: [[Numbers 4:49]]

Microsoft Agent Framework uses a map too. But it adds branches and saved spots to go back to. It also has places where the work stops and waits for a person. Some men once asked Moses a question the law had not answered yet. He stopped and waited: [[Numbers 9:8]]

The OpenAI Agents SDK lets the agent choose. It can finish a job itself, or pass it to another agent. Israel's judges had that rule. Keep the cases you can handle. Pass up the hard ones: [[Deuteronomy 1:17]]

Google's Agent Development Kit mixes both ideas. The person who builds it sets the plan. Then a main agent splits the work among helper agents. That is Numbers 2. Yahweh made the plan, and a captain led each camp: [[Numbers 2:3]]

The Claude Agent SDK has no separate boss layer at all. The agent itself gets what it needs, uses tools, and checks the result. It keeps looping until there is nothing left to do. The same newsletter showed that loop step by step. A rules check comes before every action. [[Proverbs 16:9]] We make the plan. The step gets directed from above.

THE CONDUCTOR IS NOT THE HEAD. People sometimes talk about the orchestrator like it is the brain. It is not. It is more like the priest with the trumpet. He gave the signal. He did not move the cloud. The Head is Christ: [[Colossians 1:18]] And Jesus Himself, the Son, said He did nothing on His own: [[John 5:30]] The Son lived under His Father's will. So a team of programs with nobody over it is missing the most important piece.

OUR OWN TEAM. Here is the honest part. Our app gets built this exact way. On the day this lesson was written, one main session handed out lessons to several builder sessions at the same time. Each builder worked in its own copy of the code. Each got the same written rules first. Above the main session is Darrell. He can stop any piece of work by putting a hold label on it. And above Darrell is the Lord of the house.

Builders claim a lesson number before they start. They do it on the shared server. The first claim wins. A second claim for the exact same name gets turned down. This one claimed eighty-eight. But the claim tool only knows how to spell numbers for two kinds of records. So this course needs every builder to type the name exactly right. That rule is kept by care, not by the computer.

Before more builders go out, a small program checks if there is room. It ran while this lesson was being written. It said there was room for three more builders. Four were asked for. That is one too many. Jesus told about a king who sits down first to count his soldiers: [[Luke 14:31]] Count first. Then send.

The weeks of this course also have to arrive in order. Weeks eighty-four to eighty-seven were being written by other builders that same day. So week eighty-eight waits its turn, the way Reuben waited behind Judah.

There is even a screen in the app that shows all this live. It is called the Ops board. It sorts each piece of work into safe to land side by side, or must land alone. But its rule only watches two kinds of files. The shared lists below are not one of them. So a lesson stuck on those lists still shows up there as safe.

THE SHARED NOTEBOOK PROBLEM. Every finished piece of work has to add a line to a couple of shared lists. One is the list of decisions. One is a log of how many hours the A.I. work took. Everybody adds at the bottom. When one piece lands, the bottom moves. Now everyone else's line does not fit. The system calls that a conflict and stops. You fix it and run every check again. By then another piece has landed. Builders call it a landing train.

It was counted that afternoon. Fourteen pieces of work from that day were waiting. Seven were stuck in conflict. The hours log was part of the conflict in six of the seven. The decision list was in three. One lesson in this course was stuck on five shared files at once.

Israel's camp had a fix for its shared center. The Levites camped right around the holy tent and guarded it: [[Numbers 1:53]] Each tribe had its own ground. The one shared place had keepers. Our app does something like that. Each lesson has its own file. The shared lists only get added to. A small keeper program sorts the lines by name. But that does not make the problem go away. Lines added at the same spot still clash. Every check still has to run again. That is the truth today.

A STORY FROM A YOUTH GROUP. This one is made up, to help you think. It did not really happen. A youth group held a car wash to raise money for a trip. Twelve kids showed up, and all twelve grabbed a sponge. Nobody held the sign by the road. Nobody took the money. Three kids washed the same car while two cars drove off. The next Saturday the leader handed out cards before anyone touched a sponge. Four kids got sponges. Two got hoses. Two got towels. One got the sign, one got the cash box, and two ran errands. One notebook sat by the cash box, and each car got its own new line. They washed fewer cars at the same time, and they finished more.

JESUS LOSES NOTHING. When Jesus fed the five thousand, He had them sit in groups of hundreds and fifties: [[Mark 6:40]] Then afterward: [[John 6:12]] He loses nothing and no one. [[John 6:39]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne lasts forever, [[Hebrews 1:8]] and everything holds together in Him: [[Colossians 1:17]]

${FACTS.youth}

FOUR THINGS THIS WEEK. One, find out who decides when your family moves, and honor it. Two, take one shared chore and give each person a clear part. Three, keep one family list where nobody erases. A change is a new line. Four, before you say yes to another thing, count your time the way the king counted his army.

${TALK.youth}`;

const TEEN = `${TITLE}.

START HERE. Think of a group project where nobody was in charge. Two people made the same slide. One part never got done. Somebody waited all week for a file. Now picture that with computer programs instead of classmates. That is today's topic. But the Word comes first.

THE SOURCE. On November 9, Darrell forwarded a newsletter about computer systems. He typed one word over it: Lesson. That one word is the request. The newsletter only gave the occasion. It waited in a backlog and was built on November 13.

THE FRAME. Paul tells believers to keep hold of Christ, the Head: [[Colossians 2:19]] Growth comes through the Head - every joint, every band, every part. Cut off from Him, a body can still look busy. It just will not grow right.

Then Numbers 2. Israel had over six hundred thousand fighting men in the desert, plus families. Yahweh's first order for them: [[Numbers 2:2]] Each family got its own flag and its own ground, and the whole camp faced one center. That is the frame for everything that follows in this hour.

THE NEWSLETTER. ByteByteGo's first item listed six orchestration frameworks used in A.I. systems. Their definition: orchestration manages tasks across agents, handles failures, and keeps shared memory and context. An agent is a program that uses a language model to pick its next move and then make it. One agent is a worker. Ten agents on one job need a system over them. Who does what? In what order? Who knows what? What happens when one crashes? The thing that answers those is the orchestrator.

THE OLDEST ORCHESTRA. Israel moved on a signal from above. [[Numbers 9:18]] The cloud lifted, they marched. The cloud stayed, they stayed. [[Numbers 9:23]] Every tent had the same orders, carried by one man. That covers three of the newsletter's jobs. One signal starts the work. The order is set ahead of time. And everyone works from the same shared information.

The marching order was fixed in advance too. Judah's camp first: [[Numbers 2:9]] The tabernacle in the middle, and everyone in his place: [[Numbers 2:17]] No arguing about the lineup at the gate.

SIX SHAPES. The newsletter gave one sentence per tool. Here they are, as reported, each with a Word picture. No ranking. Each one fits a different kind of job.

First, LangGraph. A graph: steps are nodes, edges are the allowed moves between them, and the state of the work travels along the edges. Numbers 33 is that graph for the whole Exodus, station after station, written down: [[Numbers 33:1]]

Second, CrewAI. Roles. Each agent gets a role and a goal and works in sequence, or a manager agent assigns the work. Like the Levite clans, each with its own load: [[Numbers 4:49]]

Third, Microsoft Agent Framework. A graph built for company workflows, with branches, checkpoints and pauses for a human to decide. Like Moses facing a case nobody had ruled on: [[Numbers 9:8]] Stop. Ask. Then go.

Fourth, the OpenAI Agents SDK. Handoffs. The agent decides at run time whether to keep the task or pass it on. Israel's judges ran on that rule: [[Deuteronomy 1:17]] The risk is clear. The worker is judging its own limits. So the rule for passing a task up must be set before the job starts.

Fifth, Google's Agent Development Kit, or ADK. Hybrid. The developer sets the strategy, and a root agent splits the job across sub-agents. That is the camp of Judah, with its own captain under the plan Yahweh gave: [[Numbers 2:3]]

Sixth, the Claude Agent SDK. No separate layer. The orchestration lives inside one agent. It gathers context, uses tools, checks itself, and keeps going until it has no calls left. The newsletter traced that loop: plan, a permission check against the rules, run the tool, read the result, repeat. [[Proverbs 16:9]] The plan is ours. The step is directed.

WHO IS ACTUALLY IN CHARGE. Tech talk treats the orchestrator like the brain. Wrong. It is closer to the priest with the trumpet. He signaled the march. He did not move the cloud. The Head is Christ: [[Ephesians 4:15]] And the Son showed what working under a Head looks like: [[John 5:19]] He is not a tool. He is the Eternal Son, and He chose to do nothing on His own. A crew of programs with nobody above it has lost what makes work right.

OUR BUILD, MEASURED. This app is built by parallel builders under one orchestrating session. Here is how that runs.

Lanes. Each builder works in its own copy of the code, so no two of them are typing into the same file at the same moment.

Shared context. Every builder gets the same written brief before starting, which covers the house rules, the checks it has to pass, and how to hand its work back.

Locks. A builder claims its number by pushing a marker to the server. The server takes the first claim and refuses a second claim for the same exact name. This build claimed eighty-eight. The gap: the claim tool only knows the spelling for two kinds of numbers. This course depends on everyone spelling its weeks one exact way. Kept by habit, not by code.

Budget. A script measures free memory and disk before more builders go out. Run during this build, it said: room for three, four wanted, over by one. [[Luke 14:31]] The king counts first.

Landing order. Course weeks must land in sequence, and the course test holds a later week until the earlier ones arrive. Eighty-four through eighty-seven were still in progress, so eighty-eight waits in the second rank, the way Reuben waited behind Judah.

The board. The app's Ops board shows every piece of work in flight and tags it parallel-safe or must-serialize. Its rule only flags two kinds of files. The shared ledgers are not on its list. So a lesson stuck on a ledger still shows as parallel-safe there.

THE LANDING TRAIN. Now the real problem. Every finished task adds a row to a few shared files. One is the list of decisions. One is a log of A.I. work hours. Everyone appends at the end. One merge moves the end, and every other open branch now conflicts. Fix it, rerun the checks, and meanwhile another one lands. That is the landing train.

The numbers, read that afternoon: fourteen pull requests opened that day. Seven blocked by conflicts. The hours log was in six of them. The decision list was in three. One lesson in this course conflicted on five shared files.

Israel's camp had keepers for its shared center: [[Numbers 1:53]] Our fix follows the same idea. Every lesson gets its own file. The shared files only grow. A keeper script merges rows by id instead of by text. It helps a lot. It does not solve everything. Rows added at the same spot still clash, and the checks still rerun. That is where it stands.

A MADE-UP CASE. This is an illustration, not a real event. A school robotics team had six weeks to build. Everyone kept one shared parts sheet. Two students each logged the last motor on the same line at the same time, and both thought it was theirs. The build stalled for two days. The fix was not a smarter sheet. The captain gave each sub-team its own tab, made the shared sheet add-only, and set one rule for who claims the last of anything. They were slower for a day. Then they were faster for five weeks.

WHY THIS IS ABOUT YOU. You will spend your life on teams - in class, on a job, in a church, someday in a family of your own. Every one of them will face the same questions the newsletter asked. Who decides when we move? Who does which part? Where do we write things down so nothing gets lost or written over? What do we do when somebody drops the ball? You can wait for those questions to blow up in the middle of the work, or you can settle them at the start, while everyone is calm. Israel settled them at rest. The best teams you will ever join will do the same, and the best ones will also know that the plan is not the Head.

THE HEAD WHO LOSES NOTHING. Jesus fed five thousand men. First He sorted the crowd: [[Mark 6:39]] After, He had the leftovers gathered: [[John 6:12]] And He keeps every person the Father gives Him: [[John 6:39]] He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is forever, [[Hebrews 1:8]] who holds all things together: [[Colossians 1:17]] Paul's rule for the church fits every team: [[1 Corinthians 14:40]]

${FACTS.teen}

FOUR THINGS THIS WEEK. One, figure out who actually decides when your family moves. Two, split one shared chore so each person owns a piece. Three, start one list nobody erases from. Four, count your week before you add to it.

${TALK.teen}`;

const SENIOR = `${TITLE}.

AN HOUR ON ORDER. Every generation that has run a farm, a shop, a congregation or a household has learned the same thing the hard way: many willing hands do not produce a good result unless something keeps them in order. This hour carries that old lesson through a new door. The Word is laid down first; a short engineering newsletter follows; and then we look honestly at how this very application is built.

HOW IT REACHED US. On Saturday the seventh of November 2026 an engineering newsletter arrived in Darrell's university mailbox. On Monday morning at 7:29 Central time he forwarded it into this lesson lane, with a single word typed above the forwarded header: Lesson. That word is the request, and it is honored here. The newsletter supplies only the occasion. The intake that should have caught it fell behind, and it was built on the thirteenth of November.

THE FOUNDATION. Two passages carry the hour. The first is Paul's warning to the church at Colossae, which was being drawn toward man-made rules and visions: [[Colossians 2:19]] Notice what is said of the body. It is joined and knit together, nourished through every joint and band, and it grows - yet all of that is described as flowing from the Head. A member that lets go of the Head may stay busy, but it is no longer growing with the body.

The second passage comes from the wilderness. Yahweh numbered Israel - six hundred and three thousand, five hundred and fifty men of fighting age - and then arranged them around the tabernacle with this charge: [[Numbers 2:2]] Each man by his own standard; each family on its own ground; and the whole camp turned toward the dwelling of Yahweh at the center. When the arrangement was complete, the chapter records the outcome in one sentence: [[Numbers 2:34]]

THE NEWSLETTER'S SUBJECT. The newsletter, ByteByteGo, led its issue with six frequently used orchestration frameworks for A.I. systems. It defined orchestration simply: it manages tasks across agents, handles failures, and maintains shared memory and context. An agent, in this setting, is a program that consults a language model to choose its next action and then carries it out. When several agents share one assignment, someone or something must distribute the tasks, fix the sequence, keep every agent working from the same information, and recover when one of them fails. That coordinating layer is called the orchestrator, after the conductor who keeps an orchestra together.

THE CAMP AS A MODEL. Israel's wilderness camp shows each of those duties. The signal to move came from above and was the same for everyone: [[Numbers 9:17]] No tribe left early out of restlessness or lingered out of comfort, however long the cloud remained. The sequence of the march was fixed while the camp was still at rest; Judah set out first, Reuben in the second rank, and the tabernacle was carried in the midst: [[Numbers 2:17]] And every tent operated from one shared charge, delivered through one servant: [[Numbers 9:23]]

This course has walked near this ground before. Week seventy studied Nehemiah's builders, each repairing the wall opposite his own house, together with Jethro's counsel to appoint rulers over thousands and hundreds, and a Living Lesson returned to Jethro more recently. Those passages concern how work is divided. Today's question sits one step above: once the work is divided, what holds it in one order under one Head?

THE SIX FRAMEWORKS, AS REPORTED. The newsletter devotes one sentence to each tool. They are presented here in its terms, each beside a scriptural pattern of the same shape. The newsletter does not rank them, and this lesson will not; they suit different kinds of work.

The first, LangGraph, represents a workflow as a graph: the steps are nodes, and the connecting edges govern how the state of the work passes from one step to the next. Scripture preserves such a record of Israel's journey, every departure and every encampment in its sequence: [[Numbers 33:1]]

The second, CrewAI, assigns each agent a defined role and goal; the agents work either in sequence or under a manager agent who distributes the tasks. The Levitical clans were organized this way, each appointed to a particular service and a particular burden: [[Numbers 4:49]]

The third, Microsoft Agent Framework, is described as designed for organizational workflows. It too uses a graph, with built-in branching, saved checkpoints and pauses for human intervention. Moses observed exactly such a pause when a case arose that the law had not yet settled: [[Numbers 9:8]]

The fourth, the OpenAI Agents SDK, lets the agent decide while it is running whether to complete a task itself or to hand control to another agent. Israel's judges received that rule at the outset: [[Deuteronomy 1:17]] The safeguard in such an arrangement lies in stating, before the work begins, which matters must be handed up.

The fifth, Google's Agent Development Kit, takes a hybrid approach: the developer establishes the strategy, and a root agent divides the tasks among sub-agents. That is the very structure of Numbers 2, where Yahweh set the plan and a prince was named over each camp to carry it to his tribes: [[Numbers 2:3]]

The sixth, the Claude Agent SDK, has no separate orchestration layer. The orchestration lives within a single agent that gathers context, uses its tools, evaluates the outcome and continues until no further calls remain. The same issue traced that loop step by step, placing a permission check against the rules between each proposed action and its execution. Solomon described the right relation between planning and direction long ago: [[Proverbs 16:9]]

THE ORCHESTRATOR IS NOT THE HEAD. It is common to speak of an orchestrator as the brain of such a system. Scripture would correct that. An orchestrator resembles the priest who sounded the silver trumpets: he gave the signal, but he did not lift the cloud. The Head is named without ambiguity: [[Colossians 1:18]] And the Son, though co-eternal with the Father, described His own works this way: [[John 5:30]] He is not an instrument, and nothing here suggests that He is. The point is the reverse: if the Eternal Son chose to act only in the Father's will, then any arrangement of workers, mechanical or human, that answers to no one above it has abandoned the principle that makes work sound.

OUR OWN HOUSE, MEASURED. This application is built by several builder sessions working in parallel under one orchestrating session. Every statement below is traced to the code or the record that makes it so.

Each builder works in a separate copy of the code, so that no two builders edit the same file at the same moment. Each receives the same written brief before beginning - the house rules, the checks it must pass, how to number its work and how to return it. That brief is the shared charge.

Numbers are claimed through a reservation on the shared server, which acts as referee: the first claim on a given name succeeds, and any later claim on that identical name is refused. This lesson's builder claimed week eighty-eight in that way before writing. One limitation should be stated plainly. The reservation tool recognizes the spelling only for decision records and Living Lessons, so this course relies on every builder spelling its weeks identically. That is a safeguard maintained by diligence rather than by the machine.

Before more builders are dispatched, a short program measures available memory and disk against the measured cost of one builder. It was run during the writing of this lesson and reported room for three additional builders against a request for four: over budget by one. Our Lord described the king who sits down first to take that very measure: [[Luke 14:31]]

Weeks in this course must also arrive in numerical order. Weeks eighty-four through eighty-seven were still being written by other builders on the same day, so this week waits behind them, as Reuben's camp waited behind Judah's.

The application has a screen that displays this work as it happens: the Ops board, in the See tab of the Command and Serve Center. It assigns each piece of work in flight to one of two lanes, safe to land in parallel or required to land alone. Its rule, however, considers only the large shared screen file and changes to the database. The shared ledgers described below are not among its concerns, and so a lesson that is blocked on them is still presented there as safe to land in parallel.

THE LANDING TRAIN. Here is the difficulty that was measured on the day this was written. Every completed piece of work must append an entry to a few shared files: the register of decisions, and a ledger of the hours that A.I.-assisted work required. Every builder appends at the same place, the end. When one piece of work is merged, the end moves, and each of the others now conflicts with the main code. The conflict must be resolved, every check must run again, and during that time another piece is merged and the cycle repeats. Builders call it a landing train.

The house first measured this in September, when at least four completed and passing pieces of work could not be merged because of conflicts confined to the shared files, and it wrote a program to resolve those files by rule. In early November the cost ledger joined them, and in one afternoon the same conflict was resolved by hand five times across nine branches. On the afternoon of the thirteenth it was counted again: of fourteen pieces of work opened that day, seven were blocked by conflicts; the hours ledger figured in six of the seven and the register of decisions in three, and one lesson in this course conflicted on five shared files at once.

Israel's camp provided for its shared center: [[Numbers 1:53]] The tribes kept their distance on their own ground, and the one place everyone had to approach had appointed keepers, so that there would be no wrath upon the congregation. The application follows the same principle in its own measure: each lesson in its own file, the shared files only ever added to, and a keeper program that merges entries by their identifier rather than by their text. It helps a great deal, but it is not a complete cure. Entries appended at the same point still collide, and the checks must still run again. That is the honest state of things.

AN ILLUSTRATION, NOT A REPORTED EVENT. Picture a congregation preparing a funeral dinner on short notice. Thirty members volunteer within the hour, and each telephones the church kitchen to say what he or she will bring. By evening there are eleven casseroles, no bread and no one assigned to set the tables. The next time, one deaconess keeps a single sign-up sheet by the kitchen telephone, divided into columns before the first call comes in - main dishes, sides, bread, desserts, setting up and cleaning - and every volunteer is written into a column and never written over. Fewer telephone calls are needed, and the family is served.

THE HEAD WHO LOSES NONE. When Jesus fed the five thousand, He set the multitude in order before the bread was distributed: [[Mark 6:40]] When all had eaten, He gave a further instruction: [[John 6:12]] And He declared the Father's purpose for every person entrusted to Him: [[John 6:39]] Any orchestrator may drop a task or lose a worker. He loses none. He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne endures for ever, [[Hebrews 1:8]] in whom all things consist: [[Colossians 1:17]] Paul's standard for a disordered congregation stands over every team we build: [[1 Corinthians 14:40]]

${FACTS.senior}

FOUR THINGS THIS WEEK. One, settle plainly who decides when your household moves, and place that decision under the Lord. Two, divide one shared responsibility so that each person owns a clear portion. Three, keep one family record in which nothing is erased and every correction is a new line. Four, count your week before adding to it, as the king counted before he marched.

${TALK.senior}`;

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.

WHO SENT THIS. On the ninth of November 2026 at 7:29 in the morning Central time, Darrell forwarded a ByteByteGo issue, 6 Frequently Used Orchestration Frameworks in an AI system, out of his university mailbox with ONE WORD typed above the forwarded header: Lesson. Gmail thread 1a1b6e6085128724. His word is the ask; the newsletter is the occasion. The scheduled intake fell behind and it was built by hand on the thirteenth of November.

THE WORD FIRST. Colossians 2:19 opens the hour - holding the Head, from which all the body increases - with Numbers 2:2 beside it: every man by his own standard, far off about the tabernacle. Then the camp under the cloud (Numbers 9:17-23; the order of the march, Numbers 2:9-17); six frameworks taught as reported, each beside a picture of the same shape (the journeys written down, Numbers 33; the Levites' burdens, Numbers 4:49; stand still, Numbers 9:8; the hard cause brought up, Deuteronomy 1:17; a captain over each camp, Numbers 2:3; the heart that devises and the step that is directed, Proverbs 16:9); the orchestrator as a servant and not the Head (Colossians 1:18; Ephesians 4:15; John 5:19 and 5:30); the keepers round the tabernacle (Numbers 1:53); and the Head who loses none (Mark 6:39-40; John 6:12; John 6:39).

OUR OWN HOUSE. Measured in the code, not painted: builders in their own lanes under one orchestrator that never edits by hand; numbers claimed on the server, where this course's weeks are kept by a spelling convention; a capacity count run live that said room for three, four wanted, over by one; weeks held in order, so this one waits for eighty-four to eighty-seven; an Ops board whose lane rule does not see the shared ledgers; and the landing train counted that afternoon - seven of fourteen pieces of work stuck, the cost ledger in six of the seven.

THE TIERS. ESTABLISHED and stated plainly: orchestration as ordinary engineering, and that the six frameworks are real, released tools. REPORTED by ByteByteGo: the one-line account of each, with no ranking. MEASURED: our own build, file by file, and two numbers read live. NOT MEASURED: the hours the conflicts have cost. The diagram came only as a picture and the newsletter's site refused our network, so nothing is taught from it. re-review: 2026-11-27.

LEFT OUT ON PURPOSE. The two sponsor blocks, an agent toolkit and a conference; the issue's other three items, on cost strategies, on how a database runs a query (week eighty-three's ground) and on the request path of a coding agent, which is kept only as the inside of the sixth framework; and the share and subscribe lines.

PLACEMENT. Sovereign A.I., week 88, because a household that runs its own machines and its own builders owes them an order under one Head, and owes itself an honest count of where that order breaks.`,
  inApp: `No new screens this week. One page in your Study, and four small acts of order in your house.

In the app: open Sovereign A.I. week 88 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each holds the whole teaching. Use Search it out on Numbers 2, Numbers 9 and Mark 6 so the camp, the cloud and the companies on the grass sit side by side; the links come from the lesson's own references.

Then, if you keep the house's builders, open the Ops board in the See tab of the Command and Serve Center. It shows every piece of work in flight, whether it is parked on hold, and the lane it is sorted into. Read it with this hour in mind: its lane rule does not yet see the shared ledgers, so a piece of work stuck there can still read as safe to land in parallel.

Away from the app, four exercises. Name who decides when the house moves. Give each person one plain part of a shared job. Keep one family record that only grows. And count your week before you add to it.`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Colossians 2:19]] [[Numbers 2:2]] [[Numbers 9:18]] [[Numbers 2:17]] [[Numbers 9:8]] [[Colossians 1:18]] [[John 5:19]] [[Luke 14:31]] [[Numbers 1:53]] [[Mark 6:40]] [[John 6:39]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them lands on your own house.

First, read Numbers 2 whole, then Numbers 9:15-23. Notice that the order of the march was settled while the camp was at rest, and that the signal to move was the same for every tribe. Write one sentence on what in your house moves on the loudest voice rather than on one agreed signal.

Second, read Numbers 4 and look for every family's service and burden. Ask: which shared job in my house belongs to everybody and therefore to nobody?

Third, read Mark 6:35-44 and John 6:12 and 6:39. Mark the order Jesus set before the bread was broken, and the instruction He gave after. Ask where your household loses things in the rush - a bill, a promise, a person.

And one verification reading, because this course works this way. Orchestration as engineering, and the existence of the six frameworks, are ESTABLISHED and stated without hedging. The one-line account of each framework is REPORTED by the newsletter and is not ranked. The house's own build was MEASURED, file by file, and the landing-train count was read live; the hours it has cost were NOT measured. Practice telling those apart.`,
    plan: `PLAN. Decide four measures before the week starts, and decide who hears them.

One: the Head. Name who decides when the house moves, and how a change of plan is announced.

Two: the standards. Name the shared job, and write each person's part beside his or her name.

Three: the book. Name the one record that will only grow, and where it will live.

Four: the count. Name the day you will sit down and count the week before you add anything to it.

Then name the person who will ask you about all four on the same day next week. A measure nobody asks about is a wish.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.

Say who decides, and keep to it. Hand out the parts of the shared job before the job starts, not during it. Write in the record and never rub a line out. Count the week on the day you named.

Teach the verse at a meal: every man by his own standard. Ask a child to say it back in their own words.

At the end of the week, answer three questions to the person who is asking. Where did two of us reach for the same thing at once? What got lost in the rush, and was it found? And whom were we holding to - the Head, or only the plan?

Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over an engineering newsletter, answered from the Word rather than from the article, and built when the intake that missed it was drained.`,
    `The hour opened by Colossians 2:19, so every talk of orchestration is heard under the deeper order: a body that grows only while it holds the Head.`,
    `Numbers 2:2 laid down first, so every worker is taught to keep its own standard and its own ground, turned toward one center.`,
    `The newsletter's three jobs of an orchestrator taught from the camp under the cloud: one signal, an order set at rest, one shared charge.`,
    `Week seventy's Nehemiah and Jethro, and week eighty-four's body of many members, linked by name rather than repeated.`,
    `Six frameworks taught as the newsletter reports them, without a ranking, each beside a scriptural pattern of the same shape.`,
    `LangGraph's graph read beside Numbers 33, where Moses wrote the journeys station by station.`,
    `CrewAI's roles read beside Numbers 4:49, every one according to his service and his burden.`,
    `The pause for a person read beside Moses' stand still in Numbers 9:8.`,
    `The handoff read beside Deuteronomy 1:17, with the rule for handing up set before the work begins.`,
    `The root agent and its sub-agents read beside Numbers 2:3, a captain over each camp under Yahweh's plan.`,
    `The agent's loop read beside Proverbs 16:9, with the newsletter's own permission check placed between the plan and the act.`,
    `The orchestrator put in its place as a servant: the Head is Christ (Colossians 1:18), and the Son Himself did nothing of Himself (John 5:19, 5:30).`,
    `The house's own build measured, not painted: lanes, a server-refereed claim, a spelling convention named as a gap, and a live capacity count over budget by one.`,
    `This week's own wait taught honestly: it lands only after weeks eighty-four to eighty-seven.`,
    `The Ops board's lane rule read and its blind spot named: the shared ledgers are not on its list.`,
    `The landing train counted live: seven of fourteen pieces of work stuck, the cost ledger in six of the seven.`,
    `Numbers 1:53 applied to it: give every worker its own ground and give the shared center a keeper.`,
    `Mark 6:39-40, John 6:12 and John 6:39 close the hour on the Head who loses none.`,
    `Jesus confessed as the Lamb of Yahweh and the Eternal Son, by whom all things consist.`,
    `The established, the reported, the measured and the unmeasured told apart in every reader place, with a dated re-review.`,
    `All four age bands carried from the first commit, each written for its own reader.`,
    `Four household actions that cost nothing: name the Head, give each a standard, keep a book that only grows, count before you send.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The kitchen with one sign-up sheet',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A small church learned on a Tuesday morning that one of its oldest members had died and that the family would come back from the cemetery on Thursday to a meal in the fellowship hall.

By Tuesday night thirty people had offered to help. Each had called someone different. On Thursday at noon the kitchen held eleven casseroles, four pans of the same cake, no bread, no ice and nobody who had been asked to set the tables. Three women were arranging chairs in three different ways at once.

The family was fed, and they were gracious. But afterward the pastor's wife sat down with the deaconess who had run the kitchen for twenty years. They did not blame anyone. They drew one sheet with columns on it - main dishes, sides, bread, drinks, desserts, setting up, cleaning up - and agreed that the next time, every call would come to one telephone, every name would be written into one column, and nobody would write over anyone else's line.

The next time, it took fewer calls. The tables were set before the cars arrived. Nothing was wasted, and nobody was left standing in the middle of the room waiting to be told what to do.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The two crews and the one driveway',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A family hired two crews for the same week: one to replace the roof and one to pour a new driveway. Each crew was good at its work. Each foreman had his own schedule. Neither had seen the other's.

On Wednesday morning the concrete truck arrived to pour the driveway at the same hour the roofing truck arrived to haul away the old shingles - and there was one way in. The concrete could not wait, and the roofers' dumpster could not be moved. Half a day and a load of concrete were lost while the two foremen argued in the yard.

The father did not choose a winner. He did what he should have done on Monday: he sat both foremen down at the kitchen table with one calendar, and before anyone lifted a tool he wrote down who would use the driveway on which days and in what order. He gave each crew its own hours and one shared rule - the driveway is reserved by writing on the calendar, in ink, not by arriving first.

The roof and the driveway were both finished by the next Tuesday. He kept the calendar on the refrigerator for the rest of the year.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'How does the newsletter define orchestration in an A.I. system?',
        options: [
          'A way to make one model larger',
          'Managing tasks across agents, handling failures, and keeping shared memory and context',
          'A method for writing music with a computer',
        ],
        answer: 1,
        explain:
          'Several agents on one job need something over them that says who does what, in what order, what they all know, and what happens when one fails.',
      },
      {
        q: 'What does Numbers 2:2 say about how Israel camped?',
        options: [
          'Everyone camped wherever there was room',
          'Every man pitched by his own standard, with the ensign of his father’s house, around the tabernacle',
          'The tribes moved their camps every morning by vote',
        ],
        answer: 1,
        explain: 'Each worker had its own place, and the whole camp faced one center. That is the frame for the whole hour.',
      },
      {
        q: 'In Numbers 9, what decided when the camp moved?',
        options: ['The strongest tribe', 'A vote each morning', 'The cloud, at the commandment of the LORD'],
        answer: 2,
        explain: 'One signal from above, the same for every tribe, and nobody went ahead on his own however long the cloud remained.',
      },
      {
        q: 'Which framework does the newsletter describe as a graph of nodes and edges, and which passage has the same shape?',
        options: ['LangGraph, and Numbers 33, where Moses wrote the journeys station by station', 'CrewAI, and Genesis 1', 'None of them uses a graph'],
        answer: 0,
        explain: 'Each station is a node and each departure an edge, and the record says where the camp has been and where it may go next.',
      },
      {
        q: 'What does Numbers 9:8 picture among the six frameworks?',
        options: [
          'An agent that never stops',
          'A pause at a checkpoint for the one in authority to decide, as in the framework built with human intervention pauses',
          'A handoff to a cheaper model',
        ],
        answer: 1,
        explain: 'Moses told the men to stand still while he heard what the LORD would command. Some steps should wait for the one in charge.',
      },
      {
        q: 'Why does this lesson say the orchestrator is not the Head?',
        options: [
          'Because orchestrators are always wrong',
          'Because it is a servant that gives the signal, like the priest with the trumpet; the Head is Christ (Colossians 1:18)',
          'Because the Head is the fastest agent',
        ],
        answer: 1,
        explain:
          'Even the Eternal Son said He did nothing of Himself but what He saw the Father do (John 5:19). A crew with nobody above it has lost what makes work good.',
      },
      {
        q: 'How does this project keep two builders from taking the same lesson number?',
        options: [
          'Each builder guesses a number and hopes',
          'A builder writes a claim on the shared server, which accepts the first claim for a name and refuses any second claim for that exact name',
          'Numbers are never used',
        ],
        answer: 1,
        explain: 'The server is the referee. The honest gap: for this course the claim depends on every builder spelling the week the same way.',
      },
      {
        q: 'What did the capacity count say while this lesson was being written?',
        options: ['Unlimited room', 'Room for three more builders, four were asked for, over budget by one', 'No room at all'],
        answer: 1,
        explain: 'Luke 14:31: the king sits down first and counts. Launch what fits and queue the rest.',
      },
      {
        q: 'What is the landing train?',
        options: [
          'A train schedule',
          'When every piece of finished work appends to the same shared files, so each merge knocks the others into conflict and every check must run again',
          'A kind of model',
        ],
        answer: 1,
        explain:
          'On the afternoon it was counted, seven of fourteen pieces of work opened that day were stuck in conflict, and the cost ledger was in six of the seven.',
      },
      {
        q: 'What gap did reading the Ops board’s lane rule reveal?',
        options: [
          'The board shows nothing at all',
          'It marks work must-serialize only for the large shared screen file or a database change, so work stuck on the shared ledgers still reads as safe to land in parallel',
          'The board lands every piece of work by itself',
        ],
        answer: 1,
        explain: 'The board is true about what it measures. It does not yet measure the place where the collisions happened.',
      },
      {
        q: 'How does Numbers 1:53 apply to the shared ledgers?',
        options: [
          'Let everyone crowd the center',
          'Give each worker its own ground, and give the one shared place keepers, so there is no collision at the center',
          'Remove the center entirely',
        ],
        answer: 1,
        explain:
          'The Levites pitched round about the tabernacle that there be no wrath. The house keeps the shared books add-only and merges them by a fixed rule, and says plainly that the collisions are fewer, not gone.',
      },
      {
        q: 'Which of these does this lesson state as REPORTED rather than measured?',
        options: [
          'That seven of fourteen pieces of work were stuck in conflict',
          'The one-line account of how each of the six frameworks keeps order',
          'That the capacity count was over budget by one',
        ],
        answer: 1,
        explain:
          'The frameworks are real; how each keeps order is the newsletter’s sentence, taught as given and not ranked. The house numbers were measured live. The hours the conflicts cost were not measured. re-review: 2026-11-27.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Colossians 2:19 aloud before you say one word about any computer. Then read Numbers 2:2 aloud. Then ask the room one question and wait: when was the last time a group you belonged to moved together well, and who kept it that way?

MINUTES 0 TO 10 - THE NEWSLETTER IN ONE PICTURE. Define an agent and an orchestrator in plain words. Write the four jobs on the board: start, order, share, recover.

MINUTES 10 TO 20 - THE CAMP UNDER THE CLOUD. Numbers 9:17, 18, 22 and 23; Numbers 2:9, 16 and 17. Make the point that the order was set at rest, not at the gate. Name week seventy's Nehemiah and Jethro without re-teaching them.

MINUTES 20 TO 35 - SIX SHAPES, AS REPORTED. Numbers 33:1-2, Numbers 4:49, Numbers 9:8, Deuteronomy 1:17, Numbers 2:3, Proverbs 16:9. Say plainly that the six descriptions are the newsletter's and that no ranking is made.

MINUTES 35 TO 42 - THE SERVANT, NOT THE HEAD. Colossians 1:18, Ephesians 4:15, John 5:19 and 5:30. Keep the order: the Head, the Governor, the orchestrator, the builders.

MINUTES 42 TO 52 - OUR OWN CAMP. Lanes, the claim on the server and its spelling gap, the capacity count (three, four, over by one; Luke 14:31), the held weeks, the Ops board's blind spot, and the landing train: seven of fourteen, the cost ledger in six. Numbers 1:53. Say plainly that the hours lost were not measured.

MINUTES 52 TO 60 - THE HEAD WHO LOSES NONE. Mark 6:39-40, John 6:12, John 6:39, then John 1:29, John 3:16, Hebrews 1:8, Colossians 1:17 and 1 Corinthians 14:40. Give the four household actions and close with the talk-together directions.

WHAT NOT TO DO. Do not turn this into a contest between frameworks; the room needs the Word and an orderly habit, and the newsletter itself ranks none of them. Do not stage the six as camps for the room to pick between; teach Numbers 2 and work it (DR-0098). Do not hedge the established engineering into nobody-knows (DR-0100). And do not put a number on the hours the conflicts cost; that was not measured.`,
    talkingPoints: [
      `The body grows only while it holds the Head (Colossians 2:19).`,
      `Every man by his own standard, and the whole camp toward one center (Numbers 2:2).`,
      `So they pitched, and so they set forward (Numbers 2:34).`,
      `An orchestrator's jobs: start the work, set the order, share the context, recover from failure.`,
      `One signal for every tribe, and no one went ahead (Numbers 9:17-23).`,
      `The order of the march was settled at rest (Numbers 2:9, 16, 17).`,
      `A graph is a journey written station by station (Numbers 33:1-2).`,
      `Roles: every one to his service and his burden (Numbers 4:49).`,
      `A pause for the one in authority: stand still (Numbers 9:8).`,
      `A handoff: the cause too hard for you, bring it up (Deuteronomy 1:17).`,
      `A plan from above and a captain over each camp (Numbers 2:3).`,
      `A loop with a rule-check: the heart devises, the LORD directs the step (Proverbs 16:9).`,
      `The six are reported as the newsletter gives them, and none is ranked.`,
      `The orchestrator is the trumpeter, not the cloud; the Head is Christ (Colossians 1:18).`,
      `The Son did nothing of Himself (John 5:19, 5:30).`,
      `Our builders work in their own lanes under one orchestrator that never edits by hand.`,
      `A claim on the server is refereed; this course's spelling is kept by care, not by code.`,
      `Count before you send: room for three, four asked, over by one (Luke 14:31).`,
      `This week waits behind weeks eighty-four to eighty-seven: the second rank.`,
      `The Ops board's lane rule does not see the shared ledgers.`,
      `The landing train: seven of fourteen stuck, the cost ledger in six (Numbers 1:53).`,
      `Jesus set the five thousand in ranks and lost nothing (Mark 6:39-40; John 6:12; John 6:39).`,
      `Jesus is the Lamb of Yahweh and the Eternal Son, by whom all things consist (John 1:29; Colossians 1:17).`,
    ],
    discussionPrompts: [
      `Who decides when your household moves, and how does everyone find out?`,
      `Which shared job in your house belongs to everybody and therefore to nobody?`,
      `When have two people in your family reached for the same thing at once? How was it settled?`,
      `What record in your house gets written over or lost in the rush?`,
      `When did you say yes to more than you had room for? What would counting first have changed?`,
      `In the work you do with others, are you holding the Head, or only holding the plan?`,
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
console.log(`sov88: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov88: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov88: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
// --dry measures and reports, and writes nothing.
if (process.argv.includes('--dry')) {
  console.log(faults.length ? faults.join('\n') : 'sov88: no four-band faults');
  process.exit(0);
}
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov88: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov88: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov88: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov88: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov88: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov88: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov88: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov88: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov88: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov88: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov88: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov88: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov88: spliced ${ID}`);
console.log(`sov88: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov88: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
