// =============================================================================
// project-management-course — "Project Management: Count the Cost"
// =============================================================================
// Darrell, 2026-09-17, spoken into this channel:
//
//   "We should also do courses on project management, and that is anything from
//   building and projects with properties... The church, we've also flipped
//   houses with the church. So just understanding exactly what, who should
//   work, when they should work... what tasks to associate with these people
//   versus these people, what skill sets we need, all those things, counting
//   those costs before we get involved, and then walking through, having
//   timeline and milestones, and meetings to secure quality subject matter
//   experts in order for them to give us the details associated with the things
//   that we need to be able to see clearly, and being able to get down to the
//   root cause of what we need to do and what we don't need to do. So PMP,
//   ITIL, you know, processes — so all these are all project management sort of
//   standards in the industry."
//
// And, the same night, the frame that governs this whole course:
//
//   "But I do believe PMP and ITIL are in the word of God... I was able to use
//   the Lord's perspectives to make them easier for me to comprehend and
//   therefore quicker for me to comprehend... the algorithms in the Bible are
//   more rigorous than any algorithm and they're telling you about you."
//
// THE GOVERNING LENS, AND WHAT IT IS NOT. This is not a PMP course with verses
// stapled on the front of each module. The claim is the other way round: the
// discipline is in the Word already, with a worked case and a named
// consequence, and the standard is a VOCABULARY for a shape the Word gave
// first. So every lesson teaches the Word's own case, then names what the
// industry calls it. That ordering is the whole pedagogy — it is why he
// comprehended the certifications faster, and it is the mechanism L173 names:
// naming is faster than learning (WORD-FIRST, DR-0127).
//
// WHAT THIS COURSE DOES NOT CLAIM (DR-0076 §8, and the same refusal L173
// carries). Nothing here claims that reading the Word raises a PMP or ITIL exam
// score. That has not been measured, not by us and not in these pages. What is
// claimed is what the verses say, and what he reported about his own
// comprehension. A claim about scores dressed in a verse would cost more than
// it buys.
//
// AND THE STANDARDS ARE NAMED HONESTLY. PMBOK and ITIL are real bodies of work
// by real practitioners, and honour is due where honour is due (Romans 13:7).
// Where this course names a PMP or ITIL term it names it as THEIR term. Where
// the Word and a standard genuinely diverge, the Word governs and the
// divergence is said out loud rather than smoothed over.
//
// EVERY QUOTATION IS VERBATIM from the verified local KJV corpus
// (`app/public/bible/kjv`), fetched rather than recalled, and held by
// project-management-course.test.js under strict comparison (DR-0076,
// DR-0456 — whitespace-only normalisation, apostrophes never normalised).
// The corpus carries the typographic apostrophe and so do we.
// =============================================================================

import { progressSummaryFor, exportCurriculumMarkdownFor } from './church-classes.js';

export const PROJECT_MANAGEMENT_META = {
  key: 'project-management',
  title: 'Project Management: Count the Cost',
  category: 'Project Management',
  audience: 'Anyone who has been handed a project and the responsibility for finishing it — a church building or renovation, a rehab, a property turn, a ministry launch, a move, a business build. No certification required, and none assumed.',
  tagline: 'Count the cost before you break ground. Know who should work and who should not. Put a date on it, secure the experts who can actually see, and get down to the root cause of what you need to do — and what you do not. The Word gave this discipline a worked case and a named consequence long before the industry gave it an acronym.',
  cadenceDays: 7,
  // DERIVED (DR-0677): the count is the series' own length, read at use —
  // never a literal a new lesson must edit.
  get weeks() { return PROJECT_MANAGEMENT_MODULES.length; },
  // Until DR-0677 the count was a literal with this note, kept as history: keep in step with PROJECT_MANAGEMENT_MODULES.length (asserted in the test) — 12 on 2026-09-29: pm12 (DR-0664); 11 on 2026-09-24: pm11 (DR-0609)
  handsOnLabel: 'Work it on a real project',
  unit: {
    noun: 'lesson', nounPlural: 'lessons', cap: 'Lesson', selfPaced: true,
    sessionLabel: 'How to work it (alone, or with the person who handed you the project)',
    countNoun: 'lesson',
  },
  footer: '_The Word gave the discipline first: a tower counted before it is begun (Luke 14:28-30), a span of control set by a father-in-law who said the thing thou doest is not good (Exodus 18:17-18), a wall dated to fifty and two days (Nehemiah 6:15), a plumbline held in His own hand (Amos 7:7-8). PMP and ITIL are a vocabulary for shapes already there. Every verse in this course was fetched from the verified corpus, never recalled. Nothing here claims an effect on any exam score — that was never measured._',
};

export const PROJECT_MANAGEMENT_SESSION_FLOW = [
  { minutes: 3, name: 'Read the anchor — the Word first, before the method' },
  { minutes: 8, name: 'The Word’s own case, worked' },
  { minutes: 4, name: 'What the industry calls it — the name for the shape' },
  { minutes: 8, name: 'Work it on a real project you are carrying now' },
  { minutes: 3, name: 'Check yourself — and the one question this lesson exists to make you ask' },
];
export const PROJECT_MANAGEMENT_SESSION_MINUTES = PROJECT_MANAGEMENT_SESSION_FLOW.reduce((t, s) => t + s.minutes, 0);

