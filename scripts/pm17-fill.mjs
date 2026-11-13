// =============================================================================
// pm17-fill - build Project Management lesson 17 and splice it into the course
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456 / DR-1468). Every
// quoted verse on this page is FILLED FROM app/public/bible/kjv at build time.
// The prose below holds only a reference in double brackets, [[Amos 3:3]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory, so a quotation cannot drift from the
// text and cannot be approximate. The reference list on the module's anchor is
// DERIVED from the placeholders that actually occur in the reader places, so
// anchor.ref names every verse the lesson stands on and nothing it does not
// (DR-0734).
//
// WHERE THE WORD CAME FROM. On 2026-10-28 at 17:08 UTC Darrell forwarded a
// Supply Chain Connect send out of his university mailbox into the lesson lane.
// The SUBJECT of the forward is "AI is Testing the Limits of Chip Production",
// and the subject is not the ask. Above the forwarded header he typed one word
// - Lesson. - and then, by hand, he lifted ONE item out of the body and set it
// above everything else:
//
//     6 Steps to Better CFO-CPO Alignment
//     How procurement and finance can get on the same page about savings,
//     spending and financial results.
//
// That lift is the ask. The newsletter is the occasion only. Gmail thread
// `1a1837bf55922f04`. SIXTEEN DAYS stood between his word and this build, and
// the record keeps that gap rather than smoothing it. Both DR-1414 witnesses
// agreed the thread was unbuilt: no Lesson-Captured in the thread's own
// labelIds, and scripts/lesson-already-built.mjs returned NOTHING FOUND.
//
// WORD FIRST (DR-0127 / DR-0282 / DR-1326). The hour opens on Amos 3:3 - can
// two walk together, except they be agreed - and that question is fixed before
// one step of anybody's six is spoken. No figure, framework or step count from
// the send stands above it, and the Word is not decoration on the front of a
// procurement memo: the Word gave this discipline a worked case, with named
// officers and a named consequence, long before the industry gave the two
// offices initials.
//
// TRUST BUT VERIFY (DR-0190 / DR-0100). A newsletter is a LEAD, never the
// citation, and here the lead is thinner than usual and is said so plainly. THE
// ARTICLE WAS NEVER READ. The email carries the item's headline and its
// one-sentence blurb and nothing else - no steps, no numbers, no named
// research - and all three roads to the body were refused from this session's
// egress: endeavor.omeclk.com would not resolve (getaddrinfo ENOTFOUND), and
// www.supplychainconnect.com and www.sourcetoday.com both failed the proxy's
// CONNECT tunnel with 403. So NOT ONE of the six steps appears in this lesson,
// in any reader place, in any form. What the checking CHANGED, stated plainly
// both ways (DR-0100 section 5):
//   1. SMALLER, and it is the honest direction. The lesson I could have written
//      from the headline - here are six steps and here is a verse for each -
//      cannot be written, because the six steps are not in my hand. Nothing is
//      attributed to them. The one thing quoted from the send is quoted because
//      it is in the email itself, verbatim, and the email is the primary.
//   2. STRONGER, and it is the whole hour. The headline's own premise - that
//      the one who BUYS and the one who COUNTS have to be got onto the same
//      page - is not a modern management finding at all. It is in the Word with
//      officers named, with a dual-control procedure written down, and with the
//      reason given out loud: 2 Corinthians 8:21, providing for honest things
//      not only in the sight of the Lord but also in the sight of men. Checking
//      made the claim bigger than the article's framing, not smaller.
//   NOT CHECKED AT ALL, so silence is never mistaken for a check: the six steps
//   themselves, the chip-production claims in the forward's own subject line,
//   and every other item in that newsletter. None of them is taught here.
//   re-review: 2026-11-27.
//
// EVERY QUOTATION IS VERBATIM from app/public/bible/kjv, filled by this script
// and pinned under strict comparison in
// app/src/__tests__/project-management-pm17-verses.test.js, which derives its
// own book list from the module's own references rather than a typed list
// (DR-1467), reads EVERY string in the module rather than the reader places
// only, and handles the house's Psalm / Psalms spelling.
//
// Recorded as DR-1473.
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const COURSE = join(ROOT, 'app', 'src', 'lib', 'project-management-course.js');

const WEEK = 17;
const ID = 'pm17-can-two-walk-together';
const TITLE = 'Can two walk together - the buyer, the counter, and the agreement that comes first';

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
  if (!m) throw new Error(`pm17: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`pm17: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`pm17: reference does not resolve in the corpus -> "${ref}"`);
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
// The sentences EVERY reader place must carry, so a reader who reads only ONE
// band still gets the blocked road, its date, and all three directions (DR-0795).
// -----------------------------------------------------------------------------
const BLOCKED_ADULT =
  'WHAT WE COULD NOT CHECK AT THE SOURCE. The article behind that headline was never read. The email holds the headline and its one blurb and nothing more, and all three roads to the body were shut to us: the publisher link would not resolve at all, and the two publisher sites were refused by our network before a page was ever served. So not one of the six steps appears anywhere in this lesson, and nothing here is attributed to them. A shut road must never read like a verified fact. re-review: 2026-11-27.';

const BLOCKED_SENIOR =
  'WHAT WE COULD NOT CHECK AT THE SOURCE. We never read the article behind that headline. The email carried the headline and one sentence under it and nothing else, and every road we took to the rest of it was shut: one link would not resolve, and two publisher sites were refused by our network before a page was served. So none of the six steps is taught here, and nothing in this hour is laid at their door. A road we could not walk is never written up as a thing we checked. re-review: 2026-11-27.';

const BLOCKED_TEEN =
  'WHAT WE COULD NOT CHECK. We never got to read the article itself. The email had the headline and one sentence, and that was all of it. Every link we tried was blocked before a page loaded. So we do not teach the six steps here, and we do not say what is in them. A door we could not open is not a thing we checked. re-review: 2026-11-27.';

const BLOCKED_YOUTH =
  'WHAT WE COULD NOT CHECK. We never read the article. The email had the title and one line under it. That was all. Every link we tried was blocked. So we do not teach the six steps, and we do not say what they are. A door we could not open is not a thing we know. re-review: 2026-11-27.';

