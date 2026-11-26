// =============================================================================
// RecordStrip — the record, announced at the top of Learn (DR-1261)
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
import './record-strip.css';
import { ensureLearnTheme } from '../lib/learn-theme.js';

// The new look follows the chosen theme (DR-1679).
ensureLearnTheme();

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export default function RecordStrip({ headline, onOpenRecord, onOpenLesson, onReadVersion }) {
  if (!headline) return null;
  const h = headline;
  const step = nextStep(h);
  const nothingYet = h.lessonsRead === 0 && h.examsTaken === 0;
  const go = () => {
    if (!step) return;
    if (step.kind === 'version' && onReadVersion) {
      onReadVersion(step.courseKey, step.lessonId, step.version);
      return;
    }
    if (step.lessonId && onOpenLesson) {
      onOpenLesson(step.courseKey, step.lessonId);
      return;
    }
    if (onOpenRecord) onOpenRecord();
  };
  // THE NEW LOOK (Darrell 2026-11-26: "Long skinny letters... looks weird!!!! Fix it" and "Also make it
  // have the new look"). The two numbers that matter stand as tiles with a gold meter; the words keep a
  // readable width at every text size; the buttons wrap below rather than squeeze the words. Same
  // figures, same next step, same test ids (DR-1678).
  return (
    <section
      aria-label="Your record"
      data-testid="record-strip"
      data-lessons-read={h.lessonsRead}
      data-exams-taken={h.examsTaken}
      data-next={step ? step.kind : 'none'}
      className="rs"
    >
      <header className="rs-head">
        <span className="rs-k">Your record</span>
        {h.examsTaken > 0 && h.competency ? (
          <span className="rs-badge" data-testid="record-strip-competency">
            {h.competency.label}
          </span>
        ) : null}
      </header>
      {nothingYet ? (
        <p className="rs-line" data-testid="record-strip-line">
          Nothing read yet of {countWords(h.lessonsTotal)} lessons. Read one to the end and it is recorded here, on every device you sign in on.
        </p>
      ) : (
        <>
          <div className="rs-stats">
            <div className="rs-stat">
              <strong>{h.lessonsRead}</strong>
              <span>of {countWords(h.lessonsTotal)} lessons read</span>
            </div>
            <div className="rs-stat">
              <strong>{h.examsPassed}</strong>
              <span>
                {h.examsPassed === 1 ? 'exam' : 'exams'} passed of {h.examsTaken}
              </span>
            </div>
            <div className="rs-stat">
              <strong>{h.examsTaken ? `${h.avgQuizPct}%` : '—'}</strong>
              <span>average</span>
            </div>
          </div>
          <div className="rs-meter" role="progressbar" aria-label="Lessons read" aria-valuemin={0} aria-valuemax={100} aria-valuenow={h.readPct}>
            <span style={{ width: `${Math.max(0, Math.min(100, h.readPct))}%` }} />
          </div>
          <p className="rs-line" data-testid="record-strip-line">
            {headlineLine(h)}
          </p>
          <p className="rs-detail" data-testid="record-strip-detail">
            {countWords(h.readingsRead)} of {countWords(h.readingsTotal)} readings
            {' · '}
            {h.versionsEver.length} of {h.versionsOffered} versions
            {' · '}
            {h.examsAvailable - h.examsTaken} {h.examsAvailable - h.examsTaken === 1 ? 'exam' : 'exams'} still to answer
          </p>
        </>
      )}
      <div className="rs-actions">
        {step ? (
          <button
            type="button"
            onClick={go}
            data-testid="record-strip-next"
            data-kind={step.kind}
            title={step.why}
            aria-label={`${step.label}. ${step.why}.`}
            className={`rs-next ${FOCUS}`}
          >
            <span className="rs-next-k">Next →</span>
            <span className="rs-next-t">{step.label}</span>
          </button>
        ) : null}
        <button type="button" onClick={onOpenRecord} data-testid="record-strip-open" className={`rs-open ${FOCUS}`}>
          Open your record
        </button>
      </div>
    </section>
  );
}
