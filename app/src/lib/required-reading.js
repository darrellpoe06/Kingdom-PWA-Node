// =============================================================================
// required-reading — the manifest decides what must be read, not the model
// =============================================================================
// Darrell 2026-08-11: "Since we cant rely on claude to do this... can we build
// something that claude just uses when it's time same for Ari... so only use an
// LLMs when necessary?"
//
// That is DR-0080 applied to context itself. "Which foundation documents govern
// this file?" is a PURE FUNCTION OF THE PATH — a known mapping, exactly the
// class DR-0080 says must be deterministic code with no LLM call. Leaving it to
// the agent's judgment is both unreliable (it produced a cited-but-unread header
// in this very session) and wasteful (spending model capacity re-deriving a
// lookup every session).
//
// THE PAIR, AND WHY BOTH HALVES ARE NEEDED:
//   required-reading (this file) — BEFORE the work: given a path, return the
//     documents that govern it. Deterministic, no model.
//   cited-but-unread              — AFTER the work: given a claim, verify the
//     sources were actually opened. Deterministic, no model.
// One tells you what to read; the other proves you did. Neither asks an LLM
// anything, and neither depends on remembering a rule across a compaction.
//
// USABLE BY ARI AND ANY AGENT: a plain function over strings, no I/O, no
// framework. The hook calls it, Ari calls it, a test calls it.
//
// KEPT HONEST BY A TEST: every document named below is asserted to exist on
// disk, so this manifest cannot rot into pointing at files that were renamed or
// deleted — a stale requirement is worse than none, because it teaches people
// to ignore the gate.
// =============================================================================

/**
 * Each rule: when a touched path matches, these documents govern it.
 * `why` is shown to the agent, because a requirement without a reason gets
 * treated as bureaucracy and routed around.
 */
export const RULES = [
  {
    id: 'new-surface',
    match: (p) => /^app\/src\/components\/[^/]+\.jsx$/.test(p),
    read: ['UX-PATTERNS.md', 'EXCELLENCE-STANDARD.md', 'LESSONS-LEARNED.md'],
    why: 'A user-facing surface. CLAUDE.md requires LESSONS-LEARNED before designing new surfaces; UX-PATTERNS carries the shipped patterns (progressive disclosure, large-print, the still screen) so you extend them instead of reinventing them.',
  },
  {
    id: 'user-data-persistence',
    match: (p) => /(sync|persist|progress|history|account)/i.test(p) && /^app\/src\/lib\//.test(p),
    read: ['USER-ACCOUNTS-AND-HISTORIES-STANDARD.md', 'DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md'],
    why: 'Persisting a user\'s own record. The standard sets what an account may hold and that each user sees only their own history; DATA-AS-EMPOWERMENT sets the eight binding behaviours including exportable-always. Scope (user vs instance) is decided here, not by copying the nearest neighbour.',
  },
  {
    id: 'schema-rls',
    match: (p) => /^infra\/supabase\/.*\.sql$/.test(p),
    read: ['DR-0060'],
    why: 'A new table. Tenancy scoping and RLS are the real data gate, never the UI. The tenancy guard fails the build if instance_id is present without RLS.',
  },
  {
    id: 'nas-tooling',
    match: (p) => /^infra\/nas-[^/]+\//.test(p),
    read: ['DR-0083'],
    why: 'NAS-side tooling. Plain deterministic Python on the NAS, not n8n; the three brakes are build requirements.',
  },
  {
    id: 'scripture-content',
    match: (p) => /(lesson|scripture|verse|godhead|study|sermon)/i.test(p) && /^app\/src\/(lib|components)\//.test(p),
    read: ['SCRIPTURE-REFERENCE-STANDARD.md'],
    why: 'Content touching the Word. Every citation is fetched verbatim and never produced from memory; the verbatim gate fails the build on a tampered quote.',
  },
  {
    id: 'autonomous-loop',
    match: (p) => /^infra\/nas-loops\//.test(p) || /(cron|scheduler|loop-runner)/i.test(p),
    read: ['DR-0247', 'DR-0248'],
    why: 'Timer-driven or self-triggering automation. Budget and single-instance lock are build requirements; the amended law starts agreed work by default rather than parking it on a human.',
  },
];

/**
 * Deterministic: which documents govern these paths.
 * Pure function of its input — same paths in, same requirement out, no model.
 *
 * @param {string[]} paths repo-relative paths being created or edited
 * @returns {{docs: string[], reasons: {doc: string, why: string, rule: string}[]}}
 */
export function resolveRequiredReading(paths) {
  const list = (Array.isArray(paths) ? paths : [])
    .filter((p) => typeof p === 'string')
    // Tolerate absolute paths by trimming anything before the repo root marker.
    .map((p) => p.replace(/^.*?(?=app\/|infra\/|docs\/|scripts\/)/, ''));

  const docs = new Set();
  const reasons = [];
  for (const rule of RULES) {
    if (!list.some((p) => { try { return rule.match(p); } catch { return false; } })) continue;
    for (const doc of rule.read) {
      if (!docs.has(doc)) {
        docs.add(doc);
        reasons.push({ doc, why: rule.why, rule: rule.id });
      }
    }
  }
  return { docs: Array.from(docs), reasons };
}

/**
 * What still needs reading, given what this session already opened.
 * The subtraction is the whole point: a session that already read a document is
 * never asked twice, so the gate stays quiet and therefore stays enabled.
 */
export function outstandingReading(paths, evidenceText) {
  const { docs, reasons } = resolveRequiredReading(paths);
  const seen = typeof evidenceText === 'string' ? evidenceText : '';
  const missing = docs.filter((d) => !seen.includes(d.replace(/\.md$/, '')));
  return { missing, reasons: reasons.filter((r) => missing.includes(r.doc)) };
}

/** The message the hook shows: what to read, where it is, and why it governs. */
export function requiredReadingMessage(missing, reasons) {
  const where = (d) => (d.startsWith('DR-')
    ? `docs/decisions/${d}-*.md`
    : `docs/00-foundations/_root/${d}`);
  return [
    'required-reading (DR-0080: this lookup is deterministic, so it is not left to you)',
    '',
    'This path is governed by documents this session has not opened:',
    ...missing.map((d) => `  - ${d}   ->  ${where(d)}`),
    '',
    ...reasons.map((r) => `  ${r.doc}: ${r.why}`),
    '',
    'Read them, then continue. They frequently change the design — that is why',
    'they are required rather than suggested.',
  ].join('\n');
}
