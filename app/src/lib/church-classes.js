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

export const CLASS_META = {
  title: 'Learning A.I. The Way',
  audience: 'COLG youth — and anyone who wants to learn',
  tagline: 'Master the tool. Don’t let it master you.',
  format: '8 weekly sessions · ~75 min each · a blend of live time with Darrell and self-paced practice right here in the app',
  cadenceDays: 7,
  weeks: 8,
};

// Each module: the big idea in kid-plain language, what you actually DO in the app
// that week, and a Scripture anchor (reference + theme gloss, not a quoted verse).
export const MODULES = [
  {
    id: 'wk1-what-is-ai',
    title: 'What is A.I., really?',
    bigIdea: 'An LLM is a very well-read helper that guesses the next word. It can sound completely sure and still be wrong. It is a tool — not a source of truth.',
    inApp: 'Send your very first prompt in the app’s Council Chamber. Notice what it does well, and catch one thing it gets wrong.',
    anchor: { ref: '1 Thessalonians 5:21', theme: 'Test everything; hold on to what is good. That is the whole class in one verse.' },
  },
  {
    id: 'wk2-good-questions',
    title: 'Asking good questions',
    bigIdea: 'A clear question gets clear help. The four keys: what, when, why, how. Garbage in, garbage out — but a good question is a kind of skill.',
    inApp: 'Take one vague prompt and one clear prompt for the same thing. Compare the answers side by side. Feel the difference a good question makes.',
    anchor: { ref: 'Proverbs 18:13', theme: 'Answering before you listen is folly — and so is asking before you think.' },
  },
  {
    id: 'wk3-the-test',
    title: 'The Test — judging what A.I. tells you',
    bigIdea: 'The most important week. Never trust an answer just because it sounds smart. Run it through the filter and VERIFY it. AI that looks right and is wrong is the real danger.',
    inApp: 'Use the in-app Test tool on three A.I. answers. Find the one that is wrong on purpose. Verify a real fact before you believe it.',
    anchor: { ref: 'Philippians 4:8', theme: 'The filter for what is worth keeping in your mind: true, honorable, just, pure, lovely.' },
  },
  {
    id: 'wk4-ai-for-school',
    title: 'A.I. for school — honestly',
    bigIdea: 'Use it to LEARN, not to cheat. It is your tutor, not your ghostwriter. The goal is a stronger you, not a shortcut that leaves you weaker.',
    inApp: 'Turn one hard school topic into your own study guide — in your own words, checked by you.',
    anchor: { ref: 'Daniel 1; Colossians 3:23', theme: 'Daniel mastered Babylon’s learning without losing who he was. Whatever you do, work at it with all your heart.' },
  },
  {
    id: 'wk5-ai-that-serves',
    title: 'A.I. that serves people',
    bigIdea: 'The best use of this tool is to help someone else. Use the app to serve the church — prayer requests, trivia, helping an elder use their phone.',
    inApp: 'Help one person — a grandparent, an elder, a friend — do one real thing with the app this week.',
    anchor: { ref: 'Mark 10:43–45; Galatians 5:13', theme: 'Whoever wants to be great must serve. Use your freedom to serve one another in love.' },
  },
  {
    id: 'wk6-build-something',
    title: 'Build something useful',
    bigIdea: 'You are a builder, not just a user. Make one small useful thing — a scripture-memory helper, a study buddy, a chore tracker.',
    inApp: 'Design and build your project in the app. Get it working. Make it real.',
    anchor: { ref: 'Proverbs 22:29', theme: 'Do you see someone skilled in their work? They will stand before kings.' },
  },
  {
    id: 'wk7-your-data',
    title: 'Your data, your kingdom — safety & privacy',
    bigIdea: 'Your information is YOURS. PoeTech protects it and never sells it. Learn what to share and what to guard — and how to spot a fake or a scam.',
    inApp: 'See for yourself how your data stays sovereign in the app, and practice spotting one A.I.-made fake.',
    anchor: { ref: 'Proverbs 4:23', theme: 'Guard your heart, for everything you do flows from it — and in this age, guard your information too.' },
  },
  {
    id: 'wk8-showcase',
    title: 'Showcase & what’s next',
    bigIdea: 'Present what you built to your family and church. Celebrate. Then: the best students help teach the next group. Kings raise kings.',
    inApp: 'Share your project. Choose your next step — keep building, or come back to help teach the next cohort.',
    anchor: { ref: '2 Timothy 2:2', theme: 'What you have learned, entrust to faithful people who will teach others also.' },
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

// Build the full schedule: one row per module with its real computed date.
export function buildSchedule(startISO) {
  return MODULES.map((m, i) => {
    const date = weekToDate(startISO, i);
    return { ...m, week: i + 1, date, weekday: weekday(date) };
  });
}

// A student's real progress: how many modules they've personally completed.
export function progressSummary(progress = {}) {
  const done = MODULES.filter((m) => !!progress[m.id]).length;
  return { done, total: MODULES.length, pct: MODULES.length ? Math.round((done / MODULES.length) * 100) : 0 };
}
