// =============================================================================
// skill-analytics — Layer 2 stewardship skill profile (sovereign)
// =============================================================================
// A faithful port of wf34 (34-skill-analytics-layer2). Two halves:
//   1. computeSkillStats() — DETERMINISTIC stats from the parsed transactions
//      (income, tithe rhythm, debt payments, savings/buffer). Pure, client-side,
//      ALWAYS available — it needs no NAS, so the downstream matched-services
//      rules engine keeps working even when the LLM narrative is offline.
//   2. analyzeSkills() — the one genuine LLM step: it asks the family's OWN local
//      model (qwen2.5:14b) through the sovereign same-origin /llm/chat path
//      (DR-0218 zero-n8n; infra/nas-llm/llm_server.py) for a warm, diagnostic
//      profile grounded ONLY in those deterministic stats. Never a vendor.
//
// HONEST OFFLINE (DR-0076): when the NAS model is unreachable, analyzeSkills
// returns { ok:false, stats, error } — it NEVER fabricates a profile. The caller
// still has the real stats (and matched-services still runs off them), so the
// flow degrades to "numbers without the narrative", never a broken page.
//
// Family-private per the TLC firewall: transactions never leave the family's own
// box — the local model is the only thing that sees them.
// =============================================================================
import { n8nAuthHeaders } from './n8n-base.js';

// The family's local 14b model (matches wf34). A constant so a test can prove the
// client routes LOCAL, not to a vendor.
export const SKILL_MODEL = 'qwen2.5:14b-instruct-q4_K_M';

// The sovereign LLM path (same as class-tutor / thought-finalizer). Relative,
// same-origin, never an absolute Funnel/vendor URL.
export function skillEndpoint() {
  return '/llm/chat';
}

const TITHE_RE = /tithe|church|ministry|first[\s-]?fruits|offering|donation|charity|nonprofit/i;
const DEBT_RE = /loan|mortgage|credit\s?card payment|cc payment|chase\s+card|amex|discover|capital one|student loan|auto loan/i;
const SAVE_RE = /transfer|savings|investment|brokerage|vanguard|fidelity|robinhood|emergency fund|buffer/i;

// Deterministic stats — a byte-faithful port of wf34's computation. Pure.
export function computeSkillStats(transactions) {
  const txns = Array.isArray(transactions) ? transactions : [];
  const totalAmount = txns.reduce((s, t) => s + (t.amount || 0), 0);
  const credits = txns.filter((t) => (t.amount || 0) > 0);
  const debits = txns.filter((t) => (t.amount || 0) < 0);
  const income = credits.reduce((s, t) => s + t.amount, 0);
  const spend = Math.abs(debits.reduce((s, t) => s + t.amount, 0));

  const titheTxns = txns.filter((t) => TITHE_RE.test(t.description || ''));
  const titheTotal = Math.abs(titheTxns.reduce((s, t) => s + t.amount, 0));
  const titheRate = income > 0 ? (titheTotal / income) : 0;

  const debtTxns = txns.filter((t) => DEBT_RE.test(t.description || ''));
  const debtTotal = Math.abs(debtTxns.reduce((s, t) => s + t.amount, 0));

  const saveTxns = txns.filter((t) => SAVE_RE.test(t.description || ''));
  const saveTotal = Math.abs(saveTxns.reduce((s, t) => s + t.amount, 0));

  const dates = txns.map((t) => t.date).filter(Boolean).sort();
  const dateRange = dates.length ? (dates[0] + ' to ' + dates[dates.length - 1]) : '(unknown)';

  return {
    transaction_count: txns.length,
    date_range: dateRange,
    income_total: income.toFixed(2),
    spend_total: spend.toFixed(2),
    net: totalAmount.toFixed(2),
    tithe_total: titheTotal.toFixed(2),
    tithe_count: titheTxns.length,
    tithe_rate_pct: (titheRate * 100).toFixed(1),
    debt_payment_total: debtTotal.toFixed(2),
    debt_payment_count: debtTxns.length,
    savings_transfer_total: saveTotal.toFixed(2),
    savings_transfer_count: saveTxns.length,
  };
}

