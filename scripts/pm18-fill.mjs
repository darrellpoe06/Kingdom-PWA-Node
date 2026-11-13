// =============================================================================
// pm18-fill - build Project Management lesson 18 and splice it into the course
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456 / DR-1468). Every
// quoted verse on this page is FILLED FROM app/public/bible/kjv at build time.
// The prose below holds only a reference in double brackets, [[Exodus 4:2]], and
// this script replaces it with the corpus text followed by the reference. No
// verse on the page was typed from memory. The reference list on the module's
// anchor is DERIVED from the placeholders that occur in the reader places, so
// anchor.ref names every verse the lesson stands on and nothing it does not
// (DR-0734). Same mechanism as scripts/pm17-fill.mjs, which this is modelled on.
//
// WHERE THE WORD CAME FROM. On 2026-10-29 at 18:29 UTC (1:29 PM Central)
// Darrell forwarded a LinkedIn newsletter out of his university mailbox into
// the lesson lane with one word typed above the forwarded header: Lesson. The
// newsletter is From the CEO's Desk by Johnny C. Taylor, Jr., President and CEO
// of SHRM, and the column is How HR Leaders Can Ease Capability Anxiety and Help
// Their People Grow. Gmail thread `1a1892ae1e2618e8`. FIFTEEN DAYS stood
// between his word and this build, and the record keeps that gap.
//
// WHY PROJECT MANAGEMENT AND NOT A LIVING LESSON (INTAKE-AND-FIT; docs/CONTEXT.md).
// The column is addressed to the people who lead other people's work - HR
// leaders and the managers under them - and its whole claim is about what a
// leader OWES the people he leads: a picture of the skills they already have,
// a visible path to the work they could grow into, and managers with time to
// coach. That is a workforce and organization question, which INTAKE-AND-FIT
// routes to Project Management, and this course already carries the workforce
// seam (pm2 who should work, pm3 the skill given and named, pm12 capability
// shown in outcomes). A Living Lesson would have had to drop the leader's half.
//
// THE SEAM WAS CHOSEN BY MEASUREMENT (DR-0610), so this does not re-preach a
// sibling. pm3 teaches the PROJECT's view of skill - name the skill sets the
// work needs, and pair skill with the charge to teach. pm12 teaches how
// capability is SHOWN - in fruit, not titles. mgmt9 (Management Is
// Stewardship) teaches the steward who writes his own standard when nobody
// above him has. None of them teaches the PERSON'S FEAR of being unequal to
// the next work, nor what the one who CALLS owes the one who is called. That is
// Exodus 4: the first recorded case of capability anxiety in Scripture, met not
// with a pep talk but with an inventory (What is that in thine hand?) and a
// promise to teach (I will be with thy mouth, and teach thee).
//
// TRUST BUT VERIFY (DR-0190 / DR-0100 / DR-0076 section 8). The email is a
// TEASER: it carries the opening of the column and stops at Keep reading on
// LinkedIn, and the link was not in what we hold. Tiered:
//   REPORTED (by the newsletter): that WTW calls capability anxiety an emerging
//     workforce risk in its latest research. CHECKED AS FAR AS THE ROAD ALLOWED:
//     www.wtwco.com did not resolve from this session (getaddrinfo ENOTFOUND). A
//     search index shows WTW's 2026 employee experience study framing the same
//     worry under another name - fear of becoming obsolete - with a Capability
//     pillar; the phrase capability anxiety was NOT found in WTW's own words. So
//     the worry is reported by two outlets; the NAME, as WTW's, is the
//     newsletter's report only.
//   REPORTED (SHRM about its own report): that the 2026 Skills (R)evolution
//     report found the average number of skills employers require in new job
//     postings has steadily risen since 2015. www.shrm.org did not resolve from
//     this session, so the report was not opened and no figure is taught.
//   THE AUTHOR'S PRESCRIPTION (an opinion, stated as his): building the path is
//     the employer's job, and it takes three things. That is what the lesson
//     tests against the Word, and the Word turns out to have all three - and a
//     fourth thing no employer can supply.
//   NOT CHECKED AT ALL, so silence is never mistaken for a check: everything
//   after the ellipsis in the email. re-review: 2026-11-27.
//
// THE HOUSE'S OWN WITNESS, measured rather than invented: this platform shows a
// learner the lessons already in hand and the ones ahead (progressSummaryFor,
// app/src/lib/church-classes.js:453-456, done / total / pct), awards crowns for
// study (app/src/lib/course-crowns.js, DR-1440), and names Skill Investment as
// a rung of the Opportunity Ladder (docs/00-foundations/_root/INTAKE-AND-FIT.md:72).
// It holds NO picture of a person's working skills - no skills inventory exists
// anywhere in app/src - which is the first of the three things. Named in the
// lesson, recorded in DR-1485 with a re-review date, not built here.
//
// Recorded as DR-1485.
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const COURSE = join(ROOT, 'app', 'src', 'lib', 'project-management-course.js');

const WEEK = 18;
const ID = 'pm18-what-is-that-in-thine-hand';
const TITLE = 'What is that in thine hand - capability anxiety, the path a leader owes, and the One who teaches';

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
  if (!m) throw new Error(`pm18: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`pm18: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`pm18: reference does not resolve in the corpus -> "${ref}"`);
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
  "WHAT WE COULD NOT CHECK AT THE SOURCE. The email is a teaser. It carries the opening of the column and then stops at Keep reading on LinkedIn, and the link itself was not in what we hold, so everything after the three things the employer owes was never read and nothing here is laid at its door. The part we hold points at two pieces of outside research, and we tried both roads. The advisory firm WTW is reported to call capability anxiety an emerging workforce risk; its site would not resolve from our network, and a search index shows the firm publishing a 2026 study of the same worry under a different name, fear of becoming obsolete. We did not find the phrase capability anxiety in the firm's own words. So the worry is reported by two outlets, and the name, as theirs, is reported by the newsletter alone. SHRM reports that its 2026 Skills (R)evolution report found employers asking for more skills in new job postings every year since 2015; the society's own site would not resolve either, so the report was not opened and no figure from it is taught. A shut road must never read like a verified fact. re-review: 2026-11-27.";

const BLOCKED_SENIOR =
  "WHAT WE COULD NOT CHECK AT THE SOURCE. We hold only the opening of the column. The email stops at Keep reading on LinkedIn, and the rest was never read, so nothing in this hour is laid at its door. Two reports are named in the part we hold. The first is a claim that the advisory firm WTW calls this worry an emerging risk. Its site would not open from our network. A search shows the firm studying the same fear in 2026 under another name, fear of becoming obsolete, and we did not find the words capability anxiety in its own pages. The second is SHRM's own report that job postings ask for more skills each year since 2015. That site would not open either, so we teach no number from it. A road we could not walk is never written up as a thing we checked. re-review: 2026-11-27.";

const BLOCKED_TEEN =
  'WHAT WE COULD NOT CHECK. We only have the start of the column. The email stops and says keep reading on LinkedIn, and we never read the rest. It names two reports. One is a firm that is said to call this worry a new risk. We could not open its site. A search shows it calls the same fear by another name, fear of becoming obsolete. The other is a report that jobs ask for more skills each year. We could not open that site either. So we teach no number from them. A door we could not open is not a thing we checked. re-review: 2026-11-27.';

const BLOCKED_YOUTH =
  'WHAT WE COULD NOT CHECK. We only have the first part of the letter. It stops and says keep reading. We never read the rest. It names two reports. We tried to open both. Both sites were shut to us. So we do not teach any number from them. A door we could not open is not a thing we know. re-review: 2026-11-27.';

