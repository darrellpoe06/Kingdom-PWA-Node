// =============================================================================
// decision-chain — a decision record read as Concern → Evidence → Impact →
// Decision → Outcome, so any steward can follow how a concern became a call
// =============================================================================
// Darrell, 2026-09-23, from his own governance brief: the next level of
// maturity is "making the connection between Concern ↓ Evidence ↓ Impact ↓
// Decision ↓ Outcome easier to follow through existing governance tools" —
// "not more meetings, not more documents, not more rigor", just making the
// chain visible inside the tools already in use. "Make sure we have these
// procedures and processes in place inside the PoeTech App."
//
// THE REAL DATA (DR-0061 trace). docs/decisions/*.md — 550 append-only
// records — already carry the chain, under many heading names: "Context" /
// "Why this exists" / "The trigger" is the concern; "What was measured" /
// "Proof" / "The verified trace" is the evidence; "Consequences" / "Limits,
// stated" / "Honest limits" is the impact; "Decision" / "The decision" /
// "Directive" is the call; "Verification" / "Measured after merge" /
// "Proven-to-catch" / "Re-review" is the outcome. The in-app ledger
// (GovernanceQueue) showed two of the five. This mapper reads all five from
// the record's OWN sections, by heading family, and names any slot the record
// does not carry as "not recorded" — never painted, never inferred from
// another slot (DR-0076).
//
// PURE. No I/O, no dates from the clock. vite.config.js runs it at build time
// over the real files; the test runs it over fixtures and over the real
// corpus with a shrink-only baseline for the records that predate this rule.
// =============================================================================

// Heading families, matched case-insensitively against the START of a "## "
// heading (a parenthetical or a dash suffix does not break the match).
// Order inside a family = preference when a record carries several.
export const CHAIN_SLOTS = ['concern', 'evidence', 'impact', 'decision', 'outcome'];

export const CHAIN_LABELS = {
  concern: 'Concern',
  evidence: 'Evidence',
  impact: 'Impact',
  decision: 'Decision',
  outcome: 'Outcome',
};

export const CHAIN_QUESTIONS = {
  concern: 'What was the issue?',
  evidence: 'What proved it?',
  impact: 'What happens if unresolved — and what does the call obligate?',
  decision: 'What was decided, and by whom?',
  outcome: 'What resulted, and when is it looked at again?',
};

const FAMILIES = {
  concern: [
    'context', 'concern', 'why this exists', 'the trigger', 'the finding', 'what darrell sent',
    'directive, in darrell', 'directive', 'the word, as spoken', 'the problem', 'what happened',
    'the situation', 'background', 'what was asked', 'what darrell said', 'the defect',
    'declared by darrell', 'rationale', 'the ask', 'the incident', 'the question',
  ],
  evidence: [
    'what was measured', 'measured before', 'measured', 'evidence', 'proof', 'the verified trace',
    'the report', 'what is true', 'the measurement', 'what the log', 'what the data', 'the read',
    'reality-trace', 'reality trace', 'trace', 'the evidence', 'verified', 'encoded / verified',
    'what was true', 'dr-0100 tiers applied', 'the numbers', 'the data',
  ],
  impact: [
    'impact', 'business impact', 'consequences', 'limits, stated', 'honest limits', 'boundaries',
    'opportunities and constraints', 'opportunities & constraints', 'risks', 'dependencies',
    'what this obligates', 'the honest remainder', 'honest remainder', 'not claimed', 'what is not',
    'consequence', 'what this does not do', 'what this deliberately did not do', 'what remains',
    'not done / open', 'not done', 'open items', 'what is still open', 'constraints',
  ],
  decision: [
    'decision', 'the decision', 'decisions', 'the decisions', 'directive', 'what we decided',
    'the fix', 'the close', 'what changes', 'what changed', 'the build', 'encoded', 'the rule',
    'the standard', 'what ships',
  ],
  outcome: [
    'outcome', 'resolution', 'verification after merge', 'measured after merge', 'verification',
    'proven-to-catch', 'proven to catch', 'what shipped', 'what is still not proven', 're-review',
    'gates', 'measured again', 'measured once more', 'the result', 'follow-through', 'carried',
    'what was built', 'gate', 'guards', 'proof after merge', 'after merge', 'the proof',
  ],
};

