// =============================================================================
// operations-intelligence — Phase 1b: the readouts for PoeTech's OWN operations,
// fed by the workflows it already runs (DR-0616)
// =============================================================================
// Darrell 2026-09-24: "Make sure to also review what workflows we have already
// built and see how they can be used or tweaked to be valued" and "Build Phase
// 1b now". Reuse, not rebuild: each signal below is already produced by a
// workflow or a detector the repo runs; this module only reads them into the
// same readout shape the board uses (title, why, sources, days).
//
//   1. INCIDENT ISSUES — the health probes (site-health every 10 minutes and
//      its siblings) file rolling GitHub issues labelled `incident`, read by
//      lib/site-health.js. Open past INCIDENT_HOURS = an escalation; a rolling
//      issue observed REPEAT_OBSERVATIONS+ times = a repeated risk.
//   2. RE-REVIEW DATES — every decision record's latest `re-review:` date, read
//      at build time into __DR_LEDGER__ (lib/decision-chain.js reReviewOf).
//      Passed = a timeline threat (overdue); inside the window = due soon.
//   3. DECISIONS NOT YET MADE — a record whose status is still "proposed"
//      (or open / pending) is a decision required. MEASURED before choosing
//      this: flagging records with no "Decision" heading marked 134 of 578,
//      but those records state their decision under other headings ("The
//      Way", "What was done"); calling them undecided would be false. The
//      status is the record's own word for whether it is decided.
//   4. FAMILY DATA LOOPS — lib/loop-health.js. Only a loop with a REAL last
//      update past its limit is an escalation; "never ran" and "awaiting a
//      source" need the page's full context and are left to the Loops view.
//   5. HAND-OFFS — a hand-off still open past STALL_DAYS is an escalation.
//   6. INTAKE (DR-0622) — every note, categorized by lib/intake-outcome.js.
//      A sender's REPLY to an outcome still untouched is a decision required
//      (the automatic answer did not land; a person decides). Real work no
//      steward has moved past STALL_DAYS is one escalation, counted. System
//      fixes that failed REPEAT_OBSERVATIONS+ times are a risk. The counts per
//      category are read into `read.intake`, so the board shows the loop.
//
// PURE and deterministic; the clock is an argument. No input → ok:false with
// the reason, never a painted zero (DR-0076).
// =============================================================================
import { STALL_DAYS, daysBetween } from './decision-intelligence.js';
import { assessLoops } from './loop-health.js';
import { categorizeIntake, categoryCounts } from './intake-outcome.js';
import { receiptCode } from './feedback-receipt.js';

