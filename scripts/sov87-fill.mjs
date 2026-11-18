// =============================================================================
// sov87-fill - build Sovereign A.I. week 87 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456). Every quoted
// verse on this page is FILLED FROM app/public/bible/kjv at build time. The
// prose below holds only a reference in double brackets, [[Psalm 19:12]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory. The reference list on the module's
// anchor is DERIVED from the placeholders that actually occur in the reader
// places, so anchor.ref names every verse the lesson stands on and nothing it
// does not (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-11-09 at 21:50 UTC (3:50 PM CST) Darrell
// forwarded IT Brew's issue "Site unseen" (sent 15:01 UTC) out of his
// university mailbox, from his phone, into the lesson lane with ONE WORD typed
// above the forwarded header: Lesson. Gmail thread `1a1c24a55626cb1c`. The
// scheduled intake fell behind; this build drains that backlog on 2026-11-13.
// scripts/lesson-already-built.mjs --thread 1a1c24a55626cb1c: NOTHING FOUND.
//
// ONE TEACHING, ONE LESSON (DR-0610). sov81 (DR-1478) already took up the PHP
// news of the 12 November issue from its far end: a fix that was known and not
// applied. This lesson takes the 9 November LEAD STORY from its near end, which
// sov81 does not teach: the fault nobody saw for years, in a foundation nearly
// everyone stands on whether they know it or not, kept by very few hands. The
// patch-application point is referenced to week 81, never re-taught.
//
// WORD FIRST (DR-0127 / DR-0282). Psalm 19:12 (secret faults) and 2 Kings
// 12:5-6 (the breaches of the house, unrepaired in the twenty-third year) are
// laid before one word of the newsletter is spoken.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100 / DR-0076 section 8). The email held the
// lead story's opening paragraphs only; www.itbrew.com and www.php.net were
// refused from this session (curl: (56) CONNECT tunnel failed, response 403;
// control registry.npmjs.org answered 200). A web search's news summaries agree
// that PHP shipped security releases in October 2026 for two critical flaws
// found with the help of A.I. tools, but they credit more than one team of
// finders and do not confirm the 2014 date. So the finder, the date and the
// one-volunteer picture are told as the newsletter's account. re-review:
// 2026-11-27.
//
// MEASURED ON OUR OWN HOUSE (not painted), on origin/main fd36c00167b:
//   app/package.json                 11 dependencies, 17 devDependencies
//   app/package-lock.json            578 installed packages; 161 carry `funding`
//   git ls-files '*.php'             0
//   registry.npmjs.org, 2026-11-13   5 of the 11 shipped-by-name packages list
//        exactly one maintainer (libheif-js, libsodium-wrappers, phonemizer,
//        qrcode.react, xlsx); xlsx's newest registry release is 2022-03-24
//   scripts/dependency-audit-allowlist.json  xlsx: no fixed release on npm, the
//        project moved off npm, deferred with reReview 2026-12-05
//   .github/dependabot.yml:1-5       no automated eye on dependency CVEs before
//        the 2026-07-30 access evaluation
//   scripts/dependency-audit-guard.mjs:6-10  no npm audit in 95 workflows until
//        2026-11-05; first run 21 known (2 critical, 6 high), 8 cleared that hour
//   .github/workflows/ci.yml:155-158  the guard runs on every push
//   .github/workflows/exposure-report.yml:18  weekly ranking (Wed 14:17 UTC),
//        read live on the OpsBoard (app/src/components/OpsBoard.jsx:427)
//
// THE BANDS WERE WRITTEN BY HAND, NEVER BY A SCRIPT ON PROSE (DR-1306).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 87;
const ID = 'sov87-cleanse-thou-me-from-secret-faults';
const TITLE =
  'Cleanse thou me from secret faults - the flaw nobody saw in the ground everybody stands on, the breaches the keepers left standing, and the chest beside the altar';

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
  if (!m) throw new Error(`sov87: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov87: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov87: reference does not resolve in the corpus -> "${ref}"`);
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
    "WHAT WE DID NOT CHECK AT THE SOURCE. The email held the opening paragraphs of the lead story and nothing behind them. The full story lives at www.itbrew.com, and that address and the PHP project's own site, www.php.net, were both refused from our network. A web search's news summaries agree that PHP published security releases in October 2026 for two critical flaws found with the help of artificial-intelligence tools; but they credit more than one team of finders, and none of them confirmed the 2014 date. So who found the flaw, how long it had been there, and the picture of one volunteer keeping a project are the newsletter's account, told as such. What is said here about our own app was measured from its own files and, for the count of keepers, from the public package registry on the thirteenth of November. A shut road must never read like a verified fact. re-review: 2026-11-27.",
  child:
    'WHAT WE DID NOT CHECK. The email only had the start of the story. The rest was on a website called www.itbrew.com, and our computer could not open it. So some parts, like who found the hole and how old it was, are what the email said. We did not check them. The parts about our own app we did check, in the app itself. A closed door is not the same as a checked fact. We will try again. re-review: 2026-11-27.',
  youth:
    'WHAT WE DID NOT CHECK. The email only had the first part of the story. The rest is at www.itbrew.com, and our network could not open it, or the PHP website either. News summaries we found agree that PHP fixed two serious holes in October 2026, found with help from A.I. tools. But they name more than one group of finders, and none of them said 2014. So who found it and how old it was are what the newsletter said, not what we checked. What we said about our own app, we checked in its files. re-review: 2026-11-27.',
  teen: "WHAT WE DID NOT CHECK. Here is exactly what we read. We read the opening of the story in the email. The full story is at www.itbrew.com, and our network was refused there, and at the PHP site too. News summaries we found do agree on one thing: PHP fixed two serious holes in October 2026, found with help from A.I. tools. But they name more than one team, and none of them confirms 2014. So the finder, the date and the one-volunteer picture are the newsletter's account. What we said about our app, we checked in its files. re-review: 2026-11-27.",
  senior:
    "WHAT WE DID NOT CHECK AT THE SOURCE. The newsletter carried only the opening of its lead story, and the road behind it was shut: www.itbrew.com and the PHP project's own site were both refused from our network. News summaries found by a web search agree that PHP published security releases in October 2026 for two critical flaws found with the help of artificial-intelligence tools, but they credit more than one team of finders and none confirms the 2014 date. The finder, the date and the picture of a single volunteer keeper are therefore given as the newsletter's account. Everything said of our own app was measured from its files, and the count of keepers from the public package registry on the thirteenth of November. A shut road must never read like a verified fact. re-review: 2026-11-27.",
};

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit with one of your children today and ask them one open question - what is something you use every day that someone else takes care of, and who do you think that someone is - and listen all the way to the end before you add a single word; have them retell their own answer in their own words, then teach them one verse back, Psalm 19:12. Children, ask your mother, your father or a grandparent about a time something they trusted turned out to have a hidden crack - a car, a roof, a promise - and how it came to light; hear the whole of it before you reply, then retell their story back to them in your own words. Then ask a friend this: who keeps something we both depend on, and when did we last thank them. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one thing today - who takes care of the things we use every day - and listen all the way to the end before you talk; have them say it back to you in their own words, then teach them one verse, Psalm 19:12. Children, ask your mom or your dad or your grandma or your grandpa about a time something broke that they thought was strong. Let them tell the whole story. Then tell it back to them in your own words. Then ask a friend this: who is one helper we could say thank you to this week. Teach each other one verse. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is one thing at school or church that only works because one person keeps it going - and listen all the way to the end before you fix anything; have them retell the answer in their own words, then teach them one verse, 2 Kings 12:15. Children, ask your mom, your dad or a grandparent about a time a hidden problem was found in a house or a car, and who found it; hear the whole of it before you answer; then retell their answer in your own words. Then ask a friend this: what is one job everybody thinks somebody else is doing. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - which apps do you use every day, and do you know who keeps any of them running - and listen all the way to the end instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, John 4:38. Children, ask your mom, your dad or a grandparent about a fault in themselves someone else had to point out, and how they took it; hear all of it before you reply, then retell their answer in your own words. Then ask a friend this: will you tell me one thing about me that I cannot see. Teach each other one verse. ${RHYTHM} And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the young people in your house one open question today - what do you depend on that you have never once looked inside - and listen all the way to the end, without finishing a sentence for them; have them retell their own answer in their own words, then teach them one verse back, 2 Kings 12:6. Children, ask your parents or your grandparents about the quiet people who kept the church, the school or the town running when they were young, and what happened when one of them could not go on; hear the whole of it before you reply, then retell it back to them in your own words. Then ask a friend this: which keeper in our two families or our church is carrying something alone. Teach each other one verse. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson. The Word opens it, and no detail from the newsletter stands
// above that frame.
// -----------------------------------------------------------------------------
const LESSON = [
  `${TITLE.toUpperCase()}.

WHO SENT THIS, AND WHEN. On the ninth of November 2026, at ten minutes to four in the afternoon, Darrell forwarded a technology newsletter from his phone, out of his university mailbox, into this lane. Above the forwarded header he typed ONE WORD: Lesson. That word is the ask. The newsletter is only the occasion, and no article is the foundation of an hour in this course. The lane that should have built it that week fell behind, and it was built by hand from the backlog.

THE WORD FIRST, BEFORE ANY ARTICLE. David, who knew his own sins well enough to write them down, asks about the ones he cannot see: [[Psalm 19:12]] Then a king of Judah gives an order about the house everybody worshipped in: [[2 Kings 12:5]] And the record says what became of that order: [[2 Kings 12:6]] A fault nobody can see, and a house everybody uses that nobody repaired. Hold those two, and then hear the news.

WHAT THE NEWSLETTER HELD. The newsletter was IT Brew, a daily briefing for people who run computer systems, and its lead story carried the heading Site unseen. It reported that researchers working with an artificial-intelligence company found a zero-day flaw in PHP - the scripting language underneath a great share of the world's websites - and that the flaw had been there since 2014. A zero-day is a flaw found before the people who keep the software have a fix ready. The story then gave the view of the chief technology officer of Tenable, a security company: open source is everywhere, it is a building block of the modern technology stack, and nearly every company depends on it whether they know it or not. It added that many open-source projects are kept by a single volunteer or a small group, that this arrangement has held so far, and that artificial-intelligence tools have complicated the picture.

WHERE WEEK 81 STOPPED. Three days later the same newsletter came back to PHP, and week 81 of this course, What hast thou that thou didst not receive, took that news from its far end: a fix that was known and not applied. That lesson stands, and it is not repeated here. This week begins earlier, before any fix exists, with the fault nobody knew about at all, in a house nearly everybody uses and very few keep.`,

  `MOVEMENT ONE: SECRET FAULTS. Read Psalm 19:12 again slowly. David is not confessing a sin he knows. He is asking about the ones he does not know, and his first question has no human answer: who can understand his errors? Nobody can, fully. A fault can sit in plain sight for years, read past by everyone who looks, because nobody is looking for it. That is exactly what the newsletter describes: code that thousands of people have read, carrying a flaw that none of them saw.

David's remedy is not to look harder at himself on his own. It is to ask to be searched by Someone who sees what he cannot: [[Psalm 139:23]] [[Psalm 139:24]] Search me, try me, see. The prayer assumes there are things in us we will not find alone. A household and a software project are no different.`,

  `MOVEMENT TWO: WHAT IS HID COMES ABROAD. Jesus said something that every engineer eventually learns: [[Mark 4:22]] A hidden flaw does not stay hidden. It comes abroad. The only real question is who finds it first - the people who will fix it, or the people who will use it against others. And searching it out is honorable work: [[Proverbs 25:2]] The newsletter's account is that this flaw was found by researchers who reported it so that it could be fixed. That is the good ending, and the searchers deserve honor for it.

The newsletter also says that artificial-intelligence tools have complicated the picture, and that is plainly true: a tool that searches code faster than any person serves whoever holds it. This course has already taught that edge twice - week 71, that the tool that finds a hole is the tool that opens it, and week 80, that finding a door is not permission to walk through it - so it is only named here.`,

  `MOVEMENT THREE: WHETHER THEY KNOW IT OR NOT. Jesus told His disciples the truth about every harvest they would ever bring in: [[John 4:38]] Other men laboured. Every phone, every bank, every church website and every app stands on work its users never saw and its makers often never read. Isaiah tells Israel to do something about that: [[Isaiah 51:1]] Look unto the rock. Know what you were cut from and what you stand on. And the Psalm names what is at stake when nobody does: [[Psalm 11:3]]

OUR OWN HOUSE, MEASURED. The app you are reading this in names eleven packages of other people's code that it ships to your phone, and seventeen more that it uses only to build and test itself. Twenty-eight names. When those twenty-eight are installed, they bring the people they depend on, and those bring theirs: the app's own lock file lists five hundred and seventy-eight installed packages. For every package this house chose, about twenty came along that nobody here chose by name. That is not a scandal. It is how all modern software is built, and it is John 4:38 in a file. But it means the honest sentence for this house is the newsletter's sentence: we depend on far more than we have ever looked at. For the record, not one file in this app's code is written in PHP, so this particular flaw does not reach it. The lesson is not about PHP.`,

  `MOVEMENT FOUR: THE BREACHES NOBODY REPAIRED. Go back to 2 Kings 12 and read what happened between the order and the twenty-third year. King Jehoash had set up a plan: [[2 Kings 12:4]] The money came in. The repair was every priest's job, and so it was nobody's. Twenty-three years passed. Then the king asked the only question that mattered: [[2 Kings 12:7]] Nobody in that story is called wicked. The house simply had a breach that belonged to everybody and was owned by nobody, and so it stood open year after year while the worship went on inside.

Solomon names the danger of the opposite case, the one where the whole job sits on one person: [[Ecclesiastes 4:9]] [[Ecclesiastes 4:10]] That is the newsletter's picture of open source: a project the whole world uses, kept by one volunteer, with no one to lift him up if he falls.

OUR OWN HOUSE, MEASURED. Of the eleven packages this app ships by name, five listed exactly one person allowed to publish them on the public package registry when we checked on the thirteenth of November. One of those five is the package the app uses to read spreadsheets. Its newest release on that registry is from March 2022; its project moved off the registry, and a known flaw in the version published there has no fixed release there. This house's own record says so, gives the reason it is held for now - it is loaded only when a signed-in person chooses to upload a spreadsheet of their own - and sets a date to decide again: the fifth of December. A breach seen, named and dated. Not yet repaired.`,

  `MOVEMENT FIVE: WE DID NOT SEE EITHER. It would be easy to read this as a lesson about other people's software. It is first a lesson about ours. [[Lamentations 3:40]]

Searched honestly, this house's own record says that until the end of July 2026 nothing in it watched automatically for known flaws in the code it builds on. And until the fifth of November, no audit of its packages ran anywhere in the ninety-five automated jobs it had. The first time one did, it found twenty-one known vulnerabilities, two of them critical and six high. Eight were cleared within the hour. We were exactly the company the newsletter described: depending on it, whether we knew it or not.

Here is what changed. Every change to this app now runs an audit, and a serious known flaw turns the build red unless it has been deferred with a written reason and a date to decide again. Once a week a separate report ranks what an attacker would actually use, and the operations board reads that report live. And once a week a helper proposes updates to the packages, and none of those proposals merges without a person's hand. That is David's prayer turned into a habit: search me, and see.`,

  `MOVEMENT SIX: THE CHEST BESIDE THE ALTAR. Jehoash did not answer twenty-three years of neglect with a speech. He built a way for the repair to happen: [[2 Kings 12:9]] [[2 Kings 12:11]] The money went past everyone who was supposed to be responsible and straight to the people actually doing the work. And the record closes on the best sentence in the chapter: [[2 Kings 12:15]] They dealt faithfully, and so nobody needed to stand over them.

The principle is older than Jehoash and newer than Paul: [[1 Timothy 5:18]] [[Proverbs 3:27]] The keepers of the ground we stand on are labourers, and many of them are unpaid.

OUR OWN HOUSE, MEASURED. Of the five hundred and seventy-eight packages installed in this app, one hundred and sixty-one carry a note in the lock file asking those who use them for support. Nothing in this repository records that this house has given to any of them. Whether and how to set a chest beside the altar is a household decision about money, so it is set before Darrell as a question and not decided in a lesson.`,

  `MOVEMENT SEVEN: THE ONLY GROUND WITHOUT A SECRET FAULT. Bring it home. Every foundation built by human hands will one day show a fault, and Paul says the day will show it: [[1 Corinthians 3:13]] There is one foundation that will not: [[1 Corinthians 3:11]] Isaiah saw it coming: [[Isaiah 28:16]] A tried stone - tested, searched, and found without a crack. Peter names Him: [[1 Peter 1:19]] Without blemish and without spot: the only foundation in the world with no secret fault in it. And He is the One who sees all of ours: [[Hebrews 4:13]]

He is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]] Every other ground we stand on, we stand on gratefully and search humbly. On Him we stand without fear.`,

  `THREE THINGS THIS WEEK, and none of them needs a purchase.

One, name one thing you stand on and have never looked at. The free app the family calendar lives in, the church's website, the program that keeps the books. Find out who keeps it, and how you would hear if it broke.

Two, find one keeper and honor them. The volunteer who runs the sound board, the neighbor who fixes everyone's computer, the person who answers the church's email. Thank them by name, or ask what part of the load you could carry.

Three, pray Psalm 19:12 every morning this week, and ask one person you trust to tell you one fault of yours they can see and you cannot. Then thank them, and do not argue.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that open source is dangerous, that volunteers are careless, or that a household should live in fear of every hidden flaw. The keepers deserve honor, and the searchers too. The point is to know what you stand on, to search it humbly, and to carry your share of the keeping.`,

  BLOCKED.lesson,

  TALK.lesson,
];

