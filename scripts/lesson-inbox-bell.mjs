#!/usr/bin/env node
// =============================================================================
// lesson-inbox-bell.mjs -- the bell's decision, deterministic, no model (DR-0725)
// =============================================================================
// Darrell 2026-09-30: "I don't like timers... they cost more than we need...
// don't we have a better solution/s?" and 2026-10-01: "Why can't it just be
// triggered by me doing the lesson so it's not a timer!!!!!" -- then, of a
// lesson showing "building": "how long?"
//
// Given the lesson rows in flight (scripts/lesson-inbox-progress.sql, psql -At
// with '|') and the bell PR's earlier comments, decide whether to ring:
//   - nothing in flight                         -> no comment (no AI turn)
//   - no row reached a new milestone            -> no comment
//   - a row reached a new milestone             -> ONE comment listing every
//     (waiting, building, gated, awaiting-review,  row in flight: id, who,
//      shipped, captured, handed back)             when, its milestone, start,
//                                                  elapsed, attempt, writers,
//                                                  gates, and the PR once shipped
//   - the per-day cap reached                   -> no comment (the brake; DR-0248)
// The milestone rule is the NAS bell's own (lesson_builder.py bell_milestone),
// so the NAS dispatches and this comment agree on what is new.
//
// NEVER A BODY. The parser keeps four fields of a row; a tag that could break
// out of the comment (or that carries free text, such as build-reason:) is
// dropped. created_at is carried so the comment's own time minus the row's
// time is the measured insert-to-bell seconds.
//
// CLI:
//   node scripts/lesson-inbox-bell.mjs --rows rows.txt --comments comments.json
//        [--versions versions.txt] [--prs prs.json] --out body.md
//     prints {"post":bool,"reason":"...","waiting":n,"keys":[...]} and writes
//     the comment body to --out only when post is true.
//   node scripts/lesson-inbox-bell.mjs --status --rows rows.txt
//        [--versions versions.txt] [--prs prs.json] [--service service.json] [--recent recent.txt]
//     prints the lesson builder's state and every row in flight (read-only).
// =============================================================================
import fs from 'node:fs';

export const MARKER = 'lesson-bell:v1';
export const MAX_PER_DAY = 24; // never more AI wakes than the hourly Routine it replaces
const DAY_MS = 86400000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SAFE_TAG = /^[A-Za-z0-9:@._\-/+]{1,200}$/;
const STAMP = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}(:?\d{2})?|Z)?$/;
const STAGE = /^build:([a-z-]+)@(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ)$/;

/** psql -At '|' rows -> [{ id, created_at, created_by, tags }]. Every other column is dropped. */
export function parseWaiting(text) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    if (!line.trim()) continue;
    const cols = line.split('|');
    if (cols.length < 6) continue;
    const id = cols[0].trim();
    const createdAt = cols[1].trim();
    const createdBy = cols[2].trim();
    // tags is the 5th column; the source (4th) never contains '|' in practice,
    // but read tags from the right so a stray '|' cannot shift it.
    const tagsText = cols.slice(4, cols.length - 1).join('|');
    if (!UUID.test(id)) continue;
    let tags = [];
    try { tags = JSON.parse(tagsText); } catch { tags = []; }
    out.push({
      id,
      created_at: STAMP.test(createdAt) ? createdAt : 'unknown',
      created_by: UUID.test(createdBy) ? createdBy : 'unknown',
      tags: safeTags(tags),
    });
  }
  return out;
}

export function safeTags(tags) {
  return (Array.isArray(tags) ? tags : []).filter((t) => typeof t === 'string' && SAFE_TAG.test(t));
}

