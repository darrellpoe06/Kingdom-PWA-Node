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

import { isNumberedCourse, orderLessons, lessonNumber, formatAdded } from './lesson-order.js';

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
    launch: { view: 'church', churchView: 'home', churchSection: 'speak' },
    quiz: {
      questions: [
        { q: 'What is an LLM really doing when it answers you?', options: ['Looking up the true answer', 'Guessing the next word from patterns — it can be sure and still wrong', 'Remembering your life'], answer: 1, explain: 'It predicts the next word; it has no ground truth and can be confidently wrong. It is a tool, not an oracle.' },
        { q: 'If it sounds completely sure, does that mean it’s right?', options: ['Yes, confidence = truth', 'No — confidence is not truth; test it', 'Only on weekdays'], answer: 1, explain: 'Sounding sure and being right are different things — the whole class is "test everything."' },
      ],
    },
    benefits: [
      'You leave able to name what the thing actually is. A model that has learned which word tends to come next is a pattern-guesser, not a knower — so its confidence carries no information about whether it is right, and you stop reading fluency as evidence.',
      'You get the posture that makes every other week work: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21). Not awe and not fear — a test you actually run, and a keeping of only what survives it.',
      'You can spot a hallucination before it costs you. A made-up paragraph reads exactly like a true one, so the tell is never the tone; it is the check you ran against a real source.',
      'You handle it as a tool under Yahweh, never as an oracle beside Him. In a trained hand a hammer builds; swung carelessly it breaks something. The skill is the swing, and the swing is on purpose.',
      'Carry it out this week: send one prompt in the Council Chamber, write down one thing it did well and one thing it got wrong, and keep both. Your first catch is the beginning of your judgment.',
    ],
    levels: { child: 'What is A.I., really? Let us find out. A.I. is a tool on a phone or a screen. It has read a lot of words. Lots and lots. So it is good at guessing the next word. That is all it does. It guesses. It does not know you. It has no eyes. It has no heart that knows right from wrong. Here is the tricky part. It can sound very sure and still be wrong. It can even make things up. We call that a made-up answer. So we do not say wow, and we do not get scared. We say, this is a tool. A hammer is a tool. You use a hammer with care. You use A.I. with care too. You are the one in charge, not the tool. The Word says it this way: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21). Prove means test it. Keep the good part. This week, ask it one thing. Find one thing it got right. Find one thing it got wrong.', youth: 'What is A.I., really? The kind we use this week is called a large language model. That is a long name for a simple idea. It has read a huge pile of writing, and from all that reading it learned which word usually comes next. Then it keeps guessing, one word after another, until it has a whole answer. It is very good at that guessing. But guessing is not knowing. It has no eyes to see the world. It does not remember your life. It has no conscience. So it can write a smooth paragraph that sounds true and is simply made up. People call that a hallucination. So how should we treat it? Not with awe, as if it were wise. Not with fear, as if it were a monster. We treat it as a tool that Yahweh lets us steward, like a hammer or a calculator. In a trained hand it builds. Swung carelessly it breaks things. Our job is to learn to use it on purpose. The rule for the whole class is one verse: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21). Test it, then keep only what passes.', teen: 'What is A.I., really, once you take the hype off it? A large language model is a program that has read an enormous amount of text and learned, with real skill, which word tends to follow which. When you type a prompt, it predicts a likely next word, then the next, and builds an answer out of those predictions. That is the whole trick. It is a brilliant pattern-guesser, but it is not a knower. It has no eyes on the world, no memory of your life, and no conscience telling it right from wrong. That is why it can hand you a confident paragraph that is completely invented. The name for that is a hallucination, and it reads exactly like a true answer. So the first posture of a wise user is neither awe nor fear. It is stewardship. A hammer and a calculator are powerful in a trained hand and dangerous when swung carelessly, and this tool is the same. You are in charge of it; it is never in charge of you, and it never stands beside Yahweh as a source of truth. The whole course hangs on one command: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21).', senior: 'What is A.I., really? Begin by naming it accurately, because a wrong name produces a wrong posture. A large language model is trained on an immense body of writing and learns, with remarkable precision, the statistical likelihood of the next word given the words before it. Every answer it produces is assembled from those predictions. It is therefore an extraordinarily capable pattern-guesser and not a knower: it has no perception of the world, no memory of the person asking, and no conscience by which to weigh what it says. The practical consequence is the one learners most need to hear. The model can produce fluent, confident prose that is entirely fabricated, which is called a hallucination, and nothing in the tone distinguishes it from a true statement. Confidence, in this tool, carries no information about accuracy. The right response is neither the awe that treats it as an oracle nor the fear that refuses it. It is stewardship under Yahweh. Like a hammer or a calculator, it serves well in a trained hand and does damage when handled carelessly, so the aim of the course is deliberate, accountable use. The governing text for everything that follows is brief: "Prove all things; hold fast that which is good" (1 Thessalonians 5:21).' },
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
    benefits: [
      'You leave knowing the answer is mostly decided before the model says a word. “tell me about dogs” cannot produce a sharp reply, because nothing sharp was asked.',
      'You carry the four keys — WHAT you want, WHEN and where it applies, WHY you need it, HOW you want it back — so a disappointing answer stops being a mystery and becomes a checklist you skipped.',
      'You learn to hear before you answer, which is the verse under the whole week: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). Asking before you think is that same folly pointed the other way.',
      'You gain a skill that transfers straight off the screen. A clear question to a teacher, a parent or a boss is the same instrument — name the role, the audience, and the form you need back.',
      'Carry it out this week: write one vague prompt and one clear prompt for the same thing, set the answers side by side, and keep the pair. The difference teaches it; nobody has to argue you into it.',
    ],
    levels: { child: 'Asking good questions is a skill. You can learn it. When you ask A.I. a fuzzy question, you get a fuzzy answer. If you ask, tell me about dogs, what do you get? A long, plain answer. It does not help much. Now ask a clear question. Say what you want. Say when or where. Say why you need it. Say how you want the answer. That is four keys: what, when, why, how. You can even say who it is for. Explain this to my little sister. Now the answer is clear. The Word says to listen first and think first: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). So think before you ask. A good question helps with a teacher, with Mom or Dad, and with a boss one day too. This week, ask one fuzzy question and one clear one. Which answer was better?', youth: 'Asking good questions is the skill this week, and it matters more than most people think. The answer you get back from A.I. is mostly decided before it writes a single word. It is decided by your question. If you type something vague, like tell me about dogs, you get a vague, general answer that does not really help anyone. A clear question uses four keys. What do you want? When or where does it apply? Why do you need it? How do you want it back, as a list, a short paragraph, or words a fifth grader can follow? You can sharpen it even more by giving it a role and an audience, like asking it to explain photosynthesis to your little sister. This is not just a computer trick. It is the same skill you use when you ask a teacher, a parent or a boss for help. The Word warns us about speaking before we listen: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). Asking before you have thought is the same mistake turned around.', teen: 'Asking good questions sounds easy, but the quality of an A.I. answer is mostly settled before the model produces a word, and it is settled by you. A vague prompt gets a vague reply. Type tell me about dogs and you will get a generic page that answers nobody in particular. A clear prompt names the four keys: WHAT you actually want, WHEN or where it applies, WHY you need it, and HOW you want it returned, whether that is a list, a paragraph, or an explanation pitched for a ten-year-old. Give the model a role and an audience and it sharpens again; explain photosynthesis to my little sister produces something very different from explain photosynthesis. The model mirrors the clarity you hand it, which is what garbage in, garbage out really means. And notice that this is not a trick that only works on machines. Asking a teacher, a parent or a future boss a precise question is the same skill, and it will serve you long after this app is replaced. Scripture names the folly on the other side: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13).', senior: 'Asking good questions is the week that turns frustration into method, and it is worth teaching as a discipline rather than a tip. The usefulness of any answer from a language model is largely determined before the model generates anything, by the precision of the request. An underspecified prompt, such as tell me about dogs, can only return an underspecified answer, because there is nothing particular to be answered. A well-formed prompt supplies four things: what is wanted, when or where it applies, why it is needed, and how the answer should be shaped, whether as a list, a paragraph, or an explanation suited to a particular reader. Assigning the model a role and naming an audience narrows it further and usually improves it markedly. Learners should see that a disappointing answer is rarely a mystery; it is usually one of those four keys left out. They should also see that the skill transfers entirely beyond the screen. Framing a clear question for a teacher, a physician, an employer or a pastor is the same act. The Word addresses its opposite directly: "He that answereth a matter before he heareth it, it is folly and shame unto him" (Proverbs 18:13). A question asked before it has been thought through is that folly in reverse.' },
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
    levels: { youth: 'The Test is how we judge what A.I. tells us, and this is the most important week of the class. Here is why. An answer that is plainly wrong is not the big danger, because you can see it and throw it away. The big danger is the answer that looks right and is wrong. It reads smooth. It sounds smart. So you believe it, you repeat it, and you might even hand it in with your name on it. That is why we never trust an answer because it sounds smart. First we run it through the Test from Philippians 4:8. Is it true? Is it honest? Is it just? Is it pure? Is it lovely? Then, for any fact, we check it in a real source before we use it. A date, a name, a number, a verse. The order is the rule. Check it, then trust it. And do not check by asking the same A.I. again, because it will only agree with itself. Find a different source. Doubting well is not being mean. It guards your mind and your name. "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15).', child: 'The Test is the big one. It is how we judge what A.I. tells us. Here is the rule. Some answers are wrong, and you can tell. You throw them out. That is easy. But some answers look right and are wrong. That is the bad kind. You might believe it. You might tell a friend. You might put it on your paper. So we do not trust an answer just for sounding smart. We test it. Is it true? Is it good? Is it kind and clean? Then we check the facts. A date. A name. A number. We look it up in a real book or ask a grown-up we trust. Check first. Trust next. Not the other way. And do not ask the same A.I. again. It will just say the same thing. The Word says, "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15). Be the one who looks well. Check before you trust.',
      teen: 'The Test is about judging what A.I. tells you. This is the most important week, and it is one rule. An answer that LOOKS right and is WRONG is more dangerous than an answer that is obviously wrong. The obviously wrong one you throw away. The smooth one you believe, repeat, and hand in with your name on it. So never trust an answer because it sounds smart. Sounding smart is the easiest thing an A.I. does. Run it through the Test: is it true, is it honorable, is it just, is it pure, is it lovely, is it commendable, is it excellent, is it praiseworthy. Then, for anything that claims to be a FACT, go and check it in a real source before you use it. A date, a name, a number, a verse. Check it. Here is the order, and the order matters: verify, THEN trust. Not trust, then verify. And do not check by asking the same A.I. again. It will agree with itself. That is not proof, that is an echo. Find a different source. Learning to doubt well is not being negative. It guards your mind, and it guards your name. "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15).',
      senior: 'The Test, judging what A.I. tells you, is the subject. Teach this week as the hinge of the course, because every other skill rides on it. The danger is not the answer a student can see is wrong; it is the plausible answer, fluent and well-formed, that he therefore does not check. Fluency is not accuracy, and a model has no way to tell you which of its sentences it is confident about and which it assembled. Separate two operations that students collapse into one. The Test (Philippians 4:8) judges whether a thought is WORTH KEEPING. Verification judges whether a claim is TRUE. A statement can pass the Test on every count and still be false, and a true statement can be worth refusing. Both are required, and they answer different questions. Then give the verification habit a shape they can actually run: name the claim, name the source that would settle it, and go to that source. The check must be INDEPENDENT. Asking the same model a second time produces agreement, not evidence, and a student who does that has learned to manufacture confidence rather than to test a claim. The order is the method: verify, then trust. Trust-but-verify inverts it and is how a wrong figure reaches a page with a student’s name under it. And name the stake honestly, because the young feel this one: what you repeat, you have vouched for. "The simple believeth every word: but the prudent man looketh well to his going" (Proverbs 14:15) — prudence here is not suspicion of everything, it is looking well to where you are about to put your foot.',
    },
    quiz: {
      questions: [
        { q: 'Which kind of A.I. answer is the MOST dangerous?', options: ['One that is obviously wrong', 'One that looks right but is wrong — because you’ll believe it', 'One that is too long'], answer: 1, explain: 'A confident, wrong-but-believable answer is the real danger; that’s why we verify before we trust.' },
        { q: 'What’s the rule for a claim of fact?', options: ['Trust it if it sounds smart', 'Verify it against a real source, THEN trust', 'Repeat it quickly'], answer: 1, explain: 'Verify, then trust — not the other way around. Doubting well protects your mind and your name.' },
      ],
    },
    benefits: [
      'You leave with the danger named correctly: an answer that looks right and is wrong is worse than one that is obviously wrong, because you will believe it and then repeat it.',
      'You carry the filter in the words it is written in — "whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely" (Philippians 4:8) — a sequence you run, not a mood you have.',
      'You stop grading answers by how smart they sound. Verify, THEN trust; “trust but verify” lets the trusting happen first, and that is exactly where the damage lives.',
      'You learn to doubt well without turning cynical. The first account always sounds right — "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him" (Proverbs 18:17) — so searching it is not disrespect; it is the neighbour’s job.',
      'Carry it out this week: run the in-app Test on three answers, find the one that is wrong on purpose, and verify one real fact against a real source before you repeat it anywhere.',
    ],
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
    benefits: [
      'You leave with the bright line drawn where it actually falls — not at “did you use it” but at “who ended up stronger.”',
      'You know what a tutor does that a ghostwriter never does: quizzes you, explains the hard part, checks your reasoning, and leaves the work honestly yours.',
      'You have Daniel as a pattern rather than a slogan. He "purposed in his heart" (Daniel 1:8) before Babylon’s schooling ever touched him, and came out with "knowledge and skill in all learning and wisdom" (Daniel 1:17) — inside the system, never owned by it.',
      'You carry the standard that settles it when nobody is watching: "whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23). A shortcut that leaves you emptier fails that test long before it fails a teacher’s.',
      'Carry it out this week: take one hard topic, turn it into your own study guide in your own words, and check it yourself. If you can teach it afterwards it was learning; if you cannot, it was copying.',
    ],
    levels: { child: 'A.I. for school, honestly. That means we use it the right way. There is a line. On one side, A.I. does your work and you copy it. Then you did not learn. You got weaker. And you told a lie, because you said it was your work. On the other side, A.I. helps you learn. It asks you questions. It explains the hard part. It checks your work. Then you get stronger, and the work is really yours. That is a tutor. A tutor helps you grow. Daniel went to a big school in Babylon. He learned a lot. But he still loved Yahweh. He did not forget who he was. The Word says Yahweh gave him "knowledge and skill in all learning and wisdom" (Daniel 1:17). And it says, "whatsoever ye do, do it heartily, as to the Lord" (Colossians 3:23). So do your best, and do it for Him. This week, use A.I. as a tutor on one hard thing.', youth: 'A.I. for school, honestly, comes down to one bright line, and it is about who ends up stronger. If the A.I. does the thinking and you copy what it wrote, you walk away weaker than you came in. You also told a lie, because you turned in work as yours that was not yours. But if you use A.I. as a tutor, everything changes. A tutor quizzes you. A tutor explains the part you are stuck on. A tutor checks your reasoning and shows you where it went wrong. Then you walk away stronger, and the work is honestly yours. Daniel is our picture. He was taken to Babylon and put in their school. He learned everything they taught, and he did better than everyone, but he never stopped belonging to Yahweh. The Word says Yahweh gave him and his friends "knowledge and skill in all learning and wisdom" (Daniel 1:17). He used the system without being owned by it. And the standard for our work is this: "whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23). A shortcut that leaves you emptier is not worth taking.', teen: 'A.I. for school, honestly, is not about whether you used it. It is about a bright line that falls on who ends up stronger. When the model does the thinking and you copy the result, you leave the assignment weaker than you started, and you have misrepresented your work, which is a lie with your name on it. When the model works as your tutor, the result flips. It quizzes you on the material, explains the step you could not see, and tests your reasoning, and you leave stronger with work that is honestly yours. The question to ask is simple: after this, could I explain it without the screen? Daniel is the pattern for this. Carried off to Babylon, he was enrolled in the empire\'s own education and mastered it, and yet he never stopped belonging to Yahweh. The Word says Yahweh gave him "knowledge and skill in all learning and wisdom" (Daniel 1:17). He used the system without being owned by it. That is what we want for you. The standard is not whether a teacher catches you: "whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23).', senior: 'A.I. for school, honestly, is a question most adults frame wrongly, as though the issue were simply whether a student used the tool. The real line is who is stronger at the end of the work. When the model produces the thinking and the student transcribes it, the student is left less capable than before and has also misrepresented the work as his own, which is a form of lying. When the model serves as a tutor, questioning the student, explaining the difficult step, and testing his reasoning, the student leaves more capable and the work remains honestly his. A useful test for a parent or teacher is whether the student can explain the result afterwards without the screen in front of him. Daniel offers the pattern. Taken into Babylon\'s own schools, he mastered their learning so thoroughly that he surpassed his peers, yet he never ceased to belong to Yahweh; the Word records that Yahweh gave him and his companions "knowledge and skill in all learning and wisdom" (Daniel 1:17). He used the system without being owned by it. The standard that governs the unobserved moment is not detection but devotion: "whatsoever ye do, do it heartily, as to the Lord, and not unto men" (Colossians 3:23).' },
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
    benefits: [
      'You leave with the Kingdom’s inversion applied to a tool that begs to be pointed at yourself: "whosoever will be great among you, shall be your minister" (Mark 10:43).',
      'You know where greatness is actually measured — "And whosoever of you will be the chiefest, shall be servant of all" (Mark 10:44) — and who set that price: He "came not to be ministered unto, but to minister" (Mark 10:45).',
      'You carry the one use of liberty the Word names: "by love serve one another" (Galatians 5:13). Freedom with a powerful tool is not the reward; it is the assignment.',
      'You find out that serving is where your own skill gets real. Teaching a phone-shy elder forces you to understand the thing you only thought you had learned.',
      'Carry it out this week: help one person — a grandparent, an elder, a friend — do one real thing in the app. One prayer request sent, one photo shared. That is the whole week.',
    ],
    levels: { child: 'A.I. that serves people is the best kind. It is easy to use a tool just for me. My games. My homework. My questions. But Jesus showed us a better way. He said the great one is the one who helps. "whosoever will be great among you, shall be your minister" (Mark 10:43). A minister here means a helper. So let us use this tool to help someone else. You can help Grandma send a photo. You can help an older friend at church send a prayer request. You can make a little study helper for a younger kid. That is serving. And here is a surprise. When you teach someone, you learn it better too. The Word says, "by love serve one another" (Galatians 5:13). This week, find one person. Help them do one real thing with the app. That is your whole job this week.', youth: 'A.I. that serves people is the best use of this whole skill. A tool this strong makes it easy to point it only at yourself, at your homework, your games and your questions. But the Kingdom of Yahweh turns that upside down. Jesus said that whoever wants to be great must become a servant: "whosoever will be great among you, shall be your minister" (Mark 10:43). He did not only say it. He lived it, since He "came not to be ministered unto, but to minister" (Mark 10:45). So the best thing you can do with what you are learning is to aim it at somebody else. Sit with an elder who struggles with a phone and help them write a prayer request. Help a grandparent send a photo. Build a younger kid a little study helper. You have real freedom with this tool, and the Word tells you what freedom is for: "by love serve one another" (Galatians 5:13). There is a bonus, too. Serving is where your skill becomes real, because teaching someone else makes you truly understand the thing you thought you knew.', teen: 'A.I. that serves people is where this course points the whole skill, because a tool this powerful quietly tempts you to aim it only at yourself: my assignments, my entertainment, my questions. The Kingdom reverses that direction. Jesus put it plainly: "whosoever will be great among you, shall be your minister" (Mark 10:43), and the price of first place is "servant of all" (Mark 10:44). He set that standard by living it, since He "came not to be ministered unto, but to minister" (Mark 10:45). So the best return on what you have learned is to point it at someone else. Sit with an elder who finds the phone confusing and write a prayer request together. Help a grandparent share a photo with the family. Build a small study helper for a younger student. You have been given freedom with a strong tool, and the Word names what that liberty is for: "by love serve one another" (Galatians 5:13). There is also a practical gain. Teaching a phone-shy elder forces you to understand what you only thought you had mastered, so serving is where your competence becomes real.', senior: 'A.I. that serves people is the week in which the skill is given its proper direction. Any tool this capable invites self-reference: it is natural to use it for one\'s own work, one\'s own amusement and one\'s own questions. The teaching of Jesus inverts that instinct. He told His disciples, "whosoever will be great among you, shall be your minister" (Mark 10:43), and that the one who would be first must be "servant of all" (Mark 10:44), and He grounded the command in His own life, for He "came not to be ministered unto, but to minister" (Mark 10:45). The fitting use of what learners have gained is therefore outward. They can sit with an elder who is uneasy with a phone and help compose a prayer request, help a grandparent share a photograph, or build a modest study aid for a younger child. The liberty this tool affords is real, and the Word defines its purpose: "by love serve one another" (Galatians 5:13). Those who guide learners should also point out the benefit that returns to the servant. Explaining a skill to someone unfamiliar with it demands genuine understanding, so service is the place where competence is proven rather than assumed.' },
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
    benefits: [
      'You leave on the other side of a quiet line: a user accepts whatever the app hands them, and a maker asks what this could do for somebody and then builds it.',
      'You know you do not need to be a programmer to cross it. A good prompt, a clear plan and one small useful thing is real building.',
      'You carry the Word’s own weight on skilled work: "Seest thou a man diligent in his business? he shall stand before kings" (Proverbs 22:29). Diligence is what the verse names — not talent, and not luck.',
      'You build for a person instead of for a grade, which is what makes a small tool worth keeping: a scripture-memory helper somebody actually opens beats a clever thing nobody uses.',
      'Carry it out this week: design it, build it in the app, and get it working end to end. Finished and small beats grand and unbuilt.',
    ],
    levels: { child: 'Build something useful! That is this week. There are two kinds of people with a tool. A user just takes what the app gives. A maker asks, what could this do to help someone? Then the maker builds it. You can be a maker. You do not have to write code. You just need a good plan, a clear question, and one small thing that works. It could be a helper to learn a Bible verse. It could be a study buddy. It could be a chore list. Small is fine. Working is better than fancy. The Word says good work matters: "Seest thou a man diligent in his business? he shall stand before kings" (Proverbs 22:29). Diligent means you keep at it and do it well. So think of one person. What would help them? Build that. Get it to work. Then show it to someone.', youth: 'Build something useful, because this is the week you cross a quiet line. On one side is the user. A user takes whatever the app hands them. On the other side is the maker. A maker asks, what could this do for someone? and then goes and builds it. Crossing that line changes how you see every app you use. The good news is that you do not have to be a programmer to start. A clear prompt, a plan, and one small thing that really works is real building. It might be a helper for memorizing a Bible verse, a study buddy for one subject, or a chore tracker for your family. Build it for a person, not for a grade, and make it actually work, because real beats fancy every time. Skilled work carries weight in the Word: "Seest thou a man diligent in his business? he shall stand before kings" (Proverbs 22:29). Notice the word diligent. It is about steady, faithful effort, not about being born clever. We are not raising kids who get used by the tool. We are raising builders who put it to work.', teen: 'Build something useful, and in doing it you cross a line most people never notice. A user takes whatever an app offers and stops there. A maker looks at the same tool and asks what it could do for a particular person, and then builds that. Once you have crossed from one side to the other, you stop seeing technology as something that happens to you. You do not need to be a programmer to begin. A precise prompt, a clear plan and one small, working result is genuine building: a scripture-memory helper someone actually opens, a study partner for one hard subject, a chore tracker your family uses. Build for a person rather than a grade, and hold yourself to one standard above the others, which is that it works end to end. Finished and small beats grand and unbuilt. The Word gives skilled work real weight: "Seest thou a man diligent in his business? he shall stand before kings" (Proverbs 22:29). What the verse honors is diligence, not talent or luck, which means it is open to you. The goal is builders who put the tool to work, never people the tool is using.', senior: 'Build something useful is the week in which learners move from consuming technology to directing it, and it deserves to be framed as that kind of threshold. A user accepts what an application provides; a maker considers what the same tool could accomplish for a specific person and then constructs it. The shift is less technical than it sounds and more significant than it looks, because it changes the learner\'s relationship to every tool he will use afterwards. No programming background is required. A carefully framed prompt, a clear plan and a single small result that functions reliably constitute real building; examples include a scripture-memory aid, a study companion for one subject, or a household chore tracker. Two standards should be pressed. First, build for a named person rather than for an assignment, since usefulness is what gives a small tool its value. Second, insist that it work from beginning to end; a finished modest tool is worth more than an ambitious unfinished one. The Word honors this kind of labor: "Seest thou a man diligent in his business? he shall stand before kings" (Proverbs 22:29). It is diligence the verse commends, which places the reward within reach of every faithful learner.' },
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
    benefits: [
      'You leave able to name all four pulls rather than only the obvious one — over-reliance, time-sink, oversharing, and the quiet one: trusting a screen more than people and more than Yahweh.',
      'You carry a distinction sharper than “be careful”: "All things are lawful unto me, but all things are not expedient" (1 Corinthians 6:12). Lawful and good are two different questions, and only one of them is easy.',
      'You know the line Paul actually holds: "I will not be brought under the power of any" (1 Corinthians 6:12). What is refused there is mastery, not use.',
      'You set your guardrails BEFORE you need them, because a limit decided in advance is a decision, while a limit decided in the moment is a negotiation you will lose.',
      'Carry it out this week: write your three rules — what you will never share, when you will stop, who you will tell — and read the app’s privacy promise for yourself. "Keep thy heart with all diligence; for out of it are the issues of life" (Proverbs 4:23).',
    ],
    levels: { child: 'Guarding your heart and your time is this week. A strong tool can pull at you. Here are four pulls. One: you let it think for you, and you stop thinking. Two: you lose a whole hour and do not notice. Three: you type private things you should keep for your family. Four: you trust a screen more than your people and more than Yahweh. That last one is quiet, so watch for it. The Word says, "I will not be brought under the power of any" (1 Corinthians 6:12). That means no tool gets to be the boss of you. So make your rules now, before you need them. What will you never share? When will you stop? Who will you tell if something feels wrong? The Word also says, "Keep thy heart with all diligence; for out of it are the issues of life" (Proverbs 4:23). Write your three rules this week.', youth: 'Guarding your heart and your time matters, because everything powerful pulls at you, and this tool pulls in four ways. First is over-reliance, when you let it do your thinking so you stop thinking. Second is the time-sink, when an hour is gone before you notice. Third is oversharing, when you type private things into a screen that belonged between you and the people who love you. The fourth is quiet, so name it out loud: trusting a screen more than people, and more than Yahweh. Paul wrote about this kind of pull: "All things are lawful unto me, but all things are not expedient" (1 Corinthians 6:12). Something can be allowed and still not be good for you. And he drew his line: "I will not be brought under the power of any" (1 Corinthians 6:12). So we set guardrails before we need them. Decide what you will never share. Decide when you will stop. Remember the tool serves your life, never the other way around. PoeTech has its own brakes for the same reason. Above everything, "Keep thy heart with all diligence; for out of it are the issues of life" (Proverbs 4:23).', teen: 'Guarding your heart and your time is not a warning about a bad tool; it is honesty about a strong one. Everything powerful pulls, and this pulls in four directions. Over-reliance lets it think so you gradually stop. The time-sink takes an hour before you notice it is gone. Oversharing puts private things into a screen that should have stayed with the people who love you. And the quiet one is trusting a screen more than people and more than Yahweh, which rarely announces itself. Paul gives a sharper tool than just be careful: "All things are lawful unto me, but all things are not expedient" (1 Corinthians 6:12). Whether something is allowed and whether it is good are two separate questions. Then he names the line he will not cross: "I will not be brought under the power of any" (1 Corinthians 6:12). What he refuses is being mastered, not the thing itself. So build your guardrails before you need them, because a limit set in advance is a decision and a limit set in the moment is a negotiation you usually lose. The app is built the same way, with its own brakes, processing your data without selling it or keeping it. "Keep thy heart with all diligence; for out of it are the issues of life" (Proverbs 4:23).', senior: 'Guarding your heart and your time is a lesson about the ordinary cost of powerful things, and it should be taught without alarm and without naivety. This tool exerts four distinct pulls. Over-reliance allows it to do the thinking until the habit of thinking weakens. The time-sink consumes an hour that no one decided to spend. Oversharing places private matters into a screen that belonged within the circle of family and trusted friends. The fourth is the least visible: trusting a screen above people and above Yahweh, which tends to grow unnoticed. Paul supplies the distinction that clarifies all four: "All things are lawful unto me, but all things are not expedient" (1 Corinthians 6:12). Permission and benefit are separate questions, and only the first is easy to answer. He then states his boundary: "I will not be brought under the power of any" (1 Corinthians 6:12). He refuses mastery, not use. The practical counsel follows from this. Guardrails are set in advance, since a limit fixed beforehand is a decision, while a limit weighed in the moment is a negotiation most of us lose. The application itself was designed with the same restraint, including its own brakes and a commitment to process data without selling or keeping it. "Keep thy heart with all diligence; for out of it are the issues of life" (Proverbs 4:23).' },
    lesson: 'Everything powerful pulls at you, and this tool pulls in four ways. Over-reliance — letting it think so you stop thinking. Time-sink — an hour gone before you notice. Oversharing — typing private things into a screen you should have kept between you and the people who love you. And the quiet one: trusting a screen more than people and more than Yahweh. "All things are lawful unto me," Paul says, but "I will not be brought under the power of any" (1 Corinthians 6:12). So we build guardrails BEFORE we need them: decide what you will never share, decide when you will stop, and remember the tool serves your life — never the other way around. PoeTech is built the same way on purpose — it has its own brakes, and it processes your data without selling it or keeping it. Above all else, guard your heart, because everything you do flows from it (Proverbs 4:23).',
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
    benefits: [
      'You leave able to see the ladder you climbed: user, then discerner who tests what it says, then server who points it at others, then maker who builds, and now multiplier who hands it on.',
      'You get the real proof of ownership. If you can make one week clear to someone younger you have it; if you cannot, you were carrying it rather than holding it.',
      'You carry the Kingdom’s own multiplication instruction: "the same commit thou to faithful men, who shall be able to teach others also" (2 Timothy 2:2). Faithful, and able to teach — two filters, not one.',
      'You stand inside the commission the King gave: "Go ye therefore, and teach all nations" (Matthew 28:19), and "Teaching them to observe all things whatsoever I have commanded you" (Matthew 28:20). Teaching is the verb in both halves.',
      'Carry it out this week: pick the week that helped you most, prepare the five-minute version of it, and put your name on the helper list for the next group. Kings raise kings.',
    ],
    levels: { child: 'Teach the next group! That is our last week. Look how far you came. First you were a user. Then you learned to test what it says. Then you used it to help people. Then you built something. Now you get to teach. Here is a secret. If you can teach it to someone younger, you really know it. So pick the week that helped you most. Make it short. Five minutes. Use easy words. Then teach it to one real person. Your name goes on the helper list for the next class. This is how the Kingdom grows. Paul told Timothy to teach people who will teach others: "the same commit thou to faithful men, who shall be able to teach others also" (2 Timothy 2:2). And Jesus said, "Go ye therefore, and teach all nations" (Matthew 28:19). Kings raise kings. You can too.', youth: 'Teach the next group, because this week is a commissioning, not just the end of a class. Look back at the ladder you climbed over eight weeks. First you were a user. Then you became a discerner who tests what the tool says. Then a server who points it at other people. Then a maker who builds. Now you step up to multiplier, the one who hands it on. Here is how you know you really own something: you can teach it simply. If you can make one week clear to someone younger, you have mastered it. If you cannot, you were only carrying it around. So each of you will prepare a five-minute version of the one week that helped you most, and those short lessons will start the next group. This is the pattern of the whole Kingdom. Paul told Timothy to pass it on to "faithful men, who shall be able to teach others also" (2 Timothy 2:2). Jesus gave the same kind of command: "Go ye therefore, and teach all nations" (Matthew 28:19). Kings raise kings.', teen: 'Teach the next group is the commissioning of the course, and it is meant to feel like a sending rather than a graduation. Over eight weeks you have climbed a ladder. You started as a user, became a discerner who tests what the tool says, then a server who aims it at others, then a maker who builds, and now you are asked to be a multiplier who hands it on. There is a simple proof of whether you own what you learned: can you teach it plainly? If you can make one week clear to someone younger, the knowledge is yours. If you cannot, you were holding it loosely. So you will each prepare a five-minute version of the week that helped you most, and those short lessons will seed the next cohort. This is how the Kingdom has always multiplied. Paul told Timothy to entrust what he had heard to "faithful men, who shall be able to teach others also" (2 Timothy 2:2), and that is two filters, faithful and able. Jesus sent His disciples with the same verb: "Go ye therefore, and teach all nations" (Matthew 28:19), "Teaching them to observe all things whatsoever I have commanded you" (Matthew 28:20). Kings raise kings.', senior: 'Teach the next group is where the course reaches its purpose, and those guiding it should present the week as a commissioning rather than a conclusion. Over eight weeks the learners have ascended a ladder: from user, to discerner who tests what the tool asserts, to server who directs it toward others, to maker who builds with it, and finally to multiplier who passes it on. The surest evidence that a person has mastered something is the ability to teach it simply. A learner who can make one week clear to a younger student has genuinely acquired it; one who cannot has only been carrying it. Each learner therefore prepares a five-minute version of the week that served him best, and those brief lessons become the foundation of the next cohort. This is the enduring pattern of the Kingdom. Paul instructed Timothy to commit what he had received to "faithful men, who shall be able to teach others also" (2 Timothy 2:2), a charge that requires both faithfulness and ability. Jesus commissioned His disciples in the same terms: "Go ye therefore, and teach all nations" (Matthew 28:19), "Teaching them to observe all things whatsoever I have commanded you" (Matthew 28:20). Kings raise kings.' },
    lesson: 'This is the commissioning. Over eight weeks you have climbed a ladder — user, then discerner who tests what it says, then server who points it at others, then maker who builds, and now multiplier who hands it on. The proof that you truly own something is that you can teach it simply; if you can make one week clear to someone younger, you have mastered it. So each of you prepares a five-minute version of the one week that helped you most, and those five-minute lessons seed the next cohort. This is the whole pattern of the Kingdom: "the things that thou hast heard of me among many witnesses, the same commit thou to faithful men, who shall be able to teach others also" (2 Timothy 2:2), and "Go ye therefore, and teach all nations" (Matthew 28:19), "Teaching them to observe all things whatsoever I have commanded you" (Matthew 28:20). Kings raise kings.',
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
  // THE .md IS IN NUMBER ORDER TOO (Darrell 2026-09-24, on the lesson list:
  // "MD too" / "They are numbered!!!!!!!"). A self-paced course whose lessons
  // carry their own numbers (lib/lesson-order.js) prints them lowest first,
  // each under ITS number — never its position. A dated cohort keeps its weeks.
  const numbered = !startISO && isNumberedCourse(modules);
  const rows = startISO
    ? buildScheduleFor(modules, startISO)
    : numbered
      ? orderLessons(modules, 'number').map((m) => ({ ...m, week: lessonNumber(m), date: null, weekday: null }))
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
    ? `**Length:** ${rows.length || meta.weeks} ${(rows.length || meta.weeks) === 1 ? (unit.noun || 'lesson') : (unit.nounPlural || 'lessons')} · self-paced · ~${minutes} min each`
    : `**Length:** ${rows.length || meta.weeks} weekly sessions · ~${minutes} min each`);
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
    else if (formatAdded(m.added)) lines.push(`*Added ${formatAdded(m.added)}*`);
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