export const INCIDENT_HOURS = 24;
export const REPEAT_OBSERVATIONS = 3;
export const DUE_SOON_REVIEW_DAYS = 7;
const CLOSED_RECORD = ['superseded', 'rejected', 'retired', 'withdrawn'];
const UNDECIDED = ['proposed', 'open', 'pending', 'draft'];
// The status text can carry more words ("accepted (held for review)"); its
// first word is the state.
const statusWord = (s) => String(s || '').trim().toLowerCase().split(/[\s(]/)[0];
const HOUR = 3600000;

function isoDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function deriveOperations({ ledger = null, incidents = null, loopData = null, loopEnv = {}, discussions = [], feedback = null, nowMs } = {}) {
  const now = Number.isFinite(nowMs) ? nowMs : NaN;
  const today = Number.isFinite(now) ? isoDay(now) : '';
  const out = { ok: false, read: {}, risks: [], escalations: [], timelineThreats: [], decisionsRequired: [], sources: [] };

  // 1. Incident issues.
  if (Array.isArray(incidents)) {
    out.read.incidents = incidents.length;
    out.sources.push('health-probe incident issues');
    for (const i of incidents) {
      if (i.state !== 'open') continue;
      const hours = i.openedAt ? Math.floor((now - Date.parse(i.openedAt)) / HOUR) : null;
      if (hours != null && hours >= INCIDENT_HOURS) {
        out.escalations.push({ id: `incident-${i.number}`, title: i.title, kind: 'incident', days: Math.floor(hours / 24), sources: [`#${i.number}`], why: `Incident #${i.number} has been open ${hours} hours (threshold ${INCIDENT_HOURS}).` });
      }
      if ((i.observations || 0) >= REPEAT_OBSERVATIONS) {
        out.risks.push({ key: `incident-${i.number}`, title: i.title, count: i.observations, sources: [`#${i.number}`], why: `The probe has recorded this failure ${i.observations} times on one rolling issue.` });
      }
    }
  }

  // 2 + 3. The decision ledger.
  const items = ledger && ledger.ok && Array.isArray(ledger.items) ? ledger.items : null;
  if (items) {
    out.read.decisionRecords = items.length;
    out.sources.push('decision records (re-review dates, decision slots)');
    for (const r of items) {
      if (!r || !r.id || CLOSED_RECORD.includes(statusWord(r.status))) continue;
      const due = r.chain && r.chain.reReview;
      if (due && today) {
        const late = daysBetween(due, now);
        if (late != null && late > 0) {
          out.timelineThreats.push({ id: `rr-${r.id}`, title: `${r.id} ${r.title || ''}`.trim(), date: due, daysLeft: -late, sources: [r.id], why: `Its re-review date ${due} passed ${late} day(s) ago.` });
        } else if (late != null && -late <= DUE_SOON_REVIEW_DAYS) {
          out.timelineThreats.push({ id: `rr-${r.id}`, title: `${r.id} ${r.title || ''}`.trim(), date: due, daysLeft: -late, sources: [r.id], why: `Its re-review is due ${due}, in ${-late} day(s).` });
        }
      }
      if (UNDECIDED.includes(statusWord(r.status))) {
        out.decisionsRequired.push({ id: `dc-${r.id}`, title: `${r.id} ${r.title || ''}`.trim(), decision: `Status: ${r.status}.`, impact: '', sources: [r.id], why: `The record is still "${statusWord(r.status)}": the decision has not been made.` });
      }
    }
    // Soonest first; the most overdue lead.
    out.timelineThreats.sort((a, b) => a.daysLeft - b.daysLeft || (a.id < b.id ? -1 : 1));
  }

  // 4. Family data loops with a real, stale last update.
  if (loopData && typeof loopData === 'object') {
    const loops = assessLoops(loopData, now, loopEnv);
    out.read.loops = loops.length;
    out.sources.push('family data loops');
    for (const l of loops) {
      if (l.status !== 'stale') continue;
      out.escalations.push({ id: `loop-${l.key}`, title: l.label, kind: 'loop', days: l.daysSince, sources: [l.key], why: `No update for ${l.daysSince} days (its limit is ${l.staleDays}).` });
    }
  }

  // 5. Hand-offs still open.
  const handoffs = (discussions || []).filter((d) => d && d.kind === 'handoff');
  if (handoffs.length) {
    out.read.handoffs = handoffs.length;
    out.sources.push('hand-offs');
    for (const d of handoffs) {
      if (d.status && d.status !== 'open') continue;
      const age = daysBetween(d.createdAt || d.created_at, now);
      if (age != null && age >= STALL_DAYS) {
        out.escalations.push({ id: `handoff-${d.id}`, title: d.title || 'Hand-off', kind: 'handoff', days: age, sources: [d.id], why: `A hand-off open for ${age} days (threshold ${STALL_DAYS}).` });
      }
    }
  }

  // 6. Intake.
  if (Array.isArray(feedback)) {
    const cats = feedback.filter((f) => f && f.id).map((f) => ({ f, c: categorizeIntake(f, { ledger, history: feedback }) }));
    out.read.intake = categoryCounts(cats.map((x) => x.c));
    out.sources.push('intake (every note, categorized)');
    const untouched = (f) => (f.triageStatus || f.triage_status || 'new') === 'new';
    for (const { f, c } of cats) {
      if (c.basis.kind === 'reply' && untouched(f)) {
        out.decisionsRequired.push({ id: `reply-${f.id}`, title: `A reply to an outcome (${receiptCode(f.id)})`, decision: 'Read the reply and decide the next step.', impact: 'The sender pushed back on an automatic answer; replies always go to a person.', sources: [receiptCode(f.id)], why: 'A sender replied to the outcome they were given and no steward has moved it yet.' });
      }
    }
    const stale = cats.filter(({ f, c }) => c.category === 'work' && untouched(f) && (daysBetween(f.createdAt || f.submittedAt || f.submitted_at, now) ?? -1) >= STALL_DAYS);
    if (stale.length) {
      const oldest = Math.max(...stale.map(({ f }) => daysBetween(f.createdAt || f.submittedAt || f.submitted_at, now) || 0));
      out.escalations.push({ id: 'intake-stale-work', title: `${stale.length} note${stale.length === 1 ? '' : 's'} of real work untouched`, kind: 'intake', days: oldest, sources: stale.slice(0, 5).map(({ f }) => receiptCode(f.id)), why: `${stale.length} note${stale.length === 1 ? ' has' : 's have'} waited ${STALL_DAYS}+ days with no steward move (oldest ${oldest} days).` });
    }
    const failedFixes = cats.filter(({ f }) => ((f.intakeBasis || f.intake_basis || {}).kind) === 'fix-failed');
    if (failedFixes.length >= REPEAT_OBSERVATIONS) {
      out.risks.push({ key: 'intake-fix-failures', title: 'System fixes are failing', count: failedFixes.length, sources: failedFixes.slice(0, 5).map(({ f }) => receiptCode(f.id)), why: `${failedFixes.length} low-hanging notes went back to a person after the system fix failed.` });
    }
  }

  out.escalations.sort((a, b) => (b.days || 0) - (a.days || 0) || (a.id < b.id ? -1 : 1));
  out.ok = out.sources.length > 0;
  if (!out.ok) out.reason = 'no operations signal could be read';
  return out;
}
