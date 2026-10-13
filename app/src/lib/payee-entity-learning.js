// =============================================================================
// payee-entity-learning — the app learns WHO a payment is for, from the user
// =============================================================================
// Christina (2026-07-18): "Instead of relying solely on automatic payee matching,
// add a user-assisted learning workflow. If a transaction can't be matched with
// high confidence, prompt 'Who is this payment for?' — Existing contractor /
// vendor / employee / customer, Create new, or Ignore/Personal — then store that
// mapping as a learned rule so future transactions with the same or similar
// normalized payeeKey are categorized automatically without asking again. The
// mapping becomes part of the system's knowledge, with a confidence score and an
// option to edit or remove it later."
//
// This is the knowledge layer: a map keyed by categorize.js payeeKey (already the
// stable merchant/payer key that ignores dates/account tails), each entry a
// learned party — { partyType, refId, name, confidence, count, updatedAt }. It
// complements the existing category-learning (`learned` in categorize.js): that
// says WHAT KIND of spend a payee is; this says WHO the party is (a contractor for
// 1099s, a vendor, an employee, a customer, or personal/ignore) and, when known,
// links to the real record (a contractor id or an entity slug).
//
// The system gets smarter the more the family confirms: confidence starts modest
// and climbs with each confirmation, capped below 1 (a learned rule is strong but
// never claims certainty a human never gave). A SIMILAR (token-subset) match — a
// new statement descriptor that contains a known payee's tokens — is applied at a
// reduced confidence so the UI can still confirm the first time a variant appears.
// Pure + deterministic (an injected clock for the timestamp keeps it testable);
// persisted by the caller in the synced snapshot (data.payeeEntityRules), so it
// rides existing sync — no new table. RLS-scoped by the caller (its own ledger).
// =============================================================================

import { payeeKey } from './categorize.js';

// The party a learned payee can be. 'personal' doubles as Ignore/Personal — a
// payment that is not a business party and should stop prompting.
export const PARTY_TYPES = ['contractor', 'vendor', 'employee', 'customer', 'personal'];

// Confidence a learned rule needs to auto-apply without asking again. Below this
// (or no rule at all) the "Who is this payment for?" prompt should show.
export const PARTY_AUTO_CONFIDENCE = 0.7;

const BASE_CONFIDENCE = 0.6;   // first confirmation
const STEP = 0.13;             // per additional confirmation
const CAP = 0.99;              // never a full 1 — a learned rule is not proof

function meaningfulTokens(key) {
  return String(key || '').split(' ').filter((t) => t.length >= 2);
}

// matchParty(rules, description) -> { key, rule, kind: 'exact'|'similar',
// confidence } | null. Exact = the payeeKey has a rule. Similar = a stored rule
// whose tokens are all present in this description (a variant descriptor), applied
// at a reduced confidence so a first-seen variant can still be confirmed. Pure.
export function matchParty(rules, description) {
  const key = payeeKey(description);
  if (!key) return null;
  const map = rules || {};
  if (map[key]) return { key, rule: map[key], kind: 'exact', confidence: map[key].confidence };
  const descTokens = new Set(meaningfulTokens(key));
  let best = null;
  for (const [k, r] of Object.entries(map)) {
    const ruleTokens = meaningfulTokens(k);
    if (ruleTokens.length === 0) continue;
    // A specific enough rule (>= 2 tokens, or one long token) whose tokens are a
    // subset of this description's tokens is a plausible variant of the same party.
    const specific = ruleTokens.length >= 2 || (ruleTokens.length === 1 && ruleTokens[0].length >= 6);
    if (!specific) continue;
    if (ruleTokens.every((t) => descTokens.has(t))) {
      const eff = Math.round(Math.min(r.confidence, PARTY_AUTO_CONFIDENCE) * 100) / 100;
      if (!best || eff > best.confidence) best = { key: k, rule: r, kind: 'similar', confidence: eff };
    }
  }
  return best;
}

// needsPartyPrompt(rules, description, min) -> true when there is no confident
// party for this payee (no rule, or below `min`) — the trigger for the prompt.
export function needsPartyPrompt(rules, description, min = PARTY_AUTO_CONFIDENCE) {
  const key = payeeKey(description);
  if (!key) return false; // an unkeyable/blank descriptor can't be learned or asked about
  const m = matchParty(rules, description);
  return !m || m.confidence < min;
}

// learnParty(rules, { description, partyType, refId, name }, now) -> NEW rules map
// (pure). Upserts the payee's rule: a repeat confirmation of the SAME partyType
// raises confidence (BASE, +STEP each time, capped); confirming a DIFFERENT type
// resets the count (the party was reclassified). Returns the map unchanged when
// the description can't be keyed or partyType is invalid (honest-or-absent).
export function learnParty(rules, opts = {}, now = Date.now()) {
  const { description, partyType, refId = null, name = '' } = opts;
  const key = payeeKey(description);
  if (!key || !PARTY_TYPES.includes(partyType)) return rules || {};
  const map = { ...(rules || {}) };
  const prev = map[key];
  const sameType = prev && prev.partyType === partyType;
  const count = (sameType ? prev.count : 0) + 1;
  const confidence = Math.min(CAP, BASE_CONFIDENCE + (count - 1) * STEP);
  map[key] = {
    partyType,
    refId: refId ?? (sameType ? prev.refId : null),
    name: name || (sameType && prev.name) || '',
    confidence: Math.round(confidence * 100) / 100,
    count,
    updatedAt: new Date(now).toISOString(),
  };
  return map;
}

// editParty(rules, key, patch) -> NEW rules map with the rule's editable fields
// updated (partyType / refId / name). Confidence + count are preserved (an edit is
// a correction of the label, not a new confirmation). No-op for an unknown key.
export function editParty(rules, key, patch = {}) {
  const map = { ...(rules || {}) };
  if (!map[key]) return map;
  const next = { ...map[key] };
  if (patch.partyType && PARTY_TYPES.includes(patch.partyType)) next.partyType = patch.partyType;
  if (patch.refId !== undefined) next.refId = patch.refId;
  if (patch.name !== undefined) next.name = patch.name;
  map[key] = next;
  return map;
}

// forgetParty(rules, key) -> NEW rules map without that payee's rule (the
// "remove it later" control). No-op for an unknown key.
export function forgetParty(rules, key) {
  const map = { ...(rules || {}) };
  delete map[key];
  return map;
}

// listParties(rules) -> [{ key, partyType, refId, name, confidence, count,
// updatedAt }] sorted most-confirmed first, then by name — the manage/edit view.
export function listParties(rules) {
  return Object.entries(rules || {})
    .map(([key, r]) => ({ key, ...r }))
    .sort((a, b) => (b.count - a.count) || (b.confidence - a.confidence) || String(a.name).localeCompare(String(b.name)));
}
