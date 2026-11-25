// =============================================================================
// The Learn presentation pipeline resumes, retries, stays in budget, rejects
// duplicates and NEVER writes to a lesson (scripts/learn-presentation)
// =============================================================================
// Mock providers only — no network, no keys, no spend. Lessons are deep-frozen
// and compared byte-for-byte after a full text + image run.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Ledger, idempotencyKey } from '../../scripts/learn-presentation/lib/ledger.mjs';
import { ProviderError, withTimeout, TokenBucket } from '../../scripts/learn-presentation/lib/limits.mjs';
import { Budget, buildItems, coursesForValidation, runText, runImages, exportRecords, hamming } from '../../scripts/learn-presentation/lib/pipeline.mjs';
import { parseCopy, userPrompt } from '../../scripts/learn-presentation/lib/prompts.mjs';
import { estimate } from '../../scripts/learn-presentation/lib/prices.mjs';
import { anthropicText } from '../../scripts/learn-presentation/providers/text.mjs';
import { bflImage } from '../../scripts/learn-presentation/providers/image.mjs';
import { verifyRecovery } from '../../scripts/learn-presentation/lib/recovery.mjs';
import { writeFileSync, rmSync, cpSync, mkdirSync } from 'node:fs';
import { savePart, recoverPart } from '../../scripts/learn-presentation/lib/part.mjs';

const deepFreeze = (o) => {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    Object.values(o).forEach(deepFreeze);
  }
  return o;
};
const noSleep = async () => {};

function fixture() {
  const mk = (id, title) => ({
    id,
    title,
    bigIdea: `Big idea of ${title}.`,
    lesson: `The adult text of ${title}. "In the beginning God created the heaven and the earth." (Genesis 1:1)`,
    levels: { teen: `Teen text of ${title}.` },
  });
  return deepFreeze([
    {
      key: 'living-lessons',
      title: 'Living Lessons from the Word',
      department: 'Living Lessons',
      meta: { title: 'Living Lessons from the Word', category: 'Living Lessons' },
      lessons: [mk('ll1-a', 'Not with Eyeservice — faithful work'), mk('ll2-b', 'Give Me This Mountain'), mk('ll3-c', 'Whoso Removeth Stones')],
    },
    {
      key: 'stocks',
      title: 'Stocks',
      department: 'Stock Market',
      meta: { title: 'Stocks', category: 'Stock Market' },
      lessons: [mk('stk1-d', 'When you buy a share'), mk('stk2-e', 'Primary and secondary')],
    },
  ]);
}

const COPY = {
  'Not with Eyeservice — faithful work': 'Who Are You When Nobody Is Watching?',
  'Give Me This Mountain': 'Your Greatest Years May Still Be Ahead',
  'Whoso Removeth Stones': 'One Small Mistake Can Ground Everything',
  'When you buy a share': 'Where Does Your Stock Money Really Go?',
  'Primary and secondary': 'Two Markets, One Name',
};
const titleFrom = (user) => /ORIGINAL TITLE[^:]*\): (.*)/.exec(user)[1];
const goodCopy = (t) =>
  JSON.stringify({
    displayTitle: COPY[t],
    thumbHeadline: `${COPY[t].split(' ')[0]} HEADLINE NOW`,
    promoDescription: 'What the lesson teaches.',
    imagePrompt: 'A bright daylight photograph of a smiling Black family at a sunny kitchen table.',
    imageAlt: 'A person at work.',
  });

function mockText(fn) {
  const p = {
    name: 'mock',
    model: 'mock-1',
    costCents: 1,
    calls: [],
    complete: async (req) => {
      p.calls.push(req);
      return { text: await fn(req, p.calls.length), model: 'mock-1', costCents: 1 };
    },
  };
  return p;
}
function mockImage(fn = (prompt) => Buffer.from(`img:${prompt.slice(0, 40)}:${Math.random()}`)) {
  const p = {
    name: 'mockimg',
    model: 'mock-img',
    costCents: 6,
    calls: 0,
    generate: async ({ prompt }) => {
      p.calls += 1;
      return { bytes: await fn(prompt, p.calls), ext: 'jpg', model: 'mock-img', costCents: 6 };
    },
  };
  return p;
}

let dir;
let inv;
let courses;
let items;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'lp-'));
  inv = fixture();
  courses = coursesForValidation(inv);
  items = buildItems(inv);
});
const ledger = () => new Ledger(join(dir, 'state'));
const textRun = (l, provider, extra = {}) => runText({ items, ledger: l, provider, courses, batchId: 'b1', concurrency: 1, sleep: noSleep, ...extra });