const BLOCKED_CHILD =
  'WHAT WE DID NOT GET TO READ. We did not read the story behind the title. The email had the title and one line. That was all of it. We tried the links. They did not work. So we do not say what the six steps are. We do not know. Saying we know would be a lie. re-review: 2026-11-27.';

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  "And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]";

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit down with one of your children today and ask them one open question - when you and I disagreed about money this month, what did you think I was actually protecting - and listen all the way to the end before you correct one word of it; have them retell their own answer in their own words, then teach them one verse back, Amos 3:3. Children, ask your mother, your father or a grandparent about a time two people they worked with wanted the same good thing and still fought over it, and what finally got the two of them agreed; hear the whole account before you answer, then retell their story back to them in your own words. Then ask a friend this: where are the two of us keeping two sets of numbers about the same one thing. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one question today: when we do not agree about money, what do you think I am trying to keep safe? Listen to the whole answer first. Then have them say it back in their own words, and teach them one verse, Amos 3:3. Children, ask your mom, your dad or a grandma about two grown-ups who wanted the same good thing and still had a fight about it. Listen to all of it. Then say their answer back in your own words. Then ask a friend this: do you and I ever count the same thing two ways? Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what do you think I am guarding when I say no to a thing you want - and let them finish before you answer; have them retell the answer in their own words, then teach them one verse, Proverbs 15:22. Children, ask your mom, your dad or a grandparent about two people at their work who wanted the same result and still pulled against each other, and what fixed it; hear all of it before you reply, then retell it in your own words. Then ask a friend this: where do the two of us keep two different counts of the same thing. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when we argue about a purchase, what do you believe each of us is actually measuring - and listen all the way through instead of answering it for them; have them retell their own answer back to you in their own words, then teach them one verse, 2 Corinthians 8:21. Children, ask your mom, your dad or a grandparent about a project where the person buying and the person paying were never agreed, what it cost, and how it ended; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: name one thing the two of us both care about and measure differently. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, sit with your grandchildren and ask them what they think you were guarding in the years you said no to things, and hear the whole answer before you offer a word of correction; then have them retell it in their own words and teach them one verse, Amos 3:3. Ask your own mother or father, where they are still living, how the two offices in their house or their trade were kept agreed, and who held the book. And tell a friend about one agreement you kept that cost you, ask them what it cost them to keep theirs, and pray one for another. ${RHYTHM} ${GROWTH}`,
};

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,

  bigIdea:
    "WHO TAUGHT THIS: NOBODY. No teacher, no recording, no Bible study. Gmail thread 1a1837bf55922f04 - a Supply Chain Connect send forwarded out of Darrell's university mailbox on 2026-10-28 at 17:08 UTC with one word typed above the forwarded header, Lesson., and then one item lifted by hand out of the body and set above everything else: 6 Steps to Better CFO-CPO Alignment, how procurement and finance can get on the same page about savings, spending and financial results. The subject line of the forward is about chip production and is NOT the ask; the lifted item is. Sixteen days stood between his word and this build. THE ARTICLE WAS NEVER READ, and that is said in every reader place: the email carries the headline and the one blurb and nothing else, and all three roads to the body were refused from this session - the publisher link would not resolve, and two publisher sites were refused by the network before a page was served. So not one of the six steps is taught here. What IS taught is the premise under the headline, tested against the Word and found older and larger than the framing: the one who buys and the one who counts have to be agreed BEFORE either of them can be right, and the Word says so with officers named, a dual-control procedure written down, and the reason given out loud. Can two walk together, except they be agreed. re-review: 2026-11-27.",

  anchor: {
    ref: '',
    theme:
      "THE AGREEMENT IS NOT THE LAST STEP. IT IS THE FIRST ONE.\n\nAmos asks it as a question with one obvious answer, and the obvious answer is the governing constraint on every project with two offices in it: two cannot walk together unless they are agreed. Not agreeable. Agreed. The verse does not ask whether they like each other, whether they report to the same person, or whether they have met. It asks whether the agreement exists, because walking together is downstream of it.\n\nThen the Word does what a management article cannot: it gives the worked case, with the officers named and the procedure written down. Exodus 38 puts the man who MADE the thing and the man who COUNTED the materials in the same passage, by name, each with his own office. 2 Kings 12 writes out an actual dual-control procedure over a chest of money - the king's scribe and the high priest counting it together - and then records the extraordinary consequence of that control: the workmen's accounts were not audited at all, because the men dealt faithfully. Acts 6 shows a complaint that was a NUMBERS complaint, answered not with a sermon but with an org chart and seven men of honest report. And 2 Corinthians 8 gives the reason the whole discipline exists, in the plainest sentence anybody has ever written about financial control: providing for honest things, not only in the sight of the Lord, but also in the sight of men.\n\nTwo offices, one house, one set of numbers, and the agreement standing in front of all of it. The industry's name for the gap is misalignment. The Word's name for the cure is older, and it is a question.",
  },

  inApp:
    "No new screens this week. What changes is one page you write by hand, and it takes about an hour. FIRST, write down the two offices in your own house - whoever decides what gets BOUGHT, and whoever decides what gets PAID and keeps the record. In a family that is often the same two people wearing different hats on different evenings; in a church it is frequently a trustee and a treasurer; on a rehab it is the person standing at the supply counter and the person reconciling the account. Name them, by name. SECOND, write the ONE number each of them is actually judged by. Not the number you wish they used - the one they really answer for. If one is judged by price obtained and the other by cash on hand at month end, you have found the misalignment without a consultant, because those two numbers can both improve while the house gets poorer. THIRD, write down where the two of them meet, how often, and who holds the book when they do. If the answer is nowhere, that is the whole finding. FOURTH, pick ONE purchase in the next thirty days and run it under 2 Kings 12:10 - two people see the money, together, and both set their hand to the count. Note what it cost in minutes. FIFTH, write the sentence from 2 Corinthians 8:21 at the top of the page and ask whether an outsider reading your record would call it honest in the sight of men, not only before Yahweh. If you cannot answer yes, you have next month's work. Bring the page to the person who handed you the project.",

  benefits: [
    "You get the question that finds the problem before the budget does: not 'are our two leaders getting along?' but 'what is the ONE number each of them is judged by, and can both of those numbers improve while the house gets poorer?' That second question is answerable in ten minutes and it is the whole diagnosis.",
    "You get a written dual-control procedure out of the Word rather than out of a policy template - two people see the money together and both set their hand to the count (2 Kings 12:10) - and you get the reason it is worth the minutes it costs, from a man who adopted it voluntarily for a collection he was already trusted with (2 Corinthians 8:20-21).",
    "You get the test for whether your controls are working, and it is a surprising one: the sign of a sound system in 2 Kings 12:15 is not more auditing but LESS - the workmen's accounts were not reckoned at all, because they dealt faithfully. Control at the gate buys trust downstream. Control everywhere buys suspicion everywhere.",
    "You get the right reading of a complaint about money. Acts 6:1 is a numbers complaint, and the apostles did not answer it with a sermon about contentment. They answered it with an org chart, a stated qualification, and seven named men. A distribution problem is a structure problem, and it is answered in structure.",
    "You get the one recorded case of procurement being told to STOP, and it is worth more than any sourcing strategy: in Exodus 36:5-7 the people brought MUCH MORE than enough, and the craftsmen themselves reported the surplus and the buying was restrained. The office closest to the material is the office that can see the over-buy first.",
    "You get a sober frame for the person who is both offices at once - which is most households and many small churches. Joseph was set over the gathering AND over the numbering (Genesis 41:35, 41:48-49), and the text records the day the numbering stopped because the quantity passed counting. One person holding both seats is not a sin; losing the count is where it goes wrong.",
    "You get the Resources named in their order - Wisdom builds the house, Understanding establishes it, Knowledge fills the chambers with riches (Proverbs 24:3-4) - so you stop treating a finance-versus-procurement argument as a personality problem and start treating it as a missing supply of the thing a house is actually built out of.",
    "You get a lesson that tells you plainly what it could not check. The article behind the forwarded headline was never read and all three roads to it were shut, so none of its six steps is taught here. You are never handed a shut road dressed as a verified fact, and the date we will try again is written down where you can hold us to it.",
  ],

  stories: [
    {
      kind: 'parable',
      tone: 'serious',
      title: 'The Two Ledgers',
      body:
        "A congregation set out to re-roof its fellowship hall, and it put two men over the work. Brother Hale was sent to the suppliers, because he could find a price nobody else could find. Brother Ames kept the books, because he had never in thirty years let an account go unreconciled.\n\nHale came back the first week delighted. He had bought the whole roof - every bundle of it - at a discount that would not come again, and he had bought it in one lot, which was where the discount lived. Ames wrote it down and said nothing, because the thing was already done.\n\nThe bundles sat in the side yard through a wet April. Some warped. The crew that was supposed to start in March started in June, because the money that would have paid their deposit had gone, all of it, into one lot of shingles in February. Ames had known in February that the deposit would be short. He had not been asked, and he had not volunteered, because he had learned that volunteering made him the man who said no.\n\nWhen it was all finished the elders asked what went wrong, and both men answered honestly and gave opposite answers. Hale said he had saved the church eleven hundred dollars. Ames said the delay had cost two thousand four hundred. Both numbers were correct. Each man had improved the only number he was judged by, and the house was poorer than if neither of them had tried.\n\nThe elders went looking for the man who had made the mistake, and there was not one. There were two men, each doing his own work well, who had never once been asked the same question in the same room.",
    },
    {
      kind: 'parable',
      tone: 'hopeful',
      title: 'The Chest With Two Hands On It',
      body:
        "The second year they did it differently, and the difference was small enough to describe in a sentence.\n\nBefore anything was bought, the two men sat down with the pastor and wrote one page. At the top of it they wrote the ONE number the church actually cared about: the hall dry and usable by the first Sunday in October, at the lowest total cost of getting there. Not the lowest price. The lowest total.\n\nThen they wrote their own numbers underneath, and looked at them side by side for the first time. Hale's was price per bundle. Ames's was cash on hand at month end. Written one above the other, it took about four seconds to see that both could improve while October slipped.\n\nSo they made a rule, and they took it out of 2 Kings. No money left the account unless the two of them were in the same room and both set a hand to the count. It cost them, in the end, about forty minutes a month.\n\nWhat it bought was stranger than they expected. Three months in, the pastor stopped asking either of them for an accounting. He had watched the rule run and he trusted the two men more, not less, because the control stood at the gate where the money moved rather than hovering over every man who touched it afterward. The crew was never audited at all. They did the work and were paid.\n\nThe hall was dry on the twenty-ninth of September. The thing that fixed it was not a better buyer and not a stricter bookkeeper. It was one page, one number both of them owned, and two hands on the chest.",
    },
  ],

  lesson: `CAN TWO WALK TOGETHER - THE BUYER, THE COUNTER, AND THE AGREEMENT THAT COMES FIRST.

