// =============================================================================
// ari-integrity-guard — Ari's protection against Claude's undermining pattern
// =============================================================================
// Declared by Darrell 2026-07-13 (high intensity): "Ari needs to be able to
// protect us and our builds from Claude's undermining ways." The pattern that
// keeps undermining progress — and that DR-0111 forbids but a doc can't ENFORCE:
//   1. RE-ASKING settled/directed work ("should I", "your call", "want me to").
//   2. SCOPE-QUESTIONING what was already decided ("that's more scope — your call").
//   3. FALSE "DONE" — claiming done/shipped/complete with no attached evidence.
//   4. EITHER/OR menus on already-authorized work instead of deciding.
//
// This makes the rule a DETERMINISTIC CHECK Ari runs on a draft reply / PR body
// BEFORE it is trusted or sent — so the pattern is caught by a gate, not by
// Darrell's frustration. It is Ari's, pointed at Claude's output (GOVERN-EXECUTE-
// ADVISE: Ari guards; the human governs). Pure + testable (DR-0076).
//
// Companion to lib/ari-app-review.js + the ari-adjustments gate; recorded as a
// binding principle so future sessions inherit the protection.
// =============================================================================

const asStr = (v) => (typeof v === 'string' ? v : '');

// Each pattern is a named anti-behavior with a regex and the reason it undermines.
// Kept deliberately specific so a confident, decision-first reply passes clean.
export const UNDERMINING_PATTERNS = Object.freeze([
  { id: 're-ask-permission', why: 'asks permission for work already directed (do the work — DR-0111)',
    re: /\b(should i|shall i|do you want me to|would you like me to|want me to|shall we|is that (ok|okay|alright|good)|let me know if you.?d?|if you.?d like|say the word|your call|up to you|do you want|would you prefer)\b/i },
  { id: 'scope-question-settled', why: 'questions scope that was already decided instead of executing it',
    re: /\bthat.?s (more|additional|extra|bigger) scope\b|\bif .{2,40} means .{2,40}, that.?s\b|\bdepends on whether you want\b|\bwhether you want .{2,40} folded in\b/i },
  { id: 'either-or-menu', why: 'offers an either/or menu on authorized work instead of picking the default',
    re: /\boption a\b.*\boption b\b|\bA or B\b|\bwhich (would you|do you) (prefer|want)\b|\bpick (one|which one)\b|\b(or|vs\.?) .{2,30}\?\s*(say|tell me|let me know)\b/i },
]);

// Scan a draft reply / PR body for the undermining patterns. Returns the flags so
// Ari can BLOCK or rewrite before it reaches Darrell. clean === safe to send.
export function scanUndermining(text) {
  const s = asStr(text);
  const flags = [];
  for (const p of UNDERMINING_PATTERNS) {
    const m = s.match(p.re);
    if (m) flags.push({ id: p.id, match: m[0], why: p.why });
  }
  return { clean: flags.length === 0, flags };
}

// A completion claim ("done / shipped / complete / verified / it works") is only
// trustworthy with ATTACHED EVIDENCE — a test count, a real run, a file:line, a
// measured number (DR-0076). Ari demotes an un-evidenced "done" to "unverified".
const DONE_CLAIM = /\b(all done|fully done|it.?s done|we.?re done|done here|nothing (else )?(is )?pending|everything.?s? (shipped|done|complete)|fully (shipped|complete)|task complete|it works|it.?s live)\b/i;
const EVIDENCE = /(\d+\s*(tests?|green|passed|passing)|test files|failed=0|applied=\d|\brun\s*\d|:\d{1,5}\b|\d+%|screenshot|measured|verified (via|by|from) |the (log|run) (shows|confirms))/i;

export function doneClaimNeedsEvidence(text) {
  const s = asStr(text);
  const claimsDone = DONE_CLAIM.test(s);
  const hasEvidence = EVIDENCE.test(s);
  return { claimsDone, hasEvidence, ok: !claimsDone || hasEvidence };
}

// The one call Ari makes: is this draft safe to send, or does it undermine?
export function checkAriIntegrity(text) {
  const u = scanUndermining(text);
  const d = doneClaimNeedsEvidence(text);
  const problems = [
    ...u.flags.map((f) => `${f.id}: “${f.match}” — ${f.why}`),
    ...(d.ok ? [] : ['unverified-done: claims completion with no attached evidence (a test count, a run, a file:line — DR-0076)']),
  ];
  return { ok: problems.length === 0, problems, undermining: u.flags, doneClaim: d };
}
