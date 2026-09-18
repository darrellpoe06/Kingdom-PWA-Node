// =============================================================================
// software-project-management-course — "Software Project Management: Prove It"
// =============================================================================
// Darrell, 2026-09-17, in the same breath as the general project-management ask:
//
//   "I'd like courses on project management and software project management,
//   and I'd like both of those to be available as courses similarly, and as
//   many lessons in those as we can think of, and I will of course add more to
//   that once we begin."
//
// And the frame that governs both (the reason this is not PMP-with-verses):
//
//   "But I do believe PMP and ITIL are in the word of God... the algorithms in
//   the Bible are more rigorous than any algorithm and they're telling you
//   about you."
//
// WHY A SECOND COURSE RATHER THAN MORE LESSONS IN THE FIRST. Software breaks
// differently. A wall that is out of plumb is visible; a defect is not. A
// building is finished once; software is released continuously, and the release
// is the moment most houses stop watching. So this course runs the same
// Word-first method on the failures that are specific to software: a
// requirement that was never a commitment, an estimate that pretended to
// precision it did not have, an incident answered before it was heard, a green
// pipeline over a stale site, and a test suite that always passes.
//
// THIS HOUSE'S OWN SCARS ARE THE CASE STUDIES, and they are cited as decision
// records rather than as hypotheticals, because a course on software delivery
// taught from invented examples in a repository that has real ones would be
// the weaker teaching:
//   - DR-0107: enabling an auto-merge lane took poetech.us stale for ~9 hours
//     while every CI check was green. CI-green is not deployed.
//   - DR-0125: every safeguard watched the pipeline and none ever made an HTTP
//     request to the product, so "is the site up?" had no measured answer.
//   - DR-0076 sec. 3: a gate that always passes is itself a lie, so a gate ships
//     only after it is shown to CATCH the break.
//   - DR-0075: a rough edge left alone needs a stated why AND a re-review date.
//
// WHAT THIS COURSE DOES NOT CLAIM (DR-0076 sec. 8). Nothing here claims that
// reading the Word raises an ITIL or PMP exam score, shortens a delivery cycle,
// or lowers a defect rate. None of that was measured. What is claimed is what
// the verses say, what the named decision records recorded, and what he
// reported about his own comprehension.
//
// EVERY QUOTATION IS VERBATIM from the verified local KJV corpus
// (`app/public/bible/kjv`), fetched rather than recalled, and every quoted span
// is held by software-project-management-course.test.js under strict comparison
// (DR-0456 — whitespace-only normalisation, apostrophes never normalised).
// =============================================================================

import { progressSummaryFor, exportCurriculumMarkdownFor } from './church-classes.js';

export const SOFTWARE_PM_META = {
  key: 'software-project-management',
  title: 'Software Project Management: Prove It',
  category: 'Project Management',
  audience: 'Anyone shipping software, or paying for it, or accountable for it staying up — including the person who has to explain to a congregation why the app was down. No certification required.',
  tagline: 'A requirement is a vow, not a wish list. An estimate that hides its unknown is a false balance. An incident is not a problem and a problem is not a change. A green pipeline is not a deployed site. And a test that always passes is a lie. Taught Word-first, with this house’s own outages as the case studies.',
  cadenceDays: 7,
  weeks: 10, // keep in step with SOFTWARE_PM_MODULES.length (asserted in the test)
  handsOnLabel: 'Work it on a real system',
  unit: {
    noun: 'lesson', nounPlural: 'lessons', cap: 'Lesson', selfPaced: true,
    sessionLabel: 'How to work it (alone, or with whoever owns the system with you)',
    countNoun: 'lesson',
  },
  footer: '_Word first, then the name the industry gave the shape. The case studies are this house’s own recorded failures rather than invented ones: a nine-hour stale site behind a green pipeline (DR-0107), a fleet of safeguards that watched the pipeline and never once asked the product whether it was up (DR-0125), and the standing rule that a gate ships only once it is shown to catch the break (DR-0076). Every verse was fetched from the verified corpus, never recalled. Nothing here claims an effect on any exam score, cycle time or defect rate — none of that was measured._',
};

