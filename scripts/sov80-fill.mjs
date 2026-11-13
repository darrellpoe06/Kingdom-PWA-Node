// =============================================================================
// sov80-fill - build Sovereign A.I. week 80 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[Isaiah 22:22]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory, so a quotation cannot drift from the
// text and cannot be approximate. The reference list on the module's anchor is
// DERIVED from the placeholders that actually occur in the reader places, so
// anchor.ref names every verse the lesson stands on and nothing it does not
// (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-10-28 at 15:49 UTC Darrell forwarded a
// ByteByteGo issue, subject line "Fw: How Uber Built A Gateway For AI Agents To
// Access Tools", out of his university mailbox into the lesson lane, with ONE
// WORD typed above the forwarded header: Lesson. That word is the ask; the
// newsletter is the occasion only. Gmail thread `1a18330341dec7b0`. SIXTEEN
// DAYS stood between his word and this build, and the record keeps that rather
// than smoothing it. Both DR-1414 witnesses agreed the thread was unbuilt: no
// Lesson-Captured in the thread's own labelIds, and scripts/lesson-already-built.mjs
// returned NOTHING FOUND.
//
// WORD FIRST (DR-0127 / DR-0282 / DR-1326). The hour opens on Isaiah 22:22 -
// the key of the house of David LAID UPON A SHOULDER, so that the one who holds
// it opens and none shuts - and on Genesis 3:6, where the woman SAW that the
// tree was good, and seeing was never the same thing as being given. Discovery
// is not permission. That frame is fixed before one detail of any company's
// architecture is spoken, and no figure from the newsletter stands above it.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100). A newsletter is a LEAD, never the
// citation. THE PRIMARY WAS READ FOR THE PROTOCOL AND REFUSED FOR THE COMPANY.
// The Model Context Protocol's own specification was read at its source - the
// specification repository, cloned at commit 06e9234 of 2026-11-12 - and
// www.uber.com and modelcontextprotocol.io both failed to resolve from this
// session's egress (getaddrinfo ENOTFOUND), so every Uber-specific claim is
// ATTRIBUTED to the newsletter's account and was not read at Uber's own post.
// That is said in EVERY reader place with a dated re-review (DR-0076 section 8).
// The checking CHANGED four things, each gated in
// app/src/__tests__/sovereign-ai-sov80-verses.test.js:
//   1. STRONGER, AND SAID PLAINLY (DR-0100 section 5). The newsletter writes
//      that the message format "is usually JSON-RPC 2.0". The specification does
//      not hedge: "All messages between MCP clients and servers MUST follow the
//      JSON-RPC 2.0 specification." Read at the primary. Usually became MUST.
//   2. BIGGER THAN THE ARTICLE CLAIMED, AND THIS IS THE WHOLE TEACHING. The
//      newsletter presents disabled-on-discovery as Uber's own design choice.
//      The protocol's own specification carries consent as one of four Key
//      Principles in all three current revisions - "Users must explicitly
//      consent to and understand all data access and operations" and "Hosts
//      must obtain explicit user consent before invoking any tool" - AND says
//      in the same breath that it cannot make them stick: "While MCP itself
//      cannot enforce these security principles at the protocol level,
//      implementors SHOULD". So a house that starts every discovered tool
//      disabled is not being tidy. It is doing the thing the protocol says it
//      cannot do for itself. That is a steward's gate, and it is the hour.
//   3. CORRECTED. The newsletter names three terms, client, server and tool,
//      and says the client "sits inside an AI application". The specification
//      names the container separately: Hosts are "LLM applications that
//      initiate connections" and Clients are "Connectors within the host
//      application". Four roles, not three - and it matters, because the
//      specification puts consent on the HOST, not on the client.
//   4. CORRECTED, SMALLER. The newsletter calls AutoCrawler "powered by
//      Cadence" as though Cadence were internal plumbing. Cadence is open
//      source and its canonical repository is cadence-workflow/cadence; its
//      own README still publishes the `ubercadence/cli` image and charts
//      `uber/cadence`, which is the trace of where it was born.
//   NOT CHECKED AT ALL, so silence is never mistaken for a check: the Registry
//   and Proxy Gateway split, AutoCrawler itself, the heartbeat metric, the
//   listTools call, the in-memory periodic refresh, the HTTP / gRPC / TChannel
//   transport mix, the PII redaction, the third-party token exchange for Jira
//   and Google, Omni MCP, Response Projection, Code Mode, the "1000s of tools"
//   figure and the "within minutes" onboarding claim. Every one is the
//   newsletter's account of a post this session could not open.
//
// THE BANDS WERE MOVED BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306). The
// measurements this build landed on are recorded in the decision record and in
// the session note, including what the first draft failed.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 80;
const ID = 'sov80-discovery-is-not-permission';
const TITLE =
  'Discovery is not permission - the key laid on a shoulder, the tree that was seen before it was taken, and the porter who opens to the shepherd';

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
  if (!m) throw new Error(`sov80: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov80: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov80: reference does not resolve in the corpus -> "${ref}"`);
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
// still gets the blocked road, the date, the gap and his word (DR-0795).
// -----------------------------------------------------------------------------
const BLOCKED =
  'WHAT WE COULD NOT CHECK AT THE SOURCE. The protocol was read at its own source and the company was not. We opened the Model Context Protocol specification in its own repository and quoted it from there. We could not open www.uber.com or modelcontextprotocol.io at all - both failed to resolve from our network - so every detail about that one company is told here as the newsletter told it, and is never stated on our own authority. A shut road must never read like a verified fact. re-review: 2026-11-27.';

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - what is something you can get to that nobody ever said you could have, and what have you done about it - and listen all the way to the end before you say a single corrective word; have them retell their own answer in their own words, then teach them one verse back, Genesis 3:6. Children, ask your mother, your father or a grandparent about a time they were handed real authority over something, who handed it to them, and what changed in them the day they received it; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: what is one door standing open to the two of us that we have no business walking through. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - what can you reach that no one has said yes to - and listen all the way to the end before you help; have them say it back to you in their own words, then teach them one verse, Genesis 3:6. Children, ask your mom or your dad or your grandma or your grandpa about a time they were put in charge of something. Who put them there? Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: what is one door we could open that is not ours. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - where do you already have the key, and who gave it to you - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, Isaiah 22:22. Children, ask your mom, your dad or a grandparent about something they were trusted with young, and what it cost them to keep that trust, and hear the whole of it before you answer; then retell their answer in your own words. Then ask a friend this: what is one thing we can both get into that neither of us was ever given. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what access do you have right now that nobody ever granted you, and what is your honest rule for using it - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, John 10:1. Children, ask your mom, your dad or a grandparent about a time somebody climbed into their business some other way than the door, what it did, and how it was answered, and hear all of it before you reply; then retell their answer in your own words. Then ask a friend this: name one account, one app or one room each of us can get into that we were never actually given. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what have you been given charge of, and who gave it, and who can take it back - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, Luke 12:42. Children, ask your parents or your grandparents about a key they once carried for somebody else's house, and what they learned about holding a thing that was not theirs, and hear the whole of it before you reply; then retell it back to them in your own words. Then ask a friend this: what in our two houses is standing wide open because nobody was ever put in charge of the gate. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson, in nine numbered movements. The Word opens every one, and
// no detail from the newsletter stands above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the twenty-eighth of October 2026, at 15:49 by universal time, Darrell forwarded an engineering newsletter out of his university mailbox into this lane. Above the forwarded header he typed ONE WORD: Lesson. That word is the ask. The newsletter is only the occasion, and no article is the foundation of an hour in this course. Sixteen days stood between his word and this build, and that gap stands on the record here rather than being smoothed away.

WHAT THE ISSUE HELD. One long piece about how a very large company built a shared front door for its artificial-intelligence agents. The piece calls that front door a gateway. Behind it sits a catalog of every tool an agent might call, a crawler that goes out and finds tools nobody registered by hand, and a set of rules about who may call what. Buried in the middle of it is one sentence that is worth more than the whole architecture, and the writer passes it in about forty words: newly discovered servers and tools start in a DISABLED state, and the team that owns the service has to review and enable them.

That is the hour. Not the gateway. The gate.`,

  `MOVEMENT ONE: THE KEY IS NOT FOUND. IT IS LAID ON A SHOULDER. Begin where the Word begins, because the Word is the foundation here and the authority.

In Isaiah there is a steward being removed and a steward being installed, and the installation is described in one of the most physical pictures in Scripture: [[Isaiah 22:22]] Laid UPON HIS SHOULDER. Not seized. Not discovered. Not inferred from the fact that he could reach the lock. Laid on him, by somebody with the right to lay it there, and the authority that comes with it is absolute in both directions - he opens and none shuts, he shuts and none opens.

