// =============================================================================
// LessonFlow — the SHARED renderers for the lesson-flow standard (lib/lesson-flow)
// =============================================================================
// Two views over the SAME derived five-stage arc (Open → Teach → Engage → Apply →
// Send-off), so every Learn course presents consistently for both audiences:
//
//   • LessonFlowAudience — the LEARNER view. A clean, one-stage-at-a-time
//     progression with a stage RAIL so you always see where you are and what's
//     next (anxiety-clarity). It renders only each segment's learner-safe
//     `audience` content; the per-stage body comes from a `renderStage(segment)`
//     callback so the host keeps its existing real wiring (paced lesson, media,
//     launch button, quiz, etc.) — this component owns the ARC chrome, not the
//     content.
//
//   • LessonRunOfShow — the FACILITATOR view. The whole arc laid out as a smooth
//     run-of-show: each stage titled + TIMED, with what-to-SAY, what-to-DO, what to
//     watch for, and the transition cue into the next stage. A time-adaptive REFLOW
//     control re-times the whole plan to any total length (a 30-min family reading
//     or a 75-min class of the same lesson). Self-contained: it builds the arc.
//
// NO-LEAK: the audience view is handed only `audience` content; facilitator notes
// (say/do/howToRun) live solely in LessonRunOfShow. Same contract as teach-present.
//
// Accessibility (WCAG 2.1 AA, against the rendered tokens): #1A1815 body on
// #FAF8F4/white, #5A5751 secondary, #5A6E3D / #B85838 / #7A1F1F accents; every
// control >=36px and keyboard-reachable with a visible #B85838 focus ring; the
// stage rail is an aria progress context; aria-live on the active stage.
// =============================================================================
import React, { useState } from 'react';
import { buildLessonArc } from '../lib/lesson-flow.js';
import { DEFAULT_AGE_BAND } from '../lib/learn-framework.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

