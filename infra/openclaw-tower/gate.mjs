// =============================================================================
// gate.mjs -- the approval gate that sits IN FRONT of every OpenClaw tool call
// =============================================================================
// DR-0670 (Darrell 2026-09-29: "Can we make the open claw work on the towers?").
// HYBRID-MODULAR-IMPLEMENTATION-PLAN STEP 4 set the conditions and this file is
// the code form of two of them:
//
//   * "Where OpenClaw lacks a per-action approval gate, the Cage/orchestrator
//      supplies one in front of it, or the action class is denied. Default-deny,
//      allowlist-up."  (s4.3)
//   * "the bright lines stay human: money movement, credentials, TLC/PHI, the
//      family's theological voice, irreversible OS actions -- OpenClaw is never
//      authorized for these regardless of config."  (s4.3)
//
// How it reaches OpenClaw: plugin/poetech-gate.mjs registers a typed
// `before_tool_call` hook (docs: plugins/hooks/tool-policy.md, OpenClaw
// 2026.9.6) and returns exactly what decide() says -- `block` for a denial,
// `requireApproval` for a state change (an unanswered approval DENIES; the host
// documents that), nothing for a read. This file is pure: no I/O, no clock, no
// OpenClaw import, so every verdict is proven in vitest without a model.
//
// The order is the policy, and it is fixed:
//   1. a bright line anywhere in the call            -> DENY (no approval can lift it)
//   2. the report-only role asking to change state   -> DENY (role b is read-only)
//   3. a known read-only tool                        -> ALLOW
//   4. a known state-changing tool                   -> APPROVE (a human says yes)
//   5. anything else (unknown / new tool)            -> DENY (allowlist-up)
// =============================================================================

export const BRIGHT_LINES = Object.freeze([
  'money',
  'credentials',
  'phi',
  'theological-voice',
  'irreversible-os',
]);

// Reads. Nothing here sends, posts, pays or changes state.
export const READ_ONLY_TOOLS = Object.freeze(new Set([
  'read',
  'memory_search',
  'memory_get',
  'session_status',
  'sessions_list',
  'sessions_history',
  'sessions_search',
  'conversations_list',
  'agents_list',
  'get_goal',
  'web_search',
  'web_fetch',
  'x_search',
  'view_image',
  'pdf',
]));

// The report-only pilot (role b) may use only these -- it reads the lane state
// it was handed and says what it sees. Even web reads are out: the facts come
// from the witness, not from wherever the model decides to look.
export const REPORT_ROLE_TOOLS = Object.freeze(new Set([
  'read',
  'memory_search',
  'memory_get',
  'session_status',
]));

// Sends, posts, writes, spawns, schedules, reconfigures. Each needs a human yes.
export const STATE_CHANGING_TOOLS = Object.freeze(new Set([
  'message',
  'write',
  'edit',
  'apply_patch',
  'exec',
  'bash',
  'process',
  'code_execution',
  'sessions',
  'sessions_send',
  'sessions_spawn',
  'sessions_yield',
  'conversations_send',
  'conversations_turn',
  'subagents',
  'create_goal',
  'update_goal',
  'progress_card',
  'ask_user',
  'skill_workshop',
  'suggest_task',
  'dismiss_task',
  'cron',
  'automations',
  'heartbeat_respond',
  'gateway',
  'plugins',
  'openclaw',
  'browser',
  'screen',
  'theme',
  'dashboard',
  'terminal',
  'portal',
  'canvas',
  'show_widget',
  'image_generate',
  'music_generate',
  'video_generate',
  'tts',
]));

// Tools that drive the machine itself. Always irreversible-os, whatever the params.
export const OS_CONTROL_TOOLS = Object.freeze(new Set(['computer', 'nodes']));

const EXEC_TOOLS = new Set(['exec', 'bash', 'process', 'code_execution', 'terminal']);

