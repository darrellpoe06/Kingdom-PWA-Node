// =============================================================================
// release-tier-gate — the PARAMETER that decides which PRs auto-merge on green
// =============================================================================
// Darrell 2026-07-05: "when I said no waiting that was only for me because we
// have the parameters" → "Yes tighten that." The streamlined lane (DR-0103)
// removed the wait on the HUMAN; it must not remove the tiers. So the lane no
// longer auto-merges every green PR — it auto-merges only PRs this gate proves
// are Tier A (the low-risk tier, RELEASE-TIERS.md). Everything else is HELD for
// the family's soak/review; a human releases it with the `ship` label.
//
// WHY DETERMINISTIC + DEFAULT-TO-HOLD. Tiering is a judgment call the tier doc
// spells out (six low-risk tests; "user-trust-bearing"; flowchart rule 5:
// "None of the above cleanly? → Default to Tier B"). A path pattern cannot read
// intent, so this gate is deliberately CONSERVATIVE: it lets a PR through ONLY
// when every changed path is in the provable-safe set (docs / memory / tests /
// markdown copy). Any product code, and especially any high-risk path
// (schema/migrations, CI workflows, money, front-door/mission, COLG onboarding,
// autonomous automation, new APIs), holds. Unknown ⇒ hold. The safe side of the
// error is a short soak, never a trust-bearing change slipping straight to main
// (DR-0076 verification doctrine; RELEASE-TIERS rule 5).
//
// This gate NEVER merges anything and never mutates a PR. It only classifies a
// set of changed paths → { tier, autoMerge, reasons }. The workflows read that
// and decide whether to ARM native auto-merge. `hold` (human hard-brake) and
// `ship` (human release of a held B/C PR) are applied in the workflow, not here.
//
// Proven-to-catch: scripts + app/src/__tests__/release-tier-gate.test.js pin
// that docs-only rides through, and that a migration / a workflow edit / a
// product component / a money path each HOLD — and that flipping the safe-set
// off would let a component through (the inversion), so a gate that silently
// stopped catching is itself a failing test.
//
// $0, no deps, no network. Importable for vitest; also a CLI:
//   node scripts/release-tier-gate.mjs path/one path/two ...     # args
//   printf '%s\n' path/one path/two | node scripts/release-tier-gate.mjs  # stdin
// Prints a human summary to stderr and a single JSON line to stdout:
//   {"tier":"A","autoMerge":true,"reasons":[...],"paths":N}
// Exit code is always 0 — the classification is data for the workflow, not a
// build pass/fail.
// =============================================================================

// A path is provably Tier A (safe to auto-merge) only if it matches one of
// these. Docs, memory, foundation records, and tests carry no user-facing
// runtime behavior; markdown/text is copy. Kept as predicates (not globs) so
// the matching is explicit and dependency-free.
const TIER_A_SAFE = [
  (p) => p.startsWith('docs/'),
  (p) => p.startsWith('memory/'),
  (p) => p.endsWith('.md'),
  (p) => p.endsWith('.mdx'),
  (p) => p.endsWith('.txt'),
  (p) => p === 'LICENSE',
  // Test-only files can't ship product behavior — they gate, they don't run in prod.
  (p) => /(^|\/)__tests__\//.test(p),
  (p) => /\.test\.(js|jsx|ts|tsx|mjs)$/.test(p),
  (p) => /\.spec\.(js|jsx|ts|tsx|mjs)$/.test(p),
];