WHO TAUGHT THIS: NOBODY. Say it plainly at the top, because this house does not let a lesson imply a teacher it never had. There was no Bible study, no recording and no speaker. On 2026-10-28 at 17:08 UTC Darrell forwarded a trade newsletter out of his university mailbox with one word typed above the forwarded header - Lesson. - and then lifted ONE item by hand out of the body and set it above everything else: 6 Steps to Better CFO-CPO Alignment, how procurement and finance can get on the same page about savings, spending and financial results. The forward's own subject line is about chip production. That is not the ask. The lifted item is the ask, and sixteen days stood between his word and this hour.

${BLOCKED_ADULT}

So nothing below comes from that article. What follows is the Word on the premise underneath it, and the premise turns out to be far older and far larger than six steps.

MOVEMENT ONE: THE AGREEMENT IS NOT THE LAST STEP, IT IS THE FIRST.

[[Amos 3:3]]

It is a question with one answer, and it is the governing constraint on every project that has two offices in it. Not "can two walk together if they are agreeable." Not "if they report to the same person." EXCEPT THEY BE AGREED. Walking together is downstream of the agreement, and every attempt to produce the walking without first producing the agreement is an attempt to run a river uphill.

Hear what sits beside it. [[Psalms 133:1]] Good AND pleasant - two separate claims, and most houses chase the second and never get the first. And the plainest statement of why two is better than one is not sentiment, it is arithmetic about failure: [[Ecclesiastes 4:9]] [[Ecclesiastes 4:10]] Woe to him that is alone when he falleth. The second man is not there for company. He is there for the fall.

Then the mechanism, named: [[Proverbs 15:22]] Without counsel, purposes are DISAPPOINTED - the word is about an expectation that does not arrive. And [[Proverbs 11:14]] Where no counsel is, the people fall. Two verses, one point: the agreement is not a courtesy extended to the other office. It is load-bearing.

MOVEMENT TWO: THE MAN WHO MADE IT AND THE MAN WHO COUNTED IT, IN THE SAME PASSAGE, BY NAME.

The tabernacle is the best-documented project in Scripture, and when the Word reports on it, it does something a management article almost never does: it names the two offices separately and tells you who held each.

[[Exodus 38:21]] This is the SUM. Counted. And counted by a named officer, Ithamar, operating under Moses. Then, in the very next breath, the other office: [[Exodus 38:22]] Bezaleel MADE. Ithamar COUNTED. Two men, two offices, one project, one passage - and the text treats both as worth recording by name.

Then the account itself, to the shekel: [[Exodus 38:24]] That is a procurement record. Materials received, quantity stated, standard of measure named - after the shekel of the sanctuary, which is the agreed unit both offices use, because a number means nothing until the two sides measure in the same thing.

AND THEN THE PASSAGE EVERY BUYER SHOULD KNOW BY HEART. It is the one recorded case in Scripture of procurement being told to stop, and the people who raised the alarm were the craftsmen - the office standing closest to the material: [[Exodus 36:5]] [[Exodus 36:6]] [[Exodus 36:7]] Restrained from bringing. The supply exceeded the need, the men doing the work could see it before anyone upstairs could, they SAID SO, and a proclamation went out. Over-buying is not generosity and the office nearest the material sees it first.

MOVEMENT THREE: ONE CHEST, TWO HANDS ON IT.

2 Kings 12 is a written dual-control procedure, and it is worth reading slowly because it is more specific than most modern policies.

[[2 Kings 12:9]] A chest with a hole bored in the lid, set beside the altar, kept by the priests who kept the door. The money goes in where it cannot come back out, and the keepers of the door are the keepers of the box.

Then the count: [[2 Kings 12:10]] CAME UP - both of them, together, to the same money, at the same time. The king's scribe is the king's man. The high priest is the house's man. Neither counts alone. That is dual control, written down, centuries before anybody wrote a controls framework, and the second chronicle of the same event records the same two offices doing the same thing at the chest. [[2 Chronicles 24:11]]

Then the disbursement: [[2 Kings 12:11]] Told the money, then delivered it into the hand of the doers. Counted first, released second, into named hands.

AND NOW THE VERSE THAT TURNS EVERY ASSUMPTION ABOUT CONTROL AROUND. [[2 Kings 12:15]] They reckoned NOT. The workmen's accounts were not audited at all. Not because the house was careless - the house had just demonstrated the tightest money control in the Old Testament - but because the control stood AT THE GATE where the money moved, and faithful men downstream were trusted. This is the opposite of what a frightened organization does. A frightened organization audits everybody a little and nobody properly. The Word's pattern is: two hands at the chest, and trust past it.

MOVEMENT FOUR: HONEST IN THE SIGHT OF MEN, AND NOT ONLY BEFORE YAHWEH.

Paul was carrying a collection for the saints. He was an apostle. Nobody had accused him of anything. And he built himself a control anyway, and wrote down his reason.

[[2 Corinthians 8:20]] [[2 Corinthians 8:21]]

AVOIDING THIS. He arranged his affairs so that a particular accusation would be impossible, not merely false. And then the sentence that should hang in every church office and over every family budget: providing for honest things, not only in the sight of the Lord, but also in the sight of men. Two audiences, both named, and the second one is not vanity. A man whose books are right before Yahweh and unreadable to his brethren has solved half the problem and left the half that splits congregations.

This is the answer to the question every tired treasurer asks: why go to the trouble when everyone here is honest? Because honesty that cannot be SEEN does not do the work that honesty is supposed to do.

MOVEMENT FIVE: THE COMPLAINT WAS ABOUT NUMBERS, AND THE ANSWER WAS AN ORG CHART.

[[Acts 6:1]]

Read what the complaint actually was. Not doctrine. Not worship. The daily ministration - the distribution - and a group of widows being overlooked in it. That is a logistics failure and an accounting failure, inside the healthiest congregation that has ever existed, in the middle of explosive growth.

Now read the answer. [[Acts 6:2]] [[Acts 6:3]] They did not preach contentment at the complainers. They did not tell the Hellenists to have more faith. They said, in effect: this is real, it is ours, it is not our seat, and the house needs an office for it. Then they set a QUALIFICATION - of honest report, full of the Holy Ghost and wisdom - and they appointed seven men, named one by one. [[Acts 6:5]]

A distribution problem is a structure problem. It is answered in structure, by people of stated character, publicly named. And the character requirement came first.

MOVEMENT SIX: THE MAN WHO HELD BOTH SEATS, AND THE DAY THE COUNTING STOPPED.

Most households and many small churches do not have two officers. They have one person doing both jobs on different evenings. The Word has that case too, and it is handled with care.

[[Genesis 41:33]] [[Genesis 41:34]] [[Genesis 41:35]] Gather, lay up, KEEP. Three verbs, one office, and the gathering and the keeping are deliberately joined in one man's hand. Then the execution: [[Genesis 41:48]]

And then a sentence most readers slide past: [[Genesis 41:49]] UNTIL HE LEFT NUMBERING. The quantity outgrew the count. The Word does not scold him for it - the famine came, the stores held, the plan worked - but it records the moment precisely, and that precision is the warning. One person holding both seats is not a sin. Losing the count is where it goes wrong, and it goes wrong quietly, at the exact moment things are going well.

So if you hold both seats: set the moment you would stop counting, before you reach it, and hand the book to someone else at that line.

MOVEMENT SEVEN: THE RESOURCES THAT ACTUALLY BUILD A HOUSE.

[[Proverbs 24:3]] [[Proverbs 24:4]]

Read the order, because it is a sequence and not a list. Wisdom BUILDS. Understanding ESTABLISHES. Knowledge FILLS the chambers with all precious and pleasant riches. These are the Resources Yahweh supplies for a build - not soft skills somebody happens to have - and a quarrel between the office that buys and the office that counts is almost never a personality problem. It is a house short of one of the three.

And the standing instruction to the man responsible for the assets: [[Proverbs 27:23]] [[Proverbs 27:24]] Be diligent to KNOW THE STATE. Riches are not for ever. The verse assumes the state is knowable and that knowing it is your job, which is the oldest argument for a current, accurate record that anybody has ever made.

Then the one that reframes a turf fight in a sentence: [[Proverbs 13:10]] Only by pride cometh contention. Two offices contending over the same house - look for the pride before you look for the process.

