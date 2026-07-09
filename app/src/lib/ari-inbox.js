// =============================================================================
// ari-inbox — the human <-> Ari channel: start a thread in the app, Ari answers
// =============================================================================
// Declared by Darrell 2026-07-08: "a comprehensive process I can start inside the
// PoeTech App that lands inside your inbox for me to talk to you through the app."
//
// THE HONEST ARCHITECTURE (surface-premise-conflicts; DR-0088). The app cannot
// deliver a message to a live Claude Code session on the laptop. What it CAN do —
// and what is better because it is durable + sovereign — is a persistent thread on
// the Supabase bus: you open a thread -> it persists -> the ROUTER answers it
// (local qwen by default, Claude when the task earns it; DR-0073/DR-0088) -> the
// reply lands in the same thread, in-app. Not a fragile pipe to one session; a
// two-way channel to the AI TIER. Human-initiated request-response — NOT a
// self-triggering timer loop, so it needs no three-brakes (a message only sends
// when YOU send one).
//
// OPPORTUNITIES + CONSTRAINTS ARE FIRST-CLASS (Darrell's standing instruction —
// "when we add features find the opportunities and constraints"). Every thread
// carries them as structured data, so the process itself always surfaces them.
//
// ARI HONESTY IS A GATE, NOT A HOPE (VISION-of-Ari from ari.js: "a made tool that
// can be wrong — honest about that"). validateMessage() FAILS an Ari reply that
// does not name WHICH engine answered (routedTo), and Ari replies default to
// unverified:true unless they carry evidence (Verification Doctrine, DR-0076).
// Proven-to-catch in ari-inbox.test.js.
//
// PURE (no React, no network). The surface (AriInbox.jsx) renders it; the live
// persistence + router reply loop are the DR-0088 executor (next pass).
// =============================================================================

// --- Route target (mirrors the provider router; DR-0073 local-first) ----------
export const ROUTE_TARGETS = [
  { id: 'auto',   label: 'Ari decides (router)', hint: 'Local qwen for most; Claude when it earns it.' },
  { id: 'local',  label: 'Sovereign only (local qwen)', hint: '$0, on-mesh, never leaves.' },
  { id: 'claude', label: 'Claude (reasoning tier)', hint: 'Best reasoning; spends the weekly budget.' },
];
export const ROUTE_TARGET_IDS = ROUTE_TARGETS.map((r) => r.id);
export function routeLabel(id) { return (ROUTE_TARGETS.find((r) => r.id === id) || {}).label || id; }

// --- Thread status ------------------------------------------------------------
export const THREAD_STATUSES = [
  { id: 'open',     label: 'Open',     tone: 'attention' }, // awaiting a reply (yours or Ari's)
  { id: 'answered', label: 'Answered', tone: 'good' },
  { id: 'resolved', label: 'Resolved', tone: 'idle' },
  { id: 'archived', label: 'Archived', tone: 'idle' },
];
export const THREAD_STATUS_IDS = THREAD_STATUSES.map((s) => s.id);
export function statusTone(id) { return (THREAD_STATUSES.find((s) => s.id === id) || {}).tone || 'idle'; }
export function statusLabel(id) { return (THREAD_STATUSES.find((s) => s.id === id) || {}).label || id || 'Unknown'; }

// Ari's responsibilities IN THE INBOX — the report/behaviour the surface shows, so
// "Ari's responsibility" is stated where the user meets him (Darrell's ask).
export const ARI_RESPONSIBILITIES = [
  'Answer plainly and honestly — say what is, and cite where it comes from.',
  'Surface the opportunities AND the constraints of what you ask — every thread.',
  'Flag uncertainty; a made tool can be wrong. Never claim "done" without evidence.',
  'Route sovereign-first (local qwen); reach for Claude only when the task earns it.',
  'Never auto-commit a consequential change — the governor decides the bright lines.',
  'Point past himself to the Most High; hold the Godhead even-handed (ari.js).',
];