// -----------------------------------------------------------------------------
// The stage rail — the consistent "where am I / what's next" strip shared by both
// views. `current` is the active index (audience), or -1 for the facilitator
// overview (no single active stage). Clicking a stage jumps to it when onJump given.
// -----------------------------------------------------------------------------
function StageRail({ segments, current = -1, onJump = null }) {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  return (
    <ol className="flex flex-wrap gap-1.5 mb-3" aria-label="Lesson stages">
      {segments.map((s, i) => {
        const on = i === current;
        const done = current > -1 && i < current;
        const base = 'flex items-center gap-1 text-[0.625rem] uppercase tracking-wider px-2 py-1.5 min-h-[32px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
        const tone = on
          ? 'border-[#1A1815] bg-[#1A1815] text-white'
          : done
            ? 'border-[#5A6E3D] text-[#5A6E3D]'
            : 'border-[#E8E4DC] text-[#5A5751]';
        const label = (
          <>
            <span aria-hidden="true">{done ? '✓' : s.icon}</span>
            <span>{s.title}</span>
            {s.minutes > 0 && <span className="opacity-70" style={MONO}>{s.minutes}m</span>}
          </>
        );
        return (
          <li key={s.kind}>
            {onJump ? (
              <button type="button" onClick={() => onJump(i)} aria-current={on ? 'step' : undefined} className={base + ' ' + tone}>
                {label}
              </button>
            ) : (
              <span aria-current={on ? 'step' : undefined} className={base + ' ' + tone}>{label}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// -----------------------------------------------------------------------------
// LessonFlowAudience — the learner's one-stage-at-a-time progression.
//   props:
//     arc          — a built arc from buildLessonArc (uses arc.audienceSegments)
//     renderStage  — (segment, index) => ReactNode  (the stage body; host-wired)
//     unitNoun     — "week" | "lesson" (label only)
//     onComplete   — fired once when the learner reaches the final stage
//     initialIndex — stage to open on (resume-your-place; clamped to the arc)
//     onStageChange— (index) => void, fired on every move (persists the place)
// -----------------------------------------------------------------------------
export function LessonFlowAudience({ arc, renderStage, unitNoun = 'lesson', onComplete = null, initialIndex = 0, onStageChange = null }) {
  const segments = (arc && arc.audienceSegments) || [];
  const [idx, setIdx] = useState(() => Math.max(0, initialIndex));
  const firedRef = React.useRef(false);
  if (segments.length === 0) return null;

  const clamped = Math.min(idx, segments.length - 1);
  const seg = segments[clamped];
  const atFirst = clamped === 0;
  const atLast = clamped === segments.length - 1;

  const goTo = (i) => {
    const n = Math.max(0, Math.min(segments.length - 1, i));
    setIdx(n);
    if (onStageChange) onStageChange(n);
    if (n === segments.length - 1 && !firedRef.current) { firedRef.current = true; if (onComplete) onComplete(); }
  };

  return (
    <div className="mb-2">
      <StageRail segments={segments} current={clamped} onJump={goTo} />

      <div className="border border-[#E8E4DC] bg-white p-3" aria-live="polite">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="text-sm font-semibold text-[#1A1815]" style={SERIF}>
            <span aria-hidden="true">{seg.icon}</span> {seg.title} <span className="text-[#5A5751] font-normal">· {seg.subtitle}</span>
          </span>
          <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={MONO}>
            {clamped + 1} / {segments.length}{seg.minutes > 0 ? ` · ~${seg.minutes} min` : ''}
          </span>
        </div>
        <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={SERIF}>{seg.blurb}</p>

        <div>{renderStage(seg, clamped)}</div>

        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-[#E8E4DC]">
          <button
            type="button"
            onClick={() => goTo(clamped - 1)}
            disabled={atFirst}
            className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-40 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            ◀ Previous part
          </button>
          <span className="text-[0.625rem] text-[#5A5751] uppercase tracking-wider" style={SERIF}>
            {atLast ? `End of this ${unitNoun}` : seg.cue}
          </span>
          <button
            type="button"
            onClick={() => goTo(clamped + 1)}
            disabled={atLast}
            className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border-2 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${atLast ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white opacity-60' : 'border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#3a352f]'}`}
          >
            {atLast ? 'Done ✓' : 'Next part ▶'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Common reflow presets the facilitator can pick (minutes). The current total is
// always shown even if it isn't one of these.
const REFLOW_PRESETS = [20, 30, 45, 60, 75, 90];

// -----------------------------------------------------------------------------
// LessonRunOfShow — the facilitator's smooth, timed run-of-show for one module.
//   props:
//     module       — the authored module
//     baseMinutes  — the course's session length (the starting total)
//     ageBand, levelOverride — depth/age (so the run-of-show matches what learners see)
//     sessionLabel — heading override ("How to run the 75 minutes" / family wording)
//     handsOnLabel — "In the app" | "Take it with you"
// -----------------------------------------------------------------------------
export function LessonRunOfShow({
  module,
  baseMinutes = 60,
  ageBand = DEFAULT_AGE_BAND,
  levelOverride = null,
  sessionLabel = 'Run-of-show',
  handsOnLabel = 'In the app',
}) {
  const [target, setTarget] = useState(Math.max(1, Math.round(baseMinutes) || 60));
  const arc = buildLessonArc(module, { ageBand, levelOverride, targetMinutes: target, handsOnLabel });
  const segments = arc.segments || [];

  return (
    <div className="mt-3 border-l-4 border-[#7A1F1F] bg-[#FAF8F4] p-3">
      <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#7A1F1F] font-semibold">{sessionLabel}</div>
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={MONO}>{arc.totalMinutes} min total</div>
      </div>

      {/* Course-split (DR-0215 §2): when the spoken teaching runs longer than the
          chosen slot, the lesson FLOWS across more than one session — content-
          preserving (every word is carried, nothing cut). A single-session lesson
          shows nothing here. */}
      {arc.sessionPlan && arc.sessionPlan.multiSession && (
        <div className="mb-3 border border-[#7A1F1F] bg-white p-2">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#7A1F1F] font-semibold mb-1">
            Runs across {arc.sessionPlan.sessionCount} sessions · ~{arc.sessionPlan.estMinutes} min of teaching
          </div>
          <p className="text-[0.6875rem] text-[#5A5751] mb-1" style={SERIF}>
            This lesson is longer than one {arc.totalMinutes}-minute slot, so teach it across {arc.sessionPlan.sessionCount} sittings — nothing is cut, it is paced across sessions.
          </p>
          <ol className="text-[0.6875rem] text-[#1A1815] space-y-0.5" style={SERIF}>
            {arc.sessionPlan.sessions.map((sp) => (
              <li key={sp.index}>
                <strong className="text-[#5A6E3D]">{sp.label}</strong> · ~{sp.estMinutes} min
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Time-adaptive reflow — re-time the whole plan to any length (#309). */}
      <div className="mb-3">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Fit the time you have</div>
        <div role="group" aria-label="Reflow the session length" className="flex flex-wrap gap-1.5 items-center">
          {REFLOW_PRESETS.map((p) => {
            const on = p === target;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                onClick={() => setTarget(p)}
                className={`text-[0.625rem] uppercase tracking-wider px-2.5 py-1.5 min-h-[32px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${on ? 'border-[#7A1F1F] bg-[#7A1F1F] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#7A1F1F] hover:text-[#7A1F1F]'}`}
              >
                {p}m
              </button>
            );
          })}
          <span className="inline-flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={() => setTarget((t) => Math.max(5, t - 5))}
              aria-label="Five minutes shorter"
              className="text-[0.6875rem] px-2 py-1.5 min-h-[32px] min-w-[32px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            >−</button>
            <button
              type="button"
              onClick={() => setTarget((t) => Math.min(240, t + 5))}
              aria-label="Five minutes longer"
              className="text-[0.6875rem] px-2 py-1.5 min-h-[32px] min-w-[32px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            >+</button>
          </span>
        </div>
      </div>

      <StageRail segments={segments} />

      <ol className="space-y-2">
        {segments.map((s) => (
          <li key={s.kind} className="border border-[#E8E4DC] bg-white p-3">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-[#1A1815]" style={SERIF}>
                <span aria-hidden="true">{s.icon}</span> {s.title} <span className="text-[#5A5751] font-normal">· {s.subtitle}</span>
              </span>
              <span className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D]" style={MONO}>~{s.minutes} min</span>
            </div>

            {/* What the audience sees this stage (so the leader has context) */}
            {s.kind === 'open' && (s.audience.anchorRef || s.audience.bigIdea) && (
              <p className="text-[0.6875rem] text-[#5A5751] mb-1" style={SERIF}>
                {s.audience.anchorRef && <><strong className="text-[#5A6E3D]">Anchor — {s.audience.anchorRef}:</strong> {s.audience.anchorTheme} </>}
              </p>
            )}
            {s.kind === 'apply' && s.audience.inApp && (
              <p className="text-[0.6875rem] text-[#5A5751] mb-1" style={SERIF}><strong className="text-[#1A1815]">{s.audience.handsOnLabel}:</strong> {s.audience.inApp}</p>
            )}

            {/* SAY */}
            {Array.isArray(s.facilitator.say) && s.facilitator.say.length > 0 && (
              <div className="mb-1.5">
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-0.5">Say</div>
                <ul className="list-disc pl-5 space-y-0.5">
                  {s.facilitator.say.map((t, i) => <li key={i} className="text-[0.6875rem] text-[#1A1815]" style={SERIF}>{t}</li>)}
                </ul>
              </div>
            )}

            {/* DO */}
            {Array.isArray(s.facilitator.do) && s.facilitator.do.length > 0 && (
              <div className="mb-1.5">
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-0.5">Do</div>
                <ul className="list-disc pl-5 space-y-0.5">
                  {s.facilitator.do.map((t, i) => <li key={i} className="text-[0.6875rem] text-[#1A1815]" style={SERIF}>{t}</li>)}
                </ul>
              </div>
            )}

            {/* Discussion prompts surface on the engage stage */}
            {s.kind === 'engage' && Array.isArray(s.facilitator.prompts) && s.facilitator.prompts.length > 0 && (
              <div className="mb-1.5">
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-0.5">Prompts</div>
                <ul className="list-disc pl-5 space-y-0.5">
                  {s.facilitator.prompts.map((t, i) => <li key={i} className="text-[0.6875rem] text-[#1A1815]" style={SERIF}>{t}</li>)}
                </ul>
              </div>
            )}

            {s.kind === 'apply' && s.facilitator.watchFor && (
              <p className="text-[0.6875rem] text-[#7A1F1F] mb-1" style={SERIF}><strong>Watch for:</strong> {s.facilitator.watchFor}</p>
            )}

            <p className="text-[0.625rem] text-[#5A5751] uppercase tracking-wider mt-1" style={SERIF}>→ {s.cue}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default LessonFlowAudience;
