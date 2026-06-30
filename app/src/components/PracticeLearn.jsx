// =============================================================================
// PracticeLearn — the Practice-scoped Learn space (TLC Therapy Solutions)
// =============================================================================
// A dedicated Learn space scoped to the Practice, serving THREE audiences on the
// SHARED Learn engine (no fork):
//   * Clients   — psychoeducation: understand your situation + build coping skills.
//   * Therapists— clinical training, onboarding, supervision, best-practice modules.
//   * Training & Hours — completion, certificates that affirm growth, and a real
//                 training-hours ledger toward the Illinois MSW → LCSW pathway.
//
// The value is the HELP, not the credential (experience-over-credentials / SKOS):
// OUTCOMES and growth lead the experience. Completion certificates affirm the
// learning on their own merit. Hours are real training hours — for clinicians,
// supervised clinical hours logged under a supervisor of record, the IL standard.
// Accreditation / CE-provider info is a plain OPTIONAL field, never a gate.
//
// Built on lib/practice-academy.js, which composes lib/tlc-lessons.js (content),
// lib/lesson-flow.js (the five-stage arc + LessonFlowAudience), and lib/learn-
// framework.js (depth levels + real quiz-graded completion). Reading-support
// primitives (large-print + read-aloud) are reused.
//
// SCOPING: clients only ever see the client track; clinician + training tracks are
// staff-gated. Until a real client/therapist login lands (Phase 2 roles layer),
// staff can switch audiences to preview/run any track — stated honestly in-surface.
//
// PERSISTENCE: progress, quiz results, certificates, logged hours, and the (staff-
// edited) cert catalog persist on THIS device (localStorage) — the same local-first
// pattern the sibling Client Growth surface uses. Cross-device sync (a
// practice_training table) is the named next step, not a painted promise.
// =============================================================================
import React, { useState, useMemo, useEffect } from 'react';
import { SectionTitle, MetricCell } from './shared.jsx';
import TextSizeControl from './TextSizeControl.jsx';
import TTSControl from './TTSControl.jsx';
import { buildLessonArc } from '../lib/lesson-flow.js';
import { LessonFlowAudience } from './LessonFlow.jsx';
import { LEARN_LEVELS, DEFAULT_LEVEL, gradeQuiz } from '../lib/learn-framework.js';
import {
  ACADEMY_AUDIENCES, visibleAudiences, canSeeAudience, defaultAudience, getAudience,
  audienceTracks, outcomesFor, trackCompletion, moduleComplete,
  DEFAULT_CERT_CATALOG, catalogForAudience, creditLabel, issueCertificate, certExpired,
  makeCertTemplate,
  HOUR_ACTIVITY_TYPES, DEFAULT_ACTIVITY_TYPE, activityType, CLINICAL_COMPETENCIES,
  IL_LCSW_REQUIREMENT, makeHourEntry, requirementProgress, hoursByCompetency, sumHours,
  DEFAULT_REQUIRED_TRAININGS, requiredTrainingStatus, requiredTrainingSummary,
  isTrackPublishable, ceCreditsToConfirm,
} from '../lib/practice-academy.js';
import {
  DEFAULT_STATE, listStates, getRuleset, rulesetCredentials,
  ceTopicOptions, makeCeEntry, ceProgress, GENERAL_TOPIC,
} from '../lib/ceu-tracker.js';
import {
  allCourses, libraryByField, libraryTotals, LIBRARY_HOURS_NOTE, LIBRARY_VALIDATION_NOTE,
  courseModuleAssessment, courseComplete, gradeCourseTest, growthDelta,
  courseHourEntry, courseTrainingHours,
} from '../lib/tlc-training-library.js';
import { buildTrainingPlan, planToRequirementNote } from '../lib/tlc-training-plan.js';
import {
  DECISIONS, applyApproval, courseApprovalStatus, approvalSummary,
} from '../lib/tlc-course-approval.js';
import {
  courseStrands, STRAND_SPINE_NOTE, SOURCE_THEOLOGY_NOTE,
} from '../lib/tlc-course-strands.js';
import {
  tracksSummary, allTracksConfirmed, UIUC_PIPELINE,
} from '../lib/tlc-training-tracks.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

const LS = {
  audience: 'poe.practiceAcademy.audience.v1',
  level: 'poe.practiceAcademy.level.v1',
  progress: 'poe.practiceAcademy.progress.v1',
  quiz: 'poe.practiceAcademy.quiz.v1',
  certs: 'poe.practiceAcademy.certs.v1',
  catalog: 'poe.practiceAcademy.catalog.v2',
  reqs: 'poe.practiceAcademy.reqs.v1',
  hours: 'poe.practiceAcademy.hours.v1',
  ceu: 'poe.practiceAcademy.ceu.v1',          // logged continuing-education activities
  ceuCfg: 'poe.practiceAcademy.ceuCfg.v1',     // { state, credential, renewalNumber }
  libTests: 'poe.practiceAcademy.libTests.v1', // course pre/post-test results { [courseId]: { pre, post } }
  libApproval: 'poe.practiceAcademy.libApproval.v1', // Christina's per-course agree/disagree
  libLogged: 'poe.practiceAcademy.libLogged.v1',     // course ids whose training hours were logged
};
function loadLS(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } }
function saveLS(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* no storage */ } }

const nowISO = () => new Date().toISOString();
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString(); } catch { return '—'; } };

