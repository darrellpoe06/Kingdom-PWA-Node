// =============================================================================
// thought-finalizer — distill a deep-only reflection + extract its algorithm(s)
// =============================================================================
// "When I add a thought, REVIEW it and apply my 4th-dimensional framework so it
//  looks finished and is ready for teaching later — review all of them — and the
//  Eternal Algorithms just automatically add." (Darrell, 2026-06-24.)
//
// THE FRAMEWORK (his own, live in the Study — NOT invented here):
//   • 4th-dimensional = the DEEP SOURCE: the captured deep exchange (entry.deep).
//   • 3rd-dimensional = the PLAIN distillation of that source for a wider
//                       audience (entry.plain), ENDING with the practical
//                       "benefits" / so-what (matches the finished Metanoia / Joy
//                       templates, whose plain layer closes with "Practically: …").
//   • FINISHED = "DISTILLED · DEEP + PLAIN" — i.e. distillState(entry) === 'both'
//                — plus scripture refs + tags. UNFINISHED = "Needs a plain
//                version" (distillState === 'deep-only').
//
// THE JOB: for every reflection that NEEDS A PLAIN VERSION, generate the 3D plain
// distillation (with benefits) + scripture refs + tags from its deep source so it
// flips to finished, teaching-ready. Batch ALL unfinished in one pass (the
// "10 new thoughts -> review all 10" behavior). In the SAME pass, EXTRACT the
// eternal algorithm(s) the reflection distills to and auto-add them to the
// Eternal Algorithms library (idempotent; faithful extraction, never fabricated).
//
// FAITHFUL + ADDITIVE + REVERSIBLE (binding): the DEEP SOURCE is kept VERBATIM,
// always. The plain/scripture/tags are written into the reflection's own (empty)
// fields and a pre-fill snapshot is stored so a one-click revert restores the
// deep-only state. His meaning stays senior to the model's — he edits any field.
//
// SOVEREIGN, LOCAL-FIRST (the Charter; same posture as lib/class-tutor.js): the
// review runs on the family's LOCAL model (qwen2.5 on the NAS) via the same-origin
// '/n8n' rewrite. No vendor LLM is called from the client. HONEST OFFLINE
// (DR-0076): unreachable -> { ok:false }; nothing is applied and nothing is
// fabricated (the UI lets him write the plain by hand instead).
//
// BOUNDED automation (no autonomous automation without brakes): everything fires
// only inside the owner-pressed finalize run — there is NO always-on timer. The
// eternal-algorithm auto-add rides that same run and is idempotent (dedupe by
// name), so re-finalizing never duplicates a library entry.
//
// CIRCLE-SCOPED: the Study surface is gated to Darrell + Christina + Bishop Gwin
// in the monolith (isStudyCircleEmail); data is device-local per identity. This
// module owns logic only — the gate lives at the surface.
//
// Pure helpers are exported + unit-tested (proven-to-catch); the only I/O is the
// single fetch in askFinalizer, which fails soft.
// =============================================================================
import { n8nAuthHeaders } from './n8n-base.js';
import { normalizeFinalization } from './study-space.js';
import { normalizeAlgorithm } from './eternal-algorithms.js';

// The sovereign, local-first model (matches class-tutor / llm-review). A constant
// so a test can prove the client routes LOCAL, not to a vendor.
export const FINALIZE_MODEL = 'qwen2.5';

// Same-origin '/n8n' rewrite to the family NAS — a RELATIVE path, never an
// absolute Funnel/vendor URL in the client bundle (the class-tutor sovereignty
// gate; the rewrite also avoids the cross-origin throttle).
const FINALIZE_BASE = '/n8n';
export function finalizeEndpoint() {
  return `${FINALIZE_BASE.replace(/\/+$/, '')}/webhook/thought-finalize`;
}

// --- Finished / unfinished (the live badge state) ----------------------------

const has = (s) => !!(s && String(s).trim());

// "Needs a plain version": a captured deep source with no plain distillation yet.
export function needsDistillation(entry) {
  return !!entry && has(entry.deep) && !has(entry.plain);
}

// Finished = both layers present (the "DISTILLED · DEEP + PLAIN" badge).
export function isDistilled(entry) {
  return !!entry && has(entry.deep) && has(entry.plain);
}

// The batch set: every reflection that needs a plain version — what one press of
// "Finalize my thoughts" covers (the "review all 10" set).
export function pendingDistillation(entries) {
  return (Array.isArray(entries) ? entries : []).filter(needsDistillation);
}

// Honest progress roll-up over thoughts that have a deep source to distill.
export function distillationProgress(entries) {
  const withDeep = (Array.isArray(entries) ? entries : []).filter((e) => e && has(e.deep));
  const finished = withDeep.filter(isDistilled).length;
  return { total: withDeep.length, finished, pending: withDeep.length - finished };
}

