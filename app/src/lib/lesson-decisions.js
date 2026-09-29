// =============================================================================
// lesson-decisions — the Governor reviews every version and decides: choose
// one, merge part by part, or take all with the best part of each (DR-0672)
// =============================================================================
// Darrell 2026-09-29: "When we have all same lessons those end in PoeTech for
// me to review their and the decide on which one or merge 2 of them or all of
// them..."
//
// THE CONTRACT IS THE BUILDER'S (DR-0669; its migration 0240 defines
// public.lesson_versions and public.lesson_decisions; lesson_builder.py
// `assemble` reads the decision). A build that wrote more than one version is
// tagged `awaiting-review` and ships nothing until he decides. A decision is
// one INSERT into lesson_decisions:
//   build_id, teaching_row_id, instance_id  — the build he decided on
//   version_id   the base: the chosen version, or the one every part not
//                picked comes from
//   merge_map    { part: version id } — null when he takes one version
//   edits        { part: text } — text parts only
// born `decided`; the builder claims it, assembles the composite, re-runs EVERY
// gate on it, and writes back `building` → `shipped` (lesson_id, branch,
// pr_url) or `gate-failed` / `failed` with gate_result.failures
// [{ check, part, detail }]. Nothing ships on a failed gate.
//
// THE PARTS are the builder's PART_KEYS: title, bigIdea, lesson_intro, each
// movement (`movements.<i>`, 0-based, renumbered by the builder), lesson_close,
// each band (`levels.child|youth|teen|senior`), quiz, benefits, facilitator;
// anything else (anchor, inApp, slug, placement, dr_summary) comes from the base.
//
// SCRIPTURE IS LOCKED. The builder refuses an edit whose double-quoted spans
// differ from the part's (lesson_builder.py quoted_spans_of): every "…" span,
// in order. The editor here only offers the words between quoted spans, and
// the publish contract refuses any edit that changes, adds or drops one.
// Pure except fetchReviewQueue and publishDecision (Supabase injected).
// =============================================================================
import { mayCompareVersions, normalizeVersion, LESSON_VERSION_COLUMNS, LESSON_VERSIONS_TABLE } from './lesson-versions.js';

export const LESSON_DECISIONS_TABLE = 'lesson_decisions';
// public.lesson_decisions as DR-0669's migration 0240 defines it. Pinned by the test.
export const LESSON_DECISION_COLUMNS = Object.freeze([
  'id', 'build_id', 'teaching_row_id', 'instance_id', 'version_id', 'merge_map', 'edits', 'decided_by',
  'decided_at', 'status', 'gate_result', 'lesson_id', 'branch', 'pr_url', 'processed_at',
]);
export const DECISION_MODES = Object.freeze(['choose', 'merge', 'all']);
export const DECISION_STATUSES = Object.freeze(['decided', 'building', 'shipped', 'gate-failed', 'failed']);
export const BANDS = Object.freeze(['child', 'youth', 'teen', 'senior']);
// The builder's PART_KEYS that a merge here offers, in reading order (movements expand per index).
const LEAD_PARTS = ['title', 'bigIdea', 'lesson_intro'];
const TAIL_PARTS = ['lesson_close', ...BANDS.map((b) => `levels.${b}`), 'quiz', 'benefits', 'facilitator'];

// Every double-quoted span, as the builder's lock reads them.
const QUOTED = /"([^"]+)"/g;

/** The locked quoted spans in a text, in order (the quoted words). */
export function scriptureSpans(text) {
  return [...String(text || '').matchAll(QUOTED)].map((m) => m[1]);
}

/** Text → segments; the locked ones are quoted spans. */
export function splitLocked(text) {
  const s = String(text || '');
  const out = [];
  let at = 0;
  for (const m of s.matchAll(QUOTED)) {
    if (m.index > at) out.push({ locked: false, text: s.slice(at, m.index) });
    out.push({ locked: true, text: m[0] });
    at = m.index + m[0].length;
  }
  if (at < s.length || !out.length) out.push({ locked: false, text: s.slice(at) });
  return out;
}

/** Replace one unlocked segment; a locked one never changes. A straight `"` typed
 *  into the words between spans would open a new span, so it becomes a closing
 *  curly quote there. */