describe('the pipeline never writes to a lesson', () => {
  it('a full text + image run leaves deep-frozen lessons byte-identical', async () => {
    const before = JSON.stringify(inv);
    const l = ledger();
    const t = await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    expect(t).toMatchObject({ done: 5, failed: 0, needsReview: 0 });
    const im = await runImages({ items, ledger: l, provider: mockImage(), outDir: join(dir, 'img'), batchId: 'b1', concurrency: 3, sleep: noSleep });
    expect(im).toMatchObject({ done: 5, failed: 0 });
    expect(JSON.stringify(inv)).toBe(before);
    expect(existsSync(join(dir, 'img', 'living-lessons', 'll1-a.jpg'))).toBe(true);
    const rec = l.getRecord('living-lessons', 'll1-a');
    expect(rec.originalTitleAtApproval).toBe('Not with Eyeservice — faithful work');
    expect(rec.image.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('resume', () => {
  it('a second run skips every succeeded job and calls no provider', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    const again = mockText(() => {
      throw new Error('must not be called');
    });
    const t = await textRun(new Ledger(join(dir, 'state')), again);
    expect(t).toMatchObject({ done: 0, skipped: 5 });
    expect(again.calls.length).toBe(0);
  });

  it('a lesson whose content changed is re-queued, never reused', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    const changed = items.map((it) => (it.lessonId === 'll2-b' ? { ...it, contentSha: 'f'.repeat(64) } : it));
    const p = mockText((req) => goodCopy(titleFrom(req.user)));
    const t = await runText({ items: changed, ledger: new Ledger(join(dir, 'state')), provider: p, courses, batchId: 'b1', concurrency: 1, sleep: noSleep });
    expect(t).toMatchObject({ done: 1, skipped: 4 });
  });

  it('a job left running past its lease is resumed', () => {
    let now = 1_000_000;
    const l = new Ledger(join(dir, 'state'), { clock: () => now, leaseMs: 1000 });
    l.write({
      idempotencyKey: 'k',
      courseKey: 'stocks',
      lessonId: 'stk1-d',
      kind: 'text',
      contentSha: 'x',
      state: 'running',
      attempts: 1,
      leaseUntil: new Date(now + 1000).toISOString(),
    });
    expect(l.decide({ courseKey: 'stocks', lessonId: 'stk1-d', kind: 'text', contentSha: 'x' }).run).toBe(false);
    now += 5000;
    expect(l.decide({ courseKey: 'stocks', lessonId: 'stk1-d', kind: 'text', contentSha: 'x' })).toMatchObject({ run: true, reason: 'lease-expired' });
  });
});

describe('retries, timeouts and budget', () => {
  it('retries a 503 with backoff, then records the failure', async () => {
    const waits = [];
    const p = mockText(() => {
      throw new ProviderError('busy', { status: 503 });
    });
    const t = await textRun(ledger(), p, {
      items: items.slice(0, 1),
      sleep: async (ms) => {
        waits.push(ms);
      },
      random: () => 0.5,
    });
    expect(t.failed).toBe(1);
    expect(p.calls.length).toBe(3);
    expect(waits).toEqual([500, 1000]);
  });

  it('a call that never answers times out and fails cleanly', async () => {
    const p = { name: 'hang', model: 'h', costCents: 0, complete: () => new Promise(() => {}) };
    const l = ledger();
    const t = await textRun(l, p, { items: items.slice(0, 1), timeoutMs: 20 });
    expect(t.failed).toBe(1);
    expect(l.latestFor('living-lessons', 'll1-a', 'text').lastError).toMatch(/timed out/);
    await expect(withTimeout(() => new Promise(() => {}), 10, 'x')).rejects.toThrow(/timed out after 10 ms/);
  });

  it('stops before the budget cap is crossed and leaves the rest queued', async () => {
    const p = mockText((req) => goodCopy(titleFrom(req.user)));
    const t = await textRun(ledger(), p, { budget: new Budget(2) });
    expect(t.done).toBe(2);
    expect(t.stoppedByBudget).toBe(true);
    expect(p.calls.length).toBe(2);
  });

  it('the token bucket waits when the per-minute allowance is spent', async () => {
    let now = 0;
    const waited = [];
    const b = new TokenBucket(2, {
      now: () => now,
      sleep: async (ms) => {
        waited.push(ms);
        now += ms;
      },
    });
    await b.take();
    await b.take();
    await b.take();
    expect(waited.length).toBe(1);
    expect(waited[0]).toBeGreaterThan(0);
  });
});

describe('quality gates', () => {
  it('a duplicate display title anywhere in the library is rejected to review', async () => {
    const p = mockText(() =>
      JSON.stringify({
        displayTitle: 'The Same Title Every Time',
        thumbHeadline: 'SAME HEADLINE HERE',
        promoDescription: 'x',
        imagePrompt: 'A bright daylight photograph of a smiling Black family at a sunny kitchen table.',
        imageAlt: 'z',
      })
    );
    const t = await textRun(ledger(), p, { items: items.slice(0, 2) });
    expect(t).toMatchObject({ done: 1, needsReview: 1 });
  });

  it('validator errors are fed back once, then routed to needs-review as a draft', async () => {
    const p = mockText(() =>
      JSON.stringify({
        displayTitle: 'How God Uses Your Past',
        thumbHeadline: 'YOUR PAST MATTERS',
        promoDescription: 'x',
        imagePrompt: 'A bright daylight photograph of a smiling Black family at a sunny kitchen table.',
        imageAlt: 'z',
      })
    );
    const l = ledger();
    const t = await textRun(l, p, { items: items.slice(0, 1) });
    expect(t.needsReview).toBe(1);
    expect(p.calls.length).toBe(2);
    expect(p.calls[1].user).toMatch(/rejected for: generic-god/);
    expect(l.getRecord('living-lessons', 'll1-a').status).toBe('draft');
  });

  it('identical image bytes are flagged for review', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    const t = await runImages({
      items,
      ledger: l,
      provider: mockImage(() => Buffer.from('same')),
      outDir: join(dir, 'img'),
      batchId: 'b1',
      concurrency: 1,
      sleep: noSleep,
    });
    expect(t.done).toBe(1);
    expect(t.needsReview).toBe(4);
  });

  it('near-duplicate perceptual hashes are flagged when a hash hook is supplied', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    const t = await runImages({
      items: items.slice(0, 2),
      ledger: l,
      provider: mockImage(),
      outDir: join(dir, 'img'),
      batchId: 'b1',
      concurrency: 1,
      sleep: noSleep,
      perceptualHash: async () => 'ffffffffffffff00',
    });
    expect(t).toMatchObject({ done: 1, needsReview: 1 });
    expect(hamming('ffffffffffffff00', 'ffffffffffffff01')).toBe(1);
  });

  it('images wait for approved copy and are one per lesson', async () => {
    const p = mockImage();
    const t = await runImages({ items, ledger: ledger(), provider: p, outDir: join(dir, 'img'), batchId: 'b1', sleep: noSleep });
    expect(t.waiting).toBe(5);
    expect(p.calls).toBe(0);
  });

  it('export is the seed shape and never marks anything approved', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user)))
    );
    const out = exportRecords(l);
    expect(out.records).toHaveLength(5);
    expect(new Set(out.records.map((r) => r.status))).toEqual(new Set(['review']));
    expect(Object.keys(out.records[0])).toEqual(
      expect.arrayContaining(['lessonId', 'courseKey', 'originalTitleAtApproval', 'displayTitle', 'thumbHeadline', 'visual', 'image'])
    );
    expect(
      readFileSync(join(dir, 'state', 'jobs.jsonl'), 'utf8')
        .trim()
        .split('\n').length
    ).toBeGreaterThan(5);
  });
});