const BLOCKED_CHILD =
  'WHAT WE DID NOT GET TO READ. We only got the first part of the letter. Then it stopped. It said keep reading. We could not get the rest. It talked about two reports. We tried to open them. We could not. So we do not say what is in them. We do not know. Saying we know would be a lie. re-review: 2026-11-27.';

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  "And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]";

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit down with one of your children today and ask them one open question - what is one thing you can already do that you think nobody has noticed - and listen all the way to the end before you add a word; have them retell it in their own words, then teach them one verse back, Exodus 4:2. Children, ask your mother, your father or a grandparent about a time they were handed work they did not think they could do, who helped them learn it, and how long it took; hear the whole account before you answer, then retell their story back to them in your own words. Then ask a friend this: what is in your hand right now that you have been treating as nothing. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one question today: what is one thing you can do that you think I have not seen? Listen to the whole answer first. Then have them say it back in their own words, and teach them one verse, Exodus 4:2. Children, ask your mom, your dad or a grandma about a job they did not think they could do. Who helped them learn it? Listen to all of it. Then say their story back in your own words. Then ask a friend this: what is in your hand that you think is small? Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what can you already do that you think nobody has noticed - and let them finish before you answer; have them retell the answer in their own words, then teach them one verse, Exodus 18:20. Children, ask your mom, your dad or a grandparent about a time they were scared they could not learn a new job, and who walked with them while they learned it; hear all of it before you reply, then retell it in your own words. Then ask a friend this: what are you afraid you will not be good enough for. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what skill do you have that you are afraid will not matter in a few years - and listen all the way through instead of answering it for them; have them retell their own answer in their own words, then teach them one verse, 2 Corinthians 3:5. Children, ask your mom, your dad or a grandparent about the work they do now that did not exist when they were your age, and how they learned it; hear the whole of it before you reply, then retell their answer in your own words. Then ask a friend this: who has made time to show you how to do a thing, and who could you show. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, sit with your grandchildren and ask them what they are afraid they will not be ready for, and hear the whole answer before you offer a word of comfort; then have them retell it in their own words and teach them one verse, Exodus 4:12. Ask your own mother or father, where they are still living, who took the time to teach them their trade, and what that teacher never had to say out loud. And tell a friend about one person you could still make time to be with while they learn, ask them who that person is for them, and pray one for another. ${RHYTHM} ${GROWTH}`,
};

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,

  bigIdea:
    "WHO TAUGHT THIS: NOBODY. No teacher, no recording, no Bible study. Gmail thread 1a1892ae1e2618e8 - a LinkedIn newsletter, From the CEO's Desk by Johnny C. Taylor, Jr., President and CEO of SHRM, forwarded out of Darrell's university mailbox on 2026-10-29 at 18:29 UTC (1:29 PM Central) with one word typed above the forwarded header: Lesson. The column is How HR Leaders Can Ease Capability Anxiety and Help Their People Grow. It names a worry - the uncertainty a worker feels about whether his skills will still matter a year from now - and it says building the path is the employer's job, and that the path takes three things: a clear picture of the skills people already have, visible information about the roles they could grow into, and managers with time to coach. Fifteen days stood between his word and this build. The email is a TEASER and that is said in every reader place: it stops at Keep reading on LinkedIn, the rest was never read, and the two reports it names were not opened because both sites were shut to this session. So no figure from either report is taught. What IS taught is the premise, tested against the Word and found older and fuller than the column: Moses had capability anxiety at the burning bush, and Yahweh answered it with all three of the column's things - an inventory (What is that in thine hand?), a way shown, and a Teacher who goes with the mouth - and with a fourth thing no employer can supply. re-review: 2026-11-27.",

  anchor: {
    ref: '',
    theme:
      "THE FIRST QUESTION IS NOT WHAT YOU LACK. IT IS WHAT IS IN YOUR HAND.\n\nCapability anxiety has a new name and a very old case. At the burning bush Moses is handed work far bigger than anything he has done, and he answers the way an anxious worker answers: I am not eloquent, I am slow of speech. Jeremiah says I cannot speak, for I am a child. Solomon says I am but a little child, I know not how to go out or come in. Three men, three new works, one worry.\n\nNow watch what Yahweh does, because it is the order a leader is meant to copy. He does not begin with the gap. He begins with an inventory - What is that in thine hand? - and the answer is a plain shepherd's rod, the tool Moses already had, and it becomes the tool of the whole commission. Then He shows the way: Jethro's counsel is to shew them the way wherein they must walk, and the work that they must do. Then He stays: I will be with thy mouth, and teach thee what thou shalt say. Jesus does the same with the twelve - He ordained them that they should be with Him, BEFORE He sent them out - and the result is recorded by the people who watched: unlearned and ignorant men, and they took knowledge of them, that they had been with Jesus.\n\nA picture of what is already in the hand, a way made visible, and time spent with the learner. The column names all three and calls it the employer's job. The Word agrees, and then adds the thing the column cannot: our sufficiency is of Yahweh, who also hath made us able.",
  },

  inApp:
    'No new screens this week. What changes is one page you write by hand, and it takes about an hour. FIRST, THE HAND. List the people you lead - your children, the volunteers on your team, the crew on a rehab, the people who report to you at work - and beside each name write two things they can ALREADY do well. Not what you wish they could do. What is in the hand. If you cannot fill a line, ask that person this week rather than guess; Yahweh asked Moses before He told him anything. SECOND, THE WAY. Beside each name write ONE piece of work they could grow into next, and then ask yourself whether they know it exists. If the next step is only in your head, it is not visible to them, and Exodus 18:20 says show it. THIRD, THE TIME. Pick ONE person on the list and put one hour on the calendar in the next fourteen days to do real work beside them - not a review, not a talk about development, the work itself, with them watching and then with you watching. Mark 3:14 put being with Him before being sent. FOURTH, YOUR OWN HAND. Write one skill you are afraid will not matter in a year, and under it write 2 Corinthians 3:5. Then write one thing you will learn this month and the person you will ask to show you. Bring the page to the person who handed you the project.',

  benefits: [
    "You get the right first question for a worried person, and it is not 'what do you need to learn?' It is 'what is already in your hand?' - Exodus 4:2, asked by Yahweh before He gave Moses one instruction. A worker who is shown what he already has can hear about what he lacks without hearing a verdict.",
    "You get the three things a leader owes his people, all out of the Word and all in one book of it: the inventory (Exodus 4:2), the way made visible (Exodus 18:20 - shew them the way wherein they must walk, and the work that they must do), and the Teacher who stays (Exodus 4:12). The column calls this the employer's job. The Word has called it that for a long time.",
    'You get the measure of coaching that actually works, and it is time, not content: Mark 3:14 ordained the twelve that they should be with Him before they were sent, and Acts 4:13 records what onlookers saw in the result - unlearned men, recognised by one thing, that they had been with Jesus.',
    "You get a succession plan written as a command, not a suggestion: charge Joshua, encourage him, strengthen him (Deuteronomy 3:28). And you get the years it took - Joshua is called Moses' minister in Exodus 24:13, and Elisha ministered to Elijah (1 Kings 19:21) long before he asked for the double portion.",
    'You get the honest line between fear and refusal. Exodus 4:10-12 is anxiety, and it is answered with teaching. Exodus 4:13-14 is a refusal after the promise, and THAT is where the anger is kindled - and even then Yahweh kept teaching both brothers (Exodus 4:15). Fear met with a promise is not sin. Refusing the promise is a different thing.',
    "You get the part no employer can supply, said plainly instead of left out: not that we are sufficient of ourselves (2 Corinthians 3:5), but who also hath made us able (2 Corinthians 3:6), and a spirit not of fear but of power, of love, and of a sound mind (2 Timothy 1:7). A career path answers the worry about tomorrow's job. It does not answer the worry about whether you are enough.",
    "You get the industry's vocabulary in its right place - second, as their word: a skills inventory or skills matrix, career pathing, an individual development plan, coaching and mentoring, PMBOK's develop-team work, succession planning. Every one is a serviceable name for a shape Exodus 4 and Mark 3 gave first.",
    'You get a lesson that tells you plainly what it could not check. The column is a teaser, the rest was never read, and both reports it names sat behind sites that would not open from our network, so no figure from either is taught - and the date we will try again is written where you can hold us to it.',
  ],

  stories: [
    {
      kind: 'parable',
      tone: 'serious',
      title: 'The Inventory Nobody Took',
      body: "A small church ran a food pantry out of its basement, and for eleven years Sister Odom ran the intake desk. She knew every family by name. She knew which ones would not come back if they were asked one question too many. She could read a shoebox of receipts faster than the treasurer could read a spreadsheet.\n\nThe new board decided to modernise. They bought a system that did intake on a tablet, and they announced it at a meeting where Sister Odom was sitting in the second row. Nobody asked her anything. The training was a link in an email.\n\nShe did not open the link. She told her niece she was too old for it. What she meant, though she never said it, was that she was afraid. Everything she knew how to do was about to stop counting, and nobody had said a word about what she already had.\n\nThree months later the intake desk was run by a volunteer who was very fast on the tablet and knew nobody's name. Two families stopped coming. The board noticed the numbers and not the names, because the person who knew the names had quietly moved to folding chairs.\n\nWhen the pastor finally asked her what had happened, she answered with one sentence. Nobody ever asked me what I could already do.",
    },
    {
      kind: 'parable',
      tone: 'hopeful',
      title: 'The Hour on Tuesday',
      body: "At the next church over, the same tablet came to the same kind of basement, and the man in charge did one thing differently. Before he said anything about the system, he sat down with the woman who had run intake for nine years and asked her to show him how she did it.\n\nIt took most of an afternoon. He wrote down what she knew - the names, the families who needed a quiet question, the shortcuts in her receipts - and when they were done he read it back to her. She had never seen it written down. It was a long page.\n\nThen he showed her the tablet, and he showed her one thing on it: the screen where her page could live. Not the whole system. The next step.\n\nAnd then he did the part that cost him. Every Tuesday for six weeks he came at four o'clock and ran intake beside her. The first two weeks he typed and she talked. The next two she typed and he watched. The last two he did not come at all, and she did not notice until the sixth week was over.\n\nShe taught the next volunteer herself. The page went into the system. No family stopped coming. When somebody asked her how she had learned the tablet at her age, she said she had not learned a tablet. She had been shown where her own work went next, by a man who sat with her until she could carry it.",
    },
  ],

  lesson: `WHAT IS THAT IN THINE HAND - CAPABILITY ANXIETY, THE PATH A LEADER OWES, AND THE ONE WHO TEACHES.

