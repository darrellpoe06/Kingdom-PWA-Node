// =============================================================================
// thought-finalizer — apply the 4th-dimensional framework to a private thought
// =============================================================================
// "When I add a thought, REVIEW it and apply my 4th-dimensional framework so it
//  looks finished and is ready for teaching later — and if I added 10 new
//  thoughts, review all 10." (Darrell, 2026-06-24.)
//
// THE GROUNDED FRAMEWORK (not invented here — it is Darrell's own, already in
// lib/eternal-algorithms.js and the Study): the biblical patterns are "eternal
// algorithms" read on TWO sides plus their result —
//   • 4D — the 4th-dimensional expression: eternal / scriptural / spiritual,
//          carrying ACCURATE Scripture references (no fabrication).
//   • 3D — the 3rd-dimensional expression: practical / temporal / how it plays
//          out in this-world life and work.
//   • OUTCOME — first-class: the result of living it, the "you win with it."
// A thought is "finalized / teaching-ready" once it carries all three, accepted.
//
// FAITHFUL + ADDITIVE + REVERSIBLE (binding): the finalizer NEVER overwrites the
// person's own words (the entry's title / deep / plain). It writes only the
// SEPARATE `finalization` layer (study-space.js owns that shape). A suggestion
// is exactly that — a suggestion the owner reviews, edits, and accepts (or
// dismisses, restoring 'unfinalized'). His meaning is senior to the model's.
//
// SOVEREIGN, LOCAL-FIRST (the Charter; same posture as lib/class-tutor.js): the
// review runs on the family's LOCAL model (qwen2.5 on the NAS) through the
// same-origin sovereign LLM path '/llm/chat' (DR-0218 zero-n8n; the FastAPI
// wrapper infra/nas-llm/llm_server.py), NOT an n8n webhook. No vendor LLM is
// called from the client; any vendor escalation happens server-side, within
// budget, only on an unmet need.
//
// ON-DEMAND, NOT AUTO-FIRE (binding — no autonomous automation without the three
// brakes): finalizing is a button the owner presses ("Finalize my thoughts"),
// never a timer that fires on every add. Batch = the owner asks once and every
// unfinalized thought is reviewed in that one pass.
//
// HONEST OFFLINE (DR-0076 / Verification Doctrine): when the NAS model is not
// reachable, askFinalizer returns { ok:false } — it never fabricates a treatment
// and never paints a finished thought. The UI then offers the framework scaffold
// for the owner to fill by hand (source:'manual'), so the surface is useful even
// before the NAS workflow is wired.
//
// WORD-FIRST: the system prompt requires ESV-accurate Scripture, forbids invented
// or paraphrased-as-quoted verses, capitalizes references to God, and never
// capitalizes the adversary (the repo typographic + scripture standards).
//
// Pure helpers are exported + unit-tested (proven-to-catch); the only I/O is the
// single fetch in askFinalizer, which fails soft.
// =============================================================================
import { n8nAuthHeaders } from './n8n-base.js';
import { normalizeFinalization } from './study-space.js';

// The sovereign, local-first model the finalizer asks for (matches class-tutor /
// llm-review). A constant so a test can prove the client routes LOCAL, not vendor.
export const FINALIZE_MODEL = 'qwen2.5';

// The sovereign LLM path (DR-0218 zero-n8n): a same-origin RELATIVE route to the
// family NAS's OWN Ollama through the FastAPI wrapper (infra/nas-llm/llm_server.py)
// — never an absolute Funnel/vendor URL in the client bundle (the class-tutor
// sovereignty gate). Degrades to the manual scaffold until that server + its
// /llm/* Caddy route are stood up.
export function finalizeEndpoint() {
  return '/llm/chat';
}

// --- The teaching-ready gate -------------------------------------------------

// All three framework parts present? (4D summary, 3D summary, OUTCOME). Scripture
// is allowed to be empty — not every thought has a single anchor, and inventing
// one would violate the Word-first / no-fabrication rule.
export function hasAllParts(fin) {
  const f = normalizeFinalization(fin);
  return !!(f.fourD.summary && f.threeD.summary && f.outcome);
}

// A thought is FINALIZED (teaching-ready) only when the owner has ACCEPTED a
// treatment that carries all three parts. A mere suggestion is not finalized.
export function isFinalized(entry) {
  const f = normalizeFinalization(entry && entry.finalization);
  return f.status === 'accepted' && hasAllParts(f);
}

// Teaching-ready is the same gate, named for the content-engine handoff: only an
// accepted, complete treatment becomes lesson/course material downstream.
export const isTeachingReady = isFinalized;

// A real thought worth finalizing = has any of the owner's own words. Empty seed
// scaffolds and blank rows are skipped so the batch count is honest.
export function isReviewableThought(entry) {
  if (!entry) return false;
  return !!((entry.title && entry.title.trim())
    || (entry.deep && entry.deep.trim())
    || (entry.plain && entry.plain.trim()));
}