/** { stage: last ISO time } from a row's builder stage tags. */
export function stageTimes(tags) {
  const out = {};
  for (const t of safeTags(tags)) {
    const m = STAGE.exec(t);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

/** Where a lesson row stands, from its tags alone -- the NAS bell's bell_milestone(). */
export function milestone(tags) {
  const t = safeTags(tags);
  if (!t.includes('lesson')) return null;
  const times = stageTimes(t);
  if (t.includes('lesson-published') || times.published) return 'shipped';
  if (t.includes('lesson-captured')) return 'captured';
  if (t.includes('awaiting-review')) return 'awaiting-review';
  if (t.includes('lesson-building')) return (times.gated || '') >= (times.claimed || '~') ? 'gated' : 'building';
  // Only the builder's stage tags (`build:<stage>@<time>`), never the app's
  // own `build:<sha>` stamp (DR-0697), which every row carries from birth.
  const n = t.filter((x) => /^build:[a-z-]+@/.test(x)).length;
  return n ? `waiting#b${n}` : 'waiting';
}

/** One key per row in flight: its id and its milestone. */
export function rowKey(row) {
  return `${row.id}|${milestone(row.tags)}`;
}

export function waitingKeys(rows) {
  return [...new Set((rows || []).filter((r) => milestone(r.tags)).map(rowKey))].sort();
}

const bodyOf = (c) => String((c && typeof c === 'object' ? c.body : c) || '');

/** The keys named in the bell's own LAST comment (null when it never rang).
 *  Each comment is a body string or { body, created_at }. */
export function lastRungKeys(comments) {
  const re = new RegExp(`<!-- ${MARKER} keys=([^ ]*) -->`);
  for (let i = (comments || []).length - 1; i >= 0; i -= 1) {
    const m = re.exec(bodyOf(comments[i]));
    if (m) return m[1] ? m[1].split(',').sort() : [];
  }
  return null;
}

/** How many of the bell's own comments landed in the last day. */
export function ringsToday(comments, now = Date.now()) {
  return (comments || []).filter((c) => {
    if (!bodyOf(c).includes(`<!-- ${MARKER} `)) return false;
    const t = Date.parse(c && c.created_at);
    return Number.isFinite(t) && now - t < DAY_MS;
  }).length;
}

export function decide(rows, comments, { maxPerDay = MAX_PER_DAY, now = Date.now() } = {}) {
  const keys = waitingKeys(rows);
  const last = lastRungKeys(comments);
  const waiting = (rows || []).filter((r) => String(milestone(r.tags)).startsWith('waiting')).length;
  if (!keys.length) return { post: false, reason: 'nothing in flight', waiting: 0, keys };
  // A row that left the set (captured by the intake, aged out) is not news; a
  // row at a milestone the last comment did not name is.
  const fresh = last ? keys.filter((k) => !last.includes(k)) : keys;
  if (!fresh.length) {
    return { post: false, reason: 'nothing changed since the last ring', waiting, keys };
  }
  const today = ringsToday(comments, now);
  if (today >= maxPerDay) {
    return { post: false, reason: `the per-day cap of ${maxPerDay} rings is reached`, waiting, keys, fresh, today };
  }
  return { post: true, reason: last ? 'a row reached a new milestone' : 'first ring', waiting, keys, fresh, today };
}

/** lesson_versions lines: build_id|writer|passed|published|created_at (never a body). */
export function parseVersions(text) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    const c = line.split('|').map((x) => x.trim());
    if (c.length < 4 || !UUID.test(c[0]) || !SAFE_TAG.test(c[1] || '')) continue;
    out.push({ build_id: c[0], writer: c[1], passed: c[2] === 'true' ? true : c[2] === 'false' ? false : null, published: c[3] === 't' || c[3] === 'true' });
  }
  return out;
}

/** gh pr list --json number,url,headRefName,state -> the lesson branches only. */
export function parsePrs(json) {
  let list = [];
  try { list = JSON.parse(String(json || '[]')); } catch { list = []; }
  return (Array.isArray(list) ? list : []).filter((p) => p && Number.isInteger(p.number)
    && /^claude\/lesson-l\d+-[a-z0-9-]+$/.test(String(p.headRefName || ''))
    && /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/.test(String(p.url || '')))
    .map((p) => ({ number: p.number, url: p.url, headRefName: p.headRefName, state: String(p.state || '').replace(/[^A-Z]/g, '') }));
}

const LABEL = {
  waiting: 'waiting for the intake',
  building: 'building on the NAS',
  gated: 'gates checked on the NAS',
  'awaiting-review': "awaiting Darrell's review",
  shipped: 'shipped',
  captured: 'captured',
};

function secondsBetween(fromIso, now) {
  const t = Date.parse(fromIso);
  return Number.isFinite(t) ? Math.max(0, Math.round((now - t) / 1000)) : null;
}