Read the verses before it and you see the whole transaction. Shebna is turned out of his office: [[Isaiah 22:19]] And Eliakim is called and clothed and strengthened, and the government is committed into his hand: [[Isaiah 22:20]] [[Isaiah 22:21]] Called. Clothed. Strengthened. Committed. Four verbs, and the man receiving them does none of them to himself.

That same key appears once more, in the hand of the One it actually belongs to: [[Revelation 3:7]] And the reach of that hand is stated without decoration: [[Job 12:14]]

So before one word about any company's architecture: the right to open is a thing that is GIVEN, by an owner, to a servant, on purpose. Nobody acquires it by crawling the building and finding the door.`,

  `MOVEMENT TWO: SEEING IS NOT RECEIVING. The first garden had a grant in it, and the grant was explicit, generous and bounded. [[Genesis 2:16]] Freely eat - of every tree. Then one exclusion, named out loud, with its consequence attached: [[Genesis 2:17]]

Now notice what the serpent did NOT have to do. He did not have to reveal the tree. The tree was in the middle of the garden, in plain sight, from the first day. It was DISCOVERABLE the whole time. What he changed was not what she could see; it was what she believed she was permitted.

And the text records the fall in the language of inventory: [[Genesis 3:6]] She SAW. Good for food, pleasant to the eyes, to be desired. Every one of those is a property of the thing. Not one of them is a grant. The catalog was accurate and the permission was absent, and she treated the first as if it were the second.

Achan did it again with a tongue of gold and a Babylonish garment, and he narrates his own sequence with terrible clarity: [[Joshua 7:21]] Saw. Coveted. Took. Three steps, and the gap between step one and step three is the only place a man can be stopped.

A house that starts every discovered thing DISABLED has put a wall between seeing and taking. That is not a technical nicety. That is Genesis.`,

  `MOVEMENT THREE: THE OWNER ENABLES. THE CRAWLER ONLY FINDS. Scripture has a settled word for the man who holds what is not his, and it never once says he appointed himself.

[[Luke 12:42]] Whom his lord shall MAKE ruler. The making is the lord's act. And the requirement laid on the man afterward is one word: [[1 Corinthians 4:2]]

The talents are handed out the same way, and the handing is scoped: [[Matthew 25:15]] Five, two, one - to every man according to his several ability. The owner decides who gets what, and how much, and the scope is deliberate and unequal and right.

This is exactly the design decision buried in the newsletter, and the article tells it as housekeeping. Automatic discovery makes a capability VISIBLE. It does not make it available. The owning team reviews it and enables it, and the article says plainly that the choice to enable is an ownership decision. A machine found the door. A person with standing opened it.

Hold those two sentences side by side. The company arrived at it because a thousand teams made a mess. Scripture arrived at it in a garden. The second one is the reason the first one works.`,

  `MOVEMENT FOUR: THE PORTER OPENS TO THE SHEPHERD. There is a passage that is pure gateway, and it was written about sheep.

[[John 10:1]] He that climbeth up some other way. Not a man who cannot reach - a man who CAN reach, and reaches by a route that was not granted. The Word does not call that resourceful. It names him twice in one verse.

Then the contrast, and the office that makes it work: [[John 10:2]] [[John 10:3]] There is a PORTER. His whole station is the gate. He does not decide who the shepherd is; he opens to the one who is. And the sheep are not identified by a credential on a lanyard but by a voice they already know.

Then the Lord takes the role Himself, and the sentence is the most gateway-shaped sentence in Scripture: [[John 10:9]] By me. Through, not around. And the difference between the two kinds of traffic is given in one line: [[John 10:10]]

So a proxy that stands in front of every tool, identifies the caller, checks the policy and passes the request to the right place is not a new idea that engineering discovered in this decade. It is a porter. The newsletter calls its one the data plane. The Word had the office first, and gave it a moral content the newsletter cannot supply.`,

  `MOVEMENT FIVE: AUTHORITY WORKS BECAUSE IT IS UNDER AUTHORITY. A centurion once explained delegated permission to Jesus better than most of us could, and Jesus marveled at him for it.

[[Matthew 8:9]] Read the first clause again. I am a man UNDER authority. He does not begin with the soldiers he commands; he begins with the authority he is beneath. That is the whole reason his word works downward - because it is answerable upward.

And the general case is stated without exception: [[Romans 13:1]]

Here is why this matters at a console. The newsletter describes policies that can be set at the server level or at the individual tool level - an incident system where reading an incident and changing an incident's status can carry different permissions even though they live side by side. That is right, and the Word's reason for it is better than the engineering reason: authority is not a volume knob, it is a commission, and a commission is specific. The centurion could send a man and could not raise the dead. He knew the shape of his own grant, and that knowledge is what Jesus called great faith.

The practical form of this in your own house: before you use a thing you can reach, say out loud who gave it to you. If the answer is nobody, you have found the tree, not the grant.`,

  `MOVEMENT SIX: THE GATE GUARDS WHAT GOES OUT, NOT ONLY WHAT COMES IN. The newsletter mentions, almost in passing, that the gateway can strip personal information out of a tool's answer before it reaches the agent. Scripture is not in passing about this at all.

[[Proverbs 4:23]] Keep it - the word is a guard's word - because out of it are the ISSUES, the things that come OUT. The heart is a gate with traffic in both directions, and the verse puts the diligence on the outbound side.

David asks for a posted watchman on his own mouth: [[Psalm 141:3]] Keep the door of my lips. A door with a keeper on it. And Proverbs names the two kinds of men who stand at that door: [[Proverbs 11:13]] One reveals. One conceals. The second is called faithful, and faithfulness here is defined as the refusal to pass something along.

There is even a rule for the argument you are winning: [[Proverbs 25:9]] [[Proverbs 25:10]] Debate your cause - fine, argue it. And do not empty somebody else's pocket to do it.

So redaction - deciding what a request is entitled to receive BACK - is not privacy compliance. It is a man of faithful spirit standing at the door of the answer. If your house has an outbound gate, give it to somebody who conceals rather than somebody who reveals.`,

  `MOVEMENT SEVEN: THE ROOM IS FINITE, SO GUARD WHAT ENTERS IT. The last third of the newsletter is about a problem that sounds purely technical and is not. A model has a limited amount of room for what it is holding at one moment. Load a thousand tool descriptions into that room in advance and there is no space left for the actual work. So the gateway hands the agent a way to discover gradually - ask what servers exist, then what tools, then one tool's details - instead of pouring the whole catalog in at the start.

Now hear the same instruction given about a person: [[Mark 4:24]] Take heed WHAT ye hear. Luke gives the other half: [[Luke 8:18]] What, and how. Two commands about intake, and both of them assume the room is finite.

The psalmist sets the policy at the eye: [[Psalm 101:3]] And Paul gives the filter, with the list, and it is the most demanding admissions policy ever written: [[Philippians 4:8]]

A man who will load anything into his attention because it is available has the same defect as a client that loads every tool definition because the catalog offered them. Gradual discovery is a good engineering answer. Take heed what ye hear is the same answer, older, and addressed to the thing that actually matters.`,

  `MOVEMENT EIGHT: THE JOINTS ARE THE HARD PART, AND HE SAID SO FIRST. The newsletter ends on a sentence worth carrying out of this hour. Its author says the hardest part of building these systems is not the intelligence - it is the connective tissue. Discovery. Security. Reliability. The joints.

Yahweh said this about His own body before anybody built a gateway: [[Ephesians 4:16]] Fitly joined together. Compacted. By that which EVERY JOINT supplieth. The strength is not in any one member. It is in the supply that passes between them.

Colossians says the same thing from the Head down: [[Colossians 2:19]] Joints and bands. Nourishment ministered. Knit together. That is connective tissue, named as such, and it is where the growth comes from.

And then the part no engineering team can install: [[Colossians 3:14]] Above all these - above the gifts and the offices and the structure - the bond. The one that actually holds. Paul says the same thing about ability without it in a sentence that should hang over every clever architecture: [[1 Corinthians 13:2]]

A gateway of a thousand tools with no love in the house is a very efficient nothing.`,

  `MOVEMENT NINE: WHO HOLDS THE KEYS, AND WHAT YOUR HOUSE DOES MONDAY. Bring it home, and bring it to the One it belongs to.

[[Revelation 1:18]] He holds the keys of the last two doors anybody is actually afraid of. And to a small church with little strength He says the thing a gateway can only imitate: [[Revelation 3:8]] An open door that no man can shut. That is permission from the only source that cannot be revoked by a policy change.

The One who holds it is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] addressed by the Father as God with a throne for ever, [[Hebrews 1:8]] and the One by whom the whole thing holds together: [[Colossians 1:17]]

THE HOUSE-SIZED APPLICATION, and it needs no purchase. Three things this week.

One, the gate you already own. Walk your own house and find one thing that is enabled because nobody ever decided to disable it - an old account, a shared password, an app on a child's device, a permission somebody granted four years ago for a reason that ended. Default-on is a decision nobody made. Make it.

Two, the grant you cannot name. Find one thing you use that you could not say who gave you. Then either get the grant or stop using it. [[Proverbs 25:28]] A house with no rule over its own gate is the city in that verse.

Three, the thing in your hand. The point of all of this is not suspicion; it is stewardship, and stewardship is a joy. [[Micah 4:4]] Your own vine. Your own fig tree. Nobody making you afraid. A household that knows who gave it what it holds, and holds it on purpose, is the nearest thing on earth to that verse.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that reaching is wrong - the centurion could reach, the shepherd could reach, Eliakim could reach. The difference every time was whether the reaching was GIVEN. [[Zechariah 4:6]] Not by might, nor by power, but by My Spirit, saith the LORD of hosts.`,

  BLOCKED,

  TALK.lesson,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader, not a
