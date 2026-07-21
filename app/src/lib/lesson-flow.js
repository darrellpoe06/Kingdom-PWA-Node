// =============================================================================
// lesson-flow — THE shared lesson-flow standard for ALL Learn content
// =============================================================================
// Darrell 2026-06-24: every lesson — "The Perfect You Were Made For," Learning
// A.I. The Way, The Broadcast, The Infrastructure, Living Lessons, the music /
// sound-engineer track, and every course that comes after — should run on ONE
// consistent, well-paced arc, BETTER for the person FACILITATING and BETTER for
// the AUDIENCE. Today a lesson renders as one dense stack (deep guide + "what this
// presents to" + a pipe-delimited run-of-show, all piled together). This module is
// the STANDARD that fixes that, once, for everything.
//
// It is a PURE, derived primitive — NOT a per-lesson fork. It reads the fields a
// module already carries (the schema in learn-framework.js + church-classes.js:
// bigIdea / anchor / lesson / levels / media / hardware / rpe / inApp / launch /
// quiz / benefits / facilitator{talkingPoints,howToRun,discussionPrompts}) and
// derives a consistent FIVE-STAGE ARC from them:
//
//   OPEN  → TEACH → ENGAGE → APPLY → SEND-OFF
//   (hook)  (core)  (discuss) (practice) (carry it out)
//
// Every stage is titled, TIMED, and visually distinct — so the audience always
// knows where they are and what's next (ANXIETY-CLARITY: what / when / why / how),
// and the facilitator gets a smooth run-of-show with what-to-say, what-to-do, and
// a transition cue per stage. Because the arc is DERIVED, applying the standard to
// a new course is free: it composes with the depth tiers + age/cognitive levels
// (learn-framework resolveForAge / lessonPlanForAge) and the solo/teacher modes
// already in place — nothing is re-authored.
//
// NO-LEAK (the same contract the presenter teach-mode holds, lib/teach-present.js):
// each segment splits a learner-safe `audience` object from a leader-only
// `facilitator` object. The audience side NEVER carries talking points, how-to-run
// text, or any `say`/`do` notes — a clean projection can't leak the teacher's
// notes. enforced by a test (lesson-flow.test.js).
//
// TIME-ADAPTIVE REFLOW (the run-of-show reflow, reused in spirit from the worship
// presenter, #309): given a target total length, the stage minutes reflow
// proportionally and always sum EXACTLY to the target — so a 75-minute class plan
// and a 30-minute family reading of the SAME lesson both stay coherent. Pure +
// deterministic (no Date / Math.random), so it is safe in tests and workflows.
//
// VERIFICATION (DR-0076): nothing here fabricates content. A stage with no authored
// source is marked `hasContent:false` and dropped from the audience flow rather
// than shown empty; every word of the authored lesson survives (the chunking lives
// in learn-framework). Claims are derived from real fields, not painted.
// =============================================================================
import { lessonPlanForAge, DEFAULT_AGE_BAND } from './learn-framework.js';

// ---------------------------------------------------------------------------
// The canonical arc — ONE shape every lesson follows. `weight` is the default
// share of the session a stage gets; the weights are taken from the real 75-minute
// SESSION_FLOW the courses already use (prayer+anchor+recap ~15 / teach ~15 /
// discussion ~15 / hands-on ~25 / send-off ~5), normalized to sum to 1.0. They are
// starting defaults — the facilitator can reflow the total at any time.
// ---------------------------------------------------------------------------
export const LESSON_ARC = [
  { kind: 'open',   title: 'Open',     subtitle: 'Hook + anchor',  icon: '🎯', weight: 0.20,
    blurb: 'Pray, read the anchor, and set up the one big idea.' },
  { kind: 'teach',  title: 'Teach',    subtitle: 'The core',       icon: '📖', weight: 0.20,
    blurb: 'Teach the heart of the lesson, paced to who is learning.' },
  { kind: 'engage', title: 'Engage',   subtitle: 'Discuss',        icon: '💬', weight: 0.20,
    blurb: 'Talk it through together — everyone speaks.' },
  { kind: 'apply',  title: 'Apply',    subtitle: 'Practice',       icon: '🔧', weight: 0.33,
    blurb: 'Do it for real, in the app, and check understanding.' },
  { kind: 'send',   title: 'Send-off', subtitle: 'Carry it out',   icon: '🚀', weight: 0.07,
    blurb: 'Name what it frees, and carry one thing into real life.' },
];

export const ARC_KINDS = LESSON_ARC.map((s) => s.kind);

// Sane default when a course carries no session flow (e.g. a self-paced reading).
export const DEFAULT_SESSION_MINUTES = 60;

