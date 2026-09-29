// =============================================================================
// lesson-decisions — the Governor reviews every version and decides: choose
// one, merge part by part, or take all with the best part of each (DR-0672)
// =============================================================================
// Darrell 2026-09-29: "When we have all same lessons those end in PoeTech for
// me to review their and the decide on which one or merge 2 of them or all of
// them..."
//
// A lesson with more than one version waits in his review queue (the builder
// does not auto-ship it, DR-0669). He decides here; the decision is a row in
// public.lesson_decisions (migration 0241) that the builder reads. The builder
// re-runs EVERY gate on the final composite and ships only if all pass; if one
// fails, the row comes back `gate-failed` with the check and the part, and
// nothing ships.
//
// THE PARTS a merge picks from: the title, each movement, the full lesson
// text, each band (child, youth, teen, senior) and the quiz. Everything else
// (anchor, bigIdea, inApp, benefits, talking points, placement, slug) comes
// from the BASE version, which is also a pick.
//
// SCRIPTURE IS LOCKED. A quoted verse span — "words" (Book C:V), the same
// pattern the builder's verse gate and scripts/quoted-verse-is-the-verse.mjs
// read — cannot be edited, removed, reordered or added by an edit. The editor
// only offers the text between spans; the publish contract refuses any edit
// whose spans differ from the part it edits.
// Pure except fetchReviewQueue and publishDecision (Supabase injected).
// =============================================================================
import { mayCompareVersions, normalizeVersion, LESSON_VERSION_COLUMNS, LESSON_VERSIONS_TABLE } from './lesson-versions.js';

export const LESSON_DECISIONS_TABLE = 'lesson_decisions';
// The row the app writes and the builder reads (0241). Pinned by the test.
export const LESSON_DECISION_COLUMNS = Object.freeze([
  'id', 'teaching_row_id', 'build_id', 'mode', 'chosen_version_id', 'merge_map', 'edits',
  'version_ids', 'decided_by', 'decided_at', 'status', 'gate_result', 'lesson_id', 'pr_number', 'updated_at',
]);
export const DECISION_MODES = Object.freeze(['choose', 'merge', 'all']);
// pending: sent, not yet taken; building: the builder has it; shipped: every
// gate passed on the composite and it shipped; gate-failed: a gate failed and
// nothing shipped; superseded: a newer decision replaced it.
export const DECISION_STATUSES = Object.freeze(['pending', 'building', 'shipped', 'gate-failed', 'superseded']);
export const BANDS = Object.freeze(['child', 'youth', 'teen', 'senior']);

// The same pattern as SPAN_WITH_REFERENCE in the builder's lesson_gates.py and
// scripts/quoted-verse-is-the-verse.mjs: "quoted words" (Book C:V).
const SPAN_RE = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g;

/** The locked Scripture spans in a text, in order. */
export function scriptureSpans(text) {
  return [...String(text || '').matchAll(SPAN_RE)].map((m) => m[0]);
}

/** Text → segments; the locked ones are quoted verse spans. */
export function splitLocked(text) {
  const s = String(text || '');
  const out = [];
  let at = 0;
  for (const m of s.matchAll(SPAN_RE)) {
    if (m.index > at) out.push({ locked: false, text: s.slice(at, m.index) });
    out.push({ locked: true, text: m[0] });
    at = m.index + m[0].length;
  }
  if (at < s.length || !out.length) out.push({ locked: false, text: s.slice(at) });
  return out;
}

/** Replace one unlocked segment; a locked one never changes. */
export function editSegment(segments, index, value) {
  return segments.map((seg, i) => (i === index && !seg.locked ? { ...seg, text: String(value) } : seg));
}
export const joinSegments = (segments) => segments.map((s) => s.text).join('');