MOVEMENT EIGHT: THE BODY DOES NOT GET TO SAY THAT.

[[1 Corinthians 12:21]]

The eye cannot say to the hand, I have no need of thee. The buyer cannot say it to the bookkeeper and the bookkeeper cannot say it to the buyer, and neither can say it to the crew. And the instruction for how two offices actually look at one project: [[Philippians 2:4]] Look not every man on his own things. That is the cure for two leaders each optimising the only number he is measured by.

And the thing without which the whole structure is noise: [[1 Corinthians 13:2]] Though I have all knowledge - all of it, the whole ledger, every price in the market - and have not charity, I am NOTHING. The agreement this hour is about is not merely procedural. Two people can be perfectly reconciled in their reporting and have no love between them, and the Word says the books being right will not save that.

MOVEMENT NINE: WHOSE MONEY IT IS.

All of it rests on one fact that settles who is actually CFO here.

[[Haggai 2:8]] The silver is Mine, and the gold is Mine. And David, standing over the largest building fund in Scripture, says the only honest thing anybody has ever said over a budget: [[1 Chronicles 29:14]] [[1 Chronicles 29:16]] Of Thine own have we given Thee. Every purchase order in your house is a steward moving Yahweh's property between two of His own accounts.

Which makes the standard what it is: [[Luke 16:10]] And the reckoning certain: [[Matthew 25:19]] After a long time the lord of those servants cometh, and reckoneth with them.

And the One we answer to is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] addressed by the Father as God with a throne for ever, [[Hebrews 1:8]] and the One by whom the whole of it holds together. [[Colossians 1:17]]

THIS WEEK, THREE THINGS.

One, the two names. Write down who decides what gets bought in your house and who keeps the record, by name. If it is one person twice, write the name twice and set your stop-counting line now, before you reach it.

Two, the two numbers. Write the ONE number each of them is judged by, one above the other. If both can improve while the house gets poorer, you have found it, and you found it without a consultant.

Three, the two hands. Pick one purchase in the next thirty days and run it under 2 Kings 12:10 - both of you present, both hands on the count. Then do the harder half and let it buy trust downstream the way verse 15 did: control at the gate, and faithful men past it, not suspicion everywhere.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that the person who buys is reckless and the person who counts is righteous. The Word honours both offices by name in the same passage and records the craftsmen - the BUYERS' side - as the ones who caught the over-supply first. [[1 Corinthians 14:40]] Let all things be done decently and in order. Order is not the enemy of generosity; it is how generosity arrives where it was sent.

${TALK.lesson}`,

  levels: {
    child: `CAN TWO WALK TOGETHER - THE BUYER, THE COUNTER, AND THE AGREEMENT THAT COMES FIRST.

Nobody taught this one. No class. No teacher. Darrell got an email. He typed one word on it. The word was Lesson. Then he picked one thing out of the email and put it on top. It was about two jobs in a company. One job buys things. One job counts the money.

${BLOCKED_CHILD}

So we will look at the Word instead. The Word has a lot to say about this.

FIRST. TWO PEOPLE HAVE TO AGREE FIRST.

Here is the question. [[Amos 3:3]]

Can two walk together if they do not agree? No. They cannot. One goes this way. One goes that way. They are not walking together at all.

So the agreeing comes first. Not last. First.

The Word says it is good when people get along. [[Psalms 133:1]]

SECOND. TWO JOBS. BOTH GOOD.

Yahweh had a tent built for Him. Two men helped. One man made things. His name was Bezaleel. [[Exodus 38:22]]

One man counted things. His name was Ithamar. [[Exodus 38:21]]

Look at that. One makes. One counts. Both names are in the Word. Both jobs matter.

Stop and think about that. Bezaleel was good with his hands. He could cut wood. He could bend gold. Ithamar was good with numbers. He wrote down what came in. Which one was more important? Neither one. The Word wrote down both names.

Sometimes we think the one who makes things is the real worker. We think the one who counts is just slow. That is not true. A house needs both of them.

THIRD. THE DAY THEY HAD TOO MUCH.

Something funny happened. The people kept bringing stuff. They brought too much!

The workers told Moses. They said: stop. We have plenty. [[Exodus 36:5]]

So Moses told everyone to stop bringing. [[Exodus 36:6]]

They had more than enough. [[Exodus 36:7]]

The workers saw it first. They were closest to the pile. That is why they could see.

Here is a thing to remember. Too much is a problem too. We think only too little is a problem. But if you buy too much, the money is gone. And the extra just sits there in the rain. The workers knew. So they said so. That was brave, and it was right.

FOURTH. TWO HANDS ON THE BOX.

A king fixed up Yahweh's house. They needed money. So a man made a box with a hole in the lid. [[2 Kings 12:9]]

People put money in the hole.

Now here is the good part. When they counted the money, TWO men came. Not one. Two. [[2 Kings 12:10]]

Two men. Same money. Same time. Both of them saw it. That way nobody has to wonder.

Then they gave the money to the workers. [[2 Kings 12:11]]

And then the Word says something that will surprise you. They did NOT check up on the workers. [[2 Kings 12:15]]

Why not? Because the workers were honest men. The careful part was at the box. After that, they trusted.

FIFTH. DO IT RIGHT SO PEOPLE CAN SEE.

Paul carried money for poor people. Paul was a good man. Nobody said he stole. But he was careful anyway. [[2 Corinthians 8:20]]

He wanted it right two ways. [[2 Corinthians 8:21]]

Right in front of Yahweh. And right where people can see. Both.

Think about your own room. If you say you cleaned it, that is one thing. If somebody can walk in and SEE that it is clean, that is better. Paul wanted both. He wanted Yahweh to see it was right. He wanted people to see it was right too.

That is not showing off. That is kind. It means nobody has to wonder about you.

SIXTH. SOME PEOPLE GOT LEFT OUT.

In the early church, food was given out every day. Some widows got missed. [[Acts 6:1]]

That is a counting problem. So what did they do?

They did not just say "be happy." They picked seven good men to do that job. [[Acts 6:3]]

Good men. Named out loud. Given the job.

Look at the kind of men they picked. Men that people trusted. Men full of the Holy Spirit. Men who were wise. They did not pick the fastest men. They picked good men. Who you are comes first. The job comes second.

SEVENTH. JOSEPH DID BOTH JOBS.

Sometimes one person does both jobs. Joseph did. He gathered the grain AND he counted it. [[Genesis 41:48]]

Then one day there was so much grain he stopped counting. [[Genesis 41:49]]

That is a warning. If you do both jobs, watch out. It is easy to stop counting when things go well.

EIGHTH. HOW A HOUSE GETS BUILT.

[[Proverbs 24:3]]

[[Proverbs 24:4]]

Wisdom builds it. Understanding makes it stand. Knowledge fills it up. Those are gifts from Yahweh.

And a farmer is told to know his animals. [[Proverbs 27:23]]

Know what you have. That is your job.

Two people are better than one. The Word says it plainly. [[Ecclesiastes 4:9]]

And here is why. [[Ecclesiastes 4:10]]

If one falls down, the other one helps him up. That is why Yahweh gives us each other. The second person is not there to be nice. He is there for the day you fall.

And plans need help too. [[Proverbs 15:22]]

When nobody talks it over, the plan falls apart. When many people help, it stands up.

NINTH. WHOSE MONEY IS IT?

Here is the real answer. [[Haggai 2:8]]

The silver is His. The gold is His. All of it.

King David said it best. [[1 Chronicles 29:14]]

We give Him what was already His.

So think about money a new way. When you buy something, you are not spending your own money. You are taking care of His money. That is a bigger job. It is also an easier one. You do not have to guard it alone.

And Jesus is the Lamb of Yahweh. [[John 1:29]] He is the Son. [[John 3:16]] Everything holds together in Him. [[Colossians 1:17]]

THREE THINGS TO DO.

One. Find out who buys things in your house. Find out who keeps the money.

Two. Ask them what they each care about most.

Three. Next time money is counted, ask if two people can watch.

${TALK.child}`,

    youth: `CAN TWO WALK TOGETHER - THE BUYER, THE COUNTER, AND THE AGREEMENT THAT COMES FIRST.

Nobody taught this lesson. There was no class and no teacher. Darrell got a work email on 2026-10-28. He typed one word over it: Lesson. Then he pulled one item out of it and put it on top - an article about two jobs in a company. One job buys the things the company needs. The other job counts the money and keeps the record. The article said those two need to get on the same page.

${BLOCKED_YOUTH}

So we go to the Word. The Word knew about this long before anybody wrote an article.

