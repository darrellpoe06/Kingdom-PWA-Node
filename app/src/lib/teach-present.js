// =============================================================================
// teach-present — the two-screen "teach this class" present mode
// =============================================================================
// Darrell 2026-06-16: "create what is best for me to comfortably facilitate this
// from a laptop ... students will see a screen behind me and I will see the same
// or different screen in front of me." That is classic presenter mode: one laptop,
// two windows, one browser —
//   • the AUDIENCE window (projected behind him): clean, huge type, no notes;
//   • the PRESENTER window (his laptop, in front of him): the same slide PLUS the
//     facilitator notes, a run-of-show timer, and prev/next controls.
// The two windows talk over a same-origin BroadcastChannel. He advances on the
// laptop; the projector follows. Different screens on an extended display, and it
// degrades safely to one screen (a clean-mode toggle so notes never leak).
//
// This module is the PURE, testable core: the channel name, the broadcast payload,
// and the timer formatter. It is a NEW file on purpose — church-classes.js is being
// extended in a parallel session, so present mode adds nothing to it and reads the
// curriculum read-only. The audience payload is dumb-by-design: it carries the
// rendered slide content, so the two windows can never drift to different weeks.
// =============================================================================
import { MODULES, weekToDate, PROPOSED_COHORT_START, formatClassDate } from './church-classes.js';

// Same-origin channel the presenter and the projected audience window share.
export const TEACH_CHANNEL = 'poe-teach-v1';

// Target session length (minutes) the presenter timer counts toward. Kept local
// so present mode does not depend on the facilitator-content session model the
// parallel session is authoring; the displayed run-of-show comes from that work
// once it lands, but the clock target stands alone.
export const SESSION_TARGET_MIN = 75;

// mm:ss for the session timer. Clamps negatives / NaN to 0.
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

const fmtDate = formatClassDate;

// The payload the presenter broadcasts and the audience renders. Carries only
// LEARNER content (title / bigIdea / inApp / anchor) — never facilitator notes,
// so a clean projection can never leak the teacher's talking points. Returns null
// for an out-of-range index (the audience then holds its last good slide).
export function buildSlide(weekIndex, startISO = PROPOSED_COHORT_START) {
  const m = MODULES[weekIndex];
  if (!m) return null;
  const date = weekToDate(startISO, weekIndex);
  return {
    type: 'slide',
    week: weekIndex + 1,
    total: MODULES.length,
    id: m.id,
    title: m.title,
    bigIdea: m.bigIdea,
    inApp: m.inApp,
    anchorRef: m.anchor?.ref || null,
    anchorTheme: m.anchor?.theme || null,
    dateLabel: fmtDate(date),
  };
}

// A "holding" message the presenter can throw up between weeks / at the door, so
// the projector shows something intentional instead of a stale slide.
export function holdingSlide(title = 'Learning A.I. The Way') {
  return { type: 'hold', title };
}
