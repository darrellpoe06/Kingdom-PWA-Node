// =============================================================================
// ChurchVideoWall — the Sanctuary LED Video Wall as a real CAPITAL PROJECT
// =============================================================================
// First tracked facilities/CapEx project for The Church of the Living God — The
// Love Corner. The wall: LED Nation USA, Mirackle P1.99mm fine-pitch panels,
// 8 wide x 6 high = 48 cabinets (640x480 mm each), ~16.8 ft W x 9.45 ft H (16:9),
// NovaStar VX1000 processor, dual RTX 4070 sources — being stacked + wired on
// site 2026-06-29. (Earlier copy listed P2.97mm from a superseded estimate; the
// real product is P1.99 — confirmed on site + the matching 640x480 datasheet.)
// The engineering facts come from vendor datasheets (cited in video-wall-spec.js).
//
// PRIVACY (binding, and the repo is PUBLIC): NO dollar figures, invoice numbers,
// or donation amounts appear in this file or the bundle. The money is fetched
// from the gated tables (0027) for owner/admin ONLY (video-wall-sync), and the
// monolith renders this page to church STAFF only. The spec / pixel-math /
// opportunities / constraints below are NON-financial engineering content
// (public-safe), so they live in code; every figure lives only server-side.
//
// Self-contained like <Choir /> / <EventCenterModule />: owns its own
// video-wall-sync subscriptions, no parent props. Reuses the AA-compliant visual
// tokens (already passing contrast-guard).
// =============================================================================
import React, { useState, useEffect, useMemo } from 'react';
import { KpiDot } from './KpiDot.jsx';
import {
  getVideoWallAccess, subscribeProjects, subscribeBudgetLines,
  budgetTotals, donationProgress,
} from '../lib/video-wall-sync.js';
import {
  CABINET, VX1000_LOAD,
  cabinetGrid, nativeResolution, powerPlan, dataMap,
  INSTALL_SEQUENCE, SAFETY,
} from '../lib/video-wall-spec.js';
import {
  ATEM, SIGNAL_CHAIN, AV_DEVICES, SOURCE_BRIDGES,
  CABLING_PLANES, WALL_PLACEMENT, WALL_FEED_ARCHITECTURE,
} from '../lib/church-av-devices.js';
import {
  VIDEO_IN, CONTROL, LED_DATA, POWER, MAP,
  ledLineMath, TEACHING_CARD, FINISH_CHECKLIST, CHAIN_DIAGRAM,
  FIRST_LIGHT, VENDOR_MESSAGE, VX1000_SOFTWARE,
  TOOL_CACHE, CONTROL_FROM_ANYWHERE,
} from '../lib/led-wall-signal-chain.js';
import {
  SESSION_GOAL, PHASES, LANES, isPriority, sessionProgress,
} from '../lib/onsite-session.js';
import {
  MEDIA_BASE_KEY, mediaUrl,
  NOVALCT_SETUP_STEPS, PANEL_SPEC, SCREEN_CONNECTION_MAP, FINAL_CONFIG,
  TOMORROW_ACTIVATION, INSTALL_GALLERY,
} from '../lib/led-wall-training.js';

// Shared visual tokens — identical to the conference/event-center surfaces.
const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const serif = { fontFamily: '"Fraunces", serif' };

// --- Public-safe spec (NON-financial; verified from the email thread) ---------
const SPEC = {
  vendor: 'LED Nation USA',
  vendorUrl: 'https://lednationusa.com',
  pitchMm: 1.99,
  panelSpec: 'Mirackle P1.99mm fine-pitch indoor LED',
  heightFt: 9.45,
  widthFtMin: 16.8,
  widthFtMax: 16.8,
};

// Status timeline — dates/labels are non-financial narrative (public-safe).
// Milestones only — invoice numbers and amounts stay in the gated budget (below),
// never in this public file. The dates/labels here are non-financial narrative.
const TIMELINE = [
  { when: '2024', title: 'First estimate', body: 'A smaller 9.8 x 6.6 ft / 24-panel build was quoted. Later superseded by the current purchase.', tone: 'idle' },
  { when: 'Jun 2026', title: 'Purchased', body: 'The wall ordered from LED Nation USA (final panels measured P1.99mm on-site); invoice forwarded 2026-06-08. Figures in the gated budget below.', tone: 'good' },
  { when: 'Jun 2026', title: 'Delivered + staged', body: 'Hardware delivered and staged BEHIND THE STAGE CURTAIN.', tone: 'good' },
  { when: 'Jun 22, 2026', title: 'Installation started', body: 'On-site assembly began: ground-support / box-truss towers erected to mount and stack the wall; modular LED cabinet panels laid out for assembly; crew on site sizing the stage. In progress.', tone: 'good' },
  { when: 'Jun 29, 2026', title: 'Stacking + wiring', body: 'Confirmed-spec install + power + data runbook produced on site: 8 x 6 = 48 cabinets (P1.99mm, 640x480mm), 4,800 W peak across 6 power chains, 6 of 10 VX1000 data ports planned. Cabinets stacking; data + power daisy-chains being dressed.', tone: 'good' },
  { when: 'Jul 3, 2026', title: 'FIRST LIGHT — commissioned', body: 'The wall runs as one 2560x1440 screen: cabinet pixel map measured (320x240 via NovaLCT), as-built data map confirmed (8 ports, one per column, top-entry chained down), screen saved to receiving cards, Preset 1 = service state, and live sermon video played full-wall the same night. Lesson recorded: every symptom was the input/layer side — the map and cables were right all along.', tone: 'good' },
  { when: 'Punch list', title: 'Warranty + niceties', body: 'A few dark LED modules (vendor warranty swap, positions photographed); input EDID set to native 2560x1440 for 1:1 pixels; identify the Tactical RMM agent found on the control-room tower.', tone: 'attention' },
];

// On-site install record (NON-financial physical facts) — the install-milestone
// EVENT, observed on site 2026-06-22 from Darrell's photos as assembly began.
// Public-safe like SPEC/TIMELINE/CONSTRAINTS: it carries no money. This is the
// physical front end of the sovereign media / broadcast buildout; every line is
// what was actually on the floor, not invented (Reality-Trace + Verification).
const INSTALL = {
  observedOn: 'June 22, 2026',
  source: 'On-site observation + photos — Darrell, 2026-06-22',
  components: [
    'Modular LED video-wall cabinet panels — laid out on the floor, staged for assembly.',
    'Black ground-support / box-truss towers — being erected to mount and stack the wall.',
    'Install crew of ~3 on site; stage sized with a tape measure.',
    'Road cases — panels and rigging transported and staged for the build.',
  ],
  environment: [
    'FOH production desk — digital mixing console, multiple monitors, and a laptop.',
    'Dual projector screens flanking the stage — the projection this fine-pitch wall augments and will replace.',
    'Stage lighting on truss; acoustic wall-treatment panels.',
    'Full band setup — drums, keys, percussion.',
  ],
};

const OPPORTUNITIES = [
  'Full-brightness Scripture, lyrics, and sermon points in a lit room — projection can’t match fine-pitch LED for the congregation in the back rows.',
  'Live program output for the media-team broadcast course: the same wall feeds the in-room view and the stream graphics, so trainees learn on the real signal chain.',
  'Will carry The Word — Migdal: once the OBS/NDI bridge is commissioned, BG’s study notes, the passage, and the message title present from the app to the wall during service.',
  'A sovereign in-house display the church owns outright — no recurring projector lamps, no rental, content stays on church-controlled machines.',
  'Reusable for the Conference / Event Center: breakout rooms and main-service sessions can mirror to the wall when the sanctuary hosts the assembly.',
];