ONE. AGREEING COMES FIRST.

[[Amos 3:3]]

It is a question, and the answer is no. Two people cannot walk together unless they have already agreed. The agreeing is not the last step. It is the first one. Everything else comes after it.

And it is good when people do get along. [[Psalms 133:1]]

Also, two is better than one for a plain reason. [[Ecclesiastes 4:10]] If one falls, the other picks him up. The second person is not there to keep you company. He is there for the fall.

TWO. TWO JOBS, BOTH NAMED IN THE WORD.

When Yahweh had His tent built, the Word names two men with two different jobs.

One man counted all the materials. [[Exodus 38:21]]

One man made the things. [[Exodus 38:22]]

One makes. One counts. The Word writes down both names. Neither job is the small one.

Stop on that for a second. Bezaleel worked with his hands. He could cut, carve and set stone. Ithamar worked with a record. He wrote down what came in and what it weighed. Most houses quietly decide that one of those two is the real job and the other one is paperwork. The Word did not do that. It wrote both names down, in two verses that sit right next to each other.

And here is the record of what came in. [[Exodus 38:24]] Weighed by one agreed standard. A number means nothing until both sides measure the same way.

THREE. THE TIME THERE WAS TOO MUCH.

This is the one time in the Word that buying gets stopped.

People kept bringing gifts. The workers went to Moses and said there is too much. [[Exodus 36:5]]

So Moses had it announced. Stop bringing. [[Exodus 36:6]] They already had more than enough. [[Exodus 36:7]]

Notice who spotted it. The workers. They were closest to the pile, so they saw it first.

There is a lesson in that for anybody who buys things. We usually think the only money mistake is buying too little. Buying too much is a mistake too, and it is a quieter one. The money is gone, and what you have is a pile in the yard. The people handling the pile see it first, which is why you ask the crew and not the committee.

FOUR. TWO HANDS ON THE CHEST.

A king was repairing Yahweh's house and needed money. A chest was made with a hole bored in the lid. [[2 Kings 12:9]]

Then watch how they counted it. [[2 Kings 12:10]]

Two men came up together. The king's scribe and the high priest. Same money, same room, same time. Neither one counted it alone.

Then the money went out to the workers. [[2 Kings 12:11]]

And then comes the surprise. [[2 Kings 12:15]]

They did not audit the workers at all. Not because they were careless. They had just done the strictest counting in the book. The care was at the chest, where the money moved. After that, honest men were trusted.

FIVE. HONEST WHERE PEOPLE CAN SEE IT.

Paul was carrying money for poor believers. Nobody had accused him of anything. He set up a control anyway, and he said why. [[2 Corinthians 8:20]]

Then the reason. [[2 Corinthians 8:21]]

Two audiences. Yahweh, and other people. If your record is right before Yahweh but nobody else can read it, you have only done half the job.

Think about how that works in a normal week. If you say you brought the change back, that is one thing. If anybody can look at the record and see the change came back, that is a different thing, and it is better. Paul was not guarding his reputation out of pride. He was removing a question before anyone had to ask it.

SIX. A COMPLAINT ABOUT NUMBERS.

Food was being handed out daily, and some widows were being skipped. [[Acts 6:1]]

That is a distribution problem. A counting problem.

The leaders did not preach at the complainers. [[Acts 6:2]] They made an office for it and set a standard for who could hold it. [[Acts 6:3]]

Honest report. Full of the Holy Ghost and wisdom. Character first, then the job.

Notice the order. They set the standard for the men BEFORE they handed out the work. Honest report first. Full of the Holy Ghost and wisdom first. Then the job. Most places do it backwards - find somebody who is free, then hope they turn out to be trustworthy.

SEVEN. ONE PERSON, BOTH JOBS.

Joseph held both seats. He gathered the grain and he counted it. [[Genesis 41:35]]

He did it. [[Genesis 41:48]]

Then this. [[Genesis 41:49]]

Until he left numbering. The grain got so big he stopped counting it. The Word does not scold him - the plan worked - but it writes the moment down. If you hold both jobs, that is your warning. Losing the count happens quietly, right when things are going well.

That is worth saying plainly. Joseph did not fail. The famine came, the stores held, and a whole region lived because of what he did. The Word still wrote down the hour the count stopped. Both of those things are true, and the second one is the part that is for us.

EIGHT. WHAT A HOUSE IS BUILT OUT OF.

[[Proverbs 24:3]] [[Proverbs 24:4]]

Wisdom builds. Understanding establishes. Knowledge fills the rooms. Those are Resources Yahweh supplies, and a fight between the one who buys and the one who counts is usually a house short of one of them.

And the standing order. [[Proverbs 27:23]] Know the state of what you have. That is the oldest reason for a current, accurate record.

And here is the one that turns a turf fight inside out. [[Proverbs 13:10]]

Only by pride cometh contention. When two offices in one house keep pulling against each other, look for the pride before you go looking for a better process.

NINE. WHOSE IS IT.

[[Haggai 2:8]]

All the silver and all the gold are His already.

David said the honest thing over the biggest building fund in Scripture. [[1 Chronicles 29:14]]

Of Thine own have we given Thee. He said the same thing again two verses later. [[1 Chronicles 29:16]]

That changes what a purchase actually is. Every order you place is a steward moving Yahweh's property from one of His own accounts into another one. You are not spending your money carefully. You are handling His money carefully, which is a higher standard and a lighter load at the same time.

And the standard. [[Luke 16:10]] Faithful in the least.

And the reckoning is coming. [[Matthew 25:19]] After a long time, the lord of those servants came and settled accounts with them. Nobody holds a book forever.

Jesus is the Lamb of Yahweh, [[John 1:29]] the Son, [[John 3:16]] and everything holds together in Him. [[Colossians 1:17]]

THREE THINGS THIS WEEK.

One. Write down who buys and who keeps the record in your house.

Two. Write down the one thing each of them is judged on. Can both get better while the house gets poorer? Then you found the problem.

Three. Ask if the next time money is counted, two people can be there.

${TALK.youth}`,

    teen: `CAN TWO WALK TOGETHER - THE BUYER, THE COUNTER, AND THE AGREEMENT THAT COMES FIRST.

Nobody taught this lesson. No class, no recording, no speaker. On 2026-10-28 Darrell forwarded a trade newsletter from his work mailbox and typed one word over it: Lesson. Then he lifted one item out of the body and set it on top - a piece about getting the office that BUYS and the office that COUNTS onto the same page about savings, spending and results. The subject line of the forward was about something else entirely. The item he lifted is the ask.

${BLOCKED_TEEN}

So this hour is the Word on the premise under that headline, and the premise is older and bigger than the article made it sound.

MOVEMENT ONE: THE AGREEMENT COMES FIRST.

[[Amos 3:3]]

One question, one answer. Not "can two walk together if they are agreeable." Except they be AGREED. Walking together comes after the agreement, never before it. Every attempt to get the walking without first getting the agreement is running a river uphill.

The reason two is better than one is not sentiment. It is arithmetic about failure. [[Ecclesiastes 4:9]] [[Ecclesiastes 4:10]] The second person is there for the fall.

And the mechanism is named. [[Proverbs 15:22]] Without counsel, purposes are disappointed - an expectation that does not arrive.

MOVEMENT TWO: THE MAKER AND THE COUNTER, IN ONE PASSAGE.

The tabernacle is the best documented project in Scripture, and when the Word reports on it, it names both offices.

[[Exodus 38:21]] This is the SUM, and a named officer counted it. Then the other office, in the next breath. [[Exodus 38:22]]

Bezaleel made. Ithamar counted. Two men, two jobs, one project, one passage, both names written down.

Stop on what that costs the usual assumption. Most houses quietly decide one of those two offices is the real work and the other is administrative overhead, and the one they demote is almost always the counter. The Word put the counter's name first, in verse 21, and the maker's name second, in verse 22. That ordering is not an accident in a book this careful about order.

Then the record itself. [[Exodus 38:24]] After the shekel of the sanctuary - one agreed unit of measure. A number means nothing until both sides measure in the same thing.

MOVEMENT THREE: THE ONE TIME BUYING WAS STOPPED.

[[Exodus 36:5]] [[Exodus 36:6]] [[Exodus 36:7]]

Restrained from bringing. Read who raised it: the craftsmen. The people doing the work, standing closest to the material, saw the over-supply before anyone above them could, and they SAID SO. Over-buying is not generosity, and the office nearest the material spots it first.

