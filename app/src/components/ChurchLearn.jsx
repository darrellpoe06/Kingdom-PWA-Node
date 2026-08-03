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
//
// Large print (WCAG 1.4.4 Resize Text): ALL reading text here is authored in rem,
// never fixed px, so the global A / A+ / A++ / A+++ control (lib/text-size.js, which
// scales the document root font-size) actually enlarges the lesson body, segments,
// quiz, anchor scripture, facilitator guide and every supporting label. Fixed-px
// classes (text-[10px] etc.) are absolute and do NOT inherit the root scale — they
// were the bug Darrell hit (Learn stayed small at Largest). They are now written at
// the SAME 16px baseline (text-[10px] -> text-[0.625rem]): pixel-identical at Normal,
// but scaling to ~1.5x at Largest. New reading text here uses rem, never px.
import React, { useState, useRef, useMemo } from 'react';
import {
  CLASS_META, PROPOSED_COHORT_START, SESSION_FLOW,
  buildSchedule, progressSummary, exportCurriculumMarkdown, formatClassDate,
} from '../lib/church-classes.js';
import { askTutor } from '../lib/class-tutor.js';
import { ARI } from '../lib/ari.js';
import {
  LEARN_LEVELS, DEFAULT_LEVEL, normalizeMedia, gradeQuiz, courseAssessment,
  AGE_BANDS, DEFAULT_AGE_BAND, ageBandProfile,
} from '../lib/learn-framework.js';
import { GENERATIVE_VISUAL_PIPELINE } from '../lib/venue-cast.js';
import { buildEternalProcessingCourses, wordFirstLead } from '../lib/eternal-algorithms-course.js';
import { buildLessonArc, sessionMinutesFromFlow, readAloudTextFromArc } from '../lib/lesson-flow.js';
import { setReadTarget, clearReadTarget } from '../lib/read-target.js';
import StoryLibrary from './StoryLibrary.jsx';
import { subscribeSubmissions, reviewSubmission, promoteSubmission } from '../lib/story-library.js';
import { engagementRowsByAge } from '../lib/learn-engagement.js';
import { LessonFlowAudience, LessonRunOfShow } from './LessonFlow.jsx';
import StoryExplorer from './games/StoryExplorer.jsx';
import BiblicalTimeline from './BiblicalTimeline.jsx';
import { epochsForLesson, getEpoch } from '../lib/biblical-timeline.js';
import Presenter from './Presenter.jsx';
import DiscernmentStages from './DiscernmentStages.jsx';
import { coursePresentable, lessonPresentable } from '../lib/presentable.js';

// The learner's chosen age band -> (present-mode pace, lesson-level key). One lesson
// is presented at the pace already picked, so present mode never re-asks it.
const AGEBAND_TO_PRESENT_AGE = { child: 'child', youth: 'teen', teen: 'teen', adult: 'adult', senior: 'adult' };
const AGEBAND_TO_LEVEL_KEY = { child: 'child', youth: 'teen', teen: 'teen', adult: null, senior: 'senior' };
import SectionTabs from './SectionTabs.jsx';
import { organizeCourses, courseLessonCount, COURSE_SORTS } from '../lib/learn-organize.js';
import { recordUse, recentUsed } from '../lib/ux-signals.js';
import { getPlace, recordPlace, clearPlace } from '../lib/learn-resume.js';
import { useHistoryValue } from '../lib/nav-history.js';

const fmtDate = formatClassDate;

