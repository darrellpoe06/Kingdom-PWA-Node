// @vitest-environment node
//
// lesson-flow — THE shared lesson-flow standard (Darrell 2026-06-24): one consistent,
// well-paced FIVE-STAGE arc (Open → Teach → Engage → Apply → Send-off) derived from a
// module's authored fields, better for BOTH the facilitator and the audience. These
// tests are adversarial / proven-to-catch (DR-0076): they try to make the standard
// (a) leak facilitator notes onto the audience side, (b) lose authored run-of-show
// text, (c) reflow to a wrong total, or (d) throw on a bare module — and FAIL if it does.
import { describe, it, expect } from 'vitest';
import {
  LESSON_ARC, ARC_KINDS, DEFAULT_SESSION_MINUTES,
  sessionMinutesFromFlow, reflowArcMinutes, parseHowToRun, phaseKind, buildLessonArc,
  planSessions, SPOKEN_WPM,
} from '../lib/lesson-flow.js';
import { MODULES, SESSION_FLOW } from '../lib/church-classes.js';
import { chunkLessonForAge } from '../lib/learn-framework.js';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const FORBIDDEN_AUDIENCE_KEYS = ['say', 'do', 'talkingPoints', 'howToRun', 'watchFor'];
// Deep-scan an object for any forbidden key (the no-leak guard).
function findForbiddenKey(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of Object.keys(obj)) {
    if (FORBIDDEN_AUDIENCE_KEYS.includes(k)) return k;
    const hit = findForbiddenKey(obj[k]);
    if (hit) return hit;
  }
  return null;
}

describe('the canonical arc', () => {
  it('is exactly Open → Teach → Engage → Apply → Send-off, weights summing to 1', () => {
    expect(ARC_KINDS).toEqual(['open', 'teach', 'engage', 'apply', 'send']);
    const sum = LESSON_ARC.reduce((t, s) => t + s.weight, 0);
    expect(sum).toBeCloseTo(1, 5);
    for (const s of LESSON_ARC) {
      expect(s.title).toBeTruthy();
      expect(s.subtitle).toBeTruthy();
      expect(s.icon).toBeTruthy();
      expect(s.weight).toBeGreaterThan(0);
    }
  });
});

describe('session minutes + time-adaptive reflow (#309)', () => {
  it('sums a real SESSION_FLOW and defends junk', () => {
    expect(sessionMinutesFromFlow(SESSION_FLOW)).toBe(75);
    expect(sessionMinutesFromFlow(null)).toBe(DEFAULT_SESSION_MINUTES);
    expect(sessionMinutesFromFlow([])).toBe(DEFAULT_SESSION_MINUTES);
  });
  it('reflows to ANY total and ALWAYS sums exactly to the target', () => {
    for (const target of [0, 1, 17, 20, 30, 35, 45, 60, 75, 90, 123, 240]) {
      const mins = reflowArcMinutes(target);
      expect(mins.length).toBe(5);
      expect(mins.reduce((t, v) => t + v, 0)).toBe(target); // exact, no rounding drift
      for (const v of mins) expect(Number.isInteger(v)).toBe(true);
      for (const v of mins) expect(v).toBeGreaterThanOrEqual(0);
    }
  });
  it('apply (hands-on) gets the largest share at a real class length', () => {
    const mins = reflowArcMinutes(75);
    const applyIdx = ARC_KINDS.indexOf('apply');
    expect(mins[applyIdx]).toBe(Math.max(...mins));
  });
});

describe('parseHowToRun + phaseKind', () => {
  it('parses a "(minutes):" pipe-delimited run-of-show', () => {
    const phases = parseHowToRun('Prayer + the anchor (5): open in prayer. | Teach the big idea (15): explain it. | Hands-on in the app (25): everyone tries it.');
    expect(phases.length).toBe(3);
    expect(phases[0]).toEqual({ label: 'Prayer + the anchor', minutes: 5, text: 'open in prayer.' });
    expect(phases[2].minutes).toBe(25);
    expect(parseHowToRun('')).toEqual([]);
    expect(parseHowToRun(null)).toEqual([]);
  });
  it('maps phase labels to the right arc stage', () => {
    expect(phaseKind('Prayer + the anchor')).toBe('open');
    expect(phaseKind('Recap last week')).toBe('open');
    expect(phaseKind('Teach the big idea')).toBe('teach');
    expect(phaseKind('Discussion')).toBe('engage');
    expect(phaseKind('Hands-on in the app')).toBe('apply');
    expect(phaseKind('Send-off + solo task')).toBe('send');
    expect(phaseKind('nonsense xyz')).toBe(null);
  });
});