MOVEMENT FOUR: TWO HANDS ON THE CHEST.

2 Kings 12 is a written dual-control procedure, and it is more specific than most modern policies.

[[2 Kings 12:9]] A chest, a hole bored in the lid, set beside the altar, kept by the priests who kept the door. Money goes in where it cannot come back out.

Then the count. [[2 Kings 12:10]] Came up - both of them, together, same money, same time. The king's man and the house's man. Neither counts alone.

Then the release. [[2 Kings 12:11]] Counted first, then delivered into named hands.

And then the verse that turns every assumption about control around. [[2 Kings 12:15]]

They reckoned NOT. The workmen were not audited at all - not from carelessness, but because the control stood at the GATE where the money moved, and faithful men past the gate were trusted. A frightened organisation audits everybody a little and nobody properly. The Word's pattern is two hands at the chest and trust downstream.

MOVEMENT FIVE: HONEST IN THE SIGHT OF MEN.

Paul was carrying a collection. He was an apostle and nobody had accused him. He built a control anyway and wrote his reason down.

[[2 Corinthians 8:20]] [[2 Corinthians 8:21]]

Avoiding THIS. He arranged things so an accusation would be impossible, not merely false. Then: honest things, not only in the sight of the Lord, but also in the sight of men. Two audiences, and the second is not vanity. Honesty that cannot be SEEN does not do the work honesty is for.

And note what Paul was NOT doing. He was not guarding a reputation out of vanity and he was not managing how a thing looked. He was removing a question before anybody had to ask it, at cost to himself, over money he had every right to carry alone.

MOVEMENT SIX: A NUMBERS COMPLAINT, ANSWERED WITH STRUCTURE.

[[Acts 6:1]]

Not a doctrine complaint. The daily distribution, with widows being overlooked in it - a logistics and accounting failure inside a healthy congregation in the middle of fast growth.

The answer. [[Acts 6:2]] [[Acts 6:3]] Not a sermon on contentment. An office, a stated qualification - honest report, full of the Holy Ghost and wisdom - and seven men named out loud. [[Acts 6:5]]

A distribution problem is a structure problem, and character comes before the appointment.

MOVEMENT SEVEN: ONE PERSON IN BOTH SEATS.

Most households have one person doing both jobs on different evenings. The Word has that case.

[[Genesis 41:35]] Gather, lay up, keep - deliberately joined in one hand. [[Genesis 41:48]]

Then the sentence most readers slide past. [[Genesis 41:49]] UNTIL HE LEFT NUMBERING. The quantity outgrew the count. The Word does not scold him; the plan worked. But it records the moment, and that is the warning: losing the count happens quietly, at the exact moment things are going well. If you hold both seats, set the line where you would stop counting before you reach it, and hand the book over there.

MOVEMENT EIGHT: THE RESOURCES, AND THE BODY.

[[Proverbs 24:3]] [[Proverbs 24:4]]

A sequence, not a list. Wisdom BUILDS. Understanding ESTABLISHES. Knowledge FILLS. These are Resources Yahweh supplies, and a quarrel between the buyer and the bookkeeper is usually a house short of one of the three, not a personality clash.

And the standing order on assets. [[Proverbs 27:23]] [[Proverbs 27:24]] Know the state. Riches are not for ever.

[[1 Corinthians 12:21]] The eye cannot say to the hand, I have no need of thee. And the cure for two leaders each optimising their own number. [[Philippians 2:4]]

Then the thing without which it is all noise. [[1 Corinthians 13:2]] All knowledge, every price in the market, and without charity it is nothing.

MOVEMENT NINE: WHOSE MONEY IT IS.

[[Haggai 2:8]] The silver is Mine, and the gold is Mine.

[[1 Chronicles 29:14]] Of Thine own have we given Thee. Every purchase in your house is a steward moving Yahweh's property between two of His own accounts.

So the standard. [[Luke 16:10]] And the reckoning. [[Matthew 25:19]]

He is the Lamb of Yahweh, [[John 1:29]] the Eternal Son, [[John 3:16]] and the One by whom the whole thing holds together. [[Colossians 1:17]]

THREE THINGS THIS WEEK.

One, the two names. Who decides what gets bought, and who keeps the record. If it is one person twice, write the name twice and set your stop-counting line now.

Two, the two numbers. Write the one number each is judged by, one above the other. If both can improve while the house gets poorer, you found it.

Three, the two hands. Run one purchase under 2 Kings 12:10, then let it buy trust downstream the way verse 15 did.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that the buyer is reckless and the bookkeeper is righteous. The Word honours both by name in one passage, and it was the craftsmen - the buying side - who caught the over-supply first. [[1 Corinthians 14:40]] Order is not the enemy of generosity. It is how generosity arrives where it was sent.

${TALK.teen}`,

    senior: `CAN TWO WALK TOGETHER - THE BUYER, THE COUNTER, AND THE AGREEMENT THAT COMES FIRST.

No one taught this lesson, and it is right to say so at the top. There was no study and no recording. On 2026-10-28 Darrell forwarded a trade newsletter out of his work mailbox with a single word typed over it, Lesson, and then lifted one item from the body and set it above the rest: a piece on getting the office that purchases and the office that keeps the books onto the same page about savings, spending and results. The subject line of the forward concerned something else. The item he lifted is the ask, and sixteen days passed between his word and this hour.

${BLOCKED_SENIOR}

What follows, then, is the Word on the premise beneath that headline - and the premise proves to be considerably older, and considerably larger, than the framing suggested.

MOVEMENT ONE: THE AGREEMENT IS NOT THE LAST STEP.

[[Amos 3:3]]

A question with a single answer, and it governs every undertaking that has two offices in it. Not whether the two are agreeable, nor whether they report to the same man. Except they be agreed. The walking is downstream of the agreement, and every attempt to produce the walking without first securing the agreement is an attempt to run a river uphill.

Beside it stands the commendation. [[Psalms 133:1]] Good and pleasant are two separate claims, and most houses pursue the second without ever obtaining the first.

And the case for two is not sentiment but arithmetic concerning failure. [[Ecclesiastes 4:9]] [[Ecclesiastes 4:10]] Woe to him that is alone when he falleth. The second man is present for the fall, not for the company. The mechanism is named as well. [[Proverbs 15:22]] Purposes are disappointed - an expectation that does not arrive. [[Proverbs 11:14]]

MOVEMENT TWO: THE ONE WHO MADE IT AND THE ONE WHO COUNTED IT.

The tabernacle is the best documented undertaking in Scripture, and the Word does there what a management paper seldom does: it names both offices and tells you who held each.

[[Exodus 38:21]] This is the sum, counted, by a named officer serving under Moses. And then, in the next breath, the other office. [[Exodus 38:22]]

Bezaleel made. Ithamar counted. Two men, two offices, one undertaking, one passage, and the text thinks both worth recording by name.

Then the account itself. [[Exodus 38:24]] Materials received, quantity stated, and the standard of measure named - after the shekel of the sanctuary - because a figure signifies nothing until both parties measure in the same unit.

And then the passage every purchaser ought to know. It is the single recorded instance of procurement being halted, and those who raised the alarm were the craftsmen, who stood nearest the material. [[Exodus 36:5]] [[Exodus 36:6]] [[Exodus 36:7]] Restrained from bringing. Over-supply is not generosity, and the office closest to the material perceives it soonest.

MOVEMENT THREE: ONE CHEST, AND TWO HANDS UPON IT.

The twelfth chapter of 2 Kings sets out a dual control in writing, and it is more particular than most modern policies.

[[2 Kings 12:9]] A chest, a hole bored in the lid, set beside the altar, kept by the priests who kept the door. What goes in cannot be drawn back out, and the keepers of the door are the keepers of the box.

Then the counting. [[2 Kings 12:10]] They came up together, to the same money, at the same hour. The king's scribe is the king's man and the high priest is the house's man, and neither counts alone. The second chronicle records the same two offices at the same chest. [[2 Chronicles 24:11]]

Then the disbursement. [[2 Kings 12:11]] Told first, delivered afterward, into named hands.

And then the verse that overturns the common assumption about control. [[2 Kings 12:15]] They reckoned not. The workmen's accounts were never examined - not from negligence, for the house had just demonstrated the strictest handling of money in the Old Testament, but because the control stood at the gate where the money moved, and faithful men beyond that gate were trusted. A frightened house audits everyone a little and no one properly. The pattern here is two hands at the chest, and trust past it.

MOVEMENT FOUR: HONEST IN THE SIGHT OF MEN.