// Sum a course's authored SESSION_FLOW ([{minutes,name}]) to a target total. Falls
// back to the default when the flow is missing/empty (never returns 0 unless asked).
export function sessionMinutesFromFlow(sessionFlow) {
  if (!Array.isArray(sessionFlow) || sessionFlow.length === 0) return DEFAULT_SESSION_MINUTES;
  const sum = sessionFlow.reduce((t, s) => t + (Number(s && s.minutes) || 0), 0);
  return sum > 0 ? sum : DEFAULT_SESSION_MINUTES;
}

// Time-adaptive reflow (#309): distribute `targetMinutes` across the arc by weight,
// handing out the leftover whole minutes to the largest fractional parts so the
// pieces ALWAYS sum exactly to the target. Pure + deterministic. Returns an array
// of integer minutes, one per arc stage.
export function reflowArcMinutes(targetMinutes, arc = LESSON_ARC) {
  const target = Math.max(0, Math.round(Number(targetMinutes) || 0));
  const raw = arc.map((s) => target * (Number(s.weight) || 0));
  const floored = raw.map((v) => Math.floor(v));
  let remainder = target - floored.reduce((t, v) => t + v, 0);
  const byFrac = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const mins = floored.slice();
  for (let k = 0; k < byFrac.length && remainder > 0; k += 1) { mins[byFrac[k].i] += 1; remainder -= 1; }
  return mins;
}

// ---------------------------------------------------------------------------
// Parse an authored run-of-show string into phases. The courses author
// `facilitator.howToRun` as a pipe-delimited string with a "(minutes)" hint:
//   "Prayer + the anchor (5): open in prayer... | Teach the big idea (15): ..."
// -> [{ label:'Prayer + the anchor', minutes:5, text:'open in prayer...' }, ...]
// Tolerant: a chunk without "(N)" keeps minutes null; a chunk without a label keeps
// the whole text. Never throws.
// ---------------------------------------------------------------------------
export function parseHowToRun(howToRun) {
  if (typeof howToRun !== 'string' || !howToRun.trim()) return [];
  return howToRun
    .split('|')
    .map((chunk) => {
      const c = chunk.trim();
      if (!c) return null;
      const withMin = c.match(/^(.*?)\s*\((\d+)\)\s*:\s*([\s\S]*)$/);
      if (withMin) return { label: withMin[1].trim(), minutes: Number(withMin[2]), text: withMin[3].trim() };
      const noMin = c.match(/^([^:]{1,60}?):\s*([\s\S]*)$/);
      if (noMin) return { label: noMin[1].trim(), minutes: null, text: noMin[2].trim() };
      return { label: '', minutes: null, text: c };
    })
    .filter(Boolean);
}

// Map an authored phase label to an arc stage by keyword. Returns null when no
// stage matches (the caller routes unmatched phases to TEACH so authored text is
// never dropped).
export function phaseKind(label) {
  // Leading word boundary only (no trailing \b), so inflections match too:
  // "discussion" → discuss, "questions" → question, "reflecting" → reflect.
  const l = String(label || '').toLowerCase();
  if (/\b(pray|anchor|recap|open|welcome|gather|warm[- ]?up)/.test(l)) return 'open';
  if (/\b(teach|big idea|deeper|go deep|explain|core|lesson|concept|perfect)/.test(l)) return 'teach';
  if (/\b(discuss|reflect|share|talk|conversation|question)/.test(l)) return 'engage';
  if (/\b(hands|in the app|in app|practice|build|do it|activity|lab|exercise|try)/.test(l)) return 'apply';
  if (/\b(send|take it|solo|close|commission|wrap|blessing|go out)/.test(l)) return 'send';
  return null;
}

// ---------------------------------------------------------------------------
// buildLessonArc — the heart of the standard. Derive the five-stage arc for ONE
// module at one depth/age, with a target length. Returns:
//   {
//     moduleId, title, totalMinutes, band,
//     segments:          [ all 5 stages, each timed, with audience + facilitator ],
//     audienceSegments:  [ only the stages that have learner content ],
//   }
// Each segment:
//   { kind, title, subtitle, icon, blurb, minutes, hasContent, cue,
//     audience:    { ...learner-safe content only... },
//     facilitator: { say:[...], do:[...], watchFor? } }
// ---------------------------------------------------------------------------
// Spoken pace for estimating how long the authored teaching runs read aloud.
// ~140 words/minute is an unhurried teaching cadence (the DR-0215 measure).
export const SPOKEN_WPM = 140;