describe('buildLessonArc — derives a consistent arc from real authored content', () => {
  const perfect = LIVING_LESSONS_MODULES[0]; // "The Perfect You Were Made For"
  const wk1 = MODULES[0];                     // "What is A.I., really?"

  it('returns all 5 stages, timed, summing to the target, for a real lesson', () => {
    const arc = buildLessonArc(perfect, { targetMinutes: 35 });
    expect(arc.segments.length).toBe(5);
    expect(arc.segments.map((s) => s.kind)).toEqual(['open', 'teach', 'engage', 'apply', 'send']);
    expect(arc.totalMinutes).toBe(35);
    expect(arc.segments.reduce((t, s) => t + s.minutes, 0)).toBe(35);
    for (const s of arc.segments) {
      expect(s.title && s.icon && s.cue).toBeTruthy();
      expect(s.audience && s.facilitator).toBeTruthy();
    }
    expect(arc.audienceSegments.length).toBeGreaterThan(0);
  });

  it('NO-LEAK: no audience segment carries facilitator notes (say/do/talkingPoints/howToRun)', () => {
    for (const mod of [perfect, wk1]) {
      const arc = buildLessonArc(mod, { sessionFlow: SESSION_FLOW });
      for (const seg of arc.segments) {
        const leak = findForbiddenKey(seg.audience);
        expect(leak, `audience leaked "${leak}" on ${seg.kind}`).toBe(null);
      }
      // ...and the facilitator side DOES carry them (so they weren't just dropped)
      const teach = arc.segments.find((s) => s.kind === 'teach');
      expect(Array.isArray(teach.facilitator.say)).toBe(true);
    }
  });

  it('routes authored run-of-show text into the matching stage (text never lost)', () => {
    const arc = buildLessonArc(wk1, { sessionFlow: SESSION_FLOW });
    const open = arc.segments.find((s) => s.kind === 'open');
    const apply = arc.segments.find((s) => s.kind === 'apply');
    const send = arc.segments.find((s) => s.kind === 'send');
    // wk1.howToRun has "Prayer + the anchor", "Hands-on in the app", "Send-off + solo task"
    expect(open.facilitator.do.join(' ')).toMatch(/prayer/i);
    expect(apply.facilitator.do.join(' ')).toMatch(/prompt|app/i);
    expect(send.facilitator.do.join(' ')).toMatch(/solo|week/i);
    // talking points land on teach.facilitator.say
    const teach = arc.segments.find((s) => s.kind === 'teach');
    expect(teach.facilitator.say.length).toBe(wk1.facilitator.talkingPoints.length);
  });

  it('composes with depth/age: a child chunks the SAME text into more (shorter) sections than an adult', () => {
    // Both bands now chunk into readable sections (adult is no longer one wall —
    // Darrell 2026-07-28); developmental pacing means, for the SAME text, a child
    // gets shorter chunks (more segments) than an adult. Comparing per-band arcs
    // directly would compare DIFFERENT rewrites of different lengths, so the
    // invariant is proven on one text via the chunker.
    const childArc = buildLessonArc(perfect, { ageBand: 'child', targetMinutes: 60 });
    const adultArc = buildLessonArc(perfect, { ageBand: 'adult', targetMinutes: 60 });
    expect(childArc.segments.find((s) => s.kind === 'teach').audience.lessonPlan.band.id).toBe('child');
    expect(adultArc.segments.find((s) => s.kind === 'teach').audience.lessonPlan.band.id).toBe('adult');
    expect(chunkLessonForAge(perfect.lesson, 'child').length)
      .toBeGreaterThan(chunkLessonForAge(perfect.lesson, 'adult').length);
  });

  it('a target override changes the total; default uses the session flow', () => {
    expect(buildLessonArc(perfect, { targetMinutes: 90 }).totalMinutes).toBe(90);
    expect(buildLessonArc(wk1, { sessionFlow: SESSION_FLOW }).totalMinutes).toBe(75);
    expect(buildLessonArc(wk1, {}).totalMinutes).toBe(DEFAULT_SESSION_MINUTES);
  });

  it('never throws and never fabricates on a bare/empty module', () => {
    expect(() => buildLessonArc(null)).not.toThrow();
    const empty = buildLessonArc(null);
    expect(empty.segments.length).toBe(5);
    expect(empty.audienceSegments.length).toBe(0); // nothing authored → nothing shown
    const lean = buildLessonArc({ id: 'x', title: 'Lean', bigIdea: 'just a hook', inApp: 'do one thing' });
    const kinds = lean.audienceSegments.map((s) => s.kind);
    expect(kinds).toContain('open');  // has bigIdea
    expect(kinds).toContain('apply'); // has inApp
    expect(kinds).not.toContain('engage'); // no prompts authored → hidden, not empty
  });
});

