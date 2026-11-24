// =============================================================================
// pipeline — Stage A (copy), Stage B (picture), export. Resumable, budgeted.
// =============================================================================
// The pipeline READS lessons and WRITES presentation records. It holds no
// reference that could write a lesson back: items carry the lesson object
// only to read it, and the tests run it over deep-frozen lessons.
//
// Stage A  one text call per lesson -> {displayTitle, thumbHeadline,
//          promoDescription, imagePrompt, imageAlt}; checked by the app's own
//          validateRecords() plus a library-wide duplicate check; one retry
//          with the failure fed back; then needs-review.
// Stage B  one image per UNIQUE lesson (age versions are not lessons) from the
//          approved copy; saved as <out>/<courseKey>/<lessonId>.<ext> with its
//          sha256; exact duplicates and (when a perceptual hash is supplied)
//          near-duplicates are flagged for review.
// Every paid call reserves its cost against --budget-cents BEFORE it is made;
// a call that would cross the cap is never sent.
// =============================================================================
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { stableStringify } from '../../../src/lib/learn-presentation/integrity.js';
import { courseDepartment } from '../../../src/lib/learn-organize.js';
import { validateRecords } from '../../../src/lib/learn-presentation/validate.js';
import { withTimeout, retry, pool, realSleep } from './limits.mjs';
import { idempotencyKey } from './ledger.mjs';
import { SYSTEM_PROMPT, userPrompt, parseCopy, finalImagePrompt, isParseFault } from './prompts.mjs';

export const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export class BudgetExceeded extends Error {
  constructor(msg) { super(msg); this.name = 'BudgetExceeded'; this.retryable = false; }
}

/** Reserve before spending; settle after. Never lets a call start that could cross the cap. */
export class Budget {
  constructor(capCents, alreadySpent = 0) { this.cap = capCents == null ? Infinity : Number(capCents); this.spent = alreadySpent; this.reserved = 0; }
  reserve(cents) {
    if (this.spent + this.reserved + cents > this.cap) throw new BudgetExceeded(`budget cap ${this.cap}¢ reached (spent ${this.spent}¢, reserved ${this.reserved}¢, next call ${cents}¢)`);
    this.reserved += cents;
    return cents;
  }
  settle(reservedCents, actualCents) { this.reserved -= reservedCents; this.spent += actualCents; }
  release(reservedCents) { this.reserved -= reservedCents; }
}

/** One work item per mounted lesson, keyed by (courseKey, lessonId, contentSha). */
export function buildItems(inventory) {
  const items = [];
  for (const c of inventory) {
    const course = { key: c.key, title: c.title, meta: c.meta };
    const department = c.department || courseDepartment({ key: c.key, meta: c.meta });
    for (const lesson of c.lessons || []) {
      if (!lesson || !lesson.id) continue;
      items.push({ courseKey: c.key, lessonId: lesson.id, lesson, course, department, originalTitle: lesson.title, contentSha: sha256(stableStringify(lesson)) });
    }
  }
  return items;
}

/** The courses shape validateRecords() expects. */
export const coursesForValidation = (inventory) => inventory.map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons || [] }));

export function selectItems(items, { only = null, limit = null } = {}) {
  let out = items;
  if (only && only.length) {
    const want = new Set(only);
    out = out.filter((it) => want.has(it.lessonId) || want.has(`${it.courseKey}::${it.lessonId}`));
  }
  return limit ? out.slice(0, limit) : out;
}

function candidateRecord(item, copy) {
  return {
    lessonId: item.lessonId,
    courseKey: item.courseKey,
    originalTitleAtApproval: item.originalTitle,
    displayTitle: copy.displayTitle,
    thumbHeadline: copy.thumbHeadline,
    promoDescription: copy.promoDescription,
    visual: { prompt: copy.imagePrompt, alt: copy.imageAlt },
  };
}

function libraryDuplicate(ledger, item, displayTitle) {
  const k = norm(displayTitle);
  for (const r of Object.values(ledger.records)) {
    if (r.courseKey === item.courseKey && r.lessonId === item.lessonId) continue;
    if (r.status !== 'rejected' && norm(r.displayTitle) === k) return `${r.courseKey}::${r.lessonId}`;
  }
  return null;
}

