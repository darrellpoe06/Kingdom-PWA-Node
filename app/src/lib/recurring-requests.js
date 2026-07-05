// =============================================================================
// recurring-requests — the living "already-requested / already-said" tally
// =============================================================================
// Darrell 2026-07-05: "The already requested list and what Darrell already said
// and how many times and ways report needs to always be updated and used to
// upgrade what Tier A can do because they already know."
//
// WHAT IT DOES. Groups feature-request feedback by a normalized signature so a
// thing asked five different ways is ONE row with count=5 (how many times) and
// ways=distinct phrasings (how many ways) + distinct submitters. Cross-references
// the DECIDED record (the DR ledger titles / decided directives) so a request
// Darrell has ALREADY answered is flagged `alreadyDecided`. A request that has
// been said enough times AND is already decided is `known` — the input that
// "upgrades what Tier A can do" (a well-worn, already-answered ask is low-risk /
// pre-understood, so the delivery lane can treat its implementation as trusted).
//
// This module PRODUCES the report + the `known` flag. It does NOT itself widen
// the tier gate — promoting a known pattern into scripts/release-tier-gate.mjs's
// Tier A allowlist stays a deliberate, reviewed edit (that file is Tier C). The
// report is the evidence that justifies such an edit ("they already know").
//
// Pure, deterministic, node-testable (DR-0076). No I/O, no LLM.
// =============================================================================

// The human-readable body of a feedback item (mirrors feedback-triage.feedbackText).
function bodyOf(item = {}) {
  if (item.text) return String(item.text);
  if (item.feedback_text) return String(item.feedback_text);
  const parts = [];
  if (item.whatsWorking) parts.push(item.whatsWorking);
  if (item.whatsNot) parts.push(item.whatsNot);
  if (item.whatsMissing) parts.push(item.whatsMissing);
  return parts.join(' · ');
}

// A small stopword set so the signature keys on the MEANING words, not filler —
// "can you add dark mode" and "please add a dark mode" collapse to the same key.
const STOP = new Set([
  'a','an','the','to','of','for','and','or','but','is','are','be','can','could','would','will','please',
  'i','id','we','you','it','this','that','my','me','add','make','build','want','wish','need','should',
  'like','more','some','any','with','on','in','at','so','if','when','as','get','got','have','has','do','does',
]);

// normalizeSignature(text) → a stable key of the significant words, sorted+unique.
// Deterministic; empty when there's nothing meaningful.
export function normalizeSignature(text) {
  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length > 2 && !STOP.has(w));
  return [...new Set(words)].sort().join(' ');
}

// Is this item a request/ask (vs praise/bug/question)? Uses the item's own
// category/sentiment when present, else a light keyword check — kept aligned
// with feedback-triage's feature-request rule without importing it.
export function isRequest(item = {}) {
  const cat = String(item.category || item.sentiment || '').toLowerCase();
  if (cat === 'feature-request' || cat === 'idea' || cat === 'feature') return true;
  if (Array.isArray(item.categories) && item.categories.some((c) => /idea|feature|request/i.test(c))) return true;
  const t = bodyOf(item).toLowerCase();
  return /(would|i'?d) ?like|can ?you ?(add|make|build)|please ?add|it ?should|wish|feature|request|suggest|\bidea\b|ability ?to|add (a|an|the|more)|be ?able ?to/.test(t);
}

// tallyRequests(items) → ranked rows, most-requested first:
//   { signature, label, count, ways, submitters, firstAt, lastAt, examples[] }
//   · count      = how many times it was asked (total matching items)
//   · ways       = how many DISTINCT phrasings (the "how many ways")
//   · submitters = distinct attributed submitters (anonymous counts to `count`
//                  but not to a named submitter)
export function tallyRequests(items = []) {
  const groups = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    if (!isRequest(item)) continue;
    const body = bodyOf(item).trim();
    const sig = normalizeSignature(body);
    if (!sig) continue;
    const g = groups.get(sig) || { signature: sig, count: 0, phrasings: new Set(), submitters: new Set(), firstAt: null, lastAt: null, label: body };
    g.count += 1;
    if (body) g.phrasings.add(body.toLowerCase());
    const name = String(item.displayName || item.display_name || '').trim();
    if (name && name.toLowerCase() !== 'anonymous' && !(item.isConfidential || item.is_confidential || item.isAnonymous)) g.submitters.add(name);
    const at = item.createdAt || item.submittedAt || item.submitted_at || null;
    if (at) {
      if (!g.firstAt || String(at) < String(g.firstAt)) g.firstAt = at;
      if (!g.lastAt || String(at) > String(g.lastAt)) g.lastAt = at;
    }
    // Prefer the shortest non-empty phrasing as the display label (usually clearest).
    if (body && body.length < g.label.length) g.label = body;
    groups.set(sig, g);
  }
  return [...groups.values()]
    .map((g) => ({
      signature: g.signature,
      label: g.label,
      count: g.count,
      ways: g.phrasings.size,
      submitters: [...g.submitters],
      submitterCount: g.submitters.size,
      firstAt: g.firstAt,
      lastAt: g.lastAt,
    }))
    .sort((a, b) => (b.count - a.count) || (b.ways - a.ways) || a.label.localeCompare(b.label));
}

// crossReferenceDecided(rows, decidedTitles) → each row gets `alreadyDecided`
// (a matching decided DR/directive title, or null). Matching is signature
// word-overlap: a decided title that shares most of a request's meaning-words
// is treated as "already answered".
export function crossReferenceDecided(rows = [], decidedTitles = []) {
  const decided = (Array.isArray(decidedTitles) ? decidedTitles : [])
    .map((t) => ({ title: String(t || ''), words: new Set(normalizeSignature(t).split(' ').filter(Boolean)) }))
    .filter((d) => d.words.size > 0);
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const reqWords = new Set(String(row.signature || '').split(' ').filter(Boolean));
    if (reqWords.size === 0) return { ...row, alreadyDecided: null };
    let best = null;
    for (const d of decided) {
      let overlap = 0;
      for (const w of reqWords) if (d.words.has(w)) overlap += 1;
      const ratio = overlap / reqWords.size;
      if (ratio >= 0.6 && (!best || ratio > best.ratio)) best = { title: d.title, ratio };
    }
    return { ...row, alreadyDecided: best ? best.title : null };
  });
}

// buildRecurringReport(items, { decidedTitles, knownMinTimes }) → the whole
// report. A row is `known` when it's been asked at least `knownMinTimes` times
// (default 3) AND has already been decided — that combination is the evidence
// that "they already know," i.e. the candidate for a Tier-A allowlist upgrade.
export function buildRecurringReport(items = [], opts = {}) {
  const knownMinTimes = Number.isFinite(opts.knownMinTimes) ? opts.knownMinTimes : 3;
  const rows = crossReferenceDecided(tallyRequests(items), opts.decidedTitles || []);
  const withKnown = rows.map((r) => ({
    ...r,
    known: r.count >= knownMinTimes && !!r.alreadyDecided,
  }));
  return {
    rows: withKnown,
    totalDistinct: withKnown.length,
    totalAsks: withKnown.reduce((s, r) => s + r.count, 0),
    known: withKnown.filter((r) => r.known),
  };
}