// The batch set: every reviewable thought NOT yet finalized (accepted). This is
// the "review all 10" set — what one press of "Finalize my thoughts" covers.
export function unfinalizedThoughts(entries) {
  return (Array.isArray(entries) ? entries : [])
    .filter(isReviewableThought)
    .filter((e) => !isFinalized(e));
}

// A small progress roll-up for the surface header.
export function finalizationProgress(entries) {
  const real = (Array.isArray(entries) ? entries : []).filter(isReviewableThought);
  const finalized = real.filter(isFinalized).length;
  const suggested = real.filter((e) => normalizeFinalization(e.finalization).status === 'suggested' && !isFinalized(e)).length;
  return { total: real.length, finalized, suggested, pending: real.length - finalized };
}

// --- The model prompt (pure, exported so the NAS uses the IDENTICAL text) -----

export function finalizerSystemPrompt() {
  return [
    'You help finalize a private thought into teaching-ready form using the "Eternal Algorithms" 4th-dimensional framework. You express the SAME thought in a finished shape; you NEVER replace or overrule the person\'s meaning.',
    'Produce three parts:',
    '- "fourD": the 4th-dimensional expression — the eternal / scriptural / spiritual reading of the thought.',
    '- "fourD.scripture": the Scripture reference(s) that genuinely anchor it (e.g. "James 1:2-4"). Leave it EMPTY if the thought has no clear anchor — never attach a verse that does not fit.',
    '- "threeD": the 3rd-dimensional expression — how it plays out practically in this-world life and work.',
    '- "outcome": the result of living it — the "you win with it."',
    'SCRIPTURE RULES (strict): quote Scripture only from the ESV and only when you are sure of the wording. NEVER invent a verse, and never paraphrase a verse as if you were quoting it. If you are unsure of the exact words, cite the reference only. Capitalize references to God (He, His, Him, the Father, the Son, the Holy Spirit). Never capitalize the adversary (satan, the devil, the accuser).',
    'Be faithful to the thought\'s own intent. Do not add doctrine it does not contain. Be concise; one tight paragraph per part.',
    'Output STRICT JSON ONLY, no prose, exactly: {"fourD":{"summary":"...","scripture":"..."},"threeD":{"summary":"..."},"outcome":"..."}',
  ].join('\n');
}

// Build the per-thought user prompt from the owner's own words. Any of the entry
// fields may be empty; the model works from whatever is present.
export function finalizerUserPrompt(entry) {
  const e = entry || {};
  const lines = ['THOUGHT TO FINALIZE:'];
  if (e.title && e.title.trim()) lines.push(`Title: ${e.title.trim()}`);
  if (e.scripture && e.scripture.trim()) lines.push(`Scripture the author noted: ${e.scripture.trim()}`);
  if (e.deep && e.deep.trim()) lines.push(`\nThe full / deep version:\n${e.deep.trim()}`);
  if (e.plain && e.plain.trim()) lines.push(`\nThe plain version:\n${e.plain.trim()}`);
  if ((e.tags || []).length) lines.push(`\nTags: ${(e.tags || []).join(', ')}`);
  return lines.join('\n');
}

// The request body the sovereign /llm/chat server expects (mirrors
// buildTutorPayload): { model, system, messages }. The owner's own words go in
// the single user turn; the framework rules live in the system prompt.
export function buildFinalizePayload(entry) {
  return {
    model: FINALIZE_MODEL,
    id: (entry && entry.id) || null,
    system: finalizerSystemPrompt(),
    messages: [{ role: 'user', content: finalizerUserPrompt(entry) }],
  };
}

// --- Parse the model output into a clean suggestion (never throws) -----------
// The load-bearing "trust nothing unverified" boundary: bad / partial / fenced
// output yields a normalized treatment with whatever parts parsed, or null when
// nothing usable came back. (Same robustness as llm-review.parseFindings.)
export function parseSuggestion(raw) {
  if (raw == null) return null;
  let text = typeof raw === 'string'
    ? raw
    : String((raw && (raw.response || raw.reply || raw.text || raw.message)) || '');
  text = text.trim();
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  if (text[0] !== '{' && text[0] !== '[') {
    const s = text.indexOf('{');
    const e = text.lastIndexOf('}');
    if (s >= 0 && e > s) text = text.slice(s, e + 1);
  }
  let obj;
  try { obj = JSON.parse(text); } catch { return null; }
  if (!obj || typeof obj !== 'object') return null;
  const fourD = obj.fourD && typeof obj.fourD === 'object' ? obj.fourD : {};
  const threeD = obj.threeD && typeof obj.threeD === 'object' ? obj.threeD : {};
  const out = {
    fourD: {
      summary: String(fourD.summary || '').trim(),
      scripture: String(fourD.scripture || obj.scripture || '').trim(),
    },
    threeD: { summary: String(threeD.summary || '').trim() },
    outcome: String(obj.outcome || '').trim(),
  };
  // Nothing usable at all -> null (honest empty, not a painted treatment).
  if (!out.fourD.summary && !out.threeD.summary && !out.outcome) return null;
  return out;
}

