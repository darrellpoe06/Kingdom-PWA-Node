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
import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  CLASS_META, PROPOSED_COHORT_START, SESSION_FLOW,
  buildSchedule, progressSummary, exportCurriculumMarkdown, formatClassDate,
} from '../lib/church-classes.js';
import { askTutor } from '../lib/class-tutor.js';
import { ARI } from '../lib/ari.js';
import {
  LEARN_LEVELS, DEFAULT_LEVEL, normalizeMedia, gradeQuiz, courseAssessment,
  AGE_BANDS, DEFAULT_AGE_BAND, ageBandProfile, resolveForAge,
} from '../lib/learn-framework.js';
import { GENERATIVE_VISUAL_PIPELINE } from '../lib/venue-cast.js';
import { buildEternalProcessingCourses, wordFirstLead } from '../lib/eternal-algorithms-course.js';
import { buildLessonArc, sessionMinutesFromFlow, readAloudTextFromArc } from '../lib/lesson-flow.js';
import { courseDuration, formatDuration } from '../lib/course-duration.js';
import { formatLessonText, lessonPoints, lessonSectionPlan } from '../lib/lesson-format.js';
import { walkState, stepParagraph, stepPoint } from '../lib/lesson-walk.js';
import { useOpenWithTheWord } from '../lib/show-the-word.js';
import { setReadTarget, clearReadTarget, requestRead } from '../lib/read-target.js';
import { currentSentence, landOnPlace } from '../lib/lesson-landing.js';
import { parseLessonLink, lessonUrl, lessonCopyBlock, lessonSharePayload, courseSharePayload, sectionSharePayload } from '../lib/lesson-links.js';
import { matrixFor, matrixBlockText, readNextInvitation } from '../lib/scripture-matrix.js';
import CopyButton from './CopyButton.jsx';
import ShareButton from './ShareButton.jsx';
import StoryLibrary from './StoryLibrary.jsx';
import { subscribeSubmissions, reviewSubmission, promoteSubmission } from '../lib/story-library.js';
import { engagementRowsByAge } from '../lib/learn-engagement.js';
import { LessonFlowAudience, LessonRunOfShow, TimeFit } from './LessonFlow.jsx';
import StoryExplorer from './games/StoryExplorer.jsx';
import BiblicalTimeline from './BiblicalTimeline.jsx';
// Timeline context now comes from lesson-timeline-context (curated placements
// still win; the rest derive from the Scripture each lesson cites), which
// replaced the direct epochsForLesson/getEpoch lookups this file used to do.
import { timelineContextFor, timelineContextText } from '../lib/lesson-timeline-context.js';
import { workedCaseText } from '../lib/worked-case.js';
import Presenter from './Presenter.jsx';
import DiscernmentStages from './DiscernmentStages.jsx';
import { coursePresentable, lessonPresentable } from '../lib/presentable.js';