// A heading is a "## " or "### " line; the body runs to the next heading of the
// same or higher level. Returns [{ heading, level, body }] in document order.
export function sectionsOf(markdown) {
  const raw = String(markdown || '').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  const out = [];
  let cur = null;
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (cur) out.push(cur);
      cur = { heading: m[2].trim(), level: m[1].length, body: [] };
    } else if (cur) {
      cur.body.push(line);
    }
  }
  if (cur) out.push(cur);
  return out.map((s) => ({ ...s, body: s.body.join('\n').trim() }));
}

const norm = (h) => String(h || '')
  .toLowerCase()
  .replace(/[*_`]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

function familyOf(heading) {
  const h = norm(heading);
  for (const slot of CHAIN_SLOTS) {
    for (const name of FAMILIES[slot]) {
      if (h === name || h.startsWith(name + ' ') || h.startsWith(name + ',') || h.startsWith(name + ':') || h.startsWith(name + ' (') || h.startsWith(name + ' —') || h.startsWith(name + ' -')) {
        return slot;
      }
    }
  }
  return null;
}

// Markdown → readable text (bullets and newlines kept; bold/code/links dropped).
export function plainText(s, max = 1400) {
  const t = String(s || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// The literal commitment a record makes to look again: `re-review: YYYY-MM-DD`.
export function reReviewOf(markdown) {
  const dates = Array.from(String(markdown || '').matchAll(/re-review:\s*`?(\d{4}-\d{2}-\d{2})`?/gi)).map((m) => m[1]);
  return dates.length ? dates.sort()[dates.length - 1] : '';
}

// chainOf — the five slots read from a record's own sections. A slot the
// record does not carry is null and is listed in `missing`. "Directive" is a
// concern when the record has a separate decision family, else it is the
// decision (the list-style records put the call under the directive quote).
export function chainOf(markdown, { max = 1400, withText = true } = {}) {
  const sections = sectionsOf(markdown);
  const found = { concern: null, evidence: null, impact: null, decision: null, outcome: null };
  const directive = [];
  for (const s of sections) {
    const h = norm(s.heading);
    if (!s.body) continue;
    if (h === 'directive' || h.startsWith('directive,') || h.startsWith('directive ')) { directive.push(s); continue; }
    const slot = familyOf(s.heading);
    if (!slot) continue;
    if (!found[slot]) found[slot] = { heading: s.heading, text: plainText(s.body, max) };
  }
  if (directive.length) {
    const d = directive[0];
    if (!found.decision) found.decision = { heading: d.heading, text: plainText(d.body, max) };
    else if (!found.concern) found.concern = { heading: d.heading, text: plainText(d.body, max) };
  }
  // The list-style header (2026-07 onward) states the concern in its
  // "- **Grounds:**" bullet — the incident, run, quote or record that forced
  // the decision. That bullet IS the record's own statement of the concern,
  // so it stands in when no concern section exists. Nothing else is inferred.
  if (!found.concern) {
    const g = /^-\s+\*\*Grounds:\*\*\s*(.+)$/m.exec(String(markdown || ''));
    if (g && g[1].trim()) found.concern = { heading: 'Grounds', text: plainText(g[1], max) };
  }
  const missing = CHAIN_SLOTS.filter((k) => !found[k]);
  const out = { ...found, missing, complete: missing.length === 0, reReview: reReviewOf(markdown) };
  if (!withText) for (const k of CHAIN_SLOTS) if (out[k]) out[k] = { heading: out[k].heading };
  return out;
}

// Ledger-level readout: how many records carry the whole chain, and which
// slot is missing most often — measured over what was passed in, never
// estimated.
export function chainCoverage(items) {
  const list = Array.isArray(items) ? items : [];
  const missingBySlot = Object.fromEntries(CHAIN_SLOTS.map((k) => [k, 0]));
  let complete = 0;
  for (const it of list) {
    const ch = it && it.chain;
    if (!ch) { for (const k of CHAIN_SLOTS) missingBySlot[k] += 1; continue; }
    if (ch.complete) complete += 1;
    for (const k of ch.missing || []) missingBySlot[k] += 1;
  }
  return { total: list.length, complete, incomplete: list.length - complete, missingBySlot };
}