/** Stage A. Returns { done, skipped, needsReview, failed, stoppedByBudget }. */
export async function runText({ items, ledger, provider, courses, batchId, concurrency = 4, maxAttempts = 3, budget = new Budget(null), timeoutMs = 120000, retryFailed = false, sleep = realSleep, random = Math.random, log = () => {} }) {
  const tally = { done: 0, skipped: 0, needsReview: 0, failed: 0, stoppedByBudget: false };
  const cost = provider.costCents != null ? provider.costCents : 1;
  const avoid = () => Object.values(ledger.records).map((r) => r.displayTitle).filter(Boolean);

  // Every TRY reserves and is charged on its own, retries and failures
  // included: a request that reached the provider may have been billed, so a
  // failed try counts as spent (never released). meter.c is the job's total.
  const ask = async (item, feedback, meter) =>
    retry(async () => {
      const held = budget.reserve(cost);
      try {
        const out = await withTimeout((signal) => provider.complete({ system: SYSTEM_PROMPT, user: userPrompt({ ...item, feedback, avoidTitles: avoid() }), signal }), timeoutMs, `text ${item.lessonId}`);
        const c = out.costCents != null ? out.costCents : cost;
        budget.settle(held, c);
        meter.c += c;
        return out;
      } catch (e) {
        budget.settle(held, cost);
        meter.c += cost;
        throw e;
      }
    }, { attempts: 3, sleep, random });

  const check = (item, copy) => {
    const rec = candidateRecord(item, copy);
    const { errors } = validateRecords([rec], courses);
    const msgs = errors.map((e) => `${e.code}${e.detail ? ` (${e.detail})` : ''}`);
    const dup = libraryDuplicate(ledger, item, copy.displayTitle);
    if (dup) msgs.push(`duplicate-display-title (same as ${dup})`);
    return { rec, msgs };
  };

  await pool(items, concurrency, async (item) => {
    if (tally.stoppedByBudget) return;
    const d = ledger.decide({ courseKey: item.courseKey, lessonId: item.lessonId, kind: 'text', contentSha: item.contentSha, maxAttempts, retryFailed });
    if (!d.run) { tally.skipped += 1; return; }
    const base = { batchId, courseKey: item.courseKey, lessonId: item.lessonId, kind: 'text', contentSha: item.contentSha, idempotencyKey: idempotencyKey({ batchId, ...item, kind: 'text' }), provider: provider.name, model: provider.model };
    // The ledger keeps the LATEST row per job key, and every run shares one batch
    // key, so a resumed job carries forward what earlier runs already spent on it.
    // Without this a retry would overwrite that spend and the $5 cap would undercount.
    const prior = ledger.costSoFar(base.idempotencyKey);
    const attempts = (d.attempts || 0) + 1;
    ledger.write({ ...base, state: 'running', attempts, leaseUntil: ledger.leaseUntil(), costCents: prior });
    const meter = { c: 0 };
    try {
      let feedback = null;
      for (let pass = 1; pass <= 2; pass += 1) {
        const out = await ask(item, feedback, meter);
        let copy;
        try { copy = parseCopy(out.text); } catch (e) { feedback = e.message; continue; }
        const { rec, msgs } = check(item, copy);
        if (!msgs.length) {
          ledger.putRecord({ ...rec, image: null, status: 'review', featured: false, provider: { text: provider.name, model: provider.model }, contentSha: item.contentSha });
          ledger.write({ ...base, state: 'succeeded', attempts, costCents: prior + meter.c, leaseUntil: null, lastError: null });
          tally.done += 1;
          log(`text ✓ ${item.courseKey}/${item.lessonId}: ${copy.displayTitle}`);
          return;
        }
        feedback = msgs.join('; ');
        if (pass === 2) {
          ledger.putRecord({ ...rec, image: null, status: 'draft', featured: false, validation: msgs, contentSha: item.contentSha });
        }
      }
      // Both passes unreadable: a transport fault, so it stays resumable (failed,
      // retried up to maxAttempts on the next run). Readable copy that failed the
      // checks is an editorial question and goes to review as a draft.
      if (isParseFault(feedback)) {
        ledger.write({ ...base, state: 'failed', attempts, costCents: prior + meter.c, leaseUntil: null, lastError: feedback });
        tally.failed += 1;
        log(`text ✗ ${item.courseKey}/${item.lessonId}: ${feedback} (will be retried)`);
        return;
      }
      ledger.write({ ...base, state: 'needs-review', attempts, costCents: prior + meter.c, leaseUntil: null, lastError: feedback });
      tally.needsReview += 1;
      log(`text ? ${item.courseKey}/${item.lessonId}: ${feedback}`);
    } catch (e) {
      if (e instanceof BudgetExceeded) {
        tally.stoppedByBudget = true;
        ledger.write({ ...base, state: 'queued', attempts: attempts - 1, costCents: prior + meter.c, leaseUntil: null, lastError: e.message });
        log(`budget: ${e.message}`);
        return;
      }
      ledger.write({ ...base, state: 'failed', attempts, costCents: prior + meter.c, leaseUntil: null, lastError: String(e && e.message ? e.message : e) });
      tally.failed += 1;
      log(`text ✗ ${item.courseKey}/${item.lessonId}: ${e.message}`);
    }
  });
  return tally;
}