// re-registering of the adult text, and each carries the whole teaching, the
// blocked road and the talk-together close (DR-0795).
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

A BIG WORD AND A SMALL ONE. Here are two words. Find. Give. They are not the same word at all. This whole lesson is about how they are not the same.

WHO SENT THIS. Darrell got an email about computers on the twenty-eighth of October. He wrote one word on top of it. The word was Lesson. Then he sent it to us. That one word is why you are reading this. We built it sixteen days later. We tell you that so you know how long it took.

THE STORY THE EMAIL TOLD. A big company has lots of helper tools. A robot helper can use the tools to do jobs. But there were too many tools. No one knew where they all were. So the company made one front door for all of them.

Then they did a smart thing. When a new tool is found, the tool is turned OFF. It does not work yet. Someone who owns that tool has to look at it. That person says yes. Then it turns on.

Finding a tool does not turn it on. A person turns it on. Hold on to that.

THE WORD FIRST. Yahweh said this long before there were any computers.

A man named Eliakim was given a big job. He got a key. Look at how he got it. [[Isaiah 22:22]] The key was LAID ON HIM. He did not take it. Someone put it there. That is what a real key is. It is handed to you.

Jesus holds that key now. [[Revelation 3:7]] He opens. Then no one can shut it. He shuts. Then no one can open it.

THE TREE IN THE GARDEN. Now the sad part. Think about the garden.

Yahweh told the man he could eat. He could eat from lots of trees. [[Genesis 2:16]] But there was one tree he must not eat from. [[Genesis 2:17]]

Here is the thing to see. The tree was right there. Eve could see it the whole time. She could walk to it. She could touch it. It was easy to find.

But she was never told she could have it.

Look at what the Word says she did. [[Genesis 3:6]] She SAW it. It looked good. So she took it.

She could find it. She was not given it. She took it anyway. That is how the sad thing started.

Finding is not the same as getting.

A MAN NAMED ACHAN. The same thing happened again. A man took gold that was not his. He told what he did. [[Joshua 7:21]] Saw. Then wanted. Then took.

Three steps. You can stop at step one. You can stop at step two. Stop before step three.

THE DOOR AND THE MAN AT IT. Jesus told a story about sheep. There is a pen. There is a door.

[[John 10:1]] A man who climbs the wall is a thief. He could get in. He just did not go in the right way.

Then the good way. [[John 10:2]] [[John 10:3]] There is a man at the gate. We call him a porter. His job is to open the gate for the right one. The sheep know the voice. They come.

Jesus says He is that door. [[John 10:9]]

SOMEONE IS OVER YOU. A soldier once told Jesus something smart. [[Matthew 8:9]] He said he was UNDER someone. That is why his word worked.

You are under someone too. That is a good thing. It is not a bad thing.

WHAT GOES OUT. One more thing. The front door also watches what goes OUT. It can hide things that should stay private.

The Word says to guard your heart. [[Proverbs 4:23]] Things come out of it.

David asked for help with his mouth. [[Psalm 141:3]] A door with a guard on it.

Some people tell everything. Some people keep it. [[Proverbs 11:13]]

ONLY SO MUCH ROOM. A robot helper has only so much room in its head at one time. If you fill it with junk there is no room for the real job.

You are like that too. [[Mark 4:24]] Take heed WHAT you hear. And how. [[Luke 8:18]]

So pick good things. [[Philippians 4:8]]

THE PARTS THAT HOLD IT ALL. The man who wrote the email said the hard part is not the smart part. The hard part is the joins. The bits that hold it all.

Yahweh said that first. [[Ephesians 4:16]] Every joint helps.

And love is the best join of all. [[Colossians 3:14]]

WHO REALLY HAS THE KEYS. Jesus has them. [[Revelation 1:18]] He can open a door no one can shut. [[Revelation 3:8]]

He is the Lamb. [[John 1:29]] He is the Son. [[John 3:16]] All things hold in Him. [[Colossians 1:17]]

THE PARTS THAT GO BETWEEN. The man who wrote that email said one more thing. He said the hard part is not the smart part. The hard part is the bits that join it all up.

Think of your own hand. The strong part is not one bone. It is the joints. Take out the joints and you just have a pile of bones on a table.

Yahweh said that about His own people first. A body grows when every joint does its share.

A WORD ABOUT BEING UNDER SOMEONE. Some people think it is bad to be under someone. It is not bad. It is how a key works.

Think of a door at your church. The man who opens it was handed the key. He did not make the key. He did not buy the key. Someone gave it to him. And if he lost his job there, he would give it back. That is not sad. That is how it is meant to work.

You are the same. You hold things that are not yours yet. That is good. It means someone trusts you.

WHAT TO DO THIS WEEK. Walk around your house. Find one thing that is ON. It could be an old app. It could be a light. It could be a door that is never locked. Ask if anyone ever said yes to it. Maybe no one ever did. Then go and ask a grown-up about it.

Then find one thing you use a lot. Ask who gave it to you. If no one gave it to you, go and ask for it. Asking is not weak. Asking is the whole lesson.

And here is one line to keep. Say it out loud. Finding is not getting.

${BLOCKED}

${TALK.child}`;

const YOUTH = `${TITLE}.

TWO WORDS THAT ARE NOT THE SAME. Find. Give. Say them again. They are not the same word, and the whole hour sits in the space between them.

WHO SENT THIS, AND WHEN. On the twenty-eighth of October 2026 Darrell forwarded an engineering newsletter out of his work mailbox. Above the forwarded header he typed one word: Lesson. That one word is the ask. The newsletter is only the thing that happened to be in front of him. Sixteen days stood between his word and this build, and we keep that on the record instead of hiding it.

WHAT THE NEWSLETTER DESCRIBED. A very large company had a mess. Dozens of teams had each built their own way for an artificial-intelligence helper to reach their tools. Nobody could tell what tools existed. Every team was solving the same problem again.

So the company built one shared front door. They call it a gateway. Behind that door sits a catalog of all the tools. A crawler goes out and finds tools nobody registered by hand. A proxy takes each request and sends it to the right place.

Then comes the sentence that this whole lesson stands on, and the article almost walks past it. When a new tool is discovered, it starts DISABLED. It does not work. Somebody who owns that service has to look at it and turn it on. The article says the choice to enable is an ownership decision.

Read that again. Finding a tool does not grant it. A person grants it.

THE WORD FIRST, BECAUSE THE WORD IS THE AUTHORITY HERE. Yahweh settled this long before anybody built a gateway.

In Isaiah a steward is removed and a new one is put in. Watch how the new man gets his authority. [[Isaiah 22:22]]

Laid on his shoulder. That is a physical picture on purpose. He did not find the key. He did not pick it up. Somebody with the right to do it put it on him. And then look at the power that comes with it - he opens and nobody shuts, he shuts and nobody opens.

The verses before it use four verbs, and he does none of them to himself. He is called. [[Isaiah 22:20]] He is clothed and strengthened and the government is committed into his hand. [[Isaiah 22:21]]

That same key shows up once more, in the hand of the One it belongs to. [[Revelation 3:7]]

THE TREE WAS ALWAYS EASY TO FIND. Now the garden, because the garden is where this first went wrong.

The grant was generous and it was clear. [[Genesis 2:16]] Freely eat, of every tree. And there was one exception, said out loud, with the cost attached. [[Genesis 2:17]]

Here is what people miss. The serpent did not have to show her the tree. The tree had been standing in the middle of the garden from the first day. It was findable the whole time. What he changed was not what she could SEE. He changed what she believed she was ALLOWED.

And then the text describes the fall in the language of a shopping list. [[Genesis 3:6]]

She saw. Good for food. Pleasant to the eyes. To be desired. Every one of those describes the thing. Not one of them is permission. She had the catalog and she did not have the grant, and she used the first as if it were the second.

Achan did the same with gold and a garment, and he told on himself in three words. [[Joshua 7:21]] Saw. Coveted. Took.

Three steps. The only place to stop a person is between step one and step three. A house that starts everything disabled has built a wall right there.

THE OWNER HANDS IT OUT. Scripture has a word for the man holding what belongs to somebody else, and it never once says he appointed himself.