export function humanSeconds(s) {
  if (s == null) return 'unknown';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${m} min` : m ? `${m} min ${s % 60} s` : `${s} s`;
}

/** What one row in flight shows: never its body. */
export function progressOf(row, { versions = [], prs = [], now = Date.now() } = {}) {
  const tags = safeTags(row.tags);
  const m = milestone(tags);
  const times = stageTimes(tags);
  const handedBack = String(m).startsWith('waiting#b');
  const failed = tags.filter((t) => t.startsWith('build:failed@')).length;
  const groups = tags.filter((t) => t.startsWith('build-group:')).map((t) => t.slice(12)).filter((g) => UUID.test(g));
  const group = groups[groups.length - 1] || null;
  const lessonTag = tags.find((t) => t.startsWith('build-lesson:L'));
  const ll = lessonTag ? lessonTag.slice('build-lesson:L'.length) : null;
  const pr = ll ? prs.find((p) => p.headRefName.startsWith(`claude/lesson-l${ll}-`)) : null;
  const ordered = Object.entries(times).sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
  const lastStage = ordered.length ? ordered[ordered.length - 1] : null;
  const active = m === 'building' || m === 'gated';
  return {
    id: row.id,
    created_by: row.created_by,
    created_at: row.created_at,
    milestone: m,
    label: handedBack ? `handed back${lastStage ? ` (last: ${lastStage[0]})` : ''}, waiting for the intake` : (LABEL[m] || m),
    started: times.claimed || null,
    elapsed: active && times.claimed ? secondsBetween(times.claimed, now) : null,
    attempt: active ? failed + 1 : failed,
    last_stage: lastStage ? `${lastStage[0]}@${lastStage[1]}` : null,
    stages: ordered.map(([k, v]) => `${k}@${v}`),
    writers: [...new Set(tags.filter((t) => t.startsWith('build-writer:')).map((t) => t.slice(13)))],
    gates: group ? versions.filter((v) => v.build_id === group).map((v) => ({ writer: v.writer, passed: v.passed })) : [],
    lesson: (tags.find((t) => t.startsWith('lesson-id:')) || '').slice(10) || null,
    pr: pr ? { number: pr.number, url: pr.url, state: pr.state } : null,
  };
}

function gateText(g) {
  return `${g.writer} ${g.passed === true ? 'passed' : g.passed === false ? 'failed' : 'unknown'}`;
}

function progressLine(p) {
  const bits = [`**${p.label}**`];
  if (p.started) bits.push(`started \`${p.started}\``);
  if (p.elapsed != null) bits.push(`elapsed ${humanSeconds(p.elapsed)}`);
  if (p.attempt) bits.push(`attempt ${p.attempt}`);
  if (p.last_stage && p.milestone !== 'waiting') bits.push(`last stage \`${p.last_stage}\``);
  if (p.writers.length) bits.push(`writer${p.writers.length === 1 ? '' : 's'}: ${p.writers.map((w) => `\`${w}\``).join(', ')}`);
  if (p.gates.length) bits.push(`gates: ${p.gates.map(gateText).join(', ')}`);
  if (p.lesson) bits.push(`lesson \`${p.lesson}\``);
  if (p.pr) bits.push(`PR #${p.pr.number} (${p.pr.state.toLowerCase() || 'open'})`);
  return bits.join(' · ');
}

/** The comment: ids, who, when, and tag-derived progress only. */
export function formatComment(rows, keys, ctx = {}) {
  const now = ctx.now ?? Date.now();
  const ps = (rows || []).filter((r) => milestone(r.tags)).map((r) => progressOf(r, { ...ctx, now }));
  const count = (pred) => ps.filter(pred).length;
  const waiting = count((p) => String(p.milestone).startsWith('waiting'));
  const lines = [
    `**Lesson inbox bell:** ${waiting} waiting for the intake · ${count((p) => p.milestone === 'building' || p.milestone === 'gated')} building on the NAS · ${count((p) => p.milestone === 'awaiting-review')} awaiting review · ${count((p) => p.milestone === 'shipped')} shipped in the last day.`,
    '',
    ...ps.map((p) => `- \`${p.id}\` by \`${p.created_by}\` at \`${STAMP.test(String(p.created_at)) ? p.created_at : 'unknown'}\` · ${progressLine(p)}`),
    '',
    waiting
      ? 'Rows waiting for the intake: read the words with `inbox-lesson-body.yml`; mark a shipped lesson with `inbox-lesson-tag.yml` (DR-0725).'
      : "Nothing waits for the intake; this ring reports the NAS builder's progress (DR-0725).",
    '',
    `<!-- ${MARKER} keys=${keys.join(',')} -->`,
  ];
  return lines.join('\n');
}

