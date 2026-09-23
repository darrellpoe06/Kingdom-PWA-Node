// =============================================================================
// Development — Building Systems That Tell the Truth (taught from this build)
// =============================================================================
// Darrell, 2026-09-17, in the same breath as the business suite: "and also uh,
// development, those sorts of courses. I want to make sure that I have those.
// And I want all these things done like as soon as possible so there can be
// context and content all at the same time SO ALL QUESTIONS CAN BE ANSWERED
// WITHOUT EVEN HAVING TO HAVE A CONVERSATION WITH ME."
//
// That last clause set the shape of this course. The way a platform answers
// questions without its builder in the room is to DOCUMENT ITS OWN
// CONSTRUCTION -- so every lesson here is taught from an artifact that actually
// exists in this repository, names it by path, and where a lesson is built on
// an incident, the incident really happened and its record is cited.
//
// NOTHING HERE IS ILLUSTRATIVE. Each file named was checked to exist at the
// time of writing, and one claim was corrected in the process: the
// service-worker fix was first going to be taught under the names PR #1405 gave
// it (SCOPE_SHELLS), which are NOT on main -- that pull request is still open.
// The equivalent fix IS on main under DOOR_PATHS / FACE_SHELLS / offlineShellFor,
// so lesson 6 teaches the code that is actually running. That correction is
// itself the subject of lesson 2, arrived at by obeying lesson 2.
//
// The register is a working builder's: plain, concrete, and never impressed with
// itself. The Word is above the craft, not decoration on it -- "Except the LORD
// build the house, they labour in vain that build it" is the first thing the
// course says, and it is meant operationally.
// =============================================================================
import {
  progressSummaryFor, exportCurriculumMarkdownFor, resolveCohortGeneric,
} from './church-classes.js';

export const DEVELOPMENT_PROPOSED_COHORT_START = null;
export const DEVELOPMENT_CONFIRMED_COHORT = { startDate: null, confirmed: false };

