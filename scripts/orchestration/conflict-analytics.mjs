// =============================================================================
// conflict-analytics — the CONFLICT-EVALUATION LEARNING LOOP (ITIL CSI applied
// to orchestration; events-as-data).
// =============================================================================
// THE QUESTION THIS ANSWERS (Darrell, 2026-06-17): "Do we have orchestration
// conflict evaluations for fewer conflicts as we move forward because of the
// fixes as we grow?" The answer is this loop: every merge/rebase conflict is
// RECORDED as a structured event; the loop PATTERN-DETECTS over those events
// (hot files, chronically-contended areas, a conflict-rate over time); and it
// FEEDS PREVENTION BACK (rank what to decompose first, warn before new work is
// filed into a contended file). The target is a conflict-rate that trends DOWN
// as the system grows — measured, not claimed (DR-0076 Verification Doctrine).
//
// The spine is docs/orchestration/conflict-events.jsonl — append-only, one JSON
// object per line, every line traceable to evidence (a PR, a git log, a guard).
// Nothing here invents data: the manifest is built from the real spine, and an
// empty spine yields an honest empty report, never a painted trend.
//
// All exported functions are PURE (take an events array, return a value) so the
// loop unit-tests without a repo and PROVES it catches a real collision
// (DR-0076 proven-to-catch). scanEvents()/buildConflictManifest() are the only
// impure readers (they read the spine file); the analysis is pure.
//
// CLI:
//   node scripts/orchestration/conflict-analytics.mjs            # full report
//   node scripts/orchestration/conflict-analytics.mjs --check <file> [<file>...]
//                                                               # PRE-SPAWN warning:
//                                                               # would this work touch a hot/contended file?
//   node scripts/orchestration/conflict-analytics.mjs --record '<json event>'
//                                                               # append a new conflict event to the spine
// =============================================================================
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EVENTS_REL = 'docs/orchestration/conflict-events.jsonl';
export const MONOLITH_PATH = 'app/src/poe-financial-mvp-v28.jsx';
export const MIGRATIONS_DIR = 'infra/supabase/migrations-auto';

// Valid taxonomy — kept small and binding so the spine stays analyzable.
export const CAUSES = ['shared-file', 'migration', 'logic', 'superseded'];
export const RESOLUTIONS = ['rebase', 'close-superseded', 'manual', 'grandfathered', 'pending'];

function repoRoot() {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, EVENTS_REL))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..');
}

// --- spine I/O ---------------------------------------------------------------

// Parse JSONL text into events. Tolerant of blank lines; a malformed line is
// surfaced as a problem (never silently dropped — a corrupt spine must be loud).
export function parseEvents(raw) {
  const events = [];
  const problems = [];
  const lines = String(raw || '').split('\n');
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    try {
      const ev = JSON.parse(t);
      const v = validateEvent(ev);
      if (!v.ok) problems.push(`line ${i + 1}: ${v.problems.join('; ')}`);
      events.push(ev);
    } catch (e) {
      problems.push(`line ${i + 1}: invalid JSON (${(e && e.message) || 'parse error'})`);
    }
  });
  return { events, problems };
}

// Schema check for one event. Returns { ok, problems }. Pure.
export function validateEvent(ev) {
  const problems = [];
  if (!ev || typeof ev !== 'object') return { ok: false, problems: ['not an object'] };
  if (!ev.ts || Number.isNaN(Date.parse(ev.ts))) problems.push('missing/invalid ts (ISO-8601)');
  if (!ev.file || typeof ev.file !== 'string') problems.push('missing file (primary path or area)');
  if (!CAUSES.includes(ev.cause)) problems.push(`cause must be one of ${CAUSES.join('|')}`);
  if (ev.resolution && !RESOLUTIONS.includes(ev.resolution)) problems.push(`resolution must be one of ${RESOLUTIONS.join('|')}`);
  if (ev.files && !Array.isArray(ev.files)) problems.push('files must be an array');
  if (ev.branches && !Array.isArray(ev.branches)) problems.push('branches must be an array');
  return { ok: problems.length === 0, problems };
}

