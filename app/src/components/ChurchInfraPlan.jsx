// =============================================================================
// ChurchInfraPlan — Projects > Church > Infra Plan (staff-gated)
// =============================================================================
// The home for COLG's next project: sovereign compute rig (5x RTX 3090) + security
// cameras. Self-contained like <DeviceInventory /> — no parent props. Reads VERIFIED
// hardware from the device register (church-devices.js) and the PLAN from
// church-infra-plan.js. Planned items are flagged planned; nothing is painted.
//
// The VISION-FAIRNESS-STANDARD is rendered as a binding gate, not a footnote — a
// green "enforced" banner when every recognition milestone carries it, a RED banner
// if one ever doesn't (fairnessGateViolations). Read-only surface.
// =============================================================================
import React from 'react';
import { KpiDot } from './KpiDot.jsx';
import UiIcon from './UiIcon.jsx';
import { SEED_DEVICES } from '../lib/church-devices.js';
import {
  FAIRNESS_GATE, WORKSTREAMS, PLANNED_RIG, MILESTONES,
  statusTone, statusLabel, workstreamLabel,
  verifiedComputeNodes, milestonesByWorkstream, summarizePlan, fairnessGateViolations,
} from '../lib/church-infra-plan.js';
import {
  DOOR_PLAN_RECORDED, DOOR_DOMAIN, SITE_FACTS, MISSION_RAILS,
  DOOR_PHASES, DOOR_OPPORTUNITIES, DOOR_CONSTRAINTS,
  doorHardwareReadiness, resolveDoorPlan,
} from '../lib/church-own-door.js';

// The build-parsed Decision-Record ledger (docs/decisions/) — the door plan's DR
// refs resolve against it live, so nothing here stands on a dead ref (DR-0076).
const DR_LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : { ok: false, count: 0, items: [] };

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const serif = { fontFamily: '"Fraunces", serif' };
const chip = 'inline-flex items-center gap-1 px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]';

function StatusBadge({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">
      <KpiDot status={statusTone(status)} /> {statusLabel(status)}
    </span>
  );
}

function MilestoneRow({ m }) {
  return (
    <div className="border border-[#E8E4DC] p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-[#1A1815]" style={serif}>{m.title}</span>
        <StatusBadge status={m.status} />
      </div>
      {m.recognition && (
        <div className="mt-1.5">
          <span className={chip} title={FAIRNESS_GATE.bar}>
            <span className="text-[#B85838]" aria-hidden="true"><UiIcon name="lock" /></span>
            {FAIRNESS_GATE.label}
          </span>
        </div>
      )}
      {m.evidence && (
        <p className="mt-2 text-[0.6875rem] text-[#5A5751]"><span className={labelCls}>Evidence</span> — {m.evidence}</p>
      )}
      {m.notes && <p className="mt-1.5 text-[0.6875rem] text-[#5A5751]">{m.notes}</p>}
    </div>
  );
}

const TIER_NOTE = { A: 'Tier A', B: 'Tier B', C: 'Tier C — governor gate' };

function DoorPhaseRow({ p }) {
  return (
    <div className="border border-[#E8E4DC] p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-[#1A1815]" style={serif}>{p.title}</span>
        <StatusBadge status={p.status} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <span className={chip}>{TIER_NOTE[p.tier] || `Tier ${p.tier}`}</span>
        {p.drRefs.map((r) => <span key={r} className={chip}>{r}</span>)}
      </div>
      {p.detail && <p className="mt-2 text-[0.75rem] text-[#5A5751]">{p.detail}</p>}
      {p.gate && (
        <p className="mt-1.5 text-[0.6875rem] text-[#B85838]">
          <span className="mr-1" aria-hidden="true"><UiIcon name="lock" /></span>{p.gate}
        </p>
      )}
      {p.evidence && (
        <p className="mt-1.5 text-[0.6875rem] text-[#5A5751]"><span className={labelCls}>Evidence</span> — {p.evidence}</p>
      )}
    </div>
  );
}

