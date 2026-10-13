// =============================================================================
// ChurchNetworkPosture - the network half of the Church Infrastructure Plan
// =============================================================================
// Projects > Church > Infra Plan is described as "Network, devices, and the
// media/AI node plan" - so the network posture belongs HERE, in the Love Corner
// project section, not buried in a tab on the device register. The register's
// Topology tab keeps the per-device detail; this is the plan-level view: what the
// network IS, where it is exposed, and what closes the most exposure first.
//
// One derivation, two surfaces. church-network-topology.js and
// church-network-security.js are pure and shared - this surface adds no facts of
// its own, so the two places can never disagree.
//
// REALITY-TRACE (P15): real data = SEED_DEVICES merged with live church_devices
// rows, whose addresses were read off a real LAN scan. Real screen = Church >
// Infra Plan, staff-gated. Addresses are not rendered here at all: the plan view
// needs the SHAPE and the RISK, and a plan surface is the wrong place to spill
// host addresses (the register's Topology tab gates them to editors).
// =============================================================================
import React, { useMemo } from 'react';
import { KpiDot } from './KpiDot.jsx';
import UiIcon from './UiIcon.jsx';
import { buildTopology } from '../lib/church-network-topology.js';
import {
  assessNetworkSecurity, severityTone, severityLabel,
} from '../lib/church-network-security.js';
import { buildRemediationPlan, WINDOWS } from '../lib/church-network-remediation.js';

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const serif = { fontFamily: '"Fraunces", serif' };
const chip = 'inline-flex items-center gap-1 px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]';

function Finding({ f }) {
  return (
    <div className="border border-[#E8E4DC] p-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-[#1A1815]" style={serif}>{f.title}</span>
        <span className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-[#5A5751] shrink-0">
          <KpiDot status={severityTone(f.severity)} /> {severityLabel(f.severity)}
        </span>
      </div>
      <p className="mt-1.5 text-[0.75rem] text-[#5A5751]">{f.why}</p>
      <p className="mt-1.5 text-[0.75rem] text-[#1A1815]"><span className={labelCls}>Evidence</span> — {f.evidence}</p>
      <p className="mt-1 text-[0.75rem] text-[#1A1815]"><span className={labelCls}>Fix</span> — {f.fix}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <span className={chip}>{f.governs}</span>
        {f.established === false && (
          <span className={chip}><span className="text-[#B85838]">needs on-LAN check</span></span>
        )}
      </div>
      {f.verify && <p className="mt-1 text-[0.6875rem] text-[#B85838]">{f.verify}</p>}
    </div>
  );
}

export default function ChurchNetworkPosture({ devices }) {
  const topology = useMemo(() => buildTopology(devices), [devices]);
  const assessment = useMemo(() => assessNetworkSecurity(devices, topology), [devices, topology]);
  const plan = useMemo(
    () => buildRemediationPlan(devices, assessment, topology),
    [devices, assessment, topology],
  );
  const s = assessment.summary;

  return (
    <section className={card}>
      <div className="flex items-center gap-2">
        <span className="text-[#B85838]" aria-hidden="true"><UiIcon name="globe" /></span>
        <h3 className="text-sm text-[#1A1815]" style={serif}>Network posture</h3>
      </div>
      <p className="mt-1.5 text-[0.8125rem] text-[#5A5751]">
        Derived from the device register: the segments the scan actually recorded, and where that shape leaves the church exposed. Nothing here is hand-drawn — correcting a device address redraws it.
      </p>

      {/* THE SHAPE */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {topology.subnets.map((sub) => (
          <span key={sub.cidr} className={chip}>
            <UiIcon name="sliders" /> {sub.cidr} · {sub.deviceCount} device(s)
          </span>
        ))}
        <span className={chip}><UiIcon name="link" /> {topology.overlay.label} · {topology.overlay.nodes.length}</span>
        {topology.dualHomed.length > 0 && (
          <span className={chip}><span className="text-[#B85838]">{topology.dualHomed.length} segment bridge(s)</span></span>
        )}
      </div>

      {/* THE HEADLINE NUMBERS */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Critical', s.critical],
          ['High', s.high],
          ['Total findings', s.total],
          ['Need on-LAN check', s.needsOnLanCheck],
        ].map(([k, v]) => (
          <div key={k}>
            <div className="text-2xl text-[#1A1815] tabular-nums" style={serif}>{v}</div>
            <div className="text-[0.6875rem] text-[#5A5751]">{k}</div>
          </div>
        ))}
      </div>

      {/* WHAT THIS IS NOT - said before the findings, never after. */}
      <div className="mt-3 border border-[#C9C2B6] bg-[#FAF8F4] p-3">
        <div className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">
          <KpiDot status="idle" /> What this assessment can and cannot say
        </div>
        <p className="mt-1.5 text-[0.75rem] text-[#5A5751]">{assessment.scope.statement}</p>
      </div>

      {/* THE CONFORMANCE GAP - why decided isolation is not enough */}
      <div className="mt-3 border border-[#E8E4DC] p-3">
        <div className={labelCls}>The gap between what was decided and what is built</div>
        <p className="mt-1.5 text-[0.75rem] text-[#5A5751]">
          DR-0050 isolated the church&rsquo;s data at the <strong>storage volume</strong> and kept the camera backbone sovereign. DR-0003 places the church at ISO-2 with the Cage as the floor. Both hold. Neither isolates the <strong>network</strong> — and on one flat segment, volume-level isolation never sees an attacker moving laterally toward the storage front door.
        </p>
      </div>

      {/* THE FINDINGS */}
      <div className="mt-3 space-y-2">
        {assessment.findings.map((f) => <Finding key={f.id} f={f} />)}
      </div>

      {/* THE PATCH PLAN - ordered so nothing that can darken the sanctuary runs
          before the reads and reversible changes that make it safe. */}
      {plan.steps.length > 0 && (
        <div className="mt-4 border border-[#1A1815] p-3">
          <div className={labelCls}>The patch plan, in the order it is safe to run</div>
          <p className="mt-1.5 text-[0.75rem] text-[#5A5751]">{plan.principle}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={chip}>{plan.summary.anytime} any time</span>
            <span className={chip}>{plan.summary.offService} outside service hours</span>
            <span className={chip}>{plan.summary.maintenance} maintenance window</span>
          </div>
          <ol className="mt-3 space-y-3">
            {plan.steps.map((st, i) => {
              const win = WINDOWS.find((w) => w.id === st.window) || { label: st.window };
              return (
                <li key={st.id} className="border border-[#E8E4DC] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-[#1A1815]" style={serif}>{i + 1}. {st.title}</span>
                    <span className={chip}>{win.label}</span>
                  </div>
                  <p className="mt-1.5 text-[0.75rem] text-[#5A5751]">{st.why}</p>
                  <ul className="mt-1.5 space-y-1">
                    {st.actions.map((a, ai) => (
                      <li key={ai} className="flex gap-2 text-[0.75rem] text-[#1A1815]">
                        <span className="text-[#B85838]" aria-hidden="true">·</span><span>{a}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[0.75rem] text-[#B85838]">
                    <span className={labelCls}>Blast radius</span> — {st.blastRadius}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-[#1A1815]">
                    <span className={labelCls}>Rollback</span> — {st.rollback}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-[#1A1815]">
                    <span className={labelCls}>Proves it worked</span> — {st.verifies}
                  </p>
                  {st.dependsOn.length > 0 && (
                    <p className="mt-1 text-[0.6875rem] text-[#5A5751]">
                      Only after: {st.dependsOn.join(', ')}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
