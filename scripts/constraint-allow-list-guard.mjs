#!/usr/bin/env node
// =============================================================================
// constraint-allow-list-guard — AN ALLOW-LIST IS ADDED TO, NEVER REWRITTEN
// =============================================================================
// 2026-10-12. DR-0976. The machine check mined out of a 28-hour live outage.
//
// WHAT HAPPENED. 0275 rebuilt door_events_subject_check and wrote the list
// from scratch:
//
//   0263 -> rent, work, document
//   0266 -> rent, work, document, camera
//   0269 -> rent, work, document, camera, stay
//   0275 -> rent, work, application, stay, portal-request   <-- two deleted
//
// 'document' is written three times by 0263 (requested / signed / fully-signed)
// and 'camera' twice by a TRIGGER in 0266, so lease signing and door-camera
// access both started raising on every write. rls-isolation went red on that
// commit and stayed red for 10 runs across ~28 hours while it ran live.
//
// WHY A GUARD AND NOT MORE CARE. 0275's own comment reasons about this exact
// hazard, at length, and still got the set wrong:
//
//   "ITS `subject` CHECK IS AN ALLOW-LIST and this widens it... if it merges
//    first and mine rebuilt the constraint from 0262's two values, this
//    migration would SILENTLY DELETE its value and 0272's writes would start
//    failing."
//
// They guarded the UNMERGED sibling branch and did the feared thing to the
// ALREADY-MERGED ones. The comment says "widens"; the statement narrows.
// Reconstructing an allow-list from memory across four files is not something
// prose can be trusted to do — so it is checked instead.
//
// THE RULE: AN ALLOW-LIST NEVER SHRINKS WITHOUT SAYING SO. Walking the chain
// in replay order, each `ADD CONSTRAINT ... CHECK (col IN (...))` must carry
// every value an earlier file already allowed. The historical union is the
// proxy for "values something writes", because a value was added to an
// allow-list precisely because a writer needed it.
//
// A SECOND RULE WAS BUILT, PROVEN USELESS, AND REMOVED — recorded here so it
// is not re-attempted blind. The intent was good: a `CASE col ... ELSE false`
// read policy silently hides a value with no arm (the row is written and then
// nobody can read it), which is how 0275's OWN 'portal-request' events became
// write-only, a third live bug found by hand. But a regex cannot do it:
//
//   * Matching policy to allow-list BY COLUMN NAME flagged four policies on
//     entirely different tables (rent_payee_read, door_camera_menu_read,
//     door_stays_family_read, property_document_signatures_read) that merely
//     CASE over a column of the same name. A guard that cries wolf is deleted
//     within a week (P46).
//   * Worse, it could not read 0279 — the file it exists to protect. That
//     policy composes its arms into a variable and EXECUTEs the result, so
//     there are no literal WHEN clauses between USING and END. Loosening the
//     regex to scan the whole file would make it PASS without checking, which
//     is the theater DR-0076 §3 forbids.
//
// So the arm parity is proven where it can actually be proven — by applying
// 0279 to a real PostgreSQL and reading pg_policy back — and pinned by a test
// against the `arms :=` block it composes. See DR-0976.
//
// AN INTENTIONAL REMOVAL IS DECLARED, NOT SILENT. A file may drop a value by
// carrying a line:
//
//   -- allow-list-change: <constraint> <value> -- <why>
//
// That turns a side effect of retyping into a recorded decision, which is the
// whole difference between what 0275 did and what it meant to do.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'infra/supabase/migrations-auto');

/** Migration files in the order a replay applies them: by numeric prefix. */
export function migrationFiles(dir = DIR, read = readdirSync) {
  return read(dir)
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b));
}

const list = (raw) => raw.split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);

/**
 * Every `ADD CONSTRAINT <name> ... CHECK (<col> IN ('a','b'))` in one file.
 * Pure. Returns [{constraint, column, values}].
 */
export function allowListsIn(sql) {
  const out = [];
  const re = /ADD\s+CONSTRAINT\s+([a-z0-9_]+)\s*\n?\s*CHECK\s*\(\s*([a-z0-9_]+)\s+IN\s*\(([^)]*)\)\s*\)/gi;
  let m;
  while ((m = re.exec(sql))) out.push({ constraint: m[1], column: m[2], values: list(m[3]) });
  return out;
}

/** The declarations a file carries, as lowercase `<target> <value>` keys. */
export function declarationsIn(sql) {
  return new Set(
    [...sql.matchAll(/--\s*allow-list-change:\s*([a-z0-9_-]+)\s+([a-z0-9_-]+)/gi)]
      .map((m) => `${m[1].toLowerCase()} ${m[2].toLowerCase()}`),
  );
}

/**
 * Walk the chain and judge it. Pure — the caller supplies the files.
 *
 * @param {Array<{name:string, sql:string}>} files in replay order
 * @returns {{findings:string[], checked:number, lists:object}}
 */
export function judgeChain(files) {
  const seen = new Map();   // constraint -> Set of every value ever allowed
  const last = new Map();   // constraint -> {name, column, values}
  const findings = [];

  for (const { name, sql } of files) {
    // A DECLARATION BINDS ONLY THE FILE THAT CARRIES IT. Accumulating them
    // across the chain was the first version, and my own mutation test caught
    // it: once 0275 declared 'document' removable, EVERY later file could drop
    // it again in silence, so reverting 0279's union to 0275's narrow list
    // produced no finding at all. One file's recorded mistake must never
    // become a standing licence for the next.
    const declared = declarationsIn(sql);
    for (const l of allowListsIn(sql)) {
      const union = seen.get(l.constraint) || new Set();
      const dropped = [...union].filter((v) => !l.values.includes(v));
      const undeclaredDrops = dropped.filter(
        (v) => !declared.has(`${l.constraint.toLowerCase()} ${v.toLowerCase()}`),
      );
      if (undeclaredDrops.length) {
        findings.push(
          `${name}: ${l.constraint} DROPS ${undeclaredDrops.map((v) => `'${v}'`).join(', ')} — `
          + `an allow-list is added to, never rewritten. It now allows `
          + `${l.values.map((v) => `'${v}'`).join(', ')}, and a value removed here starts `
          + `REJECTING every write that still uses it. Carry the union, or declare the removal `
          + `with "-- allow-list-change: ${l.constraint} ${undeclaredDrops[0]} -- <why>".`,
        );
      }
      for (const v of l.values) union.add(v);
      seen.set(l.constraint, union);
      last.set(l.constraint, { name, ...l });
    }
  }

  return { findings, checked: last.size, lists: Object.fromEntries([...last].map(([k, v]) => [k, v.values])) };
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const files = migrationFiles().map((name) => ({ name, sql: readFileSync(join(DIR, name), 'utf8') }));
  const { findings, checked } = judgeChain(files);
  if (findings.length) {
    console.error('constraint-allow-list-guard: FAIL\n');
    for (const f of findings) console.error(`  - ${f}\n`);
    process.exit(1);
  }
  console.log(
    `constraint-allow-list-guard: OK — ${checked} allow-list(s) across ${files.length} migrations; `
    + 'none narrows what an earlier file allowed.',
  );
}
