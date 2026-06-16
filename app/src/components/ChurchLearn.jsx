// =============================================================================
// ChurchLearn — Church > Learn: the COLG Learn courses
// =============================================================================
// Two courses now live here, side by side (a tab picker switches between them):
//   1. "Learning A.I. The Way" — the youth A.I. class (Darrell 2026-06-15).
//   2. "The Broadcast: How It All Works" — the broadcast/media-team training
//      (Darrell 2026-06-16): cameras, light, OBS, the GPU/CPU machines, the
//      network, and how A.I. serves the broadcast — tailored to the real COLG
//      team at each station. Built in the SAME shape as the youth class.
//
// Both courses share ONE generic renderer (CourseView) and ONE solo A.I. tutor
// (TutorPanel → askTutor), so they look and behave identically; only their content
// + cohort + interest wiring differ. The wrapper holds which course is active.
//
// What is REAL here (DR-0061 / DR-0076 — nothing painted):
//   • Timeline — each week's date is COMPUTED from that course's cohort start, and
//     the weekday shown is the true day of that date (a wrong start shows the wrong
//     day, it does not lie). The cohort the learner sees is RESOLVED so a learner
//     outside the Governor's instance gets the published confirmed date.
//   • Your progress — counted from YOUR real record (data.classProgress); module
//     ids are distinct per course (wk* vs bc*), so one record serves both honestly.
//   • Interest — "I want to join" routes a REAL note to Darrell through the existing
//     cross-tenant feedback pipe, per course.
//   • The tutor — routes local-first to the family NAS (Ollama qwen2.5) via the
//     same-origin /n8n path; when it isn't connected it says so and the authored
//     walkthrough still carries the learner through (no fabricated answer).
//   • Export — the full curriculum (incl. the facilitator guide) as Markdown the
//     facilitator can print; built from the same source as the screen, per course.
//
// Accessibility (WCAG 2.1 AA, verified against the rendered tokens): #1A1815 body
// on white (>=16:1), #5A5751 secondary (~7:1), #5A6E3D / #7A1F1F accents (>=4.5:1),
// every control keyboard-reachable with a visible #B85838 focus ring and >=36px
// touch targets, labelled inputs, aria-live on async confirmations, the course
// picker exposed as an ARIA tablist.
import React, { useState, useRef } from 'react';
import {
  CLASS_META, PROPOSED_COHORT_START,
  buildSchedule, progressSummary, exportCurriculumMarkdown,
} from '../lib/church-classes.js';
import { askTutor } from '../lib/class-tutor.js';
import {
  LEARN_LEVELS, DEFAULT_LEVEL, resolveLevel, normalizeMedia, gradeQuiz, courseAssessment,
} from '../lib/learn-framework.js';

const fmtDate = (d) => d
  ? d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  : null;

// A friendly label for a launch target so the button reads in plain words.
const launchLabel = (t) => {
  if (!t) return null;
  if (t.view === 'church' && t.churchView === 'home') return 'Open the Council Chamber';
  if (t.view === 'notes') return 'Open Thinking Space';
  if (t.view === 'about') return 'Open your privacy & settings';
  return 'Open the app surface';
};