describe('Living Lessons L43 — "The War Is for the Mind" (Darrell 2026-07-19), diversified for all ages', () => {
  const war = LIVING_LESSONS_MODULES.find((m) => m.id === 'll43-the-war-is-for-the-mind');

  it('exists and is authored for EVERY age — child, teen, senior — plus the deep lesson', () => {
    // "diversified for everyone at all ages" (Darrell). PROVEN-TO-CATCH: drop any age
    // level and this fails — the lesson must reach the child AND the seasoned believer.
    expect(war, 'L43 must be present in the series').toBeTruthy();
    for (const age of ['child', 'teen', 'senior']) {
      expect((war.levels[age] || '').length, `L43 level '${age}' must be authored`).toBeGreaterThan(200);
    }
    expect(war.lesson.length).toBeGreaterThan(800); // the deep 4D teaching
    expect(war.benefits.length).toBeGreaterThanOrEqual(4);
  });

  it('renders through the shared five-stage arc without leaking facilitator notes', () => {
    const arc = buildLessonArc(war, {});
    expect(arc.segments.map((s) => s.kind)).toEqual(['open', 'teach', 'engage', 'apply', 'send']);
    expect(arc.audienceSegments.length).toBeGreaterThan(0);
  });

  it('quiz answers are all valid indices into their options', () => {
    for (const q of war.quiz.questions) {
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
  });

  it('stays well-being-positive (a SOUND mind, not fear) and Word-first (the defeated, LIMITED enemy)', () => {
    // The bright line the series holds: sober AND confident, never fearful/paranoid.
    const hay = (war.bigIdea + ' ' + war.lesson + ' ' + war.levels.senior).toLowerCase();
    expect(hay).toMatch(/sound mind/);        // 2 Tim 1:7 — the anti-paranoia anchor
    expect(hay).toMatch(/may devour/);        // 1 Pet 5:8 — "may," not will (limited enemy)
    expect(hay).toMatch(/king of kings/);     // Rev 19:16 — fight from settled victory
  });

  it('META lesson count matches the module count (guards the "Living lessons break")', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
});

describe('parable/story beats — reach the audience, never leak facilitator notes (Darrell 2026-07-21)', () => {
  it('surfaces module.stories on the TEACH stage audience side, learner-safe', () => {
    const mod = {
      id: 'x', title: 'X', bigIdea: 'idea', anchor: { ref: 'John 1:1', theme: 't' },
      stories: [{ tone: 'light', title: 'The Tenant', body: 'A funny parable.', verse: '"..." (2 Corinthians 10:5)' }],
      facilitator: { talkingPoints: ['tp'], howToRun: 'Teach the big idea (12): go.' },
    };
    const arc = buildLessonArc(mod, { targetMinutes: 25 });
    const teach = arc.segments.find((s) => s.kind === 'teach');
    expect(Array.isArray(teach.audience.stories)).toBe(true);
    expect(teach.audience.stories[0].title).toBe('The Tenant');
    // teach has content BECAUSE of the story, even with a thin lessonPlan
    expect(teach.hasContent).toBe(true);
    // NO-LEAK: the story object carries no facilitator keys
    const FORBIDDEN = ['say', 'do', 'talkingPoints', 'howToRun', 'watchFor'];
    for (const st of teach.audience.stories) {
      for (const k of Object.keys(st)) expect(FORBIDDEN.includes(k)).toBe(false);
    }
  });

  it('a real Living Lesson (L50) carries at least 2 stories, each with a body', () => {
    const l50 = LIVING_LESSONS_MODULES.find((m) => /the-mind-of-christ-thinking/.test(m.id));
    expect(l50).toBeTruthy();
    expect(Array.isArray(l50.stories)).toBe(true);
    expect(l50.stories.length).toBeGreaterThanOrEqual(2);
    for (const s of l50.stories) {
      expect(typeof s.body).toBe('string');
      expect(s.body.length).toBeGreaterThan(20);
    }
  });
});

describe('never lie about a story — kind is truthfully labeled (Darrell 2026-07-21, DR-0215/DR-0076)', () => {
  it('every story across the curriculum is a valid kind, and a testimony is attributed (a real, credited account — never a fiction mislabeled as true)', () => {
    const offenders = [];
    for (const m of LIVING_LESSONS_MODULES) {
      if (!Array.isArray(m.stories)) continue;
      for (const s of m.stories) {
        // kind, when present, must be exactly one of the two truthful labels.
        if (s.kind != null && s.kind !== 'parable' && s.kind !== 'testimony') {
          offenders.push(`${m.id}: invalid kind "${s.kind}"`);
        }
        // A testimony CLAIMS a real, lived event — it must be attributed (source).
        // An unattributed "true story" is not allowed (it would assert reality with
        // no one standing behind it). Parables need no source (they claim nothing real).
        if (s.kind === 'testimony' && !(typeof s.source === 'string' && s.source.trim())) {
          offenders.push(`${m.id}: testimony "${s.title || ''}" has no source/attribution`);
        }
        // Every story must have a body (no empty illustration).
        if (!(typeof s.body === 'string' && s.body.trim().length > 20)) {
          offenders.push(`${m.id}: story "${s.title || ''}" has no real body`);
        }
      }
    }
    expect(offenders, offenders.join(' | ')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// planSessions — the course-split (DR-0215 §2). Adversarial / proven-to-catch:
// it must (a) NEVER drop or reorder a word of the teaching (content-preserving),
// (b) keep a slot-sized lesson to ONE session, (c) flow an over-slot lesson
// across MORE than one session, and (d) split only at sentence boundaries.
// ---------------------------------------------------------------------------
const normWS = (s) => String(s).replace(/\s+/g, ' ').trim();

describe('planSessions — content-preserving course-split (DR-0215)', () => {
  const shortLesson = { id: 'x-short', lesson: 'A short teaching. It fits one slot. Nothing more to say here.' };
  // ~4200 words of teaching -> well over a 25-min slot at 140 wpm (~30 min).
  const longText = Array.from({ length: 300 }, (_, i) =>
    `This is teaching sentence number ${i + 1} and it carries real weight for the learner.`).join(' ');
  const longLesson = { id: 'x-long', lesson: longText };

  it('keeps a slot-sized lesson to a single session', () => {
    const p = planSessions(shortLesson, { slotMinutes: 25 });
    expect(p.sessionCount).toBe(1);
    expect(p.multiSession).toBe(false);
    expect(p.sessions.length).toBe(1);
  });

  it('flows an over-slot lesson across MORE than one session', () => {
    const p = planSessions(longLesson, { slotMinutes: 25 });
    expect(p.sessionCount).toBeGreaterThanOrEqual(2);
    expect(p.multiSession).toBe(true);
    expect(p.sessions.map((s) => s.label)).toEqual(
      p.sessions.map((s, i) => `Session ${i + 1} of ${p.sessions.length}`));
  });

  it('NEVER loses or reorders a word — rejoining the sessions reproduces the teaching', () => {
    const p = planSessions(longLesson, { slotMinutes: 25 });
    expect(normWS(p.sessions.map((s) => s.text).join(' '))).toBe(normWS(longText));
  });

  it('splits only at sentence boundaries (no session ends mid-sentence)', () => {
    const p = planSessions(longLesson, { slotMinutes: 25 });
    for (const s of p.sessions.slice(0, -1)) {
      expect(/[.!?]$/.test(s.text.trim())).toBe(true);
    }
  });

  it('fewer, larger slots need fewer sessions (the slot drives the split)', () => {
    const small = planSessions(longLesson, { slotMinutes: 10 }).sessionCount;
    const big = planSessions(longLesson, { slotMinutes: 60 }).sessionCount;
    expect(small).toBeGreaterThanOrEqual(big);
    expect(big).toBe(1);
  });

  it('a real over-slot Living Lesson (L50) flows across >=2 sessions, content-preserved', () => {
    const l50 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll50-'));
    const p = planSessions(l50, { slotMinutes: 25 });
    expect(p.estMinutes).toBeGreaterThan(25);
    expect(p.sessionCount).toBeGreaterThanOrEqual(2);
    // every session carries real teaching, and none is empty
    for (const s of p.sessions) expect(s.words).toBeGreaterThan(0);
  });

  it('buildLessonArc surfaces the session plan', () => {
    const l50 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll50-'));
    const arc = buildLessonArc(l50, { targetMinutes: 25 });
    expect(arc.sessionPlan).toBeTruthy();
    expect(arc.sessionPlan.multiSession).toBe(true);
    expect(SPOKEN_WPM).toBeGreaterThan(0);
  });
});