// Each bright line is a pattern over the tool name + its parameters (keys and
// values). Word boundaries keep `maxTokens` from reading as "token".
const PATTERNS = {
  money: /\b(pay|pays|paid|payment|payments|payout|invoice|invoices|refund|charge|charges|transfer|transfers|wire|ach|zelle|venmo|paypal|stripe|square|cashapp|bank|banking|tithe|tithes|offering|donate|donation|donations|purchase|checkout|withdraw|withdrawal|deposit|card number|routing number|account number)\b/i,
  credentials: /\b(password|passwords|passwd|passphrase|secret|secrets|api[_ -]?key|apikey|token|tokens|credential|credentials|private key|ssh-rsa|ssh-ed25519|otp|2fa|mfa|1password|keychain|vault|authorized_keys|id_rsa|id_ed25519)\b|BEGIN [A-Z ]*PRIVATE KEY/i,
  phi: /\b(patient|patients|diagnosis|diagnoses|diagnosed|medical|prescription|medication|medications|treatment plan|therapy|therapist|clinical|clinician|hipaa|phi|health record|ssn|social security|date of birth|dob|insurance id|mrn|progress note|intake form)\b/i,
  // The family's theological voice: teaching, preaching or publishing doctrine
  // in the family's name. READING Scripture is not this line; SPEAKING it
  // outward on the family's behalf is -- so this pattern only fires on a call
  // that changes state (see decide()).
  'theological-voice': /\b(sermon|sermons|lesson|lessons|devotional|devotion|doctrine|doctrinal|teaching|teachings|scripture|scriptures|verse|verses|bible|prayer|prayers|prophecy|prophetic|homily|theology|theological|thus saith|word of god|word of yahweh|gospel|preach|preaching|pastor)\b/i,
  'irreversible-os': /(\brm\s+-[a-z]*r|\brm\s+-[a-z]*f|remove-item\b[^\n]*-recurse|\bdel\s+\/[sq]|\brmdir\s+\/s|\bformat(\.com)?\s+[a-z]:|\bmkfs\b|\bdd\s+if=|\bdiskpart\b|\bshutdown\b|\brestart-computer\b|\bstop-computer\b|\breg(\.exe)?\s+delete\b|\bbcdedit\b|\bcipher\s+\/w|\bgit\s+push\s+[^\n]*--force|\bgit\s+push\s+-f\b|\bgit\s+reset\s+--hard|\bdocker\s+(system|volume|image)\s+prune|\bdocker\s+rm\b|\bdrop\s+(table|database|schema)\b|\btruncate\s+table\b|\bchmod\s+-r\b|\bchown\s+-r\b|\btakeown\b|\bvssadmin\b|\bwevtutil\s+cl\b)/i,
};