export const SOFTWARE_PM_SESSION_FLOW = [
  { minutes: 3, name: 'Read the anchor — the Word first, before the practice' },
  { minutes: 7, name: 'The Word’s own case, worked' },
  { minutes: 5, name: 'What broke here, and what it cost — the recorded case study' },
  { minutes: 4, name: 'What the industry calls it — PMP, ITIL, or the practice’s own name' },
  { minutes: 7, name: 'Work it on a real system you are responsible for' },
];
export const SOFTWARE_PM_SESSION_MINUTES = SOFTWARE_PM_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const SOFTWARE_PM_MODULES = [
  {
    id: 'spm1-requirements-are-a-vow',
    title: 'A requirement is a vow — not a wish list, and not a conversation you remember differently',
    bigIdea: 'Yahweh treats a spoken commitment as binding in a way software teams rarely treat a requirement. "If a man vow a vow unto the LORD, or swear an oath to bind his soul with a bond; he shall not break his word, he shall do according to all that proceedeth out of his mouth" (Numbers 30:2). And again: "That which is gone out of thy lips thou shalt keep and perform" (Deuteronomy 23:23). A requirement is what went out of your lips to the person depending on you. If it is not written down in a form both of you would recognise a year from now, it was never a vow — it was a mood, and moods cannot be delivered against. This is why acceptance criteria exist, and why they must be written before the work rather than negotiated after it.',
    inApp: 'Take the next thing you have promised to build. Write it as one sentence that names who it is for, what becomes possible, and the specific, checkable fact that means it is done. Then send that sentence to the person who asked, and ask them one question: is this what you meant? Their answer is either a confirmed vow or a caught misunderstanding, and both are worth more than the work you were about to start.',
    anchor: {
      ref: 'Numbers 30:2; Deuteronomy 23:23; Habakkuk 2:2',
      theme: 'A vow is binding and must be performed according to all that proceeded out of the mouth. Habakkuk 2:2 gives the written form and the test of it: "Write the vision, and make it plain upon tables, that he may run that readeth it" — plain enough to be RUN by a reader who was not in the conversation, which is exactly the standard a requirement must meet.',
    },
    benefits: [
      'Requirements stop being remembered and start being readable by someone who was not in the room.',
      'The misunderstanding gets caught before the work instead of at the demo.',
      'Acceptance criteria get written when they can still be written honestly — before the build.',
      'You learn to tell a vow from a mood, and only one of the two can be delivered against.',
    ],
    levels: {
      teen: 'In the Bible a promise is serious. If you vow something, you have to do exactly what came out of your mouth. Now think about software. Somebody asks you to build a thing. You say yes. That yes is a promise. But here is the problem: if nobody wrote it down clearly, you and they are remembering two different promises, and you will not find out until you show them what you built. So write it as one sentence: who it is for, what they can now do, and the exact thing that proves it is finished. Then send it back and ask, is this what you meant? If the answer is no, you just saved weeks.',
      senior: 'The industry calls it requirements elicitation, and calls the written form acceptance criteria or a definition of done; the agile framings add a user story with a testable outcome. Numbers 30:2 and Deuteronomy 23:23 raise the moral weight considerably: a commitment is performed according to ALL that proceeded out of the mouth, which forecloses the common defence that the intent was met while the stated thing was not. Habakkuk 2:2 then supplies the usability test that most requirement documents fail — plain upon tables, that he may run that readeth it. The criterion is not completeness and it is not precision of language; it is whether a reader who was absent from the conversation can act on it. That reframes a requirement from a record of a discussion into an executable instruction, and it is the same standard this course applies to a runbook in its final lesson. Where a standard would permit a requirement to be refined later, the vow language insists that what was said is owed, and that changing it is a renegotiation to be done openly rather than a detail to be quietly reinterpreted.',
    },
    quiz: {
      questions: [
        {
          q: 'According to Numbers 30:2, how much of what was spoken must be performed?',
          options: [
            'The intent behind it',
            'All that proceedeth out of his mouth',
            'Whatever remains reasonable',
          ],
          answer: 1,
          explain: 'The text forecloses the defence that the intent was met while the stated thing was not.',
        },
        {
          q: 'What test does Habakkuk 2:2 set for a written requirement?',
          options: [
            'That it be complete and precisely worded',
            'That a reader who was not in the conversation can RUN it',
            'That it be approved by the person paying',
          ],
          answer: 1,
          explain: '"that he may run that readeth it." Usability by an absent reader, not completeness, is the criterion.',
        },
        {
          q: 'When should acceptance criteria be written?',
          options: [
            'Before the work — the only time they can be written honestly',
            'After the work, once the shape is known',
            'At the demo, with the stakeholder present',
          ],
          answer: 0,
          explain: 'Criteria negotiated after the work are a negotiation. Written first, they are a standard that can be checked.',
        },
      ],
    },
  },
  {
    id: 'spm2-the-order-is-the-work',
    title: 'The order IS the work — priority, and the field prepared before the house',
    bigIdea: 'Yahweh gives a sequencing instruction through Proverbs that reads like a build order: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house" (Proverbs 24:27). The field first, the house second — and the reason is that the house depends on the field, not on preference. Jesus gives the general form: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you" (Matthew 6:33). First is a real position, and it has consequences for everything behind it. A backlog is a claim about order, and an unordered backlog is not a plan, it is an inventory. Most teams do not have a prioritisation problem; they have a list nobody has been willing to put in order.',
    inApp: 'Take your current list of work and force it into a single numbered order — no ties, no equal priorities, no two things at number one. Then ask of each item what depends on it, and move anything that unblocks another item upward. The argument you have while doing this is the actual planning; the numbered list is just its record.',
    anchor: {
      ref: 'Proverbs 24:27; Matthew 6:33; Ecclesiastes 3:1',
      theme: 'The field prepared before the house, because the house depends on the field. "But seek ye first the kingdom of God, and his righteousness" (Matthew 6:33) makes first a real position rather than an emphasis. And Ecclesiastes 3:1 grants each purpose its own time: "To every thing there is a season, and a time to every purpose under the heaven" — which is the antidote to treating everything as urgent.',
    },
    benefits: [
      'An unordered list gets turned into a plan, which is the only form that can be worked.',
      'Dependencies surface, because ordering forces the question of what unblocks what.',
      'No two items can be number one, which removes the most common way a backlog lies.',
      'Ecclesiastes 3:1 gives you language for the item that is real but not now.',
    ],
    levels: {
      teen: 'Proverbs says prepare your field first and build your house afterwards. Not because fields are more important, but because the house depends on the field. That is what priority actually means: not what feels most urgent, but what everything else is waiting on. So take your list of work and number it. One order, no ties. If two things are both number one, you have not decided yet, you have just written the list down again. And while you are numbering it, ask what each thing unblocks. Whatever unblocks the most should move up.',
      senior: 'The industry offers several orderings — MoSCoW, weighted shortest job first, cost of delay, plain business value — and they all depend on the same prior step the teams that struggle have skipped: producing a total order with no ties. Proverbs 24:27 gives the dependency-driven version, which is the one that holds up under pressure, because the field-before-house sequence is not a preference and cannot be negotiated by whoever is loudest. Matthew 6:33 establishes that FIRST is a genuine position with consequences for everything behind it, which is worth stating in a room where every stakeholder has been told their item is a priority. Ecclesiastes 3:1 then closes the failure on the other side, the one that burns teams out: a season for every purpose means an item can be genuinely real and genuinely not now, which is a category most backlog conversations lack entirely, leaving only urgent and rejected. Where a framework would compute a score, the practical value here is the argument the ordering forces — the numbered list is the record of a decision, not a substitute for making one.',
    },
    quiz: {
      questions: [
        {
          q: 'Why does Proverbs 24:27 put the field before the house?',
          options: [
            'Because farming is more honourable work',
            'Because the house depends on the field — the order is driven by dependency',
            'Because the field takes less time',
          ],
          answer: 1,
          explain: 'Dependency-driven order is the kind that holds under pressure, because it cannot be renegotiated by whoever is loudest.',
        },
        {
          q: 'What is wrong with a backlog that has two items at number one?',
          options: [
            'Nothing — some work is genuinely equal',
            'It means the decision has not been made; the list has only been rewritten',
            'It confuses reporting tools',
          ],
          answer: 1,
          explain: 'A total order with no ties is what turns an inventory into a plan.',
        },
        {
          q: 'What category does Ecclesiastes 3:1 supply that most backlogs lack?',
          options: [
            'Urgent',
            'Real, but not now — a season for every purpose',
            'Rejected',
          ],
          answer: 1,
          explain: 'Without it the only options are urgent and rejected, which is how teams get burned out and good work gets thrown away.',
        },
      ],
    },
  },
  {
    id: 'spm3-the-honest-unknown',
    title: 'Estimation, and the honest unknown — a false balance is an abomination',
    bigIdea: 'James does not forbid planning. He forbids planning that talks as though the unknown were known: "Go to now, ye that say, To day or to morrow we will go into such a city, and continue there a year, and buy and sell, and get gain: Whereas ye know not what shall be on the morrow" (James 4:13-14). The correction is not silence, it is a stated condition: "For that ye ought to say, If the Lord will, we shall live, and do this, or that" (James 4:15). Plan, and carry the conditional out loud. Then read Proverbs 11:1 as a measurement rule: "A false balance is abomination to the LORD: but a just weight is his delight." An estimate stated to a precision you do not possess is a false balance. Six weeks when you mean somewhere between four and twelve is not confidence; it is a weight with the wrong mark on it.',
    inApp: 'Take your next estimate and write it as a range with the assumption it depends on, then name the single unknown that would move it most. Give all three to whoever is relying on it. If you are told to state one number instead, state the number AND the range in the same sentence, because dropping the range is the part that makes it false.',
    anchor: {
      ref: 'James 4:13-15; Proverbs 11:1; Deuteronomy 25:13-15; Luke 14:28',
      theme: 'Planning is permitted; planning that speaks as though tomorrow were known is not, and the remedy is a spoken condition rather than silence. Proverbs 11:1 and Deuteronomy 25:13-15 forbid divers weights — "a great and a small" — which applied to estimation forbids a precision you do not have. And Luke 14:28 keeps the duty to count: the conditional does not excuse the estimate.',
    },
    benefits: [
      'Estimates carry their range and their assumption, which is what makes them honest rather than optimistic.',
      'The unknown gets named, which is the first step to closing it.',
      'You get a scriptural reason to refuse false precision when pressed for a single number.',
      'The conditional does not become an excuse — Luke 14:28 keeps the duty to count.',
    ],
    levels: {
      teen: 'James is not against making plans. He is against talking about tomorrow like you already know it. His fix is not to go quiet — it is to say the condition out loud: if the Lord wills, we will do this. Now put that next to Proverbs: a false balance is an abomination, a just weight is His delight. A false balance is a scale with the wrong mark on it. If somebody asks how long your work will take and you say six weeks when you honestly mean somewhere between four and twelve, you handed them a scale with the wrong mark on it. Say the range. Say what would change it. That is a just weight.',
      senior: 'The industry names the phenomenon the cone of uncertainty and the practices three-point estimation, reference-class forecasting and story points — all of which exist to stop a single number from implying a precision the estimator does not have. James 4:13-15 supplies the posture and, importantly, refuses both errors: the presumption that speaks of a year of trading as settled, and the false humility that would decline to plan at all. The correction is a stated condition carried alongside the plan. Proverbs 11:1 and Deuteronomy 25:13-15 then make it a measurement ethic rather than a communication style, and the divers-weights image is exact — a great and a small in the same bag, which is what a team does when it reports an optimistic number upward and a pessimistic one to itself. Luke 14:28 closes the loophole the conditional could open, because an unknowable future is not a licence to skip the count; the tower still has to be costed. Practically: a range, its assumption, and the dominant unknown, all three travelling together — and when a single number is demanded, the number and the range in one sentence, since it is the dropping of the range that makes the weight false.',
    },
    quiz: {
      questions: [
        {
          q: 'What does James 4:15 offer as the correction to presumptuous planning?',
          options: [
            'Making no plans at all',
            'Saying the condition out loud — if the Lord will, we shall live, and do this, or that',
            'Planning only for the immediate term',
          ],
          answer: 1,
          explain: 'Not silence. The plan stands and carries its condition openly.',
        },
        {
          q: 'How does this lesson apply "A false balance is abomination to the LORD" to estimation?',
          options: [
            'It forbids estimating at all',
            'It forbids stating a precision you do not possess — a single number where you mean a wide range',
            'It forbids charging for estimates',
          ],
          answer: 1,
          explain: 'A weight with the wrong mark on it. Dropping the range is the part that makes it false.',
        },
        {
          q: 'Does the conditional excuse skipping the estimate?',
          options: [
            'Yes — the future is unknowable',
            'No — Luke 14:28 keeps the duty to count the cost',
            'Only for small work',
          ],
          answer: 1,
          explain: 'An unknowable future is not a licence to skip the count. The tower still has to be costed.',
        },
      ],
    },
  },
  {
    id: 'spm4-incident-problem-change',
    title: 'Incident, problem, change — ITIL’s three, and why answering before hearing is folly',
    bigIdea: 'ITIL separates three things most teams collapse into one: an INCIDENT is a service interruption and its goal is restoration; a PROBLEM is the underlying cause and its goal is diagnosis; a CHANGE is what prevents recurrence. Collapse them and you get the two classic failures — a service restored with the cause never found, or a team debugging root cause while users are still down. Yahweh names the underlying error precisely: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). And it dignifies the diagnosis phase: "the honour of kings is to search out a matter" (Proverbs 25:2). Restore first, then search out. Both, in that order, and neither skipped.',
    inApp: 'Take the last thing that broke on your system. Write three separate lines: what restored service, what the actual cause was, and what change now prevents recurrence. If any line is blank, that is the discipline you are missing — and a blank third line is why the same thing will break again.',
    anchor: {
      ref: 'Proverbs 18:13; Proverbs 25:2; Proverbs 13:16',
      theme: 'Answering a matter before hearing it is named folly and shame — which is what a fix applied before the cause is understood actually is. Proverbs 25:2 makes searching out a matter royal work rather than a delay. And Proverbs 13:16 gives the disposition: "Every prudent man dealeth with knowledge: but a fool layeth open his folly."',
    },
    benefits: [
      'Restoration and diagnosis stop competing, because they are named as different jobs with different goals.',
      'The blank third line gets found — which is the reason the same outage keeps happening.',
      'Root-cause work gets dignified rather than treated as a delay to the real fix.',
      'You get a name for the fix applied before the cause was understood, and Scripture’s name for it is folly.',
    ],
    levels: {
      teen: 'When something breaks there are actually three different jobs, and most people mash them into one. Job one: get it working again. Job two: find out WHY it broke. Job three: change something so it cannot break that way again. If you only do job one, it breaks again next week. If you try to do job two while people are still stuck, you leave them stuck longer. Proverbs says answering something before you have heard it is folly and shame — that is exactly what guessing at a fix is. And it says searching out a matter is the honour of kings. So: get it working, then go find the cause, then change something. Three lines, every time.',
      senior: 'ITIL’s separation of incident, problem and change management is one of its most useful contributions, and the reason is that the three have genuinely different objectives, different time pressures and different success criteria — restoration is measured in minutes, diagnosis in accuracy, and change in recurrence prevented. Teams that collapse them produce one of two recognisable pathologies: the heroic restart culture, where service is always restored and no cause is ever found, or the diagnostic paralysis where users sit down while engineers argue about mechanism. Proverbs 18:13 indicts the first pathology with unusual force, because a fix applied to an unheard matter is not merely risky, it is named folly and shame; and the honest reading is that a restart that works is still an unheard matter. Proverbs 25:2 answers the cultural pressure that produces the first pathology, which is that diagnosis reads as delay to everyone watching: it is the HONOUR of kings to search out a matter. This house has a recorded case of the third line left blank — DR-0107, where the identical deploy gap had already been documented in the same file and nothing had changed to prevent it, so it recurred and cost the site nine hours. A known cause with no change is the same as an unknown cause, only more expensive.',
    },
    quiz: {
      questions: [
        {
          q: 'What are the three distinct goals ITIL separates?',
          options: [
            'Detection, escalation and reporting',
            'Restoration (incident), diagnosis (problem), and prevention of recurrence (change)',
            'Development, testing and release',
          ],
          answer: 1,
          explain: 'They have different objectives and different success criteria. Collapsing them produces either a cause never found or users left down during debate.',
        },
        {
          q: 'How does Proverbs 18:13 apply to a fix applied before the cause is understood?',
          options: [
            'It permits it under time pressure',
            'It names it folly and shame — answering a matter before hearing it',
            'It says nothing about technical work',
          ],
          answer: 1,
          explain: 'And the honest reading is that a restart that happens to work is still an unheard matter.',
        },
        {
          q: 'What does this lesson say a known cause with no change is equivalent to?',
          options: [
            'A resolved problem',
            'An unknown cause, only more expensive — as DR-0107 recorded',
            'An acceptable risk',
          ],
          answer: 1,
          explain: 'The identical deploy gap was already documented in the same file; nothing changed, so it recurred and cost nine hours.',
        },
      ],
    },
  },
  {
    id: 'spm5-no-silent-change',
    title: 'Change control — and the change that must never be silent',
    bigIdea: 'The vow language that made a requirement binding cuts in the other direction too: if what went out of your lips must be kept and performed, then changing it is not a detail, it is a renegotiation, and it has to be spoken. A silent change is the most expensive kind of change, because everyone downstream is still planning against the version they were told. "That which is gone out of thy lips thou shalt keep and perform" (Deuteronomy 23:23) does not forbid change; it forbids pretending the change did not happen. The practical form is a record: what changed, who decided, when, and why — written where the people affected will actually read it. This repository runs that discipline as append-only decision records for exactly this reason: a new directive becomes a NEW record, never a quiet rewrite of the old one.',
    inApp: 'Find one thing about your system that is now different from what you last told people. Write one short note: what changed, who decided, when, and why. Put it where the affected people read things. That note is change control, and it is the whole of the practice at small scale.',
    anchor: {
      ref: 'Deuteronomy 23:23; Numbers 30:2; Proverbs 11:1',
      theme: 'What was spoken must be kept and performed — so a change to it is a renegotiation that must be spoken, not a detail that can be absorbed. Proverbs 11:1 supplies the reason a silent change is a false balance: the people downstream are still weighing against the mark you gave them.',
    },
    benefits: [
      'Change stops being a thing that happens to people and becomes a thing that is told to them.',
      'You get one short written form that is genuinely the whole practice at small scale.',
      'The append-only habit protects the history, so nobody has to reconstruct what was decided when.',
      'Silent change gets named as the expensive kind, which is what it is.',
    ],
    levels: {
      teen: 'If a promise has to be kept exactly as you said it, then changing it is a big deal. Not a small detail you can slide past. The worst kind of change is the silent one, because everybody else is still planning around the old version and does not know it. So when something changes, write four things: what changed, who decided, when, and why. Put it somewhere the people affected will actually see it. That is it. That is change control, and at small scale that note IS the whole practice.',
      senior: 'The industry builds this into a change advisory board, a change calendar, and an emergency-change path with retrospective approval; the essential property underneath all of it is that the change leaves a record the affected parties can read. Deuteronomy 23:23 and Numbers 30:2 supply the weight: what was spoken is owed, so the alteration of it is a renegotiation rather than an implementation detail, and the people downstream have standing in it. Proverbs 11:1 explains why the silent change is specifically a false balance rather than merely poor communication — everyone downstream continues weighing against the mark they were given, so the wrong mark stays in circulation and does damage at every point that trusted it. This repository’s own convention is instructive because it is stricter than most change logs: records are append-only, one decision per file, and a new directive becomes a NEW record rather than a rewrite of the old one, which preserves the history of what was true when. That strictness is a direct response to the failure mode where a silently edited standard makes past decisions look either wiser or more foolish than they were.',
    },
    quiz: {
      questions: [
        {
          q: 'What does Deuteronomy 23:23 imply about changing a commitment?',
          options: [
            'That commitments can never change',
            'That the change is a renegotiation which must be spoken, not a detail to absorb quietly',
            'That only written commitments bind',
          ],
          answer: 1,
          explain: 'It does not forbid change. It forbids pretending the change did not happen.',
        },
        {
          q: 'Why is a silent change specifically a false balance?',
          options: [
            'Because it is rude',
            'Because everyone downstream keeps weighing against the mark they were given',
            'Because it violates an audit requirement',
          ],
          answer: 1,
          explain: 'The wrong mark stays in circulation and does damage at every point that trusted it.',
        },
        {
          q: 'Why are this repository’s decision records append-only?',
          options: [
            'To save storage',
            'So the history of what was true when is preserved — a new directive is a NEW record, never a rewrite',
            'Because editing is technically difficult',
          ],
          answer: 1,
          explain: 'A silently edited standard makes past decisions look wiser or more foolish than they were.',
        },
      ],
    },
  },
  {
    id: 'spm6-green-is-not-deployed',
    title: 'Prove the deploy — a green pipeline is not a live site, and this house paid nine hours to learn it',
    bigIdea: 'On 2026-07-06 this house enabled an auto-merge lane and poetech.us went stale for roughly nine hours while every single CI check was green. The cause was mechanical: a merge performed with the automation’s own token does not trigger the push workflows, so the deploy silently stopped firing and nothing was watching the product. The identical gap had already been documented in the same file. That is DR-0107, and its binding rule is one sentence: CI-green is not deployed. Then DR-0125 found the deeper version two days later — every safeguard in the house watched the PIPELINE, and not one of them ever made an HTTP request to the product, so the question of whether the site was up had no measured answer at all. "Prove all things; hold fast that which is good" (1 Thessalonians 5:21). Prove the deployed artifact, not the build that preceded it.',
    inApp: 'Name the one observation that proves your system is live and current — not the build status, an actual request to the running product returning the current version. If you cannot name it, you do not have it, and that is the finding. Then ask the harder question DR-0125 asked: how many times did it go down last month? If there is no ledger, the number is not zero, it is unknown — and unknown must never be reported as fine.',
    anchor: {
      ref: '1 Thessalonians 5:21; Proverbs 27:23; Ezekiel 33:6',
      theme: 'Prove all things — and the thing to prove is the deployed product, not the pipeline that fed it. Proverbs 27:23 makes knowing the state a commanded diligence rather than a reporting chore. Ezekiel 33:6 supplies the stake: the watchman who sees and does not sound the trumpet carries the cost, and a watchman pointed at the wrong wall is the same as no watchman.',
    },
    benefits: [
      'You find out whether anything in your system actually observes the product rather than the build.',
      'Unknown stops being reported as fine — which is the specific lie DR-0125 was written to stop.',
      'Downtime gets a ledger, so how many times this month has an answer.',
      'A green check regains its meaning, because it is no longer standing in for an observation nobody makes.',
    ],
    levels: {
      teen: 'Here is a true story from this app. Someone turned on a system that merges finished work automatically. Every test was green. Everything looked perfect. And the actual website sat frozen for about nine hours, showing an old version, because the thing that publishes the site had quietly stopped running and nobody was watching the site itself — only the tests. Then two days later they found the bigger problem: every single safety check watched the machinery, and not one of them ever just opened the website to see if it worked. So here is the rule: green tests are not a live site. Somebody or something has to actually open the thing and look. And if nobody knows how many times it went down this month, the answer is not zero. The answer is nobody knows, and that is not the same as fine.',
      senior: 'The industry separates continuous integration from continuous delivery and from deployment verification, and calls the last one a smoke test or post-deploy validation; the outside-in version is synthetic monitoring. DR-0107 is the mechanical lesson: a token-authored merge does not raise the push event, so the deploy never fired, and the failure was silent precisely because every signal in the chain was a signal about the chain. DR-0125 is the structural lesson and the more valuable one — a full fleet of safeguards can be pointed at the pipeline while nothing ever issues a request to the product, which means the system is instrumented to tell you the factory is running rather than that the goods arrived. The remedy that shipped here is a browser-shaped probe from a runner (up, intact, fresh) that files failing observations on a rolling ledger issue, so downtime becomes queryable rather than anecdotal, and unknown freshness NEVER renders as fresh. That last property is the DR-0076 discipline applied to monitoring: a dashboard that cannot distinguish healthy from unobserved and shows green for both is not a witness, it is a decoration. Ezekiel 33:6 is the right frame for the whole class — the liability attaches to the watchman who saw and stayed silent, and a watchman facing the wrong direction has the same effect as none.',
    },
    quiz: {
      questions: [
        {
          q: 'In DR-0107, why did the deploy silently stop firing?',
          options: [
            'The build broke and nobody noticed',
            'A merge performed with the automation’s own token does not trigger the push workflows',
            'The hosting provider had an outage',
          ],
          answer: 1,
          explain: 'And every signal in the chain was a signal about the chain, which is why nine hours passed with all checks green.',
        },
        {
          q: 'What did DR-0125 find that was worse than the deploy gap?',
          options: [
            'That the tests were too slow',
            'That every safeguard watched the pipeline and none ever made an HTTP request to the product',
            'That the site was never actually down',
          ],
          answer: 1,
          explain: 'The system was instrumented to say the factory was running, not that the goods arrived.',
        },
        {
          q: 'If there is no downtime ledger, what is the honest answer to how many times the system went down?',
          options: [
            'Zero, until someone reports otherwise',
            'Unknown — and unknown must never be reported as fine',
            'It does not matter if no one complained',
          ],
          answer: 1,
          explain: 'A dashboard that shows green for both healthy and unobserved is a decoration, not a witness.',
        },
      ],
    },
  },
  {
    id: 'spm7-a-gate-that-always-passes',
    title: 'The test that always passes is a lie — so a gate ships only once it catches the break',
    bigIdea: 'This house runs a rule that sounds strange until you have been burned by its absence: a gate is shipped only after it has been SHOWN to catch the break it claims to prevent (DR-0076 sec. 3). The reason is that a check which cannot fail is worse than no check, because it manufactures confidence. A green tick is a claim, and an unfalsifiable claim is not evidence. Yahweh supplies the measurement ethic directly, and He legislates it about the instrument rather than the transaction: "Thou shalt not have in thy bag divers weights, a great and a small" (Deuteronomy 25:13), and "But thou shalt have a perfect and just weight, a perfect and just measure shalt thou have" (Deuteronomy 25:15). A test that passes regardless of the code is a weight that reads the same no matter what you put on it — which is not a lenient scale, it is not a scale.',
    inApp: 'Pick the test you rely on most. Break the thing it guards — deliberately, in a scratch copy — and confirm the test goes red. If it stays green, you have just found out that your most-trusted check was decorative, and finding that out on purpose is far cheaper than finding out in production.',
    anchor: {
      ref: 'Deuteronomy 25:13-15; Proverbs 11:1; 1 Thessalonians 5:21',
      theme: 'A perfect and just weight and a perfect and just measure, with divers weights forbidden outright. A test that passes regardless of the code is not a lenient measure, it is a measure that measures nothing. "Prove all things" (1 Thessalonians 5:21) includes proving the instrument.',
    },
    benefits: [
      'Your most-trusted check gets verified rather than assumed, which is the only way to know it is real.',
      'Decorative gates get found deliberately and cheaply instead of accidentally and expensively.',
      'A green tick recovers its meaning, because it is a claim that has been falsified at least once.',
      'You gain the habit of proving the instrument, not only the thing it measures.',
    ],
    levels: {
      teen: 'Imagine a scale that says ten pounds no matter what you put on it. That is not a generous scale or a broken scale — it is not a scale at all, and trusting it is worse than having none, because you would at least know you did not know. Tests are the same. A test that passes no matter what the code does is not a weak test; it is a lie that makes you feel safe. So this house has a rule: before you trust a test, deliberately break the thing it is supposed to catch and watch it go red. If it stays green, you just learned something important for free.',
      senior: 'The formal name for the discipline is mutation testing, and the practice of deliberately injecting faults to validate detection is fault injection or chaos engineering depending on the layer; the important part is the epistemics rather than the tooling. A passing test is a claim about the code, and a claim that could not have come out false carries no information — so an unfalsified gate has an unknown detection capability, and unknown is being reported as green. This is the same failure as DR-0125 one level down: the instrument is trusted because it is present rather than because it has been exercised. Deuteronomy 25:13-15 is unusually apt because it addresses the instrument itself rather than the transaction, and it demands a perfect and just measure as a positive duty rather than merely forbidding a dishonest one. Applied here, the duty is to establish detection capability, not to have a test file. The operational form in this repository is a break harness: for each check, a targeted edit that should make it fail, run against the real artifact, with every non-catch investigated — and the frequent finding is that the break was badly aimed rather than the check weak, which is itself worth knowing, since a break that lands nowhere teaches nothing about the gate.',
    },
    quiz: {
      questions: [
        {
          q: 'Why is a test that can never fail worse than no test?',
          options: [
            'It wastes compute time in the pipeline',
            'It manufactures confidence — unknown detection capability is being reported as green',
            'It makes the codebase harder to read',
          ],
          answer: 1,
          explain: 'With no test you at least know you do not know. A claim that could not have come out false carries no information.',
        },
        {
          q: 'What does Deuteronomy 25:15 demand, beyond forbidding a dishonest weight?',
          options: [
            'That weights be inspected annually',
            'A perfect and just weight and measure — a positive duty to have a real instrument',
            'That trade be conducted in the presence of witnesses',
          ],
          answer: 1,
          explain: 'Applied here, the duty is to establish detection capability, not merely to have a test file.',
        },
        {
          q: 'When a deliberate break fails to make a check go red, what is the first thing to suspect?',
          options: [
            'That the check is weak and must be rewritten immediately',
            'That the break was badly aimed — a break that lands nowhere teaches nothing about the gate',
            'That the test framework is faulty',
          ],
          answer: 1,
          explain: 'A break that crossed into unrelated text, or changed a phrase no claim asserts, is a question about the break before it is a verdict on the check.',
        },
      ],
    },
  },
  {
    id: 'spm8-debt-named-and-dated',
    title: 'Technical debt — named, dated, and never left silent',
    bigIdea: 'Yahweh describes the mechanics of debt through Proverbs without moralising about it: "The rich ruleth over the poor, and the borrower is servant to the lender" (Proverbs 22:7). Debt is a real transfer of freedom, and technical debt is the same transaction against your future delivery capacity. Paul’s instruction is directional rather than absolute: "Owe no man any thing, but to love one another" (Romans 13:8) — the trend is toward release. Applied to software: shortcuts are sometimes right, and borrowing against future capacity is a legitimate decision. What is not legitimate is silence. This house’s rule is that anything deliberately left rough carries a stated WHY and a re-review DATE sized to the issue (DR-0075). No date means it is expected to improve; silence is never consent to stall.',
    inApp: 'List the shortcuts currently live in your system. Beside each write one sentence of why it was right at the time, and a re-review date sized to the risk — days for a hot edge, months for a deliberate deferral tied to an unblocking event. Anything you cannot justify in a sentence is not debt, it is a defect, and it belongs in the work queue rather than the debt register.',
    anchor: {
      ref: 'Proverbs 22:7; Romans 13:8; Proverbs 27:23',
      theme: 'Debt described as a real transfer of freedom rather than a moral failure, with the direction of travel set toward release. Proverbs 27:23 supplies the register: "Be thou diligent to know the state of thy flocks" — debt you have not written down is debt whose state you do not know.',
    },
    benefits: [
      'Shortcuts become decisions with reasons instead of accumulating as unexplained strangeness.',
      'Every parked item gets a date, which is the promise it is actually revisited.',
      'Debt gets distinguished from defect — only one of the two is a legitimate borrowing.',
      'Silence stops counting as consent to leave something broken.',
    ],
    levels: {
      teen: 'Proverbs says the borrower is servant to the lender. That is not a scolding, it is a description: when you borrow, some of your freedom now belongs to someone else. Software works the same way. Every shortcut you take borrows against how fast you can work later. Sometimes borrowing is the right call. What is never right is being quiet about it. So write down every shortcut, one sentence on why it made sense, and a date to look at it again. If you cannot explain why it made sense in one sentence, it is not a shortcut. It is a bug, and it goes on the work list.',
      senior: 'The industry frames this as the technical-debt quadrant — deliberate versus inadvertent, prudent versus reckless — and the practical value of the framing is that it legitimises deliberate prudent debt while refusing the inadvertent kind any cover. Proverbs 22:7 is the mechanism without the moralising: servitude to the lender is a transfer of freedom, which is exactly what a shortcut does to future delivery capacity, and naming it that way makes the interest visible. Romans 13:8 sets the direction rather than an absolute prohibition, which matters because a zero-debt policy in software is neither achievable nor wise. This house’s addition is procedural and is the part that actually holds: a rough edge left alone requires a stated why AND a re-review date sized to the issue, with no date meaning the thing is still expected to improve. That closes the specific failure where a debt register becomes an archive — items entered once, never revisited, eventually indistinguishable from the codebase’s natural strangeness. Proverbs 27:23 is the register itself: diligence in knowing the state, which is impossible for debt nobody wrote down. And the distinction the last line of the exercise draws is load-bearing — an unjustifiable shortcut is not debt at all, it is a defect, and filing it as debt is how a defect acquires permanent residency.',
    },
    quiz: {
      questions: [
        {
          q: 'How does Proverbs 22:7 describe debt?',
          options: [
            'As a sin to be repented of',
            'As a real transfer of freedom — the borrower is servant to the lender',
            'As always unwise',
          ],
          answer: 1,
          explain: 'Mechanism without moralising, which is what makes it usable: a shortcut transfers some of your future capacity.',
        },
        {
          q: 'What must accompany anything deliberately left rough, under this house’s rule?',
          options: [
            'An owner',
            'A stated why AND a re-review date sized to the issue',
            'Executive sign-off',
          ],
          answer: 1,
          explain: 'No date means it is still expected to improve. Silence is never consent to stall.',
        },
        {
          q: 'What is a shortcut you cannot justify in one sentence?',
          options: [
            'Prudent deliberate debt',
            'A defect — it belongs in the work queue, not the debt register',
            'An acceptable unknown',
          ],
          answer: 1,
          explain: 'Filing a defect as debt is how a defect acquires permanent residency.',
        },
      ],
    },
  },
  {
    id: 'spm9-the-retrospective-that-is-not-a-blame-meeting',
    title: 'The retrospective — two sorrows, and why a man who cannot be wrong cannot find the cause',
    bigIdea: 'Paul distinguishes two responses to having been wrong, and he distinguishes them by their OUTPUT rather than their intensity: "For godly sorrow worketh repentance to salvation not to be repented of: but the sorrow of the world worketh death" (2 Corinthians 7:10). Then he itemises what the first one produced — carefulness, clearing, indignation, fear, vehement desire, zeal. Movements. Things that got up and did something. The second kind sits with itself and calls that feeling bad. A retrospective that produces the second kind is a blame meeting whatever it is called, and it is worse than none, because it teaches everyone present that surfacing a fault is expensive. And the operational reason humility is not a soft virtue here: a man who cannot be wrong cannot receive the information that lives with the people closest to the failure, so his pride has become a blocked input at the exact moment the system needed the truth.',
    inApp: 'Run your next retrospective with two columns: what we will DO differently, and what we merely FEEL bad about. Everything in column two either becomes an action or gets put down out loud — named as the thing being put down, rather than left to sit. And ask the people closest to the failure first, because that is where the information actually is.',
    anchor: {
      ref: '2 Corinthians 7:10-11; Proverbs 18:13; Proverbs 25:2',
      theme: 'Two sorrows distinguished by their output: one works repentance and is itemised as movement, the other works death. Proverbs 18:13 and Proverbs 25:2 supply the method — hear the matter before answering it, and treat searching out the cause as royal work rather than as a delay.',
    },
    benefits: [
      'A retrospective produces actions rather than atmosphere, because the two columns are named and separated.',
      'Feeling bad with no movement attached gets put down explicitly instead of quietly persisting.',
      'The people closest to the failure get asked first, which is where the information actually lives.',
      'Humility becomes operational: the leader who cannot be wrong is identified as a blocked input, not a personality.',
    ],
    levels: {
      teen: 'Paul talks about two kinds of being sorry, and he tells them apart by what they PRODUCE. One kind gets up and does something — he lists it out: being careful, clearing things up, getting fired up, really wanting it fixed. The other kind just sits there feeling bad about itself. A meeting after something goes wrong should produce the first kind. If it only produces the second kind, it is a blame meeting even if nobody is shouting, and people will learn not to admit anything next time. Also: ask the people closest to the problem first. They already know what happened. If they think you will punish them for saying it, you will never find out.',
      senior: 'The industry calls the practice a blameless post-mortem, and the literature is clear that blamelessness is instrumental rather than merely kind — a culture that punishes disclosure loses the information it needs to prevent recurrence, so blame is expensive before it is unpleasant. 2 Corinthians 7:10-11 gives the sharpest available test, and it is a test on the OUTPUT rather than the sentiment: godly sorrow is identified by the movements it produced, itemised, while the world’s sorrow produces death. That distinction is what separates a retrospective from an atmosphere. The operational half is the one worth carrying into a technical organisation: the information about a failure lives with the people closest to it, they will not hand it to someone who punishes being wrong, and therefore a leader’s pride is not merely unattractive in that room — it is a blocked input, and the diagnosis is degraded by exactly the amount he blocks. Proverbs 18:13 then forbids the shortcut a pressured post-mortem always reaches for, which is answering the matter before hearing it, and Proverbs 25:2 supplies the standing that makes the hearing affordable: searching out a matter is the honour of kings, not an admission that the first answer was inadequate.',
    },
    quiz: {
      questions: [
        {
          q: 'How does 2 Corinthians 7:10-11 distinguish the two sorrows?',
          options: [
            'By how deeply they are felt',
            'By their OUTPUT — one is itemised as movements, the other works death',
            'By who caused the failure',
          ],
          answer: 1,
          explain: 'Carefulness, clearing, indignation, fear, vehement desire, zeal. Things that got up and did something.',
        },
        {
          q: 'Why is blame expensive before it is unpleasant?',
          options: [
            'It slows the meeting down',
            'The information lives with the people closest to the failure, and they will not hand it to someone who punishes being wrong',
            'It creates legal exposure',
          ],
          answer: 1,
          explain: 'Blamelessness is instrumental. A culture that punishes disclosure loses the information it needs to prevent recurrence.',
        },
        {
          q: 'In what sense is a leader’s pride a technical problem?',
          options: [
            'It is only a relational problem',
            'It is a blocked input — the diagnosis degrades by exactly the amount he blocks',
            'It slows down decision making',
          ],
          answer: 1,
          explain: 'A man who cannot be wrong cannot receive the information that would locate the cause.',
        },
      ],
    },
  },
  {
    id: 'spm10-handover-and-the-runbook',
    title: 'Handover — the runbook a stranger can run, and the chain four links deep',
    bigIdea: 'Paul gives a succession instruction with an unusual number of links in it: "And the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also" (2 Timothy 2:2). Paul, to Timothy, to faithful men, to others also — four links, and the criterion for the third link is that they be ABLE TO TEACH, not merely able to do. That is the difference between a person who can operate a system and a person from whom the capability can propagate. Habakkuk 2:2 gives the written standard and it is a usability test rather than a completeness one: "Write the vision, and make it plain upon tables, that he may run that readeth it." Plain enough to be RUN by the reader. A runbook that only its author can follow has failed the actual criterion, however thorough it is.',
    inApp: 'Write the runbook for the system you own: how to start it, how to tell it is healthy, what breaks first, what to do when it does, and who to call. Then hand it to someone who has never touched the system and have them run one routine operation from it, with you silent in the room. Every question they have to ask you is a gap in the document, and your silence is what finds them.',
    anchor: {
      ref: '2 Timothy 2:2; Habakkuk 2:2; Luke 16:10-12; Exodus 35:30-35',
      theme: 'A chain four links deep, where the criterion is ability to teach rather than ability to do. Habakkuk 2:2 sets the usability standard — plain enough to be run by the one who reads it. Luke 16:10-12 gives the grounds on which more is entrusted. And Exodus 35:34 showed the pattern in the workshop: "he hath put in his heart that he may teach" — the skill and the teaching of it given together.',
    },
    benefits: [
      'The runbook gets tested against a stranger with you silent, which is the only honest test of it.',
      'Every question they ask becomes a located gap rather than a vague sense of incompleteness.',
      'Succession aims at teachable people, not just capable ones, so capability can propagate.',
      'The system stops depending on your presence, which is the whole point of owning it well.',
    ],
    levels: {
      teen: 'Paul tells Timothy to pass on what he learned to reliable people who will be ABLE TO TEACH IT to others. Not just do it — teach it. That is four people deep in one sentence. And Habakkuk says write it plain enough that whoever reads it can RUN with it. So here is the test for your instructions, and it is a hard one: give them to somebody who has never touched your system, ask them to do one normal task from the document, and then stay quiet. Every single time they have to ask you something, you found a hole. Your silence is the test. A document only you can follow is not finished, no matter how long it is.',
      senior: 'The industry calls the artifacts a runbook and an operations handover, calls the risk bus factor or key-person dependency, and calls the exercise a game day or a handover drill. 2 Timothy 2:2 sets a higher bar than most handovers aim at, because the criterion for the receiving party is teachability onward — four links in one sentence, which is a design for propagation rather than transfer. Habakkuk 2:2 supplies the test that makes a runbook real, and it is worth stating precisely because it is so commonly mistaken: the standard is not completeness, thoroughness, or accuracy of description, it is whether the reader can RUN it. That makes the only valid verification an observed run by someone who was not involved, with the author silent — the silence is the instrument, since an author who answers questions is completing the document verbally and will conclude it was adequate. Luke 16:10-12 grounds the whole thing in both directions, faithful in least and unjust in least, and locates the demonstration precisely where nobody is watching: the handover after the interesting work is finished. Exodus 35:34 closed the same loop at the start of the companion course — the skill and the teaching of it given together — so the two courses meet here, in the least glamorous document either of them produces.',
    },
    quiz: {
      questions: [
        {
          q: 'What is the criterion for the third link in 2 Timothy 2:2?',
          options: [
            'That they be faithful',
            'That they be ABLE TO TEACH OTHERS ALSO — not merely able to do',
            'That they be many',
          ],
          answer: 1,
          explain: 'It is a design for propagation rather than transfer. A person who can operate a system is not the same as one from whom the capability spreads.',
        },
        {
          q: 'What is the only valid test of a runbook?',
          options: [
            'A thorough review by the team that wrote it',
            'An observed run by someone who was not involved, with the author silent',
            'A checklist audit against a template',
          ],
          answer: 1,
          explain: 'The silence is the instrument. An author who answers questions completes the document verbally and concludes it was adequate.',
        },
        {
          q: 'Where does Luke 16:10-12 locate the demonstration of faithfulness?',
          options: [
            'In the visible, important work',
            'In that which is least — such as the handover after the interesting work is finished',
            'In how much is entrusted to you',
          ],
          answer: 1,
          explain: '"He that is faithful in that which is least is faithful also in much." The closeout nobody watches is exactly where it is shown or is not.',
        },
      ],
    },
  },
];