export function editSegment(segments, index, value) {
  return segments.map((seg, i) => (i === index && !seg.locked ? { ...seg, text: String(value).replace(/"/g, '”') } : seg));
}
export const joinSegments = (segments) => segments.map((s) => s.text).join('');

/** An edit keeps Scripture only if its quoted spans are exactly the original's, in order. */
export function editKeepsScripture(original, edited) {
  const a = scriptureSpans(original);
  const b = scriptureSpans(edited);
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

// --- the parts ----------------------------------------------------------------------
const bodyOf = (v) => (v && v.body && typeof v.body === 'object' ? v.body : {});
const movementsOf = (v) => (Array.isArray(bodyOf(v).movements) ? bodyOf(v).movements : []);

/** Every part a merge can pick, for these versions, in reading order. */
export function partsFor(versions) {
  const most = Math.max(0, ...versions.map((v) => movementsOf(v).length));
  return ['base', ...LEAD_PARTS, ...Array.from({ length: most }, (_, i) => `movements.${i}`), ...TAIL_PARTS];
}

/** A part's value in one version, or undefined if the version lacks it. */
export function partOf(version, part) {
  const b = bodyOf(version);
  if (part === 'base') return b;
  if (part.startsWith('movements.')) {
    const [, i, field] = part.split('.');
    const m = movementsOf(version)[Number(i)];
    if (m === undefined) return undefined;
    if (field) return m && typeof m === 'object' ? m[field] : undefined;
    return m;
  }
  if (part.startsWith('levels.')) {
    const t = b.levels && b.levels[part.slice(7)];
    return typeof t === 'string' ? t : undefined;
  }
  if (part === 'quiz') return b.quiz && Array.isArray(b.quiz.questions) && b.quiz.questions.length ? b.quiz : undefined;
  const v = b[part];
  if (v === undefined || v === null || v === '') return undefined;
  return v;
}

/** The text keys an edit may name for a part (the builder's edit keys). */
export function editKeysFor(part, version) {
  if (/^movements\.\d+$/.test(part)) {
    const m = partOf(version, part);
    return m && typeof m === 'object' ? [`${part}.title`, `${part}.text`] : [];
  }
  if (['title', 'bigIdea', 'lesson_intro', 'lesson_close'].includes(part) || part.startsWith('levels.')) {
    return typeof partOf(version, part) === 'string' ? [part] : [];
  }
  return [];
}
export const isEditKey = (key) => /^(title|bigIdea|lesson_intro|lesson_close|levels\.(child|youth|teen|senior)|movements\.\d+\.(title|text))$/.test(key);
/** The part an edit key belongs to (movements.2.text → movements.2). */
export const partOfEditKey = (key) => (key.startsWith('movements.') ? key.split('.').slice(0, 2).join('.') : key);

/** Where a gate fault sits (the builder's `where`, plus the quoted words) → the part (its part_of). */
export function partOfWhere(where, quoted, body) {
  const w = String(where || '');
  if (w.startsWith('levels.') || w === 'bigIdea' || w === 'inApp' || w === 'title') return w;
  if (w.startsWith('quiz')) return 'quiz';
  if (w.startsWith('talkingPoints')) return 'facilitator';
  if (w.startsWith('benefits')) return 'benefits';
  if (w === 'lesson') {
    const b = body || {};
    if (quoted && String(b.lesson_intro || '').includes(quoted)) return 'lesson_intro';
    const ms = Array.isArray(b.movements) ? b.movements : [];
    for (let i = 0; i < ms.length; i++) {
      const m = ms[i];
      const t = m && typeof m === 'object' ? `${m.title || ''} ${m.text || ''}` : String(m || '');
      if (quoted && t.includes(quoted)) return `movements.${i}`;
    }
    if (quoted && String(b.lesson_close || '').includes(quoted)) return 'lesson_close';
    return 'lesson_intro';
  }
  return 'base';
}

/** The builder's own ranking (lesson_gates.py score): verse passed, all passed, verbatim, movements, quiz, faster. */
export function versionScore(v) {
  const g = v.gates || {};
  const c = (g.structure && g.structure.counts) || {};
  return [g.versePassed ? 1 : 0, g.passed ? 1 : 0, (g.verses && g.verses.verbatim) || 0, c.movements || 0, c.quiz || 0, -(v.elapsedMs || 0)];
}
const cmpScore = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return b[i] - a[i]; return 0; };

/** Verse faults the builder found inside this part of this version. */
export function faultsIn(v, part) {
  const m = (v.gates && v.gates.verses && v.gates.verses.mismatches) || [];
  return m.filter((f) => partOfWhere(f.where, f.quoted, bodyOf(v)) === part).length;
}

/**
 * The default picks for "take ALL": the base is the best version overall; each
 * part comes from the version with the fewest verse faults in it, then the best
 * version-wide score.
 */
export function defaultPicks(versions) {
  const ranked = versions.slice().sort((a, b) => cmpScore(versionScore(a), versionScore(b)) || String(a.writer).localeCompare(String(b.writer)));
  const picks = {};
  for (const part of partsFor(versions)) {
    if (part === 'base') { picks.base = ranked[0] && ranked[0].id; continue; }
    const have = ranked.filter((v) => partOf(v, part) !== undefined);
    if (!have.length) continue;
    picks[part] = have.slice().sort((a, b) => faultsIn(a, part) - faultsIn(b, part) || cmpScore(versionScore(a), versionScore(b)))[0].id;
  }
  return picks;
}

function setEdit(body, key, value) {
  if (key.startsWith('movements.')) {
    const [, i, field] = key.split('.');
    const ms = body.movements || [];
    if (ms[Number(i)] && typeof ms[Number(i)] === 'object') ms[Number(i)] = { ...ms[Number(i)], [field]: value };
    return;
  }
  if (key.startsWith('levels.')) { body.levels = { ...(body.levels || {}), [key.slice(7)]: value }; return; }
  body[key] = value;
}

/** The lesson as it will be: the builder's `assemble` — base, then each merged part, then edits. */
export function composeLesson(versions, picks, edits = {}) {
  const byId = Object.fromEntries(versions.map((v) => [v.id, v]));
  const base = byId[picks.base] || versions[0];
  const out = JSON.parse(JSON.stringify(bodyOf(base)));
  out.levels = { ...(out.levels || {}) };
  out.movements = Array.isArray(out.movements) ? out.movements.slice() : [];
  for (const part of partsFor(versions)) {
    if (part === 'base') continue;
    const v = byId[picks[part]];
    if (!v || v === base) continue;
    const val = partOf(v, part);
    if (val === undefined) continue;
    const copy = JSON.parse(JSON.stringify(val));
    if (part.startsWith('movements.')) {
      const i = Number(part.split('.')[1]);
      if (i <= out.movements.length) out.movements[i] = copy; // never a gap, as the builder refuses one
    } else if (part.startsWith('levels.')) out.levels[part.slice(7)] = copy;
    else out[part] = copy;
  }
  for (const [key, value] of Object.entries(edits || {})) if (isEditKey(key)) setEdit(out, key, value);
  out.verdict = 'lesson';
  return out;
}

/** The text an edit key replaces, in a lesson body. */
export function editOriginal(body, key) {
  if (key.startsWith('movements.')) {
    const [, i, field] = key.split('.');
    const m = ((body && body.movements) || [])[Number(i)];
    return m && typeof m === 'object' ? m[field] : undefined;
  }
  if (key.startsWith('levels.')) return ((body && body.levels) || {})[key.slice(7)];
  return body ? body[key] : undefined;
}

/**
 * THE PUBLISH CONTRACT. Returns { ok, problems, row }. `row` is exactly what is
 * inserted into lesson_decisions (decided_by, decided_at and status are the
 * database's defaults: the Governor, now, `decided`).
 */
export function buildDecision({ mode, chosenVersionId = null, picks = {}, edits = {}, versions = [] }) {
  const problems = [];
  const lessons = versions.filter((v) => v && v.id);
  const ids = new Set(lessons.map((v) => v.id));
  const byId = Object.fromEntries(lessons.map((v) => [v.id, v]));
  if (lessons.length < 2) problems.push('A decision needs at least two versions to decide between.');
  if (new Set(lessons.map((v) => v.buildId).filter(Boolean)).size !== 1) problems.push('These versions are not from one build (one prompt).');
  if (!DECISION_MODES.includes(mode)) problems.push(`Unknown mode "${mode}".`);
  let base = null;
  let mergeMap = null;
  if (mode === 'choose') {
    if (!ids.has(chosenVersionId)) problems.push('Choose one of these versions.');
    else base = chosenVersionId;
  } else if (mode === 'merge' || mode === 'all') {
    const parts = partsFor(lessons);
    if (!ids.has(picks.base)) problems.push('Pick the base version (it supplies every part not picked).');
    else base = picks.base;
    mergeMap = {};
    for (const [part, vid] of Object.entries(picks || {})) {
      if (part === 'base') continue;
      if (!parts.includes(part)) { problems.push(`"${part}" is not a part of this lesson.`); continue; }
      if (!ids.has(vid)) { problems.push(`${part}: that version is not one of these.`); continue; }
      if (partOf(byId[vid], part) === undefined) { problems.push(`${part}: ${byId[vid].writer} has no ${part}.`); continue; }
      if (vid !== base) mergeMap[part] = vid;
    }
    if (mode === 'merge' && base && !Object.keys(mergeMap).length) problems.push('A merge uses parts from at least two versions; to use one version, choose it.');
    if (!Object.keys(mergeMap).length) mergeMap = null;
  }
  const cleanEdits = {};
  if (base && !problems.length) {
    const composed = composeLesson(lessons, mode === 'choose' ? { base } : { ...picks, base });
    for (const [key, value] of Object.entries(edits || {})) {
      if (!isEditKey(key)) { problems.push(`${key} cannot be edited here.`); continue; }
      const original = editOriginal(composed, key);
      if (typeof original !== 'string') { problems.push(`${key}: there is no picked text to edit.`); continue; }
      if (!editKeepsScripture(original, value)) { problems.push(`${key}: a quoted verse was changed, removed or added. Scripture stays exactly as written.`); continue; }
      if (String(value) !== original) cleanEdits[key] = String(value);
    }
  }
  if (problems.length) return { ok: false, problems, row: null };
  const first = byId[base];
  return {
    ok: true,
    problems: [],
    row: {
      build_id: first.buildId,
      teaching_row_id: first.teachingRowId || null,
      instance_id: first.instanceId || null,
      version_id: base,
      merge_map: mergeMap,
      edits: cleanEdits,
    },
  };
}

/** What the builder said when a gate failed on the composite: [{ check, part, detail }]. */
export function gateFailures(gateResult) {
  const g = gateResult && typeof gateResult === 'object' ? gateResult : {};
  if (Array.isArray(g.failures)) return g.failures.map((f) => ({ check: String(f.check || 'a gate'), part: String(f.part || ''), detail: String(f.detail || '') }));
  if (g.why || g.error) return [{ check: 'the builder', part: '', detail: String(g.why || g.error) }];
  return [];
}

/** A build's review state from its versions and its newest decision. */
export function reviewState(versions, decisions) {
  const latest = (decisions || []).slice().sort((a, b) => String(b.decided_at || '').localeCompare(String(a.decided_at || '')))[0] || null;
  const lessons = (versions || []).filter((v) => v.isLesson !== false);
  if (lessons.length < 2) return { state: 'single', latest };
  if (!latest) return { state: 'awaiting', latest };
  if (latest.status === 'gate-failed' || latest.status === 'failed') return { state: latest.status, latest, failures: gateFailures(latest.gate_result) };
  if (latest.status === 'decided') return { state: 'pending', latest };
  return { state: latest.status, latest };
}

// --- IO (Supabase injected) ------------------------------------------------------------
const MISSING = /does not exist|could not find the table|schema cache|42P01|PGRST205/i;

/** Every build with its versions and decisions. The queue = builds with ≥ 2 lesson versions awaiting or failed. */
export async function fetchReviewQueue({ supabase, uid = '', email = '', limit = 300 } = {}) {
  if (!mayCompareVersions({ uid, email })) return { ok: false, state: 'refused', teachings: [], reason: 'The review queue is the Governor’s.' };
  try {
    const v = await supabase.from(LESSON_VERSIONS_TABLE).select(LESSON_VERSION_COLUMNS.join(', ')).order('created_at', { ascending: false }).limit(limit);
    if (v.error) return { ok: false, state: MISSING.test(String(v.error.message || '') + String(v.error.code || '')) ? 'not-yet' : 'error', teachings: [], reason: String(v.error.message || '') };
    const d = await supabase.from(LESSON_DECISIONS_TABLE).select(LESSON_DECISION_COLUMNS.join(', ')).order('decided_at', { ascending: false }).limit(limit);
    const decisions = d.error ? [] : d.data || [];
    const byBuild = {};
    for (const row of v.data || []) {
      const nv = normalizeVersion(row);
      // A backfill re-writes an existing lesson for comparison only; it is never decided here.
      if (nv.backfill || !nv.buildId) continue;
      (byBuild[nv.buildId] = byBuild[nv.buildId] || []).push(nv);
    }
    const teachings = Object.entries(byBuild).map(([buildId, versions]) => {
      versions.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
      const mine = decisions.filter((x) => x.build_id === buildId);
      const teachingRowId = (versions.find((x) => x.teachingRowId) || {}).teachingRowId || '';
      return { buildId, teachingRowId, createdAt: versions[0] ? versions[0].createdAt : '', versions, decisions: mine, ...reviewState(versions, mine) };
    }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return { ok: true, state: 'ok', teachings, decisionsReadable: !d.error, reason: d.error ? String(d.error.message || '') : '' };
  } catch (e) {
    return { ok: false, state: 'error', teachings: [], reason: (e && e.message) || 'unknown' };
  }
}

/** Send the decision. Refused before any write unless the caller is the Governor and the contract holds. */
export async function publishDecision({ supabase, uid = '', email = '', decision }) {
  if (!mayCompareVersions({ uid, email })) return { ok: false, problems: ['Only the Governor decides.'] };
  const built = buildDecision(decision || {});
  if (!built.ok) return { ok: false, problems: built.problems };
  const { data, error } = await supabase.from(LESSON_DECISIONS_TABLE).insert(built.row).select('id, status, decided_at');
  if (error) return { ok: false, problems: [String(error.message || 'not saved')] };
  return { ok: true, problems: [], saved: Array.isArray(data) ? data[0] : data, row: built.row };
}