// -----------------------------------------------------------------------------
// The four age bands. Each is an independent composition for its reader, not a
// re-registering of the adult text, and each carries the whole teaching, the
// shut road and the talk-together close (DR-0795).
// -----------------------------------------------------------------------------
const CHILD = `${TITLE}.

ONE BIG QUESTION. What if something we use every day has a crack in it, and no one can see it? That is what this lesson is about.

WHO SENT THIS. Darrell got an email about computers. He wrote one word on top of it. The word was Lesson. Then he sent it to us. That one word is why you are reading this.

THE WORD FIRST. King David wrote a prayer. Here is part of it. [[Psalm 19:12]]

Secret faults are wrong things we do not even know we do. David knew he could not see them all. So he asked Yahweh to make him clean.

Now a story from long ago. A king named Jehoash looked at the house where his people prayed. It had cracks and holes. He gave an order. [[2 Kings 12:5]] Fix every hole you find! But here is what the Bible says next. [[2 Kings 12:6]] Twenty-three years went by. The holes were still there!

So we have two things. A crack no one can see. And a house everyone uses that no one fixed.

THE EMAIL. The email came from a group called IT Brew. They write about computers for grown-ups. The story was about a hole in a computer program. The program is called PHP. Lots and lots of websites use it. The email said the hole had been there for years and years, since 2014. No one saw it. Then some helpers found it. They told the people who take care of PHP, so they could fix it.

A HOLE IS FOUND. Jesus said this. [[Mark 4:22]] Things that are hidden do come out. A hidden hole will be found one day. It is best if a helper finds it first. Finding it is good work. The Bible says looking hard for the truth is a thing kings do.

WHO MADE IT? Here is something to know. When you use an app, most of it was made by people you never met. Jesus told His friends this. [[John 4:38]] Other people did the hard work. We get to use it. That is a gift.

OUR APP. Our app is like that too. The people who make it picked twenty-eight parts made by other people. But those parts needed more parts. And those needed more. In the end, our app uses five hundred and seventy-eight parts! Most of them we did not pick by name. None of them are PHP, so this hole did not touch our app.

ONE HELPER ALONE. Some of these parts are kept by just one person. That is a lot for one person. The Bible says two are better than one. [[Ecclesiastes 4:10]] If one falls, who will help him up?

In our app, five of the parts we picked are kept by just one person each. One of them is a part that reads spreadsheets. It has a problem that has not been fixed. Our helpers wrote it down. They wrote why it is safe for now. And they picked a day to look at it again.

WE DID NOT SEE IT EITHER. Our app had holes it did not know about, too. For a long time, nothing was looking for them. Then one day a checker looked. It found twenty-one problems! Our helpers fixed eight of them that same hour. Now a checker looks every single time the app changes. That is like David's prayer. Search me. Show me.

THE BOX WITH A HOLE. Now back to King Jehoash. He did not yell. He did something smart. [[2 Kings 12:9]] A box with a hole in the top! People put money in it. Then the money went right to the workers who fixed the house. And those workers were good and honest. [[2 Kings 12:15]]

The people who keep our apps are workers too. Many of them work for free. One hundred and sixty-one of the parts in our app ask for help from the people who use them. Should our family help them? That is a big money question. So the question goes to Darrell, and he will decide.

A STORY TO HELP YOU THINK. This story is made up. It did not really happen.

Mia loved the tree house in her backyard. Every day she climbed up the ladder. Every day she played with her friends up there. She thought it was the strongest tree house in the world.

One day Grandpa came to visit. He said, Let us look at the tree house together. Mia said, Why? It is fine! Grandpa smiled. He said, Let us look anyway.

They looked at the ladder. It was fine. They looked at the walls. They were fine. Then Grandpa looked under the floor. He found a board that was cracked. You could not see it from the top. Only from under.

Grandpa fixed the board. Mia was glad. Then Mia asked, Who built this tree house, Grandpa? Grandpa said, Your dad built it, a long time ago, when you were a baby. Mia ran inside and gave her dad a big hug. She said, Thank you for my tree house.

The crack was hidden. Grandpa found it because he looked. And Mia found someone to thank.

JESUS HAS NO CRACKS. Everything people make can break. But Jesus never breaks. The Bible calls Him a lamb with no spot at all. [[1 Peter 1:19]] Jesus is the Lamb. [[John 1:29]] He can see every crack in us. And He makes us clean.

THREE THINGS THIS WEEK. One. Pick one thing you use every day. Ask who takes care of it. Two. Find a helper, like the person who fixes things at church. Say thank you. Three. Say David's prayer each morning. Ask Yahweh to show you what you cannot see.

WHAT NOT TO THINK. Do not be scared of hidden cracks. Do not think helpers are bad. Helpers are good. Just look, and fix, and say thank you.

ONE MORE THING TO REMEMBER. When someone shows you a crack in you, it can feel bad. But it is a gift. Say thank you. Then ask Yahweh to help you fix it.

${BLOCKED.child}

${TALK.child}`;

