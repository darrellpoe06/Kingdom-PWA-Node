// =============================================================================
// ChurchInstitute — the TLC Theological Institute landing (churchView 'institute')
// =============================================================================
// Slice A (DR-1455): the public surface. Slice B (DR-1460, migration 0325):
// the roll, attendance and credentials, read and written through
// lib/church-institute-sync.js, every wall standing in the database.
//
// WHAT IS TRUE ON THIS SCREEN (DR-0076 §1; the brief's rules 6 and 7):
//   • "Available today" lists ONLY courses registered in LEARN_CATALOG; each
//     opens in Learn through the same link a shared lesson uses (DR-1428).
//   • A program with no registered course reads Planned, with its planned
//     course names shown as a plan, never as an offer.
//   • Enrollment opens ONLY when the office's institute_settings row reads
//     confirmed + open (launchState); the Apply button then writes the
//     applicant's own row, and the database policy refuses it otherwise.
//   • A student sees their own applications, attendance count against the
//     floor, the courses still to pass, and their own certificate. Nothing of
//     anyone else's (USER-ACCOUNTS-AND-HISTORIES-STANDARD; RLS is the gate).
//   • The office (owner/admin) keeps the settings, the roll, attendance and
//     issues a certificate ONLY through the server RPC that re-runs the
//     completion standard; a verify code goes to anyone, minimal fields out.
//   • No accreditation, authorization or degree is claimed anywhere; the
//     credential note is the one sentence INSTITUTE_META carries.
// Patterns kept: SectionTabs (sliding tabs, not a long scroll); rem text so
// large print scales it (UX-PATTERNS 2b); 36px+ targets with a focus ring
// (2g); in-place opens, no scroll flight (2e); a surface never goes blank, it
// says what it sees and what is missing (P15).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SectionTabs from './SectionTabs.jsx';
import {
  INSTITUTE_META,
  PROGRAMS,
  programCourses,
  programStatus,
  availableCourses,
  launchState,
  enrollmentCopy,
  ENROLLMENT_STEPS,
} from '../lib/church-institute.js';
import * as defaultSync from '../lib/church-institute-sync.js';
import { lessonUrl } from '../lib/lesson-links.js';
import { resolveChurch } from '../lib/resolve-church.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const STATUS_WORD = Object.freeze({ applied: 'Applied', accepted: 'Accepted', withdrawn: 'Withdrawn', completed: 'Completed' });
const dateWord = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

function Status({ kind }) {
  const cls = kind === 'available' ? 'lc-status lc-status-ok' : 'lc-status lc-status-plan';
  return (
    <span className={cls} data-testid={`institute-status-${kind}`}>
      {kind === 'available' ? 'Courses available today' : 'Planned · curriculum in preparation'}
    </span>
  );
}

function Said({ answer, testid }) {
  const s = defaultSync.instituteSentence(answer);
  if (!s) return null;
  return (
    <p className="lc-notice" role="status" data-testid={testid}>
      {s}
    </p>
  );
}

/** The student's own applications: apply, see the status, withdraw while still applied. */
function ApplyPanel({ programs, state, mine, busy, onApply, onWithdraw, signedIn }) {
  if (state !== 'open') return null;
  const byKey = new Map(mine.map((e) => [e.program_key, e]));
  if (!signedIn) {
    return (
      <p className="lc-notice" data-testid="institute-apply-signed-out">
        Sign in to apply; your application is kept on your own account.
      </p>
    );
  }
  return (
    <ul className="lc-stack mt-3" aria-label="Apply to a program" data-testid="institute-apply">
      {programs
        .filter((p) => p.status === 'available')
        .map((p) => {
          const e = byKey.get(p.key);
          const word = e ? STATUS_WORD[e.status] || e.status : '';
          return (
            <li key={p.key} className="lc-course" data-testid={`institute-apply-${p.key}`}>
              <span className="min-w-0 flex-1">
                <b className="lc-prog-t">{p.title}</b>
                {e && (
                  <small className="lc-small block" data-testid={`institute-mine-${p.key}`}>
                    {word}
                    {e.cohort_start ? ` · cohort begins ${dateWord(e.cohort_start)}` : ''} · applied {dateWord(e.applied_at)}
                  </small>
                )}
              </span>
              {!e || e.status === 'withdrawn' ? (
                <button type="button" disabled={busy} onClick={() => onApply(p)} className={`lc-btn lc-btn-gold ${FOCUS}`}>
                  Apply
                </button>
              ) : e.status === 'applied' ? (
                <button type="button" disabled={busy} onClick={() => onWithdraw(e)} className={`lc-btn lc-btn-ghost ${FOCUS}`}>
                  Withdraw
                </button>
              ) : null}
            </li>
          );
        })}
    </ul>
  );
}