[[Luke 12:42]] Whom his lord shall MAKE ruler. The lord does the making. And the one thing asked of him afterward is short. [[1 Corinthians 4:2]]

The talents work the same way, and the amounts are not equal on purpose. [[Matthew 25:15]] The owner decides who gets how much.

THE PORTER AT THE GATE. Jesus told a gateway story about sheep.

[[John 10:1]] Notice: the climber CAN get in. He is not blocked by weakness. He is condemned by his route.

Then the right way, and the man whose whole job is the gate. [[John 10:2]] [[John 10:3]]

A porter. He does not decide who the shepherd is. He opens to the one who already is. And Jesus takes the role Himself. [[John 10:9]]

UNDER BEFORE OVER. A soldier explained delegated authority to Jesus better than most adults could. [[Matthew 8:9]]

Read the first part again. I am a man UNDER authority. He starts with who is over him, not with who is under him. That is exactly why his word works going down - because it answers going up.

And the general rule has no exceptions. [[Romans 13:1]]

THE GATE ALSO WATCHES WHAT LEAVES. The newsletter mentions that the gateway can strip private information out of an answer before it goes back. Scripture is not casual about this.

[[Proverbs 4:23]] Guard it, because out of it come the things that come OUT.

David asked for a watchman on his mouth. [[Psalm 141:3]] A door with a keeper.

And Proverbs names the two kinds of people standing at that door. [[Proverbs 11:13]] One reveals. One conceals. The second one is the one called faithful.

There is even a rule for the argument you are winning. [[Proverbs 25:9]] [[Proverbs 25:10]] Argue your case. Do not empty somebody else's pocket to do it.

THE ROOM IS NOT UNLIMITED. The last part of the article is about space. A model can only hold so much at once. Load a thousand tool descriptions in at the start and there is no room left for the work. So the gateway lets the agent discover a little at a time instead.

Now the same instruction, given about a person. [[Mark 4:24]] Take heed WHAT you hear. And Luke adds the other half. [[Luke 8:18]]

The psalmist puts the rule at the eye. [[Psalm 101:3]] And Paul gives the full list. [[Philippians 4:8]]

Somebody who will take in anything because it is available has the same flaw as a program that loads every tool because the catalog offered it.

THE JOINTS ARE THE HARD PART. The writer ends with a line worth keeping. He says the hardest part of building these systems is not the intelligence. It is the connective tissue - discovery, security, reliability. The joints.

Yahweh said that about His own body first. [[Ephesians 4:16]] Every joint supplies something. The strength is in what passes between the parts.

And then the part no company can install. [[Colossians 3:14]] Above everything else, the bond.

WHO HOLDS THE KEYS. [[Revelation 1:18]] And to a small church with little strength He says the thing no gateway can promise. [[Revelation 3:8]]

He is the Lamb of Yahweh. [[John 1:29]] The Eternal Son. [[John 3:16]] Called God by the Father. [[Hebrews 1:8]] And by Him everything holds together. [[Colossians 1:17]]

ONE MORE THING WORTH SAYING OUT LOUD. None of this means that reaching is wrong. The centurion could reach. The shepherd could reach. Eliakim could reach the lock before anybody laid a key on him. Ability was never the question in any of these passages, and it is not the question in your life either. The question every single time was whether the reaching had been given. [[Zechariah 4:6]]

THIS WEEK, THREE THINGS. First, walk your own house and find one thing that is turned on because nobody ever decided to turn it off. An old account. A shared password. A permission somebody granted years ago. On-by-default is a decision nobody made. Make it.

Second, find one thing you use that you could not say who gave you. Get the grant, or stop.

Third, remember the point is not suspicion. [[Micah 4:4]] Your own vine. Nobody making you afraid.

${BLOCKED}

${TALK.youth}`;

const TEEN = `${TITLE}.

START WITH A QUESTION ABOUT YOUR OWN PHONE. What can you get into right now that nobody ever actually gave you? Not stole. Not hacked. Just - reached, because it was open, and nobody said no.

Hold that answer. The whole hour runs through it.

WHO SENT THIS, AND THE GAP. On 2026-10-28 at 15:49 UTC Darrell forwarded an engineering newsletter out of his university mailbox. Above the forwarded header he typed one word: Lesson. That word is the ask; the newsletter is only the occasion. Sixteen days passed between his word and this build, and that gap is kept on the record instead of smoothed.

THE ARCHITECTURE, AND THE ONE SENTENCE THAT MATTERS. A very large company had dozens of teams each wiring up their own way for artificial-intelligence agents to reach tools. Nobody could tell what existed. So they built one shared front door - a gateway. Behind it: a registry that holds the catalog, a crawler that discovers tools nobody registered, and a proxy that routes each request.

Now the sentence. New servers and tools start DISABLED. Discovery makes a thing VISIBLE to the platform. The owning team must then review it and enable it, and the article says the choice to enable is an ownership decision.

That is the lesson. Discovery is not permission.

HOW MUCH BIGGER IS THAT THAN THE ARTICLE SAID? Bigger, and this is the one place our own checking made the claim stronger rather than weaker. The article tells it as that company's design taste. But we read the protocol's own specification at its source, and the specification carries consent as one of its four key principles - users must explicitly consent to and understand all data access and operations, and hosts must obtain explicit consent before invoking any tool. And then it admits something: it cannot enforce any of that at the protocol level. Implementors should.

So a house that starts everything disabled is not being tidy. It is doing the thing the protocol says it cannot do for itself. Somebody has to be the gate. The standard says so and then hands the job to you.

THE WORD FIRST, BECAUSE THE WORD IS THE AUTHORITY. Yahweh settled all of this long before anybody wrote a spec.

In Isaiah, one steward is removed and another installed. Watch how authority transfers. [[Isaiah 22:22]]

Laid on his shoulder. Physical, on purpose. He did not find it. Somebody with the right to do it put it there. Four verbs cover the whole transaction, and he performs none of them on himself: called, [[Isaiah 22:20]] clothed and strengthened and committed. [[Isaiah 22:21]]

The key turns up once more, in the hand it belongs to. [[Revelation 3:7]] And the reach of that hand gets no decoration. [[Job 12:14]]

WHY DID THE GARDEN FALL? The grant was explicit and generous. [[Genesis 2:16]] One exception, named out loud, cost attached. [[Genesis 2:17]]

Here is the part people skip. The serpent never had to reveal the tree. It stood in the middle of the garden from day one. It was discoverable the entire time. He did not change what she could see. He changed what she believed she was permitted.

And the fall is recorded as an inventory. [[Genesis 3:6]] Saw. Good for food. Pleasant. Desirable. Every one of those is a property of the object. Not one is a grant.

She had the catalog. She did not have the permission. She used the first as if it were the second.

Achan ran the same three steps and narrated them himself. [[Joshua 7:21]] Saw. Coveted. Took. The only place to stop a person is between one and three.

WHO HANDS OUT AUTHORITY? Never the person holding it. [[Luke 12:42]] Whom his lord shall MAKE ruler. And then one requirement. [[1 Corinthians 4:2]]

The talents are handed out unequally on purpose. [[Matthew 25:15]] The owner sets the scope.

WHAT DOES THE WORD CALL SOMEONE WHO GETS IN ANOTHER WAY? [[John 10:1]] Read it carefully. The climber CAN get in. He is not stopped by weakness. He is condemned by his route.

Then the office that makes a gate work. [[John 10:2]] [[John 10:3]] There is a porter. He does not decide who the shepherd is. He opens to the one who already is. And the sheep are known by a voice, not by a badge.

Then Jesus takes the role. [[John 10:9]] By me. Through, not around. And the two kinds of traffic get one line. [[John 10:10]]

WHY DID JESUS MARVEL AT A SOLDIER? Because the man understood delegated permission. [[Matthew 8:9]]

Read the first clause again. I am a man UNDER authority. He starts with who is over him. That is exactly why his word works downward - because it answers upward.

He could send a soldier. He could not raise the dead. He knew the shape of his own grant. Jesus called that great faith. The general rule has no exceptions. [[Romans 13:1]]

WHAT ABOUT WHAT GOES OUT? The gateway can strip private data out of an answer before it goes back. Scripture is not casual here.

[[Proverbs 4:23]] Keep it - a guard's word - because out of it are the things that come OUT. The diligence is on the outbound side.

David asked for a posted watchman. [[Psalm 141:3]] Proverbs names the two kinds of people at that door. [[Proverbs 11:13]] One reveals. One conceals. The second is called faithful.

There is a rule even for the argument you are winning. [[Proverbs 25:9]] [[Proverbs 25:10]] Argue your case. Do not spend somebody else's secret to win it.

WHY DOES A FINITE ROOM CHANGE WHAT YOU LET IN? The last section of the article is about space. A model holds only so much at one time. Load a thousand tool descriptions in advance and there is no room for the work. So the gateway lets an agent discover gradually.

