// =============================================================================
// conference-class — the all-ages conference class: three paced lanes, one room
// =============================================================================
// Darrell 2026-06-15: the church wants a conference class "for all ages." Two
// real audiences named it:
//   • The elderly community wants to learn technology AT THEIR PACE.
//   • The middle-aged (35-45) are tired of being the family help desk, but still
//     expect the best for both their elders and their kids.
// One class can't be one lecture. So the conference is ONE event with THREE
// parallel lanes, each paced for who's in it:
//   • elders   — "At Your Pace": no rush, no shame, you leave independent.
//   • everyday — "Set It Up Once": stop being tech support; set people up to last.
//   • youth    — a conference taste of the full 8-week "Learning A.I. The Way".
//
// What is REAL here (DR-0061 / DR-0076 — nothing painted):
//   • The conference DATE is Governor-set (data.conferenceClass.startDate) and
//     blank until set — the UI says "date to be set," never a fake date. When a
//     date is set, the weekday shown is the TRUE weekday of that date.
//   • A learner's progress per lane is counted from their OWN record
//     (data.classProgress, namespaced 'conf:<lane>:<session>'), not painted.
//   • The "I want this lane" button routes a REAL note to the Governor through
//     the same church-voice pipe (addChurchVoice) already reviewed for the youth
//     class — a wired connection, carrying WHICH lane, not a dead button.
// The LANE curricula are authored content (a published syllabus, like a
// foundation doc), the same status as the youth MODULES.
//
// Grounds: COMMUNITY-FIRST-MISSION (COLG = the named first community; accessibility
// default; teach-the-community), ANXIETY-CLARITY-PRINCIPLE (the elderly lane errs
// toward MORE guidance — what/when/why/how, for the scared learner), DR-0076
// (the youth lane carries the Verification Doctrine kid-sized: judge, don't trust).
// Scripture is cited by REFERENCE with a plain-language theme gloss — never a
// quoted translation — per the SCRIPTURE-REFERENCE-STANDARD.
// =============================================================================

import { toMs, weekday } from './church-classes.js';

// Proposed conference date for the all-ages class. Blank by default so the UI is
// honest ("date to be set") until the Governor sets a real one in-app. Re-exported
// shape mirrors the youth cohort's Governor-editable start date.
export const PROPOSED_CONFERENCE_DATE = ''; // Governor sets data.conferenceClass.startDate

export const CONFERENCE_META = {
  title: 'Tech for Every Generation',
  tagline: 'One room, three paces — nobody left behind, nobody held back.',
  audience: 'the whole church — every age, at its own pace',
  format: 'One conference session, three parallel lanes. Pick your lane; move at your speed; help right beside you.',
};

