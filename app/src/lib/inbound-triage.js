// =============================================================================
// inbound-triage — deterministic triage-ASSIST for the Voice Ops Inbound tab
// =============================================================================
// Opportunity #1 from the 2026-07-05 Inbound evaluation (docs/reviews REV-0007):
// today every voicemail is hand-sorted and the backend Worker has NO intent
// logic, so an urgent "no heat" call looks the same as a routine one until a
// human reads it. This module pre-computes a SUGGESTION for each voicemail —
// intent, priority, a unit hint, a one-line summary, and the likely convert
// target — so the steward triages faster and the urgent ones stand out.
//
// PURE + DETERMINISTIC, NO MODEL. It ports the SAME keyword taxonomy the NAS
// tenant-text loop already uses (infra/nas-property-inbound/loop.py — whose
// comment names "the JS side's intent" as the mirror), so both inbound
// pipelines agree on one intent vocabulary. A sovereign-model summary (DR-0105)
// can layer on LATER as a richer suggestion; this deterministic pass ships
// first with zero new backend and zero automation risk.
//
// A SUGGESTION IS NEVER AN ACTION (DATA-AS-EMPOWERMENT / the NAS README's
// bright line): nothing here converts, files, or sends. It only proposes what a
// human still confirms in the app — the unit hint especially is a HINT (a
// caller ID is not a unit), surfaced with a "?" so it reads as "confirm me."
// =============================================================================

// Words that make an inbound message time-sensitive regardless of category —
// safety-forward: any of these flags the row urgent so it can't hide in the pile.
export const URGENT_KEYWORDS = Object.freeze([
  'no heat', 'no hot water', 'leak', 'flood', 'fire', 'gas', 'smell of gas', 'carbon monoxide',
]);

// Deterministic intent buckets — mirror of loop.py's _INTENT_RULES so the two
// inbound pipelines share one vocabulary. First match wins, top to bottom.
export const INTENT_RULES = Object.freeze([
  { intent: 'maintenance', keywords: ['leak', 'furnace', 'heat', 'broken', 'repair', 'clog', 'no hot water', 'hvac', 'ac ', 'outlet', 'smoke detector', 'mold', 'pest', 'roach', 'mice'] },
  { intent: 'complaint', keywords: ['smoking', 'noise', 'loud', 'roommate', 'neighbor', 'trash', 'parking', 'dog'] },
  { intent: 'rent', keywords: ['rent', 'payment', 'paid', 'late fee', 'deposit', 'money order'] },
  { intent: 'lease', keywords: ['lease', 'renew', 'move out', 'moving out', 'notice', 'vacate'] },
]);

const UNIT_RE = /\b(?:apartment|apt|unit|ste|suite|#)\.?\s*([0-9]{1,3}[a-z]?)\b/i;

// A unit HINT from free text ("...apartment 3...") -> "Apt 3", or null. A hint
// only — the row is always human-confirmed (needs_review), never auto-filed.
export function extractUnit(text) {
  const m = UNIT_RE.exec(text || '');
  return m ? `Apt ${m[1].toUpperCase()}` : null;
}

// classify(text) -> { intent, priority } — the FAITHFUL mirror of loop.py's
// classify(): urgency here is only raised when it co-occurs with a matched
// intent, exactly as the Python does, so the shared taxonomy stays testable
// against the NAS selftest. (suggestTriage() adds a safety-forward urgent pass
// on top — see below.)
export function classify(text) {
  const low = (text || '').toLowerCase();
  for (const { intent, keywords } of INTENT_RULES) {
    if (keywords.some((k) => low.includes(k))) {
      const urgent = URGENT_KEYWORDS.some((u) => low.includes(u));
      return { intent, priority: urgent ? 'urgent' : 'normal' };
    }
  }
  return { intent: 'message', priority: 'normal' };
}

// A one-line summary for the triage list: the first sentence, trimmed. Never
// fabricates — if there is no transcript it says so (audio-only voicemail).
export function summarize(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (!t) return 'Audio only — no transcript.';
  const firstSentence = t.split(/(?<=[.!?])\s/)[0] || t;
  return firstSentence.length <= 120 ? firstSentence : `${firstSentence.slice(0, 117).trim()}…`;
}

// suggestTriage({ line, transcript }) -> the full triage suggestion for one
// voicemail row. `priority` is a SAFETY-FORWARD superset of classify()'s: an
// urgent keyword anywhere raises it, even without a category match, so a bare
// "there's a gas smell" can never read as routine. Unit hints are only offered
// on the property line (a tech-line caller has no apartment).
export function suggestTriage({ line, transcript } = {}) {
  const text = transcript || '';
  const low = text.toLowerCase();
  const { intent, priority: intentPriority } = classify(text);
  const urgent = URGENT_KEYWORDS.some((u) => low.includes(u)) || intentPriority === 'urgent';
  return {
    intent,
    priority: urgent ? 'urgent' : 'normal',
    urgent,
    unitHint: line === 'poe-properties' ? extractUnit(text) : null,
    // Property line → a to-do Incident; tech line → a Practice Inquiry. This is
    // the same line-based default the tab used inline, now centralized + tested.
    suggestedConvertAs: line === 'poe-properties' ? 'incident' : 'inquiry',
    summary: summarize(text),
  };
}
