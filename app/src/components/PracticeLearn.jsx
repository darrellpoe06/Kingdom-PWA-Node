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
  HOUR_ACTIVITY_TYPES, DEFAULT_ACTIVITY_TYPE, activityType, CLINICAL_COMPETENCIES,
  IL_LCSW_REQUIREMENT, makeHourEntry, requirementProgress, hoursByCompetency, sumHours,
  DEFAULT_REQUIRED_TRAININGS, requiredTrainingStatus, requiredTrainingSummary,
  isTrackPublishable, ceCreditsToConfirm,
} from '../lib/practice-academy.js';

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
  const [openModuleId, setOpenModuleId] = useState(null);

  useEffect(() => { saveLS(LS.audience, audience); }, [audience]);
  useEffect(() => { saveLS(LS.level, level); }, [level]);
  useEffect(() => { saveLS(LS.progress, progress); }, [progress]);
  useEffect(() => { saveLS(LS.quiz, quizState); }, [quizState]);
  useEffect(() => { saveLS(LS.certs, certs); }, [certs]);
  useEffect(() => { saveLS(LS.catalog, catalog); }, [catalog]);
  useEffect(() => { saveLS(LS.reqs, reqCompletions); }, [reqCompletions]);
  useEffect(() => { saveLS(LS.hours, hours); }, [hours]);

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

  const showHoursLedger = isStaff && (audience === 'therapist' || audience === 'training');

  return (
    <div className="space-y-5">
      {/* Header + audience switcher */}
      <section className="bg-white border-2 border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">TLC Therapy Solutions · Learn</div>
        <h2 className="text-2xl mb-1" style={{ ...SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>A Learn space that builds real skill</h2>
        <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose" style={SERIF}>
          Learning that actually helps — psychoeducation and coping skills for clients and families, clinical growth for therapists, and a real record of the work. Built on the same paced, age-adaptive, read-aloud-ready Learn engine the rest of the app uses.
        </p>

        <div className="mt-4">
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1.5">Who is learning</div>
          <div role="group" aria-label="Learn audience" className="flex flex-wrap gap-1.5">
            {vis.map((a) => (
              <button
                key={a.key}
                type="button"
                aria-pressed={audience === a.key}
                onClick={() => { setAudience(a.key); setOpenModuleId(null); }}
                className={`px-3 py-2 min-h-[40px] text-[11px] uppercase tracking-wider whitespace-nowrap border focus:outline focus:outline-2 focus:outline-[#B85838] ${audience === a.key ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#B85838]'}`}
              >
                <span aria-hidden="true">{a.icon}</span> {a.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#5A5751] italic mt-2" style={SERIF}>{aud.blurb}</p>
          {audience === 'client' && (
            <p className="text-[11px] text-[#B85838] mt-1.5 font-medium">
              ⚠ Educational support only — psychoeducation, not treatment or diagnosis. In an emergency, contact crisis / emergency services (e.g., 988 in the US).
            </p>
          )}
          {isStaff && (
            <p className="text-[10px] text-[#5A5751] mt-1.5" style={SERIF}>
              You can switch audiences to preview / run any track. A real client or therapist sign-in pins the audience from membership (Phase 2, roles layer).
            </p>
          )}
        </div>
      </section>

      {/* OUTCOMES — what you'll gain. Leads the experience. */}
      <section className="bg-white border-2 border-[#5A6E3D] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-2">What you’ll gain</div>
        <p className="text-sm text-[#1A1815] mb-3 max-w-prose" style={SERIF}><strong>Understand:</strong> {outcomes.understand}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Skills you’ll build</div>
            <ul className="list-disc pl-5 space-y-0.5">
              {outcomes.skills.map((s, i) => <li key={i} className="text-xs text-[#1A1815]" style={SERIF}>{s}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Coping skills</div>
            <ul className="list-disc pl-5 space-y-0.5">
              {outcomes.coping.map((s, i) => <li key={i} className="text-xs text-[#1A1815]" style={SERIF}>{s}</li>)}
            </ul>
          </div>
        </div>
        <p className="text-[11px] text-[#5A5751] italic mt-3" style={SERIF}><strong className="text-[#5A6E3D] not-italic">How you’ll improve:</strong> {outcomes.improve}</p>
      </section>

      {/* Reading support (the shared accessibility primitives) */}
      <section className="bg-white border border-[#E8E4DC] p-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">Reading support</div>
        <div className="flex flex-wrap items-center gap-4">
          <TextSizeControl variant="panel" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Reading level</div>
            <div role="group" aria-label="Reading level" className="flex flex-wrap gap-1.5">
              {LEARN_LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={level === l.id}
                  title={l.hint}
                  onClick={() => setLevel(l.id)}
                  className={`px-2.5 py-1.5 min-h-[34px] text-[10px] uppercase tracking-wider border focus:outline focus:outline-2 focus:outline-[#B85838] ${level === l.id ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#5A6E3D]'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-[#5A5751] italic mt-2" style={SERIF}>Large-print scaling, plain-language levels, and read-aloud so the full meaning lands for every reader.</p>
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

      {/* Certificates earned (this device) */}
      <EarnedCertificates certs={certs} onRemove={(id) => setCerts((prev) => prev.filter((c) => c.id !== id))} />

      {/* Training-hours ledger (staff, clinician + training audiences) */}
      {showHoursLedger && <HoursLedger entries={myHours} onLog={logHours} onRemove={removeHours} />}

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
        <span className={`text-[10px] uppercase tracking-wider ${published ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>
          {published ? '✓ validated' : 'needs SME validation'}
        </span>
      </div>
      <p className="text-xs text-[#5A5751] mb-2 max-w-prose" style={SERIF}>{track.purpose}</p>
      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-3">
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
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Certificate for this track</div>
          {certTemplates.map((tpl) => {
            const earned = alreadyEarned(tpl.id);
            return (
              <div key={tpl.id} className="flex items-center justify-between gap-2 flex-wrap border border-[#E8E4DC] p-2.5 mb-1.5">
                <div className="min-w-0">
                  <div className="text-sm" style={{ ...SERIF, fontWeight: 600 }}>{tpl.title}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{creditLabel(tpl)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onEarn(tpl)}
                  disabled={!completion.complete || earned}
                  title={!completion.complete ? 'Finish every lesson (and its check) to earn this' : earned ? 'Already earned' : 'Earn this certificate'}
                  className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
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
          className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
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
      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Quick check</div>
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
                    {showCorrect && <span className="ml-auto text-[#5A6E3D] text-[10px] uppercase">✓ correct</span>}
                  </label>
                );
              })}
            </div>
            {graded && q.explain && <p className="text-[11px] text-[#5A5751] italic mt-1" style={SERIF}>{q.explain}</p>}
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          onClick={submit}
          disabled={Object.keys(answers).length < questions.length}
          className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#3a352f] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
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
                <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D]">Completed</span>
              </div>
              <div className="text-[11px] text-[#5A5751] mt-0.5" style={SERIF}>{c.trackTitle} · {c.learnerName}{c.competency ? ` · ${c.competency}` : ''}</div>
              <div className="text-[11px] text-[#1A1815] mt-1" style={SERIF}><strong>{c.label}</strong></div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-[#5A5751]" style={MONO}>
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
        <button type="button" onClick={() => setShow(!show)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] min-h-[32px]">{show ? '× Cancel' : '+ Log hours'}</button>
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
        <p className="text-[11px] text-[#5A5751]" style={SERIF}>
          {prog.pct}% toward the Illinois supervised-clinical standard{prog.supervisors.length ? ` · supervisor(s) of record: ${prog.supervisors.join(', ')}` : ''}.
        </p>
      </div>
      <p className="text-[10px] text-[#5A5751] italic mt-1" style={SERIF}>{IL_LCSW_REQUIREMENT.note}</p>

      {/* Log form */}
      {show && (
        <div className="border border-[#B85838] p-3 mt-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-[10px] uppercase tracking-wider text-[#5A5751]">Date
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" />
            </label>
            <label className="text-[10px] uppercase tracking-wider text-[#5A5751]">Hours
              <input type="number" min="0" step="0.25" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" />
            </label>
            <label className="text-[10px] uppercase tracking-wider text-[#5A5751]">Activity
              <select value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case">
                {HOUR_ACTIVITY_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </label>
            <label className="text-[10px] uppercase tracking-wider text-[#5A5751]">Competency
              <select value={form.competency} onChange={(e) => setForm({ ...form, competency: e.target.value })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case">
                <option value="">—</option>
                {CLINICAL_COMPETENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-[10px] uppercase tracking-wider text-[#5A5751] sm:col-span-2">Supervisor of record
              <input value={form.supervisor} onChange={(e) => setForm({ ...form, supervisor: e.target.value })} placeholder="e.g., Christina Poe, LCSW" className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case" />
            </label>
            <label className="text-[10px] uppercase tracking-wider text-[#5A5751] sm:col-span-2">Note
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="brief, no client-identifying detail" className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case" />
            </label>
          </div>
          <button type="button" onClick={submit} className="w-full bg-[#1A1815] text-white py-2 text-[10px] uppercase tracking-wider hover:bg-[#5A6E3D] min-h-[36px]">Log these hours</button>
        </div>
      )}

      {/* Per-competency rollup */}
      {Object.keys(byComp).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(byComp).map(([k, v]) => (
            <span key={k} className="text-[10px] uppercase tracking-wider px-2 py-1 border border-[#E8E4DC] text-[#5A5751] bg-[#FAF8F4]">{k}: {v}h</span>
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
                {e.competency && <span className="text-[10px] text-[#5A5751]"> · {e.competency}</span>}
                <div className="text-[10px] text-[#5A5751]" style={MONO}>{fmtDate(e.date)}{e.supervisor ? ` · ${e.supervisor}` : ''}{e.note ? ` · ${e.note}` : ''}</div>
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
              <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">{creditLabel(c)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="text-[10px] uppercase tracking-wider text-[#5A5751]">Training hours
                <input type="number" min="0" step="0.5" value={c.trainingHours} onChange={(e) => update(c.id, { trainingHours: Number(e.target.value) || 0 })} className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" />
              </label>
              <label className="text-[10px] uppercase tracking-wider text-[#5A5751]">Expires (months)
                <input type="number" min="0" value={c.expiresMonths || ''} onChange={(e) => update(c.id, { expiresMonths: e.target.value ? Number(e.target.value) : null })} placeholder="none" className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" />
              </label>
              <label className="text-[10px] uppercase tracking-wider text-[#5A5751]">CE provider <span className="text-[#5A5751] normal-case">(optional)</span>
                <input value={c.ceProvider || ''} onChange={(e) => update(c.id, { ceProvider: e.target.value || null })} placeholder="e.g., ASWB ACE" className="block w-full mt-0.5 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] normal-case" />
              </label>
              <label className="text-[10px] uppercase tracking-wider text-[#5A5751]">CE number <span className="text-[#5A5751] normal-case">(optional)</span>
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
                <span className={`text-[10px] uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
              </div>
              <div className="text-[11px] text-[#5A5751] mt-0.5" style={SERIF}>
                Every {req.cadenceMonths} months · {req.note}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#5A5751]" style={MONO}>
                {completions[req.id] ? <span>Last {fmtDate(completions[req.id])}{st.dueAt ? ` · due ${fmtDate(st.dueAt)}` : ''}</span> : <span>Never logged</span>}
                <button
                  type="button"
                  onClick={() => setCompletions((prev) => ({ ...prev, [req.id]: now }))}
                  className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 min-h-[32px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
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

export { PracticeLearn };
export default PracticeLearn;
