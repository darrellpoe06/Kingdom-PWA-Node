// =============================================================================
// learn-presentation CLI — run from app/:
//   npx vite-node scripts/learn-presentation/cli.mjs <command> [flags]
// Commands: estimate | text | images | status | export | retry-failed
// See README.md beside this file. Nothing here writes to a lesson.
// =============================================================================
import { verifyRecovery } from './lib/recovery.mjs';
import { resolveSpendingScope, remainingCents, ScopeError, TOTAL_CAP_CENTS, scopeKeySet } from './lib/scope.mjs';
import process from 'node:process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { learnInventory } from '../../src/lib/learn-presentation/integrity.js';
import { Ledger } from './lib/ledger.mjs';
import { TokenBucket } from './lib/limits.mjs';
import { DEFAULT_PRICES, estimate, dollars } from './lib/prices.mjs';
import { Budget, buildItems, coursesForValidation, selectItems, runText, runImages, exportRecords } from './lib/pipeline.mjs';
import { textProvider } from './providers/text.mjs';
import { imageProvider, bflImage } from './providers/image.mjs';
import { loadArt, validateArt, resolveArtScope, runArtV2 } from './lib/art-v2.mjs';

const SEED = resolve('src/lib/learn-presentation/presentation-seed.json');
const ART = resolve('scripts/learn-presentation/art-direction-v2.json');

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2);
    const v = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
    flags[k] = v;
  }
  return { cmd, flags };
}

const int = (v, d) => (v === undefined || v === true ? d : Number(v));

function onlyIds(flags) {
  if (!flags.only) return null;
  if (flags.only === 'seed') return JSON.parse(readFileSync(SEED, 'utf8')).records.map((r) => r.lessonId);
  return String(flags.only).split(',').map((s) => s.trim()).filter(Boolean);
}

function prices(flags) {
  return flags.prices ? JSON.parse(readFileSync(resolve(flags.prices), 'utf8')) : DEFAULT_PRICES;
}

/** The compositor's 64-bit dHash, when its sharp install is present; otherwise exact-duplicate checks only. */
async function loadDHash(log) {
  try {
    const { dHash } = await import('../learn-thumbs/dhash.mjs');
    return (bytes) => dHash(bytes);
  } catch (e) {
    log(`near-duplicate check off (install: cd scripts/learn-thumbs && npm ci): ${e.message}`);
    return null;
  }
}

