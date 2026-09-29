// =============================================================================
// lesson-versions — the same prompt, several writers, every version side by
// side (DR-0672, built against DR-0669's lesson_versions)
// =============================================================================
// Darrell 2026-09-29: "I want to be able to use any LLM? To see the difference
// between lessons after they receive the same prompts... and have both versions
// of the same lessons to validate against to see..."
//
// The NAS lesson builder (DR-0669) sends one prompt to each writer and keeps
// every answer in public.lesson_versions. This module reads those rows for the
// Governor only and says, from the rows themselves:
//   - that every version got the IDENTICAL prompt (one sha256, or it says not);
//   - each version's gates as measured (verses verbatim / total, each mismatch
//     named, the structure checks, the elapsed time);
//   - which version shipped (published) and why;
//   - where the versions differ: movements one has and another lacks, verses
//     one cites and another does not.
// Nothing is scored here that the builder did not measure: a gate value that
// is missing is shown as "not measured", never as a pass (DR-0076).
// Pure except fetchLessonVersions, which takes the Supabase client.
// =============================================================================
import { GOVERNOR_LESSON_ACCOUNTS } from './lesson-inbox.js';
import { isLessonDoorOwner } from './one-voice-surfaces.js';

// THE SHAPE, as DR-0669's migration defines public.lesson_versions (read from
// its branch, claude/nas-lesson-builder, 2026-09-29; it owns the table even
// where DR-0671's 0240 created a narrower one first). Pinned by
// your-lessons-live.test.jsx against the resulting shape once it is on disk.
export const LESSON_VERSION_COLUMNS = Object.freeze([
  'id', 'build_id', 'teaching_row_id', 'instance_id', 'lesson_id', 'writer', 'family', 'model_label',
  'prompt_sha256', 'prompt_text', 'body', 'gate_results', 'elapsed_ms', 'error', 'published', 'backfill', 'created_at',
]);
export const LESSON_VERSIONS_TABLE = 'lesson_versions';

/** Only Darrell's two accounts and the Governor's sign-in doors see versions. */
export function mayCompareVersions({ uid = '', email = '' } = {}) {
  return (!!uid && GOVERNOR_LESSON_ACCOUNTS.includes(uid)) || (!!uid && isLessonDoorOwner(email));
}

// A Scripture reference as written in a lesson: "John 1:29", "1 Corinthians
// 13:1-3", "Song of Solomon 2:4". Matched on the text; a reference spelled
// another way is not seen, and the view says the list is what the text names.
const BOOK = String.raw`(?:[1-3]\s?)?[A-Z][a-z]+(?:\sof\s[A-Z][a-z]+)?`;
const REF_RE = new RegExp(String.raw`\b(${BOOK})\s(\d{1,3}):(\d{1,3}(?:\s?[-–]\s?\d{1,3})?)`, 'g');
const NOT_BOOKS = new Set(['Chapter', 'Verse', 'Movement', 'Step', 'Part', 'Lesson', 'Week', 'At', 'By', 'In', 'On']);

/** Every Scripture reference the text names, normalized, in first-seen order. */
export function extractRefs(text) {
  const out = [];
  const seen = new Set();
  const s = String(text || '');
  for (const m of s.matchAll(REF_RE)) {
    const book = m[1].replace(/\s+/g, ' ').trim();
    if (NOT_BOOKS.has(book.split(' ').pop())) continue;
    const ref = `${book} ${m[2]}:${m[3].replace(/\s/g, '').replace('–', '-')}`;
    if (!seen.has(ref)) { seen.add(ref); out.push(ref); }
  }
  return out;
}

const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : null);
const list = (v) => (Array.isArray(v) ? v : []);
const text = (v) => (typeof v === 'string' ? v : '');

/**
 * gate_results, as the builder writes them (infra/nas-lesson-builder/
 * lesson_gates.py gate_version):
 *   { structure: { passed, problems: [..], counts: { movements, bands, quiz, .. } },
 *     verse:     { passed, spans, verbatim, faults: [{ kind, ref, where, missing?, words? }], why },
 *     quotation: { passed, problems }, voice: { passed, problems },
 *     repo_gates: { passed, .. } | { skipped: why },
 *     verse_passed, passed }
 * plus shipped_because when the builder records why it chose one. A gate the
 * builder did not run is { measured: false } here, never a pass (DR-0076).
 */