// ---------------------------------------------------------------------------
// planSessions — the course-split (DR-0215 §2): when a lesson's spoken teaching
// runs longer than one facilitated slot, it FLOWS across more than one session.
// This is content-preserving by construction: the teaching prose is grouped at
// SENTENCE boundaries into N even sessions — every word is MOVED, never cut
// (Darrell 2026-07-21: "adjust the curriculum to the allotted time... don't lose
// content"). A lesson that fits the slot returns a single session, unchanged.
//
// Pure + deterministic (no Date/Math.random) — the same sentence splitter the
// age chunker uses. Returns { slotMinutes, wpm, totalSpokenWords, estMinutes,
// sessionCount, multiSession, sessions:[{ index, label, text, words, estMinutes }] }.
// Invariant (tested): sessions.map(s => s.text).join(' ') reproduces the teaching
// prose — nothing dropped, nothing reordered.
// ---------------------------------------------------------------------------
const wordsIn = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

export function planSessions(module, opts = {}) {
  const m = module || {};
  const {
    slotMinutes = 25,
    wpm = SPOKEN_WPM,
    // Reserve, in minutes, held back from the slot for open/engage/apply/send
    // framing. Default 0 so the split threshold matches DR-0215's own measure —
    // a lesson splits when its SPOKEN teaching exceeds the slot, not before.
    framingMinutes = 0,
    ageBand = DEFAULT_AGE_BAND,
    levelOverride = null,
  } = opts;

  // The authored teaching prose (adult band = the whole lesson as one string).
  const plan = lessonPlanForAge(m, ageBand, levelOverride);
  const teachText = ((plan && plan.segments) || []).join(' ').trim();
  const teachWords = wordsIn(teachText);
  const storyWords = (Array.isArray(m.stories) ? m.stories : []).reduce((t, s) => t + wordsIn(s.body), 0);
  const talk = (m.facilitator && Array.isArray(m.facilitator.talkingPoints)) ? m.facilitator.talkingPoints : [];
  const talkWords = talk.reduce((t, p) => t + wordsIn(p), 0);

  const totalSpokenWords = teachWords + storyWords + talkWords;
  const estMinutes = wpm > 0 ? +(totalSpokenWords / wpm).toFixed(1) : 0;

  // Per-session teaching budget (the slot minus its framing), in words.
  const teachBudgetMin = Math.max(1, (Number(slotMinutes) || 0) - (Number(framingMinutes) || 0));
  const capWords = Math.max(1, Math.round(teachBudgetMin * wpm));
  const sessionCount = Math.max(1, Math.ceil(totalSpokenWords / capWords));

  const single = (label) => [{
    index: 1, label, text: teachText, words: teachWords, estMinutes: wpm > 0 ? +(teachWords / wpm).toFixed(1) : 0,
  }];

  let sessions;
  if (sessionCount <= 1 || !teachText) {
    sessions = single('Full session');
  } else {
    // Even split of the PROSE across sessions, breaking only at sentence ends.
    const sentences = teachText.match(/[^.!?]+[.!?]*\s*/g) || [teachText];
    const targetPerSession = Math.ceil(teachWords / sessionCount);
    sessions = [];
    let buf = '';
    let words = 0;
    for (const s of sentences) {
      buf += s;
      words += wordsIn(s);
      // Close a session at a sentence boundary once it reaches its even share,
      // but never open more sessions than planned (the last one takes the rest).
      if (words >= targetPerSession && sessions.length < sessionCount - 1) {
        sessions.push({ text: buf.trim(), words });
        buf = '';
        words = 0;
      }
    }
    if (buf.trim()) sessions.push({ text: buf.trim(), words });
    const n = sessions.length;
    sessions = sessions.map((s, i) => ({
      index: i + 1,
      label: `Session ${i + 1} of ${n}`,
      text: s.text,
      words: s.words,
      estMinutes: wpm > 0 ? +(s.words / wpm).toFixed(1) : 0,
    }));
  }

  return {
    slotMinutes: Number(slotMinutes) || 0,
    wpm,
    totalSpokenWords,
    estMinutes,
    sessionCount: sessions.length,
    multiSession: sessions.length > 1,
    sessions,
  };
}

