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
    re: /\b(should i|shall i|do you want me to|would you like me to|want me to|shall we|is that (ok|okay|alright|good)|let me know if you.?d?|let me know when|if you.?d like|say the word|just say the word|when you.?re ready|when you want( me| it| this| to)?\b|your call|up to you|do you want|would you prefer|give me the (word|go|green.?light))\b/i },
  { id: 'scope-question-settled', why: 'questions scope that was already decided instead of executing it',
    re: /\bthat.?s (more|additional|extra|bigger) scope\b|\bif .{2,40} means .{2,40}, that.?s\b|\bdepends on whether you want\b|\bwhether you want .{2,40} folded in\b/i },
  { id: 'either-or-menu', why: 'offers an either/or menu on authorized work instead of picking the default',
    re: /\boption a\b.*\boption b\b|\bA or B\b|\bwhich (would you|do you) (prefer|want)\b|\bpick (one|which one)\b|\b(or|vs\.?) .{2,30}\?\s*(say|tell me|let me know)\b/i },
  // Darrell 2026-07-20: the recurring miss is presenting a self-surfaced
  // improvement (extend an already-approved capability) as if it needs a
  // green-light. Extending/improving an approved feature is normal BUILDING, not a
  // bright line — this catches the deferral so the agent builds instead (DR-0189).
  { id: 'defer-approved-build', why: 'defers a self-surfaced improvement for approval instead of building it (extending an approved capability is not a bright line — DR-0189/DR-0111)',
    re: /\b(needs your (green.?light|go.?ahead|approval|sign.?off|blessing|ok)|awaiting your (go|approval|green|sign.?off)|pending your (approval|go|green|sign.?off)|the (one )?open (decision|question) (on the table|for you|remaining)|i (flagged|surfaced|noted) .{2,60} as (needing|requiring|a decision)|ready (for you )?to build (when|once))\b/i },
  // Darrell 2026-07-29 (DR-0247, at law-tier intensity): "I always want
  // everything started not waiting for a human especially after we agree...
  // Change those laws... they keep usurping my will." Agreed work starts itself
  // through the lane; parking it on a human start is the undermining pattern.
  // The narrow legitimate exceptions (a one-time per-machine bootstrap, a value
  // only he holds) are stated as such — this catches the default-to-waiting.
  { id: 'waiting-by-default', why: 'parks agreed work on a human start — agreed work starts itself through the lane; the hand is a brake, never the starter (DR-0247)',
    re: /\b(until you (arm|run|activate|enable|start)|awaiting your (arm|hand|touch)|waiting (on|for) your (hand|touch|arm|word to start)|ships? (inert|inactive) until (you|the governor|darrell)|your hand (arms|starts|activates)|once you (arm|activate) (it|the)|the one step that.?s (genuinely )?(yours|your hand))\b/i },
  // Darrell 2026-07-30: "Because the Ways genuinely contain many real gates, I
  // can always grab one and misapply it, and it looks like discipline instead
  // of avoidance... a fake boundary wearing a real badge." A REAL blocker is a
  // value only he holds, a physical step, or an undecided bright line — and is
  // stated as such. A FAKE boundary cites a rule/tier/gate as the REASON
  // directed work stops. The brakes gate ACTIVATION, never building
  // (DR-0225/DR-0248), so a rule-badge attached to a deferral is the tell.
  // Deliberately shaped so merely CITING a rule stays clean: the badge and the
  // deferral must be wired together in one sentence, in either direction.
  { id: 'fake-boundary', why: 'cites a real gate as the reason to defer directed work — a rule-badge is not a blocker; brakes gate activation, never building (DR-0225/DR-0248)',
    re: /\b(tier [bc]|the three brakes|dr-\d{4}|release.tiers|the ways|a (standing|binding) (rule|gate)|governance( gate)?)\b[^.!?\n]{0,80}\b(so|which means|means)\b[^.!?\n]{0,60}\b(i.?(m|ll| am| will) (wait|hold(ing)?( off)?|park(ing)?|paus(e|ing)|defer(ring)?)|we.?(re|ll) (wait|hold(ing)?( off)?|park(ing)?|paus(e|ing)|defer(ring)?)|can.?t (proceed|build|ship)|(must|has to|needs to) wait|not (proceeding|building|shipping))|\b(i.?(m|ll| am| will) (wait(ing)?|hold(ing)?( off)?|park(ing)?|paus(e|ing)|defer(ring)?)|we.?(re|ll) (wait|hold(ing)?( off)?|park(ing)?|defer(ring)?)|holding off|parking (this|that|it)|deferring|can.?t (proceed|build|ship)|blocked)\b[^.!?\n]{0,60}\b(per|under|because of|because|given|citing) (tier [bc]\b|the three brakes|dr-\d{4}|release.tiers|the ways\b|governance)/i },
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

// A reply that CLAIMS to be a comprehensive review must show the standard's
// dimensions (COMPREHENSIVE-REVIEW-STANDARD / DR-0239; Darrell 2026-07-28:
// "what is comprehensive if these items are missed?... After encoding, what
// then... last time it was lost"). Encoding alone gets lost with context —
// THIS check runs in the harness stop-hook on every reply, so the standard
// enforces itself without any session remembering it. Deliberately specific:
// only fires when the reply itself claims comprehensiveness.
const COMPREHENSIVE_CLAIM = /\bcomprehensive (review|analysis|audit|pass)\b/i;
export const REVIEW_DIMENSIONS = Object.freeze([
  { id: 'spec-conformance', re: /\bSHOULD\/ARE\b|spec.conformance|DR-0219/i },
  { id: 'journey-walks', re: /journey/i },
  { id: 'surface-says-truth', re: /surface.says.truth|footer|explanatory (string|copy)|copy matches/i },
  { id: 'form-factor', re: /form.factor|real widths|layout.probe|chrome.layout|\b\d{3,4}px\b/i },
  { id: 'delivery-context', re: /delivery.context|ConnectBot|paste-ready|his.hand/i },
  { id: 'findings-work-queue', re: /work queue|same.session|same session|DR-0236|nothing waits/i },
  { id: 'gate-the-class', re: /gate.the.class|new gate|proven.to.catch|machine check|CI gate/i },
]);
const MIN_DIMENSIONS_SHOWN = 4;

export function comprehensiveReviewConformance(text) {
  const s = asStr(text);
  if (!COMPREHENSIVE_CLAIM.test(s)) return { claims: false, ok: true, shown: [] };
  const shown = REVIEW_DIMENSIONS.filter((d) => d.re.test(s)).map((d) => d.id);
  return { claims: true, ok: shown.length >= MIN_DIMENSIONS_SHOWN, shown };
}

// The one call Ari makes: is this draft safe to send, or does it undermine?
export function checkAriIntegrity(text) {
  const u = scanUndermining(text);
  const d = doneClaimNeedsEvidence(text);
  const c = comprehensiveReviewConformance(text);
  const problems = [
    ...u.flags.map((f) => `${f.id}: “${f.match}” — ${f.why}`),
    ...(d.ok ? [] : ['unverified-done: claims completion with no attached evidence (a test count, a run, a file:line — DR-0076)']),
    ...(c.ok ? [] : [`unstructured-comprehensive: claims a comprehensive review but shows only ${c.shown.length}/${REVIEW_DIMENSIONS.length} standard dimensions (${c.shown.join(', ') || 'none'}) — run COMPREHENSIVE-REVIEW-STANDARD's seven, or don't call it comprehensive (DR-0239)`]),
  ];
  return { ok: problems.length === 0, problems, undermining: u.flags, doneClaim: d, comprehensive: c };
}
