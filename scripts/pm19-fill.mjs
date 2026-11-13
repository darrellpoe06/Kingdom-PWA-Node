// =============================================================================
// pm19-fill - build Project Management lesson 19 and splice it into the course
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076 / DR-0456 / DR-1468). Every
// quoted verse on this page is FILLED FROM app/public/bible/kjv at build time.
// The prose below holds only a reference in double brackets, [[1 Timothy 3:10]],
// and this script replaces it with the corpus text followed by the reference.
// No verse on the page was typed from memory. The reference list on the
// module's anchor is DERIVED from the placeholders that occur in the reader
// places, so anchor.ref names every verse the lesson stands on and nothing it
// does not (DR-0734). Same mechanism as scripts/pm18-fill.mjs.
//
// WHERE THE WORD CAME FROM. Gmail thread `1a1b17065b1eee52`. On 2026-11-06
// Darrell forwarded Western Governors University's LinkedIn digest, IgnitED:
// Reimagining Higher Ed, edition Proving Readiness in a Changing Job Market
// (sent 2026-11-04), out of his university mailbox TWICE. First at 15:18 UTC
// (9:18 AM Central) with one word above it: Lesson. Then six minutes later, at
// 15:24 UTC (9:24 AM Central), with the fuller copy of all three pieces pasted
// in and his note that it carried more of the material. Seven days stood
// between his word and this build.
//
// WHY PROJECT MANAGEMENT, AND WHY THIS SEAM (INTAKE-AND-FIT; DR-0610). The
// digest is about hiring, credentials and the path into work: a workforce and
// organization question, which INTAKE-AND-FIT routes to Project Management.
// The seam was chosen against the siblings, by measurement:
//   pm3  - the PROJECT names the skills it needs (Bezalel, 2 Timothy 2:2);
//   pm12 - a person's capability is shown in FRUIT, not titles (David and Saul,
//          1 Samuel 16:7, Matthew 7:20, 2 Corinthians 3:2);
//   pm18 - the WORKER'S FEAR of being unequal to the next work, and the three
//          things the leader owes him (Exodus 4:2, Exodus 18:20, Mark 3:14).
// None teaches the EVALUATOR'S question - how readiness is PROVED and WEIGHED
// when a polished page can be manufactured - nor the paid path where readiness
// is built inside the work. That is 1 Timothy 3:10 (first be proved), Daniel
// 1:12 (the candidate who asks for a ten-day trial), Acts 18:24-28 (the letter
// AND the work, and the gifted man taught more perfectly), Philippians 2:22
// (the proof of him), Hebrews 5:14 (judgment learned by reason of use), and
// 1 Timothy 5:18 (the labourer is worthy of his reward). A pin in the gate
// proves no sibling stands on 1 Timothy 3:10, Daniel 1:12 or Philippians 2:22.
//
// TRUST BUT VERIFY (DR-0100 / DR-0076 section 8). The second forward carries
// the full text of all three pieces as LinkedIn showed them, so this is NOT a
// teaser. What was not opened: the linked WGU report and the outside research
// the pieces cite. www.wgu.edu, www.weforum.org, www.linkedin.com and Craft
// Education's site were all refused by the proxy's CONNECT tunnel (403) from
// this session. Tiered:
//   DOCUMENTED AS AN EXPECTATION: the World Economic Forum's Future of Jobs
//     Report 2025 - employers expect 39% of workers' core skills to change by
//     2030. A search index of the WEF's own report page carries the figure; the
//     page itself was not opened. It is an employer expectation, not a count.
//   REPORTED BY WGU ABOUT ITS OWN SURVEY: the 2026 Workforce Decoded report,
//     3,100+ U.S. hiring professionals (a search index of WGU's own press
//     release of 2026-09-30 gives 3,128, fielded by Centiment, June 24 to July
//     7, 2026, and the title The Verification Gap: When AI Makes Skills Harder
//     to Prove): 60% say AI makes real skills harder to evaluate; 73% call
//     degrees important (68% a year earlier); 91% call certificates valuable
//     (86%); 43% increasing focus on skills over degrees; 76% say work
//     experience is worth as much as a degree or more; 53% investing in
//     work-based learning. WGU sells degrees and certificates; that is said
//     plainly, without suspicion, because honour is due where it is due.
//   REPORTED BY THE AUTHORS: WGU's own fiscal-2026 credential counts; Craft
//     Education's count of education apprentices; the North Carolina
//     superintendents' vacancy survey; the federal grant; Belen Martinez and
//     the Tennessee teacher assistant (testimony, told by the authors).
//   GIVEN WITHOUT A SOURCE in the piece: roughly one in three early-career
//     professionals in industries with medium-to-high AI exposure. Not taught
//     as fact; named as unsourced.
//   re-review: 2026-11-27 for every road that was shut.
//
// THE HOUSE'S OWN WITNESS, measured rather than invented: a course crown on
// this platform means every lesson read and its exam passed
// (app/src/lib/course-pace.js:223-231) - completion and an examination. The
// Project Management course's own Apply step shows Work it on a real project
// beside the lesson's inApp text (app/src/components/ChurchLearn.jsx:1555),
// and nothing in the learn surfaces records the work that was done. The one
// place this house keeps apprenticeship-shaped proof is the Practice's
// training-hours ledger - date, hours, competency and a supervisor of record
// (app/src/lib/practice-academy.js:302-313) - scoped to the TLC Practice.
//
// Recorded as DR-1496.
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const COURSE = join(ROOT, 'app', 'src', 'lib', 'project-management-course.js');

const WEEK = 19;
const ID = 'pm19-let-these-also-first-be-proved';
const PREV = 'pm18-what-is-that-in-thine-hand';
const TITLE = 'Let these also first be proved - proof of readiness, the letter and the trial, and the apprentice down the hall';

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
  if (!m) throw new Error(`pm19: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`pm19: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`pm19: reference does not resolve in the corpus -> "${ref}"`);
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
// band still gets the shut roads, their date, and all three directions (DR-0795).
// -----------------------------------------------------------------------------
const BLOCKED_ADULT =
  "WHAT WE COULD NOT CHECK AT THE SOURCE. We hold all three pieces whole, from the fuller copy he sent second. We did not open what they point to: the sites of WGU, the World Economic Forum, LinkedIn and Craft Education were refused by our network. A search index of the Forum's own report page carries its figure, and of WGU's own press release the survey's size, dates and title, The Verification Gap; neither page was opened. So each figure is taught at its tier: the Forum's is an expectation employers gave, WGU's are WGU reporting its own survey, and one figure the first piece gives with no source is named and not taught. A shut road must never read like a verified fact. re-review: 2026-11-27.";

const BLOCKED_SENIOR =
  "WHAT WE COULD NOT CHECK AT THE SOURCE. We hold all three pieces in full, because the second forward carried them. We did not open what they point to. The sites of the university, the World Economic Forum, LinkedIn and the apprenticeship group would not open from our network. A search shows the Forum's own page with its figure and the university's own press release with the size and dates of its survey, but we did not read either page itself. So every number in this hour is told as what it is: a forecast employers gave, or a university reporting its own survey. One number in the first piece names no source at all, and we do not teach it as fact. A road we could not walk is never written up as a thing we checked. re-review: 2026-11-27.";

const BLOCKED_TEEN =
  "WHAT WE COULD NOT CHECK. We have all three pieces, but not the reports they point to. The sites were shut to our network. A search shows the numbers on the reports' own pages, but we did not open those pages. So when we give a number, we say who reported it. One number came with no source, so we do not teach it. A door we could not open is not a thing we checked. re-review: 2026-11-27.";

const BLOCKED_YOUTH =
  'WHAT WE COULD NOT CHECK. We read all three parts of the letter. But they point to reports, and we could not open those. The sites were shut to us. So we say who gave each number, and we do not act like we checked it. One number had no source at all, so we leave it out. re-review: 2026-11-27.';

const BLOCKED_CHILD =
  'WHAT WE DID NOT GET TO READ. We read the whole letter. But it talked about some reports. We tried to open them. We could not. So we do not say we know what is in them. Saying we know would be a lie. re-review: 2026-11-27.';

const RHYTHM =
  'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at lying down, or at rising up - and with one friend this week.';

const GROWTH =
  "And measure the growth the Word's way, by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days. [[Hebrews 3:13]]";