// COLG's own app at thechurchofthelivinggod.com — the door plan (DR-0133).
// Facts carry provenance, opportunities carry re-review dates, Tier C phases name
// their governor gate, hardware readiness derives from the register, and every DR
// ref resolves against the live ledger.
function OwnDoorPlan() {
  const readiness = doorHardwareReadiness(SEED_DEVICES);
  const resolution = resolveDoorPlan(DR_LEDGER, DOOR_PHASES);
  const missing = resolution.filter((r) => !r.found);

  return (
    <section className="space-y-4">
      <header className={card}>
        <h3 className="text-base sm:text-lg text-[#1A1815]" style={serif}>
          The Church&rsquo;s Own Door — {DOOR_DOMAIN}
        </h3>
        <p className="mt-1 text-sm text-[#5A5751]">
          Like Moore Divahs, the church gets its own app on the one door engine — its own name on the
          member&rsquo;s home screen, its own domain, the church&rsquo;s hardware behind it. The public door and
          the domain cutover are Tier C: Bishop Gwin governs what publishes on the church&rsquo;s name.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={chip}>plan recorded {DOOR_PLAN_RECORDED}</span>
          <span className={chip}>{readiness.gpuNodes.length} GPU node(s) · {readiness.broadcast.length} broadcast device(s) · {readiness.storage.length} NAS — from the device register</span>
          {missing.length === 0
            ? <span className={chip}><KpiDot status="good" /> all {resolution.length} decision refs resolve in the ledger</span>
            : <span className={chip}><KpiDot status="problem" /> {missing.map((m) => m.drRef).join(', ')} not in the ledger</span>}
        </div>
      </header>

      <div className={card}>
        <div className={labelCls}>What is true today (each fact carries its provenance)</div>
        <div className="mt-2 space-y-2">
          {SITE_FACTS.map((f) => (
            <div key={f.id} className="border border-[#E8E4DC] p-3">
              <p className="text-[0.8125rem] text-[#1A1815]">{f.fact}</p>
              <p className="mt-1 text-[0.6875rem] text-[#5A5751]"><span className={labelCls}>Provenance</span> — {f.provenance}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <div className={labelCls}>The mission rails the door runs on (binding)</div>
        <ul className="mt-2 space-y-1.5">
          {MISSION_RAILS.map((r) => (
            <li key={r.id} className="text-[0.75rem] text-[#5A5751]">
              · {r.rail} <span className="text-[0.6875rem]">({r.source})</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={card}>
        <div className={labelCls}>The phases</div>
        <div className="mt-2 space-y-2">
          {DOOR_PHASES.map((p) => <DoorPhaseRow key={p.id} p={p} />)}
        </div>
      </div>

      <div className={card}>
        <div className={labelCls}>Opportunities (ranked; every one carries its re-review date)</div>
        <div className="mt-2 space-y-2">
          {DOOR_OPPORTUNITIES.map((o) => (
            <div key={o.id} className="border border-[#E8E4DC] p-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-[#1A1815]" style={serif}>{o.rank}. {o.title}</span>
                <span className={chip}>re-review {o.reReview}</span>
              </div>
              <p className="mt-1.5 text-[0.75rem] text-[#5A5751]">{o.detail}</p>
              <p className="mt-1 text-[0.6875rem] text-[#5A5751]"><span className={labelCls}>Pairs with</span> — {o.pairsWith}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <div className={labelCls}>Constraints (verified, carried)</div>
        <ul className="mt-2 space-y-1.5">
          {DOOR_CONSTRAINTS.map((c) => (
            <li key={c.id} className="text-[0.75rem] text-[#5A5751]">
              · {c.constraint} <span className="text-[0.6875rem]">({c.source})</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function ChurchInfraPlan() {
  const nodes = verifiedComputeNodes(SEED_DEVICES);
  const byWs = milestonesByWorkstream(MILESTONES);
  const sum = summarizePlan(MILESTONES);
  const violations = fairnessGateViolations(MILESTONES);
  const gateOk = violations.length === 0;

  return (
    <div className="space-y-5">
      <header className={card}>
        <h2 className="text-lg sm:text-xl text-[#1A1815]" style={serif}>Church Infrastructure Plan</h2>
        <p className="mt-1 text-sm text-[#5A5751]">
          COLG's next project: a sovereign compute rig and on-prem security cameras. Verified hardware is read
          from the device register; planned items are marked planned. Nothing here is painted.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={chip}>{sum.total} milestones</span>
          <span className={chip}><KpiDot status="good" /> {sum.byStatus.verified} verified</span>
          <span className={chip}><KpiDot status="attention" /> {sum.byStatus['in-progress']} in progress</span>
          <span className={chip}><KpiDot status="idle" /> {sum.byStatus.planned} planned</span>
        </div>
      </header>

      {/* The binding fairness gate — visible, enforced */}
      <div className={gateOk ? 'border border-[#1A1815] bg-[#FAF8F4] p-4 sm:p-5' : 'border-2 border-[#B85838] bg-[#FAF8F4] p-4 sm:p-5'}>
        <div className="flex items-center gap-2">
          <span className={gateOk ? 'text-[#B85838]' : 'text-[#B85838]'} aria-hidden="true"><UiIcon name="lock" /></span>
          <span className="text-sm text-[#1A1815]" style={serif}>{FAIRNESS_GATE.label}</span>
        </div>
        <p className="mt-1.5 text-[0.8125rem] text-[#5A5751]">
          Bar: <span className="text-[#1A1815]">{FAIRNESS_GATE.bar}</span>.{' '}
          {gateOk
            ? `Enforced on all ${sum.recognition} recognition milestone(s) — none can ship without passing it.`
            : `WARNING: ${violations.length} recognition milestone(s) are missing the fairness gate. This must not ship.`}
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-[#5A5751]">
          {FAIRNESS_GATE.rules.map((r) => <li key={r}>· {r}</li>)}
        </ul>
      </div>

      {/* Verified compute nodes — read from the register */}
      <section className={card}>
        <div className={labelCls}>Verified compute (from the device register)</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {nodes.map((d) => (
            <div key={d.id} className="border border-[#E8E4DC] p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-[#1A1815] truncate" style={serif}>{d.name}</span>
                <StatusBadge status={d.status} />
              </div>
              {d.makeModel && <p className="mt-1 text-[0.6875rem] text-[#5A5751]">{d.makeModel}</p>}
            </div>
          ))}
          {/* The planned rig — honestly flagged */}
          <div className="border border-dashed border-[#B85838] p-3 sm:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-[#B85838]" aria-hidden="true"><UiIcon name="sliders" /></span>
              <span className="text-sm text-[#1A1815]" style={serif}>{PLANNED_RIG.name}</span>
              <span className="text-[0.625rem] uppercase tracking-wider text-[#B85838]">planned</span>
            </div>
            <p className="mt-1.5 text-[0.75rem] text-[#1A1815]">{PLANNED_RIG.specs.gpus}</p>
            <p className="mt-1 text-[0.6875rem] text-[#5A5751]">{PLANNED_RIG.specs.purpose}</p>
            <p className="mt-1.5 text-[0.6875rem] text-[#B85838]"><span className={labelCls}>Unverified</span> — {PLANNED_RIG.specs.caveat}</p>
          </div>
        </div>
      </section>

      {/* Milestones by workstream */}
      {WORKSTREAMS.map((w) => (
        <section key={w.id} className={card}>
          <div className="flex items-center gap-2">
            <span className="text-[#B85838]" aria-hidden="true"><UiIcon name={w.icon} /></span>
            <h3 className="text-sm text-[#1A1815]" style={serif}>{workstreamLabel(w.id)}</h3>
          </div>
          <div className="mt-2 space-y-2">
            {(byWs[w.id] || []).map((m) => <MilestoneRow key={m.id} m={m} />)}
          </div>
        </section>
      ))}

      {/* COLG's own app — thechurchofthelivinggod.com (DR-0133) */}
      <OwnDoorPlan />
    </div>
  );
}