Same instruction, about a person. [[Mark 4:24]] Take heed WHAT you hear. Luke gives the other half. [[Luke 8:18]] What, and how.

The psalmist sets it at the eye. [[Psalm 101:3]] Paul gives the admissions list. [[Philippians 4:8]]

A person who takes in whatever is available has the same defect as a client that loads every tool because the catalog offered it.

SO WHAT IS ACTUALLY THE HARD PART? The writer ends by saying it is not the intelligence. It is the connective tissue - discovery, security, reliability. The joints.

Yahweh said it about His own body first. [[Ephesians 4:16]] Fitly joined. Compacted. Every joint supplies. The strength is in what passes between the parts, not in any one part.

Colossians says it from the Head down. [[Colossians 2:19]] And then the part nobody can install. [[Colossians 3:14]] Above all these, the bond.

Paul says what ability without it is worth. [[1 Corinthians 13:2]] A gateway of a thousand tools with no love in the house is a very efficient nothing.

WHO ACTUALLY HOLDS THE KEYS? [[Revelation 1:18]] And to a small church with little strength. [[Revelation 3:8]] An open door no man can shut. That is permission from the only source a policy change cannot revoke.

He is the Lamb of Yahweh, [[John 1:29]] the Eternal Son, [[John 3:16]] addressed by the Father as God on a throne for ever, [[Hebrews 1:8]] and by Him all things hold. [[Colossians 1:17]]

WHAT DO YOU DO MONDAY? Three things, and none of them cost money.

One. Find one thing in your life that is enabled because nobody ever decided to disable it. An old login. A shared account. A permission you granted an app in middle school. Default-on is a decision nobody made. Make it.

Two. Find one thing you use that you could not say who gave you. Get the grant or stop using it. [[Proverbs 25:28]]

Three. Remember that the point is not suspicion. It is stewardship, and stewardship is a joy. [[Micah 4:4]]

And the thing that must not be taken from this hour: reaching is not the sin. The centurion could reach. The shepherd could reach. Eliakim could reach. The question every time was whether the reaching was GIVEN. [[Zechariah 4:6]]

${BLOCKED}

${TALK.teen}`;

const SENIOR = `${TITLE}.

A WORD TO THOSE WHO HAVE CARRIED KEYS FOR OTHER PEOPLE'S HOUSES. Most of you have held something that was not yours. A set of books. A ward. A till. Somebody's mother. A shop at closing. You already know in your body the thing this lesson is about, and the young people in your house do not know it yet, which is why you are the right one to read this band.

WHO SENT THIS, AND WHEN. On the twenty-eighth of October 2026, at 15:49 by universal time, Darrell forwarded an engineering newsletter out of his university mailbox into this lane, and above the forwarded header he typed a single word: Lesson. That word is the ask; the article is only the occasion, and no article is the foundation of an hour in this course. Sixteen days stood between his word and this build, and the gap is kept on the record rather than quietly smoothed away.

WHAT THE ARTICLE WAS ABOUT, IN PLAIN TERMS. A very large company found itself with dozens of teams each building their own private way for artificial-intelligence helpers to reach the company's tools, until nobody could say what tools existed or who was responsible for them. So they built one shared front door, which they call a gateway, and behind that door they put a catalog of every tool, a crawler that goes looking for tools nobody registered by hand, and a single checkpoint through which every request must pass.

And then, in about forty words that the writer treats as housekeeping, there is this: a newly discovered server or tool begins in a DISABLED state, and the team that owns the service must review it and enable it before any agent may use it. The article calls the choice to enable an ownership decision. That sentence is worth more than the entire architecture around it, and it is the hour.

Discovery is not permission. A machine may find the door. A person with standing opens it.

WHAT OUR OWN CHECKING FOUND, AND IT MADE THE POINT LARGER. We do not take a newsletter as a citation, so we went looking. We could not reach that company's own published account - the address would not resolve from our network at all - so everything specific to them in this lesson is told exactly as the newsletter told it and is never stated on our own authority.

But the underlying standard we could reach, and we read it at its own source. The specification carries consent as one of four key principles: users must explicitly consent to and understand all data access and operations, and hosts must obtain explicit user consent before invoking any tool. And then it says something that ought to be read aloud in every church that owns a computer - that it cannot enforce any of this at the protocol level, and that implementors should do it.

So the standard names the duty and admits it cannot make anybody keep it. Which means a house that starts every discovered thing disabled is not being fussy. It is accepting a duty that the standard itself hands over. Somebody has to be the gate, and the written rule says plainly that it will not be the written rule.

THE WORD FIRST, AND THE WORD IS THE AUTHORITY. Yahweh settled this long before there was a protocol to write down.

In Isaiah there is a steward turned out and a steward installed, and the installation is given in one of the most physical images in all of Scripture. [[Isaiah 22:22]]

Laid upon his shoulder. Not seized, not discovered, not inferred from the fact that the man could reach the lock. Laid upon him, by one with the right to lay it there, and the authority that comes with it runs both ways without appeal - he opens and none shuts, he shuts and none opens.

Read the verses before it and the whole transaction is in four verbs, and the man receiving them performs none of them upon himself. He is called. [[Isaiah 22:20]] He is clothed, and strengthened, and the government is committed into his hand. [[Isaiah 22:21]]

That same key is held once more by the One to whom it finally belongs. [[Revelation 3:7]] And the reach of that hand is stated without any decoration at all. [[Job 12:14]]

THE TREE WAS ALWAYS IN PLAIN SIGHT. Now the garden, because this is where it first went wrong, and the detail that matters is one most of us have read past for fifty years.

The grant was explicit and it was generous. [[Genesis 2:16]] And there was a single exception, spoken aloud, with its cost attached to it. [[Genesis 2:17]]

Consider what the serpent did not have to do. He did not have to reveal the tree to her. It had stood in the middle of the garden from the first day; it was discoverable the entire time. He did not change one thing about what she could see. He changed what she believed herself permitted.

And the Word records the fall in the language of an inventory. [[Genesis 3:6]] She saw. Good for food, pleasant to the eyes, to be desired to make one wise. Every one of those is a property of the thing itself. Not one of them is a grant. She possessed an accurate catalog and no permission whatever, and she treated the first as though it were the second.

Achan ran the same three steps generations later and narrated them against himself with terrible clarity. [[Joshua 7:21]] Saw, coveted, took. The only place on earth where a man can be stopped is in the space between the first step and the third, and a house that begins everything disabled has built its wall precisely there.

THE OWNER APPOINTS; THE SERVANT NEVER APPOINTS HIMSELF. Scripture has a settled word for the man who holds what is not his, and it never once suggests he put himself in the office. [[Luke 12:42]] Whom his lord shall make ruler - the making is the lord's own act. And what is required of the man afterward is a single word. [[1 Corinthians 4:2]]

The talents are handed out in the same manner, and the portions are deliberately unequal. [[Matthew 25:15]] The owner determines who receives what, and how much, and the scope is intentional and right.

THERE IS A PORTER, AND HIS WHOLE OFFICE IS THE GATE. Our Lord told a gateway parable, and it was about sheep. [[John 10:1]] Notice that the climber is perfectly able to get in. He is not stopped by any weakness; he is condemned entirely by his route.

Then the proper way, and the office that makes a gate work at all. [[John 10:2]] [[John 10:3]] There is a porter. He does not determine who the shepherd is; he opens to the one who already is, and the sheep are known by a voice they have heard all their lives rather than by any token they carry.

Then the Lord takes the role Himself. [[John 10:9]] By me - through, and not around. And the difference between the two kinds of traffic that approach any gate is given in one line. [[John 10:10]]

AUTHORITY WORKS BECAUSE IT IS UNDER AUTHORITY. A centurion once explained delegated permission to our Lord better than most of us could, and the Lord marveled at him for it. [[Matthew 8:9]]

Read the opening clause again. I am a man under authority. He does not begin with the soldiers beneath him; he begins with the authority above him, and that is precisely why his word carries downward - because it answers upward. He could send a man and he could not raise the dead, and he knew the exact shape of his own grant. The general case is stated without exception. [[Romans 13:1]]

THE GATE GUARDS THE OUTBOUND SIDE AS WELL. The article mentions almost in passing that the gateway can remove personal information from an answer before it is returned. Scripture is not in passing about this at all. [[Proverbs 4:23]] Keep it, with a guard's diligence, because out of it are the issues - the things that come out. The heart carries traffic in both directions and the verse puts the diligence on what leaves.

David asked for a posted watchman upon his own mouth. [[Psalm 141:3]] And Proverbs names the two kinds of men who stand at that door. [[Proverbs 11:13]] One reveals; one conceals; and the second is the one the Word calls faithful.

There is even a rule for the quarrel you are winning. [[Proverbs 25:9]] [[Proverbs 25:10]] Debate your cause - argue it honestly - and do not empty another man's pocket in order to win it.