const YOUTH = `${TITLE}.

THE QUESTION. Almost everything you use was built on top of something else. What happens when the thing underneath has a crack nobody has seen? And who is supposed to fix it?

WHO SENT THIS. On November 9, Darrell forwarded an email about computers. He typed one word above it: Lesson. That word is why this lesson exists. The email was the reason, but it is not the foundation. The Word is.

THE WORD FIRST. King David knew a lot about his own sins. But he asked about the ones he could not see. [[Psalm 19:12]] Secret faults are the wrong things we do without knowing it.

Then there is a story about a king named Jehoash. The temple, the house where Israel worshipped, had holes and cracks in its walls. So he gave the priests an order. [[2 Kings 12:5]] Here is what happened. [[2 Kings 12:6]] Twenty-three years later, the cracks were still there.

So keep two ideas in mind. A fault nobody can see. And a house everybody uses that nobody fixed.

THE NEWSLETTER. The email was from IT Brew, a newsletter for people who work with computers. The main story was about PHP. PHP is a computer language that a huge number of websites are built with. The newsletter said that researchers working with an A.I. company found a hole in PHP. They said it had been there since 2014. It was a zero-day, which means it was found before anyone had a fix ready. A leader at a security company said open source code is everywhere, and almost every company depends on it, whether they know it or not. He said many open source projects are kept by just one volunteer or a small group.

WEEK 81 ALREADY TAUGHT THE NEXT PART. Week 81 of this class was about the same PHP news a few days later: the fix was ready, and some people did not put it on. We are not going to repeat that. This week is about what comes first, the crack nobody knew about.

SECRET FAULTS. Nobody can see all their own faults. That is why David prayed this. [[Psalm 139:23]] [[Psalm 139:24]] He asked Yahweh to search him. Code is like that too. Thousands of people can read the same code and miss the same mistake for years.

WHAT IS HIDDEN COMES OUT. Jesus said this. [[Mark 4:22]] A hidden flaw will be found sooner or later. The only question is who finds it first. Someone who wants to fix it, or someone who wants to use it to hurt people. Searching for the truth is honorable work. [[Proverbs 25:2]] This time, says the newsletter, the people who found it reported it so it could be fixed. Week 71 and week 80 of this class already talked about how A.I. tools can be used by both sides, so we will leave that there.

WE STAND ON OTHER PEOPLE'S WORK. Jesus told His disciples this. [[John 4:38]] Most of what we use was made by people we never met. That is a gift. But we should know what we are standing on. [[Isaiah 51:1]]

Here is our own app. The people who build it chose twenty-eight packages of other people's code by name. Eleven go into the app on your phone. Seventeen are only for building and testing. But each package needs other packages. When you add them all up, the app has five hundred and seventy-eight installed. So for every package we picked, about twenty more came along. None of our code is written in PHP, so this hole did not reach us. But the lesson still fits.

EVERYBODY'S JOB IS NOBODY'S JOB. Back to King Jehoash. The money came in to fix the temple. Every priest was supposed to fix it. So nobody did. The king finally asked them straight out. [[2 Kings 12:7]]

The opposite problem is when one person does it all. [[Ecclesiastes 4:9]] [[Ecclesiastes 4:10]] That is what the newsletter meant. A whole world uses some projects, and one person keeps them going.

In our app, five of the eleven packages we ship listed just one person who could publish them, when we checked on November 13. One of them reads spreadsheets. Its last release on that site was in March 2022. It has a known problem with no fix there. Our records say so, say why it is safe for now, and set a date to look again: December 5.

WE DID NOT SEE IT EITHER. [[Lamentations 3:40]] Our own records say that until the end of July 2026, nothing in our project watched for known holes in the code we build on. The first real check ran on November 5. It found twenty-one known problems. Two were critical and six were high. Eight were fixed that same hour. Now every change to the app runs a check. A serious problem stops the build unless someone writes down a reason and a date. That is David's prayer turned into a habit.

THE BOX WITH A HOLE IN THE LID. Jehoash did not just complain. He made a plan. [[2 Kings 12:9]] [[2 Kings 12:11]] The money went straight to the workers. And they were honest. [[2 Kings 12:15]]

The Bible says workers should be paid. [[1 Timothy 5:18]] In our app, one hundred and sixty-one packages ask the people who use them for support. Nothing in our project shows that we have given to any of them. That is a money decision for our family, so it goes to Darrell as a question.

A STORY TO THINK ABOUT. This story is made up to help you think. It did not really happen.

Jayden's church had a website. Every week it showed the time of youth group and the prayer list. Nobody really thought about who kept it running. It just worked.

One Sunday the website was gone. In its place was a page that said the web address had run out. Youth group that week had six kids instead of twenty. Half of them did not know the time had changed.

Jayden asked the pastor what happened. The pastor sighed. A man named Mr. Ortiz had kept the website for twelve years. He paid for it himself. He fixed it himself. Last month he moved to be near his daughter, and nobody knew the website was his job. The bill came to his old address.

Jayden and his dad offered to help. They got the website back in two days. Then they did one more thing. They wrote down every part of the website, who paid for it, and when the bill came. Two people now had the list, not one.

Then Jayden wrote Mr. Ortiz a letter. It said thank you for twelve years. Mr. Ortiz wrote back that it was the first thank you he had ever gotten for it.

Think about your own church, team or school. Who keeps things running that you never think about?

JESUS HAS NO HIDDEN FAULT. [[1 Corinthians 3:11]] Everything people build has cracks somewhere. Jesus is the only foundation with none. [[1 Peter 1:19]] He sees every fault in us. [[Hebrews 4:13]] Jesus is the Lamb, [[John 1:29]] the Eternal Son of Yahweh. [[John 3:16]]

THREE THINGS THIS WEEK. One, name one thing you use every day and find out who takes care of it. Two, find one helper at church or school and thank them by name. Three, pray Psalm 19:12 every morning, and ask one person you trust to tell you one fault they see in you.

WHAT NOT TO THINK. Open source is not bad, and volunteers are not careless. They deserve honor. The point is to know what you stand on, look carefully, and help carry the load.

${BLOCKED.youth}

${TALK.youth}`;

