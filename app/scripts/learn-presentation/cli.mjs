// =============================================================================
// learn-presentation CLI — run from app/:
//   npx vite-node scripts/learn-presentation/cli.mjs <command> [flags]
// Commands: estimate | text | images | status | export | retry-failed | part-recover
//           | originals-backup (free; lib/originals-backup.mjs) | publish-covers (free; lib/publish-covers.mjs)
//           | ledger-restore | ledger-check (free; lib/ledger-restore.mjs: the right ledger, never a stale one)
// See README.md beside this file. Nothing here writes to a lesson.
// =============================================================================
import { verifyRecovery } from './lib/recovery.mjs';
import {
  resolveSpendingScope,
  remainingCents,
  ScopeError,
  TOTAL_CAP_CENTS,
  IMAGE_TOTAL_CAP_CENTS,
  LIBRARY_BATCH,
  imageSpentCents,
  nextLibraryBatch,
  scopeKeySet,
} from './lib/scope.mjs';
import { copyFileSync, rmSync } from 'node:fs';
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
import { loadAdjustments, applyAdjustments } from './lib/adjust.mjs';
import { loadDecisions, applyDecisions, decidedKeys } from './lib/decisions.mjs';
import { storageGate, paidPictureShas, originalsGate, eitherGate } from './lib/storage-gate.mjs';
import {
  ORIGINALS_REPO,
  FALLBACK_ARTIFACT_ID,
  backupAndVerify,
  downloadArtifact,
  fetchOriginalsState,
  missingSources,
  paidOriginals,
  remoteUrl,
  restoreFromArtifact,
} from './lib/originals-backup.mjs';
import { writePublishTree } from './lib/publish-covers.mjs';
import { savePart, recoverPart } from './lib/part.mjs';
import { ledgerFacts, restoreLedger, staleness } from './lib/ledger-restore.mjs';

const SEED = resolve('src/lib/learn-presentation/presentation-seed.json');
const ART = resolve('scripts/learn-presentation/art-direction-v2.json');
const ADJUSTMENTS = resolve('scripts/learn-presentation/ledger-adjustments.json');
const DECISIONS = resolve('scripts/learn-presentation/title-decisions.json');

/**
 * Open the ledger, apply any reviewed adjustment not yet in it (append-only),
 * and apply the owner's title decisions (lib/decisions.mjs; free, no paid call).
 */
function openLedger(stateDir, log, inventory) {
  const ledger = new Ledger(stateDir);
  for (const id of applyAdjustments(ledger, loadAdjustments(ADJUSTMENTS))) log(`ledger adjustment applied: ${id}`);
  const td = applyDecisions(ledger, loadDecisions(DECISIONS), { courses: coursesForValidation(inventory), log });
  if (td.applied.length + td.held.length + td.waiting.length)
    log(`title decisions: ${td.applied.length} applied · ${td.held.length} held · ${td.waiting.length} waiting on a generated record`);
  return ledger;
}

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
  return String(flags.only)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function prices(flags) {
  return flags.prices ? JSON.parse(readFileSync(resolve(flags.prices), 'utf8')) : DEFAULT_PRICES;
}

/**
 * Copy the pictures this run bought into <state>/../outbox/, so the run's
 * artifact carries only its new pictures (the NAS pulls them; DR-1360).
 */
function outboxNew(before, ledger, outDir, log) {
  const box = resolve(outDir, '..', 'outbox');
  let n = 0;
  for (const [k, r] of Object.entries(ledger.records)) {
    const was = before[k];
    if (!r.image || !r.image.path || (was && was === r.image.sha256)) continue;
    const dest = join(box, r.image.path);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(outDir, r.image.path), dest);
    n += 1;
  }
  if (n) log(`outbox: ${n} new picture(s) -> ${box}`);
}
const shaMap = (ledger) => Object.fromEntries(Object.entries(ledger.records).map(([k, r]) => [k, r.image && r.image.sha256]));

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

/** Owner 2026-11-24 (mandatory): no paid picture is bought until every picture
 *  already paid for is verified in permanent storage: the NAS verdict OR the
 *  private originals repository's verdict (2026-11-25). Paused = nothing bought, exit 4. */