const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, sit down with one of your children today and ask them one open question - what is one thing you have made or done that you are proud of, and how would someone know you can do it - and listen all the way to the end before you add a word; have them retell it in their own words, then teach them one verse back, 1 Timothy 4:12. Children, ask your mother, your father or a grandparent how they first showed somebody they could do their work, who believed them, and what it cost that person to give them the chance; hear the whole account before you answer, then retell their story back to them in your own words. Then ask a friend this: what work could you show me this week instead of telling me about it. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one question today: what is one thing you made that you want me to see? Look at it with them. Listen to the whole answer first. Then have them say it back in their own words, and teach them one verse, 1 Timothy 4:12. Children, ask your mom, your dad or a grandma about the first job they ever had. Who gave them the chance? How did they show they could do it? Listen to all of it. Then say their story back in your own words. Then ask a friend this: can you show me something you are good at? Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what is one thing you can do that you could show me, not just tell me - and let them finish before you answer; have them retell the answer in their own words, then teach them one verse, Daniel 1:12. Children, ask your mom, your dad or a grandparent about the first time somebody let them try real work, and how they proved they could do it; hear all of it before you reply, then retell it in your own words. Then ask a friend this: what could we each practise this week so it shows. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - if a boss could not trust your resume, what work could you show instead - and listen all the way through instead of answering it for them; have them retell their own answer in their own words, then teach them one verse, 1 Timothy 3:10. Children, ask your mom, your dad or a grandparent who first gave them a real chance at work, how they earned it, and whether they were paid while they learned; hear the whole of it before you reply, then retell their answer in their own words. Then ask a friend this: what is one thing you could build this month that proves what you know. Teach each other one verse. ${RHYTHM} ${GROWTH}`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, sit with your grandchildren and ask them what they want to be ready for, and hear the whole answer before you offer a word of advice; then have them retell it in their own words and teach them one verse, Philippians 2:22. Ask your own mother or father, where they are still living, who first took them on to learn a trade, and how they knew they were ready. And tell a friend about one younger person you could vouch for because you have seen their work, ask them who that person is for them, and pray one for another. ${RHYTHM} ${GROWTH}`,
};

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const MODULE = {
  id: ID,
  title: TITLE,

  bigIdea:
    "WHO TAUGHT THIS: NOBODY. No teacher, no recording, no Bible study. Gmail thread 1a1b17065b1eee52 - Western Governors University's LinkedIn digest, IgnitED: Reimagining Higher Ed, the edition called Proving Readiness in a Changing Job Market, sent 2026-11-04. Darrell forwarded it out of his university mailbox twice on 2026-11-06: first at 15:18 UTC (9:18 AM Central) with one word above it, Lesson, and again at 15:24 UTC (9:24 AM Central) with the fuller copy of all three pieces and his note that it carried more of the material. Seven days stood between his word and this build. The three pieces say: the rungs of the career ladder are moving and the first one is becoming a leap; employers find a polished page harder to trust and want proof of readiness, and they are not choosing between credentials and capability; and a degree apprenticeship lets a worker earn a paycheck while earning the degree. The Word had all of it first. Let these also first be proved (1 Timothy 3:10). Daniel asked for a ten-day trial and was examined in person after three years of training. Apollos carried a letter AND did the work, and was taught more perfectly on the way. Timothy was found where he already was, well reported of, and proved by serving beside. Judgment is learned by reason of use, and the labourer is worthy of his reward. The reports the pieces cite sat behind sites that would not open, so every figure is taught at its tier. re-review: 2026-11-27.",

  anchor: {
    ref: '',
    theme:
      "PROVE FIRST, THEN THE OFFICE. AND NEVER ONLY ONE SIGNAL.\n\nThe digest's whole claim fits in one sentence: employers want proof of readiness, and they will use every credible signal to get it. The Word wrote the order down long before any employer: let these also first be proved; then let them use the office. And it never weighed a man on one signal. Daniel came with credentials - skilful, cunning in knowledge, able to stand in the king's palace - and with three years of training, and still asked for a ten-day trial, and was still examined in person by the king. Apollos came eloquent and mighty in the Scriptures, carried a letter from the brethren, and was still taken aside by a tentmaking couple and taught the way more perfectly - and then the work showed it. Timothy had no letter at all at first; he had a good report from the people who had watched him, and then years of serving beside Paul, until Paul could write, ye know the proof of him.\n\nA polished page was never proof. The man who boasts of a false gift is clouds and wind without rain, and the one girding on his armour does not boast like the one taking it off. What proves readiness is use: senses exercised by reason of use, a profiting that appears to all. So the leader's work is double - weigh every credible signal, and make the path where use is possible, paid, as the ox treads the corn unmuzzled. And over all of it stands the one approval no proof can earn and no page can fake: a workman approved unto Yahweh, saved by grace and not of works, and created unto good works that were ordained before he walked in them.",
  },

  inApp:
    "No new screens this week. What changes is one page you write by hand, and it takes about an hour. FIRST, THE WORK, NOT THE PAGE. Think of the next person you will choose for something - a hire, a volunteer lead, a crew foreman on a rehab, the child who wants the bigger chore. Write down the ONE piece of real work that would show you they are ready, small enough to do in ten days or less. Daniel 1:12 asked for exactly that. Then ask for it, and look at it yourself rather than only reading about it. SECOND, EVERY CREDIBLE SIGNAL. Beside that person's name write three columns: the letter (degrees, certificates, references), the report (what the people who have watched them work say), and the trial (what you saw them do). If one column is empty, you are deciding on one signal. THIRD, YOUR OWN PROOF. Write one thing you claim you can do, and then the one piece of work anyone could look at that shows it. If you cannot name the work, that is your next ten days. FOURTH, DOWN THE HALL. Write the name of one person already near you - in your house, your church, your crew, your office - who could grow into work you need done. Write what they would need to learn, who would teach them beside the work, and how they would be paid or provided for while they learn. Bring the page to the person who handed you the project.",

  benefits: [
    'You get the order the Word set for any appointment, and it is short: let these also first be proved; then let them use the office (1 Timothy 3:10). Proof comes before the role, not after it, and lay hands suddenly on no man (1 Timothy 5:22) is the brake on rushing it.',
    "You get a worked case of every credible signal at once, in one chapter: Daniel's credentials (Daniel 1:4), three years of training (Daniel 1:5), a ten-day trial the candidate himself proposed (Daniel 1:12), and an examination in person by the one who would rely on him (Daniel 1:19-20). The digest says employers use every signal they can get. Daniel 1 shows what that looks like.",
    "You get the end of the false choice between credentials and capability. Apollos carried a letter from the brethren (Acts 18:27) AND mightily convinced in public (Acts 18:28). Phebe carried Paul's commendation, and the commendation was a record of her work - a succourer of many (Romans 16:1-2). The Word never chose; it used both.",
    'You get the test for a polished page that the Word gave long before anyone could generate one: whoso boasteth himself of a false gift is like clouds and wind without rain (Proverbs 25:14), and let not him that girdeth on his harness boast himself as he that putteth it off (1 Kings 20:11).',
    "You get the answer to the digest's hardest question - where do new workers learn judgment if the first rung disappears? The Word says judgment is learned by reason of use (Hebrews 5:14). Whoever removes the use owes another way to get it, and the young are told plainly, let no man despise thy youth (1 Timothy 4:12).",
    'You get the oldest apprenticeship there is, and the pay that goes with it: the trade in the house (Mark 6:3), the teacher as the scholar serving in the same rotation (1 Chronicles 25:8), the ox that eats while it treads (Deuteronomy 25:4), and the labourer worthy of his reward (1 Timothy 5:18).',
    'You get the approval no page can fake and no proof can buy: a workman approved unto Yahweh (2 Timothy 2:15), saved by grace and not of works (Ephesians 2:8-9), created unto the good works he then walks in (Ephesians 2:10). Readiness for work is proved. Standing before Yahweh is a gift.',
    "You get what the industry calls these shapes, in its right place - second, as their words: work-sample test, skills-based hiring, reference check, probationary period, stackable credential, credit for prior learning, registered apprenticeship and degree apprenticeship. Each is a good name for a shape Daniel 1 and Acts 18 already gave.",
    'You get a lesson that tells you plainly what it could not check. Every figure is taught at its tier - a forecast employers gave, or a university reporting its own survey - one unsourced figure is named and left untaught, and the date we try the shut roads again is written where you can hold us to it.',
  ],

  stories: [
    {
      kind: 'parable',
      tone: 'serious',
      title: 'The Best Application in the Stack',
      body: "A church in a small town needed someone to run the books for its building fund, because the old treasurer was moving to be near her grandchildren. Three people applied. The board met on a Thursday to read the applications.\n\nOne of them was beautiful. It was a full page, cleanly set, with words like stewardship and reconciliation and accountability in all the right places. It listed a certificate in bookkeeping from an online course. The board read it aloud and two of them nodded.\n\nThe second was a short note from a man who had kept the books for his family's tire shop for nineteen years. It had a spelling mistake in the second line. The third was from a young woman who said she had no experience and would like to learn.\n\nThey chose the beautiful page. Nobody asked for anything else. It looked like enough.\n\nBy spring the fund was a mess. Gifts were posted to the wrong month. A pledge was counted twice. When the board finally sat down with the new treasurer, she admitted, embarrassed, that the page had been written with a tool that wrote it for her, the certificate had taken a weekend, and she had never reconciled a real account. She had wanted to help and had not known how much she did not know.\n\nThe man from the tire shop was never called back. When the pastor ran into him at the hardware store and apologised, the man only said one thing. You never asked me to show you anything.",
    },
    {
      kind: 'parable',
      tone: 'hopeful',
      title: 'Ten Days at the Tire Shop',
      body: "The next year the church across the river had the same need, and its deacon did one thing differently. Before he read a single page, he wrote down what the work actually was: reconcile a month of gifts, find the one that did not match, and write a one-page report the congregation could read.\n\nThen he asked all three applicants the same thing. Here is last March, with the names removed. Take ten days. Show me.\n\nThe woman with the certificate did it carefully and found one of the two errors. The man who had kept a family business's books for years found both in an afternoon and wrote the report in plain words. The young woman with no experience found neither, but she came back with three good questions about why the deposits and the pledges did not line up.\n\nThe deacon called the man's last two customers and the pastor of his old church, and both told him the same thing: he had been doing this quietly for years, and he was careful.\n\nSo the man got the books. And the deacon did one more thing. He asked the man to let the young woman sit beside him every Tuesday for a year, at a small stipend the church paid out of its budget, so she would not have to give up her shift at the grocery to learn.\n\nTwo years later she ran the books herself. When she applied for a bookkeeping job across town, she did not bring a beautiful page. She brought two years of reconciled months and a note from the man who had trained her. They hired her the same week.",
    },
  ],

  lesson: `LET THESE ALSO FIRST BE PROVED - PROOF OF READINESS, THE LETTER AND THE TRIAL, AND THE APPRENTICE DOWN THE HALL.

WHO TAUGHT THIS: NOBODY. There was no Bible study, no recording and no speaker. On 2026-11-06 Darrell forwarded a LinkedIn digest out of his university mailbox twice. The first time, at 15:18 UTC, 9:18 in the morning Central time, he typed one word above it: Lesson. Six minutes later he sent it again with the fuller copy pasted in and a note that it carried more of the material. The digest is Western Governors University's IgnitED: Reimagining Higher Ed, and the edition is called Proving Readiness in a Changing Job Market. Seven days stood between his word and this hour.

Here is what the three pieces say, in our words. The first, by the dean of WGU's School of Business, says the career ladder's rungs are moving: skills change fast, the first step into work is becoming a leap as machines take entry-level tasks, and learning must last a working life without becoming a luxury. The second, by a WGU vice president, says employers struggle to tell real capability from polished presentation, so they want proof of readiness - and they are not choosing between degrees and skills. The third, by the president of an apprenticeship company, says a degree apprenticeship lets a worker earn a paycheck while he earns the degree, with the learning on the job held to the same standard as coursework.

${BLOCKED_ADULT}

So the digest gives us a problem and a direction, and the direction is the thing worth testing. Test it against the Word and it is older than every university in it.

MOVEMENT ONE: THE POLISHED PAGE WAS NEVER PROOF.

WGU reports, from its own survey of more than 3,100 hiring professionals, that 60% say the new tools are making it harder to evaluate a candidate's real skills. Take that at its tier: a university reporting its own survey.

But the Word never weighed the page in the first place. [[Proverbs 25:14]] A false gift looks like weather and brings none. And Israel's king answered a boasting enemy with one of the shortest proverbs in Scripture: [[1 Kings 20:11]] The man putting his armour on has proved nothing yet. The man taking it off has.

And the plain rule underneath both: [[Proverbs 14:23]] The tools did not create the problem; they made an old one cheap.

MOVEMENT TWO: FIRST BE PROVED, THEN THE OFFICE.

When Paul set the standard for the men who would serve the church at Ephesus, he gave the order in one line: [[1 Timothy 3:10]]

First proved. Then the office. Not the office first and the proof hoped for later. And he put a brake on the hurry that skips it: [[1 Timothy 5:22]] Lay hands suddenly on no man. A quick appointment makes the one who appoints a partner in whatever follows.

What the industry calls it, second, as their words: a probationary period, a work-sample test, skills-based hiring. Good tools, all of them. The order is older.

MOVEMENT THREE: PROVE THY SERVANTS TEN DAYS.

Daniel 1 is a hiring case, and it uses every signal the digest names. The candidates came with credentials: [[Daniel 1:4]] Skilful, cunning in knowledge, able to stand in the palace. They were given formal training at the king's expense: [[Daniel 1:5]] Three years.

Then Daniel proposed his own trial. [[Daniel 1:12]] [[Daniel 1:13]] Short, measurable, low in risk, and judged by the one who would answer for it. The steward agreed: [[Daniel 1:14]] And the result was visible: [[Daniel 1:15]]

Then the examination, in person, by the one who would rely on them: [[Daniel 1:19]] [[Daniel 1:20]] He did not read about them; he communed with them.

And look where the skill came from, because Daniel 1 says it plainly: [[Daniel 1:17]] The training was real, the trial was real, and the knowledge was given by Yahweh. Daniel did not prove that he was self-made. He proved what had been given.

WGU reports from the same survey that 73% of employers call degrees important and 91% call certificates valuable, both up from a year earlier, while 43% say they are increasing their focus on skills. WGU sells degrees and certificates, and it is reporting its own survey; say so, and honour the finding, because it matches Daniel 1. Employers are not choosing between credentials and capability. Neither did Nebuchadnezzar.

WGU also counts more than 50,000 short credentials finished with it in fiscal 2026, and more than 10,000 of those learners going on to a degree - its own count, and Daniel's shape: a short proof before the larger commitment.

MOVEMENT FOUR: THE LETTER AND THE WORK.

Credentials are not a modern idea, and the Word does not despise them. When Apollos moved on to Achaia, he carried one: [[Acts 18:27]] And Paul wrote one for a woman named Phebe: [[Romans 16:1]] [[Romans 16:2]] The commendation is a record of work: a succourer of many.

But see how Apollos got to that letter. He arrived gifted: [[Acts 18:24]] He had been taught: [[Acts 18:25]] And he had a gap, knowing only the baptism of John. So two people with no title at all - Aquila and Priscilla, who made tents for a living - did something about it: [[Acts 18:26]] The gifted man kept learning after his schooling, from the people near him. Then the work showed it: [[Acts 18:28]]

Paul confesses the same continuous learning of himself: [[Philippians 3:12]] And the ear of the wise keeps seeking: [[Proverbs 18:15]]

Now set Timothy beside Apollos, because he came the other way. He had no letter at first. He had a report from the people who had watched him: [[Acts 16:2]] Then years of serving beside Paul, until Paul could write to a whole church: [[Philippians 2:22]] Ye know the proof of him. Not a page about him. Him, watched. Paul says the same of another brother: [[2 Corinthians 8:22]] Proved diligent, and often.

What the industry calls these, as their words: a credential, a reference check, a portfolio. The Word kept all three, and the strongest of them is the one written by the person who worked beside you.

MOVEMENT FIVE: SHOW ME BY THY WORKS.

The second piece says the best hire is the one who can show their work. James said the principle about something weightier than a job: [[James 2:18]] What is real inside is shown outside. John says it about love: [[1 John 3:18]] And Paul tells the young Timothy how his growth should be measured: [[1 Timothy 4:15]] That thy profiting may appear to all. Not claimed. Seen.

The piece tells of Belen Martinez of Lubbock, Texas, who helped one McDonald's franchise grow from five restaurants to twelve, earned a leadership certificate, and now leads more than two hundred managers. That is WGU telling its own student's story - testimony, not a study - and its point is the Word's: learning that shows up in performance.

And the third piece says the goal is never credit for simply showing up; learning on the job must be assessed against the same standard as coursework. The Word puts every builder under one test: [[1 Corinthians 3:13]] Of what sort it is. Not how long it took, and not who built it. The fire is the same for the apprentice and the graduate.

MOVEMENT SIX: WHERE JUDGMENT IS LEARNED WHEN THE FIRST RUNG MOVES.

The first piece asks the hardest question in the digest. Entry-level work was where people learned how work gets done, with small mistakes at small cost. If machines take those tasks, where does a new worker learn judgment?

The Word names how judgment is learned: [[Hebrews 5:14]] By reason of use. Judgment grows only where it is used. So the answer is not a better class; it is use, somewhere. Whoever automates the first rung owes the young another place to get it.

The first piece cites the World Economic Forum: employers it surveyed expect 39% of workers' core skills to change by 2030. That is a forecast employers gave, not a count, and a search index of the Forum's own report page carries it. The same piece says roughly one in three early-career workers are in fields heavily exposed to these tools, and gives no source; we do not teach that number.

And to the young asked to contribute sooner: [[1 Timothy 4:12]] Youth is not disqualifying; it is a reason to be given use.

MOVEMENT SEVEN: THE APPRENTICE DOWN THE HALL.

The third piece says the next teacher may already work down the hall, a teacher assistant who already knows the children. Paul found Timothy that way: [[Acts 16:1]] Behold, a certain disciple was there. Already there. And then: [[Acts 16:3]] Him would Paul have to go forth with him. The path ran through the work, with the master beside him.

It is the oldest pattern there is. The Word calls the Son of Yahweh the carpenter's son, [[Matthew 13:55]] and then the carpenter: [[Mark 6:3]] And it says that at Nazareth He was subject unto His parents: [[Luke 2:51]] The Word does not describe His training, so we do not invent it. It names the trade, and the house, and the obedience.

In David's house of worship, learners and masters served side by side in the same rotation: [[1 Chronicles 25:7]] [[1 Chronicles 25:8]] The teacher as the scholar. Nobody waited outside the work to be ready for it.

And the learner is fed while he works. [[Deuteronomy 25:4]] Paul carries that law into the church: [[1 Timothy 5:18]] And the law is specific about the poor man's wages: [[Deuteronomy 24:15]] At his day. The first piece warns that the new ladder must not become a system where opportunity depends on who can afford to work for nothing. The Word's default is a paid worker, and a path only the comfortable can walk is not it.

WGU reports from its survey that 76% of employers say work experience is worth as much as a degree or more. The third piece reports North Carolina districts began the school year with 2,009 teacher vacancies, by the superintendents' own survey, describes a federal grant to let teacher assistants keep their paychecks while they earn a license, and asks the honest question itself: will the path last when the grant ends? That is Luke 14's question about the tower.

What the industry calls it: registered apprenticeship, degree apprenticeship, earn-and-learn, credit for prior learning. Every one is a name for Acts 16:3.

MOVEMENT EIGHT: THE APPROVAL NO PAGE CAN EARN.

Here is what no employer can give. There is an audience above the hiring manager: [[2 Timothy 2:15]] A workman approved, who need not be ashamed. That is the standard a believer brings to every task: [[Colossians 3:23]] Heartily, as to the Lord, and not unto men.

But do not let proof climb higher than it belongs. Readiness for work is proved. Standing before Yahweh is not: [[Ephesians 2:8]] [[Ephesians 2:9]] No resume and no trial earns that. Then the works come AFTER the gift, prepared for us: [[Ephesians 2:10]] The Son Himself heard the Father's approval spoken over Him at the Jordan, [[Matthew 3:17]] before the Gospel records one sermon or one miracle. We prove our work. We do not prove our worth.

WHAT THIS HOUSE HOLDS, AND WHAT IT DOES NOT - MEASURED, NOT CLAIMED.

Measured from the code: a crown on a course means every lesson read and its exam passed (app/src/lib/course-pace.js, lines 223 to 231). That is completion and an examination - the letter, honestly earned. The Project Management course's own Apply step says Work it on a real project and shows the lesson's assignment (app/src/components/ChurchLearn.jsx, line 1555), but nothing in the learn surfaces records the work that was done. We searched for one and found none. The one place this house already keeps apprenticeship-shaped proof is the Practice's training-hours ledger: date, hours, competency and a supervisor of record (app/src/lib/practice-academy.js, lines 302 to 313), and it serves the TLC Practice only.

So this house carries the very gap the digest names - completion is not performance - in its own courses. That is named here, recorded with a date to look at again, and not dressed up as done.

THIS WEEK, THREE THINGS.

One, ask for the work. For the next person you choose for anything, name one piece of real work small enough for ten days, and look at it yourself.

Two, weigh every credible signal. The letter, the report from those who watched, and the trial. Never one alone.

Three, look down the hall. Name one person already near you who could grow into work you need done, and plan how they will learn it beside the work and be provided for while they do.

And for yourself: name one thing you claim, and the work that shows it.

WHAT NOBODY MAY TAKE FROM THIS HOUR. Not that credentials are worthless; Apollos carried a letter, and Daniel had three years of schooling. Not that the young may be despised for being new; Timothy was young and was told to be an example. And not that a proof of readiness can earn what only grace gives. The One whose approval we live under is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] addressed by the Father Himself as the One whose throne is for ever, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]]

${TALK.lesson}`,

  levels: {
    child: `LET THESE ALSO FIRST BE PROVED - PROOF OF READINESS, THE LETTER AND THE TRIAL, AND THE APPRENTICE DOWN THE HALL.

Nobody taught this one. No class. No teacher. Darrell got a letter in his email from a school. He sent it on with one word. The word was Lesson. Then he sent it again with more of the letter in it.

The letter is about getting a job. It says something new. Bosses have a hard time now. A computer can help anyone write a nice page about themselves. So a nice page does not show what a person can really do.

So the bosses want proof. Proof means something you can see. They want to see the work.

The letter also talks about learning while you work. You do a real job. You get paid. And you learn at the same time.

${BLOCKED_CHILD}

So we will look at the Word. The Word talked about proof a long time ago.

FIRST. A NICE PAGE IS NOT PROOF.

The Word says some people brag about a gift they do not have. They are like a cloud with no rain. [[Proverbs 25:14]]

A cloud looks like rain is coming. But no rain comes. A nice page can be like that. It looks good. But nothing is under it.

Here is another one. A king said this to a man who bragged too soon. [[1 Kings 20:11]]

That means do not brag when you put your armor on. Brag after the fight is done. Then you have something to show.

SECOND. PROVE IT FIRST.

Paul told the church how to pick helpers. Prove them first. Then let them do the job. [[1 Timothy 3:10]]

First the proof. Then the job. That is the order.

THIRD. DANIEL ASKED FOR A TEST.

Daniel was a young man far from home. A big king wanted to train him. The king gave him rich food. But Daniel did not want that food.

So Daniel asked for a test. Give us ten days, he said. [[Daniel 1:12]]

Ten days is not long. It was a small test. The man in charge could see the result with his own eyes.

He said yes. [[Daniel 1:14]]

After ten days, Daniel and his friends looked strong and well. [[Daniel 1:15]]

Later the king talked to them himself. He did not just read about them. He found them ten times better than the rest. [[Daniel 1:20]]

And who gave them their skill? Yahweh did. [[Daniel 1:17]]

FOURTH. A LETTER AND THE WORK.

A man named Apollos was very good at speaking. [[Acts 18:24]]

But he did not know everything yet. So a husband and wife took him home. Their names were Aquila and Priscilla. They made tents for a living. They taught him more. [[Acts 18:26]]

Then the church wrote him a letter. The letter said, please welcome him. [[Acts 18:27]]

And then he did great work. [[Acts 18:28]]

So he had a letter. And he had the work. Both.

FIFTH. A BOY NAMED TIMOTHY.

Timothy lived in a small town. People there knew him. They said good things about him. [[Acts 16:2]]

Paul took Timothy with him. Timothy helped Paul for years. Then Paul said everyone had seen the proof of him. [[Philippians 2:22]]

Paul did not need a nice page about Timothy. He had watched him work.

SIXTH. SHOW, DO NOT JUST TELL.

James said, I will show you by what I do. [[James 2:18]]

John said love is not just words. It is what you do. [[1 John 3:18]]

Even kids can show what they can do. Paul told Timothy to grow so all could see it. [[1 Timothy 4:15]]

And here is good news for you. Paul told Timothy not to let anyone look down on him for being young. [[1 Timothy 4:12]]

So you can show your work too. Young is not too small.

SEVENTH. YOU LEARN BY DOING.

The Word says we learn to tell good from bad by using our senses. By practice. [[Hebrews 5:14]]

You do not learn to ride a bike from a book. You learn by riding. You fall. You get up. You try again.

That is how grown-ups learn their jobs too.

EIGHTH. LEARNING NEXT TO SOMEONE.

Jesus grew up in a home with a carpenter. People called Him the carpenter's son. [[Matthew 13:55]]

Later they called Him the carpenter. [[Mark 6:3]]

In His home He obeyed His mom and dad. [[Luke 2:51]]

The Word does not tell us more than that. So we do not make it up.

The Word also says workers should be paid. Even the ox gets to eat while it works. [[Deuteronomy 25:4]]

Paul said a worker should get his pay. [[1 Timothy 5:18]]

So when someone learns while they work, they should be cared for. That is fair.

NINTH. THE BEST NEWS.

Here is something bigger than a job. You do not have to prove yourself to Yahweh. He loves you as a gift. [[Ephesians 2:8]]

No one can brag about it. [[Ephesians 2:9]]

Then He made you to do good things. [[Ephesians 2:10]]

So we show our work. But we do not have to earn His love. He gave it first.

WHEN YOU WANT A BIG JOB.

Maybe you want to feed the dog. Maybe you want to help in the kitchen. Maybe you want to be the one who takes care of the baby goat at Grandpa's.

Here is what to do. Do not just say, I can do it. Ask for a small test. Say, let me try for ten days. Then do it well every day. Let them see it.

That is what Daniel did.

WHEN YOU ARE THE ONE WHO PICKS.

Maybe you pick teams at recess. Maybe you pick who helps you build the fort.

Do not pick only the kid who talks the most. Watch who does the work. Watch who is kind when no one is looking.

And if a kid is new, give them a small job first. Let them show you. Help them learn. That is what Paul did with Timothy.

A LITTLE STORY.

Mia wanted to help bake bread at church. She told Mrs. Lee she was a great baker. Mrs. Lee smiled. She said, show me. So Mia came on Saturday. She did not know how to knead the dough. Her hands got sticky. Mrs. Lee stood next to her and showed her how. Mia came back the next Saturday, and the next. By the fourth week her bread was good. Now Mrs. Lee tells people Mia can bake. Mia does not have to say it. Her bread says it.

OUR APP.

Our app gives a crown when you finish a whole class and pass the tests. That is good. But it does not save the real work you did. Not yet. We are not hiding that. We wrote it down so we can fix it.

THIS WEEK.

Pick one thing you can do. Show it to someone. Do not just tell them.

Ask a grown-up for a small job to try for ten days.

Watch someone older do their work. Ask if you can help.

Jesus is the Lamb. [[John 1:29]] He is Yahweh's Son. [[John 3:16]]

${TALK.child}`,

    youth: `LET THESE ALSO FIRST BE PROVED - PROOF OF READINESS, THE LETTER AND THE TRIAL, AND THE APPRENTICE DOWN THE HALL.

Nobody taught this one as a class. Darrell forwarded a newsletter from a university called WGU and typed one word above it: Lesson. Six minutes later he sent it again with more of it, because the first copy was cut short.

The newsletter has three parts. The first says the steps into a career are changing. Machines now do a lot of the easy beginner work, so the first job is more like a jump than a step. The second says bosses have a hard time telling who can really do the job, because a computer can help anybody write a great resume. So bosses want proof that a person is ready. They still care about degrees and certificates too. They want every kind of proof they can get. The third part is about learning on the job, getting paid while you work toward a degree.

${BLOCKED_YOUTH}

So we test these ideas against the Word. It turns out the Word has all of them.

ONE. A GOOD-LOOKING PAGE PROVES NOTHING.

WGU asked more than 3,100 people who hire workers. WGU says 60% of them told it that the new tools make real skills harder to judge. That is the school's own survey.

But the Word never trusted a good-looking page anyway. It says a person who brags about a gift he does not have is like a cloud with no rain. [[Proverbs 25:14]]

And when an enemy king bragged before a battle, Israel's king sent back this answer. [[1 Kings 20:11]] Do not brag while you are putting the armor on. Brag when you take it off, after the fight.

Proverbs also says talk without work leads nowhere. [[Proverbs 14:23]]

TWO. PROOF COMES BEFORE THE JOB.

Paul gave the church a rule for choosing helpers. Prove them first, and then give them the job. [[1 Timothy 3:10]]

He also said not to rush it. [[1 Timothy 5:22]] Do not put someone in charge too quickly.

At work, people call this a trial period, or a work test. The rule came from the Word first.

THREE. DANIEL'S TEN DAYS.

Daniel and his friends were chosen because they were smart and skilled. [[Daniel 1:4]] They got three years of training. [[Daniel 1:5]]

But when Daniel needed to show something, he asked for a test. A short one. [[Daniel 1:12]] He said, look at us after ten days, and then decide. [[Daniel 1:13]]

The man in charge agreed. [[Daniel 1:14]] After ten days the result was easy to see. [[Daniel 1:15]]

Later the king talked with them himself. [[Daniel 1:19]] He found them ten times better than everyone else. [[Daniel 1:20]]

And here is the most important part. The Word says Yahweh gave them their knowledge and skill. [[Daniel 1:17]] Their training was real. Their test was real. And their skill was a gift.

FOUR. A LETTER AND THE WORK.

A man named Apollos was a great speaker who knew the Scriptures well. [[Acts 18:24]] He had been taught, and he taught others. [[Acts 18:25]]

But he was missing something. So Aquila and Priscilla, a couple who made tents, took him aside and taught him more. [[Acts 18:26]]

Then the church wrote him a letter to take to the next city. [[Acts 18:27]] And when he got there, his work showed it. [[Acts 18:28]]

Paul wrote a letter like that for a woman named Phebe. [[Romans 16:1]] And the letter told what she had done. She had helped many people. [[Romans 16:2]]

So the Word does not pick between a letter and the work. It uses both.

FIVE. TIMOTHY.

Timothy had no letter at first. He had a good name with the people who knew him. [[Acts 16:2]]

Then he worked beside Paul for years. Later Paul told a whole church that they knew the proof of him. [[Philippians 2:22]]

Paul said something like it about another brother too. He had been proved many times. [[2 Corinthians 8:22]]

SIX. SHOW IT.

James said real faith shows in what you do. [[James 2:18]] John said real love is in deeds, not just words. [[1 John 3:18]]

Paul told Timothy to work hard so that his growth would show to everyone. [[1 Timothy 4:15]]

The newsletter tells about a woman named Belen. She has worked at McDonald's for over twenty years. She helped her owner grow from five restaurants to twelve. She earned a certificate and is working on a degree. Now she leads more than two hundred managers. That is the school telling its own student's story. But the point is true. Learning should show up in the work.

SEVEN. YOU LEARN BY USE.

How does anyone learn good judgment? The Word says by use. By practice. [[Hebrews 5:14]]

That is why the first job matters so much. It is where you practise. If machines take away the easy first jobs, somebody has to make a new place to practise.

And Paul told young Timothy not to let anyone look down on him for being young. [[1 Timothy 4:12]] Be an example instead.

EIGHT. LEARNING ON THE JOB.

Paul found Timothy right where he already lived. [[Acts 16:1]] Then Paul took him along. [[Acts 16:3]] Timothy learned by going with him.

Jesus was called the carpenter's son. [[Matthew 13:55]] Then He was called the carpenter. [[Mark 6:3]] As a boy He obeyed His parents at home. [[Luke 2:51]] The Word does not tell us more about His training, so we do not add to it.

In King David's time, the music teachers and the students served side by side. [[1 Chronicles 25:8]]

And the workers got paid. The Word says do not muzzle the ox while it works. [[Deuteronomy 25:4]] Paul says a worker deserves his pay. [[1 Timothy 5:18]]

The newsletter says some people cannot afford to work for free just to get experience. The Word says pay workers. A path that only rich people can walk is not fair.

NINE. WHAT NO BOSS CAN GIVE.

There is a bigger approval than a boss's. [[2 Timothy 2:15]] Paul says to work so Yahweh approves of your work.

But you cannot earn Yahweh's love. It is a gift. [[Ephesians 2:8]] Nobody gets to brag. [[Ephesians 2:9]] Good works come after, because He made us for them. [[Ephesians 2:10]]

When Jesus was baptized, the Father said He was pleased with His Son. [[Matthew 3:17]]

We prove our work. We do not have to prove our worth.

WHEN YOU ARE THE ONE CHOOSING.

You may be young, but you choose people all the time. You pick a partner for a project. You pick who to trust with a secret. You pick who leads the game.

Try it the Word's way. Do not go only by who talks best. Look at what they have done. Ask the people who know them. Give them a small job first and see. That is every kind of proof, just like Daniel 1.

A PICTURE OF HOW IT WORKS.

Think about a boy who wants to mow lawns on his street for money. He could make a nice sign that says he is the best mower in town. Lots of kids make signs. Or he could mow his own yard every week, neat and straight, and then mow the yard of the widow next door for free one time. Now the neighbors have seen his work. The widow tells the man across the street. And the boy asks the man for a chance to mow his yard for two weeks, to see if he likes it. That is a report, a trial and real work, all at once. The sign was never the proof. The yard was.

And when the boy gets older, he can take a younger kid along and teach him. He can pay him a little out of what he earns. That is how a trade has always been passed on.

OUR APP.

Our app gives a crown when you finish every lesson and pass the tests. That shows you finished. But the app does not keep the real work you did on a project. We say that plainly, and we wrote it down with a date to look at it again.

THIS WEEK.

Pick one thing you say you can do. Find a way to show it.

Ask for a small job you can try for ten days.

Find someone who does work you want to learn. Ask if you can help beside them.

Jesus is the Lamb of Yahweh, [[John 1:29]] Yahweh's own Son. [[John 3:16]]

${TALK.youth}`,

    teen: `LET THESE ALSO FIRST BE PROVED - PROOF OF READINESS, THE LETTER AND THE TRIAL, AND THE APPRENTICE DOWN THE HALL.

No one taught this as a class. Darrell sent a newsletter from Western Governors University into the lesson lane with one word on top: Lesson. Then he sent it again six minutes later with the full text, and a note that there was more to it.

It has three short pieces. One says the career ladder is changing. Skills go out of date fast. And because software now does much of the beginner work, the first job is harder to get into. One says bosses can no longer trust a polished resume, since software can write one for anyone. So they look for proof that a person is ready, and they still want degrees and certificates too. The last says workers should not have to quit their jobs to get a degree, and apprenticeships can let them do both.

${BLOCKED_TEEN}

So we test these ideas against the Word. Every one of them is already there.

PART ONE. THE RESUME WAS NEVER THE PROOF.

WGU says that in its survey of more than 3,100 people who hire, 60% said the new tools make real skill harder to judge. That is WGU's own survey.

But the Word never treated a nice page as proof. It says a person who boasts of a gift he does not have is like a cloud and wind with no rain. [[Proverbs 25:14]]

When a king bragged before a battle, Israel's king answered him in one line. [[1 Kings 20:11]] Do not boast while you are still putting your armor on.

And Proverbs puts it plainly. [[Proverbs 14:23]] Work pays. Just talking does not.

PART TWO. PROVED FIRST.

Paul gave a clear order for choosing church helpers. First prove them. Then let them serve. [[1 Timothy 3:10]]

And he warned against hurrying it. [[1 Timothy 5:22]]

At work they call this a trial period or a work-sample test. Same order.

PART THREE. DANIEL ASKS FOR A TEST.

Daniel 1 is a real hiring story. The young men were picked for their skill and smarts. [[Daniel 1:4]] They were trained for three years. [[Daniel 1:5]]

Then Daniel asked for his own test, a short one. [[Daniel 1:12]] He said, look at us after ten days and decide. [[Daniel 1:13]]

The official agreed. [[Daniel 1:14]] And the result was plain to see. [[Daniel 1:15]]

At the end, the king talked with them himself. [[Daniel 1:19]] He found them ten times better than all his experts. [[Daniel 1:20]]

But notice where their skill came from. Yahweh gave it. [[Daniel 1:17]]

WGU says 73% of the employers it asked call degrees important, and 91% call certificates useful. WGU also says 43% are paying more attention to skills. WGU sells degrees and certificates, so keep that in mind. But the point matches Daniel. Bosses are not picking between school and skill. They want both.

PART FOUR. A LETTER, AND THE WORK.

Apollos was a strong speaker who knew the Scriptures. [[Acts 18:24]] He had been taught. [[Acts 18:25]]

But he had a gap. So Aquila and Priscilla, who made tents for a living, took him aside and taught him better. [[Acts 18:26]] Even a gifted man kept learning.

The church gave him a letter for his next stop. [[Acts 18:27]] And there his work proved itself. [[Acts 18:28]]

Paul wrote a letter for Phebe. [[Romans 16:1]] And it said what she had done. She had helped many, Paul included. [[Romans 16:2]]

Paul said he was still learning too. [[Philippians 3:12]] And a wise person keeps looking for knowledge. [[Proverbs 18:15]]

PART FIVE. THE PROOF OF HIM.

Timothy started with no letter. He had a good report from people who knew him. [[Acts 16:2]]

Then he served beside Paul for years. Paul could write that they all knew the proof of him. [[Philippians 2:22]]

Paul said the same about another brother who had been proved many times. [[2 Corinthians 8:22]]

The strongest reference is from someone who watched you work.

PART SIX. SHOW YOUR WORK.

James said faith is shown by works. [[James 2:18]] John said love is shown in deeds. [[1 John 3:18]] And Paul told Timothy to let his growth be seen by everyone. [[1 Timothy 4:15]]

The newsletter tells about Belen, who has worked at McDonald's for over twenty years. She helped grow it from five stores to twelve, earned a certificate, and now leads more than two hundred managers. That is the school's own story about its student. But it shows the idea. Learning should show up in the work.

And the apprenticeship piece says learning on the job must meet the same standard as class. No credit just for showing up. The Word says every person's work will be tested the same way. [[1 Corinthians 3:13]]

PART SEVEN. LEARNING BY USE.

How does anyone get good judgment? The Word says by use. [[Hebrews 5:14]]

That is why first jobs matter. They are where you practise. If software takes those jobs, someone has to make a new place to practise.

To young people who feel they are being asked to do more, sooner, Paul says this. [[1 Timothy 4:12]] Do not let anyone look down on you. Be an example.

PART EIGHT. LEARNING INSIDE THE WORK.

Paul found Timothy where he already lived. [[Acts 16:1]] Then he took him along. [[Acts 16:3]]

Jesus was called the carpenter's son, [[Matthew 13:55]] and later the carpenter. [[Mark 6:3]] At home He obeyed His parents. [[Luke 2:51]] The Word does not tell us how He learned the trade, so we stop where it stops.

In David's time, teachers and students served side by side. [[1 Chronicles 25:8]]

And the worker was fed while he worked. [[Deuteronomy 25:4]] Paul repeats it. [[1 Timothy 5:18]] The law even said to pay a poor worker the same day. [[Deuteronomy 24:15]]

The newsletter warns that some people cannot afford to work for free. The Word expects workers to be paid. That is worth remembering when you hear about unpaid internships.

PART NINE. THE APPROVAL THAT MATTERS MOST.

There is a bigger audience than any boss. [[2 Timothy 2:15]] Paul says to be a worker Yahweh approves. And do every job as if for the Lord. [[Colossians 3:23]]

But you do not earn Yahweh's love. It is a gift. [[Ephesians 2:8]] No one can boast. [[Ephesians 2:9]] He made us for good works, and they come after. [[Ephesians 2:10]]

When Jesus was baptized, the Father said He was well pleased with Him. [[Matthew 3:17]]

So prove your work. But you never have to prove your worth.

A PICTURE OF HOW IT WORKS.

Say you want to work at a bike shop. You could write a great page about how much you love bikes. Or you could fix three bikes for neighbors, take photos, and ask them to say how it went. Then ask the shop owner to let you try for a week. That is a letter, a report and a trial, all at once.

WHEN YOU ARE THE ONE CHOOSING.

You choose people more than you think. A lab partner. A friend to trust. Who runs the group chat for the youth trip. Try it the Word's way. Do not go by who talks best or posts best. Look at what they have done. Ask people who have worked with them. Give them a small job first and see how it goes. That is Daniel 1 at your school.

And when someone younger asks to learn what you know, take them along. Let them help. Let them mess up while the stakes are small. That is how Paul trained Timothy.

OUR APP.

The app gives a crown when you finish every lesson and pass the tests. That proves you finished. But it does not keep the real work you did. We say so, and we wrote it down with a date to fix it.

THIS WEEK.

Name one thing you say you can do, and make one thing that shows it.

Ask for a short trial at something you want to do.

Find one person who does work you want to learn, and ask to help.

Jesus is the Lamb of Yahweh, [[John 1:29]] His only Son. [[John 3:16]]

${TALK.teen}`,

    senior: `LET THESE ALSO FIRST BE PROVED - PROOF OF READINESS, THE LETTER AND THE TRIAL, AND THE APPRENTICE DOWN THE HALL.

Nobody stood up and taught this one. On a Friday morning in November, Darrell forwarded a LinkedIn digest from Western Governors University with a single word above it, Lesson, and then sent it a second time six minutes later with the full text of all three pieces and a note that there was more to read. The edition is called Proving Readiness in a Changing Job Market.

Many of us were hired the old way. Somebody knew your father. Somebody watched you work a summer. You started at the bottom, swept the floor, learned by watching, and moved up when the man above you said you were ready. These three pieces are about what happens when that way changes.

The first says the career ladder is shifting. Skills change faster than they used to, and because software now does much of the routine beginner work, the first step into a job has become more of a leap. It says learning must go on all through life, and must not become a luxury only some can afford. The second says employers struggle to tell real skill from a polished presentation now that software can write anyone's resume, so they want proof of readiness. They have not given up on degrees and certificates; they want every honest signal they can get. The third says workers should not have to give up the paycheck to earn the degree, and that apprenticeships can let them do both.

${BLOCKED_SENIOR}

So we lay these ideas beside the Word. They are all there, and they were there first.

THE POLISHED PAGE.

The university says that in its own survey of more than 3,100 people who hire, 60% said the new tools make real skill harder to judge. That is the university reporting its own survey.

The Word never put much weight on the page. It says that whoever boasts of a false gift is like clouds and wind without rain. [[Proverbs 25:14]] And when a boasting king threatened Israel, the answer he received was this. [[1 Kings 20:11]] The man still buckling his armour has proved nothing yet. And Proverbs adds that labour profits, while mere talk does not. [[Proverbs 14:23]]

PROVED FIRST.

Paul's rule for choosing those who would serve in the church at Ephesus is one line long. [[1 Timothy 3:10]] First the proof, then the office. And he warned against haste. [[1 Timothy 5:22]] A hurried appointment makes you a partner in whatever comes after.

Employers today call this a probation period, or a work-sample test. The order is the Word's.

DANIEL'S TEN DAYS.

Daniel 1 reads like a hiring file. The young men were chosen for skill, knowledge and bearing. [[Daniel 1:4]] They were schooled for three years at the king's expense. [[Daniel 1:5]]

Then Daniel proposed his own trial. [[Daniel 1:12]] Look at us after ten days, he said, and deal with us as you see. [[Daniel 1:13]] The steward agreed. [[Daniel 1:14]] And at the end of the ten days the difference was plain to see. [[Daniel 1:15]]

At the last, the king examined them himself, face to face. [[Daniel 1:19]] He found them ten times better than all his wise men. [[Daniel 1:20]] And the Word is careful to say where their skill came from. [[Daniel 1:17]] Yahweh gave it.

The university's survey says 73% of employers call degrees important and 91% call certificates valuable, both higher than a year before, while 43% say they are leaning more on skills. The university sells degrees and certificates, and we say so without suspicion. Its finding matches Daniel. Credentials, training, a trial and a face-to-face examination: every signal, together.

THE LETTER, AND THE WORK.

Apollos was eloquent and mighty in the Scriptures. [[Acts 18:24]] He had been taught and taught others with fervour. [[Acts 18:25]] But he had a gap. So Aquila and Priscilla, tentmakers by trade, took him home and taught him the way more perfectly. [[Acts 18:26]] A gifted man, already teaching, still learning from ordinary people.

When he moved on, the brethren wrote him a letter. [[Acts 18:27]] And his work bore the letter out. [[Acts 18:28]]

Paul wrote such a letter for Phebe. [[Romans 16:1]] Read it and you will see it is a record of her work. She had helped many, and Paul himself. [[Romans 16:2]] The best references in Scripture come from people who watched the work being done.

Paul confessed he was still learning. [[Philippians 3:12]] And the wise keep seeking knowledge all their days. [[Proverbs 18:15]]

THE PROOF OF HIM.

Timothy began with no letter at all, only the good word of the people who had known him. [[Acts 16:2]] Then he served beside Paul for years, until Paul could write to a whole church that they knew the proof of him. [[Philippians 2:22]] He said the same of another brother, proved diligent many times. [[2 Corinthians 8:22]]

Those of us who have vouched for someone know what that costs. You put your own name beside theirs. You only do it when you have seen the work.

SHOW IT.

James wrote that real faith is shown by works. [[James 2:18]] John wrote that love is in deed and in truth. [[1 John 3:18]] And Paul told young Timothy to give himself to his work so that his profiting might appear to all. [[1 Timothy 4:15]]

The second piece tells of Belen Martinez of Lubbock, Texas, who has worked over twenty years at one McDonald's franchise, helped it grow from five restaurants to twelve, earned a leadership certificate, is studying for a degree, and now leads more than two hundred managers. That is the university telling its own student's story. Its point is sound. Learning should show up in the work.

The third piece says learning on the job must meet the same standard as the classroom, with no credit for simply showing up. The Word puts all work to one test. [[1 Corinthians 3:13]]

WHERE JUDGMENT IS LEARNED.

The first piece asks a hard question. If the routine beginner work goes away, where will the young learn judgment? The Word says judgment is learned by use. [[Hebrews 5:14]] Not by a book alone, but by senses exercised over time. Whoever takes away the first rung owes the young another place to practise.

It also quotes the World Economic Forum: employers expect 39% of workers' core skills to change by 2030. That is a forecast employers gave, not a count. The same piece says about one in three young workers are in fields heavily touched by these tools, but gives no source, so we do not teach it.

And to the young, Paul said plainly what we should say to our grandchildren. [[1 Timothy 4:12]] Do not let anyone despise your youth.

DOWN THE HALL.

The third piece says the next teacher may already be working down the hall, as a teacher's aide. Paul found Timothy the same way, right where he lived. [[Acts 16:1]] And he took him along. [[Acts 16:3]]

Jesus was called the carpenter's son [[Matthew 13:55]] and then the carpenter. [[Mark 6:3]] At Nazareth He was subject to His parents. [[Luke 2:51]] The Word does not tell us how He learned the trade, and we do not invent it.

In David's day, teacher and student served side by side in the same rotation. [[1 Chronicles 25:7]] [[1 Chronicles 25:8]]

And the one who learns while he works should be fed. [[Deuteronomy 25:4]] Paul carried that into the church. [[1 Timothy 5:18]] The law even said to pay the poor man the same day. [[Deuteronomy 24:15]] The first piece warns that a path open only to those who can afford to work for nothing is no path for most. The Word agrees.

The university's survey says 76% of employers count work experience as worth as much as a degree or more, and 53% say they invest in apprenticeships or other learning on the job. The third piece also reports that North Carolina began the school year with 2,009 teacher openings, by the superintendents' own count, and it asks the honest question of its own grant: will the districts keep the path going when the money ends? Count the cost.

What the industry calls this today is a registered apprenticeship, or a degree apprenticeship, or credit for prior learning. It is Acts 16:3 with paperwork.

THE APPROVAL ABOVE ALL.

There is an approval above every employer's. [[2 Timothy 2:15]] And every task is done as for the Lord. [[Colossians 3:23]]

But proof belongs to the work, not to our standing. That is a gift. [[Ephesians 2:8]] No one may boast. [[Ephesians 2:9]] The good works come after, prepared for us to walk in. [[Ephesians 2:10]] Even the Son heard the Father's pleasure spoken over Him before His public work began. [[Matthew 3:17]]

We prove our work. We are never asked to prove our worth.

THIS HOUSE.

Our app gives a crown when a learner reads every lesson and passes its exam. That proves completion. In this course the Apply step says Work it on a real project, but the app keeps no record of the work actually done. The one place it keeps a record like an apprentice's log is the counselling practice's training-hours ledger, with a supervisor named. We say so plainly, and we wrote it down with a date to look at it again.

THIS WEEK.

Before you choose someone for anything, ask to see a small piece of their work.

If you can vouch for a younger person's work, tell someone who can use them.

And if there is someone near you who could learn what you know, invite them to work beside you.

The One whose approval we live under is the Lamb, [[John 1:29]] the Eternal Son of Yahweh, [[John 3:16]] whose throne is for ever, [[Hebrews 1:8]] by whom all things consist. [[Colossians 1:17]]

${TALK.senior}`,
  },

  facilitator: {
    howToRun:
      'Run this alone, or with the person who handed you the project, in about an hour. OPEN WITH THE ADMISSION: the three pieces were read in full, but the reports they cite sat behind sites that would not open, so every figure is taught at its tier and one unsourced figure is left out. THEN read 1 Timothy 3:10 aloud and ask one question before any teaching: what comes first, the proof or the office? Work Daniel 1 as a hiring file - credentials (1:4), training (1:5), the trial the candidate proposed (1:12-15), the examination in person (1:19-20), and the gift (1:17) - and only then name the industry words. Set Apollos (Acts 18:24-28) beside Timothy (Acts 16:1-3, Philippians 2:22): one came with a letter and still had to learn; one came with only a report and proved himself by serving beside. Spend real time on Hebrews 5:14 and the first rung, because it is the question the digest asks and cannot answer. Close on Ephesians 2:8-10 so no one leaves thinking proof earns grace, and on the page from the inApp section, filled in for real people by name.',
    talkingPoints: [
      'Say first what was not opened. The three pieces were read in full; the reports behind them were not, because the sites were shut. A forecast is called a forecast, a university reporting its own survey is called that, and an unsourced number is not taught.',
      '1 Timothy 3:10 is the order: proved first, then the office. 1 Timothy 5:22 is the brake: lay hands suddenly on no man. A hurried appointment makes the one who appoints a partner in what follows.',
      'Daniel 1 uses every credible signal at once - credentials, three years of training, a ten-day trial the candidate proposed himself, and an examination face to face - and then says the skill was given by Yahweh (Daniel 1:17).',
      "The Word never chose between credentials and capability. Apollos carried a letter (Acts 18:27) and his work bore it out (Acts 18:28); Phebe's commendation was a record of her work (Romans 16:2).",
      'Even the gifted keep learning. Aquila and Priscilla, tentmakers with no title, taught Apollos the way more perfectly (Acts 18:26). Paul said he had not already attained (Philippians 3:12).',
      'Hebrews 5:14: judgment is learned by reason of use. If the first rung is automated away, the leader owes the young another place to use their senses. Parents, sit with your children this week and give them one real piece of work to do and to show, and listen all the way to the end when they tell you how it went.',
      "Deuteronomy 25:4 and 1 Timothy 5:18: the learner is fed while he works. A path only the comfortable can walk is not the Word's default.",
      'Ephesians 2:8-10: we prove our work, never our worth. Standing before Yahweh is a gift; the good works come after and were prepared for us.',
    ],
    discussionPrompts: [
      'Think of the last person you chose for anything. Which signals did you use - the letter, the report from those who had watched them, a trial? Which one was missing?',
      'Who is already down the hall from you - in your home, church, crew or office - who could grow into work you need done? What would they need to learn, who would teach them beside the work, and how would they be provided for while they learned?',
      'Children, ask your mom, your dad or a grandparent who first gave them a real chance at work and how they proved they were ready. Then tell a friend one thing this hour showed you, ask what work they could show this week, and pray one for another.',
    ],
  },

  quiz: {
    questions: [
      {
        q: 'What was the forwarded email, and how much of it was read?',
        options: [
          'A sermon transcript about work',
          "WGU's LinkedIn digest Proving Readiness in a Changing Job Market, forwarded twice - all three pieces were read in full from the second copy, but the reports they cite sat behind sites that would not open, so every figure is taught at its tier. re-review: 2026-11-27",
          'A government jobs report, read in full',
          'Only a headline, with nothing behind it',
        ],
        answer: 1,
        explain:
          'Gmail thread 1a1b17065b1eee52, forwarded 2026-11-06 at 15:18 UTC with one word, Lesson, and again at 15:24 UTC with the fuller copy. The pieces are in hand; the WGU report, the World Economic Forum report and the apprenticeship analysis were not opened.',
      },
      {
        q: 'What order does 1 Timothy 3:10 set for an appointment?',
        options: [
          'The office first, and the proof hoped for later',
          'First proved, then the office',
          'The office for whoever applies first',
          'No order at all',
        ],
        answer: 1,
        explain: 'Let these also first be proved; then let them use the office. And 1 Timothy 5:22 adds the brake: lay hands suddenly on no man.',
      },
      {
        q: 'In Daniel 1, who proposed the ten-day trial?',
        options: [
          'The king',
          'The prince of the eunuchs',
          'Daniel himself - prove thy servants, I beseech thee, ten days (Daniel 1:12) - short, measurable and judged by the one who had to answer for it',
          'Nobody; there was no trial',
        ],
        answer: 2,
        explain:
          'Daniel came with credentials (1:4) and three years of training (1:5), and still asked to be proved. The king then examined them face to face (1:19-20). Every signal was used, and the skill itself was given by Yahweh (1:17).',
      },
      {
        q: 'What does the case of Apollos show about credentials and capability?',
        options: [
          'That letters of commendation are worthless',
          'That a gifted man needs no more teaching',
          'That the Word used both - he carried a letter from the brethren (Acts 18:27) and his work bore it out (Acts 18:28) - and that he was still taught more perfectly by Aquila and Priscilla on the way (Acts 18:26)',
          'That only the work matters',
        ],
        answer: 2,
        explain:
          'The digest says employers are not choosing between credentials and capability. The Word never did. And even the eloquent, credentialed Apollos kept learning from two tentmakers with no title.',
      },
      {
        q: 'According to Hebrews 5:14, how are senses exercised to discern good and evil?',
        options: ['By reading alone', 'By reason of use', 'By age alone', 'By a certificate'],
        answer: 1,
        explain:
          "Judgment is learned by use. That answers the digest's hardest question: if the routine first rung is automated away, whoever removes the use owes the young another place to get it.",
      },
      {
        q: 'What does the Word say about the learner being provided for while he works?',
        options: [
          'Nothing at all',
          'That he should work unpaid until he is ready',
          'Thou shalt not muzzle the ox when he treadeth out the corn (Deuteronomy 25:4), and the labourer is worthy of his reward (1 Timothy 5:18)',
          'That only masters are paid',
        ],
        answer: 2,
        explain:
          "The ox eats while it treads. Paul carries the law into the church. A path open only to those who can afford to work for nothing is not the Word's default.",
      },
      {
        q: 'Which of these figures in the digest is given WITHOUT a source, and so is not taught as fact?',
        options: [
          "The World Economic Forum's forecast about core skills changing by 2030",
          "WGU's survey of more than 3,100 hiring professionals",
          'Roughly one in three early-career professionals working in industries heavily exposed to the new tools',
          "The North Carolina superintendents' vacancy count",
        ],
        answer: 2,
        explain:
          "The Forum figure is an employer forecast with a named source; the WGU figures are WGU reporting its own survey; the vacancy count is the superintendents' own survey as reported. The one-in-three figure names no source at all.",
      },
      {
        q: 'Measured from the code, what does a course crown on this platform prove, and what is missing?',
        options: [
          'It proves a skill was performed on a real project',
          "It proves every lesson was read and its exam passed - completion - while the course's own Work it on a real project step leaves no record of the work done; named, with a date to look again",
          'It proves nothing',
          'It proves supervised hours',
        ],
        answer: 1,
        explain:
          "course-pace.js lines 223 to 231 define the crown as every lesson read and passed. ChurchLearn.jsx line 1555 shows the Apply step as text. The only apprenticeship-shaped record is the Practice's training-hours ledger (practice-academy.js lines 302 to 313).",
      },
      {
        q: 'What does Ephesians 2:8-10 keep proof from claiming?',
        options: [
          'Nothing; proof earns everything',
          'That proof of readiness could earn standing before Yahweh - that is by grace, not of works, and the good works come after, prepared for us',
          'That work matters at all',
          'That anyone should work',
        ],
        answer: 1,
        explain:
          "We prove our work. We do not prove our worth. Even the Son heard the Father's approval spoken over Him at the Jordan before the Gospel records His public ministry (Matthew 3:17).",
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

if (!readerRefs.length) throw new Error('pm19: no references were found in the reader places');
for (const r of readerRefs) verseText(r);

// Every reader place carries the close and the dated shut-road note (DR-0795 / DR-0076 §8).
for (const place of READER_PLACES) {
  const text = place === 'lesson' ? filled.lesson : filled.levels[place];
  if (!/TALK ABOUT IT TOGETHER/.test(text)) throw new Error(`pm19: ${place} has no TALK ABOUT IT TOGETHER`);
  if (!/re-review: 2026-11-27/.test(text)) throw new Error(`pm19: ${place} has no dated shut-road note`);
}

if (process.argv.includes('--dry-run')) {
  process.stdout.write(JSON.stringify(filled));
  process.exit(0);
}

const src = readFileSync(COURSE, 'utf8');
if (src.includes(ID)) throw new Error('pm19: the id is already in the course; refusing to rebuild');
// Week numbers are contiguous: pm19 lands only on a tree that already holds pm18.
if (!src.includes(PREV)) throw new Error(`pm19: ${PREV} is not in the course yet; pm19 follows it and will not land first`);

const OPEN = 'export const PROJECT_MANAGEMENT_MODULES = [';
const open = src.indexOf(OPEN);
if (open < 0) throw new Error('pm19: the modules array was not found');
const end = src.indexOf('\n];', open);
if (end < 0) throw new Error('pm19: the modules array is not closed');

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
if (before.includes(WEEK)) throw new Error(`pm19: week ${WEEK} is already taken`);
const after = weeks(next);
if (after[after.length - 1] !== WEEK) throw new Error(`pm19: week ${WEEK} is not the top of the course after splicing`);
if (next.split(`"${ID}"`).length - 1 !== 1) throw new Error('pm19: the new id did not land exactly once');

// meta.weeks is a getter over PROJECT_MANAGEMENT_MODULES.length (DR-0677), so the
// header tracks the splice on its own; a literal here would be a second source of truth.
if (!/get weeks\(\) \{ return PROJECT_MANAGEMENT_MODULES\.length; \}/.test(next)) {
  throw new Error('pm19: meta.weeks is no longer derived from the module count; refusing to splice');
}

writeFileSync(COURSE, next);

console.log(`pm19: spliced ${ID}`);
console.log(`pm19: modules ${before.length} -> ${before.length + 1}; top week ${WEEK}; meta.weeks derived, now ${before.length + 1}`);
console.log(`pm19: ${readerRefs.length} references on the anchor, every one quoted in a reader place and resolving in the corpus`);