export const PROJECT_MANAGEMENT_MODULES = [
  {
    id: 'pm1-count-the-cost',
    title: 'Count the cost — the estimate is a commandment, and it has a named consequence',
    bigIdea: 'Jesus does not say counting the cost is wise, or prudent, or a good habit. He asks which of you would NOT do it, and then He names exactly what happens to the man who skips it: he lays a foundation, cannot finish, and everyone who walks past mocks him. "This man began to build, and was not able to finish" (Luke 14:28-30). That is not a feeling about failure — it is a reputational outcome, stated as the predictable result of one missing step. Read it as a project manager and it is a requirement with a consequence attached: before commitment, establish whether you have sufficient to finish. Not whether you can start. Whether you can FINISH. Most failed projects in a church or a rehab were fully able to start.',
    inApp: 'Pick a project you are carrying right now — a room, a unit, a ministry launch, anything with a finish line. Write the finish line down in one sentence, then write what "sufficient to finish" would actually be: money, hours, skills, permits, materials, and the one thing that would stop everything if it were missing. If you cannot fill that list, you have not counted the cost yet, and the lesson is already doing its work.',
    anchor: {
      ref: 'Luke 14:28-30; Proverbs 21:5; Proverbs 24:27',
      theme: 'The tower counted before it is begun, with the consequence of skipping it named out loud. "The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want" (Proverbs 21:5) — haste is not named as a personality, it is named as a cause with an outcome. And the order is given plainly: "Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house" (Proverbs 24:27). Preparation first, house second.',
    },
    benefits: [
      'You stop confusing CAN WE START THIS with CAN WE FINISH THIS — the two questions have different answers and only one of them matters at commitment.',
      'You get a written finish line, which is the thing most church and rehab projects never had.',
      'You can say no to a project early, cheaply, and with a reason — instead of late, expensively, and with an unfinished foundation on the property.',
      'The mockery Jesus names stops being a vague fear and becomes a specific, avoidable outcome with one known cause.',
    ],
    levels: {
      child: 'Count the cost. Jesus named what happens when you do not. He told a story about a man who wanted to build a tall tower. A smart builder sits down first. He adds up what it will take. Does he have enough wood? Enough stone? Enough money? Enough time? If he skips that, he may lay the bottom of the tower and then run out. Then the job just sits there, not done. People walk by and laugh at him. They say, "This man began to build, and was not able to finish" (Luke 14:30). Jesus did not say it would be nice to count. He asked who would ever skip it. So here is the big idea. Starting is easy. Almost anyone can start. The real question is, can you finish? Before you say yes to a big job, think it all the way to the end. Say what done looks like. Then list what you will need to get there. If the list has holes, you are not ready yet. That is not being slow. That is being wise. A job you can finish is better than a job you start and leave.',
      youth: 'Count the cost: Jesus named the consequence of skipping it, so the estimate is more like a command than a tip. He told about a man who wants to build a tower. First the man sits down and works out if he has enough to finish it. Jesus asks which of you would not do that. Then He says what happens to the man who skips it. He lays the foundation and runs out. Now the half-built thing sits there, and people who pass by mock him: "This man began to build, and was not able to finish" (Luke 14:30). See the exact question. It is not, can I start? Almost any project can start. It is, do I have enough to finish? Proverbs gives the same order. Get the field ready first, and build the house after. It also says that rushing leads to want, and careful planning leads to plenty. So here is how to use it on a real job, like fixing a room or starting a club. Write one sentence that says what finished looks like. Then list what finished will take: money, hours, skills, tools, permission, and the one thing that would stop it all. If you cannot fill the list, you have not counted the cost yet. Saying no early, with a reason, is far better than leaving a slab in the yard for years.',
      teen: 'Count the cost: this lesson treats the estimate as a commandment with a named consequence. Jesus asks a question that answers itself: who starts building a tower without first sitting down to work out whether he has enough to finish it? Then He tells you what happens if you skip it. The man lays the foundation, runs out, and everybody who walks by makes fun of him — "This man began to build, and was not able to finish." Notice the question is not can you START. Almost anything can be started. The question is can you FINISH. So before you say yes to a project, write down what finished looks like, and write down everything you would need to get there. If you cannot write the second list, you are not ready to say yes.',
      senior: 'Count the cost: the estimate read as a commandment, with its consequence named in the text. The industry calls this the business case and the feasibility assessment, and PMBOK places it before the project charter is signed on purpose — the decision to commit is a distinct gate from the decision to plan. Luke 14:28-30 is the same gate with a consequence attached that the standards tend to leave implicit: the cost of a project abandoned after the foundation is not merely financial, it is credibility, and in a church it is credibility with the people who gave. Note what the text asks for, because it is narrower and harder than an estimate: "whether he have sufficient to finish it." Sufficiency to finish, assessed before laying the foundation. That is a go/no-go on total capacity, not a forecast of one phase. Proverbs 24:27 gives the sequence — the field prepared first, the house afterwards — and Proverbs 21:5 names haste not as a temperament but as a mechanism with a measurable output, want. Where a standard speaks of progressive elaboration and permits committing on a rough order of magnitude, the Word here is stricter about the finish, and the stricter reading is the one that keeps a congregation from staring at a slab for three years.',
    },
    quiz: {
      questions: [
        {
          q: 'According to Luke 14:28-30, what exactly is the builder told to establish before he lays the foundation?',
          options: [
            'Whether he can begin the work this season',
            'Whether he has sufficient to FINISH it',
            'Whether the tower is a good idea',
          ],
          answer: 1,
          explain: 'The text asks "whether he have sufficient to finish it." Sufficiency to finish, not sufficiency to start — and most projects that fail were perfectly able to start.',
        },
        {
          q: 'What consequence does the passage name for the man who skips the count?',
          options: [
            'He loses money on the materials',
            'All that behold it begin to mock him — he began to build and was not able to finish',
            'The tower falls down',
          ],
          answer: 1,
          explain: 'The named cost is public and reputational, not merely financial. In a church it is credibility with the people who gave toward it.',
        },
        {
          q: 'What does Proverbs 21:5 say haste produces?',
          options: [
            'Speed, which is sometimes worth the risk',
            'Want — it is named as a cause with an outcome, not as a personality trait',
            'Nothing in particular',
          ],
          answer: 1,
          explain: '"The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want." Two dispositions, two named outputs.',
        },
      ],
    },
  },
  {
    id: 'pm2-who-should-work',
    title: 'Who should work, and who should not — the span of control, set by a father-in-law',
    bigIdea: 'Jethro watches Moses judge Israel alone from morning to evening and tells him plainly: "The thing that thou doest is not good" (Exodus 18:17). Not inefficient. Not tiring. NOT GOOD. Then he gives the reason, which is a capacity argument: "thou art not able to perform it thyself alone" (Exodus 18:18), and the prediction, which is burnout for the leader AND the people. Then he gives the structure: able men over thousands, hundreds, fifties and tens, with an escalation rule — "every great matter they shall bring unto thee, but every small matter they shall judge" (Exodus 18:22). That is a span of control, a tiered organisation, and a defined escalation path, handed to a project manager by his wife’s father, with the selection criteria stated: "able men, such as fear God, men of truth, hating covetousness" (Exodus 18:21).',
    inApp: 'List every open decision on your project that only YOU can currently make. Then sort them into great matters and small matters. Every small matter on that list is a decision you are holding that somebody else should be holding, and each one is a delay with your name on it. Now name the person for each — and check them against Jethro’s criteria, not just availability.',
    anchor: {
      ref: 'Exodus 18:17-18; Exodus 18:21-22; Exodus 18:25-26; 1 Corinthians 12:14-18',
      theme: 'A leader doing everything is not diligence, it is a structural fault, and Jethro names it as not good before he names it as unsustainable. The selection criteria are character before capability. And 1 Corinthians 12:14-18 settles why the roles genuinely differ: "But now hath God set the members every one of them in the body, as it hath pleased him" — the placement is His, so a different assignment is not a lesser one.',
    },
    benefits: [
      'You find out which decisions you are personally holding that are quietly the critical path.',
      'You get selection criteria that include character, which is what actually fails on a church project — not skill.',
      'The escalation rule stops being implicit, so people know what to bring you and what to settle.',
      'You stop reading someone else’s different assignment as a smaller one, because the placement was His.',
    ],
    levels: {
      child: 'Who should work, and who should not? Moses had to learn this from his father-in-law, Jethro. Moses had a very big job. He helped all the people of Israel with their problems. He did it all by himself, from morning until night. The people had to stand and wait all day. Jethro saw it and said it was not good. He said Moses could not do it alone. It would wear him out, and the people too. So Jethro gave him a plan. Pick good helpers. Put some over big groups and some over small groups. Let the helpers take care of the small problems. Bring only the big problems to Moses. Jethro also said what kind of helpers to pick. Pick people who can do the job. But first, pick people who fear Yahweh. That means they honor Him so much they want to do what He says. Pick people who tell the truth. Pick people who do not want to grab money. Being good comes first, and being good at the work comes next. The Bible also says Yahweh puts each person where He wants them. So a small job is not a less important job. Each part matters.',
      youth: 'Who should work, and who should not: the span of control was set by a father-in-law. Moses was judging every problem in Israel by himself, from morning to evening, while the people stood in line. His father-in-law Jethro watched and told him the truth: "The thing that thou doest is not good" (Exodus 18:17). Not just tiring. Not good. The reason was simple. Moses was not able to do it alone, and both he and the people would wear away. So Jethro gave him a structure. Able men would lead groups of thousands, hundreds, fifties and tens. And there was one rule for what comes back up: the big matters go to Moses, and the small matters get settled by the leaders. That one rule is what makes the layers work. Jethro also said who to choose, and he put character first: men who fear Yahweh, men of truth, men who hate greed. Skill came after that. On a real team, the person who lets you down is not usually the one who lacked skill. And 1 Corinthians 12 says Yahweh set each member in the body the way it pleased Him. So a different job is not a smaller job. Try it: list every choice only you are making on a project. Mark the small ones. Those belong to someone else.',
      teen: 'Who should work, and who should not: the span of control, set by a father-in-law. Moses was doing every single job himself, and his father-in-law told him the truth: this is not good. Not that he looked tired — not good, as in structurally wrong. The reason he gave was simple: you are not able to do this by yourself. So he built layers. Able people over groups of thousands, hundreds, fifties and tens. And he gave one rule for what comes back up: the big matters come to Moses, the small matters get judged right there. That one rule is what makes layers actually work. Notice who he told Moses to pick: "able men, such as fear God, men of truth, hating covetousness" (Exodus 18:21). Character first, then skill. On a real project the person who fails you is almost never the one who lacked skill.',
      senior: 'Who should work and who should not is a span-of-control question, and a father-in-law settled it. The industry calls the tiers span of control and the rule an escalation path, and it calls the whole picture a responsibility assignment matrix — RACI in most shops. Exodus 18 carries all three, and it carries something the matrix usually omits: selection criteria that lead with character — "able men, such as fear God, men of truth, hating covetousness" (Exodus 18:21). Read that list against a church building committee and it is immediately practical, because the failure mode on a church project is almost never competence — it is a man who cannot say he was wrong, or a man with an interest in which contractor gets the bid. And Jethro frames the benefit for both parties: "so shall it be easier for thyself, and they shall bear the burden with thee." Delegation here is not the leader offloading, it is the burden becoming shared, which is a different thing and produces different behaviour. 1 Corinthians 12:14-18 then removes the status question that wrecks volunteer teams, and it removes it on the strongest possible ground: Yahweh set the members, every one of them, as it pleased Him. A lane is a placement, not a ceiling. The same chapter that tells you to think soberly about yourself also tells you the offices genuinely differ.',
    },
    quiz: {
      questions: [
        {
          q: 'What were Jethro’s exact words about Moses judging Israel alone?',
          options: [
            'The thing that thou doest is not good',
            'Thou shouldst rest on the sabbath',
            'The people are too many for one man',
          ],
          answer: 0,
          explain: '"The thing that thou doest is not good" (Exodus 18:17). He names it as wrong before he names it as unsustainable — a structural fault, not a scheduling problem.',
        },
        {
          q: 'What is the escalation rule Jethro gives?',
          options: [
            'Everything goes to Moses, but in writing',
            'Every great matter they bring to Moses; every small matter they judge themselves',
            'The rulers of thousands decide everything',
          ],
          answer: 1,
          explain: 'Exodus 18:22. Layers without a rule for what travels upward are just more people in the room; the rule is what makes the structure work.',
        },
        {
          q: 'What criteria does Jethro give for choosing the men?',
          options: [
            'The most experienced judges available',
            '"able men, such as fear God, men of truth, hating covetousness" — character alongside capability',
            'Whoever volunteers first',
          ],
          answer: 1,
          explain: 'Exodus 18:21. Character leads. On a real project the person who fails you is rarely the one who lacked skill.',
        },
      ],
    },
  },
  {
    id: 'pm3-the-skill-is-given-and-named',
    title: 'The skill sets you need — given by name, and taught to others on purpose',
    bigIdea: 'When Yahweh staffs the most demanding build in Scripture, He does not ask for volunteers. He names the man: "I have called by name Bezaleel" (Exodus 31:2), and then He itemises the competencies — wisdom, understanding, knowledge, and all manner of workmanship, cutting of stones, carving of timber, work in gold and silver and brass. That is a skills matrix. Then He assigns a second named lead, Aholiab, and puts wisdom in the hearts of all that are wise hearted. And Exodus 35:34 adds the part most projects forget: "he hath put in his heart that he may teach." The skill was given AND the teaching of it was given, so the capability outlives the one man who has it.',
    inApp: 'Write the skills your project actually requires — not the roles, the skills. Then put a name beside each one, and mark every skill that has exactly one name beside it. Each of those is a single point of failure, and the remedy in Exodus 35:34 is teaching, not hiring. Pick one and ask its holder to teach a second person this month.',
    anchor: {
      ref: 'Exodus 31:1-6; Exodus 35:30-35; 2 Timothy 2:2',
      theme: 'Skills are given, named specifically, and paired with the charge to teach them onward. 2 Timothy 2:2 makes the pattern explicit outside the workshop: "the same commit thou to faithful men, who shall be able to teach others also" — a chain built to survive the person who starts it.',
    },
    benefits: [
      'You stop staffing by role title and start staffing by the specific skill the work needs.',
      'Every skill with exactly one name beside it gets found — before that person is unavailable.',
      'Teaching becomes part of the assignment rather than a favour, which is how a church keeps capability across generations.',
      'Craftsmanship gets its honour back: the man who cuts, carves and weaves is the man of whom Yahweh says, "I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge" (Exodus 31:3).',
    ],
    levels: {
      child: 'The skills you need are given by name, and they are taught to others on purpose. When Yahweh wanted His special tent built, He did not ask who wants to help. He picked a man by name. His name was Bezaleel. Yahweh gave him skill to work with gold and silver. Yahweh gave him skill to cut stones and carve wood. Yahweh also gave him a helper named Aholiab, so one man did not carry it all. And Yahweh gave Bezaleel one more gift. He gave him the gift to teach. That means the skill would not stop with him. Other people would learn it too. Here is what that means for you. When you know how to do something, you are not done when you do it. You are done when someone else can do it too. So if you can bake, or build, or fix, show a friend how. Then the good work keeps going, even when you are not there. That is how Yahweh planned it. The skill is a gift, and passing it on is part of the gift.',
      youth: 'The skill sets you need are given by name, and they are taught to others on purpose. For the biggest build in the Bible, the tabernacle, Yahweh did not put up a sign-up sheet. He named the man: "I have called by name Bezaleel" (Exodus 31:2). Then He listed what Bezaleel could do: work in gold, silver and brass, cut stones, carve wood. That is a list of skills, not just a title. It also says Yahweh filled him with Wisdom, Understanding and Knowledge for this work, so building with your hands is real service to Him. Next, Yahweh named a second leader, Aholiab, so the whole build did not hang on one person. And there is one more part that is easy to miss. Exodus 35:34 says He put it in Bezaleel\'s heart to teach. The skill and the teaching came together. Paul later told Timothy to pass what he learned to faithful people who could teach others too. That is a chain that keeps going after you. So on any project, write down the skills it needs, not the job names. Put a name beside each skill. If a skill has only one name, that is a weak spot. The fix is to teach it to a second person this month.',
      teen: 'The skill sets you need are given by name, and taught to others on purpose. For the biggest build in the Bible, Yahweh did not put up a sign-up sheet. He named the man — Bezaleel — and then listed exactly what he could do: gold, silver, brass, cutting stones, carving wood. That is a skills list, not a job title. Then He named a second leader, Aholiab, so it was not one person carrying everything. And here is the part that matters most for you: He also gave Bezaleel the ability to TEACH. The skill and the teaching of the skill came together. So when you know how to do something on your project, the job is not finished when you do it. It is finished when somebody else can do it too.',
      senior: 'The skill sets a project needs, given by name and taught to others on purpose: The industry calls it a skills matrix or a competency assessment, and the good version of it lists capabilities rather than headcount, which is exactly what Exodus 31 does — devising cunning works, working in gold and silver and brass, cutting of stones to set them, carving of timber. Note how craftsmanship is described: "I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge" (Exodus 31:3). A church that treats the trades as lesser service than the platform is reading past Exodus 31. Two further things the passage does that most staffing plans do not: it names a second lead rather than a single indispensable expert, and in Exodus 35:34 it gives the teaching as part of the gift — "he hath put in his heart that he may teach." The industry arrived at the same conclusion the long way round and calls it bus-factor risk and knowledge transfer. 2 Timothy 2:2 carries the same chain four links deep: Paul, to Timothy, to faithful men, to others also. Any skill on your project held by exactly one person is an unmanaged risk, and the Word’s remedy is teaching rather than retention bonuses.',
    },
    quiz: {
      questions: [
        {
          q: 'How was Bezaleel selected for the work of the tabernacle?',
          options: [
            'He volunteered and was the most skilled available',
            'He was called by name, and his specific competencies were itemised',
            'The elders elected him',
          ],
          answer: 1,
          explain: '"I have called by name Bezaleel" (Exodus 31:2), followed by an itemised list of capabilities — a skills matrix, not a job title.',
        },
        {
          q: 'What does Exodus 35:34 add to the gift of skill?',
          options: [
            'That he may teach',
            'That he may lead the people',
            'That he may choose his own helpers',
          ],
          answer: 0,
          explain: '"he hath put in his heart that he may teach." The skill and the teaching of it came together, so the capability outlives the one man holding it.',
        },
        {
          q: 'A skill on your project has exactly one person who can do it. What does this lesson call that?',
          options: [
            'Good specialisation — protect that person',
            'A single point of failure, whose remedy in Scripture is teaching',
            'Normal, and not a project concern',
          ],
          answer: 1,
          explain: 'The industry calls it bus-factor risk. Exodus 35:34 and 2 Timothy 2:2 both answer it with teaching rather than retention.',
        },
      ],
    },
  },
  {
    id: 'pm4-what-we-do-not-need-to-do',
    title: 'Root cause, and what we do NOT need to do — the answer Nehemiah kept giving',
    bigIdea: 'Four times Nehemiah’s opponents asked him to come down and meet, and four times he sent the same answer: "I am doing a great work, so that I cannot come down: why should the work cease, whilst I leave it, and come down to you?" (Nehemiah 6:3). Read as project management that is scope control spoken out loud, with the cost of the distraction named — the work would CEASE. He does not argue the merits of their meeting. He measures the request against the work and declines. Darrell named this as getting down to the root cause of what we need to do AND what we do not need to do, and the second half is the harder half. Most overrun is not caused by the team working slowly. It is caused by the team working on things nobody ever decided were in scope.',
    inApp: 'List everything currently being worked on for your project. Beside each item write the finish-line sentence it serves. Anything that cannot be traced to the finish line is a candidate to stop, and stopping it is a decision you are allowed to make. Then write your own version of Nehemiah’s sentence — the one you will send when the next good-sounding request arrives.',
    anchor: {
      ref: 'Nehemiah 6:3; Luke 10:41-42; Proverbs 25:2',
      theme: 'A great work declines good invitations, and the reason given is the work would cease. Luke 10:41-42 names the same discipline inside a home: careful and troubled about MANY things, when "one thing is needful." And Proverbs 25:2 gives the root-cause posture its dignity — "the honour of kings is to search out a matter." Searching out the cause is royal work, not delay.',
    },
    benefits: [
      'You get a sentence ready for the next reasonable-sounding request that would stop the work.',
      'Work nobody scoped gets found, which is where most overrun actually lives.',
      'Root-cause analysis stops feeling like a delay and starts being the honour Proverbs 25:2 calls it.',
      'You learn to decline without litigating the other person’s idea — Nehemiah never argued the merits.',
    ],
    levels: {
      child: 'Root cause is a big name for a simple question. What do we really need to do, and what do we not need to do? Nehemiah kept giving the same answer to that question. He was building a wall around his city. Some men did not want the wall built. So they kept asking him to come down and meet with them. They asked four times. Four times Nehemiah gave the same answer. He said he was doing a great work, and he could not come down. If he left, the work would stop. He did not fight about their idea. He just kept working. That is a smart thing to learn. Lots of things will ask for your time. Some of them sound good. But if they would stop the main job, you can say no. You do not have to prove the other idea is bad. Many jobs take too long, not because people are slow. They take too long because people do things nobody ever said were part of the job. So ask first. Does this help us finish?',
      youth: 'Root cause, and what we do not need to do: that is the answer Nehemiah kept giving. Nehemiah was rebuilding the wall of Jerusalem. His enemies kept sending messages asking him to come down for a meeting. Four times they asked, and four times he sent the same answer: "I am doing a great work, so that I cannot come down" (Nehemiah 6:3). He asked why the work should stop while he left it. Look at what he did not do. He did not argue about whether their meeting was a good idea. He just held the request up against the work. If it would stop the work, the answer was no. Darrell called this getting down to the root cause of what we need to do and what we do not need to do. The second half is the harder one. Jesus said something like it to Martha. She was worried about many things, but only one thing was needed. And Proverbs 25:2 says it is the honour of kings to search out a matter, so digging for the real cause is good work, not a delay. Most projects do not run late because people are slow. They run late because people work on things nobody decided to do. Try this. List what you are working on. Next to each item, write how it helps you finish. If it does not, you may stop it.',
      teen: 'Root cause, and what we do NOT need to do: the answer Nehemiah kept giving. People kept asking Nehemiah to come down off the wall for a meeting. He never argued about whether their meeting was a good idea. He just said the same thing every time: I am doing a great work, so I cannot come down — why should the work stop while I leave it and come down to you? That is the whole skill. You measure the request against the work, and if it would stop the work, you say no. And you do not have to prove their idea was bad. Most projects do not run late because people worked slowly. They run late because people worked on things nobody ever decided to do.',
      senior: 'Root cause, and what we do not need to do: the answer Nehemiah kept giving is the whole of this lesson. The industry calls it scope control, and the failure mode it exists to prevent is scope creep — work that enters without a decision, usually arriving as a favour or a good idea from someone with standing. Nehemiah 6:3 is the cleanest refusal in the literature, and note its structure: it asserts the work’s weight, states the mechanism of harm (the work would cease), and does not engage the proposal on its merits at all. That last part is the hard discipline, because litigating the request is itself the interruption. Luke 10:41-42 supplies the interior version — careful and troubled about many things while one thing is needful — which is worth naming because the leader who cannot decline is usually not weak, but genuinely conscientious. And Proverbs 25:2 reframes root-cause work as royal rather than obstructive: it is the honour of kings to search out a matter. Where a standard treats change requests as a queue to be processed, this lesson insists the first question is whether the item belongs to the finish line at all — and that the answer "no" is a normal, authorised output.',
    },
    quiz: {
      questions: [
        {
          q: 'What reason did Nehemiah give for refusing to come down?',
          options: [
            'That his opponents could not be trusted',
            'That the work would cease while he left it',
            'That he had no time in his schedule',
          ],
          answer: 1,
          explain: '"why should the work cease, whilst I leave it, and come down to you?" He named the mechanism of harm rather than arguing the request’s merits.',
        },
        {
          q: 'Where does this lesson say most project overrun actually comes from?',
          options: [
            'The team working too slowly',
            'Work that entered without anyone deciding it was in scope',
            'Bad weather and supplier delays',
          ],
          answer: 1,
          explain: 'Scope creep — work arriving as a favour or a good idea rather than as a decision. Nehemiah 6:3 is the refusal that closes it.',
        },
        {
          q: 'How does Proverbs 25:2 frame searching out a matter?',
          options: [
            'As a delay to be minimised',
            'As the honour of kings',
            'As the work of servants',
          ],
          answer: 1,
          explain: '"the honour of kings is to search out a matter." Root-cause work is dignified in Scripture, not merely tolerated.',
        },
      ],
    },
  },
  {
    id: 'pm5-timeline-and-milestones',
    title: 'Timeline and milestones — a wall finished in fifty and two days, and the date is in the text',
    bigIdea: 'Nehemiah 6:15 does not say the wall was finished quickly, or in good time, or by the grace of Yahweh alone. It says: "So the wall was finished in the twenty and fifth day of the month Elul, in fifty and two days." A completion date and an elapsed duration, both recorded, in Scripture. That is a schedule baseline reported against actuals. Scripture is full of this habit — dated oracles, numbered days, seasons named as having purposes. "To every thing there is a season, and a time to every purpose under the heaven" (Ecclesiastes 3:1). A project without dates is not humble, it is unmeasurable, and an unmeasurable project cannot tell you it is slipping until it has already slipped.',
    inApp: 'Take your finish line and work backwards to no more than seven milestones — points where something is verifiably DONE, not points where work is scheduled to be happening. Put a real date on each. Then write today’s date beside the first one and ask the only question that matters: is that date still true? If you cannot tell, the milestone was written as activity rather than completion, and it needs rewriting.',
    anchor: {
      ref: 'Nehemiah 6:15; Ecclesiastes 3:1; Proverbs 27:23',
      theme: 'A finish recorded with both its date and its duration. Ecclesiastes 3:1 gives time itself a purpose rather than a mood. And Proverbs 27:23 gives the tracking discipline: "Be thou diligent to know the state of thy flocks, and look well to thy herds" — knowing the state is commanded, not optional, and it is ongoing rather than occasional.',
    },
    benefits: [
      'Milestones become verifiable completions rather than periods of activity, which is what makes slippage visible early.',
      'You get a schedule you can be measured against, which is the only kind that can warn you.',
      'Dates stop feeling presumptuous — Scripture records them, and Ecclesiastes 3:1 gives time a purpose.',
      'Proverbs 27:23 turns status tracking into a stewardship duty rather than a reporting chore.',
    ],
    levels: {
      child: 'This lesson is about a timeline and milestones. A milestone is a finish point you can check. Long ago, Nehemiah and his people built a wall around their city. When the wall was finished, the Bible wrote down the date. It also wrote down how many days it took. It took fifty and two days. That is 52 days. The Bible did not just say it went well. It gave a real date and a real number of days. That is a good habit for us. When you plan a big job, pick a few finish points. Each one should be something that is DONE, not something that is going on. The paint is done. The fence is up. The book report is written. Put a date on each one. Then check. Is the date still true? If you cannot tell, you wrote it the wrong way. Fix it so it says what will be done. The Bible also says there is a time for everything. Dates help us use our time well. Dates help us see when a job is getting behind.',
      youth: 'Timeline and milestones: the wall was finished in fifty and two days, and the date is right there in the text. Nehemiah 6:15 does not say the wall got done fast or that it went well. It says the wall was finished on the twenty and fifth day of the month Elul, in fifty and two days. That is a date and a length, both written down in Scripture. The Bible has this habit all through it. Ecclesiastes 3:1 says there is a season and a time for every purpose. Here is what that means for your own project. A milestone has to be something DONE, not something happening. Framing in progress tells you almost nothing. Framing inspected and passed tells you a lot. So work backward from your finish line to a few milestones, no more than seven. Write each one as a finished thing and put a real date on it. Then look at the first one and ask one question: is that date still true? Proverbs 27:23 says to be diligent to know the state of your flocks. Knowing where things stand is part of taking care of them. If you cannot tell whether your date is true, you wrote activity instead of a finish. Rewrite it. A project with no dates is not humble. It just cannot tell you it is slipping until it has already slipped.',
      teen: 'Timeline and milestones: a wall finished in fifty and two days, with the date written in the text. When the wall was finished, the record does not say it went well. It says the twenty and fifth day of the month Elul, in fifty and two days. A date and a length, written down. That is what a real schedule looks like. Here is the trick most people miss: a milestone has to be something that is DONE, not something that is happening. Framing in progress tells you nothing. Framing inspected and passed tells you everything. Write your milestones as finished things, put real dates on them, and then check whether the first date is still true. If you cannot tell whether it is true, you wrote activity instead of completion.',
      senior: 'Timeline and milestones: the wall was finished in fifty and two days, and the date is in the text. The industry calls it a schedule baseline, and the discipline that makes it useful is defining milestones as binary completions with acceptance criteria rather than as phases of effort — activity-based milestones are the reason a project can report seventy percent complete for four months. Nehemiah 6:15 records both the calendar date and the elapsed duration, which is baseline and actual in a single verse, and it is worth noticing that the surrounding chapters record the interruptions too: the opposition, the watch set day and night, the four invitations declined. The record is honest about what the fifty-two days contained. Proverbs 27:23 is the tracking cadence, and the imperative is diligence in KNOWING the state — status is a duty of stewardship, not a reporting overhead, which reframes the weekly check for anyone who resents it. Ecclesiastes 3:1 is the antidote to the two opposite errors: the schedule held so loosely that nothing can be measured, and the schedule held so tightly that no season is allowed its purpose. Where a standard would call the second one buffer management, the Word calls it a time to every purpose, and means something larger by it.',
    },
    quiz: {
      questions: [
        {
          q: 'What two facts does Nehemiah 6:15 record about the finished wall?',
          options: [
            'That it was strong and that the people rejoiced',
            'The calendar date it was finished, and the elapsed duration — fifty and two days',
            'The cost and the number of workers',
          ],
          answer: 1,
          explain: 'A completion date and a duration, in one verse — a baseline reported against actuals.',
        },
        {
          q: 'What makes a milestone useful, according to this lesson?',
          options: [
            'That it marks a period when work is happening',
            'That it marks something verifiably DONE, with acceptance criteria',
            'That it is set by the person paying for the work',
          ],
          answer: 1,
          explain: 'Activity-based milestones are why a project can report seventy percent complete for months. A completion can be checked; an activity cannot.',
        },
        {
          q: 'How does Proverbs 27:23 frame knowing the state of the work?',
          options: [
            'As a reporting overhead to minimise',
            'As a commanded diligence — be thou diligent to know the state',
            'As the owner’s responsibility rather than the steward’s',
          ],
          answer: 1,
          explain: '"Be thou diligent to know the state of thy flocks, and look well to thy herds." Status is a stewardship duty, and it is ongoing.',
        },
      ],
    },
  },
  {
    id: 'pm6-the-counsellors-you-secure',
    title: 'Securing the experts — the multitude of counsellors, and the meeting that gets you the details',
    bigIdea: 'Three times Proverbs makes the same structural claim, and each time it is about outcomes rather than courtesy. "Where no counsel is, the people fall: but in the multitude of counsellors there is safety" (Proverbs 11:14). "Without counsel purposes are disappointed: but in the multitude of counsellors they are established" (Proverbs 15:22). "For by wise counsel thou shalt make thy war: and in multitude of counsellors there is safety" (Proverbs 24:6). Purposes are ESTABLISHED by counsel — the plan itself becomes solid, not just better received. Darrell named the mechanism precisely: meetings to secure quality subject matter experts in order for them to give us the details associated with the things we need to be able to see clearly. The expert is not there to approve you. The expert is there so you can SEE.',
    inApp: 'Name the three things on your project you cannot currently see clearly — the structural question, the code question, the number you are guessing at. For each one, name a specific person who could see it, and write the ONE question you would ask them. Then book it. A meeting with one specific question gets you a detail; a meeting to discuss the project gets you an opinion.',
    anchor: {
      ref: 'Proverbs 11:14; Proverbs 15:22; Proverbs 24:6; Proverbs 18:13',
      theme: 'Counsel is given three times as a structural claim about outcomes: without it people fall and purposes are disappointed; with a multitude of it there is safety and purposes are established. Proverbs 18:13 names the failure it prevents: "He that answereth a matter before he heareth it, it is folly and shame unto him" — answering before hearing is named as folly, which is precisely what a project manager does when he estimates a trade he has never consulted.',
    },
    benefits: [
      'Your unknowns become a named list with a named person beside each, instead of a vague unease.',
      'Meetings get a single question, which is what turns them into details instead of opinions.',
      'Proverbs 18:13 gives you the reason to stop estimating trades you have not consulted.',
      'Counsel stops being about approval and becomes about sight — which is what he actually asked for.',
    ],
    levels: {
      child: 'This lesson is about securing experts, a multitude of counsellors, and a meeting that gets you the details. An expert is a person who knows a lot about one thing. The Bible says good plans need many wise helpers. It says it three times in the book of Proverbs. When people have no good advice, they fall. When they have many wise helpers, they are safe. So when you do not know something, do not just guess. Go and ask a person who knows. Here is a good way to ask. Bring ONE clear question. Do not just say, what do you think of my plan? Ask something like, will this shelf hold these heavy books? A clear question gets a clear answer. The Bible also says it is foolish to answer before you listen. So listen first, then decide. Meeting with the right helper is like turning on a light. The helper is not there to say yes to you. The helper is there so you can see. When you can see, your plan gets strong and safe.',
      youth: 'Securing the experts: the multitude of counsellors, and the meeting that gets you the details. Proverbs says the same thing three separate times. Where there is no counsel, people fall. Without counsel, plans are disappointed. In the multitude of counsellors, there is safety, and plans are established. Established means the plan itself becomes solid, not just more popular. Darrell named why you meet with experts. It is to get the details you need so you can see clearly. The expert is not there to approve you. The expert is there so you can SEE. So when something on your project is unclear, do not guess carefully. Go and get the person who actually knows. And go with one specific question. If you ask someone to look at your project, you get an opinion. If you ask whether this beam will hold a second floor, you get a fact. Proverbs 18:13 warns about the other way: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). Guessing at a trade you never talked to is exactly that. Try it. Name three things on your project you cannot see clearly. For each one, name a person who could see it, and write the one question you would ask. Then set the meeting.',
      teen: 'Securing the experts: the multitude of counsellors, and the meeting that gets you the details. Proverbs says the same thing three separate times, which is how you know it matters. Without counsel, people fall and plans get disappointed. With a lot of good counsellors, there is safety and plans get established — meaning the plan itself gets solid. So when you do not understand something on your project, the answer is not to guess carefully. The answer is to go get the person who actually knows. And here is how to do it well: go with ONE specific question. If you ask somebody to look at your project, you get an opinion. If you ask whether this beam will carry a second floor, you get a fact. Proverbs also warns about the opposite of this: answering something before you have heard it is called folly and shame. That is exactly what guessing at a trade you never talked to is.',
      senior: 'Securing the experts, the multitude of counsellors, and the meeting that gets you the details: PMBOK calls it expert judgment and lists it as a tool in almost every process group, and it calls the surrounding work stakeholder engagement. Proverbs makes the stronger claim: counsel does not merely improve a plan’s reception, it ESTABLISHES the purpose — the plan’s soundness is itself a function of the counsel that went into it. Three separate proverbs say it, and one of them frames it as warfare, where being wrong is expensive and immediate. The operational insight in Darrell’s own framing is the point of the meeting: not validation, but sight — the details associated with the things we need to be able to SEE clearly. That distinction changes how the meeting is run. A validation meeting seeks assent and gets it; a sight meeting arrives with one bounded question and leaves with a fact, a number, or a named constraint. Proverbs 18:13 then supplies the discipline’s negative case, and it is unusually direct: answering a matter before hearing it is folly and shame. Applied to estimating, it indicts the common practice of pricing a trade from memory rather than from a conversation with someone who does it — which is where a rehab budget most reliably breaks.',
    },
    quiz: {
      questions: [
        {
          q: 'What does Proverbs 15:22 say a multitude of counsellors does to purposes?',
          options: [
            'Makes them more popular',
            'Establishes them — the plan itself becomes solid',
            'Slows them down but improves them',
          ],
          answer: 1,
          explain: '"Without counsel purposes are disappointed: but in the multitude of counsellors they are established." The claim is about the plan’s soundness, not its reception.',
        },
        {
          q: 'What is the purpose of the expert meeting, in Darrell’s own framing?',
          options: [
            'To get approval for the plan you already made',
            'To get the details so you can SEE clearly',
            'To share responsibility if it goes wrong',
          ],
          answer: 1,
          explain: 'Sight, not validation. A validation meeting seeks assent and gets it; a sight meeting arrives with one question and leaves with a fact.',
        },
        {
          q: 'What does Proverbs 18:13 call answering a matter before hearing it?',
          options: [
            'Decisiveness',
            'Folly and shame',
            'An acceptable risk under time pressure',
          ],
          answer: 1,
          explain: '"it is folly and shame unto him." Applied to estimating, it indicts pricing a trade from memory rather than from the person who does it.',
        },
      ],
    },
  },
  {
    id: 'pm7-the-watchman-and-the-risk',
    title: 'Risk — the watch set day and night, and the watchman who is held responsible for silence',
    bigIdea: 'Nehemiah 4:9 puts prayer and a posted watch in the same sentence: "Nevertheless we made our prayer unto our God, and set a watch against them day and night, because of them." Both. Not prayer instead of a watch, and not a watch instead of prayer. And Ezekiel 33:6 makes the watchman’s silence a liability with a named consequence: if the watchman sees the sword come and blows not the trumpet, the blood is required at HIS hand. Read as project management, that is the whole doctrine of risk. Risks are identified in advance, a watch is assigned to them, and the person who sees the risk materialise and says nothing carries the cost. Most project disasters were seen by somebody who did not blow the trumpet.',
    inApp: 'Write the five things most likely to hurt your project. Beside each, name the person watching it and the signal they are watching FOR — not keep an eye on the budget, but tell me the day any line item exceeds its estimate by ten percent. Then tell each of those people out loud that they are the watchman on that one, and that saying it early is their job and never a complaint.',
    anchor: {
      ref: 'Nehemiah 4:9; Ezekiel 33:6; Proverbs 13:16',
      theme: 'Prayer and a posted watch, together, in one verse. Ezekiel 33:6 makes silence in the face of a seen danger a liability rather than discretion. Proverbs 13:16 names the underlying disposition: "Every prudent man dealeth with knowledge: but a fool layeth open his folly" — dealing with knowledge is the prudent man’s method, and exposure is what happens without it.',
    },
    benefits: [
      'Risks get a watchman and a specific signal instead of a general sense of concern.',
      'Raising a problem early becomes an assigned duty, which is the only thing that makes people actually do it.',
      'The false choice between praying about it and preparing for it gets closed by one verse.',
      'You find out which dangers nobody is actually watching — usually the ones everybody assumes someone else has.',
    ],
    levels: {
      child: 'This lesson is about risk, and the watchman who kept watch day and night. A risk is a thing that could go wrong. A watchman is a person whose job is to watch for danger. When Nehemiah built the wall, some people wanted to stop it. So Nehemiah did two things. He prayed to Yahweh. And he put guards on the wall, day and night. He did both, not just one. The Bible also tells what a watchman must do. If he sees danger coming, he must blow a loud horn to warn everyone. If he sees it and stays quiet, that is on him. Silence is not okay when you see danger. Here is what this means for you. When you work on a big job, think about what could go wrong. Pick someone to watch each thing. Tell them what to look for. And tell them that speaking up early is their job. It is never just complaining. When someone warns you, say thank you. A warning that comes early can save the whole job.',
      youth: 'Risk: the watch was set day and night, and the watchman is held responsible for his silence. When enemies threatened Nehemiah\'s wall, he did two things in one sentence: "Nevertheless we made our prayer unto our God, and set a watch against them day and night" (Nehemiah 4:9). Prayer and guards, both. Not one instead of the other. Then Ezekiel 33:6 gives the watchman\'s rule. If he sees the sword coming and does not blow the trumpet, the loss is on him. That is strong, and it is right for a project too. If you can see a problem coming and you say nothing, part of that problem becomes yours. That is why most project disasters were seen by somebody who did not speak. So make watching someone\'s real job. Watch the budget is too vague to do. Tell me the day any item goes ten percent over is a job a person can do. Proverbs 13:16 says the prudent man deals with knowledge. Knowing your risks is how you deal with them. Try it. Write the five things most likely to hurt your project. Next to each, name the person watching it and the signal they are watching for. Then tell each one out loud that saying it early is doing their job, and never complaining.',
      teen: 'Risk, the watch set day and night, and the watchman held responsible for silence: When Nehemiah’s enemies threatened the wall, he did two things in the same breath: he prayed, and he posted guards day and night. Both. Not one instead of the other. Then Ezekiel gives the rule for the guard: if the watchman sees the sword coming and does not blow the trumpet, the deaths are on him. That is strong language, and it is exactly right for a project. If you can see a problem coming and you say nothing, the problem becomes partly yours. So make it somebody’s actual job. Not watch the budget — that is too vague to do. Something like: tell me the day any item goes ten percent over. Then saying it early is doing your job, not complaining.',
      senior: 'Risk: the watch set day and night, and the watchman who is held responsible for silence. The industry calls it the risk register, and the three columns that make it work are the risk, the owner, and the trigger — the observable signal that says this has moved from possible to happening. Nehemiah 4:9 and Ezekiel 33:6 supply all three with unusual force. The watch is posted against a named threat, it is continuous rather than periodic, and the watchman’s failure to raise the alarm carries personal liability. That last element is what most risk registers lack in practice: everyone can name the risk and no one is accountable for noticing it arrive. Ezekiel 33:6 also settles a cultural question that decides whether a register is real — whether raising a concern is loyal or disloyal. In a house where the trumpet is unwelcome, the register is decoration. Nehemiah 4:9 closes the other failure, the false dilemma between faith and preparation, and it closes it in a single sentence that does both without apology. Proverbs 13:16 gives the disposition underneath: the prudent man deals with knowledge, which is an active verb, while folly is simply laid open — exposure is the default and prudence is the intervention.',
    },
    quiz: {
      questions: [
        {
          q: 'What two things did Nehemiah do about the threat, in the same verse?',
          options: [
            'Prayed, and trusted Yahweh to defend the wall',
            'Made prayer unto Yahweh AND set a watch day and night',
            'Set a watch, and sent messengers to negotiate',
          ],
          answer: 1,
          explain: 'Nehemiah 4:9 does both without apology, closing the false choice between praying about a danger and preparing for it.',
        },
        {
          q: 'In Ezekiel 33:6, what happens if the watchman sees the sword and blows not the trumpet?',
          options: [
            'He is replaced by another watchman',
            'The blood is required at his hand',
            'The people are warned by someone else',
          ],
          answer: 1,
          explain: 'Silence in the face of a seen danger is a liability, not discretion. Most project disasters were seen by someone who said nothing.',
        },
        {
          q: 'What makes a risk entry actually workable?',
          options: [
            'A clear description and a severity rating',
            'A named owner and an observable trigger — the signal that says it is happening now',
            'Executive visibility',
          ],
          answer: 1,
          explain: 'Everyone can name a risk; the register is only real when someone is accountable for noticing it arrive.',
        },
      ],
    },
  },
  {
    id: 'pm8-the-plumbline',
    title: 'Quality — the plumbline in His own hand, and why an opinion is not a standard',
    bigIdea: 'Amos sees Yahweh standing on a wall made by a plumbline, with a plumbline in His hand, and He says: "Behold, I will set a plumbline in the midst of my people Israel" (Amos 7:7-8). A plumbline does not argue. It does not care who built the wall or how hard they worked or how late it is. It is an external, physical reference that reports one fact: plumb, or not plumb. That is the difference between quality assurance and somebody’s opinion at the end. Zechariah 4:10 puts the plummet in Zerubbabel’s hand during the rebuild and calls the eyes of Yahweh running to and fro through the whole earth — inspection is not distrust, it is sight. And Deuteronomy 25:13-15 forbids divers weights outright: one measure, not a generous one for us and a strict one for them.',
    inApp: 'For the next piece of work on your project, write the acceptance criterion BEFORE the work starts — the specific, checkable fact that means done. Then have someone other than the person doing the work check it against that written criterion. If you cannot write a checkable criterion, you do not yet have a standard; you have a preference, and a preference cannot be inspected.',
    anchor: {
      ref: 'Amos 7:7-8; Zechariah 4:10; Deuteronomy 25:13-15; Proverbs 11:1',
      theme: 'An external reference held in His own hand, reporting one fact without regard for effort or standing. Zechariah 4:10 puts the plummet in the builder’s hand mid-rebuild and refuses to despise the day of small things. Deuteronomy 25:13-15 and Proverbs 11:1 forbid two measures: "A false balance is abomination to the LORD: but a just weight is his delight" — one standard, applied the same to everyone, including us.',
    },
    benefits: [
      'Acceptance criteria get written before the work, which is the only time they can be written honestly.',
      'Inspection stops reading as distrust and starts reading as sight — the eyes running to and fro.',
      'You cannot hold a contractor to a standard you have not applied to yourself; Proverbs 11:1 closes that door.',
      'A preference gets distinguished from a standard, and only one of the two can be checked.',
    ],
    levels: {
      child: 'This lesson is about quality, and a plumbline in His hand. A plumbline is a heavy weight on a string. When you hold it up, it hangs straight down. Builders use it to see if a wall is straight. The plumbline does not care who built the wall. It does not care how hard they worked. It only shows one thing. Straight, or not straight. The prophet Amos saw Yahweh holding a plumbline. Yahweh was showing that His way is the true measure. An opinion is not the same as a standard. An opinion is what someone thinks. A standard is a true measure that gives the same answer for everyone. The Bible also says to use one fair measure for all. Do not use one for your friends and a different one for everyone else. So before you start a job, say what done right looks like. Make it something anyone can check. Then let someone else check it. That is how we build straight and fair.',
      youth: 'Quality: the plumbline is in His own hand, and an opinion is not a standard. A plumbline is a weight on a string. Hang it, and it shows straight down every time. It does not care how hard you worked, who you are, or how late the job is. It tells one fact: plumb or not plumb. Amos saw Yahweh standing on a wall with a plumbline in His hand, and He said He would set a plumbline among His people (Amos 7:7-8). That is what a real standard is. It sits outside of you and gives the same answer no matter who asks. Zechariah 4:10 shows the plummet in the builder\'s hand while the work is still going on, so checking happens during the job and not only at the end. It also says not to despise the day of small things, so small parts get checked too. And Deuteronomy 25 forbids two different weights, one easy one for us and one hard one for others. Proverbs 11:1 says a false balance is hated by the LORD and a just weight is His delight. Here is how to use it. Before a piece of work starts, write down what done right means in a way someone could check. Then let someone else check it. If you cannot write it checkably, you have a preference, not a standard, and nobody can inspect a preference.',
      teen: 'Quality, the plumbline in His own hand, and why an opinion is not a standard: A plumbline is a weight on a string. Hang it and it shows you straight down, every time. It does not care how hard you worked or how late the job is running. It tells you one thing: is this wall straight or not. Amos sees Yahweh holding one. That is what a real standard is — something outside of you that gives the same answer no matter who is asking. The practical version: before you start a piece of work, write down what DONE RIGHT actually means in a way someone could check. Then let someone else check it. If you cannot write it down checkably, you do not have a standard, you just have a preference — and nobody can inspect a preference.',
      senior: 'Quality: the plumbline in His own hand, and why an opinion is not a standard. The industry separates quality assurance (is the process capable of producing conformance) from quality control (does this artifact conform), and both depend on a specification written before the work rather than negotiated after it. Amos 7:7-8 is the specification as external physical reference, and the force of the image is its indifference: a plumbline reports plumb or not plumb without regard to the builder’s effort, intention or standing, which is exactly the property a standard must have to be worth anything. Zechariah 4:10 adds two things — the plummet in the builder’s own hand during the work, which is inspection as continuous rather than terminal, and the refusal to despise the day of small things, which is worth holding against the temptation to inspect only the impressive parts. Then Deuteronomy 25:13-15 and Proverbs 11:1 close the loop that most quality programmes leave open: divers weights are forbidden, a great and a small, which in project terms means the standard applied to the subcontractor is the standard applied to our own volunteers and to us. A church that inspects its contractor and waves its own work through is running a false balance, and Proverbs 11:1 calls that an abomination rather than an inconsistency.',
    },
    quiz: {
      questions: [
        {
          q: 'What property makes a plumbline a standard rather than an opinion?',
          options: [
            'It was given by a prophet',
            'It reports one fact without regard for the builder’s effort or standing',
            'It is difficult to argue with in public',
          ],
          answer: 1,
          explain: 'Its indifference is the point. A plumbline gives the same answer regardless of who is asking or how hard they worked.',
        },
        {
          q: 'When should an acceptance criterion be written?',
          options: [
            'After the work, when you can see what was achievable',
            'Before the work starts — it is the only time it can be written honestly',
            'Whenever a dispute arises',
          ],
          answer: 1,
          explain: 'A criterion negotiated after the work is a negotiation, not a standard. Written first, it can be checked.',
        },
        {
          q: 'What do Deuteronomy 25:13-15 and Proverbs 11:1 forbid?',
          options: [
            'Inspecting another man’s work',
            'Divers weights — one measure for them and another for us',
            'Charging for inspection',
          ],
          answer: 1,
          explain: '"A false balance is abomination to the LORD." The standard applied to the subcontractor is the standard applied to our own work.',
        },
      ],
    },
  },
  {
    id: 'pm9-the-change-you-put-down',
    title: 'Change, and the sunk cost you have to put down — stopping is a legitimate outcome',
    bigIdea: 'Paul says something a project manager needs and rarely hears: "I count not myself to have apprehended: but this one thing I do, forgetting those things which are behind, and reaching forth unto those things which are before" (Philippians 3:13). Read it beside Luke 9:62 — no man having put his hand to the plough, and looking back, is fit — and you have both halves of the hardest decision in project work. Commitment forward, and a refusal to be governed by what is already spent. The industry calls the trap the sunk cost fallacy; Scripture treats the backward look as a disqualifying posture. Both point the same way: the money already spent is information about the past, and the decision in front of you is about the future. A project stopped for the right reason is a success, and it needs to be recorded as one.',
    inApp: 'Write the amount already spent on your project. Now cover it with your hand and answer one question as if it were day one: knowing what you know NOW, would you commit to this? If the honest answer is no, the next step is a written recommendation to change or stop, with the reason — not another month of momentum. And if the answer is yes, you have just re-earned the commitment on current facts, which is worth having.',
    anchor: {
      ref: 'Philippians 3:13; Luke 9:62; Proverbs 13:16',
      theme: 'Forgetting what is behind and reaching toward what is before, paired with a refusal of the backward look at the plough. Proverbs 13:16 supplies the method rather than the mood: "Every prudent man dealeth with knowledge" — the prudent decision is made on the knowledge you have now, which is not the knowledge you had when you committed.',
    },
    benefits: [
      'Sunk cost stops steering the decision, because you decide with the number covered.',
      'Stopping becomes a nameable, recordable outcome instead of an admission of failure.',
      'A continuing project gets its commitment re-earned on current facts, which is worth more than momentum.',
      'The backward look gets named as a posture problem rather than a financial one, which is what it actually is.',
    ],
    levels: {
      child: 'This lesson is about change, and the sunk cost you have to put down. Sunk cost means the time or money you already used up. You cannot get it back. Stopping can be a good choice. Here is a story. Say you spent a lot of time on a big puzzle. Then you find out a lot of the pieces are missing. You will never finish it. Should you keep going just because you spent so much time? No. The time is already gone. It should not make the choice for you. Paul said he forgets what is behind and reaches for what is ahead. Jesus said a person who puts his hand to the plow and keeps looking back is not fit for the kingdom of God (Luke 9:62). So when something changes, ask a new question. If I were starting today, and I knew what I know now, would I still start this? If the answer is no, it is okay to stop. Tell someone why. Stopping for a good reason is not failing. It is being wise with what Yahweh gave you.',
      youth: 'Change, and the sunk cost you have to put down: stopping is a legitimate outcome. Here is the hardest thing in project work. You have spent money and months, and now you learn something that changes the whole picture. The money already spent cannot come back, whatever you choose next. So it should not get a vote. That trap is called the sunk cost fallacy. Paul wrote about the posture that beats it: "forgetting those things which are behind, and reaching forth unto those things which are before" (Philippians 3:13). Notice he also said he had not arrived yet, and he kept going anyway. Not knowing everything and still moving forward is normal on every real project. Jesus said no man who puts his hand to the plough and looks back is fit for the kingdom. And Proverbs 13:16 says the prudent man deals with knowledge, which means the knowledge you have now, not what you had on day one. So try this. Write down what you have already spent. Cover it with your hand. Then ask: if today were day one and I knew what I know now, would I start this? If the answer is no, write that down with the reason. If the answer is yes, you have just earned the right to keep going. Either way, stopping for a good reason is a success and should be recorded as one.',
      teen: 'Change, and the sunk cost you have to put down, because stopping is a legitimate outcome. Here is the hardest thing in project work. You have already spent money and months, and now you find out something that changes the picture. The money already spent CANNOT come back, whatever you choose next. So it should not get a vote. Paul says he forgets what is behind and reaches toward what is ahead. Jesus says the man who puts his hand to the plough and keeps looking back is not fit for the work. So do this: write down what you have already spent, cover it with your hand, and ask — if today were day one and I knew what I know now, would I start this? If the answer is no, say so in writing. Stopping something for a good reason is not failing. Dragging it on because of what you already spent is.',
      senior: 'Change, and the sunk cost you have to put down: stopping is a legitimate outcome. The industry calls it the sunk cost fallacy and formalises the remedy as a stage gate: a scheduled reconsideration at which continuation must be re-justified on current information rather than inherited. Philippians 3:13 and Luke 9:62 give the posture that makes a gate survivable, which is the harder part — a gate is procedurally easy and psychologically brutal, because the person who must recommend stopping is usually the person who championed starting. That is where the humility L173 teaches stops being devotional and becomes operational: a man who cannot be wrong cannot recommend the stop, so his pride has become a blocked input at the exact moment the project needed the truth most. Note what Philippians 3:13 actually claims — Paul does not count himself to have apprehended, and then acts anyway. Unfinished understanding plus forward commitment, which is the working condition of every real project. Where a standard treats termination as an exception path, this lesson insists a project stopped for the right reason is a successful outcome and must be recorded as one, because a house that only records completions teaches its people that stopping is disgrace, and then nothing ever stops.',
    },
    quiz: {
      questions: [
        {
          q: 'Why should money already spent not influence the decision to continue?',
          options: [
            'Because it was probably wasted anyway',
            'Because it cannot be recovered by any choice, so it is information about the past, not the future',
            'Because accounting treats it separately',
          ],
          answer: 1,
          explain: 'The sunk cost is unrecoverable whichever way you choose, so it has no bearing on which choice is better from here.',
        },
        {
          q: 'How does this lesson connect humility to the stop decision?',
          options: [
            'Humility means accepting whatever the sponsor decides',
            'A man who cannot be wrong cannot recommend the stop — his pride becomes a blocked input',
            'Humility means always deferring to the original plan',
          ],
          answer: 1,
          explain: 'The person who must recommend stopping is usually the one who championed starting. That is where humility becomes operational rather than devotional.',
        },
        {
          q: 'How should a project stopped for the right reason be recorded?',
          options: [
            'Quietly, to protect the people involved',
            'As a successful outcome — a house that only records completions teaches that stopping is disgrace',
            'As a failure, so lessons are learned',
          ],
          answer: 1,
          explain: 'If stopping can only be recorded as failure, nothing will ever stop, and the next bad project will run to the end too.',
        },
      ],
    },
  },
  {
    id: 'pm10-the-record-that-outlives-it',
    title: 'Closing it out — the register, the written vision, and the capability that outlives you',
    bigIdea: 'Nehemiah finishes the wall and immediately does something that looks like an afterthought and is not: he gathers the people to be reckoned, and finds a register (Nehemiah 7:5). The wall was the deliverable; the register is what makes the city governable afterwards. Habakkuk 2:2 gives the reason a record must be written in a particular way: "Write the vision, and make it plain upon tables, that he may run that readeth it." Plain enough to be RUN by someone who was not in the room. And 2 Timothy 2:2 extends the chain past the record to the people: commit it to faithful men, who shall be able to teach others also. A project that finishes and leaves nothing behind but a building has finished only half of what it was for.',
    inApp: 'Write your project’s handover in one page that someone who was never involved could run from: what exists now, who maintains it, what breaks first, who to call, and what you would do differently. Then give it to one specific person and confirm they can run it. The test is not whether the page is thorough. The test is whether a stranger can run it.',
    anchor: {
      ref: 'Nehemiah 7:5; Habakkuk 2:2; 2 Timothy 2:2; Luke 16:10-12',
      theme: 'The register gathered after the wall was finished, and a vision written plain enough to be run by a reader who was not present. 2 Timothy 2:2 carries the chain four links deep — heard, committed to faithful men, able to teach others also. And Luke 16:10-12 grounds the whole course: "He that is faithful in that which is least is faithful also in much." The small project, closed out properly, is the evidence on which the larger one is entrusted.',
    },
    benefits: [
      'The handover gets tested against a stranger rather than against your own memory.',
      'Closeout becomes part of the project rather than the thing that never quite happened.',
      'What you would do differently gets written while you still remember it, which is the only time it is accurate.',
      'Luke 16:10-12 reframes the small job: it is the evidence on which the bigger one is committed to you.',
    ],
    levels: {
      child: 'This lesson is about closing out a job, the register, the written vision, and the skill that lives on after you. When Nehemiah finished the wall, he did not just walk away. He gathered the people. He found a list of names, called a register. The wall was done, but the list helped the city work well after that. The prophet Habakkuk was told to write the vision down plain, so a person who reads it can run with it. Plain means simple and clear. It means someone who was not there can still use it. Here is what that means for you. When you finish a big job, write down what you made. Write who will take care of it. Write what might break first. Write who to call for help. Then give your page to someone and see if they can use it. Jesus also said that if you are faithful with a little, you will be trusted with a lot. A small job finished well is how Yahweh grows you for bigger jobs.',
      youth: 'Closing it out: the register, the written vision, and the capability that outlives you. Nehemiah finished the wall, and the very next thing he did looks like an afterthought, but it is not. He gathered the people to be counted and found a register, the record of who was who (Nehemiah 7:5). The wall was the thing they built. The register is what made the city work afterward. Habakkuk 2:2 gives the rule for writing the record: "Write the vision, and make it plain upon tables, that he may run that readeth it" (Habakkuk 2:2). Plain enough to run means plain enough for someone who was not in the room. So the test is not how long or detailed your notes are. The test is whether a stranger can use them. Paul told Timothy to pass things on to faithful people who can teach others too, so the work keeps going after you. And Jesus said, "He that is faithful in that which is least is faithful also in much" (Luke 16:10). A small project closed out properly is the proof that gets you trusted with a bigger one. Try this. When a project ends, write one page: what exists now, who takes care of it, what breaks first, who to call, and what you would do differently. Then hand it to one person and check that they can run it.',
      teen: 'Closing it out: the register, the written vision, and the capability that outlives you. Nehemiah finished the wall and then did something that sounds boring but is not: he gathered everybody and found the register, the record of who was who. The wall was the thing they built. The record was what made the city work afterwards. Habakkuk says to write the vision plain enough that somebody can RUN it just by reading it — which means plain enough for a person who was not there. So when your project is done, write one page a total stranger could work from: what exists, who takes care of it, what breaks first, who to call, what you would do differently. Then hand it to someone and see if they can actually use it. And remember what Jesus said: whoever is faithful with a little is trusted with a lot. The small job done properly is the reason you get the big one.',
      senior: 'Closing it out, the register, the written vision, and the capability that outlives its builder: The industry calls it closeout and splits it into three artifacts — the as-built record, the operations handover, and lessons learned — and it is the phase most reliably skipped, because the deliverable is already visible and the team has already been reassigned. Nehemiah 7:5 shows the pattern held: the wall is complete and the very next recorded act is the gathering and the register, which is the governance artifact the completed wall requires in order to be worth anything. Habakkuk 2:2 supplies the writing standard, and it is a usability standard rather than a completeness one — plain upon tables, that he may run that readeth it. The test is the reader’s ability to run it, which is why a thorough document that only its author can use has failed the actual criterion. 2 Timothy 2:2 extends closeout past documentation into succession, four links deep, which is the same answer Exodus 35:34 gave to single-person capability earlier in this course. Luke 16:10-12 then states the grounds on which larger stewardship is committed, and it states them twice, positively and negatively: faithful in least, faithful in much; unjust in the least, unjust also in much. The closeout nobody watches is precisely where that faithfulness is demonstrated or is not.',
    },
    quiz: {
      questions: [
        {
          q: 'What did Nehemiah do immediately after the wall was finished?',
          options: [
            'Held a dedication and dismissed the workers',
            'Gathered the people to be reckoned, and found a register',
            'Began planning the next section of wall',
          ],
          answer: 1,
          explain: 'Nehemiah 7:5. The wall was the deliverable; the register is what made the city governable afterwards.',
        },
        {
          q: 'What standard does Habakkuk 2:2 set for the written record?',
          options: [
            'That it be complete and thorough',
            'That it be plain enough that he may run that readeth it — a usability test, not a completeness one',
            'That it be kept by the leader',
          ],
          answer: 1,
          explain: 'The test is whether a reader who was not present can run it. A thorough document only its author can use has failed the criterion.',
        },
        {
          q: 'How does Luke 16:10-12 ground the whole course?',
          options: [
            'By warning against loving money',
            'By making faithfulness in the least the grounds on which much is committed',
            'By teaching that small projects do not matter',
          ],
          answer: 1,
          explain: '"He that is faithful in that which is least is faithful also in much." The small project closed out properly is the evidence for the larger one.',
        },
      ],
    },
  },
  {
    id: 'pm11-how-the-organization-learns-prioritizes-and-decides',
    title: 'How the organization learns, prioritizes and decides — from information to decision-ready intelligence, with our ways inspected',
    bigIdea: 'Darrell brought the next evolution of this course in two sentences on 2026-09-24. The first: PoeTech designs repeatable governance systems that help organizations recognize patterns, surface risks, and make better decisions without depending on one person\'s institutional knowledge. The second: senior leaders are not drowning in tasks; they are drowning in information. Every organization already has meetings, emails, tickets, project boards, documents and recordings, and the challenge is that no one can see the pattern across them. That is where intelligence becomes valuable. And he added the part that keeps it from being a management lesson: the same work is prudence, and it is how we show Yahweh our love, by letting our ways be inspected for their quality and their quantity from His perspective, so that His will is done in earth as it is in heaven. The Word has the whole shape first. Moses sat alone from morning to evening while the people stood, and his father in law named the failure of a governance system that lived in one head: "Thou wilt surely wear away, both thou, and this people that is with thee: for this thing is too heavy for thee; thou art not able to perform it thyself alone" (Exodus 18:18). The remedy was a repeatable structure with an escalation rule, "every great matter they shall bring unto thee, but every small matter they shall judge" (Exodus 18:22). Joseph read a fourteen-year pattern nobody else could see and turned it into a system with officers and a stored fifth (Genesis 41:34). The men of Issachar "had understanding of the times, to know what Israel ought to do" (1 Chronicles 12:32). The apostles, drowning in tables, prioritized by calling and delegated the rest (Acts 6:2-4). And the standard for the whole enterprise is inspection from Yahweh\'s side, not ours: "Consider your ways" (Haggai 1:5), with a ledger of quantities beside it, and "Wherefore by their fruits ye shall know them" (Matthew 7:20) for the quality. The industry calls this decision intelligence and decision support. The Word calls it prudence, counsel, and a written vision that others can run.',
    inApp: 'Take one organization you serve — a church office, a ministry, a family business, a board. Name its six information streams on one line each: meetings, emails, tickets or requests, project boards, documents, recordings. Then write the one pattern across them that nobody has said out loud (the same request arriving through three streams; a risk visible in the recordings that never reaches the board). Under it, write two inspections from Yahweh\'s side: the quantity (what was sown and what came in, Haggai 1:6) and the quality (the fruit, Matthew 7:16). Finally write who else could run this page if you were gone. If the answer is nobody, that is the finding. In the app: open Admin → OpsBoard and read the purpose line at its top, then read the lane below it and ask which of the three verbs each row serves.',
    anchor: {
      ref: 'Exodus 18:13-23; Genesis 41:33-36; 1 Chronicles 12:32; Acts 6:1-4; Haggai 1:5-7; Matthew 7:16-20; Matthew 6:10; Proverbs 11:14; Habakkuk 2:2',
      theme: 'Jethro names the governance system that lives in one head as the thing that wears everyone away, and gives Moses a repeatable structure with an escalation rule; Joseph reads the pattern across the years and turns it into officers and a stored fifth; Issachar understands the times so Israel knows what to do; the apostles prioritize by calling. The standard over all of it is inspection from Yahweh\'s side, quantity and quality, so that His will is done in earth as it is in heaven.',
    },
    benefits: [
      'You stop reading Exodus 18 as a story about a tired man and start reading it as the first governance design in the Word: a structure, an escalation rule, and a named consequence for keeping it all in one head.',
      'You learn to name the information streams an organization already has, and to look for the pattern across them rather than the task inside one of them.',
      'Prioritization gets a biblical test: the apostles did not do everything; they kept prayer and the Word and appointed seven for the tables. What is your calling, and what belongs to the seven?',
      'Inspection stops being something done to you and becomes something you invite from Yahweh\'s side, in two columns: how much, and of what sort.',
      'Prudence gets its plain definition: "the prudent man looketh well to his going" (Proverbs 14:15). Seeing the pattern before the loss is prudence, and prudence is love shown by keeping His commandments.',
      'The industry\'s names — decision intelligence, decision support, governance — become a vocabulary for a shape the Word gave first, which is why they are easier to hold once the Word\'s case is in you.',
    ],
    levels: {
      child: 'This lesson is about how an organization learns, prioritizes and decides, and how our ways are inspected. An organization is a group that works together, like a church or a team. Prioritizes means it picks what comes first. Decides means it makes a choice. Information is all the things people say and write down. When there is too much, it is hard to see what matters. So the group needs a good way to turn it into a clear choice. Moses tried to do every job by himself. His father-in-law Jethro said that was not good. It would wear out Moses and the people too. So Jethro helped him pick good helpers. Small problems went to the helpers. Big problems went to Moses. Joseph saw that seven good years and seven hungry years were coming. So he made a plan and stored food for later. Some men long ago understood the times, so they knew what to do. The helpers of Jesus let others serve the food, so they could pray and teach. Yahweh looks at our work. He sees how much we did and how good it was. We are glad to let Him check it, because we love Him. That is one way we show Him our love. That is how His will gets done here, like in heaven.',
      youth: 'How the organization learns, prioritizes and decides: turning information into decision-ready intelligence, with our ways inspected by Yahweh. Darrell said leaders today are not drowning in tasks. They are drowning in information: meetings, emails, requests, project boards, documents and recordings. Nobody can see the pattern across all of it. Seeing that pattern and making it something the whole group can act on is the job. The Word has the shape first. Moses sat alone from morning until evening while the people stood in line. His father-in-law Jethro said it was not good, because Moses and the people would both wear away. The whole system lived in one head. Jethro gave him a structure that did not depend on Moses remembering everything: leaders over groups, and one rule, big matters up and small matters settled below. Joseph read a pattern of fourteen years that nobody else could see, then turned it into officers and stored grain so the country could act (Genesis 41:34). The men of Issachar understood the times and knew what Israel should do. The apostles, buried in serving tables, kept prayer and the Word and gave the tables to seven chosen men. That is choosing by calling. And here is what keeps it from being only business. Yahweh inspects our ways, and we welcome it because we love Him. He said, "Consider your ways" (Haggai 1:5), and then He counted what they sowed and what came in. That is quantity. Jesus said we are known by our fruits. That is quality. A group that can see, decide, and be inspected is one way His will is done on earth as it is in heaven. The industry calls this decision intelligence.',
      teen: 'How the organization learns, prioritizes and decides: from information to decision-ready intelligence, with our ways inspected. Moses had a real problem: everybody with a question stood in line for him from morning until night. His father in law Jethro watched one day and said what nobody else would: "The thing that thou doest is not good" (Exodus 18:17). Not because Moses was lazy. Because the whole system lived inside one person, and "thou art not able to perform it thyself alone" (Exodus 18:18). Jethro gave him a design: leaders over thousands, hundreds, fifties and tens, with one rule for what goes up the chain, "every great matter they shall bring unto thee, but every small matter they shall judge" (Exodus 18:22). That is a governance system. It does not depend on Moses remembering everything. Joseph did something like it in Egypt: he saw a pattern across fourteen years that nobody else could see, and instead of just knowing it, he built officers and storehouses so the country could act on it (Genesis 41:34). The apostles did it too when the widows were being missed: they did not try to do everything; they kept prayer and the Word and appointed seven people for the tables (Acts 6:3-4). That is prioritizing by calling. Darrell said leaders today are not drowning in tasks; they are drowning in information: meetings, emails, tickets, boards, documents, recordings. Nobody can see the pattern across all of it. Seeing that pattern and turning it into something a whole organization can act on is the job. And here is the part that makes it more than business: Yahweh inspects our ways too, and we let Him, because we love Him. "Consider your ways" (Haggai 1:5), He said, and then He gave the numbers: "Ye have sown much, and bring in little" (Haggai 1:6). That is quantity. "Wherefore by their fruits ye shall know them" (Matthew 7:20). That is quality. Jesus taught us to pray "Thy will be done in earth, as it is in heaven" (Matthew 6:10). A system that helps a whole organization see, decide and be inspected is one way that prayer gets answered on the ground. The industry calls it decision intelligence. The Word called it prudence a long time ago.',
      senior: 'How the organization learns, prioritizes and decides, from information to decision-ready intelligence with our ways inspected. The industry has a name for the capability Darrell described: decision intelligence, sometimes decision support, the discipline of turning an organization\'s scattered information into something a leader can decide on. Its premise is his sentence exactly: executives are not drowning in tasks; they are drowning in information, and the pattern across meetings, emails, tickets, project boards, documents and recordings is what no one can see. The Word supplied the shape and the consequence first, in a case with names. Exodus 18 is a governance design. The failure mode is stated in full: "Thou wilt surely wear away, both thou, and this people that is with thee: for this thing is too heavy for thee; thou art not able to perform it thyself alone" (Exodus 18:18). Note that both parties wear away, the leader and the people; a system that lives in one head costs everyone, not only the one. The remedy has three parts a modern designer would recognize: a taught standard, "thou shalt teach them ordinances and laws, and shalt shew them the way wherein they must walk" (Exodus 18:20); a tiered structure with qualified people, "able men, such as fear God, men of truth, hating covetousness" (Exodus 18:21); and an escalation rule, "every great matter they shall bring unto thee, but every small matter they shall judge" (Exodus 18:22). Genesis 41 is the pattern-recognition case: fourteen years read from two dreams, and the reading immediately converted into a repeatable system, "let him appoint officers over the land, and take up the fifth part of the land of Egypt in the seven plenteous years" (Genesis 41:34). Pharaoh\'s own verdict on Joseph names the capability, "there is none so discreet and wise as thou art" (Genesis 41:39). 1 Chronicles 12:32 gives the two-part definition of the intelligence function in one clause: understanding of the times, and knowing what to do, "men that had understanding of the times, to know what Israel ought to do". Acts 6 is prioritization by calling under load: the apostles refused to become the operations team, "It is not reason that we should leave the word of God, and serve tables" (Acts 6:2), delegated to seven qualified men, and kept the work only they could do, "we will give ourselves continually to prayer, and to the ministry of the word" (Acts 6:4). Nehemiah viewed the wall by night before he built (Nehemiah 2:13); Habakkuk was told to write the vision plain enough for a reader to run on it (Habakkuk 2:2); Solomon located safety in the multitude of counsellors, not the memory of one (Proverbs 11:14). Every one of those is a governance system that does not depend on one person\'s institutional knowledge, which is the sentence PoeTech now carries as its purpose. Then the correction Darrell added, which prevents this from becoming a management seminar. The work is prudence, "the prudent man looketh well to his going" (Proverbs 14:15), and it is love, because "If ye love me, keep my commandments" (John 14:15). And the inspection is from Yahweh\'s side, in two registers. Quantitative: "Consider your ways" (Haggai 1:5) is followed by a ledger, "Ye have sown much, and bring in little; ye eat, but ye have not enough" (Haggai 1:6), and the returning lord in the parable "reckoneth with them" (Matthew 25:19) to know how much each had gained. Qualitative: "the fire shall try every man’s work of what sort it is" (1 Corinthians 3:13), and "by their fruits ye shall know them" (Matthew 7:20). He sees what a dashboard cannot, "the LORD pondereth the hearts" (Proverbs 21:2), and we invite it, "Search me, O God, and know my heart" (Psalms 139:23). The purpose of decision-ready intelligence in a Kingdom organization is therefore not efficiency. It is "Thy will be done in earth, as it is in heaven" (Matthew 6:10): an organization that can see, decide, and be inspected is an organization that can do His will on the ground instead of one man\'s memory of it. The vocabulary is the industry\'s. The design is Jethro\'s, Joseph\'s, Issachar\'s and the apostles\'. The standard is His.',
    },
    quiz: {
      questions: [
        {
          q: 'What did Jethro name as the failure of the way Moses was governing?',
          options: [
            'Moses was judging unfairly',
            'The whole system lived in one person, so both he and the people would wear away',
            'The people were asking too many questions',
          ],
          answer: 1,
          explain: '"thou art not able to perform it thyself alone" (Exodus 18:18). The remedy was a structure and an escalation rule, "every great matter they shall bring unto thee, but every small matter they shall judge" (Exodus 18:22).',
        },
        {
          q: 'What did Joseph do with the pattern he read across fourteen years?',
          options: [
            'Kept it as private knowledge that made him indispensable',
            'Turned it into a repeatable system: officers over the land and a stored fifth',
            'Warned Pharaoh and left the decision to him',
          ],
          answer: 1,
          explain: '"let him appoint officers over the land, and take up the fifth part of the land of Egypt in the seven plenteous years" (Genesis 41:34). Reading the pattern was intelligence; the officers and the storehouses made it decision-ready for a nation.',
        },
        {
          q: 'How did the apostles prioritize when the daily ministration was failing?',
          options: [
            'They did everything themselves until it was fixed',
            'They stopped preaching to serve tables',
            'They kept prayer and the Word, which only they could do, and appointed seven qualified men over the tables',
          ],
          answer: 2,
          explain: '"It is not reason that we should leave the word of God, and serve tables" (Acts 6:2); "we will give ourselves continually to prayer, and to the ministry of the word" (Acts 6:4). Prioritization by calling, with the rest delegated to the qualified.',
        },
        {
          q: 'In what two registers does the Word inspect our ways, and what makes the inspection an act of love?',
          options: [
            'Speed and cost; because results matter',
            'Quantity (consider your ways, sown much and brought in little) and quality (by their fruits); because we love Him and keep His commandments',
            'Only intention; the outcome does not matter',
          ],
          answer: 1,
          explain: '"Consider your ways" (Haggai 1:5) with its ledger, "Ye have sown much, and bring in little" (Haggai 1:6), and "by their fruits ye shall know them" (Matthew 7:20). "If ye love me, keep my commandments" (John 14:15).',
        },
      ],
    },
  },
  {
    id: 'pm12-titles-and-fruits-capability-shown-in-outcomes',
    title: 'Titles and fruits — potential judged by the title, capability shown in outcomes, and the ownership that does not wait',
    bigIdea: 'Darrell sent this in as a lesson on 2026-09-25 and again on 2026-09-28. The text he sent is written as an assistant’s reply to him, summing up what he had described about his own work; the wording is the assistant’s, and the experience and the point are his. The point: organizations often judge potential by titles, while capability is shown in outcomes. His retail years are the case. He opened and stabilized several rent-to-own stores, carried the profit and loss, hired, trained and coached the staff, sat in multi-store performance reviews built on business data, helped retrain managers at other locations, ran one of the highest-performing stores in the market, and was named by his market manager as a candidate for advancement, and the title never became market manager. A screening committee reads that as store-level management; the behaviors underneath are leadership. And he drew the conclusion himself: understanding that this is simply how it is drives him to ownership. The Word had this case long before the resume. Saul screened David by category, a youth, and David answered with outcomes, the lion and the bear (1 Samuel 17:33-37). Man looks on the outward appearance (1 Samuel 16:7); we are known by fruits (Matthew 7:20); faithful in the least is faithful in much (Luke 16:10); the ant works with no guide, overseer, or ruler (Proverbs 6:7).',
    inApp: 'Write your own fruit register on one page. Column one: the title you held. Column two: the outcomes, stated as evidence rather than adjectives (stores opened and stabilized, a profit and loss carried, people hired and developed, managers retrained, a stakeholder group that stayed willing to work with you). Column three: who could confirm each outcome, because the Word says let another praise thee (Proverbs 27:2). Then mark the one outcome you have been waiting for someone to notice, and write the next thing you will own without waiting for a title (Proverbs 6:6-8). In the app: open your Projects page and add the register as a note on the project it came from, so the record lives where the work does.',
    anchor: {
      ref: '1 Samuel 17:33-37; 1 Samuel 17:39; 1 Samuel 16:7; Matthew 7:20; Luke 16:10; Genesis 39:4; Proverbs 6:6-8; Ecclesiastes 9:15',
      theme: 'Saul judged David by the category, but a youth, and David answered with a record of outcomes and gave Yahweh the credit for them. Men look on the outward appearance; fruit is how the Word says we are known; faithfulness in the least is the proof of the much. Where the title does not come, the ant, the cupbearer and the servant in the prison show the ownership that does not wait for one.',
    },
    benefits: [
      'You learn to tell the two things apart that committees often merge: the title you held, and the capability your outcomes show.',
      'You read 1 Samuel 17 as the Word’s own interview: a category on one side of the table, but a youth, and a record of outcomes on the other, the lion and the bear.',
      'You stop treating a screening committee as an enemy: the industry itself says hiring often optimizes for risk reduction, which checks what is easy to verify. The Word names the same limit in Samuel, who looked on the stature too.',
      'You gain a way to present your work as fruit, evidence another person can confirm, instead of adjectives about yourself (Proverbs 27:2).',
      'You see ownership as the Word’s answer to a title that has not come: the ant needs no overseer, the cupbearer took up a wall, and Joseph ran a prison from inside it.',
      'The industry’s names, competency-based assessment and stakeholder engagement, become a vocabulary for a case the Word gave first.',
    ],
    levels: {
      child: 'Titles and fruits. Some people judge what you could do by your title. But what you can really do is shown by your outcomes, the fruit of your work. A title is a name for a job, like boss or captain. Darrell learned this at his job. He ran stores and did it very well. He trained lots of people. His boss said he was ready to move up. But he never got the bigger title. The Bible has a story like that. A giant named Goliath scared everyone. A young man named David said he would fight him. King Saul said no, you are just a boy. But David told what he had done. A lion and a bear came to take his sheep, and he beat them both. He said Yahweh helped him do it. Then David won! Yahweh told the prophet Samuel that people look at the outside, but Yahweh looks at the heart. Jesus said you can know people by their fruit. So keep doing good work, even if no one gives you a title. The ant works hard with no boss watching. Do your work for Yahweh.',
      youth: 'Titles and fruits: people often judge your potential by your title, but your capability shows in your outcomes, and ownership does not wait. Darrell lived this. In retail he opened and steadied several stores, handled the money, hired and trained the staff, helped retrain managers at other stores, and ran one of the best stores in his market. His manager named him as ready to move up. The bigger title never came. He decided that knowing this is simply how it works would drive him to ownership. The Word has a case just like it. When Goliath challenged Israel, young David offered to fight. King Saul judged him by a category: "for thou art but a youth" (1 Samuel 17:33). David did not argue about his age. He gave his record: a lion and a bear had come for his father\'s sheep, and he killed them both. And he gave Yahweh the credit, which keeps a record from turning into bragging. Saul then tried to put his own armor on David. It did not fit, and David said he had not tested it. Do not wear somebody else\'s armor. Even the prophet Samuel judged by looks once, and Yahweh corrected him: man looks on the outside, but the LORD looks on the heart (1 Samuel 16:7). Jesus said we know people by their fruits. Faithful in little is faithful in much. And the ant works with no boss over it. So start a list of your results this week, with a person next to each one who could confirm it. Then own the next thing without waiting for a title.',
      teen: 'Titles and fruits: potential judged by the title, capability shown in outcomes, and the ownership that does not wait. Here is the idea Darrell sent in. People often judge what you could do by your title, but what you can actually do shows up in your results. He lived it. In retail he opened and stabilized several stores, managed the money side, hired and trained the team, helped retrain managers at other stores, and ran one of the best stores in his market. His boss even named him as someone ready to move up. The title never came. The Word has a story just like that. When a giant named Goliath challenged Israel, a teenager named David offered to fight. King Saul looked at him and saw a category: "for thou art but a youth" (1 Samuel 17:33). David did not argue about his age. He gave a record of results: "Thy servant kept his father’s sheep, and there came a lion, and a bear" (1 Samuel 17:34). "Thy servant slew both the lion and the bear" (1 Samuel 17:36). And he gave Yahweh the credit: "The LORD that delivered me out of the paw of the lion, and out of the paw of the bear, he will deliver me out of the hand of this Philistine" (1 Samuel 17:37). Then Saul tried to dress David in his own armor. It did not fit. David said, "I cannot go with these; for I have not proved them" (1 Samuel 17:39). Do not let someone else’s category remake you into a shape you have never tested. Even the prophet Samuel judged by looks once, and Yahweh corrected him: "for man looketh on the outward appearance, but the LORD looketh on the heart" (1 Samuel 16:7). Jesus gave the test that still works: "Wherefore by their fruits ye shall know them" (Matthew 7:20). And small jobs are not wasted: "He that is faithful in that which is least is faithful also in much" (Luke 16:10). Darrell’s answer to a missing title was ownership: keep learning, keep building, take on problems instead of waiting for permission. The Word points to the ant, "Which having no guide, overseer, or ruler" (Proverbs 6:7), still does the work. In project management the industry calls this competency-based assessment: judging someone by what they have shown they can do. Start a list of your results this week, with a name beside each one who could confirm it.',
      senior: 'Titles and fruits: potential judged by the title, capability shown in outcomes, and the ownership that does not wait, taught for the one who has carried real responsibility without the title that usually goes with it. The text Darrell sent is written as an assistant’s reply to him, summarizing experiences he had described. We say so plainly: the phrasing belongs to the assistant, and the experiences and the conclusion belong to him. Its thesis is sound and worth teaching: organizations often evaluate potential through titles, while capability is demonstrated through outcomes. His retail years supply the case. He opened and stabilized several rent-to-own locations, held profit and loss accountability, hired, trained and coached staff, participated in multi-store performance reviews built on business data, assisted in retraining managers at other locations, operated one of the highest-performing stores in the market, and was identified by his market manager as a candidate for advancement. The title of market manager did not follow. A search committee may still file all of that as store-level management, because that is how resumes are screened; the leadership behaviors underneath it are real. A second case in the same text makes the point from another angle: he entered a systems transformation project that already had years of history and reluctant stakeholders, gathered objective evidence rather than opinions, used recordings and workflow validation to establish the facts, reached outcomes quickly, and left the stakeholders still willing to work with him. That is not task management; it is trust-building, facilitation and alignment. ONE. THE INTERVIEW IN THE VALLEY OF ELAH. The Word’s own case is an evaluation. Saul screened David by category: "Thou art not able to go against this Philistine to fight with him: for thou art but a youth, and he a man of war from his youth" (1 Samuel 17:33). David answered with outcomes, not credentials: "Thy servant kept his father’s sheep, and there came a lion, and a bear, and took a lamb out of the flock" (1 Samuel 17:34); "Thy servant slew both the lion and the bear" (1 Samuel 17:36). He attributed the record correctly, which is what keeps a record from becoming a boast: "The LORD that delivered me out of the paw of the lion, and out of the paw of the bear, he will deliver me out of the hand of this Philistine" (1 Samuel 17:37). Saul then did what institutions often do with a capable person they have just accepted: he tried to fit him to the institution’s own equipment. David declined: "I cannot go with these; for I have not proved them" (1 Samuel 17:39). Present your proven tools, not borrowed armor. TWO. WHY COMMITTEES READ TITLES. The reply Darrell sent names a real dynamic: hiring processes often optimize for risk reduction rather than capability identification, because a title is easy to verify and judgment is not. The Word is not surprised by this, and it does not make the committee a villain. The prophet Samuel himself looked at Eliab’s stature and was corrected: "Look not on his countenance, or on the height of his stature" (1 Samuel 16:7), "for man looketh on the outward appearance, but the LORD looketh on the heart" (1 Samuel 16:7). Honor remains due to those who decide (Romans 13:7). Understanding the limit lets you answer it with evidence rather than resentment. THREE. KNOWN BY FRUIT. "Ye shall know them by their fruits" (Matthew 7:16); "Even a child is known by his doings, whether his work be pure, and whether it be right" (Proverbs 20:11). Joseph shows fruit creating authority before any title. In Potiphar’s house, "his master saw that the LORD was with him, and that the LORD made all that he did to prosper in his hand" (Genesis 39:3), "and he made him overseer over his house" (Genesis 39:4). In prison, with no rank at all, "the keeper of the prison committed to Joseph’s hand all the prisoners that were in the prison" (Genesis 39:22). FOUR. FAITHFUL IN THE LEAST, AND HONEST ABOUT THE FORGETTING. "He that is faithful in that which is least is faithful also in much" (Luke 16:10). A store is not a small thing in the Word’s accounting; it is exactly the "very little" of the parable, "because thou hast been faithful in a very little, have thou authority over ten cities" (Luke 19:17). And the Word does not pretend recognition always follows. "Now there was found in it a poor wise man, and he by his wisdom delivered the city; yet no man remembered that same poor man" (Ecclesiastes 9:15). The Preacher’s verdict stands anyway: "Wisdom is better than strength" (Ecclesiastes 9:16). FIVE. THE OWNERSHIP THAT DOES NOT WAIT. Darrell’s own conclusion, as the reply records it, is the most important line: understanding that this is how it is drives him to ownership. Many answer a title limitation with frustration; he answered with learning, building, experimenting, creating systems and developing capability, from church technology and years of media ministry to the app this lesson lives in. The Word has the pattern. The ant works "having no guide, overseer, or ruler" (Proverbs 6:7). Nehemiah was a cupbearer, "For I was the king’s cupbearer" (Nehemiah 1:11), and he took ownership of a city wall: "come, and let us build up the wall of Jerusalem" (Nehemiah 2:17). And the motive is settled: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23). SIX. PRESENT THE FRUIT. What the industry calls competency-based assessment, or behavioral evidence, is the Word’s fruit test in hiring language, and PMBOK’s stakeholder engagement is the name for what he did on that transformation project. Write your outcomes as evidence another person can confirm; the Word prefers it that way: "Let another man praise thee, and not thine own mouth" (Proverbs 27:2). The people you trained and the managers you helped retrain are your letter, "Ye are our epistle written in our hearts, known and read of all men" (2 Corinthians 3:2). Then keep being "a pattern of good works" (Titus 2:7), because "The hand of the diligent shall bear rule" (Proverbs 12:24).',
    },
    quiz: {
      questions: [
        {
          q: 'How did David answer when Saul judged him by the category but a youth?',
          options: [
            'He argued that age does not matter',
            'He gave a record of outcomes, the lion and the bear, and credited Yahweh for them',
            'He asked for a title first',
            'He walked away',
          ],
          answer: 1,
          explain: '"Thy servant slew both the lion and the bear" (1 Samuel 17:36), and "The LORD that delivered me out of the paw of the lion, and out of the paw of the bear, he will deliver me out of the hand of this Philistine" (1 Samuel 17:37). Evidence, attributed rightly.',
        },
        {
          q: 'Why did David refuse Saul’s armor?',
          options: [
            'It was too expensive',
            'He had not proved it, and would not fight in equipment he had never tested',
            'He wanted to look humble',
            'Saul took it back',
          ],
          answer: 1,
          explain: '"I cannot go with these; for I have not proved them" (1 Samuel 17:39). Do not let an institution’s category remake you into a shape you have never tested.',
        },
        {
          q: 'What does the Word say about how people are known?',
          options: [
            'By their titles',
            'By their fruits and their doings',
            'By who they know',
            'By how long they have waited',
          ],
          answer: 1,
          explain: '"Wherefore by their fruits ye shall know them" (Matthew 7:20), and "Even a child is known by his doings" (Proverbs 20:11). Fruit is the Word’s own performance evidence.',
        },
        {
          q: 'What is the Word’s answer to a title that has not come?',
          options: [
            'Stop working until it does',
            'Ownership that does not wait: the ant with no overseer, the cupbearer who built a wall, the servant who ran the prison',
            'Complain to the committee',
            'Pretend you already have it',
          ],
          answer: 1,
          explain: 'The ant works "having no guide, overseer, or ruler" (Proverbs 6:7); Nehemiah, "the king’s cupbearer" (Nehemiah 1:11), said "come, and let us build up the wall of Jerusalem" (Nehemiah 2:17). Darrell named it himself: understanding it drives him to ownership.',
        },
        {
          q: 'What does the industry call judging a person by the capability they have shown?',
          options: ['Title inflation', 'Competency-based assessment', 'Scope creep', 'Sunk cost'],
          answer: 1,
          explain: 'Competency-based assessment is the industry’s name for the Word’s fruit test. The Word gave the case first, in the valley of Elah, where a record of outcomes answered a category.',
        },
      ],
    },
  },
];

