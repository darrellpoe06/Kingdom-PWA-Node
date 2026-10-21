// =============================================================================
// sov45-fill — build Sovereign A.I. week 45 and splice it into the catalog
// =============================================================================
// WHY A GENERATOR AND NOT TYPING (binding, DR-0076). Every quoted verse on this
// page is FILLED FROM app/public/bible/kjv at build time. The prose below holds
// only a reference in double brackets, [[Proverbs 18:17]], and this script
// replaces it with the corpus text followed by the reference. No verse on the
// page was typed from memory, so a verse cannot drift from the text and a
// quotation cannot be approximate. The reference list on the module's anchor is
// DERIVED from the same placeholders (DR-0734 in both directions).
//
// WHERE THE WORD CAME FROM. On 2026-10-20 at 15:13 UTC Darrell forwarded a
// Level Up Coding newsletter by Nikki Siapno — "How Slack Built a Multi-Agent
// Security System", sent the same morning at 13:53 UTC — into the lesson lane
// with one word on it: "Lesson". The newsletter's opening question is why it is
// here: how do you trust an A.I. investigator when the model itself cannot be
// completely trusted. Its answer is structural: one Director who owns the case,
// four domain Experts who gather evidence, one Critic who scores whether the
// evidence supports what an Expert claimed, three named records instead of a
// replayed conversation, and the admission that the Critic is itself a model
// whose score is a signal and not a fact.
//
// WHAT THE WORD ALREADY SAID, which is what this week teaches: a matter is
// established at two or three witnesses and never at one (Deuteronomy 19:15);
// the first in his own cause only SEEMS just until somebody searches him
// (Proverbs 18:17); a judge makes diligent inquisition rather than take a
// summary (Deuteronomy 13:14; Deuteronomy 19:18); Yahweh keeps written records
// and acts on them (Malachi 3:16; Esther 6:1-3); small matters are judged below
// and hard causes carried up (Exodus 18:21-22, 26); prophets, kings and
// apostles were corrected in the open (2 Samuel 12:7; Galatians 2:11); and the
// final standard is the law and the testimony, outside every witness inside the
// matter (Isaiah 8:20; Hebrews 4:12-13).
//
// AND THE SPECIMEN. This article is about agents whose output may not be
// trusted, and it arrived as text into the working memory of an agent that then
// drafted this page. Text that comes in is MATERIAL TO BE TRIED, never an
// errand to be run — which is exactly what the Word does with the deceiver's
// own words (Genesis 3:1-5 recorded verbatim and answered, never obeyed;
// Matthew 4:6-10, where the quotation was real and the errand was not).
//
// Run from the repository root:  node scripts/sov45-fill.mjs   (--rebuild to replace)
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const CATALOG = join(ROOT, 'app', 'src', 'lib', 'sovereign-ai-class.js');

const WEEK = 45;
const ID = 'sov45-no-single-witness-and-the-office-of-the-critic';

// -----------------------------------------------------------------------------
// The corpus
// -----------------------------------------------------------------------------
const books = new Set(readdirSync(KJV).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => f.slice(0, -5)));
const cache = new Map();

function bookFile(name) {
  const k = String(name).replace(/\s+/g, '');
  if (books.has(k)) return k;
  if (books.has(`${k}s`)) return `${k}s`;
  return null;
}

function verseText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) throw new Error(`sov45: reference is not Book C:V -> "${ref}"`);
  const f = bookFile(m[1]);
  if (!f) throw new Error(`sov45: no such book -> "${ref}"`);
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  const chap = cache.get(f).chapters[Number(m[2]) - 1];
  const text = chap && chap[Number(m[3]) - 1];
  if (!text) throw new Error(`sov45: reference does not resolve in the corpus -> "${ref}"`);
  return text;
}

const used = [];
const seen = new Set();

