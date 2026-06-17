// =============================================================================
// handoff.mjs — pure logic for the wake / handoff contract (no network, no I/O).
// =============================================================================
// The testable core of the wake bridge: validate a handoff against the contract,
// decide whether a wake is DUE, and pick the tiered vendor. Kept pure so the
// freshness/verification gate can prove it (DR-0076): every decision here is a
// function of its inputs, deterministic, and unit-tested proven-to-catch.
//
// Contract: infra/ai-orchestrator/portable/handoff/schema.json
//           infra/ai-orchestrator/portable/handoff/HANDOFF-CONTRACT.md
//
// Routing strategy: docs/99-session-notes/2026-06-13-vendor-llm-routing-strategy.md
//                   (DR-0056 tiered orchestrator, DR-0073 capability-aware routing)

// --- Affinity map (starting defaults; the v1 router tunes from outcomes) -----
// Config, not dogma. Mirrors scripts/orchestrator-v0.mjs so the two stay aligned.
export const AFFINITY = {
  code: 'claude', refactor: 'claude', agentic: 'claude', writing: 'claude',
  longcontext: 'gemini', multimodal: 'gemini', research: 'gemini',
  default: 'claude',
};

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const VALID_ISSUERS = ['claude', 'gemini', 'local', 'human'];
const VALID_POINTER_KINDS = ['git-branch', 'git-pr', 'repo-path', 'nas-path', 'event-log', 'url'];
const VALID_WORK_TYPES = ['code', 'refactor', 'agentic', 'writing', 'longcontext', 'multimodal', 'research', 'default'];
const VALID_SUGGESTED = ['local', 'claude', 'gemini', 'auto'];

// Parse a strict UTC ISO-8601 string to epoch ms, or null if malformed. We do
// NOT accept loose Date parsing: an unparseable time must fail honestly, not
// silently coerce to a wrong instant (Verification Doctrine: no painted values).
export function parseIsoMs(s) {
  if (typeof s !== 'string' || !ISO_RE.test(s)) return null;
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}

// validateHandoff(obj) -> { ok, errors: string[] }
// A focused structural check of the required contract fields. Not a full JSON
// Schema validator (the bundle ships schema.json for that); this is the guard
// the router runs before it acts, so a malformed handoff is refused, not summoned.
export function validateHandoff(h) {
  const errors = [];
  const req = (cond, msg) => { if (!cond) errors.push(msg); };

  if (h === null || typeof h !== 'object' || Array.isArray(h)) {
    return { ok: false, errors: ['handoff must be a JSON object'] };
  }
  req(h.v === 1, 'v must be 1');
  req(typeof h.id === 'string' && h.id.length >= 6, 'id must be a string of length >= 6');
  req(parseIsoMs(h.issued_at) !== null, 'issued_at must be a UTC ISO-8601 datetime');
  req(VALID_ISSUERS.includes(h.issued_by), `issued_by must be one of ${VALID_ISSUERS.join('|')}`);
  req(typeof h.lane === 'string' && h.lane.length >= 1, 'lane is required');
  req(typeof h.task === 'string' && h.task.length >= 1, 'task is required');

  // wake_at: object with exactly one of {at, after_seconds, condition}
  if (h.wake_at === null || typeof h.wake_at !== 'object' || Array.isArray(h.wake_at)) {
    errors.push('wake_at must be an object');
  } else {
    const w = h.wake_at;
    const drivers = ['at', 'after_seconds', 'condition'].filter((k) => w[k] !== undefined && w[k] !== null);
    req(drivers.length === 1, 'wake_at must have exactly one of {at, after_seconds, condition}');
    if (w.at !== undefined) req(parseIsoMs(w.at) !== null, 'wake_at.at must be a UTC ISO-8601 datetime');
    if (w.after_seconds !== undefined) {
      req(Number.isInteger(w.after_seconds) && w.after_seconds >= 1 && w.after_seconds <= 2592000,
        'wake_at.after_seconds must be an integer in [1, 2592000]');
    }
    if (w.condition !== undefined) req(typeof w.condition === 'string' && w.condition.length >= 1, 'wake_at.condition must be a non-empty string');
    if (w.not_before !== undefined) req(parseIsoMs(w.not_before) !== null, 'wake_at.not_before must be a UTC ISO-8601 datetime');
  }

  // state_pointer: { kind, ref }
  if (h.state_pointer === null || typeof h.state_pointer !== 'object' || Array.isArray(h.state_pointer)) {
    errors.push('state_pointer must be an object');
  } else {
    req(VALID_POINTER_KINDS.includes(h.state_pointer.kind), `state_pointer.kind must be one of ${VALID_POINTER_KINDS.join('|')}`);
    req(typeof h.state_pointer.ref === 'string' && h.state_pointer.ref.length >= 1, 'state_pointer.ref is required');
  }

  // Optional enums, validated when present.
  if (h.work_type !== undefined) req(VALID_WORK_TYPES.includes(h.work_type), `work_type must be one of ${VALID_WORK_TYPES.join('|')}`);
  if (h.suggested_vendor !== undefined) req(VALID_SUGGESTED.includes(h.suggested_vendor), `suggested_vendor must be one of ${VALID_SUGGESTED.join('|')}`);
  if (h.private !== undefined) req(typeof h.private === 'boolean', 'private must be a boolean');
  if (h.budget_hint_usd !== undefined) req(typeof h.budget_hint_usd === 'number' && h.budget_hint_usd >= 0, 'budget_hint_usd must be a number >= 0');

  return { ok: errors.length === 0, errors };
}