// --- Constructors -------------------------------------------------------------
let tSeq = 0; let mSeq = 0;
function nextThreadId() { tSeq += 1; return `thr-${tSeq}`; }
function nextMsgId() { mSeq += 1; return `msg-${mSeq}`; }

export function makeOpportunity(text) { return { text: String(text || '').trim() }; }
export function makeConstraint(text) { return { text: String(text || '').trim() }; }

export function makeThread(p = {}) {
  return {
    id:            p.id || nextThreadId(),
    subject:       (p.subject && String(p.subject).trim()) || '',
    openedBy:      p.openedBy ?? null,          // the real signed-in identity (no fabricated names)
    status:        THREAD_STATUS_IDS.includes(p.status) ? p.status : 'open',
    routeTarget:   ROUTE_TARGET_IDS.includes(p.routeTarget) ? p.routeTarget : 'auto',
    opportunities: Array.isArray(p.opportunities) ? p.opportunities.map((o) => makeOpportunity(o.text ?? o)) : [],
    constraints:   Array.isArray(p.constraints) ? p.constraints.map((c) => makeConstraint(c.text ?? c)) : [],
    createdAt:     p.createdAt ?? null,
  };
}

export function makeMessage(p = {}) {
  const from = p.from === 'ari' ? 'ari' : 'you';
  return {
    id:        p.id || nextMsgId(),
    threadId:  p.threadId ?? null,
    from,
    body:      (p.body && String(p.body).trim()) || '',
    routedTo:  p.routedTo ?? null,              // for Ari replies: which engine actually answered
    unverified: from === 'ari' ? (p.unverified !== false) : false, // Ari defaults unverified unless evidence
    evidence:  p.evidence ?? null,
    ts:        p.ts ?? null,
  };
}

// --- Gates (proven-to-catch) --------------------------------------------------
export function validateThread(t) {
  const errors = [];
  if (!t || typeof t !== 'object') return { ok: false, errors: ['thread is not an object'] };
  if (!t.subject || !String(t.subject).trim()) errors.push('subject is required');
  if (!THREAD_STATUS_IDS.includes(t.status)) errors.push(`unknown status "${t.status}"`);
  if (!ROUTE_TARGET_IDS.includes(t.routeTarget)) errors.push(`unknown route target "${t.routeTarget}"`);
  if (!Array.isArray(t.opportunities)) errors.push('opportunities must be an array');
  if (!Array.isArray(t.constraints)) errors.push('constraints must be an array');
  return { ok: errors.length === 0, errors };
}

export function validateMessage(m) {
  const errors = [];
  if (!m || typeof m !== 'object') return { ok: false, errors: ['message is not an object'] };
  if (!m.body || !String(m.body).trim()) errors.push('body is required');
  if (m.from !== 'you' && m.from !== 'ari') errors.push(`unknown sender "${m.from}"`);
  // Honesty gate: an Ari reply MUST name which engine answered.
  if (m.from === 'ari' && !m.routedTo) errors.push('an Ari reply MUST record routedTo (which engine answered)');
  // Verification Doctrine: an Ari reply marked verified MUST carry evidence.
  if (m.from === 'ari' && m.unverified === false && !m.evidence) {
    errors.push('an Ari reply marked verified needs evidence');
  }
  return { ok: errors.length === 0, errors };
}

// --- Derivations (surface + tests share) --------------------------------------
// Threads waiting on Ari = open, and the last message is from you.
export function awaitingAri(threads, messagesByThread = {}) {
  return (threads || []).filter((t) => {
    if (t.status !== 'open') return false;
    const msgs = messagesByThread[t.id] || [];
    const last = msgs[msgs.length - 1];
    return last ? last.from === 'you' : true;
  });
}

export function summarizeInbox(threads) {
  const list = threads || [];
  const byStatus = {};
  for (const s of THREAD_STATUS_IDS) byStatus[s] = 0;
  let withOpps = 0; let withConstraints = 0;
  for (const t of list) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    if ((t.opportunities || []).length) withOpps += 1;
    if ((t.constraints || []).length) withConstraints += 1;
  }
  return { total: list.length, byStatus, withOpps, withConstraints };
}