const FAULT_WORDS = {
  'not-the-verse': 'not the verse as written',
  shouted: 'capitals the verse does not have',
  unresolvable: 'no such verse in the KJV on disk',
};
export function readGates(g) {
  const gates = g && typeof g === 'object' ? g : {};
  const v = gates.verse && typeof gates.verse === 'object' ? gates.verse : null;
  const verbatim = v ? num(v.verbatim) : null;
  const total = v ? num(v.spans) : null;
  const mismatches = v ? list(v.faults).map((f) => ({
    ref: text(f && f.ref),
    where: text(f && f.where),
    quoted: text(f && f.quoted),
    why: [FAULT_WORDS[f && f.kind] || text(f && f.kind), list(f && f.missing).length ? `missing "${list(f.missing).join('", "')}"` : '', list(f && f.words).length ? list(f.words).join(', ') : ''].filter(Boolean).join('; '),
  })) : [];
  const checks = [];
  const named = (key, label) => {
    const x = gates[key];
    if (!x || typeof x !== 'object') return;
    if (x.skipped) { checks.push({ check: label, ok: false, skipped: true, detail: `not run: ${text(x.skipped)}` }); return; }
    checks.push({ check: label, ok: x.passed === true, detail: list(x.problems).slice(0, 3).map(String).join('; ') });
  };
  named('structure', 'structure');
  named('quotation', 'quotation integrity');
  named('voice', 'our voice');
  named('repo_gates', 'the repository\u2019s own gates');
  const ran = checks.filter((c) => !c.skipped);
  const counts = gates.structure && gates.structure.counts && typeof gates.structure.counts === 'object' ? gates.structure.counts : {};
  return {
    verses: {
      measured: verbatim !== null && total !== null,
      verbatim, total, mismatches,
      allVerbatim: verbatim !== null && total !== null && total > 0 && verbatim === total && mismatches.length === 0,
      why: v ? text(v.why) : '',
    },
    structure: { measured: ran.length > 0, checks, passed: ran.filter((c) => c.ok).length, ran: ran.length, counts },
    schema: { measured: !!gates.structure, problems: list(gates.structure && gates.structure.problems).map(String) },
    passed: gates.passed === true,
    versePassed: gates.verse_passed === true,
    shippedBecause: text(gates.shipped_because || gates.shippedBecause),
  };
}

// A movement as the builder writes it ({ title, text }) or as a plain line.
const movementTitle = (m) => (m && typeof m === 'object' ? text(m.title) || text(m.text).split('\n')[0] : String(m || ''));
const movementText = (m) => (m && typeof m === 'object' ? [text(m.title), text(m.text)].filter(Boolean).join('\n') : String(m || ''));

/** The whole lesson as a reader meets it: intro, each movement, close (or the older single `lesson`). */
export function lessonTextOf(body) {
  const b = body && typeof body === 'object' ? body : {};
  if (typeof b.lesson === 'string' && !b.lesson_intro && !Array.isArray(b.movements)) return b.lesson;
  const parts = [text(b.lesson_intro), ...list(b.movements).map((m, i) => `${i + 1}. ${movementText(m)}`), text(b.lesson_close)];
  const joined = parts.filter(Boolean).join('\n\n');
  return joined || text(b.lesson);
}

/** One lesson_versions row, shaped for the view. */
export function normalizeVersion(row) {
  const r = row || {};
  const body = r.body && typeof r.body === 'object' ? r.body : {};
  const movementTexts = list(body.movements).map(movementText);
  const lessonText = lessonTextOf(body);
  const refs = extractRefs([text(body.anchor && body.anchor.ref), lessonText].join('\n'));
  return {
    id: text(r.id),
    buildId: text(r.build_id),
    instanceId: text(r.instance_id),
    key: text(r.id) || `${text(r.writer)}|${text(r.model_label)}|${text(r.created_at)}`,
    body,
    teachingRowId: text(r.teaching_row_id),
    lessonId: text(r.lesson_id),
    writer: text(r.writer) || 'unnamed writer',
    family: text(r.family),
    model: text(r.model_label) || 'model not recorded',
    sha: text(r.prompt_sha256),
    promptText: text(r.prompt_text),
    title: text(body.title),
    verdict: text(body.verdict),
    placement: text(body.placement),
    movements: list(body.movements).map(movementTitle),
    movementTexts,
    lessonText,
    anchorRef: text(body.anchor && body.anchor.ref),
    refs,
    gates: readGates(r.gate_results),
    elapsedMs: num(r.elapsed_ms),
    error: text(r.error),
    backfill: r.backfill === true,
    isLesson: text(body.verdict) === 'lesson',
    createdAt: text(r.created_at),
    published: r.published === true,
  };
}

/** Did every version get the same prompt? Measured by the sha256 each row carries. */
export function promptProof(versions) {
  const vs = list(versions);
  const shas = [...new Set(vs.map((v) => v.sha).filter(Boolean))];
  const missing = vs.filter((v) => !v.sha).length;
  return { same: vs.length > 0 && missing === 0 && shas.length === 1, sha: shas.length === 1 ? shas[0] : '', shas, missing, count: vs.length };
}

// The words of a movement line, without its number, for matching across writers.
const movementKey = (m) => String(m || '').toLowerCase().replace(/^\s*(movement\s*)?\d+[.):\s-]*/i, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Where the versions differ.
 *   movements: by position — row i holds each version's i-th movement (or
 *              null); `differs` when a version lacks it.
 *   verses:    every reference any version names; `citedBy[i]` per version;
 *              `differs` when not every version cites it.
 */
