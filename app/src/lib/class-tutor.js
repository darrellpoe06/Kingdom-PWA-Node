// =============================================================================
// class-tutor — the per-week A.I. tutor for "Learning A.I. The Way"
// =============================================================================
// Goal (Darrell 2026-06-15): a SOLO learner finishes all 8 weeks without Darrell
// present. The tutor walks them through that week's activity.
//
// SOVEREIGN, LOCAL-FIRST (the Charter): the tutor routes through the family
// same-origin /n8n rewrite to Ollama on the NAS — model `qwen2.5`. No vendor
// LLM is called from the client; vendor escalation, if ever, happens
// server-side per the Charter and within budget. The endpoint here is always
// the local relative path.
//
// 2026-06-17: the shared lib/n8n-base.js default was repointed to the Tailscale
// Funnel directly (the Vercel "/n8n" rewrite can't TLS-handshake to *.ts.net ->
// 502 for the finance/imported/wake surfaces). The tutor does NOT follow that
// move: its Charter gate (class-tutor.test.js, DR-0076) requires a same-origin
// RELATIVE path and forbids an absolute Funnel/vendor URL in the client bundle.
// So the tutor pins its own '/n8n' base here instead of importing N8N_BASE.
// (Its NAS reachability is a separate open item — see the Concern board.)
//
// HONEST OFFLINE (DR-0076): when the NAS route isn't reachable, askTutor returns
// { ok:false } and the UI falls back to the AUTHORED walkthrough (the week's
// lesson + activity + guiding questions). It never fabricates an LLM answer and
// never shows a dead button — same posture as LlmHealth ("showing nothing rather
// than guessing").
//
// The class itself teaches this: the tutor is a tool, tested and verified, not a
// source of truth (week 1 + week 3). Its replies carry the same caution.
// =============================================================================
import { n8nAuthHeaders } from './n8n-base.js';

// The tutor's own same-origin base. Pinned to the relative '/n8n' rewrite (NOT
// the shared N8N_BASE, which now defaults to the absolute Funnel) so the Charter
// sovereignty gate holds: a relative path, never an absolute Funnel/vendor URL.
const TUTOR_BASE = '/n8n';

// The sovereign, local-first model the tutor asks for. Kept as a constant so the
// test can prove the client routes local (qwen2.5), not to a vendor.
export const TUTOR_MODEL = 'qwen2.5';

// The local-first endpoint: the same-origin /n8n rewrite to the family NAS.
// Never an absolute vendor or Funnel URL (the rewrite avoids cross-origin
// throttling; see lib/n8n-base.js).
export function tutorEndpoint() {
  return `${TUTOR_BASE.replace(/\/+$/, '')}/webhook/class-tutor`;
}

// The per-week system prompt. Grounds the tutor in THIS week's real authored
// content and in the class's own posture (tutor not ghostwriter, verify don't
// trust). Kept pure + exported so it is unit-testable and identical on the NAS.
export function tutorSystemPrompt(module, courseMeta = null) {
  const m = module || {};
  const fac = m.facilitator || {};
  const points = (fac.talkingPoints || []).map((t) => `- ${t}`).join('\n');
  const anchor = m.anchor ? `${m.anchor.ref} — ${m.anchor.theme}` : '';
  // The intro + posture default to the youth class; a second course (the broadcast
  // media-team class) passes its own courseMeta so the SAME tutor engine introduces
  // itself correctly per course. The tutor/ghostwriter + test-and-verify discipline
  // is held for BOTH courses (it's the platform's posture, not a per-class option).
  const intro = (courseMeta && courseMeta.intro)
    || 'You are a patient, encouraging A.I. tutor for a church youth class called "Learning A.I. The Way."';
  const posture = (courseMeta && courseMeta.posture)
    || 'You are guiding ONE student, on their own, through this week\'s activity. Be warm, plain-spoken, and brief.';
  return [
    intro,
    posture,
    'You are a tutor, NOT a ghostwriter: help them think and do the work themselves; never just hand them the answer.',
    'Remind them, when it fits, to TEST and VERIFY what any A.I. (including you) tells them — you can be confidently wrong.',
    'Keep faith natural and never preachy. Capitalize references to God; do not capitalize the adversary.',
    '',
    `THIS WEEK — ${m.title || ''}`,
    m.bigIdea ? `Big idea: ${m.bigIdea}` : '',
    m.lesson ? `Lesson: ${m.lesson}` : '',
    m.inApp ? `Their hands-on activity this week: ${m.inApp}` : '',
    anchor ? `Scripture anchor: ${anchor}` : '',
    points ? `Key points to draw out:\n${points}` : '',
    '',
    'Walk them through the activity one small step at a time. Ask a question, wait for their answer, then guide the next step.',
  ].filter(Boolean).join('\n');
}

// Build the request body the NAS workflow expects. `messages` is the running
// chat ([{ role:'user'|'assistant', content }]). The system prompt is derived
// from the module so the NAS never has to carry curriculum copy.
export function buildTutorPayload(module, messages = [], courseMeta = null) {
  return {
    model: TUTOR_MODEL,
    week: module?.id || null,
    system: tutorSystemPrompt(module, courseMeta),
    messages: Array.isArray(messages)
      ? messages.filter((x) => x && x.content).map((x) => ({ role: x.role === 'assistant' ? 'assistant' : 'user', content: String(x.content) }))
      : [],
  };
}

// Normalize whatever the NAS returns into { ok, reply, source }. Never throws.
export function normalizeTutorReply(json) {
  if (!json || typeof json !== 'object' || json.ok === false) {
    return { ok: false, reply: null, source: null, error: (json && json.error) || 'unavailable' };
  }
  const reply = json.reply || json.response || json.message || (json.choices && json.choices[0]?.message?.content) || null;
  if (!reply || typeof reply !== 'string') {
    return { ok: false, reply: null, source: null, error: 'empty' };
  }
  return { ok: true, reply: reply.trim(), source: json.source || 'local', error: null };
}

// Ask the tutor. Local-first, honest-offline. Returns the normalized shape; on
// any network error returns { ok:false } so the caller shows the authored
// walkthrough instead of a fake answer.
export async function askTutor(module, messages = [], { signal, courseMeta = null } = {}) {
  try {
    const r = await fetch(tutorEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...n8nAuthHeaders(true) },
      body: JSON.stringify(buildTutorPayload(module, messages, courseMeta)),
      signal,
    });
    const json = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, reply: null, source: null, error: `http_${r.status}` };
    return normalizeTutorReply(json);
  } catch (e) {
    return { ok: false, reply: null, source: null, error: 'unreachable' };
  }
}