const CONSTRAINTS = [
  { h: 'Power & heat', b: 'A fine-pitch wall this size draws real current and sheds heat. Confirm a dedicated circuit (and headroom) plus airflow behind the curtain before continuous service use.' },
  { h: 'Rigging & structure', b: 'Wall ~9 ft H x 11-12 ft W: the mounting structure must carry the cabinet load safely with proper attachment to the building. Needs a rigging/structural check, not a guess.' },
  { h: 'Signal chain', b: 'Source machines (dual RTX 4070 builds) -> processor/scaler -> sending card -> receiving cards per cabinet, over Cat6 runs. Local content reads off NVMe for sustained bandwidth. Each link is a single point of failure to plan for.' },
  { h: 'Operational load', b: 'Someone runs it every service. The media-team course is how that role is trained; until then, keep the operating procedure simple and documented.' },
  { h: 'Spares & redundancy', b: 'Fine-pitch panels take physical knocks (front rows, kids). Hold spare cabinets/modules and a spare receiving card so a dead tile is a swap, not a dark service.' },
  { h: 'Sightlines & brightness', b: 'Confirm every seat sees it without glare, and set brightness/color so it reads on camera for the stream without blinding the room.' },
  { h: 'Sovereign sources', b: 'Keep content + playback on church-owned machines (no cloud-locked player), so the wall keeps working if the internet doesn’t and no vendor can hold the display hostage.' },
];

function StatusBadge({ status }) {
  const map = {
    planning: ['Planning', 'idle'], purchased: ['Purchased', 'good'], delivered: ['Delivered', 'good'],
    staged: ['Staged — awaiting install', 'attention'], installing: ['Installing', 'attention'],
    live: ['Live', 'good'], operational: ['Operational — commissioned 2026-07-03', 'good'],
    'on-hold': ['On hold', 'problem'],
  };
  const [label, tone] = map[status] || [status, 'idle'];
  return <span className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider"><KpiDot status={tone} /> {label}</span>;
}

const money = (n) => n == null ? null : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// A budget figure with its source. The number LINKS to its source when a URL
// exists; otherwise the source is shown as a labeled citation (email/invoice in
// the paperwork has no web URL — we cite it, we don't fabricate a link).
function BudgetLine({ line }) {
  const struck = line.kind === 'superseded';
  return (
    <div className="py-2.5 border-b border-[#E8E4DC] last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-[#1A1815]" style={serif}>{line.label}</span>
        <span className={`text-sm tabular-nums whitespace-nowrap ${struck ? 'line-through text-[#5A5751]' : 'text-[#1A1815] font-semibold'}`}>
          {line.amount != null ? money(line.amount) : 'Not yet quoted'}
        </span>
      </div>
      {line.sourceLabel && (
        <div className="mt-1 text-[0.6875rem] text-[#5A5751]">
          Source:{' '}
          {line.sourceUrl
            ? <a href={line.sourceUrl} target="_blank" rel="noreferrer" className="text-[#B85838] underline hover:text-[#1A1815]">{line.sourceLabel}</a>
            : <span>{line.sourceLabel}</span>}
        </div>
      )}
      {line.note && <div className="mt-0.5 text-[0.6875rem] text-[#5A5751] italic">{line.note}</div>}
    </div>
  );
}

// Renders the real photo IF a NAS media base is configured, else a labeled slot
// (the authorized fallback while image serving is pending — the guide stays
// complete and lights up with the real photo the moment the base is set).
function MediaSlot({ base, photo, label }) {
  const url = mediaUrl(photo, base);
  if (url) return <img src={url} alt={label} loading="lazy" className="mt-2 w-full max-h-72 object-contain border border-[#E8E4DC]" />;
  return (
    <div className="mt-2 border border-dashed border-[#C9C2B6] bg-[#FAF8F4] px-3 py-2">
      <span className="text-[0.6875rem] text-[#5A5751]">{label} &mdash; <span className="italic">attach on-site image</span></span>
    </div>
  );
}

const CHECKLIST_KEY = 'colg-led-wall-finish-checklist-v1';
const ONSITE_KEY = 'colg-onsite-session-v1';