export const hamming = (a, b) => {
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let n = 0;
  while (x) { n += Number(x & 1n); x >>= 1n; }
  return n;
};

/**
 * Stage B. `perceptualHash(bytes) -> Promise<hex16|null>` is the hook the
 * thumbnail compositor's derivative step supplies (it already decodes every
 * master to make the delivery sizes). Without it only exact duplicates
 * (sha256) are caught.
 */
export async function runImages({ items, ledger, provider, outDir, batchId, concurrency = 4, bucket = null, maxAttempts = 3, budget = new Budget(null), timeoutMs = 240000, retryFailed = false, perceptualHash = null, nearDuplicateBits = 6, sleep = realSleep, random = Math.random, log = () => {} }) {
  const tally = { done: 0, skipped: 0, needsReview: 0, failed: 0, waiting: 0, stoppedByBudget: false };
  const cost = provider.costCents != null ? provider.costCents : 0;
  await pool(items, concurrency, async (item) => {
    if (tally.stoppedByBudget) return;
    const rec = ledger.getRecord(item.courseKey, item.lessonId);
    if (!rec || rec.status !== 'review' || rec.contentSha !== item.contentSha) { tally.waiting += 1; return; }
    const d = ledger.decide({ courseKey: item.courseKey, lessonId: item.lessonId, kind: 'image', contentSha: item.contentSha, maxAttempts, retryFailed });
    if (!d.run) { tally.skipped += 1; return; }
    const base = { batchId, courseKey: item.courseKey, lessonId: item.lessonId, kind: 'image', contentSha: item.contentSha, idempotencyKey: idempotencyKey({ batchId, ...item, kind: 'image' }), provider: provider.name, model: provider.model };
    // The ledger keeps the LATEST row per job key, and every run shares one batch
    // key, so a resumed job carries forward what earlier runs already spent on it.
    // Without this a retry would overwrite that spend and the $5 cap would undercount.
    const prior = ledger.costSoFar(base.idempotencyKey);
    const attempts = (d.attempts || 0) + 1;
    ledger.write({ ...base, state: 'running', attempts, leaseUntil: ledger.leaseUntil(), costCents: prior });
    // Per-TRY reservation, as in Stage A: each generation request (retries
    // included) reserves its own cost before it is sent, and a failed request
    // is charged, because the provider may already have billed it.
    const meter = { c: 0 };
    try {
      const out = await retry(async () => {
        const held = budget.reserve(cost);
        if (bucket) await bucket.take();
        try {
          const r = await withTimeout((signal) => provider.generate({ prompt: finalImagePrompt(rec.visual.prompt), signal }), timeoutMs, `image ${item.lessonId}`);
          const c = r.costCents != null ? r.costCents : cost;
          budget.settle(held, c);
          meter.c += c;
          return r;
        } catch (e) {
          budget.settle(held, cost);
          meter.c += cost;
          throw e;
        }
      }, { attempts: 3, sleep, random, onRetry: ({ attempt, wait, error }) => log(`image retry ${attempt} ${item.lessonId} in ${wait}ms: ${error.message}`) });
      const dir = join(outDir, item.courseKey);
      mkdirSync(dir, { recursive: true });
      const file = join(dir, `${item.lessonId}.${out.ext || 'jpg'}`);
      writeFileSync(file, out.bytes);
      const digest = sha256(out.bytes);
      const phash = perceptualHash ? await withTimeout(() => perceptualHash(out.bytes), 30000, 'perceptual hash').catch(() => null) : null;
      const flags = [];
      for (const r of Object.values(ledger.records)) {
        if (!r.image || (r.courseKey === item.courseKey && r.lessonId === item.lessonId)) continue;
        if (r.image.sha256 === digest) flags.push(`duplicate-image (same bytes as ${r.courseKey}::${r.lessonId})`);
        else if (phash && r.image.phash && hamming(phash, r.image.phash) <= nearDuplicateBits) flags.push(`similar-image (dHash within ${nearDuplicateBits} bits of ${r.courseKey}::${r.lessonId})`);
      }
      ledger.putRecord({ ...rec, image: { path: relative(outDir, file), sha256: digest, phash, provider: provider.name, model: out.model || provider.model }, imageFlags: flags });
      const state = flags.length ? 'needs-review' : 'succeeded';
      ledger.write({ ...base, state, attempts, costCents: prior + meter.c, leaseUntil: null, lastError: flags.length ? flags.join('; ') : null });
      if (flags.length) tally.needsReview += 1; else tally.done += 1;
      log(`image ${flags.length ? '?' : '✓'} ${item.courseKey}/${item.lessonId}${flags.length ? `: ${flags.join('; ')}` : ''}`);
    } catch (e) {
      if (e instanceof BudgetExceeded) {
        tally.stoppedByBudget = true;
        ledger.write({ ...base, state: 'queued', attempts: attempts - 1, costCents: prior + meter.c, leaseUntil: null, lastError: e.message });
        log(`budget: ${e.message}`);
        return;
      }
      ledger.write({ ...base, state: 'failed', attempts, costCents: prior + meter.c, leaseUntil: null, lastError: String(e && e.message ? e.message : e) });
      tally.failed += 1;
      log(`image ✗ ${item.courseKey}/${item.lessonId}: ${e.message}`);
    }
  });
  return tally;
}