// Each lane: who it's for, the promise it makes to them, and a few short
// conference-sized sessions (the big idea in plain language, what you actually DO
// in the app, and a Scripture anchor: reference + theme gloss, never a quoted verse).
export const LANES = [
  {
    id: 'elders',
    label: 'At Your Pace',
    forWhom: 'Our seasoned saints — and anyone who wants to go slow',
    promise: 'No rush. No shame. Ask as many times as you like. You leave able to do real things on your own phone — by yourself.',
    sessions: [
      {
        id: 'a-tool-not-a-test',
        title: 'Your phone is a tool, not a test',
        bigIdea: 'You are not behind. A smartphone is just a tool, and a tool is learned one button at a time. We go at your pace, and repeating a step is normal — not failure.',
        inApp: 'Open the app and make the words bigger. That is the whole first step, and it counts.',
        anchor: { ref: 'Isaiah 46:4', theme: 'Even to old age God Himself carries you — you are never too old to be cared for, or to learn something new.' },
      },
      {
        id: 'just-talk-to-it',
        title: 'You can just talk to it',
        bigIdea: 'You do not have to type. Press the microphone and speak — the app listens and answers back. Your voice is enough.',
        inApp: 'Use the speak button to ask one real question out loud, and read what it says back to you.',
        anchor: { ref: 'Psalm 71:9', theme: 'Do not cast me off in old age — a prayer God honors. You belong here, and your questions are welcome.' },
      },
      {
        id: 'safe-and-yours',
        title: 'Safe — and yours',
        bigIdea: 'What is yours stays yours: PoeTech never sells your information. And we will show you how to spot a scam, so no one can trick or rush you.',
        inApp: 'Practice spotting one fake message, and see for yourself that your data stays private.',
        anchor: { ref: 'Proverbs 16:31', theme: 'Gray hair is a crown of glory — age is honored here, not pushed aside or taken advantage of.' },
      },
    ],
  },
  {
    id: 'everyday',
    label: 'Set It Up Once',
    forWhom: 'The ones everyone calls — parents in the middle, holding up both ends (about 35-45)',
    promise: 'Stop being the family help desk. Set the people you love up to stand on their own — once — so you get your evenings back, without lowering the bar for anyone.',
    sessions: [
      {
        id: 'why-its-always-you',
        title: 'Why it is always you',
        bigIdea: 'You are the bridge because no one set the system up to last. The fix is not more patience — it is setting it up one time so it holds without you on call.',
        inApp: 'List the two people who call you most. Those are who you will set up next — for good.',
        anchor: { ref: 'Exodus 18:17-23', theme: 'Jethro told Moses: you cannot carry it all yourself, or you will wear out. Share the load — set others up to stand.' },
      },
      {
        id: 'set-up-an-elder',
        title: 'Set up an elder in 15 minutes',
        bigIdea: 'A repeatable checklist you run one time with a parent or grandparent: bigger text, voice input, the help button. Then they are independent — and you are not on call at dinner.',
        inApp: 'Walk one elder through the At Your Pace lane and mark them set up. Watch them do the next step alone.',
        anchor: { ref: 'Galatians 6:2', theme: 'Carry one another’s burdens — but the goal is to lift, not to be leaned on forever.' },
      },
      {
        id: 'hand-the-kids-the-wheel',
        title: 'Hand the kids the wheel — safely',
        bigIdea: 'Your job is not to teach every click; it is to point them at their own class and supervise. They learn to VERIFY, not just consume. You raise builders, not dependents.',
        inApp: 'Point one young person to the youth lane. Check in once — do not hover.',
        anchor: { ref: 'Galatians 6:9', theme: 'Do not grow weary in doing good — set it up to last, so you can keep going and not burn out.' },
      },
    ],
  },
  {
    id: 'youth',
    label: 'Learning A.I. The Way',
    forWhom: 'Kids and teens — a taste today; the full 8-week class goes deeper',
    promise: 'Master the tool. Don’t let it master you. Today is the taste; the full cohort is where you build something real.',
    sessions: [
      {
        id: 'what-is-ai',
        title: 'What A.I. really is',
        bigIdea: 'An LLM is a very well-read helper that guesses the next word. It can sound completely sure and still be wrong. It is a tool — not a source of truth.',
        inApp: 'Send your first prompt in the Council Chamber. Notice one thing it does well, and catch one thing it gets wrong.',
        anchor: { ref: '1 Thessalonians 5:21', theme: 'Test everything; hold on to what is good. That is the whole class in one verse.' },
      },
      {
        id: 'the-test',
        title: 'The Test — judge what it tells you',
        bigIdea: 'Never trust an answer just because it sounds smart. Run it through the filter and verify it. A.I. that looks right and is wrong is the real danger.',
        inApp: 'Use the in-app Test tool on three answers. Find the one that is wrong on purpose, and verify a real fact before you believe it.',
        anchor: { ref: 'Philippians 4:8', theme: 'The filter for what is worth keeping in your mind: true, honorable, just, pure, lovely.' },
      },
      {
        id: 'ai-that-serves',
        title: 'A.I. that serves people',
        bigIdea: 'The best use of this tool is to help someone else. Use the app to serve the church — and to help an elder use their phone today.',
        inApp: 'Help one person — a grandparent, an elder, a friend — do one real thing with the app right now.',
        anchor: { ref: 'Mark 10:43-45', theme: 'Whoever wants to be great must serve. Greatness here is measured in who you lift.' },
      },
    ],
  },
];

// Namespaced progress key so the three lanes never collide in data.classProgress.
export function sessionKey(laneId, sessionId) {
  return `conf:${laneId}:${sessionId}`;
}

export function getLane(laneId) {
  return LANES.find((l) => l.id === laneId) || null;
}

// A learner's REAL progress in one lane: how many of that lane's sessions they
// have personally checked off (counted from their own record, not painted).
export function laneProgress(lane, progress = {}) {
  if (!lane) return { done: 0, total: 0, pct: 0 };
  const total = lane.sessions.length;
  const done = lane.sessions.filter((s) => !!progress[sessionKey(lane.id, s.id)]).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

// Progress across ALL lanes (for the "everyone, together" headline). Reuses the
// same real record — no double counting, since keys are lane-namespaced.
export function overallProgress(progress = {}) {
  let done = 0;
  let total = 0;
  for (const lane of LANES) {
    const p = laneProgress(lane, progress);
    done += p.done;
    total += p.total;
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

// The conference date, validated. Returns null for a blank/bad date so the UI
// says "date to be set" instead of lying. When valid, the weekday is the TRUE
// weekday of that date (a non-typical day shows the truth, never a painted one).
export function conferenceDate(startISO) {
  const ms = toMs(startISO);
  if (ms == null) return null;
  const d = new Date(ms);
  return { date: d, weekday: weekday(d) };
}
