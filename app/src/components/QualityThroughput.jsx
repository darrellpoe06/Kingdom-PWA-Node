// =============================================================================
// QualityThroughput — the Quality & Throughput board (DR-0089, steward seat)
// =============================================================================
// "One change ripples fifteen connected things — this page is where you watch
// it ripple, and catch the one thing that didn't." (Darrell, 2026-07-03.)
//
// One steward-gated surface where the QUANTITATIVE state and the QUALITATIVE
// record read together. Every number is a real measurement (DR-0076):
//   - test suite      -> census measured from the real test tree at build
//                        (scripts/test-census.mjs) + the LIVE CI verdict on main
//   - legibility      -> app/src/lib/legibility-health.json (vitest-synced scan)
//   - surface audit   -> app/src/lib/audit-findings.json (DR-0086 re-audit diff)
//   - migration ledger-> schema_migrations_health() RPC over _schema_migrations
//   - harvest coverage-> the live video_harvests corpus join (same math as the
//                        Harvest page — one truth, two views)
//   - ops commands    -> ops_commands rows (DR-0088) with real timing + outcome
//   - loops           -> the interconnect manifest summary (file-verified wiring)
// And beside each number, the WHY: the Decision Records + LESSONS-LEARNED
// principles that govern it, resolved against the REAL ledger — a ref that
// stops resolving renders as missing, never as a fabricated title.
//
// Mounted in the Command, Control & Serve Center's See faculty (governor-gated
// there, no-leak). Read-only: this board watches; the doing stays behind its
// own gates (the ops queue card, the deploy lane, the Cage).
import React, { useCallback, useEffect, useState } from 'react';
import { KpiDot } from './KpiDot.jsx';
import UiIcon from './UiIcon.jsx';
import { fetchOps, GITHUB_SLUG } from '../lib/github-ops.js';
import { ciVerdict } from '../lib/quality-proof.js';
import {
  normalizeCensus, normalizeLessons, drIndex, resolveWhy,
  opsThroughput, fmtMs, auditTile, harvestTile,
} from '../lib/quality-throughput.js';
import { legibilityHealth, legibilitySummaryLine, legibilityState, legibilityScore } from '../lib/legibility-health.js';
import auditArtifact from '../lib/audit-findings.json';
import { fetchSchemaHealth, summary as migrationSummary, healthKpiStatus, healthKpiLabel, fmtWhen } from '../lib/db-health.js';
import { subscribeOpsCommands } from '../lib/ops-commands.js';
import { fetchLedger } from '../lib/harvest-ledger.js';
import { normalizeInterconnect, interconnectHeadline } from '../lib/interconnect-loops.js';
import { readErrorJournal, errorJournalSummary } from '../lib/error-journal.js';

const CENSUS = normalizeCensus(typeof __TEST_CENSUS__ !== 'undefined' ? __TEST_CENSUS__ : null);
const LESSONS = normalizeLessons(typeof __LESSONS_PRINCIPLES__ !== 'undefined' ? __LESSONS_PRINCIPLES__ : null);
const DR_LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : { ok: false, count: 0, items: [] };
const INTERCONNECT = normalizeInterconnect(typeof __INTERCONNECT_LOOPS__ !== 'undefined' ? __INTERCONNECT_LOOPS__ : null);
const BUILD_SHA = (typeof __BUILD_SHA__ !== 'undefined') ? __BUILD_SHA__ : 'dev';

const DR_BY_ID = drIndex(DR_LEDGER);