WHO TAUGHT THIS: NOBODY. Say it plainly at the top, because this house does not let a lesson imply a teacher it never had. There was no Bible study, no recording and no speaker. On 2026-10-29 at 18:29 UTC, 1:29 in the afternoon Central time, Darrell forwarded a LinkedIn newsletter out of his university mailbox with one word typed above the forwarded header: Lesson. The newsletter is From the CEO's Desk, written by Johnny C. Taylor, Jr., the President and CEO of SHRM, and the column is called How HR Leaders Can Ease Capability Anxiety and Help Their People Grow. Fifteen days stood between his word and this hour.

Here is what the part we hold actually says, in our words and not in quotation marks. A new kind of anxiety is growing in the workforce, and it has a name: capability anxiety, the uncertainty a person feels about whether his skills will still matter a year from now, which skills will count most, and where to put his effort. When people doubt they can keep up, their confidence drops and the organization's ability to change slows with them. Work keeps changing, and the tools are making it change faster. The worker's bigger worry, the column says, is whether anyone will help him prepare. And then the claim this lesson is built around: building that path is the employer's job, and it takes three things - a clear picture of the skills people already have, visible information about the roles they could grow into, and managers with time to coach.

${BLOCKED_ADULT}

So the column gives us a worry and a prescription, and nothing more. The prescription is the author's own judgment, stated as his, and it is the thing worth testing. Test it against the Word and it turns out to be older than HR, and to be missing one thing.

MOVEMENT ONE: THE WORRY IS OLDER THAN ITS NAME.

Capability anxiety is not new. It is in the Word three times at least, and each time it comes from a man who is about to be handed work he has never done.

Moses at the bush: [[Exodus 4:10]] Not eloquent, neither heretofore, nor since. Even the call itself had not made him feel ready.

Jeremiah at his calling: [[Jeremiah 1:6]] I cannot speak, for I am a child. And Solomon, crowned and frightened: [[1 Kings 3:7]] I know not how to go out or come in. A king who does not know how to come and go is a man who does not know his own job description.

So name it plainly. The fear of not being able is not modern and it is not weakness of character. Three of the men Yahweh used most began with it. What matters is what was done with it.

MOVEMENT TWO: THE FIRST QUESTION IS ABOUT THE HAND.

Read what Yahweh asked Moses before He told him anything at all. [[Exodus 4:2]]

What is that in thine hand. Not what do you lack. Not here is your gap. He begins with an inventory, and the answer is about as ordinary as an answer can be - a rod, a shepherd's stick, the tool of the forty years Moses thought were wasted in the wilderness. And a few verses later the same plain stick becomes the instrument of the whole commission: [[Exodus 4:17]] Take THIS rod. The old tool is not thrown away for the new work. It is carried into it.

That is the column's first thing - a clear picture of the skills people already have - and the Word puts it first too. The New Testament says the same about every believer: [[1 Peter 4:10]] As every man HATH RECEIVED the gift. Already received. And: [[Romans 12:6]] Gifts differing. Not missing; differing. A leader who begins with the gap tells the worker his past does not count. A leader who begins with the hand tells him it does.

What the industry calls it, second, as their word: a skills inventory, or a skills matrix - the grid of who can do what that a good project manager builds before assigning the work.

MOVEMENT THREE: SHOW THEM THE WAY, AND THE WORK.

The column's second thing is visible information about the roles people could grow into. The Word has that sentence almost word for word, and it is in Jethro's counsel to a leader who was wearing himself out: [[Exodus 18:20]]

Shew them the way wherein they must walk, AND the work that they must do. Two things made visible: the road, and the work at the end of it. A path that lives only in the leader's head is not shown. Shewing is the leader's verb, not the worker's.

And this is how Yahweh Himself leads: [[Psalms 32:8]] I will instruct thee and teach thee in the way which thou shalt go. The way ahead, taught ahead of time.

What the industry calls it: career pathing, role profiles, an individual development plan. Good names. Exodus 18:20 is older than all of them.

MOVEMENT FOUR: TIME BESIDE THEM.

The column's third thing is managers with time to coach, and here the Word is more demanding than the column, because the time it describes is not an hour a quarter. It is being with someone.

[[Mark 3:14]] That they should BE WITH HIM, and THEN that He might send them. The order is the method. Being with comes first; sending comes after. And the result was visible to people who did not even like them: [[Acts 4:13]] Unlearned and ignorant men - no credentials, no course - and they took knowledge of them, that they had been with Jesus. Time spent with the Teacher was the only qualification anyone could see.

The call itself carried the promise to train: [[Matthew 4:19]] I will MAKE you. The One who calls takes on the making. And the outcome He names is plain: [[Luke 6:40]] Every one that is perfect - fully trained - shall be as his master.

The old covenant shows the same pattern with succession. Joshua was Moses' minister for years: [[Exodus 24:13]] And when the hand-over came, Moses was given a three-part command about his successor: [[Deuteronomy 3:28]] Charge him, encourage him, strengthen him. Not only appoint him. Elisha's path was the same; he left his oxen, [[1 Kings 19:21]] went after Elijah, and ministered unto him - years of walking beside before he ever asked for a double portion.

What the industry calls it: coaching and mentoring, PMBOK's develop-team work, succession planning. Every one is a name for Mark 3:14.

MOVEMENT FIVE: BUILDING THE PATH IS THE LEADER'S JOB - AND THE WORD SAYS WHY.

The column says building the path is the employer's job. The Word agrees and gives the reason leaders exist at all: [[Ephesians 4:11]] [[Ephesians 4:12]] For the perfecting of the saints, for the work of the ministry. The leader is given to equip the people, not the other way round.

And see how Yahweh answered Moses' fear, because it is the pattern for answering anyone's. He did not argue with it. He reminded Moses Who made the mouth: [[Exodus 4:11]] And then He made a promise that is a training plan: [[Exodus 4:12]] I will be with thy mouth, AND TEACH THEE. Presence and instruction in one sentence. That is what the worried worker in the column is asking for - whether anyone will help him prepare - and it is what Yahweh offered first.