export const PROJECT_MANAGEMENT_INTEREST_TAG = '[Project Management interest]';
export const PROJECT_MANAGEMENT_HELPER_TAG = '[Project Management helper]';

export function buildProjectManagementSchedule() {
  return PROJECT_MANAGEMENT_MODULES.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
}

export function projectManagementProgressSummary(progress = {}) {
  return progressSummaryFor(PROJECT_MANAGEMENT_MODULES, progress);
}

export function exportProjectManagementCurriculumMarkdown() {
  return exportCurriculumMarkdownFor(
    { meta: PROJECT_MANAGEMENT_META, sessionFlow: PROJECT_MANAGEMENT_SESSION_FLOW, modules: PROJECT_MANAGEMENT_MODULES },
    null,
  );
}

// Tutor course-meta — the per-lesson solo guide teaches the Word's case first
// and the standard's vocabulary second, in that order, every time. It refuses
// the claim this course exists to refuse.
export const PROJECT_MANAGEMENT_TUTOR_META = {
  title: PROJECT_MANAGEMENT_META.title,
  intro: 'You are a coach for someone carrying a real project — a church build or renovation, a rehab, a property turn, a ministry launch — who has no certification and needs none.',
  posture: 'Teach the Word’s own case FIRST and the industry’s name for it second, in that order, every time: the tower counted before it is begun, Jethro’s span of control and escalation rule, Bezaleel called by name with his competencies itemised and the teaching given with the skill, Nehemiah declining four invitations because the work would cease, the wall dated to fifty and two days, the multitude of counsellors that establishes a purpose, the watch posted day and night beside the prayer, the plumbline held in His own hand, the backward look at the plough, the register gathered after the wall. Then name the PMP or ITIL term as THEIR term, because naming is faster than learning and that ordering is the whole method. NEVER claim that studying the Word raises a PMP or ITIL exam score — that has not been measured, and say so plainly if asked. Cite Scripture verbatim from the app’s own corpus or by reference with a theme; never quote a translation from memory and never invent a verse. Say Yahweh rather than the generic name in your own voice, and leave every quotation exactly as it is written. Where the Word and a standard diverge, the Word governs and you say the divergence out loud. You can be wrong — tell the learner to verify against the real project, the real trade, and the real inspector.',
};