// The learner's chosen age band -> (present-mode pace, lesson-level key). One lesson
// is presented at the pace already picked, so present mode never re-asks it.
const AGEBAND_TO_PRESENT_AGE = { child: 'child', youth: 'teen', teen: 'teen', adult: 'adult', senior: 'adult' };
const AGEBAND_TO_LEVEL_KEY = { child: 'child', youth: 'teen', teen: 'teen', adult: null, senior: 'senior' };
import SectionTabs from './SectionTabs.jsx';
import { catalogMeta } from '../lib/learn-catalog.js';
import { crossListingsFor, resolveCrossListed, crossListedCount, courseCrossListingsFor, resolveCourseCrossListed, courseCrossListedCount } from '../lib/learn-crosslist.js';
// THE ETERNAL ALGORITHMS LIVE INSIDE LEARN (DR-0432; Darrell 2026-09-15: "put
// the Eternal Algorithms inside learn... Moving current tabs around for
// functionality and flow"). The study surface is unchanged; it is mounted
// under its own department here, loaded only when that department opens.
const EternalAlgorithmsStudyLazy = React.lazy(() => import('./EternalAlgorithmsStudy.jsx'));
import { organizeCourses, learnDepartments, courseLessonCount, COURSE_SORTS, buildLessonIndex, searchLessons, browseLessons, browseCount, rememberedCourseKey, rememberCourseKey } from '../lib/learn-organize.js';
import { wantsSections, sectionLessons, divisionOf } from '../lib/lesson-sections.js';
import { isNumberedCourse, ownNumber, inNumberOrder, numberLabel, lessonCountLabel, ordersFor, orderLessons, withMonthHeadings, formatAdded, DEFAULT_LESSON_ORDER, rememberedLessonOrder, rememberLessonOrder } from '../lib/lesson-order.js';
import { subscribeTextSize } from '../lib/text-size.js';
import { plainWordsFor, plainWordLine } from '../lib/learn-plain-words.js';
import { recordUse, recentUsed } from '../lib/ux-signals.js';
import { getPlace, getPlaceFor, listPlaces, placeInProgress, placeWhere, recordPlace, finishPlace, clearPlace, getTimeFit, recordTimeFit, refreshPlace, placeIsFinished } from '../lib/learn-resume.js';
import { unitLabels } from '../lib/learn-units.js';
import { ContinueOffer, ContinueChip, RowContinue, resolvePlaces } from './LessonContinue.jsx';
import { useHistoryValue } from '../lib/nav-history.js';
import { motionBehavior } from '../lib/gentle-motion.js';
import UiIcon from './UiIcon.jsx';
import WordInline from './WordInline.jsx';
import VerseChips from './VerseChips.jsx';
import LessonTeacher from './LessonTeacher.jsx';
import { useTextToSpeech } from '../lib/tts.js';
import { anchorIsRun, referencesIn } from '../lib/verse-refs.js';
import ShowTheWordToggle from './ShowTheWordToggle.jsx';
import { useScreenAwake } from '../lib/screen-awake.js';

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
export function QuizBlock({ module, saved, onRecord }) {
  const [answers, setAnswers] = useState({});
  const [graded, setGraded] = useState(null);
  // THE CHECK READS ITS CHOICES TO A LITTLE LEARNER (DR-0431). A pre-K child
  // cannot read the options, so a course whose decoys are letters and numbers
  // (never a wrong teaching) opts in with readOptionsAloud: the options leave
  // the reader's mute and each carries a speaker that says just that option.
  const readOptions = !!module.readOptionsAloud;
  const optionTts = useTextToSpeech();
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
              {/* THE READER MUST NOT SPEAK THE ANSWER OPTIONS (2026-09-14).
                  Captured from a real reading: the reader recited all four
                  options of every question as if they were teaching, WRONG
                  ANSWERS INCLUDED -- "Whatever the world puts in front of you",
                  "Mostly your problems, so you stay prepared", "It is still
                  undecided". A listener who cannot see the screen has no way to
                  know those are decoys, so the reading was teaching error in
                  Yahweh's name. The QUESTION (the legend) is still read, because
                  hearing the question is the point; the options are a control to
                  be tapped, not content to be recited. */}
              <div {...(readOptions ? {} : { 'data-read-skip': true })} className="space-y-1">
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
                      {readOptions && (
                        <button type="button" onClick={(e) => { e.preventDefault(); try { optionTts.speak(opt); } catch (_) { /* no engine */ } }}
                          aria-label={`Hear this choice: ${opt}`} data-read-skip
                          className="ml-auto shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center border border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"><UiIcon name="volume" /></button>
                      )}
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
// LessonProse — every lesson text renders as NUMBERED SECTIONS with short
// breath lines instead of a run-on prose wall (Darrell 2026-08-25: "bullet
// points with the number next to the sections... instead of looking like
// run-on sentences"). The structure is derived from markers the author wrote
// (FIRST/SECOND..., I./II., SOIL n) by lib/lesson-format.js — not one word is
// altered, so the verse-pin gates hold untouched. Lessons without markers
// still gain sentence-grouped breathing room.
// -----------------------------------------------------------------------------
// LessonPoints — THE SPEAKER'S INDEX, and the reason it exists.
//
// Darrell 2026-09-13, from behind a pulpit rather than behind a screen: "we
// need the speaker to be able to keep their place while looking away from the
// text to look people in their eyes... we also want the number of points to be
// known and for them to be available in a list somehow."
//
// A preacher glancing down for half a second cannot re-read a paragraph to find
// where they were. They need three things in that half second: HOW MANY points
// there are, WHICH one they are on, and a target big enough to hit without
// looking. So the count is stated in words, every point is one row carrying its
// own number badge, and the current one is marked.
//
// A lesson with no points says so plainly rather than showing an empty list:
// 60 of the 144 lessons are flowing narrative whose author wrote no point
// structure, and inventing an outline for those would be fabricating one.
export function LessonPoints({ text, activeIndex = -1, onJump = null }) {
  const points = useMemo(() => lessonPoints(text), [text]);
  // FOLLOWS THE HOUSE SWITCH rather than carrying its own state. The fold gate
  // caught a local useState here and was right to: "Open with the Word" is how
  // a reader says show me everything, and a speaker who flips it wants the
  // outline open too. A tap still flips this one fold on top of the switch.
  const [open, setOpen] = useOpenWithTheWord();
  if (!points.length) {
    return (
      <p className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">
        One continuous reading — no numbered points in this lesson.
      </p>
    );
  }
  return (
    <div className="mb-2 border border-[#1A1815] bg-[#FAF8F4]">
      <button
        type="button"
        onClick={setOpen}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-2 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5A6E3D] focus-visible:ring-offset-2"
      >
        <span className="text-[0.6875rem] uppercase tracking-wider font-semibold text-[#1A1815]">
          {points.length} {points.length === 1 ? 'point' : 'points'} in this lesson
        </span>
        <span aria-hidden="true" className="text-[0.6875rem] text-[#5A5751]">{open ? '\u25B4 hide' : '\u25BE show'}</span>
      </button>
      {open && (
        <ol className="border-t border-[#E8E4DC] px-2 py-1.5 space-y-1">
          {points.map((pt) => {
            const here = activeIndex >= 0 && pt.itemIndex === activeIndex;
            return (
              <li key={pt.n}>
                <button
                  type="button"
                  onClick={onJump ? () => onJump(pt.itemIndex) : undefined}
                  aria-current={here ? 'true' : undefined}
                  className={`flex w-full items-start gap-2 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5A6E3D] focus-visible:ring-offset-2 ${here ? 'font-semibold text-[#1A1815]' : 'text-[#5A5751]'}`}
                >
                  <span aria-hidden="true" className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 border border-[#1A1815] bg-[#1A1815] text-white text-[0.625rem] font-bold">{pt.n}</span>
                  <span className="text-xs leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>{pt.label}</span>
                  {here && <span className="ml-auto text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D]">here</span>}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// LessonReader — the prose PLUS the speaker's controls (DR-0380).
//
// Wraps LessonProse with the two strides Darrell asked for and a live "point 3
// of 7" read-out. The arrows are deliberately large and always in the same
// place: a speaker reaching for them is not looking at them.
export function LessonReader({ text, className = 'text-xs text-[#1A1815]' }) {
  const { items } = useMemo(() => formatLessonText(text), [text]);
  const [at, setAt] = useState(0);
  const boxRef = useRef(null);

  const go = (i) => {
    setAt(i);
    const el = boxRef.current && boxRef.current.querySelector(`[data-point-index="${i}"], [data-para-index="${i}"]`);
    if (el) {
      try { el.scrollIntoView({ behavior: motionBehavior ? motionBehavior() : 'smooth', block: 'start' }); } catch { /* no-op */ }
      try { el.focus({ preventScroll: true }); } catch { /* not focusable, fine */ }
    }
  };

  if (!items.length) return null;
  const st = walkState(items, at);

  return (
    <div>
      <LessonPoints text={text} activeIndex={st.point ? st.point.itemIndex : -1} onJump={go} />
      <div ref={boxRef}><LessonProse text={text} className={className} /></div>
      {items.length > 1 && (
        <div className="sticky bottom-0 mt-2 flex items-center gap-1.5 border-t border-[#E8E4DC] bg-[#FAF8F4] py-2">
          <button
            type="button" disabled={!st.canBack} onClick={() => go(stepParagraph(items, at, -1))}
            aria-label="Back one paragraph"
            className="min-h-[44px] flex-1 border border-[#1A1815] px-2 text-[0.6875rem] font-semibold text-[#1A1815] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5A6E3D] focus-visible:ring-offset-2"
          >&#9664; Paragraph</button>
          {st.hasPoints && (
            <button
              type="button" onClick={() => go(stepPoint(items, at, -1))}
              aria-label="Back one point"
              className="min-h-[44px] flex-1 border border-[#1A1815] px-2 text-[0.6875rem] font-semibold text-[#1A1815] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5A6E3D] focus-visible:ring-offset-2"
            >&#9664;&#9664; Point</button>
          )}
          <span aria-live="polite" className="px-1 text-center text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
            {st.point ? `Point ${st.point.ordinal} of ${st.point.total}` : 'Opening'}
          </span>
          {st.hasPoints && (
            <button
              type="button" onClick={() => go(stepPoint(items, at, 1))}
              aria-label="Forward one point"
              className="min-h-[44px] flex-1 border border-[#1A1815] px-2 text-[0.6875rem] font-semibold text-[#1A1815] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5A6E3D] focus-visible:ring-offset-2"
            >Point &#9654;&#9654;</button>
          )}
          <button
            type="button" disabled={!st.canForward} onClick={() => go(stepParagraph(items, at, 1))}
            aria-label="Forward one paragraph"
            className="min-h-[44px] flex-1 border border-[#1A1815] px-2 text-[0.6875rem] font-semibold text-[#1A1815] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5A6E3D] focus-visible:ring-offset-2"
          >Paragraph &#9654;</button>
        </div>
      )}
    </div>
  );
}

// THE PROSE READS CLEAN; THE WORD WAITS AT THE FOOT OF ITS SECTION.
//
// Darrell 2026-09-14, on the living lessons, with elderly church founders as
// the readers he is building for: "Don't block the lesson words... just have
// them below each section they refer to like in the storyline section...
// sometimes there would be up to 4 scriptures and again the green button on
// top to open all at once... so I or users don't have to click each one
// separately... however they can if they want to... scripture stays green
// goes to the bottom of that section that it was referring to." And, sharper:
// "No tabs, none ever — it's not good, undermines readers."
//
// DR-0402 had routed every paragraph through WordInline, which boxes each
// reference as an inline button MID-SENTENCE. Those boxes are the "tabs". So:
// every paragraph is plain text again — the reference stays in the sentence as
// the author's own words, exactly as written — and the references a SECTION
// named are gathered once, at that section's foot, as green chips (VerseChips,
// tone "word"), each openable in place, all opened by the page-top Show the
// Word switch. A section is a numbered heading and the lines under it; a
// lesson with no headings treats each line as its own section, so a reference
// is never further than the paragraph that named it (never a list at the end —
// DR-0392 finding 5 / DR-0402).
//
// The landmarks stay exactly where DR-0402 D2 put them: data-point-index /
// data-point-n / tabIndex -1 on a heading (the speaker index's scroll target
// and focus target), data-para-index on a line (the paragraph stepper).
//
// THE STANDARD IS LESSON 127 (Darrell 2026-09-15, listening to it at Big Print:
// "No I don't like the buttons fix nor the other one with the green... use
// lesson 127 that flows correctly... as the standard"). MEASURED, not guessed,
// through this very component: L127 renders 10 numbered sections, 60 lines, 8
// green strips carrying 2-9 chips each — a strip about every 5-6 lines. Lesson
// 1 and 43 other lessons have NO headings, so the rule above made every line
// its own section and a strip landed after nearly every paragraph (L1: 25
// lines, 12 strips). L128 put 141 chips in ONE strip; L126 51. Both are the
// broken flow he named, and both are the same defect: the strip rhythm was
// tied to the author's markers instead of to the reader's eye.
//
// So the rhythm is now L127's, for every lesson: a section is a heading and
// the lines under it, but a section's lines are grouped into BLOCKS of at most
// SECTION_RHYTHM.maxLines lines, and a block closes early rather than let its
// strip grow past SECTION_RHYTHM.maxRefs chips. Each block carries its own
// strip at its foot — so a reference is never further than a few lines from
// the paragraph that named it, never a wall of chips, and never a strip after
// every sentence. Same program as 127, with tweaks. Not one word of prose
// changes; only where the green waits.
export const SECTION_RHYTHM = Object.freeze({ maxLines: 6, maxRefs: 9 });

export function lessonSections(items, rhythm = SECTION_RHYTHM) {
  const maxLines = Math.max(1, rhythm.maxLines || SECTION_RHYTHM.maxLines);
  const maxRefs = Math.max(1, rhythm.maxRefs || SECTION_RHYTHM.maxRefs);
  const blocks = [];
  const open = (it, i) => blocks.push({ items: [{ ...it, i }], lines: it.kind === 'heading' ? 0 : 1, refs: new Set(referencesIn(it.text)) });
  items.forEach((it, i) => {
    const last = blocks[blocks.length - 1];
    if (it.kind === 'heading' || !last) { open(it, i); return; }
    const refs = referencesIn(it.text);
    const wouldCarry = new Set([...last.refs, ...refs]).size;
    if (last.lines >= maxLines || (last.refs.size > 0 && wouldCarry > maxRefs)) { open(it, i); return; }
    last.items.push({ ...it, i });
    last.lines += 1;
    refs.forEach((r) => last.refs.add(r));
  });
  // The strip reads in Scripture order, from the block's own words.
  return blocks.map((b) => ({ items: b.items, refs: referencesIn(b.items.map((it) => it.text).join(' ')) }));
}

// `plan` is the WHOLE lesson's numbering, computed once by the caller and
// handed to every step (DR-0520). Without it each step restarted at 1 and three
// different points on one screen were all called 1. A single-text caller passes
// nothing and the text plans itself, exactly as before.
export function LessonProse({ text, plan = null, className = 'text-xs text-[#1A1815]' }) {
  const { items } = formatLessonText(text, plan);
  if (!items.length) return null;
  const sections = lessonSections(items);
  const serif = { fontFamily: '"Fraunces", serif' };
  return (
    <div className={className} style={serif}>
      {sections.map((sec, si) => (
        <React.Fragment key={si}>
          {sec.items.map((it) => (
            it.kind === 'heading' ? (
              // data-point-index is the jump target the speaker's index scrolls to,
              // and the paragraph stepper's landmark. tabIndex -1 so a jump can move
              // FOCUS there too, not just the scroll position — a speaker using a
              // switch or a keyboard needs the caret to follow their eyes.
              <p
                key={it.i}
                data-point-index={it.i}
                data-point-n={it.n}
                tabIndex={-1}
                className={`font-semibold ${it.i === 0 ? '' : 'mt-3'} scroll-mt-24`}
              >
                <span aria-hidden="true" className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 mr-1.5 border border-[#1A1815] bg-[#1A1815] text-white text-[0.625rem] font-bold align-middle">{it.n}</span>
                {it.text}
              </p>
            ) : (
              <p key={it.i} data-para-index={it.i} className="mt-1.5 scroll-mt-24">{it.text}</p>
            )
          ))}
          {sec.refs.length > 0 && (
            // data-block-lines: the rendered truth of the rhythm, read by the
            // chrome-layout probe (lines in THIS block, headings excluded).
            <VerseChips refs={sec.refs} tone="word" lead className="mt-1.5" data-testid="section-refs" data-block-lines={sec.items.filter((it) => it.kind !== 'heading').length} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// AgePacedLesson — renders the authored lesson PACED to the learner's age band.
// THE LEVEL IS CHOSEN INSIDE THE LESSON (DR-0417).
//
// Darrell 2026-09-15: "can we bring those level controls into each lesson so
// it can be chosen even inside the lessons like the PowerPoint currently do?
// Flexibility with rigorous control of the system and processes." The
// Presenter keeps its "Who is in the room" radio row reachable the whole way
// through a message; the course's only age control lived on the "Pace & depth"
// tab, two taps away from the words it changes. This is the same row, at the
// top of the paced core, wired to the SAME device-remembered state — one
// setting, now reachable where it is felt.
//
// SURFACE SAYS TRUTH. The screenshot that raised this read "STEP 1 OF 41 ·
// CHILD PACE" over the ADULT text: a standing depth override (learnLevel) wins
// over the band in resolveForAge, so the pace said child while the words did
// not. Two rules follow. (1) A fresh age pick here means "pitch it for this
// age": it clears a standing override, so the words change with the pace.
// (2) Whenever the words being read are not the band's own level — an
// override, or a lesson with no version at that level — the row says so in a
// sentence, with the way back beside it.
const LEVEL_WORDS = { child: 'Child', teen: 'Teen', standard: 'Adult', senior: 'Senior' };
function levelWords(id) { return LEVEL_WORDS[id] || id; }

export function LessonLevelControl({
  band, levelId, levelOverride = null, setAgeBand, setLearnLevel = null, branched = true,
}) {
  if (!band || typeof setAgeBand !== 'function') return null;
  const overridden = Boolean(levelOverride);
  // BRANCHED IS THE TRUTH; levelId ALONE IS NOT (Darrell 2026-09-19, with two
  // screenshots of the same Development lesson at TEEN and at ADULT showing
  // byte-identical text: "Not diversity in lessons!!!!!! Same lesson on all
  // levels?!!!!! Won't change?").
  //
  // He was right and the notice below was ALREADY written to say so -- it just
  // could never fire. For a lesson carrying NO authored bands, resolveForAge
  // falls through to the plain `lesson` and returns `levelId: chain[0]`, which
  // IS the band's own depth. So `levelId !== band.depth` was false for every
  // band, on every bandless lesson, and the row stayed silent while the words
  // never changed. The flag that actually knows is `branched`, which
  // resolveForAge has returned all along and no caller passed in.
  //
  // Measured the same day: of 317 course lessons (Living Lessons excluded,
  // its own ratchets own those), ZERO carry all four bands and 37 carry none.
  // So this row was quietly implying a choice on hundreds of lessons that have
  // exactly one version. It now says which it is.
  const fellBack = !overridden && (!branched || (levelId && levelId !== band.depth));
  const noneAuthored = !overridden && !branched;
  const pick = (id) => {
    setAgeBand(id);
    if (overridden && setLearnLevel) setLearnLevel('auto');
  };
  const chip = (on) => `text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${on ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'}`;
  return (
    // The reader never speaks this row (data-read-skip): it is a control, not
    // the lesson, and read-reveal never clicks a radio (no aria-expanded).
    <div className="mb-2" data-read-skip="true" data-testid="lesson-level-control">
      <div role="radiogroup" aria-label="Who is learning? Sets the words and the pace" className="flex flex-wrap gap-1">
        {AGE_BANDS.map((b) => {
          const on = band.id === b.id;
          return (
            <button key={b.id} type="button" role="radio" aria-checked={on} title={b.hint} onClick={() => pick(b.id)} className={chip(on)}>
              {b.label} <span className="opacity-70">{b.range}</span>
            </button>
          );
        })}
      </div>
      {overridden && (
        <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Depth is set to {levelWords(levelOverride)}: these are the {levelWords(levelId)} words at {band.label} pace.
          {setLearnLevel && (
            <button type="button" onClick={() => setLearnLevel('auto')} className="ml-1 underline min-h-[36px] text-[#5A6E3D] focus:outline focus:outline-2 focus:outline-[#B85838]">
              Follow my age instead
            </button>
          )}
        </p>
      )}
      {fellBack && (
        <p data-testid="lesson-level-fellback" className="text-[0.6875rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          {noneAuthored
            ? `This lesson has one version for every age so far, so switching here changes the pace, not the words. The ${band.label} version has not been written yet.`
            : `This lesson has no ${band.label} version yet: these are the ${levelWords(levelId)} words at ${band.label} pace.`}
        </p>
      )}
    </div>
  );
}

// The same authored text is chunked into developmentally-sized segments
// (learn-framework lessonPlanForAge); younger bands get a short stepper with break
// nudges and a quick-win "Got it!" affordance, the adult band gets the whole lesson
// at once. The text is never invented or summarized — only chunked. Reaching the
// last segment fires onSegmentComplete once (real engagement signal).
// -----------------------------------------------------------------------------
// Exported for the read-along test: the paced core is the thing that was
// truncating a hands-free listen, and the honest way to pin it is to render THIS
// component with a real multi-step plan. Reaching it through the full ChurchLearn
// tree meant the assertion depended on which course/session view happened to
// mount, which is how the first draft of that test passed while proving nothing.
export function AgePacedLesson({ plan, onSegmentComplete, initialIndex = 0, onStepChange = null, showAll = false, flush = false, setAgeBand = null, setLearnLevel = null, levelOverride = null }) {
  const [idx, setIdx] = useState(() => Math.max(0, initialIndex));
  const firedRef = useRef(false);
  // A MID-LESSON LEVEL CHANGE KEEPS THE LEARNER'S PLACE (DR-0418).
  //
  // Darrell 2026-09-15: "Even if half of the way through they decided to
  // change levels they can... make sense?" Picking a level re-chunks the text
  // (child 45 words a step, adult 200), so step 20 of 41 in the child words is
  // not step 20 of the adult words — the clamp below would have dropped a
  // learner who switched half-way onto the LAST step, which reads as "the
  // lesson ended." The honest mapping between two differently-cut versions of
  // the same message is proportional: half-way stays half-way. Reported
  // through onStepChange so the saved place follows the learner too.
  const totalRef = useRef(plan && plan.totalSegments ? plan.totalSegments : 0);
  React.useEffect(() => {
    const now = plan && plan.totalSegments ? plan.totalSegments : 0;
    const was = totalRef.current;
    totalRef.current = now;
    if (!was || !now || was === now) return;
    setIdx((i) => {
      const mapped = Math.min(now - 1, Math.max(0, Math.round((i / was) * now)));
      if (mapped !== i && onStepChange) onStepChange(mapped, totalSegments);
      return mapped;
    });
  }, [plan && plan.totalSegments]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!plan || !plan.segments || plan.segments.length === 0) return null;
  // `branched` rides the plan already (lessonPlanForAge passes resolveForAge's
  // own flag straight through) and was simply never read here -- which is the
  // whole reason the no-version-yet notice could not fire on a bandless lesson.
  const { segments, totalSegments, segmentMinutes, breakAfterSegments, checkAfterSegments, band, levelId, branched } = plan;
  // ONE numbering for the whole lesson, handed to every step (DR-0520). The
  // pacer cuts the band into steps and each step used to number itself, so
  // Step 1 showed points 1, 2, 3 and Step 2 opened with another point 1.
  // Darrell, with the screenshots: "Why do we count from 1 - whatever each
  // section?!" Derived from the segments themselves, so the count can never
  // describe text the reader is not being shown.
  const sectionPlan = lessonSectionPlan(segments.join(' '));
  // In the lesson's own space the box loses its side walls (see TutorPanel).
  const box = flush ? 'mb-2 border-y border-[#E8E4DC] bg-white py-2' : 'mb-2 border border-[#E8E4DC] bg-white p-2';
  // The in-lesson level row (DR-0417) — only where a host hands in the setter,
  // so every existing caller renders exactly as before.
  const control = setAgeBand
    ? <LessonLevelControl band={band} levelId={levelId} levelOverride={levelOverride} setAgeBand={setAgeBand} setLearnLevel={setLearnLevel} branched={branched} />
    : null;

  // READ-ALONG READS THE WHOLE CORE, NOT STEP ONE OF IT.
  //
  // Darrell 2026-08-13, watching the reader run on Session 8: "only part 1 of
  // the core is taught or read by the reader… I want to hear the whole lesson
  // and course from one play action."
  //
  // The pacing exists for a READER, who chooses when to turn the page. A
  // LISTENER cannot, and the reveal that already exists for read-along stopped
  // one level short: `showAll` opened every ARC STAGE (Open, Teach, Engage,
  // Apply, Send-off), but the Teach stage's own paced steps live in here, and
  // this component rendered `segments[cur]` — exactly one — regardless. So a
  // hands-free listener heard the first chunk of the core and then the next
  // stage, with the rest of the teaching never entering the DOM to be read.
  //
  // In read-along the whole core renders in order, with its step markers kept
  // so the listener still hears where they are. Outside read-along the stepper
  // is untouched — the reader's pacing is not the listener's problem and vice
  // versa.
  if (showAll && totalSegments > 1) {
    return (
      <div className={`${box} space-y-2`}>
        {control}
        {segments.map((s, i) => (
          <div key={i}>
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">
              Step {i + 1} of {totalSegments} · ~{segmentMinutes} min · {band.label} pace
            </span>
            <div className="mt-1"><LessonProse text={s} plan={sectionPlan} /></div>
          </div>
        ))}
      </div>
    );
  }
  // Report a move so the host can persist the learner's place (resume-your-place).
  const moveTo = (i) => {
    const n = Math.max(0, Math.min(totalSegments - 1, i));
    setIdx(n);
    if (onStepChange) onStepChange(n, totalSegments);
  };

  // Adult/single-segment: just show the whole lesson, no stepper.
  if (totalSegments <= 1) {
    return (
      <div className="mb-2">{control}<LessonProse text={segments[0]} plan={sectionPlan} /></div>
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
    <div className={box}>
      {control}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">
          Step {cur + 1} of {totalSegments} · ~{segmentMinutes} min · {band.label} pace
        </span>
        <div className="h-1.5 w-24 bg-[#E8E4DC]" role="progressbar" aria-valuenow={cur + 1} aria-valuemin={1} aria-valuemax={totalSegments} aria-label="Lesson step">
          <div className="h-full bg-[#5A6E3D]" style={{ width: `${Math.round(((cur + 1) / totalSegments) * 100)}%` }} />
        </div>
      </div>
      <div aria-live="polite"><LessonProse text={segments[cur]} plan={sectionPlan} /></div>
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
// `flush` — the lesson is open in its OWN space (DR-0264), so the reading
// column takes the page's full width: this panel and the stage/paced boxes
// inside it drop their side borders and side padding (see the `li` below).
function TutorPanel({ module, onLaunch, tutorCourseMeta = null, handsOnLabel = 'In the app', level = DEFAULT_LEVEL, quizSaved = null, onRecordQuiz = null, ageBand = DEFAULT_AGE_BAND, levelOverride = null, setAgeBand = null, setLearnLevel = null, onEngagement = null, venueAware = false, unitNoun = 'week', sessionFlow = null, onPlace = null, onAdvance = null, flush = false, onAllUnits = null, onStartOver = null }) {
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
  // HOW MUCH TIME DO YOU HAVE (Darrell 2026-08-10: "capable of being scaled down
  // to the most minimal times and full lesson for those that have time all in
  // the Ways"). DR-0215 decided the curriculum adjusts to the allotted time by
  // PACING, never cutting — and reflowArcMinutes could always do it — but the
  // only control lived in the Governor's facilitator panel, so a learner could
  // not reach it. Their choice is remembered on their own device; unset means
  // the course's authored session length, exactly as before.
  const [timeFit, setTimeFit] = useState(() => getTimeFit());
  const chooseTime = (n) => { setTimeFit(n); recordTimeFit(n); };
  const arc = buildLessonArc(module, {
    ageBand, levelOverride, sessionFlow, handsOnLabel,
    ...(timeFit ? { targetMinutes: timeFit } : {}),
  });

  // Resume-your-place (Darrell 2026-07-30: "too easy to lose your place"):
  // if THIS lesson is the device's saved place, reopen at the saved arc stage
  // and paced step instead of the top. Read live so a stage-away-and-back
  // lands on the step the learner actually reached. Fail-soft: no saved place
  // (or a different lesson's) → 0, exactly the old behavior.
  // A LESSON THAT IS OVER REOPENS AT PART ONE (Darrell 2026-09-16: "if it's
  // over, it's over. So it needs to be able to recognize that the lesson was
  // over and you want to re-listen to the same freaking lesson"). A finished
  // place still names this lesson — that is how the reader knows it was heard
  // — but it is no longer a place to resume INTO, so the arc opens at its top
  // instead of at the last part with nothing left to play (learn-resume.js).
  // THIS LESSON'S OWN PLACE, not the device's latest (DR-0631). With one
  // record per device, opening lesson A after lesson B found B's place, so A
  // reopened at part one — the reader's place in A had been overwritten the
  // moment B was opened. Each lesson now keeps its own.
  const savedHere = (() => {
    const p = getPlaceFor(null, module.id);
    if (!p) return null;
    return placeIsFinished(p) ? null : p;
  })();

  // Real engagement: this learner started this week (once per open).
  React.useEffect(() => {
    if (!startedRef.current && onEngagement) { startedRef.current = true; onEngagement('started', module.id); }
  }, [module.id, onEngagement]);

  // While THIS lesson's guide is open, it is the screen's primary reading:
  // register the FULL lesson (every teach segment, not the visible step) so the
  // floating Read Aloud control reads ONE whole lesson start to finish instead
  // of the page's mixed lesson cards (Darrell 2026-07-30). Cleared on close.
  //
  // FOLLOW-ALONG (2026-08-10): the registration also names the ELEMENT that
  // renders this lesson and hands the reader a `prepare` switch. Composed text
  // alone could only be highlighted by searching for each spoken sentence in
  // the DOM, and this lesson's spoken text is composed ("Anchor scripture — …")
  // and PACED (one stage rendered at a time) — so the search matched almost
  // nothing: the Learn read highlighted nothing and the four unrendered stages
  // were never read at all. prepare(true) renders every stage; the reader then
  // maps this element and speaks its exact text — alignment by construction.
  const [readAll, setReadAll] = useState(false);
  //
  // HANDS-FREE (Darrell 2026-08-10: "can't read the whole lesson... without a
  // human turning the page!!! users should be able to listen to the whole
  // thing without needing to intervene"). A 36-pattern course read ONE piece
  // and went silent until someone tapped Next — impossible for a listener who
  // is driving, cooking, or resting their eyes, which is exactly who this
  // feature is for. `next` advances to the following piece and opens its
  // guide, so the reader keeps going by itself to the end of the series.
  React.useEffect(() => {
    const text = readAloudTextFromArc(buildLessonArc(module, { ageBand, levelOverride, sessionFlow, handsOnLabel }));
    if (text) {
      setReadTarget(module.id, {
        label: `this ${unitNoun}`,
        text,
        elementId: `learn-read-${module.id}`,
        prepare: (on) => setReadAll(!!on),
        next: onAdvance || null,
        // THE READER CAN SWITCH THE LEVEL TOO (Darrell 2026-09-15, DR-0426).
        // The panel shows the same "Who is learning?" row this lesson shows,
        // and a pick there reaches the same remembered state — this effect
        // then re-registers the new level's text and the reader resumes at the
        // same fraction of the way through.
        level: ageBand,
        levels: AGE_BANDS.map((b) => ({ id: b.id, label: b.label, range: b.range })),
        setLevel: typeof setAgeBand === 'function'
          ? (id) => { setAgeBand(id); if (levelOverride && setLearnLevel) setLearnLevel('auto'); }
          : null,
      });
    }
    return () => clearReadTarget(module.id);
  }, [module, ageBand, levelOverride, sessionFlow, handsOnLabel, unitNoun, onAdvance, setAgeBand, setLearnLevel]);

  // THE LEVEL IS CHOSEN FROM THE BEGINNING AND AT EVERY STAGE (Darrell
  // 2026-09-15, DR-0426: "choose the level from the beginning and at each
  // section change"). DR-0417 put the row at the top of the paced core —
  // the Teach stage, the second section — so the first thing a learner met
  // was still the Open stage with no way to pitch it. The row now rides the
  // flow itself: under every stage's header, Open first, so it is the first
  // choice offered and it is offered again at each section change.
  const stageLevelRow = typeof setAgeBand === 'function'
    ? () => {
      const band = AGE_BANDS.find((b) => b.id === ageBand) || AGE_BANDS.find((b) => b.id === DEFAULT_AGE_BAND) || AGE_BANDS[0];
      const resolved = resolveForAge(module, ageBand, levelOverride);
      return <LessonLevelControl band={band} levelId={resolved.levelId} levelOverride={levelOverride} setAgeBand={setAgeBand} setLearnLevel={setLearnLevel} branched={resolved.branched} />;
    }
    : null;

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
            {(seg.audience.anchorRef || seg.audience.anchorTheme) && (() => {
              const showRef = seg.audience.anchorRef && !anchorIsRun(seg.audience.anchorRef);
              // The one or two anchor verses (DR-0402 D3) open beneath the
              // line as green chips — the anchor was a green line that never
              // opened (DR-0391's hollow-surface class); now it does, below.
              const refs = referencesIn(`${showRef ? seg.audience.anchorRef : ''} ${seg.audience.anchorTheme || ''}`);
              return (
                <>
                  <p className="text-[0.6875rem] text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }}>
                    {showRef && <strong>Anchor — {seg.audience.anchorRef}:</strong>}
                    {showRef ? ' ' : null}
                    {seg.audience.anchorTheme}
                  </p>
                  {refs.length > 0 && <VerseChips refs={refs} tone="word" lead className="mt-1.5" data-testid="section-refs" />}
                </>
              );
            })()}
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
              onStepChange={onPlace ? (i, total) => onPlace({ lessonId: module.id, step: i, totalSteps: total }) : null}
              showAll={readAll}
              flush={flush}
              // The row lives on the stage header now (stageLevelRow below);
              // the core keeps only the override for its proportional re-step.
              levelOverride={levelOverride}
            />
            {/* Parable/story beats — short, vivid, often-funny illustrations, the way
                Jesus taught (Matthew 13:34); the teacher drops these to land the point. */}
            {Array.isArray(seg.audience.stories) && seg.audience.stories.length > 0 && (
              <div className="mt-3 space-y-2">
                <ShowTheWordToggle />
                {seg.audience.stories.map((s, i) => (
                  <div key={i} className="border border-[#5A6E3D] bg-[#FAF8F4] p-3">
                    {/* The label is a truth commitment: a parable is openly illustrative
                        ("Picture this…"); a testimony claims a real, lived, attributed
                        event ("A true story"). Never blur the two (DR-0076/DR-0215). */}
                    <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] mb-1">
                      {s.kind === 'testimony' ? 'A true story' : 'Picture this'}{s.title ? ` — ${s.title}` : ''}{s.kind === 'testimony' && s.source ? ` · ${s.source}` : ''}
                    </div>
                    {/* THE STORYLINE IS THE PATTERN HE POINTED AT (2026-09-14):
                        clean prose, then "— verse" in green at the foot. The
                        story's own verse line and any reference the body names
                        now share ONE green strip beneath it (refsBelow +
                        alsoRefs), so nothing boxes the words mid-sentence and
                        nothing is listed twice. */}
                    <WordInline
                      text={s.body}
                      refsBelow
                      alsoRefs={s.verse ? referencesIn(s.verse) : null}
                      className="text-[0.8125rem] text-[#1A1815] leading-relaxed"
                      style={{ fontFamily: '"Fraunces", serif' }}
                    />
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
    <div className={flush ? 'mt-3 border-y border-[#E8E4DC] bg-[#FAF8F4] py-3' : 'mt-3 border border-[#E8E4DC] bg-[#FAF8F4] p-3'} id={`learn-read-${module.id}`}>
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2" data-read-skip>
        🧭 {ARI.name} — your guide for this {unitNoun}
      </div>

      {/* The lesson-flow STANDARD — one clean, paced stage at a time. Opens on
          the saved stage when this lesson is the device's place; every move is
          persisted so the place is never lost (resume-your-place). */}
      {/* HOW MUCH TIME DO YOU HAVE — the learner's own control (DR-0215 said the
          curriculum adjusts to the allotted time; until now only the Governor's
          facilitator panel could actually do it). Nothing is cut at any length:
          the same authored arc is PACED, and anything longer than the slot flows
          across sittings. */}
      <TimeFit
        value={timeFit}
        onChange={chooseTime}
        label={`How much time do you have? (${arc.totalMinutes} min)`}
        groupLabel="Fit this lesson to the time you have"
        note={timeFit ? 'Nothing is cut — the lesson is paced to your time, and a longer one carries on next sitting.' : null}
      />

      {/* THE TEACHER (DR-0430): the AI version of Darrell — his cloned voice,
          his enrolled portrait — beside the lesson, only once he has enrolled
          his likeness himself; labelled AI-generated in every state. */}
      <LessonTeacher module={module} className="mb-2" />

      <LessonFlowAudience
        arc={arc}
        renderStage={renderStage}
        unitNoun={unitNoun}
        initialIndex={savedHere ? savedHere.stage : 0}
        onStageChange={onPlace ? (i) => onPlace({ lessonId: module.id, stage: i }) : null}
        showAll={readAll}
        flush={flush}
        stageExtra={stageLevelRow}
        onAllUnits={onAllUnits}
        onStartOver={onStartOver}
      />

      {/* The chat with the local tutor — a conversation, not part of the
          lesson's reading (data-read-skip keeps it out of the spoken text). */}
      <div className="mt-3 border-t border-[#E8E4DC] pt-3" data-read-skip>
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
// Label layer for the unit of curriculum: lib/learn-units.js (one definition,
// shared with the Continue offers — DR-0631).

// THE READER'S ORDER, as one list with no headings (DR-0631 with DR-0626):
// what the lesson list shows for the order picked there — by number, newest
// first, or by the Word's divisions (number order inside each) — and what
// Prev / Next and the hands-free advance walk inside a lesson. Composed from
// lib/lesson-order.js; a course whose lessons carry no number of their own
// keeps its authored order.
function lessonSequence(schedule, courseKey, picked) {
  const list = Array.isArray(schedule) ? schedule : [];
  if (!isNumberedCourse(list)) return list;
  const order = picked || rememberedLessonOrder(courseKey) || DEFAULT_LESSON_ORDER;
  if (order === 'divisions' && wantsSections(list)) {
    return sectionLessons(list).flatMap((sec) => orderLessons(sec.lessons, 'number'));
  }
  return orderLessons(list, order === 'newest' ? 'newest' : 'number');
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
  // A TAP MUST RE-FIRE EVEN WHEN IT NAMES THE LESSON ALREADY NAMED.
  //
  // Darrell 2026-09-13: "Links don't work in last played." The effect below is
  // keyed on resumeLessonId, so setting it to the SAME id is a React no-op and
  // the effect never runs — the tap does nothing at all. That is invisible on
  // the main list, where you rarely tap the lesson you just opened, and it is
  // the NORMAL case on "Recently opened", which is BY DEFINITION the lessons
  // you already opened. The most likely tap on that row was the one guaranteed
  // to do nothing. This counter rises on every open() so the arrival is an
  // EVENT rather than a value, and re-opening the same lesson works.
  resumeNonce = 0,
  // TWO ARRIVALS, TWO STATES — and they must match the door the reader used.
  // Resume (and a deep link) lands IN the lesson with its guide already open,
  // which DR-0262/DR-0264 decided deliberately: a returning reader is mid-study.
  // BROWSING is a different arrival — it is the same act as tapping a title in
  // the list, which opens the lesson's space showing the scannable card with
  // "Start this lesson" still to press. Before this flag the finder (and the new
  // shelf) forced every arrival into the resume state, so a browsed lesson
  // skipped the very affordance Darrell named as the convenient one.
  resumeOpenGuide = true,
  // ▶ PLAY FROM THE INDEX (Darrell 2026-09-12, with the by-title list on screen:
  // "play button was for the link list so it can produce the same thing").
  // The card list's ▶ Play calls setPresentLesson directly — but that state
  // lives HERE, in CourseView, while the by-title index lives one component up
  // in ChurchLearn. So the index cannot reach it, and its titles could only
  // navigate. This prop is the seam: { lessonId, nonce }. A NONCE and not a
  // boolean on purpose — tapping ▶ on the SAME lesson twice must open the
  // reader twice, and an unchanged value would make the second tap do nothing.
  presentRequest = null,
  onFocusChange = null,  // tells the wrapper a lesson space is open (it hides the course picker)
  onAllCourses = null,   // leave the lesson AND the course — the way out of a hidden-chrome space
  lessonOrder = null,    // the order picked in this course's lesson list (DR-0626); Prev/Next follow it
}) {
  const [showFacilitator, setShowFacilitator] = useState(false);
  const [openTutorId, setOpenTutorId] = useState(null);
  const [exportNote, setExportNote] = useState('');
  const [teaching, setTeaching] = useState(false);
  // The ONE lesson the presenter is teaching (a schedule module), or null. Distinct
  // from `teaching` (the whole-series overview): pushing a single lesson presents THAT
  // lesson's own parts, timed to itself (Darrell 2026-07-16).
  const [presentLesson, setPresentLesson] = useState(null);
  // PLAY STARTS IT (Darrell 2026-09-13: "Let the Play buttons just start the
  // lessons"). Play used to land on the presenter CONSOLE — a setup screen with
  // its own START button — so "play" took two taps and the first one did not
  // play anything. Arriving with the lesson already filling the screen is what
  // the word on the button promises.
  const [presentAutoStart, setPresentAutoStart] = useState(false);
  // Bumped when a lesson is opened, so the "Recently opened" cluster re-derives
  // from the user's own device-local UX history (ux-signals). The "Recently
  // opened" strip itself now renders in the wrapper, beside the course picker
  // (2026-09-06) — recordUse below is what feeds it.
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
  // HOW LONG THIS ACTUALLY TAKES, at the reader's own level (Darrell 2026-09-18:
  // "the time it takes to go through the course at 1 and 1.5 speeds ... the
  // actual time they can expect to spend"). Memoised because scanning a
  // 171-lesson course chunks every band; it must not run on every paint.
  const duration = useMemo(
    () => courseDuration(schedule, { ageBand, levelOverride }),
    [schedule, ageBand, levelOverride],
  );
  const handsOnLabel = meta.handsOnLabel || 'In the app';
  const U = unitLabels(meta); // "week"/"Week" by default; "lesson"/"Lesson" + self-paced for the lesson series
  // Resume-your-place: every write goes through here so the record always
  // carries THIS course's key (device-local, lib/learn-resume.js).
  // THE READER'S PLACE IN THE LESSON, HELD WHERE IT STAYS VISIBLE (Darrell
  // 2026-09-17, from the live church door): "The timeline bar for the place or
  // how far or close to the end isn't visible to the user during the reading
  // process." TRACED: the step line and its bar were rendered INLINE at the top
  // of the current segment (AgePacedLesson), so the moment the reader scrolled
  // into the prose they were reading, the only indicator of how far through the
  // lesson they were had scrolled off the screen. His screenshot shows exactly
  // that - a fragment of the bar stranded above the sticky block while the body
  // says STEP 4 OF 5 far below it.
  //
  // AgePacedLesson already reported each step through onStepChange; it now
  // reports the TOTAL with it, and that pair is held here so the sticky block
  // can render it beside the lesson title. The inline row STAYS as well: a
  // reader who scrolls back to the top of a segment should still see where the
  // segment begins. This adds a second, always-visible view of the same real
  // state - never a second source of it.
  const [liveStep, setLiveStep] = useState(null);
  const savePlace = (patch) => {
    if (patch && Number.isFinite(patch.step) && Number.isFinite(patch.totalSteps)) {
      setLiveStep({ lessonId: patch.lessonId || null, step: patch.step, total: patch.totalSteps });
    }
    return recordPlace({ courseKey: course.key, ...patch });
  };

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

  // THE EXACT LOCATION IS KEPT AND RESTORED (Darrell 2026-09-14: "Lessons keep
  // being interrupted and I'm loosing my exact location!!! Fix it!!!") — and,
  // since DR-0631, kept in ONE place record rather than two.
  //
  // 2026-09-14 wired lessons to lib/reading-position.js, which remembered a
  // SCROLL OFFSET beside the lesson's place record. Measured in a real browser
  // on 2026-09-24 (Darrell: "Continuing a lesson doesn't work well... it needs
  // to be way better"): after a reload, a tab away, or a course switch, the
  // lesson came back at the right step and at scrollY 0 — the course header
  // on screen, the words a long scroll below. A lesson has no reading anchors,
  // so the offset was a bare scrollY, saved on unmount AFTER the page had
  // already changed under it; and the place record, which knew the step, knew
  // nothing finer for a reader using their eyes. Two records, disagreeing —
  // exactly the drift the 2026-09-14 note warned about.
  //
  // Now the reader's eye writes the SAME thing the reader's voice does: the
  // sentence at the reading line (just under the sticky chrome), as its
  // fingerprint, into the lesson's own place (lib/lesson-landing.js). Only a
  // scroll the PERSON made counts — the read-aloud's follow-scroll and the
  // landing's own scroll are not the reader moving, and the voice records its
  // own sentence anyway. A finished lesson is left finished: looking back
  // over it is not starting it again.
  const focusModule = focusId ? (schedule.find((m) => m.id === focusId) || null) : null;
  // The order the reader picked in this course's list (see lessonSequence).
  const sequence = useMemo(() => lessonSequence(schedule, course.key, lessonOrder), [schedule, course.key, lessonOrder]);
  const sequenceRef = React.useRef(sequence);
  sequenceRef.current = sequence;
  // This course's saved places, one parse per render, for the cards' own
  // Start/Continue buttons.
  const placeByLesson = Object.fromEntries(listPlaces({ courseKey: course.key }).map((p) => [p.lessonId, p]));
  React.useEffect(() => {
    if (!focusId || typeof window === 'undefined') return undefined;
    let userAt = 0;
    let timer = null;
    const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar']);
    const touched = () => { userAt = Date.now(); };
    const keyed = (e) => { if (e && SCROLL_KEYS.has(e.key)) userAt = Date.now(); };
    const onScroll = () => {
      if (Date.now() - userAt > 1500) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        try {
          const own = getPlaceFor(course.key, focusId);
          if (own && own.done) return;
          const root = document.getElementById(`learn-lesson-${focusId}`);
          // A lesson being left (hidden, detached, or the page gone to the
          // background) is not being read.
          if (!root || !root.isConnected || document.hidden) return;
          const box = root.getBoundingClientRect();
          if (!(box.height > 0)) return;
          const cur = currentSentence(root);
          if (!cur) return;
          savePlace({ lessonId: focusId, sentence: cur.index, sentenceKey: cur.key });
        } catch (_) { /* a place that cannot be written never breaks the lesson */ }
      }, 450);
    };
    // A TAP IS NOT A SCROLL. Measured in the browser journeys: with a tap
    // counted as the reader moving, tapping the Scripture tab to leave made
    // the navigation's own scroll record the view under the finger — over the
    // sentence the read-aloud had saved. Only a wheel, a finger dragging the
    // page, or a scroll key is the reader moving.
    const opts = { passive: true };
    window.addEventListener('wheel', touched, opts);
    window.addEventListener('touchmove', touched, opts);
    window.addEventListener('keydown', keyed);
    window.addEventListener('scroll', onScroll, opts);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('wheel', touched, opts);
      window.removeEventListener('touchmove', touched, opts);
      window.removeEventListener('keydown', keyed);
      window.removeEventListener('scroll', onScroll, opts);
    };
  }, [focusId]); // eslint-disable-line react-hooks/exhaustive-deps

  // LANDING — every Continue ends ON the words (DR-0631). Asked for by the
  // doors that mean "take me back": the Continue offers, the lesson's own
  // Continue button, Refresh first. Waits for the guide to paint at the saved
  // part and step (TutorPanel opens there itself), then scrolls the saved
  // sentence to just under the chrome and marks it; with no findable sentence
  // it lands on the saved step and the note says so honestly.
  const [landing, setLanding] = useState(null);      // { lessonId, nonce }
  const [landNote, setLandNote] = useState(null);    // { lessonId, how, where }
  const landAt = (id) => setLanding({ lessonId: id, nonce: Date.now() });
  React.useEffect(() => {
    if (!landing || typeof document === 'undefined') return undefined;
    let tries = 0;
    let t = null;
    const attempt = () => {
      t = null;
      const root = document.getElementById(`learn-lesson-${landing.lessonId}`);
      const guide = document.getElementById(`learn-read-${landing.lessonId}`);
      if ((!root || !guide) && tries < 25) { tries += 1; t = setTimeout(attempt, 80); return; }
      const place = getPlaceFor(course.key, landing.lessonId);
      if (!root || !place) return;
      // The paced step's own box when the reader was inside the teaching;
      // else the part's box.
      const boxes = guide ? guide.querySelectorAll('[aria-live="polite"]') : [];
      const stepEl = boxes.length ? boxes[boxes.length - 1] : null;
      // The guide is searched first: when a sentence also appears in the card
      // above it, the reader belongs back in the lesson they were walking.
      let res = guide ? landOnPlace(guide, place, { stepEl }) : { how: 'none' };
      if (res.how !== 'sentence') res = landOnPlace(root, place, { stepEl });
      if (res.how === 'none') {
        try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (_) { /* no-op */ }
      }
      setLandNote(res.how === 'none' ? null : { lessonId: landing.lessonId, how: res.how, why: res.why, where: placeWhere(place) });
    };
    t = setTimeout(attempt, 140);
    return () => { if (t) clearTimeout(t); };
  }, [landing]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!landNote) return undefined;
    const t = setTimeout(() => setLandNote(null), 7000);
    return () => clearTimeout(t);
  }, [landNote]);
  // THE STICKY TITLE OPENS ON A TAP (Darrell 2026-09-24, two Big Print
  // screenshots of Lesson 101 whose title ended in "...": "The title to
  // lessons are getting cut off!!!!!! Fix it..."). Three of his words hold at
  // once here and none may lose: the title stays at the top through a long
  // read (2026-09-17); a sticky label never covers the Word at Big Print
  // (2026-09-22, the two-line ceiling); and the title is never cut off (now).
  // So the ceiling stays as the RESTING state, and the reader owns the lid:
  // a tap on the fold control opens the whole title inside the sticky block,
  // a second tap folds it, and opening the next lesson folds it again. A
  // title that fits in two lines shows no fold control at all. The full
  // title also stands in the flow at the head of the lesson card, so on
  // arrival it is read whole without any tap.
  const [titleOpen, setTitleOpen] = useState(false);
  React.useEffect(() => { setTitleOpen(false); }, [focusId]);
  const titleRef = React.useRef(null);
  const [titleOverflows, setTitleOverflows] = useState(false);
  React.useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) { setTitleOverflows(false); return undefined; }
    // Measured, not guessed: the clamp hides overflow, so scrollHeight past
    // clientHeight is the one true sign that a line was cut. Re-measured on
    // resize and on any text-size change (both move the line count), and a
    // browser with no layout (the test DOM) reads 0/0 and shows no control —
    // which is why the render pins force the state rather than the size.
    const measure = () => { if (!titleOpen) setTitleOverflows(el.scrollHeight > el.clientHeight + 1); };
    measure();
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('resize', measure);
    // The size change lands as a root-scale change on the next frame, so the
    // measurement waits one frame before reading the new line count.
    const unsubscribe = subscribeTextSize(() => { window.requestAnimationFrame(measure); });
    return () => { window.removeEventListener('resize', measure); unsubscribe(); };
  }, [focusId, titleOpen]);
  // THE SCREEN STAYS ON WHILE A LESSON IS OPEN (DR-0439; Darrell 2026-09-16:
  // "my Zfold 7 allows 10 minutes until it goes black"). One shared wake-lock
  // holder named for the lesson space; released when the reader leaves it.
  // Where the browser has no wake lock, a touch device gets the honest hint
  // under the lesson bar — the phone's own setting, named.
  const awake = useScreenAwake(!!focusModule, 'lesson');
  const touchDevice = useMemo(() => { try { return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (_) { return false; } }, []);
  const lastFocusRef = React.useRef(null);
  const openLesson = (id) => {
    lastFocusRef.current = id;
    setFocusId(id);
    savePlace({ lessonId: id });
    recordUse(id);
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { /* no-op */ }
  };
  // HANDS-FREE ADVANCE (Darrell 2026-08-10: "users should be able to listen to
  // the whole thing without needing to intervene"). Given a lesson, move to the
  // NEXT one in this course and open its guide — the same real path a Next tap
  // drives, minus the finger. Returns false at the end of the series, which is
  // how the reader knows to stop. Memoized per id so the read target's `next`
  // is stable across renders.
  const advanceFromRef = React.useRef({});
  const advanceFrom = (id) => {
    if (!advanceFromRef.current[id]) {
      advanceFromRef.current[id] = () => {
        // The reader's order, not the written array (DR-0631).
        const list = sequenceRef.current || scheduleRef.current || [];
        const i = list.findIndex((m) => m.id === id);
        const nextM = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
        if (!nextM) return false;
        lastFocusRef.current = nextM.id;
        setFocusId(nextM.id);
        setOpenTutorId(nextM.id);
        savePlace({ lessonId: nextM.id });
        recordUse(nextM.id);
        try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { /* no-op */ }
        return true;
      };
    }
    return advanceFromRef.current[id];
  };
  const scheduleRef = React.useRef(schedule);
  scheduleRef.current = schedule;

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
    if (resumeOpenGuide) setOpenTutorId(resumeLessonId);
    // DR-0262 — the place survives in BOTH directions. openLesson() records it;
    // this cross-course door (the finder, the shelf, Resume) did not, so a
    // lesson reached that way was one a reader could lose again on reload.
    // Arriving with the guide open is beginning (or continuing) the lesson;
    // arriving to browse its card is not (DR-0631 — see `started`).
    savePlace({ lessonId: resumeLessonId, ...(resumeOpenGuide ? { started: true } : {}) });
    recordUse(resumeLessonId);
    // ARRIVAL NO LONGER JUMPS TO THE TOP WHEN THERE IS A PLACE TO RETURN TO.
    // `scrollTo({top: 0})` here was the most-felt half of "I'm losing my exact
    // location": the record could be perfect and the view still threw it away
    // on every return. useReadingPosition above restores the sentence, so the
    // top-scroll is now only for a lesson with NO saved sentence -- a genuinely
    // fresh open, where the top IS the right place.
    // DR-0631: "not jumping to the top" was only half of it — measured, the
    // view then sat wherever the page happened to be (scrollY 0 after a
    // reload). A Continue arrival now LANDS: on the saved sentence, else on
    // the saved step, with the guide open at the saved part.
    const saved = getPlaceFor(course.key, resumeLessonId);
    const hasPlace = resumeOpenGuide && placeInProgress(saved);
    if (hasPlace) { landAt(resumeLessonId); return undefined; }
    const t = setTimeout(() => {
      try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { /* no-op */ }
    }, 80);
    return () => clearTimeout(t);
  }, [resumeLessonId, resumeOpenGuide, resumeNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  // ▶ Play, arriving from the by-title index (or the finder) one component up.
  // Separate from the resume effect above rather than folded into it: that
  // effect's deps govern how a returning reader lands, and widening them to
  // carry a second intent is how one of the two quietly changes.
  React.useEffect(() => {
    if (!presentRequest || !presentRequest.lessonId) return;
    const m = schedule.find((x) => x.id === presentRequest.lessonId);
    if (!m) return;   // a hit from another course: that course's view answers it
    recordUse(m.id);
    savePlace({ lessonId: m.id, started: true });
    // THE SECOND PLAY ROUTE ALSO READS (Darrell 2026-09-14, found by DRIVING
    // the app rather than reading it: pressing Play produced ZERO speech calls
    // and opened the presenter anyway). The card's Play was changed; THIS one --
    // Play from the by-title index, which is the list with one entry per lesson
    // and therefore most of the Play buttons on screen -- still called
    // setPresentLesson with autoStart. One ask, two call sites, and only one of
    // them was fixed twice over. Both now do the same thing.
    openLesson(m.id);
    setOpenTutorId(m.id);
    requestRead(m.id);
  }, [presentRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  // A course descriptor is data from the catalog, and a course that carries no
  // progressSummary is a real shape (not every course tracks progress). Calling
  // it unconditionally threw "courseProgressSummary is not a function" and took
  // the WHOLE Learn surface down — a white screen for one missing optional
  // field. Surfaced by making Living Lessons the default (2026-09-11): the
  // crash had been hiding behind the A.I. course always carrying one.
  const prog = typeof courseProgressSummary === 'function' ? courseProgressSummary(progress) : null;
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
        presentable={lessonPresentable(presentLesson, { level: AGEBAND_TO_LEVEL_KEY[ageBand] || null, handsOnLabel, courseTitle: course.meta.title || '' })}
        initialAge={AGEBAND_TO_PRESENT_AGE[ageBand] || 'teen'}
        startOnScreen={presentAutoStart}
        onClose={() => { setPresentAutoStart(false); setPresentLesson(null); }}
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
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{U.selfPaced && schedule.length === 1 ? `The ${U.noun}` : `The ${schedule.length} ${U.plural}`}</h3>
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
        </div>
      )}
      {/* ▶ PLAY — the big reader, from the list, for EVERYONE (Darrell 2026-09-11,
          with a screenshot of the reader open): "We want the lessons and overviews
          to have a play button next to each one that will pop up this slide for it
          to be read and be big enough to cover the screen... easier and clearer to
          access from the list to choose from."
          The screen he photographed is <Presenter> (Read aloud · Full screen ·
          Speaker view). It already existed — and BOTH play controls sat inside the
          Governor-only block above, so from a staff or member account the whole
          affordance was invisible. That gate was the bug; the reader is not a
          privileged tool, it is how a person reads. */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setTeaching(true)}
          className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border-2 border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          ▶ Play the overview (all {schedule.length} at a glance)
        </button>
        <p className="mt-2 text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          Opens the big full-screen view — read it yourself in large type, or press <strong>Read aloud</strong> and let it read to you. Every {U.noun} below has its own <strong className="text-[#5A6E3D]">▶ Play</strong>; this one plays the whole series at a glance.
        </p>
      </div>
      {/* The lesson's own space: a sticky bar naming where you are, the way
          back, and previous/next — the reader can never fall into the full
          list by accident. Rendered only while a lesson is open alone.
          THE BAR IS CHROME, NOT READING TEXT (Darrell 2026-09-15, at Big Print
          44 on Lesson 127: "I don't like the the buttons get way bigger on
          the bigger font choices!! Can we fix it!"). Un-capped, its rem-sized
          buttons rode the 2.75x root scale — ALL LESSONS / PREV / NEXT at
          ~100px tall. .ts-chrome-region is the one cap every nav row shares
          (lib/text-size.js): ~1.4x at Big Print, exactly 1x at Normal, so the
          WORDS grow and the frame stays a frame. Same for the catalog's
          lessons-bar below, which reuses this exact shape. */}
      {focusModule && (() => {
        // PREV / NEXT WALK THE ORDER THE READER CHOSE IN THE LIST (DR-0631,
        // agreeing with DR-0626). They walked the WRITTEN array, where L61 is
        // stored before L60 and there is no L79 — so Next from L60 skipped
        // L61, and the counter printed the array position ("191 / 191" on
        // L192, Darrell's screenshot). Both now read the same sequence the
        // lesson list shows.
        const idx = sequence.findIndex((m) => m.id === focusModule.id);
        const prev = idx > 0 ? sequence[idx - 1] : null;
        const next = idx >= 0 && idx < sequence.length - 1 ? sequence[idx + 1] : null;
        const numbered = isNumberedCourse(schedule);
        return (
          <div className="sticky top-0 z-30 mb-3 bg-[#FAF8F4]" data-testid="lesson-space-sticky">
          <div className="ts-chrome-region border border-[#1A1815] border-b-0 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap" data-testid="lesson-space-bar">
            {onAllCourses && (
              <button
                type="button"
                onClick={() => { setFocusId(null); onAllCourses(); }}
                data-testid="lesson-bar-all-courses"
                className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border-2 border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                {/* Darrell 2026-09-19: "Make it easy to get back and to All
                    Courses!!!!!!!!!" The bar's existing control goes back to
                    THIS course's lessons; inside a lesson the department tabs
                    and the course picker are both hidden, so there was no
                    control on screen that left the course at all. This one
                    does: it closes the space AND returns to every course. */}
                ⌂<span className="hidden sm:inline"> All courses</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setFocusId(null)}
              data-testid="lesson-bar-all"
              className="text-[0.8125rem] uppercase tracking-wider px-4 py-2 min-h-[44px] border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#3a352f] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              {/* SMALLER ON A PHONE (DR-0438): the same three controls, short
                  words, one row — the bar was two rows (98px) at 360px.
                  BUT NOT INVISIBLE (Darrell 2026-09-16, from his phone): "There
                  is a little bitty button to get back to all... you can't
                  really find the all button... Stop making it difficult to get
                  to places in the app." Measured before this: a 10px label in a
                  1px outline, 36px tall — the smallest thing in a bar whose
                  other controls were mere arrows, and the ONLY way out of a
                  lesson. The way out is now the bar's PRIMARY control: filled,
                  13px, 44px tall, and it says All lessons on a phone too.
                  Prev/Next stay quiet arrows beside it, which is the right
                  weight for them. Still inside .ts-chrome-region, so Big Print
                  grows the words and the frame stays a frame (DR-0410). */}
              ← All {U.noun}s
            </button>
            {/* THE LESSON'S OWN NUMBER (DR-0631 with DR-0626): "L192", and on a
                wider screen where it sits in the reader's order. A course whose
                lessons carry no number of their own keeps "Week 3 of 8". */}
            <span className="text-[0.6875rem] text-[#5A5751] whitespace-nowrap" style={{ fontFamily: '"JetBrains Mono", monospace' }} data-testid="lesson-bar-number" data-lesson-number={ownNumber(focusModule, schedule)}>
              {numbered ? (
                <>
                  {numberLabel(focusModule, true, U.cap)}
                  <span className="hidden sm:inline"> · {idx + 1} of {sequence.length}</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">{U.cap} </span>{focusModule.week}<span className="sm:hidden"> / </span><span className="hidden sm:inline"> of </span>{schedule.length}
                </>
              )}
            </span>
            <span className="flex-1" />
            <button
              type="button"
              disabled={!prev}
              onClick={() => prev && openLesson(prev.id)}
              className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A5751] text-[#5A5751] enabled:hover:border-[#1A1815] enabled:hover:text-[#1A1815] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              ←<span className="hidden sm:inline"> Prev</span>
            </button>
            <button
              type="button"
              disabled={!next}
              onClick={() => next && openLesson(next.id)}
              className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A5751] text-[#5A5751] enabled:hover:border-[#1A1815] enabled:hover:text-[#1A1815] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              <span className="hidden sm:inline">Next </span>→
            </button>
          </div>
          {/* THE TITLE STAYS WHERE THE READER CAN SEE IT (Darrell 2026-09-17:
              "The title to these lessons should stay at the top... so that
              people can remember what we're talking about"). The sticky bar
              above it already held position through a long read -- but it named
              the POSITION ("Lesson 90 of 163") and never the lesson, so a
              reader deep in a nine-movement lesson was told where he was and
              not what he was in. The title now rides the same sticky block,
              joined to the bar as one box.
              It sits on its OWN line rather than inside the controls row on
              purpose: DR-0438 fought that row down to one line on a 360px
              phone, and a long title in it would push it straight back to two.
              And it is deliberately OUTSIDE .ts-chrome-region -- the cap is for
              controls (DR-0410 / DR-0432), and this is text the reader READS,
              so it grows with Big Print like the lesson does (DR-0410's own
              rule that the words grow and the frame stays a frame). */}
          {/* BOUNDED, because a sticky label may never eat the reading area
              (Darrell 2026-09-22, on a Big Print screenshot where this title
              took three lines of a 660px viewport and sat on top of the
              lesson): "these types of words covering the Word and perspectives
              being explained are not wanted."

              The 2026-09-17 reasoning above — that the title is text the
              reader READS, so it should grow with Big Print like the lesson —
              is right about a title at Normal and wrong at A44. A sticky
              element is not read once and scrolled past; it sits over the
              prose for the whole lesson. At 2.75x an unbounded three-line
              title is a permanent lid on the Word.

              So it still grows and still stays put, but it can never exceed
              two lines: line-clamp caps the height at every text size, and
              the full title rides the `title` attribute for anyone who wants
              it. The fix is a CEILING, not a shrink — at Normal nothing about
              this changes. */}
          {/* ...AND NEVER CUT OFF (Darrell 2026-09-24: "The title to lessons are
              getting cut off!!!!!! Fix it..."). The ceiling is the resting
              state; the fold control beside the title opens the whole of it
              inside the sticky block on one tap and folds it on the next. The
              control renders only when the title actually overflows two lines
              (measured on the element, never guessed from its length), so a
              short title shows a plain line and a long one shows a handle
              rather than a silent "...". See titleOpen above. */}
          <div className="border border-[#1A1815] border-b-0 px-2 sm:px-3 py-1.5 flex items-start gap-2" data-testid="lesson-space-title-row">
            <h2
              data-testid="lesson-space-title"
              id="lesson-space-title"
              title={focusModule.title}
              data-open={titleOpen ? 'true' : 'false'}
              ref={titleRef}
              className={`flex-1 min-w-0 text-[0.875rem] font-semibold text-[#1A1815] leading-snug ${titleOpen ? '' : 'overflow-hidden'}`}
              style={titleOpen ? { fontFamily: '"Fraunces", serif' } : {
                fontFamily: '"Fraunces", serif',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                maxHeight: '2.8em',
              }}
            >
              {focusModule.title}
            </h2>
            {(titleOpen || titleOverflows) && (
              <button
                type="button"
                onClick={() => setTitleOpen((v) => !v)}
                aria-expanded={titleOpen}
                aria-controls="lesson-space-title"
                aria-label={titleOpen ? 'Fold the title back to two lines' : 'Show the whole title'}
                title={titleOpen ? 'Fold the title back to two lines' : 'Show the whole title'}
                data-testid="lesson-space-title-toggle"
                className="ts-chrome-region shrink-0 min-h-[44px] min-w-[44px] px-2 text-[0.75rem] font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                {titleOpen ? '▴' : '▾'}
              </button>
            )}
          </div>
          {/* HOW FAR THROUGH, WHERE IT CANNOT SCROLL AWAY (Darrell 2026-09-17).
              The bar spans the FULL width on purpose: the inline one is 96px
              wide, which is legible enough beside its own label but useless as
              a glance-target while reading. This one is the width of the
              reading column, so distance-to-the-end is readable without
              looking for it.
              It renders ONLY for the lesson that is actually open and only once
              a real step has been reported - never a painted bar, and never
              another lesson's position (the lessonId is checked). Before the
              first step arrives there is nothing to show, so nothing shows. */}
          {liveStep && liveStep.lessonId === focusModule.id && liveStep.total > 1 && (
            <div
              data-testid="lesson-space-progress"
              className="border border-[#1A1815] px-2 sm:px-3 py-1.5 bg-[#FAF8F4]"
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  Step {Math.min(liveStep.step + 1, liveStep.total)} of {liveStep.total}
                </span>
                <span className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {liveStep.step + 1 >= liveStep.total
                    ? 'last step'
                    : `${liveStep.total - (liveStep.step + 1)} to go`}
                </span>
              </div>
              <div
                className="h-2 bg-[#E8E4DC]"
                role="progressbar"
                aria-valuenow={Math.min(liveStep.step + 1, liveStep.total)}
                aria-valuemin={1}
                aria-valuemax={liveStep.total}
                aria-label="How far through this lesson"
              >
                <div
                  className="h-full bg-[#5A6E3D]"
                  style={{ width: `${Math.round((Math.min(liveStep.step + 1, liveStep.total) / liveStep.total) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {/* WHERE A CONTINUE LANDED, SAID PLAINLY (DR-0631) — for a few
              seconds, then gone. When the exact sentence could not be found
              (the lesson was updated, say), it says only that rather than letting a
              wrong landing pass as a right one. */}
          {landNote && landNote.lessonId === focusModule.id && (
            <p
              role="status"
              data-testid="continue-landed"
              className="border border-[#5A6E3D] border-t-0 px-2 sm:px-3 py-1 bg-[#5A6E3D] text-white text-[0.75rem]"
              style={{ fontFamily: '"Fraunces", serif' }}
            >
              {landNote.how === 'sentence'
                ? `Picked up where you left off — ${landNote.where}. Your sentence is marked.`
                : (landNote.why === 'no-sentence'
                  ? `Picked up where you left off — ${landNote.where}.`
                  : `Picked up at ${landNote.where}, at the start of that step — your exact sentence could not be found in it.`)}
            </p>
          )}
          </div>
        );
      })()}
      {focusModule && !awake.supported && touchDevice && (
        <p className="ts-chrome-region mb-3 pl-2 border-l-2 border-[#B85838] text-[0.625rem] text-[#5A5751]" data-testid="screen-timeout-hint" style={{ fontFamily: '"Fraunces", serif' }}>{awake.hint}</p>
      )}
      <ol className="space-y-3">
        {(focusModule ? [focusModule] : schedule).map((m) => {
          const done = !!progress[m.id];
          const tutorOpen = openTutorId === m.id;
          // PRIMARY ACTIONS AT THE HEAD (Darrell 2026-08-18: "The lesson
          // options are at the bottom of the lessons... make it primary so it
          // is at the beginning users are asked these questions... start...
          // present... and done"). Defined ONCE, rendered twice: at the top of
          // the card where the reader decides, and again after the content so
          // a finished reader never scrolls back up to mark done.
          const actionsRow = (
            <>
              {/* Actions: start the week (tutor + launch), and mark done */}
              <div className="flex flex-wrap gap-2 mt-3 items-center">
                {/* TAKE IT WITH YOU (Darrell 2026-08-10: "copy paste options for
                    each section... links to the exact lessons"). The lesson's
                    own text — Word-first big idea, the body at the reader's
                    level, its anchor, and a link back to THIS lesson — and the
                    link alone, for a text message. */}
                {/* SHARE FIRST (Darrell 2026-08-10: "can we just share right
                    from the lessons? not have to copy a link... users can but
                    not necessary... share and it will open whatever they
                    usually do"). One tap into their own share sheet; the copy
                    controls stay for anyone who wants the raw text or link. */}
                <ShareButton
                  label="Share"
                  title="Share this lesson using your usual apps"
                  payload={() => lessonSharePayload(m, {
                    url: lessonUrl({ courseKey: course.meta.key, lessonId: m.id }),
                    courseTitle: course.meta.title || '',
                  })}
                />
                <CopyButton
                  label="Copy lesson"
                  copiedLabel="Lesson copied ✓"
                  title="Copy this lesson's text, with its anchor and a link back to it"
                  text={() => lessonCopyBlock(m, { url: lessonUrl({ courseKey: course.meta.key, lessonId: m.id }), level: learnLevel === 'auto' ? 'standard' : learnLevel })}
                />
                <CopyButton
                  label="Copy link"
                  copiedLabel="Link copied ✓"
                  title="Copy a link that opens exactly this lesson"
                  text={() => lessonUrl({ courseKey: course.meta.key, lessonId: m.id })}
                />
                {/* START, OR CONTINUE (DR-0631). A lesson the reader has begun
                    says so on its own button, and the tap lands on their place
                    (the saved part, step and sentence) instead of part one. */}
                <button
                  type="button"
                  onClick={() => {
                    if (tutorOpen) { setOpenTutorId(null); return; }
                    const resumeHere = placeInProgress(placeByLesson[m.id]);
                    recordUse(m.id);
                    savePlace({ lessonId: m.id, started: true });
                    setOpenTutorId(m.id);
                    if (resumeHere) landAt(m.id);
                  }}
                  aria-expanded={tutorOpen}
                  aria-controls={`tutor-panel-${m.id}`}
                  title={!tutorOpen && placeInProgress(placeByLesson[m.id]) ? `Continue where you left off — ${placeWhere(placeByLesson[m.id])}` : undefined}
                  className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${tutorOpen ? 'border border-[#B85838] text-[#B85838]' : (placeInProgress(placeByLesson[m.id]) ? 'border-2 border-[#5A6E3D] bg-[#5A6E3D] text-white font-semibold hover:bg-[#4a5a31]' : 'border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white')}`}
                >
                  {tutorOpen ? 'Close the guide' : (placeInProgress(placeByLesson[m.id]) ? `Continue this ${U.noun} →` : `Start this ${U.noun} →`)}
                </button>
                {/* ▶ PLAY THIS ONE — opens the big full-screen reader on this
                    {U.noun} alone (Read aloud · Full screen · Speaker view), timed
                    to itself, at the pace already set.
                    UNGATED 2026-09-11. It was Governor-only, which meant the one
                    control that makes a lesson READABLE — big type, or read to you —
                    was invisible to every member and staff account. Darrell, with the
                    reader open on screen: "easier and clearer to access from the list
                    to choose from... the reader reading for you or you read it in the
                    big nice easy to read views." Placed FIRST in the row so it is the
                    first thing the eye lands on, not the last. */}
                {/* PLAY READS THE LESSON. Darrell 2026-09-14, in capitals and
                    for the third time: "Play Button reads the lesson!!!!! Does
                    not open the PowerPoint!!! Reads the lesson front to back".
                    It used to call setPresentLesson, which opens the deck --
                    and the two previous attempts at this only changed WHICH
                    deck view it opened (console, then already-presenting),
                    which was never the ask. Play now opens the lesson and
                    records a want; the reader starts its full reading as soon
                    as the lesson registers it. The DECK still has its own
                    control (Present), so nothing is lost. */}
                <button
                  type="button"
                  onClick={() => {
                    recordUse(m.id); savePlace({ lessonId: m.id, started: true });
                    // The guide must be OPEN for the lesson to register its
                    // reading, so Play opens it and then asks for the read.
                    openLesson(m.id); setOpenTutorId(m.id); requestRead(m.id);
                  }}
                  title={`Read this ${U.noun} aloud, start to finish`}
                  className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border-2 border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                >
                  ▶ Play
                </button>
                {/* PRESENT THIS ONE (DR-0451). Darrell 2026-09-17: "each Lesson
                    should be able to present just the one that we want without
                    having to scroll through the whole list to get to the one
                    lesson that we want to understand."
                    The comment above promised "The DECK still has its own
                    control (Present), so nothing is lost" — and that was not
                    true of the tree. Nothing ever called setPresentLesson, so
                    lessonPresentable (the single-lesson deck, timed to the
                    lesson itself) was unreachable dead code, and the ONLY way
                    into a deck was Play the overview, which opens all 163 at
                    week one. Reaching week 45 in front of a room meant
                    forty-four taps of the arrow.
                    This is the door that was promised. It is NOT Play, and it
                    never will be: Play reads the lesson aloud, in capitals,
                    for the third time (2026-09-14). Present opens the deck for
                    THIS lesson and starts it presenting (DR-0392's
                    startOnScreen, whose branch this finally makes live). */}
                <button
                  type="button"
                  onClick={() => {
                    recordUse(m.id); savePlace({ lessonId: m.id });
                    setPresentAutoStart(true); setPresentLesson(m);
                  }}
                  data-testid={`present-one-${m.id}`}
                  title={`Present this ${U.noun} on its own — the deck for this one, not the whole series`}
                  className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A5751] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                >
                  <UiIcon name="monitor" className="inline-block align-[-0.15em] mr-1" /> Present
                </button>
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
            </>
          );
          return (
            // FULL WIDTH IN THE LESSON'S OWN SPACE (Darrell 2026-09-14: "The
            // width of the pages need the full width of the page to be
            // used!!!! Old required procedures!!!"). MEASURED in a real
            // Chromium before this change: at 1440px the prose column was
            // 1272px (88%); at 390px it was 262px — sixty-seven percent of a
            // phone, for readers who need large type. No max-width remained;
            // the loss was FIVE nested bordered boxes each taking its own
            // padding (main → this card p-4 → the guide p-3 → the stage p-3 →
            // the paced box p-2). In the space the bar above already frames
            // the one lesson (DR-0264), so the card sheds its box and hands
            // `flush` down, and the reading column meets the page gutter like
            // every other page. The stacked list keeps its cards.
            <li key={m.id} id={`learn-lesson-${m.id}`} className={focusModule ? 'scroll-mt-28' : 'border border-[#E8E4DC] p-4 scroll-mt-28'}>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <span className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                  {U.cap} {ownNumber(m, schedule)} · {m.title}
                </span>
                {!U.selfPaced && (
                  <span className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {m.date ? fmtDate(m.date) : 'date TBD'}
                  </span>
                )}
              </div>
              {actionsRow}
              {/* Where this lesson sits on the biblical timeline (Darrell 2026-07-15:
                  "a lesson ... that connects the others ... on their respective
                  timelines"). Only Living Lessons are anchored on the spine, so this
                  is inert for other courses. */}
              {/* WHERE THIS SITS IN TIME (Darrell 2026-08-11: "easy context...
                  in all lessons... that need the timelines"). Was curated-only
                  and had rotted to 29/74 lessons; timelineContextFor() resolves
                  the Scripture a lesson already cites to its epoch(s), so every
                  lesson carries its era AND the years Scripture states there.
                  Curated placements still win and are kept first. */}
              {(() => {
                const ctx = timelineContextFor(m, { limit: 2 });
                if (ctx.length === 0) return null;
                const years = ctx.flatMap((c) => c.years).slice(0, 2);
                return (
                  <div className="mt-1 text-[0.5625rem] uppercase tracking-wider text-[#B85838]">
                    <span className="font-semibold">On the timeline:</span> {ctx.map((c) => c.era).join(' · ')}
                    {years.length > 0 && (
                      <span className="text-[#5A5751] normal-case"> · {years.map((y) => `${y.figure} (${y.ref})`).join(' · ')}</span>
                    )}
                  </div>
                );
              })()}
              {/* The card's scannable preview (big idea, benefits, hands-on,
                  anchor) shows only while the guide is CLOSED. The open guide's
                  Open/Apply/Send-off stages render the SAME four fields, so
                  keeping both put the whole lesson on screen twice in one
                  scroll (reported from the phone, 2026-08-03) — one lesson,
                  one copy. */}
              {!tutorOpen && (<>
              {/* EVERY SECTION TRAVELS (Darrell 2026-08-15: "a button to copy or
                  share any section as the text... an intro to that lesson for
                  each section... prompts the interest of the two people... so
                  the Word is clear to them"). Each section carries its own
                  Share: the section's text is the message body — the specific
                  idea that made the sender think of someone — with the link
                  back to this exact lesson under it. navigator.share first;
                  no sheet => the same control copies and says so honestly. */}
              {(() => {
                const secUrl = lessonUrl({ courseKey: course.meta.key, lessonId: m.id });
                const sec = (label, text) => (
                  <ShareButton
                    label="Share this part"
                    title={`Share "${label}" — the text plus a link to this ${U.noun}`}
                    className="text-[0.625rem] uppercase tracking-wider px-2.5 min-h-[2.75rem] border border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                    payload={() => sectionSharePayload(m, { label, text, url: secUrl, courseTitle: course.meta.title || '' })}
                  />
                );
                return (<>
              {/* THE WORDS GET THE WHOLE WIDTH; SHARE SITS UNDER THEM
                  (DR-0452). Darrell 2026-09-17, from his phone at A44 on lesson
                  49: "The share button shouldn't make the words only fit to one
                  side taking all that screen real-estate..."
                  He is describing this row's own shape. The prose and the Share
                  control were flex SIBLINGS (items-start justify-between), so
                  the button claimed a column of a 360px screen and the reading
                  was squeezed into what was left — and the taller the text, the
                  longer that narrow ribbon ran, with dead space beside all of
                  it. Chrome capping the button made this worse, not better: the
                  prose grew and the column it had did not.
                  The control now sits BENEATH its text, right-aligned — the same
                  shape the green verse strips already use at the foot of a
                  section (DR-0410's refsBelow). The text dominates the phone,
                  which is the standing rule (DR-0438). */}
              <div className="mt-2">
                <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{m.bigIdea}</p>
                {/* AND THE CONTROL IS PINNED, NOT GROWN (DR-0438 §1). Measured
                    at Big Print 44 before this: the Share control rendered
                    177x184px — a slab taller than six lines of the reading it
                    belonged to, because its rem-sized box rode the root scale.
                    Moving it below the prose alone would have left that slab
                    full-width. .ts-chrome-region holds it at its Normal size at
                    every text step: the words grow, the control does not. */}
                <div className="ts-chrome-region flex justify-end mt-1">{sec('The big idea', m.bigIdea || '')}</div>
              </div>
              {Array.isArray(m.benefits) && m.benefits.length > 0 && (
                <div className="mt-2 border-l-4 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] pl-3 py-2">
                  <div className="ts-chrome-region flex items-center justify-between gap-2 mb-1">
                    <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">What this frees in you</div>
                    {sec('What this frees in you', m.benefits.map((b) => `• ${b}`).join('\n'))}
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    {m.benefits.map((b, i) => (
                      <li key={i} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-2">
                <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                  <strong className="text-[#1A1815]">{handsOnLabel}:</strong> {m.inApp}
                </p>
                <div className="ts-chrome-region flex justify-end mt-1">{sec(handsOnLabel, m.inApp || '')}</div>
              </div>
              {m.anchor?.ref && (
                <div className="mt-2">
                  {/* THE REFERENCES HERE ARE TAPPABLE, BECAUSE THEY LOOK IT.
                      Darrell 2026-09-13, from this exact screen: "Links don't
                      work in last played." They were plain text inside a green
                      paragraph -- green because the PARAGRAPH is green, not
                      because anything was a link -- so the anchor line
                      advertised an affordance it did not have. That is the
                      hollow-surface class (DR-0381) wearing a different coat: a
                      surface that appears interactive and is not. WordInline
                      opens each reference in place, which is the promise the
                      rest of the app already makes ("Tap any verse reference to
                      read it right here"). */}
                  {/* THE RAW REFERENCE LIST IS NOT SHOWN TO A HUMAN AT ALL.
                      Darrell 2026-09-14, after seeing the first two attempts:
                      "all the lesson actual Word has been stripped and listed
                      instead of naturally inside the lessons" and "now we humans
                      get a computer list".
                      `m.anchor.ref` is a semicolon-joined MACHINE string -- every
                      reference the whole lesson stands on, eighty of them on
                      L149. Printing it mid-lesson was a wall of green semicolons
                      between the reader and the point; moving it to the foot was
                      still a computer list, just later. It is gone from the
                      reading view. What stays is what he asked for: the anchor's
                      THEME, which is teaching, and the Word quoted INLINE
                      throughout the prose, which is what "naturally inside the
                      lessons" means. The reader still collapses spoken runs
                      (DR-0391) and the presented deck keeps its closing
                      reference slide for a speaker who wants one. */}
                  {/* ONE FLEX ITEM, NOT TWO. WordInline renders the paragraph AND,
                      beneath it, the verses a reader opens -- two siblings. Placed
                      directly in this flex row those two became side-by-side
                      COLUMNS: the anchor crushed to one word per line down the
                      left edge while Psalms 73:26 took the width (Darrell
                      2026-09-14, 4:34pm: "What is this how can a human do
                      anything with this?"). The wrapper makes the pair one
                      block-flow item, so an opened verse stacks under its
                      sentence the way it does everywhere else. min-w-0 lets the
                      prose wrap instead of pushing the share control off. */}
                  {/* Full width now, with Share beneath (DR-0452) — the
                      min-w-0 dance below existed only to stop the share control
                      from being pushed off the row it no longer shares. */}
                  <div className="min-w-0">
                    <WordInline
                      text={`Anchor — ${m.anchor.theme || ''}`}
                      refsBelow
                      className="text-[0.6875rem] text-[#5A6E3D]"
                      style={{ fontFamily: '"Fraunces", serif' }}
                    />
                  </div>
                  <div className="ts-chrome-region flex justify-end mt-1">{sec('Anchor', m.anchor.theme || '')}</div>
                </div>
              )}
              {/* VOICES OF THE TIME (DR-0580). Darrell 2026-09-23: "History
                  should have quoted Historical figures most important and
                  familiar words in context of the time". Their own words,
                  verbatim from the named record, with the year, the occasion,
                  and why this lesson quotes them. The source is a real link —
                  the reader is meant to check it (the course's own care note). */}
              {Array.isArray(m.voices) && m.voices.length > 0 && (
                <div className="mt-2 border-l-4 border-[#B85838] bg-[#B85838]/[0.06] pl-3 py-2" data-testid="lesson-voices">
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold mb-1">
                    Voices of the time — their own words, dated
                  </div>
                  {m.voices.map((v, i) => (
                    <figure key={i} className="mb-2">
                      <blockquote className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>“{v.words}”</blockquote>
                      <figcaption className="text-[0.6875rem] text-[#5A5751] mt-0.5">
                        — {v.speaker}, {v.year}. {v.where}{' '}
                        <a href={v.source?.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#B85838]">{v.source?.title}</a>
                        {v.note ? ` · ${v.note}` : ''}
                      </figcaption>
                      {v.why && <p className="text-[0.6875rem] text-[#5A5751] mt-0.5">{v.why}</p>}
                    </figure>
                  ))}
                  <div className="ts-chrome-region flex justify-end mt-1">{sec('Voices of the time', m.voices.map((v) => `“${v.words}” — ${v.speaker}, ${v.year}`).join('\n'))}</div>
                </div>
              )}
              {/* THE RECORD, DATED (DR-0580) — "Timelines management". Every year
                  this lesson names is on this list with the record it can be
                  checked against, and the gate holds both directions, so the
                  list cannot rot as the lesson is edited. */}
              {Array.isArray(m.timeline) && m.timeline.length > 0 && (
                <div className="mt-2 border-l-4 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] pl-3 py-2" data-testid="lesson-timeline">
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">
                    Timeline — the record, dated
                  </div>
                  <ol className="text-sm text-[#1A1815] space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
                    {m.timeline.map((t, i) => (
                      <li key={i}>
                        <strong>{t.year}</strong> — {t.event}{' '}
                        <span className="text-[0.6875rem] text-[#5A5751]">Record: {t.record}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="ts-chrome-region flex justify-end mt-1">{sec('Timeline', m.timeline.map((t) => `${t.year} — ${t.event} (Record: ${t.record})`).join('\n'))}</div>
                </div>
              )}
              {/* WORK THE CASE (DR-0601). Darrell 2026-09-24: "not bringing data
                  driven claims into the classroom about how to process a claim...
                  with an actual claim... just hypothetically explaining... show
                  historical experiences, events and situations that had risk,
                  opportunities and constraints... economics of each for students
                  to See How" — and "Humans behave behind closed doors and now in
                  the light of day... the biblical scriptures also explain the same
                  thing about us human beings." One actual claim, the dated event,
                  what was hidden and how the record lit it, the risk, the
                  opportunity, the constraint, the figures with their records, the
                  competency applied step by step, and what is settled and open. */}
              {m.workedCase && (
                <div className="mt-2 border-l-4 border-[#1A1815] bg-[#1A1815]/[0.04] pl-3 py-2" data-testid="lesson-worked-case">
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#1A1815] font-semibold mb-1">
                    Work the case — an actual claim, with the data
                  </div>
                  <blockquote className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>“{m.workedCase.claim?.words}”</blockquote>
                  <p className="text-[0.6875rem] text-[#5A5751] mt-0.5">
                    — {m.workedCase.claim?.by}.{' '}
                    {m.workedCase.claim?.source?.url && <a href={m.workedCase.claim.source.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#B85838]">{m.workedCase.claim.source.title}</a>}
                  </p>
                  {m.workedCase.event && <p className="text-sm text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}><strong>The event, {m.workedCase.event.year}.</strong> {m.workedCase.event.what}</p>}
                  {m.workedCase.closedDoors && (
                    <div className="mt-1 text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                      <p><strong>Behind closed doors.</strong> {m.workedCase.closedDoors.hidden}</p>
                      <p><strong>In the light of day.</strong> {m.workedCase.closedDoors.light}</p>
                      <WordInline text={`The Word on it — ${m.workedCase.closedDoors.verse || ''}`} refsBelow className="text-[0.6875rem] text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }} />
                      {m.workedCase.closedDoors.heart && <WordInline text={`Why we do it — ${m.workedCase.closedDoors.heart}`} refsBelow className="text-[0.6875rem] text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }} />}
                    </div>
                  )}
                  <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-1 mt-1 text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                    <div><dt className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold">Risk</dt><dd>{m.workedCase.risk}</dd></div>
                    <div><dt className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">Opportunity</dt><dd>{m.workedCase.opportunity}</dd></div>
                    <div><dt className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Constraint</dt><dd>{m.workedCase.constraint}</dd></div>
                  </dl>
                  {Array.isArray(m.workedCase.economics) && m.workedCase.economics.length > 0 && (
                    // A STACKED LIST, NOT A GRID (2026-09-24, DR-0602 live review on the
                    // built bundle at 412px): the two-column grid gave the figure cell a
                    // no-wrap class, so one long figure ("14.7 · 13.2 · 12.7 · 5.6 · 5.5
                    // per cent · 80.75 million barrels · 98 countries") pushed the grid
                    // past the phone's edge and starved the meaning column to a sliver
                    // ~270px tall per row. Each figure now takes its own line and wraps;
                    // the meaning and its record sit beneath it at any width. The render
                    // pin in history-course.test.js refuses a grid or a no-wrap figure here.
                    <div className="mt-1 text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }} data-testid="lesson-worked-case-economics">
                      <div className="text-[0.625rem] uppercase tracking-wider text-[#1A1815] font-semibold">The economics — figures from the record</div>
                      <ul className="list-none pl-0 m-0">
                        {m.workedCase.economics.map((e, i) => (
                          <li key={i} className="border-t border-[#E8E4DC] py-0.5">
                            <div className="font-semibold break-words">{e.figure}</div>
                            <div>{e.meaning} <span className="text-[0.6875rem] text-[#5A5751]">Record: {e.record}</span></div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(m.workedCase.steps) && (
                    <ol className="mt-1 list-decimal pl-5 text-sm text-[#1A1815] space-y-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                      {m.workedCase.steps.map((st, i) => <li key={i}>{st}</li>)}
                    </ol>
                  )}
                  <p className="text-sm text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}><strong>Settled.</strong> {m.workedCase.settled}</p>
                  <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}><strong>Still open.</strong> {m.workedCase.stillOpen}</p>
                  <div className="ts-chrome-region flex justify-end mt-1">{sec('Work the case', workedCaseText(m.workedCase))}</div>
                </div>
              )}
                </>);
              })()}
              {/* THE LORD'S MATRIX (Darrell 2026-08-10) — the other lessons
                  standing on the SAME Scripture, DERIVED from the citations in
                  the lessons themselves so it can never claim a link that is not
                  really there, and so it grows on its own as the series grows.
                  A lesson read alone is a fragment; this is what makes the
                  integration visible on the page the reader is already on. */}
              {(() => {
                const kin = matrixFor(m, schedule);
                if (kin.length === 0) return null;
                return (
                  <div className="mt-2 border-l-4 border-[#B85838] bg-[#B85838]/[0.06] pl-3 py-2">
                    <div className="ts-chrome-region flex items-center justify-between gap-2 mb-1">
                      <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold">
                        The Lord’s Matrix — where else this Word stands
                      </div>
                      <ShareButton
                        label="Share this part"
                        title="Share where else this Word stands — with a link to this lesson"
                        className="text-[0.625rem] uppercase tracking-wider px-2.5 min-h-[2.75rem] border border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                        payload={() => sectionSharePayload(m, {
                          label: 'The Lord’s Matrix — where else this Word stands',
                          text: kin.map((k) => `L${ownNumber(k, schedule)} ${k.title} — same Word: ${k.shared.join(', ')}`).join('\n'),
                          url: lessonUrl({ courseKey: course.meta.key, lessonId: m.id }),
                          courseTitle: course.meta.title || '',
                        })}
                      />
                    </div>
                    <ul className="space-y-1">
                      {kin.map((k) => (
                        <li key={k.id} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                          <button
                            type="button"
                            onClick={() => openLesson(k.id)}
                            className="text-left underline decoration-[#B85838]/40 hover:decoration-[#B85838]"
                          >
                            L{ownNumber(k, schedule)} {k.title}
                          </button>
                          <span className="text-[#5A5751]"> — same Word: {k.shared.join(', ')}</span>
                        </li>
                      ))}
                    </ul>
                    {/* The invitation — a reader who opens exactly ONE lesson is
                        handed the strongest next one, with the shared Word named
                        as the reason. Derived, so it can never invite someone to
                        a connection that is not real. */}
                    {(() => {
                      const next = readNextInvitation(m, schedule);
                      if (!next) return null;
                      return (
                        <p className="text-xs text-[#1A1815] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                          <span className="font-semibold">Read this next: </span>
                          <button
                            type="button"
                            onClick={() => openLesson(next.id)}
                            className="text-left underline decoration-[#B85838]/50 hover:decoration-[#B85838]"
                          >
                            L{ownNumber(next, schedule)} {next.title}
                          </button>
                          <span className="text-[#5A5751]"> — {next.why}</span>
                        </p>
                      );
                    })()}
                  </div>
                );
              })()}
              </>)}

              {/* World-Issues / Discernment modules carry a structured `issue`:
                  render the dedicated five-stage walk-through. Other courses have
                  no `issue`, so this is inert for them. */}
              {m.issue && <DiscernmentStages issue={m.issue} />}

              {actionsRow}

              {/* The solo tutor for this week */}
              {tutorOpen && (
                <div id={`tutor-panel-${m.id}`}>
                  <TutorPanel
                    module={m}
                    flush={!!focusModule}
                    onLaunch={onLaunch}
                    tutorCourseMeta={tutorCourseMeta}
                    handsOnLabel={handsOnLabel}
                    level={learnLevel}
                    ageBand={ageBand}
                    levelOverride={levelOverride}
                    setAgeBand={setAgeBand}
                    setLearnLevel={setLearnLevel}
                    onEngagement={onEngagement}
                    venueAware={venueAware}
                    quizSaved={quizState[m.id] || null}
                    onRecordQuiz={recordQuiz}
                    unitNoun={U.noun}
                    sessionFlow={sessionFlow}
                    onPlace={savePlace}
                    onAdvance={advanceFrom(m.id)}
                    /* THE END OF A LESSON IS A DOOR (Darrell 2026-09-16). All
                       lessons returns to the index the same way the bar does;
                       Start over puts the reader back at part 1 AND clears the
                       saved place, which is what "if it's over, it's over"
                       requires — otherwise the next read resumes at the end. */
                    /* LEAVING BY THE END DOOR IS FINISHING (DR-0631). Before
                       this, only the read-aloud's last sentence could mark a
                       lesson finished; a reader who walked it to the end by hand
                       left it "in progress" forever, and Continue offered them
                       the send-off they had just read. */
                    onAllUnits={focusModule ? () => { finishPlace({ courseKey: course.key, lessonId: m.id }); setFocusId(null); } : null}
                    onStartOver={() => { savePlace({ lessonId: m.id, stage: 0, step: 0 }); }}
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

      {/* WHAT THIS COSTS YOU IN TIME — shown before the decision, and shown to
          everyone, because a reader deciding whether to start needs it whether
          or not they are signed in. Every number is derived from the same
          functions the lesson player uses (lib/course-duration.js), so this and
          the strip inside a lesson cannot disagree in front of one reader. The
          two speeds are read FROM the app's own rate control, so a speed can
          never be advertised here that the player cannot actually do. */}
      {!focusModule && duration && (
        <div className="border border-[#E8E4DC] p-4 mb-5" data-testid="course-duration">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>How long this takes</h3>
            <span className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {duration.lessons} {duration.lessons === 1 ? U.noun : U.plural}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {duration.listen.map((l) => (
              <span key={l.rate} className="text-sm text-[#1A1815]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <strong>{l.label}</strong> {formatDuration(l.minutes)}
              </span>
            ))}
          </div>
          <p className="text-[0.6875rem] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Listening time for the whole thing, read aloud at the speed you pick in the reader.
            About {formatDuration(duration.listen[0].minutes / duration.lessons)} per {U.noun} at 1×.
            These numbers are for the <strong>{duration.levelId}</strong> version — the level you choose changes the length, because each one is written out in full.
          </p>
        </div>
      )}

      {/* Your progress — real, from the signed-in record. Absent (not zeroed)
          when the course carries no progressSummary: a painted 0% would be a
          number with nothing behind it (DR-0061). */}
      {toggleModule && !focusModule && prog && (
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

      {/* THE ABSENCE EXPLAINS ITSELF (Darrell 2026-09-18: "what happened to the
          progress bar?"). Measured before changing anything: signed in, the bar
          above renders on every department tab and counts correctly. Signed
          OUT, the whole panel vanished — no bar, no percentage, no heading —
          and an unexplained absence reads as a break. Progress is genuinely
          per-person and cannot be shown without a person, so the honest fix is
          to say that rather than paint a 0% nobody earned. */}
      {!toggleModule && !focusModule && prog && (
        <div className="border border-dashed border-[#E8E4DC] p-4 mb-5" data-testid="progress-needs-signin">
          <h3 className="text-base font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>Your progress</h3>
          <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Sign in and your place is kept — each {U.noun} you finish is counted from your own record, just for you. Until then you can read everything here; nothing is locked.
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
        {inNumberOrder(schedule).map((m) => (
          <div key={m.id} style={{ pageBreakInside: 'avoid', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{U.cap} {ownNumber(m, schedule)} — {m.title}{!U.selfPaced && m.date ? ` · ${fmtDate(m.date)}` : ''}</h2>
            <p><strong>Big idea.</strong> {m.bigIdea}</p>
            {Array.isArray(m.benefits) && m.benefits.length > 0 && (
              <><p><strong>What this frees in you</strong></p>
              <ul>{m.benefits.map((b, i) => <li key={i}>{b}</li>)}</ul></>
            )}
            {m.lesson && <p><strong>Lesson.</strong> {m.lesson}</p>}
            <p><strong>{handsOnLabel}.</strong> {m.inApp}</p>
            {m.anchor?.ref && <p><strong>Anchor — {m.anchor.ref}.</strong> {m.anchor.theme}</p>}
            {/* The voices and the dated record print with the lesson (DR-0580):
                a facilitator working from paper has the words and the years. */}
            {Array.isArray(m.voices) && m.voices.length > 0 && (
              <><p><strong>Voices of the time</strong></p>
              <ul>{m.voices.map((v, i) => <li key={i}>“{v.words}” — {v.speaker}, {v.year}. {v.where} ({v.source?.title})</li>)}</ul></>
            )}
            {Array.isArray(m.timeline) && m.timeline.length > 0 && (
              <><p><strong>Timeline — the record, dated</strong></p>
              <ul>{m.timeline.map((t, i) => <li key={i}>{t.year} — {t.event} Record: {t.record}</li>)}</ul></>
            )}
            {m.workedCase && (
              <><p><strong>Work the case — an actual claim, with the data</strong></p>
              <p style={{ whiteSpace: 'pre-line' }}>{workedCaseText(m.workedCase)}</p></>
            )}
            {/* The printed guide carries the same integrations the screen shows —
                a facilitator working from paper sees the cross-lesson web AND
                where the lesson sits in time, with the years. */}
            {timelineContextText(m) && (
              <p style={{ whiteSpace: 'pre-line' }}>{timelineContextText(m)}</p>
            )}
            {matrixFor(m, schedule).length > 0 && (
              <p style={{ whiteSpace: 'pre-line' }}>{matrixBlockText(m, schedule)}</p>
            )}
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
  initialDept = null,         // department id to open on (e.g. a deep link to the Eternal Algorithms); unknown → the whole catalog
  eternalStudyProps = null,   // { email, view, churchView, setView, setChurchView } for the study surface mounted under its department
}) {
  const [interestSent, setInterestSent] = useState({}); // keyed by course key
  const [helped, setHelped] = useState({}); // keyed by course key
  // A LINK TO THE EXACT LESSON (Darrell 2026-08-10: "links to the exact
  // lessons"). Before this the URL carried only the Learn TAB, so handing
  // someone one lesson meant sending them to a course picker and telling them
  // what to hunt for. `?course=…&lesson=…` is read ONCE, here, and resolved
  // against the MOUNTED catalog below — a link to a course or lesson that no
  // longer exists simply opens Learn normally, never a dead screen.
  const deepLink = useState(() => parseLessonLink(
    (typeof window !== 'undefined' && window.location && window.location.search) || '',
  ))[0];
  // WHICH COURSE — a CHOICE, remembered, never a heading. Darrell 2026-09-06,
  // on the picker reading like a titled section over one course's lessons:
  // "have the default say Select a Course of 23? Then leave it on the last
  // one?" A device that has never chosen starts with NO course chosen (the
  // select shows the prompt); a device that has chosen — through the picker,
  // a deep link, a resume, or opening a lesson — reopens on that course. The
  // saved place is the fallback memory: a learner mid-course is on that course.
  // `active` below still falls back to the A.I. course for the CONTENT, so
  // nothing under the picker is ever empty; only the select tells the truth
  // about whether a choice was made.
  const [activeKey, setActiveKeyState] = useState(() => {
    const remembered = rememberedCourseKey();
    if (remembered) return remembered;
    const place = getPlace();
    return place && place.courseKey ? place.courseKey : null;
  });
  const setActiveKey = useCallback((key) => { setActiveKeyState(key); rememberCourseKey(key); }, []);
  const [courseSort, setCourseSort] = useState('authored'); // picker order (DR-0121: derived groups, live counts)
  // The lesson finder (Darrell 2026-08-18: "not obvious how to find a lesson
  // unless you already know the course it is in") — one search box over EVERY
  // mounted course's live schedule. Results jump through the SAME real path
  // the resume banner drives, so a found lesson opens exactly like a resumed
  // one (never a painted list).
  const [lessonQuery, setLessonQuery] = useState('');
  // Resume-your-place (Darrell 2026-07-30), ONE PLACE PER LESSON since
  // DR-0631. Read live on every render (client-only app; the same
  // read-in-render pattern as ux-signals' "Recently opened"), so leaving a
  // lesson brings its Continue straight back — the old banner was read once
  // on mount and nulled on its first use, and measured, it did not return
  // until Learn remounted. `placesTick` re-renders after a place is forgotten.
  const [, setPlacesTick] = useState(0);
  // The lesson CourseView should open + scroll to after a resume tap.
  const [resumeLessonId, setResumeLessonId] = useState(null);
  // Rises on every open() — see resumeNonce on the inner component: re-opening
  // the SAME lesson must still arrive, and "Recently opened" is where that is
  // the normal case rather than the edge one.
  const [resumeNonce, setResumeNonce] = useState(0);
  const [resumeOpenGuide, setResumeOpenGuide] = useState(true);
  // ▶ Play from any LIST of titles. The card list already had one; the by-title
  // index, the "Recently opened" chips and the finder's hits are the same act —
  // pick a lesson from a list — and only the card list could open the reader.
  // The nonce makes a second tap on the same title work.
  const [presentRequest, setPresentRequest] = useState(null);
  const playLesson = (courseKey, lessonId) => {
    setActiveKey(courseKey);
    setResumeOpenGuide(false);
    setResumeLessonId(lessonId);
    setPresentRequest({ lessonId, nonce: Date.now() });
  };

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
    // Its department is the one the catalog registry declares for this key
    // (DR-0149, DR-0447) — merged BY the registry, never retyped here, so it
    // cannot be dropped in transit the way the cohort courses' was.
    meta: catalogMeta('ai', CLASS_META),
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
  const chosenCourse = activeKey != null ? courses.find((c) => c.key === activeKey) : null;
  const courseChosen = !!chosenCourse;
  // THE DEFAULT COURSE IS LIVING LESSONS (Darrell 2026-09-11: "let the default
  // courses be... Living Lessons not Ai etc"). Learn opened on the A.I. course
  // purely because it was the first one ever built and the fallback was written
  // as its name; a visitor met "Learning A.I. The Way" as though it were what
  // this church teaches. Living Lessons is the Word course and belongs first.
  // Resolved by KEY against the MOUNTED catalog, with the old fallback kept
  // behind it, so an instance that does not carry Living Lessons still opens on
  // something real instead of a blank (never assume a course exists — DR-0061).
  // A device that has already CHOSEN keeps its choice; this only decides where
  // someone lands who has not picked yet.
  const defaultCourse = courses.find((c) => c.key === 'living-lessons') || aiCourse;
  // THE SCHOOL (DR-0432). Learn is one program of DEPARTMENTS derived from the
  // mounted catalog (lib/learn-organize.js): the Courses tab is the whole
  // catalog as usual; a department tab narrows the picker, the finder and the
  // shelf to its own courses, and the open course follows — a course chosen
  // elsewhere is kept, a department opens on its first course. A department
  // that does not exist (a stale link) falls back to the whole catalog: never
  // a dead door.
  const departments = learnDepartments(courses);
  // A.I. UNDERSTANDING BUILT INTO THE CURRICULUM (DR-0448). Darrell 2026-09-16:
  // "Most people want Ai understanding built in their curriculum"; "can we use
  // cross-referenced lessons that get credited either way." A department also
  // gathers the lessons its subject is taught in ELSEWHERE — pointers into
  // their home courses, so a lesson keeps one home and therefore one credit
  // (lib/learn-crosslist.js). Built only for a department that declares any,
  // and only while one is open.
  const [deptId, setDeptId] = useState(() => initialDept || 'all');
  const dept = departments.find((d) => d.id === deptId) || null;
  const gathered = (dept && crossListingsFor(dept.label).length)
    ? resolveCrossListed(dept.label, buildLessonIndex(courses))
    : [];
  // AND THE SAME QUESTION ONE LEVEL UP (DR-0516). Darrell 2026-09-18, reading
  // this picker: "we only show one business course... each one could be
  // considered a business course as well as another because it is integration
  // of it throughout." A department also gathers WHOLE COURSES it is served by
  // — pointers, so each keeps one home, one count and one credit. Same rule as
  // the lessons above, same file, one level up.
  const gatheredCourses = (dept && courseCrossListingsFor(dept.label).length)
    ? resolveCourseCrossListed(dept.label, courses)
    : [];
  const visibleCourses = dept ? dept.courses : courses;
  const active = (chosenCourse && (!dept || dept.courses.some((c) => c.key === chosenCourse.key)))
    ? chosenCourse
    : (dept ? (dept.courses[0] || defaultCourse) : defaultCourse);
  const totalLessons = courses.reduce((t, c) => t + courseLessonCount(c), 0);

  // Open what the link asked for, once, and only when it really exists.
  const linkAppliedRef = React.useRef(false);
  // `courses` is rebuilt every render, so the resolution reads it through a ref
  // instead of depending on it — the link is applied exactly once, on the first
  // render where the catalog holds the target.
  const coursesRef = React.useRef(courses);
  coursesRef.current = courses;
  React.useEffect(() => {
    if (linkAppliedRef.current || !deepLink || !deepLink.courseKey) return;
    const target = coursesRef.current.find((c) => c.key === deepLink.courseKey);
    if (!target) { linkAppliedRef.current = true; return; } // stale link: Learn opens normally
    linkAppliedRef.current = true;
    setActiveKey(target.key);
    if (deepLink.lessonId && (target.schedule || []).some((m) => m.id === deepLink.lessonId)) {
      // The same real path a "Resume →" tap drives: the lesson's own space,
      // guide open, scrolled to the top.
      setResumeOpenGuide(true);
      setResumeLessonId(deepLink.lessonId);
    }
  }, [deepLink, setActiveKey]);

  // A lesson space is open in the active course (DR-0264): the wrapper's own
  // chrome — catalog line, course picker/sort, resume banner — leaves the
  // screen so the space holds ONLY the lesson. Set by CourseView.
  const [lessonFocus, setLessonFocus] = useState(false);

  // THE LONG LIST IS THE DEFAULT; A SHELF IS A LENS THE READER PICKS (Darrell
  // 2026-09-24, shown Living Lessons folded into eight collapsed sections:
  // "I would rather have the long list than this! ... This is just totally
  // different feel and process!!!!!!"). Every course lists its lessons the
  // same way — one flat list — and a long course ADDS a select naming the
  // Word's divisions (lib/lesson-sections.js) so a reader who wants "the ones
  // in Proverbs" can narrow the list to that shelf. Nothing is folded away
  // by default. The choice is held per course and forgotten on leaving it.
  const [lessonShelfPick, setLessonShelfPick] = useState({ courseKey: '', shelf: 'all' });
  React.useEffect(() => { setLessonShelfPick({ courseKey: '', shelf: 'all' }); }, [active.key]);
  // THE ORDER IS THE READER'S, AND THE DEVICE REMEMBERS IT (Darrell 2026-09-24:
  // "There's no way to see the list in chronological order?!!!" / "They are
  // numbered!!!!!!!"). By number, first to last, is the default; the pick is
  // kept per course on this device (lib/lesson-order.js, storage guarded).
  const [lessonOrderPick, setLessonOrderPick] = useState({});
  const pickLessonOrder = (courseKey, order) => {
    setLessonOrderPick((p) => ({ ...p, [courseKey]: order }));
    rememberLessonOrder(courseKey, order);
  };

  // Resolve the saved places against the MOUNTED catalog (verify before
  // relying on them): a course or lesson that no longer exists offers nothing
  // — no Continue can ever point at a dead door. Every lesson begun and not
  // finished, newest first (DR-0631).
  const inProgress = resolvePlaces(listPlaces({ inProgress: true }), courses);
  const activeContinue = inProgress.find((it) => it.course.key === active.key) || null;
  const activePlaces = Object.fromEntries(listPlaces({ courseKey: active.key }).map((p) => [p.lessonId, p]));
  // CONTINUE — one path for every Continue on the page. Opens the lesson's
  // course (leaving a department filter that would hide it), opens its space
  // with the guide at the saved part and step, and lands on the sentence.
  const resumeNow = (place) => {
    if (!place) return;
    if (dept && !dept.courses.some((c) => c.key === place.courseKey)) setDeptId('all');
    setActiveKey(place.courseKey);
    setResumeOpenGuide(true);
    setResumeLessonId(place.lessonId);
    setResumeNonce((n) => n + 1);
  };
  // START FRESH forgets ONE lesson's place — the one named on the button.
  const startFresh = (place) => {
    clearPlace(place ? { courseKey: place.courseKey, lessonId: place.lessonId } : {});
    setPlacesTick((n) => n + 1);
  };
  // REFRESH FIRST (DR-0418): back the saved place up a couple of paced steps,
  // then resume exactly as Continue does — the lesson space reads the place
  // live, so it opens on the refresher rather than the frontier.
  const refreshFirst = (place) => {
    if (!place) return;
    refreshPlace({ courseKey: place.courseKey, lessonId: place.lessonId });
    resumeNow(place);
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

  // FULL WIDTH, LIKE EVERY OTHER PAGE (Darrell 2026-09-14: "the lessons are
  // supposed to be the full width of the window... like all pages").
  // MEASURED in a real browser at 1440px rather than guessed: window 1440,
  // <main> 1440, and the lesson card 768 -- constrained by exactly this one
  // `max-w-3xl` on the section below. It was the ONLY limiter in the whole
  // ancestor chain, so that single class was the entire cause.
  return (
    <section className="w-full" aria-labelledby="learn-h">
      <div className="print:hidden">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Church · Learn</div>
        {/* THE DEPARTMENTS (DR-0432). One row of sliding tabs over the whole
            program: Courses (everything, as usual) and one tab per department
            derived from the catalog's own categories — so it reads like a
            school's catalog and not a pile. Counts are counted from the live
            schedules, never typed. Hidden while a lesson is in focus. */}
        {courses.length > 1 && !lessonFocus && (
          <div className="mt-1 mb-4" data-testid="learn-departments">
            <div className="text-[0.6875rem] text-[#5A5751] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>
              One program · {departments.length} departments · {courses.length} courses · {totalLessons} lessons
            </div>
            <SectionTabs
              ariaLabel="Learn departments"
              idBase="learn-dept"
              activeId={dept ? dept.id : 'all'}
              onActiveChange={(id) => {
                // Darrell, 2026-09-19, from his phone: "When I click the
                // business tab... it moves me into the first lesson of the
                // series... instead of just the tab like others... then its
                // hard to get back!!!!!"
                //
                // The cause: resumeLessonId is WRAPPER state and nothing
                // cleared it on a department change. CourseView re-mounts on
                // the new department's course (key={active.key}), sees a
                // resume id still set, and opens that lesson's space
                // immediately -- which also hides these very tabs and the
                // picker, so there was no way back out. A tab is navigation,
                // not a resume: it lands you on the department, never inside
                // a lesson.
                setResumeLessonId(null);
                setResumeOpenGuide(false);
                setDeptId(id);
              }}
              sections={[
                { id: 'all', label: 'Courses', explain: `Every course in one place · ${courses.length} courses · ${totalLessons} lessons. Pick a course and its lessons follow.`, render: () => null },
                ...departments.map((d) => ({
                  id: d.id, label: d.label,
                  explain: `${d.code} · ${d.courses.length} ${d.courses.length === 1 ? 'course' : 'courses'} · ${d.lessons} lessons${courseCrossListedCount(d.label) ? ` · ${courseCrossListedCount(d.label)} more courses serve it` : ''}${crossListedCount(d.label) ? ` · ${crossListedCount(d.label)} more lessons taught across the curriculum` : ''}`,
                  render: () => null,
                })),
              ]}
            />
            {/* ALSO TAUGHT ACROSS THE CURRICULUM (DR-0448) — the department's
                subject where the rest of the program teaches it. Every row is a
                real mounted lesson read live (title, course, unit, reference),
                and opening one goes to that lesson IN ITS HOME COURSE: the
                catalog view, the home course selected, that lesson opened. One
                home, one place record, one credit — whichever shelf you find it
                on. A declaration whose lesson no longer exists fails the build
                (learn-crosslist.test.js) rather than rendering a dead row. */}
            {/* WHOLE COURSES THAT SERVE THIS DEPARTMENT (DR-0516). A course has one
                HOME — what it forms — and any number of shelves it serves. Tapping one
                opens it in the full catalog, in its own course, so the count and the
                credit never fork. Each row names where it actually lives, so the shelf
                never implies a second identity. A declaration naming a course the
                catalog does not carry fails the build (course-crosslist.test.js). */}
          </div>
        )}

        {/* THE COURSE PICKER SITS FIRST — ABOVE THE CATALOG LINE AND ABOVE
            RESUME. Darrell, 2026-09-06, after saying it repeatedly: "the course
            drop down is still not above the lessons scroll... we need the scroll
            and the lookup to be below the course picking drop downs... its hard
            to find!!! I've said this already too many times" — and then, with a
            screenshot of the live Learn tab: "even above where you left off".

            WHY IT HAD NOT MOVED, recorded so the mistake is not repeated: the two
            previous passes at "hard to find" both answered with a NEW control --
            the sticky "All lessons" landmark bar below (data-testid="lessons-bar")
            and the lesson finder -- while the picker itself stayed underneath the
            catalog line and the resume banner. A jump link is not the control he
            named. This moves the control.

            ORDER IS THE FEATURE: choose the course FIRST, then everything that
            depends on that choice (resume, the lessons bar, the finder, the
            schedule scroll) reads underneath it. Held by
            learn-course-picker-is-first.test.jsx, which asserts DOM ORDER rather
            than the presence of the control -- presence was never the problem. */}
        {/* Course picker (Darrell 2026-07-10: "better organize the learn lessons
            with sorts and dropdowns") — 18 courses as a wall of buttons made the
            reader scroll past everything; a grouped NATIVE select opens the
            phone's own picker in one tap, with the Deep-Processing family in its
            own group and a sort control. Groups + counts derive live from the
            mounted courses (lib/learn-organize.js, DR-0121). */}
        {/* THE PICKER APPEARS WHENEVER THERE IS SOMEWHERE ELSE TO GO — its own
            courses OR the ones that serve it. It used to require two of the
            department's OWN courses, which is why a one-course department like
            Business had no dropdown at all, and why the fourteen courses
            serving it had to be stacked underneath as a wall of text. That
            wall is what Darrell called garbage on 2026-09-19. Counting the
            cross-listed courses here only decides whether the control is worth
            showing; it never changes a course count anywhere (DR-0516). */}
        {/* AND IT IS AT THE TOP OF EVERY DEPARTMENT TAB, EVEN A ONE-COURSE ONE
            (Darrell 2026-09-24, on History's shelf reading "1 course · 8 lessons
            · 17 more lessons taught across the curriculum" with no dropdown:
            "Already said this but the drop down needs to be at the top of the
            tab for choices!"). The previous rule showed the control only when
            there were two places to go; a department with one course of its own
            and none serving it had NO dropdown, and its seventeen gathered
            lessons were the first thing on the tab. The dropdown is the
            department's choice control; it renders whenever the department has
            a course at all (DR-0598). */}
        {visibleCourses.length >= 1 && !lessonFocus && (
          <div className="flex flex-wrap items-end gap-3 mb-5 border-b border-[#E8E4DC] pb-3">
            <div className="grow min-w-[14rem]">
              {/* A SELECTOR, not a section title (Darrell 2026-09-06: "even more
                  obvious that this is a selection of courses... not a titled
                  section with only those lessons below"). The label says what
                  the control DOES. The chosen course is still remembered
                  (lib/learn-organize.js) so Learn reopens on the last one — but
                  the control itself always shows the prompt, never that course,
                  so it can never be mistaken for a heading over the lessons
                  underneath. Which course is open is stated ONCE, statically,
                  in the <h2> below. */}
              <label htmlFor="learn-course-pick" className="block text-xs uppercase tracking-wider text-[#B85838] font-semibold mb-1">
                {dept ? dept.label : 'Courses'} · select one of {visibleCourses.length}
              </label>
              <select
                id="learn-course-pick"
                // ALWAYS the prompt, never the current course (Darrell
                // 2026-09-11: "have the choose a course blank or say choose
                // another course and leave the current static name above the
                // listed lessons inside the course area"). A select that
                // displays the open course reads like a TITLE for the lessons
                // under it, which is what hid the fact that other courses
                // existed at all. The open course is named once, statically,
                // in the <h2> above the lessons; this control's only job is to
                // go somewhere else.
                value={''}
                data-chosen={courseChosen ? 'true' : 'false'}
                onChange={(e) => {
                  const k = e.target.value;
                  if (!k) return;
                  // A course that only SERVES this department lives somewhere
                  // else (DR-0516: one home, one credit). Leaving the
                  // department filter on would hide the course the reader just
                  // picked, because it is not in this department's own list —
                  // so opening one drops the filter, exactly as the old shelf
                  // did before it moved in here.
                  if (gatheredCourses.some((r) => r.courseKey === k)) {
                    setDeptId('all');
                    setResumeOpenGuide(false);
                  }
                  setActiveKey(k);
                }}
                className={`w-full min-h-[48px] px-3 py-2 bg-white border-2 text-sm font-semibold focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${courseChosen ? 'border-[#1A1815]' : 'border-[#B85838]'}`}
                style={{ fontFamily: '"Fraunces", serif' }}
              >
                <option value="">{(visibleCourses.length + (dept ? gatheredCourses.length : 0)) === 1 ? `This department's course · 1 · pick it to open` : `Choose another course · ${visibleCourses.length}${dept && gatheredCourses.length ? ` + ${gatheredCourses.length} that serve it` : ''} to choose from`}</option>
                {organizeCourses(visibleCourses, courseSort).map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.courses.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.key === active.key ? '● ' : ''}{c.code} · {c.meta.title} · {courseLessonCount(c)} lessons
                      </option>
                    ))}
                  </optgroup>
                ))}
                {/* COURSES THAT SERVE THIS DEPARTMENT, IN THE PICKER ITSELF.
                    Darrell 2026-09-19, shown the stacked shelf this replaced:
                    "Not this list!!!!! Inside the dop down as options under the
                    original or course/s that exist..." and, of the shelf,
                    "Garbage...". They are OPTIONS now, in their own labelled
                    group beneath the department's own, each naming the
                    department it actually lives in. The counts above are
                    deliberately NOT summed — a cross-listing is a pointer, so
                    Business stays one course that fourteen others serve, never
                    fifteen courses (DR-0516 / DR-0448). */}
                {dept && gatheredCourses.length > 0 && (
                  <optgroup label={`Also serves ${dept.label} · taught elsewhere`}>
                    {gatheredCourses.map((r) => (
                      <option key={`serves-${r.courseKey}`} value={r.courseKey}>
                        {r.courseTitle} · {r.homeDepartment} · {r.lessons} {r.lessons === 1 ? String(r.unitCap).toLowerCase() : `${String(r.unitCap).toLowerCase()}s`}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <label htmlFor="learn-course-sort" className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Sort courses</label>
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

        {/* PICK UP WHERE YOU LEFT OFF — directly under the course picker
            (DR-0631). Darrell has said twice that the picker comes first,
            "even above where you left off" (2026-09-06), so this is the first
            thing AFTER it. Measured before: the only Continue on the tab sat
            at y≈2,084 on an 844-px phone, below the whole lesson index and the
            finder, and it named one lesson per device. Now: the latest lesson
            as one big button, every other lesson begun beneath it, each one
            tap, each resolved against the mounted catalog (LessonContinue.jsx;
            lib/learn-resume.js). Hidden only while a lesson is open. */}
        {!lessonFocus && inProgress.length > 0 && (
          <ContinueOffer
            items={inProgress}
            onContinue={resumeNow}
            onRefresh={refreshFirst}
            onForget={startFresh}
          />
        )}

        {/* THE CROSS-LIST BLOCKS SIT BELOW THE PICKER, NEVER ABOVE IT.
            Darrell, 2026-09-19, with a screenshot of the Business tab:
            "Where is the drop-down?!!!!!!!!!! For all tabs..."

            They used to render inside the department block, which put a wall
            of cross-listed rows between the department tabs and the course
            picker -- so on a department with one course of its own and
            fourteen that serve it, the reader met the wall and never saw the
            dropdown at all. That is the SAME complaint as 2026-09-06 ("its
            hard to find!!! I have said this already too many times"), and the
            order test written then only guarded the picker against the
            catalog line and Resume, so it was blind to this. It now guards
            against these blocks too.

            The courses that serve a department are already options INSIDE the
            picker (DR-0516), so the picker alone is enough to choose one. */}
            {dept && dept.id === 'the-eternal-algorithms' && (
              <div className="mt-3 mb-2 border border-[#E8E4DC] bg-white p-3" data-testid="eternal-study-in-learn">
                <React.Suspense fallback={<p className="text-xs text-[#5A5751]">Opening the study…</p>}>
                  <EternalAlgorithmsStudyLazy {...(eternalStudyProps || {})} />
                </React.Suspense>
              </div>
            )}

        {/* THIS COURSE'S LESSONS — DIRECTLY UNDER THE COURSE YOU JUST CHOSE.
            Darrell 2026-09-06, three screenshots of the live tab in a row: "Of
            course the lessons selection needs to be next to the course we just
            chose!?!!!", "After we choose the course we have a lot of what?!!!"
            (lessons), and "still can't pick a lesson nor see what this course
            offers... unless I already know the software... needs to be
            intuitive". What the screenshots showed: after picking Living
            Lessons, the very next list on screen was the finder's blank-state
            shelf — OTHER courses' lessons ("Learning A.I. the Way · 8", "The
            Broadcast · 9") — while the chosen course's own titles sat far below
            the title, Share, catalog line, resume, lessons bar, timeline and
            facilitator panel. Everything on the page was real; the order made
            the chosen course invisible.

            So the course's own title index lives HERE, in the wrapper, as the
            first thing after the picker. It is built from the live `active`
            schedule and opens a lesson through the same real path the finder,
            the shelf and Resume already drive (setResumeLessonId -> CourseView
            focuses it, saves the place, records the use). The copy that used to
            sit inside CourseView is removed so there is ONE list, not two.
            Held by learn-lesson-index-is-next.test.jsx, which asserts ORDER —
            picker, then this list, then search, then everything else. */}
        {courses.length > 1 && !lessonFocus && (active.schedule || []).length > 4 && (() => {
          const schedule = active.schedule;
          const U = unitLabels(active.meta);
          const recentIds = recentUsed(3).filter((id) => schedule.some((m) => m.id === id));
          const sections = wantsSections(schedule) ? sectionLessons(schedule) : null;
          const shelf = (sections && lessonShelfPick.courseKey === active.key && sections.some((x) => x.key === lessonShelfPick.shelf)) ? lessonShelfPick.shelf : 'all';
          const shown = shelf === 'all' ? schedule : sections.find((x) => x.key === shelf).lessons;
          // THE ORDER (DR-0626). A numbered course offers "By number, first to
          // last" (the default) and "Newest first"; a course shelved by the
          // Word's divisions adds that view. The row's number is the lesson's
          // own (its id), never its place in the list.
          const numbered = isNumberedCourse(schedule);
          const dated = schedule.some((m) => m.added);
          const orders = ordersFor({ numbered, hasSections: !!sections, dated });
          const pickedOrder = lessonOrderPick[active.key] || rememberedLessonOrder(active.key) || DEFAULT_LESSON_ORDER;
          const order = orders.some((o) => o.key === pickedOrder) ? pickedOrder : ((orders[0] && orders[0].key) || 'course');
          const inOrder = (list) => (numbered ? orderLessons(list, 'number') : list);
          const items = order === 'divisions'
            ? (shelf === 'all' ? sections.flatMap((sec) => [{ heading: sec }, ...inOrder(sec.lessons)]) : inOrder(shown))
            : (order === 'number' || order === 'newest')
              ? (dated ? withMonthHeadings(orderLessons(shown, order)) : orderLessons(shown, order))
              : shown;
          const showDivision = !!sections && order !== 'divisions' && shelf === 'all';
          const open = (id) => { setActiveKey(active.key); setResumeOpenGuide(false); setResumeLessonId(id); setResumeNonce((n) => n + 1); };
          return (
            <nav
              aria-label={`This course's ${U.noun}s by title`}
              data-testid="course-lessons-first"
              className="mb-4 border border-[#E8E4DC] bg-[#FAF8F4] p-3"
            >
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-2">
                {active.meta.title} · pick a {U.noun} by title · <span data-testid="course-lesson-count">{lessonCountLabel(schedule, U)}</span>
              </div>
              {recentIds.length > 0 && (
                <div className="mb-2 pb-2 border-b border-[#E8E4DC]">
                  <div className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold mb-1">Recently opened</div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentIds.map((id) => {
                      const m = schedule.find((x) => x.id === id);
                      const t = m.title.length > 34 ? `${m.title.slice(0, 32)}…` : m.title;
                      return (
                        <span key={id} className="inline-flex items-stretch">
                          {/* A LINK, LIKE THE ONES BELOW (Darrell 2026-09-13:
                              "Recently Opened should be links like the others so
                              users can click where they were"). It was a bordered
                              chip, which reads as a tag rather than a way back —
                              and a row whose whole purpose is "return to where
                              you were" has to LOOK like the thing you return
                              with. Same underline-on-hover, same 44px floor, same
                              serif as the schedule list. */}
                          <button
                            type="button"
                            onClick={() => open(id)}
                            title={m.title}
                            className="text-left text-sm px-1 py-2 min-h-[44px] text-[#1A1815] underline decoration-[#CFC9BD] underline-offset-4 hover:text-[#B85838] hover:decoration-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
                            style={{ fontFamily: '"Fraunces", serif' }}
                          >
                            {t}
                          </button>
                          <button
                            type="button"
                            onClick={() => playLesson(active.key, id)}
                            aria-label={`Start ${m.title}`}
                            title={`Start ${m.title} — it begins on this screen`}
                            className="ml-1 text-[0.625rem] uppercase tracking-wider px-2 py-2 min-h-[44px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                          >
                            ▶
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* THE LONG LIST STAYS; A LONG COURSE ADDS A SHELF SELECT (DR-0603).
                  DR-0596 folded a course of 30+ lessons into collapsed
                  <details> sections by the Word's divisions. Darrell, shown it
                  on Living Lessons the next day: "I would rather have the long
                  list than this! ... This is just totally different feel and
                  process!!!!!! Why?!!!!!!!!" So the list below is the SAME flat
                  list every course renders — the feel and the process do not
                  change with the course's length. The divisions are kept as a
                  LENS: a select above the list (only on a long course) whose
                  first option is the whole course and whose others are the
                  Word's eight divisions with their counts (lib/lesson-sections.js,
                  real data from each lesson's own anchor). Picking one narrows
                  the flat list to that shelf; the default is everything. */}
              {(sections || orders.length > 1) && (
                <div className={`mb-2 grid gap-2 grid-cols-1 ${sections && orders.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                  {sections && (
                    <div className="min-w-0">
                      <label htmlFor="learn-lesson-shelf" className="block text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">
                        Show
                      </label>
                      <select
                        id="learn-lesson-shelf"
                        data-testid="course-lesson-shelf"
                        data-shelf={shelf}
                        value={shelf}
                        onChange={(e) => setLessonShelfPick({ courseKey: active.key, shelf: e.target.value })}
                        className="w-full min-h-[44px] px-2 py-2 bg-white border border-[#E8E4DC] text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                        style={{ fontFamily: '"Fraunces", serif' }}
                      >
                        <option value="all">All {U.noun}s · {schedule.length}</option>
                        {sections.map((sec) => (
                          <option key={sec.key} value={sec.key}>{sec.label} · {sec.lessons.length}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {orders.length > 1 && (
                    <div className="min-w-0">
                      <label htmlFor="learn-lesson-order" className="block text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">
                        Order
                      </label>
                      <select
                        id="learn-lesson-order"
                        data-testid="course-lesson-order"
                        value={order}
                        onChange={(e) => pickLessonOrder(active.key, e.target.value)}
                        className="w-full min-h-[44px] px-2 py-2 bg-white border border-[#E8E4DC] text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                        style={{ fontFamily: '"Fraunces", serif' }}
                      >
                        {orders.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {/* THE DIVISION NAMES STAY IN THE LONG LIST (Darrell 2026-09-24,
                  after the unfold: "I do like the the lessons sections say what
                  they should be associated with... just felt locked out of the
                  flow"). So the whole course scrolls as ONE list, and where a
                  long course has divisions, each division's name stands as an
                  inline heading row above its lessons — a label, never a fold.
                  Every lesson still shows what it belongs with; nothing is
                  hidden behind a tap. A narrowed shelf needs no headings.
                  That is the "By the Word's divisions" order; in number order
                  the month each lesson was added heads its run instead (labels
                  too), and each row names its division in small type. */}
              <ol className="space-y-0.5 max-h-[45vh] overflow-y-auto pr-1" data-testid="course-lesson-list" data-shelf={shelf} data-order={order}>
                {items.map((m) => (m.heading ? (
                  <li
                    key={`heading-${m.heading.key}`}
                    {...(m.heading.lessons ? { 'data-shelf-heading': m.heading.key } : { 'data-month-heading': m.heading.key })}
                    className="pt-2 pb-1 text-[0.6875rem] uppercase tracking-wider text-[#5A6E3D] font-semibold border-t border-[#E8E4DC] flex items-center justify-between"
                  >
                    <span>{m.heading.label}</span>
                    <span className="text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{m.heading.lessons ? m.heading.lessons.length : m.heading.count}</span>
                  </li>
                ) : (
                  <li key={m.id} data-lesson-id={m.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => open(m.id)}
                      className="flex-1 min-w-0 text-left py-2 min-h-[44px] text-sm text-[#1A1815] hover:text-[#B85838] hover:underline focus:outline focus:outline-2 focus:outline-[#B85838]"
                      style={{ fontFamily: '"Fraunces", serif' }}
                    >
                      {/* THE LESSON'S OWN NUMBER, AND ITS DAY (Darrell 2026-09-24:
                          "They are numbered!!!!!!!" / "There are dates in the
                          lessons..."). The number is read from the lesson's id;
                          the day from living-lessons-dates.js; a lesson with no
                          recorded day shows its number alone. */}
                      <span className="block text-[#5A5751] text-[0.6875rem] leading-snug" style={{ fontFamily: '"JetBrains Mono", monospace' }} data-lesson-number={ownNumber(m, schedule)}>
                        <span className="whitespace-nowrap">{numberLabel(m, numbered, U.cap)}</span>
                        {formatAdded(m.added) ? <>{' · '}<span className="whitespace-nowrap">{formatAdded(m.added)}</span></> : null}
                        {showDivision ? <>{' · '}<span className="whitespace-nowrap">{divisionOf(m).label}</span></> : null}
                      </span>
                      <span className="block">{m.title}</span>
                    </button>
                    {/* The lesson's own state, on its own row (DR-0631):
                        Continue on a lesson begun, Finished on one done. */}
                    <RowContinue
                      place={activePlaces[m.id] && (activePlaces[m.id].done || placeInProgress(activePlaces[m.id])) ? activePlaces[m.id] : null}
                      title={m.title}
                      onContinue={resumeNow}
                    />
                    {/* The SAME action the card list's ▶ Play performs — the big
                        full-screen reader on this one, read yourself or read to
                        you. The title still opens the lesson's space; this opens
                        it to be READ. Two doors, because they are two intents. */}
                    <button
                      type="button"
                      onClick={() => playLesson(active.key, m.id)}
                      aria-label={`Play ${m.title} in the big full-screen view`}
                      title={`Open ${m.title} in the big full-screen view — read it yourself or have it read aloud`}
                      className="shrink-0 text-[0.625rem] uppercase tracking-wider px-2 py-2 min-h-[44px] border-2 border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                    >
                      ▶ Play
                    </button>
                  </li>
                )))}
              </ol>
            </nav>
          );
        })()}

        {/* THE COURSE'S OWN LESSONS COME FIRST; THE GATHERED ONES FOLLOW (Darrell
            2026-09-24, with a screenshot of History where the "also taught
            across the curriculum" rows sat ABOVE the course's pick-a-lesson
            list: "This should be at the top!"). This block used to render
            inside the picker's row, so on any department that gathers lessons
            it landed between the dropdown and the course's own lessons. It now
            renders here, after the by-title index, and the order is pinned in
            learn-crosslisted-in-the-picker.test.jsx (DR-0598). */}
        {courses.length > 1 && !lessonFocus && (
          <>
        {dept && gathered.length > 0 && (
          <div className="mt-3 mb-2 border border-[#E8E4DC] bg-white p-3" data-testid="learn-crosslisted">
            <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">
              Also taught across the curriculum · {gathered.length}
            </p>
            <p className="text-[0.625rem] text-[#5A5751] leading-snug mb-2">
              These lessons live in their own courses and are taught there. Open one here and it
              opens where it lives — so it counts once, whichever shelf you found it on.
            </p>
            <ul className="space-y-2">
              {gathered.map((r) => (
                <li key={`${r.courseKey}-${r.lessonId}`}>
                  <button
                    type="button"
                    className="text-left w-full focus:outline focus:outline-2 focus:outline-[#B85838]"
                    onClick={() => {
                      setDeptId('all');
                      setActiveKey(r.courseKey);
                      setResumeOpenGuide(false);
                      setResumeLessonId(r.lessonId);
                    }}
                  >
                    <span className="block text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{r.title}</span>
                    <span className="block text-[0.625rem] text-[#5A5751]">
                      {r.courseTitle} · {r.unitLabel}{r.ref ? ` · ${r.ref}` : ''}
                    </span>
                    <span className="block text-[0.625rem] text-[#5A5751]">{r.why}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
          </>
        )}

        {/* LESSON FINDER (Darrell 2026-08-18: "We need a better way to look up
            and review the available lessons... not obvious how to find a lesson
            unless you already know the course it is in") — one search box over
            every course's live schedule: title words, topic words, or a verse
            reference all find their lesson, and one tap opens it through the
            same real path Resume drives. Index derives from the mounted
            catalog (lib/learn-organize.js, DR-0121). */}
        {courses.length > 1 && !lessonFocus && (() => {
          const hits = lessonQuery.trim() ? searchLessons(buildLessonIndex(visibleCourses), lessonQuery) : [];
          return (
            <div className="mb-4">
              <label htmlFor="learn-lesson-find" className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Or search by name — any course, by title, topic, or verse</label>
              <input
                id="learn-lesson-find"
                type="search"
                value={lessonQuery}
                onChange={(e) => setLessonQuery(e.target.value)}
                placeholder='Try "hardening heart", "tongues", or "2 Corinthians 7"'
                autoComplete="off"
                className="w-full min-h-[44px] px-3 py-2 bg-white border border-[#1A1815] text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                style={{ fontFamily: '"Fraunces", serif' }}
              />
              {lessonQuery.trim() ? (
                hits.length ? (
                  <ul className="mt-2 border border-[#E8E4DC] divide-y divide-[#E8E4DC]" aria-label="Matching lessons">
                    {hits.map((h) => (
                      <li key={`${h.courseKey}:${h.lessonId}`} className="flex items-center gap-2 bg-white">
                        <button
                          type="button"
                          onClick={() => { setActiveKey(h.courseKey); setResumeOpenGuide(false); setResumeLessonId(h.lessonId); setLessonQuery(''); }}
                          className="flex-1 text-left px-3 py-2 min-h-[44px] bg-white hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                        >
                          {/* COURSE BEFORE THE LESSON (Darrell 2026-09-05). A hit
                              used to lead with the lesson and bury its course on the
                              line below — the opposite order from the resume card
                              and from the browse shelf, where the course heads the
                              group. The course now leads here too. */}
                          <span className="block text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">{h.courseTitle}</span>
                          <span className="block text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{h.title}</span>
                          <span className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                            {h.unitLabel}{h.ref ? ` · ${h.ref}` : ''}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { playLesson(h.courseKey, h.lessonId); setLessonQuery(''); }}
                          aria-label={`Play ${h.title} in the big full-screen view`}
                          title={`Open ${h.title} in the big full-screen view`}
                          className="shrink-0 mr-2 text-[0.625rem] uppercase tracking-wider px-2 py-2 min-h-[44px] border-2 border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                        >
                          ▶ Play
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-[#5A5751]">No lesson matches “{lessonQuery.trim()}” yet — try fewer words, or a verse reference like “Romans 8”.</p>
                )
              ) : (
                /* THE BLANK STATE IS THE SHELF, NOT A WALL.
                   Christina could not reach the other 393 lessons because an
                   empty box showed nothing and the only other door was a
                   22-option course dropdown — both of which ask you to already
                   know a word or a course. Every lesson in the app now sits
                   here, under its course, before anyone types; typing NARROWS
                   this list rather than summoning it. Bounded height so the
                   shelf never buries the course below it, and the whole thing
                   derives from the mounted catalog (DR-0121). */
                (() => {
                  const groups = browseLessons(buildLessonIndex(visibleCourses));
                  const total = browseCount(groups);
                  if (!total) return null;
                  return (
                    <div className="mt-2 border border-[#E8E4DC]" data-testid="lesson-browse-all">
                      <p className="px-3 py-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751] bg-[#FAF8F4] border-b border-[#E8E4DC]">
                        Or just browse — all {total} lessons, every course
                      </p>
                      <div className="max-h-[55vh] overflow-y-auto">
                        {groups.map((g) => (
                          <section key={g.courseKey} aria-label={g.courseTitle}>
                            <h4 className="sticky top-0 px-3 py-1.5 text-[0.625rem] uppercase tracking-wider text-[#1A1815] bg-[#FAF8F4] border-b border-[#E8E4DC] font-semibold">
                              {g.courseTitle} · {g.lessons.length}
                            </h4>
                            <ul className="divide-y divide-[#E8E4DC]">
                              {g.lessons.map((h) => (
                                <li key={`${h.courseKey}:${h.lessonId}`}>
                                  <button
                                    type="button"
                                    onClick={() => { setActiveKey(h.courseKey); setResumeOpenGuide(false); setResumeLessonId(h.lessonId); }}
                                    className="w-full text-left px-3 py-2 min-h-[44px] bg-white hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                                  >
                                    <span className="block text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{h.title}</span>
                                    <span className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                                      {h.unitLabel}{h.ref ? ` · ${h.ref}` : ''}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </section>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          );
        })()}

        <h2 id="learn-h" className="text-2xl sm:text-3xl mt-1 mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
          {active.meta.title}
        </h2>
        {/* The catalog line a school prints under a course title: its code,
            its department, and its level where the course declares one
            (meta.programLevel) — never invented for a course that did not. */}
        {!lessonFocus && (() => {
          const coded = departments.flatMap((d) => d.courses).find((c) => c.key === active.key);
          if (!coded) return null;
          return (
            <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-3" data-testid="course-catalog-line">
              {coded.code} · {coded.department}{active.meta.programLevel ? ` · ${active.meta.programLevel}` : ''} · {courseLessonCount(active)} lessons
            </p>
          );
        })()}

        {/* THE PLAIN WORDS, under the title the title keeps (DR-0519). Darrell
            2026-09-19: "I like the current titles they pull me in" AND "we are
            just thinking about broad connections made by simple word choices"
            — so the everyday word sits BESIDE the house term rather than
            replacing it. "Kingdom Economics: Stewardship, Ownership & the
            Body's Economic Witness" is a title that pulls him in and contains
            no word a child would go looking for; this line carries money, debt,
            giving, saving. It is the same declaration that makes those words
            find this course in search (learn-organize.js buildLessonIndex), so
            the line a reader sees and the words that reach them are one thing,
            never two that drift. */}
        {!lessonFocus && plainWordsFor(active.key).length > 0 && (
          <p className="text-[0.75rem] text-[#5A6E3D] mb-3" data-testid="course-plain-words">
            <span className="uppercase tracking-wider text-[0.625rem] text-[#5A5751] mr-1.5">In plain words</span>
            {plainWordLine(active.key)}
          </p>
        )}

        {/* SHARE THE WHOLE COURSE (Darrell 2026-08-10: "I want to also share the
            whole course"). Per-lesson Share hands someone one sitting; this
            hands them the series and lets them begin where they like. It sits
            here, above the Governor-only toolbar, deliberately: the course-level
            control belongs to whoever is READING the course, and burying it
            behind isGovernor is the exact mistake the time control made. The
            lesson count is counted from the live schedule, never typed. */}
        {!lessonFocus && (
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <ShareButton
              label="Share this course"
              title="Share the whole course using your usual apps"
              payload={() => courseSharePayload(active.meta, {
                url: lessonUrl({ courseKey: active.key }),
                lessonCount: (active.schedule && active.schedule.length) || 0,
                unitPlural: `${unitLabels(active.meta).noun}s`,
              })}
            />
          </div>
        )}


        {/* Derived catalog line — counted LIVE from the mounted courses (never a
            hand-typed number, DR-0121). The >= 40-lesson floor is machine-held
            by learn-catalog-render.test.jsx. */}
        {courses.length > 1 && !lessonFocus && (
          <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-2">
            {courses.length} courses · {courses.reduce((t, c) => t + ((c.schedule && c.schedule.length) || 0), 0)} lessons — every finished lesson in the PoeTech App, in one place
          </p>
        )}



      </div>

      {/* ONE PLACE TO LOOK — THE LESSONS BAR.
          ==================================================================
          Christina, 2026-08-31, on the live Learn tab: "How do I get to the
          rest of the lessons?" Darrell, agreeing: "the locations for everything
          are not obvious... make them obvious or even a location on the screen
          that is THE place to look... we have that but the user needs to pay
          close attention to the words... we need the subconscious to also think
          it's easy."

          The affordances already existed — a lesson finder over every course
          and a grouped course picker. Both sit ABOVE the schedule and SCROLL
          AWAY. Christina was looking at eight weeks of one course with 112
          lessons mounted and nothing on screen saying either of those things
          was true. Reading her screenshot: the picker was perhaps a
          finger-flick above the fold, and therefore gone.

          So this is not a new control. It is the SAME two controls, made
          permanent and given a fixed address, and it deliberately reuses the
          shape, border, position and z-index of the in-lesson bar below
          (data-testid="lesson-space-bar"): the app teaches ONE landmark, in one
          place, and a reader who learns it once inside a lesson already knows
          it in the catalog. That is the subconscious half of the ask — the
          answer is where it always is, so nobody has to read carefully to find
          it.

          The count is the other half. Seeing "112 lessons · 19 courses" while
          eight weeks are on screen is what makes the question answer itself: it
          says plainly there is more, and the button beside it says where. Both
          numbers derive from the mounted catalog, never typed (DR-0121). */}
      {courses.length > 1 && !lessonFocus && (
        <div
          className="ts-chrome-region sticky top-0 z-30 mb-3 bg-[#FAF8F4] border border-[#1A1815] px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 flex-wrap"
          data-testid="lessons-bar"
        >
          <button
            type="button"
            onClick={() => {
              if (typeof document === 'undefined') return;
              const box = document.getElementById('learn-lesson-find');
              if (!box) return;
              try { box.scrollIntoView({ block: 'center', behavior: motionBehavior() }); } catch (_) { /* older engines */ }
              try { box.focus({ preventScroll: true }); } catch (_) { box.focus(); }
            }}
            className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            <UiIcon name="bookOpen" /> All<span className="hidden sm:inline"> {unitLabels(active.meta).noun}s</span>
          </button>
          <span className="text-[0.6875rem] text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
            {active.meta.title}
          </span>
          {/* THIS COURSE'S CONTINUE, WHERE IT NEVER SCROLLS AWAY (DR-0631).
              The bar is sticky, so a reader anywhere in the course's lesson
              list is one tap from the lesson they have in progress here. */}
          <ContinueChip item={activeContinue} onContinue={resumeNow} />
          <span className="text-[0.6875rem] text-[#5A5751] ml-auto" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {courses.reduce((t, c) => t + ((c.schedule && c.schedule.length) || 0), 0)} lessons<span className="hidden sm:inline"> · {courses.length} courses</span>
          </span>
        </div>
      )}

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
        resumeNonce={resumeNonce}
        resumeOpenGuide={resumeOpenGuide}
        presentRequest={presentRequest}
        onFocusChange={setLessonFocus}
        onAllCourses={() => { setResumeLessonId(null); setResumeOpenGuide(false); setDeptId('all'); }}
        lessonOrder={lessonOrderPick[active.key] || null}
      />
    </section>
  );
}
