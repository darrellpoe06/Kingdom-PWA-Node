// =============================================================================
// CommandServeCenter — the C2S seat inside the PoeTech app
// =============================================================================
// "Building and solidifying the app while working inside the command and control
//  and serve center module to build all other modules and see." (Darrell,
//  2026-06-17.)
//
// The unifying capstone of the cockpit: ONE coherent center surface, not scattered.
// It COMPOSES the real surfaces already on main (it does not duplicate their
// logic) under four faculties — See, Command, Control, Serve — and frames them
// with the servant-king ontology: command in order to SERVE and steward.
//
// What it composes (every one is real on main today, self-fetching, no props):
//   • See     → OpsBoard, QualityProof, KpiLegend  (live system + quality state)
//   • Command → WakeOrchestrator (the braked orchestrator), ConflictLoop
//   • Control → ProjectMgmtPulse (the live projects + discussions + hand-offs
//               pulse, consolidated here from the Build board where it was
//               buried) + a deep-link to the full Projects / Build surface.
//   • Serve   → the seat itself: role-scoped access, the steward at the helm.
//
// BRAKES (CLAUDE.md, non-negotiable): this seat is the READ / DECIDE / HAND-OFF
// loop. Autonomous execution stays behind the Cage (budget · concurrency lock ·
// kill-switch, owned by WakeOrchestrator's engine, shipped INERT). "Go" is the
// steward's; the center never goes off-leash. NO FAKE GREEN (DR-0076): each
// faculty reports its real readiness from centerReadiness() — a partial faculty
// says so.
//
// Governor-gated (isFamilyEmail), no-leak: nothing here renders for a non-steward.
// WCAG AA, BOTH light and dark: every accent is a THEMEABLE class (text-[#…]),
// never an inline color, so the per-[data-theme] remap carries it. On the
// default/light surfaces #1A1815, #5A5751 (7.2:1), #5A6E3D (5.6:1), #B85838
// (4.7:1 on the white card); on midnight they remap to bright tokens (#E5E5E5,
// #888888, #86EFAC, #FB923C) that clear AA on black. The contrast guard now
// enforces this per-theme + scans for any inline color that would regress it.
import React, { useState } from 'react';
import OpsBoard from './OpsBoard.jsx';
import QualityProof from './QualityProof.jsx';
import QualityThroughput from './QualityThroughput.jsx';
import FamilyRoster from './FamilyRoster.jsx';
import ConflictLoop from './ConflictLoop.jsx';
import WakeOrchestrator from './WakeOrchestrator.jsx';
import ProjectMgmtPulse from './ProjectMgmtPulse.jsx';
import { KpiLegend } from './KpiLegend.jsx';
import { FreshnessDot } from './FreshnessDot.jsx';
import {
  FACULTIES,
  seatOf,
  centerReadiness,
  SELF_HOSTING_LOOP,
  brakeStatusLine,
} from '../lib/command-serve-center.js';

const BUILD_SHA = (typeof __BUILD_SHA__ !== 'undefined') ? __BUILD_SHA__ : 'dev';
const BUILD_TIME = (typeof __BUILD_TIME__ !== 'undefined') ? __BUILD_TIME__ : null;