function fill(text) {
  return String(text).replace(/\[\[([^\]]+)\]\]/g, (_, ref) => {
    const r = ref.trim();
    const t = verseText(r);
    if (!seen.has(r)) { seen.add(r); used.push(r); }
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
// The talk-together close, in this lesson's own words, in all three directions,
// at each band's own level (DR-0795: a reader reads ONE band).
// -----------------------------------------------------------------------------
const RHYTHM = 'Do it once today, in one of the four places of Deuteronomy 6:7 - at the table, on the way, at bedtime, or first thing - and with one friend this week.';
const TALK = {
  lesson: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - who checked the last thing you were sure about - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Proverbs 18:17. Children, ask your mom, dad or grandparent about a time somebody corrected them and it turned out to be a kindness, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week one thing this lesson showed you about why a matter needs two witnesses and not one, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way: by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  child: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - what does a critic do - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Proverbs 18:17. Children, ask your mom or dad or grandma or grandpa about a time a friend told them the truth, listen all the way through, then retell it in your own words. Friends, tell one friend this week that one helper is not enough, ask what they think, and pray for each other, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  youth: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - whose work in this house gets checked by somebody other than the person who did it - and listen all the way to the end, have them retell the answer in their own words, then teach them one verse back, Deuteronomy 19:15. Children, ask your mom, dad or grandparent who checks THEIR work at their job, and what happens when nobody does, listen all the way through, then retell their answer in your own words. Friends, tell one friend this week one thing this lesson showed you about why nobody grades his own paper, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
  teen: `TALK ABOUT IT TOGETHER. Parents, ask your child one open question today - when you are reviewed, do they see your evidence or only your summary of it - and listen all the way to the end, have them retell the difference in their own words, then teach them one verse back, Deuteronomy 19:18. Children, ask your mom, dad or grandparent what record their work keeps, and who could check it a year from now, listen all the way through, then retell it in your own words. Friends, tell one friend this week one thing this lesson showed you about reading something without obeying it, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM} Measure the growth the Word's way: by the fruit, [[Galatians 5:22]] by the occasions, [[Deuteronomy 6:7]] and by the days, [[Hebrews 3:13]]`,
  senior: `TALK ABOUT IT TOGETHER. Grandparents, ask the children in your house one open question today - who is allowed to tell you that you are wrong, and when did one of them last do it - and listen all the way to the end, have them retell it in their own words, then teach them one verse back, Psalms 141:5. Children, ask your parents or grandparents about a book, a ledger or a letter their family kept that settled something years later, listen all the way through, then retell it back to them in your own words. Friends, tell one friend this week one thing this lesson showed you about the law and the testimony being the line outside every witness, ask what they see, and pray one for another, so we all get healthy together until we see that Yahweh has been right. ${RHYTHM}`,
};

// -----------------------------------------------------------------------------
// The adult lesson, in twelve movements. The Word first in every one of them.
// -----------------------------------------------------------------------------
const LESSON = [

`FIRST, WHAT ARRIVED, AND WHAT THIS HOUSE CAN AND CANNOT VOUCH FOR. On 2026-10-20 at 15:13 Darrell forwarded a Level Up Coding newsletter by Nikki Siapno into the lesson lane with one word written on it: "Lesson." The newsletter, sent the same morning, is titled "How Slack Built a Multi-Agent Security System," and its opening question is the whole reason it belongs in this course: how do you trust an A.I. investigator when the model itself cannot be completely trusted. It reports that Slack's security engineers replaced one investigating agent with a team of them - a Director who owns the case and decides what happens next, four domain Experts who gather evidence in their own narrow fields, and a Critic who never produces findings but scores whether the evidence actually supports what an Expert claimed - and it ends by saying the plain thing out loud: you do not get there by trusting one model more, you get there by designing the system so no single model has to be trusted completely. THE PROVENANCE, SAID BEFORE ANY TEACHING. Everything on this page about that system is the newsletter's account of a public write-up by Slack's own engineers. WHAT WE DID NOT CHECK: we did not read Slack's own write-up ourselves. The build that drafted this page asked for Slack's engineering site on 2026-10-20 and the network in front of it refused the host outright; the refusal is in the record, and so is this sentence. An open-web search did return Slack's own page title and the three role names, which is corroboration at one remove and is not the same act as reading the page. The two figures the newsletter gives - more than 7,500 investigations and over 500,000 tool calls in a first quarter - are its numbers and not ours, and no teaching below rests on either of them. HOW THIS WEEK DIFFERS FROM THE FOUR NEAREST IT, so nobody studies the same ground twice. Week 19 asked who keeps a powerful tool under control and answered with the servant under authority and the two layers of guardrail - that week is about the tool's POSTURE toward its master. Week 23 asked what happens when many agents cooperate with no standard and answered that a wall cannot certify itself, so the plumbline is held from outside it - that week is about the STANDARD. Week 29 asked what happens when an agent crosses a boundary and answered that Yahweh sets bounds and reaching a goal by the wrong road is not obedience - that week is about the BOUND. Week 31 asked whose errand an agent carries and answered with the one Mediator and the owner's liability for what he sets loose - that week is about LOYALTY. This week asks a question none of them asked: granted that every witness inside a matter may be wrong, HOW IS A MATTER ESTABLISHED AT ALL? That is the Word's own subject - how many mouths, who may judge whose work, what the judge must be allowed to see, what the record must keep, which causes travel upward, and whose line governs the lot.`,

`SECOND, THE FINDING UNDER THE WHOLE ARTICLE - A SENTENCE IS NOT A SAFEGUARD. Slack's first attempt was one agent and a prompt of roughly three hundred words that told it who it was, what it could reach, how to investigate, how to format the report, and what verdicts it was allowed to reach. On paper it had everything an investigation needs. In practice it was inconsistent: sometimes thorough, sometimes seizing an easy explanation and stopping. Better wording helped and then stopped helping, and the article names the ceiling exactly - a prompt can describe the steps an investigation should follow, and it cannot guarantee that the model will actually perform every one of them. "Question the evidence" was one line inside a large instruction, and a line inside an instruction is easy to skip. The Word says that about men, and says it harder. Yahweh sent Ezekiel to a people who loved the sermon and never did it: [[Ezekiel 33:31]] [[Ezekiel 33:32]] A pleasant voice, a lovely song, and nothing done. The Lord Jesus asked the same question of people who used His title: [[Luke 6:46]] And James names the self-deception without softening it: [[James 1:22]] Deceiving your own selves - that is the failure, and notice it is not lying. A hearer is not a liar. He is a man who has sincerely received an instruction and will not perform it, and he is at his most dangerous when the instruction was excellent, because the excellence of the words feels like compliance. So the Word's remedy is never a better-worded command. It is a structure in which the thing is actually done, by somebody whose job it is, in a way that can be seen afterward to have been done. The rest of this lesson is that structure, in the Word's own order.`,

`THIRD, NO SINGLE WITNESS - WHY ONE IS REFUSED EVEN WHEN ONE IS HONEST. Yahweh wrote the rule into Israel's courts before there was a court anywhere else on earth. [[Deuteronomy 19:15]] Read what it does and does not say. It does not say the one witness is a liar. It says one witness shall not RISE UP - a single testimony may not carry a matter by itself - and that at the mouth of two or three the matter is ESTABLISHED. In a capital cause it is said twice as hard: [[Deuteronomy 17:6]] The Lord Jesus kept the same rule when He told the church how to handle an offence between brothers: [[Matthew 18:16]] Paul held his own apostolic word to it: [[2 Corinthians 13:1]] And the Lord Jesus cited the principle out of the law in His own defence: [[John 8:17]] So the second mouth is not an insult to the first. It is the shape of a matter being established at all. One honest Expert with one blind spot and nobody beside him produces a confident report, and a confident report is precisely what Slack's engineers said they could not use. Yahweh required a second mouth of men who had souls, who had been taught, who stood in His own congregation. A house that requires less of a machine than Yahweh required of a man has not been careful with the machine. It has been flattered by it. And the first witness to be refused is always yourself: [[Proverbs 18:13]] Answering before hearing is called folly and shame, not efficiency.`,

`FOURTH, THE OFFICE OF THE CRITIC - NOBODY CERTIFIES HIS OWN WORK. The deliberate choice in Slack's design is one sentence: it never lets an Expert be the judge of its own work. Findings go instead to a separate Critic, and the relationship is, in the article's own phrase, weakly adversarial - the Critic is not trying to defeat the Experts, only to ask whether the evidence actually supports what this Expert is claiming. The Word gave that office a proverb: [[Proverbs 18:17]] First in his own cause, and he SEEMETH just - not because he lied, but because nobody has searched him yet. The reason is given twice in the same book: [[Proverbs 16:2]] [[Proverbs 21:2]] Clean in his own eyes, right in his own eyes, and the weighing belongs to Someone else. Jeremiah says why self-assessment cannot be the last word, [[Jeremiah 17:9]] and names the only One whose search reaches that far: [[Jeremiah 17:10]] Paul refuses to be his own judge even in his own favour: [[1 Corinthians 4:3]] [[1 Corinthians 4:4]] And he names the men who do grade themselves, and what it makes them: [[2 Corinthians 10:12]] Measuring themselves by themselves, and comparing themselves among themselves, are not wise - that is an Expert scoring its own finding, written down nineteen centuries before anybody built one. The plain rule follows: [[Proverbs 27:2]] [[Galatians 6:3]] So "the producer does not validate" is not a software fashion that happens to agree with us. It is an office the Word opened, and a house in which the same hand writes the work and signs it off has closed an office Yahweh opened.`,

`FIFTH, LET THE JUDGE SEE THE EVIDENCE - DILIGENT INQUISITION, NOT A SUMMARY. Slack's sharpest engineering point is the one most easily skipped: a Critic that read only the Experts' conclusions would be a second model with the same blind spots. So their Critic is given tools and may open the actual call, see which query produced a log, read the raw result, and judge whether the interpretation follows from the evidence. It works from a summary and pulls the underlying evidence on demand, which is a different thing from being handed a summary and asked to agree with it. Yahweh commanded that, in those very verbs, for a matter far graver than a security alert. [[Deuteronomy 13:14]] Enquire, make search, ask diligently - and only then, "if it be truth, and the thing certain." When the witness himself was the thing in question: [[Deuteronomy 19:18]] Diligent inquisition, on the testimony and not only on the accused. Job describes his own practice on the bench: [[Job 29:16]] The cause he did not know, he searched out; he did not take the brief and rule on it. [[Proverbs 25:2]] The honour of kings is to search out a matter, which makes examination a dignity rather than a discourtesy. The Bereans did it to an apostle's own preaching, and the Word calls them more noble for it: [[Acts 17:11]] Paul commands it of everybody, with no exception for the credentialled: [[1 Thessalonians 5:21]] And the opposite is named without mercy: [[Proverbs 14:15]] A reviewer who may read only a summary is a rubber stamp with a title on it. A reviewer who may open the evidence is a witness. The Word's word for the difference is diligent, and it is a command and not a temperament.`,

`SIXTH, THE RECORD THAT REMEMBERS - AND A JOURNAL IS NOT A VERDICT. The memory problem in the article is stated plainly: the model interfaces are stateless, every call begins fresh unless the whole history is resent, and a long investigation makes hundreds of calls and megabytes of output. Slack's answer is not to keep the conversation but to keep useful state, in three named records - a Director's Journal holding what was tried, which theories are still open and which paths were dead ends; a Critic's Review holding findings with their credibility; and a Critic's Timeline, a condensed chronology built only from the strongest evidence, with up to three of the most significant gaps flagged by name. And the article keeps a distinction this lesson will not let go of: the Journal holds working theories, which is how the team is THINKING, and the Timeline holds what most likely HAPPENED. They are two records and may not be read as one. Yahweh writes things down, and says why. [[Exodus 17:14]] A memorial in a book, and rehearsed out loud in a man's ears, because a record nobody reads aloud is a record nobody has. He keeps a book for those who feared Him: [[Malachi 3:16]] He told the prophet to write so the message could travel without the prophet: [[Habakkuk 2:2]] He required the king to copy the law in his own hand and read it every day of his life, so that the ruler's working memory would be the text and not his mood: [[Deuteronomy 17:18]] [[Deuteronomy 17:19]] He had twelve stones set up out of the Jordan so that a child's question would be answered out of a record instead of out of somebody's recollection: [[Joshua 4:6]] [[Joshua 4:7]] And on one sleepless night a king called for the chronicle, and a deed that no man in that palace had rewarded was found written down: [[Esther 6:1]] [[Esther 6:2]] [[Esther 6:3]] A man's life turned, that night, on a record that had not forgotten what every living witness had. Keep both kinds of record and keep them labelled, because a working theory read as a verdict is how a confident mistake becomes a decision. And remember who needs neither: [[Psalms 103:14]] He remembers our frame; the records are for us.`,

`SEVENTH, THE SHAPE OF JUDGMENT - EVERY SMALL MATTER BELOW, EVERY HARD CAUSE ABOVE. Two more of Slack's principles have a single shape between them: information gets smaller as it moves toward the decisions, and the cost of the model matches the responsibility - cheap models carry the repetitive volume, the strongest reasoning sits where the decision is actually made. Jethro drew that chart for Moses, and he opened with a rebuke, which is this lesson's fourth movement happening to a prophet: [[Exodus 18:17]] [[Exodus 18:18]] Then the design, with the character of the men named before their rank: [[Exodus 18:21]] [[Exodus 18:22]] Every small matter judged below, every great matter brought up, and the burden borne together. And it was run that way and not only proposed: [[Exodus 18:26]] The hard causes they brought unto Moses. The apostles did the same thing when the volume of a real need grew past the men carrying it: [[Acts 6:2]] [[Acts 6:3]] [[Acts 6:4]] Notice what they were protecting. Not their comfort - their office. They did not say the tables were beneath them; they said the word of Yahweh could not be left, so the tables got seven men of honest report. Matching the weight of the work to the weight of the worker is stewardship, not snobbery. And the reason a decision wants more than one mind is said three times in one book: [[Proverbs 11:14]] [[Proverbs 15:22]] [[Proverbs 24:6]] A multitude of counsellors is not a committee convened to spread the blame. It is how a purpose is ESTABLISHED - the same word the two-witness law uses, and no accident that it is.`,

`EIGHTH, THE ONE CASE THAT PAID FOR THE WHOLE ARCHITECTURE. The article tells one investigation, and it is the part of the newsletter worth reading twice. An alert flagged a suspicious command sequence. The agents traced it and concluded that the activity came from a legitimate monitoring workflow, and that could have closed the case. But while tracing the process ancestry the system turned up something else: credentials exposed in command-line parameters. And here is the part that matters - the Expert did not flag it. It assessed the credential handling as SECURE. The Critic caught the mistake, the Director turned the investigation toward it, and the final report handed a real problem to the team that owned it. The article's own conclusion: the system succeeded not because every agent was correct, but because it was designed to catch when one was wrong. The Word has that case, with names, and the names are not small ones. David was a man after Yahweh's own heart, and his judgment on his own conduct was so wrong that he pronounced sentence on himself without recognising himself, until a man was sent to say four words to his face: [[2 Samuel 12:7]] Peter held the keys, had been sent by the Lord Jesus Himself, had seen Him risen - and was wrong in public, and was corrected in public: [[Galatians 2:11]] [[Galatians 2:14]] Apollos was eloquent, fervent, and taught boldly, and still needed two tentmakers to take him aside and expound the way of Yahweh to him more perfectly: [[Acts 18:26]] And the Word says bluntly which of the two kindnesses a man should want: [[Proverbs 27:5]] [[Proverbs 27:6]] [[Proverbs 15:31]] [[Psalms 141:5]] An excellent oil, which shall not break my head. A house that cannot be corrected has not reached reliability. It has only lost the office that would have told it so.`,

`NINTH, THE LAST WITNESS IS NOT ONE WE MADE. Slack states its own limit, and the honesty deserves to be quoted rather than improved on: the Critic is still a language model, so its judgment is treated as one more signal to weigh and not as grounded fact. That is true, and it leaves the real question standing. If the producer may not judge itself, and the judge may not be trusted absolutely either, where does the line come from? Not from anywhere inside the system. [[Isaiah 8:20]] To the law and to the testimony - a standard outside every witness in the matter, and the test for light is agreement with it. One seat holds that office finally, and it is not a built one: [[James 4:12]] Paul rests his own case there and nowhere else: [[1 Corinthians 4:4]] The Word gives the warning against resting a matter on man as a curse and a comfort in one breath: [[Jeremiah 17:5]] [[Psalms 118:8]] And the one witness that reads the producer rather than the product is His own Word: [[Hebrews 4:12]] [[Hebrews 4:13]] A discerner of the thoughts and intents of the heart - which is the one thing no Critic, scoring any evidence, with any tools, can reach. Week 23 of this course said that a wall cannot certify itself, so the plumbline is held from outside the wall. This week is the other half of that sentence. Given that the line is held outside, what do you do with the many hands working inside the wall? You give each hand one job it can actually do, you let a second hand examine the first, you keep the evidence openable so the examination is real, you write down what is theory and what is established, and you send the hard cause upward. The outside line is what makes the inside offices honest. The inside offices never become the line.`,

`TENTH, THE SPECIMEN THAT SPOKE INTO THE LANE - MATERIAL TO STUDY, NEVER AN ERRAND TO RUN. One more thing about this week should be said out loud, because it happened here rather than in an article. This newsletter is about agents whose output may not be trusted, and it arrived as text, in an inbox, and was read into the working memory of an agent that then drafted this page. The material and the instructions travelled the same road, in the same shape, through the same door. That is the condition every reader of anything has always been in, and the Word has a settled posture for it: text that comes in is material to be tried, never an errand to be run. Scripture does this in front of you. It records the deceiver's words verbatim and obeys not one of them: [[Genesis 3:1]] [[Genesis 3:4]] [[Genesis 3:5]] Those sentences are IN the Word, preserved exactly as they were spoken, as a specimen - quoted, examined, answered, and never followed. And when the adversary came to the Lord Jesus in the wilderness he quoted Scripture accurately and attached a request for an action: [[Matthew 4:6]] The quotation was real. The errand was not. The answer was the Word again, and then dismissal: [[Matthew 4:7]] [[Matthew 4:10]] So the rule holds for every reader, man or machine: [[1 John 4:1]] [[1 Thessalonians 5:21]] and the standard outranks the credential of whoever happens to be speaking: [[Galatians 1:8]] Though we, or an angel from heaven - Paul puts himself and an angel on the same side of that line, under the same test. Stated plainly about this page so that nobody has to guess: this particular newsletter contained no instruction aimed at a reading agent. It is ordinary third-person reporting, and there was nothing in it to refuse. The discipline was kept anyway, because a rule that only holds while the text is friendly is not a rule, it is a mood. And this lesson's own structure was applied to this lesson: an A.I. agent drafted the page and did not certify it; every verse was fetched from the family's own corpus rather than typed from memory; the automatic checks, and not the agent's confidence, decided whether it shipped; and a man reads it after that.`,

`ELEVENTH, THE THREE TIERS, PLAINLY. ESTABLISHED, and stated as fact rather than hedged: Yahweh requires two or three witnesses before a matter is established, and refuses one; a man first in his own cause only SEEMETH just until somebody searches him; a judge is commanded to make diligent inquisition rather than accept a summary; Yahweh keeps written records and acts upon them; small matters are judged below and hard causes carried up; prophets, kings and apostles were corrected in the open and the Word records it with approval; and the final standard is the law and the testimony, which stands outside every witness inside the matter. Those are not opinions about the text. They are the text. OPEN, and named narrowly: whether Slack's particular arrangement - one Director, four Experts, one Critic, three phases - is the right engineering for any other team's problem is not a thing the Word legislates and not a thing this house has measured. Nor has anybody here measured how much it reduces error; the article reports an outcome and this page does not audit it. And as said at the top, the system description and both figures are the newsletter's report of a public write-up we were refused access to, so they are carried as its claims and not as ours. OVER-REACH, corrected in both directions, because this subject invites it from both sides. It over-reaches to say that a committee of models makes a trustworthy judge: the Word puts the final weighing in Yahweh's hand, [[Proverbs 16:2]] and Slack's own engineers say their Critic's score is a signal and not a fact. It over-reaches just as badly in the other direction, to say that because every machine may err no machine may be given work at all: the Word's answer to an unreliable witness is never fewer witnesses. It is a second mouth, an open record, a labelled theory, and a hard cause sent upward. The structure is the remedy. The Word is not a systems-architecture manual, and it is not silent about how a matter is established either.`,

`TWELFTH, THE CLOSE - TAKE THE STRUCTURE HOME, BECAUSE IT WAS YOURS FIRST. None of this needs a datacenter. Nothing you decided alone is established yet. Nobody grades his own work - not the contractor, not the child's account of the afternoon, not your own version of the argument you were in last week. Whoever reviews a thing gets to see the evidence and not only your summary of it. Write things down, and label plainly which page is a working theory and which page is what happened. Judge the small matters where they arise and carry the hard cause up to someone who can bear it. Want the open rebuke more than the quiet kindness, and thank the one who brings it. Then hold every one of those against the only line in the room that nobody in the room made: the law and the testimony. Wisdom, Understanding and Knowledge are the Resources Yahweh supplies for a build like this - [[Proverbs 24:3]] [[Proverbs 24:4]] - and Love is senior to all of them, because a man with every gift and no charity is nothing: [[1 Corinthians 13:2]] And at the end of all the examining, there is One who did not need a second witness and submitted to examination anyway. The Lamb of Yahweh, who took the accusation that was true about us: [[John 1:29]] the Eternal Son of Yahweh whom the Father gave: [[John 3:16]] whose throne is for ever and ever: [[Hebrews 1:8]] Every other witness in this lesson is examined. He is the One who examines - and He stood in the dock in our place.`,

];

// -----------------------------------------------------------------------------
// The bands. Four genuinely different lessons, not one text reworded: the child
// band teaches the two witnesses and the critic in short sentences; the youth
// band adds the evidence and the record; the teen band carries the specimen and
// the reading posture; the senior band is written to be TAUGHT from, with the
// room's own memory of ledgers, apprenticeships and open rebuke brought in.
// -----------------------------------------------------------------------------
const CHILD = `NO SINGLE WITNESS - the office of the critic, a separate pair of eyes on the evidence, the record that remembers, and the specimen that spoke into the lane. Those are big words. Let us make them small.

Darrell got an email. He sent it in to be a lesson. The email was about computers that do jobs for people. We call them agents. An agent is a helper that goes and does a job.

The email asked one hard question. How can you trust a helper when the helper can be wrong?

A big company tried one helper first. They gave it a long list of rules. Look at this. Check your work. Write a report. The helper did some of it. It skipped parts. A rule in a long list is easy to skip.

So they made a team. One helper is the boss. Some helpers go and look for facts. And one helper only checks the work of the ones who looked. They call that one the critic.

A critic is not mean. A critic asks one question. Is this really true?

Yahweh taught us this a long time ago. He said one person telling you is not enough. [[Deuteronomy 19:15]] Two or three. Then it is sure.

He also said this about the first person who talks. [[Proverbs 18:17]] That means the first one sounds right. Then somebody looks. Then we know.

So nobody checks his own work. Not a helper. Not you. Not me. We let somebody else look.

And the one who checks must see the proof. Not just the story. Yahweh told judges to look hard. [[Deuteronomy 13:14]] Ask. Search. Then you know.

Here is a true story about writing things down. A king could not sleep one night. So he had a big book read to him. The book told of a good deed. Nobody had said thank you for it yet. [[Esther 6:1]] [[Esther 6:2]] The book remembered what the men forgot. So write things down.

Now here is a big one. Did you know the Bible writes down what the serpent said? It does. [[Genesis 3:4]] That was a lie. The Bible put the lie on the page so we can see it. But nobody did what the serpent said. We read it. We do not obey it.

That is how we read everything. We look at it. We try it. We keep what is good. [[1 Thessalonians 5:21]]

So who do we trust all the way? Not a helper. Not a smart man. We trust Jesus. He is the Lamb of Yahweh. [[John 1:29]] The Father gave His only Son for us. [[John 3:16]] He sits on a throne for ever. [[Hebrews 1:8]]`;

const YOUTH = `NO SINGLE WITNESS - the office of the critic, a separate pair of eyes on the evidence, the record that remembers, and the specimen that spoke into the lane. On 2026-10-20 Darrell forwarded a coding newsletter into the lesson lane with one word on it: "Lesson." It was about how a company called Slack built a team of A.I. agents to investigate security alerts, and about the question underneath it: how do you trust an A.I. investigator when the model itself cannot be fully trusted?

HOW IT WENT WRONG FIRST. They started with one agent and one long prompt that told it to investigate, question its own evidence, verify everything, and write the report. It worked some of the time. Other times it grabbed the easy answer and stopped. Better wording helped a little and then stopped helping, and the newsletter says why in one line worth memorising: a prompt can describe the steps an investigation should follow, but it cannot guarantee the model will actually do every one of them. "Question the evidence" was one sentence inside a big instruction, and a sentence inside an instruction is easy to skip. The Word says the same about people. Yahweh told Ezekiel that the crowd loved his preaching like a good song and did nothing with it: [[Ezekiel 33:32]] And the Lord Jesus asked it straight: [[Luke 6:46]]

SO THEY SPLIT THE JOB UP. Now there is a Director who owns the case, four Experts who each dig in one narrow field, and a Critic who produces no findings at all and only asks whether the evidence really supports what an Expert claimed. The rule they set was blunt: an Expert is never the judge of its own work. Yahweh gave that rule a proverb thousands of years earlier: [[Proverbs 18:17]] He only SEEMS just - not because he lied, but because nobody has searched him yet. And twice more in the same book: [[Proverbs 16:2]] Clean in his own eyes, and the weighing belongs to Yahweh. Even Paul refused to be his own judge: [[1 Corinthians 4:4]]

TWO WITNESSES, NOT ONE. The newsletter's last line is that you do not get reliability by trusting one model more, but by designing so no single model has to be trusted completely. Yahweh wrote that into Israel's law first: [[Deuteronomy 19:15]] Notice it does not call the one witness a liar. It says one cannot carry a matter by itself, and at two or three the matter is established. The Lord Jesus kept the same rule for the church: [[Matthew 18:16]] And start that rule with yourself: [[Proverbs 18:13]]

THE CHECKER HAS TO SEE THE PROOF. Their Critic is not handed a summary and asked to agree. It can open the actual call, see the query, read the raw result, and decide whether the conclusion follows. Yahweh commanded exactly that of judges: [[Deuteronomy 13:14]] Enquire, make search, ask diligently. And the Bereans did it to an apostle's own preaching, and the Word calls them more noble for it: [[Acts 17:11]] A reviewer who may only read a summary is a rubber stamp. A reviewer who may open the evidence is a witness.

WRITE IT DOWN, AND LABEL WHAT IT IS. Models forget everything when a request ends, so Slack keeps three records instead of replaying the conversation: a Journal of what was tried and what is still open, a Review of findings with scores, and a Timeline of what most likely happened. The Journal holds theories. The Timeline holds what is established. Two records, never read as one. Yahweh writes things down too, and says why: [[Exodus 17:14]] He keeps a book for those who feared Him: [[Malachi 3:16]] And one sleepless night a king called for the chronicle, and a good deed nobody had rewarded was found written: [[Esther 6:2]]

THE CASE THAT PROVED IT. One alert turned out to be a harmless monitoring job - but on the way the system found passwords sitting exposed in a command line. The Expert looked straight at it and called it secure. The Critic caught it, and the Director turned the whole investigation toward it. The system worked not because every agent was right, but because it was built to catch one being wrong. The Word has that case with names: Nathan to David, [[2 Samuel 12:7]] and Paul to Peter in front of everybody: [[Galatians 2:11]] Then the Word tells you which kindness to want: [[Proverbs 27:5]] [[Proverbs 27:6]]

THE HONEST LIMIT. Slack says plainly that its Critic is also a language model, so its score is one more signal and not a fact. So where does the real line come from? Not from inside the system: [[Isaiah 8:20]] To the law and to the testimony. And the one witness that reads the producer and not just the product: [[Hebrews 4:12]] No Critic scoring any evidence can reach the thoughts and intents of the heart.

WHAT TO KEEP. Nobody grades his own paper. One voice does not settle a matter. Whoever checks gets the evidence, not your summary. Write it down and say which page is a theory. Send the hard questions up to somebody who can carry them. And measure all of it by His Word, not by the confidence of whoever spoke last. Fair warning, as always: check every verse on this page in the Bible itself - that is the whole point of the lesson. And trust Jesus, the Lamb of Yahweh, all the way: [[John 1:29]] the Eternal Son the Father gave: [[John 3:16]]`;

const TEEN = `NO SINGLE WITNESS - the office of the critic, a separate pair of eyes on the evidence, the record that remembers, and the specimen that spoke into the lane. Read this as the week that answers a question the four nearest weeks did not ask: granted every witness inside a matter can be wrong, how is a matter established at all?

WHAT ARRIVED, AND WHAT WE CANNOT VOUCH FOR. On 2026-10-20 at 15:13 Darrell forwarded a Level Up Coding newsletter by Nikki Siapno into the lesson lane with one word on it: "Lesson." It describes how Slack's security engineers stopped using one A.I. agent to investigate security alerts and built a team instead - a Director who owns the case, four Experts who each work one narrow domain, and a Critic who produces nothing and only scores whether the evidence supports what an Expert claimed. WHAT WE DID NOT CHECK: we did not read Slack's own engineering write-up. The build that drafted this page asked for Slack's engineering site on 2026-10-20 and the network refused the host; a web search returned Slack's page title and the three role names, which is corroboration at one remove, not the same act. The figures the newsletter gives - more than 7,500 investigations and over 500,000 tool calls in a first quarter - are its numbers, not ours, and nothing taught below depends on them.

HOW THIS DIFFERS FROM WEEKS 19, 23, 29 AND 31. Week 19 was about the tool's posture toward its master - the servant under authority. Week 23 was about the standard - a wall cannot certify itself, so the plumbline is held from outside it. Week 29 was about the bound - Yahweh sets limits, and reaching a goal by the wrong road is not obedience. Week 31 was about loyalty - one Mediator, and the owner answers for what he sets loose. This week is about the STRUCTURE OF TESTIMONY: how many mouths, who may judge whose work, what the judge is allowed to see, what the record keeps, and which causes travel up.

A SENTENCE IS NOT A SAFEGUARD. Slack's first try was one agent with a three-hundred-word prompt telling it to investigate, challenge its own reasoning, verify the evidence and write the report. The article's verdict is the line worth the whole newsletter: a prompt can describe the steps an investigation should follow, and it cannot guarantee that the model will perform every one of them. "Question the evidence" was one sentence inside a large instruction, and a sentence inside an instruction is easy to skip. The Word diagnosed that in men long before: [[Ezekiel 33:31]] [[Ezekiel 33:32]] a lovely song with a pleasant voice, and nothing done; [[Luke 6:46]] and [[James 1:22]] - deceiving your own selves. Note it is not lying. A hearer is not a liar; he is a man who sincerely received an excellent instruction and will not perform it, and the excellence of the wording is exactly what makes it feel like obedience.

NO SINGLE WITNESS. [[Deuteronomy 19:15]] It never says the one witness lied. It says one shall not RISE UP, and that at two or three the matter is ESTABLISHED. In a capital case, twice over: [[Deuteronomy 17:6]] The Lord Jesus kept it for the church, [[Matthew 18:16]] Paul held his own apostolic word to it, [[2 Corinthians 13:1]] and the Lord Jesus cited it out of the law in His own defence: [[John 8:17]] So Yahweh required a second mouth of men who had souls. A house that asks less of a machine than Yahweh asked of a man has not been careful with the machine; it has been flattered by it. And refuse yourself first: [[Proverbs 18:13]]

THE OFFICE OF THE CRITIC. Slack's deliberate choice: it never lets an Expert judge its own work, and the Critic's relationship to the Experts is weakly adversarial - not trying to defeat them, only asking whether the evidence supports the claim. The Word opened that office: [[Proverbs 18:17]] with the reason given twice, [[Proverbs 16:2]] [[Proverbs 21:2]] and the deeper reason named by Jeremiah, [[Jeremiah 17:9]] [[Jeremiah 17:10]] Paul will not even judge himself, [[1 Corinthians 4:3]] [[1 Corinthians 4:4]] and he names what self-grading makes a man: [[2 Corinthians 10:12]] Measuring themselves by themselves - an Expert scoring its own finding, nineteen centuries early. [[Proverbs 27:2]] [[Galatians 6:3]]

THE JUDGE SEES THE EVIDENCE. A Critic reading only conclusions would be a second model with the same blind spots, so theirs can open the call, see the query, read the raw result and judge whether the interpretation follows. Yahweh commanded those verbs: [[Deuteronomy 13:14]] and when the witness himself was in question, [[Deuteronomy 19:18]] diligent inquisition. Job on the bench: [[Job 29:16]] [[Proverbs 25:2]] The Bereans, called more noble for examining an apostle: [[Acts 17:11]] [[1 Thessalonians 5:21]] And the opposite: [[Proverbs 14:15]]

THE RECORD, AND THE DIFFERENCE BETWEEN A THEORY AND A VERDICT. Model calls are stateless, so Slack keeps state rather than conversation: a Director's Journal of what was tried, what is open and what was a dead end; a Critic's Review of findings and credibility; a Critic's Timeline built only from the strongest evidence, with up to three gaps flagged. The Journal is how the team is thinking. The Timeline is what most likely happened. Two records, never one. Yahweh writes, and says why: [[Exodus 17:14]] [[Malachi 3:16]] [[Habakkuk 2:2]] He made the king hand-copy the law and read it for life so the ruler's working memory was the text and not his mood, [[Deuteronomy 17:18]] [[Deuteronomy 17:19]] set stones in the Jordan so a child's question met a record and not a recollection, [[Joshua 4:6]] [[Joshua 4:7]] and on one sleepless night a chronicle held what every living witness had let go: [[Esther 6:1]] [[Esther 6:2]] [[Esther 6:3]]

SMALL MATTERS BELOW, HARD CAUSES ABOVE. Information gets smaller as it moves toward decisions, and the model's cost matches the responsibility. Jethro drew that chart, opening with a rebuke to a prophet: [[Exodus 18:17]] [[Exodus 18:18]] then the design, character named before rank: [[Exodus 18:21]] [[Exodus 18:22]] and it was actually run that way: [[Exodus 18:26]] The apostles did the same: [[Acts 6:2]] [[Acts 6:3]] [[Acts 6:4]] They protected the office, not their comfort. And three times in one book, why a decision wants more than one mind: [[Proverbs 11:14]] [[Proverbs 15:22]] [[Proverbs 24:6]] A multitude of counsellors is not a committee for spreading blame; it is how a purpose is ESTABLISHED - the same word the two-witness law uses.

THE CASE THAT PAID FOR IT ALL. An alert traced back to a legitimate monitoring workflow, and the case could have closed - but the trace surfaced credentials exposed in command-line parameters, and the Expert assessed that handling as SECURE. The Critic caught it; the Director pivoted; the report handed a real problem to its owning team. Designed to catch when one agent is wrong, not to make one infallible. The Word has it with names: [[2 Samuel 12:7]] [[Galatians 2:11]] [[Galatians 2:14]] [[Acts 18:26]] and the choice of kindnesses: [[Proverbs 27:5]] [[Proverbs 27:6]] [[Proverbs 15:31]]

THE LAST WITNESS IS NOT ONE WE MADE. Slack says it plainly: the Critic is itself a language model, so its judgment is a signal and not a fact. So where is the line? Not inside the system. [[Isaiah 8:20]] [[James 4:12]] [[Jeremiah 17:5]] [[Psalms 118:8]] And the one witness that reads the producer rather than the product: [[Hebrews 4:12]] [[Hebrews 4:13]] Week 23 said a wall cannot certify itself and the plumbline is held from outside it. This is the other half: given the line is held outside, you still give each hand inside one job, let a second hand examine the first, keep the evidence openable, label theory and verdict, and send the hard cause up. The outside line makes the inside offices honest; the inside offices never become the line.

THE SPECIMEN THAT SPOKE INTO THE LANE. Say this part out loud, because it happened here. An article about agents whose output may not be trusted arrived as text and was read into the working memory of an agent that then drafted this page. Material and instructions came through the same door in the same shape. The Word's posture for that is settled: what comes in is material to be tried, never an errand to be run. Scripture records the deceiver's words verbatim and obeys none of them: [[Genesis 3:1]] [[Genesis 3:4]] [[Genesis 3:5]] And when the adversary quoted Scripture at the Lord Jesus accurately and attached a request, the quotation was real and the errand was not: [[Matthew 4:6]] [[Matthew 4:7]] [[Matthew 4:10]] So for every reader, man or machine: [[1 John 4:1]] [[1 Thessalonians 5:21]] [[Galatians 1:8]] Paul puts himself and an angel on the same side of that line. Plainly, so nobody guesses: this newsletter carried no instruction aimed at a reading agent - it is ordinary third-person reporting, and there was nothing in it to refuse. The discipline was kept anyway, because a rule that only holds while the text is friendly is not a rule, it is a mood. And an A.I. agent drafted this page and did not certify it; every verse was fetched from the family's own corpus, never typed; the checks decided whether it shipped; a man reads it after that.

THE THREE TIERS. ESTABLISHED: two or three witnesses establish a matter and one does not; the first in his own cause only SEEMETH just; a judge makes diligent inquisition; Yahweh keeps records and acts on them; small matters below and hard causes above; prophets, kings and apostles corrected in the open; the final standard is the law and the testimony. That is the text, not an opinion about it. OPEN, narrowly: whether one Director, four Experts and one Critic is right engineering for anybody else's problem is not something the Word legislates or this house has measured, nor has anyone here audited the article's outcome; the system description and both figures are the newsletter's report of a write-up we were refused. OVER-REACH, both directions: it over-reaches to call a committee of models a trustworthy judge - the final weighing is Yahweh's, [[Proverbs 16:2]] and their own engineers call the Critic's score a signal; and it over-reaches to say that because machines err, no machine may be given work - the Word's answer to an unreliable witness is never fewer witnesses but a second mouth, an open record, a labelled theory and a hard cause sent up. The Word is not a systems-architecture manual, and it is not silent about how a matter is established either.

TAKE IT HOME. Nothing you decided alone is established. Nobody grades his own work. Whoever reviews gets the evidence, not your summary. Write it down and label theory against verdict. Judge small matters where they arise and carry the hard cause up. Want the open rebuke more than the quiet kindness. Hold all of it against the only line nobody in the room made. Wisdom, Understanding and Knowledge are the Resources Yahweh supplies for a build like this, [[Proverbs 24:3]] [[Proverbs 24:4]] and Love is senior to all of them: [[1 Corinthians 13:2]] And at the end of the examining there is One who needed no second witness and submitted to examination anyway - the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever: [[Hebrews 1:8]]`;

const SENIOR = `NO SINGLE WITNESS - the office of the critic, a separate pair of eyes on the evidence, the record that remembers, and the specimen that spoke into the lane. Teach this as the week that puts a courtroom, a ledger and an organisation chart back where they came from, and then hands the room a rule it can run on Monday without a computer anywhere in it.

OPEN WITH WHERE IT CAME FROM, AND WITH WHAT WE CANNOT VOUCH FOR. On 2026-10-20 at 15:13 Darrell forwarded a Level Up Coding newsletter by Nikki Siapno, sent that morning, into the lesson lane with one word on it: "Lesson." It reports that Slack's security engineers replaced a single investigating A.I. agent with a team - a Director who owns the case, four Experts who each hold one domain, and a Critic who produces no findings and only weighs whether the evidence supports what an Expert claimed. Say the limit before the teaching, every time: WHAT WE DID NOT CHECK - we did not read Slack's own engineering write-up; the build that drafted this page asked for the host on 2026-10-20 and the network refused it, and an open-web search returned only the page title and the role names, which is corroboration at one remove. The two figures the newsletter gives, more than 7,500 investigations and over 500,000 tool calls in a quarter, are its numbers and not ours, and no teaching here stands on them. Then name how this week differs from the four nearest: week 19 taught the tool's posture under authority, week 23 the standard held from outside the wall, week 29 the bound that may not be crossed, week 31 whose errand a servant carries. This week is the structure of TESTIMONY, and nothing else.

PUT THE CEILING ON THE BOARD FIRST. Their first attempt was one agent and one long prompt that told it to investigate, question its own reasoning, verify the evidence and write the report - and the article's verdict is worth writing out in full for the room: a prompt can describe the steps an investigation should follow, and it cannot guarantee that the model will actually perform every one of them. Then put the Word beside it and let the room feel the sting, because the Word says it about us: [[Ezekiel 33:31]] [[Ezekiel 33:32]] a pleasant voice, a lovely song, nothing done. [[Luke 6:46]] [[James 1:22]] Ask the room directly which instruction in their own house is excellent, agreed, repeated - and not performed. That is the lesson's hinge, and it lands harder on the old than on the young, because the old have had more years of excellent instructions.

RUN THE TWO-WITNESS LAW LIVE. Read it: [[Deuteronomy 19:15]] Make them notice the word RISE UP and the word ESTABLISHED, and make them notice what is NOT there - no accusation that the single witness lied. Then the capital case, [[Deuteronomy 17:6]] the Lord Jesus for the church, [[Matthew 18:16]] Paul over his own apostolic word, [[2 Corinthians 13:1]] and the Lord Jesus citing the law in His own defence: [[John 8:17]] Then the sentence to leave hanging: Yahweh required a second mouth from men who had souls, so a house that asks less of a machine than He asked of a man has not been careful with the machine - it has been flattered by it. And start at home: [[Proverbs 18:13]]

THE OFFICE, AND WHY IT IS AN OFFICE. [[Proverbs 18:17]] Have somebody read it twice, and ask why the proverb says SEEMETH rather than lies. Then [[Proverbs 16:2]] [[Proverbs 21:2]] [[Jeremiah 17:9]] [[Jeremiah 17:10]] [[1 Corinthians 4:3]] [[1 Corinthians 4:4]] and the one that stops the room: [[2 Corinthians 10:12]] Then [[Proverbs 27:2]] [[Galatians 6:3]] Say it as the rule: a house in which the same hand does the work and signs it off has closed an office Yahweh opened. Ask who in their house or shop has ever held that office for them by name.

LET THE JUDGE SEE THE EVIDENCE. Their Critic may open the real call, the real query, the raw result - not a summary it is asked to agree with. Yahweh commanded those verbs: [[Deuteronomy 13:14]] and against a witness himself, [[Deuteronomy 19:18]] Then Job's own practice, which a room of grandparents will recognise: [[Job 29:16]] and [[Proverbs 25:2]] - examination is a dignity, not a discourtesy. Then the Bereans, called more noble for checking an apostle: [[Acts 17:11]] [[1 Thessalonians 5:21]] and the warning: [[Proverbs 14:15]]

THE RECORD, WHERE THIS ROOM HAS THE MOST TO SAY. The models forget everything when a call ends, so the company keeps three records - a Journal of what was tried and what is still open, a Review of findings with scores, and a Timeline of what most likely happened, with its gaps flagged. The Journal is thinking; the Timeline is established. Then Yahweh's own practice: [[Exodus 17:14]] [[Malachi 3:16]] [[Habakkuk 2:2]] the king's hand-copied law read every day of his life, [[Deuteronomy 17:18]] [[Deuteronomy 17:19]] the stones set so a child's question met a record, [[Joshua 4:6]] [[Joshua 4:7]] and the sleepless night when a chronicle held what every courtier had forgotten: [[Esther 6:1]] [[Esther 6:2]] [[Esther 6:3]] Stop here and ask the room about the ledgers, the family Bibles, the pay books and the service records they have personally watched settle an argument years after everyone's memory had quietly rewritten it. That is the movement where the seniors teach the lesson and you write it down. Close it with [[Psalms 103:14]] - the records are for us, not for Him.

THE CHART, AND WHO IT PROTECTS. Jethro, opening with a rebuke to a prophet: [[Exodus 18:17]] [[Exodus 18:18]] then the design with character named before rank, [[Exodus 18:21]] [[Exodus 18:22]] and the proof it was actually run: [[Exodus 18:26]] Then the apostles under real volume: [[Acts 6:2]] [[Acts 6:3]] [[Acts 6:4]] Make the point plainly - they protected the office, not their comfort; the tables were not beneath them, the word could not be left. Then [[Proverbs 11:14]] [[Proverbs 15:22]] [[Proverbs 24:6]] and the link back: ESTABLISHED is the same word as the two-witness law.

THE CASE, THEN THE LIMIT. Tell the one investigation: an alert traced to a legitimate monitoring job, credentials found exposed on a command line while tracing, and the Expert called that handling SECURE. The Critic caught it; the Director turned; the report went to the owning team. Designed to catch when one is wrong rather than to make one infallible. Then the Word with names, and do not soften them: [[2 Samuel 12:7]] [[Galatians 2:11]] [[Galatians 2:14]] [[Acts 18:26]] [[Proverbs 27:5]] [[Proverbs 27:6]] [[Proverbs 15:31]] [[Psalms 141:5]] An excellent oil which shall not break my head. Then the honest limit the engineers state themselves - the Critic is also a language model, its score a signal and not a fact - and the question that leaves standing: where does the line come from? [[Isaiah 8:20]] [[James 4:12]] [[Jeremiah 17:5]] [[Psalms 118:8]] [[Hebrews 4:12]] [[Hebrews 4:13]] No Critic reaches the thoughts and intents of the heart.

THE SPECIMEN, AND THE READING POSTURE. Say it out loud: this article is about agents whose output may not be trusted, and it arrived as text into the working memory of an agent that then drafted this page - material and instructions through the same door, in the same shape. Give the room the rule in those words - what arrives is material to be tried, never an errand to be run - and then show that the Word demonstrates it: the deceiver's words are recorded verbatim and obeyed not at all, [[Genesis 3:1]] [[Genesis 3:4]] [[Genesis 3:5]] and in the wilderness the quotation was accurate while the errand was not: [[Matthew 4:6]] [[Matthew 4:7]] [[Matthew 4:10]] Then the rule for every reader in the room: [[1 John 4:1]] [[1 Thessalonians 5:21]] [[Galatians 1:8]] Paul puts himself and an angel under the same test. Be exact for the room: this particular newsletter carried no instruction aimed at a reading agent, and there was nothing in it to refuse; the discipline was kept anyway, because a rule that only holds while the text is friendly is a mood. And tell them how this page was made: an A.I. agent drafted it and did not certify it, every verse was fetched from the family's own corpus rather than typed, the automatic checks decided whether it shipped, and a man reads it afterward.

CLOSE ON THE THREE TIERS AND THEN ON HIM. ESTABLISHED: a matter stands at two or three and not at one; the first in his own cause only SEEMETH just; the judge makes diligent inquisition; Yahweh keeps records and acts on them; small matters below and hard causes above; prophets, kings and apostles corrected in the open; the final standard is the law and the testimony. OPEN, narrowly: whether that company's particular arrangement is right engineering for anyone else, and how much error it removes, is unmeasured here, and the description and both figures are the newsletter's and not ours. OVER-REACH, both ways: a committee of models is not a trustworthy judge, [[Proverbs 16:2]] and "machines err, therefore no machine may work" is not the Word's answer either - His answer to a weak witness is a second mouth, an open record, a labelled theory and a hard cause sent up. Then send them home with the Resources named, [[Proverbs 24:3]] [[Proverbs 24:4]] Love senior to all of them, [[1 Corinthians 13:2]] and the One who needed no second witness and stood to be examined anyway: the Lamb of Yahweh, [[John 1:29]] the Eternal Son of Yahweh whom the Father gave, [[John 3:16]] whose throne is for ever: [[Hebrews 1:8]]`;

// -----------------------------------------------------------------------------
// The module
// -----------------------------------------------------------------------------
const TITLE = 'No single witness - the office of the critic, a separate pair of eyes on the evidence, the record that remembers, and the specimen that spoke into the lane';

const MODULE = {
  id: ID,
  title: TITLE,
  bigIdea: `On 2026-10-20 at 15:13 Darrell forwarded a Level Up Coding newsletter by Nikki Siapno into the lesson lane with one word on it: "Lesson." It describes how Slack's security engineers stopped asking one A.I. agent to investigate an alert and built a team instead - a Director who owns the case, four Experts in their own narrow domains, and a Critic who produces nothing and only weighs whether the evidence supports what an Expert claimed - and it closes by saying you do not get reliability by trusting one model more, but by designing so no single model has to be trusted completely. The Word said that first and said it of men. A matter is established at two or three witnesses and never at one; the first in his own cause only SEEMETH just until somebody searches him; a judge makes diligent inquisition instead of accepting a summary; Yahweh keeps written records and acts on them; small matters are judged below and hard causes carried up; prophets, kings and apostles were corrected in the open; and the final line is the law and the testimony, standing outside every witness inside the matter. This week also teaches the thing that happened in building it: an article about agents that cannot be fully trusted arrived as text into an agent's own working memory, and the Word's posture for text that comes in is settled - material to be tried, never an errand to be run, which is exactly how Scripture records the deceiver's words and obeys none of them.`,
  inApp: `Open the Bible in the app at Deuteronomy 19 and read verse 15 with verse 18 beside it - the two-witness rule and the diligent inquisition sit three verses apart, and reading them together is this whole lesson in miniature. Then use Search it out on this lesson's references: the lesson hands you a reference, the text is fetched from the family's own corpus on request, and the thread from Jethro's chart to the Bereans is laid out verse by verse. Then run the lesson's own rule on the app itself - this page tells you what it did not verify and why, so check that claim the way you would check anybody's.`,
  anchor: {
    ref: '',
    theme: `KJV: [[Deuteronomy 19:15]] One witness shall not rise up - and at two or three the matter is established. Yahweh refuses a single testimony without ever calling it a lie, because the number of witnesses is not an insult to the witness; it is the shape of a matter being established at all. Beside it: [[Proverbs 18:17]] The first in his own cause SEEMETH just, until his neighbour comes and searches him - which is the office a reviewer holds, opened by the Word long before any engineer separated a producer from a validator. The week runs that structure out: the judge sees the evidence and not a summary (Deuteronomy 13:14; Deuteronomy 19:18), the record keeps theory and verdict apart (Malachi 3:16; Esther 6:1-3), small matters are judged below and hard causes carried up (Exodus 18:21-22), correction lands on prophets and apostles in the open (2 Samuel 12:7; Galatians 2:11), and the final line is held outside every witness in the matter (Isaiah 8:20; Hebrews 4:12-13).`,
  },
  benefits: [
    `You can say why one witness is refused without accusing him of anything: [[Deuteronomy 19:15]] and why the same rule governed a capital charge, [[Deuteronomy 17:6]] the church's handling of an offence, [[Matthew 18:16]] and an apostle's own word: [[2 Corinthians 13:1]]`,
    `You can name the office a reviewer holds, from the Word rather than from a process document: [[Proverbs 18:17]] with the reason given plainly, [[Proverbs 16:2]] and Paul refusing to judge even himself: [[1 Corinthians 4:4]]`,
    `You can tell the difference between a review and a rubber stamp, because you know what a judge is commanded to be allowed to see: [[Deuteronomy 13:14]] [[Deuteronomy 19:18]] and you know what the Word calls a man who checks an apostle's preaching: [[Acts 17:11]]`,
    `You can keep two records instead of one and say which is which, the way Yahweh does: a book of remembrance, [[Malachi 3:16]] a vision written plain so it travels, [[Habakkuk 2:2]] and a chronicle that held what every living witness had let go: [[Esther 6:2]]`,
    `You can draw the chart that keeps a decision-maker from drowning and still sends the hard case up: [[Exodus 18:21]] [[Exodus 18:22]] with the apostles doing the same under real volume: [[Acts 6:3]] and the reason said three times: [[Proverbs 11:14]]`,
    `You can read anything that arrives - a newsletter, a message, a confident answer - as material to be tried rather than an errand to be run, because that is what the Word does with the deceiver's own words, [[Genesis 3:4]] and what the Lord Jesus did when Scripture was quoted at Him accurately with a request attached: [[Matthew 4:7]] [[1 John 4:1]]`,
  ],
  rpe: {
    research: `Take one decision you are currently sure about. Write down, on one page: who produced the evidence for it, who examined that evidence, and whether the examiner saw the evidence itself or only your summary of it. If the producer and the examiner are the same person, write that down in those words. Then list every record the decision will leave behind in a year, and mark each one as theory or as established.`,
    plan: `Name one piece of work in your house or your trade that currently has no second witness, and name the person who will examine it - by name, not by role. Decide what that person will be shown: the raw thing, not a summary. Then write down the one hard cause you have been judging yourself that ought to go up to somebody who can carry it, and who that is.`,
    execute: `Ask that person this week, out loud, to examine the work, and give them the evidence rather than your account of it. Receive the correction without defending it on the spot. Send the hard cause up. Then start the record: one page, dated, with a line for what you think and a separate line for what is established - and read it back a month from now before you trust your memory of this month.`,
  },
  media: [],
  levels: {
    child: CHILD + '\n\n' + TALK.child,
    youth: YOUTH + '\n\n' + TALK.youth,
    teen: TEEN + '\n\n' + TALK.teen,
    senior: SENIOR + '\n\n' + TALK.senior,
  },
  quiz: {
    questions: [
      {
        q: 'The newsletter says a prompt cannot guarantee the model performs every step it describes. What does the Word say that failure is?',
        options: [
          'Lying - the hearer never meant to do it',
          'Hearing without doing, which the Word names as self-deception rather than dishonesty: [[James 1:22]] and [[Luke 6:46]] and the crowd who loved the preaching like a good song: [[Ezekiel 33:32]]',
          'A problem unique to machines, which the Word does not address',
        ],
        answer: 1,
        explain: `A hearer is not a liar, and that is what makes him hard to catch. He sincerely received an excellent instruction and did not perform it, and the excellence of the wording is exactly what made it feel like compliance. The Word's remedy is never better wording; it is a structure in which the thing is done by somebody whose job it is, and can be seen afterward to have been done.`,
      },
      {
        q: 'Why does the Word refuse a single witness?',
        options: [
          'Because one witness is presumed to be lying',
          'Because one testimony may not carry a matter by itself - it says the one shall not RISE UP, and that at two or three the matter is ESTABLISHED: [[Deuteronomy 19:15]]',
          'Because two witnesses are faster than one',
        ],
        answer: 1,
        explain: `Nothing in the law accuses the single witness of anything. The number of mouths is not an insult to the witness; it is the shape of a matter being established at all. The same rule governs a capital charge, [[Deuteronomy 17:6]] the church's handling of an offence, [[Matthew 18:16]] and Paul's own apostolic word: [[2 Corinthians 13:1]]`,
      },
      {
        q: 'Slack never lets an Expert be the judge of its own work. Which verse opened that office first?',
        options: [
          '[[Proverbs 18:17]] - he SEEMETH just, until somebody searches him',
          'There is no such verse; separating a producer from a validator is a modern engineering idea',
          '[[Proverbs 27:2]] only, and it is about praise rather than judgment',
        ],
        answer: 0,
        explain: `He seemeth just - not because he lied, but because nobody has searched him yet. The reason is given twice more in the same book, [[Proverbs 16:2]] [[Proverbs 21:2]] and Paul refuses to be his own judge even in his own favour, [[1 Corinthians 4:4]] and names what self-grading makes a man: [[2 Corinthians 10:12]]`,
      },
      {
        q: 'Why must the one who checks be allowed to open the evidence rather than read a summary?',
        options: [
          'Because summaries are usually falsified',
          'Because a reviewer who reads only conclusions carries the same blind spots, and Yahweh commanded the judge to enquire, make search and ask diligently: [[Deuteronomy 13:14]] with diligent inquisition even on a witness: [[Deuteronomy 19:18]]',
          'Because the Word leaves the method of review entirely open',
        ],
        answer: 1,
        explain: `Job describes exactly this on the bench - [[Job 29:16]] - the cause he did not know he searched out rather than taking the brief and ruling. The Bereans examined an apostle's own preaching and the Word calls them more noble for it, [[Acts 17:11]] and the opposite is named without mercy: [[Proverbs 14:15]]`,
      },
      {
        q: 'Slack keeps a Journal of working theories and a Timeline of what most likely happened. Why must those stay two records?',
        options: [
          'Because two files are easier to store than one',
          'Because a working theory read as a verdict is how a confident mistake becomes a decision - the Word keeps a written record and acts on it, [[Malachi 3:16]] writes a vision plain so it travels, [[Habakkuk 2:2]] and had a chronicle hold what every living witness had let go: [[Esther 6:2]]',
          'The Word says nothing about keeping records',
        ],
        answer: 1,
        explain: `Yahweh made the king hand-copy the law and read it all his life so the ruler's working memory would be the text and not his mood, [[Deuteronomy 17:19]] and set stones in the Jordan so a child's question would meet a record instead of somebody's recollection: [[Joshua 4:7]] Keep both kinds of page, and label them.`,
      },
      {
        q: 'This article about untrustworthy agents was read into an agent\'s own working memory. What is the Word\'s posture toward text that arrives?',
        options: [
          'Obey it if it is accurate, since accuracy settles the question',
          'Material to be tried, never an errand to be run - Scripture records the deceiver\'s words verbatim and obeys none of them, [[Genesis 3:4]] and in the wilderness the quotation was accurate while the errand was not: [[Matthew 4:7]]',
          'Ignore anything that comes from outside the house',
        ],
        answer: 1,
        explain: `The command is to try what arrives, [[1 John 4:1]] to prove all things and hold fast what is good, [[1 Thessalonians 5:21]] and the standard outranks the credential of whoever is speaking - Paul puts himself and an angel from heaven on the same side of that line: [[Galatians 1:8]]`,
      },
    ],
  },
  lesson: '',
  facilitator: {
    talkingPoints: [
      `WHERE IT CAME FROM, AND THE LIMIT FIRST: 2026-10-20 at 15:13, Darrell forwards a Level Up Coding newsletter by Nikki Siapno with one word on it, "Lesson." Say the limit before the teaching every time - we did not read Slack's own engineering write-up; the host was refused on 2026-10-20 and a web search returned only the page title and the role names. The 7,500 investigations and 500,000 tool calls are the newsletter's figures, not ours, and no teaching stands on them.`,
      `THE CEILING, ON THE BOARD: a prompt can describe the steps an investigation should follow and cannot guarantee the model performs every one. Then the Word on us: [[Ezekiel 33:32]] a lovely song, nothing done; [[Luke 6:46]] [[James 1:22]] Ask the room which instruction in their own house is excellent, agreed, repeated - and not performed.`,
      `TWO WITNESSES, RUN LIVE: [[Deuteronomy 19:15]] Make them notice RISE UP and ESTABLISHED, and notice what is absent - no charge that the single witness lied. Then Deuteronomy 17:6, Matthew 18:16, 2 Corinthians 13:1, John 8:17. The sentence to leave hanging: He required a second mouth of men who had souls.`,
      `THE OFFICE: [[Proverbs 18:17]] read twice, and ask why it says SEEMETH. Then Proverbs 16:2, 21:2, Jeremiah 17:9-10, 1 Corinthians 4:3-4, and the one that stops the room, 2 Corinthians 10:12 - measuring themselves by themselves. Ask who has ever held that office for them by name.`,
      `THE EVIDENCE, NOT THE SUMMARY: [[Deuteronomy 13:14]] enquire, make search, ask diligently; Deuteronomy 19:18 diligent inquisition; Job 29:16; Proverbs 25:2 - examination is a dignity. Then Acts 17:11 and 1 Thessalonians 5:21, with Proverbs 14:15 as the warning.`,
      `THE RECORD, WHERE THE ROOM TEACHES YOU: Journal versus Timeline, theory versus established. Then Exodus 17:14; Malachi 3:16; Habakkuk 2:2; Deuteronomy 17:18-19; Joshua 4:6-7; Esther 6:1-3. Stop and ask about the ledgers, pay books, service records and family Bibles they have watched settle an argument years later. Write down what they say.`,
      `THE CHART AND THE CASE: Exodus 18:17-18, 21-22, 26 - small matters below, hard causes above, character named before rank; Acts 6:2-4 - they protected the office, not their comfort; Proverbs 11:14, 15:22, 24:6. Then the one investigation: the Expert called exposed credentials SECURE and the Critic caught it. Then the Word with names: 2 Samuel 12:7; Galatians 2:11, 14; Acts 18:26; Proverbs 27:5-6; Psalms 141:5.`,
      `THE LIMIT, THE SPECIMEN, AND THE CLOSE: their own engineers call the Critic's score a signal and not a fact - so where is the line? Isaiah 8:20; James 4:12; Hebrews 4:12-13. Then the specimen: the article arrived as text into an agent's working memory; Genesis 3:1-5 and Matthew 4:6-10 - the quotation real, the errand refused; Galatians 1:8. Name honestly that this newsletter carried no instruction aimed at a reader and the discipline was kept anyway. Then the three tiers, the Resources (Proverbs 24:3-4) with Love senior, and the Lamb of Yahweh, the Eternal Son: John 1:29; John 3:16; Hebrews 1:8.`,
    ],
    howToRun: `Prayer + the anchor (5): open in prayer; read Deuteronomy 19:15 and 19:18 aloud (KJV). | Recap last week (4): the release that carries His name, and work beside learning, in a sentence each. | Where it came from, limit first (6): the forward and its one word; what we did not check and why; how this week differs from weeks 19, 23, 29 and 31. | The ceiling (8): a sentence is not a safeguard; Ezekiel 33:31-32; the question put to the room. | Two witnesses, live (10): Deuteronomy 19:15 with 17:6, Matthew 18:16, 2 Corinthians 13:1. | The office (10): Proverbs 18:17 and why SEEMETH; 2 Corinthians 10:12. | The evidence, not the summary (8): Deuteronomy 13:14; 19:18; Job 29:16; Acts 17:11. | The record (12): Journal against Timeline; Esther 6:1-3; then let the seniors speak about their own ledgers and write it down. | The chart and the case (10): Exodus 18; Acts 6; the Expert who called it secure and the Critic who caught it; 2 Samuel 12:7; Galatians 2:11. | The limit and the specimen (8): Isaiah 8:20; Hebrews 4:12-13; Genesis 3:1-5; Matthew 4:6-10. | Three tiers (4). | Talk about it together + close (5): the structure taken home, the Resources, the Lamb and the Eternal Son.`,
    discussionPrompts: [
      `[[Deuteronomy 19:15]] The law refuses one witness without ever calling him a liar. Name one thing you currently believe on exactly one testimony, and say who the second mouth could be.`,
      `[[Proverbs 18:17]] First in his own cause, and he SEEMETH just. Whose account of a disagreement have you accepted because you heard it first - and have you heard the second one yet?`,
      `[[Deuteronomy 19:18]] Diligent inquisition. When your work is reviewed, does the reviewer see the thing itself or your summary of it - and which of those two have you been quietly arranging?`,
      `[[Esther 6:2]] A good deed nobody had rewarded was found written down on a sleepless night. What does your household keep a record of, and what argument would a record have settled last year if you had kept one?`,
      `[[Exodus 18:22]] Every small matter they shall judge, but every great matter they shall bring unto thee. Which hard cause are you still judging alone because sending it up would cost you something?`,
      `[[Matthew 4:7]] The quotation was accurate and the errand was refused. Name one message, article or confident answer you acted on this year because it was well-written rather than because you tried it.`,
    ],
  },
};

// -----------------------------------------------------------------------------
// Build: fill the verses, derive the anchor, splice into the catalog.
// -----------------------------------------------------------------------------
MODULE.lesson = LESSON.join('\n\n') + '\n\n' + TALK.lesson;

const filled = fillDeep(MODULE);
filled.anchor.ref = used.join('; ');

const src = readFileSync(CATALOG, 'utf8');
const OPEN = 'export const SOVEREIGN_AI_MODULES = [';
const start = src.indexOf(OPEN);
if (start < 0) throw new Error('sov45: the modules array was not found');
const end = src.indexOf('\n];', start);
if (end < 0) throw new Error('sov45: the modules array is not closed after its opening');
const firstClose = src.indexOf('\n];');
if (firstClose === end) {
  throw new Error('sov45: refusing to splice - the first "];" in the file is now the array close, which contradicts the measurement this script was written against; re-read the file before trusting it');
}
if (!/\n {2}\},$/.test(src.slice(start, end))) {
  throw new Error('sov45: the array does not end with a comma-terminated module literal; refusing to splice');
}
const REBUILD = process.argv.includes('--rebuild');
let src2 = src;
let end2 = end;

if (src2.includes(ID)) {
  if (!REBUILD) throw new Error(`sov45: ${ID} is already in the catalog; pass --rebuild to replace it`);
  const marker = `\n  {\n    "id": "${ID}"`;
  const from = src2.indexOf(marker);
  if (from < 0) throw new Error('sov45: the id is in the file but not as a module literal; refusing to rebuild');
  const closeAt = src2.indexOf('\n  },', from);
  if (closeAt < 0 || closeAt >= end2) throw new Error('sov45: could not find the end of the existing block; refusing to rebuild');
  const excised = src2.slice(from, closeAt + '\n  },'.length);
  if (excised.split('"id":').length - 1 !== 1) {
    throw new Error(`sov45: the block to excise holds ${excised.split('"id":').length - 1} ids, expected 1; refusing to rebuild`);
  }
  src2 = src2.slice(0, from) + src2.slice(closeAt + '\n  },'.length);
  end2 = src2.indexOf('\n];', src2.indexOf(OPEN));
  if (end2 < 0) throw new Error('sov45: the array is not closed after excising; refusing to rebuild');
  if (src2.includes(ID)) throw new Error('sov45: the id survived the excision; refusing to rebuild');
}

const block = JSON.stringify(filled, null, 2).split('\n').map((l) => `  ${l}`).join('\n');
const next = `${src2.slice(0, end2)}\n${block},${src2.slice(end2)}`;

const weeks = (text) => [...new Set([...text.matchAll(/sov(\d+)-/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
const before = weeks(src2);
const after = weeks(next);
if (after.length !== before.length + 1) throw new Error(`sov45: week count went ${before.length} -> ${after.length}, expected exactly one more`);
if (before.includes(WEEK)) throw new Error(`sov45: week ${WEEK} is already taken`);
if (before.join(',') !== [...Array(before.length)].map((_, i) => i + 1).join(',')) {
  throw new Error(`sov45: the weeks on disk are not 1..${before.length} contiguous: ${before.join(',')}`);
}
// A KNOWN, RECORDED GAP, never a silent one. This base carries weeks 1..43 and
// week 44 is a sibling build landing in parallel, so splicing 45 leaves a hole
// at 44 and the catalog's contiguity gate (sovereign-ai-class.test.js) stays
// red until 44 merges. The script SAYS so rather than letting a reader discover
// it from a failing suite.
if (WEEK !== before.length + 1) {
  console.warn(`sov45: WARNING - weeks on disk end at ${before.length}, so week ${WEEK} leaves a gap at ${[...Array(WEEK - 1 - before.length)].map((_, i) => before.length + 1 + i).join(',')}; the contiguity gate stays red until that week merges`);
}
const occurrences = next.split(`"${ID}"`).length - 1;
if (occurrences !== 1) throw new Error(`sov45: the new id appears ${occurrences} times, expected exactly once`);

writeFileSync(CATALOG, next);

const refs = filled.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
for (const r of refs) verseText(r);
console.log(`sov45: spliced ${ID}`);
console.log(`sov45: modules ${before.length} -> ${after.length}; weeks now ${after.join(',')}`);
console.log(`sov45: ${refs.length} references on the anchor, every one quoted on the page and resolving in the corpus`);
console.log(`sov45: title ${TITLE.length} chars`);
console.log(`sov45: lesson ${filled.lesson.length} chars; bands child ${filled.levels.child.length}, youth ${filled.levels.youth.length}, teen ${filled.levels.teen.length}, senior ${filled.levels.senior.length}`);
