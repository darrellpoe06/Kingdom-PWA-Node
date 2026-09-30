#!/usr/bin/env node
// =============================================================================
// lesson-inbox-bell.mjs -- the bell's decision, deterministic, no model (DR-0697)
// =============================================================================
// Darrell 2026-09-30: "I don't like timers... they cost more than we need...
// don't we have a better solution/s?"
//
// Given the waiting lesson rows (scripts/lesson-inbox-waiting.sql, psql -At
// with '|') and the bell PR's earlier comments, decide whether to ring:
//   - nothing waiting                     -> no comment (no AI turn)
//   - the same waiting set as last ring   -> no comment (the session already knows)
//   - a changed waiting set               -> ONE comment: ids, created_by, tags
// A row comes back as "new" when a build of it ended (failed, released,
// deferred): its key carries the count of the builder's `build:` stage tags,
// so a lesson the NAS tried and handed back rings again, while bookkeeping tags
// (mirrored, voice-transcribed) never do.
//
// NEVER A BODY. The parser keeps three fields; the formatter reads three
// fields; a tag that could break out of the comment is dropped.
//
// CLI:
//   node scripts/lesson-inbox-bell.mjs --rows rows.txt --comments comments.json --out body.md
//   prints {"post":bool,"reason":"...","waiting":n,"keys":[...]} and writes the
//   comment body to --out only when post is true.
// =============================================================================
import fs from 'node:fs';

export const MARKER = 'lesson-bell:v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SAFE_TAG = /^[A-Za-z0-9:@._\-/+]{1,200}$/;

/** psql -At '|' rows -> [{ id, created_by, tags }]. Every other column is dropped. */
export function parseWaiting(text) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    if (!line.trim()) continue;
    const cols = line.split('|');
    if (cols.length < 6) continue;
    const id = cols[0].trim();
    const createdBy = cols[2].trim();
    // tags is the 5th column; the source (4th) never contains '|' in practice,
    // but read tags from the right so a stray '|' cannot shift it.
    const tagsText = cols.slice(4, cols.length - 1).join('|');
    if (!UUID.test(id)) continue;
    let tags = [];
    try { tags = JSON.parse(tagsText); } catch { tags = []; }
    out.push({ id, created_by: UUID.test(createdBy) ? createdBy : 'unknown', tags: safeTags(tags) });
  }
  return out;
}

export function safeTags(tags) {
  return (Array.isArray(tags) ? tags : []).filter((t) => typeof t === 'string' && SAFE_TAG.test(t));
}

/** One key per waiting row: its id, plus how many build stages it has seen. */
export function rowKey(row) {
  const builds = safeTags(row.tags).filter((t) => t.startsWith('build:')).length;
  return builds ? `${row.id}#b${builds}` : row.id;
}

export function waitingKeys(rows) {
  return [...new Set((rows || []).map(rowKey))].sort();
}

/** The keys named in the bell's own LAST comment (null when it never rang). */
export function lastRungKeys(commentBodies) {
  const re = new RegExp(`<!-- ${MARKER} keys=([^ ]*) -->`);
  for (let i = (commentBodies || []).length - 1; i >= 0; i -= 1) {
    const m = re.exec(String(commentBodies[i] || ''));
    if (m) return m[1] ? m[1].split(',').sort() : [];
  }
  return null;
}

export function decide(rows, commentBodies) {
  const keys = waitingKeys(rows);
  const last = lastRungKeys(commentBodies);
  if (!keys.length) return { post: false, reason: 'nothing waiting', waiting: 0, keys };
  if (last && last.length === keys.length && last.every((k, i) => k === keys[i])) {
    return { post: false, reason: 'nothing changed since the last ring', waiting: keys.length, keys };
  }
  return { post: true, reason: last ? 'the waiting set changed' : 'first ring', waiting: keys.length, keys };
}

/** The comment: ids, created_by and tags only. */
export function formatComment(rows, keys) {
  const lines = [
    `**Lesson inbox bell:** ${rows.length} lesson row${rows.length === 1 ? '' : 's'} waiting on the live database.`,
    '',
    ...rows.map((r) => `- \`${r.id}\` by \`${r.created_by}\` · tags: ${safeTags(r.tags).map((t) => `\`${t}\``).join(', ') || '(none)'}`),
    '',
    'Read the words with `inbox-lesson-body.yml`; mark a shipped lesson with `inbox-lesson-tag.yml` (DR-0697).',
    '',
    `<!-- ${MARKER} keys=${keys.join(',')} -->`,
  ];
  return lines.join('\n');
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = parseWaiting(fs.readFileSync(arg('rows'), 'utf8'));
  let bodies = [];
  try { bodies = JSON.parse(fs.readFileSync(arg('comments'), 'utf8')); } catch { bodies = []; }
  const d = decide(rows, bodies);
  if (d.post && arg('out')) fs.writeFileSync(arg('out'), formatComment(rows, d.keys));
  process.stdout.write(`${JSON.stringify(d)}\n`);
}