// A friendly label for a launch target so the button reads in plain words.
// The Council Chamber is the church home's SPEAK section, not the home itself —
// labeling plain home as the Chamber sent learners to the Worship video
// (Darrell 2026-07-10, DR-0142). Exported so the mapping is pinned by a test.
export const launchLabel = (t) => {
  if (!t) return null;
  if (t.view === 'church' && t.churchView === 'home' && t.churchSection === 'speak') return 'Open the Council Chamber';
  if (t.view === 'church' && t.churchView === 'home') return 'Open the church home';
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
  // --- Sovereign A.I. course diagrams ---------------------------------------
  'sovereign-resilience': (
    <svg viewBox="0 0 680 130" role="img" aria-label="A rented vendor tool can be switched off by an outage, policy change, price spike, or cutoff; a tool on iron we own keeps running" className="w-full h-auto">
      <title>The generator in the garage</title>
      {diagramBox(20, 16, 300, 'Rented (vendor cloud)', 'can be switched off', '#FAF8F4', '#7A1F1F')}
      <text x="170" y="80" textAnchor="middle" fontSize="8.5" fill="#7A1F1F" fontFamily="Fraunces, serif">outage · policy change · price spike · cutoff</text>
      <text x="170" y="98" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7A1F1F" fontFamily="Fraunces, serif">✕ goes dark</text>
      {diagramBox(360, 16, 300, 'Owned (local-first)', 'iron we control', '#FAF8F4', '#5A6E3D')}
      <text x="510" y="80" textAnchor="middle" fontSize="8.5" fill="#5A5751" fontFamily="Fraunces, serif">a generator in the garage</text>
      <text x="510" y="98" textAnchor="middle" fontSize="9" fontWeight="700" fill="#5A6E3D" fontFamily="Fraunces, serif">✓ lights stay on · data never leaves</text>
    </svg>
  ),
  'model-tier-ladder': (
    <svg viewBox="0 0 680 160" role="img" aria-label="Three tiers: the Synology CPU tier runs small models today; the AI Forge GPU or Mac Studio tier is planned; the deep-reasoning frontier tier" className="w-full h-auto">
      <title>The three model-tier landscape</title>
      {diagramBox(60, 10, 560, 'Deep-reasoning tier — frontier MoE (vendor / multi-GPU)', 'DeepSeek-R1 671B-class · the hardest problems', '#FAF8F4', '#7A1F1F')}
      {diagramBox(60, 60, 560, 'AI Forge tier — GPU / Mac Studio (PLANNED)', 'deep logic · RAG · agentic · 14–70B-class', '#FAF8F4', '#B85838')}
      {diagramBox(60, 110, 560, 'Synology-CPU tier — the DS1621xs (ONLINE TODAY)', 'small quantized models · Gemma 3 4B · Qwen2.5 7B', '#FAF8F4', '#5A6E3D')}
    </svg>
  ),
  'local-vs-vendor': (
    <svg viewBox="0 0 680 150" role="img" aria-label="Vendors win on frontier reasoning, very long context, and multimodal; local wins on privacy, resilience, always-on cost, and sovereignty" className="w-full h-auto">
      <title>Vendor vs local — who wins what</title>
      <text x="170" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1A1815" fontFamily="Fraunces, serif">Vendor wins</text>
      {['Frontier reasoning', 'Very-long context', 'Multimodal (image/video/audio)'].map((l, i) => <g key={`v${i}`}>{diagramBox(20, 26 + i * 38, 300, l, null, '#FAF8F4', '#B85838')}</g>)}
      <text x="510" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1A1815" fontFamily="Fraunces, serif">Local wins</text>
      {['Privacy — data never leaves', 'Resilience + always-on cost', 'Sovereignty (the bright line)'].map((l, i) => <g key={`l${i}`}>{diagramBox(360, 26 + i * 38, 300, l, null, '#FAF8F4', '#5A6E3D')}</g>)}
    </svg>
  ),
  'five-opportunities': (
    <svg viewBox="0 0 680 150" role="img" aria-label="Five local A.I. opportunities: regulated industries, data-never-leaves tools, air-gapped agents, zero-internet environments, resilience-as-a-service" className="w-full h-auto">
      <title>The five local-A.I. opportunities</title>
      {[
        ['1 · Regulated industries', 'HIPAA · finance · legal'],
        ['2 · Data-never-leaves tools', 'privacy/accessibility-law market'],
        ['3 · Air-gapped agents', 'no egress path by design'],
        ['4 · Zero-internet environments', 'rural · remote · disaster'],
        ['5 · Resilience-as-a-service', 'sell continuity itself'],
      ].map((row, i) => {
        const col = i % 2;
        const r = Math.floor(i / 2);
        return <g key={i}>{diagramBox(20 + col * 330, 14 + r * 44, 310, row[0], row[1], '#FAF8F4', '#5A6E3D')}</g>;
      })}
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
                <p className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>[{it.title || 'diagram'}]</p>
              )}
              {it.caption && <figcaption className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{it.caption}</figcaption>}
            </figure>
          );
        }
        if (it.type === 'video' && it.status === 'ready' && it.src) {
          return (
            <figure key={i} className="border border-[#E8E4DC] bg-white p-2">
              <video controls src={it.src} className="w-full" aria-label={it.title} />
              {it.caption && <figcaption className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{it.caption}</figcaption>}
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
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] border border-[#B85838] px-1.5 py-0.5">Not captured yet</span>
            </div>
            {it.caption && <p className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{it.caption}</p>}
            {isClip && it.sopId && (
              <p className="text-[0.625rem] text-[#5A6E3D] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Linked SOP: {it.sopId}</p>
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
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">
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
                <p className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{q.explain}</p>
              )}
            </fieldset>
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={submit}
          className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
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
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Sequence / SOP Library · POV</div>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        Each station’s real procedure, captured first-person and paired with a written checklist. {captured} of {sequences.length} clips captured so far — the checklists stand on their own until the {pipeline?.device || 'glasses'} capture lands.
      </p>
      {pipeline && (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2 mb-3">
          <p className="text-[0.625rem] text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>Sovereign pipeline (capture-only)</p>
          <p className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{pipeline.steps?.join(' → ')}</p>
          <p className="text-[0.625rem] text-[#7A1F1F] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{pipeline.consent}</p>
        </div>
      )}
      <ul className="space-y-3">
        {sequences.map((s) => (
          <li key={s.id} className="border border-[#E8E4DC] p-3">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                {s.title}{s.founding && <span className="ml-2 text-[0.5625rem] uppercase tracking-wider text-[#B85838] border border-[#B85838] px-1.5 py-0.5">founding</span>}
              </span>
              <span className="text-[0.625rem] uppercase tracking-wider px-1.5 py-0.5 border text-[#B85838] border-[#B85838]">
                {s.clip?.status === 'captured' ? 'clip ready' : 'clip pending'}
              </span>
            </div>
            <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{s.station} · {s.owner}</p>
            {s.why && <p className="text-[0.6875rem] text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{s.why}</p>}
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              {s.steps.map((st, i) => (
                <li key={i} className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{st}</li>
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
function AgePacedLesson({ plan, onSegmentComplete, initialIndex = 0, onStepChange = null }) {
  const [idx, setIdx] = useState(() => Math.max(0, initialIndex));
  const firedRef = useRef(false);
  if (!plan || !plan.segments || plan.segments.length === 0) return null;
  const { segments, totalSegments, segmentMinutes, breakAfterSegments, checkAfterSegments, band } = plan;
  // Report a move so the host can persist the learner's place (resume-your-place).
  const moveTo = (i) => {
    const n = Math.max(0, Math.min(totalSegments - 1, i));
    setIdx(n);
    if (onStepChange) onStepChange(n);
  };

  // Adult/single-segment: just show the whole lesson, no stepper.
  if (totalSegments <= 1) {
    return (
      <p className="text-xs text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{segments[0]}</p>
    );
  }

  // Clamp so a stale saved place (a lesson re-paced shorter) can never point
  // past the last segment — it lands on the end instead of crashing.
  const cur = Math.min(idx, totalSegments - 1);
  const atLast = cur >= totalSegments - 1;
  const advance = () => {
    if (atLast) {
      if (!firedRef.current && onSegmentComplete) { firedRef.current = true; onSegmentComplete(); }
      return;
    }
    moveTo(cur + 1);
  };
  // Break nudge after every breakAfterSegments steps (young bands only).
  const showBreak = breakAfterSegments > 0 && (cur + 1) % breakAfterSegments === 0 && !atLast;
  const showCheckHint = (cur + 1) >= checkAfterSegments;

  return (
    <div className="mb-2 border border-[#E8E4DC] bg-white p-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">
          Step {cur + 1} of {totalSegments} · ~{segmentMinutes} min · {band.label} pace
        </span>
        <div className="h-1.5 w-24 bg-[#E8E4DC]" role="progressbar" aria-valuenow={cur + 1} aria-valuemin={1} aria-valuemax={totalSegments} aria-label="Lesson step">
          <div className="h-full bg-[#5A6E3D]" style={{ width: `${Math.round(((cur + 1) / totalSegments) * 100)}%` }} />
        </div>
      </div>
      <p className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">{segments[cur]}</p>
      {showBreak && (
        <p className="text-[0.6875rem] text-[#B85838] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>🙆 Quick stretch break — then keep going!</p>
      )}
      {showCheckHint && (
        <p className="text-[0.6875rem] text-[#5A6E3D] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>👇 When you’re ready, try the quick check below.</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => moveTo(cur - 1)}
          disabled={cur === 0}
          className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-40 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          ◀ Back
        </button>
        <button
          type="button"
          onClick={advance}
          className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border-2 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${atLast ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white' : 'border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#3a352f]'}`}
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
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">Research → Plan → Execute</div>
      <ol className="space-y-1">
        {steps.map((s, i) => (
          <li key={i} className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
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
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">🖐️ Go find it — touch the real thing</div>
      <ul className="space-y-2">
        {hardware.map((h, i) => (
          <li key={i} className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
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
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">On the big screen (venue)</div>
      <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        In the sanctuary this same lesson can play across every screen at the right level for each one (the video wall and the monitors together).
      </p>
      <p className="text-[0.6875rem] text-[#7A1F1F] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
        <span className="uppercase tracking-wider text-[0.5625rem] border border-[#7A1F1F] px-1.5 py-0.5 mr-1">Build target</span>
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
function TutorPanel({ module, onLaunch, tutorCourseMeta = null, handsOnLabel = 'In the app', level = DEFAULT_LEVEL, quizSaved = null, onRecordQuiz = null, ageBand = DEFAULT_AGE_BAND, levelOverride = null, onEngagement = null, venueAware = false, unitNoun = 'week', sessionFlow = null, onPlace = null }) {
  const [messages, setMessages] = useState([]); // [{ role, content, source? }]
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  // Optional "Explore your story" reveal — for a lesson that carries the L27
  // reflection method (module.explore === 'story'), the exact question is offered
  // right in the Apply stage so people DO it where they meet it, not only read it.
  const [showExplore, setShowExplore] = useState(false);
  const liveRef = useRef(null);
  const startedRef = useRef(false);
  // The lesson-flow STANDARD: one consistent five-stage arc (Open → Teach → Engage
  // → Apply → Send-off), derived from this module's authored fields, paced to the
  // learner's age/depth. The audience walks it ONE stage at a time (clear where you
  // are / what's next); each stage's body is rendered by renderStage below, reusing
  // the existing real-wired pieces (paced lesson, media, launch, quiz).
  const arc = buildLessonArc(module, { ageBand, levelOverride, sessionFlow, handsOnLabel });

  // Resume-your-place (Darrell 2026-07-30: "too easy to lose your place"):
  // if THIS lesson is the device's saved place, reopen at the saved arc stage
  // and paced step instead of the top. Read live so a stage-away-and-back
  // lands on the step the learner actually reached. Fail-soft: no saved place
  // (or a different lesson's) → 0, exactly the old behavior.
  const savedHere = (() => {
    const p = getPlace();
    return p && p.lessonId === module.id ? p : null;
  })();

  // Real engagement: this learner started this week (once per open).
  React.useEffect(() => {
    if (!startedRef.current && onEngagement) { startedRef.current = true; onEngagement('started', module.id); }
  }, [module.id, onEngagement]);

  // While THIS lesson's guide is open, it is the screen's primary reading:
  // register the FULL lesson (every teach segment, not the visible step) so the
  // floating Read Aloud control reads ONE whole lesson start to finish instead
  // of the page's mixed lesson cards (Darrell 2026-07-30). Cleared on close.
  React.useEffect(() => {
    const text = readAloudTextFromArc(buildLessonArc(module, { ageBand, levelOverride, sessionFlow, handsOnLabel }));
    if (text) setReadTarget(module.id, { label: `this ${unitNoun}`, text });
    return () => clearReadTarget(module.id);
  }, [module, ageBand, levelOverride, sessionFlow, handsOnLabel, unitNoun]);

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
              <p className="text-[0.6875rem] text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }}>
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
            <AgePacedLesson
              plan={seg.audience.lessonPlan}
              onSegmentComplete={() => onEngagement && onEngagement('segment-complete', module.id)}
              initialIndex={savedHere ? savedHere.step : 0}
              onStepChange={onPlace ? (i) => onPlace({ lessonId: module.id, step: i }) : null}
            />
            {/* Parable/story beats — short, vivid, often-funny illustrations, the way
                Jesus taught (Matthew 13:34); the teacher drops these to land the point. */}
            {Array.isArray(seg.audience.stories) && seg.audience.stories.length > 0 && (
              <div className="mt-3 space-y-2">
                {seg.audience.stories.map((s, i) => (
                  <div key={i} className="border border-[#5A6E3D] bg-[#FAF8F4] p-3">
                    {/* The label is a truth commitment: a parable is openly illustrative
                        ("Picture this…"); a testimony claims a real, lived, attributed
                        event ("A true story"). Never blur the two (DR-0076/DR-0215). */}
                    <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] mb-1">
                      {s.kind === 'testimony' ? 'A true story' : 'Picture this'}{s.title ? ` — ${s.title}` : ''}{s.kind === 'testimony' && s.source ? ` · ${s.source}` : ''}
                    </div>
                    <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{s.body}</p>
                    {s.verse && (
                      <p className="text-[0.6875rem] text-[#5A6E3D] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>— {s.verse}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
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
              <li key={i} className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{q}</li>
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
                className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
              >
                {launchLabel(module.launch)} →
              </button>
            )}
            {/* Check-for-understanding quiz (real assessment) */}
            <QuizBlock module={module} saved={quizSaved} onRecord={recordQuizAndEngage} />
            {/* Explore your story — the L27 reflection, made interactive (opt-in reveal) */}
            {module.explore === 'story' && (
              <div className="mt-3 border-t border-[#E8E4DC] pt-3">
                {!showExplore ? (
                  <button
                    type="button"
                    onClick={() => setShowExplore(true)}
                    className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                  >
                    Explore your story &mdash; read your life by His Word →
                  </button>
                ) : (
                  <div className="border border-[#E8E4DC] bg-white p-3">
                    <StoryExplorer level={level} onExit={() => setShowExplore(false)} />
                  </div>
                )}
              </div>
            )}
            {/* The master timeline, made interactive (module.explore === 'timeline'):
                the whole story as one line, connecting every OTHER lesson at its
                place -- surfaced INSIDE this lesson, in the Learn section (Darrell
                2026-07-15: "add it into the Learn section as a lesson that connects
                the others ... on their respective timelines"). */}
            {module.explore === 'timeline' && (
              <div className="mt-3 border-t border-[#E8E4DC] pt-3">
                {!showExplore ? (
                  <button
                    type="button"
                    onClick={() => setShowExplore(true)}
                    className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                  >
                    Open the timeline &mdash; see where every lesson sits →
                  </button>
                ) : (
                  <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3">
                    <BiblicalTimeline />
                    <button
                      type="button"
                      onClick={() => setShowExplore(false)}
                      className="mt-3 text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                    >
                      Close the timeline
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        );
      case 'send':
        return Array.isArray(seg.audience.benefits) && seg.audience.benefits.length > 0 ? (
          <div className="border-l-4 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] pl-3 py-2">
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">What this frees in you</div>
            <ul className="list-disc pl-4 space-y-1">
              {seg.audience.benefits.map((b, i) => (
                <li key={i} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{b}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Carry one thing from this {unitNoun} into a real moment this week.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-3 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">
        🧭 {ARI.name} — your guide for this {unitNoun}
      </div>

      {/* The lesson-flow STANDARD — one clean, paced stage at a time. Opens on
          the saved stage when this lesson is the device's place; every move is
          persisted so the place is never lost (resume-your-place). */}
      <LessonFlowAudience
        arc={arc}
        renderStage={renderStage}
        unitNoun={unitNoun}
        initialIndex={savedHere ? savedHere.stage : 0}
        onStageChange={onPlace ? (i) => onPlace({ lessonId: module.id, stage: i }) : null}
      />

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
                    <span className="block text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] mt-1">
                      {ARI.name} · the local tutor · test what it tells you
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {offline && (
          <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">
            The live tutor isn’t connected right now — but you can still finish this {unitNoun} on your own: follow <strong>“{handsOnLabel}”</strong> above and the questions to think about. Try the tutor again later.
          </p>
        )}

        <label htmlFor={`tutor-${module.id}`} className="sr-only">Ask {ARI.name} about this {unitNoun}</label>
        <div className="flex gap-2 items-end">
          <textarea
            id={`tutor-${module.id}`}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
            placeholder={`Ask ${ARI.name} anything about this ${unitNoun}…`}
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
        <p className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          {ARI.honesty}
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
  resumeLessonId = null, // "Pick up where you left off" target — opens + scrolls to this lesson
  onFocusChange = null,  // tells the wrapper a lesson space is open (it hides the course picker)
}) {
  const [showFacilitator, setShowFacilitator] = useState(false);
  const [openTutorId, setOpenTutorId] = useState(null);
  const [exportNote, setExportNote] = useState('');
  const [teaching, setTeaching] = useState(false);
  // The ONE lesson the presenter is teaching (a schedule module), or null. Distinct
  // from `teaching` (the whole-series overview): pushing a single lesson presents THAT
  // lesson's own parts, timed to itself (Darrell 2026-07-16).
  const [presentLesson, setPresentLesson] = useState(null);
  // Bumped when a lesson is opened, so the "Recently opened" cluster re-derives
  // from the user's own device-local UX history (ux-signals).
  const [recentTick, setRecentTick] = useState(0);
  // Story Library (Layer 2): the steward curation queue. Only stewards see it,
  // and only on a course whose lessons actually carry stories, so the realtime
  // subscription (story_library_submissions) never runs where it isn't used.
  const [storySubmissions, setStorySubmissions] = useState([]);

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
  // Resume-your-place: every write goes through here so the record always
  // carries THIS course's key (device-local, lib/learn-resume.js).
  const savePlace = (patch) => recordPlace({ courseKey: course.key, ...patch });

  // THE LESSON'S OWN SPACE (Darrell 2026-08-02: "each one needs a space that
  // doesn't allow for losing your place... the system sets up the reader to
  // lose their place"). Before this, all N lessons rendered stacked in one
  // scroll and the title index only scrollIntoView-jumped within the ocean —
  // any wander, reload, or tab-restore dropped the reader back into 70 lessons
  // of scroll. Now a tapped lesson OPENS ALONE: only its card renders, in a
  // contained space with a sticky bar (back to the index + previous/next).
  // The device Back button exits the space (useHistoryValue — one history
  // entry, composes with the app's nav spine), and returning to the index
  // scrolls the list to the lesson just left, so the reader's place survives
  // in BOTH directions. Opening a lesson records the resume place, so even a
  // reload lands one "Resume →" tap from the same spot.
  const [focusId, setFocusId] = useState(null);
  useHistoryValue(focusId, setFocusId, { base: null, key: 'learn-lesson-focus' });
  const focusModule = focusId ? (schedule.find((m) => m.id === focusId) || null) : null;
  const lastFocusRef = React.useRef(null);
  const openLesson = (id) => {
    lastFocusRef.current = id;
    setFocusId(id);
    savePlace({ lessonId: id });
    recordUse(id);
    setRecentTick((t) => t + 1);
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { /* no-op */ }
  };
  // The wrapper hides its own chrome (course picker/sort) while the space is
  // open — the whole screen belongs to the one lesson (DR-0264).
  React.useEffect(() => {
    if (onFocusChange) onFocusChange(!!focusModule);
    return () => { if (onFocusChange) onFocusChange(false); };
  }, [!!focusModule]); // eslint-disable-line react-hooks/exhaustive-deps

  // Leaving the space (back button/bar): put the index back at the lesson the
  // reader just left — their place in the LIST survives the round trip too.
  React.useEffect(() => {
    if (focusId !== null || !lastFocusRef.current) return undefined;
    const id = lastFocusRef.current;
    const t = setTimeout(() => {
      const el = typeof document !== 'undefined' && document.getElementById(`learn-lesson-${id}`);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'center' });
    }, 60);
    return () => clearTimeout(t);
  }, [focusId]);

  // "Pick up where you left off" — the wrapper hands down the saved lesson id;
  // open the lesson's OWN space with its guide open (the same real path a tap
  // on "Start this lesson" drives, minus the finger).
  React.useEffect(() => {
    if (!resumeLessonId || !schedule.some((m) => m.id === resumeLessonId)) return undefined;
    lastFocusRef.current = resumeLessonId;
    setFocusId(resumeLessonId);
    setOpenTutorId(resumeLessonId);
    recordUse(resumeLessonId);
    setRecentTick((t) => t + 1);
    const t = setTimeout(() => {
      try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { /* no-op */ }
    }, 80);
    return () => clearTimeout(t);
  }, [resumeLessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const prog = courseProgressSummary(progress);
  const canSendInterest = !!onSendInterest;
  // Real assessment from the learner's record (progress + quiz passes).
  const assessment = courseAssessment(schedule, progress, quizState);

  // Story Library is offered on courses whose lessons already carry stories --
  // the AI parables are the pattern the learner now curates alongside.
  const hasStories = Array.isArray(schedule) && schedule.some((m) => Array.isArray(m.stories) && m.stories.length > 0);
  React.useEffect(() => {
    // Steward-only realtime subscription; best-effort + no-op signed out.
    if (!(hasStories && isGovernor)) return undefined;
    const unsub = subscribeSubmissions(setStorySubmissions);
    return unsub;
  }, [hasStories, isGovernor]);
  const handleReview = (row, status) => { reviewSubmission(row.id, { status }); };
  const handlePromote = (row) => { promoteSubmission(row.id, row); };

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
  // Push ONE lesson -> present THAT lesson: its own parts are the scenes, timed to the
  // lesson itself (up to whatever the room has), NOT all 16 crushed into one budget.
  // The pace already chosen (ageBand) rides in, so nothing is re-introduced.
  if (presentLesson) {
    return (
      <Presenter
        presentable={lessonPresentable(presentLesson, { level: AGEBAND_TO_LEVEL_KEY[ageBand] || null, handsOnLabel })}
        initialAge={AGEBAND_TO_PRESENT_AGE[ageBand] || 'teen'}
        onClose={() => setPresentLesson(null)}
      />
    );
  }
  if (teaching) {
    return <Presenter presentable={coursePresentable(course)} initialAge={AGEBAND_TO_PRESENT_AGE[ageBand] || 'teen'} onClose={() => setTeaching(false)} />;
  }

  // The course body, reorganized behind third-row sliding chips (Darrell
  // 2026-07-04 "sliding tabs instead of a long scroll"; 2026-07-05 "a 3rd row
  // of sliding tabs if that tab scrolls really long"). The COURSE PICKER above
  // stays the section row (its activeKey drives real logic in the wrapper), so
  // this grouping is variant="sub" chips per the hierarchy: nav slides, course
  // row switches, sub-section slides. The tagline, Your-progress (the KPI
  // strip) and the graduation banner stay PINNED above the chips; every block
  // below moved VERBATIM into its section. All hooks stay at the top level, so
  // a chip switch never drops facilitator/tutor/export state.
  const sections = [
    {
      id: 'weeks',
      label: `${U.cap}s`,
      icon: 'bookOpen',
      render: () => (
        <div>
      {/* The timeline + curriculum */}
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{U.selfPaced ? (meta.weeks === 1 ? `The ${U.noun}` : `The ${meta.weeks} ${U.plural}`) : `The ${meta.weeks} ${U.plural}`}</h3>
        <span className={`text-[0.625rem] uppercase tracking-wider px-2 py-0.5 border ${U.selfPaced ? 'text-[#5A6E3D] border-[#5A6E3D]' : cohortConfirmed ? 'text-[#5A6E3D] border-[#5A6E3D]' : 'text-[#B85838] border-[#B85838]'}`}>
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
      {/* Governor-only: set / confirm the real start date + reveal the facilitator guide */}
      {isGovernor && (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-4">
          {setCohortStart && (
            <>
              <label htmlFor={`cohort-start-${meta.key}`} className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Governor · cohort 1 start date</label>
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
                    className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                  >
                    {cohortConfirmed ? 'Mark proposed' : 'Confirm dates'}
                  </button>
                )}
              </div>
              <p className="text-[0.6875rem] text-[#5A5751] mt-2 mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
                Confirming sets it for your instance; publish the date to every learner by setting the course’s <span className="font-mono">CONFIRMED_COHORT</span> in its lib file. Class-interest notes show up in your Church voice review.
              </p>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowFacilitator((v) => !v)}
            aria-pressed={showFacilitator}
            className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${showFacilitator ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
          >
            {showFacilitator ? '✓ Facilitator guide showing' : 'Show facilitator guide'}
          </button>
          {/* Every course can teach live now (was A.I.-only) — the shared Presenter
              builds its slides from this course's own schedule. Darrell 2026-06-23. */}
          <button
            type="button"
            onClick={() => setTeaching(true)}
            className="ml-2 text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            ▶ Series overview (all {meta.weeks} at a glance)
          </button>
          <p className="mt-2 text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            To teach a single session, use <strong className="text-[#5A6E3D]">▶ Present this {U.noun}</strong> on any {U.noun} below — it opens the presenter on that {U.noun} alone, timed to itself (up to 45–60 min), at the pace you’ve set. The {meta.weeks}-{U.noun} total is the whole series, not one sitting.
          </p>
        </div>
      )}
      {/* Pick-a-lesson-by-title index (Darrell 2026-07-15: "Titles etc so users
          can pick a lesson from their titles"). Every lesson renders in full
          below, so with many lessons the list is a long scroll -- this scannable
          title index jumps straight to any one. Follows the current SORT (it maps
          the already-sorted `schedule`). Shown once a course has enough lessons to
          be worth an index. */}
      {schedule.length > 4 && !focusModule && (
        <nav aria-label={`Pick a ${U.noun} by title`} className="mb-4 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-2">
            Pick a {U.noun} by title · {schedule.length}
          </div>
          {/* "Recently opened" — the view adapts to the user's OWN history (Darrell
              2026-07-15: "users preferences based on historical data about uiux").
              Device-local + private (ux-signals); empty until they open lessons. */}
          {(() => {
            void recentTick; // re-derive when a lesson is opened
            const recentIds = recentUsed(3).filter((id) => schedule.some((m) => m.id === id));
            if (recentIds.length === 0) return null;
            return (
              <div className="mb-2 pb-2 border-b border-[#E8E4DC]">
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold mb-1">Recently opened</div>
                <div className="flex flex-wrap gap-1.5">
                  {recentIds.map((id) => {
                    const m = schedule.find((x) => x.id === id);
                    const t = m.title.length > 34 ? `${m.title.slice(0, 32)}…` : m.title;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => openLesson(id)}
                        className="text-[0.6875rem] px-2 py-1 border border-[#E8E4DC] text-[#1A1815] hover:border-[#B85838] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
                        style={{ fontFamily: '"Fraunces", serif' }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          <ol className="space-y-0.5 max-h-[45vh] overflow-y-auto pr-1">
            {schedule.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => openLesson(m.id)}
                  className="w-full text-left py-1 text-sm text-[#1A1815] hover:text-[#B85838] hover:underline focus:outline focus:outline-2 focus:outline-[#B85838]"
                  style={{ fontFamily: '"Fraunces", serif' }}
                >
                  <span className="text-[#5A5751] text-[0.6875rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{U.cap} {m.week}</span>
                  {' · '}{m.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {/* The lesson's own space: a sticky bar naming where you are, the way
          back, and previous/next — the reader can never fall into the full
          list by accident. Rendered only while a lesson is open alone. */}
      {focusModule && (() => {
        const idx = schedule.findIndex((m) => m.id === focusModule.id);
        const prev = idx > 0 ? schedule[idx - 1] : null;
        const next = idx >= 0 && idx < schedule.length - 1 ? schedule[idx + 1] : null;
        return (
          <div className="sticky top-0 z-30 mb-3 bg-[#FAF8F4] border border-[#1A1815] px-3 py-2 flex items-center gap-2 flex-wrap" data-testid="lesson-space-bar">
            <button
              type="button"
              onClick={() => setFocusId(null)}
              className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              ← All {U.noun}s
            </button>
            <span className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {U.cap} {focusModule.week} of {schedule.length}
            </span>
            <span className="flex-1" />
            <button
              type="button"
              disabled={!prev}
              onClick={() => prev && openLesson(prev.id)}
              className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A5751] text-[#5A5751] enabled:hover:border-[#1A1815] enabled:hover:text-[#1A1815] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={!next}
              onClick={() => next && openLesson(next.id)}
              className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A5751] text-[#5A5751] enabled:hover:border-[#1A1815] enabled:hover:text-[#1A1815] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Next →
            </button>
          </div>
        );
      })()}
      <ol className="space-y-3">
        {(focusModule ? [focusModule] : schedule).map((m) => {
          const done = !!progress[m.id];
          const tutorOpen = openTutorId === m.id;
          return (
            <li key={m.id} id={`learn-lesson-${m.id}`} className="border border-[#E8E4DC] p-4 scroll-mt-28">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <span className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                  {U.cap} {m.week} · {m.title}
                </span>
                {!U.selfPaced && (
                  <span className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {m.date ? fmtDate(m.date) : 'date TBD'}
                  </span>
                )}
              </div>
              {/* Where this lesson sits on the biblical timeline (Darrell 2026-07-15:
                  "a lesson ... that connects the others ... on their respective
                  timelines"). Only Living Lessons are anchored on the spine, so this
                  is inert for other courses. */}
              {(() => {
                const eras = epochsForLesson(m.id).map((eid) => (getEpoch(eid) || {}).era).filter(Boolean);
                return eras.length ? (
                  <div className="mt-1 text-[0.5625rem] uppercase tracking-wider text-[#B85838]">
                    <span className="font-semibold">On the timeline:</span> {eras.join(' · ')}
                  </div>
                ) : null;
              })()}
              {/* The card's scannable preview (big idea, benefits, hands-on,
                  anchor) shows only while the guide is CLOSED. The open guide's
                  Open/Apply/Send-off stages render the SAME four fields, so
                  keeping both put the whole lesson on screen twice in one
                  scroll (reported from the phone, 2026-08-03) — one lesson,
                  one copy. */}
              {!tutorOpen && (<>
              <p className="text-sm text-[#1A1815] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{m.bigIdea}</p>
              {Array.isArray(m.benefits) && m.benefits.length > 0 && (
                <div className="mt-2 border-l-4 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] pl-3 py-2">
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">What this frees in you</div>
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
              {m.anchor?.ref && (
                <p className="text-[0.6875rem] text-[#5A6E3D] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                  <strong>Anchor — {m.anchor.ref}:</strong> {m.anchor.theme}
                </p>
              )}
              </>)}

              {/* World-Issues / Discernment modules carry a structured `issue`:
                  render the dedicated five-stage walk-through. Other courses have
                  no `issue`, so this is inert for them. */}
              {m.issue && <DiscernmentStages issue={m.issue} />}

              {/* Actions: start the week (tutor + launch), and mark done */}
              <div className="flex flex-wrap gap-2 mt-3 items-center">
                <button
                  type="button"
                  onClick={() => { if (!tutorOpen) { recordUse(m.id); setRecentTick((t) => t + 1); savePlace({ lessonId: m.id }); } setOpenTutorId(tutorOpen ? null : m.id); }}
                  aria-expanded={tutorOpen}
                  aria-controls={`tutor-panel-${m.id}`}
                  className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${tutorOpen ? 'border-[#B85838] text-[#B85838]' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
                >
                  {tutorOpen ? 'Close the guide' : `Start this ${U.noun} →`}
                </button>
                {/* Present THIS lesson — the presenter opens on the chosen lesson,
                    timed to itself, at the pace already set. Governor-only (same gate
                    as the whole-series overview). Darrell 2026-07-16. */}
                {isGovernor && (
                  <button
                    type="button"
                    onClick={() => setPresentLesson(m)}
                    className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                  >
                    ▶ Present this {U.noun}
                  </button>
                )}
                {m.launch && onLaunch && !tutorOpen && (
                  <button
                    type="button"
                    onClick={() => onLaunch(m.launch)}
                    className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                  >
                    {launchLabel(m.launch)} →
                  </button>
                )}
                {toggleModule && (
                  <button
                    type="button"
                    onClick={() => toggleModule(m.id)}
                    aria-pressed={done}
                    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${done ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
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
                    onPlace={savePlace}
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
                      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#7A1F1F] font-semibold mb-2">Deep source (read this first)</div>
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
        </div>
      ),
    },
    {
      id: 'join',
      label: 'Join',
      icon: 'users',
      render: () => (
        <div>
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
          <p className="text-[0.6875rem] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Sign in to send your interest.</p>
        )}
      </div>
      {/* Governor-only roster — who has asked to join, ACROSS instances. */}
      {isGovernor && Array.isArray(roster) && (
        <div className="border border-[#E8E4DC] p-4 mb-5">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Who wants in</h3>
            <span className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{roster.filter((r) => r && typeof r === 'object').length} interested</span>
          </div>
          {/* Real rows, defensively: ONE malformed interest row (a null, a
              non-object, a numeric timestamp) must never kill the whole Learn
              tab — this Governor-only panel is exactly why only the Governor's
              device saw "learn tab is dead" (2026-07-10) while every clean-props
              gate stayed green. Caught by church-learn-hostile-data.test.jsx. */}
          {roster.filter((r) => r && typeof r === 'object').length === 0 ? (
            <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              No one has tapped “{interestCopy.cta}” yet. When they do — from any device, on any instance — they appear here.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {roster.filter((r) => r && typeof r === 'object').map((r, i) => (
                <li key={r.id || i} className="text-xs text-[#1A1815] flex items-baseline justify-between gap-2" style={{ fontFamily: '"Fraunces", serif' }}>
                  <span>{String(r.who || r.displayName || 'A parishioner')}</span>
                  <span className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{String(r.at || r.createdAt || '').slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
        </div>
      ),
    },
    (setAgeBand || setLearnLevel || (isGovernor && engagementByAge)) ? {
      id: 'pace',
      label: 'Pace & depth',
      icon: 'sliders',
      render: () => (
        <div>
      {/* Age band — the MASTER control: one curriculum, paced + pitched to the
          learner's age (short/visual/playful for a child, deeper for an adult). */}
      {setAgeBand && (
        <div className="border border-[#E8E4DC] p-3 mb-5">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Who’s learning? (sets the pace)</div>
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
                  className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${on ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'}`}
                >
                  {b.label} <span className="opacity-70">{b.range}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[0.6875rem] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            {ageBandProfile(ageBand).pacing}
          </p>
        </div>
      )}
      {/* Fine-tune depth (optional) — the existing skill-level branching, now an
          override on top of the age band. "Auto" follows your age. */}
      {setLearnLevel && (
        <div className="border border-[#E8E4DC] p-3 mb-5">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Fine-tune depth (optional)</div>
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
                  className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${on ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'}`}
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
            <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              No engagement signals yet. As learners use the courses, each age band’s real use shows here — and the pacing defaults get tuned from it.
            </p>
          ) : (
            /* EVERY age band shows — a zero-signal band (Youth/Teen with no use
               yet) reads dimmed as "no signals yet", never dropped. "Explain all
               levels, leaves out teen" (Darrell 2026-07-19): an invisible band
               hides a gap in the pacing data instead of naming it. Rows come from
               engagementRowsByAge so the all-bands rule is proven-to-catch. */
            <ul className="space-y-1.5">
              {engagementRowsByAge(engagementByAge).map((row) => (
                <li key={row.id} className={`text-xs flex items-baseline justify-between gap-2 ${row.quiet ? 'text-[#8A857D]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"Fraunces", serif' }}>
                  <span>{row.label} <span className="text-[#5A5751]">{row.range}</span></span>
                  <span className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {row.quiet
                      ? 'no signals yet'
                      : `${row.total} signals · score ${row.score} · ${row.completed} completed`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
        </div>
      ),
    } : null,
    {
      id: 'paper',
      label: 'Paper & print',
      icon: 'pencil',
      render: () => (
        <div>
      {/* Export — Darrell trusts paper; same source as the screen */}
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-4">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Teach from paper — export the whole curriculum</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copyCurriculum} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Copy markdown</button>
          <button type="button" onClick={downloadCurriculum} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Download .md</button>
          <button type="button" onClick={printCurriculum} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Print</button>
        </div>
        {exportNote && <p className="text-[0.6875rem] text-[#5A6E3D] mt-2" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">{exportNote}</p>}
      </div>
        </div>
      ),
    },
    // Story Library (Layer 2) -- only where lessons carry stories. The learner
    // curates their own testimony/parable; a steward reviews + promotes.
    ...(hasStories ? [{
      id: 'story-library',
      label: 'Story Library',
      icon: 'pencil',
      render: () => (
        <StoryLibrary
          isGovernor={isGovernor}
          lessons={schedule}
          submissions={storySubmissions}
          onReview={handleReview}
          onPromote={handlePromote}
        />
      ),
    }] : []),
  ];

  return (
    <>
      {/* ===== Screen UI (hidden when printing) ===== */}
      <div className="print:hidden">
      {/* THE LESSON'S SECURE SPACE (DR-0264, Darrell 2026-08-03: "one you pick
          your lesson that should be for only that lesson... so the user can
          focus"). While a lesson is open alone, the course chrome — tagline,
          progress strip, graduation banner, section chips — leaves the screen
          entirely; only the focus bar + the lesson render (the weeks section
          below). Exiting the space brings the full course back. */}
      {!focusModule && (<>
      <p className="text-sm text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>{meta.tagline}</p>
      <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        For {meta.audience}. {meta.format}.
      </p>
      </>)}

      {/* Your progress — real, from the signed-in record */}
      {toggleModule && !focusModule && (
        <div className="border border-[#E8E4DC] p-4 mb-5">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Your progress</h3>
            <span className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{prog.done} of {prog.total} · {prog.pct}%</span>
          </div>
          <div className="h-2 bg-[#E8E4DC] overflow-hidden" role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Class progress">
            <div className="h-full bg-[#5A6E3D]" style={{ width: `${prog.pct}%` }} />
          </div>
          <p className="text-[0.6875rem] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Check off each {U.noun} as you finish it — this is counted from your own record, just for you.
          </p>
        </div>
      )}

      {/* Graduate → next-cohort helper (the course teaches itself forward) */}
      {assessment.complete && !focusModule && (
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

      {focusModule
        ? (sections.find((s) => s.id === 'weeks') || sections[0]).render()
        : <SectionTabs variant="sub" sections={sections} ariaLabel={`${meta.title} sections`} idBase={`learn-${meta.key}`} defaultId="weeks" />}

      {!focusModule && (
      <p className="text-[0.6875rem] text-[#5A5751] mt-5" style={{ fontFamily: '"Fraunces", serif' }}>
        Taught by Darrell Poe · The Church of the Living God · built on PoeTech. The first community we serve, the way we serve every community after.
      </p>
      )}
      </div>

      {/* ===== Print-only full curriculum (paper) ===== */}
      <div className="hidden print:block text-black">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{meta.title}</h1>
        <p><em>{meta.tagline}</em></p>
        <p>For {meta.audience}. {meta.format}.</p>
        <hr />
        {schedule.map((m) => (
          <div key={m.id} style={{ pageBreakInside: 'avoid', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{U.cap} {m.week} — {m.title}{!U.selfPaced && m.date ? ` · ${fmtDate(m.date)}` : ''}</h2>
            <p><strong>Big idea.</strong> {m.bigIdea}</p>
            {Array.isArray(m.benefits) && m.benefits.length > 0 && (
              <><p><strong>What this frees in you</strong></p>
              <ul>{m.benefits.map((b, i) => <li key={i}>{b}</li>)}</ul></>
            )}
            {m.lesson && <p><strong>Lesson.</strong> {m.lesson}</p>}
            <p><strong>{handsOnLabel}.</strong> {m.inApp}</p>
            {m.anchor?.ref && <p><strong>Anchor — {m.anchor.ref}.</strong> {m.anchor.theme}</p>}
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
  const [courseSort, setCourseSort] = useState('authored'); // picker order (DR-0121: derived groups, live counts)
  // Resume-your-place (Darrell 2026-07-30): the device's saved Learn place,
  // read once on mount (client-only app; same read-in-render pattern as
  // ux-signals' "Recently opened"). Cleared from view on resume/dismiss.
  const [savedPlace, setSavedPlace] = useState(() => getPlace());
  // The lesson CourseView should open + scroll to after a resume tap.
  const [resumeLessonId, setResumeLessonId] = useState(null);

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

  // The Eternal Algorithms as practical processing courses (DR-0126) — one
  // course per Godhead-Study section, every session DERIVED from the same
  // catalog the study renders (lib/eternal-algorithms-course.js). A pattern
  // added to the catalog joins its course on the next build; nothing here is
  // re-typed (DR-0121).
  const eternalCourses = useMemo(() => buildEternalProcessingCourses(), []);

  const courses = [aiCourse, ...(broadcastCourse ? [broadcastCourse] : []), ...builtExtras, ...eternalCourses];
  const active = courses.find((c) => c.key === activeKey) || aiCourse;

  // A lesson space is open in the active course (DR-0264): the wrapper's own
  // chrome — catalog line, course picker/sort, resume banner — leaves the
  // screen so the space holds ONLY the lesson. Set by CourseView.
  const [lessonFocus, setLessonFocus] = useState(false);

  // Resolve the saved place against the MOUNTED catalog (verify before relying
  // on it): a course or lesson that no longer exists offers nothing — the
  // banner can never point at a dead door.
  const placeCourse = savedPlace ? courses.find((c) => c.key === savedPlace.courseKey) : null;
  const placeLesson = placeCourse ? ((placeCourse.schedule || []).find((m) => m.id === savedPlace.lessonId) || null) : null;
  // Redundant while the saved lesson's guide is already the one open on screen.
  const showResume = !!placeLesson && !(activeKey === savedPlace.courseKey && resumeLessonId === savedPlace.lessonId);
  const resumeNow = () => {
    setActiveKey(savedPlace.courseKey);
    setResumeLessonId(savedPlace.lessonId);
    setSavedPlace(null);
  };
  const startFresh = () => {
    clearPlace();
    setSavedPlace(null);
  };

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
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Church · Learn</div>
        <h2 id="learn-h" className="text-2xl sm:text-3xl mt-1 mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
          {active.meta.title}
        </h2>

        {/* Derived catalog line — counted LIVE from the mounted courses (never a
            hand-typed number, DR-0121). The >= 40-lesson floor is machine-held
            by learn-catalog-render.test.jsx. */}
        {courses.length > 1 && !lessonFocus && (
          <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-2">
            {courses.length} courses · {courses.reduce((t, c) => t + ((c.schedule && c.schedule.length) || 0), 0)} lessons — every finished lesson in the PoeTech App, in one place
          </p>
        )}

        {/* Resume-your-place (Darrell 2026-07-30: "It's too easy to lose your
            place inside of the Learn space after starting one self-paced
            lesson"). The device's saved place — course, lesson, arc stage,
            paced step — offered back as ONE tap, above the picker so it is the
            first thing a returning learner meets. Device-local + private
            (lib/learn-resume.js); verified against the mounted catalog, so a
            renamed/removed lesson silently offers nothing instead of a dead
            door. */}
        {showResume && !lessonFocus && (
          <div className="mb-4 border-2 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] p-3">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">Pick up where you left off</div>
            <p className="text-sm text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              <strong>{placeCourse.meta.title}</strong> — {unitLabels(placeCourse.meta).cap} {placeLesson.week} · {placeLesson.title}
              {savedPlace.stage > 0 || savedPlace.step > 0 ? (
                <span className="text-[#5A5751]"> (part {savedPlace.stage + 1}{savedPlace.step > 0 ? `, step ${savedPlace.step + 1}` : ''})</span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resumeNow}
                className="text-[0.625rem] uppercase tracking-wider px-4 py-2 min-h-[40px] border-2 border-[#5A6E3D] bg-[#5A6E3D] text-white hover:bg-[#4a5a31] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
              >
                Resume →
              </button>
              <button
                type="button"
                onClick={startFresh}
                className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[40px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
              >
                Start fresh
              </button>
            </div>
          </div>
        )}

        {/* Course picker (Darrell 2026-07-10: "better organize the learn lessons
            with sorts and dropdowns") — 18 courses as a wall of buttons made the
            reader scroll past everything; a grouped NATIVE select opens the
            phone's own picker in one tap, with the Deep-Processing family in its
            own group and a sort control. Groups + counts derive live from the
            mounted courses (lib/learn-organize.js, DR-0121). */}
        {courses.length > 1 && !lessonFocus && (
          <div className="flex flex-wrap items-end gap-3 mb-5 border-b border-[#E8E4DC] pb-3">
            <div className="grow min-w-[14rem]">
              <label htmlFor="learn-course-pick" className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Choose a course</label>
              <select
                id="learn-course-pick"
                value={active.key}
                onChange={(e) => setActiveKey(e.target.value)}
                className="w-full min-h-[44px] px-2 py-2 bg-white border border-[#1A1815] text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                style={{ fontFamily: '"Fraunces", serif' }}
              >
                {organizeCourses(courses, courseSort).map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.courses.map((c) => (
                      <option key={c.key} value={c.key}>{c.meta.title} · {courseLessonCount(c)} lessons</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="learn-course-sort" className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Sort</label>
              <select
                id="learn-course-sort"
                value={courseSort}
                onChange={(e) => setCourseSort(e.target.value)}
                className="min-h-[44px] px-2 py-2 bg-white border border-[#E8E4DC] text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                style={{ fontFamily: '"Fraunces", serif' }}
              >
                {COURSE_SORTS.map((sOpt) => <option key={sOpt.key} value={sOpt.key}>{sOpt.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* WORD-FIRST (DR-0127): every knowledge space opens with Yahweh's
          knowledge/perspective when we have it — derived from the course's own
          declared lead or its first Scripture anchor, never invented. A course
          with neither renders nothing here and the census test reports it. */}
      {(() => {
        const lead = wordFirstLead(active);
        if (!lead) return null;
        return (
          <div className="mb-4 border-l-2 border-[#5A6E3D] bg-[#FAF8F4] px-3 py-2 print:hidden">
            <div className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">Word-first · Yahweh&apos;s knowledge opens this space</div>
            <p className="text-sm text-[#1A1815] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
              <strong>{lead.ref}</strong>{lead.frame ? ` — ${lead.frame}` : ''}
            </p>
          </div>
        );
      })()}

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
        resumeLessonId={resumeLessonId}
        onFocusChange={setLessonFocus}
      />
    </section>
  );
}