/** Records in the presentation-seed.json shape. Status is ALWAYS 'review': approval is a person's act. */
export function exportRecords(ledger, { imageBase = '/learn-thumbs', generatedBy = 'learn-presentation-pipeline' } = {}) {
  const records = Object.values(ledger.records)
    .filter((r) => r.displayTitle)
    .map((r) => ({
      lessonId: r.lessonId,
      courseKey: r.courseKey,
      originalTitleAtApproval: r.originalTitleAtApproval,
      displayTitle: r.displayTitle,
      thumbHeadline: r.thumbHeadline,
      promoDescription: r.promoDescription,
      visual: { prompt: r.visual && r.visual.prompt, alt: r.visual && r.visual.alt },
      image: r.image ? (r.image.delivery ? { src: r.image.delivery.src, srcSet: r.image.delivery.srcSet, lqip: r.image.delivery.lqip, og: r.image.delivery.og, sha256: r.image.sha256 } : { src: `${imageBase}/${r.image.path.replace(/\\/g, '/')}`, sha256: r.image.sha256 }) : null,
      status: 'review',
      featured: false,
      ...((r.validation && r.validation.length) || (r.imageFlags && r.imageFlags.length) || r.status === 'draft' ? { needsReview: [...(r.validation || []), ...(r.imageFlags || [])] } : {}),
    }));
  return { schema: 'learn-presentation/v1', generatedBy, status: 'review', note: 'Promotional presentation ONLY. Never edits a lesson. Every record needs human approval.', records };
}
