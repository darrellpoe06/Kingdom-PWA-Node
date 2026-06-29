// =============================================================================
// talk-about — the "TALK ABOUT THIS" engine (the EXPLAIN half of read-aloud)
// =============================================================================
// Darrell, 2026-06-29: "We also want to use our voice to TALK ABOUT the data when
// we ask for the voice to read." Read-aloud (lib/tts + use-read-aloud) recites
// the literal screen. This module is the other half: it generates a spoken
// EXPLANATION of the current surface — a summary, what it means, what stands out
// — in Ari's voice (lib/ari.js), which the caller then speaks aloud through the
// user's ONE chosen reading voice (so it lands in their cloned voice once that is
// live, or the labeled stand-in until then — all handled by use-read-aloud).
//
// GROUNDED IN REAL DATA, NEVER FABRICATED (DR-0076, the Verification Doctrine):
// the explanation is built from a DIGEST of what is actually on the screen (see
// lib/surface-digest.js). Two paths, in this order of trust:
//
//   1. AUTHORED (always available, deterministic, on-device): narrateDigest()
//      composes plain Ari-voiced sentences from the digest facts ONLY. It invents
//      nothing — every number it speaks came straight off the screen — and it is
//      honest when the surface is empty. This is the floor: it works offline, it
//      is pure, and it is unit-tested.
//
//   2. LIVE (richer, when the sovereign NAS A.I. is reachable): talkAboutSurface()
//      asks the family's local model (qwen2.5 on the NAS, via the same /n8n path
//      class-tutor uses) to phrase the SAME facts more naturally. The model is
//      told, hard, to use ONLY the given facts. As a belt-and-suspenders guard,
//      verifyNarrationGrounded() rejects ANY model reply that introduces a number
//      not present in the digest, and we fall back to the authored narration. So
//      a fabricated figure can never reach the speaker — proven by test.
//
// HONEST OFFLINE: like askTutor/askFinalizer, the live path never throws and never
// shows a fake answer; on any failure it returns the authored narration tagged
// source:'authored'. The caller can surface that ("Ari, on-device" vs "Ari,
// live") but the user always hears a true explanation of their real screen.
//
// SOVEREIGN, LOCAL-FIRST: the live endpoint is the same-origin '/n8n' relative
// path (never an absolute Funnel/vendor URL in the client bundle), matching the
// Charter gate proven for class-tutor.
// =============================================================================
import { ariSystemPrompt, ARI } from './ari.js';
import { n8nAuthHeaders } from './n8n-base.js';

// The sovereign, local-first model the explanation asks for (same as the tutor /
// finalizer). Kept as a constant so a test can prove the client routes local.
export const TALK_MODEL = 'qwen2.5';

// Same-origin base, pinned relative (NOT the absolute N8N_BASE Funnel) so the
// sovereignty gate holds: a relative path, never a vendor/Funnel URL client-side.
const TALK_BASE = '/n8n';

// The local-first endpoint: the same-origin /n8n rewrite to the family NAS.
export function talkAboutEndpoint() {
  return `${TALK_BASE.replace(/\/+$/, '')}/webhook/talk-about`;
}

// -----------------------------------------------------------------------------
// Grounding / anti-fabrication helpers (the heart of DR-0076 for this surface).
// -----------------------------------------------------------------------------

// Pull number-like tokens out of a string and normalize each to its bare digits
// (drop $, commas, %, sign, trailing zeros) so "$12,400", "12400", and "12,400.00"
// all compare equal. Returns an array of normalized digit strings.
export function numbersIn(str) {
  const raw = String(str == null ? '' : str).match(/\d[\d,]*\.?\d*/g) || [];
  return raw
    .map((t) => {
      let n = t.replace(/,/g, '');
      if (n.indexOf('.') !== -1) n = n.replace(/0+$/, '').replace(/\.$/, '');
      return n;
    })
    .filter((n) => n && /\d/.test(n));
}

