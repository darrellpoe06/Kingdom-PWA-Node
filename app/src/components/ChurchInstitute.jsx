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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SectionTabs from './SectionTabs.jsx';
import {
  INSTITUTE_META,
  PROGRAMS,
  programCourses,
  programCourseList,
  programStatus,
  availableCourses,
  populationPaths,
  launchState,
  enrollmentCopy,
  ENROLLMENT_STEPS,
} from '../lib/church-institute.js';
import * as defaultSync from '../lib/church-institute-sync.js';
import { lessonUrl } from '../lib/lesson-links.js';
import { resolveChurch } from '../lib/resolve-church.js';
import InstituteStudio from './institute/InstituteStudio.jsx';
import InstituteCourseCards from './institute/InstituteCourseCards.jsx';
import { listPlaces } from '../lib/learn-resume.js';
import { motionBehavior } from '../lib/gentle-motion.js';
import { isInstituteStudioOn, courseCovers } from '../lib/institute-studio.js';

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

/** One course row: its title links into Learn (DR-1428), with its category, whether the certificate requires it, and WHO it is for (the course's own meta.audience). */
function CourseRow({ course, required, testid, n = null, note = null }) {
  const title = (course.meta && course.meta.title) || course.key;
  const href = lessonUrl({ courseKey: course.key, course });
  return (
    <li className="lc-course" data-testid={testid}>
      {n != null && (
        <span className="lc-course-n" aria-hidden="true">
          {n}
        </span>
      )}
      <span className="min-w-0">
        <a href={href} className={`lc-course-t ${FOCUS}`}>
          {title}
        </a>
        <small className="lc-small block">
          {required ? 'Required for the certificate' : 'Open study'}
          {course.meta && course.meta.category ? ` · ${course.meta.category}` : ''}
          {note ? ` · ${note}` : ''}
        </small>
        {course.meta && course.meta.audience && (
          <small className="lc-small block" data-testid={`${testid}-audience`}>
            For {course.meta.audience}
          </small>
        )}
      </span>
    </li>
  );
}