// Honest per-faculty readiness chip. Color follows real state, never decorative.
// `cls` is the THEMEABLE text class (not an inline color) so the per-[data-theme]
// remap applies — an inline color stays dark on the midnight surface (the
// dark-mode-contrast bug this PR closes). The contrast guard's inline-color
// scanner now fails the build if any of these regress to inline `style` colors.
const READY_META = {
  live:    { cls: 'text-[#5A6E3D]', symbol: '●', label: 'Live' },
  partial: { cls: 'text-[#B85838]', symbol: '◐', label: 'Partial — wiring' },
  wiring:  { cls: 'text-[#5A5751]', symbol: '○', label: 'Wiring up' },
};
function ReadinessChip({ status }) {
  const m = READY_META[status] || READY_META.wiring;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.5625rem] uppercase tracking-wider font-semibold ${m.cls}`}
      style={{ fontFamily: '"JetBrains Mono", monospace' }}
    >
      <span aria-hidden="true">{m.symbol}</span>{m.label}
    </span>
  );
}

export function CommandServeCenter({ isGovernor = false, persona = null, email = null, onNavigate = null, projects = [], discussions = [], currentUserId = null }) {
  const seat = seatOf({ email, persona, isFamily: !!isGovernor });
  const ready = centerReadiness();
  const [tab, setTab] = useState('see');

  // No-leak: the seat is not theirs to command. Visible-but-locked is handled by
  // the nav render gate in the monolith; this is the defense-in-depth backstop.
  if (!isGovernor || !seat.seated) {
    return (
      <div className="space-y-4">
        <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751] font-semibold">🔒 Command, Control &amp; Serve Center</div>
          <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            This is the steward&apos;s seat — the cockpit from which the app is built and observed. Access is reserved for the family stewards.
          </p>
        </section>
      </div>
    );
  }

  const activeFaculty = FACULTIES.find((f) => f.key === tab) || FACULTIES[0];

  return (
    <div className="space-y-4">
      {/* SERVE header — the seated steward + the charge. The framing the other
          three faculties operate within: command in order to serve. */}
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">
            🕊 Command, Control &amp; Serve Center
          </div>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] inline-flex items-center gap-1.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            <span>live build {BUILD_SHA}{BUILD_TIME ? ` · ${BUILD_TIME.slice(0, 10)}` : ''}</span>
            <FreshnessDot />
          </div>
        </div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          One seat to <strong>see</strong> the whole system, <strong>command</strong> what gets built, <strong>control</strong> the work, and do it all in order to <strong>serve</strong> — the steward at the helm, for the family and the community.
        </p>
        <div className="mt-2 text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          <span className="text-[#5A5751]">Seated:</span>{' '}
          <strong>{seat.name || 'Steward'}</strong>
          <span className="text-[#5A5751]"> · {seat.roleLabel}</span>
        </div>
        <p className="text-[0.625rem] text-[#5A6E3D] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
          {seat.charge}
        </p>
      </section>

      {/* BRAKE banner — the self-hosting loop, staged + braked. Structural, not a
          comment: READ / DECIDE / VERIFY happen in the seat; HAND-OFF crosses
          into the Cage where the three brakes live. "Go" is the steward's. */}
      <section className="bg-[#FAF8F4] border border-[#B85838] p-3">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">⛓ Staged &amp; braked — the steward holds the leash</div>
        <p className="text-[0.6875rem] text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          {brakeStatusLine()}
        </p>
        <ol className="mt-2 flex flex-wrap items-stretch gap-1.5" aria-label="Self-hosting loop stages">
          {SELF_HOSTING_LOOP.map((s, i) => {
            // Themeable accent classes (not inline colors) so midnight remaps them.
            const accentText = s.inSeat ? 'text-[#5A6E3D]' : 'text-[#B85838]';
            const accentBorder = s.inSeat ? 'border-[#5A6E3D]' : 'border-[#B85838]';
            return (
              <li
                key={s.key}
                className={`flex-1 min-w-[120px] border p-2 bg-white ${accentBorder}`}
              >
                <div className={`text-[0.625rem] uppercase tracking-wider font-semibold ${accentText}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {i + 1}. {s.label}{!s.inSeat && ' →'}
                </div>
                <div className="text-[0.625rem] text-[#1A1815] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{s.what}</div>
                <div className={`text-[0.5625rem] uppercase tracking-wider mt-1 ${accentText}`}>
                  {s.inSeat ? 'in the seat' : 'behind the Cage'}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Faculty tabs — See / Command / Control / Serve. */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Center faculties">
        {FACULTIES.map((f) => {
          const active = tab === f.key;
          const r = ready[f.key];
          const rMeta = READY_META[r?.status] || READY_META.wiring;
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(f.key)}
              className={`text-xs uppercase tracking-wider px-3 py-1.5 border min-h-[36px] inline-flex items-center gap-1.5 focus:outline focus:outline-2 focus:outline-[#B85838] border-[#1A1815] ${active ? 'bg-[#1A1815] text-white' : 'text-[#1A1815]'}`}
            >
              <span aria-hidden="true">{f.glyph}</span>{f.label}
              <span aria-hidden="true" className={active ? 'text-white' : rMeta.cls}>
                {rMeta.symbol}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active faculty header — tagline + honest readiness note. */}
      <section className="bg-white border border-[#1A1815] p-3">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <h3 className="text-[0.6875rem] uppercase tracking-[0.25em] font-semibold text-[#1A1815]">
            <span aria-hidden="true" className="mr-1">{activeFaculty.glyph}</span>{activeFaculty.label}
          </h3>
          <ReadinessChip status={ready[activeFaculty.key]?.status} />
        </div>
        <p className="text-xs text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{activeFaculty.tagline}</p>
        <p className="text-[0.625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{ready[activeFaculty.key]?.note}</p>
      </section>

      {/* SEE — real system + quality state. The Quality & Throughput board
          (DR-0089) leads as the roll-up: every gate/coverage/ops number read
          live from its real artifact with the governing DR + principle beside
          it; OpsBoard and QualityProof carry the per-area detail below. */}
      {tab === 'see' && (
        <div className="space-y-4">
          <KpiLegend />
          <QualityThroughput />
          <OpsBoard />
          <QualityProof />
        </div>
      )}

      {/* COMMAND — direct the build via the braked orchestrator + the conflict
          loop (what to build / hot files / decomposition). */}
      {tab === 'command' && (
        <div className="space-y-4">
          <WakeOrchestrator />
          <ConflictLoop />
        </div>
      )}

      {/* CONTROL — the work. The live project-management pulse (real projects by
          stage, the discussions driving them, braked hand-offs) composes here in
          the seat — it used to be buried at the bottom of the Build board; now it
          lives in its one home. The full Projects / Build surface opens from here
          for editing. No painted data — the pulse reads real synced rows. */}
      {tab === 'control' && (
        <div className="space-y-3">
          <ProjectMgmtPulse projects={projects} discussions={discussions} currentUserId={currentUserId} isGovernor={isGovernor} />
          <section className="bg-white border border-[#1A1815] p-3">
            <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
              Open the full Projects &amp; Build surface to edit projects, scopes, capital, discussions, and the public build roadmap:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('projects')}
                disabled={!onNavigate}
                className="inline-flex items-center text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-[#1A1815]"
              >
                Open Projects &amp; Build →
              </button>
            </div>
          </section>
        </div>
      )}

      {/* SERVE — the ontology the seat operates within, and the household it
          serves first: the Family Roster (DR-0091) provisions children through
          the 0055/0057 safety rails — never through the email allowlist. */}
      {tab === 'serve' && (
        <div className="space-y-3">
          <FamilyRoster currentUserId={currentUserId} />
          <section className="bg-white border border-[#1A1815] p-4">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">🕊 Command in order to serve</div>
            <p className="text-sm text-[#1A1815] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
              The seat exists to <strong>serve and steward</strong>, not to dominate. Every command issued from here answers the same standing test: does this lift the family <em>and</em> the community, and create rather than extract?
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
              <li><span className="text-[#5A6E3D] mr-1" aria-hidden="true">›</span><strong>The steward at the helm.</strong> Role-scoped access — this seat renders for the family stewards only (no-leak).</li>
              <li><span className="text-[#5A6E3D] mr-1" aria-hidden="true">›</span><strong>Serve the community first.</strong> The Church of the Living God is the named first community; outward-serving surfaces build from this seat.</li>
              <li><span className="text-[#5A6E3D] mr-1" aria-hidden="true">›</span><strong>Create, never extract.</strong> The system makes the person more able to follow The Way — it does not extract from them.</li>
            </ul>
          </section>
        </div>
      )}

      <p className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Every surface here is a live view of real system state — composed into one seat, not scattered. Status chips show real readiness; a partial faculty says so.
      </p>
    </div>
  );
}

export default CommandServeCenter;