THE ROOM IS FINITE, WHICH IS WHY THE DOOR MATTERS. The final portion of the article concerns space. These machines hold only so much at one time, and loading a thousand tool descriptions in advance leaves no room for the work itself, so the gateway lets the agent discover a little at a time rather than pouring the whole catalog in at the start.

Hear the same instruction given about a man. [[Mark 4:24]] Take heed what ye hear. And Luke supplies the other half of it. [[Luke 8:18]] What, and how - two commands about intake, and both of them assume the room is finite.

The psalmist set the policy at the eye. [[Psalm 101:3]] And Paul gave the filter, with the whole list, and it remains the most demanding admissions policy ever written. [[Philippians 4:8]]

THE JOINTS ARE THE HARD PART, AND HE SAID SO FIRST. The writer closes with a line worth carrying out of this hour: that the hardest part of building these systems is not the intelligence at all, but the connective tissue - discovery, security, reliability. The joints.

Yahweh said this of His own body long before anyone built a gateway. [[Ephesians 4:16]] Fitly joined together, compacted, by that which every joint supplieth. The strength lies not in any single member but in the supply that passes between them. Colossians says the same thing from the Head downward. [[Colossians 2:19]]

And then the part that no engineering team anywhere can install. [[Colossians 3:14]] Above all these things - above the gifts, the offices and the structure - the bond that actually holds. Paul states what ability without it comes to, in a sentence that ought to hang over every clever architecture ever drawn. [[1 Corinthians 13:2]]

WHO HOLDS THE KEYS, AND WHAT THIS HOUSE DOES THIS WEEK. [[Revelation 1:18]] He holds the keys of the last two doors any of us has ever truly feared. And to a small congregation with little strength He says the thing a gateway can only imitate. [[Revelation 3:8]] An open door that no man can shut - permission from the one source no policy change can revoke.

The One who holds it is the Lamb of Yahweh, [[John 1:29]] the Eternal Son, [[John 3:16]] addressed by the Father as God upon a throne for ever, [[Hebrews 1:8]] and the One by whom the whole of it consists. [[Colossians 1:17]]

Three things this week, and not one of them costs anything. First, walk your own house and find one thing that stands enabled only because nobody ever decided to disable it - an old account, a shared password, an application on a grandchild's tablet, a permission granted four years ago for a reason that ended three years ago. On-by-default is a decision nobody ever made; go and make it.

Second, find one thing you use daily that you could not say who gave you. Obtain the grant or set the thing down. [[Proverbs 25:28]]

Third, and this is the one to leave the young people with: the point of all of it is not suspicion but stewardship, and stewardship is a joy. [[Micah 4:4]] A household that knows who gave it what it holds, and holds it on purpose, is the nearest thing on this earth to that verse.

And what must not be carried out of this hour: that reaching is itself the sin. The centurion could reach. The shepherd could reach. Eliakim could reach. The question every single time was whether the reaching had been GIVEN. [[Zechariah 4:6]]

${BLOCKED}

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.

WHO SENT THIS. On the twenty-eighth of October 2026 at 15:49 UTC Darrell forwarded a ByteByteGo engineering issue out of his university mailbox, with ONE WORD typed above the forwarded header: Lesson. Gmail thread 1a18330341dec7b0. His word is the ask; the newsletter is the occasion, and no article is the foundation of an hour in this course. Sixteen days stood between his word and this build, and the gap is kept rather than smoothed.

THE WORD FIRST. Isaiah 22:22 opens the hour - the key of the house of David LAID UPON A SHOULDER, so that the one who holds it opens and none shuts - and Genesis 3:6 supplies the failure, where the woman SAW that the tree was good and treated an accurate catalog as a grant. Discovery is not permission. Then nine movements: the key that is laid rather than found, the tree that was always easy to reach, the owner who enables while the crawler only finds, the porter who opens to the shepherd and the man who climbs up some other way, the centurion who began with who was over him, the gate that guards what goes out, the finite room that makes take-heed-what-ye-hear an architecture, the joints that Yahweh called the hard part first, and the keys that are held by the Lamb.

TRUST BUT VERIFY. The protocol was read at its own source and the company was not: the Model Context Protocol specification was quoted from its own repository at commit 06e9234, while www.uber.com and modelcontextprotocol.io both failed to resolve from this session, said in every reader place with re-review: 2026-11-27. Checking made the teaching BIGGER - the specification itself carries consent as one of four key principles and then admits it cannot enforce them at the protocol level, so disabled-by-default is a house doing what the standard says it cannot do for itself - STRENGTHENED the format claim, since the newsletter's "usually JSON-RPC 2.0" is a MUST in the specification, and CORRECTED two things: the specification names four roles where the newsletter names three, placing consent on the HOST and not the client, and Cadence is an open-source project whose canonical home is cadence-workflow, not internal plumbing. Attributed and never asserted: every detail of that one company's gateway. Not checked at all: the registry and proxy split, AutoCrawler, the heartbeat metric, the transport mix, the redaction, the third-party token exchange, Omni MCP, Response Projection, Code Mode, the thousands-of-tools figure and the within-minutes claim.

PLACEMENT. Sovereign A.I., week 80, because the hour is about who may open what in a house that runs its own machines.`,
  inApp: `No new screens this week. One page in your Study, and one walk around your own house with a notebook.

In the app: open Sovereign A.I. week 80 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each one holds the whole teaching rather than a summary of it. Use Search it out on Isaiah 22, Genesis 3 and John 10 so the three passages sit side by side; the links come from the lesson's own references and not from a typed list.

Away from the app, one exercise, and it is the lesson in physical form. Take thirty minutes and make a list of every thing in your household that is TURNED ON. Accounts nobody closed. Devices that still have a login from a job that ended. An application on a child's tablet that somebody approved once. A key under a mat. Write the list by hand. Then go down it and mark every line with the name of the person who decided it should be on. The lines with no name are the lesson.