But read on, because the Word draws a line the column does not. [[Exodus 4:13]] [[Exodus 4:14]] The anger is kindled at verse 14, not at verse 10. The FEAR was answered with teaching. The REFUSAL after the promise is what kindled the anger. And even then Yahweh kept teaching: [[Exodus 4:15]] I will be with thy mouth, and with his mouth, and will teach you. A leader can learn two things from that. Meet fear with a promise and a plan, never with contempt. And when a person turns down the help after it is offered, that is a different conversation - but keep teaching anyway.

MOVEMENT SIX: WHAT NO EMPLOYER CAN SUPPLY.

Here is the one thing the column could not say, because it is a column for HR leaders. A clear skills picture, a visible path and a patient coach answer the worry about tomorrow's job. They do not answer the deeper worry underneath it - am I enough? The Word answers that one directly.

[[2 Corinthians 3:5]] Not sufficient of ourselves. [[2 Corinthians 3:6]] Who also HATH MADE US ABLE. Capability is something Yahweh makes, not only something a worker acquires. [[2 Timothy 1:7]] Not the spirit of fear, but of power, of love, and of a sound mind - the Sound Mind facet of the Mind of Christ, named as a gift.

Jeremiah's fear got the same answer: [[Jeremiah 1:7]] Say not, I am a child. [[Jeremiah 1:9]] I have put my words in thy mouth. And Joshua, at the hand-over: [[Joshua 1:9]] Be not afraid, for Yahweh is with thee whithersoever thou goest - wherever the new work turns out to be.

And for the year-from-now part of the worry: [[Matthew 6:34]] Take no thought for the morrow. Today has its own work; turn the rest into a request: [[Philippians 4:6]] [[Philippians 4:7]]

Solomon shows what that request looks like when you feel small. He did not ask for the anxiety to go away. He asked for the capability: [[1 Kings 3:9]] An understanding heart. The right prayer for a person afraid his skills will not keep up is Solomon's.

MOVEMENT SEVEN: THE WORK CHANGES; THE TEACHER DOES NOT.

The column is right that work keeps changing. The Word is not surprised by that, and it gives the worker a steadier place to stand than any forecast of skills. [[Hebrews 13:8]] The Teacher is the same yesterday, today and for ever, even when the tools are not.

The Word even says that ordinary trade skill is taught by Yahweh. Isaiah describes a farmer working his field, and then says: [[Isaiah 28:26]] The farmer's instructor in his craft is Yahweh.

So keep learning, and expect to. [[Proverbs 1:5]] A wise man WILL HEAR, and will increase learning. [[Proverbs 9:9]] Teach a just man, and he will increase. Learning is not a sign you have fallen behind; it is what the wise do at every age. Even the Son, as a boy, [[Luke 2:52]] increased in wisdom. And the diligent worker is not forgotten: [[Proverbs 22:29]]

And the Resources that actually build a house are named in order: [[Proverbs 24:3]] [[Proverbs 24:4]] Wisdom builds, Understanding establishes, Knowledge fills the chambers. Skills are part of Knowledge. They are not the whole house.

WHAT THIS HOUSE HOLDS, AND WHAT IT DOES NOT - MEASURED, NOT CLAIMED.

PoeTech is a learning platform, so the question lands here too. Measured from the code: the app shows each learner the lessons already in hand and the ones still ahead - done, total and a percentage, in app/src/lib/church-classes.js at lines 453 to 456 - and it awards crowns for finished study (app/src/lib/course-crowns.js). The intake front door names Skill Investment as a rung of the Opportunity Ladder (INTAKE-AND-FIT.md, line 72). That is the visible way, for coursework.

What it does NOT hold is the first of the three things. There is no picture anywhere in the app of what a person can already DO - no skills inventory for a household, a crew or a church. We searched for one and found none. So this house teaches Exodus 4:2 and does not yet ask it of its own people. That is named here, recorded with a date to look at it again, and not dressed up as done.

THIS WEEK, THREE THINGS.

One, the hand. For each person you lead, write two things they can already do. If you do not know, ask them. Yahweh asked first.

Two, the way. For each, write one piece of work they could grow into, and then show it to them. If it lives only in your head, it is not shown.

Three, the time. Pick one person and spend one real hour beside them doing the work. Being with comes before sending.

And if you are the one who is afraid: write what is in your hand, ask for an understanding heart, and do today's work today.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that the anxious worker is faithless; Moses was afraid and was answered with teaching. Not that the worker may wait to be handed everything; Elisha left his oxen and went after Elijah. And not that an employer's path can carry the weight only Yahweh carries. The One we answer to, and the One who makes us able, is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] addressed by the Father Himself as the One whose throne is for ever, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]]

${TALK.lesson}`,

  levels: {
    child: `WHAT IS THAT IN THINE HAND - CAPABILITY ANXIETY, THE PATH A LEADER OWES, AND THE ONE WHO TEACHES.

Nobody taught this one. No class. No teacher. Darrell got a letter in his email. A man who helps bosses wrote it. Darrell typed one word on it. The word was Lesson.

The letter talks about a worry. Some grown-ups worry at work. They worry they will not be good enough for the new jobs coming. The letter gives that worry a big name. It calls it capability anxiety. Capability means being able. Anxiety means worry. So it is the worry that you will not be able.

The letter says the boss should help. It says the boss should do three things. Know what you can already do. Show you what you can grow into. And spend time teaching you.

${BLOCKED_CHILD}

So we will look at the Word. The Word knew about this worry a long time ago.

FIRST. MOSES WAS WORRIED TOO.

Yahweh talked to Moses from a bush on fire. He gave Moses a big job. Moses was scared. He said he did not talk well. [[Exodus 4:10]]

A boy named Jeremiah was scared too. He said he was just a kid. [[Jeremiah 1:6]]

And a young king named Solomon felt very small. [[1 Kings 3:7]]

So you are not the only one. Big helpers in the Word started out scared.

SECOND. WHAT IS IN YOUR HAND?

Here is what Yahweh asked Moses first. [[Exodus 4:2]]

Moses had a stick. A plain stick. He used it to walk with his sheep. It did not look like much.

But Yahweh told him to bring it. [[Exodus 4:17]]

The plain stick came along for the big job. What Moses already had still counted.

So when you are scared, look at your hands first. What can you already do? Maybe you can draw. Maybe you are kind to little kids. Maybe you can fix a bike. That counts. Yahweh gave it to you. [[1 Peter 4:10]]

THIRD. SHOW THEM THE WAY.

Moses had a wise father-in-law. His name was Jethro. Jethro told Moses to show the people the way. [[Exodus 18:20]]

That means a good leader does not hide the next step. He points to it. He says, here is where you can go next.

Yahweh does that for us too. [[Psalms 32:8]]

FOURTH. STAY WITH THEM.

Jesus picked twelve helpers. What did He do first? He kept them close. They were with Him. [[Mark 3:14]]

They watched Him. They walked with Him. Later He sent them out.

And people could tell. They said these men had been with Jesus. [[Acts 4:13]]

That is how you learn best. Someone stays with you. You watch. Then you try. Then they watch you.

Jesus said He would make them into something new. [[Matthew 4:19]]

FIFTH. YAHWEH SAID HE WOULD TEACH.

Moses was still scared. So Yahweh made him a promise. [[Exodus 4:12]]

Yahweh did not say, try harder. He said, I will be with you, and I will teach you.

But then Moses said, send somebody else. [[Exodus 4:13]]

That made Yahweh upset. [[Exodus 4:14]]

Being scared was not the problem. Saying no after the promise was the problem. And even then, Yahweh still helped. He still taught Moses and his brother. [[Exodus 4:15]]

SIXTH. YOU DO NOT HAVE TO BE ENOUGH ALONE.

Here is a secret the boss letter did not say. You are not supposed to be enough by yourself. [[2 Corinthians 3:5]]

Yahweh is the One who makes us able. [[2 Corinthians 3:6]]

And He did not give us a scared heart. [[2 Timothy 1:7]]

So when you worry about tomorrow, here is what to do. Do today's job today. [[Matthew 6:34]]

And tell Yahweh what you need. [[Philippians 4:6]]

Solomon did that. He did not ask to be rich. He asked for a heart that understands. [[1 Kings 3:9]]

SEVENTH. KEEP LEARNING.

