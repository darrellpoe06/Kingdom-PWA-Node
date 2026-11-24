// =============================================================================
// Recovery check: before a resumed run spends anything, prove the saved ledger
// holds the paid work it should — the spend recorded, the finished titles, and
// every finished image present on disk with the exact bytes that were paid for.
// Pilot 2 (2026-11-24) must find pilot 1's 10 titles, 10 images and 98c, or stop.
// =============================================================================
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export function verifyRecovery(ledger, imageDir, { minCents = 0, minText = 0, minImages = 0 } = {}) {
  const problems = [];
  const spent = ledger.spentCents();
  let text = 0;
  for (const j of ledger.jobs.values()) if (j.kind === 'text' && j.state === 'succeeded') text += 1;
  let images = 0;
  for (const r of Object.values(ledger.records)) {
    if (!r.image || !r.image.path) continue;
    const file = join(imageDir, r.image.path);
    if (!existsSync(file)) { problems.push(`image missing on disk: ${r.courseKey}::${r.lessonId} (${r.image.path})`); continue; }
    const sha = createHash('sha256').update(readFileSync(file)).digest('hex');
    if (r.image.sha256 && sha !== r.image.sha256) { problems.push(`image bytes changed: ${r.courseKey}::${r.lessonId}`); continue; }
    images += 1;
  }
  if (spent < minCents) problems.push(`ledger records ${spent}c spent, expected at least ${minCents}c`);
  if (text < minText) problems.push(`ledger has ${text} finished titles, expected at least ${minText}`);
  if (images < minImages) problems.push(`ledger has ${images} intact images, expected at least ${minImages}`);
  return { ok: problems.length === 0, spent, text, images, problems };
}
