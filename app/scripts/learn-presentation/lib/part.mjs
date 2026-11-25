// =============================================================================
// part — the ledger survives a LOST RUNNER, not only a failed step.
// =============================================================================
// The workflow saves the whole ledger to the Actions cache once, at the end
// of a run (if: always()). A runner that is lost outright never reaches that
// step, so the next run restored an OLDER ledger and bought that run's
// pictures again. The pictures are now bought in parts; after each part the
// CLI snapshots the ledger (state/) and the run's new pictures (outbox/) into
// part/, and the workflow saves part/ to its own small cache entry. The next
// run restores the newest part save beside the full ledger; when the part is
// from a NEWER run than the full ledger (that run was lost), its state wins
// (jobs.jsonl is append-only, so the newer copy holds every older row) and its
// pictures are put back in images/ and in this run's outbox/ for the NAS.
// =============================================================================
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Copy state/ and outbox/ under root into root/part/, stamped with the run id. */
export function savePart(root, runId) {
  const part = join(root, 'part');
  rmSync(part, { recursive: true, force: true });
  mkdirSync(part, { recursive: true });
  for (const d of ['state', 'outbox']) if (existsSync(join(root, d))) cpSync(join(root, d), join(part, d), { recursive: true });
  writeFileSync(join(part, 'run'), `${String(runId || 0)}\n`);
  return part;
}

/** The run id at the end of a cache key ("learn-presentation-ledger-123" -> 123), 0 when none. */
export const runIdOfKey = (key) => Number((/-(\d+)$/.exec(String(key || '')) || [])[1] || 0);

/**
 * Merge a restored part save from a run NEWER than the restored full ledger.
 * Returns { recovered, partRun, ledgerRun }. The part dir is removed either way,
 * so a stale snapshot can never be applied twice.
 */
export function recoverPart(root, ledgerKey) {
  const part = join(root, 'part');
  const ledgerRun = runIdOfKey(ledgerKey);
  if (!existsSync(join(part, 'run'))) return { recovered: false, partRun: 0, ledgerRun };
  const partRun = Number(readFileSync(join(part, 'run'), 'utf8').trim()) || 0;
  const recovered = partRun > ledgerRun && existsSync(join(part, 'state', 'jobs.jsonl'));
  if (recovered) {
    cpSync(join(part, 'state'), join(root, 'state'), { recursive: true });
    if (existsSync(join(part, 'outbox'))) {
      cpSync(join(part, 'outbox'), join(root, 'images'), { recursive: true });
      cpSync(join(part, 'outbox'), join(root, 'outbox'), { recursive: true });
    }
  }
  rmSync(part, { recursive: true, force: true });
  return { recovered, partRun, ledgerRun };
}