/** The student's standing against the completion standard, one row per application. */
function MyStanding({ mine, standing }) {
  const live = mine.filter((e) => e.status !== 'withdrawn');
  if (live.length === 0) {
    return (
      <p className="lc-small" data-testid="institute-standing-none">
        No application on your account yet.
      </p>
    );
  }
  return (
    <ul className="lc-stack" aria-label="My standing" data-testid="institute-standing">
      {live.map((e) => {
        const c = standing[e.id];
        return (
          <li key={e.id} className="lc-card" data-testid={`institute-standing-${e.program_key}`}>
            <b className="lc-prog-t">{e.program_title}</b>
            <p className="lc-small">
              {STATUS_WORD[e.status] || e.status}
              {e.cohort_start ? ` · cohort begins ${dateWord(e.cohort_start)}` : ' · no cohort date set yet'}
            </p>
            {c ? (
              <p className="lc-small" data-testid={`institute-standing-detail-${e.program_key}`}>
                Sessions present: {c.present} of {c.floor} required
                {Array.isArray(c.coursesMissing) && c.coursesMissing.length > 0
                  ? ` · courses still to pass: ${c.coursesMissing.join(', ')}`
                  : ' · every course passed'}
                {c.complete ? ' · the standard is met' : ''}
              </p>
            ) : (
              <p className="lc-small">Standing not read yet.</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Anyone checks a certificate by its code; the server returns the minimal fields or nothing. */
export function VerifyForm({ verify = defaultSync.verifyCredential }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (ev) => {
    ev.preventDefault();
    setBusy(true);
    const a = await verify(code);
    setResult(a);
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="lc-card mt-3" aria-labelledby="inst-verify-h" data-testid="institute-verify">
      <h4 id="inst-verify-h" className="lc-h3">
        Verify a certificate
      </h4>
      <label className="lc-field">
        <span className="lc-small">Verify code (printed on the certificate)</span>
        <input
          className="lc-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          spellCheck="false"
          data-testid="institute-verify-code"
        />
      </label>
      <button type="submit" disabled={busy || !code.trim()} className={`lc-btn lc-btn-ghost ${FOCUS}`}>
        Check
      </button>
      {result && result.ok && result.found && (
        <p className="lc-status lc-status-ok mt-2 inline-block" data-testid="institute-verify-found">
          {result.found.holderName} · {result.found.programTitle} · No. {result.found.credentialNo} · issued {dateWord(result.found.issuedAt)}
        </p>
      )}
      {result && result.ok && !result.found && (
        <p className="lc-status lc-status-plan mt-2 inline-block" data-testid="institute-verify-none">
          No certificate carries that code.
        </p>
      )}
      {result && !result.ok && <Said answer={result} testid="institute-verify-said" />}
    </form>
  );
}

/** The office's desk: settings, the roll, attendance and issuing. Mounted only for owner/admin. */
function OfficePanel({ instanceId, settings, roll, sync, reload }) {
  const [form, setForm] = useState(() => ({
    exemption_status: (settings && settings.exemption_status) || 'not-filed',
    filing_reference: (settings && settings.filing_reference) || '',
    filed_at: (settings && settings.filed_at) || '',
    enrollment_open: !!(settings && settings.enrollment_open),
    attendance_floor: settings && Number.isFinite(settings.attendance_floor) ? settings.attendance_floor : 0,
  }));
  useEffect(() => {
    if (!settings) return;
    setForm({
      exemption_status: settings.exemption_status || 'not-filed',
      filing_reference: settings.filing_reference || '',
      filed_at: settings.filed_at || '',
      enrollment_open: !!settings.enrollment_open,
      attendance_floor: Number.isFinite(settings.attendance_floor) ? settings.attendance_floor : 0,
    });
  }, [settings]);
  const [said, setSaid] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dates, setDates] = useState({});
  const [names, setNames] = useState({});
  const [standing, setStanding] = useState({});
  const run = async (fn) => {
    setBusy(true);
    const a = await fn();
    setSaid(a && a.ok ? null : a);
    setBusy(false);
    if (a && a.ok) reload();
    return a;
  };
  const save = (ev) => {
    ev.preventDefault();
    run(() =>
      sync.saveInstituteSettings(instanceId, {
        exemption_status: form.exemption_status,
        filing_reference: form.filing_reference || null,
        filed_at: form.filed_at || null,
        enrollment_open: form.enrollment_open,
        attendance_floor: Math.max(0, Number(form.attendance_floor) || 0),
      })
    );
  };
  const readStanding = async (e) => {
    const a = await sync.readCompletion(e.id);
    if (a.ok) setStanding((s) => ({ ...s, [e.id]: a.completion }));
    else setSaid(a);
  };
  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value }));
  return (
    <div className="lc-stack" data-testid="institute-office">
      <form onSubmit={save} className="lc-card" aria-labelledby="inst-office-h">
        <h3 id="inst-office-h" className="lc-h3">
          The office's settings
        </h3>
        <p className="lc-small">
          Enrollment opens only when the exemption reads confirmed and the switch is on; the database refuses an application otherwise.
        </p>
        <label className="lc-field">
          <span className="lc-small">Religious exemption filing</span>
          <select className="lc-input" value={form.exemption_status} onChange={set('exemption_status')} data-testid="institute-office-exemption">
            <option value="not-filed">Not filed</option>
            <option value="filed">Filed, awaiting confirmation</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </label>
        <label className="lc-field">
          <span className="lc-small">Filing reference</span>
          <input className="lc-input" value={form.filing_reference} onChange={set('filing_reference')} />
        </label>
        <label className="lc-field">
          <span className="lc-small">Filed on</span>
          <input className="lc-input" type="date" value={form.filed_at} onChange={set('filed_at')} />
        </label>
        <label className="lc-field">
          <span className="lc-small">Sessions a student must attend</span>
          <input className="lc-input" type="number" min="0" value={form.attendance_floor} onChange={set('attendance_floor')} />
        </label>
        <label className="lc-field lc-field-row">
          <input type="checkbox" checked={form.enrollment_open} onChange={set('enrollment_open')} data-testid="institute-office-open" />
          <span className="lc-small">Enrollment is open</span>
        </label>
        <button type="submit" disabled={busy} className={`lc-btn lc-btn-gold ${FOCUS}`}>
          Save settings
        </button>
      </form>
      <section aria-labelledby="inst-roll-h" className="lc-card">
        <h3 id="inst-roll-h" className="lc-h3">
          The roll
        </h3>
        {roll.length === 0 ? (
          <p className="lc-small" data-testid="institute-roll-empty">
            No applications yet.
          </p>
        ) : (
          <ul className="lc-stack" data-testid="institute-roll">
            {roll.map((e) => {
              const c = standing[e.id];
              return (
                <li key={e.id} className="lc-roll-row" data-testid={`institute-roll-${e.id}`}>
                  <b className="lc-prog-t">{e.program_title}</b>
                  <p className="lc-small">
                    {STATUS_WORD[e.status] || e.status} · applied {dateWord(e.applied_at)} · student {String(e.user_id || '').slice(0, 8)}
                    {e.cohort_start ? ` · cohort ${dateWord(e.cohort_start)}` : ''}
                  </p>
                  {e.note && <p className="lc-small">Note: {e.note}</p>}
                  <div className="lc-inst-btns">
                    {e.status === 'applied' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(() => sync.setEnrollmentStatus(e.id, { status: 'accepted' }))}
                        className={`lc-btn lc-btn-gold ${FOCUS}`}
                      >
                        Accept
                      </button>
                    )}
                    {(e.status === 'applied' || e.status === 'accepted') && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(() => sync.setEnrollmentStatus(e.id, { status: 'withdrawn' }))}
                        className={`lc-btn lc-btn-ghost ${FOCUS}`}
                      >
                        Withdraw
                      </button>
                    )}
                    <button type="button" disabled={busy} onClick={() => readStanding(e)} className={`lc-btn lc-btn-ghost ${FOCUS}`}>
                      Read standing
                    </button>
                  </div>
                  {c && (
                    <p className="lc-small" data-testid={`institute-roll-standing-${e.id}`}>
                      Present {c.present} of {c.floor}
                      {Array.isArray(c.coursesMissing) && c.coursesMissing.length > 0
                        ? ` · still to pass: ${c.coursesMissing.join(', ')}`
                        : ' · every course passed'}
                      {c.complete ? ' · standard met' : ' · standard not yet met'}
                    </p>
                  )}
                  {e.status === 'accepted' && (
                    <div className="lc-field-row">
                      <input
                        className="lc-input"
                        type="date"
                        aria-label="Session date"
                        value={dates[e.id] || ''}
                        onChange={(ev) => setDates((d) => ({ ...d, [e.id]: ev.target.value }))}
                      />
                      <button
                        type="button"
                        disabled={busy || !dates[e.id]}
                        onClick={() => run(() => sync.markAttendance(instanceId, e.id, dates[e.id], true))}
                        className={`lc-btn lc-btn-ghost ${FOCUS}`}
                      >
                        Mark present
                      </button>
                    </div>
                  )}
                  {e.status === 'accepted' && (
                    <div className="lc-field-row">
                      <input
                        className="lc-input"
                        aria-label="Name on the certificate"
                        placeholder="Name on the certificate"
                        value={names[e.id] || ''}
                        onChange={(ev) => setNames((n) => ({ ...n, [e.id]: ev.target.value }))}
                      />
                      <button
                        type="button"
                        disabled={busy || !(names[e.id] || '').trim()}
                        onClick={() => run(() => sync.issueCredential(e.id, names[e.id]))}
                        className={`lc-btn lc-btn-gold ${FOCUS}`}
                      >
                        Issue certificate
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <Said answer={said} testid="institute-office-said" />
    </div>
  );
}

export default function ChurchInstitute({
  church = null,
  settings = null,
  setChurchView = null,
  initialSection = 'about',
  instanceId = null,
  myUserId = null,
  isOffice = false,
  sync = defaultSync,
}) {
  const c = resolveChurch(church);
  const programs = useMemo(() => PROGRAMS.map((p) => ({ ...p, status: programStatus(p), courses: programCourses(p) })), []);
  const open = useMemo(() => availableCourses(), []);
  const [live, setLive] = useState(null);
  const [mine, setMine] = useState([]);
  const [standing, setStanding] = useState({});
  const [creds, setCreds] = useState([]);
  const [roll, setRoll] = useState([]);
  const [said, setSaid] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const effective = live || settings;
  const state = launchState(effective);
  const [active, setActive] = useState(initialSection);
  const goLearn = () => {
    if (setChurchView) setChurchView('learn');
  };

  useEffect(() => {
    if (!instanceId) return undefined;
    let on = true;
    (async () => {
      const s = await sync.readInstituteSettings(instanceId);
      if (!on) return;
      if (s.ok) setLive(s.settings);
      else setSaid(s);
      if (myUserId) {
        const m = await sync.readMyEnrollments(instanceId, myUserId);
        if (!on) return;
        if (m.ok) {
          setMine(m.enrollments);
          const next = {};
          for (const e of m.enrollments.filter((x) => x.status !== 'withdrawn')) {
            const r = await sync.readCompletion(e.id);
            if (r.ok) next[e.id] = r.completion;
          }
          if (on) setStanding(next);
        } else setSaid(m);
        const k = await sync.readMyCredentials(instanceId);
        if (on && k.ok) setCreds(k.credentials);
      }
      if (isOffice) {
        const r = await sync.readInstituteRoll(instanceId);
        if (on && r.ok) setRoll(r.roll);
      }
    })();
    return () => {
      on = false;
    };
  }, [instanceId, myUserId, isOffice, sync, tick]);

  const apply = async (p) => {
    setBusy(true);
    const a = await sync.applyToProgram(instanceId, { programKey: p.key, programTitle: p.title, courseKeys: p.courseKeys || [] });
    setSaid(a.ok ? null : a);
    setBusy(false);
    if (a.ok) reload();
  };
  const withdraw = async (e) => {
    setBusy(true);
    const a = await sync.withdrawMyEnrollment(e.id);
    setSaid(a.ok ? null : a);
    setBusy(false);
    if (a.ok) reload();
  };

  const sections = [
    {
      id: 'about',
      label: 'About',
      icon: 'landmark',
      render: () => (
        <div className="lc-stack">
          <section aria-labelledby="inst-about-h" className="lc-card">
            <h3 id="inst-about-h" className="lc-h3">
              About the Institute
            </h3>
            <p className="lc-p">{INSTITUTE_META.about}</p>
          </section>
          <section aria-labelledby="inst-programs-h">
            <h3 id="inst-programs-h" className="lc-h3 mb-2">
              Programs
            </h3>
            <div className="lc-stack">
              {programs.map((p) => (
                <article key={p.key} className="lc-prog" data-testid={`institute-program-${p.key}`}>
                  <b className="lc-prog-t">{p.title}</b>
                  <p className="lc-p">{p.blurb}</p>
                  <Status kind={p.status} />
                  {p.planned && p.planned.length > 0 && <p className="lc-small">Planned courses: {p.planned.join(' · ')}</p>}
                </article>
              ))}
            </div>
          </section>
        </div>
      ),
    },
    {
      id: 'courses',
      label: 'Courses',
      icon: 'bookOpen',
      render: () => (
        <div className="lc-stack">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h3 className="lc-h3">Courses you can open now</h3>
            <button type="button" onClick={goLearn} className={`lc-link min-h-[36px] ${FOCUS}`}>
              In Learn →
            </button>
          </div>
          <ol className="lc-stack" aria-label="Available courses">
            {open.map(({ course, program }, i) => {
              const title = (course.meta && course.meta.title) || course.key;
              const href = lessonUrl({ courseKey: course.key, course });
              return (
                <li key={course.key} className="lc-course" data-testid={`institute-course-${course.key}`}>
                  <span className="lc-course-n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <a href={href} className={`lc-course-t ${FOCUS}`}>
                      {title}
                    </a>
                    <small className="lc-small block">
                      {program.title}
                      {course.meta && course.meta.category ? ` · ${course.meta.category}` : ''}
                    </small>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="lc-notice">
            These courses already exist in the app's Learn tab with lessons, quizzes and read-aloud. The Institute's own survey and doctrine courses are planned
            and are not listed as available.
          </p>
        </div>
      ),
    },
    {
      id: 'enrollment',
      label: 'Enrollment',
      icon: 'pencil',
      render: () => (
        <section aria-labelledby="inst-enroll-h" className="lc-card">
          <h3 id="inst-enroll-h" className="lc-h3">
            How enrollment works
          </h3>
          <ol className="lc-steps">
            {ENROLLMENT_STEPS.map((s, i) => (
              <li key={s}>
                <i aria-hidden="true">{i + 1}</i>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <p className={`lc-status ${state === 'open' ? 'lc-status-ok' : 'lc-status-plan'} mt-3 inline-block`} data-testid={`institute-enrollment-${state}`}>
            {enrollmentCopy(state)}
          </p>
          <ApplyPanel programs={programs} state={state} mine={mine} busy={busy} onApply={apply} onWithdraw={withdraw} signedIn={!!myUserId} />
          <Said answer={said} testid="institute-said" />
        </section>
      ),
    },
    {
      id: 'students',
      label: 'Students',
      icon: 'users',
      render: () => (
        <div className="lc-stack">
          <section aria-labelledby="inst-standing-h" className="lc-card">
            <h3 id="inst-standing-h" className="lc-h3">
              My standing
            </h3>
            {myUserId ? (
              <MyStanding mine={mine} standing={standing} />
            ) : (
              <p className="lc-small" data-testid="institute-standing-signed-out">
                Sign in to see your applications, attendance and courses.
              </p>
            )}
          </section>
          <div className="lc-tiles">
            <button type="button" onClick={goLearn} className={`lc-tile ${FOCUS}`}>
              <b>My dashboard</b>
              <small>Your lesson progress and quiz grades, saved to your account in Learn</small>
            </button>
            <button type="button" onClick={goLearn} className={`lc-tile ${FOCUS}`}>
              <b>Course materials</b>
              <small>Lessons, print and download, read aloud</small>
            </button>
            <div className="lc-tile">
              <b>Instructors</b>
              <small>
                {c.pastor || 'The pastor'} and the teaching staff of {c.name}
              </small>
            </div>
            <div className="lc-tile">
              <b>Schedule</b>
              <small>Cohort dates are set by the office on each accepted application and shown on your standing above</small>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: 'sparkle',
      render: () => (
        <div className="lc-stack">
          <section aria-labelledby="inst-cert-h" className="lc-cert">
            <div className="lc-cert-rule" aria-hidden="true" />
            <h3 id="inst-cert-h" className="lc-h3">
              Religious Certificate of Completion
            </h3>
            <p className="lc-small">
              Issued by the church office when a program's completion standard is met: every course passed and the sessions attended. Each carries a certificate
              number and a verify code.
            </p>
            <div className="lc-cert-rule" aria-hidden="true" />
            <span className={`lc-status ${state === 'open' ? 'lc-status-ok' : 'lc-status-plan'}`} data-testid={`institute-cert-state-${state}`}>
              {state === 'open' ? 'Issued by the office on completion' : 'Planned'}
            </span>
            <p className="lc-small mt-2" data-testid="institute-credential-note">
              {INSTITUTE_META.credentialNote}
            </p>
          </section>
          {myUserId && creds.length > 0 && (
            <ul className="lc-stack" aria-label="My certificates" data-testid="institute-my-credentials">
              {creds.map((k) => (
                <li key={k.id} className="lc-card">
                  <b className="lc-prog-t">{k.program_title}</b>
                  <p className="lc-small">
                    {k.holder_name} · No. {k.credential_no} · issued {dateWord(k.issued_at)}
                  </p>
                  <p className="lc-small">Verify code: {k.verify_code}</p>
                </li>
              ))}
            </ul>
          )}
          <VerifyForm verify={sync.verifyCredential} />
        </div>
      ),
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: 'bell',
      render: () => (
        <p className="lc-empty" data-testid="institute-announcements-empty">
          No Institute announcements have been posted yet. When the office posts one, it appears here and on the homepage.
        </p>
      ),
    },
  ];
  if (isOffice && instanceId) {
    sections.push({
      id: 'office',
      label: 'Office',
      icon: 'shield',
      render: () => <OfficePanel instanceId={instanceId} settings={effective} roll={roll} sync={sync} reload={reload} />,
    });
  }

  return (
    <div className="lc-home" data-testid="church-institute">
      <section className="lc-band lc-band-institute" aria-labelledby="inst-h">
        <div className="lc-eyebrow lc-eyebrow-gold">{INSTITUTE_META.of}</div>
        <h2 id="inst-h" className="lc-h1 ts-chrome-region">
          {INSTITUTE_META.name}
        </h2>
        <p className="lc-tagline">{INSTITUTE_META.tagline}</p>
        <p className="lc-band-p">Study the Word deeply, in the house, with the people who serve it. For adults, young adults, and those called to lead.</p>
        <span className="lc-inst-art" aria-hidden="true">
          <InstituteArt />
        </span>
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
        <path d="M22 96c-10-10-12-28-4-42" />
        <path d="M18 90c-6-2-10-7-11-13" />
        <path d="M19 78c-6-1-10-6-11-12" />
        <path d="M22 66c-5-2-8-7-8-13" />
        <path d="M138 96c10-10 12-28 4-42" />
        <path d="M142 90c6-2 10-7 11-13" />
        <path d="M141 78c6-1 10-6 11-12" />
        <path d="M138 66c5-2 8-7 8-13" />
      </g>
      <path className="lc-page" d="M34 92c14-8 30-8 46-2 16-6 32-6 46 2V46c-14-8-30-8-46-2-16-6-32-6-46 2z" />
      <path className="lc-spine" d="M80 44v46" />
      <g className="lc-lines" strokeLinecap="round" strokeWidth="2">
        <path d="M42 56h28M42 64h28M42 72h22M90 56h28M90 64h28M90 72h22" />
      </g>
      <path className="lc-ribbon" d="M80 44l6 10-6 8-6-8z" />
      <path className="lc-cap" d="M80 8L44 24l36 16 36-16z" />
      <path className="lc-capband" d="M58 30v12c0 6 44 6 44 0V30" />
      <path className="lc-tassel" d="M116 24v18" strokeWidth="2" strokeLinecap="round" />
      <circle className="lc-tassel-end" cx="116" cy="44" r="3" />
    </svg>
  );
}
