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
    levels: { child: 'Except the LORD build the house! This lesson is about building, and about counting the cost before you start. Here is the verse the whole class stands on. "Except the LORD build the house, they labour in vain that build it" (Psalms 127:1). In vain means for nothing. If Yahweh is not the one building, our work does not last. The verse says one more thing. A watchman is a person who keeps guard. Even the watching needs Yahweh. So we build, and we watch, and we trust Him with both. Jesus told a story about a man who wanted to build a tower. First he should sit down and count. Do I have enough to finish? The man in the story did not count. He made the bottom part. Then he ran out. People walked by and laughed. They said, this man began to build, and was not able to finish. The tower was not a bad idea. He just started a thing he could not finish. When you build a computer program, ask three questions first. One. Who will take care of it when I am busy? Two. How will we know if it breaks? Three. What will it cost to keep it going? The Word gives an order for building. Wisdom builds the house. Understanding makes it stand. Knowledge fills the rooms. First make it strong, then fill it up. Jesus told of two men. One built on rock. One built on sand. The rain came. The house on sand fell down. Both men heard Jesus. Only one did what He said. That is the difference. Paul said another person will build on top of your work. So build with care. One day the fire will test it. Yahweh is the first builder. He made the earth. He held the measuring line. We borrow His tools. Now you try. Build a tower of blocks. Before you start, count. Do you have enough blocks to finish?', youth: 'Except the LORD build the house is where this course begins, and the lesson adds a second idea beside it: counting the cost before you start. Here is the verse everything else is measured by: "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain." (Psalms 127:1). Builders often skip the second half. It is not only the building that depends on Yahweh. It is the watching too. You can write good code and watch it carefully and still watch in vain if He is not keeping the city. That is not a reason to stop watching. This course is about watching well. It is a reminder of who the watch depends on. Then comes a very practical parable. "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). The man who did not count laid a foundation and could not finish, and people said, "This man began to build, and was not able to finish." (Luke 14:30). Look at what went wrong. The tower was not a bad idea, and he was not unskilled. He laid a foundation he could not build on. Every half-finished system is that tower. So counting the cost of a program means three questions before the first line. Who keeps it running when I am busy? What tells us when it breaks? What does it cost to keep going, in money, attention and computer power? The Word also gives an order: a house is built by wisdom, established by understanding, and filled by knowledge (Proverbs 24:3-4). Most software fails because it was filled before it was made to stand. Jesus told of the wise man who built on the rock and the foolish man who built on sand. Both heard. Only one did. The difference was doing, like the difference between knowing tests matter and having tests. Paul warned that "another buildeth thereon" (1 Corinthians 3:10), and that the fire "shall try every man’s work of what sort it is." (1 Corinthians 3:13). Real use is that fire: heavy load, failures, and the thing nobody expected. It shows what sort your work really was, not what sort you said it was. The same two words from Proverbs 24 show up again when the Word talks about the earth itself, founded by wisdom and established by understanding. And when Job needed to be humbled, Yahweh asked him an engineering question about who laid the measures of the earth. And Yahweh is the first engineer. He laid the foundations of the earth and "stretched the line upon it" (Job 38:5). We are borrowing His tools.', teen: 'Except the LORD build the house is the sentence this whole course is measured by, and this first lesson pairs it with the discipline of counting the cost before you start. "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain." (Psalms 127:1). Read the second half slowly, because builders tend to skip it. The verse is not only about building; it is about watching. You can ship solid code, monitor it faithfully, and still be watching in vain if He is not the one keeping the city. That does not excuse careless watching, since this course is about watching properly. It tells you who the watch finally depends on. Then Jesus gives the most practical parable for anyone who builds: "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). The unfinished builder hears the verdict, "This man began to build, and was not able to finish." (Luke 14:30). The failure was not the idea or a lack of skill. He laid a foundation he could not build on. Every half-migrated schema, forgotten feature flag, or integration that works for one case is that man\'s tower, and the mockery is just the natural reaction of everyone who has to walk past it. For a system, counting the cost is not an hours estimate. It is three questions answered before the first line. Who maintains this when I am busy? What tells us when it breaks, because "somebody will notice" is not an answer? What does it cost to keep running, in money, in attention, and in compute nobody is watching? The Word gives an order: built by wisdom, established by understanding, filled by knowledge (Proverbs 24:3-4). Most software failure is a house filled before it was established. The two builders in Matthew 7 both heard; only one did, and the house on the sand fell. The difference is not information but doing. Paul adds that "another buildeth thereon" (1 Corinthians 3:10), and that the fire "shall try every man’s work of what sort it is." (1 Corinthians 3:13); production reveals what your work was, not what you said it was. And Yahweh is the original engineer, who "stretched the line upon it" (Job 38:5). He holds a measuring line in that verse, and the same pair of words from Proverbs 24 describes His own work, the earth founded by wisdom and the heavens established by understanding (Proverbs 3:19). When Job needed to be put in his place, Yahweh asked him an engineering question. The plumbline of lesson 3 is not our invention. We are borrowing His tool.', senior: 'Except the LORD build the house is the governing sentence of this course, and the first lesson joins it to a second discipline, counting the cost before any work begins. The psalm reads in full: "Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain." (Psalms 127:1). Experienced builders tend to pass over the second clause, yet it is the one most relevant to systems that must be maintained. The dependence on Yahweh extends beyond construction to vigilance. Code may be well written and faithfully monitored and still be watched in vain if He is not keeping the city. This is not an argument against diligent monitoring, which the rest of the course teaches; it is a statement about the One on whom every watch finally rests. The parable Jesus gave is the most practical text in Scripture for anyone who builds: "For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?" (Luke 14:28). The builder who did not count hears the observers say, "This man began to build, and was not able to finish." (Luke 14:30). His failure was neither a poor idea nor a lack of skill; he laid a foundation he could not complete. Every inherited half-built system, the unfinished migration, the forgotten flag, the integration that serves a single case, is that tower. For a system, counting the cost is not an estimate of hours but three questions settled before the first line is written: who will maintain it when its author is occupied, what will signal its failure, and what it will cost to keep running in money, attention and unobserved computation. The Word also sets an order: a house is built by wisdom, established by understanding, and furnished by knowledge (Proverbs 24:3-4), and most failed software is a house furnished before it was established. The wise and foolish builders of Matthew 7 both heard; only one acted, and the house on the sand fell greatly. Paul reminds every craftsman that "another buildeth thereon" (1 Corinthians 3:10), and that the fire "shall try every man’s work of what sort it is." (1 Corinthians 3:13). Production is a small picture of that fire. Above all, Yahweh is the first Engineer, who laid the foundations of the earth and "stretched the line upon it" (Job 38:5); the same pairing of wisdom and understanding that Proverbs 24 applies to a house is applied in Proverbs 3:19 to the founding of the earth and the establishing of the heavens. When Job needed to be humbled, the question put to him was an engineering question, and the plumbline taught in lesson 3 is not our invention; it is borrowed from Him.' },
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
    levels: { child: 'Name the real record and the real screen! This lesson is about a check we do before we write any code. It started with three mistakes on one day. A picture button was put in the wrong place. A progress board showed numbers that were not real. And a fix was planned for the wrong thing. Why did it happen? The builders guessed. They did not go and look. So now there are four steps we do first, every time. Step one. Name the real data. Where does this number come from? If it is a made-up number, it cannot go in the app. A made-up number is worse than no number. It looks true, but it is not. Step two. Make sure it really works, in the real app, not a pretend one. Step three. Look at the screen the person really uses. Do not guess which screen it is. Step four. Write down what you think is true before you start. If you are wrong, it only costs one sentence to fix. The Word says, "He that answereth a matter before he heareth it, it is folly and shame unto him." (Proverbs 18:13). That means do not answer before you listen. It also says the wise man looks where he is going. Not just thinks. Looks! This class used these steps while it was being written. It caught a real mistake. A lesson was going to use names that were not in the code. Four minutes of looking fixed it. Yahweh made our eyes and our ears. "The hearing ear, and the seeing eye, the LORD hath made even both of them." (Proverbs 20:12). So we use them. A screen in the app should show what is really happening. If the screen and the real data are not connected yet, connecting them is the job. Drawing the screen first and hooking it up later is how fake numbers sneak in. A drawn screen looks finished, even when it is not. Now you try. Before you tell someone how many cookies are in the jar, go look in the jar.', youth: 'Name the real record and the real screen: this lesson is the trace that runs before any code is written, and it exists because of three mistakes in one day. On 2026-06-13 this platform put an image upload in the wrong component, built a progress board that showed static numbers and could not flag its own missed targets, and then proposed a fix based on a wrong premise, because the board was platform data, not the user\'s projects. The cause was not careless code. Each screen was built as a display over whatever data was nearest. So now a four-step trace runs first, out loud. One: name the real data. Which record, table or feed does this screen read and write? If a number on the screen cannot be traced to a real row, a real run or a real timestamp, it does not ship. A painted number, like a hardcoded sixty percent, is worse than nothing, because a plausible number looks exactly like a true one. Two: confirm it connects end to end in the live system, signed in, not the demo and not the sample data. Three: confirm which screen the user actually uses by looking at it, with a screenshot or the running app. Two of the three misses would have died right here. Four: write the premise down first. A wrong premise caught in a sentence costs a sentence. Caught after a merged change, it costs the change, the undo, and some trust. The Word named this long ago: "He that answereth a matter before he heareth it, it is folly and shame unto him." (Proverbs 18:13). And: "The simple believeth every word: but the prudent man looketh well to his going." (Proverbs 14:15). Looks, not just thinks. This course caught a real error by following the rule. Lesson 6 was about to teach names from a pull request that had not merged, and reading the actual file fixed it in four minutes. Looking is not optional, because "The hearing ear, and the seeing eye, the LORD hath made even both of them." (Proverbs 20:12). The big principle is this: a screen is a live view of real system state and often a control for it. When a screen and its data do not connect yet, that gap is the work, not polish for later. Drawing the screen first and wiring it later is how painted numbers get shipped every time, because a drawn screen looks finished even when nothing real is behind it. Doing the trace first is slower for a minute and much faster over the life of the thing.', teen: 'Name the real record and the real screen before you code: this lesson teaches the trace that runs before any user-facing work, and it exists because of three misses in a single day. On 2026-06-13 this platform shipped an image upload into the wrong component, a progress board that displayed static numbers and could not flag its own missed targets, and then a proposed fix that rested on a premise error, since the board held platform data, not the user\'s projects. The common cause was not sloppy code. It was treating each surface as a display layer over whatever data happened to be nearest, and the record sits in this repository\'s lessons-learned document. So the trace runs first, out loud, in four steps. First, name the real data: which record, table or feed does this surface read and write? If a displayed value cannot be traced to a real row, run or timestamp, it does not ship. A painted number, a hardcoded sixty percent or an invented list, is worse than nothing on a surface whose value is trust, and it is the easiest step to fake because a plausible number looks like a true one. Second, confirm it connects end to end in the live system, signed in, on the real instance, not the demo or seed path. Third, confirm the surface the user actually uses by observing it with a screenshot, a DOM read or the running app; two of the three misses die here. Fourth, write the premise down first, because a wrong premise caught in a sentence costs a sentence. Scripture named the defect: "He that answereth a matter before he heareth it, it is folly and shame unto him." (Proverbs 18:13). Answering before hearing is writing the fix before reading the system. And the companion: "The simple believeth every word: but the prudent man looketh well to his going." (Proverbs 14:15). The prudent man looks. This course obeyed the rule while being written and caught a real error: lesson 6 would have taught names from an unmerged pull request, and four minutes of reading the actual file prevented a lesson about verification that was itself unverified. Observation is not optional, because "The hearing ear, and the seeing eye, the LORD hath made even both of them." (Proverbs 20:12). The governing principle is the hard part: a surface is a live view of real state, usually a control for it, and when the two do not yet connect, that gap is the work.', senior: 'Name the real record and the real screen is the trace this platform runs before writing any user-facing code, and the lesson explains both the procedure and the failure that made it necessary. On 2026-06-13 three errors shipped in one day: an image upload placed in the wrong component, a progress board that displayed static figures and could not report its own missed targets, and a proposed repair that rested on a mistaken premise, because the board reflected platform data rather than the user\'s projects. None of these arose from careless coding. Each surface had been designed as a display over whatever data lay nearest, and the account is preserved in the repository\'s lessons-learned document. The trace that followed has four steps, performed aloud before any work begins. The first is to name the real data, the specific record, table or feed the surface reads and writes; a value that cannot be traced to a real row, run or timestamp is not shipped, because a fabricated figure on a surface whose purpose is trust does more harm than an empty one, and it is the step most easily counterfeited. The second is to confirm that the surface connects end to end in the live system, signed in and against the real instance, rather than on a demonstration path. The third is to confirm, by direct observation, which surface the user actually sees; two of the three errors would have been caught here. The fourth is to record the premise in writing before starting, since an error caught in a sentence costs a sentence, while the same error found after a merged change costs the change, its reversal and some measure of trust. Scripture identified the fault long ago: "He that answereth a matter before he heareth it, it is folly and shame unto him." (Proverbs 18:13). Its companion adds, "The simple believeth every word: but the prudent man looketh well to his going." (Proverbs 14:15), and the operative word is looking, not reasoning. The course applied its own rule while being written and caught a genuine error, a lesson about to cite names from an unmerged change; reading the actual file corrected it in minutes. Observation is a created gift: "The hearing ear, and the seeing eye, the LORD hath made even both of them." (Proverbs 20:12). The principle that governs it all is that a surface is a live view of real state and often a control for it, so an unconnected gap between them is the work itself.' },
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
    levels: { child: 'The Plumbline! This lesson says no claim without evidence, and it says to use gates instead of just saying so. A claim is when you say something is true. Evidence is how you show it. The danger is not work that looks wrong. We see that and fix it. The danger is work that looks right but is wrong. Here is a true story from this app. Someone wrote that a screen was easy to read. But when it was measured, it was hard to read. The words were not a lie on purpose. They were just a guess where a check should have been. So this house has a rule. No claim without evidence. It works. It is done. It passes. We do not take anyone\'s word for these. Not even our own. Show the proof. A gate is a check the computer runs by itself. If the work is wrong, the gate says no. You cannot talk a gate into saying yes. People can get tired or hurry. A gate does not. Here are four more rules. Measure it, do not guess it. Check how it works now before you change it. For big things, check two different ways. And if you did not check, say so. That is honest. Yahweh showed Amos a plumbline. A plumbline is a string with a weight on the end. It hangs straight down. You hold it by a wall to see if the wall is straight. "Amos, what seest thou? And I said, A plumbline." (Amos 7:8). What do you see? Not, what do you think? A plumbline does not argue. It just shows the truth. The Word says to test things and keep the good. "Prove all things; hold fast that which is good." (1 Thessalonians 5:21). Checks do not take the place of people. A person still decides what to do. The check just shows the truth, so the person can decide well. Now you try. Tie a small weight to a string. Hold it by a wall. Is the wall straight?', youth: 'The Plumbline is this lesson\'s picture for a simple rule: no claim without evidence, and gates instead of assurances. The threat is not code that looks wrong. It is work that looks right and is wrong. Two real examples from this platform: a comment said a screen met a contrast standard when the measured ratio was 2.92 to 1, and a change was described as keeping behavior the same when that behavior had never been pinned down. Nobody lied on purpose. Both were confident sentences standing where a measurement should have been. So this house has a short doctrine: no claim without evidence. It works, it is done, it passes, it is accessible, it is secure: none of these are accepted on anyone\'s word, not even the author\'s about their own work. Done means attached evidence, like a passing gate, a measured number from the real thing, a live screenshot, a real query result, or a test. Where a property can be checked by a machine, a check checks it and fails the build. Why? A gate cannot be talked past. A reviewer can be persuaded, tired, rushed, or friendly. A failing check does not care. Four rules follow. Measure, do not claim: numbers come from measuring the real thing. Characterize before you change: pin what the code actually does first. Use independent checks for anything high-stakes, because two readings of the same code share the same blind spot. And be honest about what you did not verify; saying I did not check this is a required answer, not a weakness. Now the Word, which gave us the tool. Yahweh stood on a wall "with a plumbline in his hand." (Amos 7:7), and asked, "Amos, what seest thou? And I said, A plumbline." (Amos 7:8). Not what do you think. What do you see. A plumbline reports. Isaiah says the line will sweep away "the refuge of lies" (Isaiah 28:17), and an unmeasured claim is exactly that kind of hiding place. The command is "Prove all things; hold fast that which is good." (1 Thessalonians 5:21). Prove, then hold fast. Proving without holding fast is cynicism; holding fast without proving is how the 2.92 ratio got called compliant. That is why the verse gives both commands together. Verification is not meant to become paperwork. It makes review cheaper, because evidence attached to a change lets the reviewer spend attention on judgment instead of on checking the basics. And it never removes the human: the machine reports the wall, and a person still decides what to do about the building.', teen: 'The Plumbline stands for this lesson\'s doctrine: no claim without evidence, and gates instead of assurances. The real threat is not code that looks wrong but work that looks right and is wrong. This platform has two examples on record: a comment claiming a screen met a contrast standard while the measured ratio was 2.92 to 1, and a refactor described as behavior-preserving whose behavior was never pinned. Neither was a deliberate lie. Each was a confident sentence occupying the place where a measurement belonged. So the rule is short. It works, it is done, it passes, it is accessible, it is secure: none of these are accepted on anyone\'s word, including the author\'s word about their own work. Done means attached evidence, such as a passing gate, a number measured on the real artifact, a live screenshot or DOM read, a real query result, or a test. And wherever a property can be machine-checked, a check checks it and fails the build. The reason is not distrust of people; it is that a gate cannot be talked past, while a reviewer can be persuaded, tired, hurried, or fond of you. Every defect class that once looked fine and was not becomes a new gate, so the same mistake cannot pass twice. Four rules follow, each earned by something that slipped through. Measure, do not claim. Characterize before you change, measuring improvement against verified reality rather than memory. Verify independently for high-stakes work, since two readings of the same code share one blind spot. Keep provenance and honest uncertainty: cite the file, the run or the query, and treat "I did not verify this" as a valid and required output. The Word supplied the instrument. Yahweh stood on a wall "with a plumbline in his hand." (Amos 7:7), and His question is the question a gate asks: "Amos, what seest thou? And I said, A plumbline." (Amos 7:8). A plumbline does not argue, does not care who built the wall, and cannot be persuaded; it reports. Isaiah says the line and plummet sweep away "the refuge of lies" (Isaiah 28:17). The standing instruction has two commands: "Prove all things; hold fast that which is good." (1 Thessalonians 5:21). Proving without holding fast is cynicism; holding fast without proving is credulity. And verification exists to make review cheaper, never to replace the person who decides. Evidence attached to a change lets the reviewer spend attention on judgment rather than on confirming basics, and the machine reports the wall while a person still decides about the building.', senior: 'The Plumbline is the image this lesson uses for a standing doctrine of the house, no claim without evidence, enforced wherever possible by gates rather than assurances. The danger it addresses is not code that visibly fails but work that appears correct and is not. Two instances from this platform\'s own history illustrate it: a comment asserting that an interface met a contrast standard while the measured ratio was 2.92 to 1, and a refactor described as preserving behavior whose behavior had never been pinned. Neither was a deliberate falsehood; each was a confident statement standing where a measurement belonged. The doctrine therefore declines to accept, on anyone\'s word, the claims that work functions, is complete, passes, is accessible or is secure, and that includes an author\'s claims about his own work. Completion means evidence attached: a passing gate, a figure measured on the real artifact, an observation of the live system, a real query result, or a test. Where a property can be checked by a machine, a check enforces it and fails the build. This reflects no suspicion of colleagues; it recognizes that a gate cannot be persuaded, whereas a reviewer may be weary, hurried or well disposed. Each defect that once passed unnoticed becomes a new gate, so that it cannot pass again. Four further rules follow, each learned from an error that got through: measure rather than assert; characterize existing behavior before altering it; confirm high-stakes work by an independent method, since two readings of the same code share one blind spot; and record provenance and uncertainty honestly, so that "I did not verify this" is treated as a legitimate and required statement. The Word supplied the instrument. Amos saw the Lord standing upon a wall "with a plumbline in his hand." (Amos 7:7), and was asked, "Amos, what seest thou? And I said, A plumbline." (Amos 7:8). The question is not what he thought of the wall but what he saw; the plumbline simply reports. Isaiah foretells that judgment laid to the line will sweep away "the refuge of lies" (Isaiah 28:17), which is what an unmeasured claim is. The standing charge contains two commands: "Prove all things; hold fast that which is good." (1 Thessalonians 5:21). To prove without holding fast is cynicism, and to hold fast without proving is credulity. Verification is meant to make review cheaper, and it never removes the person who judges.' },
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
    levels: { child: 'A gate that always passes is itself a lie. This lesson is about proving the check catches. A gate is a check the computer runs. Last time we said to use gates. But here is a trap. What if a gate always says yes, no matter what? Then it is not really checking. Everyone trusts it, but it is empty. That is worse than no gate at all. So here is the rule. Before we keep a new gate, we show that it can catch a mistake. We break the work on purpose. We run the check. We watch it say no. Then we fix the break. Now when it says yes, we know it means yes. Breaking things the right way takes care. Here are four rules. One. Make sure your break really happened. If you tried to change the words and nothing changed, the test is still green for the wrong reason. Two. Break it everywhere it lives. If the same thing is in three places and you only take it out of one, the other two keep it green. Three. Check the exact spot that matters, not the whole page. Four. Check the real thing, not a sticker that stands for it. The Word says, "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap." (Galatians 6:7). You cannot fool Yahweh. What you plant is what you get. A red test is like a kind teacher. It tells you what is wrong before anyone gets hurt. "Whoso loveth instruction loveth knowledge" (Proverbs 12:1). We also need friends to check us. "Iron sharpeneth iron" (Proverbs 27:17). A friend sees what we miss. So always ask this question. What would make my check fail? Can I try it? That question is better than asking, does my work work? Because you can actually try the answer. Now you try. Make a rule for a game, like no running. Then try to break it on purpose. Did anyone notice?', youth: 'A gate that always passes is itself a lie, and this lesson is about proving that a check really catches. The last lesson said to prefer gates to assurances. Here is the trap inside that advice. A test suite of a thousand checks, all green, that would pass no matter what the code did, is worse than having no suite. Everyone trusts it now, but the green is hollow. It costs nothing to keep and gives nothing back. So the rule is: a new gate ships only after it has been shown to catch. Do not just reason that it would catch the break. Put the break in, run the suite, and watch it turn red. Then undo the break and keep the check. The green afterwards means something, because you have seen the red. Breaking properly takes discipline, and there are four rules, each learned from a break that fooled the person who made it. One: make sure the break landed. A find-and-replace that matched nothing is a break that never happened, and the suite stays green for the wrong reason. Two: break it everywhere in the scope you mean. If a phrase is removed from one paragraph but stands in three others, those three keep it green. Three: a check that searches too widely proves too little. A search of a whole document only shows a phrase is somewhere, not that it is doing its job in the right place. Four: check the real behavior, not a label standing in for it, like a disclaimer instead of a sequence or a flag instead of an effect. The Word is blunt about fooling ourselves: "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap." (Galatians 6:7). Yahweh is not mocked, and the harvest matches what was sown, not what the dashboard says. It also takes humility to break your own work: "Whoso loveth instruction loveth knowledge: but he that hateth reproof is brutish." (Proverbs 12:1). A failing test is the kindest reproof, because it comes before anyone is hurt. And you cannot do this alone: "Iron sharpeneth iron" (Proverbs 27:17). Someone else finds the break you are too confident to look for. The habit to build is worth more than any single test. After a while you stop asking whether your code works and start asking one question: what would make this check fail, and can I do it? That question has an answer you can actually run, which makes it a much better question than the first one.', teen: 'A gate that always passes is itself a lie: this lesson is about proving that a check actually catches, which is the trap hidden inside the last lesson\'s advice to prefer gates over assurances. Picture a suite of a thousand checks, all green, every one of which would pass whatever the code did. That is worse than no suite, because now everyone trusts it; the green is load-bearing and hollow. It is theater, and the most expensive kind of self-deception in software, because it costs nothing to keep and returns nothing. So a new gate ships only after it has been shown to catch. You do not argue that it would; you introduce the break, run the suite, and watch it go red, then revert the break and keep the check. Having seen the red, you can trust the green. Most of this goes wrong in the breaking, and four rules were each learned from a break that fooled its author. First, assert the break landed: a find-and-replace that matched nothing leaves the suite green for the wrong reason, which reads exactly like success. Second, break globally within the scope you mean; a property removed from one lesson body stayed green once because a later benefits list repeated it. Third, a check that spans too much proves too little, since searching a whole document can only show a phrase exists somewhere, not that it is doing its job where it stands; this course\'s own gates were rewritten twice to fix that. Fourth, watch the thing, not a token for it, whether a disclaimer instead of a sequence, a flag instead of an effect, or a log line instead of a result. Scripture is direct about self-deception in work: "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap." (Galatians 6:7). A green suite can mock its owner, but the harvest arrives at the incident and matches the sowing. It takes a teachable heart to break your own work on purpose: "Whoso loveth instruction loveth knowledge: but he that hateth reproof is brutish." (Proverbs 12:1). A failing test is the cheapest reproof there is. And because you share a blind spot with yourself, "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend." (Proverbs 27:17). The lasting habit is to stop asking whether your code works and start asking what would make this check fail, and whether you can make it happen.', senior: 'A gate that always passes is itself a lie, and this lesson addresses the trap concealed in the previous one\'s counsel to prefer gates to assurances: a check must be proven to catch before it is trusted. A suite of a thousand checks, every one green and every one certain to pass regardless of what the code does, is worse than having no suite, because it commands confidence it has not earned. Its green is structural and empty, a theater that costs nothing to maintain and yields nothing in return, which makes it the costliest form of self-deception in the discipline. The rule is therefore that a new gate is adopted only after it has been seen to fail. One does not reason that it would catch a defect; one introduces the defect, runs the suite, observes the failure, and then restores the code and keeps the check, so that later passes carry real meaning. The breaking itself requires care, and four rules have been learned from breaks that deceived their authors. The first is to confirm that the break took effect, since a substitution that matched nothing leaves the suite passing for the wrong reason. The second is to break the property everywhere it appears within the intended scope, because a phrase removed from one paragraph but repeated in three others remains protected by them. The third is to scope the check narrowly, since a search across a whole document proves only that a phrase exists somewhere, not that it serves its purpose where it stands; this course\'s own gates were revised twice on that account. The fourth is to test the behavior rather than a token of it, a sequence rather than a disclaimer, an effect rather than a flag. Scripture speaks plainly about deceiving oneself in one\'s work: "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap." (Galatians 6:7). A dashboard of green may mislead its owner, but the harvest at the moment of failure matches what was actually sown. Deliberately breaking one\'s own work requires a teachable spirit, for "Whoso loveth instruction loveth knowledge: but he that hateth reproof is brutish." (Proverbs 12:1), and a failing test is the gentlest reproof available. Because a person shares his blind spots with himself, another is needed: "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend." (Proverbs 27:17). The habit worth keeping is to ask what would make a check fail, and then to attempt it.' },
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
    levels: { child: 'The battlement and the open pit! This lesson is about guards on anything that runs itself. Some computer programs run all by themselves. They start on a timer, like an alarm clock. Nobody has to push a button. That is useful. But it can also go wrong. Here is a true story from this app. On 2026-06-06, lots of programs were left running by themselves. The person in charge was away on a trip. The programs got stuck. They kept going and going. They used up the computer. They made more work, and then more. Someone had to stop them by hand. So now there is a rule. A program that runs by itself must have guards. Guard one is a limit. It can only run so long. When it hits the limit, it stops. Guard two is a lock. Only one copy can run at a time. If a new one starts while the old one is still going, the new one waits its turn. Guard three is a stop path. There must be a sure way to stop it, not just a person trying to remember. These guards do not mean we stop building. We still build! We just put the guards in first. Then we turn it on while someone is watching. The Word has a law about this. When you build a house with a flat roof, you must put a rail around the edge. "thou shalt make a battlement for thy roof" (Deuteronomy 22:8). A battlement is a rail, so no one falls off. The roof is good. The rail is not a choice. And if you dig a pit, you must cover it. If an animal falls in, you pay for it. You dug it. It is yours. The Word also says a man who cannot control himself is like a city with no walls. Anything can get in. A program with no limits is like that city. A wise man sees trouble coming and gets ready. Running on your own computer does not make a problem small. It just makes it your problem. Now you try. Set a timer for play time. When it rings, stop. That is a limit!', youth: 'The battlement and the open pit are this lesson\'s pictures for guards on anything that runs itself, and the lesson comes from a real incident. On 2026-06-06 a fleet of automation on this platform was left running with nobody watching while the principal traveled. It included a five-minute feedback loop, an autonomous builder switched on, a model pinned in memory, a batch queue, and five scheduled tasks. It ran away, looping and eating compute until it hung, and it had to be shut down by hand. The scheduled fleet was deleted to stop it. The record is in this repository\'s lessons-learned document. So now nothing that fires on a clock, spawns more work, or uses compute with no person present ships without guards built in and proven to catch. First, a budget: a limit on tokens, turns or time for each run. A run that hits the limit ends itself. It does not continue and it does not ask. Second, a concurrency lock: only one copy at a time. A new firing that finds the last run still going skips instead of stacking, because stacking is how one five-minute loop becomes twelve by lunchtime. Third, a stop path: a sure way to stop it that the system itself reads, like a registry entry set to disabled or a required file removed, not a person remembering. Notice what these guards are not. They are not a reason to delay building. They control what ships running. You build it with brakes, ship it off, and turn it on with someone watching. Using safety as an excuse not to build is a different failure. The Word made a law for exactly this: "When thou buildest a new house, then thou shalt make a battlement for thy roof, that thou bring not blood upon thine house, if any man fall from thence." (Deuteronomy 22:8). Flat roofs were allowed and useful. The rail was required. And the law about a pit is even closer to automation: if a man digs a pit and does not cover it, "The owner of the pit shall make it good" (Exodus 21:34). You dug it, you own what falls in. A man with no rule over his spirit is "like a city that is broken down, and without walls." (Proverbs 25:28), and an automation with no ceiling is that city. "A prudent man foreseeth the evil, and hideth himself" (Proverbs 22:3). He sees it coming and builds for it. Last, running on your own hardware does not make a runaway smaller. It only makes it yours, and saying a change only adds something is not a safety argument either.', teen: 'The battlement and the open pit are the two Old Testament laws behind this lesson on guards for anything that runs itself, and the lesson is post-incident. On 2026-06-06 a fleet of autonomous, timer-driven automation here, a five-minute feedback loop, an autonomous builder shipped active, a pinned model, a batch queue and five scheduled tasks, was left running unattended while the principal traveled. It went into runaway compute, looped, hung, and had to be shut down by hand; the scheduled fleet was deleted to stop it. The record sits in this repository\'s lessons-learned document, dated, with the principles it produced. The rule since then: anything that fires on a clock, spawns more work, or consumes compute without a person present ships with its guards designed in and proven to catch. A budget sets a token, turn or wall-clock ceiling per run, and a run that reaches it terminates itself without continuing or asking. A concurrency lock keeps it single-instance, so a new firing that finds a previous run in progress skips rather than stacking; stacking is how one five-minute loop becomes twelve simultaneous loops by lunchtime. A stop-path gives a deterministic way to halt it, a registry entry set to disabled, a required file removed, a switch the system reads, rather than a human remembering. These guards do not delay building. They gate what ships running: build with the brakes in, ship inactive, and activate on proof with someone watching. Citing safety as a reason not to build is its own failure. Scripture legislated this category: "When thou buildest a new house, then thou shalt make a battlement for thy roof, that thou bring not blood upon thine house, if any man fall from thence." (Deuteronomy 22:8). That law does not ban flat roofs; it requires a rail on a useful thing, and it names the liability in advance. The pit law is closer still to automation. A man who opens a pit and leaves it uncovered answers for what falls in: "The owner of the pit shall make it good" (Exodus 21:34). Not the animal, not bad luck, but the one who dug. You dug it, you own what falls in. A man with no rule over his own spirit is "like a city that is broken down, and without walls." (Proverbs 25:28), not weak walls but none, and an automation with no ceiling is that city. "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished." (Proverbs 22:3). The prudent one sees the shape of the incident beforehand and builds structurally. And the hard-won point underneath: running on your own hardware does not bound cost or blast radius, it only makes the runaway yours, and "it is only additive" is not a safety argument.', senior: 'The battlement and the open pit supply the scriptural frame for this lesson on guarding any system that runs itself, and the lesson was written after a real failure. On 2026-06-06 a group of autonomous, timer-driven processes on this platform, including a five-minute feedback loop, an autonomous builder left active, a model held resident in memory, a batch queue and five scheduled tasks, was left running without supervision while the principal was traveling. The processes entered runaway computation, looped, hung, and had to be stopped manually; the scheduled tasks were deleted to end it. The account and the principles drawn from it are preserved in the repository\'s lessons-learned document. The standard adopted afterwards is that nothing firing on a schedule, generating further work, or consuming computation in the absence of a person may ship without its safeguards designed in and demonstrated to work. A budget places a ceiling of tokens, turns or elapsed time on each run, and a run reaching that ceiling ends itself without continuing or seeking permission. A concurrency lock ensures a single instance, so that a new firing encountering a run still in progress skips rather than stacking, since stacking is how one short loop multiplies into many. A stop-path provides a deterministic means of halting the process that the system itself reads, such as a disabled registry entry, a removed file or a switch, rather than depending on someone\'s memory. These safeguards govern what is allowed to run; they are not grounds for postponing construction. The work is built with its brakes, shipped inactive and activated on evidence while someone observes, and invoking safety to avoid building is a separate error. The law of Moses addressed this very category: "When thou buildest a new house, then thou shalt make a battlement for thy roof, that thou bring not blood upon thine house, if any man fall from thence." (Deuteronomy 22:8). The flat roof was permitted and useful; the parapet was obligatory, and the responsibility was assigned before any accident occurred. The law of the uncovered pit is closer still to automation, for the one who dug it and left it open must answer for what fell in: "The owner of the pit shall make it good" (Exodus 21:34). The digger owns the consequence. Proverbs describes a man without self-rule as "like a city that is broken down, and without walls." (Proverbs 25:28), and an automation without a ceiling is such a city. "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished." (Proverbs 22:3). Finally, hosting a system on one\'s own hardware does not limit its cost or reach; it merely makes the runaway one\'s own, and describing a change as merely additive is no argument for its safety.' },
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
    levels: { child: 'The worker that broke the front door! This is a story about why every check stayed green while phones went dark. It happened on 2026-08-30. Someone opened the church app on their phone. The app would not load. It just showed an error. But at the very same time, the computer check said, all is well! Both things were true. How can that be? The check used a brand new browser, fresh and clean. The phone was different. The phone already had the app saved on it. A saved app has a small helper inside it. It is called a service worker. It helps the app work even when the internet is slow. The problem was hiding in that helper. So only phones that already had the app got the error. That means the people who use the app the most! Here is what the helper did wrong. When the internet was slow, it was supposed to show a backup page. But it looked for the backup page of a different door in the app. That page was not there. So it showed nothing at all. Nothing looks like a broken app. So here is a big lesson. A backup plan that can end in nothing is not a backup plan. The builders fixed it. Now each door has its own backup page. If that is missing, there is another backup. And if that is missing too, the app makes a simple page that says what happened. It can never show nothing. They also fixed the check. Before, it only looked at one door of the app. Now it looks at every door. Here are four things to remember. One. The check being happy does not mean the app is working. Two. Test the way real people use it. Three. Watch every door, not just the first one you built. Four. If you do not know, do not say it is fine. Yahweh made our eyes and ears. "The hearing ear, and the seeing eye, the LORD hath made even both of them." (Proverbs 20:12). A computer check is like an eye we made. It can look at the wrong thing. And remember, only Yahweh truly keeps the city. "except the LORD keep the city, the watchman waketh but in vain." (Psalms 127:1). So we build good checks, we point them at the real door, and we trust Him. Nobody meant for this to happen. The builders were careful. They just checked from the wrong place. That is why we look at the app the way a real person does. Now you try. Next time you say, it works, ask this. Did I test it the way a real person would use it?', youth: 'The worker that broke the front door is the story of why every probe stayed green while phones went dark, and it is the most useful outage in this platform\'s history. The lesson is not really about service workers. On 2026-08-30 the church app\'s front door was reported dead on a phone: the installed app, opened normally, showed a bare network error. At that exact moment the automated health check reported the site up and fresh on everything it measured. Both were true, and that is the whole problem. How could both be true? The check drove a real browser from a clean machine and every case passed. But a fresh browser has no service worker installed, and that was the entire difference. The defect lived in code that only runs on a device that has already installed the app, which means only on the devices of the people who use it most. Here is the mechanism, read from the file that was running. The app registered one worker at the root, so it controlled every door on the site, but its settings named only one door. When the network failed on a navigation, the offline fallback reached for the shell page of the wrong door. That page did not exist, so the fallback returned nothing, and answering a navigation with nothing is a network error, which the browser shows as a dead page. On a phone connection, one short failure was enough. That is the lesson to carry anywhere: a fallback that can end in nothing is not a fallback. It is a second, quieter failure that only opens after the first one fails, always at the worst moment and never in testing. The fix on the main branch uses real names. DOOR_PATHS lists every door, shellPathFor finds a door\'s own shell, and offlineShellFor walks a chain that cannot end in nothing: this door\'s shell, then the base shell, then a generated offline page with a plain sentence on it. The second half of the fix was not code. The health check had only ever watched one door. Now it probes every installable door. The gap was never in the alerting; it was in what was being watched. Four lessons follow. A healthy pipeline is not a healthy product, because every safeguard here watched the build and none opened the thing a person uses. A probe that cannot reproduce the user\'s state cannot see the bug. Watch every door, not the one you built first. And unknown must never read as healthy. The Word gives the prudence and the instruments: "A prudent man foreseeth the evil, and hideth himself" (Proverbs 22:3), and "The hearing ear, and the seeing eye, the LORD hath made even both of them." (Proverbs 20:12). A dashboard is a made eye, and it can be pointed at the wrong thing while working perfectly. Every dashboard that ever lied did it by treating an unknown as good. So build the watch and aim it at the real door, remembering that "except the LORD keep the city, the watchman waketh but in vain." (Psalms 127:1).', teen: 'The worker that broke the front door is this platform\'s most instructive outage, the one in which every probe stayed green while phones went dark, and its real subject is not service workers but the hardest class of production failure. On 2026-08-30 the church app\'s front door was reported dead on a phone: the installed app, launched normally, showed a bare network error. At the same moment the automated health check reported up and fresh across every dimension it measured. Both observations were true. The check drove a real browser from a clean machine, and it passed; but a fresh browser has no service worker installed, and that was the whole difference between the machine that said up and the phone that was dark. The defect lived in code that only runs once the app is installed, so it hit only the devices of the people who use it most. The mechanism, read out of the running file, app/public/sw.js with its registration in app/src/main.jsx: the worker was registered at the root scope, so one worker controlled every door on the origin, while its own base constant named only one of them. The navigation handler was network-first, which is right, but its offline fallback reached for the wrong door\'s shell, and when that entry did not exist it resolved to nothing. Responding to a navigation with nothing is a network error, rendered as a dead page, and one transient mobile failure triggered it. That root registration was later retired for an unrelated notification reason, but the lesson stands. Here is the part that generalizes: a fallback that can resolve to nothing is not a fallback. It is a quieter failure path that opens only after the first failure, always at the worst time and never in testing. The fix on main today: DOOR_PATHS lists every installable door, FACE_SHELLS holds each door\'s shell except the base, shellPathFor resolves a URL to its own door\'s shell, and offlineShellFor walks a chain that cannot end in nothing, ending in a generated offline page; the comment above it promises a real Response, never undefined. The other half was not code. The health check had watched only one door, so the congregation\'s door could stay dark indefinitely under a green dashboard; now it probes every door and fails when one does not serve its shell. The gap was in what was watched, not in the alerting. Four takeaways outlive the bug. A healthy pipeline is not a healthy product. A probe that cannot reproduce the user\'s state cannot see the bug, so ask what state the real user has that the probe lacks. Watch every door. Unknown must never read as healthy. "A prudent man foreseeth the evil, and hideth himself" (Proverbs 22:3), and "The hearing ear, and the seeing eye, the LORD hath made even both of them." (Proverbs 20:12). A dashboard is a manufactured eye that can be aimed wrong while working perfectly. Build the watch, aim it at the real door, and remember that "except the LORD keep the city, the watchman waketh but in vain." (Psalms 127:1).', senior: 'The worker that broke the front door is the most instructive outage in this platform\'s history, an incident in which every automated probe reported health while real phones could not open the app, and its lesson reaches well beyond the technology involved. On 2026-08-30 a member reported that the installed church app, launched in the ordinary way, showed only a network error. At that very moment the automated health check reported the site available and current on every measure it applied. Both reports were accurate. The check operated a genuine browser from a clean machine, and it succeeded; but a fresh browser has no service worker installed, and that single difference separated the machine that reported health from the phone that showed nothing. The defect lived in code that executes only on devices where the app is already installed, which is to say on the devices of its most faithful users. The mechanism, read from the running files, was this. The worker was registered at the root of the site and so governed every entrance, while its own configuration named only one of them. Its handling of page loads rightly tried the network first, but its offline fallback reached for the stored shell of the wrong entrance, and when that shell was absent the fallback produced nothing at all. A page request answered with nothing is a network error, displayed as a dead page, and on a mobile connection a single momentary failure was enough. The general principle deserves emphasis: a fallback that can resolve to nothing is not a fallback but a second, quieter path to failure, one that opens only after the first has failed and so appears at the worst moment and never in testing. The repair now on the main branch names each entrance, resolves every address to its own shell, and follows a chain that cannot end empty, concluding with a generated offline page carrying a plain explanation. The second part of the repair concerned observation rather than code. The health check had watched only one entrance, leaving the one the congregation uses unobserved; it now probes every entrance and fails when any does not serve its shell. The gap lay not in the alerts but in what was being watched. Four conclusions endure: a sound pipeline is not a sound product; a probe that cannot reproduce the user\'s state cannot see the defect; every entrance must be watched; and an unknown must never be reported as healthy. Scripture commends the foresight, "A prudent man foreseeth the evil, and hideth himself" (Proverbs 22:3), and reminds us whose instruments we use: "The hearing ear, and the seeing eye, the LORD hath made even both of them." (Proverbs 20:12). A dashboard is a manufactured eye that may be fixed on the wrong object while functioning perfectly. A check that cannot tell whether something is current must say so, rather than defaulting to good, for every dashboard that has ever misled its owners did so by counting an unknown as healthy. Build the watch and direct it to the real door, remembering that "except the LORD keep the city, the watchman waketh but in vain." (Psalms 127:1).' },
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
    levels: { child: 'Shrink-only debt! This lesson is about telling the truth about what is not fixed yet. Every big program has a problem that is too big to fix this week. What should we do? One wrong answer is to say it is fixed when it is not. That is a lie. Another wrong answer is to say it can never be fixed. That is a lie too. There is a third answer. First, count the problem. Then write down the real number. Then make a rule: the number can never get bigger. It can only get smaller. That is called a ratchet. A ratchet is a tool that turns only one way. Here is how it works. A computer program counts every place the problem shows up. It writes a list. The list is saved. Every time we change the app, the program counts again. If there is a new problem that was not on the list, the computer says no. If a problem gets fixed, we take it off the list. So the list only shrinks. This app has three of these lists you can read. One counts lessons that are too short. One counts lessons that are too hard for a child to read. One counts lessons that do not say their own name near the start. None of these got fixed the day they were found. But now none of them can get worse. A list like this is better than a note. A note can be forgotten. The list gets checked every single time. To be honest, the list must say what it counts. The number must be real, not a guess. We must read each item, not just clear it. And when the number changes, we write down why. The Word says, "Ponder the path of thy feet, and let all thy ways be established." (Proverbs 4:26). Look at where you really are first. Jesus said that if you are faithful in small things, you will be faithful in big things. So the small items on the list matter too. The Word also says to know how your flocks are doing. You cannot know what you never counted. A list like this must not become a comfy place to hide a problem. The point is to make it shrink. Now you try. Count the toys on your floor. Write the number. Tomorrow, try to make it smaller.', youth: 'Shrink-only debt is the idea in this lesson, and it is about telling the truth about what is not fixed yet. Every real system has a problem too big to fix this week. The two usual answers are both bad. Saying it is fixed when it is not is a lie people believe. Saying it can never be fixed is a lie people accept. There is a third answer, and this platform uses it in several places: measure the problem, commit the real number, and forbid it from growing. Here is how that ratchet works. A script measures some property across the whole system and lists every place it fails. That list is saved as data, a baseline file in the repository. A test compares the live measurement against the saved baseline. A new failure that is not in the baseline fails the build. An entry that has been fixed gets reported so it can be removed on purpose. The list may only shrink. Three of these are live in this repository. app/src/lib/full-levels-baseline.json records lesson versions shorter than the message they claim to carry. app/src/lib/reading-level-baseline.json records lessons that read harder for a child than for a teenager. app/src/lib/title-in-narrative-baseline.json records versions that never name their lesson near the start. None was solved the day it was found. All three can no longer get worse. This beats a ticket. A ticket describes a problem; a baseline measures it and defends the measurement, and the build reads it on every push, so it cannot quietly rot. But a baseline can be abused, so four things keep it honest. Name the proxy: say exactly what is measured and what the measure cannot see. Use a real, measured number, never an estimate that looks manageable. Read each entry instead of clearing entries mechanically, because a measure reports difference, and something can fail the measure while being correct in a form it cannot recognize. And when the baseline moves, attach the reason. One pin here moved the same day this course was written, and the reason, a new course joining the catalog, is written beside the number. The Word says, "Ponder the path of thy feet, and let all thy ways be established." (Proverbs 4:26). Look honestly first; being established comes second. "He that is faithful in that which is least is faithful also in much" (Luke 16:10), so small entries matter. And "Be thou diligent to know the state of thy flocks" (Proverbs 27:23). You cannot know what you never counted. One warning: a ratchet must never become a comfortable place to keep a problem. If a baseline has not moved in months, that says something about the team.', teen: 'Shrink-only debt is how this lesson teaches telling the truth about what is not fixed yet. Every real system carries a problem too large to fix this week, and the two common responses both fail. Declaring it fixed when it is not is a lie that gets believed; declaring it unfixable is a lie that gets accepted. The third answer, used across this platform, is to measure the problem, commit the real number, and forbid it from growing. Concretely, a script measures a property across the whole system and produces a list of every failure. The list is committed as data, a baseline file. A test compares the live measurement to that baseline: a new failure not on the list fails the build, and a fixed entry is reported so it can be removed deliberately. The list may only shrink. You can read three live examples. app/src/lib/full-levels-baseline.json holds lesson versions shorter than the message they claim to carry; app/src/lib/reading-level-baseline.json holds lessons that read harder for a child than for a teenager; app/src/lib/title-in-narrative-baseline.json holds versions that never name their own lesson near the start. None was solved when found, and none can now get worse. Why is that better than a ticket? A ticket describes; a baseline measures and then defends the measurement, and because the build reads it on every push, it cannot rot silently the way a ticket does. Since a baseline can also become a hiding place, honesty takes four disciplines. Name the proxy, stating what is measured and what it cannot see; if word count stands in for carrying the full message, say so and say what a passing entry could still get wrong. Keep the number real and measured. Treat each entry as debt to be read, not a list to clear mechanically, because the measure reports difference, not absence, and clearing without reading is how a protective gate ends up overwriting good work. And move the baseline only with its reason attached; one pin here moved the day this course was written, with the reason, a new course entering the catalog, written into the test beside it. Scripture frames all of it: "Ponder the path of thy feet, and let all thy ways be established." (Proverbs 4:26). Pondering comes first, establishing second. "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much." (Luke 16:10), so the small entries measure the whole. "Be thou diligent to know the state of thy flocks, and look well to thy herds." (Proverbs 27:23); a baseline is the flock\'s state written down. What a ratchet must never become is a comfortable place to keep a problem, because every entry costs somebody something, and a baseline unchanged for months is a finding about the team.', senior: 'Shrink-only debt is the method this lesson teaches for telling the truth about what has not yet been fixed. Every real system contains a problem too large to resolve in a single week, and the two usual responses are both dishonest: announcing it fixed when it is not, which is believed, and pronouncing it unfixable, which is accepted. The third course, used in several places on this platform, is to measure the problem, commit the actual figure, and prohibit it from growing. In practice a script measures a property across the whole system and lists every point of failure. That list is committed to the repository as a baseline. A test then compares each new measurement with the baseline: any failure not already recorded stops the build, and any recorded failure that has been repaired is reported so that it can be removed deliberately. The list is permitted only to shrink. Three such baselines can be read in the repository, recording lesson versions shorter than the message they claim to carry, lessons that read harder at the child level than at the teen level, and versions that never name their lesson near the beginning. None of these problems was solved on the day it was discovered, and none can now become worse. The advantage over an ordinary work ticket is that a ticket merely describes, while a baseline measures and then defends its measurement on every change, so it cannot decay unnoticed. Because a baseline may also be misused as a place to hide, four disciplines keep it honest. The proxy must be named, stating what is measured and what the measure cannot detect. The figure must be genuinely measured, never estimated to appear manageable. Each entry must be read as a debt rather than cleared mechanically, since a measure reports difference and not absence, and clearing unread entries is how a safeguard comes to overwrite sound work. And any change to the baseline must carry its reason; one such change was made on the day this course was written, and the reason, a new course joining the catalog, is recorded beside the number. Scripture speaks to each part: "Ponder the path of thy feet, and let all thy ways be established." (Proverbs 4:26), where honest consideration precedes stability. "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much." (Luke 16:10), so the smallest entries are the measure of the whole. "Be thou diligent to know the state of thy flocks, and look well to thy herds." (Proverbs 27:23), which no one can do without counting. A ratchet must never become a comfortable home for a problem; every entry costs someone, and a baseline unchanged for months reveals something about those responsible for it.' },
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
    levels: { child: 'Write the vision and make it plain! This lesson is about the record that lets the next person run. It is the last lesson. It helps the other seven lessons last, even when new people take over. Everything in this class is a choice somebody made. A choice that is only in your head can get lost. The next person may undo it. They may have good reasons, but they did not know why you chose it. So this app keeps a written record of its choices. Here are the rules. One. One choice goes in one file. Two. A new choice gets a new file. We never change the old one. That way we always know what we believed, and when, and why it changed. Three. There is a list of all the choices, so anyone can find them fast. Four. Each record says why the choice was made. It also says what it did not do, and when to look at it again. That part is very important. The Word tells us to write things down. "Write the vision, and make it plain upon tables, that he may run that readeth it." (Habakkuk 2:2). Write it. Make it plain, so it is easy to read. Then the next person can run with it. Good notes help people go faster. King David wrote down the plan for the temple. Then he gave it to his son Solomon, who built it. The one who got the plan was not the one who built it. That is why we write things down. Yahweh filled Bezaleel with skill to build. Being good at building is a gift from Him. The Word also says, "a threefold cord is not quickly broken." (Ecclesiastes 4:12). Three strands are strong. The builder, the checker, and the written record. When Nehemiah built the wall, the builders worked with one hand and held a sword with the other. They built and guarded at the same time, and the wall still went up. Here is the whole class in one list. Build on the rock. Count the cost. Look before you answer. Measure, do not guess. Prove your check works. Put a rail on the roof. Cover the pit. Write down what is not fixed. Write down your choices plainly. And over all of it, "Except the LORD build the house, they labour in vain that build it" (Psalms 127:1). Now you try. Write down one rule for your room, and why you made it.', youth: 'Write the vision and make it plain is the last lesson, and it is about the record that lets the next person run. It is the lesson that lets the other seven survive when the work changes hands. Everything this course taught, the trace, the plumbline, the proven break, the battlement, the ratchet, is a decision somebody made. A decision that lives only in someone\'s head is not really a decision. It is a habit, and the next skilled person to touch the system will reverse it for good reasons, with no way to know why it was there. So this platform keeps an append-only record of its decisions, and each rule was learned by getting it wrong first. One decision per file, named by what it decided. A new directive is a new record, never a rewrite of the old one; this rule carries the weight, because editing yesterday\'s decision destroys knowing what was believed when and why it changed. The old record stays as written and the new one says what it replaces. An index serves as the source of truth for what has been decided, so nobody has to read every file. And every record carries its grounds and its limits. The limits are the part people skip and the part that matters most: what the decision did not do, what was not verified, and when to look again. The Word gives the command and its purpose in one verse: "Write the vision, and make it plain upon tables, that he may run that readeth it." (Habakkuk 2:2). Write it, not just remember it. Make it plain, since a record only its author can read is not really written. And the goal is speed: the reader should move faster because the record exists. The temple plan was written too: "the LORD made me understand in writing by his hand upon me, even all the works of this pattern." (1 Chronicles 28:19). David received it, and Solomon built it. The person who gets the vision is often not the one who builds it, and spoken words do not survive the handover. Bezaleel was filled "with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship" (Exodus 31:3), so technical skill is a real calling. It is not a solo job: "a threefold cord is not quickly broken." (Ecclesiastes 4:12). The builder, the reviewer, and the record, which holds when both people are gone. Nehemiah\'s builders worked with one hand and held a weapon in the other, and the wall still went up. The course in one line: build on the rock, count the cost, look before you answer, measure instead of claiming, prove the check catches, rail the roof and cover the pit, write debt down honestly, and record decisions plainly. Over it all, "Except the LORD build the house, they labour in vain that build it" (Psalms 127:1).', teen: 'Write the vision and make it plain closes the course with the record that lets the next person run, and it is the lesson that makes the other seven survive a change of hands. Every practice taught here, the trace, the plumbline, the proven break, the battlement, the ratchet, is a decision someone made. A decision that exists only in a person\'s head is a habit, and the next competent person will reverse it with excellent reasons and no way of knowing better. So this platform keeps an append-only record of its decisions, and each convention was reached by getting it wrong first. One decision per file, with its own name, findable by what it decided. A new directive becomes a new record, never a rewrite of the old one; that is the load-bearing rule, because editing yesterday\'s decision to match today\'s destroys the record\'s only purpose, knowing what was believed when and why it changed. The superseded record stays exactly as written and the new one names what it supersedes. An index is the source of truth for what is settled. And every record carries grounds and limits, the limits being what people skip and what matters most: what the decision did not do, what was not verified, and when it should be looked at again. A record without limits is an advertisement. The Word supplies command and purpose together: "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it." (Habakkuk 2:2). Write it rather than remember it; make it plain, because a record only its author can decode is not written in any useful sense; and let the reader run, since the point is speed, not archiving. The temple pattern was handed over the same way: "the LORD made me understand in writing by his hand upon me, even all the works of this pattern." (1 Chronicles 28:19). It went to a different builder than the man who received it, which is the whole case for documentation. The craftsman\'s skill is named as a filling of the Spirit: Bezaleel received wisdom, understanding, knowledge "and in all manner of workmanship" (Exodus 31:3), including cutting stones and carving timber, so engineering is not a lesser calling. Nor is it solo work: "a threefold cord is not quickly broken." (Ecclesiastes 4:12), the builder, the reviewer and the record, the strand that holds when both people are gone. And Nehemiah\'s builders each "had his sword girded by his side, and so builded." (Nehemiah 4:18). Nobody chose between building and defending; the traces, gates and records are the sword hand, and the wall still rose. The whole course in a line: build on the rock, count the cost, look before you answer, measure instead of claiming, prove the check catches, rail the roof and cover the pit, write the debt down honestly, and record decisions plainly. Over all of it: "Except the LORD build the house, they labour in vain that build it" (Psalms 127:1).', senior: 'Write the vision and make it plain is the final lesson of the course, concerned with the written record that allows the next person to proceed quickly, and it is the lesson on which the survival of the other seven depends when the work passes to new hands. Every practice taught here, the trace, the plumbline, the proven break, the battlement and the ratchet, is a decision someone made. A decision that exists only in one person\'s memory is not truly a decision but a habit, and a capable successor will reverse it for sound reasons, having no means of knowing why it was made. This platform therefore keeps an append-only record of its decisions, and each of its conventions was learned by first getting it wrong. Each decision occupies its own file, named for what it decided. A new directive is always a new record and never a revision of an old one; this is the essential rule, since rewriting yesterday\'s decision to agree with today\'s erases the only thing the record exists to show, namely what was believed at the time and why it changed. The earlier record remains as written, and the later one states what it supersedes. An index serves as the authoritative list of what has been settled. Every record states its grounds and its limits, and the limits, though often neglected, matter most: what the decision did not accomplish, what was not verified, and when it should be reviewed. A record without limits is merely an advertisement. The Word gives both the command and its purpose in one sentence: "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it." (Habakkuk 2:2). It is to be written rather than remembered, made plain so that others can read it, and its aim is to speed the reader, not merely to preserve the past. The pattern of the temple was transmitted in writing: "the LORD made me understand in writing by his hand upon me, even all the works of this pattern." (1 Chronicles 28:19). It was received by David and built by Solomon, for the one who receives a vision is often not the one who builds it, and spoken instruction does not survive the handover. Bezaleel was filled "with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship" (Exodus 31:3), which honors technical craft as a calling. The work is not solitary: "a threefold cord is not quickly broken." (Ecclesiastes 4:12), the builder, the reviewer and the record, the last of which endures when both people have gone. Nehemiah\'s builders each "had his sword girded by his side, and so builded." (Nehemiah 4:18), and the wall was completed. In summary: build on the rock, count the cost, observe before answering, measure rather than assert, prove that checks catch, guard the roof and cover the pit, record debt honestly, and document decisions plainly. Over all of it stands the first verse: "Except the LORD build the house, they labour in vain that build it" (Psalms 127:1).' },
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
