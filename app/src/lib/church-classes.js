// =============================================================================
// church-classes — the COLG youth "Learning A.I. The Way" curriculum + timeline
// =============================================================================
// Darrell 2026-06-15: PoeTech teaches the kids of the church to use LLMs — in the
// app and at the church — "for all who want to learn from me using my app that can
// reach them and give them time I don't personally have." Jayden asked for the
// timeline and how the curriculum goes; this is the source of truth for both.
//
// The MODULES are authored content (a published syllabus — like a foundation doc).
// The TIMELINE is NOT painted: weekToDate() computes each week's real calendar date
// from the cohort start, and weekday() reports the true day-of-week of whatever
// start is set — so a wrong start date shows the wrong weekday instead of lying.
//
// Grounds: COMMUNITY-FIRST-MISSION (COLG = the named first community; teach-the-
// community is a standing commitment), DR-0076 Verification Doctrine (module 3
// teaches the kids to VERIFY A.I. output, not trust slop — the doctrine, kid-sized),
// "build kings not slaves" (module 8 raises the next teachers). Scripture anchors
// are cited by REFERENCE with a plain-language theme gloss — never a quoted
// translation — per the SCRIPTURE-REFERENCE-STANDARD (do not present a paraphrase
// as a translation).
// =============================================================================

// Proposed start for Cohort 1. Governor-editable in-app (data.classCohort.startDate).
// Labeled "proposed" in the UI until Darrell confirms — honest, not painted.
export const PROPOSED_COHORT_START = '2026-07-11'; // a Saturday; the UI shows the real weekday

// PUBLISHED cohort (DR-0061/DR-0076 cohort-date propagation fix). The Governor's
// in-app confirm writes data.classCohort, which only lives in HIS instance
// snapshot — a learner on another device would only ever see the static proposal.
// This constant is the SHARED, published source every deployed build carries, so a
// confirmed date reaches every learner the moment the build ships (the same publish
// model the syllabus itself uses: authored content, committed, deployed to all).
// Until Darrell locks the date this stays { confirmed:false } and the UI honestly
// reads "proposed." When he confirms, set confirmed:true here (and startDate if it
// moved) and the next deploy propagates it to everyone. A Governor's live in-app
// confirm still overrides locally for his own preview — see resolveCohort().
// PUBLISHED confirmed cohort — what every learner (incl. parishioners on their own
// instance) sees. Darrell confirmed Cohort 1 for Saturday 2026-07-11 on 2026-06-16.
// To move the class: change `startDate` to another Saturday (ISO yyyy-mm-dd) and
// redeploy; the Learn tab shows the true weekday, so a non-Saturday is caught.
export const CONFIRMED_COHORT = {
  startDate: '2026-07-11',
  confirmed: true,
};

// Resolve the cohort a learner should SEE. Precedence:
//   1. The instance's own classCohort (Governor editing live, or a future per-
//      instance override) — honored as-is.
//   2. The published CONFIRMED_COHORT — what every other learner sees.
//   3. The static proposal — last resort.
// Returns { startDate, confirmed } so a learner outside the Governor's instance
// gets the confirmed date + confirmed flag, not just the bare proposal.
// Generic resolver — any course passes its OWN published confirmed cohort + static
// proposal. Same precedence as resolveCohort; extracted so a second course (the
// broadcast media-team class) gets identical, tested cohort-propagation behavior.
export function resolveCohortGeneric(localCohort, confirmedCohort, proposedStart) {
  const conf = confirmedCohort || {};
  const local = localCohort && typeof localCohort === 'object' ? localCohort : null;
  if (local && (local.startDate || typeof local.confirmed === 'boolean')) {
    return {
      startDate: local.startDate || conf.startDate || proposedStart,
      confirmed: typeof local.confirmed === 'boolean' ? local.confirmed : !!conf.confirmed,
    };
  }
  return {
    startDate: conf.startDate || proposedStart,
    confirmed: !!conf.confirmed,
  };
}

export function resolveCohort(localCohort = null) {
  return resolveCohortGeneric(localCohort, CONFIRMED_COHORT, PROPOSED_COHORT_START);
}

export const CLASS_META = {
  title: 'Learning A.I. The Way',
  audience: 'COLG youth — and anyone who wants to learn',
  tagline: 'Master the tool. Don’t let it master you.',
  format: '8 weekly sessions · ~75 min each · a blend of live time with Darrell and self-paced practice right here in the app',
  cadenceDays: 7,
  weeks: 8,
};