/** An edit keeps Scripture only if its spans are exactly the original's, in order. */
export function editKeepsScripture(original, edited) {
  const a = scriptureSpans(original);
  const b = scriptureSpans(edited);
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

// --- the parts ----------------------------------------------------------------------
const bodyOf = (v) => (v && v.body && typeof v.body === 'object' ? v.body : {});

/** Every part a merge can pick, for these versions, in reading order. */
export function partsFor(versions) {
  const most = Math.max(0, ...versions.map((v) => (Array.isArray(bodyOf(v).movements) ? bodyOf(v).movements.length : 0)));
  return ['base', 'title', ...Array.from({ length: most }, (_, i) => `movement:${i + 1}`), 'lesson', ...BANDS.map((b) => `band:${b}`), 'quiz'];
}

/** A part's value in one version (string, the quiz object, or undefined if it lacks it). */
export function partOf(version, part) {
  const b = bodyOf(version);
  if (part === 'title') return typeof b.title === 'string' ? b.title : undefined;
  if (part === 'lesson') return typeof b.lesson === 'string' ? b.lesson : undefined;
  if (part === 'quiz') return b.quiz && Array.isArray(b.quiz.questions) && b.quiz.questions.length ? b.quiz : undefined;
  if (part.startsWith('movement:')) {
    const i = Number(part.slice(9)) - 1;
    return Array.isArray(b.movements) && i < b.movements.length ? String(b.movements[i]) : undefined;
  }
  if (part.startsWith('band:')) {
    const t = b.levels && b.levels[part.slice(5)];
    return typeof t === 'string' ? t : undefined;
  }
  if (part === 'base') return b;
  return undefined;
}
export const isTextPart = (part) => part === 'title' || part === 'lesson' || part.startsWith('movement:') || part.startsWith('band:');

// Where a verse fault sits (the builder's `where`) → the part it belongs to.
export function partOfWhere(where) {
  const w = String(where || '');
  if (w === 'lesson') return 'lesson';
  if (w.startsWith('levels.')) return `band:${w.slice(7)}`;
  if (w.startsWith('quiz[')) return 'quiz';
  if (w === 'title') return 'title';
  return 'base';
}

/** The version-wide ranking the builder uses (lesson_gates.py score): verbatim, movements, quiz, faster. */
export function versionScore(v) {
  const g = v.gates || {};
  const c = (g.structure && g.structure.counts) || {};
  return [g.versePassed ? 1 : 0, g.passed ? 1 : 0, (g.verses && g.verses.verbatim) || 0, c.movements || 0, c.quiz || 0, -(v.elapsedMs || 0)];
}
const cmpScore = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return b[i] - a[i]; return 0; };

/** Faults the builder found inside this part of this version. */
export function faultsIn(v, part) {
  const m = (v.gates && v.gates.verses && v.gates.verses.mismatches) || [];
  return m.filter((f) => partOfWhere(f.where) === part).length;
}

/**
 * The default picks for "take ALL": for each part, the version that has it
 * with the fewest verse faults in that part, then the best version-wide score.
 * The base is the best version overall.
 */
export function defaultPicks(versions) {
  const ranked = versions.slice().sort((a, b) => cmpScore(versionScore(a), versionScore(b)) || String(a.writer).localeCompare(String(b.writer)));
  const picks = {};
  for (const part of partsFor(versions)) {
    if (part === 'base') { picks.base = ranked[0] && ranked[0].id; continue; }
    const have = ranked.filter((v) => partOf(v, part) !== undefined);
    if (!have.length) continue;
    const best = have.slice().sort((a, b) => faultsIn(a, part) - faultsIn(b, part) || cmpScore(versionScore(a), versionScore(b)))[0];
    picks[part] = best.id;
  }
  return picks;
}