describe('prompts, prices and providers', () => {
  it('parses fenced JSON and refuses missing keys', () => {
    expect(parseCopy('```json\n{"displayTitle":"a","thumbHeadline":"b c","promoDescription":"d","imagePrompt":"e","imageAlt":"f"}\n```').displayTitle).toBe(
      'a'
    );
    expect(() => parseCopy('{"displayTitle":"a"}')).toThrow(/thumbHeadline/);
  });
  it('the prompt carries the original title as do-not-reuse and the lesson text untouched', () => {
    const it0 = items[0];
    const u = userPrompt(it0);
    expect(u).toContain('ORIGINAL TITLE (do not reuse');
    expect(u).toContain('"In the beginning God created the heaven and the earth." (Genesis 1:1)');
  });
  it('estimates 994 lessons with regeneration', () => {
    const e = estimate({ lessons: 994 });
    expect(e.generations).toBe(1293);
    expect(e.image.find((r) => r.key === 'bfl:flux-pro-1.1-ultra').cents).toBe(7758);
  });
  it('paid providers refuse to start without a key', () => {
    expect(() => anthropicText({ apiKey: '' })).toThrow(/ANTHROPIC_API_KEY is not set/);
    expect(() => bflImage({ apiKey: '' })).toThrow(/BFL_API_KEY is not set/);
  });
  it('the BFL adapter submits, polls and downloads through an injected fetch', async () => {
    const seen = [];
    const fetchImpl = async (url) => {
      seen.push(url);
      if (url.endsWith('/flux-pro-1.1-ultra')) return { ok: true, json: async () => ({ polling_url: 'https://poll/1' }) };
      if (url === 'https://poll/1')
        return { ok: true, json: async () => ({ status: seen.length < 4 ? 'Pending' : 'Ready', result: { sample: 'https://cdn/img.jpg' } }) };
      return { ok: true, headers: { get: () => 'image/jpeg' }, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
    };
    const p = bflImage({ apiKey: 'k', fetchImpl, sleep: noSleep });
    const out = await p.generate({ prompt: 'x', signal: new AbortController().signal });
    expect(out).toMatchObject({ ext: 'jpg', costCents: 6 });
    expect(out.bytes.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// The owner's pilot safeguards (2026-11-24): the pilot cannot be widened, and
// $5 is the combined ceiling, retries and failed tries included.
// ---------------------------------------------------------------------------
describe('pilot scope cannot be widened', () => {
  const SEED_PATH = join(process.cwd(), 'src/lib/learn-presentation/presentation-seed.json');
  let scope;
  beforeEach(async () => {
    scope = await import('../../scripts/learn-presentation/lib/scope.mjs');
  });

  it('the seed is exactly the 20 approved pilot lessons, all mounted', async () => {
    const { learnInventory } = await import('../lib/learn-presentation/integrity.js');
    const real = buildItems(learnInventory());
    const picked = scope.resolveSpendingScope('seed', real, { seedPath: SEED_PATH });
    expect(scope.PILOT_MAX_LESSONS).toBe(20);
    expect(picked).toHaveLength(20);
    expect(new Set(picked.map((x) => `${x.courseKey}::${x.lessonId}`)).size).toBe(20);
  });

  it('refuses an empty selection, "all", unknown ids and more than 20', () => {
    const many = Array.from({ length: 21 }, (_, i) => ({ courseKey: 'c', lessonId: `l${i}` }));
    const r =
      (only, its = items) =>
      () =>
        scope.resolveSpendingScope(only, its, { seedPath: SEED_PATH });
    expect(r(undefined)).toThrow(scope.ScopeError);
    expect(r('')).toThrow(/must name its lessons/);
    expect(r(true)).toThrow(/must name its lessons/);
    // Owner approved the full library 2026-11-24: "all" is every mounted lesson, de-duplicated.
    expect(r('all')().length).toBe(new Set(items.map((x) => `${x.courseKey}::${x.lessonId}`)).size);
    expect(r('ll1-a,not-a-lesson')).toThrow(/not mounted lessons: not-a-lesson/);
    expect(r(many.map((x) => x.lessonId).join(','), many)).toThrow(/at most 20/);
    expect(scope.FULL_LIBRARY_ENABLED).toBe(true);
  });

  it('a repeated id is one lesson, not two', () => {
    const picked = scope.resolveSpendingScope('ll1-a,ll1-a,living-lessons::ll1-a', items, { seedPath: SEED_PATH });
    expect(picked).toHaveLength(1);
  });

  it('the combined cap subtracts everything already spent, across runs', () => {
    expect(scope.TOTAL_CAP_CENTS).toBe(1343 + 6000); // owner 2026-11-24: $60 more, combined
    expect(scope.IMAGE_TOTAL_CAP_CENTS).toBe(1080 + 5500); // the $55 of BFL credits bought
    expect(scope.remainingCents(400, 0)).toBe(400);
    expect(scope.remainingCents(400, scope.TOTAL_CAP_CENTS - 200)).toBe(200);
    expect(scope.remainingCents(null, scope.TOTAL_CAP_CENTS - 20)).toBe(20);
    expect(scope.remainingCents(400, scope.TOTAL_CAP_CENTS + 400)).toBe(0);
  });
});

describe('every try is charged, retries and failures included', () => {
  it('three failed text tries cost three calls, never zero (proven-to-catch the old release path)', async () => {
    const p = mockText(() => {
      throw new ProviderError('busy', { status: 503 });
    });
    const l = ledger();
    const budget = new Budget(100);
    await textRun(l, p, { items: items.slice(0, 1), budget });
    expect(p.calls.length).toBe(3);
    expect(budget.spent).toBe(3);
    expect(l.spentCents()).toBe(3);
  });

  it('a retried image is charged per request, and the cap counts the retries', async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user))),
      { items: items.slice(0, 2) }
    );
    let n = 0;
    const flaky = mockImage(() => {
      n += 1;
      if (n === 1) throw new ProviderError('busy', { status: 503 });
      return Buffer.from(`img-${n}`);
    });
    const budget = new Budget(12);
    const t = await runImages({
      items: items.slice(0, 2),
      ledger: l,
      provider: flaky,
      outDir: join(dir, 'img'),
      batchId: 'b1',
      concurrency: 1,
      budget,
      sleep: noSleep,
    });
    // 1 failed try (6c) + 1 success (6c) = 12c reaches the cap; the second lesson is never sent
    expect(budget.spent).toBe(12);
    expect(t.done).toBe(1);
    expect(t.stoppedByBudget).toBe(true);
    expect(flaky.calls).toBe(2);
  });

  it('a second run with the same ledger spends nothing on finished lessons', async () => {
    const l = ledger();
    const p = mockText((req) => goodCopy(titleFrom(req.user)));
    await textRun(l, p, { items: items.slice(0, 2) });
    const before = l.spentCents();
    const again = mockText((req) => goodCopy(titleFrom(req.user)));
    const t = await textRun(l, again, { items: items.slice(0, 2) });
    expect(t.skipped).toBe(2);
    expect(again.calls.length).toBe(0);
    expect(l.spentCents()).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Pilot 1 regressions (2026-11-24). Pilot 1 spent 98c, then: 10 of 20 titles
// came back as prose ("no JSON object in model output") and were parked for
// review, and compose crashed with "want.has is not a function". Each test
// below fails on the pilot-1 code.
// ---------------------------------------------------------------------------
describe('pilot 1 regressions', () => {
  const COPY_OBJ = {
    displayTitle: 'Who Are You When Nobody Is Watching?',
    thumbHeadline: 'WHO ARE YOU',
    promoDescription: 'p',
    imagePrompt: 'i',
    imageAlt: 'a',
  };
  const anthropicReply = (body) => async (url, init) => {
    anthropicReply.last = JSON.parse(init.body);
    return { ok: true, json: async () => body };
  };

  it('the Anthropic call FORCES the lesson_copy tool and returns its input as JSON', async () => {
    const fetchImpl = anthropicReply({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'lesson_copy', input: COPY_OBJ }] });
    const out = await anthropicText({ apiKey: 'k', fetchImpl }).complete({ system: 's', user: 'u' });
    const sent = anthropicReply.last;
    expect(sent.tool_choice).toEqual({ type: 'tool', name: 'lesson_copy' });
    expect(sent.tools[0].input_schema.required).toEqual(['displayTitle', 'thumbHeadline', 'promoDescription', 'imagePrompt', 'imageAlt']);
    expect(sent.tools[0].input_schema.additionalProperties).toBe(false);
    expect(sent.max_tokens).toBeGreaterThanOrEqual(2048);
    expect(parseCopy(out.text)).toEqual(COPY_OBJ);
  });

  it('an answer cut off at max_tokens is a retryable fault, never review', async () => {
    const fetchImpl = anthropicReply({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"displayTitle": "Half' }] });
    const err = await anthropicText({ apiKey: 'k', fetchImpl })
      .complete({ system: 's', user: 'u' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.retryable).toBe(true);
  });

  it('prose on both passes is recorded as failed (resumable), not needs-review', async () => {
    const l = ledger();
    const t = await textRun(
      l,
      mockText(() => 'Here is a great title for this lesson!'),
      { items: items.slice(0, 1) }
    );
    expect(t).toMatchObject({ failed: 1, needsReview: 0 });
    const j = l.latestFor('living-lessons', 'll1-a', 'text');
    expect(j.state).toBe('failed');
    expect(l.decide({ courseKey: 'living-lessons', lessonId: 'll1-a', kind: 'text', contentSha: items[0].contentSha })).toMatchObject({ run: true });
  });

  it('a pilot-1 needs-review parse fault is resumed; a real editorial review is not', () => {
    const l = ledger();
    const mk = (lessonId, lastError) => {
      const it = items.find((x) => x.lessonId === lessonId);
      l.write({
        batchId: 'library-v1',
        courseKey: it.courseKey,
        lessonId,
        kind: 'text',
        contentSha: it.contentSha,
        idempotencyKey: `library-v1|${lessonId}`,
        state: 'needs-review',
        attempts: 1,
        costCents: 2,
        lastError,
      });
      return it;
    };
    const a = mk('ll1-a', 'no JSON object in model output');
    const b = mk('ll2-b', 'generic-god');
    expect(l.decide({ courseKey: a.courseKey, lessonId: a.lessonId, kind: 'text', contentSha: a.contentSha })).toMatchObject({
      run: true,
      reason: 'parse-fault',
    });
    expect(l.decide({ courseKey: b.courseKey, lessonId: b.lessonId, kind: 'text', contentSha: b.contentSha })).toMatchObject({
      run: false,
      reason: 'needs-review',
    });
  });

  it('resuming keeps what earlier runs spent: the ledger never forgets a cent (proven-to-catch the overwrite)', async () => {
    const l = ledger();
    // Run 1: prose twice -> failed, 2c spent.
    await textRun(
      l,
      mockText(() => 'prose'),
      { items: items.slice(0, 1) }
    );
    expect(l.spentCents()).toBe(2);
    // Run 2, same batch key: succeeds on the first try for 1c more. Total must be 3, not 1.
    const l2 = ledger();
    const t = await textRun(
      l2,
      mockText((req) => goodCopy(titleFrom(req.user))),
      { items: items.slice(0, 1) }
    );
    expect(t.done).toBe(1);
    expect(l2.spentCents()).toBe(3);
  });

  it('a resumed run skips the 10 finished titles and images and spends only on the rest', async () => {
    const l = ledger();
    // Two finished lessons (text + image), two that failed as prose.
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user))),
      { items: items.slice(0, 2) }
    );
    await textRun(
      l,
      mockText(() => 'prose'),
      { items: items.slice(2, 4) }
    );
    await runImages({ items, ledger: l, provider: mockImage(), outDir: join(dir, 'img'), batchId: 'b1', concurrency: 1, sleep: noSleep });
    const spentBefore = l.spentCents();
    const text = mockText((req) => goodCopy(titleFrom(req.user)));
    const t = await textRun(ledger(), text, { items: items.slice(0, 4) });
    expect(t).toMatchObject({ skipped: 2, done: 2 });
    expect(text.calls.every((c) => !/Not with Eyeservice|Give Me This Mountain/.test(titleFrom(c.user)))).toBe(true);
    const img = mockImage();
    const l3 = ledger();
    const ti = await runImages({
      items: items.slice(0, 4),
      ledger: l3,
      provider: img,
      outDir: join(dir, 'img'),
      batchId: 'b1',
      concurrency: 1,
      sleep: noSleep,
    });
    expect(ti.skipped).toBe(2);
    expect(img.calls).toBe(2);
    expect(l3.spentCents()).toBe(spentBefore + 2 + 12);
  });

  it('with 98c already in the ledger the run may spend only what is left of the combined cap', async () => {
    const scope = await import('../../scripts/learn-presentation/lib/scope.mjs');
    expect(scope.remainingCents(null, 98)).toBe(scope.TOTAL_CAP_CENTS - 98);
    expect(scope.remainingCents(400, 98)).toBe(400);
  });

  it('compose scope is a Set over the resolved lessons, by id or course::id (the want.has crash)', async () => {
    const { scopeKeySet } = await import('../../scripts/learn-presentation/lib/scope.mjs');
    const want = scopeKeySet(items.slice(0, 2));
    expect(typeof want.has).toBe('function');
    expect(want.has('ll1-a')).toBe(true);
    expect(want.has('living-lessons::ll2-b')).toBe(true);
    expect(want.has('ll3-c')).toBe(false);
    expect(scopeKeySet(undefined).size).toBe(0);
  });
});

describe('recovery is proven before a resumed run spends anything', () => {
  const finished = async () => {
    const l = ledger();
    await textRun(
      l,
      mockText((req) => goodCopy(titleFrom(req.user))),
      { items: items.slice(0, 2) }
    );
    await runImages({ items, ledger: l, provider: mockImage(), outDir: join(dir, 'img'), batchId: 'b1', concurrency: 1, sleep: noSleep });
    return ledger();
  };
  const want = { minCents: 14, minText: 2, minImages: 2 };

  it('passes when the titles, the image bytes and the spend are all there', async () => {
    const v = verifyRecovery(await finished(), join(dir, 'img'), want);
    expect(v).toMatchObject({ ok: true, text: 2, images: 2, spent: 14 });
  });

  it('fails on an empty ledger (the cache did not come back)', () => {
    const v = verifyRecovery(ledger(), join(dir, 'img'), want);
    expect(v.ok).toBe(false);
    expect(v.problems.join(' ')).toMatch(/0c spent.*|0 finished titles/);
  });

  it('fails when an image file is missing or its bytes changed', async () => {
    const l = await finished();
    const recs = Object.values(l.records).filter((r) => r.image);
    rmSync(join(dir, 'img', recs[0].image.path));
    writeFileSync(join(dir, 'img', recs[1].image.path), 'tampered');
    const v = verifyRecovery(l, join(dir, 'img'), want);
    expect(v.ok).toBe(false);
    expect(v.images).toBe(0);
    expect(v.problems.join(' ')).toMatch(/missing on disk[\s\S]*bytes changed/);
  });
});

// ---------------------------------------------------------------------------
// Full library (owner approval 2026-11-24): batches, the picture ceiling, and
// the picture-prompt checks that run BEFORE any picture is bought.
// ---------------------------------------------------------------------------
describe('full library brakes', () => {
  it('the next batch skips finished lessons and never exceeds the batch size', async () => {
    const scope = await import('../../scripts/learn-presentation/lib/scope.mjs');
    const l = ledger();
    const it0 = items[0];
    for (const kind of ['text', 'image'])
      l.write({
        batchId: 'b',
        courseKey: it0.courseKey,
        lessonId: it0.lessonId,
        kind,
        contentSha: it0.contentSha,
        idempotencyKey: `b|${it0.lessonId}|${kind}`,
        state: 'succeeded',
        costCents: 1,
      });
    const next = scope.nextLibraryBatch(items, l, 2);
    expect(next.map((x) => x.lessonId)).not.toContain(it0.lessonId);
    expect(next.length).toBeLessThanOrEqual(2);
  });

  it('picture spend is summed over every image kind for the BFL ceiling', async () => {
    const scope = await import('../../scripts/learn-presentation/lib/scope.mjs');
    const l = ledger();
    l.write({ batchId: 'b', courseKey: 'c', lessonId: 'a', kind: 'image', contentSha: 's', idempotencyKey: 'k1', state: 'succeeded', costCents: 6 });
    l.write({ batchId: 'b', courseKey: 'c', lessonId: 'a', kind: 'image-v2', contentSha: 's', idempotencyKey: 'k2', state: 'succeeded', costCents: 6 });
    l.write({
      batchId: 'b',
      courseKey: 'topics',
      lessonId: 'faith',
      kind: 'topic-v2',
      contentSha: 's',
      idempotencyKey: 'k3',
      state: 'succeeded',
      costCents: 6,
    });
    l.write({ batchId: 'b', courseKey: 'c', lessonId: 'a', kind: 'text', contentSha: 's', idempotencyKey: 'k4', state: 'succeeded', costCents: 2 });
    expect(scope.imageSpentCents(l)).toBe(18);
  });

  it('a generated picture prompt in the dark pilot look, or with no Black people, is refused (proven to catch)', async () => {
    const { pictureProblems } = await import('../../scripts/learn-presentation/lib/pipeline.mjs');
    expect(pictureProblems('A focused woman at a desk in a dim office, deep black shadows, warm gold light.').join(' ')).toMatch(/dark-terms/);
    expect(pictureProblems('A bright daylight photograph of a smiling woman at a sunny desk.').join(' ')).toMatch(/no-black-people/);
    expect(pictureProblems('A bright daylight photograph of a smiling Black woman at a sunny desk.')).toEqual([]);
  });

  it('a record whose picture prompt misses the rules is never bought', async () => {
    const l = ledger();
    const it0 = items[0];
    l.putRecord({
      courseKey: it0.courseKey,
      lessonId: it0.lessonId,
      status: 'review',
      contentSha: it0.contentSha,
      visual: { prompt: 'A dim room at night.', alt: 'a' },
      image: null,
    });
    const calls = [];
    const provider = {
      name: 'fake',
      model: 'f',
      costCents: 6,
      async generate() {
        calls.push(1);
        return { bytes: Buffer.from('x'), ext: 'jpg' };
      },
    };
    const t = await runImages({ items: [it0], ledger: l, provider, outDir: mkdtempSync(join(tmpdir(), 'img-')), batchId: 'b', budget: new Budget(100) });
    expect(calls.length).toBe(0);
    expect(t.waiting).toBe(1);
    expect(l.spentCents()).toBe(0);
  });
});

// Library batch 1 (2026-11-24): the BFL account ran dry mid-run (44x HTTP 402
// "Insufficient credits", 23x 429 "credit balance is low"). A refused submit is
// never processed, so it must never be charged; and an empty account must stop
// the whole run with the lesson left queued, not burn retries on every lesson.
describe('the provider says no: unbilled, and an empty account stops the run', () => {
  const goodRecord = (l, it) =>
    l.putRecord({
      courseKey: it.courseKey,
      lessonId: it.lessonId,
      status: 'review',
      contentSha: it.contentSha,
      visual: { prompt: 'A bright daylight photograph of a smiling Black family.', alt: 'a' },
      image: null,
    });

  it('402 out of credit: nothing charged, the run stops, the lesson stays queued (proven to catch)', async () => {
    const l = ledger();
    const [a, b] = items;
    goodRecord(l, a);
    goodRecord(l, b);
    let calls = 0;
    const provider = {
      name: 'fake',
      model: 'f',
      costCents: 6,
      async generate() {
        calls += 1;
        const e = new ProviderError('bfl submit: HTTP 402: {"detail":"Insufficient credits"}', {
          status: 402,
          retryable: false,
          billed: false,
          outOfCredit: true,
        });
        throw e;
      },
    };
    const t = await runImages({
      items: [a, b],
      ledger: l,
      provider,
      outDir: mkdtempSync(join(tmpdir(), 'img-')),
      batchId: 'b',
      budget: new Budget(100),
      concurrency: 1,
      sleep: async () => {},
    });
    expect(l.spentCents()).toBe(0);
    expect(t.outOfCredit).toBe(true);
    expect(calls).toBe(1); // no retries against an empty account, no second lesson
    expect(l.latestFor(a.courseKey, a.lessonId, 'image').state).toBe('queued');
  });

  it('a 429 refused unprocessed is retried but never charged; a billed failure still is', async () => {
    const l = ledger();
    const [a] = items;
    goodRecord(l, a);
    let n = 0;
    const provider = {
      name: 'fake',
      model: 'f',
      costCents: 6,
      async generate() {
        n += 1;
        if (n === 1) throw new ProviderError('bfl submit: HTTP 429', { status: 429, billed: false });
        if (n === 2) throw new ProviderError('bfl: Error', { retryable: true }); // reached the provider: may be billed
        return { bytes: Buffer.from('ok'), ext: 'jpg' };
      },
    };
    const t = await runImages({
      items: [a],
      ledger: l,
      provider,
      outDir: mkdtempSync(join(tmpdir(), 'img-')),
      batchId: 'b',
      budget: new Budget(100),
      sleep: async () => {},
    });
    expect(t.done).toBe(1);
    expect(l.spentCents()).toBe(12); // the billed failure + the success, not the refused 429
  });
});

// ---------------------------------------------------------------------------
// Never pay for one picture twice (audit 2026-11-25): (a) a run killed after BFL
// finished but before the ledger said so, (b) a lost runner whose end-of-run
// ledger save never ran, (c) a poll timeout that led to a fresh submit. Each
// test below fails on the code before the fix.
// ---------------------------------------------------------------------------
describe('a picture BFL already accepted is never bought again', () => {
  const goodRecord = (l, it) =>
    l.putRecord({
      courseKey: it.courseKey,
      lessonId: it.lessonId,
      status: 'review',
      contentSha: it.contentSha,
      visual: { prompt: 'A bright daylight photograph of a smiling Black family.', alt: 'a' },
      image: null,
    });
  // A BFL that counts submits; poll(url, n, signal) answers each poll.
  const fakeBfl = (poll) => {
    const seen = { submits: 0, polls: [] };
    const fetchImpl = async (url, opts = {}) => {
      if (url.endsWith('/flux-pro-1.1-ultra')) {
        seen.submits += 1;
        return { ok: true, status: 200, json: async () => ({ id: `job${seen.submits}`, polling_url: `https://poll/job${seen.submits}` }) };
      }
      if (url.startsWith('https://poll/')) {
        seen.polls.push(url);
        return poll(url, seen.polls.length, opts.signal);
      }
      return { ok: true, status: 200, headers: { get: () => 'image/jpeg' }, arrayBuffer: async () => new Uint8Array([7, 7, 7]).buffer };
    };
    return { seen, fetchImpl };
  };
  const ready = { ok: true, status: 200, json: async () => ({ status: 'Ready', result: { sample: 'https://cdn/x.jpg' } }) };
  const pending = { ok: true, status: 200, json: async () => ({ status: 'Pending' }) };
  const keyOf = (it) => `b|${it.courseKey}|${it.lessonId}|image|${it.contentSha}`;

  it('the spend and the BFL job id are on the ledger the moment BFL accepts the submit', async () => {
    const l = ledger();
    const [a] = items;
    goodRecord(l, a);
    let atFirstPoll = null;
    const { seen, fetchImpl } = fakeBfl(() => {
      if (!atFirstPoll) atFirstPoll = { spent: l.spentCents(), job: l.jobs.get(keyOf(a)) };
      return ready;
    });
    const t = await runImages({
      items: [a],
      ledger: l,
      provider: bflImage({ apiKey: 'k', fetchImpl, sleep: noSleep }),
      outDir: join(dir, 'img'),
      batchId: 'b',
      sleep: noSleep,
    });
    expect(t.done).toBe(1);
    expect(seen.submits).toBe(1);
    expect(atFirstPoll.spent).toBe(6);
    expect(atFirstPoll.job.submitted).toMatchObject({ id: 'job1', pollingUrl: 'https://poll/job1' });
    expect(l.spentCents()).toBe(6);
  });

  it('(a) a run killed after BFL returned the picture is replayed by polling the same job, not by buying it again', async () => {
    const l = ledger();
    const [a] = items;
    goodRecord(l, a);
    const killed = join(dir, 'killed');
    // Run 1: BFL finishes; the runner dies before the ledger records success.
    const run1 = fakeBfl(() => {
      rmSync(killed, { recursive: true, force: true });
      cpSync(join(dir, 'state'), killed, { recursive: true });
      return ready;
    });
    await runImages({
      items: [a],
      ledger: l,
      provider: bflImage({ apiKey: 'k', fetchImpl: run1.fetchImpl, sleep: noSleep }),
      outDir: join(dir, 'img'),
      batchId: 'b',
      sleep: noSleep,
    });
    // Run 2 opens the ledger as the kill left it, after the 10-minute lease.
    const l2 = new Ledger(killed, { clock: () => Date.now() + 11 * 60 * 1000 });
    const run2 = fakeBfl(() => ready);
    const t = await runImages({
      items: [a],
      ledger: l2,
      provider: bflImage({ apiKey: 'k', fetchImpl: run2.fetchImpl, sleep: noSleep }),
      outDir: join(dir, 'img2'),
      batchId: 'b',
      sleep: noSleep,
    });
    expect(t.done).toBe(1);
    expect(run2.seen.submits).toBe(0);
    expect(run2.seen.polls).toEqual(['https://poll/job1']);
    expect(l2.spentCents()).toBe(6);
  });

  it('(c) a poll that times out resumes the same BFL job id on the retry, with no second submit', async () => {
    const l = ledger();
    const [a] = items;
    goodRecord(l, a);
    const { seen, fetchImpl } = fakeBfl((url, n, signal) =>
      n === 1 ? new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))) : ready
    );
    const t = await runImages({
      items: [a],
      ledger: l,
      provider: bflImage({ apiKey: 'k', fetchImpl, sleep: noSleep }),
      outDir: join(dir, 'img'),
      batchId: 'b',
      timeoutMs: 30,
      sleep: noSleep,
    });
    expect(t.done).toBe(1);
    expect(seen.submits).toBe(1);
    expect(seen.polls).toEqual(['https://poll/job1', 'https://poll/job1']);
    expect(l.spentCents()).toBe(6);
  });

  it('(c) the poll limit is a retry of the same job too, and a later run resumes it', async () => {
    const l = ledger();
    const [a] = items;
    goodRecord(l, a);
    const { seen, fetchImpl } = fakeBfl(() => pending);
    const t = await runImages({
      items: [a],
      ledger: l,
      provider: bflImage({ apiKey: 'k', fetchImpl, sleep: noSleep, maxPolls: 2 }),
      outDir: join(dir, 'img'),
      batchId: 'b',
      sleep: noSleep,
    });
    expect(t.failed).toBe(1);
    expect(seen.submits).toBe(1);
    expect(new Set(seen.polls)).toEqual(new Set(['https://poll/job1']));
    expect(l.spentCents()).toBe(6);
    const next = fakeBfl(() => ready);
    const t2 = await runImages({
      items: [a],
      ledger: l,
      provider: bflImage({ apiKey: 'k', fetchImpl: next.fetchImpl, sleep: noSleep }),
      outDir: join(dir, 'img'),
      batchId: 'b',
      sleep: noSleep,
    });
    expect(t2.done).toBe(1);
    expect(next.seen.submits).toBe(0);
    expect(l.spentCents()).toBe(6);
  });

  it('only an EXPIRED job is bought anew, and the earlier charge still counts', async () => {
    const l = ledger();
    const [a] = items;
    goodRecord(l, a);
    l.write({
      batchId: 'b',
      courseKey: a.courseKey,
      lessonId: a.lessonId,
      kind: 'image',
      contentSha: a.contentSha,
      idempotencyKey: keyOf(a),
      state: 'failed',
      attempts: 1,
      costCents: 6,
      submitted: { id: 'old', pollingUrl: 'https://poll/old' },
    });
    const { seen, fetchImpl } = fakeBfl((url) => (url === 'https://poll/old' ? { ok: false, status: 404, text: async () => 'Task not found' } : ready));
    const t = await runImages({
      items: [a],
      ledger: l,
      provider: bflImage({ apiKey: 'k', fetchImpl, sleep: noSleep }),
      outDir: join(dir, 'img'),
      batchId: 'b',
      sleep: noSleep,
    });
    expect(t.done).toBe(1);
    expect(seen.polls[0]).toBe('https://poll/old');
    expect(seen.submits).toBe(1);
    expect(l.spentCents()).toBe(12);
  });

  it('(b) a lost runner: the newest part save is merged over an older full ledger, never over a newer one', () => {
    const root = join(dir, 'lp');
    const put = (p, s) => {
      mkdirSync(join(root, p, '..'), { recursive: true });
      writeFileSync(join(root, p), s);
    };
    put('state/jobs.jsonl', 'old\n');
    put('outbox/c/x.jpg', 'X');
    savePart(root, 200);
    put('state/jobs.jsonl', 'older-full\n');
    rmSync(join(root, 'outbox'), { recursive: true });
    expect(recoverPart(root, 'learn-presentation-ledger-100')).toMatchObject({ recovered: true, partRun: 200, ledgerRun: 100 });
    expect(readFileSync(join(root, 'state/jobs.jsonl'), 'utf8')).toBe('old\n');
    expect(readFileSync(join(root, 'images/c/x.jpg'), 'utf8')).toBe('X');
    expect(readFileSync(join(root, 'outbox/c/x.jpg'), 'utf8')).toBe('X');
    expect(existsSync(join(root, 'part'))).toBe(false);
    savePart(root, 200);
    put('state/jobs.jsonl', 'full-200\n');
    expect(recoverPart(root, 'learn-presentation-ledger-200').recovered).toBe(false);
    expect(readFileSync(join(root, 'state/jobs.jsonl'), 'utf8')).toBe('full-200\n');
  });
});

