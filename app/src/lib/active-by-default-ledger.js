// =============================================================================
// active-by-default-ledger.js — the standing answer to "why is this off?"
// =============================================================================
// Darrell's binding directive (feedback-active-by-default, 2026-06-30):
//   "inactive-by-default is all through our code ... we know what we want and
//    how it works now, why keep that?"  Build ACTIVE by default; the pervasive
//   inactive / disabled / coming-soon / feature-flag-off gating was a hedge
//   from uncertain days and should go.
//
// This file is the audit made permanent. The 2026-06-30 active-by-default sweep
// walked every inactive-by-default gate in the repo and resolved EACH to one of
// four buckets — never left in limbo:
//
//   1 ACTIVE      — works + data present, so it ships ON (active by default).
//   2 AUTONOMOUS  — timer/scheduled/self-firing automation. Stays OFF until
//                   Darrell arms it, behind the Cage's three brakes (budget +
//                   concurrency lock + kill-switch). NAMED, never lazy.
//                   (CLAUDE.md "Autonomous Automation Requires Three Brakes";
//                    feedback-no-autonomous-automation-without-brakes.)
//   3 SAFETY      — a real gate: RLS / no-leak / PHI / unmet external-config
//                   precondition. Stays, NAMED on the gate.
//   4 BROKEN      — inactive only because it is HALF-BUILT. We do NOT flip it
//                   on (that would fail users). It goes on the FIX LIST, is
//                   surfaced honestly (placeholder / "coming"), and is activated
//                   only once it actually works. Hiding broken behind "inactive"
//                   is worse than showing it.
//
// WHY THIS IS CODE, NOT A DOC (DR-0076, Verification Doctrine): a doc drifts
// silently. validateLedger() below runs in CI (vitest) and HARD-FAILS the build
// if a bucket-1 entry is left inactive, if an autonomous gate loses its brake
// naming, or if a broken entry is flipped on. That is the regression guard: the
// sweep cannot quietly un-happen, and a new hedge cannot be smuggled in without
// declaring which bucket it is and why.
//
// Grounding (Reality-Trace): every `surfaceId` here is cross-checked against the
// real surface-mount registry (surfaces.js) by the test, so a renamed/removed
// surface trips the guard instead of leaving a painted entry behind.

// Allowed buckets. The string form is what entries carry; the number is the
// bucket id from the sweep.
export const BUCKET = Object.freeze({
  ACTIVE: 1,
  AUTONOMOUS: 2,
  SAFETY: 3,
  BROKEN: 4,
});

// Keywords that prove an autonomous (bucket-2) gate actually NAMES a brake,
// rather than being a vague "disabled". At least one must appear in the reason.
const BRAKE_WORDS = ['brake', 'budget', 'ceiling', 'concurrency', 'lock', 'kill-switch', 'killswitch', 'kill switch', 'arm', 'inert', 'cage', 'dead-man', 'deadman'];