function PracticeLearn({ email = '', isStaff = false }) {
  const vis = useMemo(() => visibleAudiences({ isStaff }), [isStaff]);
  const [audience, setAudience] = useState(() => {
    const saved = loadLS(LS.audience, null);
    return saved && canSeeAudience(saved, { isStaff }) ? saved : defaultAudience({ isStaff });
  });
  const [level, setLevel] = useState(() => loadLS(LS.level, DEFAULT_LEVEL));
  const [progress, setProgress] = useState(() => loadLS(LS.progress, {}));
  const [quizState, setQuizState] = useState(() => loadLS(LS.quiz, {}));
  const [certs, setCerts] = useState(() => loadLS(LS.certs, []));
  const [catalog, setCatalog] = useState(() => loadLS(LS.catalog, DEFAULT_CERT_CATALOG));
  const [reqCompletions, setReqCompletions] = useState(() => loadLS(LS.reqs, {}));
  const [hours, setHours] = useState(() => loadLS(LS.hours, []));
  const [ceus, setCeus] = useState(() => loadLS(LS.ceu, []));
  const [ceuCfg, setCeuCfg] = useState(() => loadLS(LS.ceuCfg, { state: DEFAULT_STATE, credential: 'LCSW', renewalNumber: 2 }));
  const [libTests, setLibTests] = useState(() => loadLS(LS.libTests, {}));
  const [libApproval, setLibApproval] = useState(() => loadLS(LS.libApproval, {}));
  const [libLogged, setLibLogged] = useState(() => loadLS(LS.libLogged, []));
  const [openModuleId, setOpenModuleId] = useState(null);

  useEffect(() => { saveLS(LS.audience, audience); }, [audience]);
  useEffect(() => { saveLS(LS.level, level); }, [level]);
  useEffect(() => { saveLS(LS.progress, progress); }, [progress]);
  useEffect(() => { saveLS(LS.quiz, quizState); }, [quizState]);
  useEffect(() => { saveLS(LS.certs, certs); }, [certs]);
  useEffect(() => { saveLS(LS.catalog, catalog); }, [catalog]);
  useEffect(() => { saveLS(LS.reqs, reqCompletions); }, [reqCompletions]);
  useEffect(() => { saveLS(LS.hours, hours); }, [hours]);
  useEffect(() => { saveLS(LS.ceu, ceus); }, [ceus]);
  useEffect(() => { saveLS(LS.ceuCfg, ceuCfg); }, [ceuCfg]);
  useEffect(() => { saveLS(LS.libTests, libTests); }, [libTests]);
  useEffect(() => { saveLS(LS.libApproval, libApproval); }, [libApproval]);
  useEffect(() => { saveLS(LS.libLogged, libLogged); }, [libLogged]);

  useEffect(() => {
    if (!canSeeAudience(audience, { isStaff })) setAudience(defaultAudience({ isStaff }));
  }, [audience, isStaff]);

  const aud = getAudience(audience) || ACADEMY_AUDIENCES[0];
  const outcomes = useMemo(() => outcomesFor(audience), [audience]);
  const tracks = useMemo(() => audienceTracks(audience), [audience]);
  const audCatalog = useMemo(() => catalogForAudience(catalog, audience), [catalog, audience]);
  const audReqs = useMemo(
    () => DEFAULT_REQUIRED_TRAININGS.filter((r) => r.audienceKey === audience || audience === 'training'),
    [audience],
  );
  const myHours = useMemo(() => hours.filter((h) => !h.learnerEmail || h.learnerEmail === email), [hours, email]);

  // -- learner actions ------------------------------------------------------
  const recordQuiz = (moduleId, result) => {
    setQuizState((prev) => ({ ...prev, [moduleId]: { passed: result.passed, pct: result.pct, at: nowISO() } }));
    if (result.passed) setProgress((prev) => ({ ...prev, [moduleId]: true }));
  };
  const markRead = (moduleId) => setProgress((prev) => ({ ...prev, [moduleId]: true }));

  const earnCertificate = (template, track) => {
    const completion = trackCompletion(track, progress, quizState);
    const cert = issueCertificate(template, {
      learnerName: email ? email.split('@')[0] : 'Learner',
      learnerEmail: email, trackTitle: track.title, completion, now: nowISO(),
    });
    setCerts((prev) => (prev.some((c) => c.id === cert.id) ? prev : [cert, ...prev]));
  };

  const logHours = (entry) => setHours((prev) => [makeHourEntry({ ...entry, learnerEmail: email, createdAt: nowISO() }), ...prev]);
  const removeHours = (id) => setHours((prev) => prev.filter((h) => h.id !== id));

  const myCeus = useMemo(() => ceus.filter((c) => !c.learnerEmail || c.learnerEmail === email), [ceus, email]);
  const logCeu = (entry) => setCeus((prev) => [makeCeEntry({ ...entry, learnerEmail: email, createdAt: nowISO() }), ...prev]);
  const removeCeu = (id) => setCeus((prev) => prev.filter((c) => c.id !== id));

  const showHoursLedger = isStaff && (audience === 'therapist' || audience === 'training');

  // -- Course library (the built-out training courses across the ten fields) ----
  const libCourses = useMemo(() => allCourses(), []);
  const showLibrary = audience === 'therapist' || audience === 'training';
  const libGroups = useMemo(() => libraryByField(libCourses), [libCourses]);
  const libTotals = useMemo(() => libraryTotals(libCourses), [libCourses]);
  const libApprovalTally = useMemo(() => approvalSummary(libCourses, libApproval), [libCourses, libApproval]);
  const trainingPlan = useMemo(
    () => buildTrainingPlan(libCourses, { hoursPerMonth: 24, months: 36, startISO: nowISO() }),
    [libCourses],
  );

  const decideCourse = (courseId, decision) =>
    setLibApproval((prev) => applyApproval(prev, courseId, { decision, by: email || 'Christina (LCSW)', at: nowISO() }));
  const recordCourseTest = (courseId, which, result) =>
    setLibTests((prev) => ({ ...prev, [courseId]: { ...(prev[courseId] || {}), [which]: { passed: result.passed, pct: result.pct, at: nowISO() } } }));

  // Completing a course logs its TRAINING hours into the supervised-hours ledger (a
  // 'training' activity tagged with the course's field) AND issues a certificate that
  // affirms the hours — real records, logged once (libLogged guards a double-log).
  const completeCourse = (course) => {
    if (libLogged.includes(course.id)) return;
    logHours(courseHourEntry(course, { learnerEmail: email, date: todayISO() }));
    const tpl = makeCertTemplate({
      id: `cert-${course.id}`, audienceKey: 'training', title: `${course.title} — Certificate of Completion`,
      trackKey: course.id, trainingHours: courseTrainingHours(course), competency: course.field, expiresMonths: null,
    });
    const cert = issueCertificate(tpl, { learnerName: email ? email.split('@')[0] : 'Learner', learnerEmail: email, trackTitle: course.title, now: nowISO() });
    setCerts((prev) => (prev.some((c) => c.id === cert.id) ? prev : [cert, ...prev]));
    setLibLogged((prev) => (prev.includes(course.id) ? prev : [...prev, course.id]));
  };

  return (
    <div className="space-y-5">
      {/* Header + audience switcher */}
      <section className="bg-white border-2 border-[#1A1815] p-5 sm:p-6">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">TLC Therapy Solutions · Learn</div>
        <h2 className="text-2xl mb-1" style={{ ...SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>A Learn space that builds real skill</h2>
        <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose" style={SERIF}>
          Learning that actually helps — psychoeducation and coping skills for clients and families, clinical growth for therapists, and a real record of the work. Built on the same paced, age-adaptive, read-aloud-ready Learn engine the rest of the app uses.
        </p>

        <div className="mt-4">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1.5">Who is learning</div>
          <div role="group" aria-label="Learn audience" className="flex flex-wrap gap-1.5">
            {vis.map((a) => (
              <button
                key={a.key}
                type="button"
                aria-pressed={audience === a.key}
                onClick={() => { setAudience(a.key); setOpenModuleId(null); }}
                className={`px-3 py-2 min-h-[40px] text-[0.6875rem] uppercase tracking-wider whitespace-nowrap border focus:outline focus:outline-2 focus:outline-[#B85838] ${audience === a.key ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#B85838]'}`}
              >
                <span aria-hidden="true">{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
          <p className="text-[0.6875rem] text-[#5A5751] italic mt-2" style={SERIF}>{aud.blurb}</p>
          {audience === 'client' && (
            <p className="text-[0.6875rem] text-[#B85838] mt-1.5 font-medium">
              ⚠ Educational support only — psychoeducation, not treatment or diagnosis. In an emergency, contact crisis / emergency services (e.g., 988 in the US).
            </p>
          )}
          {isStaff && (
            <p className="text-[0.625rem] text-[#5A5751] mt-1.5" style={SERIF}>
              You can switch audiences to preview / run any track. A real client or therapist sign-in pins the audience from membership (Phase 2, roles layer).
            </p>
          )}
        </div>
      </section>

      {/* OUTCOMES — what you'll gain. Leads the experience. */}
      <section className="bg-white border-2 border-[#5A6E3D] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-2">What you’ll gain</div>
        <p className="text-sm text-[#1A1815] mb-3 max-w-prose" style={SERIF}><strong>Understand:</strong> {outcomes.understand}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Skills you’ll build</div>
            <ul className="list-disc pl-5 space-y-0.5">
              {outcomes.skills.map((s, i) => <li key={i} className="text-xs text-[#1A1815]" style={SERIF}>{s}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Coping skills</div>
            <ul className="list-disc pl-5 space-y-0.5">
              {outcomes.coping.map((s, i) => <li key={i} className="text-xs text-[#1A1815]" style={SERIF}>{s}</li>)}
            </ul>
          </div>
        </div>
        <p className="text-[0.6875rem] text-[#5A5751] italic mt-3" style={SERIF}><strong className="text-[#5A6E3D] not-italic">How you’ll improve:</strong> {outcomes.improve}</p>
      </section>

      {/* Reading support (the shared accessibility primitives) */}
      <section className="bg-white border border-[#E8E4DC] p-4">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">Reading support</div>
        <div className="flex flex-wrap items-center gap-4">
          <TextSizeControl variant="panel" />
          <div>
            <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">Reading level</div>
            <div role="group" aria-label="Reading level" className="flex flex-wrap gap-1.5">
              {LEARN_LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={level === l.id}
                  title={l.hint}
                  onClick={() => setLevel(l.id)}
                  className={`px-2.5 py-1.5 min-h-[34px] text-[0.625rem] uppercase tracking-wider border focus:outline focus:outline-2 focus:outline-[#B85838] ${level === l.id ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#5A6E3D]'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-[0.625rem] text-[#5A5751] italic mt-2" style={SERIF}>Large-print scaling, plain-language levels, and read-aloud so the full meaning lands for every reader.</p>
      </section>

      {/* Tracks + lessons for this audience */}
      {tracks.map((track) => (
        <TrackCard
          key={track.key}
          track={track}
          level={level}
          progress={progress}
          quizState={quizState}
          openModuleId={openModuleId}
          setOpenModuleId={setOpenModuleId}
          onRecordQuiz={recordQuiz}
          onMarkRead={markRead}
          certTemplates={audCatalog.filter((c) => c.trackKey === track.key)}
          onEarn={(tpl) => earnCertificate(tpl, track)}
          alreadyEarned={(certId) => certs.some((c) => c.certId === certId)}
        />
      ))}

      {/* The built-out clinician COURSE LIBRARY across the ten training fields */}
      {showLibrary && (
        <CourseLibrary
          groups={libGroups}
          totals={libTotals}
          approvalTally={libApprovalTally}
          approval={libApproval}
          isStaff={isStaff}
          level={level}
          progress={progress}
          quizState={quizState}
          libTests={libTests}
          libLogged={libLogged}
          openModuleId={openModuleId}
          setOpenModuleId={setOpenModuleId}
          onRecordQuiz={recordQuiz}
          onMarkRead={markRead}
          onDecide={decideCourse}
          onRecordTest={recordCourseTest}
          onComplete={completeCourse}
        />
      )}

      {/* The 24-hours/month, multi-year training MAP across the ten fields */}
      {showLibrary && <TrainingPlanPanel plan={trainingPlan} />}

      {/* Who this serves — audiences/tracks with grounded IL/CSWE hour requirements */}
      {showLibrary && <TracksPanel libraryHours={libTotals.totalHours} />}

      {/* Certificates earned (this device) */}
      <EarnedCertificates certs={certs} onRemove={(id) => setCerts((prev) => prev.filter((c) => c.id !== id))} />

      {/* Training-hours ledger (staff, clinician + training audiences) */}
      {showHoursLedger && <HoursLedger entries={myHours} onLog={logHours} onRemove={removeHours} />}

      {/* CEU renewal tracker — post-license continuing education (distinct from the
          pre-licensure supervised-hours ledger above) */}
      {showHoursLedger && <CeuTracker entries={myCeus} cfg={ceuCfg} setCfg={setCeuCfg} onLog={logCeu} onRemove={removeCeu} />}

      {/* Certificate catalog + required trainings (staff) */}
      {isStaff && (audience === 'therapist' || audience === 'training') && (
        <>
          <CertCatalogPanel catalog={audCatalog} setCatalog={setCatalog} />
          <RequiredTrainings reqs={audReqs} completions={reqCompletions} setCompletions={setReqCompletions} />
        </>
      )}

      {/* The single floating read-aloud control for the whole surface */}
      <TTSControl />
    </div>
  );
}

// -----------------------------------------------------------------------------
// TrackCard — one supporting-lesson track: header + completion + module list, each
// module expanding into the shared lesson-flow runner. Offers the matching
// certificate(s) once the track is complete.
// -----------------------------------------------------------------------------
function TrackCard({ track, level, progress, quizState, openModuleId, setOpenModuleId, onRecordQuiz, onMarkRead, certTemplates, onEarn, alreadyEarned }) {
  const completion = useMemo(() => trackCompletion(track, progress, quizState), [track, progress, quizState]);
  const ce = ceCreditsToConfirm(track);
  const published = isTrackPublishable(track);

  return (
    <section className="bg-white border border-[#E8E4DC] p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
        <h3 className="text-lg" style={{ ...SERIF, fontWeight: 600 }}>{track.title}</h3>
        <span className={`text-[0.625rem] uppercase tracking-wider ${published ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>
          {published ? '✓ validated' : 'needs SME validation'}
        </span>
      </div>
      <p className="text-xs text-[#5A5751] mb-2 max-w-prose" style={SERIF}>{track.purpose}</p>
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-3">
        {track.modules.length} lessons · {completion.done}/{completion.total} done · {completion.progressPct}%{ce > 0 ? ` · ~${ce} training hours` : ''}
      </div>
      <div className="h-1.5 bg-[#E8E4DC] mb-3"><div className="h-full bg-[#5A6E3D]" style={{ width: `${completion.progressPct}%` }} /></div>

      <ul className="space-y-2">
        {track.modules.map((module) => {
          const done = moduleComplete(module, progress, quizState);
          const open = openModuleId === module.id;
          return (
            <li key={module.id} className="border border-[#E8E4DC]">
              <button
                type="button"
                onClick={() => setOpenModuleId(open ? null : module.id)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                <span className="flex items-baseline gap-2 min-w-0">
                  <span aria-hidden="true" className={done ? 'text-[#5A6E3D]' : 'text-[#E8E4DC]'}>{done ? '✓' : '○'}</span>
                  <span className="truncate" style={{ ...SERIF, fontWeight: 600 }}>{module.title}</span>
                </span>
                <span className="text-[#5A5751] shrink-0">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <div className="p-3 pt-0 border-t border-[#E8E4DC]">
                  <LessonRunner module={module} level={level} quizState={quizState} onRecordQuiz={onRecordQuiz} onMarkRead={onMarkRead} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Certificate offer on completion — affirms the growth */}
      {certTemplates.length > 0 && (
        <div className="mt-4 border-t border-[#E8E4DC] pt-3">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Certificate for this track</div>
          {certTemplates.map((tpl) => {
            const earned = alreadyEarned(tpl.id);
            return (
              <div key={tpl.id} className="flex items-center justify-between gap-2 flex-wrap border border-[#E8E4DC] p-2.5 mb-1.5">
                <div className="min-w-0">
                  <div className="text-sm" style={{ ...SERIF, fontWeight: 600 }}>{tpl.title}</div>
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{creditLabel(tpl)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onEarn(tpl)}
                  disabled={!completion.complete || earned}
                  title={!completion.complete ? 'Finish every lesson (and its check) to earn this' : earned ? 'Already earned' : 'Earn this certificate'}
                  className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
                >
                  {earned ? '✓ Earned' : completion.complete ? 'Earn certificate' : 'Complete to earn'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// LessonRunner — the shared lesson-flow audience view for ONE module, plus a check-
// for-understanding quiz. Reuses buildLessonArc + LessonFlowAudience; renderStage
// supplies the learner-safe body for each arc stage (no facilitator notes — no-leak).
// -----------------------------------------------------------------------------
function LessonRunner({ module, level, quizState, onRecordQuiz, onMarkRead }) {
  const arc = useMemo(() => buildLessonArc(module, { levelOverride: level }), [module, level]);

  const renderStage = (seg) => {
    switch (seg.kind) {
      case 'open':
        return seg.audience.bigIdea ? (
          <p className="text-sm text-[#1A1815]" style={SERIF}>{seg.audience.bigIdea}</p>
        ) : null;
      case 'teach': {
        const segs = (seg.audience.lessonPlan && seg.audience.lessonPlan.segments) || [];
        return (
          <div className="space-y-2">
            {segs.map((t, i) => (
              <p key={i} className="text-sm text-[#1A1815] leading-relaxed" style={SERIF}>{t}</p>
            ))}
          </div>
        );
      }
      case 'apply':
        return <QuizBlock module={module} saved={quizState[module.id]} onRecord={onRecordQuiz} onMarkRead={onMarkRead} />;
      default:
        return null;
    }
  };

  return <LessonFlowAudience arc={arc} renderStage={renderStage} unitNoun="lesson" />;
}

// -----------------------------------------------------------------------------
// QuizBlock — a small, real check-for-understanding. Grades via the shared
// gradeQuiz; passing marks the module complete.
// -----------------------------------------------------------------------------
function QuizBlock({ module, saved, onRecord, onMarkRead }) {
  const questions = (module.quiz && Array.isArray(module.quiz.questions)) ? module.quiz.questions : [];
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(null);

  if (questions.length === 0) {
    return (
      <div>
        {module.inApp && <p className="text-xs text-[#1A1815] mb-2" style={SERIF}><strong>Take it with you:</strong> {module.inApp}</p>}
        <button
          type="button"
          onClick={() => onMarkRead(module.id)}
          className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          Mark as read
        </button>
      </div>
    );
  }

  const submit = () => {
    const result = gradeQuiz(module.quiz, answers);
    setGraded(result);
    onRecord(module.id, result);
  };

  return (
    <div>
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Quick check</div>
      <ol className="space-y-3">
        {questions.map((q, qi) => (
          <li key={qi}>
            <p className="text-sm text-[#1A1815] mb-1.5" style={SERIF}>{qi + 1}. {q.q}</p>
            <div className="space-y-1">
              {q.options.map((opt, oi) => {
                const sel = answers[qi] === oi;
                const showCorrect = graded && oi === q.answer;
                const showWrong = graded && sel && oi !== q.answer;
                return (
                  <label key={oi} className={`flex items-center gap-2 text-xs p-2 border cursor-pointer ${showCorrect ? 'border-[#5A6E3D] bg-[#5A6E3D]/[0.07]' : showWrong ? 'border-[#B85838] bg-[#B85838]/[0.06]' : sel ? 'border-[#1A1815]' : 'border-[#E8E4DC]'}`} style={SERIF}>
                    <input
                      type="radio"
                      name={`q-${module.id}-${qi}`}
                      checked={sel}
                      onChange={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                      className="w-4 h-4"
                    />
                    <span className="text-[#1A1815]">{opt}</span>
                    {showCorrect && <span className="ml-auto text-[#5A6E3D] text-[0.625rem] uppercase">✓ correct</span>}
                  </label>
                );
              })}
            </div>
            {graded && q.explain && <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={SERIF}>{q.explain}</p>}
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          onClick={submit}
          disabled={Object.keys(answers).length < questions.length}
          className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#3a352f] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          Check my answers
        </button>
        {graded && (
          <span className={`text-xs font-semibold ${graded.passed ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`} style={SERIF}>
            {graded.passed ? `✓ Passed — ${graded.pct}%` : `${graded.pct}% — review and try again`}
          </span>
        )}
        {saved && saved.passed && !graded && <span className="text-xs text-[#5A6E3D]" style={SERIF}>✓ Previously passed</span>}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// EarnedCertificates — the learner's earned certificates: title, the learning +
// hours they affirm, optional CE-provider metadata, verify code, and expiry.
// -----------------------------------------------------------------------------
function EarnedCertificates({ certs, onRemove }) {
  if (!certs || certs.length === 0) return null;
  const now = nowISO();
  return (
    <section>
      <SectionTitle eyebrow="Your record">Certificates earned</SectionTitle>
      <div className="space-y-2">
        {certs.map((c) => {
          const expired = certExpired(c, now);
          return (
            <div key={c.id} className="bg-white border-2 border-[#5A6E3D] p-4">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-sm" style={{ ...SERIF, fontWeight: 600 }}>{c.title}</span>
                <span className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D]">Completed</span>
              </div>
              <div className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={SERIF}>{c.trackTitle} · {c.learnerName}{c.competency ? ` · ${c.competency}` : ''}</div>
              <div className="text-[0.6875rem] text-[#1A1815] mt-1" style={SERIF}><strong>{c.label}</strong></div>
              <div className="flex items-center gap-3 mt-2 text-[0.625rem] text-[#5A5751]" style={MONO}>
                <span>Issued {fmtDate(c.issuedAt)}</span>
                {c.expiresAt && <span className={expired ? 'text-[#B85838] font-semibold' : ''}>{expired ? 'EXPIRED ' : 'Expires '}{fmtDate(c.expiresAt)}</span>}
                <span>Verify {c.verifyCode}</span>
                <button type="button" onClick={() => onRemove(c.id)} aria-label="Remove certificate" className="ml-auto text-[#5A5751] hover:text-[#B85838] min-h-[28px] min-w-[28px]">×</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// HoursLedger — the real, standard training-hours tracker for the IL MSW → LCSW
// supervised-experience pathway. Logs hours per learner with the fields that
// matter; totals them toward the requirement.
// -----------------------------------------------------------------------------
function HoursLedger({ entries, onLog, onRemove }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ date: todayISO(), hours: '', activity: DEFAULT_ACTIVITY_TYPE, competency: '', supervisor: '', note: '' });
  const prog = useMemo(() => requirementProgress(entries, IL_LCSW_REQUIREMENT), [entries]);
  const byComp = useMemo(() => hoursByCompetency(entries), [entries]);
  const totalAll = useMemo(() => sumHours(entries), [entries]);

  const submit = () => {
    const h = Number(form.hours);
    if (!form.date || !(h > 0)) { alert('A date and a positive number of hours are required.'); return; }
    if (activityType(form.activity)?.countsClinical && !form.supervisor.trim()) { alert('Supervised clinical hours need a supervisor of record.'); return; }
    onLog({ ...form, hours: h });
    setForm({ date: todayISO(), hours: '', activity: DEFAULT_ACTIVITY_TYPE, competency: '', supervisor: '', note: '' });
    setShow(false);
  };

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <SectionTitle eyebrow="Training hours · IL MSW → LCSW">Supervised hours ledger</SectionTitle>
        <button type="button" onClick={() => setShow(!show)} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] min-h-[32px]">{show ? '× Cancel' : '+ Log hours'}</button>
      </div>

      {/* Progress toward the requirement */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC] mb-2">
        <MetricCell label="Supervised clinical" value={`${prog.logged}`} sub={`of ${prog.target}`} small accent="green" />
        <MetricCell label="Remaining" value={`${prog.remaining}`} small accent="rust" />
        <MetricCell label="Supervision hrs" value={`${prog.supervisionHours}`} small />
        <MetricCell label="All logged" value={`${totalAll}`} small />
      </div>
      <div className="h-2 bg-[#E8E4DC] mb-1"><div className="h-full bg-[#5A6E3D]" style={{ width: `${prog.pct}%` }} /></div>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="text-[0.6875rem] text-[#5A5751]" style={SERIF}>
          {prog.pct}% toward the Illinois supervised-clinical standard{prog.supervisors.length ? ` · supervisor(s) of record: ${prog.supervisors.join(', ')}` : ''}.
        </p>
      </div>
      <p className="text-[0.625rem] text-[#5A5751] italic mt-1" style={SERIF}>{IL_LCSW_REQUIREMENT.note}</p>

      {/* Log form */}
      {show && (
        <div className="border border-[#B85838] p-3 mt-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Date
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" />
            </label>
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Hours
              <input type="number" min="0" step="0.25" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" />
            </label>
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Activity
              <select value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case">
                {HOUR_ACTIVITY_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </label>
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Competency
              <select value={form.competency} onChange={(e) => setForm({ ...form, competency: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case">
                <option value="">—</option>
                {CLINICAL_COMPETENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] sm:col-span-2">Supervisor of record
              <input value={form.supervisor} onChange={(e) => setForm({ ...form, supervisor: e.target.value })} placeholder="e.g., Christina Poe, LCSW" className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case" />
            </label>
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] sm:col-span-2">Note
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="brief, no client-identifying detail" className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case" />
            </label>
          </div>
          <button type="button" onClick={submit} className="w-full bg-[#1A1815] text-white py-2 text-[0.625rem] uppercase tracking-wider hover:bg-[#5A6E3D] min-h-[36px]">Log these hours</button>
        </div>
      )}

      {/* Per-competency rollup */}
      {Object.keys(byComp).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(byComp).map(([k, v]) => (
            <span key={k} className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#E8E4DC] text-[#5A5751] bg-[#FAF8F4]">{k}: {v}h</span>
          ))}
        </div>
      )}

      {/* Entries */}
      {entries.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {[...entries].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((e) => (
            <li key={e.id} className="flex items-baseline justify-between gap-2 border border-[#E8E4DC] p-2.5">
              <div className="min-w-0">
                <span className="text-sm" style={{ ...SERIF, fontWeight: 600 }}>{e.hours}h</span>
                <span className="text-xs text-[#5A5751]"> · {(activityType(e.activity) || {}).label || e.activity}</span>
                {e.competency && <span className="text-[0.625rem] text-[#5A5751]"> · {e.competency}</span>}
                <div className="text-[0.625rem] text-[#5A5751]" style={MONO}>{fmtDate(e.date)}{e.supervisor ? ` · ${e.supervisor}` : ''}{e.note ? ` · ${e.note}` : ''}</div>
              </div>
              <button type="button" onClick={() => onRemove(e.id)} aria-label="Remove entry" className="text-[#5A5751] hover:text-[#B85838] shrink-0 min-h-[28px] min-w-[28px]">×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// CeuTracker — POST-LICENSE continuing-education (CE/CEU) renewal tracker. Distinct
// from the supervised-hours ledger above (that is pre-licensure). Reads the active
// STATE ruleset (Illinois default), logs CE activities, and shows progress toward the
// cycle requirement: total hours + each mandated topic + the renewal countdown.
// Multi-state by architecture — switching the state picker swaps the entire ruleset.
// -----------------------------------------------------------------------------
function CeuTracker({ entries, cfg, setCfg, onLog, onRemove }) {
  const [show, setShow] = useState(false);
  const ruleset = useMemo(() => getRuleset(cfg.state), [cfg.state]);
  const creds = useMemo(() => rulesetCredentials(ruleset), [ruleset]);
  const topicOpts = useMemo(() => ceTopicOptions(ruleset, cfg.credential), [ruleset, cfg.credential]);
  const prog = useMemo(
    () => ceProgress(entries, ruleset, { credential: cfg.credential, renewalNumber: cfg.renewalNumber, now: nowISO() }),
    [entries, ruleset, cfg.credential, cfg.renewalNumber],
  );
  const states = listStates();

  const [form, setForm] = useState({ date: todayISO(), hours: '', topic: GENERAL_TOPIC, title: '', provider: '', approvalNumber: '' });
  const topicLabel = (key) => (topicOpts.find((t) => t.key === key) || {}).label || key;

  const submit = () => {
    const h = Number(form.hours);
    if (!form.date || !(h > 0)) { alert('A completion date and a positive number of hours are required.'); return; }
    onLog({ ...form, hours: h, credential: cfg.credential });
    setForm({ date: todayISO(), hours: '', topic: GENERAL_TOPIC, title: '', provider: '', approvalNumber: '' });
    setShow(false);
  };

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <SectionTitle eyebrow={`Continuing education · renewal · ${ruleset.stateName}`}>CEU renewal tracker</SectionTitle>
        <button type="button" onClick={() => setShow(!show)} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] min-h-[32px]">{show ? '× Cancel' : '+ Log CE activity'}</button>
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-3 max-w-prose" style={SERIF}>
        Post-license CE toward your renewal — separate from the pre-licensure supervised hours above. Pick your state and credential; the requirement comes from that state’s law.
      </p>

      {/* State / credential / renewal-number selectors — these swap the active ruleset */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">State law
          <select value={cfg.state} onChange={(e) => setCfg({ ...cfg, state: e.target.value, credential: rulesetCredentials(getRuleset(e.target.value)).includes(cfg.credential) ? cfg.credential : rulesetCredentials(getRuleset(e.target.value))[0] })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case">
            {states.map((s) => <option key={s.state} value={s.state}>{s.stateName} ({s.state})</option>)}
          </select>
        </label>
        <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Credential
          <select value={cfg.credential} onChange={(e) => setCfg({ ...cfg, credential: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case">
            {creds.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Renewal #
          <select value={cfg.renewalNumber} onChange={(e) => setCfg({ ...cfg, renewalNumber: Number(e.target.value) })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case">
            <option value={1}>1st (newly licensed)</option>
            <option value={2}>2nd</option>
            <option value={3}>3rd</option>
            <option value={4}>4th</option>
            <option value={5}>5th+</option>
          </select>
        </label>
      </div>

      {/* First-renewal exemption banner */}
      {prog.exempt ? (
        <div className="border border-[#5A6E3D] bg-[#5A6E3D]/[0.06] p-3 mb-2">
          <p className="text-xs text-[#1A1815]" style={SERIF}>
            <strong className="text-[#5A6E3D]">No CE required for the first renewal.</strong> {ruleset.firstRenewalNote}
          </p>
        </div>
      ) : (
        <>
          {/* Total progress + renewal countdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC] mb-2">
            <MetricCell label="CE hours" value={`${prog.totalLogged}`} sub={`of ${prog.totalRequired}`} small accent="green" />
            <MetricCell label="Remaining" value={`${prog.totalRemaining}`} small accent="rust" />
            <MetricCell label="Topics met" value={`${prog.perTopic.filter((t) => t.met).length}/${prog.perTopic.length}`} small />
            <MetricCell label="Days to renew" value={prog.daysUntilRenewal == null ? '—' : `${prog.daysUntilRenewal}`} small />
          </div>
          <div className="h-2 bg-[#E8E4DC] mb-1"><div className="h-full bg-[#5A6E3D]" style={{ width: `${prog.totalPct}%` }} /></div>
          <p className="text-[0.6875rem] text-[#5A5751]" style={SERIF}>
            {prog.totalPct}% of {prog.totalRequired} CE hours this cycle{prog.renewalDate ? ` · renews ${fmtDate(prog.renewalDate)}` : ''}
            {prog.complete ? ' · ✓ requirement met' : ''}.
          </p>

          {/* Per-mandated-topic progress */}
          {prog.perTopic.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Mandated topics</div>
              {prog.perTopic.map((t) => (
                <div key={t.key} className="border border-[#E8E4DC] p-2.5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-sm" style={{ ...SERIF, fontWeight: 600 }}>
                      <span aria-hidden="true" className={t.met ? 'text-[#5A6E3D]' : 'text-[#B85838]'}>{t.met ? '✓ ' : '○ '}</span>{t.label}
                    </span>
                    <span className={`text-[0.625rem] uppercase tracking-wider ${t.met ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>{t.logged} / {t.required} h</span>
                  </div>
                  {t.note && <div className="text-[0.625rem] text-[#5A5751] mt-0.5" style={SERIF}>{t.note}</div>}
                  <div className="text-[0.5625rem] text-[#5A5751] mt-0.5" style={MONO}>
                    {t.source ? `Source: ${t.source}` : ''}{t.smeConfirm ? ' · SME-confirm pending' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Approved-provider rule — stated once, neutrally, as a data field */}
      {ruleset.approvedProviderRule && ruleset.approvedProviderRule.required && (
        <p className="text-[0.625rem] text-[#5A5751] italic mt-2" style={SERIF}>
          {ruleset.approvedProviderRule.note} <span style={MONO} className="not-italic">[{ruleset.approvedProviderRule.numberFormat}]</span>
        </p>
      )}

      {/* Log form */}
      {show && (
        <div className="border border-[#B85838] p-3 mt-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Completion date
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" />
            </label>
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">CE hours
              <input type="number" min="0" step="0.25" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" />
            </label>
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Topic / category
              <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case">
                {topicOpts.map((t) => <option key={t.key} value={t.key}>{t.label}{t.hours ? ` (need ${t.hours}h)` : ''}</option>)}
              </select>
            </label>
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Activity title
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="course / activity name" className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case" />
            </label>
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">CE provider <span className="normal-case">(sponsor)</span>
              <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="e.g., NASW-IL" className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case" />
            </label>
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Approval # <span className="normal-case">(metadata)</span>
              <input value={form.approvalNumber} onChange={(e) => setForm({ ...form, approvalNumber: e.target.value })} placeholder={ruleset.approvedProviderRule ? ruleset.approvedProviderRule.numberFormat : 'provider #'} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case" />
            </label>
          </div>
          <button type="button" onClick={submit} className="w-full bg-[#1A1815] text-white py-2 text-[0.625rem] uppercase tracking-wider hover:bg-[#5A6E3D] min-h-[36px]">Log this CE activity</button>
        </div>
      )}

      {/* Entries */}
      {entries.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {[...entries].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((e) => (
            <li key={e.id} className="flex items-baseline justify-between gap-2 border border-[#E8E4DC] p-2.5">
              <div className="min-w-0">
                <span className="text-sm" style={{ ...SERIF, fontWeight: 600 }}>{e.hours}h</span>
                <span className="text-xs text-[#5A5751]"> · {topicLabel(e.topic)}</span>
                {e.title && <span className="text-[0.625rem] text-[#5A5751]"> · {e.title}</span>}
                <div className="text-[0.625rem] text-[#5A5751]" style={MONO}>{fmtDate(e.date)}{e.provider ? ` · ${e.provider}` : ''}{e.approvalNumber ? ` · #${e.approvalNumber}` : ''}</div>
              </div>
              <button type="button" onClick={() => onRemove(e.id)} aria-label="Remove CE entry" className="text-[#5A5751] hover:text-[#B85838] shrink-0 min-h-[28px] min-w-[28px]">×</button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[0.5625rem] text-[#5A5751] mt-3" style={MONO}>
        {ruleset.stateName} figures as of {prog.asOf}{prog.confirmed ? '' : ' · pending SME (Christina, LCSW) confirmation'}. This is a tracking aid, not legal advice — verify against {ruleset.agency || 'your licensing board'}.
      </p>
    </section>
  );
}

// -----------------------------------------------------------------------------
// CertCatalogPanel (staff) — view + edit certificates. Hours and title are the
// substance; CE-provider fields are OPTIONAL neutral metadata for the cases that
// want continuing-education-provider info. No gate, no warnings.
// -----------------------------------------------------------------------------
function CertCatalogPanel({ catalog, setCatalog }) {
  const update = (id, patch) => setCatalog((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  return (
    <section className="bg-white border border-[#E8E4DC] p-4 sm:p-5">
      <SectionTitle eyebrow="Staff · certificates">Certificate catalog</SectionTitle>
      <p className="text-xs text-[#5A5751] mb-3 max-w-prose" style={SERIF}>
        Certificates affirm completion and the training hours earned. CE-provider fields are optional — fill them only when a course carries continuing-education-provider info.
      </p>
      <div className="space-y-3">
        {catalog.map((c) => (
          <div key={c.id} className="border border-[#E8E4DC] p-3">
            <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
              <span className="text-sm" style={{ ...SERIF, fontWeight: 600 }}>{c.title}</span>
              <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{creditLabel(c)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Training hours
                <input type="number" min="0" step="0.5" value={c.trainingHours} onChange={(e) => update(c.id, { trainingHours: Number(e.target.value) || 0 })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" />
              </label>
              <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Expires (months)
                <input type="number" min="0" value={c.expiresMonths || ''} onChange={(e) => update(c.id, { expiresMonths: e.target.value ? Number(e.target.value) : null })} placeholder="none" className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" />
              </label>
              <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">CE provider <span className="text-[#5A5751] normal-case">(optional)</span>
                <input value={c.ceProvider || ''} onChange={(e) => update(c.id, { ceProvider: e.target.value || null })} placeholder="e.g., ASWB ACE" className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case" />
              </label>
              <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">CE number <span className="text-[#5A5751] normal-case">(optional)</span>
                <input value={c.ceNumber || ''} onChange={(e) => update(c.id, { ceNumber: e.target.value || null })} placeholder="provider #" className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case" />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// RequiredTrainings (staff) — track trainings clinicians keep current, with a
// cadence and a status derived from the last completion.
// -----------------------------------------------------------------------------
function RequiredTrainings({ reqs, completions, setCompletions }) {
  if (!reqs || reqs.length === 0) return null;
  const now = nowISO();
  const summary = requiredTrainingSummary(reqs, completions, now);
  const STATUS = {
    current: { label: 'Current', color: 'text-[#5A6E3D]' },
    'due-soon': { label: 'Due soon', color: 'text-[#B85838]' },
    overdue: { label: 'Overdue', color: 'text-[#7A1F1F]' },
    never: { label: 'Not logged', color: 'text-[#5A5751]' },
  };
  return (
    <section className="bg-white border border-[#E8E4DC] p-4 sm:p-5">
      <SectionTitle eyebrow="Staff · keeping current">Required trainings</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC] mb-3">
        <MetricCell label="Current" value={`${summary.current}`} small accent="green" />
        <MetricCell label="Due soon" value={`${summary.dueSoon}`} small accent="rust" />
        <MetricCell label="Overdue" value={`${summary.overdue}`} small accent="rust" />
        <MetricCell label="Not logged" value={`${summary.never}`} small />
      </div>
      <div className="space-y-2">
        {reqs.map((req) => {
          const st = requiredTrainingStatus(req, completions[req.id] || null, now);
          const meta = STATUS[st.status] || STATUS.never;
          return (
            <div key={req.id} className="border border-[#E8E4DC] p-3">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-sm" style={{ ...SERIF, fontWeight: 600 }}>{req.title}</span>
                <span className={`text-[0.625rem] uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
              </div>
              <div className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={SERIF}>
                Every {req.cadenceMonths} months · {req.note}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[0.625rem] text-[#5A5751]" style={MONO}>
                {completions[req.id] ? <span>Last {fmtDate(completions[req.id])}{st.dueAt ? ` · due ${fmtDate(st.dueAt)}` : ''}</span> : <span>Never logged</span>}
                <button
                  type="button"
                  onClick={() => setCompletions((prev) => ({ ...prev, [req.id]: now }))}
                  className="text-[0.625rem] uppercase tracking-wider px-2.5 py-1.5 min-h-[32px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                >
                  Log completed today
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// CourseLibrary — the built-out training-course library across the ten clinical
// fields. Staff (Christina) review each finished course and Agree / Disagree; a
// learner sees the courses, takes them on the shared engine, takes a pre/post test
// (growth measure), and on completion logs the training hours + earns a certificate.
// -----------------------------------------------------------------------------
function CourseLibrary({
  groups, totals, approvalTally, approval, isStaff, level, progress, quizState, libTests,
  libLogged, openModuleId, setOpenModuleId, onRecordQuiz, onMarkRead, onDecide, onRecordTest, onComplete,
}) {
  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <SectionTitle eyebrow="Training · the ten clinical fields">Course library</SectionTitle>
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{totals.courseCount} courses · {totals.totalHours} training hours</span>
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2 max-w-prose" style={SERIF}>{LIBRARY_VALIDATION_NOTE}</p>

      {/* The four-strand design spine — Yahweh's perspective & Will at the centre */}
      <div className="border border-[#5A6E3D] bg-[#5A6E3D]/[0.05] p-3 mb-3">
        <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">The four-strand spine</div>
        <p className="text-[0.6875rem] text-[#1A1815] max-w-prose" style={SERIF}>{STRAND_SPINE_NOTE}</p>
      </div>

      {/* Review status — Christina's gate, at a glance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC] mb-2">
        <MetricCell label="Approved" value={`${approvalTally.approved}`} small accent="green" />
        <MetricCell label="Awaiting review" value={`${approvalTally.pending}`} small accent="rust" />
        <MetricCell label="Sent back" value={`${approvalTally.rejected}`} small />
        <MetricCell label="Fields covered" value={`${totals.fieldsCovered}/${totals.fields}`} small />
      </div>
      <p className="text-[0.625rem] text-[#5A5751] italic mb-3" style={SERIF}>{LIBRARY_HOURS_NOTE}</p>

      {groups.filter((g) => g.courses.length > 0).map((g) => (
        <div key={g.slug} className="mb-4">
          <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-1.5 border-b border-[#E8E4DC] pb-1">
            {g.field} <span className="text-[#5A5751] normal-case tracking-normal">· {g.courses.length} course{g.courses.length === 1 ? '' : 's'} · {g.courses.reduce((t, c) => t + courseTrainingHours(c), 0)}h</span>
          </div>
          <div className="space-y-2">
            {g.courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                decision={courseApprovalStatus(approval, course.id)}
                isStaff={isStaff}
                level={level}
                progress={progress}
                quizState={quizState}
                libTests={libTests}
                logged={libLogged.includes(course.id)}
                openModuleId={openModuleId}
                setOpenModuleId={setOpenModuleId}
                onRecordQuiz={onRecordQuiz}
                onMarkRead={onMarkRead}
                onDecide={onDecide}
                onRecordTest={onRecordTest}
                onComplete={onComplete}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

// -----------------------------------------------------------------------------
// CourseCard — one finished course: header (field / hours / origin / review state),
// the staff Agree/Disagree gate, and an expandable body with the pre-test, the
// modules (shared lesson runner), the post-test gate, and completion → hours + cert.
// -----------------------------------------------------------------------------
function CourseCard({
  course, decision, isStaff, level, progress, quizState, libTests, logged,
  openModuleId, setOpenModuleId, onRecordQuiz, onMarkRead, onDecide, onRecordTest, onComplete,
}) {
  const [open, setOpen] = useState(false);
  const modAssess = useMemo(() => courseModuleAssessment(course, progress, quizState), [course, progress, quizState]);
  const complete = useMemo(() => courseComplete(course, progress, quizState, libTests), [course, progress, quizState, libTests]);
  const growth = growthDelta(libTests, course.id);
  const DEC = {
    [DECISIONS.APPROVED]: { label: 'Approved', color: 'text-[#5A6E3D]' },
    [DECISIONS.REJECTED]: { label: 'Sent back', color: 'text-[#B85838]' },
    [DECISIONS.PENDING]: { label: 'Awaiting review', color: 'text-[#5A5751]' },
  };
  const dec = DEC[decision] || DEC[DECISIONS.PENDING];

  return (
    <div className="border border-[#E8E4DC]">
      <div className="w-full flex items-start justify-between gap-2 p-3">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex-1 text-left min-w-0 focus:outline focus:outline-2 focus:outline-[#B85838]">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span aria-hidden="true" className={complete ? 'text-[#5A6E3D]' : 'text-[#E8E4DC]'}>{complete ? '✓' : '○'}</span>
            <span style={{ ...SERIF, fontWeight: 600 }}>{course.title}</span>
            {course.origin === 'youtube-distilled' && <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] border border-[#B85838] px-1">Source-distilled · draft</span>}
          </div>
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-0.5">
            {courseTrainingHours(course)} training hours · {course.modules.length} lesson{course.modules.length === 1 ? '' : 's'} · <span className={dec.color}>{dec.label}</span>
          </div>
        </button>
        <span className="text-[#5A5751] shrink-0">{open ? '−' : '+'}</span>
      </div>

      {/* Staff (Christina) Agree / Disagree gate — her clinical judgment publishes it */}
      {isStaff && (
        <div className="flex items-center gap-2 px-3 pb-3 flex-wrap">
          <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">SME review:</span>
          <button
            type="button"
            onClick={() => onDecide(course.id, DECISIONS.APPROVED)}
            aria-pressed={decision === DECISIONS.APPROVED}
            className={`text-[0.625rem] uppercase tracking-wider px-3 py-1.5 min-h-[32px] border focus:outline focus:outline-2 focus:outline-[#B85838] ${decision === DECISIONS.APPROVED ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A6E3D] border-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white'}`}
          >
            Agree (approve)
          </button>
          <button
            type="button"
            onClick={() => onDecide(course.id, DECISIONS.REJECTED)}
            aria-pressed={decision === DECISIONS.REJECTED}
            className={`text-[0.625rem] uppercase tracking-wider px-3 py-1.5 min-h-[32px] border focus:outline focus:outline-2 focus:outline-[#B85838] ${decision === DECISIONS.REJECTED ? 'bg-[#B85838] text-white border-[#B85838]' : 'bg-white text-[#B85838] border-[#B85838] hover:bg-[#B85838] hover:text-white'}`}
          >
            Disagree (send back)
          </button>
        </div>
      )}

      {open && (
        <div className="px-3 pb-3 border-t border-[#E8E4DC] pt-3 space-y-3">
          <p className="text-sm text-[#1A1815]" style={SERIF}>{course.summary}</p>
          {course.smeConfirm && (
            <p className="text-[0.6875rem] text-[#B85838]" style={SERIF}><strong>SME confirm:</strong> {course.smeConfirm}</p>
          )}
          {course.sources && course.sources.length > 0 && (
            <p className="text-[0.625rem] text-[#5A5751]" style={MONO}>
              Grounded in: {course.sources.map((s, i) => <span key={i}>{i ? ' · ' : ''}{s.label}</span>)}
            </p>
          )}

          {/* Source reach (recognition = asset) — credited as a conduit, tested against the Word */}
          {course.sourceReach && (
            <p className="text-[0.625rem] text-[#5A5751]" style={SERIF}>
              <strong>Source reach:</strong> {course.sourceReach.recognition} <span className="italic">Credited as a conduit; all true knowledge is from Yahweh and the teaching is tested against His Word.</span>
            </p>
          )}

          {/* The four-strand braid — Yahweh's perspective & Will at the centre */}
          <StrandBraid strands={courseStrands(course)} />

          {/* Pre-test (baseline) — optional growth measure */}
          {course.preTest && course.preTest.questions && course.preTest.questions.length > 0 && (
            <CourseTest course={course} which="pre" saved={libTests[course.id] && libTests[course.id].pre} onRecord={onRecordTest} label="Baseline check (before you start)" />
          )}

          {/* The lessons — shared engine runner, one per module */}
          <div className="space-y-2">
            {course.modules.map((module) => {
              const done = moduleComplete(module, progress, quizState);
              const mOpen = openModuleId === module.id;
              return (
                <div key={module.id} className="border border-[#E8E4DC]">
                  <button
                    type="button"
                    onClick={() => setOpenModuleId(mOpen ? null : module.id)}
                    aria-expanded={mOpen}
                    className="w-full flex items-center justify-between gap-2 p-2.5 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
                  >
                    <span className="flex items-baseline gap-2 min-w-0">
                      <span aria-hidden="true" className={done ? 'text-[#5A6E3D]' : 'text-[#E8E4DC]'}>{done ? '✓' : '○'}</span>
                      <span className="truncate text-sm" style={{ ...SERIF, fontWeight: 600 }}>{module.title}</span>
                    </span>
                    <span className="text-[#5A5751] shrink-0">{mOpen ? '−' : '+'}</span>
                  </button>
                  {mOpen && (
                    <div className="p-2.5 pt-0 border-t border-[#E8E4DC]">
                      <LessonRunner module={module} level={level} quizState={quizState} onRecordQuiz={onRecordQuiz} onMarkRead={onMarkRead} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Post-test (graded gate) */}
          {course.postTest && course.postTest.questions && course.postTest.questions.length > 0 && (
            <CourseTest course={course} which="post" saved={libTests[course.id] && libTests[course.id].post} onRecord={onRecordTest} label="Post-test (pass to complete)" />
          )}

          {/* Growth readout — real, only when both tests are taken */}
          {growth && (
            <p className="text-[0.6875rem] text-[#5A6E3D]" style={SERIF}>
              Growth: {growth.pre}% → {growth.post}% ({growth.delta >= 0 ? '+' : ''}{growth.delta} points).
            </p>
          )}

          {/* Completion → log training hours + certificate */}
          <div className="flex items-center justify-between gap-2 flex-wrap border-t border-[#E8E4DC] pt-2">
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
              {modAssess.done}/{modAssess.total} lessons · {modAssess.progressPct}%
            </span>
            <button
              type="button"
              onClick={() => onComplete(course)}
              disabled={!complete || logged}
              title={!complete ? 'Finish every lesson (and the post-test) to complete' : logged ? 'Hours already logged' : 'Log training hours + earn certificate'}
              className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              {logged ? `✓ ${courseTrainingHours(course)}h logged` : complete ? `Complete · log ${courseTrainingHours(course)}h + certificate` : 'Complete to log hours'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// CourseTest — a pre- or post-test for a course. Grades via the shared engine at the
// course's pass threshold; records the result so growth (pre → post) is measurable.
// -----------------------------------------------------------------------------
function CourseTest({ course, which, saved, onRecord, label }) {
  const test = which === 'pre' ? course.preTest : course.postTest;
  const questions = (test && Array.isArray(test.questions)) ? test.questions : [];
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(null);
  if (questions.length === 0) return null;

  const submit = () => {
    const result = gradeCourseTest(course, which, answers);
    setGraded(result);
    onRecord(course.id, which, result);
  };

  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">{label}</div>
      <ol className="space-y-3">
        {questions.map((q, qi) => (
          <li key={qi}>
            <p className="text-sm text-[#1A1815] mb-1.5" style={SERIF}>{qi + 1}. {q.q}</p>
            <div className="space-y-1">
              {q.options.map((opt, oi) => {
                const sel = answers[qi] === oi;
                const showCorrect = graded && which === 'post' && oi === q.answer;
                const showWrong = graded && which === 'post' && sel && oi !== q.answer;
                return (
                  <label key={oi} className={`flex items-center gap-2 text-xs p-2 border cursor-pointer ${showCorrect ? 'border-[#5A6E3D] bg-[#5A6E3D]/[0.07]' : showWrong ? 'border-[#B85838] bg-[#B85838]/[0.06]' : sel ? 'border-[#1A1815]' : 'border-[#E8E4DC] bg-white'}`} style={SERIF}>
                    <input type="radio" name={`${which}-${course.id}-${qi}`} checked={sel} onChange={() => setAnswers((p) => ({ ...p, [qi]: oi }))} className="w-4 h-4" />
                    <span className="text-[#1A1815]">{opt}</span>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          onClick={submit}
          disabled={Object.keys(answers).length < questions.length}
          className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#3a352f] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          {which === 'pre' ? 'Record baseline' : 'Submit post-test'}
        </button>
        {graded && (
          <span className={`text-xs font-semibold ${which === 'pre' ? 'text-[#5A5751]' : graded.passed ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`} style={SERIF}>
            {which === 'pre' ? `Baseline ${graded.pct}%` : graded.passed ? `✓ Passed — ${graded.pct}%` : `${graded.pct}% — review and retake`}
          </span>
        )}
        {!graded && saved && <span className="text-xs text-[#5A5751]" style={SERIF}>Recorded: {saved.pct}%</span>}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TrainingPlanPanel — the 24-hours/month, multi-year MAP across the ten fields.
// Honest about the runway: real library hours, months fully covered, and the gap to
// author next (the YouTube-distill + Christina-authored path fills it).
// -----------------------------------------------------------------------------
function TrainingPlanPanel({ plan }) {
  const [showAll, setShowAll] = useState(false);
  const s = plan.summary;
  const preview = showAll ? plan.plan : plan.plan.slice(0, 6);
  return (
    <section className="bg-white border border-[#E8E4DC] p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <SectionTitle eyebrow={`${plan.hoursPerMonth} hours / month · ${plan.months} months`}>Multi-year training plan</SectionTitle>
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{s.runwayMonths} month runway today</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC] mb-2">
        <MetricCell label="Library hours" value={`${s.libraryHours}`} small accent="green" />
        <MetricCell label="Months covered" value={`${s.monthsFullyCovered}`} small />
        <MetricCell label="Multi-year target" value={`${s.targetHours}`} sub="hours" small />
        <MetricCell label="To author next" value={`${s.shortfallTotal}`} sub="hours" small accent="rust" />
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-3 max-w-prose" style={SERIF}>{planToRequirementNote(plan)}</p>

      {/* Per-field spread */}
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1.5">By field</div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {s.byField.map((f) => (
          <span key={f.field} className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 border ${f.available > 0 ? 'border-[#E8E4DC] text-[#5A5751] bg-[#FAF8F4]' : 'border-[#B85838] text-[#B85838]'}`}>
            {f.field}: {f.hours}h
          </span>
        ))}
      </div>

      {/* Month-by-month map (non-repeating, field-rotating) */}
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1.5">Month-by-month</div>
      <ol className="space-y-1.5">
        {preview.map((m) => (
          <li key={m.index} className="border border-[#E8E4DC] p-2.5">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-xs" style={{ ...SERIF, fontWeight: 600 }}>{m.label}</span>
              <span className={`text-[0.625rem] uppercase tracking-wider ${m.full ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>
                {m.hours}/{plan.hoursPerMonth}h{m.shortfallHours > 0 ? ` · ${m.shortfallHours}h to author` : ''}
              </span>
            </div>
            {m.courses.length > 0 ? (
              <div className="text-[0.625rem] text-[#5A5751] mt-0.5" style={SERIF}>
                {m.courses.map((c) => `${c.title} (${courseTrainingHours(c)}h · ${c.field})`).join(' · ')}
              </div>
            ) : (
              <div className="text-[0.625rem] text-[#B85838] mt-0.5" style={SERIF}>Open — to be filled by new authored / distilled courses.</div>
            )}
          </li>
        ))}
      </ol>
      {plan.plan.length > 6 && (
        <button type="button" onClick={() => setShowAll(!showAll)} className="mt-2 text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] min-h-[32px]">
          {showAll ? '− Show fewer' : `+ Show all ${plan.months} months`}
        </button>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// StrandBraid — the four-strand spine for one course: Yahweh's perspective & Will at
// the centre, with the clinical, scientific, and societal strands shown as how His
// design is lived out (not a replacement for it).
// -----------------------------------------------------------------------------
function StrandBraid({ strands }) {
  if (!strands || !strands.yahweh) return null;
  return (
    <div className="border border-[#5A6E3D] bg-[#5A6E3D]/[0.04] p-3">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-2">How this course braids four strands</div>
      <div className="border-l-2 border-[#B85838] pl-2 mb-2">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold">Yahweh’s perspective &amp; Will · the centre</div>
        <p className="text-xs text-[#1A1815]" style={SERIF}>{strands.yahweh.principle}</p>
        {strands.yahweh.anchors.length > 0 && (
          <p className="text-[0.5625rem] text-[#5A5751]" style={MONO}>Anchors: {strands.yahweh.anchors.join(' · ')}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Clinical skill</div>
          <p className="text-[0.6875rem] text-[#1A1815]" style={SERIF}>{strands.clinical}</p>
        </div>
        <div>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Neuroplasticity &amp; science</div>
          <p className="text-[0.6875rem] text-[#1A1815]" style={SERIF}>{strands.science}</p>
        </div>
        <div>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Societal &amp; understanding</div>
          <p className="text-[0.6875rem] text-[#1A1815]" style={SERIF}>{strands.societal}</p>
        </div>
      </div>
      <p className="text-[0.5625rem] text-[#5A5751] italic mt-1.5" style={SERIF}>
        The clinical, scientific, and societal strands show how Yahweh’s design is lived out — they do not replace it. Faith framing reviewed by Christina (LCSW) / Bishop.
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TracksPanel — the audiences/tracks the one backbone serves, each with its GROUNDED
// Illinois / CSWE hour requirement over the 24-month minimum, plus the UIUC pipeline
// positioning. Honest: figures are SME-confirm-pending; sources are cited.
// -----------------------------------------------------------------------------
function TracksPanel({ libraryHours }) {
  const rows = useMemo(() => tracksSummary({ libraryHours, hoursPerMonth: 24 }), [libraryHours]);
  const confirmed = allTracksConfirmed();
  return (
    <section className="bg-white border border-[#E8E4DC] p-4 sm:p-5">
      <SectionTitle eyebrow="One backbone · many audiences">Who this serves — tracks &amp; hours</SectionTitle>
      <p className="text-[0.6875rem] text-[#5A5751] mb-3 max-w-prose" style={SERIF}>
        The course library, certificate catalog, and hours ledger serve several audiences, each on its own track. Hour requirements below are grounded in the cited standards and are {confirmed ? 'confirmed' : 'pending Christina (LCSW) confirmation'} — never guessed.
      </p>

      <div className="space-y-2">
        {rows.map(({ track, structure }) => (
          <div key={track.key} className="border border-[#E8E4DC] p-3">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-sm" style={{ ...SERIF, fontWeight: 600 }}>{track.label}</span>
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{track.audience}</span>
            </div>
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-1">
              {track.requirement.hours != null
                ? `${track.requirement.hours} ${track.requirement.kind === 'ce' ? 'CE hours' : 'hours'} · ${structure.months}-month window`
                : `Onboarding + ongoing training · ${structure.months}-month window`}
              {' · '}
              <span className={structure.curriculumRole === 'supplies' ? 'text-[#5A6E3D]' : 'text-[#B85838]'}>
                {structure.curriculumRole === 'supplies' ? 'library supplies these hours' : 'library complements (didactic)'}
              </span>
            </div>
            <p className="text-[0.625rem] text-[#5A5751] mt-1" style={SERIF}>{track.requirement.note}</p>
            <div className="text-[0.5625rem] text-[#5A5751] mt-0.5" style={MONO}>
              {track.requirement.source ? `Source: ${track.requirement.source.label}` : 'Internal TLC track'}
              {track.requirement.confirmed ? '' : ' · SME-confirm pending'}
            </div>
          </div>
        ))}
      </div>

      {/* UIUC student pipeline — business positioning */}
      <div className="border border-[#1A1815] bg-[#FAF8F4] p-3 mt-3">
        <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-1">UIUC student pipeline</div>
        <p className="text-[0.6875rem] text-[#1A1815]" style={SERIF}>{UIUC_PIPELINE.opportunity}</p>
        <p className="text-[0.6875rem] text-[#1A1815] mt-1" style={SERIF}>
          <strong>{UIUC_PIPELINE.connection.name}:</strong> {UIUC_PIPELINE.connection.relationship} {UIUC_PIPELINE.connection.role}
        </p>
        <p className="text-[0.5625rem] text-[#5A5751] italic mt-1" style={SERIF}>{UIUC_PIPELINE.connection.note}</p>
      </div>

      <p className="text-[0.5625rem] text-[#5A5751] mt-2" style={SERIF}>{SOURCE_THEOLOGY_NOTE}</p>
    </section>
  );
}

export { PracticeLearn };
export default PracticeLearn;
