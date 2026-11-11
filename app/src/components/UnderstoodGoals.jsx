// =============================================================================
// UnderstoodGoals — the record shows understanding as goals accomplished
// =============================================================================
// Darrell, 2026-11-10, of the record's plain "Understood 11" tile:
// "Understanding is Mastered and understood when the test and lessons are read
// in full 100%... Fix it" and then "Make it look nice like accomplished goals
// are occurring and some black lions for 100% etc... some sword of the spirit
// etc... emojis." (DR-1417)
//
// THE MARKS, each for one thing a row on the record already holds:
//   the Black Lion   a lesson UNDERSTOOD: read in full and its exam at 100%,
//                    in a try that was not rushed and not a retake within a
//                    minute (lib/test-integrity.js isMastery). One lion a lesson.
//   the sword        a lesson READ AND PASSED: on the record and passed after
//                    it. "The sword of the Spirit" is the Word's own phrase
//                    (KJV, Ephesians 6:17), named and never quoted past it.
//   the crown        every lesson tested is understood.
// Nothing is awarded that the record does not show, and a count of zero is
// shown as zero with the way forward, never as a blank or a scolding
// (DR-1386: evaluation, never condemnation).
//
// The lion is the self-hosted lion drawn in ink on a gold seal, so it is a
// BLACK lion in every theme, midnight included (lib/ari.js: the Black Lion).
// Every mark is the app's own artwork (lib/record-marks.js), never a
// device-font glyph; the words beside them carry the meaning, so nothing
// depends on seeing a picture. No red (DR-0099).
// =============================================================================
import React from 'react';
import RecordMark from './RecordMark.jsx';

export const LIONS_SHOWN = 12;
const SEAL = { background: '#C9A227', boxShadow: 'inset 0 0 0 2px #8C6B14' };
const INK = { filter: 'grayscale(1) brightness(0.28) contrast(1.35)' };

/** One Black Lion on its gold seal. `size` is in em, so Big Print scales it. */
export function BlackLion({ size = 1.75, label = 'Black Lion: a lesson understood' }) {
  return (
    <span
      role="img"
      aria-label={label}
      data-testid="black-lion"
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ ...SEAL, width: `${size}em`, height: `${size}em`, fontSize: 'inherit' }}
    >
      <RecordMark name="lion" size={size * 0.62} style={INK} />
    </span>
  );
}

function Mark({ name }) {
  return <RecordMark name={name} className="mr-1" />;
}

/**
 * @param {object} props
 * @param {number} props.understood     lessons mastered
 * @param {number} props.readAndPassed  lessons on the record and passed after it
 * @param {number} props.lessonsTested  lessons with any attempt
 */
export default function UnderstoodGoals({ understood = 0, readAndPassed = 0, lessonsTested = 0 }) {
  const pct = lessonsTested > 0 ? Math.round((understood / lessonsTested) * 100) : 0;
  const all = lessonsTested > 0 && understood === lessonsTested;
  const oneStep = Math.max(0, readAndPassed - understood);
  const shown = Math.min(understood, LIONS_SHOWN);
  return (
    <section data-testid="understood-goals" aria-label="Lessons understood" className="rounded-2xl bg-[#1F3A2E] text-[#F6F1E7] p-4 mb-2">
      <div className="flex items-center gap-3">
        <BlackLion size={3} label="The Black Lion" />
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <div className="text-[0.625rem] uppercase tracking-[0.18em] text-[#C9A227] font-semibold">Understood</div>
          <div className="text-2xl leading-tight text-[#F6F1E7]" style={{ fontFamily: '"Fraunces", serif' }} data-testid="understood-count">
            {understood} of {lessonsTested} {lessonsTested === 1 ? 'lesson' : 'lessons'} tested
          </div>
          <div className="text-[0.75rem] text-[#F6F1E7] opacity-90">The lesson read in full, then every answer right at your own pace: mastered.</div>
        </div>
      </div>
      <div
        className="mt-3 h-2.5 rounded-full bg-[#0F1A14] overflow-hidden"
        role="progressbar"
        aria-label="Lessons understood, of the lessons tested"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: '#C9A227' }} />
      </div>
      {understood > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5" data-testid="understood-lions">
          {Array.from({ length: shown }, (_, i) => (
            <BlackLion key={i} />
          ))}
          {understood > shown && <span className="text-[0.8125rem] text-[#F6F1E7]">and {understood - shown} more</span>}
        </div>
      )}
      {all && (
        <p className="mt-3 text-[0.875rem] text-[#F6F1E7] font-semibold" data-testid="understood-all">
          <Mark name="crown" />
          Every lesson tested is understood. Well done.
        </p>
      )}
      {!all && oneStep > 0 && (
        <p className="mt-3 text-[0.8125rem] text-[#F6F1E7]" data-testid="understood-one-step">
          <Mark name="sword" />
          {oneStep} more {oneStep === 1 ? 'is' : 'are'} read and passed. Read the lesson in full, then take its exam to 100% at your own pace, and each becomes
          a lion.
        </p>
      )}
      {!all && understood === 0 && oneStep === 0 && (
        <p className="mt-3 text-[0.8125rem] text-[#F6F1E7]" data-testid="understood-start">
          <Mark name="book" />
          The first lion is one lesson read in full, then its exam at 100% at your own pace. There is no limit on tries.
        </p>
      )}
    </section>
  );
}