Paul carried a collection for the saints. He was an apostle, and no accusation had been laid against him. He constructed a control notwithstanding, and recorded his reason.

[[2 Corinthians 8:20]] [[2 Corinthians 8:21]]

Avoiding this. He so ordered his affairs that a particular accusation should be impossible rather than merely untrue. And then the sentence that belongs over every church office and every household budget: providing for honest things, not only in the sight of the Lord, but also in the sight of men. Two audiences, both named, and the second is not vanity. A man whose books are right before Yahweh and unreadable to his brethren has solved the half of the problem that was never going to divide a congregation.

MOVEMENT FIVE: A COMPLAINT ABOUT NUMBERS, ANSWERED IN STRUCTURE.

[[Acts 6:1]]

Observe what the complaint was. Not doctrine. The daily ministration, with widows overlooked in it - a failure of logistics and of accounting, within the healthiest congregation that has ever existed, in a season of rapid growth.

Observe the answer. [[Acts 6:2]] [[Acts 6:3]] They did not preach contentment at the aggrieved. They judged the matter real, acknowledged it was not their own seat, and had the house make an office for it, with a qualification stated first - of honest report, full of the Holy Ghost and wisdom - and seven men named one by one. [[Acts 6:5]]

A problem of distribution is a problem of structure, and character precedes appointment.

MOVEMENT SIX: WHERE ONE MAN HOLDS BOTH SEATS.

Many households, and not a few small congregations, have no two officers at all, but one person performing both duties on different evenings. The Word treats that case with care.

[[Genesis 41:33]] [[Genesis 41:34]] [[Genesis 41:35]] Gather, lay up, keep - three verbs, deliberately joined in a single hand. And the execution. [[Genesis 41:48]]

Then a sentence most readers pass over. [[Genesis 41:49]] Until he left numbering. The quantity outgrew the count. The Word does not reprove him - the famine came, the stores held, the plan answered - yet it records the moment precisely, and that precision is the caution. To hold both seats is no sin. To lose the count is where it goes wrong, and it goes wrong quietly, at the very hour matters are prospering. So fix beforehand the point at which you would cease counting, and hand the book to another there.

MOVEMENT SEVEN: THE RESOURCES THAT BUILD A HOUSE.

[[Proverbs 24:3]] [[Proverbs 24:4]]

Read the order, for it is a sequence. Wisdom builds. Understanding establishes. Knowledge fills the chambers with all precious and pleasant riches. These are the Resources Yahweh supplies for a work, not amiable qualities a man happens to possess, and a quarrel between the office that buys and the office that counts is seldom a matter of temperament. It is a house short of one of the three.

And the standing charge laid upon whoever is answerable for the assets. [[Proverbs 27:23]] [[Proverbs 27:24]] Be diligent to know the state. Riches are not for ever. The verse presumes the state is knowable, and that knowing it is your office - which is the oldest argument ever made for a current and accurate record.

[[Proverbs 13:10]] Only by pride cometh contention. Where two offices contend over one house, look for the pride before you look for the process.

MOVEMENT EIGHT: THE BODY IS NOT PERMITTED TO SAY IT.

[[1 Corinthians 12:21]] The eye cannot say unto the hand, I have no need of thee. The purchaser may not say it to the bookkeeper, nor the bookkeeper to the purchaser, and neither may say it to the men doing the work. And here is the remedy for two leaders each improving the one figure by which he is measured. [[Philippians 2:4]]

Then the matter without which the whole structure is noise. [[1 Corinthians 13:2]] Though I have all knowledge - the whole ledger, every price in the market - and have not charity, I am nothing. Two men may be perfectly reconciled in their reporting and hold no love between them, and the Word says the books being right will not save that.

MOVEMENT NINE: WHOSE MONEY IT IS.

[[Haggai 2:8]] The silver is Mine, and the gold is Mine.

And David, standing over the largest building fund in Scripture, says the only honest thing a man may say over a budget. [[1 Chronicles 29:14]] [[1 Chronicles 29:16]] Of Thine own have we given Thee. Every order you place is a steward moving Yahweh's property between two of His own accounts.

Which fixes the standard. [[Luke 16:10]] And the reckoning is certain. [[Matthew 25:19]] And He to whom the account is rendered is the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] addressed by the Father as God with a throne for ever, [[Hebrews 1:8]] and the One by whom the whole of it holds together. [[Colossians 1:17]]

THREE THINGS THIS WEEK.

One, the two names. Write who determines what is bought in your house, and who keeps the record. Where it is one person twice, write the name twice, and fix your stop-counting line before you reach it.

Two, the two figures. Set the one number each is judged by, one above the other. Where both may improve while the house grows poorer, you have found the fault, and you found it without a consultant.

Three, the two hands. Take one purchase in the next thirty days and run it under 2 Kings 12:10 - both present, both hands upon the count - and then do the harder half, and let it purchase trust downstream as the fifteenth verse did.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that the purchaser is reckless and the bookkeeper righteous. The Word honours both offices by name in a single passage, and it records the craftsmen - the buying side - as the first to perceive the over-supply. [[1 Corinthians 14:40]] Let all things be done decently and in order. Order is not the adversary of generosity; it is how generosity arrives where it was sent.