// --- Apply / accept / dismiss (pure; ORIGINAL WORDS NEVER TOUCHED) -----------

// Attach a model suggestion as the entry's finalization layer, status
// 'suggested'. Returns a NEW entry; title/deep/plain/scripture are passed through
// UNCHANGED. `source` defaults to 'local' (qwen2.5 on the NAS).
export function applySuggestion(entry, suggestion, { source = 'local', generatedAt = null } = {}) {
  const e = entry || {};
  const s = suggestion || {};
  return {
    ...e,
    finalization: normalizeFinalization({
      ...(e.finalization || {}),
      status: 'suggested',
      fourD: { summary: (s.fourD && s.fourD.summary) || '', scripture: (s.fourD && s.fourD.scripture) || '' },
      threeD: { summary: (s.threeD && s.threeD.summary) || '' },
      outcome: s.outcome || '',
      source,
      generatedAt: generatedAt || null,
      acceptedAt: null,
    }),
  };
}

// Owner-edited fields (the review pass). Merges edits over the current layer
// WITHOUT changing status — used while he tweaks a suggestion before accepting.
export function editFinalization(entry, edits = {}) {
  const e = entry || {};
  const cur = normalizeFinalization(e.finalization);
  const merged = {
    ...cur,
    ...('outcome' in edits ? { outcome: edits.outcome } : {}),
    fourD: {
      summary: 'fourSummary' in edits ? edits.fourSummary : cur.fourD.summary,
      scripture: 'scripture' in edits ? edits.scripture : cur.fourD.scripture,
    },
    threeD: { summary: 'threeSummary' in edits ? edits.threeSummary : cur.threeD.summary },
    // An owner edit makes the treatment his — provenance becomes 'manual' unless
    // it was already accepted by him.
    source: cur.source === 'manual' ? 'manual' : (cur.status === 'accepted' ? cur.source : 'manual'),
  };
  return { ...e, finalization: normalizeFinalization(merged) };
}

// Accept the treatment -> teaching-ready. `acceptedAt` is injected by the caller
// (app runtime owns Date.now; the lib stays testable). Original words untouched.
export function acceptFinalization(entry, acceptedAt = null) {
  const e = entry || {};
  return {
    ...e,
    finalization: normalizeFinalization({
      ...normalizeFinalization(e.finalization),
      status: 'accepted',
      acceptedAt: acceptedAt || null,
    }),
  };
}

// Reversible: clear the treatment back to 'unfinalized'. The owner's own words
// are, as always, never affected — only the added layer is reset.
export function clearFinalization(entry) {
  const e = entry || {};
  return { ...e, finalization: normalizeFinalization({}) };
}

// --- The content-engine handoff ----------------------------------------------
// An accepted, teaching-ready thought maps cleanly onto an Eternal Algorithm
// (name + 4D + 3D + outcome). This is the bridge to the content engine: a
// finalized thought becomes a framework entry, then lesson/course material. Pure;
// returns null for a thought that is not yet teaching-ready.
export function toEternalAlgorithmDraft(entry) {
  if (!isTeachingReady(entry)) return null;
  const f = normalizeFinalization(entry.finalization);
  return {
    name: (entry.title && entry.title.trim()) || (entry.plain || entry.deep || '').trim().slice(0, 80),
    fourD: { summary: f.fourD.summary, scripture: f.fourD.scripture },
    threeD: { summary: f.threeD.summary },
    outcome: f.outcome,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    links: [{ label: 'Finalized in Study', where: 'Study › Finalize' }],
  };
}

// --- The only I/O: ask the local model (honest-offline) ----------------------
// Returns { ok, suggestion, source } | { ok:false, error }. Never throws; any
// transport error or unreachable NAS yields ok:false so the UI offers the manual
// scaffold instead of a fabricated treatment.
export async function askFinalizer(entry, { signal } = {}) {
  try {
    const r = await fetch(finalizeEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...n8nAuthHeaders(true) },
      body: JSON.stringify(buildFinalizePayload(entry)),
      signal,
    });
    if (!r.ok) return { ok: false, suggestion: null, source: null, error: `http_${r.status}` };
    const json = await r.json().catch(() => null);
    if (json && json.ok === false) return { ok: false, suggestion: null, source: null, error: json.error || 'unavailable' };
    const suggestion = parseSuggestion(json);
    if (!suggestion) return { ok: false, suggestion: null, source: null, error: 'empty' };
    return { ok: true, suggestion, source: json && json.source === 'vendor' ? 'vendor' : 'local', error: null };
  } catch (e) {
    return { ok: false, suggestion: null, source: null, error: 'unreachable' };
  }
}
