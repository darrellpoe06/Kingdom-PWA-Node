// =============================================================================
// ChurchInstitute — the TLC Theological Institute landing (churchView 'institute')
// =============================================================================
// Slice A of the Institute (docs/99-session-notes/2026-11-12-the-institute-in-
// the-love-corner-app.md §5): the public surface, no schema, no money. Opened
// from the homepage's featured card (components/lovecorner/LoveCornerHome.jsx),
// the Church sub-nav, and the phone's More sheet.
//
// WHAT IS TRUE ON THIS SCREEN (DR-0076 §1; the brief's rules 6 and 7):
//   • "Available today" lists ONLY courses registered in LEARN_CATALOG; each
//     opens in Learn through the same link a shared lesson uses (DR-1428).
//   • A program with no registered course reads Planned, with its planned
//     course names shown as a plan, never as an offer.
//   • Enrollment, certificates and announcements render their honest state
//     from lib/church-institute.js (launchState over the office's settings,
//     which Slice B writes; until then: closed, said plainly — P15: a surface
//     never goes blank, it says what it sees and what is missing).
//   • No accreditation, authorization or degree is claimed anywhere; the
//     credential note is the one sentence INSTITUTE_META carries.
// Patterns kept: SectionTabs (sliding tabs, not a long scroll); rem text so
// large print scales it (UX-PATTERNS 2b); 36px+ targets with a focus ring
// (2g); in-place opens, no scroll flight (2e).
import React, { useMemo, useState } from 'react';
import SectionTabs from './SectionTabs.jsx';
import { INSTITUTE_META, PROGRAMS, programCourses, programStatus, availableCourses, launchState, enrollmentCopy, ENROLLMENT_STEPS } from '../lib/church-institute.js';
import { lessonUrl } from '../lib/lesson-links.js';
import { resolveChurch } from '../lib/resolve-church.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

function Status({ kind }) {
  const cls = kind === 'available' ? 'lc-status lc-status-ok' : 'lc-status lc-status-plan';
  return <span className={cls} data-testid={`institute-status-${kind}`}>{kind === 'available' ? 'Courses available today' : 'Planned · curriculum in preparation'}</span>;
}