// -----------------------------------------------------------------------------
// Authored diagrams (multi-modal lesson media). Keyed by module media `key`.
// SVG, palette-matched, accessible (role=img + <title>). These are REAL authored
// figures (DR-0076) — not pending media.
// -----------------------------------------------------------------------------
const diagramBox = (x, y, w, label, sub, fill = '#FAF8F4', stroke = '#1A1815') => (
  <g>
    <rect x={x} y={y} width={w} height="44" fill={fill} stroke={stroke} strokeWidth="1.5" />
    <text x={x + w / 2} y={y + 19} textAnchor="middle" fontSize="11" fontWeight="600" fill="#1A1815" fontFamily="Fraunces, serif">{label}</text>
    {sub && <text x={x + w / 2} y={y + 34} textAnchor="middle" fontSize="8.5" fill="#5A5751" fontFamily="Fraunces, serif">{sub}</text>}
  </g>
);
const DIAGRAMS = {
  'signal-chain': (
    <svg viewBox="0 0 680 80" role="img" aria-label="Signal chain: camera to capture to OBS to encode to stream to screens" className="w-full h-auto">
      <title>The broadcast signal chain</title>
      {['Camera', 'Capture', 'OBS', 'Encode', 'Stream', 'Screens'].map((l, i) => {
        const x = 6 + i * 112;
        return (
          <g key={l}>
            {diagramBox(x, 18, 96, l, ['the image', 'card', 'switch', 'NVENC', 'RTMP/SRT', 'room + home'][i])}
            {i < 5 && <line x1={x + 96} y1={40} x2={x + 112} y2={40} stroke="#B85838" strokeWidth="2" markerEnd="url(#arrow)" />}
          </g>
        );
      })}
      <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#B85838" /></marker></defs>
    </svg>
  ),
  'cpu-vs-gpu': (
    <svg viewBox="0 0 680 150" role="img" aria-label="CPU has a few powerful cores; GPU has thousands of small cores, plus a separate NVENC encoder" className="w-full h-auto">
      <title>CPU vs GPU vs NVENC</title>
      <text x="170" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1A1815" fontFamily="Fraunces, serif">CPU — a few powerful cores</text>
      {[0, 1, 2, 3].map((i) => <rect key={i} x={70 + i * 50} y={26} width="38" height="38" fill="#5A6E3D" stroke="#1A1815" />)}
      <text x="170" y="84" textAnchor="middle" fontSize="8.5" fill="#5A5751" fontFamily="Fraunces, serif">OS · audio · OBS logic (one hard job at a time)</text>
      <text x="500" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1A1815" fontFamily="Fraunces, serif">GPU — thousands of small cores</text>
      {Array.from({ length: 60 }).map((_, i) => <rect key={i} x={360 + (i % 15) * 18} y={26 + Math.floor(i / 15) * 14} width="14" height="10" fill="#B85838" />)}
      <text x="500" y="100" textAnchor="middle" fontSize="8.5" fill="#5A5751" fontFamily="Fraunces, serif">5,888 CUDA cores (RTX 4070) · 4K pixels + A.I.</text>
      <rect x="360" y="112" width="280" height="26" fill="#FAF8F4" stroke="#7A1F1F" strokeWidth="1.5" />
      <text x="500" y="129" textAnchor="middle" fontSize="9" fill="#7A1F1F" fontWeight="600" fontFamily="Fraunces, serif">NVENC — separate hardware video encoder on the GPU</text>
    </svg>
  ),
  'bandwidth-pipes': (
    <svg viewBox="0 0 680 120" role="img" aria-label="Uncompressed 4K is about 12 gigabits; compressed for streaming about 35 megabits; NVMe is local storage, Cat6 is the network" className="w-full h-auto">
      <title>The pipes — bandwidth</title>
      {diagramBox(6, 10, 180, 'Uncompressed 4K60', '~12 Gbps (over SDI)', '#FAF8F4', '#7A1F1F')}
      <line x1="186" y1="32" x2="260" y2="32" stroke="#B85838" strokeWidth="2" markerEnd="url(#arrow2)" />
      <text x="223" y="24" textAnchor="middle" fontSize="8" fill="#5A6E3D" fontFamily="Fraunces, serif">NVENC ~300×</text>
      {diagramBox(260, 10, 180, 'Compressed stream', '~35 Mbps (sendable)', '#FAF8F4', '#5A6E3D')}
      {diagramBox(6, 70, 200, 'NVMe = local storage', '~7 GB/s — a drive, NOT a network')}
      {diagramBox(240, 70, 200, 'Cat6 = the network', '1GbE · 10GbE to ~55m')}
      <defs><marker id="arrow2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#B85838" /></marker></defs>
    </svg>
  ),
};