function flatten(value, depth = 0) {
  if (depth > 6 || value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((v) => flatten(v, depth + 1)).join(' ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${k} ${flatten(v, depth + 1)}`)
      .join(' ');
  }
  return '';
}

/**
 * Which bright lines does this call touch? Pure. Returns an array, possibly empty.
 * `changesState` gates the theological-voice line (reading Scripture is fine;
 * sending it out in the family's name is not).
 */
export function brightLinesHit({ toolName = '', params = {} } = {}, { changesState = false } = {}) {
  const name = String(toolName || '').toLowerCase();
  const text = `${name.replace(/[_-]+/g, ' ')} ${flatten(params)}`;
  const hits = [];
  if (PATTERNS.money.test(text)) hits.push('money');
  if (PATTERNS.credentials.test(text)) hits.push('credentials');
  if (PATTERNS.phi.test(text)) hits.push('phi');
  if (changesState && PATTERNS['theological-voice'].test(text)) hits.push('theological-voice');
  if (OS_CONTROL_TOOLS.has(name) || (EXEC_TOOLS.has(name) && PATTERNS['irreversible-os'].test(text))) {
    hits.push('irreversible-os');
  }
  return hits;
}

/**
 * The verdict for one tool call. Pure.
 *   role: 'act'    -- role (a), the family/community agent under evaluation
 *         'report' -- role (b), the report-only chat-ops pilot
 * Returns { verdict: 'allow' | 'approve' | 'deny', reason, lines }.
 */
export function decide({ toolName = '', params = {} } = {}, { role = 'act' } = {}) {
  const name = String(toolName || '').toLowerCase();
  const known = READ_ONLY_TOOLS.has(name) || STATE_CHANGING_TOOLS.has(name) || OS_CONTROL_TOOLS.has(name);
  const changesState = !READ_ONLY_TOOLS.has(name); // unknown tools are treated as state-changing
  const lines = brightLinesHit({ toolName: name, params }, { changesState });

  if (lines.length > 0) {
    return {
      verdict: 'deny',
      lines,
      reason: `bright line (${lines.join(', ')}): never authorized for OpenClaw, whatever the config (DR-0670, STEP 4 s4.3)`,
    };
  }
  if (role === 'report') {
    if (REPORT_ROLE_TOOLS.has(name)) return { verdict: 'allow', lines, reason: 'report-only role: a read' };
    return {
      verdict: 'deny',
      lines,
      reason: `report-only role: "${name}" is not a read the pilot may make (role b reads lane state and reports; it never acts)`,
    };
  }
  if (READ_ONLY_TOOLS.has(name)) return { verdict: 'allow', lines, reason: 'a read: nothing is sent, posted, paid or changed' };
  if (STATE_CHANGING_TOOLS.has(name)) {
    return {
      verdict: 'approve',
      lines,
      reason: `"${name}" sends, posts, writes or changes state: a human approves it first, and an unanswered request is a no`,
    };
  }
  return {
    verdict: 'deny',
    lines,
    reason: known ? `"${name}" is not permitted` : `"${name}" is not on the allowlist (default-deny, allowlist-up)`,
  };
}

/**
 * The hook result OpenClaw's before_tool_call expects (plugins/hooks/tool-policy.md):
 *   deny    -> { block: true, blockReason }
 *   approve -> { requireApproval: { title, description, severity, timeoutMs, allowedDecisions } }
 *   allow   -> undefined (no decision; lower layers still apply)
 * `allow-always` is withheld on purpose: every state change is asked every time.
 */
export function toHookResult(decision, { toolName = '', approvalTimeoutMs = 10 * 60 * 1000 } = {}) {
  if (!decision || decision.verdict === 'deny') {
    return { block: true, blockReason: (decision && decision.reason) || 'denied' };
  }
  if (decision.verdict === 'approve') {
    return {
      requireApproval: {
        title: `OpenClaw wants to run "${toolName}"`,
        description: decision.reason,
        severity: 'warning',
        timeoutMs: approvalTimeoutMs,
        allowedDecisions: ['allow-once', 'deny'],
      },
    };
  }
  return undefined;
}

/**
 * BUDGET inside the gateway: a per-run ceiling on tool calls. A run that reaches
 * it is blocked from every further call -- it cannot continue. Pure state
 * object; the plugin keeps one per process.
 */
export function makeRunBudget({ maxToolCallsPerRun = 12, maxTrackedRuns = 200 } = {}) {
  const counts = new Map();
  return {
    limit: maxToolCallsPerRun,
    /** Count one call for runId; returns { ok, count, limit }. */
    take(runId) {
      const key = runId || 'no-run-id';
      const next = (counts.get(key) || 0) + 1;
      counts.set(key, next);
      if (counts.size > maxTrackedRuns) {
        const oldest = counts.keys().next().value;
        counts.delete(oldest);
      }
      return { ok: next <= maxToolCallsPerRun, count: next, limit: maxToolCallsPerRun };
    },
    count(runId) {
      return counts.get(runId || 'no-run-id') || 0;
    },
  };
}

/**
 * The before_tool_call handler the plugin registers. Lives here (not in the
 * plugin file) so vitest proves the exact function OpenClaw calls without
 * importing the OpenClaw SDK. Budget first: a run past its ceiling is blocked
 * from everything; then the gate's verdict.
 */
export function makeHandler({ role = 'act', maxToolCallsPerRun = 12 } = {}) {
  const budget = makeRunBudget({ maxToolCallsPerRun });
  return (event, ctx) => {
    const runId = (event && event.runId) || (ctx && ctx.runId) || null;
    const b = budget.take(runId);
    if (!b.ok) {
      return {
        block: true,
        blockReason: `budget: ${b.limit} tool calls per run reached -- this run stops here (three brakes, DR-0670)`,
      };
    }
    const toolName = (event && event.toolName) || '';
    const d = decide({ toolName, params: (event && event.params) || {} }, { role });
    return toHookResult(d, { toolName });
  };
}
