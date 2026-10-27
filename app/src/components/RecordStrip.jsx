// =============================================================================
// RecordStrip — the record, announced at the top of Learn (DR-1260)
// =============================================================================
// Darrell 2026-10-27: "The record should be more announced so it can be used
// and known for how much knowledge has been consumed and how many test
// reflect the competence of the information... so users can be motivated to
// do more or finish more tests and reading."
//
// MEASURED before this: the Class Record lived folded under ONE Learn area
// (Record), its summary one grey line on a tab. A reader on Lessons, Latest
// or Find saw nothing of it. This strip stands under the sticky lessons bar
// on EVERY area while no lesson is open: the two numbers that matter (how
// much read, what the exams prove), the competency the exams earned, and ONE
// next step — the newest lesson read whose exam is not yet answered, else a
// version never read, else the next lesson — as a tap, not a sentence. Every
// figure comes from lib/record-headline.js over the learner's real rows, the
// device's places and the mounted catalog; nothing is painted.
// =============================================================================
import React from 'react';
import { headlineLine, nextStep } from '../lib/record-headline.js';
import { countWords } from '../lib/learn-organize.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

export default function RecordStrip({ headline, onOpenRecord, onOpenLesson, onReadVersion }) {
  if (!headline) return null;
  const h = headline;
  const step = nextStep(h);
  const nothingYet = h.lessonsRead === 0 && h.examsTaken === 0;
  const go = () => {
    if (!step) return;
    if (step.kind === 'version' && onReadVersion) { onReadVersion(step.courseKey, step.lessonId, step.version); return; }
    if (step.lessonId && onOpenLesson) { onOpenLesson(step.courseKey, step.lessonId); return; }
    if (onOpenRecord) onOpenRecord();
  };
  return (
    <section
      aria-label="Your record"
      data-testid="record-strip"
      data-lessons-read={h.lessonsRead}
      data-exams-taken={h.examsTaken}
      data-next={step ? step.kind : 'none'}
      className="mb-3 border-2 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-2"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">Your record</span>
          {h.examsTaken > 0 && h.competency ? (
            <span className="text-[0.625rem] uppercase tracking-wider px-2 py-0.5 border border-[#5A6E3D] text-[#5A6E3D]" data-testid="record-strip-competency">{h.competency.label}</span>
          ) : null}
        </div>
        {nothingYet ? (
          <p className="text-sm text-[#1A1815] leading-snug" style={SERIF} data-testid="record-strip-line">
            Nothing read yet of {countWords(h.lessonsTotal)} lessons. Read one to the end and it is recorded here, on every device you sign in on.
          </p>
        ) : (
          <>
            <p className="text-sm text-[#1A1815] leading-snug" style={SERIF} data-testid="record-strip-line">{headlineLine(h)}</p>
            <p className="text-[0.6875rem] text-[#5A5751] leading-snug" style={MONO} data-testid="record-strip-detail">
              {countWords(h.readingsRead)} of {countWords(h.readingsTotal)} readings
              {' · '}{h.versionsEver.length} of {h.versionsOffered} versions
              {' · '}{h.examsAvailable - h.examsTaken} {h.examsAvailable - h.examsTaken === 1 ? 'exam' : 'exams'} still to answer
            </p>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {step ? (
          <button
            type="button"
            onClick={go}
            data-testid="record-strip-next"
            data-kind={step.kind}
            title={step.why}
            aria-label={`${step.label}. ${step.why}.`}
            className={`text-left px-3 py-2 min-h-[44px] border-2 border-[#5A6E3D] bg-[#5A6E3D] text-white hover:bg-[#4a5a31] ${FOCUS}`}
          >
            <span className="block text-[0.625rem] uppercase tracking-wider font-semibold">Next →</span>
            <span className="block text-[0.8125rem] leading-snug" style={SERIF}>{step.label}</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenRecord}
          data-testid="record-strip-open"
          className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white ${FOCUS}`}
        >
          Open your record
        </button>
      </div>
    </section>
  );
}