// The set of numbers the digest legitimately contains — the ONLY numbers any
// narration of this surface is allowed to speak.
export function allowedNumbers(digest) {
  const d = digest || {};
  const parts = [];
  (d.facts || []).forEach((f) => { if (f) { parts.push(f.value, f.delta, f.status, f.label); } });
  (d.items || []).forEach((it) => { if (it) { parts.push(it.label, it.note); } });
  if (d.lead) parts.push(d.lead);
  if (d.note) parts.push(d.note);
  if (d.help) {
    parts.push(d.help.what, d.help.why);
    (d.help.how || []).forEach((h) => parts.push(h));
  }
  const set = new Set();
  parts.filter(Boolean).forEach((p) => numbersIn(p).forEach((n) => set.add(n)));
  return set;
}

// Does this narration speak only numbers that are actually on the screen?
// Returns { ok, stray } — stray is the list of fabricated/unsupported numbers.
export function verifyNarrationGrounded(text, digest) {
  const allowed = allowedNumbers(digest);
  const stray = numbersIn(text).filter((n) => !allowed.has(n));
  return { ok: stray.length === 0, stray };
}

// -----------------------------------------------------------------------------
// Authored narration — deterministic, pure, grounded, honest-if-empty.
// -----------------------------------------------------------------------------

