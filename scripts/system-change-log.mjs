#!/usr/bin/env node
// =============================================================================
// system-change-log — what changed, when exactly, in which layer, and how it is
// reversed (DR-1111)
// =============================================================================
// Darrell, 2026-10-19: "Comprehensive meaning whatever we have currently...
// what changed and when exactly like logs... and also the ability to reverse
// any undermining processes because every system is interdependent..."
//
// Every change reaches main as ONE squash commit (auto-merge.yml), so main's
// first-parent history IS the system's change log: one line per merged PR,
// stamped to the second by git itself. This reads that history and adds the
// two things a bare `git log` does not say:
//
//   - WHICH LAYERS a change touched, derived from its paths, never guessed
//     from its wording (app, transport, NAS, data, factory, content, ledger);
//   - HOW IT IS REVERSED in the layers it touched. Reversal is not the same
//     in every layer. A revert of app code is fully undone by the next
//     deploy. A revert of a migration removes the FILE but not the change
//     already applied to the database, which only a new forward migration
//     undoes. Saying "just revert it" about a migration would be a lie.
//
// Pure functions are exported for the test; the CLI only shells out to git.
//
//   node scripts/system-change-log.mjs                 # last 7 days, markdown
//   node scripts/system-change-log.mjs --since=2026-10-12 --json
//   node scripts/system-change-log.mjs --ref=origin/main --limit=50
// =============================================================================
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Order matters: the first matching rule names the layer of a path. Content
// (lessons, courses, the KJV) is checked before the generic app rule, because
// a lesson file lives under app/src/lib but is not app behaviour.
export const LAYER_RULES = [
  { layer: 'data', test: (p) => /^infra\/supabase\//.test(p) },
  // Everything else under infra/ is installed on the NAS by services-sync (or,
  // for cf-roads-worker, beside it): church-media-golive, voice-studio, n8n...
  { layer: 'nas', test: (p) => /^infra\//.test(p) },
  { layer: 'transport', test: (p) => /^app\/functions\//.test(p) || p === 'app/public/_routes.json' || p === 'app/public/_redirects' },
  { layer: 'factory', test: (p) => /^\.github\//.test(p) || /^scripts\//.test(p) || /^\.claude\//.test(p) },
  { layer: 'content', test: (p) => /^app\/public\/bible\//.test(p) || /^app\/src\/lib\/(living-lessons|.*-course|.*-class|learn-|lesson-)/.test(p) },
  { layer: 'tests', test: (p) => /^app\/src\/__tests__\//.test(p) },
  { layer: 'app', test: (p) => /^app\//.test(p) },
  { layer: 'ledger', test: (p) => /^docs\/decisions\//.test(p) },
  { layer: 'docs', test: (p) => /^docs\//.test(p) || /\.md$/.test(p) },
];

/** The layer a single path belongs to. Unknown paths are 'other', never dropped. */
export function layerOf(path) {
  const p = String(path || '');
  for (const r of LAYER_RULES) if (r.test(p)) return r.layer;
  return 'other';
}

/** The distinct layers a change touched, in a stable order. */
export function layersOf(paths) {
  const order = ['app', 'transport', 'nas', 'data', 'factory', 'content', 'tests', 'ledger', 'docs', 'other'];
  const set = new Set((paths || []).map(layerOf));
  return order.filter((l) => set.has(l));
}

/** Migration files a change added or edited: these reverse differently. */
export function migrationsOf(paths) {
  return (paths || []).filter((p) => /^infra\/supabase\/migrations-auto\/.+\.sql$/.test(p));
}

/**
 * How a change is reversed, per layer it touched. Each sentence is about a
 * mechanism the repository actually has; none promises an undo it cannot do.
 */
export function reversalOf({ sha, paths }) {
  const layers = layersOf(paths);
  const short = String(sha || '').slice(0, 9);
  // The lane only opens and arms branches named feat/ fix/ merge/ docs/
  // claude/ or ccr- (auto-open-pr.yml, auto-merge.yml). GitHub's own Revert
  // button makes revert-NNNN-..., which the lane never picks up.
  const steps = [`git revert ${short} on a claude/ or ccr- branch (not GitHub's Revert button, whose revert-NNNN branch the lane ignores); the lane opens, gates and merges it like any change`];
  if (layers.includes('app') || layers.includes('content') || layers.includes('transport')) {
    // deploy-freshness's own measurement: its cron fired 7.7% of the time, with
    // gaps up to 11.3 h, so it is a backstop and never a promised time.
    steps.push('the revert redeploys Pages on merge, dispatched by auto-merge\'s heal-deploy; deploy-freshness is only a backstop, since its schedule fires irregularly (measured 7.7% of fires, gaps up to 11.3 h), so confirm a deploy run for the revert\'s SHA; open devices pick up the reverted build at their next update check')
  }
  if (layers.includes('nas')) {
    steps.push('the NAS follows main: services-sync applies the reverted code on its next 15-minute cycle');
  }
  const migs = migrationsOf(paths);
  if (migs.length) {
    steps.push(`SCHEMA IS FORWARD-ONLY: reverting removes ${migs.length === 1 ? 'the migration file' : `${migs.length} migration files`} but NOT what was already applied; reverse it with a NEW migration that undoes ${migs.map((m) => m.split('/').pop()).join(', ')}`);
  }
  if (layers.includes('factory')) {
    steps.push('a workflow can also be stopped at once by its kill-switch variable or the `hold` label, without waiting for the revert');
  }
  return steps;
}

/** PR number and decision records named in a squash subject and body. */
export function refsOf(subject, body = '') {
  const pr = (String(subject).match(/\(#(\d+)\)\s*$/) || [])[1] || null;
  const drs = [...new Set(`${subject}\n${body}`.match(/DR-\d{4}/g) || [])];
  return { pr: pr ? Number(pr) : null, drs };
}

/** One change-log entry from git's raw fields. Pure. */
export function entryOf({ sha, at, author, subject, body = '', paths = [] }) {
  const { pr, drs } = refsOf(subject, body);
  return {
    sha,
    at,
    author,
    subject,
    pr,
    drs,
    layers: layersOf(paths),
    files: paths.length,
    migrations: migrationsOf(paths),
    reverse: reversalOf({ sha, paths }),
  };
}

/** Markdown for a list of entries, newest first. Pure. */
export function toMarkdown(entries, { since = '', ref = 'origin/main' } = {}) {
  const lines = [];
  lines.push(`# System change log — ${ref}${since ? ` since ${since}` : ''}`);
  lines.push('');
  lines.push(`${entries.length} merged change(s). Times are UTC, from git's own commit stamp. Generated by \`scripts/system-change-log.mjs\` (DR-1111).`);
  lines.push('');
  const tally = {};
  for (const e of entries) for (const l of e.layers) tally[l] = (tally[l] || 0) + 1;
  lines.push(`Changes touching each layer: ${Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([l, n]) => `${l} ${n}`).join(' · ') || 'none'}.`);
  const migs = entries.filter((e) => e.migrations.length);
  lines.push(`Changes carrying a schema migration (forward-only, see each entry): ${migs.length}.`);
  lines.push('');
  for (const e of entries) {
    const head = `${e.at.replace('T', ' ').replace(/\+00:00$|Z$/, '')} UTC · \`${e.sha.slice(0, 9)}\`${e.pr ? ` · #${e.pr}` : ''}${e.drs.length ? ` · ${e.drs.join(', ')}` : ''}`;
    lines.push(`- **${head}**`);
    lines.push(`  ${e.subject.replace(/\s*\(#\d+\)\s*$/, '')}`);
    lines.push(`  Layers: ${e.layers.join(', ') || 'none'} (${e.files} file${e.files === 1 ? '' : 's'}).${e.migrations.length ? ` Migrations: ${e.migrations.map((m) => m.split('/').pop()).join(', ')}.` : ''}`);
    lines.push(`  Reverse: ${e.reverse.join('; ')}.`);
  }
  return lines.join('\n') + '\n';
}

// ----------------------------------------------------------------------------
// CLI — the only part that touches git.
// ----------------------------------------------------------------------------
function readGit({ ref, since, limit }) {
  const SEP = '\x1e'; const FS = '\x1f';
  const args = ['log', ref, '--first-parent', `--format=${SEP}%H${FS}%cI${FS}%an${FS}%s${FS}%b${FS}`, '--name-only'];
  if (since) args.push(`--since=${since}`);
  if (limit) args.push(`-n`, String(limit));
  const out = execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  return out.split(SEP).filter((s) => s.trim()).map((chunk) => {
    const parts = chunk.split(FS);
    const [sha, at, author, subject, body] = parts;
    const paths = (parts[5] || '').split('\n').map((s) => s.trim()).filter(Boolean);
    return entryOf({ sha, at, author, subject, body, paths });
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const arg = (k) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : ''; };
  const ref = arg('ref') || 'origin/main';
  const since = arg('since') || (arg('limit') ? '' : new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const limit = Number(arg('limit')) || 0;
  const entries = readGit({ ref, since, limit });
  if (process.argv.includes('--json')) process.stdout.write(JSON.stringify({ ref, since, entries }, null, 2) + '\n');
  else process.stdout.write(toMarkdown(entries, { since, ref }));
}