// isWakeDue(handoff, nowMs, { conditionChecker }) -> { due, reason }
// Pure given a clock (nowMs) and an optional condition checker. An UNKNOWN
// condition (no checker, or checker returns undefined) is NOT due — the bridge
// never invents a wake. not_before is a hard floor in every case.
export function isWakeDue(h, nowMs, opts = {}) {
  const w = (h && h.wake_at) || {};
  const conditionChecker = opts.conditionChecker;

  const notBefore = w.not_before !== undefined ? parseIsoMs(w.not_before) : null;
  if (notBefore !== null && nowMs < notBefore) {
    return { due: false, reason: `before not_before floor (${w.not_before})` };
  }

  if (w.at !== undefined) {
    const at = parseIsoMs(w.at);
    if (at === null) return { due: false, reason: 'wake_at.at unparseable' };
    return nowMs >= at
      ? { due: true, reason: `time reached (at ${w.at})` }
      : { due: false, reason: `waiting until ${w.at}` };
  }

  if (w.after_seconds !== undefined) {
    const base = parseIsoMs(h.issued_at);
    if (base === null) return { due: false, reason: 'issued_at unparseable' };
    const at = base + w.after_seconds * 1000;
    return nowMs >= at
      ? { due: true, reason: `delay elapsed (${w.after_seconds}s after issued_at)` }
      : { due: false, reason: `waiting ${w.after_seconds}s after issued_at` };
  }

  if (w.condition !== undefined) {
    if (typeof conditionChecker !== 'function') {
      return { due: false, reason: `condition '${w.condition}' has no checker (unknown => not due)` };
    }
    const met = conditionChecker(w.condition, h);
    if (met === true) return { due: true, reason: `condition met: ${w.condition}` };
    if (met === false) return { due: false, reason: `condition not yet met: ${w.condition}` };
    return { due: false, reason: `condition '${w.condition}' unknown to checker (=> not due)` };
  }

  return { due: false, reason: 'no wake driver' };
}

// pickVendor(handoff, { mode }) -> { vendor, reason }
// The tiered, cheapest-capable-first selection. Private is local-only in every
// mode (sovereignty gate). suggested_vendor is an advisory tie-break, never an
// override of the private gate. Returns the PRIMARY target; the router applies
// the local-fallback / escalation ladder around it per ORCH_MODE.
export function pickVendor(h, opts = {}) {
  const mode = (opts.mode || 'vendor-first').toLowerCase();

  if (h && h.private === true) {
    return { vendor: 'local', reason: 'private => local-only (sovereignty gate, every mode)' };
  }

  const type = String((h && h.work_type) || 'default').toLowerCase();
  const affinity = AFFINITY[type] || AFFINITY.default;
  const suggested = h && h.suggested_vendor;

  // A concrete, non-'auto' suggestion that is a real vendor is honored as the
  // primary (the issuer knows its own lane); otherwise fall to the affinity map.
  if (suggested && suggested !== 'auto' && suggested !== 'local') {
    return { vendor: suggested, reason: `issuer suggested ${suggested} (advisory, honored)` };
  }
  if (suggested === 'local') {
    // Local suggested but not private: in vendor-first local is only the
    // fallback, so the primary is still the affinity vendor; note the hint.
    return { vendor: affinity, reason: `suggested local but non-private; affinity primary=${affinity} (local is fallback in ${mode})` };
  }
  return { vendor: affinity, reason: `affinity map: work_type=${type} -> ${affinity}` };
}
