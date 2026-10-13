// =============================================================================
// requirements-intake — requirements gathering THROUGH the app (DR-0121 item 10)
// =============================================================================
// Darrell 2026-07-07: "I should be able to do the requirements gathering
// process through the PoeTech App — download my thoughts and have it used as
// feedback to update" and "Or a user talk into the PoeTech App input to get
// the requirements for an MVP."
//
// This is the in-app half of the DR-0117 extraction contract: raw spoken/typed
// THOUGHTS in, requirement items out — in the exact shape parseDiscoveryJson
// produces, so the items ride the EXISTING rails unchanged (use-discovery
// review store → steward confirm/edit/reject → importToBoard as real
// board_tasks). One set of rails, one review gate (DR-0226 question 2:
// join what already holds the truth).
//
// HONESTY RULES (DR-0076 — the same contract the recorded lane keeps):
//   · DETERMINISTIC — plain pattern classification, no model, no network, so
//     the same words always extract the same items and the extractor is
//     provable in tests. A smarter NAS-side extractor can upgrade this later
//     behind the same contract.
//   · sourceQuote is the speaker's LITERAL sentence — every item carries the
//     exact words it came from, and the quote is never altered by review
//     (only the buildable `text` is editable downstream).
//   · Nothing is invented: a sentence the patterns can't classify goes to
//     `unclear` — surfaced honestly for the steward, never guessed into a
//     requirement and never silently dropped.
//   · status='extracted' on every item — a steward reviews before anything
//     becomes work; importToBoard refuses unreviewed items (the gate is the
//     point).
// =============================================================================

const cap = (s, n) => {
  if (typeof s !== 'string') return null;
  const t = s.trim();
  if (!t) return null;
  return t.length > n ? t.slice(0, n) : t;
};

// Split raw thoughts into candidate statements: hard breaks on newlines, then
// sentence boundaries. The pieces are the speaker's own words, verbatim.
export function splitThoughts(raw) {
  if (typeof raw !== 'string') return [];
  const out = [];
  for (const line of raw.split(/\n+/)) {
    for (const s of line.split(/(?<=[.!?])\s+/)) {
      const t = s.trim();
      if (t) out.push(t);
    }
  }
  return out;
}

// Classification — documented precedence, deterministic:
//   1. pricing  — an explicit money signal ($ amount / price / cost / fee …)
//   2. requirement — a want/need/should/add/allow… statement of intent
//   3. pain-point  — a can't / broken / confusing / slow… statement of hurt
//   4. unclear     — everything else (the steward sees it, nothing guesses)
const PRICING_RE = /\$\s?\d|\b(price|pricing|cost|costs|charge|charges|fee|fees|per\s+(month|year|user|seat)|subscription)\b/i;
const REQUIREMENT_RE = /\b(want|wants|need|needs|should|must|have to|has to|be able to|add|build|create|allow|let (me|us|users)|would like|make (it|the|a)|give (me|us|users))\b/i;
const PAIN_RE = /\b(can'?t|cannot|couldn'?t|doesn'?t|does not|isn'?t|not working|broken|bug|bugs|issue|issues|problem|problems|fail|fails|failing|slow|confusing|confused|frustrat\w*|annoy\w*|hard to|impossible|missing|lost|loses|losing)\b/i;

export function classifyThought(sentence) {
  const s = String(sentence || '');
  if (!s.trim()) return 'unclear';
  if (PRICING_RE.test(s)) return 'pricing';
  if (REQUIREMENT_RE.test(s)) return 'requirement';
  if (PAIN_RE.test(s)) return 'pain-point';
  return 'unclear';
}

// extractRequirementsFromThoughts — raw thoughts (typed or dictated) in, the
// parseDiscoveryJson-shaped extraction out. `meta` carries real provenance
// (who spoke, where from, when) — nothing here reads a clock or an identity
// itself, so the function stays pure and testable.
export function extractRequirementsFromThoughts(rawText, meta = {}) {
  const prov = {
    clientName: cap(meta.clientName, 200),
    businessName: cap(meta.businessName, 200),
    sourceRecording: cap(meta.source, 300) || 'in-app-input',
    sourceRun: null,
    extractedAt: meta.extractedAt || null,
    status: 'extracted',
  };
  const items = [];
  const unclear = [];
  for (const sentence of splitThoughts(rawText)) {
    const kind = classifyThought(sentence);
    if (kind === 'unclear') { unclear.push(cap(sentence, 500)); continue; }
    items.push({
      kind,
      area: null,                       // the steward sets the area; never guessed
      text: cap(sentence, 2000),        // the buildable text starts as their words
      amountText: null,                 // an amount is read by the steward, not parsed hopefully
      confidence: null,                 // never invented
      sourceQuote: cap(sentence, 2000), // the literal words — the receipt
      ...prov,
    });
  }
  return {
    client: { name: prov.clientName, business: prov.businessName },
    items,
    channels: [],
    unclear: unclear.filter(Boolean),
  };
}