const TEEN = `${TITLE}.

THE PROBLEM. Every app on your phone is built on top of code somebody else wrote, and that code is built on more code. Most of it nobody checks. So what happens when there is a crack at the bottom that nobody has seen for years? And whose job is it to fix it?

WHO SENT THIS. On November 9, Darrell forwarded a newsletter about running computer systems. Above it he typed one word: Lesson. That word is the request. The newsletter gave us the topic, but the Word is the foundation we build on.

THE WORD FIRST. David wrote a lot of psalms about sins he knew he had committed. In this one he asks about the sins he does not know about. [[Psalm 19:12]] A secret fault is not one you are hiding. It is one that is hidden from you.

Then there is a story most people skip. King Jehoash noticed that the temple had broken places in its walls, and he told the priests to fix them with the money people gave. [[2 Kings 12:5]] Here is the next line in the record. [[2 Kings 12:6]] Twenty-three years, and nothing had been fixed.

Keep both of those in mind: a fault nobody can see, and a building everybody uses that nobody repaired.

THE NEWSLETTER. It was IT Brew, a newsletter for people who manage technology at work. Its lead story was about PHP, a programming language that runs a huge share of the world's websites. The newsletter said researchers working with an A.I. company found a zero-day in PHP, which is a security hole found before anyone has a fix. It said the hole had been there since 2014. Then it quoted the view of the chief technology officer of Tenable, a security company. In his view, open source is everywhere, and almost every company depends on it whether they know it or not. The story added that a lot of open source projects are kept by one volunteer or a small group, and that A.I. tools are making that harder.

WEEK 81 COVERED THE OTHER HALF. A few days later the same newsletter came back to PHP, and week 81 of this course taught that part: a fix that was ready and did not get installed. We are not going to repeat it. This lesson is about what comes before the fix, the hole nobody knew existed.

YOU CANNOT SEE YOUR OWN BLIND SPOTS. That is the whole point of Psalm 19:12. David's answer was not to stare harder at himself. It was to ask Yahweh to search him. [[Psalm 139:23]] [[Psalm 139:24]] Code works the same way. Thousands of developers can read the same lines for years and miss the same mistake, because nobody is looking for it.

IT WILL COME OUT. Jesus said this, and every security team learns it eventually. [[Mark 4:22]] A hidden flaw does not stay hidden forever. The real question is who finds it first: someone who reports it so it can be fixed, or someone who uses it to break in. Searching out a problem is honorable work. [[Proverbs 25:2]] According to the newsletter, this one was found by people who reported it, which is how it should go. Weeks 71 and 80 of this class already covered how A.I. tools that find holes can be used by either side, so we will just point there.

YOU STAND ON PEOPLE YOU HAVE NEVER MET. Jesus told His disciples this. [[John 4:38]] That is true of almost everything you use. It is not something to be ashamed of, but you should know it. [[Isaiah 51:1]] And here is why it matters. [[Psalm 11:3]]

We measured our own app. Its builders picked twenty-eight packages of outside code by name: eleven that ship to your phone and seventeen used only for building and testing. Every package depends on others, so when they are all installed, the total is five hundred and seventy-eight. That means about twenty packages came along for every one we picked. Our app has no PHP files at all, so this specific hole did not reach us. But the lesson is not really about PHP.

EVERYBODY'S JOB. Back to Jehoash. Every priest was responsible for repairs, so in practice nobody was. Finally the king called them in and asked them directly. [[2 Kings 12:7]] Nobody in that story is called evil. The job just had no owner.

The opposite problem is just as bad: one person holding the whole job. [[Ecclesiastes 4:9]] [[Ecclesiastes 4:10]] That is the newsletter's warning. Some projects the whole internet uses are kept by one person.

When we checked the public package registry on November 13, five of the eleven packages our app ships listed exactly one person allowed to publish them. One of those reads spreadsheets. Its newest release on that registry is from March 2022, and it has a known security problem with no fix there. Our project's records admit this, explain why it is held for now, and set a date to decide again: December 5.

WE MISSED IT TOO. [[Lamentations 3:40]] Our own records say that until the end of July 2026, nothing in the project automatically watched for known holes in the code it depends on. The first full audit of its packages ran on November 5. It found twenty-one known vulnerabilities: two critical and six high. Eight were cleared within the hour. Now every change runs that audit, and a serious problem fails the build unless someone writes a reason and a date. A weekly report ranks what an attacker would actually go after. That is Psalm 139 as a habit.

THE CHEST WITH A HOLE IN THE LID. Jehoash did not give a speech. He built a system. [[2 Kings 12:9]] [[2 Kings 12:11]] The money skipped the people who had dropped the job and went straight to the people doing it. And they were trusted, for a good reason. [[2 Kings 12:15]]

Scripture is clear that workers should be paid. [[1 Timothy 5:18]] In our app, one hundred and sixty-one installed packages carry a note asking users for support. Nothing in the project's records shows that we have ever given to one of them. That is a family money decision, so it goes to Darrell as a question, not a decision made in a lesson.

A STORY TO THINK ABOUT. This story is made up to help you think. It did not really happen.

Priya ran the group chat for her robotics team. She also kept the shared folder where the team stored their code. She did it because nobody else wanted to, and she was good at it.

Then she broke her wrist the week before the regional competition. She could not type for a month. The team opened the folder and found out nobody else knew the password. The newest version of the robot's code was on her laptop, and nobody had the latest copy.

They got through it. Priya talked them through everything over a video call, one painful step at a time. They placed fourth.

At the next meeting the coach did two things. First, he made three people responsible for the folder, not one. Second, he asked the team to stand up and thank Priya for two years of work none of them had noticed.

Priya said later that the second thing meant more to her than the first.

Think about what you depend on. Which group you are in only works because one person quietly carries it?

THE ONE FOUNDATION WITH NO CRACK. Every foundation people build will show its faults someday. [[1 Corinthians 3:13]] There is only one that will not. [[1 Corinthians 3:11]] [[1 Peter 1:19]] And He sees everything we cannot. [[Hebrews 4:13]] Jesus is the Lamb, [[John 1:29]] the Eternal Son of Yahweh. [[John 3:16]]

THREE THINGS THIS WEEK. One: name one app or service you use every day and find out who actually keeps it running. Two: find one person who quietly keeps something going at school, church or home, and thank them by name. Three: pray Psalm 19:12 each morning, and ask one person you trust to tell you one thing about you that you cannot see. Then do not argue with them.

WHAT NOT TO THINK. Open source is not dangerous, and volunteers are not careless. They deserve respect. The point is to know what you stand on, check it honestly, and help carry the load.

${BLOCKED.teen}

${TALK.teen}`;