${TALK.senior}`,
  },

  facilitator: {
    howToRun:
      "Run this alone, or with the person who handed you the project, in about an hour. OPEN WITH THE ADMISSION, not with the Word: say out loud that the article behind the forwarded headline was never read, that all three roads to it were shut, and that none of its six steps is taught here. If anyone in the room has read it, say so and keep it separate from what is taught. THEN read Amos 3:3 aloud and ask the room the question before anybody explains it: who are our two offices, and are they agreed? Write the two names on paper where everyone can see them. SECOND, read Exodus 38:21-22 and ask what it means that the Word recorded BOTH names. Most rooms have quietly decided one of the two offices is the real one. THIRD, read 2 Kings 12:9-11 slowly, then verse 15, and sit with the reversal: the tightest control in the Old Testament produced LESS auditing downstream, not more. Ask what your house audits out of fear rather than at the gate. FOURTH, read 2 Corinthians 8:20-21 and ask the uncomfortable question: could an outsider read our record and call it honest, or only Yahweh? FIFTH, read Genesis 41:49 and ask the person who holds both seats where their own stop-counting line is. Do not let the hour end without the TWO NUMBERS written down, one above the other. That page is the week's work; everything else is commentary on it.",
    talkingPoints: [
      "Say first what was not read. The article is a headline and a blurb in our hands, nothing more, and three roads to the body were refused. Nothing here is attributed to its six steps, and the date we will try again is written in the lesson.",
      "Amos 3:3 is a constraint, not an encouragement. Agreement is upstream of walking together, which means every tool that produces coordination without producing agreement is treating a symptom.",
      "Exodus 38:21-22 names the maker and the counter in consecutive verses. If your house treats one of those two offices as administrative overhead, the Word has already disagreed with you.",
      "Exodus 36:5-7 is the only recorded restraint on procurement in Scripture, and the craftsmen raised it. The office nearest the material sees the over-buy first - so ask the crew, not the committee.",
      "2 Kings 12:10 is dual control written down. 2 Kings 12:15 is the payoff: control at the gate buys trust downstream, and the workmen were not reckoned with at all.",
      "2 Corinthians 8:21 names two audiences. Honesty that cannot be seen does not do the work honesty is for, which is why a readable record is a spiritual matter and not a clerical one.",
      "Acts 6:1-5 answers a numbers complaint with an org chart and a character qualification stated before the appointment. Parents, sit with your children this week and ask where they have seen somebody overlooked in a distribution, and listen all the way to the end before you teach.",
      "Genesis 41:49 records the hour the counting stopped, in a plan that worked. Prosperity is when the count is lost. Set the line before you reach it.",
    ],
    discussionPrompts: [
      "Name the two offices in this house by name, and then name the single number each of them is judged by. Can both of those numbers improve in a month while the house gets poorer? Answer honestly before you move on.",
      "Where do our two offices actually meet, how often, and who holds the book when they do? If the honest answer is nowhere, say so out loud - that is the finding, and it costs nothing to admit and everything to hide.",
      "Children, ask your mom, your dad or a grandparent about a purchase they regret and what they were measuring when they made it. Then tell a friend one thing this hour showed you, ask what they saw, and pray one for another.",
    ],
  },

  quiz: {
    questions: [
      {
        q: 'What was actually forwarded, and what was the ask?',
        options: [
          'A devotional on stewardship, with the ask being to teach it',
          "A trade newsletter whose subject line was about chip production, with one word typed above it - Lesson. - and one item lifted by hand out of the body: 6 Steps to Better CFO-CPO Alignment. The lifted item is the ask; the subject line is not",
          'An article about CFO-CPO alignment, read in full and summarised here',
          'A recording of a Bible study on Amos 3:3',
        ],
        answer: 1,
        explain:
          "The subject line of the forward is about chip production and is NOT the ask. Darrell typed Lesson. above the forwarded header and then lifted ONE item out of the body and set it on top - the CFO-CPO alignment piece and its one-sentence blurb. Judge by the body, never the subject. Gmail thread 1a1837bf55922f04, 2026-10-28 at 17:08 UTC, built sixteen days later.",
      },
      {
        q: 'How much of the article behind that headline is taught in this lesson?',
        options: [
          'All six steps, each matched to a verse',
          'The first three steps only',
          "None of it. The article was never read - the email carries the headline and one blurb and nothing else, and all three roads to the body were refused from this session, so no step is taught and nothing is attributed to them. re-review: 2026-11-27",
          'Its statistics, but not its recommendations',
        ],
        answer: 2,
        explain:
          'A shut road must never read like a verified fact (DR-0076 section 8). The publisher link would not resolve and two publisher sites were refused by the network before a page was served. The lesson therefore teaches the Word on the premise under the headline and attributes nothing to the six steps, and it carries the date we try again.',
      },
      {
        q: 'What does Amos 3:3 establish about two offices working on one project?',
        options: [
          'That they should be friendly with one another',
          'That agreement is downstream of coordination - get them walking together and agreement follows',
          'That agreement comes FIRST. Walking together is downstream of it, so producing coordination without producing agreement is running a river uphill',
          'That one of the two must be made senior to the other',
        ],
        answer: 2,
        explain:
          'Can two walk together, except they be agreed? The question has one answer, and it makes the agreement a precondition rather than an outcome. Proverbs 15:22 names the mechanism: without counsel, purposes are disappointed.',
      },
      {
        q: 'What is remarkable about Exodus 38:21-22 for a project with a buyer and a bookkeeper?',
        options: [
          'It names only the craftsman, because making is the real work',
          'It names only the officer who counted, because the record is what survives',
          'It names BOTH - Ithamar who counted the sum and Bezaleel who made the work - in consecutive verses, treating both offices as worth recording by name',
          'It leaves both unnamed to keep the glory on Yahweh',
        ],
        answer: 2,
        explain:
          'The tabernacle account puts the maker and the counter side by side, by name, each under his own office, and gives the materials to the shekel after the shekel of the sanctuary - one agreed unit of measure, because a figure signifies nothing until both sides measure in the same thing.',
      },
      {
        q: 'In Exodus 36:5-7, who first reported that too much material had been brought?',
        options: [
          'Moses, from the accounting',
          'The craftsmen doing the work, who stood nearest the material and said so, after which a proclamation restrained the people from bringing',
          'Aaron, during the morning sacrifice',
          'The people themselves, out of weariness',
        ],
        answer: 1,
        explain:
          'It is the only recorded restraint on procurement in Scripture, and the office closest to the material perceived the over-supply first. Over-buying is not generosity - so ask the crew, not the committee.',
      },
      {
        q: 'What does 2 Kings 12:15 record about the workmen who received the money?',
        options: [
          'That their accounts were examined monthly by the high priest',
          'That they were required to post a surety before receiving any money',
          "That they were NOT reckoned with at all, because they dealt faithfully - the control stood at the gate where the money moved, and trust ran downstream of it",
          'That they were paid only after the work was inspected',
        ],
        answer: 2,
        explain:
          'The same chapter that sets out the tightest dual control in the Old Testament - the king\'s scribe and the high priest coming up together to the same money at verse 10 - produces LESS auditing afterward, not more. A frightened house audits everybody a little and nobody properly.',
      },
      {
        q: 'Why did Paul build a control over a collection nobody had accused him of mishandling?',
        options: [
          'Because the churches required it of him in writing',
          'Because he doubted the men travelling with him',
          'To provide for honest things not only in the sight of the Lord, but also in the sight of men - arranging matters so an accusation would be impossible rather than merely untrue',
          'Because Roman law required audited accounts for transported funds',
        ],
        answer: 2,
        explain:
          '2 Corinthians 8:20-21 names two audiences and refuses to collapse them. A man whose books are right before Yahweh and unreadable to his brethren has solved the half of the problem that was never going to divide a congregation.',
      },
      {
        q: 'What does Genesis 41:49 record about Joseph, who held both the gathering and the numbering?',
        options: [
          'That he handed the numbering to a scribe in the second year',
          'That he gathered corn as the sand of the sea until he LEFT NUMBERING, because it was without number - the quantity outgrew the count, and the Word records the moment precisely without reproving him',
          'That he refused to hold both offices and asked Pharaoh for help',
          'That he miscounted and the stores ran short in the seventh year',
        ],
        answer: 1,
        explain:
          'The plan answered and the famine was survived, so this is a caution rather than a rebuke. Losing the count happens quietly, at the very hour things are prospering - which is why a person holding both seats should fix the stop-counting line before reaching it and hand the book over there.',
      },
    ],
  },
};

// -----------------------------------------------------------------------------
// Fill, derive the anchor, splice
// -----------------------------------------------------------------------------
const READER_PLACES = ['lesson', 'child', 'youth', 'teen', 'senior'];

const filled = fillDeep({ ...MODULE, lesson: '', levels: {} });
filled.lesson = fill(MODULE.lesson, true);
filled.levels = {};
for (const b of ['child', 'youth', 'teen', 'senior']) filled.levels[b] = fill(MODULE.levels[b], true);
filled.anchor.ref = readerRefs.join('; ');

if (!readerRefs.length) throw new Error('pm17: no references were found in the reader places');
for (const r of readerRefs) verseText(r);

// Every reader place carries the close and the blocked road (DR-0795 / DR-0076 §8).
for (const place of READER_PLACES) {
  const text = place === 'lesson' ? filled.lesson : filled.levels[place];
  if (!/TALK ABOUT IT TOGETHER/.test(text)) throw new Error(`pm17: ${place} has no TALK ABOUT IT TOGETHER`);
  if (!/re-review: 2026-11-27/.test(text)) throw new Error(`pm17: ${place} has no dated blocked-road note`);
}

const src = readFileSync(COURSE, 'utf8');
if (src.includes(ID)) throw new Error('pm17: the id is already in the course; refusing to rebuild');

const OPEN = 'export const PROJECT_MANAGEMENT_MODULES = [';
const open = src.indexOf(OPEN);
if (open < 0) throw new Error('pm17: the modules array was not found');
const end = src.indexOf('\n];', open);
if (end < 0) throw new Error('pm17: the modules array is not closed');

const block = JSON.stringify(filled, null, 2)
  .split('\n')
  .map((l) => `  ${l}`)
  .join('\n');

// The array may or may not already carry a trailing comma; a second one would
// open a hole in the array and the course would serve `undefined` as a lesson.
const tailHasComma = /\}\s*,\s*$/.test(src.slice(0, end));
const next = tailHasComma
  ? `${src.slice(0, end)}\n${block},${src.slice(end)}`
  : `${src.slice(0, end)},\n${block}${src.slice(end)}`;

const weeks = (text) => [...new Set([...text.matchAll(/'pm(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src);
if (before.includes(WEEK)) throw new Error(`pm17: week ${WEEK} is already taken`);
const after = [...new Set([...next.matchAll(/pm(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
if (after[after.length - 1] !== WEEK) throw new Error(`pm17: week ${WEEK} is not the top of the course after splicing`);
if (next.split(`"${ID}"`).length - 1 !== 1) throw new Error('pm17: the new id did not land exactly once');

// meta.weeks is a getter over PROJECT_MANAGEMENT_MODULES.length (DR-0677), so the
// header tracks the splice on its own; a literal here would be a second source of truth.
if (!/get weeks\(\) \{ return PROJECT_MANAGEMENT_MODULES\.length; \}/.test(next)) {
  throw new Error('pm17: meta.weeks is no longer derived from the module count; refusing to splice');
}

writeFileSync(COURSE, next);

console.log(`pm17: spliced ${ID}`);
console.log(`pm17: modules ${before.length} -> ${before.length + 1}; top week ${WEEK}; meta.weeks derived, now ${before.length + 1}`);
console.log(`pm17: ${readerRefs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