function cap(s) {
  const t = String(s == null ? '' : s).trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// "A, B, and C" — a spoken-friendly list.
function listSentence(arr) {
  const a = (arr || []).map((x) => String(x).trim()).filter(Boolean);
  if (!a.length) return '';
  if (a.length === 1) return a[0];
  if (a.length === 2) return `${a[0]} and ${a[1]}`;
  return `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`;
}

// A delta like "+3%" / "-200" / "up 4" -> a spoken phrase.
function deltaPhrase(delta) {
  const s = String(delta == null ? '' : delta).trim();
  if (!s) return '';
  if (/^\+/.test(s)) return `up ${s.replace(/^\+\s*/, '')}`;
  if (/^-/.test(s)) return `down ${s.replace(/^-\s*/, '')}`;
  return s;
}

function clean(lines) {
  return lines.map((l) => String(l || '').trim()).filter(Boolean).join(' ');
}

/**
 * Compose a plain, Ari-voiced explanation of a surface from its digest. Pure and
 * deterministic. Speaks ONLY what the digest contains; honest when it is empty.
 * @param {object} digest - from lib/surface-digest.js
 * @param {{ lead?: boolean }} [opts] - lead:false drops the "Ari here" opener
 * @returns {string} spoken-ready narration
 */
export function narrateDigest(digest, { lead = true } = {}) {
  const d = digest || {};
  const title = (d.title && String(d.title).trim()) || 'this screen';
  const out = [];

  // HELP kind: explain what the surface IS (ties "talk about this" to the "?"
  // help so it can speak what a tab/tool is for, not just its numbers).
  if (d.kind === 'help' && d.help) {
    if (lead) out.push(`${ARI.name} here. ${d.lead ? d.lead : `Here is what ${title} is, in plain words.`}`);
    if (d.help.what) out.push(d.help.what);
    if (d.help.why) out.push(d.help.why);
    if (Array.isArray(d.help.how) && d.help.how.length) {
      out.push(`How you use it: ${listSentence(d.help.how)}`);
    }
    out.push(`That is ${title}. Test what matters — I can be wrong.`);
    return clean(out);
  }

  // DATA kinds (dashboard / generic).
  if (lead) out.push(`${ARI.name} here. Here is where things stand on ${title}.`);
  if (d.lead) out.push(d.lead);

  const facts = (d.facts || []).filter((f) => f && f.label && f.value != null && String(f.value).trim() !== '');
  const items = (d.items || []).filter((it) => it && it.label);

  if (d.empty || (!facts.length && !items.length)) {
    out.push(`There is nothing to show here yet${d.note ? `, ${d.note}` : ''}. Once there is real data on this screen, I will walk you through it.`);
    return clean(out);
  }

  if (facts.length) {
    const sentences = facts.map((f) => {
      const dp = deltaPhrase(f.delta);
      const st = f.status ? `, ${String(f.status).trim()}` : '';
      return `${cap(f.label)} is ${String(f.value).trim()}${dp ? `, ${dp}` : ''}${st}.`;
    });
    out.push(sentences.join(' '));
  }

  if (items.length) {
    const labels = items.map((it) => (it.note ? `${String(it.label).trim()} (${String(it.note).trim()})` : String(it.label).trim()));
    out.push(`A few worth a look: ${listSentence(labels)}.`);
  }

  if (d.note) out.push(d.note);
  return clean(out);
}

// -----------------------------------------------------------------------------
// Live (sovereign NAS) enrichment — phrase the SAME facts more naturally.
// -----------------------------------------------------------------------------

// The system prompt: Ari's identity first, then a strict "explain only these
// facts, invent nothing" task. Pure + exported so it is unit-testable and
// byte-identical on the NAS.
export function talkAboutSystemPrompt(digest) {
  const d = digest || {};
  const facts = (d.facts || [])
    .map((f) => `- ${f.label}: ${f.value}${f.delta ? ` (${f.delta})` : ''}${f.status ? ` [${f.status}]` : ''}`)
    .join('\n');
  const items = (d.items || [])
    .map((it) => `- ${it.label}${it.note ? `: ${it.note}` : ''}`)
    .join('\n');
  const task = [
    `You are explaining the "${d.title || 'current'}" screen to the person looking at it, out loud, in a few plain sentences.`,
    'Speak ABOUT the data: summarize it, say plainly what it means and what stands out. Do NOT just read the labels back.',
    'CRITICAL: use ONLY the facts listed below. Never invent or estimate a number, name, date, or trend that is not given. If a number is not listed, do not state it. If there is nothing to report, say so plainly and honestly.',
    'Keep it short, warm, and plain — a sentence or two of context, then the key facts, then anything worth a look. No headings, no markdown, no bullet lists: this is spoken aloud.',
    d.lead ? `What this screen is: ${d.lead}` : '',
    facts ? `The facts on the screen right now:\n${facts}` : 'There are no numbers to report on this screen right now.',
    items ? `Items on the screen:\n${items}` : '',
  ].filter(Boolean).join('\n\n');
  return ariSystemPrompt(task);
}

// The request body the NAS workflow expects (mirrors buildTutorPayload).
export function buildTalkPayload(digest) {
  return {
    model: TALK_MODEL,
    title: (digest && digest.title) || null,
    system: talkAboutSystemPrompt(digest),
    facts: (digest && digest.facts) || [],
  };
}

// Normalize whatever the NAS returns into { ok, text, source, error }. Never throws.
export function normalizeTalkReply(json) {
  if (!json || typeof json !== 'object' || json.ok === false) {
    return { ok: false, text: null, source: null, error: (json && json.error) || 'unavailable' };
  }
  const text = json.text || json.reply || json.response || json.message
    || (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) || null;
  if (!text || typeof text !== 'string') {
    return { ok: false, text: null, source: null, error: 'empty' };
  }
  return { ok: true, text: text.trim(), source: json.source || 'local', error: null };
}

/**
 * Get a spoken explanation of a surface. Tries the sovereign NAS model first; on
 * ANY failure — unreachable, empty, or a reply that fabricates a number not on
 * the screen — falls back to the deterministic authored narration. Never throws,
 * never fabricates, always returns a true explanation of the real digest.
 * @param {object} digest
 * @param {{ signal?: AbortSignal, fetchImpl?: typeof fetch }} [opts]
 * @returns {Promise<{ text: string, source: 'live'|'authored', error: string|null, rejected?: string }>}
 */
export async function talkAboutSurface(digest, { signal, fetchImpl } = {}) {
  const authored = narrateDigest(digest);
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) return { text: authored, source: 'authored', error: null };
  try {
    const r = await doFetch(talkAboutEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...n8nAuthHeaders(true) },
      body: JSON.stringify(buildTalkPayload(digest)),
      signal,
    });
    const json = await r.json().catch(() => null);
    if (!r.ok) return { text: authored, source: 'authored', error: `http_${r.status}` };
    const norm = normalizeTalkReply(json);
    if (!norm.ok) return { text: authored, source: 'authored', error: norm.error };
    // Belt-and-suspenders: a fabricated figure can never reach the speaker.
    const grounded = verifyNarrationGrounded(norm.text, digest);
    if (!grounded.ok) return { text: authored, source: 'authored', error: 'ungrounded', rejected: norm.text };
    return { text: norm.text, source: norm.source === 'vendor' ? 'live' : 'live', error: null };
  } catch (e) {
    return { text: authored, source: 'authored', error: 'unreachable' };
  }
}
