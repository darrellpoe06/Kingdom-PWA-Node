// =============================================================================
// ledger-restore — the RIGHT ledger, never a stale one (incident 2026-11-25)
// =============================================================================
// Run 45625192907 (only=originals-backup on main) restored, by the cache's
// restore-keys prefix, an OLD pilot ledger (20 lessons) instead of the library
// ledger of run 45461834765 (350 titles, 176 paid pictures): that run was
// dispatched from another branch, so its cache is invisible to main. The stale
// ledger then took the batch-1 adjustment (-$9.90, total -$8.22) and was saved
// as the newest main-visible cache. Three brakes, all here:
//   1. restoreLedger: put the authoritative ledger back from a run ARTIFACT, only
//      when it is a superset of the current one (nothing already paid is lost).
//   2. staleness: before ANY paid step, the ledger must know at least as many
//      paid pictures as permanent storage has verified (the private originals
//      manifest, the NAS verdict's expected), and its spend must not be negative.
//   3. the same check runs right after the cache restore and names the remedy:
//      dispatch only=ledger-restore.
// Adjustments (lib/adjust.mjs) are rows keyed adjustment|<id>; a restored ledger
// that already carries one is never charged it twice, one that lacks it gets it
// once at the next open. They are excluded from the superset check for that reason.
// =============================================================================
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { paidOriginals, missingSources, sha256File } from './originals-backup.mjs';
import { paidPictureShas } from './storage-gate.mjs';

const PICTURE_KIND = /^(image|image-v2|topic-v2)$/;

/** Replay jobs.jsonl the way Ledger.load does: the last row per key wins. */
export function readJobs(stateDir) {
  const jobs = new Map();
  const p = join(stateDir, 'jobs.jsonl');
  if (!existsSync(p)) return jobs;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const j = JSON.parse(line);
      jobs.set(j.idempotencyKey, j);
    } catch {
      /* a torn last line is skipped, as the ledger does */
    }
  }
  return jobs;
}

/** What a ledger knows: its job keys (adjustments aside), paid pictures, spend. */
export function ledgerFacts(stateDir) {
  const jobs = readJobs(stateDir);
  const keys = [...jobs.keys()].filter((k) => !String(k).startsWith('adjustment|'));
  let pictures = 0;
  let spent = 0;
  for (const j of jobs.values()) {
    spent += Number(j.costCents) || 0;
    if (PICTURE_KIND.test(j.kind) && j.state === 'succeeded') pictures += 1;
  }
  return { keys, pictureJobs: pictures, paidPictures: paidPictureShas(stateDir).size, spentCents: spent };
}

/** The candidate may replace the current ledger only if it loses nothing the current one knows. */
export function supersetCheck(current, candidate) {
  const have = new Set(candidate.keys);
  const lost = current.keys.filter((k) => !have.has(k));
  const reasons = [];
  if (!candidate.keys.length) reasons.push('the artifact holds no ledger (state/jobs.jsonl is empty or absent)');
  if (lost.length) reasons.push(`${lost.length} job(s) in the current ledger are not in the artifact's (first: ${lost[0]})`);
  if (candidate.pictureJobs < current.pictureJobs)
    reasons.push(`the artifact knows ${candidate.pictureJobs} succeeded picture job(s), the current ledger ${current.pictureJobs}`);
  return { ok: reasons.length === 0, reasons };
}

const distinctShas = (manifest) => new Set(((manifest && manifest.entries) || []).map((e) => String(e.sha256 || '').toLowerCase()).filter(Boolean));

function parseVerdict(raw) {
  try {
    const v = JSON.parse(String(raw || ''));
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Is this ledger stale? It must know at least as many paid pictures as the
 * private originals manifest has recorded and as the NAS verdict expects, and its
 * spend must not be negative. An unreadable source proves nothing either way;
 * the storage gate (lib/storage-gate.mjs) still requires a verified one before
 * any picture is bought.
 */
export function staleness({ paidPictures, pictureJobs = 0, spentCents, manifest = null, nasVerdict = '', ledgerKey = '' }) {
  const reasons = [];
  // A replaced picture leaves the records but keeps its succeeded job row, so the larger count is what the ledger knows.
  const known = Math.max(paidPictures, pictureJobs);
  const restored = (/-(\d+)$/.exec(String(ledgerKey || '')) || [])[1] || '';
  if (spentCents < 0) reasons.push(`the ledger's total spend is negative (${spentCents}c): an adjustment landed on the wrong ledger`);
  const kept = distinctShas(manifest).size;
  if (kept > known) reasons.push(`the private originals manifest records ${kept} paid picture(s); this ledger knows ${known}`);
  const v = parseVerdict(nasVerdict);
  const expected = v ? Number(v.expected) : NaN;
  if (Number.isFinite(expected) && expected > known)
    reasons.push(
      `the NAS verdict expects ${expected} paid picture(s)${v.from_run ? ` from run ${v.from_run}` : ''}; this ledger${restored ? ` (run ${restored})` : ''} knows ${known}`
    );
  return {
    stale: reasons.length > 0,
    reasons,
    remedy: reasons.length
      ? `a newer authoritative ledger exists${v && v.from_run && String(v.from_run) !== restored ? ` (run ${v.from_run})` : ''}: dispatch this workflow with only=ledger-restore (artifact_id = that run's learn-presentation-review artifact) before any paid run`
      : '',
  };
}

/**
 * Replace root/state, root/images (and composed/) with an unzipped artifact's,
 * only when its ledger is a superset of the current one and every paid picture
 * it names is present with the paid bytes. Returns { ok, reasons, before, after }.
 */
export function restoreLedger({ root, artifactDir }) {
  const stateDir = join(root, 'state');
  const imagesDir = join(root, 'images');
  const newState = join(artifactDir, 'state');
  const before = ledgerFacts(stateDir);
  const after = ledgerFacts(newState);
  const sup = supersetCheck(before, after);
  if (!sup.ok) return { ok: false, reasons: sup.reasons, before, after };
  // Stage the pictures: the artifact's outbox/ and images/, then the current images for anything still absent.
  const staged = join(root, 'images.restore');
  rmSync(staged, { recursive: true, force: true });
  mkdirSync(staged, { recursive: true });
  for (const d of ['outbox', 'images']) if (existsSync(join(artifactDir, d))) cpSync(join(artifactDir, d), staged, { recursive: true });
  const list = paidOriginals(newState);
  for (const o of missingSources(list, staged)) {
    const old = join(imagesDir, o.src);
    if (existsSync(old) && sha256File(old) === o.sha256) cpSync(old, join(staged, o.src));
  }
  const missing = missingSources(list, staged);
  if (missing.length) {
    rmSync(staged, { recursive: true, force: true });
    return {
      ok: false,
      reasons: [`${missing.length} paid picture(s) the artifact's ledger names are not in it with the paid bytes (first: ${missing[0].path})`],
      before,
      after,
    };
  }
  rmSync(stateDir, { recursive: true, force: true });
  cpSync(newState, stateDir, { recursive: true });
  rmSync(imagesDir, { recursive: true, force: true });
  renameSync(staged, imagesDir);
  if (existsSync(join(artifactDir, 'composed'))) {
    rmSync(join(root, 'composed'), { recursive: true, force: true });
    cpSync(join(artifactDir, 'composed'), join(root, 'composed'), { recursive: true });
  }
  return { ok: true, reasons: [], before, after, pictures: list.length };
}