Nothing here needs a purchase. If you want the one technical exercise that matches the teaching, open the permissions screen on one device in your house and turn off one permission that nothing in your life would miss. One. That is the owning team reviewing before enabling, at household scale.`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Isaiah 22:22]] [[Genesis 2:17]] [[Genesis 3:6]] [[John 10:1]] [[John 10:9]] [[Luke 12:42]] [[Matthew 8:9]] [[Proverbs 4:23]] [[Mark 4:24]] [[Revelation 1:18]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them lands on your own house rather than on a company.

First, read Isaiah 22:15-25 whole - not the one famous verse, the whole passage. Notice that it begins with a steward being REMOVED, and that the key comes with a warning at the end about a nail in a sure place giving way. Authority is given, and it can also be withdrawn. Write one sentence on what that does to anything you currently hold.

Second, read Genesis 2:16-17 and Genesis 3:1-6 back to back, slowly, and watch for the thing most readings skip: the tree was visible from the first day. Then make an honest list of the things in your own life that are reachable and were never granted. Not to feel guilty - to SEE it. The list is the research.

Third, read John 10:1-10 and find the porter. Ask who the porter is in your own house. If the answer is nobody, that is the finding.

And one verification reading, because this course works this way. The teaching in this lesson about consent being named in the standard and unenforceable by the standard was read at the specification's own source. The details about the company were NOT - that address would not resolve from our network - so they are attributed and never asserted, with a re-review date on the page. Read that paragraph and notice exactly what it does not claim. Practice telling apart a thing that was verified, a thing that was attributed, and a thing nobody checked.`,
    plan: `PLAN. Decide the two measures before the week starts, and decide who hears them.

One: the inventory. Name the day and the half hour you will spend writing the list of everything in your household that is turned on. Put it on the calendar. An unscheduled inventory does not happen, and the whole point of this lesson is that nobody ever decided.

Two: the one disable. Choose in advance that you will turn ONE thing off by the end of the week - an account, a permission, a standing access - and that you will write down who originally enabled it, even if the answer is nobody. One, not twenty. A list with no action is a worry.

Then name the person who will ask you about both on the same day next week. Write the name down. A measure nobody asks about is a wish.

And decide in advance what you will tell the young people in your house. The sentence is short: finding it is not the same as being given it.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.

Do the inventory on the day you named. Write the list by hand, because handwriting slows you down enough to be honest. Mark each line with the name of whoever decided it should be on. Circle the unnamed ones.

Turn one thing off. Say out loud, to the person who is asking you about it, what you turned off and who had originally enabled it. If the answer is nobody, say that out loud too - that is the finding, not a failure.

Teach the sentence at a meal. Finding is not getting. Seeing is not receiving. Ask one child to say it back in their own words, and let them say it badly before you correct it.

At the end of the week, answer three questions to the person who is asking. What did I find turned on that nobody ever decided? What did I turn off? And what am I still using that I could not say who gave me? The third one is the real one, and it is allowed to take longer than a week.

Measure the growth the Word's way - by the fruit, by the occasions, and by the days - and not by how many lines were on the list.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over an engineering newsletter, answered from the Word rather than from the article - and the sixteen-day gap between his word and the build kept on the record rather than smoothed.`,
    `The hour opened by Isaiah 22:22, so a reader meets the key being LAID ON A SHOULDER before one detail of anybody's architecture appears on the page.`,
    `One sentence rescued from the middle of a technical article and made the whole teaching: newly discovered tools start disabled, and the owner enables them.`,
    `The oldest form of the lesson recovered from the garden - the tree was discoverable from the first day, so the serpent changed not what she could see but what she believed she was permitted.`,
    `Genesis 3:6 read as an inventory: good for food, pleasant to the eyes, to be desired - every one a property of the thing, not one of them a grant.`,
    `Achan's own three words put beside it - saw, coveted, took - so a reader can name the only place a person can be stopped.`,
    `The steward's four passive verbs in Isaiah 22:20-21 named out loud: called, clothed, strengthened, committed, and he does none of them to himself.`,
    `John 10 taught as what it is, a gate passage, with the porter given his office back and the climber identified by his route rather than his inability.`,
    `The centurion's first clause restored - I am a man UNDER authority - so delegated permission is taught upward before it is taught downward.`,
    `Proverbs 11:13 and Psalm 141:3 used to teach the outbound gate, so redaction is understood as a faithful spirit at the door of an answer.`,
    `Mark 4:24 and Philippians 4:8 placed where the finite-context problem is, so take heed what ye hear is read as an architecture and not a mood.`,
    `Ephesians 4:16 and Colossians 2:19 set against the article's own closing line, so the writer's connective tissue meets the joints Yahweh named first.`,
    `1 Corinthians 13:2 kept in, so nobody leaves thinking a thousand well-governed tools without love amount to anything.`,
    `A checking pass that made the claim BIGGER rather than smaller, and said so plainly as DR-0100 section 5 requires.`,
    `The protocol's own specification quoted from its own source rather than from the newsletter that summarized it.`,
    `The specification's admission carried onto the page - that it cannot enforce its own consent principles at the protocol level - which is the reason a household gate is not optional.`,
    `A hedge turned into a requirement by checking: the newsletter's usually JSON-RPC 2.0 is a MUST in the specification.`,
    `A quiet correction made out loud: the specification names four roles where the article names three, and places consent on the HOST.`,
    `Every claim about the one named company marked as attributed and never asserted, because its own published account would not resolve from our network.`,
    `The blocked road named in all five reader places with a dated re-review, so no shut road can read like a verified fact.`,
    `A list of what was NOT checked at all, so silence is never mistaken for verification.`,
    `All four age bands carried from the first commit, each an independent composition rather than a shortened adult lesson.`,
    `A child band that teaches the whole thing with two words, find and give, and never once talks down to the reader.`,
    `A teen band built as questions, because the teen reader is the one who most often holds access nobody granted.`,
    `A senior band addressed to people who have carried keys for other people's houses, which is the experience this lesson is actually about.`,
    `A household exercise that costs nothing: write down everything that is turned on, and mark who decided it.`,
    `One concrete Monday action, bounded on purpose - turn ONE thing off - so the lesson produces a fact rather than a worry.`,
    `The close sent back into Isaiah 22, Genesis 3 and John 10 in that order, with every link derived from the lesson's own references.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The keys the caretaker never gave back',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A church hired a caretaker for the building, and the man was given a ring of keys on his first day by the trustee who had the right to give them. He kept that building for eleven years and kept it well, and when his knees gave out he retired with a dinner and a card and everybody's thanks.

Nobody asked for the keys back. It was not suspicion that stopped them; it was affection. He had earned the ring, and asking felt like an accusation.

Four years later a new family joined, and the caretaker's grandson came with them, and the boy knew where his grandfather had always kept that ring. He was not a thief. He was sixteen and curious and the building was simply open to him in a way it was not open to anyone else his age, and for most of a winter he came and went through a side door, and nothing bad happened, which is the part that made it last.

What ended it was not a crime. It was a trustee walking the building on a Saturday with a clipboard, doing a thing nobody had done in years, writing down every door and every key and the name of the person who had decided each one. He came to a line he could not fill in. There was no name against that side door, and there had not been one for four years, and that blank space was the whole finding.

They changed one lock and they asked the grandson to come on Tuesdays and help, and gave him a key with his own name written beside it in the book. He kept it until he left for school. The difference between the winter and the Tuesdays was not the boy, and it was not the door. It was a name in a book.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The woman who read the whole catalog',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A woman took a job keeping records for a small firm, and on her first morning they handed her a login that opened more than her work required. It was not carelessness exactly. The firm had one setting for office staff and had never gotten around to making a second one.

She noticed within a week. She could see what everyone was paid. She could see which of the partners had borrowed against the business and when. She had been given a key to the whole building because somebody had been too busy to cut a smaller one.

She did not use it. That is not the point of the story. The point is what it cost her not to.

For three years she sat with knowledge she had never been granted, in rooms where people spoke freely because they assumed she did not have it, and she carried the weight of concealing a thing she had never asked for. Twice she nearly spent it - once in a quarrel she was winning and once out of simple tiredness - and both times she stopped herself, and both times it took something out of her.

When the firm finally brought in someone to tidy the systems, the woman asked for her own access to be cut down. The man doing the work assumed she was being modest and offered to leave it. She told him no, and she told him why, and he wrote it down.

She said afterward that she had not understood until that week how heavy an ungranted thing is to carry, even when you never touch it. The relief was not that she could no longer see. The relief was that she no longer had to be the only gate.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Isaiah 22:22, how does Eliakim come to hold the key of the house of David?',
        options: [
          'He finds it after the former steward leaves',
          'It is LAID UPON HIS SHOULDER - given by one with the right to give it',
          'He is the only man able to reach the lock',
        ],
        answer: 1,
        explain:
          'The picture is physical on purpose: the key is laid upon his shoulder. The verses before it supply four verbs he performs on none of himself - called, clothed, strengthened, committed. The right to open is given by an owner, never acquired by reaching.',
      },
      {
        q: 'What did the serpent NOT have to do in the garden?',
        options: [
          'He did not have to reveal the tree - it stood in the middle of the garden from the first day',
          'He did not have to speak to the woman',
          'He did not have to be present at all',
        ],
        answer: 0,
        explain:
          'The tree was discoverable the entire time. He changed nothing about what she could see; he changed what she believed she was permitted. That is the exact distinction this lesson is built on.',
      },
      {
        q: 'Genesis 3:6 records the fall in the language of what?',
        options: [
          'A prayer',
          'An inventory - good for food, pleasant to the eyes, to be desired',
          'A legal argument',
        ],
        answer: 1,
        explain:
          'Every item in that list is a property of the thing itself. Not one of them is a grant. She had an accurate catalog and no permission, and she treated the first as though it were the second.',
      },
      {
        q: 'Achan names his own three steps in Joshua 7:21. What are they?',
        options: ['Heard, believed, obeyed', 'Saw, coveted, took', 'Asked, waited, received'],
        answer: 1,
        explain:
          'Saw, coveted, took. The only place a person can be stopped is in the space between the first step and the third, which is exactly where a disabled-by-default gate stands.',
      },
      {
        q: 'In Luke 12:42, who makes the steward ruler over the household?',
        options: ['The steward himself, by proving competence', 'His lord', 'The other servants, by agreement'],
        answer: 1,
        explain:
          'Whom his lord shall MAKE ruler. The making is the lord’s own act. And what is asked of the steward afterward is one word, in 1 Corinthians 4:2: faithful.',
      },
      {
        q: 'In John 10:1, what condemns the man who climbs up some other way?',
        options: [
          'That he was unable to reach the door',
          'His ROUTE - he could get in, but not by the door',
          'That he owned no sheep',
        ],
        answer: 1,
        explain:
          'He is perfectly able to get in. He is not stopped by weakness; he is condemned entirely by the way he came. Ability was never the question.',
      },
      {
        q: 'What is the porter’s office in John 10:3?',
        options: [
          'To decide who the shepherd is',
          'To open to the one who already is the shepherd',
          'To keep the sheep from leaving',
        ],
        answer: 1,
        explain:
          'He does not determine who the shepherd is; he opens to the one who already is, and the sheep are known by a voice rather than by a token. That is a gate with a keeper, and the Word had the office first.',
      },
      {
        q: 'Why does the centurion’s word work in Matthew 8:9?',
        options: [
          'Because he commands many soldiers',
          'Because he begins with being a man UNDER authority - it carries downward because it answers upward',
          'Because he had met Jesus before',
        ],
        answer: 1,
        explain:
          'Read the first clause again. He starts with the authority above him, not the soldiers beneath him. He knew the exact shape of his own grant, and Jesus called that great faith.',
      },
      {
        q: 'Which verse is used in this lesson to teach the OUTBOUND gate - what a request is entitled to receive back?',
        options: [
          'Proverbs 11:13, where one man reveals a secret and the faithful spirit conceals the matter',
          'Proverbs 3:5',
          'Psalm 23:1',
        ],
        answer: 0,
        explain:
          'With Proverbs 4:23 (out of the heart are the issues) and Psalm 141:3 (keep the door of my lips). Deciding what goes back out is a faithful spirit standing at the door of an answer, not a compliance task.',
      },
      {
        q: 'What did our own checking do to the article’s claim about tools starting disabled?',
        options: [
          'Softened it - the practice turned out to be rare',
          'Made it BIGGER - the specification itself names consent as a key principle and admits it cannot enforce it at the protocol level',
          'Refused it as unverified',
        ],
        answer: 1,
        explain:
          'The newsletter told it as one company’s design taste. The standard carries consent as one of four key principles and then says it cannot enforce them, and that implementors should. A house that starts everything disabled is doing what the standard says it cannot do for itself. Under-claiming a verified truth is also a failure (DR-0100).',
      },
      {
        q: 'What does this lesson say about the details of the company named in the newsletter?',
        options: [
          'That each one was read at the company’s own published account',
          'That its address would not resolve from our network, so every company detail is attributed to the newsletter and never asserted, with a dated re-review',
          'That a newsletter is citation enough',
        ],
        answer: 1,
        explain:
          'www.uber.com and modelcontextprotocol.io both failed to resolve from this session. The protocol specification WAS read at its own source and is quoted from there. A shut road must never read like a verified fact, so both facts are named in every reader place with re-review: 2026-11-27.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Isaiah 22:22 aloud before you say one word about any company or any computer. Then read Genesis 3:6 aloud. Then ask the room one question and wait: what is the difference between finding a thing and being given it? Do not answer it for them. The two verses have already answered it.

MINUTES 0 TO 8 - THE KEY. Isaiah 22:19-22, all four verses, and Revelation 3:7. Make the point about the shoulder - laid on him, by somebody with the right. Then count the four passive verbs out loud: called, clothed, strengthened, committed. He does none of them to himself.

MINUTES 8 TO 20 - THE TREE. Genesis 2:16-17, then Genesis 3:6. Land the thing most readings skip: the tree was in plain sight from the first day, so the serpent changed nothing about what she could SEE. Then read Genesis 3:6 as an inventory and say the three properties out loud. Then Joshua 7:21 - saw, coveted, took - and ask where a person can actually be stopped.

MINUTES 20 TO 30 - THE OWNER AND THE PORTER. Luke 12:42, 1 Corinthians 4:2, Matthew 25:15. Then John 10:1-3 and John 10:9-10. Give the porter his office back; most people have read that passage a hundred times and never noticed there is a man at the gate. Say it plainly: the climber CAN get in. Ability was never the question.

MINUTES 30 TO 40 - THE SHAPE OF A GRANT. Matthew 8:9 and Romans 13:1. Start with the first clause - a man UNDER authority. Then bring in the technical picture: a system where reading a record and changing a record carry different permissions though they sit side by side. Authority is a commission, and a commission is specific.

MINUTES 40 TO 50 - THE OUTBOUND GATE AND THE FINITE ROOM. Proverbs 4:23, Psalm 141:3, Proverbs 11:13, Proverbs 25:9-10. Then Mark 4:24, Luke 8:18, Psalm 101:3, Philippians 4:8. Here is where you say the verification note out loud and BEFORE any claim about the company: the protocol was read at its own source, the company's own account would not resolve from our network, re-review 2026-11-27. Then say what checking made BIGGER - the standard names consent and admits it cannot enforce it - because under-claiming a verified truth is also a failure.

MINUTES 50 TO 60 - THE JOINTS, THE KEYS, AND THE CLOSE. Ephesians 4:16, Colossians 2:19, Colossians 3:14, 1 Corinthians 13:2. Then Revelation 1:18 and Revelation 3:8. Then John 1:29, John 3:16, Hebrews 1:8, Colossians 1:17 - the One who holds the keys and did not have to find them. Give the three household actions, close with the talk-together directions, and send them back into Isaiah 22, Genesis 3 and John 10 in that order.

WHAT NOT TO DO. Do not turn this into a security seminar; the room does not need a threat model, it needs Genesis. Do not stage two schools of opinion about technology and let the room pick a side; teach the Word and work it (DR-0098). Do not hedge the verified part into nobody-knows - the specification says what it says, and we read it (DR-0100). And do not let one company detail out of your mouth before you have said that their own account would not open for us.`,
    talkingPoints: [
      `Two words, and they are not the same word: find, and give. The whole hour is the space between them.`,
      `The key in Isaiah 22:22 is LAID UPON HIS SHOULDER - a physical picture, chosen on purpose, of a thing received rather than taken.`,
      `Four verbs in Isaiah 22:20-21 and the steward performs none of them on himself: called, clothed, strengthened, committed.`,
      `The same key is held in Revelation 3:7 by the One it finally belongs to, and Job 12:14 states the reach of that hand without decoration.`,
      `The serpent never had to reveal the tree - it stood in the middle of the garden from the first day and was discoverable the whole time.`,
      `What he changed was not what she could SEE. He changed what she believed she was permitted.`,
      `Genesis 3:6 is an inventory: good for food, pleasant to the eyes, to be desired. Every one a property of the thing; not one of them a grant.`,
      `Achan names his own sequence in Joshua 7:21 - saw, coveted, took - and the only place to stop a man is between one and three.`,
      `A house that starts every discovered thing disabled has built its wall exactly in that gap. That is not a nicety; that is Genesis.`,
      `In Luke 12:42 the LORD makes the steward ruler. The servant never appoints himself, and 1 Corinthians 4:2 asks one thing of him afterward.`,
      `Matthew 25:15 hands out unequal portions on purpose - the owner decides the scope, and the scope is deliberate and right.`,
      `John 10:1 condemns the climber by his ROUTE, not his ability. He could get in. That was never the question.`,
      `There is a PORTER in John 10:3, and most of us have read that chapter a hundred times without noticing him.`,
      `The porter does not decide who the shepherd is; he opens to the one who already is, and the sheep are known by a voice, not a token.`,
      `The centurion begins with the authority ABOVE him, which is exactly why his word carries downward.`,
      `He could send a man and could not raise the dead. He knew the shape of his own grant, and Jesus called that great faith.`,
      `Proverbs 4:23 puts the diligence on the OUTBOUND side - out of the heart are the issues, the things that come out.`,
      `Psalm 141:3 asks for a posted watchman on the mouth, and Proverbs 11:13 names the two kinds of men at that door.`,
      `Proverbs 25:9-10 gives a rule even for the quarrel you are winning: argue your cause, and do not spend another man's secret to win it.`,
      `Mark 4:24 and Luke 8:18 both assume the room is finite - take heed WHAT ye hear, and HOW.`,
      `Say the blocked road BEFORE any company detail: their own account would not resolve from our network, re-review 2026-11-27.`,
      `Say what checking made BIGGER: the specification carries consent as one of four key principles and then admits it cannot enforce them at the protocol level.`,
      `Say the strengthened one too: the newsletter's "usually JSON-RPC 2.0" is a MUST in the specification itself.`,
      `And the correction: the specification names four roles where the article names three, and it places consent on the HOST, not the client.`,
      `The writer says the hard part is the connective tissue. Ephesians 4:16 said it about the body first - every joint supplieth.`,
      `Colossians 3:14 adds the part nobody can install, and 1 Corinthians 13:2 prices ability without it at nothing.`,
      `Revelation 3:8 is an open door no man can shut - permission from the one source a policy change cannot revoke.`,
      `The household action is bounded on purpose: write the list, then turn ONE thing off. A list with no action is a worry.`,
    ],
    discussionPrompts: [
      `What can you get into right now that nobody ever actually gave you? Not stole - just reached, because it was open.`,
      `Name one thing in your household that is turned on today because nobody ever decided to turn it off. Who would have had to decide?`,
      `Who laid a key on your shoulder, in any part of your life, and what changed in you the day you received it?`,
      `Where have you treated an accurate catalog as a grant - knowing a thing was within reach and acting as though that settled it?`,
      `Who is the porter in your house? If the answer is nobody, what would it take to put somebody at that gate?`,
      `What do you currently carry that you were never granted - and what is it costing you to hold it quietly?`,
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
console.log(`sov80: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov80: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov80: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov80: refusing to splice a lesson that fails the four-band ladder');
}

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov80: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov80: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov80: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov80: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov80: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov80: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov80: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov80: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov80: week ${WEEK} is already taken`);
if (after[after.length - 1] !== WEEK) throw new Error(`sov80: week ${WEEK} is not the top of the course after splicing`);
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov80: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov80: spliced ${ID}`);
console.log(`sov80: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov80: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