Jobs change. Tools change. But Jesus does not change. [[Hebrews 13:8]]

Even Jesus grew when He was a boy. He grew wiser. [[Luke 2:52]]

So learning new things is good. It does not mean you are behind. It means you are growing.

MORE HELPERS WHO LEARNED BY STAYING CLOSE.

Joshua was a young man. He helped Moses for a long, long time. He went where Moses went. [[Exodus 24:13]]

Then one day Moses got old. Joshua had to lead. So Yahweh told Moses what to do. Tell Joshua the job. Cheer him on. Make him strong. [[Deuteronomy 3:28]]

Elisha was a farmer. He had oxen. One day Elijah called him. Elisha left the farm. He went with Elijah and helped him. [[1 Kings 19:21]]

He did not learn in one day. He learned by being there, day after day.

That is how it works. You do not get good at a thing all at once. Someone shows you. You stay near. You try. You mess up. You try again. One day you can do it.

WHEN YOU ARE THE HELPER.

Maybe you have a little brother or sister. Maybe you know a younger kid at church. You can do this too!

First, see what they can already do. Tell them. Say, you are good at that.

Next, show them the next thing. Not ten things. One thing.

Then stay with them while they try it. Do not grab it away. Let them try. Slow is fine. Slow is how learning starts.

That is what Jesus did with His friends. You can do it with yours.

WHEN YOU FEEL SCARED.

Maybe you have a new grade at school. Maybe a new team. Maybe a new house. New things can feel big.

Here is what to do. Look at your hands. What can you already do? Say it out loud.

Then ask for help. It is not weak to ask. Moses had help. Joshua had help. Even the friends of Jesus had Jesus.

Then pray. Tell Yahweh you are scared. Ask Him to help you understand. He likes that prayer. He said yes to it for Solomon.

You do not have to know it all today. You only have to do today's part. Tomorrow has its own part. And Yahweh will be there tomorrow too. [[Isaiah 41:10]]

OUR APP.

Our app shows you what lessons you have done. It shows what is next. That is good. But it does not know what you can do with your hands. Not yet. We are not hiding that. We wrote it down so we can fix it.

THIS WEEK.

Look at your hands. Say one thing you can already do.

Ask a grown-up what you could learn next.

Ask someone to show you how. Stay close while they do it.

Jesus is the Lamb. [[John 1:29]] He is Yahweh's Son. [[John 3:16]]

${TALK.child}`,

    youth: `WHAT IS THAT IN THINE HAND - CAPABILITY ANXIETY, THE PATH A LEADER OWES, AND THE ONE WHO TEACHES.

Nobody taught this one as a class. Darrell forwarded a newsletter from his work email and typed one word above it: Lesson. The newsletter was written by the head of a big group for people who run workplaces. He calls a certain worry capability anxiety. It means being unsure if your skills will still matter next year, and not knowing what to learn next.

He says helping workers is the boss's job. And he says it takes three things. First, know what skills your people already have. Second, let them see the jobs they could grow into. Third, give managers time to coach.

${BLOCKED_YOUTH}

So here we test his idea with the Word. It turns out the Word has all three things. And it has a fourth thing that no boss can give.

ONE. THE WORRY IS VERY OLD.

When Yahweh called Moses, Moses did not feel ready. [[Exodus 4:10]]

Jeremiah felt too young. [[Jeremiah 1:6]]

King Solomon felt like a little kid who did not know how to do his job. [[1 Kings 3:7]]

Three of the most important men in the Word started out afraid they could not do it. Being worried does not mean you are weak. It means the job is big.

TWO. START WITH THE HAND.

Before Yahweh told Moses anything about the plan, He asked him a question. [[Exodus 4:2]]

Moses had a stick he used for his sheep. It was old and plain. But Yahweh told him to take that same stick with him. [[Exodus 4:17]]

See what happened. The new job did not throw away the old skill. The old skill came along. Peter says every person has already been given a gift. [[1 Peter 4:10]] And Paul says the gifts are different from person to person. [[Romans 12:6]]

Grown-ups at work have a name for writing down what everyone can do. They call it a skills inventory, or a skills matrix. The Word asked the question first.

THREE. SHOW THE WAY.

Moses was doing too much by himself. His father-in-law Jethro told him to teach the people, and to show them where to walk and what work to do. [[Exodus 18:20]]

That is the second thing. A good leader does not keep the next step secret. He shows it. Yahweh leads us the same way. [[Psalms 32:8]]

At work they call this a career path. The name is newer than the idea.

FOUR. BE WITH THEM.

Jesus chose twelve men. The first thing He did was have them stay with Him. Sending came later. [[Mark 3:14]]

Later, important people noticed that these men had no fancy schooling. But they could tell one thing. These men had been with Jesus. [[Acts 4:13]]

When Jesus called them, He promised to make them into something. [[Matthew 4:19]] He said a student who is fully trained will be like his teacher. [[Luke 6:40]]

Moses did this too. Joshua was his helper for years. [[Exodus 24:13]] When it was time for Joshua to lead, Yahweh told Moses to cheer him on and make him strong. [[Deuteronomy 3:28]]

Elisha left his farm work and followed Elijah, serving him for a long time. [[1 Kings 19:21]]

Coaching takes time. There is no shortcut.

FIVE. THE PROMISE TO TEACH.

Yahweh did not tell Moses to just be brave. He reminded him who made his mouth. [[Exodus 4:11]] Then He promised to be with him and teach him. [[Exodus 4:12]]

But Moses still said, please send someone else. [[Exodus 4:13]] That is when Yahweh got angry. [[Exodus 4:14]]

Look closely. Yahweh was not angry when Moses was scared. He was angry when Moses said no after the promise. And even then He kept teaching. [[Exodus 4:15]] So when someone you lead is afraid, answer with help, not with a frown.

SIX. WHAT NO BOSS CAN GIVE.

A good boss can show you the next job. But a boss cannot make you enough. Only Yahweh can. [[2 Corinthians 3:5]] He is the One who makes us able. [[2 Corinthians 3:6]]

He did not give us fear. He gave us power, love and a sound mind. [[2 Timothy 1:7]]

Yahweh told Jeremiah not to say he was too young. [[Jeremiah 1:7]] And He told Joshua not to be afraid, because He would be with him everywhere. [[Joshua 1:9]]

For the worry about next year, Jesus says to handle today. [[Matthew 6:34]] And Paul says to turn the worry into a prayer. [[Philippians 4:6]]

Solomon's prayer is a good one to copy. He asked for an understanding heart. [[1 Kings 3:9]]

SEVEN. KEEP LEARNING.

Jobs change and tools change. Jesus stays the same. [[Hebrews 13:8]] Even as a boy, Jesus grew in wisdom. [[Luke 2:52]] A wise person keeps listening and keeps learning. [[Proverbs 1:5]]

A PICTURE OF HOW IT WORKS.

Think about learning to cook from a grandparent. She does not hand you a book and leave the room. First she sees what you can already do. Maybe you can crack eggs. Maybe you can stir. She says, good, you can do that part. Then she shows you the next part, like how to tell when the pan is hot. She does it while you watch. Then you do it while she watches. After a while she sits at the table and lets you cook the whole meal. She is still close by. That is the hand, the way and the time, all in one kitchen.

That is what the newsletter asks bosses to do. And it is what the Word shows.

WHEN YOU ARE THE ONE WHO KNOWS MORE.

You may be young, but someone is younger. Someone on your team is newer. Someone at church just started. So this lesson is for you as a leader too.

Start by telling them what they already do well. Many people have never heard that from anyone. Then show them one next step. Just one. Then stay with them while they try it. Do not take over when they are slow. Slow is how learning looks at first.

Paul told Timothy to pass on what he learned, so that others could teach it too. [[2 Timothy 2:2]] That is how a skill lives longer than the person who first had it.

SCARED AND SAYING NO ARE NOT THE SAME.

This part matters, so read it twice. Moses was scared, and Yahweh answered him kindly. Then Moses asked Him to send someone else, and Yahweh was angry. Feeling scared is normal. Turning down help after it is offered is a choice. If you feel scared, say so, and take the help. If you are helping someone who is scared, be kind, the way Yahweh was kind.