/** The lesson as it will be: the base, with each picked part and each edit laid in. */
export function composeLesson(versions, picks, edits = {}) {
  const byId = Object.fromEntries(versions.map((v) => [v.id, v]));
  const base = byId[picks.base] || versions[0];
  const out = JSON.parse(JSON.stringify(bodyOf(base)));
  out.levels = { ...(out.levels || {}) };
  const movements = [];
  for (const part of partsFor(versions)) {
    if (part === 'base') continue;
    const v = byId[picks[part]];
    if (!v) continue;
    let val = partOf(v, part);
    if (val === undefined) continue;
    if (isTextPart(part) && typeof edits[part] === 'string') val = edits[part];
    if (part === 'title') out.title = val;
    else if (part === 'lesson') out.lesson = val;
    else if (part === 'quiz') out.quiz = JSON.parse(JSON.stringify(val));
    else if (part.startsWith('band:')) out.levels[part.slice(5)] = val;
    else if (part.startsWith('movement:')) movements.push(val);
  }
  if (partsFor(versions).some((p) => p.startsWith('movement:'))) out.movements = movements;
  return out;
}

/**
 * THE PUBLISH CONTRACT. Returns { ok, problems, row }. `row` is exactly what is
 * inserted into lesson_decisions (decided_by and decided_at are the database's).
 */
export function buildDecision({ teachingRowId, buildId = null, mode, chosenVersionId = null, picks = {}, edits = {}, versions = [] }) {
  const problems = [];
  const ids = new Set(versions.map((v) => v.id).filter(Boolean));
  if (!teachingRowId) problems.push('No teaching row is named.');
  if (versions.length < 2) problems.push('A decision needs at least two versions to decide between.');
  if (!DECISION_MODES.includes(mode)) problems.push(`Unknown mode "${mode}".`);
  const byId = Object.fromEntries(versions.map((v) => [v.id, v]));
  let mergeMap = {};
  if (mode === 'choose') {
    if (!ids.has(chosenVersionId)) problems.push('Choose one of these versions.');
  } else if (mode === 'merge' || mode === 'all') {
    const parts = partsFor(versions);
    for (const [part, vid] of Object.entries(picks || {})) {
      if (!parts.includes(part)) { problems.push(`"${part}" is not a part of this lesson.`); continue; }
      if (!ids.has(vid)) { problems.push(`${part}: that version is not one of these.`); continue; }
      if (partOf(byId[vid], part) === undefined) { problems.push(`${part}: ${byId[vid].writer} has no ${part}.`); continue; }
      mergeMap[part] = vid;
    }
    if (!mergeMap.base) problems.push('Pick the base version (it supplies every part not picked).');
    if (mode === 'merge' && new Set(Object.values(mergeMap)).size < 2) problems.push('A merge uses parts from at least two versions; to use one version, choose it.');
  }
  // Edits: text parts only, and Scripture spans exactly as the source part has them.
  const cleanEdits = {};
  for (const [part, value] of Object.entries(edits || {})) {
    if (!isTextPart(part)) { problems.push(`${part} cannot be edited here.`); continue; }
    const sourceId = mode === 'choose' ? chosenVersionId : mergeMap[part];
    const source = byId[sourceId];
    const original = source ? partOf(source, part) : undefined;
    if (original === undefined) { problems.push(`${part}: there is no picked text to edit.`); continue; }
    if (!editKeepsScripture(original, value)) { problems.push(`${part}: a quoted verse was changed, removed or added. Scripture stays exactly as written.`); continue; }
    if (String(value) !== original) cleanEdits[part] = String(value);
  }
  if (problems.length) return { ok: false, problems, row: null };
  return {
    ok: true,
    problems: [],
    row: {
      teaching_row_id: teachingRowId,
      build_id: buildId || null,
      mode,
      chosen_version_id: mode === 'choose' ? chosenVersionId : null,
      merge_map: mode === 'choose' ? {} : mergeMap,
      edits: cleanEdits,
      version_ids: versions.map((v) => v.id),
      status: 'pending',
    },
  };
}