export function scanEvents(file) {
  const abs = file || join(repoRoot(), EVENTS_REL);
  if (!existsSync(abs)) return { events: [], problems: [] };
  return parseEvents(readFileSync(abs, 'utf8'));
}

// Append one validated event to the spine (the RECORD step). Refuses to write an
// invalid event — the spine can never be corrupted by the recorder itself.
export function recordEvent(ev, file) {
  const v = validateEvent(ev);
  if (!v.ok) throw new Error('refusing to record invalid event: ' + v.problems.join('; '));
  const abs = file || join(repoRoot(), EVENTS_REL);
  appendFileSync(abs, JSON.stringify(ev) + '\n');
  return ev;
}

// --- PATTERN DETECTION (pure) ------------------------------------------------

// Hot files: per primary `file`, how many incidents collided on it, how many
// distinct branches contended, the causes seen, and when last seen. Ranked
// most-contended first. THIS is how the monolith surfaces as #1 — it is the one
// file that recurs across incidents while everything else is touched once.
export function hotFiles(events) {
  const map = new Map();
  for (const ev of events) {
    const f = ev.file;
    if (!f) continue;
    if (!map.has(f)) map.set(f, { file: f, incidents: 0, branches: new Set(), causes: new Set(), prs: new Set(), lastSeen: null });
    const h = map.get(f);
    h.incidents += 1;
    (ev.branches || []).forEach((b) => b && h.branches.add(b));
    (ev.prs || []).forEach((p) => p != null && h.prs.add(p));
    if (ev.cause) h.causes.add(ev.cause);
    if (!h.lastSeen || Date.parse(ev.ts) > Date.parse(h.lastSeen)) h.lastSeen = ev.ts;
  }
  return [...map.values()]
    .map((h) => ({
      file: h.file,
      incidents: h.incidents,
      contendingBranches: h.branches.size,
      branches: [...h.branches],
      prs: [...h.prs],
      causes: [...h.causes],
      lastSeen: h.lastSeen,
      isMonolith: h.file === MONOLITH_PATH,
    }))
    .sort((a, b) => b.incidents - a.incidents || b.contendingBranches - a.contendingBranches || a.file.localeCompare(b.file));
}

// Chronically-contended AREAS / lanes: group by `lane` (monolith, mount,
// migration, logic, module). Surfaces "the migration sequence keeps colliding"
// even though each collision is on a different file.
export function contendedAreas(events) {
  const map = new Map();
  for (const ev of events) {
    const lane = ev.lane || 'unknown';
    if (!map.has(lane)) map.set(lane, { lane, incidents: 0, files: new Set(), lastSeen: null });
    const a = map.get(lane);
    a.incidents += 1;
    if (ev.file) a.files.add(ev.file);
    if (!a.lastSeen || Date.parse(ev.ts) > Date.parse(a.lastSeen)) a.lastSeen = ev.ts;
  }
  return [...map.values()]
    .map((a) => ({ lane: a.lane, incidents: a.incidents, fileCount: a.files.size, lastSeen: a.lastSeen }))
    .sort((a, b) => b.incidents - a.incidents || a.lane.localeCompare(b.lane));
}