export default function ChurchVideoWall() {
  const [access, setAccess] = useState({ signedIn: false, canSee: false, canEdit: false });
  const [projects, setProjects] = useState(null);   // null = loading
  const [lines, setLines] = useState(null);
  // NAS media base for on-site photos/screenshots — empty until serving is wired,
  // so the illustrated guide renders labeled slots today, real photos later.
  const [mediaBase] = useState(() => {
    try { return (localStorage.getItem(MEDIA_BASE_KEY) || '').trim(); } catch { return ''; }
  });
  // Finish-checklist progress — local to this device (a personal work aid, not a
  // shared system-state claim). Persisted to localStorage so it survives reloads.
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CHECKLIST_KEY)) || {}; } catch { return {}; }
  });
  const toggleCheck = (id) => setChecked((prev) => {
    const next = { ...prev, [id]: !prev[id] };
    try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next)); } catch { /* private mode */ }
    return next;
  });
  // On-site turnkey session — step-by-step done-map, same per-device persistence.
  const [onsiteChecked, setOnsiteChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ONSITE_KEY)) || {}; } catch { return {}; }
  });
  const toggleOnsite = (id) => setOnsiteChecked((prev) => {
    const next = { ...prev, [id]: !prev[id] };
    try { localStorage.setItem(ONSITE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
    return next;
  });

  useEffect(() => {
    let alive = true;
    getVideoWallAccess().then((a) => { if (alive) setAccess(a); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!access.canSee) return undefined;
    const unsubP = subscribeProjects((rows) => setProjects(rows));
    const unsubL = subscribeBudgetLines((rows) => setLines(rows));
    return () => { unsubP(); unsubL(); };
  }, [access.canSee]);

  const project = useMemo(
    () => (projects || []).find((p) => p.slug === 'sanctuary-video-wall') || (projects || [])[0] || null,
    [projects],
  );
  const projectLines = useMemo(
    () => project ? (lines || []).filter((l) => l.projectId === project.id) : [],
    [lines, project],
  );

  const grid = useMemo(() => cabinetGrid(), []);
  const native = useMemo(() => nativeResolution(CABINET, grid), [grid]);
  const power = useMemo(() => powerPlan(CABINET, grid), [grid]);
  const data = useMemo(() => dataMap(CABINET, grid), [grid]);
  const ledMath = useMemo(() => ledLineMath(), []);
  const onsiteProgress = useMemo(() => sessionProgress(onsiteChecked), [onsiteChecked]);
  const checklistGroups = useMemo(() => {
    const order = [];
    const byGroup = {};
    for (const item of FINISH_CHECKLIST) {
      if (!byGroup[item.group]) { byGroup[item.group] = []; order.push(item.group); }
      byGroup[item.group].push(item);
    }
    return order.map((g) => ({ group: g, items: byGroup[g] }));
  }, []);
  const doneCount = FINISH_CHECKLIST.filter((c) => checked[c.id]).length;
  const totals = useMemo(() => budgetTotals(projectLines), [projectLines]);
  const donation = useMemo(() => donationProgress(project || {}), [project]);

  // Commissioned 2026-07-03 (first light, live sermon video full-wall). The
  // default reflects reality; a live project row can still override it.
  const status = project?.status || 'operational';

  return (
    <div className="space-y-4">
      {/* HEADER — church name pair (legal + community nickname, side by side) */}
      <div className={card}>
        <div className={labelCls}>Capital Project · Facilities / CapEx</div>
        <h2 className="mt-1 text-xl sm:text-2xl text-[#1A1815]" style={serif}>Sanctuary LED Video Wall</h2>
        <div className="mt-1 text-sm text-[#1A1815]" style={serif}>
          The Church of the Living God <span className="text-[#B85838]">&mdash; The Love Corner</span>
        </div>
        <p className="mt-0.5 text-[0.6875rem] text-[#5A5751] italic">
          The legal name and the community&rsquo;s name, side by side &mdash; the biblical name-pair pattern (Abram &rarr; Abraham, Simon &rarr; Peter, Saul &rarr; Paul).
        </p>
        <div className="mt-3"><StatusBadge status={status} /></div>
        <p className="mt-3 text-sm text-[#5A5751]">
          {project?.summary || 'Fine-pitch indoor LED video wall for the main sanctuary — replaces projection so the congregation reads Scripture, lyrics, and the broadcast feed at full brightness in a lit room.'}
        </p>
        <p className="mt-2 text-[0.75rem] text-[#1A1815]">
          {project?.installNote || 'Commissioned 2026-07-03: one 2560x1440 screen across 48 cabinets, config saved to the receiving cards, Preset 1 = the Sunday service state, first sermon video played full-wall the same night. Remaining: warranty module swaps + EDID nicety (punch list).'}
        </p>
      </div>

      {/* ===== ON-SITE SESSION — turnkey, sequenced, execute-not-figure-out ===== */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <div className={labelCls}>On-site session &middot; turnkey sequence</div>
          <div className="text-[0.75rem] font-semibold text-[#1A1815]">{onsiteProgress.done} / {onsiteProgress.total}</div>
        </div>
        <p className="mt-1 text-[0.8125rem] text-[#1A1815]">{SESSION_GOAL}</p>
        {/* Priority path: get-it-working-first (wall lit + tower on network as build node) */}
        <div className="mt-2 border-l-2 border-[#B85838] pl-2.5">
          <div className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Priority path (if time is short): wall lit + tower on the network as build node</div>
          <div className="mt-1 h-1.5 bg-[#E8E4DC]" role="progressbar" aria-valuenow={onsiteProgress.priorityDone} aria-valuemin={0} aria-valuemax={onsiteProgress.priorityTotal} aria-label="Priority path progress">
            <div className="h-1.5 bg-[#B85838]" style={{ width: `${Math.round((onsiteProgress.priorityDone / onsiteProgress.priorityTotal) * 100)}%` }} />
          </div>
          <div className="mt-0.5 text-[0.6875rem] text-[#5A5751]">{onsiteProgress.priorityDone} / {onsiteProgress.priorityTotal} priority steps</div>
        </div>

        <div className="mt-3 space-y-3">
          {PHASES.map((phase) => (
            <div key={phase.id}>
              <div className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">{phase.title}</div>
              <ul className="mt-1 space-y-1.5">
                {phase.steps.map((s) => (
                  <li key={s.id}>
                    <label className="flex gap-2.5 cursor-pointer items-start">
                      <input
                        type="checkbox"
                        checked={!!onsiteChecked[s.id]}
                        onChange={() => toggleOnsite(s.id)}
                        className="mt-0.5 shrink-0 accent-[#B85838]"
                        aria-label={s.action}
                      />
                      <span>
                        <span className={`text-[0.8125rem] ${onsiteChecked[s.id] ? 'text-[#5A5751] line-through' : 'text-[#1A1815]'}`} style={serif}>
                          {isPriority(s.id) && <span className="text-[#B85838] font-semibold">[priority] </span>}{s.action}
                        </span>
                        <span className="block text-[0.6875rem] text-[#5A5751]"><b>Proof:</b> {s.proof}</span>
                        {s.sme && <span className="block text-[0.6875rem] text-[#B85838] italic">SME-pending: {s.sme}</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-3 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">One technique — coordinated lanes</div>
        <ul className="mt-1 space-y-1">
          {LANES.map((l) => (
            <li key={l.lane} className="text-[0.6875rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">&middot;</span><span><b>{l.role}</b> ({l.lane}) &mdash; after: {l.dependsOn}. Adds: {l.adds}</span></li>
          ))}
        </ul>
        <p className="mt-2 text-[0.6875rem] text-[#5A5751] italic">Progress saved on this device. Full runbook: docs/99-session-notes/2026-07-01-colg-onsite-session-turnkey-runbook.md</p>
      </div>

      {/* STAGE-VISUAL IMAGE SLOT — filled from the church YouTube once Darrell
          confirms the video link. Left as an explicit placeholder, not faked. */}
      <div className={card}>
        <div className={labelCls}>Stage view</div>
        {project?.heroImageUrl ? (
          <img src={project.heroImageUrl} alt="Sanctuary stage / video wall" className="mt-2 w-full max-h-72 object-cover border border-[#E8E4DC]" />
        ) : (
          <div className="mt-2 flex items-center justify-center h-40 sm:h-56 border border-dashed border-[#C9C2B6] bg-[#FAF8F4] text-center px-4">
            <span className="text-[0.75rem] text-[#5A5751]">Stage visuals from the church YouTube will be added here once the video link is confirmed.</span>
          </div>
        )}
      </div>

      {/* SPEC — public-safe engineering content (vendor-confirmed) */}
      <div className={card}>
        <div className={labelCls}>Specification</div>
        <dl className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div><dt className="text-[0.6875rem] text-[#5A5751]">Panels</dt><dd className="text-[#1A1815]" style={serif}>{SPEC.panelSpec}</dd></div>
          <div><dt className="text-[0.6875rem] text-[#5A5751]">Pixel pitch</dt><dd className="text-[#1A1815]" style={serif}>P{SPEC.pitchMm}mm (fine-pitch)</dd></div>
          <div><dt className="text-[0.6875rem] text-[#5A5751]">Wall size</dt><dd className="text-[#1A1815]" style={serif}>{grid.actualWidthFt} ft W &times; {grid.actualHeightFt} ft H ({grid.aspectLabel})</dd></div>
          <div><dt className="text-[0.6875rem] text-[#5A5751]">Cabinets</dt><dd className="text-[#1A1815]" style={serif}>{grid.wide} &times; {grid.high} = {grid.total} ({CABINET.widthMm}&times;{CABINET.heightMm}mm)</dd></div>
          <div><dt className="text-[0.6875rem] text-[#5A5751]">Processor</dt><dd className="text-[#1A1815]" style={serif}>{VX1000_LOAD.model}</dd></div>
          <div>
            <dt className="text-[0.6875rem] text-[#5A5751]">Vendor</dt>
            <dd><a href={SPEC.vendorUrl} target="_blank" rel="noreferrer" className="text-[#B85838] underline hover:text-[#1A1815]" style={serif}>{SPEC.vendor}</a></dd>
          </div>
        </dl>
        <p className="mt-3 text-[0.6875rem] text-[#5A5751] italic">
          Pitch corrected to P{SPEC.pitchMm}mm (an earlier estimate listed P2.97mm). Confirm against the cabinet label + the LED Nation invoice line item.
        </p>
      </div>

      {/* NATIVE RESOLUTION — derived from the cabinet grid, never claimed exact */}
      <div className={card}>
        <div className={labelCls}>Native resolution (derived)</div>
        <div className="mt-2 text-sm text-[#1A1815]" style={serif}>
          ~{native.widthPx.toLocaleString()} &times; {native.heightPx.toLocaleString()} px ({native.aspectLabel})
          <span className="text-[#5A5751]"> &nbsp;(≈ {native.megapixels} MP)</span>
        </div>
        <div className="mt-1 text-[0.75rem] text-[#5A5751]">
          Within the {VX1000_LOAD.model}&rsquo;s {VX1000_LOAD.maxLoadMegapixels} MP load. A single 4K output covers it — the dual-4070 machines give headroom + redundancy, not a resolution requirement.
        </div>
        <ul className="mt-2 space-y-1">
          {native.assumptions.map((a, i) => (
            <li key={i} className="text-[0.6875rem] text-[#5A5751] flex gap-1.5"><span className="text-[#B85838]">&middot;</span><span>{a}</span></li>
          ))}
        </ul>
      </div>

      {/* POWER PLAN — sized to PEAK, the 80% rule applied */}
      <div className={card}>
        <div className={labelCls}>Power plan (sized to peak)</div>
        <div className="mt-2 text-sm text-[#1A1815]" style={serif}>
          {power.totalPeakW.toLocaleString()} W peak total <span className="text-[#5A5751]">({power.totalPeakAmps120} A @ 120 V)</span> &middot; {power.totalAvgW.toLocaleString()} W average
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-[0.75rem]">
          <div className="border border-[#E8E4DC] p-2">
            <div className="text-[0.6875rem] text-[#5A5751]">120 V / 15 A circuit</div>
            <div className="text-[#1A1815]" style={serif}>max {power.circuit15A.maxCabinets} cabinets</div>
          </div>
          <div className="border border-[#E8E4DC] p-2">
            <div className="text-[0.6875rem] text-[#5A5751]">120 V / 20 A circuit</div>
            <div className="text-[#1A1815]" style={serif}>max {power.circuit20A.maxCabinets} cabinets</div>
          </div>
        </div>
        <p className="mt-2 text-[0.8125rem] text-[#1A1815]">
          <b>&ldquo;8 cabinets to one cord&rdquo; is safe:</b> {power.chain.cabinetsPerChain} &times; {CABINET.peakW} W = {power.chain.chainPeakW} W = {power.chain.chainPeakAmps} A &mdash; under the 15 A breaker&rsquo;s 80% cap and the connector rating.
        </p>
        <p className="mt-1 text-[0.75rem] text-[#5A5751]">
          Plan: chain one row of {grid.wide} per cord &rarr; {power.circuitsIfOneChainPer15A} chains. Simplest = one 15 A circuit per row ({power.circuitsIfOneChainPer15A}&times; 15 A); or pack 2 rows per 20 A circuit ({power.circuitsOn20A}&times; 20 A). Power daisy-chains cabinet&rarr;cabinet up to the safe max, then one feed per chain.
        </p>
      </div>

      {/* DATA MAP — NovaStar VX1000 port math */}
      <div className={card}>
        <div className={labelCls}>Data map &middot; {VX1000_LOAD.model}</div>
        <ul className="mt-2 space-y-1.5 text-[0.8125rem] text-[#1A1815]">
          <li className="flex gap-2"><span className="text-[#B85838]">&middot;</span><span>Capacity: up to {data.cabinetsPerPort} cabinets per port (each ~{data.pxPerCabinet.toLocaleString()} px; port cap {data.portCap.toLocaleString()} px).</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">&middot;</span><span><b>Confirmed wiring: one LED line per COLUMN</b> &rarr; {ledMath.lines} lines, each {ledMath.cabinetsPerLine} cabinets daisy-chained &asymp; {ledMath.pxPerLine.toLocaleString()} px/line (under the {LED_DATA.portLimitPx.toLocaleString()} limit).</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">&middot;</span><span><b>{ledMath.portsUsed} of {LED_DATA.totalPorts} ports</b> used, {ledMath.sparePorts} spare &middot; within the {VX1000_LOAD.maxLoadMegapixels} MP load. See the confirmed signal chain below.</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">&middot;</span><span>Path: VX1000 port &rarr; top cabinet of a column &rarr; daisy-chain DOWN its {ledMath.cabinetsPerLine} cabinets. DIRECT, no switch.</span></li>
        </ul>
      </div>

      {/* SIGNAL CHAIN + AV DEVICE INVENTORY — two switchers, two jobs */}
      <div className={card}>
        <div className={labelCls}>Signal chain &middot; cameras &rarr; ATEM &rarr; NovaStar &rarr; wall</div>
        <ol className="mt-2 space-y-2">
          {SIGNAL_CHAIN.hops.map((h, i) => (
            <li key={i} className="flex gap-2.5">
              <div className="shrink-0 w-5 h-5 rounded-full bg-[#B85838] text-white text-[0.625rem] flex items-center justify-center" style={serif}>{i + 1}</div>
              <span className="text-[0.8125rem] text-[#1A1815]">{h}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[0.75rem] text-[#1A1815] border-l-2 border-[#B85838] pl-2.5">
          <b>Two switchers:</b> {SIGNAL_CHAIN.roleSplit}
        </p>
        <p className="mt-2 text-[0.75rem] text-[#1A1815] border-l-2 border-[#B85838] pl-2.5">
          <b>Cameras:</b> {SIGNAL_CHAIN.cameraControlNote}
        </p>

        <div className="mt-4 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Device inventory</div>
        <div className="mt-2 space-y-2">
          {AV_DEVICES.map((d) => (
            <div key={d.id} className="border border-[#E8E4DC] p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[0.8125rem] font-semibold text-[#1A1815]" style={serif}>{d.model}</span>
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{d.category}</span>
              </div>
              <div className="text-[0.75rem] text-[#5A5751]">{d.role}</div>
              <div className="text-[0.75rem] text-[#1A1815]">{d.specLine}</div>
              {d.controlNote && <div className="mt-0.5 text-[0.6875rem] text-[#5A5751] italic">{d.controlNote}</div>}
            </div>
          ))}
        </div>

        <div className="mt-3 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Source bridges (non-SDI sources)</div>
        <ul className="mt-1.5 space-y-1">
          {SOURCE_BRIDGES.map((b, i) => (
            <li key={i} className="text-[0.75rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">&middot;</span><span><b>{b.device}</b> &mdash; {b.forSource}. {b.note}</span></li>
          ))}
        </ul>

        <div className="mt-4 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Cabling &amp; placement</div>
        <p className="mt-2 text-[0.75rem] text-[#1A1815] border-l-2 border-[#B85838] pl-2.5">
          <b>&#9888; Critical:</b> {CABLING_PLANES.noSwitchRule}
        </p>
        <ul className="mt-2 space-y-1">
          {CABLING_PLANES.jobs.map((j, i) => (
            <li key={i} className="text-[0.75rem] text-[#1A1815] flex gap-2">
              <span className="text-[#B85838]">&middot;</span>
              <span><b>{j.name}:</b> {j.carries} {j.note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[0.75rem] text-[#1A1815]"><b>Placement (decided):</b> {WALL_PLACEMENT.decision} Video to the wall via the recommended {WALL_PLACEMENT.videoTransport.optionA.name}.</p>
        <p className="mt-1 text-[0.75rem] text-[#5A5751]"><b>Wall feed:</b> {WALL_FEED_ARCHITECTURE.recommended.name} ({WALL_FEED_ARCHITECTURE.buyList})</p>

        <p className="mt-3 text-[0.6875rem] text-[#5A5751] italic">Source: {ATEM.source}.</p>
      </div>

      {/* ===== CONFIRMED LED-WALL SIGNAL CHAIN — documentation he returns to ===== */}
      <div className={card}>
        <div className={labelCls}>LED wall signal chain &middot; confirmed (documentation)</div>
        <p className="mt-2 text-[0.8125rem] text-[#1A1815]">
          Wall = <b>{LED_DATA.lines} columns &times; {LED_DATA.cabinetsPerLine} rows = 48 cabinets</b>; native ~2,710 &times; 1,508 px (~4.1M), ~85k px/cabinet.
          <span className="text-[#5A5751]"> Exact map confirmed from NovaLCT.</span>
        </p>

        {/* Simple in-app diagram of the video path + the direct LED lines */}
        <svg viewBox="0 0 840 120" role="img" aria-label="Signal chain: program source through KEQINX, receiver and NovaStar to the LED wall" className="mt-3 w-full">
          <title>Program source &rarr; KEQINX &rarr; receiver &rarr; NovaStar &rarr; LED wall</title>
          <defs>
            <marker id="vwArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#5A5751" /></marker>
            <marker id="vwArrowLed" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#B85838" /></marker>
          </defs>
          {CHAIN_DIAGRAM.nodes.map((n, i) => {
            const x = 10 + i * 170;
            return (
              <g key={n.id}>
                <rect x={x} y={40} width={140} height={56} rx={4} fill="#FAF8F4" stroke="#1A1815" />
                <text x={x + 70} y={66} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1A1815">{n.label}</text>
                <text x={x + 70} y={83} textAnchor="middle" fontSize="9.5" fill="#5A5751">{n.sub}</text>
              </g>
            );
          })}
          {[0, 1, 2, 3].map((i) => {
            const x1 = 10 + i * 170 + 140;
            const x2 = 10 + (i + 1) * 170;
            const led = i === 3;
            const label = led ? CHAIN_DIAGRAM.ledEdge.label : CHAIN_DIAGRAM.videoEdges[i].label;
            return (
              <g key={i}>
                <line x1={x1} y1={68} x2={x2 - 2} y2={68} stroke={led ? '#B85838' : '#5A5751'} strokeWidth={led ? 2.5 : 1.5} markerEnd={`url(#${led ? 'vwArrowLed' : 'vwArrow'})`} />
                <text x={(x1 + x2) / 2} y={30} textAnchor="middle" fontSize="9.5" fill={led ? '#B85838' : '#5A5751'}>{label}</text>
              </g>
            );
          })}
        </svg>
        <p className="text-[0.6875rem] text-[#5A5751] italic">{CHAIN_DIAGRAM.controlNote}</p>

        {/* VIDEO IN */}
        <div className="mt-4 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Video in (owned gear &mdash; replaces the NDI decoder)</div>
        <ol className="mt-1.5 space-y-1">
          {VIDEO_IN.path.map((h, i) => (
            <li key={i} className="text-[0.8125rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">{i + 1}.</span><span>{h}</span></li>
          ))}
        </ol>
        <p className="mt-1 text-[0.75rem] text-[#5A5751]">{VIDEO_IN.otherOutputs} <span className="italic">{VIDEO_IN.ownedGear}</span></p>

        {/* CONTROL + LED DATA + POWER + MAP */}
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div className="border border-[#E8E4DC] p-2.5">
            <div className="text-[0.75rem] font-semibold text-[#1A1815]" style={serif}>Control (network)</div>
            <div className="text-[0.75rem] text-[#5A5751]">{CONTROL.path}</div>
          </div>
          <div className="border border-[#E8E4DC] p-2.5">
            <div className="text-[0.75rem] font-semibold text-[#1A1815]" style={serif}>LED data (DIRECT)</div>
            <div className="text-[0.75rem] text-[#1A1815]"><b>{ledMath.lines} lines</b>, one per column &middot; {ledMath.cabinetsPerLine} cabinets each &asymp; {ledMath.pxPerLine.toLocaleString()} px/line (&lt; {LED_DATA.portLimitPx.toLocaleString()}) &middot; {ledMath.portsUsed} of {LED_DATA.totalPorts} ports, {ledMath.sparePorts} spare.</div>
            <div className="mt-1 text-[0.75rem] text-[#B85838]"><b>&#9888; {LED_DATA.rule}</b></div>
          </div>
          <div className="border border-[#E8E4DC] p-2.5">
            <div className="text-[0.75rem] font-semibold text-[#1A1815]" style={serif}>Power</div>
            <div className="text-[0.75rem] text-[#5A5751]">{POWER.note}</div>
          </div>
          <div className="border border-[#E8E4DC] p-2.5">
            <div className="text-[0.75rem] font-semibold text-[#1A1815]" style={serif}>Mapping</div>
            <div className="text-[0.75rem] text-[#5A5751]">{MAP.note}</div>
          </div>
        </div>
      </div>

      {/* ===== TEACHING CARD — staff & volunteers ===== */}
      <div className={card}>
        <div className={labelCls}>Teaching card &middot; staff &amp; volunteers</div>
        <div className="mt-1 text-[0.875rem] font-semibold text-[#1A1815]" style={serif}>{TEACHING_CARD.title}</div>
        <p className="mt-1 text-[0.8125rem] text-[#5A5751]">{TEACHING_CARD.intro}</p>
        <div className="mt-2 space-y-2">
          {TEACHING_CARD.planes.map((p, i) => (
            <div key={i}>
              <div className="text-[0.8125rem] font-semibold text-[#1A1815]" style={serif}>{p.name}</div>
              <div className="text-[0.75rem] text-[#5A5751]">{p.plain}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[0.8125rem] text-[#1A1815] border-l-2 border-[#B85838] pl-2.5"><b>{TEACHING_CARD.oneLiner}</b></p>
      </div>

      {/* ===== VX1000 SOFTWARE — the NovaStar program stack (copy on-site) ===== */}
      <div className={card}>
        <div className={labelCls}>VX1000 software &middot; {VX1000_SOFTWARE.controller}</div>
        <p className="mt-2 text-[0.8125rem] text-[#1A1815]">
          Download (official NovaStar): <a href={VX1000_SOFTWARE.downloadUrl} target="_blank" rel="noreferrer" className="text-[#B85838] underline hover:text-[#1A1815]">{VX1000_SOFTWARE.downloadUrl}</a>
        </p>
        <p className="mt-0.5 text-[0.75rem] text-[#5A5751]">{VX1000_SOFTWARE.downloadNav}</p>
        <p className="mt-0.5 text-[0.75rem] text-[#5A5751]">
          {VX1000_SOFTWARE.downloadSearchNav} <a href={VX1000_SOFTWARE.downloadSearchUrl} target="_blank" rel="noreferrer" className="text-[#B85838] underline hover:text-[#1A1815]">{VX1000_SOFTWARE.downloadSearchUrl}</a>
        </p>
        <p className="mt-0.5 text-[0.6875rem] text-[#B85838] italic">{VX1000_SOFTWARE.officialOnly}</p>

        <div className="mt-3 space-y-2">
          {VX1000_SOFTWARE.programs.map((p) => (
            <div key={p.name} className="border border-[#E8E4DC] p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[0.8125rem] font-semibold text-[#1A1815]" style={serif}>{p.name}{p.optional ? ' (optional)' : ''}</span>
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{p.when}</span>
              </div>
              <div className="text-[0.75rem] text-[#1A1815]">{p.role} &mdash; {p.does}</div>
              <div className="mt-0.5 text-[0.6875rem] text-[#5A5751] italic">Installs on: {p.machine}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">On-site first setup</div>
        <ol className="mt-1.5 space-y-1">
          {VX1000_SOFTWARE.steps.map((s, i) => (
            <li key={i} className="text-[0.8125rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">{i + 1}.</span><span>{s}</span></li>
          ))}
        </ol>
        <p className="mt-1 text-[0.6875rem] text-[#5A5751] italic">{VX1000_SOFTWARE.usbNote}</p>

        <div className="mt-3 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Which software on which machine</div>
        <ul className="mt-1 space-y-1">
          {VX1000_SOFTWARE.machinePlan.map((m, i) => (
            <li key={i} className="text-[0.75rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">&middot;</span><span><b>{m.install}</b> &rarr; {m.machine}. {m.note}</span></li>
          ))}
        </ul>
        <p className="mt-1 text-[0.6875rem] text-[#B85838] italic">Confirm: {VX1000_SOFTWARE.machinePlanConfirm}</p>

        {/* Copy-ready block — select all + copy on mobile */}
        <div className="mt-3 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Copy this</div>
        <pre className="mt-1.5 whitespace-pre-wrap text-[0.75rem] text-[#1A1815] bg-[#FAF8F4] border border-[#E8E4DC] p-2.5 font-sans">{
`VX1000 software (official NovaStar)
Download: ${VX1000_SOFTWARE.downloadUrl}
  ${VX1000_SOFTWARE.downloadNav}
  Search fallback: ${VX1000_SOFTWARE.downloadSearchUrl} (search "NovaLCT")
${VX1000_SOFTWARE.programs.map((p) => `- ${p.name}${p.optional ? ' (optional)' : ''}: ${p.role} — ${p.does} [${p.machine}]`).join('\n')}

On-site first setup:
${VX1000_SOFTWARE.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
}</pre>
      </div>

      {/* ===== ILLUSTRATED NovaLCT SETUP RUNBOOK (verified on-site 2026-07-01) ===== */}
      <div className={card}>
        <div className={labelCls}>LED Wall Setup &middot; NovaStar VX1000 Pro + NovaLCT (illustrated)</div>
        <p className="mt-1 text-[0.75rem] text-[#5A5751]">Verified on site 2026-07-01. Each step has its screenshot/photo below (labeled slot until the on-site image is attached).</p>
        <ol className="mt-3 space-y-3">
          {NOVALCT_SETUP_STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-[#1A1815] text-white text-[0.625rem] flex items-center justify-center" style={serif}>{s.n}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.8125rem] font-semibold text-[#1A1815]" style={serif}>{s.title}</div>
                <div className="text-[0.75rem] text-[#1A1815]">{s.action}</div>
                <div className="mt-0.5 text-[0.6875rem] text-[#5A5751]">{s.detail}</div>
                <MediaSlot base={mediaBase} photo={s.photo} label={s.slot} />
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ===== PANEL / WALL SPEC (canonical) ===== */}
      <div className={card}>
        <div className={labelCls}>Panel / wall spec (canonical &middot; confirmed on-site)</div>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.75rem]">
          <div><dt className="text-[0.625rem] text-[#5A5751]">Panel</dt><dd className="text-[#1A1815]">{PANEL_SPEC.vendor}</dd></div>
          <div><dt className="text-[0.625rem] text-[#5A5751]">Model / RX card</dt><dd className="text-[#1A1815]">{PANEL_SPEC.panelModel} &middot; {PANEL_SPEC.receivingCard}</dd></div>
          <div><dt className="text-[0.625rem] text-[#5A5751]">Cabinet</dt><dd className="text-[#1A1815]">{PANEL_SPEC.cabinetPx} ({PANEL_SPEC.cabinetMm}), {PANEL_SPEC.modules}, {PANEL_SPEC.pitchMm}mm</dd></div>
          <div><dt className="text-[0.625rem] text-[#5A5751]">Module params</dt><dd className="text-[#1A1815]">{PANEL_SPEC.moduleParams}</dd></div>
          <div><dt className="text-[0.625rem] text-[#5A5751]">Wall</dt><dd className="text-[#1A1815]">{PANEL_SPEC.grid} = {PANEL_SPEC.nativePx}</dd></div>
          <div><dt className="text-[0.625rem] text-[#5A5751]">RX Card Size</dt><dd className="text-[#1A1815]">{PANEL_SPEC.receivingCardSize}</dd></div>
        </dl>
        <p className="mt-2 text-[0.6875rem] text-[#1A1815]"><b>Per-port:</b> {PANEL_SPEC.perPortLoad}</p>
        <p className="mt-1 text-[0.6875rem] text-[#1A1815]"><b>Source:</b> {PANEL_SPEC.source}</p>
        <p className="mt-1 text-[0.6875rem] text-[#B85838] italic">{PANEL_SPEC.verify}</p>
      </div>

      {/* ===== VERIFIED SCREEN CONNECTION MAP (canonical reference) ===== */}
      <div className={card}>
        <div className={labelCls}>Verified screen connection map &middot; {SCREEN_CONNECTION_MAP.verifiedOn}</div>
        <p className="mt-2 text-[0.8125rem] text-[#1A1815]">{SCREEN_CONNECTION_MAP.rule}</p>
        <p className="mt-2 text-[0.75rem] text-[#1A1815] border-l-2 border-[#B85838] pl-2.5"><b>The mechanic to teach:</b> {SCREEN_CONNECTION_MAP.mechanic}</p>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {SCREEN_CONNECTION_MAP.ports.map((p) => (
            <div key={p.port} className="border border-[#E8E4DC] p-1.5 text-[0.625rem]">
              <div className="font-semibold text-[#1A1815]">Port {p.port}</div>
              <div className="text-[#5A5751]">{p.column}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[0.6875rem] text-[#B85838] italic">{SCREEN_CONNECTION_MAP.receivingCardSizeNote}</p>
        <p className="mt-1 text-[0.6875rem] text-[#5A5751]">{SCREEN_CONNECTION_MAP.save}</p>
        <MediaSlot base={mediaBase} photo={SCREEN_CONNECTION_MAP.photo} label={SCREEN_CONNECTION_MAP.slot} />
      </div>

      {/* ===== VERIFIED FINAL CONFIG + the real apply procedure ===== */}
      <div className={card}>
        <div className={labelCls}>Screen configuration &middot; COMPLETE (verified)</div>
        <p className="mt-2 text-[0.8125rem] text-[#1A1815]">{FINAL_CONFIG.status}</p>
        <p className="mt-1 text-[0.6875rem] text-[#5A5751]">{FINAL_CONFIG.verified}</p>
        <p className="mt-2 text-[0.75rem] text-[#1A1815] border-l-2 border-[#B85838] pl-2.5"><b>&#9888; Real procedure:</b> {FINAL_CONFIG.realProcedure}</p>
        <p className="mt-1 text-[0.6875rem] text-[#B85838] italic">{FINAL_CONFIG.friction}</p>
        <p className="mt-1 text-[0.6875rem] text-[#1A1815]"><b>Remaining:</b> {FINAL_CONFIG.remaining}</p>
        <MediaSlot base={mediaBase} photo={FINAL_CONFIG.photo} label={FINAL_CONFIG.slot} />
      </div>

      {/* ===== TOMORROW — activation (open item) ===== */}
      <div className={card}>
        <div className={labelCls}>Tomorrow &middot; activation (open item)</div>
        <p className="mt-2 text-[0.8125rem] text-[#1A1815]"><b>Symptom:</b> {TOMORROW_ACTIVATION.symptom}</p>
        <p className="mt-1 text-[0.75rem] text-[#5A5751]"><b>Cause:</b> {TOMORROW_ACTIVATION.cause}</p>
        <ol className="mt-2 space-y-1">
          {TOMORROW_ACTIVATION.steps.map((s, i) => (
            <li key={i} className="text-[0.75rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">{i + 1}.</span><span>{s}</span></li>
          ))}
        </ol>
        <p className="mt-2 text-[0.6875rem] text-[#5A5751] italic">{TOMORROW_ACTIVATION.status}</p>
      </div>

      {/* ===== INSTALL GALLERY (labeled slots — attach the on-site photos) ===== */}
      <div className={card}>
        <div className={labelCls}>Install gallery &middot; on-site photos</div>
        <p className="mt-1 text-[0.6875rem] text-[#5A5751]">The actual COLG install. Labeled slots until the on-site photos are attached (serving pending the NAS media host).</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {INSTALL_GALLERY.map((g) => (
            <MediaSlot key={g.id} base={mediaBase} photo={g.photo} label={g.label} />
          ))}
        </div>
      </div>

      {/* ===== TOOL CACHE + CONTROL FROM ANYWHERE ===== */}
      <div className={card}>
        <div className={labelCls}>Tool cache &amp; control from anywhere</div>

        <div className="mt-2 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Sovereign tool cache (NAS)</div>
        <p className="mt-1 text-[0.8125rem] text-[#1A1815]">{TOOL_CACHE.purpose}</p>
        <p className="mt-1 text-[0.75rem] text-[#1A1815]"><b>NAS:</b> <span className="font-sans">{TOOL_CACHE.nasPath}</span> &middot; <b>SMB:</b> <span className="font-sans">{TOOL_CACHE.smbPath}</span></p>
        <ul className="mt-1.5 space-y-1">
          {TOOL_CACHE.contents.map((c, i) => (
            <li key={i} className="text-[0.75rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">&middot;</span><span>{c.file} <span className="text-[#B85838] italic">[{c.status}]</span>{c.note ? ` — ${c.note}` : ''}</span></li>
          ))}
        </ul>
        <p className="mt-1 text-[0.6875rem] text-[#5A5751]"><b>Pull:</b> {TOOL_CACHE.howToPull}</p>
        <p className="mt-0.5 text-[0.6875rem] text-[#5A5751] italic">{TOOL_CACHE.populateOnce}</p>

        <div className="mt-3 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Control from anywhere</div>
        <p className="mt-1 text-[0.8125rem] text-[#1A1815]">{CONTROL_FROM_ANYWHERE.summary}</p>
        <div className="mt-2 space-y-2">
          {CONTROL_FROM_ANYWHERE.options.map((o, i) => (
            <div key={i} className="border border-[#E8E4DC] p-2.5">
              <div className="text-[0.8125rem] font-semibold text-[#1A1815]" style={serif}>{o.name}</div>
              <div className="text-[0.75rem] text-[#1A1815]">{o.how}</div>
              <div className="mt-0.5 text-[0.6875rem] text-[#5A5751] italic">Use for: {o.use}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 border-l-2 border-[#B85838] pl-2.5">
          {CONTROL_FROM_ANYWHERE.guardrails.map((g, i) => (
            <p key={i} className="text-[0.75rem] text-[#1A1815]"><b>&#9888;</b> {g}</p>
          ))}
        </div>
      </div>

      {/* ===== FIRST LIGHT — fresh out of box: test tonight, map tomorrow ===== */}
      <div className={card}>
        <div className={labelCls}>First light &middot; test tonight, map tomorrow</div>
        <p className="mt-2 text-[0.75rem] text-[#1A1815] border-l-2 border-[#B85838] pl-2.5">
          <b>&#9888; The USB stick won&rsquo;t play in the VX1000.</b> {FIRST_LIGHT.usbMyth}
        </p>

        <div className="mt-3 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Tonight &mdash; proof of life (5 min)</div>
        <ol className="mt-1.5 space-y-1">
          {FIRST_LIGHT.proofOfLife.map((s, i) => (
            <li key={i} className="text-[0.8125rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">{i + 1}.</span><span>{s}</span></li>
          ))}
        </ol>
        <p className="mt-1 text-[0.6875rem] text-[#5A5751] italic">{FIRST_LIGHT.proofOfLifeNote}</p>

        <div className="mt-3 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Tomorrow &mdash; map it once (NovaLCT)</div>
        <ul className="mt-1 space-y-1">
          {FIRST_LIGHT.mappingRequires.map((r, i) => (
            <li key={i} className="text-[0.75rem] text-[#5A5751] flex gap-2"><span className="text-[#B85838]">&middot;</span><span>{r}</span></li>
          ))}
        </ul>
        <ol className="mt-2 space-y-2">
          {FIRST_LIGHT.novalctSteps.map((s) => (
            <li key={s.step} className="flex gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-[#1A1815] text-white text-[0.625rem] flex items-center justify-center" style={serif}>{s.step}</div>
              <div>
                <div className="text-[0.8125rem] font-semibold text-[#1A1815]" style={serif}>{s.title}</div>
                <div className="text-[0.75rem] text-[#5A5751]">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[0.8125rem] text-[#1A1815] border-l-2 border-[#B85838] pl-2.5">{FIRST_LIGHT.recommendation}</p>

        {/* Copy-ready vendor message — unblocks tomorrow */}
        <div className="mt-4 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Send tonight &mdash; {VENDOR_MESSAGE.to}</div>
        <pre className="mt-1.5 whitespace-pre-wrap text-[0.75rem] text-[#1A1815] bg-[#FAF8F4] border border-[#E8E4DC] p-2.5 font-sans">{VENDOR_MESSAGE.body.join('\n')}</pre>
      </div>

      {/* ===== FINISH CHECKLIST — work it down to done ===== */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <div className={labelCls}>Finish checklist &middot; drive it to done</div>
          <div className="text-[0.75rem] font-semibold text-[#1A1815]">{doneCount} / {FINISH_CHECKLIST.length}</div>
        </div>
        <div className="mt-2 h-1.5 bg-[#E8E4DC]" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={FINISH_CHECKLIST.length} aria-label="Finish checklist progress">
          <div className="h-1.5 bg-[#B85838]" style={{ width: `${Math.round((doneCount / FINISH_CHECKLIST.length) * 100)}%` }} />
        </div>
        <div className="mt-3 space-y-3">
          {checklistGroups.map(({ group, items }) => (
            <div key={group}>
              <div className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">{group}</div>
              <ul className="mt-1 space-y-1.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <label className="flex gap-2.5 cursor-pointer items-start">
                      <input
                        type="checkbox"
                        checked={!!checked[item.id]}
                        onChange={() => toggleCheck(item.id)}
                        className="mt-0.5 shrink-0 accent-[#B85838]"
                        aria-label={item.label}
                      />
                      <span>
                        <span className={`text-[0.8125rem] ${checked[item.id] ? 'text-[#5A5751] line-through' : 'text-[#1A1815]'}`} style={serif}>{item.label}</span>
                        <span className="block text-[0.6875rem] text-[#5A5751]">{item.detail}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[0.6875rem] text-[#5A5751] italic">Progress is saved on this device. Work the cabling (8 LED lines + 1 control + 1 video-in), power, mapping, then test-light.</p>
      </div>

      {/* INSTALL SEQUENCE — the build order */}
      <div className={card}>
        <div className={labelCls}>Install sequence</div>
        <ol className="mt-2 space-y-2.5">
          {INSTALL_SEQUENCE.map((s) => (
            <li key={s.step} className="flex gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-[#1A1815] text-white text-[0.6875rem] flex items-center justify-center" style={serif}>{s.step}</div>
              <div>
                <div className="text-[0.8125rem] font-semibold text-[#1A1815]" style={serif}>{s.title}</div>
                <div className="text-[0.75rem] text-[#5A5751]">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* SAFETY — load + fire, stated once, real */}
      <div className={card}>
        <div className={labelCls}>Safety &middot; power &amp; load</div>
        <ul className="mt-2 space-y-1.5">
          {SAFETY.map((s, i) => (
            <li key={i} className="text-[0.8125rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">&#9888;</span><span>{s}</span></li>
          ))}
        </ul>
        <p className="mt-2 text-[0.6875rem] text-[#5A5751] italic">
          Full on-site runbook: docs/99-session-notes/2026-06-29-colg-video-wall-install-power-data-runbook.md
        </p>
      </div>

      {/* BUDGET — GATED. Money is fetched (owner/admin) or hidden. */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <div className={labelCls}>Budget &middot; 🔒 staff only</div>
          {access.canSee && projectLines.length > 0 && (
            <div className="text-sm font-semibold text-[#1A1815]">{money(totals.currentTotal)}</div>
          )}
        </div>
        {!access.canSee ? (
          <p className="mt-2 text-[0.75rem] text-[#5A5751]">Budget figures are church financial data — sign in with a church owner/admin account to view them.</p>
        ) : projects == null ? (
          <p className="mt-2 text-[0.75rem] text-[#5A5751]">Loading…</p>
        ) : projectLines.length === 0 ? (
          <p className="mt-2 text-[0.75rem] text-[#5A5751]">No budget lines yet. After migration 0027 applies, run the gitignored seed (infra/supabase/seeds/colg-video-wall.sql) once in Studio to load the grounded figures — they stay server-side, never in the public bundle.</p>
        ) : (
          <div className="mt-2">
            {projectLines.map((l) => <BudgetLine key={l.id} line={l} />)}
            <div className="mt-2 text-[0.6875rem] text-[#5A5751]">
              Current cost reflects only active lines; superseded history is struck through.
              {totals.hasUnquoted && ` ${totals.unquotedCount} accessory line(s) not yet quoted.`}
            </div>
          </div>
        )}
      </div>

      {/* DONATION TRACKER — GATED. Pledged vs received; "awaiting" until known. */}
      <div className={card}>
        <div className={labelCls}>Donations &middot; 🔒 staff only</div>
        {!access.canSee ? (
          <p className="mt-2 text-[0.75rem] text-[#5A5751]">Donation totals are gated to church owner/admin accounts.</p>
        ) : !donation.known ? (
          <p className="mt-2 text-[0.75rem] text-[#5A5751]">
            {project?.donationNote || 'Funded by community "Video Wall Donation" envelopes (BG).'} Pledged and received totals are entered by staff once counted — no figure is shown until it’s real.
          </p>
        ) : (
          <div className="mt-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-[#1A1815]">Received {money(donation.received)}</span>
              <span className="text-[#5A5751]">of {money(donation.pledged)} pledged</span>
            </div>
            <div className="mt-1.5 h-2 bg-[#E8E4DC]" role="progressbar" aria-valuenow={donation.pct ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Donations received vs pledged">
              <div className="h-2 bg-[#B85838]" style={{ width: `${donation.pct ?? 0}%` }} />
            </div>
            {donation.remaining != null && <div className="mt-1 text-[0.6875rem] text-[#5A5751]">{money(donation.remaining)} remaining</div>}
          </div>
        )}
      </div>

      {/* STATUS TIMELINE — public-safe narrative */}
      <div className={card}>
        <div className={labelCls}>Timeline</div>
        <ol className="mt-2 space-y-3">
          {TIMELINE.map((t, i) => (
            <li key={i} className="flex gap-3">
              <div className="pt-1"><KpiDot status={t.tone} /></div>
              <div>
                <div className="text-sm text-[#1A1815]" style={serif}><span className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mr-2">{t.when}</span>{t.title}</div>
                <div className="text-[0.75rem] text-[#5A5751]">{t.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ON-SITE INSTALL — the install-milestone EVENT record (public-safe facts) */}
      <div className={card}>
        <div className={labelCls}>On site &middot; install in progress &middot; {INSTALL.observedOn}</div>
        <p className="mt-2 text-[0.75rem] text-[#5A5751]">
          The physical front end of the sovereign media / broadcast buildout. Components observed on site as assembly began:
        </p>
        <ul className="mt-2 space-y-1.5">
          {INSTALL.components.map((c, i) => (
            <li key={i} className="text-[0.8125rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">&middot;</span><span>{c}</span></li>
          ))}
        </ul>
        <div className="mt-3 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Existing AV environment it joins</div>
        <ul className="mt-1.5 space-y-1.5">
          {INSTALL.environment.map((c, i) => (
            <li key={i} className="text-[0.8125rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">&middot;</span><span>{c}</span></li>
          ))}
        </ul>
        <p className="mt-3 text-[0.6875rem] text-[#5A5751] italic">Source: {INSTALL.source}.</p>
      </div>

      {/* OPPORTUNITIES */}
      <div className={card}>
        <div className={labelCls}>Opportunities</div>
        <ul className="mt-2 space-y-1.5">
          {OPPORTUNITIES.map((o, i) => (
            <li key={i} className="text-[0.8125rem] text-[#1A1815] flex gap-2"><span className="text-[#B85838]">&rarr;</span><span>{o}</span></li>
          ))}
        </ul>
      </div>

      {/* CONSTRAINTS */}
      <div className={card}>
        <div className={labelCls}>Constraints to resolve before install</div>
        <div className="mt-2 space-y-2.5">
          {CONSTRAINTS.map((c, i) => (
            <div key={i}>
              <div className="text-[0.8125rem] font-semibold text-[#1A1815]" style={serif}>{c.h}</div>
              <div className="text-[0.75rem] text-[#5A5751]">{c.b}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CONNECTIONS — ties to the broadcast course + The Word feed */}
      <div className={card}>
        <div className={labelCls}>Connected to</div>
        <ul className="mt-2 space-y-1.5 text-[0.8125rem] text-[#1A1815]">
          <li className="flex gap-2"><span className="text-[#B85838]">&middot;</span><span><b>Media-team broadcast course</b> &mdash; trainees learn the real signal chain that drives this wall.</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">&middot;</span><span><b>The Word &mdash; Migdal</b> &mdash; BG&rsquo;s study notes and the passage will present from the app to the wall once the OBS/NDI bridge is commissioned (render route built; commissioning pending).</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">&middot;</span><span><b>Sovereign media pipeline (NDI / CUDA)</b> &mdash; this wall is the physical front end the NDI + CUDA encode/playback chain drives.</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">&middot;</span><span><b>COLG NAS build</b> &mdash; church-owned storage + playback the wall reads from; this CapEx record seeds the church-infrastructure accounting that gates the media-pipeline build.</span></li>
        </ul>
      </div>
    </div>
  );
}