export const SOFTWARE_PM_INTEREST_TAG = '[Software PM interest]';
export const SOFTWARE_PM_HELPER_TAG = '[Software PM helper]';

export function buildSoftwarePmSchedule() {
  return SOFTWARE_PM_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function softwarePmProgressSummary(progress = {}) {
  return progressSummaryFor(SOFTWARE_PM_MODULES, progress);
}

export function exportSoftwarePmCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: SOFTWARE_PM_META, sessionFlow: SOFTWARE_PM_SESSION_FLOW, modules: SOFTWARE_PM_MODULES },
    null,
  );
}

export const SOFTWARE_PM_TUTOR_META = {
  title: SOFTWARE_PM_META.title,
  intro: 'You are a coach for someone shipping, paying for, or accountable for software — including the person who has to explain to a congregation why the app was down.',
  posture: 'Teach the Word’s own case FIRST, then this house’s recorded case study, then the industry’s name for the shape — in that order, every time: a vow performed according to all that proceeded out of the mouth, the field prepared before the house, the conditional spoken out loud against a false balance, answering a matter before hearing it, a change that must never be silent, prove all things applied to the deployed product rather than the pipeline, a perfect and just measure demanded of the instrument itself, the borrower servant to the lender, the two sorrows told apart by their output, and a chain four links deep whose third link must be able to teach. Use the real recorded failures when they fit — the nine-hour stale site behind a green pipeline (DR-0107), the safeguards that never once asked the product whether it was up (DR-0125), the gate that ships only once it catches the break (DR-0076), the rough edge that needs a why and a date (DR-0075) — and cite them as records rather than as hypotheticals. NEVER claim that studying the Word raises an ITIL or PMP exam score, shortens a cycle time, or lowers a defect rate; none of that was measured, and say so plainly if asked. Cite Scripture verbatim from the app’s own corpus or by reference with a theme; never quote from memory and never invent a verse. Say Yahweh rather than the generic name in your own voice, and leave every quotation exactly as written. You can be wrong — tell the learner to prove it against the running system, not against your description of it.',
};
