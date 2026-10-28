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
import { aggregateLearnerRecords, examAttemptsByLesson, COMPETENCY_BANDS, RECORD_VERSION_IDS } from '../lib/learner-records.js';
import { VERSION_LABEL } from '../lib/lesson-read-mark.js';

const PASS_LINE = COMPETENCY_BANDS.find((b) => b.key === 'passing')?.min ?? 70;

function pct(n) {
  return n === null || n === undefined ? '—' : `${n}%`;
}

function when(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

function whenAt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

// EVERY EXAM ATTEMPT (DR-1264). Darrell 2026-10-28, on "5 exams taken · 6
// attempts": "How did I take 6 test and no know what happened and when? I
// also should be able to keep 100% by using that test again or read it
// again." So each lesson he has tested is listed, newest first, with its
// best, and under it every attempt with its moment and its own score; the
// record keeps the best (the wall, 0313), so a retake is never a risk. His
// own record carries the two doors — the exam again, the reading again;
// another learner's, seen by the Governor, is a record to read, not to act on.
function ExamHistory({ rows, userId, titleOf, onRetake, onReadAgain, mine }) {
  const lessons = examAttemptsByLesson(rows, { titleOf, userId });
  if (!lessons.length) return null;
  const total = lessons.reduce((n, l) => n + l.tries.length, 0);
  return (
    <div className="mt-3 border-t border-[#E8E4DC] pt-2" data-testid="exam-history">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">
        Every exam attempt
        <span className="normal-case tracking-normal text-[#1A1815]">{' — '}{total} attempt{total === 1 ? '' : 's'} on {lessons.length} lesson{lessons.length === 1 ? '' : 's'}; the best score stands</span>
      </div>
      <ul className="space-y-2">
        {lessons.map((l) => (
          <li key={`${l.courseKey || 'unplaced'}:${l.lessonId}`} className="border border-[#E8E4DC] p-2" data-testid="exam-lesson" data-lesson={l.lessonId}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{l.title}</span>
              <span className={`text-[0.625rem] uppercase tracking-wider px-2 py-0.5 border ${l.bestPassed ? 'border-[#5A6E3D] text-[#5A6E3D]' : 'border-[#B85838] text-[#B85838]'}`}>
                best {pct(l.bestPct)}{l.bestPassed ? ' · passed' : ''}
              </span>
              {mine && typeof onRetake === 'function' && (
                <button
                  type="button"
                  onClick={() => onRetake(l.courseKey, l.lessonId)}
                  data-testid="exam-retake"
                  className="ml-auto text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                >
                  Take the exam again
                </button>
              )}
              {mine && typeof onReadAgain === 'function' && (
                <button
                  type="button"
                  onClick={() => onReadAgain(l.courseKey, l.lessonId)}
                  data-testid="exam-read-again"
                  className="text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                >
                  Read it again
                </button>
              )}
            </div>
            <ol className="mt-1 space-y-0.5" aria-label={`Attempts on ${l.title}`}>
              {l.tries.map((t) => (
                <li key={`${t.at}-${t.n}`} className="flex flex-wrap items-baseline gap-2 text-[0.6875rem] text-[#5A5751]" data-testid="exam-attempt">
                  <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{whenAt(t.at)}</span>
                  <span className="text-[#1A1815]">{pct(t.pct)}</span>
                  <span className={t.passed ? 'text-[#5A6E3D]' : t.passed === false ? 'text-[#B85838]' : ''}>{t.passed ? 'passed' : t.passed === false ? 'not yet' : ''}</span>
                  {t.band ? <span>· {t.band}</span> : null}
                  {t.fromColumns ? <span>· recorded before each attempt was kept; this is the last of {t.n}</span> : null}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </div>
  );
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

function LearnerCard({ learner, mine, showWho, rows = [], titleOf, onRetake, onReadAgain }) {
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

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Figure label="Lessons read" value={learner.lessonsRead} />
        {/* WHICH VERSIONS (DR-1255, closed DR-1261): the same Word is written
            for five readers; the record says which of them this learner has
            read in, and how many are still to read. */}
        <Figure
          label="Versions read"
          value={learner.versionsRead?.length ? learner.versionsRead.map((v) => VERSION_LABEL[v] || v).join(', ') : 'Not recorded yet'}
          hint={learner.versionsRead?.length ? `${learner.versionsRead.length} of ${RECORD_VERSION_IDS.length} — ${RECORD_VERSION_IDS.length - learner.versionsRead.length} still to read` : 'A lesson read from now on records its version.'}
        />
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
          <ExamHistory rows={rows} userId={learner.userId} titleOf={titleOf} onRetake={onRetake} onReadAgain={onReadAgain} mine={mine} />
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
  titleOf = null,        // (lessonId, courseKey) => title, from the mounted catalog
  onRetake = null,       // (courseKey, lessonId) => opens the lesson at its exam
  onReadAgain = null,    // (courseKey, lessonId) => opens the reading from the top
}) {
  const nameOf = typeof titleOf === 'function' ? titleOf : () => null;
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
        {mine ? <LearnerCard key={mine.userId} learner={mine} mine showWho={showWho} rows={rows} titleOf={nameOf} onRetake={onRetake} onReadAgain={onReadAgain} /> : null}
        {isGovernor ? others.map((l) => <LearnerCard key={l.userId} learner={l} mine={false} showWho rows={rows} titleOf={nameOf} />) : null}
      </ul>

      {isGovernor && !mine && others.length ? (
        <p className="text-[0.6875rem] text-[#5A5751] mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Your own record is not here because you have not marked a lesson read yet. Read one and it joins the list.
        </p>
      ) : null}

      <p className="text-[0.6875rem] text-[#5A5751] mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
        The pass line is {PASS_LINE}%, the same line the exam itself uses. “Not yet tested” means no exam has been answered — it is not a score of zero. Every attempt is kept with its moment and its score, and the record keeps your best, so taking an exam again can only help.
      </p>
    </div>
  );
}