/** What the builder said when a gate failed on the composite: [{ check, part, detail }]. */
export function gateFailures(gateResult) {
  const g = gateResult && typeof gateResult === 'object' ? gateResult : {};
  if (Array.isArray(g.failures)) return g.failures.map((f) => ({ check: String(f.check || 'a gate'), part: String(f.part || partOfWhere(f.where)), detail: String(f.detail || '') }));
  const out = [];
  for (const f of (g.verse && Array.isArray(g.verse.faults) ? g.verse.faults : [])) out.push({ check: 'verse', part: partOfWhere(f.where), detail: `${f.ref || ''} ${f.kind || ''}`.trim() });
  for (const key of ['structure', 'quotation', 'voice']) {
    const x = g[key];
    if (x && x.passed === false) for (const p of (x.problems || [])) out.push({ check: key, part: partOfWhere(String(p).split(':')[0]), detail: String(p) });
  }
  if (g.repo_gates && g.repo_gates.passed === false) out.push({ check: 'the repository’s own gates', part: 'base', detail: 'did not pass' });
  return out;
}

/** Each teaching's review state from its versions and its newest decision. */
export function reviewState(versions, decisions) {
  const latest = (decisions || []).slice().sort((a, b) => String(b.decided_at || '').localeCompare(String(a.decided_at || '')))[0] || null;
  if (!versions || versions.length < 2) return { state: 'single', latest };
  if (!latest || latest.status === 'superseded') return { state: 'awaiting', latest };
  if (latest.status === 'gate-failed') return { state: 'gate-failed', latest, failures: gateFailures(latest.gate_result) };
  return { state: latest.status, latest };
}

// --- IO (Supabase injected) ------------------------------------------------------------
const MISSING = /does not exist|could not find the table|schema cache|42P01|PGRST205/i;

/** Every teaching with its versions and decisions; the queue = those with ≥ 2 versions awaiting or failed. */
export async function fetchReviewQueue({ supabase, uid = '', email = '', limit = 300 } = {}) {
  if (!mayCompareVersions({ uid, email })) return { ok: false, state: 'refused', teachings: [], reason: 'The review queue is the Governor’s.' };
  try {
    const v = await supabase.from(LESSON_VERSIONS_TABLE).select(LESSON_VERSION_COLUMNS.join(', ')).order('created_at', { ascending: false }).limit(limit);
    if (v.error) return { ok: false, state: MISSING.test(String(v.error.message || v.error.code || '')) ? 'not-yet' : 'error', teachings: [], reason: String(v.error.message || '') };
    const d = await supabase.from(LESSON_DECISIONS_TABLE).select(LESSON_DECISION_COLUMNS.join(', ')).order('decided_at', { ascending: false }).limit(limit);
    const decisions = d.error ? [] : d.data || [];
    const byTeaching = {};
    for (const row of v.data || []) {
      const nv = normalizeVersion(row);
      if (!nv.teachingRowId) continue;
      (byTeaching[nv.teachingRowId] = byTeaching[nv.teachingRowId] || []).push(nv);
    }
    const teachings = Object.entries(byTeaching).map(([id, versions]) => {
      versions.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
      const mine = decisions.filter((x) => x.teaching_row_id === id);
      return { teachingRowId: id, versions, decisions: mine, ...reviewState(versions, mine) };
    });
    return { ok: true, state: 'ok', teachings, decisionsReadable: !d.error, reason: d.error ? String(d.error.message || '') : '' };
  } catch (e) {
    return { ok: false, state: 'error', teachings: [], reason: (e && e.message) || 'unknown' };
  }
}

/** Send the decision. Refused client-side before any write unless the contract holds. */
export async function publishDecision({ supabase, uid = '', email = '', decision }) {
  if (!mayCompareVersions({ uid, email })) return { ok: false, problems: ['Only the Governor decides.'] };
  const built = buildDecision(decision || {});
  if (!built.ok) return { ok: false, problems: built.problems };
  const { data, error } = await supabase.from(LESSON_DECISIONS_TABLE).insert(built.row).select('id, status, decided_at');
  if (error) return { ok: false, problems: [String(error.message || 'not saved')] };
  return { ok: true, problems: [], saved: Array.isArray(data) ? data[0] : data, row: built.row };
}