// The session rhythm every week follows — 75 minutes, encoded once so the
// facilitator guide and any printout describe the SAME flow. The per-week
// facilitator.howToRun spells out what fills each segment that week.
export const SESSION_FLOW = [
  { minutes: 5, name: 'Prayer + the anchor' },
  { minutes: 10, name: 'Recap last week' },
  { minutes: 15, name: 'Teach the big idea' },
  { minutes: 25, name: 'Hands-on in the app' },
  { minutes: 15, name: 'Discussion' },
  { minutes: 5, name: 'Send-off + solo task' },
];
export const SESSION_MINUTES = SESSION_FLOW.reduce((t, s) => t + s.minutes, 0); // 75

// A launch target points a week's "In the app" activity at the REAL surface where
// it happens (reality-trace, DR-0076): only surfaces that actually exist are
// linked, and they are resolved by the host app into setView/setChurchView. Weeks
// whose activity lives in the per-week tutor walkthrough carry no deep link.
//   { view, churchView? }

// Each module: the big idea in kid-plain language (learner copy — unchanged), a
// deeper `lesson` paragraph for the one teaching it, a `facilitator` guide
// (talkingPoints / howToRun / discussionPrompts), the real `inApp` activity with a
// `launch` target where one exists, and a Scripture anchor (reference + theme
// gloss, not a quoted verse, per the SCRIPTURE-REFERENCE-STANDARD).
export const MODULES = [
  {
    id: 'wk1-what-is-ai',
    title: 'What is A.I., really?',
    bigIdea: 'An LLM is a very well-read helper that guesses the next word. It can sound completely sure and still be wrong. It is a tool — not a source of truth.',
    inApp: 'Send your very first prompt in the app’s Council Chamber. Notice what it does well, and catch one thing it gets wrong.',
    anchor: { ref: '1 Thessalonians 5:21', theme: 'Test everything; hold on to what is good. That is the whole class in one verse.' },
    launch: { view: 'church', churchView: 'home' },
    quiz: {
      questions: [
        { q: 'What is an LLM really doing when it answers you?', options: ['Looking up the true answer', 'Guessing the next word from patterns — it can be sure and still wrong', 'Remembering your life'], answer: 1, explain: 'It predicts the next word; it has no ground truth and can be confidently wrong. It is a tool, not an oracle.' },
        { q: 'If it sounds completely sure, does that mean it’s right?', options: ['Yes, confidence = truth', 'No — confidence is not truth; test it', 'Only on weekdays'], answer: 1, explain: 'Sounding sure and being right are different things — the whole class is "test everything."' },
      ],
    },
    lesson: 'A large language model has read an enormous amount of writing and learned, very well, which word tends to come next. That is its whole trick — a brilliant pattern-guesser, not a knower. It has no eyes, no memory of your life, and no conscience; it can produce a confident paragraph that is simply made up (we call that a "hallucination"). So the first posture of a wise user is not awe and not fear — it is stewardship. It is a tool, like a hammer or a calculator: powerful in a trained hand, dangerous swung carelessly. We are learning to swing it on purpose.',
    facilitator: {
      talkingPoints: [
        'It predicts the next word — it does not look anything up and does not "know" it is right.',
        'Confidence is not truth: it can sound completely sure and be completely wrong.',
        'It is a tool, not an oracle — the goal of this whole class is to make YOU the one in charge of it.',
        'Name the wins too: it is genuinely great at drafting, explaining, and brainstorming — we are not anti-technology, we are pro-discernment.',
      ],
      howToRun: 'Prayer + the anchor (5): open in prayer, read 1 Thessalonians 5:21 — "test everything." | Recap last week (10): first session — instead, set the room: phones out, app open, agree on the one rule "we test what it tells us." | Teach the big idea (15): explain next-word prediction in plain words; show one thing it does brilliantly and one thing it gets wrong. | Hands-on in the app (25): every learner sends a first prompt in the Council Chamber / input center; they screenshot or note one good answer and one wrong-or-weird answer. | Discussion (15): go around — what surprised you? where did it bluff? | Send-off + solo task (5): solo task — ask it three questions this week and catch it being wrong once.',
      discussionPrompts: [
        'When did it sound sure but get something wrong?',
        'What is it actually good at — and what would you never trust it with?',
        'If it is a tool, who is supposed to be in charge — you or it?',
      ],
    },
  },
  {
    id: 'wk2-good-questions',
    title: 'Asking good questions',
    bigIdea: 'A clear question gets clear help. The four keys: what, when, why, how. Garbage in, garbage out — but a good question is a kind of skill.',
    inApp: 'Take one vague prompt and one clear prompt for the same thing. Compare the answers side by side. Feel the difference a good question makes.',
    anchor: { ref: 'Proverbs 18:13', theme: 'Answering before you listen is folly — and so is asking before you think.' },
    quiz: {
      questions: [
        { q: 'What are the four keys to a clear prompt?', options: ['Who, where, which, whom', 'What, when, why, how', 'Fast, short, loud, fun'], answer: 1, explain: 'A prompt that names what, when, why, and how gets a clear answer; a foggy prompt gets a foggy one.' },
        { q: 'What does "garbage in, garbage out" mean here?', options: ['The app is broken', 'The model mirrors the clarity you give it', 'You should delete bad answers'], answer: 1, explain: 'A vague question gets a vague answer; a good question is a real, transferable skill.' },
      ],
    },
    lesson: 'The quality of the answer is mostly decided before the model says a word — by the question. A vague prompt ("tell me about dogs") gets a vague, generic reply. A clear prompt names the four keys: WHAT you want, WHEN/where it applies, WHY you need it, and HOW you want it back (a list? a paragraph? for a fifth-grader?). Giving the model a role and an audience ("explain photosynthesis to my little sister") sharpens it further. This is a real skill — the same skill as asking a teacher, a parent, or a boss a good question — and it transfers far beyond A.I.',
    facilitator: {
      talkingPoints: [
        'The four keys: what, when, why, how — a prompt missing these gets a foggy answer.',
        'Garbage in, garbage out: the model mirrors the clarity you give it.',
        'Give it a role and an audience ("you are a tutor; explain this to a 10-year-old").',
        'A good question is a transferable life skill — this is not just an A.I. trick.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 18:13 — think before you ask. | Recap last week (10): two or three learners share where A.I. bluffed last week. | Teach the big idea (15): teach the four keys; rewrite one foggy prompt together on the board. | Hands-on in the app (25): each learner runs the SAME goal as one vague prompt and one clear prompt, side by side, and compares. | Discussion (15): what changed between the two answers? | Send-off + solo task (5): solo task — turn one real homework or chore question into a clear, four-key prompt.',
      discussionPrompts: [
        'What was the single biggest difference between the vague and the clear answer?',
        'Which of the four keys do you forget most often?',
        'Where else in life would asking a clearer question help you?',
      ],
    },
  },
  {
    id: 'wk3-the-test',
    title: 'The Test — judging what A.I. tells you',
    bigIdea: 'The most important week. Never trust an answer just because it sounds smart. Run it through the filter and VERIFY it. AI that looks right and is wrong is the real danger.',
    inApp: 'Use the in-app Test tool on three A.I. answers. Find the one that is wrong on purpose. Verify a real fact before you believe it.',
    anchor: { ref: 'Philippians 4:8', theme: 'The filter for what is worth keeping in your mind: true, honorable, just, pure, lovely.' },
    launch: { view: 'notes' },
    quiz: {
      questions: [
        { q: 'Which kind of A.I. answer is the MOST dangerous?', options: ['One that is obviously wrong', 'One that looks right but is wrong — because you’ll believe it', 'One that is too long'], answer: 1, explain: 'A confident, wrong-but-believable answer is the real danger; that’s why we verify before we trust.' },
        { q: 'What’s the rule for a claim of fact?', options: ['Trust it if it sounds smart', 'Verify it against a real source, THEN trust', 'Repeat it quickly'], answer: 1, explain: 'Verify, then trust — not the other way around. Doubting well protects your mind and your name.' },
      ],
    },
    lesson: 'This is the hinge of the whole class, and it is the kid-sized version of the Verification Doctrine the platform itself runs on: an answer that LOOKS right and is WRONG is more dangerous than an answer that is obviously wrong, because you will believe it. So we never trust an answer because it sounds smart. We run it through the Test — true, honorable, just, pure, lovely, commendable, excellent, praiseworthy (Philippians 4:8) — and for any claim of fact we VERIFY it against a real source before we repeat it or hand it in. "Trust but verify" is too weak; the rule is verify, THEN trust. Learning to doubt well is not cynicism — it is how you protect your mind and your name.',
    facilitator: {
      talkingPoints: [
        'The real danger is the answer that looks right and is wrong — because you will believe it.',
        'Sounding smart is not the same as being true; never trust on tone alone.',
        'Run claims through the Test, and verify any FACT against a real source before repeating it.',
        'Verify, then trust — not the other way around. Doubting well protects your mind and your reputation.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Philippians 4:8 — the filter. | Recap last week (10): a learner shows a clear prompt they wrote. | Teach the big idea (15): show three A.I. answers, one wrong on purpose; teach the Test as the filter. | Hands-on in the app (25): in Thinking Space, learners run three answers through the Test and verify one real fact against a trusted source. | Discussion (15): which one was the fake, and HOW did you catch it? | Send-off + solo task (5): solo task — before believing one A.I. answer this week, verify it against a second source.',
      discussionPrompts: [
        'How did you tell the fake answer from the real ones?',
        'What does it cost you to repeat something false as if it were true?',
        'What is one way you will verify a claim before you trust it?',
      ],
    },
  },
  {
    id: 'wk4-ai-for-school',
    title: 'A.I. for school — honestly',
    bigIdea: 'Use it to LEARN, not to cheat. It is your tutor, not your ghostwriter. The goal is a stronger you, not a shortcut that leaves you weaker.',
    inApp: 'Turn one hard school topic into your own study guide — in your own words, checked by you.',
    anchor: { ref: 'Daniel 1; Colossians 3:23', theme: 'Daniel mastered Babylon’s learning without losing who he was. Whatever you do, work at it with all your heart.' },
    quiz: {
      questions: [
        { q: 'What’s the line between using A.I. to learn vs to cheat?', options: ['There is no line', 'Who ends up stronger — a tutor builds you up; a ghostwriter leaves you weaker (and is a lie on your work)', 'Whether the teacher finds out'], answer: 1, explain: 'Use it as a tutor that makes you stronger, not a ghostwriter that does your thinking.' },
        { q: 'How did Daniel handle Babylon’s schooling?', options: ['He refused to learn anything', 'He mastered the learning without losing who he was', 'He cheated his way through'], answer: 1, explain: 'Use the system without being owned by it; honest effort is worship (Colossians 3:23).' },
      ],
    },
    lesson: 'There is a bright line between using A.I. to LEARN and using it to cheat, and it is about who ends up stronger. If the model does the thinking and you copy it, you walk away weaker and you have lied about your work. If the model is your tutor — quizzing you, explaining the hard part, checking your reasoning — you walk away stronger and the work is honestly yours. Daniel went to school in Babylon and out-learned everyone without losing who he was; he used the system without being owned by it. Whatever you do, do it with all your heart, as for the Lord (Colossians 3:23). A shortcut that leaves you emptier is not worth it.',
    facilitator: {
      talkingPoints: [
        'Tutor, not ghostwriter: it should make you stronger, never do the thinking for you.',
        'The cheating line is about who ends up stronger — and about telling the truth on your work.',
        'Daniel mastered Babylon’s learning without losing his identity — use the system, don’t be owned by it.',
        'Honest effort is worship: whatever you do, work at it with all your heart.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Daniel 1 and Colossians 3:23. | Recap last week (10): a learner shares how they verified a fact. | Teach the big idea (15): contrast "do my homework" vs "quiz me on this" with a live example. | Hands-on in the app (25): each learner turns one hard school topic into a study guide IN THEIR OWN WORDS, checked by them. | Discussion (15): where is the line between help and cheating? | Send-off + solo task (5): solo task — use A.I. as a tutor for one real assignment this week, and write the final answer yourself.',
      discussionPrompts: [
        'When does A.I. help cross over into cheating?',
        'Did using it as a tutor leave you stronger or weaker this time?',
        'How would Daniel use this tool in your school?',
      ],
    },
  },
  {
    id: 'wk5-ai-that-serves',
    title: 'A.I. that serves people',
    bigIdea: 'The best use of this tool is to help someone else. Use the app to serve the church — prayer requests, trivia, helping an elder use their phone.',
    inApp: 'Help one person — a grandparent, an elder, a friend — do one real thing with the app this week.',
    anchor: { ref: 'Mark 10:43–45; Galatians 5:13', theme: 'Whoever wants to be great must serve. Use your freedom to serve one another in love.' },
    launch: { view: 'church', churchView: 'home' },
    quiz: {
      questions: [
        { q: 'What’s the best use of this skill?', options: ['Only your own homework and games', 'To help someone else — greatness in the Kingdom is service', 'To win arguments'], answer: 1, explain: 'Whoever wants to be great must serve; aim the tool at the person next to you.' },
        { q: 'How is serving an elder also good for YOU?', options: ['It isn’t', 'Teaching it forces you to really understand it', 'It gets you out of class'], answer: 1, explain: 'Helping a phone-shy elder is real ministry AND real skill-building.' },
      ],
    },
    lesson: 'A tool this powerful tempts you to point it only at yourself — my homework, my game, my questions. The Kingdom flips that: whoever wants to be great becomes a servant (Mark 10:43-45). The best thing you can do with this skill is aim it at someone else — write a prayer request with an elder who struggles with their phone, help a grandparent send a photo, build a younger kid a study helper. You have freedom with this tool; use it to serve one another in love (Galatians 5:13). Serving is also where your skill gets real: teaching a phone-shy elder forces you to actually understand the thing you learned.',
    facilitator: {
      talkingPoints: [
        'The best use of this tool is to help someone else, not just yourself.',
        'Greatness in the Kingdom is service — whoever wants to be great must serve.',
        'Serving an elder with their phone is real ministry AND real skill-building.',
        'Freedom is for love: use what you can do to lift the person next to you.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Mark 10:43-45 and Galatians 5:13. | Recap last week (10): a learner shares how A.I. tutored them honestly. | Teach the big idea (15): tell a serve-one-person story; brainstorm who in the church needs help. | Hands-on in the app (25): pairs plan ONE real way to help one person — a prayer request, a photo, an app walk-through. | Discussion (15): who will you help, and what is the first step? | Send-off + solo task (5): solo task — help one elder, grandparent, or friend do one real thing with the app this week.',
      discussionPrompts: [
        'Who do you know that this tool could really help?',
        'What does it feel like to use your skill for someone else instead of yourself?',
        'How is serving one person also making you better at this?',
      ],
    },
  },
  {
    id: 'wk6-build-something',
    title: 'Build something useful',
    bigIdea: 'You are a builder, not just a user. Make one small useful thing — a scripture-memory helper, a study buddy, a chore tracker.',
    inApp: 'Design and build your project in the app. Get it working. Make it real.',
    anchor: { ref: 'Proverbs 22:29', theme: 'Do you see someone skilled in their work? They will stand before kings.' },
    launch: { view: 'notes' },
    quiz: {
      questions: [
        { q: 'What’s the difference between a user and a maker?', options: ['Nothing', 'A user accepts what the app gives; a maker asks "what could this do for someone?" and builds it', 'A maker is just a faster user'], answer: 1, explain: 'You don’t need to be a programmer to start — a clear plan and one small real thing counts.' },
        { q: 'What matters most about your project?', options: ['That it looks fancy', 'That it actually works and is real', 'That it’s the biggest'], answer: 1, explain: '"Real" beats "fancy" — skilled work has weight (Proverbs 22:29).' },
      ],
    },
    lesson: 'There is a quiet line between being a USER of technology and being a MAKER of it, and crossing it changes how you see everything. A user accepts whatever the app hands them; a maker asks "what could this DO for someone?" and builds it. You do not need to be a programmer to start — a good prompt, a clear plan, and one small useful thing (a scripture-memory helper, a study buddy, a chore tracker) is real building. Skilled work has weight: the one who is skilled in their work will stand before kings (Proverbs 22:29). We are not raising kids who are used BY the tool; we are raising builders who put it to work.',
    facilitator: {
      talkingPoints: [
        'You are a builder, not just a user — makers ask "what could this do for someone?"',
        'You do not need to be a programmer to start; a clear plan and one small real thing counts.',
        'Make it actually WORK — "real" beats "fancy."',
        'Skilled work has weight: the skilled stand before kings.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read Proverbs 22:29 — skill stands before kings. | Recap last week (10): a learner shares who they served. | Teach the big idea (15): show the user-vs-maker shift; demo one tiny useful build. | Hands-on in the app (25): each learner designs and starts building ONE small useful thing in Thinking Space / the build inbox, and gets a first version working. | Discussion (15): what are you building, and who is it for? | Send-off + solo task (5): solo task — get your small project actually working before next week.',
      discussionPrompts: [
        'What is one small useful thing only you would think to build?',
        'Who is your project for, and how will you know it works?',
        'What changed when you went from using to making?',
      ],
    },
  },
  {
    id: 'wk7-guard-heart-time',
    title: 'Guarding your heart and your time',
    bigIdea: 'A tool this powerful pulls at your attention, your privacy, and your sense of what is real. Set your limits before you need them — wisdom is knowing when to put it down.',
    inApp: 'Set your own limits — write your three rules, and notice the app’s privacy promise.',
    anchor: { ref: '1 Corinthians 6:12; Proverbs 4:23', theme: 'Do not be mastered by anything; guard your heart.' },
    launch: { view: 'about' },
    quiz: {
      questions: [
        { q: 'When should you set your guardrails for a powerful tool?', options: ['After it becomes a problem', 'Before you need them — decide what you won’t share and when you’ll stop', 'Never'], answer: 1, explain: 'Guardrails go up before you need them; the tool serves your life, you’re not mastered by it.' },
        { q: 'Which is one of the four "pulls" to watch for?', options: ['Eating lunch', 'Oversharing private things into a screen', 'Reading a book'], answer: 1, explain: 'The four pulls: over-reliance, time-sink, oversharing, and trusting a screen over people and God.' },
      ],
    },
    lesson: 'Everything powerful pulls at you, and this tool pulls in four ways. Over-reliance — letting it think so you stop thinking. Time-sink — an hour gone before you notice. Oversharing — typing private things into a screen you should have kept between you and the people who love you. And the quiet one: trusting a screen more than people and more than God. "Everything is permitted," Paul says, "but I will not be mastered by anything" (1 Corinthians 6:12). So we build guardrails BEFORE we need them: decide what you will never share, decide when you will stop, and remember the tool serves your life — never the other way around. PoeTech is built the same way on purpose — it has its own brakes, and it processes your data without selling it or keeping it. Above all else, guard your heart, because everything you do flows from it (Proverbs 4:23).',
    facilitator: {
      talkingPoints: [
        'Name the four pulls: over-reliance, time-sink, oversharing private things, trusting a screen over people and God.',
        'Guardrails go up BEFORE you need them — what you won’t share, when you’ll stop.',
        'The tool serves your life; you are not mastered by it ("I will not be mastered by anything").',
        'Point to the app’s own brakes and its promise: we process your data, we do not sell it or keep it.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read 1 Corinthians 6:12 and Proverbs 4:23. | Recap last week (10): a builder demos the small thing they made. | Teach the big idea (15): name the four pulls; tell one honest story of a tool mastering someone. | Hands-on in the app (25): each learner writes their THREE personal rules and reads the app’s privacy promise for themselves. | Discussion (15): which pull is strongest for you, and what is your rule for it? | Send-off + solo task (5): solo task — keep your three rules for a week and notice when one is tested.',
      discussionPrompts: [
        'Which pull — over-reliance, time, oversharing, or trusting a screen — is hardest for you?',
        'What is one thing you will decide right now never to share with it?',
        'When will you put it down — what is your stop rule?',
      ],
    },
  },
  {
    id: 'wk8-teach-next',
    title: 'Teach the next group',
    bigIdea: 'The best students help teach the next group. You have grown from user, to discerner, to server, to maker — now to multiplier. Kings raise kings.',
    inApp: 'Pick the week that helped you most and prepare to teach it — your name goes on the helper list for the next cohort.',
    anchor: { ref: '2 Timothy 2:2; Matthew 28:19–20', theme: 'Entrust what you learned to faithful people who will teach others.' },
    quiz: {
      questions: [
        { q: 'How do you prove you truly own what you learned?', options: ['By keeping it to yourself', 'By being able to teach it simply to someone younger', 'By finishing fastest'], answer: 1, explain: 'Mastery shows when you can teach it plainly — that’s the multiplier step.' },
        { q: 'What is the ladder you climbed in this class?', options: ['User only', 'User → discerner → server → maker → multiplier', 'Just maker'], answer: 1, explain: 'You grew from user to multiplier; kings raise kings (2 Timothy 2:2).' },
      ],
    },
    lesson: 'This is the commissioning. Over eight weeks you have climbed a ladder — user, then discerner who tests what it says, then server who points it at others, then maker who builds, and now multiplier who hands it on. The proof that you truly own something is that you can teach it simply; if you can make one week clear to someone younger, you have mastered it. So each of you prepares a five-minute version of the one week that helped you most, and those five-minute lessons seed the next cohort. This is the whole pattern of the Kingdom: "what you heard from me, entrust to faithful people who will be able to teach others also" (2 Timothy 2:2), and "go and make disciples... teaching them" (Matthew 28:19-20). Kings raise kings.',
    facilitator: {
      talkingPoints: [
        'Name the ladder they climbed: user → discerner → server → maker → multiplier.',
        'Mastery shows when you can teach it SIMPLY — to someone younger, in plain words.',
        'Each prepares a 5-minute version of one week; those lessons seed the next cohort.',
        'This is the commission, not a graduation: kings raise kings.',
      ],
      howToRun: 'Prayer + the anchor (5): pray; read 2 Timothy 2:2 and Matthew 28:19-20. | Recap last week (10): a learner shares one of their three guardrails and how it held. | Teach the big idea (15): walk the user-to-multiplier ladder; show what "teach it simply" looks like. | Hands-on in the app (25): each learner picks the week that helped them most and outlines a 5-minute version to teach; names go on the next-cohort helper list. | Discussion (15): which week will you teach, and why that one? | Send-off + solo task (5): commission them — solo task: teach your 5-minute lesson to one real person before the next cohort.',
      discussionPrompts: [
        'Which week changed the most for you, and how would you teach it in five minutes?',
        'Who is the next person you will teach this to?',
        'What does "kings raise kings" mean for how you use this tool now?',
      ],
    },
  },
];

export function toMs(v) {
  if (v == null || v === '') return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

// The real calendar date of a given week (0-based) from the cohort start. Returns
// null for a bad start — the UI then says "set a start date," never a fake date.
export function weekToDate(startISO, weekIndex, cadenceDays = CLASS_META.cadenceDays) {
  const ms = toMs(startISO);
  if (ms == null) return null;
  return new Date(ms + weekIndex * cadenceDays * 86400000);
}

// True weekday name of a date — so a non-Saturday start shows the truth.
export function weekday(date) {
  if (!date || Number.isNaN(date.getTime?.())) return null;
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getUTCDay()];
}

// One class-date format ("Saturday, July 11, 2026"), shared by every surface that
// shows a week's date (the learner timeline, the presenter mirror, the projected
// class screen) so they can never drift. UTC — the dates are calendar days, not
// instants. Returns null for a bad/missing date (callers show "date TBD").
export function formatClassDate(date) {
  if (!date || Number.isNaN(date.getTime?.())) return null;
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// Build the full schedule for ANY module set: one row per module with its real
// computed date. The course-specific buildSchedule delegates here.
export function buildScheduleFor(modules, startISO, cadenceDays = CLASS_META.cadenceDays) {
  return (modules || []).map((m, i) => {
    const date = weekToDate(startISO, i, cadenceDays);
    return { ...m, week: i + 1, date, weekday: weekday(date) };
  });
}

// Build the full schedule: one row per module with its real computed date.
export function buildSchedule(startISO) {
  return buildScheduleFor(MODULES, startISO);
}

// A learner's real progress against ANY module set — counted from their record.
export function progressSummaryFor(modules, progress = {}) {
  const list = modules || [];
  const done = list.filter((m) => !!progress[m.id]).length;
  return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
}

// A student's real progress: how many modules they've personally completed.
export function progressSummary(progress = {}) {
  return progressSummaryFor(MODULES, progress);
}

// Class-interest rides the cross-tenant FEEDBACK pipe (so a parishioner on their
// own instance reaches the Governor's review). This tag marks those rows in the
// shared feedback stream, and extractClassRoster pulls the roster back out of the
// merged local + remote feedback — the same text survives both the local copy and
// the Supabase round-trip (feedback_text -> text), so one filter covers both.
export const CLASS_INTEREST_TAG = '[Class interest]';

export function extractClassRoster(items, tag = CLASS_INTEREST_TAG) {
  const seen = new Set();
  const out = [];
  for (const f of (items || [])) {
    if (!f || typeof f.text !== 'string' || !f.text.startsWith(tag)) continue;
    const key = f.id || (f.text + '|' + (f.createdAt || f.submittedAt || ''));
    if (seen.has(key)) continue;
    seen.add(key);
    const who = f.text.slice(tag.length).trim().split('wants to join')[0].trim() || f.displayName || 'A parishioner';
    out.push({ id: f.id || key, who, at: f.createdAt || f.submittedAt || null });
  }
  return out;
}

// =============================================================================
// Export — the WHOLE curriculum as printable Markdown (Darrell trusts paper).
// =============================================================================
// Produces every week with its learner copy AND the full facilitator guide, so
// Darrell (or any facilitator) can teach from a printout with nothing on a
// screen. `startISO` lets the printout carry the real computed dates; pass null
// to omit dates (e.g. before a cohort start is set).
// Generic exporter for ANY course. `course` = { meta, sessionFlow, modules,
// footer? }. `meta` carries title/tagline/audience/format/weeks; the per-week
// hands-on label is meta.handsOnLabel (defaults to "In the app"). The youth-class
// exportCurriculumMarkdown delegates here so both courses print identically.
export function exportCurriculumMarkdownFor(course, startISO = null) {
  const meta = course?.meta || {};
  const modules = course?.modules || [];
  const sessionFlow = course?.sessionFlow || [];
  const handsOnLabel = meta.handsOnLabel || 'In the app';
  // Unit label layer — the four weekly courses set no meta.unit, so this keeps the
  // original "Week" / "weekly sessions" / "How to run the 75 minutes" wording. A
  // self-paced lesson series sets meta.unit and prints honestly as "Lesson(s)".
  const unit = meta.unit || {};
  const unitCap = unit.cap || 'Week';
  const unitSessionLabel = unit.sessionLabel || 'How to run the 75 minutes';
  const minutes = sessionFlow.reduce((t, s) => t + (s.minutes || 0), 0);
  const rows = startISO
    ? buildScheduleFor(modules, startISO)
    : modules.map((m, i) => ({ ...m, week: i + 1, date: null, weekday: null }));
  const fmt = (d) => (d && !Number.isNaN(d.getTime?.())
    ? `${weekday(d)}, ${d.toISOString().slice(0, 10)}`
    : null);

  const lines = [];
  lines.push(`# ${meta.title || ''}`);
  lines.push('');
  if (meta.tagline) { lines.push(`_${meta.tagline}_`); lines.push(''); }
  if (meta.audience) lines.push(`**For:** ${meta.audience}`);
  if (meta.format) lines.push(`**Format:** ${meta.format}`);
  lines.push(unit.selfPaced
    ? `**Length:** ${meta.weeks || rows.length} ${(meta.weeks || rows.length) === 1 ? (unit.noun || 'lesson') : (unit.nounPlural || 'lessons')} · self-paced · ~${minutes} min each`
    : `**Length:** ${meta.weeks || rows.length} weekly sessions · ~${minutes} min each`);
  lines.push('');
  lines.push('## Every session follows the same rhythm');
  lines.push('');
  sessionFlow.forEach((s) => lines.push(`- **${s.minutes} min** — ${s.name}`));
  lines.push('');
  lines.push('---');
  lines.push('');

  rows.forEach((m) => {
    const dateStr = fmt(m.date);
    lines.push(`## ${unitCap} ${m.week} — ${m.title}`);
    if (dateStr) lines.push(`*${dateStr}*`);
    lines.push('');
    lines.push(`**Big idea.** ${m.bigIdea}`);
    lines.push('');
    if (Array.isArray(m.benefits) && m.benefits.length) {
      lines.push('**What this frees in you**');
      m.benefits.forEach((b) => lines.push(`- ${b}`));
      lines.push('');
    }
    if (m.lesson) { lines.push(`**Lesson.** ${m.lesson}`); lines.push(''); }
    lines.push(`**${handsOnLabel}.** ${m.inApp}`);
    lines.push('');
    lines.push(`**Anchor — ${m.anchor.ref}.** ${m.anchor.theme}`);
    lines.push('');
    if (m.facilitator) {
      lines.push('### Facilitator guide');
      lines.push('');
      if (m.facilitator.talkingPoints?.length) {
        lines.push('**Talking points**');
        m.facilitator.talkingPoints.forEach((t) => lines.push(`- ${t}`));
        lines.push('');
      }
      if (m.facilitator.howToRun) {
        lines.push(`**${unitSessionLabel}**`);
        m.facilitator.howToRun.split('|').map((s) => s.trim()).filter(Boolean).forEach((seg) => lines.push(`- ${seg}`));
        lines.push('');
      }
      if (m.facilitator.discussionPrompts?.length) {
        lines.push('**Discussion prompts**');
        m.facilitator.discussionPrompts.forEach((d) => lines.push(`- ${d}`));
        lines.push('');
      }
    }
    lines.push('---');
    lines.push('');
  });

  lines.push(meta.footer || '_Taught by Darrell Poe · The Church of the Living God · built on PoeTech._');
  lines.push('');
  return lines.join('\n');
}

export function exportCurriculumMarkdown(startISO = null) {
  return exportCurriculumMarkdownFor(
    { meta: CLASS_META, sessionFlow: SESSION_FLOW, modules: MODULES },
    startISO,
  );
}