export function compareVersions(versions) {
  const vs = list(versions);
  const most = Math.max(0, ...vs.map((v) => v.movements.length));
  const movements = [];
  for (let i = 0; i < most; i++) {
    const cells = vs.map((v) => (i < v.movements.length ? v.movements[i] : null));
    const full = vs.map((v) => (i < (v.movementTexts || v.movements).length ? (v.movementTexts || v.movements)[i] : null));
    movements.push({ index: i + 1, cells, differs: cells.some((c) => c === null), refsDiffer: new Set(full.map((c) => (c === null ? '-' : extractRefs(c).join('|')))).size > 1 });
  }
  const allRefs = [];
  for (const v of vs) for (const r of v.refs) if (!allRefs.includes(r)) allRefs.push(r);
  const verses = allRefs.map((ref) => {
    const citedBy = vs.map((v) => v.refs.includes(ref));
    return { ref, citedBy, differs: citedBy.some((c) => !c) };
  });
  const counts = vs.map((v) => v.movements.length);
  return {
    movements,
    verses,
    movementCounts: counts,
    sameMovementCount: new Set(counts).size <= 1,
    onlyIn: vs.map((v, i) => verses.filter((x) => x.citedBy[i] && x.differs).map((x) => x.ref)),
    matchedMovements: vs.length > 1 ? movements.filter((m) => !m.differs && new Set(m.cells.map(movementKey)).size === 1).length : 0,
  };
}

/** Which version shipped, and the reason as the rows state it. */
export function shippedOf(versions) {
  const vs = list(versions);
  const shipped = vs.filter((v) => v.published);
  if (!shipped.length) return { version: null, why: 'None of these versions is marked published yet.', count: 0 };
  const v = shipped[0];
  const why = v.gates.shippedBecause
    || (v.gates.verses.measured ? `Marked published by the builder; its verses: ${v.gates.verses.verbatim} of ${v.gates.verses.total} verbatim${v.gates.structure.measured ? `, checks ${v.gates.structure.passed} of ${v.gates.structure.ran} pass` : ''}. The builder did not record a reason.` : 'Marked published by the builder. It did not record a reason.');
  return { version: v, why, count: shipped.length };
}

/** Versions grouped by the teaching row they were written from. */
export function groupByTeaching(rows) {
  const out = {};
  for (const r of list(rows)) {
    const v = normalizeVersion(r);
    if (!v.teachingRowId) continue;
    (out[v.teachingRowId] = out[v.teachingRowId] || []).push(v);
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  return out;
}

/** The versions of a lesson item: its own row, and the transcript it was built from. */
export function versionsForItem(item, byTeaching) {
  const ids = [item && item.id, item && item.transcriptId].filter(Boolean);
  return ids.flatMap((id) => (byTeaching && byTeaching[id]) || []);
}

const MISSING_TABLE = /does not exist|could not find the table|schema cache|42P01|PGRST205/i;

/**
 * The Governor's versions for these teaching rows. { ok, state, byTeaching, reason }
 * state: 'ok' | 'not-yet' (the table is not on this database yet) | 'refused' | 'error'.
 * A non-Governor never reaches the database from here.
 */
export async function fetchLessonVersions({ supabase, ids = [], uid = '', email = '' } = {}) {
  if (!mayCompareVersions({ uid, email })) return { ok: false, state: 'refused', byTeaching: {}, reason: 'Versions are shown to the Governor only.' };
  const want = [...new Set(list(ids).filter(Boolean))];
  if (!want.length) return { ok: true, state: 'ok', byTeaching: {}, reason: '' };
  try {
    const { data, error } = await supabase
      .from(LESSON_VERSIONS_TABLE)
      .select(LESSON_VERSION_COLUMNS.join(', '))
      .in('teaching_row_id', want)
      .order('created_at', { ascending: true })
      .limit(200);
    if (error) {
      const msg = String(error.message || error.code || '');
      if (MISSING_TABLE.test(msg) || MISSING_TABLE.test(String(error.code || ''))) return { ok: false, state: 'not-yet', byTeaching: {}, reason: 'The lesson builder has not stored any versions on this database yet.' };
      return { ok: false, state: 'error', byTeaching: {}, reason: msg || 'unknown' };
    }
    return { ok: true, state: 'ok', byTeaching: groupByTeaching(data || []), reason: '' };
  } catch (e) {
    return { ok: false, state: 'error', byTeaching: {}, reason: (e && e.message) || 'unknown' };
  }
}

/** "4.2 s", "1 min 5 s". */
export function formatMs(ms) {
  if (!Number.isFinite(ms) || ms < 0) return null;
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${Math.round(s % 60)} s`;
}