// The ledger. One entry per inactive-by-default gate the sweep resolved.
//   id        : stable slug
//   label     : human name of the surface / automation
//   ref       : where the gate lives (file or file:line, or a DR id)
//   surfaceId : (optional) the surfaces.js registry id, when this is a mounted
//               surface — cross-checked by the test so the entry can't go stale
//   bucket    : BUCKET.* (1..4)
//   gate      : the actual condition/flag that holds it off (verbatim-ish)
//   active    : is it ON by default? (bucket 1 MUST be true; 2 & 4 MUST be false)
//   reason    : WHY — named, not lazy. Bucket 2 must name a brake.
export const LEDGER = [
  // ── Bucket 2 — AUTONOMOUS automation. Correct posture is OFF + armed by
  //    Darrell. Each names its brakes. These are NOT to be activated by a sweep.
  {
    id: 'cap-resume', label: 'Cap-resume (bounded auto-resume after a vendor outage)',
    ref: 'scripts/cap-resume.mjs', bucket: BUCKET.AUTONOMOUS, active: false,
    gate: 'SHIPS INERT — needs --run AND every brake GO',
    reason: 'Three brakes: budget (BUDGET_PER_TASK_USD / BUDGET_DAILY_USD + RESUME_MAX caps), concurrency lock (state/resume.lock single-flight), kill-switch (state/KILL_SWITCH), plus the RESUME_ARMED consent flag only Darrell sets. Resumes only already-approved work.',
  },
  {
    id: 'gpu-scheduler', label: 'Idle-GPU opportunistic job scheduler',
    ref: 'app/src/lib/gpu-scheduler.js', bucket: BUCKET.AUTONOMOUS, active: false,
    gate: 'makeInertState(): killSwitch=true, armed=false, gpuSchedArmed=false, budgets=0',
    reason: 'The Cage on a clock: kill-switch engaged, master + dedicated arm absent, budget ceilings 0. Dispatch is stubbed even when fully armed. Routes heavy compute only when a node is idle AND every brake is GO.',
  },
  {
    id: 'wake-router', label: 'Wake/resume vendor-summon router',
    ref: 'scripts/wake-router.mjs', bucket: BUCKET.AUTONOMOUS, active: false,
    gate: 'SHIPS PLAN-ONLY — needs --summon AND every brake GO + WAKE_SUMMON',
    reason: 'Budget brake (BUDGET_PER_TASK_USD + BUDGET_DAILY_USD), kill-switch, and the WAKE_SUMMON consent flag. Plan-only by default: it logs what it WOULD summon and calls no vendor.',
  },
  {
    id: 'wake-orchestrator', label: 'Wake orchestrator (in-app Cage surface)',
    ref: 'app/src/components/WakeOrchestrator.jsx', bucket: BUCKET.AUTONOMOUS, active: false,
    gate: 'Ships INERT: default state is kill-switch engaged',
    reason: 'Kill-switch engaged by default; arming is a deliberate, confirmed Tier C act by Darrell, never active-and-unattended (2026-06-06 runaway lesson, P10/P11/P12).',
  },
  {
    id: 'cadence-default', label: 'TLC client-acquisition continuous cadence',
    ref: 'app/src/lib/client-acquisition.js:573', bucket: BUCKET.AUTONOMOUS, active: false,
    gate: 'CADENCE_DEFAULT { enabled:false, armed:false, budget.capUsd:0 }',
    reason: 'evaluateCadenceGate is default-DENY: needs enabled AND armed AND a budget ceiling AND the live Cage brakes (kill-switch clear, armed, concurrency lock free). On-demand only until Darrell arms it.',
  },
  {
    id: 'daily-review', label: 'Daily deterministic health-scan workflow',
    ref: '.github/workflows/daily-review.yml', bucket: BUCKET.AUTONOMOUS, active: false,
    gate: 'schedule: cron left COMMENTED OUT; only workflow_dispatch enabled',
    reason: 'Timer-class automation: budget (deterministic, $0, no LLM), concurrency group (never stacks), kill-switch (report-only — changes nothing — and removing the schedule). Darrell uncomments it "with someone watching" (DR-0058).',
  },
  {
    id: 'orchestrator-portable', label: 'NAS-side portable supervisor container',
    ref: 'infra/ai-orchestrator/portable/', bucket: BUCKET.AUTONOMOUS, active: false,
    gate: 'Ships fully inert: kill-switch engaged, no ARM flag, budgets unset',
    reason: 'All three brakes wired (budget unset, single-instance lockdir, kill-switch present) plus the ARM flag absent by default. arm.sh / wake-arm.sh / resume-arm.sh are the deliberate consent steps.',
  },
  {
    id: 'nas-loops', label: 'NAS deterministic loop runner (no-LLM fallback)',
    ref: 'scripts/lib/nas-loops.mjs', bucket: BUCKET.AUTONOMOUS, active: false,
    gate: 'decideRun() default-deny; loop.enabled + armed-clear required',
    reason: 'Deterministic DSM loops for when the vendor AI is offline. INERT: a run needs the loop enabled AND the Cage armed-clear (kill-switch, arm, budget) — same three brakes, no model in the loop.',
  },
  {
    id: 'verified-ledger-sync', label: 'Verified-ledger sync (NAS → durable in-app ledger)',
    ref: 'app/src/lib/verified-ledger-sync.js', bucket: BUCKET.AUTONOMOUS, active: false,
    gate: 'no-op unless VITE_VERIFIED_LEDGER_URL is set (off-until-armed)',
    reason: 'MONEY-LOOP territory (DR-0083, lane local_65b19c9f) — NOT touched by this sweep. Off-until-armed is its own three-brakes posture: with no url the effect never fires. Owned by the money loop.',
  },

  // ── Bucket 3 — SAFETY gates. Real no-leak / PHI / external-config gates.
  //    Correct posture is gated; each is NAMED on the gate. Not hedges.
  {
    id: 'study', label: 'Study (private circle)', surfaceId: 'study',
    ref: 'app/src/surfaces.js:49', bucket: BUCKET.SAFETY, active: false,
    gate: 'isStudyCircle (conditional spread — absent from DOM otherwise)',
    reason: "Darrell's private study circle (Darrell/Christina/BG). No-leak: the nav entry is absent from the DOM entirely for everyone else, not merely hidden.",
  },
  {
    id: 'family-governor-surfaces', label: 'Center · CRM · Relationships · Inventory · Forecast · Access',
    ref: 'app/src/surfaces.js:50-55', bucket: BUCKET.SAFETY, active: false,
    gate: 'isFamilyMember (conditional spread — absent from DOM otherwise)',
    reason: 'Steward/Governor tooling over the family\'s real money + real members (Forecast models real cash; Relationships SETS access). No-leak conditional spread keeps the entries out of the DOM for everyone else.',
  },
  {
    id: 'church-staff-surfaces', label: 'Video Wall · Devices · Harvest Ledger · Observation',
    ref: 'app/src/surfaces.js:68-71', bucket: BUCKET.SAFETY, active: false,
    gate: 'isChurchStaff (spread + locked fallback on deep-link)',
    reason: 'Church financial + infrastructure data. Hidden for non-staff and carries a locked fallback for any deep-link. RLS-grade no-leak.',
  },
  {
    id: 'books-imported', label: 'Books → Imported (real bank transactions)',
    ref: 'app/src/poe-financial-mvp-v28.jsx (isImportedAllowed ~1044)', bucket: BUCKET.SAFETY, active: false,
    gate: '!isAnyDemoMode && currentProfile && (!isPublicHost || family email)',
    reason: 'Most-sensitive PII. Only the signed-in family on their own device (not demo / picker / profileless public host) sees imported transactions or calls the wf18 PII webhook.',
  },
  {
    id: 'legal-messaging', label: 'Legal ↔ practice messaging',
    ref: 'app/src/components/Legal.jsx', bucket: BUCKET.SAFETY, active: false,
    gate: 'messaging DISABLED by default for therapy-practice templates',
    reason: 'Prevents accidental PHI exchange; Acuity stays the PHI system of record. A deliberate privacy default, not a hedge.',
  },
  {
    id: 'external-config-integrations', label: 'Voice (sovereign studio / recorded vendor gap) · Review feed · YouTube · Synology chat · n8n ingest · CF Pages · Bookstore checkout',
    ref: 'voice-service.js / ReviewFeed.jsx / choir-sync.js / synology-chat.js / poe-financial-mvp-v28.jsx / concerns.js / Bookstore.jsx',
    bucket: BUCKET.SAFETY, active: false,
    gate: 'VITE_VOICE_SERVICE_URL (sovereign, outranks) · VITE_VOICE_BRIDGE (vendor, recorded gap) · VITE_REVIEW_TOKEN · VITE_YOUTUBE_API_KEY · VITE_SYNOLOGY_CHAT_BOT_URL · VITE_N8N_WEBHOOK_BASE · CF_PAGES_ENABLED · CHECKOUT_CONFIG.enabled',
    reason: 'Each needs a resource only Darrell can provide (the studio URL on the 4070, an API key, a NAS/Funnel URL, a payment processor, DNS cutover). They degrade gracefully to a status message; there is nothing to "turn on" until the resource exists. Voice is SOVEREIGN-FIRST per DR-0137: the local studio always outranks the vendor bridge, and any vendor use is a recorded sovereignty gap (lib/sovereignty-gaps.js) carrying its build/purchase path home.',
  },

  // ── Bucket 4 — BROKEN / half-built. On the FIX LIST. Honestly surfaced as
  //    placeholder/"coming"; activated ONLY once it actually works.
  {
    id: 'legal-full', label: 'Legal module — full encrypted matter management',
    ref: 'app/src/components/Legal.jsx (LegalPlaceholder "Coming next")', bucket: BUCKET.BROKEN, active: false,
    gate: 'document SHELVES ship (DR-0329); matter management + at-rest encryption remain unbuilt',
    reason: 'PARTIALLY CLOSED 2026-09-06 (DR-0329): the four category boxes were hardcoded <ul> lists and are now real document shelves — upload or pointer, mandatory privileged Y/N, private bucket + creator-only RLS (migration 0168), signed-URL reads. STILL ON THE FIX LIST: matter CRUD across the four scopes, the privileged journal, key-date Calendar mirroring, the privileged-stripped export, and AES-GCM-256 at rest. The encryption layer is not merely unbuilt but currently unbuildable as specified: LEGAL-PRIVACY-BOUNDARY derives its key from the Legal PIN, and lib/pin.js keeps the PIN out of the browser entirely, so there is no client-side key material. That needs its own key-architecture decision. The surface states this in words rather than implying encryption it lacks. re-review: 2026-10-15.',
  },
  // (removed 2026-07-12) 'pulpit-sermons' entry retired: it described the Pulpit
  // sermon archive as a "Sermons coming soon" placeholder at a monolith line that
  // no longer exists (:8017 in a 5307-line file; the quoted string is nowhere in
  // the tree). The archive SHIPPED — Pulpit.jsx ("The Word — Migdal") renders the
  // live, RPC-backed (theword_public_sermons, 0029) chronological library with
  // per-message points + search. The remaining caption-ENRICHMENT gap (Harvest %)
  // is tracked by the harvest pipeline (Harvest Ledger), not as a broken Pulpit.
  // The entry carried no surfaceId, so validateLedger's cross-check never caught
  // the drift — the cause of DR-0076 "honest ledger, dishonestly stale."
];

