// =============================================================================
// family-messaging.js — in-app family messaging rules (pure logic)
// =============================================================================
// Guardian <-> child (and member <-> member) messaging that stays INSIDE the
// family instance: no phone number, no email, no SMS, no external channel. This
// module is the pure, testable decision + compose layer; family-messaging-sync.js
// does the Supabase I/O and migration 0057 enforces the same shape in RLS (a
// client that ignores this still cannot leak — sibling privacy is on
// recipient_user_id; guardians have oversight; no other instance/anon can read).
//
// CHILD-SAFETY (rides relationships.js, DR-0076 structural): a child's ability to
// message is the `message.family` capability (default APPROVAL, a guardian may
// raise to ALLOW). On TOP of that, the MINOR TIER clamps it:
//   * under13 (COPPA-grade): may always message a GUARDIAN freely (asking a parent
//     is never gated), but messaging a NON-guardian (e.g. a sibling) is
//     guardian-APPROVAL-gated even if the capability is set to allow — the tier
//     floor a guardian configures within, not around.
//   * teen (13-17): messaging within the family is allowed (more autonomy).
//   * adult: no minor restriction.
// Outbound-OUTSIDE-the-family is not this module's job and has no channel here.
//
// PURE: no I/O, no React, no Supabase. Clock/ids injected by the caller.
// =============================================================================

import {
  RELATIONSHIP_TYPES, SETTING, decide,
} from './relationships.js';

export const MINOR_TIERS = Object.freeze(['under13', 'teen', 'adult']);
export const isMinorTier = (t) => t === 'under13' || t === 'teen';

const cleanText = (s, cap) => String(s ?? '').replace(/\s+$/g, '').trim().slice(0, cap);

// ---------------------------------------------------------------------------
// THE GATE. Decide whether a sender may send a family message to a recipient.
// Returns { allowed, requiresApproval, reason }. The app sets the resulting
// `requires_guardian_ok` flag on the row when requiresApproval is true.
//   senderRole         — 'governor' | 'member' | 'child' (family relationship)
//   senderTier         — 'under13' | 'teen' | 'adult' (the sender's minor tier)
//   recipientIsGuardian— true if the recipient is a guardian (owner/admin)
//   childConfig        — the guardian's configured child capability map
// ---------------------------------------------------------------------------
export function decideFamilySend({
  senderRole = 'member',
  senderTier = 'adult',
  recipientIsGuardian = false,
  childConfig = {},
} = {}) {
  // Non-child family roles: messaging within the family is granted.
  if (senderRole !== 'child') {
    return { allowed: true, requiresApproval: false, reason: 'family member may message within the family' };
  }

  // Child sender: start from the configurable `message.family` capability.
  const base = decide({
    relationship: RELATIONSHIP_TYPES.FAMILY,
    role: 'child',
    capability: 'message.family',
    childConfig,
  });
  if (base.setting === SETTING.DENY) {
    return { allowed: false, requiresApproval: false, reason: 'guardian has not allowed this child to message' };
  }

  // Messaging a GUARDIAN is never tier-gated — a child can always reach a parent.
  if (recipientIsGuardian) {
    return {
      allowed: base.setting === SETTING.ALLOW,
      requiresApproval: base.setting === SETTING.APPROVAL,
      reason: base.setting === SETTING.ALLOW ? 'guardian-allowed' : 'guardian-approval required',
    };
  }

  // Messaging a NON-guardian (e.g. a sibling): the minor tier clamps it.
  //   under13 -> approval even if the capability is "allow" (the floor).
  //   teen    -> follows the capability setting.
  if (senderTier === 'under13') {
    return { allowed: false, requiresApproval: true, reason: 'under-13: messaging non-guardians needs guardian approval' };
  }
  return {
    allowed: base.setting === SETTING.ALLOW,
    requiresApproval: base.setting === SETTING.APPROVAL,
    reason: base.setting === SETTING.ALLOW ? 'guardian-allowed' : 'guardian-approval required',
  };
}

// ---------------------------------------------------------------------------
// COMPOSE. Validate + normalize a message into a row ready for insert. Throws on
// an empty body, a missing recipient, or an over-long body (matches the DB CHECK).
// `instance_id` is added by the sync layer (from the session), never trusted here.
// ---------------------------------------------------------------------------
export function composeFamilyMessage({
  senderUserId = null,
  senderPersona = null,
  recipientUserId = null,
  recipientPersona = null,
  body,
  kind = 'message',
  context = null,
  requiresGuardianOk = false,
  clock = null,
} = {}) {
  const text = cleanText(body, 4000);
  if (!text) throw new Error('message body is empty');
  if (!recipientUserId && !recipientPersona) throw new Error('a recipient (account or persona) is required');
  if (!['message', 'invite', 'note'].includes(kind)) throw new Error(`invalid kind "${kind}"`);
  return {
    sender_user_id: senderUserId,
    sender_persona: senderPersona ? cleanText(senderPersona, 40) : null,
    recipient_user_id: recipientUserId,
    recipient_persona: recipientPersona ? cleanText(recipientPersona, 40) : null,
    body: text,
    kind,
    context: context ? cleanText(context, 80) : null,
    requires_guardian_ok: !!requiresGuardianOk,
    sent_at: clock || null,
  };
}

// ---------------------------------------------------------------------------
// Convenience: the Generations-game invite the round-trip test sends. Pure — the
// caller fills sender/recipient ids; the body is a warm, age-appropriate nudge.
// ---------------------------------------------------------------------------
export function buildGenerationsInvite({ senderUserId, senderPersona, recipientUserId, recipientPersona, fromName = 'Dad', toName = '' } = {}) {
  const hi = toName ? `Hi ${toName}! ` : 'Hi! ';
  return composeFamilyMessage({
    senderUserId,
    senderPersona,
    recipientUserId,
    recipientPersona,
    body: `${hi}${fromName} here — come check out the Generations game with us. Tap to open it and let's play together.`,
    kind: 'invite',
    context: 'generations-game',
  });
}

// ---------------------------------------------------------------------------
// Thread helpers (pure). Partition + order a flat message list for a 1:1 view.
// ---------------------------------------------------------------------------
export function threadBetween(messages = [], aUserId, bUserId) {
  return (messages || [])
    .filter((m) => {
      const pair = new Set([m.sender_user_id, m.recipient_user_id]);
      return pair.has(aUserId) && pair.has(bUserId);
    })
    .sort((x, y) => String(x.sent_at || '').localeCompare(String(y.sent_at || '')));
}

export function unreadFor(messages = [], userId) {
  return (messages || []).filter((m) => m.recipient_user_id === userId && !m.read_at).length;
}