// Conflict-rate over time, bucketed by ISO date (YYYY-MM-DD). Returns the
// ordered buckets plus a trend direction comparing the most recent bucket to the
// mean of the earlier ones. The TARGET is 'down' — this is the metric the loop
// exists to push toward zero as decomposition lands.
export function conflictRate(events, opts = {}) {
  const bucketOf = opts.bucketOf || ((ts) => String(ts).slice(0, 10)); // day
  const counts = new Map();
  for (const ev of events) {
    if (!ev.ts) continue;
    const k = bucketOf(ev.ts);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const buckets = [...counts.entries()].map(([bucket, count]) => ({ bucket, count })).sort((a, b) => a.bucket.localeCompare(b.bucket));
  const total = buckets.reduce((s, b) => s + b.count, 0);
  let trend = 'flat';
  let latest = null;
  let priorMean = null;
  if (buckets.length >= 1) latest = buckets[buckets.length - 1].count;
  if (buckets.length >= 2) {
    const prior = buckets.slice(0, -1);
    priorMean = prior.reduce((s, b) => s + b.count, 0) / prior.length;
    if (latest < priorMean) trend = 'down';
    else if (latest > priorMean) trend = 'up';
  } else {
    trend = 'baseline'; // not enough history to call a direction — honest
  }
  return { buckets, total, latest, priorMean, trend, bucketCount: buckets.length };
}

// --- FEED PREVENTION BACK ----------------------------------------------------

// Ranked decomposition plan: for each hot file with 2+ incidents, recommend the
// disjoint-module fix, ranked by incident count. The monolith's recommendation
// is specific: extract a surface-mount registry, because the recorded collisions
// were all MOUNT-WIRING edits (import block + render branch), while the surfaces
// themselves are already separate component files.
export function decompositionPlan(events) {
  const hot = hotFiles(events).filter((h) => h.incidents >= 2 && h.file !== MIGRATIONS_DIR && h.file !== '(stacked PRs)');
  return hot.map((h) => {
    const base = {
      target: h.file,
      collisions: h.incidents,
      contendingBranches: h.contendingBranches,
      branches: h.branches,
      prs: h.prs,
    };
    if (h.isMonolith) {
      return {
        ...base,
        priority: 1,
        recommendation:
          'Extract a surface-mount registry. New surfaces should register (import + render) via a data array / lazy registry, so mounting a surface no longer edits this file. Every recorded monolith collision was mount-wiring (the import block + a render branch) — the surfaces themselves (ChurchVideoWall, Pulpit, PasswordAuth) are already separate component files.',
        rankedExtractions: [
          'The import block at the top of the file (each new surface adds an import here — the #1 textual collision point).',
          'The section/tab render switch (each new surface adds a render branch here — the #2 collision point).',
          'Then peel the largest standalone sections into components/*.jsx, mounted via the registry.',
        ],
      };
    }
    return {
      ...base,
      priority: 2,
      recommendation:
        'Shared mount/entry file. Move per-surface wiring out of this file into a registry the file iterates, so adding a surface does not edit it.',
      rankedExtractions: [],
    };
  });
}

// PRE-SPAWN WARNING: before new work is filed into a lane, check whether the
// files it would touch are known hot/contended. Returns the disjoint-module
// path when it would contend. This is the proactive half of the loop — it stops
// the next collision before it is recorded.
export function wouldContend(proposedFiles, events) {
  const list = (Array.isArray(proposedFiles) ? proposedFiles : []).map(String);
  const hot = new Map(hotFiles(events).map((h) => [h.file, h]));
  const hits = [];
  for (const f of list) {
    if (f === MONOLITH_PATH) {
      const h = hot.get(f);
      hits.push({
        file: f,
        why: 'monolith',
        collisions: h ? h.incidents : 0,
        suggestion: 'NEW SURFACE => NEW MODULE. Build this as components/<Surface>.jsx + lib/<surface>.js and mount with a one-line import — disjoint files land in parallel, no serialize gate.',
      });
    } else if (f.startsWith(MIGRATIONS_DIR)) {
      hits.push({
        file: f,
        why: 'migration',
        collisions: (hot.get(MIGRATIONS_DIR) || {}).incidents || 0,
        suggestion: 'Allocate the next free migration number against ALL open branches before committing (the strictly-ordered sequence serializes any two branches that add migrations).',
      });
    } else if (hot.has(f) && hot.get(f).incidents >= 2) {
      const h = hot.get(f);
      hits.push({
        file: f,
        why: 'recurring hot file',
        collisions: h.incidents,
        suggestion: 'This file has collided before. Prefer adding behavior in a new module the file references, not by editing it directly.',
      });
    }
  }
  return { contends: hits.length > 0, hits, checked: list.length };
}

// Convenience for the migration allocator (deliverable 3d) without depending on
// the (separately-owned) migration-order-check guard: highest 4-digit number + 1.
export function nextFreeMigration(existingNumbers) {
  let max = 0;
  for (const n of existingNumbers || []) {
    const v = parseInt(String(n).slice(0, 4), 10);
    if (!Number.isNaN(v)) max = Math.max(max, v);
  }
  return String(max + 1).padStart(4, '0');
}

// --- assemble the render-ready manifest (baked into the app) ------------------
export function analyze(events) {
  return {
    ok: true,
    eventCount: events.length,
    hotFiles: hotFiles(events),
    contendedAreas: contendedAreas(events),
    rate: conflictRate(events),
    decomposition: decompositionPlan(events),
    generatedFrom: EVENTS_REL,
  };
}

export function buildConflictManifest(file) {
  const { events, problems } = scanEvents(file);
  const m = analyze(events);
  m.problems = problems;
  m.ok = problems.length === 0;
  return m;
}

// --- CLI ---------------------------------------------------------------------
function main(argv) {
  const args = argv.slice(2);

  if (args[0] === '--record') {
    let ev;
    try { ev = JSON.parse(args[1] || ''); } catch { console.error('--record: argument must be a JSON object'); process.exit(2); }
    try { recordEvent(ev); console.log('recorded:', JSON.stringify(ev)); }
    catch (e) { console.error(e.message); process.exit(1); }
    return;
  }

  const { events, problems } = scanEvents();

  if (args[0] === '--check') {
    const files = args.slice(1);
    if (!files.length) { console.error('--check: pass one or more file paths'); process.exit(2); }
    const r = wouldContend(files, events);
    console.log(`# PRE-SPAWN CONTENTION CHECK (${r.checked} file(s))\n`);
    if (!r.contends) { console.log('OK — no hot/contended file touched. Disjoint => parallel-safe.'); return; }
    for (const h of r.hits) {
      console.log(`!! ${h.file}  [${h.why}${h.collisions ? `, ${h.collisions} prior collision(s)` : ''}]`);
      console.log(`   -> ${h.suggestion}\n`);
    }
    process.exit(1);
  }

  // Default: full report.
  if (problems.length) {
    console.error('conflict spine has problems:');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
  const m = analyze(events);
  console.log(`# CONFLICT-EVALUATION LOOP — report (${m.eventCount} events from ${EVENTS_REL})\n`);
  console.log(`Conflict rate (per day): ${m.rate.buckets.map((b) => `${b.bucket}=${b.count}`).join('  ')}`);
  console.log(`Trend: ${m.rate.trend.toUpperCase()} (latest ${m.rate.latest}${m.rate.priorMean != null ? ` vs prior mean ${m.rate.priorMean.toFixed(1)}` : ''}) · TARGET: DOWN\n`);
  console.log('HOT FILES (most-contended first):');
  for (const h of m.hotFiles) console.log(`  ${h.incidents}x  ${h.file}${h.isMonolith ? '  <-- monolith' : ''}  (${h.contendingBranches} branch(es): ${h.branches.join(', ') || 'n/a'})`);
  console.log('\nCONTENDED AREAS / lanes:');
  for (const a of m.contendedAreas) console.log(`  ${a.incidents}x  ${a.lane}  (${a.fileCount} file(s))`);
  console.log('\nRECOMMENDED DECOMPOSITION (ranked):');
  for (const d of m.decomposition) {
    console.log(`  [P${d.priority}] ${d.target} — ${d.collisions} collisions`);
    console.log(`        ${d.recommendation}`);
    d.rankedExtractions.forEach((x, i) => console.log(`        ${i + 1}. ${x}`));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv);
}