WHERE SKILLS COME FROM.

Isaiah tells about a farmer who knows when to plow and how to plant. Where did he learn it? Isaiah says the farmer is taught by Yahweh. [[Isaiah 28:26]] Even a farmer's know-how comes from Him. So does yours. That means you can ask Him for help learning anything good.

Proverbs says a house is built by Wisdom. [[Proverbs 24:3]] Then it is filled by Knowledge. [[Proverbs 24:4]] Skills are part of Knowledge. Wisdom comes first.

A QUESTION TO ASK YOURSELF.

When was the last time someone told you what you are good at? Not a grade. Not a prize. Just a person saying, you do that well. If it has been a long time, you know how much it would help. So be that person for someone else this week. Say it out loud. Say it plainly. It costs you nothing. It may be the first time they have ever heard it. And it is the very place Yahweh started with Moses, at the bush, with a plain stick.

OUR OWN APP.

Our app shows each learner which lessons are done and which come next. But it does not yet keep a list of what a person can do. That is the first of the three things, and we do not have it. We wrote that down with a date to look at it again.

THIS WEEK.

Write two things you can already do.

Ask someone what you could learn next.

Ask a person who knows it to let you work next to them for an hour.

Jesus is the Lamb of Yahweh, [[John 1:29]] Yahweh's own Son. [[John 3:16]]

${TALK.youth}`,

    teen: `WHAT IS THAT IN THINE HAND - CAPABILITY ANXIETY, THE PATH A LEADER OWES, AND THE ONE WHO TEACHES.

No one taught this as a class. Darrell sent a newsletter into the lesson lane with one word on top: Lesson. The man who wrote it runs SHRM, a big group for HR people. He says a new worry is growing at work. He calls it capability anxiety. It is the fear that your skills will not matter soon, and not knowing what to learn next.

His fix is plain. He says the employer has to build a path. And he says that path needs three things. A clear view of the skills people have now. A way to see the jobs they could grow into. And managers who have time to coach.

${BLOCKED_TEEN}

So we test his three things with the Word. All three are there. And the Word adds one more that no boss can give you.

PART ONE. AN OLD FEAR.

This fear is not new, and Moses had it long before anyone gave it a name. [[Exodus 4:10]]

Jeremiah had it. [[Jeremiah 1:6]]

Solomon had it, even as a king. [[1 Kings 3:7]]

Each of them was about to get a job he had never done before, and each one said, in his own way, I cannot. If you feel that way about your future, you are in very good company.

PART TWO. LOOK AT THE HAND FIRST.

Yahweh asked Moses one thing before giving him a plan. [[Exodus 4:2]]

It was a shepherd's stick, and Moses may have thought his forty years with sheep were wasted. But Yahweh told him to take that same stick along. [[Exodus 4:17]] The old skill was part of the new job.

You have gifts too. They were given to you already. [[1 Peter 4:10]] Yours are not the same as your friend's. That is the point. [[Romans 12:6]]

At work, they call a list of who can do what a skills matrix. It is a good tool. But the question came from the Word first.

PART THREE. SHOW THE PATH.

Jethro told Moses to show people the way to walk and the work to do. [[Exodus 18:20]]

This is the second thing. A leader who keeps the next step in his head has not shown it. You cannot walk toward a step you cannot see. Yahweh shows us our way. [[Psalms 32:8]]

People at work call this career pathing. Same idea.

PART FOUR. TIME TOGETHER.

Jesus picked twelve. Then He kept them with Him. Only after that did He send them. [[Mark 3:14]]

Years later, leaders saw that these men had no degrees. But they saw one thing clearly. They had been with Jesus. [[Acts 4:13]]

He told them up front that He would make them. [[Matthew 4:19]] And He said a trained student ends up like his teacher. [[Luke 6:40]]

Joshua served Moses for a long time. [[Exodus 24:13]] Then Yahweh told Moses to charge him, encourage him and make him strong. [[Deuteronomy 3:28]] Elisha did the same with Elijah. He left his oxen and served. [[1 Kings 19:21]]

The industry calls this coaching, mentoring, or a succession plan. In the Word it is simply being with someone.

PART FIVE. HOW YAHWEH ANSWERED THE FEAR.

He did not mock Moses. He reminded him who made the mouth. [[Exodus 4:11]] Then He promised to be there and to teach him. [[Exodus 4:12]]

Then Moses asked Him to send someone else. [[Exodus 4:13]] That is when Yahweh got angry. [[Exodus 4:14]]

Do you see the line? Fear got a promise. Saying no to the promise got anger. And even so, Yahweh kept teaching. [[Exodus 4:15]]

PART SIX. WHAT A BOSS CANNOT GIVE.

A good path helps with the job. It does not fix the deeper fear: am I enough? The Word answers that. We are not enough on our own. [[2 Corinthians 3:5]] Yahweh is the One who makes us able. [[2 Corinthians 3:6]] Fear is not His gift to us. [[2 Timothy 1:7]]

He told Jeremiah not to say he was too young. [[Jeremiah 1:7]] He told Joshua to be brave, because He goes along. [[Joshua 1:9]]

Do today's work today. [[Matthew 6:34]] Pray about the rest. [[Philippians 4:6]] And copy Solomon. He asked for a heart that understands. [[1 Kings 3:9]]

PART SEVEN. KEEP GROWING.

Tools will keep changing. Jesus will not. [[Hebrews 13:8]] He grew in wisdom as a boy. [[Luke 2:52]] Wise people keep learning. [[Proverbs 1:5]] And a good worker gets noticed. [[Proverbs 22:29]]

WHAT THE COLUMN GETS RIGHT.

The column is right that a lot of people are worried right now. Many teens hear that new tools, including the computer programs that can write and talk, will change the jobs they planned on. That worry is real, and pretending it is not would not help you. But notice what the column says the deeper worry is. It is not only that work will change. It is whether anyone will help you get ready for it. That is a fair worry, and the Word takes it seriously, because the first answer Moses got was not a speech. It was a promise to teach him.

So if you are worried about your future, you are allowed to ask for help. In fact, asking is part of the plan. Find people who know the work you want to do, and ask if you can watch them, help them, or work next to them for a while.

WHAT YOU CAN DO WHILE YOU WAIT.

You do not need to know your whole career at sixteen. Moses was eighty when he got his. What you can do now is notice what is in your hand. Maybe you are good with people, or with numbers, or with tools. Write it down. Ask a parent or a teacher what they see in you, because other people often see our gifts before we do.

Then pick one thing to learn this month, and find one person to learn it from. That is a path, even if it is a short one, and a short path you can see is better than a long one you cannot.

WHEN YOU ARE THE ONE AHEAD.

Someone younger is watching you right now, whether you know it or not. It might be a little brother, a new kid on the team, or a younger student at church. You can do for them what this lesson asks of bosses. Tell them what they already do well. Show them the next step. Then stay with them while they try it, and do not take over when they are slow.

Paul told Timothy to pass on what he had learned to faithful people who could teach others too. [[2 Timothy 2:2]] That is how one person's skill outlives him.

THE HOUSE IS BUILT IN ORDER.

Proverbs says a house is built through Wisdom and made firm by Understanding. [[Proverbs 24:3]] Then Knowledge fills the rooms. [[Proverbs 24:4]] Skills belong to Knowledge. They matter, but they come third. A person with many skills and no Wisdom fills a house that has a weak frame.

OUR APP, TOLD STRAIGHT.

Our app shows how many lessons you have done and what is next. That is a path you can see. But it does not know what you can already do. That is the first of the three things, and we do not have it yet. We wrote it down with a date to come back to it.

THIS WEEK.

Write two things you can already do well.

Ask someone what you could grow into next.

Find one person who knows it, and work beside them for an hour.

Jesus is the Lamb of Yahweh, [[John 1:29]] His only Son. [[John 3:16]]

${TALK.teen}`,

    senior: `WHAT IS THAT IN THINE HAND - CAPABILITY ANXIETY, THE PATH A LEADER OWES, AND THE ONE WHO TEACHES.