// The Why strip under a metric: the governing DRs + principles, expandable in
// place. A ref the ledger no longer resolves reads "not in the ledger" — the
// missing pairing is surfaced, never papered over (DR-0076).
function WhyStrip({ metric }) {
  const { note, refs } = resolveWhy(metric, DR_BY_ID, LESSONS);
  if (!note && refs.length === 0) return null;
  return (
    <div className="mt-1.5">
      {note && (
        <p className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{note}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-1">
        {refs.map((r) => (
          r.found ? (
            <details key={r.id} className="inline-block">
              <summary className="cursor-pointer list-none inline-flex items-center gap-1 text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#5A5751] text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                <UiIcon name={r.kind === 'dr' ? 'check' : 'book'} className="w-3 h-3" /> {r.id}
              </summary>
              <p className="text-[0.6875rem] text-[#1A1815] mt-1 max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
                <strong>{r.id}</strong>{r.date ? ` (${r.date})` : ''} — {r.title}
              </p>
            </details>
          ) : (
            <span key={r.id} className="inline-flex items-center text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#DC2626] text-[#DC2626]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {r.id} — not in the ledger
            </span>
          )
        ))}
      </div>
    </div>
  );
}

// One metric row: the number, its live status, the artifact it was measured
// from, and the why beside it.
function Metric({ name, value, status, label, source, metric, children }) {
  return (
    <li className="px-2.5 py-2 border-b border-[#F2EEE6] last:border-b-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{name}</span>
        <KpiDot status={status} label={label} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0" />
      </div>
      <div className="text-sm text-[#1A1815] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{value}</div>
      {children}
      <div className="text-[0.5625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>measured from {source}</div>
      <WhyStrip metric={metric} />
    </li>
  );
}

export default function QualityThroughput() {
  const [ci, setCi] = useState({ phase: 'loading', data: null });
  const [migrations, setMigrations] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [commands, setCommands] = useState(null);

  const load = useCallback(async () => {
    setCi((s) => ({ phase: 'loading', data: s.data }));
    const [ops, schema, harvest] = await Promise.all([
      fetchOps(),
      fetchSchemaHealth(),
      fetchLedger().catch(() => null),
    ]);
    setCi({ phase: 'ready', data: ops });
    setMigrations(schema);
    setLedger(harvest);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeOpsCommands(setCommands), []);

  const verdict = ciVerdict(ci.data ? ci.data.mainCi : null, BUILD_SHA);
  const ops = opsThroughput(commands || []);
  // Read fresh each render: the journal is device-local and cheap, and the
  // Refresh button re-renders — so a just-caught error shows without wiring.
  const errs = errorJournalSummary(readErrorJournal());
  const audit = auditTile(auditArtifact);
  const harvest = harvestTile(ledger);
  const mig = migrations && migrations.status === 'ok' ? migrationSummary(migrations.data) : null;
  const legState = { ok: 'good', repair: 'attention', regression: 'problem' }[legibilityState()] || 'idle';
  const latestPrinciples = LESSONS.principles.slice(-3).reverse();
  const latestDrs = (DR_LEDGER.items || []).slice(0, 3);

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold inline-flex items-center gap-1.5"><UiIcon name="chart" className="w-3.5 h-3.5" /> Quality &amp; Throughput — watch the ripple</div>
        <button
          type="button"
          onClick={load}
          disabled={ci.phase === 'loading'}
          className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#1A1815] hover:bg-[#FAF8F4] disabled:opacity-50 min-h-[32px]"
        >
          {ci.phase === 'loading' ? 'Reading…' : 'Refresh'}
        </button>
      </div>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        The gates, the coverage, the debt trend, the ops history — read live from their real sources, with the record that explains each number (the Decision Record, the extracted principle) linked right beside it. One change ripples many connected things; this is where you catch the one that didn&apos;t.
      </p>

      {/* ----- QUANTITATIVE — every number a measurement ----- */}
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#1A1815] font-semibold border-b border-[#1A1815] pb-1 mb-2">The numbers</div>
      <ul className="border border-[#E8E4DC] mb-4">
        <Metric
          name="Test suite"
          value={CENSUS.ok
            ? `${CENSUS.callSites.toLocaleString()} test call sites in ${CENSUS.files} files${CENSUS.eachSuites ? ` (+${CENSUS.eachSuites} parameterized suites that expand at runtime)` : ''}`
            : 'Census unavailable — showing nothing rather than guessing.'}
          status={verdict.status}
          label={verdict.green ? 'CI green' : verdict.status === 'problem' ? 'CI failing' : 'CI unknown'}
          source={`${CENSUS.source || 'app/src/__tests__'} (build-time census) · live CI on github.com/${GITHUB_SLUG}`}
          metric="tests"
        />
        <Metric
          name="Legibility (per-theme WCAG)"
          value={`${legibilitySummaryLine()} — ${legibilityScore()}% legible`}
          status={legState}
          label={legibilityState() === 'ok' ? 'All legible' : legibilityState() === 'repair' ? `${legibilityHealth.summary.trackedDebtPages} in repair` : `${legibilityHealth.summary.regressionPages} regressed`}
          source="app/src/lib/legibility-health.json (vitest-synced scan)"
          metric="legibility"
        />
        <Metric
          name="Surface audit (self-review)"
          value={`${audit.open} open finding${audit.open === 1 ? '' : 's'} across ${audit.surfaces} surfaces · ${audit.resolved} auto-resolved since last audit`}
          status={audit.status}
          label={audit.label}
          source={`app/src/lib/audit-findings.json (${audit.generatedAt ? audit.generatedAt.slice(0, 10) : 'no run yet'})`}
          metric="audit"
        />
        <Metric
          name="Migration ledger"
          value={migrations == null
            ? 'Reading the ledger…'
            : migrations.status === 'ok'
              ? `${mig.applied} applied · ${mig.failed} failed · last ${fmtWhen(migrations.data && migrations.data.last_applied_at)}`
              : migrations.status === 'unauthorized'
                ? 'Governor-gated — this account is not authorized to read the ledger.'
                : 'Ledger unavailable (RPC unreachable or signed out).'}
          status={migrations && migrations.status === 'ok' ? healthKpiStatus(migrations.data) : 'idle'}
          label={migrations && migrations.status === 'ok' ? healthKpiLabel(migrations.data) : 'No data'}
          source="schema_migrations_health() RPC over public._schema_migrations"
          metric="migrations"
        />
        <Metric
          name="Harvest coverage"
          value={harvest.ok && harvest.videos > 0
            ? `${harvest.transcribed}/${harvest.videos} videos transcribed · ${harvest.avgPct}% avg coverage · ${harvest.fully} fully mined`
            : 'Corpus not loaded (sign in with a steward account).'}
          status={harvest.status}
          label={harvest.label}
          source="video_harvests ⋈ choir_sermons ⋈ video_transcripts (live)"
          metric="harvest"
        />
        <Metric
          name="Ops commands"
          value={commands == null
            ? 'Waiting for the live feed…'
            : ops.total === 0
              ? 'No commands recorded yet.'
              : `${ops.done} done · ${ops.error} failed · ${ops.queued + ops.running} in flight · avg run ${fmtMs(ops.avgMs)}`}
          status={ops.status}
          label={ops.label}
          source="ops_commands (DR-0088, realtime)"
          metric="ops"
        />
        <Metric
          name="Runtime errors (this device)"
          value={errs.total === 0
            ? 'None recorded — every surface is boundary-contained, and any catch would land here.'
            : `${errs.total} recorded (${errs.distinct} distinct) · last: ${errs.last ? `${(errs.last.at || '').slice(0, 16).replace('T', ' ')} · ${errs.last.source} — ${errs.last.message.slice(0, 80)}` : '—'}`}
          status={errs.status}
          label={errs.label}
          source="poe-error-journal (localStorage, device-local — boundaries + window capture)"
          metric="errors"
        />
        <Metric
          name="Interconnection loops"
          value={interconnectHeadline(INTERCONNECT.summary)}
          status={INTERCONNECT.summary && INTERCONNECT.summary.broken ? 'problem' : INTERCONNECT.summary && INTERCONNECT.summary.building ? 'attention' : 'good'}
          label={INTERCONNECT.summary && INTERCONNECT.summary.broken ? `${INTERCONNECT.summary.broken} broken` : `${(INTERCONNECT.summary && INTERCONNECT.summary.liveWired) || 0} live`}
          source="interconnect manifest (file-verified at build) — detail in Quality / Proof below"
          metric="loops"
        />
      </ul>

      {/* ----- QUALITATIVE — the record that explains the numbers ----- */}
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#1A1815] font-semibold border-b border-[#1A1815] pb-1 mb-2">The why — the judgment layer</div>

      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2.5 mb-2">
        <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">
          Latest principles extracted ({LESSONS.principles.length} on record · {LESSONS.incidents.length} incidents distilled)
        </div>
        {LESSONS.ok ? (
          <ul className="space-y-1">
            {latestPrinciples.map((p) => (
              <li key={p.id} className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                <strong>{p.id}</strong> — {p.rule}
                {p.extracted && <span className="text-[#5A5751]"> ({p.extracted})</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[0.6875rem] text-[#5A5751] italic">LESSONS-LEARNED not parsed in this build — showing nothing rather than guessing.</p>
        )}
        <div className="text-[0.5625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>parsed at build from {LESSONS.source || 'docs/00-foundations/_root/LESSONS-LEARNED.md'}</div>
      </div>

      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2.5 mb-2">
        <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">
          Latest decisions ({DR_LEDGER.count} in the ledger)
        </div>
        {DR_LEDGER.ok ? (
          <ul className="space-y-1">
            {latestDrs.map((d) => (
              <li key={d.id} className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                <strong>{d.id}</strong>{d.date ? ` (${d.date})` : ''} — {(d.title || d.decision || '').slice(0, 160)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[0.6875rem] text-[#5A5751] italic">Decision ledger not parsed in this build.</p>
        )}
        <div className="text-[0.5625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>the full ledger lives in the Decisions tab (docs/decisions/)</div>
      </div>

      <p className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Concerns &amp; Solutions and family feedback carry the rest of the judgment layer — surface-audit findings auto-file there, so a number that slips here has its concern card there. A green here means evidence, not a claim.
      </p>
    </section>
  );
}