export default function ChurchInstitute({ church = null, settings = null, setChurchView = null, initialSection = 'about' }) {
  const c = resolveChurch(church);
  const programs = useMemo(() => PROGRAMS.map((p) => ({ ...p, status: programStatus(p), courses: programCourses(p) })), []);
  const open = useMemo(() => availableCourses(), []);
  const state = launchState(settings);
  const [active, setActive] = useState(initialSection);
  const goLearn = () => { if (setChurchView) setChurchView('learn'); };

  const sections = [
    {
      id: 'about', label: 'About', icon: 'landmark',
      render: () => (
        <div className="lc-stack">
          <section aria-labelledby="inst-about-h" className="lc-card">
            <h3 id="inst-about-h" className="lc-h3">About the Institute</h3>
            <p className="lc-p">{INSTITUTE_META.about}</p>
          </section>
          <section aria-labelledby="inst-programs-h">
            <h3 id="inst-programs-h" className="lc-h3 mb-2">Programs</h3>
            <div className="lc-stack">
              {programs.map((p) => (
                <article key={p.key} className="lc-prog" data-testid={`institute-program-${p.key}`}>
                  <b className="lc-prog-t">{p.title}</b>
                  <p className="lc-p">{p.blurb}</p>
                  <Status kind={p.status} />
                  {p.planned && p.planned.length > 0 && (
                    <p className="lc-small">Planned courses: {p.planned.join(' · ')}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      ),
    },
    {
      id: 'courses', label: 'Courses', icon: 'bookOpen',
      render: () => (
        <div className="lc-stack">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h3 className="lc-h3">Courses you can open now</h3>
            <button type="button" onClick={goLearn} className={`lc-link min-h-[36px] ${FOCUS}`}>In Learn →</button>
          </div>
          <ol className="lc-stack" aria-label="Available courses">
            {open.map(({ course, program }, i) => {
              const title = (course.meta && course.meta.title) || course.key;
              const href = lessonUrl({ courseKey: course.key, course });
              return (
                <li key={course.key} className="lc-course" data-testid={`institute-course-${course.key}`}>
                  <span className="lc-course-n" aria-hidden="true">{i + 1}</span>
                  <span className="min-w-0">
                    <a href={href} className={`lc-course-t ${FOCUS}`}>{title}</a>
                    <small className="lc-small block">{program.title}{course.meta && course.meta.category ? ` · ${course.meta.category}` : ''}</small>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="lc-notice">These courses already exist in the app's Learn tab with lessons, quizzes and read-aloud. The Institute's own survey and doctrine courses are planned and are not listed as available.</p>
        </div>
      ),
    },
    {
      id: 'enrollment', label: 'Enrollment', icon: 'pencil',
      render: () => (
        <section aria-labelledby="inst-enroll-h" className="lc-card">
          <h3 id="inst-enroll-h" className="lc-h3">How enrollment will work</h3>
          <ol className="lc-steps">
            {ENROLLMENT_STEPS.map((s, i) => <li key={s}><i aria-hidden="true">{i + 1}</i><span>{s}</span></li>)}
          </ol>
          <p className="lc-status lc-status-plan mt-3 inline-block" data-testid={`institute-enrollment-${state}`}>{enrollmentCopy(state)}</p>
          {state === 'open' && setChurchView && (
            <div className="mt-3"><button type="button" onClick={() => setChurchView('my-record')} className={`lc-btn lc-btn-gold ${FOCUS}`}>Apply from My Record</button></div>
          )}
        </section>
      ),
    },
    {
      id: 'students', label: 'Students', icon: 'users',
      render: () => (
        <div className="lc-tiles">
          <button type="button" onClick={goLearn} className={`lc-tile ${FOCUS}`}><b>My dashboard</b><small>Your lesson progress and quiz grades, saved to your account in Learn</small></button>
          <button type="button" onClick={goLearn} className={`lc-tile ${FOCUS}`}><b>Course materials</b><small>Lessons, print and download, read aloud</small></button>
          <div className="lc-tile"><b>Instructors</b><small>{c.pastor || 'The pastor'} and the teaching staff of {c.name}</small></div>
          <div className="lc-tile"><b>Schedule</b><small>Cohort dates are published by the office with the true weekday shown; none are set yet</small></div>
        </div>
      ),
    },
    {
      id: 'certificates', label: 'Certificates', icon: 'sparkle',
      render: () => (
        <section aria-labelledby="inst-cert-h" className="lc-cert">
          <div className="lc-cert-rule" aria-hidden="true" />
          <h3 id="inst-cert-h" className="lc-h3">Religious Certificate of Completion</h3>
          <p className="lc-small">Issued by the church office when a program's completion standard is met. Each will carry a certificate number and a verify code.</p>
          <div className="lc-cert-rule" aria-hidden="true" />
          <span className="lc-status lc-status-plan">Planned</span>
          <p className="lc-small mt-2" data-testid="institute-credential-note">{INSTITUTE_META.credentialNote}</p>
        </section>
      ),
    },
    {
      id: 'announcements', label: 'Announcements', icon: 'bell',
      render: () => (
        <p className="lc-empty" data-testid="institute-announcements-empty">No Institute announcements have been posted yet. When the office posts one, it appears here and on the homepage.</p>
      ),
    },
  ];

  return (
    <div className="lc-home" data-testid="church-institute">
      <section className="lc-band lc-band-institute" aria-labelledby="inst-h">
        <div className="lc-eyebrow lc-eyebrow-gold">{INSTITUTE_META.of}</div>
        <h2 id="inst-h" className="lc-h1 ts-chrome-region">{INSTITUTE_META.name}</h2>
        <p className="lc-tagline">{INSTITUTE_META.tagline}</p>
        <p className="lc-band-p">Study the Word deeply, in the house, with the people who serve it. For adults, young adults, and those called to lead.</p>
        <span className="lc-inst-art" aria-hidden="true"><InstituteArt /></span>
      </section>
      <SectionTabs sections={sections} ariaLabel="Institute sections" idBase="institute" variant="sub" activeId={active} onActiveChange={setActive} />
    </div>
  );
}

/** The Institute's drawn mark: an open Bible under a cap, in laurel. Drawn, not generated. */
export function InstituteArt({ className = '' }) {
  return (
    <svg viewBox="0 0 160 120" className={`lc-inst-svg ${className}`} aria-hidden="true" focusable="false">
      <g className="lc-laurel" fill="none" strokeWidth="2.2" strokeLinecap="round">
        <path d="M22 96c-10-10-12-28-4-42" /><path d="M18 90c-6-2-10-7-11-13" /><path d="M19 78c-6-1-10-6-11-12" /><path d="M22 66c-5-2-8-7-8-13" />
        <path d="M138 96c10-10 12-28 4-42" /><path d="M142 90c6-2 10-7 11-13" /><path d="M141 78c6-1 10-6 11-12" /><path d="M138 66c5-2 8-7 8-13" />
      </g>
      <path className="lc-page" d="M34 92c14-8 30-8 46-2 16-6 32-6 46 2V46c-14-8-30-8-46-2-16-6-32-6-46 2z" />
      <path className="lc-spine" d="M80 44v46" />
      <g className="lc-lines" strokeLinecap="round" strokeWidth="2"><path d="M42 56h28M42 64h28M42 72h22M90 56h28M90 64h28M90 72h22" /></g>
      <path className="lc-ribbon" d="M80 44l6 10-6 8-6-8z" />
      <path className="lc-cap" d="M80 8L44 24l36 16 36-16z" />
      <path className="lc-capband" d="M58 30v12c0 6 44 6 44 0V30" />
      <path className="lc-tassel" d="M116 24v18" strokeWidth="2" strokeLinecap="round" />
      <circle className="lc-tassel-end" cx="116" cy="44" r="3" />
    </svg>
  );
}