// --- The model prompt (pure, exported so the NAS uses the IDENTICAL text) -----

export function finalizerSystemPrompt() {
  return [
    'You help finalize a private Study reflection. You are given its 4th-dimensional DEEP SOURCE (a captured deep exchange). You produce the finished, teaching-ready form WITHOUT changing the deep source and WITHOUT changing the author\'s meaning.',
    'Produce:',
    '- "plain": the 3rd-dimensional distillation — the same truth in plain language for a wider audience, what a wide room hears first. END it with the practical application (the "benefits" / so-what), e.g. a sentence beginning "Practically, …". One short paragraph.',
    '- "scripture": the Scripture reference(s) that genuinely anchor the reflection (e.g. "Romans 12:2; 2 Corinthians 10:4-5"). Leave EMPTY if there is no clear anchor — never attach a verse that does not fit.',
    '- "tags": 2-4 short lowercase tag words for pattern recognition.',
    '- "algorithms": the timeless principle(s) this reflection distills to — the "eternal algorithms." Usually 1, sometimes 2, sometimes 0 (return [] if none is genuinely present — do NOT invent one). Each: {"name": short framework name, "fourD":{"summary": the eternal/scriptural expression, "scripture": refs or ""}, "threeD":{"summary": how it plays out practically}, "outcome": the result you win with it, "tags":[...]}.',
    'SCRIPTURE RULES (strict): quote Scripture only from the ESV and only when sure of the wording. NEVER invent a verse, and never paraphrase a verse as if quoting it; if unsure, cite the reference only. Capitalize references to God (He, His, Him, the Father, the Son, the Holy Spirit). Never capitalize the adversary.',
    'Be faithful to the reflection\'s own intent; add no doctrine it does not contain. Be concise.',
    'Output STRICT JSON ONLY, no prose, exactly: {"plain":"...","scripture":"...","tags":["..."],"algorithms":[{"name":"...","fourD":{"summary":"...","scripture":"..."},"threeD":{"summary":"..."},"outcome":"...","tags":["..."]}]}',
  ].join('\n');
}

export function finalizerUserPrompt(entry) {
  const e = entry || {};
  const lines = ['REFLECTION TO FINALIZE:'];
  if (has(e.title)) lines.push(`Title: ${e.title.trim()}`);
  if (has(e.scripture)) lines.push(`Scripture the author noted: ${e.scripture.trim()}`);
  if ((e.tags || []).length) lines.push(`Tags the author noted: ${(e.tags || []).join(', ')}`);
  lines.push(`\n4th-dimensional DEEP SOURCE:\n${String(e.deep || '').trim()}`);
  return lines.join('\n');
}

export function buildFinalizePayload(entry) {
  return {
    model: FINALIZE_MODEL,
    id: (entry && entry.id) || null,
    system: finalizerSystemPrompt(),
    prompt: finalizerUserPrompt(entry),
  };
}

// --- Parse the model output (never throws) -----------------------------------
// Bad / partial / fenced output yields whatever parsed, or null when nothing
// usable came back (honest empty, never a painted result).
export function parseDistillation(raw) {
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
  const out = {
    plain: String(obj.plain || '').trim(),
    scripture: String(obj.scripture || '').trim(),
    tags: Array.isArray(obj.tags) ? obj.tags.filter(Boolean).map((t) => String(t).trim()).filter(Boolean) : [],
    algorithms: algorithmsFromResult(obj),
  };
  if (!out.plain && out.algorithms.length === 0) return null;
  return out;
}

// --- Eternal-algorithm extraction (the auto-add) -----------------------------

// Normalize the model's algorithm drafts into the EA library shape. Faithful:
// drops a draft with no name or no substance (never an empty/fabricated entry).
export function algorithmsFromResult(result) {
  const arr = result && Array.isArray(result.algorithms) ? result.algorithms : [];
  return arr
    .map((a) => ({
      name: String((a && a.name) || '').trim(),
      fourD: {
        summary: String((a && a.fourD && a.fourD.summary) || '').trim(),
        scripture: String((a && a.fourD && a.fourD.scripture) || (a && a.scripture) || '').trim(),
      },
      threeD: { summary: String((a && a.threeD && a.threeD.summary) || '').trim() },
      outcome: String((a && a.outcome) || '').trim(),
      tags: Array.isArray(a && a.tags) ? a.tags.filter(Boolean).map((t) => String(t).trim()).filter(Boolean) : [],
    }))
    .filter((a) => a.name && (a.fourD.summary || a.threeD.summary || a.outcome));
}

const nameKey = (n) => String(n || '').trim().toLowerCase();

