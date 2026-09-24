#!/usr/bin/env node
// =============================================================================
// feedback-fixed — the fix that ships marks the note it fixes (DR-0622)
// =============================================================================
// The flow graph's open loop, measured 2026-09-24: feedback → triage → work →
// the fix ships → ... and the sender's note stayed "being worked on" until a
// steward remembered to press Fixed. The fix and the note never met in data.
//
// Now they meet in the commit. A change that fixes a note names it — by the
// receipt code the sender was handed (e.g. "fixes feedback 7KQ-M4X", lib/
// feedback-receipt.js receiptCode) or by the note's id ("feedback 1a2b3c4d…",
// at least 8 hex characters). Once that commit is on the DEPLOYED build, the
// workflow feedback-fixed.yml marks the note fixed, writes which change fixed
// it where the sender reads it, and the receipt says Fixed. Only a note a
// commit names is ever touched; a declined note is never reopened.
//
//   node scripts/feedback-fixed.mjs sql commits.txt open.txt > fix.sql
//     commits.txt: git log --format='%h%x09%s%x09%b%x1e'
//     open.txt:    live-sql output: one note id per line (not fixed, not declined)
// =============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { receiptCode } from '../app/src/lib/feedback-receipt.js';

const CODE = '[23456789CFGHJKMNPQRTVWXY]{3}-[23456789CFGHJKMNPQRTVWXY]{3}';
const NAMED = new RegExp(`\\bfeedback\\s*#?\\s*(${CODE}|[0-9a-f]{8}[0-9a-f-]{0,28})`, 'gi');

/** commits: [{ sha, text }] → [{ ref, sha }] every feedback reference named. */
export function namedNotes(commits) {
  const out = [];
  for (const c of commits || []) {
    for (const m of String(c.text || '').matchAll(NAMED)) out.push({ ref: m[1], sha: c.sha, subject: c.subject || '' });
  }
  return out;
}

/** Match references against the open notes' ids (by receipt code or id prefix). */
export function matchNotes(refs, openIds) {
  const byCode = new Map(openIds.map((id) => [receiptCode(id), id]));
  const hits = new Map();
  for (const r of refs) {
    const ref = String(r.ref).trim();
    let id = null;
    if (/^[0-9A-Z]{3}-[0-9A-Z]{3}$/i.test(ref)) id = byCode.get(ref.toUpperCase()) || null;
    else id = openIds.find((x) => String(x).toLowerCase().startsWith(ref.toLowerCase())) || null;
    if (id && !hits.has(id)) hits.set(id, r);
  }
  return [...hits.entries()].map(([id, r]) => ({ id, sha: r.sha, subject: r.subject }));
}

const esc = (s) => String(s).replace(/'/g, "''");

export function fixSql(matches) {
  if (!matches.length) return "SELECT 'fixed', 0;\n";
  const rows = matches.map((m) => `('${esc(m.id)}'::uuid, '${esc(`Fixed by the update ${m.sha}: ${m.subject}`.slice(0, 400))}')`).join(',\n  ');
  return `WITH named(id, note) AS (VALUES
  ${rows}
), up AS (
  UPDATE public.feedback f
     SET triage_status = 'fixed',
         triage_notes = CASE WHEN coalesce(btrim(f.triage_notes), '') = '' THEN n.note ELSE f.triage_notes END
    FROM named n
   WHERE f.id = n.id AND f.triage_status NOT IN ('fixed', 'declined')
  RETURNING f.id
)
SELECT 'fixed', count(*) FROM up;
`;
}

export function parseCommits(text) {
  return String(text || '').split('\x1e').map((rec) => rec.trim()).filter(Boolean).map((rec) => {
    const [sha, subject = '', body = ''] = rec.split('\t');
    return { sha, subject, text: `${subject}\n${body}` };
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, commitsFile, openFile] = process.argv.slice(2);
  if (cmd !== 'sql' || !commitsFile || !openFile) {
    console.error('usage: node scripts/feedback-fixed.mjs sql commits.txt open.txt');
    process.exit(2);
  }
  const refs = namedNotes(parseCommits(readFileSync(commitsFile, 'utf8')));
  const open = readFileSync(openFile, 'utf8').split('\n').map((l) => l.trim()).filter((l) => /^[0-9a-f-]{36}$/i.test(l));
  const matches = matchNotes(refs, open);
  console.error(`commits name ${refs.length} feedback reference(s); ${matches.length} match an open note`);
  process.stdout.write(fixSql(matches));
}