// ── Validation — the regression guard (runs in CI via vitest) ────────────────

// validateLedger — returns an array of human-readable problems. Empty array ⇒
// the ledger holds the active-by-default invariants. This is what fails the
// build, so the sweep can't silently un-happen and no undeclared hedge can land.
export function validateLedger(ledger = LEDGER) {
  const problems = [];
  const seen = new Set();
  const buckets = new Set([BUCKET.ACTIVE, BUCKET.AUTONOMOUS, BUCKET.SAFETY, BUCKET.BROKEN]);

  for (const e of ledger) {
    const id = e && e.id ? e.id : '(no id)';
    if (!e || typeof e.id !== 'string' || !e.id.trim()) { problems.push(`${id}: missing id`); continue; }
    if (seen.has(e.id)) problems.push(`${e.id}: duplicate id`);
    seen.add(e.id);

    if (!buckets.has(e.bucket)) problems.push(`${e.id}: invalid bucket ${JSON.stringify(e.bucket)}`);
    if (typeof e.active !== 'boolean') problems.push(`${e.id}: active must be boolean`);
    if (typeof e.ref !== 'string' || !e.ref.trim()) problems.push(`${e.id}: missing ref (where the gate lives)`);

    // "Named, not lazy": a real reason, not a shrug.
    if (typeof e.reason !== 'string' || e.reason.trim().length < 20) {
      problems.push(`${e.id}: reason must be named (>= 20 chars), not lazy`);
    }
    // Buckets 2 & 3 must point at the actual gate condition.
    if ((e.bucket === BUCKET.AUTONOMOUS || e.bucket === BUCKET.SAFETY) && (typeof e.gate !== 'string' || !e.gate.trim())) {
      problems.push(`${e.id}: bucket ${e.bucket} must name its gate condition`);
    }

    // The active-by-default invariants:
    // 1) works + data ⇒ MUST be active.
    if (e.bucket === BUCKET.ACTIVE && e.active !== true) {
      problems.push(`${e.id}: bucket-1 (works+data) must be active by default — activate it or reclassify`);
    }
    // 2) autonomous automation ⇒ MUST be off AND must NAME a brake (the Cage).
    if (e.bucket === BUCKET.AUTONOMOUS) {
      if (e.active !== false) problems.push(`${e.id}: autonomous automation must NOT be active by default (the Cage)`);
      const r = (e.reason || '').toLowerCase();
      if (!BRAKE_WORDS.some((w) => r.includes(w))) {
        problems.push(`${e.id}: autonomous gate must name a brake (budget / concurrency lock / kill-switch / arm)`);
      }
    }
    // 4) broken ⇒ MUST stay off (never flip a half-built surface on).
    if (e.bucket === BUCKET.BROKEN && e.active !== false) {
      problems.push(`${e.id}: broken/half-built surfaces must stay inactive until fixed — do not flip on`);
    }
  }
  return problems;
}

// byBucket — entries in a given bucket.
export function byBucket(bucket, ledger = LEDGER) {
  return ledger.filter((e) => e.bucket === bucket);
}

// fixList — the bucket-4 work: surfaces inactive only because they are
// half-built, each to be made to work THEN activated.
export function fixList(ledger = LEDGER) {
  return byBucket(BUCKET.BROKEN, ledger).map((e) => ({ id: e.id, label: e.label, ref: e.ref, reason: e.reason }));
}

// counts — a real tally for any in-app readout (no hand-typed numbers).
export function counts(ledger = LEDGER) {
  return {
    active: byBucket(BUCKET.ACTIVE, ledger).length,
    autonomous: byBucket(BUCKET.AUTONOMOUS, ledger).length,
    safety: byBucket(BUCKET.SAFETY, ledger).length,
    broken: byBucket(BUCKET.BROKEN, ledger).length,
    total: ledger.length,
  };
}