// Owner 2026-11-25: six generated titles were flagged needs-review (drafts, so no
// picture was ever bought). The owner decided their titles; title-decisions.json
// makes those decisions authoritative without buying a new title.
describe('the owner title decisions are authoritative (title-decisions.json)', () => {
  const DECISIONS_PATH = join(process.cwd(), 'scripts/learn-presentation/title-decisions.json');
  let dec;
  let file;
  let realItems;
  let realCourses;
  beforeEach(async () => {
    dec = await import('../../scripts/learn-presentation/lib/decisions.mjs');
    file = JSON.parse(readFileSync(DECISIONS_PATH, 'utf8'));
    const { learnInventory } = await import('../lib/learn-presentation/integrity.js');
    const inventory = learnInventory();
    realCourses = coursesForValidation(inventory);
    const want = new Set(file.decisions.map((d) => `${d.courseKey}::${d.lessonId}`));
    realItems = buildItems(inventory).filter((it) => want.has(`${it.courseKey}::${it.lessonId}`));
  });

  // The ledger as the library run left it: each lesson a flagged draft with its
  // text job parked needs-review (2c already spent on it).
  const seedDrafts = (l) => {
    for (const it of realItems) {
      const inf8 = it.lessonId === 'inf8-church-stack';
      const ll88 = it.lessonId.startsWith('ll88-');
      l.putRecord({
        lessonId: it.lessonId,
        courseKey: it.courseKey,
        originalTitleAtApproval: it.originalTitle,
        displayTitle: `Generated title for ${it.lessonId}`,
        thumbHeadline: 'GENERATED HEADLINE',
        promoDescription: inf8 ? 'How The Church of the Living God gets its own stack, a gift from Yahweh.' : 'What the lesson teaches about Yahweh.',
        visual: {
          prompt: ll88
            ? 'A Black woman in a sunlit garden sifting dark, crumbly soil, bright natural daylight.'
            : 'A bright daylight photograph of a smiling Black family at a sunny kitchen table.',
          alt: 'A smiling Black family.',
        },
        image: null,
        status: 'draft',
        featured: false,
        validation: ['flagged'],
        contentSha: it.contentSha,
      });
      l.write({
        batchId: 'library-v1',
        courseKey: it.courseKey,
        lessonId: it.lessonId,
        kind: 'text',
        contentSha: it.contentSha,
        idempotencyKey: idempotencyKey({ batchId: 'library-v1', ...it, kind: 'text' }),
        state: 'needs-review',
        attempts: 1,
        costCents: 2,
        leaseUntil: null,
        lastError: 'flagged',
      });
    }
  };

  it('the file is valid, names the six real lessons, and their original titles are unchanged', () => {
    expect(dec.validateDecisions(file)).toEqual([]);
    expect(file.decisions).toHaveLength(6);
    expect(realItems).toHaveLength(6);
    for (const d of file.decisions) {
      const it = realItems.find((x) => x.lessonId === d.lessonId);
      expect(d.originalTitle).toBe(it.originalTitle);
    }
  });

  it('the decided titles are used verbatim, the records pass as review, and the export carries no needsReview', () => {
    const l = ledger();
    seedDrafts(l);
    const out = dec.applyDecisions(l, file, { courses: realCourses });
    expect(out).toEqual({ applied: file.decisions.map(dec.decisionKey), held: [], waiting: [] });
    for (const d of file.decisions) {
      const r = l.getRecord(d.courseKey, d.lessonId);
      expect(r.displayTitle).toBe(d.displayTitle);
      expect(r.thumbHeadline).toBe(d.thumbHeadline);
      expect(r.status).toBe('review');
      expect(r.validation).toEqual([]);
      expect(r.decision).toMatchObject({ by: file.owner, date: '2026-11-25' });
    }
    const rec = (id) => Object.values(l.records).find((r) => r.lessonId.startsWith(id));
    expect(rec('ll27-').promoDescription).not.toMatch(/\bGod\b/);
    expect(rec('ll73-').promoDescription).not.toMatch(/\bGod\b/);
    expect(rec('inf8-').promoDescription).toMatch(/The Church of the Living God/); // the church's proper name stays
    expect(rec('ll88-').visual.prompt).not.toMatch(/\bdark\b/);
    const exported = exportRecords(l).records;
    expect(exported).toHaveLength(6);
    for (const r of exported) {
      expect(r.status).toBe('review');
      expect(r.needsReview).toBeUndefined();
    }
  });

  it('no title is bought for a decided lesson, and its picture is bought in the normal batch', async () => {
    const l = ledger();
    seedDrafts(l);
    dec.applyDecisions(l, file, { courses: realCourses });
    const spentBefore = l.spentCents();
    const p = mockText(() => {
      throw new Error('a decided lesson must never reach the text provider');
    });
    const t = await runText({
      items: realItems,
      ledger: l,
      provider: p,
      courses: realCourses,
      batchId: 'library-v1',
      concurrency: 1,
      sleep: noSleep,
      decided: dec.decidedKeys(file),
    });
    expect(p.calls.length).toBe(0);
    expect(t).toMatchObject({ decided: 6, done: 0, failed: 0 });
    expect(l.spentCents()).toBe(spentBefore); // closing the text job carries its 2c, adds nothing
    // Without the decided set the ledger still says the title is finished.
    const t2 = await runText({ items: realItems, ledger: l, provider: p, courses: realCourses, batchId: 'library-v1', concurrency: 1, sleep: noSleep });
    expect(p.calls.length).toBe(0);
    expect(t2.skipped).toBe(6);
    const { nextLibraryBatch } = await import('../../scripts/learn-presentation/lib/scope.mjs');
    expect(nextLibraryBatch(realItems, l, 200)).toHaveLength(6); // only the pictures remain
    const img = mockImage();
    const ti = await runImages({
      items: realItems,
      ledger: l,
      provider: img,
      outDir: mkdtempSync(join(tmpdir(), 'img-')),
      batchId: 'library-v1',
      concurrency: 1,
      sleep: noSleep,
    });
    expect(img.calls).toBe(6);
    expect(ti).toMatchObject({ done: 6, waiting: 0 });
    expect(nextLibraryBatch(realItems, l, 200)).toHaveLength(0);
  });

  it('re-applying is a no-op on the ledger', () => {
    const l = ledger();
    seedDrafts(l);
    dec.applyDecisions(l, file, { courses: realCourses });
    const rows = l.seq;
    const records = JSON.stringify(l.records);
    dec.applyDecisions(l, file, { courses: realCourses });
    expect(l.seq).toBe(rows);
    expect(JSON.stringify(l.records)).toBe(records);
  });

  it('a decision never clears a duplicate title or a picture-prompt rule (proven to catch)', () => {
    const l = ledger();
    seedDrafts(l);
    const d0 = file.decisions[0];
    l.putRecord({ lessonId: 'other', courseKey: 'other', displayTitle: d0.displayTitle, status: 'review' });
    const dark = { ...file, decisions: file.decisions.map((d) => (d.lessonId.startsWith('ll88-') ? { ...d, imagePrompt: 'A Black woman at night.' } : d)) };
    const out = dec.applyDecisions(l, dark, { courses: realCourses });
    expect(out.held).toEqual([dec.decisionKey(d0), dec.decisionKey(dark.decisions.find((d) => d.lessonId.startsWith('ll88-')))]);
    expect(l.getRecord(d0.courseKey, d0.lessonId)).toMatchObject({ status: 'draft' });
    expect(l.getRecord(d0.courseKey, d0.lessonId).validation.join(' ')).toMatch(/duplicate-display-title/);
    expect(
      dec.validateDecisions({ ...file, decisions: [{ ...d0, overrides: [{ code: 'duplicate-display-title', field: 'displayTitle', reason: 'x' }] }] }).join(' ')
    ).toMatch(/cannot be overridden/);
    // Without its override, inf8's proper church name is still flagged (the override is what clears it).
    const bare = { ...file, decisions: file.decisions.map((d) => ({ ...d, overrides: [] })) };
    const l2 = new Ledger(join(dir, 'state2'));
    seedDrafts(l2);
    const inf8 = dec.decisionKey(file.decisions.find((d) => d.lessonId === 'inf8-church-stack'));
    expect(dec.applyDecisions(l2, bare, { courses: realCourses }).held).toEqual([inf8]);
    expect(l2.getRecord('infrastructure', 'inf8-church-stack').validation.join(' ')).toMatch(/generic-god \(promoDescription/);
  });

  it('the committed presentation records carry the decided text for inf1, inf8 and ll27', () => {
    const committed = JSON.parse(readFileSync(join(process.cwd(), 'src/lib/learn-presentation/presentation-records.json'), 'utf8')).records;
    for (const id of ['inf1-what-is-sovereign', 'inf8-church-stack', 'll27-the-god-who-documents-his-grief']) {
      const d = file.decisions.find((x) => x.lessonId === id);
      const r = committed.find((x) => x.lessonId === id);
      expect(r).toMatchObject({ displayTitle: d.displayTitle, thumbHeadline: d.thumbHeadline, status: 'review' });
      if (d.promoDescription) expect(r.promoDescription).toBe(d.promoDescription);
      expect(r.needsReview).toBeUndefined();
    }
  });
});