// The system prompt — who the model is + the exact output contract. Kept pure +
// exported so it is unit-testable and byte-identical on the NAS.
export function skillAnalyticsSystemPrompt() {
  return [
    'You are the Skill Analytics module for the PoeTech Family OS. You read a household\'s bank transactions and produce a stewardship skill profile.',
    '',
    'Your tone: diagnostic and warm. Never judgmental. The reader is a real family looking at their own money. Speak as a trusted advisor who can see the patterns, name them honestly, and point toward growth without shame.',
    '',
    'Religion AND relationship per the EXCELLENCE-STANDARD foundation. Structured assessment (religion) in warm language (relationship).',
    '',
    'Return a JSON object with this exact shape:',
    '',
    '{',
    '  "profile": {',
    '    "budgeting_consistency": "strong" | "emerging" | "weak",',
    '    "tithe_rhythm": "consistent" | "intermittent" | "absent",',
    '    "debt_posture": "paying_down" | "steady" | "growing" | "none_visible",',
    '    "buffer_fund_discipline": "building" | "steady" | "draining" | "none_visible",',
    '    "income_stability": "steady" | "variable" | "volatile",',
    '    "alignment": "high" | "moderate" | "low"',
    '  },',
    '  "diagnostic_summary": "3-5 sentences. Tell the family what you see. Name strengths first. Then name 1-2 areas worth growing into. Warm tone.",',
    '  "strengths": ["2-3 specific things this family is doing well, named concretely"],',
    '  "gaps_to_consider": ["1-2 areas where the foundation principles suggest there is room to grow. Phrased as invitations not failures."]',
    '}',
    '',
    'Ground your assessment in the deterministic stats the user gives you — do NOT invent numbers, only interpret them. Return ONLY the JSON object. No markdown, no preamble, no closing remarks.',
  ].join('\n');
}

// The user turn — the real data the model interprets (stats + a sample of the
// transactions). Faithful to wf34's data section.
export function buildSkillAnalyticsUserPrompt(stats, transactions, { personaHint = '', monthsOfHistory = 0 } = {}) {
  const sample = (Array.isArray(transactions) ? transactions : []).slice(0, 30)
    .map((t) => ({ date: t.date, amount: t.amount, description: (t.description || '').slice(0, 80) }));
  return [
    'Here are the deterministic stats for this household — interpret these, do not invent numbers:',
    JSON.stringify(stats, null, 2),
    '',
    `Persona hint (may be empty): ${personaHint || '(none)'}`,
    `Months of history declared: ${monthsOfHistory || '(unknown)'}`,
    'First 30 transactions for context:',
    JSON.stringify(sample, null, 2),
    '',
    'Return ONLY the JSON object described in your instructions.',
  ].join('\n');
}

export function buildSkillAnalyticsPayload(transactions, opts = {}) {
  const stats = opts.stats || computeSkillStats(transactions);
  return {
    model: SKILL_MODEL,
    system: skillAnalyticsSystemPrompt(),
    messages: [{ role: 'user', content: buildSkillAnalyticsUserPrompt(stats, transactions, opts) }],
  };
}

// Extract the profile JSON from the model reply (it sometimes wraps in fences /
// prose). Faithful to wf34's `{ [\s\S]* }` extraction. Returns null on failure.
export function parseSkillProfile(reply) {
  const text = typeof reply === 'string' ? reply : String((reply && (reply.reply || reply.response)) || '');
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]);
    return obj && typeof obj === 'object' ? obj : null;
  } catch (_) {
    return null;
  }
}

// The orchestrator. Computes stats (always), asks the local model for the warm
// profile, parses it. Never throws. On ANY failure returns { ok:false, stats,
// error } so the caller keeps the real numbers and the flow degrades honestly.
export async function analyzeSkills(transactions, { signal, personaHint = '', monthsOfHistory = 0 } = {}) {
  const txns = Array.isArray(transactions) ? transactions : [];
  const stats = computeSkillStats(txns);
  if (txns.length === 0) {
    return { ok: false, stats, error: 'no transactions provided for analytics' };
  }
  try {
    const r = await fetch(skillEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...n8nAuthHeaders(true) },
      body: JSON.stringify(buildSkillAnalyticsPayload(txns, { stats, personaHint, monthsOfHistory })),
      signal,
    });
    const json = await r.json().catch(() => null);
    if (!r.ok || !json || json.ok === false) {
      return { ok: false, stats, error: (json && json.error) || `analytics unavailable (http_${r.status})` };
    }
    const profile = parseSkillProfile(json.reply || json.response || '');
    if (!profile || !profile.profile) {
      return { ok: false, stats, error: 'could not read the profile the model returned' };
    }
    return {
      ok: true,
      stats,
      profile: profile.profile,
      diagnostic_summary: profile.diagnostic_summary || '',
      strengths: Array.isArray(profile.strengths) ? profile.strengths : [],
      gaps_to_consider: Array.isArray(profile.gaps_to_consider) ? profile.gaps_to_consider : [],
    };
  } catch (e) {
    return { ok: false, stats, error: 'unreachable' };
  }
}