async function checkStorage(provider, stateDir, log) {
  const paid = paidPictureShas(stateDir);
  const costCents = provider.costCents != null ? provider.costCents : 6;
  const nas = storageGate({ paid: paid.size, verdict: process.env.LEARN_THUMBS_RECONCILED || '', costCents });
  const repo = nas.open || !costCents ? { verdict: '', manifest: null } : await fetchOriginalsState({ token: process.env.LEARN_ORIGINALS_TOKEN });
  const gate = eitherGate(nas, originalsGate({ paidShas: paid, verdict: repo.verdict, manifest: repo.manifest, costCents }));
  if (repo.error) log(`originals repository unreadable: ${repo.error}`);
  log(`storage gate: ${gate.open ? 'OPEN' : 'PAUSED: no picture bought'} · ${gate.reason}`);
  if (!gate.open) process.exitCode = 4;
  return gate.open;
}

/** Incident 2026-11-25: a stale ledger never spends and never writes an originals verdict.
 *  Compared with the private originals manifest and the NAS verdict; exit 6 when stale. */
async function checkLedgerFresh(stateDir, log, { provider = null, ledgerKey = '' } = {}) {
  if (provider && (provider.costCents === 0 || provider.name === 'local')) return true; // free: nothing is paid for
  const facts = ledgerFacts(stateDir);
  const repo = await fetchOriginalsState({ token: process.env.LEARN_ORIGINALS_TOKEN });
  if (repo.error) log(`ledger check: originals manifest unreadable (${repo.error})`);
  const s = staleness({ ...facts, manifest: repo.manifest, nasVerdict: process.env.LEARN_THUMBS_RECONCILED || '', ledgerKey });
  log(`ledger check: ${facts.paidPictures} paid picture(s) · ${dollars(facts.spentCents)} spent · ${s.stale ? 'STALE' : 'current'}`);
  for (const r of s.reasons) log(`  ✗ ${r}`);
  if (!s.stale) return true;
  log(`STOPPED before any spend: ${s.remedy}`);
  process.exitCode = 6;
  return false;
}

