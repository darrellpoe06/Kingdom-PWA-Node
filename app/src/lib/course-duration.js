// =============================================================================
// course-duration — how long a course ACTUALLY takes, at the app's own speeds.
// =============================================================================
// Darrell 2026-09-18: "Can you put the time it takes to go through the course at
// 1 and 1.5 speeds? Users can see the actual time they can expect to spend."
//
// THE RELEVANT FACT THAT MADE THIS CHEAP: the app already knew. `lessonPlanForAge`
// has computed `estimatedMinutes` per lesson per age band since the framework
// was written, and it had ZERO consumers anywhere — computed on every lesson
// open and never once rendered. `RATE_STEPS` in tts.js already offers the exact
// two speeds he named (1× Normal and 1.5× Faster) plus three more. So nothing
// here invents a number; it aggregates numbers the reader is already being
// served and shows them where the decision is made.
//
// WHAT THIS MODULE REFUSES TO SHOW A LEARNER, AND WHY — the measurement that
// corrected its own first draft. The first version also reported a "read time"
// from lessonPlanForAge's `estimatedMinutes`, which is `segments × the band's
// segmentMinutes`. Measured across the 171-lesson series that came out at 736
// HOURS for the adult band against 55 hours of listening — a factor of thirteen.
// The cause is that `segmentMinutes` is a FACILITATED SLOT BUDGET (how long a
// teacher spends on a chunk in a room: 25 minutes for adults, 5 for children),
// not how long the prose takes to read. Dividing it by a playback rate, or
// handing it to a learner as "time to read", would have been a plausible-looking
// number that means nothing — the painted-number failure the reality-trace rule
// exists to prevent (DR-0076 §4).
//
// So: the LEARNER-FACING number is LISTEN time only — spoken words ÷ SPOKEN_WPM
// ÷ rate — which is exactly what a speed multiplier applies to and exactly what
// he asked for. The slot figure is still returned, named `slotMinutes` for what
// it actually is, because a FACILITATOR planning sessions genuinely needs it;
// it is simply never presented as a reading time. No silent-reading pace is
// invented here, because the app does not have one and making one up is the
// same failure wearing a friendlier face.
//
// EVERY NUMBER IS DERIVED FROM THE SAME FUNCTIONS THE LESSON PLAYER USES —
// resolveForAge picks the text, lessonPlanForAge chunks it, planSessions counts
// the spoken words, SPOKEN_WPM sets the cadence, RATE_STEPS supplies the speeds.
// A course door that computed its own pace would eventually disagree with the
// strip inside the lesson, in front of the same reader, and the reader would be
// right to stop trusting both.
//
// Pure and deterministic: no Date, no Math.random, no I/O. Scanning a 171-lesson
// course chunks every band, so the caller memoises (useMemo keyed on the course,
// the age band and the level) rather than calling this per render.
import { lessonPlanForAge, DEFAULT_AGE_BAND } from './learn-framework.js';
import { planSessions, SPOKEN_WPM } from './lesson-flow.js';
import { RATE_STEPS } from './tts.js';

/** The two speeds he asked for, taken FROM the app's own rate control. */
export const HEADLINE_RATES = [1, 1.5];

/**
 * The rate steps the app really offers, narrowed to the ones asked for.
 * Derived from RATE_STEPS so a speed can never be advertised here that the
 * player cannot actually do — if someone removes 1.5× from the control, this
 * stops claiming it rather than lying about it.
 */
export function offeredRates(rates = HEADLINE_RATES) {
  return RATE_STEPS.filter((s) => rates.some((r) => Math.abs(s.value - r) < 0.001));
}

/** Minutes a word count takes to speak at `wpm`, played at `rate`. */
export function spokenMinutes(words, rate = 1, wpm = SPOKEN_WPM) {
  const w = Number(words) || 0;
  // NOT `Number(rate) || 1`: that swallows an explicit 0, silently turning a
  // nonsense rate into 1x and returning a plausible number for an impossible
  // request. Caught by this module's own gate. Only a NON-numeric rate falls
  // back to 1; a numeric-but-invalid one falls through to the guard below.
  const raw = Number(rate);
  const r = Number.isFinite(raw) ? raw : 1;
  if (w <= 0 || wpm <= 0 || r <= 0) return 0;
  return w / wpm / r;
}

/** One lesson, measured for the band and level the reader would actually get. */
export function lessonDuration(module, { ageBand = DEFAULT_AGE_BAND, levelOverride = null } = {}) {
  const m = module || {};
  const plan = lessonPlanForAge(m, ageBand, levelOverride);
  // planSessions counts the SPOKEN material — the teaching prose the reader
  // hears, plus stories and talking points where a lesson carries them. It
  // resolves the same band internally, so the two cannot diverge.
  const sessions = planSessions(m, { ageBand, levelOverride });
  return {
    id: m.id || null,
    levelId: plan.levelId,
    segments: plan.totalSegments,
    // NOT a reading time — the band's facilitated slot budget × its segments.
    // See the header: this is for a facilitator, never for a learner.
    slotMinutes: plan.estimatedMinutes,
    spokenWords: sessions.totalSpokenWords,
  };
}

/**
 * A whole course, at the reader's own level.
 *
 * Returns null for an empty course rather than a zeroed object: a course door
 * showing "0 min" would be a number with nothing behind it, and absent beats
 * painted (DR-0061). The caller renders nothing when this is null.
 */
export function courseDuration(modules, { ageBand = DEFAULT_AGE_BAND, levelOverride = null, rates = HEADLINE_RATES } = {}) {
  const list = (Array.isArray(modules) ? modules : []).filter((m) => m && (m.lesson || m.levels));
  if (!list.length) return null;
  let slotMinutes = 0;
  let spokenWords = 0;
  for (const m of list) {
    const d = lessonDuration(m, { ageBand, levelOverride });
    slotMinutes += d.slotMinutes;
    spokenWords += d.spokenWords;
  }
  const listen = offeredRates(rates).map((s) => ({
    rate: s.value,
    label: s.label,
    name: s.name,
    minutes: spokenMinutes(spokenWords, s.value),
  }));
  return {
    lessons: list.length,
    // Facilitator-only (see the header). A learner-facing surface shows `listen`.
    slotMinutes,
    spokenWords,
    wpm: SPOKEN_WPM,
    listen,
    // The level actually resolved for the first lesson, so the surface can say
    // WHICH version these numbers describe. A reader at a different level gets
    // different numbers by design, and saying so is the honest part.
    levelId: lessonDuration(list[0], { ageBand, levelOverride }).levelId,
  };
}

/**
 * Human phrasing for a duration in minutes.
 *
 * Rounds to whole minutes under an hour and to a tenth of an hour above it,
 * because "3.7 hours" is what a reader can act on and "221 minutes" is not.
 * A duration under a minute reads as "under a minute" rather than "0 min",
 * since zero is a claim that nothing is there.
 */
export function formatDuration(minutes) {
  const n = Number(minutes) || 0;
  if (n <= 0) return null;
  if (n < 1) return 'under a minute';
  if (n < 60) return `${Math.round(n)} min`;
  const hours = n / 60;
  // A whole number of hours drops the decimal: "4 hours", never "4.0 hours".
  const rounded = Math.round(hours * 10) / 10;
  const shown = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${shown} ${rounded === 1 ? 'hour' : 'hours'}`;
}