const SENIOR = `${TITLE}.

AN OLD QUESTION IN A NEW MACHINE. Every generation has stood on work it did not do and walls it did not raise. The question this lesson asks is as old as the first house: what of the cracks we cannot see, and whose task is it to mend the walls everybody leans on?

WHO SENT THIS. On the ninth of November, late in the afternoon, Darrell forwarded a newsletter about the running of computer systems, sent from his telephone, and above it he typed a single word: Lesson. That word is the request. The newsletter is the occasion; the foundation is the Word.

THE WORD FIRST. David, who confessed his known sins plainly, also prayed about the ones he could not perceive. [[Psalm 19:12]] And the record of the kings preserves a lesson about a house that everybody worshipped in and nobody maintained. King Jehoash commanded the priests to mend it from the offerings. [[2 Kings 12:5]] The chronicle then reports, without comment, what came of his command. [[2 Kings 12:6]] A fault that cannot be seen; a house in common use that nobody repaired. Those two frame the hour.

THE NEWSLETTER. It was IT Brew, a daily briefing for those who manage technology in their organizations, and its lead story bore the heading Site unseen. It reported that researchers working with an artificial-intelligence company had discovered a zero-day flaw - one found before any remedy exists - in PHP, a programming language beneath a very large share of the world's websites, and that the flaw had been present since 2014. It then gave the view of the chief technology officer of the security firm Tenable: open source software is everywhere, a basic building block of modern computing, and a dependency for nearly every enterprise, whether it knows so or not. It added that many open-source projects are maintained by a single volunteer or a small group, an arrangement that has held thus far but that artificial-intelligence tools have complicated.

WHAT WEEK 81 ALREADY TAUGHT. Three days afterward the same newsletter returned to PHP, and the eighty-first week of this course, What hast thou that thou didst not receive, taught the far end of the matter: a remedy that was known and not applied. That teaching stands and is not repeated. This week concerns what precedes any remedy - the flaw nobody knew of at all.

FAULTS HIDDEN FROM OURSELVES. David's question in Psalm 19:12 has no human answer; nobody fully understands his own errors. His remedy was not closer self-examination alone but the searching of Another. [[Psalm 139:23]] [[Psalm 139:24]] The same is true of code. Thousands of capable people may read the same lines for a decade and pass the same mistake, because nobody is looking for it.

WHAT IS HID COMES ABROAD. [[Mark 4:22]] A concealed flaw does not remain concealed; the only question is whether the finder will mend it or exploit it. Searching out such matters is honorable. [[Proverbs 25:2]] By the newsletter's account, this flaw was found by researchers who reported it so it could be corrected. The double edge of machines that search faster than any person was taught in weeks 71 and 80 of this course, and is only named here.

STANDING ON THE LABOR OF OTHERS. [[John 4:38]] [[Isaiah 51:1]] Nothing is wrong with entering into other men's labours; it is the ordinary condition of every harvest. But we ought to know the rock we were hewn from. [[Psalm 11:3]]

We measured our own application. Its builders chose twenty-eight packages of outside code by name: eleven delivered to your device and seventeen used solely to build and test it. Each in turn depends upon others, so that, fully installed, the application carries five hundred and seventy-eight - about twenty for every one chosen. Not a single file of the application is written in PHP, so this particular flaw does not touch it; but the lesson was never about PHP.

THE BREACHES NOBODY REPAIRED. The repair of the temple was every priest's duty, and therefore no one's. After twenty-three years the king summoned them and asked the plain question. [[2 Kings 12:7]] No one in the account is called wicked; the breach merely belonged to all and was owned by none. The opposite peril is the solitary keeper. [[Ecclesiastes 4:9]] [[Ecclesiastes 4:10]] That is the newsletter's picture: a project the whole world uses, kept by one person with no one to lift him should he fall.

When we consulted the public package registry on the thirteenth of November, five of the eleven packages our application delivers listed exactly one person permitted to publish them. One of those reads spreadsheets; its newest release on that registry dates from March 2022, and a known flaw in it has no remedy there. The project's own record states this, explains why it is tolerated for the present - it is opened only when a signed-in member chooses to upload a spreadsheet of their own - and sets the fifth of December to decide again.

WE DID NOT SEE EITHER. [[Lamentations 3:40]] Searched honestly, our own record shows that until the end of July 2026 nothing in the project watched automatically for known flaws in its foundations, and that no audit of its packages ran until the fifth of November. The first audit found twenty-one known vulnerabilities, two critical and six high; eight were cleared within the hour. Every change now runs that audit, and a grave finding halts the build unless a written reason and a date accompany it. A weekly report ranks what an attacker would actually use, and a weekly helper proposes updates, none of which is merged without a person's hand.

THE CHEST BESIDE THE ALTAR. Jehoash answered twenty-three years of neglect not with reproach but with a provision. [[2 Kings 12:9]] [[2 Kings 12:11]] The offerings passed by those who had let the work lapse and went directly to the men performing it, and the closing sentence is among the finest in the chronicle. [[2 Kings 12:15]] [[1 Timothy 5:18]] [[Proverbs 3:27]] Of the five hundred and seventy-eight packages in our application, one hundred and sixty-one carry a request for support from those who use them, and nothing in the project's record shows that this household has given to any. Whether to set such a chest beside the altar is a decision about the family's money, and it is set before Darrell as a question rather than settled in a lesson.

WHAT A LIFETIME TEACHES ABOUT THIS. Many of us remember the quiet keepers of our churches and towns: the deacon who climbed into the furnace room every November, the woman who kept the books for forty years in a ledger only she could read, the neighbor who plowed every driveway on the road before he plowed his own. We seldom thanked them, because their work was most visible when it stopped. And we learned, often too late, that the faithful keeper was carrying more than anyone knew, and that when he could no longer climb the stairs there was nobody who knew where the shut-off valve was. The young will learn that same lesson with machines. We can spare them some of the cost by teaching it now: honor the keeper while he is still keeping, and stand beside him before he falls.

THE ONE FOUNDATION WITHOUT A FAULT. Every foundation laid by human hands will at last disclose its faults. [[1 Corinthians 3:13]] One will not. [[1 Corinthians 3:11]] [[Isaiah 28:16]] [[1 Peter 1:19]] And He sees all that we cannot. [[Hebrews 4:13]] Jesus is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever. [[Hebrews 1:8]]

THREE THINGS THIS WEEK. First, name one thing your household relies upon and has never looked into - the calendar the family shares, the church's website, the program that keeps the accounts - and learn who keeps it and how you would hear if it failed. Second, find one keeper and honor that person by name, or ask what part of the burden you might carry. Third, pray Psalm 19:12 each morning, and ask one trusted friend to tell you one fault of yours that you cannot see; then thank that friend without defending yourself.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Open source is not a danger, volunteers are not careless, and no household need live in dread of every hidden flaw. The keepers deserve honor, and so do the searchers. The point is to know what we stand on, to search it humbly, and to carry our share of the keeping.

${BLOCKED.senior}

${TALK.senior}`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `${TITLE.toUpperCase()}.

WHO SENT THIS. On the ninth of November 2026 at 21:50 UTC (3:50 in the afternoon, Central) Darrell forwarded IT Brew's issue Site unseen out of his university mailbox, from his phone, with ONE WORD typed above the forwarded header: Lesson. Gmail thread 1a1c24a55626cb1c. His word is the ask; the newsletter is the occasion. The lane fell behind, and it was built by hand from the backlog.

THE WORD FIRST. Psalm 19:12 opens the hour - who can understand his errors? cleanse thou me from secret faults - and 2 Kings 12:5-6 sets beside it the breaches of the house, still unrepaired in the twenty-third year of the king who ordered them mended. Then seven movements: secret faults and the prayer to be searched (Psalm 139:23-24); what is hid comes abroad, and searching out a matter is honorable (Mark 4:22; Proverbs 25:2); whether they know it or not (John 4:38; Isaiah 51:1; Psalm 11:3); everybody's job and the solitary keeper (2 Kings 12:4-7; Ecclesiastes 4:9-10); we did not see either (Lamentations 3:40); the chest beside the altar (2 Kings 12:9-15; 1 Timothy 5:18; Proverbs 3:27); and the only foundation without a secret fault, the Lamb without blemish (1 Corinthians 3:11-13; Isaiah 28:16; 1 Peter 1:19; Hebrews 4:13).

ONE TEACHING, NOT TWO. Week 81 already took the same PHP news from its far end - a fix known and not applied. This week takes the lead story from its near end, which week 81 does not teach: the fault nobody saw, in ground nearly everybody stands on, kept by very few hands.

OUR OWN HOUSE. Measured from its files: twenty-eight packages chosen by name (eleven shipped, seventeen to build and test) become five hundred and seventy-eight installed; one hundred and sixty-one of them ask their users for support, and nothing in the repository records any given; no PHP file in the app; five of the eleven shipped packages listed one publisher on the public registry on the thirteenth of November, and the spreadsheet reader's newest release there is from March 2022, held with a reason and a date; no automated eye on known flaws before late July, no package audit before the fifth of November, whose first run found twenty-one.

TRUST BUT VERIFY. The email held the lead story's opening only; www.itbrew.com and www.php.net were refused from our network. News summaries agree PHP shipped fixes for two critical A.I.-assisted finds in October 2026 but credit several finders and do not confirm 2014, so the finder, the date and the one-volunteer picture are the newsletter's account. re-review: 2026-11-27.

LEFT OUT ON PURPOSE. The sponsor's advertisement, the film piece, the procurement story, the word of the week and the linked reads are not taught.

PLACEMENT. Sovereign A.I., week 87, because a household that runs on its own machines has to know what those machines stand on, and who keeps it.`,
  inApp: `No new screens this week. One page in your Study, one honest look at what this app stands on, and one keeper to thank.

In the app: open Sovereign A.I. week 87 and read the band that fits the reader in front of you - the lesson carries all four, child, youth, teen and senior, and each holds the whole teaching. Use Search it out on Psalm 19 and 2 Kings 12 so David's prayer and Jehoash's chest sit side by side; the links come from the lesson's own references.

If you are one of the stewards, open the OpsBoard and find the exposure strip: it reads, live, the weekly ranking of known flaws in what this app ships - the habit Movement Five describes, on the board where you can see it.

Away from the app, two exercises. Name one thing your household stands on and has never looked at, and find out who keeps it. And pray Psalm 19:12 each morning for a week.`,
  anchor: {
    ref: 'FILLED FROM THE PLACEHOLDERS',
    theme: `[[Psalm 19:12]] [[2 Kings 12:6]] [[Psalm 139:23]] [[Mark 4:22]] [[John 4:38]] [[Ecclesiastes 4:10]] [[2 Kings 12:15]] [[1 Peter 1:19]]`,
  },
  rpe: {
    research: `RESEARCH. Three readings, and every one of them lands on your own house.

First, read 2 Kings 12:1-16 whole. Mark the order, the twenty-three years, the king's question, the chest, and the last verse about faithful workmen. Write one sentence on why a job that belonged to every priest was done by none.

Second, read Psalm 19:7-14 and Psalm 139:23-24. Ask: what in my life might be a secret fault, and whom have I asked to search me?

Third, read John 4:35-38 and Isaiah 51:1-2. List five things your household uses every week that other people labour to keep.

And one verification reading, because this course works this way. The newsletter carried only the opening of its story, and the full article would not open from our network. So the finder, the 2014 date and the one-volunteer picture are told as the newsletter's account. What is said about our app was measured from its files. Practice telling apart what was read, what is established, and what nobody checked.`,
    plan: `PLAN. Decide two measures before the week starts, and decide who hears them.

One: the ground list. Decide when you will sit down and list five things your household stands on - a service, an app, a volunteer, a program - and for each, who keeps it and how you would hear if it broke.

Two: the keeper. Name the one keeper you will thank this week, and how.

Then name the person who will ask you about both next week. A measure nobody asks about is a wish.

And decide what you will say to the young people in your house. The sentence is short: know what you stand on, and honor who keeps it.`,
    execute: `EXECUTE. Keep it for one week, out loud, with one other person.

Write the ground list on the day you named. Read it to the person asking you about it.

Thank the keeper you named, by name, and ask what part of the load you could carry.

Pray Psalm 19:12 every morning. Ask one trusted person to tell you one fault they can see in you. Thank them, and do not argue.

At the end of the week, answer three questions to the person who is asking. What did I find I was standing on without knowing it? Which keeper is carrying something alone? And what did I learn about myself that I could not see?

Measure the growth the Word's way - by the fruit, by the occasions, and by the days.`,
  },
  media: [],
  benefits: [
    `Darrell's one word, Lesson, over a technology newsletter, answered from the Word rather than from the article, and built by hand when the intake lane fell behind.`,
    `Psalm 19:12 laid down first: the fault we cannot see is named before any computer is mentioned.`,
    `2 Kings 12:5-6 set beside it: a house everybody used, a repair everybody owned, and twenty-three years of breaches.`,
    `One teaching, not two: the fix that was known and not applied is left to week 81; this hour takes the fault nobody knew of.`,
    `Psalm 139:23-24 taught as the remedy for blind spots: ask to be searched by the One who sees.`,
    `Mark 4:22 applied to hidden flaws: they come abroad, and the question is only who finds them first.`,
    `Proverbs 25:2 used to honor the searchers who find flaws and report them.`,
    `John 4:38 applied to modern software: other men laboured, and we have entered into their labours.`,
    `A measured figure instead of a painted one: twenty-eight packages chosen by name, five hundred and seventy-eight installed.`,
    `An honest scope: not one PHP file in this app, so the lesson does not pretend the flaw reached it.`,
    `2 Kings 12:7 taught plainly: a job that belongs to everybody is owned by nobody, and nobody in the story is called wicked.`,
    `Ecclesiastes 4:9-10 applied to the solitary keeper the newsletter describes.`,
    `Five of the eleven shipped packages listed one publisher on the public registry, measured with its date.`,
    `The spreadsheet reader's unfixed flaw told as this house's own record tells it: seen, named, held with a reason and a date.`,
    `Lamentations 3:40 applied to ourselves first: no audit ran until November, and the first found twenty-one known vulnerabilities.`,
    `The habit now in place shown plainly: an audit on every change, a weekly ranking read live on the OpsBoard, and updates that wait for a person's hand.`,
    `Jehoash's chest taught as a provision rather than a reproach: the money went straight to the people doing the work (2 Kings 12:9-15).`,
    `1 Timothy 5:18 and Proverbs 3:27 applied to unpaid keepers: one hundred and sixty-one of our packages ask for support.`,
    `A money question left with the one who governs it: whether to give is set before Darrell, not decided in a lesson.`,
    `Jesus confessed as the Lamb without blemish and without spot, the only foundation with no secret fault, the Eternal Son of Yahweh.`,
    `The newsletter told as the newsletter: the finder, the 2014 date and the one-volunteer picture kept as its account, with the shut road named and a dated re-review.`,
    `All four age bands carried from the first commit, each written for its own reader.`,
    `Three household actions that cost nothing: name what you stand on, honor one keeper, pray to be searched.`,
  ],
  stories: [
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The deacon and the furnace room',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. For twenty-six years a deacon named Walter went down to the church basement every first cold Sunday of the fall, before anyone else arrived, and lit the old boiler. He bled the radiators, checked the gauge, and climbed back upstairs before the first hymn. Nobody asked him to. Nobody thanked him, because nobody knew.

The year Walter's knees gave out, the first cold Sunday came and the sanctuary was forty-eight degrees. The congregation sat in their coats and wondered aloud why the heat was broken. It was not broken. Nobody had gone down to the basement.

The pastor called Walter that afternoon. Walter explained the whole routine over the phone, step by step, and then mentioned, almost in passing, that one of the pipe joints had been weeping for three winters and he had been keeping an eye on it.

The church fixed the joint that month. Then it did two more things. It wrote Walter's routine on a card and taped it to the boiler, and it put two younger men on the job with him for one season, so that he could teach them while he still could.

On the last Sunday of that winter, the pastor asked Walter to stand. He told the congregation where its heat had come from for twenty-six years. Walter said afterward that he had never been so embarrassed or so glad.`,
    },
    {
      kind: 'parable',
      tone: 'plain',
      title: 'The inspector under the porch',
      body: `ILLUSTRATIVE, NOT A REAL EVENT. A young couple bought their first house. It was old and solid and they loved it. Before they signed, the husband's father insisted they pay for an inspection, and the husband grumbled about the cost, because the house was obviously fine.

The inspector spent most of an hour in the crawl space. When he came out he showed them a photograph of a beam under the porch, soft with rot where a gutter had been emptying for years. From above, nothing showed. The porch felt perfectly sound.

The repair cost less than the inspection had. The seller paid for it.

Ten years later the husband's own son bought a house, and the husband paid for the inspection himself. His son asked why it mattered so much to him. He said that the worst faults in a house are the ones you cannot see from where you stand, and that he would rather pay a man to crawl under it than learn the truth by falling through it.`,
    },
  ],
  quiz: {
    questions: [
      {
        q: 'In Psalm 19:12, what does David ask to be cleansed from?',
        options: ['His enemies', 'Secret faults - errors he cannot see in himself', 'The faults of other people'],
        answer: 1,
        explain: 'David confessed his known sins plainly. Here he asks about the ones hidden from him, and admits nobody fully understands his own errors.',
      },
      {
        q: 'What had happened to the breaches of the house by the twenty-third year of King Jehoash (2 Kings 12:6)?',
        options: ['They had been repaired twice', 'They had not been repaired', 'The house had been torn down'],
        answer: 1,
        explain: 'The repair belonged to every priest, so in practice it belonged to none. Nobody in the story is called wicked; the job simply had no owner.',
      },
      {
        q: 'Why does this lesson not re-teach the PHP fix that was known and not applied?',
        options: [
          'Because it was not important',
          'Because week 81 already taught it; this week teaches the fault nobody knew about at all',
          'Because the newsletter did not mention PHP',
        ],
        answer: 1,
        explain:
          'One teaching, one lesson. Week 81, What hast thou that thou didst not receive, covered the unapplied fix; this hour begins before any fix exists.',
      },
      {
        q: 'What does Mark 4:22 teach about hidden flaws?',
        options: [
          'That they stay hidden if nobody looks',
          'That nothing hid shall stay hid; it comes abroad, and the question is who finds it first',
          'That only experts can find them',
        ],
        answer: 1,
        explain:
          'A flaw will be found. It is best found by someone who reports it so it can be mended, and Proverbs 25:2 calls searching out a matter honorable.',
      },
      {
        q: 'How many packages are installed in this app, and how many did its builders choose by name?',
        options: [
          'Twenty-eight installed, all chosen',
          'Five hundred and seventy-eight installed, twenty-eight chosen by name',
          'Eleven installed, eleven chosen',
        ],
        answer: 1,
        explain: 'Each chosen package brings the packages it depends on. About twenty came along for every one chosen - John 4:38 in a file.',
      },
      {
        q: 'Did the PHP flaw reach this app?',
        options: ['Yes, it was in every page', 'No - not one file of the app is written in PHP', 'Nobody can say'],
        answer: 1,
        explain: 'The lesson measures its scope honestly. It is not about PHP; it is about the ground every household stands on without looking.',
      },
      {
        q: 'What does Ecclesiastes 4:10 warn about?',
        options: ['Working too slowly', 'The one who is alone when he falls, with no one to help him up', 'Trusting strangers'],
        answer: 1,
        explain:
          'The newsletter describes projects the whole world uses that are kept by one volunteer. Five of the eleven packages this app ships listed one publisher when checked.',
      },
      {
        q: 'What did the first audit of this app’s packages find on the fifth of November?',
        options: ['Nothing', 'Twenty-one known vulnerabilities, two critical and six high; eight were cleared within the hour', 'One minor warning'],
        answer: 1,
        explain:
          'We did not see either (Lamentations 3:40). Now every change runs the audit, and a serious finding stops the build unless a reason and a date are written down.',
      },
      {
        q: 'What did Jehoash do about the twenty-three years of neglect (2 Kings 12:9-15)?',
        options: [
          'He dismissed every priest',
          'He set a chest with a hole in the lid beside the altar, and the money went straight to the workmen, who dealt faithfully',
          'He paid for the repairs himself and told no one',
        ],
        answer: 1,
        explain:
          'A provision, not a reproach. One hundred and sixty-one of our installed packages ask for support; whether to give is set before Darrell as a household money decision.',
      },
      {
        q: 'Why is Jesus the only foundation without a secret fault?',
        options: [
          'Because nobody has looked closely',
          'Because He is the tried stone, the Lamb without blemish and without spot, and nothing is hidden from His sight',
          'Because He is very old',
        ],
        answer: 1,
        explain: 'Isaiah 28:16, 1 Peter 1:19 and Hebrews 4:13. Every other foundation we stand on gratefully and search humbly; on Him we stand without fear.',
      },
    ],
  },
  facilitator: {
    howToRun: `SIXTY MINUTES, AND THE WORD OPENS IT. Read Psalm 19:12 aloud before you say one word about any computer. Then read 2 Kings 12:5-6 aloud. Then ask the room one question and wait: what do you depend on every day that you have never looked inside?

MINUTES 0 TO 8 - SECRET FAULTS. Psalm 19:12 and Psalm 139:23-24. Explain the difference between a fault you hide and a fault hidden from you.

MINUTES 8 TO 16 - THE NEWS, TOLD AS NEWS. The newsletter's lead story: a flaw found in PHP, reported as there since 2014. Explain zero-day in one sentence. Say plainly that week 81 already covered the fix that was known and not applied, and that this hour does not repeat it. Give the verification note: the full article would not open, and the finder and the date are the newsletter's account.

MINUTES 16 TO 24 - WHAT IS HID COMES ABROAD. Mark 4:22 and Proverbs 25:2. Honor the searchers who report what they find. Name weeks 71 and 80 for the double edge of A.I. tools, and move on.

MINUTES 24 TO 34 - WHETHER THEY KNOW IT OR NOT. John 4:38, Isaiah 51:1, Psalm 11:3. Give the measured figures: twenty-eight packages chosen, five hundred and seventy-eight installed, no PHP file in the app.

MINUTES 34 TO 44 - EVERYBODY'S JOB, AND THE ONE KEEPER. 2 Kings 12:4-7 read as a story; Ecclesiastes 4:9-10. Five of the eleven shipped packages listed one publisher; the spreadsheet reader held with a reason and a date. Then Lamentations 3:40: no audit until November, and twenty-one known on the first run.

MINUTES 44 TO 52 - THE CHEST. 2 Kings 12:9-15, 1 Timothy 5:18, Proverbs 3:27. One hundred and sixty-one packages ask for support; the giving question is set before Darrell.

MINUTES 52 TO 60 - THE FOUNDATION WITHOUT A FAULT. 1 Corinthians 3:11-13, Isaiah 28:16, 1 Peter 1:19, Hebrews 4:13, John 1:29, John 3:16, Hebrews 1:8. Give the three household actions and close with the talk-together directions.

WHAT NOT TO DO. Do not turn this into a technical seminar; the room needs the Word and one faithful habit. Do not stage open source against paid software and let the room pick a camp (DR-0098). Do not attribute to the newsletter anything its opening paragraphs did not contain. Do not re-teach week 81. And do not skip the keeper; thanking one person by name is the part people will remember.`,
    talkingPoints: [
      `Psalm 19:12: nobody fully understands his own errors; David asks to be cleansed from faults hidden from him.`,
      `2 Kings 12:6: the breaches stood for twenty-three years because the repair was everybody's job.`,
      `This hour does not re-teach week 81's unapplied fix; it begins before any fix exists.`,
      `Psalm 139:23-24: the remedy for blind spots is to be searched by the One who sees.`,
      `A zero-day is a flaw found before the keepers of the software have a fix ready.`,
      `The newsletter reports a PHP flaw present since 2014; the date and the finder are its account, not checked here.`,
      `Mark 4:22: what is hid comes abroad. The question is who finds it first.`,
      `Proverbs 25:2: searching out a matter is honorable; honor those who find flaws and report them.`,
      `John 4:38: other men laboured, and we have entered into their labours - the condition of all modern software.`,
      `Measured: twenty-eight packages chosen by name, five hundred and seventy-eight installed.`,
      `Measured: not one PHP file in this app; the lesson is about ground, not about PHP.`,
      `2 Kings 12:7: nobody is called wicked; the breach belonged to everybody and was owned by nobody.`,
      `Ecclesiastes 4:9-10: woe to him that is alone when he falleth - the solitary keeper.`,
      `Measured on the public registry: five of eleven shipped packages listed one publisher on 13 November.`,
      `The spreadsheet reader: newest registry release March 2022, a known flaw unfixed there, held with a reason and a December date.`,
      `Lamentations 3:40: we did not see either - no package audit until 5 November, and twenty-one known on the first run.`,
      `Now an audit runs on every change, a weekly ranking is read live on the OpsBoard, and no update merges without a person's hand.`,
      `2 Kings 12:9-15: the chest beside the altar sent the money straight to the workmen, and they dealt faithfully.`,
      `One hundred and sixty-one of our packages ask for support; whether to give is a household money decision set before Darrell.`,
      `1 Peter 1:19: the Lamb without blemish and without spot is the only foundation with no secret fault.`,
      `Jesus is the Lamb of Yahweh and the Eternal Son, whose throne is for ever (John 1:29; John 3:16; Hebrews 1:8).`,
    ],
    discussionPrompts: [
      `What do you depend on every day that you have never looked inside?`,
      `What job in your church or family belongs to everybody, and so is done by nobody?`,
      `Who is the quiet keeper in your life - the one whose work is noticed only when it stops?`,
      `When has someone shown you a fault you could not see? How did you take it?`,
      `What would a chest beside the altar look like for the keepers your household depends on?`,
      `Which of your own blind spots would you ask Yahweh to search this week?`,
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
console.log(`sov87: adult prose words ${adultWords} fk ${fk(filled.lesson).toFixed(2)}`);
for (const b of FOUR_BANDS) {
  console.log(
    `sov87: ${b} words ${words(filled.levels[b])} share ${(words(filled.levels[b]) / adultWords).toFixed(3)} fk ${fk(filled.levels[b]).toFixed(2)} overlap-adult ${overlapOf(filled.levels[b], filled.lesson).toFixed(3)}`
  );
}
for (let i = 0; i < FOUR_BANDS.length; i += 1) {
  for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
    console.log(`sov87: overlap ${FOUR_BANDS[i]}~${FOUR_BANDS[j]} ${overlapOf(filled.levels[FOUR_BANDS[i]], filled.levels[FOUR_BANDS[j]]).toFixed(3)}`);
  }
}
const faults = fourBandFaults(filled);
if (faults.length) {
  console.error(faults.join('\n'));
  throw new Error('sov87: refusing to splice a lesson that fails the four-band ladder');
}
if (process.argv.includes('--measure')) process.exit(0);

// -----------------------------------------------------------------------------
// Splice
// -----------------------------------------------------------------------------
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
let src2 = readFileSync(CATALOG, 'utf8');
let end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
if (end2 < 0) throw new Error('sov87: could not find the end of SOVEREIGN_AI_MODULES');

if (src2.includes(ID)) {
  if (!process.argv.includes('--rebuild')) throw new Error(`sov87: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const from = src2.indexOf(`  {\n    "id": "${ID}"`);
  if (from < 0) throw new Error('sov87: the id is in the file but not as a module literal; refusing to rebuild');
  const withComma = src2.indexOf('\n  },', from);
  const atArrayEnd = src2.indexOf('\n  }\n];', from);
  const ends = [
    withComma >= 0 && withComma < end2 ? { at: withComma, len: '\n  },'.length, back: 0 } : null,
    atArrayEnd >= 0 && atArrayEnd < end2 ? { at: atArrayEnd, len: '\n  }'.length, back: ','.length } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
  if (!ends.length) throw new Error('sov87: could not find the end of the existing block; refusing to rebuild');
  const { at: closeAt, len, back } = ends[0];
  const excised = src2.slice(from, closeAt + len);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov87: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  // from - 1 also takes the newline before the block, so a rebuild is byte-identical.
  src2 = src2.slice(0, from - 1 - back) + src2.slice(closeAt + len);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov87: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov87: the id survived the excision; refusing to rebuild');
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
if (after.length !== before.length + 1) throw new Error(`sov87: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov87: week ${WEEK} is already taken`);
if (!after.includes(WEEK)) throw new Error(`sov87: week ${WEEK} is not in the course after splicing`);
// Weeks below this one that are still in flight on sibling branches are not on
// this tree; the catalog test's HELD_IN_FLIGHT records them (DR-1501).
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov87: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov87: spliced ${ID}`);
console.log(`sov87: modules ${before.length} -> ${after.length}; top week ${after[after.length - 1]}`);
console.log(`sov87: ${refs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
