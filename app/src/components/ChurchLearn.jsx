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
  CLASS_META, PROPOSED_COHORT_START, SESSION_FLOW,
  buildSchedule, progressSummary, exportCurriculumMarkdown, formatClassDate,
} from '../lib/church-classes.js';
import { askTutor } from '../lib/class-tutor.js';
import {
  LEARN_LEVELS, DEFAULT_LEVEL, normalizeMedia, gradeQuiz, courseAssessment,
  AGE_BANDS, DEFAULT_AGE_BAND, ageBandProfile,
} from '../lib/learn-framework.js';
import { GENERATIVE_VISUAL_PIPELINE } from '../lib/venue-cast.js';
import { buildLessonArc, sessionMinutesFromFlow } from '../lib/lesson-flow.js';
import { LessonFlowAudience, LessonRunOfShow } from './LessonFlow.jsx';
import Presenter from './Presenter.jsx';
import { coursePresentable } from '../lib/presentable.js';
import TextSizeControl from './TextSizeControl.jsx';

const fmtDate = formatClassDate;

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
  // --- Infrastructure course diagrams ---------------------------------------
  'sovereign-stack-map': (
    <svg viewBox="0 0 680 150" role="img" aria-label="Two mirrored stacks we own: the home stack and the church stack" className="w-full h-auto">
      <title>The two sovereign stacks</title>
      <text x="170" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1A1815" fontFamily="Fraunces, serif">Home stack</text>
      {['NAS — store + serve', 'Gateway — walls + door', 'Local A.I.'].map((l, i) => <g key={`h${i}`}>{diagramBox(40, 26 + i * 38, 260, l, null)}</g>)}
      <text x="510" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1A1815" fontFamily="Fraunces, serif">Church (COLG) stack</text>
      {['Sovereign NAS (build)', 'Video wall + 4070 machines', 'Broadcast chain'].map((l, i) => <g key={`c${i}`}>{diagramBox(380, 26 + i * 38, 260, l, null)}</g>)}
      <line x1="300" y1="64" x2="380" y2="64" stroke="#5A6E3D" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#arrowS)" />
      <text x="340" y="56" textAnchor="middle" fontSize="8" fill="#5A6E3D" fontFamily="Fraunces, serif">same patterns</text>
      <defs><marker id="arrowS" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#5A6E3D" /></marker></defs>
    </svg>
  ),
  'nas-anatomy': (
    <svg viewBox="0 0 680 130" role="img" aria-label="One NAS box doing two jobs: storage (the barn) and services plus local A.I. (the brain)" className="w-full h-auto">
      <title>Inside the NAS</title>
      <rect x="20" y="14" width="640" height="100" fill="#FAF8F4" stroke="#1A1815" strokeWidth="1.5" />
      <text x="160" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1A1815" fontFamily="Fraunces, serif">The barn — storage</text>
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={60 + i * 35} y={46} width="26" height="52" fill="#5A6E3D" stroke="#1A1815" />)}
      <text x="160" y="110" textAnchor="middle" fontSize="8.5" fill="#5A5751" fontFamily="Fraunces, serif">drive bays (RAID)</text>
      <text x="500" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1A1815" fontFamily="Fraunces, serif">The brain — services + A.I.</text>
      <text x="500" y="64" textAnchor="middle" fontSize="9" fill="#1A1815" fontFamily="Fraunces, serif">Xeon CPU · ECC RAM · NVMe cache</text>
      <text x="500" y="86" textAnchor="middle" fontSize="9" fill="#5A5751" fontFamily="Fraunces, serif">n8n · Ollama · files · ntfy · (no GPU)</text>
    </svg>
  ),
  'raid-redundancy': (
    <svg viewBox="0 0 680 130" role="img" aria-label="RAID survives one drive failing; a backup is 3 copies, 2 media, 1 offsite" className="w-full h-auto">
      <title>RAID and 3-2-1 backup</title>
      <text x="150" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1A1815" fontFamily="Fraunces, serif">RAID — survives 1 drive dying</text>
      {[0, 1, 2, 3].map((i) => <rect key={i} x={60 + i * 60} y={26} width="44" height="40" fill={i === 2 ? '#7A1F1F' : '#5A6E3D'} stroke="#1A1815" />)}
      <text x="172" y="84" textAnchor="middle" fontSize="8.5" fill="#5A5751" fontFamily="Fraunces, serif">one fails (red) → array keeps running</text>
      <text x="150" y="108" textAnchor="middle" fontSize="8.5" fill="#7A1F1F" fontFamily="Fraunces, serif">but RAID is NOT a backup</text>
      {diagramBox(360, 20, 300, '3 copies · 2 media · 1 offsite', 'offsite = encrypted sealed blob at the church', '#FAF8F4', '#5A6E3D')}
      <text x="510" y="100" textAnchor="middle" fontSize="8.5" fill="#5A5751" fontFamily="Fraunces, serif">a backup you never restored is only a hope</text>
    </svg>
  ),
  'network-vlans': (
    <svg viewBox="0 0 680 140" role="img" aria-label="The gateway is the internet door and the inside walls; VLANs separate family, COLG, TLC, properties, PoeTech" className="w-full h-auto">
      <title>The gateway and its VLAN walls</title>
      {diagramBox(250, 8, 180, 'Gateway (UCG-Max)', 'internet door + walls', '#FAF8F4', '#1A1815')}
      <line x1="340" y1="52" x2="340" y2="70" stroke="#B85838" strokeWidth="2" />
      {['Family', 'COLG', 'TLC', 'Properties', 'PoeTech'].map((l, i) => (
        <g key={l}>
          <rect x={20 + i * 130} y={78} width="118" height="44" fill="#FAF8F4" stroke="#5A6E3D" strokeWidth="1.5" />
          <text x={79 + i * 130} y={104} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1A1815" fontFamily="Fraunces, serif">{l}</text>
        </g>
      ))}
      <text x="340" y="134" textAnchor="middle" fontSize="8.5" fill="#5A5751" fontFamily="Fraunces, serif">each VLAN is a walled-off room — TLC (clinical) stays isolated</text>
    </svg>
  ),
  'remote-access': (
    <svg viewBox="0 0 680 90" role="img" aria-label="A device reaches the NAS through an encrypted VPN tunnel; the public internet stays out" className="w-full h-auto">
      <title>The private VPN tunnel</title>
      {diagramBox(20, 24, 150, 'Your device', 'on the road')}
      <line x1="170" y1="46" x2="270" y2="46" stroke="#5A6E3D" strokeWidth="3" markerEnd="url(#arrowR)" />
      <text x="220" y="38" textAnchor="middle" fontSize="8" fill="#5A6E3D" fontFamily="Fraunces, serif">encrypted VPN</text>
      {diagramBox(270, 24, 150, 'Tunnel', 'Tailscale / WireGuard', '#FAF8F4', '#5A6E3D')}
      <line x1="420" y1="46" x2="500" y2="46" stroke="#5A6E3D" strokeWidth="3" markerEnd="url(#arrowR)" />
      {diagramBox(500, 24, 160, 'NAS at home', 'public stays out', '#FAF8F4', '#1A1815')}
      <defs><marker id="arrowR" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#5A6E3D" /></marker></defs>
    </svg>
  ),
  'vram-ladder': (
    <svg viewBox="0 0 680 120" role="img" aria-label="Small models run on the CPU NAS; a 70B model needs about 48 GB of GPU VRAM, which is why a GPU box is planned" className="w-full h-auto">
      <title>The VRAM ladder</title>
      {diagramBox(20, 18, 300, 'Small model (≤13B)', 'runs on the CPU-only NAS', '#FAF8F4', '#5A6E3D')}
      {diagramBox(360, 18, 300, '70B-class model', 'needs ~48 GB GPU VRAM', '#FAF8F4', '#7A1F1F')}
      <text x="170" y="86" textAnchor="middle" fontSize="8.5" fill="#5A5751" fontFamily="Fraunces, serif">what we have today (NAS)</text>
      <text x="510" y="86" textAnchor="middle" fontSize="8.5" fill="#7A1F1F" fontFamily="Fraunces, serif">GPU farm — planned, not bought yet (DR-0014)</text>
      <text x="340" y="110" textAnchor="middle" fontSize="8.5" fill="#5A5751" fontFamily="Fraunces, serif">the church RTX 4070 wall machines are our real GPUs today</text>
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
        if (it.type === 'diagram') {
          // A diagram is authored content, never "pending capture". If the key has
          // no renderer (a data typo), show the caption rather than silently
          // mislabeling it as a missing clip.
          return (
            <figure key={i} className="border border-[#E8E4DC] bg-white p-2">
              {DIAGRAMS[it.key] || (
                <p className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>[{it.title || 'diagram'}]</p>
              )}
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
// AgePacedLesson — renders the authored lesson PACED to the learner's age band.
// The same authored text is chunked into developmentally-sized segments
// (learn-framework lessonPlanForAge); younger bands get a short stepper with break
// nudges and a quick-win "Got it!" affordance, the adult band gets the whole lesson
// at once. The text is never invented or summarized — only chunked. Reaching the
// last segment fires onSegmentComplete once (real engagement signal).
// -----------------------------------------------------------------------------
function AgePacedLesson({ plan, onSegmentComplete }) {
  const [idx, setIdx] = useState(0);
  const firedRef = useRef(false);
  if (!plan || !plan.segments || plan.segments.length === 0) return null;
  const { segments, totalSegments, segmentMinutes, breakAfterSegments, checkAfterSegments, band } = plan;

  // Adult/single-segment: just show the whole lesson, no stepper.
  if (totalSegments <= 1) {
    return (
      <p className="text-xs text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{segments[0]}</p>
    );
  }

  const atLast = idx >= totalSegments - 1;
  const advance = () => {
    if (atLast) {
      if (!firedRef.current && onSegmentComplete) { firedRef.current = true; onSegmentComplete(); }
      return;
    }
    setIdx((i) => Math.min(totalSegments - 1, i + 1));
  };
  // Break nudge after every breakAfterSegments steps (young bands only).
  const showBreak = breakAfterSegments > 0 && (idx + 1) % breakAfterSegments === 0 && !atLast;
  const showCheckHint = (idx + 1) >= checkAfterSegments;

  return (
    <div className="mb-2 border border-[#E8E4DC] bg-white p-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold">
          Step {idx + 1} of {totalSegments} · ~{segmentMinutes} min · {band.label} pace
        </span>
        <div className="h-1.5 w-24 bg-[#E8E4DC]" role="progressbar" aria-valuenow={idx + 1} aria-valuemin={1} aria-valuemax={totalSegments} aria-label="Lesson step">
          <div className="h-full bg-[#5A6E3D]" style={{ width: `${Math.round(((idx + 1) / totalSegments) * 100)}%` }} />
        </div>
      </div>
      <p className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">{segments[idx]}</p>
      {showBreak && (
        <p className="text-[11px] text-[#B85838] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>🙆 Quick stretch break — then keep going!</p>
      )}
      {showCheckHint && (
        <p className="text-[11px] text-[#5A6E3D] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>👇 When you’re ready, try the quick check below.</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-40 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          ◀ Back
        </button>
        <button
          type="button"
          onClick={advance}
          className={`text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border-2 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${atLast ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white' : 'border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#3a352f]'}`}
        >
          {atLast ? 'Got it! ✓' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

// RpeBlock — every lesson runs the shared Research → Plan → Execute primitive.
function RpeBlock({ rpe }) {
  if (!rpe || (!rpe.research && !rpe.plan && !rpe.execute)) return null;
  const steps = [
    { k: '🔎 Research', v: rpe.research },
    { k: '🗺️ Plan', v: rpe.plan },
    { k: '🔧 Execute', v: rpe.execute },
  ].filter((s) => s.v);
  return (
    <div className="mb-2 border-l-4 border-[#5A6E3D] bg-white p-2">
      <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">Research → Plan → Execute</div>
      <ol className="space-y-1">
        {steps.map((s, i) => (
          <li key={i} className="text-[11px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            <strong>{s.k}:</strong> {s.v}
          </li>
        ))}
      </ol>
    </div>
  );
}

// HardwarePairing — Christian's home path: the REAL device to find, look at, and
// (safely) touch. How a child learns best is hands-on with the real iron.
function HardwarePairing({ hardware }) {
  if (!Array.isArray(hardware) || hardware.length === 0) return null;
  return (
    <div className="mb-2 border border-dashed border-[#5A6E3D] bg-[#5A6E3D]/5 p-2">
      <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">🖐️ Go find it — touch the real thing</div>
      <ul className="space-y-2">
        {hardware.map((h, i) => (
          <li key={i} className="text-[11px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            <strong>{h.device}</strong>
            {h.look && <div>👀 Look: {h.look}</div>}
            {h.touch && <div>✋ Touch: {h.touch}</div>}
            {h.safe && <div className="text-[#7A1F1F]">⚠️ Safe: {h.safe}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// GenerativeVisualNote — HONEST disclosure (DR-0076): the venue can play one lesson
// across every screen at each screen's level (multi-screen cast), and the big screen
// can someday show live A.I.-generated visuals from the spoken words — but that
// rides GPU hardware we don't have yet, so it is clearly a BUILD TARGET, not a claim.
function GenerativeVisualNote() {
  return (
    <div className="mb-2 border border-[#E8E4DC] bg-white p-2">
      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">On the big screen (venue)</div>
      <p className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        In the sanctuary this same lesson can play across every screen at the right level for each one (the video wall and the monitors together).
      </p>
      <p className="text-[11px] text-[#7A1F1F] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
        <span className="uppercase tracking-wider text-[9px] border border-[#7A1F1F] px-1.5 py-0.5 mr-1">Build target</span>
        {GENERATIVE_VISUAL_PIPELINE.summary} {GENERATIVE_VISUAL_PIPELINE.blockedReason}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TutorPanel — the per-week solo guide. Authored walkthrough is ALWAYS shown
// (so a learner can finish offline); the chat enriches it when the local LLM is
// reachable, and degrades honestly when it is not. `tutorCourseMeta` lets the
// SAME engine introduce itself per course (youth class vs broadcast training).
// -----------------------------------------------------------------------------
function TutorPanel({ module, onLaunch, tutorCourseMeta = null, handsOnLabel = 'In the app', level = DEFAULT_LEVEL, quizSaved = null, onRecordQuiz = null, ageBand = DEFAULT_AGE_BAND, levelOverride = null, onEngagement = null, venueAware = false, unitNoun = 'week', sessionFlow = null }) {
  const [messages, setMessages] = useState([]); // [{ role, content, source? }]
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const liveRef = useRef(null);
  const startedRef = useRef(false);
  // The lesson-flow STANDARD: one consistent five-stage arc (Open → Teach → Engage
  // → Apply → Send-off), derived from this module's authored fields, paced to the
  // learner's age/depth. The audience walks it ONE stage at a time (clear where you
  // are / what's next); each stage's body is rendered by renderStage below, reusing
  // the existing real-wired pieces (paced lesson, media, launch, quiz).
  const arc = buildLessonArc(module, { ageBand, levelOverride, sessionFlow, handsOnLabel });

  // Real engagement: this learner started this week (once per open).
  React.useEffect(() => {
    if (!startedRef.current && onEngagement) { startedRef.current = true; onEngagement('started', module.id); }
  }, [module.id, onEngagement]);

  const recordQuizAndEngage = (id, result) => {
    if (onRecordQuiz) onRecordQuiz(id, result);
    if (onEngagement) onEngagement(result.passed ? 'quiz-passed' : 'quiz-failed', id);
  };

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

  // renderStage — the learner-safe body for one arc stage. Each stage reuses the
  // existing real-wired pieces; the LessonFlowAudience shell owns the arc chrome
  // (rail, timing, one-at-a-time progression). NO facilitator notes here (no-leak).
  const renderStage = (seg) => {
    switch (seg.kind) {
      case 'open':
        return (
          <>
            {seg.audience.bigIdea && (
              <p className="text-sm text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{seg.audience.bigIdea}</p>
            )}
            {seg.audience.anchorRef && (
              <p className="text-[11px] text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }}>
                <strong>Anchor — {seg.audience.anchorRef}:</strong> {seg.audience.anchorTheme}
              </p>
            )}
          </>
        );
      case 'teach':
        return (
          <>
            {/* Research → Plan → Execute — the shared doing-primitive */}
            <RpeBlock rpe={module.rpe} />
            {/* Authored walkthrough, PACED to age/depth (chunked, not summarized) */}
            <AgePacedLesson plan={seg.audience.lessonPlan} onSegmentComplete={() => onEngagement && onEngagement('segment-complete', module.id)} />
            {/* Multi-modal media — diagrams, POV SOP clips, embedded videos */}
            <MediaList module={module} />
            {/* Christian's home path — go find + safely touch the real device */}
            <HardwarePairing hardware={module.hardware} />
            {/* Honest venue / generative-visual disclosure (build target) */}
            {venueAware && <GenerativeVisualNote />}
          </>
        );
      case 'engage':
        return seg.audience.prompts.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1">
            {seg.audience.prompts.map((q, i) => (
              <li key={i} className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{q}</li>
            ))}
          </ul>
        ) : null;
      case 'apply':
        return (
          <>
            <p className="text-xs text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
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
            {/* Check-for-understanding quiz (real assessment) */}
            <QuizBlock module={module} saved={quizSaved} onRecord={recordQuizAndEngage} />
          </>
        );
      case 'send':
        return Array.isArray(seg.audience.benefits) && seg.audience.benefits.length > 0 ? (
          <div className="border-l-4 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] pl-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">What this frees in you</div>
            <ul className="list-disc pl-4 space-y-1">
              {seg.audience.benefits.map((b, i) => (
                <li key={i} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{b}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Carry one thing from this {unitNoun} into a real moment this week.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-3 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">
        🧭 Your guide for this {unitNoun}
      </div>

      {/* The lesson-flow STANDARD — one clean, paced stage at a time */}
      <LessonFlowAudience arc={arc} renderStage={renderStage} unitNoun={unitNoun} />

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
            The live tutor isn’t connected right now — but you can still finish this {unitNoun} on your own: follow <strong>“{handsOnLabel}”</strong> above and the questions to think about. Try the tutor again later.
          </p>
        )}

        <label htmlFor={`tutor-${module.id}`} className="sr-only">Ask the tutor about this {unitNoun}</label>
        <div className="flex gap-2 items-end">
          <textarea
            id={`tutor-${module.id}`}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
            placeholder={`Ask the tutor anything about this ${unitNoun}…`}
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
// Label layer for the unit of curriculum. The four weekly cohort courses set no
// `meta.unit`, so this returns the original "week"/"Week"/"weeks" wording and the
// cohort framing — byte-for-byte unchanged. A self-paced lesson series (Living
// Lessons) sets meta.unit to relabel rows as "Lesson(s)" and drop the cohort clock.
function unitLabels(meta) {
  const u = (meta && meta.unit) || {};
  return {
    noun: u.noun || 'week',          // "this {noun}"
    plural: u.nounPlural || 'weeks',  // "The N {plural}"
    cap: u.cap || 'Week',             // "{cap} N · title"
    selfPaced: !!u.selfPaced,
    sessionLabel: u.sessionLabel || 'How to run the 75 minutes',
  };
}

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
  ageBand = DEFAULT_AGE_BAND,
  setAgeBand = null,
  onEngagement = null,
  quizState = {},
  recordQuiz = null,
  onBecomeHelper = null,
  helped = false,
}) {
  const [showFacilitator, setShowFacilitator] = useState(false);
  const [openTutorId, setOpenTutorId] = useState(null);
  const [exportNote, setExportNote] = useState('');
  const [teaching, setTeaching] = useState(false);

  const {
    meta, schedule, cohortConfirmed, cohortStart, setCohortStart, confirmCohort,
    progressSummary: courseProgressSummary, exportMarkdown, downloadName,
    roster, interestCopy, tutorCourseMeta, sopSequences, capturePipeline,
    venueAware = false, engagementByAge = null, sessionFlow = null,
  } = course;
  // The session length this course's run-of-show starts from (the lesson-flow
  // standard reflows the arc to any total the facilitator picks).
  const sessionMinutes = sessionMinutesFromFlow(sessionFlow);
  // The explicit depth override the learner picked, if any. 'auto' (default) means
  // "follow my age band" — the age picker is the master control; this fine-tunes it.
  const levelOverride = learnLevel && learnLevel !== 'auto' && learnLevel !== DEFAULT_AGE_BAND ? learnLevel : null;
  const handsOnLabel = meta.handsOnLabel || 'In the app';
  const U = unitLabels(meta); // "week"/"Week" by default; "lesson"/"Lesson" + self-paced for the lesson series
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

  // Live two-screen teaching takes over the whole surface (presenter console here,
  // projected class screen in a popped window). Governor-only; entered below.
  // Generalized: the shared <Presenter> renders ANY course from a presentable built
  // off this course's own meta + schedule — so every course can teach live, not just
  // the A.I. one. (Was gated to meta.key === 'ai'; Darrell 2026-06-23.)
  if (teaching) {
    return <Presenter presentable={coursePresentable(course)} onClose={() => setTeaching(false)} />;
  }

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
            Check off each {U.noun} as you finish it — this is counted from your own record, just for you.
          </p>
        </div>
      )}

      {/* Age band — the MASTER control: one curriculum, paced + pitched to the
          learner's age (short/visual/playful for a child, deeper for an adult). */}
      {setAgeBand && (
        <div className="border border-[#E8E4DC] p-3 mb-5">
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Who’s learning? (sets the pace)</div>
          <div role="group" aria-label="Choose the learner's age" className="flex flex-wrap gap-2">
            {AGE_BANDS.map((b) => {
              const on = ageBand === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={on}
                  title={b.hint}
                  onClick={() => setAgeBand(b.id)}
                  className={`text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${on ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'}`}
                >
                  {b.label} <span className="opacity-70">{b.range}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            {ageBandProfile(ageBand).pacing}
          </p>
        </div>
      )}

      {/* Fine-tune depth (optional) — the existing skill-level branching, now an
          override on top of the age band. "Auto" follows your age. */}
      {setLearnLevel && (
        <div className="border border-[#E8E4DC] p-3 mb-5">
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Fine-tune depth (optional)</div>
          <div role="group" aria-label="Choose your learning depth" className="flex flex-wrap gap-2">
            {[{ id: 'auto', label: 'Auto', hint: 'Follow my age band.' }, ...LEARN_LEVELS].map((lv) => {
              const on = (learnLevel || 'auto') === lv.id;
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

      {/* Governor — engagement BY AGE BAND, from real use. Tunes the pacing
          defaults: improving one age improves every course's library. */}
      {isGovernor && engagementByAge && (
        <div className="border border-[#E8E4DC] p-4 mb-5">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Engagement by age</h3>
            <span className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{engagementByAge.totals?.records || 0} signals</span>
          </div>
          {(engagementByAge.totals?.records || 0) === 0 ? (
            <p className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              No engagement signals yet. As learners use the courses, each age band’s real use shows here — and the pacing defaults get tuned from it.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {AGE_BANDS.map((b) => {
                const row = engagementByAge.byBand?.[b.id];
                if (!row || row.total === 0) return null;
                return (
                  <li key={b.id} className="text-xs text-[#1A1815] flex items-baseline justify-between gap-2" style={{ fontFamily: '"Fraunces", serif' }}>
                    <span>{b.label} <span className="text-[#5A5751]">{b.range}</span></span>
                    <span className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {row.total} signals · score {row.score} · {row.counts['completed'] || 0} completed
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Graduate → next-cohort helper (the course teaches itself forward) */}
      {assessment.complete && (
        <div className="bg-[#5A6E3D]/10 border-2 border-[#5A6E3D] p-4 mb-5">
          <h3 className="text-base font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>You finished {meta.title}. 🎓</h3>
          <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
            All {assessment.total} {U.plural} done{assessment.quizTotal ? ` and ${assessment.quizzesPassed}/${assessment.quizTotal} checks passed` : ''}. {U.selfPaced ? 'The best way to keep it is to hand it on — put your name forward to help others through it.' : 'The best students help teach the next group — put your name forward to help the next cohort.'}
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
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{U.selfPaced ? (meta.weeks === 1 ? `The ${U.noun}` : `The ${meta.weeks} ${U.plural}`) : `The ${meta.weeks} ${U.plural}`}</h3>
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${U.selfPaced ? 'text-[#5A6E3D] border-[#5A6E3D]' : cohortConfirmed ? 'text-[#5A6E3D] border-[#5A6E3D]' : 'text-[#B85838] border-[#B85838]'}`}>
          {U.selfPaced ? 'Self-paced' : (cohortConfirmed ? 'Cohort 1 · confirmed' : 'Cohort 1 · proposed')}
        </span>
      </div>
      <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        {U.selfPaced
          ? <>Go at your own pace — start any time, alone or with others. Nothing is timed.</>
          : schedule[0]?.date
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
          {/* Every course can teach live now (was A.I.-only) — the shared Presenter
              builds its slides from this course's own schedule. Darrell 2026-06-23. */}
          <button
            type="button"
            onClick={() => setTeaching(true)}
            className="ml-2 text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            ▶ Teach live (presenter + class screen)
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
                  {U.cap} {m.week} · {m.title}
                </span>
                {!U.selfPaced && (
                  <span className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {m.date ? fmtDate(m.date) : 'date TBD'}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#1A1815] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{m.bigIdea}</p>
              {Array.isArray(m.benefits) && m.benefits.length > 0 && (
                <div className="mt-2 border-l-4 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] pl-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">What this frees in you</div>
                  <ul className="list-disc pl-4 space-y-1">
                    {m.benefits.map((b, i) => (
                      <li key={i} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
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
                  {tutorOpen ? 'Close the guide' : `Start this ${U.noun} →`}
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
                    {done ? '✓ Done' : `Mark this ${U.noun} done`}
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
                    ageBand={ageBand}
                    levelOverride={levelOverride}
                    onEngagement={onEngagement}
                    venueAware={venueAware}
                    quizSaved={quizState[m.id] || null}
                    onRecordQuiz={recordQuiz}
                    unitNoun={U.noun}
                    sessionFlow={sessionFlow}
                  />
                </div>
              )}

              {/* Facilitator run-of-show (Governor-revealed) — the lesson-flow
                  standard: the same five-stage arc the learner walks, but TIMED
                  with what-to-say / what-to-do / cues per stage, and a time-adaptive
                  reflow so it fits any length. The deep `lesson` source stays above
                  the arc for the leader to read in full. */}
              {isGovernor && showFacilitator && m.facilitator && (
                <div className="mt-3">
                  {m.lesson && (
                    <div className="border-l-4 border-[#7A1F1F] bg-[#FAF8F4] p-3 mb-0">
                      <div className="text-[10px] uppercase tracking-[0.25em] text-[#7A1F1F] font-semibold mb-2">Deep source (read this first)</div>
                      <p className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{m.lesson}</p>
                    </div>
                  )}
                  <LessonRunOfShow
                    module={m}
                    baseMinutes={sessionMinutes}
                    ageBand={ageBand}
                    levelOverride={levelOverride}
                    sessionLabel={U.sessionLabel}
                    handsOnLabel={handsOnLabel}
                  />
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
            <h2 style={{ fontSize: '15px', fontWeight: 700 }}>{U.cap} {m.week} — {m.title}{!U.selfPaced && m.date ? ` · ${fmtDate(m.date)}` : ''}</h2>
            <p><strong>Big idea.</strong> {m.bigIdea}</p>
            {Array.isArray(m.benefits) && m.benefits.length > 0 && (
              <><p><strong>What this frees in you</strong></p>
              <ul>{m.benefits.map((b, i) => <li key={i}>{b}</li>)}</ul></>
            )}
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
                  <><p><strong>{U.sessionLabel}</strong></p>
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
  extraCourses = null, // optional array of additional fully-formed course descriptors (e.g. The Infrastructure)
  quizState = {},   // shared, keyed by module id: { [moduleId]: { passed, pct, at } }
  recordQuiz = null, // (moduleId, result) => void
  learnLevel = DEFAULT_LEVEL, // shared learner depth override ('auto' follows age)
  setLearnLevel = null,       // (levelId) => void
  ageBand = DEFAULT_AGE_BAND,  // shared learner age band (the master pacing control)
  setAgeBand = null,           // (bandId) => void
  onEngagement = null,         // ({courseKey,courseTitle,moduleId,ageBand,signal}) => void — feedback-by-age
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
    sessionFlow: SESSION_FLOW,
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

  // Additional course descriptors come fully-formed from the host (each owns its
  // cohort + interest wiring). The broadcast prop is kept for back-compat; any
  // number of further courses (e.g. The Infrastructure) ride in via extraCourses.
  // Each gets its interest CTA wrapped to flip this wrapper's per-course sent state.
  const buildExtra = (c, fallbackWho) => {
    if (!c) return null;
    const key = c.meta?.key || c.key;
    return {
      ...c,
      key,
      submitInterest: c.submitInterest
        ? () => { c.submitInterest((currentUserName || '').trim() || fallbackWho); setInterestSent((s) => ({ ...s, [key]: true })); }
        : null,
    };
  };

  const broadcastCourse = buildExtra(
    broadcast ? { ...broadcast, meta: { ...broadcast.meta, key: 'broadcast' } } : null,
    'A team member',
  );
  const builtExtras = (Array.isArray(extraCourses) ? extraCourses : [])
    .map((c) => buildExtra(c, 'A team member'))
    .filter(Boolean);

  const courses = [aiCourse, ...(broadcastCourse ? [broadcastCourse] : []), ...builtExtras];
  const active = courses.find((c) => c.key === activeKey) || aiCourse;

  // Engagement-by-age: TutorPanel emits (signal, moduleId); the wrapper injects the
  // active course + the learner's age band before handing it to the host's pipe.
  const onCourseEngagement = onEngagement
    ? (signal, moduleId) => onEngagement({ courseKey: active.key, courseTitle: active.meta.title, moduleId, ageBand, signal })
    : null;

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

        {/* Large-print for the lessons (WCAG 1.4.4). A learner of any age who needs
            bigger text sets it here; it applies app-wide and is saved per device. */}
        <TextSizeControl variant="panel" className="mb-4" />

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
        ageBand={ageBand}
        setAgeBand={setAgeBand}
        onEngagement={onCourseEngagement}
        quizState={quizState}
        recordQuiz={recordQuiz}
        onBecomeHelper={onBecomeHelper}
        helped={!!helped[active.key]}
      />
    </section>
  );
}