// MediaList — renders a module's multi-modal media. Diagrams render inline;
// clips/videos that aren't captured yet show an HONEST "not captured yet" slot
// (DR-0076 — never a fake player), and a clip links to its SOP sequence.
function MediaList({ module }) {
  const items = normalizeMedia(module);
  if (!items.length) return null;
  return (
    <div className="mt-3 space-y-3">
      {items.map((it, i) => {
        if (it.type === 'diagram' && DIAGRAMS[it.key]) {
          return (
            <figure key={i} className="border border-[#E8E4DC] bg-white p-2">
              {DIAGRAMS[it.key]}
              {it.caption && <figcaption className="text-[10px] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{it.caption}</figcaption>}
            </figure>
          );
        }
        if (it.type === 'video' && it.status === 'ready' && it.src) {
          return (
            <figure key={i} className="border border-[#E8E4DC] bg-white p-2">
              <video controls src={it.src} className="w-full" aria-label={it.title} />
              {it.caption && <figcaption className="text-[10px] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{it.caption}</figcaption>}
            </figure>
          );
        }
        // Pending clip / video — honest "not captured yet" slot, no fake player.
        const isClip = it.type === 'clip';
        return (
          <div key={i} className="border border-dashed border-[#B85838] bg-[#FAF8F4] p-3">
            <div className="flex items-center gap-2">
              <span aria-hidden="true">{isClip ? '🎬' : '🎞️'}</span>
              <span className="text-xs font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{it.title}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#B85838] border border-[#B85838] px-1.5 py-0.5">Not captured yet</span>
            </div>
            {it.caption && <p className="text-[10px] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{it.caption}</p>}
            {isClip && it.sopId && (
              <p className="text-[10px] text-[#5A6E3D] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Linked SOP: {it.sopId}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// QuizBlock — the per-week check-for-understanding. Real assessment: grades the
// learner's answers, records the result, and shows the score + explanations.
function QuizBlock({ module, saved, onRecord }) {
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(null);
  const quiz = module.quiz;
  if (!quiz?.questions?.length) return null;
  const submit = () => {
    const result = gradeQuiz(quiz, answers);
    setGraded(result);
    if (onRecord) onRecord(module.id, { passed: result.passed, pct: result.pct, at: new Date().toISOString() });
  };
  return (
    <div className="mt-3 border-t border-[#E8E4DC] pt-3">
      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">
        Check your understanding
        {saved?.passed && <span className="ml-2 text-[#5A6E3D]">· passed ({saved.pct}%)</span>}
      </div>
      <ol className="space-y-3">
        {quiz.questions.map((q, qi) => (
          <li key={qi}>
            <fieldset>
              <legend className="text-xs text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>{q.q}</legend>
              <div className="space-y-1">
                {q.options.map((opt, oi) => {
                  const checked = answers[qi] === oi;
                  const showCorrect = graded && oi === q.answer;
                  const showWrong = graded && checked && oi !== q.answer;
                  return (
                    <label key={oi} className={`flex items-start gap-2 text-xs p-1.5 border cursor-pointer ${showCorrect ? 'border-[#5A6E3D] bg-[#5A6E3D]/10' : showWrong ? 'border-[#7A1F1F]' : 'border-[#E8E4DC]'}`} style={{ fontFamily: '"Fraunces", serif' }}>
                      <input
                        type="radio"
                        name={`q-${module.id}-${qi}`}
                        checked={checked}
                        onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                        className="mt-0.5"
                      />
                      <span className="text-[#1A1815]">{opt}</span>
                    </label>
                  );
                })}
              </div>
              {graded && q.explain && (
                <p className="text-[10px] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{q.explain}</p>
              )}
            </fieldset>
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={submit}
          className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          {graded ? 'Check again' : 'Check my answers'}
        </button>
        {graded && (
          <span className={`text-xs font-semibold ${graded.passed ? 'text-[#5A6E3D]' : 'text-[#7A1F1F]'}`} style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">
            {graded.correct}/{graded.total} · {graded.pct}% {graded.passed ? '— passed' : '— try again'}
          </span>
        )}
      </div>
    </div>
  );
}

// SopLibrary — the POV Sequence / SOP library (broadcast course). Reserved
// structure: one clip slot + one real checklist per sequence. Clips show as
// "not captured yet" until the glasses capture lands (DR-0076).
function SopLibrary({ sequences, pipeline }) {
  if (!Array.isArray(sequences) || !sequences.length) return null;
  const captured = sequences.filter((s) => s.clip?.status === 'captured').length;
  return (
    <div className="mt-6 border-2 border-[#1A1815] p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Sequence / SOP Library · POV</div>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        Each station’s real procedure, captured first-person and paired with a written checklist. {captured} of {sequences.length} clips captured so far — the checklists stand on their own until the {pipeline?.device || 'glasses'} capture lands.
      </p>
      {pipeline && (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2 mb-3">
          <p className="text-[10px] text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>Sovereign pipeline (capture-only)</p>
          <p className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{pipeline.steps?.join(' → ')}</p>
          <p className="text-[10px] text-[#7A1F1F] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{pipeline.consent}</p>
        </div>
      )}
      <ul className="space-y-3">
        {sequences.map((s) => (
          <li key={s.id} className="border border-[#E8E4DC] p-3">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                {s.title}{s.founding && <span className="ml-2 text-[9px] uppercase tracking-wider text-[#B85838] border border-[#B85838] px-1.5 py-0.5">founding</span>}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 border text-[#B85838] border-[#B85838]">
                {s.clip?.status === 'captured' ? 'clip ready' : 'clip pending'}
              </span>
            </div>
            <p className="text-[11px] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{s.station} · {s.owner}</p>
            {s.why && <p className="text-[11px] text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{s.why}</p>}
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              {s.steps.map((st, i) => (
                <li key={i} className="text-[11px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{st}</li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TutorPanel — the per-week solo guide. Authored walkthrough is ALWAYS shown
// (so a learner can finish offline); the chat enriches it when the local LLM is
// reachable, and degrades honestly when it is not. `tutorCourseMeta` lets the
// SAME engine introduce itself per course (youth class vs broadcast training).
// -----------------------------------------------------------------------------
function TutorPanel({ module, onLaunch, tutorCourseMeta = null, handsOnLabel = 'In the app', level = DEFAULT_LEVEL, quizSaved = null, onRecordQuiz = null }) {
  const [messages, setMessages] = useState([]); // [{ role, content, source? }]
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const liveRef = useRef(null);
  const lessonText = resolveLevel(module, level).text;

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setDraft('');
    setBusy(true);
    setOffline(false);
    const res = await askTutor(module, next, { courseMeta: tutorCourseMeta });
    setBusy(false);
    if (res.ok) {
      setMessages((m) => [...m, { role: 'assistant', content: res.reply, source: res.source }]);
    } else {
      setOffline(true);
    }
  };

  return (
    <div className="mt-3 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">
        🧭 Your guide for this week
      </div>

      {/* Authored walkthrough — always available, never a dead end. Lesson depth
          follows the learner's chosen skill level (resolveLevel). */}
      {lessonText && (
        <p className="text-xs text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{lessonText}</p>
      )}

      {/* Multi-modal media — diagrams, POV SOP clips, embedded videos */}
      <MediaList module={module} />

      <p className="text-xs text-[#1A1815] mb-2 mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
        <strong>{handsOnLabel}:</strong> {module.inApp}
      </p>
      {module.launch && onLaunch && (
        <button
          type="button"
          onClick={() => onLaunch(module.launch)}
          className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          {launchLabel(module.launch)} →
        </button>
      )}
      {Array.isArray(module.facilitator?.discussionPrompts) && module.facilitator.discussionPrompts.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Think about</div>
          <ul className="list-disc pl-5 space-y-1">
            {module.facilitator.discussionPrompts.map((q, i) => (
              <li key={i} className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Check-for-understanding quiz (real assessment) */}
      <QuizBlock module={module} saved={quizSaved} onRecord={onRecordQuiz} />

      {/* The chat with the local tutor */}
      <div className="mt-3 border-t border-[#E8E4DC] pt-3">
        {messages.length > 0 && (
          <div className="space-y-2 mb-2" aria-live="polite" ref={liveRef}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <span
                  className={`inline-block text-xs px-2.5 py-1.5 max-w-[90%] ${m.role === 'user'
                    ? 'bg-[#1A1815] text-white'
                    : 'bg-white border border-[#E8E4DC] text-[#1A1815]'}`}
                  style={{ fontFamily: '"Fraunces", serif' }}
                >
                  {m.content}
                  {m.role === 'assistant' && (
                    <span className="block text-[9px] uppercase tracking-wider text-[#5A6E3D] mt-1">
                      Local tutor · test what it tells you
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {offline && (
          <p className="text-[11px] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">
            The live tutor isn’t connected right now — but you can still finish this week on your own: follow <strong>“{handsOnLabel}”</strong> above and the questions to think about. Try the tutor again later.
          </p>
        )}

        <label htmlFor={`tutor-${module.id}`} className="sr-only">Ask the tutor about this week</label>
        <div className="flex gap-2 items-end">
          <textarea
            id={`tutor-${module.id}`}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
            placeholder="Ask the tutor anything about this week…"
            className="flex-1 text-sm p-2 border border-[#E8E4DC] bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !draft.trim()}
            className="text-xs uppercase tracking-wider px-3 py-2 min-h-[40px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            {busy ? '…' : 'Ask'}
          </button>
        </div>
        <p className="text-[10px] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          The tutor runs on the church’s own A.I. (sovereign, not sold). It can be wrong — verify what matters.
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// CourseView — renders ONE course (the active one). Generic over a `course`
// descriptor so both the youth class and the broadcast training share this code.
// -----------------------------------------------------------------------------
function CourseView({
  course,
  progress = {},
  toggleModule = null,
  isGovernor = false,
  onLaunch = null,
  interestSent = false,
  onSendInterest = null,
  learnLevel = DEFAULT_LEVEL,
  setLearnLevel = null,
  quizState = {},
  recordQuiz = null,
  onBecomeHelper = null,
  helped = false,
}) {
  const [showFacilitator, setShowFacilitator] = useState(false);
  const [openTutorId, setOpenTutorId] = useState(null);
  const [exportNote, setExportNote] = useState('');

  const {
    meta, schedule, cohortConfirmed, cohortStart, setCohortStart, confirmCohort,
    progressSummary: courseProgressSummary, exportMarkdown, downloadName,
    roster, interestCopy, tutorCourseMeta, sopSequences, capturePipeline,
  } = course;
  const handsOnLabel = meta.handsOnLabel || 'In the app';
  const prog = courseProgressSummary(progress);
  const canSendInterest = !!onSendInterest;
  // Real assessment from the learner's record (progress + quiz passes).
  const assessment = courseAssessment(schedule, progress, quizState);

  const copyCurriculum = async () => {
    try {
      await navigator.clipboard.writeText(exportMarkdown());
      setExportNote('Copied the full curriculum to your clipboard.');
    } catch (e) {
      setExportNote('Couldn’t copy automatically — use Download instead.');
    }
  };

  const downloadCurriculum = () => {
    try {
      const blob = new Blob([exportMarkdown()], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNote(`Downloaded ${downloadName}.`);
    } catch (e) {
      setExportNote('Download failed — try Copy instead.');
    }
  };

  const printCurriculum = () => {
    try { window.print(); } catch (e) { /* no-op */ }
  };

  return (
    <>
      {/* ===== Screen UI (hidden when printing) ===== */}
      <div className="print:hidden">
      <p className="text-sm text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>{meta.tagline}</p>
      <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        For {meta.audience}. {meta.format}.
      </p>

      {/* Interest — a real connection to Darrell */}
      <div className="bg-[#FAF8F4] border-2 border-[#1A1815] p-4 mb-5">
        <h3 className="text-base font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>{interestCopy.heading}</h3>
        <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          {interestCopy.blurb}
        </p>
        {interestSent ? (
          <div className="text-sm text-[#5A6E3D] font-semibold" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">
            {interestCopy.sent}
          </div>
        ) : (
          <button
            type="button"
            onClick={onSendInterest}
            disabled={!canSendInterest}
            className="text-xs uppercase tracking-wider px-4 py-2.5 min-h-[40px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            {interestCopy.cta} →
          </button>
        )}
        {!canSendInterest && (
          <p className="text-[11px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Sign in to send your interest.</p>
        )}
      </div>

      {/* Governor-only roster — who has asked to join, ACROSS instances. */}
      {isGovernor && Array.isArray(roster) && (
        <div className="border border-[#E8E4DC] p-4 mb-5">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Who wants in</h3>
            <span className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{roster.length} interested</span>
          </div>
          {roster.length === 0 ? (
            <p className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              No one has tapped “{interestCopy.cta}” yet. When they do — from any device, on any instance — they appear here.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {roster.map((r, i) => (
                <li key={r.id || i} className="text-xs text-[#1A1815] flex items-baseline justify-between gap-2" style={{ fontFamily: '"Fraunces", serif' }}>
                  <span>{r.who || r.displayName || 'A parishioner'}</span>
                  <span className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{(r.at || r.createdAt || '').slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Your progress — real, from the signed-in record */}
      {toggleModule && (
        <div className="border border-[#E8E4DC] p-4 mb-5">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Your progress</h3>
            <span className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{prog.done} of {prog.total} · {prog.pct}%</span>
          </div>
          <div className="h-2 bg-[#E8E4DC] overflow-hidden" role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Class progress">
            <div className="h-full bg-[#5A6E3D]" style={{ width: `${prog.pct}%` }} />
          </div>
          <p className="text-[11px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Check off each week as you finish it — this is counted from your own record, just for you.
          </p>
        </div>
      )}

      {/* Skill-level — the right depth for a teen vs a senior founding member */}
      {setLearnLevel && (
        <div className="border border-[#E8E4DC] p-3 mb-5">
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Set your depth</div>
          <div role="group" aria-label="Choose your learning level" className="flex flex-wrap gap-2">
            {LEARN_LEVELS.map((lv) => {
              const on = learnLevel === lv.id;
              return (
                <button
                  key={lv.id}
                  type="button"
                  aria-pressed={on}
                  title={lv.hint}
                  onClick={() => setLearnLevel(lv.id)}
                  className={`text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${on ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'}`}
                >
                  {lv.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Graduate → next-cohort helper (the course teaches itself forward) */}
      {assessment.complete && (
        <div className="bg-[#5A6E3D]/10 border-2 border-[#5A6E3D] p-4 mb-5">
          <h3 className="text-base font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>You finished {meta.title}. 🎓</h3>
          <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
            All {assessment.total} weeks done{assessment.quizTotal ? ` and ${assessment.quizzesPassed}/${assessment.quizTotal} checks passed` : ''}. The best students help teach the next group — put your name forward to help the next cohort.
          </p>
          {helped ? (
            <div className="text-sm text-[#5A6E3D] font-semibold" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">✓ Sent — thank you for raising the next group.</div>
          ) : (
            <button
              type="button"
              onClick={onBecomeHelper}
              disabled={!onBecomeHelper}
              className="text-xs uppercase tracking-wider px-4 py-2.5 min-h-[40px] border-2 border-[#5A6E3D] text-white bg-[#5A6E3D] hover:bg-[#4a5a31] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            >
              I’ll help teach the next cohort →
            </button>
          )}
        </div>
      )}

      {/* The timeline + curriculum */}
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>The {meta.weeks} weeks</h3>
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${cohortConfirmed ? 'text-[#5A6E3D] border-[#5A6E3D]' : 'text-[#B85838] border-[#B85838]'}`}>
          {cohortConfirmed ? 'Cohort 1 · confirmed' : 'Cohort 1 · proposed'}
        </span>
      </div>
      <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        {schedule[0]?.date
          ? <>Starts <strong>{fmtDate(schedule[0].date)}</strong>, then weekly. {cohortConfirmed ? '' : 'Dates are proposed until Darrell confirms.'}</>
          : 'A start date will be set soon.'}
      </p>

      {/* Export — Darrell trusts paper; same source as the screen */}
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-4">
        <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Teach from paper — export the whole curriculum</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copyCurriculum} className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Copy markdown</button>
          <button type="button" onClick={downloadCurriculum} className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Download .md</button>
          <button type="button" onClick={printCurriculum} className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Print</button>
        </div>
        {exportNote && <p className="text-[11px] text-[#5A6E3D] mt-2" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">{exportNote}</p>}
      </div>

      {/* Governor-only: set / confirm the real start date + reveal the facilitator guide */}
      {isGovernor && (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-4">
          {setCohortStart && (
            <>
              <label htmlFor={`cohort-start-${meta.key}`} className="block text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Governor · cohort 1 start date</label>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  id={`cohort-start-${meta.key}`}
                  type="date"
                  value={cohortStart}
                  onChange={(e) => setCohortStart(e.target.value)}
                  className="text-sm border border-[#1A1815] px-2 py-1.5 min-h-[36px] bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
                />
                {confirmCohort && (
                  <button
                    type="button"
                    onClick={() => confirmCohort(!cohortConfirmed)}
                    className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                  >
                    {cohortConfirmed ? 'Mark proposed' : 'Confirm dates'}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#5A5751] mt-2 mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
                Confirming sets it for your instance; publish the date to every learner by setting the course’s <span className="font-mono">CONFIRMED_COHORT</span> in its lib file. Class-interest notes show up in your Church voice review.
              </p>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowFacilitator((v) => !v)}
            aria-pressed={showFacilitator}
            className={`text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${showFacilitator ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
          >
            {showFacilitator ? '✓ Facilitator guide showing' : 'Show facilitator guide'}
          </button>
        </div>
      )}

      <ol className="space-y-3">
        {schedule.map((m) => {
          const done = !!progress[m.id];
          const tutorOpen = openTutorId === m.id;
          return (
            <li key={m.id} className="border border-[#E8E4DC] p-4">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <span className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                  Week {m.week} · {m.title}
                </span>
                <span className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {m.date ? fmtDate(m.date) : 'date TBD'}
                </span>
              </div>
              <p className="text-sm text-[#1A1815] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{m.bigIdea}</p>
              <p className="text-xs text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                <strong className="text-[#1A1815]">{handsOnLabel}:</strong> {m.inApp}
              </p>
              <p className="text-[11px] text-[#5A6E3D] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                <strong>Anchor — {m.anchor.ref}:</strong> {m.anchor.theme}
              </p>

              {/* Actions: start the week (tutor + launch), and mark done */}
              <div className="flex flex-wrap gap-2 mt-3 items-center">
                <button
                  type="button"
                  onClick={() => setOpenTutorId(tutorOpen ? null : m.id)}
                  aria-expanded={tutorOpen}
                  aria-controls={`tutor-panel-${m.id}`}
                  className={`text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${tutorOpen ? 'border-[#B85838] text-[#B85838]' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
                >
                  {tutorOpen ? 'Close the guide' : 'Start this week →'}
                </button>
                {m.launch && onLaunch && !tutorOpen && (
                  <button
                    type="button"
                    onClick={() => onLaunch(m.launch)}
                    className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                  >
                    {launchLabel(m.launch)} →
                  </button>
                )}
                {toggleModule && (
                  <button
                    type="button"
                    onClick={() => toggleModule(m.id)}
                    aria-pressed={done}
                    className={`text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${done ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
                  >
                    {done ? '✓ Done' : 'Mark this week done'}
                  </button>
                )}
              </div>

              {/* The solo tutor for this week */}
              {tutorOpen && (
                <div id={`tutor-panel-${m.id}`}>
                  <TutorPanel
                    module={m}
                    onLaunch={onLaunch}
                    tutorCourseMeta={tutorCourseMeta}
                    handsOnLabel={handsOnLabel}
                    level={learnLevel}
                    quizSaved={quizState[m.id] || null}
                    onRecordQuiz={recordQuiz}
                  />
                </div>
              )}

              {/* Facilitator guide (Governor-revealed) */}
              {isGovernor && showFacilitator && m.facilitator && (
                <div className="mt-3 border-l-4 border-[#7A1F1F] bg-[#FAF8F4] p-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#7A1F1F] font-semibold mb-2">Facilitator guide</div>
                  {m.lesson && (
                    <p className="text-xs text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{m.lesson}</p>
                  )}
                  {m.facilitator.talkingPoints?.length > 0 && (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Talking points</div>
                      <ul className="list-disc pl-5 space-y-1 mb-2">
                        {m.facilitator.talkingPoints.map((t, i) => (
                          <li key={i} className="text-[11px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{t}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {m.facilitator.howToRun && (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">How to run the 75 minutes</div>
                      <ul className="list-disc pl-5 space-y-1 mb-2">
                        {m.facilitator.howToRun.split('|').map((s) => s.trim()).filter(Boolean).map((seg, i) => (
                          <li key={i} className="text-[11px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{seg}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {m.facilitator.discussionPrompts?.length > 0 && (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Discussion prompts</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {m.facilitator.discussionPrompts.map((d, i) => (
                          <li key={i} className="text-[11px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{d}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* POV Sequence / SOP Library (broadcast course only — present when wired) */}
      <SopLibrary sequences={sopSequences} pipeline={capturePipeline} />

      <p className="text-[11px] text-[#5A5751] mt-5" style={{ fontFamily: '"Fraunces", serif' }}>
        Taught by Darrell Poe · The Church of the Living God · built on PoeTech. The first community we serve, the way we serve every community after.
      </p>
      </div>

      {/* ===== Print-only full curriculum (paper) ===== */}
      <div className="hidden print:block text-black">
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>{meta.title}</h1>
        <p><em>{meta.tagline}</em></p>
        <p>For {meta.audience}. {meta.format}.</p>
        <hr />
        {schedule.map((m) => (
          <div key={m.id} style={{ pageBreakInside: 'avoid', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Week {m.week} — {m.title}{m.date ? ` · ${fmtDate(m.date)}` : ''}</h2>
            <p><strong>Big idea.</strong> {m.bigIdea}</p>
            {m.lesson && <p><strong>Lesson.</strong> {m.lesson}</p>}
            <p><strong>{handsOnLabel}.</strong> {m.inApp}</p>
            <p><strong>Anchor — {m.anchor.ref}.</strong> {m.anchor.theme}</p>
            {m.facilitator && (
              <div>
                {m.facilitator.talkingPoints?.length > 0 && (
                  <><p><strong>Talking points</strong></p>
                  <ul>{m.facilitator.talkingPoints.map((t, i) => <li key={i}>{t}</li>)}</ul></>
                )}
                {m.facilitator.howToRun && (
                  <><p><strong>How to run the 75 minutes</strong></p>
                  <ul>{m.facilitator.howToRun.split('|').map((s) => s.trim()).filter(Boolean).map((seg, i) => <li key={i}>{seg}</li>)}</ul></>
                )}
                {m.facilitator.discussionPrompts?.length > 0 && (
                  <><p><strong>Discussion prompts</strong></p>
                  <ul>{m.facilitator.discussionPrompts.map((d, i) => <li key={i}>{d}</li>)}</ul></>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default function ChurchLearn({
  cohortStart = PROPOSED_COHORT_START,
  cohortConfirmed = false,
  setCohortStart = null,
  confirmCohort = null,
  progress = {},
  toggleModule = null,
  addChurchVoice = null,
  submitClassInterest = null, // (name) => void — routes interest CROSS-TENANT via the feedback pipe
  classRoster = null,         // Governor-only: [{ text, who, at }] of everyone who tapped "I want to join"
  isGovernor = false,
  currentUserName = '',
  onLaunch = null, // (target:{view,churchView?}) => void — host maps to setView/setChurchView
  broadcast = null, // optional second-course descriptor (The Broadcast: How It All Works), assembled by the host
  quizState = {},   // shared, keyed by module id: { [moduleId]: { passed, pct, at } }
  recordQuiz = null, // (moduleId, result) => void
  learnLevel = DEFAULT_LEVEL, // shared learner depth preference
  setLearnLevel = null,       // (levelId) => void
  submitHelper = null,        // (courseKey, courseTitle, who) => void — graduate → next-cohort helper
}) {
  const [interestSent, setInterestSent] = useState({}); // keyed by course key
  const [helped, setHelped] = useState({}); // keyed by course key
  const [activeKey, setActiveKey] = useState('ai');

  // The youth A.I. course, assembled from this component's existing flat props so
  // nothing about its wiring changes — it just becomes one entry in the picker.
  const aiInterest = () => {
    const who = (currentUserName || '').trim() || 'A parishioner';
    if (submitClassInterest) {
      submitClassInterest(who);
    } else if (addChurchVoice) {
      addChurchVoice({
        id: `class-${Date.now()}`,
        kind: 'class-interest',
        text: `${who} wants to join the "${CLASS_META.title}" A.I. class for the youth.`,
        from: who,
        at: new Date().toISOString(),
      });
    }
    setInterestSent((s) => ({ ...s, ai: true }));
  };

  const aiCourse = {
    key: 'ai',
    meta: { ...CLASS_META, key: 'ai' },
    schedule: buildSchedule(cohortStart),
    cohortStart, cohortConfirmed, setCohortStart, confirmCohort,
    progressSummary: (p) => progressSummary(p),
    exportMarkdown: () => exportCurriculumMarkdown(cohortStart),
    downloadName: 'learning-ai-the-way-curriculum.md',
    submitInterest: (submitClassInterest || addChurchVoice) ? aiInterest : null,
    roster: classRoster,
    interestCopy: {
      heading: 'Want in?',
      blurb: 'Tell Darrell you’re interested and he’ll save you a spot in Cohort 1. Your name goes straight to his review — no form, no email.',
      cta: 'I want to join',
      sent: '✓ Sent — Darrell will see your interest. See you in class.',
    },
    tutorCourseMeta: null, // default youth-class tutor intro
  };

  // The broadcast course descriptor comes fully-formed from the host (it owns the
  // broadcast cohort + interest wiring). If it's absent, only the A.I. course shows.
  const broadcastCourse = broadcast
    ? {
        ...broadcast,
        key: 'broadcast',
        submitInterest: broadcast.submitInterest
          ? () => { broadcast.submitInterest((currentUserName || '').trim() || 'A team member'); setInterestSent((s) => ({ ...s, broadcast: true })); }
          : null,
      }
    : null;

  const courses = broadcastCourse ? [aiCourse, broadcastCourse] : [aiCourse];
  const active = courses.find((c) => c.key === activeKey) || aiCourse;

  // Graduate → next-cohort helper for the active course (rides the same pipe).
  const onBecomeHelper = submitHelper
    ? () => { submitHelper(active.key, active.meta.title, (currentUserName || '').trim() || 'A learner'); setHelped((h) => ({ ...h, [active.key]: true })); }
    : null;

  return (
    <section className="max-w-3xl" aria-labelledby="learn-h">
      <div className="print:hidden">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Church · Learn</div>
        <h2 id="learn-h" className="text-2xl sm:text-3xl mt-1 mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
          {active.meta.title}
        </h2>

        {/* Course picker — only shown when there's more than one course */}
        {courses.length > 1 && (
          <div role="tablist" aria-label="Choose a course" className="flex flex-wrap gap-2 mb-5 border-b border-[#E8E4DC] pb-3">
            {courses.map((c) => {
              const selected = c.key === activeKey;
              return (
                <button
                  key={c.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveKey(c.key)}
                  className={`text-[11px] uppercase tracking-wider px-3 py-2 min-h-[40px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${selected ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'}`}
                >
                  {c.meta.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <CourseView
        key={active.key}
        course={active}
        progress={progress}
        toggleModule={toggleModule}
        isGovernor={isGovernor}
        onLaunch={onLaunch}
        interestSent={!!interestSent[active.key]}
        onSendInterest={active.submitInterest}
        learnLevel={learnLevel}
        setLearnLevel={setLearnLevel}
        quizState={quizState}
        recordQuiz={recordQuiz}
        onBecomeHelper={onBecomeHelper}
        helped={!!helped[active.key]}
      />
    </section>
  );
}