No one taught this hour as a class. On 2026-10-29 Darrell forwarded a LinkedIn column from his university mailbox with one word above it, Lesson. It came from Johnny C. Taylor, Jr., who leads SHRM, the large society for people who run the human side of workplaces. He writes about a worry he says is spreading through the workforce. He calls it capability anxiety: not knowing whether your skills will still count a year from now, or which ones will, or where to spend your effort.

His answer is that the employer owes the worker a path. The path, he says, takes three things: a clear picture of the skills a person already has, visible information about the roles he could grow into, and managers with enough time to coach.

${BLOCKED_SENIOR}

That leaves us one worry and one prescription. The prescription is his own judgment, and it is worth weighing. Weighed against the Word, all three of his things are there, and the Word adds a fourth that no employer can give.

THE WORRY IS AN OLD ONE.

Anyone who has watched a trade change under him knows this fear. So did Moses. [[Exodus 4:10]] Note the middle of it: neither heretofore, nor since thou hast spoken. Even the call had not made him feel ready.

Jeremiah felt too young. [[Jeremiah 1:6]] Solomon, already crowned, did not know how to come and go. [[1 Kings 3:7]] These are three of the men Yahweh used most, and all three began with the same doubt.

THE INVENTORY COMES FIRST.

Before any instruction, Yahweh asked a question. [[Exodus 4:2]] The answer was a rod, the plain tool of forty years in the wilderness that Moses may well have counted as lost time. And Yahweh told him to carry that same rod into the new work. [[Exodus 4:17]]

A leader who starts with what a person lacks tells him his past does not count. A leader who starts with what is in his hand tells him it does. Peter says the gift is already received. [[1 Peter 4:10]] Paul says the gifts differ. [[Romans 12:6]] Different is not missing.

The trade name for this is a skills inventory, or a skills matrix. The Word asked first.

THE WAY MADE PLAIN.

When Moses was wearing himself out, Jethro told him to show the people both the road and the work at the end of it. [[Exodus 18:20]] Showing is the leader's job. A next role that lives only in a supervisor's head cannot be walked toward. Yahweh leads His own that way. [[Psalms 32:8]]

Workplaces call it career pathing, or a development plan.

TIME SPENT BESIDE THEM.

This is where the Word asks more than the column does. The twelve were ordained first to be with Him, and only then to be sent. [[Mark 3:14]] Years later the rulers could find no schooling in Peter and John, but they could see one thing. [[Acts 4:13]] The call itself carried the promise to train them. [[Matthew 4:19]] And a student fully trained becomes like his teacher. [[Luke 6:40]]

Succession in the Word took years. Joshua was Moses' minister long before he led. [[Exodus 24:13]] At the hand-over Moses was told to charge him, encourage him and strengthen him, not merely to appoint him. [[Deuteronomy 3:28]] Elisha left his oxen and served Elijah for years. [[1 Kings 19:21]]

The industry speaks of coaching, mentoring and succession planning, and PMBOK names developing the team as part of the manager's work. All of it is Mark 3:14.

HOW YAHWEH MET THE FEAR.

He did not scold it. He reminded Moses who made the mouth. [[Exodus 4:11]] Then He gave a promise that is also a training plan: presence and teaching in one sentence. [[Exodus 4:12]]

Read on, though. Moses then asked Him to send someone else. [[Exodus 4:13]] The anger comes there, at verse 14, not at verse 10. [[Exodus 4:14]] Fear was met with a promise. Refusing the promise was a different matter. And even then Yahweh went on teaching both brothers. [[Exodus 4:15]] Those of us who lead should take both halves: meet fear with help, never contempt, and keep teaching even when help is turned down.

WHAT NO EMPLOYER CAN GIVE.

A career path speaks to the worry about next year's job. It cannot touch the worry beneath it, whether I am enough. The Word speaks to that one plainly. [[2 Corinthians 3:5]] [[2 Corinthians 3:6]] He makes us able. And He gave a sound mind, not fear. [[2 Timothy 1:7]]

To Jeremiah: [[Jeremiah 1:7]] To Joshua: [[Joshua 1:9]] For tomorrow: [[Matthew 6:34]] For the worry itself, a prayer with thanks in it: [[Philippians 4:6]] And Solomon's request is the right one for anyone afraid his skills will not keep up. [[1 Kings 3:9]]

THE TOOLS CHANGE; THE TEACHER DOES NOT.

Many of us have learned three or four trades' worth of tools in one working life. The One we serve has not changed once. [[Hebrews 13:8]] Isaiah says even a farmer's skill is taught to him by Yahweh. [[Isaiah 28:26]] A wise man keeps adding to his learning at every age. [[Proverbs 9:9]] Diligence still stands before kings. [[Proverbs 22:29]] And Wisdom, Understanding and Knowledge are the Resources that build the house. [[Proverbs 24:3]]

FOR THOSE OF US NEAR THE END OF OUR WORKING YEARS.

Many who read this band have more years behind them at work than ahead. That does not take you out of this lesson. It puts you at the centre of the third thing. The column asks for managers with time to coach, and the people with the most time and the most knowledge are often the ones who have just retired. Moses' last great work was not a sign or a wonder. It was preparing Joshua. And Paul's last letter is full of instructions to Timothy about handing on what he had been given. [[2 Timothy 2:2]]

So ask who in your church, your family or your old trade could still learn from you. Do not wait to be asked; the young are often too shy or too proud to ask. Go to them. Begin with what is in their hand, tell them plainly what they already do well, show them one next step, and then give them your time.

And if the worry in this lesson is your own - if the tools have changed past you, if the forms are all online now and the bank wants an app on a phone - then the same Word answers you. Start with what is in your hand. Ask someone younger to sit with you, and let them. Pride is the only thing that makes that harder than it needs to be. There is no shame in being taught at any age. Solomon was already king when he asked to understand.

WHAT THIS HOUSE HAS, AND HAS NOT.

The app shows each learner the lessons finished and the ones ahead, and it marks finished study with crowns. That is a visible way for coursework. It holds no record of what a person can already do with his hands or his trade. That is the first of the three things, and we do not have it. It is written down, with a date to look again.

THIS WEEK.

Write two things each person you lead can already do. Ask if you do not know.

Show each of them one piece of work they could grow into.

Spend one real hour beside one of them, doing the work.

The One who makes us able is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]]

