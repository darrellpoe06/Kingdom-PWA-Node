// =============================================================================
// LessonRoad — one lesson's road, recorded → words → built → PR → live, each
// stage with its time and how long it took (DR-0672)
// =============================================================================
// Every stage is derived in lib/lesson-pipeline.js from the row's own tags and
// the real pull request. A stage without evidence reads "unknown" and says
// what is missing; a stage without a timestamp shows no time. Stacked on a
// phone, five across from 640px up (a television reads it across the room).
// =============================================================================
import React from 'react';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

// Words, not only colour, carry the status (a colour-blind reader and a
// screen reader get the same fact).
export const STATUS_WORDS = Object.freeze({
  done: 'done',
  now: 'in progress',
  waiting: 'waiting',
  unknown: 'unknown',
  failed: 'failed',
  stopped: 'stopped',
  skipped: 'not needed',
});
const TONE = {
  done: 'text-[#5A6E3D] border-[#5A6E3D]',
  now: 'text-[#2A5A8E] border-[#2A5A8E]',
  waiting: 'text-[#8B6F47] border-[#E8E4DC]',
  unknown: 'text-[#5A5751] border-[#E8E4DC] border-dashed',
  failed: 'text-[#B85838] border-[#B85838]',
  stopped: 'text-[#B85838] border-[#E8E4DC]',
  skipped: 'text-[#5A5751] border-[#E8E4DC]',
};
const MARK = { done: '✓', now: '→', waiting: '…', unknown: '?', failed: '✕', stopped: '✕', skipped: '–' };

function when(iso) {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

export default function LessonRoad({ road }) {
  if (!road || !Array.isArray(road.stages)) return null;
  return (
    <div className="mt-1.5" data-testid="lesson-road">
      <ol className="grid grid-cols-1 sm:grid-cols-5 gap-1" aria-label="Where this lesson is, stage by stage">
        {road.stages.map((s) => (
          <li
            key={s.key}
            data-testid={`lesson-stage-${s.key}`}
            data-status={s.status}
            className={`border px-1.5 py-1 min-w-0 bg-white ${TONE[s.status] || TONE.unknown}`}
          >
            <p className="text-[0.625rem] uppercase tracking-wider font-semibold flex items-baseline gap-1 min-w-0">
              <span aria-hidden="true">{MARK[s.status] || '?'}</span>
              <span className="truncate">{s.label}</span>
              <span className="sr-only">: {STATUS_WORDS[s.status] || 'unknown'}</span>
            </p>
            <p className="text-[0.625rem] text-[#5A5751] break-words" style={MONO} data-testid={`lesson-stage-${s.key}-when`}>
              {s.at ? when(s.at) : STATUS_WORDS[s.status] || 'unknown'}
              {s.elapsed ? <span className="text-[#1A1815] font-semibold"> · +{s.elapsed}</span> : null}
            </p>
            <p className="text-[0.6875rem] text-[#1A1815] break-words leading-snug" style={SERIF}>{s.line}</p>
            {s.key === 'live' && s.lesson && s.lesson.href && (
              <a href={s.lesson.href} data-testid="lesson-live-link" className="inline-flex items-center min-h-[44px] text-[0.6875rem] underline text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838] break-words" style={SERIF}>
                Open {[s.lesson.number, s.lesson.title].filter(Boolean).join(' ') || s.lesson.lessonId}
              </a>
            )}
          </li>
        ))}
      </ol>
      {road.total && (
        <p className="text-[0.625rem] text-[#5A6E3D] font-semibold mt-1" style={MONO} data-testid="lesson-road-total">Arrival to live: {road.total}</p>
      )}
    </div>
  );
}