/** The Word by population, young to seniors: each row opens the course it reads, with the measured lesson count. */
function PopulationPaths({ paths, testid = 'institute-by-age' }) {
  return (
    <div className="mt-2" data-testid={testid}>
      <p className="lc-small">
        <b>By age, young to seniors.</b> Each lesson carries its own words for each age.
      </p>
      <ul className="lc-ages mt-1" aria-label="Lessons by age">
        {paths.map((r) => (
          <li key={r.key}>
            <a href={lessonUrl({ courseKey: r.courseKey })} className={`lc-age ${FOCUS}`} data-testid={`institute-age-${r.key}`} data-count={r.count}>
              <b>{r.label}</b>
              <small>ages {r.range}</small>
              <small>{r.count} lessons ›</small>
            </a>
          </li>
        ))}
      </ul>
    </div>
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
  studioDefaultOn = false, // the approved redesign: owner-device preview (lib/institute-studio.js)
  studentName = null,
}) {
  const c = resolveChurch(church);
  const [studio] = useState(() => isInstituteStudioOn({ defaultOn: studioDefaultOn }));
  // Course covers for the studio's photographic cards: the lesson-art records load
  // only when the studio is on (owner device), so the public Institute never pays for them.
  const [covers, setCovers] = useState(() => new Map());
  useEffect(() => {
    if (!studio) return undefined;
    let on = true;
    import('../lib/learn-presentation/presentation-records.json')
      .then((m) => {
        if (on) setCovers(courseCovers((m.default || m).records, { preview: true }));
      })
      .catch(() => {
        /* no covers: the cards fall back to the program photograph */
      });
    return () => {
      on = false;
    };
  }, [studio]);
  const started = useMemo(() => new Set(studio ? listPlaces({ inProgress: true }).map((x) => x.courseKey) : []), [studio]);
  const programs = useMemo(() => PROGRAMS.map((p) => ({ ...p, status: programStatus(p), courses: programCourses(p), list: programCourseList(p) })), []);
  const open = useMemo(() => availableCourses(), []);
  const paths = useMemo(() => populationPaths(), []);
  /** "also in <program>" for a course a second program names, so a shared course reads where else it lives. */
  const alsoIn = (courseKey, here) =>
    PROGRAMS.filter((q) => q.key !== here && [...(q.courseKeys || []), ...(q.alsoKeys || [])].includes(courseKey))
      .map((q) => `also in ${q.title}`)
      .join(' · ') || null;
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
  const [only, setOnly] = useState('all'); // the Courses tab's program filter
  const goLearn = () => {
    if (setChurchView) setChurchView('learn');
  };
  const catalog = useMemo(() => new Map(programs.flatMap((p) => p.list.map(({ course }) => [course.key, course]))), [programs]);
  // A studio button OPENS a section AND TAKES THE READER TO IT (Darrell 2026-11-25, from the
  // live preview: "Buttons don't go anywhere for anything on this screen"). The sections sit
  // below a tall home, so switching the tab alone changed nothing the reader could see.
  const sectionsRef = useRef(null);
  const openSection = (id, programKey = null) => {
    if (programKey) setOnly(programKey);
    else if (id === 'courses') setOnly('all');
    setActive(id);
    const go = () => {
      const el = sectionsRef.current;
      if (!el) return;
      if (el.scrollIntoView) el.scrollIntoView({ behavior: motionBehavior(), block: 'start' });
      if (el.focus) el.focus({ preventScroll: true });
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(go);
    else go();
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
                  {p.list.length > 0 && (
                    <details className="lc-inst-more mt-2" data-testid={`institute-program-more-${p.key}`}>
                      <summary className={`lc-btn lc-btn-gold ${FOCUS}`} data-testid={`institute-program-count-${p.key}`}>
                        Explore {p.list.length} courses
                      </summary>
                      <p className="lc-small mt-2">
                        {p.courses.length} required for the certificate · {p.list.length - p.courses.length} more for open study
                        {p.byAge ? ' · lessons for every age, young to seniors' : ''}
                      </p>
                      {studio ? (
                        <InstituteCourseCards
                          items={p.list}
                          covers={covers}
                          started={started}
                          programKey={p.key}
                          label={`${p.title} courses`}
                          testid={`institute-program-cards-${p.key}`}
                        />
                      ) : (
                        <ul className="lc-stack mt-2" aria-label={`${p.title} courses`} data-testid={`institute-program-courses-${p.key}`}>
                          {p.list.map(({ course, required }) => (
                            <CourseRow key={course.key} course={course} required={required} testid={`institute-program-${p.key}-course-${course.key}`} />
                          ))}
                        </ul>
                      )}
                      {p.byAge && <PopulationPaths paths={paths} testid={`institute-by-age-${p.key}`} />}
                    </details>
                  )}
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
          <div className="lc-inst-btns" role="group" aria-label="Show courses for" data-testid="institute-course-filter">
            {[{ key: 'all', title: 'All programs' }, ...programs].map((p) => (
              <button
                key={p.key}
                type="button"
                aria-pressed={only === p.key}
                onClick={() => setOnly(p.key)}
                className={`lc-btn ${only === p.key ? 'lc-btn-gold' : 'lc-btn-ghost'} ${FOCUS}`}
                data-testid={`institute-course-filter-${p.key}`}
              >
                {p.title}
              </button>
            ))}
          </div>
          {programs.map((p) => {
            if (only !== 'all' && only !== p.key) return null;
            // Filtered to one program, it lists EVERY course that program names (shared ones included);
            // "All programs" lists each course once, under the first program that names it.
            const mine =
              only === 'all' ? open.filter((x) => x.program.key === p.key) : p.list.map(({ course, required }) => ({ course, program: p, required }));
            if (mine.length === 0) return null;
            return (
              <section key={p.key} aria-labelledby={`inst-courses-${p.key}`} data-testid={`institute-courses-${p.key}`}>
                <h4 id={`inst-courses-${p.key}`} className="lc-prog-t mb-1">
                  {p.title}
                </h4>
                {studio ? (
                  <InstituteCourseCards
                    items={mine.map(({ course, required }) => ({ course, required, note: alsoIn(course.key, p.key) }))}
                    covers={covers}
                    started={started}
                    programKey={p.key}
                    label={`${p.title} courses`}
                    testid={`institute-course-cards-${p.key}`}
                  />
                ) : (
                  <ol className="lc-stack" aria-label={`${p.title} courses`}>
                    {mine.map(({ course, required }) => (
                      <CourseRow
                        key={course.key}
                        course={course}
                        required={required}
                        n={only === 'all' ? open.findIndex((x) => x.course.key === course.key) + 1 : null}
                        testid={`institute-course-${course.key}`}
                        note={alsoIn(course.key, p.key)}
                      />
                    ))}
                  </ol>
                )}
                {p.byAge && <PopulationPaths paths={paths} testid={`institute-courses-by-age-${p.key}`} />}
              </section>
            );
          })}
          <p className="lc-notice">
            Every course here already exists in the app's Learn tab with lessons, quizzes and read-aloud. "Required for the certificate" marks a program's core;
            the rest are open study. The Institute's own survey and doctrine courses are planned and are not listed as available.
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
  if (studio) {
    sections.push({
      id: 'resources',
      label: 'Resources',
      icon: 'folder',
      render: () => (
        <div className="lc-stack" data-testid="institute-resources">
          <h3 className="lc-h3">Academic Resources</h3>
          <div className="lc-tiles">
            <button type="button" onClick={goLearn} className={`lc-tile ${FOCUS}`}>
              <b>Course materials</b>
              <small>Every Institute course in Learn: watch, read, listen and study, with print and read-aloud</small>
            </button>
            <button type="button" onClick={() => setChurchView && setChurchView('scripture')} className={`lc-tile ${FOCUS}`}>
              <b>The Bible</b>
              <small>Read the Word in the church's Bible reader</small>
            </button>
            <button type="button" onClick={() => setActive('certificates')} className={`lc-tile ${FOCUS}`}>
              <b>Verify a certificate</b>
              <small>Check any Institute certificate by its verify code</small>
            </button>
            <button type="button" onClick={() => setActive('enrollment')} className={`lc-tile ${FOCUS}`}>
              <b>How enrollment works</b>
              <small>The steps from application to certificate</small>
            </button>
          </div>
        </div>
      ),
    });
  }
  if (isOffice && instanceId) {
    sections.push({
      id: 'office',
      label: 'Office',
      icon: 'shield',
      render: () => <OfficePanel instanceId={instanceId} settings={effective} roll={roll} sync={sync} reload={reload} />,
    });
  }

  return (
    <div className={`lc-home${studio ? ' is-root' : ''}`} data-testid="church-institute">
      {studio ? (
        <InstituteStudio
          programs={programs}
          catalog={catalog}
          mine={mine}
          standing={standing}
          creds={creds}
          signedIn={!!myUserId}
          studentName={studentName}
          onOpen={openSection}
          onExplore={goLearn}
        />
      ) : (
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
      )}
      <div ref={sectionsRef} tabIndex={-1} className="is-sections" data-testid="institute-sections">
        <SectionTabs sections={sections} ariaLabel="Institute sections" idBase="institute" variant="sub" activeId={active} onActiveChange={setActive} />
      </div>
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