${TALK.senior}`,
  },

  facilitator: {
    howToRun:
      'Run this alone, or with the person who handed you the project, in about an hour. OPEN WITH THE ADMISSION, not with the column: say out loud that the email is a teaser, that the rest of the column was never read, and that neither report it names was opened, so no figure from either is taught. THEN read Exodus 4:10 and Exodus 4:2 aloud and ask one question before any teaching: what did Yahweh ask first? Let the room find it - the hand, not the gap. Work the three things in order - the hand (Exodus 4:2, 4:17), the way (Exodus 18:20), the time (Mark 3:14, Acts 4:13) - and name the industry term for each only after the Word has been read. Spend real time on Exodus 4:13-15, because the line between fear and refusal is the part most leaders get wrong in both directions. Close on 2 Corinthians 3:5-6 and the page from the inApp section, filled in for real people by name.',
    talkingPoints: [
      'Say first what was not read. The email is the opening of a column and nothing more; the rest was never read and both reports it names sat behind sites that would not open. Nothing here is attributed to them, and the date we try again is written in the lesson.',
      'Exodus 4:2 is an inventory before an instruction. Yahweh asked what Moses already had before He told him what to do. Ask your people the same question before you hand them a gap.',
      'Exodus 4:17 carries the old tool into the new work. A change that throws away everything a person knew tells him his years did not count. The rod went with him.',
      'Exodus 18:20 makes the path visible: the way to walk AND the work to do. If the next step lives only in your head, you have not shown it.',
      'Mark 3:14 puts being with Him before being sent, and Acts 4:13 records the only credential anyone could see. Coaching is measured in time beside a person, not in content delivered to him.',
      'Deuteronomy 3:28 makes succession three verbs - charge, encourage, strengthen - and Exodus 24:13 shows it took years. Appointing someone is not the same as preparing him.',
      'Exodus 4:13-15 draws the line: fear met with a promise; refusal after the promise kindled the anger; teaching continued anyway. Meet fear with help. Parents, sit with your children this week and ask what they are afraid they will not be ready for, and listen all the way to the end before you teach.',
      '2 Corinthians 3:5-6 is the part no employer can supply. A path answers the worry about the job; only Yahweh answers the worry about being enough. Teach both, and do not let the first stand in for the second.',
    ],
    discussionPrompts: [
      'Name the people you lead, by name, and for each say two things they can already do well. Where you could not answer, what does that tell you about where you started with them - the hand or the gap?',
      'For one of those people, what is the next piece of work they could grow into, and do they know it exists? If not, when will you show them?',
      'Children, ask your mom, your dad or a grandparent who took the time to teach them their work, and how long it took. Then tell a friend one thing this hour showed you, ask what they are afraid of not being ready for, and pray one for another.',
    ],
  },

  quiz: {
    questions: [
      {
        q: 'What was the forwarded email, exactly, and how much of it was read?',
        options: [
          'A full research report from WTW, read in full',
          'The opening of a LinkedIn column by the head of SHRM that stops at Keep reading on LinkedIn - the rest was never read, and neither report it names was opened because both sites were shut to this session. re-review: 2026-11-27',
          'A sermon transcript about work',
          'A government labour statistics release',
        ],
        answer: 1,
        explain:
          "Gmail thread 1a1892ae1e2618e8, forwarded 2026-10-29 at 18:29 UTC with one word, Lesson. The email is a teaser, so the lesson tests the author's stated prescription against the Word and teaches no figure from either report. A shut road must never read like a verified fact.",
      },
      {
        q: 'What did Yahweh ask Moses BEFORE giving him any instruction (Exodus 4:2)?',
        options: [
          'Whether he was willing to go',
          'What he lacked for the task',
          "What was in his hand - and the answer, a plain shepherd's rod, became the instrument of the whole commission (Exodus 4:17)",
          'Whether he had told his family',
        ],
        answer: 2,
        explain:
          "The inventory comes before the instruction. That is the column's first thing - a clear picture of the skills people already have - and the Word puts it first too. The old tool was carried into the new work, not thrown away.",
      },
      {
        q: "Which verse gives the column's SECOND thing - visible information about the work a person could grow into - almost word for word?",
        options: [
          'Exodus 18:20 - shew them the way wherein they must walk, and the work that they must do',
          'Proverbs 22:6 - train up a child',
          'Ecclesiastes 9:10 - whatsoever thy hand findeth to do',
          'Genesis 2:15 - to dress it and to keep it',
        ],
        answer: 0,
        explain:
          "Jethro's counsel makes two things visible: the road and the work at the end of it. Shewing is the leader's verb. A next step that lives only in the leader's head has not been shown.",
      },
      {
        q: 'According to Mark 3:14, what came FIRST for the twelve?',
        options: ['Being sent out to preach', 'Being with Him - the sending came after', 'Passing an examination', 'Receiving written instructions'],
        answer: 1,
        explain:
          'That they should be with Him, and that He might send them forth. The order is the method. Acts 4:13 records the result: unlearned and ignorant men, recognised because they had been with Jesus.',
      },
      {
        q: 'In Exodus 4, where is the anger of Yahweh kindled against Moses?',
        options: [
          'At verse 10, when Moses says he is not eloquent',
          'At verse 2, when Moses answers that he holds a rod',
          'At verse 14, after Moses asks Him to send someone else - the refusal after the promise, not the fear before it; and even then Yahweh kept teaching both brothers (Exodus 4:15)',
          'Nowhere in the chapter',
        ],
        answer: 2,
        explain:
          'Fear at verse 10 is answered with a promise to teach at verse 12. The refusal at verse 13 is what kindles the anger at verse 14. A leader should meet fear with help, never contempt - and keep teaching anyway.',
      },
      {
        q: 'What three verbs does Deuteronomy 3:28 give Moses about his successor?',
        options: [
          'Test him, rank him, replace him',
          'Charge him, encourage him, strengthen him',
          'Hire him, train him, review him',
          'Watch him, warn him, release him',
        ],
        answer: 1,
        explain:
          "Succession in the Word is preparation, not appointment, and it took years - Joshua is Moses' minister already at Exodus 24:13. The industry calls this succession planning; the Word wrote it as a command.",
      },
      {
        q: 'What is the one thing this lesson says no employer can supply?',
        options: [
          'A clear picture of current skills',
          'A visible career path',
          'Sufficiency itself - not that we are sufficient of ourselves, but our sufficiency is of Yahweh, who also hath made us able (2 Corinthians 3:5-6)',
          'Time with a coach',
        ],
        answer: 2,
        explain:
          "The three things answer the worry about tomorrow's job. They cannot answer the deeper worry, whether I am enough. The Word answers that one, and gives a spirit not of fear but of power, of love and of a sound mind (2 Timothy 1:7).",
      },
      {
        q: 'Measured from the code, which of the three things does this platform NOT yet hold for its own people?',
        options: [
          'A visible path through its lessons',
          'A record of finished study',
          'A picture of what a person can already DO - no skills inventory exists anywhere in the app; named, with a date to look again',
          'Any lessons at all',
        ],
        answer: 2,
        explain:
          "The app shows done, total and a percentage for each course (church-classes.js lines 453 to 456) and awards crowns for study (course-crowns.js). It does not hold a picture of anyone's working skills. The lesson says so rather than claiming the platform already practises what it teaches.",
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

if (!readerRefs.length) throw new Error('pm18: no references were found in the reader places');
for (const r of readerRefs) verseText(r);

// Every reader place carries the close and the blocked road (DR-0795 / DR-0076 §8).
for (const place of READER_PLACES) {
  const text = place === 'lesson' ? filled.lesson : filled.levels[place];
  if (!/TALK ABOUT IT TOGETHER/.test(text)) throw new Error(`pm18: ${place} has no TALK ABOUT IT TOGETHER`);
  if (!/re-review: 2026-11-27/.test(text)) throw new Error(`pm18: ${place} has no dated blocked-road note`);
}

if (process.argv.includes('--dry-run')) {
  process.stdout.write(JSON.stringify(filled));
  process.exit(0);
}

const src = readFileSync(COURSE, 'utf8');
if (src.includes(ID)) throw new Error('pm18: the id is already in the course; refusing to rebuild');

const OPEN = 'export const PROJECT_MANAGEMENT_MODULES = [';
const open = src.indexOf(OPEN);
if (open < 0) throw new Error('pm18: the modules array was not found');
const end = src.indexOf('\n];', open);
if (end < 0) throw new Error('pm18: the modules array is not closed');

const block = JSON.stringify(filled, null, 2)
  .split('\n')
  .map((l) => `  ${l}`)
  .join('\n');

// The array may or may not already carry a trailing comma; a second one would
// open a hole in the array and the course would serve `undefined` as a lesson.
const tailHasComma = /\}\s*,\s*$/.test(src.slice(0, end));
const next = tailHasComma ? `${src.slice(0, end)}\n${block},${src.slice(end)}` : `${src.slice(0, end)},\n${block}${src.slice(end)}`;

const weeks = (text) => [...new Set([...text.matchAll(/["']pm(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src);
if (before.includes(WEEK)) throw new Error(`pm18: week ${WEEK} is already taken`);
const after = weeks(next);
if (after[after.length - 1] !== WEEK) throw new Error(`pm18: week ${WEEK} is not the top of the course after splicing`);
if (next.split(`"${ID}"`).length - 1 !== 1) throw new Error('pm18: the new id did not land exactly once');

// meta.weeks is a getter over PROJECT_MANAGEMENT_MODULES.length (DR-0677), so the
// header tracks the splice on its own; a literal here would be a second source of truth.
if (!/get weeks\(\) \{ return PROJECT_MANAGEMENT_MODULES\.length; \}/.test(next)) {
  throw new Error('pm18: meta.weeks is no longer derived from the module count; refusing to splice');
}

writeFileSync(COURSE, next);

console.log(`pm18: spliced ${ID}`);
console.log(`pm18: modules ${before.length} -> ${before.length + 1}; top week ${WEEK}; meta.weeks derived, now ${before.length + 1}`);
console.log(`pm18: ${readerRefs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
