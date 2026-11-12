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

import React, { useEffect, useState } from 'react';
import { aggregateLearnerRecords, examAttemptsByLesson, rowToRecord, COMPETENCY_BANDS, RECORD_VERSION_IDS } from '../lib/learner-records.js';
import { testIntegrityKpis } from '../lib/test-integrity.js';
import { courseStanding, examsOwed, mostStudied, growthOpportunities, courseAwards } from '../lib/course-pace.js';
import UnderstoodGoals from './UnderstoodGoals.jsx';
import RecordFreshness from './RecordFreshness.jsx';
import { learnerIdentity } from '../lib/learner-identity.js';
import { emptyIndex, loadContactIndex } from '../lib/contact-names.js';
import { emptyHousehold, loadLearnerHousehold } from '../lib/learner-household.js';
import RecordMark from './RecordMark.jsx';
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
      {band?.key === 'mastered' ? 'Exam average 90% or more' : band?.label || 'Not yet tested'}
    </span>
  );
}

// THE FIGURES WRAP BY THEIR OWN SIZE (Darrell 2026-11-10, a Big Print
// screenshot of his record: "LESSONSVERSIONS", "Child,35", "attempts100%" —
// "Fix it"). The grids counted columns by the SCREEN (sm:grid-cols-5), so a
// wide screen kept five columns while Big Print made the words three times
// larger, and each figure ran into the next. Columns are now sized by the
// TEXT: each figure is at least FIGURE_MIN_EM wide in its own em, which grows
// with Big Print, so a row wraps to fewer columns as the words grow; and a
// long word breaks inside its own box instead of crossing into the next one.
export const FIGURE_MIN_EM = 9;
export const FIGURE_GRID = { gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${FIGURE_MIN_EM}em), 1fr))` };

function Figure({ label, value, hint, mark = null }) {
  return (
    <div className="border border-[#E8E4DC] p-3 min-w-0 [overflow-wrap:anywhere]" data-testid="record-figure">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">{mark ? <RecordMark name={mark} size={1.25} className="mr-1" /> : null}{label}</div>
      <div className="text-lg text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{value}</div>
      {hint ? <div className="text-[0.6875rem] text-[#5A5751]">{hint}</div> : null}
    </div>
  );
}

// HOW THE EXAMS WERE TAKEN, KEPT APART FROM WHAT THEY SCORED (DR-1386). Darrell
// 2026-11-10: "some kpi's that fit noticing when a human roll a test", "test
// taking and grading are separate and both should mean more", "reading and
// comprehension as the main goal", and "No Condemnation.. evaluation". Each
// attempt on the record is placed against the lesson's place on the record
// (read or marked done), so the figures are a mirror, never a verdict.
function TakenAndGraded({ rows = [], userId, courseLessonIds = null }) {
  const mine = rows.map(rowToRecord).filter((r) => r.userId === userId);
  // DR-1439: ONE reading of the record, the same one "Where you stand" uses, so the
  // two can never disagree. Without the catalog's ids, the record's own lessons.
  const ids = courseLessonIds && Object.keys(courseLessonIds).length ? courseLessonIds : idsFromRecords(mine);
  const s = courseStanding(mine, ids);
  if (!s.lessonsTested) return null;
  const k = testIntegrityKpis(mine);
  return (
    <div className="mt-2" data-testid="taken-and-graded">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Understanding</div>
      {/* MINDSETS TO MASTER (DR-1439, Darrell 2026-11-12, rendered for meaning): reading counts on its own, understanding
          comes by the repetition of the study, and repetition promotes rigor. */}
      <ul className="mb-2 text-xs text-[#1A1815] space-y-0.5" data-testid="mindsets-to-master" aria-label="Mindsets to master">
        <li className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] list-none">Mindsets to master</li>
        <li>Read in full: the reading counts on its own.</li>
        <li>Repeat the study: understanding comes by repetition, so every try is study.</li>
        <li>Hold the rigor: every answer right, at 100%, however many tries it takes.</li>
      </ul>
      {/* UNDERSTOOD (DR-1417, DR-1439): read in full and every answer right, in either order, after as many tries as it takes. */}
      <UnderstoodGoals understood={s.mastered} readAndPassed={s.lessonsDone} lessonsTested={s.lessonsTested} />
      <div className="grid gap-2" style={FIGURE_GRID} data-testid="record-figures">
        <Figure mark="sword" label="Read and passed" value={s.lessonsDone} hint="The lesson read and its exam passed, in either order. The sword of the Spirit, taken up (Ephesians 6:17)." />
        <Figure mark="book" label="Times tested" value={s.tries} hint="Every try is study. Understanding comes by repetition, and repetition is rigor." />
        <Figure mark="target" label="Tries to first pass" value={k.triesToFirstPass === null ? 'No pass yet' : k.triesToFirstPass} hint="Across the lessons passed." />
      </div>
      {mostStudied(s).length > 0 && (
        <div className="mt-2" data-testid="most-studied">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Most studied</div>
          <ol className="text-xs text-[#1A1815] space-y-0.5 list-decimal list-inside">
            {mostStudied(s).map((c) => (
              <li key={c.courseKey} className="[overflow-wrap:anywhere]">
                {c.courseKey}: tested {c.tries} {c.tries === 1 ? 'time' : 'times'}, {c.read} of {c.total} read
              </li>
            ))}
          </ol>
        </div>
      )}
      {growthOpportunities(s).length > 0 && (
        <div className="mt-2" data-testid="growth-opportunities">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Most opportunities to grow understanding</div>
          <ol className="text-xs text-[#1A1815] space-y-0.5 list-decimal list-inside">
            {growthOpportunities(s).map((c) => (
              <li key={c.courseKey} className="[overflow-wrap:anywhere]">
                {c.courseKey}: {c.grow} studied {c.grow === 1 ? 'lesson' : 'lessons'} still to take to 100%
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/** { courseKey: [lessonId, ...] } from the records themselves, when the catalog's ids are not at hand. Pure. */
function idsFromRecords(records) {
  const out = {};
  for (const r of records) {
    if (!r || !r.courseKey || !r.lessonId) continue;
    (out[r.courseKey] = out[r.courseKey] || []).includes(r.lessonId) || out[r.courseKey].push(r.lessonId);
  }
  return out;
}

// WHERE YOU STAND AND WHERE THIS PACE LANDS (DR-1422). Darrell, 2026-11-11:
// "Fully completed courses... x amount x to go... on pace for completing by x
// date at this pace", after "Read and tested...". Every figure above this one
// counts the past; none of them stated a GOAL or how far is left. Done here is
// his definition — the reading on the record AND the exam passed — and mastery
// at 100% rides beside it rather than inside it (DR-1386 keeps them apart).
// The date is this learner's own measured rate or it is not shown at all: a
// projection with no basis is a painted number (DR-0061 / P15).
function StandingAndPace({ rows = [], userId, courseLessonIds }) {
  if (!courseLessonIds || !Object.keys(courseLessonIds).length) return null;
  const mine = rows.map(rowToRecord).filter((r) => r.userId === userId);
  const s = courseStanding(mine, courseLessonIds);
  if (!s.coursesTotal) return null;
  const p = s.pace;
  const onPace = p.finishAt
    ? `At this pace, the rest by ${new Date(p.finishAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`
    : p.far
      ? 'At this pace, longer than ten years'
      : 'Not enough read and tested yet to measure a pace';
  const basis = p.basisCount >= 2 && p.basisDays ? `${p.basisCount} read and tested across ${p.basisDays} day${p.basisDays === 1 ? '' : 's'} — ${p.perWeek} a week` : p.why;
  return (
    <div className="mt-2" data-testid="standing-and-pace">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Where you stand</div>
      {/* COURSES ARE REWARDED (DR-1440): each course earns its highest award, as a lesson earns a lion. */}
      {courseAwards(s).length > 0 && (
        <div className="mb-2" data-testid="course-awards">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">
            Courses rewarded: {s.coursesUnderstood} understood, {s.coursesComplete} completed, {s.coursesRead} read in full
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {courseAwards(s).map((a) => (
              <li key={a.courseKey} className="inline-flex items-center gap-1 border border-[#C9A227] px-2 py-1 text-xs text-[#1A1815] [overflow-wrap:anywhere]" title={a.label} data-award={a.award}>
                <RecordMark name={a.award} size={1.1} />
                <span>{a.courseKey}</span>
                <span className="sr-only">: {a.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-2" style={FIGURE_GRID} data-testid="standing-figures">
        <Figure label="Courses read in full" value={`${s.coursesRead} of ${s.coursesTotal}`} hint="Every lesson in the course read. Reading counts on its own." />
        <Figure label="Courses fully completed" value={`${s.coursesComplete} of ${s.coursesTotal}`} hint="Every lesson in the course read and its exam passed, in either order." />
        <Figure label="Lessons read" value={`${s.lessonsRead} of ${s.lessonsTotal}`} hint={`${s.lessonsTotal - s.lessonsRead} still to read.`} />
        <Figure label="Read and passed" value={`${s.lessonsDone} of ${s.lessonsTotal}`} hint={`The lesson read and its exam passed, in either order. ${s.lessonsToGo} to go.`} />
        <Figure label="Understood at 100%" value={`${s.mastered} of ${s.lessonsTotal}`} hint="Read in full, and every answer right, after as many tries as it takes." />
        <Figure label="On pace" value={onPace} hint={basis} />
      </div>
    </div>
  );
}

function CoursePair({ label, value }) {
  return (
    <div className="flex items-baseline gap-1">
      <dt className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{label}</dt>
      <dd className="text-[#1A1815]">{value}</dd>
    </div>
  );
}

// The lesson ids this learner has on the record as read, in one course.
function readIdsFor(rows, userId, courseKey) {
  const out = new Set();
  for (const r of rows.map(rowToRecord)) if (r.userId === userId && r.courseKey === courseKey && r.completedAt) out.add(r.lessonId);
  return out;
}

// WHICH EXAMS ARE STILL OWED (DR-1434; Darrell 2026-11-12, "I have more than 2 courses completed.... fix it"). A course
// counts as fully completed when every lesson is read AND its exam is passed (DR-1422). The list above says which lessons
// are not read; this says which READ lessons still wait on a passed exam, each one tap to take when it is your own record,
// so "Every lesson in this course is on the record" can never stand beside a course the count leaves out without a reason.
function ExamsOwed({ owed = [], courseKey, titleOf, onRetake }) {
  if (!owed.length) return null;
  return (
    <div className="mt-1" data-testid="learner-course-exams-owed">
      <p className="text-[0.6875rem] text-[#5A5751]">
        {owed.length} exam{owed.length === 1 ? '' : 's'} still to pass before this course counts as fully completed:
      </p>
      <ul className="mt-0.5 space-y-0.5 text-xs">
        {owed.map((x) => {
          const label = `${x.n}. ${(typeof titleOf === 'function' && titleOf(x.id, courseKey)) || x.id}`;
          return (
            <li key={x.id} className="min-w-0" data-lesson-id={x.id}>
              {onRetake ? (
                <button type="button" onClick={() => onRetake(courseKey, x.id)} className="text-left underline underline-offset-2 text-[#1A1815] min-h-[36px] [overflow-wrap:anywhere] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
                  {label}: take the exam
                </button>
              ) : (
                <span className="[overflow-wrap:anywhere]">{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// WHICH LESSONS ARE NOT ON THE RECORD YET (DR-1393; Darrell 2026-11-10: "No 100% even after completing all lessons... Evaluation
// of systems"). Completion is read lessons over the course's lessons; when it is short of the whole, this names each lesson the
// record does not hold yet, by number and title, each one tap to read when it is your own record. A long list folds.
function NotYetRead({ ids, readIds, courseKey, titleOf, onReadAgain }) {
  if (!Array.isArray(ids) || !ids.length) return null;
  const missing = ids.map((id, i) => ({ id, n: i + 1 })).filter((x) => !readIds.has(x.id));
  if (!missing.length) {
    return <p className="text-[0.6875rem] text-[#5A6E3D] mt-0.5" data-testid="learner-course-whole">Every lesson in this course is on the record.</p>;
  }
  const items = missing.map((x) => {
    const title = (typeof titleOf === 'function' && titleOf(x.id, courseKey)) || x.id;
    const label = `${x.n}. ${title}`;
    return (
      <li key={x.id} className="min-w-0" data-testid="learner-course-missing" data-lesson-id={x.id}>
        {onReadAgain ? (
          <button type="button" onClick={() => onReadAgain(courseKey, x.id)} className="text-left underline underline-offset-2 text-[#1A1815] min-h-[36px] [overflow-wrap:anywhere] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
            {label}
          </button>
        ) : (
          <span className="[overflow-wrap:anywhere]">{label}</span>
        )}
      </li>
    );
  });
  const lead = `${missing.length} not on the record yet`;
  if (missing.length <= 12) {
    return (
      <div className="mt-1 text-[0.6875rem] text-[#5A5751]" data-testid="learner-course-gap">
        {lead}:
        <ul className="mt-0.5 space-y-0.5">{items}</ul>
      </div>
    );
  }
  return (
    <details className="mt-1 text-[0.6875rem] text-[#5A5751]" data-testid="learner-course-gap">
      <summary className="cursor-pointer min-h-[36px]">{lead}: show them</summary>
      <ul className="mt-0.5 space-y-0.5">{items}</ul>
    </details>
  );
}

function LearnerCard({ learner, mine, showWho, rows = [], titleOf, onRetake, onReadAgain, courseLessonIds = null, contacts = null, household = null }) {
  const who = learnerIdentity(learner, { contacts, mine, household });
  const unknownCompletion = (learner.courses || []).some((c) => c.completionPct === null);
  // DR-1434: each course says how many of its exams are passed, from the same
  // standing the "Courses fully completed" figure counts, so the two can never
  // disagree on one screen.
  const myRecords = rows.map(rowToRecord).filter((r) => r.userId === learner.userId);
  const standingOf = new Map(courseLessonIds ? courseStanding(myRecords, courseLessonIds).courses.map((c) => [c.courseKey, c]) : []);
  return (
    <li className="border border-[#E8E4DC] p-3">
      {/* THE RECORD IS IN THE READER'S NAME (DR-1421): the name first and largest, who they are beneath it, and the sign-in
          address kept as one of those lines, never as the heading. */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3" data-testid="learner-head">
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">{showWho ? 'The record of' : 'Your record'}</div>
          <h3 className="text-2xl leading-tight text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }} data-testid="learner-name">
            {showWho ? who.name : mine && !who.named ? 'You' : who.name}
          </h3>
          {who.points.length > 0 && (
            <ul className="mt-1 text-[0.75rem] text-[#5A5751] space-y-0.5" data-testid="learner-points">
              {who.points.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
              {learner.lastActivityAt ? <li>Last active {when(learner.lastActivityAt)}</li> : null}
            </ul>
          )}
        </div>
        <BandChip band={learner.competency} />
      </div>

      <div className="grid gap-2" style={FIGURE_GRID} data-testid="record-figures">
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
      <TakenAndGraded rows={rows} userId={learner.userId} courseLessonIds={courseLessonIds} />
      <StandingAndPace rows={rows} userId={learner.userId} courseLessonIds={courseLessonIds} />

      {learner.courses?.length ? (
        <>
          {/* COURSE BY COURSE, STACKED (DR-1393). Darrell's Big Print screenshot, 2026-11-10: the five-column table ran off the
              right edge ("cutting off fields"). Each course is now its own block: the name on one line, then every figure as a
              labelled pair that wraps, so nothing is ever cut at any text size. And each course names the lessons not yet on the
              record, so a completion short of the whole says exactly which lessons it is waiting for. */}
          <ul className="mt-3 divide-y divide-[#E8E4DC] border-t border-[#E8E4DC]" data-testid="learner-courses" aria-label="Course by course, for this learner">
            {learner.courses.map((c) => (
              <li key={c.courseKey} className="py-2 min-w-0" data-testid="learner-course" data-course-key={c.courseKey}>
                <div className="text-sm text-[#1A1815] [overflow-wrap:anywhere]" style={{ fontFamily: '"Fraunces", serif' }}>
                  {c.courseKey === 'unplaced' ? 'Not placed in a course' : c.courseKey}
                </div>
                <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-0.5">
                  <CoursePair label="Read" value={`${c.lessonsRead}${c.courseLessons ? ` of ${c.courseLessons}` : ''}`} />
                  <CoursePair label="Completion" value={pct(c.completionPct)} />
                  {standingOf.get(c.courseKey) && (
                    <CoursePair label="Exams passed" value={`${standingOf.get(c.courseKey).done} of ${standingOf.get(c.courseKey).total}`} />
                  )}
                  <CoursePair label="Average" value={c.examsTaken ? pct(c.avgQuizPct) : '—'} />
                  <CoursePair label="Last read" value={when(c.lastActivityAt)} />
                </dl>
                <NotYetRead
                  ids={courseLessonIds && courseLessonIds[c.courseKey]}
                  readIds={readIdsFor(rows, learner.userId, c.courseKey)}
                  courseKey={c.courseKey}
                  titleOf={titleOf}
                  onReadAgain={mine ? onReadAgain : null}
                />
                <ExamsOwed
                  owed={examsOwed(myRecords, c.courseKey, courseLessonIds && courseLessonIds[c.courseKey])}
                  courseKey={c.courseKey}
                  titleOf={titleOf}
                  onRetake={mine ? onRetake : null}
                />
              </li>
            ))}
          </ul>
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
  courseLessonIds = null, // { [courseKey]: [lessonId, ...] } in course order (DR-1393)
  signedIn = true,
  titleOf = null,        // (lessonId, courseKey) => title, from the mounted catalog
  onRetake = null,       // (courseKey, lessonId) => opens the lesson at its exam
  onReadAgain = null,    // (courseKey, lessonId) => opens the reading from the top
}) {
  const nameOf = typeof titleOf === 'function' ? titleOf : () => null;
  const [whoId, setWhoId] = useState(null);
  // The viewer's own contacts put a name to a number or address (DR-0825, DR-1421); with none, nothing changes.
  const [contacts, setContacts] = useState(() => emptyIndex());
  // The household's own roster names its members and says who they are in it (DR-1421). Owner and admin only, by its wall.
  const [household, setHousehold] = useState(() => emptyHousehold());
  useEffect(() => {
    let live = true;
    if (!signedIn) return undefined;
    Promise.resolve(loadLearnerHousehold()).then((h) => { if (live && h) setHousehold(h); }).catch(() => {});
    if (isGovernor) Promise.resolve(loadContactIndex()).then((idx) => { if (live && idx) setContacts(idx); }).catch(() => {});
    return () => { live = false; };
  }, [signedIn, isGovernor]);
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
  // You first, then everyone else by their latest activity.
  const ordered = [...(mine ? [mine] : []), ...[...others].sort((a, b) => String(b.lastActivityAt || '').localeCompare(String(a.lastActivityAt || '')))];
  const chosen = ordered.find((l) => l.userId === whoId) || ordered[0] || null;
  // A learner sees only their own record; the Governor sees the one chosen.
  const shown = isGovernor ? chosen : mine;

  if (!learners.length) {
    return (
      <div>
        <RecordFreshness />
        <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        No lessons read yet, so there is nothing to measure. Mark a lesson read, or answer its exam, and the record starts here — on this device and every other one you sign in on.
      </p>
      </div>
    );
  }

  return (
    <div>
      {/* THE LATEST NUMBERS, EVERY TIME (DR-1418): read again as this opens, and say when it was read. */}
      <RecordFreshness />
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        {isGovernor
          ? 'Every learner’s own record, as the lessons were actually read and answered. You can see it; you cannot change it.'
          : 'What you have read and answered, kept with your account.'}
      </p>

      {isGovernor && learners.length > 1 && (
        <div className="grid gap-2 mb-4" style={FIGURE_GRID} data-testid="record-figures">
          <Figure label="Learners" value={totals.learners} />
          <Figure label="Lessons read" value={totals.lessonsRead} />
          <Figure label="Exams passed" value={`${totals.examsPassed} of ${totals.examsTaken}`} />
          <Figure label="Class average" value={totals.examsTaken ? pct(totals.avgQuizPct) : 'Not yet tested'} />
        </div>
      )}

      {/* WHOSE RECORD, ONE TAP (DR-1393; Darrell 2026-11-10: "each user needs to have a drop-down for choosing them... so I can
          see my recent records or my son's without needing to scroll"). The Governor picks a learner and sees that record alone. */}
      {showWho && (
        <div className="mb-3">
          <label htmlFor="learner-pick" className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Whose record</label>
          <select
            id="learner-pick"
            data-testid="learner-pick"
            value={chosen ? chosen.userId : ''}
            onChange={(e) => setWhoId(e.target.value)}
            className="w-full min-h-[44px] px-2 py-2 bg-white border border-[#E8E4DC] text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            style={{ fontFamily: '"Fraunces", serif' }}
          >
            {ordered.map((l) => (
              <option key={l.userId} value={l.userId}>
                {l.userId === currentUserId ? 'You' : learnerIdentity(l, { contacts, household }).name}{l.lastActivityAt ? ` · last ${when(l.lastActivityAt)}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <ul className="space-y-3">
        {shown ? (
          <LearnerCard key={shown.userId} contacts={contacts} household={household} learner={shown} mine={shown.userId === currentUserId} showWho={showWho || shown.userId !== currentUserId} rows={rows} titleOf={nameOf} onRetake={shown.userId === currentUserId ? onRetake : null} onReadAgain={shown.userId === currentUserId ? onReadAgain : null} courseLessonIds={courseLessonIds} />
        ) : null}
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