async function main() {
  const { cmd, flags } = parseArgs(process.argv.slice(2));
  const stateDir = resolve(flags.state || '.learn-presentation/state');
  const outDir = resolve(flags.out || '.learn-presentation/images');
  const batchId = String(flags.batch || 'library-v1');
  const log = (m) => process.stdout.write(`${m}\n`);

  const inventory = learnInventory();
  const all = buildItems(inventory);

  if (cmd === 'art-v2' || cmd === 'art-check') {
    // The new art direction (bright natural daylight). Prompts are checked
    // BEFORE any spend; the selection is only what art-direction-v2.json names.
    const art = loadArt(resolve(flags.art || ART));
    const mounted = new Set(all.map((it) => `${it.courseKey}::${it.lessonId}`));
    const problems = validateArt(art, { mountedKeys: mounted });
    for (const p of problems) log(`  ✗ ${p}`);
    if (problems.length) { log('art direction REFUSED — nothing spent'); process.exitCode = 2; return; }
    if (cmd === 'art-check') { log(`art direction OK: ${art.lessons.length} lessons, ${art.topics.length} topics, ${(art.samples || []).length} samples`); return; }
    let entries;
    try { entries = resolveArtScope(flags.only, art); } catch (e) {
      if (e instanceof ScopeError) { log(`refused: ${e.message}`); process.exitCode = 2; return; }
      throw e;
    }
    const ledger = new Ledger(stateDir);
    const already = ledger.spentCents();
    const budget = new Budget(remainingCents(flags['budget-cents'] !== undefined ? int(flags['budget-cents']) : null, already));
    log(`spend so far ${dollars(already)} of ${dollars(TOTAL_CAP_CENTS)} combined · art-v2 may spend up to ${dollars(budget.cap)} · ${entries.length} pictures`);
    // raw:false — FLUX raw mode favours candid, muted renders; the new direction wants vivid natural color.
    const provider = String(flags.provider || 'bfl') === 'bfl' ? bflImage({ raw: false }) : imageProvider(String(flags.provider));
    const t = await runArtV2({ entries, ledger, provider, outDir, stateDir, batchId, concurrency: int(flags.concurrency, 3), maxAttempts: int(flags['max-attempts'], 3), budget, log });
    log(`art-v2: ${t.done} done · ${t.skipped} already done · ${t.failed} failed${t.stoppedByBudget ? ' · STOPPED AT BUDGET CAP' : ''} · this run ${dollars(budget.spent)} · total ${dollars(ledger.spentCents())}`);
    if (t.failed) process.exitCode = 1;
    return;
  }
  // Spending commands run ONLY on an explicit, validated pilot scope (lib/scope.mjs);
  // estimate/status/export spend nothing and may look at the whole library.
  const spending = ['text', 'images', 'retry-failed', 'compose'].includes(cmd);
  let items;
  try {
    items = spending ? resolveSpendingScope(flags.only, all, { seedPath: SEED }) : selectItems(all, { only: onlyIds(flags), limit: flags.limit ? int(flags.limit) : null });
  } catch (e) {
    if (e instanceof ScopeError) { log(`refused: ${e.message}`); process.exitCode = 2; return; }
    throw e;
  }

  if (cmd === 'estimate' || flags['dry-run']) {
    const e = estimate({ lessons: items.length, prices: prices(flags), regenFactor: flags.regen ? Number(flags.regen) : undefined });
    log(`Lessons in scope: ${e.lessons} (one image per unique lesson; age versions are not separate images)`);
    log(`Image generations incl. ~${Math.round((e.regenFactor - 1) * 100)}% regeneration: ${e.generations}`);
    log('\nIMAGES');
    for (const r of e.image) log(`  ${dollars(r.cents).padStart(9)}  ${r.label}`);
    log('\nTEXT (titles, headlines, descriptions, image prompts; +10% retries)');
    for (const r of e.text) log(`  ${dollars(r.cents).padStart(9)}  ${r.label}`);
    return;
  }

  const ledger = new Ledger(stateDir);
  const courses = coursesForValidation(inventory);
  const concurrency = int(flags.concurrency, 4);
  // The combined ceiling: this stage may spend the smaller of its own cap and
  // what is left of TOTAL_CAP_CENTS after everything the ledger has recorded.
  const already = ledger.spentCents();
  const budget = new Budget(remainingCents(flags['budget-cents'] !== undefined ? int(flags['budget-cents']) : null, already));
  if (spending && cmd !== 'compose') log(`spend so far ${dollars(already)} of ${dollars(TOTAL_CAP_CENTS)} combined · this stage may spend up to ${dollars(budget.cap)}`);
  const retryFailed = cmd === 'retry-failed';

  if (cmd === 'text' || (retryFailed && flags.kind !== 'image')) {
    const provider = textProvider(String(flags.provider || 'anthropic'), flags.model ? { model: String(flags.model) } : {});
    log(`Stage A (text) · ${items.length} lessons · ${provider.name}/${provider.model} · concurrency ${concurrency}${Number.isFinite(budget.cap) ? ` · cap ${dollars(budget.cap)}` : ''}`);
    const t = await runText({ items, ledger, provider, courses, batchId, concurrency, maxAttempts: int(flags['max-attempts'], 3), budget, retryFailed, log });
    log(`text: ${t.done} done · ${t.skipped} skipped · ${t.needsReview} need review · ${t.failed} failed${t.stoppedByBudget ? ' · STOPPED AT BUDGET CAP' : ''} · this run ${dollars(budget.spent)}`);
  }
  if (cmd === 'images' || (retryFailed && flags.kind !== 'text')) {
    const provider = imageProvider(String(flags.provider || 'bfl'));
    const bucket = new TokenBucket(int(flags['per-minute'], 30));
    log(`Stage B (images) · ${items.length} lessons · ${provider.name}/${provider.model} · concurrency ${concurrency} · ${int(flags['per-minute'], 30)}/min${Number.isFinite(budget.cap) ? ` · cap ${dollars(budget.cap)}` : ''}`);
    const perceptualHash = await loadDHash(log);
    const t = await runImages({ items, ledger, provider, outDir, batchId, concurrency, bucket, maxAttempts: int(flags['max-attempts'], 3), budget, retryFailed, perceptualHash, log });
    log(`images: ${t.done} done · ${t.skipped} skipped · ${t.waiting} waiting on approved copy · ${t.needsReview} need review · ${t.failed} failed${t.stoppedByBudget ? ' · STOPPED AT BUDGET CAP' : ''} · this run ${dollars(budget.spent)}`);
  }
  if (cmd === 'status' || cmd === 'text' || cmd === 'images' || retryFailed) {
    const s = ledger.summary();
    log(`\nLedger · ${s.records}/${all.length} lessons have copy · text ${JSON.stringify(s.text)} · image ${JSON.stringify(s.image)} · total spend ${dollars(s.spentCents)}`);
    return;
  }
  if (cmd === 'compose') {
    // Stage C: every text-free master -> delivery sizes (AVIF/WebP), LQIP and a
    // composed 1280x720 share thumbnail, via app/scripts/learn-thumbs. Free:
    // no provider call. Re-runnable: a lesson whose master is unchanged is skipped.
    let composeLesson;
    try { ({ composeLesson } = await import('../learn-thumbs/compose.mjs')); } catch (e) {
      log(`compose needs the compositor installed: cd scripts/learn-thumbs && npm ci (${e.message})`);
      process.exitCode = 1;
      return;
    }
    const composedDir = resolve(flags['composed-out'] || '.learn-presentation/composed');
    // The resolved, validated scope as a Set (pilot 1 crashed on the raw array).
    const want = scopeKeySet(items);
    const { lookFor } = await import('../learn-thumbs/grade.mjs');
    const deptOf = new Map(inventory.map((c) => [c.key, c.department]));
    const base = String(flags['image-base'] || '/learn-thumbs');
    let done = 0; let skipped = 0; let failed = 0;
    for (const r of Object.values(ledger.records)) {
      if (!r.image || !r.image.path || !r.thumbHeadline) continue;
      if (!want.has(r.lessonId) && !want.has(`${r.courseKey}::${r.lessonId}`)) continue;
      // Every picture is graded (grade.mjs); an ungraded delivery is re-composed, free.
      const look = r.image.look || lookFor(deptOf.get(r.courseKey), r.courseKey);
      if (r.image.delivery && r.image.delivery.sha256 === r.image.sha256 && r.image.delivery.look === look) { skipped += 1; continue; }
      try {
        const m = await composeLesson({ image: join(outDir, r.image.path), courseKey: r.courseKey, lessonId: r.lessonId, thumbHeadline: r.thumbHeadline, layout: flags.layout === 'right' ? 'right' : 'left', department: deptOf.get(r.courseKey) || '', outDir: composedDir, publicBase: base, look });
        ledger.putRecord({ ...r, image: { ...r.image, delivery: { ...m.image, og: m.ogPath, width: m.width, height: m.height, sha256: m.sha256, dhash: m.dhash, look, grade: m.grade && { before: m.grade.before, after: m.grade.after } } } });
        done += 1;
      } catch (e) { failed += 1; log(`compose failed ${r.courseKey}::${r.lessonId}: ${e.code || ''} ${e.message}`); }
    }
    // The Explore by Topic covers (art-v2 topic pictures), graded the same way.
    const { readTopics } = await import('./lib/art-v2.mjs');
    for (const t of Object.values(readTopics(stateDir))) {
      try {
        await composeLesson({ image: join(outDir, t.image.path), courseKey: 'topics', lessonId: t.key, thumbHeadline: t.label, department: t.label, outDir: composedDir, publicBase: base, look: t.image.look });
        done += 1;
      } catch (e) { failed += 1; log(`compose failed topic ${t.key}: ${e.code || ''} ${e.message}`); }
    }
    log(`compose: ${done} composed · ${skipped} unchanged · ${failed} failed -> ${composedDir}`);
    return;
  }
  if (cmd === 'verify-resume') {
    // Free. Runs before any paid call on a resumed run; a failure stops the job.
    const v = verifyRecovery(ledger, outDir, { minCents: int(flags['min-cents'], 0), minText: int(flags['min-text'], 0), minImages: int(flags['min-images'], 0) });
    log(`recovered: ${v.text} titles · ${v.images} intact images · ${dollars(v.spent)} spent`);
    for (const p of v.problems) log(`  ✗ ${p}`);
    if (!v.ok) { log('recovery check FAILED — stopping before any spend'); process.exitCode = 3; }
    return;
  }
  if (cmd === 'export') {
    const file = resolve(flags.to || join(stateDir, 'presentation-export.json'));
    mkdirSync(dirname(file), { recursive: true });
    const out = exportRecords(ledger, { imageBase: String(flags['image-base'] || '/learn-thumbs') });
    writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
    log(`exported ${out.records.length} records (status: review) -> ${file}`);
    return;
  }
  log('usage: npx vite-node scripts/learn-presentation/cli.mjs <estimate|text|images|compose|status|verify-resume|export|retry-failed> [--only seed|id,id] [--limit N] [--provider ...] [--budget-cents N] [--concurrency N] [--per-minute N]');
  process.exitCode = 2;
}

main().catch((e) => { process.stderr.write(`${e && e.stack ? e.stack : e}\n`); process.exitCode = 1; });
