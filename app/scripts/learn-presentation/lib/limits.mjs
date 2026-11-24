// =============================================================================
// limits — timeouts, retries, concurrency and rate limits for every provider call
// =============================================================================
// Every async call the pipeline makes goes through withTimeout (explicit
// deadline + AbortSignal) and, when it reaches a provider, retry() (backoff
// with jitter on 429 / 5xx / timeout) inside a Semaphore and a TokenBucket.
// Clock and sleep are injectable so tests run instantly.
// =============================================================================

import { setTimeout, clearTimeout } from 'node:timers';

export class TimeoutError extends Error {
  constructor(ms, label = 'operation') { super(`${label} timed out after ${ms} ms`); this.name = 'TimeoutError'; this.retryable = true; }
}

export class ProviderError extends Error {
  constructor(message, { status = null, retryable = null, cause = null } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
    this.retryable = retryable != null ? retryable : status === 429 || (status != null && status >= 500);
    if (cause) this.cause = cause;
  }
}

export const realSleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run fn(signal) with a hard deadline. The signal aborts the underlying fetch. */
/* AbortController is a Node global; declared for the linter. */
/* global AbortController */
export async function withTimeout(fn, ms, label = 'operation') {
  const ctl = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => { ctl.abort(); reject(new TimeoutError(ms, label)); }, ms);
  });
  try {
    return await Promise.race([Promise.resolve().then(() => fn(ctl.signal)), deadline]);
  } finally {
    clearTimeout(timer);
  }
}

/** Retry retryable failures with exponential backoff + full jitter. Non-retryable errors throw at once. */
export async function retry(fn, { attempts = 3, baseMs = 1000, maxMs = 30000, sleep = realSleep, random = Math.random, onRetry = null } = {}) {
  let last;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await fn(i);
    } catch (e) {
      last = e;
      const retryable = e && (e.retryable === true || e.name === 'TimeoutError');
      if (!retryable || i === attempts) throw e;
      const wait = Math.floor(random() * Math.min(maxMs, baseMs * 2 ** (i - 1)));
      if (onRetry) onRetry({ attempt: i, wait, error: e });
      await sleep(wait);
    }
  }
  throw last;
}

/** At most `max` tasks at once. */
export class Semaphore {
  constructor(max) { this.max = Math.max(1, max | 0); this.active = 0; this.queue = []; }
  async run(fn) {
    if (this.active >= this.max) await new Promise((r) => this.queue.push(r));
    this.active += 1;
    try { return await fn(); } finally {
      this.active -= 1;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

/** Requests-per-minute limiter (token bucket). */
export class TokenBucket {
  constructor(perMinute, { now = () => Date.now(), sleep = realSleep } = {}) {
    this.capacity = Math.max(1, perMinute);
    this.tokens = this.capacity;
    this.ratePerMs = this.capacity / 60000;
    this.now = now;
    this.sleep = sleep;
    this.last = now();
  }
  refill() {
    const t = this.now();
    this.tokens = Math.min(this.capacity, this.tokens + (t - this.last) * this.ratePerMs);
    this.last = t;
  }
  async take() {
    for (;;) {
      this.refill();
      if (this.tokens >= 1) { this.tokens -= 1; return; }
      await this.sleep(Math.ceil((1 - this.tokens) / this.ratePerMs));
    }
  }
}

/** Map items through fn with bounded concurrency; failures are returned, not thrown. */
export async function pool(items, concurrency, fn) {
  const sem = new Semaphore(concurrency);
  return Promise.all(items.map((it) => sem.run(async () => {
    try { return { ok: true, value: await fn(it) }; } catch (error) { return { ok: false, error, item: it }; }
  })));
}