/** The read-only status print (Darrell's "how long?"): the service, then every row in flight. */
export function formatStatus(rows, ctx = {}, service = null) {
  const now = ctx.now ?? Date.now();
  const out = [];
  const s = service && typeof service === 'object' ? service : null;
  out.push('== the NAS lesson builder ==');
  if (s) {
    out.push(`state: ${String(s.state || 'unknown')}  (as of ${String(s.at || 'unknown')})`);
    out.push(`push credential: ${String(s.push_credential || 'unknown')}`);
    out.push(`reachable writers: ${(Array.isArray(s.reachable) ? s.reachable : []).join(', ') || '(none)'}`);
    for (const w of Array.isArray(s.writers) ? s.writers : []) {
      out.push(`  writer ${String(w.writer)} (${String(w.kind || '?')}${w.primary ? ', primary' : ''}): ${w.ok ? 'ok' : 'not ready'} -- ${String(w.why || '').slice(0, 160)}`);
    }
  } else {
    out.push('state: unknown (no service status read)');
  }
  const ps = (rows || []).filter((r) => milestone(r.tags)).map((r) => progressOf(r, { ...ctx, now }));
  out.push('', `== lesson rows in flight: ${ps.length} ==`);
  for (const p of ps) {
    out.push(`${p.id}  by ${p.created_by}  made ${p.created_at}`);
    out.push(`  ${p.label}${p.started ? `; started ${p.started}` : ''}${p.elapsed != null ? `; elapsed ${humanSeconds(p.elapsed)}` : ''}${p.attempt ? `; attempt ${p.attempt}` : ''}`);
    if (p.writers.length) out.push(`  writers: ${p.writers.join(', ')}`);
    if (p.gates.length) out.push(`  gates: ${p.gates.map(gateText).join(', ')}`);
    if (p.stages.length) out.push(`  stages: ${p.stages.join('  ')}`);
    if (p.lesson) out.push(`  lesson: ${p.lesson}`);
    if (p.pr) out.push(`  PR: ${p.pr.url} (${p.pr.state})`);
  }
  if (Array.isArray(ctx.recent)) {
    out.push('', `== lesson rows made in the last day, any state: ${ctx.recent.length} ==`);
    for (const r of ctx.recent) {
      const p = progressOf(r, { ...ctx, now });
      const marks = safeTags(r.tags).filter((t) => /^(lesson-[a-z-]+|awaiting-review|canary|voice[a-z-]*|mirrored|build-failed)$/.test(t));
      out.push(`${r.id}  made ${r.created_at}  ${p.label}  [${marks.join(', ')}]${p.last_stage ? `  last stage ${p.last_stage}` : ''}`);
    }
  }
  return out.join('\n');
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
function readOr(path, fallback) {
  if (!path) return fallback;
  try { return fs.readFileSync(path, 'utf8'); } catch { return fallback; }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = parseWaiting(fs.readFileSync(arg('rows'), 'utf8'));
  const ctx = { versions: parseVersions(readOr(arg('versions'), '')), prs: parsePrs(readOr(arg('prs'), '[]')), now: Date.now() };
  if (process.argv.includes('--status')) {
    let service = null;
    try { service = JSON.parse(readOr(arg('service'), 'null')); } catch { service = null; }
    if (arg('recent')) ctx.recent = parseWaiting(readOr(arg('recent'), ''));
    process.stdout.write(`${formatStatus(rows, ctx, service)}\n`);
  } else {
    let bodies = [];
    try { bodies = JSON.parse(readOr(arg('comments'), '[]')); } catch { bodies = []; }
    const cap = Number.parseInt(process.env.LESSON_BELL_MAX_PER_DAY || '', 10);
    const d = decide(rows, bodies, { maxPerDay: Number.isFinite(cap) && cap > 0 ? cap : MAX_PER_DAY, now: ctx.now });
    if (d.post && arg('out')) fs.writeFileSync(arg('out'), formatComment(rows, d.keys, ctx));
    process.stdout.write(`${JSON.stringify(d)}\n`);
  }
}