async function main() {
  const { cmd, flags } = parseArgs(process.argv.slice(2));
  const stateDir = resolve(flags.state || '.learn-presentation/state');
  const outDir = resolve(flags.out || '.learn-presentation/images');
  const batchId = String(flags.batch || 'library-v1');
  const log = (m) => process.stdout.write(`${m}\n`);

  if (cmd === 'part-recover') {
    // A lost runner's newest part save (lib/part.mjs): merged only when it is newer than the full ledger.
    const r = recoverPart(resolve(stateDir, '..'), flags['ledger-key'] === true ? '' : flags['ledger-key']);
    log(
      r.recovered
        ? `part-recover: run ${r.partRun} was lost after a part save; its ledger and pictures are restored over run ${r.ledgerRun}'s`
        : `part-recover: nothing to merge (part ${r.partRun || 'none'}, ledger ${r.ledgerRun || 'none'})`
    );
    return;
  }
  if (cmd === 'ledger-check') {
    await checkLedgerFresh(stateDir, log, { ledgerKey: flags['ledger-key'] === true ? '' : flags['ledger-key'] });
    return;
  }
  if (cmd === 'ledger-restore') {
    // Free: the authoritative ledger + pictures from a run artifact, only as a superset of the current ledger.
    const id = Number(flags.artifact);
    if (!Number.isInteger(id) || id <= 0) {
      log('ledger-restore REFUSED: --artifact <id> is required');
      process.exitCode = 7;
      return;
    }
    const tmpDir = resolve(process.env.RUNNER_TEMP || resolve(stateDir, '..'), 'lp-ledger-restore');
    const { dir } = await downloadArtifact({ id, repo: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN, tmpDir });
    const r = restoreLedger({ root: resolve(stateDir, '..'), artifactDir: dir });
    rmSync(tmpDir, { recursive: true, force: true });
    const f = (x) => `${x.keys.length} jobs · ${x.pictureJobs} picture jobs · ${x.paidPictures} paid pictures · ${dollars(x.spentCents)}`;
    log(`ledger-restore: current ${f(r.before)} | artifact ${id} ${f(r.after)}`);
    for (const p of r.reasons) log(`  ✗ ${p}`);
    if (!r.ok) {
      log('ledger-restore REFUSED: the current ledger is left exactly as it was');
      process.exitCode = 7;
      return;
    }
    log(`ledger-restore: state/ and images/ replaced from artifact ${id} (${r.pictures} paid pictures present with the paid bytes)`);
    return;
  }
  if (cmd === 'originals-backup') {
    // Free: every paid original into the private repository, proven on a fresh clone (lib/originals-backup.mjs).
    // A stale ledger never writes the verdict (run 45625192907 wrote "20 of 20" over the library's 176).
    if (!(await checkLedgerFresh(stateDir, log))) return;
    const imagesDir = outDir;
    const list = paidOriginals(stateDir);
    let missing = missingSources(list, imagesDir);
    log(`originals: ${list.length} paid picture(s) in the ledger · ${missing.length} not on disk`);
    const fb = flags['fallback-artifact'];
    if (missing.length && fb) {
      const id = fb === true ? FALLBACK_ARTIFACT_ID : Number(fb);
      const n = await restoreFromArtifact({
        id,
        repo: process.env.GITHUB_REPOSITORY,
        token: process.env.GITHUB_TOKEN,
        missing,
        imagesDir,
        tmpDir: resolve(process.env.RUNNER_TEMP || stateDir, 'lp-artifact'),
      });
      missing = missingSources(list, imagesDir);
      log(`originals: ${n} restored from artifact ${id} · ${missing.length} still missing`);
    }
    const token = process.env.LEARN_ORIGINALS_TOKEN;
    if (!token) {
      log('originals-backup STOPPED: LEARN_ORIGINALS_TOKEN is not set (nothing written)');
      process.exitCode = 5;
      return;
    }
    const { verdict, staged } = backupAndVerify({
      stateDir,
      imagesDir,
      remote: remoteUrl(ORIGINALS_REPO, token),
      secret: token,
      runId: process.env.GITHUB_RUN_ID,
      workDir: resolve(process.env.RUNNER_TEMP || resolve(stateDir, '..'), 'lp-originals'),
    });
    log(
      `originals: ${staged.copied} copied · ${staged.already} already kept · ${staged.missingSource.length} absent from this run · ${staged.conflicts.length} conflict(s) · fresh clone verified ${verdict.verified} of ${verdict.expected}`
    );
    for (const p of verdict.missing.slice(0, 20)) log(`  ✗ not verified: ${p}`);
    if (verdict.missing.length) {
      log('originals-backup FAILED: permanent storage does not hold every paid picture; no further purchase');
      process.exitCode = 5;
    }
    return;
  }
  const inventory = learnInventory();
  const all = buildItems(inventory);

  if (cmd === 'art-v2' || cmd === 'art-check') {
    // The new art direction (bright natural daylight). Prompts are checked
    // BEFORE any spend; the selection is only what art-direction-v2.json names.
    const art = loadArt(resolve(flags.art || ART));
    const mounted = new Set(all.map((it) => `${it.courseKey}::${it.lessonId}`));
    const problems = validateArt(art, { mountedKeys: mounted });
    for (const p of problems) log(`  ✗ ${p}`);
    if (problems.length) {
      log('art direction REFUSED — nothing spent');
      process.exitCode = 2;
      return;
    }
    if (cmd === 'art-check') {
      log(`art direction OK: ${art.lessons.length} lessons, ${art.topics.length} topics, ${(art.samples || []).length} samples`);
      return;
    }
    let entries;
    try {
      entries = resolveArtScope(flags.only, art);
    } catch (e) {
      if (e instanceof ScopeError) {
        log(`refused: ${e.message}`);
        process.exitCode = 2;
        return;
      }
      throw e;
    }
    const ledger = openLedger(stateDir, log, inventory);
    const already = ledger.spentCents();
    const imgLeft = Math.max(0, IMAGE_TOTAL_CAP_CENTS - imageSpentCents(ledger));
    const budget = new Budget(Math.min(imgLeft, remainingCents(flags['budget-cents'] !== undefined ? int(flags['budget-cents']) : null, already)));
    log(
      `spend so far ${dollars(already)} of ${dollars(TOTAL_CAP_CENTS)} combined (pictures ${dollars(imageSpentCents(ledger))} of ${dollars(IMAGE_TOTAL_CAP_CENTS)}) · art-v2 may spend up to ${dollars(budget.cap)} · ${entries.length} pictures`
    );
    const beforeArt = shaMap(ledger);
    // raw:false — FLUX raw mode favours candid, muted renders; the new direction wants vivid natural color.
    const provider = String(flags.provider || 'bfl') === 'bfl' ? bflImage({ raw: false }) : imageProvider(String(flags.provider));
    if (!(await checkLedgerFresh(stateDir, log, { provider }))) return;
    if (!(await checkStorage(provider, stateDir, log))) return;
    const t = await runArtV2({
      entries,
      ledger,
      provider,
      outDir,
      stateDir,
      batchId,
      concurrency: int(flags.concurrency, 3),
      maxAttempts: int(flags['max-attempts'], 3),
      budget,
      log,
    });
    outboxNew(beforeArt, ledger, outDir, log);
    log(
      `art-v2: ${t.done} done · ${t.skipped} already done · ${t.failed} failed${t.outOfCredit ? ' · STOPPED: THE PROVIDER ACCOUNT IS OUT OF CREDIT (top it up; queued lessons resume)' : t.stoppedByBudget ? ' · STOPPED AT BUDGET CAP' : ''} · this run ${dollars(budget.spent)} · total ${dollars(ledger.spentCents())}`
    );
    if (t.failed) process.exitCode = 1;
    return;
  }
  // Spending commands run ONLY on an explicit, validated pilot scope (lib/scope.mjs);
  // estimate/status/export spend nothing and may look at the whole library.
  const spending = ['text', 'images', 'retry-failed', 'compose'].includes(cmd);
  let items;
  try {
    items = spending
      ? resolveSpendingScope(flags.only, all, { seedPath: SEED })
      : selectItems(all, { only: onlyIds(flags), limit: flags.limit ? int(flags.limit) : null });
  } catch (e) {
    if (e instanceof ScopeError) {
      log(`refused: ${e.message}`);
      process.exitCode = 2;
      return;
    }
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

  const ledger = openLedger(stateDir, log, inventory);
  const courses = coursesForValidation(inventory);
  // The full library runs in resumable batches: the next unfinished lessons only.
  if (spending && cmd !== 'compose' && String(flags.only).toLowerCase() === 'all') {
    items = nextLibraryBatch(items, ledger, int(flags['batch-size'], LIBRARY_BATCH));
    log(`library batch: ${items.length} unfinished lesson(s) this run`);
  }
  const concurrency = int(flags.concurrency, 4);
  // The combined ceiling: this stage may spend the smaller of its own cap and
  // what is left of TOTAL_CAP_CENTS after everything the ledger has recorded.
  const already = ledger.spentCents();
  let stageCap = flags['budget-cents'] !== undefined ? int(flags['budget-cents']) : null;
  // --run-mark FILE: the run's cap is shared by every part of it. The first part
  // writes what the ledger held before it; each later part may spend only what is left.
  if (flags['run-mark'] && flags['run-mark'] !== true) {
    const mark = resolve(String(flags['run-mark']));
    let start = already;
    try {
      start = Number(readFileSync(mark, 'utf8').trim());
    } catch {
      writeFileSync(mark, `${already}\n`);
    }
    if (stageCap != null) stageCap = Math.max(0, stageCap - Math.max(0, already - start));
  }
  const budget = new Budget(remainingCents(stageCap, already));
  if (spending && cmd !== 'compose')
    log(`spend so far ${dollars(already)} of ${dollars(TOTAL_CAP_CENTS)} combined · this stage may spend up to ${dollars(budget.cap)}`);
  const retryFailed = cmd === 'retry-failed';

  if (cmd === 'text' || (retryFailed && flags.kind !== 'image')) {
    const provider = textProvider(String(flags.provider || 'anthropic'), flags.model ? { model: String(flags.model) } : {});
    if (!(await checkLedgerFresh(stateDir, log, { provider }))) return;
    log(
      `Stage A (text) · ${items.length} lessons · ${provider.name}/${provider.model} · concurrency ${concurrency}${Number.isFinite(budget.cap) ? ` · cap ${dollars(budget.cap)}` : ''}`
    );
    const t = await runText({
      items,
      ledger,
      provider,
      courses,
      batchId,
      concurrency,
      maxAttempts: int(flags['max-attempts'], 3),
      budget,
      retryFailed,
      decided: decidedKeys(loadDecisions(DECISIONS)),
      log,
    });
    log(
      `text: ${t.done} done · ${t.skipped} skipped · ${t.decided} decided by the owner (no title bought) · ${t.needsReview} need review · ${t.failed} failed${t.outOfCredit ? ' · STOPPED: THE PROVIDER ACCOUNT IS OUT OF CREDIT (top it up; queued lessons resume)' : t.stoppedByBudget ? ' · STOPPED AT BUDGET CAP' : ''} · this run ${dollars(budget.spent)}`
    );
  }
  if (cmd === 'images' || (retryFailed && flags.kind !== 'text')) {
    const provider = imageProvider(String(flags.provider || 'bfl'));
    if (!(await checkLedgerFresh(stateDir, log, { provider }))) return;
    const bucket = new TokenBucket(int(flags['per-minute'], 30));
    log(
      `Stage B (images) · ${items.length} lessons · ${provider.name}/${provider.model} · concurrency ${concurrency} · ${int(flags['per-minute'], 30)}/min${Number.isFinite(budget.cap) ? ` · cap ${dollars(budget.cap)}` : ''}`
    );
    const perceptualHash = await loadDHash(log);
    // Pictures never pass their own ceiling (the BFL credits), whatever the run cap.
    const imgLeft = Math.max(0, IMAGE_TOTAL_CAP_CENTS - imageSpentCents(ledger));
    if (budget.cap > imgLeft) budget.cap = imgLeft;
    const beforeImg = shaMap(ledger);
    // Exact count, library-wide: every mounted lesson still without a finished picture.
    const libraryLeft = nextLibraryBatch(all, ledger, Infinity).length;
    log(`library: ${all.length - libraryLeft} of ${all.length} lessons have a finished picture · ${libraryLeft} remaining`);
    // The provider's real balance, read before any spend, and the price of one
    // picture MEASURED on this account (balance before/after one picture).
    let runItems = items;
    let probe = null;
    const stored = await checkStorage(provider, stateDir, log);
    if (!stored) runItems = [];
    // --max-new N: buy at most N pictures in this part, so the ledger can be saved between parts.
    if (flags['max-new'] && flags['max-new'] !== true) {
      runItems = runItems
        .filter((it) => {
          const r = ledger.getRecord(it.courseKey, it.lessonId);
          const d = ledger.decide({ courseKey: it.courseKey, lessonId: it.lessonId, kind: 'image', contentSha: it.contentSha, retryFailed });
          return r && r.status === 'review' && r.contentSha === it.contentSha && d.run;
        })
        .slice(0, int(flags['max-new']));
      log(`this part buys at most ${runItems.length} picture(s)`);
    }
    if (stored && provider.name === 'bfl') {
      const { bflCredits } = await import('./providers/image.mjs');
      const readBalance = () =>
        bflCredits().catch((e) => {
          log(`BFL balance unreadable: ${e.message}`);
          return null;
        });
      const b0 = await readBalance();
      if (b0 != null) log(`BFL balance before: ${b0} credits`);
      if (b0 != null && b0 <= 0) {
        log('BFL balance is empty: no picture requested this run (top it up; every lesson stays queued)');
        runItems = [];
      } else if (b0 != null) {
        const first = runItems.findIndex((it) => {
          const r = ledger.getRecord(it.courseKey, it.lessonId);
          const d = ledger.decide({ courseKey: it.courseKey, lessonId: it.lessonId, kind: 'image', contentSha: it.contentSha });
          return r && r.status === 'review' && !r.image && d.run;
        });
        if (first >= 0) {
          probe = await runImages({
            items: [runItems[first]],
            ledger,
            provider,
            outDir,
            batchId,
            concurrency: 1,
            bucket,
            maxAttempts: int(flags['max-attempts'], 3),
            budget,
            retryFailed,
            perceptualHash,
            log,
          });
          const b1 = await readBalance();
          const per = b1 != null && probe.done + probe.needsReview === 1 ? b0 - b1 : null;
          if (per != null && per > 0) {
            const affordable = Math.floor(b1 / per);
            log(
              `BFL measured: ${per} credits per picture · balance now ${b1} credits = ${affordable} more picture(s) · library still needs ${libraryLeft - 1} = ${(libraryLeft - 1) * per} credits`
            );
            const rest = runItems.filter((_, i) => i !== first);
            runItems = rest.slice(0, Math.max(0, affordable));
            if (rest.length > runItems.length) log(`this run buys at most ${runItems.length} picture(s): the balance covers no more`);
          } else {
            log('BFL price per picture not measured this run (the probe did not complete); the 402 stop and the caps still hold');
            runItems = runItems.filter((_, i) => i !== first);
          }
          if (probe.outOfCredit) runItems = [];
        }
      }
    }
    const t = await runImages({
      items: runItems,
      ledger,
      provider,
      outDir,
      batchId,
      concurrency,
      bucket,
      maxAttempts: int(flags['max-attempts'], 3),
      budget,
      retryFailed,
      perceptualHash,
      log,
    });
    outboxNew(beforeImg, ledger, outDir, log);
    if (flags['save-part']) log(`part saved: ${savePart(resolve(stateDir, '..'), process.env.GITHUB_RUN_ID)} (the workflow caches it now)`);
    if (probe) for (const k of ['done', 'needsReview', 'failed']) t[k] += probe[k] || 0;
    if (probe && probe.outOfCredit) t.outOfCredit = true;
    log(
      `images: ${t.done} done · ${t.skipped} skipped · ${t.waiting} waiting on approved copy · ${t.needsReview} need review · ${t.failed} failed${t.outOfCredit ? ' · STOPPED: THE PROVIDER ACCOUNT IS OUT OF CREDIT (top it up; queued lessons resume)' : t.stoppedByBudget ? ' · STOPPED AT BUDGET CAP' : ''} · this run ${dollars(budget.spent)}`
    );
  }
  if (cmd === 'status' || cmd === 'text' || cmd === 'images' || retryFailed) {
    const s = ledger.summary();
    log(
      `\nLedger · ${s.records}/${all.length} lessons have copy · text ${JSON.stringify(s.text)} · image ${JSON.stringify(s.image)} · total spend ${dollars(s.spentCents)}`
    );
    return;
  }
  if (cmd === 'compose') {
    // Stage C: every text-free master -> delivery sizes (AVIF/WebP), LQIP and a
    // composed 1280x720 share thumbnail, via app/scripts/learn-thumbs. Free:
    // no provider call. Re-runnable: a lesson whose master is unchanged is skipped.
    let composeLesson;
    try {
      ({ composeLesson } = await import('../learn-thumbs/compose.mjs'));
    } catch (e) {
      log(`compose needs the compositor installed: cd scripts/learn-thumbs && npm ci (${e.message})`);
      process.exitCode = 1;
      return;
    }
    const composedDir = resolve(flags['composed-out'] || '.learn-presentation/composed');
    // The resolved, validated scope as a Set (pilot 1 crashed on the raw array).
    const want = scopeKeySet(items);
    const { lookFor, GRADE_VERSION } = await import('../learn-thumbs/grade.mjs');
    const deptOf = new Map(inventory.map((c) => [c.key, c.department]));
    const base = String(flags['image-base'] || '/learn-thumbs');
    let done = 0;
    let skipped = 0;
    let failed = 0;
    for (const r of Object.values(ledger.records)) {
      if (!r.image || !r.image.path || !r.thumbHeadline) continue;
      if (!want.has(r.lessonId) && !want.has(`${r.courseKey}::${r.lessonId}`)) continue;
      // Every picture is graded (grade.mjs); an ungraded delivery is re-composed, free.
      const look = r.image.look || lookFor(deptOf.get(r.courseKey), r.courseKey);
      if (r.image.delivery && r.image.delivery.sha256 === r.image.sha256 && r.image.delivery.look === look && r.image.delivery.gradeVersion === GRADE_VERSION) {
        skipped += 1;
        continue;
      }
      try {
        const m = await composeLesson({
          image: join(outDir, r.image.path),
          courseKey: r.courseKey,
          lessonId: r.lessonId,
          thumbHeadline: r.thumbHeadline,
          layout: flags.layout === 'right' ? 'right' : 'left',
          department: deptOf.get(r.courseKey) || '',
          outDir: composedDir,
          publicBase: base,
          look,
        });
        ledger.putRecord({
          ...r,
          image: {
            ...r.image,
            delivery: {
              ...m.image,
              og: m.ogPath,
              width: m.width,
              height: m.height,
              sha256: m.sha256,
              dhash: m.dhash,
              look,
              gradeVersion: GRADE_VERSION,
              grade: m.grade && { before: m.grade.before, after: m.grade.after },
            },
          },
        });
        done += 1;
      } catch (e) {
        failed += 1;
        log(`compose failed ${r.courseKey}::${r.lessonId}: ${e.code || ''} ${e.message}`);
      }
    }
    // The Explore by Topic covers (art-v2 topic pictures), graded the same way.
    const { readTopics } = await import('./lib/art-v2.mjs');
    for (const t of Object.values(readTopics(stateDir))) {
      try {
        await composeLesson({
          image: join(outDir, t.image.path),
          courseKey: 'topics',
          lessonId: t.key,
          thumbHeadline: t.label,
          department: t.label,
          outDir: composedDir,
          publicBase: base,
          look: t.image.look,
        });
        done += 1;
      } catch (e) {
        failed += 1;
        log(`compose failed topic ${t.key}: ${e.code || ''} ${e.message}`);
      }
    }
    log(`compose: ${done} composed · ${skipped} unchanged · ${failed} failed -> ${composedDir}`);
    return;
  }
  if (cmd === 'verify-resume') {
    // Free. Runs before any paid call on a resumed run; a failure stops the job.
    const v = verifyRecovery(ledger, outDir, {
      minCents: int(flags['min-cents'], 0),
      minText: int(flags['min-text'], 0),
      minImages: int(flags['min-images'], 0),
    });
    log(`recovered: ${v.text} titles · ${v.images} intact images · ${dollars(v.spent)} spent`);
    for (const p of v.problems) log(`  ✗ ${p}`);
    if (!v.ok) {
      log('recovery check FAILED — stopping before any spend');
      process.exitCode = 3;
    }
    return;
  }
  if (cmd === 'publish-covers') {
    // Free: new passing covers -> a tree mirroring the repository, for the publish job (lib/publish-covers.mjs).
    const to = resolve(flags.to || '.learn-presentation/publish');
    const titles = new Map(inventory.flatMap((c) => c.lessons.map((l) => [l.id, typeof l.title === 'string' ? l.title : ''])));
    const sel = writePublishTree({
      exported: exportRecords(ledger).records,
      repoRoot: resolve('..'),
      composedDir: resolve(flags['composed-out'] || '.learn-presentation/composed'),
      outRoot: to,
      currentTitles: titles,
    });
    log(
      `publish-covers: ${sel.add.length} new passing cover(s) (${sel.add.filter((a) => a.replaces).length} complete a titled record) · skipped ${JSON.stringify(sel.skipped)} -> ${to}`
    );
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
  log(
    'usage: npx vite-node scripts/learn-presentation/cli.mjs <estimate|text|images|compose|status|verify-resume|export|retry-failed> [--only seed|id,id] [--limit N] [--provider ...] [--budget-cents N] [--concurrency N] [--per-minute N]'
  );
  process.exitCode = 2;
}

main().catch((e) => {
  process.stderr.write(`${e && e.stack ? e.stack : e}\n`);
  process.exitCode = 1;
});