// A path matching ANY of these forces Tier C — the highest-risk classes from
// RELEASE-TIERS.md (schema/DB, the CI/automation lane itself, real money,
// front-door/mission identity, COLG/church onboarding, autonomous automation,
// new server APIs/backends). These HOLD even alongside otherwise-safe files.
const TIER_C_HIGH_RISK = [
  // Schema / database migrations
  { re: /(^|\/)migrations?[-/]/i, why: 'database migration (schema)' },
  { re: /\.sql$/i, why: 'SQL / schema change' },
  // The CI + delivery lane itself (this gate included) — automation
  { re: /^\.github\/workflows\//, why: 'CI / delivery-lane workflow' },
  // Server-side / new APIs / infra
  { re: /^app\/functions\//, why: 'server API (Cloudflare Pages Function)' },
  { re: /^app\/api\//, why: 'server API route' },
  { re: /^backend\//, why: 'backend service' },
  { re: /^infra\//, why: 'infrastructure (deploy / orchestrator / NAS jobs)' },
  // Real money flow
  { re: /stripe|payment|payout|billing|checkout-seam|commerce/i, why: 'real money flow' },
  // Front-door / mission identity
  { re: /(^|\/)(About|AdoptPoeTech|AudienceWindow)\.jsx$/, why: 'front-door / mission identity surface' },
  // COLG / church onboarding + instance provisioning
  { re: /default-church|church-instance|provisioning|conference-identity/i, why: 'COLG / church onboarding or provisioning' },
  // Autonomous / timer-driven automation (Three-Brakes class)
  { re: /orchestrator|ops-runner|wake-orchestrator|scheduler|gpu-scheduler|-runner\.(py|mjs|js)$|autonomous/i, why: 'autonomous / timer-driven automation' },
];

const isSafe = (p) => TIER_A_SAFE.some((f) => f(p));
const highRiskHit = (p) => TIER_C_HIGH_RISK.find((r) => r.re.test(p));

// classifyTier(paths) — the pure decision. paths: array of repo-relative,
// forward-slash file paths changed by the PR (added/modified/removed/renamed).
// Returns { tier: 'A'|'B'|'C', autoMerge: boolean, reasons: string[] }.
//   · Tier A  → autoMerge true  (rides the lane on green)
//   · Tier B  → autoMerge false (held for soak/review; `ship` to release)
//   · Tier C  → autoMerge false (held; highest-risk classes)
// An EMPTY change set is treated as B (never auto-merge "nothing" — a real PR
// always changes something; empty means we couldn't read the diff → be safe).
export function classifyTier(paths) {
  const files = (Array.isArray(paths) ? paths : [])
    .map((p) => String(p || '').trim().replace(/^\.\//, ''))
    .filter(Boolean);

  if (files.length === 0) {
    return { tier: 'B', autoMerge: false, reasons: ['no changed files detected — holding to be safe'] };
  }

  // Tier C wins outright if any path is high-risk.
  const cHits = files.map((p) => ({ p, hit: highRiskHit(p) })).filter((x) => x.hit);
  if (cHits.length > 0) {
    const reasons = [...new Set(cHits.map((x) => `${x.hit.why} (${x.p})`))];
    return { tier: 'C', autoMerge: false, reasons };
  }

  // Tier A only if EVERY path is provably safe.
  const unsafe = files.filter((p) => !isSafe(p));
  if (unsafe.length === 0) {
    return { tier: 'A', autoMerge: true, reasons: ['every changed path is docs / memory / tests / copy'] };
  }

  // Anything else → Tier B (default-to-soak, RELEASE-TIERS rule 5).
  return {
    tier: 'B',
    autoMerge: false,
    reasons: [`${unsafe.length} product/code path${unsafe.length === 1 ? '' : 's'} not provably low-risk (e.g. ${unsafe[0]})`],
  };
}

// --- CLI ----------------------------------------------------------------------
// Only runs when executed directly, never on import (vitest-safe).
const invokedDirectly = (() => {
  try {
    return typeof process !== 'undefined'
      && Array.isArray(process.argv)
      && /release-tier-gate\.mjs$/.test(process.argv[1] || '');
  } catch { return false; }
})();

if (invokedDirectly) {
  const fromArgs = process.argv.slice(2);
  const readStdin = () => new Promise((resolve) => {
    let buf = '';
    if (process.stdin.isTTY) return resolve('');
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { buf += c; });
    process.stdin.on('end', () => resolve(buf));
    // Guard: if nothing arrives, don't hang forever.
    setTimeout(() => resolve(buf), 2000);
  });

  const paths = fromArgs.length > 0
    ? fromArgs
    : (await readStdin()).split('\n').map((s) => s.trim()).filter(Boolean);

  const result = classifyTier(paths);
  const verb = result.autoMerge ? 'AUTO-MERGE on green' : 'HOLD for soak/review';
  process.stderr.write(
    `release-tier-gate: Tier ${result.tier} → ${verb}\n` +
    result.reasons.map((r) => `  · ${r}`).join('\n') + '\n'
  );
  process.stdout.write(JSON.stringify({
    tier: result.tier, autoMerge: result.autoMerge, reasons: result.reasons, paths: paths.length,
  }) + '\n');
}