export const DEVELOPMENT_MODULES = [
  // ---------------------------------------------------------------------------
  {
    id: 'dev1-except-the-lord-build-the-house-and-counting-the-cost',
    title: 'Except the LORD Build the House — And Counting the Cost Before You Start',
    bigIdea: 'A SYSTEM BUILT WITHOUT HIM IS LABOUR IN VAIN, AND A SYSTEM BEGUN WITHOUT COUNTING THE COST GETS MOCKED HALF-FINISHED - THE WORD PUTS BOTH FAILURES IN ONE LESSON',
    anchor: {
      ref: 'Psalms 127:1; Luke 14:28; Proverbs 24:3',
      theme: 'KJV: "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain." (Psalms 127:1)',
    },
    lesson: `EXCEPT THE LORD BUILD THE HOUSE. Start here, because it is the sentence the rest of the course is measured by: "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain." (Psalms 127:1). Read the second half slowly, because builders skip it. IT IS NOT ONLY THE BUILDING. It is the WATCHING. You can write good code and then watch it faithfully and still be watching in vain, if He is not the one keeping the city. That is not a reason to stop watching - this whole course is about watching properly - it is a statement about who the watch depends on.

AND THEN THE MOST PRACTICAL PARABLE IN SCRIPTURE FOR ANYONE WHO BUILDS ANYTHING. "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). "Lest haply, after he hath laid the foundation, and is not able to finish it, all that behold it begin to mock him," and: "Saying, This man began to build, and was not able to finish." (Luke 14:30).

NOTICE WHAT THE FAILURE ACTUALLY IS IN THAT PARABLE. It is not that the tower was a bad idea. It is not that he lacked skill. HE LAID A FOUNDATION HE COULD NOT BUILD ON. Every half-built system you have ever inherited is that man's tower: the schema nobody finished migrating, the feature flag nobody removed, the integration that works for one case. And the mockery in the verse is not cruelty; it is the natural response of anyone who has to walk past the thing.

SO WHAT DOES COUNTING THE COST MEAN FOR A SYSTEM? Not an estimate of hours. Three questions, all answerable before the first line:

ONE - WHO MAINTAINS THIS WHEN I AM BUSY? A thing only its author can keep alive is a foundation without sufficient to finish.

TWO - WHAT TELLS US WHEN IT BREAKS? If the answer is "somebody will notice", you have not counted. Lesson 5 and lesson 6 are both about that answer being wrong.

THREE - WHAT DOES THIS COST TO KEEP RUNNING, in money, in attention, and in the compute nobody is watching? A system that quietly consumes is the open pit of lesson 5.

AND THE ORDER THE WORD GIVES FOR BUILDING ANYTHING. "Through wisdom is an house builded; and by understanding it is established" (Proverbs 24:3); "And by knowledge shall the chambers be filled with all precious and pleasant riches." (Proverbs 24:4). Three functions, and they are not interchangeable. BUILT by wisdom. ESTABLISHED - made to stand - by understanding. FILLED by knowledge. Most software failure is a house filled before it was established: features stacked on a structure nobody understood, and then the rain comes.

WHICH IS THE OTHER HOUSE PARABLE, AND IT IS ABOUT FOUNDATIONS TOO. "Therefore whosoever heareth these sayings of mine, and doeth them, I will liken him unto a wise man, which built his house upon a rock" (Matthew 7:24) - against the one "which built his house upon the sand" (Matthew 7:26), and then: "And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell: and great was the fall of it." (Matthew 7:27). Both men heard. One did. THE DIFFERENCE IS NOT INFORMATION - IT IS DOING - which is the whole difference between knowing that tests matter and having tests.

AND THE VERSE EVERY ENGINEER SHOULD HAVE ON THE WALL. "According to the grace of God which is given unto me, as a wise masterbuilder, I have laid the foundation, and another buildeth thereon. But let every man take heed how he buildeth thereupon." (1 Corinthians 3:10). ANOTHER BUILDETH THEREON. You are almost never the last person to touch the thing. And what happens to the work is not a matter of opinion: "Every man’s work shall be made manifest: for the day shall declare it, because it shall be revealed by fire; and the fire shall try every man’s work of what sort it is." (1 Corinthians 3:13). THE FIRE SHALL TRY IT. Production is a small picture of that verse - load, failure, the thing nobody anticipated - and it reveals what sort your work was, not what sort you said it was.

AND YAHWEH IS NOT MODEST ABOUT WHO THE ORIGINAL ENGINEER IS. "The LORD by wisdom hath founded the earth; by understanding hath he established the heavens." (Proverbs 3:19). Same two words as Proverbs 24:3 - founded by wisdom, established by understanding - used of the earth itself. And when Job needed putting in his place it was with an engineering question: "Where wast thou when I laid the foundations of the earth? declare, if thou hast understanding." (Job 38:4); "Who hath laid the measures thereof, if thou knowest? or who hath stretched the line upon it?" (Job 38:5). WHO STRETCHED THE LINE UPON IT. He is holding a measuring line in that verse. The plumbline of lesson 3 is not our invention; we are borrowing His tool.`,
    inApp: 'Take something you are about to build. Write the three cost questions and answer them in writing: who maintains it when you are busy, what tells you when it breaks, and what it costs to keep running. If any answer is "somebody will notice", you have not counted the cost yet.',
    benefits: [
      'Psalms 127:1 in both halves - the BUILDING and the WATCHING both depend on Him, which is why watching properly is obedience and not self-reliance.',
      'Luke 14:28-30 diagnosed precisely: the failure is a foundation laid that could not be built on, which is every half-finished system you have inherited.',
      'Counting the cost as three answerable questions: who maintains it, what tells you it broke, and what it costs to keep running.',
      'Proverbs 24:3-4 as three non-interchangeable functions - BUILT by wisdom, ESTABLISHED by understanding, FILLED by knowledge.',
      'Matthew 7:24-27: both men heard, one did. The difference is doing, not information.',
      '1 Corinthians 3:10 - ANOTHER BUILDETH THEREON - and 3:13, where the fire tries what sort the work was, not what sort it was claimed to be.',
      'Proverbs 3:19 and Job 38:4-5: founded by wisdom, established by understanding, with Yahweh holding the measuring line - so the plumbline is His tool, borrowed.',
    ],
    levels: {},
    readOptionsAloud: true,
    quiz: {
      questions: [
        {
          q: 'In Luke 14:28-30, what exactly is the builder’s failure?',
          options: [
            'He laid a foundation he could not build on',
            'He chose the wrong kind of tower',
            'He lacked the skill to build well',
          ],
          answer: 0,
          explain: 'Not a bad idea and not a lack of skill - an unfinishable foundation. Every half-built system anyone has inherited is that man’s tower.',
        },
        {
          q: 'What are the three functions in Proverbs 24:3-4, in order?',
          options: [
            'Built by wisdom, established by understanding, filled by knowledge',
            'Filled by wisdom, built by understanding, established by knowledge',
            'They all describe the same thing',
          ],
          answer: 0,
          explain: 'Most software failure is a house FILLED before it was ESTABLISHED - features stacked on a structure nobody understood.',
        },
        {
          q: 'What separates the two men in Matthew 7:24-27?',
          options: [
            'Both heard; one DID',
            'One had more information',
            'One built in better weather',
          ],
          answer: 0,
          explain: 'The difference is doing, not information - the same difference as between knowing tests matter and having tests.',
        },
        {
          q: 'According to 1 Corinthians 3:13, what does the fire reveal about a man’s work?',
          options: [
            'What SORT it is - not what sort it was claimed to be',
            'How long it took to build',
            'Who paid for it',
          ],
          answer: 0,
          explain: 'Production is a small picture of that verse: load, failure, the unanticipated thing - revealing what sort the work actually was.',
        },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Psalms 127:1 has TWO halves, and builders skip the watching one.',
        'Luke 14:28-30: the failure is an unfinishable foundation, not a bad idea.',
        'The three cost questions, answerable before the first line of code.',
        'Proverbs 24:3-4: built, established, filled - three different functions.',
        'Matthew 7:24-27: both heard, one did.',
        '1 Corinthians 3:10 - another buildeth thereon. You are rarely the last hand.',
        '1 Corinthians 3:13 - the fire tries what SORT it is.',
        'Job 38:5 - He is holding the measuring line, so the plumbline is borrowed, not invented.',
      ],
      discussionPrompts: [
        'Name a half-finished thing in your own system. What did counting the cost have looked like before it started?',
        'For your most important service: what tells you it broke, and how would you know that thing still works?',
        'Where have you filled a house that was never established? What would establishing it now require?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'dev2-name-the-real-record-and-the-real-screen-before-you-code',
    title: 'Name the Real Record and the Real Screen — The Trace That Runs Before Any Code',
    bigIdea: 'A SURFACE THAT DISPLAYS A NUMBER NOBODY CAN TRACE TO A REAL ROW IS WORSE THAN NO SURFACE, AND THE ONLY DEFENCE IS TO NAME THE DATA AND OBSERVE THE SCREEN BEFORE WRITING ANYTHING',
    anchor: {
      ref: 'Proverbs 18:13; Proverbs 14:15; Proverbs 20:12',
      theme: 'KJV: "He that answereth a matter before he heareth it, it is folly and shame unto him." (Proverbs 18:13)',
    },
    lesson: `THIS LESSON EXISTS BECAUSE OF THREE MISSES IN ONE DAY. On 2026-06-13 this platform shipped an image upload into the wrong component, a progress board that displayed static numbers and could not flag its own missed targets, and then a proposed fix that rested on a premise error - the board was platform data, not the user’s projects. The common cause was not carelessness about code. It was OPTIMISING EACH SURFACE AS A DISPLAY LAYER OVER WHATEVER DATA WAS NEAREST. The record of it is in this repository, in the LESSONS-LEARNED foundation document and the decision record it produced.

SO THE PLATFORM HAS A STANDING TRACE THAT RUNS BEFORE ANY USER-FACING CODE, out loud, first. Four steps.

ONE - NAME THE REAL DATA. Which record, table or feed does this surface read and write? If a displayed value cannot be traced to a real row, a real run or a real timestamp, IT DOES NOT SHIP. A painted number - a hardcoded sixty percent, an invented list - is worse than nothing on a surface whose entire value is trust. This is the step most easily faked, because a plausible number looks exactly like a true one.

TWO - CONFIRM IT CONNECTS END TO END, in the live system, signed in, against the real instance. Not the demo path. Not the seed data.

THREE - CONFIRM THE SURFACE THE USER ACTUALLY USES, BY OBSERVING IT. A screenshot, a DOM read, the running app. Two of those three 2026-06-13 misses die at this step, because both were assumptions about which screen a person was looking at.

FOUR - WRITE THE PREMISE DOWN FIRST. A wrong premise caught in a sentence costs a sentence. The same premise caught after a merged pull request costs the change, the revert, and some of the trust that made the work worth doing.

AND THE WORD NAMED THIS FAILURE LONG BEFORE ANYONE HAD A DASHBOARD. "He that answereth a matter before he heareth it, it is folly and shame unto him." (Proverbs 18:13). That is the whole defect in one line - ANSWERING BEFORE HEARING. Writing the fix before reading the system. Reasoning about what a thing must be doing instead of going and looking.

AND ITS COMPANION, WHICH IS ABOUT THE SAME HABIT FROM THE OTHER SIDE: "The simple believeth every word: but the prudent man looketh well to his going." (Proverbs 14:15). LOOKETH WELL TO HIS GOING. Not thinks well about his going. Looks.

THIS COURSE OBEYED THAT RULE WHILE BEING WRITTEN, AND IT CAUGHT A REAL ERROR. Lesson 6 was going to teach the service-worker fix using the names it has in the pull request that diagnosed it. Those names are not on the main branch - that pull request is still open. Had the trace not run, this course would have taught learners to look for code that is not there, in a lesson about verifying things. The names the running code actually uses were read out of the file and lesson 6 teaches those. FOUR MINUTES OF LOOKING PREVENTED A LESSON THAT WOULD HAVE BEEN WRONG ABOUT THE VERY THING IT WAS TEACHING.

AND THE REASON OBSERVATION IS NOT OPTIONAL, WHICH IS A DOCTRINE OF CREATION AND NOT A METHODOLOGY: "The hearing ear, and the seeing eye, the LORD hath made even both of them." (Proverbs 20:12). He built the instruments. Declining to use them in favour of inference is not efficiency; it is leaving a given faculty idle.

THE GOVERNING PRINCIPLE, AND IT IS THE HARD PART. A surface is a LIVE VIEW of real system state, and usually a CONTROL for it. The application is where the flow RUNS, not where it is drawn. So when a surface and its real data do not yet connect, THAT GAP IS THE WORK. It is not polish to be scheduled later. Drawing the surface first and wiring it later is how painted numbers get shipped, every time, because a drawn surface looks finished.`,
    inApp: 'Pick a number currently displayed anywhere in your system. Trace it to the row, run or timestamp it came from, out loud, in writing. If you cannot finish the trace in under two minutes, you have found a painted number.',
    benefits: [
      'The real incident behind the rule: three misses in one day on 2026-06-13, all from treating surfaces as display layers over whatever data was nearest.',
      'The four-step trace, run out loud BEFORE any code: name the real data, confirm end to end live, OBSERVE the actual screen, write the premise down first.',
      'Why a painted number is worse than none on a surface whose value is trust - and why it is the easiest step to fake.',
      'Proverbs 18:13 as the exact defect: answering before hearing, which is writing the fix before reading the system.',
      'Proverbs 14:15 - looketh well to his going. Looks, not thinks.',
      'A worked example from this very course: lesson 6 nearly taught code that is not on main, caught by running the trace.',
      'Proverbs 20:12 as the doctrine under it - He made the ear and the eye, so declining to look leaves a given faculty idle.',
      'The governing principle: where a surface and its data do not connect, THE GAP IS THE WORK - not later polish.',
    ],
    levels: {},
    readOptionsAloud: true,
    quiz: {
      questions: [
        {
          q: 'What was the common cause of the three misses on 2026-06-13?',
          options: [
            'Optimising each surface as a display layer over whatever data was nearest',
            'Writing code too quickly',
            'A framework limitation',
          ],
          answer: 0,
          explain: 'Not carelessness about code - a wrong idea about what a surface IS. A surface is a live view of real state, not a drawing.',
        },
        {
          q: 'Which step of the trace do most assumption errors die at?',
          options: [
            'Observing the surface the user actually uses',
            'Naming the real data',
            'Writing the premise down',
          ],
          answer: 0,
          explain: 'Two of the three 2026-06-13 misses were assumptions about which screen a person was looking at - answerable by a screenshot or a DOM read.',
        },
        {
          q: 'How does Proverbs 18:13 describe the defect this lesson guards against?',
          options: [
            'Answering a matter before hearing it - folly and shame',
            'Speaking too softly',
            'Refusing to answer at all',
          ],
          answer: 0,
          explain: 'Writing the fix before reading the system. Reasoning about what a thing must be doing instead of going and looking.',
        },
        {
          q: 'When a surface and its real data do not yet connect, what is the correct response?',
          options: [
            'That gap IS the work - wire it now, not later',
            'Draw the surface and wire it in a later pass',
            'Display a placeholder value until it is ready',
          ],
          answer: 0,
          explain: 'Drawing first and wiring later is how painted numbers ship every time, because a drawn surface looks finished.',
        },
      ],
    },
    facilitator: {
      talkingPoints: [
        'The 2026-06-13 incident is real and recorded - three misses, one cause.',
        'The four-step trace, and that it is spoken OUT LOUD before code, not after.',
        'A painted number is worse than none, and it is the easiest step to fake.',
        'Proverbs 18:13 - answering before hearing is the defect exactly.',
        'Proverbs 14:15 - LOOKETH well to his going.',
        'This course caught its own error by running the trace (see lesson 6).',
        'Proverbs 20:12 - He made the ear and the eye; inference is not a substitute.',
        'The gap between a surface and its data IS the work.',
      ],
      discussionPrompts: [
        'Name a number your system displays that you cannot immediately trace. What would it take to trace it?',
        'When did you last reason about what code MUST be doing instead of reading it? What did that cost?',
        'Which of your screens have you never actually watched a real user use?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'dev3-the-plumbline-no-claim-without-evidence',
    title: 'The Plumbline — No Claim Without Evidence, and Gates Instead of Assurances',
    bigIdea: 'DONE IS NOT A WORD SOMEONE SAYS - IT IS ATTACHED EVIDENCE, AND WHERE A PROPERTY CAN BE MACHINE-CHECKED A CHECK MUST FAIL THE BUILD, BECAUSE NOBODY CAN TALK PAST A FAILING GATE',
    anchor: {
      ref: 'Amos 7:7-8; Isaiah 28:17; 1 Thessalonians 5:21',
      theme: 'KJV: "Judgment also will I lay to the line, and righteousness to the plummet: and the hail shall sweep away the refuge of lies, and the waters shall overflow the hiding place." (Isaiah 28:17)',
    },
    lesson: `THE THREAT IS NOT CODE THAT LOOKS WRONG. It is work that LOOKS RIGHT AND IS WRONG. A comment claiming an interface met a contrast standard while the measured ratio was 2.92 to 1. A refactor described as behaviour-preserving whose behaviour was never pinned. Those are both real examples from this platform’s own history, and neither was a lie anyone told deliberately. Both were confident sentences standing where a measurement belonged.

SO THIS HOUSE HAS A DOCTRINE, AND IT IS SHORT: NO CLAIM WITHOUT EVIDENCE. "It works", "it is done", "it passes", "it is accessible", "it is secure" are not accepted on anyone’s word - not the author’s, not a reviewer’s, and not the author’s about their own work. Done means attached evidence: a passing gate, a measured number taken from the real artifact, a live screenshot or DOM read, a real query result, a test. No evidence, not done.

AND WHERE A PROPERTY CAN BE MACHINE-CHECKED, A CHECK CHECKS IT AND FAILS THE BUILD. That sentence is the whole method. The reason is not distrust of people; it is that A GATE CANNOT BE TALKED PAST. A reviewer can be persuaded, can be tired, can be in a hurry, can like you. A failing check is indifferent to all of that. Every class of defect that once looked fine and was not becomes a new gate, so the same lie cannot be told twice.

FOUR RULES THAT FOLLOW, AND EACH ONE EXISTS BECAUSE SOMETHING GOT THROUGH WITHOUT IT:

MEASURE, DO NOT CLAIM. Any quantitative statement - a contrast ratio, a response time, a row count, a percentage - comes from a measurement of the real artifact. Not an estimate. Not a remembered number.

CHARACTERISE BEFORE YOU CHANGE. Pin what the code ACTUALLY does before altering it. "Better" is measured against verified reality, never against your memory of the reality.

INDEPENDENT VERIFICATION FOR ANYTHING HIGH-STAKES. A second, different method confirms before trust - a live test against the data, not merely a second reading of the code. Two readings of the same code share the same blind spot.

PROVENANCE AND HONEST UNCERTAINTY. A claim about the system cites the file and line, the run, or the query. A claim from general knowledge is labelled as such. And "I did not verify this" IS A VALID AND REQUIRED OUTPUT. Uncertainty gets surfaced, never papered over.

NOW THE WORD, WHICH SUPPLIED THE INSTRUMENT. Yahweh shows Amos a tool: "Thus he shewed me: and, behold, the Lord stood upon a wall made by a plumbline, with a plumbline in his hand." (Amos 7:7). And He asks the question a gate asks: "And the LORD said unto me, Amos, what seest thou? And I said, A plumbline." (Amos 7:8). NOT what do you think of the wall. WHAT SEEST THOU. A plumbline does not argue with a wall, does not care who built it, and cannot be persuaded that this particular wall is leaning for a good reason. It reports.

AND THE VERSE THAT SAYS WHAT MEASUREMENT DOES TO A COMFORTABLE STORY: "Judgment also will I lay to the line, and righteousness to the plummet: and the hail shall sweep away the refuge of lies, and the waters shall overflow the hiding place." (Isaiah 28:17). THE REFUGE OF LIES AND THE HIDING PLACE. That is precisely what an unmeasured claim is - a place to hide. And the line sweeps it away.

AND THE STANDING INSTRUCTION, WHICH IS TWO COMMANDS AND MOST PEOPLE KEEP ONLY ONE: "Prove all things; hold fast that which is good." (1 Thessalonians 5:21). PROVE, then HOLD FAST. Proving without holding fast is cynicism, which tests everything and trusts nothing and ships nothing. Holding fast without proving is credulity, which is how the 2.92 contrast ratio got a comment saying it was compliant. The verse requires both.

THE LAST PIECE, AND IT IS THE ONE THAT KEEPS THIS FROM BECOMING A BUREAUCRACY. Verification exists to make review CHEAPER, not to add ceremony. Evidence attached to a change means the reviewer spends attention on judgement rather than on confirming basics. And it never removes the human: the machine reports the wall, and a person still decides what to do about the building.`,
    inApp: 'Take your last "it works" and make it evidence. Attach the passing run, the measured number from the real artifact, or the query result. If you cannot produce one within ten minutes, you did not know it worked - you expected it to.',
    benefits: [
      'The real threat named: not code that looks wrong, but work that LOOKS RIGHT and is wrong - with two real examples from this platform.',
      'The doctrine in one line: no claim without evidence, and "done" means attached evidence rather than a word anyone says.',
      'Why gates rather than assurances - a reviewer can be persuaded or tired or hurried; a failing check is indifferent to all of it.',
      'Measure don’t claim; characterise before you change; independent verification for high stakes; provenance and honest uncertainty.',
      'Amos 7:7-8 - WHAT SEEST THOU, not what do you think of the wall. A plumbline reports and cannot be argued with.',
      'Isaiah 28:17 - the line sweeps away the refuge of lies and the hiding place, which is exactly what an unmeasured claim is.',
      '1 Thessalonians 5:21 as TWO commands: proving without holding fast is cynicism, holding fast without proving is credulity.',
      'And the limit: verification makes review cheaper, and never removes the human who decides.',
    ],
    levels: {},
    readOptionsAloud: true,
    quiz: {
      questions: [
        {
          q: 'What is the real threat this doctrine exists to stop?',
          options: [
            'Work that looks right and is wrong',
            'Code written in a hurry',
            'Developers who do not care',
          ],
          answer: 0,
          explain: 'A comment claiming a contrast standard was met while the measured ratio was 2.92 to 1 was not a deliberate lie - it was a confident sentence standing where a measurement belonged.',
        },
        {
          q: 'Why prefer a machine gate to a reviewer’s assurance?',
          options: [
            'Because a gate cannot be talked past - it is indifferent to hurry, tiredness and goodwill',
            'Because reviewers are usually wrong',
            'Because gates are faster to write',
          ],
          answer: 0,
          explain: 'Not distrust of people. A reviewer can be persuaded; a failing check cannot. Every defect class that once looked fine becomes a gate so the same lie cannot be told twice.',
        },
        {
          q: 'In Amos 7:8, what does Yahweh ask about the wall?',
          options: [
            'What seest thou - not what do you think of it',
            'Who built it',
            'Whether it can be repaired',
          ],
          answer: 0,
          explain: 'A plumbline does not argue with a wall and cannot be persuaded that this one leans for a good reason. It reports.',
        },
        {
          q: 'What are the TWO commands in 1 Thessalonians 5:21?',
          options: [
            'Prove all things, AND hold fast that which is good',
            'Prove all things, and discard the rest',
            'Hold fast, and question nothing',
          ],
          answer: 0,
          explain: 'Proving without holding fast is cynicism that ships nothing. Holding fast without proving is credulity. The verse requires both.',
        },
      ],
    },
    facilitator: {
      talkingPoints: [
        'The threat is plausible wrongness, not obvious wrongness.',
        'Done = attached evidence. Not a word the author says about their own work.',
        'A gate cannot be talked past. That is the whole argument for gates.',
        'Measure, characterise, verify independently, cite provenance, admit uncertainty.',
        'Amos 7:7-8 - what SEEST thou. The instrument does not negotiate.',
        'Isaiah 28:17 - an unmeasured claim is a hiding place, and the line sweeps it away.',
        '1 Thessalonians 5:21 is two commands; keeping one gives cynicism or credulity.',
        'And verification makes review cheaper without removing the human who decides.',
      ],
      discussionPrompts: [
        'What is the most confident sentence in your codebase that has never been measured?',
        'Name a defect class that has bitten you twice. What gate would have made the second time impossible?',
        'Where are you a cynic (proving, never holding fast) and where are you credulous (holding fast, never proving)?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'dev4-a-gate-that-always-passes-is-itself-a-lie',
    title: 'A Gate That Always Passes Is Itself a Lie — Proving the Check Catches',
    bigIdea: 'A GREEN CHECK MUST MEAN SOMETHING, SO A NEW GATE SHIPS ONLY AFTER IT HAS BEEN SHOWN TO GO RED ON THE REAL BREAK - AND A BREAK THAT SILENTLY DOES NOTHING READS EXACTLY LIKE A PASSING GATE',
    anchor: {
      ref: 'Galatians 6:7; Proverbs 12:1; Proverbs 27:17',
      theme: 'KJV: "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap." (Galatians 6:7)',
    },
    lesson: `THE PREVIOUS LESSON SAID TO PREFER GATES TO ASSURANCES. THIS ONE IS THE TRAP INSIDE THAT ADVICE. A test suite of one thousand checks, all green, all of which would pass no matter what the code did, IS WORSE THAN NO SUITE AT ALL - because now everybody trusts it. The green is load-bearing and hollow. That is theatre, and it is the most expensive kind of self-deception in software because it costs nothing to maintain and returns nothing.

SO THE RULE: A NEW GATE SHIPS ONLY AFTER IT HAS BEEN SHOWN TO CATCH. You do not reason that the check would catch the break. You introduce the break, run the suite, and watch it go red. Then you revert the break and keep the check. The green you have afterwards means something, because you have seen the red.

AND THE DISCIPLINE OF BREAKING PROPERLY, WHICH IS WHERE MOST OF THIS GOES WRONG. Four rules, and every one was learned from a break that fooled its author:

ONE - ASSERT THE BREAK LANDED. A find-and-replace that matched nothing is a break that never happened, and the suite stays green FOR THE WRONG REASON. If the edit did not change the file, that is an error, not a result. This is the failure mode that reads most exactly like success.

TWO - BREAK GLOBALLY WITHIN THE SCOPE YOU MEAN. A break that removes a phrase from one paragraph while the same phrase stands in three others proves nothing about the check - the other three hold it green. A real example: a property removed from one lesson body stayed green because a later benefits list repeated it.

THREE - A CHECK THAT SPANS TOO MUCH PROVES TOO LITTLE. A search across an entire document can only tell you a phrase EXISTS somewhere. It can never tell you the phrase is doing its job where it stands. If the property matters in a specific place, the check must be scoped to that place - and this course’s own gates were rewritten twice to get that right.

FOUR - WATCH THE THING, NOT A TOKEN STANDING IN FOR IT. The most common hollow check tests a label instead of the behaviour: a disclaimer instead of a sequence, a flag instead of an effect, a log line instead of a result.

AND THE WORD IS BLUNT ABOUT SELF-DECEPTION IN WORK. "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap." (Galatians 6:7). YAHWEH IS NOT MOCKED. A suite is exactly the kind of thing that can mock a person - all that green, all that apparent diligence - and what was actually sown was nothing. The harvest comes at the incident, and it matches the sowing rather than the dashboard.

AND THE POSTURE THAT MAKES THIS POSSIBLE, BECAUSE IT IS UNPLEASANT TO BREAK YOUR OWN WORK ON PURPOSE. "Whoso loveth instruction loveth knowledge: but he that hateth reproof is brutish." (Proverbs 12:1). A failing test IS reproof - the cheapest and kindest form of it available, because it arrives before a person is harmed. A builder who resents red is resenting the only correction that costs nothing.

AND WHY YOU CANNOT DO THIS ALONE FOR LONG. "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend." (Proverbs 27:17). You share a blind spot with yourself. The break you do not think of is the one in the region you are confident about, which is precisely where you will not look. Another person, or an adversarial second pass with explicit instructions to try to get past your own gate, finds what your confidence hides.

THE HABIT THIS BUILDS, AND IT IS WORTH MORE THAN ANY INDIVIDUAL TEST. After a while you stop asking "does my code work" and start asking "WHAT WOULD MAKE THIS CHECK FAIL, AND CAN I DO IT". That question has an answer you can execute, which makes it a far better question than the first one.`,
    inApp: 'Take your most important test. Break the thing it protects, on purpose, and run it. If it stays green, you have just discovered that check was decoration. Fix the check, then revert the break.',
    benefits: [
      'The trap inside preferring gates: a thousand green checks that would pass regardless are worse than none, because the green is trusted.',
      'The rule - a new gate ships only after it has been SHOWN to go red on the real break, then the break is reverted.',
      'Assert the break LANDED: an edit that matched nothing leaves the suite green for the wrong reason, which reads exactly like success.',
      'Break globally within the intended scope - a phrase removed from one place while three others repeat it proves nothing.',
      'A check that spans too much proves too little: a document-wide search shows a phrase EXISTS, never that it is doing its job where it stands.',
      'Watch the thing, not a token standing in for it - a disclaimer instead of a sequence, a flag instead of an effect.',
      'Galatians 6:7 - a green suite is exactly the kind of thing that can mock a person, and the harvest matches the sowing rather than the dashboard.',
      'Proverbs 12:1 - a failing test is reproof, the cheapest kind, arriving before anyone is harmed.',
      'Proverbs 27:17 - you share a blind spot with yourself, so the break you never think of is in the region you are confident about.',
    ],
    levels: {},
    readOptionsAloud: true,
    quiz: {
      questions: [
        {
          q: 'Why is a suite of always-passing checks worse than no suite?',
          options: [
            'Because the green is trusted while being hollow',
            'Because it takes time to run',
            'Because it discourages writing more tests',
          ],
          answer: 0,
          explain: 'The green becomes load-bearing. That is the most expensive self-deception in software: it costs nothing to maintain and returns nothing.',
        },
        {
          q: 'Which break failure mode most exactly resembles a passing gate?',
          options: [
            'A break that matched nothing and never landed',
            'A break that broke too much',
            'A break in the wrong file',
          ],
          answer: 0,
          explain: 'A find-and-replace that matched nothing leaves the suite green for the wrong reason. If the edit did not change the file, that is an error, not a result.',
        },
        {
          q: 'What can a document-wide search actually prove?',
          options: [
            'Only that a phrase exists somewhere - never that it is doing its job where it stands',
            'That the property holds everywhere it matters',
            'That the property holds in the right field',
          ],
          answer: 0,
          explain: 'If a property matters in a specific place, the check must be scoped to that place. Breadth buys existence, not correctness.',
        },
        {
          q: 'How does Proverbs 12:1 frame a failing test?',
          options: [
            'As reproof - and the one who hates reproof is brutish',
            'As an obstacle to shipping',
            'As someone else’s problem',
          ],
          answer: 0,
          explain: 'A failing test is the cheapest and kindest correction available, because it arrives before a person is harmed. Resenting red is resenting the only free correction.',
        },
      ],
    },
    facilitator: {
      talkingPoints: [
        'The trap inside lesson 3: a hollow green is worse than no green.',
        'Shown to catch, not reasoned to catch. Introduce the break and watch red.',
        'Assert the break landed - the no-op break is the most deceptive failure mode.',
        'Break globally in scope; repeated phrases elsewhere hold a check up.',
        'Too-broad checks buy existence, not correctness.',
        'Watch the thing, not a token standing in for it.',
        'Galatians 6:7 - the harvest matches the sowing, not the dashboard.',
        'Proverbs 12:1 - red is reproof, and it is the cheap kind.',
        'Proverbs 27:17 - you share a blind spot with yourself.',
      ],
      discussionPrompts: [
        'Which of your tests have you never seen fail? What would that suggest about them?',
        'Describe a time a green build let a real defect through. What was the check actually watching?',
        'What region of your system are you most confident about? That is where to look for a missing break.',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'dev5-the-battlement-and-the-open-pit-guards-on-anything-that-runs-itself',
    title: 'The Battlement and the Open Pit — Guards on Anything That Runs Itself',
    bigIdea: 'THE LAW REQUIRED A RAIL ON A NEW ROOF AND A COVER ON A DUG PIT, WHICH IS EXACTLY WHAT A BUDGET, A LOCK AND A STOP-PATH ARE ON ANYTHING THAT FIRES WITHOUT A HUMAN PRESENT',
    anchor: {
      ref: 'Deuteronomy 22:8; Exodus 21:33-34; Proverbs 25:28',
      theme: 'KJV: "When thou buildest a new house, then thou shalt make a battlement for thy roof, that thou bring not blood upon thine house, if any man fall from thence." (Deuteronomy 22:8)',
    },
    lesson: `THIS LESSON IS POST-INCIDENT, AND THE INCIDENT WAS REAL. On 2026-06-06 a fleet of autonomous, timer-driven automation on this platform - a five-minute feedback loop, an autonomous builder shipped active, a pinned model, a batch queue and five scheduled tasks - was left running unattended while the principal travelled. It went into runaway compute, looped, hung, and had to be SHUT DOWN BY HAND; the scheduled fleet was deleted to stop it. The record is in this repository’s LESSONS-LEARNED foundation document, dated, with the principles it produced.

SO THE RULE THIS HOUSE NOW BUILDS TO. Nothing that fires on a clock, spawns more work, or consumes compute without a person present ships without its guards designed in AND PROVEN TO CATCH:

A BUDGET - a token, turn or wall-clock ceiling per run. A run that reaches the ceiling TERMINATES ITSELF. It does not continue, and it does not ask.

A CONCURRENCY LOCK - single instance. A new firing that finds a previous run still in progress SKIPS. It does not stack. Stacking is how a five-minute loop becomes twelve simultaneous loops by lunchtime.

A STOP-PATH - a deterministic way for the thing to be stopped or to stop itself: a registry entry set to disabled, a required file removed, a switch the system itself reads. Not a human remembering.

AND NOTE WHAT THESE GUARDS ARE NOT. They are not a reason to delay BUILDING. They gate what ships RUNNING. A thing is built with its brakes designed in, shipped inactive, and activated on proof with someone watching. Citing safety as a reason not to build the thing is its own failure, and a different one.

NOW THE WORD, WHICH LEGISLATED THIS EXACT CATEGORY. "When thou buildest a new house, then thou shalt make a battlement for thy roof, that thou bring not blood upon thine house, if any man fall from thence." (Deuteronomy 22:8). Read what that law is and is not. It is not a prohibition on flat roofs, which were useful and used. IT IS A REQUIRED RAIL ON A USEFUL THING. The roof stays; the rail is not optional; and the liability is named in advance - blood upon thine house - so nobody can claim later that they did not know who would answer for it.

AND THE SECOND ONE IS EVEN CLOSER TO AUTOMATION. "And if a man shall open a pit, or if a man shall dig a pit, and not cover it, and an ox or an ass fall therein" (Exodus 21:33) - then: "The owner of the pit shall make it good, and give money unto the owner of them; and the dead beast shall be his." (Exodus 21:34). THE OWNER OF THE PIT. Not the animal that fell in, not bad luck, not the ox’s owner for letting it wander. The man who dug and did not cover. YOU DUG IT, YOU OWN WHAT FALLS IN IT. That is the cleanest statement of engineering liability in any text, and it is about four thousand years old.

AND THE ONE THAT DESCRIBES A SYSTEM WITHOUT A BRAKE. "He that hath no rule over his own spirit is like a city that is broken down, and without walls." (Proverbs 25:28). The verse is about a man, and the picture is architectural on purpose: WITHOUT WALLS. Not weak walls - none. Anything can enter, nothing can be kept out, and the city is not defended by its good intentions. An automation with no ceiling is that city.

AND THE PRUDENCE THE WORD EXPECTS OF A BUILDER: "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished." (Proverbs 22:3). FORESEETH. The prudent man is not the one who responds well to the incident; he is the one who saw the shape of it beforehand and did something structural. The simple PASS ON - they proceed, unchanged, past the thing they could have seen - and the verse says what happens.

THE HARD-WON LESSON UNDERNEATH ALL OF IT. Sovereignty of location does not bound cost or blast radius. Running on your own hardware makes a runaway YOUR runaway; it does not make it smaller. And "it is only additive" is not a safety argument either - the 2026-06-06 fleet was additive, and additive things ran the machine into the ground.`,
    inApp: 'List everything in your system that fires without a person present. For each one, write its ceiling, its lock, and its stop-path. Any blank is an uncovered pit, and Exodus 21:34 already named who owns what falls in.',
    benefits: [
      'The real incident: 2026-06-06, a timer-driven fleet left unattended, runaway compute, shut down by hand - recorded and dated in this repository.',
      'The three guards, required and proven-to-catch: a budget that terminates itself, a single-instance lock that SKIPS rather than stacks, and a deterministic stop-path.',
      'And what they are NOT: they gate what ships RUNNING, never what gets BUILT - built with brakes, shipped inactive, activated on proof with someone watching.',
      'Deuteronomy 22:8 read exactly: not a ban on useful roofs, a required rail on one, with the liability named in advance.',
      'Exodus 21:33-34 - THE OWNER OF THE PIT. You dug it, you own what falls in. Four-thousand-year-old engineering liability.',
      'Proverbs 25:28 - a city broken down and WITHOUT WALLS is the picture of an automation with no ceiling.',
      'Proverbs 22:3 - the prudent man FORESEETH and acts structurally; the simple pass on unchanged.',
      'The hard-won lesson: sovereignty of location does not bound cost or blast radius, and "additive" is not a safety argument.',
    ],
    levels: {},
    readOptionsAloud: true,
    quiz: {
      questions: [
        {
          q: 'What must a single-instance lock do when a new firing finds a run already in progress?',
          options: [
            'SKIP - never stack on top of it',
            'Queue behind it',
            'Kill the running one and start fresh',
          ],
          answer: 0,
          explain: 'Stacking is how a five-minute loop becomes twelve simultaneous loops by lunchtime. Skipping is the only safe answer.',
        },
        {
          q: 'What does Deuteronomy 22:8 actually require?',
          options: [
            'A rail on a useful roof, with the liability named in advance',
            'That flat roofs not be built',
            'That nobody go up on the roof',
          ],
          answer: 0,
          explain: 'The roof stays and is used. The rail is not optional, and "blood upon thine house" names who answers before anything happens.',
        },
        {
          q: 'In Exodus 21:33-34, who is liable for what falls into an uncovered pit?',
          options: [
            'The owner of the pit - the man who dug it and did not cover it',
            'The owner of the animal, for letting it wander',
            'Nobody - it is an accident',
          ],
          answer: 0,
          explain: 'You dug it, you own what falls in. That is the cleanest statement of engineering liability in any text.',
        },
        {
          q: 'Do these guards mean an automation should not be built until they are approved?',
          options: [
            'No - they gate what ships RUNNING; it is built with brakes, shipped inactive, activated on proof',
            'Yes - nothing is built until the brakes are signed off',
            'Yes - autonomous work should be avoided',
          ],
          answer: 0,
          explain: 'Citing safety as a reason not to build the thing is its own failure, and a different one. Build it with the brakes designed in.',
        },
      ],
    },
    facilitator: {
      talkingPoints: [
        'The 2026-06-06 runaway is real, dated, and recorded - this lesson is post-incident.',
        'Budget, lock, stop-path - and all three PROVEN to catch, not merely present.',
        'They gate what ships running, not what gets built. Build with brakes, ship inactive.',
        'Deuteronomy 22:8 is a rail on a useful roof, not a ban - and it names the liability first.',
        'Exodus 21:34 - the owner of the pit. The cleanest liability rule there is.',
        'Proverbs 25:28 - without walls, not weak walls.',
        'Proverbs 22:3 - foreseeth and acts structurally; the simple pass on.',
        'Sovereignty of location bounds nothing, and "additive" is not a safety argument.',
      ],
      discussionPrompts: [
        'What in your system fires without a person present, and what is its ceiling? If you do not know, that is the finding.',
        'Which of your pits is uncovered right now? Exodus 21:34 has already assigned the ownership.',
        'Where have you used "it is only additive" as a safety argument? What would bound it instead?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'dev6-the-worker-that-broke-the-front-door',
    title: 'The Worker That Broke the Front Door — Why Every Probe Stayed Green While Phones Went Dark',
    bigIdea: 'THE CHURCH APP DIED WITH A NETWORK ERROR ON INSTALLED PHONES WHILE EVERY HEALTH CHECK REPORTED UP AND FRESH, BECAUSE THE BUG NEEDED AN INSTALLED SERVICE WORKER AND EVERY PROBE RAN IN A FRESH BROWSER',
    anchor: {
      ref: 'Proverbs 22:3; Proverbs 20:12; Psalms 127:1',
      theme: 'KJV: "The hearing ear, and the seeing eye, the LORD hath made even both of them." (Proverbs 20:12)',
    },
    lesson: `THIS IS THE MOST INSTRUCTIVE OUTAGE IN THIS PLATFORM’S HISTORY, AND THE LESSON IS NOT ABOUT SERVICE WORKERS. On 2026-08-30 the church app’s own front door was reported dead on a phone - the installed application, launched normally, showing a bare network error. AT THAT SAME MOMENT THE AUTOMATED HEALTH CHECK REPORTED UP AND FRESH ACROSS EVERY DIMENSION IT MEASURED. Both observations were true. That is the whole problem, and it is the shape of the hardest class of production failure there is.

HOW BOTH COULD BE TRUE. A real browser driven from a clean machine opened the door and it worked - every case passed. But a fresh browser HAS NO SERVICE WORKER INSTALLED. That is the entire difference between the machine that said UP and the phone that was dark. The defect lived in code that only runs on a device that has already installed the application, which is to say: only on the devices of the people who use it most.

THE MECHANISM, READ OUT OF THE FILE THAT WAS RUNNING (app/public/sw.js, and the registration in app/src/main.jsx). At the time, the application registered its worker at the default scope - the root - so ONE worker controlled every door on the origin, while the worker’s own BASE constant named only one of them. (That root registration was itself retired on 2026-09-23, for a different reason: a phone credits a notification to an installed app only when the worker that shows it is registered inside that app’s own scope, so the worker now registers at the door’s scope through app/src/lib/sw-door-scope.js. The lesson below stands either way.) The navigation handler is network-first, which is correct, and its offline fallback reached for the shell belonging to the WRONG door. When that entry did not exist, the fallback resolved to nothing at all - and responding to a navigation with nothing IS a network error, which the browser renders as a dead page. On a mobile connection, one transient failure was enough to trigger it.

READ THAT AGAIN, BECAUSE IT IS THE GENERALISABLE PART: A FALLBACK THAT CAN RESOLVE TO NOTHING IS NOT A FALLBACK. It is a second, quieter failure path that only opens when the first one has already failed - that is, always at the worst moment, and never in testing.

THE FIX THAT IS ON THE MAIN BRANCH TODAY, by its real names. DOOR_PATHS lists every installable door; FACE_SHELLS is every door’s shell except the base one; shellPathFor resolves a URL to ITS OWN door’s shell; and offlineShellFor walks a chain that cannot end in nothing - this door’s shell, then the base shell, then a real generated offline page with a plain sentence on it. The comment above that chain states the guarantee in the code itself: a real Response, never undefined.

AND THE SECOND HALF OF THE FIX WAS NOT CODE. The health check only ever measured ONE of the doors. The door the congregation actually taps had no watcher of its own, so it could be dark indefinitely while the dashboard was green. It now probes every installable door and fails when one does not serve a shell carrying its mount point. THE GAP WAS NEVER IN THE ALERTING - IT WAS IN WHAT WAS BEING WATCHED.

FOUR THINGS TO TAKE, AND THEY OUTLIVE THIS PARTICULAR BUG:

ONE - A HEALTHY PIPELINE IS NOT A HEALTHY PRODUCT. Every safeguard here watched the build and the deploy. None of them made a request to the thing a person opens.

TWO - A PROBE THAT CANNOT REPRODUCE THE STATE CANNOT SEE THE BUG. Fresh-browser checks are blind by construction to anything requiring installed state. Ask of every probe: what state does the real user have that this probe does not?

THREE - WATCH EVERY DOOR, NOT THE ONE YOU BUILT FIRST. The unwatched door is always the one that goes dark, because nothing was ever going to tell you.

FOUR - UNKNOWN MUST NEVER READ AS HEALTHY. A check that cannot determine freshness must report unknown, never fresh. Every dashboard that has ever lied did it by defaulting an unknown to good.

AND THE WORD HAS THE PRUDENCE AND THE INSTRUMENTS. "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished." (Proverbs 22:3) - and the reason to look with something other than inference: "The hearing ear, and the seeing eye, the LORD hath made even both of them." (Proverbs 20:12). He made the eye. A dashboard is a manufactured eye, and a manufactured eye can be pointed at the wrong thing while remaining perfectly functional - which is exactly what happened here.

AND THE SENTENCE THAT KEEPS A BUILDER FROM DESPAIRING OVER THIS is the second half of the verse this course opened with - "except the LORD keep the city, the watchman waketh but in vain." (Psalms 127:1). Build the watch. Point it at the real door. And do not mistake your watch for the thing that actually keeps the city.`,
    inApp: 'Open your own monitoring and ask one question of each check: what state does a real user have that this probe does not? Write the answers. The gaps are the outages you have not had yet.',
    benefits: [
      'A real outage, 2026-08-30: the installed church app dead with a network error while the health check reported UP and FRESH - both true at once.',
      'Why both were true: a fresh browser has NO service worker, so the probe was blind by construction to a bug that needs installed state.',
      'The mechanism read out of the running code: one worker at the root scope, a BASE naming one door, and an offline fallback that could resolve to nothing.',
      'The generalisable rule - A FALLBACK THAT CAN RESOLVE TO NOTHING IS NOT A FALLBACK, it is a quieter failure path that only opens at the worst moment.',
      'The real fix by its real names on main: DOOR_PATHS, FACE_SHELLS, shellPathFor and offlineShellFor, whose chain cannot end in nothing.',
      'The second half of the fix was NOT code: the door the congregation taps had no watcher at all, so the gap was in what was watched, not in the alerting.',
      'Four durable takings: a healthy pipeline is not a healthy product; a probe that cannot reproduce the state cannot see the bug; watch every door; and unknown must never read as healthy.',
      'Proverbs 20:12 - He made the eye, and a manufactured eye can be perfectly functional while pointed at the wrong thing.',
    ],
    levels: {},
    readOptionsAloud: true,
    quiz: {
      questions: [
        {
          q: 'How could the health check report UP while installed phones were dark?',
          options: [
            'A fresh browser has no service worker installed, and the bug only ran on devices that did',
            'The health check was misconfigured',
            'The site was genuinely fine and the report was wrong',
          ],
          answer: 0,
          explain: 'Both observations were true. The defect lived in code that only runs once the application is installed - that is, on the devices of the people who use it most.',
        },
        {
          q: 'What is wrong with an offline fallback that can resolve to nothing?',
          options: [
            'It is not a fallback - it is a quieter failure path that opens only at the worst moment',
            'It is slower than a real response',
            'Nothing, as long as the network usually works',
          ],
          answer: 0,
          explain: 'Responding to a navigation with nothing IS a network error. And it only ever triggers after the first failure, so it never appears in testing.',
        },
        {
          q: 'Where was the real gap in the monitoring?',
          options: [
            'In WHAT was being watched - the door the congregation taps had no watcher at all',
            'In the alerting thresholds',
            'In how often the check ran',
          ],
          answer: 0,
          explain: 'Every safeguard watched the build and the deploy. None made a request to the door a person actually opens.',
        },
        {
          q: 'How must a check report when it cannot determine freshness?',
          options: [
            'Unknown - never fresh',
            'Fresh, until proven otherwise',
            'It should skip the check',
          ],
          answer: 0,
          explain: 'Every dashboard that has ever lied did it by defaulting an unknown to good.',
        },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Both observations were true at once - that is the hardest class of failure.',
        'A fresh browser has no worker, so the probe was blind by construction.',
        'One worker at root scope, a BASE naming one door, a fallback that could resolve to nothing.',
        'A fallback that can resolve to nothing is not a fallback.',
        'The real names on main: DOOR_PATHS, FACE_SHELLS, shellPathFor, offlineShellFor.',
        'Half the fix was not code - the front door had no watcher.',
        'Pipeline health is not product health. Watch every door. Unknown is never fresh.',
        'Proverbs 20:12 - a manufactured eye can work perfectly and point at the wrong thing.',
      ],
      discussionPrompts: [
        'What state does your real user have that your monitoring does not? Name one.',
        'Which of your entry points has no watcher of its own? Why that one?',
        'Find a place where your system defaults an unknown to good. What would it cost to make it report unknown?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'dev7-shrink-only-debt-telling-the-truth-about-what-is-not-fixed',
    title: 'Shrink-Only Debt — Telling the Truth About What Is Not Fixed Yet',
    bigIdea: 'WHEN A PROBLEM IS TOO LARGE TO FIX TODAY, MEASURE IT, WRITE THE REAL NUMBER DOWN, AND MAKE THE BUILD FAIL IF IT EVER GROWS - WHICH IS HONEST WITHOUT BEING PARALYSED',
    anchor: {
      ref: 'Proverbs 4:26; Luke 16:10; Proverbs 27:23',
      theme: 'KJV: "Ponder the path of thy feet, and let all thy ways be established." (Proverbs 4:26)',
    },
    lesson: `EVERY REAL SYSTEM HAS A PROBLEM TOO BIG TO FIX THIS WEEK. The usual two answers are both bad. Declaring it fixed when it is not is a lie that gets believed. Declaring it unfixable is a lie that gets accepted. There is a third answer, and this platform uses it in several places: MEASURE THE PROBLEM, COMMIT THE REAL NUMBER, AND FORBID IT FROM GROWING.

HOW A RATCHET WORKS, CONCRETELY. A script measures the property across the whole system and produces a list of every place it fails. That list is committed as data - a baseline file in the repository. A test compares the live measurement against the committed baseline. A NEW failure that is not in the baseline FAILS THE BUILD. An entry that has been fixed is reported so it can be removed deliberately. The list may only shrink.

THREE OF THESE ARE LIVE IN THIS REPOSITORY AND YOU CAN READ THEM. app/src/lib/full-levels-baseline.json records which lesson versions are shorter than the message they claim to carry. app/src/lib/reading-level-baseline.json records which lessons read harder for a child than for a teenager. app/src/lib/title-in-narrative-baseline.json records which versions never name their own lesson near the start. None of those problems was solved the day it was found. All three are now impossible to worsen.

WHY THIS IS BETTER THAN A TICKET. A ticket describes a problem. A BASELINE MEASURES IT, and then defends the measurement. Tickets rot silently because nothing is watching them; a baseline cannot rot, because the build reads it on every push and complains the moment reality and the record disagree.

AND WHAT MAKES A RATCHET HONEST RATHER THAN A HIDING PLACE - because a baseline CAN be abused, and this is the part to get right:

THE PROXY MUST BE NAMED. Say exactly what is being measured and what that measurement cannot see. If "carries the full message" cannot be machine-read but word count can, say so plainly and say what a passing entry might still get wrong.

THE NUMBER MUST BE REAL AND MEASURED, never estimated to look manageable.

AN ENTRY IS DEBT TO BE READ, NOT A LIST TO CLEAR MECHANICALLY. A measurement of this kind reports DIFFERENCE, not absence: something may fail the measure while being perfectly correct in a form the measure cannot recognise. Clearing entries without reading them is how a gate meant to protect good work ends up overwriting it.

AND WHEN THE BASELINE MOVES, IT MOVES WITH ITS REASON ATTACHED. A pinned number that changes silently is worthless. In this repository one such pin was moved the same day this course was written, and the reason - a genuinely new course entering the catalogue - is written into the test beside the number, along with what the pin still protects.

NOW THE WORD. "Ponder the path of thy feet, and let all thy ways be established." (Proverbs 4:26). PONDER THE PATH - look at where you actually are, deliberately - and THEN the ways are established. Establishing comes second. A baseline is that verse as engineering: an honest look at the real position, which is what makes a stable position possible.

AND THE PRINCIPLE THAT DECIDES WHETHER A SMALL ENTRY MATTERS. "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much." (Luke 16:10). The temptation with a baseline is to leave the small entries forever because nothing breaks. That verse says the small entries are the measure of the whole thing.

AND THE DUTY TO KNOW YOUR OWN HOLDINGS: "Be thou diligent to know the state of thy flocks, and look well to thy herds." (Proverbs 27:23). A baseline is the state of the flock, written down. You cannot be diligent to know something you have never counted.

THE ONE THING A RATCHET MUST NEVER BECOME. A comfortable place to keep a problem. Every entry is a debt with a real cost to somebody, and the list shrinking is the point. If a baseline has not moved in months, that is a finding about the team, not about the baseline.`,
    inApp: 'Pick a problem in your system that is too big to fix this week. Measure it, write the real number and the list into a committed file, and add a check that fails if the list grows. You will have made it honest and un-worsenable in an afternoon.',
    benefits: [
      'The third answer between lying that it is fixed and lying that it is unfixable: measure it, commit the real number, forbid growth.',
      'How a ratchet works: a measured list committed as data, a test comparing live measurement against it, a NEW failure breaking the build, healed entries reported for deliberate removal.',
      'Three live examples you can read in this repository - the full-levels, reading-level and title-in-narrative baselines.',
      'Why this beats a ticket: a ticket describes a problem, a baseline MEASURES it and then defends the measurement, and cannot rot silently.',
      'What keeps it honest: name the proxy and its blind spots, use a real measured number, and treat entries as debt to be READ.',
      'A measurement of this kind reports DIFFERENCE, not absence - clearing entries mechanically is how a protective gate overwrites good work.',
      'And when a pin moves it moves WITH ITS REASON attached, beside the number, along with what it still protects.',
      'Proverbs 4:26 as engineering: ponder the path FIRST, and establishing follows. Luke 16:10 on why the small entries are the measure. Proverbs 27:23 - a baseline is the state of the flock, written down.',
    ],
    levels: {},
    readOptionsAloud: true,
    quiz: {
      questions: [
        {
          q: 'What makes a ratchet better than a ticket?',
          options: [
            'A baseline measures the problem and defends the measurement on every push',
            'A baseline is quicker to write',
            'A baseline assigns the work to someone',
          ],
          answer: 0,
          explain: 'Tickets rot silently because nothing watches them. A baseline cannot rot - the build reads it and complains the moment reality and the record disagree.',
        },
        {
          q: 'What does a measurement of this kind actually report?',
          options: [
            'DIFFERENCE, not absence - something may fail the measure while being perfectly correct in a form it cannot recognise',
            'Exactly which entries are wrong',
            'Only genuine defects',
          ],
          answer: 0,
          explain: 'Which is why entries are debt to be READ. Clearing them mechanically is how a gate meant to protect good work ends up overwriting it.',
        },
        {
          q: 'What must happen when a pinned number in a test is changed?',
          options: [
            'The reason goes in beside it, along with what the pin still protects',
            'Nothing - the new number speaks for itself',
            'The test should be deleted',
          ],
          answer: 0,
          explain: 'A pin that moves silently is worthless. One in this repository moved the day this course was written, with its reason written in beside the number.',
        },
        {
          q: 'What should a baseline never become?',
          options: [
            'A comfortable place to keep a problem',
            'A public document',
            'A machine-checked file',
          ],
          answer: 0,
          explain: 'Every entry is a debt with a real cost to somebody. If a baseline has not moved in months, that is a finding about the team, not the baseline.',
        },
      ],
    },
    facilitator: {
      talkingPoints: [
        'Two bad answers - falsely fixed, falsely unfixable - and the third: measure, commit, forbid growth.',
        'The mechanism: measured list as data, live comparison, new failures break the build, healed entries reported.',
        'Three live baselines in this repo, readable by path.',
        'A ticket describes; a baseline measures and defends. Tickets rot, baselines cannot.',
        'Name the proxy and its blind spots, or the baseline becomes a hiding place.',
        'It reports DIFFERENCE, not absence - so entries are read, never cleared mechanically.',
        'A pin moves with its reason attached.',
        'Proverbs 4:26 - ponder first, established second. Luke 16:10 - the small entries are the measure.',
      ],
      discussionPrompts: [
        'What problem in your system is currently described by a ticket nobody reads? What would measuring it look like?',
        'Do you have a pinned number whose reason nobody remembers? What was it protecting?',
        'Has any of your recorded debt shrunk in the last three months? If not, what does that say?',
      ],
    },
  },
  // ---------------------------------------------------------------------------
  {
    id: 'dev8-write-the-vision-and-make-it-plain',
    title: 'Write the Vision and Make It Plain — The Record That Lets the Next Person Run',
    bigIdea: 'A DECISION THAT LIVES ONLY IN SOMEBODY’S HEAD IS A DECISION THE NEXT PERSON WILL UNKNOWINGLY REVERSE, AND THE WORD ALREADY GAVE THE REASON FOR WRITING IT DOWN - THAT HE MAY RUN THAT READETH IT',
    anchor: {
      ref: 'Habakkuk 2:2; 1 Chronicles 28:19; Ecclesiastes 4:9',
      theme: 'KJV: "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it." (Habakkuk 2:2)',
    },
    lesson: `THE LAST LESSON, AND IT IS THE ONE THAT MAKES THE OTHER SEVEN SURVIVE A CHANGE OF HANDS. Everything this course has taught - the trace, the plumbline, the proven break, the battlement, the ratchet - is a DECISION somebody made. And a decision that lives only in a person’s head is not a decision; it is a habit that will be reversed by the next competent person to touch the system, who will have excellent reasons and no way to know.

SO THIS PLATFORM KEEPS AN APPEND-ONLY RECORD OF ITS DECISIONS, and the conventions are worth copying exactly, because each one was arrived at by getting it wrong first:

ONE DECISION PER FILE. Not a document of decisions. One file, one decision, its own name, findable by what it decided.

A NEW DIRECTIVE IS A NEW RECORD, NEVER A REWRITE OF THE OLD ONE. This is the load-bearing rule. Editing yesterday’s decision to match today’s destroys the only thing the record was for - knowing what was believed WHEN, and why it changed. The superseded record stays exactly as written, and the new one says what it supersedes.

AN INDEX THAT IS THE SOURCE OF TRUTH for what has been decided, so nobody has to read every file to find out whether a question is already settled.

EVERY RECORD CARRIES ITS GROUNDS AND ITS LIMITS. The grounds are what it was decided against. THE LIMITS ARE THE PART PEOPLE SKIP AND THE PART THAT MATTERS MOST: what this decision did NOT do, what was not verified, and the date it should be looked at again. A record with no limits is an advertisement.

AND THE WORD GAVE BOTH THE COMMAND AND THE PURPOSE, IN ONE VERSE. "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it." (Habakkuk 2:2). Three things in a single sentence, and the third is the reason for the first two. WRITE it - not remember it. MAKE IT PLAIN - a record only its author can decode is not written down in any useful sense. AND THAT HE MAY RUN THAT READETH IT - the purpose is not archival, it is SPEED. The reader is supposed to move faster because the record exists. A decision record that slows the next person down has failed on its own stated purpose.

AND THE PATTERN WAS WRITTEN DOWN TOO, FOR THE MOST IMPORTANT BUILD IN THE OLD TESTAMENT. "All this, said David, the LORD made me understand in writing by his hand upon me, even all the works of this pattern." (1 Chronicles 28:19). IN WRITING. The plan for the temple was handed over as a written pattern rather than as an inspired feeling to be recalled, and it was handed to a DIFFERENT BUILDER than the man who received it. That is the whole case for documentation: the person who receives the vision is frequently not the person who builds it, and speech does not survive the handover.

AND THE CRAFTSMAN WAS GIVEN HIS SKILL ON PURPOSE, WHICH IS WORTH KNOWING IF YOU BUILD THINGS FOR A LIVING. "And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship" (Exodus 31:3) - and it is specific, physical work: "And in cutting of stones, to set them, and in carving of timber, to work in all manner of workmanship." (Exodus 31:5). Technical skill is named as a filling of His Spirit, in the same breath as wisdom and understanding. Engineering is not a lesser calling that faith tolerates.

AND WHY THIS IS NOT A SOLO DISCIPLINE. "Two are better than one; because they have a good reward for their labour." (Ecclesiastes 4:9); "And if one prevail against him, two shall withstand him; and a threefold cord is not quickly broken." (Ecclesiastes 4:12). A THREEFOLD CORD. Three strands is the picture: the builder, the reviewer, and the RECORD - and that third strand is the one that holds when both people are gone.

AND THE BUILDERS WHO HAD TO DO TWO THINGS AT ONCE, which is what maintaining a live system while extending it actually feels like: "They which builded on the wall, and they that bare burdens, with those that laded, every one with one of his hands wrought in the work, and with the other hand held a weapon." (Nehemiah 4:17). "For the builders, every one had his sword girded by his side, and so builded." (Nehemiah 4:18). ONE HAND IN THE WORK, THE OTHER HOLDING A WEAPON. Nobody got to choose between building and defending. The trace, the gates and the records ARE the sword hand - and the verse’s point is that the wall still went up.

SO THE WHOLE COURSE IN ONE LINE: build it on the rock, count the cost, look before you answer, measure rather than claim, prove the check catches, rail the roof and cover the pit, write the debt down honestly, and record the decision plainly so the next person can run. And over all of it: "Except the LORD build the house, they labour in vain that build it" (Psalms 127:1).`,
    inApp: 'Write down one decision you have made about your system that exists nowhere but in your head. One file, what you decided, what you decided it against, and what it does NOT cover. That last part is the valuable one.',
    benefits: [
      'Why records exist: a decision living only in someone’s head will be reversed by the next competent person, who will have good reasons and no way to know.',
      'One decision per file, findable by what it decided - not a document of decisions.',
      'The load-bearing rule: a new directive is a NEW record, never a rewrite, because rewriting destroys the knowledge of what was believed when and why it changed.',
      'An index as the source of truth, so nobody reads every file to learn whether a question is settled.',
      'Grounds AND LIMITS on every record - what it did not do, what was not verified, and when to look again. A record with no limits is an advertisement.',
      'Habakkuk 2:2 giving the command and the purpose together: write it, make it PLAIN, and the purpose is SPEED - that he may run that readeth it.',
      '1 Chronicles 28:19 - the temple pattern handed over IN WRITING, to a different builder than the man who received it.',
      'Exodus 31:3-5 - technical skill named as a filling of His Spirit, alongside wisdom and understanding. Engineering is not a lesser calling.',
      'Ecclesiastes 4:9-12 - the threefold cord as builder, reviewer and RECORD, the third strand holding when both people are gone.',
      'Nehemiah 4:17-18 - one hand in the work, the other holding a weapon, and the wall still went up.',
    ],
    levels: {},
    readOptionsAloud: true,
    quiz: {
      questions: [
        {
          q: 'According to Habakkuk 2:2, what is the PURPOSE of writing the vision plainly?',
          options: [
            'That he may run that readeth it - the purpose is speed, not archiving',
            'So it is not forgotten',
            'So the author is credited',
          ],
          answer: 0,
          explain: 'The reader is supposed to move FASTER because the record exists. A decision record that slows the next person down has failed on its own stated purpose.',
        },
        {
          q: 'Why must a new directive be a NEW record rather than a rewrite of the old one?',
          options: [
            'Because rewriting destroys the knowledge of what was believed when, and why it changed',
            'Because old files should never be edited',
            'Because it is faster to write a new file',
          ],
          answer: 0,
          explain: 'The superseded record stays exactly as written, and the new one says what it supersedes. That history IS the value.',
        },
        {
          q: 'What does 1 Chronicles 28:19 show about how the temple pattern was handed over?',
          options: [
            'IN WRITING - and to a different builder than the man who received it',
            'By spoken instruction',
            'By memory alone',
          ],
          answer: 0,
          explain: 'The person who receives a vision is frequently not the person who builds it, and speech does not survive the handover.',
        },
        {
          q: 'In this lesson’s reading of Ecclesiastes 4:12, what are the three strands?',
          options: [
            'The builder, the reviewer, and the RECORD',
            'Planning, building, and testing',
            'Three developers',
          ],
          answer: 0,
          explain: 'The record is the strand that holds when both people are gone - which is exactly when it is needed.',
        },
      ],
    },
    facilitator: {
      talkingPoints: [
        'A decision only in someone’s head will be reversed by a competent person with no way to know.',
        'One decision per file; a new directive is a NEW record, never a rewrite.',
        'An index as the source of truth for what is settled.',
        'Grounds and LIMITS - a record with no limits is an advertisement.',
        'Habakkuk 2:2 - write, make plain, and the purpose is that the reader RUNS.',
        '1 Chronicles 28:19 - the pattern handed over in writing, to another builder.',
        'Exodus 31:3-5 - workmanship as a filling of His Spirit.',
        'Ecclesiastes 4:12 - builder, reviewer, record: the threefold cord.',
        'Nehemiah 4:17-18 - one hand working, one hand armed, and the wall still went up.',
      ],
      discussionPrompts: [
        'Name a decision about your system that exists nowhere but in your head. What would the next person do instead?',
        'Find a document you have rewritten rather than superseded. What knowledge did that erase?',
        'When did a record last make you FASTER? If never, what is wrong with how yours are written?',
      ],
    },
  },
];

export const DEVELOPMENT_META = {
  key: 'development',
  title: 'Development — Building Systems That Tell the Truth',
  audience: 'builders of any level, and anyone responsible for something that has to keep working when nobody is looking',
  tagline: 'Every lesson is taught from an artifact that exists in this platform, named by path, and every incident in it really happened.',
  format: 'Self-paced · read aloud by the app · real files and real incidents cited · the Word above the craft',
  cadenceDays: 3,
  programLevel: 'Development',
  weeks: DEVELOPMENT_MODULES.length,
  // Word-first lead (DR-0127): the frame a builder meets before any technique.
  wordFirst: {
    ref: 'Psalms 127:1; Amos 7:8; Habakkuk 2:2',
    frame: 'Except the LORD build the house, they labour in vain that build it - and except He keep the city, the watchman waketh but in vain, which is said of the watching as much as the building. So the craft here is held under Him: He asks what seest thou and holds the plumbline Himself, and He gave the reason for writing anything down, that he may run that readeth it.',
  },
};

export const DEVELOPMENT_SESSION_FLOW = [
  { title: 'The Word above the craft', minutes: 8, detail: 'The verses the lesson stands on, read first and read whole.' },
  { title: 'The real artifact', minutes: 14, detail: 'The file, the incident or the record in this platform, named by path.' },
  { title: 'The generalisable rule', minutes: 10, detail: 'What to carry into a system that is nothing like this one.' },
  { title: 'In your own system', minutes: 8, detail: 'One thing to measure or write down before the week is out.' },
];

export const DEVELOPMENT_SESSION_MINUTES = DEVELOPMENT_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const DEVELOPMENT_INTEREST_TAG = '[Development interest]';
export const DEVELOPMENT_HELPER_TAG = '[Development helper]';

export function resolveDevelopmentCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, DEVELOPMENT_CONFIRMED_COHORT, DEVELOPMENT_PROPOSED_COHORT_START);
}

export function buildDevelopmentSchedule() {
  return DEVELOPMENT_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null }));
}

export function developmentProgressSummary(progress = {}) {
  return progressSummaryFor(DEVELOPMENT_MODULES, progress);
}

export function exportDevelopmentCurriculumMarkdown() {
  return exportCurriculumMarkdownFor({
    meta: DEVELOPMENT_META,
    modules: DEVELOPMENT_MODULES,
    sessionFlow: DEVELOPMENT_SESSION_FLOW,
    unitCap: 'Lesson',
  });
}

export const DEVELOPMENT_TUTOR_META = {
  key: 'development',
  title: DEVELOPMENT_META.title,
  subject: 'building software and systems that tell the truth, taught from this platform own construction, Word first',
};