export function buildLessonArc(module, opts = {}) {
  const m = module || {};
  const {
    ageBand = DEFAULT_AGE_BAND,
    levelOverride = null,
    targetMinutes = null,
    sessionFlow = null,
    handsOnLabel = 'In the app',
  } = opts;

  const total = targetMinutes != null
    ? Math.max(0, Math.round(Number(targetMinutes) || 0))
    : sessionMinutesFromFlow(sessionFlow);
  const mins = reflowArcMinutes(total);

  // The authored lesson, paced to age/depth (chunked, never summarized).
  const lessonPlan = lessonPlanForAge(m, ageBand, levelOverride);

  const fac = (m && m.facilitator) || {};
  const phases = parseHowToRun(fac.howToRun);
  const byKind = { open: [], teach: [], engage: [], apply: [], send: [] };
  for (const p of phases) {
    const k = phaseKind(p.label) || 'teach'; // unmatched authored text → teach (never dropped)
    byKind[k].push(p);
  }
  const facDo = (kind) => byKind[kind].map((p) => p.text).filter(Boolean);

  const anchor = (m && m.anchor) || {};
  const talking = Array.isArray(fac.talkingPoints) ? fac.talkingPoints : [];
  const prompts = Array.isArray(fac.discussionPrompts) ? fac.discussionPrompts : [];
  const benefits = Array.isArray(m.benefits) ? m.benefits : [];
  // Parable/story beats — short, vivid, often-funny illustrations the teacher drops
  // mid-teach to land the point, the way Jesus taught (Matthew 13:34). Learner-safe
  // (title/body/verse only — no facilitator keys), so they flow to the audience side
  // of the TEACH stage. Darrell 2026-07-21: "make it funny and fun... short stories
  // like Jesus did parables... at least 2 to each 25-minute lesson."
  const stories = Array.isArray(m.stories) ? m.stories : [];
  const hasMedia = Array.isArray(m.media) && m.media.length > 0;
  const hasHardware = Array.isArray(m.hardware) && m.hardware.length > 0;
  const hasRpe = !!(m.rpe && (m.rpe.research || m.rpe.plan || m.rpe.execute));
  const hasQuiz = !!(m.quiz && Array.isArray(m.quiz.questions) && m.quiz.questions.length > 0);
  const lessonSegs = (lessonPlan && lessonPlan.segments) || [];

  // Per-stage content. `audience` is learner-safe ONLY; `facilitator` is leader-only.
  const body = {
    open: {
      audience: {
        bigIdea: m.bigIdea || '',
        anchorRef: anchor.ref || null,
        anchorTheme: anchor.theme || null,
      },
      facilitator: {
        say: [anchor.ref ? `Open in prayer, then read ${anchor.ref} aloud — ${anchor.theme || 'the anchor for today'}.` : 'Open in prayer and welcome everyone.'],
        do: facDo('open'),
      },
      hasContent: !!(m.bigIdea || anchor.ref),
    },
    teach: {
      audience: { lessonPlan, stories, hasMedia, hasHardware, hasRpe },
      facilitator: { say: talking, do: facDo('teach') },
      hasContent: lessonSegs.length > 0 || stories.length > 0 || talking.length > 0 || hasMedia || hasHardware,
    },
    engage: {
      audience: { prompts },
      facilitator: {
        say: prompts.length ? ['Go around — let everyone answer; there are no wrong answers.'] : [],
        do: facDo('engage'),
        prompts,
      },
      hasContent: prompts.length > 0 || facDo('engage').length > 0,
    },
    apply: {
      audience: {
        handsOnLabel,
        inApp: m.inApp || '',
        launch: m.launch || null,
        hasQuiz,
      },
      facilitator: {
        say: [],
        do: facDo('apply'),
        watchFor: 'Move around the room; help anyone who is stuck, and confirm every learner reaches a real result before moving on.',
      },
      hasContent: !!(m.inApp || hasQuiz || facDo('apply').length),
    },
    send: {
      // Audience side carries only the genuine learner field (benefits). The
      // "solo task" choreography lives in facilitator.do (it is howToRun-derived).
      audience: { benefits },
      facilitator: { say: [], do: facDo('send') },
      hasContent: benefits.length > 0 || facDo('send').length > 0,
    },
  };

  const segments = LESSON_ARC.map((stage, i) => ({
    kind: stage.kind,
    title: stage.title,
    subtitle: stage.subtitle,
    icon: stage.icon,
    blurb: stage.blurb,
    minutes: mins[i],
    hasContent: body[stage.kind].hasContent,
    audience: body[stage.kind].audience,
    facilitator: body[stage.kind].facilitator,
    cue: i < LESSON_ARC.length - 1
      ? `Then: ${LESSON_ARC[i + 1].title} — ${LESSON_ARC[i + 1].subtitle}.`
      : 'Close in prayer or a blessing, and send them out.',
  }));

  // The course-split (DR-0215 §2): if this lesson's spoken teaching runs longer
  // than the slot, it flows across more than one session — content-preserving.
  const sessionPlan = planSessions(m, {
    slotMinutes: total,
    ageBand,
    levelOverride,
  });

  return {
    moduleId: m.id || null,
    title: m.title || '',
    totalMinutes: total,
    band: lessonPlan && lessonPlan.band,
    segments,
    audienceSegments: segments.filter((s) => s.hasContent),
    sessionPlan,
  };
}
