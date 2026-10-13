// =============================================================================
// LearnersPanel — the class record, on real rows (DR-0754)
// =============================================================================
// Darrell 2026-10-05: "my son is reading the lessons testing the app and seeing
// how it flows for him... we want to keep analytics on what he's completion
// rates are and competency scores based on the exams in the lessons.. make
// sense?"
//
// WHAT THIS IS A VIEW OF. public.learner_lesson_records (migration 0250), read
// through learner-records-sync. A learner sees his own record. The Governor
// sees every learner's, because the READ WALL says so — not because this
// screen decided (DR-0060: RLS is the wall, the screen is only the view).
//
// IT NEVER GOES BLANK (P15, DR-0381, DR-0691). Every state says what it sees,
// what is missing, and the way to fix it: signed out names the account; no
// rows names the two actions that start the record; a course whose lesson count
// is unknown shows a dash and says so rather than inventing a percentage; an
// untested learner reads "Not yet tested", never 0%.
// =============================================================================

import React from 'react';
import { aggregateLearnerRecords, COMPETENCY_BANDS } from '../lib/learner-records.js';

const PASS_LINE = COMPETENCY_BANDS.find((b) => b.key === 'passing')?.min ?? 70;

function pct(n) {
  return n === null || n === undefined ? '—' : `${n}%`;
}

function when(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

const BAND_TONE = {
  mastered: 'border-[#5A6E3D] text-[#5A6E3D]',
  strong: 'border-[#5A6E3D] text-[#5A6E3D]',
  passing: 'border-[#1A1815] text-[#1A1815]',
  working: 'border-[#B85838] text-[#B85838]',
  'not-yet': 'border-[#E8E4DC] text-[#5A5751]',
};

function BandChip({ band }) {
  const tone = BAND_TONE[band?.key] || BAND_TONE['not-yet'];
  return (
    <span className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 border ${tone}`}>
      {band?.label || 'Not yet tested'}
    </span>
  );
}

function Figure({ label, value, hint }) {
  return (
    <div className="border border-[#E8E4DC] p-3">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">{label}</div>
      <div className="text-lg text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{value}</div>
      {hint ? <div className="text-[0.6875rem] text-[#5A5751]">{hint}</div> : null}
    </div>
  );
}

function LearnerCard({ learner, mine, showWho }) {
  const unknownCompletion = (learner.courses || []).some((c) => c.completionPct === null);
  return (
    <li className="border border-[#E8E4DC] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          {showWho ? (learner.label || 'A learner') : 'Your record'}
          {mine && showWho ? <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]"> · you</span> : null}
          {learner.ageBand ? <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]"> · {learner.ageBand}</span> : null}
        </div>
        <BandChip band={learner.competency} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Figure label="Lessons read" value={learner.lessonsRead} />
        <Figure label="Exams taken" value={learner.examsTaken} />
        <Figure label="Exams passed" value={learner.examsPassed} hint={`${learner.quizAttempts} attempt${learner.quizAttempts === 1 ? '' : 's'}`} />
        <Figure
          label="Average score"
          value={learner.examsTaken ? pct(learner.avgQuizPct) : 'Not yet tested'}
          hint={learner.bestQuizPct === null ? 'Answer a lesson’s exam and the score lands here.' : `best ${pct(learner.bestQuizPct)}`}
        />
      </div>

      {learner.courses?.length ? (
        <>
          <table className="w-full mt-3 text-xs">
            <caption className="sr-only">Course by course, for this learner</caption>
            <thead>
              <tr className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                <th scope="col" className="text-left py-1">Course</th>
                <th scope="col" className="text-right py-1">Read</th>
                <th scope="col" className="text-right py-1">Completion</th>
                <th scope="col" className="text-right py-1">Average</th>
                <th scope="col" className="text-right py-1">Last read</th>
              </tr>
            </thead>
            <tbody>
              {learner.courses.map((c) => (
                <tr key={c.courseKey} className="border-t border-[#E8E4DC]">
                  <th scope="row" className="text-left py-1 font-normal text-[#1A1815]">
                    {c.courseKey === 'unplaced' ? 'Not placed in a course' : c.courseKey}
                  </th>
                  <td className="text-right py-1 text-[#1A1815]">{c.lessonsRead}{c.courseLessons ? ` of ${c.courseLessons}` : ''}</td>
                  <td className="text-right py-1 text-[#1A1815]">{pct(c.completionPct)}</td>
                  <td className="text-right py-1 text-[#1A1815]">{c.examsTaken ? pct(c.avgQuizPct) : '—'}</td>
                  <td className="text-right py-1 text-[#5A5751]">{when(c.lastActivityAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {unknownCompletion && (
            <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
              A dash under Completion means this screen does not yet know how many lessons that course holds, so no rate is shown rather than a guessed one. Open the course once and its real count comes with it.
            </p>
          )}
        </>
      ) : null}
    </li>
  );
}

/**
 * @param {object} props
 * @param {Array} props.records   learner records this account may read
 * @param {string|null} props.currentUserId  which of them is mine
 * @param {boolean} props.isGovernor  does this account steward the class
 * @param {object|null} props.courseTotals  { [courseKey]: lessonCount } — real
 *   counts from the mounted catalog. Absent → completion stays a dash.
 */
export default function LearnersPanel({
  records = null,
  currentUserId = null,
  isGovernor = false,
  courseTotals = null,
  signedIn = true,
}) {
  if (!signedIn) {
    return (
      <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        Your class record is kept with your account, so this screen has nothing to show while you are signed out. Sign in and what you read and answer is recorded here, on every device you use.
      </p>
    );
  }

  const rows = Array.isArray(records) ? records : [];
  const { learners, totals } = aggregateLearnerRecords(rows, { courseTotals });
  const others = learners.filter((l) => l.userId !== currentUserId);
  const mine = learners.find((l) => l.userId === currentUserId) || null;
  const showWho = isGovernor && learners.length > 1;

  if (!learners.length) {
    return (
      <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        No lessons read yet, so there is nothing to measure. Mark a lesson read, or answer its exam, and the record starts here — on this device and every other one you sign in on.
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        {isGovernor
          ? 'Every learner’s own record, as the lessons were actually read and answered. You can see it; you cannot change it.'
          : 'What you have read and answered, kept with your account.'}
      </p>

      {isGovernor && learners.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <Figure label="Learners" value={totals.learners} />
          <Figure label="Lessons read" value={totals.lessonsRead} />
          <Figure label="Exams passed" value={`${totals.examsPassed} of ${totals.examsTaken}`} />
          <Figure label="Class average" value={totals.examsTaken ? pct(totals.avgQuizPct) : 'Not yet tested'} />
        </div>
      )}

      <ul className="space-y-3">
        {mine ? <LearnerCard key={mine.userId} learner={mine} mine showWho={showWho} /> : null}
        {isGovernor ? others.map((l) => <LearnerCard key={l.userId} learner={l} mine={false} showWho />) : null}
      </ul>

      {isGovernor && !mine && others.length ? (
        <p className="text-[0.6875rem] text-[#5A5751] mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Your own record is not here because you have not marked a lesson read yet. Read one and it joins the list.
        </p>
      ) : null}

      <p className="text-[0.6875rem] text-[#5A5751] mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
        The pass line is {PASS_LINE}%, the same line the exam itself uses. “Not yet tested” means no exam has been answered — it is not a score of zero.
      </p>
    </div>
  );
}
