// =============================================================================
// guardian-child.js — the guardian <-> child workflows (pure logic)
// =============================================================================
// "How can I allow my child to do X or Y — can they or not?" This is the answer
// in motion: the guardian CONFIGURES a child's capabilities (within the safety
// envelope the model locks), and anything the child tries that is approval-gated
// becomes a REQUEST the guardian approves or denies. Two workflows:
//
//   1. CONFIGURE — the guardian sets each capability to allow / approval / deny.
//      Changing access is a deliberate human action (validated here, persisted by
//      the surface, RLS-gated to guardians in migration 0055). Never automatic.
//
//   2. APPROVAL GATE — when a child invokes an `approval`-gated capability, the
//      system records a request; the guardian approves (the action proceeds) or
//      denies (it does not). A child can never self-approve.
//
// CHILD-SAFETY FIRST: the configuration is always clamped to the model's
// `maxGrant`, so a guardian cannot grant an unsafe capability even by mistake.
// `decideChildAction()` is the single gate the rest of the app calls before
// letting a child do anything sensitive — it returns allow / deny / needs-approval.
//
// PURE: no I/O, no React, no Supabase. Clock is injected.
// =============================================================================

import {
  SETTING,
  CHILD_CAPABILITIES,
  CHILD_CAPABILITY_POLICY,
  CAPABILITIES,
  resolveChildCapability,
  effectiveChildPolicy,
  isChildCapabilityLocked,
  clampSetting,
} from './relationships.js';

// ---------------------------------------------------------------------------
// CONFIGURE. Validate + normalize a guardian's desired capability map into a safe
// config ready to persist. Unknown capabilities are dropped; every value is
// clamped to its safety ceiling; locked capabilities are forced to their default.
// Returns { config, changes, rejected } so the UI can show what was clamped.
// ---------------------------------------------------------------------------
export function normalizeChildConfig(desired = {}) {
  const config = {};
  const changes = [];
  const rejected = [];
  for (const cap of CHILD_CAPABILITIES) {
    const policy = CHILD_CAPABILITY_POLICY[cap];
    const hasChoice = Object.prototype.hasOwnProperty.call(desired, cap);
    const choice = hasChoice ? desired[cap] : policy.default;
    const safe = clampSetting(choice, policy.maxGrant);
    if (hasChoice && safe !== choice) {
      rejected.push({ capability: cap, asked: choice, clampedTo: safe, reason: 'exceeds the child-safety ceiling' });
    }
    if (safe !== policy.default) {
      // Only store deviations from the safe default — keeps the row small and the
      // child-safe baseline the implicit truth.
      config[cap] = safe;
      changes.push({ capability: cap, setting: safe });
    }
  }
  return { config, changes, rejected };
}

// A guardian sets a single capability. Returns the new config + the effective
// value (post-clamp). Locked capabilities reject the change.
export function setChildCapability(config = {}, cap, setting) {
  if (!CHILD_CAPABILITY_POLICY[cap]) throw new Error(`unknown child capability "${cap}"`);
  if (isChildCapabilityLocked(cap)) {
    return { config, effective: CHILD_CAPABILITY_POLICY[cap].default, locked: true };
  }
  const safe = clampSetting(setting, CHILD_CAPABILITY_POLICY[cap].maxGrant);
  const next = { ...config };
  if (safe === CHILD_CAPABILITY_POLICY[cap].default) delete next[cap];
  else next[cap] = safe;
  return { config: next, effective: safe, locked: false };
}

// ---------------------------------------------------------------------------
// THE GATE. The one function the app calls before a child does anything. Given
// the child's config + the capability they're invoking, returns the verdict.
// ---------------------------------------------------------------------------
export function decideChildAction(capability, config = {}) {
  const meta = CAPABILITIES[capability] || null;
  if (!CHILD_CAPABILITY_POLICY[capability]) {
    return { verdict: 'deny', requiresApproval: false, reason: 'not a child-eligible action', meta };
  }
  const setting = resolveChildCapability(capability, config);
  if (setting === SETTING.ALLOW) return { verdict: 'allow', requiresApproval: false, reason: 'guardian-allowed', meta };
  if (setting === SETTING.APPROVAL) return { verdict: 'needs-approval', requiresApproval: true, reason: 'guardian-approval required', meta };
  return { verdict: 'deny', requiresApproval: false, reason: 'guardian has not allowed this', meta };
}

// ---------------------------------------------------------------------------
// APPROVAL QUEUE. A child invoking an approval-gated capability creates a request.
// ---------------------------------------------------------------------------
export const APPROVAL_STATUS = Object.freeze(['pending', 'approved', 'denied', 'expired', 'cancelled']);

const cleanText = (s, cap = 1000) => String(s ?? '').trim().slice(0, cap);

// Build a request row. Throws if the capability is NOT approval-gated for this
// child (an `allow` action needs no request; a `deny` action cannot be requested
// into existence — that would be a child routing around the lock).
export function buildApprovalRequest(form = {}, config = {}, clock) {
  const cap = form.capability;
  const d = decideChildAction(cap, config);
  if (d.verdict === 'allow') throw new Error(`"${cap}" is already allowed — no approval needed`);
  if (d.verdict === 'deny') throw new Error(`"${cap}" is not available to this child and cannot be requested`);
  return {
    child_user_id: form.childUserId || null,
    child_persona: cleanText(form.childPersona, 40),
    capability: cap,
    context: cleanText(form.context, 1000), // what the child is trying to do
    status: 'pending',
    requested_at: clock || null,
  };
}

// A guardian resolves a request. `decision` is 'approved' | 'denied'. Returns the
// patch to persist. A child can never call this (RLS gates it to guardians).
export function resolveApprovalRequest(request = {}, decision, clock, note = '') {
  if (request.status !== 'pending') throw new Error(`request is already ${request.status}`);
  if (decision !== 'approved' && decision !== 'denied') throw new Error('decision must be approved or denied');
  return {
    status: decision,
    resolved_at: clock || null,
    guardian_note: cleanText(note, 500),
  };
}

// ---------------------------------------------------------------------------
// SUMMARY for the surface + help: what a child can do, with approval, and never.
// ---------------------------------------------------------------------------
export function childAccessSummary(config = {}) {
  const eff = effectiveChildPolicy(config);
  const can = [];
  const withApproval = [];
  const never = [];
  for (const cap of CHILD_CAPABILITIES) {
    const e = eff[cap];
    const label = e.meta?.label || cap;
    if (e.setting === SETTING.ALLOW) can.push({ capability: cap, label });
    else if (e.setting === SETTING.APPROVAL) withApproval.push({ capability: cap, label });
    else never.push({ capability: cap, label, locked: e.locked });
  }
  return { can, withApproval, never };
}