// Idempotent merge of extracted algorithms into the EA library entries. Adds only
// algorithms whose NAME is not already present (dedupe across reflections + on
// re-finalize). Returns { entries, linkedIds, addedIds } — linkedIds = every EA
// id this reflection maps to (existing OR newly added), stored on the reflection
// for revert + no-duplicate; addedIds = the genuinely new ones (for the "N added"
// readout). Pure: the caller injects nowMs.
export function mergeAlgorithmsIntoLibrary(entries, drafts, { nowMs = 0 } = {}) {
  let list = Array.isArray(entries) ? entries.slice() : [];
  const linkedIds = [];
  const addedIds = [];
  (Array.isArray(drafts) ? drafts : []).forEach((d, i) => {
    const existing = list.find((e) => nameKey(e.name) === nameKey(d.name));
    if (existing) { linkedIds.push(existing.id); return; }
    const entry = normalizeAlgorithm(
      { ...d, links: [{ label: 'Auto-extracted from a Study reflection', where: 'Study › Workspace' }] },
      nowMs, i + 1,
    );
    list = [entry, ...list];
    linkedIds.push(entry.id);
    addedIds.push(entry.id);
  });
  return { entries: list, linkedIds, addedIds };
}

// --- Apply / revert (DEEP SOURCE NEVER TOUCHED) ------------------------------

// Write the distillation into the reflection's OWN fields so the live badge flips
// to "DISTILLED · DEEP + PLAIN". Returns a NEW entry; `deep` and `title` pass
// through unchanged. scripture/tags are filled ONLY when empty (never clobber the
// author's own). A pre-fill snapshot + the autofilled flags are recorded for a
// clean revert. `algorithmIds` link the reflection to its extracted EA entries.
export function applyDistillation(entry, result, { source = 'local', generatedAt = null, algorithmIds = [] } = {}) {
  const e = entry || {};
  const r = result || {};
  const hadPlain = has(e.plain);
  const hadScripture = has(e.scripture);
  const hadTags = Array.isArray(e.tags) && e.tags.length > 0;
  const plain = String(r.plain || '').trim();
  const newTags = Array.isArray(r.tags) ? r.tags.filter(Boolean).map((t) => String(t).trim()).filter(Boolean) : [];
  const nextScripture = hadScripture ? e.scripture : String(r.scripture || '').trim();
  const nextTags = hadTags ? e.tags : newTags;
  return {
    ...e,
    plain: hadPlain ? e.plain : (plain || e.plain || ''), // fill the empty 3D layer; never blank an existing one
    scripture: nextScripture,
    tags: nextTags,
    finalization: normalizeFinalization({
      status: 'distilled',
      autofilled: {
        plain: !hadPlain && !!plain,
        scripture: !hadScripture && has(nextScripture),
        tags: !hadTags && nextTags.length > 0,
      },
      original: { plain: e.plain || '', scripture: e.scripture || '', tags: Array.isArray(e.tags) ? e.tags : [] },
      algorithmIds: Array.isArray(algorithmIds) ? algorithmIds : [],
      source,
      generatedAt,
    }),
  };
}

// Reversible: restore ONLY the fields the finalizer auto-filled to their pre-fill
// snapshot, and clear the finalization layer. The author's deep source and any
// field he wrote himself are untouched. (Extracted EA library entries are left in
// place — they are independent library records, deletable in the EA tab.)
export function revertDistillation(entry) {
  const e = entry || {};
  const f = normalizeFinalization(e.finalization);
  const orig = f.original || { plain: '', scripture: '', tags: [] };
  return {
    ...e,
    plain: f.autofilled.plain ? orig.plain : e.plain,
    scripture: f.autofilled.scripture ? orig.scripture : e.scripture,
    tags: f.autofilled.tags ? orig.tags : e.tags,
    finalization: normalizeFinalization({}),
  };
}

// --- The only I/O: ask the local model (honest-offline) ----------------------
// Returns { ok, result, source } | { ok:false, error }. Never throws; any
// transport error or unreachable NAS yields ok:false so the UI offers the manual
// path instead of a fabricated distillation.
export async function askFinalizer(entry, { signal } = {}) {
  try {
    const r = await fetch(finalizeEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...n8nAuthHeaders(true) },
      body: JSON.stringify(buildFinalizePayload(entry)),
      signal,
    });
    if (!r.ok) return { ok: false, result: null, source: null, error: `http_${r.status}` };
    const json = await r.json().catch(() => null);
    if (json && json.ok === false) return { ok: false, result: null, source: null, error: json.error || 'unavailable' };
    const result = parseDistillation(json);
    if (!result) return { ok: false, result: null, source: null, error: 'empty' };
    return { ok: true, result, source: json && json.source === 'vendor' ? 'vendor' : 'local', error: null };
  } catch (e) {
    return { ok: false, result: null, source: null, error: 'unreachable' };
  }
}
