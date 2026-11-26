// =============================================================================
// InstituteRecord — "Your Record": the student's work, acknowledged by name
// =============================================================================
// Darrell 2026-11-26: students "want to see their competency increase" and have
// their accomplishments acknowledged. "Give credit where it's due." Every line
// here is the student's own row (lib/institute-record.js); nothing is painted.
// Not signed in → it says so. No exam yet → it says so and invites the first.
// Fewer than four dated exams → no trend is drawn, and it says when one appears.
import React from 'react';
import { lessonUrl } from '../../lib/lesson-links.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#CFA63C]';
const day = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null;
};
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export default function InstituteRecord({ record = null, signedIn = false, certificates = 0, onOpenRecord = null, onOpenCertificates = null }) {
  const r = record;
  const tested = !!(r && r.examsTaken > 0);
  return (
    <section className="is-rec" aria-labelledby="is-rec-h" data-testid="institute-record">
      <div className="is-head">
        <h3 id="is-rec-h" className="is-h">
          Your Record
        </h3>
        {signedIn && onOpenRecord && (
          <button type="button" className={`is-rec-link ${FOCUS}`} onClick={onOpenRecord} data-testid="institute-record-open">
            Open my full record ›
          </button>
        )}
      </div>
      {!signedIn || !r ? (
        <p className="is-none" data-testid="institute-record-signin">
          Sign in to see your record: the lessons you finished, the exams you passed and your standing.
        </p>
      ) : (
        <div className="is-card is-rec-card">
          <div className="is-rec-top">
            <div className="is-rec-band" data-testid="institute-record-band">
              <small>Your standing</small>
              <b>{r.band.label}</b>
              <span>{tested ? `Average ${r.average}% across ${plural(r.examsTaken, 'exam', 'exams')}` : 'Your first exam sets it'}</span>
            </div>
            <dl className="is-rec-nums">
              <div>
                <dt>Lessons finished</dt>
                <dd data-testid="institute-record-finished">{r.lessonsFinished}</dd>
              </div>
              <div>
                <dt>Exams passed</dt>
                <dd data-testid="institute-record-passed">{r.examsPassed}</dd>
              </div>
              <div>
                <dt>Certificates</dt>
                <dd>
                  {onOpenCertificates ? (
                    <button
                      type="button"
                      className={`is-rec-cert ${FOCUS}`}
                      onClick={onOpenCertificates}
                      aria-label={`${plural(certificates, 'certificate', 'certificates')}: open certificates`}
                    >
                      {certificates}
                    </button>
                  ) : (
                    certificates
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <p className="is-rec-growth" data-testid="institute-record-growth">
            {r.growth
              ? r.growth.change > 0
                ? `Growing: your newer exams average ${r.growth.recent}%, up ${r.growth.change} points from ${r.growth.earlier}% on your earlier ones.`
                : r.growth.change === 0
                  ? `Holding steady: ${r.growth.recent}% on your newer exams and on your earlier ones.`
                  : `Your newer exams average ${r.growth.recent}%; your earlier ones averaged ${r.growth.earlier}%. Any exam can be taken again.`
              : `Your growth line appears after four exams. You have taken ${r.examsTaken}.`}{' '}
            In the last 30 days: {plural(r.last30.finished, 'lesson', 'lessons')} finished, {plural(r.last30.passed, 'exam', 'exams')} passed.
          </p>

          {r.earned.length > 0 ? (
            <>
              <h4 className="is-rec-sub">Earned</h4>
              <ul className="is-rec-list" data-testid="institute-record-earned">
                {r.earned.map((e) => (
                  <li key={e.lessonId}>
                    <a className={FOCUS} href={lessonUrl({ courseKey: e.courseKey, lessonId: e.lessonId, course: e.courseRef })}>
                      <span className="is-rec-tick" aria-hidden="true">
                        ✓
                      </span>
                      <span className="is-rec-what">
                        <b>{e.title}</b>
                        <small>
                          {e.course}
                          {day(e.at) ? ` · ${day(e.at)}` : ''}
                        </small>
                      </span>
                      <span className="is-rec-pct">{e.pct}%</span>
                    </a>
                  </li>
                ))}
              </ul>
              {r.earnedMore > 0 && <p className="is-none">And {plural(r.earnedMore, 'more passed exam', 'more passed exams')} on your full record.</p>}
            </>
          ) : (
            <p className="is-none" data-testid="institute-record-none">
              No exam passed yet. Open a lesson, go to Study, and answer Check Your Understanding: it is saved here with your name on it.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
