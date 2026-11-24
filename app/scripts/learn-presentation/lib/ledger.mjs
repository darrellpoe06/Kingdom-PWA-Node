// =============================================================================
// ledger — the on-disk job ledger and presentation store (resume lives here)
// =============================================================================
// jobs.jsonl  append-only; one line per job state change. Loading replays it
//             so the LAST line per idempotency key is the job's state. A run
//             killed mid-way loses nothing already written.
//             Shape mirrors public.learn_presentation_jobs (migration 0343).
// records.json the presentation records produced so far, keyed by
//             "<courseKey>::<lessonId>", shaped like public.learn_presentation.
//             Written atomically (tmp + rename).
// =============================================================================
import { mkdirSync, appendFileSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { isParseFault } from './prompts.mjs';

export const JOB_STATES = Object.freeze(['queued', 'running', 'succeeded', 'failed', 'needs-review', 'cancelled']);

export function idempotencyKey({ batchId, courseKey, lessonId, kind, contentSha }) {
  return [batchId, courseKey, lessonId, kind, contentSha].join('|');
}
export const lessonKey = (courseKey, lessonId) => `${courseKey}::${lessonId}`;

export class Ledger {
  constructor(dir, { now = () => new Date().toISOString(), leaseMs = 10 * 60 * 1000, clock = () => Date.now() } = {}) {
    this.dir = dir;
    this.now = now;
    this.clock = clock;
    this.leaseMs = leaseMs;
    mkdirSync(dir, { recursive: true });
    this.jobsPath = join(dir, 'jobs.jsonl');
    this.recordsPath = join(dir, 'records.json');
    this.jobs = new Map();
    this.records = {};
    this.load();
  }

  load() {
    this.jobs.clear();
    this.seq = 0;
    if (existsSync(this.jobsPath)) {
      for (const line of readFileSync(this.jobsPath, 'utf8').split('\n')) {
        if (!line.trim()) continue;
        try { const j = JSON.parse(line); j._seq = ++this.seq; this.jobs.set(j.idempotencyKey, j); } catch { /* a torn last line from a kill is skipped */ }
      }
    }
    this.records = existsSync(this.recordsPath) ? JSON.parse(readFileSync(this.recordsPath, 'utf8')) : {};
  }

  write(job) {
    const { _seq, ...clean } = job; // eslint-disable-line no-unused-vars
    const row = { ...clean, updatedAt: this.now() };
    appendFileSync(this.jobsPath, `${JSON.stringify(row)}\n`);
    row._seq = ++this.seq;
    this.jobs.set(row.idempotencyKey, row);
    return row;
  }

  /** The latest job for a lesson + kind, whatever its batch or content hash. */
  latestFor(courseKey, lessonId, kind) {
    let best = null;
    for (const j of this.jobs.values()) {
      if (j.courseKey === courseKey && j.lessonId === lessonId && j.kind === kind && (!best || j._seq > best._seq)) best = j;
    }
    return best;
  }

  /**
   * Should this lesson be (re)processed? Skips a job that already succeeded on
   * the SAME content; re-queues when the lesson changed, when a lease expired,
   * or when attempts remain on a failure.
   */
  decide({ courseKey, lessonId, kind, contentSha, maxAttempts = 3, retryFailed = false }) {
    const j = this.latestFor(courseKey, lessonId, kind);
    if (!j) return { run: true, attempts: 0, reason: 'new' };
    if (j.contentSha !== contentSha) return { run: true, attempts: 0, reason: 'lesson-changed' };
    if (j.state === 'succeeded') return { run: false, reason: 'done' };
    // A parse fault parked as needs-review before pilot 2 is unfinished work, not an editorial verdict.
    if (j.state === 'needs-review' && isParseFault(j.lastError)) return (j.attempts || 0) < maxAttempts ? { run: true, attempts: j.attempts || 0, reason: 'parse-fault' } : { run: false, reason: 'exhausted' };
    if (j.state === 'needs-review' || j.state === 'cancelled') return { run: false, reason: j.state };
    if (j.state === 'running') {
      const leased = j.leaseUntil && Date.parse(j.leaseUntil) > this.clock();
      return leased ? { run: false, reason: 'leased' } : { run: true, attempts: j.attempts || 0, reason: 'lease-expired' };
    }
    if (j.state === 'failed') {
      if (retryFailed) return { run: true, attempts: 0, reason: 'retry-failed' };
      return (j.attempts || 0) < maxAttempts ? { run: true, attempts: j.attempts || 0, reason: 'retry' } : { run: false, reason: 'exhausted' };
    }
    return { run: true, attempts: j.attempts || 0, reason: j.state };
  }

  leaseUntil() { return new Date(this.clock() + this.leaseMs).toISOString(); }

  getRecord(courseKey, lessonId) { return this.records[lessonKey(courseKey, lessonId)] || null; }

  putRecord(rec) {
    this.records[lessonKey(rec.courseKey, rec.lessonId)] = { ...rec, updatedAt: this.now() };
    const tmp = `${this.recordsPath}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.records, null, 1));
    renameSync(tmp, this.recordsPath);
  }

  /** What every run so far has spent on one job (its latest row carries the running total). */
  costSoFar(key) {
    const j = this.jobs.get(key);
    return (j && Number(j.costCents)) || 0;
  }

  spentCents() {
    let c = 0;
    for (const j of this.jobs.values()) c += Number(j.costCents) || 0;
    return c;
  }

  summary() {
    const out = { text: {}, image: {} };
    for (const j of this.jobs.values()) {
      const bucket = out[j.kind] || (out[j.kind] = {});
      bucket[j.state] = (bucket[j.state] || 0) + 1;
    }
    return { ...out, spentCents: this.spentCents(), records: Object.keys(this.records).length };
  }
}
