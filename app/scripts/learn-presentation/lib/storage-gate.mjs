// =============================================================================
// storage-gate — no paid picture is bought until every picture already paid for
// is verified on the NAS (owner, 2026-11-24, mandatory for every image workflow):
//   "I do not want any images we pay for to exist exclusively in temporary
//    GitHub storage ... If permanent storage fails, automatically pause paid
//    image generation until the storage issue is resolved."
// =============================================================================
// How the lane learns what the NAS holds (DR-1360: the house starts every road):
// after each pass, infra/nas-loops/learn-thumbs-pull.py hashes every master on
// the NAS, reconciles it against the newest ledger it pulled, and WRITES the
// verdict into the repository variable LEARN_THUMBS_RECONCILED. The runner only
// reads it (vars.*), so no road into the house is needed.
//
// The rule (sha256, the same rule the NAS reconcile uses):
//   paid = every picture sha the CURRENT ledger says was bought (records image +
//          imageV1, Explore-by-Topic covers);
//   open = the NAS verdict is present, parses, says missing 0, and has verified
//          at least as many of the expected pictures as are paid now.
// A batch the NAS has not pulled yet makes paid > verified, so the NEXT batch
// waits for it: a picture is stored before the next one is bought. Unknown is
// never open (DR-0076): no verdict, an unreadable one or a stale one = paused.
// Free providers (cost 0) are not gated: nothing is paid for.
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const STALE_HOURS = 72;

function readJson(p, fallback) {
  try {
    return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback;
  } catch {
    return fallback;
  }
}

/** Every picture sha the ledger's state says was paid for. */
export function paidPictureShas(stateDir) {
  const shas = new Set();
  const take = (img) => {
    if (img && img.sha256) shas.add(String(img.sha256).toLowerCase());
  };
  const records = readJson(join(stateDir, 'records.json'), {});
  for (const r of Array.isArray(records) ? records : Object.values(records)) {
    if (!r) continue;
    take(r.image);
    take(r.imageV1);
  }
  for (const t of Object.values(readJson(join(stateDir, 'topics.json'), {}))) take(t && t.image);
  return shas;
}

/**
 * @param {object} o
 * @param {number} o.paid         pictures paid for, per the ledger
 * @param {string} o.verdict      the raw LEARN_THUMBS_RECONCILED value ('' if unset)
 * @param {number} [o.costCents]  the provider's price; 0 = free, not gated
 * @param {number} [o.nowMs]
 * @returns {{open: boolean, reason: string}}
 */
export function storageGate({ paid, verdict, costCents = 6, nowMs = Date.now() }) {
  if (!costCents) return { open: true, reason: 'free provider: nothing is paid for' };
  if (!String(verdict || '').trim()) return { open: false, reason: 'the NAS has not reported a verified backup yet (LEARN_THUMBS_RECONCILED is unset)' };
  let v;
  try {
    v = JSON.parse(verdict);
  } catch {
    return { open: false, reason: 'the NAS backup verdict is unreadable' };
  }
  const at = Date.parse(v.at || '');
  if (!Number.isFinite(at)) return { open: false, reason: 'the NAS backup verdict has no time' };
  const ageH = (nowMs - at) / 3600000;
  if (ageH > STALE_HOURS) return { open: false, reason: `the NAS backup verdict is ${Math.round(ageH)}h old (over ${STALE_HOURS}h)` };
  const verified = Number(v.present_of_expected);
  const missing = Number(v.missing);
  if (!Number.isFinite(verified) || !Number.isFinite(missing)) return { open: false, reason: 'the NAS backup verdict has no counts' };
  if (missing > 0) return { open: false, reason: `the NAS is missing ${missing} paid picture(s)` };
  if (verified < paid) return { open: false, reason: `the NAS has verified ${verified} of the ${paid} paid pictures (the last batch is not stored yet)` };
  return { open: true, reason: `the NAS holds all ${paid} paid pictures (verified ${v.at})` };
}
